import "server-only";

import { EncryptJWT, jwtDecrypt } from "jose";
import { z } from "zod";

import { iamConfig } from "@/configs/iam.server";

/**
 * The HR Lite session lives in the browser as an encrypted cookie (A256GCM) holding the IAM
 * tokens. The id_token sits in its own cookie because the two together would pass the 4 KB
 * cookie limit; it is only used as the logout hint.
 */
export const SESSION_COOKIE = "__Host-hrlite_session";
export const ID_TOKEN_COOKIE = "__Host-hrlite_id";
export const LOGIN_COOKIE = "__Host-hrlite_login";

const sessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  /** Unix seconds when the access token expires. */
  expiresAt: z.number(),
  user: z.object({ sub: z.string(), name: z.string(), email: z.string() }),
});

const loginSchema = z.object({
  state: z.string(),
  nonce: z.string(),
  verifier: z.string(),
  returnTo: z.string(),
});

export type HrliteSession = z.infer<typeof sessionSchema>;
export type PendingLogin = z.infer<typeof loginSchema>;

/** Matches the longest IAM session (12 hours); IAM itself enforces the real limit. */
export const SESSION_MAX_AGE = 60 * 60 * 12;

/** Refresh this long before the access token expires. */
export const REFRESH_LEEWAY_SECONDS = 60;

function key(): Uint8Array {
  return new Uint8Array(Buffer.from(iamConfig().SESSION_SECRET, "base64").subarray(0, 32));
}

async function seal(payload: Record<string, unknown>, maxAge: number): Promise<string> {
  return new EncryptJWT(payload)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(`${maxAge}s`)
    .encrypt(key());
}

async function open<T>(value: string | undefined, schema: z.ZodType<T>): Promise<T | null> {
  if (!value) {
    return null;
  }

  try {
    const { payload } = await jwtDecrypt(value, key());
    const parsed = schema.safeParse(payload);

    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export const sealSession = (session: HrliteSession) => seal(session, SESSION_MAX_AGE);
export const openSession = (value: string | undefined) => open(value, sessionSchema);
export const sealLogin = (login: PendingLogin) => seal(login, 600);
export const openLogin = (value: string | undefined) => open(value, loginSchema);

export const isRefreshDue = (session: HrliteSession) => session.expiresAt - Date.now() / 1000 <= REFRESH_LEEWAY_SECONDS;

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});
