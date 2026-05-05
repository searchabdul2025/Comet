'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';
import { Pencil, Save, Trash2, X, MessageCircle, ShieldX, Ban, UserCheck, Sparkles, Activity } from 'lucide-react';

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
            APP_FAVICON_URL: result.data.APP_FAVICON_URL || '',
            CHAT_RATE_LIMIT_PER_MINUTE: result.data.CHAT_RATE_LIMIT_PER_MINUTE || '15',
            CHAT_MESSAGE_MAX_LENGTH: result.data.CHAT_MESSAGE_MAX_LENGTH || '500',
            CHAT_HISTORY_LIMIT: result.data.CHAT_HISTORY_LIMIT || '50',
            CHAT_AUTO_DELETE_HOURS: result.data.CHAT_AUTO_DELETE_HOURS || '0',
            BONUS_PER_SUBMISSION: result.data.BONUS_PER_SUBMISSION || '0',
            BONUS_TARGET_BONUS: result.data.BONUS_TARGET_BONUS || '0',
            SHOW_SALARY_BONUS: typeof result.data.SHOW_SALARY_BONUS !== 'undefined' ? String(result.data.SHOW_SALARY_BONUS) : '1',
            WHATSAPP_API_TOKEN: result.data.WHATSAPP_API_TOKEN || '',
            WHATSAPP_PHONE_NUMBER_ID: result.data.WHATSAPP_PHONE_NUMBER_ID || '',
            ATTENDANCE_SHIFT_START_TIME: result.data.ATTENDANCE_SHIFT_START_TIME || '09:00',
            ATTENDANCE_SHIFT_END_TIME: result.data.ATTENDANCE_SHIFT_END_TIME || '18:00',
            ATTENDANCE_LATE_THRESHOLD_MINUTES: result.data.ATTENDANCE_LATE_THRESHOLD_MINUTES || '15',
            ATTENDANCE_LATE_FINE_AMOUNT: result.data.ATTENDANCE_LATE_FINE_AMOUNT || '0',
            ATTENDANCE_ABSENT_FINE_AMOUNT: result.data.ATTENDANCE_ABSENT_FINE_AMOUNT || '0',
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1 tracking-tight">Settings</h1>
          <p className="text-gray-500">Global configurations for your portal.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {saving ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>

      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <UserCheck size={18} /> : <ShieldX size={18} />}
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Branding & Platform */}
        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Branding</h3>
              <p className="text-xs text-slate-500">Configure how the portal looks to users.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Application Name</label>
                <input
                  type="text"
                  value={settings.APP_NAME || ''}
                  onChange={(e) => setSettings({ ...settings, APP_NAME: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50/50 hover:bg-slate-50 text-slate-900"
                  placeholder="e.g., Comet CRM"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Logo URL</label>
                  <input
                    type="text"
                    value={settings.APP_LOGO_URL || ''}
                    onChange={(e) => setSettings({ ...settings, APP_LOGO_URL: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50/50 hover:bg-slate-50 text-slate-900"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Favicon URL</label>
                  <input
                    type="text"
                    value={settings.APP_FAVICON_URL || ''}
                    onChange={(e) => setSettings({ ...settings, APP_FAVICON_URL: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-slate-50/50 hover:bg-slate-50 text-slate-900"
                    placeholder="/favicon.ico"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bonus & Salary Rules */}
        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bonus & Salary</h3>
              <p className="text-xs text-slate-500">Define financial rewards for agent performance.</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={String(settings.SHOW_SALARY_BONUS || '1') !== '0'}
                  onChange={(e) => setSettings({ ...settings, SHOW_SALARY_BONUS: e.target.checked ? '1' : '0' })}
                  className="sr-only"
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${String(settings.SHOW_SALARY_BONUS || '1') !== '0' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${String(settings.SHOW_SALARY_BONUS || '1') !== '0' ? 'translate-x-4' : ''}`}></div>
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Visible in Agent Portal</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Submission Bonus</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rs.</span>
                  <input
                    type="number"
                    value={settings.BONUS_PER_SUBMISSION || ''}
                    onChange={(e) => setSettings({ ...settings, BONUS_PER_SUBMISSION: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Target Bonus</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rs.</span>
                  <input
                    type="number"
                    value={settings.BONUS_TARGET_BONUS || ''}
                    onChange={(e) => setSettings({ ...settings, BONUS_TARGET_BONUS: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/50 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Chat Configuration */}
        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageCircle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Chat Settings</h3>
              <p className="text-xs text-slate-500">Control limits and disappearing messages.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Disappearing Messages</label>
              <select
                value={settings.CHAT_AUTO_DELETE_HOURS || '0'}
                onChange={(e) => setSettings({ ...settings, CHAT_AUTO_DELETE_HOURS: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
              >
                <option value="0">Never (Persistent)</option>
                <option value="1">1 Hour</option>
                <option value="12">12 Hours</option>
                <option value="24">24 Hours (1 Day)</option>
                <option value="168">7 Days (1 Week)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Max Chars</label>
              <input
                type="number"
                value={settings.CHAT_MESSAGE_MAX_LENGTH || ''}
                onChange={(e) => setSettings({ ...settings, CHAT_MESSAGE_MAX_LENGTH: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-900"
              />
            </div>
          </div>
        </section>

        {/* Attendance & Biometric Rules */}
        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <UserCheck size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Attendance Rules</h3>
              <p className="text-xs text-slate-500">Define shift times and fine amounts.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Shift Starts</label>
                <input
                  type="time"
                  value={settings.ATTENDANCE_SHIFT_START_TIME || ''}
                  onChange={(e) => setSettings({ ...settings, ATTENDANCE_SHIFT_START_TIME: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Late Mark After</label>
                <div className="relative">
                  <input
                    type="number"
                    value={settings.ATTENDANCE_LATE_THRESHOLD_MINUTES || ''}
                    onChange={(e) => setSettings({ ...settings, ATTENDANCE_LATE_THRESHOLD_MINUTES: e.target.value })}
                    className="w-full pr-12 pl-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50 text-slate-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">mins</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Late Fine</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rs.</span>
                  <input
                    type="number"
                    value={settings.ATTENDANCE_LATE_FINE_AMOUNT || ''}
                    onChange={(e) => setSettings({ ...settings, ATTENDANCE_LATE_FINE_AMOUNT: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50 text-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Absent Fine</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rs.</span>
                  <input
                    type="number"
                    value={settings.ATTENDANCE_ABSENT_FINE_AMOUNT || ''}
                    onChange={(e) => setSettings({ ...settings, ATTENDANCE_ABSENT_FINE_AMOUNT: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50/50 text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Hikvision Webhook Guide - Pro Section */}
      <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Activity className="text-blue-400" size={26} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Biometric Integration</h2>
              <p className="text-slate-400 text-sm">Configure your Hikvision DS-K1T342EFWX for real-time sync.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-sm">
              <div className="inline-block px-3 py-1 rounded-full bg-blue-500 text-[10px] font-bold uppercase tracking-widest mb-4">Recommended</div>
              <h4 className="text-lg font-bold mb-4">Direct Webhook Method</h4>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                Configure your machine to push data directly to our secure cloud endpoint. No local scripts required.
              </p>
              <div className="space-y-4 font-mono text-[11px]">
                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                  <p className="text-slate-500 mb-1">// Destination URL</p>
                  <p className="text-blue-400 break-all">https://cometbpo.org/api/attendance/webhook</p>
                </div>
                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                  <p className="text-slate-500 mb-1">// Port & Events</p>
                  <p className="text-white">Port: 443 | Enable Access & Attendance Events</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-lg font-bold">Important Instructions</h4>
              <ul className="space-y-4">
                {[
                  { title: "Biometric ID Mapping", desc: "Ensure the User's Biometric ID in the portal matches the ID assigned on the machine." },
                  { title: "NTP Time Sync", desc: "Enable Network Time Protocol on the machine to ensure accurate check-in timestamps." },
                  { title: "Network Host", desc: "Set the device to 'HTTP Host' or 'HTTP Listening' mode in advanced network settings." }
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5">{item.title}</p>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
