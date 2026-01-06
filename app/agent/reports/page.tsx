'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';

interface SubmissionRow {
  _id: string;
  createdAt: string;
  formId: string;
  phoneNumber?: string;
  formData?: Record<string, any>;
  customerName?: string; // Extracted customer name for easy display
}

export default function AgentReportsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/submissions/self?limit=300');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load');
      setSubmissions(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const metrics = useMemo(() => {
    const total = submissions.length;
    const last = submissions[0]?.createdAt ? new Date(submissions[0].createdAt) : null;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const last7 = submissions.filter((s) => new Date(s.createdAt) >= weekAgo).length;
    return {
      total,
      last,
      last7,
    };
  }, [submissions]);

  const formatDate = (value: string) => {
    const { formatUSDateTime } = require('@/lib/dateFormat');
    return formatUSDateTime(value);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={22} className="text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>
      <p className="text-gray-600">Only your submissions are shown here. For privacy, only customer names are visible.</p>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <p className="text-xs text-slate-500">Total submissions</p>
          <p className="text-3xl font-semibold text-gray-900">{metrics.total}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <p className="text-xs text-slate-500">Last 7 days</p>
          <p className="text-3xl font-semibold text-gray-900">{metrics.last7}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
          <p className="text-xs text-slate-500">Last submission</p>
          <p className="text-base font-medium text-gray-900">
            {(() => {
              const { formatUSDateTime } = require('@/lib/dateFormat');
              return metrics.last ? formatUSDateTime(metrics.last) : 'No submissions yet';
            })()}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent submissions</h3>
          <p className="text-sm text-gray-600">Limited to your user account.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Form</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Customer Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((s) => {
                const customerName = s.customerName || 
                  (s.formData && Object.values(s.formData)[0] ? String(Object.values(s.formData)[0]) : null) ||
                  '—';
                return (
                  <tr key={s._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm text-slate-800">{formatDate(s.createdAt)}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">{s.formId}</td>
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                      {customerName !== '—' ? customerName : <span className="text-slate-400">No name available</span>}
                    </td>
                  </tr>
                );
              })}
              {!submissions.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    {loading ? 'Loading submissions...' : 'No submissions found.'}
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

