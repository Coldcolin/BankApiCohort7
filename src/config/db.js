import mongoose from 'mongoose';
import { env } from './env.js';

const cached = globalThis.__mongoose ?? { conn: null, promise: null };
globalThis.__mongoose = cached;

export async function connectDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    mongoose.set('strictQuery', true);
    cached.promise = mongoose
      .connect(env.DATABASE_URL, { bufferCommands: false })
      .then((mongooseInstance) => mongooseInstance);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function getSession() {
  return mongoose.startSession();
}
