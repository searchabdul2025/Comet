'use client';

import { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileDown, Sheet } from 'lucide-react';
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

export default function ReportsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'Admin';
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | 'pdf' | 'sheets' | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setError('Reports are restricted to Admins.');
      setLoading(false);
      return;
    }
    fetchSubs();
  }, [isAdmin]);

  const fetchSubs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/submissions?limit=500');
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

  const handleExport = async (format: 'csv' | 'xlsx' | 'pdf' | 'sheets') => {
    try {
      setExporting(format);
      if (format === 'sheets') {
        const res = await fetch('/api/reports/export/sheets', { method: 'POST' });
        const result = await res.json();
        if (!result.success) {
          setError(result.error || 'Sheets export failed');
        }
        return;
      }
      const res = await fetch(`/api/reports/export?format=${format}`);
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

  if (!isAdmin) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Reports are restricted to Admin users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Reports</h1>
          <p className="text-gray-600">Export submissions as PDF, CSV, XLSX, or push to Google Sheets.</p>
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
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200 transition"
          >
            <Download size={14} />
            Refresh
          </button>
        </div>
        <div className="overflow-auto">
          {loading ? (
            <div className="p-4 text-sm text-gray-500">Loading submissions...</div>
          ) : submissions.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No submissions yet.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-slate-600">Date</th>
                  <th className="px-4 py-2 text-left text-slate-600">Phone</th>
                  <th className="px-4 py-2 text-left text-slate-600">Form ID</th>
                  <th className="px-4 py-2 text-left text-slate-600">IP</th>
                  <th className="px-4 py-2 text-left text-slate-600">User</th>
                  <th className="px-4 py-2 text-left text-slate-600">Data</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr key={s._id} className="border-t">
                    <td className="px-4 py-2 text-slate-700">
                      {s.createdAt ? new Date(s.createdAt).toLocaleString() : '-'}
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

