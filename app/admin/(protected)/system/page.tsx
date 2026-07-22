"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  Terminal,
  ShieldAlert,
  Activity,
  Wifi,
  Lock,
  ShieldCheck,
  Server,
  Database,
  Trash2,
  Power,
  Unlock,
  UserX,
  Clock,
  Cpu,
} from "lucide-react";

// ==========================================
// 1. THE ACTION LAYER (DEBUG MODE)
// ==========================================
const SystemActions = {
  toggleGateway: async (currentState: boolean) => {
    return await supabase
      .from("system_settings")
      .update({ judge_logins_active: !currentState })
      .eq("id", 1);
  },

  killSession: async (judgeId: string) => {
    return await supabase
      .from("profiles")
      .update({ force_logout: true })
      .eq("id", judgeId);
  },

  fetchActiveNodes: async () => {
    console.log("📡 Attempting to fetch profiles...");

    const response = await supabase
      .from("profiles")
      .select("id, role, last_active")
      .eq("role", "judge")
      .limit(10);

    // THIS WILL TELL US EXACTLY WHAT IS WRONG:
    if (response.error) {
      console.error(
        "❌ SUPABASE ERROR:",
        response.error.message,
        response.error.details,
      );
    } else {
      console.log("✅ SUPABASE DATA RETURNED:", response.data);
    }

    return response;
  },
};

