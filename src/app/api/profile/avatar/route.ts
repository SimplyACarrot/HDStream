import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import path from "path";
import fs from "fs";

const AVATARS_DIR = path.join(process.cwd(), "public", "avatars");

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!fs.existsSync(AVATARS_DIR)) {
    fs.mkdirSync(AVATARS_DIR, { recursive: true });
  }

  const formData = await req.formData();
  const file = formData.get("avatar") as File | null;
  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const filename = `avatar_${session.userId}_${Date.now()}.${ext}`;
  const filepath = path.join(AVATARS_DIR, filename);

  fs.writeFileSync(filepath, buffer);

  const avatarUrl = `/avatars/${filename}`;

  const db = getDb();
  db.prepare("UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?").run(
    avatarUrl,
    session.userId
  );

  return Response.json({ success: true, avatarUrl });
}
