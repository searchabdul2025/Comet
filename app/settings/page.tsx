'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';
import { 
  Pencil, 
  Save, 
  Trash2, 
  X, 
  MessageCircle, 
  ShieldX, 
  Ban, 
  UserCheck, 
  Sparkles, 
  Activity, 
  Upload, 
  Check, 
  Fingerprint,
  Smartphone,
  Table as TableIcon
} from 'lucide-react';
import { formatUSDateTime, formatUSDate } from '@/lib/dateFormat';

interface SettingsData {
  GOOGLE_SHEETS_ID?: string | null;
  GOOGLE_SHEETS_TAB_SUBMISSIONS?: string | null;
  GOOGLE_SHEETS_TAB_DAILY?: string | null;
  APP_NAME?: string | null;
  APP_LOGO_URL?: string | null;
  APP_FAVICON_URL?: string | null;
  CHAT_RATE_LIMIT_PER_MINUTE?: string | null;
  CHAT_MESSAGE_MAX_LENGTH?: string | null;
  CHAT_HISTORY_LIMIT?: string | null;
  CHAT_AUTO_DELETE_HOURS?: string | null;
  BONUS_PER_SUBMISSION?: string | null;
  BONUS_TARGET_BONUS?: string | null;
  SHOW_SALARY_BONUS?: string | null;
  WHATSAPP_API_TOKEN?: string | null;
  WHATSAPP_PHONE_NUMBER_ID?: string | null;
  ATTENDANCE_SHIFT_START_TIME?: string | null;
  ATTENDANCE_SHIFT_END_TIME?: string | null;
  ATTENDANCE_LATE_THRESHOLD_MINUTES?: string | null;
  ATTENDANCE_LATE_FINE_AMOUNT?: string | null;
  ATTENDANCE_ABSENT_FINE_AMOUNT?: string | null;
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

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<SettingsData>({
    GOOGLE_SHEETS_ID: '',
    GOOGLE_SHEETS_TAB_SUBMISSIONS: 'Submissions',
    GOOGLE_SHEETS_TAB_DAILY: 'DailyReports',
    APP_NAME: 'Portal',
    APP_LOGO_URL: '',
    APP_FAVICON_URL: '',
    CHAT_RATE_LIMIT_PER_MINUTE: '15',
    CHAT_MESSAGE_MAX_LENGTH: '500',
    CHAT_HISTORY_LIMIT: '50',
    CHAT_AUTO_DELETE_HOURS: '0',
    BONUS_PER_SUBMISSION: '0',
    BONUS_TARGET_BONUS: '0',
    SHOW_SALARY_BONUS: '1',
    WHATSAPP_API_TOKEN: '',
    WHATSAPP_PHONE_NUMBER_ID: '',
    ATTENDANCE_SHIFT_START_TIME: '09:00',
    ATTENDANCE_SHIFT_END_TIME: '18:00',
    ATTENDANCE_LATE_THRESHOLD_MINUTES: '15',
    ATTENDANCE_LATE_FINE_AMOUNT: '0',
    ATTENDANCE_ABSENT_FINE_AMOUNT: '0',
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Campaign state
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [campaignError, setCampaignError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [campaignSaving, setCampaignSaving] = useState(false);
  
  // Ban state
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
          setSettings(prev => ({ ...prev, ...result.data }));
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
    if (permissions?.canManageForms) loadCampaigns();
    if (permissions?.canManageUsers) {
      loadUsers();
      loadBans();
    }
  }, [permissions?.canManageForms, permissions?.canManageUsers]);

  const loadCampaigns = async () => {
    try {
      setCampaignsLoading(true);
      const res = await fetch('/api/campaigns');
      const result = await res.json();
      if (result.success) setCampaigns(result.data);
    } catch (err: any) {
      setCampaignError(err.message || 'Failed to load campaigns');
    } finally {
      setCampaignsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const result = await res.json();
      if (result.success) setUserOptions(result.data);
    } catch {}
  };

  const loadBans = async () => {
    try {
      setBansLoading(true);
      const res = await fetch('/api/chat/bans');
      const result = await res.json();
      if (result.success) setBans(result.data);
    } catch {} finally {
      setBansLoading(false);
    }
  };

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
        setMessage({ type: 'success', text: 'Settings saved successfully.' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save settings' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        setSettings(prev => ({ 
          ...prev, 
          [type === 'logo' ? 'APP_LOGO_URL' : 'APP_FAVICON_URL']: result.url 
        }));
        setMessage({ type: 'success', text: `${type === 'logo' ? 'Logo' : 'Favicon'} uploaded. Save changes to apply.` });
      } else {
        setMessage({ type: 'error', text: result.error || 'Upload failed' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Upload failed' });
    }
  };

  const startEditCampaign = (c: CampaignRow) => {
    setEditId(c._id);
    setEditName(c.name);
    setEditDesc(c.description || '');
  };

  const saveCampaign = async () => {
    if (!editId) return;
    try {
      setCampaignSaving(true);
      const res = await fetch(`/api/campaigns/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, description: editDesc }),
      });
      if (res.ok) {
        setEditId(null);
        loadCampaigns();
      }
    } catch {} finally {
      setCampaignSaving(false);
    }
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      loadCampaigns();
    } catch {}
  };

  const handleBanUser = async () => {
    if (!banForm.userId) return;
    try {
      setBanSaving(true);
      const res = await fetch('/api/chat/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(banForm),
      });
      if (res.ok) {
        setBanForm({ userId: '', reason: '' });
        loadBans();
      }
    } catch {} finally {
      setBanSaving(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await fetch(`/api/chat/bans?userId=${userId}`, { method: 'DELETE' });
      loadBans();
    } catch {}
  };

  if (!permissions?.canManageSettings) {
    return <div className="p-8 text-slate-500">Access Denied.</div>;
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Control Panel</h1>
          <p className="text-slate-500">Configure global settings and manage platform components.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Activity className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <Check size={20} /> : <ShieldX size={20} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Branding Section */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Dynamic Branding</h3>
              <p className="text-xs text-slate-500">Update your logo, favicon, and app name.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Application Name</label>
              <input
                type="text"
                value={settings.APP_NAME || ''}
                onChange={(e) => setSettings({ ...settings, APP_NAME: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Comet CRM"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Logo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.APP_LOGO_URL || ''}
                    onChange={(e) => setSettings({ ...settings, APP_LOGO_URL: e.target.value })}
                    className="flex-1 px-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl"
                    placeholder="/logo.svg"
                  />
                  <button 
                    onClick={() => logoInputRef.current?.click()}
                    className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all"
                  >
                    <Upload size={18} />
                  </button>
                  <input type="file" ref={logoInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Favicon</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.APP_FAVICON_URL || ''}
                    onChange={(e) => setSettings({ ...settings, APP_FAVICON_URL: e.target.value })}
                    className="flex-1 px-4 py-2 text-sm bg-slate-50 border border-slate-100 rounded-xl"
                    placeholder="/favicon.ico"
                  />
                  <button 
                    onClick={() => faviconInputRef.current?.click()}
                    className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all"
                  >
                    <Upload size={18} />
                  </button>
                  <input type="file" ref={faviconInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'favicon')} accept="image/*" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Sheets Section */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TableIcon size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Google Sheets Integration</h3>
              <p className="text-xs text-slate-500">Sync all submissions to your spreadsheet.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Google Sheets ID</label>
              <input
                type="text"
                value={settings.GOOGLE_SHEETS_ID || ''}
                onChange={(e) => setSettings({ ...settings, GOOGLE_SHEETS_ID: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                placeholder="Sheet ID from URL"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Submissions Tab</label>
                <input
                  type="text"
                  value={settings.GOOGLE_SHEETS_TAB_SUBMISSIONS || ''}
                  onChange={(e) => setSettings({ ...settings, GOOGLE_SHEETS_TAB_SUBMISSIONS: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Daily Reports Tab</label>
                <input
                  type="text"
                  value={settings.GOOGLE_SHEETS_TAB_DAILY || ''}
                  onChange={(e) => setSettings({ ...settings, GOOGLE_SHEETS_TAB_DAILY: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bonus & Salary Rules */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Performance Bonuses</h3>
              <p className="text-xs text-slate-500">Define financial rewards for your team.</p>
            </div>
          </div>

          <div className="space-y-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={String(settings.SHOW_SALARY_BONUS || '1') !== '0'}
                onChange={(e) => setSettings({ ...settings, SHOW_SALARY_BONUS: e.target.checked ? '1' : '0' })}
                className="h-5 w-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">Show Salary & Bonus section in Agent Portal</span>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bonus per submission</label>
                <input
                  type="number"
                  value={settings.BONUS_PER_SUBMISSION || ''}
                  onChange={(e) => setSettings({ ...settings, BONUS_PER_SUBMISSION: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Target Met Bonus</label>
                <input
                  type="number"
                  value={settings.BONUS_TARGET_BONUS || ''}
                  onChange={(e) => setSettings({ ...settings, BONUS_TARGET_BONUS: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp & Chat Configuration */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Smartphone size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Communication Suite</h3>
              <p className="text-xs text-slate-500">Configure WhatsApp API and Chatroom rules.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">WhatsApp API Token</label>
                <input
                  type="text"
                  value={settings.WHATSAPP_API_TOKEN || ''}
                  onChange={(e) => setSettings({ ...settings, WHATSAPP_API_TOKEN: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                  placeholder="EAA..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Phone ID</label>
                <input
                  type="text"
                  value={settings.WHATSAPP_PHONE_NUMBER_ID || ''}
                  onChange={(e) => setSettings({ ...settings, WHATSAPP_PHONE_NUMBER_ID: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Disappearing Messages</label>
                <select
                  value={settings.CHAT_AUTO_DELETE_HOURS || '0'}
                  onChange={(e) => setSettings({ ...settings, CHAT_AUTO_DELETE_HOURS: e.target.value })}
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none text-sm"
                >
                  <option value="0">Never</option>
                  <option value="1">1 Hour</option>
                  <option value="12">12 Hours</option>
                  <option value="24">1 Day</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Rules */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Fingerprint size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Attendance & Fines</h3>
              <p className="text-xs text-slate-500">Shift timings and biometric penalty rules.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Shift Starts</label>
              <input
                type="time"
                value={settings.ATTENDANCE_SHIFT_START_TIME || ''}
                onChange={(e) => setSettings({ ...settings, ATTENDANCE_SHIFT_START_TIME: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Late Threshold (Mins)</label>
              <input
                type="number"
                value={settings.ATTENDANCE_LATE_THRESHOLD_MINUTES || ''}
                onChange={(e) => setSettings({ ...settings, ATTENDANCE_LATE_THRESHOLD_MINUTES: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Late Fine (Rs.)</label>
              <input
                type="number"
                value={settings.ATTENDANCE_LATE_FINE_AMOUNT || ''}
                onChange={(e) => setSettings({ ...settings, ATTENDANCE_LATE_FINE_AMOUNT: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Absent Fine (Rs.)</label>
              <input
                type="number"
                value={settings.ATTENDANCE_ABSENT_FINE_AMOUNT || ''}
                onChange={(e) => setSettings({ ...settings, ATTENDANCE_ABSENT_FINE_AMOUNT: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
              />
            </div>
          </div>
        </div>

        {/* Chat Ban Management */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
              <Ban size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Chat Ban Control</h3>
              <p className="text-xs text-slate-500">Ban users from participating in team chat.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={banForm.userId}
              onChange={(e) => setBanForm({ ...banForm, userId: e.target.value })}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm"
            >
              <option value="">Select User</option>
              {userOptions.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
            <input
              type="text"
              placeholder="Reason"
              value={banForm.reason}
              onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm"
            />
            <button
              onClick={handleBanUser}
              disabled={banSaving || !banForm.userId}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
            >
              Ban
            </button>
          </div>

          <div className="max-h-[200px] overflow-y-auto space-y-2">
            {bans.map(ban => (
              <div key={ban._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-800">{ban.userName}</p>
                  <p className="text-[10px] text-slate-500">{ban.reason || 'No reason'}</p>
                </div>
                <button onClick={() => handleUnbanUser(ban.userId)} className="text-xs font-bold text-emerald-600 hover:underline">Unban</button>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Management */}
        <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm space-y-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Campaign Management</h3>
                <p className="text-xs text-slate-500">Manage your active forms and campaigns.</p>
              </div>
            </div>
            <button onClick={loadCampaigns} className="text-xs font-bold text-blue-600">Refresh List</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map(c => (
              <div key={c._id} className="group p-5 bg-white border border-slate-100 rounded-3xl hover:shadow-xl hover:shadow-slate-100 transition-all">
                {editId === c._id ? (
                  <div className="space-y-3">
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                    <input value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full px-3 py-2 border rounded-xl text-sm" />
                    <div className="flex gap-2">
                      <button onClick={saveCampaign} className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">Save</button>
                      <button onClick={() => setEditId(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</h4>
                        <p className="text-[10px] text-slate-400">Created: {formatUSDate(c.createdAt)}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => startEditCampaign(c)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><Pencil size={14} /></button>
                        <button onClick={() => deleteCampaign(c._id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{c.description || 'No description'}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Biometric Integration Guide (Restored) */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[100px]"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-8 backdrop-blur-xl">
              <Fingerprint size={28} className="text-indigo-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Biometric Integration Guide</h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Configure your Hikvision DS-K1T342EFWX device to push real-time attendance data to our secure cloud endpoint.
            </p>
            <div className="bg-black/20 rounded-[2rem] border border-white/5 p-8 space-y-6">
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">1</div>
                <div>
                  <p className="font-bold text-slate-200 mb-1">Set HTTP Host</p>
                  <p className="text-sm text-slate-400">In advanced network settings, set the device to "HTTP Host" mode.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">2</div>
                <div>
                  <p className="font-bold text-slate-200 mb-1">Endpoint URL</p>
                  <code className="block bg-black/40 p-3 rounded-xl border border-white/5 text-indigo-400 text-xs break-all mt-2">
                    https://cometbpo.org/api/attendance/webhook
                  </code>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6 justify-center flex flex-col">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Smartphone size={18} className="text-blue-400" />
                Device Configuration
              </h4>
              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-center gap-3">
                  <Check size={16} className="text-emerald-400" />
                  Enable Access Control & Attendance Events
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} className="text-emerald-400" />
                  Sync Biometric ID with User Profile
                </li>
                <li className="flex items-center gap-3">
                  <Check size={16} className="text-emerald-400" />
                  Configure NTP for accurate timestamps
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
