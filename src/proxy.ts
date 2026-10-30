import { NextRequest, NextResponse } from "next/server";

import { environment } from "@/configs/environment";

const PUBLIC_ROUTES = ["/", "/sign-in"];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(environment.TOKEN_KEY!)?.value;

  const hasToken = !!token;

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);

  if (!hasToken && !isPublicRoute) {
    const loginUrl = new URL("/sign-in", request.url);

    loginUrl.searchParams.set(
      "callback",
      `${pathname}${search}`
    );

    return NextResponse.redirect(loginUrl);
  }

  if (hasToken && pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};