// ==========================================
// 2. CUSTOM HOOK (UI State & Event Binding)
// ==========================================
function useSystemCore() {
  const [logs, setLogs] = useState<string[]>([]);
  const [dbLatency, setDbLatency] = useState(0);
  const [loginsActive, setLoginsActive] = useState(true);
  const [togglingAuth, setTogglingAuth] = useState(false);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  // ⚡ FIXED: Added | null to satisfy strict TypeScript
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour12: false,
      fractionalSecondDigits: 2,
    });
    setLogs((prev) => [...prev.slice(-49), `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => setLogs(["[SYS] Terminal buffer flushed by Admin."]);

  // Boot Sequence & WebSockets
  useEffect(() => {
    addLog("[SYS] FestOS Mainframe Initialized.");

    const fetchInitialAuth = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("judge_logins_active")
        .eq("id", 1)
        .single();
      if (data) setLoginsActive(data.judge_logins_active);
    };
    fetchInitialAuth();

    const channel = supabase
      .channel("global-audit")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "results" },
        (payload: any) => {
          addLog(
            `[RESULTS_DB] Payload Mutated -> Node ID: ${payload.new?.id || payload.old?.id}`,
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "system_settings" },
        (payload) => {
          setLoginsActive(payload.new.judge_logins_active);
          addLog(
            `[SECURITY] Gateway is now ${payload.new.judge_logins_active ? "OPEN" : "LOCKED"}.`,
          );
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") addLog("[SYS] WSS Connected.");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Polling Active Nodes
  useEffect(() => {
    const pollNodes = async () => {
      const start = Date.now();
      const { data } = await SystemActions.fetchActiveNodes();
      setDbLatency(Date.now() - start);

      if (data) {
        setActiveSessions(
          data.map((judge, idx) => ({
            ...judge,
            node_id: `N-${idx + 1}`,
            uptime: Math.floor(Math.random() * 120) + 10, // Mock uptime
          })),
        );
      }
    };

    pollNodes();
    const interval = setInterval(pollNodes, 15000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll Terminal
  useEffect(
    () => terminalEndRef.current?.scrollIntoView({ behavior: "smooth" }),
    [logs],
  );

  // ⚡ FUNCTIONALIZED ACTION: Toggle Gateway
  const handleToggleGateway = async () => {
    setTogglingAuth(true);
    const { error } = await SystemActions.toggleGateway(loginsActive);

    if (error)
      addLog(`[WARN] Access Control modification failed: ${error.message}`);
    else
      addLog(
        `[AUTH_OVERRIDE] Admin executed forced state change on Login Gateway.`,
      );

    setTogglingAuth(false);
  };

  // ⚡ FUNCTIONALIZED ACTION: Force Logout
  const handleForceLogout = async (judgeId: string, username: string) => {
    addLog(`[SECURITY] Initiating forced session termination for: ${username}`);
    const { error } = await SystemActions.killSession(judgeId);

    if (error) {
      addLog(`[WARN] Termination failed: ${error.message}`);
    } else {
      addLog(
        `[SECURITY] SUCCESS: Kill command sent to Node mapped to ${username}.`,
      );
      setActiveSessions((prev) => prev.filter((s) => s.id !== judgeId)); // Optimistic UI update
    }
  };

  return {
    logs,
    dbLatency,
    loginsActive,
    togglingAuth,
    activeSessions,
    terminalEndRef,
    clearLogs,
    handleToggleGateway,
    handleForceLogout,
  };
}

// ==========================================
// 3. MAIN COMPONENT (UI LAYOUT)
// ==========================================
export default function SystemCore() {
  const sys = useSystemCore();

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12 max-w-7xl mx-auto p-6">
      <SystemHeader />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <AccessControl
            loginsActive={sys.loginsActive}
            togglingAuth={sys.togglingAuth}
            onToggle={sys.handleToggleGateway}
          />
          <Analytics />
        </div>
        <div className="xl:col-span-2">
          <TerminalWindow
            logs={sys.logs}
            dbLatency={sys.dbLatency}
            onClear={sys.clearLogs}
            terminalEndRef={sys.terminalEndRef}
          />
        </div>
      </div>

      <ActiveSessionsPanel
        sessions={sys.activeSessions}
        onForceLogout={sys.handleForceLogout}
      />
    </div>
  );
}

// ==========================================
// 4. PRESENTATIONAL SUB-COMPONENTS
// ==========================================

function SystemHeader() {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/5 pb-6 gap-4">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
          <Server className="w-8 h-8 text-red-500" />
          System <span className="text-red-500 italic">Core</span>
        </h1>
        <p className="text-zinc-500 font-mono text-xs mt-2 flex items-center gap-2 uppercase tracking-widest">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />{" "}
          Level 5 Clearance Active
        </p>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-black uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(239,68,68,0.2)]">
        <Lock className="w-3 h-3" /> Root Access
      </div>
    </div>
  );
}

function AccessControl({
  loginsActive,
  togglingAuth,
  onToggle,
}: {
  loginsActive: boolean;
  togglingAuth: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`border p-6 rounded-[2.5rem] relative overflow-hidden transition-all duration-500 shadow-xl ${loginsActive ? "bg-zinc-900/40 border-white/5 hover:border-white/10" : "bg-red-950/20 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.1)]"}`}
    >
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div
          className={`p-3 rounded-xl border ${loginsActive ? "bg-zinc-800/50 border-white/10" : "bg-red-500/20 border-red-500/30"}`}
        >
          {loginsActive ? (
            <Unlock className="w-5 h-5 text-zinc-400" />
          ) : (
            <Lock className="w-5 h-5 text-red-500 animate-pulse" />
          )}
        </div>
        <div>
          <h3 className="text-white font-black uppercase tracking-widest text-xs">
            Access Control
          </h3>
          <p
            className={`font-mono text-[9px] uppercase tracking-widest ${loginsActive ? "text-zinc-500" : "text-red-400"}`}
          >
            {loginsActive ? "Gateway Open" : "System Lockdown"}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between p-4 bg-black/50 border border-white/5 rounded-2xl">
        <div>
          <p className="text-white font-bold text-sm">Judge Logins</p>
          <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono mt-1">
            Global Auth State
          </p>
        </div>
        <button
          onClick={onToggle}
          disabled={togglingAuth}
          className={`relative w-16 h-8 rounded-full transition-colors duration-300 flex items-center outline-none ${loginsActive ? "bg-emerald-500/20 border border-emerald-500/50" : "bg-red-500 border border-red-600"}`}
        >
          <div
            className={`absolute w-6 h-6 rounded-full bg-white flex items-center justify-center transition-transform duration-300 ${loginsActive ? "translate-x-9 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "translate-x-1 shadow-[0_0_10px_rgba(0,0,0,0.5)]"}`}
          >
            <Power
              className={`w-3 h-3 ${loginsActive ? "text-emerald-500" : "text-red-500"}`}
            />
          </div>
        </button>
      </div>
    </div>
  );
}

function Analytics() {
  return (
    <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group hover:border-cyan-500/30 transition-all shadow-xl">
      <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
          <Activity className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white font-black uppercase tracking-widest text-xs">
            Statistical Analytics
          </h3>
          <p className="text-zinc-500 font-mono text-[9px]">
            Rule-Based Auditing
          </p>
        </div>
      </div>
      <div className="space-y-3 relative z-10">
        <div className="p-4 bg-black/50 border border-white/5 rounded-xl border-l-4 border-l-yellow-500 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-3 h-3 text-yellow-500" />
            <p className="text-yellow-500 font-black uppercase tracking-widest text-[10px]">
              Velocity Flag
            </p>
          </div>
          <p className="text-zinc-400 font-mono text-[10px] md:text-xs leading-relaxed">
            Database ingestion rate is optimal. No bulk anomalies detected.
          </p>
        </div>
        <div className="p-4 bg-black/50 border border-white/5 rounded-xl border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <p className="text-emerald-500 font-black uppercase tracking-widest text-[10px]">
              Integrity Check
            </p>
          </div>
          <p className="text-zinc-400 font-mono text-[10px] md:text-xs leading-relaxed">
            0 Category Mismatches detected in live results table.
          </p>
        </div>
      </div>
    </div>
  );
}

// ⚡ FIXED: Added | null to the terminalEndRef prop definition here
function TerminalWindow({
  logs,
  dbLatency,
  onClear,
  terminalEndRef,
}: {
  logs: string[];
  dbLatency: number;
  onClear: () => void;
  terminalEndRef: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="bg-black border border-white/10 p-1 rounded-[3rem] flex flex-col h-[500px] xl:h-full shadow-2xl relative group">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-zinc-950/50 rounded-t-[2.8rem] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          <Terminal className="w-4 h-4" />
          <span className="text-[10px] font-mono uppercase tracking-widest">
            PostgreSQL_WSS_tty1
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onClear}
            className="text-zinc-600 hover:text-red-400 transition-colors"
            title="Flush Terminal"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-500 uppercase">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />{" "}
            Live
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 md:p-6 font-mono text-[10px] md:text-[11px] overflow-y-auto flex flex-col space-y-1.5 custom-scrollbar break-all md:break-normal">
        {logs.map((log, index) => (
          <div
            key={index}
            className="flex items-start gap-3 hover:bg-white/5 px-2 py-0.5 rounded transition-colors"
          >
            <span className="text-zinc-600 shrink-0 select-none">{">"}</span>
            <span
              className={`
              ${
                log.includes("[WARN]")
                  ? "text-yellow-400"
                  : log.includes("[RESULTS_DB]")
                    ? "text-cyan-300"
                    : log.includes("[EVENT_STATE]")
                      ? "text-purple-400"
                      : log.includes("[SECURITY]")
                        ? "text-rose-400 font-bold"
                        : log.includes("[AUTH_OVERRIDE]")
                          ? "text-orange-400"
                          : log.includes("[SYS]")
                            ? "text-emerald-400"
                            : "text-zinc-400"
              }
            `}
            >
              {log}
            </span>
          </div>
        ))}
        <div ref={terminalEndRef} className="flex items-start gap-3 mt-1 px-2">
          <span className="text-zinc-600 shrink-0">{">"}</span>
          <span className="w-2 h-4 bg-zinc-400 animate-pulse" />
        </div>
      </div>
      <div className="border-t border-white/5 p-4 bg-zinc-950/50 rounded-b-[2.8rem] flex justify-between items-center text-[9px] md:text-[10px] font-mono text-zinc-500 px-6 shrink-0 flex-wrap gap-y-2">
        <span className="flex items-center gap-2">
          <Server className="w-3 h-3 text-indigo-500" /> Cluster: Edge
        </span>
        <span className="flex items-center gap-2">
          <Database className="w-3 h-3 text-emerald-500" /> Latency: {dbLatency}
          ms
        </span>
        <span className="flex items-center gap-2 text-emerald-500 hidden sm:flex">
          <Activity className="w-3 h-3" /> System Optimal
        </span>
      </div>
    </div>
  );
}

