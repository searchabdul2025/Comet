import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f6f9fc]">
      <Header />
      <div className="flex">
        <Sidebar requestCount={1} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

