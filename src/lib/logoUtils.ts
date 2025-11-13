// Helper function to get animated logo path for teams
export function getAnimatedLogoPath(teamId: string): string {
  const logoMap: { [key: string]: string } = {
    '1': 'rcb_logo_animated.svg',
    '2': 'csk_logo_animated.svg',
    '3': 'mi_logo_animated.svg',
    '4': 'kkr_logo_animated.svg',
    '5': 'dc_logo_animated.svg',
    '6': 'srh_logo_animated.svg',
    '7': 'kxip_logo_animated.svg',
    '8': 'rr_logo_animated.svg',
    '9': 'gt_logo_animated.svg',
    '10': 'lsg_logo_animated.svg',
  };

  // Handle both 'team1' and '1' formats
  const numericId = teamId.replace('team', '');
  const logoFile = logoMap[numericId] || 'rcb_logo_animated.svg';
  return `/logos/${logoFile}`;
}

// Get regular logo path (fallback)
export function getLogoPath(teamId: string): string {
  const logoMap: { [key: string]: string } = {
    '1': 'rcb_logo_new.svg',
    '2': 'csk_logo_new.svg',
    '3': 'mi_logo_new.svg',
    '4': 'kkr_logo_new.svg',
    '5': 'dc_logo_new.svg',
    '6': 'srh_logo_new.svg',
    '7': 'kxip_logo_new.svg',
    '8': 'rr_logo_new.svg',
    '9': 'gt_logo_new.svg',
    '10': 'lsg_logo_new.svg',
  };

  const numericId = teamId.replace('team', '');
  const logoFile = logoMap[numericId] || 'rcb_logo_new.svg';
  return `/logos/${logoFile}`;
}

