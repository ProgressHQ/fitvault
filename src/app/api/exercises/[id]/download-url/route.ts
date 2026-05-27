import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { checkAccess } from "@/lib/access";
import { getExercise } from "@/lib/exercises";
import { getPresignedGetUrl } from "@/lib/s3";
import { ok, err, handleError } from "@/lib/response";

const TTL = 86400;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const user = requireAuth(req);
    const { id } = await params;

    const exercise = await getExercise(id);
    if (!exercise) return err(404, "Exercise not found");

    const access = await checkAccess(user.userId, id);
    if (!access.granted) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const s3Key = `${id}/full.mp4`;
    const downloadUrl = await getPresignedGetUrl(s3Key, TTL);
    const expiresAt = new Date(Date.now() + TTL * 1000).toISOString();

    return ok({ download_url: downloadUrl, expires_at: expiresAt });
  } catch (e) {
    return handleError(e);
  }
}
