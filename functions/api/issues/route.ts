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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    const priority = searchParams.get('priority') || '';

    // Filter issues
    let filteredIssues = issues;

    if (status !== 'all') {
      filteredIssues = filteredIssues.filter(issue => issue.status === status);
    }

    if (search) {
      filteredIssues = filteredIssues.filter(issue => 
        issue.title.toLowerCase().includes(search.toLowerCase()) ||
        issue.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type) {
      filteredIssues = filteredIssues.filter(issue => issue.type === type);
    }

    if (priority) {
      filteredIssues = filteredIssues.filter(issue => issue.priority === priority);
    }

    // Sort by priority first, then by date
    filteredIssues.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json({
      success: true,
      data: filteredIssues,
      total: filteredIssues.length
    });

  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.type || !body.priority) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new issue
    const newIssue: Issue = {
      id: Date.now().toString(),
      type: body.type,
      title: body.title.trim(),
      description: body.description.trim(),
      priority: body.priority,
      status: 'open',
      userId: body.userId,
      userEmail: body.email,
      attachments: body.attachments || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      votes: 0
    };

    // Save issue (in production, this would save to database)
    issues.push(newIssue);

    // TODO: Send notification email to support team
    // TODO: Send confirmation email to user

    return NextResponse.json({
      success: true,
      data: newIssue,
      message: 'Issue submitted successfully'
    });

  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('id');
    
    if (!issueId) {
      return NextResponse.json(
        { success: false, error: 'Issue ID required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Find and update issue
    const issueIndex = issues.findIndex(issue => issue.id === issueId);
    
    if (issueIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Issue not found' },
        { status: 404 }
      );
    }

    // Update issue (only status and notes can be updated by non-creators)
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

export async function POST_VOTE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issueId = searchParams.get('id');
    
    if (!issueId) {
      return NextResponse.json(
        { success: false, error: 'Issue ID required' },
        { status: 400 }
      );
    }

    // Find and update issue votes
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
