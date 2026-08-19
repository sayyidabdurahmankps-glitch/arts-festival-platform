"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Power, Activity } from "lucide-react";

export default function ModernLaunchPage() {
  const [mounted, setMounted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLaunch = async () => {
    setIsLaunching(true);

    // ⚡ REALTIME DATA BLOCK SYNC ANIMATION
    // Simulates chunky, irregular network fetching rather than a smooth counter
    const syncSteps = [
      { percentage: 12, delay: 300 },
      { percentage: 33, delay: 500 },
      { percentage: 48, delay: 200 },
      { percentage: 66, delay: 600 },
      { percentage: 84, delay: 300 },
      { percentage: 99, delay: 400 },
      { percentage: 100, delay: 700 },
    ];

    for (const step of syncSteps) {
      await new Promise((resolve) => setTimeout(resolve, step.delay));
      setProgress(step.percentage);
    }

    // ⚡ REDIRECT DELAY: Wait slightly after hitting 100%
    setTimeout(() => {
      window.location.href = "/";
    }, 400);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#000000] text-white overflow-hidden relative flex flex-col items-center justify-center selection:bg-indigo-500/30 font-sans">
      
      {/* --- MINIMALIST AMBIENCE --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-50" />
      
      {/* --- THE GLOWING PORTAL RING --- */}
      <motion.div
        animate={isLaunching ? { scale: 30, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
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
                <span className="font-mono text-sm md:text-base uppercase tracking-[0.4em]">Core Systems Online</span>
              </div>

              {/* STARK TYPOGRAPHY */}
              <h1 
                className="font-black tracking-tighter text-white uppercase leading-[0.8] mb-6"
                style={{ fontSize: "clamp(4rem, 15vw, 15rem)" }}
              >
                Essenza
              </h1>
              
              <p className="text-zinc-400 font-mono text-sm md:text-lg lg:text-2xl uppercase tracking-[0.3em] md:tracking-[0.5em] mb-16 md:mb-24 max-w-2xl">
                The Fest Operating System
              </p>

              {/* ⚡ GIGANTIC SINGLE ACTION BUTTON */}
              <div className="flex flex-col items-center justify-center w-full max-w-[380px] sm:max-w-3xl lg:max-w-4xl mx-auto">
                <button
                  onClick={handleLaunch}
                  // Increased padding, text size, gaps, and border radius
                  className="group relative w-full flex items-center justify-center gap-6 md:gap-10 px-12 md:px-32 py-10 md:py-16 bg-white text-black rounded-[5rem] font-black uppercase tracking-[0.3em] text-2xl md:text-5xl hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_80px_rgba(255,255,255,0.2)] hover:shadow-[0_0_120px_rgba(255,255,255,0.6)] overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <Power className="w-10 h-10 md:w-16 md:h-16 group-hover:text-indigo-600 transition-colors" />
                  <span className="pt-1 md:pt-2">Initialize</span>
                </button>
              </div>
            </motion.div>
          ) : (
            /* --- BOOT SEQUENCE STATE WITH PERCENTAGE --- */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[50vh]"
            >
              <div className="relative flex items-center justify-center mb-10 md:mb-16">
                {/* Massive Animated Ring */}
                <div className="absolute w-32 h-32 md:w-56 md:h-56 border-[2px] border-white/10 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_50px_rgba(99,102,241,0.2)]" />
                
                {/* ⚡ THE PERCENTAGE COUNTER */}
                <motion.div 
                  className="font-black text-5xl md:text-7xl lg:text-[7rem] tracking-tighter text-white tabular-nums drop-shadow-2xl"
                  animate={{ color: progress === 100 ? "#4ade80" : "#ffffff" }}
                >
                  {progress}%
                </motion.div>
              </div>

              <motion.p 
                initial={{ opacity: 0, marginTop: 10 }}
                animate={{ opacity: 1, marginTop: 0 }}
                className="font-mono text-sm md:text-xl text-indigo-400 uppercase tracking-[0.5em] animate-pulse"
              >
                {progress < 100 ? "Syncing Data Blocks..." : "System Online"}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}