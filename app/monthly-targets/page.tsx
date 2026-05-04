'use client';

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { ShieldAlert, Target, ClipboardCheck, Users, Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { getPermissions } from '@/lib/permissions';

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
  note?: string;
  achieved?: number;
  bonus?: number;
  completion?: number;
}

interface UserOption {
  _id: string;
  name?: string;
  email?: string;
  username?: string;
  role: string;
}

interface BonusConfig {
  perSubmission: number;
  onTarget: number;
}

export default function MonthlyTargetsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
  const userPermOverrides = session?.user?.permissions;
  const permissions = userRole ? getPermissions(userRole, userPermOverrides || undefined) : null;

  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bonusConfig, setBonusConfig] = useState<BonusConfig>({ perSubmission: 0, onTarget: 0 });

  const [form, setForm] = useState<{ userId: string; period: string; target: string; note: string }>({
    userId: '',
    period: new Date().toISOString().slice(0, 7),
    target: '',
    note: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const isAllowed = permissions?.canManageUsers;

  useEffect(() => {
    if (!isAllowed) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [targetsRes, usersRes, settingsRes] = await Promise.all([
          fetch('/api/targets'),
          fetch('/api/users'),
          fetch('/api/settings'),
        ]);
        const targetsJson = await targetsRes.json();
        const usersJson = await usersRes.json();
        const settingsJson = await settingsRes.json();

        if (!targetsJson.success) throw new Error(targetsJson.error || 'Failed to load targets');
        if (!usersJson.success) throw new Error(usersJson.error || 'Failed to load users');

        setTargets(targetsJson.data || []);
        setUsers((usersJson.data || []).filter((u: any) => u.role !== 'Admin'));

        if (settingsJson?.success) {
          setBonusConfig({
            perSubmission: Number(settingsJson.data?.BONUS_PER_SUBMISSION || 0),
            onTarget: Number(settingsJson.data?.BONUS_TARGET_BONUS || 0),
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAllowed]);

  const handleSubmit = async () => {
    if (!form.userId || !form.period || !form.target) {
      setError('Please fill user, period, and target.');
      return;
    }
    const targetValue = Number(form.target);
    if (Number.isNaN(targetValue) || targetValue < 0) {
      setError('Target must be a positive number.');
      return;
    }

    try {
      setFormSaving(true);
      setError(null);
      const payload = {
        userId: form.userId,
        period: form.period,
        target: targetValue,
        note: form.note,
      };

      const res = await fetch(editingId ? `/api/targets/${editingId}` : '/api/targets', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save target');

      if (editingId) {
        setTargets(targets.map((t) => (t._id === editingId ? { ...t, ...json.data } : t)));
      } else {
        setTargets([json.data, ...targets]);
      }
      setEditingId(null);
      setForm({ userId: '', period: new Date().toISOString().slice(0, 7), target: '', note: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to save target');
    } finally {
      setFormSaving(false);
    }
  };

  const handleEdit = (row: TargetRow) => {
    setEditingId(row._id);
    setForm({
      userId: row.user?._id || '',
      period: row.period,
      target: String(row.target),
      note: row.note || '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this target?')) return;
    try {
      const res = await fetch(`/api/targets/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete');
      setTargets(targets.filter((t) => t._id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete target');
    }
  };

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/targets');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to refresh');
      setTargets(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh targets');
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (!targets.length) return { total: 0, achieved: 0, bonus: 0 };
    const total = targets.reduce((acc, t) => acc + (t.target || 0), 0);
    const achieved = targets.reduce((acc, t) => acc + (t.achieved || 0), 0);
    const bonus = targets.reduce((acc, t) => acc + (t.bonus || 0), 0);
    return { total, achieved, bonus };
  }, [targets]);

  if (!isAllowed) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          <ShieldAlert size={16} />
          <span>Only admins can manage monthly targets.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Target size={26} className="text-blue-600" />
            Monthly Targets
          </h1>
          <p className="text-gray-600">
            Assign and track targets for agents and supervisors. Bonus rules come from Settings.
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-emerald-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Assign target</h3>
              <p className="text-sm text-gray-600">Select a user, month, and target value.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select
                value={form.userId}
                onChange={(e) => setForm({ ...form, userId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black"
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name || u.username || u.email} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period (YYYY-MM)</label>
              <input
                type="month"
                value={form.period}
                onChange={(e) => setForm({ ...form, period: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target</label>
              <input
                type="number"
                min={0}
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="e.g. 50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="Short note"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={formSaving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {editingId ? <Pencil size={16} /> : <Plus size={16} />}
              {formSaving ? 'Saving...' : editingId ? 'Update Target' : 'Create Target'}
            </button>
            {editingId && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setForm({ userId: '', period: new Date().toISOString().slice(0, 7), target: '', note: '' });
                }}
                className="text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel edit
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardCheck size={18} className="text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Overview</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            Bonus per submission: {bonusConfig.perSubmission.toLocaleString()} | Bonus on target: {bonusConfig.onTarget.toLocaleString()}
          </p>
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Total target</span>
              <span>{summary.total}</span>
            </div>
            <div className="flex justify-between">
              <span>Total achieved</span>
              <span>{summary.achieved}</span>
            </div>
            <div className="flex justify-between">
              <span>Projected bonus</span>
              <span>Rs {summary.bonus.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Assignments</h3>
            <p className="text-sm text-gray-600">Live progress is based on submissions for each user.</p>
          </div>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Progress</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {targets.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-800">
                    <div className="font-medium">{t.user?.name || t.user?.username || t.user?.email || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{t.user?.role}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">{t.period}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{t.target}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{t.achieved ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">Rs {(t.bonus ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-blue-500"
                          style={{ width: `${Math.min(100, t.completion ?? 0)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600">{Math.min(100, t.completion ?? 0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-800">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(t)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(t._id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!targets.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                    {loading ? 'Loading targets...' : 'No targets yet. Create one to get started.'}
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

