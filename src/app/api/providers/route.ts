import { getTrendingByProvider } from "@/lib/tmdb";

function clean(items: any[]) {
  return items
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
}

const PROVIDERS: Record<string, number> = {
  netflix: 8,
  disney: 337,
  apple: 350,
  prime: 9,
  hbo: 49,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");

  if (provider && PROVIDERS[provider]) {
    const items = await getTrendingByProvider(PROVIDERS[provider]);
    return Response.json({ results: clean(items) });
  }

  const all = await Promise.all(
    Object.entries(PROVIDERS).map(async ([key, id]) => {
      const items = await getTrendingByProvider(id);
      return { provider: key, results: clean(items).slice(0, 10) };
    })
  );

  return Response.json({ providers: all });
}
