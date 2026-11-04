import "server-only";

import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";

import { iamConfig } from "@/configs/iam.server";
import type { HrliteSession } from "./session";

const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number(),
  id_token: z.string().optional(),
});

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

const base64url = (bytes: Uint8Array) =>
  Buffer.from(bytes).toString("base64url");

export function randomToken(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function pkceChallenge(verifier: string): Promise<string> {
  return base64url(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)),
    ),
  );
}

export function redirectUri(): string {
  return `${iamConfig().HRLITE_URL}/auth/callback`;
}

export async function authorizeUrl({
  state,
  nonce,
  verifier,
}: {
  state: string;
  nonce: string;
  verifier: string;
}) {
  const { IAM_ISSUER, IAM_CLIENT_ID } = iamConfig();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: IAM_CLIENT_ID,
    redirect_uri: redirectUri(),
    scope: "openid profile email offline_access",
    state,
    nonce,
    code_challenge: await pkceChallenge(verifier),
    code_challenge_method: "S256",
  });

  return `${IAM_ISSUER}/oauth/authorize?${params}`;
}

/** The token endpoint, called server to server. */
async function requestTokens(body: Record<string, string>) {
  const { IAM_BACKEND_URL, IAM_CLIENT_ID, IAM_CLIENT_SECRET } =
    iamConfig();

  const response = await fetch(`${IAM_BACKEND_URL}/oauth/token`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${IAM_CLIENT_ID}:${IAM_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams(body),
  });

  const parsed = tokenResponseSchema.safeParse(
    await response.json().catch(() => null),
  );

  if (!response.ok || !parsed.success) {
    throw new Error(`IAM token request failed (${response.status}).`);
  }

  return parsed.data;
}

/**
 * Exchanges the code and checks the id_token (signature against IAM's JWKS,
 * issuer, audience, nonce) before trusting who signed in.
 */
export async function completeLogin(
  code: string,
  verifier: string,
  nonce: string,
) {
  const tokens = await requestTokens({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  });

  if (!tokens.id_token) {
    throw new Error("IAM did not return an id_token.");
  }

  const { IAM_BACKEND_URL, IAM_ISSUER, IAM_CLIENT_ID } =
    iamConfig();
  jwks ??= createRemoteJWKSet(new URL(`${IAM_BACKEND_URL}/oauth/jwks`));

  const { payload } = await jwtVerify(tokens.id_token, jwks, {
    issuer: IAM_ISSUER,
    audience: IAM_CLIENT_ID,
  });

  if (payload.nonce !== nonce) {
    throw new Error("The id_token nonce does not match this sign-in.");
  }

  const session: HrliteSession = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    user: {
      sub: String(payload.sub),
      name: String(payload.name ?? payload.email ?? ""),
      email: String(payload.email ?? ""),
    },
  };

  return { session, idToken: tokens.id_token };
}

/** Rotates the refresh token; IAM rejects it once the SSO session or the user's access ends. */
export async function refreshSession(
  session: HrliteSession,
): Promise<HrliteSession> {
  const tokens = await requestTokens({
    grant_type: "refresh_token",
    refresh_token: session.refreshToken,
  });

  return {
    ...session,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
  };
}

export function endSessionUrl(idToken: string | undefined): string {
  const { IAM_ISSUER, HRLITE_URL, IAM_CLIENT_ID } =
    iamConfig();
  const params = new URLSearchParams({
    client_id: IAM_CLIENT_ID,
    post_logout_redirect_uri: `${HRLITE_URL}/signed-out`,
    ...(idToken ? { id_token_hint: idToken } : {}),
  });

  return `${IAM_ISSUER}/oauth/end-session?${params}`;
}
