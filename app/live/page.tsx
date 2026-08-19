"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Trophy, Loader2, Crown, Radio, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
type TeamStats = {
  id: string;
  name?: string;
  team_name?: string;
  team?: string;
  total_points: number;
  color?: string;
};

export default function LiveProjector() {
  const [general, setGeneral] = useState<TeamStats[]>([]);
  const [hifz, setHifz] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>("");

  // ⚡ LIVE CLOCK ENGINE
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ⚡ BULLETPROOF FETCH ENGINE (Mirrors your Home page exactly)
  const fetchLeaderboard = async () => {
    try {
      const [generalRes, hifzRes] = await Promise.all([
        supabase
          .from("team_leaderboard")
          .select("*")
          .neq("category_group", "Hifz")
          .order("total_points", { ascending: false })
          .limit(4),
        supabase
          .from("team_leaderboard")
          .select("*")
          .eq("category_group", "Hifz")
          .order("total_points", { ascending: false })
          .limit(2),
      ]);

      if (generalRes.data) setGeneral(generalRes.data);
      if (hifzRes.data) setHifz(hifzRes.data);
    } catch (error) {
      console.error("Live Projector Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const channel = supabase
      .channel("live-projector")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => fetchLeaderboard())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center gap-8 text-center selection:bg-indigo-500/30">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-[50px] opacity-40 animate-pulse" />
          <Loader2 className="w-20 h-20 text-indigo-500 animate-spin relative z-10" />
        </div>
        <p className="text-indigo-400 font-mono text-xl uppercase tracking-[0.5em] animate-pulse">
          Establishing Uplink...
        </p>
      </div>
    );

  return (
    // ⚡ OVERFLOW-HIDDEN LOCK: Prevents the "blank page" layout shift bug
    <div className="h-screen w-screen bg-[#030303] text-zinc-300 flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30 fixed inset-0 z-50">
      
      {/* --- CINEMATIC AMBIENCE --- */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      
      {/* Dynamic Aura tied to the current winning team */}
      <div
        className="absolute top-0 left-0 w-[100vw] h-[50vh] blur-[200px] opacity-30 transition-colors duration-1000 z-0 pointer-events-none"
        style={{ backgroundColor: general[0]?.color || "#4f46e5" }}
      />

      {/* --- BROADCAST HEADER --- */}
      <header className="relative z-10 w-full px-8 lg:px-16 pt-8 pb-4 flex justify-between items-end shrink-0 border-b border-white/5 bg-black/20 backdrop-blur-sm">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 animate-pulse">
              <Radio className="w-3 h-3" />
            </span>
            <span className="font-mono text-xs md:text-sm uppercase tracking-[0.4em] text-red-400 font-bold">
              Live Broadcast
            </span>
          </div>
          <h1 className="text-5xl lg:text-[5rem] font-black tracking-tighter text-white uppercase leading-none drop-shadow-xl">
            Essenza <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-600">Standings</span>
          </h1>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 text-zinc-500 mb-2">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm uppercase tracking-[0.2em]">Local Time</span>
          </div>
          <div className="font-mono text-3xl lg:text-4xl font-black text-white tabular-nums tracking-tight">
            {currentTime || "00:00:00"}
          </div>
        </div>
      </header>

      {/* --- MASSIVE SPLIT-PANE DASHBOARD --- */}
      <main className="flex-1 w-full flex items-stretch gap-6 lg:gap-10 p-6 lg:p-10 relative z-10 h-full max-h-full">
        
        {/* 🟢 LEFT: GENERAL CHAMPIONSHIP */}
        <section className="flex-1 flex flex-col h-full bg-black/40 backdrop-blur-2xl border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex items-center gap-4 shrink-0">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-black uppercase tracking-widest text-white">General Championship</h2>
          </div>
          
          <div className="flex-1 p-6 flex flex-col gap-4">
            {general.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                <Trophy className="w-20 h-20 mb-6 text-zinc-700" />
                <p className="font-mono uppercase tracking-[0.3em]">Awaiting Results</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {general.map((entry, index) => {
                  const teamColor = entry.color || "#6366f1";
                  const teamName = entry.name || entry.team_name || entry.team || "Unknown Team";
                  const isFirst = index === 0;

                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className={`flex-1 flex items-center justify-between px-6 lg:px-10 rounded-[1.5rem] relative overflow-hidden transition-colors ${
                        isFirst ? "bg-white/10 shadow-2xl" : "bg-white/5"
                      }`}
                      style={{
                        border: isFirst ? `1px solid ${teamColor}50` : "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      {/* Left Accent Bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-3" style={{ backgroundColor: teamColor }} />
                      
                      {/* Rank & Name */}
                      <div className="flex items-center gap-6 lg:gap-8 ml-4">
                        <div
                          className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center font-black text-2xl lg:text-4xl shadow-inner shrink-0"
                          style={{
                            backgroundColor: isFirst ? teamColor : "rgba(0,0,0,0.4)",
                            color: isFirst ? "#fff" : teamColor,
                          }}
                        >
                          {isFirst ? <Crown className="w-8 h-8 lg:w-10 lg:h-10" /> : `#${index + 1}`}
                        </div>
                        <span className={`text-4xl lg:text-5xl font-black uppercase tracking-tight truncate max-w-[20rem] lg:max-w-[30rem] ${isFirst ? "text-white" : "text-zinc-200"}`}>
                          {teamName}
                        </span>
                      </div>

                      {/* Points */}
                      <div className="flex items-end gap-3 text-right">
                        <motion.span 
                          key={entry.total_points}
                          initial={{ scale: 1.2, color: teamColor }}
                          animate={{ scale: 1, color: isFirst ? "#fff" : "#d4d4d8" }}
                          className="text-6xl lg:text-7xl font-black tabular-nums tracking-tighter leading-none"
                        >
                          {entry.total_points}
                        </motion.span>
                        <span className="text-xl lg:text-2xl font-black uppercase text-zinc-600 tracking-widest pb-1 lg:pb-2">
                          PTS
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </section>

        {/* 🟣 RIGHT: HIFZ DUEL */}
        <section className="w-[35%] flex flex-col h-full bg-indigo-950/20 backdrop-blur-2xl border border-indigo-500/10 rounded-[2rem] overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
          
          <div className="px-8 py-6 border-b border-indigo-500/10 bg-indigo-500/5 flex items-center gap-4 shrink-0 relative z-10">
            <Zap className="w-8 h-8 text-indigo-400" />
            <h2 className="text-3xl font-black uppercase tracking-widest text-indigo-400">Hifz Duel</h2>
          </div>

          <div className="flex-1 p-6 flex flex-col gap-6 relative z-10">
            {hifz.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                <Zap className="w-20 h-20 mb-6 text-indigo-900" />
                <p className="font-mono uppercase tracking-[0.3em] text-indigo-700">Awaiting Results</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {hifz.map((entry, index) => {
                  const teamColor = entry.color || "#6366f1";
                  const teamName = entry.name || entry.team_name || entry.team || "Unknown Team";

                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="flex-1 w-full bg-black/40 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden"
                    >
                      {/* Subdued Glow */}
                      {index === 0 && (
                        <div 
                          className="absolute inset-0 opacity-10 pointer-events-none" 
                          style={{ background: `radial-gradient(circle at center, ${teamColor}, transparent 60%)` }} 
                        />
                      )}

                      <div 
                        className="w-16 h-16 rounded-full border-4 shadow-2xl flex items-center justify-center mb-6 relative z-10 shrink-0" 
                        style={{ borderColor: teamColor, backgroundColor: "rgba(0,0,0,0.5)" }}
                      >
                        <span className="font-black text-2xl" style={{ color: teamColor }}>#{index + 1}</span>
                      </div>
                      
                      <h3 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tight relative z-10 mb-2 w-full truncate px-4">
                        {teamName}
                      </h3>
                      
                      <motion.div 
                        key={entry.total_points} 
                        initial={{ scale: 1.2 }} 
                        animate={{ scale: 1 }} 
                        className="text-6xl lg:text-7xl font-black tabular-nums tracking-tighter text-white relative z-10"
                      >
                        {entry.total_points}
                      </motion.div>
                      <p className="text-sm font-black text-zinc-500 uppercase tracking-[0.4em] mt-2 relative z-10">Points</p>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}