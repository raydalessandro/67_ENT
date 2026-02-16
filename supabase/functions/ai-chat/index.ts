// ============================================================================
// 67 Hub — AI Chat Edge Function (Fixed schema alignment)
// ============================================================================

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Content-Type": "application/json",
  };
  const json = (data: any, s = 200) => new Response(JSON.stringify(data), { status: s, headers: cors });
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "No auth", code: "UNAUTHORIZED" }, 401);

    const URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const DEEPSEEK_KEY = Deno.env.get("DEEPSEEK_API_KEY");

    if (!DEEPSEEK_KEY) return json({ error: "DEEPSEEK_API_KEY not configured", code: "AI_SERVICE_ERROR" }, 500);

    // Helper: Supabase REST
    const rest = async (path: string, opts: any = {}) => {
      const r = await fetch(`${URL}/rest/v1/${path}`, {
        method: opts.method ?? "GET",
        headers: {
          "apikey": SERVICE,
          "Authorization": `Bearer ${SERVICE}`,
          "Content-Type": "application/json",
          "Prefer": opts.prefer ?? "return=representation",
          ...opts.headers,
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
      const text = await r.text();
      try { return { data: JSON.parse(text), status: r.status }; } catch { return { data: text, status: r.status }; }
    };

    // Helper: Supabase RPC
    const rpc = async (fn: string, params: any) => {
      const r = await fetch(`${URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers: {
          "apikey": SERVICE,
          "Authorization": `Bearer ${SERVICE}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      const text = await r.text();
      try { return { data: JSON.parse(text), status: r.status }; } catch { return { data: text, status: r.status }; }
    };

    // Verify caller
    const meResp = await fetch(`${URL}/auth/v1/user`, {
      headers: { "apikey": ANON, "Authorization": auth },
    });
    if (!meResp.ok) return json({ error: "Invalid token", code: "UNAUTHORIZED" }, 401);
    const me = await meResp.json();

    // Get artist profile
    const artistResp = await rest(`artists?user_id=eq.${me.id}&select=id,name`);
    const artist = artistResp.data?.[0];
    if (!artist) return json({ error: "Artist profile not found", code: "NOT_AN_ARTIST" }, 403);

    // Parse request
    const body = await req.json();
    const message = body.message?.trim();
    if (!message) return json({ error: "Message is required", code: "MESSAGE_REQUIRED" }, 400);
    if (message.length > 2000) return json({ error: "Message too long", code: "MESSAGE_TOO_LONG" }, 400);

    // Get agent config (uses correct column name: model, not model_name)
    const configResp = await rest(`ai_agent_configs?artist_id=eq.${artist.id}&select=*`);
    const config = configResp.data?.[0];
    if (!config || !config.is_enabled) return json({ error: "AI agent not enabled", code: "AI_AGENT_DISABLED" }, 403);

    // Rate limiting — uses user_id and message_count (actual DB columns)
    const today = new Date().toISOString().split("T")[0];
    const usageResp = await rest(`ai_daily_usage?user_id=eq.${me.id}&usage_date=eq.${today}&select=message_count`);
    const usedToday = usageResp.data?.[0]?.message_count ?? 0;
    const dailyLimit = config.daily_message_limit ?? 20;

    if (usedToday >= dailyLimit) {
      return json({ error: "Daily message limit reached", code: "AI_DAILY_LIMIT", usage: { daily_limit: dailyLimit, used_today: usedToday, remaining: 0 } }, 429);
    }

    // Get or create session for today
    const sessResp = await rest(`ai_chat_sessions?artist_id=eq.${artist.id}&user_id=eq.${me.id}&created_at=gte.${today}T00:00:00Z&created_at=lt.${today}T23:59:59Z&select=id&order=created_at.desc&limit=1`);
    let sessionId = sessResp.data?.[0]?.id;

    if (!sessionId) {
      const newSess = await rest("ai_chat_sessions", {
        method: "POST",
        body: { artist_id: artist.id, user_id: me.id, title: `Chat ${today}` },
      });
      sessionId = newSess.data?.[0]?.id;
      if (!sessionId) return json({ error: "Failed to create session" }, 500);
    }

    // Load conversation history
    const histResp = await rest(`ai_chat_messages?session_id=eq.${sessionId}&select=role,content&order=created_at.asc&limit=40`);
    const history = histResp.data ?? [];

    // Build messages for DeepSeek
    const systemPrompt = buildSystemPrompt(config, artist.name);
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    // Call DeepSeek (uses correct column: model, not model_name)
    const startTime = Date.now();
    const aiResp = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: config.model ?? "deepseek-chat",
        messages,
        temperature: Number(config.temperature) ?? 0.7,
        max_tokens: config.max_tokens ?? 1024,
        stream: false,
      }),
    });

    const responseTimeMs = Date.now() - startTime;

    if (!aiResp.ok) {
      const err = await aiResp.text();
      console.error("DeepSeek error:", aiResp.status, err);
      return json({ error: "AI service error", code: "AI_SERVICE_ERROR" }, 502);
    }

    const aiData = await aiResp.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content ?? "Mi dispiace, non riesco a rispondere al momento.";
    const tokensUsed = aiData.usage?.total_tokens ?? null;

    // Save messages (uses correct column: model, not model_name)
    await rest("ai_chat_messages", {
      method: "POST",
      body: [
        { session_id: sessionId, role: "user", content: message },
        { session_id: sessionId, role: "assistant", content: assistantMessage, tokens_used: tokensUsed, model_used: config.model ?? "deepseek-chat", response_time_ms: responseTimeMs },
      ],
    });

    // Update daily usage — uses p_user_id (matches fixed RPC signature)
    await rpc("increment_daily_usage", { p_user_id: me.id, p_date: today });

    return json({
      message: assistantMessage,
      session_id: sessionId,
      usage: {
        daily_limit: dailyLimit,
        used_today: usedToday + 1,
        remaining: dailyLimit - usedToday - 1,
      },
      meta: {
        tokens: tokensUsed,
        response_time_ms: responseTimeMs,
        model: config.model ?? "deepseek-chat",
      },
    });
  } catch (e) {
    console.error("Edge Function error:", e);
    return json({ error: String(e), code: "INTERNAL_ERROR" }, 500);
  }
});

// Build system prompt from config (uses 6 prompt_* columns, not system_prompt)
function buildSystemPrompt(config: any, artistName: string): string {
  const sections = [
    config.prompt_identity,
    config.prompt_activity,
    config.prompt_ontology,
    config.prompt_marketing,
    config.prompt_boundaries,
    config.prompt_extra,
  ].filter(Boolean);

  if (sections.length === 0) {
    // Fallback default
    return `Sei l'assistente AI personale di ${artistName}, un artista dell'etichetta 67 Entertainment.

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
  }

  return sections.join("\n\n");
}
