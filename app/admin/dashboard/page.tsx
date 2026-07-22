"use client"

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminSidebar from '@/components/AdminSidebar';
import Link from 'next/link';
import { 
  Menu, X, Bell, User, Activity, Users, CalendarDays, 
  CheckSquare, Terminal, Server, ShieldCheck, Zap, 
  ArrowRight, Database, Wifi, Cpu 
} from 'lucide-react';

export default function AdminDashboard() {
  // --- LAYOUT STATES ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // --- DASHBOARD STATES ---
  const [metrics, setMetrics] = useState({ participants: 0, events: 0, pendingApprovals: 0 });
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState('');

  // 1. Check System Connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('events').select('id').limit(1);
        if (error) throw error;
        setIsOnline(true);
      } catch (err) {
        setIsOnline(false);
      }
    };
    checkConnection();
    const heartbeat = setInterval(checkConnection, 30000);
    return () => clearInterval(heartbeat);
  }, []);

  // 2. Fetch Dashboard Metrics & Clock
  useEffect(() => {
    const fetchSystemMetrics = async () => {
      try {
        const [ { count: pCount }, { count: eCount }, { count: aCount } ] = await Promise.all([
          supabase.from('participants').select('*', { count: 'exact', head: true }),
          supabase.from('events').select('*', { count: 'exact', head: true }),
          supabase.from('results').select('*', { count: 'exact', head: true }).eq('status', 'pending')
        ]);
        setMetrics({ participants: pCount || 0, events: eCount || 0, pendingApprovals: aCount || 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchSystemMetrics();
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' UTC');
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* ========================================== */}
      {/* LEFT: DESKTOP ADMIN SIDEBAR                */}
      {/* ========================================== */}
      <div className="w-64 shrink-0 border-r border-white/5 hidden md:block z-30 bg-black/50 backdrop-blur-xl">
        <AdminSidebar />
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-64 bg-[#020202] h-full border-r border-white/5 shadow-2xl">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-6 right-4 p-2 text-zinc-500 hover:text-white bg-zinc-900 rounded-lg">
              <X className="w-5 h-5" />
            </button>
            <AdminSidebar />
          </div>
        </div>
      )}
      
      {/* ========================================== */}
      {/* RIGHT: MAIN CONTENT AREA                   */}
      {/* ========================================== */}
      <div className="flex-1 flex flex-col h-screen relative overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-black/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-zinc-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Command Center <span className="mx-2 text-zinc-800">/</span> <span className="text-indigo-400">OS METRICS</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                {isOnline ? 'System Live' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-white/5">
              <Bell className="w-4 h-4 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold">AD</div>
            </div>
          </div>
        </header>
        
        {/* DASHBOARD CONTENT (SCROLLABLE) */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-30 z-0" />
          
          <div className="p-6 md:p-8 relative z-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
            
            {/* Dashboard Header */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end border-b border-white/5 pb-8 gap-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic flex items-center gap-4">
                  <Activity className="w-10 h-10 text-indigo-500" />
                  OS <span className="text-indigo-500">Metrics</span>
                </h1>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 text-zinc-500 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em]">
                  <span className="flex items-center gap-2"><Database className="w-3 h-3 text-indigo-500" /> Telemetry Active</span>
                  <span className="hidden md:block w-1 h-1 bg-zinc-800 rounded-full" />
                  <span className="flex items-center gap-2"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Root Session</span>
                </div>
              </div>
              
              <div className="flex items-center gap-4 md:gap-6 bg-black/80 border border-white/5 px-5 md:px-6 py-4 rounded-[2rem] w-full xl:w-auto overflow-hidden">
                 <div className="flex flex-col">
                   <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">System Time</span>
                   <span className="text-xs md:text-sm font-black font-mono text-indigo-400 tracking-wider truncate">{time || 'SYNCING...'}</span>
                 </div>
                 <div className="w-px h-8 bg-white/10" />
                 <div className="flex flex-col">
                   <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 mb-1">Network</span>
                   <span className="text-[10px] md:text-xs font-black font-mono text-emerald-500 flex items-center gap-2 uppercase tracking-widest">
                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" /> Optimal
                   </span>
                 </div>
              </div>
            </header>

            {/* Primary Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/admin/approvals" className={`bg-zinc-900/40 border rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 group transition-all duration-500 relative overflow-hidden flex flex-col justify-between min-h-[200px] md:min-h-[220px] ${metrics.pendingApprovals > 0 ? 'border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.05)]' : 'border-white/5 hover:border-indigo-500/30 hover:bg-zinc-900/80'}`}>
                <div className={`absolute right-0 top-0 w-32 md:w-40 h-32 md:h-40 rounded-full blur-[60px] opacity-20 transition-opacity duration-500 pointer-events-none ${metrics.pendingApprovals > 0 ? 'bg-amber-500 group-hover:opacity-40' : 'bg-indigo-500'}`} />
                <div className="flex justify-between items-start relative z-10">
                  <div className={`p-3 md:p-4 rounded-2xl border transition-transform duration-500 group-hover:scale-110 ${metrics.pendingApprovals > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                    <CheckSquare className="w-5 md:w-6 h-5 md:h-6" />
                  </div>
                  {metrics.pendingApprovals > 0 && (
                    <span className="px-3 py-1.5 bg-amber-500 text-black font-black text-[8px] md:text-[9px] uppercase tracking-widest rounded-full animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)]">Action Required</span>
                  )}
                </div>
                <div className="relative z-10 mt-8">
                  <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Pending Approvals</h3>
                  <div className="flex items-end justify-between">
                    <p className={`text-5xl md:text-6xl font-black tracking-tighter leading-none ${metrics.pendingApprovals > 0 ? 'text-amber-400' : 'text-white'}`}>
                      {loading ? <span className="animate-pulse opacity-20">0</span> : metrics.pendingApprovals}
                    </p>
                    <ArrowRight className={`w-5 md:w-6 h-5 md:h-6 ${metrics.pendingApprovals > 0 ? 'text-amber-500' : 'text-zinc-600'} group-hover:translate-x-2 transition-transform`} />
                  </div>
                </div>
              </Link>

              <Link href="/admin/participants" className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 group transition-all duration-500 hover:border-emerald-500/30 hover:bg-zinc-900/80 relative overflow-hidden flex flex-col justify-between min-h-[200px] md:min-h-[220px]">
                <div className="absolute right-0 top-0 w-32 md:w-40 h-32 md:h-40 bg-emerald-500 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
                <div className="flex justify-between items-start relative z-10">
                  <div className="p-3 md:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 transition-transform duration-500 group-hover:scale-110">
                    <Users className="w-5 md:w-6 h-5 md:h-6" />
                  </div>
                </div>
                <div className="relative z-10 mt-8">
                  <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Total Roster</h3>
                  <div className="flex items-end justify-between">
                    <p className="text-5xl md:text-6xl font-black tracking-tighter leading-none text-white">
                      {loading ? <span className="animate-pulse opacity-20">0</span> : metrics.participants}
                    </p>
                    <ArrowRight className="w-5 md:w-6 h-5 md:h-6 text-zinc-600 group-hover:text-emerald-400 group-hover:translate-x-2 transition-all" />
                  </div>
                </div>
              </Link>

              <Link href="/admin/events" className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 group transition-all duration-500 hover:border-cyan-500/30 hover:bg-zinc-900/80 relative overflow-hidden flex flex-col justify-between min-h-[200px] md:min-h-[220px]">
                <div className="absolute right-0 top-0 w-32 md:w-40 h-32 md:h-40 bg-cyan-500 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none" />
                <div className="flex justify-between items-start relative z-10">
                  <div className="p-3 md:p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 transition-transform duration-500 group-hover:scale-110">
                    <CalendarDays className="w-5 md:w-6 h-5 md:h-6" />
                  </div>
                </div>
                <div className="relative z-10 mt-8">
                  <h3 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Active Events</h3>
                  <div className="flex items-end justify-between">
                    <p className="text-5xl md:text-6xl font-black tracking-tighter leading-none text-white">
                      {loading ? <span className="animate-pulse opacity-20">0</span> : metrics.events}
                    </p>
                    <ArrowRight className="w-5 md:w-6 h-5 md:h-6 text-zinc-600 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Command Nodes & System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <Zap className="w-4 md:w-5 h-4 md:h-5 text-purple-500" />
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">Quick Nodes</span>
                </div>
                <div className="space-y-4">
                  <Link href="/admin/entry" className="flex items-center justify-between p-4 md:p-5 bg-black/50 border border-white/5 rounded-2xl hover:border-purple-500/30 group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shrink-0">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black text-white text-xs md:text-sm uppercase tracking-wide">Smart Entry.OS</p>
                        <p className="text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Manual point ingestion terminal</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 md:w-5 h-4 md:h-5 text-zinc-600 group-hover:text-purple-400 transition-colors shrink-0" />
                  </Link>

                  <Link href="/admin/standings" className="flex items-center justify-between p-4 md:p-5 bg-black/50 border border-white/5 rounded-2xl hover:border-rose-500/30 group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-black text-white text-xs md:text-sm uppercase tracking-wide">Live Standings</p>
                        <p className="text-[9px] md:text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">Aggregated team score matrix</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 md:w-5 h-4 md:h-5 text-zinc-600 group-hover:text-rose-400 transition-colors shrink-0" />
                  </Link>
                </div>
              </div>

              <div className="bg-black/60 backdrop-blur-md border border-white/5 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 relative overflow-hidden flex flex-col">
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                <div className="flex items-center gap-3 mb-8 relative z-10">
                  <Server className="w-4 md:w-5 h-4 md:h-5 text-emerald-500" />
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white">System Health</span>
                </div>
                
                <div className="flex-1 flex flex-col justify-center space-y-6 md:space-y-8 relative z-10">
                  <div>
                    <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3">
                      <span className="text-zinc-500 flex items-center gap-2"><Cpu className="w-3 h-3" /> Database Memory</span>
                      <span className="text-emerald-400">Stable / 28%</span>
                    </div>
                    <div className="w-full h-1.5 md:h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                      <div className="w-[28%] h-full bg-emerald-500 shadow-[0_0_15px_#10b981]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-3">
                      <span className="text-zinc-500 flex items-center gap-2"><Wifi className="w-3 h-3" /> WSS Latency</span>
                      <span className="text-indigo-400 animate-pulse">12ms Ping</span>
                    </div>
                    <div className="w-full h-1.5 md:h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5 flex gap-1">
                      <div className="w-[10%] h-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                      <div className="w-2 h-full bg-indigo-500/50" />
                      <div className="w-1 h-full bg-indigo-500/20" />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-5 md:pt-6 border-t border-white/5 relative z-10">
                   <Link href="/admin/system" className="flex items-center justify-between text-zinc-500 hover:text-white transition-colors group">
                     <span className="text-[9px] md:text-[10px] font-mono uppercase tracking-widest">Access Root Terminal Node</span>
                     <ArrowRight className="w-3 md:w-4 h-3 md:h-4 group-hover:translate-x-1 transition-transform" />
                   </Link>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}