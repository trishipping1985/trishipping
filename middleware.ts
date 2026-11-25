import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";

  // Preserve the existing canonical domain redirect.
  if (host === "www.trishipping.info") {
    const url = request.nextUrl.clone();
    url.hostname = "trishipping.info";
    url.protocol = "https:";

    return NextResponse.redirect(url, 308);
  }

  // Redirect mobile homepage visitors only.
  if (
    request.nextUrl.pathname === "/" &&
    (request.method === "GET" || request.method === "HEAD")
  ) {
    const userAgent =
      request.headers.get("user-agent") || "";

    const isMobile =
      /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

    if (isMobile) {
      const url = request.nextUrl.clone();

      url.pathname = "/mobile";

      const response = NextResponse.redirect(url, 307);

      response.headers.set(
        "Cache-Control",
        "private, no-store"
      );

      response.headers.set("Vary", "User-Agent");

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};