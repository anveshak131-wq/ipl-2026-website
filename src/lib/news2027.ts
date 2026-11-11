import type { Content, News } from '@/types';

export interface SeasonMilestone {
  id: string;
  league: 'ipl' | 'wpl';
  title: string;
  subtitle: string;
  dateLabel: string;
  targetIso: string;
  location: string;
  badge: string;
}

export const SEASON_MILESTONES_2027: SeasonMilestone[] = [
  {
    id: 'ipl-retention-lock',
    league: 'ipl',
    title: 'IPL 2027 Retention Lock',
    subtitle: '₹157 Cr purse ceiling • Final released lists due',
    dateLabel: '17 Nov 2026',
    targetIso: '2026-11-17T11:30:00.000Z',
    location: 'Mumbai • BCCI',
    badge: 'Retentions',
  },
  {
    id: 'ipl-goa-auction',
    league: 'ipl',
    title: 'IPL 2027 Mini-Auction',
    subtitle: 'Final cycle auction before 2028 mega-reset',
    dateLabel: '16 Dec 2026',
    targetIso: '2026-12-16T09:00:00.000Z',
    location: 'ITC Grand Goa',
    badge: 'Goa Auction',
  },
  {
    id: 'wpl-s5-opener',
    league: 'wpl',
    title: 'WPL Season 5 Opener',
    subtitle: 'RCB-W vs MI-W • 22 fixtures across 2 venues',
    dateLabel: '14 Jan 2027',
    targetIso: '2027-01-14T14:00:00.000Z',
    location: 'Kotambi, Vadodara',
    badge: '7:30 PM IST',
  },
];

export const DEFAULT_NEWS_FALLBACK_IMAGE = '/news/dual-2027-champions.svg';

/**
 * Curated 2027-season editorial newsroom feed (IPL 2027 & WPL Season 5).
 * Stored in src/lib/news2027.ts as the canonical source of truth for offline fallback
 * and paired directly with Cloudflare KV `ipl:content`.
 */
