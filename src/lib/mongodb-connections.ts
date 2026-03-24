import mongoose, { type Connection } from "mongoose";

type PoolName = "users" | "content";

interface CachedPool {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

interface MongoPools {
  users: CachedPool;
  content: CachedPool;
}

const globalWithMongoPools = globalThis as typeof globalThis & {
  __mongoPools?: MongoPools;
};

const pools: MongoPools =
  globalWithMongoPools.__mongoPools ?? {
    users: { conn: null, promise: null },
    content: { conn: null, promise: null },
  };

if (!globalWithMongoPools.__mongoPools) {
  globalWithMongoPools.__mongoPools = pools;
}

const usersUri = process.env.MONGODB_URI_USERS || process.env.MONGODB_URI;
const contentUri = process.env.MONGODB_URI_CONTENT || process.env.MONGODB_URI;

function createPoolConnection(uri: string, poolName: PoolName): Connection {
  const cached = pools[poolName];

  if (cached.conn) return cached.conn;

  cached.conn = mongoose.createConnection(uri, {
    bufferCommands: false,
    maxPoolSize: 10,
  });

  cached.promise = cached.conn.asPromise().catch((error) => {
    cached.conn = null;
    cached.promise = null;
    throw error;
  });

  return cached.conn;
}

export function getUsersConnection(): Connection {
  if (!usersUri) {
    throw new Error("Please define MONGODB_URI_USERS (or MONGODB_URI)");
  }
  return createPoolConnection(usersUri, "users");
}

export function getContentConnection(): Connection {
  if (!contentUri) {
    throw new Error("Please define MONGODB_URI_CONTENT (or MONGODB_URI)");
  }
  return createPoolConnection(contentUri, "content");
}

export async function connectUsersDb() {
  const conn = getUsersConnection();
  await pools.users.promise;
  return conn;
}

export async function connectContentDb() {
  const conn = getContentConnection();
  await pools.content.promise;
  return conn;
}
