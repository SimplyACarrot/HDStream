"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  vote_average: number;
  vote_count: number;
  release_date: string;
  overview?: string;
  genre_ids?: number[];
  media_type?: string;
}

interface Genre {
  id: number;
  name: string;
}

const TAB_SECTIONS: Record<string, { title: string; category: string; subtitle: string }[]> = {
  movies: [
    { title: "Trending", category: "trending", subtitle: "What everyone's buzzing about" },
    { title: "Popular", category: "popular", subtitle: "Fan favorites" },
    { title: "Top Rated", category: "top-rated", subtitle: "Critically acclaimed" },
    { title: "New & Notable", category: "new-releases", subtitle: "Fresh releases" },
  ],
  tv: [
    { title: "Trending", category: "trending", subtitle: "What everyone's buzzing about" },
    { title: "Popular", category: "popular", subtitle: "Fan favorites" },
    { title: "Top Rated", category: "top-rated", subtitle: "Critically acclaimed" },
    { title: "New & Notable", category: "new-shows", subtitle: "Fresh releases" },
  ],
  animation: [
    { title: "Trending", category: "trending", subtitle: "Most popular animation" },
    { title: "Popular", category: "popular", subtitle: "Fan favorite animated" },
    { title: "Top Rated", category: "top-rated", subtitle: "Highest rated animation" },
    { title: "New & Notable", category: "new-notable", subtitle: "Recent animation releases" },
  ],
};

const SECTION_COLORS: Record<string, string> = {
  trending: "bg-rose-500",
  popular: "bg-orange-500",
  "top-rated": "bg-violet-500",
  "new-releases": "bg-sky-500",
  "new-shows": "bg-indigo-500",
  "new-notable": "bg-emerald-500",
  recommended: "bg-amber-500",
  continue: "bg-teal-500",
  watchlist: "bg-cyan-500",
};

