'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'supervisor' | 'user'>('admin');
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roleCredentials = {
    admin: { email: 'admin@cometportal.com', password: 'admin123' },
    supervisor: { email: 'supervisor@cometportal.com', password: 'supervisor123' },
    user: { email: 'user@cometportal.com', password: 'user123' },
  };

  const handleRoleSelect = (role: 'admin' | 'supervisor' | 'user') => {
    setSelectedRole(role);
    setEmail(roleCredentials[role].email);
    setPassword(roleCredentials[role].password);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/40">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white flex items-center justify-center font-bold text-lg">
            PO
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portal</h1>
            <p className="text-sm text-gray-500">Sign in to your account</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-3">Quick Fill (optional)</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleRoleSelect('admin')}
              className={`flex-1 py-2 px-4 rounded-lg border ${
                selectedRole === 'admin'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
              } transition-colors`}
            >
              Admin
            </button>
            <button
              onClick={() => handleRoleSelect('supervisor')}
              className={`flex-1 py-2 px-4 rounded-lg border ${
                selectedRole === 'supervisor'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
              } transition-colors`}
            >
              Supervisor
            </button>
            <button
              onClick={() => handleRoleSelect('user')}
              className={`flex-1 py-2 px-4 rounded-lg border ${
                selectedRole === 'user'
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
              } transition-colors`}
            >
              User
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
              Email or Username
            </label>
            <input
              type="text"
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-black bg-white"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 text-black bg-white"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 rounded-lg font-medium shadow hover:shadow-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
