import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/data';

// TODO: Add proper authentication and database integration
// TODO: Replace with Cloudflare Worker API calls

export async function GET(request: NextRequest) {
  try {
    const matches = await api.getMatches();
    return NextResponse.json(matches);
  } catch (error) {
    console.error('Failed to fetch matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const matchData = await request.json();
    
    // TODO: Validate match data
    // TODO: Save to database (Cloudflare D1)
    
    // For now, just return success
    return NextResponse.json({
      message: 'Match created successfully',
      match: { ...matchData, id: Date.now().toString() }
    });
  } catch (error) {
    console.error('Failed to create match:', error);
    return NextResponse.json(
      { error: 'Failed to create match' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...matchData } = await request.json();
    
    // TODO: Update match in database
    // TODO: Validate match data
    
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
    
    // TODO: Delete match from database
    
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
