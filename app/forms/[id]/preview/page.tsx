'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { formatUsPhone, isValidUsPhone, normalizeUsPhone } from '@/lib/phone';

interface FormField {
  id: string;
  name: string;
  type: string;
  required?: boolean;
  validation?: string;
  options?: string[];
}

interface FormData {
  _id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export default function FormPreviewPage() {
  const params = useParams();
  const formId = params.id;
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [duplicate, setDuplicate] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);

  useEffect(() => {
    fetchForm();
  }, [formId]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!formId || typeof formId !== 'string') {
        setError('Invalid form ID');
        return;
      }
      
      const response = await fetch(`/api/forms/${formId}`);
      const result = await response.json();
      
      if (result.success) {
        setFormData(result.data);
      } else {
        setError(result.error || 'Failed to load form');
        console.error('Form fetch error:', result);
      }
    } catch (err: any) {
      console.error('Form fetch exception:', err);
      setError(err.message || 'Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const phoneField = useMemo(
    () => formData?.fields.find((f) => f.type === 'tel'),
    [formData]
  );

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
        setCheckingDuplicate(true);
        const resp = await fetch(`/api/phone-check?phone=${encodeURIComponent(phone)}`, {
          signal: controller.signal,
        });
        const result = await resp.json();
        setDuplicate(Boolean(result.duplicate));
      } catch (err) {
        console.error('Phone check failed', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [phoneField, values]);

  const canProceed =
    !phoneField ||
    (!!values[phoneField.id] && isValidUsPhone(values[phoneField.id]) && !duplicate);

  const handleInputChange = (field: FormField, val: string) => {
    if (field.type === 'tel') {
      const formatted = formatUsPhone(val);
      setValues((prev) => ({ ...prev, [field.id]: formatted }));
      return;
    }
    setValues((prev) => ({ ...prev, [field.id]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData) return;
    if (phoneField) {
      const phoneVal = values[phoneField.id] || '';
      if (!isValidUsPhone(phoneVal)) {
        setError('Enter a valid US phone number before proceeding.');
        return;
      }
      if (duplicate) {
        setError('This phone number already exists. Cannot proceed.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      formData.fields.forEach((f) => {
        payload[f.id] = values[f.id] ?? '';
      });

      const phoneVal = phoneField ? values[phoneField.id] : undefined;

      const resp = await fetch(`/api/forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: payload,
          phoneNumber: phoneVal ? normalizeUsPhone(phoneVal) : undefined,
        }),
      });

      const result = await resp.json();
      if (!result.success) {
        setError(result.error || 'Submission failed');
        return;
      }

      setSuccessMessage('Submitted successfully.');
      setValues({});
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/forms" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Forms
          </Link>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/forms" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back to Forms
          </Link>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Form not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/forms" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Forms
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{formData.title}</h1>
        <p className="text-gray-600">{formData.description}</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {formData.fields.map((field, idx) => {
            const value = values[field.id] ?? '';
            const disabled = phoneField && field.id !== phoneField.id && !canProceed;
            const baseInput =
              'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 text-black bg-white';

            return (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.name}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={value}
                    disabled={disabled}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} border-gray-300 focus:ring-blue-500`}
                    placeholder={field.validation || ''}
                  />
                )}
                {field.type === 'date' && (
                  <input
                    type="date"
                    value={value}
                    disabled={disabled}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} border-gray-300 focus:ring-blue-500`}
                  />
                )}
                {field.type === 'radio' && field.options && (
                  <div className="space-y-2">
                    {field.options.map((option, optIdx) => (
                      <label key={optIdx} className="flex items-center">
                        <input
                          type="radio"
                          name={field.id}
                          value={option}
                          checked={value === option}
                          disabled={disabled}
                          onChange={(e) => handleInputChange(field, e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-black">{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                {field.type === 'select' && field.options && (
                  <select
                    value={value}
                    disabled={disabled}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} border-gray-300 focus:ring-blue-500`}
                  >
                    <option value="">Select an option</option>
                    {field.options.map((option, optIdx) => (
                      <option key={optIdx} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}
                {field.type === 'textarea' && (
                  <textarea
                    value={value}
                    disabled={disabled}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} border-gray-300 focus:ring-blue-500 resize-y`}
                    rows={4}
                  />
                )}
                {field.type === 'checkbox' && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value === 'true'}
                      disabled={disabled}
                      onChange={(e) => handleInputChange(field, e.target.checked ? 'true' : 'false')}
                      className="mr-2"
                    />
                    <span className="text-black">I agree</span>
                  </label>
                )}
                {field.type === 'email' && (
                  <input
                    type="email"
                    value={value}
                    disabled={disabled}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} border-gray-300 focus:ring-blue-500`}
                    placeholder={field.validation || ''}
                  />
                )}
                {field.type === 'tel' && (
                  <input
                    type="tel"
                    value={value}
                    disabled={false}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} focus:ring-blue-500 ${
                      duplicate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(123) 456-7890"
                  />
                )}
                {field.type === 'number' && (
                  <input
                    type="number"
                    value={value}
                    disabled={disabled}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} border-gray-300 focus:ring-blue-500`}
                    placeholder={field.validation || ''}
                  />
                )}
                {field.validation && !field.options && (
                  <p className="text-xs text-gray-500 mt-1">{field.validation}</p>
                )}
                {field.type === 'tel' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Enter phone first. {checkingDuplicate ? 'Checking...' : duplicate ? 'Phone exists; cannot proceed.' : 'You can continue after phone is valid.'}
                  </p>
                )}
              </div>
            );
          })}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={submitting || !canProceed}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
            <Link
              href="/forms"
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors inline-block"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

