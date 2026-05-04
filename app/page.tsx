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
  const [brand, setBrand] = useState<{ name: string; logo?: string }>({ name: 'Comet' });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const loadBrand = async () => {
      try {
        const res = await fetch('/api/settings/public');
        const result = await res.json();
        if (result.success) {
          setBrand({ name: result.data.APP_NAME || 'Comet', logo: result.data.APP_LOGO_URL || '' });
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
      <div className="absolute inset-0 bg-[#0a0e1a]" />
      
      {/* Mesh gradient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {mounted && Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/[0.04]"
            style={{
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${8 + Math.random() * 12}s linear infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* ─── Login Card ─── */}
      <div className={`relative z-10 w-full max-w-[420px] ${mounted ? 'animate-scale-in' : 'opacity-0'}`}>
        {/* Glow ring behind card */}
        <div className="absolute -inset-[1px] bg-gradient-to-br from-indigo-500/30 via-violet-500/20 to-cyan-500/30 rounded-3xl blur-sm" />

        <div className="relative bg-[#111827]/90 backdrop-blur-2xl rounded-3xl border border-white/[0.08] shadow-2xl shadow-indigo-500/10 p-8">
          {/* Brand */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center mb-4">
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={brand.logo} alt={brand.name} className="h-14 w-14 rounded-2xl object-contain bg-white/5" />
              ) : (
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-500/30">
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
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-white/[0.04]'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="identifier" className="block text-[12px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Email or Username
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail size={16} />
                </div>
                <input
                  type="text"
                  id="identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="you@company.com"
                  style={{ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.04)' }}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-[12px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  placeholder="••••••••"
                  style={{ color: '#ffffff', backgroundColor: 'rgba(255,255,255,0.04)' }}
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full group overflow-hidden rounded-xl py-3.5 font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {/* Button gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_100%] group-hover:animate-[shimmer_2s_linear_infinite] transition-all" />
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500" />
              
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
              <Sparkles size={11} />
              Powered by {brand.name} • Secure Login
            </p>
          </div>
        </div>
      </div>

      {/* ─── CSS for floating particles ─── */}
      <style jsx>{`
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
