'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Key } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';

interface User {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  username?: string;
  role: 'Admin' | 'Supervisor' | 'User';
  permissions?: Record<string, boolean>;
  allowedFormFields?: string[];
  salary?: number;
  bonus?: number;
}

interface FormField {
  name: string;
  id: string;
  type: string;
}

export default function UserManagementPage() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [availableFields, setAvailableFields] = useState<FormField[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [showSalaryBonus, setShowSalaryBonus] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'User' as 'Admin' | 'Supervisor' | 'User',
    permissions: {
      canManageUsers: false,
      canManageForms: false,
      canViewSubmissions: false,
      canManageRequests: false,
      canDeleteForms: false,
      canEditForms: false,
      canCreateForms: false,
      canManageSettings: false,
      canManageChatRooms: false,
    },
    allowedFormFields: [] as string[],
    salary: 0,
    bonus: 0,
  });

  const permissions = useMemo(() => {
    const role = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
    return role ? getPermissions(role, session?.user?.permissions || undefined) : null;
  }, [session]);
  const canManageUsers = !!permissions?.canManageUsers;

  useEffect(() => {
    fetchUsers();
    fetchAvailableFields();
  }, []);

  useEffect(() => {
    const loadVisibility = async () => {
      try {
        const res = await fetch('/api/settings/public');
        const json = await res.json();
        if (json?.success && typeof json.data?.SHOW_SALARY_BONUS !== 'undefined') {
          setShowSalaryBonus(String(json.data.SHOW_SALARY_BONUS) !== '0');
        }
      } catch {
        // ignore
      }
    };
    loadVisibility();
  }, []);

  const fetchAvailableFields = async () => {
    try {
      setLoadingFields(true);
      const response = await fetch('/api/forms/fields');
      const result = await response.json();
      if (result.success) {
        setAvailableFields(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch form fields:', err);
    } finally {
      setLoadingFields(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      const result = await response.json();
      
      if (result.success) {
        setUsers(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    if (!canManageUsers) return;
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'User',
      permissions: {
        canManageUsers: false,
        canManageForms: false,
        canViewSubmissions: false,
        canManageRequests: false,
        canDeleteForms: false,
        canEditForms: false,
        canCreateForms: false,
        canManageSettings: false,
        canManageChatRooms: false,
      },
      allowedFormFields: [],
      salary: 0,
      bonus: 0,
    });
    setShowAddModal(true);
  };

  const handleEdit = (user: User) => {
    if (!canManageUsers) return;
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email || '',
      username: user.username || '',
      password: '',
      role: user.role,
      permissions: {
        canManageUsers: user.permissions?.canManageUsers ?? false,
        canManageForms: user.permissions?.canManageForms ?? false,
        canViewSubmissions: user.permissions?.canViewSubmissions ?? false,
        canManageRequests: user.permissions?.canManageRequests ?? false,
        canDeleteForms: user.permissions?.canDeleteForms ?? false,
        canEditForms: user.permissions?.canEditForms ?? false,
        canCreateForms: user.permissions?.canCreateForms ?? false,
        canManageSettings: user.permissions?.canManageSettings ?? false,
        canManageChatRooms: user.permissions?.canManageChatRooms ?? false,
      },
      allowedFormFields: user.allowedFormFields || [],
      salary: user.salary ?? 0,
      bonus: user.bonus ?? 0,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!canManageUsers) return;
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        setUsers(users.filter(user => user._id !== id));
      } else {
        alert(result.error || 'Failed to delete user');
      }
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleResetPassword = async (id: string) => {
    if (!canManageUsers) return;
    const newPassword = prompt('Enter new password:');
    if (!newPassword) return;

    try {
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: id,
          newPassword: newPassword,
        }),
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Password reset successfully');
      } else {
        alert(result.error || 'Failed to reset password');
      }
    } catch (err) {
      alert('Failed to reset password');
    }
  };

  const handleSave = async () => {
    try {
      let response;
      if (editingUser) {
        // Update existing user
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          username: formData.username,
          role: formData.role,
          permissions: formData.permissions,
          allowedFormFields: formData.allowedFormFields,
          salary: formData.salary,
          bonus: formData.bonus,
        };
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        response = await fetch(`/api/users/${editingUser._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
      } else {
        // Create new user
        response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
      }

      const result = await response.json();
      
      if (result.success) {
        setShowAddModal(false);
        fetchUsers(); // Refresh the list
      } else {
        alert(result.error || 'Failed to save user');
      }
    } catch (err) {
      alert('Failed to save user');
    }
  };

  return (
    <div className="p-4 md:p-6 bg-[#f6f9fc] min-h-screen">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-600">Manage system users and their roles</p>
      </div>

      {!canManageUsers && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          You do not have permission to manage users. Contact an admin for access.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 border-b border-slate-200">
          <div className="text-sm text-gray-700">
            Total Users <span className="font-semibold">({users.length})</span>
          </div>
          <button
            onClick={handleAddUser}
            disabled={!canManageUsers}
            className="inline-flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-md hover:bg-emerald-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">User ID</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Username</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Overrides</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-800">{user._id}</td>
                    <td className="px-4 py-3 text-slate-800">{user.name}</td>
                    <td className="px-4 py-3 text-slate-700">{user.email || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{user.username || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {user.permissions
                        ? Object.entries(user.permissions)
                            .filter(([_, v]) => v)
                            .map(([k]) => k.replace('can', '').replace(/([A-Z])/g, ' $1').trim())
                            .join(', ') || '—'
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          disabled={!canManageUsers}
                          className="inline-flex items-center gap-1 border border-slate-200 text-slate-700 px-3 py-1 rounded hover:bg-slate-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          disabled={!canManageUsers}
                          className="inline-flex items-center gap-1 border border-red-200 text-red-700 px-3 py-1 rounded hover:bg-red-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                        <button
                          onClick={() => handleResetPassword(user._id)}
                          disabled={!canManageUsers}
                          className="inline-flex items-center gap-1 border border-amber-200 text-amber-700 px-3 py-1 rounded hover:bg-amber-50 transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Key size={14} />
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-md md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username (required if no email)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'Admin' | 'Supervisor' | 'User' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                >
                  <option value="User">User</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              {showSalaryBonus && (formData.role === 'User' || formData.role === 'Supervisor') && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Salary</p>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter salary amount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                  />
                </div>
              )}
              {showSalaryBonus && (formData.role === 'User' || formData.role === 'Supervisor') && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Bonus</p>
                  <input
                    type="number"
                    value={formData.bonus}
                    onChange={(e) => setFormData({ ...formData, bonus: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter bonus amount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                  />
                </div>
              )}
              {(formData.role === 'User' || formData.role === 'Supervisor') && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Permission Overrides (optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {Object.entries(formData.permissions).map(([key, val]) => (
                      <label key={key} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, [key]: e.target.checked },
                            })
                          }
                          className="rounded"
                        />
                        <span className="text-gray-700">
                          {key
                            .replace('can', '')
                            .replace(/([A-Z])/g, ' $1')
                            .trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Overrides add or restrict abilities beyond the base role. Leave unchecked to inherit defaults.
                  </p>
                </div>
              )}
              {formData.role === 'User' && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Allowed Form Fields (for submissions view)
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Select which form fields this agent can see in their submissions. Leave empty to show all fields.
                  </p>
                  {loadingFields ? (
                    <p className="text-sm text-gray-500">Loading fields...</p>
                  ) : availableFields.length === 0 ? (
                    <p className="text-sm text-gray-500">No form fields available. Create forms first.</p>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3 bg-gray-50">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        {availableFields.map((field) => (
                          <label key={field.name} className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.allowedFormFields.includes(field.name)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({
                                    ...formData,
                                    allowedFormFields: [...formData.allowedFormFields, field.name],
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    allowedFormFields: formData.allowedFormFields.filter(f => f !== field.name),
                                  });
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-gray-700">
                              {field.name} <span className="text-gray-400 text-xs">({field.type})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
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

