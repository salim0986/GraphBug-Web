/**
 * Custom email template for magic link authentication
 * Branded with Graph Bug theme and professional design
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

/**
 * HTML email template with Graph Bug branding
 */
function createEmailHTML(url: string, host: string, email: string): string {
  const escapedHost = host.replace(/\./g, "&#8203;.");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to Graph Bug</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f0f0ff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f0ff; padding: 40px 20px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Brand -->
          <tr>
            <td style="background: linear-gradient(135deg, #54de87 0%, #bf66ff 100%); padding: 40px 30px; text-align: center;">
              <div style="width: 64px; height: 64px; background-color: rgba(255, 255, 255, 0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3f3d43" stroke-width="2">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h1 style="color: #3f3d43; font-size: 32px; font-weight: 700; margin: 0; line-height: 1.2;">
                Graph Bug
              </h1>
              <p style="color: rgba(63, 61, 67, 0.8); font-size: 16px; margin: 8px 0 0 0;">
                AI-Powered Code Review
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #3f3d43; font-size: 24px; font-weight: 600; margin: 0 0 16px 0;">
                Sign in to your account
              </h2>
              <p style="color: rgba(63, 61, 67, 0.7); font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                Click the button below to securely sign in to Graph Bug. This link will expire in 24 hours.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${url}" style="display: inline-block; background-color: #54de87; color: #3f3d43; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 6px rgba(84, 222, 135, 0.3);">
                      Sign in to Graph Bug
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="color: rgba(63, 61, 67, 0.6); font-size: 14px; line-height: 1.6; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #e5e5e5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="color: #bf66ff; font-size: 12px; word-break: break-all; margin: 8px 0;">
                ${url}
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 30px; border-top: 1px solid #e5e5e5;">
              <p style="color: rgba(63, 61, 67, 0.6); font-size: 13px; line-height: 1.5; margin: 0;">
                <strong style="color: #3f3d43;">Security Note:</strong> This email was sent to <strong>${email}</strong>. If you didn't request this email, you can safely ignore it. The link will expire in 24 hours.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; text-align: center; background-color: #fafafa;">
              <p style="color: rgba(63, 61, 67, 0.5); font-size: 12px; margin: 0 0 8px 0;">
                This email was sent from <strong>${escapedHost}</strong>
              </p>
              <p style="color: rgba(63, 61, 67, 0.5); font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Graph Bug. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Plain text email fallback
 */
function createEmailText(url: string, host: string): string {
  return `
Sign in to Graph Bug

Click the link below to sign in to your Graph Bug account:

${url}

If the link doesn't work, copy and paste it into your browser.

This link will expire in 24 hours.

Security Note: This email was sent to verify your identity. If you didn't request this email, you can safely ignore it.

Sent from ${host}

© ${new Date().getFullYear()} Graph Bug. All rights reserved.
  `.trim();
}
