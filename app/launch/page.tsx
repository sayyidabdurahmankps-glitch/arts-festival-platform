"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Power, Fingerprint, Activity } from "lucide-react";
import Link from "next/link";

export default function ModernLaunchPage() {
  const [mounted, setMounted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLaunch = () => {
    setIsLaunching(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 1800);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#000000] text-white overflow-hidden relative flex flex-col items-center justify-center selection:bg-indigo-500/30 font-sans">
      {/* --- MINIMALIST AMBIENCE --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />

      {/* --- THE GLOWING PORTAL RING --- */}
      <motion.div
        animate={
          isLaunching ? { scale: 30, opacity: 0 } : { scale: 1, opacity: 1 }
        }
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
      >
        <div className="w-[300px] md:w-[500px] lg:w-[650px] h-[300px] md:h-[500px] lg:h-[650px] border-[1px] border-indigo-500/10 rounded-full animate-[spin_20s_linear_infinite]" />
        <div className="absolute w-[350px] md:w-[600px] lg:w-[800px] h-[350px] md:h-[600px] lg:h-[800px] border-[1px] border-dashed border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
        <div className="absolute w-[200px] md:w-[400px] lg:w-[500px] h-[200px] md:h-[400px] lg:h-[500px] bg-indigo-500/10 blur-[80px] md:blur-[120px] rounded-full" />
      </motion.div>

      <main className="relative z-10 flex flex-col items-center justify-center w-full px-6 text-center">
        <AnimatePresence>
          {!isLaunching ? (
            <motion.div
              initial={{ opacity: 0, filter: "blur(10px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              transition={{ duration: 0.8 }}
              className="flex flex-col items-center w-full"
            >
              {/* STATUS INDICATOR */}
              <div className="flex items-center gap-3 text-zinc-500 mb-10 md:mb-16">
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className="font-mono text-xs md:text-sm uppercase tracking-[0.4em]">
                  Core Systems Online
                </span>
              </div>

              {/* STARK TYPOGRAPHY */}
              <h1
                className="font-black tracking-tighter text-white uppercase leading-[0.8] mb-6"
                style={{ fontSize: "clamp(3.5rem, 12vw, 12rem)" }}
              >
                Essenza
              </h1>

              <p className="text-zinc-400 font-mono text-xs md:text-sm lg:text-base uppercase tracking-[0.3em] md:tracking-[0.5em] mb-16 md:mb-24 max-w-2xl">
                The Fest Operating System
              </p>

              {/* SLEEK ACTION BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md sm:max-w-none justify-center">
                <button
                  onClick={handleLaunch}
                  className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-8 md:px-12 py-5 bg-white text-black rounded-full font-bold uppercase tracking-[0.2em] text-xs md:text-sm hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                >
                  <Power className="w-4 h-4 md:w-5 md:h-5 group-hover:text-indigo-600 transition-colors" />
                  Initialize
                </button>

                <Link
                  href="/"
                  className="group w-full sm:w-auto flex items-center justify-center gap-3 px-8 md:px-12 py-5 bg-transparent border border-white/10 text-zinc-400 rounded-full font-bold uppercase tracking-[0.2em] text-xs md:text-sm hover:bg-white/5 hover:text-white active:scale-95 transition-all backdrop-blur-md"
                >
                  <Fingerprint className="w-4 h-4 md:w-5 md:h-5" />
                  Guest Access
                </Link>
              </div>
            </motion.div>
          ) : (
            /* --- BOOT SEQUENCE STATE --- */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[40vh]"
            >
              <div className="relative flex items-center justify-center mb-8">
                <div className="w-16 h-16 md:w-24 md:h-24 border-[1px] border-white/20 border-t-white rounded-full animate-spin" />
              </div>
              <motion.p
                initial={{ opacity: 0, marginTop: 10 }}
                animate={{ opacity: 1, marginTop: 0 }}
                className="font-mono text-xs md:text-sm text-zinc-400 uppercase tracking-[0.5em]"
              >
                Authenticating Core...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
