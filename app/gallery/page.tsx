"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Camera, Compass } from "lucide-react";

type GalleryAsset = {
  id: string;
  image_url: string;
  title: string;
  category: string;
  photographer: string;
  created_at: string;
  position?: number;
};

export default function LiveBentoGallery() {
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("All");

  // ⚡ BOOT & REALTIME SYNC
  useEffect(() => {
    const fetchVault = async () => {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("position", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (!error && data) setAssets(data);
      setLoading(false);
    };

    fetchVault();

    const channel = supabase
      .channel('public-gallery-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gallery' },
        () => fetchVault()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  if (loading) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-500" />
        <p className="text-[10px] font-mono tracking-[0.4em] uppercase text-zinc-500">
          Loading Media
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-cyan-500 selection:text-black relative pb-24">
      
      {/* 2. EXACT SCREENSHOT BENTO GRID */}
      <main className="p-3 md:p-6 lg:p-10 pt-6 relative z-10 max-w-7xl mx-auto">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {filteredItems.map((item, index) => {
              // Mathematical pattern to recreate the screenshot's layout:
              // Index 0: Full width. Index 1 & 2: Half width. (Repeats)
              const isFeatured = index % 3 === 0;

              if (isFeatured) {
                // 🟢 FEATURED FULL-WIDTH CARD
                return (
                  <div
                    key={item.id}
                    className="col-span-2 md:col-span-2 lg:col-span-2 flex flex-col bg-black border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-500"
                  >
                    <div className="w-full aspect-video md:aspect-[21/9] relative bg-zinc-900">
                      <img
                        src={item.image_url}
                        className="w-full h-full object-cover"
                        alt={item.title || "Gallery Asset"}
                        loading="lazy"
                      />
                    </div>
                    <div className="p-5 md:p-6 bg-black flex flex-col justify-center">
                      <h3 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter leading-none text-white mb-2 line-clamp-2">
                        {item.title || "Untitled"}
                      </h3>
                      <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                        <Camera className="w-3.5 h-3.5 text-cyan-500" /> {item.photographer || "Studio Hub"}
                      </p>
                    </div>
                  </div>
                );
              }

              // 🟢 STANDARD HALF-WIDTH OVERLAY CARD
              return (
                <div
                  key={item.id}
                  className="col-span-1 relative aspect-[3/4] md:aspect-square bg-black border border-white/10 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-500 group"
                >
                  <img
                    src={item.image_url}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt={item.title || "Gallery Asset"}
                    loading="lazy"
                  />
                  
                  {/* Bottom Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90" />
                  
                  {/* Top Right Category Pill */}
                  <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
                    <span className="px-2.5 py-1 bg-cyan-600/80 backdrop-blur-md rounded-full text-[8px] md:text-[9px] font-black tracking-widest uppercase text-white shadow-sm">
                      {item.category || "MEDIA"}
                    </span>
                  </div>

                  {/* Bottom Text Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 z-10">
                    <h3 className="text-[1.1rem] md:text-2xl font-black italic uppercase tracking-tighter leading-[1.1] text-white drop-shadow-md mb-1.5 line-clamp-3">
                      {item.title || "Untitled"}
                    </h3>
                    <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                      <Camera className="w-3 h-3 text-cyan-400" /> {item.photographer || "Studio Hub"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-3xl bg-zinc-900/10">
            <Compass className="w-12 h-12 mb-4 text-zinc-700" />
            <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-zinc-500 text-center px-4">
              Vault empty for this sector.
            </p>
          </div>
        )}
      </main>

      {/* 3. FLOATING BOTTOM FILTER DOCK */}
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