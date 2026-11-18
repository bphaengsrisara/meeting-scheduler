import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import { TimeZoneCookie } from "@/lib/time-zone-cookie";
import "./globals.css";

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
      </body>
    </html>
  );
}
