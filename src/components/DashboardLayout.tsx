import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-full bg-stone-50">
      <Sidebar />
      <main className="flex-1 md:ml-[240px]">
        <div className="mx-auto max-w-[1200px] px-4 py-4 pb-24 md:px-6 md:py-6 md:pb-6">
          {children}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
