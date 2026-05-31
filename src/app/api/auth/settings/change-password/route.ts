import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { verifyPassword, hashPassword, validatePassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return Response.json({ error: "Current and new password are required" }, { status: 400 });
    }

    const pwError = validatePassword(newPassword);
    if (pwError) {
      return Response.json({ error: pwError }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare("SELECT id, password FROM users WHERE id = ?").get(session.userId) as any;

    if (!user || !user.password) {
      return Response.json({ error: "Cannot change password for Google-only accounts" }, { status: 400 });
    }

    if (!verifyPassword(currentPassword, user.password)) {
      return Response.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const hashed = hashPassword(newPassword);
    db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, user.id);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to change password" }, { status: 500 });
  }
}
