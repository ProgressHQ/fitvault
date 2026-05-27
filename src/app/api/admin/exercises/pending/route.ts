import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { listPendingReview } from "@/lib/exercises";
import { ok, handleError } from "@/lib/response";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    requireAdmin(req);
    const exercises = await listPendingReview();
    return ok(exercises);
  } catch (e) {
    return handleError(e);
  }
}
