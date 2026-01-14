import { minioClient } from "../configs/minio";
import { Readable } from "stream";
import type { ReadableStream as WebReadableStream } from "stream/web";

export function slugifyBucket(appName: string, prefix = "app"): string {
  try {
    const slug = appName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    let bucketName = `${prefix}-${slug}`;
    bucketName = bucketName.replace(/^-+/, "").replace(/-+$/, "");
    if (bucketName.length > 63) bucketName = bucketName.slice(0, 63);
    return bucketName;
  } catch (err) {
    console.error("Error slugifying bucket:", err);
    return `${prefix}-default-bucket`;
  }
}

export async function ensureBucket(bucketName: string): Promise<boolean> {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, "");
      console.log(`Bucket created: ${bucketName}`);
    } else {
      console.log(`Bucket already exists: ${bucketName}`);
    }
    return true;
  } catch (err) {
    console.error(`Failed to ensure bucket "${bucketName}":`, err);
    return false;
  }
}

export async function uploadObject(
  bucketName: string,
  objectName: string,
  data: Buffer | Readable | WebReadableStream,
): Promise<string | boolean> {
  try {
    const filePrefix = new Date().toISOString();
    let payload: Buffer | Readable;

    if (data instanceof Buffer || data instanceof Readable) {
      payload = data;
    } else {
      payload = Readable.fromWeb(data as WebReadableStream);
    }

    await minioClient.putObject(
      bucketName,
      `${filePrefix}-${objectName}`,
      payload,
    );
    console.log(`Uploaded object: ${objectName} to bucket: ${bucketName}`);
    return `${filePrefix}-${objectName}`;
  } catch (err) {
    console.error(`Failed to upload "${objectName}" to "${bucketName}":`, err);
    return false;
  }
}

export async function getObject(
  bucketName: string,
  objectName: string,
): Promise<Buffer | null> {
  try {
    const stream = await minioClient.getObject(bucketName, objectName);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  } catch (err) {
    console.error(`Failed to get "${objectName}" from "${bucketName}":`, err);
    return null;
  }
}
