// Cloudflare Pages Function for generating iCal feed
// Returns an iCal (ICS) file with all matches

export async function onRequest(context) {
  const { request, env } = context;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get filters from query parameters
    const url = new URL(request.url);
    const teamFilter = url.searchParams.get('team');
    const statusFilter = url.searchParams.get('status');

    // Fetch matches from the matches API
    const baseUrl = new URL(request.url).origin;
    let matchesUrl = `${baseUrl}/api/matches`;
    
    // Apply filters if provided
    const params = new URLSearchParams();
    if (teamFilter) params.append('team', teamFilter);
    if (statusFilter) params.append('status', statusFilter);
    if (params.toString()) {
      matchesUrl += `?${params.toString()}`;
    }

    const matchesResponse = await fetch(matchesUrl);
    if (!matchesResponse.ok) {
      throw new Error('Failed to fetch matches');
    }

    const matchesData = await matchesResponse.json();
    const matches = Array.isArray(matchesData) ? matchesData : (matchesData.matches || []);

    // Generate iCal content
    const formatDate = (date) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeText = (text) => {
      if (!text) return '';
      return String(text)
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\n/g, '\\n');
    };

    let ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SportsUP99//IPL 2026 Matches//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:IPL 2026 Matches',
      'X-WR-CALDESC:Indian Premier League 2026 Match Schedule',
      'X-WR-TIMEZONE:Asia/Kolkata',
    ].join('\r\n');

    matches.forEach((match) => {
      if (!match.date || !match.time) return;

      try {
        const [hours, minutes] = match.time.split(':').map(Number);
        const startDate = new Date(match.date);
        startDate.setHours(hours || 0, minutes || 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 3); // 3 hour match duration

        const team1Name = match.team1?.shortName || match.team1?.name || 'Team 1';
        const team2Name = match.team2?.shortName || match.team2?.name || 'Team 2';
        const venue = match.venue || 'TBD';
        const matchTitle = `${team1Name} vs ${team2Name}`;
        const description = `IPL 2026 Match\\nVenue: ${venue}\\nStatus: ${match.status || 'upcoming'}`;

        ics += '\r\nBEGIN:VEVENT';
        ics += `\r\nUID:match-${match.id}-${Date.now()}@sportsup99.com`;
        ics += `\r\nDTSTAMP:${formatDate(new Date())}`;
        ics += `\r\nDTSTART:${formatDate(startDate)}`;
        ics += `\r\nDTEND:${formatDate(endDate)}`;
        ics += `\r\nSUMMARY:${escapeText(matchTitle)}`;
        ics += `\r\nDESCRIPTION:${escapeText(description)}`;
        ics += `\r\nLOCATION:${escapeText(venue)}`;
        ics += '\r\nSTATUS:CONFIRMED';
        ics += '\r\nSEQUENCE:0';
        ics += '\r\nEND:VEVENT';
      } catch (error) {
        console.error(`Error processing match ${match.id}:`, error);
      }
    });

    ics += '\r\nEND:VCALENDAR';

    return new Response(ics, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/calendar;charset=utf-8',
        'Content-Disposition': 'attachment; filename="ipl-2026-matches.ics"',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating iCal feed:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate calendar feed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

