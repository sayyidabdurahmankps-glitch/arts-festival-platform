"use client"

import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    
    // 1. Tell Supabase to destroy the session and cookies
    await supabase.auth.signOut();
    
    // 2. Refresh the router so Next.js knows the cookies are gone
    router.refresh();
    
    // 3. Kick the user back to the main public page (or admin login)
    router.push('/'); 
  };

  return (
    <button 
      onClick={handleSignOut}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors disabled:opacity-50"
    >
      <LogOut className="w-4 h-4" />
      {loading ? "Logging out..." : "Sign Out"}
    </button>
  );
}