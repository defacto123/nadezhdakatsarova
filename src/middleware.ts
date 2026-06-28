import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const ADMIN_HOST = process.env.ADMIN_HOST;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Optionally serve the admin CMS on a dedicated host (e.g. admin.example.com).
  if (ADMIN_HOST) {
    const host = req.headers.get("host");
    if (host === ADMIN_HOST && !pathname.startsWith("/admin")) {
      const url = req.nextUrl.clone();
      url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Admin and API routes are not localized.
  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
}

export const config = {
  // Skip Next internals, static files, and asset routes.
  matcher: ["/((?!_next|.*\\..*).*)"],
};
