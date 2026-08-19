"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Trophy, Loader2, Crown, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedCounter from "@/components/AnimatedCounter";

// --- TYPES ---
type TeamStats = {
  id: string;
  name?: string;
  team_name?: string;
  team?: string;
  total_points: number;
  color?: string;
  rank?: number;
  isTie?: boolean;
  isFirst?: boolean;
};

// ⚡ RANKING ENGINE: Mathematically calculates true ranks and detects ties
const processRankings = (data: any[]): TeamStats[] => {
  let currentRank = 1;
  return data.map((item, index, arr) => {
    // Standard competition ranking (1st, 1st, 3rd, 4th)
    if (index > 0 && item.total_points < arr[index - 1].total_points) {
      currentRank = index + 1;
    }
    
    // Check if points match the previous OR next item in the array
    const isTie = 
      (index > 0 && item.total_points === arr[index - 1].total_points) ||
      (index < arr.length - 1 && item.total_points === arr[index + 1].total_points);
      
    return { 
      ...item, 
      rank: currentRank, 
      isTie, 
      isFirst: currentRank === 1 
    };
  });
};

export default function LiveProjector() {
  const [general, setGeneral] = useState<TeamStats[]>([]);
  const [hifz, setHifz] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);

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

      if (generalRes.data) setGeneral(processRankings(generalRes.data));
      if (hifzRes.data) setHifz(processRankings(hifzRes.data));
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
          
          <div className="h-10 lg:h-12 flex items-center gap-3 shrink-0 pl-2">
            <Trophy className="w-6 h-6 text-zinc-500" />
            <h2 className="text-xl lg:text-2xl font-black uppercase tracking-widest text-zinc-300">
              General Championship
            </h2>
          </div>
          
          <div className="flex-1 grid grid-rows-4 gap-4 min-h-0 pb-2">
            {general.length === 0 ? (
              <div className="row-span-4 flex flex-col items-center justify-center opacity-50 bg-[#0a0a0a] border border-zinc-800 rounded-3xl">
                <Trophy className="w-12 h-12 mb-4 text-zinc-700" />
                <p className="font-mono uppercase tracking-[0.3em] text-zinc-600">Awaiting Results</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {general.map((entry) => {
                  const teamColor = entry.color || "#6366f1";
                  const teamName = entry.name || entry.team_name || entry.team || "Unknown Team";

                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="row-span-1 w-full rounded-[2rem] relative overflow-hidden flex items-center justify-between p-6 lg:p-8 bg-[#0a0a0a] border border-zinc-800 shadow-xl"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: teamColor }} />

                      <div className="flex items-center gap-5 lg:gap-8 w-full min-w-0">
                        {/* ⚡ THE DYNAMIC RANK BADGE */}
                        <div 
                          className={`border-2 bg-black flex flex-col items-center justify-center shrink-0 shadow-lg transition-all duration-300 ${
                            entry.isTie 
                              ? 'w-16 h-16 lg:w-20 lg:h-[4.5rem] rounded-[1rem] lg:rounded-[1.25rem] gap-0.5' 
                              : 'w-12 h-12 lg:w-16 lg:h-16 rounded-full'
                          }`}
                          style={{ borderColor: teamColor }}
                        >
                          {entry.isFirst ? (
                            <Crown className="w-5 h-5 lg:w-7 lg:h-7" style={{ color: teamColor }} />
                          ) : (
                            <span className={`font-black ${entry.isTie ? 'text-lg lg:text-2xl' : 'text-xl lg:text-2xl'}`} style={{ color: teamColor }}>
                              #{entry.rank}
                            </span>
                          )}
                          {entry.isTie && (
                            <span className="font-black text-[9px] lg:text-[11px] tracking-[0.2em] uppercase leading-none" style={{ color: teamColor }}>
                              Tie
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          {entry.isFirst && (
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 flex items-center gap-1.5">
                                <Crown className="w-3 h-3" style={{ color: teamColor }} />
                                <span className="font-bold text-[8px] lg:text-[10px] tracking-[0.2em] uppercase text-zinc-300">
                                  {entry.isTie ? "Co-Leader" : "Current Leader"}
                                </span>
                              </div>
                            </div>
                          )}
                          <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tight text-white truncate w-full pr-4">
                            {teamName}
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-end gap-2 lg:gap-3 text-right shrink-0">
                        <div className="text-5xl lg:text-[5.5rem] font-black tabular-nums tracking-tighter leading-none text-white">
                          <AnimatedCounter value={entry.total_points} />
                        </div>
                        <span className="text-sm lg:text-lg font-bold uppercase text-zinc-600 tracking-[0.3em] pb-1 lg:pb-2">
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
          
          <div className="h-10 lg:h-12 flex items-center gap-3 shrink-0 pl-2">
            <Zap className="w-6 h-6 text-zinc-500 shrink-0" />
            <h2 className="text-xl lg:text-2xl font-black uppercase tracking-widest text-zinc-400">
              Hifz Duel
            </h2>
          </div>

          <div className="flex-1 grid grid-rows-2 gap-4 min-h-0 pb-2">
            {hifz.length === 0 ? (
              <div className="row-span-2 flex flex-col items-center justify-center opacity-50 bg-[#0a0a0a] border border-zinc-800 rounded-3xl">
                <Zap className="w-12 h-12 mb-4 text-zinc-700" />
                <p className="font-mono uppercase tracking-[0.3em] text-zinc-600">Awaiting Results</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {hifz.map((entry) => {
                  const teamColor = entry.color || "#6366f1";
                  const teamName = entry.name || entry.team_name || entry.team || "Unknown Team";

                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25 }}
                      className="row-span-1 w-full rounded-[2.5rem] flex flex-col items-center justify-center text-center relative overflow-hidden bg-[#0a0a0a] border border-zinc-800 p-6 shadow-xl"
                    >
                      <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: teamColor }} />

                      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                        {/* ⚡ THE DYNAMIC RANK BADGE */}
                        <div 
                          className={`border-2 bg-black flex flex-col items-center justify-center mb-4 lg:mb-6 shadow-lg transition-all duration-300 ${
                            entry.isTie 
                              ? 'w-16 h-16 lg:w-20 lg:h-[4.5rem] rounded-[1rem] lg:rounded-[1.25rem] gap-0.5' 
                              : 'w-12 h-12 lg:w-16 lg:h-16 rounded-full'
                          }`}
                          style={{ borderColor: teamColor }}
                        >
                          {entry.isFirst ? (
                            <Crown className="w-5 h-5 lg:w-7 lg:h-7" style={{ color: teamColor }} />
                          ) : (
                            <span className={`font-black ${entry.isTie ? 'text-lg lg:text-2xl' : 'text-xl lg:text-2xl'}`} style={{ color: teamColor }}>
                              #{entry.rank}
                            </span>
                          )}
                          {entry.isTie && (
                            <span className="font-black text-[9px] lg:text-[11px] tracking-[0.2em] uppercase leading-none" style={{ color: teamColor }}>
                              Tie
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tight mb-2 w-full truncate text-white">
                          {teamName}
                        </h3>
                        
                        <div className="text-6xl lg:text-[6.5rem] font-black tabular-nums tracking-tighter leading-none mt-2 text-white">
                          <AnimatedCounter value={entry.total_points} />
                        </div>
                        
                        <p className="text-sm font-bold text-zinc-600 uppercase tracking-[0.4em] mt-3 lg:mt-5">
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