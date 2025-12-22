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
  const [duplicateCheckPassed, setDuplicateCheckPassed] = useState(false);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);
  const [productGrade, setProductGrade] = useState('');

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

  // Find phone field (tel) or number field for duplicate check
  const numberField = useMemo(() => {
    if (!formData) return null;
    // First try to find tel (phone) field
    const telField = formData.fields.find((f) => f.type === 'tel');
    if (telField) return telField;
    // Otherwise look for number field
    return formData.fields.find((f) => f.type === 'number') || null;
  }, [formData]);

  // Only auto-check duplicate if we've already passed the initial check
  useEffect(() => {
    if (!numberField || !duplicateCheckPassed) return;
    const phone = values[numberField.id] || '';
    if (!phone || (numberField.type === 'tel' && !isValidUsPhone(phone))) {
      setDuplicate(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setCheckingDuplicate(true);
        // Only check phone numbers via API (number fields won't be checked automatically)
        if (numberField.type === 'tel') {
          const resp = await fetch(`/api/phone-check?phone=${encodeURIComponent(phone)}`, {
            signal: controller.signal,
          });
          const result = await resp.json();
          setDuplicate(Boolean(result.duplicate));
        }
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
  }, [numberField, values, duplicateCheckPassed]);

  const canProceed =
    !numberField ||
    (!!values[numberField.id] && 
     (numberField.type === 'tel' ? isValidUsPhone(values[numberField.id]) : true) && 
     !duplicate);

  const blockClipboard = (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault();
  };

  const handleInputChange = (field: FormField, val: string) => {
    if (field.type === 'tel') {
      const formatted = formatUsPhone(val);
      setValues((prev) => ({ ...prev, [field.id]: formatted }));
      return;
    }
    setValues((prev) => ({ ...prev, [field.id]: val }));
  };

  const handleCheckDuplicate = async () => {
    if (!numberField) return;
    
    const numberValue = values[numberField.id] || '';
    
    // Validate phone number if it's a tel field
    if (numberField.type === 'tel') {
      if (!isValidUsPhone(numberValue)) {
        setError('Please enter a valid US phone number.');
        return;
      }
    } else if (!numberValue.trim()) {
      setError('Please enter a number.');
      return;
    }

    setError('');
    setCheckingDuplicate(true);
    setShowDuplicateAlert(false);

    try {
      // For tel fields, use the phone-check API
      if (numberField.type === 'tel') {
        const resp = await fetch(`/api/phone-check?phone=${encodeURIComponent(numberValue)}`);
        const result = await resp.json();
        
        if (result.success) {
          if (result.duplicate) {
            setDuplicate(true);
            setShowDuplicateAlert(true);
            setDuplicateCheckPassed(false);
          } else {
            setDuplicate(false);
            setDuplicateCheckPassed(true);
          }
        } else {
          setError(result.error || 'Failed to check duplicate');
        }
      } else {
        // For number fields, we might need a different check
        // For now, just allow proceeding if number is entered
        setDuplicateCheckPassed(true);
      }
    } catch (err: any) {
      console.error('Duplicate check failed', err);
      setError(err.message || 'Failed to check duplicate');
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData) return;
    
    // Ensure duplicate check has passed if there's a number field
    if (numberField && !duplicateCheckPassed) {
      setError('Please check for duplicates first.');
      return;
    }
    
    if (numberField) {
      const numberVal = values[numberField.id] || '';
      if (numberField.type === 'tel' && !isValidUsPhone(numberVal)) {
        setError('Enter a valid US phone number before proceeding.');
        return;
      }
      if (duplicate) {
        setError('This number already exists. Cannot proceed.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {};
      formData.fields.forEach((f) => {
        payload[f.id] = values[f.id] ?? '';
      });

      const phoneVal = numberField && numberField.type === 'tel' 
        ? values[numberField.id] 
        : undefined;

      // Try to extract productGrade from form data (check for common field names)
      let extractedProductGrade = productGrade;
      if (!extractedProductGrade) {
        // Check form data for product grade fields
        const productGradeFields = ['productGrade', 'product_grade', 'productType', 'product_type', 'grade', 'product'];
        for (const fieldName of productGradeFields) {
          const field = formData.fields.find(f => 
            f.id.toLowerCase().includes(fieldName.toLowerCase()) || 
            f.name.toLowerCase().includes(fieldName.toLowerCase())
          );
          if (field && payload[field.id]) {
            extractedProductGrade = payload[field.id];
            break;
          }
        }
      }

      const resp = await fetch(`/api/forms/${formId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: payload,
          phoneNumber: phoneVal ? normalizeUsPhone(phoneVal) : undefined,
          productGrade: extractedProductGrade || undefined,
        }),
      });

      const result = await resp.json();
      if (!result.success) {
        setError(result.error || 'Submission failed');
        return;
      }

      setSuccessMessage('Submitted successfully.');
      setValues({});
      setDuplicateCheckPassed(false);
      setProductGrade('');
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

  // Show duplicate check step first if there's a number field and check hasn't passed
  const showDuplicateCheckStep = numberField && !duplicateCheckPassed;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/forms" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Forms
        </Link>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{formData.title}</h1>
        <p className="text-gray-600">{formData.description}</p>
      </div>

      {/* Duplicate Alert Popup */}
      {showDuplicateAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="ml-3 text-lg font-medium text-gray-900">Duplicate Found</h3>
            </div>
            <p className="text-gray-600 mb-4">
              This number already exists in our records. Cannot proceed with submission.
            </p>
            <button
              onClick={() => setShowDuplicateAlert(false)}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        {showDuplicateCheckStep ? (
          // Step 1: Show only number field with Check Duplicate button
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {numberField.name}
                {numberField.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <input
                type={numberField.type}
                value={values[numberField.id] ?? ''}
                onChange={(e) => handleInputChange(numberField, e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 text-black bg-white ${
                  duplicate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder={numberField.type === 'tel' ? '(123) 456-7890' : numberField.validation || ''}
                onPaste={blockClipboard}
                onCopy={blockClipboard}
                onCut={blockClipboard}
              />
              {numberField.validation && (
                <p className="text-xs text-gray-500 mt-1">{numberField.validation}</p>
              )}
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleCheckDuplicate}
                disabled={checkingDuplicate || !values[numberField.id]?.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkingDuplicate ? 'Checking...' : 'Check Duplicate'}
              </button>
              <Link
                href="/forms"
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors inline-block"
              >
                Cancel
              </Link>
            </div>
          </div>
        ) : (
          // Step 2: Show full form after duplicate check passes
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Product Grade Selector - Optional */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Grade (Optional)
              </label>
              <input
                type="text"
                value={productGrade}
                onChange={(e) => setProductGrade(e.target.value)}
                placeholder="e.g., small egg, bigger egg, 12 eggs"
                className="w-full px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
              />
              <p className="text-xs text-gray-600 mt-1">
                Select or enter the product grade for bonus calculation. This can also be extracted from form fields.
              </p>
            </div>
            {formData.fields.map((field, idx) => {
              const value = values[field.id] ?? '';
              const disabled = !!(numberField && field.id !== numberField.id && !canProceed);
              const baseInput =
                'w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 text-black bg-white';

              const clipboardProps = {
                onPaste: blockClipboard,
                onCopy: blockClipboard,
                onCut: blockClipboard,
              };

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
                    {...clipboardProps}
                  />
                )}
                {field.type === 'date' && (
                  <input
                    type="date"
                    value={value}
                    disabled={disabled}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className={`${baseInput} border-gray-300 focus:ring-blue-500`}
                    {...clipboardProps}
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
                          {...clipboardProps}
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
                    {...clipboardProps}
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
                      {...clipboardProps}
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
                    {...clipboardProps}
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
                    {...clipboardProps}
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
                    {...clipboardProps}
                  />
                )}
                {field.validation && !field.options && (
                  <p className="text-xs text-gray-500 mt-1">{field.validation}</p>
                )}
                {field.type === 'tel' && duplicateCheckPassed && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Duplicate check passed. You can proceed with the form.
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
        )}
      </div>
    </div>
  );
}

