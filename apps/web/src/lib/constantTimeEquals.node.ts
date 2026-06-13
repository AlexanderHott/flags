import { timingSafeEqual } from "node:crypto";
import type { Bytes } from "./bytes";

export function constantTimeEquals(a: Bytes, b: Bytes) {
  return a.length === b.length && timingSafeEqual(a, b);
}
