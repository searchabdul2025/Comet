'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';
import { Gift, RefreshCw, Settings, Target } from 'lucide-react';
import Link from 'next/link';

interface TargetRow {
  _id: string;
  user: {
    _id: string;
    name?: string;
    email?: string;
    username?: string;
    role?: string;
  };
  period: string;
  target: number;
  achieved?: number;
  bonus?: number;
}

export default function BonusesPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
  const userPermOverrides = session?.user?.permissions;
  const permissions = userRole ? getPermissions(userRole, userPermOverrides || undefined) : null;
  const isAllowed = permissions?.canManageUsers;

  const [rows, setRows] = useState<TargetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/targets');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load bonuses');
      setRows(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bonuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAllowed) load();
  }, [isAllowed]);

  if (!isAllowed) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          Only admins can view bonuses.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Gift size={26} className="text-amber-500" />
            Bonuses
          </h1>
          <p className="text-gray-600">Bonuses are calculated from targets and the rules in Settings.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/settings#bonus"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            <Settings size={16} />
            New bonus rule
          </Link>
          <Link
            href="/monthly-targets"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            <Target size={16} />
            Manage targets
          </Link>
          <button
            onClick={load}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-gray-900">Bonuses by user</h3>
          <p className="text-sm text-gray-600">Live values based on submissions and targets.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Achieved</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Bonus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-800">
                    <div className="font-medium">{r.user?.name || r.user?.username || r.user?.email || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{r.user?.role}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">{r.period}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{r.target}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{r.achieved ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">${(r.bonus ?? 0).toLocaleString()}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    {loading ? 'Loading bonuses...' : 'No data yet. Create targets to see bonuses.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useSession } from 'next-auth/react';
import { Gift, ShieldAlert, Plus, Trophy } from 'lucide-react';

export default function BonusesPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const isAllowed = role === 'Admin';

  if (!isAllowed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          <ShieldAlert size={16} />
          <span>Only admins can manage bonuses.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Gift size={26} className="text-amber-600" />
            Bonuses
          </h1>
          <p className="text-gray-600">Configure and award bonuses to agents and supervisors.</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition">
          <Plus size={16} />
          New Bonus
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Create bonus</h3>
          <p className="text-sm text-gray-600">
            Placeholder: add your bonus creation form here (amount, criteria, recipients).
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Trophy size={16} className="text-amber-600" />
            Bonus history
          </h3>
          <p className="text-sm text-gray-600">
            Placeholder: list recent bonuses awarded to agents/supervisors with status.
          </p>
        </div>
      </div>
    </div>
  );
}

