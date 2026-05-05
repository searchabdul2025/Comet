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

        {/* Center Side - Trophy SVG */}
        <div className="relative z-[1] flex justify-center items-end h-full">
          <svg viewBox="0 0 210 230" width="190" height="210"
            className="overflow-visible drop-shadow-[0_10_28px_rgba(180,140,60,0.38)]"
          >
            <defs>
              <radialGradient id="glowBg" cx="50%" cy="60%" r="50%">
                <stop offset="0%" stopColor="#fff9e0" stopOpacity="0.95"/>
                <stop offset="100%" stopColor="#fff9e0" stopOpacity="0"/>
              </radialGradient>
              <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f9e070"/>
                <stop offset="50%" stopColor="#d4a820"/>
                <stop offset="100%" stopColor="#b8880e"/>
              </linearGradient>
              <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f0d060"/>
                <stop offset="100%" stopColor="#c49018"/>
              </linearGradient>
              <linearGradient id="podV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff"/>
                <stop offset="100%" stopColor="#e8e0cc"/>
              </linearGradient>
              <linearGradient id="ring" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f0cc50"/>
                <stop offset="100%" stopColor="#c49020"/>
              </linearGradient>
              <filter id="sg">
                <feGaussianBlur stdDeviation="2.5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* glow */}
            <ellipse cx="105" cy="120" rx="92" ry="82" fill="url(#glowBg)"/>
            {/* shadow */}
            <ellipse cx="105" cy="212" rx="52" ry="7" fill="rgba(212,175,55,0.18)"/>
            {/* podium tiers */}
            <rect x="32" y="190" width="146" height="20" rx="5" fill="url(#podV)" stroke="#ddd4b8" strokeWidth="0.5"/>
            <rect x="32" y="188" width="146" height="5" rx="2.5" fill="url(#ring)" opacity="0.7"/>
            <rect x="48" y="173" width="114" height="19" rx="5" fill="url(#podV)" stroke="#ddd4b8" strokeWidth="0.5"/>
            <rect x="48" y="171" width="114" height="4" rx="2" fill="url(#ring)" opacity="0.6"/>
            <rect x="66" y="158" width="78" height="17" rx="5" fill="url(#podV)" stroke="#ddd4b8" strokeWidth="0.5"/>
            <rect x="66" y="156" width="78" height="4" rx="2" fill="url(#ring)" opacity="0.5"/>
            {/* left figure */}
            <circle cx="71" cy="115" r="9" fill="url(#g1)"/>
            <ellipse cx="74" cy="136" rx="10" ry="16" fill="url(#g1)" transform="rotate(-10,74,136)"/>
            <path d="M66 127 Q51 107 45 95" stroke="#e8c030" strokeWidth="7" fill="none" strokeLinecap="round"/>
            <path d="M81 130 Q91 122 95 136" stroke="#d4a820" strokeWidth="6" fill="none" strokeLinecap="round"/>
            <path d="M70 150 Q63 163 61 157" stroke="#c49020" strokeWidth="6" fill="none" strokeLinecap="round"/>
            <path d="M77 151 Q82 164 80 158" stroke="#c49020" strokeWidth="6" fill="none" strokeLinecap="round"/>
            {/* right figure */}
            <circle cx="139" cy="115" r="9" fill="url(#g2)"/>
            <ellipse cx="136" cy="136" rx="10" ry="16" fill="url(#g2)" transform="rotate(10,136,136)"/>
            <path d="M144 127 Q159 107 165 95" stroke="#e8c030" strokeWidth="7" fill="none" strokeLinecap="round"/>
            <path d="M129 130 Q119 122 115 136" stroke="#d4a820" strokeWidth="6" fill="none" strokeLinecap="round"/>
            <path d="M140 150 Q147 163 149 157" stroke="#c49020" strokeWidth="6" fill="none" strokeLinecap="round"/>
            <path d="M133 151 Q128 164 130 158" stroke="#c49020" strokeWidth="6" fill="none" strokeLinecap="round"/>
            {/* stars */}
            <polygon points="105,11 108,20 118,20 110,26 113,35 105,29 97,35 100,26 92,20 102,20" fill="#f5c020" filter="url(#sg)"/>
            <polygon points="75,28 77.5,35 85,35 79,39.5 81.5,47 75,42.5 68.5,47 71,39.5 65,35 72.5,35" fill="#f5c020" opacity="0.9"/>
            <polygon points="135,28 137.5,35 145,35 139,39.5 141.5,47 135,42.5 128.5,47 131,39.5 125,35 132.5,35" fill="#f5c020" opacity="0.9"/>
            <polygon points="54,54 56,60 62,60 57,64 59,70 54,66 49,70 51,64 46,60 52,60" fill="#f5c020" opacity="0.75"/>
            <polygon points="156,54 158,60 164,60 159,64 161,70 156,66 151,70 153,64 148,60 154,60" fill="#f5c020" opacity="0.75"/>
          </svg>
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
