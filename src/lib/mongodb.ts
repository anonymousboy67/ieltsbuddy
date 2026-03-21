import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cached: MongooseCache = globalWithMongoose.mongoose ?? {
  conn: null,
  promise: null,
};

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = cached;
}

export default async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI!).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
