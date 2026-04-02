// API endpoint to calculate statistics from scorecards

import { StatsCalculator } from '@/lib/statsCalculator';

const SCORECARD_CACHE_TTL = 300;

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const league = searchParams.get('league') || 'wpl';
    const statsType = searchParams.get('type') || 'all'; // all, batting, bowling, teams, orangeCap, purpleCap

    // Fetch all published scorecards for the league
    const env = process.env as any;
    const kvNamespace = env.IPL_CACHE;
    
    if (!kvNamespace) {
      return new Response(JSON.stringify({ error: 'KV namespace not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get all scorecard keys
    const listResult = await kvNamespace.list({ prefix: 'scorecard_' });
    const keys = listResult.keys.map((k: any) => k.name);

    // Fetch all scorecards and filter by league
    const scorecardPromises = keys.map((key: string) =>
      kvNamespace.get(key, { type: 'json', cacheTtl: SCORECARD_CACHE_TTL })
    );
    const allScorecards = (await Promise.all(scorecardPromises)).filter(Boolean);
    
    // Filter by league and only get published (non-draft) scorecards
    const scorecards = allScorecards.filter((s: any) => 
      s.league === league && s.draft === false
    );

    // Initialize stats calculator
    const calculator = new StatsCalculator(scorecards);

    // Calculate requested statistics
    let response: any = {};

    switch (statsType) {
      case 'batting':
        response = {
          battingStats: calculator.calculateBattingStats(),
          orangeCap: calculator.getOrangeCap(),
        };
        break;

      case 'bowling':
        response = {
          bowlingStats: calculator.calculateBowlingStats(),
          purpleCap: calculator.getPurpleCap(),
        };
        break;

      case 'teams':
        response = {
          teamStats: calculator.calculateTeamStats(),
        };
        break;

      case 'orangeCap':
        response = calculator.getOrangeCap();
        break;

      case 'purpleCap':
        response = calculator.getPurpleCap();
        break;

      case 'top':
        const limit = parseInt(searchParams.get('limit') || '10');
        response = {
          topBatsmen: calculator.getTopBatsmen(limit),
          topBowlers: calculator.getTopBowlers(limit),
          orangeCap: calculator.getOrangeCap(),
          purpleCap: calculator.getPurpleCap(),
        };
        break;

      case 'all':
      default:
        response = {
          battingStats: calculator.calculateBattingStats(),
          bowlingStats: calculator.calculateBowlingStats(),
          teamStats: calculator.calculateTeamStats(),
          orangeCap: calculator.getOrangeCap(),
          purpleCap: calculator.getPurpleCap(),
        };
        break;
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('Error calculating stats:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to calculate statistics', details: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
