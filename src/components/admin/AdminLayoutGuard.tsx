"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminSidebar from "@/components/admin/AdminSidebarModern";
import AgentPanel from "@/components/admin/AgentPanel";
import { Loader2, Menu } from "lucide-react";

export default function AdminLayoutGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === "/ng-admin/login";

  useEffect(() => {
    if (!isLoginPage && status === "unauthenticated") {
      router.replace(`/ng-admin/login?callbackUrl=${encodeURIComponent(pathname)}`);
    }
  }, [isLoginPage, status, pathname, router]);

  // Login page gets a clean standalone dark layout (no sidebar)
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md">{children}</div>
      </div>
    );
  }

  // Loading session state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-[#2563eb]" />
          <span>Verifying Admin Authorization...</span>
        </div>
      </div>
    );
  }

  // Unauthenticated fallback while redirecting
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#2563eb] mx-auto" />
          <p className="text-sm text-slate-400">Redirecting to Admin Login Portal...</p>
        </div>
      </div>
    );
  }

  // Authenticated admin view with global AgentPanel
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile top bar — hamburger only; each page renders its own heading */}
        <div className="lg:hidden sticky top-0 z-20 h-14 flex items-center px-4 bg-white/90 backdrop-blur-sm border-b border-slate-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 text-slate-700"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="ml-2 font-bold text-slate-900">Todaynews.ng Admin</span>
        </div>
        <main className="flex-1 p-4 sm:p-6 transition-all duration-300">{children}</main>
      </div>
      <AgentPanel />
    </div>
  );
}
