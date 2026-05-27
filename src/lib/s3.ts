import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: process.env["AWS_REGION"] ?? "us-east-1",
    });
  }
  return client;
}

function bucket(): string {
  const b = process.env["S3_BUCKET_NAME"];
  if (!b) throw new Error("S3_BUCKET_NAME is required for S3 operations");
  return b;
}

function isConfigured(): boolean {
  return !!(process.env["AWS_ACCESS_KEY_ID"] && process.env["S3_BUCKET_NAME"]);
}

export async function getPresignedPutUrl(
  key: string,
  contentType = "video/mp4",
  ttlSeconds = 7200
): Promise<string> {
  if (!isConfigured()) {
    return `https://s3.example.com/upload/${key}?mock=true`;
  }
  const cmd = new PutObjectCommand({
    Bucket: bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getClient(), cmd, { expiresIn: ttlSeconds });
}

export async function getPresignedGetUrl(
  key: string,
  ttlSeconds = 86400
): Promise<string> {
  if (!isConfigured()) {
    return `https://s3.example.com/${key}?mock=true`;
  }
  const cmd = new GetObjectCommand({ Bucket: bucket(), Key: key });
  return getSignedUrl(getClient(), cmd, { expiresIn: ttlSeconds });
}

export async function objectExists(key: string): Promise<boolean> {
  if (!isConfigured()) return true; // dev mode: assume exists
  try {
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");
    await getClient().send(new HeadObjectCommand({ Bucket: bucket(), Key: key }));
    return true;
  } catch {
    return false;
  }
}
