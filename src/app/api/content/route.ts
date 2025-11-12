import { NextRequest, NextResponse } from 'next/server';
import { getFromKV, setInKV, KV_KEYS } from '@/lib/kv';
import { Content } from '@/types';

/**
 * GET /api/content
 * Fetch all content from KV storage
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // Try to get from KV first
    const cachedContent = await getFromKV<Content[]>(KV_KEYS.CONTENT);
    let content = cachedContent || [];
    
    // Filter by type if provided
    if (type) {
      content = content.filter(c => c.type === type);
    }
    
    return NextResponse.json(content);
  } catch (error) {
    console.error('Failed to fetch content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content
 * Create new content (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const contentData = await request.json();
    
    // Validate content data
    if (!contentData.title || !contentData.type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get existing content
    const existingContent = await getFromKV<Content[]>(KV_KEYS.CONTENT) || [];
    
    // Create new content
    const newContent: Content = {
      ...contentData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to list
    const updatedContent = [...existingContent, newContent];
    
    // Store in KV
    await setInKV(KV_KEYS.CONTENT, updatedContent);
    
    return NextResponse.json({
      message: 'Content created successfully',
      content: newContent
    });
  } catch (error) {
    console.error('Failed to create content:', error);
    return NextResponse.json(
      { error: 'Failed to create content' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/content
 * Update content (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const { id, ...contentData } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Get existing content
    const existingContent = await getFromKV<Content[]>(KV_KEYS.CONTENT) || [];
    
    // Update content
    const updatedContent = existingContent.map(c =>
      c.id === id ? { ...c, ...contentData, updatedAt: new Date().toISOString() } : c
    );

    // Store in KV
    await setInKV(KV_KEYS.CONTENT, updatedContent);
    
    return NextResponse.json({
      message: 'Content updated successfully',
      content: { id, ...contentData }
    });
  } catch (error) {
    console.error('Failed to update content:', error);
    return NextResponse.json(
      { error: 'Failed to update content' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content
 * Delete content (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Get existing content
    const existingContent = await getFromKV<Content[]>(KV_KEYS.CONTENT) || [];
    
    // Remove content
    const updatedContent = existingContent.filter(c => c.id !== id);

    // Store in KV
    await setInKV(KV_KEYS.CONTENT, updatedContent);
    
    return NextResponse.json({
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
