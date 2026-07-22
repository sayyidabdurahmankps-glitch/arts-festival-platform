"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  LogOut, Gavel, Check, Loader2, Search, RotateCcw, Clock, 
  Trophy, ShieldAlert, Hash, X, AlertTriangle, Lock, UserCheck, Filter, RefreshCcw, Database, Zap
} from "lucide-react";

// --- TYPES ---
type Participant = { id: string; name: string; category: string; participant_id: string; teams: { name: string }; };
type EventData = { id: string; name: string; category: string; event_code: string; event_mode: string; event_type: string; mark_tier: string; };
type PointRule = { category: string; event_mode: string; event_type: string; mark_tier: string; rule_type: string; award: string; points: number; };

type WinnerEntry = {
  result_id?: string;
  position: string;
  label: string;
  studentInput: string;
  selectedStudent: Participant | null;
  grade: string;
  required: boolean;
};

const initialEntriesState: WinnerEntry[] = [
  { position: "1", label: "1st Place Student ID", studentInput: "", selectedStudent: null, grade: "", required: true },
  { position: "2", label: "2nd Place Student ID", studentInput: "", selectedStudent: null, grade: "", required: false },
  { position: "3", label: "3rd Place ID (Optional)", studentInput: "", selectedStudent: null, grade: "", required: false },
];

