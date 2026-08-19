"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Power, Activity } from "lucide-react";

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
              <div className="flex items-center gap-3 text-zinc-500 mb-8 md:mb-12">
                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span className="font-mono text-sm md:text-base uppercase tracking-[0.4em]">
                  Core Systems Online
                </span>
              </div>

              {/* STARK TYPOGRAPHY */}
              <h1
                className="font-black tracking-tighter text-white uppercase leading-[0.8] mb-6"
                style={{ fontSize: "clamp(4rem, 15vw, 15rem)" }}
              >
                Essenza
              </h1>

              <p className="text-zinc-400 font-mono text-sm md:text-lg lg:text-xl uppercase tracking-[0.3em] md:tracking-[0.5em] mb-16 md:mb-24 max-w-2xl">
                The Fest Operating System
              </p>

              {/* MASSIVE SINGLE ACTION BUTTON */}
              <div className="flex flex-col items-center justify-center w-full max-w-[280px] sm:max-w-md mx-auto">
                <button
                  onClick={handleLaunch}
                  className="group relative w-full flex items-center justify-center gap-4 md:gap-6 px-10 md:px-16 py-6 md:py-8 bg-white text-black rounded-[3rem] font-black uppercase tracking-[0.3em] text-base md:text-2xl hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:shadow-[0_0_80px_rgba(255,255,255,0.4)] overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <Power className="w-6 h-6 md:w-10 md:h-10 group-hover:text-indigo-600 transition-colors" />
                  Initialize
                </button>
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
                <div className="w-20 h-20 md:w-32 md:h-32 border-[2px] border-white/20 border-t-white rounded-full animate-spin" />
              </div>
              <motion.p
                initial={{ opacity: 0, marginTop: 10 }}
                animate={{ opacity: 1, marginTop: 0 }}
                className="font-mono text-sm md:text-lg text-zinc-400 uppercase tracking-[0.5em]"
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
