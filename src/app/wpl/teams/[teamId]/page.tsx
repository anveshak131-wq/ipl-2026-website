import EnhancedWPLTeamPage from './EnhancedTeamPage';

// Generate static params for WPL teams
// With static export, all routes must be pre-generated at build time
export async function generateStaticParams() {
  // Always return default params to ensure routes are generated
  // This ensures pages work even if API is unavailable at build time
  const defaultParams: { teamId: string }[] = [
    // ShortNames with -W suffix
    { teamId: 'mi-w' },
    { teamId: 'rcb-w' },
    { teamId: 'dc-w' },
    { teamId: 'gg' },
    { teamId: 'upw' },
    // ShortNames without -W suffix (for convenience)
    { teamId: 'mi' },
    { teamId: 'rcb' },
    { teamId: 'dc' },
    // Numeric IDs
    { teamId: '11' },
    { teamId: '12' },
    { teamId: '13' },
    { teamId: '14' },
    { teamId: '15' },
    // Team prefix format
    { teamId: 'team11' },
    { teamId: 'team12' },
    { teamId: 'team13' },
    { teamId: 'team14' },
    { teamId: 'team15' },
  ];

  try {
    // Try to fetch WPL teams to get their shortNames (for additional routes)
    const teamsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/teams?league=wpl`);
    if (teamsResponse.ok) {
      const teams = await teamsResponse.json();
      
      // Add any additional shortNames from API that aren't in defaults
      teams.forEach((team: any) => {
        if (team.shortName) {
          const shortNameLower = team.shortName.toLowerCase();
          // Check if already in defaultParams
          const exists = defaultParams.some(p => p.teamId === shortNameLower);
          if (!exists) {
            defaultParams.push({ teamId: shortNameLower });
          }
          
          // Also add without -W suffix if applicable
          if (shortNameLower.includes('-w')) {
            const withoutSuffix = shortNameLower.replace('-w', '');
            const existsWithout = defaultParams.some(p => p.teamId === withoutSuffix);
            if (!existsWithout) {
              defaultParams.push({ teamId: withoutSuffix });
            }
          }
        }
      });
    }
  } catch (error) {
    // If API fails, use default params (already set above)
    console.warn('Could not fetch WPL teams for static params, using defaults:', error);
  }
  
  return defaultParams;
}

export default function WPLTeamDetailPage({ params }: { params: { teamId: string } }) {
  // Use the enhanced team page with modern UI and animations
  return <EnhancedWPLTeamPage teamId={params.teamId} />;
}

