import AdminMatchdayAdvanced from '../components/AdminMatchdayAdvanced';

export default function MatchdayPage() {
  console.log('Advanced AI-Powered MatchdayPage rendering');
  return (
    <div className="flex min-h-screen bg-gray-950">
      <div className="flex-1">
        <AdminMatchdayAdvanced />
      </div>
    </div>
  );
}
