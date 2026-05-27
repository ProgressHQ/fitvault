import { NextRequest } from "next/server";
import { listActiveProducts } from "@/lib/products";
import { ok, handleError } from "@/lib/response";

export async function GET(_req: NextRequest): Promise<Response> {
  try {
    const products = await listActiveProducts();
    return ok(products);
  } catch (e) {
    return handleError(e);
  }
}
