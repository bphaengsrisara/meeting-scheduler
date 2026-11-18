import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TimeZoneCookie } from "@/lib/time-zone-cookie";
import "./globals.css";

// Every toast sits top center, just under the app header (h-14, 56px), with
// Sonner's own 16px gap below it.
const TOAST_OFFSET = { top: 72 };

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vellicor",
  description: "Candidate Meeting Scheduler",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${publicSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TimeZoneCookie />
        {children}
        <Toaster
          position="top-center"
          offset={TOAST_OFFSET}
          mobileOffset={TOAST_OFFSET}
        />
      </body>
    </html>
  );
}
