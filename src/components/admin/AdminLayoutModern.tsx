"use client";

import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { themeConfig } from "@/lib/theme";

interface AdminLayoutModernProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

/**
 * Lightweight page-header wrapper for /ng-admin pages. The sidebar and mobile
 * drawer are already provided globally by AdminLayoutGuard — this component
 * only adds an optional sticky title/subtitle bar above the page content.
 */
export default function AdminLayoutModern({
  children,
  title,
  subtitle,
}: AdminLayoutModernProps) {
  const { theme } = useTheme();
  const colors = themeConfig[theme];

  return (
    <div>
      {title && (
        <div className={`-mx-4 sm:-mx-6 -mt-4 sm:-mt-6 mb-6 px-4 sm:px-6 py-4 border-b ${colors.border} ${colors.bgSecondary}`}>
          <h2 className={`text-lg font-semibold ${colors.text}`}>{title}</h2>
          {subtitle && <p className={`text-sm ${colors.textSecondary}`}>{subtitle}</p>}
        </div>
      )}
      <div className={colors.text}>{children}</div>
    </div>
  );
}