export default function BatchDeclarationTerminal() {
  const [liveEvents, setLiveEvents] = useState<EventData[]>([]);
  const [pointRules, setPointRules] = useState<PointRule[]>([]);
  const [judgeEmail, setJudgeEmail] = useState("");
  const [ledger, setLedger] = useState<any[]>([]);
  const [loading, setLoading] = useState({ boot: true, submit: false, recallingEvent: false });

  // --- UI HARDWARE STATES ---
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState<number | null>(null);

  // --- FILTER STATES ---
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState("All");

  // --- SUPABASE LIVE SEARCH STATE ---
  const [suggestions, setSuggestions] = useState<Participant[]>([]);
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);

  // --- EVENT SELECTION ---
  const [eventInput, setEventInput] = useState("");
  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [entries, setEntries] = useState<WinnerEntry[]>(initialEntriesState);

  // ⚡ BOOT & WSS SYNC
  useEffect(() => {
    const initializeNode = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return window.location.assign("/judge/login");
      setJudgeEmail(user.email || "unknown");

      const [rulesRes, eventsRes, ledgerRes] = await Promise.all([
        supabase.from("point_rules").select("*"),
        supabase.from("events").select("id, name, category, event_code, event_mode, event_type, mark_tier").neq("status", "Declared"),
        supabase.from("results").select(`
          id, event_id, points, position, grade, status, created_at,
          participants ( id, name, category, participant_id, teams(name) ), 
          events ( id, event_code, name, category, mark_tier )
        `).eq("judge_email", user.email).order("created_at", { ascending: false }).limit(50),
      ]);

      if (rulesRes.data) setPointRules(rulesRes.data);
      if (eventsRes.data) setLiveEvents(eventsRes.data);
      if (ledgerRes.data) setLedger(ledgerRes.data);

      setLoading((prev) => ({ ...prev, boot: false }));

      const channel = supabase.channel("judge-ledger")
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "results", filter: `judge_email=eq.${user.email}` },
          (payload) => setLedger((prev) => prev.map((item) => item.id === payload.new.id ? { ...item, status: payload.new.status } : item ))
        )
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "results", filter: `judge_email=eq.${user.email}` },
          (payload) => setLedger((prev) => prev.filter((item) => item.id !== payload.old.id))
        ).subscribe();

      return () => { supabase.removeChannel(channel); };
    };
    initializeNode();
  }, []);

  const handleKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) setCapsLockOn(e.getModifierState("CapsLock"));
  };

  // ⚡ EVENT SEARCH
  const suggestedEvents = useMemo(() => {
    if (!eventInput || activeEvent) return [];
    const q = eventInput.toLowerCase().trim();
    return liveEvents.filter((e) => e.event_code.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)).slice(0, 5);
  }, [eventInput, liveEvents, activeEvent]);

  // ⚡ EVENT LOCK & RECALL LOGIC (For Edit Mode)
  const lockEventAndRecall = async (evt: EventData) => {
    setActiveEvent(evt);
    setEventInput("");
    setLoading(prev => ({ ...prev, recallingEvent: true }));

    const existingScores = ledger.filter(l => l.event_id === evt.id);
    
    if (existingScores.length > 0) {
      setIsEditMode(true);
      const populatedEntries = initialEntriesState.map(defaultEntry => {
        const matchingScore = existingScores.find(s => s.position.toString() === defaultEntry.position);
        if (matchingScore) {
          return {
            ...defaultEntry,
            result_id: matchingScore.id,
            selectedStudent: matchingScore.participants,
            grade: matchingScore.grade || "None"
          };
        }
        return defaultEntry;
      });
      setEntries(populatedEntries);
    } else {
      setIsEditMode(false);
      setEntries(initialEntriesState);
    }
    setLoading(prev => ({ ...prev, recallingEvent: false }));
  };

  const handleEventKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) setCapsLockOn(e.getModifierState("CapsLock"));
    if (e.key === "Enter" && suggestedEvents.length > 0) {
      lockEventAndRecall(suggestedEvents[0]);
    }
  };

  // ⚡ DYNAMIC POINT RULES EXTRACTOR
  const activeEventRules = useMemo(() => {
    if (!activeEvent || !pointRules.length) return { grades: [], positions: [] };
    const normalize = (s: string) => (s || "").trim().toUpperCase();

    const matchingRules = pointRules.filter((r) =>
      normalize(r.category) === normalize(activeEvent.category) &&
      normalize(r.event_mode) === normalize(activeEvent.event_mode) &&
      normalize(r.event_type) === normalize(activeEvent.event_type) &&
      normalize(r.mark_tier) === normalize(activeEvent.mark_tier || "A")
    );

    return {
      grades: matchingRules.filter((r) => normalize(r.rule_type) === "GRADE").sort((a, b) => a.award.localeCompare(b.award)),
      positions: matchingRules.filter((r) => normalize(r.rule_type) === "POSITION").sort((a, b) => Number(a.award) - Number(b.award)),
    };
  }, [activeEvent, pointRules]);

  // ⚡ SUPABASE STUDENT SEARCH ENGINE (Debounced)
  useEffect(() => {
    let isMounted = true;
    const activeEntry = activeInputIndex !== null ? entries[activeInputIndex] : null;

    if (!activeEntry || !activeEntry.studentInput || activeEntry.selectedStudent || !activeEvent) {
      setSuggestions([]); setIsSearchingStudent(false); return;
    }

    const fetchSuggestions = async () => {
      const q = activeEntry.studentInput.trim();
      if (q.length < 2) { if (isMounted) { setSuggestions([]); setIsSearchingStudent(false); } return; }
      if (isMounted) setIsSearchingStudent(true);

      let query = supabase.from("participants").select("id, name, category, participant_id, teams(name)");

      if (activeEvent.category.toUpperCase() !== "GENERAL") {
        query = query.ilike("category", activeEvent.category);
      }
      if (/^\d+$/.test(q)) {
        query = query.ilike("participant_id", `%${q}%`);
      } else {
        query = query.ilike("name", `%${q}%`);
      }

      const { data } = await query.limit(5);

      if (isMounted) {
        if (data) setSuggestions(data as unknown as Participant[]);
        setIsSearchingStudent(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => { isMounted = false; clearTimeout(debounce); };
  }, [activeInputIndex, entries, activeEvent]);

  const handleStudentKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.getModifierState) setCapsLockOn(e.getModifierState("CapsLock"));
    if (e.key === "Enter" && activeInputIndex === index && suggestions.length > 0) {
      updateEntry(index, { selectedStudent: suggestions[0], studentInput: "" });
      setActiveInputIndex(null);
    }
  };

  const updateEntry = (index: number, updates: Partial<WinnerEntry>) => {
    setEntries((prev) => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], ...updates };
      return newEntries;
    });
  };

  // ⚡ BATCH SUBMISSION (Inserts & Updates)
  const declareWinners = async () => {
    if (!activeEvent) return;
    
    if (isEditMode && ledger.some(l => l.event_id === activeEvent.id && l.status === 'approved')) {
      return alert("SECURITY LOCK: One or more scores for this event have already been verified by the Admin. You cannot edit them from this terminal.");
    }

    const filledEntries = entries.filter((e) => e.selectedStudent || e.grade);
    const firstPlace = filledEntries.find((e) => e.position === "1");
    if (!firstPlace || !firstPlace.selectedStudent || !firstPlace.grade) {
      return alert("1st Place is strictly required. Please select a student and a grade.");
    }

    const invalidEntry = filledEntries.find(
      (e) => (e.selectedStudent && (!e.grade || e.grade === "None")) || (!e.selectedStudent && e.grade && e.grade !== "None")
    );
    if (invalidEntry) {
      return alert(`Incomplete data for ${invalidEntry.label}. Both Student ID and Grade are required if you are declaring a winner for this position.`);
    }

    const categoryMismatch = filledEntries.some(
      (e) => e.selectedStudent && activeEvent.category.toUpperCase() !== "GENERAL" && e.selectedStudent.category.toUpperCase() !== activeEvent.category.toUpperCase()
    );
    if (categoryMismatch) return alert("System Lock: Attempted to submit a student from outside the event's category.");

    setLoading((prev) => ({ ...prev, submit: true }));
    const normalize = (s: string) => (s || "").trim().toUpperCase();

    const payloadsToInsert = [];
    const payloadsToUpdate = [];

    for (const entry of filledEntries) {
      const gradePts = activeEventRules.grades.find((r) => normalize(r.award) === normalize(entry.grade))?.points || 0;
      const posPts = activeEventRules.positions.find((r) => normalize(r.award) === normalize(entry.position))?.points || 0;
      const calculatedPoints = gradePts + posPts;
      const finalGrade = entry.grade && entry.grade !== "None" ? entry.grade : null;

      const payload = {
        participant_id: entry.selectedStudent!.id,
        event_id: activeEvent.id,
        grade: finalGrade,
        position: parseInt(entry.position),
        points: calculatedPoints,
        judge_email: judgeEmail,
        status: "pending",
      };

      if (entry.result_id) payloadsToUpdate.push({ id: entry.result_id, ...payload });
      else payloadsToInsert.push(payload);
    }

    let fullSuccess = true;
    
    if (isEditMode) {
      const oldRows = ledger.filter(l => l.event_id === activeEvent.id);
      for (const oldRow of oldRows) {
        if (!filledEntries.find(e => e.result_id === oldRow.id)) {
           await supabase.from("results").delete().eq("id", oldRow.id);
           setLedger(prev => prev.filter(l => l.id !== oldRow.id));
        }
      }
    }

    for (const payload of payloadsToUpdate) {
      const { error } = await supabase.from("results").update(payload).eq("id", payload.id);
      if (error) fullSuccess = false;
    }

    if (payloadsToInsert.length > 0) {
      const { data, error } = await supabase.from("results").insert(payloadsToInsert).select("*, participants(id, name, category, participant_id, teams(name)), events(id, event_code, name, category, mark_tier)");
      if (error) fullSuccess = false;
      else setLedger(prev => [...(data || []), ...prev]);
    }

    setLoading((prev) => ({ ...prev, submit: false }));

    if (!fullSuccess) {
      alert("A Transmission Error occurred during the payload sync. Please check the ledger.");
    } else {
      const { data } = await supabase.from("results").select(`id, event_id, points, position, grade, status, created_at, participants ( id, name, category, participant_id, teams(name) ), events ( id, event_code, name, category, mark_tier )`).eq("judge_email", judgeEmail).order("created_at", { ascending: false }).limit(50);
      if (data) setLedger(data);

      setEntries(initialEntriesState);
      setActiveEvent(null);
      setEventInput("");
      setIsEditMode(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const recallPayload = async (id: string) => {
    const { data: checkData } = await supabase.from("results").select("status").eq("id", id).single();
    if (checkData?.status !== "pending") return alert("Recall Failed: The Admin has already locked this score.");
    const { error } = await supabase.from("results").delete().eq("id", id);
    if (!error) setLedger((prev) => prev.filter((item) => item.id !== id));
  };

  // ⚡ EVENT CARD GROUPING ALGORITHM
  const groupedLedger = useMemo(() => {
    const filtered = ledger.filter((item) => {
      const q = ledgerSearch.toLowerCase().trim();
      const matchesSearch = item.events?.name?.toLowerCase().includes(q) || item.events?.event_code?.toLowerCase().includes(q) || item.participants?.name?.toLowerCase().includes(q) || item.participants?.participant_id?.includes(q);
      const matchesStatus = ledgerStatusFilter === "All" || item.status === ledgerStatusFilter;
      return matchesSearch && matchesStatus;
    });

    const groups = {} as Record<string, { event: any; results: any[] }>;
    filtered.forEach((item) => {
      const evtId = item.event_id || item.events?.event_code;
      if (!groups[evtId]) groups[evtId] = { event: item.events, results: [] };
      groups[evtId].results.push(item);
    });

    Object.values(groups).forEach(g => g.results.sort((a, b) => Number(a.position || 99) - Number(b.position || 99)));
    return Object.values(groups).sort((a, b) => Math.max(...b.results.map(r => new Date(r.created_at).getTime())) - Math.max(...a.results.map(r => new Date(r.created_at).getTime())));
  }, [ledger, ledgerSearch, ledgerStatusFilter]);

  if (loading.boot) return (
    <div className="h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-500" /></div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 pb-32 font-sans relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* 🟢 HEADER */}
      <header className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-xl border-b border-white/5 px-6 py-4 md:px-12">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]"><Gavel className="w-5 h-5 text-emerald-500" /></div>
            <h1 className="text-xl font-black tracking-tighter uppercase hidden sm:block">Declare <span className="text-emerald-500 italic">Winners</span></h1>
          </div>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} className="bg-red-500/10 text-red-500 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20">
            <LogOut className="w-4 h-4 inline mr-2" /> Exit Session
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 md:px-12 mt-10 relative z-10">
        
        {/* 🟢 STEP 1: EVENT SELECTION */}
        <div className="mb-10 animate-in fade-in duration-500">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-3 ml-2">1. Target Event ID</p>
          <div className="relative">
            <div className={`flex items-center bg-[#0a0a0a] border ${activeEvent ? "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "border-white/10 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/30"} rounded-2xl p-2 transition-all relative`}>
              <Hash className="w-6 h-6 text-zinc-500 ml-3" />
              <input
                type="text" placeholder="Scan Event ID (e.g. EW-101)"
                value={activeEvent ? `${activeEvent.event_code}: ${activeEvent.name}` : eventInput}
                onChange={(e) => { setEventInput(e.target.value); setActiveEvent(null); setEntries(initialEntriesState); setIsEditMode(false); }}
                onKeyDown={handleEventKeyDown} disabled={loading.recallingEvent}
                className="flex-1 w-full bg-transparent border-none outline-none text-white font-black text-xl md:text-2xl py-3 pl-3 pr-24 uppercase placeholder-zinc-700 truncate tracking-wide disabled:opacity-50"
              />

              {loading.recallingEvent && <Loader2 className="absolute right-14 w-5 h-5 animate-spin text-emerald-500" />}

              {capsLockOn && !loading.recallingEvent && (
                <div className="absolute right-14 top-1/2 -translate-y-1/2 bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 pointer-events-none animate-in zoom-in-95">
                  <AlertTriangle className="w-3 h-3" /> Caps
                </div>
              )}

              {activeEvent && (
                <button onClick={() => { setActiveEvent(null); setEventInput(""); setEntries(initialEntriesState); setIsEditMode(false); }} className="p-3 text-zinc-500 hover:text-red-500 transition-colors rounded-xl hover:bg-white/5">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {!activeEvent && suggestedEvents.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] z-[100]">
                {suggestedEvents.map((evt) => (
                  <button key={evt.id} onClick={() => lockEventAndRecall(evt)} className="w-full text-left px-6 py-4 border-b border-white/5 hover:bg-emerald-500/10 hover:pl-8 text-white font-bold text-sm uppercase flex justify-between items-center group transition-all">
                    <span className="group-hover:text-emerald-400 font-black text-lg tracking-tight">{evt.event_code}: {evt.name}</span>
                    <span className="bg-black border border-white/5 text-zinc-400 px-3 py-1.5 rounded-lg text-[9px] tracking-widest">{evt.category} • Tier {evt.mark_tier || "A"}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ⚡ NEW: DYNAMIC MATRIX DISPLAY */}
          {activeEvent && (
            <div className="mt-4 bg-[#0a0a0a] border border-white/5 rounded-2xl p-5 animate-in fade-in zoom-in-95 duration-500 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                  <Database className="w-3 h-3"/> Active SQL Matrix Rules
                </h3>
                <span className="bg-black border border-white/10 px-3 py-1 rounded text-[9px] font-mono uppercase text-zinc-500">Tier {activeEvent.mark_tier || 'A'} Engine</span>
              </div>
              
              {activeEventRules.grades.length === 0 && activeEventRules.positions.length === 0 ? (
                <div className="p-4 bg-red-950/30 border border-red-500/30 rounded-xl flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <p className="text-xs font-mono text-red-400">CRITICAL: No point rules exist for this specific event classification.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-black border border-white/5 p-4 rounded-xl">
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-3">Position Points</p>
                    <div className="flex flex-wrap gap-2">
                      {activeEventRules.positions.map(p => (
                        <span key={p.award} className="bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-inner">
                          <Trophy className="w-3 h-3 text-amber-500" /> {p.award}: <span className="text-indigo-400">{p.points} <span className="text-[8px]">PTS</span></span>
                        </span>
                      ))}
                      {activeEventRules.positions.length === 0 && <span className="text-xs text-zinc-600 font-mono">N/A</span>}
                    </div>
                  </div>
                  <div className="bg-black border border-white/5 p-4 rounded-xl">
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-3">Grade Points</p>
                    <div className="flex flex-wrap gap-2">
                      {activeEventRules.grades.map(g => (
                        <span key={g.award} className="bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-inner">
                          <Check className="w-3 h-3 text-emerald-500" /> Grade {g.award}: <span className="text-indigo-400">{g.points} <span className="text-[8px]">PTS</span></span>
                        </span>
                      ))}
                      {activeEventRules.grades.length === 0 && <span className="text-xs text-zinc-600 font-mono">N/A</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 🟢 STEP 2: THE WINNER CARDS MATRIX */}
        <div className={`transition-all duration-700 ${!activeEvent || loading.recallingEvent ? "opacity-30 pointer-events-none scale-[0.98] blur-[2px]" : "scale-100 relative z-20"}`}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 px-2 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-3xl font-black uppercase text-white tracking-tighter flex items-center gap-3">
                {isEditMode ? <><RefreshCcw className="w-6 h-6 text-indigo-400" /> Edit Declarations</> : "Declare Winners"}
              </h2>
            </div>
            {activeEvent && (
              <div className="flex flex-wrap items-center gap-2 mt-4 md:mt-0">
                {isEditMode && <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">Active Overwrite Mode</span>}
                <div className="bg-emerald-500/10 px-4 py-1.5 rounded-lg border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                  <Lock className="w-3 h-3 shrink-0" /> <span>{activeEvent.category}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 mb-10 flex flex-col">
            {entries.map((entry, index) => {
              // ⚡ THE BUG FIX: Only grab suggestions if the state length is > 0 and index matches
              const activeSuggestions = activeInputIndex === index ? suggestions : [];
              const showNoMatchWarning = activeInputIndex === index && entry.studentInput.length >= 2 && activeSuggestions.length === 0 && !entry.selectedStudent && !isSearchingStudent;

              return (
                <div key={index} style={{ zIndex: 50 - index }} className={`bg-[#0a0a0a] border ${entry.required && !entry.selectedStudent ? "border-amber-500/30" : entry.result_id ? "border-indigo-500/30" : "border-white/5"} rounded-[2rem] p-6 md:p-8 relative transition-all shadow-xl`}>
                  
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                      <Trophy className={`w-4 h-4 ${index === 0 ? "text-yellow-500" : index === 1 ? "text-zinc-300" : "text-amber-700"}`} />
                      <span className={index === 0 ? "text-emerald-500" : ""}>{entry.label}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      {entry.result_id && <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded flex items-center gap-1"><Check className="w-3 h-3"/> Loaded</span>}
                      {!entry.required && !entry.selectedStudent && <span className="text-[9px] font-mono text-zinc-600 uppercase border border-white/5 px-2 py-1 rounded">Optional</span>}
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Student ID Search */}
                    <div className="flex-1 relative">
                      <div className={`flex items-center bg-black border ${entry.selectedStudent ? (entry.result_id ? "border-indigo-500/50 bg-indigo-500/5" : "border-emerald-500/50 bg-emerald-500/5") : activeInputIndex === index ? "border-emerald-500/50 ring-1 ring-emerald-500/30" : "border-white/10"} rounded-2xl p-1.5 relative transition-all`}>
                        <Search className={`w-5 h-5 ml-3 shrink-0 ${activeInputIndex === index || entry.selectedStudent ? 'text-emerald-500' : 'text-zinc-600'}`} />
                        <input
                          type="text" placeholder={`Search Eligible ${activeEvent?.category || "Students"}...`}
                          value={entry.selectedStudent ? entry.selectedStudent.participant_id : entry.studentInput}
                          onChange={(e) => { updateEntry(index, { studentInput: e.target.value, selectedStudent: null }); setActiveInputIndex(index); }}
                          onFocus={() => setActiveInputIndex(index)}
                          onKeyDown={(e) => handleStudentKeyDown(e, index)}
                          className={`w-full bg-transparent border-none outline-none font-black text-lg py-3 pl-3 pr-24 placeholder-zinc-700 truncate tracking-widest ${entry.selectedStudent ? 'text-emerald-400' : 'text-white'}`}
                        />

                        {activeInputIndex === index && isSearchingStudent && <Loader2 className="absolute right-12 w-5 h-5 animate-spin text-emerald-500" />}

                        {capsLockOn && !isSearchingStudent && (
                          <div className="absolute right-12 top-1/2 -translate-y-1/2 bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1 pointer-events-none animate-in fade-in">
                            <AlertTriangle className="w-3 h-3" /> Caps
                          </div>
                        )}

                        {entry.selectedStudent && (
                          <button onClick={() => updateEntry(index, { selectedStudent: null, studentInput: "", grade: "" })} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      {/* Suggestions Dropdown */}
                      {activeInputIndex === index && activeSuggestions.length > 0 && !entry.selectedStudent && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[100] flex flex-col">
                          {activeSuggestions.map((student) => (
                            <button key={student.id} onClick={() => { updateEntry(index, { selectedStudent: student, studentInput: "" }); setActiveInputIndex(null); }} className="w-full text-left px-5 py-4 border-b border-white/5 hover:bg-emerald-500/10 hover:pl-7 flex justify-between items-center group transition-all">
                              <span className="font-black text-white text-lg group-hover:text-emerald-400 uppercase tracking-widest">{student.participant_id}</span>
                              <div className="flex flex-col text-right">
                                <span className="text-sm font-bold text-zinc-300 uppercase group-hover:text-white transition-colors">{student.name}</span>
                                <span className="text-[9px] font-mono text-zinc-500 uppercase group-hover:text-emerald-500/70 transition-colors">{student.teams?.name} • {student.category}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Locked No Match Warning */}
                      {showNoMatchWarning && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-red-950/90 backdrop-blur-xl border border-red-500/50 rounded-2xl overflow-hidden shadow-2xl z-[100] p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
                          <Lock className="w-5 h-5 text-red-500 shrink-0" />
                          <div className="flex flex-col">
                            <p className="text-red-400 text-[10px] font-black uppercase tracking-widest leading-none">No Match Found</p>
                            <p className="text-red-500/70 text-[8px] font-mono mt-1 uppercase">Ensure ID belongs to the '{activeEvent?.category}' category.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Grade Selector */}
                    <select
                      value={entry.grade} onChange={(e) => updateEntry(index, { grade: e.target.value })}
                      className={`w-full md:w-56 bg-[#0a0a0a] border ${entry.grade ? (entry.result_id ? "border-indigo-500/50 text-indigo-400 bg-indigo-500/5" : "border-emerald-500/50 text-emerald-400 bg-emerald-500/5") : "border-white/10 text-white"} font-black py-4 px-5 rounded-2xl outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 uppercase tracking-widest text-sm cursor-pointer appearance-none text-center transition-all`}
                    >
                      <option value="">- Select Grade -</option>
                      {activeEventRules.grades.map(g => (
                        <option key={`opt-${g.award}`} value={g.award}>Grade {g.award}</option>
                      ))}
                      <option value="None">No Grade</option>
                    </select>
                  </div>

                  {/* 🟢 POLISHED METADATA BANNER & LIVE SCORE PREVIEW */}
                  {entry.selectedStudent && (
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      
                      <div className={`bg-black/50 border ${entry.result_id ? 'border-indigo-500/20' : 'border-white/5'} px-4 py-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3`}>
                        <span className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                          <UserCheck className={`w-4 h-4 ${entry.result_id ? 'text-indigo-400' : 'text-emerald-500'}`} /> {entry.selectedStudent.name}
                        </span>
                        <span className="hidden sm:inline text-zinc-700">|</span>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${entry.result_id ? 'text-indigo-400' : 'text-emerald-500'}`}>
                          Team: {entry.selectedStudent.teams?.name} • Cat: {entry.selectedStudent.category}
                        </span>
                      </div>

                      {/* ⚡ NEW: Live Points Predictor */}
                      {(() => {
                        const gPts = activeEventRules.grades.find((r) => r.award.toUpperCase() === entry.grade.toUpperCase())?.points || 0;
                        const pPts = activeEventRules.positions.find((r) => r.award === entry.position)?.points || 0;
                        const totalPts = gPts + pPts;
                        
                        return (
                          <div className="bg-indigo-500/10 border border-indigo-500/20 px-5 py-2.5 rounded-xl flex items-center gap-3 animate-in fade-in shadow-inner">
                            <Zap className="w-4 h-4 text-indigo-500" />
                            <div className="flex flex-col text-right">
                              <span className="text-xs font-black text-white uppercase tracking-wider leading-none">
                                {totalPts} <span className="text-[9px] text-indigo-400">PTS</span>
                              </span>
                              <span className="text-[8px] font-mono text-indigo-500/70 uppercase mt-0.5">Calculated</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={declareWinners} disabled={loading.submit || !activeEvent} className={`w-full text-white py-6 rounded-2xl font-black uppercase tracking-[0.3em] text-sm md:text-base transition-all disabled:opacity-20 flex justify-center items-center gap-3 border ${isEditMode ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400/20 shadow-[0_0_30px_rgba(79,70,229,0.3)]' : 'bg-red-600 hover:bg-red-500 border-red-400/20 shadow-[0_0_30px_rgba(220,38,38,0.3)]'}`}>
            {loading.submit ? <Loader2 className="w-6 h-6 animate-spin" /> : <> {isEditMode ? 'Overwrite & Save Changes' : 'Save & Declare Winners'} <Check className="w-6 h-6" /></>}
          </button>
        </div>

        {/* 🟢 RECENT SUBMISSIONS LEDGER (Event Cards) */}
        <div className="mt-20 border-t border-white/5 pt-10 relative z-0">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-3">
              <Clock className="w-5 h-5" /> Recent Event Declarations
            </h2>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input 
                  type="text" placeholder="Search events..." 
                  value={ledgerSearch} onChange={e => setLedgerSearch(e.target.value)}
                  className="bg-[#0a0a0a] border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white outline-none focus:border-emerald-500 w-full sm:w-48 transition-all"
                />
              </div>
              <select 
                value={ledgerStatusFilter} onChange={e => setLedgerStatusFilter(e.target.value)}
                className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500 cursor-pointer uppercase tracking-widest transition-all"
              >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Locked</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="space-y-6">
            {groupedLedger.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-white/5 bg-[#0a0a0a] rounded-[2rem] text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
                No declarations match the current filters.
              </div>
            ) : (
              groupedLedger.map((group) => (
                <div key={group.event.id || group.event.event_code} className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 transition-all hover:border-white/20">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-white/5 pb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-500 font-black text-lg tracking-tight bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                        {group.event.event_code}
                      </span>
                      <span className="text-white font-black uppercase tracking-wide">{group.event.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[9px] font-black uppercase tracking-widest text-zinc-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2">
                        {group.event.category} <span className="text-purple-400">• Tier {group.event.mark_tier || 'A'}</span>
                      </div>
                      <button onClick={() => lockEventAndRecall(group.event)} className="p-1.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-lg transition-colors" title="Edit these declarations">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {group.results.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-black/40 rounded-xl border border-white/5 hover:bg-white/5 transition-colors">
                        
                        <div className="flex items-center gap-4">
                          <Trophy className={`w-5 h-5 shrink-0 ${item.position?.toString() === "1" ? "text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]" : item.position?.toString() === "2" ? "text-zinc-300" : "text-amber-700"}`} />
                          <div>
                            <p className="font-black text-sm text-white uppercase tracking-tight">{item.participants?.name}</p>
                            <p className="font-mono text-[10px] text-zinc-500 uppercase mt-0.5">UID: {item.participants?.participant_id}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 border-t border-white/5 sm:border-0 pt-3 sm:pt-0">
                          <div className="text-right">
                            <p className="font-black text-emerald-400 text-base leading-none">{item.points} <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Pts</span></p>
                            <p className="font-mono text-[9px] text-zinc-400 uppercase mt-1">Grade {item.grade || 'None'}</p>
                          </div>
                          
                          <div className="w-px h-8 bg-white/10 hidden sm:block" />
                          
                          <div className="flex items-center gap-3">
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border ${item.status === "approved" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : item.status === "rejected" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"}`}>
                              {item.status}
                            </span>
                            {item.status === "pending" && (
                              <button onClick={() => recallPayload(item.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20" title="Recall Payload">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>

                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}