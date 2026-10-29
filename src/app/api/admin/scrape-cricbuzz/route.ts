import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function clean(str: string): string {
  return str.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function parseSection(html: string, marker: string, isBowling: boolean) {
  const idx = html.toLowerCase().indexOf(marker);
  if (idx === -1) return { result: {}, rows: 0 };

  const tableStart = html.indexOf('<table', idx);
  const tableEnd = html.indexOf('</table>', tableStart);
  if (tableStart === -1 || tableEnd === -1) return { result: {}, rows: 0 };

  const tableHtml = html.slice(tableStart, tableEnd + 8);
  const ths = (tableHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || []).map(clean).filter(Boolean);

  const formats: string[] = [];
  for (const th of ths) {
    const raw = th.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (raw === 'test') formats.push('Test');
    else if (raw === 'odi') formats.push('ODI');
    else if (raw === 't20' || raw === 't20i') formats.push('T20I');
    else if (raw === 'wpl' || raw === 'wt20' || raw === 'wbbl') formats.push('WPL');
    else if (raw === 'ipl') formats.push('IPL');
  }

  const trs = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  const sectionResult: Record<string, Record<string, string>> = {
    Test: {},
    ODI: {},
    T20I: {},
    WPL: {},
    IPL: {}
  };
  let rows = 0;

  for (const tr of trs) {
    const tds = (tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map(clean);
    if (tds.length < formats.length + 1) continue;

    let metric = tds[0];
    const mNorm = metric.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (mNorm.startsWith('match') || mNorm === 'm') metric = 'M';
    else if (mNorm.startsWith('inn')) metric = 'Inn';
    else if (mNorm.startsWith('notout') || mNorm === 'no') metric = 'NO';
    else if (mNorm.startsWith('run')) metric = 'Runs';
    else if (mNorm.startsWith('high') || mNorm === 'hs') metric = 'HS';
    else if (mNorm.startsWith('avg')) metric = 'Avg';
    else if (mNorm.startsWith('ball') && !isBowling) metric = 'BF';
    else if (mNorm.startsWith('ball') && isBowling) metric = 'B';
    else if (mNorm.startsWith('sr')) metric = 'SR';
    else if (mNorm === '100' || mNorm === '100s') metric = '100';
    else if (mNorm === '200' || mNorm === '200s') metric = '200';
    else if (mNorm === '50' || mNorm === '50s') metric = '50';
    else if (mNorm === '4s') metric = '4s';
    else if (mNorm === '6s') metric = '6s';
    else if (mNorm.startsWith('wicket') || mNorm === 'wkts') metric = 'Wkts';
    else if (mNorm.startsWith('eco')) metric = 'Econ';
    else if (mNorm === 'bbi') metric = 'BBI';
    else if (mNorm === 'bbm') metric = 'BBM';
    else if (mNorm === '5w') metric = '5W';
    else if (mNorm === '10w') metric = '10W';

    formats.forEach((fmt, i) => {
      if (sectionResult[fmt]) {
        sectionResult[fmt][metric] = tds[i + 1] || '—';
      }
    });
    rows++;
  }

  return { result: sectionResult, rows };
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
    const bat = parseSection(html, 'batting career summary', false);
    const bowl = parseSection(html, 'bowling career summary', true);

    const data = {
      batting: bat.result,
      bowling: bowl.result
    };

    return NextResponse.json({
      success: true,
      data,
      result: data,
      batting: bat.result,
      bowling: bowl.result,
      sourceUrl: targetUrl,
      matchedRows: bat.rows + bowl.rows,
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
