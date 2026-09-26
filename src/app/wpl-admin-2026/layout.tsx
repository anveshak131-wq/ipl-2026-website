import AdminSessionBootstrap from '@/components/admin/AdminSessionBootstrap';

export const dynamic = 'force-dynamic';

export default function WPLAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminSessionBootstrap />
      {children}
    </>
  );
}
