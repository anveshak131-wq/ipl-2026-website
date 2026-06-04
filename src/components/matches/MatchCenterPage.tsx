'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  Cloud,
  FileText,
  Lock,
  MessageSquare,
  Newspaper,
  Target,
  Trophy,
  Users,
  AlertTriangle,
  CloudRain,
  Info,
} from 'lucide-react';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PollCard from '@/components/predictions/PollCard';
import { useLeague } from '@/contexts/LeagueContext';
import { api } from '@/lib/data';
import { getAnimatedLogoPath, getLogoPath } from '@/lib/logoUtils';
import { getMatchNumberDisplay } from '@/lib/matchNumberUtils';
import { getMatchAdvisory } from '@/lib/matchAdvisory';
import { getPlaying11VisibilityMessage, isPlaying11VisibleNow } from '@/lib/playing11Utils';
import { formatMatchTime } from '@/lib/timeUtils';
import { League, Match, News, Player, Poll } from '@/types';

interface MatchCenterPageProps {
  backHref?: string;
  preferredLeague?: League;
}

interface ScorecardInnings {
  inningsNumber?: number;
  battingTeamId?: string;
  totalRuns?: number;
  totalWickets?: number;
  totalOvers?: number | string;
  batting?: Array<{
    name?: string;
    runs?: number;
    balls?: number;
    fours?: number;
    sixes?: number;
    strikeRate?: number;
    dismissal?: {
      details?: string;
    };
  }>;
  bowling?: Array<{
    name?: string;
    overs?: number;
    balls?: number;
    maidens?: number;
    runs?: number;
    wickets?: number;
    economyRate?: number;
  }>;
}

interface PublishedScorecard {
  id: string;
  draft?: boolean;
  publishedAt?: string;
  matchInfo?: {
    toss?: {
      winner?: string;
      decision?: string;
    };
  };
  result?: {
    winner?: string;
    margin?: string;
    manOfTheMatch?: string;
    resultType?: string;
    reason?: string;
    reasonDetail?: string;
  };
  innings?: ScorecardInnings[];
}

type ExtrasRow = {
  hasWide?: boolean;
  wideExtraRuns?: number;
  hasNoBall?: boolean;
  hasByes?: boolean;
  byesRuns?: number;
  hasLB?: boolean;
  lbRuns?: number;
};

type WicketRow = {
  hasWicket?: boolean;
  wicketType?: string;
  wicketTaker?: string;
  wicketAssistant?: string;
  outBatter?: 'striker' | 'nonStriker';
};

type LiveScoreTableState = {
  rows: string[][];
  extrasData?: Record<number, ExtrasRow>;
  wicketData?: Record<number, WicketRow>;
  commentaryData?: Record<number, string>;
};

type LiveTotals = {
  runs: number;
  wickets: number;
  overs: string;
  runRate: string;
};

type CommentaryPreviewItem = {
  id: string;
  innings: string;
  overBall: string;
  label: string;
  text: string;
  kind: 'wicket' | 'boundary' | 'extra' | 'run';
};

type MatchWeatherData = {
  venueId: string;
  venueName?: string;
  city?: string;
  current?: {
    temperature?: number;
    feelsLike?: number;
    humidity?: number;
    windSpeed?: number;
    condition?: string;
    description?: string;
    timestamp?: string;
    aiPrediction?: {
      matchImpact?: string;
      pitchEffect?: string;
      dewFactor?: number;
      playingConditions?: string;
      recommendations?: string[];
      confidence?: number;
    };
  };
  lastUpdated?: string;
};

const MAX_LEGAL_BALLS = 120;

const EMPTY_LIVE_TOTALS: LiveTotals = {
  runs: 0,
  wickets: 0,
  overs: '0.0',
  runRate: '0.00',
};

const sectionAnimation = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function getMatchYear(dateString: string | undefined | null): number | null {
  if (!dateString) return null;
  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) return parsed.getFullYear();
  const match = String(dateString).match(/(20\d{2}|19\d{2})/);
  return match ? parseInt(match[1], 10) : null;
}

async function fetchPublishedScorecard(matchId: string, league?: League): Promise<PublishedScorecard | null> {
  try {
    const query = new URLSearchParams({ matchId });
    if (league) {
      query.set('league', league);
    }
    const response = await fetch(`/api/scorecards?${query.toString()}`);
    if (!response.ok) {
      return null;
    }

    const scorecards = await response.json();
    if (!Array.isArray(scorecards)) {
      return null;
    }

    return scorecards.find((card: PublishedScorecard) => card?.draft === false) || null;
  } catch {
    return null;
  }
}

async function fetchLiveScoreRows(matchId: string, league: League): Promise<LiveScoreTableState> {
  try {
    const query = new URLSearchParams({
      matchId,
      withCommentary: '1',
    });
    const response = await fetch(`/api/${league}-live-score/save?${query.toString()}`, {
      cache: 'no-store',
    });
    if (!response.ok) {
      return { rows: [] };
    }

    const data = await response.json();
    if (Array.isArray(data?.rows)) {
      return {
        rows: data.rows as string[][],
        extrasData: (data.extrasData || {}) as Record<number, ExtrasRow>,
        wicketData: (data.wicketData || {}) as Record<number, WicketRow>,
        commentaryData: (data.commentaryData || {}) as Record<number, string>,
      };
    }

    if (Array.isArray(data)) {
      return { rows: data as string[][] };
    }
  } catch {
    // Live rows are additive context; the match center can render without them.
  }

  return { rows: [] };
}

function resolveWeatherVenueId(venue: string, league: League): string | null {
  const normalized = String(venue || '').toLowerCase();
  if (!normalized) return null;

  if (league === 'wpl') {
    if (normalized.includes('dy patil') || normalized.includes('navi mumbai')) return 'wpl-dy-patil';
    if (normalized.includes('bca') || normalized.includes('kotambi') || normalized.includes('vadodara')) {
      return 'wpl-bca-stadium';
    }
  }

  return null;
}

