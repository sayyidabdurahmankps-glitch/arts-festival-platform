"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  Terminal,
  Fingerprint,
  ArrowLeft,
} from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Authenticate with Supabase
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

      // 2. Refresh router to sync server-side cookies
      router.refresh();

      // 3. Verify Admin Clearance
      if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        await supabase.auth.signOut();
        router.refresh();
        setError(
          `Clearance Denied. Role "${role || "None"}" does not possess Level 5 Access.`,
        );
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center p-6 selection:bg-indigo-500/30 relative overflow-hidden font-sans">
      {/* ⚡ NEW: Global Back Button */}
      <Link
        href="/"
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-3 text-[10px] font-black font-mono text-zinc-500 hover:text-indigo-400 transition-colors group z-50 uppercase tracking-[0.2em]"
      >
        <div className="p-2 rounded-full bg-white/5 border border-white/5 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        </div>
        Return to Gateway
      </Link>

      {/* Ambient Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-zinc-950 border border-white/5 rounded-2xl mb-6 shadow-[0_0_40px_rgba(79,70,229,0.15)] relative group transition-transform duration-500 hover:scale-105">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Terminal className="w-8 h-8 text-indigo-400 relative z-10" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
            Fest
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">
              OS
            </span>{" "}
            Core
          </h1>
          <p className="text-zinc-500 font-mono text-xs mt-3 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <Lock className="w-3 h-3 text-red-500" /> Restricted Access
          </p>
        </div>

        {/* Login Console */}
        <div className="bg-zinc-900/40 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
          {/* Subtle hover glow effect on the card border */}
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

          {/* Decorative Terminal Header inside the card */}
          <div className="absolute top-0 left-0 w-full px-6 py-2 bg-black/60 border-b border-white/5 flex justify-between items-center backdrop-blur-md z-20">
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              Auth_Node_01
            </span>
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-zinc-800" />
              <span className="w-2 h-2 rounded-full bg-zinc-800" />
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            </div>
          </div>

          <div className="pt-8 relative z-10">
            {error && (
              <div className="mb-6 p-4 bg-red-950/30 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-400 text-xs font-mono uppercase tracking-widest leading-relaxed animate-in fade-in slide-in-from-top-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                  Admin Identity
                </label>
                <div className="relative group/input">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within/input:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 text-white font-mono text-sm rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-700 shadow-inner"
                    placeholder="admin@festos.core"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">
                  Security Key
                </label>
                <div className="relative group/input">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within/input:text-indigo-400 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 text-white font-mono text-sm rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 outline-none transition-all placeholder:text-zinc-700 tracking-[0.3em] shadow-inner"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black uppercase tracking-[0.2em] text-[10px] p-5 rounded-2xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(79,70,229,0.3)] hover:shadow-[0_0_40px_rgba(79,70,229,0.5)] group/btn relative overflow-hidden"
              >
                {/* Button shine effect */}
                <div className="absolute top-0 left-0 w-full h-full bg-white/10 -translate-x-full group-hover/btn:animate-[shimmer_1s_forwards] skew-x-12" />

                {loading ? (
                  <span className="flex items-center gap-2 relative z-10">
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying Credentials...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    Initialize Session
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center mt-8 text-zinc-600 font-mono text-[9px] uppercase tracking-widest">
          Unauthorized access is strictly prohibited.
        </p>
      </div>

      {/* CSS for the button shine animation */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `,
        }}
      />
    </div>
  );
}
