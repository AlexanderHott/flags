import { db } from "#/db";
import * as schema from "#/db/schema";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import z from "zod";
import {
  createSessionCookie,
  generateSession,
  getSessionTokenFromCookieString,
  hashPassword,
  parseSessionToken,
  validateSession,
  verifyPassword,
} from "../auth";
import { protectedProcedure, publicProcedure } from "./server";

export const signUp = publicProcedure
  .input(
    z.object({
      username: z.string(),
      password: z.string(),
    }),
  )
  .handler(async ({ context, input, signal }) => {
    const passwordHash = await hashPassword(input.password, signal);

    const [user] = await db
      .insert(schema.users)
      .values({
        username: input.username,
        passwordHash,
      })
      .returning({ id: schema.users.id });
    if (!user) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    const generateSessionResult = await generateSession();
    if (generateSessionResult.isErr()) {
      console.log("Error generating session", generateSessionResult.error);
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
    const {
      secretHash,
      id: sessionId,
      token: sessionToken,
      expiresAt,
    } = generateSessionResult.value;

    const [session] = await db
      .insert(schema.sessions)
      .values({ id: sessionId, secretHash, userId: user.id, expiresAt })
      .returning({ id: schema.sessions.id });

    if (!session) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
    context.responseHeaders.append("Set-Cookie", createSessionCookie(sessionToken));

    return { userId: user.id, sessionId: session.id };
  });

export const logIn = publicProcedure
  .input(
    z.object({
      username: z.string(),
      password: z.string(),
    }),
  )
  .handler(async ({ context, input, signal }) => {
    const user = await db.query.users.findFirst({
      where: eq(schema.users.username, input.username),
    });
    if (!user) {
      throw new ORPCError("NOT_FOUND");
    }

    const verified = await verifyPassword(user.passwordHash, input.password, signal);

    if (!verified) {
      throw new ORPCError("UNAUTHORIZED");
    }

    const generateSessionResult = await generateSession();
    if (generateSessionResult.isErr()) {
      console.log("Error generating session", generateSessionResult.error);
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }
    const {
      secretHash,
      id: sessionId,
      token: sessionToken,
      expiresAt,
    } = generateSessionResult.value;

    const [session] = await db
      .insert(schema.sessions)
      .values({ id: sessionId, secretHash, userId: user.id, expiresAt })
      .returning({ id: schema.sessions.id });
    context.responseHeaders.append("Set-Cookie", createSessionCookie(sessionToken));
    if (!session) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { userId: user.id, sessionId: session.id };
  });

export const logOut = protectedProcedure.handler(async ({ context }) => {
  await db.delete(schema.sessions).where(eq(schema.sessions.id, context.sessionId));
  context.responseHeaders.append("Set-Cookie", createSessionCookie(""));
  return { sessionId: context.sessionId };
});

export const verifySession = publicProcedure.handler(async ({ context }) => {
  const cookieString = context.headers.get("cookie");
  if (!cookieString) {
    console.log("no cookie header");
    return null;
  }

  const sessionToken = getSessionTokenFromCookieString(cookieString);
  if (!sessionToken) {
    console.log("no session token");
    return null;
  }

  const sessionTokenParsed = parseSessionToken(sessionToken);
  if (!sessionTokenParsed) {
    return null;
  }
  const { sessionId, sessionSecret } = sessionTokenParsed;

  const dbSession = await db.query.sessions.findFirst({
    where: eq(schema.sessions.id, sessionId),
  });
  if (!dbSession) {
    console.log("no session in database");
    return null;
  }

  const sessionIsValid = validateSession(sessionSecret, dbSession);

  if (!sessionIsValid) {
    console.log("session not valid");
    return null;
  }

  return { sessionId: dbSession.id, userId: dbSession.userId };
});
