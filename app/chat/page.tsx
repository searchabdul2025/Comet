'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Send, ShieldAlert, WifiOff, MessageSquare } from 'lucide-react';

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
  const { data: session } = useSession();
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
    const match = /(^|\s)@([a-zA-Z0-9_.-]{0,24})$/i.exec(before);
    if (match) {
      setMentionQuery(match[2]);
    } else {
      setMentionQuery('');
    }
  };

  const insertMention = (name: string) => {
    const caret = mentionCaret;
    const before = input.slice(0, caret);
    const after = input.slice(caret);
    const match = /(^|\s)@([a-zA-Z0-9_.-]{0,24})$/i.exec(before);
    if (!match) {
      return;
    }
    const start = (match.index ?? 0) + match[1].length;
    const prefix = before.slice(0, start);
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
    const parts = text.split(/(@[A-Za-z0-9_.-]+)/g);
    return parts.map((part, idx) => {
      if (!part.startsWith('@')) {
        return <span key={idx}>{part}</span>;
      }
      const mention = part.slice(1);
      const isMe =
        mention.toLowerCase() === currentName ||
        mention.toLowerCase() === currentUsername;
      return (
        <span
          key={idx}
          className={`px-1 rounded ${isMe ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'}`}
        >
          {part}
        </span>
      );
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare size={22} className="text-blue-600" />
            Team Chat
          </h1>
          <p className="text-sm text-gray-600">Real-time room for everyone in the portal.</p>
        </div>
        <div
          className={`text-sm px-3 py-1 rounded-full ${
            status === 'live'
              ? 'bg-green-100 text-green-700'
              : status === 'connecting'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {status === 'live' ? 'Live' : status === 'connecting' ? 'Connecting...' : 'Offline'}
        </div>
      </div>

      {banned && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <ShieldAlert size={16} />
          <span>You are banned from chat{banned.reason ? `: ${banned.reason}` : ''}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <WifiOff size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedMessages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
          ) : (
            sortedMessages.map((msg) => {
              const isOwn = msg.userId === userId;
              const isSystem = msg.isSystem;
              return (
                <div
                  key={msg._id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xl rounded-2xl px-3 py-2 shadow-sm border text-sm ${
                      isSystem
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : isOwn
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-white text-slate-900 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[11px] mb-1">
                      <span className="font-semibold">
                        {isSystem ? 'System' : msg.userName}
                        {!isSystem && (
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] ${
                            msg.userRole === 'Admin'
                              ? 'bg-red-100 text-red-700'
                              : msg.userRole === 'Supervisor'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {msg.userRole}
                          </span>
                        )}
                      </span>
                      <span className={isOwn ? 'text-white/70' : 'text-slate-500'}>
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap break-words">
                      {renderContent(msg.content)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 relative">
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
              placeholder={
                banned
                  ? 'You cannot send messages while banned.'
                  : 'Write a message...'
              }
              className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              rows={2}
              maxLength={limits.maxMessageLength}
            />
            {mentionQuery && mentionSuggestions.length > 0 && (
              <div className="absolute bottom-16 left-0 right-24 bg-white border border-slate-200 shadow-lg rounded-xl overflow-hidden z-20 max-h-48 overflow-y-auto">
                {mentionSuggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => insertMention(name)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 focus:bg-slate-100"
                  >
                    @{name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={sendMessage}
              disabled={sending || status !== 'live' || !!banned || !input.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              Send
            </button>
          </div>
          <div className="mt-1 text-xs text-slate-500 flex justify-between">
            <span>Max {limits.maxMessageLength} chars • {limits.rateLimitPerMinute} msgs/min</span>
            {input.length > limits.maxMessageLength - 50 && (
              <span>{limits.maxMessageLength - input.length} remaining</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


