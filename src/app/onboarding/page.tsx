"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

interface Genre {
  id: number;
  name: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch("/api/genres")
      .then(r => r.json())
      .then(setGenres)
      .catch(() => {});
  }, [user]);

  const toggle = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev]);
  };

  const handleSave = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    const genreObjects = selected.map(id => {
      const g = genres.find(x => x.id === id);
      return { id, name: g?.name || "" };
    });
    try {
      await fetch("/api/preferences/genres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genres: genreObjects }),
      });
      await refresh();
      router.push("/");
    } catch {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-pink-500/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z"/>
              <path d="M8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold">What do you like to watch?</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Pick a few genres to personalize your recommendations
          </p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {genres.map(genre => (
            <button
              key={genre.id}
              onClick={() => toggle(genre.id)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                selected.includes(genre.id)
                  ? "bg-[var(--accent)] text-white border-[var(--accent)] shadow-lg shadow-[var(--accent)]/20"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)]"
              }`}
            >
              {genre.name}
            </button>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleSave}
            disabled={selected.length === 0 || saving}
            className="px-8 py-2.5 bg-[var(--accent)] text-white disabled:opacity-40 rounded-xl text-sm font-semibold transition hover:bg-[var(--accent-hover)] flex items-center gap-2 mx-auto"
          >
            {saving && <div className="w-4 h-4 spinner border-white/30 border-t-white" />}
            {saving ? "Saving..." : selected.length === 0 ? "Select a few genres" : `Continue with ${selected.length} genres`}
          </button>
          {selected.length === 0 && (
            <p className="text-[var(--text-tertiary)] text-xs mt-3">Select at least one genre to continue</p>
          )}
        </div>
      </div>
    </div>
  );
}
