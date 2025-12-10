/**
 * Cloudflare Pages Function for stadium information enrichment
 * Uses AI APIs to fill in missing venue details
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const { searchParams } = new URL(request.url);
  const venueName = searchParams.get('venue');
  const city =ample = searchParams.get('city');

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (!venueName) {
    return new Response(
      JSON.stringify({ error: 'Venue name required' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const enrichedData = await enrichStadiumInfo(venueName, city, env);
    
    return new Response(JSON.stringify(enrichedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Stadium info enrichment error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to enrich stadium information' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

async function enrichStadiumInfo(venueName, city, env) {
  const baseInfo = {
    name: venueName,
    city: city || 'Unknown',
    pitchType: 'Red Soil', // Default assumption
    floodlights: true, // Most modern stadiums have floodlights
    dimensions: '64m x 64m' // Standard cricket field
  };

  // Try to get additional info from various sources
  const enrichedData = { ...baseInfo };

  // 1. Check against known stadium database
  const knownStadium = await checkKnownStadiums(venueName);
  if (knownStadium) {
    Object.assign(enrichedData, knownStadium);
  }

  // 2. Use Wikipedia API for basic information
  try {
    const wikiInfo = await getWikipediaInfo(venueName);
    if (wikiInfo) {
      Object.assign(enrichedData, wikiInfo);
    }
  } catch (error) {
    console.error('Wikipedia search failed:', error);
  }

  // 3. Use AI to estimate missing information (if OpenAI API key available)
  if (env.OPENAI_API_KEY && (!enrichedData.capacity || !enrichedData.established)) {
    try {
      const aiInfo = await getAIStadiumInfo(venueName, city, env.OPENAI_API_KEY);
      if (aiInfo) {
        Object.assign(enrichedData, aiInfo);
      }
    } catch (error) {
      console.error('AI enrichment failed:', error);
    }
  }

  return enrichedData;
}

async function checkKnownStadiums(venueName) {
  const knownStadiums = {
    'wankhede': {
      capacity: 33000,
      established: 1974,
      pitchType: 'Red Soil',
      dimensions: '64m x 64m',
      floodlights: true,
      timezone: 'Asia/Kolkata'
    },
    'chinnaswamy': {
      capacity: 38000,
      established: 1969,
      pitchType: 'Red Soil',
      dimensions: '64m x 64m',
      floodlights: true,
      timezone: 'Asia/Kolkata'
    },
    'eden gardens': {
      capacity: 66000,
      established: 1864,
      pitchType: 'Red Soil',
      dimensions: '66m x 66m',
      floodlights: true,
      timezone: 'Asia/Kolkata'
    },
    'chepauk': {
      capacity: 50000,
      established: 1916,
      pitchType: 'Black Soil',
      dimensions: '66m x 66m',
      floodlights: true,
      timezone: 'Asia/Kolkata'
    },
    'arun jaitley': {
      capacity: 55000,
      established: 1883,
      pitchType: 'Red Soil',
      dimensions: '64m x 64m',
      floodlights: true,
      timezone: 'Asia/Kolkata'
    },
    'narendra modi': {
      capacity: 132000,
      established: 1982,
      pitchType: 'Red Soil',
      dimensions: '64m x 64m',
      floodlights: true,
      timezone: 'Asia/Kolkata'
    },
    'm chinnaswamy': {
      capacity: 38000,
      established: 1969,
      pitchType: 'Red Soil',
      dimensions: '64m x 64m',
      floodlights: true,
      timezone: 'Asia/Kolkata'
    },
    'm a chidambaram': {
      capacity: 50000,
      established: 1916,
      pitchType: 'Black Soil',
      dimensions: '66m x 66m',
      floodlights: true,
      timezone: 'Asia/Kolkata'
    }
  };

  const key = venueName.toLowerCase();
  for (const [stadiumKey, info] of Object.entries(knownStadiums)) {
    if (key.includes(stadiumKey) || stadiumKey.includes(key)) {
      return info;
    }
  }

  return null;
}

async function getWikipediaInfo(venueName) {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(venueName)}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    
    // Extract capacity and established year from description
    const description = data.extract || '';
    const capacityMatch = description.match(/capacity[:\s]*(\d+[,\d]*)/i);
    const yearMatch = description.match(/(?:built|established|opened)[:\s]*(\d{4})/i);
    
    const info = {};
    if (capacityMatch) {
      info.capacity = parseInt(capacityMatch[1].replace(',', ''));
    }
    if (yearMatch) {
      info.established = parseInt(yearMatch[1]);
    }
    
    return Object.keys(info).length > 0 ? info : null;
  } catch (error) {
    return null;
  }
}

async function getAIStadiumInfo(venueName, city, apiKey) {
  const prompt = `
    Provide information about the cricket stadium "${venueName}" in ${city || 'unknown city'}.
    Return ONLY a JSON object with these fields if known:
    - capacity: number (seating capacity)
    - established: number (year built/established)
    - pitchType: string (e.g., "Red Soil", "Black Soil", "Green Pitch")
    - dimensions: string (e.g., "64m x 64m")
    - floodlights: boolean
    
    If information is not available, use reasonable defaults for Indian cricket stadiums.
    Return valid JSON only, no explanations.
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.3
    })
  });

  if (!response.ok) return null;
  
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) return null;
  
  try {
    return JSON.parse(content);
  } catch (error) {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[^}]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  }
}