const MOODS = [
  { id: "intense-thrills", label: "Intense Thrills", icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z", emoji: "🔥" },
  { id: "chill-relax", label: "Chill & Relax", icon: "M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z", emoji: "😌" },
  { id: "action-packed", label: "Action Packed", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z", emoji: "💥" },
  { id: "heartwarming", label: "Heartwarming", icon: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z", emoji: "❤️" },
  { id: "nighttime-vibes", label: "Nighttime Vibes", icon: "M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z", emoji: "🌙" },
];

const PROVIDERS = [
  { id: "netflix", label: "Netflix", color: "bg-red-700 hover:bg-red-600" },
  { id: "disney", label: "Disney+", color: "bg-blue-600 hover:bg-blue-500" },
  { id: "apple", label: "Apple TV+", color: "bg-gray-800 hover:bg-gray-700" },
  { id: "prime", label: "Amazon Prime", color: "bg-cyan-700 hover:bg-cyan-600" },
  { id: "hbo", label: "HBO", color: "bg-purple-700 hover:bg-purple-600" },
];

const GREETINGS = ["Hi", "Hello", "Hey", "What's up", "Howdy", "Hiya", "Greetings", "What's good", "Hey there"];

function randomGreeting(): string {
  return GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
}

const MovieCard = ({ movie, index, grid, landscape }: { movie: Movie; index: number; grid?: boolean; landscape?: boolean }) => (
  <a
    href={landscape ? `/tv/${movie.id}` : movie.media_type === "tv" ? `/tv/${movie.id}` : `/movie/${movie.id}`}
    className={`group/card bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)] overflow-hidden flex flex-col snap-start transition-all duration-500 relative z-10 hover:z-20 animate-scale-fade-in ${
      grid ? "w-full" : "min-w-[180px] w-[180px]"
    }`}
    style={{ animationDelay: `${index * 60}ms` }}
  >
    <div className="relative overflow-hidden">
      {landscape ? (
        <>
          {(movie.backdrop_path || movie.poster_path) ? (
            <img
              src={`https://image.tmdb.org/t/p/w780${movie.backdrop_path || movie.poster_path}`}
              alt={movie.title}
              className="h-44 w-full object-cover transition-all duration-500 group-hover/card:scale-105 group-hover/card:brightness-110"
            />
          ) : (
            <div className="h-44 w-full card-gradient flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-tertiary)]">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <path d="M8 21h8" /><path d="M12 17v4" />
              </svg>
            </div>
          )}
          <div className="hover-gradient-overlay opacity-0 group-hover/card:opacity-100" />
          <div className="absolute top-2 right-2 bg-[var(--bg-primary)]/70 backdrop-blur-sm rounded-lg px-2 py-0.5 text-xs font-semibold text-[var(--star-color)] flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {movie.vote_average?.toFixed(1) ?? "N/A"}
          </div>
        </>
      ) : (
        <>
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="h-64 w-full object-cover transition-all duration-500 group-hover/card:scale-105 group-hover/card:brightness-110"
            />
          ) : (
            <div className="h-64 w-full card-gradient flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-tertiary)]">
                <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/>
                <path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
          )}
          <div className="hover-gradient-overlay opacity-0 group-hover/card:opacity-100" />
          <div className="absolute top-2 right-2 bg-[var(--bg-primary)]/70 backdrop-blur-sm rounded-lg px-2 py-0.5 text-xs font-semibold text-[var(--star-color)] flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            {movie.vote_average?.toFixed(1) ?? "N/A"}
          </div>
        </>
      )}
    </div>
    <div className="p-3 flex flex-col gap-1 flex-1">
      <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover/card:text-[var(--text-primary)] transition-colors">
        {movie.title}
      </h3>
      <p className="text-[11px] font-medium text-[var(--text-secondary)]">
        {movie.release_date ? movie.release_date.slice(0, 4) : "Unknown"}
      </p>
    </div>
  </a>
);

const ArrowButton = ({ direction, onClick, show }: { direction: "left" | "right"; onClick: () => void; show: boolean }) => (
  <button
    onClick={onClick}
    className={`absolute ${direction === "left" ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 z-30
      w-10 h-10 rounded-full flex items-center justify-center
      bg-[var(--bg-tertiary)] backdrop-blur-md border border-[var(--border-color)]
      text-[var(--text-primary)] shadow-lg shadow-[var(--shadow-color)]
      transition-all duration-300 ease-out
      opacity-0 group-hover/section:opacity-100
      hover:scale-110 hover:bg-[var(--card-hover)]
      active:scale-95 ${show ? "pointer-events-auto" : "pointer-events-none opacity-0"}`}
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {direction === "left" ? <path d="M15 18l-6-6 6-6" /> : <path d="M9 18l6-6-6-6" />}
    </svg>
  </button>
);

const MovieSection = ({ section, movies, index }: { section: { title: string; category?: string; subtitle: string }; movies: Movie[]; index: number }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const updateArrows = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 10);
    setShowRight(scrollLeft + clientWidth < scrollWidth - 10);
  };

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -scrollRef.current.clientWidth * 0.75 : scrollRef.current.clientWidth * 0.75,
      behavior: "smooth",
    });
  };

  useEffect(() => { updateArrows(); }, [movies]);

  const colorClass = SECTION_COLORS[section.category || ""] || "bg-red-500";

  return (
    <div className="mb-12 animate-fade-in-up" style={{ animationDelay: `${index * 120}ms` }}>
      <div className="mb-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className={`w-1 h-8 ${colorClass} rounded-full`} />
          <div>
            <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
            <p className="text-xs text-[var(--text-secondary)]">{section.subtitle}</p>
          </div>
        </div>
      </div>
      <div className="relative isolate group/section">
        <div className={`pointer-events-none absolute left-0 top-0 bottom-0 w-24 z-20 hero-gradient-right transition-opacity duration-500 ${showLeft ? "opacity-100" : "opacity-0"}`} />
        <div className={`pointer-events-none absolute right-0 top-0 bottom-0 w-24 z-20 hero-gradient-both transition-opacity duration-500 ${showRight ? "opacity-100" : "opacity-0"}`} />
        <ArrowButton direction="left" onClick={() => scroll("left")} show={showLeft} />
        <ArrowButton direction="right" onClick={() => scroll("right")} show={showRight} />
        <div ref={scrollRef} onScroll={updateArrows} className="flex gap-3 overflow-x-hidden snap-x scrollbar-hide pb-2">
          {movies.length > 0 ? (
            movies.map((movie, i) => <MovieCard key={movie.id} movie={movie} index={i} />)
          ) : (
            <div className="text-[var(--text-tertiary)] py-12 text-center w-full text-sm">Loading...</div>
          )}
        </div>
      </div>
    </div>
  );
};

