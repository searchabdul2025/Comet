'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Key, Eye, EyeOff, X, UserPlus, Save } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
    setShowPassword(false);
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
    setShowPassword(false);
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
        setEditingUser(null);
        fetchUsers(); // Refresh the list
      } else {
        alert(result.error || 'Failed to save user');
      }
    } catch (err) {
      alert('Failed to save user');
    }
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setEditingUser(null);
    setShowPassword(false);
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
  };

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-sm text-gray-600">Manage system users and their roles</p>
      </div>

      {!canManageUsers && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-amber-800 shadow-sm">
          You do not have permission to manage users. Contact an admin for access.
        </div>
      )}

      {showAddModal && (
        <div className="mb-6 bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                  {editingUser ? <Edit className="text-white" size={24} /> : <UserPlus className="text-white" size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h3>
                  <p className="text-emerald-50 text-sm mt-0.5">
                    {editingUser ? 'Update user information' : 'Create a new user account'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="username (required if no email)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                    {!editingUser && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-emerald-600 focus:outline-none transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Role <span className="text-red-500">*</span></label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'Admin' | 'Supervisor' | 'User' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
                  >
                    <option value="User">User</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              {showSalaryBonus && (formData.role === 'User' || formData.role === 'Supervisor') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Salary</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">PKR</span>
                      <input
                        type="number"
                        value={formData.salary === 0 ? '' : formData.salary}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, salary: value === '' ? 0 : parseFloat(value) || 0 });
                        }}
                        onFocus={(e) => {
                          if (formData.salary === 0) {
                            e.target.select();
                          }
                        }}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bonus</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">PKR</span>
                      <input
                        type="number"
                        value={formData.bonus === 0 ? '' : formData.bonus}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFormData({ ...formData, bonus: value === '' ? 0 : parseFloat(value) || 0 });
                        }}
                        onFocus={(e) => {
                          if (formData.bonus === 0) {
                            e.target.select();
                          }
                        }}
                        placeholder="0"
                        min="0"
                        step="0.01"
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-900 bg-gray-50 transition-all shadow-sm hover:shadow-md"
                      />
                    </div>
                  </div>
                </div>
              )}

              {(formData.role === 'User' || formData.role === 'Supervisor') && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Permission Overrides</label>
                  <p className="text-xs text-gray-500 mb-4">
                    Overrides add or restrict abilities beyond the base role. Leave unchecked to inherit defaults.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(formData.permissions).map(([key, val]) => (
                      <label 
                        key={key} 
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-emerald-50/50 hover:border-emerald-300 cursor-pointer transition-all"
                      >
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              permissions: { ...formData.permissions, [key]: e.target.checked },
                            })
                          }
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                        />
                        <span className="text-sm text-gray-700 font-medium">
                          {key
                            .replace('can', '')
                            .replace(/([A-Z])/g, ' $1')
                            .trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.role === 'User' && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Allowed Form Fields (for submissions view)
                  </label>
                  <p className="text-xs text-gray-500 mb-4">
                    Select which form fields this agent can see in their submissions. Leave empty to show all fields.
                  </p>
                  {loadingFields ? (
                    <div className="text-center py-8 text-gray-500">Loading fields...</div>
                  ) : availableFields.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-xl bg-gray-50">
                      No form fields available. Create forms first.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl p-4 bg-gradient-to-br from-gray-50 to-slate-50 space-y-2">
                      {availableFields.map((field) => (
                        <label 
                          key={field.name} 
                          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-white hover:shadow-sm cursor-pointer transition-all bg-white/50"
                        >
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
                            className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2"
                          />
                          <span className="text-sm text-gray-700 font-medium">
                            {field.name} <span className="text-gray-400 text-xs">({field.type})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl font-semibold"
                >
                  <Save size={20} />
                  {editingUser ? 'Update User' : 'Create User'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-slate-200">
          <div className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Total Users:</span> <span className="text-emerald-600 font-bold text-lg">{users.length}</span>
          </div>
          {!showAddModal && (
            <button
              onClick={handleAddUser}
              disabled={!canManageUsers}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed font-semibold"
            >
              <Plus size={20} />
              Add New User
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">User ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Overrides</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                    <p className="mt-2">Loading users...</p>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <p className="text-lg">No users found</p>
                    <p className="text-sm mt-1">Click "Add New User" to get started</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{user._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.username || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                        user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                        user.role === 'Supervisor' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {user.permissions
                        ? Object.entries(user.permissions)
                            .filter(([_, v]) => v)
                            .map(([k]) => k.replace('can', '').replace(/([A-Z])/g, ' $1').trim())
                            .join(', ') || '—'
                        : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          disabled={!canManageUsers}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          disabled={!canManageUsers}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                        <button
                          onClick={() => handleResetPassword(user._id)}
                          disabled={!canManageUsers}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 hover:border-amber-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Key size={14} />
                          Reset
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
    </div>
  );
}

