'use client';

import React from 'react';
import StatCardWithSparkline from '../StatCardWithSparkline';

interface Stat {
  label: string;
  value: number;
  trend?: { value: number; up: boolean; label?: string };
  sparkData?: number[];
  icon?: string;
  sparkColor?: string;
  href?: string;
}

interface StatGridProps {
  stats: Stat[];
  loading?: boolean;
}

const StatGrid: React.FC<StatGridProps> = ({ stats, loading }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[14px] mb-8">
      {stats.map((m, i) => (
        <StatCardWithSparkline
          key={m.label}
          label={m.label}
          value={loading ? 0 : m.value}
          icon={m.icon || '📊'}
          trend={m.trend}
          sparkData={m.sparkData || [1,1,1,1,1,1,1]}
          sparkColor={m.sparkColor}
          index={i}
          href={m.href}
        />
      ))}
    </div>
  );
};

export default StatGrid;
