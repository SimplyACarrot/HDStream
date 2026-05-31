"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(searchParams?.get("email") || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Email is required"); return; }
    if (!code.trim()) { setError("Verification code is required"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Password reset</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">Your password has been updated successfully.</p>
          <a
            href="/auth/login"
            className="inline-block px-5 py-2.5 bg-accent text-white hover:bg-accent-hover rounded-lg text-sm font-semibold transition"
          >
            Log in with new password
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1">Set new password</h1>
        <p className="text-[var(--text-secondary)] text-sm text-center mb-8">
          Enter the code from your email and choose a new password.
        </p>

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
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-1.5">Verification Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder-theme focus:outline-none focus:border-[var(--border-color)] transition-colors text-center tracking-[8px] font-mono"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-1.5">New Password</label>
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
            <label className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold block mb-1.5">Confirm New Password</label>
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
            className="w-full py-2.5 bg-accent text-white hover:bg-accent-hover disabled:opacity-50 rounded-lg text-sm font-semibold transition"
          >
            {submitting ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
          <a href="/auth/forgot-password" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Resend code</a>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
