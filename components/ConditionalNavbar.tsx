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
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close menu automatically on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

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
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled || isOpen
            ? "bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="text-2xl font-black text-white tracking-tighter flex items-center gap-2 relative z-50"
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
            <div className="md:hidden relative z-50">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-zinc-400 hover:text-white transition-colors p-2 -mr-2 bg-white/5 rounded-full border border-white/10"
              >
                {isOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Premium Mobile Navigation Overlay --- */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-40 bg-[#050505]/95 backdrop-blur-3xl md:hidden flex flex-col pt-24 px-6 pb-safe"
          >
            {/* Animated Links Container */}
            <div className="flex-1 flex flex-col gap-2 overflow-y-auto hide-scrollbar pb-10">
              {navLinks.map((link, i) => {
                const isActive = pathname === link.href;
                return (
                  <motion.div
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all border ${
                        isActive
                          ? "bg-indigo-500/10 border-indigo-500/20 text-white"
                          : "bg-white/5 border-transparent text-zinc-400 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-xl ${
                            isActive ? "bg-indigo-500/20" : "bg-black/50"
                          }`}
                        >
                          <link.icon
                            className={`w-5 h-5 ${
                              isActive ? "text-indigo-400" : "text-zinc-500"
                            }`}
                          />
                        </div>
                        <span className="text-lg font-black tracking-tight">
                          {link.name}
                        </span>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 ${
                          isActive ? "text-indigo-400" : "text-zinc-600"
                        }`}
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}