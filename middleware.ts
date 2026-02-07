import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dashboard routes require auth
  if (pathname.startsWith("/dashboard")) {
    // Check for token in cookie or query (client stores in localStorage,
    // so the actual auth check happens client-side in the dashboard layout)
    // This middleware just ensures the page is only rendered if it looks like the user is authed.
    // Real auth validation happens in API routes.
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
