import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const options = {};

const globalWithMongo = globalThis as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

const clientPromise: Promise<MongoClient> =
  globalWithMongo._mongoClientPromise ??
  (globalWithMongo._mongoClientPromise = new MongoClient(uri, options).connect());

export default clientPromise;
