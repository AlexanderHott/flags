import { ORPCError, os } from "@orpc/server";
import * as schema from "#/db/schema";
import { getSessionTokenFromCookieString, parseSessionToken, validateSession } from "../auth";
import { db } from "#/db";
import { eq } from "drizzle-orm";

export type ORPCContext = {
  headers: Headers;
  responseHeaders: Headers;
};

export const publicProcedure = os.$context<ORPCContext>().use(({ next }) => {
  try {
    return next();
  } catch (e) {
    console.log(e);
    throw new ORPCError("INTERNAL_SERVER_ERROR");
  }
});

export const protectedProcedure = publicProcedure.use(async ({ context, next }) => {
  const cookieString = context.headers.get("cookie");
  if (!cookieString) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const sessionToken = getSessionTokenFromCookieString(cookieString);
  if (!sessionToken) {
    throw new ORPCError("UNAUTHORIZED");
  }
  const sessionTokenParsed = parseSessionToken(sessionToken);
  if (!sessionTokenParsed) {
    throw new ORPCError("UNAUTHORIZED");
  }
  const { sessionId, sessionSecret } = sessionTokenParsed;

  const dbSession = await db.query.sessions.findFirst({
    where: eq(schema.sessions.id, sessionId),
  });
  if (!dbSession) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const sessionIsValid = validateSession(sessionSecret, dbSession);

  if (!sessionIsValid) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({ context: { userId: dbSession.userId, sessionId: dbSession.id } });
});
