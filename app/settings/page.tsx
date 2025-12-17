'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';

interface SettingsData {
  GOOGLE_SHEETS_ID?: string | null;
  GOOGLE_SHEETS_TAB_SUBMISSIONS?: string | null;
  GOOGLE_SHEETS_TAB_DAILY?: string | null;
  APP_NAME?: string | null;
  APP_LOGO_URL?: string | null;
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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

      <div className="bg-blue-50 border border-blue-100 text-blue-800 text-sm rounded-lg p-4">
        Credentials note: service account email/private key remain in environment variables.
        The Sheet ID and tab names saved here are stored in MongoDB for runtime use.
      </div>
    </div>
  );
}

