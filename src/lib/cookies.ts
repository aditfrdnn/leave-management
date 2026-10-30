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

/** The request's UI language: the language cookie, or the browser language on a first visit. */
export async function getRequestLocale() {
  return getLocale();
}
