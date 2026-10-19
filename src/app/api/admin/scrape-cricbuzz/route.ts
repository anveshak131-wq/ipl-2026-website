import { NextResponse } from 'next/server';

function cleanText(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function normalizeMetricKey(rawMetric: string, isBowling: boolean): string | null {
  const m = rawMetric.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!isBowling) {
    if (m.startsWith('match')) return 'M';
    if (m.startsWith('inn')) return 'Inn';
    if (m.startsWith('notout') || m === 'no') return 'NO';
    if (m.startsWith('run')) return 'Runs';
    if (m.startsWith('high') || m === 'hs') return 'HS';
    if (m.startsWith('avg') || m.startsWith('aver')) return 'Avg';
    if (m.startsWith('ball') || m === 'bf') return 'BF';
    if (m.startsWith('strike') || m === 'sr') return 'SR';
    if (m === '100' || m === '100s' || m === 'hundreds') return '100';
    if (m === '200' || m === '200s') return '200';
    if (m === '50' || m === '50s' || m === 'fifties') return '50';
    if (m === '4s' || m === 'fours') return '4s';
    if (m === '6s' || m === 'sixes') return '6s';
  } else {
    if (m.startsWith('match')) return 'M';
    if (m.startsWith('inn')) return 'Inn';
    if (m.startsWith('ball') || m === 'b') return 'B';
    if (m.startsWith('run')) return 'Runs';
    if (m.startsWith('wicket') || m === 'wkts') return 'Wkts';
    if (m.includes('bbi') || m === 'bestbowling') return 'BBI';
    if (m.includes('bbm')) return 'BBM';
    if (m.startsWith('econ')) return 'Econ';
    if (m.startsWith('avg') || m.startsWith('aver')) return 'Avg';
    if (m.startsWith('strike') || m === 'sr') return 'SR';
    if (m === '5w' || m.includes('five')) return '5W';
    if (m === '10w' || m.includes('ten')) return '10W';
  }

  return null;
}

function parseTableChunk(chunk: string, isBowling: boolean, targetResult: any) {
  let matchedRows = 0;

  // Extract table headers (formats)
  const theadMatch = chunk.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
  if (!theadMatch) return 0;

  const thMatches = theadMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
  const headerFormats: string[] = [];

  for (const th of thMatches) {
    const txt = cleanText(th);
    if (!txt) continue;
    const l = txt.toLowerCase();
    if (l === 'test') headerFormats.push('Test');
    else if (l === 'odi') headerFormats.push('ODI');
    else if (l === 't20' || l === 't20i') headerFormats.push('T20I');
    else if (l === 'ipl') headerFormats.push('IPL');
  }

  if (headerFormats.length === 0) return 0;

  // Extract table rows (metrics)
  const tbodyMatch = chunk.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  if (!tbodyMatch) return 0;

  const trMatches = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];

  for (const tr of trMatches) {
    const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    if (tdMatches.length < headerFormats.length + 1) continue;

    const rawMetric = cleanText(tdMatches[0]);
    const metricKey = normalizeMetricKey(rawMetric, isBowling);
    if (!metricKey) continue;

    // Map each column value to its corresponding format
    headerFormats.forEach((fmt, idx) => {
      const cellVal = cleanText(tdMatches[idx + 1] || '0');
      targetResult[fmt][metricKey] = cellVal;
    });

    matchedRows++;
  }

  return matchedRows;
}

function parseCricbuzzCareer(html: string) {
  const result: any = {
    batting: { Test: {}, ODI: {}, T20I: {}, IPL: {} },
    bowling: { Test: {}, ODI: {}, T20I: {}, IPL: {} },
  };

  const lower = html.toLowerCase();
  const batIdx = lower.indexOf('batting career summary');
  const bowlIdx = lower.indexOf('bowling career summary');

  let matchedRows = 0;

  if (batIdx !== -1) {
    const batChunk = bowlIdx > batIdx ? html.slice(batIdx, bowlIdx) : html.slice(batIdx, batIdx + 8000);
    matchedRows += parseTableChunk(batChunk, false, result.batting);
  }

  if (bowlIdx !== -1) {
    const bowlChunk = html.slice(bowlIdx, bowlIdx + 8000);
    matchedRows += parseTableChunk(bowlChunk, true, result.bowling);
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
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
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
        { success: false, error: 'Could not detect Career Summary tables on this Cricbuzz page. Check URL format.' },
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
          ? 'Cricbuzz connection timed out after 9 seconds. Existing data was not modified.'
          : (error.message || 'Scraper encountered an internal error.'),
      },
      { status: 500 }
    );
  }
}
