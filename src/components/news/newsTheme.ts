import type { Team } from '@/types';
import { DEFAULT_NEWS_FALLBACK_IMAGE } from '@/lib/news2027';

export interface CategoryMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
}

const CATEGORY_MAP: Record<string, CategoryMeta> = {
  breaking: {
    label: 'Breaking',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
    dotClass: 'bg-rose-400',
  },
  match: {
    label: 'Schedule & Match',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    dotClass: 'bg-emerald-400',
  },
  team: {
    label: 'Trades & Squads',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    dotClass: 'bg-sky-400',
  },
  player: {
    label: 'Player Watch',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/35',
    dotClass: 'bg-violet-400',
  },
  'behind-the-scenes': {
    label: 'Inside Story',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    dotClass: 'bg-amber-400',
  },
  inspiration: {
    label: 'Feature',
    badgeClass: 'bg-pink-500/15 text-pink-300 border-pink-500/35',
    dotClass: 'bg-pink-400',
  },
  general: {
    label: '2027 Outlook',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    dotClass: 'bg-amber-400',
  },
};

export function getCategoryMeta(category?: string): CategoryMeta {
  if (!category) return CATEGORY_MAP.general;
  return CATEGORY_MAP[category] || CATEGORY_MAP.general;
}

export interface LeagueMeta {
  label: string;
  pillClass: string;
  accentGradient: string;
}

export function getLeagueMeta(league?: string): LeagueMeta {
  if (league === 'wpl') {
    return {
      label: 'WPL 2027',
      pillClass: 'bg-fuchsia-500/20 text-fuchsia-200 border-fuchsia-400/40',
      accentGradient: 'from-fuchsia-500 via-pink-500 to-cyan-400',
    };
  }
  if (league === 'both') {
    return {
      label: 'IPL & WPL 2027',
      pillClass: 'bg-purple-500/20 text-amber-200 border-purple-400/40',
      accentGradient: 'from-amber-400 via-fuchsia-500 to-cyan-400',
    };
  }
  return {
    label: 'IPL 2027',
    pillClass: 'bg-blue-500/20 text-amber-200 border-blue-400/40',
    accentGradient: 'from-amber-400 via-blue-500 to-indigo-400',
  };
}

export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'section'; heading: string; bullets: string[] };

export function parseArticleBlocks(rawContent: string): ArticleBlock[] {
  const chunks = (rawContent || '')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const blocks: ArticleBlock[] = [];

  for (const chunk of chunks) {
    const lines = chunk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const hasBullets = lines.some((line) => line.startsWith('•') || line.startsWith('- '));

    if (hasBullets) {
      let heading = 'Key Takeaways';
      const bullets: string[] = [];

      for (const line of lines) {
        if (line.startsWith('•') || line.startsWith('- ')) {
          bullets.push(line.replace(/^[•-]\s*/, '').trim());
        } else if (bullets.length === 0) {
          heading = line;
        } else {
          bullets.push(line);
        }
      }

      blocks.push({ type: 'section', heading, bullets });
    } else {
      blocks.push({ type: 'paragraph', text: lines.join(' ') });
    }
  }

  return blocks;
}

const SHORT_NAME_LOGO_MAP: Record<string, string> = {
  RCB: '/logos/rcb_logo_premium.svg',
  MI: '/logos/mi_logo_2026_modern.svg',
  CSK: '/logos/csk_logo_2026_modern.svg',
  SRH: '/logos/srh_logo_2026_modern.svg',
  GT: '/logos/gt_logo_2026_modern.svg',
  PBKS: '/logos/pbks_logo_2026_modern.svg',
  DC: '/logos/dc_logo_2026_modern.svg',
  LSG: '/logos/lsg_logo_2026_modern.svg',
  RR: '/logos/rr_logo_2026_modern.svg',
  KKR: '/logos/kkr_logo_2026_modern.svg',
  'RCB-W': '/logos/wpl_rcb_logo_modern.svg',
  'MI-W': '/logos/wpl_mi_logo_modern.svg',
  'DC-W': '/logos/wpl_dc_logo_modern.svg',
  GG: '/logos/wpl_gg_logo_modern.svg',
  UPW: '/logos/wpl_upw_logo_modern.svg',
};

const ID_FALLBACK_TEAMS: Record<string, { id: string; shortName: string; name: string; logo: string }> = {
  '1': { id: '1', shortName: 'RCB', name: 'Royal Challengers Bengaluru', logo: '/logos/rcb_logo_premium.svg' },
  '2': { id: '2', shortName: 'MI', name: 'Mumbai Indians', logo: '/logos/mi_logo_2026_modern.svg' },
  '3': { id: '3', shortName: 'SRH', name: 'Sunrisers Hyderabad', logo: '/logos/srh_logo_2026_modern.svg' },
  '4': { id: '4', shortName: 'GT', name: 'Gujarat Titans', logo: '/logos/gt_logo_2026_modern.svg' },
  '5': { id: '5', shortName: 'PBKS', name: 'Punjab Kings', logo: '/logos/pbks_logo_2026_modern.svg' },
  '6': { id: '6', shortName: 'DC', name: 'Delhi Capitals', logo: '/logos/dc_logo_2026_modern.svg' },
  '7': { id: '7', shortName: 'LSG', name: 'Lucknow Super Giants', logo: '/logos/lsg_logo_2026_modern.svg' },
  '8': { id: '8', shortName: 'RR', name: 'Rajasthan Royals', logo: '/logos/rr_logo_2026_modern.svg' },
  '9': { id: '9', shortName: 'KKR', name: 'Kolkata Knight Riders', logo: '/logos/kkr_logo_2026_modern.svg' },
  '10': { id: '10', shortName: 'CSK', name: 'Chennai Super Kings', logo: '/logos/csk_logo_2026_modern.svg' },
  '11': { id: '11', shortName: 'DC-W', name: 'Delhi Capitals Women', logo: '/logos/wpl_dc_logo_modern.svg' },
  '12': { id: '12', shortName: 'GG', name: 'Gujarat Giants', logo: '/logos/wpl_gg_logo_modern.svg' },
  '13': { id: '13', shortName: 'MI-W', name: 'Mumbai Indians Women', logo: '/logos/wpl_mi_logo_modern.svg' },
  '14': { id: '14', shortName: 'RCB-W', name: 'Royal Challengers Bengaluru W', logo: '/logos/wpl_rcb_logo_modern.svg' },
  '15': { id: '15', shortName: 'UPW', name: 'UP Warriorz', logo: '/logos/wpl_upw_logo_modern.svg' },
};

export interface ResolvedTeamRef {
  id: string;
  shortName: string;
  name: string;
  logo: string;
}

export function resolveTeamRef(teamId: string, teams: Team[] = []): ResolvedTeamRef | null {
  const norm = String(teamId ?? '').trim().replace(/^team/i, '');
  if (!norm) return null;

  const matched = teams.find(
    (t) =>
      String(t.id) === norm ||
      t.shortName?.toUpperCase() === norm.toUpperCase()
  );

  if (matched) {
    const shortKey = matched.shortName?.toUpperCase() || '';
    const logo =
      (matched.logo && !matched.logo.includes('undefined') ? matched.logo : undefined) ||
      SHORT_NAME_LOGO_MAP[shortKey] ||
      ID_FALLBACK_TEAMS[String(matched.id)]?.logo ||
      DEFAULT_NEWS_FALLBACK_IMAGE;

    return {
      id: String(matched.id),
      shortName: matched.shortName || matched.name,
      name: matched.name,
      logo,
    };
  }

  return ID_FALLBACK_TEAMS[norm] || null;
}
