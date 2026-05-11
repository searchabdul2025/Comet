'use client';

import React, { useState, useEffect, useRef } from 'react';

interface StatCardWithSparklineProps {
  label: string;
  value: number;
  icon: string;
  trend?: {
    value: number | string;
    up: boolean;
    label?: string;
  };
  sparkData: number[];
  sparkColor?: string;
  index: number;
}

const StatCardWithSparkline: React.FC<StatCardWithSparklineProps> = ({
  label,
  value,
  icon,
  trend,
  sparkData,
  sparkColor = '#d4af37',
  index
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const sparkRef = useRef<SVGSVGElement>(null);

  // Animated Counter
  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }
    const duration = 800;
    const steps = duration / 16;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  // Sparkline Logic
  const renderSparkline = () => {
    const w = 120, h = 40;
    const max = Math.max(...sparkData);
    const min = Math.min(...sparkData);
    const range = max - min || 1;
    
    const pts = sparkData.map((v, j) => {
      const x = (j / (sparkData.length - 1)) * w;
      const y = h - 6 - ((v - min) / range) * (h - 14);
      return `${x},${y}`;
    }).join(' ');

    const area = `0,${h} ${pts} ${w},${h}`;
    const gid = `spark-grad-${index}`;

    return (
      <>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sparkColor} stopOpacity="0.3"/>
            <stop offset="100%" stopColor={sparkColor} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points={area} fill={`url(#${gid})`} />
        <polyline 
          points={pts} 
          fill="none" 
          stroke={sparkColor} 
          strokeWidth="2.2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      </>
    );
  };

  return (
    <div 
      className="bg-white rounded-[20px] p-[20px_20px_0] border border-[#ede8d8] shadow-[0_2px_14px_rgba(0,0,0,0.05)] overflow-hidden cursor-default transition-all duration-200 hover:-translate-y-[3px] hover:shadow-[0_10px_28px_rgba(180,140,60,0.14)]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-br from-[#f5e49a] to-[#d4af37] flex items-center justify-center text-[1.2rem] mb-[14px] shadow-[0_4px_12px_rgba(212,175,55,0.28)]">
        {icon}
      </div>
      <div className="text-[0.82rem] text-[#8a7a5a] mb-[4px]">{label}</div>
      <div className="text-[2.1rem] font-[800] text-[#1a1209] leading-none mb-[6px]">
        {displayValue.toLocaleString()}
      </div>
      {trend && (
        <div className={`text-[0.75rem] font-[600] mb-[10px] ${trend.up ? 'text-[#16a34a]' : 'text-[#9a8a6a]'}`}>
          {trend.up ? '↗ ' : ''}{trend.label || `${trend.value}% this month`}
        </div>
      )}
      <svg 
        ref={sparkRef} 
        viewBox="0 0 120 40" 
        className="w-full h-[40px]" 
        preserveAspectRatio="none"
      >
        {renderSparkline()}
      </svg>
    </div>
  );
};

export default StatCardWithSparkline;
