import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="flex">
        <Sidebar requestCount={1} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}












