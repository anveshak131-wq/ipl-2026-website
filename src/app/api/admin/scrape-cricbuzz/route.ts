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
      return new Response(JSON.stringify({ success: false, error: `Cricbuzz returned status ${cricRes.status}` }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const html = await cricRes.text();

    // 1. Robust Player Name Extraction (Title -> H1 -> DOM -> URL slug)
    const slugMatch = targetUrl.match(/profiles\/\d+\/([a-zA-Z0-9-]+)/);
    let fallbackNameFromUrl = '';
    if (slugMatch) {
      fallbackNameFromUrl = slugMatch[1]
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }

    let scrapedName = '';
    const titleMatch = html.match(/<title>([^<]+?)\s+Profile\s*[-_]/i) || html.match(/<title>([^<]+?)\s*\|\s*Cricbuzz/i);
    if (titleMatch) {
      scrapedName = titleMatch[1].replace(/Profile.*$/i, '').trim();
    }
    if (!scrapedName) {
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match) scrapedName = h1Match[1].replace(/<[^>]+>/g, '').trim();
    }
    if (!scrapedName) {
      const divNameMatch = html.match(/<div[^>]*class="[^"]*cb-font-24[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (divNameMatch) scrapedName = divNameMatch[1].replace(/<[^>]+>/g, '').trim();
    }
    if (!scrapedName || scrapedName.toLowerCase().includes('cricbuzz')) {
      scrapedName = fallbackNameFromUrl;
    }

    // 2. Personal Information Key-Values
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

    // 4. Robust Nationality Detection
    let nationality = '';
    const countryMatch = html.match(/<h3[^>]*class="[^"]*cb-font-18[^"]*"[^>]*>([\s\S]*?)<\/h3>/i) ||
                         html.match(/<div[^>]*class="[^"]*(?:cb-font-18|text-gray)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (countryMatch) {
      nationality = countryMatch[1].replace(/<[^>]+>/g, '').trim();
    }

    const nations = ['Australia', 'England', 'South Africa', 'New Zealand', 'West Indies', 'Sri Lanka', 'Pakistan', 'Bangladesh', 'Ireland', 'Scotland', 'Zimbabwe', 'Afghanistan', 'USA', 'Netherlands', 'India'];
    for (const n of nations) {
      const re = new RegExp('\\b' + n + '\\b', 'i');
      if (re.test(nationality) || re.test(bioMap['birth place'] || '') || re.test(html.substring(0, 1500))) {
        nationality = n;
        break;
      }
    }
    if (!nationality) nationality = 'India';

    // 5. Role & Allrounder Type
    const rawRole = (bioMap['role'] || '').toLowerCase();
    let role = 'Batter';
    let allrounderType = '';
    if (rawRole.includes('allrounder') || rawRole.includes('all-rounder') || rawRole.includes('all rounder')) {
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
    else if (/right.*med/i.test(rawBowl)) bowlingStyle = 'Right-arm medium';
    else if (/right.*off/i.test(rawBowl)) bowlingStyle = 'Right-arm offbreak';
    else if (/right.*leg/i.test(rawBowl)) bowlingStyle = 'Right-arm legbreak';
    else if (/left.*orthodox/i.test(rawBowl)) bowlingStyle = 'Slow left-arm orthodox';
    else if (/left.*fast.*med/i.test(rawBowl)) bowlingStyle = 'Left-arm fast-medium';
    else if (/left.*med.*fast/i.test(rawBowl)) bowlingStyle = 'Left-arm medium-fast';
    else if (rawBowl) bowlingStyle = rawBowl;

    // 7. Targeted Career Stats Table Parsing
    function parseTargetedTable(headerSnippet: string): Record<string, Record<string, string>> {
      const idx = html.indexOf(headerSnippet);
      if (idx === -1) return {};

      const tableStart = html.indexOf('<table', idx);
      const tableEnd = html.indexOf('</table>', tableStart);
      if (tableStart === -1 || tableEnd === -1) return {};

      const tableHtml = html.substring(tableStart, tableEnd + 8);
      const headers: string[] = [];
      const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
      let th;
      while ((th = thRegex.exec(tableHtml)) !== null) {
        headers.push(th[1].replace(/<[^>]+>/g, '').trim());
      }

      const rows: Record<string, Record<string, string>> = {};
      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let tr;
      while ((tr = trRegex.exec(tableHtml)) !== null) {
        const rowContent = tr[1];
        if (rowContent.includes('<th')) continue;

        const cells: string[] = [];
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        let td;
        while ((td = tdRegex.exec(rowContent)) !== null) {
          cells.push(td[1].replace(/<[^>]+>/g, '').trim());
        }

        if (cells.length > 1) {
          const rawFmt = cells[0].trim();
          let fmtKey = rawFmt;
          if (/^test$/i.test(rawFmt)) fmtKey = 'Test';
          else if (/^odi$/i.test(rawFmt)) fmtKey = 'ODI';
          else if (/^t20i?$/i.test(rawFmt)) fmtKey = 'T20I';
          else if (/^(wpl|wt20|ipl)$/i.test(rawFmt)) fmtKey = 'WPL';

          const rowData: Record<string, string> = {};
          headers.forEach((h, i) => {
            if (i > 0 && cells[i] !== undefined) {
              const val = cells[i];
              rowData[h] = val;
              rowData[h.toLowerCase()] = val;
              if (/^mat|m$/i.test(h)) rowData['Mat'] = val;
              if (/^inn$/i.test(h)) rowData['Inn'] = val;
              if (/^no$/i.test(h)) rowData['NO'] = val;
              if (/^runs|r$/i.test(h)) rowData['Runs'] = val;
              if (/^hs$/i.test(h)) rowData['HS'] = val;
              if (/^avg$/i.test(h)) rowData['Avg'] = val;
              if (/^bf|balls$/i.test(h)) rowData['BF'] = val;
              if (/^sr$/i.test(h)) rowData['SR'] = val;
              if (/^100s?$/i.test(h)) rowData['100'] = val;
              if (/^50s?$/i.test(h)) rowData['50'] = val;
              if (/^4s?$/i.test(h)) rowData['4s'] = val;
              if (/^6s?$/i.test(h)) rowData['6s'] = val;
              if (/^wkts|w$/i.test(h)) rowData['Wkts'] = val;
              if (/^b|balls$/i.test(h)) rowData['Balls'] = val;
              if (/^bbi$/i.test(h)) rowData['BBI'] = val;
              if (/^econ$/i.test(h)) rowData['Econ'] = val;
            }
          });

          rows[fmtKey] = rowData;
          rows[rawFmt] = rowData;
        }
      }
      return rows;
    }

    const batting = parseTargetedTable('Batting Career Summary');
    const bowling = parseTargetedTable('Bowling Career Summary');

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
