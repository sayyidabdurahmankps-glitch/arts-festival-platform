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
  Fingerprint,
  Check
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

  // Calculate progress bar percentage
  const progressPercent = bootStage === 0 ? 0 : bootStage === 1 ? 33 : bootStage === 2 ? 66 : 100;

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-zinc-400 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden relative items-center justify-center p-4 sm:p-6">
      
      {/* --- Deep Ambient Background --- */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#050505]/80 to-[#050505] z-0 pointer-events-none" />
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[150px] pointer-events-none rounded-[3rem]" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] pointer-events-none rounded-[3rem]" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none z-0" />

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

      {/* --- Main Launch Console --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-3xl p-[1px] rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        {/* Premium Gradient Border Wrap */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-white/5 to-purple-500/30" />
        
        {/* Inner Console */}
        <div className="relative bg-zinc-950/90 backdrop-blur-3xl rounded-[2.5rem] overflow-hidden flex flex-col h-full w-full">
          
          {/* Top Terminal Bar */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-black/40">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-md bg-red-500/20 border border-red-500/50" />
                <div className="w-3 h-3 rounded-md bg-yellow-500/20 border border-yellow-500/50" />
                <div className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/50" />
              </div>
              <div className="w-px h-4 bg-white/10 mx-2" />
              <Terminal className="w-4 h-4 text-zinc-500" />
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-zinc-400">FestOS // Launch_Protocol</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 hidden sm:block">Status</span>
              <div className={`w-2.5 h-2.5 rounded-sm ${isLaunched ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : isBooting ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'} transition-colors duration-500`} />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="p-8 sm:p-16 text-center flex flex-col items-center relative overflow-hidden">
            
            <AnimatePresence mode="wait">
              {!isBooting ? (
                /* --- PRE-LAUNCH STATE --- */
                <motion.div
                  key="pre-launch"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  className="flex flex-col items-center w-full"
                >
                  <motion.div 
                    animate={{ y: [0, -5, 0] }} 
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="mb-8 px-5 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                  >
                    <Fingerprint className="w-4 h-4" />
                    Awaiting VIP Authorization
                  </motion.div>

                  <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-zinc-200 to-zinc-600 mb-3">
                    Fest<span className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">OS</span>
                  </h1>
                  <p className="text-xs sm:text-sm font-black uppercase tracking-[0.5em] text-zinc-500 mb-16">
                    Synergy • Artistry • Legacy
                  </p>

                  {/* ⚡ THE BIG VIP LAUNCH BUTTON WITH SPINNING SQUIRCLES */}
                  <div className="relative w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center">
                    
                    {/* Outer Spinning Ring */}
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                      className="absolute inset-0 rounded-[2.5rem] border border-indigo-500/20"
                    />
                    
                    {/* Inner Spinning Ring */}
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                      className="absolute inset-4 rounded-[2rem] border border-purple-500/30 border-dashed"
                    />

                    {/* Core Button */}
                    <button
                      onClick={handleGuestLaunch}
                      className="group relative z-10 w-32 h-32 sm:w-40 sm:h-40 bg-indigo-600 rounded-[1.5rem] flex flex-col items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)] hover:shadow-[0_0_80px_rgba(79,70,229,0.8)] hover:bg-indigo-500 hover:scale-105 transition-all duration-500 active:scale-95 border-2 border-indigo-400/50 overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Power className="w-12 h-12 sm:w-16 sm:h-16 text-white mb-2 drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
                      <span className="text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] drop-shadow-md">
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
                  className="flex flex-col items-center w-full max-w-lg mx-auto"
                >
                  <motion.div 
                    animate={{ 
                      boxShadow: isLaunched ? "0 0 80px rgba(16,185,129,0.4)" : "0 0 40px rgba(99,102,241,0.2)",
                      borderColor: isLaunched ? "rgba(16,185,129,0.5)" : "rgba(99,102,241,0.5)"
                    }}
                    className="w-24 h-24 sm:w-32 sm:h-32 mb-10 bg-black/60 border-2 rounded-[1.5rem] flex items-center justify-center transition-all duration-1000 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent" />
                    {isLaunched ? (
                      <Rocket className="w-10 h-10 sm:w-14 sm:h-14 text-emerald-400 relative z-10" />
                    ) : (
                      <Activity className="w-10 h-10 sm:w-14 sm:h-14 text-indigo-400 animate-pulse relative z-10" />
                    )}
                  </motion.div>

                  {/* Boot Sequence Status Box */}
                  <div className="w-full bg-black/50 border border-white/5 rounded-[1.5rem] p-6 sm:p-8 text-left shadow-inner relative overflow-hidden">
                    <div className="space-y-5 relative z-10">
                      <BootStep active={bootStage >= 1} icon={Server} text="Initializing Core Mainframe" code="0xSYS_BOOT" />
                      <BootStep active={bootStage >= 2} icon={Activity} text="Establishing Real-time Uplink" code="0xWSS_SYNC" />
                      <BootStep active={bootStage >= 3} icon={ShieldCheck} text="Verifying Security Protocols" code="0xAUTH_CHK" />
                    </div>

                    {/* Dynamic Progress Bar */}
                    <div className="mt-8 pt-6 border-t border-white/10">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Boot Progress</span>
                        <span className="text-xs font-black font-mono text-indigo-400">{progressPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-900 rounded-lg overflow-hidden border border-white/5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercent}%` }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                          className={`h-full rounded-lg shadow-[0_0_10px_currentColor] ${isLaunched ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        />
                      </div>
                    </div>

                    {/* Success Message */}
                    <AnimatePresence>
                      {isLaunched && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute inset-0 bg-emerald-950/90 backdrop-blur-md flex flex-col items-center justify-center z-20"
                        >
                          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-3">
                            <Check className="w-6 h-6 text-emerald-400" />
                          </div>
                          <span className="text-emerald-400 font-black uppercase tracking-[0.2em] text-sm">
                            Platform Launched
                          </span>
                          <span className="text-[9px] font-mono text-emerald-500/70 mt-2">REDIRECTING TO MAINFRAME...</span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Sub-component for the terminal boot steps
function BootStep({ active, icon: Icon, text, code }: { active: boolean, icon: any, text: string, code: string }) {
  return (
    <div className={`flex items-center gap-4 font-mono transition-all duration-500 ${active ? 'text-zinc-200' : 'text-zinc-700'}`}>
      <div className={`p-2 rounded-xl border ${active ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-white/5 border-white/5 text-zinc-700'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 flex flex-col">
        <span className="text-[10px] sm:text-xs uppercase tracking-wider">{text}</span>
        <span className={`text-[8px] sm:text-[9px] mt-0.5 tracking-widest ${active ? 'text-indigo-500/70' : 'text-zinc-800'}`}>[{code}]</span>
      </div>
      <span className={`text-[10px] sm:text-xs font-black tracking-widest ${active ? 'text-emerald-400' : 'text-zinc-800'}`}>
        {active ? 'OK' : 'WAIT'}
      </span>
    </div>
  );
}