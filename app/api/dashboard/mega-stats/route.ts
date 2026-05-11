import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Form from '@/models/Form';
import User from '@/models/User';
import FormSubmission from '@/models/FormSubmission';
import IPAddress from '@/models/IPAddress';
import { getCurrentUser } from '@/lib/auth';
import type { PipelineStage } from 'mongoose';

/**
 * Single consolidated dashboard endpoint.
 * Runs ALL queries in parallel with Promise.allSettled so one slow query
 * never blocks the others. Replaces 5 separate API calls:
 *   /api/stats
 *   /api/stats/recent-submissions
 *   /api/stats/top-agents
 *   /api/stats/activity
 *   /api/submissions/summary
 */
export async function GET() {
  try {
    const currentUser = await getCurrentUser().catch(() => null);
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const isUser = currentUser.role === 'User';
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // ── Build summary match (scope-aware) ──────────────────────────────────
    const summaryMatch: Record<string, any> = { createdAt: { $gte: startOfYear } };
    if (isUser) summaryMatch.submittedBy = currentUser.id;

    // ── All queries fire at exactly the same time ──────────────────────────
    const [
      totalFormsResult,
      totalUsersResult,
      totalSubmissionsResult,
      authorizedIPsResult,
      mySubmissionsResult,
      recentSubmissionsResult,
      topAgentsResult,
      activitySubmissionsResult,
      activityUsersResult,
      submissionSummaryResult,
    ] = await Promise.allSettled([
      // 1 – form count
      Form.countDocuments(),

      // 2 – user count
      User.countDocuments(),

      // 3 – total submissions
      FormSubmission.countDocuments(),

      // 4 – authorized IPs
      IPAddress.countDocuments({ status: 'Active' }),

      // 5 – my submissions
      currentUser.id
        ? FormSubmission.countDocuments({ submittedBy: currentUser.id })
        : Promise.resolve(0),

      // 6 – recent submissions (5 rows, projected only needed fields)
      FormSubmission.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('submittedBy formId createdAt')
        .populate('submittedBy', 'name email')
        .populate('formId', 'title')
        .lean(),

      // 7 – top agents this month (aggregation)
      FormSubmission.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, submittedBy: { $exists: true, $ne: null } } },
        { $group: { _id: '$submittedBy', count: { $sum: 1 } } },
        { $sort: { count: -1 as const } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 1, count: 1, name: '$user.name', email: '$user.email' } },
      ] as PipelineStage[]),

      // 8 – activity: recent submissions
      FormSubmission.find({ deleted: { $ne: true } })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('formId submittedBy createdAt')
        .populate('formId', 'title')
        .populate('submittedBy', 'name')
        .lean(),

      // 9 – activity: recent users
      User.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name createdAt')
        .lean(),

      // 10 – monthly submission summary
      FormSubmission.aggregate([
        { $match: summaryMatch },
        { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1 as 1, '_id.month': 1 as 1 } },
      ] as PipelineStage[]),
    ]);

    // ── Safely unwrap results ──────────────────────────────────────────────
    const safe = <T>(r: PromiseSettledResult<T>, fallback: T): T =>
      r.status === 'fulfilled' ? r.value : fallback;

    const totalForms       = safe(totalFormsResult, 0);
    const totalUsers       = safe(totalUsersResult, 0);
    const totalSubmissions = safe(totalSubmissionsResult, 0);
    const authorizedIPs    = safe(authorizedIPsResult, 0);
    const mySubmissions    = safe(mySubmissionsResult, 0);
    const rawRecent        = safe(recentSubmissionsResult, []) as any[];
    const topAgents        = safe(topAgentsResult, []) as any[];
    const actSubs          = safe(activitySubmissionsResult, []) as any[];
    const actUsers         = safe(activityUsersResult, []) as any[];
    const summaryRaw       = safe(submissionSummaryResult, []) as any[];

    // ── Format recent submissions ──────────────────────────────────────────
    const now = new Date();
    const fmt = (d: Date) => {
      const ms = now.getTime() - new Date(d).getTime();
      const mins  = Math.floor(ms / 60000);
      const hours = Math.floor(ms / 3600000);
      const days  = Math.floor(ms / 86400000);
      if (days > 0) return `${days}d ago`;
      if (hours > 0) return `${hours}h ago`;
      if (mins > 0) return `${mins}m ago`;
      return 'just now';
    };

    const recentSubmissions = rawRecent.map((s: any) => ({
      _id: s._id?.toString(),
      agentName: (s.submittedBy as any)?.name || (s.submittedBy as any)?.email || 'Unknown',
      formTitle: (s.formId as any)?.title || 'Unknown Form',
      timeAgo: fmt(s.createdAt),
    }));

    // ── Build activity feed ────────────────────────────────────────────────
    const activities: any[] = [
      ...actSubs.map((s: any) => ({
        id: s._id?.toString(),
        label: `New submission for ${(s.formId as any)?.title || 'Unknown Form'}`,
        time: s.createdAt,
        icon: '📝',
        link: '/dashboard/reports',
      })),
      ...actUsers.map((u: any) => ({
        id: u._id?.toString(),
        label: `New user registered: ${u.name}`,
        time: u.createdAt,
        icon: '👤',
        link: '/user-management',
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 8);

    // ── Monthly chart data (12 months) ────────────────────────────────────
    const chartData = Array.from({ length: 12 }, (_, i) => {
      const row = summaryRaw.find((d: any) => d._id.month === i + 1);
      return row?.count ?? 0;
    });

    return NextResponse.json({
      success: true,
      data: {
        stats: { totalForms, totalUsers, totalSubmissions, authorizedIPs, mySubmissions },
        recentSubmissions,
        topAgents,
        activities,
        chartData,
      },
    });
  } catch (error: any) {
    console.error('[mega-stats] Error:', error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
