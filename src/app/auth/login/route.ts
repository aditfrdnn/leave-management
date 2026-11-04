import { NextResponse, type NextRequest } from "next/server";

import { authorizeUrl, randomToken } from "@/lib/iam/oidc";
import { cookieOptions, LOGIN_COOKIE, sealLogin } from "@/lib/iam/session";

/** Only paths inside HR Lite; anything else would be an open redirect. */
function safeReturnTo(path: string | null): string {
  return path && path.startsWith("/") && !path.startsWith("//") && !path.startsWith("/auth/") ? path : "/";
}

/** Starts sign-in: remembers state, nonce and the PKCE verifier, then hands over to IAM. */
export async function GET(request: NextRequest) {
  const login = {
    state: randomToken(),
    nonce: randomToken(),
    verifier: randomToken(),
    returnTo: safeReturnTo(request.nextUrl.searchParams.get("returnTo")),
  };

  const response = NextResponse.redirect(await authorizeUrl(login));
  response.cookies.set(LOGIN_COOKIE, await sealLogin(login), cookieOptions(600));

  return response;
}
