import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { setSessionCookie, signTempToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return Response.redirect(new URL("/auth/login?error=google_auth_failed", req.url));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return Response.redirect(new URL("/auth/login?error=google_not_configured", req.url));
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return Response.redirect(new URL("/auth/login?error=google_token_exchange_failed", req.url));
    }

    const tokenData = await tokenRes.json();

    // Get user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return Response.redirect(new URL("/auth/login?error=google_userinfo_failed", req.url));
    }

    const userInfo = await userInfoRes.json();
    const email: string = userInfo.email;
    const name: string = userInfo.given_name || userInfo.name || email.split("@")[0];

    if (!email) {
      return Response.redirect(new URL("/auth/login?error=google_no_email", req.url));
    }

    const db = getDb();
    const existing = db.prepare("SELECT id, first_name, email FROM users WHERE email = ?").get(email) as any;

    if (existing) {
      // Link google_id if not already linked
      db.prepare("UPDATE users SET google_id = ? WHERE id = ? AND google_id IS NULL").run(userInfo.id, existing.id);
      await setSessionCookie({ userId: existing.id, email: existing.email });
      return Response.redirect(new URL("/", req.url));
    }

    // New user — redirect to register with a temp token
    const tempToken = signTempToken({ email, name, googleId: userInfo.id });
    return Response.redirect(new URL(`/auth/register?gt=${tempToken}`, req.url));
  } catch {
    return Response.redirect(new URL("/auth/login?error=google_auth_error", req.url));
  }
}
