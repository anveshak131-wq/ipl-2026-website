import AdminStoriesAdvanced from '../components/AdminStoriesAdvanced';

export default function StoriesPage() {
  console.log('Advanced AI-Powered StoriesPage rendering');
  return (
    <div className="flex min-h-screen bg-gray-950">
      <div className="flex-1">
        <AdminStoriesAdvanced />
      </div>
    </div>
  );
}
