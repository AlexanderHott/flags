import { ok, tryAsync, type Result } from "@alexanderhott/resultts";
import type { Bytes } from "./bytes";

export type Sha256Error = {
  kind: "HASH_ERROR";
  cause: unknown;
};
export async function sha256(bytes: Bytes): Promise<Result<Bytes, Sha256Error>> {
  const hashResult = await tryAsync(
    () => crypto.subtle.digest("SHA-256", bytes),
    (cause) => ({ kind: "HASH_ERROR", cause }) as const,
  );
  if (hashResult.isErr()) {
    return hashResult;
  }
  return ok(new Uint8Array(hashResult.value));
}
