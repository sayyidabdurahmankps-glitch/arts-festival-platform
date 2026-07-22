"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Anek_Malayalam } from "next/font/google"; 
import {
  UploadCloud,
  X,
  Loader2,
  ImagePlus,
  Tag,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Hash,
  MessageSquare,
} from "lucide-react";

// ⚡ INIT ANEK MALAYALAM FONT (Added '800' for Extra Bold)
const malayalamFont = Anek_Malayalam({
  subsets: ["malayalam"],
  weight: ["400", "500", "700", "800"],
});

type UploadQueueItem = {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: "queued" | "compressing" | "uploading" | "success" | "error";
};

type EventData = { id: string; name: string; event_code: string };

export default function MediaStudioUplink() {
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [events, setEvents] = useState<EventData[]>([]);

  // Tagging State
  const [globalCategory, setGlobalCategory] = useState<string>("Stage");
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [caption, setCaption] = useState<string>(""); 

  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FETCH LIVE EVENTS FOR TAGGING
  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, name, event_code")
        .order("name");
      if (data) setEvents(data);
    };
    fetchEvents();
  }, []);

  const addFilesToQueue = (files: FileList | null) => {
    if (!files) return;
    const newItems: UploadQueueItem[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        preview: URL.createObjectURL(file),
        status: "queued",
        progress: 0,
      }));
    setUploadQueue((prev) => [...prev, ...newItems]);
  };

  const removeFile = (id: string, preview: string) => {
    URL.revokeObjectURL(preview);
    setUploadQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const processAndUpload = async () => {
    if (uploadQueue.length === 0)
      return alert("System Error: No files in queue.");
    setIsProcessing(true);

    for (const item of uploadQueue) {
      if (item.status === "success") continue;
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: "compressing", progress: 10 } : q,
        ),
      );

      try {
        // 1. Client-Side Compression
        const compressedBlob = await compressImage(item.file);
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "uploading", progress: 50 } : q,
          ),
        );

        // Sanitize filename
        const safeName = item.file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const fileName = `${Date.now()}_${safeName}`;
        const filePath = `compressed/${globalCategory}/${fileName}`;

        // 2. Upload to Supabase Storage Bucket
        const { error: storageError } = await supabase.storage
          .from("media-gallery")
          .upload(filePath, compressedBlob, { contentType: "image/jpeg" });
        if (storageError) throw storageError;

        // 3. Get Public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("media-gallery").getPublicUrl(filePath);

        // CAPTION LOGIC: Use typed caption, otherwise fallback to default
        const finalCaption = caption.trim() !== "" 
          ? caption.trim() 
          : `[${globalCategory}] Festival Moment`;

        // 4. Map to your actual 'gallery' table schema
        const { error: dbError } = await supabase.from("gallery").insert([
          {
            image_url: publicUrl,
            caption: finalCaption, 
            title: finalCaption,   
            category: globalCategory, 
            event_id: selectedEventId || null,
            is_featured: false,
          },
        ] as any);
        
        if (dbError) throw dbError;

        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "success", progress: 100 } : q,
          ),
        );
        URL.revokeObjectURL(item.preview);
      } catch (err) {
        console.error("Upload failed:", err);
        setUploadQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "error", progress: 0 } : q,
          ),
        );
      }
    }
    setIsProcessing(false);
  };

  // Pure Canvas Image Compression
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (ev) => {
        const img = new Image();
        img.src = ev.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let w = img.width,
            h = img.height;
          const MAX = 2000;
          if (w > h && w > MAX) {
            h *= MAX / w;
            w = MAX;
          } else if (h > MAX) {
            w *= MAX / h;
            h = MAX;
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) return reject("Canvas failure");
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject("Blob failed")),
            "image/jpeg",
            0.7,
          );
        };
      };
      reader.onerror = (err) => reject(err);
    });
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto animate-in fade-in duration-700 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-8 gap-6 mb-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
            Media <span className="text-cyan-500">Studio</span>.Uplink
          </h1>
          <p className="text-zinc-500 font-mono text-xs mt-2 uppercase tracking-widest">
            <UploadCloud className="w-4 h-4 inline text-cyan-500 mr-2" />{" "}
            High-Volume Asset Ingest Engine
          </p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-xl text-cyan-400 font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Certified Media Node
        </div>
      </header>

      {/* 🟢 TAGGING METADATA */}
      <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2.5rem] grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />

        {/* 1. Category */}
        <div className="relative z-10">
          <label className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-500" /> Batch Category
          </label>
          <select
            value={globalCategory}
            onChange={(e) => setGlobalCategory(e.target.value)}
            className="w-full bg-black border border-zinc-800 text-white font-black py-4 px-5 rounded-2xl outline-none focus:border-cyan-500 uppercase cursor-pointer text-xs tracking-widest transition-colors"
          >
            <option value="Stage">Stage Performance</option>
            <option value="Crowd">Crowd / Candid</option>
            <option value="Backstage">Backstage / Prep</option>
            <option value="Awards">Awards Ceremony</option>
            <option value="General">General / Other</option>
          </select>
        </div>

        {/* 2. Event Link */}
        <div className="relative z-10">
          <label className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-3 flex items-center gap-2">
            <Hash className="w-4 h-4 text-cyan-500" /> Link to Event (Optional)
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-black border border-zinc-800 text-white font-black py-4 px-5 rounded-2xl outline-none focus:border-cyan-500 uppercase cursor-pointer text-xs tracking-widest transition-colors"
          >
            <option value="">-- No Specific Event --</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.event_code}: {e.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. CAPTION WITH ANEK MALAYALAM EXTRA BOLD APPLIED */}
        <div className="relative z-10 md:col-span-2">
          <label className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-500" /> Asset Caption
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Type your caption here... (e.g., ഉത്സവ കാഴ്ച്ചകൾ)"
            // ⚡ CHANGED to `font-extrabold` below!
            className={`w-full bg-black border border-zinc-800 text-white font-extrabold py-4 px-5 rounded-2xl outline-none focus:border-cyan-500 cursor-text text-sm transition-colors placeholder:text-zinc-600 ${malayalamFont.className}`}
          />
        </div>
      </div>

      {/* 🟢 DROPZONE */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="h-48 border-2 border-cyan-500/30 border-dashed rounded-[2.5rem] bg-black hover:border-cyan-500 hover:bg-zinc-900 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group mb-10 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/5 transition-colors duration-500" />
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={(e) => addFilesToQueue(e.target.files)}
          accept="image/*"
          className="hidden"
        />
        <ImagePlus className="w-10 h-10 text-cyan-500 group-hover:scale-110 transition-transform duration-500 relative z-10" />
        <p className="font-black text-white text-lg tracking-tight relative z-10">
          Drop Fest Moments Here
        </p>
        <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest relative z-10">
          or Click to browse eligible asset nodes
        </p>
      </div>

      {/* 🟢 TRANSMISSION QUEUE */}
      {uploadQueue.length > 0 && (
        <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[3rem]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-white uppercase tracking-widest">
              Transmission Queue
            </h2>
            <p className="text-xs font-mono text-cyan-500">
              {uploadQueue.length} files loaded
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {uploadQueue.map((item) => (
              <div
                key={item.id}
                className="bg-black/50 border border-white/5 rounded-3xl p-3 relative group hover:border-cyan-500/30 transition-colors"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10 mb-3">
                  <img
                    src={item.preview}
                    alt="preview"
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/80 font-black uppercase text-[8px] tracking-widest border border-white/10 flex items-center gap-1.5 backdrop-blur-md">
                    {item.status === "success" && (
                      <CheckCircle className="w-3 h-3 text-cyan-500" />
                    )}
                    {item.status === "uploading" && (
                      <Loader2 className="w-3 h-3 text-indigo-500 animate-spin" />
                    )}
                    {item.status === "compressing" && (
                      <Loader2 className="w-3 h-3 text-cyan-500 animate-spin" />
                    )}
                    {item.status === "error" && (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                    <span
                      className={
                        item.status === "success"
                          ? "text-cyan-500"
                          : "text-zinc-300"
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                  {(item.status === "queued" || item.status === "error") && (
                    <button
                      onClick={() => removeFile(item.id, item.preview)}
                      className="absolute bottom-2 right-2 p-2 bg-black/80 rounded-lg border border-white/10 hover:bg-red-500 hover:border-red-500 transition-all group/btn"
                    >
                      <X className="w-4 h-4 text-zinc-400 group-hover/btn:text-white" />
                    </button>
                  )}
                </div>
                <p className="font-bold text-zinc-400 text-[10px] truncate px-1 mb-2 uppercase tracking-widest">
                  {item.file.name}
                </p>
                {item.status !== "queued" && item.status !== "success" && (
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === "success" && (
                  <div className="text-cyan-400 font-black text-[9px] uppercase tracking-widest text-center bg-cyan-500/10 py-2 rounded-lg flex items-center justify-center gap-1.5 border border-cyan-500/20">
                    <CheckCircle className="w-3 h-3" /> Transmitted
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-12 flex justify-center border-t border-white/5 pt-10">
            <button
              onClick={processAndUpload}
              disabled={isProcessing}
              className="bg-cyan-600 text-white font-black uppercase tracking-[0.4em] text-xs py-5 px-12 rounded-2xl hover:bg-cyan-500 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)] disabled:opacity-20 disabled:shadow-none flex items-center gap-3"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <>
                  Transmit Data Node <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}