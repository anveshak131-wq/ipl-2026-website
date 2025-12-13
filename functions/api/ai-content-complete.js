export const onRequest = async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const action = searchParams.get('action') || 'generate';

    switch (action) {
      case 'generate':
        return await generateContent(request, corsHeaders);
      case 'analyze':
        return await analyzeContent(request, corsHeaders);
      case 'suggest-tags':
        return await suggestTags(request, corsHeaders);
      case 'trending-topics':
        return await getTrendingTopics(request, corsHeaders);
      case 'seo-optimize':
        return await optimizeSEO(request, corsHeaders);
      case 'fact-check':
        return await factCheckContent(request, corsHeaders);
      default:
        return await generateContent(request, corsHeaders);
    }
  } catch (error) {
    console.error('AI Content API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process AI request' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Generate AI content
async function generateContent(request, corsHeaders) {
  try {
    const body = await request.json();
    const { prompt, category, tone = 'engaging', length = 'medium' } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Simulate AI content generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    const generatedContent = generateStoryContent(prompt, category, tone, length);
    
    return new Response(JSON.stringify({
      success: true,
      content: generatedContent,
      metadata: {
        wordCount: generatedContent.content.split(' ').length,
        readingTime: Math.ceil(generatedContent.content.split(' ').length / 200),
        aiGenerated: true,
        confidence: 87 + Math.random() * 10,
        generatedAt: new Date().toISOString()
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate content' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Analyze content with AI
async function analyzeContent(request, corsHeaders) {
  try {
    const body = await request.json();
    const { content, title } = body;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required for analysis' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));

    const analysis = analyzeContentWithAI(content, title);
    
    return new Response(JSON.stringify({
      success: true,
      analysis,
      processedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to analyze content' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Suggest tags based on content
async function suggestTags(request, corsHeaders) {
  try {
    const body = await request.json();
    const { content, title, category } = body;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required for tag suggestions' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Simulate AI tag generation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const tags = generateTagsFromContent(content, title, category);
    
    return new Response(JSON.stringify({
      success: true,
      tags: tags.primary,
      secondaryTags: tags.secondary,
      confidence: 85 + Math.random() * 10,
      generatedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate tags' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Get trending topics
async function getTrendingTopics(request, corsHeaders) {
  try {
    // Simulate trending topics analysis
    await new Promise(resolve => setTimeout(resolve, 800));

    const topics = generateTrendingTopics();
    
    return new Response(JSON.stringify({
      success: true,
      topics,
      lastUpdated: new Date().toISOString(),
      source: 'AI Analysis'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch trending topics' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// SEO optimization
async function optimizeSEO(request, corsHeaders) {
  try {
    const body = await request.json();
    const { content, title, targetKeywords = [] } = body;

    if (!content || !title) {
      return new Response(
        JSON.stringify({ error: 'Content and title are required for SEO optimization' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Simulate SEO analysis
    await new Promise(resolve => setTimeout(resolve, 1200));

    const seoOptimization = generateSEORecommendations(content, title, targetKeywords);
    
    return new Response(JSON.stringify({
      success: true,
      seo: seoOptimization,
      optimizedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to optimize SEO' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Fact check content
async function factCheckContent(request, corsHeaders) {
  try {
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required for fact checking' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Simulate fact checking
    await new Promise(resolve => setTimeout(resolve, 2000));

    const factCheckResults = performFactCheck(content);
    
    return new Response(JSON.stringify({
      success: true,
      factCheck: factCheckResults,
      checkedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fact check content' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}
