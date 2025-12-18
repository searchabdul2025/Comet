'use client';

import { Rocket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Launch animation shown once per session for Agent (User role) logins.
 * Uses a lightweight overlay with a rocket lift-off and welcome text.
 */
export default function AgentLaunch() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);

  const close = () => setVisible(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const role = session?.user?.role;
    if (role !== 'User') return; // Only agents see the launch effect
    if (typeof window === 'undefined') return;

    const key = `agent-launch-${session?.user?.id || 'session'}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, 'shown');
    setVisible(true);

    const showTimer = setTimeout(() => setContentVisible(true), 350);
    const hideTimer = setTimeout(() => setVisible(false), 5200);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [mounted, session]);

  if (!visible) return null;

  const agentName = session?.user?.name || session?.user?.username || 'Agent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-emerald-900/70 to-black/85 backdrop-blur-sm" />

      <div className="relative pointer-events-auto max-w-3xl px-6 text-center">
        <div className="relative flex flex-col items-center justify-center">
          <div className="absolute -bottom-6 h-36 w-36 rounded-full bg-gradient-to-b from-emerald-400/50 via-cyan-400/30 to-transparent blur-3xl opacity-80" />
          <div className="absolute -bottom-2 h-14 w-36 rounded-full bg-emerald-300/40 blur-2xl animate-pulse" />

          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white/5 border border-white/15 shadow-2xl shadow-emerald-900/40">
            <div className="absolute -bottom-8 h-10 w-5 rounded-full bg-gradient-to-b from-amber-200 via-orange-500 to-red-600 blur-[2px] animate-pulse" />
            <div className="absolute -bottom-12 h-14 w-14 rounded-full bg-gradient-to-b from-orange-500/60 via-amber-300/30 to-transparent blur-3xl" />
            <div className="absolute -bottom-3 flex gap-1">
              <span className="h-3 w-3 rounded-full bg-orange-400/80 animate-ping" />
              <span className="h-2 w-2 rounded-full bg-amber-200/90 animate-ping" />
              <span className="h-3 w-3 rounded-full bg-red-400/80 animate-ping" />
            </div>
            <Rocket size={64} className="text-white drop-shadow-[0_0_25px_rgba(16,185,129,0.6)]" />
          </div>
        </div>

        <div
          className={`mt-10 transition-all duration-700 ${
            contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/80 mb-2">Launch sequence</p>
          <h2
            className="text-3xl md:text-4xl font-black text-white uppercase leading-tight"
            style={{
              textShadow:
                '0 12px 25px rgba(0,0,0,0.45), 0 3px 0 #22c55e, 0 6px 0 #0ea5e9, 0 9px 0 #0ea5e9',
            }}
          >
            {agentName}, welcome to your lead management program
          </h2>
          <p className="mt-3 text-lg text-emerald-50/90">
            Igniting your workspace with fresh leads and smooth workflows.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={close}
              className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white border border-white/30 shadow-lg shadow-emerald-900/30 hover:bg-white/20 transition-colors"
            >
              Enter workspace
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

