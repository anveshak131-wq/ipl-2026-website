import { NextResponse } from 'next/server';
import { predictTeamScore, PastMatch } from '@/lib/scorePredictor';

// TODO: Replace this mock data with a database call to your Cloudflare D1 database 
// to get actual past matches from this season.
const mockSeasonData: PastMatch[] = [
  { battingTeam: 'RCB', bowlingTeam: 'CSK', venue: 'Chinnaswamy', runsScored: 195 },
  { battingTeam: 'CSK', bowlingTeam: 'RCB', venue: 'Chinnaswamy', runsScored: 180 },
  { battingTeam: 'MI', bowlingTeam: 'RCB', venue: 'Wankhede', runsScored: 210 },
  { battingTeam: 'RCB', bowlingTeam: 'MI', venue: 'Wankhede', runsScored: 190 },
  { battingTeam: 'DC', bowlingTeam: 'CSK', venue: 'Kotla', runsScored: 165 },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { targetTeam, opponent, venue } = body;

    if (!targetTeam || !opponent || !venue) {
      return NextResponse.json(
        { error: 'Missing required fields: targetTeam, opponent, venue' },
        { status: 400 }
      );
    }

    // Generate the prediction based on our algorithm
    const prediction = predictTeamScore(targetTeam, opponent, venue, mockSeasonData);

    return NextResponse.json({ success: true, prediction });
    
  } catch (error) {
    console.error('Prediction API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}