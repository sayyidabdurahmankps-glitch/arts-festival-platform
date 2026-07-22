"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Terminal, ArrowRight, UserPlus, Trophy } from 'lucide-react';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm flex justify-center items-start pt-[20vh] animate-in fade-in duration-200" onClick={() => setOpen(false)}>
      <div 
        className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex items-center px-4 py-4 border-b border-zinc-800 bg-black/50">
          <Terminal className="w-5 h-5 text-indigo-500 mr-3" />
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-white font-mono text-sm placeholder-zinc-600"
            placeholder="Type a command or search..."
          />
          <span className="px-2 py-1 bg-zinc-800 rounded-md text-[10px] font-black uppercase tracking-widest text-zinc-500">ESC</span>
        </div>

        <div className="p-4 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 px-2 mb-2">Quick Actions</p>
          
          <button onClick={() => { router.push('/admin/approvals'); setOpen(false); }} className="w-full flex items-center justify-between p-3 hover:bg-indigo-600/10 rounded-xl group transition-all text-left">
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400" />
              <span className="text-sm font-bold text-zinc-400 group-hover:text-white">Review Pending Scores</span>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          <button onClick={() => { router.push('/admin/participants'); setOpen(false); }} className="w-full flex items-center justify-between p-3 hover:bg-emerald-600/10 rounded-xl group transition-all text-left">
            <div className="flex items-center gap-3">
              <UserPlus className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400" />
              <span className="text-sm font-bold text-zinc-400 group-hover:text-white">Register New Participant</span>
            </div>
            <ArrowRight className="w-4 h-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>
    </div>
  );
}