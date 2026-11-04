import axios from "axios";
import { NextResponse, type NextRequest } from "next/server";

import { environment } from "@/configs/environment";
import { iamConfig } from "@/configs/iam.server";
import { getTokenCookie } from "@/lib/cookies";

/**
 * Pusher-protocol channel auth for live updates. The browser holds no IAM token, so this asks
 * the leave API with the user's and passes the signature on. Same-origin only.
 */
export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== iamConfig().HRLITE_URL) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const token = await getTokenCookie();

  if (!token) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const form = await request.formData();

  try {
    const { data } = await axios.post(
      `${environment.DEV_URL || environment.PROD_URL}/api/broadcasting/auth`,
      { socket_id: String(form.get("socket_id") ?? ""), channel_name: String(form.get("channel_name") ?? "") },
      { headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, timeout: 10 * 1000 },
    );

    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = axios.isAxiosError(error) ? (error.response?.status ?? 502) : 502;

    return NextResponse.json({ error: "denied" }, { status });
  }
}
