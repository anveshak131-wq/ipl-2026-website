import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/audit
 * Fetch audit logs with filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    // const startDate = searchParams.get('startDate'); // Will be used in production for date filtering
    // const endDate = searchParams.get('endDate'); // Will be used in production for date filtering

    // In production, fetch from database
    // For now, return mock data
    const mockLogs = [
      {
        id: '1',
        userId: 'admin1',
        userName: 'Admin User',
        userEmail: 'admin@example.com',
        action: 'update',
        entityType: 'team',
        entityId: '1',
        entityName: 'Royal Challengers Bangalore',
        changes: [
          { field: 'name', oldValue: 'RCB', newValue: 'Royal Challengers Bangalore', type: 'string' },
        ],
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
      },
    ];

    // Filter mock data based on params
    let filteredLogs = mockLogs;
    if (entityType) {
      filteredLogs = filteredLogs.filter((log) => log.entityType === entityType);
    }
    if (entityId) {
      filteredLogs = filteredLogs.filter((log) => log.entityId === entityId);
    }
    if (action) {
      filteredLogs = filteredLogs.filter((log) => log.action === action);
    }
    if (userId) {
      filteredLogs = filteredLogs.filter((log) => log.userId === userId);
    }

    return NextResponse.json({ logs: filteredLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}

