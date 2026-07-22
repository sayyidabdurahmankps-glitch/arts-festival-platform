"use client"

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LayoutDashboard,
  CheckSquare,
  CalendarDays,
  Users,
  Trophy,
  LogOut,
  Zap,
  Terminal,
  Medal,
  Activity
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Grouped links for a cleaner, enterprise-grade UI
  const menuGroups = [
    {
      label: "Main",
      links: [
        { name: 'OS Metrics', href: '/admin/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      label: "Adjudication",
      links: [
        { name: 'Approvals Node', href: '/admin/approvals', icon: CheckSquare },
        { name: 'Smart Entry', href: '/admin/entry', icon: Zap },
      ]
    },
    {
      label: "Management",
      links: [
        { name: 'Event Matrix', href: '/admin/events', icon: CalendarDays },
       ////{ name: 'Roster Control', href: '/admin/participants', icon: Users },/////
        { name: 'Live Standings', href: '/admin/standings', icon: Medal },
      ]
    },
    {
      label: "Infrastructure",
      links: [
        { name: 'System Core', href: '/admin/system', icon: Terminal },
      ]
    }
  ];

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await supabase.auth.signOut();
    router.refresh();
    router.push('/');
  };

  return (
    <div className="h-screen w-64 sticky top-0 flex flex-col justify-between p-6 bg-[#020202] border-r border-white/5 font-sans">

      {/* 1. Fixed Top Logo Section */}
      <div className="mb-8 px-4 flex items-center justify-between shrink-0">
        <Link href="/" className="text-2xl font-black text-white tracking-tighter uppercase">
          Fest<span className="text-indigo-500">OS</span>
        </Link>
        <div className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-[8px] font-black text-indigo-400 uppercase tracking-widest">
          Admin
        </div>
      </div>

      {/* 2. Scrollable Navigation Section */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-8">
        <nav className="space-y-8">
          {menuGroups.map((group) => (
            <div key={group.label} className="space-y-3">
              <p className="px-4 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.links.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all group ${isActive
                          ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <link.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-indigo-400'}`} />
                        {link.name}
                      </div>

                      {/* Glowing dot for active pages */}
                      {isActive && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_10px_#fff]" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* 3. Fixed Bottom Section */}
      <div className="pt-6 border-t border-white/5 space-y-4 shrink-0">

        {/* System Health Indicator */}
        <div className="px-4 py-3 bg-zinc-900/50 rounded-xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Node Status</span>
          </div>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex items-center gap-4 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 border border-transparent transition-all w-full text-left disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
          {isLoggingOut ? "Disconnecting..." : "Secure Logout"}
        </button>
      </div>

    </div>
  );
}