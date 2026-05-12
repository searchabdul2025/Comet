import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Campaign from '@/models/Campaign';
import { getCurrentUser } from '@/lib/auth';
import { createSheetTab } from '@/lib/googleSheets';
import { requirePermission } from '@/lib/permissions';

async function resolveParams(params: Promise<{ id: string }> | { id: string }) {
  return params instanceof Promise ? await params : params;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageSettings', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await resolveParams(params);
    const body = await request.json();
    const { name, label, purpose } = body;

    if (!name || !label || !purpose) {
      return NextResponse.json({ success: false, error: 'Name, label, and purpose are required' }, { status: 400 });
    }

    await connectDB();
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    const sheetId = campaign.googleSheetId;
    if (!sheetId) {
      return NextResponse.json({ success: false, error: 'Campaign has no Google Sheet ID set' }, { status: 400 });
    }

    // 1. Physically create the tab in Google Sheets
    try {
      await createSheetTab(sheetId, name);
    } catch (error: any) {
      // If it already exists, we might get an error, but we can continue if it's just "already exists"
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }

    // 2. Save the tab config to the campaign model
    const newTab = { name, label, purpose };
    campaign.sheetTabs = [...(campaign.sheetTabs || []), newTab];
    await campaign.save();

    return NextResponse.json({ success: true, data: campaign });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !requirePermission(user.role as any, 'canManageSettings', user.permissions)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await resolveParams(params);
    const { searchParams } = new URL(request.url);
    const tabName = searchParams.get('name');

    if (!tabName) {
      return NextResponse.json({ success: false, error: 'Tab name is required' }, { status: 400 });
    }

    await connectDB();
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 });
    }

    // Remove tab from config (we don't delete from Google Sheets to avoid data loss)
    campaign.sheetTabs = (campaign.sheetTabs || []).filter((t: any) => t.name !== tabName);
    await campaign.save();

    return NextResponse.json({ success: true, data: campaign });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
