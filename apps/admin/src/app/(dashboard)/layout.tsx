import { AdminSidebar } from '@/components/layout/admin-sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <AdminSidebar />
      <div className="lg:pl-64">
        <div className="min-h-screen p-6 pt-16 lg:p-8 lg:pt-8">{children}</div>
      </div>
    </div>
  );
}
