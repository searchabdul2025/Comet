'use client';

import {
  ClipboardList,
  Users,
  Database,
  Globe,
  Plus,
  Settings,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const cardBase =
  'bg-white/80 backdrop-blur-sm border border-slate-100 shadow-sm rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg';

export default function DashboardPage() {
  const pathname = usePathname();
  const [stats, setStats] = useState({
    totalForms: 0,
    totalUsers: 0,
    totalSubmissions: 0,
    authorizedIPs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else if (result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { name: 'Forms', href: '/forms' },
    { name: 'Submissions', href: '/dashboard?tab=Submissions' },
    { name: 'Requests', href: '/requests' },
    { name: 'IP Management', href: '/ip-management' },
    { name: 'User Management', href: '/user-management' },
  ];

  const metrics = [
    {
      label: 'Total Forms',
      value: stats.totalForms,
      icon: ClipboardList,
      accent: 'from-blue-500/90 to-indigo-500/90',
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      accent: 'from-emerald-500/90 to-teal-500/90',
    },
    {
      label: 'Submissions',
      value: stats.totalSubmissions,
      icon: Database,
      accent: 'from-orange-500/90 to-amber-500/90',
    },
    {
      label: 'Authorized IPs',
      value: stats.authorizedIPs,
      icon: Globe,
      accent: 'from-purple-500/90 to-fuchsia-500/90',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_45%)]" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-100">
              <Sparkles size={14} />
              New 2026 Experience
            </div>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold">Admin Command Center</h1>
            <p className="mt-2 text-slate-200/80 max-w-2xl">
              Track forms, users, submissions, and network access with a streamlined, responsive layout.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {tabs.map((tab) => {
                const isActive =
                  pathname === tab.href ||
                  (tab.href.includes('?') && pathname === tab.href.split('?')[0]);
                return (
                  <Link
                    key={tab.name}
                    href={tab.href}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {tab.name}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              <ShieldCheck size={26} />
            </div>
            <div>
              <p className="text-sm text-slate-200/80">Status</p>
              <p className="text-lg font-semibold">Secure & Up-to-date</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className={cardBase}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{metric.label}</p>
                  <p className="text-3xl font-semibold text-slate-900">
                    {loading ? '...' : metric.value}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${metric.accent} flex items-center justify-center text-white`}
                >
                  <Icon size={24} />
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-900 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (Number(metric.value) || 0) > 0 ? 30 + Math.min(metric.value, 70) : 15
                    )}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          <div className={`${cardBase} bg-white`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Momentum</p>
                <h3 className="text-lg font-semibold text-slate-900">Submissions Trend</h3>
              </div>
              <TrendingUp className="text-slate-600" size={20} />
            </div>
            <div className="mt-4 space-y-3">
              <ProgressRow
                label="Forms"
                value={stats.totalForms}
                color="bg-blue-600"
                loading={loading}
              />
              <ProgressRow
                label="Submissions"
                value={stats.totalSubmissions}
                color="bg-amber-500"
                loading={loading}
              />
              <ProgressRow
                label="Users"
                value={stats.totalUsers}
                color="bg-emerald-500"
                loading={loading}
              />
            </div>
          </div>

          <div className={`${cardBase} bg-white`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">Quick Actions</p>
                <h3 className="text-lg font-semibold text-slate-900">Work faster</h3>
              </div>
              <Sparkles className="text-slate-600" size={18} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <CTA href="/form-builder" icon={<Plus size={18} />} label="New Form" variant="primary" />
              <CTA href="/ip-management" icon={<Globe size={18} />} label="Add IP" variant="success" />
              <CTA href="/forms" icon={<Settings size={18} />} label="Manage Forms" />
              <CTA
                href="/dashboard?tab=Submissions"
                icon={<Database size={18} />}
                label="View Submissions"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className={`${cardBase} bg-white`}>
            <p className="text-sm text-slate-500">Health</p>
            <h3 className="text-lg font-semibold text-slate-900">System snapshot</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex items-center justify-between">
                <span>Auth & Access</span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  Stable
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Database</span>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Connected</span>
              </li>
              <li className="flex items-center justify-between">
                <span>IP Guard</span>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  {stats.authorizedIPs} authorized
                </span>
              </li>
            </ul>
          </div>

          <div className={`${cardBase} bg-white`}>
            <p className="text-sm text-slate-500">Shortcuts</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <Link
                  key={tab.name}
                  href={tab.href}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  {tab.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  color,
  loading,
}: {
  label: string;
  value: number;
  color: string;
  loading: boolean;
}) {
  const width = Math.min(100, (value || 0) > 0 ? 20 + Math.min(value, 80) : 12);
  return (
    <div>
      <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-slate-800">{loading ? '...' : value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${color} transition-all`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function CTA({
  href,
  icon,
  label,
  variant = 'neutral',
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'success' | 'neutral';
}) {
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700',
    neutral: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  }[variant];

  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition ${styles}`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      <span className="text-xs opacity-80">Go</span>
    </Link>
  );
}

