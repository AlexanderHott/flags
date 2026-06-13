import { z } from "zod";

console.log(process.env.DATABASE_URL, import.meta.env.DATABASE_URL);

const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
});

export const envServer = serverEnvSchema.parse(process.env);

const clientEnvSchema = z.object({
  // VITE_APP_TITLE: z.string().min(1).optional(),
});

export const envClient = clientEnvSchema.parse(import.meta.env);
