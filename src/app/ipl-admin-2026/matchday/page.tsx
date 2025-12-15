import AdminMatchdayAdvanced from '../components/AdminMatchdayAdvanced';
import AdminSidebar from '../components/admin/AdminSidebar';

export default function MatchdayPage() {
  console.log('Advanced AI-Powered MatchdayPage rendering');
  return (
    <div className="flex min-h-screen bg-gray-950">
      <AdminSidebar currentPage="/ipl-admin-2026/matchday" />
      <div className="flex-1">
        <AdminMatchdayAdvanced />
      </div>
    </div>
  );
}
