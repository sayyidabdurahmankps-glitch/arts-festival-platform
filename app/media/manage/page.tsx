"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Trash2, ShieldAlert, Edit2, X, Save, Hash, GripVertical, Compass } from 'lucide-react';

// --- TYPES ---
type Asset = { 
  id: string; 
  image_url: string; 
  file_path: string; 
  title: string; 
  category: string; 
  position: number; 
  photographer?: string;
};

export default function MediaAssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("All");
  
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

  // ⚡ DYNAMIC CATEGORIES
  const availableCategories = useMemo(() => {
    const validCats = assets
      .map((a) => (a.category ? a.category.trim() : null))
      .filter((cat): cat is string => cat !== null && cat !== ""); 

    const cats = new Set(validCats);
    return ["All", ...Array.from(cats)].sort();
  }, [assets]);

  const filteredItems = useMemo(() => {
    return assets.filter((item) => {
      if (activeCat === "All") return true;
      const safeCategory = item.category ? item.category.trim() : "";
      return safeCategory === activeCat;
    });
  }, [assets, activeCat]);

  // ⚡ BULLETPROOF DELETE
  const deleteAsset = async (e: React.MouseEvent, asset: Asset) => {
    e.preventDefault();
    e.stopPropagation();
    
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
  const startEditing = (e: React.MouseEvent, asset: Asset) => {
    e.preventDefault();
    e.stopPropagation();
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

  // ⚡ DRAG AND DROP ENGINE (Shared between Desktop & Mobile)
  const isDragEnabled = activeCat === "All" && editingId === null;

  const performReorder = async (sourceId: string, targetId: string) => {
    setIsSyncingOrder(true);
    const oldAssets = [...assets];
    const sourceIndex = oldAssets.findIndex(a => a.id === sourceId);
    const targetIndex = oldAssets.findIndex(a => a.id === targetId);

    const newAssets = [...oldAssets];
    const [movedAsset] = newAssets.splice(sourceIndex, 1);
    newAssets.splice(targetIndex, 0, movedAsset);

    const updatedAssets = newAssets.map((asset, index) => ({
      ...asset,
      position: index + 1
    }));

    setAssets(updatedAssets);

    try {
      await Promise.all(
        updatedAssets.map(asset => 
          supabase.from('gallery').update({ position: asset.position }).eq('id', asset.id)
        )
      );
    } catch (err) {
      console.error("Order Sync Failed", err);
      setAssets(oldAssets); 
      alert("Failed to save the new grid layout. Please try again.");
    } finally {
      setIsSyncingOrder(false);
    }
  };

  // --- DESKTOP HTML5 HANDLERS ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!isDragEnabled) return;
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (!isDragEnabled) return;
    e.preventDefault(); 
    if (dragOverId !== id && draggedId !== id) setDragOverId(id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isDragEnabled) return;
    e.preventDefault();
    setDragOverId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    if (!isDragEnabled) return;
    e.preventDefault();
    setDragOverId(null);
    const sourceId = draggedId || e.dataTransfer.getData("text/plain");
    setDraggedId(null);

    if (!sourceId || sourceId === targetId) return;
    performReorder(sourceId, targetId);
  };

  // --- 📱 MOBILE TOUCH HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (!isDragEnabled) return;
    setDraggedId(id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragEnabled || !draggedId) return;
    
    // Calculate which card the user's finger is currently dragging over
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetCard = element?.closest('[data-drag-id]');

    if (targetCard) {
      const targetId = targetCard.getAttribute('data-drag-id');
      if (targetId && targetId !== dragOverId && targetId !== draggedId) {
        setDragOverId(targetId);
      }
    } else {
      if (dragOverId) setDragOverId(null);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragEnabled || !draggedId) return;
    if (dragOverId && draggedId !== dragOverId) {
      performReorder(draggedId, dragOverId);
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#000000] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse" />
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 relative z-10" />
        </div>
        <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-zinc-500">
          Syncing Vault
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-cyan-500 selection:text-black relative pb-32 overflow-x-hidden">
      
      {/* 1. APP-STYLE HEADER */}
      <header className="px-4 md:px-10 pt-28 md:pt-36 pb-6 flex items-end justify-between border-b border-white/5 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter uppercase leading-none drop-shadow-lg">
            Media<span className="text-cyan-400 not-italic">.</span>Manager
          </h1>
          <p className="text-[9px] md:text-[10px] font-mono tracking-[0.3em] uppercase opacity-40 mt-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
            {filteredItems.length} Assets Found
          </p>
        </div>
        
        {isSyncingOrder && (
          <div className="hidden sm:flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" /> Saving Layout...
          </div>
        )}
      </header>

      {/* WARNING BANNER */}
      {activeCat !== "All" && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center justify-center gap-2 text-amber-500 text-xs font-bold tracking-widest uppercase">
          <ShieldAlert className="w-4 h-4" /> Drag & Drop Reordering is Disabled While Filtering
        </div>
      )}

      {/* 2. MANAGER GRID */}
      <main className="p-4 md:p-10 pt-8 relative z-10">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((asset) => {
              const isDragging = draggedId === asset.id;
              const isDragOver = dragOverId === asset.id;

              return (
                <div 
                  key={asset.id} 
                  data-drag-id={asset.id}
                  draggable={isDragEnabled}
                  onDragStart={(e) => handleDragStart(e, asset.id)}
                  onDragOver={(e) => handleDragOver(e, asset.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, asset.id)}
                  className={`bg-[#0a0a0a] border rounded-[2rem] p-4 flex flex-col group transition-all duration-300 relative
                    ${isDragging ? 'opacity-30 scale-95' : ''} 
                    ${isDragOver ? 'border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.3)] scale-[1.02] bg-cyan-500/5' : ''}
                    ${editingId === asset.id ? 'border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.15)]' : !isDragOver && 'border-white/5 hover:border-white/10'}
                  `}
                >
                  
                  {/* IMAGE THUMBNAIL */}
                  <div className={`relative aspect-video rounded-2xl overflow-hidden bg-black mb-4 border border-white/5 shrink-0 ${isDragEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}>
                    <img src={asset.image_url} alt="thumbnail" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    
                    {/* Desktop Overlay Drag Hint */}
                    {isDragEnabled && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center pointer-events-none hidden md:flex">
                         <GripVertical className="w-8 h-8 text-white/50" />
                      </div>
                    )}

                    {/* 📱 MOBILE TOUCH DRAG HANDLE */}
                    {isDragEnabled && (
                      <div 
                        className="absolute top-2 right-2 w-9 h-9 bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/30 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none z-30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        onTouchStart={(e) => handleTouchStart(e, asset.id)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                         <GripVertical className="w-5 h-5 text-cyan-400" />
                      </div>
                    )}

                    <div className="absolute top-2 left-2 flex items-center gap-2 pointer-events-none">
                      <span className="bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase text-white px-2 py-1 rounded flex items-center gap-1 shadow-lg">
                        <Hash className="w-3 h-3 text-cyan-400" /> {asset.position || 0}
                      </span>
                      <span className="bg-black/80 backdrop-blur-md border border-white/10 text-[8px] font-black uppercase text-cyan-400 px-2 py-1 rounded shadow-lg truncate max-w-[100px]">
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
                      
                      <div className="flex justify-end gap-2 mt-auto pt-2">
                        <button 
                          onClick={(e) => { e.preventDefault(); setEditingId(null); }}
                          className="p-2.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); saveUpdates(asset.id); }}
                          disabled={updating}
                          className="flex-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                        >
                          {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save</>}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* NORMAL DISPLAY MODE */
                    <div className="flex justify-between items-start px-2 flex-1 mt-1">
                      <div className="truncate pr-4 flex-1">
                        <p className="font-extrabold uppercase italic tracking-tighter text-white text-lg truncate" title={asset.title}>{asset.title || "Untitled"}</p>
                      </div>
                      <div className="flex gap-2 shrink-0 relative z-20">
                        <button 
                          onClick={(e) => startEditing(e, asset)}
                          className="w-9 h-9 bg-zinc-800 hover:bg-indigo-500 text-zinc-400 hover:text-white border border-white/5 hover:border-indigo-500/20 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4 pointer-events-none" />
                        </button>
                        <button 
                          onClick={(e) => deleteAsset(e, asset)} 
                          disabled={deletingId === asset.id}
                          className="w-9 h-9 bg-zinc-800 hover:bg-red-500 text-zinc-400 hover:text-white border border-white/5 hover:border-red-500/20 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
                          title="Delete Asset"
                        >
                          {deletingId === asset.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 pointer-events-none" />}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-3xl bg-zinc-900/10">
            <Compass className="w-12 h-12 mb-4 text-zinc-700" />
            <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-zinc-500 text-center px-4">
              Manager empty for this sector.
            </p>
          </div>
        )}
      </main>

      {/* 3. FLOATING BOTTOM FILTER DOCK (MATCHES GALLERY) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92vw] max-w-2xl bg-black/70 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 shadow-[0_20px_40px_rgba(0,0,0,0.8)]">
        <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x touch-pan-x items-center [&::-webkit-scrollbar]:hidden">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`snap-center whitespace-nowrap text-xs md:text-sm font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-all duration-300 active:scale-95 ${
                activeCat === cat
                  ? "bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                  : "bg-transparent text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      
    </div>
  );
}