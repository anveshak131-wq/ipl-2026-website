export async function POST(req: Request) {
  try {
    const req = context;
    const body = await req.json().catch(() => ({}));
    let targetUrl = (body.url || '').trim();

    if (!targetUrl && body.profileId) {
      targetUrl = `https://www.cricbuzz.com/profiles/${body.profileId}`;
    }

    if (!targetUrl) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter a Cricbuzz profile URL or ID' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    if (/^\d+$/.test(targetUrl)) {
      targetUrl = `https://www.cricbuzz.com/profiles/${targetUrl}`;
    }

    const cricRes = await fetch(targetUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });

    if (!cricRes.ok) {
      return new Response(JSON.stringify({ success: false, error: `Cricbuzz profile returned status ${cricRes.status}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const html = await cricRes.text();

    // 1. Scrape Name
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const scrapedName = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';

    // 2. Personal Info Mapping
    const bioMap: Record<string, string> = {};
    const divRegex = /<div[^>]*class="[^"]*cb-col-(?:40|33|50)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="[^"]*cb-col-(?:60|67|50)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let match;
    while ((match = divRegex.exec(html)) !== null) {
      const k = match[1].replace(/<[^>]+>/g, '').trim().toLowerCase();
      const v = match[2].replace(/<[^>]+>/g, '').trim();
      if (k && v) bioMap[k] = v;
    }

    ['born', 'birth place', 'role', 'batting style', 'bowling style'].forEach((key) => {
      if (!bioMap[key]) {
        const fb = new RegExp('(?:>|\\b)' + key + '\\s*<\\/(?:div|td|span)>\\s*<(?:div|td|span)[^>]*>([\\s\\S]*?)<\\/(?:div|td|span)>', 'i');
        const m = html.match(fb);
        if (m) bioMap[key] = m[1].replace(/<[^>]+>/g, '').trim();
      }
    });

    // 3. Date of Birth & Age
    let dateOfBirth = '';
    let age = 25;
    if (bioMap['born']) {
      const rawBorn = bioMap['born'];
      const ageMatch = rawBorn.match(/\((\d+)\s*y/i);
      if (ageMatch) age = parseInt(ageMatch[1], 10);

      const cleanDateStr = rawBorn.replace(/\(.*?\)/g, '').trim();
      const d = new Date(cleanDateStr);
      if (!isNaN(d.getTime())) {
        dateOfBirth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        if (!ageMatch) {
          const now = new Date();
          let calculated = now.getFullYear() - d.getFullYear();
          const mDiff = now.getMonth() - d.getMonth();
          if (mDiff < 0 || (mDiff === 0 && now.getDate() < d.getDate())) calculated--;
          age = calculated;
        }
      } else {
        dateOfBirth = cleanDateStr;
      }
    }

    // 4. Nationality
    const countryMatch = html.match(/<h3[^>]*class="[^"]*cb-font-18[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
    const scrapedCountry = countryMatch ? countryMatch[1].replace(/<[^>]+>/g, '').trim() : '';
    let nationality = scrapedCountry;
    const nations = ['India', 'Australia', 'England', 'South Africa', 'New Zealand', 'West Indies', 'Sri Lanka', 'Pakistan', 'Bangladesh', 'Ireland', 'Scotland', 'Zimbabwe', 'Afghanistan', 'USA', 'Netherlands'];
    for (const n of nations) {
      if (new RegExp('\\b' + n + '\\b', 'i').test(nationality + ' ' + (bioMap['birth place'] || '') + ' ' + html)) {
        nationality = n;
        break;
      }
    }
    if (!nationality) nationality = 'India';

    // 5. Role & All-Rounder Type
    const rawRole = (bioMap['role'] || '').toLowerCase();
    let role = 'Batter';
    let allrounderType = '';
    if (rawRole.includes('allrounder') || rawRole.includes('all-rounder')) {
      role = 'All-rounder';
      allrounderType = rawRole.includes('bowl') ? 'Bowling Allrounder' : 'Batting Allrounder';
    } else if (rawRole.includes('keeper') || rawRole.includes('wk') || rawRole.includes('wicket')) {
      role = 'Wicketkeeper';
    } else if (rawRole.includes('bowl')) {
      role = 'Bowler';
    }

    // 6. Batting & Bowling Styles
    const rawBat = (bioMap['batting style'] || '').toLowerCase();
    const battingStyle = rawBat.includes('left') ? 'Left-hand bat' : 'Right-hand bat';

    const rawBowl = (bioMap['bowling style'] || '').trim();
    let bowlingStyle = 'Right-arm medium-fast';
    if (/right.*fast.*med/i.test(rawBowl)) bowlingStyle = 'Right-arm fast-medium';
    else if (/right.*med.*fast/i.test(rawBowl)) bowlingStyle = 'Right-arm medium-fast';
    else if (/right.*fast/i.test(rawBowl)) bowlingStyle = 'Right-arm fast';
    else if (/right.*off/i.test(rawBowl)) bowlingStyle = 'Right-arm offbreak';
    else if (/right.*leg/i.test(rawBowl)) bowlingStyle = 'Right-arm legbreak';
    else if (/left.*orthodox/i.test(rawBowl)) bowlingStyle = 'Slow left-arm orthodox';
    else if (/left.*fast.*med/i.test(rawBowl)) bowlingStyle = 'Left-arm fast-medium';
    else if (/left.*med.*fast/i.test(rawBowl)) bowlingStyle = 'Left-arm medium-fast';
    else if (rawBowl) bowlingStyle = rawBowl;

    // 7. Scrape Multi-Format Career Tables (Batting & Bowling)
    const batting: Record<string, any> = {};
    const bowling: Record<string, any> = {};

    const tableMatches = html.match(/<table[\s\S]*?<\/table>/gi) || [];
    for (const tableHtml of tableMatches) {
      const isBatting = /runs|hs|avg|strike\s*rate|sr|100s?/i.test(tableHtml) && !/wkts|bbi|econ/i.test(tableHtml);
      const isBowling = /wkts|wickets|bbi|econ|economy/i.test(tableHtml);
      if (!isBatting && !isBowling) continue;

      const targetObj = isBowling ? bowling : batting;
      const headers: string[] = [];
      const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
      let th;
      while ((th = thRegex.exec(tableHtml)) !== null) {
        headers.push(th[1].replace(/<[^>]+>/g, '').trim());
      }

      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let tr;
      while ((tr = trRegex.exec(tableHtml)) !== null) {
        const row = tr[1];
        if (row.includes('<th')) continue;
        const cells: string[] = [];
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        let td;
        while ((td = tdRegex.exec(row)) !== null) {
          cells.push(td[1].replace(/<[^>]+>/g, '').trim());
        }

        if (cells.length > 1) {
          const rawFormat = cells[0];
          let normalizedFormat = rawFormat;
          if (/^test$/i.test(rawFormat)) normalizedFormat = 'Test';
          else if (/^odi$/i.test(rawFormat)) normalizedFormat = 'ODI';
          else if (/^t20i?$/i.test(rawFormat)) normalizedFormat = 'T20I';
          else if (/^(wpl|wt20|ipl)$/i.test(rawFormat)) normalizedFormat = 'WPL';

          const rowData: Record<string, string> = {};
          headers.forEach((h, idx) => {
            if (idx > 0 && cells[idx] !== undefined) {
              rowData[h] = cells[idx];
            }
          });
          targetObj[normalizedFormat] = rowData;
        }
      }
    }

    const bio = {
      name: scrapedName,
      dateOfBirth,
      age,
      nationality,
      role,
      allrounderType,
      battingStyle,
      bowlingStyle
    };

    const targetId = targetUrl.match(/profiles\/(\d+)/)?.[1] || '';

    return new Response(JSON.stringify({
      success: true,
      sourceUrl: targetUrl,
      profileId: targetId,
      bio,
      data: { batting, bowling }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || 'Scrape failed' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
