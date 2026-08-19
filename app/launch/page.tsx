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
      <div className="h-screen w-full bg-[#030303] flex flex-col items-center justify-center gap-6 text-center font-sans">
        <Loader2 className="w-16 h-16 text-zinc-500 animate-spin" />
        <p className="text-zinc-500 font-mono text-sm uppercase tracking-[0.4em] animate-pulse">Syncing Core Data...</p>
      </div>
    );

  return (
    // ⚡ STRICT SCREEN LOCK: Prevents scrolling, forces mathematical alignment
    <div className="h-screen w-full bg-[#030303] text-zinc-300 flex flex-col overflow-hidden font-sans selection:bg-indigo-500/30 relative z-50">
      
      {/* --- MINIMALIST AMBIENCE --- */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px] md:bg-[size:32px_32px] pointer-events-none opacity-50" />

      {/* --- LOCKED HEADER --- */}
      <header className="h-[14vh] min-h-[100px] w-full flex flex-col items-center justify-center shrink-0 border-b border-zinc-900 bg-black/50 backdrop-blur-md z-10 relative">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] md:text-xs uppercase tracking-[0.5em] text-zinc-400 font-bold">
            Live Feed Active
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white uppercase leading-none">
          Essenza
        </h1>
      </header>

      {/* --- PERFECTLY ALIGNED DASHBOARD --- */}
      <main className="flex-1 w-full max-w-[2400px] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-8 p-4 lg:p-8 min-h-0 relative z-10">
        
        {/* 🟢 LEFT: GENERAL CHAMPIONSHIP */}
        <section className="flex flex-col w-full lg:w-[65%] h-full min-h-0">
          
          {/* STRICT HEADER HEIGHT */}
          <div className="h-10 lg:h-12 flex items-center gap-3 shrink-0">
            <Trophy className="w-6 h-6 text-zinc-500" />
            <h2 className="text-xl lg:text-2xl font-black uppercase tracking-widest text-zinc-300">
              General Championship
            </h2>
          </div>
          
          {/* STRICT 5-ROW GRID: Forces exact mathematical card heights */}
          <div className="flex-1 grid grid-rows-5 gap-4 min-h-0 pb-2">
            {general.length === 0 ? (
              <div className="row-span-5 flex flex-col items-center justify-center opacity-50 bg-[#0a0a0a] border border-zinc-800 rounded-3xl">
                <Trophy className="w-12 h-12 mb-4 text-zinc-700" />
                <p className="font-mono uppercase tracking-[0.3em] text-zinc-600">Awaiting Results</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {general.map((entry, index) => {
                  const teamColor = entry.color || "#6366f1";
                  const teamName = entry.name || entry.team_name || entry.team || "Unknown Team";
                  const isFirst = index === 0;

                  // ⚡ PURE MODERN HERO CARD (Takes exactly 2 grid rows)
                  if (isFirst) {
                    return (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="row-span-2 w-full rounded-3xl relative overflow-hidden flex flex-col justify-between p-6 lg:p-8 bg-[#0a0a0a] border border-zinc-800 shadow-2xl"
                      >
                        {/* High-End Accent Line */}
                        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: teamColor }} />

                        {/* Top Info */}
                        <div className="flex justify-between items-center w-full">
                          <div className="px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-2">
                            <Crown className="w-4 h-4" style={{ color: teamColor }} />
                            <span className="font-bold text-[10px] lg:text-xs tracking-[0.2em] uppercase text-zinc-300">Current Leader</span>
                          </div>
                          <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: teamColor, boxShadow: `0 0 15px ${teamColor}` }} />
                        </div>

                        {/* Flex Alignment prevents clipping */}
                        <div className="flex items-end justify-between w-full mt-auto">
                          <h3 className="text-5xl lg:text-[5rem] font-black uppercase tracking-tight text-white leading-none truncate w-[70%] pr-4">
                            {teamName}
                          </h3>
                          <div className="flex flex-col items-end shrink-0">
                            <motion.span 
                              key={entry.total_points}
                              className="text-6xl lg:text-[6.5rem] font-black tabular-nums tracking-tighter leading-none text-white"
                            >
                              {entry.total_points}
                            </motion.span>
                            <span className="text-xs lg:text-sm font-bold uppercase text-zinc-500 tracking-[0.3em] mt-2">
                              Points
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // ⚡ RANKS 2, 3, 4: SLEEK LIST ROWS (Takes exactly 1 grid row each)
                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="row-span-1 w-full flex items-center justify-between px-6 lg:px-8 rounded-2xl bg-[#080808] border border-zinc-800/60"
                    >
                      <div className="flex items-center gap-4 lg:gap-6 w-full min-w-0">
                        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-black text-sm lg:text-lg text-zinc-500 bg-zinc-900 border border-zinc-800 shrink-0">
                          #{index + 1}
                        </div>
                        <span className="text-3xl lg:text-4xl font-black uppercase tracking-tight truncate w-full text-zinc-300">
                          {teamName}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-right shrink-0">
                        <motion.span 
                          key={entry.total_points}
                          className="text-4xl lg:text-5xl font-black tabular-nums tracking-tighter leading-none text-white"
                        >
                          {entry.total_points}
                        </motion.span>
                        <span className="text-[10px] lg:text-xs font-bold uppercase text-zinc-600 tracking-[0.2em] pt-2">
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
        <section className="flex flex-col w-full lg:w-[35%] h-full min-h-0">
          
          {/* STRICT HEADER HEIGHT (Identical to Left Side) */}
          <div className="h-10 lg:h-12 flex items-center gap-3 shrink-0 pl-2">
            <Zap className="w-6 h-6 text-zinc-500 shrink-0" />
            <h2 className="text-xl lg:text-2xl font-black uppercase tracking-widest text-zinc-400">
              Hifz Duel
            </h2>
          </div>

          {/* STRICT 2-ROW GRID: Automatically aligns bottom with the left side */}
          <div className="flex-1 grid grid-rows-2 gap-4 min-h-0 pb-2">
            {hifz.length === 0 ? (
              <div className="row-span-2 flex flex-col items-center justify-center opacity-50 bg-[#0a0a0a] border border-zinc-800 rounded-3xl">
                <Zap className="w-12 h-12 mb-4 text-zinc-700" />
                <p className="font-mono uppercase tracking-[0.3em] text-zinc-600">Awaiting Results</p>
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
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="row-span-1 w-full rounded-3xl flex flex-col items-center justify-center text-center relative overflow-hidden bg-[#0a0a0a] border border-zinc-800 p-6 shadow-xl"
                    >
                      {isFirst && (
                        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: teamColor }} />
                      )}

                      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                        <div className="px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 mb-4 lg:mb-6 text-[10px] font-bold tracking-[0.3em] uppercase text-zinc-400">
                          Rank #{index + 1}
                        </div>
                        
                        <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tight mb-2 w-full truncate text-white">
                          {teamName}
                        </h3>
                        
                        <motion.div 
                          key={entry.total_points} 
                          className="text-6xl lg:text-[6rem] font-black tabular-nums tracking-tighter leading-none mt-2 text-white"
                        >
                          {entry.total_points}
                        </motion.div>
                        
                        <p className="text-xs font-bold text-zinc-600 uppercase tracking-[0.4em] mt-3 lg:mt-4">
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