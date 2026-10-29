export const dynamic = 'force-static';
export const revalidate = false;
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

function getFilePath(league: string) {
  const isWpl = (league || '').toLowerCase() === 'wpl';
  return path.join(
    process.cwd(),
    'functions',
    'data',
    isWpl ? 'wpl-players.json' : 'comprehensive-players.json'
  );
}

function readPlayers(league: string): any[] {
  try {
    const p = getFilePath(league);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading players file:', err);
  }
  return [];
}

function writePlayers(league: string, players: any[]) {
  try {
    const p = getFilePath(league);
    fs.writeFileSync(p, JSON.stringify(players, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing players file:', err);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get('league') || 'ipl';
  const players = readPlayers(league);
  return NextResponse.json(players);
}

export async function PUT(req: Request) {
  try {
    const incoming = await req.json();
    const targetLeague = (incoming.league || 'ipl').toLowerCase();
    const players = readPlayers(targetLeague);
    const id = String(incoming.id || Date.now());

    const idx = players.findIndex((p: any) => String(p.id) === id);

    if (idx >= 0) {
      const existing = players[idx];
      players[idx] = {
        ...existing,
        ...incoming,
        id,
        careerStats: incoming.careerStats || existing.careerStats || { batting: {}, bowling: {} },
        cricbuzzUrl: incoming.cricbuzzUrl || existing.cricbuzzUrl || '',
        cricbuzzId: incoming.cricbuzzId || existing.cricbuzzId || '',
      };
    } else {
      players.push({
        ...incoming,
        id,
        careerStats: incoming.careerStats || { batting: {}, bowling: {} },
        cricbuzzUrl: incoming.cricbuzzUrl || '',
        cricbuzzId: incoming.cricbuzzId || '',
      });
    }

    writePlayers(targetLeague, players);
    return NextResponse.json({ success: true, player: players[idx >= 0 ? idx : players.length - 1] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update player' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return PUT(req);
}
