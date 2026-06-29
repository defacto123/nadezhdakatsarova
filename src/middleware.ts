import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

const ADMIN_HOST = process.env.ADMIN_HOST;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const host = req.headers.get("host");

  // Canonical host: permanently redirect www.* to the bare apex domain.
  if (host?.startsWith("www.")) {
    const url = req.nextUrl.clone();
    url.host = host.slice(4);
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  // Optionally serve the admin CMS on a dedicated host (e.g. admin.example.com).
  if (ADMIN_HOST && host === ADMIN_HOST && !pathname.startsWith("/admin")) {
    const url = req.nextUrl.clone();
    url.pathname = `/admin${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
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
