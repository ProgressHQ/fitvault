import { NextRequest } from "next/server";
import { listExercises } from "@/lib/exercises";
import { ok, handleError } from "@/lib/response";
import type { Lang } from "@/lib/types";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const p = req.nextUrl.searchParams;
    const lang = (p.get("lang") ?? "en") as Lang;
    const muscleGroups = p.getAll("muscle_groups");
    const equipment = p.getAll("equipment");

    const result = await listExercises({
      cursor: p.get("cursor") ?? undefined,
      limit: p.get("limit") ? Number(p.get("limit")) : 20,
      lang,
      q: p.get("q") ?? undefined,
      muscle_groups: muscleGroups.length ? muscleGroups : undefined,
      equipment: equipment.length ? equipment : undefined,
      difficulty: p.get("difficulty") ?? undefined,
      movement_pattern: p.get("movement_pattern") ?? undefined,
    });

    return ok(result, lang);
  } catch (e) {
    return handleError(e);
  }
}
