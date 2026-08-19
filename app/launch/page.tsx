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

  const handleLaunch = () => {
    setIsLaunching(true);

    // ⚡ PROGRESS COUNTER ANIMATION
    const duration = 2000; // 2 seconds to reach 100%
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const percentage = Math.min(Math.floor((elapsed / duration) * 100), 100);
      setProgress(percentage);

      if (percentage >= 100) {
        clearInterval(interval);
      }
    }, 20); // Updates every 20ms for buttery smooth rapid counting

    // ⚡ REDIRECT DELAY: Wait for 100% + 500ms dramatic pause
    setTimeout(() => {
      window.location.href = "/";
    }, 2500);
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
              <div className="flex flex-col items-center justify-center w-full max-w-[320px] sm:max-w-2xl mx-auto">
                <button
                  onClick={handleLaunch}
                  className="group relative w-full flex items-center justify-center gap-5 md:gap-8 px-12 md:px-24 py-8 md:py-12 bg-white text-black rounded-[4rem] font-black uppercase tracking-[0.3em] text-xl md:text-4xl hover:scale-[1.02] active:scale-95 transition-all duration-300 shadow-[0_0_60px_rgba(255,255,255,0.15)] hover:shadow-[0_0_100px_rgba(255,255,255,0.5)] overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                  <Power className="w-8 h-8 md:w-12 md:h-12 group-hover:text-indigo-600 transition-colors" />
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
                {progress < 100 ? "Authenticating Core..." : "System Online"}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}