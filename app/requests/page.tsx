'use client';

import { useEffect, useState } from 'react';
import { Check, X, Loader2, RefreshCcw } from 'lucide-react';

interface Request {
  id: string;
  type: string;
  details: string;
  title?: string;
  name?: string;
  description?: string;
  message?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt?: string;
  requester?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  reviewedBy?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  reviewedAt?: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newType, setNewType] = useState('');
  const [newDetails, setNewDetails] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/requests');
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to load requests');
      }
      setRequests(result.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      if (status === 'Rejected' && !confirm('Are you sure you want to reject this request?')) {
        return;
      }
      setActionId(id);
      setError('');
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Update failed');
      }
      setRequests((prev) => prev.map((r) => (r.id === id ? result.data : r)));
    } catch (err: any) {
      setError(err.message || 'Failed to update request');
    } finally {
      setActionId('');
    }
  };

  const statusClasses = (status: Request['status']) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const createRequest = async () => {
    try {
      setCreateError('');
      if (!newType.trim() || !newDetails.trim()) {
        setCreateError('Type and details are required.');
        return;
      }
      setCreating(true);
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: newType.trim(), details: newDetails.trim() }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to create request');
      }
      setRequests((prev) => [result.data, ...prev]);
      setNewType('');
      setNewDetails('');
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create request');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Requests ({requests.length})</h1>
          <p className="text-gray-600">Manage user requests and approvals</p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-sm disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
          Refresh
        </button>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow p-4 border border-slate-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Submit a request</h3>
        {createError && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 text-sm">
            {createError}
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Type</label>
            <input
              type="text"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              placeholder="e.g. Access request"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1 md:col-span-1">
            <label className="text-sm font-medium text-slate-700">Details</label>
            <textarea
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              placeholder="Describe the request..."
              rows={2}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            onClick={createRequest}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {creating ? <Loader2 size={16} className="animate-spin" /> : null}
            Submit
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 flex items-center gap-3 text-gray-600 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Loading requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">No requests yet.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.title || request.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.name || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.requester?.name || 'Unknown'}
                      {request.requester?.email ? (
                        <span className="text-gray-500"> ({request.requester.email})</span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{request.description || request.details}</td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{request.message || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        const { formatUSDateTime } = require('@/lib/dateFormat');
                        return formatUSDateTime(request.createdAt);
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {request.status === 'Pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(request.id, 'Approved')}
                            disabled={!!actionId}
                            className="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors disabled:opacity-60"
                          >
                            {actionId === request.id ? (
                              <Loader2 size={14} className="inline mr-1 animate-spin" />
                            ) : (
                              <Check size={14} className="inline mr-1" />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => updateStatus(request.id, 'Rejected')}
                            disabled={!!actionId}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors disabled:opacity-60"
                          >
                            {actionId === request.id ? (
                              <Loader2 size={14} className="inline mr-1 animate-spin" />
                            ) : (
                              <X size={14} className="inline mr-1" />
                            )}
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">
                          Reviewed {(() => {
                            const { formatUSDateTime } = require('@/lib/dateFormat');
                            return request.reviewedAt ? formatUSDateTime(request.reviewedAt) : '';
                          })()}
                        </span>
                      )}
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

