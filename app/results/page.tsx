"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Trophy, Loader2, Users, User, Mic, PenTool, Award, Zap, Search, X, Download } from "lucide-react";

// --- DEEP RELATIONAL TYPES ---
type Result = {
  id: string;
  points: number;
  grade: string;
  position: string;
  status: string;
  participants?: any;
  teams?: any;
};

type EventWithResults = {
  id: string;
  name: string;
  category: string;
  event_type: string;
  event_mode: string;
  results: Result[];
};

// ----------------------------------------------------------------------
// ⚡ ZERO-DEPENDENCY FUZZY SEARCH ENGINE (HANDLES TYPOS)
// ----------------------------------------------------------------------
function levenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
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
  if (t.includes(q)) return true; // Direct match

  // Subsequence match (e.g. "sg" matches "Singing")
  let qIdx = 0;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === q[qIdx]) qIdx++;
    if (qIdx === q.length) return true;
  }

  // Typo tolerance (Levenshtein) for longer words
  if (q.length > 3) {
    const targetWords = t.split(/[\s\-]+/);
    for (const word of targetWords) {
      // Allow 1 typo for 4-5 letter words, 2 typos for 6+ letters
      const maxTypos = q.length > 5 ? 2 : 1;
      if (levenshteinDistance(q, word) <= maxTypos) return true;
    }
  }
  return false;
}

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function CategorizedResultsBoard() {
  const [events, setEvents] = useState<EventWithResults[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState(""); // ⚡ Search State

  // ⚡ Power User Hotkey (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('public-smart-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    fetchEventResults();
    const channel = supabase
      .channel("categorized-results")
      .on("postgres_changes", { event: "*", schema: "public", table: "results", filter: "status=eq.approved" }, () => fetchEventResults())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchEventResults = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(`id, name, category, event_type, event_mode, results (id, points, grade, position, status, participants ( name, teams ( name, color ) ), teams ( name, color ))`)
      .order("name", { ascending: true });

    if (error) return console.error("Failed to sync matrix:", error);

    const processedEvents = (data as unknown as EventWithResults[])
      .map((evt) => ({
        ...evt,
        results: (evt.results || []).filter((r) => r.status === "approved"),
      }))
      .filter((evt) => evt.results.length > 0);

    setEvents(processedEvents);
    if (processedEvents.length > 0) {
      const categories = Array.from(new Set(processedEvents.map((e) => e.category)));
      setActiveCategory((prev) => categories.includes(prev) ? prev : categories[0]);
    }
    setLoading(false);
  };

  const availableCategories = useMemo(() => Array.from(new Set(events.map((e) => e.category))).sort(), [events]);
  
  // ⚡ SMART FILTER ENGINE (Handles Categories + Fuzzy Search)
  const displayedEvents = useMemo(() => {
    let filtered = events.filter((e) => e.category === activeCategory);

    if (searchQuery.trim()) {
      filtered = filtered.map(event => {
        // If the Event Name matches the search, show ALL results inside it
        if (isFuzzyMatch(searchQuery, event.name)) {
          return event;
        }

        // If the Event Name DOESN'T match, filter the results to only show participants that match
        const matchingResults = event.results.filter(r => {
          const { name, team } = extractData(r);
          return isFuzzyMatch(searchQuery, name) || isFuzzyMatch(searchQuery, team);
        });

        return { ...event, results: matchingResults };
      }).filter(event => event.results.length > 0); // Drop events that have 0 matches
    }

    return filtered;
  }, [events, activeCategory, searchQuery]);

  const sortResults = (results: Result[]) => {
    return [...results].sort((a, b) => {
      const posA = a.position && a.position !== "None" ? parseInt(a.position) : 99;
      const posB = b.position && b.position !== "None" ? parseInt(b.position) : 99;
      if (posA !== posB) return posA - posB;
      return b.points - a.points;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500 blur-[80px] opacity-30 animate-pulse" />
          <div className="w-16 h-16 border-2 border-indigo-500/20 border-t-indigo-400 rounded-full animate-spin relative z-10" />
          <Zap className="w-6 h-6 text-indigo-400 absolute animate-pulse z-10" />
        </div>
        <div className="flex flex-col items-center gap-3 relative z-10">
          <p className="text-indigo-400 font-mono uppercase tracking-[0.5em] text-[10px] animate-pulse drop-shadow-md text-center px-4">
            Establishing Secure Uplink
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-300 selection:bg-indigo-500/30 selection:text-white font-sans pb-24 md:pb-32 relative overflow-hidden">
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] md:w-[1200px] h-[400px] md:h-[600px] bg-indigo-600/10 blur-[100px] md:blur-[150px] rounded-full pointer-events-none mix-blend-screen" />
      
      <div className="max-w-7xl mx-auto pt-16 md:pt-24 px-4 md:px-6 w-full relative z-10">
        
        {/* HEADER SECTION */}
        <div className="text-center mb-10 md:mb-16 animate-in fade-in slide-in-from-top-12 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.3em] mb-6 md:mb-8 shadow-[0_0_30px_rgba(99,102,241,0.15)] backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            Synchronized Registry
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-4 md:mb-6 leading-none drop-shadow-2xl">
            Official <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 via-zinc-400 to-zinc-600">
              Standings
            </span>
          </h1>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 md:py-32 bg-black/40 border border-white/5 rounded-[2rem] md:rounded-[3rem] shadow-2xl relative overflow-hidden group backdrop-blur-2xl max-w-2xl mx-auto mx-4">
            <Award className="w-12 h-12 md:w-16 md:h-16 text-zinc-800 mx-auto mb-4 md:mb-6 group-hover:text-zinc-600 transition-colors duration-500" />
            <p className="text-sm md:text-xl font-bold text-zinc-500 tracking-tight uppercase tracking-[0.2em]">
              Awaiting Initial Results
            </p>
          </div>
        ) : (
          <>
            {/* ⚡ CONTROLS: SEARCH & TABS */}
            <div className="sticky top-4 md:top-8 z-50 flex flex-col items-center gap-4 mb-10 md:mb-16">
              
              {/* SMART SEARCH BAR */}
              <div className="relative group/search w-full max-w-md mx-auto">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within/search:text-indigo-400 transition-colors" />
                <input
                  id="public-smart-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, names, or teams..."
                  className="w-full bg-black/80 backdrop-blur-3xl border border-white/10 focus:border-indigo-500/50 focus:bg-black text-white placeholder-zinc-600 rounded-full py-4 pl-12 pr-12 outline-none transition-all shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)] focus:shadow-[0_0_30px_rgba(99,102,241,0.2)] text-[13px] font-bold tracking-wide"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                  {searchQuery ? (
                    <button onClick={() => setSearchQuery('')} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="hidden md:flex items-center justify-center px-2 py-1 rounded border border-white/10 bg-white/5 text-[9px] font-mono font-bold text-zinc-500">
                      ⌘K
                    </span>
                  )}
                </div>
              </div>

              {/* CATEGORY TABS */}
              <div className="bg-black/80 backdrop-blur-3xl border border-white/10 p-1.5 rounded-full flex gap-1 overflow-x-auto custom-scrollbar justify-start md:justify-center max-w-full md:w-max mx-auto shadow-[0_20px_50px_-10px_rgba(0,0,0,0.8)]">
                {availableCategories.map((category) => {
                  const isActive = activeCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => { setActiveCategory(category); setSearchQuery(''); }}
                      className={`relative px-5 md:px-8 py-3 md:py-3.5 rounded-full text-[9px] md:text-[10px] font-black transition-all duration-500 shrink-0 uppercase tracking-[0.2em] ${
                        isActive ? "text-indigo-300 ring-1 ring-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.3)] bg-indigo-500/10" : "text-zinc-500 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <span className="relative z-10">{category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EVENT CARDS MASONRY GRID */}
            {displayedEvents.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-24 text-zinc-600 border border-white/5 rounded-[3rem] bg-black/60 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 max-w-2xl mx-auto">
                 <Search className="w-12 h-12 mb-4 opacity-30 text-indigo-500" />
                 <p className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-400">No matches found for <span className="text-indigo-400">"{searchQuery}"</span></p>
               </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {displayedEvents.map((event, eventIdx) => {
                  const sortedResults = sortResults(event.results);
                  const firstPlace = sortedResults[0];
                  const runnersUp = sortedResults.slice(1);

                  return (
                    <div
                      key={event.id}
                      className="bg-[#050505]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] md:rounded-[2.5rem] p-2 md:p-3 flex flex-col hover:border-white/10 hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] transition-all duration-700 shadow-2xl group animate-in fade-in slide-in-from-bottom-8 fill-mode-both relative overflow-hidden"
                      style={{ animationDelay: `${eventIdx * 50}ms`, animationDuration: "500ms" }}
                    >
                      <div className="p-5 md:p-6 pb-4 md:pb-5 border-b border-white/[0.05] mb-2 md:mb-3 relative overflow-hidden">
                        <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight mb-4 md:mb-5 group-hover:text-indigo-100 transition-colors relative z-10 drop-shadow-md">
                          {event.name}
                        </h2>
                        
                        <div className="flex flex-wrap gap-2 relative z-10">
                          <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-black/60 border border-white/[0.08] rounded-md md:rounded-lg text-zinc-400 text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold flex items-center gap-1.5 shadow-inner backdrop-blur-md">
                            {event.event_mode === "Group" ? <Users className="w-2.5 h-2.5 md:w-3 md:h-3 text-indigo-400" /> : <User className="w-2.5 h-2.5 md:w-3 md:h-3 text-indigo-400" />}
                            {event.event_mode || "Solo"}
                          </span>
                          <span className="px-2.5 md:px-3 py-1 md:py-1.5 bg-black/60 border border-white/[0.08] rounded-md md:rounded-lg text-zinc-400 text-[8px] md:text-[9px] uppercase tracking-[0.2em] font-bold flex items-center gap-1.5 shadow-inner backdrop-blur-md">
                            {event.event_type === "Stage" ? <Mic className="w-2.5 h-2.5 md:w-3 md:h-3 text-emerald-400" /> : <PenTool className="w-2.5 h-2.5 md:w-3 md:h-3 text-emerald-400" />}
                            {event.event_type || "Stage"}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col gap-2 md:gap-3 px-1 md:px-2 pb-1 md:pb-2 z-10">
                        {firstPlace && <FirstPlaceCard result={firstPlace} />}

                        {runnersUp.length > 0 && (
                          <div className="space-y-1.5 mt-2 md:mt-3">
                            {runnersUp.map((result, idx) => (
                              <RunnerUpRow key={result.id} result={result} index={idx} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes sweep {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(200%) skewX(-15deg); }
        }
        .animate-sweep { animation: sweep 2.5s infinite linear; }
        .custom-scrollbar::-webkit-scrollbar { display: none; }
        .custom-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

// ----------------------------------------------------------------------
// ⚡ ISOLATED COMPONENTS & DYNAMIC HELPERS
// ----------------------------------------------------------------------

const extractData = (result: Result) => {
  const name = result.participants?.name || result.teams?.name || "Unknown";
  const team = result.participants?.teams?.name || "TEAM CATEGORY";
  const color = result.participants?.teams?.color || result.teams?.color || "#6366f1";
  return { name, team, color };
};

const getGradeStyle = (grade: string) => {
  if (!grade || grade === "None") return null;
  const g = grade.toUpperCase();
  if (g.includes("A")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (g.includes("B")) return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
  if (g.includes("C")) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  return "bg-white/5 text-zinc-400 border-white/10";
};

// ⚡ THE GENERATOR ACTION
const handleDownloadCertificate = async (result: Result, e: React.MouseEvent) => {
  e.stopPropagation(); 
  
  const btn = e.currentTarget as HTMLButtonElement;
  const originalText = btn.innerHTML;
  
  btn.innerHTML = `<svg class="animate-spin w-3 h-3 mr-1 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Generating...`;
  btn.disabled = true;

  try {
    window.open(`/api/certificate?id=${result.id}`, '_blank');
  } catch (err) {
    alert("Failed to generate the certificate.");
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
};

function FirstPlaceCard({ result }: { result: Result }) {
  const { name, team, color } = extractData(result);
  const gradeStyle = getGradeStyle(result.grade);

  return (
    <div className="relative p-[1px] rounded-[1.25rem] md:rounded-[1.5rem] bg-gradient-to-b from-yellow-400/80 via-yellow-700/40 to-white/5 overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.15)] group/hero min-w-0">
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/hero:animate-sweep pointer-events-none z-20" />

      <div className="bg-[#050505]/90 backdrop-blur-3xl rounded-[calc(1.25rem-1px)] md:rounded-[calc(1.5rem-1px)] p-4 md:p-6 relative z-10 h-full flex items-center justify-between min-w-0">
        <div className="flex flex-col pr-2 md:pr-4 min-w-0 flex-1">
          <span className="text-yellow-400 text-[9px] md:text-[10px] font-black tracking-[0.2em] uppercase mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
            <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" /> First Place
          </span>

          <p className="font-black text-xl md:text-2xl lg:text-3xl tracking-tight leading-none mb-3 md:mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white via-yellow-200 to-yellow-600 truncate w-full">
            {name}
          </p>

          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div className="inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-md md:rounded-lg border text-[8px] md:text-[9px] font-mono uppercase tracking-widest w-fit bg-white/[0.03] border-white/[0.05] text-zinc-400 min-w-0 max-w-full">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="truncate">{team}</span>
            </div>
            
            <button 
              onClick={(e) => handleDownloadCertificate(result, e)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:text-yellow-300 transition-all text-[9px] font-black uppercase tracking-widest cursor-pointer z-30 shadow-inner"
            >
              <Download className="w-3 h-3" /> Certificate
            </button>
          </div>
        </div>

        <div className="text-right flex flex-col items-end shrink-0 border-l border-white/10 pl-3 md:pl-5 justify-center h-full">
          {gradeStyle && (
            <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest border px-2 md:px-2.5 py-0.5 rounded shadow-sm mb-2 md:mb-3 ${gradeStyle}`}>
              {result.grade}
            </span>
          )}
          <div className="flex items-baseline gap-1 md:gap-1.5">
            <p className="font-black text-3xl md:text-4xl lg:text-5xl bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400 tabular-nums tracking-tighter leading-none">
              {result.points}
            </p>
            <span className="text-[8px] md:text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] ml-1 md:ml-1.5">
              PTS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RunnerUpRow({ result, index }: { result: Result; index: number }) {
  const { name, team, color } = extractData(result);
  const gradeStyle = getGradeStyle(result.grade);

  const isSecond = result.position === "2";
  const isThird = result.position === "3";

  return (
    <div className={`flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-[1.25rem] border backdrop-blur-sm min-w-0 transition-colors group/row relative z-10 ${
        isSecond ? "bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/50" : isThird ? "bg-amber-950/20 border-amber-900/30 hover:bg-amber-900/40" : "bg-black/20 border-transparent hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden min-w-0 flex-1">
        <div className={`shrink-0 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl text-xs md:text-sm font-black border shadow-inner ${
            isSecond ? "bg-slate-200 text-slate-900 border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]" : isThird ? "bg-amber-700 text-amber-100 border-amber-500" : "bg-zinc-900/80 text-zinc-500 border-zinc-800"
          }`}
        >
          {result.position !== "None" ? result.position : "-"}
        </div>

        <div className="truncate flex flex-col min-w-0">
          <p className="font-bold text-sm md:text-[15px] text-zinc-200 truncate w-full">
            {name}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5 md:mt-1">
            <div className="inline-flex items-center gap-1.5 text-[9px] md:text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-500 truncate">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="truncate">{team}</span>
            </div>

            {/* ⚡ FIX: Removed opacity-0 so the button is ALWAYS visible! */}
            <button 
              onClick={(e) => handleDownloadCertificate(result, e)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded border transition-all text-[8px] font-black uppercase tracking-widest cursor-pointer -ml-1 md:ml-2 ${
                isSecond ? "bg-slate-500/20 text-slate-300 hover:bg-slate-500/40 border-slate-500/30" : isThird ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 border-amber-500/30" : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border-white/10"
              }`}
            >
              <Download className="w-2.5 h-2.5" /> Get
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right pl-3 md:pl-4 flex flex-col items-end justify-center">
        <div className="flex items-baseline gap-1">
          <p className={`font-black text-base md:text-lg tabular-nums tracking-tight ${isSecond ? "text-slate-200" : isThird ? "text-amber-400" : "text-zinc-400"}`}>
            {result.points}
          </p>
          <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] ${isSecond ? "text-slate-500" : isThird ? "text-amber-700" : "text-zinc-600"}`}>
            PTS
          </span>
        </div>
        {gradeStyle && (
          <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.2em] border px-1.5 py-0.5 rounded mt-0.5 md:mt-1 ${gradeStyle}`}>
            {result.grade}
          </span>
        )}
      </div>
    </div>
  );
}