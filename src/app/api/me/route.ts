import axios from "axios";
import { NextResponse } from "next/server";

import { environment } from "@/configs/environment";
import { meBackend } from "@/constants/endpoint-constant";
import { getTokenCookie } from "@/lib/cookies";

/**
 * Identity bootstrap for `AuthProvider`: reads the httpOnly token cookie on the server and
 * forwards it as a Bearer token to the leave API's `GET /api/me`, so the token never reaches
 * the browser. Any failure answers 401 and the client signs out.
 */
export async function GET() {
  const token = await getTokenCookie();
  const backendUrl = environment.DEV_URL || environment.PROD_URL;

  if (!token || !backendUrl) {
    return NextResponse.json(null, { status: 401 });
  }

  try {
    const { data } = await axios.get(`${backendUrl}${meBackend}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      timeout: 15 * 1000,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return NextResponse.json(null, { status: error.response?.status ?? 401 });
    }

    console.error("Error fetching current user:", error);
    return NextResponse.json(null, { status: 401 });
  }
}
