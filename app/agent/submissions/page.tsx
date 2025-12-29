'use client';

import { useEffect, useState, useMemo } from 'react';
import { RefreshCw, Calendar, FileText, Search } from 'lucide-react';

interface SubmissionRow {
  _id: string;
  createdAt: string;
  formId: {
    _id: string;
    fields?: Array<{ id: string; name: string; type: string }>;
  } | string;
  phoneNumber?: string;
  formData?: Record<string, any>;
}

export default function AgentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const res = await fetch(`/api/submissions/self?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load submissions');
      setSubmissions(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (value: string) => {
    const { formatUSDateTime } = require('@/lib/dateFormat');
    return formatUSDateTime(value);
  };

  // Filter submissions based on search query
  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    
    const query = searchQuery.toLowerCase();
    return submissions.filter(submission => {
      // Search in phone number
      if (submission.phoneNumber?.toLowerCase().includes(query)) return true;
      
      // Search in form data values
      if (submission.formData) {
        const formDataStr = JSON.stringify(submission.formData).toLowerCase();
        if (formDataStr.includes(query)) return true;
      }
      
      // Search in form ID
      const formIdStr = typeof submission.formId === 'string' 
        ? submission.formId 
        : submission.formId?._id || '';
      if (formIdStr.toLowerCase().includes(query)) return true;
      
      return false;
    });
  }, [submissions, searchQuery]);

  // Helper to get field name from field ID
  const getFieldName = (submission: SubmissionRow, fieldId: string): string => {
    if (typeof submission.formId === 'object' && submission.formId?.fields) {
      const field = submission.formId.fields.find(f => f.id === fieldId);
      return field?.name || fieldId;
    }
    return fieldId;
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={26} className="text-blue-600" />
            My Submissions
          </h1>
          <p className="text-gray-600">Filter your submissions and see what counts toward your targets.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar size={14} />
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-black bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Calendar size={14} />
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-black bg-white"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              Apply filter
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            <Search size={14} />
            Search
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by phone, form data, or form ID..."
            className="w-full px-3 py-2 border border-slate-200 rounded-md text-black bg-white"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent submissions</h3>
            <p className="text-sm text-gray-600">
              Limited to your user account.
              {searchQuery && ` Showing ${filteredSubmissions.length} of ${submissions.length} results`}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Form</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Form Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-800">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">
                    {typeof s.formId === 'string' ? s.formId : s.formId?._id || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">{s.phoneNumber || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">
                    {s.formData && Object.keys(s.formData).length > 0 ? (
                      <div className="space-y-1">
                        {Object.entries(s.formData).map(([fieldId, value]) => (
                          <div key={fieldId} className="text-xs">
                            <span className="font-medium text-slate-700">
                              {getFieldName(s, fieldId)}:
                            </span>{' '}
                            <span className="text-slate-600">{String(value || '—')}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">No data</span>
                    )}
                  </td>
                </tr>
              ))}
              {!filteredSubmissions.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-slate-500">
                    {loading ? 'Loading submissions...' : searchQuery ? 'No submissions match your search.' : 'No submissions found.'}
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

