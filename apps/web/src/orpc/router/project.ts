import { db } from "#/db";
import { assertProjectOwnership, protectedProcedure } from "./server";
import * as schema from "#/db/schema";
import z from "zod";
import { ORPCError } from "@orpc/client";

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
