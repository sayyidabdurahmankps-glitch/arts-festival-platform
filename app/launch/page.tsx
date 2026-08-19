"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Sparkles, Zap, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function ResponsiveLaunchPage() {
  const [mounted, setMounted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLaunch = () => {
    setIsLaunching(true);
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-hidden relative flex flex-col items-center justify-center selection:bg-indigo-500/30">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] md:bg-[size:64px_64px] pointer-events-none" />

      <motion.div
        animate={{
          scale: isLaunching ? 20 : 1,
          opacity: isLaunching ? 0 : 1,
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[600px] lg:w-[800px] h-[300px] md:h-[600px] lg:h-[800px] bg-indigo-600/20 blur-[100px] md:blur-[150px] rounded-full pointer-events-none"
      />

      <main className="relative z-10 flex flex-col items-center justify-center w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 py-10 md:py-20 text-center">
        <AnimatePresence>
          {!isLaunching ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50, scale: 0.9, filter: "blur(10px)" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col items-center w-full"
            >
              <div className="flex items-center gap-2 px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-6 md:mb-10 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <ShieldCheck className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em]">
                  Systems Nominal
                </span>
              </div>

              <div className="w-full flex flex-col items-center justify-center mb-6 md:mb-10">
                <h2 className="text-xs sm:text-sm md:text-xl lg:text-2xl font-mono text-zinc-500 uppercase tracking-[0.5em] md:tracking-[0.8em] mb-2 md:mb-4">
                  Welcome To
                </h2>
                {/* ⚡ CLAMP FIX: Dynamically resizes the text to the width of the screen */}
                <h1
                  className="font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600 drop-shadow-2xl uppercase leading-[0.85] py-2"
                  style={{ fontSize: "clamp(4rem, 14vw, 15rem)" }}
                >
                  Essenza
                </h1>
              </div>

              <p className="text-sm sm:text-base md:text-xl lg:text-3xl text-zinc-400 max-w-[90%] md:max-w-3xl lg:max-w-5xl leading-relaxed font-medium mb-12 md:mb-16">
                The ultimate academic fest operating system is ready for
                deployment. Prepare for synergy, artistry, and legacy.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 w-full max-w-sm sm:max-w-none">
                <button
                  onClick={handleLaunch}
                  className="group relative w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 md:px-14 md:py-7 bg-white text-black rounded-2xl md:rounded-full font-black uppercase tracking-widest text-sm md:text-lg hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <Rocket className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-y-1 transition-transform duration-300" />
                  Initiate Launch
                </button>

                <Link
                  href="/"
                  className="group w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 md:px-14 md:py-7 bg-white/5 border border-white/10 text-white rounded-2xl md:rounded-full font-black uppercase tracking-widest text-sm md:text-lg hover:bg-white/10 active:scale-95 transition-all backdrop-blur-md"
                >
                  <Zap className="w-5 h-5 md:w-6 md:h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                  Skip to Feed
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-[50vh]"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 md:w-40 md:h-40 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <Sparkles className="absolute w-8 h-8 md:w-12 md:h-12 text-white animate-pulse" />
              </div>
              <motion.p
                initial={{ opacity: 0, mt: 10 }}
                animate={{ opacity: 1, mt: 32 }}
                className="text-lg md:text-2xl lg:text-4xl font-black uppercase tracking-[0.5em] text-white"
              >
                Entering Essenza
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <div className="absolute bottom-6 md:bottom-10 left-0 right-0 flex justify-center pointer-events-none opacity-50 px-4 text-center">
        <p className="text-[8px] md:text-[10px] lg:text-sm font-mono tracking-[0.4em] uppercase text-zinc-500 flex flex-wrap justify-center gap-2 md:gap-4">
          <span>Protected by FestOS</span>
          <span className="hidden sm:inline">•</span>
          <span>Encrypted Connection</span>
        </p>
      </div>
    </div>
  );
}
