// ============================================================================
// 67 Hub — AI Chat Edge Function
// Deploy: Supabase Dashboard → Edge Functions → New Function → "ai-chat"
// Secret: DEEPSEEK_API_KEY (set in Dashboard → Edge Functions → Secrets)
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  artist_id?: string; // optional override, otherwise from JWT
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse(401, "Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const deepseekKey = Deno.env.get("DEEPSEEK_API_KEY");

    if (!deepseekKey) {
      return errorResponse(500, "DEEPSEEK_API_KEY not configured");
    }

    // Client with user's JWT (respects RLS)
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client (bypasses RLS for admin operations)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return errorResponse(401, "Invalid token");
    }

    // ── Get artist profile ──
    const { data: artist } = await supabaseAdmin
      .from("artists")
      .select("id, name, user_id")
      .eq("user_id", user.id)
      .single();

    if (!artist) {
      return errorResponse(403, "Artist profile not found");
    }

    // ── Parse request ──
    const body: ChatRequest = await req.json();
    const message = body.message?.trim();

    if (!message) {
      return errorResponse(400, "Message is required");
    }

    if (message.length > 2000) {
      return errorResponse(400, "Message too long (max 2000 chars)");
    }

    // ── Check agent config ──
    const { data: config } = await supabaseAdmin
      .from("ai_agent_configs")
      .select("*")
      .eq("artist_id", artist.id)
      .single();

    if (!config || !config.is_enabled) {
      return errorResponse(403, "AI agent not enabled for this artist", "AI_AGENT_DISABLED");
    }

    // ── Rate limiting: check daily usage ──
    const today = new Date().toISOString().split("T")[0];

    const { data: usage } = await supabaseAdmin
      .from("ai_daily_usage")
      .select("messages_used")
      .eq("artist_id", artist.id)
      .eq("usage_date", today)
      .single();

    const usedToday = usage?.messages_used ?? 0;
    const dailyLimit = config.daily_message_limit ?? 20;

    if (usedToday >= dailyLimit) {
      return errorResponse(429, "Daily message limit reached", "AI_DAILY_LIMIT");
    }

    // ── Get or create today's session ──
    let { data: session } = await supabaseAdmin
      .from("ai_chat_sessions")
      .select("id")
      .eq("artist_id", artist.id)
      .gte("created_at", `${today}T00:00:00Z`)
      .lt("created_at", `${today}T23:59:59Z`)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!session) {
      const { data: newSession, error: sessionError } = await supabaseAdmin
        .from("ai_chat_sessions")
        .insert({
          artist_id: artist.id,
          context_date: today,
        })
        .select("id")
        .single();

      if (sessionError) {
        return errorResponse(500, "Failed to create session");
      }
      session = newSession;
    }

    // ── Build conversation history (today's context window) ──
    const { data: history } = await supabaseAdmin
      .from("ai_chat_messages")
      .select("role, content")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true })
      .limit(40); // last 40 messages for context

    const messages = [
      {
        role: "system",
        content: buildSystemPrompt(config, artist.name),
      },
      ...(history ?? []).map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      {
        role: "user",
        content: message,
      },
    ];

    // ── Call DeepSeek API ──
    const startTime = Date.now();

    const aiResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${deepseekKey}`,
      },
      body: JSON.stringify({
        model: config.model_name ?? "deepseek-chat",
        messages,
        temperature: config.temperature ?? 0.7,
        max_tokens: config.max_tokens ?? 1000,
        stream: false,
      }),
    });

    const responseTimeMs = Date.now() - startTime;

    if (!aiResponse.ok) {
      const errBody = await aiResponse.text();
      console.error("DeepSeek API error:", aiResponse.status, errBody);
      return errorResponse(502, "AI service error", "AI_SERVICE_ERROR");
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content ?? "Mi dispiace, non riesco a rispondere al momento.";
    const tokensUsed = aiData.usage?.total_tokens ?? null;

    // ── Save messages to DB ──
    await supabaseAdmin.from("ai_chat_messages").insert([
      {
        session_id: session.id,
        role: "user",
        content: message,
      },
      {
        session_id: session.id,
        role: "assistant",
        content: assistantMessage,
        tokens_used: tokensUsed,
        model_used: config.model_name ?? "deepseek-chat",
        response_time_ms: responseTimeMs,
      },
    ]);

    // ── Update daily usage ──
    await supabaseAdmin.rpc("increment_daily_usage", {
      p_artist_id: artist.id,
      p_date: today,
    }).catch(async () => {
      // Fallback: upsert if RPC doesn't exist
      await supabaseAdmin
        .from("ai_daily_usage")
        .upsert(
          {
            artist_id: artist.id,
            usage_date: today,
            messages_used: usedToday + 1,
          },
          { onConflict: "artist_id,usage_date" }
        );
    });

    // ── Update session metadata ──
    await supabaseAdmin
      .from("ai_chat_sessions")
      .update({
        message_count: (history?.length ?? 0) + 2,
        total_tokens: (aiData.usage?.total_tokens ?? 0),
        last_message_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    // ── Response ──
    return new Response(
      JSON.stringify({
        message: assistantMessage,
        session_id: session.id,
        usage: {
          daily_limit: dailyLimit,
          used_today: usedToday + 1,
          remaining: dailyLimit - usedToday - 1,
        },
        meta: {
          tokens: tokensUsed,
          response_time_ms: responseTimeMs,
          model: config.model_name ?? "deepseek-chat",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Edge Function error:", err);
    return errorResponse(500, "Internal error");
  }
});

// ── Helpers ──

function buildSystemPrompt(config: any, artistName: string): string {
  const base = config.system_prompt ??
    `Sei l'assistente AI personale di ${artistName}, un artista dell'etichetta 67 Entertainment.

Il tuo ruolo:
- Fornire consulenza strategica sui social media
- Aiutare con idee per contenuti, caption, hashtags
- Consigliare sulle best practice per Instagram, TikTok, YouTube
- Supportare la pianificazione editoriale
- Rispondere in italiano, in modo amichevole e professionale

Regole:
- Rispondi sempre in italiano
- Sii conciso ma utile
- Personalizza i consigli per l'artista
- Non inventare dati o statistiche
- Se non sai qualcosa, dillo onestamente`;

  const context = config.context_notes
    ? `\n\nContesto aggiuntivo sull'artista:\n${config.context_notes}`
    : "";

  return base + context;
}

function errorResponse(
  status: number,
  message: string,
  code?: string
): Response {
  return new Response(
    JSON.stringify({ error: message, code: code ?? "UNKNOWN" }),
    {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
