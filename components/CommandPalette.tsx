'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, Users, Settings, MessageSquare, Megaphone, Bell, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const commands = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity, href: '/dashboard', category: 'Pages' },
    { id: 'forms', label: 'Form Builder', icon: FileText, href: '/forms', category: 'Pages' },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone, href: '/campaigns', category: 'Pages' },
    { id: 'users', label: 'User Management', icon: Users, href: '/user-management', category: 'Pages' },
    { id: 'chat', label: 'Chat Hub', icon: MessageSquare, href: '/chat', category: 'Pages' },
    { id: 'requests', label: 'View Requests', icon: Bell, href: '/requests', category: 'Pages' },
    { id: 'settings', label: 'System Settings', icon: Settings, href: '/settings', category: 'System' },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onClose(); // This logic might need to be in the parent to toggle
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-[#101013]/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#1A1A1F] w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-4 border-b border-slate-100 dark:border-white/5">
          <Search size={20} className="text-slate-400 mr-3" />
          <input 
            autoFocus
            type="text" 
            placeholder="Type a command or search..." 
            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder:text-slate-400 text-lg"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 ml-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-white/10">ESC</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            <div className="space-y-1">
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => {
                    router.push(cmd.href);
                    onClose();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#D4A843]/10 group transition-all text-left"
                >
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-[#D4A843] group-hover:bg-white transition-all">
                    <cmd.icon size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-white">{cmd.label}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cmd.category}</div>
                  </div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-all">
                    <span className="text-[10px] font-bold text-[#D4A843] uppercase tracking-tighter">Jump to</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Search size={32} className="mx-auto mb-3 opacity-20" />
              <p>No results found for &quot;{query}&quot;</p>
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><span className="px-1 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-sm text-[9px]">↑↓</span> Select</span>
            <span className="flex items-center gap-1.5"><span className="px-1 py-0.5 rounded bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 shadow-sm text-[9px]">ENTER</span> Confirm</span>
          </div>
          <span>Comet Quick Search</span>
        </div>
      </div>
    </div>
  );
}
