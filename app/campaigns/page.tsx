'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function CampaignsPage() {
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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">Campaigns</h1>
          <p className="text-gray-600">Create a campaign before building forms and assign forms to it.</p>
        </div>
      </div>

      {permissions?.canCreateForms && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Create Campaign</h2>
            <span className="text-xs text-gray-500">Step 1 before creating a form</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter campaign name"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Plus size={18} />
              {submitting ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Campaign List ({campaigns.length})</h2>
          <button
            onClick={fetchCampaigns}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading campaigns...</p>
        ) : campaigns.length === 0 ? (
          <p className="text-gray-500">No campaigns yet. Create one to start building forms.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <div key={campaign._id} className="border border-gray-200 rounded-lg p-4 bg-white space-y-2">
                {editingId === campaign._id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                    />
                    <input
                      type="text"
                      value={editingDesc}
                      onChange={(e) => setEditingDesc(e.target.value)}
                      placeholder="Description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdate(campaign._id)}
                        disabled={editSaving}
                        className="flex-1 inline-flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm"
                      >
                        <Save size={16} />
                        {editSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 inline-flex items-center justify-center gap-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-bold text-gray-800 mb-1">{campaign.name}</h3>
                    {campaign.description && (
                      <p className="text-sm text-gray-600 mb-2">{campaign.description}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Created {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </>
                )}
                {permissions?.canManageForms && editingId !== campaign._id && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => startEdit(campaign)}
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-gray-100 text-gray-800 px-3 py-2 rounded-md text-sm hover:bg-gray-200"
                    >
                      <Pencil size={16} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(campaign._id)}
                      className="flex-1 inline-flex items-center justify-center gap-1 bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm hover:bg-red-200"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


