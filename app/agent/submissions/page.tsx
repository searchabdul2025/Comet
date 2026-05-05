'use client';

import { useEffect, useState, useMemo } from 'react';
import { RefreshCw, Calendar, FileText, Search, Download, Loader2 } from 'lucide-react';
import { formatUSDateTime } from '@/lib/dateFormat';
import PageHeader from '@/components/ui/PageHeader';
import StatGrid from '@/components/ui/StatGrid';
import FilterBar from '@/components/ui/FilterBar';
import PremiumTable from '@/components/ui/PremiumTable';

interface SubmissionRow {
  _id: string;
  createdAt: string;
  formId: {
    _id: string;
    title?: string;
    fields?: Array<{ id: string; name: string; type: string }>;
  } | string;
  phoneNumber?: string;
  formData?: Record<string, any>;
  customerName?: string; // Extracted customer name for easy display
}

export default function AgentSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
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

  const handleExport = async (isFull: boolean = false) => {
    try {
      setExporting(true);
      const params = new URLSearchParams({ format: 'xlsx' });
      if (!isFull) {
        if (from) params.append('from', from);
        if (to) params.append('to', to);
      }
      const res = await fetch(`/api/agent/export?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `my_submissions_${isFull ? 'full_' : ''}${dateStr}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (value: string) => {
    return formatUSDateTime(value);
  };

  // Filter submissions based on search query
  const filteredSubmissions = useMemo(() => {
    if (!searchQuery.trim()) return submissions;
    
    const query = searchQuery.toLowerCase();
    return submissions.filter(submission => {
      // Search in customer name
      if (submission.customerName?.toLowerCase().includes(query)) return true;
      
      // Search in form data values (only customer name is visible)
      if (submission.formData) {
        const formDataStr = JSON.stringify(submission.formData).toLowerCase();
        if (formDataStr.includes(query)) return true;
      }
      
      // Search in form title/ID
      const formTitle = typeof submission.formId === 'object' 
        ? submission.formId?.title || submission.formId?._id || ''
        : submission.formId || '';
      if (String(formTitle).toLowerCase().includes(query)) return true;
      
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
    <div className="space-y-6">
      <PageHeader 
        title="My Submissions" 
        description="Filter your submissions and see what counts toward your targets."
        action={{
          label: "Full Refresh",
          href: "#",
          icon: RefreshCw,
          onClick: load
        }}
      />

      {/* Agent Stats */}
      <StatGrid 
        loading={loading}
        stats={[
          { 
            label: 'My Submissions', 
            value: submissions.length,
            icon: '📄',
            sparkColor: '#D4A843',
            sparkData: [12, 15, 10, 18, 22, 20, 25]
          },
          { 
            label: 'Today', 
            value: submissions.filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString()).length,
            icon: '📅',
            sparkColor: '#16a34a',
            sparkData: [1, 2, 0, 3, 4, 2, 5]
          },
          { 
            label: 'Approved', 
            value: submissions.length, // Simulated
            icon: '✅',
            sparkColor: '#D4A843',
            sparkData: [10, 12, 15, 18, 20, 22, 24]
          },
          { 
            label: 'Pending', 
            value: 0,
            icon: '⏳',
            sparkColor: '#9CA3AF',
            sparkData: [0, 0, 0, 0, 0, 0, 0]
          }
        ]}
      />

      {/* Export & Filters */}
      <div className="card-premium p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
             <div className="w-full md:w-auto">
               <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1 ml-1">From</label>
               <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-[var(--card-border)] bg-slate-50 focus:bg-white outline-none transition-all text-sm" />
             </div>
             <div className="w-full md:w-auto">
               <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1 ml-1">To</label>
               <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full px-4 py-2 rounded-xl border border-[var(--card-border)] bg-slate-50 focus:bg-white outline-none transition-all text-sm" />
             </div>
             <div className="flex items-end h-full pt-5">
                <button onClick={load} className="px-6 py-2 bg-[#101013] text-[#D4A843] rounded-xl font-bold text-sm shadow-lg hover:shadow-[#D4A843]/10 transition-all">Apply Filter</button>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport(false)}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all font-bold text-sm"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Export XLSX
            </button>
          </div>
        </div>
      </div>

      <FilterBar 
        searchPlaceholder="Search by customer or form name..."
        onSearchChange={setSearchQuery}
      />

      {/* Submissions Table */}
      <PremiumTable 
        loading={loading}
        data={filteredSubmissions}
        columns={[
          {
            header: 'Submission',
            accessor: (s) => (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#B8923A] flex items-center justify-center text-[#101013] shadow-lg shadow-[#D4A843]/10">
                  <FileText size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-bold text-[var(--text-primary)]" suppressHydrationWarning>{formatDate(s.createdAt)}</div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">ID: {s._id.slice(-8).toUpperCase()}</div>
                </div>
              </div>
            )
          },
          {
            header: 'Form / Campaign',
            accessor: (s) => (
              <div>
                <div className="font-bold text-[var(--text-secondary)]">
                  {typeof s.formId === 'object' ? s.formId?.title : s.formId}
                </div>
              </div>
            )
          },
          {
            header: 'Customer',
            accessor: (s) => (
              <div className="font-bold text-[var(--text-primary)]">
                {s.customerName || (s.formData && Object.values(s.formData)[0] ? String(Object.values(s.formData)[0]) : '—')}
              </div>
            )
          },
          {
            header: 'Status',
            accessor: () => (
              <span className="px-3 py-1 inline-flex text-[10px] font-bold rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Approved
              </span>
            )
          },
          {
            header: 'Actions',
            align: 'right',
            accessor: (s) => (
              <div className="opacity-0 group-hover:opacity-100 transition-all">
                <button className="p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all">
                  <Search size={14} />
                </button>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}

