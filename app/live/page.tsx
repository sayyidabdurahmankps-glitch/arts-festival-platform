"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Trophy, Loader2, Crown, Activity } from "lucide-react";
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
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center gap-6 text-center selection:bg-indigo-500/30 p-4 font-sans">
        <Loader2 className="w-20 h-20 text-indigo-500 animate-spin" />
        <p className="text-zinc-500 font-mono text-xl uppercase tracking-[0.4em] animate-pulse">Syncing Core Data...</p>
      </div>
    );

  return (
    <div className="min-h-screen lg:h-screen w-full bg-[#000000] text-zinc-300 flex flex-col overflow-y-auto lg:overflow-hidden font-sans selection:bg-indigo-500/30 relative z-50">
      
      {/* --- CINEMATIC DOT MATRIX AMBIENCE --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] md:bg-[size:32px_32px] pointer-events-none opacity-80" />
      
      {/* Massive Background Glow mapped to 1st Place */}
      <div
        className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[120vw] h-[70vh] blur-[200px] sm:blur-[300px] opacity-20 transition-colors duration-1000 z-0 pointer-events-none"
        style={{ backgroundColor: general[0]?.color || "#4f46e5" }}
      />

      {/* --- SLEEK BROADCAST HEADER --- */}
      <header className="relative z-10 w-full pt-8 pb-6 flex flex-col items-center justify-center shrink-0 gap-3 text-center">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
          <span className="font-mono text-sm uppercase tracking-[0.5em] text-zinc-400 font-bold">
            Live Feed Active
          </span>
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-[6.5rem] font-black tracking-tighter text-white uppercase leading-none">
          Essenza
        </h1>
      </header>

      {/* --- THE MODERN DASHBOARD ENGINE --- */}
      <main className="flex-1 w-full max-w-[2400px] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10 p-4 sm:p-6 lg:p-10 lg:pt-2 relative z-10 lg:min-h-0 lg:pb-10">
        
        {/* 🟢 LEFT: GENERAL CHAMPIONSHIP */}
        <section className="flex flex-col w-full lg:w-[65%] lg:min-h-0">
          
          <div className="flex items-center gap-4 mb-4 lg:mb-6 shrink-0 pl-2">
            <Trophy className="w-8 h-8 text-zinc-500 shrink-0" />
            <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-widest text-zinc-300">
              General Championship
            </h2>
          </div>
          
          {/* ⚡ STRICT 5-ROW GRID: Eliminates the clipping bug permanently */}
          <div className="flex-1 grid grid-rows-5 gap-4 lg:gap-5 min-h-0">
            {general.length === 0 ? (
              <div className="row-span-5 flex flex-col items-center justify-center opacity-50 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-xl">
                <Trophy className="w-16 h-16 mb-4 text-zinc-600" />
                <p className="font-mono uppercase tracking-[0.3em]">Awaiting Results</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {general.map((entry, index) => {
                  const teamColor = entry.color || "#6366f1";
                  const teamName = entry.name || entry.team_name || entry.team || "Unknown Team";
                  const isFirst = index === 0;

                  // ⚡ THE #1 LEADER HERO CARD (Spans exactly 2 grid rows)
                  if (isFirst) {
                    return (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="row-span-2 w-full rounded-[2rem] lg:rounded-[2.5rem] relative overflow-hidden flex flex-col justify-between p-6 lg:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-white/10"
                        style={{ backgroundColor: 'rgba(20,20,20,0.6)', backdropFilter: 'blur(40px)' }}
                      >
                        {/* Huge Internal Glow */}
                        <div className="absolute -top-32 -right-32 w-96 h-96 blur-[100px] opacity-40 rounded-full" style={{ backgroundColor: teamColor }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                        <div className="relative z-10 flex justify-between items-start w-full">
                          <div className="px-5 py-2 rounded-full bg-white/10 border border-white/20 flex items-center gap-3 backdrop-blur-md">
                            <Crown className="w-4 h-4 lg:w-5 lg:h-5 text-yellow-400" />
                            <span className="font-bold text-xs lg:text-sm tracking-[0.2em] uppercase text-white">Current Leader</span>
                          </div>
                          <div className="w-3 h-3 lg:w-4 lg:h-4 rounded-full animate-pulse shadow-[0_0_20px_currentColor]" style={{ backgroundColor: teamColor, color: teamColor }} />
                        </div>

                        <div className="relative z-10 flex items-end justify-between w-full mt-auto pt-4">
                          <h3 className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase tracking-tight text-white leading-[0.9] truncate w-full sm:w-[65%] pr-4">
                            {teamName}
                          </h3>
                          <div className="flex items-baseline gap-2 lg:gap-3 text-right shrink-0">
                            <motion.span 
                              key={entry.total_points}
                              className="text-6xl sm:text-7xl lg:text-[7rem] font-black tabular-nums tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 drop-shadow-2xl"
                            >
                              {entry.total_points}
                            </motion.span>
                            <span className="text-lg lg:text-2xl font-black uppercase text-zinc-500 tracking-[0.3em] pb-1 lg:pb-3">
                              PTS
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // ⚡ RANKS 2, 3, 4: SLEEK GLASS PILLS (Span exactly 1 grid row each)
                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="row-span-1 w-full flex items-center justify-between px-6 sm:px-8 lg:px-10 rounded-[1.5rem] lg:rounded-[2rem] bg-white/[0.03] border border-white/5 backdrop-blur-3xl hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex items-center gap-4 lg:gap-6 w-full min-w-0">
                        <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full flex items-center justify-center font-black text-lg lg:text-2xl text-zinc-500 bg-black/40 border border-white/5 shrink-0">
                          #{index + 1}
                        </div>
                        <span className="text-2xl sm:text-3xl lg:text-4xl font-black uppercase tracking-tight truncate w-full text-zinc-300">
                          {teamName}
                        </span>
                      </div>

                      <div className="flex items-baseline gap-2 text-right shrink-0">
                        <motion.span 
                          key={entry.total_points}
                          className="text-4xl sm:text-5xl lg:text-6xl font-black tabular-nums tracking-tighter leading-none text-zinc-100"
                        >
                          {entry.total_points}
                        </motion.span>
                        <span className="text-xs lg:text-sm font-bold uppercase text-zinc-600 tracking-[0.2em] pb-1">
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
        <section className="flex flex-col w-full lg:w-[35%] lg:min-h-0 mt-6 lg:mt-0">
          
          <div className="flex items-center gap-4 mb-4 lg:mb-6 shrink-0 pl-2">
            <Zap className="w-8 h-8 text-zinc-500 shrink-0" />
            <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-widest text-zinc-300">
              Hifz Duel
            </h2>
          </div>

          <div className="flex-1 flex flex-col gap-4 lg:gap-5 min-h-0">
            {hifz.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-xl">
                <Zap className="w-16 h-16 mb-4 text-zinc-600" />
                <p className="font-mono uppercase tracking-[0.3em]">Awaiting Results</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {hifz.map((entry, index) => {
                  const teamColor = entry.color || "#6366f1";
                  const teamName = entry.name || entry.team_name || entry.team || "Unknown Team";
                  const isFirst = index === 0;

                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className={`flex-1 w-full rounded-[2rem] lg:rounded-[2.5rem] flex flex-col items-center justify-center text-center relative overflow-hidden border ${isFirst ? 'border-white/15 bg-white/[0.04]' : 'border-white/5 bg-black/40'} backdrop-blur-3xl`}
                    >
                      {/* Ambient Inner Glow for #1 */}
                      {isFirst && (
                        <div 
                          className="absolute inset-0 opacity-20 pointer-events-none" 
                          style={{ background: `radial-gradient(circle at center, ${teamColor}, transparent 70%)` }} 
                        />
                      )}

                      <div className="relative z-10 flex flex-col items-center justify-center w-full px-6">
                        <div className={`px-4 lg:px-5 py-1.5 rounded-full border mb-4 lg:mb-6 text-xs lg:text-sm font-bold tracking-[0.3em] uppercase ${isFirst ? 'bg-white/10 border-white/20 text-white' : 'bg-black/50 border-white/10 text-zinc-500'}`}>
                          Rank #{index + 1}
                        </div>
                        
                        <h3 className={`text-3xl lg:text-5xl font-black uppercase tracking-tight mb-2 w-full truncate ${isFirst ? 'text-white' : 'text-zinc-400'}`}>
                          {teamName}
                        </h3>
                        
                        <motion.div 
                          key={entry.total_points} 
                          className={`text-6xl lg:text-[6.5rem] font-black tabular-nums tracking-tighter leading-none mt-2 ${isFirst ? 'text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-300 drop-shadow-2xl' : 'text-zinc-500'}`}
                        >
                          {entry.total_points}
                        </motion.div>
                        <p className="text-xs lg:text-sm font-bold text-zinc-600 uppercase tracking-[0.4em] mt-3 lg:mt-4">
                          Points
                        </p>
                      </div>
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