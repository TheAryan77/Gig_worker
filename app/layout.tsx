import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalAppbar from "./components/ConditionalAppbar";
import ChatBot from "@/components/ChatBot";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TrustHire - Freelancing Platform",
  description: "Connect with verified freelancers and workers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConditionalAppbar/>
        {children}
        <ChatBot />
        {/* Footer */}
        <footer className="w-full py-4 text-center text-sm text-neutral-500 dark:text-neutral-400 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <p>© {new Date().getFullYear()} TrustHire. Built and managed by <span className="text-orange-500 font-medium">Aryan Mahendru</span> at <span className="text-orange-500 font-medium">Hack Adhyaay</span></p>
        </footer>
      </body>
    </html>
  );
}
