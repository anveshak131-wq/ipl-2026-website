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
    const isWpl = (league || '').toLowerCase() === 'wpl';
    const candidatePaths = isWpl
      ? [
          path.join(process.cwd(), 'functions', 'data', 'wpl-players.json'),
          path.join(process.cwd(), 'wpl-players.json'),
          path.join(process.cwd(), 'wpl-players-roster.json')
        ]
      : [
          path.join(process.cwd(), 'functions', 'data', 'comprehensive-players.json'),
          path.join(process.cwd(), 'comprehensive-players.json')
        ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    }
  } catch (err) {
    console.error('Error reading players file:', err);
  }
  return [];
}

function writePlayers(league: string, players: any[]) {
  try {
    const isWpl = (league || '').toLowerCase() === 'wpl';
    const targetPaths = isWpl
      ? [
          path.join(process.cwd(), 'functions', 'data', 'wpl-players.json'),
          path.join(process.cwd(), 'wpl-players.json'),
          path.join(process.cwd(), 'wpl-players-roster.json')
        ]
      : [
          path.join(process.cwd(), 'functions', 'data', 'comprehensive-players.json'),
          path.join(process.cwd(), 'comprehensive-players.json')
        ];

    for (const p of targetPaths) {
      try {
        fs.writeFileSync(p, JSON.stringify(players, null, 2), 'utf8');
      } catch (e) {
        // ignore missing directory or path
      }
    }

    if (isWpl) {
      const jsPath = path.join(process.cwd(), 'functions', 'data', 'wplPlayers.js');
      try {
        fs.writeFileSync(jsPath, `export const fallbackWplPlayers = ${JSON.stringify(players, null, 2)};\n`, 'utf8');
      } catch (e) {}
    } else {
      const jsPath = path.join(process.cwd(), 'functions', 'data', 'comprehensivePlayers.js');
      try {
        fs.writeFileSync(jsPath, `export const fallbackIplPlayers = ${JSON.stringify(players, null, 2)};\n`, 'utf8');
      } catch (e) {}
    }
  } catch (err) {
    console.error('Error writing players file:', err);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get('league') || 'ipl';
  const players = readPlayers(league);
  return NextResponse.json(players, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate'
    }
  });
}

export async function PUT(req: Request) {
  try {
    const incoming = await req.json();
    const targetLeague = (incoming.league || 'ipl').toLowerCase();
    const players = readPlayers(targetLeague);
    const id = String(incoming.id || Date.now());
    const incomingName = (incoming.name || '').trim().toLowerCase();

    const idx = players.findIndex((p: any) =>
      String(p.id) === id ||
      (incomingName && p.name && p.name.trim().toLowerCase() === incomingName)
    );

    if (idx >= 0) {
      const existing = players[idx];
      players[idx] = {
        ...existing,
        ...incoming,
        id: existing.id || id,
        careerStats: incoming.careerStats && (
          Object.keys(incoming.careerStats.batting || {}).length > 0 ||
          Object.keys(incoming.careerStats.bowling || {}).length > 0
        ) ? incoming.careerStats : (existing.careerStats || { batting: {}, bowling: {} }),
        stats: incoming.stats || existing.stats || {},
        cricbuzzUrl: incoming.cricbuzzUrl || existing.cricbuzzUrl || '',
        cricbuzzId: incoming.cricbuzzId || existing.cricbuzzId || '',
      };
    } else {
      players.push({
        ...incoming,
        id,
        careerStats: incoming.careerStats || { batting: {}, bowling: {} },
        stats: incoming.stats || {},
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
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'realign') {
      const targetLeague = (body.league || 'ipl').toLowerCase();
      const players = readPlayers(targetLeague);
      return NextResponse.json({ success: true, players });
    }
    // Forward standard player create to PUT handler
    const fakeReq = new Request(req.url, {
      method: 'PUT',
      headers: req.headers,
      body: JSON.stringify(body)
    });
    return PUT(fakeReq);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const targetLeague = (searchParams.get('league') || 'ipl').toLowerCase();
    const id = searchParams.get('id');
    const deleteAll = searchParams.get('deleteAll');

    let players = readPlayers(targetLeague);

    if (deleteAll === 'true') {
      players = [];
    } else if (id) {
      players = players.filter((p: any) => String(p.id) !== String(id));
    }

    writePlayers(targetLeague, players);
    return NextResponse.json({ success: true, count: players.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to delete player' }, { status: 500 });
  }
}
