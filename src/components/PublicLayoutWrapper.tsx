"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PushPromptModal from "@/components/PushPromptModal";
import AdSlot from "@/components/AdSlot";

export default function PublicLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/ng-admin") || pathname?.startsWith("/admin");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Masthead Header navigation */}
      <Header />

      {/* Global Top Banner Adsterra Insertion */}
      <div className="max-w-6xl mx-auto w-full px-4 pt-4 shrink-0">
        <AdSlot id="top-banner-adsterra" type="banner-top" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>

      {/* Breaking news web push notification prompt */}
      <PushPromptModal />

      {/* Global Script hooks for Adsterra Social Bar and Popunders */}
      <AdSlot id="adsterra-social-bar" type="social-bar" />
      <AdSlot id="adsterra-popunder" type="popunder" />

      {/* Bottom index directory footer */}
      <Footer />
    </>
  );
}
