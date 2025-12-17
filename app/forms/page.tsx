'use client';

import { useState, useEffect } from 'react';
import { Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';

interface Form {
  _id: string;
  id?: string;
  title: string;
  formId: string;
  description?: string;
  fields: Array<{
    name: string;
    type: string;
    required?: boolean;
    validation?: string;
  }>;
}

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { data: session } = useSession();
  
  const userRole = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
  const permissions = userRole ? getPermissions(userRole) : null;

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/forms');
      const result = await response.json();
      
      if (result.success) {
        setForms(result.data);
      } else {
        setError(result.error || 'Failed to fetch forms');
      }
    } catch (err) {
      setError('Failed to load forms');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this form?')) {
      return;
    }

    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.success) {
        setForms(forms.filter(form => form._id !== id));
      } else {
        alert(result.error || 'Failed to delete form');
      }
    } catch (err) {
      alert('Failed to delete form');
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">All Forms</h1>
        <p className="text-gray-600">Loading forms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">All Forms</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }


  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">All Forms ({forms.length})</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forms.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No forms found. Create your first form using the Form Builder!
          </div>
        ) : (
          forms.map((form) => (
            <div key={form._id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-1">{form.title}</h3>
                <p className="text-sm text-gray-600 mb-2">ID: {form.formId}</p>
                {form.description && (
                  <p className="text-sm text-gray-600 mb-3">{form.description}</p>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">{form.fields?.length || 0} fields</p>
                {form.fields && form.fields.length > 0 && (
                  <div className="space-y-1">
                    {form.fields.slice(0, 3).map((field, idx) => (
                      <p key={idx} className="text-xs text-gray-600">
                        {field.name} ({field.type}){field.required && ' *'}
                        {field.validation && ` (${field.validation})`}
                      </p>
                    ))}
                    {form.fields.length > 3 && (
                      <p className="text-xs text-gray-500">+{form.fields.length - 3} more fields</p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Link
                  href={`/forms/${form._id}/preview`}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center text-sm font-medium"
                >
                  <Eye size={16} className="inline mr-1" />
                  Preview
                </Link>
                {permissions?.canEditForms && (
                  <Link
                    href={`/form-builder?id=${form._id}`}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    Edit
                  </Link>
                )}
                {permissions?.canDeleteForms && (
                  <button
                    onClick={() => handleDelete(form._id)}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 text-center text-gray-500 text-sm">
        2025 portal Developed by Aqstoria
      </div>
    </div>
  );
}

