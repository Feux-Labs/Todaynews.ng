import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/ng-admin/login",
  },
});

export const config = {
  matcher: [
    "/ng-admin/dashboard/:path*",
    "/ng-admin/chat/:path*",
    "/ng-admin/inbox/:path*",
    "/ng-admin/drafts/:path*",
    "/ng-admin/published/:path*",
    "/ng-admin/users/:path*",
  ],
};
