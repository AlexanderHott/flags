import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
});

export const envServer = serverEnvSchema.parse(process.env);

const clientEnvSchema = z.object({
  // VITE_APP_TITLE: z.string().min(1).optional(),
});

export const envClient = clientEnvSchema.parse(import.meta.env);
