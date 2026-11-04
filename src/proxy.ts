import { NextRequest, NextResponse } from "next/server";

import { refreshSession } from "@/lib/iam/oidc";
import { cookieOptions, isRefreshDue, openSession, SESSION_COOKIE, SESSION_MAX_AGE, sealSession } from "@/lib/iam/session";

/** Open without a session. `/auth/*` is where signing in happens. */
const PUBLIC_ROUTES = ["/signed-out"];

/**
 * Every page needs an IAM session; without one the browser goes to IAM to sign in and comes back
 * to the same page. The access token is refreshed here, before pages render.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/auth/") || PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  const session = await openSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (session === null) {
    return signInAgain(request, pathname === "/sign-in" ? "/" : `${pathname}${search}`);
  }

  if (pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isRefreshDue(session)) {
    return NextResponse.next();
  }

  let sealed: string | null;

  try {
    sealed = await sealSession(await refreshSession(session));
  } catch {
    // IAM refused (session ended, access removed): sign in again.
    sealed = null;
  }

  if (sealed === null) {
    const response = signInAgain(request, `${pathname}${search}`);
    response.cookies.delete(SESSION_COOKIE);

    return response;
  }

  // Hand the new cookie to this very request too, so pages render with the fresh token.
  request.cookies.set(SESSION_COOKIE, sealed);
  const headers = new Headers(request.headers);
  headers.set("cookie", request.cookies.toString());

  const response = NextResponse.next({ request: { headers } });
  response.cookies.set(SESSION_COOKIE, sealed, cookieOptions(SESSION_MAX_AGE));

  return response;
}

/**
 * Back to IAM to sign in, then to `returnTo`. A page load is redirected. A Server Action (a POST
 * from a page that was already open when the session ended) cannot follow a redirect, so it gets
 * Next's own action-redirect header and the browser navigates. Other calls just get 401.
 */
function signInAgain(request: NextRequest, returnTo: string): NextResponse {
  const login = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;

  if (request.headers.has("next-action")) {
    return new NextResponse(null, { status: 200, headers: { "x-action-redirect": `${login};replace` } });
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  return NextResponse.redirect(new URL(login, request.url));
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
