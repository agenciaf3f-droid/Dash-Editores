# Setup do Resend (emails)

Dois usos, dois caminhos:

## A) Emails de AUTH (reset de senha, confirmação, convite do Supabase) → SMTP (config, sem código)
Faz os emails que o **Supabase Auth** envia saírem pelo Resend (entrega confiável, sem rate-limit do padrão).

1. **Conta Resend** → https://resend.com → cria conta.
2. **Verifica um domínio** (Resend → Domains → Add) — ex.: `agenciaf3f.com.br` (adiciona os registros DNS que ele pedir no Cloudflare). Sem domínio verificado, só dá pra enviar de `onboarding@resend.dev` (teste).
3. **API key** → Resend → API Keys → Create (guarda `re_...`).
4. **Supabase Dashboard** → Project Settings → **Authentication** → **SMTP Settings** → Enable custom SMTP:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: a **API key** (`re_...`)
   - Sender email: `noreply@teu-dominio-verificado`  ·  Sender name: `Agência F3F`
5. Salva. Pronto — reset de senha e afins passam pelo Resend.

## B) Emails CUSTOM / convite programático → Edge Function `send-email` (o código)
`supabase/functions/send-email/index.ts` chama a API do Resend. Usado pra emails custom e pro fluxo de convidar editores.

1. Instala/loga o Supabase CLI:
   ```bash
   npm i -g supabase
   supabase login
   supabase link --project-ref ulikfkemdawinetjyhok
   ```
2. Secret (a mesma API key):
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxx
   supabase secrets set RESEND_FROM="Agência F3F <noreply@teu-dominio>"
   ```
3. Deploy:
   ```bash
   supabase functions deploy send-email
   ```
4. Invocar (do app, autenticado): `supabase.functions.invoke("send-email", { body: { to, subject, html } })`.

> ⚠️ Ao ligar no convite de editores, trave a função pra só ADMIN (checar o JWT do chamador) antes de enviar.

---
Faz o que der (A já resolve o reset). Me avisa quando o setup estiver feito que eu testo o envio ponta-a-ponta.
