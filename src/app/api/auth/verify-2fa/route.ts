import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { verifyToken, signToken, setSessionCookie, signTempToken, verifyTempToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { tempToken, code } = await req.json();

    if (!tempToken || !code) {
      return Response.json({ error: "Verification token and code are required" }, { status: 400 });
    }

    const payload = verifyTempToken(tempToken);
    if (!payload || !payload.userId || !payload.email) {
      return Response.json({ error: "Invalid or expired verification. Please log in again." }, { status: 401 });
    }

    const db = getDb();
    const user = db.prepare("SELECT id FROM users WHERE id = ? AND email = ?").get(
      parseInt(payload.userId, 10), payload.email
    ) as any;

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const record = db.prepare(
      `SELECT id FROM verification_codes
       WHERE user_id = ? AND code = ? AND type = '2fa' AND used = 0 AND expires_at > datetime('now')
       ORDER BY id DESC LIMIT 1`
    ).get(user.id, code) as any;

    if (!record) {
      return Response.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    db.prepare("UPDATE verification_codes SET used = 1 WHERE id = ?").run(record.id);

    await setSessionCookie({ userId: user.id, email: payload.email });

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}
