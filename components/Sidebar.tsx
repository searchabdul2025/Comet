'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Bell,
  Users,
  Sparkles,
  Activity,
  Megaphone,
  Target,
  Gift,
  FolderKanban,
  DollarSign,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowUpRight,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  requestCount?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: number;
  permission: string | null;
  roles?: readonly string[];
}

export default function Sidebar({ requestCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
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
      
      const userRole = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
      const userPermOverrides = session?.user?.permissions;
      const userPermissions = userRole ? getPermissions(userRole, userPermOverrides || undefined) : null;
      
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

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const userRole = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
  const userPermOverrides = session?.user?.permissions;
  const permissions = userRole ? getPermissions(userRole, userPermOverrides || undefined) : null;

  // Build grouped navigation
  const adminGroups: NavGroup[] = [
    {
      label: 'MAIN',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null },
        { href: '/campaigns', label: 'Campaigns', icon: Megaphone, permission: 'canManageForms' as const },
        { href: '/requests', label: 'Requests', icon: Bell, badge: requestCount, permission: 'canManageRequests' as const },
        { href: '/user-management', label: 'User Management', icon: Users, permission: 'canManageUsers' as const },
      ],
    },
    {
      label: 'ANALYTICS',
      items: [
        { href: '/dashboard/reports', label: 'Reports', icon: Activity, permission: 'canManageUsers' as const },
        { href: '/monthly-targets', label: 'Monthly Targets', icon: Target, permission: 'canManageUsers' as const, roles: ['Admin'] as const },
        { href: '/bonuses', label: 'Bonuses', icon: Gift, permission: 'canManageUsers' as const, roles: ['Admin'] as const },
        { href: '/sales-approvals', label: 'Sales Approvals', icon: FileText, permission: 'canViewSubmissions' as const },
      ],
    },
    {
      label: 'SYSTEM',
      items: [
        { href: '/settings', label: 'Settings', icon: Sparkles, permission: 'canManageSettings' as const },
      ],
    },
    {
      label: 'COMMUNICATION',
      items: [
        { href: '/forms', label: 'Forms', icon: FileText, permission: 'canManageForms' as const },
        { href: '/chatrooms', label: 'Chatrooms', icon: MessageSquare, permission: 'canManageChatRooms' as const, roles: ['Admin'] as const },
      ],
    },
  ];

  const agentGroups: NavGroup[] = [
    {
      label: 'MAIN',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: null, roles: ['User', 'Supervisor'] as const },
      ],
    },
    {
      label: 'WORK',
      items: [
        { href: '/agent/campaigns', label: 'Campaigns Forms', icon: FolderKanban, permission: null, roles: ['User', 'Supervisor'] as const },
        { href: '/agent/submissions', label: 'My Submissions', icon: FileText, permission: null, roles: ['User', 'Supervisor'] as const },
        { href: '/agent/sales-approvals', label: 'Sales Approvals', icon: FileText, permission: null, roles: ['User', 'Supervisor'] as const },
      ],
    },
    {
      label: 'PERFORMANCE',
      items: [
        { href: '/agent/reports', label: 'Reports', icon: Activity, permission: null, roles: ['User', 'Supervisor'] as const },
        { href: '/agent/targets', label: 'My Target', icon: Target, permission: null, roles: ['User', 'Supervisor'] as const },
        ...(showSalaryBonus
          ? [{ href: '/agent/salary', label: 'My Salary & Bonus', icon: DollarSign, permission: null, roles: ['User', 'Supervisor'] as const }]
          : []),
      ],
    },
    {
      label: 'COMMUNICATION',
      items: [
        { href: '/agent/requests', label: 'Requests', icon: MessageSquare, permission: null, roles: ['User', 'Supervisor'] as const },
      ],
    },
  ];

  const isAgent = userRole === 'User' || userRole === 'Supervisor';
  const rawGroups = isAgent ? agentGroups : adminGroups;

  // Filter items by permissions
  const navGroups = rawGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (item.roles && (!userRole || !(item.roles as readonly string[]).includes(userRole))) {
          return false;
        }
        if (!item.permission) return true;
        if (!permissions) return false;
        return permissions[item.permission as keyof typeof permissions];
      }),
    }))
    .filter(group => group.items.length > 0);

  const roleLabel = userRole === 'User' ? 'Agent' : userRole === 'Supervisor' ? 'Supervisor' : 'Admin';
  const initials = session?.user?.name
    ? session.user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : session?.user?.email?.slice(0, 2).toUpperCase() || 'U';

  if (!mounted) {
    return (
      <aside className="w-[260px] bg-[var(--green-900,#101013)] min-h-screen flex flex-col">
        <div className="p-4 animate-pulse">
          <div className="h-12 bg-white/5 rounded-xl" />
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      } bg-[#101013] min-h-screen flex flex-col transition-all duration-300 ease-in-out relative`}
    >
      {/* ─── Brand Header ─── */}
      <div className={`p-4 ${collapsed ? 'px-3' : 'px-5'} flex items-center gap-3 border-b border-white/[0.06]`}>
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logo}
            alt={brand.name}
            className="h-10 w-10 rounded-xl object-contain bg-white/5 flex-shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#D4A843] to-[#B8923A] flex items-center justify-center text-[#101013] text-sm font-bold flex-shrink-0 shadow-lg shadow-[#D4A843]/25">
            {brand.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        {!collapsed && (
          <div className="overflow-hidden animate-fade-in">
            <p className="text-[13px] font-bold text-[#D4A843] tracking-wider uppercase">
              {brand.name}
            </p>
          </div>
        )}
      </div>

      {/* ─── Collapse Toggle ─── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[52px] h-6 w-6 rounded-full bg-[#1A1A1F] border border-[#D4A843]/20 flex items-center justify-center text-[#8B8B94] hover:text-[#D4A843] hover:bg-[#1A1A1F] transition-all z-50 shadow-lg"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* ─── Navigation ─── */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-3">
        {navGroups.map((group, gi) => (
          <div key={group.label} className={gi > 0 ? 'mt-6' : ''}>
            {/* Group Label */}
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4A843]/50">
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div className="mx-3 mb-3 border-t border-white/[0.06]" />
            )}

            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${
                      collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-[#D4A843] text-[#101013]'
                        : 'text-[#8B8B94] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 flex items-center justify-center rounded-lg transition-all duration-200 ${
                        collapsed ? 'h-10 w-10' : 'h-8 w-8'
                      } ${
                        isActive
                          ? 'bg-[#101013]/15 text-[#101013]'
                          : 'bg-transparent text-inherit group-hover:bg-white/[0.06]'
                      }`}
                    >
                      <Icon size={collapsed ? 20 : 17} strokeWidth={isActive ? 2.2 : 1.8} />
                    </div>

                    {/* Label */}
                    {!collapsed && (
                      <span className={`text-[13px] font-medium truncate ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
                    )}

                    {/* Badge */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`${
                          collapsed ? 'absolute -top-0.5 -right-0.5 h-4 w-4 text-[9px]' : 'ml-auto text-[10px] px-1.5 py-0.5'
                        } rounded-full font-semibold flex items-center justify-center ${
                          isActive
                            ? 'bg-[#101013] text-[#D4A843]'
                            : 'bg-[#D4A843] text-[#101013]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Accessible Chatrooms */}
        {accessibleChatrooms.length > 0 && (
          <div className="mt-6">
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#D4A843]/50">
                Chatrooms
              </p>
            )}
            {collapsed && <div className="mx-3 mb-3 border-t border-white/[0.06]" />}
            <div className="space-y-0.5">
              {accessibleChatrooms.map((chatroom) => {
                const isActive = pathname === `/chatroom/${chatroom._id}` || pathname?.startsWith(`/chatroom/${chatroom._id}/`);
                return (
                  <Link
                    key={chatroom._id}
                    href={`/chatroom-login?id=${chatroom._id}`}
                    title={collapsed ? chatroom.name : undefined}
                    className={`group relative flex items-center gap-3 rounded-xl transition-all duration-200 ${
                      collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-[#D4A843] text-[#101013]'
                        : 'text-[#8B8B94] hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 flex items-center justify-center rounded-lg transition-all ${
                        collapsed ? 'h-10 w-10' : 'h-8 w-8'
                      } ${
                        isActive
                          ? 'bg-[#101013]/15 text-[#101013]'
                          : 'bg-transparent text-inherit group-hover:bg-white/[0.06]'
                      }`}
                    >
                      <MessageSquare size={collapsed ? 20 : 17} strokeWidth={isActive ? 2.2 : 1.8} />
                    </div>
                    {!collapsed && (
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium block truncate">{chatroom.name}</span>
                        {chatroom.description && (
                          <span className="text-[10px] text-[#8B8B94]/60 block truncate">{chatroom.description}</span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* ─── Upgrade Card ─── */}
      {!collapsed && (
        <div className="mx-4 mb-4">
          <div className="bg-gradient-to-br from-[#1A1A1F] to-[#101013] rounded-2xl p-4 border border-[#D4A843]/10">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-[#D4A843]/10 flex items-center justify-center">
                <Sparkles size={16} className="text-[#D4A843]" />
              </div>
            </div>
            <p className="text-white text-sm font-semibold">Upgrade to Pro</p>
            <p className="text-[#8B8B94] text-[11px] mt-1 leading-relaxed">Unlock advanced features and analytics.</p>
            <button className="mt-3 w-full bg-gradient-to-r from-[#D4A843] to-[#B8923A] text-[#101013] text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1 hover:shadow-lg hover:shadow-[#D4A843]/20 transition-all">
              Upgrade Now <ArrowUpRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ─── User Card Footer ─── */}
      {session?.user && (
        <div className={`border-t border-white/[0.06] ${collapsed ? 'p-2' : 'p-4'}`}>
          <div
            className={`flex items-center gap-3 ${
              collapsed ? 'flex-col items-center' : 'rounded-xl bg-white/[0.03] border border-white/[0.06] p-3'
            }`}
          >
            {/* Avatar / User Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#D4A843] to-[#B8923A] flex items-center justify-center text-[#101013] text-xs font-bold flex-shrink-0 shadow-lg shadow-[#D4A843]/20">
                {initials}
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate">
                    {session.user.name || session.user.email}
                  </p>
                  <p className="text-[10px] text-[#8B8B94] font-medium uppercase tracking-wider">
                    {roleLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className={`${
                collapsed 
                  ? 'h-9 w-9 mt-2' 
                  : 'h-8 w-8'
              } rounded-lg flex items-center justify-center text-[#8B8B94] hover:text-[#D4A843] hover:bg-[#D4A843]/10 transition-all border border-transparent hover:border-[#D4A843]/20`}
              title="Logout"
            >
              <LogOut size={collapsed ? 18 : 15} />
            </button>
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      {!collapsed && (
        <div className="px-5 pb-4 text-center">
          <p className="text-[10px] text-[#8B8B94]/50">© 2026 {brand.name}</p>
          <p className="text-[10px] text-[#8B8B94]/40">All rights reserved.</p>
        </div>
      )}
    </aside>
  );
}
