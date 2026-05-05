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
  ShieldCheck,
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
    <div className="space-y-8 pb-20 -mx-6 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Admin Control Panel</h1>
          <p className="text-[var(--text-secondary)] mt-1">Configure global settings and manage platform components.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4A843] to-[#B8923A] text-[#101013] px-10 py-4 rounded-2xl font-bold shadow-xl shadow-[#D4A843]/20 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <Activity className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl border text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-600'
        }`}>
          {message.type === 'success' ? <Check size={20} /> : <ShieldX size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Branding & App Identity */}
        <div className="card-premium p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#D4A843]/10 flex items-center justify-center text-[#D4A843]">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Branding & App Identity</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Customize the platform name and visual assets.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Application Name</label>
              <input
                type="text"
                value={settings.APP_NAME || ''}
                onChange={(e) => setSettings({ ...settings, APP_NAME: e.target.value })}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843] transition-all outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">App Logo</label>
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                  <div className="h-14 w-14 rounded-xl bg-[#101013] flex items-center justify-center overflow-hidden border border-[var(--card-border)]">
                    {settings.APP_LOGO_URL ? <img src={settings.APP_LOGO_URL} className="h-full w-full object-contain" /> : <Sparkles className="text-[#D4A843]/50" />}
                  </div>
                  <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-2 text-[#D4A843] font-bold text-xs hover:opacity-80 transition-opacity">
                    <Upload size={16} />
                    Upload
                  </button>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">App Favicon</label>
                <div className="flex items-center gap-4 p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                  <div className="h-14 w-14 rounded-xl bg-[#101013] flex items-center justify-center overflow-hidden border border-[var(--card-border)]">
                    {settings.APP_FAVICON_URL ? <img src={settings.APP_FAVICON_URL} className="h-full w-full object-contain" /> : <Fingerprint className="text-[#D4A843]/50" />}
                  </div>
                  <button onClick={() => faviconInputRef.current?.click()} className="flex items-center gap-2 text-[#D4A843] font-bold text-xs hover:opacity-80 transition-opacity">
                    <Upload size={16} />
                    Upload
                  </button>
                  <input type="file" ref={faviconInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'favicon')} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Sheets Integration */}
        <div className="card-premium p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <TableIcon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Google Sheets</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Connect your platform to Google Sheets for data syncing.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Spreadsheet ID</label>
              <input
                type="text"
                value={settings.GOOGLE_SHEETS_ID || ''}
                onChange={(e) => setSettings({ ...settings, GOOGLE_SHEETS_ID: e.target.value })}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843] transition-all outline-none font-mono text-sm"
                placeholder="1aBcD...eFgHi"
              />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Submissions Tab</label>
                <input
                  type="text"
                  value={settings.GOOGLE_SHEETS_TAB_SUBMISSIONS || ''}
                  onChange={(e) => setSettings({ ...settings, GOOGLE_SHEETS_TAB_SUBMISSIONS: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843] transition-all outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Daily Reports Tab</label>
                <input
                  type="text"
                  value={settings.GOOGLE_SHEETS_TAB_DAILY || ''}
                  onChange={(e) => setSettings({ ...settings, GOOGLE_SHEETS_TAB_DAILY: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] focus:ring-1 focus:ring-[#D4A843] transition-all outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bonus & Salary Rules */}
        <div className="card-premium p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#D4A843]/10 flex items-center justify-center text-[#D4A843]">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Performance Bonuses</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Define financial rewards for your team.</p>
            </div>
          </div>

          <div className="space-y-6">
            <label className="flex items-center gap-4 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={String(settings.SHOW_SALARY_BONUS || '1') !== '0'}
                  onChange={(e) => setSettings({ ...settings, SHOW_SALARY_BONUS: e.target.checked ? '1' : '0' })}
                  className="peer h-6 w-6 rounded-lg border-[var(--card-border)] bg-[var(--background)] text-[#D4A843] focus:ring-[#D4A843] transition-all appearance-none checked:bg-[#D4A843] border"
                />
                <Check className="absolute top-1 left-1 h-4 w-4 text-[#101013] hidden peer-checked:block pointer-events-none" />
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Show Salary & Bonus section in Agent Portal</span>
            </label>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Bonus per submission</label>
                <input
                  type="number"
                  value={settings.BONUS_PER_SUBMISSION || ''}
                  onChange={(e) => setSettings({ ...settings, BONUS_PER_SUBMISSION: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Target Bonus</label>
                <input
                  type="number"
                  value={settings.BONUS_TARGET_BONUS || ''}
                  onChange={(e) => setSettings({ ...settings, BONUS_TARGET_BONUS: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp & Chat Configuration */}
        <div className="card-premium p-8 space-y-8 lg:col-span-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <MessageCircle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">WhatsApp API & Chat</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Configure automated notifications and chat restrictions.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-[#D4A843] border-b border-[var(--card-border)] pb-2 mb-4">WhatsApp Cloud API</h4>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">System API Token</label>
                <input
                  type="password"
                  value={settings.WHATSAPP_API_TOKEN || ''}
                  onChange={(e) => setSettings({ ...settings, WHATSAPP_API_TOKEN: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none font-mono text-xs"
                  placeholder="EAA..."
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Phone Number ID</label>
                <input
                  type="text"
                  value={settings.WHATSAPP_PHONE_NUMBER_ID || ''}
                  onChange={(e) => setSettings({ ...settings, WHATSAPP_PHONE_NUMBER_ID: e.target.value })}
                  className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm"
                  placeholder="101..."
                />
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold text-[#D4A843] border-b border-[var(--card-border)] pb-2 mb-4">Chat Constraints</h4>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Rate Limit (min)</label>
                  <input
                    type="number"
                    value={settings.CHAT_RATE_LIMIT_PER_MINUTE || ''}
                    onChange={(e) => setSettings({ ...settings, CHAT_RATE_LIMIT_PER_MINUTE: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Max Length</label>
                  <input
                    type="number"
                    value={settings.CHAT_MESSAGE_MAX_LENGTH || ''}
                    onChange={(e) => setSettings({ ...settings, CHAT_MESSAGE_MAX_LENGTH: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">History Limit</label>
                  <input
                    type="number"
                    value={settings.CHAT_HISTORY_LIMIT || ''}
                    onChange={(e) => setSettings({ ...settings, CHAT_HISTORY_LIMIT: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Auto Delete (hrs)</label>
                  <input
                    type="number"
                    value={settings.CHAT_AUTO_DELETE_HOURS || ''}
                    onChange={(e) => setSettings({ ...settings, CHAT_AUTO_DELETE_HOURS: e.target.value })}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Rules */}
        <div className="card-premium p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600">
              <Fingerprint size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Attendance & Fines</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Shift timings and biometric penalty rules.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Shift Starts</label>
              <input
                type="time"
                value={settings.ATTENDANCE_SHIFT_START_TIME || ''}
                onChange={(e) => setSettings({ ...settings, ATTENDANCE_SHIFT_START_TIME: e.target.value })}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Late Threshold (Mins)</label>
              <input
                type="number"
                value={settings.ATTENDANCE_LATE_THRESHOLD_MINUTES || ''}
                onChange={(e) => setSettings({ ...settings, ATTENDANCE_LATE_THRESHOLD_MINUTES: e.target.value })}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Late Fine (Rs.)</label>
              <input
                type="number"
                value={settings.ATTENDANCE_LATE_FINE_AMOUNT || ''}
                onChange={(e) => setSettings({ ...settings, ATTENDANCE_LATE_FINE_AMOUNT: e.target.value })}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-3">Absent Fine (Rs.)</label>
              <input
                type="number"
                value={settings.ATTENDANCE_ABSENT_FINE_AMOUNT || ''}
                onChange={(e) => setSettings({ ...settings, ATTENDANCE_ABSENT_FINE_AMOUNT: e.target.value })}
                className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm"
              />
            </div>
          </div>
        </div>

        {/* Chat Ban Management */}
        <div className="card-premium p-8 space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600">
              <Ban size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Chat Ban Control</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">Ban users from participating in team chat.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <select
              value={banForm.userId}
              onChange={(e) => setBanForm({ ...banForm, userId: e.target.value })}
              className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm appearance-none"
            >
              <option value="">Select User</option>
              {userOptions.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
            <input
              type="text"
              placeholder="Reason"
              value={banForm.reason}
              onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
              className="flex-1 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl p-4 text-[var(--text-primary)] focus:border-[#D4A843] transition-all outline-none text-sm"
            />
            <button
              onClick={handleBanUser}
              disabled={banSaving || !banForm.userId}
              className="bg-red-600 text-white px-6 py-4 rounded-2xl text-sm font-bold disabled:opacity-50 hover:bg-red-700 transition-all active:scale-95"
            >
              Ban
            </button>
          </div>

          <div className="max-h-[240px] overflow-y-auto space-y-3 pr-2 scrollbar-premium">
            {bans.map(ban => (
              <div key={ban._id} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)] hover:border-red-500/20 transition-all">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{ban.userName}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{ban.reason || 'No reason specified'}</p>
                </div>
                <button 
                  onClick={() => handleUnbanUser(ban.userId)} 
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-all"
                >
                  Unban
                </button>
              </div>
            ))}
            {bans.length === 0 && (
              <div className="text-center py-8 text-xs text-[var(--text-tertiary)] italic">No active bans found.</div>
            )}
          </div>
        </div>

        {/* Campaign Management */}
        <div className="card-premium p-8 space-y-8 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-[#D4A843]/10 flex items-center justify-center text-[#D4A843]">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Campaign Management</h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">Manage your active forms and campaigns.</p>
              </div>
            </div>
            <button onClick={loadCampaigns} className="bg-[var(--background)] border border-[var(--card-border)] px-4 py-2 rounded-xl text-xs font-bold text-[#D4A843] hover:text-[#B8923A] transition-all">
               Refresh List
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map(c => (
              <div key={c._id} className="group p-6 bg-[var(--background)] border border-[var(--card-border)] rounded-[2rem] hover:border-[#D4A843]/30 hover:shadow-2xl transition-all relative">
                {editId === c._id ? (
                  <div className="space-y-4">
                    <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white border border-[var(--card-border)] p-3 rounded-xl text-sm outline-none focus:border-[#D4A843]" />
                    <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-white border border-[var(--card-border)] p-3 rounded-xl text-xs outline-none focus:border-[#D4A843]" rows={3} />
                    <div className="flex gap-2">
                      <button onClick={saveCampaign} className="flex-1 py-3 bg-[#D4A843] text-[#101013] rounded-xl text-xs font-bold">Save</button>
                      <button onClick={() => setEditId(null)} className="flex-1 py-3 bg-white border border-[var(--card-border)] text-[var(--text-secondary)] rounded-xl text-xs font-bold">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[var(--text-primary)] group-hover:text-[#D4A843] transition-colors truncate text-lg">{c.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                           <p className="text-[10px] text-[var(--text-tertiary)] font-medium">Created: {formatUSDate(c.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <button onClick={() => startEditCampaign(c)} className="p-2.5 hover:bg-[#D4A843]/10 text-[var(--text-tertiary)] hover:text-[#D4A843] rounded-xl transition-all"><Pencil size={14} /></button>
                        <button onClick={() => deleteCampaign(c._id)} className="p-2.5 hover:bg-red-500/10 text-[var(--text-tertiary)] hover:text-red-500 rounded-xl transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">{c.description || 'No description provided for this campaign.'}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Biometric Integration Guide */}
      <section className="bg-gradient-to-br from-[#101013] to-[#1A1A1F] rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4A843]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <div className="h-16 w-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center mb-10 border border-white/10 backdrop-blur-xl">
              <Fingerprint size={32} className="text-[#D4A843]" />
            </div>
            <h2 className="text-4xl font-bold mb-6">Biometric Integration</h2>
            <p className="text-slate-400 leading-relaxed mb-10 text-lg">
              Synchronize your Hikvision DS-K1T342EFWX terminals with the cloud platform for real-time attendance tracking and automated payroll.
            </p>
            <div className="bg-black/30 rounded-[2.5rem] border border-white/5 p-10 space-y-8">
              <div className="flex gap-6">
                <div className="h-10 w-10 rounded-full bg-[#D4A843]/20 text-[#D4A843] flex items-center justify-center font-bold text-sm flex-shrink-0 border border-[#D4A843]/30 shadow-lg shadow-[#D4A843]/10">1</div>
                <div>
                  <p className="font-bold text-white mb-2 text-lg">Set HTTP Host</p>
                  <p className="text-sm text-slate-400 leading-relaxed">Navigate to Network &gt; Advanced &gt; HTTP Host on your device and enable the listener mode.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="h-10 w-10 rounded-full bg-[#D4A843]/20 text-[#D4A843] flex items-center justify-center font-bold text-sm flex-shrink-0 border border-[#D4A843]/30 shadow-lg shadow-[#D4A843]/10">2</div>
                <div>
                  <p className="font-bold text-white mb-2 text-lg">Target Endpoint</p>
                  <code className="block bg-white/5 p-5 rounded-[1.5rem] border border-white/10 text-[#D4A843] text-xs break-all mt-4 font-mono shadow-inner">
                    https://cometbpo.org/api/attendance/webhook
                  </code>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                 <div className="h-10 w-10 rounded-xl bg-[#D4A843]/10 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-[#D4A843]" />
                 </div>
                 <h4 className="text-2xl font-bold">Device Compliance</h4>
              </div>
              <ul className="space-y-6">
                {[
                  'Enable Access Control & Attendance Events',
                  'Sync Biometric ID with CRM User Profile',
                  'Configure NTP for millisecond accuracy',
                  'Enable real-time push for instant logs'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 group">
                    <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <Check size={14} className="text-emerald-400" />
                    </div>
                    <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{item}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-12 w-full py-5 bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-white hover:bg-white/20 transition-all active:scale-95">
                 Download Device Manual (PDF)
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
