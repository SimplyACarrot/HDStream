import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, validatePassword, signTempToken, verifyTempToken } from "@/lib/auth";
import { sendEmail, generateCode } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { firstName, email, password, googleToken } = await req.json();

    if (!firstName || !email || !password) {
      return Response.json({ error: "First name, email, and password are required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 400 });
    }

    const pwError = validatePassword(password);
    if (pwError) {
      return Response.json({ error: pwError }, { status: 400 });
    }

    const db = getDb();

    const existing = db.prepare("SELECT id, email_verified FROM users WHERE email = ?").get(email) as any;
    if (existing) {
      if (existing.email_verified) {
        return Response.json({ error: "An account with this email already exists" }, { status: 409 });
      }

      db.prepare("DELETE FROM verification_codes WHERE user_id = ? AND type = 'email_verify' AND used = 0").run(existing.id);
      const code = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      db.prepare("INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES (?, ?, 'email_verify', ?)").run(existing.id, code, expiresAt);
      const tempToken = signTempToken({ userId: String(existing.id), email, purpose: "email_verify" });

      await sendEmail(
        email,
        "Verify your HDStream email",
        `Hi ${firstName},\n\nYour email verification code is: ${code}\n\nThis code expires in 10 minutes.`,
        `<p>Hi ${firstName},</p><p>Your email verification code is:</p><h2 style="letter-spacing:4px;font-size:24px;background:#f5f5f5;padding:12px 20px;border-radius:8px;display:inline-block;color:#000">${code}</h2><p>This code expires in <strong>10 minutes</strong>.</p>`
      );

      return Response.json({ success: true, verificationRequired: true, tempToken, email });
    }

    let googleId: string | null = null;

    if (googleToken) {
      const payload = verifyTempToken(googleToken);
      if (!payload || payload.email !== email) {
        return Response.json({ error: "Invalid Google authentication" }, { status: 400 });
      }
      googleId = payload.googleId;
    }

    const hashed = hashPassword(password);
    const result = db.prepare(
      `INSERT INTO users (first_name, email, password, google_id, email_verified) VALUES (?, ?, ?, ?, 0)`
    ).run(firstName, email, hashed, googleId);

    const userId = result.lastInsertRowid as number;

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    db.prepare(
      "INSERT INTO verification_codes (user_id, code, type, expires_at) VALUES (?, ?, 'email_verify', ?)"
    ).run(userId, code, expiresAt);

    const tempToken = signTempToken({ userId: String(userId), email, purpose: "email_verify" });

    await sendEmail(
      email,
      "Verify your HDStream email",
      `Hi ${firstName},\n\nYour email verification code is: ${code}\n\nThis code expires in 10 minutes.`,
      `<p>Hi ${firstName},</p><p>Your email verification code is:</p><h2 style="letter-spacing:4px;font-size:24px;background:#f5f5f5;padding:12px 20px;border-radius:8px;display:inline-block;color:#000">${code}</h2><p>This code expires in <strong>10 minutes</strong>.</p>`
    );

    return Response.json({ success: true, verificationRequired: true, tempToken, email });
  } catch (err) {
    console.error("Register error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
