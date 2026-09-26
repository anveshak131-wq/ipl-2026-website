import AdminSessionBootstrap from '@/components/admin/AdminSessionBootstrap';

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
