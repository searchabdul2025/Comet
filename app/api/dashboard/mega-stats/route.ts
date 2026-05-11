import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Form from '@/models/Form';
import User from '@/models/User';
import FormSubmission from '@/models/FormSubmission';
import IPAddress from '@/models/IPAddress';
import Request from '@/models/Request';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    await connectDB();

    const isUser = user.role === 'User';
    const scopeFilter = isUser ? { submittedBy: user.id } : {};

    // Execute everything in parallel to reduce total latency
    const [
      stats,
      chartDataRaw,
      recentSubmissions,
      topAgents,
      activities
    ] = await Promise.all([
      // 1. Summary Stats
      Promise.all([
        Form.countDocuments(),
        User.countDocuments(),
        FormSubmission.countDocuments(),
        IPAddress.countDocuments({ status: 'Active' }),
        isUser ? FormSubmission.countDocuments({ submittedBy: user.id }) : Promise.resolve(0)
      ]),
      
      // 2. Chart Data (Submissions by month for current year)
      FormSubmission.aggregate([
        { 
          $match: { 
            ...scopeFilter,
            createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) } 
          } 
        },
        {
          $group: {
            _id: { $month: '$createdAt' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),

      // 3. Recent Submissions
      FormSubmission.find(scopeFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('formId', 'title')
        .populate('submittedBy', 'name')
        .lean(),

      // 4. Top Agents (based on submission count)
      FormSubmission.aggregate([
        { $match: { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } }, // Last 30 days
        { $group: { _id: '$submittedBy', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        {
          $project: {
            name: '$user.name',
            count: 1,
            role: '$user.role'
          }
        }
      ]),

      // 5. Recent Activities (combining Submissions and Requests)
      Promise.all([
        FormSubmission.find(scopeFilter).sort({ createdAt: -1 }).limit(3).populate('submittedBy', 'name').lean(),
        Request.find(isUser ? { userId: user.id } : {}).sort({ createdAt: -1 }).limit(3).populate('userId', 'name').lean()
      ])
    ]);

    // Process Chart Data
    const chartData = Array(12).fill(0);
    chartDataRaw.forEach((item: any) => {
      if (item._id >= 1 && item._id <= 12) {
        chartData[item._id - 1] = item.count;
      }
    });

    // Process Activities
    const combinedActivities = [
      ...activities[0].map((s: any) => ({
        id: s._id,
        type: 'Submission',
        user: s.submittedBy?.name || 'Unknown',
        action: 'submitted a form',
        time: s.createdAt,
        status: 'Success'
      })),
      ...activities[1].map((r: any) => ({
        id: r._id,
        type: 'Request',
        user: r.userId?.name || 'Unknown',
        action: `requested ${r.type}`,
        time: r.createdAt,
        status: r.status
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalForms: stats[0],
          totalUsers: stats[1],
          totalSubmissions: stats[2],
          authorizedIPs: stats[3],
          mySubmissions: stats[4]
        },
        chartData,
        recentSubmissions,
        topAgents,
        activities: combinedActivities
      }
    });
  } catch (error: any) {
    console.error('Mega Stats API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
