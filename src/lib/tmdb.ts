const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.TMDB_API_KEY;

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

interface PaginatedResult {
  results: any[];
  total: number;
  totalPages: number;
}

async function fetchPages(base: string, pages: number = 4): Promise<any[]> {
  const sep = base.includes("?") ? "&" : "?";
  const fetches = Array.from({ length: pages }, (_, i) =>
    fetch(`${base}${sep}page=${i + 1}&api_key=${API_KEY}`).then((r) => r.json())
  );
  const all = await Promise.all(fetches);
  return all.flatMap((d) => d.results || []);
}

// ── MOVIES ────────────────────────────────────────────────────

// 📈 Trending
export async function getTrending() {
  return fetchPages(`${BASE_URL}/trending/movie/week`);
}

// ⭐ Top Rated
export async function getTopRated() {
  return fetchPages(`${BASE_URL}/movie/top_rated`);
}

// 🔥 Popular
export async function getPopular() {
  return fetchPages(`${BASE_URL}/movie/popular`);
}

// 🆕 New Releases
export async function getNewReleases() {
  return fetchPages(
    `${BASE_URL}/discover/movie?primary_release_date.gte=${daysFromNow(-90)}&primary_release_date.lte=${daysFromNow(0)}&sort_by=primary_release_date.desc`
  );
}

// 🎬 Coming Soon
export async function getComingSoon() {
  return fetchPages(
    `${BASE_URL}/discover/movie?primary_release_date.gte=${daysFromNow(1)}&primary_release_date.lte=${daysFromNow(90)}&sort_by=primary_release_date.asc`
  );
}

// 🎥 Now Playing
export async function getNowPlaying() {
  const results = await fetchPages(`${BASE_URL}/movie/now_playing`);
  const today = daysFromNow(0);
  return results.filter((m: any) => !m.release_date || m.release_date <= today);
}

// 🏆 Top Picks
export async function getTopPicks() {
  return fetchPages(
    `${BASE_URL}/discover/movie?vote_count.gte=500&sort_by=vote_average.desc`
  );
}

// 🏷️ Genre list
export async function getGenres() {
  const [movieGenres, tvGenres] = await Promise.all([
    fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`).then(r => r.json()),
    fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`).then(r => r.json()),
  ]);
  const merged = new Map<number, string>();
  for (const g of [...(movieGenres.genres || []), ...(tvGenres.genres || [])]) {
    if (!merged.has(g.id)) merged.set(g.id, g.name);
  }
  return Array.from(merged.entries()).map(([id, name]) => ({ id, name }));
}

// 🏷️ Movies by genre(s)
export async function getByGenres(params: string) {
  return (await discoverMovies(params)).results;
}

// 🔎 Search
export async function searchMovies(query: string, page: number = 1) {
  const res = await fetch(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
  );
  const data = await res.json();
  return { results: data.results || [], total: data.total_results || 0, totalPages: data.total_pages || 1 };
}

// 🔎 Discover
export async function discoverMovies(params: string, page: number = 1) {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&${params}&page=${page}`
  );
  const data = await res.json();
  return { results: data.results || [], total: data.total_results || 0, totalPages: data.total_pages || 1 };
}

// ── TV SHOWS ───────────────────────────────────────────────────

export async function getTrendingTV() {
  return fetchPages(`${BASE_URL}/trending/tv/week`);
}

export async function getTVPopular() {
  return fetchPages(`${BASE_URL}/tv/popular`);
}

export async function getTVTopRated() {
  return fetchPages(`${BASE_URL}/tv/top_rated`);
}

export async function getTVAiringToday() {
  return fetchPages(`${BASE_URL}/tv/airing_today`);
}

export async function getTVOnTheAir() {
  return fetchPages(`${BASE_URL}/tv/on_the_air`);
}

export async function getTVNewShows() {
  return fetchPages(
    `${BASE_URL}/discover/tv?first_air_date.gte=${daysFromNow(-90)}&first_air_date.lte=${daysFromNow(0)}&sort_by=first_air_date.desc`
  );
}

export async function getTVGenres() {
  const res = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`);
  const data = await res.json();
  return data.genres || [];
}

