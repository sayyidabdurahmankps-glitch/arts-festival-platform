"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Trash2, ShieldAlert, Edit2, X, Save, Hash, GripVertical } from 'lucide-react';

// --- TYPES ---
type Asset = { 
  id: string; 
  image_url: string; 
  file_path: string; 
  title: string; 
  category: string; 
  position: number; 
}

export default function MediaAssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Action States
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // Drag & Drop States
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isSyncingOrder, setIsSyncingOrder] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({ title: '', category: '', position: 0 });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
      
    if (data) setAssets(data as Asset[]);
    setLoading(false);
  };

  // ⚡ BULLETPROOF DELETE
  const deleteAsset = async (asset: Asset) => {
    if (!confirm(`Permanently delete "${asset.title || 'this image'}"?`)) return;
    setDeletingId(asset.id);
    try {
      if (asset.file_path) {
        const { error: storageError } = await supabase.storage.from('media-gallery').remove([asset.file_path]);
        if (storageError) console.warn("Storage Warning:", storageError.message);
      }
      const { error: dbError } = await supabase.from('gallery').delete().eq('id', asset.id);
      if (dbError) throw dbError;
      
      setAssets(prev => prev.filter(a => a.id !== asset.id));
    } catch (error: any) {
      alert("Deletion Failed: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  // ⚡ INLINE EDITING
  const startEditing = (asset: Asset) => {
    setEditingId(asset.id);
    setEditForm({
      title: asset.title || '',
      category: asset.category || '',
      position: asset.position || 0
    });
  };

  const saveUpdates = async (id: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('gallery')
        .update({
          title: editForm.title,
          category: editForm.category,
          position: Number(editForm.position)
        })
        .eq('id', id);

      if (error) throw error;

      setAssets(prev => {
        const updated = prev.map(a => a.id === id ? { ...a, ...editForm, position: Number(editForm.position) } : a);
        return updated.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
      });
      
      setEditingId(null);
    } catch (error: any) {
      alert("Update Failed: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  // ⚡ DRAG AND DROP ENGINE
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault(); // Required to allow dropping
    if (dragOverId !== id && draggedId !== id) {
      setDragOverId(id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverId(null);
    const sourceId = draggedId || e.dataTransfer.getData("text/plain");
    setDraggedId(null);

    if (!sourceId || sourceId === targetId) return;

    setIsSyncingOrder(true);

    // Optimistically reorder the array
    const oldAssets = [...assets];
    const sourceIndex = oldAssets.findIndex(a => a.id === sourceId);
    const targetIndex = oldAssets.findIndex(a => a.id === targetId);

    const newAssets = [...oldAssets];
    const [movedAsset] = newAssets.splice(sourceIndex, 1);
    newAssets.splice(targetIndex, 0, movedAsset);

    // Assign mathematical positions based on new grid layout (1, 2, 3...)
    const updatedAssets = newAssets.map((asset, index) => ({
      ...asset,
      position: index + 1
    }));

    setAssets(updatedAssets);

    // Sync new positions to Supabase in the background
    try {
      await Promise.all(
        updatedAssets.map(asset => 
          supabase.from('gallery').update({ position: asset.position }).eq('id', asset.id)
        )
      );
    } catch (err) {
      console.error("Order Sync Failed", err);
      setAssets(oldAssets); // Revert UI if DB fails
      alert("Failed to save the new grid layout. Please try again.");
    } finally {
      setIsSyncingOrder(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#050505] p-20 flex items-center justify-center"><Loader2 className="animate-spin text-pink-500 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans pb-32 overflow-x-hidden">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in">
        
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">Asset <span className="text-pink-500">Manager</span></h1>
            <p className="text-zinc-500 font-mono text-xs uppercase mt-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Drag and Drop cards to reorganize grid positions.
            </p>
          </div>
          {isSyncingOrder && (
            <div className="flex items-center gap-2 bg-pink-500/10 border border-pink-500/20 text-pink-400 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving Layout...
            </div>
          )}
        </div>

        {/* RESPONSIVE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {assets.map((asset) => {
            const isDragging = draggedId === asset.id;
            const isDragOver = dragOverId === asset.id;

            return (
              <div 
                key={asset.id} 
                draggable={editingId !== asset.id} // Disable drag while editing
                onDragStart={(e) => handleDragStart(e, asset.id)}
                onDragOver={(e) => handleDragOver(e, asset.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, asset.id)}
                className={`bg-zinc-900/40 backdrop-blur-sm border rounded-[2rem] p-4 flex flex-col group transition-all duration-300 
                  ${isDragging ? 'opacity-30 scale-95' : ''} 
                  ${isDragOver ? 'border-pink-500 shadow-[0_0_40px_rgba(236,72,153,0.3)] scale-[1.02] bg-pink-500/5' : ''}
                  ${editingId === asset.id ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : !isDragOver && 'border-white/5 hover:border-white/10'}
                `}
              >
                
                {/* IMAGE THUMBNAIL */}
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-4 border border-white/5 shrink-0 cursor-grab active:cursor-grabbing">
                  <img src={asset.image_url} alt="thumbnail" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Drag Handle Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                     <GripVertical className="w-8 h-8 text-white/50" />
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none">
                    <span className="bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase text-white px-2 py-1 rounded flex items-center gap-1 shadow-lg">
                      <Hash className="w-3 h-3 text-pink-500" /> {asset.position || 0}
                    </span>
                    <span className="bg-black/80 backdrop-blur-md border border-white/10 text-[8px] font-black uppercase text-pink-400 px-2 py-1 rounded shadow-lg truncate max-w-[100px]">
                      {asset.category || "Uncategorized"}
                    </span>
                  </div>
                </div>
                
                {/* EDIT MODE FORM */}
                {editingId === asset.id ? (
                  <div className="flex flex-col gap-3 flex-1 animate-in slide-in-from-bottom-2">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold ml-1 mb-1 block">Caption / Title</label>
                      <input 
                        type="text" 
                        value={editForm.title} 
                        onChange={e => setEditForm({...editForm, title: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                        placeholder="Enter title..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold ml-1 mb-1 block">Category</label>
                        <input 
                          type="text" 
                          value={editForm.category} 
                          onChange={e => setEditForm({...editForm, category: e.target.value})}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                          placeholder="e.g., Award Ceremony"
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold ml-1 mb-1 block">Grid Pos</label>
                        <input 
                          type="number" 
                          value={editForm.position} 
                          onChange={e => setEditForm({...editForm, position: parseInt(e.target.value) || 0})}
                          className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none text-center font-mono"
                        />
                      </div>
                    </div>
                    
                    {/* Save / Cancel */}
                    <div className="flex justify-end gap-2 mt-auto pt-2">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="p-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => saveUpdates(asset.id)}
                        disabled={updating}
                        className="flex-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                      >
                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Details</>}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* NORMAL DISPLAY MODE */
                  <div className="flex justify-between items-start px-2 flex-1 mt-1">
                    <div className="truncate pr-4 flex-1">
                      <p className="font-bold text-white text-sm truncate" title={asset.title}>{asset.title || "Untitled Media"}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => startEditing(asset)}
                        className="w-9 h-9 bg-zinc-800 hover:bg-indigo-500 text-zinc-400 hover:text-white border border-white/5 hover:border-indigo-500/20 rounded-xl flex items-center justify-center transition-all"
                        title="Edit Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteAsset(asset)} disabled={deletingId === asset.id}
                        className="w-9 h-9 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white border border-white/5 hover:border-red-500/20 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                        title="Delete Asset"
                      >
                        {deletingId === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

        {assets.length === 0 && !loading && (
          <div className="py-32 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[3rem] bg-white/[0.02]">
            <GripVertical className="w-16 h-16 text-zinc-700 mb-4" />
            <h3 className="text-xl font-bold text-zinc-500 uppercase tracking-widest">No Media Found</h3>
            <p className="text-sm font-mono text-zinc-600 mt-2">Upload assets to start managing them here.</p>
          </div>
        )}
      </div>
    </div>
  );
}