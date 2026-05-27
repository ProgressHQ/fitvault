import { NextRequest } from "next/server";
import { getExercise } from "@/lib/exercises";
import { ok, err, handleError } from "@/lib/response";
import type { Lang } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;
    const lang = (req.nextUrl.searchParams.get("lang") ?? "en") as Lang;
    const exercise = await getExercise(id, lang);
    if (!exercise) return err(404, "Exercise not found");
    return ok(exercise, lang);
  } catch (e) {
    return handleError(e);
  }
}
