"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface Theme {
  id: string;
  name: string;
  type: "vibrant" | "pastel";
  accent: string;
  accentHover: string;
  accentLight: string;
}

export const THEMES: Theme[] = [
  { id: "red", name: "Red", type: "vibrant", accent: "#dc2626", accentHover: "#b91c1c", accentLight: "rgba(220,38,38,0.1)" },
  { id: "blue", name: "Blue", type: "vibrant", accent: "#2563eb", accentHover: "#1d4ed8", accentLight: "rgba(37,99,235,0.1)" },
  { id: "green", name: "Green", type: "vibrant", accent: "#16a34a", accentHover: "#15803d", accentLight: "rgba(22,163,74,0.1)" },
  { id: "purple", name: "Purple", type: "vibrant", accent: "#9333ea", accentHover: "#7e22ce", accentLight: "rgba(147,51,234,0.1)" },
  { id: "orange", name: "Orange", type: "vibrant", accent: "#ea580c", accentHover: "#c2410c", accentLight: "rgba(234,88,12,0.1)" },
  { id: "teal", name: "Teal", type: "vibrant", accent: "#0d9488", accentHover: "#0f766e", accentLight: "rgba(13,148,136,0.1)" },
  { id: "pink", name: "Pink", type: "vibrant", accent: "#db2777", accentHover: "#be185d", accentLight: "rgba(219,39,119,0.1)" },
  { id: "amber", name: "Amber", type: "vibrant", accent: "#d97706", accentHover: "#b45309", accentLight: "rgba(217,119,6,0.1)" },
  { id: "rose", name: "Rose", type: "pastel", accent: "#f43f5e", accentHover: "#e11d48", accentLight: "rgba(244,63,94,0.1)" },
  { id: "lavender", name: "Lavender", type: "pastel", accent: "#a78bfa", accentHover: "#8b5cf6", accentLight: "rgba(167,139,250,0.1)" },
  { id: "mint", name: "Mint", type: "pastel", accent: "#34d399", accentHover: "#10b981", accentLight: "rgba(52,211,153,0.1)" },
  { id: "peach", name: "Peach", type: "pastel", accent: "#fb923c", accentHover: "#f97316", accentLight: "rgba(251,146,60,0.1)" },
  { id: "sky", name: "Sky", type: "pastel", accent: "#38bdf8", accentHover: "#0ea5e9", accentLight: "rgba(56,189,248,0.1)" },
  { id: "lilac", name: "Lilac", type: "pastel", accent: "#c084fc", accentHover: "#a855f7", accentLight: "rgba(192,132,252,0.1)" },
  { id: "coral", name: "Coral", type: "pastel", accent: "#fb7185", accentHover: "#f43f5e", accentLight: "rgba(251,113,133,0.1)" },
  { id: "butter", name: "Butter", type: "pastel", accent: "#fbbf24", accentHover: "#f59e0b", accentLight: "rgba(251,191,36,0.1)" },
];

interface ThemeContextType {
  theme: Theme;
  darkMode: boolean;
  setTheme: (id: string) => void;
  setDarkMode: (v: boolean) => void;
  syncFromUser: (t: string, d: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES[0],
  darkMode: true,
  setTheme: () => {},
  setDarkMode: () => {},
  syncFromUser: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState("red");
  const [darkMode, setDarkModeState] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("hdstream_theme");
    if (saved && THEMES.some((t) => t.id === saved)) setThemeId(saved);
    const mode = localStorage.getItem("hdstream_dark_mode");
    if (mode !== null) setDarkModeState(mode === "true");
    setReady(true);
  }, []);

  const applyTheme = useCallback((tid: string, dm: boolean) => {
    document.documentElement.setAttribute("data-theme", tid);
    document.documentElement.setAttribute("data-mode", dm ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("hdstream_theme", themeId);
    localStorage.setItem("hdstream_dark_mode", String(darkMode));
    applyTheme(themeId, darkMode);
  }, [themeId, ready, darkMode, applyTheme]);

  const setTheme = useCallback((id: string) => {
    setThemeId(id);
  }, []);

  const setDarkMode = useCallback((v: boolean) => {
    setDarkModeState(v);
  }, []);

  const syncFromUser = useCallback((t: string, d: boolean) => {
    setThemeId(t);
    setDarkModeState(d);
    localStorage.setItem("hdstream_theme", t);
    localStorage.setItem("hdstream_dark_mode", String(d));
    applyTheme(t, d);
  }, [applyTheme]);

  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, darkMode, setTheme, setDarkMode, syncFromUser }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
