import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { mediaId, mediaType, season, episode, progress, duration } = await req.json();
    if (!mediaId || !mediaType) {
      return Response.json({ error: "mediaId and mediaType are required" }, { status: 400 });
    }

    const db = getDb();
    const seasonVal = mediaType === "tv" ? (season || 0) : 0;
    const episodeVal = mediaType === "tv" ? (episode || 0) : 0;

    db.prepare(`
      INSERT INTO watch_progress (user_id, media_id, media_type, season, episode, progress, duration, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, media_id, media_type, season, episode)
      DO UPDATE SET progress = ?, duration = ?, updated_at = datetime('now')
    `).run(session.userId, mediaId, mediaType, seasonVal, episodeVal, progress || 0, duration || 0, progress || 0, duration || 0);

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: "Failed to save progress" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ results: [] });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT DISTINCT media_id, media_type, MAX(updated_at) as updated_at
      FROM watch_progress
      WHERE user_id = ? AND progress < 0.95
      GROUP BY media_id, media_type
      ORDER BY updated_at DESC
      LIMIT 20
    `).all(session.userId) as any[];

    if (rows.length === 0) {
      return Response.json({ results: [] });
    }

    const API_KEY = process.env.TMDB_API_KEY;
    const results = await Promise.all(rows.map(async (row) => {
      try {
        const mediaType = row.media_type === "tv" ? "tv" : "movie";
        const res = await fetch(
          `https://api.themoviedb.org/3/${mediaType === "tv" ? "tv" : "movie"}/${row.media_id}?api_key=${API_KEY}`,
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
          updated_at: row.updated_at,
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
