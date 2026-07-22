'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import ParticipantAutocomplete from '@/components/ParticipantAutocomplete';
import { CheckCircle, Loader2, AlertCircle, ShieldAlert, Send } from 'lucide-react';

export default function SubmitResultPage() {
  const [events, setEvents] = useState<{ id: string; name: string }[]>([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [points, setPoints] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  // Fetch active events when page loads
  useEffect(() => {
    async function fetchEvents() {
      const { data } = await supabase.from('events').select('id, name').eq('status', 'live');
      if (data) setEvents(data);
    }
    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantId || !selectedEvent || !points) {
      setStatus('error');
      setMessage('Please fill out all fields.');
      return;
    }

    setStatus('submitting');
    
    try {
      // Insert result as 'pending' for Admin approval
      const { error } = await supabase.from('results').insert({
        event_id: selectedEvent,
        participant_id: selectedParticipantId,
        points: parseInt(points),
        status: 'pending' // Crucial for the approval workflow
      });

      if (error) throw error;

      setStatus('success');
      setMessage('Score submitted successfully! Waiting for Admin approval.');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setStatus('idle');
        setPoints('');
        setSelectedParticipantId(null);
      }, 3000);

    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to submit score.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-400 flex items-center justify-center p-6 selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-2xl bg-zinc-900/40 border border-zinc-800/80 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl backdrop-blur-xl relative z-10">
        
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 text-zinc-300 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            <ShieldAlert className="w-4 h-4 text-indigo-500" /> Secure Evaluation
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-3">
            Submit <span className="text-indigo-500">Result</span>
          </h1>
          <p className="text-zinc-500 text-sm md:text-base font-medium">
            Scores entered here will be encrypted and sent to the Super Admin for final verification and leaderboard publishing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Event Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-widest text-zinc-500">Select Event</label>
            <div className="relative">
              <select 
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="w-full p-4 md:p-5 bg-zinc-950/50 border border-zinc-800 rounded-2xl text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all appearance-none cursor-pointer"
                required
              >
                <option value="" className="bg-zinc-900 text-zinc-500">-- Choose an Active Event --</option>
                {events.map(ev => (
                  <option key={ev.id} value={ev.id} className="bg