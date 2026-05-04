import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

export default function MonthlyTargetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex">
        <Sidebar requestCount={0} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

