import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default('1h'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:5173')
    .transform((value) =>
      value.split(',').map((origin) => origin.trim()).filter(Boolean),
    ),
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

  const corsOrigins = [...parsed.data.CORS_ORIGIN];

  if (process.env.RENDER_EXTERNAL_URL) {
    try {
      corsOrigins.push(new URL(process.env.RENDER_EXTERNAL_URL).origin);
    } catch {
      // Ignore invalid Render URL
    }
  }

  cachedEnv = {
    ...parsed.data,
    CORS_ORIGIN: [...new Set(corsOrigins)],
  };
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
