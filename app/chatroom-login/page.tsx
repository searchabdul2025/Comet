'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, MessageSquare, Loader2 } from 'lucide-react';

function ChatroomLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatroomId = searchParams.get('id');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chatroomInfo, setChatroomInfo] = useState<{ name?: string; description?: string } | null>(null);

  useEffect(() => {
    if (chatroomId) {
      fetchChatroomInfo();
    }
  }, [chatroomId]);

  const fetchChatroomInfo = async () => {
    try {
      const res = await fetch(`/api/chatrooms/${chatroomId}`);
      const json = await res.json();
      if (json.success) {
        setChatroomInfo(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch chatroom info:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!chatroomId) {
        setError('Chatroom ID is required');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/chatrooms/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatroomId,
          username,
          password,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Redirect to chatroom chat page
      router.push(`/chatroom/${chatroomId}`);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  if (!chatroomId) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-center">
            <MessageSquare size={48} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Chatroom</h1>
            <p className="text-gray-600">Chatroom ID is missing. Please use a valid chatroom link.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <MessageSquare size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {chatroomInfo?.name || 'Chatroom Login'}
          </h1>
          {chatroomInfo?.description && (
            <p className="text-sm text-gray-600">{chatroomInfo.description}</p>
          )}
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn size={18} />
                Login to Chatroom
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-xs text-center text-gray-500">
          Contact your administrator for login credentials
        </p>
      </div>
    </div>
  );
}

export default function ChatroomLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ChatroomLoginContent />
    </Suspense>
  );
}

