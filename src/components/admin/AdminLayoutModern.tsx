"use client";

import React, { useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { themeConfig } from "@/lib/theme";
import AdminSidebarModern from "@/components/admin/AdminSidebarModern";
import { Menu } from "lucide-react";

interface AdminLayoutModernProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AdminLayoutModern({
  children,
  title,
  subtitle,
}: AdminLayoutModernProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();
  const colors = themeConfig[theme];

  return (
    <div className={`min-h-screen ${colors.bg}`}>
      <AdminSidebarModern
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <div
          className={`sticky top-0 z-20 ${colors.bgSecondary} border-b ${colors.border} backdrop-blur-sm`}
        >
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={`lg:hidden p-2 rounded-lg ${colors.hover}`}
              >
                <Menu className="w-5 h-5" />
              </button>
              {title && (
                <div>
                  <h2 className={`text-lg font-semibold ${colors.text}`}>
                    {title}
                  </h2>
                  {subtitle && (
                    <p className={`text-sm ${colors.textSecondary}`}>
                      {subtitle}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className={`p-6 ${colors.text}`}>
          <div className="mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
