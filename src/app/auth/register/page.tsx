"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refresh } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleToken, setGoogleToken] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [verificationTempToken, setVerificationTempToken] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  useEffect(() => {
    const gt = searchParams?.get("gt");
    if (gt) {
      setGoogleToken(gt);

      fetch(`/api/auth/me?gt=${gt}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.name) setFirstName(data.name);
          if (data.email) setEmail(data.email);
        })
        .catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    if (googleToken) {
      try {
        const payload = JSON.parse(atob(googleToken.split(".")[1]));
        if (payload.name) setFirstName(payload.name);
        if (payload.email) setEmail(payload.email);
      } catch {}
    }
  }, [googleToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim()) { setError("First name is required"); return; }
    if (!email.trim()) { setError("Email is required"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setSubmitting(true);
    try {
      const body: any = { firstName: firstName.trim(), email: email.trim(), password };
      if (googleToken) body.googleToken = googleToken;

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      if (data.verificationRequired) {
        setVerificationTempToken(data.tempToken);
        setVerificationEmail(data.email);
        setVerificationRequired(true);
        return;
      }

      await refresh();
      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (verifyCode.length !== 6) { setError("Please enter the 6-digit code"); return; }

    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken: verificationTempToken, code: verifyCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }

      await refresh();
      router.push("/onboarding");
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  if (verificationRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12a10 10 0 11-20 0 10 10 0 0120 0z"/><path d="M8 12l2 2 4-4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-1">Check your email</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-8">
            We sent a 6-digit code to <span className="text-[var(--text-primary)]">{verificationEmail}</span>
          </p>

          <form onSubmit={handleVerifyCode} className="space-y-4">
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1">Create your account</h1>
        <p className="text-[var(--text-secondary)] text-sm text-center mb-8">Join HDStream to start watching</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-600/10 border border-red-600/30 text-red-400 text-sm rounded-lg px-4 py-2.5">{error}</div>
          )}

          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-1.5">First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none focus:border-[var(--border-color)] transition-colors"
              placeholder="John"
              disabled={!!googleToken}
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none focus:border-[var(--border-color)] transition-colors"
              placeholder="john@example.com"
              disabled={!!googleToken}
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none focus:border-[var(--border-color)] transition-colors"
              placeholder="At least 8 characters"
            />
            <p className="text-[11px] font-medium text-[var(--text-tertiary)] mt-1">Must be 8+ characters with 1 capital letter and 1 number</p>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none focus:border-[var(--border-color)] transition-colors"
              placeholder="Repeat your password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-accent text-white hover:bg-accent-hover disabled:opacity-50 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              {submitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        {}
        {!googleToken && (
          <>
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
          </>
        )}

        <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
          Already have an account?{" "}
          <a href="/auth/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Log in</a>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
