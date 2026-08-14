"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { themeConfig } from "@/lib/theme";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const colors = themeConfig[theme];

  const navItems = [
    { label: "Dashboard", href: "/ng-admin/dashboard", icon: LayoutDashboard },
    { label: "AI Chat", href: "/ng-admin/chat", icon: MessageSquare },
    { label: "Inbox", href: "/ng-admin/inbox", icon: FileText },
    { label: "Drafts", href: "/ng-admin/drafts", icon: FileText },
    { label: "Editor", href: "/ng-admin/editor", icon: FileText },
    { label: "Published", href: "/ng-admin/published", icon: FileText },
    { label: "Users", href: "/ng-admin/users", icon: Users },
    { label: "Sponsored Ads", href: "/ng-admin/sponsored-ads", icon: Settings },
    { label: "Settings", href: "/ng-admin/settings", icon: Settings },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 ${colors.bgSecondary} border-r ${colors.border} z-40 transition-transform duration-300 flex flex-col overflow-y-auto lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div
          className={`sticky top-0 p-6 border-b ${colors.border} flex items-center justify-between`}
        >
          <h1 className={`text-xl font-bold ${colors.text}`}>Todaynews.ng</h1>
          <button
            onClick={onClose}
            className={`lg:hidden p-1 rounded-lg ${colors.hover}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : `${colors.text} ${colors.hover}`
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className={`border-t ${colors.border} p-4 space-y-2`}>
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${colors.text} ${colors.hover}`}
          >
            {theme === "light" ? (
              <>
                <Moon className="w-5 h-5" />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5" />
                <span>Light Mode</span>
              </>
            )}
          </button>
          <button
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-950`}
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div
        className={`fixed top-4 left-4 lg:hidden z-50 ${
          isOpen ? "hidden" : "block"
        }`}
      >
        <button
          onClick={() => !isOpen && onClose?.()}
          className={`p-2 rounded-lg ${colors.card}`}
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </>
  );
}
