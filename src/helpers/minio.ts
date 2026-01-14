import { minioClient } from "../configs/minio";
import { Readable } from "stream";

export function slugifyBucket(appName: string, prefix = "app"): string {
  try {
    let slug = appName.toLowerCase().replace(/[^a-z0-9-]/g, "-");
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
  data: Buffer | Readable,
): Promise<boolean> {
  try {
    // If data is a ReadableStream, convert to Node.js Readable
    let payload: Buffer | Readable = data;
    if ("getReader" in data) {
      // Web File/Blob streams have getReader()
      payload = Readable.from(data as any);
    }

    await minioClient.putObject(bucketName, objectName, payload);
    console.log(`Uploaded object: ${objectName} to bucket: ${bucketName}`);
    return true;
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
