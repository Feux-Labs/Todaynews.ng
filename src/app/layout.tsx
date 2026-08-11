import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import PublicLayoutWrapper from "@/components/PublicLayoutWrapper";
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
  title: "Todaynews.ng — Trending Nigerian News, Security Alerts & Naira Rates",
  description:
    "Todaynews.ng is a Nigerian AI-powered news channel focusing on reducing misinformation and news censorship using complex algorithms to locate critical security news to keep Nigerians safe.",
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
        <PublicLayoutWrapper>{children}</PublicLayoutWrapper>
      </body>
    </html>
  );
}
