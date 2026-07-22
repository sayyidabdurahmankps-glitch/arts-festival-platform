"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { ShieldCheck, Loader2, Check, X, RefreshCw, Clock, Terminal, Zap, ShieldAlert } from 'lucide-react'

// Helper to format timestamps into "2 mins ago"
const timeAgo = (dateString: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
};

export default function ApprovalsQueue() {
  const [pending, setPending] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchPending = async () => {
    setSyncing(true)
    const { data, error } = await supabase.from('results').select(`
      id, points, grade, position, judge_email, created_at,
      participants ( name, participant_id, teams ( name ) ),
      events ( name, category, event_mode )
    `).eq('status', 'pending').order('created_at', { ascending: true })
    
    if (data) setPending(data)
    if (error) console.error("Error fetching approvals:", error)
    
    setLoading(false)
    setSyncing(false)
  }

  useEffect(() => {
    fetchPending()

    // Real-time WSS Subscription for live queue updates
    const channel = supabase.channel('admin-approvals')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'results', 
        filter: "status=eq.pending" 
      }, () => {
        fetchPending()
      }).subscribe()
      
    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id)
    
    // Optimistic UI Update: temporarily hide it from the list for a snappy feel
    const itemToProcess = pending.find(item => item.id === id);
    setPending(prev => prev.filter(item => item.id !== id))
    
    try {
      const { error } = await supabase.from('results').update({ status }).eq('id', id)
      if (error) throw error;
    } catch (error) {
      console.error("Action failed:", error)
      alert(`Failed to mark as ${status}. Reverting...`)
      // Revert the optimistic update if it failed
      if (itemToProcess) setPending(prev => [...prev, itemToProcess].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-zinc-500">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        <p className="text-xs font-black uppercase tracking-[0.2em]">Intercepting Node Traffic...</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-700 max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* ⚡ UNIFIED HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-8 gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
            <ShieldCheck className="w-10 h-10 text-amber-500" />
            Approvals <span className="text-amber-500">Node</span>
          </h1>
          <div className="flex items-center gap-4 mt-3 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">
            <span className="flex items-center gap-2"><Terminal className="w-3 h-3 text-amber-500" /> Validation Gateway</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
            <span className="flex items-center gap-2"><ShieldAlert className="w-3 h-3 text-red-500" /> Immutable Commit</span>
          </div>
        </div>
        
        {/* Sync & Count Console */}
        <div className="flex items-center gap-4 bg-black/80 border border-white/5 px-6 py-4 rounded-[2rem]">
          <button 
            onClick={fetchPending}
            disabled={syncing}
            className="p-2.5 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
            title="Force Sync"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Queue Status</span>
            <span className={`text-xs font-black font-mono tracking-widest flex items-center gap-2 ${pending.length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${pending.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              {pending.length} PENDING
            </span>
          </div>
        </div>
      </header>

      {/* ⚡ QUEUE LIST */}
      <div className="space-y-4">
        {pending.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center border border-dashed border-white/5 bg-black/40 backdrop-blur-md rounded-[3rem]">
            <ShieldCheck className="w-16 h-16 text-emerald-500/20 mb-6" />
            <p className="text-emerald-500 font-black text-sm uppercase tracking-[0.2em]">Matrix is Clear</p>
            <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest mt-2">Awaiting new judge transmissions...</p>
          </div>
        ) : (
          pending.map((item, index) => (
            <div key={item.id} className="bg-black/40 backdrop-blur-2xl border border-white/5 p-6 md:p-8 rounded-[2.5rem] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 group hover:border-amber-500/30 hover:bg-zinc-900/60 transition-all relative overflow-hidden">
              
              {/* Subtle background glow on hover */}
              <div className="absolute left-0 top-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

              {/* Left: Payload Details */}
              <div className="w-full xl:w-auto relative z-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">
                    UID: {item.participants?.participant_id || 'UNKNOWN'}
                  </span>
                  <span className="text-zinc-400 text-[9px] font-black uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    {item.participants?.teams?.name || 'NO TEAM'}
                  </span>
                  <span className="flex items-center gap-1.5 text-zinc-500 text-[9px] font-mono uppercase tracking-widest ml-auto xl:ml-4 bg-black/50 px-3 py-1.5 rounded-lg">
                    <Clock className="w-3 h-3 text-zinc-600" /> {timeAgo(item.created_at)}
                  </span>
                </div>
                
                <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-1">{item.participants?.name || 'Unnamed Identity'}</h3>
                
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] flex items-center gap-2 flex-wrap">
                  <Zap className="w-3 h-3 text-indigo-500" />
                  <span className="text-indigo-300">{item.events?.name || 'Unknown Event Node'}</span> 
                  <span className="text-zinc-700">•</span> 
                  <span className="text-zinc-400">{item.events?.category} / {item.events?.event_mode}</span>
                  <span className="text-zinc-700">•</span> 
                  Judge Auth: <span className="text-zinc-400 lowercase font-mono">{item.judge_email}</span>
                </p>
              </div>

              {/* Right: Matrix Output & Action Locks */}
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full xl:w-auto pt-6 xl:pt-0 border-t border-white/5 xl:border-0 relative z-10">
                
                {/* Score Terminal */}
                <div className="flex items-center gap-4 px-6 py-4 bg-black/80 rounded-2xl border border-white/5 w-full sm:w-auto justify-center">
                  <div className="flex flex-col text-right">
                    <span className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em] mb-1">Matrix Output</span>
                    <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">{item.grade !== 'None' ? `Grade ${item.grade}` : ''} {item.position !== 'None' ? `| Pos ${item.position}` : ''}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-indigo-400 tracking-tighter">{item.points}</span>
                    <span className="text-[10px] font-black text-indigo-600">PTS</span>
                  </div>
                </div>
                
                {/* Enforcement Buttons */}
                <div className="flex gap-3 w-full sm:w-auto shrink-0">
                  <button 
                    onClick={() => handleAction(item.id, 'rejected')} 
                    disabled={processingId === item.id} 
                    className="flex-1 sm:flex-none p-4 md:px-6 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center group focus:ring-2 focus:ring-red-500/50"
                    title="Reject & Purge Payload"
                  >
                    <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <button 
                    onClick={() => handleAction(item.id, 'approved')} 
                    disabled={processingId === item.id} 
                    className="flex-1 sm:flex-none p-4 md:px-6 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center group focus:ring-2 focus:ring-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    title="Approve & Lock to Database"
                  >
                    {processingId === item.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  )
}