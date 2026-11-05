import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = path.join(process.cwd(), '.next', 'wpl-matches-cache.json');

function readLocalWplMatches() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function writeLocalWplMatches(matches: any[]) {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(matches, null, 2), 'utf8');
  } catch (e) {}
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const league = (searchParams.get('league') || 'ipl').toLowerCase();
  if (league === 'wpl') {
    return NextResponse.json(readLocalWplMatches());
  }
  try {
    const fallback = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'functions/data/matches.json'), 'utf8'));
    return NextResponse.json(fallback);
  } catch (e) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const league = (searchParams.get('league') || body.league || 'wpl').toLowerCase();
    let list = readLocalWplMatches();

    if (body.action === 'bulk_replace' && Array.isArray(body.matches)) {
      list = body.matches;
      writeLocalWplMatches(list);
      return NextResponse.json({ success: true, matches: list });
    }

    const newMatch = {
      ...body,
      id: body.id || `${league}-2027-m${String(body.matchNumber || list.length + 1).padStart(2, '0')}-${Date.now()}`,
      league
    };
    list.push(newMatch);
    writeLocalWplMatches(list);
    return NextResponse.json({ success: true, match: newMatch, matches: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    let list = readLocalWplMatches();

    if (body.action === 'bulk_replace' && Array.isArray(body.matches)) {
      list = body.matches;
      writeLocalWplMatches(list);
      return NextResponse.json({ success: true, matches: list });
    }

    const idx = list.findIndex((m: any) => String(m.id) === String(body.id));
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...body };
    } else {
      list.push(body);
    }
    writeLocalWplMatches(list);
    return NextResponse.json({ success: true, match: body, matches: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';
    let list = readLocalWplMatches();

    if (clearAll) {
      list = [];
    } else if (id) {
      list = list.filter((m: any) => String(m.id) !== String(id));
    }
    writeLocalWplMatches(list);
    return NextResponse.json({ success: true, matches: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
