"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Trophy,
  Calendar,
  Search,
  Sparkles,
  Image as ImageIcon,
  Activity,
} from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Detect scroll to add background opacity
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/", icon: Sparkles },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Search", href: "/search", icon: Search },
    { name: "Results", href: "/results", icon: Activity },
    { name: "Gallery", href: "/gallery", icon: ImageIcon },
  ];

  // Hide on admin, judge, and media routes
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/judge") ||
    pathname.startsWith("/media")
  ) {
    return null;
  }

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0a0a]/80 backdrop-blur-md border-b border-zinc-800"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-black text-white tracking-tighter flex items-center gap-2"
          >
            Fest<span className="text-indigo-500">OS</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`font-semibold transition-all hover:text-indigo-400 ${
                    isActive ? "text-indigo-500" : "text-zinc-400"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
            <Link
              href="/live"
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-sm font-bold tracking-widest uppercase"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Live Feed
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-400 hover:text-white transition-colors p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-b border-zinc-800 absolute w-full left-0 top-20 shadow-2xl">
          <div className="px-6 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 p-4 text-lg font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-2xl transition-all"
              >
                <link.icon className="w-5 h-5 text-indigo-500" /> {link.name}
              </Link>
            ))}
            <div className="pt-4 pb-2">
              <Link
                href="/live"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full p-4 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest text-sm"
              >
                Enter Live Feed
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
