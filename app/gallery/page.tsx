"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Camera, Compass } from "lucide-react";
import { Anek_Malayalam } from "next/font/google"; // <--- ⚡ IMPORT FONT

// ⚡ INIT ANEK MALAYALAM FONT (Extra Bold)
const malayalamFont = Anek_Malayalam({
  subsets: ["malayalam"],
  weight: ["400", "500", "700", "800"],
});

type GalleryAsset = {
  id: string;
  image_url: string;
  title: string;
  category: string;
  photographer: string;
  created_at: string;
};

export default function LiveBentoGallery() {
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState("All");

  // ⚡ BOOT: Fetch Live Media from Supabase
  useEffect(() => {
    const fetchVault = async () => {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setAssets(data);
      setLoading(false);
    };
    fetchVault();
  }, []);

  // ⚡ DYNAMIC CATEGORIES: Extract and CLEAN available categories
  const availableCategories = useMemo(() => {
    // Extract categories, remove undefined/null, trim extra spaces, and apply Type Guard
    const validCats = assets
      .map((a) => (a.category ? a.category.trim() : null))
      .filter((cat): cat is string => cat !== null && cat !== ""); 

    const cats = new Set(validCats);
    return ["All", ...Array.from(cats)].sort();
  }, [assets]);

  // ⚡ FILTER ENGINE: Safely match trimmed categories
  const filteredItems = useMemo(() => {
    return assets.filter((item) => {
      if (activeCat === "All") return true;
      const safeCategory = item.category ? item.category.trim() : "";
      return safeCategory === activeCat;
    });
  }, [assets, activeCat]);

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
    <div className="min-h-screen bg-[#000000] text-white font-sans selection:bg-cyan-500 selection:text-black relative pb-32">
      
      {/* 1. APP-STYLE HEADER */}
      <header className="px-4 md:px-10 pt-12 pb-6 flex items-end justify-between border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black italic tracking-tighter uppercase leading-none">
            Media<span className="text-cyan-400 not-italic">.</span>Vault
          </h1>
          <p className="text-[9px] md:text-[10px] font-mono tracking-[0.3em] uppercase opacity-40 mt-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
            {filteredItems.length} Records Found
          </p>
        </div>
      </header>

      {/* 2. TRUE MOBILE BENTO GRID */}
      <main className="p-2 md:p-10 pt-4 md:pt-10">
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 grid-flow-row-dense gap-2 md:gap-4 auto-rows-[180px] md:auto-rows-[280px]">
            {filteredItems.map((item, index) => {
              const isLarge = index % 4 === 0 || index % 7 === 0;
              const spanClass = isLarge 
                ? "col-span-2 row-span-2 md:col-span-2" 
                : "col-span-1 row-span-1";

              return (
                <div
                  key={item.id}
                  className={`${spanClass} group relative rounded-xl md:rounded-3xl overflow-hidden bg-[#0a0a0a] border border-white/5 cursor-pointer`}
                >
                  <img
                    src={item.image_url}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110 lg:opacity-70 lg:group-hover:opacity-100"
                    alt={item.title || "Gallery Asset"}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent lg:opacity-80 lg:group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="absolute top-3 right-3 md:top-5 md:right-5">
                    <span className="px-2.5 py-1 bg-black/50 backdrop-blur-xl border border-white/10 rounded-md text-[8px] md:text-[10px] font-black tracking-widest uppercase text-cyan-400">
                      {item.category || "UNCATEGORIZED"}
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 lg:translate-y-2 lg:group-hover:translate-y-0 transition-transform duration-500">
                    {/* ⚡ ANEK MALAYALAM EXTRABOLD FONT APPLIED BELOW */}
                    <h3 className={`font-extrabold uppercase italic tracking-tighter leading-none text-white drop-shadow-xl ${malayalamFont.className} ${isLarge ? 'text-2xl md:text-4xl' : 'text-lg md:text-2xl'}`}>
                      {item.title || "Untitled"}
                    </h3>
                    <p className="text-[9px] md:text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1.5 md:mt-2 flex items-center gap-1.5">
                      <Camera className="w-3 h-3 text-cyan-500" /> {item.photographer || "Studio Hub"}
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