import type { v2 as CloudinaryV2 } from "cloudinary";

let _cloudinary: typeof CloudinaryV2 | null = null;

async function getCloudinary(): Promise<typeof CloudinaryV2> {
  if (_cloudinary) return _cloudinary;

  // Clean up any malformed CLOUDINARY_URL before the SDK reads it.
  // The SDK auto-parses this env var on require() and throws if it
  // doesn't start with "cloudinary://".
  const saved = process.env.CLOUDINARY_URL;
  if (saved && !saved.startsWith("cloudinary://")) {
    delete process.env.CLOUDINARY_URL;
  }

  const { v2: cloudinary } = await import("cloudinary");

  // Restore so other code isn't affected
  if (saved) process.env.CLOUDINARY_URL = saved;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  _cloudinary = cloudinary;
  return cloudinary;
}

export async function uploadImage(
  file: Buffer,
  folder: string = "ieltsbuddy"
): Promise<string> {
  const cloudinary = await getCloudinary();
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (error, result) => {
        if (error) return reject(error);
        resolve(result!.secure_url);
      })
      .end(file);
  });
}

export { getCloudinary };
