import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return Response.json({ genres: [] });

    const db = getDb();
    const rows = db.prepare(
      `SELECT genre_id, genre_name FROM genre_preferences WHERE user_id = ? ORDER BY created_at`
    ).all(session.userId) as any[];

    return Response.json({ genres: rows.map(r => ({ id: r.genre_id, name: r.genre_name })) });
  } catch {
    return Response.json({ genres: [] });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { genres } = await req.json();
    if (!Array.isArray(genres)) {
      return Response.json({ error: "genres must be an array" }, { status: 400 });
    }

    const db = getDb();
    const upsert = db.prepare(
      `INSERT INTO genre_preferences (user_id, genre_id, genre_name) VALUES (?, ?, ?)
       ON CONFLICT(user_id, genre_id) DO UPDATE SET genre_name = excluded.genre_name`
    );

    const tx = db.transaction(() => {
      for (const g of genres) {
        upsert.run(session.userId, g.id, g.name);
      }
    });
    tx();

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
