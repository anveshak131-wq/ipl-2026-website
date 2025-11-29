'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import AuroraBackground from '@/components/ui/AuroraBackground';
import CustomEmoji from '@/components/emoji/CustomEmoji';

interface Prediction {
  matchId: string;
  team1WinProbability: number;
  team2WinProbability: number;
  predictedWinner: string;
  confidence: number;
  keyFactors: string[];
  analysis: string;
}

interface TossTeamStat {
  team: string;
  matches: number;
  tossesWon: number;
  tossWinPct?: number;
  wins: number;
  matchesWhenWinToss: number;
  winsWhenWinToss: number;
  winPctWhenWinToss?: number;
  matchesWhenLoseToss: number;
  winsWhenLoseToss: number;
  winPctWhenLoseToss?: number;
  tossImpact: number;
}

interface TossAnalyticsSnapshot {
  datasetKeys: string[];
  totals: {
    totalMatches: number;
  };
  teams: TossTeamStat[];
  perVenue?: Record<string, unknown>;
  generatedAt?: string;
}

interface TossTeamAggregate {
  code: string;
  name: string;
  matches: number;
  wins: number;
  tossesWon: number;
  matchesWhenWinToss: number;
  winsWhenWinToss: number;
  matchesWhenLoseToss: number;
  winsWhenLoseToss: number;
}

type PredictionsTabKey = 'upcoming' | 'today' | 'byTeam' | 'byVenue';

function mapAnalyticsTeamNameToCode(name: string): string | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;

  if (n.includes('royal challengers')) return 'RCB';
  if (n.includes('mumbai indians')) return 'MI';
  if (n.includes('chennai super kings')) return 'CSK';
  if (n.includes('rajasthan royals')) return 'RR';
  if (n.includes('sunrisers hyderabad')) return 'SRH';
  if (n.includes('gujarat titans')) return 'GT';
  if (n.includes('punjab kings')) return 'PBKS';
  if (n.includes('delhi capitals')) return 'DC';
  if (n.includes('kolkata knight riders')) return 'KKR';
  if (n.includes('lucknow super giants')) return 'LSG';

  return null;
}

function buildTossIndex(snapshot: TossAnalyticsSnapshot | null): Record<string, TossTeamAggregate> {
  const byCode: Record<string, TossTeamAggregate> = {};
  if (!snapshot || !Array.isArray(snapshot.teams)) return byCode;

  for (const t of snapshot.teams) {
    if (!t.team) continue;
    const code = mapAnalyticsTeamNameToCode(t.team);
    if (!code) continue;

    if (!byCode[code]) {
      byCode[code] = {
        code,
        name: t.team,
        matches: 0,
        wins: 0,
        tossesWon: 0,
        matchesWhenWinToss: 0,
        winsWhenWinToss: 0,
        matchesWhenLoseToss: 0,
        winsWhenLoseToss: 0,
      };
    }

    const agg = byCode[code];
    agg.matches += t.matches || 0;
    agg.wins += t.wins || 0;
    agg.tossesWon += t.tossesWon || 0;
    agg.matchesWhenWinToss += t.matchesWhenWinToss || 0;
    agg.winsWhenWinToss += t.winsWhenWinToss || 0;
    agg.matchesWhenLoseToss += t.matchesWhenLoseToss || 0;
    agg.winsWhenLoseToss += t.winsWhenLoseToss || 0;

    // Prefer the latest human-friendly name (e.g. Capitals over Daredevils)
    agg.name = t.team;
  }

  return byCode;
}

function deriveTeamTossProfile(agg?: TossTeamAggregate | null) {
  if (!agg || agg.matches <= 0) {
    return {
      baseWinPct: 0,
      winPctWhenWinToss: 0,
      winPctWhenLoseToss: 0,
      tossImpact: 0,
    };
  }

  const baseWinPct = agg.wins / Math.max(1, agg.matches);
  const winPctWhenWinToss =
    agg.matchesWhenWinToss > 0
      ? agg.winsWhenWinToss / agg.matchesWhenWinToss
      : baseWinPct;
  const winPctWhenLoseToss =
    agg.matchesWhenLoseToss > 0
      ? agg.winsWhenLoseToss / agg.matchesWhenLoseToss
      : baseWinPct;
  const tossImpact = winPctWhenWinToss - winPctWhenLoseToss;

  return { baseWinPct, winPctWhenWinToss, winPctWhenLoseToss, tossImpact };
}

