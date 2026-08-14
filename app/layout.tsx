import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Navbar from "@/components/ConditionalNavbar";
import { supabase } from "@/lib/supabase"; // ⚡ Added Supabase import

const inter = Inter({ subsets: ["latin"] });

// ⚡ Replaced static metadata with dynamic Server Component function
export async function generateMetadata(): Promise<Metadata> {
  try {
    // Fetch the logo dynamically from Supabase before the page renders
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "logo_url")
      .maybeSingle();

    // Use the Supabase URL, or gracefully fallback to a default icon if empty
    const faviconUrl = data?.value || "/favicon.ico"; 

    return {
      title: "Essenza | Academic Fest Operating System",
      description: "The official result management, live leaderboard, and event platform for Essenza.",
      icons: {
        icon: faviconUrl,
        shortcut: faviconUrl,
        apple: faviconUrl,
      },
    };
  } catch (error) {
    // Bulletproof fallback just in case the database connection drops
    return {
      title: "Essenza | Academic Fest Operating System",
      description: "The official result management, live leaderboard, and event platform for Essenza.",
      icons: { icon: "/favicon.ico" },
    };
  }
}

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