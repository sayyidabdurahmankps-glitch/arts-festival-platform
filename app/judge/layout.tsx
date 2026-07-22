"use client"

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [judgeId, setJudgeId] = useState<string | null>(null);

  // ⚡ 1. SECURELY GET THE JUDGE's ID
  useEffect(() => {
    // Check immediately on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setJudgeId(session?.user?.id || null);
    });

    // Listen for any auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setJudgeId(session?.user?.id || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ⚡ 2. THE SECURITY ENFORCER (Checks every 3 seconds)
  useEffect(() => {
    if (!judgeId) return;

    const checkSecurityStatus = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('force_logout')
        .eq('id', judgeId)
        .single();

      // If the database blocks the read, this will tell us!
      if (error) {
        console.error("❌ ENFORCER BLOCKED: The Judge cannot read their own profile. Check RLS!", error.message);
        return;
      }

      // If the admin clicked "Kill Session"
      if (data?.force_logout === true) {
        console.log("🚨 RED ALERT: Admin triggered Kill Switch. Executing forced logout...");
        
        await supabase.auth.signOut();
        
        // Reset the flag so they can log in later
        await supabase.from('profiles').update({ force_logout: false }).eq('id', judgeId);
        
        router.push('/judge/login');
      }
    };

    // Run once immediately, then loop
    checkSecurityStatus();
    const interval = setInterval(checkSecurityStatus, 3000);

    return () => clearInterval(interval);
  }, [judgeId, router]);

  return (
    <div className="min-h-screen bg-[#000000] text-white">
      {/* The rest of the judge dashboard pages render inside here */}
      {children}
    </div>
  );
}