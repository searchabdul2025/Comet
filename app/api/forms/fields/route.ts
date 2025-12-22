import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Form, { IFormField } from '@/models/Form';
import { getCurrentUser } from '@/lib/auth';

// GET all unique form field names from all forms
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();
    const forms = await Form.find().select('fields');
    
    // Extract all unique field names
    const fieldMap = new Map<string, { name: string; id: string; type: string }>();
    
    forms.forEach(form => {
      form.fields?.forEach((field: IFormField) => {
        // Use field name as key, but store both name and id
        if (!fieldMap.has(field.name)) {
          fieldMap.set(field.name, {
            name: field.name,
            id: field.id,
            type: field.type,
          });
        }
      });
    });
    
    const uniqueFields = Array.from(fieldMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    return NextResponse.json({ success: true, data: uniqueFields });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

