"use client"

import { Crown, UserCheck } from 'lucide-react'

export default function CategoryToppers({ toppers }: { toppers: any[] }) {
  
  if (toppers.length === 0) return (
    <div className="py-20 text-center border border-dashed border-white/5 bg-[#0a0a0a] rounded-[3rem] text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
      No champions crowned yet. The battle continues...
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {toppers.map((topper, i) => (
        <div key={i} className="relative group hover:-translate-y-2 transition-all duration-300">
          
          {/* Glowing Background Blob */}
          <div className="absolute -inset-0.5 bg-gradient-to-b from-yellow-500/20 to-transparent rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />
          
          <div className="relative bg-[#0a0a0a] border border-white/10 p-8 rounded-[2.5rem] shadow-xl overflow-hidden h-full flex flex-col justify-between">
            
            {/* Top Badge */}
            <div className="flex justify-between items-start mb-8">
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-2xl shadow-inner">
                <Crown className="w-6 h-6 text-yellow-500" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                {topper.category}
              </span>
            </div>

            {/* Middle Content */}
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight uppercase leading-none mb-2">{topper.participant_name}</h3>
              <p className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: topper.color || '#fff' }} />
                {topper.team_name}
              </p>
            </div>

            {/* Bottom Score */}
            <div className="mt-8 pt-6 border-t border-white/5 flex items-end justify-between">
              <div className="flex items-center gap-2 text-zinc-500">
                <UserCheck className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Verified</span>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-yellow-500 tabular-nums leading-none drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]">{topper.total_points}</p>
                <p className="text-[8px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1">Total Pts</p>
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  )
}