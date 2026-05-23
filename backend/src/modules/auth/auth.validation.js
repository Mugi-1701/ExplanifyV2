const { z } = require("zod");

const nameSchema = z.string().min(2).max(80);

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol");

const signupSchema = z.object({
  email: z.string().email(),
  name: nameSchema.optional(),
  password: passwordSchema,
  orgName: z.string().min(2).max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

module.exports = {
  signupSchema,
  loginSchema,
  refreshSchema,
};
