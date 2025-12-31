import { z } from "zod";

export const signupSchema = z.object({
  full_name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  password: z.string().min(8).max(100),
  phone: z.string().max(40).optional().nullable(),
  country: z.string().length(2).optional().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email().max(180),
  password: z.string().min(1).max(100),
});
