"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Zap, Check, Loader2, Database, AlertTriangle, ScanLine, Tag, ShieldCheck, Lock, FileQuestion, Terminal as TerminalIcon
} from 'lucide-react';

export default function SmartEntryNode() {
  // --- 1. SYSTEM STATE ---
  const [pointRules, setPointRules] = useState<any[]>([]);
  const [isSystemReady, setIsSystemReady] = useState(false);

  // --- 2. TERMINAL INPUTS ---
  const [participantIdQuery, setParticipantIdQuery] = useState('');
  const [eventIdQuery, setEventIdQuery] = useState('');
  const [grade, setGrade] = useState('');
  const [position, setPosition] = useState('');

  // --- 3. DATABASE RESOLUTION ---
  const [student, setStudent] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [calculatedPoints, setCalculatedPoints] = useState(0);

  // --- 4. UI FEEDBACK STATES ---
  const [loadingStudent, setLoadingStudent] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ⚡ BOOT: Fetch the SQL Point Matrix
  useEffect(() => {
    const initializeSystem = async () => {
      const { data } = await supabase.from('point_rules').select('*');
      if (data) setPointRules(data);
      setIsSystemReady(true);
    };
    initializeSystem();
  }, []);

  // ⚡ TERMINAL 1: Resolve Student
  useEffect(() => {
    const resolveStudent = async () => {
      const queryStr = participantIdQuery.trim();
      if (queryStr.length < 2) { setStudent(null); return; }
      
      setLoadingStudent(true);
      let dbQuery = supabase.from('participants').select('*, teams(name)');
      
      if (/^\d+$/.test(queryStr)) {
        dbQuery = dbQuery.or(`participant_id.eq.${queryStr},name.ilike.%${queryStr}%`);
      } else {
        dbQuery = dbQuery.ilike('name', `%${queryStr}%`);
      }

      const { data } = await dbQuery.limit(1).maybeSingle();
      setStudent(data || null);
      setLoadingStudent(false);
    };
    const debounce = setTimeout(resolveStudent, 400);
    return () => clearTimeout(debounce);
  }, [participantIdQuery]);

  // ⚡ TERMINAL 2: Resolve Event (Now fetches mark_tier natively via '*')
  useEffect(() => {
    const resolveEvent = async () => {
      const queryStr = eventIdQuery.trim();
      if (queryStr.length < 2) { setEvent(null); return; }
      
      setLoadingEvent(true);
      const { data } = await supabase
        .from('events')
        .select('*')
        .or(`event_code.ilike.%${queryStr}%,name.ilike.%${queryStr}%`)
        .limit(1)
        .maybeSingle();

      setEvent(data || null);
      setLoadingEvent(false);
    };
    const debounce = setTimeout(resolveEvent, 400);
    return () => clearTimeout(debounce);
  }, [eventIdQuery]);

  // ⚡ DIAGNOSTIC LOCKS
  // 1. Check Category Mismatch (⚡ UPGRADED: Allows 'General' events to bypass the lock)
  const categoryMismatch = student && event && 
    event.category?.trim().toUpperCase() !== 'GENERAL' && 
    student.category?.trim().toUpperCase() !== event.category?.trim().toUpperCase();
  
  // 2. Check if SQL Matrix has rules (⚡ UPGRADED: Now checks Mark Tier and maps to Event Category)
  const normalize = (str: string) => (str || '').trim().toUpperCase();
  
  const hasMatrixRules = student && event && pointRules.some(r => 
    normalize(r.category) === normalize(event.category) && // Uses EVENT category for accurate team event pointing
    normalize(r.event_mode) === normalize(event.event_mode) &&
    normalize(r.event_type) === normalize(event.event_type) &&
    normalize(r.mark_tier) === normalize(event.mark_tier || 'A')
  );

  // ⚡ SQL-STRICT MATRIX ALGORITHM
  useEffect(() => {
    if (categoryMismatch || !hasMatrixRules) {
      setCalculatedPoints(0);
      return;
    }

    let pts = 0;
    
    if (student && event && pointRules.length > 0) {
      const findPointValue = (targetRuleType: string, targetAward: string) => {
        const rule = pointRules.find(r => 
          normalize(r.category) === normalize(event.category) &&
          normalize(r.event_mode) === normalize(event.event_mode) &&
          normalize(r.event_type) === normalize(event.event_type) &&
          normalize(r.mark_tier) === normalize(event.mark_tier || 'A') && // ⚡ TIERS ENABLED
          normalize(r.rule_type) === normalize(targetRuleType) &&
          normalize(r.award) === normalize(targetAward)
        );
        return rule ? Number(rule.points) : 0;
      };

      if (grade && grade !== 'None') pts += findPointValue('grade', grade);
      if (position && position !== 'None') pts += findPointValue('position', position);
    }
    
    setCalculatedPoints(pts);
  }, [grade, position, student, event, pointRules, categoryMismatch, hasMatrixRules]);

  // ⚡ ADMIN ACTION: Transmit Verified Payload
  const commitScoreToDatabase = async () => {
    if (!student || !event || categoryMismatch || !hasMatrixRules) return;
    if ((!grade || grade === 'None') && (!position || position === 'None')) return;

    setIsSubmitting(true);
    const { data: user } = await supabase.auth.getUser();

    const { error } = await supabase.from('results').insert([{
      participant_id: student.id,
      event_id: event.id,
      grade: grade || 'None',
      position: position || 'None',
      points: calculatedPoints, 
      judge_email: user.user?.email || 'admin_node',
      status: 'approved' // Bypasses judge pending queue directly!
    }]);

    setIsSubmitting(false);

    if (!error) {
      setParticipantIdQuery(''); setEventIdQuery(''); setGrade(''); setPosition('');
    } else {
      alert("Database Insertion Error: " + error.message);
    }
  };

  const getLockReason = () => {
    if (!student) return "Awaiting Target Student";
    if (!event) return "Awaiting Target Event";
    if (categoryMismatch) return "Category Protocol Violation";
    if (!hasMatrixRules) return "Missing SQL Matrix Rules";
    if ((!grade || grade === 'None') && (!position || position === 'None')) return "Grade or Position Required";
    return "Ready for Transmit";
  };

  const isButtonLocked = isSubmitting || !student || !event || categoryMismatch || !hasMatrixRules || ((!grade || grade === 'None') && (!position || position === 'None'));

  if (!isSystemReady) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-zinc-500">
        <Database className="w-8 h-8 animate-bounce text-indigo-500" />
        <p className="text-xs font-black uppercase tracking-widest">Booting Smart Matrix...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">

      {/* Dynamic Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic flex items-center gap-3">
            <Zap className="w-8 h-8 text-indigo-500" /> Smart<span className="text-indigo-500">Entry</span>
          </h1>
          <p className="text-zinc-500 font-mono text-xs mt-2 uppercase tracking-widest">Manual score override and database ingestion</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20 text-[10px] font-black uppercase tracking-[0.2em]">
            <Database className="w-3 h-3" /> Matrix Synced
          </div>
          <div className="flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-widest pr-1">
            <ShieldCheck className="w-3 h-3" /> Enforcement Protocol Online
          </div>
        </div>
      </header>

      {/* TERMINAL BAYS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* STUDENT RESOLVER */}
        <div className="bg-zinc-900/40 border border-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] focus-within:border-emerald-500/30 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <ScanLine className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Target Student</span>
          </div>
          <div className="relative">
            <input
              value={participantIdQuery} onChange={e => setParticipantIdQuery(e.target.value)} placeholder="ID OR NAME..."
              className="w-full bg-black border border-zinc-800 p-5 rounded-2xl font-mono text-xl md:text-2xl text-emerald-400 outline-none focus:border-emerald-500 uppercase transition-colors"
            />
            {loadingStudent && <Loader2 className="absolute right-5 top-5 w-6 h-6 animate-spin text-emerald-500" />}
          </div>
          
          <div className="mt-6 h-[100px] flex flex-col justify-center">
            {student ? (
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl animate-in zoom-in-95">
                <p className="text-xl font-black text-white tracking-tight">{student.name}</p>
                <p className="text-[10px] font-mono text-emerald-400 mt-2 uppercase tracking-[0.2em] flex items-center gap-2 flex-wrap">
                  <span className="bg-emerald-500/20 px-2 py-0.5 rounded">{student.teams?.name}</span>
                  <span className="text-zinc-500">•</span> 
                  <span>{student.category}</span>
                </p>
              </div>
            ) : participantIdQuery.length > 2 && !loadingStudent ? (
              <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                <AlertTriangle className="w-6 h-6" />
                <p className="font-mono text-[10px] uppercase tracking-widest">Identity Unknown</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* EVENT RESOLVER */}
        <div className="bg-zinc-900/40 border border-white/5 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] focus-within:border-purple-500/30 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <Tag className="w-5 h-5 text-purple-400" />
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Target Event</span>
          </div>
          <div className="relative">
            <input
              value={eventIdQuery} onChange={e => setEventIdQuery(e.target.value)} placeholder="CODE OR NAME..."
              className="w-full bg-black border border-zinc-800 p-5 rounded-2xl font-mono text-xl md:text-2xl text-purple-400 outline-none focus:border-purple-500 uppercase transition-colors"
            />
            {loadingEvent && <Loader2 className="absolute right-5 top-5 w-6 h-6 animate-spin text-purple-500" />}
          </div>
          
          <div className="mt-6 h-[100px] flex flex-col justify-center">
            {event ? (
              <div className="bg-purple-500/5 border border-purple-500/20 p-5 rounded-2xl animate-in zoom-in-95">
                <p className="text-xl font-black text-white tracking-tight">{event.event_code}: {event.name}</p>
                <p className="text-[10px] font-mono text-purple-400 mt-2 uppercase tracking-[0.2em] flex flex-wrap gap-x-3 gap-y-1">
                  <span className="bg-purple-500/20 px-2 py-0.5 rounded text-purple-300">Tier {event.mark_tier || 'A'}</span>
                  <span className="text-zinc-500">•</span> 
                  <span>{event.category}</span>
                  <span className="text-zinc-500">•</span> 
                  <span>{event.event_mode}</span>
                  <span className="text-zinc-500">•</span> 
                  <span>{event.event_type}</span>
                </p>
              </div>
            ) : eventIdQuery.length > 0 && !loadingEvent ? (
              <div className="flex flex-col items-center justify-center text-red-500 gap-2">
                 <AlertTriangle className="w-6 h-6" />
                 <p className="font-mono text-[10px] uppercase tracking-widest">Event Node Invalid</p>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* DYNAMIC SCORING ENGINE */}
      <div className={`border rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 relative overflow-hidden transition-all duration-500 ${categoryMismatch || (student && event && !hasMatrixRules) ? 'bg-red-950/20 border-red-500/50' : 'bg-zinc-900/60 border-white/5'}`}>

        {/* PROTOCOL LOCKS */}
        {categoryMismatch && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 p-6">
            <Lock className="w-12 md:w-16 h-12 md:h-16 text-red-500 mb-4" />
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase text-center">Protocol Violation</h2>
            <p className="text-red-400 font-mono text-[10px] md:text-xs mt-3 uppercase tracking-widest text-center max-w-md leading-relaxed">
              A <span className="text-white font-bold bg-white/10 px-1 rounded">{student.category}</span> participant cannot be assigned points in a <span className="text-white font-bold bg-white/10 px-1 rounded">{event.category}</span> event. Clear the terminal and retry.
            </p>
          </div>
        )}

        {/* MISSING SQL RULE DETECTOR */}
        {!categoryMismatch && student && event && !hasMatrixRules && (
           <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 p-6">
             <FileQuestion className="w-12 md:w-16 h-12 md:h-16 text-amber-500 mb-4" />
             <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase text-center">SQL Matrix Error</h2>
             <p className="text-amber-400 font-mono text-[10px] md:text-xs mt-3 uppercase tracking-widest text-center max-w-md leading-relaxed">
               No point rules exist in your database for <span className="text-white font-bold bg-white/10 px-1 rounded">{event.category} • {event.event_mode} • {event.event_type} • Tier {event.mark_tier || 'A'}</span>. Update your SQL table.
             </p>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center relative z-10">

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Award Grade</label>
            <select
              value={grade} onChange={e => setGrade(e.target.value)} disabled={categoryMismatch || !hasMatrixRules}
              className="w-full bg-black border border-zinc-800 p-5 rounded-2xl font-black uppercase tracking-widest text-white outline-none focus:border-indigo-500 cursor-pointer appearance-none text-center text-xs transition-colors"
            >
              <option value="">-- Select --</option>
              <option value="A">A Grade</option>
              <option value="B">B Grade</option>
              <option value="C">C Grade</option>
              <option value="None">No Grade</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Award Position</label>
            <select
              value={position} onChange={e => setPosition(e.target.value)} disabled={categoryMismatch || !hasMatrixRules}
              className="w-full bg-black border border-zinc-800 p-5 rounded-2xl font-black uppercase tracking-widest text-white outline-none focus:border-indigo-500 cursor-pointer appearance-none text-center text-xs transition-colors"
            >
              <option value="">-- Select --</option>
              <option value="1">1st Place</option>
              <option value="2">2nd Place</option>
              <option value="3">3rd Place</option>
              <option value="None">No Position</option>
            </select>
          </div>

          <div className="bg-black/80 border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center justify-center h-full min-h-[140px]">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-2">Matrix Output</span>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black tracking-tighter text-indigo-400 leading-none">{calculatedPoints}</span>
              <span className="text-xs font-black text-indigo-600">PTS</span>
            </div>
          </div>
        </div>

        {/* Action Button & Status Feed */}
        <div className="mt-10 space-y-4 relative z-10">
          
          <div className="flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest">
            <TerminalIcon className="w-3 h-3 text-zinc-500" />
            <span className={isButtonLocked ? 'text-amber-500/80' : 'text-emerald-500 animate-pulse'}>
              System Status: {getLockReason()}
            </span>
          </div>

          <button
            onClick={commitScoreToDatabase} disabled={isButtonLocked}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[10px] md:text-xs transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] disabled:opacity-10 disabled:grayscale flex items-center justify-center gap-4 group"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Lock Score to Database <Check className="w-5 h-5 group-hover:scale-125 transition-transform" /></>}
          </button>
        </div>
      </div>

    </div>
  );
}