'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'supervisor' | 'user'>('admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [brand, setBrand] = useState<{ name: string; logo?: string }>({ name: 'Comet', logo: '/logo.svg' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadBrand = async () => {
      try {
        const res = await fetch('/api/settings/public');
        const result = await res.json();
        if (result.success) {
          setBrand({ 
            name: result.data.APP_NAME || 'Comet', 
            logo: result.data.APP_LOGO_URL || '/logo.svg' 
          });
        }
      } catch {
        // ignore
      }
    };
    loadBrand();
  }, []);

  const handleRoleSelect = (role: 'admin' | 'supervisor' | 'user') => {
    setSelectedRole(role);
    setIdentifier('');
    setPassword('');
    setError('');
  };

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
        setError('Invalid email or password');
        setLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const roles = [
    { key: 'admin' as const, label: 'Admin', desc: 'Full access' },
    { key: 'supervisor' as const, label: 'Supervisor', desc: 'Team lead' },
    { key: 'user' as const, label: 'Agent', desc: 'Field work' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      {/* ─── Animated Background ─── */}
      <div className="absolute inset-0 bg-[#101013]" />
      
      {/* Mesh gradient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#D4A843]/10 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#B8923A]/10 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(212,168,67,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      <div className={`relative z-10 w-full max-w-[420px] ${mounted ? 'animate-scale-in' : 'opacity-0'}`}>
        {/* Glow ring behind card */}
        <div className="absolute -inset-[1px] bg-gradient-to-br from-[#D4A843]/30 via-[#B8923A]/20 to-[#D4A843]/30 rounded-3xl blur-sm" />

        <div className="relative bg-[#1A1A1F]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-[#D4A843]/10 p-8">
          {/* Brand */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center mb-4">
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo} alt={brand.name} className="h-14 w-14 rounded-2xl object-contain bg-white/5" />
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#D4A843] to-[#B8923A] flex items-center justify-center text-[#101013] text-xl font-bold shadow-lg shadow-[#D4A843]/30">
                  {brand.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">{brand.name}</h1>
            <p className="text-sm text-slate-400 mt-1">Sign in to your workspace</p>
          </div>

          {/* Role Tabs */}
          <div className="flex gap-1.5 p-1 bg-white/[0.04] rounded-xl mb-6 border border-white/[0.06]">
            {roles.map((role) => (
              <button
                key={role.key}
                type="button"
                onClick={() => handleRoleSelect(role.key)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  selectedRole === role.key
                    ? 'bg-gradient-to-r from-[#D4A843] to-[#B8923A] text-[#101013] shadow-lg shadow-[#D4A843]/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Secure Identifier</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#D4A843] transition-colors">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#D4A843]/20 focus:border-[#D4A843] transition-all"
                  placeholder={selectedRole === 'admin' ? 'admin@comet.com' : 'employee-id'}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Access Token</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#D4A843] transition-colors">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-[#D4A843]/20 focus:border-[#D4A843] transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2.5 animate-shake">
                <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-gradient-to-r from-[#D4A843] to-[#B8923A] text-[#101013] rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-[#D4A843]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-[#101013]/30 border-t-[#101013] rounded-full animate-spin" />
              ) : (
                <>
                  Authenticate
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            Comet Management System v4.0
          </p>
        </div>
      </div>
    </div>
  );
}
