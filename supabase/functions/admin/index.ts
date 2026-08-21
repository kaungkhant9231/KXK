// ============================================================
// Supabase Edge Function — "admin"
// Admin panel အတွက် service-role operations:
//   { action: "listUsers" }            → user အကုန်စာရင်း (email/status ပါ)
//   { action: "deleteUser", id }       → user + သူ့ဒေတာ ဖျက်
//
// Security: caller ရဲ့ JWT ကို verify လုပ်ပြီး profiles.is_admin
// ဖြစ်မှသာ လုပ်ခွင့်ပေးတယ်။ Service role key က server မှာပဲ ရှိတယ်။
//
// Deploy နည်း: SUPABASE-SETUP-V2.md Step 3 ကြည့်ပါ
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    // 1) Caller ကို စစ်ပါ — logged in + is_admin ဖြစ်ရမယ်
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "not logged in" }, 401);

    const { data: { user }, error: ue } = await admin.auth.getUser(token);
    if (ue || !user) return json({ error: "invalid token" }, 401);

    const { data: profile } = await admin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) return json({ error: "forbidden" }, 403);

    // 2) Actions
    const body = await req.json();

    if (body.action === "listUsers") {
      const { data: { users }, error } = await admin.auth.admin.listUsers({
        perPage: 200,
      });
      if (error) return json({ error: error.message }, 500);

      const ids = users.map((u) => u.id);
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, username, display_name, avatar_url, is_admin, is_banned")
        .in("id", ids.length ? ids : [""]);
      const pMap = new Map((profiles || []).map((p) => [p.id, p]));

      const list = users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        confirmed_at: u.confirmed_at,
        banned_until: u.banned_until,
        last_sign_in_at: u.last_sign_in_at,
        profile: pMap.get(u.id) || null,
      }));

      return json({ users: list }, 200);
    }

    if (body.action === "deleteUser") {
      if (!body.id) return json({ error: "missing id" }, 400);
      const { error } = await admin.auth.admin.deleteUser(body.id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true }, 200);
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
