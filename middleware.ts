import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that do not require PIN authentication
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/workbox-")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isAuthed = token ? await verifyToken(token) : false;

  if (!isAuthed) {
    // If it's an API request, return 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, message: "Unauthorized. Please enter PIN." }, { status: 401 });
    }

    // Otherwise redirect to /login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files with extensions like .png, .jpg, .svg, etc.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
