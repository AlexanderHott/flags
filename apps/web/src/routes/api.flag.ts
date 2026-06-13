import { db } from "#/db";
import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import z from "zod";
import * as schema from "#/db/schema";

const inputSchema = z.object({ flagId: z.string() });

export const Route = createFileRoute("/api/flag")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const searchParams = Object.fromEntries(Array.from(url.searchParams.entries()));

        const result = inputSchema.safeParse(searchParams);
        if (!result.success) {
          return new Response(JSON.stringify({ ok: false, error: "Invalid search parameter" }), {
            status: 400,
            statusText: "BAD_REQUEST",
            headers: {
              "Content-Type": "application/json",
            },
          });
        }

        const flag = await db.query.flags.findFirst({
          where: eq(schema.flags.id, result.data.flagId),
        });
        if (!flag) {
          return new Response(JSON.stringify({ ok: false, error: "No flag found" }), {
            status: 404,
            statusText: "NOT_FOUND",
            headers: {
              "Content-Type": "application/json",
            },
          });
        }

          return new Response(JSON.stringify({ ok: true, enabled: flag.enabled }), {
            status: 200,
            statusText: "OK",
            headers: {
              "Content-Type": "application/json",
            },
          });
      },
    },
  },
});