function getTeamCodeFromShortName(shortName: string): string {
  return shortName.trim().toUpperCase();
}

function buildPredictionFromToss(
  match: Match,
  tossIndex: Record<string, TossTeamAggregate>,
): Prediction {
  const code1 = getTeamCodeFromShortName(match.team1.shortName);
  const code2 = getTeamCodeFromShortName(match.team2.shortName);

  const agg1 = tossIndex[code1];
  const agg2 = tossIndex[code2];

  const profile1 = deriveTeamTossProfile(agg1);
  const profile2 = deriveTeamTossProfile(agg2);

  // Base probabilities from overall win percentage
  let base1 = profile1.baseWinPct;
  let base2 = profile2.baseWinPct;

  if (base1 === 0 && base2 === 0) {
    base1 = 0.5;
    base2 = 0.5;
  }

  let p1 = base1;
  let p2 = base2;

  const sumBase = p1 + p2;
  if (sumBase > 0) {
    p1 /= sumBase;
    p2 /= sumBase;
  } else {
    p1 = 0.5;
    p2 = 0.5;
  }

  // Incorporate how strongly each team is affected by the toss
  const k = 0.25; // small weight so toss impact nudges, not dominates
  p1 += k * profile1.tossImpact;
  p2 += k * profile2.tossImpact;

  // Renormalize and clamp
  const sum = p1 + p2;
  if (sum > 0) {
    p1 /= sum;
    p2 /= sum;
  }

  const clamp = (v: number) => Math.min(0.95, Math.max(0.05, v));
  p1 = clamp(p1);
  p2 = clamp(p2);

  const predictedWinner =
    p1 > p2 ? match.team1.shortName : match.team2.shortName;

  const diff = Math.abs(p1 - p2);
  const confidence = 60 + diff * 40; // 60–100 based on separation

  const keyFactors: string[] = [];

  if (agg1 && agg1.matches > 0) {
    keyFactors.push(
      `${match.team1.shortName} estimated win rate: ${(profile1.baseWinPct * 100).toFixed(1)}%`,
    );
    keyFactors.push(
      `Toss impact: winning the toss tends to give ${match.team1.shortName} a noticeable edge in results.`,
    );
  }

  if (agg2 && agg2.matches > 0) {
    keyFactors.push(
      `${match.team2.shortName} estimated win rate: ${(profile2.baseWinPct * 100).toFixed(1)}%`,
    );
    keyFactors.push(
      `Toss impact: winning the toss tends to give ${match.team2.shortName} a noticeable edge in results.`,
    );
  }

  if (!keyFactors.length) {
    keyFactors.push(
      'Limited information available for this matchup; win probabilities are kept close to 50–50.',
    );
  }

  const strongerTeamName =
    p1 > p2 ? match.team1.shortName : match.team2.shortName;
  const weakerTeamName =
    p1 > p2 ? match.team2.shortName : match.team1.shortName;

  const analysis =
    agg1 || agg2
      ? `Prediction: ${match.team1.shortName} vs ${match.team2.shortName} – ${(p1 * 100).toFixed(1)}% vs ${(p2 * 100).toFixed(1)}%. ${strongerTeamName} have a slight edge.`
      : `Prediction: ${match.team1.shortName} vs ${match.team2.shortName} is almost 50–50; both teams look very closely matched.`;

  return {
    matchId: match.id,
    team1WinProbability: p1 * 100,
    team2WinProbability: p2 * 100,
    predictedWinner,
    confidence,
    keyFactors,
    analysis,
  };
}

export default function PredictionsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page - predictions page is temporarily unavailable
    router.replace('/');
  }, [router]);

  // Show a brief message before redirect
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="relative py-16 min-h-screen overflow-hidden section-match-bg">
        <AuroraBackground />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
              className="mb-6"
            >
              <CustomEmoji type="target" size={80} animate={true} />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Predictions Coming Soon
            </h1>
            <p className="text-gray-300 text-lg mb-6 max-w-md">
              We're working on improving the predictions feature. It will be back soon with better AI-powered insights!
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-ipl-gold to-ipl-purple rounded-lg text-white font-semibold hover:from-ipl-gold/90 hover:to-ipl-purple/90 transition-all duration-200 shadow-lg shadow-ipl-gold/20"
            >
              Go to Home
            </motion.button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
