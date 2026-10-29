export const dynamic = 'force-static';
export const revalidate = false;
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  let league = 'wpl';
  try {
    const url = new URL(req.url);
    league = (url.searchParams.get('league') || 'wpl').toLowerCase();
  } catch (e) {}
  return NextResponse.json([]);
}
