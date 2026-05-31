import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ user: null });
  }

  const db = getDb();
  const user = db.prepare(
    "SELECT id, first_name, email, username, greeting_preference, avatar_url, theme, dark_mode, two_factor_enabled FROM users WHERE id = ?"
  ).get(session.userId) as any;

  if (!user) {
    return Response.json({ user: null });
  }

  return Response.json({
    user: {
      id: user.id,
      firstName: user.first_name,
      email: user.email,
      username: user.username || "",
      greetingPreference: user.greeting_preference || "first_name",
      avatarUrl: user.avatar_url || "",
      theme: user.theme || "red",
      darkMode: !!user.dark_mode,
      twoFactorEnabled: !!user.two_factor_enabled,
    },
  });
}
