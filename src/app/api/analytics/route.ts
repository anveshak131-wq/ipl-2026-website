import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ success: true });
}

export async function GET() {
  return NextResponse.json({ views: 100, visitors: 50 });
}
