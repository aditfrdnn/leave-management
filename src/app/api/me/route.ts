import { NextResponse } from "next/server";

import { getTokenCookie, getUserCookie } from "@/lib/cookies";

/**
 * Identity bootstrap for `AuthProvider`. The leave API has no `GET /api/me` yet, so the user
 * stored at login (httpOnly cookie) is returned as long as the token cookie is still there.
 * Once the API exposes `/api/me`, this handler forwards the token instead (see next-pdi).
 */
export async function GET() {
  const [token, user] = await Promise.all([getTokenCookie(), getUserCookie()]);

  if (!token || !user) {
    return NextResponse.json(null, { status: 401 });
  }

  return NextResponse.json({ success: true, data: user });
}
