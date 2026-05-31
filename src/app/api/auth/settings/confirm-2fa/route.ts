import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code) {
      return Response.json({ error: "Verification code is required" }, { status: 400 });
    }

    const db = getDb();
    const record = db.prepare(
      `SELECT id FROM verification_codes
       WHERE user_id = ? AND code = ? AND type = '2fa' AND used = 0 AND expires_at > datetime('now')
       ORDER BY id DESC LIMIT 1`
    ).get(session.userId, code) as any;

    if (!record) {
      return Response.json({ error: "Invalid or expired code" }, { status: 400 });
    }

    db.prepare("UPDATE verification_codes SET used = 1 WHERE id = ?").run(record.id);
    db.prepare("UPDATE users SET two_factor_enabled = 1, updated_at = datetime('now') WHERE id = ?").run(session.userId);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }
}
