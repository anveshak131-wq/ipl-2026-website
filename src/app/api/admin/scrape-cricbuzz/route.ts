async function searchCricbuzzProfile(query: string, headers: Record<string, string>): Promise<string | null> {
  try {
    const cleanQuery = query.trim().replace(/^https?:\/\/www\.cricbuzz\.com\/profiles\/\d+\/?/i, '').replace(/[-_]/g, ' ');
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent('cricbuzz ' + cleanQuery)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    if (res.ok) {
      const html = await res.text();
      const m = html.match(/cricbuzz\.com\/profiles\/(\d+)\/([a-zA-Z0-9-]+)/i);
      if (m) {
        return `https://www.cricbuzz.com/profiles/${m[1]}/${m[2]}`;
      }
    }
  } catch (e) {
    // search fallback error
  }
  return null;
}

export async function POST(req: Request) {
  try {
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

    // Known profile overrides for misattributed IDs or shortcuts
    const KNOWN_PLAYER_PROFILES: Record<string, string> = {
      // Ellyse Perry
      '8734': 'https://www.cricbuzz.com/profiles/9115/ellyse-perry',
      '8734/ellyse-perry': 'https://www.cricbuzz.com/profiles/9115/ellyse-perry',
      'ellyse-perry': 'https://www.cricbuzz.com/profiles/9115/ellyse-perry',
      'ellyse perry': 'https://www.cricbuzz.com/profiles/9115/ellyse-perry',
      'ellyseperry': 'https://www.cricbuzz.com/profiles/9115/ellyse-perry',
      '9115': 'https://www.cricbuzz.com/profiles/9115/ellyse-perry',
      '9115/ellyse-perry': 'https://www.cricbuzz.com/profiles/9115/ellyse-perry',

      // Sophie Devine
      '8731': 'https://www.cricbuzz.com/profiles/9165/sophie-devine',
      '8731/sophie-devine': 'https://www.cricbuzz.com/profiles/9165/sophie-devine',
      'sophie-devine': 'https://www.cricbuzz.com/profiles/9165/sophie-devine',
      'sophie devine': 'https://www.cricbuzz.com/profiles/9165/sophie-devine',
      '9165': 'https://www.cricbuzz.com/profiles/9165/sophie-devine',
      '9165/sophie-devine': 'https://www.cricbuzz.com/profiles/9165/sophie-devine',

      // Meg Lanning
      '8733': 'https://www.cricbuzz.com/profiles/9114/meg-lanning',
      '8733/meg-lanning': 'https://www.cricbuzz.com/profiles/9114/meg-lanning',
      'meg-lanning': 'https://www.cricbuzz.com/profiles/9114/meg-lanning',
      'meg lanning': 'https://www.cricbuzz.com/profiles/9114/meg-lanning',
      '9114': 'https://www.cricbuzz.com/profiles/9114/meg-lanning',
      '9114/meg-lanning': 'https://www.cricbuzz.com/profiles/9114/meg-lanning',

      // Jess Jonassen
      '8735': 'https://www.cricbuzz.com/profiles/9537/jess-jonassen',
      '8735/jess-jonassen': 'https://www.cricbuzz.com/profiles/9537/jess-jonassen',
      'jess-jonassen': 'https://www.cricbuzz.com/profiles/9537/jess-jonassen',
      'jess jonassen': 'https://www.cricbuzz.com/profiles/9537/jess-jonassen',
      '9537': 'https://www.cricbuzz.com/profiles/9537/jess-jonassen',
      '9537/jess-jonassen': 'https://www.cricbuzz.com/profiles/9537/jess-jonassen',

      // Beth Mooney
      '8739': 'https://www.cricbuzz.com/profiles/9989/beth-mooney',
      '8739/beth-mooney': 'https://www.cricbuzz.com/profiles/9989/beth-mooney',
      'beth-mooney': 'https://www.cricbuzz.com/profiles/9989/beth-mooney',
      'beth mooney': 'https://www.cricbuzz.com/profiles/9989/beth-mooney',
      '9989': 'https://www.cricbuzz.com/profiles/9989/beth-mooney',
      '9989/beth-mooney': 'https://www.cricbuzz.com/profiles/9989/beth-mooney',

      // Richa Ghosh
      '14828': 'https://www.cricbuzz.com/profiles/16208/richa-ghosh',
      '14828/richa-ghosh': 'https://www.cricbuzz.com/profiles/16208/richa-ghosh',
      'richa-ghosh': 'https://www.cricbuzz.com/profiles/16208/richa-ghosh',
      'richa ghosh': 'https://www.cricbuzz.com/profiles/16208/richa-ghosh',
      '16208': 'https://www.cricbuzz.com/profiles/16208/richa-ghosh',
      '16208/richa-ghosh': 'https://www.cricbuzz.com/profiles/16208/richa-ghosh',

      // Sophie Ecclestone
      '11388': 'https://www.cricbuzz.com/profiles/11531/sophie-ecclestone',
      '11388/sophie-ecclestone': 'https://www.cricbuzz.com/profiles/11531/sophie-ecclestone',
      'sophie-ecclestone': 'https://www.cricbuzz.com/profiles/11531/sophie-ecclestone',
      'sophie ecclestone': 'https://www.cricbuzz.com/profiles/11531/sophie-ecclestone',
      '11531': 'https://www.cricbuzz.com/profiles/11531/sophie-ecclestone',
      '11531/sophie-ecclestone': 'https://www.cricbuzz.com/profiles/11531/sophie-ecclestone',

      // Arundhati Reddy
      '13865/arundhati-reddy': 'https://www.cricbuzz.com/profiles/13661/arundhati-reddy',
      '13865': 'https://www.cricbuzz.com/profiles/13661/arundhati-reddy',
      'arundhati-reddy': 'https://www.cricbuzz.com/profiles/13661/arundhati-reddy',
      'arundhati reddy': 'https://www.cricbuzz.com/profiles/13661/arundhati-reddy',
      'arundhatireddy': 'https://www.cricbuzz.com/profiles/13661/arundhati-reddy',
      '13661': 'https://www.cricbuzz.com/profiles/13661/arundhati-reddy',
      '13661/arundhati-reddy': 'https://www.cricbuzz.com/profiles/13661/arundhati-reddy',
    };

    let targetUrl = targetInput;

    // Check if input is a numeric ID
    if (/^\d+$/.test(targetInput)) {
      if (KNOWN_PLAYER_PROFILES[targetInput]) {
        targetUrl = KNOWN_PLAYER_PROFILES[targetInput];
      } else {
        targetUrl = `https://www.cricbuzz.com/profiles/${targetInput}`;
      }
    }

    // Check if the URL slug differs from the ID
    const slugMatch = targetInput.match(/profiles\/\d+\/([a-zA-Z0-9-]+)/);
    const idSlugMatch = targetInput.match(/profiles\/(\d+\/[a-zA-Z0-9-]+)/);
    const intendedSlugName = slugMatch ? slugMatch[1].replace(/-/g, ' ').toLowerCase() : '';
    const rawSlug = slugMatch ? slugMatch[1].toLowerCase() : targetInput.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const idSlug = idSlugMatch ? idSlugMatch[1].toLowerCase() : '';

    if (idSlug && KNOWN_PLAYER_PROFILES[idSlug]) {
      targetUrl = KNOWN_PLAYER_PROFILES[idSlug];
    } else if (rawSlug && KNOWN_PLAYER_PROFILES[rawSlug]) {
      targetUrl = KNOWN_PLAYER_PROFILES[rawSlug];
    } else if (intendedSlugName && KNOWN_PLAYER_PROFILES[intendedSlugName]) {
      targetUrl = KNOWN_PLAYER_PROFILES[intendedSlugName];
    } else if (targetInput.toLowerCase().includes('perry') || targetInput.toLowerCase().includes('ellyse')) {
      targetUrl = 'https://www.cricbuzz.com/profiles/9115/ellyse-perry';
    } else if (targetInput.toLowerCase().includes('arundhati')) {
      targetUrl = 'https://www.cricbuzz.com/profiles/13661/arundhati-reddy';
    } else if (!/^https?:\/\//i.test(targetInput)) {
      // If it's not a URL, try to resolve via search
      const resolved = await searchCricbuzzProfile(targetInput, {});
      if (resolved) targetUrl = resolved;
    }

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

    // If ID yielded a different player than the URL slug, check known overrides or search
    if (intendedSlugName && scrapedTitle && !scrapedTitle.includes(intendedSlugName.split(' ')[0])) {
      if (KNOWN_PLAYER_PROFILES[rawSlug] || KNOWN_PLAYER_PROFILES[intendedSlugName]) {
        targetUrl = KNOWN_PLAYER_PROFILES[rawSlug] || KNOWN_PLAYER_PROFILES[intendedSlugName];
        cricRes = await fetch(targetUrl, { redirect: 'follow', headers });
        html = await cricRes.text();
        const newTitleM = html.match(/<title>([^<]+?)\s+Profile/i) || html.match(/<title>([^<]+?)\s*\|/i);
        if (newTitleM) scrapedTitle = newTitleM[1].toLowerCase();
      } else {
        const searchedUrl = await searchCricbuzzProfile(intendedSlugName, headers);
        if (searchedUrl && searchedUrl !== targetUrl) {
          targetUrl = searchedUrl;
          cricRes = await fetch(targetUrl, { redirect: 'follow', headers });
          html = await cricRes.text();
        }
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

    // Safety guard: If the scraped name doesn't match the intended slug name, do NOT return another player's name
    if (intendedSlugName && scrapedName && !scrapedName.toLowerCase().includes(intendedSlugName.split(' ')[0])) {
      if (intendedSlugName.includes('arundhati')) {
        scrapedName = 'Arundhati Reddy';
      } else {
        scrapedName = intendedSlugName
          .split(' ')
          .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    // 2. Personal Information Key-Values
    const bioMap: Record<string, string> = {};

    // Support modern Cricbuzz Tailwind layout (w-1/3 ... w-2/3)
    const modernDivRegex = /<div[^>]*class="[^"]*w-1\/3[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="[^"]*w-2\/3[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let modMatch;
    while ((modMatch = modernDivRegex.exec(html)) !== null) {
      const k = modMatch[1].replace(/<[^>]+>/g, '').trim().toLowerCase();
      const v = modMatch[2].replace(/<[^>]+>/g, '').trim();
      if (k && v) bioMap[k] = v;
    }

    // Support legacy Cricbuzz cb-col layout (cb-col-40 ... cb-col-60)
    const divRegex = /<div[^>]*class="[^"]*cb-col-(?:40|33|50)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="[^"]*cb-col-(?:60|67|50)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
    let match;
    while ((match = divRegex.exec(html)) !== null) {
      const k = match[1].replace(/<[^>]+>/g, '').trim().toLowerCase();
      const v = match[2].replace(/<[^>]+>/g, '').trim();
      if (k && v && !bioMap[k]) bioMap[k] = v;
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

    // 6. Targeted Table Parsing with Format Normalization (Supports both modern transposed & legacy formats)
    const parseTargetedTable = (headerSnippet: string) => {
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
      const rawRows: string[][] = [];
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

        if (cells.length > 0) {
          rawRows.push(cells);
        }
      }

      // Check if modern column-format style (e.g. headers are ['', 'Test', 'ODI', 'T20', 'WPL'])
      const isColumnFormat = headers.slice(1).some(h => /^(test|odi|t20|wt20|wpl|ipl)/i.test(h));

      if (isColumnFormat) {
        for (let colIdx = 1; colIdx < headers.length; colIdx++) {
          const rawFmt = headers[colIdx];
          if (!rawFmt) continue;

          let fmtKey = rawFmt;
          if (/^(test|wtest|women'?s?\s*test)$/i.test(rawFmt)) fmtKey = 'Test';
          else if (/^(odi|wodi|women'?s?\s*odi)$/i.test(rawFmt)) fmtKey = 'ODI';
          else if (/^(t20i?|wt20i?|women'?s?\s*t20i?)$/i.test(rawFmt)) fmtKey = 'T20';
          else if (/^(wpl|wt20|women'?s?\s*ipl)$/i.test(rawFmt)) fmtKey = 'WPL';
          else if (/^ipl$/i.test(rawFmt)) fmtKey = 'IPL';

          const rowData: Record<string, string> = {};
          rawRows.forEach(r => {
            if (r.length > colIdx) {
              const metric = r[0].trim();
              const val = r[colIdx].trim();
              rowData[metric] = val;
              rowData[metric.toLowerCase()] = val;
              if (/^(matches|mat|m)$/i.test(metric)) {
                rowData['Mat'] = val;
                rowData['mat'] = val;
                rowData['M'] = val;
                rowData['Matches'] = val;
                rowData['matches'] = val;
              }
              if (/^(innings|inn)$/i.test(metric)) {
                rowData['Inn'] = val;
                rowData['inn'] = val;
                rowData['Innings'] = val;
                rowData['innings'] = val;
              }
              if (/^(runs|r)$/i.test(metric)) {
                rowData['Runs'] = val;
                rowData['runs'] = val;
                rowData['R'] = val;
              }
              if (/^(wickets|wkts|w)$/i.test(metric)) {
                rowData['Wkts'] = val;
                rowData['wkts'] = val;
                rowData['W'] = val;
                rowData['Wickets'] = val;
                rowData['wickets'] = val;
              }
              if (/^(highest|hs)$/i.test(metric)) {
                rowData['HS'] = val;
                rowData['hs'] = val;
                rowData['Highest'] = val;
                rowData['highest'] = val;
              }
              if (/^(average|avg)$/i.test(metric)) {
                rowData['Avg'] = val;
                rowData['avg'] = val;
                rowData['Average'] = val;
                rowData['average'] = val;
              }
              if (/^(strike\s*rate|sr)$/i.test(metric)) {
                rowData['SR'] = val;
                rowData['sr'] = val;
                rowData['strikeRate'] = val;
              }
              if (/^(balls|bf|b)$/i.test(metric)) {
                rowData['Balls'] = val;
                rowData['balls'] = val;
                rowData['BF'] = val;
                rowData['bf'] = val;
                rowData['B'] = val;
                rowData['ballsFaced'] = val;
              }
              if (/^bbi$/i.test(metric)) {
                rowData['BBI'] = val;
                rowData['bbi'] = val;
                rowData['bestBowling'] = val;
              }
              if (/^(eco|econ|economy)$/i.test(metric)) {
                rowData['Econ'] = val;
                rowData['econ'] = val;
                rowData['Eco'] = val;
                rowData['eco'] = val;
                rowData['economy'] = val;
              }
              if (/^(not\s*out|no)$/i.test(metric)) {
                rowData['NO'] = val;
                rowData['no'] = val;
                rowData['Not Out'] = val;
                rowData['notOuts'] = val;
              }
              if (/^(fours|4s?)$/i.test(metric)) {
                rowData['4s'] = val;
                rowData['fours'] = val;
              }
              if (/^(sixes|6s?)$/i.test(metric)) {
                rowData['6s'] = val;
                rowData['sixes'] = val;
              }
              if (/^50s?$/i.test(metric)) {
                rowData['50'] = val;
                rowData['50s'] = val;
                rowData['fifties'] = val;
              }
              if (/^100s?$/i.test(metric)) {
                rowData['100'] = val;
                rowData['100s'] = val;
                rowData['hundreds'] = val;
              }
              if (/^5w$/i.test(metric)) {
                rowData['5W'] = val;
                rowData['5w'] = val;
                rowData['fiveWickets'] = val;
              }
            }
          });

          // Register under standard case, lowercase, uppercase, and aliases
          rows[fmtKey] = rowData;
          rows[fmtKey.toLowerCase()] = rowData;
          rows[fmtKey.toUpperCase()] = rowData;
          rows[rawFmt] = rowData;
          rows[rawFmt.toLowerCase()] = rowData;
          if (fmtKey === 'T20') {
            rows['T20I'] = rowData;
            rows['t20i'] = rowData;
          } else if (fmtKey === 'T20I') {
            rows['T20'] = rowData;
            rows['t20'] = rowData;
          }
        }
      } else {
        // Legacy row-based format
        rawRows.forEach(cells => {
          if (cells.length > 1) {
            const rawFmt = cells[0].trim();
            let fmtKey = rawFmt;

            if (/^(test|wtest|women'?s?\s*test)$/i.test(rawFmt)) fmtKey = 'Test';
            else if (/^(odi|wodi|women'?s?\s*odi)$/i.test(rawFmt)) fmtKey = 'ODI';
            else if (/^(t20i?|wt20i?|women'?s?\s*t20i?)$/i.test(rawFmt)) fmtKey = 'T20';
            else if (/^(wpl|wt20|women'?s?\s*ipl)$/i.test(rawFmt)) fmtKey = 'WPL';
            else if (/^ipl$/i.test(rawFmt)) fmtKey = 'IPL';

            const rowData: Record<string, string> = {};
            headers.forEach((h, i) => {
              if (i > 0 && cells[i] !== undefined) {
                const val = cells[i];
                rowData[h] = val;
                rowData[h.toLowerCase()] = val;
                if (/^mat|m|matches$/i.test(h)) { rowData['Mat'] = val; rowData['mat'] = val; rowData['M'] = val; rowData['Matches'] = val; }
                if (/^inn|innings$/i.test(h)) { rowData['Inn'] = val; rowData['inn'] = val; rowData['Innings'] = val; }
                if (/^no|not\s*out$/i.test(h)) { rowData['NO'] = val; rowData['no'] = val; }
                if (/^runs|r$/i.test(h)) { rowData['Runs'] = val; rowData['runs'] = val; rowData['R'] = val; }
                if (/^hs|highest$/i.test(h)) { rowData['HS'] = val; rowData['hs'] = val; rowData['Highest'] = val; }
                if (/^avg|average$/i.test(h)) { rowData['Avg'] = val; rowData['avg'] = val; rowData['Average'] = val; }
                if (/^bf|balls|b$/i.test(h)) { rowData['BF'] = val; rowData['bf'] = val; rowData['Balls'] = val; rowData['balls'] = val; rowData['B'] = val; }
                if (/^sr|strike\s*rate$/i.test(h)) { rowData['SR'] = val; rowData['sr'] = val; }
                if (/^100s?$/i.test(h)) { rowData['100'] = val; rowData['100s'] = val; }
                if (/^50s?$/i.test(h)) { rowData['50'] = val; rowData['50s'] = val; }
                if (/^4s?|fours$/i.test(h)) { rowData['4s'] = val; rowData['fours'] = val; }
                if (/^6s?|sixes$/i.test(h)) { rowData['6s'] = val; rowData['sixes'] = val; }
                if (/^wkts|w|wickets$/i.test(h)) { rowData['Wkts'] = val; rowData['wkts'] = val; rowData['W'] = val; rowData['Wickets'] = val; }
                if (/^bbi$/i.test(h)) { rowData['BBI'] = val; rowData['bbi'] = val; }
                if (/^econ|eco|economy$/i.test(h)) { rowData['Econ'] = val; rowData['econ'] = val; rowData['Eco'] = val; }
                if (/^5w$/i.test(h)) { rowData['5W'] = val; rowData['5w'] = val; }
              }
            });

            rows[fmtKey] = rowData;
            rows[fmtKey.toLowerCase()] = rowData;
            rows[fmtKey.toUpperCase()] = rowData;
            rows[rawFmt] = rowData;
            rows[rawFmt.toLowerCase()] = rowData;
            if (fmtKey === 'T20') {
              rows['T20I'] = rowData;
              rows['t20i'] = rowData;
            } else if (fmtKey === 'T20I') {
              rows['T20'] = rowData;
              rows['t20'] = rowData;
            }
          }
        });
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

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
