"use server";

import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import { environment } from "@/configs/environment";

const TOKEN_KEY = environment.TOKEN_KEY;

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 6,
};

export async function getTokenCookie() {
  return (await cookies()).get(TOKEN_KEY)?.value;
}

export async function setTokenCookie(token: string) {
  (await cookies()).set(TOKEN_KEY, token, COOKIE_OPTIONS);
}

export async function removeTokenCookie() {
  (await cookies()).delete(TOKEN_KEY);
}

/**
 * Who signed in last on this browser. It outlives the token (logout, expiry), so the next sign-in
 * can tell whether the page in `callback` belonged to someone else.
 */
const LAST_USER_KEY = "hrlite_last_user";

export async function getLastUserCookie() {
  return (await cookies()).get(LAST_USER_KEY)?.value;
}

export async function setLastUserCookie(userId: string) {
  (await cookies()).set(LAST_USER_KEY, userId, { ...COOKIE_OPTIONS, maxAge: 60 * 60 * 24 * 365 });
}

/** The request's UI language: the language cookie, or the browser language on a first visit. */
export async function getRequestLocale() {
  return getLocale();
}
