"use client"

import { BarChart3, TrendingUp, Activity, Target, Zap } from 'lucide-react';

export default function AdminStatistics() {
  // Mock live standings
  const teamStandings = [
    { name: 'Red Hawks', points: 450, color: 'bg-red-500', glow: 'shadow-[0_0_15px_#ef4444]' },
    { name: 'Blue Dragons', points: 380, color: 'bg-blue-500', glow: 'shadow-[0_0_15px_#3b82f6]' },
    { name: 'Green Falcons', points: 310, color: 'bg-emerald-500', glow: 'shadow-[0_0_15px_#10b981]' },
    { name: 'Yellow Lions', points: 290, color: 'bg-yellow-500', glow: 'shadow-[0_0_15px_#eab308]' },
  ];

  // Calculate highest points for the bar chart scaling
  const maxPoints = Math.max(...teamStandings.map(t => t.points));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      <div className="border-b border-white/5 pb-8">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
          Telemetry <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-pink-400">Core</span>
        </h1>
        <p className="text-zinc-500 text-xs font-mono mt-2">Aggregating live performance metrics...</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* KPI Blocks */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-4xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
            <div className="absolute right-0 top-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
            <Activity className="w-8 h-8 text-purple-400 mb-6" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Fest Completion</p>
            <p className="text-5xl font-black text-white mt-1">42%</p>
            <div className="w-full h-1 bg-black rounded-full mt-4 overflow-hidden">
               <div className="w-[42%] h-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-4xl group hover:border-pink-500/30 transition-all">
            <Target className="w-8 h-8 text-pink-400 mb-6" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Highest Scoring Event</p>
            <p className="text-2xl font-black text-white mt-1 leading-tight">Duff Muttu</p>
            <p className="text-xs font-mono text-pink-400 mt-2">Avg: 9.8 pts/entry</p>
          </div>
        </div>

        {/* Live CSS Neon Bar Chart */}
        <div className="lg:col-span-2 bg-black/40 border border-white/5 p-8 rounded-[3rem] flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Live Standings</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Real-time team points</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
               <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">Auto-Syncing</span>
            </div>
          </div>

          <div className="flex-1 flex items-end justify-around gap-4 pt-10 h-64">
            {teamStandings.map((team, i) => {
              const heightPercentage = (team.points / maxPoints) * 100;
              
              return (
                <div key={team.name} className="flex flex-col items-center gap-4 w-full group">
                  {/* Floating Points */}
                  <span className="text-white font-mono font-bold text-sm opacity-50 group-hover:opacity-100 group-hover:-translate-y-2 transition-all">
                    {team.points}
                  </span>
                  
                  {/* Neon Bar */}
                  <div className="w-full max-w-16 bg-zinc-900 rounded-t-xl overflow-hidden relative" style={{ height: '200px' }}>
                    <div 
                      className={`absolute bottom-0 w-full rounded-t-xl transition-all duration-1000 ease-out ${team.color} ${team.glow}`}
                      style={{ height: `${heightPercentage}%`, animationDelay: `${i * 150}ms` }}
                    />
                  </div>
                  
                  {/* Label */}
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">
                      {team.name.split(' ')[0]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}