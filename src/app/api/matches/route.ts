import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const league = (searchParams.get('league') || 'wpl').toLowerCase();
  return NextResponse.json([]);
}
