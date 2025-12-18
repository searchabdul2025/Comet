'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { formatUsPhone, isValidUsPhone, normalizeUsPhone } from '@/lib/phone';

interface Field {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  validation?: string;
  options?: string[];
}

interface MajorFormResponse {
  form: {
    _id: string;
    title: string;
    description?: string;
    fields: Field[];
  };
  leadMode: 'auto' | 'manual';
  calendlyUrl?: string;
}

export default function MajorFormPage() {
  const [data, setData] = useState<MajorFormResponse | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [duplicate, setDuplicate] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/employee/major-form');
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || 'Failed to load form');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load form');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const phoneField = useMemo(() => data?.form.fields.find((f) => f.type === 'tel'), [data]);

  useEffect(() => {
    if (!phoneField) return;
    const phone = values[phoneField.id] || '';
    if (!phone || !isValidUsPhone(phone)) {
      setDuplicate(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const resp = await fetch(`/api/phone-check?phone=${encodeURIComponent(phone)}`, { signal: controller.signal });
        const result = await resp.json();
        setDuplicate(Boolean(result.duplicate));
      } catch {
        // ignore
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [phoneField, values]);

  const blockClipboard = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  const handleInputChange = (field: Field, val: string) => {
    if (field.type === 'tel') {
      const formatted = formatUsPhone(val);
      setValues((prev) => ({ ...prev, [field.id]: formatted }));
      return;
    }
    setValues((prev) => ({ ...prev, [field.id]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setError('');
    setSuccess('');

    if (phoneField) {
      const phoneVal = values[phoneField.id] || '';
      if (!isValidUsPhone(phoneVal)) {
        setError('Enter a valid phone number');
        return;
      }
      if (duplicate) {
        setError('This phone already exists. Please verify.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      data.form.fields.forEach((f) => (payload[f.id] = values[f.id] ?? ''));
      const res = await fetch('/api/employee/major-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: payload,
          createLead: data.leadMode === 'manual', // allow manual trigger as well
        }),
      });
      const result = await res.json();
      if (!result.success) {
        setError(result.error || 'Submission failed');
      } else {
        setSuccess('Submitted successfully' + (result.data?.lead ? ' and lead created.' : '.'));
        setValues({});
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading major form...</div>;
  }
  if (error || !data) {
    return <div className="text-red-600">{error || 'Form not available'}</div>;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Major Form</h1>
        <p className="text-gray-600">Submit your primary lead details. Lead mode: {data.leadMode === 'auto' ? 'Auto-create' : 'Manual'}.</p>
        {data.calendlyUrl && (
          <p className="text-sm text-blue-700 mt-2">
            Calendly: <Link href={data.calendlyUrl} className="underline" target="_blank">Open scheduling</Link>
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form className="space-y-5" onSubmit={handleSubmit}>
          {data.form.fields.map((field) => {
            const value = values[field.id] ?? '';
            const baseInput =
              'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 text-black bg-white';
            const clipboardProps = {
              onPaste: blockClipboard,
              onCopy: blockClipboard,
              onCut: blockClipboard,
            };
            return (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} border-gray-300 focus:ring-blue-500`}
                    placeholder={field.validation || ''}
                    {...clipboardProps}
                  />
                )}
                {field.type === 'date' && (
                  <input
                    type="date"
                    value={value}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} border-gray-300 focus:ring-blue-500`}
                    {...clipboardProps}
                  />
                )}
                {field.type === 'textarea' && (
                  <textarea
                    value={value}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} border-gray-300 focus:ring-blue-500 resize-y`}
                    rows={4}
                    {...clipboardProps}
                  />
                )}
                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={value === 'true'}
                      onChange={(e) => handleInputChange(field, e.target.checked ? 'true' : 'false')}
                      className="rounded"
                      {...clipboardProps}
                    />
                    {field.validation || 'Confirm selection'}
                  </label>
                )}
                {field.type === 'tel' && (
                  <input
                    type="tel"
                    value={value}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} ${duplicate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    placeholder="(123) 456-7890"
                    {...clipboardProps}
                  />
                )}
                {field.validation && !['checkbox'].includes(field.type) && (
                  <p className="text-xs text-gray-500 mt-1">{field.validation}</p>
                )}
                {field.type === 'tel' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {duplicate ? 'Phone exists, verify before continuing.' : 'Phone must be valid to proceed.'}
                  </p>
                )}
              </div>
            );
          })}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">{error}</div>}
          {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-md text-sm">{success}</div>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit & Create Lead'}
            </button>
            <Link href="/employee/leads" className="px-4 py-2 rounded-md border border-gray-200 text-gray-800 hover:bg-gray-100">
              View Leads
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

