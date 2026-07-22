import Navbar from "@/components/ConditionalNavbar";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { supabase } from "@/lib/supabase";
import { CalendarDays, Activity, ServerCrash } from "lucide-react";

// Force real-time data fetching
export const revalidate = 0;

export default async function PublicEventsPage() {
  // Fetch all events AND their category names for the EventCard
  const { data: events, error } = await supabase
    .from("events")
    .select("*, categories(name)")
    .order("event_date", { ascending: true });

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 font-sans relative overflow-hidden">
      {/* ⚡ Ambient Background Effects */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-40" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto px-6 lg:px-8 pt-32 md:pt-40 pb-24 w-full relative z-10">
        {/* ⚡ Page Header */}
        <div className="text-center mb-16 md:mb-24 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-4 shadow-[0_0_30px_rgba(79,70,229,0.15)] relative group">
            <CalendarDays className="w-6 h-6 text-indigo-400" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase italic">
            Event <span className="text-indigo-500">Matrix</span>
          </h1>

          <div className="flex items-center justify-center gap-4 text-zinc-500 font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em]">
            <span className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-indigo-500" /> Live Schedule
            </span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
            <span className="text-emerald-500 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />{" "}
              Network Synced
            </span>
          </div>
        </div>

        {/* ⚡ Content Area */}
        {error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-red-500/5 border border-red-500/20 rounded-[3rem] text-red-400 max-w-2xl mx-auto animate-in zoom-in-95 backdrop-blur-xl">
            <ServerCrash className="w-12 h-12 mb-4 text-red-500" />
            <h2 className="text-xl font-black uppercase tracking-widest text-white mb-2">
              Node Failure
            </h2>
            <p className="font-mono text-xs text-center leading-relaxed opacity-80 uppercase tracking-widest">
              Failed to connect to the event matrix database. <br />{" "}
              {error.message}
            </p>
          </div>
        ) : !events || events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-[3rem] bg-black/40 backdrop-blur-xl animate-in zoom-in-95">
            <CalendarDays className="w-16 h-16 text-zinc-800 mb-6" />
            <p className="text-white font-black text-xl md:text-2xl uppercase tracking-tighter mb-2">
              Matrix is Empty
            </p>
            <p className="text-zinc-500 font-mono text-[10px] md:text-xs uppercase tracking-widest">
              No events deployed by Command Center yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
