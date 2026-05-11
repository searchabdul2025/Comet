'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'supervisor' | 'user'>('admin');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
            logo: result.data.APP_LOGO_URL || '/logo.svg',
          });
        }
      } catch {
        // use defaults
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
        setError('Incorrect email or password. Please try again.');
        setLoading(false);
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const roles = [
    { key: 'admin' as const, label: 'Admin' },
    { key: 'supervisor' as const, label: 'Supervisor' },
    { key: 'user' as const, label: 'Agent' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4" style={{ background: '#0C0C0F' }}>

      {/* ── Ambient blobs ── */}
      <div
        className="pointer-events-none absolute"
        style={{
          top: '-15%', left: '-10%',
          width: 640, height: 640,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,168,67,0.13) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'blobDrift1 12s ease-in-out infinite',
        }}
      />
      <div
        className="pointer-events-none absolute"
        style={{
          bottom: '-15%', right: '-10%',
          width: 560, height: 560,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(184,146,58,0.10) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'blobDrift2 16s ease-in-out infinite',
        }}
      />

      {/* ── Subtle dot grid ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(212,168,67,0.07) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          opacity: 0.6,
        }}
      />

      {/* ── Card ── */}
      <div
        className="relative z-10 w-full"
        style={{ maxWidth: 420, opacity: mounted ? 1 : 0, transform: mounted ? 'scale(1)' : 'scale(0.94)', transition: 'opacity 0.4s ease, transform 0.4s ease' }}
      >
        {/* Glow border */}
        <div
          className="absolute -inset-px rounded-[28px]"
          style={{ background: 'linear-gradient(135deg, rgba(212,168,67,0.35), rgba(184,146,58,0.15), rgba(212,168,67,0.30))', filter: 'blur(1px)' }}
        />

        <div
          className="relative rounded-[28px] p-8"
          style={{
            background: 'rgba(20,20,26,0.92)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(212,168,67,0.08) inset',
          }}
        >
          {/* ── Brand header ── */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-5">
              {brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo}
                  alt={brand.name}
                  style={{
                    width: 64, height: 64,
                    borderRadius: 18,
                    objectFit: 'contain',
                    background: 'rgba(255,255,255,0.05)',
                    boxShadow: '0 0 0 1px rgba(212,168,67,0.2), 0 8px 32px rgba(212,168,67,0.18)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64, height: 64,
                    borderRadius: 18,
                    background: 'linear-gradient(135deg, #D4A843, #B8923A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#0C0C0F', fontSize: 22, fontWeight: 800,
                    boxShadow: '0 0 0 1px rgba(212,168,67,0.3), 0 8px 32px rgba(212,168,67,0.3)',
                  }}
                >
                  {brand.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px', marginBottom: 4 }}>
              {brand.name}
            </h1>
            <p style={{ color: '#7a7a8a', fontSize: 13.5, fontWeight: 400 }}>
              Welcome back — sign in to continue
            </p>
          </div>

          {/* ── Role selector ── */}
          <div
            className="flex gap-1.5 mb-7 p-1 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
          >
            {roles.map((role) => (
              <button
                key={role.key}
                type="button"
                onClick={() => handleRoleSelect(role.key)}
                style={{
                  flex: 1,
                  padding: '9px 0',
                  borderRadius: 12,
                  fontSize: 12.5,
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  border: 'none',
                  ...(selectedRole === role.key
                    ? {
                        background: 'linear-gradient(135deg, #D4A843, #B8923A)',
                        color: '#0C0C0F',
                        boxShadow: '0 4px 14px rgba(212,168,67,0.3)',
                      }
                    : {
                        background: 'transparent',
                        color: '#6b6b7a',
                      }),
                }}
              >
                {role.label}
              </button>
            ))}
          </div>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Email / Username */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
                Email or Username
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={selectedRole === 'admin' ? 'admin@yourcompany.com' : 'Your email or username'}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(212,168,67,0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(212,168,67,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  style={{
                    width: '100%',
                    padding: '12px 46px 12px 16px',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'rgba(212,168,67,0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(212,168,67,0.08)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#4a4a5a', padding: 2, display: 'flex', alignItems: 'center',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#D4A843')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#4a4a5a')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 14px',
                  borderRadius: 12,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  animation: 'shakeX 0.4s ease',
                }}
              >
                <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: '#ef4444' }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                width: '100%',
                padding: '14px',
                borderRadius: 14,
                background: loading
                  ? 'rgba(212,168,67,0.5)'
                  : 'linear-gradient(135deg, #D4A843 0%, #B8923A 100%)',
                color: '#0C0C0F',
                fontSize: 13.5,
                fontWeight: 700,
                letterSpacing: '0.04em',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: loading ? 'none' : '0 6px 24px rgba(212,168,67,0.3)',
                transform: 'scale(1)',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'scale(1.015)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(212,168,67,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = loading ? 'none' : '0 6px 24px rgba(212,168,67,0.3)';
              }}
              onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
              onMouseUp={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.015)'; }}
            >
              {loading ? (
                <div
                  style={{
                    width: 18, height: 18,
                    border: '2px solid rgba(12,12,15,0.25)',
                    borderTopColor: '#0C0C0F',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* ── Footer ── */}
          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e', animation: 'pulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#3a3a4a', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Global keyframes ── */}
      <style>{`
        @keyframes blobDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(40px, -30px) scale(1.05); }
          66%       { transform: translate(-20px, 20px) scale(0.97); }
        }
        @keyframes blobDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(-30px, 20px) scale(1.04); }
          70%       { transform: translate(20px, -15px) scale(0.98); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shakeX {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-6px); }
          40%       { transform: translateX(6px); }
          60%       { transform: translateX(-4px); }
          80%       { transform: translateX(4px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
