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
