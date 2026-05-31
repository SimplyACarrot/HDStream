"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function WatchlistButton({ mediaId, mediaType }: { mediaId: number; mediaType: "movie" | "tv" }) {
  const { user } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch(`/api/watchlist/${mediaType}/${mediaId}`)
      .then((r) => r.json())
      .then((data) => setInWatchlist(data.inWatchlist))
      .catch(() => {});
  }, [user, mediaId, mediaType]);

  const toggle = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, mediaType, action: inWatchlist ? "remove" : "add" }),
      });
      const data = await res.json();
      if (data.success) setInWatchlist(data.inWatchlist);
    } catch {}
    setLoading(false);
  };

  return (
    <button
      onClick={() => {
        if (!user) { window.location.href = "/auth/login"; return; }
        toggle();
      }}
      type="button"
      className={"inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition border cursor-pointer " + (inWatchlist ? "bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--card-hover)]" : "bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-[var(--card-hover)] hover:border-[var(--border-color)]")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill={inWatchlist ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
      {inWatchlist ? "\u2212 Watchlist" : "+ Watchlist"}
    </button>
  );
}
