'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import AgentLaunch from './AgentLaunch';
import { Search, Bell } from 'lucide-react';

export default function Header() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [brand, setBrand] = useState<{ name: string; logo?: string }>({ name: 'Portal' });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadBrand = async () => {
      try {
        const res = await fetch('/api/settings/public');
        const result = await res.json();
        if (result.success) {
          setBrand({ name: result.data.APP_NAME || 'Portal', logo: result.data.APP_LOGO_URL || '' });
        }
      } catch {
        // ignore
      }
    };
    loadBrand();
  }, []);

  if (!mounted || status === 'loading') {
    return (
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="h-6 w-24 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-8 w-32 bg-slate-100 rounded-lg animate-pulse" />
      </header>
    );
  }

  if (!session?.user) return null;

  const user = session.user;
  const roleColor =
    user.role === 'Admin'
      ? 'from-indigo-500 to-violet-600 text-white'
      : user.role === 'Supervisor'
      ? 'from-amber-500 to-orange-600 text-white'
      : 'from-emerald-500 to-teal-600 text-white';

  return (
    <>
      <AgentLaunch />
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        {/* Left: Breadcrumb / Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-800">{brand.name}</h1>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Search (placeholder) */}
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2 text-sm text-slate-400 hover:border-indigo-300 transition-colors cursor-pointer">
            <Search size={15} />
            <span className="text-slate-400 select-none">Search...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200">
              ⌘K
            </kbd>
          </div>

          {/* Notification bell */}
          <button className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all relative">
            <Bell size={17} />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200" />

          {/* User Info */}
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-slate-700 hidden sm:block">
              {user.name || user.email}
            </span>
            <span
              className={`bg-gradient-to-r ${roleColor} px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-sm`}
            >
              {user.role}
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
