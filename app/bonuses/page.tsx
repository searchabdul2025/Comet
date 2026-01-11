'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';
import { Gift, RefreshCw, Settings, Target, Plus, Edit, Trash2, X, Save, Sparkles } from 'lucide-react';
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

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2 mb-2">
            <Gift size={26} className="text-amber-500" />
            Bonuses
          </h1>
          <p className="text-gray-600">
            Bonuses are calculated using granular rules (per user, campaign, and product grade) or global settings.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!showRuleModal && (
            <button
              onClick={handleAddRule}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              <Plus size={20} />
              New Bonus Rule
            </button>
          )}
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

      {error && (
        <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-pink-50 px-4 py-3 text-red-800 shadow-sm">
          {error}
        </div>
      )}

      {showRuleModal && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  {editingRule ? <Edit className="text-white" size={24} /> : <Sparkles className="text-white" size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {editingRule ? 'Edit Bonus Rule' : 'New Bonus Rule'}
                  </h3>
                  <p className="text-amber-50 text-sm mt-0.5">
                    {editingRule ? 'Update bonus rule configuration' : 'Create a new bonus rule for user, campaign, and product grade'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelRule}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-300px)]">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    User <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ruleForm.userId}
                    onChange={(e) => setRuleForm({ ...ruleForm, userId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Campaign <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={ruleForm.campaignId}
                    onChange={(e) => setRuleForm({ ...ruleForm, campaignId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
                  >
                    <option value="">Select a campaign</option>
                    {campaigns.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Grade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ruleForm.productGrade}
                  onChange={(e) => setRuleForm({ ...ruleForm, productGrade: e.target.value })}
                  placeholder="e.g., Basic, Standard, Premium"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
                />
                <p className="text-xs text-gray-500 mt-2">
                  <span className="font-medium">Note:</span> Product grade name. This should match the productGrade in form submissions. Each product can have different bonus amounts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bonus Amount (PKR) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">PKR</span>
                    <input
                      type="number"
                      value={ruleForm.bonusAmount === 0 ? '' : ruleForm.bonusAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRuleForm({ ...ruleForm, bonusAmount: value === '' ? 0 : parseFloat(value) || 0 });
                      }}
                      onFocus={(e) => {
                        if (ruleForm.bonusAmount === 0) {
                          e.target.select();
                        }
                      }}
                      placeholder="0"
                      min="0"
                      step="0.01"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target (optional)</label>
                  <input
                    type="number"
                    value={ruleForm.target}
                    onChange={(e) => setRuleForm({ ...ruleForm, target: e.target.value })}
                    min="0"
                    placeholder="Base target for this grade"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Note (optional)</label>
                <textarea
                  value={ruleForm.note}
                  onChange={(e) => setRuleForm({ ...ruleForm, note: e.target.value })}
                  rows={3}
                  placeholder="Add any additional notes or context for this bonus rule..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md resize-none"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <input
                  type="checkbox"
                  checked={ruleForm.isActive}
                  onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                  className="w-5 h-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
                />
                <div>
                  <label className="text-sm font-semibold text-gray-700 cursor-pointer">Active</label>
                  <p className="text-xs text-gray-500">Enable this rule to apply bonuses for this product grade</p>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSaveRule}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                >
                  <Save size={20} />
                  {editingRule ? 'Update Rule' : 'Create Rule'}
                </button>
                <button
                  onClick={handleCancelRule}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden">
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
                  <td className="px-4 py-3 text-sm text-slate-800">Rs {(r.bonus ?? 0).toLocaleString()}</td>
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
      <div className="rounded-2xl border border-slate-200/60 bg-white shadow-xl overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
          <h3 className="text-xl font-bold text-gray-900">Bonus Rules</h3>
          <p className="text-sm text-gray-600 mt-1">Manage per-user, per-campaign, per-product-grade bonus rules. Each product can have different bonus amounts.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Product Grade</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Bonus Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Target</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bonusRules.map((rule) => (
                <tr key={rule._id} className="hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-orange-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {rule.user?.name || rule.user?.username || rule.user?.email || 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-500">{rule.user?.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{rule.campaign?.name || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                      {rule.productGrade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">PKR {rule.bonusAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{rule.target || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                        rule.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all"
                        title="Edit"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!bonusRules.length && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-sm text-gray-500">
                      {rulesLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                          <span>Loading bonus rules...</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-medium text-gray-700 mb-1">No bonus rules yet</p>
                          <p className="text-sm">Click "New Bonus Rule" to create one for different products and bonuses</p>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
