'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Achievement {
  _id: string;
  month: string;
  targets?: number;
  achieved?: number;
  remaining?: number;
  revenue?: number;
  bonuses?: number;
  dealsClosed?: number;
  dealsRejected?: number;
  notes?: string;
}

export default function AchievementsPage() {
  const { data: session } = useSession();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [form, setForm] = useState<Partial<Achievement>>({});
  const [list, setList] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const isAdmin = session?.user?.role === 'Admin';
  const isSupervisor = session?.user?.role === 'Supervisor';

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('month', month);
      const res = await fetch(`/api/employee/achievements?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setList(result.data || []);
        if (result.data?.[0]) setForm(result.data[0]);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to load achievements' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load achievements' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [month]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const payload = { ...form, month };
      const res = await fetch('/api/employee/achievements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Saved' });
        fetchData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Save failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  const numberField = (key: keyof Achievement, label: string) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="number"
        value={(form as any)[key] ?? ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value === '' ? undefined : Number(e.target.value) })}
        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Monthly Achievements</h1>
        <p className="text-gray-600">Track targets and outcomes. Month-scoped entries per employee.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex gap-3 items-center flex-wrap">
          <label className="text-sm text-slate-700">Month</label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {(isAdmin || isSupervisor) && (
            <span className="text-xs text-slate-500">
              Viewing all by month; add filters later if needed.
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {numberField('targets', 'Targets')}
          {numberField('achieved', 'Achieved till now')}
          {numberField('remaining', 'Remaining')}
          {numberField('revenue', 'Revenue')}
          {numberField('bonuses', 'Bonuses')}
          {numberField('dealsClosed', 'Deals closed')}
          {numberField('dealsRejected', 'Deals rejected')}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes ?? ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white resize-y"
            rows={3}
          />
        </div>
        {message && (
          <div
            className={`rounded-md px-3 py-2 text-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Month'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">History ({list.length})</h2>
          <button onClick={fetchData} className="text-sm text-blue-600 hover:text-blue-700">Refresh</button>
        </div>
        {loading ? (
          <div className="p-4 text-gray-600 text-sm">Loading...</div>
        ) : list.length === 0 ? (
          <div className="p-4 text-gray-600 text-sm">No records yet.</div>
        ) : (
          <div className="divide-y">
            {list.map((row) => (
              <div key={row._id} className="p-4 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900">{row.month}</span>
                  <span className="text-xs text-slate-500">Targets {row.targets ?? '-'} | Achieved {row.achieved ?? '-'}</span>
                </div>
                <div className="text-xs text-slate-600">
                  Revenue: {row.revenue ?? '-'} | Bonuses: {row.bonuses ?? '-'} | Deals closed: {row.dealsClosed ?? '-'} | Rejected: {row.dealsRejected ?? '-'}
                </div>
                {row.notes && <div className="text-sm text-slate-700">Notes: {row.notes}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

