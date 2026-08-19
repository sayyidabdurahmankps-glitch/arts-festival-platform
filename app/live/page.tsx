"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Trophy, Loader2, Crown, Radio } from "lucide-react";
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

  // ⚡ BULLETPROOF FETCH ENGINE
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
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center gap-6 sm:gap-8 text-center selection:bg-indigo-500/30 p-4">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-[50px] opacity-40 animate-pulse" />
          <Loader2 className="w-16 h-16 sm:w-20 sm:h-20 text-indigo-500 animate-spin relative z-10" />
        </div>
        <p className="text-indigo-400 font-mono text-sm sm:text-xl uppercase tracking-[0.3em] sm:tracking-[0.5em] animate-pulse">
          Establishing Uplink...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#030303] text-zinc-300 flex flex-col overflow-y-auto lg:overflow-hidden font-sans selection:bg-indigo-500/30 relative z-50">
      
      {/* --- CINEMATIC AMBIENCE --- */}
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] sm:bg-[size:64px_64px] pointer-events-none" />
      
      {/* Dynamic Background Glow mapped to 1st Place */}
      <div
        className="fixed top-0 left-0 w-[100vw] h-[60vh] blur-[150px] sm:blur-[250px] opacity-20 transition-colors duration-1000 z-0 pointer-events-none"
        style={{ backgroundColor: general[0]?.color || "#4f46e5" }}
      />

      {/* --- CENTERED BROADCAST HEADER --- */}
      <header className="relative z-10 w-full px-4 sm:px-8 lg:px-16 pt-10 sm:pt-14 pb-8 flex flex-col items-center justify-center shrink-0 gap-4 text-center">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 animate-pulse">
            <Radio className="w-3 h-3 sm:w-4 sm:h-4" />
          </span>
          <span className="font-mono text-xs sm:text-sm md:text-base uppercase tracking-[0.4em] sm:tracking-[0.5em] text-red-400 font-bold">
            Live Broadcast
          </span>
        </div>
        <h1 className="text-5xl sm:text-7xl lg:text-[7rem] font-black tracking-tighter text-white uppercase leading-none drop-shadow-2xl">
          Essenza <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-300 to-zinc-700">Standings</span>
        </h1>
      </header>

      {/* --- PREMIUM FLOATING BENTO GRID --- */}
      <main className="flex-1 w-full max-w-[2000px] mx-auto flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-10 p-4 sm:p-6 lg:p-10 relative z-10 lg:h-full lg:max-h-[calc(100vh-200px)] lg:pb-12">
        
        {/* 🟢 LEFT: GENERAL CHAMPIONSHIP (7 Columns Wide) */}
        <section className="col-span-7 flex flex-col lg:h-full">
          
          {/* Aligned Header */}
          <div className="h-12 lg:h-16 flex items-center gap-3 sm:gap-4 mb-4 lg:mb-6 shrink-0 pl-2">
            <Trophy className="w-8 h-8 lg:w-10 lg:h-10 text-yellow-500 shrink-0" />
            <h2 className="text-2xl lg:text-4xl font-black uppercase tracking-widest text-zinc-200 truncate pt-1 drop-shadow-md">
              General Championship
            </h2>
          </div>
          
          {/* Floating Cards Array */}
          <div className="flex-1 flex flex-col gap-4 lg:gap-5">
            {general.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 bg-white/5 border border-white/10 rounded-[2rem]">
                <Trophy className="w-16 h-16 mb-4 text-zinc-600" />
                <p className="font-mono text-sm uppercase tracking-[0.3em]">Awaiting Results</p>
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
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      /* ⚡ FIX: Uses native border-left to perfectly hug the rounded corners */
                      className={`flex-1 flex items-center justify-between px-5 sm:px-8 lg:px-10 py-4 lg:py-0 rounded-2xl lg:rounded-[2rem] relative overflow-hidden transition-colors w-full border-y border-r border-l-[8px] lg:border-l-[12px] backdrop-blur-2xl ${
                        isFirst ? "bg-black/80 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" : "bg-black/40 hover:bg-black/60"
                      }`}
                      style={{
                        borderLeftColor: teamColor,
                        borderTopColor: "rgba(255,255,255,0.05)",
                        borderRightColor: "rgba(255,255,255,0.05)",
                        borderBottomColor: "rgba(255,255,255,0.05)",
                        boxShadow: isFirst ? `inset 50px 0 100px -50px ${teamColor}30` : 'none'
                      }}
                    >
                      <div className="flex items-center gap-4 lg:gap-8 w-full min-w-0">
                        <div
                          className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-xl lg:rounded-2xl flex items-center justify-center font-black text-xl sm:text-3xl lg:text-4xl shadow-inner shrink-0"
                          style={{
                            backgroundColor: isFirst ? teamColor : "rgba(255,255,255,0.05)",
                            color: isFirst ? "#fff" : teamColor,
                          }}
                        >
                          {isFirst ? <Crown className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" /> : `#${index + 1}`}
                        </div>
                        <span className={`text-2xl sm:text-4xl lg:text-[3.5rem] font-black uppercase tracking-tight truncate w-full pr-2 ${isFirst ? "text-white" : "text-zinc-300"}`}>
                          {teamName}
                        </span>
                      </div>

                      <div className="flex items-end gap-2 lg:gap-3 text-right shrink-0">
                        <motion.span 
                          key={entry.total_points}
                          initial={{ scale: 1.2, color: teamColor }}
                          animate={{ scale: 1, color: isFirst ? "#fff" : "#d4d4d8" }}
                          className="text-4xl sm:text-6xl lg:text-[5.5rem] font-black tabular-nums tracking-tighter leading-none"
                        >
                          {entry.total_points}
                        </motion.span>
                        <span className="text-sm lg:text-2xl font-black uppercase text-zinc-600 tracking-[0.3em] pb-0.5 lg:pb-1.5">
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

        {/* 🟣 RIGHT: HIFZ DUEL (5 Columns Wide) */}
        <section className="col-span-5 flex flex-col lg:h-full mt-6 lg:mt-0">
          
          {/* Aligned Header */}
          <div className="h-12 lg:h-16 flex items-center gap-3 sm:gap-4 mb-4 lg:mb-6 shrink-0 pl-2">
            <Zap className="w-8 h-8 lg:w-10 lg:h-10 text-indigo-400 shrink-0" />
            <h2 className="text-2xl lg:text-4xl font-black uppercase tracking-widest text-indigo-400 truncate pt-1 drop-shadow-md">
              Hifz Duel
            </h2>
          </div>

          {/* Floating Cards Array */}
          <div className="flex-1 flex flex-col sm:flex-row lg:flex-col gap-4 lg:gap-5">
            {hifz.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 bg-indigo-950/20 border border-indigo-500/20 rounded-[2rem]">
                <Zap className="w-16 h-16 mb-4 text-indigo-800" />
                <p className="font-mono text-sm uppercase tracking-[0.3em] text-indigo-600">Awaiting Results</p>
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
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      /* ⚡ FIX: Top border creates a premium inset aesthetic */
                      className="flex-1 w-full bg-indigo-950/30 backdrop-blur-2xl border-x border-b border-t-[8px] lg:border-t-[12px] rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl"
                      style={{
                        borderTopColor: teamColor,
                        borderLeftColor: "rgba(99,102,241,0.15)",
                        borderRightColor: "rgba(99,102,241,0.15)",
                        borderBottomColor: "rgba(99,102,241,0.15)",
                      }}
                    >
                      {/* Ambient Inner Glow */}
                      {index === 0 && (
                        <div 
                          className="absolute inset-0 opacity-15 pointer-events-none" 
                          style={{ background: `radial-gradient(circle at top, ${teamColor}, transparent 70%)` }} 
                        />
                      )}

                      <div 
                        className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full border-2 sm:border-4 shadow-2xl flex items-center justify-center mb-4 sm:mb-6 relative z-10 shrink-0 bg-black/50" 
                        style={{ borderColor: teamColor }}
                      >
                        <span className="font-black text-xl sm:text-2xl lg:text-3xl" style={{ color: teamColor }}>#{index + 1}</span>
                      </div>
                      
                      <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight relative z-10 mb-2 w-full truncate px-4">
                        {teamName}
                      </h3>
                      
                      <motion.div 
                        key={entry.total_points} 
                        initial={{ scale: 1.2 }} 
                        animate={{ scale: 1 }} 
                        className="text-6xl sm:text-7xl lg:text-[7rem] font-black tabular-nums tracking-tighter text-white relative z-10 leading-none mt-2 drop-shadow-lg"
                      >
                        {entry.total_points}
                      </motion.div>
                      <p className="text-sm lg:text-lg font-black text-indigo-400/60 uppercase tracking-[0.4em] lg:tracking-[0.5em] mt-3 lg:mt-6 relative z-10">
                        Points
                      </p>
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