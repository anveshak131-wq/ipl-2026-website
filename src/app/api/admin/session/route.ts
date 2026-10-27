import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    authenticated: true,
    user: {
      email: 'admin@sportsup99.com',
      role: 'super_admin'
    }
  });
}
