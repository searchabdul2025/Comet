'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Send, ShieldAlert, WifiOff, MessageSquare, Loader2, LogOut, User } from 'lucide-react';
import ChatSelection from '@/components/ChatSelection';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';

type ChatMessage = {
  _id: string;
  userId: string;
  userName: string;
  userRole: 'Admin' | 'Supervisor' | 'User';
  content: string;
  createdAt: string;
  isSystem?: boolean;
};

const DEFAULT_LIMITS = { rateLimitPerMinute: 15, maxMessageLength: 500, historyLimit: 50 };

export default function ChatPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [view, setView] = useState<'selection' | 'user' | 'management'>('selection');

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/chat-login');
    }
  }, [authStatus, router]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionCaret, setMentionCaret] = useState(0);
  const [status, setStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [error, setError] = useState('');
  const [banned, setBanned] = useState<{ reason?: string | null } | null>(null);
  const [sending, setSending] = useState(false);
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const userId = session?.user?.id;
  const currentName = session?.user?.name?.toLowerCase?.() || '';
  const currentUsername = session?.user?.username?.toLowerCase?.() || '';

  const sortedMessages = useMemo(() => messages, [messages]);
  const participants = useMemo(() => {
    const seen = new Map<string, string>();
    messages.forEach((m) => {
      if (m.userName) {
        seen.set(m.userName.toLowerCase(), m.userName);
      }
    });
    if (session?.user?.name) {
      seen.set(session.user.name.toLowerCase(), session.user.name);
    }
    return Array.from(seen.values()).sort();
  }, [messages, session?.user?.name]);

  const mentionSuggestions = useMemo(() => {
    if (!mentionQuery) return participants;
    const q = mentionQuery.toLowerCase();
    return participants.filter((p) => p.toLowerCase().startsWith(q));
  }, [mentionQuery, participants]);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const res = await fetch('/api/chat/messages');
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Failed to load chat');
        }
        setMessages(result.data.messages || []);
        if (result.data?.limits) {
          setLimits(result.data.limits);
        }
        if (result.data?.ban) {
          setBanned(result.data.ban);
        } else {
          setBanned(null);
        }
        setStatus('live');
      } catch (err: any) {
        setError(err.message || 'Failed to load chat');
        setStatus('offline');
      }
    };

    loadInitial();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const source = new EventSource('/api/chat/stream');

    source.onopen = () => setStatus('live');
    source.onerror = () => setStatus('offline');
    source.onmessage = (event) => {
      if (!event.data) return;
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'message' && payload.message) {
          setMessages((prev) => {
            const next = [...prev, payload.message as ChatMessage];
            if (next.length > limits.historyLimit) {
              return next.slice(next.length - limits.historyLimit);
            }
            return next;
          });
        } else if (payload.type === 'ban' && payload.ban?.userId === userId) {
          setBanned({ reason: payload.ban.reason });
        } else if (payload.type === 'unban' && payload.userId === userId) {
          setBanned(null);
        }
      } catch {
        // ignore malformed payloads
      }
    };

    return () => source.close();
  }, [limits.historyLimit, userId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sortedMessages.length]);

  const handleInputChange = (value: string, caretPos: number | null) => {
    setInput(value);
    const caret = caretPos ?? value.length;
    setMentionCaret(caret);
    
    const before = value.slice(0, caret);
    // Find the last '@' that is either at the start or preceded by a space
    const lastAtIdx = before.lastIndexOf('@');
    if (lastAtIdx !== -1 && (lastAtIdx === 0 || before[lastAtIdx - 1] === ' ')) {
      const query = before.slice(lastAtIdx + 1);
      // Only treat as a mention if the query is reasonably short (e.g., < 25 chars) 
      // and doesn't contain multiple trailing spaces
      if (query.length < 25 && !query.includes('  ')) {
        setMentionQuery(query);
      } else {
        setMentionQuery('');
      }
    } else {
      setMentionQuery('');
    }
  };

  const insertMention = (name: string) => {
    const caret = mentionCaret;
    const before = input.slice(0, caret);
    const after = input.slice(caret);
    const lastAtIdx = before.lastIndexOf('@');
    if (lastAtIdx === -1) return;

    const prefix = before.slice(0, lastAtIdx);
    const newValue = `${prefix}@${name} ${after}`;
    setInput(newValue);
    setMentionQuery('');
  };

  const sendMessage = async () => {
    if (sending || !input.trim() || banned) return;
    const body = input.trim().slice(0, limits.maxMessageLength);
    try {
      setSending(true);
      setError('');
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: body }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to send message');
      }
      setInput('');
      setMentionQuery('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
      if (err.message?.toLowerCase()?.includes('banned')) {
        setBanned({ reason: err.message });
      }
    } finally {
      setSending(false);
    }
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderContent = (text: string) => {
    // We want to highlight names from the participants list when preceded by @
    // This is more reliable than a generic regex for names with spaces
    if (!text.includes('@')) return <span>{text}</span>;

    const tokens: React.ReactNode[] = [text];
    
    participants.forEach(name => {
      const mention = `@${name}`;
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (typeof token !== 'string') continue;

        if (token.includes(mention)) {
          const parts = token.split(mention);
          const newTokens: React.ReactNode[] = [];
          
          parts.forEach((part, idx) => {
            newTokens.push(part);
            if (idx < parts.length - 1) {
              const isMe = name.toLowerCase() === currentName || name.toLowerCase() === currentUsername;
              newTokens.push(
                <span
                  key={`${name}-${idx}`}
                  className={`px-1.5 py-0.5 rounded-md font-bold ${
                    isMe 
                      ? 'bg-[#D4A843] text-[#101013] shadow-sm' 
                      : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                  }`}
                >
                  @{name}
                </span>
              );
            }
          });
          
          tokens.splice(i, 1, ...newTokens);
          i += newTokens.length - 1;
        }
      }
    });

    return <>{tokens}</>;
  };

  const handleSelect = (type: 'user' | 'management') => {
    if (type === 'management') {
      const role = session?.user?.role;
      if (role === 'Admin' || role === 'Supervisor') {
        router.push('/management-chat'); // Redirect to management chat area
      } else {
        setError('Access Denied: Only management can access this area.');
      }
      return;
    }
    setView('user');
  };

  if (authStatus === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
        <p className="text-slate-500 font-medium">Loading your secure chat session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-[100] w-full bg-[#101013] border-b border-white/5 px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#B8923A] flex items-center justify-center shadow-lg shadow-[#D4A843]/10">
            <MessageSquare size={20} className="text-[#101013]" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white uppercase tracking-widest leading-none">Comet Hub</h1>
            <p className="text-[10px] font-bold text-[#D4A843] uppercase tracking-tighter opacity-80 mt-1">Communication Portal</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
               <User size={16} className="text-slate-400" />
            </div>
            <div>
              <div className="text-[11px] font-black text-white uppercase tracking-tight leading-none">{session?.user?.name || 'Authorized Agent'}</div>
              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{session?.user?.role}</div>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: '/chat-login' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all font-bold text-[11px] uppercase tracking-widest"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full">
          {view === 'selection' ? (
            <div className="space-y-6">
              {error && (
                <div className="max-w-3xl mx-auto flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 animate-in fade-in slide-in-from-top-4">
                  <ShieldAlert size={18} />
                  <span>{error}</span>
                </div>
              )}
              <ChatSelection onSelect={handleSelect} />
            </div>
          ) : (
            <div className="space-y-6">
              <PageHeader 
                title="Command Center" 
                description="Real-time communication and intelligence sharing for the operations team."
              />

              {/* Connection & Ban Alerts */}
              <div className="flex flex-wrap gap-3">
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 ${
                  status === 'live' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 
                  status === 'connecting' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' : 
                  'bg-red-500/10 text-red-600 border border-red-500/20'
                }`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${status === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {status === 'live' ? 'Operations Live' : status === 'connecting' ? 'Establishing Secure Link...' : 'Link Terminated'}
                </div>
                {banned && (
                  <div className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-600 text-white border border-red-700 animate-pulse">
                    Access Revoked: {banned.reason || 'Security Violation'}
                  </div>
                )}
              </div>

              <div className="card-premium flex flex-col h-[75vh] overflow-hidden relative">
                {/* Chat Background Graphic */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
                   <div className="absolute top-1/4 left-1/4 text-[20rem] font-black transform -rotate-12">CHAT</div>
                </div>

                {/* Messages Display */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-premium relative z-10">
                  {sortedMessages.length === 0 && status === 'live' ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-30">
                       <MessageSquare size={48} />
                       <p className="mt-4 font-bold uppercase tracking-widest text-xs">Awaiting Communications</p>
                    </div>
                  ) : (
                    sortedMessages.map((msg) => {
                      const isOwn = msg.userId === userId;
                      const isSystem = msg.isSystem;
                      return (
                        <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                          <div className={`max-w-[80%] group ${isOwn ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-center gap-2 mb-1 px-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
                               <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                                 {isSystem ? 'Security Protocol' : msg.userName}
                               </span>
                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                                 msg.userRole === 'Admin' ? 'bg-red-500/10 text-red-600' : 
                                 msg.userRole === 'Supervisor' ? 'bg-[#D4A843]/10 text-[#D4A843]' : 
                                 'bg-slate-100 text-slate-500'
                               }`}>
                                 {msg.userRole}
                               </span>
                               <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                 {formatTime(msg.createdAt)}
                               </span>
                            </div>
                            <div className={`relative px-4 py-3 rounded-2xl text-sm shadow-sm transition-all duration-300 ${
                              isSystem ? 'bg-slate-50 border border-slate-100 text-slate-500 italic text-xs' : 
                              isOwn ? 'bg-[#101013] text-[#D4A843] border border-[#202025] rounded-tr-none' : 
                              'bg-white border border-slate-100 text-slate-800 rounded-tl-none hover:border-[#D4A843]/30'
                            }`}>
                              <p className="whitespace-pre-wrap break-words leading-relaxed font-medium">
                                {renderContent(msg.content)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 bg-slate-50/50 border-t border-slate-100 relative z-10">
                   <div className="relative">
                      <textarea
                        value={input}
                        onChange={(e) => handleInputChange(e.target.value, e.currentTarget.selectionStart)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        disabled={sending || status !== 'live' || !!banned}
                        placeholder={banned ? 'Security link severed.' : 'Enter message...'}
                        className="w-full bg-white border border-slate-200 rounded-[1.5rem] px-6 py-4 pr-32 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D4A843] focus:border-transparent transition-all shadow-inner resize-none min-h-[64px]"
                        rows={1}
                        maxLength={limits.maxMessageLength}
                      />
                      
                      {mentionQuery && mentionSuggestions.length > 0 && (
                        <div className="absolute bottom-full left-0 mb-4 w-64 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden z-20 animate-in fade-in slide-in-from-bottom-2">
                          <div className="p-3 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Members</div>
                          <div className="max-h-48 overflow-y-auto p-1">
                            {mentionSuggestions.map((name) => (
                              <button
                                key={name}
                                onClick={() => insertMention(name)}
                                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-[#101013] hover:text-[#D4A843] rounded-lg transition-all"
                              >
                                @{name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="absolute right-3 top-2 bottom-2 flex items-center gap-2">
                         <div className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-tighter mr-2">
                           {input.length}/{limits.maxMessageLength}
                         </div>
                         <button
                            onClick={sendMessage}
                            disabled={sending || status !== 'live' || !!banned || !input.trim()}
                            className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#101013] text-[#D4A843] hover:scale-105 transition-all active:scale-95 disabled:opacity-30 disabled:hover:scale-100 shadow-lg"
                         >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                         </button>
                      </div>
                   </div>
                   <div className="mt-3 flex justify-center">
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-50">Secure Communication Protocol Active</p>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


