'use client';

import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterBarProps {
  searchPlaceholder?: string;
  onSearchChange?: (value: string) => void;
  filters?: {
    label: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
}

const FilterBar: React.FC<FilterBarProps> = ({ searchPlaceholder = 'Search...', onSearchChange, filters }) => {
  return (
    <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[var(--text-tertiary)]">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-[var(--card-border)] text-sm font-medium focus:border-[#D4A843] focus:ring-4 focus:ring-[#D4A843]/10 transition-all outline-none"
        />
      </div>

      {filters?.map((filter, i) => (
        <div key={i} className="relative min-w-[140px] w-full md:w-auto">
          <select
            onChange={(e) => filter.onChange(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-3 rounded-2xl bg-white border border-[var(--card-border)] text-sm font-medium text-[var(--text-secondary)] focus:border-[#D4A843] transition-all outline-none cursor-pointer"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-[var(--text-tertiary)]">
            <ChevronDown size={16} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default FilterBar;
