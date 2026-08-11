import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/ng-admin/login",
  },
});

export const config = {
  matcher: [
    "/ng-admin",
    "/ng-admin/dashboard",
    "/ng-admin/dashboard/:path*",
    "/ng-admin/chat",
    "/ng-admin/chat/:path*",
    "/ng-admin/inbox",
    "/ng-admin/inbox/:path*",
    "/ng-admin/drafts",
    "/ng-admin/drafts/:path*",
    "/ng-admin/published",
    "/ng-admin/published/:path*",
    "/ng-admin/users",
    "/ng-admin/users/:path*",
    "/ng-admin/settings",
    "/ng-admin/settings/:path*",
  ],
};
