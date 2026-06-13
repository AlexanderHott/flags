import type * as schema from "#/db/schema";
import { base64urlDecode, base64urlEncode } from "#/lib/base64url";
import { constantTimeEquals } from "#/lib/constantTimeEquals.node";
import { sha256, type Sha256Error } from "#/lib/sha256";
import { ok, type Result } from "@alexanderhott/resultts";
import { hash, verify } from "@node-rs/argon2";
import { v7 as uuidV7 } from "uuid";

const SESSION_LENGTH_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_TOKEN_COOKIE_NAME = "flags_session_token";
const SESSION_TOKEN_SEPARATOR = ".";

const PASSWORD_HASH_MEMORY_COST = 19 * 1024; // 19MB https://thecopenhagenbook.com/password-authentication
const PASSWORD_HASH_PARALLELISM = 1;
const PASSWORD_HASH_TIME_COST = 2;

function generateSecureRandomValue(length: number) {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return buffer;
}

// we have this because the @node-rs/argon2 uses a typescript enum which
// doesn't play well with the build system
const Algorithm = {
  Argon2id: 2,
} as const;

export async function hashPassword(password: string, signal?: AbortSignal) {
  const salt = generateSecureRandomValue(32);

  const passwordHash = await hash(
    password,
    {
      algorithm: Algorithm.Argon2id,
      salt,
      memoryCost: PASSWORD_HASH_MEMORY_COST,
      parallelism: PASSWORD_HASH_PARALLELISM,
      timeCost: PASSWORD_HASH_TIME_COST,
    },
    signal,
  );

  return passwordHash;
}

export async function verifyPassword(passwordHash: string, password: string, signal?: AbortSignal) {
  const verified = await verify(
    passwordHash,
    password,
    {
      algorithm: Algorithm.Argon2id,
      memoryCost: PASSWORD_HASH_MEMORY_COST,
      parallelism: PASSWORD_HASH_PARALLELISM,
      timeCost: PASSWORD_HASH_TIME_COST,
    },
    signal,
  );

  return verified;
}

interface RawSessionWithToken {
  id: string;
  secretHash: string;
  expiresAt: Date;
  token: string;
}
export async function generateSession(): Promise<Result<RawSessionWithToken, Sha256Error>> {
  const sessionSecret = generateSecureRandomValue(32);

  const sessionSecretHashResult = await sha256(sessionSecret);
  if (sessionSecretHashResult.isErr()) {
    return sessionSecretHashResult;
  }
  const sessionSecretHash = sessionSecretHashResult.value;

  const sessionSecretString = base64urlEncode(sessionSecret);
  const sessionId = uuidV7();
  const sessionToken = `${sessionId}${SESSION_TOKEN_SEPARATOR}${sessionSecretString}`;

  const sessionSecretHashString = base64urlEncode(sessionSecretHash);

  const expiresAt = new Date(Date.now() + SESSION_LENGTH_MS);

  return ok({ id: sessionId, secretHash: sessionSecretHashString, token: sessionToken, expiresAt });
}

export function formatSessionToken(sessionId: string, sessionSecret: string) {
  return `${sessionId}${SESSION_TOKEN_SEPARATOR}${sessionSecret}`;
}

export function parseSessionToken(sessionToken: string) {
  const [sessionId, sessionSecret] = sessionToken.split(SESSION_TOKEN_SEPARATOR, 2);
  if (!sessionId || !sessionSecret) {
    return undefined;
  }
  return { sessionId, sessionSecret };
}

export function createSessionCookie(sessionToken: string) {
  return [
    `${SESSION_TOKEN_COOKIE_NAME}=${encodeURIComponent(sessionToken)}`,
    "Max-Age=86400",
    "HttpOnly",
    "Secure",
    "Path=/",
    "SameSite=Lax",
  ].join("; ");
}

export function getSessionTokenFromCookieString(cookieString: string) {
  const cookies = cookieString.split("; ").filter(Boolean);
  const sessionTokenCookie = cookies.find((c) => c.startsWith(`${SESSION_TOKEN_COOKIE_NAME}=`));

  if (!sessionTokenCookie) {
    return undefined;
  }
  const [_, sessionTokenEncoded] = sessionTokenCookie.split("=", 2);
  if (!sessionTokenEncoded) {
    return undefined;
  }
  return decodeURIComponent(sessionTokenEncoded);
}

export async function validateSession(sessionSecretString: string, dbSession: schema.Session) {
  if (dbSession.expiresAt.getTime() < Date.now()) {
    console.log("session expired");
    return false;
  }

  const sessionSecretBytesResult = base64urlDecode(sessionSecretString);
  if (sessionSecretBytesResult.isErr()) {
    console.log("error decoding session secret");
    return false;
  }

  const sessionSecretHashResult = await sha256(sessionSecretBytesResult.value);
  if (sessionSecretHashResult.isErr()) {
    console.log("error hashing session secret");
    return false;
  }
  const sessionSecretHash = sessionSecretHashResult.value;

  const sessionSecretHashExpectedResult = base64urlDecode(dbSession.secretHash);
  if (sessionSecretHashExpectedResult.isErr()) {
    console.log("error decoding saved session secret hash");
    return false;
  }
  const sesssionSecretHashExpected = sessionSecretHashExpectedResult.value;

  const hashesAreEqual = constantTimeEquals(sessionSecretHash, sesssionSecretHashExpected);
  if (!hashesAreEqual) {
    return false;
  }

  return true;
}
