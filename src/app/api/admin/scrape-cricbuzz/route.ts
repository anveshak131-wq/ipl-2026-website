import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url, profileId, playerName } = await req.json();
    let targetUrl = url;
    
    if (!targetUrl && profileId) {
      targetUrl = `https://www.cricbuzz.com/profiles/${profileId}`;
    }

    if (!targetUrl) {
      return NextResponse.json({ success: false, error: 'No URL or Profile ID provided' }, { status: 400 });
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'Failed to fetch Cricbuzz profile' }, { status: response.status });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Extract Career Stats
    const battingData: any = {};
    const bowlingData: any = {};
    
    const tables = $('table.table');
    tables.each((_, table) => {
      const headerText = $(table).prev('h4').text().toLowerCase();
      const isBatting = headerText.includes('batting');
      const isBowling = headerText.includes('bowling');
      
      if (!isBatting && !isBowling) return;

      const headers: string[] = [];
      $(table).find('thead th').each((_, th) => {
        headers.push($(th).text().trim().toLowerCase());
      });

      $(table).find('tbody tr').each((_, tr) => {
        const format = $(tr).find('td').first().text().trim();
        if (!format) return;
        
        const rowData: any = {};
        $(tr).find('td').each((idx, td) => {
          if (idx === 0) return;
          const key = headers[idx];
          if (key) rowData[key] = $(td).text().trim();
        });

        if (isBatting) battingData[format] = rowData;
        if (isBowling) bowlingData[format] = rowData;
      });
    });

    // 2. Extract Personal Details & Bio
    const bioMap: Record<string, string> = {};
    $('.cb-col.cb-col-33, .cb-col.cb-col-40').each((_, el) => {
      const key = $(el).text().trim().toLowerCase();
      const val = $(el).next('.cb-col.cb-col-67, .cb-col.cb-col-60').text().trim();
      if (key && val) bioMap[key] = val;
    });

    const scrapedName = $('h1').first().text().trim();
    
    let dateOfBirth = '';
    let age = '';
    if (bioMap['born']) {
      const rawBorn = bioMap['born'];
      const ageMatch = rawBorn.match(/\((\d+)\s*y/i);
      if (ageMatch) age = ageMatch[1].trim();
      
      const cleanDateStr = rawBorn.replace(/\(.*?\)/g, '').trim();
      const d = new Date(cleanDateStr);
      if (!isNaN(d.getTime())) {
        dateOfBirth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        dateOfBirth = cleanDateStr;
      }
    }

    let nationality = 'India';
    const rawCountry = $('h3.cb-font-18').first().text().trim();
    const knownNations = ['India', 'Australia', 'England', 'South Africa', 'New Zealand', 'West Indies', 'Sri Lanka', 'Pakistan', 'Bangladesh', 'Ireland', 'Scotland'];
    for (const n of knownNations) {
      if (new RegExp('\\b' + n + '\\b', 'i').test(rawCountry + ' ' + (bioMap['birth place'] || ''))) {
        nationality = n;
        break;
      }
    }

    const rawRole = (bioMap['role'] || '').toLowerCase();
    let role = 'Batter';
    let allrounderType = '';
    if (rawRole.includes('allrounder') || rawRole.includes('all-rounder')) {
      role = 'All-rounder';
      allrounderType = rawRole.includes('bowl') ? 'Bowling All-rounder' : 'Batting All-rounder';
    } else if (rawRole.includes('keeper') || rawRole.includes('wk')) {
      role = 'Wicketkeeper';
    } else if (rawRole.includes('bowl')) {
      role = 'Bowler';
    }

    const rawBat = (bioMap['batting style'] || '').toLowerCase();
    const battingStyle = rawBat.includes('left') ? 'Left-hand bat' : 'Right-hand bat';

    let bowlingStyle = bioMap['bowling style'] || 'Right-arm medium-fast';
    if (/slow.*left.*orthodox/i.test(bowlingStyle)) bowlingStyle = 'Slow left-arm orthodox';

    const bio = {
      name: scrapedName,
      dateOfBirth,
      age: age ? Number(age) : '',
      nationality,
      role,
      allrounderType,
      battingStyle,
      bowlingStyle
    };

    return NextResponse.json({ 
      success: true, 
      data: { batting: battingData, bowling: bowlingData },
      bio,
      sourceUrl: targetUrl
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
