import z from "zod";
import { assertProjectOwnership, protectedProcedure } from "./server";
import { db } from "#/db";
import { eq } from "drizzle-orm";
import * as schema from "#/db/schema";
import { ORPCError } from "@orpc/client";

export const list = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .handler(async ({ context, input }) => {
    await assertProjectOwnership(context.userId, input.projectId);

    const flags = await db.query.flags.findMany({
      where: eq(schema.flags.projectId, input.projectId),
      limit: 10,
    });

    return flags;
  });
export const create = protectedProcedure
  .input(z.object({ name: z.string(), projectId: z.string(), enabled: z.boolean() }))
  .handler(async ({ context, input }) => {
    await assertProjectOwnership(context.userId, input.projectId);

    const [flag] = await db
      .insert(schema.flags)
      .values({ projectId: input.projectId, name: input.name, enabled: input.enabled })
      .returning({ id: schema.flags.id });

    if (!flag) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return flag;
  });
