import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/lib/data';
import { getFromKV, setInKV, KV_KEYS } from '@/lib/kv';
import { News } from '@/types';

/**
 * GET /api/news
 * Fetch all news articles from KV storage
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    
    // Try to get from KV first
    const cachedNews = await getFromKV<News[]>(KV_KEYS.NEWS);
    let news = cachedNews || await api.getNews();
    
    // Filter by category if provided
    if (category) {
      news = news.filter(n => n.category === category);
    }
    
    // Store in KV if not already cached
    if (!cachedNews) {
      await setInKV(KV_KEYS.NEWS, news);
    }
    
    return NextResponse.json(news);
  } catch (error) {
    console.error('Failed to fetch news:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/news
 * Create new news article (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const newsData = await request.json();
    
    // Validate news data
    if (!newsData.title || !newsData.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get existing news
    const existingNews = await getFromKV<News[]>(KV_KEYS.NEWS) || 
                        await api.getNews();
    
    // Create new news article
    const newNews: News = {
      ...newsData,
      id: Date.now().toString(),
      publishedAt: new Date().toISOString()
    };

    // Add to list
    const updatedNews = [...existingNews, newNews];
    
    // Store in KV
    await setInKV(KV_KEYS.NEWS, updatedNews);
    
    return NextResponse.json({
      message: 'News article created successfully',
      news: newNews
    });
  } catch (error) {
    console.error('Failed to create news:', error);
    return NextResponse.json(
      { error: 'Failed to create news' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/news
 * Update news article (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const { id, ...newsData } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'News ID is required' },
        { status: 400 }
      );
    }

    // Get existing news
    const existingNews = await getFromKV<News[]>(KV_KEYS.NEWS) || 
                        await api.getNews();
    
    // Update news
    const updatedNews = existingNews.map(n =>
      n.id === id ? { ...n, ...newsData } : n
    );

    // Store in KV
    await setInKV(KV_KEYS.NEWS, updatedNews);
    
    return NextResponse.json({
      message: 'News article updated successfully',
      news: { id, ...newsData }
    });
  } catch (error) {
    console.error('Failed to update news:', error);
    return NextResponse.json(
      { error: 'Failed to update news' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/news
 * Delete news article (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'News ID is required' },
        { status: 400 }
      );
    }

    // Get existing news
    const existingNews = await getFromKV<News[]>(KV_KEYS.NEWS) || 
                        await api.getNews();
    
    // Remove news
    const updatedNews = existingNews.filter(n => n.id !== id);

    // Store in KV
    await setInKV(KV_KEYS.NEWS, updatedNews);
    
    return NextResponse.json({
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete news:', error);
    return NextResponse.json(
      { error: 'Failed to delete news' },
      { status: 500 }
    );
  }
}
