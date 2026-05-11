'use client';

import {
  ClipboardList,
  Users,
  Database,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Trophy,
  Medal,
  Clock,
  Zap,
  BarChart3,
  Check,
  Activity,
  ChevronDown,
  Megaphone,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import AdminBanner from '@/components/AdminBanner';
import StatCardWithSparkline from '@/components/StatCardWithSparkline';




/* ─── Main Dashboard ─── */
export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalForms: 0,
    totalUsers: 0,
    totalSubmissions: 0,
    authorizedIPs: 0,
    mySubmissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<number[]>(Array(12).fill(0));
  const [chartLoading, setChartLoading] = useState(true);
  const [chartError, setChartError] = useState('');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [topAgents, setTopAgents] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchStats();
    fetchChart();
    fetchRecentAndTop();
    fetchActivities();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success || result.data) setStats(result.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChart = async () => {
    try {
      setChartLoading(true);
      setChartError('');
      const scope = session?.user?.role === 'User' ? 'self' : undefined;
      const res = await fetch(`/api/submissions/summary${scope ? `?scope=${scope}` : ''}`);
      const result = await res.json();
      if (result.success) {
        const arr: number[] = Array(12).fill(0);
        (result.data as { month: number; count: number }[]).forEach((m) => {
          if (m.month >= 1 && m.month <= 12) arr[m.month - 1] = m.count;
        });
        setChartData(arr);
      } else {
        setChartError(result.error || 'Failed to load summary');
        setChartData(Array(12).fill(0));
      }
    } catch (err) {
      setChartError((err as any)?.message || 'Failed to load summary');
      setChartData(Array(12).fill(0));
    } finally {
      setChartLoading(false);
    }
  };

  const fetchRecentAndTop = async () => {
    try {
      const [recentRes, topRes] = await Promise.allSettled([
        fetch('/api/stats/recent-submissions'),
        fetch('/api/stats/top-agents'),
      ]);
      if (recentRes.status === 'fulfilled' && recentRes.value.ok) {
        const data = await recentRes.value.json();
        if (data.success) setRecentSubmissions(data.data || []);
      }
      if (topRes.status === 'fulfilled' && topRes.value.ok) {
        const data = await topRes.value.json();
        if (data.success) setTopAgents(data.data || []);
      }
    } catch {
      // silently ignore — these are supplementary
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await fetch('/api/stats/activity');
      if (res.ok) {
        const result = await res.json();
        if (result.success) setActivities(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMs = now.getTime() - past.getTime();
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInMins > 0) return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const isUser = session?.user?.role === 'User';
  const isAdmin = session?.user?.role === 'Admin';

  const metrics = isUser
    ? [
        {
          label: 'My Submissions',
          value: stats.mySubmissions || stats.totalSubmissions,
          icon: Database,
          iconSrc: '/3d-icons/submissions.png',
          iconBg: 'bg-[#EDE9DD] text-[#D4A843]',
          trend: { value: 12, up: true },
        },
      ]
    : [
        {
          label: 'Total Forms',
          value: stats.totalForms,
          icon: ClipboardList,
          iconSrc: '/3d-icons/clipboard.png',
          iconBg: 'bg-[#F0EBE0] text-[#B8923A]',
          trend: { value: 8, up: true },
        },
        {
          label: 'Total Users',
          value: stats.totalUsers,
          icon: Users,
          iconSrc: '/3d-icons/users.png',
          iconBg: 'bg-[#EDE9DD] text-[#D4A843]',
          trend: { value: 15, up: true },
        },
        {
          label: 'Submissions',
          value: stats.totalSubmissions,
          icon: Database,
          iconSrc: '/3d-icons/submissions.png',
          iconBg: 'bg-[#E8EAF0] text-[#6B7280]',
          trend: { value: 24, up: true },
        },
        {
          label: 'Authorized IPs',
          value: stats.authorizedIPs,
          icon: ShieldCheck,
          iconSrc: '/3d-icons/shield.png',
          iconBg: 'bg-[#E5EDE5] text-[#4A8C5C]',
          trend: { value: 0, up: true, label: 'No change' },
        },
      ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const maxVal = Math.max(...chartData, 1);

  const roleTitle =
    session?.user?.role === 'Admin'
      ? 'Admin Dashboard'
      : session?.user?.role === 'Supervisor'
      ? 'Supervisor Dashboard'
      : 'Agent Dashboard';

  // Chart dimensions
  const chartW = 600;
  const chartH = 220;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  // Y-axis: nice round ticks
  const niceMax = maxVal <= 5 ? 5 : Math.ceil(maxVal / 5) * 5;
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((niceMax / yTicks) * i));

  const medalColors = ['#facc15', '#cbd5e1', '#d97706'];

  return (
    <div className="space-y-6 min-h-screen -mx-6 px-6 pb-20 font-sans">
      {/* ─── Top Greeting & Banner ─── */}
      <AdminBanner adminName={session?.user?.name || 'Admin User'} />

      {/* ─── Stat Cards ─── */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isUser ? '' : 'xl:grid-cols-4'} gap-[14px]`}>
        {metrics.map((m, i) => (
          <StatCardWithSparkline
            key={m.label}
            label={m.label}
            value={m.value}
            icon={
              m.label === 'Total Forms' ? '📄' :
              m.label === 'Total Users' ? '👥' :
              m.label === 'Submissions' || m.label === 'My Submissions' ? '📨' :
              '🛡️'
            }
            trend={{
              value: m.trend?.value || 0,
              up: m.trend?.up || false,
              label: m.trend?.label
            }}
            sparkData={
              m.label === 'Total Forms' ? [1,1,1,1,1,2,2,2,2,2,2,2] :
              m.label === 'Total Users' ? [1,1,1,2,2,2,2,3,3,3,3,3] :
              m.label === 'Submissions' || m.label === 'My Submissions' ? [0,0,0,0,1,1,1,1,1,1,1,1] :
              [0,0,0,0,0,0,0,0,0,0,0,0]
            }
            sparkColor={
              m.label === 'Authorized IPs' ? '#c8bc99' : '#d4af37'
            }
            index={i}
          />
        ))}
      </div>


      {/* ─── Chart + System Health ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 card-premium p-8 animate-fade-in-up delay-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">Submissions Overview</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Monthly trend for {new Date().getFullYear()}</p>
            </div>
            <div className="flex items-center gap-2 border border-[var(--card-border)] rounded-xl px-3 py-2 text-sm font-bold text-[var(--text-secondary)] cursor-pointer hover:bg-[var(--background)] transition-all">
              <span>This Year</span>
              <ChevronDown size={16} />
            </div>
          </div>

          <div className="relative h-[250px]">
             {chartLoading ? (
               <div className="h-full flex items-center justify-center"><Activity className="animate-spin text-[#D4A843]" /></div>
             ) : (
               <div className="h-full">
                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-full">
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D4A843" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#D4A843" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={(() => {
                        const points = chartData.map((val, i) => ({
                          x: padL + (innerW / 11) * i,
                          y: padT + innerH - (val / niceMax) * innerH
                        }));
                        let d = `M${points[0].x},${points[0].y}`;
                        for (let i = 1; i < points.length; i++) {
                          const cp1x = points[i-1].x + (points[i].x - points[i-1].x) * 0.4;
                          const cp2x = points[i].x - (points[i].x - points[i-1].x) * 0.4;
                          d += ` C${cp1x},${points[i-1].y} ${cp2x},${points[i].y} ${points[i].x},${points[i].y}`;
                        }
                        return d + ` L${points[points.length-1].x},${padT + innerH} L${points[0].x},${padT + innerH} Z`;
                      })()}
                      fill="url(#areaFill)"
                    />
                    <path
                      d={(() => {
                        const points = chartData.map((val, i) => ({
                          x: padL + (innerW / 11) * i,
                          y: padT + innerH - (val / niceMax) * innerH
                        }));
                        let d = `M${points[0].x},${points[0].y}`;
                        for (let i = 1; i < points.length; i++) {
                          const cp1x = points[i-1].x + (points[i].x - points[i-1].x) * 0.4;
                          const cp2x = points[i].x - (points[i].x - points[i-1].x) * 0.4;
                          d += ` C${cp1x},${points[i-1].y} ${cp2x},${points[i].y} ${points[i].x},${points[i].y}`;
                        }
                        return d;
                      })()}
                      fill="none"
                      stroke="#D4A843"
                      strokeWidth="3"
                    />
                    {chartData.map((val, i) => (
                      <circle 
                        key={i} 
                        cx={padL + (innerW / 11) * i} 
                        cy={padT + innerH - (val / niceMax) * innerH} 
                        r={hoveredBar === i ? 6 : 0} 
                        fill="#D4A843" 
                        stroke="white" 
                        strokeWidth="2" 
                      />
                    ))}
                    {months.map((m, i) => (
                      <text key={m} x={padL + (innerW / 11) * i} y={chartH - 5} textAnchor="middle" fontSize="10" fill="#94a3b8">{m}</text>
                    ))}
                  </svg>
               </div>
             )}
          </div>
          <div className="flex items-center gap-3 mt-4">
             <span className="h-2.5 w-2.5 rounded-full bg-[#D4A843]" />
             <span className="text-xs font-bold text-[var(--text-secondary)]">Monthly Submissions</span>
          </div>
        </div>

        {/* System Health */}
        <div className="card-premium p-8 flex flex-col animate-fade-in-up delay-5">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-8">System Health</h3>
            
            <div className="relative h-40 w-full flex items-center justify-center mb-10">
               <div className="absolute h-32 w-32 rounded-full border border-[#D4A843]/20 animate-ping" />
               <div className="absolute h-24 w-24 rounded-full bg-white border border-[#D4A843]/10 shadow-2xl flex items-center justify-center">
                  <div className="h-16 w-16 bg-[#101013] rounded-full flex items-center justify-center shadow-inner">
                     <Activity size={32} className="text-[#D4A843] animate-pulse" />
                  </div>
               </div>
               <div className="absolute h-32 w-32 rounded-full border border-dashed border-[#D4A843]/30 animate-spin-slow" />
            </div>

            <div className="space-y-4">
              {[
                { label: 'Database', status: 'Connected', icon: '🗄️' },
                { label: 'Google Sheets', status: 'Synced', icon: '📊' },
                { label: 'WhatsApp API', status: 'Operational', icon: '💬' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-[var(--card-border)] last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg grayscale">{item.icon}</span>
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-600 uppercase">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>

      {/* ─── Bottom Sections ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Top Agents */}
        <div className="card-premium p-8 animate-fade-in-up delay-6">
           <h3 className="text-xl font-bold text-[var(--text-primary)] mb-8">Top Agents</h3>
           <div className="relative h-48 flex items-end justify-center gap-2 mb-8">
              <div className="w-16 h-20 bg-slate-200 rounded-t-xl flex flex-col items-center justify-center text-[#101013] font-bold shadow-lg">
                <span className="text-sm">2</span>
              </div>
              <div className="w-20 h-32 bg-gradient-to-b from-[#D4A843] to-[#B8923A] rounded-t-xl flex flex-col items-center justify-center text-[#101013] font-bold shadow-2xl relative z-10">
                <div className="absolute -top-10 h-8 w-8 rounded-full bg-white border-2 border-[#D4A843] flex items-center justify-center">
                   <Trophy size={14} className="text-[#D4A843]" />
                </div>
                <span className="text-lg">1</span>
              </div>
              <div className="w-16 h-14 bg-[#CD7F32]/50 rounded-t-xl flex flex-col items-center justify-center text-[#101013] font-bold shadow-lg">
                <span className="text-sm">3</span>
              </div>
           </div>
           
           <div className="space-y-4">
              {topAgents.length > 0 ? (
                topAgents.slice(0, 3).map((agent: any) => (
                <div key={agent._id} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-2xl border border-[var(--card-border)]">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#101013] flex items-center justify-center text-[#D4A843] font-bold text-xs">
                      {agent.name?.[0] || 'A'}
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)]">{agent.name || 'ahmad'}</span>
                  </div>
                  <div className="bg-[#D4A843]/10 text-[#D4A843] px-3 py-1 rounded-full text-[10px] font-bold">
                    {agent.count} Submission
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* Recent Submissions */}
        <div className="card-premium p-8 animate-fade-in-up delay-7">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-xl font-bold text-[var(--text-primary)]">Recent Submissions</h3>
             <Link href="/dashboard/reports" className="text-sm font-bold text-[#D4A843] flex items-center gap-1">
                View all <ArrowUpRight size={16} />
             </Link>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="text-left text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest border-b border-[var(--card-border)]">
                   <th className="pb-4">Agent</th>
                   <th className="pb-4">Form</th>
                   <th className="pb-4 text-right">Time</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-[var(--card-border)]">
                  {recentSubmissions.length > 0 ? (
                    recentSubmissions.slice(0, 5).map((sub: any) => (
                      <tr key={sub._id} className="group">
                        <td className="py-4">
                           <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[#D4A843]/10 flex items-center justify-center text-[#D4A843] font-bold text-[10px]">
                                {sub.agentName?.[0] || 'A'}
                              </div>
                              <span className="text-sm font-medium text-[var(--text-primary)]">{sub.agentName || 'ahmad'}</span>
                           </div>
                        </td>
                        <td className="py-4 text-sm text-[var(--text-secondary)] truncate max-w-[120px]">{sub.formTitle || 'testing form'}</td>
                        <td className="py-4 text-sm text-[var(--text-tertiary)] text-right">{sub.timeAgo || '7h ago'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-sm text-[var(--text-tertiary)]">
                        No recent submissions
                      </td>
                    </tr>
                  )}
               </tbody>
             </table>
           </div>
        </div>

        {/* Activity Feed + Quick Actions */}
        <div className="space-y-6">
            <div className="card-premium p-8 animate-fade-in-up delay-8">
               <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Activity Feed</h3>
               <div className="space-y-6">
                 {activities.length > 0 ? (
                   activities.map((act, i) => (
                     <Link key={act.id} href={act.link} className="flex gap-4 group cursor-pointer">
                       <div className="h-10 w-10 rounded-xl bg-[var(--background)] flex items-center justify-center text-lg shadow-sm border border-[var(--card-border)] group-hover:border-[#D4A843]/30 group-hover:shadow-md transition-all flex-shrink-0">
                         {act.icon}
                       </div>
                       <div>
                         <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[#D4A843] transition-colors">{act.label}</p>
                         <p className="text-xs text-[var(--text-tertiary)] mt-1">{formatTimeAgo(act.time)}</p>
                       </div>
                     </Link>
                   ))
                 ) : (
                   <div className="text-center py-8">
                     <p className="text-sm text-[var(--text-tertiary)]">No recent activity</p>
                   </div>
                 )}
               </div>
            </div>

           <div className="card-premium p-8 animate-fade-in-up delay-9">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Create Campaign', icon: Megaphone, color: '#D4A843', href: '/campaigns' },
                  { label: 'Add User', icon: Users, color: '#B8923A', href: '/user-management' },
                  { label: 'View Reports', icon: BarChart3, color: '#6B7280', href: '/dashboard/reports' },
                  { label: 'System Settings', icon: Sparkles, color: '#101013', href: '/settings' },
                ].map((action, i) => (
                  <Link 
                    key={i} 
                    href={action.href}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--background)] border border-[var(--card-border)] hover:border-[#D4A843]/30 hover:shadow-xl transition-all gap-3 group"
                  >
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[#D4A843] transition-colors">
                      <action.icon size={24} strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{action.label}</span>
                  </Link>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Target Ring Sub-component ─── */
function TargetRing({ achieved, target }: { achieved: number; target: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-24 w-24">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="8" fill="none" />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="url(#ringGrad)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D4A843" />
              <stop offset="100%" stopColor="#B8923A" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-slate-900">{pct}%</div>
          </div>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Achieved</span>
          <span className="font-bold text-slate-900 tabular-nums">{achieved}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">Target</span>
          <span className="font-bold text-slate-900 tabular-nums">{target || '—'}</span>
        </div>
      </div>
    </div>
  );
}
