<#macro emailLayout>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Citybox</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f0e8;font-family:'Instrument Sans',system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1f2b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f0e8;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <tr>
            <td style="padding-bottom:20px;text-align:left;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:44px;height:44px;border-radius:12px;background-color:#f97316;text-align:center;vertical-align:middle;font-weight:700;font-size:14px;letter-spacing:0.06em;color:#fff8f1;">
                    AP
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <div style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:600;letter-spacing:-0.02em;color:#1a1f2b;">Citybox Platform</div>
                    <div style="font-size:13px;color:#5c6474;margin-top:2px;">Backoffice e operações da sua loja</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#faf8f4;border:1px solid #e4dfd3;border-radius:14px;padding:28px 28px 24px;box-shadow:0 8px 24px rgba(26,31,43,0.06);">
              <#nested>
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;text-align:center;font-size:12px;line-height:1.6;color:#6b7280;">
              <p style="margin:0 0 6px;">Este e-mail foi enviado pela plataforma Citybox em nome de <strong>${realmName!''}</strong>.</p>
              <p style="margin:0;">Se você não reconhece esta ação, ignore a mensagem ou fale com o administrador da sua loja.</p>
              <p style="margin:12px 0 0;color:#9ca3af;">© ${.now?string('yyyy')} Citybox · Ilhéus, BA</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
</#macro>
