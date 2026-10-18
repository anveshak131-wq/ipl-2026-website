import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOCAL_DATA_FILE = path.join(process.cwd(), '.next', 'local-players-cache.json');

function readLocalPlayers(): any[] {
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function writeLocalPlayers(players: any[]) {
  try {
    const dir = path.dirname(LOCAL_DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(players, null, 2), 'utf8');
  } catch (e) {}
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const league = searchParams.get('league') || 'ipl';
  
  let players = readLocalPlayers();
  if (players.length > 0) {
    const filtered = players.filter(p => (p.league || 'ipl').toLowerCase() === league.toLowerCase());
    return NextResponse.json(filtered);
  }

  return NextResponse.json([]);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const id = String(body.id || '');
  let players = readLocalPlayers();

  const idx = players.findIndex(p => String(p.id) === id);
  if (idx >= 0) {
    players[idx] = { ...players[idx], ...body };
  } else {
    players.push({ ...body, id: id || String(Date.now()) });
  }

  writeLocalPlayers(players);
  return NextResponse.json({ success: true, player: body });
}

export async function POST(req: NextRequest) {
  return PUT(req);
}
