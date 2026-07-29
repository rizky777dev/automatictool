import type { Metadata } from "next";
import { JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { FlowProvider } from "@/components/FlowProvider";

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ZIP → GitHub Pusher | by Rizky",
  description:
    "Upload ZIP, ekstrak dengan aman di memori, dan push otomatis seluruh source code ke GitHub Repository dalam satu commit — tanpa drag-file satu per satu.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`dark ${mono.variable} ${sans.variable}`} suppressHydrationWarning>
      <body
        className="min-h-screen bg-ink font-sans text-slate-100 antialiased"
        suppressHydrationWarning
      >
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-grid" />
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-gradient-glow" />
        <FlowProvider>{children}</FlowProvider>
      </body>
    </html>
  );
}
