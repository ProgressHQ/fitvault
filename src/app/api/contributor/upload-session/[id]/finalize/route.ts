import { NextRequest } from "next/server";
import { requireContributorEligible } from "@/lib/auth";
import { setExerciseVideoKeys, getExercise } from "@/lib/exercises";
import { objectExists } from "@/lib/s3";
import { ok, err, handleError } from "@/lib/response";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    requireContributorEligible(req);
    const { id } = await params;

    const exercise = await getExercise(id, "en", true);
    if (!exercise) return err(404, "Exercise not found");

    const s3Key = `uploads/${id}/original.mp4`;
    const exists = await objectExists(s3Key);
    if (!exists) {
      return err(422, "Video file not found in storage — upload the file before finalizing");
    }

    // Set final keys and advance status to PENDING_REVIEW
    await setExerciseVideoKeys(id, {
      full_video_s3_key: `${id}/full.mp4`,
      preview_clip_s3_key: `${id}/preview.mp4`,
      thumbnail_s3_key: `${id}/thumbnail.jpg`,
    });

    return ok({ exercise_id: id, status: "PENDING_REVIEW" });
  } catch (e) {
    return handleError(e);
  }
}
