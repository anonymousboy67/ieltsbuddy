#!/usr/bin/env npx tsx
import { config } from "dotenv";
config({ path: ".env.local" });

import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import ListeningSection from "../src/models/ListeningSection";

const bookNumber = Number(process.argv[2]);
const folder = process.argv[3] || undefined;
if (!bookNumber) {
  console.error("Usage: npx tsx scripts/link-audio.ts <book_number> [folder]");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryResource {
  public_id: string;
  secure_url: string;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log("Connected to MongoDB");

  // List all audio assets from Cloudinary
  const resources: CloudinaryResource[] = [];
  let nextCursor: string | undefined;

  do {
    const result: { resources: CloudinaryResource[]; next_cursor?: string } =
      await cloudinary.api.resources({
        resource_type: "video", // Cloudinary stores audio under "video"
        type: "upload",
        max_results: 500,
        ...(folder ? { prefix: folder } : {}),
        ...(nextCursor ? { next_cursor: nextCursor } : {}),
      });
    resources.push(...result.resources);
    nextCursor = result.next_cursor;
  } while (nextCursor);

  console.log(`Found ${resources.length} audio assets in Cloudinary${folder ? ` (folder: ${folder})` : ""}`);

  // Match files named like T1S1, T1S2, T2S1, etc.
  const pattern = /T(\d+)S(\d+)/i;
  let updated = 0;

  for (const asset of resources) {
    const filename = asset.public_id.split("/").pop() || "";
    const match = filename.match(pattern);
    if (!match) continue;

    const testNumber = Number(match[1]);
    const partNumber = Number(match[2]);

    const result = await ListeningSection.updateOne(
      { bookNumber, testNumber, partNumber },
      { $set: { audioUrl: asset.secure_url } }
    );

    if (result.matchedCount > 0) {
      console.log(
        `Updated Book ${bookNumber} Test ${testNumber} Part ${partNumber} → ${asset.secure_url}`
      );
      updated++;
    } else {
      console.log(
        `No document found for Book ${bookNumber} Test ${testNumber} Part ${partNumber}`
      );
    }
  }

  console.log(`\nDone. Updated ${updated} documents.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