export const NEWS_2027_ARTICLES: News[] = [
  {
    id: 'ipl-2027-goa-auction-purse-retentions',
    league: 'ipl',
    category: 'breaking',
    isImportant: true,
    publishedAt: '2026-11-11T10:30:00.000Z',
    createdAt: '2026-11-11T10:30:00.000Z',
    imageUrl: '/news/ipl-2027-goa-auction.svg',
    image: '/news/ipl-2027-goa-auction.svg',
    linkedTeamIds: ['1', '2', '10', '6'],
    title: 'IPL 2027 Mini-Auction Moves to Goa on Dec 16; Retention Deadline Extended to Nov 17',
    summary:
      'BCCI brings the IPL 2027 mini-auction back to India at ITC Grand Goa with a ₹157 crore salary cap after pushing retention submissions back by 48 hours to avoid an India vs New Zealand ODI clash.',
    content: `The road to IPL 2027 accelerates this month after the BCCI confirmed a December 16, 2026 mini-auction in Goa, returning the marquee bidding table to India following three consecutive overseas editions.

Originally pencilled in for November 15, the mandatory franchise retention and release submission deadline has been pushed to November 17 to give Indian national selectors and franchise operations breathing room around India's international ODI fixture against New Zealand. Player auction registration closes on November 23, with the mid-season pre-auction trading window wrapping up a week prior to bidding on December 9.

KEY 2027 AUCTION PARAMETERS
• Date & Venue: December 16, 2026 at ITC Grand Goa
• Salary Purse Ceiling: ₹157 crore total squad cap
• Squad Size Rules: Maximum 25 players (up to 8 overseas stars)
• Cycle Significance: Final mini-auction before the full 2028 Mega-Auction reset
• Tentative Tournament Window: March 10 to May 15, 2027

Because the 2027 season closes out the current three-year cycle before next winter's mega-reset, franchises have favoured surgical squad balancing over wholescale teardowns. Teams holding surplus purse from last year's released international quicks are tipped to target proven death bowlers and multi-phase top-order finishers in Goa.`,
  },
  {
    id: 'wpl-2027-full-schedule-vadodara-mumbai',
    league: 'wpl',
    category: 'match',
    isImportant: true,
    publishedAt: '2026-11-10T14:00:00.000Z',
    createdAt: '2026-11-10T14:00:00.000Z',
    imageUrl: '/news/wpl-2027-schedule.svg',
    image: '/news/wpl-2027-schedule.svg',
    linkedTeamIds: ['14', '13', '11', '12', '15'],
    linkedMatchId: 'wpl-2027-m01',
    title: 'WPL 2027 Full Schedule Confirmed: Season 5 Runs Jan 14 to Feb 7 Across Vadodara & Mumbai',
    summary:
      'All 22 fixtures will start at 7:30 PM IST with zero double-headers, kicking off with reigning champions Royal Challengers Bengaluru vs Mumbai Indians in Vadodara before closing at Brabourne Stadium.',
    content: `The Women's Premier League has locked in the complete blueprint for Season 5, running from January 14 to February 7, 2027 across two iconic cricket hubs: Vadodara's BCA Stadium in Kotambi and Mumbai's historic Brabourne Stadium (CCI).

Every single one of the 22 T20 fixtures will follow a prime-time 7:30 PM IST start with zero double-headers across the 25-day tournament. Defending champions Royal Challengers Bengaluru take center stage on opening night against two-time winners Mumbai Indians under the Vadodara lights.

SEASON 5 TOURNAMENT STRUCTURE
• Opening Leg (Jan 14 – Jan 24): BCA Stadium, Kotambi, Vadodara
• Closing Leg & Playoffs (Jan 26 – Feb 7): Brabourne Stadium, CCI, Mumbai
• Format: Double round-robin league stage (20 matches, each franchise plays 8 games)
• Eliminator (Feb 5): 2nd-placed vs 3rd-placed finisher in Mumbai
• Final (Feb 7): Table-toppers earn direct entry to the title clash vs Eliminator winners

Moving all playoff nights to Brabourne rewards clean high-scoring batting tracks and guarantees packed Mumbai evening crowds for the business end of WPL 2027.`,
  },
  {
    id: 'ipl-2027-blockbuster-trades-pandya-pant-csk-srh',
    league: 'ipl',
    category: 'team',
    isImportant: true,
    publishedAt: '2026-11-09T11:15:00.000Z',
    createdAt: '2026-11-09T11:15:00.000Z',
    imageUrl: '/news/ipl-2027-trades.svg',
    image: '/news/ipl-2027-trades.svg',
    linkedTeamIds: ['2', '5', '6', '7', '10', '3'],
    title: 'Blockbuster IPL 2027 Trades: Pandya-Arshdeep & Pant-Kuldeep Headline Pre-Retention Window',
    summary:
      'Franchises strike historic all-player swaps ahead of the Nov 17 retention cutoff — Hardik Pandya joins Punjab Kings for Arshdeep Singh while Rishabh Pant returns to Delhi Capitals.',
    content: `Even before the November 17 retention sheet hits the league desk, the IPL 2027 pre-auction trading window has delivered the biggest structural reshuffle of the entire cycle.

Mumbai Indians and Punjab Kings executed a landmark ₹18 crore marquee swap sending star all-rounder Hardik Pandya north to PBKS in exchange for spearhead left-arm seamer Arshdeep Singh. Meanwhile, wicketkeeper-captain Rishabh Pant returns to Delhi Capitals at ₹15 crore as wrist-spinner Kuldeep Yadav moves in the opposite direction to Lucknow Super Giants for ₹13.50 crore.

VERIFIED PRE-AUCTION TRADES
• MI ↔ PBKS: Hardik Pandya (₹18 Cr) to Punjab Kings; Arshdeep Singh (₹18 Cr) to Mumbai Indians
• LSG ↔ DC: Rishabh Pant (₹15 Cr) to Delhi Capitals; Kuldeep Yadav (₹13.50 Cr) to Lucknow Super Giants
• CSK ↔ SRH Multi-Deal: Liam Livingstone (₹6 Cr) & Jack Edwards (₹3 Cr) to Chennai Super Kings; Khaleel Ahmed (₹4.8 Cr) & Nathan Ellis (₹2 Cr) to Sunrisers Hyderabad
• DC → SRH: Left-arm yorker specialist T. Natarajan returns to Hyderabad (₹5 Cr) with Zeeshan Ansari moving to Delhi Capitals

With trading open until December 9, analysts expect further fringe purse-balancing swaps as teams lock down specialist roles before flying to Goa.`,
  },
  {
    id: 'wpl-2027-kochi-auction-molineux-kashvi-prendergast',
    league: 'wpl',
    category: 'player',
    isImportant: true,
    publishedAt: '2026-11-08T16:20:00.000Z',
    createdAt: '2026-11-08T16:20:00.000Z',
    imageUrl: '/news/wpl-2027-kochi-auction.svg',
    image: '/news/wpl-2027-kochi-auction.svg',
    linkedTeamIds: ['15', '12', '11', '13'],
    title: 'WPL 2027 Auction Recap: Molineux Tops ₹1.10 Cr as Prendergast & 15-Year-Old Uma Kashvi Make History',
    summary:
      'Twenty-five players found franchises at Kochi’s inaugural WPL auction, led by Sophie Molineux joining UP Warriorz, Ireland’s Orla Prendergast signing for Gujarat Giants, and record youth signing Uma Kashvi.',
    content: `Kochi hosted its first ever Women's Premier League auction at the Grand Hyatt on October 28, producing record-breaking milestones across both marquee overseas acquisitions and fearless teenage Indian talent.

Following September 28 squad retentions, five franchises filled 25 remaining slots — including seven overseas berths — from a curated shortlist of nearly 150 athletes. Australian left-arm spin all-rounder Sophie Molineux commanded the highest bid of the afternoon at ₹1.10 crore to headline UP Warriorz's bowling attack under skipper Meg Lanning.

HIGHLIGHTS FROM THE KOCHI AUCTION TABLE
• Highest Buy: Sophie Molineux to UP Warriorz for ₹1.10 crore
• Historic First: All-rounder Orla Prendergast becomes the first Irish cricketer drafted into WPL (₹30 lakh, Gujarat Giants)
• Top Uncapped Indian Buy: Shweta Sehrawat signed by Mumbai Indians (₹20 lakh), adding to Tara Norris's earlier trade from UPW
• Youngest Signing: 15-year-old Uma Kashvi picked up by Delhi Capitals for ₹10 lakh

Every franchise leaves Kochi with near-complete 2027 combinations, turning focus squarely toward tactical camps before January 14 in Vadodara.`,
  },
  {
    id: 'ipl-2027-coaching-overhaul-pollard-ganguly-zaheer',
    league: 'ipl',
    category: 'team',
    isImportant: false,
    publishedAt: '2026-11-06T09:45:00.000Z',
    createdAt: '2026-11-06T09:45:00.000Z',
    imageUrl: '/news/ipl-2027-coaching.svg',
    image: '/news/ipl-2027-coaching.svg',
    linkedTeamIds: ['2', '6', '10'],
    title: 'New Dugout Era for IPL 2027: Pollard Leads MI, Ganguly Takes DC Helm & Zaheer Drives CSK Reset',
    summary:
      'Powerhouse franchises appoint iconic T20 thinkers ahead of the Goa mini-auction as Mumbai, Delhi, and Chennai retool their tactical leadership.',
    content: `Squad changes on the grass are matched by headline transformations in IPL 2027's coaching dugouts, as five-time champions Mumbai Indians and Chennai Super Kings lean into institutional icons for the cycle's decisive final year.

Kieron Pollard steps up from batting specialist to full-time Head Coach at Mumbai Indians, tasked with pairing newly traded strike bowler Arshdeep Singh alongside Mumbai's returning fast-bowling core. In the capital, former India skipper Sourav Ganguly formally takes charge as Delhi Capitals Head Coach — reuniting immediately with incoming wicketkeeper Rishabh Pant.

NOTABLE DUGOUT UPDATES FOR 2027
• Mumbai Indians: Kieron Pollard promoted to Head Coach
• Delhi Capitals: Sourav Ganguly installed as Head Coach alongside Rishabh Pant's return
• Chennai Super Kings: Zaheer Khan leads CSK's backroom evolution, pairing tactical firepower with Ruturaj Gaikwad's captaincy and retained mystery spinner Noor Ahmad

Expect distinct philosophical shifts in powerplay aggression and match-up bowling when pre-season strategies go live at the Goa auction table.`,
  },
  {
    id: 'rcb-back-to-back-champions-2027-title-defence',
    league: 'ipl',
    category: 'general',
    isImportant: false,
    publishedAt: '2026-11-04T12:30:00.000Z',
    createdAt: '2026-11-04T12:30:00.000Z',
    imageUrl: '/news/ipl-2027-rcb-dynasty.svg',
    image: '/news/ipl-2027-rcb-dynasty.svg',
    linkedTeamIds: ['1'],
    title: 'Defending the Crown: Inside Back-to-Back Champions RCB’s Calm 2027 Continuity Plan',
    summary:
      'Having matched CSK and MI by lifting back-to-back titles in 2025 and 2026, Rajat Patidar and Virat Kohli approach the Nov 17 retention lock seeking continuity over chaos.',
    content: `Royal Challengers Bengaluru walk into the IPL 2027 build-up with rare championship composure. By defeating Gujarat Titans by five wickets in the May 31, 2026 Ahmedabad final — powered by Virat Kohli's composed Player of the Match 75* off 42 deliveries under captain Rajat Patidar — RCB joined Chennai Super Kings (2010–11) and Mumbai Indians (2019–20) as consecutive champions.

That rare pedigree transforms how Bengaluru handles November's retention deadline. Unlike rivals reshaping core personnel through blockbuster swaps, RCB's focus lies in preserving balance across middle-overs spin control, death pace execution, and Kohli-Patidar top-order stability.

WHY CONTINUITY IS RCB'S WEAPON
• Proven Championship Core: Captain Rajat Patidar stays central to squad identity
• Targeted Auction Purse: Selective domestic backup additions rather than expensive overhauls in Goa
• Historic Benchmark: A three-peat in 2027 would stand unmatched in IPL history

While nine franchises look to disrupt the hierarchy in Goa, keeping a double-title dressing room hungry will define Bengaluru's pre-season mission.`,
  },
  {
    id: 'wpl-2027-rcb-mandhana-mi-rivalry-opener',
    league: 'wpl',
    category: 'match',
    isImportant: false,
    publishedAt: '2026-11-02T15:00:00.000Z',
    createdAt: '2026-11-02T15:00:00.000Z',
    imageUrl: '/news/wpl-2027-opener-rivalry.svg',
    image: '/news/wpl-2027-opener-rivalry.svg',
    linkedTeamIds: ['14', '13'],
    linkedMatchId: 'wpl-2027-m01',
    title: 'Champions Meet on Opening Night: Mandhana’s RCB vs Harmanpreet’s MI Set to Ignite Vadodara',
    summary:
      'WPL’s only two-time champions collide on January 14 at BCA Stadium as Smriti Mandhana’s titleholders meet Harmanpreet Kaur’s recharged Mumbai Indians.',
    content: `WPL Season 5 could not ask for a grander curtain-raiser. On January 14, 2027, Vadodara's BCA Stadium hosts a heavyweight collision between the league's only dual champions: Smriti Mandhana's reigning holders Royal Challengers Bengaluru and Harmanpreet Kaur's Mumbai Indians.

RCB enter Season 5 riding memories of one of cricket's great finals, when Mandhana (87 off 41) and Georgia Voll (79 off 54) orchestrated a record 204-run chase against Delhi Capitals last February to seal Bengaluru's second crown. Standing across from them in Match 1 is a hungry Mumbai setup fortified by Shweta Sehrawat and traded pacer Tara Norris.

HEAD-TO-HEAD SPOTLIGHT FOR MATCH 1
• When & Where: Thursday, January 14, 2027 • 7:30 PM IST at BCA Stadium, Kotambi
• Rivalry Stakes: Both sides boast two WPL trophies apiece entering Season 5
• Early Momentum: In an eight-match double round-robin sprint, finishing top grants direct entry to the Feb 7 Final in Mumbai

Fans can already preview every fixture, stadium venue, and head-to-head matchup across all 22 games in the WPL Schedule hub.`,
  },
  {
    id: 'wpl-2027-irish-breakthrough-youth-wave',
    league: 'wpl',
    category: 'player',
    isImportant: false,
    publishedAt: '2026-10-31T10:15:00.000Z',
    createdAt: '2026-10-31T10:15:00.000Z',
    imageUrl: '/news/wpl-2027-youth-wave.svg',
    image: '/news/wpl-2027-youth-wave.svg',
    linkedTeamIds: ['12', '11', '13'],
    title: 'Global & Youth Wave at WPL 2027: Orla Prendergast’s Landmark Deal & Teenage Star Uma Kashvi',
    summary:
      'Season 5 widens WPL’s international footprint and talent pipeline as Ireland all-rounder Orla Prendergast joins Gujarat Giants and 15-year-old Uma Kashvi earns a DC breakthrough.',
    content: `One major narrative from the Kochi auction goes far beyond big-ticket bidding wars: WPL 2027's rapid expansion into fresh cricketing territories and next-generation domestic scouting.

At ₹30 lakh, Gujarat Giants signed versatile all-rounder Orla Prendergast — writing history as the first Irish cricketer ever picked in the Women's Premier League. Capable of swinging the new ball and accelerating through the middle order alongside skipper Ashleigh Gardner, Prendergast embodies WPL's expanding Associate and Full Member reach.

NEW FACES TO TRACK IN SEASON 5
• Orla Prendergast (Gujarat Giants): First Irish player in WPL history, strengthening GG's pace all-round depth
• Uma Kashvi (Delhi Capitals): Youngest auction signing at just 15 years old for ₹10 lakh under Jemimah Rodrigues's side
• Shweta Sehrawat (Mumbai Indians): Top uncapped Indian acquisition (₹20 lakh), adding explosive top-order pedigree

Pair those arrivals with India's established core and Season 5 promises the deepest domestic-overseas blend the league has staged.`,
  },
  {
    id: 'ipl-2027-ten-franchise-captains-retention-outlook',
    league: 'ipl',
    category: 'team',
    isImportant: false,
    publishedAt: '2026-10-29T13:40:00.000Z',
    createdAt: '2026-10-29T13:40:00.000Z',
    imageUrl: '/news/ipl-2027-strategy-board.svg',
    image: '/news/ipl-2027-strategy-board.svg',
    linkedTeamIds: ['1', '4', '8', '5', '3', '9', '7'],
    title: 'Retention War Room: Leadership Picture & Auction Strategy Across All 10 IPL 2027 Franchises',
    summary:
      'From Shubman Gill at Gujarat Titans and Riyan Parag leading Rajasthan Royals to MI and DC’s blockbuster trade moves, how all ten IPL clubs approach Nov 17.',
    content: `As front offices crunch cap math ahead of November 17's retention deadline, clarity has emerged around captaincy continuity and tactical needs across the ten-team IPL 2027 grid.

Gujarat Titans continue backing Shubman Gill after guiding the 2026 finalists, while Rajasthan Royals entrust the long-term reins to homegrown all-rounder Riyan Parag. Defending champions RCB stay led by Rajat Patidar, Chennai Super Kings rally around Ruturaj Gaikwad and retained Afghan spinner Noor Ahmad, and Delhi Capitals hand the armband spotlight back to Rishabh Pant under coach Sourav Ganguly.

HOW CONTENDERS ALLOCATE THE ₹157 CR PURSE
• Core Lock-Ins: Franchises retain five-to-eight proven starters rather than flooding Goa's smaller mini-auction pool
• Death Bowling Demand: Expect intense competition in December for genuine 140+ km/h strike quicks and skiddy wrist spinners
• Trade Leverage: PBKS (adding Hardik Pandya) and SRH (reloading Khaleel Ahmed, Nathan Ellis & T. Natarajan) enter December with dramatically transformed match-ups`,
  },
  {
    id: 'wpl-2027-upw-gg-title-push-lanning-gardner',
    league: 'wpl',
    category: 'team',
    isImportant: false,
    publishedAt: '2026-10-27T09:00:00.000Z',
    createdAt: '2026-10-27T09:00:00.000Z',
    imageUrl: '/news/wpl-2027-challengers.svg',
    image: '/news/wpl-2027-challengers.svg',
    linkedTeamIds: ['15', '12', '11'],
    title: 'Lanning’s UP Warriorz & Gardner’s Gujarat Giants Plot Maiden WPL Crown in Season 5',
    summary:
      'Backed by marquee signing Sophie Molineux and all-round Irish pioneer Orla Prendergast, UPW, GG, and four-time finalists Delhi Capitals chase their breakthrough title.',
    content: `While RCB and Mumbai Indians have shared all four previous trophies equally, Season 5 looms as the most wide-open championship race yet as WPL's three uncrowned contenders sharpen formidable rosters.

UP Warriorz made the boldest statement in Kochi by paying ₹1.10 crore for Sophie Molineux to complement captain Meg Lanning's championship tactical acumen. Gujarat Giants under Ashleigh Gardner bolstered overseas versatility by adding Orla Prendergast, while Delhi Capitals — now steered by Jemimah Rodrigues after four consecutive runner-up heartbreaks — seek that final clinical step across Vadodara and Mumbai.

WHO BREAKS THE TWO-TEAM DUOPOLY?
• UP Warriorz: Power-packed tactical core led by Meg Lanning & top auction buy Sophie Molineux
• Gujarat Giants: Ashleigh Gardner spearheads a balanced batting-heavy outfit targeting fast Vadodara totals
• Delhi Capitals: Four-time finalists hungry to turn consistency into silverware on Feb 7 at Brabourne`,
  },
  {
    id: 'ipl-2027-tentative-window-rules-cycle',
    league: 'ipl',
    category: 'general',
    isImportant: false,
    publishedAt: '2026-10-24T17:10:00.000Z',
    createdAt: '2026-10-24T17:10:00.000Z',
    imageUrl: '/news/ipl-2027-roadmap.svg',
    image: '/news/ipl-2027-roadmap.svg',
    linkedTeamIds: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    title: 'Road to IPL 2027: Key Dates from Nov 17 Retentions to Tentative March 10 Season Opener',
    summary:
      'Bookmark every pivotal off-season milestone — retention cutoffs, player registration, trade deadlines, Goa’s mini-auction, and the tentative March–May 2027 championship calendar.',
    content: `Planning your IPL 2027 build-up? With the current cycle heading into its decisive final year before the 2028 mega-auction, the off-season timeline is packed with pivotal administrative and squad-building milestones.

KEY IPL 2027 ROADMAP DATES
• November 17, 2026: Official franchise retention & release deadline
• November 23, 2026: Domestic & overseas player auction registration cutoff
• December 9, 2026: Pre-auction player trading window closes
• December 16, 2026: IPL 2027 Mini-Auction live from ITC Grand Goa
• March 10 – May 15, 2027 (Tentative Window): Anticipated 20th edition tournament calendar across home & away Indian venues

SportsUP99's live tracker will update every retention sheet, purse remaining gauge, and official match schedule as BCCI announces final fixtures early next year.`,
  },
  {
    id: 'dual-league-2027-bengaluru-reigning-double',
    league: 'both',
    category: 'general',
    isImportant: false,
    publishedAt: '2026-10-20T11:00:00.000Z',
    createdAt: '2026-10-20T11:00:00.000Z',
    imageUrl: '/news/dual-2027-champions.svg',
    image: '/news/dual-2027-champions.svg',
    linkedTeamIds: ['1', '14'],
    title: 'Champions’ Year Ahead: How Bengaluru Enters 2027 Holding Both IPL & WPL Crowns',
    summary:
      'One franchise city holds both Indian franchise T20 titles heading into 2027 — with Smriti Mandhana’s WPL champions kicking off January 14 ahead of Rajat Patidar’s IPL title defence.',
    content: `Rarely in franchise cricket history has one city held simultaneous command of both marquee T20 trophies entering a new year. Bengaluru walks into 2027 wearing double gold: Smriti Mandhana's RCB Women captured Season 4 in Vadodara last February, and Rajat Patidar's men followed by conquering IPL 2026 in Ahmedabad on May 31.

That rare city double raises the stakes across both calendars over the next six months. Mandhana's titleholders open WPL Season 5 first on January 14 against Mumbai Indians, giving the Bengaluru faithful an immediate spotlight before Patidar and Virat Kohli defend consecutive men's crowns starting in March.

TWO LEAGUES, ONE PACKED 2027 CALENDAR
• First Up (Jan 14 – Feb 7, 2027): WPL Season 5 in Vadodara & Mumbai
• Next Up (Tentative Mar 10 – May 15, 2027): IPL Season 20 following December 16's Goa Mini-Auction

Track both campaigns live on SportsUP99 — switching seamlessly between IPL 2027 and WPL 2027 news, rosters, live match centers, and schedules.`,
  },
];

