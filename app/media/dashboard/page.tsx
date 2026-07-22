"use client";

import React, { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { UploadCloud, CheckCircle2, Loader2, Cloud } from "lucide-react";

const CATEGORIES = [
  "STAGE PERFORMANCE",
  "CROWD / CANDID",
  "BACKSTAGE / PREP",
  "AWARDS CEREMONY",
  "GENERAL / OTHER"
];

export default function MediaUplink() {
  const [category, setCategory] = useState("BACKSTAGE / PREP");
  const [title, setTitle] = useState("Fest Moment");
  const [photographer, setPhotographer] = useState("Studio Hub");
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setSuccess(false);

    try {
      // 1. Upload to Supabase Storage Bucket ('media-gallery')
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const safeCategoryPath = category.replace(/[^a-zA-Z0-9]/g, "_");
      const storagePath = `${safeCategoryPath}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from("media-gallery")
        .upload(storagePath, file);

      if (storageError) throw storageError;

      // 2. Get the public URL of the uploaded image
      const { data: urlData } = supabase.storage
        .from("media-gallery")
        .getPublicUrl(storagePath);

      // 3. ⚡ THE FIX: Insert into the Gallery table WITH the Category ⚡
      const { error: dbError } = await supabase.from("gallery").insert([
        {
          image_url: urlData.publicUrl,
          category: category,         // <--- This fixes the NULL issue!
          title: title,               // <--- This fixes the NULL issue!
          photographer: photographer  // <--- This fixes the NULL issue!
        }
      ]);

      if (dbError) throw dbError;

      // Success!
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000); // Reset success state after 3s

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload media. Check console for details.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] p-8 md:p-12 text-white selection:bg-cyan-500 selection:text-black">
      {/* Header matching your screenshot */}
      <header className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase flex items-center gap-2">
          MEDIA <span className="text-cyan-500">STUDIO</span>.UPLINK
        </h1>
        <p className="text-[10px] font-mono tracking-[0.3em] uppercase text-zinc-500 mt-2 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-cyan-500" /> HIGH-VOLUME ASSET INGEST ENGINE
        </p>
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Settings Panel */}
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-6">
          
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <span className="text-cyan-500">🏷</span> BATCH CATEGORY
            </label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-500 transition-colors appearance-none"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <span className="text-cyan-500">#</span> ASSET TITLE
            </label>
            <input 
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Main Stage Action"
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

        </div>

        {/* Upload Dropzone */}
        <div 
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative overflow-hidden bg-[#0a0a0a] border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all duration-300 ${
            isUploading 
              ? "border-zinc-800 opacity-50 cursor-not-allowed" 
              : success
                ? "border-green-500/50 bg-green-500/5 cursor-default"
                : "border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 cursor-pointer"
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden" 
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
              <p className="font-bold text-white text-xl">Uplinking Asset...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
              <p className="font-bold text-white text-xl">Asset Ingested Successfully!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 pointer-events-none">
              <UploadCloud className="w-12 h-12 text-cyan-500" />
              <div>
                <p className="font-bold text-white text-xl mb-2">Drop Fest Moments Here</p>
                <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                  OR CLICK TO BROWSE ELIGIBLE ASSET NODES
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}