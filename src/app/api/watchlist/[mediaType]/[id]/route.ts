import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mediaType: string; id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ inWatchlist: false });
    }

    const { mediaType, id } = await params;
    const db = getDb();

    const row = db.prepare(
      "SELECT id FROM watchlist WHERE user_id = ? AND media_id = ? AND media_type = ?"
    ).get(session.userId, parseInt(id, 10), mediaType === "tv" ? "tv" : "movie");

    return Response.json({ inWatchlist: !!row });
  } catch {
    return Response.json({ inWatchlist: false });
  }
}
