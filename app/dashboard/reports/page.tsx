'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileDown, Sheet, Loader2, Trash2 } from 'lucide-react';
import { getPermissions } from '@/lib/permissions';
import { useSession } from 'next-auth/react';

interface Submission {
  _id: string;
  formId?: string;
  phoneNumber?: string;
  ipAddress?: string;
  submittedBy?: string;
  createdAt?: string;
  formData?: Record<string, any>;
}

interface UserOption {
  id: string;
  name: string;
  email?: string;
}

interface CampaignOption {
  id: string;
  name: string;
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const permissions = useMemo(() => {
    const role = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
    return role ? getPermissions(role, session?.user?.permissions || undefined) : null;
  }, [session]);
  const canView = !!permissions?.canViewSubmissions;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | 'pdf' | 'sheets' | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [users, setUsers] = useState<UserOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [userFilter, setUserFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const presets = [
    { label: 'Today', range: () => {
      const d = new Date();
      const iso = d.toISOString().slice(0,10);
      return { from: iso, to: iso };
    }},
    { label: 'Last 7 days', range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 6);
      return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) };
    }},
    { label: 'Last 30 days', range: () => {
      const to = new Date();
      const from = new Date();
      from.setDate(to.getDate() - 29);
      return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) };
    }},
    { label: 'This month', range: () => {
      const to = new Date();
      const from = new Date(to.getFullYear(), to.getMonth(), 1);
      return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) };
    }},
  ];

  useEffect(() => {
    if (!canView) {
      setError('Reports are restricted to Admins and Supervisors.');
      setLoading(false);
      return;
    }
    fetchFilters();
    fetchSubs();
  }, [canView]);

  const fetchFilters = async () => {
    try {
      const [usersRes, campaignsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/campaigns'),
      ]);
      const usersJson = await usersRes.json();
      const campaignsJson = await campaignsRes.json();
      if (usersJson?.success) {
        setUsers(
          (usersJson.data || []).map((u: any) => ({
            id: u._id,
            name: u.name,
            email: u.email,
          }))
        );
      }
      if (campaignsJson?.success) {
        setCampaigns(
          (campaignsJson.data || []).map((c: any) => ({
            id: c._id,
            name: c.name,
          }))
        );
      }
    } catch (err) {
      // ignore silently; filters are optional
      console.error('Failed to load filter options', err);
    }
  };

  const fetchSubs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '500' });
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
       if (userFilter) params.append('userId', userFilter);
       if (campaignFilter) params.append('campaignId', campaignFilter);
      const res = await fetch(`/api/submissions?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setSubmissions(result.data || []);
      } else {
        setError(result.error || 'Failed to load submissions');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm('Delete this submission? Choose where to delete from.')) return;
    
    const deleteFrom = prompt('Delete from:\n1. Portal Records only\n2. Google Sheets only\n3. Both\n\nEnter 1, 2, or 3:');
    if (!deleteFrom || !['1', '2', '3'].includes(deleteFrom)) return;

    const deleteMap: Record<string, string> = {
      '1': 'portal',
      '2': 'sheets',
      '3': 'both',
    };

    try {
      const res = await fetch(`/api/submissions/${submissionId}?deleteFrom=${deleteMap[deleteFrom]}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete submission');
      alert(json.message || 'Submission deleted successfully');
      fetchSubs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete submission');
    }
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf' | 'sheets') => {
    try {
      setExporting(format);
      if (format === 'sheets') {
        const params = new URLSearchParams();
        if (fromDate) params.append('from', fromDate);
        if (toDate) params.append('to', toDate);
        const res = await fetch(`/api/reports/export/sheets?${params.toString()}`, { method: 'POST' });
        const result = await res.json();
        if (!result.success) {
          setError(result.error || 'Sheets export failed');
        }
        return;
      }
      const params = new URLSearchParams({ format });
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      const res = await fetch(`/api/reports/export?${params.toString()}`);
      if (!res.ok) {
        setError('Export failed');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions.${format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  if (!canView) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Reports are restricted to Admins and Supervisors.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Reports</h1>
          <p className="text-gray-600">Export submissions as PDF, CSV, XLSX, or push to Google Sheets.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm font-medium text-slate-800">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm bg-white"
          />
          <label className="text-sm font-medium text-slate-800">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm bg-white"
          />
          <select
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm bg-white min-w-[160px]"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} {u.email ? `(${u.email})` : ''}
              </option>
            ))}
          </select>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm bg-white min-w-[160px]"
          >
            <option value="">All Campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={fetchSubs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            Apply
          </button>
          <div className="flex flex-wrap gap-1">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  const r = p.range();
                  setFromDate(r.from);
                  setToDate(r.to);
                  setTimeout(fetchSubs, 0);
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-400 transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton
            label="CSV"
            icon={<FileText size={16} />}
            onClick={() => handleExport('csv')}
            loading={exporting === 'csv'}
            color="bg-emerald-500 hover:bg-emerald-600 text-white"
          />
          <ExportButton
            label="XLSX"
            icon={<FileSpreadsheet size={16} />}
            onClick={() => handleExport('xlsx')}
            loading={exporting === 'xlsx'}
            color="bg-cyan-500 hover:bg-cyan-600 text-white"
          />
          <ExportButton
            label="PDF"
            icon={<FileDown size={16} />}
            onClick={() => handleExport('pdf')}
            loading={exporting === 'pdf'}
            color="bg-amber-500 hover:bg-amber-600 text-white"
          />
          <ExportButton
            label="Google Sheet"
            icon={<Sheet size={16} />}
            onClick={() => handleExport('sheets')}
            loading={exporting === 'sheets'}
            color="bg-sky-500 hover:bg-sky-600 text-white"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Submissions ({submissions.length})</h3>
          <button
            onClick={fetchSubs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {loading ? 'Loading' : 'Refresh'}
          </button>
        </div>
        <div className="overflow-auto">
          {loading ? (
            <div className="p-6 flex items-center gap-3 text-sm text-gray-600">
              <Loader2 size={18} className="animate-spin" />
              Loading submissions...
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-6 text-sm text-gray-600 flex items-center gap-3">
              <FileText size={18} className="text-slate-400" />
              No submissions yet.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-700 font-semibold">Date</th>
                  <th className="px-4 py-2 text-left text-slate-700 font-semibold">Phone</th>
                  <th className="px-4 py-2 text-left text-slate-700 font-semibold">Form ID</th>
                  <th className="px-4 py-2 text-left text-slate-700 font-semibold">IP</th>
                  <th className="px-4 py-2 text-left text-slate-700 font-semibold">User</th>
                  <th className="px-4 py-2 text-left text-slate-700 font-semibold">Data</th>
                  <th className="px-4 py-2 text-left text-slate-700 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s._id} className="border-t hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2 text-slate-700 whitespace-nowrap">
                      {(() => {
                        const { formatUSDateTime } = require('@/lib/dateFormat');
                        return formatUSDateTime(s.createdAt);
                      })()}
                    </td>
                    <td className="px-4 py-2 text-slate-700">{s.phoneNumber || '-'}</td>
                    <td className="px-4 py-2 text-slate-700">{s.formId || '-'}</td>
                    <td className="px-4 py-2 text-slate-700">{s.ipAddress || '-'}</td>
                    <td className="px-4 py-2 text-slate-700">{s.submittedBy || '-'}</td>
                    <td className="px-4 py-2 text-slate-700">
                      <pre className="whitespace-pre-wrap text-xs text-slate-600">
                        {JSON.stringify(s.formData || {}, null, 2)}
                      </pre>
                    </td>
                    <td className="px-4 py-2 text-slate-700">
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function ExportButton({
  label,
  icon,
  onClick,
  loading,
  color = 'bg-white/80 border border-slate-200 hover:bg-white text-slate-800',
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  loading: boolean;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md transition disabled:opacity-60 disabled:cursor-not-allowed ${color}`}
    >
      {icon}
      {loading ? 'Working...' : label}
    </button>
  );
}

