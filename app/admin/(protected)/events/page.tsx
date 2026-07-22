"use client"

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  CalendarPlus, MapPin, Trash2, CheckCircle2, 
  ListFilter, Mic, PenTool, User, Users, Loader2, Upload, Download, Calendar, Award
} from 'lucide-react';

export default function EventManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');

  // ⚡ UPDATED: Added event_date and mark_tier to match schema
  const [newEvent, setNewEvent] = useState({
    event_code: '', name: '', category: '', event_type: '', event_mode: '', venue: '', event_date: '', mark_tier: 'A'
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data } = await supabase.from('events').select('*').order('event_code', { ascending: true });
    if (data) setEvents(data);
    setLoading(false);
  };

  const deployEvent = async () => {
    if (!newEvent.event_code || !newEvent.name || !newEvent.category || !newEvent.event_type || !newEvent.event_mode) {
      return alert("Missing critical event parameters.");
    }
    
    setIsDeploying(true);
    const { error } = await supabase.from('events').insert([{
      event_code: newEvent.event_code.toUpperCase(),
      name: newEvent.name,
      category: newEvent.category,
      event_type: newEvent.event_type,
      event_mode: newEvent.event_mode,
      venue: newEvent.venue || 'TBD',
      event_date: newEvent.event_date || null, // ⚡ Added date
      mark_tier: newEvent.mark_tier,           // ⚡ Added tier
      status: 'upcoming'                       // ⚡ Matched schema default casing
    }]);
    
    setIsDeploying(false);
    if (error) alert("Deployment failed: " + error.message);
    else {
      setNewEvent({ event_code: '', name: '', category: '', event_type: '', event_mode: '', venue: '', event_date: '', mark_tier: 'A' });
      fetchEvents();
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCSV(true);
    const reader = new FileReader();
    
    reader.onload = async ({ target }) => {
      try {
        const csv = target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        
        // ⚡ UPDATED: Map CSV lines to include event_date and mark_tier
        const payloads = lines.slice(1).map(line => {
          const [event_code, name, category, event_type, event_mode, venue, event_date, mark_tier] = line.split(',');
          return {
            event_code: event_code?.trim().toUpperCase(),
            name: name?.trim(),
            category: category?.trim(),
            event_type: event_type?.trim(),
            event_mode: event_mode?.trim(),
            venue: venue?.trim() || 'TBD',
            event_date: event_date?.trim() || null,
            mark_tier: mark_tier?.trim().toUpperCase() || 'A',
            status: 'upcoming'
          };
        });

        const { error } = await supabase.from('events').insert(payloads);
        
        if (error) throw error;
        
        alert(`${payloads.length} Events Injected Successfully!`);
        fetchEvents();
      } catch (error: any) {
        alert("CSV Parsing Error: " + error.message);
      } finally {
        setIsUploadingCSV(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const deleteEvent = async (id: string, eventCode: string) => {
    if (!window.confirm(`Are you sure you want to delete ${eventCode}? This will cascade and delete all associated scores/results.`)) return;
    
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) alert("Failed to delete event: " + error.message);
    else setEvents(events.filter(e => e.id !== id));
  };

  // ⚡ UPDATED: Added new columns to the downloadable template
  const downloadTemplate = () => {
    const csvContent = "event_code,name,category,event_type,event_mode,venue,event_date,mark_tier\nEV-001,Sample Singing,SENIOR,Stage,Individual,Main Hall,2026-05-15,A\nEV-002,Sample Essay,JUNIOR,Off-Stage,Individual,Room 402,2026-05-16,B";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "FestOS_Events_Template.csv";
    link.click();
  };

  const filteredEvents = events.filter(evt => {
    return (filterCategory ? evt.category === filterCategory : true) &&
           (filterType ? evt.event_type === filterType : true);
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-12">
      
      {/* Header & CSV Upload */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <CalendarPlus className="w-8 h-8 text-emerald-500" />
            Event <span className="text-emerald-500 italic">Matrix</span>
          </h1>
          <p className="text-zinc-500 font-mono text-xs mt-2 flex items-center gap-2 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Advanced Grid Control Node
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={downloadTemplate}
            className="text-zinc-400 hover:text-white bg-zinc-900 border border-white/5 hover:bg-zinc-800 px-4 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2"
          >
            <Download className="w-3 h-3" /> Template
          </button>

          <div className="relative">
            <input 
              type="file" accept=".csv" onChange={handleCSVUpload} disabled={isUploadingCSV}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10" 
            />
            <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              {isUploadingCSV ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
              Bulk Inject CSV
            </button>
          </div>
        </div>
      </div>

      {/* Manual Event Injection */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 flex flex-wrap gap-4 items-center relative overflow-hidden focus-within:border-emerald-500/30 transition-colors">
        <input 
          type="text" placeholder="EV-CODE" value={newEvent.event_code} onChange={e => setNewEvent({...newEvent, event_code: e.target.value})}
          className="w-full md:w-32 bg-black border border-zinc-800 text-emerald-400 font-mono text-sm py-3 px-4 rounded-xl outline-none focus:border-emerald-500 uppercase placeholder:text-zinc-700"
        />
        <input 
          type="text" placeholder="Event Name" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})}
          className="flex-1 min-w-[200px] bg-black border border-zinc-800 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 placeholder:text-zinc-700"
        />
        <select value={newEvent.category} onChange={e => setNewEvent({...newEvent, category: e.target.value})} className="bg-black border border-zinc-800 text-zinc-400 font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 text-xs uppercase tracking-widest">
          <option value="">Category</option>
          <option value="HIFZ">HIFZ</option>
          <option value="SENIOR">SENIOR</option>
          <option value="JUNIOR">JUNIOR</option>
          <option value="SUB_JUNIOR">SUB JUNIOR</option>
          <option value="GENERAL">GENERAL</option>
        </select>
        <select value={newEvent.event_mode} onChange={e => setNewEvent({...newEvent, event_mode: e.target.value})} className="bg-black border border-zinc-800 text-zinc-400 font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 text-xs uppercase tracking-widest w-28">
          <option value="">Mode</option><option value="Individual">Individual</option><option value="Group">Group</option>
        </select>
        <select value={newEvent.event_type} onChange={e => setNewEvent({...newEvent, event_type: e.target.value})} className="bg-black border border-zinc-800 text-zinc-400 font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 text-xs uppercase tracking-widest w-28">
          <option value="">Type</option><option value="Stage">Stage</option><option value="Off-Stage">Off-Stage</option>
        </select>
        
        {/* ⚡ NEW: Tier Dropdown */}
        <select value={newEvent.mark_tier} onChange={e => setNewEvent({...newEvent, mark_tier: e.target.value})} className="bg-black border border-zinc-800 text-zinc-400 font-bold py-3 px-4 rounded-xl outline-none focus:border-emerald-500 text-xs uppercase tracking-widest w-24">
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="C">C</option>
        </select>

        <button onClick={deployEvent} disabled={isDeploying} className="w-full xl:w-auto bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] px-8 py-3.5 rounded-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-2">
          {isDeploying ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Deploy Node'}
        </button>
      </div>

      {/* Grid Filters */}
      <div className="flex flex-wrap items-center gap-4 border-b border-white/5 pb-6">
        <ListFilter className="w-4 h-4 text-zinc-500" />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-black border border-zinc-800 text-white font-bold py-2.5 px-4 rounded-xl outline-none text-[10px] uppercase tracking-widest cursor-pointer">
          <option value="">All Categories</option><option value="HIFZ">HIFZ</option><option value="SENIOR">SENIOR</option><option value="JUNIOR">JUNIOR</option><option value="SUB_JUNIOR">SUB JUNIOR</option><option value="GENERAL">GENERAL</option>
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-black border border-zinc-800 text-white font-bold py-2.5 px-4 rounded-xl outline-none text-[10px] uppercase tracking-widest cursor-pointer">
          <option value="">All Types</option><option value="Stage">Stage</option><option value="Off-Stage">Off-Stage</option>
        </select>
      </div>

      {/* Filtered Table Output */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <span className="text-xs font-black uppercase tracking-widest">Syncing Grid...</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-zinc-600 bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-white/5">
          <CalendarPlus className="w-10 h-10 mb-4 opacity-50" />
          <span className="text-xs font-mono uppercase tracking-widest">No Events Found in Matrix</span>
        </div>
      ) : (
        <div className="bg-black/50 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-zinc-900/80 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <th className="p-5 pl-8">Code</th>
                  <th className="p-5">Event Details</th>
                  <th className="p-5">Properties</th>
                  <th className="p-5">Logistics</th>
                  <th className="p-5">Status</th>
                  <th className="p-5 pr-8 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEvents.map(evt => (
                  <tr key={evt.id} className="hover:bg-zinc-900/40 transition-colors group">
                    <td className="p-5 pl-8">
                      <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">{evt.event_code}</span>
                    </td>
                    <td className="p-5">
                      <p className="font-black text-white text-sm tracking-tight">{evt.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{evt.category}</p>
                        {/* ⚡ NEW: Display Mark Tier Badge */}
                        <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest">
                          <Award className="w-2.5 h-2.5" /> Tier {evt.mark_tier || 'A'}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex gap-2">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${evt.event_mode === 'Group' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}`}>
                          {evt.event_mode === 'Group' ? <Users className="w-3 h-3"/> : <User className="w-3 h-3"/>} {evt.event_mode}
                        </span>
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${evt.event_type === 'Stage' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                          {evt.event_type === 'Stage' ? <Mic className="w-3 h-3"/> : <PenTool className="w-3 h-3"/>} {evt.event_type}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      {/* ⚡ NEW: Display Venue and Date together */}
                      <p className="text-xs font-bold text-zinc-300 tracking-wide mb-1 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-zinc-600" /> {evt.venue || 'TBD'}
                      </p>
                      <p className="text-[10px] font-mono text-zinc-500 tracking-widest flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-zinc-600" /> {evt.event_date ? new Date(evt.event_date).toLocaleDateString() : 'Date Pending'}
                      </p>
                    </td>
                    <td className="p-5">
                      {evt.status === 'Live' ? <span className="text-emerald-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> Live</span> 
                      : evt.status === 'Declared' ? <span className="text-indigo-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="w-3 h-3"/> Declared</span> 
                      : <span className="text-zinc-600 font-black text-[10px] uppercase tracking-widest">Upcoming</span>}
                    </td>
                    <td className="p-5 pr-8 text-right">
                      <button 
                        onClick={() => deleteEvent(evt.id, evt.event_code)}
                        className="p-2.5 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors border border-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Event Node"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}