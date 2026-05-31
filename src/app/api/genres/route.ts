import { getGenres } from "@/lib/tmdb";

export async function GET() {
  const genres = await getGenres();
  return Response.json(genres);
}
