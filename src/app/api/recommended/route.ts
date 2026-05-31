import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

function computeWeight(progress: number, updatedAt: string): number {
  const raw = Math.min(progress, 1);
  const progressScore = raw * 0.6;
  const days = (Date.now() - new Date(updatedAt).getTime()) / 86400000;
  const recencyScore = Math.max(0, 1 - days / 30) * 0.4;
  return progressScore + recencyScore;
}

function deduplicate(arr: any[], seen: Set<number>) {
  return arr.filter((r: any) => {
    if (seen.has(r.id)) return false;
    if (!r.poster_path) return false;
    seen.add(r.id);
    return true;
  });
}

async function fetchTmdbJson(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("TMDB fetch failed");
  return res.json();
}

interface SourceItem {
  mediaId: number;
  mediaType: "movie" | "tv";
  weight: number;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return Response.json({ results: [] });

    const db = getDb();
    const API_KEY = process.env.TMDB_API_KEY;
    const seen = new Set<number>();
    const genreScores = new Map<number, number>();
    const watchedMovieIds = new Set<number>();
    const watchedTvIds = new Set<number>();
    const sources: SourceItem[] = [];
    const dedupKeys = new Set<string>();

    const watchedRows = db.prepare(`
      SELECT media_id, media_type, MAX(progress) as progress, MAX(updated_at) as updated_at
      FROM watch_progress
      WHERE user_id = ?
      GROUP BY media_id, media_type
      ORDER BY updated_at DESC
    `).all(session.userId) as any[];

    for (const row of watchedRows) {
      const key = `${row.media_type}-${row.media_id}`;
      if (dedupKeys.has(key)) continue;
      dedupKeys.add(key);
      const mt = row.media_type === "tv" ? "tv" : "movie";
      if (mt === "tv") watchedTvIds.add(row.media_id);
      else watchedMovieIds.add(row.media_id);
      sources.push({ mediaId: row.media_id, mediaType: mt, weight: computeWeight(row.progress, row.updated_at) });
    }

    const watchlistRows = db.prepare(`
      SELECT media_id, media_type, added_at
      FROM watchlist
      WHERE user_id = ?
      ORDER BY added_at DESC
    `).all(session.userId) as any[];

    for (const row of watchlistRows) {
      const key = `${row.media_type}-${row.media_id}`;
      if (dedupKeys.has(key)) continue;
      dedupKeys.add(key);
      const mt = row.media_type === "tv" ? "tv" : "movie";
      if (mt === "tv") watchedTvIds.add(row.media_id);
      else watchedMovieIds.add(row.media_id);
      const days = (Date.now() - new Date(row.added_at).getTime()) / 86400000;
      sources.push({ mediaId: row.media_id, mediaType: mt, weight: Math.max(0, 1 - days / 90) * 0.4 });
    }

    if (sources.length === 0) {
      const prefs = db.prepare(
        "SELECT genre_id, genre_name FROM genre_preferences WHERE user_id = ? ORDER BY created_at"
      ).all(session.userId) as any[];

      if (prefs.length > 0) {
        const genreIds = prefs.map(p => p.genre_id).join(",");
        const [movieData, tvData] = await Promise.all([
          fetchTmdbJson(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genreIds}&sort_by=vote_count.desc&vote_count.gte=50`).catch(() => ({ results: [] })),
          fetchTmdbJson(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=${genreIds}&sort_by=vote_count.desc&vote_count.gte=50`).catch(() => ({ results: [] })),
        ]);

        const results = [
          ...(movieData.results || []).map((r: any) => ({ ...r, media_type: "movie" })),
          ...(tvData.results || []).map((r: any) => ({ ...r, media_type: "tv" })),
        ];

        return Response.json({
          results: deduplicate(results, seen).slice(0, 30).map((r: any) => ({
            id: r.id,
            title: r.title || r.name,
            poster_path: r.poster_path,
            backdrop_path: r.backdrop_path,
            vote_average: r.vote_average,
            vote_count: r.vote_count || 0,
            release_date: r.release_date || r.first_air_date,
            overview: r.overview,
            media_type: r.media_type,
          })),
        });
      }

      return Response.json({ results: [] });
    }

    let movieWeight = 0;
    let tvWeight = 0;

    const detailResults = await Promise.allSettled(
      sources.map(s =>
        fetchTmdbJson(`https://api.themoviedb.org/3/${s.mediaType}/${s.mediaId}?api_key=${API_KEY}`)
          .then(d => ({ detail: d, source: s }))
          .catch(() => null)
      )
    );

    for (const result of detailResults) {
      if (result.status !== "fulfilled" || !result.value) continue;
      const { detail, source } = result.value;
      if (source.mediaType === "tv") tvWeight += source.weight;
      else movieWeight += source.weight;
      const genres = detail.genres || [];
      for (const g of genres) {
        genreScores.set(g.id, (genreScores.get(g.id) ?? 0) + source.weight);
      }
    }

    const topGenres = Array.from(genreScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const allRecs: any[] = [];

    const recResults = await Promise.allSettled(
      sources.map(s =>
        fetchTmdbJson(`https://api.themoviedb.org/3/${s.mediaType}/${s.mediaId}/recommendations?api_key=${API_KEY}`)
          .then(data => ({ data, mediaType: s.mediaType }))
          .catch(() => null)
      )
    );

    for (const result of recResults) {
      if (result.status !== "fulfilled" || !result.value) continue;
      const { data, mediaType } = result.value;
      const recs = deduplicate(data.results || [], seen).map((r: any) => ({
        id: r.id,
        title: r.title || r.name,
        poster_path: r.poster_path,
        backdrop_path: r.backdrop_path,
        vote_average: r.vote_average,
        vote_count: r.vote_count || 0,
        release_date: r.release_date || r.first_air_date,
        overview: r.overview,
        media_type: mediaType,
      }));
      for (const r of recs) {
        allRecs.push(r);
        if (allRecs.length >= 30) break;
      }
      if (allRecs.length >= 30) break;
    }

    if (topGenres.length > 0 && allRecs.length < 30) {
      const genreStr = topGenres.join(",");
      const prefersMovies = movieWeight >= tvWeight;
      const discoverPromises: Promise<any>[] = [];

      discoverPromises.push(
        fetchTmdbJson(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genreStr}&sort_by=vote_count.desc&vote_count.gte=50`).catch(() => ({ results: [] }))
      );
      if (!prefersMovies || allRecs.length < 15) {
        discoverPromises.push(
          fetchTmdbJson(`https://api.themoviedb.org/3/discover/tv?api_key=${API_KEY}&with_genres=${genreStr}&sort_by=vote_count.desc&vote_count.gte=50`).catch(() => ({ results: [] }))
        );
      }

      const discoverResponses = await Promise.all(discoverPromises);
      for (const data of discoverResponses) {
        const results = deduplicate(data.results || [], seen).filter(
          (r: any) => !watchedMovieIds.has(r.id) && !watchedTvIds.has(r.id)
        );
        for (const r of results) {
          allRecs.push({
            id: r.id,
            title: r.title || r.name,
            poster_path: r.poster_path,
            backdrop_path: r.backdrop_path,
            vote_average: r.vote_average,
            vote_count: r.vote_count || 0,
            release_date: r.release_date || r.first_air_date,
            overview: r.overview,
            media_type: r.media_type || (r.first_air_date ? "tv" : "movie"),
          });
          if (allRecs.length >= 30) break;
        }
        if (allRecs.length >= 30) break;
      }
    }

    return Response.json({ results: allRecs.slice(0, 30) });
  } catch {
    return Response.json({ results: [] });
  }
}
