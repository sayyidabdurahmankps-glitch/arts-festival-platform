"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Search as SearchIcon,
  Loader2,
  User,
  Trophy,
  ShieldCheck,
  Clock,
  XCircle,
  ArrowLeft,
  Medal,
  Activity,
} from "lucide-react";

// --- TYPES ---
type ParticipantRecord = {
  id: string;
  name: string;
  participant_id: string;
  category: string;
  teams: { name: string; color: string } | null;
  results: {
    id: string;
    position: number | null;
    grade: string | null;
    points: number;
    status: string;
    events: { event_code: string; name: string } | null;
  }[];
};

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ParticipantRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // ⚡ SUPABASE REAL-TIME SEARCH ENGINE (Debounced)
  useEffect(() => {
    const fetchParticipants = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setLoading(false);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      // We join 4 tables here instantly: Participants -> Teams -> Results -> Events
      const { data, error } = await supabase
        .from("participants")
        .select(
          `
          id, name, participant_id, category,
          teams ( name, color ),
          results ( 
            id, position, grade, points, status, 
            events ( event_code, name ) 
          )
        `,
        )
        .or(
          `name.ilike.%${query.trim()}%,participant_id.ilike.%${query.trim()}%`,
        )
        .limit(12);

      if (data) {
        // Sort results internally so 'approved' scores show first
        const formattedData = data.map((p: any) => ({
          ...p,
          results: (p.results || []).sort((a: any, b: any) => {
            if (a.status === "approved" && b.status !== "approved") return -1;
            if (a.status !== "approved" && b.status === "approved") return 1;
            return 0;
          }),
        }));
        setResults(formattedData as ParticipantRecord[]);
      }

      setLoading(false);
    };

    // 300ms debounce prevents spamming the database on every keystroke
    const debounce = setTimeout(fetchParticipants, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 selection:bg-indigo-500/30 selection:text-indigo-200 font-sans relative overflow-hidden flex flex-col">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* TOP NAVIGATION */}
      <header className="relative z-10 px-6 py-6 md:px-12 max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 md:px-12 pb-24 relative z-10 flex flex-col">
        {/* SEARCH HEADER */}
        <div className="text-center mb-12 animate-in slide-in-from-top-10 duration-700">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6 shadow-inner">
            <SearchIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase mb-4">
            Participant <span className="text-indigo-500 italic">Lookup</span>
          </h1>
          <p className="text-zinc-500 font-medium max-w-xl mx-auto">
            Access live verification records. Search by student name or exact
            chest number.
          </p>
        </div>

        {/* THE SEARCH BAR */}
        <div className="relative max-w-2xl mx-auto w-full mb-16 group">
          <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
          <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 rounded-full p-2 transition-all shadow-2xl">
            <SearchIcon className="w-6 h-6 text-zinc-500 ml-4 shrink-0 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Enter Name or ID (e.g. 101)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 w-full bg-transparent border-none outline-none text-white font-black text-xl py-4 pl-4 pr-12 placeholder-zinc-700 tracking-wide"
              autoFocus
            />
            {loading && (
              <Loader2 className="absolute right-6 w-6 h-6 animate-spin text-indigo-500" />
            )}
          </div>
        </div>

        {/* SEARCH RESULTS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasSearched && !loading && results.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-black/30 rounded-[3rem] border border-dashed border-white/10">
              <User className="w-12 h-12 text-zinc-700 mb-4" />
              <p className="text-zinc-500 font-black uppercase tracking-widest">
                No Participants Found
              </p>
            </div>
          )}

          {results.map((student) => {
            // Calculate strictly approved points for the large display number
            const totalApprovedPoints = student.results
              .filter((r) => r.status === "approved")
              .reduce((sum, r) => sum + (r.points || 0), 0);

            const teamColor = student.teams?.color || "#3f3f46";

            return (
              <div
                key={student.id}
                className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group hover:border-white/10 transition-all shadow-xl flex flex-col"
              >
                {/* Dynamic Top Accent */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5 opacity-80 transition-all"
                  style={{ backgroundColor: teamColor }}
                />
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] h-[100px] blur-[60px] pointer-events-none opacity-20"
                  style={{ backgroundColor: teamColor }}
                />

                {/* CARD HEADER */}
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 bg-black/50 border border-white/10 rounded-2xl flex items-center justify-center shadow-inner shrink-0"
                      style={{ color: teamColor }}
                    >
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white tracking-tight uppercase leading-none">
                        {student.name}
                      </h2>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-2">
                        UID: {student.participant_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-3xl font-black tabular-nums tracking-tighter leading-none"
                      style={{ color: teamColor }}
                    >
                      {totalApprovedPoints}
                    </p>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-1">
                      Verified Pts
                    </p>
                  </div>
                </div>

                {/* METADATA STRIP */}
                <div className="flex flex-wrap items-center gap-2 mb-8 relative z-10">
                  <span
                    className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border bg-black/50 border-white/10"
                    style={{ color: teamColor }}
                  >
                    {student.teams?.name || "Unknown Team"}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    {student.category}
                  </span>
                </div>

                {/* EVENT RESULTS LEDGER */}
                <div className="flex-1 flex flex-col relative z-10 bg-black/40 rounded-2xl border border-white/5 p-2">
                  <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                    <Activity className="w-3 h-3 text-zinc-500" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      Event History Log
                    </span>
                  </div>

                  <div className="p-2 space-y-2">
                    {student.results.length === 0 ? (
                      <div className="py-6 text-center text-[10px] font-mono uppercase text-zinc-600 tracking-widest">
                        No event data recorded yet.
                      </div>
                    ) : (
                      student.results.map((res) => (
                        <div
                          key={res.id}
                          className="bg-[#0a0a0a] border border-white/5 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-black border border-white/5 rounded-lg shrink-0">
                              {res.position === 1 ? (
                                <Trophy className="w-4 h-4 text-yellow-500" />
                              ) : res.position === 2 ? (
                                <Medal className="w-4 h-4 text-zinc-300" />
                              ) : res.position === 3 ? (
                                <Medal className="w-4 h-4 text-amber-700" />
                              ) : (
                                <Trophy className="w-4 h-4 text-zinc-700" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white uppercase tracking-wide leading-tight">
                                {res.events?.name || "Unknown Event"}
                              </p>
                              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                                {res.events?.event_code} •{" "}
                                {res.grade ? `Grade ${res.grade}` : "No Grade"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-white/5 sm:border-0 pt-2 sm:pt-0">
                            <div className="text-left sm:text-right">
                              <p className="text-sm font-black text-indigo-400 tabular-nums leading-none">
                                +{res.points}{" "}
                                <span className="text-[8px] text-zinc-500 uppercase">
                                  Pts
                                </span>
                              </p>
                            </div>

                            <div className="w-px h-6 bg-white/10 hidden sm:block" />

                            {/* Status Badges */}
                            {res.status === "approved" ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 text-[8px] font-black uppercase tracking-widest">
                                <ShieldCheck className="w-3 h-3" /> Locked
                              </div>
                            ) : res.status === "pending" ? (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400 text-[8px] font-black uppercase tracking-widest animate-pulse">
                                <Clock className="w-3 h-3" /> Audit
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[8px] font-black uppercase tracking-widest">
                                <XCircle className="w-3 h-3" /> Void
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
