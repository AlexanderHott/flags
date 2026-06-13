import z from "zod";
import { assertProjectOwnership, protectedProcedure } from "./server";
import { db } from "#/db";
import { and, desc, eq, lt, not } from "drizzle-orm";
import * as schema from "#/db/schema";
import { ORPCError } from "@orpc/client";

export const list = protectedProcedure
  .input(
    z.object({
      projectId: z.string(),

      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
    }),
  )
  .handler(async ({ context, input }) => {
    await assertProjectOwnership(context.userId, input.projectId);

    const rows = await db.query.flags.findMany({
      where: input.cursor
        ? and(eq(schema.flags.projectId, input.projectId), lt(schema.flags.id, input.cursor))
        : eq(schema.flags.projectId, input.projectId),
      limit: input.limit + 1,
      orderBy: desc(schema.flags.createdAt),
    });

    const flags = rows.slice(0, input.limit);
    const hasNextPage = rows.length > input.limit;

    return {
      flags,
      nextId: hasNextPage ? flags.at(-1)?.id : null,
    };
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

export const toggle = protectedProcedure
  .input(z.object({ projectId: z.string(), flagId: z.string(), enabled: z.boolean() }))
  .handler(async ({ context, input }) => {
    await assertProjectOwnership(context.userId, input.projectId);

    const [flag] = await db
      .update(schema.flags)
      .set({ enabled: not(schema.flags.enabled) })
      .where(eq(schema.flags.id, input.flagId))
      .returning({ id: schema.flags.id });

    if (!flag) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return flag;
  });
