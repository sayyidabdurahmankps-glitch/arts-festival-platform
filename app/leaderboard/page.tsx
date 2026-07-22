"use client"

import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Trophy, Loader2, Zap, Crown } from 'lucide-react';

// ==========================================
// ⚡ TYPES (Matched to Postgres View)
// ==========================================
type TeamScore = {
  id: string;
  name: string;             // Pulled from teams.name
  color: string;
  category_group: string;   // Pulled from teams.category_group
  total_points: number;     // Calculated by the View
};

// Extended type to hold calculated ranks
type RankedTeamScore = TeamScore & { 
  rank: number; 
  isTie: boolean;
};

export default function NextLevelLeaderboard() {
  const [rawData, setRawData] = useState<TeamScore[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    // ⚡ Target the live calculated View
    const { data, error } = await supabase
      .from('team_leaderboard')
      .select('*')
      .order('total_points', { ascending: false });
      
    if (error) {
      console.error("Leaderboard Fetch Error:", error.message);
      return;
    }
      
    if (data) {
      setRawData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const resultsChannel = supabase
      .channel('public-results-sync')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'results', filter: 'status=eq.approved' }, 
        fetchData
      )
      .subscribe();

    const teamsChannel = supabase
      .channel('public-teams-sync')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'teams' }, 
        fetchData
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(resultsChannel); 
      supabase.removeChannel(teamsChannel);
    };
  }, []);

  // ==========================================
  // ⚡ DENSE RANKING ENGINE
  // ==========================================
  const rankTeams = (teams: TeamScore[]): RankedTeamScore[] => {
    let currentRank = 1;
    let prevPoints: number | null = null;

    // First pass: Sort descending and assign dense ranks (1, 1, 2, 3)
    const sorted = [...teams].sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
    
    const ranked = sorted.map((team) => {
      if (prevPoints !== null && team.total_points < prevPoints) {
        currentRank++;
      }
      prevPoints = team.total_points;
      return { ...team, rank: currentRank, isTie: false };
    });

    // Second pass: Figure out if a rank is shared (so we can show the "TIE" badge)
    const rankCounts = ranked.reduce((acc, t) => {
      acc[t.rank] = (acc[t.rank] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return ranked.map(t => ({ ...t, isTie: rankCounts[t.rank] > 1 }));
  };

  // ⚡ APPLY RANKING TO GROUPS
  const generalTeams = useMemo(() => {
    const filtered = rawData.filter(d => d.category_group === 'General');
    return rankTeams(filtered);
  }, [rawData]);

  const hifzTeams = useMemo(() => {
    const filtered = rawData.filter(d => d.category_group === 'Hifz');
    return rankTeams(filtered);
  }, [rawData]);

  // ⚡ LOADING STATE
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">
        Syncing Championship Matrix...
      </p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-zinc-400 selection:bg-indigo-500/30 selection:text-indigo-200 overflow-hidden relative font-sans">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0" />

      <div className="max-w-5xl mx-auto py-16 md:py-24 px-4 sm:px-6 w-full relative z-10 space-y-24 md:space-y-32">
        
        {/* ⚡ HEADER */}
        <header className="text-center animate-in slide-in-from-top-10 duration-700">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl">
            Championship <span className="text-indigo-500 italic">Race</span>
          </h1>
          <div className="mt-6 md:mt-8 inline-flex justify-center items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 bg-indigo-500/10 px-5 py-2 rounded-full border border-indigo-500/20 shadow-xl backdrop-blur-sm">
            <TrendingUp className="w-3 h-3 md:w-4 md:h-4" />
            <span className="relative flex h-2 w-2 mx-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Live Feed Active
          </div>
        </header>

        {/* 🟢 GENERAL CHAMPIONSHIP */}
        <div>
          <div className="flex items-center gap-4 mb-8 md:mb-10">
            <div className="p-3 bg-black/50 border border-white/10 rounded-2xl shadow-inner">
              <Trophy className="text-yellow-500 w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white">General Championship</h2>
              <p className="text-[9px] md:text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Main Event Leaderboard</p>
            </div>
          </div>

          <div className="space-y-4 md:space-y-5">
            <AnimatePresence mode="popLayout">
              {generalTeams.map((team) => {
                const isLeader = team.rank === 1;
                const animationKey = team.id || team.name;

                return (
                  <motion.div
                    key={animationKey} 
                    layout="position" 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`relative flex flex-col sm:flex-row items-center justify-between p-5 sm:p-8 rounded-[2rem] border backdrop-blur-xl transition-all overflow-hidden ${isLeader ? "bg-[#0a0a0a] shadow-2xl z-20" : "bg-black/40 border-white/5 hover:bg-white/[0.02] z-10"}`}
                    style={{ 
                      borderColor: isLeader ? team.color : undefined, 
                      boxShadow: isLeader ? `0 0 40px ${team.color}25` : undefined 
                    }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 opacity-90" style={{ backgroundColor: team.color }} />
                    
                    <div className="flex items-center gap-4 md:gap-6 mb-4 sm:mb-0 pl-2 w-full sm:w-auto">
                      <div 
                        className={`w-12 h-12 md:w-14 md:h-14 flex flex-col items-center justify-center rounded-[1rem] md:rounded-2xl font-black text-lg md:text-xl shadow-inner shrink-0`} 
                        style={{ backgroundColor: isLeader ? team.color : '#18181b', color: isLeader ? '#fff' : team.color }}
                      >
                        {isLeader ? (
                          <>
                            <Crown className="w-5 h-5 md:w-6 md:h-6" />
                            {team.isTie && <span className="text-[6px] md:text-[7px] uppercase tracking-widest mt-0.5 opacity-80 leading-none">Tie</span>}
                          </>
                        ) : (
                          `#${team.rank}`
                        )}
                      </div>
                      <div className="truncate">
                        <h3 className={`text-xl md:text-2xl font-bold tracking-tight uppercase truncate ${isLeader ? "text-white" : "text-zinc-300"}`}>
                          {team.name}
                        </h3>
                      </div>
                    </div>

                    <div className="text-center sm:text-right shrink-0">
                      <motion.div 
                        key={team.total_points} 
                        initial={{ scale: 1.2, color: team.color }} 
                        animate={{ scale: 1, color: isLeader ? "#ffffff" : "#d4d4d8" }} 
                        className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter leading-none"
                      >
                        {team.total_points}
                      </motion.div>
                      <p className="text-[8px] md:text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1 md:mt-2">Total Points</p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* 🟣 HIFZ DUEL */}
        <div>
          <div className="flex items-center gap-4 mb-8 md:mb-10">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl shadow-inner">
              <Zap className="text-indigo-400 w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-white">Hifz Duel</h2>
              <p className="text-[9px] md:text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mt-1">Special Category Leaderboard</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {hifzTeams.map((team) => {
                const animationKey = team.id || team.name;
                const isLeader = team.rank === 1;

                return (
                  <motion.div
                    key={animationKey} 
                    layout="position"
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className={`bg-indigo-950/20 border p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] relative overflow-hidden backdrop-blur-xl flex flex-col items-center text-center group transition-colors ${isLeader ? 'shadow-2xl' : 'hover:bg-indigo-900/20'}`}
                    style={{
                      borderColor: isLeader ? team.color : 'rgba(99, 102, 241, 0.2)' 
                    }}
                  >
                    {isLeader && (
                      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${team.color}, transparent 70%)` }} />
                    )}
                    
                    <div 
                      className="w-14 h-14 md:w-16 md:h-16 rounded-full border-4 shadow-2xl flex flex-col items-center justify-center mb-3 md:mb-4 relative z-10 shrink-0" 
                      style={{ 
                        borderColor: team.color, 
                        backgroundColor: isLeader ? team.color : 'rgba(0,0,0,0.5)',
                        color: isLeader ? '#fff' : team.color
                      }}
                    >
                      {isLeader ? (
                        <>
                          <Crown className="w-5 h-5 md:w-6 md:h-6" />
                          {team.isTie && <span className="text-[6px] uppercase tracking-widest mt-0.5 opacity-80 leading-none">Tie</span>}
                        </>
                      ) : (
                        <span className="font-black text-lg md:text-xl">#{team.rank}</span>
                      )}
                    </div>
                    
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight relative z-10 mb-1 md:mb-2 truncate w-full px-2">
                      {team.name}
                    </h3>
                    
                    <motion.div 
                      key={team.total_points} 
                      initial={{ scale: 1.2 }} 
                      animate={{ scale: 1 }} 
                      className="text-4xl md:text-5xl font-black tabular-nums tracking-tighter text-white relative z-10 drop-shadow-md"
                    >
                      {team.total_points}
                    </motion.div>
                    <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1 md:mt-2 relative z-10">Points</p>
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