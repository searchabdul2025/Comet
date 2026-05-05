'use client';

import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  align?: 'left' | 'right' | 'center';
  className?: string;
}

interface PremiumTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  rowExpansion?: (item: T) => React.ReactNode;
  isExpanded?: (item: T) => boolean;
}

const PremiumTable = <T extends { _id?: string; id?: string }>({
  columns,
  data,
  loading,
  emptyMessage = 'No data found',
  onRowClick,
  rowExpansion,
  isExpanded,
}: PremiumTableProps<T>) => {
  return (
    <div className="card-premium overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[var(--card-border)] bg-white/50">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={`px-6 py-4 text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                  } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--card-border)]">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-[var(--text-tertiary)]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, i) => {
                const expanded = isExpanded?.(item);
                return (
                  <React.Fragment key={item._id || item.id || i}>
                    <tr
                      onClick={() => onRowClick?.(item)}
                      className={`group transition-all hover:bg-[var(--gold-50)]/30 ${onRowClick ? 'cursor-pointer' : ''} ${expanded ? 'bg-[var(--gold-50)]/20' : ''}`}
                    >
                      {columns.map((col, j) => (
                        <td
                          key={j}
                          className={`px-6 py-4 text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors ${
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''
                          } ${col.className || ''}`}
                        >
                          {typeof col.accessor === 'function'
                            ? col.accessor(item)
                            : (item[col.accessor] as React.ReactNode)}
                        </td>
                      ))}
                    </tr>
                    {expanded && rowExpansion && (
                      <tr>
                        <td colSpan={columns.length} className="p-0 border-t-0 animate-in fade-in slide-in-from-top-1 duration-300">
                          {rowExpansion(item)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PremiumTable;
