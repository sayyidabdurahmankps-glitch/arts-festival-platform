"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Power,
  Rocket,
  ShieldCheck,
  Terminal,
  Activity,
  Server,
  Fingerprint,
  Check,
} from "lucide-react";

export default function LaunchPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const [bootStage, setBootStage] = useState(0);
  const [isBooting, setIsBooting] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGuestLaunch = async () => {
    if (isBooting || isLaunched) return;
    setIsBooting(true);

    await new Promise((res) => setTimeout(res, 1000));
    setBootStage(1);
    await new Promise((res) => setTimeout(res, 1500));
    setBootStage(2);
    await new Promise((res) => setTimeout(res, 1800));
    setBootStage(3);
    await new Promise((res) => setTimeout(res, 1200));
    setIsLaunched(true);

    await new Promise((res) => setTimeout(res, 2000));
    router.push("/");
  };

  const progressPercent =
    bootStage === 0 ? 0 : bootStage === 1 ? 33 : bootStage === 2 ? 66 : 100;

  if (!isMounted) {
    return <div className="h-screen w-screen bg-[#050505] overflow-hidden" />;
  }

  return (
    // ⚡ FULL SCREEN KIOSK LOCK
    <div className="flex flex-col h-screen w-screen bg-[#050505] text-zinc-400 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden relative items-center justify-center p-2 md:p-6">
      <style>{`nav, header, #navbar { display: none !important; }`}</style>

      {/* --- Deep Ambient Background --- */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505]/80 to-[#050505] z-0 pointer-events-none" />
      <div
        className={`fixed top-[-20%] left-[-10%] w-[60%] h-[60%] blur-[150px] pointer-events-none rounded-[4rem] transition-colors duration-1000 ${isBooting ? "bg-indigo-600/20" : "bg-indigo-600/10"}`}
      />
      <div
        className={`fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] blur-[150px] pointer-events-none rounded-[4rem] transition-colors duration-1000 ${isBooting ? "bg-purple-600/20" : "bg-purple-600/10"}`}
      />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_2px,transparent_2px),linear-gradient(to_bottom,#ffffff05_2px,transparent_2px)] bg-[size:6rem_6rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* --- Global Success Flash --- */}
      <AnimatePresence>
        {isLaunched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-indigo-500/20 z-50 pointer-events-none mix-blend-screen"
          />
        )}
      </AnimatePresence>

      {/* --- MAIN SMART BOARD CONSOLE --- */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-[96vw] h-[94vh] max-w-[1920px] bg-[#0a0a0a]/95 border border-white/5 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-3xl overflow-hidden flex flex-col"
      >
        {/* Top Terminal Bar (Super-Sized) */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-4">
            <div className="flex gap-2.5">
              <div className="w-4 h-4 rounded-md bg-red-500/20 border border-red-500/50" />
              <div className="w-4 h-4 rounded-md bg-yellow-500/20 border border-yellow-500/50" />
              <div className="w-4 h-4 rounded-md bg-emerald-500/20 border border-emerald-500/50" />
            </div>
            <div className="w-px h-6 bg-white/10 mx-3" />
            <Terminal className="w-6 h-6 text-zinc-500" />
            <span className="text-sm md:text-lg font-mono uppercase tracking-[0.2em] text-zinc-400 truncate">
              FestOS // Launch_Protocol
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm md:text-base font-black uppercase tracking-widest text-zinc-600 hidden sm:block">
              Status
            </span>
            <div
              className={`w-4 h-4 rounded-md ${isLaunched ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : isBooting ? "bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse" : "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] animate-pulse"} transition-colors duration-500`}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6 sm:p-12 md:p-16 text-center flex flex-col items-center relative overflow-hidden justify-center">
          <AnimatePresence mode="wait">
            {!isBooting ? (
              /* --- PRE-LAUNCH STATE --- */
              <motion.div
                key="pre-launch"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                className="flex flex-col items-center w-full"
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                  }}
                  className="mb-10 px-6 md:px-8 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm md:text-base font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-[0_0_30px_rgba(99,102,241,0.15)]"
                >
                  <Fingerprint className="w-5 h-5" />
                  Awaiting VIP Authorization
                </motion.div>

                <h1 className="text-7xl md:text-9xl lg:text-[10rem] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-600 mb-6">
                  Fest
                  <span className="text-indigo-500 drop-shadow-[0_0_25px_rgba(99,102,241,0.5)]">
                    OS
                  </span>
                </h1>
                <p className="text-sm md:text-xl lg:text-2xl font-black uppercase tracking-[0.6em] text-zinc-500 mb-20 md:mb-24">
                  Synergy • Artistry • Legacy
                </p>

                {/* ⚡ MASSIVE CENTER LAUNCH BUTTON */}
                <div className="relative w-72 h-72 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 20,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-[3rem] border-2 border-indigo-500/20"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 15,
                      ease: "linear",
                    }}
                    className="absolute inset-6 md:inset-8 rounded-[2.5rem] border-2 border-purple-500/30 border-dashed"
                  />
                  <button
                    onClick={handleGuestLaunch}
                    className="group relative z-10 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-indigo-600 rounded-[2.5rem] flex flex-col items-center justify-center shadow-[0_0_60px_rgba(79,70,229,0.5)] hover:shadow-[0_0_100px_rgba(79,70,229,0.8)] hover:bg-indigo-500 hover:scale-105 transition-all duration-500 active:scale-95 border-2 border-indigo-400/50 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Power className="w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 text-white mb-4 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500" />
                    <span className="text-white font-black uppercase tracking-widest text-sm md:text-lg lg:text-xl drop-shadow-md">
                      Initiate
                    </span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* --- BOOTING STATE --- */
              <motion.div
                key="boot-sequence"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center w-full max-w-4xl mx-auto"
              >
                <motion.div
                  animate={{
                    boxShadow: isLaunched
                      ? "0 0 100px rgba(16,185,129,0.4)"
                      : "0 0 50px rgba(99,102,241,0.2)",
                    borderColor: isLaunched
                      ? "rgba(16,185,129,0.5)"
                      : "rgba(99,102,241,0.5)",
                  }}
                  className="w-32 h-32 md:w-48 md:h-48 mb-12 md:mb-16 bg-[#050505] border-2 rounded-[2rem] flex items-center justify-center transition-all duration-1000 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent" />
                  {isLaunched ? (
                    <Rocket className="w-16 h-16 md:w-24 md:h-24 text-emerald-400 relative z-10" />
                  ) : (
                    <Activity className="w-16 h-16 md:w-24 md:h-24 text-indigo-400 animate-pulse relative z-10" />
                  )}
                </motion.div>

                {/* Boot Sequence Status Box (Oversized) */}
                <div className="w-full bg-[#050505] border border-white/5 rounded-[2.5rem] p-8 md:p-12 text-left shadow-inner relative overflow-hidden">
                  <div className="space-y-6 md:space-y-8 relative z-10">
                    <BootStep
                      active={bootStage >= 1}
                      icon={Server}
                      text="Initializing Core Mainframe"
                      code="0xSYS_BOOT"
                    />
                    <BootStep
                      active={bootStage >= 2}
                      icon={Activity}
                      text="Establishing Real-time Uplink"
                      code="0xWSS_SYNC"
                    />
                    <BootStep
                      active={bootStage >= 3}
                      icon={ShieldCheck}
                      text="Verifying Security Protocols"
                      code="0xAUTH_CHK"
                    />
                  </div>

                  {/* Dynamic Progress Bar */}
                  <div className="mt-10 md:mt-12 pt-8 md:pt-10 border-t border-white/10">
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-sm md:text-base font-mono text-zinc-500 uppercase tracking-widest">
                        Boot Progress
                      </span>
                      <span className="text-base md:text-xl font-black font-mono text-indigo-400">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full h-3 md:h-4 bg-zinc-900 rounded-xl overflow-hidden border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className={`h-full rounded-xl shadow-[0_0_15px_currentColor] ${isLaunched ? "bg-emerald-500" : "bg-indigo-500"}`}
                      />
                    </div>
                  </div>

                  {/* Success Message Overlay */}
                  <AnimatePresence>
                    {isLaunched && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-0 bg-[#050505]/95 backdrop-blur-md flex flex-col items-center justify-center z-20 rounded-[2.5rem]"
                      >
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                          <Check className="w-10 h-10 md:w-12 md:h-12 text-emerald-400" />
                        </div>
                        <span className="text-emerald-400 font-black uppercase tracking-[0.3em] text-xl md:text-3xl text-center px-4">
                          Platform Launched
                        </span>
                        <span className="text-sm md:text-base font-mono text-emerald-500/70 mt-4 tracking-[0.2em]">
                          REDIRECTING TO MAINFRAME...
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// Sub-component for the terminal boot steps (Scaled for Smart Board)
function BootStep({
  active,
  icon: Icon,
  text,
  code,
}: {
  active: boolean;
  icon: React.ElementType;
  text: string;
  code: string;
}) {
  return (
    <div
      className={`flex items-center gap-6 md:gap-8 font-mono transition-all duration-500 ${active ? "text-zinc-200" : "text-zinc-700"}`}
    >
      <div
        className={`p-3 md:p-4 rounded-2xl border-2 ${active ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-white/5 border-white/5 text-zinc-700"}`}
      >
        <Icon className="w-6 h-6 md:w-8 md:h-8" />
      </div>
      <div className="flex-1 flex flex-col">
        <span className="text-sm md:text-xl uppercase tracking-wider">
          {text}
        </span>
        <span
          className={`text-[10px] md:text-xs mt-1 md:mt-2 tracking-[0.3em] ${active ? "text-indigo-500/70" : "text-zinc-800"}`}
        >
          [{code}]
        </span>
      </div>
      <span
        className={`text-sm md:text-xl font-black tracking-widest ${active ? "text-emerald-400" : "text-zinc-800"}`}
      >
        {active ? "OK" : "WAIT"}
      </span>
    </div>
  );
}
