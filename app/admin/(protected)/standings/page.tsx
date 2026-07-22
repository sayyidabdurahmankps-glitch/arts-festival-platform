"use client"

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, Minus, Calculator, Save, Loader2, RefreshCw, Radio, Check, Crown, Zap, AlertCircle, Search, X } from 'lucide-react';

// ==========================================
// 0. TYPES
// ==========================================
type TeamData = {
  id: string;
  name: string;
  color: string;
  base_points: number;
  bonus_points: number;
  penalty_points: number;
  total_points: number;
  category_group: string;
};

type AutoSaveState = 'idle' | 'waiting' | 'saving' | 'saved';

// ==========================================
// 1. THE ACTION LAYER
// ==========================================
const StandingsActions = {
  fetchLeaderboard: async () => {
    return await supabase
      .from('team_leaderboard')
      .select('*')
      .order('total_points', { ascending: false });
  },

  updateTeamModifiers: async (id: string, bonus: number, penalty: number) => {
    return await supabase
      .from('teams')
      .update({ bonus_points: bonus, penalty_points: penalty })
      .eq('id', id);
  }
};

// ==========================================
// 2. CUSTOM HOOK
// ==========================================
function useStandingsMatrix() {
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>('idle');
  
  const teamsRef = useRef<TeamData[]>([]);
  const pendingUpdates = useRef<Set<string>>(new Set());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lockRef = useRef<number>(0); 

  useEffect(() => {
    teamsRef.current = teams;
  }, [teams]);

  const fetchLiveStandings = async () => {
    const { data, error } = await StandingsActions.fetchLeaderboard();

    if (error) {
      console.error("Matrix Sync Failed:", error.message);
      return;
    }

    const sanitizedTeams = (data || []).map(t => ({
      ...t,
      name: t.name || t.team || 'Unknown', 
      base_points: Number(t.base_points || 0),
      bonus_points: Number(t.bonus_points || 0),
      penalty_points: Number(t.penalty_points || 0),
      total_points: Number(t.total_points || 0),
      category_group: t.category_group || t.category_name || 'General' 
    }));

    setTeams(sanitizedTeams);
    setLoading(false);
  };

  const triggerLiveUpdate = () => {
    if (pendingUpdates.current.size > 0 || Date.now() - lockRef.current < 5000) return;
    
    setIsLive(true);
    fetchLiveStandings();
    setTimeout(() => setIsLive(false), 2000);
  };

  useEffect(() => {
    fetchLiveStandings();
    
    const resultsChannel = supabase.channel('standings-results-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results', filter: 'status=eq.approved' }, triggerLiveUpdate)
      .subscribe();

    const teamsChannel = supabase.channel('standings-teams-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, triggerLiveUpdate)
      .subscribe();

    return () => { 
      supabase.removeChannel(resultsChannel); 
      supabase.removeChannel(teamsChannel);
    };
  }, []);

  const updateMarks = (id: string, field: 'bonus_points' | 'penalty_points', value: string) => {
    let numericValue = 0;
    if (value !== '') {
      numericValue = parseInt(value, 10);
      if (isNaN(numericValue)) return;
    }
    
    setAutoSaveState('waiting');
    lockRef.current = Date.now();
    
    setTeams(prevTeams => {
      return prevTeams.map(t => {
        if (t.id === id) {
          const newTeam = { ...t, [field]: numericValue };
          newTeam.total_points = Number(newTeam.base_points) + Number(newTeam.bonus_points) - Number(newTeam.penalty_points);
          return newTeam;
        }
        return t;
      });
    });

    pendingUpdates.current.add(id);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveOverridesToDatabase, 1500);
  };

  const saveOverridesToDatabase = async () => {
    if (pendingUpdates.current.size === 0) return;
    
    setAutoSaveState('saving');

    try {
      const currentTeams = teamsRef.current;
      
      const updates = Array.from(pendingUpdates.current).map(id => {
        const team = currentTeams.find(t => t.id === id);
        if (!team) return Promise.resolve();
        return StandingsActions.updateTeamModifiers(id, team.bonus_points, team.penalty_points);
      });

      await Promise.all(updates);
      
      pendingUpdates.current.clear();
      lockRef.current = Date.now();
      setAutoSaveState('saved');
      
      setTeams(prevTeams => [...prevTeams].sort((a, b) => b.total_points - a.total_points));

      setTimeout(() => {
        setAutoSaveState(prev => prev === 'saved' ? 'idle' : prev);
      }, 3000);
      
    } catch (error) {
      console.error("Save failed:", error);
      setAutoSaveState('idle');
    }
  };

  const forceManualSync = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveOverridesToDatabase();
  };

  return { teams, loading, isLive, autoSaveState, updateMarks, fetchLiveStandings, forceManualSync };
}

