import { NextRequest, NextResponse } from 'next/server';

// Types
interface Issue {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  userId?: string;
  userEmail?: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
  votes: number;
}

// Mock data storage (in production, this would be a database)
let issues: Issue[] = [];

// Initialize with some mock data
issues = [
  {
    id: '1',
    type: 'live_score',
    title: 'Live score not updating for RCB vs MI match',
    description: 'The live score has been stuck at 45/2 for 30 minutes',
    priority: 'high',
    status: 'in_progress',
    userEmail: 'user@example.com',
    attachments: [],
    createdAt: new Date(Date.now() - 3600000),
    updatedAt: new Date(Date.now() - 1800000),
    votes: 12
  },
  {
    id: '2',
    type: 'account_login',
    title: 'Unable to login with Google account',
    description: 'Getting authentication error when trying to login with Google',
    priority: 'medium',
    status: 'open',
    userEmail: 'user2@example.com',
    attachments: [],
    createdAt: new Date(Date.now() - 7200000),
    updatedAt: new Date(Date.now() - 7200000),
    votes: 8
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = params.id;
    
    // Find issue by ID
    const issue = issues.find(issue => issue.id === issueId);
    
    if (!issue) {
      return NextResponse.json(
        { success: false, error: 'Issue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: issue
    });

  } catch (error) {
    console.error('Error fetching issue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issue' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = params.id;
    const body = await request.json();
    
    // Find issue by ID
    const issueIndex = issues.findIndex(issue => issue.id === issueId);
    
    if (issueIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Issue not found' },
        { status: 404 }
      );
    }

    // Update issue (only status can be updated by non-creators)
    const updatedIssue = {
      ...issues[issueIndex],
      status: body.status || issues[issueIndex].status,
      updatedAt: new Date()
    };

    issues[issueIndex] = updatedIssue;

    // TODO: Send status update email to user
    // TODO: Log status change for audit trail

    return NextResponse.json({
      success: true,
      data: updatedIssue,
      message: 'Issue updated successfully'
    });

  } catch (error) {
    console.error('Error updating issue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const issueId = params.id;
    
    // Find issue by ID
    const issueIndex = issues.findIndex(issue => issue.id === issueId);
    
    if (issueIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Issue not found' },
        { status: 404 }
      );
    }

    // Remove issue
    const deletedIssue = issues[issueIndex];
    issues.splice(issueIndex, 1);

    // TODO: Send deletion confirmation email
    // TODO: Log deletion for audit trail

    return NextResponse.json({
      success: true,
      data: deletedIssue,
      message: 'Issue deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting issue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete issue' },
      { status: 500 }
    );
  }
}
