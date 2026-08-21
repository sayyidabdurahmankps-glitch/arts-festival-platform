"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Trash2,
  ShieldAlert,
  Edit2,
  X,
  Save,
  Hash,
} from "lucide-react";

// Added 'position' to the Asset type
type Asset = {
  id: string;
  image_url: string;
  file_path: string;
  title: string;
  category: string;
  position?: number;
};

export default function MediaAssetManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Action States
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: "",
    category: "",
    position: 0,
  });

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("gallery")
      .select("*")
      // Sort by position first, then newest
      .order("position", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (data) setAssets(data);
    setLoading(false);
  };

  const deleteAsset = async (asset: Asset) => {
    if (!confirm(`Permanently delete "${asset.title}"?`)) return;
    setDeletingId(asset.id);
    try {
      const { error: storageError } = await supabase.storage
        .from("media-gallery")
        .remove([asset.file_path]);
      if (storageError) throw storageError;
      const { error: dbError } = await supabase
        .from("gallery")
        .delete()
        .eq("id", asset.id);
      if (dbError) throw dbError;

      setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (error: any) {
      alert("Deletion Failed: " + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  const startEditing = (asset: Asset) => {
    setEditingId(asset.id);
    setEditForm({
      title: asset.title || "",
      category: asset.category || "",
      position: asset.position || 0,
    });
  };

  const saveUpdates = async (id: string) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("gallery")
        .update({
          title: editForm.title,
          category: editForm.category,
          position: Number(editForm.position),
        })
        .eq("id", id);

      if (error) throw error;

      // Update local state and re-sort to reflect new positions instantly
      setAssets((prev) => {
        const updated = prev.map((a) =>
          a.id === id
            ? { ...a, ...editForm, position: Number(editForm.position) }
            : a,
        );
        return updated.sort((a, b) => {
          const posA = a.position ?? 999;
          const posB = b.position ?? 999;
          if (posA !== posB) return posA - posB;
          return 0;
        });
      });

      setEditingId(null);
    } catch (error: any) {
      alert("Update Failed: " + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-[#050505] p-20 flex items-center justify-center">
        <Loader2 className="animate-spin text-pink-500 w-10 h-10" />
      </div>
    );

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans pb-32">
      <div className="max-w-6xl mx-auto py-12 px-6 lg:px-8 animate-in fade-in">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Asset <span className="text-pink-500">Manager</span>
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase mt-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" /> Destructive
            actions are permanent.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={`bg-zinc-900/40 backdrop-blur-sm border rounded-[2rem] p-4 flex flex-col group transition-all duration-300 ${editingId === asset.id ? "border-pink-500/50 shadow-[0_0_30px_rgba(236,72,153,0.15)]" : "border-white/5 hover:border-white/10"}`}
            >
              {/* IMAGE THUMBNAIL */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-black mb-4 border border-white/5 shrink-0">
                <img
                  src={asset.image_url}
                  alt="thumbnail"
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                />

                {/* Visual Position & Category Badge */}
                <div className="absolute top-2 left-2 flex items-center gap-2">
                  <span className="bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase text-white px-2 py-1 rounded flex items-center gap-1">
                    <Hash className="w-3 h-3 text-pink-500" />{" "}
                    {asset.position || 0}
                  </span>
                  <span className="bg-black/80 backdrop-blur-md border border-white/10 text-[8px] font-black uppercase text-pink-400 px-2 py-1 rounded">
                    {asset.category}
                  </span>
                </div>
              </div>

              {/* EDIT MODE */}
              {editingId === asset.id ? (
                <div className="flex flex-col gap-3 flex-1">
                  <div>
                    <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold ml-1 mb-1 block">
                      Caption / Title
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-pink-500 outline-none"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold ml-1 mb-1 block">
                        Category
                      </label>
                      <input
                        type="text"
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm({ ...editForm, category: e.target.value })
                        }
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-pink-500 outline-none"
                      />
                    </div>
                    <div className="w-24">
                      <label className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold ml-1 mb-1 block">
                        Grid Pos
                      </label>
                      <input
                        type="number"
                        value={editForm.position}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            position: parseInt(e.target.value) || 0,
                          })
                        }
                        className="w-full bg-black border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:border-pink-500 outline-none text-center font-mono"
                      />
                    </div>
                  </div>

                  {/* Action Buttons (Save / Cancel) */}
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
                      className="flex-1 bg-pink-600/20 hover:bg-pink-600 text-pink-500 hover:text-white border border-pink-500/30 rounded-xl flex items-center justify-center gap-2 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                    >
                      {updating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* NORMAL DISPLAY MODE */
                <div className="flex justify-between items-start px-2 flex-1 mt-1">
                  <div className="truncate pr-4 flex-1">
                    <p
                      className="font-bold text-white text-sm truncate"
                      title={asset.title}
                    >
                      {asset.title}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEditing(asset)}
                      className="w-9 h-9 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 rounded-xl flex items-center justify-center transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAsset(asset)}
                      disabled={deletingId === asset.id}
                      className="w-9 h-9 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                    >
                      {deletingId === asset.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