async function fetchMatchWeather(match: Match): Promise<MatchWeatherData | null> {
  const venueId = resolveWeatherVenueId(match.venue, match.league);
  if (!venueId) return null;

  try {
    const response = await fetch(`/api/weather/${venueId}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return (await response.json()) as MatchWeatherData;
  } catch {
    return null;
  }
}

function otherTeamKey(teamKey: 'team1' | 'team2'): 'team1' | 'team2' {
  return teamKey === 'team1' ? 'team2' : 'team1';
}

function getBattingTeamKeyForInnings(match: Match, innings: '1' | '2'): 'team1' | 'team2' {
  const innings1Batting = match.matchState?.innings1?.battingTeam;
  if (innings1Batting === 'team1' || innings1Batting === 'team2') {
    return innings === '1' ? innings1Batting : otherTeamKey(innings1Batting);
  }

  const toss = match.matchState?.toss;
  if (!toss) return innings === '1' ? 'team1' : 'team2';

  const winner = toss.winner;
  if (toss.decision === 'bat') {
    return innings === '1' ? winner : otherTeamKey(winner);
  }

  return innings === '1' ? otherTeamKey(winner) : winner;
}

function calculateLiveTotals(
  rows: string[][],
  extrasData: Record<number, ExtrasRow>,
  wicketData: Record<number, WicketRow>,
  innings: '1' | '2',
): LiveTotals {
  let runs = 0;
  let wickets = 0;
  let legalBalls = 0;

  rows.forEach((row, idx) => {
    if (String(row?.[2] || '') !== innings || legalBalls >= MAX_LEGAL_BALLS) return;

    const extras = extrasData[idx] || {};
    const wicket = wicketData[idx] || {};
    const nonDeliveryWicket =
      Boolean(wicket.hasWicket) &&
      ['Mankad (Run out at non-striker end)', 'Timed Out', 'Retired Hurt', 'Retired Out'].includes(
        String(wicket.wicketType || ''),
      );

    const batRuns = extras.hasWide ? 0 : Number.parseInt(String(row?.[6] || ''), 10) || 0;
    let extraRuns = 0;
    if (extras.hasWide) extraRuns += 1 + (Number(extras.wideExtraRuns) || 0);
    if (extras.hasNoBall) extraRuns += 1;
    if (extras.hasByes && !extras.hasWide) extraRuns += Number(extras.byesRuns) || 0;
    if (extras.hasLB && !extras.hasWide) extraRuns += Number(extras.lbRuns) || 0;

    if (!nonDeliveryWicket) {
      runs += batRuns + extraRuns;
    }

    if (wicket.hasWicket && String(wicket.wicketType || '') !== 'Retired Hurt') {
      wickets += 1;
    }

    if (!extras.hasWide && !extras.hasNoBall && !nonDeliveryWicket) {
      legalBalls += 1;
    }
  });

  const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
  const runRate = legalBalls > 0 ? ((runs / legalBalls) * 6).toFixed(2) : '0.00';
  return { runs, wickets, overs, runRate };
}

function buildCommentaryPreview(
  rows: string[][],
  extrasData: Record<number, ExtrasRow>,
  wicketData: Record<number, WicketRow>,
  commentaryData: Record<number, string>,
  resolvePlayerName: (value: string) => string,
): CommentaryPreviewItem[] {
  return rows
    .map((row, idx) => {
      const innings = String(row?.[2] || '');
      if (innings !== '1' && innings !== '2') return null;

      const over = String(row?.[0] || '0');
      const ball = String(row?.[1] || '0');
      const striker = resolvePlayerName(String(row?.[3] || '')) || 'Batter';
      const bowler = resolvePlayerName(String(row?.[5] || '')) || 'Bowler';
      const runs = Number.parseInt(String(row?.[6] || ''), 10) || 0;
      const extras = extrasData[idx] || {};
      const wicket = wicketData[idx] || {};
      const apiText = String(commentaryData[idx] || '').trim();
      const noteText = String(row?.[12] || '').trim();

      let kind: CommentaryPreviewItem['kind'] = 'run';
      if (wicket.hasWicket) kind = 'wicket';
      else if (runs === 4 || runs === 6) kind = 'boundary';
      else if (extras.hasWide || extras.hasNoBall || extras.hasByes || extras.hasLB) kind = 'extra';

      const fallback = wicket.hasWicket
        ? 'Wicket falls.'
        : extras.hasWide
          ? 'Wide called.'
          : extras.hasNoBall
            ? 'No-ball called.'
            : runs === 0
              ? 'Dot ball.'
              : `${runs} ${runs === 1 ? 'run' : 'runs'} taken.`;

      return {
        id: `${idx}-${innings}-${over}.${ball}`,
        innings,
        overBall: `${over}.${ball}`,
        label: `${bowler} to ${striker}`,
        text: noteText || apiText || fallback,
        kind,
      } satisfies CommentaryPreviewItem;
    })
    .filter((item): item is CommentaryPreviewItem => Boolean(item))
    .slice(-12)
    .reverse();
}

function buildRelatedNews(match: Match, newsItems: News[]): News[] {
  const teamIds = new Set([String(match.team1?.id || ''), String(match.team2?.id || '')].filter(Boolean));
  const playingIds = new Set([
    ...(Array.isArray(match.playing11?.team1) ? match.playing11!.team1 : []),
    ...(Array.isArray(match.playing11?.team2) ? match.playing11!.team2 : []),
  ].map(String));

  return [...newsItems]
    .map((item) => {
      let score = 0;
      if (String(item.linkedMatchId || '') === String(match.id)) score += 100;
      if (Array.isArray(item.linkedTeamIds) && item.linkedTeamIds.some((id) => teamIds.has(String(id)))) score += 40;
      if (Array.isArray(item.linkedPlayerIds) && item.linkedPlayerIds.some((id) => playingIds.has(String(id)))) {
        score += 20;
      }
      if (item.league === match.league || item.league === 'both') score += 5;
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aDate = new Date(a.item.publishedAt || a.item.createdAt || '').getTime() || 0;
      const bDate = new Date(b.item.publishedAt || b.item.createdAt || '').getTime() || 0;
      return bDate - aDate;
    })
    .slice(0, 4)
    .map(({ item }) => item);
}

export default function MatchCenterPage({ backHref = '/matches', preferredLeague }: MatchCenterPageProps) {
  const params = useParams<{ matchId: string }>();
  const searchParams = useSearchParams();
  const searchKey = typeof searchParams?.toString === 'function' ? searchParams.toString() : '';
  const matchId = typeof params?.matchId === 'string' ? decodeURIComponent(params.matchId) : '';

  const { setCurrentLeague } = useLeague();

  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [scorecard, setScorecard] = useState<PublishedScorecard | null>(null);
  const [liveScoreState, setLiveScoreState] = useState<LiveScoreTableState>({ rows: [] });
  const [poll, setPoll] = useState<Poll | null>(null);
  const [relatedNews, setRelatedNews] = useState<News[]>([]);
  const [weather, setWeather] = useState<MatchWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!matchId) {
      setError('Invalid match id.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const loadMatchCenter = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const hintedLeague = searchParams.get('league');
        const hintedDate = searchParams.get('date');
        const hintedTeam1Id = searchParams.get('team1Id');
        const hintedTeam2Id = searchParams.get('team2Id');
        const hintedSeasonRaw = searchParams.get('season');
        const hintedSeason = hintedSeasonRaw ? Number.parseInt(hintedSeasonRaw, 10) : Number.NaN;

        const leagues: League[] = preferredLeague
          ? [preferredLeague, preferredLeague === 'ipl' ? 'wpl' : 'ipl']
          : ['ipl', 'wpl'];

        const leagueMatchLists = await Promise.all(
          leagues.map((league) => api.getMatches(league, { includeAll: true }))
        );
        const allMatches = leagueMatchLists.flat();
        const sameIdMatches = allMatches.filter((item) => String(item.id) === matchId);

        const sortedByScore = (items: Match[]) => {
          return [...items].sort((a, b) => {
              const score = (item: Match) => {
                let value = 0;
                const itemYear = getMatchYear(item.date) || 0;
                value += itemYear;
                if (preferredLeague && item.league === preferredLeague) {
                  value += 10_000;
                }
                if (hintedLeague && item.league === hintedLeague) {
                  value += 8_000;
                }
                if (hintedDate && item.date === hintedDate) {
                  value += 5_000;
                }
                if (Number.isFinite(hintedSeason) && itemYear === hintedSeason) {
                  value += 4_000;
                }

                const itemTeam1 = String(item.team1?.id || '');
                const itemTeam2 = String(item.team2?.id || '');

                if (hintedTeam1Id && hintedTeam2Id) {
                  const exactOrder = itemTeam1 === hintedTeam1Id && itemTeam2 === hintedTeam2Id;
                  const swappedOrder = itemTeam1 === hintedTeam2Id && itemTeam2 === hintedTeam1Id;
                  if (exactOrder) value += 3_000;
                  else if (swappedOrder) value += 1_500;
                }

                return value;
              };

              return score(b) - score(a);
            });
        };

        let selectedMatch: Match | null = sameIdMatches.length > 0 ? sortedByScore(sameIdMatches)[0] : null;

        // Hint-first disambiguation: if URL contains date + team IDs, prefer that exact fixture
        // even when there are duplicate/legacy IDs in storage.
        if (hintedDate && hintedTeam1Id && hintedTeam2Id) {
          const hintedMatches = allMatches.filter((item) => {
            if (hintedLeague && item.league !== hintedLeague) {
              return false;
            }

            if (Number.isFinite(hintedSeason) && getMatchYear(item.date) !== hintedSeason) {
              return false;
            }

            if (item.date !== hintedDate) {
              return false;
            }

            const itemTeam1 = String(item.team1?.id || '');
            const itemTeam2 = String(item.team2?.id || '');
            const exactOrder = itemTeam1 === hintedTeam1Id && itemTeam2 === hintedTeam2Id;
            const swappedOrder = itemTeam1 === hintedTeam2Id && itemTeam2 === hintedTeam1Id;

            return exactOrder || swappedOrder;
          });

          if (hintedMatches.length > 0) {
            selectedMatch = sortedByScore(hintedMatches)[0];
          }
        }

        if (!selectedMatch) {
          if (!cancelled) {
            setMatch(null);
            setPlayers([]);
            setScorecard(null);
            setLiveScoreState({ rows: [] });
            setPoll(null);
            setRelatedNews([]);
            setWeather(null);
            setError('Match not found.');
            setIsLoading(false);
          }
          return;
        }

        const [leaguePlayers, publishedScorecard, liveRows, pollData, newsItems, weatherData] = await Promise.all([
          api.getPlayers(undefined, selectedMatch.league),
          fetchPublishedScorecard(selectedMatch.id, selectedMatch.league),
          fetchLiveScoreRows(selectedMatch.id, selectedMatch.league),
          api.getPolls(selectedMatch.id).catch(() => null),
          api.getNews().catch(() => []),
          fetchMatchWeather(selectedMatch),
        ]);

        if (cancelled) {
          return;
        }

        setCurrentLeague(selectedMatch.league);
        setMatch(selectedMatch);
        setPlayers(leaguePlayers || []);
        setScorecard(publishedScorecard);
        setLiveScoreState(liveRows);
        setPoll((pollData || null) as Poll | null);
        setRelatedNews(buildRelatedNews(selectedMatch, (newsItems || []) as News[]));
        setWeather(weatherData);
      } catch (loadError) {
        if (!cancelled) {
          setError('Failed to load this match. Please try again.');
          console.error('Match center load error:', loadError);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadMatchCenter();

    return () => {
      cancelled = true;
    };
  }, [matchId, preferredLeague, searchKey, setCurrentLeague]);
  

  const matchNumber = useMemo(() => {
    if (!match) return 'TBD';
    return getMatchNumberDisplay(match);
  }, [match]);

  const advisory = useMemo(() => getMatchAdvisory(match), [match]);
  const advisoryConfig = useMemo(() => {
    if (!advisory) return null;
    switch (advisory.type) {
      case 'abandoned':
        return { icon: AlertTriangle, border: 'rgba(248,113,113,0.45)', bg: 'rgba(248,113,113,0.12)', accent: '#f87171' };
      case 'reduced-overs':
        return { icon: CloudRain, border: 'rgba(96,165,250,0.45)', bg: 'rgba(96,165,250,0.12)', accent: '#60a5fa' };
      case 'no-result':
        return { icon: AlertTriangle, border: 'rgba(251,191,36,0.5)', bg: 'rgba(251,191,36,0.12)', accent: '#fbbf24' };
      default:
        return { icon: Info, border: 'rgba(148,163,184,0.35)', bg: 'rgba(148,163,184,0.1)', accent: '#cbd5f5' };
    }
  }, [advisory]);
  const AdvisoryIcon = advisoryConfig?.icon;

  const tossMessage = useMemo(() => {
    if (!match) return null;

    if (scorecard?.matchInfo?.toss?.winner && scorecard.matchInfo.toss.decision) {
      return `${scorecard.matchInfo.toss.winner} won the toss and chose to ${scorecard.matchInfo.toss.decision}.`;
    }

    if (match.matchState?.toss?.winner && match.matchState.toss.decision) {
      const tossWinner = match.matchState.toss.winner === 'team1'
        ? (match.team1?.name || 'Team 1')
        : (match.team2?.name || 'Team 2');
      return `${tossWinner} won the toss and chose to ${match.matchState.toss.decision}.`;
    }

    return null;
  }, [match, scorecard]);

  const isPlaying11Visible = useMemo(() => {
    if (!match?.playing11) return false;
    return isPlaying11VisibleNow(match.date, match.time, match.playing11.setAt);
  }, [match]);

  const playing11Message = useMemo(() => {
    if (!match) return 'Match yet to start.';
    if (!match.playing11?.setAt) return 'Match yet to start. Playing 11 will appear once admin publishes it.';
    return getPlaying11VisibilityMessage(match.date, match.time);
  }, [match]);

  const playerMap = useMemo(() => {
    return new Map(players.map((player) => [player.id, player]));
  }, [players]);

  const team1Playing11 = useMemo(() => {
    const team1Ids = Array.isArray(match?.playing11?.team1) ? match.playing11!.team1 : [];
    return team1Ids.map((id) => playerMap.get(id)?.name || id);
  }, [match, playerMap]);

  const team2Playing11 = useMemo(() => {
    const team2Ids = Array.isArray(match?.playing11?.team2) ? match.playing11!.team2 : [];
    return team2Ids.map((id) => playerMap.get(id)?.name || id);
  }, [match, playerMap]);

  const innings = useMemo(() => {
    if (!Array.isArray(scorecard?.innings)) return [];
    return scorecard.innings
      .filter((inning): inning is ScorecardInnings => Boolean(inning))
      .sort((a, b) => (a.inningsNumber ?? 0) - (b.inningsNumber ?? 0));
  }, [scorecard]);

  const liveScoreSummary = useMemo(() => {
    if (!match) {
      return {
        hasLiveRows: false,
        team1: '',
        team2: '',
        source: 'Awaiting data',
        team1Live: EMPTY_LIVE_TOTALS,
        team2Live: EMPTY_LIVE_TOTALS,
      };
    }

    const rows = Array.isArray(liveScoreState.rows) ? liveScoreState.rows : [];
    const extrasData = liveScoreState.extrasData || {};
    const wicketData = liveScoreState.wicketData || {};
    const hasLiveRows = rows.length > 0;
    const innings1Totals = calculateLiveTotals(rows, extrasData, wicketData, '1');
    const innings2Totals = calculateLiveTotals(rows, extrasData, wicketData, '2');
    const innings1BattingKey = getBattingTeamKeyForInnings(match, '1');
    const team1Live = innings1BattingKey === 'team1' ? innings1Totals : innings2Totals;
    const team2Live = innings1BattingKey === 'team1' ? innings2Totals : innings1Totals;

    const scorecardForTeam = (teamId: string) => {
      const inning = innings.find((item) => String(item.battingTeamId || '') === String(teamId));
      if (!inning) return '';
      return `${inning.totalRuns || 0}/${inning.totalWickets || 0} (${inning.totalOvers || 0} ov)`;
    };

    const structuredMatchScore = (teamKey: 'team1' | 'team2') => {
      const score = match.score?.[teamKey];
      if (!score) return '';
      return `${score.runs}/${score.wickets} (${score.overs} ov)`;
    };

    const liveTeam1 = hasLiveRows ? `${team1Live.runs}/${team1Live.wickets} (${team1Live.overs} ov)` : '';
    const liveTeam2 = hasLiveRows ? `${team2Live.runs}/${team2Live.wickets} (${team2Live.overs} ov)` : '';

    return {
      hasLiveRows,
      team1: liveTeam1 || match.team1Score || structuredMatchScore('team1') || scorecardForTeam(match.team1?.id || ''),
      team2: liveTeam2 || match.team2Score || structuredMatchScore('team2') || scorecardForTeam(match.team2?.id || ''),
      source: hasLiveRows ? 'Live ball-by-ball' : scorecard ? 'Published scorecard' : 'Match record',
      team1Live,
      team2Live,
    };
  }, [innings, liveScoreState, match, scorecard]);

  const commentaryPreview = useMemo(() => {
    const rows = Array.isArray(liveScoreState.rows) ? liveScoreState.rows : [];
    if (rows.length === 0) return [];
    return buildCommentaryPreview(
      rows,
      liveScoreState.extrasData || {},
      liveScoreState.wicketData || {},
      liveScoreState.commentaryData || {},
      (value) => playerMap.get(value)?.name || value,
    );
  }, [liveScoreState, playerMap]);

  const resultSummary = useMemo(() => {
    if (!match) return '';
    if (match.result) return match.result;
    if (scorecard?.result?.winner) {
      const winner = scorecard.result.winner;
      const margin = scorecard.result.margin ? ` by ${scorecard.result.margin}` : '';
      return `${winner} won${margin}`;
    }
    return '';
  }, [match, scorecard]);

  const impactPlayerRows = useMemo(() => {
    if (!match) return [];

    const getName = (value?: string) => {
      const id = String(value || '').trim();
      if (!id) return '';
      return playerMap.get(id)?.name || id;
    };

    return (['team1', 'team2'] as const).map((teamKey) => {
      const team = match[teamKey];
      const used = match.impactPlayer?.[teamKey];
      const nominees = Array.isArray(match.impactSubstitutes?.[teamKey])
        ? match.impactSubstitutes![teamKey].map(getName).filter(Boolean)
        : [];

      return {
        teamKey,
        teamName: team?.name || (teamKey === 'team1' ? 'Team 1' : 'Team 2'),
        usedImpact: getName(used?.impact || used?.playerId),
        replaced: getName(used?.original),
        substitutedAt: used?.substitutedAt,
        nominees,
      };
    });
  }, [match, playerMap]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b17]">
        <Navbar />
        <div className="h-[70vh] flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-[#070b17] text-white">
        <Navbar />
        <main className="relative min-h-[70vh] px-4 py-14 sm:px-6 lg:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(70%_70%_at_20%_10%,rgba(56,189,248,0.16),transparent),radial-gradient(65%_65%_at_80%_85%,rgba(245,158,11,0.14),transparent),linear-gradient(165deg,#070b17_0%,#0d1324_45%,#15182e_100%)]" />
          <div className="relative z-10 max-w-3xl mx-auto rounded-3xl border border-white/15 bg-black/30 backdrop-blur-xl p-8 text-center">
            <p className="text-2xl font-black">{error || 'Match not found.'}</p>
            <p className="text-slate-300 mt-3">Please go back and select another fixture.</p>
            <Link
              href={backHref}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-300/35 bg-cyan-500/10 px-4 py-2.5 font-semibold text-cyan-100 hover:bg-cyan-500/20 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Matches
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const team1Id = match.team1?.id ?? '';
  const team2Id = match.team2?.id ?? '';
  const team1ShortName = match.team1?.shortName || 'TBD';
  const team2ShortName = match.team2?.shortName || 'TBD';
  const team1Name = match.team1?.name || 'Team 1';
  const team2Name = match.team2?.name || 'Team 2';

  const team1Logo = match.team1?.logo && !String(match.team1.logo).endsWith('.json')
    ? String(match.team1.logo)
    : getAnimatedLogoPath(team1Id, team1ShortName, match.league);
  const team2Logo = match.team2?.logo && !String(match.team2.logo).endsWith('.json')
    ? String(match.team2.logo)
    : getAnimatedLogoPath(team2Id, team2ShortName, match.league);

  const pageOilTheme = match.league === 'wpl'
    ? {
        base: 'linear-gradient(155deg, #10071d 0%, #1c0b2d 38%, #142244 72%, #0a172f 100%)',
        hazeA: 'radial-gradient(82% 70% at 14% 12%, rgba(236,72,153,0.26) 0%, rgba(168,85,247,0.1) 55%, transparent 80%)',
        hazeB: 'radial-gradient(75% 66% at 88% 88%, rgba(34,211,238,0.22) 0%, rgba(56,189,248,0.09) 55%, transparent 80%)',
        brush: 'linear-gradient(112deg, rgba(244,114,182,0.18), rgba(147,51,234,0.08), rgba(56,189,248,0.04))',
      }
    : {
        base: 'linear-gradient(155deg, #120a12 0%, #221018 38%, #1a2845 72%, #0d1c33 100%)',
        hazeA: 'radial-gradient(82% 70% at 14% 12%, rgba(251,146,60,0.24) 0%, rgba(236,72,153,0.09) 55%, transparent 80%)',
        hazeB: 'radial-gradient(74% 66% at 88% 88%, rgba(99,102,241,0.2) 0%, rgba(56,189,248,0.08) 55%, transparent 80%)',
        brush: 'linear-gradient(112deg, rgba(245,158,11,0.16), rgba(236,72,153,0.08), rgba(99,102,241,0.04))',
      };

  return (
    <div className="min-h-screen text-white bg-[#070b17]">
      <Navbar />

      <main className="relative overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
        {/* Oil-canvas background */}
        <div className="absolute inset-0" style={{ background: pageOilTheme.base }} />
        <div className="absolute inset-0" style={{ background: pageOilTheme.hazeA, mixBlendMode: 'screen' }} />
        <div className="absolute inset-0" style={{ background: pageOilTheme.hazeB, mixBlendMode: 'screen' }} />

        <motion.div
          className="absolute -top-32 left-[-14%] w-[72%] h-[36%] rounded-[120px] blur-2xl opacity-80"
          style={{ background: pageOilTheme.brush, transform: 'rotate(-8deg)' }}
          animate={{ x: [0, 10, 0], y: [0, -8, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-28 right-[-12%] w-[70%] h-[34%] rounded-[120px] blur-2xl opacity-70"
          style={{ background: pageOilTheme.brush, transform: 'rotate(9deg)' }}
          animate={{ x: [0, -10, 0], y: [0, 8, 0] }}
          transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />

        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 4px)',
            mixBlendMode: 'soft-light',
          }}
        />

        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 42%, transparent 0%, rgba(2,6,23,0.24) 64%, rgba(2,6,23,0.58) 100%)' }}
        />

        <motion.div
          className="absolute -top-24 right-[-12%] h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.24), transparent 70%)' }}
          animate={{ y: [0, -18, 0], x: [0, 12, 0] }}
          transition={{ duration: 11, ease: 'easeInOut', repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-24 left-[-12%] h-80 w-80 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.18), transparent 70%)' }}
          animate={{ y: [0, 16, 0], x: [0, -10, 0] }}
          transition={{ duration: 12, ease: 'easeInOut', repeat: Infinity, delay: 0.5 }}
        />

        <div className="relative z-10 max-w-6xl mx-auto space-y-6">
          <div>
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Matches
            </Link>
          </div>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/30 p-6 md:p-8 backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.35)]"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <span className="inline-flex items-center rounded-full border border-cyan-300/35 bg-cyan-500/10 px-3 py-1 text-xs font-bold tracking-[0.18em] text-cyan-100 uppercase">
                {(match.league || '').toUpperCase()} Match Center
              </span>
              <span className="text-xs font-semibold text-amber-200 bg-amber-500/10 border border-amber-300/35 px-3 py-1 rounded-full">
                {matchNumber}
              </span>
            </div>

            {advisory && advisoryConfig && AdvisoryIcon && (
              <div
                className="mb-5 rounded-2xl border px-4 py-3 text-sm"
                style={{ background: advisoryConfig.bg, borderColor: advisoryConfig.border }}
              >
                <div className="flex items-start gap-3">
                  <AdvisoryIcon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: advisoryConfig.accent }} />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: advisoryConfig.accent }}>
                      {advisory.title}
                    </p>
                    {advisory.detail && (
                      <p className="text-sm text-slate-100/80 mt-0.5">
                        {advisory.detail}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="flex flex-col items-center text-center gap-2">
                <Image
                  src={team1Logo}
                  alt={`${team1ShortName} logo`}
                  width={84}
                  height={84}
                  className="rounded-2xl object-contain"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = getLogoPath(team1Id);
                  }}
                />
                <p className="text-lg md:text-xl font-black">{team1ShortName}</p>
                <p className="text-xs md:text-sm text-slate-300">{team1Name}</p>
                {liveScoreSummary.team1 && <p className="text-sm font-semibold text-cyan-200">{liveScoreSummary.team1}</p>}
              </div>

              <div className="px-3 py-2 rounded-xl border border-white/20 bg-white/5 text-xs md:text-sm font-black tracking-[0.2em] text-slate-200">
                VS
              </div>

              <div className="flex flex-col items-center text-center gap-2">
                <Image
                  src={team2Logo}
                  alt={`${team2ShortName} logo`}
                  width={84}
                  height={84}
                  className="rounded-2xl object-contain"
                  onError={(event) => {
                    (event.target as HTMLImageElement).src = getLogoPath(team2Id);
                  }}
                />
                <p className="text-lg md:text-xl font-black">{team2ShortName}</p>
                <p className="text-xs md:text-sm text-slate-300">{team2Name}</p>
                {liveScoreSummary.team2 && <p className="text-sm font-semibold text-cyan-200">{liveScoreSummary.team2}</p>}
              </div>
            </div>

            {(() => {
              const hasOversInfo = Boolean(match.reducedOversTo) || Boolean(match.dlsApplied);
              return (
                <div className={`mt-6 grid gap-3 ${hasOversInfo ? 'md:grid-cols-4' : 'md:grid-cols-3'} text-sm`}>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Date</p>
                    <p className="font-semibold">{match.date ? new Date(match.date).toDateString() : 'TBD'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Time</p>
                    <p className="font-semibold">{formatMatchTime(match.time, match.date)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-slate-400 text-xs uppercase tracking-wide">Venue</p>
                    <p className="font-semibold line-clamp-2">{match.venue}</p>
                  </div>
                  {hasOversInfo && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-slate-400 text-xs uppercase tracking-wide">Overs</p>
                      <p className="font-semibold">
                        {match.reducedOversTo ? `${match.reducedOversTo} per side` : '—'}
                      </p>
                      {match.dlsApplied && (
                        <p className="text-xs text-slate-400 mt-1">DLS applied</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {!scorecard && !isPlaying11Visible && !tossMessage && (
              <div className="mt-6 rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-slate-200">
                Match yet to start. Match data will unlock here once admin publishes scorecard, playing 11, and toss updates.
              </div>
            )}
          </motion.section>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/25 p-6 md:p-8 backdrop-blur-xl"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45, delay: 0.08 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-emerald-200" />
                <h2 className="text-2xl font-black">Score Summary</h2>
              </div>
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-300">
                {liveScoreSummary.source}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  name: team1Name,
                  shortName: team1ShortName,
                  logo: team1Logo,
                  fallbackId: team1Id,
                  score: liveScoreSummary.team1 || 'Yet to bat',
                  runRate: liveScoreSummary.team1Live.runRate,
                  accent: 'cyan',
                },
                {
                  name: team2Name,
                  shortName: team2ShortName,
                  logo: team2Logo,
                  fallbackId: team2Id,
                  score: liveScoreSummary.team2 || 'Yet to bat',
                  runRate: liveScoreSummary.team2Live.runRate,
                  accent: 'fuchsia',
                },
              ].map((team) => (
                <div
                  key={team.shortName}
                  className={`rounded-2xl border p-4 ${
                    team.accent === 'cyan'
                      ? 'border-cyan-300/25 bg-cyan-500/10'
                      : 'border-fuchsia-300/25 bg-fuchsia-500/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={team.logo}
                      alt={`${team.shortName} logo`}
                      width={52}
                      height={52}
                      className="rounded-xl object-contain"
                      onError={(event) => {
                        (event.target as HTMLImageElement).src = getLogoPath(team.fallbackId);
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-300 truncate">{team.name}</p>
                      <p className="text-2xl font-black text-white tabular-nums">{team.score}</p>
                      {liveScoreSummary.hasLiveRows && (
                        <p className="text-xs text-slate-300 mt-1">Run rate {team.runRate}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {resultSummary && (
              <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200">Result</p>
                <p className="mt-1 text-sm md:text-base font-semibold text-amber-50">{resultSummary}</p>
                {scorecard?.result?.manOfTheMatch && (
                  <p className="mt-1 text-sm text-slate-300">Player of the Match: {scorecard.result.manOfTheMatch}</p>
                )}
              </div>
            )}
          </motion.section>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/25 p-6 md:p-8 backdrop-blur-xl"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-cyan-200" />
              <h2 className="text-2xl font-black">Toss Winner</h2>
            </div>

            {tossMessage ? (
              <p className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 text-cyan-50 text-sm md:text-base">
                {tossMessage}
              </p>
            ) : (
              <div className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-slate-300 flex items-center gap-2">
                <Lock size={16} />
                Match yet to start. Toss will show once admin allows it.
              </div>
            )}
          </motion.section>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/25 p-6 md:p-8 backdrop-blur-xl"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45, delay: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-amber-200" />
              <h2 className="text-2xl font-black">Playing 11</h2>
            </div>

            {isPlaying11Visible ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 p-4">
                  <h3 className="font-bold text-cyan-100 mb-3">{team1Name}</h3>
                  <ul className="space-y-2 text-sm">
                    {team1Playing11.map((name) => (
                      <li key={name} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-fuchsia-300/25 bg-fuchsia-500/10 p-4">
                  <h3 className="font-bold text-fuchsia-100 mb-3">{team2Name}</h3>
                  <ul className="space-y-2 text-sm">
                    {team2Playing11.map((name) => (
                      <li key={name} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-slate-300">
                <p className="flex items-center gap-2 mb-1"><Lock size={16} /> Playing 11 is locked for now.</p>
                <p className="text-sm text-slate-400">{playing11Message}</p>
              </div>
            )}
          </motion.section>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/25 p-6 md:p-8 backdrop-blur-xl"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45, delay: 0.18 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-violet-200" />
              <h2 className="text-2xl font-black">Impact Player</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {impactPlayerRows.map((row) => (
                <div key={row.teamKey} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="font-bold text-white mb-3">{row.teamName}</h3>
                  {row.usedImpact ? (
                    <div className="rounded-xl border border-violet-300/25 bg-violet-500/10 p-3">
                      <p className="text-xs uppercase tracking-wide text-violet-200">Used</p>
                      <p className="mt-1 font-semibold text-white">
                        {row.usedImpact}
                        {row.replaced ? <span className="text-slate-300"> for {row.replaced}</span> : null}
                      </p>
                      {typeof row.substitutedAt === 'number' && (
                        <p className="mt-1 text-xs text-slate-400">Introduced around over {row.substitutedAt}</p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-300/20 bg-slate-900/40 p-3 text-sm text-slate-300">
                      No impact substitution recorded yet.
                    </div>
                  )}

                  {row.nominees.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">Nominees</p>
                      <div className="flex flex-wrap gap-2">
                        {row.nominees.map((name) => (
                          <span key={`${row.teamKey}-${name}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/25 p-6 md:p-8 backdrop-blur-xl"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-sky-200" />
                <h2 className="text-2xl font-black">Commentary</h2>
              </div>
              {commentaryPreview.length > 0 && (
                <Link
                  href={`/live-score?league=${match.league}&matchId=${encodeURIComponent(match.id)}`}
                  className="text-sm font-semibold text-cyan-200 hover:text-cyan-100"
                >
                  Open live view
                </Link>
              )}
            </div>

            {commentaryPreview.length > 0 ? (
              <ol className="space-y-3">
                {commentaryPreview.map((item) => {
                  const style =
                    item.kind === 'wicket'
                      ? 'border-red-300/25 bg-red-500/10 text-red-100'
                      : item.kind === 'boundary'
                        ? 'border-cyan-300/25 bg-cyan-500/10 text-cyan-100'
                        : item.kind === 'extra'
                          ? 'border-amber-300/25 bg-amber-500/10 text-amber-100'
                          : 'border-white/10 bg-white/5 text-slate-100';

                  return (
                    <li key={item.id} className={`rounded-2xl border p-3 ${style}`}>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs font-black tabular-nums">
                          {item.overBall}
                        </span>
                        <div>
                          <p className="text-xs text-slate-300">{item.label} · Innings {item.innings}</p>
                          <p className="mt-1 text-sm font-medium">{item.text}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-slate-300">
                Ball-by-ball commentary will appear once live scoring rows are saved for this match.
              </div>
            )}
          </motion.section>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/25 p-6 md:p-8 backdrop-blur-xl"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45, delay: 0.22 }}
          >
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cloud size={18} className="text-blue-200" />
                  <h2 className="text-xl font-black">Weather</h2>
                </div>
                {weather?.current ? (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">{weather.venueName || match.venue}</p>
                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-4xl font-black text-white">{Math.round(Number(weather.current.temperature || 0))}°C</span>
                      <span className="pb-1 text-sm capitalize text-slate-300">{weather.current.description || weather.current.condition}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-xs text-slate-400">Humidity</p>
                        <p className="font-bold">{weather.current.humidity ?? '—'}%</p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                        <p className="text-xs text-slate-400">Wind</p>
                        <p className="font-bold">{weather.current.windSpeed ?? '—'} km/h</p>
                      </div>
                    </div>
                    {weather.current.aiPrediction?.playingConditions && (
                      <p className="mt-3 text-sm text-slate-300">{weather.current.aiPrediction.playingConditions}</p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-300/20 bg-slate-900/40 p-3 text-sm text-slate-300">
                    Weather feed is not connected for {match.venue}. Venue context remains available here.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={18} className="text-amber-200" />
                  <h2 className="text-xl font-black">Prediction Poll</h2>
                </div>
                {poll?.isActive ? (
                  <PollCard
                    poll={poll}
                    matchId={match.id}
                    onVote={() => {
                      api.getPolls(match.id).then((nextPoll) => setPoll((nextPoll || poll) as Poll));
                    }}
                  />
                ) : (
                  <div className="rounded-xl border border-slate-300/20 bg-slate-900/40 p-3 text-sm text-slate-300">
                    No active poll for this match.
                    <Link href="/predictions" className="mt-3 inline-flex text-cyan-200 hover:text-cyan-100 font-semibold">
                      View predictions
                    </Link>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Newspaper size={18} className="text-emerald-200" />
                  <h2 className="text-xl font-black">Related News</h2>
                </div>
                {relatedNews.length > 0 ? (
                  <div className="space-y-3">
                    {relatedNews.map((item) => (
                      <Link
                        key={item.id}
                        href={`/news/${item.id}`}
                        className="block rounded-xl border border-white/10 bg-black/20 p-3 transition-colors hover:bg-white/10"
                      >
                        <p className="text-sm font-semibold text-white line-clamp-2">{item.title}</p>
                        {item.summary && <p className="mt-1 text-xs text-slate-400 line-clamp-2">{item.summary}</p>}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-300/20 bg-slate-900/40 p-3 text-sm text-slate-300">
                    No linked news for this fixture yet.
                  </div>
                )}
              </div>
            </div>
          </motion.section>

          <motion.section
            className="rounded-3xl border border-white/15 bg-black/25 p-6 md:p-8 backdrop-blur-xl"
            initial="hidden"
            animate="visible"
            variants={sectionAnimation}
            transition={{ duration: 0.45, delay: 0.24 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-emerald-200" />
              <h2 className="text-2xl font-black">Scorecard</h2>
            </div>

            {scorecard ? (
              <div className="space-y-5">
                {scorecard.result?.winner && (
                  <div className="rounded-2xl border border-emerald-300/30 bg-emerald-500/10 p-4">
                    <p className="text-emerald-100 font-semibold">
                      {scorecard.result.winner}
                      {scorecard.result.margin ? ` won by ${scorecard.result.margin}` : ''}
                    </p>
                  </div>
                )}

                {innings.length === 0 && (
                  <div className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-slate-300">
                    Published scorecard does not have innings data yet.
                  </div>
                )}

                {innings.map((inning, index) => {
                  const isTeam1Batting = String(inning.battingTeamId) === String(team1Id);
                  const battingTeam = isTeam1Batting ? team1Name : team2Name;

                  return (
                    <div key={`${inning.inningsNumber || index}-${battingTeam}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <h3 className="text-lg font-bold">{battingTeam} - Innings {inning.inningsNumber || index + 1}</h3>
                        <span className="text-sm text-cyan-100 bg-cyan-500/15 border border-cyan-300/30 px-3 py-1 rounded-full">
                          {inning.totalRuns || 0}/{inning.totalWickets || 0} ({inning.totalOvers || 0} ov)
                        </span>
                      </div>

                      {inning.batting && inning.batting.length > 0 && (
                        <div className="mb-4 overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-slate-400 border-b border-white/10">
                                <th className="text-left py-2 pr-4">Batter</th>
                                <th className="text-right py-2">R</th>
                                <th className="text-right py-2">B</th>
                                <th className="text-right py-2">4s</th>
                                <th className="text-right py-2">6s</th>
                                <th className="text-right py-2">SR</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inning.batting.map((batter, batterIndex) => (
                                <tr key={`${batter.name || 'batter'}-${batterIndex}`} className="border-b border-white/5 last:border-b-0">
                                  <td className="py-2 pr-4">
                                    <p className="font-medium">{batter.name || 'Unknown'}</p>
                                    {batter.dismissal?.details && (
                                      <p className="text-xs text-slate-400">{batter.dismissal.details}</p>
                                    )}
                                  </td>
                                  <td className="text-right py-2">{batter.runs || 0}</td>
                                  <td className="text-right py-2">{batter.balls || 0}</td>
                                  <td className="text-right py-2">{batter.fours || 0}</td>
                                  <td className="text-right py-2">{batter.sixes || 0}</td>
                                  <td className="text-right py-2">{Number(batter.strikeRate || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {inning.bowling && inning.bowling.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-slate-400 border-b border-white/10">
                                <th className="text-left py-2 pr-4">Bowler</th>
                                <th className="text-right py-2">O</th>
                                <th className="text-right py-2">M</th>
                                <th className="text-right py-2">R</th>
                                <th className="text-right py-2">W</th>
                                <th className="text-right py-2">Econ</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inning.bowling.map((bowler, bowlerIndex) => (
                                <tr key={`${bowler.name || 'bowler'}-${bowlerIndex}`} className="border-b border-white/5 last:border-b-0">
                                  <td className="py-2 pr-4 font-medium">{bowler.name || 'Unknown'}</td>
                                  <td className="text-right py-2">{bowler.overs || 0}.{bowler.balls || 0}</td>
                                  <td className="text-right py-2">{bowler.maidens || 0}</td>
                                  <td className="text-right py-2">{bowler.runs || 0}</td>
                                  <td className="text-right py-2">{bowler.wickets || 0}</td>
                                  <td className="text-right py-2">{Number(bowler.economyRate || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-300/20 bg-slate-900/40 p-4 text-slate-300">
                <p className="flex items-center gap-2 mb-1"><Lock size={16} /> Match yet to start.</p>
                <p className="text-sm text-slate-400">Scorecard will appear once admin publishes it.</p>
              </div>
            )}
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
