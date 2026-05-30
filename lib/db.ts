import mongoose from "mongoose";
import { mongoUri } from "./config";

/**
 * Global cache to prevent multiple connections in serverless / hot-reload
 * environments. The `global` object persists across module re-evaluations.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.__mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.__mongooseCache) {
  global.__mongooseCache = cached;
}

/**
 * Connect to MongoDB. Returns the cached connection if already established,
 * otherwise creates a new one and caches it.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
