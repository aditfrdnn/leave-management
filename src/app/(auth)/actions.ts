"use server";

import { cookies } from "next/headers";

import { removeTokenCookie } from "@/lib/cookies";
import { endSessionUrl } from "@/lib/iam/oidc";
import { ID_TOKEN_COOKIE } from "@/lib/iam/session";

/**
 * Signs out of HR Lite and of IAM: clears the session here, then the caller sends the browser to
 * IAM's end-session URL, which signs out of every app and comes back to /signed-out. A server
 * action (POST, same origin) so a link elsewhere cannot sign the user out.
 */
export async function SignOut() {
  const idToken = (await cookies()).get(ID_TOKEN_COOKIE)?.value;

  await removeTokenCookie();

  return { success: true, url: endSessionUrl(idToken) };
}
