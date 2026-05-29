import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getProduct } from "@/lib/products";
import { createCheckoutSession } from "@/lib/payment";
import { ok, err, handleError } from "@/lib/response";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const user = requireAuth(req);
    const body = (await req.json()) as { productId?: string };

    if (!body.productId) return err(400, "productId is required");

    const product = await getProduct(body.productId);
    if (!product || !product.active) return err(404, "Product not found");
    if (
      product.type !== "SUBSCRIPTION_MONTHLY" &&
      product.type !== "SUBSCRIPTION_ANNUAL"
    ) {
      return err(400, "Use /checkout/video for non-subscription products");
    }

    const baseUrl = process.env["FITVAULT_BASE_URL"] ?? "http://localhost:3002";
    const session = await createCheckoutSession({
      amount: { amount: product.price_cents, currency: product.currency },
      description: product.title,
      customerId: user.userId,
      resourceId: `subscription:${body.productId}`,
      idempotencyKey: `sub-${user.userId}-${body.productId}-${Date.now()}`,
      metadata: {
        userId: user.userId,
        type: product.type,
        productId: body.productId,
        returnUrl: `${baseUrl}/`,
      },
    });

    return ok({ checkout_url: session.checkoutUrl, payment_id: session.paymentId });
  } catch (e) {
    return handleError(e);
  }
}
