'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText, FileDown, Sheet, Loader2, Trash2, RefreshCw, ChevronDown, ChevronRight, Fingerprint } from 'lucide-react';
import { getPermissions } from '@/lib/permissions';
import { useSession } from 'next-auth/react';
import { formatUSDateTime } from '@/lib/dateFormat';
import PageHeader from '@/components/ui/PageHeader';
import StatGrid from '@/components/ui/StatGrid';
import FilterBar from '@/components/ui/FilterBar';
import PremiumTable from '@/components/ui/PremiumTable';

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

interface AttendanceRecord {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    role: string;
    biometricId: string;
  };
  biometricId: string;
  checkInTime: string;
  status: 'Present' | 'Late' | 'Absent';
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const permissions = useMemo(() => {
    const role = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
    return role ? getPermissions(role, session?.user?.permissions || undefined) : null;
  }, [session]);
  const canView = !!permissions?.canViewSubmissions;
  const canManageUsers = !!permissions?.canManageUsers;
  
  const [activeTab, setActiveTab] = useState<'submissions' | 'attendance'>('submissions');
  
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | 'pdf' | 'sheets' | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fineSettings, setFineSettings] = useState({ lateFine: '0', absentFine: '0' });
  const [users, setUsers] = useState<UserOption[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [userFilter, setUserFilter] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
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
    if (!canView && !canManageUsers) {
      setError('Reports are restricted to Admins and Supervisors.');
      setLoading(false);
      return;
    }
    fetchFilters();
    if (activeTab === 'submissions') {
      fetchSubs();
    } else {
      fetchAttendance();
    }
  }, [canView, canManageUsers, activeTab]);

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

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (userFilter) params.append('userId', userFilter);
      
      const res = await fetch(`/api/attendance?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setAttendanceRecords(result.data || []);
        if (result.settings) setFineSettings(result.settings);
      } else {
        setError(result.error || 'Failed to load attendance');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance');
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
        if (userFilter) params.append('userId', userFilter);
        if (campaignFilter) params.append('campaignId', campaignFilter);
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
      if (userFilter) params.append('userId', userFilter);
      if (campaignFilter) params.append('campaignId', campaignFilter);
      
      const res = await fetch(`/api/reports/export?${params.toString()}`);
      if (!res.ok) {
        setError('Export failed');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Generate filename with agent name if filtered
      let filename = 'submissions';
      if (userFilter && users.length > 0) {
        const selectedUser = users.find(u => u.id === userFilter);
        if (selectedUser) {
          filename = `${selectedUser.name.replace(/\s+/g, '_')}_submissions`;
        }
      }
      const dateStr = new Date().toISOString().split('T')[0];
      filename = `${filename}_${dateStr}`;
      
      a.download = `${filename}.${format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv'}`;
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

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      <PageHeader 
        title="Intelligence Reports" 
        description="Analyze submission data and biometric performance records."
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-2xl w-fit">
         <button 
          onClick={() => setActiveTab('submissions')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'submissions' ? 'bg-[#101013] text-[#D4A843] shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
         >
           <FileText size={16} /> Submissions
         </button>
         {canManageUsers && (
           <button 
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'attendance' ? 'bg-[#101013] text-[#D4A843] shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
           >
             <Fingerprint size={16} /> Attendance
           </button>
         )}
      </div>

      <div className="card-premium p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <div>
               <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1 ml-1">Date Range</label>
               <div className="flex items-center gap-2">
                 <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--card-border)] bg-slate-50 text-xs outline-none" />
                 <span className="text-slate-400">to</span>
                 <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--card-border)] bg-slate-50 text-xs outline-none" />
               </div>
             </div>
             <div>
               <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1 ml-1">User</label>
               <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--card-border)] bg-slate-50 text-xs outline-none">
                 <option value="">All Users</option>
                 {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
               </select>
             </div>
             {activeTab === 'submissions' && (
               <div>
                 <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-1 ml-1">Campaign</label>
                 <select value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-[var(--card-border)] bg-slate-50 text-xs outline-none">
                   <option value="">All Campaigns</option>
                   {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
               </div>
             )}
             <div className="flex items-end gap-2">
               <button onClick={() => activeTab === 'submissions' ? fetchSubs() : fetchAttendance()} className="px-5 py-2 bg-[#101013] text-[#D4A843] rounded-xl font-bold text-xs flex-1 transition-all">Filter</button>
               <button onClick={() => { setFromDate(''); setToDate(''); setUserFilter(''); setCampaignFilter(''); }} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all"><RefreshCw size={14}/></button>
             </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
             <div className="flex gap-2">
               {presets.map(p => (
                 <button key={p.label} onClick={() => { const r = p.range(); setFromDate(r.from); setToDate(r.to); }} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-white hover:border-[#D4A843]/30 hover:text-[#D4A843] transition-all">
                   {p.label}
                 </button>
               ))}
             </div>
             <div className="flex items-center gap-2">
                <ExportButton label="CSV" icon={<FileText size={14} />} onClick={() => handleExport('csv')} loading={exporting === 'csv'} color="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white" />
                <ExportButton label="XLSX" icon={<FileSpreadsheet size={14} />} onClick={() => handleExport('xlsx')} loading={exporting === 'xlsx'} color="bg-[#D4A843]/10 text-[#D4A843] hover:bg-[#D4A843] hover:text-[#101013]" />
                {activeTab === 'submissions' && <ExportButton label="Sheets" icon={<Sheet size={14} />} onClick={() => handleExport('sheets')} loading={exporting === 'sheets'} color="bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white" />}
             </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Main Table Content */}
      <div className="card-premium overflow-hidden">
        {activeTab === 'submissions' ? (
          <PremiumTable 
            loading={loading}
            data={submissions}
            columns={[
              {
                header: 'Date',
                accessor: (s) => (
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                      <FileText size={14} />
                    </div>
                    <div className="font-bold text-[var(--text-primary)]" suppressHydrationWarning>{formatUSDateTime(s.createdAt)}</div>
                  </div>
                )
              },
              { header: 'Phone', accessor: 'phoneNumber' },
              { header: 'IP Address', accessor: 'ipAddress' },
              { 
                header: 'Agent ID', 
                accessor: (s) => <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{s.submittedBy || '—'}</span>
              },
              {
                header: 'Data Preview',
                accessor: (s) => {
                  const keys = Object.keys(s.formData || {});
                  return (
                    <button 
                      onClick={() => {
                        const newExpanded = new Set(expandedRows);
                        if (expandedRows.has(s._id)) newExpanded.delete(s._id);
                        else newExpanded.add(s._id);
                        setExpandedRows(newExpanded);
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      {expandedRows.has(s._id) ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                      {keys.length} Fields
                    </button>
                  );
                }
              },
              {
                header: 'Actions',
                align: 'right',
                accessor: (s) => (
                  <button onClick={() => handleDelete(s._id)} className="p-2 text-slate-400 hover:text-red-500 transition-all">
                    <Trash2 size={14} />
                  </button>
                )
              }
            ]}
            rowExpansion={(s) => (
              <div className="p-6 bg-slate-50 border-t border-slate-100">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(s.formData || {}).map(([k, v]) => (
                    <div key={k} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k}</div>
                      <div className="text-sm font-medium text-slate-700">{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            isExpanded={(s) => expandedRows.has(s._id)}
          />
        ) : (
          <PremiumTable 
            loading={loading}
            data={attendanceRecords}
            columns={[
              {
                header: 'Employee',
                accessor: (r) => (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#101013] to-[#202025] flex items-center justify-center text-[#D4A843] font-black text-xs shadow-md">
                      {r.userId?.name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{r.userId?.name || 'Unknown'}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest">{r.userId?.role}</div>
                    </div>
                  </div>
                )
              },
              { 
                header: 'Check-In', 
                accessor: (r) => <div suppressHydrationWarning className="font-bold text-slate-700">{formatUSDateTime(r.checkInTime)}</div>
              },
              { 
                header: 'Status', 
                accessor: (r) => (
                  <span className={`px-3 py-1 inline-flex text-[10px] font-bold rounded-full uppercase tracking-wider ${
                    r.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                    r.status === 'Late' ? 'bg-amber-100 text-amber-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {r.status}
                  </span>
                )
              },
              {
                header: 'Fine',
                accessor: (r) => {
                  const fine = r.status === 'Late' ? fineSettings.lateFine : r.status === 'Absent' ? fineSettings.absentFine : '0';
                  return fine !== '0' ? <span className="font-black text-red-600">PKR {fine}</span> : <span className="text-slate-400">—</span>;
                }
              },
              {
                header: 'Device ID',
                accessor: (r) => <span className="font-mono text-[10px] text-slate-400">{r.biometricId}</span>
              }
            ]}
          />
        )}
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

