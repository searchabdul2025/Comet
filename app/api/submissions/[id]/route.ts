import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import FormSubmission from '@/models/FormSubmission';
import { getCurrentUser } from '@/lib/auth';
import { deleteSubmissionFromSheets, resolveSheetsConfig } from '@/lib/googleSheets';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    // Check permission to delete submissions
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user from database to check permissions
    const User = (await import('@/models/User')).default;
    await connectDB();
    const dbUser = await User.findOne({ email: user.email }).lean() as any;
    
    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { requirePermission } = await import('@/lib/permissions');
    if (!requirePermission(
      dbUser?.role as any,
      'canDeleteSubmissions',
      dbUser?.permissions as any
    )) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You do not have permission to delete submissions' },
        { status: 403 }
      );
    }

    const { id } = params instanceof Promise ? await params : params;
    const searchParams = request.nextUrl.searchParams;
    const deleteFrom = searchParams.get('deleteFrom'); // 'portal', 'sheets', or 'both'

    await connectDB();

    const submission = await FormSubmission.findById(id);
    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    const results: { portal?: boolean; sheets?: boolean; error?: string } = {};

    // Delete from Portal Records
    if (deleteFrom === 'portal' || deleteFrom === 'both') {
      await FormSubmission.findByIdAndUpdate(id, {
        deleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
      });
      results.portal = true;
    }

    // Delete from Google Sheets
    if (deleteFrom === 'sheets' || deleteFrom === 'both') {
      try {
        const { sheetId, submissionsTab } = await resolveSheetsConfig();
        if (sheetId) {
          const deleteResult = await deleteSubmissionFromSheets({
            sheetId,
            tabName: submissionsTab,
            submissionId: id,
          });
          results.sheets = deleteResult.success;
          if (!deleteResult.success) {
            results.error = deleteResult.error;
          }
        } else {
          results.sheets = false;
          results.error = 'Google Sheets not configured';
        }
      } catch (error: any) {
        results.sheets = false;
        results.error = error.message || 'Failed to delete from Google Sheets';
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: `Submission deleted from ${deleteFrom === 'both' ? 'Portal and Google Sheets' : deleteFrom === 'portal' ? 'Portal' : 'Google Sheets'}`,
    });
  } catch (error: any) {
    console.error('Delete submission error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete submission' },
      { status: 500 }
    );
  }
}

