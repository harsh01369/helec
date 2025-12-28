// packages/backend/src/config/env.ts
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DATABASE_URL: z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),

  GROQ_API_KEY: z.string().min(20, "GROQ_API_KEY is missing or too short"),

  VITE_API_URL: z.string().url().optional(),
  VITE_WS_URL: z.string().url().optional(),

  JWT_SECRET: z
    .string()
    .min(32)
    .default("super-secret-change-me-32-chars-minimum"),

  RATE_LIMIT_MAX: z.coerce.number().default(60),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
});

const env = envSchema.parse(process.env);

export const config = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  isDev: env.NODE_ENV === "development",
  isProd: env.NODE_ENV === "production",

  databaseUrl: env.DATABASE_URL,

  anthropicApiKey: env.ANTHROPIC_API_KEY,
  openaiApiKey: env.OPENAI_API_KEY,
  groqApiKey: env.GROQ_API_KEY,

  jwtSecret: env.JWT_SECRET,

  rateLimit: {
    max: env.RATE_LIMIT_MAX,
    windowMs: env.RATE_LIMIT_WINDOW_MS,
  },
} as const;
