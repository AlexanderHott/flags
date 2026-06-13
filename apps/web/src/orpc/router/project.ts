import { db } from "#/db";
import { assertProjectOwnership, protectedProcedure } from "./server";
import * as schema from "#/db/schema";
import z from "zod";
import { ORPCError } from "@orpc/client";
import { and, desc, eq, lt } from "drizzle-orm";

export const create = protectedProcedure
  .input(
    z.object({
      name: z.string(),
      slug: z.string(),
    }),
  )
  .handler(async ({ context, input }) => {
    const userId = context.userId;
    const [project] = await db
      .insert(schema.projects)
      .values({
        name: input.name,
        slug: input.slug,
        userId,
      })
      .returning({ id: schema.projects.id });

    if (!project) {
      console.log("failed to create project");
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return project;
  });

export const get = protectedProcedure
  .input(z.object({ projectId: z.string() }))
  .handler(async ({ context, input }) => {
    const userId = context.userId;
    const project = await assertProjectOwnership(userId, input.projectId);

    return project;
  });

export const list = protectedProcedure
  .input(
    z.object({
      cursor: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
    }),
  )
  .handler(async ({ context, input }) => {
    const rows = await db.query.projects.findMany({
      where: input.cursor
        ? and(eq(schema.projects.userId, context.userId), lt(schema.projects.id, input.cursor))
        : eq(schema.projects.userId, context.userId),
      limit: input.limit + 1,
      orderBy: desc(schema.projects.createdAt),
    });

    const projects = rows.slice(0, input.limit);
    const hasNextPage = rows.length > input.limit;

    return {
      projects,
      nextId: hasNextPage ? projects.at(-1)?.id : null,
    };
  });
