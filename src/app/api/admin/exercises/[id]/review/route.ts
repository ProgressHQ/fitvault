import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getExercise, updateExerciseStatus } from "@/lib/exercises";
import { getPool } from "@/lib/db";
import { ok, err, handleError } from "@/lib/response";

type ReviewAction = "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const admin = requireAdmin(req);
    const { id } = await params;

    const exercise = await getExercise(id, "en", true);
    if (!exercise) return err(404, "Exercise not found");

    const body = (await req.json()) as { action?: ReviewAction; note?: string };
    const action = body.action as ReviewAction | undefined;

    if (!action || !["APPROVED", "REJECTED", "CHANGES_REQUESTED"].includes(action)) {
      return err(400, "action must be APPROVED, REJECTED, or CHANGES_REQUESTED");
    }
    if ((action === "REJECTED" || action === "CHANGES_REQUESTED") && !body.note?.trim()) {
      return err(400, "note is required for REJECTED and CHANGES_REQUESTED");
    }

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const newStatus = action === "APPROVED" ? "APPROVED" : action === "REJECTED" ? "REJECTED" : "DRAFT";
      await client.query(
        `UPDATE fitvault_exercises
         SET status = $1, reviewer_id = $2, reviewed_at = now(), updated_at = now()
         WHERE id = $3`,
        [newStatus, admin.userId, id]
      );

      await client.query(
        `INSERT INTO content_review_notes (exercise_id, reviewer_id, action, note)
         VALUES ($1, $2, $3, $4)`,
        [id, admin.userId, action, body.note ?? null]
      );

      await client.query("COMMIT");
    } catch (err2) {
      await client.query("ROLLBACK");
      throw err2;
    } finally {
      client.release();
    }

    return ok({ exercise_id: id, action, new_status: action === "APPROVED" ? "APPROVED" : action === "REJECTED" ? "REJECTED" : "DRAFT" });
  } catch (e) {
    return handleError(e);
  }
}
