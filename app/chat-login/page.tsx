'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, ArrowRight, AlertCircle, MessageSquare, ShieldCheck, Loader2 } from 'lucide-react';

function ChatLoginContent() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState({ name: 'Comet Chat', logo: '/logo.svg' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadBrand = async () => {
      try {
        const res = await fetch('/api/settings/public');
        const result = await res.json();
        if (result.success) {
          setBrand({
            name: (result.data.APP_NAME || 'Comet') + ' Chat',
            logo: result.data.APP_LOGO_URL || '/logo.svg',
          });
        }
      } catch {
        // use defaults
      }
    };
    loadBrand();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid credentials. Please check your Agent ID and password.');
        setLoading(false);
      } else {
        router.push('/chat');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{ background: '#0C0C0F' }}>
      
      {/* ── Ambient blobs ── */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '-10%', right: '-5%',
          width: 500, height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'blobDrift1 15s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: '-10%', left: '-5%',
          width: 450, height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'blobDrift2 18s ease-in-out infinite',
        }}
      />

      {/* ── Subtle grid ── */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      <div 
        className="relative z-10 w-full max-w-[440px] transition-all duration-700"
        style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)' }}
      >
        <div 
          className="bg-[#14141A]/90 backdrop-blur-2xl border border-white/5 rounded-[32px] p-10 shadow-2xl shadow-black/50"
          style={{ boxShadow: '0 0 0 1px rgba(212,168,67,0.05) inset' }}
        >
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4A843] to-[#B8923A] mb-6 shadow-xl shadow-[#D4A843]/20">
              <MessageSquare size={32} className="text-[#0C0C0F]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Agent Communication Portal</h1>
            <p className="text-slate-400 text-sm">Secure access for authorized personnel only.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Agent ID / Username</label>
              <div className="relative group">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter your Agent ID"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 focus:ring-4 focus:ring-[#D4A843]/5 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Security Password</label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-[#D4A843]/50 focus:ring-4 focus:ring-[#D4A843]/5 transition-all placeholder:text-slate-600 pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#D4A843] transition-colors p-2"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-red-400 text-xs animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4A843] to-[#B8923A] py-4 rounded-2xl text-[#0C0C0F] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-[#D4A843]/10 hover:shadow-[#D4A843]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 mt-4"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Secure Login
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-10 flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-tighter">System Shield Active</span>
             </div>
             <p className="text-[10px] text-slate-500 text-center leading-relaxed">
               By logging in, you agree to our internal communication protocols.<br/>Unauthorized access is strictly monitored.
             </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
           <button 
             onClick={() => window.location.href = 'https://cometbpo.org'}
             className="text-[11px] font-bold text-slate-500 hover:text-[#D4A843] transition-colors uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
           >
              Return to Main Portal
           </button>
        </div>
      </div>

      <style>{`
        @keyframes blobDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-30px, 40px) scale(1.1); }
        }
        @keyframes blobDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(40px, -20px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}

export default function ChatLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0C0C0F] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4A843]" size={32} />
      </div>
    }>
      <ChatLoginContent />
    </Suspense>
  );
}