/**
 * Full Content API seed objects for Cloudflare KV (`ipl:content`) & Admin Content Hub.
 */
export const CONTENT_2027_SEED: Content[] = NEWS_2027_ARTICLES.map((article) => ({
  id: article.id,
  type: 'news',
  league: article.league || 'ipl',
  season: 2027,
  title: article.title,
  summary: article.summary,
  content: article.content,
  imageUrl: article.imageUrl || article.image || DEFAULT_NEWS_FALLBACK_IMAGE,
  isActive: true,
  isImportant: Boolean(article.isImportant),
  category: (article.category || 'general') as Content['category'],
  linkedTeamIds: article.linkedTeamIds,
  linkedMatchId: article.linkedMatchId,
  linkedPlayerIds: article.linkedPlayerIds,
  publishedAt: article.publishedAt,
  createdAt: article.createdAt || article.publishedAt || '2026-11-11T00:00:00.000Z',
  updatedAt: '2026-11-11T12:00:00.000Z',
})) as unknown as Content[];

export function getNewsImageSrc(
  input?: string | { imageUrl?: string; image?: string; image_url?: string; img?: string }
): string {
  try {
    let url: string | undefined;
    if (!input) return DEFAULT_NEWS_FALLBACK_IMAGE;
    if (typeof input === 'string') {
      url = input;
    } else if (typeof input === 'object') {
      url = input.image || input.imageUrl || input.image_url || input.img;
    }
    if (!url || typeof url !== 'string') return DEFAULT_NEWS_FALLBACK_IMAGE;
    const trimmed = url.trim();
    if (!trimmed) return DEFAULT_NEWS_FALLBACK_IMAGE;
    if (trimmed.startsWith('data:') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (trimmed.startsWith('//')) {
      return typeof window !== 'undefined' ? `${window.location.protocol}${trimmed}` : `https:${trimmed}`;
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  } catch {
    return DEFAULT_NEWS_FALLBACK_IMAGE;
  }
}

export function getArticleReadTime(content?: string): number {
  if (!content) return 2;
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.ceil(words / 180));
}

export function formatNewsDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getCategoryLabel(category?: string): string {
  switch (category) {
    case 'breaking':
      return 'Breaking';
    case 'match':
      return 'Schedule & Match';
    case 'team':
      return 'Squads & Trades';
    case 'player':
      return 'Player Watch';
    case 'behind-the-scenes':
      return 'Inside Story';
    case 'inspiration':
      return 'Feature';
    default:
      return '2027 Outlook';
  }
}
