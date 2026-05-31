import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { firstName, username, greetingPreference, theme, darkMode, avatarUrl } = await req.json();
  const db = getDb();

  const updates: string[] = [];
  const values: any[] = [];

  if (firstName !== undefined) {
    updates.push("first_name = ?");
    values.push(firstName);
  }
  if (username !== undefined) {
    updates.push("username = ?");
    values.push(username);
  }
  if (greetingPreference !== undefined) {
    if (!["first_name", "username"].includes(greetingPreference)) {
      return Response.json({ error: "Invalid greeting preference" }, { status: 400 });
    }
    updates.push("greeting_preference = ?");
    values.push(greetingPreference);
  }
  if (theme !== undefined) {
    updates.push("theme = ?");
    values.push(theme);
  }
  if (darkMode !== undefined) {
    updates.push("dark_mode = ?");
    values.push(darkMode ? 1 : 0);
  }
  if (avatarUrl !== undefined) {
    updates.push("avatar_url = ?");
    values.push(avatarUrl);
  }

  if (updates.length === 0) {
    return Response.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.push("updated_at = datetime('now')");
  values.push(session.userId);

  db.prepare(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  return Response.json({ success: true });
}
