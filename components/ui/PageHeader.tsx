'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
    icon?: LucideIcon;
  };
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in">
      <div>
        <h1 className="text-[1.45rem] font-extrabold text-[#1a1209] leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-[0.875rem] text-[#8a7a5a] mt-1">{description}</p>
        )}
      </div>
      
      {action && (
        <Link 
          href={action.href}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-br from-[#D4A843] to-[#B8923A] text-[#101013] font-bold text-sm rounded-xl shadow-[0_4px_14px_rgba(212,175,55,0.3)] hover:scale-[1.02] transition-all"
        >
          {action.icon && <action.icon size={18} strokeWidth={2.5} />}
          {action.label}
        </Link>
      )}
    </div>
  );
};

export default PageHeader;
