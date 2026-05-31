"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [twoFactorPending, setTwoFactorPending] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);

  const [emailUnverified, setEmailUnverified] = useState(false);
  const [emailUnverifiedToken, setEmailUnverifiedToken] = useState("");
  const [emailUnverifiedEmail, setEmailUnverifiedEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  useEffect(() => {
    const err = searchParams?.get("error");
    if (err === "google_auth_failed") setError("Google authentication failed. Please try again.");
    else if (err === "google_not_configured") setError("Google sign-in is not configured yet.");
    else if (err === "google_token_exchange_failed") setError("Failed to connect with Google. Please try again.");
    else if (err === "google_userinfo_failed") setError("Failed to get your Google info. Please try again.");
    else if (err === "google_auth_error") setError("Something went wrong with Google sign-in.");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) { setError("Email and password are required"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      if (data.emailUnverified) {
        setEmailUnverifiedToken(data.tempToken);
        setEmailUnverifiedEmail(data.email);
        setEmailUnverified(true);
        return;
      }

      if (data.twoFactorRequired) {
        setTempToken(data.tempToken);
        setTwoFactorPending(true);
        return;
      }

      await refresh();
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (verifyCode.length !== 6) { setError("Please enter the 6-digit code"); return; }

    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken: emailUnverifiedToken, code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      await refresh();
      router.push("/");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!twoFactorCode.trim()) { setError("Verification code is required"); return; }

    setTwoFactorSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, code: twoFactorCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      await refresh();
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setTwoFactorSubmitting(false);
    }
  };

  if (emailUnverified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12a10 10 0 11-20 0 10 10 0 0120 0z"/><path d="M8 12l2 2 4-4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-1">Verify your email</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-8">
            We sent a code to <span className="text-[var(--text-primary)]">{emailUnverifiedEmail}</span>
          </p>

          <form onSubmit={handleVerifyEmail} className="space-y-4">
            {error && (
              <div className="bg-red-600/10 border border-red-600/30 text-red-400 text-sm rounded-lg px-4 py-2.5">{error}</div>
            )}

            <div>
              <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-2">Verification Code</label>
              <input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-3 text-center text-2xl tracking-[0.5em] text-[var(--text-primary)] placeholder-theme focus:outline-none focus:border-[var(--border-color)] transition-colors font-mono"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={verifying || verifyCode.length !== 6}
              className="w-full py-2.5 bg-accent text-white hover:bg-accent-hover disabled:opacity-50 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              {verifying && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {verifying ? "Verifying..." : "Verify email"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (twoFactorPending) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center mb-1">Two-factor authentication</h1>
          <p className="text-[var(--text-secondary)] text-sm text-center mb-8">
            Enter the verification code sent to your email.
          </p>

          <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-600/10 border border-red-600/30 text-red-400 text-sm rounded-lg px-4 py-2.5">{error}</div>
            )}

            <div>
              <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-1.5">Verification Code</label>
              <input
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none focus:border-[var(--border-color)] transition-colors text-center tracking-[8px] font-mono"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={twoFactorSubmitting}
              className="w-full py-2.5 bg-accent text-white hover:bg-accent-hover disabled:opacity-50 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              {twoFactorSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {twoFactorSubmitting ? "Verifying..." : "Verify & log in"}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
            <button
              onClick={() => { setTwoFactorPending(false); setTempToken(""); setTwoFactorCode(""); setError(""); }}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
            >
              Back to log in
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1">Welcome back</h1>
          <p className="text-[var(--text-secondary)] text-sm text-center mb-8">Log in to your HDStream account</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-600/10 border border-red-600/30 text-red-400 text-sm rounded-lg px-4 py-2.5">{error}</div>
          )}

          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none focus:border-[var(--border-color)] transition-colors"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none focus:border-[var(--border-color)] transition-colors"
              placeholder="Your password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-accent text-white hover:bg-accent-hover disabled:opacity-50 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              {submitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {submitting ? "Logging in..." : "Log in"}
          </button>

          <div className="text-right">
            <a href="/auth/forgot-password" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
              Forgot password?
            </a>
          </div>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[var(--border-color)]" />
          <span className="text-xs text-[var(--text-tertiary)]">or</span>
          <div className="flex-1 h-px bg-[var(--border-color)]" />
        </div>

        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--card-hover)] border border-[var(--border-color)] rounded-lg text-sm font-medium transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </a>

        <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
          Don&apos;t have an account?{" "}
          <a href="/auth/register" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Create one</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
