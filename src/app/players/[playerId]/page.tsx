import PlayerDetailClient from './PlayerDetailClient';

// Provide static params for a few known demo players so static export works.
// Dynamic players created via admin will still be handled at runtime.
export async function generateStaticParams() {
  const defaultPlayers = [
    { playerId: '1' },
    { playerId: '2' },
    { playerId: '3' },
  ];
  return defaultPlayers;
}

export default function PlayerDetailPage({ params }: { params: { playerId: string } }) {
  return <PlayerDetailClient playerId={params.playerId} />;
}
