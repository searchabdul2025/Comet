import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Form from '@/models/Form';
import Campaign from '@/models/Campaign';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) return NextResponse.json({ success: true, data: [] });

    await connectDB();

    const regex = new RegExp(q, 'i');

    const [users, forms, campaigns] = await Promise.all([
      User.find({ 
        $or: [
          { name: regex }, 
          { username: regex }, 
          { email: regex }
        ] 
      }).limit(5).lean(),
      Form.find({ 
        $or: [
          { title: regex }, 
          { formId: regex }
        ] 
      }).limit(5).lean(),
      Campaign.find({ 
        $or: [
          { name: regex },
          { campaignId: regex }
        ]
      }).limit(5).lean()
    ]);

    const results = [
      ...users.map((u: any) => ({ 
        id: u._id.toString(), 
        type: 'User', 
        title: u.name || u.username, 
        subtitle: u.role, 
        href: '/user-management' 
      })),
      ...forms.map((f: any) => ({ 
        id: f._id.toString(), 
        type: 'Form', 
        title: f.title, 
        subtitle: f.formId, 
        href: '/forms' 
      })),
      ...campaigns.map((c: any) => ({ 
        id: c._id.toString(), 
        type: 'Campaign', 
        title: c.name, 
        subtitle: c.campaignId, 
        href: '/campaigns' 
      }))
    ];

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Search API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
