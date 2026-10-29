import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function cleanText(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function parseCricbuzzCareer(html: string) {
  const result: Record<string, Record<string, Record<string, string>>> = {
    batting: { Test: {}, ODI: {}, T20I: {}, WPL: {}, IPL: {} },
    bowling: { Test: {}, ODI: {}, T20I: {}, WPL: {}, IPL: {} },
  };

  const sections = [
    { type: 'batting', marker: 'batting career summary' },
    { type: 'bowling', marker: 'bowling career summary' }
  ];

  let matchedRows = 0;

  for (const sec of sections) {
    const idx = html.toLowerCase().indexOf(sec.marker);
    if (idx === -1) continue;

    const chunk = html.slice(idx, idx + 8000);
    const tableMatch = chunk.match(/<table[\s\S]*?<\/table>/i);
    if (!tableMatch) continue;

    const tableHtml = tableMatch[0];
    const theadMatch = tableHtml.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
    if (!theadMatch) continue;

    const ths = theadMatch[1].match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
    const formats: string[] = [];

    // Header formats mapping
    for (const th of ths) {
      const raw = cleanText(th).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (raw === 'test') formats.push('Test');
      else if (raw === 'odi') formats.push('ODI');
      else if (raw === 't20' || raw === 't20i') formats.push('T20I');
      else if (raw === 'wpl' || raw === 'wt20' || raw === 'wbbl') formats.push('WPL');
      else if (raw === 'ipl') formats.push('IPL');
      else formats.push(cleanText(th));
    }

    const tbodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) continue;

    const trs = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    for (const tr of trs) {
      const tds = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      const values = tds.map(cleanText);
      if (values.length < 2) continue;

      let metric = values[0];
      const mNorm = metric.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (mNorm.startsWith('match') || mNorm === 'm') metric = 'M';
      else if (mNorm.startsWith('inn')) metric = 'Inn';
      else if (mNorm.startsWith('notout') || mNorm === 'no') metric = 'NO';
      else if (mNorm.startsWith('run')) metric = 'Runs';
      else if (mNorm.startsWith('high') || mNorm === 'hs') metric = 'HS';
      else if (mNorm.startsWith('avg') || mNorm === 'average') metric = 'Avg';
      else if (mNorm.startsWith('ball') && sec.type === 'batting') metric = 'BF';
      else if (mNorm.startsWith('ball') && sec.type === 'bowling') metric = 'B';
      else if (mNorm.startsWith('sr') || mNorm.startsWith('strike')) metric = 'SR';
      else if (mNorm === '100' || mNorm === '100s') metric = '100s';
      else if (mNorm === '200' || mNorm === '200s') metric = '200s';
      else if (mNorm === '50' || mNorm === '50s') metric = '50s';
      else if (mNorm === '4s' || mNorm === 'fours') metric = '4s';
      else if (mNorm === '6s' || mNorm === 'sixes') metric = '6s';
      else if (mNorm.startsWith('wicket') || mNorm === 'wkts') metric = 'Wkts';
      else if (mNorm.startsWith('eco')) metric = 'Econ';
      else if (mNorm === 'bbi') metric = 'BBI';
      else if (mNorm === 'bbm') metric = 'BBM';
      else if (mNorm === '5w' || mNorm === '5wh') metric = '5W';
      else if (mNorm === '10w' || mNorm === '10wh') metric = '10W';

      // Assign column value to format
      const dataCols = values.slice(1);
      dataCols.forEach((val, i) => {
        const fmt = formats[i];
        if (fmt && result[sec.type][fmt]) {
          result[sec.type][fmt][metric] = val;
          matchedRows++;
        }
      });
    }
  }

  return { result, matchedRows };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, profileUrl, profileId, playerId } = body || {};

    let targetUrl = '';
    const rawUrl = url || profileUrl;
    const rawId = profileId || playerId;

    if (rawId && /^\d+$/.test(String(rawId).trim())) {
      targetUrl = `https://www.cricbuzz.com/profiles/${String(rawId).trim()}`;
    } else if (rawUrl && rawUrl.includes('cricbuzz.com/profiles/')) {
      targetUrl = rawUrl.trim();
    } else {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid Cricbuzz profile URL or ID.' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Cricbuzz returned status ${res.status}.` },
        { status: res.status }
      );
    }

    const html = await res.text();
    const { result, matchedRows } = parseCricbuzzCareer(html);

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
          ? 'Cricbuzz connection timed out after 9 seconds.'
          : (error.message || 'Scraper encountered an internal error.'),
      },
      { status: 500 }
    );
  }
}
