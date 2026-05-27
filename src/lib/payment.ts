import { OpenPayClient } from "@openpay/core";
import { MockProvider } from "@openpay/provider-mock";
import type { CreatePaymentInput, PaymentSession, WebhookEvent } from "@openpay/core";

export type { PaymentSession, WebhookEvent };

let _client: OpenPayClient | undefined;

function getClient(): OpenPayClient {
  if (_client) return _client;

  const stripeKey = process.env["STRIPE_SECRET_KEY"];
  const stripeWebhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

  if (stripeKey && stripeWebhookSecret) {
    // Activate by: pnpm add stripe
    // Then uncomment the implementation in:
    //   ../openpay-sdk/packages/provider-stripe/src/stripe-provider.ts
    const { StripeProvider } = require("@openpay/provider-stripe") as typeof import("@openpay/provider-stripe");
    _client = new OpenPayClient({
      provider: new StripeProvider({
        secretKey: stripeKey,
        webhookSecret: stripeWebhookSecret,
      }),
    });
  } else {
    _client = new OpenPayClient({ provider: new MockProvider() });
  }

  return _client;
}

export async function createCheckoutSession(
  input: CreatePaymentInput
): Promise<PaymentSession> {
  return getClient().createPayment(input);
}

export async function verifyWebhook(
  payload: unknown,
  signature: string
): Promise<WebhookEvent> {
  const provider = (getClient() as unknown as { provider: { verifyWebhook?: (p: unknown, s: string) => Promise<WebhookEvent> } }).provider;
  if (!provider.verifyWebhook) {
    // MockProvider: parse the payload directly (for dev testing)
    return payload as WebhookEvent;
  }
  return provider.verifyWebhook(payload, signature);
}
