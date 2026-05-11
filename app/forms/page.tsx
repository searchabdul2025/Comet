'use client';

import { useState, useEffect } from 'react';
import { Eye, Trash2, FileText, Pencil, Plus } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { getPermissions } from '@/lib/permissions';
import PageHeader from '@/components/ui/PageHeader';
import StatGrid from '@/components/ui/StatGrid';

interface Form {
  _id: string;
  id?: string;
  title: string;
  formId: string;
  description?: string;
  campaign?: { _id: string; name: string } | string;
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
  const [campaignsAvailable, setCampaignsAvailable] = useState(true);
  const { data: session } = useSession();
  
  const userRole = session?.user?.role as 'Admin' | 'Supervisor' | 'User' | undefined;
  const userPermOverrides = session?.user?.permissions;
  const permissions = userRole ? getPermissions(userRole, userPermOverrides || undefined) : null;

  useEffect(() => {
    fetchForms();
    checkCampaigns();
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

  const checkCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const result = await response.json();
      if (result.success) {
        setCampaignsAvailable((result.data || []).length > 0);
      } else {
        setCampaignsAvailable(false);
      }
    } catch (err) {
      setCampaignsAvailable(false);
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
    <div className="space-y-6">
      <PageHeader 
        title="Form Architecture" 
        description="Design and manage data collection structures for your campaigns."
        action={permissions?.canCreateForms ? {
          label: campaignsAvailable ? "New Form" : "Create Campaign First",
          href: campaignsAvailable ? "/form-builder" : "/campaigns",
          icon: Plus
        } : undefined}
      />

      {/* Forms Summary */}
      <StatGrid 
        loading={loading}
        stats={[
          { 
            label: 'Total Forms', 
            value: forms.length,
            icon: '📋',
            sparkColor: '#D4A843',
            sparkData: [5, 6, 8, 7, 9, 10, 12],
            href: '/forms'
          },
          { 
            label: 'Active Fields', 
            value: forms.reduce((acc, f) => acc + (f.fields?.length || 0), 0),
            icon: '🔢',
            sparkColor: '#16a34a',
            sparkData: [40, 50, 65, 60, 80, 95, 110],
            href: '/form-builder'
          },
          { 
            label: 'Linked Campaigns', 
            value: Array.from(new Set(forms.map(f => (f.campaign && typeof f.campaign === 'object') ? f.campaign._id : f.campaign))).filter(Boolean).length,
            icon: '🔗',
            sparkColor: '#101013',
            sparkData: [2, 3, 3, 4, 4, 5, 5],
            href: '/campaigns'
          }
        ]}
      />

      {!campaignsAvailable && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">⚠️</div>
          <p>Please create at least one <strong>Campaign</strong> before architecting new forms.</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {forms.length === 0 ? (
          <div className="col-span-full py-20 text-center card-premium">
             <div className="text-4xl mb-4 opacity-20">📭</div>
             <h3 className="text-lg font-bold text-[var(--text-secondary)]">No Forms Found</h3>
             <p className="text-sm text-[var(--text-tertiary)]">Start by creating your first data collection structure.</p>
          </div>
        ) : (
          forms.map((form) => (
            <div key={form._id} className="card-premium group hover:border-[#D4A843]/30 transition-all duration-500 overflow-hidden">
               {/* Card Header Graphic */}
               <div className="h-2 bg-gradient-to-r from-[#101013] via-[#D4A843] to-[#101013] opacity-20 group-hover:opacity-100 transition-all duration-700" />
               
               <div className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-[#101013] group-hover:text-[#D4A843] transition-all duration-500">
                      <FileText size={20} />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-tertiary)] bg-slate-100 px-2 py-1 rounded-full uppercase tracking-widest">
                      {form.formId}
                    </span>
                 </div>
                 
                 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1 group-hover:text-[#D4A843] transition-colors">{form.title}</h3>
                 <p className="text-[11px] text-[var(--text-tertiary)] mb-4 flex items-center gap-1">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                   {(form.campaign && typeof form.campaign === 'object') ? form.campaign.name : 'Unlinked Campaign'}
                 </p>
                 
                 {form.description && (
                   <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-6 min-h-[32px]">
                     {form.description}
                   </p>
                 )}
                 
                 <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                       <span>Fields Configuration</span>
                       <span>{form.fields?.length || 0} Total</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                       {form.fields?.slice(0, 4).map((field, idx) => (
                         <span key={idx} className="px-2 py-1 bg-slate-50 text-[10px] text-slate-500 rounded-lg border border-slate-100 group-hover:border-[#D4A843]/10 transition-all">
                           {field.name}
                         </span>
                       ))}
                       {form.fields && form.fields.length > 4 && (
                         <span className="px-2 py-1 bg-[#101013]/5 text-[10px] text-[var(--text-tertiary)] rounded-lg">
                           +{form.fields.length - 4} more
                         </span>
                       )}
                    </div>
                 </div>
                 
                 <div className="flex gap-2 pt-4 border-t border-slate-50">
                    <Link 
                      href={`/forms/${form._id}/preview`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-[#101013] hover:text-[#D4A843] transition-all"
                    >
                      <Eye size={14}/> Preview
                    </Link>
                    {permissions?.canEditForms && (
                      <Link 
                        href={`/form-builder?id=${form._id}`}
                        className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 hover:text-slate-700 transition-all"
                      >
                        <Pencil size={14}/>
                      </Link>
                    )}
                    {permissions?.canDeleteForms && (
                      <button 
                        onClick={() => handleDelete(form._id)}
                        className="p-2.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14}/>
                      </button>
                    )}
                 </div>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

