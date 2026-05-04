'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Megaphone, Loader2, FileText } from 'lucide-react';
import { useSession } from 'next-auth/react';

type Form = {
  _id: string;
  title: string;
  description?: string;
  campaign?: { _id: string; name: string } | null;
};

export default function AgentCampaignsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAgent = role === 'User' || role === 'Supervisor';

  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');

  useEffect(() => {
    const fetchForms = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('/api/forms');
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'Failed to load forms');
        }
        setForms(result.data || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load forms');
      } finally {
        setLoading(false);
      }
    };
    fetchForms();
  }, []);

  const campaigns = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    forms.forEach((f) => {
      if (f.campaign?._id) {
        map.set(f.campaign._id, { id: f.campaign._id, name: f.campaign.name });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [forms]);

  const filteredForms = useMemo(() => {
    if (selectedCampaign === 'all') return forms;
    return forms.filter((f) => f.campaign?._id === selectedCampaign);
  }, [forms, selectedCampaign]);

  if (!isAgent) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          <Megaphone size={16} />
          <span>This view is intended for agents and supervisors.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone size={24} className="text-blue-600" />
            Campaign Forms
          </h1>
          <p className="text-gray-600">Browse the forms for your campaigns.</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800 shadow-sm bg-white"
          >
            <option value="all">All campaigns</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-amber-800 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-6 flex items-center gap-3 text-gray-600 text-sm">
          <Loader2 size={18} className="animate-spin" />
          Loading forms...
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="p-6 text-sm text-gray-600 bg-white border border-slate-200 rounded-xl shadow-sm">
          No forms found for this selection.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredForms.map((form) => (
            <div key={form._id} className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{form.title}</h3>
                  <p className="text-xs text-gray-500">
                    {form.campaign?.name ? `Campaign: ${form.campaign.name}` : 'No campaign assigned'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{form.description || 'No description provided.'}</p>
              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/forms/${form._id}/preview`}
                  className="inline-flex items-center justify-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Open Form
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

