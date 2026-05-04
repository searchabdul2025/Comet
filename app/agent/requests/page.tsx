'use client';

import { useEffect, useState } from 'react';
import { Loader2, Send, RefreshCcw } from 'lucide-react';

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
  reviewedAt?: string;
}

export default function AgentRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    name: '',
    description: '',
    message: '',
  });

  const fetchMyRequests = async () => {
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
    fetchMyRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.name.trim() || !formData.description.trim() || !formData.message.trim()) {
      setFormError('All fields are required');
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.title,
          details: formData.message,
          title: formData.title,
          name: formData.name,
          description: formData.description,
          message: formData.message,
        }),
      });
      
      const result = await res.json();
      
      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit request');
      }
      
      setFormData({ title: '', name: '', description: '', message: '' });
      fetchMyRequests();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="p-6 bg-[#f6f9fc] min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Requests</h1>
          <p className="text-gray-600">Submit and track your requests</p>
        </div>
        <button
          onClick={fetchMyRequests}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-sm disabled:opacity-60"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
          Refresh
        </button>
      </div>

      <div className="mb-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Submit New Request</h2>
        
        {formError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Request title"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your request"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Detailed message about your request"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              Submit Request
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-gray-800">My Request History</h2>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 flex items-center gap-3 text-gray-600 text-sm">
              <Loader2 size={16} className="animate-spin" />
              Loading your requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-sm text-gray-600">No requests yet. Submit your first request above!</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-6 py-3 text-left">Title</th>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Description</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-gray-900">{request.title || request.type}</td>
                    <td className="px-6 py-4 text-gray-900">{request.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{request.description || request.details}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '—'}
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
