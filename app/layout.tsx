import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/ConditionalNavbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Essenza | Academic Fest Operating System",
  description: "The official result management, live leaderboard, and event platform for Essenza.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white text-slate-900`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}