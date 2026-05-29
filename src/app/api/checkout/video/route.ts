import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getProduct } from "@/lib/products";
import { createCheckoutSession } from "@/lib/payment";
import { ok, err, handleError } from "@/lib/response";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = requireAuth(req);
    const body = (await req.json()) as { productId?: string; exerciseId?: string };

    if (!body.productId || !body.exerciseId) {
      return err(400, "productId and exerciseId are required");
    }

    const product = await getProduct(body.productId);
    if (!product || !product.active) return err(404, "Product not found");
    if (product.type !== "SINGLE_VIDEO" && product.type !== "BUNDLE") {
      return err(400, "Use /checkout/subscription for subscription products");
    }

    const baseUrl = process.env["FITVAULT_BASE_URL"] ?? "http://localhost:3002";
    const session = await createCheckoutSession({
      amount: { amount: product.price_cents, currency: product.currency },
      description: `Exercise video: ${product.title}`,
      customerId: user.userId,
      resourceId: `video:${body.exerciseId}:${body.productId}`,
      idempotencyKey: `video-${user.userId}-${body.exerciseId}-${body.productId}`,
      metadata: {
        userId: user.userId,
        type: product.type,
        productId: body.productId,
        exerciseId: body.exerciseId,
        returnUrl: `${baseUrl}/exercises/${body.exerciseId}`,
      },
    });

    return ok({ checkout_url: session.checkoutUrl, payment_id: session.paymentId });
  } catch (e) {
    return handleError(e);
  }
}
