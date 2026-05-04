'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Key, Users, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';

interface ChatRoom {
  _id: string;
  name: string;
  description?: string;
  createdBy: {
    _id: string;
    name?: string;
    email?: string;
    username?: string;
  };
  isActive: boolean;
  maxParticipants?: number;
  visibility: 'public' | 'private' | 'invite-only';
  allowedRoles?: ('Admin' | 'Supervisor' | 'User')[];
  allowedUsers?: string[];
  showInSidebar: boolean;
  requireApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Credential {
  _id: string;
  username: string;
  displayName?: string;
  isActive: boolean;
  lastUsedAt?: string;
  createdBy: {
    _id: string;
    name?: string;
    email?: string;
  };
  createdAt: string;
}

export default function ChatRoomsPage() {
  const { data: session } = useSession();
  const [chatrooms, setChatrooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<ChatRoom | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showCredentials, setShowCredentials] = useState(false);
  const [newCredential, setNewCredential] = useState({ username: '', password: '', displayName: '', useAccountCredentials: false, selectedUserId: '' });
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [supervisors, setSupervisors] = useState<Array<{ _id: string; name: string; username?: string; email?: string }>>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxParticipants: '',
    isActive: true,
    visibility: 'private' as 'public' | 'private' | 'invite-only',
    allowedRoles: [] as ('Admin' | 'Supervisor' | 'User')[],
    allowedUsers: [] as string[],
    showInSidebar: true,
    requireApproval: false,
  });
  const [allUsers, setAllUsers] = useState<Array<{ _id: string; name: string; email?: string }>>([]);

  const permissions = useMemo(() => {
    const role = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
    return role ? getPermissions(role, session?.user?.permissions || undefined) : null;
  }, [session]);
  const canManage = !!permissions?.canManageChatRooms;

  useEffect(() => {
    if (canManage) {
      fetchChatrooms();
      fetchSupervisors();
    }
  }, [canManage]);

  const fetchSupervisors = async () => {
    try {
      const res = await fetch('/api/users');
      const json = await res.json();
      if (json.success) {
        // Filter only supervisors
        const supervisorsList = (json.data || []).filter((u: any) => u.role === 'Supervisor');
        setSupervisors(supervisorsList);
      }
    } catch (err: any) {
      console.error('Failed to fetch supervisors:', err);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      fetchCredentials(selectedRoom);
    }
  }, [selectedRoom]);

  const fetchChatrooms = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/chatrooms');
      const json = await res.json();
      if (json.success) {
        setChatrooms(json.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch chatrooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCredentials = async (roomId: string) => {
    try {
      const res = await fetch(`/api/chatrooms/${roomId}/credentials`);
      const json = await res.json();
      if (json.success) {
        setCredentials(json.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch credentials:', err);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetch('/api/chatrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : undefined,
          visibility: formData.visibility,
          allowedRoles: formData.allowedRoles.length > 0 ? formData.allowedRoles : undefined,
          allowedUsers: formData.allowedUsers.length > 0 ? formData.allowedUsers : undefined,
          showInSidebar: formData.showInSidebar,
          requireApproval: formData.requireApproval,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create chatroom');
      setShowAddModal(false);
      setFormData({ name: '', description: '', maxParticipants: '', isActive: true, visibility: 'private', allowedRoles: [], allowedUsers: [], showInSidebar: true, requireApproval: false });
      fetchChatrooms();
    } catch (err: any) {
      alert(err.message || 'Failed to create chatroom');
    }
  };

  const handleUpdate = async () => {
    if (!editingRoom) return;
    try {
      const res = await fetch(`/api/chatrooms/${editingRoom._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : undefined,
          isActive: formData.isActive,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to update chatroom');
      setEditingRoom(null);
      setFormData({ name: '', description: '', maxParticipants: '', isActive: true, visibility: 'private', allowedRoles: [], allowedUsers: [], showInSidebar: true, requireApproval: false });
      fetchChatrooms();
    } catch (err: any) {
      alert(err.message || 'Failed to update chatroom');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this chatroom?')) return;
    try {
      const res = await fetch(`/api/chatrooms/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to delete chatroom');
      fetchChatrooms();
    } catch (err: any) {
      alert(err.message || 'Failed to delete chatroom');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleCreateCredential = async () => {
    if (!selectedRoom) return;
    
    // If using account credentials, we need to fetch the user's password
    let username = newCredential.username;
    let password = newCredential.password;
    
    if (newCredential.useAccountCredentials && newCredential.selectedUserId) {
      // Fetch user details to get username/password
      try {
        const userRes = await fetch(`/api/users/${newCredential.selectedUserId}`);
        const userJson = await userRes.json();
        if (userJson.success && userJson.data) {
          const user = userJson.data;
          username = user.username || user.email || '';
          // We need to get the password from the user - but we can't retrieve hashed passwords
          // So we'll use a special flag to indicate account credentials should be used
          // The API will handle this differently
        }
      } catch (err) {
        alert('Failed to fetch user details');
        return;
      }
    }
    
    if (!username || (!password && !newCredential.useAccountCredentials)) {
      alert('Username and password are required');
      return;
    }

    try {
      const res = await fetch(`/api/chatrooms/${selectedRoom}/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password: newCredential.useAccountCredentials ? undefined : password,
          displayName: newCredential.displayName || undefined,
          useAccountCredentials: newCredential.useAccountCredentials,
          userId: newCredential.useAccountCredentials ? newCredential.selectedUserId : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to create credential');
      
      setGeneratedPassword(json.data.plainPassword || (newCredential.useAccountCredentials ? 'Same as account password' : password));
      setNewCredential({ username: '', password: '', displayName: '', useAccountCredentials: false, selectedUserId: '' });
      fetchCredentials(selectedRoom);
    } catch (err: any) {
      alert(err.message || 'Failed to create credential');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!canManage) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg">
          Only admins can manage chatrooms.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={28} className="text-blue-500" />
            Chatroom Management
          </h1>
          <p className="text-gray-600">Create and manage personal chatrooms with credentials.</p>
        </div>
        <button
          onClick={() => {
            setShowAddModal(true);
            setEditingRoom(null);
            setFormData({ name: '', description: '', maxParticipants: '', isActive: true, visibility: 'private', allowedRoles: [], allowedUsers: [], showInSidebar: true, requireApproval: false });
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Create Chatroom
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading chatrooms...</div>
      ) : chatrooms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No chatrooms found. Create one to get started.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Created By</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {chatrooms.map((room) => (
                <tr key={room._id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{room.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{room.description || '—'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      room.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {room.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {room.createdBy?.name || room.createdBy?.email || room.createdBy?.username || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedRoom(room._id);
                          setShowCredentials(true);
                          setGeneratedPassword(null);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                        title="Manage Credentials"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditingRoom(room);
                          setFormData({
                            name: room.name,
                            description: room.description || '',
                            maxParticipants: room.maxParticipants?.toString() || '',
                            isActive: room.isActive,
                            visibility: room.visibility || 'private',
                            allowedRoles: room.allowedRoles || [],
                            allowedUsers: room.allowedUsers || [],
                            showInSidebar: room.showInSidebar !== undefined ? room.showInSidebar : true,
                            requireApproval: room.requireApproval || false,
                          });
                          setShowAddModal(true);
                        }}
                        className="text-amber-600 hover:text-amber-700"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(room._id)}
                        className="text-red-600 hover:text-red-700"
                        title="Deactivate"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900">
              {editingRoom ? 'Edit Chatroom' : 'Create Chatroom'}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Management Chatroom"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
                <input
                  type="number"
                  value={formData.maxParticipants}
                  onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional limit"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visibility *</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'public' | 'private' | 'invite-only' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="private">Private (Credentials Only)</option>
                  <option value="public">Public (Role-based Access)</option>
                  <option value="invite-only">Invite Only (Specific Users)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.visibility === 'private' && 'Only users with credentials can access'}
                  {formData.visibility === 'public' && 'Users with allowed roles can access'}
                  {formData.visibility === 'invite-only' && 'Only specific users or those with credentials can access'}
                </p>
              </div>

              {(formData.visibility === 'public' || formData.visibility === 'invite-only') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Roles</label>
                  <div className="space-y-2">
                    {['Admin', 'Supervisor', 'User'].map((role) => (
                      <label key={role} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.allowedRoles.includes(role as 'Admin' | 'Supervisor' | 'User')}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, allowedRoles: [...formData.allowedRoles, role as 'Admin' | 'Supervisor' | 'User'] });
                            } else {
                              setFormData({ ...formData, allowedRoles: formData.allowedRoles.filter(r => r !== role) });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.visibility === 'invite-only' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Users</label>
                  <select
                    multiple
                    value={formData.allowedUsers}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFormData({ ...formData, allowedUsers: selected });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  >
                    {allUsers.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} {user.email && `(${user.email})`}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple users</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.showInSidebar}
                  onChange={(e) => setFormData({ ...formData, showInSidebar: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm font-medium text-gray-700">Show in Sidebar</label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.requireApproval}
                  onChange={(e) => setFormData({ ...formData, requireApproval: e.target.checked })}
                  className="rounded"
                />
                <label className="text-sm font-medium text-gray-700">Require Approval to Join</label>
              </div>

              {editingRoom && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">Active</label>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={editingRoom ? handleUpdate : handleCreate}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingRoom ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingRoom(null);
                  setFormData({ name: '', description: '', maxParticipants: '', isActive: true, visibility: 'private', allowedRoles: [], allowedUsers: [], showInSidebar: true, requireApproval: false });
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Manage Credentials</h2>
              <button
                onClick={() => {
                  setShowCredentials(false);
                  setSelectedRoom(null);
                  setGeneratedPassword(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <EyeOff size={20} />
              </button>
            </div>

            {generatedPassword && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 mb-2">Credential Created Successfully!</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white rounded p-2">
                    <span className="text-sm font-mono">{generatedPassword}</span>
                    <button
                      onClick={() => copyToClipboard(generatedPassword)}
                      className="text-green-600 hover:text-green-700"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-green-700">Save this password - it won't be shown again!</p>
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Create New Credential</h3>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={newCredential.useAccountCredentials}
                      onChange={(e) => {
                        setNewCredential({ 
                          ...newCredential, 
                          useAccountCredentials: e.target.checked,
                          username: e.target.checked ? '' : newCredential.username,
                          password: e.target.checked ? '' : newCredential.password,
                        });
                      }}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Use Supervisor Account Credentials</span>
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    If checked, the supervisor's account username and password will be used. Otherwise, create custom credentials.
                  </p>
                </div>
                
                {newCredential.useAccountCredentials ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Supervisor *</label>
                    <select
                      value={newCredential.selectedUserId}
                      onChange={(e) => {
                        const selected = supervisors.find(s => s._id === e.target.value);
                        setNewCredential({ 
                          ...newCredential, 
                          selectedUserId: e.target.value,
                          username: selected?.username || selected?.email || '',
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a supervisor...</option>
                      {supervisors.map((supervisor) => (
                        <option key={supervisor._id} value={supervisor._id}>
                          {supervisor.name} {supervisor.username && `(${supervisor.username})`} {supervisor.email && `[${supervisor.email}]`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      The supervisor's account username and password will be used for this chatroom credential.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                      <input
                        type="text"
                        value={newCredential.username}
                        onChange={(e) => setNewCredential({ ...newCredential, username: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCredential.password}
                          onChange={(e) => setNewCredential({ ...newCredential, password: e.target.value })}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter password or generate"
                        />
                        <button
                          onClick={() => setNewCredential({ ...newCredential, password: generatePassword() })}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name (Optional)</label>
                  <input
                    type="text"
                    value={newCredential.displayName}
                    onChange={(e) => setNewCredential({ ...newCredential, displayName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>
                <button
                  onClick={handleCreateCredential}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Credential
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Existing Credentials</h3>
              {credentials.length === 0 ? (
                <p className="text-sm text-gray-500">No credentials yet. Create one above.</p>
              ) : (
                <div className="space-y-2">
                  {credentials.map((cred) => (
                    <div key={cred._id} className="flex items-center justify-between bg-gray-50 rounded p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{cred.username}</p>
                        {cred.displayName && (
                          <p className="text-xs text-gray-500">{cred.displayName}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          {cred.isActive ? 'Active' : 'Inactive'} • Last used: {cred.lastUsedAt ? new Date(cred.lastUsedAt).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        cred.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {cred.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

