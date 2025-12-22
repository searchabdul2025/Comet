'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';
import { Gift, RefreshCw, Settings, Target, Plus, Edit, Trash2, X } from 'lucide-react';
import Link from 'next/link';

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
    if (!ruleForm.userId || !ruleForm.campaignId || !ruleForm.productGrade || ruleForm.bonusAmount < 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const payload = {
        userId: ruleForm.userId,
        campaignId: ruleForm.campaignId,
        productGrade: ruleForm.productGrade.trim(),
        bonusAmount: ruleForm.bonusAmount,
        target: ruleForm.target ? Number(ruleForm.target) : undefined,
        note: ruleForm.note,
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Gift size={26} className="text-amber-500" />
            Bonuses
          </h1>
          <p className="text-gray-600">
            Bonuses are calculated using granular rules (per user, campaign, and product grade) or global settings.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddRule}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition"
          >
            <Plus size={16} />
            New bonus rule
          </button>
          <Link
            href="/monthly-targets"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            <Target size={16} />
            Manage targets
          </Link>
          <button
            onClick={() => { load(); loadBonusRules(); }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded">{error}</div>}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-gray-900">Bonuses by user</h3>
          <p className="text-sm text-gray-600">Live values based on submissions and targets.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Period</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Achieved</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Bonus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-800">
                    <div className="font-medium">{r.user?.name || r.user?.username || r.user?.email || 'Unknown'}</div>
                    <div className="text-xs text-slate-500">{r.user?.role}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">{r.period}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{r.target}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{r.achieved ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">${(r.bonus ?? 0).toLocaleString()}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    {loading ? 'Loading bonuses...' : 'No data yet. Create targets to see bonuses.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bonus Rules Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-gray-900">Bonus Rules</h3>
          <p className="text-sm text-gray-600">Manage per-user, per-campaign, per-product-grade bonus rules.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Campaign</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Product Grade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Bonus Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bonusRules.map((rule) => (
                <tr key={rule._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm text-slate-800">
                    <div className="font-medium">
                      {rule.user?.name || rule.user?.username || rule.user?.email || 'Unknown'}
                    </div>
                    <div className="text-xs text-slate-500">{rule.user?.role}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-800">{rule.campaign?.name || '—'}</td>
                  <td className="px-4 py-3 text-sm text-slate-800 font-medium">{rule.productGrade}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">${rule.bonusAmount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-slate-800">{rule.target || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rule.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule._id)}
                        className="text-red-600 hover:text-red-700"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!bonusRules.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                    {rulesLoading ? 'Loading bonus rules...' : 'No bonus rules yet. Click "New bonus rule" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bonus Rule Modal */}
      {showRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingRule ? 'Edit Bonus Rule' : 'New Bonus Rule'}
              </h3>
              <button
                onClick={() => setShowRuleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User *</label>
                <select
                  value={ruleForm.userId}
                  onChange={(e) => setRuleForm({ ...ruleForm, userId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                >
                  <option value="">Select a user</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.email || u.username}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign *</label>
                <select
                  value={ruleForm.campaignId}
                  onChange={(e) => setRuleForm({ ...ruleForm, campaignId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                >
                  <option value="">Select a campaign</option>
                  {campaigns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Grade *</label>
                <input
                  type="text"
                  value={ruleForm.productGrade}
                  onChange={(e) => setRuleForm({ ...ruleForm, productGrade: e.target.value })}
                  placeholder="e.g., small egg, bigger egg, 12 eggs"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Product grade name (e.g., "small egg", "bigger egg"). This should match the productGrade in form submissions.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bonus Amount (Rs) *</label>
                  <input
                    type="number"
                    value={ruleForm.bonusAmount}
                    onChange={(e) => setRuleForm({ ...ruleForm, bonusAmount: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target (optional)</label>
                  <input
                    type="number"
                    value={ruleForm.target}
                    onChange={(e) => setRuleForm({ ...ruleForm, target: e.target.value })}
                    min="0"
                    placeholder="Base target for this grade"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <textarea
                  value={ruleForm.note}
                  onChange={(e) => setRuleForm({ ...ruleForm, note: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={ruleForm.isActive}
                    onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSaveRule}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Rule
                </button>
                <button
                  onClick={() => setShowRuleModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
