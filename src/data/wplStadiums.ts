export interface WplStadiumInfo {
  id: 'vadodara' | 'mumbai-cci';
  shortName: string;
  officialName: string;
  alternateName: string;
  city: string;
  established: string;
  operator: string;
  capacity: string;
  capacityNumeric: string;
  wpl2027Leg: string;
  wpl2027MatchesSummary: string;
  image: string;
  accentHex: string;
  pitch: {
    soilType: string;
    surfaceSummary: string;
    battingVerdict: string;
    paceAndSpin: string;
    dewFactor: string;
    chaseAdvantage: string;
    avgFirstInnings: string;
    paceSharePct: number; // Visual split bar for pace vs spin wicket share
    spinSharePct: number;
  };
  dimensions: {
    straight: string;
    square: string;
    behindSquare: string;
    outfield: string;
  };
  highlights: string[];
}

export const WPL_STADIUMS: Record<'vadodara' | 'mumbai-cci', WplStadiumInfo> = {
  vadodara: {
    id: 'vadodara',
    shortName: 'Vadodara',
    officialName: 'BCA Stadium, Kotambi',
    alternateName: 'Vadodara International Cricket Stadium',
    city: 'Kotambi, Vadodara, Gujarat',
    established: '2024 (Opened Dec 22, 2024)',
    operator: 'Baroda Cricket Association (BCA)',
    capacity: '40,000 spectators',
    capacityNumeric: '40,000',
    wpl2027Leg: 'Opening Leg • Matches 1–11',
    wpl2027MatchesSummary: 'Jan 14 – Jan 24, 2027 (All 7:30 PM IST)',
    image: '/images/stadiums/vadodara-kotambi.jpg',
    accentHex: '#F59E0B',
    pitch: {
      soilType: 'Hard Clay & Mixed Red-Soil',
      surfaceSummary:
        'Firm, true-bouncing modern strip offering clean bat-on-ball tempo and even carry.',
      battingVerdict: 'Batter-friendly hard deck rewarding clean timing through the line.',
      paceAndSpin:
        'Seamers extract brief new-ball swing in the Powerplay before spinners find subtle grip during middle overs.',
      dewFactor: 'Heavy evening dew under lights from ~8:15 PM IST; chasing strongly favored.',
      chaseAdvantage: 'Chasing teams hold a strong edge',
      avgFirstInnings: '165–175',
      paceSharePct: 58,
      spinSharePct: 42,
    },
    dimensions: {
      straight: '70–75 m',
      square: '64–68 m',
      behindSquare: '60–65 m',
      outfield: 'Fast sand-based lush grass outfield',
    },
    highlights: [
      'Hosts the WPL 2027 Season Opener: RCB-W vs MI-W on 14 Jan 2027.',
      'Features multi-tiered lower and upper seating bowls with modern VIP boxes.',
      'Staged 11 consecutive evening League Phase fixtures across Jan 14–24.',
    ],
  },
  'mumbai-cci': {
    id: 'mumbai-cci',
    shortName: 'Mumbai - CCI',
    officialName: 'Brabourne Stadium (CCI)',
    alternateName: 'Cricket Club of India Ground',
    city: 'Churchgate, South Mumbai',
    established: '1937 (India’s first permanent concrete stadium)',
    operator: 'Cricket Club of India (CCI)',
    capacity: '25,000 (up to 50,000 max setup)',
    capacityNumeric: '25,000+',
    wpl2027Leg: 'Closing Leg & Playoffs • Matches 12–22',
    wpl2027MatchesSummary: 'Jan 26 – Feb 7, 2027 (incl. Eliminator & Final)',
    image: '/images/stadiums/mumbai-cci-brabourne.jpg',
    accentHex: '#38BDF8',
    pitch: {
      soilType: 'Classic Mumbai Red Soil',
      surfaceSummary:
        'Iconic red-soil surface famed for predictable bounce, crisp carry, and rapid scoring.',
      battingVerdict: 'High-scoring stroke-makers’ paradise — short boundaries accelerate run rates.',
      paceAndSpin:
        'New-ball pacers enjoy early bounce; dry strips reward wrist and finger spin in middle overs.',
      dewFactor:
        'Significant Arabian Sea evening dew from the 14th over onward, gripping favors chasing sides.',
      chaseAdvantage: 'Toss winners strongly prefer bowling first',
      avgFirstInnings: '172–182',
      paceSharePct: 54,
      spinSharePct: 46,
    },
    dimensions: {
      straight: '57–64 m',
      square: '53–58 m',
      behindSquare: '46–52 m',
      outfield: 'Lightning-quick coastal grass carpet',
    },
    highlights: [
      'Hosts both the WPL 2027 Eliminator (Feb 5) and the Championship Final (Feb 7).',
      'Historic WPL venue that hosted the inaugural 2023 WPL Final.',
      'Short pockets and coastal breeze turn evening chases into high-scoring thrillers.',
    ],
  },
};

/**
 * Resolve raw venue strings like "Vadodara", "Mumbai - CCI",
 * "BCA Stadium, Kotambi (Vadodara)", or "Brabourne Stadium" to a WPL stadium dossier.
 */
export function resolveWplStadium(venueText?: string | null): WplStadiumInfo | null {
  if (!venueText) return null;
  const v = venueText.toLowerCase();

  if (v.includes('vadodara') || v.includes('kotambi') || v.includes('bca stadium')) {
    return WPL_STADIUMS.vadodara;
  }

  if (
    v.includes('cci') ||
    v.includes('brabourne') ||
    (v.includes('mumbai') && !v.includes('dy patil') && !v.includes('navi mumbai'))
  ) {
    return WPL_STADIUMS['mumbai-cci'];
  }

  return null;
}
