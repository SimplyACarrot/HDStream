import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, validatePassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, code, password } = await req.json();

    if (!email || !code || !password) {
      return Response.json({ error: "Email, code, and new password are required" }, { status: 400 });
    }

    const pwError = validatePassword(password);
    if (pwError) {
      return Response.json({ error: pwError }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const record = db.prepare(
      `SELECT id FROM verification_codes
       WHERE user_id = ? AND code = ? AND type = 'reset' AND used = 0 AND expires_at > datetime('now')
       ORDER BY id DESC LIMIT 1`
    ).get(user.id, code) as any;

    if (!record) {
      return Response.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    db.prepare("UPDATE verification_codes SET used = 1 WHERE id = ?").run(record.id);

    const hashed = hashPassword(password);
    db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, user.id);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
