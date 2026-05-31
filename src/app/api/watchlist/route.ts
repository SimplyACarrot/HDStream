import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ results: [] });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT media_id, media_type, added_at
      FROM watchlist
      WHERE user_id = ?
      ORDER BY added_at DESC
      LIMIT 50
    `).all(session.userId) as any[];

    if (rows.length === 0) {
      return Response.json({ results: [] });
    }

    const API_KEY = process.env.TMDB_API_KEY;
    const results = await Promise.all(rows.map(async (row) => {
      try {
        const mediaType = row.media_type === "tv" ? "tv" : "movie";
        const res = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${row.media_id}?api_key=${API_KEY}`,
          { cache: "no-store" }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return {
          id: data.id,
          title: data.title || data.name,
          poster_path: data.poster_path,
          backdrop_path: data.backdrop_path,
          vote_average: data.vote_average,
          release_date: data.release_date || data.first_air_date,
          overview: data.overview,
          media_type: row.media_type,
          added_at: row.added_at,
        };
      } catch {
        return null;
      }
    }));

    const filtered = results.filter(Boolean);
    return Response.json({ results: filtered });
  } catch {
    return Response.json({ results: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { mediaId, mediaType, action } = await req.json();
    if (!mediaId || !mediaType || !action) {
      return Response.json({ error: "mediaId, mediaType, and action are required" }, { status: 400 });
    }

    const db = getDb();

    if (action === "add") {
      db.prepare(
        "INSERT OR IGNORE INTO watchlist (user_id, media_id, media_type) VALUES (?, ?, ?)"
      ).run(session.userId, mediaId, mediaType);
      return Response.json({ success: true, inWatchlist: true });
    }

    if (action === "remove") {
      db.prepare(
        "DELETE FROM watchlist WHERE user_id = ? AND media_id = ? AND media_type = ?"
      ).run(session.userId, mediaId, mediaType);
      return Response.json({ success: true, inWatchlist: false });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return Response.json({ error: "Failed to update watchlist" }, { status: 500 });
  }
}
