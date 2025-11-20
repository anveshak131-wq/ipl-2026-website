// Helper function to get animated logo path for teams
// Team ID mapping:
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
export function getAnimatedLogoPath(teamId: string): string {
  const logoMap: { [key: string]: string } = {
    // RCB uses a custom animated inferno lion SVG in /public/logos
    '1': 'rcb_inferno_lion.svg',       // RCB
    '2': 'mi_logo_animated.svg',       // MI
    '3': 'srh_logo_animated.svg',      // SRH
    '4': 'gt_logo_animated.svg',       // GT
    '5': 'kxip_logo_animated.svg',     // PBKS
    '6': 'dc_logo_animated.svg',       // DC
    '7': 'lsg_logo_animated.svg',      // LSG
    '8': 'rr_logo_animated.svg',       // RR
    '9': 'kkr_logo_animated.svg',      // KKR
    '10': 'csk_logo_animated.svg',     // CSK
  };

  // Handle both 'team1' and '1' formats
  const numericId = teamId.replace('team', '');
  const logoFile = logoMap[numericId] || 'rcb_logo_animated.svg';

  // If the mapping is a Lottie JSON name, serve from /assets/lottie
  if (logoFile.endsWith('.json')) {
    return `/assets/lottie/${logoFile}`;
  }

  return `/logos/${logoFile}`;
}


// Get regular logo path (fallback)
export function getLogoPath(teamId: string): string {
  const logoMap: { [key: string]: string } = {
    '1': 'rcb_logo_new.svg',      // RCB
    '2': 'mi_logo_new.svg',       // MI
    '3': 'srh_logo_new.svg',      // SRH
    '4': 'gt_logo_new.svg',       // GT
    '5': 'kxip_logo_new.svg',     // PBKS
    '6': 'dc_logo_new.svg',       // DC
    '7': 'lsg_logo_new.svg',      // LSG
    '8': 'rr_logo_new.svg',       // RR
    '9': 'kkr_logo_new.svg',      // KKR
    '10': 'csk_logo_new.svg',     // CSK
  };

  const numericId = teamId.replace('team', '');
  const logoFile = logoMap[numericId] || 'rcb_logo_new.svg';
  return `/logos/${logoFile}`;
}

