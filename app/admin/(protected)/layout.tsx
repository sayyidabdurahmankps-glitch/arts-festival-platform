"use client"

import AdminSidebar from '@/components/AdminSidebar';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname } from 'next/navigation';
import { Menu, X, Bell, User, Activity } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Generate a dynamic title based on the route
  const currentPathName = pathname === '/admin' ? 'OS METRICS' : pathname.split('/').pop()?.toUpperCase() || 'DASHBOARD';

  useEffect(() => {
    // Ping Supabase to verify the connection is active
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('events').select('id').limit(1);
        if (error) throw error;
        setIsOnline(true);
      } catch (err) {
        setIsOnline(false);
      }
    };

    checkConnection();
    const heartbeat = setInterval(checkConnection, 30000);
    return () => clearInterval(heartbeat);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30 overflow-hidden font-sans">
      
      {/* 1. Desktop Sidebar (This is where your AdminSidebar component goes!) */}
      <div className="w-64 shrink-0 border-r border-zinc-800 hidden md:block z-30 bg-[#020202]">
        <AdminSidebar />
      </div>

      {/* 2. Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-64 bg-[#020202] h-full flex flex-col transform transition-transform border-r border-white/5 shadow-2xl">
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-4 p-2 text-zinc-500 hover:text-white bg-zinc-900 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <AdminSidebar />
          </div>
        </div>
      )}
      
      {/* 3. Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        
        {/* Top Header */}
        <header className="h-16 bg-[#050505]/80 backdrop-blur-xl border-b border-zinc-900 flex items-center justify-between px-4 md:px-8 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hidden md:block">
                Command Center 
                <span className="mx-2 text-zinc-800">/</span> 
                <span className="text-indigo-400">{currentPathName}</span>
              </h2>
              <h2 className="text-sm font-black uppercase tracking-widest text-white md:hidden">
                {currentPathName}
              </h2>
            </div>
          </div>
          
          {/* Right Side: Status & Profile */}
          <div className="flex items-center gap-4 md:gap-6">
            <div className={`hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full border transition-colors ${
              isOnline ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
            }`}>
              <span className="relative flex h-2 w-2">
                {isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </span>
              <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                {isOnline ? 'Node Live' : 'Offline'}
              </span>
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
              <button className="relative p-2 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-full transition-colors group">
                <Bell className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full border border-[#050505]"></span>
              </button>
              <button className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:border-indigo-500/50 transition-colors">
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
        
        {/* Main Scrolling Content (This is where your Dashboard injects itself!) */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-50" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full md:w-3/4 h-32 bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full z-0" />
          
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-full relative z-10">
            {/* children = page.tsx (Dashboard, Approvals, Events, etc.) */}
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}