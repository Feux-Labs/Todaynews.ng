import { SessionProvider } from "@/components/admin/SessionProvider";
import AdminLayoutGuard from "@/components/admin/AdminLayoutGuard";
import { ThemeProvider } from "@/components/ThemeProvider";

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
    <ThemeProvider>
      <SessionProvider>
        <AdminLayoutGuard>{children}</AdminLayoutGuard>
      </SessionProvider>
    </ThemeProvider>
  );
}
