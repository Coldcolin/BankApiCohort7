import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default('1h'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(14).default(12),
});

let cachedEnv = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  cachedEnv = parsed.data;
  return cachedEnv;
}

export const env = new Proxy(
  {},
  {
    get(_target, prop) {
      return getEnv()[prop];
    },
  },
);
