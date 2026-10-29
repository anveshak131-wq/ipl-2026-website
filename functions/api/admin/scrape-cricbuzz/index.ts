



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

async function searchCricbuzzId(query: string): Promise<string | null> {
  try {
    const cleanQ = query.replace(/-/g, ' ').replace(/[^a-zA-Z ]/g, '').trim();
    const searchUrl = `https://www.cricbuzz.com/api/search/results?q=${encodeURIComponent(cleanQ)}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      }
    });
    if (res.ok) {
      const data: any = await res.json();
      const list = data?.player || data?.results || [];
      if (Array.isArray(list) && list.length > 0 && list[0].id) {
        return String(list[0].id);
      }
    }
  } catch (e) {}
  return null;
}

export async function onRequestPost(context: any) {
  try {
    const body = await context.request.json();
    const { url, profileUrl, profileId, playerId, playerName } = body || {};

    let targetUrl = '';
    const rawUrl = url || profileUrl;
    let rawId = profileId || playerId;

    // Known curated aliases for marquee players to eliminate 404s
    const KNOWN_WPL_IDS: Record<string, string> = {
      'ellyse-perry': '8734',
      'ellyse perry': '8734',
      '9115': '8734', // Remap incorrect ID 9115 to canonical 8734
      'smriti-mandhana': '10012',
      'smriti mandhana': '10012',
      'harmanpreet-kaur': '9082',
      'harmanpreet kaur': '9082',
      'richa-ghosh': '14828',
      'meg-lanning': '8733',
      'shafali-verma': '14798',
      'jemimah-rodrigues': '12821',
      'beth-mooney': '8739',
      'ashleigh-gardner': '11690',
      'alyssa-healy': '8732',
      'deepti-sharma': '10013',
      'sophie-ecclestone': '11388'
    };

    if (rawId && KNOWN_WPL_IDS[String(rawId).trim()]) {
      rawId = KNOWN_WPL_IDS[String(rawId).trim()];
    }

    if (rawUrl) {
      for (const [key, id] of Object.entries(KNOWN_WPL_IDS)) {
        if (rawUrl.toLowerCase().includes(key)) {
          rawId = id;
          break;
        }
      }
    }

    if (rawId && /^\d+$/.test(String(rawId).trim())) {
      targetUrl = `https://www.cricbuzz.com/profiles/${String(rawId).trim()}`;
    } else if (rawUrl && rawUrl.includes('cricbuzz.com/profiles/')) {
      targetUrl = rawUrl.trim();
    } else if (playerName) {
      const searchedId = await searchCricbuzzId(playerName);
      if (searchedId) {
        targetUrl = `https://www.cricbuzz.com/profiles/${searchedId}`;
      }
    }

    if (!targetUrl) {
      return Response.json(
        { success: false, error: 'Please enter a valid Cricbuzz profile URL or ID.' },
        { status: 400 }
      );
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.cricbuzz.com/',
    };

    let res = await fetch(targetUrl, { headers, redirect: 'follow' });

    // Fallback: If initial URL gives 404, extract slug or query and search
    if (res.status === 404) {
      const slugMatch = targetUrl.match(/profiles\/\d+\/([^/?#]+)/);
      const queryName = slugMatch ? slugMatch[1] : (playerName || '');
      if (queryName) {
        const fallbackId = KNOWN_WPL_IDS[queryName.toLowerCase()] || await searchCricbuzzId(queryName);
        if (fallbackId) {
          targetUrl = `https://www.cricbuzz.com/profiles/${fallbackId}`;
          res = await fetch(targetUrl, { headers, redirect: 'follow' });
        }
      }
    }

    if (!res.ok) {
      return Response.json(
        { success: false, error: `Cricbuzz profile not reachable at ${targetUrl} (Status ${res.status}).` },
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

    return Response.json({
      success: true,
      data,
      result: data,
      batting: bat.result,
      bowling: bowl.result,
      sourceUrl: targetUrl,
      matchedRows: bat.rows + bowl.rows,
    });
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message || 'Scraper encountered an internal error.' },
      { status: 500 }
    );
  }
}
