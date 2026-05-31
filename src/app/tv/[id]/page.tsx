"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WatchlistButton from "@/components/WatchlistButton";

interface Season {
  season_number: number;
  episode_count: number;
  poster_path: string | null;
  air_date: string | null;
  name?: string;
  overview?: string;
}

interface Episode {
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  vote_average: number;
}

export default function TVShowPage() {
  const params = useParams();
  const id = params?.id as string;

  const [show, setShow] = useState<any>(null);
  const [seasonData, setSeasonData] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  // Fetch TV show details
  useEffect(() => {
    if (!id) return;
    fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=videos,content_ratings`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data?.id) {
          setShow(data);
          const seasons = (data.seasons || []).filter(
            (s: Season) => s.season_number > 0
          );
          setSeasonData(seasons);
          if (seasons.length > 0) {
            setSelectedSeason(seasons[0].season_number);
          }
        }
      })
      .catch(() => {});
  }, [id]);

  // Fetch episodes when season changes
  useEffect(() => {
    if (!id || !selectedSeason) return;
    setEpisodesLoading(true);
    fetch(
      `https://api.themoviedb.org/3/tv/${id}/season/${selectedSeason}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
    )
      .then((r) => r.json())
      .then((data) => {
        setEpisodes(data.episodes || []);
        setSelectedEpisode(1);
        setEpisodesLoading(false);
      })
      .catch(() => {
        setEpisodes([]);
        setEpisodesLoading(false);
      });
  }, [id, selectedSeason]);

  if (!show) {
    return (
      <main className="min-h-screen text-[var(--text-primary)] flex items-center justify-center">
        <div className="spinner" />
      </main>
    );
  }

  const currentEpisode = episodes.find(
    (e) => e.episode_number === selectedEpisode
  );
  const year = show.first_air_date?.slice(0, 4) || "N/A";
  const watchUrl = `/watch/${id}?season=${selectedSeason}&episode=${selectedEpisode}`;

  return (
    <main className="min-h-screen text-[var(--text-primary)]">
      {/* HERO */}
      <div
        className="relative h-[280px] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: show.backdrop_path
            ? `url(https://image.tmdb.org/t/p/w1280${show.backdrop_path})`
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
              {show.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w342${show.poster_path}`}
                  alt={show.name}
                  className="w-32 md:w-40 rounded-xl shadow-2xl border border-[var(--border-color)]"
                />
              ) : (
                <div className="w-32 md:w-40 h-48 md:h-60 rounded-xl shadow-2xl border border-[var(--border-color)] card-gradient flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-tertiary)]">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                    <path d="M8 21h8" /><path d="M12 17v4" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-end pb-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-1">{show.name}</h1>

              {show.tagline && (
                <p className="text-[var(--text-secondary)] italic text-sm mb-3">{show.tagline}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-secondary)] mb-3">
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--star-color)]">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-[var(--text-primary)] font-semibold">{show.vote_average?.toFixed(1)}</span>
                  <span className="text-[var(--text-tertiary)]">/10</span>
                  <span className="text-[var(--text-tertiary)]">({show.vote_count?.toLocaleString() ?? 0})</span>
                </span>
                <span className="text-[var(--text-tertiary)]">|</span>
                <span>{year}</span>
                <span className="text-[var(--text-tertiary)]">|</span>
                <span>{show.number_of_seasons} Season{show.number_of_seasons !== 1 ? "s" : ""}</span>
              </div>

              {show.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {show.genres.map((genre: any) => (
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
                  href={watchUrl}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-accent text-white hover:bg-accent-hover rounded-lg text-sm font-semibold transition shadow-lg shadow-[var(--accent)]/20"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  Watch S{selectedSeason}:E{selectedEpisode}
                </a>
                <WatchlistButton mediaId={parseInt(id, 10)} mediaType="tv" />
              </div>
            </div>
          </div>

          {/* PLOT + EPISODE SELECTOR */}
          <div className="grid md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-3 space-y-8">
              <div>
                <h2 className="text-sm text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Plot Summary</h2>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
                  {show.overview || "No overview available."}
                </p>
              </div>

              {/* SEASON / EPISODE SELECTOR */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">Season</label>
                    <select
                      value={selectedSeason}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-color)]"
                    >
                      {seasonData.map((s) => (
                        <option key={s.season_number} value={s.season_number}>
                          Season {s.season_number}
                          {s.name && s.name !== `Season ${s.season_number}` ? ` - ${s.name}` : ""}
                          {s.episode_count ? ` (${s.episode_count})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">Episode</label>
                    <select
                      value={selectedEpisode}
                      onChange={(e) => setSelectedEpisode(Number(e.target.value))}
                      className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-color)]"
                    >
                      {episodes.map((ep) => (
                        <option key={ep.episode_number} value={ep.episode_number}>
                          E{ep.episode_number} - {ep.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <a
                    href={watchUrl}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-accent text-white hover:bg-accent-hover rounded-lg text-sm font-semibold transition shadow-lg shadow-[var(--accent)]/20 self-end"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    Watch
                  </a>
                </div>

                {/* CURRENT EPISODE DETAILS */}
                {episodesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="spinner" />
                  </div>
                ) : currentEpisode ? (
                  <div className="bg-[var(--bg-tertiary)]/60 border border-[var(--border-color)] rounded-xl overflow-hidden">
                    {currentEpisode.still_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w780${currentEpisode.still_path}`}
                        alt={currentEpisode.name}
                        className="w-full aspect-video object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">
                          E{currentEpisode.episode_number} - {currentEpisode.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                          {currentEpisode.air_date && (
                            <span>{currentEpisode.air_date}</span>
                          )}
                          {currentEpisode.vote_average > 0 && (
                            <span className="flex items-center gap-1 text-[var(--star-color)]">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                              {currentEpisode.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                        {currentEpisode.overview || "No episode overview available."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-[var(--text-tertiary)] text-sm py-4">No episodes found for this season.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {show.status && (
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Status</p>
                  <p className="text-sm">{show.status}</p>
                </div>
              )}
              {show.first_air_date && (
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">First Aired</p>
                  <p className="text-sm">{show.first_air_date}</p>
                </div>
              )}
              {show.last_air_date && (
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Last Aired</p>
                  <p className="text-sm">{show.last_air_date}</p>
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Seasons</p>
                <p className="text-sm">{show.number_of_seasons}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Episodes</p>
                <p className="text-sm">{show.number_of_episodes}</p>
              </div>
              {show.networks?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Network</p>
                  <div className="flex items-center gap-2 mt-1">
                    {show.networks.map((n: any) => (
                      n.logo_path ? (
                        <img
                          key={n.id}
                          src={`https://image.tmdb.org/t/p/w92${n.logo_path}`}
                          alt={n.name}
                          className="h-6 object-contain bg-[var(--bg-card)] rounded px-1"
                        />
                      ) : (
                        <span key={n.id} className="text-sm text-[var(--text-secondary)]">{n.name}</span>
                      )
                    ))}
                  </div>
                </div>
              )}
              {show.created_by?.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">Created by</p>
                  <p className="text-sm">{show.created_by.map((c: any) => c.name).join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
