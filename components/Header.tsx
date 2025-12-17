'use client';

import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [brand, setBrand] = useState<{ name: string; logo?: string }>({ name: 'Portal' });
  const accent = 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadBrand = async () => {
      try {
        const res = await fetch('/api/settings/public');
        const result = await res.json();
        if (result.success) {
          setBrand({ name: result.data.APP_NAME || 'Portal', logo: result.data.APP_LOGO_URL || '' });
        }
      } catch {
        // ignore
      }
    };
    loadBrand();
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    router.refresh();
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted || status === 'loading') {
    return (
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">{brand.name}</h1>
        <div className="flex items-center gap-4">
          <div className="w-20 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </header>
    );
  }

  if (!session?.user) return null;

  const user = session.user;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo} alt={brand.name} className="h-8 w-8 rounded-md object-contain" />
        ) : (
          <div className={`h-8 w-8 rounded-md text-white flex items-center justify-center font-semibold ${accent}`}>
            {brand.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <h1 className="text-xl font-bold text-gray-800">{brand.name}</h1>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-700">{user.name || user.email}</span>
        <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-md font-medium">
          {user.role}
        </span>
        <button
          onClick={handleLogout}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

