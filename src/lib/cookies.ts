"use server";

import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";

import { environment } from "@/configs/environment";
import type { TUser } from "@/types/auth";

const TOKEN_KEY = environment.TOKEN_KEY;
const USER_KEY = environment.USER_KEY;

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
 * The leave API has no `GET /api/me` yet (docs/backend-task.md §1), so the user returned by
 * login is kept in a second httpOnly cookie and served back by `app/api/me/route.ts`.
 */
export async function getUserCookie(): Promise<TUser | null> {
  const raw = (await cookies()).get(USER_KEY)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as TUser;
  } catch {
    return null;
  }
}

export async function setUserCookie(user: TUser) {
  (await cookies()).set(USER_KEY, JSON.stringify(user), COOKIE_OPTIONS);
}

export async function removeUserCookie() {
  (await cookies()).delete(USER_KEY);
}

/** The request's UI language: the language cookie, or the browser language on a first visit. */
export async function getRequestLocale() {
  return getLocale();
}
