import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { sendEmail, generateCode } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare("SELECT id, first_name FROM users WHERE email = ?").get(email) as any;

    if (!user) {
      return Response.json({ success: true });
    }

    db.prepare("UPDATE verification_codes SET used = 1 WHERE user_id = ? AND type = 'reset' AND used = 0").run(user.id);

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.prepare(
      "INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES (?, ?, 'reset', ?)"
    ).run(user.id, code, expiresAt);

    await sendEmail(
      email,
      "Reset your HDStream password",
      `Hi ${user.first_name},\n\nSomeone requested a password reset for your HDStream account.\n\nYour verification code is: ${code}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
      `<p>Hi ${user.first_name},</p><p>Someone requested a password reset for your HDStream account.</p><p>Your verification code is:</p><h2 style="letter-spacing:4px;font-size:24px;background:#f5f5f5;padding:12px 20px;border-radius:8px;display:inline-block">${code}</h2><p>This code expires in <strong>15 minutes</strong>.</p><p>If you didn't request this, you can safely ignore this email.</p>`
    );

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to send reset code" }, { status: 500 });
  }
}
