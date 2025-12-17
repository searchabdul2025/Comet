'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Key } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface User {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  username?: string;
  role: 'Admin' | 'Supervisor' | 'User';
  permissions?: Record<string, boolean>;
}

export default function UserManagementPage() {
  const pathname = usePathname();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'User' as 'Admin' | 'Supervisor' | 'User',
    permissions: {
      canManageUsers: false,
      canManageForms: false,
      canManageIPs: false,
      canViewSubmissions: false,
      canManageRequests: false,
      canDeleteForms: false,
      canEditForms: false,
      canCreateForms: false,
      canManageSettings: false,
    },
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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
        canManageIPs: false,
        canViewSubmissions: false,
        canManageRequests: false,
        canDeleteForms: false,
        canEditForms: false,
        canCreateForms: false,
        canManageSettings: false,
      },
    });
    setShowAddModal(true);
  };

  const handleEdit = (user: User) => {
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
        canManageIPs: user.permissions?.canManageIPs ?? false,
        canViewSubmissions: user.permissions?.canViewSubmissions ?? false,
        canManageRequests: user.permissions?.canManageRequests ?? false,
        canDeleteForms: user.permissions?.canDeleteForms ?? false,
        canEditForms: user.permissions?.canEditForms ?? false,
        canCreateForms: user.permissions?.canCreateForms ?? false,
        canManageSettings: user.permissions?.canManageSettings ?? false,
      },
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
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
          role: formData.role,
          permissions: formData.permissions,
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
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 mb-4">Manage forms, IP addresses, and submissions</p>
        
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {[
            { name: 'Dashboard', href: '/dashboard' },
            { name: 'Forms', href: '/forms' },
            { name: 'Submissions', href: '/dashboard?tab=Submissions' },
            { name: 'Requests', href: '/requests' },
            { name: 'IP Management', href: '/ip-management' },
            { name: 'User Management', href: '/user-management' },
          ].map((tab) => {
            const isActive = pathname === tab.href || (tab.href.includes('?') && pathname === tab.href.split('?')[0]);
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`pb-3 px-4 ${
                  isActive
                    ? 'border-b-2 border-blue-600 text-blue-600 font-medium'
                    : 'text-gray-600 hover:text-gray-800'
                } transition-colors`}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
            <p className="text-gray-600">Manage system users and their roles</p>
          </div>
          <button
            onClick={handleAddUser}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-800">All Users ({users.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Password</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overrides</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user._id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username || '—'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">••••••••</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.permissions
                      ? Object.entries(user.permissions)
                          .filter(([_, v]) => v)
                          .map(([k]) => k.replace('can', '').replace(/([A-Z])/g, ' $1').trim())
                          .join(', ') || '—'
                      : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                      >
                        <Edit size={14} className="inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                      >
                        <Trash2 size={14} className="inline mr-1" />
                        Delete
                      </button>
                      <button
                        onClick={() => handleResetPassword(user._id)}
                        className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
                      >
                        <Key size={14} className="inline mr-1" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
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

