import { NextResponse, type NextRequest } from "next/server";

import { iamConfig } from "@/configs/iam.server";
import { completeLogin } from "@/lib/iam/oidc";
import {
  cookieOptions,
  ID_TOKEN_COOKIE,
  LOGIN_COOKIE,
  openLogin,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  sealSession,
} from "@/lib/iam/session";

/** IAM sends the browser back here with a code (or an error). */
export async function GET(request: NextRequest) {
  const { HRLITE_URL } = iamConfig();
  const params = request.nextUrl.searchParams;
  const login = await openLogin(request.cookies.get(LOGIN_COOKIE)?.value);
  const back = (path: string) => NextResponse.redirect(new URL(path, HRLITE_URL));

  if (params.get("error")) {
    const response = back(`/signed-out?error=${encodeURIComponent(params.get("error") as string)}`);
    response.cookies.delete(LOGIN_COOKIE);
    return response;
  }

  const code = params.get("code");

  if (login === null || code === null || params.get("state") !== login.state) {
    // A stale or forged callback: start a fresh sign-in.
    return back("/auth/login");
  }

  try {
    const { session, idToken } = await completeLogin(code, login.verifier, login.nonce);
    const response = back(login.returnTo);

    response.cookies.delete(LOGIN_COOKIE);
    response.cookies.set(SESSION_COOKIE, await sealSession(session), cookieOptions(SESSION_MAX_AGE));
    response.cookies.set(ID_TOKEN_COOKIE, idToken, cookieOptions(SESSION_MAX_AGE));

    return response;
  } catch {
    return back("/signed-out?error=login_failed");
  }
}
