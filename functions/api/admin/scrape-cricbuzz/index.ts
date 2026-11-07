import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url, profileId } = await req.json();
    let targetUrl = (url || '').trim();

    if (!targetUrl && profileId) {
      targetUrl = `https://www.cricbuzz.com/profiles/${profileId}`;
    }

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: 'Please provide a valid Cricbuzz profile URL or ID' }, { status: 400 });
    }

    if (/^\d+$/.test(targetUrl)) {
      targetUrl = `https://www.cricbuzz.com/profiles/${targetUrl}`;
    }

    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    if (!res.ok) {
      return NextResponse.json({ success: false, error: `Cricbuzz returned status ${res.status}` }, { status: res.status });
    }

    const html = await res.text();

    // 1. Scrape Player Name
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const scrapedName = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';

    // 2. Scrape Personal Information Key-Values
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

    // 7. Scrape Multi-Format Career Tables
    const batting: Record<string, any> = {};
    const bowling: Record<string, any> = {};

    const tableRegex = /<table[^>]*class="[^"]*cb-col-100[^"]*"[^>]*>([\s\S]*?)<\/table>/gi;
    let tMatch;
    let tableIndex = 0;

    while ((tMatch = tableRegex.exec(html)) !== null) {
      const tableHtml = tMatch[1];
      const isBatting = tableIndex === 0;
      const targetObj = isBatting ? batting : bowling;

      const headers: string[] = [];
      const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
      let thMatch;
      while ((thMatch = thRegex.exec(tableHtml)) !== null) {
        headers.push(thMatch[1].replace(/<[^>]+>/g, '').trim());
      }

      const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let trMatch;
      while ((trMatch = trRegex.exec(tableHtml)) !== null) {
        const rowHtml = trMatch[1];
        if (rowHtml.includes('<th')) continue;

        const cells: string[] = [];
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        let tdMatch;
        while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
          cells.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
        }

        if (cells.length > 1) {
          const format = cells[0];
          const rowData: Record<string, string> = {};
          headers.forEach((h, idx) => {
            if (idx > 0 && cells[idx] !== undefined) {
              rowData[h] = cells[idx];
            }
          });
          targetObj[format] = rowData;
        }
      }
      tableIndex++;
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

    return NextResponse.json({
      success: true,
      sourceUrl: targetUrl,
      profileId: targetId,
      bio,
      data: { batting, bowling }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Scrape failed' }, { status: 500 });
  }
}
