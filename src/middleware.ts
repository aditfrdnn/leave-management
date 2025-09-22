import { NextResponse, NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-user")?.value;
  const { pathname, search } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isMainPage = pathname === "/";

  // Jika user sudah login dan buka / atau /login → redirect ke /leave-request
  if (token && (isAuthPage || isMainPage)) {
    return NextResponse.redirect(new URL("/leave-request", req.url));
  }

  // Protected routes
  const isProtectedRoute = isMainPage || pathname.startsWith("/leave-request");

  if (!token && isProtectedRoute) {
    // Simpan callback-url sebagai cookie di RESPONSE (bukan via next/headers.cookies())
    const callbackPath = `${pathname}${search ?? ""}`;

    const res = NextResponse.redirect(
      new URL(
        `/login${
          callbackPath ? `?callback=${encodeURIComponent(callbackPath)}` : ""
        }`,
        req.url
      )
    );

    // Optional: kalau memang perlu simpan di cookie juga
    // (Gunakan response.cookies)
    if (pathname !== "/" && pathname !== "/leave-request") {
      res.cookies.set("callback-url", callbackPath, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        // secure: true, // aktifkan di produksi (HTTPS)
        maxAge: 60 * 10, // 10 menit
      });
    }

    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Pastikan semua rute yang ingin dicegat masuk ke matcher
  matcher: ["/", "/login", "/leave-request"],
};
