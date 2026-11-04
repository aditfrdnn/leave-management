"use server";

import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import { refreshSession } from "@/lib/iam/oidc";
import {
  cookieOptions,
  ID_TOKEN_COOKIE,
  isRefreshDue,
  LOGIN_COOKIE,
  openSession,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sealSession,
} from "@/lib/iam/session";

/**
 * The IAM access token of the signed-in user, for the Bearer header of API calls. `proxy.ts`
 * refreshes it before pages render; a call made later (a long-open tab) refreshes it here.
 * Undefined when there is no session or IAM ended it.
 */
export async function getTokenCookie() {
  const store = await cookies();
  const session = await openSession(store.get(SESSION_COOKIE)?.value);

  if (session === null) {
    return undefined;
  }

  if (!isRefreshDue(session)) {
    return session.accessToken;
  }

  try {
    const refreshed = await refreshSession(session);

    try {
      store.set(SESSION_COOKIE, await sealSession(refreshed), cookieOptions(SESSION_MAX_AGE));
    } catch {
      // Rendering a Server Component: cookies are read-only there, and the proxy refreshes them.
    }

    return refreshed.accessToken;
  } catch {
    return undefined;
  }
}

/** Forgets the HR Lite session in this browser (IAM's own session is ended separately). */
export async function removeTokenCookie() {
  const store = await cookies();

  for (const name of [SESSION_COOKIE, ID_TOKEN_COOKIE, LOGIN_COOKIE]) {
    store.delete(name);
  }
}

/** The request's UI language: the language cookie, or the browser language on a first visit. */
export async function getRequestLocale() {
  return getLocale();
}
