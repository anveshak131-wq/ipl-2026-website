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
// WPL Teams (by shortName or team ID):
// 'MI-W' or ID '11' = Mumbai Indians (WPL)
// 'RCB-W' or ID '12' = Royal Challengers Bengaluru (WPL)
// 'DC-W' or ID '13' = Delhi Capitals (WPL)
// 'GG' or ID '14' = Gujarat Giants (WPL)
// 'UPW' or ID '15' = UP Warriorz (WPL)
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
  
  // Check if it's a WPL team (by league, shortName pattern, or team ID)
  const numericId = teamId.replace('team', '');
  const isWPL = league === 'wpl' || 
                shortName?.includes('-W') || 
                shortName === 'GG' || 
                shortName === 'UPW' ||
                numericId === '11' || // MI-W
                numericId === '12' || // RCB-W
                numericId === '13' || // DC-W
                numericId === '14' || // GG
                numericId === '15';    // UPW
  
  if (isWPL) {
    // First try to match by shortName
    if (shortName) {
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
    
    // Fallback to team ID mapping for WPL teams
    const wplIdLogoMap: { [key: string]: string } = {
      '11': 'wpl_mi_logo_modern.svg',    // MI-W
      '12': 'wpl_rcb_logo_modern.svg',   // RCB-W
      '13': 'wpl_dc_logo_modern.svg',    // DC-W
      '14': 'wpl_gg_logo_modern.svg',    // GG
      '15': 'wpl_upw_logo_modern.svg',   // UPW
    };
    
    if (wplIdLogoMap[numericId]) {
      return `/logos/${wplIdLogoMap[numericId]}`;
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

  // Handle both 'team1' and '1' formats (numericId already defined above)
  const logoFile = logoMap[numericId] || 'rcb_logo_2026_modern.svg';

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

