"use client";

import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Trash2, ShieldAlert, Edit2, X, Save, Hash, GripVertical, Compass, Camera } from 'lucide-react';

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', category: '', position: 0 });
  
  // Drag & Drop States
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [isSyncingBackground, setIsSyncingBackground] = useState(false);

  // ⚡ BOOT & FETCH
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

  // ============================================================================
  // ⚡ SUPERCHARGED OPTIMISTIC UI ENGINE (FOR WEAK INTERNET)
  // ============================================================================

  // 1. OPTIMISTIC DELETE
  const deleteAsset = async (e: React.MouseEvent, assetToDelete: Asset) => {
    e.preventDefault(); e.stopPropagation();
    
    if (!confirm(`Permanently delete "${assetToDelete.title || 'this image'}"?`)) return;
    
    // 🟢 INSTANT UI UPDATE (Don't wait for the internet)
    const previousAssets = [...assets];
    const remainingAssets = assets.filter(a => a.id !== assetToDelete.id);
    
    // Auto-collapse positions to close the gap immediately
    const reorderedAssets = remainingAssets.map((asset, index) => ({
      ...asset, position: index + 1
    }));
    
    setAssets(reorderedAssets); 
    setIsSyncingBackground(true);

    try {
      // 🟡 BACKGROUND DB SYNC (Fire and Forget)
      const { error: dbError } = await supabase.from('gallery').delete().eq('id', assetToDelete.id);
      if (dbError) throw dbError;
      
      // Cleanup storage silently
      if (assetToDelete.file_path) {
        supabase.storage.from('media-gallery').remove([assetToDelete.file_path]); 
      }

      // Sync collapsed positions in the background
      await Promise.all(
        reorderedAssets.map(asset => supabase.from('gallery').update({ position: asset.position }).eq('id', asset.id))
      );
    } catch (error: any) {
      // 🔴 ROLLBACK IF INTERNET FAILS
      setAssets(previousAssets); 
      alert("Network dropped. Deletion failed: " + error.message);
    } finally {
      setIsSyncingBackground(false);
    }
  };

  // 2. OPTIMISTIC EDIT
  const saveUpdates = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    
    // 🟢 INSTANT UI UPDATE
    const previousAssets = [...assets];
    setAssets(prev => {
      const updated = prev.map(a => a.id === id ? { ...a, ...editForm, position: Number(editForm.position) } : a);
      return updated.sort((a, b) => (a.position ?? 999) - (b.position ?? 999));
    });
    setEditingId(null);
    setIsSyncingBackground(true);

    try {
      // 🟡 BACKGROUND DB SYNC
      const { error } = await supabase.from('gallery').update({
        title: editForm.title,
        category: editForm.category,
        position: Number(editForm.position)
      }).eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      // 🔴 ROLLBACK
      setAssets(previousAssets);
      alert("Network dropped. Update failed: " + error.message);
    } finally {
      setIsSyncingBackground(false);
    }
  };

  // 3. OPTIMISTIC DRAG & DROP
  const performReorder = async (sourceId: string, targetId: string) => {
    // 🟢 INSTANT UI UPDATE
    const oldAssets = [...assets];
    const sourceIndex = oldAssets.findIndex(a => a.id === sourceId);
    const targetIndex = oldAssets.findIndex(a => a.id === targetId);

    const newAssets = [...oldAssets];
    const [movedAsset] = newAssets.splice(sourceIndex, 1);
    newAssets.splice(targetIndex, 0, movedAsset);

    const updatedAssets = newAssets.map((asset, index) => ({
      ...asset, position: index + 1
    }));

    setAssets(updatedAssets);
    setIsSyncingBackground(true);

    try {
      // 🟡 BACKGROUND DB SYNC
      await Promise.all(
        updatedAssets.map(asset => supabase.from('gallery').update({ position: asset.position }).eq('id', asset.id))
      );
    } catch (err) {
      // 🔴 ROLLBACK
      setAssets(oldAssets); 
      alert("Network dropped. Grid sync failed.");
    } finally {
      setIsSyncingBackground(false);
    }
  };

  // --- HTML5 DESKTOP DRAG HANDLERS ---
  const isDragEnabled = activeCat === "All" && editingId === null;

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

  // --- MOBILE TOUCH DRAG HANDLERS ---
  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (!isDragEnabled) return;
    setDraggedId(id);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragEnabled || !draggedId) return;
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetCard = element?.closest('[data-drag-id]');
    if (targetCard) {
      const targetId = targetCard.getAttribute('data-drag-id');
      if (targetId && targetId !== dragOverId && targetId !== draggedId) setDragOverId(targetId);
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragEnabled || !draggedId) return;
    if (dragOverId && draggedId !== dragOverId) performReorder(draggedId, dragOverId);
    setDraggedId(null);
    setDragOverId(null);
  };

  // --- UI TRIGGERS ---
  const startEditing = (e: React.MouseEvent, asset: Asset) => {
    e.preventDefault(); e.stopPropagation();
    setEditingId(asset.id);
    setEditForm({ title: asset.title || '', category: asset.category || '', position: asset.position || 0 });
  };


  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
        <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-zinc-500">Loading Vault</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500 selection:text-black relative pb-24 overflow-x-hidden">
      
      {/* HEADER */}
      <header className="px-4 md:px-10 pt-28 md:pt-36 pb-6 flex items-end justify-between border-b border-white/5 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black italic tracking-tighter uppercase leading-none drop-shadow-lg">
            Media<span className="text-cyan-400 not-italic">.</span>Manager
          </h1>
          <p className="text-[9px] md:text-[10px] font-mono tracking-[0.3em] uppercase opacity-40 mt-4 flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isSyncingBackground ? 'bg-amber-500 animate-pulse' : 'bg-cyan-500'}`} />
            {filteredItems.length} Assets • {isSyncingBackground ? 'Syncing...' : 'Live'}
          </p>
        </div>
        
        {isSyncingBackground && (
          <div className="hidden sm:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" /> Network Sync...
          </div>
        )}
      </header>

      {/* WARNING BANNER */}
      {activeCat !== "All" && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-3 flex items-center justify-center gap-2 text-amber-500 text-xs font-bold tracking-widest uppercase">
          <ShieldAlert className="w-4 h-4" /> Reordering Disabled While Filtering
        </div>
      )}

      {/* EXACT BENTO GRID LAYOUT */}
      <main className="p-3 md:p-6 lg:p-10 pt-6 relative z-10 max-w-7xl mx-auto">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {filteredItems.map((asset, index) => {
              
              // mathematical pattern for exact gallery matching
              const isFeatured = index % 3 === 0;
              const isEditing = editingId === asset.id;
              const isDragging = draggedId === asset.id;
              const isDragOver = dragOverId === asset.id;

              // Shared Wrapper Styles
              const baseClasses = `relative rounded-2xl md:rounded-3xl overflow-hidden shadow-lg transition-all duration-300 group
                ${isDragging ? 'opacity-30 scale-95' : ''} 
                ${isDragOver ? 'border-2 border-cyan-500 shadow-[0_0_40px_rgba(6,182,212,0.5)] scale-[1.02] bg-cyan-500/10 z-50' : 'border border-white/10'}
                ${isFeatured ? 'col-span-2 md:col-span-2 lg:col-span-2 flex flex-col bg-black' : 'col-span-1 aspect-[3/4] md:aspect-square bg-black'}
              `;

              return (
                <div 
                  key={asset.id} 
                  data-drag-id={asset.id}
                  draggable={isDragEnabled}
                  onDragStart={(e) => handleDragStart(e, asset.id)}
                  onDragOver={(e) => handleDragOver(e, asset.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, asset.id)}
                  className={baseClasses}
                >
                  
                  {/* --- TOP UI: POSITION, CATEGORY, ACTIONS --- */}
                  <div className="absolute top-2 right-2 md:top-4 md:right-4 z-50 flex items-center gap-2">
                    {/* Position & Category Pill */}
                    <div className="flex items-center bg-cyan-600/90 backdrop-blur-md rounded-full shadow-sm pr-2 overflow-hidden pointer-events-none">
                      <span className="bg-black/50 text-white font-black text-[9px] px-2 py-1.5 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-cyan-300" /> {asset.position || 0}
                      </span>
                      <span className="text-[8px] md:text-[9px] font-black tracking-widest uppercase text-white pl-2">
                        {asset.category || "MEDIA"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {!isEditing && (
                      <div className="flex gap-1.5 bg-black/50 backdrop-blur-xl p-1 rounded-xl border border-white/10 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => startEditing(e, asset)} className="w-8 h-8 bg-zinc-800/80 hover:bg-cyan-500 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => deleteAsset(e, asset)} className="w-8 h-8 bg-zinc-800/80 hover:bg-red-500 text-white rounded-lg flex items-center justify-center transition-all cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Drag Handle (Desktop + Mobile) */}
                        {isDragEnabled && (
                          <div 
                            className="w-8 h-8 bg-zinc-800/80 text-cyan-400 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
                            onTouchStart={(e) => handleTouchStart(e, asset.id)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* --- FEATURED LAYOUT (Top Image, Bottom Text) --- */}
                  {isFeatured ? (
                    <>
                      <div className="w-full aspect-video md:aspect-[21/9] relative bg-zinc-900 shrink-0 pointer-events-none">
                        <img src={asset.image_url} className="w-full h-full object-cover" alt="thumbnail" />
                      </div>
                      <div className="p-5 md:p-6 bg-black flex flex-col justify-center flex-1">
                        {isEditing ? (
                          // INLINE EDIT FORM (FEATURED)
                          <div className="flex flex-col md:flex-row gap-3 w-full animate-in fade-in">
                            <input 
                              type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})}
                              className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-cyan-500 outline-none placeholder:text-zinc-600" placeholder="Title..."
                            />
                            <div className="flex gap-2">
                              <input 
                                type="text" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}
                                className="w-32 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none" placeholder="Category"
                              />
                              <input 
                                type="number" value={editForm.position} onChange={e => setEditForm({...editForm, position: parseInt(e.target.value) || 0})}
                                className="w-16 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-cyan-500 outline-none text-center font-mono"
                              />
                              <button onClick={(e) => saveUpdates(e, asset.id)} className="w-10 h-10 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl flex items-center justify-center transition-all">
                                <Save className="w-4 h-4" />
                              </button>
                              <button onClick={(e) => { e.preventDefault(); setEditingId(null); }} className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl flex items-center justify-center transition-all">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // NORMAL DISPLAY (FEATURED)
                          <>
                            <h3 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-none text-white mb-2 line-clamp-2">
                              {asset.title || "Untitled"}
                            </h3>
                            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                              <Camera className="w-3.5 h-3.5 text-cyan-500" /> {asset.photographer || "Studio Hub"}
                            </p>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    
                  /* --- STANDARD HALF-WIDTH LAYOUT (Full Image, Overlay Text) --- */
                    <>
                      <img src={asset.image_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none" alt="thumbnail" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 pointer-events-none" />
                      
                      {isEditing ? (
                         // OVERLAY EDIT FORM (STANDARD)
                         <div className="absolute inset-0 bg-black/95 z-40 p-4 flex flex-col justify-center animate-in fade-in">
                            <label className="text-[8px] uppercase text-cyan-500 font-bold mb-1">Title</label>
                            <input 
                              type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})}
                              className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none mb-3"
                            />
                            <div className="flex gap-2 mb-4">
                              <div className="flex-1">
                                <label className="text-[8px] uppercase text-cyan-500 font-bold mb-1">Category</label>
                                <input type="text" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:border-cyan-500 outline-none" />
                              </div>
                              <div className="w-16">
                                <label className="text-[8px] uppercase text-cyan-500 font-bold mb-1">Pos</label>
                                <input type="number" value={editForm.position} onChange={e => setEditForm({...editForm, position: parseInt(e.target.value) || 0})} className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:border-cyan-500 outline-none text-center" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={(e) => saveUpdates(e, asset.id)} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg py-2 flex items-center justify-center gap-2 text-xs font-bold transition-all"><Save className="w-3 h-3"/> Save</button>
                              <button onClick={(e) => { e.preventDefault(); setEditingId(null); }} className="px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg py-2 flex items-center justify-center transition-all"><X className="w-4 h-4"/></button>
                            </div>
                         </div>
                      ) : (
                        // NORMAL DISPLAY (STANDARD)
                        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 z-10 pointer-events-none">
                          <h3 className="text-[1.1rem] md:text-2xl font-black italic uppercase tracking-tighter leading-[1.1] text-white drop-shadow-md mb-1.5 line-clamp-3">
                            {asset.title || "Untitled"}
                          </h3>
                          <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                            <Camera className="w-3 h-3 text-cyan-400" /> {asset.photographer || "Studio Hub"}
                          </p>
                        </div>
                      )}
                    </>
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

      {/* FLOATING BOTTOM FILTER DOCK */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[94vw] max-w-2xl bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.9)]">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar snap-x touch-pan-x items-center [&::-webkit-scrollbar]:hidden">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className={`snap-center whitespace-nowrap text-[10px] md:text-xs font-black uppercase tracking-widest px-5 py-3 rounded-xl transition-all duration-300 active:scale-95 ${
                activeCat === cat
                  ? "bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                  : "bg-transparent text-zinc-400 hover:bg-white/10 hover:text-white"
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