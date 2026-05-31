"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTheme, THEMES } from "@/components/ThemeProvider";

type Section = "profile" | "appearance" | "security";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "profile", label: "Profile", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" },
  { id: "appearance", label: "Appearance", icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
  { id: "security", label: "Security", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
];

// ── Crop overlay component ─────────────────────────────────
function ImageCropper({
  src,
  onCrop,
  onCancel,
}: {
  src: string;
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<{
    handle: string | null;
    startX: number;
    startY: number;
    initial: { x: number; y: number; w: number; h: number };
  } | null>(null);
  const [meta, setMeta] = useState({ loaded: false, nw: 0, nh: 0, dw: 0, dh: 0 });
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 200, h: 200 });

  const onImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    const dw = rect.width;
    const dh = rect.height;
    const s = Math.min(dw, dh, 300);
    setMeta({ loaded: true, nw: img.naturalWidth, nh: img.naturalHeight, dw, dh });
    setCrop({ x: (dw - s) / 2, y: (dh - s) / 2, w: s, h: s });
  };

  const { loaded, nw, nh, dw, dh } = meta;
  const scaleX = nw / dw || 1;
  const scaleY = nh / dh || 1;

  const clamp = (c: { x: number; y: number; w: number; h: number }) => ({
    x: Math.max(0, Math.min(c.x, dw - c.w)),
    y: Math.max(0, Math.min(c.y, dh - c.h)),
    w: Math.max(50, Math.min(c.w, dw - c.x)),
    h: Math.max(50, Math.min(c.h, dh - c.y)),
  });

  const clamped = clamp(crop);

  useEffect(() => {
    if (!loaded || !previewRef.current || !imgRef.current) return;
    const canvas = previewRef.current;
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      imgRef.current,
      clamped.x * scaleX, clamped.y * scaleY,
      clamped.w * scaleX, clamped.h * scaleY,
      0, 0, 200, 200
    );
  }, [clamped, loaded]);

  const handleMouseDown = (handleId: string | null, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      handle: handleId,
      startX: e.clientX,
      startY: e.clientY,
      initial: { ...crop },
    };

    const onMove = (me: MouseEvent) => {
      if (!dragRef.current) return;
      const { handle, startX, startY, initial } = dragRef.current;
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;

      if (handle === null) {
        setCrop(clamp({
          x: initial.x + dx,
          y: initial.y + dy,
          w: initial.w,
          h: initial.h,
        }));
        return;
      }

      let nx = initial.x;
      let ny = initial.y;
      let nw = initial.w;
      let nh = initial.h;

      if (handle === "r") { nw = initial.w + dx; }
      else if (handle === "l") { nx = initial.x + dx; nw = initial.w - dx; }
      else if (handle === "b") { nh = initial.h + dy; }
      else if (handle === "t") { ny = initial.y + dy; nh = initial.h - dy; }
      else if (handle === "br") { nw = initial.w + dx; nh = initial.h + dy; }
      else if (handle === "bl") { nx = initial.x + dx; nw = initial.w - dx; nh = initial.h + dy; }
      else if (handle === "tr") { ny = initial.y + dy; nw = initial.w + dx; nh = initial.h - dy; }
      else if (handle === "tl") { nx = initial.x + dx; ny = initial.y + dy; nw = initial.w - dx; nh = initial.h - dy; }

      setCrop(clamp({ x: nx, y: ny, w: nw, h: nh }));
    };

    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleConfirm = () => {
    if (!loaded || !imgRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      imgRef.current,
      clamped.x * scaleX, clamped.y * scaleY,
      clamped.w * scaleX, clamped.h * scaleY,
      0, 0, 200, 200
    );
    canvas.toBlob((blob) => { if (blob) onCrop(blob); }, "image/png");
  };

  if (!src) return null;

  const HANDLES = [
    { id: "tl", style: { top: -5, left: -5 }, cursor: "nw-resize" },
    { id: "tr", style: { top: -5, right: -5 }, cursor: "ne-resize" },
    { id: "bl", style: { bottom: -5, left: -5 }, cursor: "sw-resize" },
    { id: "br", style: { bottom: -5, right: -5 }, cursor: "se-resize" },
    { id: "t", style: { top: -5, left: "50%", transform: "translateX(-50%)" }, cursor: "n-resize" },
    { id: "b", style: { bottom: -5, left: "50%", transform: "translateX(-50%)" }, cursor: "s-resize" },
    { id: "l", style: { left: -5, top: "50%", transform: "translateY(-50%)" }, cursor: "w-resize" },
    { id: "r", style: { right: -5, top: "50%", transform: "translateY(-50%)" }, cursor: "e-resize" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-6 items-start flex-wrap">
        <div className="relative inline-block select-none overflow-hidden rounded-lg" style={{ maxWidth: 500, maxHeight: 450 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt="Crop"
            onLoad={onImgLoad}
            className="max-w-full max-h-[450px] block"
            draggable={false}
          />
          {loaded && (
            <div
              onMouseDown={(e) => handleMouseDown(null, e)}
              className="absolute cursor-move z-10"
              style={{
                left: clamped.x,
                top: clamped.y,
                width: clamped.w,
                height: clamped.h,
                border: "2px solid white",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
              }}
            >
              {HANDLES.map((h) => (
                <div
                  key={h.id}
                  onMouseDown={(e) => handleMouseDown(h.id, e)}
                  className="absolute w-3 h-3 bg-white border border-zinc-800 rounded-sm z-20"
                  style={{ ...h.style, cursor: h.cursor }}
                />
              ))}
            </div>
          )}
        </div>

        {loaded && (
          <div className="shrink-0">
            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-2">Preview</div>
            <canvas ref={previewRef} className="w-[200px] h-[200px] rounded-lg border border-[var(--border-color)]" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleConfirm}
          className="px-5 py-2 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] rounded-lg text-sm font-semibold transition"
        >
          Apply crop
        </button>
        <button onClick={onCancel} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────
export default function AccountSettingsPage() {
  const { user, loading, logout, refresh } = useAuth();
  const { theme: currentTheme, darkMode, setTheme, setDarkMode, syncFromUser } = useTheme();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<Section>("profile");

  // ── Profile state ──
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [greetingPref, setGreetingPref] = useState("first_name");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved">("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [avatarSubmitting, setAvatarSubmitting] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Security state ──
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [twoFactorError, setTwoFactorError] = useState("");
  const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyingCode, setVerifyingCode] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/auth/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName || "");
    setUsername(user.username || "");
    setGreetingPref(user.greetingPreference || "first_name");
    setAvatarUrl(user.avatarUrl || "");
  }, [user]);

  // Auto-save profile fields with debounce
  useEffect(() => {
    if (!user) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setProfileStatus("saving");
    saveTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            username: username.trim() || null,
            greetingPreference: greetingPref,
          }),
        });
        if (res.ok) { refresh(); setProfileStatus("saved"); }
        else setProfileStatus("idle");
      } catch { setProfileStatus("idle"); }
    }, 800);
    return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
  }, [firstName, username, greetingPref]);

  // Fetch 2FA status
  useEffect(() => {
    if (!user) return;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setTwoFactorEnabled(!!data.user.twoFactorEnabled);
        setTwoFactorLoading(false);
      })
      .catch(() => setTwoFactorLoading(false));
  }, [user]);

  // ── Profile handlers ──

  const handleAvatarSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCropComplete = async (blob: Blob) => {
    setAvatarSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.png");
      const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) return;
      setAvatarUrl(data.avatarUrl + "?t=" + Date.now());
      setCropSrc(null);
      refresh();
    } catch {}
    finally { setAvatarSubmitting(false); }
  };

  // ── Greeting display name ──
  const displayName = greetingPref === "username" && username ? username : firstName;

  // ── Password handler ──
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    if (newPassword !== confirmNewPassword) { setPwError("Passwords do not match"); return; }
    setPwSubmitting(true);
    try {
      const res = await fetch("/api/auth/settings/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error); return; }
      setPwSuccess("Password updated successfully");
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
    } catch { setPwError("Something went wrong"); }
    finally { setPwSubmitting(false); }
  };

  // ── 2FA handlers ──
  const handleToggle2FA = async () => {
    setTwoFactorError("");
    setTwoFactorSubmitting(true);
    try {
      const res = await fetch("/api/auth/settings/toggle-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !twoFactorEnabled }),
      });
      const data = await res.json();
      if (!res.ok) { setTwoFactorError(data.error); return; }
      if (!twoFactorEnabled) setVerificationSent(true);
      else { setTwoFactorEnabled(false); setVerificationSent(false); }
    } catch { setTwoFactorError("Something went wrong"); }
    finally { setTwoFactorSubmitting(false); }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFactorError("");
    setVerifyingCode(true);
    try {
      const res = await fetch("/api/auth/settings/confirm-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) { setTwoFactorError(data.error); return; }
      setTwoFactorEnabled(true); setVerificationSent(false); setVerificationCode("");
    } catch { setTwoFactorError("Something went wrong"); }
    finally { setVerifyingCode(false); }
  };

  // ── Theme handlers ──
  const handleThemeChange = async (id: string) => {
    setTheme(id);
    try { await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: id }) }); } catch {}
  };

  const handleDarkModeToggle = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    try { await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ darkMode: newMode }) }); } catch {}
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <main className="min-h-screen text-[var(--text-primary)]">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[var(--bg-secondary)]/80 backdrop-blur-xl border-b border-[var(--border-color)] px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <a href="/" className="text-xl font-bold tracking-tight             bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            HDStream
          </a>
          <div className="w-px h-5 bg-[var(--border-color)]" />
          <span className="text-sm text-[var(--text-secondary)]">Account Settings</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex gap-8">
        {/* ── SIDEBAR ── */}
        <aside className="w-56 shrink-0">
          <nav className="space-y-1 sticky top-24">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeSection === s.id
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] border border-transparent"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
                {s.label}
              </button>
            ))}
            <hr className="border-[var(--border-color)] my-3" />
            <button
              onClick={() => { logout(); router.push("/"); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--card-hover)] transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Log out
            </button>
          </nav>
        </aside>

        {/* ── CONTENT ── */}
        <div className="flex-1 min-w-0 space-y-8">

          {/* ═══════════════ PROFILE ═══════════════ */}
          {activeSection === "profile" && (
            <section>
              <h2 className="text-lg font-bold mb-1">Profile</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Your personal information</p>

              {/* Avatar */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 mb-6">
                <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-3">Profile Picture</div>
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] overflow-hidden shrink-0 flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-[var(--text-secondary)]">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarSubmitting}
                      className="px-4 py-2 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 rounded-lg text-sm font-medium transition flex items-center gap-2"
                    >
                      {avatarSubmitting ? (
                        <div className="spinner" />
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      )}
                      {avatarSubmitting ? "Uploading..." : "Upload photo"}
                    </button>
                    {avatarUrl && (
                      <button
                        onClick={async () => {
                          setAvatarUrl("");
                          await fetch("/api/profile", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ avatarUrl: "" }),
                          });
                          refresh();
                        }}
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelected}
                    className="hidden"
                  />
                </div>

                {/* Crop dialog */}
                {cropSrc && (
                  <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                    <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-3">Crop image</div>
                    <ImageCropper
                      src={cropSrc}
                      onCrop={handleCropComplete}
                      onCancel={() => setCropSrc(null)}
                    />
                  </div>
                )}
              </div>

              {/* Name / Username / Greeting */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-5">
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold block mb-1.5">First Name</label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold block mb-1.5">Username</label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold block mb-1.5">Email</label>
                  <p className="text-sm text-[var(--text-secondary)]">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold block mb-1.5">Greeting preference</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="greeting"
                        checked={greetingPref === "first_name"}
                        onChange={() => setGreetingPref("first_name")}
                        className="accent-[var(--accent)]"
                      />
                      Use first name
                      <span className="text-[var(--text-secondary)] font-medium">({firstName || "Name"})</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="greeting"
                        checked={greetingPref === "username"}
                        onChange={() => setGreetingPref("username")}
                        className="accent-[var(--accent)]"
                        disabled={!username}
                      />
                      Use username
                      <span className="text-[var(--text-secondary)] font-medium">({username || "—"})</span>
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-2 h-5">
                  {profileStatus === "saving" && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </div>
                  )}
                  {profileStatus === "saved" && (
                    <span className="text-xs text-emerald-400">Saved</span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ═══════════════ APPEARANCE ═══════════════ */}
          {activeSection === "appearance" && (
            <section>
              <h2 className="text-lg font-bold mb-1">Appearance</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Customize how HDStream looks</p>

              {/* Light / Dark mode */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">Theme mode</div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      {darkMode ? "Dark mode is on" : "Light mode is on"}
                    </p>
                  </div>
                  <button
                    onClick={handleDarkModeToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      darkMode ? "bg-[var(--accent)]" : "bg-[var(--toggle-bg)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        darkMode ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Theme colors */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5">
                <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-4">Accent Color</div>

                <div className="mb-4">
                  <div className="text-xs text-[var(--text-secondary)] mb-2 font-medium">Vibrant</div>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.filter((t) => t.type === "vibrant").map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        className={`w-10 h-10 rounded-xl transition-all ${
                          currentTheme.id === t.id
                            ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-card)] scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: t.accent }}
                        title={t.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[var(--text-secondary)] mb-2 font-medium">Pastel</div>
                  <div className="flex flex-wrap gap-2">
                    {THEMES.filter((t) => t.type === "pastel").map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        className={`w-10 h-10 rounded-xl transition-all ${
                          currentTheme.id === t.id
                            ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--bg-card)] scale-110"
                            : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: t.accent }}
                        title={t.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ═══════════════ SECURITY ═══════════════ */}
          {activeSection === "security" && (
            <section>
              <h2 className="text-lg font-bold mb-1">Security</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">Manage your account security</p>

              {/* Change Password */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-1">Change Password</h3>
                <p className="text-xs text-[var(--text-tertiary)] mb-3">Update your account password</p>
                <form onSubmit={handleChangePassword} className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-4">
                  {pwError && (
                    <div className="bg-red-600/10 border border-red-600/30 text-red-400 text-sm rounded-lg px-4 py-2.5">{pwError}</div>
                  )}
                  {pwSuccess && (
                    <div className="bg-emerald-600/10 border border-emerald-600/30 text-emerald-400 text-sm rounded-lg px-4 py-2.5">{pwSuccess}</div>
                  )}
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold block mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      placeholder="Your current password"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold block mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      placeholder="8+ chars, 1 capital, 1 number"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold block mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                      placeholder="Repeat new password"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pwSubmitting}
                    className="px-5 py-2 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                  >
                    {pwSubmitting && <div className="spinner" />}
                    {pwSubmitting ? "Updating..." : "Update password"}
                  </button>
                </form>
              </div>

              {/* 2FA */}
              <div>
                <h3 className="text-sm font-semibold mb-1">Two-factor Authentication</h3>
                <p className="text-xs text-[var(--text-tertiary)] mb-3">
                  Add an extra layer of security. You&apos;ll receive a verification code via email each time you log in.
                </p>
                <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5">
                  {twoFactorError && (
                    <div className="bg-red-600/10 border border-red-600/30 text-red-400 text-sm rounded-lg px-4 py-2.5 mb-4">{twoFactorError}</div>
                  )}
                  {verificationSent ? (
                    <form onSubmit={handleConfirm2FA} className="space-y-4">
                      <p className="text-sm text-[var(--text-secondary)]">A verification code has been sent to your email.</p>
                      <div>
                        <label className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold block mb-1.5">Verification Code</label>
                        <input
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors text-center tracking-[8px] font-mono"
                          placeholder="000000"
                          maxLength={6}
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="submit" disabled={verifyingCode}
                          className="px-5 py-2 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                        >
                          {verifyingCode && <div className="spinner" />}
                          {verifyingCode ? "Verifying..." : "Enable 2FA"}
                        </button>
                        <button type="button" onClick={() => { setVerificationSent(false); setVerificationCode(""); setTwoFactorError(""); }}
                        className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{twoFactorEnabled ? "Enabled" : "Disabled"}</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {twoFactorEnabled ? "You'll need a code to log in" : "Add email-based two-factor authentication"}
                        </p>
                      </div>
                      <button
                        onClick={handleToggle2FA}
                        disabled={twoFactorSubmitting}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          twoFactorEnabled ? "bg-[var(--accent)]" : "bg-[var(--toggle-bg)]"
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          twoFactorEnabled ? "translate-x-6" : "translate-x-1"
                        }`} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
