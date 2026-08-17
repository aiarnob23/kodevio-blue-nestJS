import { config } from 'src/core/config';

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

const layout = (heading: string, bodyHtml: string) => `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f4f4f5; padding:24px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;">
      <h2 style="margin-top:0;color:#111827;">${heading}</h2>
      ${bodyHtml}
      <p style="color:#9ca3af;font-size:12px;margin-top:32px;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  </body>
</html>`;

export const emailVerificationTemplate = (code: string): EmailContent => ({
  subject: `Verify your account`,
  html: layout(
    `Hi, verify your email`,
    `<p>Use the code below to verify your email address. It expires in ${config.otp.expiryMinutes} minutes.</p>
         <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#111827;">${code}</p>`,
  ),
  text: `Hi, your verification code is ${code}. It expires in ${config.otp.expiryMinutes} minutes.`,
});

export const passwordResetTemplate = (code: string): EmailContent => ({
  subject: `Reset your password`,
  html: layout(
    `Hi, reset your password`,
    `<p>Use the code below to reset your password. It expires in ${config.otp.expiryMinutes} minutes.</p>
         <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#111827;">${code}</p>`,
  ),
  text: `Hi, your password reset code is ${code}. It expires in ${config.otp.expiryMinutes} minutes.`,
});
