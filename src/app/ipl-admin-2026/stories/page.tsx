import AdminStoriesAdvanced from '../components/AdminStoriesAdvanced';
import AdminSidebar from '@/components/admin/AdminSidebar';

export default function StoriesPage() {
  console.log('Advanced AI-Powered StoriesPage rendering');
  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar currentPage="/ipl-admin-2026/stories" />
      <div className="flex-1">
        <AdminStoriesAdvanced />
      </div>
    </div>
  );
}
