/**
 * Email delivery. Uses Resend (https://resend.com) when RESEND_API_KEY is set;
 * otherwise logs the message to the server console so the flow remains
 * testable in development without an email provider.
 */

const FROM_ADDRESS = process.env.EMAIL_FROM || "ParkPoint <onboarding@resend.dev>";

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(
      `[email disabled] Password reset requested for ${to}. Reset link:\n${resetUrl}`
    );
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      subject: "Reset your ParkPoint password",
      html: `
        <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
          <h1 style="font-size: 20px; color: #0f172a; margin: 0 0 16px;">Reset your password</h1>
          <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 24px;">
            We received a request to reset the password for your ParkPoint account.
            Click the button below to choose a new one. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display: inline-block; background: #10b981; color: #022c22; font-weight: 600; font-size: 15px; padding: 12px 24px; border-radius: 12px; text-decoration: none;">
            Reset password
          </a>
          <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 24px 0 0;">
            If you didn't request this, you can safely ignore this email — your password won't change.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to send email (${response.status}): ${body}`);
  }
}
