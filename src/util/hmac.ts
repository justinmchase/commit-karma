import { hexToUint8 } from "./hex.ts";
import { base64Decode } from "../../deps/std.ts";

/*
 * Creates an hmac CryptoKey for signing and verifycation of hmac hashes.
 * @param secret must be a base64 encoded secret key value
 */
export async function hmacCreateKey(secret: string): Promise<CryptoKey> {
  const key = base64Decode(secret);
  return await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function hmacSign(key: CryptoKey, value: string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(value);
  return await crypto.subtle.sign(
    { name: "HMAC" },
    key,
    bytes,
  );
}

export async function hmacVerify(
  key: CryptoKey,
  hex: string,
  data: BufferSource,
) {
  const signature = hexToUint8(hex);
  return await crypto.subtle.verify(
    { name: "HMAC" },
    key,
    signature,
    data,
  );
}
