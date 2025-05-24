import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/sidebar/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 pl-64">
          <main className="p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
