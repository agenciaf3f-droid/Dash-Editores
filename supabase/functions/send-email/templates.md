# Templates de email — Agência F3F (referência)

Templates HTML brandados pro `send-email` / Supabase Auth. **Só referência — nada wired ainda.**
Table-based + estilos inline (compat máxima com clientes de email). Cores puxadas do app (`src/index.css`):

| Token        | Hex       | Uso                        |
|--------------|-----------|----------------------------|
| background   | `#0e1116` | fundo do email             |
| card         | `#191d24` | card central               |
| border       | `#272c34` | bordas                     |
| teal/primary | `#24DBC9` | botão CTA, destaque        |
| text         | `#e6eaef` | corpo                      |
| text-muted   | `#8b93a1` | rodapé / secundário        |

Placeholders: `{{TITULO}}`, `{{SAUDACAO}}`, `{{CORPO}}`, `{{CTA_TEXTO}}`, `{{CTA_URL}}`, `{{RODAPE}}`.
No Supabase Auth, a URL do CTA vira `{{ .ConfirmationURL }}` (reset/confirm/invite).

---

## Base (layout reutilizável)

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e1116;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0e1116;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="max-width:600px;width:100%;background:#191d24;border:1px solid #272c34;border-radius:14px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="padding:28px 32px 8px;border-bottom:1px solid #272c34;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="width:36px;height:36px;background:#24DBC9;border-radius:9px;text-align:center;
                       font:700 18px Arial,sans-serif;color:#0e1116;">F3</td>
            <td style="padding-left:12px;font:700 17px Arial,sans-serif;color:#e6eaef;">Controle de Edição</td>
          </tr></table>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:28px 32px 8px;">
          <h1 style="margin:0 0 14px;font:700 22px Arial,sans-serif;color:#e6eaef;">{{TITULO}}</h1>
          <p style="margin:0 0 12px;font:400 15px/1.6 Arial,sans-serif;color:#c3cad4;">{{SAUDACAO}}</p>
          <p style="margin:0 0 24px;font:400 15px/1.6 Arial,sans-serif;color:#c3cad4;">{{CORPO}}</p>
          <!-- CTA -->
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="border-radius:10px;background:#24DBC9;">
              <a href="{{CTA_URL}}" target="_blank"
                 style="display:inline-block;padding:13px 28px;font:700 15px Arial,sans-serif;
                        color:#0e1116;text-decoration:none;border-radius:10px;">{{CTA_TEXTO}}</a>
            </td>
          </tr></table>
          <p style="margin:22px 0 0;font:400 13px/1.5 Arial,sans-serif;color:#8b93a1;">
            Se o botão não funcionar, cole este link no navegador:<br>
            <a href="{{CTA_URL}}" style="color:#24DBC9;word-break:break-all;">{{CTA_URL}}</a>
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px 28px;border-top:1px solid #272c34;">
          <p style="margin:0;font:400 12px/1.5 Arial,sans-serif;color:#8b93a1;">{{RODAPE}}</p>
          <p style="margin:8px 0 0;font:400 12px Arial,sans-serif;color:#5b6472;">Agência F3F · Controle de Edição</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```

---

## Variante A — Reset de senha ("Esqueci minha senha")

Preencher a base com:

- `{{TITULO}}` → `Redefinir sua senha`
- `{{SAUDACAO}}` → `Olá,`
- `{{CORPO}}` → `Recebemos um pedido pra redefinir a senha da sua conta no Controle de Edição. Clique no botão abaixo pra criar uma nova senha. O link expira em 1 hora.`
- `{{CTA_TEXTO}}` → `Redefinir senha`
- `{{CTA_URL}}` → `{{ .ConfirmationURL }}` (Supabase Auth) ou a URL gerada
- `{{RODAPE}}` → `Não pediu isso? Pode ignorar este email — sua senha continua a mesma.`

---

## Variante B — Convite de editor (via `send-email`, futuro)

- `{{TITULO}}` → `Você foi convidado`
- `{{SAUDACAO}}` → `Olá,`
- `{{CORPO}}` → `A Agência F3F te convidou pra colaborar como editor no Controle de Edição. Clique abaixo pra ativar seu acesso e definir sua senha.`
- `{{CTA_TEXTO}}` → `Ativar acesso`
- `{{CTA_URL}}` → URL do convite
- `{{RODAPE}}` → `Este convite é pessoal. Se não esperava por ele, ignore este email.`

---

## Como usar no `send-email` (quando for a hora)

```ts
// monta o html com a base acima (string), troca os placeholders, e:
await supabase.functions.invoke("send-email", {
  body: { to, subject: "Você foi convidado — Controle de Edição", html },
});
```

Para o **Auth (reset)** o HTML vai no Supabase Dashboard → Authentication → Email Templates
(cada template usa `{{ .ConfirmationURL }}` como `{{CTA_URL}}`).
