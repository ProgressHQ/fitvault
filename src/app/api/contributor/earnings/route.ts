import { NextRequest } from "next/server";
import { requireContributorEligible } from "@/lib/auth";
import { listContributorEarnings } from "@/lib/earnings";
import { ok, handleError } from "@/lib/response";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const user = requireContributorEligible(req);
    const earnings = await listContributorEarnings(user.userId);
    return ok(earnings);
  } catch (e) {
    return handleError(e);
  }
}
