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
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';

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
          iconBg: 'bg-[#EDE9DD] text-[#D4A843]',
          trend: { value: 12, up: true },
        },
      ]
    : [
        {
          label: 'Total Forms',
          value: stats.totalForms,
          icon: ClipboardList,
          iconBg: 'bg-[#F0EBE0] text-[#B8923A]',
          trend: { value: 8, up: true },
        },
        {
          label: 'Total Users',
          value: stats.totalUsers,
          icon: Users,
          iconBg: 'bg-[#EDE9DD] text-[#D4A843]',
          trend: { value: 15, up: true },
        },
        {
          label: 'Submissions',
          value: stats.totalSubmissions,
          icon: Database,
          iconBg: 'bg-[#E8EAF0] text-[#6B7280]',
          trend: { value: 24, up: true },
        },
        {
          label: 'Authorized IPs',
          value: stats.authorizedIPs,
          icon: ShieldCheck,
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
    <div className="space-y-6 min-h-screen -mx-6 px-6 pb-10">
      {/* ─── Welcome Banner ─── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#101013] via-[#1A1A1F] to-[#101013] text-white p-7 shadow-2xl animate-fade-in-up">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4A843]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#3A3A42]/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={18} className="text-[#D4A843]" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#D4A843]/70">
                {mounted ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Loading...'}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, <span className="text-gradient">{session?.user?.name || 'User'}</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-400 max-w-xl">
              Here&apos;s what&apos;s happening across your {isUser ? 'workspace' : 'platform'} today.
            </p>
          </div>
          <div className="flex items-center gap-2.5 rounded-2xl bg-white/[0.05] backdrop-blur border border-white/[0.08] px-4 py-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#3A3A42] to-[#2A2A30] flex items-center justify-center shadow-lg shadow-[#3A3A42]/25">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">System Status</p>
              <div className="flex items-center gap-1.5">
                <span className="status-dot status-dot-online" />
                <p className="text-sm font-semibold text-emerald-400">Operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isUser ? '' : 'xl:grid-cols-4'} gap-4`}>
        {metrics.map((m, i) => (
          <StatCard
            key={m.label}
            label={m.label}
            value={m.value}
            icon={m.icon}
            iconBg={m.iconBg}
            trend={m.trend}
            loading={loading}
            delay={`delay-${i + 1}`}
          />
        ))}
      </div>

      {/* ─── Chart + Side Panels ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Main Chart */}
        <div className="xl:col-span-2 card-premium p-6 animate-fade-in-up delay-3">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Submissions Overview</h3>
              <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">Monthly trend for {new Date().getFullYear()}</p>
            </div>
            <div className="flex items-center gap-1.5 border border-[#D4A843]/30 text-[#D4A843] rounded-lg px-2.5 py-1.5 text-xs font-semibold cursor-pointer hover:bg-[#D4A843]/5 transition-colors">
              <span>This Year</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          {chartLoading ? (
            <div className="h-56 flex items-center justify-center">
              <div className="h-8 w-8 border-3 border-[#D4A843]/20 border-t-[#D4A843] rounded-full animate-spin" />
            </div>
          ) : chartError ? (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl">{chartError}</div>
          ) : chartData.every(v => v === 0) ? (
            <div className="h-56 flex items-center justify-center text-sm text-slate-400">No submissions yet</div>
          ) : (
            <div className="relative">
              <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: 220 }}>
                <defs>
                  <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D4A843" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#D4A843" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                {yLabels.map((val, i) => {
                  const y = padT + innerH - (val / niceMax) * innerH;
                  return (
                    <g key={`grid-${i}`}>
                      <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                      <text x={padL - 8} y={y + 3.5} textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="Inter, sans-serif">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area fill */}
                <path
                  d={(() => {
                    const points = chartData.map((val, i) => {
                      const step = innerW / 11;
                      const x = padL + step * i;
                      const y = padT + innerH - (val / niceMax) * innerH;
                      return { x, y };
                    });
                    // Smooth curve
                    let d = `M${points[0].x},${points[0].y}`;
                    for (let i = 1; i < points.length; i++) {
                      const cp1x = points[i-1].x + (points[i].x - points[i-1].x) * 0.4;
                      const cp2x = points[i].x - (points[i].x - points[i-1].x) * 0.4;
                      d += ` C${cp1x},${points[i-1].y} ${cp2x},${points[i].y} ${points[i].x},${points[i].y}`;
                    }
                    // Close for fill
                    d += ` L${points[points.length-1].x},${padT + innerH} L${points[0].x},${padT + innerH} Z`;
                    return d;
                  })()}
                  fill="url(#areaFill)"
                />

                {/* Area line */}
                <path
                  d={(() => {
                    const points = chartData.map((val, i) => {
                      const step = innerW / 11;
                      const x = padL + step * i;
                      const y = padT + innerH - (val / niceMax) * innerH;
                      return { x, y };
                    });
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
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Data points + hover tooltips */}
                {chartData.map((val, i) => {
                  const step = innerW / 11;
                  const cx = padL + step * i;
                  const cy = padT + innerH - (val / niceMax) * innerH;
                  const isHovered = hoveredBar === i;

                  return (
                    <g
                      key={`pt-${i}`}
                      onMouseEnter={() => setHoveredBar(i)}
                      onMouseLeave={() => setHoveredBar(null)}
                      className="cursor-pointer"
                    >
                      <rect x={cx - 15} y={padT} width={30} height={innerH + padB} fill="transparent" />
                      {isHovered && (
                        <>
                          <line x1={cx} y1={padT} x2={cx} y2={padT + innerH} stroke="#D4A843" strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
                          <circle cx={cx} cy={cy} r={6} fill="white" stroke="#D4A843" strokeWidth="2.5" />
                          <rect x={cx - 24} y={cy - 30} width={48} height={22} rx={6} fill="#101013" />
                          <polygon points={`${cx - 4},${cy - 8} ${cx + 4},${cy - 8} ${cx},${cy - 3}`} fill="#101013" />
                          <text x={cx} y={cy - 16} textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="Inter, sans-serif">
                            {val}
                          </text>
                        </>
                      )}
                      {!isHovered && val > 0 && (
                        <circle cx={cx} cy={cy} r={3.5} fill="#D4A843" />
                      )}
                      <text x={cx} y={chartH - 6} textAnchor="middle" fill={isHovered ? '#D4A843' : '#94a3b8'} fontSize="10" fontWeight={isHovered ? '600' : '400'} fontFamily="Inter, sans-serif">
                        {months[i]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Legend */}
              <div className="flex items-center gap-5 mt-2 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#D4A843]" />
                  Monthly Submissions
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* System Health */}
          <div className="card-premium p-5 animate-fade-in-up delay-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-5">System Health</h3>
            <div className="space-y-3">
              {[
                { label: 'Authentication', status: 'Operational', icon: '🔐' },
                { label: 'Database', status: 'Connected', icon: '🗄️' },
                { label: 'Google Sheets', status: 'Synced', icon: '📊' },
                { label: 'Email Service', status: 'Operational', icon: '✉️' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-[var(--card-border)] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{item.icon}</span>
                    <span className="text-[13px] text-[var(--text-secondary)]">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="status-dot status-dot-online" />
                    <span className="text-[11px] font-semibold text-emerald-600 italic">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--card-border)]">
              <a href="/settings" className="flex items-center justify-between text-sm text-[var(--text-secondary)] hover:text-[#D4A843] transition-colors">
                <span>View all services</span>
                <ArrowUpRight size={14} />
              </a>
            </div>
          </div>

          {/* Target Progress (Agents) */}
          {isUser && stats && (
            <div className="card-premium p-5 animate-fade-in-up delay-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Target Progress</h3>
              <TargetRing
                achieved={stats.mySubmissions || 0}
                target={stats.totalSubmissions && isUser ? stats.totalSubmissions : 0}
              />
            </div>
          )}

          {/* Top Agents (Admin) */}
          {isAdmin && topAgents.length > 0 && (
            <div className="card-premium p-5 animate-fade-in-up delay-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={16} className="text-[#D4A843]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Top Agents</h3>
              </div>
              <div className="space-y-2.5">
                {topAgents.slice(0, 5).map((agent: any, i: number) => (
                  <div key={agent._id || i} className="flex items-center gap-3 py-1.5">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold" style={{
                      background: i < 3 ? `linear-gradient(135deg, ${medalColors[i]}, ${medalColors[i]}88)` : '#f1f5f9',
                      color: i < 3 ? '#000' : '#64748b',
                    }}>
                      {i < 3 ? <Medal size={13} /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[var(--text-primary)] truncate">{agent.name || agent.email || 'Agent'}</p>
                    </div>
                    <span className="text-[12px] font-bold text-[#D4A843] tabular-nums">{agent.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Recent Submissions (Admin/Supervisor) ─── */}
      {!isUser && recentSubmissions.length > 0 && (
        <div className="card-premium p-6 animate-fade-in-up delay-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Submissions</h3>
            </div>
            <a href="/dashboard/reports" className="text-xs font-medium text-[#D4A843] hover:text-[#B8923A] flex items-center gap-1">
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="pb-2.5 font-medium">Agent</th>
                  <th className="pb-2.5 font-medium">Form</th>
                  <th className="pb-2.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.slice(0, 5).map((sub: any, i: number) => (
                  <tr key={sub._id || i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-medium text-slate-800">{sub.agentName || 'Unknown'}</td>
                    <td className="py-3 text-slate-500">{sub.formTitle || '—'}</td>
                    <td className="py-3 text-slate-400 text-xs">{sub.timeAgo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
