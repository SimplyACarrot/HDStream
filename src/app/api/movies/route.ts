import {
  searchMovies,
  searchTV,
  getTrending,
  getTrendingTV,
  getTopRated,
  getTVTopRated,
  getNowPlaying,
  getTVOnTheAir,
  getTVAiringToday,
  getPopular,
  getTVPopular,
  getNewReleases,
  getTopPicks,
  getTVNewShows,
  getByGenres,
  discoverMovies,
  discoverTV,
  getAnimationMovies,
  getAnimationTV,
  getTrendingByProvider,
} from "@/lib/tmdb";

async function fetchMultiPage<T>(fn: (page: number) => Promise<{ results: T[]; total: number; totalPages: number }>, startPage: number, count: number) {
  const pages = await Promise.all(Array.from({ length: count }, (_, i) => fn(startPage + i)));
  const seen = new Set<number>();
  const merged: T[] = [];
  for (const { results } of pages) {
    for (const item of results) {
      if (!seen.has((item as any).id)) {
        seen.add((item as any).id);
        merged.push(item);
      }
    }
  }
  return { results: merged, total: -1, totalPages: -1 };
}

function clean(movies: any[], mediaType: string) {
  const titleKey = mediaType === "tv" ? "name" : "title";
  return movies
    .filter((m: any) => m?.id && m?.[titleKey] && m?.poster_path)
    .map((m: any) => ({
      id: m.id,
      title: m[titleKey],
      media_type: mediaType === "tv" ? "tv" : "movie",
      poster_path: m.poster_path,
      backdrop_path: m.backdrop_path,
      vote_average: m.vote_average,
      vote_count: m.vote_count || 0,
      release_date: mediaType === "tv" ? m.first_air_date : m.release_date,
      overview: m.overview,
      genre_ids: m.genre_ids || [],
    }));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const category = searchParams.get("category");
  const withGenres = searchParams.get("with_genres");
  const yearFrom = searchParams.get("year_from");
  const yearTo = searchParams.get("year_to");
  const browse = searchParams.has("browse");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const mediaType = searchParams.get("media_type") || "movies";
  const combined = searchParams.has("combined");
  const fetchPages = Math.min(parseInt(searchParams.get("fetch_pages") || "1", 10), 5);

  const isTV = mediaType === "tv";
  const isAnimation = mediaType === "animation";

  function buildDiscoverParams(isTv: boolean): string {
    let p = `sort_by=popularity.desc`;
    if (withGenres) p += `&with_genres=${withGenres}`;
    if (yearFrom) {
      p += isTv ? `&first_air_date.gte=${yearFrom}-01-01` : `&primary_release_date.gte=${yearFrom}-01-01`;
    }
    if (yearTo) {
      p += isTv ? `&first_air_date.lte=${yearTo}-12-31` : `&primary_release_date.lte=${yearTo}-12-31`;
    }
    return p;
  }

  function filterByYear(results: any[], isTv: boolean) {
    if (!yearFrom && !yearTo) return results;
    const dateKey = isTv ? "first_air_date" : "release_date";
    return results.filter((m: any) => {
      const d = m[dateKey];
      if (!d) return false;
      const y = parseInt(d.slice(0, 4), 10);
      if (yearFrom && y < parseInt(yearFrom, 10)) return false;
      if (yearTo && y > parseInt(yearTo, 10)) return false;
      return true;
    });
  }

  if (combined && query) {
    const [movieRes, tvRes] = await Promise.all([
      searchMovies(query, page),
      searchTV(query, page),
    ]);
    const movieResults = clean(movieRes.results, "movies") as any[];
    const tvResults = clean(tvRes.results, "tv") as any[];
    const all = [...movieResults, ...tvResults].sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
    return Response.json({ results: all, total: -1, totalPages: -1 });
  }

  if (browse || query || withGenres || yearFrom || yearTo) {
    if (query) {
      const searchFn = isTV ? searchTV : searchMovies;
      const pages = fetchPages > 1
        ? await fetchMultiPage((p) => searchFn(query, p), page, fetchPages)
        : await searchFn(query, page);

      let filtered = pages.results;
      if (withGenres) {
        const genreIds = new Set(withGenres.split(",").map(Number));
        filtered = filtered.filter((m: any) =>
          m.genre_ids?.some((id: number) => genreIds.has(id))
        );
      }
      filtered = filterByYear(filtered, isTV);

      return Response.json({
        results: clean(filtered, mediaType),
        total: withGenres || yearFrom || yearTo ? -1 : pages.total,
        totalPages: withGenres || yearFrom || yearTo ? -1 : pages.totalPages,
      });
    }

    const params = buildDiscoverParams(isTV);
    const discoverFn = isTV ? discoverTV : discoverMovies;
    const pages = fetchPages > 1
      ? await fetchMultiPage((p) => discoverFn(params, p), page, fetchPages)
      : await discoverFn(params, page);

    return Response.json({
      results: clean(pages.results, mediaType),
      total: pages.total,
      totalPages: pages.totalPages,
    });
  }

  let movies: any[];
  if (isAnimation) {
    if (isTV) {
      movies = await getAnimationTV(category || "trending");
    } else {
      movies = await getAnimationMovies(category || "trending");
    }
  } else if (isTV) {
    switch (category) {
      case "trending":
        movies = await getTrendingTV();
        break;
      case "top-rated":
        movies = await getTVTopRated();
        break;
      case "popular":
        movies = await getTVPopular();
        break;
      case "airing-today":
        movies = await getTVAiringToday();
        break;
      case "on-the-air":
        movies = await getTVOnTheAir();
        break;
      case "new-shows":
        movies = await getTVNewShows();
        break;
      default:
        movies = await getTrendingTV();
    }
  } else {
    switch (category) {
      case "trending":
        movies = await getTrending();
        break;
      case "top-rated":
        movies = await getTopRated();
        break;
      case "now-playing":
        movies = await getNowPlaying();
        break;
      case "popular":
        movies = await getPopular();
        break;
      case "new-releases":
        movies = await getNewReleases();
        break;
      case "top-picks":
        movies = await getTopPicks();
        break;
      default:
        movies = await getTrending();
    }
  }

  if (withGenres && !isAnimation) {
    const genreIds = new Set(withGenres.split(",").map(Number));
    movies = movies.filter((m: any) =>
      m.genre_ids?.some((id: number) => genreIds.has(id))
    );
  }

  return Response.json(clean(movies, mediaType));
}
