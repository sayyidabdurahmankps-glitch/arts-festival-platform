"use client"

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Mail, ArrowRight, ShieldAlert, KeyRound, Loader2, Fingerprint, ArrowLeft } from 'lucide-react';

export default function MediaLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("Authentication failed.");

      const { data: profile, error: profileError } = await supabase
        .from('profiles').select('role, is_active').eq('id', authData.user.id).single();

      if (profileError || !profile) {
        await supabase.auth.signOut(); throw new Error("Identity not found in registry.");
      }
      if (!profile.is_active) {
        await supabase.auth.signOut(); throw new Error("Access Denied: Clearance revoked.");
      }
      if (profile.role !== 'media' && profile.role !== 'admin') {
        await supabase.auth.signOut(); throw new Error(`Access Denied: Invalid clearance (${profile.role}).`);
      }

      router.refresh(); 
      router.push('/media');

    } catch (err: any) {
      setError(err.message); setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6 selection:bg-pink-500/30 relative overflow-hidden font-sans">
      
      {/* ⚡ NEW: Global Back Button */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-3 text-[10px] font-black font-mono text-zinc-500 hover:text-pink-400 transition-colors group z-50 uppercase tracking-[0.2em]"
      >
        <div className="p-2 rounded-full bg-white/5 border border-white/5 group-hover:bg-pink-500/10 group-hover:border-pink-500/30 transition-all">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        </div>
        Return to Gateway
      </Link>

      {/* Ambient Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-5 bg-zinc-950 border border-white/5 rounded-3xl mb-6 shadow-[0_0_40px_rgba(236,72,153,0.15)] relative group transition-transform duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Camera className="w-10 h-10 text-pink-400 relative z-10" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
            Media <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-500">Studio</span>
          </h1>
          <div className="flex items-center justify-center gap-3 mt-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            <Fingerprint className="w-3 h-3 text-pink-500 animate-pulse" /> Authorized Photographers Only
          </div>
        </div>

        {/* Login Console */}
        <div className="bg-zinc-900/40 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
          
          {/* Subtle hover glow effect on the card border */}
          <div className="absolute inset-0 bg-gradient-to-b from-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Decorative Terminal Header inside the card */}
          <div className="absolute top-0 left-0 w-full px-6 py-2 bg-black/60 border-b border-white/5 flex justify-between items-center backdrop-blur-md z-20">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Media_Node_01</span>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-800" />
              <span className="w-2 h-2 rounded-full bg-zinc-800" />
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shadow-[0_0_10px_rgba(236,72,153,0.5)]" />
            </div>
          </div>

          <div className="pt-8 relative z-10">
            {error && (
              <div className="mb-6 p-4 bg-red-950/30 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs font-mono uppercase tracking-widest leading-relaxed animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-red-500" /> 
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Photographer ID</label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within/input:text-pink-400 transition-colors" />
                  <input 
                    type="email" 
                    required 
                    disabled={loading} 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-black/50 border border-zinc-800 text-white font-mono text-sm rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/50 transition-all shadow-inner placeholder:text-zinc-700 disabled:opacity-50" 
                    placeholder="PHOTOG_ID@AHIC.EDU" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Security Key</label>
                <div className="relative group/input">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within/input:text-pink-400 transition-colors" />
                  <input 
                    type="password" 
                    required 
                    disabled={loading} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-black/50 border border-zinc-800 text-white font-mono tracking-[0.3em] text-sm rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500/50 transition-all shadow-inner placeholder:text-zinc-700 placeholder:tracking-normal disabled:opacity-50" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              <button 
                disabled={loading || !email || !password} 
                type="submit" 
                className="w-full mt-8 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black uppercase tracking-[0.2em] text-[10px] p-5 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:shadow-[0_0_40px_rgba(236,72,153,0.5)] group/btn relative overflow-hidden"
              >
                {/* Button shine effect */}
                <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover/btn:animate-[shimmer_1s_forwards] skew-x-12" />

                {loading ? (
                  <span className="flex items-center gap-2 relative z-10">
                    <Loader2 className="w-4 h-4 animate-spin" /> Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    Establish Uplink <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center mt-8 text-zinc-600 font-mono text-[9px] uppercase tracking-widest">
          Secure Media Transfer Protocol
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