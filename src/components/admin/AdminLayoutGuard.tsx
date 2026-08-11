"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminSidebar from "@/components/admin/Sidebar";
import { Loader2 } from "lucide-react";

export default function AdminLayoutGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();

  const isLoginPage = pathname === "/ng-admin/login";

  useEffect(() => {
    if (!isLoginPage && status === "unauthenticated") {
      router.replace(`/ng-admin/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoginPage, status, pathname, router]);

  // Login page gets a clean standalone dark layout (no sidebar)
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-[#060b18] text-slate-200 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    );
  }

  // Loading session state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#060b18] text-slate-200 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-[#00e676]" />
          <span>Verifying Admin Authorization...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated fallback while redirecting
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#060b18] text-slate-200 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#00e676] mx-auto" />
          <p className="text-sm text-slate-400">Redirecting to Admin Login Portal...</p>
        </div>
      </div>
    );
  }

  // Authenticated admin view
  return (
    <div className="min-h-screen bg-[#060b18] text-slate-200">
      <AdminSidebar />
      <main className="ml-[260px] min-h-screen p-6 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
