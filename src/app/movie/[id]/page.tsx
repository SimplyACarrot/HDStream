import WatchlistButton from "@/components/WatchlistButton";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const API_KEY = process.env.TMDB_API_KEY;

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`,
    { cache: "no-store" }
  );

  const movie = await res.json();

  if (!movie?.id) {
    return (
      <main className="min-h-screen text-[var(--text-primary)] flex items-center justify-center">
        <h1 className="text-xl">Movie not found</h1>
      </main>
    );
  }

  const videoRes = await fetch(
    `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${API_KEY}`,
    { cache: "no-store" }
  );

  const videoData = await videoRes.json();

  const trailer = videoData?.results
    ?.filter(
      (v: any) =>
        v.site === "YouTube" &&
        v.official &&
        v.type === "Trailer" &&
        !v.name.toLowerCase().includes("short")
    )
    ?.sort((a: any, b: any) => {
      // Prefer official trailers
      if (a.official && !b.official) return -1;
      if (!a.official && b.official) return 1;

      // Prefer "Official Trailer"
      if (
        a.name.toLowerCase().includes("official trailer") &&
        !b.name.toLowerCase().includes("official trailer")
      )
        return -1;

      return 0;
    })[0];

  const trailerUrl = trailer
    ? `https://www.youtube.com/embed/${trailer.key}`
    : null;

  // Format runtime
  const hours = movie.runtime ? Math.floor(movie.runtime / 60) : 0;
  const minutes = movie.runtime ? movie.runtime % 60 : 0;
  const runtimeStr = movie.runtime
    ? `${hours}h ${minutes}m`
    : "N/A";

  // Get year from release date
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "N/A";

  return (
    <main className="min-h-screen text-[var(--text-primary)]">
      {/* HERO */}
      <div
        className="relative h-[280px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: movie.backdrop_path
            ? `url(https://image.tmdb.org/t/p/w1280${movie.backdrop_path})`
            : "linear-gradient(to bottom, #1a1a1a, #000)",
        }}
      >
        <div className="absolute inset-0 hero-gradient-both" />

        <a
          href="/"
          className="absolute top-5 left-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition text-xs"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          Back
        </a>
      </div>

      {/* CONTENT */}
      <div className="px-6 md:px-12 pb-10">
        <div className="max-w-7xl mx-auto">
          {/* POSTER + INFO ROW */}
          <div className="flex flex-col md:flex-row gap-6 -mt-20 relative z-10 mb-8">
            <div className="flex-shrink-0">
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                  alt={movie.title}
                  className="w-32 md:w-40 rounded-xl shadow-2xl border border-[var(--border-color)]"
                />
              ) : (
                <div className="w-32 md:w-40 h-48 md:h-60 rounded-xl shadow-2xl border border-[var(--border-color)] card-gradient flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-tertiary)]">
                    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/>
                    <path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-end pb-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-1">{movie.title}</h1>

              {movie.tagline && (
                <p className="text-[var(--text-secondary)] italic text-sm mb-3">{movie.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)] mb-3">
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--star-color)]">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-[var(--text-primary)] font-semibold">{movie.vote_average?.toFixed(1)}</span>
                  <span className="text-[var(--text-tertiary)]">/10</span>
                  <span className="text-[var(--text-tertiary)]">({movie.vote_count?.toLocaleString() ?? 0})</span>
                </span>
                <span className="text-[var(--text-tertiary)]">|</span>
                <span>{year}</span>
                <span className="text-[var(--text-tertiary)]">|</span>
                <span>{runtimeStr}</span>
                {movie.spoken_languages?.[0] && (
                  <>
                    <span className="text-[var(--text-tertiary)]">|</span>
                    <span>{movie.spoken_languages[0].english_name}</span>
                  </>
                )}
              </div>

              {movie.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {movie.genres.map((genre: any) => (
                    <span
                      key={genre.id}
                      className="px-2.5 py-0.5 bg-[var(--bg-card)] text-[11px] font-medium rounded-full text-[var(--text-primary)] border border-[var(--border-color)]"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 self-start">
                <a
                  href={`/watch/${id}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-accent text-white hover:bg-accent-hover rounded-lg text-sm font-semibold transition shadow-lg shadow-[var(--accent)]/20"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Watch Now
                </a>
                <WatchlistButton mediaId={parseInt(id, 10)} mediaType="movie" />
              </div>
            </div>
          </div>

          {/* PLOT + STATS + TRAILER */}
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-3 space-y-8">
              <div>
                <h2 className="text-sm text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Plot Summary</h2>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {movie.overview || "No plot summary available."}
                </p>
              </div>

              {trailerUrl && (
                <iframe
                  className="w-full aspect-video rounded-xl border border-[var(--border-color)] shadow-lg"
                  src={trailerUrl}
                  title={`${movie.title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>

            <div className="space-y-4">
              {movie.status && (
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Status</p>
                  <p className="text-[var(--text-primary)] text-sm font-medium">{movie.status || "—"}</p>
                </div>
              )}
              {movie.budget > 0 && (
                <div>
                  <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Budget</p>
                  <p className="text-sm">${(movie.budget / 1000000).toFixed(0)}M</p>
                </div>
              )}
              {movie.revenue > 0 && (
                <div>
                  <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Revenue</p>
                  <p className="text-sm">${(movie.revenue / 1000000).toFixed(0)}M</p>
                </div>
              )}
              {movie.popularity > 0 && (
                <div>
                  <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Popularity</p>
                  <p className="text-sm">{movie.popularity?.toFixed(0)}</p>
                </div>
              )}
              {movie.original_language && (
                <div>
                  <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Original Language</p>
                  <p className="text-sm">{movie.original_language.toUpperCase()}</p>
                </div>
              )}
            </div>
          </div>

          {/* PRODUCTION COMPANIES */}
          {movie.production_companies?.length > 0 && (
            <div className="pt-6 border-t border-[var(--border-color)]">
              <h3 className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Production Companies</h3>
              <div className="flex flex-wrap gap-x-5 gap-y-1">
                {movie.production_companies.map((c: any) => (
                  <span key={c.id} className="text-[var(--text-secondary)] text-xs">{c.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}