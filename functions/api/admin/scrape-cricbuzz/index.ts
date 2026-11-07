export async function onRequestPost(context: any) {
  try {
    const req = context.request;
    const body = await req.json().catch(() => ({}));
    let targetInput = (body.url || '').trim();

    if (!targetInput && body.profileId) {
      targetInput = `https://www.cricbuzz.com/profiles/${body.profileId}`;
    }

    if (!targetInput) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter a Cricbuzz profile URL, ID, or Player Name' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    let targetUrl = targetInput;

    // Check if input is a numeric ID
    if (/^\d+$/.test(targetInput)) {
      targetUrl = `https://www.cricbuzz.com/profiles/${targetInput}`;
    }

    // Check if the URL slug differs from the ID (e.g. 8734/ellyse-perry)
    const slugMatch = targetInput.match(/profiles\/\d+\/([a-zA-Z0-9-]+)/);
    const intendedSlugName = slugMatch ? slugMatch[1].replace(/-/g, ' ').toLowerCase() : '';

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache'
    };

    let cricRes = await fetch(targetUrl, { redirect: 'follow', headers });
    let html = await cricRes.text();

    // Verify if the fetched page matches the intended player
    let scrapedTitle = '';
    const titleM = html.match(/<title>([^<]+?)\s+Profile/i) || html.match(/<title>([^<]+?)\s*\|/i);
    if (titleM) scrapedTitle = titleM[1].toLowerCase();

    // If ID yielded a different player than the URL slug, search Cricbuzz for the real player profile
    if (intendedSlugName && scrapedTitle && !scrapedTitle.includes(intendedSlugName.split(' ')[0])) {
      try {
        const searchRes = await fetch(`https://www.cricbuzz.com/api/search/results?q=${encodeURIComponent(intendedSlugName)}`, { headers });
        if (searchRes.ok) {
          const searchData: any = await searchRes.json().catch(() => ({}));
          const playerEntry = (searchData?.playerList || searchData?.players || searchData?.results || []).find((p: any) =>
            (p.name || '').toLowerCase().includes(intendedSlugName.split(' ')[0])
          );
          if (playerEntry && playerEntry.id) {
            targetUrl = `https://www.cricbuzz.com/profiles/${playerEntry.id}`;
            cricRes = await fetch(targetUrl, { redirect: 'follow', headers });
            html = await cricRes.text();
          }
        }
      } catch (searchErr) {
        // Fallback to original page
      }
    }

    // 1. Scrape Name
    let scrapedName = '';
    const titleMatch = html.match(/<title>([^<]+?)\s+Profile\s*[-_]/i) || html.match(/<title>([^<]+?)\s*\|\s*Cricbuzz/i);
    if (titleMatch) {
      scrapedName = titleMatch[1].replace(/Profile.*$/i, '').trim();
    }
    if (!scrapedName || scrapedName.toLowerCase().includes('cricbuzz')) {
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match) scrapedName = h1Match[1].replace(/<[^>]+>/g, '').trim();
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

    // 4. Clean Nationality (Filtering out UI words like "Teams")
    const nations = ['Australia', 'England', 'South Africa', 'New Zealand', 'West Indies', 'Sri Lanka', 'Pakistan', 'Bangladesh', 'Ireland', 'Scotland', 'Zimbabwe', 'Afghanistan', 'USA', 'Netherlands', 'India'];
    let nationality = '';

    const countryHeader = html.match(/<h3[^>]*class="[^"]*cb-font-18[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
    const candidateText = (countryHeader ? countryHeader[1].replace(/<[^>]+>/g, '').trim() : '') + ' ' + (bioMap['birth place'] || '') + ' ' + html.substring(0, 2500);

    for (const n of nations) {
      if (new RegExp('\\b' + n + '\\b', 'i').test(candidateText)) {
        nationality = n;
        break;
      }
    }
    if (!nationality) nationality = 'India';

    // 5. Role & Playing Styles
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

    // 6. Targeted Table Parsing with Format Normalization
    function parseTargetedTable(headerSnippet: string) {
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

          // Normalize Women's and Men's format names
          if (/^(test|wtest|women'?s?\s*test)$/i.test(rawFmt)) fmtKey = 'Test';
          else if (/^(odi|wodi|women'?s?\s*odi)$/i.test(rawFmt)) fmtKey = 'ODI';
          else if (/^(t20i?|wt20i?|women'?s?\s*t20i?)$/i.test(rawFmt)) fmtKey = 'T20I';
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
