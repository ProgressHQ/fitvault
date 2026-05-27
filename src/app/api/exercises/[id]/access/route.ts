import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { checkAccess } from "@/lib/access";
import { getExercise } from "@/lib/exercises";
import { signFullVideoUrl, publicClipUrl } from "@/lib/cdn";
import { ok, err, handleError } from "@/lib/response";

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
    const previewUrl = publicClipUrl(`${id}/preview.mp4`);

    if (!access.granted) {
      return NextResponse.json(
        { error: "Access denied", preview_url: previewUrl },
        { status: 403 }
      );
    }

    const { url, expires_at } = signFullVideoUrl(`${id}/full.mp4`);

    return ok({ video_url: url, expires_at, access_reason: access.reason });
  } catch (e) {
    return handleError(e);
  }
}
