// Supabase Edge Function: invite-editor
// Convida um novo editor por email. Somente ADMIN pode chamar.
// O convite é enviado via SMTP configurado (Resend) pelo próprio Supabase Auth;
// o `data.name` vira o `user_metadata.name` do novo usuário, então o app resolve
// o nome do editor automaticamente (ver src/lib/auth.tsx -> currentEditor).
//
// Deploy:  supabase functions deploy invite-editor
// (SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são injetados automaticamente.)

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ADMIN_EMAILS = new Set(["agenciaf3f@gmail.com"]);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "Content-Type": "application/json" },
    });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Verifica se o chamador é admin.
    const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const {
      data: { user },
    } = await admin.auth.getUser(jwt);
    if (!user || !user.email || !ADMIN_EMAILS.has(user.email.toLowerCase())) {
      return json({ ok: false, error: "Apenas admin pode convidar" }, 403);
    }

    const { email, name, redirectTo } = await req.json();
    if (!email || !name) {
      return json({ ok: false, error: "Campos obrigatórios: email, name" }, 400);
    }

    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { name },
      redirectTo,
    });
    if (error) throw error;

    return json({ ok: true });
  } catch (e) {
    return json({ ok: false, error: String((e as Error)?.message ?? e) }, 400);
  }
});
