"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { CalendarDays, MapPin, Download, X, Loader2, Search, AlertTriangle, CheckCircle } from "lucide-react";

export default function EventCard({ event }: { event: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchId, setSearchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isDeclared = event.status?.toUpperCase() === "DECLARED";
  const isGeneral = event.category?.toUpperCase() === "GENERAL";

  const fetchCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return setErrorMsg("Please enter an ID.");
    
    setLoading(true);
    setErrorMsg("");

    try {
      let resultIdToFetch = null;

      if (isGeneral) {
        // 1. Group Event: Search by Team Name
        const { data: team } = await supabase.from("teams").select("id").ilike("name", searchId.trim()).single();
        if (!team) throw new Error("Team not found.");

        const { data: result } = await supabase.from("results").select("id").eq("event_id", event.id).eq("team_id", team.id).single();
        if (!result) throw new Error("This team did not win a certificate for this event.");
        resultIdToFetch = result.id;
      } else {
        // 2. Individual Event: Search by Participant ID
        const { data: participant } = await supabase.from("participants").select("id").ilike("participant_id", searchId.trim()).single();
        if (!participant) throw new Error("Participant ID not found.");

        const { data: result } = await supabase.from("results").select("id").eq("event_id", event.id).eq("participant_id", participant.id).single();
        if (!result) throw new Error("This participant did not win a certificate for this event.");
        resultIdToFetch = result.id;
      }

      // 3. Fetch the Certificate URL
      const { data: cert } = await supabase.from("certificates").select("file_url").eq("result_id", resultIdToFetch).single();
      if (!cert?.file_url) throw new Error("Certificate document has not been uploaded yet.");

      // Success! Open PDF and close modal
      window.open(cert.file_url, '_blank');
      setIsModalOpen(false);
      setSearchId("");

    } catch (err: any) {
      setErrorMsg(err.message || "Failed to retrieve certificate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ⚡ THE EVENT CARD */}
      <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-6 hover:border-indigo-500/50 hover:shadow-[0_0_40px_rgba(79,70,229,0.1)] transition-all duration-500 flex flex-col relative overflow-hidden group">
        
        {/* Status Badge */}
        <div className="flex justify-between items-start mb-4 relative z-10">
          <span className="bg-white/5 border border-white/10 text-zinc-400 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
            {event.category || event.categories?.name || "Event"}
          </span>
          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
            isDeclared ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}>
            {event.status || "Upcoming"}
          </span>
        </div>

        <h3 className="text-2xl font-black text-white tracking-tight leading-tight mb-2 relative z-10">
          {event.name}
        </h3>

        <div className="space-y-2 mb-8 relative z-10">
          {event.event_date && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <span>{new Date(event.event_date).toLocaleDateString()}</span>
            </div>
          )}
          {event.venue && (
            <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>{event.venue}</span>
            </div>
          )}
        </div>

        <div className="mt-auto relative z-10">
          {isDeclared ? (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-full py-3.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500 border border-indigo-500/20 hover:border-indigo-400 text-indigo-400 hover:text-white transition-all text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-inner group/btn"
            >
              <Download className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" /> 
              Download Certificate
            </button>
          ) : (
            <div className="w-full py-3.5 rounded-xl bg-white/5 border border-white/5 text-zinc-500 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 cursor-not-allowed">
              Results Pending
            </div>
          )}
        </div>
      </div>

      {/* ⚡ THE VERIFICATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setIsModalOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="bg-[#050505] border border-white/10 rounded-[2rem] p-8 w-full max-w-md relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">
              Verify <span className="text-indigo-400">Identity</span>
            </h2>
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-8">
              {event.name}
            </p>

            <form onSubmit={fetchCertificate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                  {isGeneral ? "Enter Team Name" : "Enter Participant ID"}
                </label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={searchId}
                    onChange={(e) => setSearchId(e.target.value)}
                    placeholder={isGeneral ? "e.g. Red Dragons" : "e.g. UID12345"}
                    className="w-full bg-black border border-white/10 focus:border-indigo-500 rounded-xl py-4 pl-12 pr-4 text-white font-bold tracking-widest outline-none transition-all focus:shadow-[0_0_20px_rgba(79,70,229,0.2)] placeholder:text-zinc-700"
                    autoFocus
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs font-bold animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-4 h-4" /> Validate & Download</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}