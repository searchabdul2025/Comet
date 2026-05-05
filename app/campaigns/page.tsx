'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getPermissions } from '@/lib/permissions';
import { Plus, Pencil, Trash2, Save, X, Copy, Megaphone } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import FilterBar from '@/components/ui/FilterBar';
import PremiumTable from '@/components/ui/PremiumTable';

interface Campaign {
  _id: string;
  campaignId?: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [pendingRedirectCampaign, setPendingRedirectCampaign] = useState<Campaign | null>(null);

  const { data: session } = useSession();
  const userRole = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
  const userPermOverrides = session?.user?.permissions;
  const permissions = userRole ? getPermissions(userRole, userPermOverrides || undefined) : null;

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/campaigns');
      const result = await res.json();

      if (result.success) {
        setCampaigns(result.data);
        setError('');
      } else {
        setError(result.error || 'Failed to load campaigns');
      }
    } catch (err) {
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Campaign name is required');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description }),
      });
      const result = await res.json();

      if (result.success) {
        setCampaigns([result.data, ...campaigns]);
        setName('');
        setDescription('');
        // Prompt to build form with in-app modal
        const created = result.data as Campaign;
        setPendingRedirectCampaign(created);
      } else {
        setError(result.error || 'Failed to create campaign');
      }
    } catch (err) {
      setError('Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (campaign: Campaign) => {
    setEditingId(campaign._id);
    setEditingName(campaign.name);
    setEditingDesc(campaign.description || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingDesc('');
  };

  const handleUpdate = async (id: string) => {
    if (!editingName.trim()) {
      setError('Campaign name is required');
      return;
    }
    try {
      setEditSaving(true);
      setError('');
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim(), description: editingDesc }),
      });
      const result = await res.json();
      if (result.success) {
        setCampaigns(campaigns.map((c) => (c._id === id ? result.data : c)));
        cancelEdit();
      } else {
        setError(result.error || 'Failed to update campaign');
      }
    } catch (err) {
      setError('Failed to update campaign');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign? Forms assigned to it will lose the association.')) {
      return;
    }
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setCampaigns(campaigns.filter((c) => c._id !== id));
      } else {
        setError(result.error || 'Failed to delete campaign');
      }
    } catch (err) {
      setError('Failed to delete campaign');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Campaigns" 
        description="Create a campaign before building forms and assign forms to it."
        action={permissions?.canCreateForms ? {
          label: "Create Campaign",
          href: "#", // Usually opens the creation section/modal
          icon: Megaphone
        } : undefined}
      />

      {/* Top Section - Graphic & Creation */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Creation Card (Simplified for parity) */}
        <div className="xl:col-span-2 card-premium p-8 relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
              <Megaphone className="text-[#D4A843]" size={20} />
              Quick Create
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Campaign Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter campaign name"
                  className="w-full px-5 py-3 rounded-xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none focus:border-[#D4A843]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Description (optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                  className="w-full px-5 py-3 rounded-xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none focus:border-[#D4A843]"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCreate}
                disabled={submitting}
                className="inline-flex items-center gap-2 bg-[#101013] text-[#D4A843] px-8 py-3 rounded-xl hover:shadow-xl hover:shadow-[#D4A843]/10 transition-all font-bold"
              >
                {submitting ? 'Creating...' : 'Launch Campaign'}
              </button>
            </div>
          </div>

          {/* Decorative Megaphone Graphic */}
          <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 opacity-10 group-hover:opacity-20 transition-all pointer-events-none">
             <Megaphone size={180} strokeWidth={1} className="text-[#D4A843]" />
          </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-4">
          <div className="card-premium p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#D4A843]/10 flex items-center justify-center text-[#D4A843] text-xl">🚀</div>
            <div>
              <div className="text-2xl font-black text-[var(--text-primary)]">{campaigns.length}</div>
              <div className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Total Campaigns</div>
            </div>
          </div>
          <div className="card-premium p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl">✅</div>
            <div>
              <div className="text-2xl font-black text-[var(--text-primary)]">{campaigns.length}</div>
              <div className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Active Now</div>
            </div>
          </div>
        </div>
      </div>

      <FilterBar 
        searchPlaceholder="Search campaigns..."
        filters={[
          {
            label: 'Status',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Paused', value: 'paused' },
              { label: 'Completed', value: 'completed' }
            ],
            onChange: () => {}
          }
        ]}
      />

      {/* Campaign List Table */}
      <PremiumTable 
        loading={loading}
        data={campaigns}
        columns={[
          {
            header: 'Campaign',
            accessor: (campaign) => (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#B8923A] flex items-center justify-center text-[#101013] shadow-lg shadow-[#D4A843]/10">
                  <Megaphone size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{campaign.name}</div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">{campaign.campaignId || 'Internal'}</div>
                </div>
              </div>
            )
          },
          {
            header: 'Description',
            accessor: (campaign) => (
              <span className="text-[13px] text-[var(--text-secondary)] line-clamp-1 max-w-[240px]">
                {campaign.description || '—'}
              </span>
            )
          },
          {
            header: 'Created',
            accessor: (campaign) => {
              const { formatUSDate } = require('@/lib/dateFormat');
              return (
                <div className="text-[13px] text-[var(--text-tertiary)]">
                  {formatUSDate(campaign.createdAt)}
                </div>
              );
            }
          },
          {
            header: 'Status',
            accessor: () => (
              <span className="px-3 py-1 inline-flex text-[10px] font-bold rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Active
              </span>
            )
          },
          {
            header: 'Actions',
            align: 'right',
            accessor: (campaign) => (
              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => startEdit(campaign)}
                  className="p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all"
                >
                  <Pencil size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(campaign._id)}
                  className="p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/30 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          }
        ]}
      />

      {/* Build Form Modal (Kept original logic) */}
      {pendingRedirectCampaign && (
        <div className="fixed inset-0 bg-[#101013]/60 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-white rounded-[28px] shadow-2xl max-w-sm w-full p-8 border border-slate-200 animate-scale-in text-center">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">✨</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Launch Form Builder?</h3>
            <p className="text-sm text-slate-600 mb-8">
              Campaign "{pendingRedirectCampaign.name}" is ready. Would you like to create the data collection form for it now?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const created = pendingRedirectCampaign;
                  setPendingRedirectCampaign(null);
                  if (created?._id) {
                    const params = new URLSearchParams();
                    if (created.campaignId) params.append('campaignId', created.campaignId);
                    params.append('campaignName', created.name);
                    router.push(`/form-builder?${params.toString()}`);
                  }
                }}
                className="w-full py-4 bg-[#101013] text-[#D4A843] rounded-2xl font-bold shadow-xl hover:shadow-[#D4A843]/10 transition-all"
              >
                Yes, Build Now
              </button>
              <button
                onClick={() => setPendingRedirectCampaign(null)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal (Added for completeness) */}
      {editingId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#101013]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-[#D4A843] to-[#B8923A] px-8 py-6 flex items-center justify-between">
               <h3 className="text-xl font-bold text-[#101013]">Edit Campaign</h3>
               <button onClick={cancelEdit} className="p-2 hover:bg-black/5 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Name</label>
                  <input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none focus:border-[#D4A843]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Description</label>
                  <input type="text" value={editingDesc} onChange={(e) => setEditingDesc(e.target.value)} className="w-full px-5 py-3 rounded-xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none focus:border-[#D4A843]" />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => handleUpdate(editingId)} disabled={editSaving} className="flex-1 py-4 bg-[#101013] text-[#D4A843] rounded-2xl font-bold shadow-xl">
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


