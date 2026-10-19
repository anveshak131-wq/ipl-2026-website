import { NextResponse } from 'next/server';

function parseCricbuzzCareer(html: string) {
  const result: any = {
    batting: { Test: {}, ODI: {}, T20I: {}, IPL: {} },
    bowling: { Test: {}, ODI: {}, T20I: {}, IPL: {} },
  };

  const battingCols = ['M', 'Inn', 'NO', 'Runs', 'HS', 'Avg', 'BF', 'SR', '100', '200', '50', '4s', '6s'];
  const bowlingCols = ['M', 'Inn', 'B', 'Runs', 'Wkts', 'BBI', 'BBM', 'Econ', 'Avg', 'SR', '5W', '10W'];
  const targetFormats = ['Test', 'ODI', 'T20I', 'IPL'];

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let match;
  let currentSection: 'batting' | 'bowling' = 'batting';
  let matchedRows = 0;

  while ((match = rowRegex.exec(html)) !== null) {
    const rowHtml = match[1];
    if (rowHtml.includes('Bowling Career Summary')) {
      currentSection = 'bowling';
      continue;
    }

    const cellRegex = /<td[^>]*>(?:<strong[^>]*>)?([\s\S]*?)(?:<\/strong>)?<\/td>/gi;
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim());
    }

    if (cells.length > 5) {
      const format = cells[0];
      const matchedFmt = targetFormats.find(
        (f) => f.toLowerCase() === format.toLowerCase() || (f === 'T20I' && format.toLowerCase() === 't20')
      );

      if (matchedFmt) {
        const cols = currentSection === 'batting' ? battingCols : bowlingCols;
        cells.slice(1).forEach((val, idx) => {
          if (cols[idx]) {
            result[currentSection][matchedFmt][cols[idx]] = val;
          }
        });
        matchedRows++;
      }
    }
  }

  return { result, matchedRows };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profileUrl, playerId, playerName } = body || {};

    let targetUrl = '';
    if (profileUrl && profileUrl.includes('cricbuzz.com/profiles/')) {
      targetUrl = profileUrl.trim();
    } else if (playerId && /^\d+$/.test(String(playerId).trim())) {
      const slug = (playerName || 'player').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      targetUrl = `https://www.cricbuzz.com/profiles/${String(playerId).trim()}/${slug}`;
    }

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid Cricbuzz profile URL (e.g. https://www.cricbuzz.com/profiles/1413/virat-kohli) or numeric Player ID.' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Cricbuzz returned HTTP ${res.status}: ${res.statusText}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const { result, matchedRows } = parseCricbuzzCareer(html);

    if (matchedRows === 0) {
      return NextResponse.json(
        { success: false, error: 'Could not detect Career Summary tables on this Cricbuzz page. Check the URL format.' },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      sourceUrl: targetUrl,
      matchedRows,
    });
  } catch (error: any) {
    const isTimeout = error.name === 'AbortError';
    return NextResponse.json(
      {
        success: false,
        error: isTimeout
          ? 'Cricbuzz connection timed out after 8 seconds. Existing data was not modified.'
          : (error.message || 'Scraper encountered an internal error.'),
      },
      { status: 500 }
    );
  }
}
