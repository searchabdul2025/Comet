'use client';

import React, { useState, useEffect } from 'react';

interface AdminBannerProps {
  adminName: string;
}

const AdminBanner: React.FC<AdminBannerProps> = ({ adminName }) => {
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting((h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening') + ', ' + adminName + ' 👋');

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    setDateStr(days[now.getDay()].toUpperCase() + ', ' + months[now.getMonth()].slice(0, 3).toUpperCase() + ' ' + now.getDate());
  }, [adminName]);

  return (
    <div className="w-full">
      {/* Heading */}
      <div className="mb-[14px]">
        <h1 className="text-[1.45rem] font-[800] text-[#1a1209] leading-tight">
          {greeting}
        </h1>
        <p className="text-[0.875rem] color-[#8a7a5a] mt-[3px]">
          Here's what's happening across your platform today.
        </p>
      </div>

      {/* Banner */}
      <div 
        className="relative overflow-hidden rounded-[22px] border-[1.5px] border-[rgba(212,175,55,0.18)] shadow-[0_4px_32px_rgba(180,140,60,0.12)] p-[30px_36px] mb-[20px] grid grid-cols-[1fr_auto_1fr] items-center gap-[16px] min-h-[180px]"
        style={{
          background: 'linear-gradient(115deg, #fdfbf2 0%, #fef9ec 50%, #fdf5df 100%)',
          fontFamily: "'DM Sans', sans-serif"
        }}
      >
        {/* Banner Glow Background */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[55%] w-[380px] height-[280px] rounded-full pointer-events-none z-0 opacity-90"
             style={{
               background: 'radial-gradient(ellipse, rgba(255,248,200,0.9) 0%, rgba(255,248,200,0.3) 45%, transparent 70%)',
               height: '280px'
             }} 
        />

        {/* Left Side */}
        <div className="relative z-[1]">
          <div className="flex items-center gap-[6px] text-[0.72rem] font-[700] text-[#d4af37] tracking-[0.9px] mb-[10px] uppercase">
            <span>📅</span> {dateStr}
          </div>
          <div className="b-welcome">
            <h2 className="text-[1.75rem] font-[800] text-[#1a1209] line-height-[1.2]">
              Welcome back,<br />
              <span className="text-[#d4af37]">{adminName}</span>
            </h2>
          </div>
        </div>

        {/* Center Side - Banner Graphic */}
        <div className="relative z-[1] flex justify-center items-end h-full min-w-[380px]">
           <img 
             src="/banner.svg" 
             alt="Banner" 
             className="absolute bottom-[-15px] transform scale-125 drop-shadow-[0_20px_50px_rgba(180,140,60,0.3)]"
             style={{ width: '400px', height: 'auto' }}
           />
        </div>

        {/* Right Side Status */}
        <div className="relative z-[1] flex justify-end items-center">
          <div className="flex items-center gap-[13px] bg-[rgba(255,255,255,0.82)] border border-[rgba(212,175,55,0.22)] rounded-[18px] p-[14px_20px] shadow-[0_2px_14px_rgba(180,140,60,0.08)]">
            <div className="w-[46px] h-[46px] rounded-full bg-gradient-to-br from-[#d4af37] to-[#f0cc60] flex items-center justify-center text-[1.15rem] flex-shrink-0 shadow-[0_4px_14px_rgba(212,175,55,0.4)]">
              🛡️
            </div>
            <div>
              <div className="text-[0.67rem] text-[#9a8a6a]">System Status</div>
              <div className="text-[0.95rem] font-[800] text-[#1a1209]">All Systems</div>
              <div className="flex items-center gap-[5px] text-[0.72rem] font-[700] text-[#16a34a] mt-[4px]">
                <div className="w-[7px] h-[7px] rounded-full bg-[#22c55e] animate-pulse" />
                Operational
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.5); }
        }
        .animate-pulse {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminBanner;
