import { NextRequest } from "next/server";
import { requireContributorEligible } from "@/lib/auth";
import { getContributor, ensureContributor } from "@/lib/access";
import { createExerciseDraft } from "@/lib/exercises";
import { getPresignedPutUrl } from "@/lib/s3";
import { ok, err, handleError } from "@/lib/response";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = requireContributorEligible(req);

    // Ensure contributor record exists; check verification
    const contributor = await getContributor(user.userId) ?? await ensureContributor(user.userId);
    if (!contributor.verified) {
      return err(403, "Contributor account is not verified");
    }

    const body = (await req.json()) as {
      name?: string;
      description?: string;
      muscle_groups?: string[];
      equipment?: string[];
      difficulty?: string;
      movement_pattern?: string;
    };

    if (!body.name || !body.difficulty) {
      return err(400, "name and difficulty are required");
    }
    if (!body.muscle_groups?.length) {
      return err(400, "At least one muscle_group is required");
    }

    const exerciseId = await createExerciseDraft(user.userId, {
      name: { en: body.name },
      description: body.description ? { en: body.description } : undefined,
      muscle_groups: body.muscle_groups,
      equipment: body.equipment ?? [],
      difficulty: body.difficulty,
      movement_pattern: body.movement_pattern,
    });

    const s3Key = `uploads/${exerciseId}/original.mp4`;
    const uploadUrl = await getPresignedPutUrl(s3Key, "video/mp4", 7200);
    const expiresAt = new Date(Date.now() + 7200 * 1000).toISOString();

    return ok({ exercise_id: exerciseId, upload_url: uploadUrl, expires_at: expiresAt });
  } catch (e) {
    return handleError(e);
  }
}
