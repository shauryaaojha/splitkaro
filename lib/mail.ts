import nodemailer from "nodemailer";
import { smtp, emailFrom } from "./config";

const transporter = nodemailer.createTransport({
  host: smtp.host,
  port: smtp.port,
  secure: smtp.port === 465,
  auth: {
    user: smtp.user,
    pass: smtp.pass,
  },
});

/**
 * Send a branded OTP email to the user.
 */
export async function sendOTPEmail(
  email: string,
  name: string,
  otp: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your SplitKaro OTP</title>
</head>
<body style="margin:0;padding:0;background-color:#fcf9f8;font-family:'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:32px auto;background:#ffffff;border:2px solid #1c1b1b;border-radius:16px;overflow:hidden;">
    <!-- Header -->
    <tr>
      <td style="background-color:#aa3000;padding:24px 32px;">
        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
          Split<span style="font-weight:400;">Karo</span>
        </h1>
      </td>
    </tr>
    <!-- Body -->
    <tr>
      <td style="padding:32px;">
        <p style="margin:0 0 8px;font-size:16px;color:#1c1b1b;">
          Hey <strong>${name}</strong> 👋
        </p>
        <p style="margin:0 0 24px;font-size:14px;color:#5d5c74;">
          Use the code below to verify your email. It expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#fcf9f8;border:2px solid #1c1b1b;border-radius:12px;padding:20px;text-align:center;box-shadow:2px 2px 0px #1c1b1b;">
          <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:8px;color:#aa3000;">
            ${otp}
          </span>
        </div>
        <p style="margin:24px 0 0;font-size:12px;color:#5d5c74;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:16px 32px;border-top:1px solid #e0e0e0;">
        <p style="margin:0;font-size:11px;color:#9e9e9e;text-align:center;">
          © ${new Date().getFullYear()} SplitKaro · Split expenses, not friendships.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();

  try {
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: `SplitKaro verification code`,
      html,
    });
    console.log(`[SMTP] Verification email sent successfully to ${email}`);
  } catch (err) {
    console.log("\n==================================================");
    console.log(`[SMTP Offline] E-mail to: ${email}`);
    console.log(`[SMTP Offline] Hey ${name}, your verification code is: ${otp}`);
    console.log("==================================================\n");
  }
}
