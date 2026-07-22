"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Zap, Trophy, Loader2, Crown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type TeamStats = { id: string; team: string; total_points: number; color: string; category_name: string; }

export default function LiveProjector() {
  const [general, setGeneral] = useState<TeamStats[]>([])
  const [hifz, setHifz] = useState<TeamStats[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from("category_leaderboard").select("*").order("total_points", { ascending: false })
    if (data) {
      setGeneral(data.filter(d => d.category_name === 'General').slice(0, 4));
      setHifz(data.filter(d => d.category_name === 'Hifz').slice(0, 2));
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLeaderboard()
    const channel = supabase.channel("live-projector")
      .on("postgres_changes", { event: "*", schema: "public", table: "results" }, () => fetchLeaderboard() )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
      <Loader2 className="w-20 h-20 text-indigo-500 animate-spin" />
      <p className="text-zinc-500 font-mono text-xl uppercase tracking-[0.4em] animate-pulse">Initializing Projector Array...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 flex flex-col p-8 absolute inset-0 z-50 overflow-hidden">
      
      {/* Dynamic Background tracking the General Leader */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] blur-[250px] pointer-events-none transition-colors duration-1000" style={{ backgroundColor: general.length > 0 ? `${general[0].color}15` : 'rgba(79,70,229,0.1)' }} />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] blur-[200px] pointer-events-none bg-purple-600/10" />

      {/* HEADER */}
      <div className="text-center mb-10 relative z-10 flex justify-between items-end px-4">
        <h1 className="text-[4rem] leading-none font-black tracking-tighter text-white drop-shadow-2xl flex items-center gap-6">
          LIVE <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">STANDINGS</span>
        </h1>
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-black uppercase tracking-[0.3em] backdrop-blur-md animate-pulse">
          <Zap className="w-5 h-5" /> Broadcast Active
        </div>
      </div>
      
      <div className="flex-1 grid grid-cols-3 gap-8 relative z-10 w-full max-w-[1800px] mx-auto">
        
        {/* 🟢 LEFT PANE: GENERAL CHAMPIONSHIP */}
        <div className="col-span-2 flex flex-col gap-6">
          <div className="flex items-center gap-4 px-2 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h2 className="text-3xl font-black uppercase tracking-widest text-zinc-300">General Championship</h2>
          </div>
          
          <AnimatePresence mode="popLayout">
            {general.map((entry, index) => (
              <motion.div 
                key={entry.id} layout
                initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className={`flex justify-between items-center p-6 md:p-8 rounded-[2.5rem] transform transition-all duration-500 backdrop-blur-xl relative overflow-hidden ${index === 0 ? "bg-[#0a0a0a] border-2 scale-[1.02] z-20 shadow-2xl" : "bg-black/40 border border-white/5 z-10"}`}
                style={{ borderColor: index === 0 ? entry.color : 'rgba(255,255,255,0.05)', boxShadow: index === 0 ? `0 20px 80px ${entry.color}30` : 'none' }}
              >
                <div className="absolute left-0 top-0 bottom-0 w-3 opacity-90" style={{ backgroundColor: entry.color }} />
                <div className="flex items-center gap-8 pl-4">
                  <div className={`w-20 h-20 flex items-center justify-center rounded-3xl font-black text-4xl shadow-inner`} style={{ backgroundColor: index === 0 ? entry.color : 'rgba(0,0,0,0.5)', color: index === 0 ? '#fff' : entry.color }}>
                    {index === 0 ? <Crown className="w-10 h-10" /> : `#${index + 1}`}
                  </div>
                  <span className={`text-[3.5rem] leading-none font-black tracking-tight uppercase ${index === 0 ? "text-white" : "text-zinc-200"}`}>{entry.team}</span>
                </div>
                <div className="text-right">
                  <motion.div key={entry.total_points} initial={{ scale: 1.2, color: entry.color }} animate={{ scale: 1, color: index === 0 ? '#fff' : '#d4d4d8' }} className="text-[4.5rem] leading-none font-black tabular-nums tracking-tighter">
                    {entry.total_points}
                  </motion.div>
                  <span className="text-xl font-black uppercase text-zinc-600 tracking-[0.4em]">PTS</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* 🟣 RIGHT PANE: HIFZ DUEL */}
        <div className="col-span-1 flex flex-col gap-6 border-l border-white/10 pl-8">
          <div className="flex items-center gap-4 px-2 mb-2">
            <Zap className="w-8 h-8 text-indigo-400" />
            <h2 className="text-3xl font-black uppercase tracking-widest text-indigo-400">Hifz Duel</h2>
          </div>

          <div className="flex flex-col gap-6 h-full">
            <AnimatePresence mode="popLayout">
              {hifz.map((entry, index) => (
                <motion.div 
                  key={entry.id} layout
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 25 }}
                  className="flex-1 bg-indigo-950/20 border border-indigo-500/20 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden backdrop-blur-xl"
                >
                  {index === 0 && <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${entry.color}, transparent 70%)` }} />}
                  
                  <div className="w-20 h-20 rounded-full border-4 shadow-2xl flex items-center justify-center mb-6 relative z-10" style={{ borderColor: entry.color, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <span className="font-black text-3xl" style={{ color: entry.color }}>#{index + 1}</span>
                  </div>
                  
                  <h3 className="text-4xl font-black text-white uppercase tracking-tight relative z-10 mb-4">{entry.team}</h3>
                  
                  <motion.div key={entry.total_points} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-[5rem] leading-none font-black tabular-nums tracking-tighter text-white relative z-10">
                    {entry.total_points}
                  </motion.div>
                  <p className="text-lg font-black text-zinc-500 uppercase tracking-[0.4em] mt-2 relative z-10">Points</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  )
}