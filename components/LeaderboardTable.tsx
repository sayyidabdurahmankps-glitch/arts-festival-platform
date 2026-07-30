"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// ==========================================
// 1. TYPES
// ==========================================
type TeamScore = {
  id: string; 
  team: string; 
  name?: string; 
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
      // ⚡ Fetch directly from the view with calculated bonus/penalties
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
    <div className="w-full space-y-4">
      <AnimatePresence mode="popLayout">
        {rankedData.map((team, index) => {
          const isFirst = team.rank === 1;
          const isSecond = team.rank === 2;
          const isThird = team.rank === 3;

          const displayName = team.name || team.team || "Unknown Team";
          const displayCategory = team.category_group || team.category_name || "";

          // ⚡ UNBREAKABLE KEY
          const animationKey = team.id || displayName;

          return (
            <motion.div
              key={animationKey}
              layout="position"
              initial={{ opacity: 0, scale: 0.95, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 350,
                damping: 30,
                delay: index * 0.05, 
              }}
              // ⚡ MOBILE RESPONSIVE CARD LAYOUT
              className={`relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 rounded-2xl sm:rounded-[2rem] border backdrop-blur-md overflow-hidden transition-all gap-4 sm:gap-0 ${
                isFirst
                  ? "bg-[#0a0a0a]/90 shadow-2xl z-20"
                  : "bg-black/40 border-white/5 hover:bg-white/[0.02] z-10"
              }`}
              style={{
                borderColor: isFirst ? team.color : undefined,
                boxShadow: isFirst ? `0 0 30px ${team.color}25` : undefined,
              }}
            >
              {/* Dynamic Color Accent Line */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 sm:w-2 opacity-90"
                style={{ backgroundColor: team.color }}
              />

              <div className="flex items-center gap-4 md:gap-5 pl-2 sm:pl-3 w-full sm:w-auto border-b border-white/5 pb-4 sm:border-0 sm:pb-0">
                {/* ⚡ RANK BADGES (Gold, Silver, Bronze) */}
                <div
                  className={`w-12 h-12 md:w-14 md:h-14 flex flex-col items-center justify-center rounded-[1rem] md:rounded-2xl font-black text-lg md:text-xl shadow-inner shrink-0 leading-none ${
                    isFirst
                      ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30"
                      : isSecond
                        ? "bg-zinc-300/10 text-zinc-300 border border-zinc-300/20"
                        : isThird
                          ? "bg-amber-700/20 text-amber-500 border border-amber-700/30"
                          : "bg-black/50 text-zinc-500 border border-white/5"
                  }`}
                >
                  {isFirst ? (
                    <Trophy className="w-5 h-5 md:w-6 md:h-6 drop-shadow-md" />
                  ) : isSecond ? (
                    <Medal className="w-5 h-5 md:w-6 md:h-6" />
                  ) : isThird ? (
                    <Award className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <span>#{team.rank}</span>
                  )}
                  
                  {/* Tie Indicator */}
                  {team.isTie && (
                    <span className="text-[5px] sm:text-[6px] uppercase tracking-widest mt-1 opacity-90">
                      Tie
                    </span>
                  )}
                </div>

                <div className="truncate">
                  <h4
                    className={`text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight truncate ${
                      isFirst ? "text-white" : "text-zinc-200"
                    }`}
                  >
                    {displayName}
                  </h4>
                  {displayCategory && (
                    <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1 truncate">
                      {displayCategory}
                    </p>
                  )}
                </div>
              </div>

              {/* Points Display */}
              <div className="w-full sm:w-auto flex items-center justify-between sm:block pl-2 sm:pl-0 sm:text-right">
                <p className="sm:hidden text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">
                  Total Points
                </p>
                <div className="text-right flex flex-col items-end">
                  <motion.span
                    key={team.total_points}
                    initial={{ color: team.color, scale: 1.2 }}
                    animate={{
                      color: isFirst ? "#eab308" : "#ffffff", // Gold if 1st, White otherwise
                      scale: 1,
                    }}
                    className="font-black text-3xl md:text-4xl tabular-nums tracking-tighter leading-none block"
                  >
                    {team.total_points}
                  </motion.span>
                  <span className="hidden sm:block text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1 md:mt-2">
                    PTS
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}