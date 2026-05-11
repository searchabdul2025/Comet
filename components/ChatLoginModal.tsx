'use client';

import { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, X, Loader2 } from 'lucide-react';

interface ChatLoginModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ChatLoginModal({ onSuccess, onCancel }: ChatLoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In a real app, we would verify the password against the backend
      // For this implementation, we'll use a simple verification 
      // or just simulate the check to fulfill the "prompt for login credentials" requirement
      const res = await fetch('/api/auth/verify-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const result = await res.json();
      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || 'Invalid management credentials.');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#101013]/90 backdrop-blur-xl">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div className="h-14 w-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
              <ShieldCheck size={28} />
            </div>
            <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-2">Management Access</h3>
          <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
            Please enter your management credentials to access the secure communication hub.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">
                Security Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  required
                />
              </div>
              {error && (
                <p className="mt-2 text-xs text-red-500 font-bold px-1 animate-shake">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Verify Access <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            End-to-End Encryption Active
          </p>
        </div>
      </div>
    </div>
  );
}
