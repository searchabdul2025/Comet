'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';
import { Gift, RefreshCw, Settings, Target, Plus, Edit, Trash2, X, Save, Sparkles } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import StatGrid from '@/components/ui/StatGrid';
import FilterBar from '@/components/ui/FilterBar';
import PremiumTable from '@/components/ui/PremiumTable';

interface TargetRow {
  _id: string;
  user: {
    _id: string;
    name?: string;
    email?: string;
    username?: string;
    role?: string;
  };
  period: string;
  target: number;
  achieved?: number;
  bonus?: number;
}

interface BonusRule {
  _id: string;
  user: {
    _id: string;
    name?: string;
    email?: string;
    username?: string;
    role?: string;
  };
  campaign: {
    _id: string;
    name: string;
    campaignId?: string;
  };
  productGrade: string;
  bonusAmount: number;
  target?: number;
  isActive: boolean;
  note?: string;
}

interface Campaign {
  _id: string;
  name: string;
  campaignId?: string;
}

interface User {
  _id: string;
  name: string;
  email?: string;
  username?: string;
  role?: string;
}

export default function BonusesPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
  const userPermOverrides = session?.user?.permissions;
  const permissions = userRole ? getPermissions(userRole, userPermOverrides || undefined) : null;
  const isAllowed = permissions?.canManageUsers;

  const [rows, setRows] = useState<TargetRow[]>([]);
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<BonusRule | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [ruleForm, setRuleForm] = useState({
    userId: '',
    campaignId: '',
    productGrade: '',
    bonusAmount: 0,
    target: '',
    note: '',
    isActive: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/targets');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load bonuses');
      setRows(json.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bonuses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAllowed) {
      load();
      loadBonusRules();
      loadCampaigns();
      loadUsers();
    }
  }, [isAllowed]);

  const loadBonusRules = async () => {
    try {
      setRulesLoading(true);
      const res = await fetch('/api/bonus-rules');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to load bonus rules');
      setBonusRules(json.data || []);
    } catch (err: any) {
      console.error('Failed to load bonus rules:', err);
    } finally {
      setRulesLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const json = await res.json();
      if (json.success) {
        setCampaigns(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        setUsers(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setRuleForm({
      userId: '',
      campaignId: '',
      productGrade: '',
      bonusAmount: 0,
      target: '',
      note: '',
      isActive: true,
    });
    setShowRuleModal(true);
  };

  const handleCancelRule = () => {
    setShowRuleModal(false);
    setEditingRule(null);
    setRuleForm({
      userId: '',
      campaignId: '',
      productGrade: '',
      bonusAmount: 0,
      target: '',
      note: '',
      isActive: true,
    });
  };

  const handleEditRule = (rule: BonusRule) => {
    setEditingRule(rule);
    setRuleForm({
      userId: rule.user._id,
      campaignId: rule.campaign._id,
      productGrade: rule.productGrade,
      bonusAmount: rule.bonusAmount,
      target: rule.target?.toString() || '',
      note: rule.note || '',
      isActive: rule.isActive,
    });
    setShowRuleModal(true);
  };

  const handleDeleteRule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bonus rule?')) return;
    try {
      const res = await fetch(`/api/bonus-rules/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete rule');
      setBonusRules(bonusRules.filter(r => r._id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete bonus rule');
    }
  };

  const handleSaveRule = async () => {
    // Validate required fields
    if (!ruleForm.userId || !ruleForm.campaignId) {
      alert('Please select a user and campaign');
      return;
    }
    
    if (!ruleForm.productGrade || !ruleForm.productGrade.trim()) {
      alert('Please enter a product grade');
      return;
    }
    
    if (typeof ruleForm.bonusAmount !== 'number' || ruleForm.bonusAmount < 0) {
      alert('Please enter a valid bonus amount (must be 0 or greater)');
      return;
    }

    try {
      const payload = {
        userId: ruleForm.userId,
        campaignId: ruleForm.campaignId,
        productGrade: ruleForm.productGrade.trim(),
        bonusAmount: Number(ruleForm.bonusAmount),
        target: ruleForm.target && ruleForm.target.trim() ? Number(ruleForm.target) : undefined,
        note: ruleForm.note || '',
        isActive: ruleForm.isActive,
      };

      const url = editingRule ? `/api/bonus-rules/${editingRule._id}` : '/api/bonus-rules';
      const method = editingRule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to save bonus rule');

      setShowRuleModal(false);
      setEditingRule(null);
      setRuleForm({
        userId: '',
        campaignId: '',
        productGrade: '',
        bonusAmount: 0,
        target: '',
        note: '',
        isActive: true,
      });
      loadBonusRules();
      load(); // Refresh bonuses
    } catch (err: any) {
      alert(err.message || 'Failed to save bonus rule');
    }
  };

  if (!isAllowed) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          Only admins can view bonuses.
        </div>
      </div>
    );
  }

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Bonuses & Payouts" 
        description="Manage per-user, per-campaign, and per-product bonus rules."
        action={isAllowed ? {
          label: "New Bonus Rule",
          href: "#",
          icon: Sparkles
        } : undefined}
      />

      {/* Overview Stats */}
      <StatGrid 
        loading={loading || rulesLoading}
        stats={[
          { 
            label: 'Total Payouts', 
            value: rows.reduce((sum, r) => sum + (r.bonus || 0), 0),
            icon: '💰',
            sparkColor: '#D4A843',
            sparkData: [40, 45, 55, 60, 58, 65, 70]
          },
          { 
            label: 'Bonus Rules', 
            value: bonusRules.length,
            icon: '📜',
            sparkColor: '#16a34a',
            sparkData: [5, 8, 12, 10, 15, 18, 20]
          },
          { 
            label: 'Achieved Targets', 
            value: rows.filter(r => (r.achieved || 0) >= (r.target || 0)).length,
            icon: '🎯',
            sparkColor: '#101013',
            sparkData: [2, 4, 6, 8, 10, 12, 14]
          },
          { 
            label: 'Pending Approval', 
            value: 0,
            icon: '⏳',
            sparkColor: '#9CA3AF',
            sparkData: [0, 0, 0, 0, 0, 0, 0]
          }
        ]}
      />

      {/* Bonus Rules Section */}
      <div className="card-premium overflow-hidden">
        <div className="p-6 border-b border-[var(--card-border)] flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Bonus Configuration Rules</h3>
            <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-widest mt-1">Granular rules per campaign and product grade</p>
          </div>
          <button 
            onClick={handleAddRule}
            className="p-2 rounded-lg bg-[#101013] text-[#D4A843] hover:shadow-lg transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
        <PremiumTable 
          loading={rulesLoading}
          data={bonusRules}
          columns={[
            {
              header: 'User',
              accessor: (rule) => (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                    {rule.user?.name?.[0] || '?'}
                  </div>
                  <div>
                    <div className="font-bold text-[var(--text-primary)]">{rule.user?.name || 'Unknown'}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">{rule.user?.role}</div>
                  </div>
                </div>
              )
            },
            { header: 'Campaign', accessor: (rule) => rule.campaign?.name || '—' },
            { 
              header: 'Grade', 
              accessor: (rule) => (
                <span className="px-3 py-1 inline-flex text-[10px] font-bold rounded-full uppercase tracking-wider bg-amber-100 text-amber-800">
                  {rule.productGrade}
                </span>
              )
            },
            { 
              header: 'Amount', 
              accessor: (rule) => (
                <div className="font-bold text-[#D4A843]">PKR {rule.bonusAmount.toLocaleString()}</div>
              )
            },
            {
              header: 'Status',
              accessor: (rule) => (
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${rule.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300'}`} />
                  <span className={`text-[10px] font-bold uppercase ${rule.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              )
            },
            {
              header: 'Actions',
              align: 'right',
              accessor: (rule) => (
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => handleEditRule(rule)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#D4A843] transition-all"><Edit size={14} /></button>
                  <button onClick={() => handleDeleteRule(rule._id)} className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* User Bonuses Section */}
      <div className="card-premium overflow-hidden mt-8">
        <div className="p-6 border-b border-[var(--card-border)] bg-slate-50/50">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Live Bonus Calculations</h3>
          <p className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-widest mt-1">Calculated based on targets and approved submissions</p>
        </div>
        <PremiumTable 
          loading={loading}
          data={rows}
          columns={[
            {
              header: 'User',
              accessor: (r) => (
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#101013] to-[#202025] flex items-center justify-center text-[#D4A843] text-[10px] font-bold shadow-md">
                    {r.user?.name?.[0] || '?'}
                  </div>
                  <div className="font-bold text-[var(--text-primary)]">{r.user?.name || 'Unknown'}</div>
                </div>
              )
            },
            { header: 'Period', accessor: 'period' },
            { 
              header: 'Target', 
              accessor: (r) => (
                <div className="font-mono text-[12px]">{r.target}</div>
              )
            },
            { 
              header: 'Achieved', 
              accessor: (r) => (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#D4A843] transition-all" 
                      style={{ width: `${Math.min(100, ((r.achieved || 0) / r.target) * 100)}%` }} 
                    />
                  </div>
                  <span className="font-bold text-[11px]">{r.achieved || 0}</span>
                </div>
              )
            },
            { 
              header: 'Bonus Earned', 
              align: 'right',
              accessor: (r) => (
                <div className="font-black text-emerald-600">PKR {(r.bonus || 0).toLocaleString()}</div>
              )
            }
          ]}
        />
      </div>

      {/* Rule Modal (Premium Styled) */}
      {showRuleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#101013]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-[#D4A843] to-[#B8923A] px-8 py-6 flex items-center justify-between">
               <h3 className="text-xl font-bold text-[#101013]">{editingRule ? 'Edit Rule' : 'Create New Bonus Rule'}</h3>
               <button onClick={handleCancelRule} className="p-2 hover:bg-black/5 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Target User</label>
                  <select value={ruleForm.userId} onChange={(e) => setRuleForm({ ...ruleForm, userId: e.target.value })} className="w-full px-5 py-3 rounded-xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none">
                    <option value="">Select User</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Campaign</label>
                  <select value={ruleForm.campaignId} onChange={(e) => setRuleForm({ ...ruleForm, campaignId: e.target.value })} className="w-full px-5 py-3 rounded-xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none">
                    <option value="">Select Campaign</option>
                    {campaigns.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Product Grade</label>
                  <input type="text" value={ruleForm.productGrade} onChange={(e) => setRuleForm({ ...ruleForm, productGrade: e.target.value })} placeholder="e.g. Premium Gold" className="w-full px-5 py-3 rounded-xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Bonus per Unit (PKR)</label>
                  <input type="number" value={ruleForm.bonusAmount || ''} onChange={(e) => setRuleForm({ ...ruleForm, bonusAmount: parseFloat(e.target.value) || 0 })} placeholder="500" className="w-full px-5 py-3 rounded-xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Target Units</label>
                  <input type="number" value={ruleForm.target} onChange={(e) => setRuleForm({ ...ruleForm, target: e.target.value })} placeholder="100" className="w-full px-5 py-3 rounded-xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none" />
                </div>
              </div>
              <div className="flex gap-4 pt-6 border-t">
                <button onClick={handleSaveRule} className="flex-1 py-4 bg-[#101013] text-[#D4A843] rounded-2xl font-bold shadow-xl hover:shadow-[#D4A843]/10 transition-all">
                  {editingRule ? 'Update Rule' : 'Launch Rule'}
                </button>
                <button onClick={handleCancelRule} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold transition-all">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
