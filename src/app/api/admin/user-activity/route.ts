import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/user-activity
 * Fetch user activity logs
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const _startDate = searchParams.get('startDate'); // Will be used in production for date filtering
    const _endDate = searchParams.get('endDate'); // Will be used in production for date filtering

    // In production, fetch from database
    // For now, return mock data
    const mockActivities = [
      {
        id: '1',
        userId: 'admin1',
        userName: 'Admin User',
        action: 'login',
        description: 'User logged in to admin panel',
        timestamp: new Date(),
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
        },
      },
    ];

    let filteredActivities = mockActivities;
    if (userId && userId !== 'all') {
      filteredActivities = filteredActivities.filter((a) => a.userId === userId);
    }

    return NextResponse.json({ activities: filteredActivities });
  } catch (error) {
    console.error('Error fetching user activities:', error);
    return NextResponse.json({ error: 'Failed to fetch user activities' }, { status: 500 });
  }
}

