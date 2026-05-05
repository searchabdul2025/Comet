'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  Search, 
  Tag, 
  Send, 
  Loader2, 
  ChevronRight,
  MoreVertical,
  Trash2,
  Lock
} from 'lucide-react';

type ChatMessage = {
  _id: string;
  userId: string;
  userName: string;
  userRole: 'Admin' | 'Supervisor' | 'User';
  content: string;
  createdAt: string;
  isSystem?: boolean;
};

export default function ManagementChatPage() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const [activeTab, setActiveTab] = useState<'management' | 'users'>('management');
  const [managementMessages, setManagementMessages] = useState<ChatMessage[]>([]);
  const [userConversations, setUserConversations] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Authorization check
  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login');
    } else if (session?.user && session.user.role !== 'Admin' && session.user.role !== 'Supervisor') {
      router.push('/chat'); // Redirect regular users
    }
  }, [session, authStatus, router]);

  useEffect(() => {
    if (session?.user && (session.user.role === 'Admin' || session.user.role === 'Supervisor')) {
      loadData();
      // Setup SSE for real-time updates
      const source = new EventSource('/api/chat/stream');
      source.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'message') {
          // If it's a management message (we'll need a way to distinguish this in the backend)
          // For now, let's assume all messages in this hub are management
          setManagementMessages((prev) => [...prev, payload.message]);
        }
      };
      return () => source.close();
    }
  }, [session]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [managementMessages]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch management messages
      const res = await fetch('/api/chat/management');
      const data = await res.json();
      if (data.success) setManagementMessages(data.messages);
      
      // Fetch all user conversations (recent messages from everyone)
      const userRes = await fetch('/api/chat/all');
      const userData = await userRes.json();
      if (userData.success) setUserConversations(userData.messages);
    } catch (error) {
      console.error('Failed to load chat data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || sending) return;
    try {
      setSending(true);
      const res = await fetch('/api/chat/management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input.trim() }),
      });
      if (res.ok) setInput('');
    } catch (error) {
      console.error('Failed to send message', error);
    } finally {
      setSending(false);
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
          <p className="text-slate-500 font-medium">Initializing Management Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 m-4">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">Management</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Secure Hub</p>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('management')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                activeTab === 'management' 
                  ? 'bg-white shadow-md text-indigo-600' 
                  : 'text-slate-500 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Lock size={18} />
                <span className="font-bold text-sm">Internal Group</span>
              </div>
              <div className="h-2 w-2 rounded-full bg-indigo-600"></div>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                activeTab === 'users' 
                  ? 'bg-white shadow-md text-indigo-600' 
                  : 'text-slate-500 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users size={18} />
                <span className="font-bold text-sm">User Oversight</span>
              </div>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="bg-indigo-600 rounded-2xl p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Status</p>
            <p className="text-xs font-medium leading-relaxed">You are monitoring all team communications.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {activeTab === 'management' ? (
          <>
            {/* Chat Header */}
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Internal Group Chat</h2>
                <p className="text-xs text-slate-500">Only Admins and Supervisors can see these messages.</p>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                    M
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {managementMessages.map((msg) => (
                <div key={msg._id} className={`flex ${msg.userId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] group ${msg.userId === session?.user?.id ? 'order-2' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1 ${msg.userId === session?.user?.id ? 'justify-end' : ''}`}>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{msg.userName}</span>
                      <span className="text-[10px] text-slate-300">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`p-4 rounded-[1.5rem] shadow-sm text-sm leading-relaxed ${
                      msg.userId === session?.user?.id 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' 
                        : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className="p-8 border-t border-slate-50">
              <div className="flex gap-4 bg-slate-50 border border-slate-100 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message to management..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 px-4"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={sending || !input.trim()}
                  className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">User Oversight Panel</h2>
                  <p className="text-xs text-slate-500">Monitor all team conversations in real-time.</p>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {['All Messages', 'Flagged', 'Management Tagged'].map((label) => (
                  <button key={label} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-[10px] font-bold text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-all uppercase tracking-widest">
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 gap-4">
                {userConversations.map((msg) => (
                  <div key={msg._id} className="group bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-slate-100 transition-all flex items-start justify-between">
                    <div className="flex gap-4">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                        {msg.userName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-900">{msg.userName}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">{msg.userRole}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2 leading-relaxed">"{msg.content}"</p>
                        <p className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-all" title="Tag User">
                        <Tag size={18} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
