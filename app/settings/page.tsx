'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';
import { Pencil, Save, Trash2, X, MessageCircle, ShieldX, Ban, UserCheck } from 'lucide-react';

interface SettingsData {
  GOOGLE_SHEETS_ID?: string | null;
  GOOGLE_SHEETS_TAB_SUBMISSIONS?: string | null;
  GOOGLE_SHEETS_TAB_DAILY?: string | null;
  APP_NAME?: string | null;
  APP_LOGO_URL?: string | null;
  EMPLOYEE_LEAD_MODE?: 'auto' | 'manual' | '' | null;
  EMPLOYEE_CALENDLY_URL?: string | null;
  CHAT_RATE_LIMIT_PER_MINUTE?: string | null;
  CHAT_MESSAGE_MAX_LENGTH?: string | null;
  CHAT_HISTORY_LIMIT?: string | null;
}

interface CampaignRow {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface ChatBanRow {
  _id: string;
  userId: string;
  userName: string;
  reason?: string | null;
  bannedBy?: string;
  bannedByName?: string;
  createdAt: string;
}

interface UserOption {
  _id: string;
  name: string;
  email?: string;
  role: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
  const userPermOverrides = session?.user?.permissions;
  const permissions = userRole ? getPermissions(userRole, userPermOverrides || undefined) : null;

