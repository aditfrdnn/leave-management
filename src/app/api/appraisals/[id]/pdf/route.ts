import axios from "axios";
import { NextResponse } from "next/server";

import { environment } from "@/configs/environment";
import { appraisalPdfBackend } from "@/constants/endpoint-constant";
import { getTokenCookie } from "@/lib/cookies";

/**
 * Streams an appraisal PDF from the leave API. The token stays in the httpOnly cookie and is
 * forwarded as Bearer here, so a plain `<a href="/api/appraisals/12/pdf">` downloads the file.
 * The API decides access (owner, assessor or `appraisal.view_all`).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getTokenCookie();
  const backendUrl = environment.DEV_URL || environment.PROD_URL;

  if (!token || !backendUrl || !/^\d+$/.test(id)) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await axios.get<ArrayBuffer>(`${backendUrl}${appraisalPdfBackend(id)}`, {
      headers: { Accept: "application/pdf", Authorization: `Bearer ${token}` },
      responseType: "arraybuffer",
      timeout: 60 * 1000,
    });

    return new NextResponse(response.data, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": response.headers["content-disposition"] ?? `inline; filename="appraisal-${id}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const status = axios.isAxiosError(error) ? (error.response?.status ?? 502) : 502;

    return NextResponse.json({ success: false, message: "PDF tidak dapat dibuat." }, { status });
  }
}
