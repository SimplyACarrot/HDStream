import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { setSessionCookie, verifyTempToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { tempToken, code } = await req.json();

    if (!tempToken || !code) {
      return Response.json({ error: "Verification token and code are required" }, { status: 400 });
    }

    const payload = verifyTempToken(tempToken);
    if (!payload || !payload.userId || !payload.email || payload.purpose !== "email_verify") {
      return Response.json({ error: "Invalid or expired verification. Please try registering again." }, { status: 401 });
    }

    const db = getDb();
    const userId = parseInt(payload.userId, 10);

    const user = db.prepare("SELECT id FROM users WHERE id = ? AND email = ?").get(userId, payload.email) as any;
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const record = db.prepare(
      `SELECT id FROM verification_codes
       WHERE user_id = ? AND code = ? AND type = 'email_verify' AND used = 0 AND expires_at > datetime('now')
       ORDER BY id DESC LIMIT 1`
    ).get(userId, code) as any;

    if (!record) {
      return Response.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    db.prepare("UPDATE verification_codes SET used = 1 WHERE id = ?").run(record.id);
    db.prepare("UPDATE users SET email_verified = 1, updated_at = datetime('now') WHERE id = ?").run(userId);

    await setSessionCookie({ userId, email: payload.email });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}
