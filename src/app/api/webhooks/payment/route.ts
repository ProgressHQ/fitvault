import { NextRequest } from "next/server";
import { verifyWebhook } from "@/lib/payment";
import { getProduct } from "@/lib/products";
import {
  createVideoUnlock,
  createBundleUnlocks,
  upsertSubscription,
} from "@/lib/access";
import { ok, err, handleError } from "@/lib/response";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const signature = req.headers.get("x-webhook-signature") ?? "";
    const rawBody = await req.text();

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return err(400, "Invalid JSON payload");
    }

    const event = await verifyWebhook(payload, signature);

    if (event.type !== "payment.paid") {
      return ok({ received: true, action: "ignored" });
    }

    const meta = (event.metadata ?? {}) as Record<string, string>;
    const { userId, type, productId, exerciseId } = meta;

    if (!userId || !type || !productId) {
      return err(400, "Missing metadata fields");
    }

    switch (type) {
      case "SINGLE_VIDEO": {
        if (!exerciseId) return err(400, "exerciseId required for SINGLE_VIDEO");
        await createVideoUnlock(userId, exerciseId, productId, event.paymentId);
        break;
      }
      case "BUNDLE": {
        const product = await getProduct(productId);
        if (!product) return err(404, "Product not found");
        if (!product.exercise_ids.length) {
          return err(422, "Bundle has no exercises");
        }
        await createBundleUnlocks(userId, productId, product.exercise_ids, event.paymentId);
        break;
      }
      case "SUBSCRIPTION_MONTHLY":
      case "SUBSCRIPTION_ANNUAL": {
        const now = new Date();
        const months = type === "SUBSCRIPTION_MONTHLY" ? 1 : 12;
        const validUntil = new Date(now);
        validUntil.setMonth(validUntil.getMonth() + months);
        await upsertSubscription({
          userId,
          productId,
          status: "ACTIVE",
          validFrom: now,
          validUntil,
          providerSubscriptionId: event.paymentId,
        });
        break;
      }
      default:
        return err(400, `Unknown payment type: ${type}`);
    }

    return ok({ received: true, action: "processed" });
  } catch (e) {
    return handleError(e);
  }
}
