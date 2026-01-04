'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Send, LogOut, MessageSquare, Loader2 } from 'lucide-react';

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

export default function ChatroomChatPage() {
  const router = useRouter();
  const params = useParams();
  const chatroomId = params.id as string;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'connecting' | 'live' | 'offline'>('connecting');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [limits, setLimits] = useState(DEFAULT_LIMITS);
  const [chatroomInfo, setChatroomInfo] = useState<{ name?: string; description?: string } | null>(null);
  const [userInfo, setUserInfo] = useState<{ username?: string; displayName?: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    verifySession();
  }, [chatroomId]);

  useEffect(() => {
    if (chatroomInfo && userInfo) {
      loadInitialMessages();
    }
  }, [chatroomInfo, userInfo]);

  useEffect(() => {
    if (chatroomInfo && userInfo) {
      const source = new EventSource(`/api/chatrooms/${chatroomId}/stream`);

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
          }
        } catch {
          // ignore malformed payloads
        }
      };

      return () => source.close();
    }
  }, [chatroomId, limits.historyLimit, chatroomInfo, userInfo]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const verifySession = async () => {
    try {
      const res = await fetch('/api/chatrooms/auth/verify');
      const json = await res.json();

      if (!json.success) {
        router.push(`/chatroom-login?id=${chatroomId}`);
        return;
      }

      setChatroomInfo(json.data.chatroom);
      setUserInfo(json.data.user);
    } catch (err: any) {
      setError(err.message || 'Failed to verify session');
      router.push(`/chatroom-login?id=${chatroomId}`);
    }
  };

  const loadInitialMessages = async () => {
    try {
      setStatus('connecting');
      const res = await fetch(`/api/chatrooms/${chatroomId}/messages`);
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to load messages');
      }

      setMessages(result.data.messages || []);
      if (result.data?.limits) {
        setLimits(result.data.limits);
      }
      setStatus('live');
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
      setStatus('offline');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/chatrooms/auth/logout', { method: 'POST' });
      router.push(`/chatroom-login?id=${chatroomId}`);
    } catch (err) {
      console.error('Logout failed:', err);
      router.push(`/chatroom-login?id=${chatroomId}`);
    }
  };

  const sendMessage = async () => {
    if (sending || !input.trim() || status !== 'live') return;
    const body = input.trim().slice(0, limits.maxMessageLength);

    try {
      setSending(true);
      setError('');
      const res = await fetch(`/api/chatrooms/${chatroomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: body }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      setInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (value: string) => {
    const date = new Date(value);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chatroomInfo || !userInfo) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare size={20} className="text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{chatroomInfo.name}</h1>
            <p className="text-xs text-gray-500">Logged in as {userInfo.displayName || userInfo.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`text-xs px-3 py-1 rounded-full ${
              status === 'live'
                ? 'bg-green-100 text-green-700'
                : status === 'connecting'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {status === 'live' ? 'Live' : status === 'connecting' ? 'Connecting...' : 'Offline'}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No messages yet. Say hello!</p>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.isSystem;
            return (
              <div key={msg._id} className={`flex ${isSystem ? 'justify-center' : 'justify-start'}`}>
                <div
                  className={`max-w-xl rounded-2xl px-3 py-2 shadow-sm border text-sm ${
                    isSystem
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-white text-slate-900 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[11px] mb-1">
                    <span className="font-semibold">{isSystem ? 'System' : msg.userName}</span>
                    <span className="text-slate-500">{formatTime(msg.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white border-t border-gray-200 p-3">
        <div className="flex items-center gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={sending || status !== 'live'}
            placeholder={status !== 'live' ? 'Connecting...' : 'Write a message...'}
            className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 bg-white text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            rows={2}
            maxLength={limits.maxMessageLength}
          />
          <button
            onClick={sendMessage}
            disabled={sending || status !== 'live' || !input.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            Send
          </button>
        </div>
        <div className="mt-1 text-xs text-gray-500 flex justify-between">
          <span>Max {limits.maxMessageLength} chars</span>
          {input.length > limits.maxMessageLength - 50 && (
            <span>{limits.maxMessageLength - input.length} remaining</span>
          )}
        </div>
      </div>
    </div>
  );
}

