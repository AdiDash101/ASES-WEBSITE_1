import { randomUUID } from "node:crypto";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";

const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const paymentProofAllowedMimeTypes = Object.keys(mimeToExtension);
export const paymentProofMaxBytes = 10 * 1024 * 1024;

let s3Client: S3Client | null = null;

const getS3Client = () => {
  if (s3Client) {
    return s3Client;
  }

  if (
    !env.MINIO_ENDPOINT ||
    !env.MINIO_ACCESS_KEY ||
    !env.MINIO_SECRET_KEY ||
    !env.MINIO_BUCKET
  ) {
    throw new Error("MinIO config is incomplete.");
  }

  s3Client = new S3Client({
    region: env.MINIO_REGION,
    endpoint: env.MINIO_ENDPOINT,
    forcePathStyle: env.MINIO_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.MINIO_ACCESS_KEY,
      secretAccessKey: env.MINIO_SECRET_KEY,
    },
  });

  return s3Client;
};

const normalizeTtl = (ttlSeconds: number) =>
  Math.max(60, Math.min(ttlSeconds, 3600));

export const isAllowedPaymentProofMime = (contentType: string) =>
  paymentProofAllowedMimeTypes.includes(contentType);

export const buildPaymentProofObjectKey = (userId: string, contentType: string) => {
  const extension = mimeToExtension[contentType] ?? "bin";
  return `applications/${userId}/payment-proof-${Date.now()}-${randomUUID()}.${extension}`;
};

export const createPaymentProofUploadUrl = async (
  objectKey: string,
  contentType: string,
  contentLength: number
) => {
  const client = getS3Client();
  const expiresIn = normalizeTtl(env.MINIO_SIGNED_URL_TTL_SECONDS);

  const command = new PutObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: objectKey,
    ContentType: contentType,
    ContentLength: contentLength,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  return { uploadUrl, expiresIn };
};

export const createPaymentProofViewUrl = async (
  objectKey: string,
  ttlSeconds = 900
) => {
  const client = getS3Client();
  const expiresIn = normalizeTtl(ttlSeconds);
  const command = new GetObjectCommand({
    Bucket: env.MINIO_BUCKET,
    Key: objectKey,
  });
  return getSignedUrl(client, command, { expiresIn });
};

export const paymentProofObjectExists = async (objectKey: string) => {
  const client = getS3Client();
  try {
    await client.send(
      new HeadObjectCommand({
        Bucket: env.MINIO_BUCKET,
        Key: objectKey,
      })
    );
    return true;
  } catch (error) {
    const errorName = (error as { name?: string })?.name;
    if (errorName === "NotFound") {
      return false;
    }
    throw error;
  }
};
