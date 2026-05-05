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
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

/* ─── Animated Counter Hook ─── */
function useCounter(end: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const ref = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (end === 0) { setCount(0); return; }
    const start = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (end - start) * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    };

    ref.current = requestAnimationFrame(tick);
    return () => { if (ref.current) cancelAnimationFrame(ref.current); };
  }, [end, duration]);

  return count;
}

/* ─── Stat Card ─── */
function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  trend,
  loading,
  delay,
}: {
  label: string;
  value: number;
  icon: any;
  iconBg: string;
  trend?: { value: number; up: boolean; label?: string };
  loading: boolean;
  delay: string;
}) {
  const animatedValue = useCounter(loading ? 0 : value);

  return (
    <div className={`card-premium p-5 animate-fade-in-up ${delay} group`}>
      <div className="flex flex-col gap-3">
        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${iconBg}`}
        >
          <Icon size={22} strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-[13px] font-medium text-[var(--text-secondary)]">{label}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mt-1 tabular-nums animate-count-up">
            {loading ? (
              <span className="inline-block h-8 w-16 bg-[var(--card-border)] rounded-lg animate-pulse" />
            ) : (
              animatedValue.toLocaleString()
            )}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.up ? 'text-emerald-600' : 'text-red-500'}`}>
              {trend.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{trend.label || `${trend.value}% this month`}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchStats();
    fetchChart();
    fetchRecentAndTop();
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
    <div className="space-y-8 min-h-screen -mx-6 px-6 pb-20">
      {/* ─── Top Greeting ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Good Morning, {session?.user?.name || 'Admin User'} 👋
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Here&apos;s what&apos;s happening across your platform today.</p>
        </div>
      </div>

      {/* ─── Welcome Banner ─── */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#101013] via-[#1A1A1F] to-[#101013] text-white p-10 shadow-2xl animate-fade-in-up">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4A843]/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#3A3A42]/15 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4 bg-white/5 w-fit px-3 py-1.5 rounded-xl border border-white/10">
              <span className="h-2 w-2 rounded-full bg-[#D4A843]" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4A843]/80">
                {mounted ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Loading...'}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Welcome back, <br />
              <span className="text-[#D4A843]">{session?.user?.name || 'Admin User'}</span>
            </h1>
          </div>

          {/* Podium Visualization (3D Sculpture) */}
          <div className="relative h-[240px] w-full lg:w-[450px] flex items-center justify-center">
             <div className="absolute inset-0 bg-[#D4A843]/5 rounded-full blur-[60px]" />
             <img 
               src="/3d-icons/podium.png" 
               alt="Top Performance" 
               className="relative z-10 h-full w-full object-contain drop-shadow-[0_20px_50px_rgba(212,168,67,0.3)] animate-float"
             />
             
             {/* Right Status Card */}
             <div className="absolute top-0 right-0 hidden md:flex items-center gap-3 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 shadow-2xl z-20">
               <div className="h-12 w-12 rounded-xl bg-[#D4A843]/10 flex items-center justify-center border border-[#D4A843]/20 overflow-hidden">
                  <img src="/3d-icons/shield.png" className="h-10 w-10 object-contain" />
               </div>
               <div>
                 <p className="text-[11px] text-white/50 font-bold uppercase tracking-wider">System Status</p>
                 <p className="text-sm font-bold text-white">All Systems</p>
                 <div className="flex items-center gap-1.5 mt-0.5">
                   <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                   <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Operational</span>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isUser ? '' : 'xl:grid-cols-4'} gap-6`}>
        {metrics.map((m, i) => (
          <div key={m.label} className={`card-premium p-6 animate-fade-in-up delay-${i+1} group overflow-hidden relative`}>
            {/* Wave Graphic at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="w-full h-full">
                <path 
                  d="M0,50 C50,20 100,80 150,50 C200,20 250,80 300,50 C350,20 400,80 400,50 L400,100 L0,100 Z" 
                  fill="#D4A843" 
                />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col gap-4">
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 overflow-hidden`}>
                {m.iconSrc ? (
                  <img src={m.iconSrc} alt={m.label} className="h-14 w-14 object-contain drop-shadow-lg" />
                ) : (
                  <m.icon size={22} strokeWidth={1.8} className={m.iconBg.split(' ')[1]} />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-secondary)]">{m.label}</p>
                <div className="flex items-end justify-between mt-1">
                  <p className="text-3xl font-bold text-[var(--text-primary)] tabular-nums">
                    {loading ? <span className="inline-block h-8 w-16 bg-[var(--card-border)] rounded-lg animate-pulse" /> : m.value.toLocaleString()}
                  </p>
                </div>
                {m.trend && (
                  <div className={`flex items-center gap-1 mt-3 text-xs font-bold ${m.trend.up ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {m.trend.up && <TrendingUp size={13} />}
                    <span>{m.trend.label || `${m.trend.value}% this month`}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                { label: 'Authentication', status: 'Operational', icon: '🔐' },
                { label: 'Database', status: 'Connected', icon: '🗄️' },
                { label: 'Google Sheets', status: 'Synced', icon: '📊' },
                { label: 'WhatsApp API', status: 'Operational', icon: '💬' },
                { label: 'Email Service', status: 'Operational', icon: '✉️' },
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
          <button className="mt-8 w-full py-4 bg-[var(--background)] border border-[var(--card-border)] rounded-2xl text-sm font-bold text-[var(--text-secondary)] hover:text-[#D4A843] hover:border-[#D4A843]/30 transition-all flex items-center justify-center gap-2">
            View all services <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* ─── Bottom Sections ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
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
              {topAgents.slice(0, 1).map((agent: any) => (
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
                 {recentSubmissions.slice(0, 4).map((sub: any) => (
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
                 ))}
               </tbody>
             </table>
           </div>
        </div>

        {/* Activity Feed + Quick Actions */}
        <div className="space-y-8">
           <div className="card-premium p-8 animate-fade-in-up delay-8">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Activity Feed</h3>
              <div className="space-y-6">
                {[
                  { label: 'New form submission received', time: '7 hours ago', icon: '📝' },
                  { label: 'New user registered', time: '1 day ago', icon: '👤' },
                  { label: 'System backup completed', time: '2 days ago', icon: '💾' },
                  { label: 'Monthly report generated', time: '3 days ago', icon: '📅' },
                ].map((act, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-[var(--background)] flex items-center justify-center text-lg shadow-sm border border-[var(--card-border)] flex-shrink-0">
                      {act.icon}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text-primary)]">{act.label}</p>
                      <p className="text-xs text-[var(--text-tertiary)] mt-1">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="card-premium p-8 animate-fade-in-up delay-9">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Create Campaign', icon: Megaphone, color: '#D4A843' },
                  { label: 'Add User', icon: Users, color: '#B8923A' },
                  { label: 'View Reports', icon: BarChart3, color: '#6B7280' },
                  { label: 'System Settings', icon: Sparkles, color: '#101013' },
                ].map((action, i) => (
                  <button key={i} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[var(--background)] border border-[var(--card-border)] hover:border-[#D4A843]/30 hover:shadow-xl transition-all gap-3 group">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[#D4A843] transition-colors">
                      <action.icon size={24} strokeWidth={1.5} />
                    </div>
                    <span className="text-xs font-bold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]">{action.label}</span>
                  </button>
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
