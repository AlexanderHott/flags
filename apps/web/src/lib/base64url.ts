import { err, ok, type Result } from "@alexanderhott/resultts";
import type { Bytes } from "./bytes";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
export function base64urlEncode(bytes: Bytes): string {
  let encoded = "";

  let index = 0;
  for (; index + 2 < bytes.length; index += 3) {
    const value = (bytes[index] << 16) | (bytes[index + 1] << 8) | bytes[index + 2];
    encoded +=
      alphabet[(value >> 18) & 63] +
      alphabet[(value >> 12) & 63] +
      alphabet[(value >> 6) & 63] +
      alphabet[value & 63];
  }

  const remaining = bytes.length - index;
  if (remaining === 1) {
    const value = bytes[index] << 16;
    encoded += alphabet[(value >> 18) & 63] + alphabet[(value >> 12) & 63];
  } else if (remaining === 2) {
    const value = (bytes[index] << 16) | (bytes[index + 1] << 8);
    encoded +=
      alphabet[(value >> 18) & 63] + alphabet[(value >> 12) & 63] + alphabet[(value >> 6) & 63];
  }

  return encoded;
}

export type Base64UrlDecodeError =
  | {
      kind: "INVALID_LENGTH";
    }
  | {
      kind: "INVALID_CHARACTER";
      charCode: number;
    };
export function base64urlDecode(base64url: string): Result<Bytes, Base64UrlDecodeError> {
  if (base64url.length % 4 === 1) {
    return err({ kind: "INVALID_LENGTH" });
  }

  const bytes = new Uint8Array(Math.floor((base64url.length * 3) / 4));
  let byteIndex = 0;

  for (let index = 0; index < base64url.length; index += 4) {
    const remaining = base64url.length - index;
    const char1Code = base64url.charCodeAt(index);
    const char1 = base64UrlDecodeCharacterValue(char1Code);
    if (char1 === -1) {
      return err({ kind: "INVALID_CHARACTER", charCode: char1Code });
    }

    const char2Code = base64url.charCodeAt(index + 1);
    const char2 = base64UrlDecodeCharacterValue(char2Code);
    if (char2 === -1) {
      return err({ kind: "INVALID_CHARACTER", charCode: char2Code });
    }

    let char3 = 0;

    if (remaining > 2) {
      const char3Code = base64url.charCodeAt(index + 2);
      char3 = base64UrlDecodeCharacterValue(char3Code);
      if (char3 === -1) {
        return err({ kind: "INVALID_CHARACTER", charCode: char3Code });
      }
    }

    let char4 = 0;

    if (remaining > 3) {
      const char4Code = base64url.charCodeAt(index + 3);
      char4 = base64UrlDecodeCharacterValue(char4Code);
      if (char4 === -1) {
        return err({ kind: "INVALID_CHARACTER", charCode: char4Code });
      }
    }

    const value = (char1 << 18) | (char2 << 12) | (char3 << 6) | char4;

    bytes[byteIndex] = (value >> 16) & 0xff;
    byteIndex += 1;

    if (remaining > 2) {
      bytes[byteIndex] = (value >> 8) & 0xff;
      byteIndex += 1;
    }

    if (remaining > 3) {
      bytes[byteIndex] = value & 0xff;
      byteIndex += 1;
    }
  }

  return ok(bytes);
}

function base64UrlDecodeCharacterValue(charCode: number): number {
  if (charCode >= 65 && charCode <= 90) {
    return charCode - 65;
  }

  if (charCode >= 97 && charCode <= 122) {
    return charCode - 71;
  }

  if (charCode >= 48 && charCode <= 57) {
    return charCode + 4;
  }

  if (charCode === 45) {
    return 62;
  }

  if (charCode === 95) {
    return 63;
  }

  return -1;
}
