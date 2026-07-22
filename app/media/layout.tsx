"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Image as ImageIcon, UploadCloud, LayoutDashboard, LogOut, Camera, ChevronRight 
} from 'lucide-react'
import { useState } from 'react'

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Bypass the sidebar if the user is on the login screen
  if (pathname === '/media/login') {
    return <>{children}</>
  }

  const handleSignOut = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    // ⚡ HARD REDIRECT: Bypasses Next.js cache and forces a true state reset
    window.location.href = '/media/login'
  }

  const navLinks = [
    { name: 'Studio Hub', href: '/media', icon: LayoutDashboard },
    { name: 'Upload Terminal', href: '/media/upload', icon: UploadCloud },
    { name: 'Asset Manager', href: '/media/manage', icon: ImageIcon },
  ]

  return (
    <div className="flex min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 font-sans">
      <aside className="w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col min-h-screen shrink-0 relative z-20">
        <div className="h-24 flex items-center px-8 border-b border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-cyan-500/5 blur-xl pointer-events-none" />
          <Camera className="w-6 h-6 text-cyan-500 mr-3 relative z-10" />
          <span className="text-xl font-black tracking-tighter uppercase italic relative z-10">
            Media<span className="text-cyan-500">Studio</span>
          </span>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link 
                key={link.name} href={link.href} 
                className={`flex items-center justify-between px-4 py-4 text-xs font-black uppercase tracking-widest rounded-2xl transition-all group ${
                  isActive 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.05)]' 
                  : 'text-zinc-500 hover:bg-zinc-900 hover:text-white border border-transparent'
                }`}
              >
                <div className="flex items-center">
                  <link.icon className={`mr-4 h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-zinc-600'}`} /> 
                  {link.name}
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-cyan-500" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-black/20">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Uplink Secured</span>
          </div>
          <button 
            onClick={handleSignOut} disabled={isLoggingOut}
            className="flex items-center justify-center w-full px-4 py-4 text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 border border-red-500/20 rounded-xl transition-all disabled:opacity-50 group"
          >
            <LogOut className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> 
            {isLoggingOut ? "Severing..." : "Disconnect"}
          </button>
        </div>
      </aside>
      
      <main className="flex-1 h-screen overflow-y-auto bg-[#050505] relative">
        {children}
      </main>
    </div>
  )
}