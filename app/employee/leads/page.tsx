'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Check, X } from 'lucide-react';

interface Lead {
  _id: string;
  customerName: string;
  phone?: string;
  meetingDate?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approvals: Array<{ role: 'Supervisor' | 'Admin'; decision: 'approved' | 'rejected'; note?: string; decidedAt: string }>;
  createdAt: string;
}

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [workingId, setWorkingId] = useState('');
  const isSupervisor = session?.user?.role === 'Supervisor';
  const isAdmin = session?.user?.role === 'Admin';

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/employee/leads');
      const result = await res.json();
      if (result.success) {
        setLeads(result.data || []);
        setError('');
      } else {
        setError(result.error || 'Failed to load leads');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const approve = async (id: string, decision: 'approved' | 'rejected') => {
    const note = decision === 'rejected' ? prompt('Enter rejection note') : '';
    if (decision === 'rejected' && !note) return;
    try {
      setWorkingId(id);
      const res = await fetch(`/api/employee/leads/${id}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, note }),
      });
      const result = await res.json();
      if (result.success) {
        setLeads((prev) => prev.map((l) => (l._id === id ? result.data : l)));
      } else {
        setError(result.error || 'Failed to update lead');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update lead');
    } finally {
      setWorkingId('');
    }
  };

  const canApprove = isSupervisor || isAdmin;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Lead Approvals</h1>
        <p className="text-gray-600">Auto/manual leads generated from the major form.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 text-gray-600 text-sm">Loading...</div>
        ) : leads.length === 0 ? (
          <div className="p-4 text-gray-600 text-sm">No leads yet.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left text-slate-600">Customer</th>
                <th className="px-4 py-2 text-left text-slate-600">Phone</th>
                <th className="px-4 py-2 text-left text-slate-600">Meeting Date</th>
                <th className="px-4 py-2 text-left text-slate-600">Status</th>
                <th className="px-4 py-2 text-left text-slate-600">Approvals</th>
                {canApprove && <th className="px-4 py-2 text-left text-slate-600">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead._id} className="border-t">
                  <td className="px-4 py-2 text-slate-800">{lead.customerName}</td>
                  <td className="px-4 py-2 text-slate-800">{lead.phone || '-'}</td>
                  <td className="px-4 py-2 text-slate-800">{lead.meetingDate || '-'}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        lead.status === 'Pending'
                          ? 'bg-amber-100 text-amber-800'
                          : lead.status === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {lead.approvals?.length ? (
                      <div className="space-y-1">
                        {lead.approvals.map((a, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-semibold">{a.role}</span>: {a.decision}
                            {a.note ? ` (${a.note})` : ''}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No approvals yet</span>
                    )}
                  </td>
                  {canApprove && (
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          disabled={workingId === lead._id}
                          onClick={() => approve(lead._id, 'approved')}
                          className="px-3 py-1 rounded-md bg-emerald-600 text-white text-xs hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <Check size={14} className="inline mr-1" />
                          Approve
                        </button>
                        <button
                          disabled={workingId === lead._id}
                          onClick={() => approve(lead._id, 'rejected')}
                          className="px-3 py-1 rounded-md bg-red-100 text-red-700 text-xs hover:bg-red-200 disabled:opacity-50"
                        >
                          <X size={14} className="inline mr-1" />
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

