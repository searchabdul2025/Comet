'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Bell,
  Network,
  Users,
  Sparkles,
  Activity,
  Megaphone,
  Target,
  Gift,
  Trophy,
  FolderKanban,
  DollarSign,
  MessageSquare,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';

interface SidebarProps {
  requestCount?: number;
}

export default function Sidebar({ requestCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const [brand, setBrand] = useState<{ name: string; logo?: string }>({ name: 'Portal' });
  const [showSalaryBonus, setShowSalaryBonus] = useState(true);
  const [accessibleChatrooms, setAccessibleChatrooms] = useState<Array<{ _id: string; name: string; description?: string }>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadBrand = async () => {
      try {
        const res = await fetch('/api/settings/public');
        const result = await res.json();
        if (result.success) {
          setBrand({ name: result.data.APP_NAME || 'Portal', logo: result.data.APP_LOGO_URL || '' });
          if (typeof result.data.SHOW_SALARY_BONUS !== 'undefined') {
            setShowSalaryBonus(String(result.data.SHOW_SALARY_BONUS) !== '0');
          }
        }
      } catch {
        // ignore
      }
    };
    loadBrand();
  }, []);

  useEffect(() => {
    const loadAccessibleChatrooms = async () => {
      if (!session?.user) return;
      
      // Check if user has canManageChatRooms permission
      const userRole = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
      const userPermOverrides = session?.user?.permissions;
      const userPermissions = userRole ? getPermissions(userRole, userPermOverrides || undefined) : null;
      
      // Only show chatrooms if user has canManageChatRooms permission
      if (!userPermissions?.canManageChatRooms) {
        setAccessibleChatrooms([]);
        return;
      }
      
      try {
        const res = await fetch('/api/chatrooms/accessible');
        const result = await res.json();
        if (result.success) {
          setAccessibleChatrooms(result.data || []);
        }
      } catch {
        // ignore
      }
    };
    loadAccessibleChatrooms();
  }, [session]);

  const userRole = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
  const userPermOverrides = session?.user?.permissions;
  const permissions = userRole ? getPermissions(userRole, userPermOverrides || undefined) : null;

  const allNavItems = [
    // Common / everyone
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },

    // Admin / supervisors
    { href: '/campaigns', label: 'Campaigns', icon: Megaphone, permission: 'canManageForms' as const },
    { href: '/forms', label: 'Forms', icon: FileText, permission: 'canManageForms' as const, roles: ['Supervisor'] as const },
    { href: '/requests', label: 'Requests', icon: Bell, badge: requestCount, permission: 'canManageRequests' as const },
    { href: '/user-management', label: 'User Management', icon: Users, permission: 'canManageUsers' as const },
    { href: '/settings', label: 'Settings', icon: Sparkles, permission: 'canManageSettings' as const },
    { href: '/dashboard/reports', label: 'Reports', icon: Activity, permission: 'canManageUsers' as const },
    { href: '/monthly-targets', label: 'Monthly Targets', icon: Target, permission: 'canManageUsers' as const, roles: ['Admin'] as const },
    { href: '/bonuses', label: 'Bonuses', icon: Gift, permission: 'canManageUsers' as const, roles: ['Admin'] as const },
    { href: '/sales-approvals', label: 'Sales Approvals', icon: FileText, permission: 'canViewSubmissions' as const },
    { href: '/chatrooms', label: 'Chatroom Management', icon: MessageSquare, permission: 'canManageChatRooms' as const, roles: ['Admin'] as const },

    // Agent / supervisor views (no special permissions, role-gated) - Ordered for agent portal
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null, roles: ['User', 'Supervisor'] as const },
    { href: '/agent/campaigns', label: 'Campaigns Forms', icon: FolderKanban, permission: null, roles: ['User', 'Supervisor'] as const },
    { href: '/agent/submissions', label: 'My Submissions', icon: FileText, permission: null, roles: ['User', 'Supervisor'] as const },
    { href: '/agent/sales-approvals', label: 'Sales Approvals', icon: FileText, permission: null, roles: ['User', 'Supervisor'] as const },
    { href: '/agent/reports', label: 'Reports', icon: Activity, permission: null, roles: ['User', 'Supervisor'] as const },
    { href: '/agent/targets', label: 'My Target', icon: Target, permission: null, roles: ['User', 'Supervisor'] as const },
    ...(showSalaryBonus
      ? ([{ href: '/agent/salary', label: 'My Salary & Bonus', icon: DollarSign, permission: null, roles: ['User', 'Supervisor'] as const }] as const)
      : ([] as const)),
    { href: '/agent/requests', label: 'Requests', icon: MessageSquare, permission: null, roles: ['User', 'Supervisor'] as const },
  ];

  // Filter nav items based on permissions
  const navItems = allNavItems.filter(item => {
    // role gate first if specified
    if (item.roles && (!userRole || !(item.roles as readonly string[]).includes(userRole))) {
      return false;
    }
    if (!item.permission) return true; // visible if no permission requirement
    if (!permissions) return false;
    return permissions[item.permission];
  });

  // Prevent hydration mismatch - usePathname can differ on server/client
  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="w-64 bg-gradient-to-b from-cyan-700 via-teal-700 to-emerald-700 text-white min-h-screen p-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 border border-white/10 mb-4 shadow-lg shadow-emerald-900/20">
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo} alt={brand.name} className="h-9 w-9 rounded-lg object-contain bg-white/10" />
        ) : (
          <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center font-semibold">
            {brand.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="leading-tight">
          <p className="text-xs text-white/70">
            {userRole === 'User' ? 'Agent Space' : userRole === 'Supervisor' ? 'Supervisor Space' : 'Admin Space'}
          </p>
          <p className="text-sm font-semibold">{brand.name}</p>
        </div>
      </div>
      {children}
    </div>
  );

  if (!mounted) {
    return (
      <Shell>
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 border border-white/10"
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </div>
            );
          })}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                isActive
                  ? 'bg-white text-emerald-900 border-white/60 shadow-lg shadow-emerald-900/10'
                  : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition ${
                  isActive ? 'bg-emerald-900 text-white' : 'bg-white/10 text-white'
                }`}
              >
                <Icon size={18} />
              </div>
              <span className="font-medium">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`ml-auto text-xs px-2 py-1 rounded-full ${
                    isActive ? 'bg-slate-900 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 top-0 h-full w-1 rounded-full bg-gradient-to-b from-emerald-400 to-blue-500" />
              )}
            </Link>
          );
        })}

        {/* Accessible Chatrooms */}
        {accessibleChatrooms.length > 0 && (
          <>
            <div className="pt-4 mt-4 border-t border-white/20">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider px-4 mb-2">
                Chatrooms
              </p>
            </div>
            {accessibleChatrooms.map((chatroom) => {
              const isActive = pathname === `/chatroom/${chatroom._id}` || pathname?.startsWith(`/chatroom/${chatroom._id}/`);
              return (
                <Link
                  key={chatroom._id}
                  href={`/chatroom-login?id=${chatroom._id}`}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-white text-emerald-900 border-white/60 shadow-lg shadow-emerald-900/10'
                      : 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center transition ${
                      isActive ? 'bg-emerald-900 text-white' : 'bg-white/10 text-white'
                    }`}
                  >
                    <MessageSquare size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium block truncate">{chatroom.name}</span>
                    {chatroom.description && (
                      <span className="text-xs opacity-70 block truncate">{chatroom.description}</span>
                    )}
                  </div>
                  {isActive && (
                    <span className="absolute left-0 top-0 h-full w-1 rounded-full bg-gradient-to-b from-emerald-400 to-blue-500" />
                  )}
                </Link>
              );
            })}
          </>
        )}
      </nav>
      {session?.user && (
        <div className="mt-6 rounded-xl bg-white/5 border border-white/10 p-4 text-sm text-white/80">
          <p className="text-xs uppercase tracking-wide text-white/60 mb-1">Signed in</p>
          <p className="font-semibold text-white">{session.user.name || session.user.email}</p>
          <p className="text-xs text-white/60">{session.user.role}</p>
        </div>
      )}
    </Shell>
  );
}

