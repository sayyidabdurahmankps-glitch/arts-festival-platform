"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Swords,
  Lock,
  Medal,
  ShieldAlert,
  Crown,
  Activity,
  Loader2,
  ChevronDown,
  Check,
  TrendingUp,
} from "lucide-react";

// ==========================================
// 1. SUPABASE DATA HOOK
// ==========================================
function useTeamComparisonData() {
  const [allStats, setAllStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const { data, error } = await supabase
      .from("team_comparison_stats")
      .select("*");
    if (error) {
      console.error("Error fetching comparison stats:", error);
    } else if (data) {
      setAllStats(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();

    // ⚡ FIXED: .on() chained BEFORE .subscribe()
    const resultsChannel = supabase
      .channel("comparison-results-sync")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "results",
          filter: "status=eq.approved",
        },
        fetchStats,
      )
      .subscribe();

    const teamsChannel = supabase
      .channel("comparison-teams-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams" },
        fetchStats,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(resultsChannel);
      supabase.removeChannel(teamsChannel);
    };
  }, []);

  return { allStats, loading };
}

// ==========================================
// 2. SLEEK CUSTOM DROPDOWN COMPONENT
// ==========================================
function CustomTeamSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  activeColor,
}: {
  value: string;
  onChange: (val: string) => void;
  options: any[];
  placeholder: string;
  disabled?: boolean;
  activeColor?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.team === value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* TRIGGER BUTTON */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-[50px] sm:h-[60px] px-4 sm:px-5 bg-[#09090b] rounded-2xl flex items-center justify-between select-none transition-all duration-200 ${
          disabled
            ? "opacity-50 cursor-not-allowed border border-white/5 text-zinc-600"
            : "cursor-pointer hover:bg-[#121214] border border-white/10 text-white"
        }`}
        style={{
          borderBottomColor: activeColor && !disabled ? activeColor : undefined,
          borderBottomWidth: activeColor && !disabled ? "3px" : "1px",
        }}
      >
        <span
          className={`font-black text-sm sm:text-base md:text-lg uppercase tracking-wide truncate pr-4 ${!selectedOption ? "text-zinc-600" : "text-white"}`}
        >
          {selectedOption ? selectedOption.team : placeholder}
        </span>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {selectedOption && activeColor && !disabled && (
            <div
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] animate-in zoom-in duration-300"
              style={{ backgroundColor: activeColor }}
            />
          )}
          {disabled ? (
            <Lock className="text-zinc-700 w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <ChevronDown
              className={`text-zinc-400 w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            />
          )}
        </div>
      </div>

      {/* DROPDOWN MENU */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -5, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -5, scaleY: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 w-full mt-2 bg-[#09090b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[100] origin-top"
          >
            <div className="max-h-[240px] sm:max-h-[280px] overflow-y-auto dropdown-scrollbar p-1">
              {options.length === 0 ? (
                <div className="p-4 sm:p-5 text-center text-zinc-600 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                  No opponents available
                </div>
              ) : (
                options.map((opt) => {
                  const isSelected = value === opt.team;
                  const categoryName = ["Indigo", "Violet"].includes(opt.team)
                    ? "HIFZ CATEGORY"
                    : "GENERAL CATEGORY";

                  return (
                    <div
                      key={opt.team}
                      onClick={() => {
                        onChange(opt.team);
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-3 sm:p-4 rounded-xl cursor-pointer transition-all group mb-1 last:mb-0"
                      style={{
                        backgroundColor: isSelected
                          ? `${opt.color}15`
                          : "transparent",
                      }}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 truncate">
                        <div
                          className={`w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 rounded-full transition-opacity duration-300 ${isSelected ? "opacity-100 shadow-[0_0_8px_currentColor]" : "opacity-40 group-hover:opacity-100"}`}
                          style={{
                            backgroundColor: opt.color,
                            color: opt.color,
                          }}
                        />
                        <div className="flex flex-col truncate">
                          <span
                            className={`font-black uppercase tracking-wide text-sm sm:text-base leading-tight truncate transition-colors ${isSelected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`}
                          >
                            {opt.team}
                          </span>
                          <span className="text-[8px] sm:text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-0.5 truncate">
                            {categoryName}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check
                          className="w-4 h-4 sm:w-5 sm:h-5 animate-in zoom-in shrink-0 ml-2"
                          style={{ color: opt.color }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .dropdown-scrollbar::-webkit-scrollbar { width: 4px; sm:width: 6px; }
        .dropdown-scrollbar::-webkit-scrollbar-track { background: transparent; padding: 2px; }
        .dropdown-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 10px; }
        .dropdown-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #52525b; }
      `,
        }}
      />
    </div>
  );
}

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
export default function TeamComparison() {
  const { allStats, loading } = useTeamComparisonData();

  const [teamAName, setTeamAName] = useState("");
  const [teamBName, setTeamBName] = useState("");

  const getTeamGroup = (name: string) => {
    return ["Indigo", "Violet"].includes(name) ? "Hifz" : "General";
  };

  const teamA = useMemo(
    () => allStats.find((t) => t.team === teamAName),
    [teamAName, allStats],
  );
  const teamB = useMemo(
    () => allStats.find((t) => t.team === teamBName),
    [teamBName, allStats],
  );

  const availableForB = useMemo(() => {
    return allStats.filter(
      (t) =>
        t.team !== teamAName &&
        (!teamA || getTeamGroup(t.team) === getTeamGroup(teamA.team)),
    );
  }, [allStats, teamAName, teamA]);

  const sortedTeams = useMemo(() => {
    if (!teamA || !teamB) return [];
    const aTotal = teamA.total_points || 0;
    const bTotal = teamB.total_points || 0;
    return aTotal >= bTotal ? [teamA, teamB] : [teamB, teamA];
  }, [teamA, teamB]);

  const comparisonData = useMemo(() => {
    if (!teamA || !teamB) return [];
    return [
      {
        name: teamA.team,
        points: teamA.total_points || 0,
        color: teamA.color || "#6366f1",
      },
      {
        name: teamB.team,
        points: teamB.total_points || 0,
        color: teamB.color || "#a855f7",
      },
    ];
  }, [teamA, teamB]);

  const analysisText = useMemo(() => {
    if (!teamA || !teamB) return null;
    const ptsA = teamA.total_points || 0;
    const ptsB = teamB.total_points || 0;

    if (ptsA > ptsB)
      return (
        <>
          <span style={{ color: teamA.color }}>{teamA.team}</span> leads by a
          crushing {ptsA - ptsB} points.
        </>
      );
    if (ptsB > ptsA)
      return (
        <>
          <span style={{ color: teamB.color }}>{teamB.team}</span> leads by a
          crushing {ptsB - ptsA} points.
        </>
      );
    return "A brutal stalemate. Both teams are perfectly tied.";
  }, [teamA, teamB]);

  if (loading) {
    return (
      <div className="bg-[#050505] p-6 sm:p-12 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl border border-white/5 flex flex-col items-center justify-center min-h-[400px] sm:min-h-[500px]">
        <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500 animate-spin mb-4" />
        <p className="text-zinc-500 font-black uppercase tracking-widest text-[10px] sm:text-xs">
          Loading Combat Intelligence...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] p-5 sm:p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl border border-white/5 relative overflow-visible group w-full max-w-full">
      {/* Architectural Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3rem_3rem] md:bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] md:[mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none rounded-[2rem] md:rounded-[3.5rem]" />

      {/* Background glow when teams are selected */}
      {teamA && teamB && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen transition-all duration-1000 rounded-[2rem] md:rounded-[3.5rem]"
          style={{
            background: `linear-gradient(90deg, ${teamA.color} 0%, transparent 40%, transparent 60%, ${teamB.color} 100%)`,
          }}
        />
      )}

      {/* TEAM SELECTORS */}
      <div className="flex flex-col md:grid md:grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-6 mb-8 md:mb-12 relative z-50">
        {/* TEAM ALPHA SELECTOR */}
        <div className="w-full">
          <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2 pl-1">
            <Medal className="w-3 h-3" /> Team Alpha
          </label>
          <CustomTeamSelect
            value={teamAName}
            onChange={(val) => {
              setTeamAName(val);
              setTeamBName("");
            }}
            options={allStats}
            placeholder="Select Challenger..."
            activeColor={teamA?.color}
          />
        </div>

        {/* VS CIRCLE BADGE */}
        <div className="flex justify-center items-center py-2 md:py-0 md:h-full md:pb-2 md:mt-6 shrink-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#09090b] border border-white/10 flex items-center justify-center shadow-lg relative z-0">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-600" />
          </div>
        </div>

        {/* TEAM BRAVO SELECTOR */}
        <div className="w-full">
          <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2 pl-1">
            <ShieldAlert className="w-3 h-3" /> Team Bravo
          </label>
          <CustomTeamSelect
            value={teamBName}
            onChange={(val) => setTeamBName(val)}
            options={availableForB}
            placeholder={!teamAName ? "Locked" : "Select Opponent..."}
            disabled={!teamAName}
            activeColor={teamB?.color}
          />
        </div>
      </div>

      {teamA && teamB && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 space-y-6 sm:space-y-8"
        >
          {/* ⚡ DETAILED COMPARISON TABLE */}
          <div className="w-full overflow-x-auto custom-scrollbar bg-black/40 border border-white/5 rounded-[1.5rem] md:rounded-3xl backdrop-blur-md shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[650px] md:min-w-[700px]">
              <thead>
                <tr className="border-b border-white/10 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 bg-zinc-950/80">
                  <th className="py-4 md:py-5 px-4 md:px-6 w-12 md:w-16 text-center">
                    Rank
                  </th>
                  <th className="py-4 md:py-5 px-4 md:px-6">Faction</th>
                  <th className="py-4 md:py-5 px-3 md:px-4 text-center">
                    1st (G)
                  </th>
                  <th className="py-4 md:py-5 px-3 md:px-4 text-center">
                    2nd (S)
                  </th>
                  <th className="py-4 md:py-5 px-3 md:px-4 text-center">
                    Grade A
                  </th>
                  <th className="py-4 md:py-5 px-3 md:px-4 text-center">
                    Grade B
                  </th>
                  <th className="py-4 md:py-5 px-3 md:px-4 text-center">
                    Extra Pts
                  </th>
                  <th className="py-4 md:py-5 px-4 md:px-6 text-right text-indigo-400">
                    Total Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white">
                {sortedTeams.map((team, index) => {
                  const isLeader = index === 0;
                  const extraPts =
                    (team.bonus_points || 0) - (team.penalty_points || 0);

                  return (
                    <tr
                      key={team.team}
                      className={`transition-colors ${isLeader ? "bg-gradient-to-r from-yellow-500/10 to-transparent" : "hover:bg-white/5"}`}
                    >
                      <td className="py-3 md:py-4 px-4 md:px-6 text-center">
                        {isLeader ? (
                          <Crown className="w-4 h-4 md:w-5 md:h-5 mx-auto text-yellow-500 drop-shadow-md" />
                        ) : (
                          <span className="font-black text-zinc-500 text-sm">
                            2
                          </span>
                        )}
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6 font-black uppercase tracking-wide flex items-center gap-2 md:gap-3 text-sm md:text-base">
                        <div
                          className="w-2.5 h-2.5 md:w-3 md:h-3 shrink-0 rounded-full shadow-sm"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="truncate">{team.team}</span>
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4 text-center font-bold tabular-nums text-zinc-300 text-sm">
                        {team.gold || 0}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4 text-center font-bold tabular-nums text-zinc-300 text-sm">
                        {team.silver || 0}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4 text-center font-bold tabular-nums text-zinc-300 text-sm">
                        {team.grade_a || 0}
                      </td>
                      <td className="py-3 md:py-4 px-3 md:px-4 text-center font-bold tabular-nums text-zinc-300 text-sm">
                        {team.grade_b || 0}
                      </td>
                      <td
                        className={`py-3 md:py-4 px-3 md:px-4 text-center font-bold tabular-nums text-sm ${extraPts > 0 ? "text-emerald-400" : extraPts < 0 ? "text-red-400" : "text-zinc-500"}`}
                      >
                        {extraPts > 0 ? `+${extraPts}` : extraPts}
                      </td>
                      <td className="py-3 md:py-4 px-4 md:px-6 text-right font-black text-xl md:text-2xl tabular-nums text-white">
                        {team.total_points || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* INTELLIGENCE SUMMARY BAR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/40 border border-white/5 rounded-[1.5rem] p-3 sm:p-4 backdrop-blur-md">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="bg-white/10 p-2 rounded-xl shrink-0 hidden sm:block">
                <TrendingUp className="w-4 h-4 text-zinc-300" />
              </div>
              <p className="text-[10px] sm:text-xs md:text-sm font-bold text-white tracking-wide uppercase">
                {analysisText}
              </p>
            </div>
          </div>

          {/* ⚡ HEAD TO HEAD BAR CHART */}
          <div className="h-[250px] sm:h-[300px] md:h-[350px] bg-black/40 rounded-[1.5rem] md:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/5 flex items-center justify-center relative backdrop-blur-xl">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 20, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />

                <XAxis
                  dataKey="name"
                  tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: 900 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />

                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 12, fontWeight: 900 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  dx={-10}
                />

                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  contentStyle={{
                    backgroundColor: "rgba(5, 5, 5, 0.95)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontWeight: "bold",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: 16,
                    paddingRight: 16,
                  }}
                  itemStyle={{
                    color: "#ffffff",
                    fontWeight: 900,
                    fontSize: "14px",
                  }}
                  formatter={(val: any) => [`${val} Pts`, "SCORE"]}
                  labelStyle={{ display: "none" }}
                />

                <Bar
                  dataKey="points"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={100}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </div>
  );
}
