# Resend — Status da Integração (STANDBY)

> Estado congelado enquanto o main thread confirma domínio/SMTP. Nada foi deployado. Nenhum código em `src/` foi tocado.

## Onde estamos

- **App**: "Controle de Edição" (Agência F3F). Supabase project `ulikfkemdawinetjyhok`, schema custom `controle_edicao`. Login via Supabase Auth (email/senha).
- **Edge function pronta**: `supabase/functions/send-email/index.ts` — POST na API do Resend, lê env `RESEND_API_KEY` / `RESEND_FROM`. Ainda **não** deployada.
- **Doc de setup**: `supabase/RESEND_SETUP.md` (os dois caminhos A/B).
- **API key**: a chave restrita fornecida pelo user (RESTRITA / escopada a domínio — **segredo, não commitar em lugar nenhum**).

## BLOCKER (único)

A chave restrita está **escopada a um domínio verificado específico** que ainda não identificamos.

- Test-send de `onboarding@resend.dev` → **403 error 1010**.
- Test-send de `*@agenciaf3f.com.br` → **403 error 1010**.
- User confirma que existe um domínio verificado no Resend (usado em outro projeto), mas **não passou o sender/domínio exato**.

➡️ **Preciso do sender/domínio verificado exato** ao qual a chave dá permissão de envio (ex.: `noreply@<dominio-verificado>`). Sem isso todo envio retorna 1010.

## Passos restantes (quando desbloquear)

1. **Confirmar sender** verificado (domínio exato ao qual a chave é escopada).
2. **Test-send** via API do Resend com esse `from` → esperar `200` + `id` (não mais 1010).
3. **Caminho A (SMTP, sem código)** — Supabase Dashboard → Authentication → SMTP Settings → Enable custom SMTP:
   - Host `smtp.resend.com` · Port `465` · User `resend` · Password = a chave restrita
   - Sender email `noreply@<dominio-verificado>` · Sender name `Agência F3F`
4. **Verificar fluxo "Esqueci minha senha"** ponta-a-ponta: dispara reset → email chega pelo Resend → link reseta a senha.
5. **(Depois) Caminho B** — ligar convite de editor no `send-email`:
   - `supabase secrets set RESEND_API_KEY=<chave restrita>` e `RESEND_FROM="Agência F3F <noreply@<dominio-verificado>>"`
   - `supabase functions deploy send-email`
   - **Travar pra ADMIN** (checar JWT do chamador) antes de habilitar no fluxo de convite.
   - Usar o template de `supabase/functions/send-email/templates.md`.

## Notas

- Caminho A já resolve o reset de senha sozinho (sem deploy de função).
- A chave nunca deve entrar em arquivo do repo — só nos secrets do Supabase / campo SMTP do dashboard.
