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
let issues: Issue[] = [
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

export async function POST(
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

    // Increment votes
    issues[issueIndex] = {
      ...issues[issueIndex],
      votes: issues[issueIndex].votes + 1
    };

    return NextResponse.json({
      success: true,
      data: issues[issueIndex],
      message: 'Vote recorded successfully'
    });

  } catch (error) {
    console.error('Error voting on issue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record vote' },
      { status: 500 }
    );
  }
}
