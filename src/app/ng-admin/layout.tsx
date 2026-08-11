import AdminSidebar from "@/components/admin/Sidebar";
import { SessionProvider } from "@/components/admin/SessionProvider";

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
      <div className="min-h-screen bg-[#060b18] text-slate-200">
        <AdminSidebar />
        <main className="ml-[260px] min-h-screen transition-all duration-300">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
