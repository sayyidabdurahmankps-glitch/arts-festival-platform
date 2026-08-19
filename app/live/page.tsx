"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Zap, Trophy, Loader2, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type TeamStats = {
  id: string;
  name?: string;
  team?: string;
  total_points: number;
  color: string;
  category_group: string;
};

export default function LiveProjector() {
  const [general, setGeneral] = useState<TeamStats[]>([]);
  const [hifz, setHifz] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    // ⚡ FIXED: Now matches your actual Supabase view and columns
    const { data, error } = await supabase
      .from("team_leaderboard")
      .select("*")
      .order("total_points", { ascending: false });

    if (error) {
      console.error("Live Projector Fetch Error:", error.message);
    }

    if (data) {
      // ⚡ FIXED: Filtering by category_group instead of category_name
      setGeneral(data.filter((d) => d.category_group !== "Hifz").slice(0, 4));
      setHifz(data.filter((d) => d.category_group === "Hifz").slice(0, 2));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
    const channel = supabase
      .channel("live-projector")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        () => fetchLeaderboard(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 p-4 text-center">
        <Loader2 className="w-16 h-16 md:w-20 md:h-20 text-indigo-500 animate-spin" />
        <p className="text-zinc-500 font-mono text-sm md:text-xl uppercase tracking-[0.4em] animate-pulse">
          Initializing Projector Array...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 flex flex-col relative overflow-x-hidden">
      {/* Background Ambience */}
      <div
        className="fixed top-1/2 left-1/2 lg:left-1/3 -translate-x-1/2 -translate-y-1/2 w-[150vw] md:w-[1000px] h-[150vw] md:h-[1000px] blur-[150px] md:blur-[250px] pointer-events-none transition-colors duration-1000 z-0"
        style={{
          backgroundColor:
            general.length > 0
              ? `${general[0].color}15`
              : "rgba(79,70,229,0.1)",
        }}
      />
      <div className="fixed top-1/2 right-0 -translate-y-1/2 w-[100vw] md:w-[600px] h-[100vw] md:h-[600px] blur-[100px] md:blur-[200px] pointer-events-none bg-purple-600/10 z-0" />

      {/* ⚡ HEADER ALIGNMENT */}
      <div className="text-center pt-8 md:pt-12 pb-6 md:pb-8 relative z-10 flex flex-col sm:flex-row justify-between items-center sm:items-end gap-4 px-6 md:px-12 w-full max-w-[1920px] mx-auto">
        <h1 className="text-4xl sm:text-5xl lg:text-[5rem] leading-none font-black tracking-tighter text-white drop-shadow-2xl flex flex-wrap justify-center sm:justify-start items-center gap-3 lg:gap-5 uppercase">
          LIVE{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">
            STANDINGS
          </span>
        </h1>
        <div className="flex items-center gap-2 md:gap-3 px-5 py-2 md:px-6 md:py-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs md:text-sm font-black uppercase tracking-widest md:tracking-[0.3em] backdrop-blur-md animate-pulse shrink-0">
          <Zap className="w-4 h-4 md:w-5 md:h-5" /> Broadcast Active
        </div>
      </div>

      {/* ⚡ PERFECT ALIGNMENT WRAPPER */}
      <div className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 md:px-12 pb-12 flex flex-col lg:flex-row items-stretch gap-8 lg:gap-12 relative z-10">
        {/* 🟢 LEFT PANE: GENERAL CHAMPIONSHIP */}
        <div className="flex flex-col w-full lg:w-[65%] min-w-0">
          <div className="h-12 md:h-16 flex items-center gap-3 md:gap-4 px-2 mb-4 md:mb-6 shrink-0">
            <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-500 shrink-0" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-widest text-zinc-300 truncate">
              General Championship
            </h2>
          </div>

          <div className="flex-1 grid grid-rows-4 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {general.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className={`w-full h-full flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 md:p-6 lg:p-8 rounded-2xl md:rounded-[2.5rem] transform transition-all duration-500 backdrop-blur-xl relative overflow-hidden ${index === 0 ? "bg-[#0a0a0a] border-2 lg:scale-[1.02] z-20 shadow-2xl" : "bg-black/40 border border-white/5 z-10"}`}
                  style={{
                    borderColor:
                      index === 0 ? entry.color : "rgba(255,255,255,0.05)",
                    boxShadow:
                      index === 0 ? `0 20px 80px ${entry.color}30` : "none",
                  }}
                >
                  <div
                    className="absolute left-0 top-0 bottom-0 w-2 md:w-3 opacity-90"
                    style={{ backgroundColor: entry.color }}
                  />

                  <div className="flex items-center gap-4 md:gap-6 pl-2 md:pl-4 w-full sm:w-auto min-w-0">
                    <div
                      className={`w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 flex items-center justify-center rounded-xl md:rounded-2xl lg:rounded-3xl font-black text-xl md:text-2xl lg:text-4xl shadow-inner shrink-0`}
                      style={{
                        backgroundColor:
                          index === 0 ? entry.color : "rgba(0,0,0,0.5)",
                        color: index === 0 ? "#fff" : entry.color,
                      }}
                    >
                      {index === 0 ? (
                        <Crown className="w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10" />
                      ) : (
                        `#${index + 1}`
                      )}
                    </div>
                    {/* ⚡ SAFELY EXTRACT TEAM NAME */}
                    <span
                      className={`text-2xl md:text-4xl lg:text-[3.5rem] leading-none font-black tracking-tight uppercase truncate ${index === 0 ? "text-white" : "text-zinc-200"}`}
                    >
                      {entry.name || entry.team}
                    </span>
                  </div>

                  <div className="flex sm:block items-end justify-between w-full sm:w-auto border-t border-white/5 sm:border-0 pt-4 sm:pt-0 mt-3 sm:mt-0 text-right shrink-0">
                    <span className="sm:hidden text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">
                      Total Points
                    </span>
                    <div>
                      <motion.div
                        key={entry.total_points}
                        initial={{ scale: 1.2, color: entry.color }}
                        animate={{
                          scale: 1,
                          color: index === 0 ? "#fff" : "#d4d4d8",
                        }}
                        className="text-4xl md:text-5xl lg:text-[4.5rem] leading-none font-black tabular-nums tracking-tighter"
                      >
                        {entry.total_points}
                      </motion.div>
                      <span className="hidden sm:block text-sm lg:text-xl font-black uppercase text-zinc-600 tracking-[0.3em] lg:tracking-[0.4em] mt-1">
                        PTS
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 🟣 RIGHT PANE: HIFZ DUEL */}
        <div className="flex flex-col w-full lg:w-[35%] min-w-0 border-t border-white/10 lg:border-t-0 pt-8 lg:pt-0 lg:border-l lg:border-white/10 lg:pl-12">
          <div className="h-12 md:h-16 flex items-center gap-3 md:gap-4 px-2 mb-4 md:mb-6 shrink-0">
            <Zap className="w-8 h-8 md:w-10 md:h-10 text-indigo-400 shrink-0" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black uppercase tracking-widest text-indigo-400 truncate">
              Hifz Duel
            </h2>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 lg:grid-rows-2 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {hifz.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className="w-full h-full bg-indigo-950/20 border border-indigo-500/20 rounded-2xl md:rounded-[3rem] p-6 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-xl"
                >
                  {index === 0 && (
                    <div
                      className="absolute inset-0 opacity-20 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at center, ${entry.color}, transparent 70%)`,
                      }}
                    />
                  )}

                  <div
                    className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-full border-[3px] md:border-4 shadow-2xl flex items-center justify-center mb-4 md:mb-6 relative z-10 shrink-0"
                    style={{
                      borderColor: entry.color,
                      backgroundColor: "rgba(0,0,0,0.5)",
                    }}
                  >
                    <span
                      className="font-black text-xl md:text-2xl lg:text-3xl"
                      style={{ color: entry.color }}
                    >
                      #{index + 1}
                    </span>
                  </div>

                  {/* ⚡ SAFELY EXTRACT TEAM NAME */}
                  <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-white uppercase tracking-tight relative z-10 mb-2 md:mb-4 truncate w-full px-2">
                    {entry.name || entry.team}
                  </h3>

                  <motion.div
                    key={entry.total_points}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-5xl md:text-6xl lg:text-[5.5rem] leading-none font-black tabular-nums tracking-tighter text-white relative z-10"
                  >
                    {entry.total_points}
                  </motion.div>
                  <p className="text-xs md:text-sm lg:text-lg font-black text-zinc-500 uppercase tracking-[0.3em] lg:tracking-[0.4em] mt-2 relative z-10 shrink-0">
                    Points
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
