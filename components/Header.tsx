'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Search, Bell, Moon, Sun, ChevronDown, Settings, LogOut, X, Clock, MessageSquare, Megaphone, Users, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import AgentLaunch from './AgentLaunch';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [brand, setBrand] = useState<{ name: string; logo?: string }>({ name: 'Comet', logo: '/logo.svg' });
  const [darkMode, setDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
          setBrand({ 
            name: result.data.APP_NAME || 'Comet', 
            logo: result.data.APP_LOGO_URL || '/logo.svg' 
          });
        }
      } catch {
        // ignore
      }
    };
    loadBrand();
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!session?.user) return;
      try {
        const res = await fetch('/api/requests');
        const result = await res.json();
        if (result.success) {
          const pending = result.data.filter((r: any) => r.status === 'Pending').slice(0, 5);
          setNotifications(pending);
          setUnreadCount(pending.length);
        }
      } catch {
        // ignore
      }
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [session]);

  // Realtime Search Logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
          const result = await res.json();
          if (result.success) {
            setSearchResults(result.data);
            setShowSearchResults(true);
          }
        } catch (err) {
          console.error('Search failed:', err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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

  return (
    <>
      <AgentLaunch />
      
      <header className="bg-[var(--header-bg)] backdrop-blur-xl border-b border-[var(--header-border)] px-6 py-3 flex items-center justify-between sticky top-0 z-30 transition-colors duration-300">
        {/* Left: Empty spacer */}
        <div className="flex items-center gap-3">
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {/* Realtime Search Bar */}
          <div className="relative hidden lg:block">
            <div className={`flex items-center gap-2 bg-[var(--header-input-bg)] border transition-all duration-300 rounded-xl px-3 py-1.5 min-w-[280px] ${showSearchResults ? 'border-[#D4A843] ring-2 ring-[#D4A843]/10' : 'border-[var(--header-input-border)]'}`}>
              <Search size={14} className={isSearching ? 'hidden' : 'text-[var(--text-tertiary)]'} />
              {isSearching && <Loader2 size={14} className="animate-spin text-[#D4A843]" />}
              <input 
                type="text"
                placeholder="Search users, forms, campaigns..."
                className="bg-transparent border-none outline-none text-xs text-[var(--text-primary)] w-full placeholder:text-[var(--text-tertiary)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSearchResults(true)}
              />
              <kbd className="hidden xl:inline-flex items-center px-1.2 py-0.3 rounded text-[9px] font-semibold text-[var(--text-tertiary)] bg-[var(--card-bg)] border border-[var(--card-border)] ml-auto opacity-50">
                ⌘K
              </kbd>
            </div>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSearchResults(false)} />
                <div className="absolute top-full right-0 mt-2 w-[320px] bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-[var(--card-border)] bg-[var(--header-input-bg)]">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider px-3 py-1">Quick Search Results</p>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((result) => {
                        const Icon = result.type === 'User' ? Users : result.type === 'Form' ? FileText : Megaphone;
                        return (
                          <Link
                            key={result.id + result.type}
                            href={result.href}
                            onClick={() => {
                              setShowSearchResults(false);
                              setSearchQuery('');
                            }}
                            className="flex items-center gap-3 p-3 hover:bg-[var(--header-input-bg)] transition-all border-b border-[var(--card-border)] last:border-0 group"
                          >
                            <div className="h-9 w-9 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-[#D4A843] group-hover:bg-[#D4A843]/10 transition-all">
                              <Icon size={16} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-bold text-[var(--text-primary)] truncate">{result.title}</p>
                                <span className="text-[9px] font-black uppercase tracking-tighter text-[#D4A843] bg-[#D4A843]/5 px-1.5 py-0.5 rounded">{result.type}</span>
                              </div>
                              <p className="text-[10px] text-[var(--text-tertiary)] truncate">{result.subtitle}</p>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center">
                        <Search size={24} className="mx-auto mb-2 text-slate-200" />
                        <p className="text-xs text-[var(--text-tertiary)]">No results found for &quot;{searchQuery}&quot;</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-[var(--header-input-bg)] border-t border-[var(--card-border)] text-center">
                    <p className="text-[9px] font-medium text-[var(--text-tertiary)] uppercase tracking-widest">Press ESC to close</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="h-9 w-9 rounded-xl bg-[var(--header-input-bg)] border border-[var(--header-input-border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Notification bell */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="h-9 w-9 rounded-xl bg-[var(--header-input-bg)] border border-[var(--header-input-border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all relative"
            >
              <Bell size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#D4A843] border-2 border-[var(--card-bg)] text-[8px] font-bold text-[#101013] flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-[var(--card-border)] flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Notifications</h3>
                    <span className="px-2 py-0.5 rounded-full bg-[#D4A843]/10 text-[#D4A843] text-[9px] font-bold">{unreadCount} New</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <Link 
                          key={n.id} 
                          href="/requests"
                          onClick={() => setShowNotifications(false)}
                          className="flex items-start gap-3 p-4 hover:bg-[var(--header-input-bg)] transition-colors border-b border-[var(--card-border)] last:border-0"
                        >
                          <div className="h-8 w-8 rounded-lg bg-[#D4A843]/10 flex items-center justify-center text-[#D4A843] flex-shrink-0">
                            <Clock size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{n.title || n.type}</p>
                            <p className="text-[10px] text-[var(--text-tertiary)] line-clamp-2 mt-0.5">{n.details || n.message}</p>
                            <p className="text-[9px] text-[#D4A843] mt-1 font-bold">{new Date(n.createdAt).toLocaleDateString()}</p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
                          <Bell size={20} className="text-slate-300" />
                        </div>
                        <p className="text-xs text-[var(--text-tertiary)]">No new notifications</p>
                      </div>
                    )}
                  </div>
                  <Link 
                    href="/requests" 
                    onClick={() => setShowNotifications(false)}
                    className="block p-3 text-center text-[10px] font-bold text-[#D4A843] hover:bg-[#D4A843]/5 border-t border-[var(--card-border)] uppercase tracking-widest"
                  >
                    View All Requests
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-[var(--card-border)]" />

          {/* User Info Dropdown */}
          <div className="relative">
            <div 
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 cursor-pointer hover:bg-[var(--header-input-bg)] transition-all px-2 py-1.5 rounded-xl"
            >
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
              <ChevronDown 
                size={14} 
                className={`text-[var(--text-tertiary)] hidden sm:block transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} 
              />
            </div>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-[var(--card-border)] bg-[var(--header-input-bg)]">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider px-3 py-1">User Account</p>
                  </div>
                  <div className="p-1.5">
                    <Link 
                      href="/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[#D4A843] hover:bg-[#D4A843]/5 rounded-xl transition-all group"
                    >
                      <Settings size={16} className="group-hover:rotate-45 transition-transform duration-500" />
                      <span>Settings</span>
                    </Link>
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut({ callbackUrl: '/', redirect: true });
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                    >
                      <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
