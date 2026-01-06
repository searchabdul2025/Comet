'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle2, XCircle, Clock, DollarSign, FileText, Loader2 } from 'lucide-react';
import { formatUSDateTime } from '@/lib/dateFormat';

interface SalesApproval {
  _id: string;
  agent: {
    _id: string;
    name?: string;
    email?: string;
  };
  submission: {
    _id: string;
    formId?: string;
    phoneNumber?: string;
    formData?: Record<string, any>;
    createdAt?: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'unpaid';
  amount?: number;
  comments?: string;
  reviewedBy?: {
    _id: string;
    name?: string;
    email?: string;
  };
  reviewedAt?: string;
  createdAt?: string;
}

export default function AgentSalesApprovalsPage() {
  const { data: session } = useSession();
  const [approvals, setApprovals] = useState<SalesApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadApprovals();
  }, [statusFilter]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await fetch(`/api/sales-approvals?${params.toString()}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load sales approvals');
      setApprovals(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales approvals');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 size={16} className="text-green-600" />;
      case 'rejected':
        return <XCircle size={16} className="text-red-600" />;
      case 'paid':
        return <DollarSign size={16} className="text-emerald-600" />;
      case 'unpaid':
        return <Clock size={16} className="text-amber-600" />;
      default:
        return <Clock size={16} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'paid':
        return 'bg-emerald-100 text-emerald-800';
      case 'unpaid':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusCounts = {
    pending: approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
    paid: approvals.filter(a => a.status === 'paid').length,
    unpaid: approvals.filter(a => a.status === 'unpaid').length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FileText size={26} className="text-blue-500" />
          My Sales Approvals
        </h1>
        <p className="text-gray-600">View and track the status of your sales submissions.</p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-gray-900">{statusCounts.pending}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Approved</div>
          <div className="text-2xl font-bold text-green-600">{statusCounts.approved}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Rejected</div>
          <div className="text-2xl font-bold text-red-600">{statusCounts.rejected}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Paid</div>
          <div className="text-2xl font-bold text-emerald-600">{statusCounts.paid}</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm text-gray-600">Unpaid</div>
          <div className="text-2xl font-bold text-amber-600">{statusCounts.unpaid}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Approvals Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Comments</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Reviewed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center">
                    <Loader2 size={20} className="animate-spin mx-auto text-gray-400" />
                  </td>
                </tr>
              ) : approvals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-gray-500">
                    No sales approvals found.
                  </td>
                </tr>
              ) : (
                approvals.map((approval) => (
                  <tr key={approval._id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {approval.submission?.createdAt ? formatUSDateTime(approval.submission.createdAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      {approval.submission?.phoneNumber || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800 font-medium">
                      {approval.amount ? `Rs ${approval.amount.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(approval.status)}`}>
                        {getStatusIcon(approval.status)}
                        {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {approval.comments || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {approval.reviewedAt ? (
                        <div>
                          <div>{formatUSDateTime(approval.reviewedAt)}</div>
                          {approval.reviewedBy && (
                            <div className="text-xs text-gray-500">
                              by {approval.reviewedBy.name || approval.reviewedBy.email}
                            </div>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

