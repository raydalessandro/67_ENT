// ============================================================================
// 67 Hub — Admin: Manage Artists Edge Function
// Deploy: Supabase Dashboard → Edge Functions → "admin-artists"
// No extra secrets needed (uses SUPABASE_SERVICE_ROLE_KEY already available)
// ============================================================================

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateArtistRequest {
  action: "create";
  email: string;
  password: string;
  display_name: string;
  artist_name: string;
  color: string;
  bio?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  youtube_handle?: string;
  spotify_url?: string;
}

interface UpdateArtistRequest {
  action: "update";
  artist_id: string;
  artist_name?: string;
  color?: string;
  bio?: string;
  instagram_handle?: string;
  tiktok_handle?: string;
  youtube_handle?: string;
  spotify_url?: string;
  is_active?: boolean;
}

interface ResetPasswordRequest {
  action: "reset_password";
  user_id: string;
  new_password: string;
}

interface DeleteArtistRequest {
  action: "delete";
  artist_id: string;
  user_id: string;
}

interface ToggleAIRequest {
  action: "toggle_ai";
  artist_id: string;
  enabled: boolean;
}

interface ListArtistsRequest {
  action: "list";
}

type AdminRequest =
  | CreateArtistRequest
  | UpdateArtistRequest
  | ResetPasswordRequest
  | DeleteArtistRequest
  | ToggleAIRequest
  | ListArtistsRequest;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth: verify caller is staff ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse(401, "Missing authorization");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller with their JWT
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !caller) {
      return errorResponse(401, "Invalid token");
    }

    // Service client for admin operations
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // Check caller is staff
    const { data: callerProfile } = await admin
      .from("users")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || !["admin", "manager"].includes(callerProfile.role)) {
      return errorResponse(403, "Staff access required");
    }

    // ── Route by action ──
    const body: AdminRequest = await req.json();

    switch (body.action) {
      case "create":
        return await handleCreate(admin, body);
      case "update":
        return await handleUpdate(admin, body);
      case "reset_password":
        return await handleResetPassword(admin, body);
      case "delete":
        return await handleDelete(admin, body);
      case "toggle_ai":
        return await handleToggleAI(admin, body as ToggleAIRequest);
      case "list":
        return await handleList(admin);
      default:
        return errorResponse(400, "Invalid action");
    }
  } catch (err) {
    console.error("Admin Edge Function error:", err);
    return errorResponse(500, "Internal error");
  }
});

// ── CREATE: auth user + users row + artists row + ai_agent_config ──

async function handleCreate(admin: any, body: CreateArtistRequest) {
  const { email, password, display_name, artist_name, color } = body;

  if (!email || !password || !display_name || !artist_name || !color) {
    return errorResponse(400, "Missing required fields: email, password, display_name, artist_name, color");
  }

  if (password.length < 6) {
    return errorResponse(400, "Password must be at least 6 characters");
  }

  // 1. Create auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification
  });

  if (authError) {
    if (authError.message?.includes("already been registered")) {
      return errorResponse(409, "Email già registrata");
    }
    console.error("Auth create error:", authError);
    return errorResponse(500, "Failed to create auth user: " + authError.message);
  }

  const userId = authData.user.id;

  try {
    // 2. Create users profile
    const { error: userError } = await admin.from("users").insert({
      id: userId,
      email,
      display_name,
      role: "artist",
    });

    if (userError) throw userError;

    // 3. Create artist profile
    const { data: artistData, error: artistError } = await admin
      .from("artists")
      .insert({
        user_id: userId,
        name: artist_name,
        color,
        bio: body.bio ?? null,
        instagram_handle: body.instagram_handle ?? null,
        tiktok_handle: body.tiktok_handle ?? null,
        youtube_handle: body.youtube_handle ?? null,
        spotify_url: body.spotify_url ?? null,
        is_active: true,
      })
      .select("id")
      .single();

    if (artistError) throw artistError;

    // 4. Create default AI agent config
    await admin.from("ai_agent_configs").insert({
      artist_id: artistData.id,
      is_enabled: true,
      model_name: "deepseek-chat",
      temperature: 0.7,
      max_tokens: 1000,
      daily_message_limit: 20,
      system_prompt: null, // will use default from Edge Function
      context_notes: null,
    }).catch(() => {
      // Non-critical, can be added later
    });

    return jsonResponse({
      success: true,
      user_id: userId,
      artist_id: artistData.id,
      credentials: { email, password },
      message: `Artista "${artist_name}" creato. Invia le credenziali su WhatsApp.`,
    });
  } catch (err) {
    // Rollback: delete auth user if DB inserts fail
    await admin.auth.admin.deleteUser(userId);
    console.error("DB insert error, rolled back auth user:", err);
    return errorResponse(500, "Failed to create artist profile");
  }
}