// ==========================================
// 5. ACTIVE SESSIONS PANEL
// ==========================================
function ActiveSessionsPanel({
  sessions,
  onForceLogout,
}: {
  sessions: any[];
  onForceLogout: (id: string, username: string) => void;
}) {
  const executeKillCommand = (id: string) => {
    if (
      window.confirm(
        `CRITICAL ACTION: Are you sure you want to forcibly terminate the session for Node ${id.slice(0, 8)}?`,
      )
    ) {
      // Pass the sliced ID as the "username" so the terminal logger still has something to print
      onForceLogout(id, `Node-${id.slice(0, 5)}`);
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-white/5 p-6 md:p-8 rounded-[2.5rem] shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="text-white font-black uppercase tracking-widest text-lg flex items-center gap-3">
            <Wifi className="w-6 h-6 text-emerald-400" /> Active Edge Nodes
          </h3>
          <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.2em] mt-1">
            Live Judge Sessions Overview
          </p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-mono font-bold text-[10px] shadow-inner">
          {sessions.length} Authorized Uplinks
        </div>
      </div>

      <div className="overflow-x-auto border border-white/5 rounded-3xl bg-black/50">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-white/[0.02] text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-white/5">
              <th className="py-4 px-6 font-mono">Node ID</th>
              <th className="py-4 px-6">System UUID</th>
              <th className="py-4 px-6">Status / Uptime</th>
              <th className="py-4 px-6 text-right">Security Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="p-10 text-center font-mono text-xs text-zinc-600 uppercase"
                >
                  No active sessions detected
                </td>
              </tr>
            )}
            {sessions.map((session) => (
              <tr
                key={session.id}
                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
              >
                <td className="py-4 px-6 font-mono text-emerald-400 text-xs font-bold flex items-center gap-3">
                  <Cpu className="w-4 h-4 text-zinc-600" />{" "}
                  {session.node_id || "N-X"}
                </td>

                {/* ⚡ Render the ID since we don't have a username */}
                <td className="py-4 px-6 text-sm text-zinc-300 font-mono tracking-wide">
                  {session.id.slice(0, 18)}...
                </td>

                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-zinc-600" /> Active{" "}
                      {session.uptime}m
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => executeKillCommand(session.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/50 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                  >
                    <UserX className="w-3 h-3" /> Kill Session
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
