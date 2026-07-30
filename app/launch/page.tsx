"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Power, 
  Rocket, 
  ShieldCheck, 
  Terminal, 
  Activity,
  Server,
  Fingerprint
} from "lucide-react";

export default function LaunchPage() {
  const router = useRouter();
  const [bootStage, setBootStage] = useState(0);
  const [isBooting, setIsBooting] = useState(false);
  const [isLaunched, setIsLaunched] = useState(false);

  // ⚡ VIP Manual Trigger Sequence
  const handleGuestLaunch = async () => {
    if (isBooting || isLaunched) return;
    
    setIsBooting(true);

    // Cinematic Boot Sequence
    await new Promise((res) => setTimeout(res, 800));
    setBootStage(1); // Power On
    
    await new Promise((res) => setTimeout(res, 1200));
    setBootStage(2); // Establishing Database Connection
    
    await new Promise((res) => setTimeout(res, 1500));
    setBootStage(3); // Security Checks
    
    await new Promise((res) => setTimeout(res, 1000));
    setIsLaunched(true); // Final Success State

    // Dramatic pause before pushing to the Home Page
    await new Promise((res) => setTimeout(res, 1500));
    router.push("/");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-zinc-400 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden relative items-center justify-center p-6">
      
      {/* --- Ambient Background --- */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] pointer-events-none rounded-2xl" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] pointer-events-none rounded-2xl" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* --- Global Success Flash (Triggers right before redirect) --- */}
      <AnimatePresence>
        {isLaunched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-indigo-500/20 z-50 pointer-events-none mix-blend-screen"
          />
        )}
      </AnimatePresence>

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
            <span className="text-[10px] font-mono uppercase tracking-[0.2em]">FestOS_Inauguration_Protocol</span>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-sm ${bootStage >= 1 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'} transition-colors duration-500`} />
            <div className={`w-2 h-2 rounded-sm ${bootStage >= 2 ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-zinc-700'} transition-colors duration-500`} />
            <div className={`w-2 h-2 rounded-sm ${isLaunched ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'} transition-colors duration-500`} />
          </div>
        </div>

        <div className="p-8 sm:p-12 text-center flex flex-col items-center">
          
          {/* Guest Authorization Notice */}
          <motion.div 
            animate={{ opacity: isBooting ? 0 : 1 }}
            className="mb-8 px-4 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.15)]"
          >
            <Fingerprint className="w-3 h-3" />
            Awaiting Guest Authorization
          </motion.div>

          {/* Title */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 mb-2">
            Fest<span className="text-indigo-500">OS</span>
          </h1>
          <p className="text-xs sm:text-sm font-black uppercase tracking-[0.4em] text-zinc-500 mb-10">
            Synergy • Artistry • Legacy
          </p>

          {/* ⚡ THE BIG VIP LAUNCH BUTTON */}
          <AnimatePresence mode="popLayout">
            {!isBooting ? (
              <motion.button
                key="launch-btn"
                onClick={handleGuestLaunch}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                className="group relative flex flex-col items-center justify-center w-48 h-48 sm:w-56 sm:h-56 bg-indigo-600 rounded-2xl shadow-[0_0_50px_rgba(79,70,229,0.4)] hover:shadow-[0_0_80px_rgba(79,70,229,0.6)] hover:bg-indigo-500 transition-all duration-500 mb-6 active:scale-95 border-2 border-indigo-400/50"
              >
                <div className="absolute inset-0 bg-white/20 rounded-2xl animate-ping opacity-20" />
                <Power className="w-16 h-16 sm:w-20 sm:h-20 text-white mb-2 drop-shadow-xl" />
                <span className="text-white font-black uppercase tracking-widest text-xs sm:text-sm drop-shadow-md">
                  Initiate Launch
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="boot-sequence"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="w-full flex flex-col items-center"
              >
                <motion.div 
                  animate={{ 
                    boxShadow: isLaunched ? "0 0 60px rgba(16,185,129,0.4)" : "0 0 40px rgba(99,102,241,0.2)",
                    borderColor: isLaunched ? "rgba(16,185,129,0.5)" : "rgba(99,102,241,0.5)"
                  }}
                  className="w-24 h-24 sm:w-28 sm:h-28 mb-8 bg-black/60 border rounded-2xl flex items-center justify-center transition-all duration-1000"
                >
                  {isLaunched ? (
                    <Rocket className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400" />
                  ) : (
                    <Power className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-400 animate-pulse" />
                  )}
                </motion.div>

                {/* Boot Sequence Status Box */}
                <div className="w-full bg-black/50 border border-white/5 rounded-2xl p-6 text-left space-y-4 shadow-inner">
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
                  {isLaunched && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="pt-4 mt-4 border-t border-white/10 text-center"
                    >
                      <span className="text-emerald-400 font-black uppercase tracking-[0.3em] text-sm flex items-center justify-center gap-2">
                        <Rocket className="w-4 h-4" /> Platform Successfully Launched
                      </span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
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
    <div className={`flex items-center gap-4 font-mono text-xs sm:text-sm uppercase tracking-wider transition-colors duration-500 ${active ? 'text-indigo-400' : 'text-zinc-700'}`}>
      <Icon className={`w-4 h-4 ${active ? 'animate-pulse' : ''}`} />
      <span className="flex-1">{text}</span>
      <span className={`text-[10px] ${active ? 'text-emerald-500' : 'text-zinc-700'}`}>
        {active ? '[ OK ]' : '[ WAIT ]'}
      </span>
    </div>
  );
}