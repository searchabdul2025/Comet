'use client';

import { useEffect, useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

type FieldType = 'text' | 'email' | 'tel' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'textarea';

interface FormField {
  id: string;
  name: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  validation?: string;
  options?: string[]; // For select and radio
}

export default function FormBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');
  const [formTitle, setFormTitle] = useState('');
  const [formId, setFormId] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [loading, setLoading] = useState(false);

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Select' },
    { value: 'radio', label: 'Radio' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'textarea', label: 'Textarea' },
  ];

  useEffect(() => {
    if (!editingId) return;
    const loadForm = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/forms/${editingId}`);
        const result = await res.json();
        if (result.success && result.data) {
          const f = result.data;
          setFormTitle(f.title);
          setFormId(f.formId);
          setDescription(f.description || '');
          setFields(f.fields || []);
        }
      } catch (err) {
        console.error('Failed to load form', err);
      } finally {
        setLoading(false);
      }
    };
    loadForm();
  }, [editingId]);

  const handleAddField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: '',
      type: 'text',
      required: false,
    };
    setEditingField(newField);
    setShowAddField(true);
  };

  const handleSaveField = (field: FormField) => {
    if (editingField) {
      if (editingField.id && fields.find(f => f.id === editingField.id)) {
        // Update existing field
        setFields(fields.map(f => f.id === editingField.id ? field : f));
      } else {
        // Add new field
        setFields([...fields, field]);
      }
    }
    setShowAddField(false);
    setEditingField(null);
  };

  const handleDeleteField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
    setShowAddField(true);
  };

  const handleSaveForm = async () => {
    if (!formTitle || !formId) {
      alert('Please fill in Form Title and Form ID');
      return;
    }

    try {
      const isEdit = Boolean(editingId);
      const response = await fetch(isEdit ? `/api/forms/${editingId}` : '/api/forms', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formTitle,
          formId: formId,
          description: description,
          fields: fields,
        }),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/forms');
      } else {
        alert(result.error || 'Failed to save form');
      }
    } catch (err) {
      alert('Failed to save form. Please try again.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          {editingId ? 'Edit Form' : 'Form Builder'}
        </h1>
        <p className="text-gray-600">
          {editingId ? 'Update your form configuration.' : 'Create dynamic forms with validation and multiple field types.'}
        </p>
        {loading && <p className="text-sm text-gray-500">Loading form...</p>}
      </div>

      {/* Form Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Form Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form Title *
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Enter form title"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Form ID *
            </label>
            <input
              type="text"
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              placeholder="Enter unique form ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter form description (optional)"
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y text-black bg-white"
          />
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Form Fields</h2>
          <button
            onClick={handleAddField}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Add Field
          </button>
        </div>

        {fields.length === 0 && !showAddField ? (
          <p className="text-center text-gray-500 py-8">
            No fields added yet. Click &quot;Add Field&quot; to get started.
          </p>
        ) : (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-gray-800">{field.name || 'Unnamed Field'}</span>
                    <span className="text-sm text-gray-500 ml-2">({field.type})</span>
                    {field.required && <span className="text-red-500 ml-2">*</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditField(field)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
                {field.validation && (
                  <p className="text-xs text-gray-500">{field.validation}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {showAddField && editingField && (
          <div className="mt-6 border-2 border-blue-500 rounded-md p-4 bg-blue-50">
            <h3 className="font-bold text-gray-800 mb-4">Field Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Name</label>
                <input
                  type="text"
                  value={editingField.name}
                  onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                  placeholder="Enter field name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Field Type</label>
                <select
                  value={editingField.type}
                  onChange={(e) => setEditingField({ ...editingField, type: e.target.value as FieldType })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                >
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingField.required}
                    onChange={(e) => setEditingField({ ...editingField, required: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Required field</span>
                </label>
              </div>
              {(editingField.type === 'select' || editingField.type === 'radio') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Options (comma-separated)</label>
                  <input
                    type="text"
                    value={editingField.options?.join(', ') || ''}
                    onChange={(e) => setEditingField({
                      ...editingField,
                      options: e.target.value.split(',').map(o => o.trim()).filter(o => o)
                    })}
                    placeholder="Option 1, Option 2, Option 3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Validation (optional)</label>
                <input
                  type="text"
                  value={editingField.validation || ''}
                  onChange={(e) => setEditingField({ ...editingField, validation: e.target.value })}
                  placeholder="e.g., Contains 11 Digit mixture of numerics and words"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveField(editingField)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Save Field
                </button>
                <button
                  onClick={() => {
                    setShowAddField(false);
                    setEditingField(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {fields.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveForm}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              <Save size={20} />
              Save Form
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