// ==========================================
// 3. MAIN COMPONENT (UI)
// ==========================================
export default function StandingsControl() {
  const matrix = useStandingsMatrix();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('smart-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (matrix.loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-zinc-500 bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-30 animate-pulse" />
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative z-10" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.4em] relative z-10 text-indigo-400 drop-shadow-md">Syncing Matrices...</span>
      </div>
    );
  }

  const filteredTeams = matrix.teams.filter(t => {
     const tName = t.name ? t.name.toLowerCase() : '';
     const tGroup = t.category_group ? t.category_group.toLowerCase() : '';
     const query = searchQuery.toLowerCase();
     return tName.includes(query) || tGroup.includes(query);
  });

  const generalTeams = filteredTeams.filter(t => t.category_group !== 'Hifz');
  const hifzTeams = filteredTeams.filter(t => t.category_group === 'Hifz');

  return (
    <div className="relative min-h-screen bg-[#050505] font-sans selection:bg-indigo-500/30">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none z-0" />
      <div className="fixed top-0 left-1/4 w-[800px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none z-0 mix-blend-screen" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[500px] bg-violet-600/5 blur-[150px] rounded-full pointer-events-none z-0 mix-blend-screen" />

      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 max-w-6xl mx-auto p-6 relative z-10">
        <MatrixHeader 
          isLive={matrix.isLive} 
          autoSaveState={matrix.autoSaveState}
          onSync={matrix.fetchLiveStandings} 
          onForceSave={matrix.forceManualSync}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery} 
        />

        {matrix.teams.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-32 text-zinc-600 border border-dashed border-white/5 rounded-[3rem] bg-black/40 backdrop-blur-xl shadow-2xl">
             <Trophy className="w-16 h-16 mb-6 opacity-20" />
             <p className="font-mono text-xs uppercase tracking-[0.3em]">No Teams Found in Database</p>
           </div>
        ) : filteredTeams.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-24 text-zinc-600 border border-white/5 rounded-[3rem] bg-black/60 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95">
             <Search className="w-12 h-12 mb-4 opacity-30 text-indigo-500" />
             <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">No matches found for <span className="text-indigo-400">"{searchQuery}"</span></p>
           </div>
        ) : (
          <div className="space-y-14">
            {generalTeams.length > 0 && (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center gap-4 pl-2">
                  <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-amber-600/5 border border-yellow-500/20 rounded-2xl shadow-[0_0_20px_rgba(234,179,8,0.1)]">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg">General Championship</h2>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Main Event Hierarchy</p>
                  </div>
                </div>
                <AnimatedEntryTable teams={generalTeams} onUpdate={matrix.updateMarks} accentColor="yellow" />
              </motion.div>
            )}

            {hifzTeams.length > 0 && (
              <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="flex items-center gap-4 pl-2">
                  <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-600/5 border border-indigo-500/20 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                    <Zap className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tighter drop-shadow-lg">Hifz Duel</h2>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mt-1">Special Category Hierarchy</p>
                  </div>
                </div>
                <AnimatedEntryTable teams={hifzTeams} onUpdate={matrix.updateMarks} accentColor="indigo" />
              </motion.div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        input[type="number"]::-webkit-inner-spin-button, 
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; appearance: textfield; }
      `}} />
    </div>
  );
}

// ==========================================
// 4. PRESENTATIONAL SUB-COMPONENTS
// ==========================================
function MatrixHeader({ isLive, autoSaveState, onSync, onForceSave, searchQuery, setSearchQuery }: { isLive: boolean, autoSaveState: AutoSaveState, onSync: () => void, onForceSave: () => void, searchQuery: string, setSearchQuery: (q: string) => void }) {
  
  const getAutoSaveUI = () => {
    switch (autoSaveState) {
      case 'waiting': 
        return { icon: AlertCircle, text: 'Changes Pending...', style: 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]', spin: false };
      case 'saving': 
        return { icon: Loader2, text: 'Auto-Syncing...', style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]', spin: true };
      case 'saved': 
        return { icon: Check, text: 'Matrix Synced', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]', spin: false };
      default: 
        return { icon: Save, text: 'Auto-Save Active', style: 'bg-black/60 text-zinc-500 border-white/10 hover:text-zinc-300 hover:bg-white/5 cursor-pointer', spin: false, onClick: onForceSave };
    }
  };

  const autoSaveUI = getAutoSaveUI();
  const AutoSaveIcon = autoSaveUI.icon;

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/10 pb-8 bg-[#050505]/80 sticky top-0 z-50 pt-6 backdrop-blur-3xl -mx-6 px-6 lg:mx-0 lg:px-0 lg:bg-transparent lg:static lg:pt-0 lg:backdrop-blur-none">
      
      <div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase flex items-center gap-3 drop-shadow-2xl">
          Standings <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Control</span>
        </h1>
        <p className="text-zinc-500 font-mono text-[10px] mt-3 flex items-center gap-3 uppercase tracking-[0.2em]">
          <span className="flex items-center gap-1.5"><Calculator className="w-3 h-3 text-indigo-500/50" /> Fluid Matrix Node</span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:justify-end flex-1">
        <div className="relative group/search flex-1 min-w-[200px] max-w-sm lg:mr-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/search:text-indigo-400 transition-colors" />
          <input
            id="smart-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search teams..."
            className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/50 focus:bg-indigo-500/5 focus:shadow-[0_0_20px_rgba(99,102,241,0.15)] text-white placeholder-zinc-600 rounded-2xl py-3.5 pl-11 pr-12 outline-none transition-all shadow-inner backdrop-blur-md text-[13px] font-bold tracking-wide"
          />
        </div>

        <button onClick={onSync} className="hidden md:flex p-4 bg-black/60 border border-white/10 text-zinc-400 hover:text-white hover:border-white/30 rounded-2xl transition-all shadow-inner backdrop-blur-md" title="Force Refetch">
          <RefreshCw className="w-5 h-5" />
        </button>

        <div 
          onClick={autoSaveUI.onClick}
          className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-300 flex items-center justify-center gap-3 flex-1 md:flex-none border backdrop-blur-md ${autoSaveUI.style}`}
        >
          <AutoSaveIcon className={`w-4 h-4 ${autoSaveUI.spin ? 'animate-spin' : ''}`} />
          <span>{autoSaveUI.text}</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ⚡ SLEEK ANIMATED ENTRY TABLE (REBUILT WITH CSS GRID)
// ==========================================
function AnimatedEntryTable({ teams, onUpdate, accentColor }: { teams: TeamData[], onUpdate: (id: string, field: 'bonus_points' | 'penalty_points', value: string) => void, accentColor: string }) {
  
  const getTheme = (isLeader: boolean) => {
    if (!isLeader) {
      return {
        row: 'bg-black/40 border-y border-transparent hover:bg-white/[0.03]',
        rank: 'text-zinc-500',
        name: 'text-zinc-300',
        category: 'text-zinc-600',
        base: 'text-zinc-400 bg-white/[0.01]',
        total: 'text-white'
      };
    }
    
    if (accentColor === 'yellow') {
      return {
        row: 'bg-gradient-to-r from-amber-500/10 via-amber-500/[0.02] to-transparent border-y border-amber-500/20 shadow-[inset_0_0_30px_rgba(245,158,11,0.05)]',
        glowLine: 'bg-amber-400 shadow-[0_0_15px_rgba(250,204,21,1)]',
        crown: 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]',
        rank: 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]',
        name: 'text-white drop-shadow-md',
        category: 'text-amber-500/70',
        base: 'text-amber-200/90 bg-amber-500/[0.02]',
        total: 'text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-105 transform origin-right'
      };
    }

    return {
      row: 'bg-gradient-to-r from-indigo-500/10 via-indigo-500/[0.02] to-transparent border-y border-indigo-500/20 shadow-[inset_0_0_30px_rgba(99,102,241,0.05)]',
      glowLine: 'bg-indigo-400 shadow-[0_0_15px_rgba(129,140,248,1)]',
      crown: 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]',
      rank: 'text-indigo-400 drop-shadow-[0_0_10px_rgba(129,140,248,0.5)]',
      name: 'text-white drop-shadow-md',
      category: 'text-indigo-400/70',
      base: 'text-indigo-200/90 bg-indigo-500/[0.02]',
      total: 'text-indigo-400 drop-shadow-[0_0_20px_rgba(99,102,241,0.4)] scale-105 transform origin-right'
    };
  };

  return (
    <div className="bg-black/50 border border-white/10 rounded-[2.5rem] overflow-hidden backdrop-blur-3xl shadow-2xl relative">
      <div className="overflow-x-auto custom-scrollbar">
        <div className="min-w-[900px] flex flex-col">
          
          {/* ⚡ HEADER (Built with CSS Grid) */}
          <div className="grid grid-cols-[100px_1fr_140px_160px_160px_160px] gap-4 bg-zinc-950/90 border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 select-none py-6 px-4">
            <div className="text-center pl-4">Rank</div>
            <div>Team Identity</div>
            <div className="text-center">Auto-Base</div>
            <div className="text-center text-emerald-500 tracking-[0.3em]"><Plus className="w-3 h-3 inline mb-0.5 mr-1"/>Bonus</div>
            <div className="text-center text-red-500 tracking-[0.3em]"><Minus className="w-3 h-3 inline mb-0.5 mr-1"/>Penalty</div>
            <div className="text-right pr-6">Live Score</div>
          </div>

          {/* ⚡ BODY (Built with Flexbox) */}
          <div className="relative flex flex-col divide-y divide-white/5">
            <AnimatePresence mode="popLayout">
              {teams.map((team, index) => {
                const isLeader = index === 0;
                const hasBonus = team.bonus_points > 0;
                const hasPenalty = team.penalty_points > 0;
                const theme = getTheme(isLeader);

                return (
                  <motion.div 
                    layout="position"
                    key={team.id}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    // ⚡ ROW (Built with CSS Grid)
                    className={`grid grid-cols-[100px_1fr_140px_160px_160px_160px] items-center gap-4 py-3 px-4 relative group transition-all duration-500 ${theme.row}`}
                  >
                    
                    {/* Rank */}
                    <div className="pl-4 flex justify-center relative z-10 py-3">
                      {isLeader && <div className={`absolute left-0 top-0 bottom-0 w-1.5 z-10 ${theme.glowLine}`} />}
                      <div className="relative flex items-center justify-center w-full">
                        {isLeader && <Crown className={`absolute -left-1 w-6 h-6 -mt-1 ${theme.crown}`} />}
                        <span className={`font-black text-xl w-6 text-center ${theme.rank}`}>
                          {index + 1}
                        </span>
                      </div>
                    </div>

                    {/* Team Identity */}
                    <div className="flex items-center gap-5 relative z-10 py-3">
                      <div className="w-4 h-4 rounded-full shadow-[0_0_15px_currentColor] opacity-90 ring-2 ring-black shrink-0" style={{ color: team.color, backgroundColor: team.color }} />
                      <div className="truncate">
                        <span className={`font-black uppercase tracking-tight text-xl truncate block transition-colors ${theme.name}`}>
                          {team.name}
                        </span>
                        <p className={`text-[9px] font-mono uppercase tracking-[0.3em] mt-0.5 ${theme.category}`}>
                          {team.category_group}
                        </p>
                      </div>
                    </div>

                    {/* Auto-Base */}
                    <div className={`text-center font-black tabular-nums text-xl border-l border-white/5 relative z-10 transition-colors h-full flex items-center justify-center py-3 ${theme.base}`}>
                      {team.base_points}
                    </div>

                    {/* Bonus Entry */}
                    <div className={`relative z-10 transition-colors duration-500 h-full flex items-center justify-center px-2 py-2 ${hasBonus ? 'bg-emerald-500/[0.03]' : ''}`}>
                      <input
                        type="number"
                        value={team.bonus_points === 0 ? '' : team.bonus_points}
                        onChange={(e) => onUpdate(team.id, 'bonus_points', e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className={`w-full text-center font-black text-2xl py-2.5 rounded-2xl outline-none transition-all tabular-nums ${
                          hasBonus 
                            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] focus:border-emerald-400 focus:shadow-[0_0_30px_rgba(16,185,129,0.2)]' 
                            : 'bg-transparent border border-transparent text-zinc-600 placeholder-zinc-800 hover:bg-white/5 focus:bg-emerald-500/5 focus:border-emerald-500/30 focus:text-emerald-400'
                        }`}
                        placeholder="0"
                      />
                    </div>

                    {/* Penalty Entry */}
                    <div className={`relative z-10 transition-colors duration-500 h-full flex items-center justify-center px-2 py-2 ${hasPenalty ? 'bg-red-500/[0.02]' : ''}`}>
                      <input
                        type="number"
                        value={team.penalty_points === 0 ? '' : team.penalty_points}
                        onChange={(e) => onUpdate(team.id, 'penalty_points', e.target.value)}
                        onWheel={(e) => e.currentTarget.blur()}
                        className={`w-full text-center font-black text-2xl py-2.5 rounded-2xl outline-none transition-all tabular-nums ${
                          hasPenalty 
                            ? 'bg-red-500/10 border border-red-500/30 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)] focus:border-red-400 focus:shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                            : 'bg-transparent border border-transparent text-zinc-600 placeholder-zinc-800 hover:bg-white/5 focus:bg-red-500/5 focus:border-red-500/30 focus:text-red-400'
                        }`}
                        placeholder="0"
                      />
                    </div>

                    {/* Live Score */}
                    <div className={`pr-6 text-right font-black text-4xl tabular-nums tracking-tighter border-l border-white/5 relative z-10 transition-all h-full flex flex-col justify-center py-3 ${theme.total}`}>
                      {team.total_points}
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