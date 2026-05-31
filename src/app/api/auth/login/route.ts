import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, setSessionCookie, signTempToken } from "@/lib/auth";
import { sendEmail, generateCode } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare("SELECT id, first_name, email, password, two_factor_enabled, email_verified FROM users WHERE email = ?").get(email) as any;

    if (!user || !user.password) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!verifyPassword(password, user.password)) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (!user.email_verified) {
      db.prepare("UPDATE verification_codes SET used = 1 WHERE user_id = ? AND type = 'email_verify' AND used = 0").run(user.id);
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      db.prepare("INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES (?, ?, 'email_verify', ?)").run(user.id, code, expiresAt);

      const tempToken = signTempToken({ userId: String(user.id), email: user.email, purpose: "email_verify" });

      await sendEmail(
        user.email,
        "Verify your HDStream email",
        `Hi ${user.first_name},\n\nYour email verification code is: ${code}\n\nThis code expires in 10 minutes.`,
        `<p>Hi ${user.first_name},</p><p>Your email verification code is:</p><h2 style="letter-spacing:4px;font-size:24px;background:#f5f5f5;padding:12px 20px;border-radius:8px;display:inline-block;color:#000">${code}</h2><p>This code expires in <strong>10 minutes</strong>.</p>`
      );

      return Response.json({ success: true, emailUnverified: true, tempToken, email: user.email });
    }

    if (user.two_factor_enabled) {

      const tempToken = signTempToken({ userId: String(user.id), email: user.email });

      const code = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      db.prepare("UPDATE verification_codes SET used = 1 WHERE user_id = ? AND type = '2fa' AND used = 0").run(user.id);
      db.prepare(
        "INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES (?, ?, '2fa', ?)"
      ).run(user.id, code, expiresAt);

      await sendEmail(
        user.email,
        "Your HDStream login verification code",
        `Hi ${user.first_name},\n\nYour 2FA verification code is: ${code}\n\nThis code expires in 10 minutes.`,
        `<p>Hi ${user.first_name},</p><p>Your 2FA verification code is:</p><h2 style="letter-spacing:4px;font-size:24px;background:#f5f5f5;padding:12px 20px;border-radius:8px;display:inline-block">${code}</h2><p>This code expires in <strong>10 minutes</strong>.</p>`
      );

      return Response.json({ success: true, twoFactorRequired: true, tempToken });
    }

    await setSessionCookie({ userId: user.id, email: user.email });

    return Response.json({ success: true, user: { id: user.id, firstName: user.first_name, email: user.email } });
  } catch {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
