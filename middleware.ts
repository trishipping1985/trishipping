import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  if (host === "www.trishipping.info") {
    const url = request.nextUrl.clone();
    url.hostname = "trishipping.info";
    url.protocol = "https:";

    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};