'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import AgentLaunch from './AgentLaunch';
import { Search, Bell, Moon, Sun, ChevronDown } from 'lucide-react';

export default function Header() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [brand, setBrand] = useState<{ name: string; logo?: string }>({ name: 'Portal' });
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check persisted theme
    const saved = localStorage.getItem('comet-theme');
    if (saved === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
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

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('comet-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('comet-theme', 'light');
    }
  };

  if (!mounted || status === 'loading') {
    return (
      <header className="bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--header-border)] px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="h-6 w-24 bg-[var(--card-border)] rounded-lg animate-pulse" />
        <div className="h-8 w-32 bg-[var(--card-border)] rounded-lg animate-pulse" />
      </header>
    );
  }

  if (!session?.user) return null;

  const user = session.user;

  const roleBadge =
    user.role === 'Admin'
      ? 'bg-gradient-to-r from-[#D4A843] to-[#B8923A] text-[#101013]'
      : user.role === 'Supervisor'
      ? 'bg-gradient-to-r from-[#3A3A42] to-[#2A2A30] text-white'
      : 'bg-gradient-to-r from-[#8B8B94] to-[#6B6B74] text-white';

  return (
    <>
      <AgentLaunch />
      <header className="bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--header-border)] px-6 py-3 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
        {/* Left: Search */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 bg-[var(--header-input-bg)] border border-[var(--header-input-border)] rounded-xl px-3 py-2 text-sm text-[var(--text-tertiary)] hover:border-[#D4A843]/30 transition-colors cursor-pointer min-w-[220px]">
            <Search size={15} />
            <span className="select-none">Search anything...</span>
            <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold text-[var(--text-tertiary)] bg-[var(--card-bg)] border border-[var(--card-border)] ml-auto">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="h-9 w-9 rounded-xl bg-[var(--header-input-bg)] border border-[var(--header-input-border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notification bell */}
          <button className="h-9 w-9 rounded-xl bg-[var(--header-input-bg)] border border-[var(--header-input-border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all relative">
            <Bell size={17} />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#D4A843] border-2 border-[var(--card-bg)]" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-[var(--card-border)]" />

          {/* User Info */}
          <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#D4A843] to-[#B8923A] flex items-center justify-center text-[#101013] text-xs font-bold shadow-sm">
              {user.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U'}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">
                {user.name || user.email}
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {user.role === 'Admin' ? 'Super Admin' : user.role}
              </p>
            </div>
            <ChevronDown size={14} className="text-[var(--text-tertiary)] hidden sm:block" />
          </div>
        </div>
      </header>
    </>
  );
}
