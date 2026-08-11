"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  MessageSquare,
  Inbox,
  FileEdit,
  Globe,
  Users,
  LogOut,
  Newspaper,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/ng-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ng-admin/chat", label: "Chat with AI", icon: MessageSquare, badge: true },
  { href: "/ng-admin/inbox", label: "Inbox", icon: Inbox, badge: true },
  { href: "/ng-admin/drafts", label: "Drafts", icon: FileEdit },
  { href: "/ng-admin/published", label: "Published", icon: Globe },
  { href: "/ng-admin/users", label: "Admin Users", icon: Users },
  { href: "/ng-admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#0a0f1c] border-r border-white/5 flex flex-col z-50 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[260px]"
      }`}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <Newspaper className="w-7 h-7 text-[#00e676] flex-shrink-0" />
        {!collapsed && (
          <span className="ml-3 text-lg font-bold text-white tracking-tight">
            Todaynews<span className="text-[#00e676]">.ng</span>
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-slate-400 hover:text-white transition p-1"
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#00e676]/10 text-[#00e676] shadow-sm shadow-[#00e676]/5"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#00e676]" : ""}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => signOut({ callbackUrl: "/ng-admin/login" })}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all ${
            collapsed ? "justify-center" : ""
          }`}
          title="Sign Out"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
