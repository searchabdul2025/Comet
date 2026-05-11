'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle2, XCircle, Clock, DollarSign, FileText, Loader2 } from 'lucide-react';
import { formatUSDateTime } from '@/lib/dateFormat';
import PageHeader from '@/components/ui/PageHeader';
import StatGrid from '@/components/ui/StatGrid';
import FilterBar from '@/components/ui/FilterBar';
import PremiumTable from '@/components/ui/PremiumTable';

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

  const getSparkData = (status: string) => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().slice(0, 10);
    });

    return last7Days.map(day => {
      return approvals.filter(a => {
        if (a.status !== status) return false;
        const dateStr = (a.reviewedAt || a.createdAt || a.submission?.createdAt || '')?.slice(0, 10);
        return dateStr === day;
      }).length;
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sales Approvals" 
        description="Track the verification status and payment processing of your submissions."
      />

      {/* Approval Stats */}
      <StatGrid 
        loading={loading}
        stats={[
          { 
            label: 'Approved', 
            value: statusCounts.approved,
            icon: '✅',
            sparkColor: '#16a34a',
            sparkData: getSparkData('approved')
          },
          { 
            label: 'Paid', 
            value: statusCounts.paid,
            icon: '💰',
            sparkColor: '#D4A843',
            sparkData: getSparkData('paid')
          },
          { 
            label: 'Pending', 
            value: statusCounts.pending,
            icon: '⏳',
            sparkColor: '#9CA3AF',
            sparkData: getSparkData('pending')
          },
          { 
            label: 'Rejected', 
            value: statusCounts.rejected,
            icon: '❌',
            sparkColor: '#ef4444',
            sparkData: getSparkData('rejected')
          }
        ]}
      />

      <FilterBar 
        searchPlaceholder="Search approvals..."
        filters={[
          {
            label: 'All Statuses',
            options: [
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Rejected', value: 'rejected' },
              { label: 'Paid', value: 'paid' },
              { label: 'Unpaid', value: 'unpaid' }
            ],
            onChange: setStatusFilter
          }
        ]}
      />

      {/* Approvals Table */}
      <PremiumTable 
        loading={loading}
        data={approvals}
        columns={[
          {
            header: 'Date',
            accessor: (approval) => (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#101013] to-[#202025] flex items-center justify-center text-[#D4A843] shadow-lg">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="font-bold text-[var(--text-primary)]" suppressHydrationWarning>
                    {approval.submission?.createdAt ? formatUSDateTime(approval.submission.createdAt) : '—'}
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-widest">Submitted Date</div>
                </div>
              </div>
            )
          },
          {
            header: 'Contact',
            accessor: (approval) => (
              <div className="font-bold text-[var(--text-secondary)]">
                {approval.submission?.phoneNumber || '—'}
              </div>
            )
          },
          {
            header: 'Amount',
            accessor: (approval) => (
              <div className="font-black text-[#D4A843]">
                {approval.amount ? `PKR ${approval.amount.toLocaleString()}` : '—'}
              </div>
            )
          },
          {
            header: 'Status',
            accessor: (approval) => (
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${
                  approval.status === 'approved' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
                  approval.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                  approval.status === 'rejected' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                  'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                }`} />
                <span className={`text-[10px] font-bold uppercase ${
                  approval.status === 'approved' ? 'text-green-600' :
                  approval.status === 'paid' ? 'text-emerald-600' :
                  approval.status === 'rejected' ? 'text-red-600' :
                  'text-amber-600'
                }`}>
                  {approval.status}
                </span>
              </div>
            )
          },
          {
            header: 'Reviewer',
            accessor: (approval) => (
              approval.reviewedAt ? (
                <div>
                  <div className="text-[12px] font-bold text-[var(--text-secondary)]">{approval.reviewedBy?.name || 'Admin'}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)]" suppressHydrationWarning>{formatUSDateTime(approval.reviewedAt)}</div>
                </div>
              ) : <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">Waiting</span>
            )
          },
          {
            header: 'Comments',
            accessor: (approval) => (
              <div className="text-[12px] text-[var(--text-tertiary)] italic max-w-[150px] truncate">
                {approval.comments || 'No comments'}
              </div>
            )
          }
        ]}
      />
    </div>
  );
}