const HeroBanner = ({ movies }: { movies: Movie[] }) => {
  const featured = movies?.[0];
  if (!featured) return null;
  const backdrop = featured.backdrop_path ? `https://image.tmdb.org/t/p/w1280${featured.backdrop_path}` : null;
  return (
    <a href={`/movie/${featured.id}`} className="relative block w-full h-[380px] rounded-2xl overflow-hidden mb-10 group/hero">
      {backdrop ? (
        <>
          <img src={backdrop} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover/hero:scale-105" />
          <div className="absolute inset-0 hero-gradient-bottom" />
          <div className="hero-glow" />
        </>
      ) : (
        <div className="absolute inset-0 card-gradient" />
      )}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-accent text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">Featured</span>
          {featured.vote_average > 0 && (
            <span className="flex items-center gap-1 text-sm text-[var(--star-color)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
              {featured.vote_average?.toFixed(1)}
            </span>
          )}
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 drop-shadow-lg">{featured.title}</h1>
        {featured.release_date && <p className="text-sm text-[var(--text-secondary)] mb-4">{featured.release_date.slice(0, 4)}</p>}
        <div className="inline-flex items-center gap-2 bg-[var(--accent)] text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 hover:bg-[var(--accent-hover)] hover:scale-105 active:scale-95 group-hover/hero:shadow-xl shadow-lg shadow-[var(--accent)]/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          Watch Now
        </div>
      </div>
    </a>
  );
};

function AuthHeaderButtons() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (loading) return <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] animate-pulse shrink-0" />;

  if (user) {
    return (
      <div ref={ref} className="relative shrink-0 flex items-center gap-2">
        <button onClick={() => setOpen(!open)} className="w-8 h-8 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center hover:bg-accent-hover transition overflow-hidden">
          {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : (user.username || user.firstName).charAt(0).toUpperCase()}
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-xl z-50 min-w-[180px] py-1 animate-dropdown">
            <div className="px-4 py-2.5 text-xs text-[var(--text-secondary)] border-b border-[var(--border-color)]">
              {user.firstName}<br/><span className="text-[var(--text-tertiary)]">{user.email}</span>
            </div>
            <a href="/account/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Profile
            </a>
            <a href="/account/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>Account settings
            </a>
            <button onClick={() => { logout(); setOpen(false); }} className="flex items-center gap-2 w-full text-left px-4 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition border-t border-[var(--border-color)] mt-1 pt-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Log out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button onClick={() => setOpen(!open)} className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] border border-[var(--border-color)] flex items-center justify-center transition">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 10-16 0"/></svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-xl z-50 min-w-[160px] py-1 animate-dropdown">
          <a href="/auth/login" onClick={() => setOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition">Log in</a>
          <a href="/auth/register" onClick={() => setOpen(false)} className="block w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition">Register</a>
        </div>
      )}
    </div>
  );
}

const GridSection = ({ movies, mediaType }: { movies: Movie[]; mediaType: string }) => {
  if (movies.length === 0) return null;
  return (
    <div className={`grid gap-4 ${
      mediaType === "tv" || mediaType === "animation"
        ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
    }`}>
      {movies.map((movie, i) => (
        <MovieCard key={`${movie.id}-${i}`} movie={movie} index={i} grid landscape={mediaType === "tv" || mediaType === "animation"} />
      ))}
    </div>
  );
};

