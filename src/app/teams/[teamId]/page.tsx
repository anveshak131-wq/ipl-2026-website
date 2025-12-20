import TeamDetailClient from './TeamDetailClient';

// For serverless deployment, we don't need generateStaticParams
// The dynamic routing will handle any teamId parameter
export default function TeamDetailPage({ params }: { params: { teamId: string } }) {
  // All data fetching happens client-side in TeamDetailClient
  return <TeamDetailClient teamId={params.teamId} />;
}
