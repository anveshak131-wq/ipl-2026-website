// Helper function to get animated logo path for teams
// Team ID mapping:
// IPL Teams:
// '1' = RCB (Royal Challengers Bengaluru)
// '2' = MI (Mumbai Indians)
// '3' = SRH (Sunrisers Hyderabad)
// '4' = GT (Gujarat Titans)
// '5' = PBKS (Punjab Kings)
// '6' = DC (Delhi Capitals)
// '7' = LSG (Lucknow Super Giants)
// '8' = RR (Rajasthan Royals)
// '9' = KKR (Kolkata Knight Riders)
// '10' = CSK (Chennai Super Kings)
// WPL Teams (by shortName):
// 'MI-W' = Mumbai Indians (WPL)
// 'RCB-W' = Royal Challengers Bengaluru (WPL)
// 'DC-W' = Delhi Capitals (WPL)
// 'GG' = Gujarat Giants (WPL)
// 'UPW' = UP Warriorz (WPL)
export function getAnimatedLogoPath(teamId: string, shortName?: string, league?: 'ipl' | 'wpl'): string {
  // Check for TBD teams - they should use TBA logo
  // Also check for teams 16, 17, 18, 19 which are placeholder teams
  if (teamId.includes('tbd-') || 
      teamId === '16' || 
      teamId === '17' || 
      teamId === '18' || 
      teamId === '19' ||
      shortName === 'TBD' || 
      shortName?.includes('Place')) {
    return '/logos/tba_logo.svg';
  }
  
  // Check if it's a WPL team (by league or shortName pattern)
  const isWPL = league === 'wpl' || shortName?.includes('-W') || shortName === 'GG' || shortName === 'UPW';
  
  if (isWPL && shortName) {
    const wplLogoMap: { [key: string]: string } = {
      'MI-W': 'wpl_mi_logo_modern.svg',
      'RCB-W': 'wpl_rcb_logo_modern.svg',
      'DC-W': 'wpl_dc_logo_modern.svg',
      'GG': 'wpl_gg_logo_modern.svg',
      'UPW': 'wpl_upw_logo_modern.svg',
    };
    
    if (wplLogoMap[shortName]) {
      return `/logos/${wplLogoMap[shortName]}`;
    }
  }
  
  const logoMap: { [key: string]: string } = {
    // Modern 2026 logos with enhanced animations and copyright-free designs
    '1': 'rcb_logo_2026_modern.svg',  // RCB - Modern animated version
    '2': 'mi_logo_2026_modern.svg',    // MI - Modern animated version
    '3': 'srh_logo_2026_modern.svg',  // SRH - Modern animated version
    '4': 'gt_logo_2026_modern.svg',   // GT - Modern animated version
    '5': 'pbks_logo_2026_modern.svg', // PBKS - Modern animated version
    '6': 'dc_logo_2026_modern.svg',   // DC - Modern animated version
    '7': 'lsg_logo_2026_modern.svg',  // LSG - Modern animated version
    '8': 'rr_logo_2026_modern.svg',   // RR - Modern animated version
    '9': 'kkr_logo_2026_modern.svg',  // KKR - Modern animated version
    '10': 'csk_logo_2026_modern.svg'  // CSK - Modern animated version
  };

  // Handle both 'team1' and '1' formats
  const numericId = teamId.replace('team', '');
  const logoFile = logoMap[numericId] || 'rcb_logo_2026_premium_animated.svg';

  // If the mapping is a Lottie JSON name, serve from /assets/lottie
  if (logoFile.endsWith('.json')) {
    return `/assets/lottie/${logoFile}`;
  }

  return `/logos/${logoFile}`;
}


// Get regular logo path (fallback - uses modern animated versions)
export function getLogoPath(teamId: string): string {
  const logoMap: { [key: string]: string } = {
    '1': 'rcb_logo_2026_modern.svg',  // RCB - Modern animated version
    '2': 'mi_logo_2026_modern.svg',    // MI - Modern animated version
    '3': 'srh_logo_2026_modern.svg',  // SRH - Modern animated version
    '4': 'gt_logo_2026_modern.svg',   // GT - Modern animated version
    '5': 'pbks_logo_2026_modern.svg',  // PBKS - Modern animated version
    '6': 'dc_logo_2026_modern.svg',   // DC - Modern animated version
    '7': 'lsg_logo_2026_modern.svg',  // LSG - Modern animated version
    '8': 'rr_logo_2026_modern.svg',  // RR - Modern animated version
    '9': 'kkr_logo_2026_modern.svg',  // KKR - Modern animated version
    '10': 'csk_logo_2026_modern.svg', // CSK - Modern animated version
  };

  const numericId = teamId.replace('team', '');
  const logoFile = logoMap[numericId] || 'rcb_logo_2026_modern.svg';
  return `/logos/${logoFile}`;
}

