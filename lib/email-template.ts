/**
 * Magic link email template — Graph Bug branding
 * Primary: #54de87  |  Text: #3f3d43  |  No gradient
 */
export async function sendVerificationRequest(params: {
  identifier: string;
  url: string;
  provider: { from?: string; apiKey?: string };
}) {
  const { identifier: email, url, provider } = params;
  const { host } = new URL(url);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${provider.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: provider.from,
        to: email,
        subject: `Sign in to Graph Bug`,
        html: createEmailHTML(url, host, email),
        text: createEmailText(url, host),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to send verification email: ${JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
}

function createEmailHTML(url: string, host: string, email: string): string {
  const escapedHost = host.replace(/\./g, "&#8203;.");
  // Build absolute logo URL from the same host as the magic link
  const logoUrl = `https://${host}/logo.png`;
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to Graph Bug</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- ── Header ─────────────────────────────────────── -->
          <tr>
            <td style="background-color:#54de87;padding:36px 40px;text-align:center;">
              <!-- Logo -->
              <img
                src="${logoUrl}"
                alt="Graph Bug"
                width="56"
                height="56"
                style="width:56px;height:56px;border-radius:14px;display:block;margin:0 auto 16px auto;background-color:rgba(255,255,255,0.25);"
              />
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#1a3a27;letter-spacing:-0.3px;">
                Graph Bug
              </h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(26,58,39,0.75);font-weight:500;text-transform:uppercase;letter-spacing:0.8px;">
                AI-Powered Code Review
              </p>
            </td>
          </tr>

          <!-- ── Body ──────────────────────────────────────── -->
          <tr>
            <td style="padding:44px 40px 32px;">
              <h2 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#3f3d43;">
                Your sign-in link
              </h2>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#6b6973;">
                Hi there — click the button below to sign in to your Graph Bug account.
                This link is valid for <strong style="color:#3f3d43;">24 hours</strong> and can only be used once.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:4px 0 36px;">
                    <a
                      href="${url}"
                      style="display:inline-block;background-color:#54de87;color:#1a3a27;text-decoration:none;padding:15px 44px;border-radius:10px;font-size:16px;font-weight:700;letter-spacing:0.1px;"
                    >
                      Sign in to Graph Bug
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #ebebeb;padding-top:28px;">
                    <p style="margin:0 0 8px;font-size:13px;color:#9e9ba5;">
                      If the button doesn't work, paste this URL into your browser:
                    </p>
                    <p style="margin:0;font-size:12px;color:#54de87;word-break:break-all;line-height:1.5;">
                      ${url}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Security notice ──────────────────────────── -->
          <tr>
            <td style="background-color:#f9fafb;border-top:1px solid #ebebeb;padding:20px 40px;">
              <p style="margin:0;font-size:12.5px;line-height:1.6;color:#9e9ba5;">
                This link was requested for <strong style="color:#6b6973;">${email}</strong>.
                If you didn't request it, you can safely ignore this email — no action is needed.
              </p>
            </td>
          </tr>

          <!-- ── Footer ───────────────────────────────────── -->
          <tr>
            <td style="padding:20px 40px;text-align:center;background-color:#f9fafb;">
              <p style="margin:0;font-size:12px;color:#c2bfcb;">
                Sent by <strong style="color:#9e9ba5;">${escapedHost}</strong>
                &nbsp;·&nbsp;
                © ${year} Graph Bug
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`.trim();
}

function createEmailText(url: string, host: string): string {
  return `Sign in to Graph Bug
──────────────────────

Click the link below to sign in to your account:

${url}

This link expires in 24 hours and can only be used once.

If you didn't request this email, you can safely ignore it.

Sent from ${host} · © ${new Date().getFullYear()} Graph Bug`.trim();
}
