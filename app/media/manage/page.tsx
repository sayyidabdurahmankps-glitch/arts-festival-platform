"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Loader2, Trash2, Camera, ShieldAlert } from 'lucide-react'

type Asset = { id: string, image_url: string, file_path: string, title: string, category: string }

export default function MediaAssetManager() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    const fetchAssets = async () => {
      const { data } = await supabase.from('gallery').select('*').order('created_at', { ascending: false })
      if (data) setAssets(data)
      setLoading(false)
    }
    fetchAssets()
  }, [])

  const deleteAsset = async (asset: Asset) => {
    if (!confirm(`Permanently delete "${asset.title}"?`)) return;
    setDeletingId(asset.id)
    try {
      const { error: storageError } = await supabase.storage.from('media-gallery').remove([asset.file_path])
      if (storageError) throw storageError
      const { error: dbError } = await supabase.from('gallery').delete().eq('id', asset.id)
      if (dbError) throw dbError
      setAssets(prev => prev.filter(a => a.id !== asset.id))
    } catch (error: any) {
      alert("Deletion Failed: " + error.message)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-pink-500 w-10 h-10" /></div>

  return (
    <div className="max-w-6xl mx-auto py-12 px-8 animate-in fade-in">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Asset <span className="text-pink-500">Manager</span></h1>
        <p className="text-zinc-500 font-mono text-xs uppercase mt-2 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" /> Destructive actions are permanent.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map(asset => (
          <div key={asset.id} className="bg-zinc-900/50 border border-white/5 rounded-[2rem] p-4 flex flex-col group hover:border-red-500/30 transition-all">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-4 border border-white/5">
              <img src={asset.image_url} alt="thumbnail" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
              <span className="absolute top-2 left-2 bg-black/80 backdrop-blur-md border border-white/10 text-[8px] font-black uppercase text-pink-400 px-2 py-1 rounded">
                {asset.category}
              </span>
            </div>
            
            <div className="flex justify-between items-center px-2">
              <div className="truncate pr-4"><p className="font-bold text-white text-sm truncate">{asset.title}</p></div>
              <button 
                onClick={() => deleteAsset(asset)} disabled={deletingId === asset.id}
                className="w-10 h-10 shrink-0 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
              >
                {deletingId === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}