"use client"

import { Check, X } from 'lucide-react';

export default function ResultTable({ pendingResults, onApprove, onReject }: any) {
  
  if (pendingResults.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 rounded-3xl border border-zinc-800 border-dashed">
        <Check className="w-12 h-12 text-zinc-700 mb-4" />
        <p className="text-zinc-400 font-bold text-lg">All caught up! No pending results.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-zinc-900/50 border border-zinc-800 rounded-3xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/80">
            <th className="p-5 text-xs font-black text-zinc-500 uppercase tracking-widest">Event</th>
            <th className="p-5 text-xs font-black text-zinc-500 uppercase tracking-widest">Participant</th>
            <th className="p-5 text-xs font-black text-zinc-500 uppercase tracking-widest text-center">Position</th>
            <th className="p-5 text-xs font-black text-zinc-500 uppercase tracking-widest text-center">Grade</th>
            <th className="p-5 text-xs font-black text-zinc-500 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {pendingResults.map((result: any) => (
            <tr key={result.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <td className="p-5">
                <p className="font-bold text-white">{result.events?.name}</p>
                <p className="text-xs text-zinc-500">{result.events?.categories?.name}</p>
              </td>
              <td className="p-5">
                <p className="font-bold text-white">{result.participants?.name}</p>
                <p className="text-xs text-indigo-400">{result.participants?.teams?.name}</p>
              </td>
              <td className="p-5 text-center font-black text-xl text-white">{result.position}</td>
              <td className="p-5 text-center font-black text-xl text-white">{result.grade}</td>
              <td className="p-5">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => onReject(result.id)}
                    className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onApprove(result.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors font-bold text-sm"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}