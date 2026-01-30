import EnhancedWPLTeamPage from './EnhancedTeamPage';

// Generate static params for WPL teams
// With static export, all routes must be pre-generated at build time
export async function generateStaticParams() {
  // Always return default params to ensure routes are generated
  // This ensures pages work even if API is unavailable at build time
  const defaultParams: { teamId: string }[] = [
    // ShortNames with -W suffix (exact matches)
    { teamId: 'mi-w' },
    { teamId: 'rcb-w' },
    { teamId: 'dc-w' },
    { teamId: 'gg' },
    { teamId: 'upw' },
    // ShortNames without -W suffix (convenience routes)
    { teamId: 'mi' },
    { teamId: 'rcb' },
    { teamId: 'dc' },
    { teamId: 'gg' },
    { teamId: 'upw' },
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
    const teamsResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/teams?league=wpl`);
    if (teamsResponse.ok) {
      const teams = await teamsResponse.json();
      console.log('WPL Team Page: Fetched teams for static params:', teams.length);
      
      // Add any additional shortNames from API that aren't in defaults
      teams.forEach((team: any) => {
        if (team.shortName) {
          const shortNameLower = team.shortName.toLowerCase();
          
          // Add exact shortName
          if (!defaultParams.some(p => p.teamId === shortNameLower)) {
            defaultParams.push({ teamId: shortNameLower });
            console.log('WPL Team Page: Added shortName route:', shortNameLower);
          }
          
          // Also add without -W suffix if applicable
          if (shortNameLower.includes('-w')) {
            const withoutSuffix = shortNameLower.replace('-w', '');
            if (!defaultParams.some(p => p.teamId === withoutSuffix)) {
              defaultParams.push({ teamId: withoutSuffix });
              console.log('WPL Team Page: Added variation route:', withoutSuffix);
            }
          }
          
          // Add numeric ID
          const teamIdStr = String(team.id);
          if (!defaultParams.some(p => p.teamId === teamIdStr)) {
            defaultParams.push({ teamId: teamIdStr });
            console.log('WPL Team Page: Added ID route:', teamIdStr);
          }
          
          // Add team prefix format
          const teamPrefix = `team${teamIdStr}`;
          if (!defaultParams.some(p => p.teamId === teamPrefix)) {
            defaultParams.push({ teamId: teamPrefix });
            console.log('WPL Team Page: Added prefix route:', teamPrefix);
          }
        }
      });
      
      console.log('WPL Team Page: Total static params generated:', defaultParams.length);
    } else {
      console.warn('WPL Team Page: Failed to fetch teams for static params');
    }
  } catch (error) {
    console.warn('WPL Team Page: Could not fetch teams for static params, using defaults:', error);
  }
  
  return defaultParams;
}

export default function WPLTeamDetailPage({ params }: { params: { teamId: string } }) {
  // Use the enhanced team page with modern UI and animations
  return <EnhancedWPLTeamPage teamId={params.teamId} />;
}

