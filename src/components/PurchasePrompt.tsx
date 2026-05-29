"use client";

import { useState } from "react";
import type { ProductRow } from "@/lib/types";

interface Props {
  exerciseId: string;
  singleProduct: ProductRow | null;
  subProduct: ProductRow | null;
}

export default function PurchasePrompt({ exerciseId, singleProduct, subProduct }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buyVideo(productId: string) {
    setLoading("video");
    setError(null);
    const res = await fetch("/api/checkout/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId, productId }),
    });
    if (res.ok) {
      const { checkout_url } = (await res.json()) as { checkout_url: string };
      window.location.href = checkout_url;
    } else {
      const { error: msg } = (await res.json()) as { error: string };
      setError(msg);
      setLoading(null);
    }
  }

  async function subscribe(productId: string) {
    setLoading("sub");
    setError(null);
    const res = await fetch("/api/checkout/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      const { checkout_url } = (await res.json()) as { checkout_url: string };
      window.location.href = checkout_url;
    } else {
      const { error: msg } = (await res.json()) as { error: string };
      setError(msg);
      setLoading(null);
    }
  }

  if (!singleProduct && !subProduct) return null;

  return (
    <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem", marginTop: "0.5rem" }}>
      <p className="label" style={{ marginBottom: "0.75rem" }}>Get full access</p>
      {error && (
        <p style={{ color: "var(--red)", fontSize: "0.82rem", marginBottom: "0.75rem" }}>{error}</p>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
        {singleProduct && (
          <button
            onClick={() => void buyVideo(singleProduct.id)}
            disabled={loading !== null}
            className="btn btn-primary"
          >
            {loading === "video"
              ? "Redirecting…"
              : `Buy this video — $${(singleProduct.price_cents / 100).toFixed(2)}`}
          </button>
        )}
        {subProduct && (
          <button
            onClick={() => void subscribe(subProduct.id)}
            disabled={loading !== null}
            className="btn btn-ghost"
          >
            {loading === "sub"
              ? "Redirecting…"
              : `Subscribe — from $${(subProduct.price_cents / 100).toFixed(2)}/mo`}
          </button>
        )}
      </div>
    </div>
  );
}
