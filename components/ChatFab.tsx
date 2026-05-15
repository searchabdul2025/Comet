'use client';

import { useState } from 'react';
import { MessageCircle, X, Users, ShieldCheck, ArrowRight } from 'lucide-react';
import ChatWidget from './ChatWidget';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

/**
 * Floating chat shortcut anchored bottom-right.
 * Opens chat as a popup widget instead of navigating to a page.
 */
export default function ChatFab() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSelection, setShowSelection] = useState(false);

  const handleToggle = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'cometbpo.org' || hostname.includes('localhost')) {
        window.location.href = 'https://chat.cometbpo.org';
        return;
      }
    }

    if (isOpen && !isMinimized) {
      setIsMinimized(true);
    } else if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setShowSelection(true);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setShowSelection(false);
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleSelect = (type: 'user' | 'management') => {
    if (type === 'management') {
      const role = session?.user?.role;
      if (role === 'Admin' || role === 'Supervisor') {
        window.location.href = 'https://chat.cometbpo.org/management-chat';
        setShowSelection(false);
      } else {
        alert('Access Denied: Only management can access this area.');
      }
      return;
    }
    setIsOpen(true);
    setShowSelection(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Selection Overlay */}
      {showSelection && !isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-end p-6 pointer-events-none">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => setShowSelection(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-10 duration-300 overflow-hidden">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Chat Hub</h3>
                  <p className="text-slate-500 text-sm font-medium">Select a channel to begin</p>
                </div>
                <button onClick={() => setShowSelection(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleSelect('user')}
                  className="w-full group flex items-center gap-4 p-4 rounded-3xl bg-slate-50 hover:bg-[#D4A843]/10 border border-slate-100 hover:border-[#D4A843]/30 transition-all text-left"
                >
                  <div className="h-12 w-12 rounded-2xl bg-[#D4A843]/10 text-[#D4A843] flex items-center justify-center group-hover:bg-[#D4A843] group-hover:text-white transition-all">
                    <Users size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">Team Chat</p>
                    <p className="text-[11px] text-slate-500">Public group for all users</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-[#D4A843] group-hover:translate-x-1 transition-all" />
                </button>

                <button
                  onClick={() => handleSelect('management')}
                  className="w-full group flex items-center gap-4 p-4 rounded-3xl bg-[#101013] hover:bg-[#1A1A1F] border border-white/5 transition-all text-left"
                >
                  <div className="h-12 w-12 rounded-2xl bg-white/5 text-[#D4A843] flex items-center justify-center group-hover:bg-[#D4A843] group-hover:text-white transition-all">
                    <ShieldCheck size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white">Management</p>
                    <p className="text-[11px] text-slate-400">Restricted staff hub</p>
                  </div>
                  <ArrowRight size={18} className="text-slate-600 group-hover:text-[#D4A843] group-hover:translate-x-1 transition-all" />
                </button>
              </div>
            </div>
            <div className="px-8 py-4 bg-slate-50 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure Communication Protocol Active</p>
            </div>
          </div>
        </div>
      )}

      {/* FAB Button */}
      {!isOpen && !showSelection && (
        <button
          onClick={handleToggle}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-50 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#D4A843] text-[#101013] shadow-2xl shadow-[#D4A843]/30 hover:scale-105 hover:bg-[#B8923A] focus:outline-none transition-all active:scale-95"
        >
          <MessageCircle size={28} strokeWidth={2.5} />
        </button>
      )}

      <ChatWidget
        isOpen={isOpen}
        onClose={handleClose}
        onMinimize={handleMinimize}
        isMinimized={isMinimized}
      />

      {isMinimized && (
        <button
          onClick={handleToggle}
          aria-label="Open chat"
          className="fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#D4A843] text-[#101013] shadow-xl shadow-[#D4A843]/30 hover:bg-[#B8923A] focus:outline-none transition-all"
        >
          <MessageCircle size={22} strokeWidth={2} />
        </button>
      )}
    </>
  );
}

