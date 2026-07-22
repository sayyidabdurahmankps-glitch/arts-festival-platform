"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { Camera, Image as ImageIcon, UploadCloud, Loader2, HardDrive, Zap, Clock } from 'lucide-react'

export default function MediaDashboard() {
  const [stats, setStats] = useState({ totalPhotos: 0, recentUploads: [] as any[], categories: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const { data, count } = await supabase.from('gallery').select('*', { count: 'exact' }).order('created_at', { ascending: false })
      if (data) {
        setStats({ totalPhotos: count || 0, recentUploads: data.slice(0, 4), categories: new Set(data.map(i => i.category)).size })
      }
      setLoading(false)
    }
    fetchStats()
  }, [])

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>
  const estimatedSavingsGB = ((stats.totalPhotos * 2.5) / 1024).toFixed(2)

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto animate-in fade-in duration-500">
      <header className="mb-12">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Studio <span className="text-pink-500 italic">Hub</span></h1>
        <p className="text-zinc-500 font-mono text-xs mt-2 uppercase tracking-widest">Media Team Command Center</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20"><ImageIcon className="w-6 h-6 text-pink-500"/></div>
          <div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Assets</p><p className="text-3xl font-black text-white">{stats.totalPhotos}</p></div>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20"><HardDrive className="w-6 h-6 text-cyan-500"/></div>
          <div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Bandwidth Saved</p><p className="text-3xl font-black text-white">{estimatedSavingsGB} <span className="text-sm text-zinc-500">GB</span></p></div>
        </div>
        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20"><Camera className="w-6 h-6 text-amber-500"/></div>
          <div><p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Active Albums</p><p className="text-3xl font-black text-white">{stats.categories}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Link href="/media/upload" className="bg-pink-600 hover:bg-pink-500 text-white p-8 rounded-[2rem] flex flex-col items-center justify-center text-center transition-all group shadow-[0_0_30px_rgba(236,72,153,0.15)]">
            <UploadCloud className="w-12 h-12 mb-4 group-hover:-translate-y-2 transition-transform" />
            <h3 className="font-black uppercase tracking-widest text-sm mb-2">Ingest New Media</h3>
            <p className="text-[10px] font-mono text-pink-200 uppercase opacity-80">Launch Upload Terminal</p>
          </Link>
          <div className="bg-black border border-white/5 p-8 rounded-[2rem] flex flex-col items-center justify-center text-center">
            <Zap className="w-8 h-8 text-yellow-500 mb-4" />
            <h3 className="font-black text-white uppercase tracking-widest text-xs mb-2">Auto-Compression</h3>
            <p className="text-[10px] font-mono text-zinc-500 uppercase">Uploads are automatically downscaled & optimized client-side.</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8">
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2"><Clock className="w-4 h-4 text-pink-500"/> Recent Activity</h2>
            <Link href="/media/manage" className="text-[10px] font-black text-pink-500 uppercase tracking-widest hover:text-pink-400">View All</Link>
          </div>
          {stats.recentUploads.length === 0 ? (
            <div className="text-center py-10"><p className="text-zinc-600 font-mono text-xs uppercase">No recent uploads</p></div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {stats.recentUploads.map(asset => (
                <div key={asset.id} className="group relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/5">
                  <img src={asset.image_url} alt={asset.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                    <p className="text-white font-bold text-sm truncate">{asset.title}</p>
                    <p className="text-[9px] font-black text-pink-400 uppercase tracking-widest mt-1">{asset.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}