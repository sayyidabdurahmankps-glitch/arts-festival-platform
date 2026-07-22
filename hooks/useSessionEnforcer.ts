"use client"

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function useSessionEnforcer(judgeId: string | null) {
  const router = useRouter();

  useEffect(() => {
    // 1. Is the ID missing?
    if (!judgeId) {
      console.log("🟡 ENFORCER: Paused. No Judge ID found yet.");
      return;
    }

    console.log(`🟢 ENFORCER: Activated for ID: ${judgeId}`);

    const checkSecurityStatus = async () => {
      // 2. Fetch the status (We ask Supabase directly)
      const { data, error } = await supabase
        .from('profiles')
        .select('force_logout')
        .eq('id', judgeId)
        .single();

      // 3. Print the exact result to the browser console!
      console.log(`🔍 CHECKING DB... Result:`, data ? data.force_logout : 'NO DATA', error ? `ERROR: ${error.message}` : '');

      // 4. Execute Kill Switch
      if (data && data.force_logout === true) {
        console.log("🚨 RED ALERT: Kill command verified. Executing logout...");
        
        await supabase.auth.signOut();
        await supabase.from('profiles').update({ force_logout: false }).eq('id', judgeId);
        
        router.push('/judge/login');
        router.refresh();
      }
    };

    // Run once immediately, then every 5 seconds
    checkSecurityStatus();
    const interval = setInterval(checkSecurityStatus, 5000);

    return () => clearInterval(interval);
  }, [judgeId, router]);
}