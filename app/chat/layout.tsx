'use client';

import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useEffect, useState } from 'react';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSubdomain, setIsSubdomain] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSubdomain(window.location.hostname === 'chat.cometbpo.org');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[var(--page-bg)] flex relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-[var(--page-blob-1)] blur-[100px] pointer-events-none opacity-50" />
      <div className="absolute bottom-[-5%] left-[10%] w-[400px] h-[400px] rounded-full bg-[var(--page-blob-2)] blur-[80px] pointer-events-none opacity-50" />
      
      {!isSubdomain && <Sidebar requestCount={0} />}
      
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {!isSubdomain && <Header />}
        <main className={`flex-1 p-4 md:p-8 overflow-y-auto ${isSubdomain ? 'flex items-center justify-center' : ''}`}>
          <div className={`${isSubdomain ? 'w-full' : 'max-w-[1600px]'} animate-fade-in`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
