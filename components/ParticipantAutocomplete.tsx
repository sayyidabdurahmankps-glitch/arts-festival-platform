"use client"

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, User } from 'lucide-react';

// Using a basic debounce to prevent spamming the database on every keystroke
export default function ParticipantAutocomplete({ onSelect }: { onSelect: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchParticipants = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      const { data } = await supabase
        .from('participants')
        .select('id, name, participant_id, teams(name)')
        .or(`name.ilike.%${query}%,participant_id.ilike.%${query}%`)
        .limit(5);
        
      if (data) setResults(data);
      setLoading(false);
    };

    const timeoutId = setTimeout(() => searchParticipants(), 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="text-xs font-black uppercase text-zinc-500 mb-2 block">Locate Participant</label>
      <div className="relative">
        <Search className="absolute left-4 top-4 text-zinc-500 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          placeholder="Search by Name or Chest ID..."
          className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-2xl pl-12 pr-4 py-4 outline-none focus:border-indigo-500 transition-colors"
        />
        {loading && <div className="absolute right-4 top-5 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto">
          {results.map((p) => (
            <div 
              key={p.id}
              onClick={() => {
                onSelect(p.id);
                setQuery(`${p.name} (${p.participant_id})`);
                setIsOpen(false);
              }}
              className="flex items-center gap-4 p-4 hover:bg-zinc-800 cursor-pointer border-b border-zinc-800/50 last:border-0"
            >
              <div className="bg-zinc-800 p-2 rounded-full"><User className="w-4 h-4 text-zinc-400" /></div>
              <div>
                <p className="font-bold text-white">{p.name} <span className="text-zinc-500 font-mono text-sm ml-2">#{p.participant_id}</span></p>
                <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mt-1">{p.teams?.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}