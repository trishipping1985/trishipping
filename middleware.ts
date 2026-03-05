import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const { pathname } = url

  // Match /track/<code>
  if (pathname.startsWith("/track/")) {
    const parts = pathname.split("/").filter(Boolean) // ["track","TRI-001"]
    const code = parts[1]

    if (code) {
      const newUrl = url.clone()
      newUrl.pathname = "/track"
      newUrl.searchParams.set("code", code)
      return NextResponse.redirect(newUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/track/:path*"],
}
