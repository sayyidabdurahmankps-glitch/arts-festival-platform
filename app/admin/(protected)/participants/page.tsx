"use client"

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UserPlus, UploadCloud, AlertTriangle, Database, Trash2, Loader2, Check } from 'lucide-react';

export default function RosterManager() {
  // --- DATABASE STATES ---
  const [students, setStudents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- MANUAL ENTRY STATES ---
  const [newStudent, setNewStudent] = useState({
    participant_id: '',
    name: '',
    team_id: '',
    category: ''
  });
  const [isDeploying, setIsDeploying] = useState(false);

  // --- CSV UPLOAD STATES ---
  const [isUploadingCSV, setIsUploadingCSV] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ⚡ BOOT: Fetch Roster and Teams
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    // Fetch teams concurrently with participants
    const [teamRes, studentRes] = await Promise.all([
      supabase.from('teams').select('*'),
      supabase.from('participants').select('*, teams(name)').order('participant_id', { ascending: true })
    ]);

    if (teamRes.data) setTeams(teamRes.data);
    if (studentRes.data) setStudents(studentRes.data);

    setLoading(false);
  };

  // ⚡ ACTION: Manual Injection
  const handleManualInject = async () => {
    if (!newStudent.participant_id || !newStudent.name || !newStudent.team_id || !newStudent.category) {
      return alert("All fields are required.");
    }

    setIsDeploying(true);
    const { error } = await supabase.from('participants').insert([{
      participant_id: newStudent.participant_id.trim(),
      name: newStudent.name.trim(),
      team_id: newStudent.team_id,
      category: newStudent.category
    }]);

    setIsDeploying(false);

    if (error) {
      alert("Injection Failed: " + error.message);
    } else {
      setNewStudent({ participant_id: '', name: '', team_id: '', category: '' });
      fetchData(); // Refresh list
    }
  };

  // ⚡ ACTION: CSV Bulk Upload
  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || teams.length === 0) return;

    setIsUploadingCSV(true);
    const reader = new FileReader();

    reader.onload = async ({ target }) => {
      const csv = target?.result as string;
      const lines = csv.split('\n').filter(line => line.trim() !== '');

      // Expected CSV Headers: participant_id, name, category, team_name
      const payloads = lines.slice(1).map(line => {
        const [p_id, name, category, team_name] = line.split(',');

        // Auto-map the text team name to the Supabase UUID
        const matchedTeam = teams.find(t => t.name.toLowerCase() === team_name?.trim().toLowerCase());

        return {
          participant_id: p_id?.trim(),
          name: name?.trim(),
          category: category?.trim(),
          team_id: matchedTeam?.id || null
        };
      }).filter(p => p.team_id !== null); // Drop invalid rows to protect DB

      const { error } = await supabase.from('participants').insert(payloads);

      setIsUploadingCSV(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input

      if (error) alert("CSV Parsing Error: " + error.message);
      else {
        alert(`${payloads.length} Identities Injected Successfully!`);
        fetchData();
      }
    };
    reader.readAsText(file);
  };

  // ⚡ ACTION: Delete Single
  const deleteParticipant = async (id: string) => {
    if (confirm("Remove this student from the matrix?")) {
      await supabase.from('participants').delete().eq('id', id);
      fetchData();
    }
  };

  // ⚡ ACTION: Nuclear Option
  const clearAllRoster = async () => {
    if (confirm("WARNING: This will eradicate the entire student roster. Proceed?")) {
      // Deletes all rows where ID is not null (effectively wiping the table)
      await supabase.from('participants').delete().not('id', 'is', null);
      fetchData();
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20 max-w-7xl mx-auto px-6 mt-10">

      <div>
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Roster <span className="text-indigo-500 italic">Manager</span></h1>
        <p className="text-zinc-500 font-mono text-xs mt-2">Student-Team Mapping & Bulk CSV Ingestion</p>
      </div>

      {/* Manual Entry & CSV Upload Node */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Manual Add Card */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8">
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-indigo-400" /> Manual Injection
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="ID (e.g. 1042)"
                value={newStudent.participant_id}
                onChange={e => setNewStudent({ ...newStudent, participant_id: e.target.value })}
                className="w-1/3 bg-black border border-zinc-800 text-emerald-400 font-bold font-mono py-3 px-4 rounded-xl outline-none focus:border-indigo-500 transition-all uppercase"
              />
              <input
                type="text"
                placeholder="Student Full Name"
                value={newStudent.name}
                onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-2/3 bg-black border border-zinc-800 text-white font-bold py-3 px-4 rounded-xl outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={newStudent.team_id}
                onChange={e => setNewStudent({ ...newStudent, team_id: e.target.value })}
                className="bg-black border border-zinc-800 text-zinc-400 font-bold py-3 px-4 rounded-xl outline-none focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">Select Team</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <select
                value={newStudent.category}
                onChange={e => setNewStudent({ ...newStudent, category: e.target.value })}
                className="bg-black border border-zinc-800 text-zinc-400 font-bold py-3 px-4 rounded-xl outline-none focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="">Category</option>
                <option value="HIFZ">HIFZ</option>
                <option value="SENIOR">SENIOR</option>
                <option value="JUNIOR">JUNIOR</option>
                <option value="SUB_JUNIOR">SUB_JUNIOR</option>
                <option value="GENERAL">GENERAL</option>
              </select>
            </div>
            <button
              onClick={handleManualInject}
              disabled={isDeploying}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeploying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Inject Student Data'}
            </button>
          </div>
        </div>

        {/* Bulk CSV Upload Card */}
        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden group">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleCSVUpload}
            disabled={isUploadingCSV || teams.length === 0}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
          />
          <div className="relative z-10 flex flex-col h-full pointer-events-none">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-3">
              <UploadCloud className="w-5 h-5 text-emerald-400" /> Bulk CSV Upload
            </h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-6 font-bold">Format: participant_id, name, category, team_name</p>

            <div className="flex-1 border-2 border-dashed border-zinc-800 bg-black/50 rounded-2xl flex flex-col items-center justify-center group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5 transition-all">
              {isUploadingCSV ? (
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-3" />
              ) : (
                <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Database className="w-5 h-5 text-zinc-500 group-hover:text-emerald-400" />
                </div>
              )}
              <p className="text-xs font-bold text-zinc-400">{isUploadingCSV ? 'Processing Payload...' : 'Drag & Drop CSV File Here'}</p>
              <p className="text-[10px] text-zinc-600 font-mono mt-1">or click to browse</p>
            </div>
            <div className="w-full bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 font-black uppercase tracking-widest text-[10px] py-4 rounded-xl mt-4 text-center">
              Process & Save Roster
            </div>
          </div>
        </div>
      </div>

      {/* Active Roster List */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8">
        <h3 className="text-lg font-black text-white mb-6">Current Roster <span className="text-zinc-500 text-sm font-mono ml-2">(Total: {students.length})</span></h3>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-4">
            {students.map((s) => (
              <div key={s.id} className="flex justify-between items-center p-4 bg-black/40 border border-white/5 rounded-xl hover:border-zinc-700 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-mono font-black text-emerald-500 border border-white/5">
                    {s.participant_id}
                  </div>
                  <p className="font-bold text-white text-sm">{s.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-zinc-800 rounded-md text-[9px] font-black uppercase tracking-widest text-zinc-400">{s.teams?.name}</span>
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-md text-[9px] font-black uppercase tracking-widest">{s.category}</span>
                  <button onClick={() => deleteParticipant(s.id)} className="text-zinc-600 hover:text-red-500 transition-colors ml-2 opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {students.length === 0 && <p className="text-center text-zinc-500 font-mono text-xs uppercase py-10">Roster is Empty</p>}
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="bg-red-500/5 border border-red-500/20 rounded-[2.5rem] p-8 flex justify-between items-center group hover:bg-red-500/10 transition-colors">
        <div>
          <h4 className="text-red-500 font-black uppercase tracking-widest text-xs flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h4>
          <p className="text-zinc-500 text-[10px] font-mono">Permanently delete all students. Requires re-upload via CSV.</p>
        </div>
        <button
          onClick={clearAllRoster}
          className="bg-red-600 text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500 transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
        >
          Clear All Roster Data
        </button>
      </div>

    </div>
  );
}