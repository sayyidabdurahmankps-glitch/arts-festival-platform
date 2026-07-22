"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gavel, Mail, ArrowRight, ShieldAlert, KeyRound, Loader2, ShieldX, Terminal, ArrowLeft } from 'lucide-react';

export default function JudgeLogin() {
  const router = useRouter();
  
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ⚡ SYSTEM ACCESS CONTROL STATE
  const [systemLocked, setSystemLocked] = useState(false);
  const [checkingSystem, setCheckingSystem] = useState(true);

  useEffect(() => {
    // 1. Check initial system status on mount
    const fetchSystemStatus = async () => {
      const { data } = await supabase.from('system_settings').select('judge_logins_active').eq('id', 1).single();
      if (data) {
        setSystemLocked(!data.judge_logins_active);
      }
      setCheckingSystem(false);
    };
    
    fetchSystemStatus();

    // 2. ⚡ REAL-TIME LISTENER: Instantly lock/unlock if Admin flips the switch in System Core
    const channel = supabase.channel('system-status')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'system_settings' }, (payload) => {
        setSystemLocked(!payload.new.judge_logins_active);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (systemLocked) return; // Prevent submission if locked

    setLoading(true);
    setError('');

    // 1. Authenticate via Supabase GoTrue
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      const role = data.user?.user_metadata?.role;

      // 2. Sync cookies with the Next.js server
      router.refresh(); 

      // 3. Verify Judge/Admin permissions
      if (role === 'judge' || role === 'admin') {
        router.push('/judge');
      } else {
        // Kick unauthorized users out
        await supabase.auth.signOut();
        router.refresh();
        setError(`Access Denied: Your role is "${role || 'None'}". Judge credentials required.`);
        setLoading(false);
      }
    }
  };

  // ⚡ STATE 1: BOOTING / CHECKING SECURITY
  if (checkingSystem) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500 blur-[60px] opacity-20 animate-pulse" />
          <Loader2 className="w-10 h-10 text-emerald-500 animate-spin relative z-10" />
        </div>
        <p className="text-emerald-400 font-mono uppercase tracking-[0.4em] text-[10px] animate-pulse relative z-10">Verifying Node Security...</p>
      </div>
    );
  }

  // ⚡ STATE 2: SYSTEM LOCKDOWN (Triggered by System Core)
  if (systemLocked) {
    return (
      <div className="min-h-screen bg-[#020000] flex items-center justify-center p-6 relative overflow-hidden selection:bg-red-500/30">
        
        {/* Back Button for Lockdown Screen */}
        <Link 
          href="/" 
          className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-3 text-[10px] font-black font-mono text-zinc-500 hover:text-red-400 transition-colors group z-50 uppercase tracking-[0.2em]"
        >
          <div className="p-2 rounded-full bg-white/5 border border-white/5 group-hover:bg-red-500/10 group-hover:border-red-500/30 transition-all">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </div>
          Return to Gateway
        </Link>

        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/20 blur-[120px] rounded-full pointer-events-none animate-pulse mix-blend-screen" />

        <div className="w-full max-w-md relative z-10 text-center animate-in zoom-in-95 duration-700">
          <div className="inline-flex items-center justify-center p-6 bg-red-500/10 border border-red-500/30 rounded-full mb-8 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <ShieldX className="w-12 h-12 text-red-500 animate-pulse" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-4 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
            Lockdown
          </h1>
          <div className="bg-red-950/20 border border-red-500/20 p-8 rounded-[2rem] backdrop-blur-xl shadow-2xl">
            <p className="text-red-400 font-mono text-sm uppercase tracking-widest leading-relaxed mb-4 flex items-center justify-center gap-2">
              <Terminal className="w-4 h-4" /> Uplink Severed
            </p>
            <p className="text-zinc-400 text-xs font-medium leading-relaxed">
              Event administration has temporarily disabled all edge node connections. Please await clearance from the Master Gateway.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ⚡ STATE 3: GATEWAY OPEN (Standard Login)
  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-emerald-500/30 font-sans">
      
      {/* ⚡ NEW: Global Back Button */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-3 text-[10px] font-black font-mono text-zinc-500 hover:text-emerald-400 transition-colors group z-50 uppercase tracking-[0.2em]"
      >
        <div className="p-2 rounded-full bg-white/5 border border-white/5 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        </div>
        Return to Gateway
      </Link>

      {/* Ultra-Modern Deep Space Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-5 bg-zinc-950 border border-white/5 rounded-3xl mb-6 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative group transition-transform duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Gavel className="w-8 h-8 text-emerald-400 relative z-10" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">
            Edge <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">Node</span>
          </h1>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 mt-4">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" /> Gateway Open
          </p>
        </div>

        <div className="bg-zinc-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
          
          {/* Subtle hover glow effect on the card */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          <div className="relative z-10">
            {error && (
              <div className="mb-6 p-4 bg-red-950/30 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs font-mono uppercase tracking-widest animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Official Identifier</label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within/input:text-emerald-400 transition-colors" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 text-white font-mono text-sm rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all shadow-inner placeholder:text-zinc-700"
                    placeholder="judge@festos.core"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Security Clearance</label>
                <div className="relative group/input">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within/input:text-emerald-400 transition-colors" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 text-white font-mono tracking-[0.3em] text-sm rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all shadow-inner placeholder:text-zinc-700 placeholder:tracking-normal"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                disabled={loading}
                type="submit" 
                className="w-full mt-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-black font-black uppercase tracking-[0.2em] text-[10px] p-5 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] group/btn relative overflow-hidden"
              >
                {/* Button shine effect */}
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover/btn:animate-[shimmer_1s_forwards] skew-x-12" />

                {loading ? (
                  <span className="flex items-center gap-2 relative z-10">
                    <Loader2 className="w-4 h-4 animate-spin" /> Handshaking...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    Authenticate 
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
        
        <p className="text-center mt-8 text-zinc-600 font-mono text-[9px] uppercase tracking-widest">
          Secure Edge Authentication Protocol
        </p>
      </div>

      {/* CSS for the button shine animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}