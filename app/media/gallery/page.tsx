"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/ConditionalNavbar";
import Footer from "@/components/Footer";
import {
  Image as ImageIcon,
  Maximize2,
  Loader2,
  Camera,
  X,
} from "lucide-react";

export default function GalleryPage() {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  async function fetchGallery() {
    try {
      // 1. Fetch the list of files from the 'media-gallery' bucket
      const { data, error } = await supabase.storage
        .from("media-gallery")
        .list("", {
          limit: 100,
          order: { column: "created_at", ascending: false },
        });

      if (error) throw error;

      if (data) {
        // 2. Generate public URLs for each image
        const imageUrls = data.map((file) => ({
          name: file.name,
          url: supabase.storage.from("media-gallery").getPublicUrl(file.name)
            .data.publicUrl,
        }));
        setImages(imageUrls);
      }
    } catch (err) {
      console.error("Error fetching gallery:", err);
    } finally {
      setLoading(false);
    }
  }

  // Prevent scrolling when the lightbox is open
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [selectedImage]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-zinc-400 selection:bg-indigo-500/30 selection:text-indigo-200">
      <Navbar />

      <main className="grow max-w-7xl mx-auto px-6 pt-32 pb-20 w-full">
        {/* Header Section */}
        <div className="relative text-center mb-24 space-y-6">
          {/* Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-indigo-500/10 blur-[100px] pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] relative z-10 shadow-xl">
            <Camera className="w-4 h-4" /> Visual Archive
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white relative z-10">
            FEST <span className="text-indigo-500">MOMENTS</span>
          </h1>

          <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto font-medium relative z-10">
            Relive the highlights of the arts festival through our official
            lens.
          </p>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse"></div>
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative z-10" />
            </div>
            <p className="text-sm font-black uppercase tracking-[0.3em] text-zinc-500">
              Developing Film...
            </p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-32 bg-zinc-900/30 border-2 border-dashed border-zinc-800/50 rounded-[3rem] backdrop-blur-sm">
            <ImageIcon className="w-16 h-16 text-zinc-700 mx-auto mb-6" />
            <p className="text-zinc-500 font-black text-2xl tracking-tighter">
              THE VAULT IS EMPTY
            </p>
            <p className="text-zinc-600 font-medium mt-2">
              No photos have been uploaded yet.
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {images.map((img, index) => (
              <div
                key={index}
                className="relative group overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-zinc-800/80 cursor-pointer break-inside-avoid hover:border-indigo-500/50 hover:shadow-[0_0_40px_rgba(79,70,229,0.15)] transition-all duration-500"
                onClick={() => setSelectedImage(img.url)}
              >
                <img
                  src={img.url}
                  alt={img.name}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a]/80 via-[#0a0a0a]/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                  <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500 p-4 bg-white/10 backdrop-blur-md rounded-full border border-white/20 shadow-xl">
                    <Maximize2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Lightbox / Fullscreen Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-100 bg-[#0a0a0a]/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close button */}
          <button
            className="absolute top-6 right-6 sm:top-10 sm:right-10 p-4 bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-full text-zinc-400 hover:text-white transition-all backdrop-blur-md group z-50"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
          </button>

          <img
            src={selectedImage}
            className="max-w-full max-h-[90vh] rounded-4xl sm:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-zinc-800 object-contain relative z-40"
            alt="Full view"
            onClick={(e) => e.stopPropagation()} // Prevent clicking the image from closing the modal
          />
        </div>
      )}
    </div>
  );
}
