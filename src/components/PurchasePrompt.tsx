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
    <div className="border-t border-gray-100 pt-5 mt-2">
      <p className="text-sm font-semibold text-gray-800 mb-3">Get full access</p>
      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

      <div className="flex flex-wrap gap-3">
        {singleProduct && (
          <button
            onClick={() => void buyVideo(singleProduct.id)}
            disabled={loading !== null}
            className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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
            className="bg-white text-indigo-600 border border-indigo-600 px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 disabled:opacity-50 transition-colors"
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
