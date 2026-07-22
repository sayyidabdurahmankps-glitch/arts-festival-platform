"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { TypeAnimation } from "react-type-animation";
import {
  Trophy,
  Zap,
  TrendingUp,
  Award,
  Rocket,
  Activity,
  Crown,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Core Components
import Countdown from "@/components/Countdown";
import StatsSection from "@/components/StatsSection";
import TeamChart from "@/components/TeamChart";
import TeamComparison from "@/components/TeamComparison";
import CategoryToppers from "@/components/CategoryToppers";
import Footer from "@/components/Footer";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    general: [],
    hifz: [],
    compStats: [],
    toppers: [],
    stats: { participants: 0, events: 0, hifz: 0, points: 0 },
  });

  const fetchAllData = async () => {
    const [generalRes, hifzRes, compRes, toppersRes, pCount, eCount, pSum] =
      await Promise.all([
        supabase
          .from("category_leaderboard")
          .select("*")
          .neq("category_name", "Hifz")
          .order("total_points", { ascending: false }),
        supabase
          .from("category_leaderboard")
          .select("*")
          .eq("category_name", "Hifz")
          .order("total_points", { ascending: false }),
        supabase.from("team_comparison_stats").select("*"),
        supabase.from("category_toppers").select("*"),
        supabase
          .from("participants")
          .select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("results").select("points").eq("status", "approved"),
      ]);

    setData({
      general: generalRes.data || [],
      hifz: hifzRes.data || [],
      compStats: compRes.data || [],
      toppers: toppersRes.data || [],
      stats: {
        participants: pCount.count || 0,
        events: eCount.count || 0,
        hifz: hifzRes.data?.length || 0,
        points:
          pSum.data?.reduce((acc: number, curr: any) => acc + curr.points, 0) ||
          0,
      },
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();

    // ⚡ REAL-TIME SYNC: Listen to BOTH tables so Admin updates show up instantly!
    const resultsChannel = supabase
      .channel("homepage-results-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results", filter: "status=eq.approved" },
        () => {
          fetchAllData();
        },
      )
      .subscribe();

    const teamsChannel = supabase
      .channel("homepage-teams-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        () => {
          fetchAllData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(teamsChannel);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-zinc-400 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden relative">
      {/* Global Ambient Glow */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto mt-24 space-y-32 w-full px-6 pb-20 relative z-10">
        {/* --- 1. HERO SECTION (Animated) --- */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center space-y-8 py-24 bg-zinc-900/30 border border-white/5 rounded-[3rem] shadow-2xl relative overflow-hidden backdrop-blur-3xl"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          <div className="flex items-center justify-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              Live Stadium Feed
            </span>
          </div>

          <div className="flex items-center justify-center min-h-[120px] w-full relative z-10">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 drop-shadow-sm">
              <TypeAnimation
                sequence={[
                  "SYNERGY.",
                  1500,
                  "ARTISTRY.",
                  1500,
                  "LEGACY.",
                  3000,
                ]}
                wrapper="span"
                speed={50}
                repeat={0}
              />
            </h1>
          </div>

          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed relative z-10 font-medium">
            The ultimate battle of minds. Track live scores, view schedules, and
            cheer for your favorite teams in real-time.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-8 relative z-10">
            <Link
              href="#leaderboard"
              className="bg-indigo-600 text-white font-black uppercase tracking-widest text-xs px-10 py-4 rounded-full hover:bg-indigo-500 transition-all hover:scale-105 shadow-[0_0_30px_rgba(79,70,229,0.4)] flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" /> Live Leaderboard
            </Link>
            <Link
              href="/search"
              className="bg-white/5 text-zinc-300 border border-white/10 font-black uppercase tracking-widest text-xs px-10 py-4 rounded-full hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Find Participant
            </Link>
          </div>
        </motion.div>

        {/* --- 2. LIVE COUNTDOWN --- */}
        <section className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-purple-600/30 rounded-[3rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
          <div className="relative bg-[#0a0a0a]/80 border border-white/10 rounded-[3rem] p-10 sm:p-20 text-center shadow-2xl overflow-hidden backdrop-blur-xl">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-black uppercase tracking-[0.3em] mb-10 shadow-inner">
                <Rocket className="w-4 h-4" /> Grand Result Declaration
              </span>
              <Countdown targetDate="2026-09-23T19:00:00" />
            </div>
          </div>
        </section>

        {/* --- 3. LIVE STATS --- */}
        <section>
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                Fest by <span className="text-indigo-500 italic">Numbers</span>
              </h2>
              <p className="text-zinc-500 font-medium mt-2 text-sm uppercase tracking-widest flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Server Synchronization
              </p>
            </div>
          </div>
          <StatsSection stats={data.stats} />
        </section>

        {/* --- 4. DUAL LEADERBOARD --- */}
        <section
          id="leaderboard"
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* 🟢 GENERAL CHAMPIONSHIP (Animated Racing Leaderboard) */}
          <div className="lg:col-span-2 bg-zinc-900/40 p-8 sm:p-12 rounded-[3.5rem] shadow-2xl border border-white/5 backdrop-blur-xl relative overflow-hidden">
            {/* Subtle glow behind the racing cards */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-indigo-500/5 blur-[100px] pointer-events-none" />

            <div className="flex items-center justify-between mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black/50 border border-white/10 rounded-2xl shadow-inner">
                  <Trophy className="text-yellow-500 w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tighter text-white">
                    General Championship
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">
                    Live Position Tracking
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 relative z-10 flex flex-col">
              {loading ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-white/5 rounded-3xl w-full"
                    />
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {data.general.map((team: any, index: number) => {
                    const animationKey = team.id || team.name || team.team || index;
                    
                    return (
                      <motion.div
                        key={animationKey}
                        layout="position" // ⚡ Critical Framer Motion Fix
                        initial={{ opacity: 0, scale: 0.95, x: -20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 30,
                        }}
                        className={`relative flex items-center justify-between p-5 sm:p-6 rounded-[2rem] border backdrop-blur-md overflow-hidden transition-all ${index === 0 ? "bg-[#0a0a0a]/90 shadow-2xl z-10" : "bg-black/40 border-white/5 z-0"}`}
                        style={{
                          borderColor: index === 0 ? team.color : undefined,
                          boxShadow:
                            index === 0 ? `0 0 40px ${team.color}30` : undefined,
                        }}
                      >
                        {/* Dynamic Color Accent Line */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-2 opacity-90"
                          style={{ backgroundColor: team.color }}
                        />

                        <div className="flex items-center gap-5 pl-3">
                          {/* Rank Circle */}
                          <div
                            className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner shrink-0"
                            style={{
                              backgroundColor:
                                index === 0 ? team.color : "#18181b",
                              color: index === 0 ? "#fff" : team.color,
                            }}
                          >
                            {index === 0 ? (
                              <Crown className="w-6 h-6 text-white drop-shadow-md" />
                            ) : (
                              `#${index + 1}`
                            )}
                          </div>

                          <div>
                            <h4
                              className={`text-xl sm:text-2xl font-black uppercase tracking-tight ${index === 0 ? "text-white" : "text-zinc-200"}`}
                            >
                              {team.name || team.team}
                            </h4>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">
                              Team Contender
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <motion.span
                            key={team.total_points}
                            initial={{ color: team.color, scale: 1.2 }}
                            animate={{
                              color: index === 0 ? "#ffffff" : "#d4d4d8",
                              scale: 1,
                            }}
                            className="text-3xl sm:text-5xl font-black tabular-nums tracking-tighter"
                          >
                            {team.total_points}
                          </motion.span>
                          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-1">
                            Total Pts
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* 🟣 HIFZ SPECIAL CATEGORY (Glowing Card + Chart) */}
          <div className="bg-indigo-950/20 p-8 sm:p-12 rounded-[3.5rem] shadow-2xl flex flex-col justify-between overflow-hidden relative border border-indigo-500/20 backdrop-blur-xl">
            <Zap className="absolute -top-10 -right-10 w-48 h-48 text-indigo-500/10 rotate-12 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-indigo-900/20 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4 text-indigo-400 border border-indigo-500/20 bg-indigo-500/10 w-fit px-3 py-1.5 rounded-lg shadow-inner">
                <Zap className="w-3 h-3 fill-current" />
                <span className="font-black uppercase tracking-widest text-[9px]">
                  Special Category
                </span>
              </div>
              <h3 className="text-4xl font-black text-white tracking-tighter uppercase">
                Hifz Duel
              </h3>
            </div>

            <div className="h-[280px] mt-8 relative z-10 flex items-center justify-center">
              {loading ? (
                <div className="animate-pulse w-48 h-48 bg-indigo-900/30 rounded-full border-4 border-indigo-500/10"></div>
              ) : (
                <TeamChart data={data.hifz} type="pie" isDark={true} />
              )}
            </div>

            {/* Quick Summary under Pie Chart */}
            <div className="relative z-10 mt-6 grid grid-cols-2 gap-4">
              {data.hifz.slice(0, 2).map((h: any, i: number) => (
                <div
                  key={h.id || h.team}
                  className="bg-black/40 border border-white/5 p-3 rounded-xl text-center"
                >
                  <p
                    className="text-[10px] font-black uppercase tracking-widest text-zinc-500"
                    style={{ color: h.color }}
                  >
                    {h.name || h.team}
                  </p>
                  <p className="text-xl font-black text-white">
                    {h.total_points}{" "}
                    <span className="text-[8px] text-zinc-600 uppercase">
                      Pts
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- 5. LOGIC-LOCKED TEAM COMPARISON --- */}
        <section>
          <div className="mb-12 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/50 text-zinc-300 text-[10px] font-black uppercase tracking-widest mb-4 border border-white/10 shadow-inner">
              <TrendingUp className="w-3 h-3 text-indigo-400" /> Data
              Intelligence
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">
              Head-to-Head <span className="text-zinc-600">Stats</span>
            </h2>
            <p className="text-zinc-500 mt-3 font-medium text-sm md:text-base max-w-2xl mx-auto md:mx-0">
              Deep dive into the medal tally and performance distribution.
              General and Hifz categories remain completely separate for scoring
              integrity.
            </p>
          </div>
         <TeamComparison />
        </section>

        {/* --- 6. CATEGORY TOPPERS (Hall of Fame) --- */}
        <section id="toppers" className="relative">
          {/* Subtle background glow for Hall of Fame */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-yellow-500/5 blur-[120px] pointer-events-none rounded-[100%]" />

          <div className="text-center mb-16 relative z-10">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-black/80 border border-yellow-500/20 text-yellow-500 text-[10px] font-black uppercase tracking-[0.4em] mb-6 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
              <Award className="w-4 h-4" /> Hall of Fame
            </div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white uppercase">
              Category{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                Champions
              </span>
            </h2>
          </div>

          <div className="relative z-10">
            {loading ? (
              <div className="h-64 animate-pulse bg-zinc-900/30 border border-white/5 rounded-3xl backdrop-blur-xl"></div>
            ) : (
              <CategoryToppers toppers={data.toppers} />
            )}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}