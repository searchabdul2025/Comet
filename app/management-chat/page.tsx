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
  Lock,
  ArrowLeft
} from 'lucide-react';
import ChatLoginModal from '@/components/ChatLoginModal';

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
  const [isVerified, setIsVerified] = useState(false);
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
    if (isVerified && session?.user && (session.user.role === 'Admin' || session.user.role === 'Supervisor')) {
      loadData();
      // Setup SSE for real-time updates
      const source = new EventSource('/api/chat/stream');
      source.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'message') {
          if (payload.message.isManagement) {
            setManagementMessages((prev) => [...prev, payload.message]);
          } else {
            setUserConversations((prev) => [payload.message, ...prev.slice(0, 49)]);
          }
        }
      };
      return () => source.close();
    }
  }, [session, isVerified]);

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

  const handleTagUser = (userName: string) => {
    setActiveTab('management');
    setInput(`@${userName} `);
  };

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!isVerified) {
    return (
      <ChatLoginModal 
        onSuccess={() => setIsVerified(true)} 
        onCancel={() => router.back()} 
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={40} />
          <p className="text-slate-500 font-medium">Synchronizing Management Hub...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] m-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Security Command Hub</h1>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Management Only</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Encrypted Link Active</span>
        </div>
      </div>

      <div className="flex-1 flex bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200/60">
        {/* Sidebar */}
        <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
          <div className="p-8">
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('management')}
                className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all ${
                  activeTab === 'management' 
                    ? 'bg-indigo-600 shadow-xl shadow-indigo-100 text-white' 
                    : 'text-slate-500 hover:bg-white border border-transparent hover:border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Lock size={18} />
                  <span className="font-bold text-sm">Internal Group</span>
                </div>
                {activeTab === 'management' && <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>}
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all ${
                  activeTab === 'users' 
                    ? 'bg-indigo-600 shadow-xl shadow-indigo-100 text-white' 
                    : 'text-slate-500 hover:bg-white border border-transparent hover:border-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users size={18} />
                  <span className="font-bold text-sm">User Oversight</span>
                </div>
                {activeTab === 'users' && <ChevronRight size={18} />}
              </button>
            </div>
          </div>

          <div className="mt-auto p-8">
            <div className="bg-white/50 border border-slate-100 rounded-3xl p-6">
              <div className="h-10 w-10 rounded-xl bg-[#D4A843]/10 text-[#D4A843] flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Protocol Status</p>
              <p className="text-xs font-bold text-slate-600 leading-relaxed">Monitoring all communications across {userConversations.length} sessions.</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white">
          {activeTab === 'management' ? (
            <>
              {/* Chat Header */}
              <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Internal Management Group</h2>
                  <p className="text-xs text-slate-400 font-medium">Encrypted internal briefing room for staff only.</p>
                </div>
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 w-10 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                      M
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-premium">
                {managementMessages.map((msg) => (
                  <div key={msg._id} className={`flex ${msg.userId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] group ${msg.userId === session?.user?.id ? 'order-2' : ''}`}>
                      <div className={`flex items-center gap-3 mb-2 ${msg.userId === session?.user?.id ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{msg.userName}</span>
                        <span className="text-[9px] text-slate-300 font-bold">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`p-5 rounded-[2rem] shadow-sm text-sm leading-relaxed font-medium ${
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
              <div className="p-10 border-t border-slate-50">
                <div className="flex gap-4 bg-slate-50 border border-slate-100 p-3 rounded-[2rem] focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/30 focus-within:bg-white transition-all shadow-inner">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Brief management team..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 placeholder:text-slate-400 px-6 font-medium"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !input.trim()}
                    className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="px-10 py-8 border-b border-slate-50 bg-slate-50/10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Intelligence Oversight</h2>
                    <p className="text-xs text-slate-400 font-medium">Real-time surveillance of user communications.</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search intercepts..."
                      className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-[1.5rem] text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  {['All Transmissions', 'Security Risks', 'Tagged'].map((label) => (
                    <button key={label} className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-[10px] font-black text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-all uppercase tracking-widest shadow-sm">
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-premium">
                {userConversations.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                    <MessageSquare size={48} className="mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">No communications detected</p>
                  </div>
                ) : (
                  userConversations.map((msg) => (
                    <div key={msg._id} className="group bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-slate-200/50 hover:border-indigo-500/20 transition-all flex items-start justify-between animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 font-black text-xl border border-slate-100 shadow-sm">
                          {msg.userName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-black text-slate-900">{msg.userName}</h4>
                            <span className={`text-[9px] px-2 py-1 rounded-lg font-black uppercase tracking-widest ${
                              msg.userRole === 'Admin' ? 'bg-red-500/10 text-red-600' :
                              msg.userRole === 'Supervisor' ? 'bg-[#D4A843]/10 text-[#D4A843]' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {msg.userRole}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{new Date(msg.createdAt).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-slate-600 mb-0 leading-relaxed font-medium">"{msg.content}"</p>
                        </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                          onClick={() => handleTagUser(msg.userName)}
                          className="h-10 w-10 rounded-xl hover:bg-indigo-50 text-indigo-600 transition-all flex items-center justify-center border border-transparent hover:border-indigo-100" 
                          title="Message/Tag User"
                        >
                          <Tag size={18} />
                        </button>
                        <button className="h-10 w-10 rounded-xl hover:bg-slate-50 text-slate-400 transition-all flex items-center justify-center border border-transparent hover:border-slate-100">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
