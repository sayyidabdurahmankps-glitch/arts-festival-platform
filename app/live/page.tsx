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
      <div className="fixed inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Dynamic Background Glow mapped to 1st Place */}
      <div
        className="fixed top-0 left-0 w-[100vw] h-[60vh] blur-[150px] sm:blur-[250px] opacity-20 transition-colors duration-1000 z-0 pointer-events-none"
        style={{ backgroundColor: general[0]?.color || "#4f46e5" }}
      />

      {/* --- BROADCAST HEADER --- */}
      <header className="relative z-10 w-full px-4 sm:px-8 lg:px-16 pt-8 sm:pt-12 pb-6 flex flex-col items-center justify-center shrink-0 gap-3 text-center">
        <div className="flex items-center gap-2 sm:gap-3 px-6 py-2 rounded-full bg-black/40 border border-white/5 backdrop-blur-md">
          <span className="flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 animate-pulse">
            <Radio className="w-2 h-2 sm:w-3 sm:h-3" />
          </span>
          <span className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] sm:tracking-[0.5em] text-zinc-300 font-bold">
            Live Broadcast Network
          </span>
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-[6.5rem] font-black tracking-tighter text-white uppercase leading-none drop-shadow-2xl">
          Essenza{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-zinc-400 to-zinc-700">
            Standings
          </span>
        </h1>
      </header>

      {/* --- PREMIUM E-SPORTS DASHBOARD --- */}
      <main className="flex-1 w-full max-w-[2400px] mx-auto flex flex-col lg:flex-row gap-6 lg:gap-10 p-4 sm:p-6 lg:p-10 relative z-10 lg:min-h-0 lg:pb-12">
        {/* 🟢 LEFT: GENERAL CHAMPIONSHIP */}
        <section className="flex flex-col w-full lg:w-[60%] xl:w-[65%] lg:min-h-0">
          <div className="h-12 lg:h-16 flex items-center gap-3 sm:gap-4 mb-3 lg:mb-6 shrink-0 pl-2">
            <Trophy className="w-8 h-8 lg:w-10 lg:h-10 text-yellow-500 shrink-0" />
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black uppercase tracking-widest text-white truncate pt-1 drop-shadow-md">
              General Championship
            </h2>
          </div>

          <div className="flex-1 flex flex-col gap-4 lg:gap-6 min-h-0">
            {general.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-xl">
                <Trophy className="w-16 h-16 mb-4 text-zinc-600" />
                <p className="font-mono text-sm uppercase tracking-[0.3em]">
                  Awaiting Results
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {general.map((entry, index) => {
                  const teamColor = entry.color || "#6366f1";
                  const teamName =
                    entry.name ||
                    entry.team_name ||
                    entry.team ||
                    "Unknown Team";
                  const isFirst = index === 0;

                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                      }}
                      className={`flex-1 min-h-0 flex items-center justify-between px-5 sm:px-8 lg:px-10 py-5 lg:py-0 rounded-2xl lg:rounded-[2rem] relative overflow-hidden transition-all duration-500 w-full group ${
                        isFirst
                          ? "bg-white/[0.05] border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
                          : "bg-black/60 border-white/5 hover:bg-white/[0.02]"
                      }`}
                      style={{ borderStyle: "solid", borderWidth: "1px" }}
                    >
                      {/* Tech Grid Internal Texture */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:12px_12px] opacity-20 pointer-events-none" />

                      {/* Glowing Neon Internal Core Line */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 lg:w-3"
                        style={{
                          backgroundColor: teamColor,
                          boxShadow: `0 0 30px ${teamColor}, 0 0 10px ${teamColor}`,
                        }}
                      />

                      {/* Gradient Fade Overlay */}
                      <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                          background: `linear-gradient(90deg, ${teamColor} 0%, transparent 40%)`,
                        }}
                      />

                      <div className="flex items-center gap-4 lg:gap-8 w-full min-w-0 z-10 relative">
                        <div
                          className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center font-black text-xl sm:text-3xl lg:text-4xl shadow-2xl shrink-0 border border-white/10"
                          style={{
                            backgroundColor: isFirst
                              ? teamColor
                              : "rgba(0,0,0,0.8)",
                            color: isFirst ? "#fff" : teamColor,
                            boxShadow: isFirst
                              ? `0 0 30px ${teamColor}80`
                              : "inset 0 0 20px rgba(0,0,0,1)",
                          }}
                        >
                          {isFirst ? (
                            <Crown className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                          ) : (
                            `#${index + 1}`
                          )}
                        </div>
                        <span
                          className={`text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight truncate w-full pr-2 ${isFirst ? "text-white" : "text-zinc-300"}`}
                        >
                          {teamName}
                        </span>
                      </div>

                      <div className="flex items-end gap-2 lg:gap-3 text-right shrink-0 z-10 relative">
                        <motion.span
                          key={entry.total_points}
                          initial={{ scale: 1.2, filter: "blur(4px)" }}
                          animate={{ scale: 1, filter: "blur(0px)" }}
                          className={`text-5xl sm:text-6xl lg:text-[6.5rem] font-black tabular-nums tracking-tighter leading-none ${isFirst ? "text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" : "text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500"}`}
                        >
                          {entry.total_points}
                        </motion.span>
                        <span className="text-sm lg:text-2xl font-black uppercase text-zinc-600 tracking-[0.3em] pb-1 lg:pb-2">
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
        <section className="flex flex-col w-full lg:w-[40%] xl:w-[35%] lg:min-h-0 mt-6 lg:mt-0">
          <div className="h-12 lg:h-16 flex items-center gap-3 sm:gap-4 mb-3 lg:mb-6 shrink-0 pl-2">
            <Zap className="w-8 h-8 lg:w-10 lg:h-10 text-indigo-400 shrink-0" />
            <h2 className="text-2xl lg:text-3xl xl:text-4xl font-black uppercase tracking-widest text-indigo-400 truncate pt-1 drop-shadow-md">
              Hifz Duel
            </h2>
          </div>

          <div className="flex-1 flex flex-col sm:flex-row lg:flex-col gap-4 lg:gap-6 min-h-0">
            {hifz.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 bg-black/60 border border-white/5 rounded-[2rem] backdrop-blur-xl">
                <Zap className="w-16 h-16 mb-4 text-indigo-800" />
                <p className="font-mono text-sm uppercase tracking-[0.3em] text-indigo-600">
                  Awaiting Results
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {hifz.map((entry, index) => {
                  const teamColor = entry.color || "#6366f1";
                  const teamName =
                    entry.name ||
                    entry.team_name ||
                    entry.team ||
                    "Unknown Team";

                  return (
                    <motion.div
                      key={entry.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 25,
                      }}
                      className="flex-1 min-h-0 w-full bg-black/60 backdrop-blur-3xl border border-white/5 rounded-2xl lg:rounded-[2.5rem] p-6 lg:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl group"
                    >
                      {/* Tech Grid Internal Texture */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:12px_12px] opacity-20 pointer-events-none" />

                      {/* Glowing Top Neon Line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-2 lg:h-3"
                        style={{
                          backgroundColor: teamColor,
                          boxShadow: `0 0 40px ${teamColor}, 0 0 10px ${teamColor}`,
                        }}
                      />

                      <div className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex items-center justify-center mb-4 sm:mb-6 relative z-10 shrink-0 bg-black/80">
                        <span
                          className="font-black text-xl sm:text-2xl lg:text-3xl"
                          style={{
                            color: teamColor,
                            textShadow: `0 0 20px ${teamColor}`,
                          }}
                        >
                          #{index + 1}
                        </span>
                      </div>

                      <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight relative z-10 mb-2 w-full truncate px-4">
                        {teamName}
                      </h3>

                      <motion.div
                        key={entry.total_points}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-6xl sm:text-7xl lg:text-[7.5rem] font-black tabular-nums tracking-tighter relative z-10 leading-none mt-2 text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 drop-shadow-2xl"
                      >
                        {entry.total_points}
                      </motion.div>
                      <p className="text-xs lg:text-lg font-black text-zinc-600 uppercase tracking-[0.4em] lg:tracking-[0.5em] mt-3 lg:mt-6 relative z-10">
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