export async function searchTV(query: string, page: number = 1) {
  const res = await fetch(
    `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
  );
  const data = await res.json();
  return { results: data.results || [], total: data.total_results || 0, totalPages: data.total_pages || 1 };
}

export async function discoverTV(params: string, page: number = 1) {
  const res = await fetch(
    `${BASE_URL}/discover/tv?api_key=${API_KEY}&${params}&page=${page}`
  );
  const data = await res.json();
  return { results: data.results || [], total: data.total_results || 0, totalPages: data.total_pages || 1 };
}

// ── ANIMATION ──────────────────────────────────────────────────

export async function getAnimationMovies(category: string) {
  const genreFilter = "&with_genres=16&without_genres=10762";
  switch (category) {
    case "trending":
      return fetchPages(`${BASE_URL}/discover/movie?sort_by=popularity.desc${genreFilter}`);
    case "popular":
      return fetchPages(`${BASE_URL}/discover/movie?sort_by=popularity.desc${genreFilter}&vote_count.gte=50`);
    case "top-rated":
      return fetchPages(`${BASE_URL}/discover/movie?sort_by=vote_average.desc${genreFilter}&vote_count.gte=200`);
    case "new-notable":
      return fetchPages(`${BASE_URL}/discover/movie?primary_release_date.gte=${daysFromNow(-365)}&sort_by=vote_count.desc${genreFilter}&vote_count.gte=30`);
    default:
      return fetchPages(`${BASE_URL}/discover/movie?sort_by=popularity.desc${genreFilter}`);
  }
}

export async function getAnimationTV(category: string) {
  const genreFilter = "&with_genres=16";
  switch (category) {
    case "trending":
      return fetchPages(`${BASE_URL}/discover/tv?sort_by=popularity.desc${genreFilter}`);
    case "popular":
      return fetchPages(`${BASE_URL}/discover/tv?sort_by=popularity.desc${genreFilter}&vote_count.gte=50`);
    case "top-rated":
      return fetchPages(`${BASE_URL}/discover/tv?sort_by=vote_average.desc${genreFilter}&vote_count.gte=200`);
    case "new-notable":
      return fetchPages(`${BASE_URL}/discover/tv?first_air_date.gte=${daysFromNow(-365)}&sort_by=vote_count.desc${genreFilter}&vote_count.gte=10`);
    default:
      return fetchPages(`${BASE_URL}/discover/tv?sort_by=popularity.desc${genreFilter}`);
  }
}

// ── WATCH PROVIDERS ────────────────────────────────────────────

export async function getTrendingByProvider(providerId: number) {
  const [movies, tv] = await Promise.all([
    fetchPages(`${BASE_URL}/discover/movie?sort_by=popularity.desc&with_watch_providers=${providerId}&watch_region=US`),
    fetchPages(`${BASE_URL}/discover/tv?sort_by=popularity.desc&with_watch_providers=${providerId}&watch_region=US`),
  ]);
  const seen = new Set<number>();
  const merged: any[] = [];
  for (const m of [...movies, ...tv]) {
    if (!seen.has(m.id)) {
      seen.add(m.id);
      merged.push(m);
    }
  }
  return merged;
}

// 📺 TV show details
export async function getTVDetails(id: string) {
  const res = await fetch(
    `${BASE_URL}/tv/${id}?api_key=${API_KEY}&append_to_response=videos,content_ratings`,
    { cache: "no-store" }
  );
  return res.json();
}

// 📺 TV season details with episodes
export async function getTVSeason(id: string, season: number) {
  const res = await fetch(
    `${BASE_URL}/tv/${id}/season/${season}?api_key=${API_KEY}`,
    { cache: "no-store" }
  );
  return res.json();
}