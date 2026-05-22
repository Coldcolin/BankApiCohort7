import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.DATABASE_URL);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function getSession() {
  return mongoose.startSession();
}
