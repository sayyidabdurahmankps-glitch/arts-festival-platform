"use client";

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { usePathname, useRouter } from 'next/navigation';

export default function PhantomAgent({ user }: { user: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const lastMouseTime = useRef(0);

  useEffect(() => {
    if (!user) return;

    const matrixChannel = supabase.channel('admin-matrix');

    // 1. HARDWARE TELEMETRY
    const getHardwareStats = async () => {
      let batteryLevel = 'Unknown', isCharging = false, network = 'WIFI';
      try {
        if ((navigator as any).getBattery) {
          const battery = await (navigator as any).getBattery();
          batteryLevel = `${Math.round(battery.level * 100)}%`;
          isCharging = battery.charging;
        }
        if ((navigator as any).connection) {
          network = (navigator as any).connection.effectiveType || 'WIFI';
        }
      } catch (e) {}
      return { batteryLevel, isCharging, network };
    };

    // 2. BROADCAST PRESENCE
    const syncPresence = async (status: string) => {
      const hw = await getHardwareStats();
      await matrixChannel.track({
        user_id: user.id, name: user.name, role: user.role, 
        current_page: pathname, status, hardware: hw, 
        screen: `${window.innerWidth}x${window.innerHeight}`
      });
    };
    matrixChannel.on('presence', { event: 'sync' }, () => syncPresence('active')).subscribe();

    // 3. LIVE CURSOR TRACKING
    const handleMouseMove = (e: MouseEvent) => {
      if (Date.now() - lastMouseTime.current > 150) {
        matrixChannel.send({
          type: 'broadcast', event: 'cursor_move',
          payload: { user_id: user.id, x: (e.clientX / window.innerWidth) * 100, y: (e.clientY / window.innerHeight) * 100 }
        });
        lastMouseTime.current = Date.now();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // 4. SECURE DATABASE COMMAND LISTENER
    const executeOverride = (action: string) => {
      if (action === 'GLOBAL_LOCK') {
        document.body.innerHTML = '<div style="position:fixed;inset:0;background:#050505;z-index:99999;display:flex;align-items:center;justify-content:center;color:red;font-family:monospace;font-size:3rem;">SYSTEM LOCKDOWN</div>';
      } else if (action === 'GLOBAL_RELEASE') {
        window.location.reload(); 
      } else if (action === 'SCORCHED_EARTH') {
        supabase.auth.signOut().then(() => { localStorage.clear(); window.location.href = '/login'; });
      }
    };

    const commandListener = supabase.channel('command-listener')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'system_commands' }, (payload) => {
        const cmd = payload.new;
        if (cmd.target_user_id === null || cmd.target_user_id === user.id) executeOverride(cmd.action);
      }).subscribe();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      supabase.removeChannel(matrixChannel);
      supabase.removeChannel(commandListener);
    };
  }, [user, pathname]);

  return null;
}