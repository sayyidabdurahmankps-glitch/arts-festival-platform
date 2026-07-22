"use client"

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

export default function TeamChart({ data, type, isDark = false }: { data: any[], type: 'bar' | 'pie', isDark?: boolean }) {
  
  // Custom Tooltip for that sleek Cyberpunk feel
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const teamData = payload[0].payload;
      return (
        <div className="bg-black/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Team Node</p>
          <p className="text-xl font-black text-white uppercase" style={{ color: teamData.color }}>{teamData.team}</p>
          <p className="text-3xl font-black text-white mt-2">{teamData.total_points} <span className="text-xs text-zinc-500 uppercase">PTS</span></p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) return <div className="w-full h-full flex items-center justify-center text-zinc-600 font-mono text-xs uppercase tracking-widest">Awaiting Data...</div>;

  if (type === 'pie') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="total_points"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} style={{ filter: 'drop-shadow(0px 0px 10px rgba(255,255,255,0.2))' }} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="team" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#6366f1' : '#a1a1aa', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }} dy={10} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff', opacity: 0.05 }} />
        <Bar dataKey="total_points" radius={[12, 12, 0, 0]} maxBarSize={60}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}