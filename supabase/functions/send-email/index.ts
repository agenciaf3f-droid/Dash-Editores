// Supabase Edge Function: send-email
// Envia email transacional via API do Resend. Primitivo reutilizável
// (convite de editor, notificações, emails custom).
//
// Deploy:  supabase functions deploy send-email
// Secret:  supabase secrets set RESEND_API_KEY=re_xxx  (e RESEND_FROM opcional)
//
// SEGURANÇA: por padrão o Supabase exige JWT válido pra invocar (verify_jwt).
// Ao ligar isto ao fluxo de convite, cheque também se o chamador é ADMIN
// (decodifique o JWT / cruze com a tabela profiles) antes de enviar.

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "Agência F3F <onboarding@resend.dev>";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY não configurada");

    const { to, subject, html, from } = await req.json();
    if (!to || !subject || !html) {
      throw new Error("Campos obrigatórios: to, subject, html");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: from ?? RESEND_FROM, to, subject, html }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? "Falha ao enviar email pelo Resend");

    return new Response(JSON.stringify({ ok: true, id: data.id }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message ?? e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
