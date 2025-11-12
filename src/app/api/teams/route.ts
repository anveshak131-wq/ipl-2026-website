import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/data';
import { getFromKV, setInKV, KV_KEYS } from '@/lib/kv';
import { Team } from '@/types';

/**
 * GET /api/teams
 * Fetch all IPL teams from KV storage
 */
export async function GET(_request: NextRequest) {
  try {
    // Try to get from KV first
    const cachedTeams = await getFromKV<Team[]>(KV_KEYS.TEAMS);
    if (cachedTeams && cachedTeams.length > 0) {
      return NextResponse.json(cachedTeams);
    }

    // Fallback to mock data
    const teams = await api.getTeams();
    
    // Store in KV for future requests
    await setInKV(KV_KEYS.TEAMS, teams);
    
    return NextResponse.json(teams);
  } catch (error) {
    console.error('Failed to fetch teams:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teams
 * Create a new team (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const teamData = await request.json();
    
    // Validate team data
    if (!teamData.name || !teamData.shortName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get existing teams
    const existingTeams = await getFromKV<Team[]>(KV_KEYS.TEAMS) || 
                         await api.getTeams();
    
    // Create new team
    const newTeam: Team = {
      ...teamData,
      id: Date.now().toString(),
      players: []
    };

    // Add to list
    const updatedTeams = [...existingTeams, newTeam];
    
    // Store in KV
    await setInKV(KV_KEYS.TEAMS, updatedTeams);
    
    return NextResponse.json({
      message: 'Team created successfully',
      team: newTeam
    });
  } catch (error) {
    console.error('Failed to create team:', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teams
 * Update team information (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const { id, ...teamData } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Get existing teams
    const existingTeams = await getFromKV<Team[]>(KV_KEYS.TEAMS) || 
                         await api.getTeams();
    
    // Update team
    const updatedTeams = existingTeams.map(t =>
      t.id === id ? { ...t, ...teamData } : t
    );

    // Store in KV
    await setInKV(KV_KEYS.TEAMS, updatedTeams);
    
    return NextResponse.json({
      message: 'Team updated successfully',
      team: { id, ...teamData }
    });
  } catch (error) {
    console.error('Failed to update team:', error);
    return NextResponse.json(
      { error: 'Failed to update team' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teams
 * Delete a team (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Get existing teams
    const existingTeams = await getFromKV<Team[]>(KV_KEYS.TEAMS) || 
                         await api.getTeams();
    
    // Remove team
    const updatedTeams = existingTeams.filter(t => t.id !== id);

    // Store in KV
    await setInKV(KV_KEYS.TEAMS, updatedTeams);
    
    return NextResponse.json({
      message: 'Team deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete team:', error);
    return NextResponse.json(
      { error: 'Failed to delete team' },
      { status: 500 }
    );
  }
}
