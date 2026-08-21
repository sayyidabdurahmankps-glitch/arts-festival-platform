"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { 
  Image as ImageIcon, UploadCloud, LayoutDashboard, LogOut, Camera, ChevronRight, Menu, X 
} from 'lucide-react'
import { useState, useEffect } from 'react'

export default function MediaLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // ⚡ AUTO-CLOSE MOBILE MENU ON ROUTE CHANGE
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

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
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050505] text-white selection:bg-cyan-500/30 font-sans">
      
      {/* 📱 MOBILE TOP NAV */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/5 bg-[#0a0a0a] sticky top-0 z-40">
        <div className="flex items-center">
          <Camera className="w-5 h-5 text-cyan-500 mr-2" />
          <span className="text-lg font-black tracking-tighter uppercase italic">
            Media<span className="text-cyan-500">Studio</span>
          </span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)} 
          className="p-2 text-zinc-400 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/10"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* 📱 MOBILE OVERLAY BACKDROP */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden animate-in fade-in" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}

      {/* 🖥️ RESPONSIVE SIDEBAR */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col shrink-0 z-50 
        transition-transform duration-300 ease-in-out 
        ${isMobileOpen ? 'translate-x-0 shadow-[20px_0_50px_rgba(0,0,0,0.8)]' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <div className="h-24 flex items-center px-8 border-b border-white/5 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full bg-cyan-500/5 blur-xl pointer-events-none" />
          <Camera className="w-6 h-6 text-cyan-500 mr-3 relative z-10" />
          <span className="text-xl font-black tracking-tighter uppercase italic relative z-10">
            Media<span className="text-cyan-500">Studio</span>
          </span>
          {/* Close button for mobile inside sidebar */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-white z-20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
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

        <div className="p-6 border-t border-white/5 bg-black/20 shrink-0">
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
      
      {/* 🖥️ MAIN CONTENT AREA */}
      <main className="flex-1 h-[calc(100vh-73px)] md:h-screen overflow-y-auto bg-[#050505] relative w-full">
        {children}
      </main>
    </div>
  )
}