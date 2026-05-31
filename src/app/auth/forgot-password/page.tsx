"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Email is required"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-600/30 flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-2">Check your email</h1>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            If an account with that email exists, we&apos;ve sent a verification code to <strong className="text-[var(--text-primary)]">{email}</strong>.
          </p>
          <a
            href={`/auth/reset-password?email=${encodeURIComponent(email)}`}
            className="inline-block px-5 py-2.5 bg-accent text-white hover:bg-accent-hover rounded-lg text-sm font-semibold transition"
          >
            I have a code
          </a>
          <p className="mt-4">
            <a href="/auth/login" className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Back to log in</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-1">Reset your password</h1>
        <p className="text-[var(--text-secondary)] text-sm text-center mb-8">
          Enter your email and we&apos;ll send you a verification code.
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-accent text-white hover:bg-accent-hover disabled:opacity-50 rounded-lg text-sm font-semibold transition"
          >
            {submitting ? "Sending..." : "Send verification code"}
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
          Remember your password?{" "}
          <a href="/auth/login" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">Log in</a>
        </p>
      </div>
    </div>
  );
}