  const [settings, setSettings] = useState<SettingsData>({
    GOOGLE_SHEETS_ID: '',
    GOOGLE_SHEETS_TAB_SUBMISSIONS: 'Submissions',
    GOOGLE_SHEETS_TAB_DAILY: 'DailyReports',
    APP_NAME: 'Portal',
    APP_LOGO_URL: '',
    EMPLOYEE_LEAD_MODE: 'auto',
    EMPLOYEE_CALENDLY_URL: '',
    CHAT_RATE_LIMIT_PER_MINUTE: '15',
    CHAT_MESSAGE_MAX_LENGTH: '500',
    CHAT_HISTORY_LIMIT: '50',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignError, setCampaignError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [campaignSaving, setCampaignSaving] = useState(false);
  const [bans, setBans] = useState<ChatBanRow[]>([]);
  const [bansLoading, setBansLoading] = useState(false);
  const [banSaving, setBanSaving] = useState(false);
  const [banMessage, setBanMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [banForm, setBanForm] = useState<{ userId: string; reason: string }>({ userId: '', reason: '' });
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/settings');
        const result = await res.json();
        if (result.success) {
          setSettings({
            GOOGLE_SHEETS_ID: result.data.GOOGLE_SHEETS_ID || '',
            GOOGLE_SHEETS_TAB_SUBMISSIONS: result.data.GOOGLE_SHEETS_TAB_SUBMISSIONS || 'Submissions',
            GOOGLE_SHEETS_TAB_DAILY: result.data.GOOGLE_SHEETS_TAB_DAILY || 'DailyReports',
            APP_NAME: result.data.APP_NAME || 'Portal',
            APP_LOGO_URL: result.data.APP_LOGO_URL || '',
            EMPLOYEE_LEAD_MODE: (result.data.EMPLOYEE_LEAD_MODE as 'auto' | 'manual') || 'auto',
            EMPLOYEE_CALENDLY_URL: result.data.EMPLOYEE_CALENDLY_URL || '',
            CHAT_RATE_LIMIT_PER_MINUTE: result.data.CHAT_RATE_LIMIT_PER_MINUTE || '15',
            CHAT_MESSAGE_MAX_LENGTH: result.data.CHAT_MESSAGE_MAX_LENGTH || '500',
            CHAT_HISTORY_LIMIT: result.data.CHAT_HISTORY_LIMIT || '50',
          });
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to load settings' });
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    };
    if (permissions?.canManageSettings) load();
  }, [permissions?.canManageSettings]);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        setCampaignsLoading(true);
        const res = await fetch('/api/campaigns');
        const result = await res.json();
        if (result.success) {
          setCampaigns(result.data);
          setCampaignError('');
        } else {
          setCampaignError(result.error || 'Failed to load campaigns');
        }
      } catch (err: any) {
        setCampaignError(err.message || 'Failed to load campaigns');
      } finally {
        setCampaignsLoading(false);
      }
    };
    if (permissions?.canManageForms) {
      loadCampaigns();
    }
  }, [permissions?.canManageForms]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const result = await res.json();
        if (result.success) {
          setUserOptions(result.data);
        }
      } catch {
        // ignore user fetch errors for this panel
      }
    };

    const loadBans = async () => {
      try {
        setBansLoading(true);
        const res = await fetch('/api/chat/bans');
        const result = await res.json();
        if (result.success) {
          setBans(result.data);
          setBanMessage(null);
        } else {
          setBanMessage({ type: 'error', text: result.error || 'Failed to load bans' });
        }
      } catch (err: any) {
        setBanMessage({ type: 'error', text: err.message || 'Failed to load bans' });
      } finally {
        setBansLoading(false);
      }
    };

    if (permissions?.canManageUsers) {
      loadUsers();
      loadBans();
    }
  }, [permissions?.canManageUsers]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });
      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Settings saved.' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const startEditCampaign = (row: CampaignRow) => {
    setEditId(row._id);
    setEditName(row.name);
    setEditDesc(row.description || '');
  };

  const cancelEditCampaign = () => {
    setEditId(null);
    setEditName('');
    setEditDesc('');
  };

  const saveCampaign = async () => {
    if (!editId) return;
    if (!editName.trim()) {
      setCampaignError('Campaign name is required');
      return;
    }
    try {
      setCampaignSaving(true);
      setCampaignError('');
      const res = await fetch(`/api/campaigns/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), description: editDesc }),
      });
      const result = await res.json();
      if (result.success) {
        setCampaigns(campaigns.map((c) => (c._id === editId ? result.data : c)));
        cancelEditCampaign();
      } else {
        setCampaignError(result.error || 'Failed to update campaign');
      }
    } catch (err: any) {
      setCampaignError(err.message || 'Failed to update campaign');
    } finally {
      setCampaignSaving(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign? Forms assigned to it will lose the association.')) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setCampaigns(campaigns.filter((c) => c._id !== id));
      } else {
        setCampaignError(result.error || 'Failed to delete campaign');
      }
    } catch (err: any) {
      setCampaignError(err.message || 'Failed to delete campaign');
    }
  };

  const handleBanUser = async () => {
    if (!banForm.userId) {
      setBanMessage({ type: 'error', text: 'Select a user to ban' });
      return;
    }
    try {
      setBanSaving(true);
      setBanMessage(null);
      const res = await fetch('/api/chat/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banForm),
      });
      const result = await res.json();
      if (result.success) {
        setBans([result.data, ...bans.filter((b) => b.userId !== result.data.userId)]);
        setBanForm({ userId: '', reason: '' });
        setBanMessage({ type: 'success', text: 'User banned from chat.' });
      } else {
        setBanMessage({ type: 'error', text: result.error || 'Failed to ban user' });
      }
    } catch (err: any) {
      setBanMessage({ type: 'error', text: err.message || 'Failed to ban user' });
    } finally {
      setBanSaving(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/chat/bans/${userId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) {
        setBans(bans.filter((b) => b.userId !== userId));
        setBanMessage(null);
      } else {
        setBanMessage({ type: 'error', text: result.error || 'Failed to unban user' });
      }
    } catch (err: any) {
      setBanMessage({ type: 'error', text: err.message || 'Failed to unban user' });
    }
  };

  if (!permissions?.canManageSettings) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
        <p className="text-gray-600">You do not have access to manage settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-600">Configure branding and integrations.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
            <input
              type="text"
              value={settings.APP_NAME || ''}
              onChange={(e) => setSettings({ ...settings, APP_NAME: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              placeholder="e.g., My Portal"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
            <input
              type="text"
              value={settings.APP_LOGO_URL || ''}
              onChange={(e) => setSettings({ ...settings, APP_LOGO_URL: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              placeholder="https://example.com/logo.png"
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Google Sheets ID</label>
          <input
            type="text"
            value={settings.GOOGLE_SHEETS_ID || ''}
            onChange={(e) => setSettings({ ...settings, GOOGLE_SHEETS_ID: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
            placeholder="Sheet ID (from sheet URL)"
            disabled={loading}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Submissions Tab Name</label>
            <input
              type="text"
              value={settings.GOOGLE_SHEETS_TAB_SUBMISSIONS || ''}
              onChange={(e) => setSettings({ ...settings, GOOGLE_SHEETS_TAB_SUBMISSIONS: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daily Reports Tab Name</label>
            <input
              type="text"
              value={settings.GOOGLE_SHEETS_TAB_DAILY || ''}
              onChange={(e) => setSettings({ ...settings, GOOGLE_SHEETS_TAB_DAILY: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              disabled={loading}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lead Creation Mode</label>
            <div className="flex gap-4">
              {['auto', 'manual'].map((mode) => (
                <label key={mode} className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="radio"
                    name="leadMode"
                    value={mode}
                    checked={settings.EMPLOYEE_LEAD_MODE === mode}
                    onChange={() => setSettings({ ...settings, EMPLOYEE_LEAD_MODE: mode as 'auto' | 'manual' })}
                  />
                  {mode === 'auto' ? 'Auto-create lead from major form' : 'Manual (create only when triggered)'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calendly URL (optional)</label>
            <input
              type="text"
              value={settings.EMPLOYEE_CALENDLY_URL || ''}
              onChange={(e) => setSettings({ ...settings, EMPLOYEE_CALENDLY_URL: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              placeholder="https://calendly.com/your-link"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Shown on the employee major form for scheduling.
            </p>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={18} className="text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Chat room limits</p>
              <p className="text-xs text-gray-500">Control spam and load for the shared chat room.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Messages per minute</label>
              <input
                type="number"
                min={1}
                value={settings.CHAT_RATE_LIMIT_PER_MINUTE || ''}
                onChange={(e) => setSettings({ ...settings, CHAT_RATE_LIMIT_PER_MINUTE: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="15"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Per-user soft limit before throttling.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max message length</label>
              <input
                type="number"
                min={50}
                value={settings.CHAT_MESSAGE_MAX_LENGTH || ''}
                onChange={(e) => setSettings({ ...settings, CHAT_MESSAGE_MAX_LENGTH: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="500"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Characters allowed per message.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">History fetch limit</label>
              <input
                type="number"
                min={10}
                value={settings.CHAT_HISTORY_LIMIT || ''}
                onChange={(e) => setSettings({ ...settings, CHAT_HISTORY_LIMIT: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                placeholder="50"
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Messages loaded for newcomers.</p>
            </div>
          </div>
        </div>
        {message && (
          <div
            className={`rounded-md px-3 py-2 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {permissions?.canManageUsers && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ShieldX size={18} className="text-red-600" />
                Chat moderation
              </h2>
              <p className="text-sm text-gray-600">Ban/unban users from the shared chat room.</p>
            </div>
          </div>

          {banMessage && (
            <div
              className={`rounded-md px-3 py-2 text-sm ${
                banMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {banMessage.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select
                value={banForm.userId}
                onChange={(e) => setBanForm({ ...banForm, userId: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black"
              >
                <option value="">Select user</option>
                {userOptions
                  .filter((u) => u.role !== 'Admin')
                  .map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.role})
                    </option>
                  ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
              <input
                type="text"
                value={banForm.reason}
                onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white text-black"
                placeholder="Spam, abuse, etc."
              />
            </div>
            <div className="flex items-end md:col-span-1">
              <button
                onClick={handleBanUser}
                disabled={banSaving}
                className="w-full inline-flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition disabled:opacity-60"
              >
                <Ban size={16} />
                {banSaving ? 'Banning...' : 'Ban user'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500">Admins cannot be banned. Bans apply immediately for active chat sessions.</p>

          <div className="border-t border-slate-100 pt-4 space-y-2">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className="text-gray-600" />
              <p className="text-sm font-semibold text-gray-800">Banned users</p>
            </div>
            {bansLoading ? (
              <p className="text-sm text-gray-600">Loading bans...</p>
            ) : bans.length === 0 ? (
              <p className="text-sm text-gray-600">No active bans.</p>
            ) : (
              <div className="space-y-2">
                {bans.map((ban) => (
                  <div
                    key={ban._id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-gray-200 p-3 bg-white"
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{ban.userName}</p>
                      <p className="text-xs text-gray-600">
                        Reason: {ban.reason || 'Not specified'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Banned {new Date(ban.createdAt).toLocaleString()} {ban.bannedByName ? `by ${ban.bannedByName}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnbanUser(ban.userId)}
                      className="inline-flex items-center gap-1 text-sm bg-green-100 text-green-700 px-3 py-2 rounded-md hover:bg-green-200"
                    >
                      <UserCheck size={16} />
                      Unban
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {permissions?.canManageForms && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Campaign Settings</h2>
              <p className="text-sm text-gray-600">Modify existing campaigns from the admin panel.</p>
            </div>
            <button
              onClick={() => {
                if (!campaignsLoading) {
                  // trigger refresh
                  (async () => {
                    setCampaignsLoading(true);
                    try {
                      const res = await fetch('/api/campaigns');
                      const result = await res.json();
                      if (result.success) {
                        setCampaigns(result.data);
                        setCampaignError('');
                      } else {
                        setCampaignError(result.error || 'Failed to load campaigns');
                      }
                    } catch (err: any) {
                      setCampaignError(err.message || 'Failed to load campaigns');
                    } finally {
                      setCampaignsLoading(false);
                    }
                  })();
                }
              }}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>

          {campaignError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {campaignError}
            </div>
          )}

          {campaignsLoading ? (
            <p className="text-gray-600 text-sm">Loading campaigns...</p>
          ) : campaigns.length === 0 ? (
            <p className="text-gray-600 text-sm">No campaigns available. Create one first.</p>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => (
                <div key={c._id} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-2 bg-white">
                  {editId === c._id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                      />
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveCampaign}
                          disabled={campaignSaving}
                          className="flex-1 inline-flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm"
                        >
                          <Save size={16} />
                          {campaignSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEditCampaign}
                          className="flex-1 inline-flex items-center justify-center gap-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm"
                        >
                          <X size={16} />
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">{c.name}</p>
                          {c.description && <p className="text-sm text-gray-600">{c.description}</p>}
                          <p className="text-xs text-gray-500">
                            Created {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditCampaign(c)}
                            className="inline-flex items-center gap-1 text-sm bg-gray-100 px-3 py-2 rounded-md text-gray-800 hover:bg-gray-200"
                          >
                            <Pencil size={16} /> Edit
                          </button>
                          <button
                            onClick={() => deleteCampaign(c._id)}
                            className="inline-flex items-center gap-1 text-sm bg-red-100 px-3 py-2 rounded-md text-red-700 hover:bg-red-200"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm rounded-lg p-4">
        Credentials note: service account email/private key remain in environment variables.
        The Sheet ID and tab names saved here are stored in MongoDB for runtime use.
      </div>
    </div>
  );
}

