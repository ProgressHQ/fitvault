import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function ok<T>(data: T, lang = "en"): NextResponse {
  return NextResponse.json(data, {
    headers: { "Content-Language": lang },
  });
}

export function err(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(error: unknown): NextResponse {
  if (error instanceof AuthError) return err(error.status, error.message);
  console.error(error);
  return err(500, "Internal server error");
}
