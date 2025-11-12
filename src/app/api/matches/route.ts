import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/data';
import { getFromKV, setInKV, KV_KEYS } from '@/lib/kv';
import { Match } from '@/types';

/**
 * GET /api/matches
 * Fetch all matches from KV storage or return mock data
 */
export async function GET(_request: NextRequest) {
  try {
    // Try to get from KV first
    const cachedMatches = await getFromKV<Match[]>(KV_KEYS.MATCHES);
    if (cachedMatches && cachedMatches.length > 0) {
      return NextResponse.json(cachedMatches);
    }

    // Fallback to mock data
    const matches = await api.getMatches();
    
    // Store in KV for future requests
    await setInKV(KV_KEYS.MATCHES, matches);
    
    return NextResponse.json(matches);
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/matches
 * Create a new match and store in KV
 */
export async function POST(request: NextRequest) {
  try {
    const matchData = await request.json();
    
    // Validate match data
    if (!matchData.date || !matchData.team1 || !matchData.team2) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get existing matches
    const existingMatches = await getFromKV<Match[]>(KV_KEYS.MATCHES) || 
                           await api.getMatches();
    
    // Create new match
    const newMatch: Match = {
      ...matchData,
      id: Date.now().toString(),
      status: matchData.status || 'upcoming'
    };

    // Add to list
    const updatedMatches = [...existingMatches, newMatch];
    
    // Store in KV
    await setInKV(KV_KEYS.MATCHES, updatedMatches);
    
    return NextResponse.json({
      message: 'Match created successfully',
      match: newMatch
    });
  } catch (error) {
    console.error('Failed to create match:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/matches
 * Update a match in KV storage
 */
export async function PUT(request: NextRequest) {
  try {
    const { id, ...matchData } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // Get existing matches
    const existingMatches = await getFromKV<Match[]>(KV_KEYS.MATCHES) || 
                           await api.getMatches();
    
    // Update match
    const updatedMatches = existingMatches.map(m =>
      m.id === id ? { ...m, ...matchData } : m
    );

    // Store in KV
    await setInKV(KV_KEYS.MATCHES, updatedMatches);
    
    return NextResponse.json({
      message: 'Match updated successfully',
      match: { id, ...matchData }
    });
  } catch (error) {
    console.error('Failed to update match:', error);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/matches
 * Delete a match from KV storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // Get existing matches
    const existingMatches = await getFromKV<Match[]>(KV_KEYS.MATCHES) || 
                           await api.getMatches();
    
    // Remove match
    const updatedMatches = existingMatches.filter(m => m.id !== id);

    // Store in KV
    await setInKV(KV_KEYS.MATCHES, updatedMatches);
    
    return NextResponse.json({
      message: 'Match deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete match:', error);
    return NextResponse.json(
      { error: 'Failed to delete match' },
      { status: 500 }
    );
  }
}
