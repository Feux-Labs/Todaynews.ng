import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/ng-admin/login",
    },
    callbacks: {
      // The login page itself must stay reachable without a session, or
      // matching it below would redirect-loop against itself.
      authorized: ({ token, req }) =>
        req.nextUrl.pathname === "/ng-admin/login" || !!token,
    },
  }
);

export const config = {
  // Previously an enumerated list of /ng-admin/* page paths that had drifted
  // out of sync with actual pages (missing /ng-admin/comments and
  // /ng-admin/sponsored-ads — unprotected by middleware, relying only on a
  // client-side redirect) and never covered /api/admin/* at all — every
  // admin API route, including destructive ones, was callable by anyone who
  // knew the URL, no session required. This covers both prefixes entirely.
  matcher: ["/ng-admin/:path*", "/api/admin/:path*"],
};
