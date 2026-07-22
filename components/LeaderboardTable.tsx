"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ==========================================
// 1. TYPES
// ==========================================
type TeamScore = {
  id: string; // Ensure id is required for keys
  team: string; // The view outputs 'team'
  name?: string; // Fallback
  total_points: number;
  color: string;
  category_name?: string;
  category_group?: string;
};

// ==========================================
// 2. SUPABASE DATA HOOK
// ==========================================
function useLiveLeaderboardData(categoryFilter?: string) {
  const [data, setData] = useState<TeamScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    try {
      // ⚡ Fetch directly from the view
      let query = supabase
        .from("team_leaderboard")
        .select("*")
        .order("total_points", { ascending: false });

      if (categoryFilter) {
        query = query.eq("category_group", categoryFilter);
      }

      const { data: dbData, error } = await query;

      if (error) {
        console.error("Leaderboard Fetch Error:", error);
      } else if (dbData) {
        // Log the data to verify it's arriving
        console.log("Fetched Leaderboard Data:", dbData);
        setData(dbData as TeamScore[]);
      }
    } catch (err) {
      console.error("Unexpected error fetching leaderboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // ⚡ Listen to the underlying tables that feed the view
    const resultsChannel = supabase
      .channel(`table-results-sync-${categoryFilter || "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "results",
          filter: "status=eq.approved",
        },
        fetchLeaderboard,
      )
      .subscribe();

    const teamsChannel = supabase
      .channel(`table-teams-sync-${categoryFilter || "all"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        fetchLeaderboard,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(teamsChannel);
    };
  }, [categoryFilter]);

  return { data, loading };
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function LeaderboardTable({
  data: providedData,
  categoryFilter,
}: {
  data?: TeamScore[];
  categoryFilter?: "General" | "Hifz";
}) {
  const { data: liveData, loading } = useLiveLeaderboardData(
    providedData ? undefined : categoryFilter,
  );
  const activeData = providedData || liveData;

  // ⚡ DENSE RANKING ENGINE (Handles Ties)
  const rankedData = useMemo(() => {
    if (!activeData || activeData.length === 0) return [];

    // Sort descending
    const sorted = [...activeData].sort(
      (a, b) => (b.total_points || 0) - (a.total_points || 0),
    );

    let currentRank = 1;
    let prevPoints: number | null = null;

    const ranked = sorted.map((team) => {
      if (prevPoints !== null && team.total_points < prevPoints) {
        currentRank++;
      }
      prevPoints = team.total_points;
      return { ...team, rank: currentRank };
    });

    // Determine if a rank is shared
    const rankCounts = ranked.reduce(
      (acc, t) => {
        acc[t.rank] = (acc[t.rank] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );

    return ranked.map((t) => ({ ...t, isTie: rankCounts[t.rank] > 1 }));
  }, [activeData]);

  if (!providedData && loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 border border-white/5 rounded-[2.5rem]">
        <Loader2 className="w-10 h-10 text-indigo-500 mb-4 animate-spin" />
        <p className="text-center font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
          Syncing Leaderboard...
        </p>
      </div>
    );
  }

  if (!rankedData || rankedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 border border-white/5 rounded-[2.5rem]">
        <Award className="w-10 h-10 text-zinc-600 mb-4 animate-pulse" />
        <p className="text-center font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
          Awaiting Live Results...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/40 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5 backdrop-blur-xl relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[600px] flex flex-col">
          {/* ⚡ HEADER */}
          <div className="grid grid-cols-[100px_1fr_120px] gap-4 bg-black/40 text-zinc-500 uppercase text-[10px] tracking-[0.2em] font-black border-b border-white/5 py-5 px-8">
            <div className="text-center">Rank</div>
            <div>Team Node</div>
            <div className="text-right">Total Score</div>
          </div>

          {/* ⚡ BODY */}
          <div className="relative flex flex-col text-white">
            <AnimatePresence mode="popLayout">
              {rankedData.map((team) => {
                const isFirst = team.rank === 1;
                const isSecond = team.rank === 2;
                const isThird = team.rank === 3;

                const displayName = team.name || team.team || "Unknown Team";
                const displayCategory =
                  team.category_group || team.category_name || "";

                // ⚡ UNBREAKABLE KEY
                const animationKey = team.id || displayName;

                return (
                  <motion.div
                    key={animationKey}
                    layout="position"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    className={`grid grid-cols-[100px_1fr_120px] items-center gap-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors py-5 px-8 relative z-10 ${isFirst ? "bg-white/5" : ""}`}
                  >
                    {/* Rank Column */}
                    <div className="flex justify-center">
                      <div
                        className={`w-12 h-12 flex flex-col items-center justify-center rounded-2xl font-black text-lg shadow-inner ${
                          isFirst
                            ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                            : isSecond
                              ? "bg-zinc-300/10 text-zinc-300 border border-zinc-300/20"
                              : isThird
                                ? "bg-amber-700/20 text-amber-500 border border-amber-700/30"
                                : "bg-black/50 text-zinc-600 border border-white/5"
                        }`}
                      >
                        {isFirst ? (
                          <>
                            <Trophy className="w-5 h-5 drop-shadow-md" />
                            {team.isTie && (
                              <span className="text-[6px] uppercase tracking-widest mt-0.5 opacity-80 leading-none">
                                Tie
                              </span>
                            )}
                          </>
                        ) : isSecond ? (
                          <>
                            <Medal className="w-5 h-5" />
                            {team.isTie && (
                              <span className="text-[6px] uppercase tracking-widest mt-0.5 opacity-80 leading-none">
                                Tie
                              </span>
                            )}
                          </>
                        ) : isThird ? (
                          <>
                            <Award className="w-5 h-5" />
                            {team.isTie && (
                              <span className="text-[6px] uppercase tracking-widest mt-0.5 opacity-80 leading-none">
                                Tie
                              </span>
                            )}
                          </>
                        ) : (
                          `#${team.rank}`
                        )}
                      </div>
                    </div>

                    {/* Team Name Column */}
                    <div className="flex items-center gap-4 truncate">
                      <div className="relative flex items-center justify-center shrink-0">
                        <span
                          className="absolute w-8 h-8 rounded-full opacity-20 animate-pulse"
                          style={{ backgroundColor: team.color || "#cccccc" }}
                        ></span>
                        <span
                          className="w-4 h-4 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] z-10"
                          style={{ backgroundColor: team.color || "#cccccc" }}
                        ></span>
                      </div>
                      <div className="truncate">
                        <p
                          className={`font-black uppercase tracking-tight text-xl truncate ${isFirst ? "text-white" : "text-zinc-300"}`}
                        >
                          {displayName}
                        </p>
                        {displayCategory && (
                          <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1 truncate">
                            {displayCategory}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Points Column */}
                    <div className="flex flex-col items-end">
                      <motion.span
                        key={team.total_points}
                        initial={{ color: team.color, scale: 1.2 }}
                        animate={{
                          color: isFirst ? "#eab308" : "#ffffff",
                          scale: 1,
                        }}
                        className="font-black text-3xl tabular-nums tracking-tighter leading-none"
                      >
                        {team.total_points}
                      </motion.span>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mt-1">
                        PTS
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
