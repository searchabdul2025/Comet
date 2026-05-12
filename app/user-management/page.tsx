'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Key, Eye, EyeOff, X, UserPlus, Save, Users, BarChart3, Megaphone, Sparkles, ShieldCheck, Check } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';
import PageHeader from '@/components/ui/PageHeader';
import StatGrid from '@/components/ui/StatGrid';
import FilterBar from '@/components/ui/FilterBar';
import PremiumTable from '@/components/ui/PremiumTable';

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
      canManageIPs: false,
      canDeleteSubmissions: false,
      canManageGoogleSheets: false,
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
        canManageIPs: false,
        canDeleteSubmissions: false,
        canManageGoogleSheets: false,
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
        canManageIPs: user.permissions?.canManageIPs ?? false,
        canDeleteSubmissions: user.permissions?.canDeleteSubmissions ?? false,
        canManageGoogleSheets: user.permissions?.canManageGoogleSheets ?? false,
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
        canManageIPs: false,
        canDeleteSubmissions: false,
        canManageGoogleSheets: false,
      },
      allowedFormFields: [],
      salary: 0,
      bonus: 0,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        description="Manage system users and their roles"
        action={canManageUsers ? {
          label: "Add New User",
          onClick: handleAddUser,
          icon: UserPlus
        } : undefined}
      />

      {!canManageUsers && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-amber-800 shadow-sm mb-6">
          You do not have permission to manage users. Contact an admin for access.
        </div>
      )}

      {/* Stats Overview */}
      <StatGrid 
        loading={loading}
        stats={[
          { 
            label: 'Total Users', 
            value: users.length,
            icon: '👥',
            sparkColor: '#D4A843',
            sparkData: [10, 12, 15, 18, 20, 22, 24]
          },
          { 
            label: 'Active Users', 
            value: users.length, // Simulating active for now
            icon: '✅',
            sparkColor: '#16a34a',
            sparkData: [8, 10, 12, 14, 16, 18, 20]
          },
          { 
            label: 'Inactive', 
            value: 0,
            icon: '⏳',
            sparkColor: '#9CA3AF',
            sparkData: [0, 0, 0, 0, 0, 0, 0]
          }
        ]}
      />

      {/* Filter & Search */}
      <FilterBar 
        searchPlaceholder="Search users..."
        filters={[
          {
            label: 'All Roles',
            options: [
              { label: 'Admin', value: 'Admin' },
              { label: 'Supervisor', value: 'Supervisor' },
              { label: 'User', value: 'User' }
            ],
            onChange: () => {} // Implement filtering logic
          },
          {
            label: 'Status',
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' }
            ],
            onChange: () => {}
          }
        ]}
      />

      {/* Users Table */}
      <PremiumTable 
        loading={loading}
        data={users}
        columns={[
          {
            header: 'User',
            accessor: (user) => (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#D4A843] to-[#B8923A] flex items-center justify-center text-[#101013] text-xs font-bold shadow-lg shadow-[#D4A843]/10">
                  {(user.name || user.username || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{user.name}</div>
                  <div className="text-[11px] text-[var(--text-tertiary)]">{user.username || user.email}</div>
                </div>
              </div>
            )
          },
          { header: 'Email', accessor: 'email' },
          { header: 'Username', accessor: 'username' },
          {
            header: 'Role',
            accessor: (user) => (
              <span className={`px-3 py-1 inline-flex text-[10px] font-bold rounded-full uppercase tracking-wider ${
                user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                user.role === 'Supervisor' ? 'bg-blue-100 text-blue-800' :
                'bg-emerald-100 text-emerald-800'
              }`}>
                {user.role}
              </span>
            )
          },
          {
            header: 'Status',
            accessor: () => (
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <span className="text-[11px] font-bold text-emerald-600 uppercase">Active</span>
              </div>
            )
          },
          {
            header: 'Actions',
            align: 'right',
            accessor: (user) => (
              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => handleEdit(user)}
                  className="p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all"
                >
                  <Edit size={14} />
                </button>
                <button 
                  onClick={() => handleResetPassword(user._id)}
                  className="p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all"
                >
                  <Key size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(user._id)}
                  className="p-2 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/30 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )
          }
        ]}
      />

      {/* Modals/Forms (Kept existing logic) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#101013]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-scale-in">
            {/* Modal content from original code, styled for premium */}
            <div className="bg-gradient-to-r from-[#D4A843] to-[#B8923A] px-8 py-6 flex items-center justify-between">
               <h3 className="text-xl font-bold text-[#101013]">{editingUser ? 'Edit User' : 'Add New User'}</h3>
               <button onClick={handleCancel} className="p-2 hover:bg-black/5 rounded-full"><X size={20}/></button>
            </div>
            <div className="p-8 max-h-[80vh] overflow-y-auto space-y-6 scrollbar-premium">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-2">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter full name"
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    className="w-full px-5 py-3 rounded-2xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none focus:border-[#D4A843] text-sm" 
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-2">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="email@example.com"
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    className="w-full px-5 py-3 rounded-2xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none focus:border-[#D4A843] text-sm" 
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-2">Username</label>
                  <input 
                    type="text" 
                    placeholder="username"
                    value={formData.username} 
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })} 
                    className="w-full px-5 py-3 rounded-2xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none focus:border-[#D4A843] text-sm" 
                  />
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-2">Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                      value={formData.password} 
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                      className="w-full px-5 py-3 rounded-2xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none focus:border-[#D4A843] text-sm pr-12" 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#D4A843] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-2">Role</label>
                  <select 
                    value={formData.role} 
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })} 
                    className="w-full px-5 py-3 rounded-2xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none focus:border-[#D4A843] text-sm appearance-none"
                  >
                    <option value="User">User / Agent</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Admin">Administrator</option>
                  </select>
                </div>

                {showSalaryBonus && (
                  <>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-2">Base Salary</label>
                      <input 
                        type="number" 
                        value={formData.salary} 
                        onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })} 
                        className="w-full px-5 py-3 rounded-2xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none focus:border-[#D4A843] text-sm" 
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-2">Target Bonus</label>
                      <input 
                        type="number" 
                        value={formData.bonus} 
                        onChange={(e) => setFormData({ ...formData, bonus: Number(e.target.value) })} 
                        className="w-full px-5 py-3 rounded-2xl border border-[var(--card-border)] bg-slate-50 focus:bg-white transition-all outline-none focus:border-[#D4A843] text-sm" 
                      />
                    </div>
                  </>
                )}

                <div className="col-span-2 pt-4">
                  <label className="block text-[11px] font-black text-[#101013] uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#D4A843]" />
                    Permissions Overrides
                  </label>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                    {Object.keys(formData.permissions).map((key) => (
                      <label key={key} className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            checked={(formData.permissions as any)[key]} 
                            onChange={(e) => setFormData({
                              ...formData,
                              permissions: {
                                ...formData.permissions,
                                [key]: e.target.checked
                              }
                            })}
                            className="peer h-5 w-5 rounded-md border-slate-300 text-[#D4A843] focus:ring-[#D4A843] transition-all appearance-none checked:bg-[#D4A843] border"
                          />
                          <Check size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#101013] opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                        </div>
                        <span className="text-xs font-bold text-slate-600 group-hover:text-[#101013] transition-colors uppercase tracking-tight">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^can /, '').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-8 sticky bottom-0 bg-white pb-2">
                <button 
                  onClick={handleSave} 
                  className="flex-1 py-4 bg-[#101013] text-[#D4A843] rounded-[20px] font-bold shadow-xl shadow-[#D4A843]/5 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  {editingUser ? 'Update User Account' : 'Create User Account'}
                </button>
                <button 
                  onClick={handleCancel} 
                  className="px-8 py-4 bg-slate-100 text-slate-500 rounded-[20px] font-bold hover:bg-slate-200 transition-all"
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

