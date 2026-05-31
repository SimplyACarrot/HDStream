import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { sendEmail, generateCode } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { enabled } = await req.json();

    const db = getDb();
    const user = db.prepare("SELECT id, first_name, email FROM users WHERE id = ?").get(session.userId) as any;
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    if (enabled) {

      const code = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      db.prepare("UPDATE verification_codes SET used = 1 WHERE user_id = ? AND type = '2fa' AND used = 0").run(user.id);
      db.prepare(
        "INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES (?, ?, '2fa', ?)"
      ).run(user.id, code, expiresAt);

      await sendEmail(
        user.email,
        "Your HDStream 2FA verification code",
        `Hi ${user.first_name},\n\nYour 2FA verification code is: ${code}\n\nThis code expires in 10 minutes.`,
        `<p>Hi ${user.first_name},</p><p>Your 2FA verification code is:</p><h2 style="letter-spacing:4px;font-size:24px;background:#f5f5f5;padding:12px 20px;border-radius:8px;display:inline-block">${code}</h2><p>This code expires in <strong>10 minutes</strong>.</p>`
      );

      return Response.json({ success: true, verificationSent: true });
    }

    db.prepare("UPDATE users SET two_factor_enabled = 0, updated_at = datetime('now') WHERE id = ?").run(user.id);
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to update 2FA settings" }, { status: 500 });
  }
}
