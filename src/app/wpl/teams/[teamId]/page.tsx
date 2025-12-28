import TeamDetailClient from '@/app/teams/[teamId]/TeamDetailClient';
import { api } from '@/lib/data';

// Generate static params for WPL teams
export async function generateStaticParams() {
  try {
    // Fetch WPL teams to get their shortNames
    const teams = await api.getTeams('wpl');
    
    const params: { teamId: string }[] = [];
    
    // Generate routes with shortNames (dc, rcb, mi, gg, upw)
    teams.forEach(team => {
      if (team.shortName) {
        const shortNameLower = team.shortName.toLowerCase();
        params.push({ teamId: shortNameLower }); // dc, rcb, mi, gg, upw
        
        // Also add without -W suffix for convenience (dc, rcb, mi)
        if (shortNameLower.includes('-w')) {
          const withoutSuffix = shortNameLower.replace('-w', '');
          params.push({ teamId: withoutSuffix }); // dc, rcb, mi (without -w)
        }
      }
    });
    
    // Also generate numeric IDs (11, 12, 13...) and team prefix versions (team11, team12, team13...)
    // to support both URL formats: /wpl/teams/11 and /wpl/teams/team11
    // WPL teams typically use IDs 11-15
    for (let i = 11; i <= 15; i++) {
      params.push({ teamId: String(i) });      // Numeric format: /wpl/teams/11, /wpl/teams/12, etc.
      params.push({ teamId: `team${i}` });     // Team prefix format: /wpl/teams/team11, /wpl/teams/team12, etc.
    }
    
    return params;
  } catch (error) {
    console.error('Error generating static params for WPL teams:', error);
    // Fallback to default WPL team shortNames and IDs
    const defaultParams: { teamId: string }[] = [
      // ShortNames
      { teamId: 'mi-w' }, { teamId: 'mi' },
      { teamId: 'rcb-w' }, { teamId: 'rcb' },
      { teamId: 'dc-w' }, { teamId: 'dc' },
      { teamId: 'gg' },
      { teamId: 'upw' },
      // Numeric IDs
      { teamId: '11' }, { teamId: 'team11' },
      { teamId: '12' }, { teamId: 'team12' },
      { teamId: '13' }, { teamId: 'team13' },
      { teamId: '14' }, { teamId: 'team14' },
      { teamId: '15' }, { teamId: 'team15' },
    ];
    return defaultParams;
  }
}

export default function WPLTeamDetailPage({ params }: { params: { teamId: string } }) {
  // All data fetching happens client-side in TeamDetailClient
  // This provides static pre-rendered pages for WPL teams
  return <TeamDetailClient teamId={params.teamId} league="wpl" />;
}

