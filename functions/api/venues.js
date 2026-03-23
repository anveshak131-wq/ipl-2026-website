/**
 * Cloudflare Pages Function for venues API
 * Handles GET, POST, PUT, DELETE operations for venues/stadiums
 */

export const onRequest = async (context) => {
  const { request, env } = context;
  const { pathname, searchParams } = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Helper function to verify admin token
    const verifyAdminToken = async (request) => {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
      }
      
      const token = authHeader.replace('Bearer ', '');
      const tokenValue = await env.SPORTS_KV.get(`token:${token}`);
      if (!tokenValue) return false;
      
      // Parse token value (JSON or plain email)
      let email = tokenValue;
      if (tokenValue.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(tokenValue);
          if (parsed && typeof parsed.email === 'string') {
            email = parsed.email;
          }
        } catch {
          // fall back to using tokenValue directly
        }
      }
      
      const userData = await env.SPORTS_KV.get(`user:${email}`);
      if (!userData) return false;
      
      const user = JSON.parse(userData);
      return user.role === 'admin' || user.role === 'super_admin';
    };

    // GET all venues
    if (method === 'GET') {
      const venuesList = await env.SPORTS_KV.get('venues:list');
      const venues = venuesList ? JSON.parse(venuesList) : getDefaultVenues();
      
      return new Response(JSON.stringify({ venues }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Admin-only operations below
    const isAdmin = await verifyAdminToken(request);
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // POST - Create new venue
    if (method === 'POST') {
      const body = await request.json();
      const venuesList = await env.SPORTS_KV.get('venues:list');
      const venues = venuesList ? JSON.parse(venuesList) : getDefaultVenues();
      
      const newVenue = {
        id: Date.now().toString(),
        ...body,
        createdAt: new Date().toISOString()
      };
      
      venues.push(newVenue);
      await env.SPORTS_KV.put('venues:list', JSON.stringify(venues));
      
      return new Response(JSON.stringify({ venue: newVenue }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // PUT - Update venue
    if (method === 'PUT') {
      const body = await request.json();
      const { id, ...updateData } = body;
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Venue ID required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      const venuesList = await env.SPORTS_KV.get('venues:list');
      const venues = venuesList ? JSON.parse(venuesList) : getDefaultVenues();
      
      const venueIndex = venues.findIndex(v => v.id === id);
      if (venueIndex === -1) {
        return new Response(
          JSON.stringify({ error: 'Venue not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      venues[venueIndex] = { ...venues[venueIndex], ...updateData, updatedAt: new Date().toISOString() };
      await env.SPORTS_KV.put('venues:list', JSON.stringify(venues));
      
      return new Response(JSON.stringify({ venue: venues[venueIndex] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // DELETE - Delete venue
    if (method === 'DELETE') {
      const { id } = await request.json();
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Venue ID required' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      const venuesList = await env.SPORTS_KV.get('venues:list');
      const venues = venuesList ? JSON.parse(venuesList) : getDefaultVenues();
      
      const filteredVenues = venues.filter(v => v.id !== id);
      if (filteredVenues.length === venues.length) {
        return new Response(
          JSON.stringify({ error: 'Venue not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      await env.SPORTS_KV.put('venues:list', JSON.stringify(filteredVenues));
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Venues API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

// Default venues with coordinates for weather API - matching your existing structure
function getDefaultVenues() {
  return [
    {
      id: '1',
      name: 'M. Chinnaswamy Stadium',
      city: 'Bengaluru',
      lat: 12.9,
      lng: 77.6,
      capacity: 38000,
      pitchType: 'Red Soil',
      floodlights: true,
      dimensions: '64m x 64m',
      established: 1969
    },
    {
      id: '5',
      name: 'Wankhede Stadium',
      city: 'Mumbai',
      lat: 19.0,
      lng: 72.85,
      capacity: 33000,
      pitchType: 'Clay Soil',
      floodlights: true,
      dimensions: 'N/A',
      established: 1974
    },
    {
      id: '6',
      name: 'Narendra Modi Stadium',
      city: 'Ahmedabad',
      lat: 23.0225,
      lng: 72.5714,
      capacity: 132000,
      pitchType: 'Mixed Soil',
      floodlights: true,
      dimensions: 'N/A',
      established: 1982
    },
    {
      id: '7',
      name: 'Arun Jaitley Stadium',
      city: 'Delhi',
      lat: 28.6369,
      lng: 77.2447,
      capacity: 41000,
      pitchType: 'Black Soil',
      floodlights: true,
      dimensions: 'N/A',
      established: 1883
    },
    {
      id: '8',
      name: 'Sawai Mansingh Stadium',
      city: 'Jaipur',
      lat: 26.9236,
      lng: 75.8235,
      capacity: 30000,
      pitchType: 'Clay and Red Soil',
      floodlights: true,
      dimensions: 'N/A',
      established: 1869
    },
    {
      id: '9',
      name: 'Rajiv Gandhi International Stadium',
      city: 'Hyderabad',
      lat: 17.385,
      lng: 78.4867,
      capacity: 55000,
      pitchType: 'Black Soil',
      floodlights: true,
      dimensions: 'N/A',
      established: 2003
    },
    {
      id: '10',
      name: 'Punjab Cricket Association Stadium',
      city: 'Mohali',
      lat: 30.6967,
      lng: 76.7394,
      capacity: 26950,
      pitchType: 'Clay and Red Soil',
      floodlights: true,
      dimensions: 'N/A',
      established: 1993
    },
    {
      id: '11',
      name: 'Maharaja Yadavindra Singh International Cricket Stadium',
      city: 'Mullanpur',
      lat: 30.7173,
      lng: 76.5806,
      capacity: 40000,
      pitchType: 'Clay and Red Soil',
      floodlights: true,
      dimensions: 'N/A',
      established: 2022
    },
    {
      id: '12',
      name: 'Himachal Pradesh Cricket Association Stadium',
      city: 'Dharamsala',
      lat: 32.2401,
      lng: 76.3294,
      capacity: 23000,
      pitchType: 'Black Soil',
      floodlights: true,
      dimensions: 'N/A',
      established: 2005
    },
    {
      id: '4',
      name: 'Shaheed Veer Narayan Singh International Cricket Stadium',
      city: 'New Raipur',
      lat: 21.1614,
      lng: 81.7873,
      capacity: 65000,
      pitchType: 'Clay and Red Soil',
      floodlights: true,
      dimensions: 'N/A',
      established: 2008
    },
    {
      id: '2',
      name: 'M. A. Chidambaram Stadium',
      city: 'Chennai',
      lat: 13.1,
      lng: 80.3,
      capacity: 50000,
      pitchType: 'Black Soil',
      floodlights: true,
      dimensions: '66m x 66m',
      established: 1916
    },
    {
      id: '3',
      name: 'Eden Gardens',
      city: 'Kolkata',
      lat: 22.6,
      lng: 88.4,
      capacity: 66000,
      pitchType: 'Red Soil',
      floodlights: true,
      dimensions: '66m x 66m',
      established: 1864
    }
  ];
}
