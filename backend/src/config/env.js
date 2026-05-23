const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("4000"),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),
  NODE_ENV: z.string().default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.format());
  process.exit(1);
}

const env = {
  port: Number(parsed.data.PORT),
  databaseUrl: parsed.data.DATABASE_URL,
  jwtAccessSecret: parsed.data.JWT_ACCESS_SECRET,
  jwtRefreshSecret: parsed.data.JWT_REFRESH_SECRET,
  jwtAccessExpires: parsed.data.JWT_ACCESS_EXPIRES,
  jwtRefreshExpires: parsed.data.JWT_REFRESH_EXPIRES,
  nodeEnv: parsed.data.NODE_ENV,
};

module.exports = { env };
