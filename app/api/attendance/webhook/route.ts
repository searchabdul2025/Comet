import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AttendanceRecord from '@/models/AttendanceRecord';
import User from '@/models/User';
import Setting from '@/models/Setting';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    let bodyText = '';
    let employeeNo = '';
    let checkInTime = new Date();

    if (contentType.includes('application/json')) {
      const data = await req.json();
      // Assume normalized JSON structure
      employeeNo = data.AccessControllerEvent?.employeeNoString || data.employeeNoString || data.employeeNo;
      if (data.dateTime) {
        checkInTime = new Date(data.dateTime);
      }
    } else {
      // For XML or multipart, simplistic regex extraction
      bodyText = await req.text();
      const match = bodyText.match(/<employeeNoString>(.*?)<\/employeeNoString>/);
      if (match && match[1]) {
        employeeNo = match[1];
      }
      
      const timeMatch = bodyText.match(/<dateTime>(.*?)<\/dateTime>/);
      if (timeMatch && timeMatch[1]) {
        checkInTime = new Date(timeMatch[1]);
      }
    }

    if (!employeeNo) {
      return NextResponse.json({ success: false, error: 'No employeeNoString found' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ biometricId: employeeNo });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User with this biometric ID not found' }, { status: 404 });
    }

    // Check rules to determine status and fine
    const shiftStartTimeSetting = await Setting.findOne({ key: 'ATTENDANCE_SHIFT_START_TIME' });
    const lateThresholdSetting = await Setting.findOne({ key: 'ATTENDANCE_LATE_THRESHOLD_MINUTES' });
    const lateRulesSetting = await Setting.findOne({ key: 'ATTENDANCE_LATE_RULES' });
    const baseLateFineSetting = await Setting.findOne({ key: 'ATTENDANCE_LATE_FINE_AMOUNT' });
    const holidaysSetting = await Setting.findOne({ key: 'ATTENDANCE_HOLIDAYS' });

    let status: 'Present' | 'Late' | 'Holiday' = 'Present';
    let fineAmount = 0;
    
    // Check if it's a holiday
    const dateStr = checkInTime.toISOString().slice(0, 10);
    const holidays = JSON.parse(holidaysSetting?.value || '[]');
    if (holidays.includes(dateStr)) {
      status = 'Holiday';
    } else if (shiftStartTimeSetting?.value && lateThresholdSetting?.value) {
      const [shiftHour, shiftMinute] = shiftStartTimeSetting.value.split(':').map(Number);
      const lateThreshold = Number(lateThresholdSetting.value);
      
      const expectedTime = new Date(checkInTime);
      expectedTime.setHours(shiftHour, shiftMinute, 0, 0);
      
      const diffMs = checkInTime.getTime() - expectedTime.getTime();
      const diffMinutes = Math.floor(diffMs / 60000);
      
      if (diffMinutes > lateThreshold) {
        status = 'Late';
        
        // Tiered Late Fines
        const rules = JSON.parse(lateRulesSetting?.value || '[]');
        if (rules.length > 0) {
          // Sort rules by minutes descending to find the highest match
          const sortedRules = [...rules].sort((a: any, b: any) => b.min - a.min);
          const matchedRule = sortedRules.find((r: any) => diffMinutes >= r.min);
          if (matchedRule) {
            fineAmount = Number(matchedRule.fine);
          } else {
            fineAmount = Number(baseLateFineSetting?.value || 0);
          }
        } else {
          fineAmount = Number(baseLateFineSetting?.value || 0);
        }
      }
    }

    // Prevent duplicate check-ins for the same day
    const startOfDay = new Date(checkInTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(checkInTime);
    endOfDay.setHours(23, 59, 59, 999);

    const existingRecord = await AttendanceRecord.findOne({
      userId: user._id,
      checkInTime: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingRecord) {
      return NextResponse.json({ success: true, message: 'Already checked in for today' }, { status: 200 });
    }

    await AttendanceRecord.create({
      userId: user._id,
      biometricId: employeeNo,
      checkInTime,
      status,
      fineAmount
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: any) {
    console.error('Hikvision Webhook Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
