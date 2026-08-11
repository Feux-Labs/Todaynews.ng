import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PushPromptModal from "@/components/PushPromptModal";
import AdSlot from "@/components/AdSlot";
import "@/app/globals.css";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Todaynews.ng — Trending Nigerian News, Politics, Naira Rates & Gist",
  description:
    "Breaking Nigerian news, politics, Naira exchange rates parallel market, BBNaija updates, sports, and investigative reports updated all day.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://todaynews.ng"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-paper text-ink font-body antialiased flex flex-col min-h-screen">
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

        {/* OneSignal-style breaking news web push notification prompt */}
        <PushPromptModal />

        {/* Global Script hooks for Adsterra Social Bar and Popunders */}
        <AdSlot id="adsterra-social-bar" type="social-bar" />
        <AdSlot id="adsterra-popunder" type="popunder" />

        {/* Bottom index directory footer */}
        <Footer />
      </body>
    </html>
  );
}