export default function Home() {
  const [movieSections, setMovieSections] = useState<Record<string, Movie[]>>({});
  const [tvSections, setTvSections] = useState<Record<string, Movie[]>>({});
  const [animSections, setAnimSections] = useState<Record<string, Movie[]>>({});
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [recommended, setRecommended] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [activeTab, setActiveTab] = useState<"home" | "movies" | "tv" | "animation">("home");
  const [mediaType, setMediaType] = useState<"movies" | "tv" | "animation">("movies");
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [browseResults, setBrowseResults] = useState<Movie[]>([]);
  const [browseTotal, setBrowseTotal] = useState(0);
  const [browseTotalPages, setBrowseTotalPages] = useState(0);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestions, setSuggestions] = useState<Movie[]>([]);
  const [continueWatching, setContinueWatching] = useState<Movie[]>([]);
  const [watchlistItems, setWatchlistItems] = useState<Movie[]>([]);
  const [greeting, setGreeting] = useState("");
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [moodResults, setMoodResults] = useState<Movie[]>([]);
  const [moodLoading, setMoodLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [providerResults, setProviderResults] = useState<Movie[]>([]);
  const [providerLoading, setProviderLoading] = useState(false);
  const [recommendedMediaType, setRecommendedMediaType] = useState<"movies" | "tv">("movies");
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const filtersPanelRef = useRef<HTMLDivElement>(null);
  const moodCache = useRef<Record<string, Movie[]>>({});
  const providerCache = useRef<Record<string, Movie[]>>({});
  const { user } = useAuth();

  useEffect(() => { setGreeting(randomGreeting()); }, []);

  useEffect(() => {
    if (!user) { setContinueWatching([]); setWatchlistItems([]); setRecommended([]); return; }
    Promise.all([
      fetch("/api/progress").then(r => r.json()),
      fetch("/api/watchlist").then(r => r.json()),
      fetch("/api/recommended").then(r => r.json()),
    ]).then(([progress, watchlist, rec]) => {
      setContinueWatching(progress.results || []);
      setWatchlistItems(watchlist.results || []);
      setRecommended(rec.results || []);
    }).catch(() => {});
  }, [user]);

  useEffect(() => {
    const loadAllSections = async () => {
      const categories = ["trending", "popular", "top-rated", "new-releases", "new-shows", "new-notable"];
      const loadCategory = async (cat: string, mt: string) => {
        try {
          const res = await fetch(`/api/movies?category=${cat}&media_type=${mt}`);
          return { key: cat, movies: await res.json() };
        } catch { return { key: cat, movies: [] }; }
      };

      const [movieRaw, tvRaw, animMovieRaw, animTvRaw] = await Promise.all([
        Promise.all(categories.map(c => loadCategory(c, "movies"))),
        Promise.all(categories.map(c => loadCategory(c, "tv"))),
        Promise.all(["trending", "popular", "top-rated", "new-notable"].map(c => loadCategory(c, "animation"))),
        Promise.all(["trending", "popular", "top-rated", "new-notable"].map(c => loadCategory(c, "animation&media_type=tv"))),
      ]);

      const dedup = (raw: { key: string; movies: Movie[] }[]): Record<string, Movie[]> => {
        const sections: Record<string, Movie[]> = {};
        for (const { key, movies } of raw) {
          const seen = new Set<number>();
          const unique: Movie[] = [];
          for (const m of movies) {
            if (unique.length >= 20) break;
            if (!seen.has(m.id)) { seen.add(m.id); unique.push(m); }
          }
          sections[key] = unique;
        }
        return sections;
      };

      setMovieSections(dedup(movieRaw));
      setTvSections(dedup(tvRaw));
      const animMerged: Record<string, Movie[]> = {};
      for (let i = 0; i < animMovieRaw.length; i++) {
        const key = animMovieRaw[i].key;
        const seen = new Set<number>();
        const merged: Movie[] = [];
        for (const m of [...(animMovieRaw[i]?.movies || []), ...(animTvRaw[i]?.movies || [])]) {
          if (merged.length >= 20) break;
          if (!seen.has(m.id)) { seen.add(m.id); merged.push(m); }
        }
        animMerged[key] = merged;
      }
      setAnimSections(animMerged);
      setSectionsLoaded(true);
    };

    loadAllSections();
    fetch("/api/genres").then(r => r.json()).then(setGenres).catch(() => {});
  }, []);

  useEffect(() => {
    const moodIds = MOODS.map(m => m.id);
    const providerIds = PROVIDERS.map(p => p.id);
    Promise.all([
      ...moodIds.map(id => fetch(`/api/mood?mood=${id}`).then(r => r.json()).then(data => { moodCache.current[id] = data.results || []; }).catch(() => {})),
      ...providerIds.map(id => fetch(`/api/providers?provider=${id}`).then(r => r.json()).then(data => { providerCache.current[id] = data.results || []; }).catch(() => {})),
    ]);
  }, []);

  useEffect(() => {
    if (!activeMood) return;
    const cached = moodCache.current[activeMood];
    if (cached) {
      setMoodResults(cached);
      return;
    }
    setMoodLoading(true);
    fetch(`/api/mood?mood=${activeMood}`)
      .then(r => r.json())
      .then(data => {
        const results = data.results || [];
        moodCache.current[activeMood] = results;
        setMoodResults(results);
        setMoodLoading(false);
      })
      .catch(() => { setMoodResults([]); setMoodLoading(false); });
  }, [activeMood]);

  useEffect(() => {
    if (!activeProvider) return;
    const cached = providerCache.current[activeProvider];
    if (cached) {
      setProviderResults(cached);
      return;
    }
    setProviderLoading(true);
    fetch(`/api/providers?provider=${activeProvider}`)
      .then(r => r.json())
      .then(data => {
        const results = data.results || [];
        providerCache.current[activeProvider] = results;
        setProviderResults(results);
        setProviderLoading(false);
      })
      .catch(() => { setProviderResults([]); setProviderLoading(false); });
  }, [activeProvider]);

  useEffect(() => {
    if (activeTab === "home") return;
    setBrowseLoading(true);
    let params = new URLSearchParams({ page: "1", fetch_pages: "3", browse: "1", media_type: mediaType });
    if (search.trim()) params.set("query", search.trim());
    if (selectedGenres.length > 0) params.set("with_genres", selectedGenres.join(","));
    if (yearFrom) params.set("year_from", yearFrom);
    if (yearTo) params.set("year_to", yearTo);
    fetch(`/api/movies?${params}`)
      .then(r => r.json())
      .then(data => {
        const results = rankMovies(data.results || []);
        setBrowseResults(results);
        setBrowseTotal(data.total || results.length || 0);
        setBrowseTotalPages(data.totalPages || 1);
        setBrowsePage(1);
        setBrowseLoading(false);
      })
      .catch(() => { setBrowseResults([]); setBrowseLoading(false); });
  }, [activeTab, mediaType, search, selectedGenres, yearFrom, yearTo]);

  useEffect(() => {
    const query = search.trim();
    if (!query) { setSuggestions([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/movies?query=${encodeURIComponent(query)}&combined=1`)
        .then(r => r.json())
        .then(data => setSuggestions(rankMovies(data.results || []).slice(0, 5)))
        .catch(() => setSuggestions([]));
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) setShowSuggestions(false);
      if (filtersPanelRef.current && !filtersPanelRef.current.contains(e.target as Node)) setShowFilters(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function rankMovies(m: Movie[]): Movie[] {
    return [...m].sort((a, b) => {
      const aComplete = (a.poster_path ? 2 : 0) + (a.overview ? 1 : 0);
      const bComplete = (b.poster_path ? 2 : 0) + (b.overview ? 1 : 0);
      if (aComplete !== bComplete) return bComplete - aComplete;
      if (b.vote_count !== a.vote_count) return b.vote_count - a.vote_count;
      return (b.vote_average || 0) - (a.vote_average || 0);
    });
  }

  const selectTab = (tab: "home" | "movies" | "tv" | "animation") => {
    setActiveTab(tab);
    if (tab !== "home") {
      const mt = tab === "tv" ? "tv" : tab === "animation" ? "animation" : "movies";
      setMediaType(mt);
    }
    setShowSuggestions(false);
    setActiveMood(null);
    setMoodResults([]);
    setActiveProvider(null);
    setProviderResults([]);
  };

  const loadMore = async () => {
    if (loadingMore || browsePage >= browseTotalPages) return;
    setLoadingMore(true);
    const nextPage = browsePage + 1;
    let params = new URLSearchParams({ page: String(nextPage), fetch_pages: "3", browse: "1", media_type: mediaType });
    if (search.trim()) params.set("query", search.trim());
    if (selectedGenres.length > 0) params.set("with_genres", selectedGenres.join(","));
    if (yearFrom) params.set("year_from", yearFrom);
    if (yearTo) params.set("year_to", yearTo);
    try {
      const res = await fetch(`/api/movies?${params}`);
      const data = await res.json();
      setBrowseResults(prev => [...prev, ...rankMovies(data.results || [])]);
      setBrowsePage(nextPage);
    } catch {}
    setLoadingMore(false);
  };

  const clearAllFilters = () => { setSearch(""); setSelectedGenres([]); setYearFrom(""); setYearTo(""); };

  const trendingRaw = movieSections["trending"] || [];
  const hasFilters = selectedGenres.length > 0 || yearFrom || yearTo;

  const getBrowseSections = () => {
    if (activeTab === "movies" || activeTab === "home") return { sections: movieSections, defs: TAB_SECTIONS.movies };
    if (activeTab === "tv") return { sections: tvSections, defs: TAB_SECTIONS.tv };
    return { sections: animSections, defs: TAB_SECTIONS.animation };
  };

  const isBrowseTab = activeTab !== "home";

  return (
    <main className="min-h-screen text-[var(--text-primary)]">
      {}
      <header className="sticky top-0 z-50 bg-[var(--bg-secondary)]/80 backdrop-blur-xl border-b border-[var(--border-color)] px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => selectTab("home")} className="text-xl font-bold tracking-tight bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent shrink-0 hover:opacity-80 transition-opacity">
                HDStream
              </button>
              <div className="w-px h-5 bg-[var(--border-color)]" />
              <div className="flex items-center gap-1">
                {(["home"] as const).map(tab => (
                  <button key={tab} onClick={() => selectTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "home" ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]"}`}>
                    Home
                  </button>
                ))}
                <div className="w-px h-4 bg-[var(--border-color)] mx-1" />
                {(["movies", "tv", "animation"] as const).map(tab => (
                  <button key={tab} onClick={() => selectTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]"}`}>
                    {tab === "tv" ? "TV Shows" : tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div ref={searchWrapRef} className="relative w-56">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
                <input value={search} onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }} onFocus={() => search.trim() && setShowSuggestions(true)} onKeyDown={e => { if (e.key === "Enter" && search.trim()) { if (activeTab === "home") selectTab("movies"); } }}
                  placeholder="Search movies & TV..." className="w-full pl-9 pr-8 py-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm placeholder-theme focus:outline-none focus:border-[var(--border-color)] focus:ring-0 transition-colors" />
                {search && (
                  <button onClick={() => { setSearch(""); setShowSuggestions(false); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18" /><path d="M6 6l12 12" /></svg>
                  </button>
                )}
                {showSuggestions && search.trim() && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-xl z-50 animate-dropdown">
                    {suggestions.map(movie => (
                      <a key={movie.id} href={movie.media_type === "tv" ? `/tv/${movie.id}` : `/movie/${movie.id}`} className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--card-hover)] transition text-sm">
                        {movie.poster_path ? <img src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} alt="" className="w-8 h-12 rounded object-cover bg-[var(--bg-tertiary)] shrink-0" /> : <div className="w-8 h-12 rounded bg-[var(--bg-tertiary)] shrink-0 flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-tertiary)]"><path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/><path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/><path d="M21 15l-5-5L5 21"/></svg></div>}
                        <div className="min-w-0"><div className="font-medium truncate">{movie.title}</div><div className="text-[var(--text-secondary)] text-xs">{movie.release_date?.slice(0, 4) || "—"}</div></div>
                      </a>
                    ))}
                    <button onClick={() => selectTab(activeTab === "home" ? "movies" : activeTab)} className="w-full text-center text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] py-2.5 border-t border-[var(--border-color)] transition">View all results →</button>
                  </div>
                )}
              </div>

              <div ref={filtersPanelRef} className="relative shrink-0">
                <button onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${hasFilters ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]/60"}`}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="10" y1="18" x2="14" y2="18" /></svg>
                  Filters{hasFilters && <span className="bg-white/20 text-[var(--text-primary)] text-[10px] px-1.5 py-0.5 rounded-full">{selectedGenres.length + (yearFrom ? 1 : 0) + (yearTo ? 1 : 0)}</span>}
                </button>
                {showFilters && (
                  <div className="absolute right-0 top-full mt-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl shadow-xl z-50 p-4 w-80 animate-dropdown">
                    <div className="text-sm font-semibold mb-3">Filters</div>
                    {genres.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs text-[var(--text-secondary)] mb-2">Genres</div>
                        <div className="flex flex-wrap gap-1.5">
                          {genres.map(genre => (
                            <button key={genre.id} onClick={() => setSelectedGenres(prev => prev.includes(genre.id) ? prev.filter(id => id !== genre.id) : [...prev, genre.id])}
                              className={`whitespace-nowrap px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${selectedGenres.includes(genre.id) ? "bg-[var(--accent)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]"}`}>
                              {genre.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="mb-3">
                      <div className="text-xs text-[var(--text-secondary)] mb-2">Release Year</div>
                      <div className="flex items-center gap-2">
                        <input type="number" min="1900" max="2030" value={yearFrom} onChange={e => setYearFrom(e.target.value)} placeholder="From" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none" />
                        <span className="text-[var(--text-tertiary)] text-xs">—</span>
                        <input type="number" min="1900" max="2030" value={yearTo} onChange={e => setYearTo(e.target.value)} placeholder="To" className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none" />
                      </div>
                    </div>
                    {hasFilters && <button onClick={clearAllFilters} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Clear all filters</button>}
                  </div>
                )}
              </div>
              <AuthHeaderButtons />
            </div>
          </div>
        </div>
      </header>

      {}
      <div className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {}
          {isBrowseTab && (
            <div className="mb-16 animate-fade-in-up">
              {sectionsLoaded && (() => {
                const { sections, defs } = getBrowseSections();
                return defs.map((section, i) => {
                  const movies = sections[section.category] || [];
                  if (movies.length === 0) return null;
                  return <MovieSection key={section.category} section={section} movies={movies} index={i} />;
                });
              })()}

              {}
              {user && recommended.length > 0 && (
                <MovieSection section={{ title: "Recommended For You", subtitle: "Based on what you've watched", category: "recommended" }} movies={recommended} index={5} />
              )}

              {}
              <div className="mb-8 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
                  <div>
                    <h2 className="text-lg font-bold">{search.trim() ? `Search: "${search.trim()}"` : activeTab === "tv" ? "TV Shows" : activeTab === "animation" ? "Animation" : "All Movies"}</h2>
                  </div>
                  {!browseLoading && <span className="text-sm text-[var(--text-secondary)]">{browseTotal > 0 ? `${browseTotal} results` : `${browseResults.length} results`}</span>}
                </div>

                <div className="px-5 py-4 border-b border-[var(--border-color)]">
                  <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-3">Genres</div>
                  <div className="flex flex-wrap gap-1.5">
                    {genres.map(genre => (
                      <button key={genre.id} onClick={() => setSelectedGenres(prev => prev.includes(genre.id) ? prev.filter(id => id !== genre.id) : [...prev, genre.id])}
                        className={`whitespace-nowrap px-3 py-1 rounded-full text-xs font-semibold transition-colors ${selectedGenres.includes(genre.id) ? "bg-accent text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]"}`}>
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold">Release Year</span>
                    <div className="flex items-center gap-2">
                      <input type="number" min="1900" max="2030" value={yearFrom} onChange={e => setYearFrom(e.target.value)} placeholder="From" className="w-20 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none" />
                      <span className="text-[var(--text-tertiary)] text-xs">—</span>
                      <input type="number" min="1900" max="2030" value={yearTo} onChange={e => setYearTo(e.target.value)} placeholder="To" className="w-20 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-2.5 py-1.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none" />
                    </div>
                  </div>
                  {hasFilters && <button onClick={clearAllFilters} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Clear all filters</button>}
                </div>
              </div>

              {}
              {browseLoading && browseResults.length === 0 ? (
                <div className="flex items-center justify-center py-20"><div className="w-8 h-8 spinner" /></div>
              ) : browseResults.length > 0 ? (
                <div className={browseLoading ? "opacity-50" : ""}>
                  <GridSection movies={browseResults} mediaType={mediaType} />
                  {browsePage < browseTotalPages && (
                    <div className="flex justify-center mt-8">
                      <button onClick={loadMore} disabled={loadingMore} className="px-8 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)]/60 disabled:opacity-50 rounded-xl text-sm font-medium transition">
                        {loadingMore ? <span className="flex items-center gap-2"><div className="w-4 h-4 spinner" />Loading...</span> : "Load more"}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-[var(--text-tertiary)] py-20 text-center text-sm">No results found. Try different filters.</div>
              )}
            </div>
          )}

          {}
          {activeTab === "home" && (
            <>
              {user && sectionsLoaded && (
                <div className="mb-6 animate-fade-in-up">
                  <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    {greeting}, {user.greetingPreference === "username" && user.username ? user.username : user.firstName}
                  </h1>
                  <div className="flex items-center gap-4 text-sm">
                    {watchlistItems.length > 0 && <><a href="#your-watchlist" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>Watchlist</a><span className="text-[var(--text-tertiary)]">|</span></>}
                    {continueWatching.length > 0 && <><a href="#continue-watching" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Continue Watching</a><span className="text-[var(--text-tertiary)]">|</span></>}
                    <a href="/account/settings" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition flex items-center gap-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>Account settings</a>
                  </div>
                </div>
              )}
              {sectionsLoaded && <HeroBanner movies={trendingRaw} />}

              {}
              {user && recommended.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-8 bg-amber-500 rounded-full" />
                      <h2 className="text-xl font-bold">Recommended For You</h2>
                    </div>
                    <div className="flex items-center gap-1 bg-[var(--bg-tertiary)] rounded-lg p-0.5 border border-[var(--border-color)]">
                      <button onClick={() => setRecommendedMediaType("movies")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${recommendedMediaType === "movies" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>Movies</button>
                      <button onClick={() => setRecommendedMediaType("tv")}
                        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${recommendedMediaType === "tv" ? "bg-[var(--accent)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}>TV Shows</button>
                    </div>
                  </div>
                  <div className="flex gap-3 overflow-x-auto snap-x scrollbar-hide pb-2">
                    {recommended.filter(m => recommendedMediaType === "tv" ? m.media_type === "tv" : true).slice(0, 20).map((movie, i) => (
                      <MovieCard key={movie.id} movie={movie} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {}
              {user && continueWatching.length > 0 && (
                <MovieSection section={{ title: "Continue Watching", subtitle: "Pick up where you left off", category: "continue" }} movies={continueWatching} index={1} />
              )}

              {}
              {user && watchlistItems.length > 0 && (
                <MovieSection section={{ title: "Your Watchlist", subtitle: "Saved for later", category: "watchlist" }} movies={watchlistItems} index={2} />
              )}

              {}
              <div className="mb-12 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <div className="w-1 h-8 bg-pink-500 rounded-full shrink-0" />
                  <h2 className="text-xl font-bold shrink-0">What's your mood?</h2>
                  <div className="h-5 w-px bg-[var(--border-color)] shrink-0" />
                  <div className="flex items-center gap-2">
                    {MOODS.map(mood => (
                      <button key={mood.id} onClick={() => setActiveMood(activeMood === mood.id ? null : mood.id)}
                        className={`text-xs font-semibold transition-all duration-200 pb-0.5 border-b-2 ${activeMood === mood.id ? "text-[var(--text-primary)] border-[var(--accent)]" : "text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:border-[var(--text-tertiary)]"}`}>
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>
                {activeMood && moodLoading && moodResults.length === 0 && (
                  <div className="flex items-center justify-center py-12"><div className="w-6 h-6 spinner" /></div>
                )}
                {activeMood && moodResults.length > 0 && (
                  <div key={activeMood} className={`mt-4 flex gap-3 overflow-x-auto snap-x scrollbar-hide pb-2 ${moodLoading ? "opacity-50" : ""}`}>
                    {moodResults.slice(0, 20).map((movie, i) => (
                      <MovieCard key={movie.id} movie={movie} index={i} />
                    ))}
                  </div>
                )}
              </div>

              {}
              <div className="mb-12 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-5 flex-wrap">
                  <div className="w-1 h-8 bg-blue-500 rounded-full shrink-0" />
                  <h2 className="text-xl font-bold shrink-0">Series</h2>
                  <div className="h-5 w-px bg-[var(--border-color)] shrink-0" />
                  <div className="flex items-center gap-2">
                    {PROVIDERS.map(p => (
                      <button key={p.id} onClick={() => setActiveProvider(activeProvider === p.id ? null : p.id)}
                        className={`text-xs font-semibold transition-all duration-200 pb-0.5 border-b-2 ${activeProvider === p.id ? "text-[var(--text-primary)] border-[var(--accent)]" : "text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)] hover:border-[var(--text-tertiary)]"}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                {activeProvider && providerLoading && providerResults.length === 0 && (
                  <div className="flex items-center justify-center py-12"><div className="w-6 h-6 spinner" /></div>
                )}
                {activeProvider && providerResults.length > 0 && (
                  <div key={activeProvider} className={`mt-4 flex gap-3 overflow-x-auto snap-x scrollbar-hide pb-2 ${providerLoading ? "opacity-50" : ""}`}>
                    {providerResults.slice(0, 20).map((movie, i) => (
                      <MovieCard key={movie.id} movie={movie} index={i} />
                    ))}
                  </div>
                )}
              </div>

              {}
              {sectionsLoaded && (
                <MovieSection section={{ title: "Trending", category: "trending", subtitle: "What everyone's buzzing about" }} movies={trendingRaw} index={3} />
              )}
              {sectionsLoaded && movieSections["popular"] && movieSections["popular"].length > 0 && (
                <MovieSection section={{ title: "Popular", category: "popular", subtitle: "Fan favorites" }} movies={movieSections["popular"]} index={4} />
              )}

              {}
              <div className="mb-8 animate-fade-in-up">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-8 bg-green-500 rounded-full" />
                  <div>
                    <h2 className="text-xl font-bold">Genres</h2>
                    <p className="text-xs text-[var(--text-secondary)]">Browse by category</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {genres.map(genre => (
                    <button key={genre.id} onClick={() => { setSelectedGenres([genre.id]); selectTab("movies"); }}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] border border-[var(--border-color)] transition-colors">
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
