"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Search,
  User,
  Users,
  ShieldAlert,
  Zap,
  X,
  Hash,
  Medal,
  Trophy,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- TYPES ---
type Participant = {
  id: string;
  name: string;
  participant_id?: string;
  teams?: {
    name: string;
    color: string;
  };
  results?: any;
};

// ----------------------------------------------------------------------
// ⚡ ZERO-DEPENDENCY FUZZY SEARCH ENGINE
// ----------------------------------------------------------------------
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0),
  );
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }
  return matrix[a.length][b.length];
}

function isFuzzyMatch(query: string, target: string): boolean {
  if (!target) return false;
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (!q) return true;
  if (t.includes(q)) return true;

  let qIdx = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === q[qIdx]) qIdx++;
    if (qIdx === q.length) return true;
  }

  if (q.length > 3) {
    const targetWords = t.split(/[\s\-]+/);
    for (const word of targetWords) {
      const maxTypos = q.length > 5 ? 2 : 1;
      if (levenshteinDistance(q, word) <= maxTypos) return true;
    }
  }
  return false;
}

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function GlobalSearchPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Power User Hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ⚡ FETCH ENGINE (Includes grade)
  useEffect(() => {
    const fetchRegistry = async () => {
      try {
        setErrorMsg(null);
        const { data, error } = await supabase
          .from("participants")
          .select(
            `
            id, 
            name, 
            participant_id, 
            teams ( name, color ),
            results (
              position,
              points,
              status,
              grade,
              events ( name )
            )
          `,
          )
          .order("name", { ascending: true });

        if (error) throw new Error(error.message);

        setParticipants((data as any) || []);
      } catch (err: any) {
        console.error("Critical Fetch Error:", err);
        setErrorMsg(
          err.message ||
            "An unknown error occurred while fetching the registry.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRegistry();
  }, []);

  // ⚡ SMART FILTER ENGINE
  const displayedResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const q = searchQuery.toLowerCase().trim();

    return participants
      .filter((p) => {
        const nameMatch = isFuzzyMatch(searchQuery, p.name);
        const teamMatch = p.teams?.name
          ? isFuzzyMatch(searchQuery, p.teams.name)
          : false;
        const idMatch =
          p.participant_id &&
          String(p.participant_id).toLowerCase().includes(q);

        return nameMatch || teamMatch || idMatch;
      })
      .slice(0, 50);
  }, [participants, searchQuery]);

  // ⚡ ERROR CRASH SCREEN
  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="bg-red-500/10 border border-red-500/50 p-8 rounded-3xl max-w-lg w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.2)] backdrop-blur-xl relative z-10">
          <ShieldAlert className="w-16 h-16 mx-auto mb-6 text-red-500" />
          <h2 className="text-2xl font-black text-red-400 mb-2 uppercase tracking-widest">
            Registry Error
          </h2>
          <p className="text-red-200/80 font-mono text-sm mb-6">{errorMsg}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-all"
          >
            Reboot Interface
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-30 animate-pulse" />
          <div className="w-16 h-16 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin relative z-10" />
          <Zap className="w-6 h-6 text-indigo-400 absolute animate-pulse z-10" />
        </div>
        <p className="text-indigo-400 font-mono uppercase tracking-[0.5em] text-[10px] animate-pulse drop-shadow-md text-center px-4 relative z-10">
          Indexing Registry
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 selection:bg-indigo-500/30 selection:text-white font-sans pb-32 relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

      <main className="max-w-4xl mx-auto pt-24 md:pt-32 px-4 md:px-6 w-full relative z-10 flex-1 flex flex-col">
        {/* HEADER & SEARCH BAR */}
        <div className="text-center mb-8 md:mb-12 animate-in fade-in slide-in-from-top-8 duration-700">
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-6 uppercase">
            Participant{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              Search
            </span>
          </h1>

          <div className="relative group/search w-full max-w-2xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within/search:text-indigo-400 transition-colors" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, team, or ID..."
              className="w-full bg-black/80 backdrop-blur-3xl border border-white/10 focus:border-indigo-500/50 focus:bg-black text-white placeholder-zinc-600 rounded-2xl md:rounded-[2rem] py-5 md:py-6 pl-14 pr-16 outline-none transition-all shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] focus:shadow-[0_0_40px_rgba(99,102,241,0.2)] text-base md:text-lg font-bold tracking-wide"
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <span className="hidden md:flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[10px] font-mono font-bold text-zinc-500">
                  ⌘K
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RESULTS AREA */}
        <div className="flex-1 w-full max-w-2xl mx-auto relative">
          {!searchQuery.trim() ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50 py-20 animate-in fade-in duration-1000">
              <Users className="w-16 h-16 mb-6 text-zinc-700" />
              <p className="text-xl font-bold text-zinc-500 tracking-tight">
                Access the Essenza Registry
              </p>
              <p className="text-sm font-mono uppercase tracking-[0.2em] text-zinc-600 mt-2">
                Find anyone instantly.
              </p>
            </div>
          ) : displayedResults.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center py-20 animate-in fade-in zoom-in-95">
              <ShieldAlert className="w-16 h-16 mb-6 text-indigo-900/50" />
              <p className="text-xl font-bold text-zinc-400 tracking-tight">
                No participants found
              </p>
              <p className="text-sm font-mono uppercase tracking-[0.2em] text-zinc-600 mt-2">
                Try checking the spelling.
              </p>
            </div>
          ) : (
            <div className="space-y-6 pb-20">
              <AnimatePresence>
                {displayedResults.map((participant, idx) => {
                  const teamColor = participant.teams?.color || "#6366f1";
                  const teamName = participant.teams?.name || "Independent";

                  // Convert to standard array
                  const safeResultsArray = Array.isArray(participant.results)
                    ? participant.results
                    : participant.results
                      ? [participant.results]
                      : [];

                  // ⚡ STRICT FILTER: ONLY KEEP 'APPROVED' RESULTS
                  const approvedResults = safeResultsArray.filter(
                    (r: any) => r.status && String(r.status).toLowerCase() === "approved"
                  );

                  return (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: idx * 0.02 }}
                      className="group flex flex-col p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] bg-[#0a0a0a]/80 border border-white/5 hover:border-white/10 hover:bg-white/[0.02] backdrop-blur-xl transition-all shadow-lg overflow-hidden relative"
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1.5 md:w-2 opacity-80"
                        style={{ backgroundColor: teamColor }}
                      />

                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-start sm:items-center gap-4 md:gap-6 pl-2 w-full sm:w-auto">
                          <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-black border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                            <User className="w-6 h-6 md:w-7 md:h-7 text-zinc-500" />
                          </div>
                          <div className="flex flex-col truncate">
                            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight truncate">
                              {participant.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-2">
                              <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-zinc-400 truncate bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0 shadow-sm"
                                  style={{ backgroundColor: teamColor }}
                                />
                                {teamName}
                              </span>
                              {participant.participant_id && (
                                <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-zinc-500 px-3 py-1.5 bg-black/50 rounded-lg border border-white/5">
                                  <Hash className="w-3 h-3" />
                                  {participant.participant_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* ⚡ ONLY RENDER ACHIEVEMENT BLOCK IF THERE ARE APPROVED RESULTS */}
                      {approvedResults.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-white/5 w-full">
                          <p className="text-[10px] md:text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-indigo-400" />{" "}
                            Verified Achievements
                          </p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            {approvedResults.map((win, rIdx) => {
                              const evName = Array.isArray(win.events)
                                ? win.events[0]?.name
                                : win.events?.name;
                              const position = String(win.position);

                              // Dynamic Premium Colors
                              let posColor = "text-zinc-500 bg-white/5 border-white/5";
                              if (position === "1")
                                posColor = "text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.1)]";
                              else if (position === "2")
                                posColor = "text-slate-300 bg-slate-300/10 border-slate-300/20 shadow-[0_0_15px_rgba(203,213,225,0.1)]";
                              else if (position === "3")
                                posColor = "text-amber-600 bg-amber-600/10 border-amber-600/20 shadow-[0_0_15px_rgba(217,119,6,0.1)]";
                              else
                                posColor = "text-indigo-400 bg-indigo-400/10 border-indigo-400/20";

                              return (
                                <div
                                  key={rIdx}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 rounded-2xl border bg-black/60 border-white/10 hover:border-white/20 hover:bg-white/[0.04] transition-all duration-300 gap-4"
                                >
                                  <div className="flex items-center gap-4 overflow-hidden">
                                    <div
                                      className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 border ${posColor} font-black text-lg md:text-xl`}
                                    >
                                      {position &&
                                      position !== "undefined" &&
                                      position !== "null" ? (
                                        `#${position}`
                                      ) : (
                                        <Medal className="w-6 h-6" />
                                      )}
                                    </div>
                                    <div className="flex flex-col truncate pr-2">
                                      <span className="text-sm md:text-lg font-bold text-zinc-100 truncate">
                                        {evName || "Unknown Event"}
                                      </span>
                                      <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[9px] md:text-[10px] font-mono text-zinc-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                          Grade {win.grade && win.grade !== 'None' ? win.grade : 'N/A'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {win.points ? (
                                    <div className="flex items-center justify-end gap-2 bg-white/5 px-4 py-2 md:py-3 rounded-xl border border-white/10 shrink-0">
                                      <Zap
                                        className="w-4 h-4 text-yellow-500"
                                      />
                                      <span className="text-base md:text-xl font-black text-white">
                                        {win.points} <span className="text-[10px] text-zinc-500">PTS</span>
                                      </span>
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}