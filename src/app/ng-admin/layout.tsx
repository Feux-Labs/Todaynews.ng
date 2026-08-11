import { SessionProvider } from "@/components/admin/SessionProvider";
import AdminLayoutGuard from "@/components/admin/AdminLayoutGuard";

export const metadata = {
  title: "Admin Portal | Todaynews.ng",
  robots: "noindex, nofollow",
};

export default function NgAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AdminLayoutGuard>{children}</AdminLayoutGuard>
    </SessionProvider>
  );
}
