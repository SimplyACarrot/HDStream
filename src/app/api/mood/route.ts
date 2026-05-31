import { discoverMovies, discoverTV } from "@/lib/tmdb";

const MOODS: Record<string, { genreIds: string; sortBy: string }> = {
  "intense-thrills": {
    genreIds: "53,27,9648",
    sortBy: "vote_count.desc",
  },
  "chill-relax": {
    genreIds: "35,10402,10749",
    sortBy: "vote_average.desc",
  },
  "action-packed": {
    genreIds: "28,12,878",
    sortBy: "vote_count.desc",
  },
  "heartwarming": {
    genreIds: "18,10749,10751",
    sortBy: "vote_average.desc",
  },
  "nighttime-vibes": {
    genreIds: "53,9648,80,27",
    sortBy: "vote_count.desc",
  },
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mood = searchParams.get("mood");
  const page = parseInt(searchParams.get("page") || "1", 10);

  const config = mood ? MOODS[mood] : null;
  if (!config) {
    return Response.json({ results: [] });
  }

  const params = `sort_by=${config.sortBy}&with_genres=${config.genreIds}&vote_count.gte=30`;

  const [movieRes, tvRes] = await Promise.all([
    discoverMovies(params, page),
    discoverTV(params, page),
  ]);

  const seen = new Set<number>();
  const merged: any[] = [];
  for (const item of [...(movieRes.results || []), ...(tvRes.results || [])]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      merged.push(item);
    }
  }

  const clean = merged
    .filter((m: any) => m?.id && (m?.title || m?.name) && m?.poster_path)
    .map((m: any) => ({
      id: m.id,
      title: m.title || m.name,
      media_type: m.media_type || (m.first_air_date ? "tv" : "movie"),
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      vote_average: m.vote_average,
      vote_count: m.vote_count || 0,
      release_date: m.release_date || m.first_air_date,
      overview: m.overview,
    }));

  return Response.json({ results: clean });
}
