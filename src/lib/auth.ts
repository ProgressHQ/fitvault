import { NextRequest } from "next/server";

export type UserRole = "TRAINER" | "ATHLETE" | "ADMIN";

export interface UserIdentity {
  userId: string;
  role: UserRole;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: number = 401
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export function extractUser(req: NextRequest): UserIdentity | null {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role") as UserRole | null;
  if (!userId || !role) return null;
  return { userId, role };
}

export function requireAuth(req: NextRequest): UserIdentity {
  const user = extractUser(req);
  if (!user) throw new AuthError("Authentication required", 401);
  return user;
}

export function requireAdmin(req: NextRequest): UserIdentity {
  const user = requireAuth(req);
  if (user.role !== "ADMIN") throw new AuthError("Admin access required", 403);
  return user;
}

export function requireContributorEligible(req: NextRequest): UserIdentity {
  const user = requireAuth(req);
  if (user.role !== "TRAINER" && user.role !== "ADMIN") {
    throw new AuthError("Only trainers can contribute content", 403);
  }
  return user;
}