// ── UPDATE: artist profile ──

async function handleUpdate(admin: any, body: UpdateArtistRequest) {
  const { artist_id, ...updates } = body;
  const { action, ...cleanUpdates } = updates as any;

  if (!artist_id) {
    return errorResponse(400, "artist_id required");
  }

  // Remove undefined values
  const fields: Record<string, any> = {};
  if (body.artist_name !== undefined) fields.name = body.artist_name;
  if (body.color !== undefined) fields.color = body.color;
  if (body.bio !== undefined) fields.bio = body.bio;
  if (body.instagram_handle !== undefined) fields.instagram_handle = body.instagram_handle;
  if (body.tiktok_handle !== undefined) fields.tiktok_handle = body.tiktok_handle;
  if (body.youtube_handle !== undefined) fields.youtube_handle = body.youtube_handle;
  if (body.spotify_url !== undefined) fields.spotify_url = body.spotify_url;
  if (body.is_active !== undefined) fields.is_active = body.is_active;

  const { error } = await admin
    .from("artists")
    .update(fields)
    .eq("id", artist_id);

  if (error) {
    return errorResponse(500, "Failed to update artist");
  }

  return jsonResponse({ success: true, message: "Artista aggiornato" });
}

// ── RESET PASSWORD ──

async function handleResetPassword(admin: any, body: ResetPasswordRequest) {
  if (!body.user_id || !body.new_password) {
    return errorResponse(400, "user_id and new_password required");
  }

  if (body.new_password.length < 6) {
    return errorResponse(400, "Password must be at least 6 characters");
  }

  const { error } = await admin.auth.admin.updateUserById(body.user_id, {
    password: body.new_password,
  });

  if (error) {
    return errorResponse(500, "Failed to reset password");
  }

  return jsonResponse({ success: true, message: "Password aggiornata" });
}

// ── DELETE: deactivate (soft) or full delete ──

async function handleDelete(admin: any, body: DeleteArtistRequest) {
  if (!body.artist_id || !body.user_id) {
    return errorResponse(400, "artist_id and user_id required");
  }

  // Soft delete: deactivate artist
  await admin.from("artists").update({ is_active: false }).eq("id", body.artist_id);

  // Hard delete auth user (they can't login anymore)
  await admin.auth.admin.deleteUser(body.user_id);

  // Remove users row
  await admin.from("users").delete().eq("id", body.user_id);

  return jsonResponse({ success: true, message: "Artista rimosso" });
}

// ── TOGGLE AI: enable/disable AI for an artist ──

async function handleToggleAI(admin: any, body: ToggleAIRequest) {
  if (!body.artist_id) {
    return errorResponse(400, "artist_id required");
  }

  // Upsert: create config if doesn't exist, update if it does
  const { error } = await admin
    .from("ai_agent_configs")
    .upsert(
      {
        artist_id: body.artist_id,
        is_enabled: body.enabled,
      },
      { onConflict: "artist_id" }
    );

  if (error) {
    return errorResponse(500, "Failed to toggle AI: " + error.message);
  }

  return jsonResponse({
    success: true,
    message: body.enabled ? "AI attivata" : "AI disattivata",
  });
}

// ── LIST: all artists with user info + AI status ──

async function handleList(admin: any) {
  const { data, error } = await admin
    .from("artists")
    .select(`
      id,
      name,
      color,
      bio,
      instagram_handle,
      tiktok_handle,
      youtube_handle,
      spotify_url,
      is_active,
      created_at,
      user_id,
      users!artists_user_id_fkey (
        email,
        display_name
      ),
      ai_agent_configs (
        is_enabled
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return errorResponse(500, "Failed to list artists");
  }

  // Flatten ai_enabled from nested relation
  const artists = (data ?? []).map((a: any) => ({
    ...a,
    ai_enabled: a.ai_agent_configs?.[0]?.is_enabled ?? false,
    ai_agent_configs: undefined,
  }));

  return jsonResponse({ artists });
}

// ── Helpers ──

function jsonResponse(data: any): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
