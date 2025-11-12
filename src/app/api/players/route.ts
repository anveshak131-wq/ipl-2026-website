import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/data';
import { getFromKV, setInKV, KV_KEYS } from '@/lib/kv';
import { Player } from '@/types';

/**
 * GET /api/players
 * Fetch all players or filter by team from KV storage
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    
    // Try to get from KV first
    const cachedPlayers = await getFromKV<Player[]>(KV_KEYS.PLAYERS);
    let players = cachedPlayers || await api.getPlayers();
    
    // Filter by team if provided
    if (teamId) {
      players = players.filter(p => p.teamId === teamId);
    }
    
    // Store in KV if not already cached
    if (!cachedPlayers) {
      await setInKV(KV_KEYS.PLAYERS, players);
    }
    
    return NextResponse.json(players);
  } catch (error) {
    console.error('Failed to fetch players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/players
 * Create a new player (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const playerData = await request.json();
    
    // Validate player data
    if (!playerData.name || !playerData.teamId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get existing players
    const existingPlayers = await getFromKV<Player[]>(KV_KEYS.PLAYERS) || 
                           await api.getPlayers();
    
    // Create new player
    const newPlayer: Player = {
      ...playerData,
      id: Date.now().toString()
    };

    // Add to list
    const updatedPlayers = [...existingPlayers, newPlayer];
    
    // Store in KV
    await setInKV(KV_KEYS.PLAYERS, updatedPlayers);
    
    return NextResponse.json({
      message: 'Player created successfully',
      player: newPlayer
    });
  } catch (error) {
    console.error('Failed to create player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/players
 * Update player information (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const { id, ...playerData } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    // Get existing players
    const existingPlayers = await getFromKV<Player[]>(KV_KEYS.PLAYERS) || 
                           await api.getPlayers();
    
    // Update player
    const updatedPlayers = existingPlayers.map(p =>
      p.id === id ? { ...p, ...playerData } : p
    );

    // Store in KV
    await setInKV(KV_KEYS.PLAYERS, updatedPlayers);
    
    return NextResponse.json({
      message: 'Player updated successfully',
      player: { id, ...playerData }
    });
  } catch (error) {
    console.error('Failed to update player:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/players
 * Delete a player (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    // Get existing players
    const existingPlayers = await getFromKV<Player[]>(KV_KEYS.PLAYERS) || 
                           await api.getPlayers();
    
    // Remove player
    const updatedPlayers = existingPlayers.filter(p => p.id !== id);

    // Store in KV
    await setInKV(KV_KEYS.PLAYERS, updatedPlayers);
    
    return NextResponse.json({
      message: 'Player deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}
