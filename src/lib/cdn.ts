import crypto from "crypto";

export interface SignedUrl {
  url: string;
  expires_at: string;
}

function isConfigured(): boolean {
  return !!(
    process.env["CLOUDFRONT_BASE_URL"] &&
    process.env["CLOUDFRONT_KEY_PAIR_ID"] &&
    process.env["CLOUDFRONT_PRIVATE_KEY"]
  );
}

export function signFullVideoUrl(s3Key: string, ttlSeconds = 3600): SignedUrl {
  const baseUrl = process.env["CLOUDFRONT_BASE_URL"];
  const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;
  const expiresAt = new Date(expiry * 1000).toISOString();

  if (!baseUrl) {
    return { url: `https://cdn.example.com/${s3Key}`, expires_at: expiresAt };
  }

  const resourceUrl = `${baseUrl}/${s3Key}`;

  if (!isConfigured()) {
    return { url: resourceUrl, expires_at: expiresAt };
  }

  const keyPairId = process.env["CLOUDFRONT_KEY_PAIR_ID"]!;
  const privateKey = process.env["CLOUDFRONT_PRIVATE_KEY"]!;

  const policy = JSON.stringify({
    Statement: [
      {
        Resource: resourceUrl,
        Condition: { DateLessThan: { "AWS:EpochTime": expiry } },
      },
    ],
  });

  const sig = crypto
    .createSign("RSA-SHA1")
    .update(policy)
    .sign(privateKey, "base64")
    .replace(/\+/g, "-")
    .replace(/=/g, "_")
    .replace(/\//g, "~");

  const pol = Buffer.from(policy)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/=/g, "_")
    .replace(/\//g, "~");

  return {
    url: `${resourceUrl}?Policy=${pol}&Signature=${sig}&Key-Pair-Id=${keyPairId}`,
    expires_at: expiresAt,
  };
}

export function publicClipUrl(s3Key: string | null): string | null {
  if (!s3Key) return null;
  const base = process.env["CLOUDFRONT_BASE_URL"];
  return base ? `${base}/${s3Key}` : null;
}
