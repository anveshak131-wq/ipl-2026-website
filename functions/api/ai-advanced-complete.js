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
    const action = searchParams.get('action') || 'generate-content';

    switch (action) {
      case 'generate-content':
        return await generateAdvancedContent(request, corsHeaders);
      case 'analyze-story':
        return await analyzeStory(request, corsHeaders);
      case 'batch-analysis':
        return await batchAnalysis(request, corsHeaders);
      case 'seo-optimization':
        return await optimizeSEO(request, corsHeaders);
      case 'trending-topics':
        return await getTrendingTopics(request, corsHeaders);
      case 'content-sources':
        return await getContentSources(request, corsHeaders);
      case 'sync-sources':
        return await syncContentSources(request, corsHeaders);
      case 'moderation':
        return await moderateContent(request, corsHeaders);
      case 'fact-check':
        return await factCheckContent(request, corsHeaders);
      case 'plagiarism-check':
        return await checkPlagiarism(request, corsHeaders);
      case 'performance-analytics':
        return await getPerformanceAnalytics(request, corsHeaders);
      default:
        return await generateAdvancedContent(request, corsHeaders);
    }
  } catch (error) {
    console.error('Advanced AI API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process advanced AI request' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Generate advanced AI content
async function generateAdvancedContent(request, corsHeaders) {
  try {
    const body = await request.json();
    const { prompt, category, tone, length, targetAudience, keywords, includeImages, includeVideos } = body;

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Simulate advanced AI content generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    const generatedContent = generateAdvancedStoryContent(prompt, category, tone, length, targetAudience, keywords);
    
    return new Response(JSON.stringify({
      success: true,
      content: generatedContent,
      metadata: {
        wordCount: generatedContent.content.split(' ').length,
        readingTime: Math.ceil(generatedContent.content.split(' ').length / 200),
        aiGenerated: true,
        confidence: 92 + Math.random() * 6,
        generatedAt: new Date().toISOString(),
        model: 'GPT-4 Advanced',
        tokens: Math.floor(generatedContent.content.split(' ').length * 1.3)
      },
      assets: {
        images: includeImages ? generateImageSuggestions(prompt, category) : [],
        videos: includeVideos ? generateVideoSuggestions(prompt, category) : [],
        relatedTopics: generateRelatedTopics(prompt, category)
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to generate advanced content' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Analyze individual story with advanced AI
async function analyzeStory(request, corsHeaders) {
  try {
    const body = await request.json();
    const { content, title, category, author } = body;

    if (!content) {
      return new Response(
        JSON.stringify({ error: 'Content is required for analysis' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Simulate advanced AI analysis
    await new Promise(resolve => setTimeout(resolve, 2500));

    const analysis = performAdvancedStoryAnalysis(content, title, category, author);
    
    return new Response(JSON.stringify({
      success: true,
      analysis,
      processedAt: new Date().toISOString(),
      model: 'Advanced AI Analysis v2.0'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to analyze story' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Get trending topics with AI analysis
async function getTrendingTopics(request, corsHeaders) {
  try {
    // Simulate trending topics analysis
    await new Promise(resolve => setTimeout(resolve, 1000));

    const topics = generateAdvancedTrendingTopics();
    
    return new Response(JSON.stringify({
      success: true,
      topics,
      lastUpdated: new Date().toISOString(),
      source: 'AI Trend Analysis Engine v3.0',
      nextUpdate: new Date(Date.now() + 60 * 60 * 1000).toISOString()
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

// Performance analytics
async function getPerformanceAnalytics(request, corsHeaders) {
  try {
    // Simulate performance analytics
    await new Promise(resolve => setTimeout(resolve, 1500));

    const analytics = generatePerformanceAnalytics();
    
    return new Response(JSON.stringify({
      success: true,
      analytics,
      generatedAt: new Date().toISOString(),
      dataRange: 'Last 30 days'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch performance analytics' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Helper functions for advanced AI processing
function generateAdvancedStoryContent(prompt, category, tone, length, targetAudience, keywords) {
  const templates = {
    'match-experience': generateMatchExperienceContent(prompt, tone, length),
    'player-fan': generatePlayerFanContent(prompt, tone, length),
    'venue-memory': generateVenueMemoryContent(prompt, tone, length),
    'cricket-journey': generateCricketJourneyContent(prompt, tone, length),
    'emotional-moment': generateEmotionalMomentContent(prompt, tone, length)
  };

  const baseContent = templates[category] || templates['match-experience'];
  
  return {
    title: `AI Generated: ${prompt}`,
    content: baseContent,
    excerpt: `AI-generated ${category} content about ${prompt}`,
    category: category,
    tags: generateTagsFromPrompt(prompt, category, keywords),
    readingTime: Math.ceil(baseContent.split(' ').length / 200),
    aiEnhanced: true,
    tone: tone,
    targetAudience: targetAudience
  };
}

function generateMatchExperienceContent(prompt, tone, length) {
  const toneAdjustments = {
    'professional': 'From a professional perspective, the match experience at',
    'casual': 'Let me tell you about my awesome time at',
    'enthusiastic': 'OMG! The match at was absolutely incredible! ',
    'analytical': 'Analyzing the match experience at reveals several key insights:'
  };

  const lengthAdjustments = {
    'short': 'It was a great match with exciting moments.',
    'medium': `${toneAdjustments[tone]} ${prompt}. The atmosphere was electric with fans cheering throughout. Key moments included brilliant batting displays and strategic bowling changes. The venue management was excellent, and the overall experience was memorable.`,
    'long': `${toneAdjustments[tone]} ${prompt}. 

The day began with anticipation building as fans gathered outside the stadium. The energy was palpable, with supporters from both teams creating a vibrant atmosphere. Once inside, the scale of the venue was impressive - modern facilities combined with traditional cricket elements.

The match itself delivered on every promise. The batting display showcased technical excellence, while the bowling strategies demonstrated tactical brilliance. Fielding was sharp, with several moments of athleticism that brought the crowd to their feet.

What made this experience special was the combination of sporting excellence and fan engagement. The stadium organizers had thought of everything - from comfortable seating to excellent food options and merchandise stands. The big screen ensured no one missed any action, while the commentary provided expert insights.

As the match reached its climax, the tension was incredible. Every run was cheered, every wicket celebrated or mourned depending on allegiance. The final moments will stay with me forever - the culmination of hours of sporting drama played out in front of thousands of passionate fans.

This wasn't just a cricket match; it was an event that brought people together, created memories, and reinforced why we love this sport so much.`
  };

  return lengthAdjustments[length] || lengthAdjustments['medium'];
}

function generatePlayerFanContent(prompt, tone, length) {
  const toneAdjustments = {
    'professional': 'As a cricket analyst, I can confidently say that',
    'casual': 'I\'ve been a fan of for years, and let me tell you why',
    'enthusiastic': ' is absolutely the best! Here\'s why I\'m their biggest fan!',
    'analytical': 'Analyzing the career and impact of reveals several key factors:'
  };

  return `${toneAdjustments[tone]} ${prompt} represents excellence in modern cricket. Their combination of skill, mental toughness, and consistency sets them apart from other players. Whether with bat or ball, they deliver performances that inspire fans and command respect from opponents. Their dedication to fitness and continuous improvement shows in every aspect of their game.`;
}

function generateVenueMemoryContent(prompt, tone, length) {
  return `The ${prompt} holds a special place in cricket history. This venue has witnessed countless memorable matches and legendary performances. The unique characteristics of the ground - from pitch conditions to crowd atmosphere - create an experience that players and fans cherish. Every visit to ${prompt} is special, knowing you're walking in the footsteps of cricket greats.`;
}

function generateCricketJourneyContent(prompt, tone, length) {
  return `My cricket journey with ${prompt} has been transformative. What started as casual interest evolved into a deep passion for the sport. Through matches, practices, and interactions with fellow fans, I've grown not just as a player but as a person. The lessons learned from cricket - teamwork, resilience, sportsmanship - extend far beyond the boundary ropes.`;
}

function generateEmotionalMomentContent(prompt, tone, length) {
  return `The moment ${prompt} happened, time seemed to stand still. In that instant, all the emotions of cricket - joy, tension, relief, excitement - converged into one powerful experience. It's these moments that make cricket special, creating memories that last a lifetime and stories that get passed down through generations of fans.`;
}

function generateTagsFromPrompt(prompt, category, keywords) {
  const baseTags = [prompt.toLowerCase(), category, 'cricket', 'ipl', 'ai-generated'];
  const additionalTags = keywords || [];
  return [...new Set([...baseTags, ...additionalTags])].slice(0, 8);
}

function generateImageSuggestions(prompt, category) {
  return [
    { url: `https://api.ai/images/${prompt}-hero.jpg`, description: `AI-generated hero image for ${prompt}` },
    { url: `https://api.ai/images/${category}-context.jpg`, description: `Context image for ${category}` }
  ];
}

function generateVideoSuggestions(prompt, category) {
  return [
    { url: `https://api.ai/videos/${prompt}-highlights.mp4`, description: `AI-generated highlights for ${prompt}` },
    { url: `https://api.ai/videos/${category}-analysis.mp4`, description: `Analysis video for ${category}` }
  ];
}

function generateRelatedTopics(prompt, category) {
  return [
    { topic: `${prompt} analysis`, relevance: 0.95 },
    { topic: `${category} trends`, relevance: 0.87 },
    { topic: 'IPL 2025', relevance: 0.82 }
  ];
}

function performAdvancedStoryAnalysis(content, title, category, author) {
  const wordCount = content.split(' ').length;
  const sentences = content.split('.').length;
  const avgWordsPerSentence = Math.round(wordCount / sentences);
  
  return {
    qualityScore: 7.5 + Math.random() * 2,
    readabilityScore: Math.max(5, Math.min(10, 10 - (avgWordsPerSentence - 15) * 0.1)),
    sentiment: Math.random() > 0.3 ? 'positive' : Math.random() > 0.5 ? 'neutral' : 'negative',
    emotionalImpact: 6 + Math.random() * 3,
    shareability: 6 + Math.random() * 3,
    trendingPotential: 5 + Math.random() * 4,
    suggestedTags: generateTagsFromPrompt(title, category, []),
    improvements: [
      'Add more specific examples and details',
      'Include quotes or personal anecdotes',
      'Consider adding statistical data to support claims',
      'Break up longer paragraphs for better readability'
    ],
    contentSummary: content.substring(0, 200) + '...',
    keyTopics: extractKeyTopics(content),
    plagiarismScore: Math.random() * 5,
    recommendation: wordCount > 100 ? 'approve' : 'review',
    confidence: 80 + Math.random() * 15,
    aiGenerated: false,
    contentGaps: ['Real examples', 'Expert quotes', 'Statistical evidence'],
    enhancementSuggestions: ['Add multimedia elements', 'Include interactive content', 'Optimize for SEO']
  };
}

function generateAdvancedTrendingTopics() {
  return [
    {
      id: '1',
      topic: 'IPL 2025 Auction',
      category: 'news',
      mentions: 25420,
      sentiment: 0.78,
      growth: 0.92,
      relatedTags: ['auction', 'teams', 'players', 'bidding', 'retention'],
      lastUpdated: new Date().toISOString(),
      predictedTrend: 0.85,
      viralPotential: 8.9,
      aiConfidence: 94
    },
    {
      id: '2',
      topic: 'MS Dhoni Retirement',
      category: 'player',
      mentions: 18950,
      sentiment: 0.65,
      growth: 0.78,
      relatedTags: ['dhoni', 'csk', 'retirement', 'legacy', 'captain'],
      lastUpdated: new Date().toISOString(),
      predictedTrend: 0.72,
      viralPotential: 8.2,
      aiConfidence: 89
    }
  ];
}

function generatePerformanceAnalytics() {
  return {
    overview: {
      totalStories: 1250,
      totalViews: 452000,
      avgEngagement: 8.7,
      aiGenerated: 145,
      userGenerated: 1105
    },
    trends: {
      dailyViews: [1200, 1450, 1680, 1890, 2100, 2450, 2800],
      engagementGrowth: 15.3,
      contentGrowth: 8.7
    },
    topPerforming: {
      categories: [
        { name: 'match-experience', percentage: 34, engagement: 9.2 },
        { name: 'player-fan', percentage: 28, engagement: 8.5 },
        { name: 'ai-generated', percentage: 22, engagement: 8.9 }
      ],
      stories: [
        { id: '1', title: 'CSK Final Experience', views: 15420, engagement: 9.2 },
        { id: '2', title: 'Dhoni Legacy', views: 12890, engagement: 8.8 }
      ]
    },
    aiMetrics: {
      avgQualityScore: 8.2,
      avgReadability: 8.7,
      plagiarismFree: 98.5,
      aiContentPerformance: 89.2
    }
  };
}

// Helper functions
function extractKeyTopics(content) {
  const words = content.toLowerCase().split(/\s+/);
  const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'was', 'are', 'were']);
  
  const wordFreq = {};
  words.forEach(word => {
    if (!commonWords.has(word) && word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  return Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}
