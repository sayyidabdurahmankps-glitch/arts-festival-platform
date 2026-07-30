"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Power, 
  Rocket, 
  ShieldCheck, 
  Terminal, 
  Activity,
  Server
} from "lucide-react";

export default function LaunchPage() {
  const [bootStage, setBootStage] = useState(0);
  const [systemReady, setSystemReady] = useState(false);

  // Simulated Boot Sequence
  useEffect(() => {
    const sequence = async () => {
      await new Promise((res) => setTimeout(res, 800));
      setBootStage(1); // Power On
      await new Promise((res) => setTimeout(res, 1200));
      setBootStage(2); // Establishing Database Connection
      await new Promise((res) => setTimeout(res, 1500));
      setBootStage(3); // Security Checks
      await new Promise((res) => setTimeout(res, 1000));
      setSystemReady(true); // Ready to Launch
    };
    sequence();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-zinc-400 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden relative items-center justify-center p-6">
      
      {/* --- Ambient Background --- */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] pointer-events-none" style={{ borderRadius: '2rem' }} />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] pointer-events-none" style={{ borderRadius: '2rem' }} />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* --- Main Launch Console --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-2xl bg-zinc-900/40 border border-white/5 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden"
      >
        {/* Top Terminal Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/50">
          <div className="flex items-center gap-2 text-zinc-500">
            <Terminal className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">FestOS_Gateway_v1.0</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-sm ${bootStage >= 1 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'} transition-colors duration-500`} />
            <div className={`w-2 h-2 rounded-sm ${bootStage >= 2 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-zinc-700'} transition-colors duration-500`} />
            <div className={`w-2 h-2 rounded-sm ${systemReady ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'} transition-colors duration-500`} />
          </div>
        </div>

        <div className="p-8 sm:p-12 text-center flex flex-col items-center">
          
          {/* Logo / Icon Area */}
          <motion.div 
            animate={{ 
              boxShadow: systemReady ? "0 0 60px rgba(99,102,241,0.2)" : "0 0 0px rgba(99,102,241,0)"
            }}
            className="w-24 h-24 sm:w-32 sm:h-32 mb-8 bg-black/60 border border-white/10 rounded-2xl flex items-center justify-center transition-all duration-1000"
          >
            {systemReady ? (
              <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400 animate-pulse" />
            ) : (
              <Power className="w-10 h-10 sm:w-12 sm:h-12 text-zinc-600" />
            )}
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-2">
            Fest<span className="text-indigo-500">OS</span>
          </h1>
          <p className="text-xs sm:text-sm font-black uppercase tracking-[0.4em] text-zinc-500 mb-10">
            Synergy • Artistry • Legacy
          </p>

          {/* Boot Sequence Status Box */}
          <div className="w-full bg-black/50 border border-white/5 rounded-xl p-6 mb-10 text-left space-y-4">
            <BootStep 
              active={bootStage >= 1} 
              icon={Server} 
              text="Initializing Core Mainframe" 
            />
            <BootStep 
              active={bootStage >= 2} 
              icon={Activity} 
              text="Establishing Real-time Uplink" 
            />
            <BootStep 
              active={bootStage >= 3} 
              icon={ShieldCheck} 
              text="Verifying Security Protocols" 
            />
          </div>

          {/* Action Button */}
          <AnimatePresence>
            {systemReady ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full"
              >
                <Link 
                  href="/"
                  className="group relative w-full flex items-center justify-center gap-3 bg-indigo-600 text-white font-black uppercase tracking-widest text-sm px-8 py-5 rounded-xl hover:bg-indigo-500 transition-all active:scale-95 shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_50px_rgba(79,70,229,0.5)] overflow-hidden"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  <Power className="w-5 h-5" />
                  Initialize System
                </Link>
              </motion.div>
            ) : (
              <div className="w-full py-5 rounded-xl bg-white/5 border border-white/5 text-zinc-600 font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 cursor-not-allowed">
                <span className="w-4 h-4 border-2 border-zinc-600 border-t-transparent rounded-full animate-spin" />
                Booting Sequence...
              </div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </div>
  );
}

// Sub-component for the terminal boot steps
function BootStep({ active, icon: Icon, text }: { active: boolean, icon: any, text: string }) {
  return (
    <div className={`flex items-center gap-4 font-mono text-xs sm:text-sm uppercase tracking-wider transition-colors duration-500 ${active ? 'text-emerald-400' : 'text-zinc-700'}`}>
      <Icon className={`w-4 h-4 ${active ? 'animate-pulse' : ''}`} />
      <span className="flex-1">{text}</span>
      <span className="text-[10px]">
        {active ? '[ OK ]' : '[ WAIT ]'}
      </span>
    </div>
  );
}