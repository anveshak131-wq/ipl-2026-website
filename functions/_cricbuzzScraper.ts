const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const CORS_JSON_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

type ProfileSeed = [id: string, slug: string, aliases?: string[]];

const VERIFIED_PLAYER_SEEDS: ProfileSeed[] = [
  // RCB-W & India/Intl
  ['10012', 'smriti-mandhana'],
  ['9115', 'ellyse-perry', ['8734']],
  ['16208', 'richa-ghosh', ['14828']],
  ['13661', 'arundhati-reddy', ['13865']],
  ['13518', 'pooja-vastrakar', ['13175']],
  ['13533', 'radha-yadav', ['13174']],
  ['35101', 'shreyanka-patil', ['22634']],
  ['9537', 'jess-jonassen', ['8735']],
  ['9192', 'chloe-tryon', ['9005']],
  ['11101', 'grace-harris', ['10834']],
  ['12752', 'nadine-de-klerk'],
  ['13812', 'lauren-bell'],
  ['18475', 'georgia-voll'],
  ['13639', 'dayalan-hemalatha'],
  ['14489', 'tejal-hasabnis', ['22646']],

  // MI-W
  ['9082', 'harmanpreet-kaur'],
  ['9419', 'nat-sciver-brunt', ['9694']],
  ['11256', 'hayley-matthews', ['10427']],
  ['11855', 'melie-kerr', ['11986', 'amelia-kerr']],
  ['36620', 'shweta-sehrawat', ['22641']],
  ['22226', 'amanjot-kaur', ['20110']],
  ['13950', 'sajeevan-sajana', ['26038']],
  ['13020', 'tara-norris', ['15306']],
  ['9189', 'shabnim-ismail'],
  ['22241', 'saika-ishaque'],
  ['1448805', 'gunalan-kamalini', ['26039', 'g-kamalini']],
  ['13946', 'disha-kasat', ['14800']],
  ['1465212', 'latika-inamdar', ['26044']],

  // DC-W
  ['13517', 'jemimah-rodrigues', ['12821']],
  ['14825', 'shafali-verma', ['14798']],
  ['26143', 'kiran-navgire', ['20112']],
  ['9182', 'marizanne-kapp', ['9006']],
  ['12211', 'annabel-sutherland', ['14389']],
  ['11374', 'laura-wolvaardt', ['11394']],
  ['9993', 'chinelle-henry', ['10428']],
  ['12295', 'kirstie-gordon', ['13084']],
  ['13519', 'taniya-bhatia'],
  ['41078', 'shree-charani'],
  ['1465354', 'uma-kashvi', ['26051', 'kashvi-kandikuppa', 'uma-kashi']],
  ['1448889', 'nazma-khan', ['26052']],

  // GG-W
  ['11989', 'ashleigh-gardner', ['11690']],
  ['9989', 'beth-mooney', ['8739']],
  ['9165', 'sophie-devine', ['8731']],
  ['12015', 'georgia-wareham', ['13083']],
  ['16209', 'yastika-bhatia', ['14801']],
  ['14491', 'renuka-singh-thakur', ['14945', 'renuka-singh']],
  ['13649', 'tanuja-kanwer', ['22627', 'tanuja-kanwar']],
  ['18543', 'kashvee-gautam'],
  ['9476', 'kim-garth'],
  ['9140', 'danni-wyatt-hodge', ['danni-wyatt']],
  ['13742', 'orla-prendergast', ['15305']],
  ['1481678', 'samaira-raghav', ['26056']],

  // UPW
  ['9114', 'meg-lanning', ['8733']],
  ['11098', 'deepti-sharma', ['10013']],
  ['11531', 'sophie-ecclestone', ['11388']],
  ['12011', 'sophie-molineux', ['11691']],
  ['11326', 'sneh-rana', ['9693']],
  ['41186', 'asha-sobhana-joy', ['22638', 'asha-sobhana']],
  ['15636', 'phoebe-litchfield', ['15302']],
  ['12292', 'kathryn-bryce', ['13085']],
  ['13658', 'harleen-deol'],
  ['1448809', 'pratika-rawal'],
  ['11093', 'sushma-verma', ['9083']],
  ['1448841', 'kranti-gaud', ['kranti-goud', 'kranti goud']],
];

const KNOWN_PLAYER_PROFILES: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const registerKey = (key: string, url: string) => {
    const k = key.trim().toLowerCase();
    if (k) map[k] = url;
  };

  for (const [id, slug, aliases = []] of VERIFIED_PLAYER_SEEDS) {
    const url = `https://www.cricbuzz.com/profiles/${id}/${slug}`;
    registerKey(id, url);
    registerKey(slug, url);
    registerKey(slug.replace(/-/g, ' '), url);
    registerKey(slug.replace(/-/g, ''), url);
    registerKey(`${id}/${slug}`, url);

    for (const alias of aliases) {
      registerKey(alias, url);
      registerKey(alias.replace(/-/g, ' '), url);
      if (/^\d+$/.test(alias)) {
        registerKey(`${alias}/${slug}`, url);
        for (const textAlias of aliases) {
          if (!/^\d+$/.test(textAlias)) {
            registerKey(`${alias}/${textAlias}`, url);
          }
        }
      } else {
        registerKey(`${id}/${alias}`, url);
      }
    }
  }
  return map;
})();

const WPL_DIRECTORY_TEAMS = [
  'royal-challengers-bengaluru-women/1465',
  'mumbai-indians-women/1468',
  'delhi-capitals-women/1461',
  'gujarat-giants-women/1479',
  'up-warriorz-women/1472',
];

const INTL_WOMEN_DIRECTORY_TEAMS = [
  'india-women/97',
  'australia-women/100',
  'england-women/99',
  'south-africa-women/260',
  'new-zealand-women/98',
  'west-indies-women/257',
  'scotland-women/389',
];

const cachedDirectoryProfiles = new Map<string, string>();
let directoryTier = 0;

const STAT_METRIC_ALIASES: Array<[RegExp, string[]]> = [
  [/^(matches|mat|m)$/i, ['Mat']],
  [/^(innings|inn)$/i, ['Inn']],
  [/^(not\s*out|no)$/i, ['NO']],
  [/^(runs|r)$/i, ['Runs']],
  [/^(highest|hs)$/i, ['HS']],
  [/^(average|avg)$/i, ['Avg']],
  [/^(strike\s*rate|sr)$/i, ['SR']],
  [/^(balls|bf|b)$/i, ['BF', 'Balls']],
  [/^bbi$/i, ['BBI']],
  [/^(eco|econ|economy)$/i, ['Econ']],
  [/^(wickets|wkts|w)$/i, ['Wkts']],
  [/^(fours|4s?)$/i, ['4s']],
  [/^(sixes|6s?)$/i, ['6s']],
  [/^50s?$/i, ['50']],
  [/^100s?$/i, ['100']],
  [/^4w$/i, ['4W']],
  [/^5w$/i, ['5W']],
  [/^maidens$/i, ['Maidens']],
];

const KNOWN_NATIONS = [
  'Australia',
  'England',
  'South Africa',
  'New Zealand',
  'West Indies',
  'Sri Lanka',
  'Pakistan',
  'Bangladesh',
  'Ireland',
  'Scotland',
  'Zimbabwe',
  'Afghanistan',
  'USA',
  'Netherlands',
  'India',
];

const MONTHS: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function normalizeWords(value: string): string[] {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeStatMetric(rowData: Record<string, string>, metric: string, val: string): void {
  const m = metric.trim();
  const v = val.trim();
  if (!m) return;

  for (const [pattern, keys] of STAT_METRIC_ALIASES) {
    if (pattern.test(m)) {
      for (const k of keys) rowData[k] = v;
      return;
    }
  }

  rowData[m] = v;
}

function normalizeFormatKey(rawFmt: string): string {
  const f = rawFmt.trim();
  if (/^(test|wtest|women'?s?\s*test)$/i.test(f)) return 'Test';
  if (/^(odi|wodi|women'?s?\s*odi)$/i.test(f)) return 'ODI';
  if (/^(t20i?|wt20i?|women'?s?\s*t20i?)$/i.test(f)) return 'T20';
  if (/^(wpl|wipl|women'?s?\s*(?:premier\s*league|ipl))$/i.test(f)) return 'WPL';
  if (/^ipl$/i.test(f)) return 'IPL';
  return f;
}

function registerFormatRow(
  rows: Record<string, Record<string, string>>,
  rawFmt: string,
  rowData: Record<string, string>,
): void {
  const fmtKey = normalizeFormatKey(rawFmt);
  rows[fmtKey] = rowData;
}

/** Extracts a balanced `{...}` object for `"key":{...}` from unescaped Next.js RSC HTML. */
function extractRscJsonObject<T = any>(unescapedHtml: string, key: string): T | null {
  const marker = `"${key}":`;
  let searchFrom = 0;

  while (true) {
    const idx = unescapedHtml.indexOf(marker, searchFrom);
    if (idx === -1) return null;

    let braceStart = idx + marker.length;
    while (braceStart < unescapedHtml.length && /\s/.test(unescapedHtml[braceStart])) {
      braceStart++;
    }
    if (unescapedHtml[braceStart] !== '{') {
      searchFrom = idx + marker.length;
      continue;
    }

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let i = braceStart; i < unescapedHtml.length; i++) {
      const ch = unescapedHtml[i];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (ch === '\\') {
          escaped = true;
        } else if (ch === '"') {
          inString = false;
        }
        continue;
      }
      if (ch === '"') {
        inString = true;
      } else if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          const jsonSlice = unescapedHtml.slice(braceStart, i + 1);
          try {
            return JSON.parse(jsonSlice) as T;
          } catch {
            break;
          }
        }
      }
    }
    searchFrom = idx + marker.length;
  }
}

function parseRscStatsTable(statsObj: any): Record<string, Record<string, string>> {
  if (!statsObj || !Array.isArray(statsObj.headers) || !Array.isArray(statsObj.values)) {
    return {};
  }

  const headers: string[] = statsObj.headers.map((h: unknown) => String(h || '').trim());
  const rows: Record<string, Record<string, string>> = {};

  for (let colIdx = 1; colIdx < headers.length; colIdx++) {
    const rawFmt = headers[colIdx];
    if (!rawFmt) continue;

    const rowData: Record<string, string> = {};
    for (const entry of statsObj.values) {
      const cells = Array.isArray(entry?.values) ? entry.values : (Array.isArray(entry) ? entry : null);
      if (!cells || cells.length <= colIdx) continue;
      const metric = String(cells[0] ?? '').trim();
      const val = String(cells[colIdx] ?? '').trim();
      normalizeStatMetric(rowData, metric, val);
    }

    if (Object.keys(rowData).length > 0) {
      registerFormatRow(rows, rawFmt, rowData);
    }
  }

  return rows;
}

function parseTargetedHtmlTable(html: string, headerSnippet: string): Record<string, Record<string, string>> {
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
    if (cells.length > 0) rawRows.push(cells);
  }

  const rows: Record<string, Record<string, string>> = {};
  const isColumnFormat = headers.slice(1).some((h) => /^(test|odi|t20|wt20|wpl|ipl)/i.test(h));

  if (isColumnFormat) {
    for (let colIdx = 1; colIdx < headers.length; colIdx++) {
      const rawFmt = headers[colIdx];
      if (!rawFmt) continue;
      const rowData: Record<string, string> = {};
      for (const r of rawRows) {
        if (r.length > colIdx) {
          normalizeStatMetric(rowData, r[0], r[colIdx]);
        }
      }
      if (Object.keys(rowData).length > 0) {
        registerFormatRow(rows, rawFmt, rowData);
      }
    }
    return rows;
  }

  for (const cells of rawRows) {
    if (cells.length <= 1) continue;
    const rawFmt = cells[0].trim();
    const rowData: Record<string, string> = {};
    headers.forEach((h, i) => {
      if (i > 0 && cells[i] !== undefined) {
        normalizeStatMetric(rowData, h, cells[i]);
      }
    });
    if (Object.keys(rowData).length > 0) {
      registerFormatRow(rows, rawFmt, rowData);
    }
  }
  return rows;
}

function parseDobAndAge(rawBorn: string): { dateOfBirth: string; age: number | null } {
  if (!rawBorn) return { dateOfBirth: '', age: null };

  const ageMatch = rawBorn.match(/\((\d+)\s*y/i);
  let age: number | null = ageMatch ? parseInt(ageMatch[1], 10) : null;
  const cleanDateStr = rawBorn.replace(/\(.*?\)/g, '').trim();

  let year = 0;
  let month = 0;
  let day = 0;

  // Format: "July 31, 2002" or "Jul 18 1996"
  const mdy = cleanDateStr.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
  // Format: "31 July 2002"
  const dmy = cleanDateStr.match(/^(\d{1,2})\s+([A-Za-z]+),?\s+(\d{4})$/);
  // Format: "2002-07-31"
  const iso = cleanDateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (mdy && MONTHS[mdy[1].toLowerCase()]) {
    month = parseInt(MONTHS[mdy[1].toLowerCase()], 10);
    day = parseInt(mdy[2], 10);
    year = parseInt(mdy[3], 10);
  } else if (dmy && MONTHS[dmy[2].toLowerCase()]) {
    day = parseInt(dmy[1], 10);
    month = parseInt(MONTHS[dmy[2].toLowerCase()], 10);
    year = parseInt(dmy[3], 10);
  } else if (iso) {
    year = parseInt(iso[1], 10);
    month = parseInt(iso[2], 10);
    day = parseInt(iso[3], 10);
  }

  let dateOfBirth = '';
  if (year && month && day) {
    dateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  } else {
    const d = new Date(cleanDateStr);
    if (!isNaN(d.getTime())) {
      year = d.getUTCFullYear();
      month = d.getUTCMonth() + 1;
      day = d.getUTCDate();
      dateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      dateOfBirth = cleanDateStr;
    }
  }

  if (age === null && year && month && day) {
    const now = new Date();
    let calc = now.getUTCFullYear() - year;
    const mDiff = (now.getUTCMonth() + 1) - month;
    if (mDiff < 0 || (mDiff === 0 && now.getUTCDate() < day)) calc--;
    age = calc;
  }

  return { dateOfBirth, age };
}

function mapRole(rawRole: string): { role: string; allrounderType: string } {
  const r = rawRole.toLowerCase().trim();
  if (!r) return { role: '', allrounderType: '' };
  if (r.includes('allrounder') || r.includes('all-rounder') || r.includes('all rounder')) {
    return {
      role: 'All-rounder',
      allrounderType: r.includes('bowl') ? 'Bowling Allrounder' : 'Batting Allrounder',
    };
  }
  if (r.includes('keeper') || r.includes('wk') || r.includes('wicket')) {
    return { role: 'Wicketkeeper', allrounderType: '' };
  }
  if (r.includes('bowl')) {
    return { role: 'Bowler', allrounderType: '' };
  }
  if (r.includes('bat')) {
    return { role: 'Batter', allrounderType: '' };
  }
  return { role: '', allrounderType: '' };
}

function mapBowlingStyle(rawBowl: string): string {
  const b = rawBowl.trim();
  if (!b) return '';
  if (/right.*fast.*med/i.test(b)) return 'Right-arm fast-medium';
  if (/right.*med.*fast/i.test(b)) return 'Right-arm medium-fast';
  if (/right.*fast/i.test(b)) return 'Right-arm fast';
  if (/right.*med/i.test(b)) return 'Right-arm medium';
  if (/right.*off/i.test(b)) return 'Right-arm offbreak';
  if (/right.*leg/i.test(b)) return 'Right-arm legbreak';
  if (/left.*orthodox/i.test(b)) return 'Slow left-arm orthodox';
  if (/left.*fast.*med/i.test(b)) return 'Left-arm fast-medium';
  if (/left.*med.*fast/i.test(b)) return 'Left-arm medium-fast';
  return b;
}

function mapBattingStyle(rawBat: string): string {
  const b = rawBat.toLowerCase().trim();
  if (!b) return '';
  if (b.includes('left')) return 'Left-hand bat';
  if (b.includes('right')) return 'Right-hand bat';
  return rawBat.trim();
}

function extractPageTitle(html: string): string {
  const raw = html.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
  return decodeEntities(raw);
}

function isGenericOrMissingPage(
  title: string,
  scrapedName: string,
  hasStats: boolean,
): boolean {
  if (/live cricket score,\s*schedule,\s*latest news/i.test(title)) return true;
  if (!title.toLowerCase().includes('profile') && !scrapedName && !hasStats) return true;
  return !scrapedName && !hasStats;
}

function tokensRoughlyMatch(intended: string, candidate: string): boolean {
  if (candidate === intended) return true;
  if (intended === 'amelia' && candidate === 'melie') return true;
  if (intended === 'melie' && candidate === 'amelia') return true;
  if (intended.length === 1 && candidate.startsWith(intended)) return true;
  if (intended.length >= 3 && candidate.length >= 3 && intended.slice(0, 3) === candidate.slice(0, 3)) {
    return intended.length < 5 || candidate.startsWith(intended.slice(0, 4)) || intended.startsWith(candidate.slice(0, 4));
  }
  return false;
}

const CRICBUZZ_ALIAS_EQUIVALENCE_GROUPS: ReadonlyArray<ReadonlyArray<string>> = [
  ['uma kashvi', 'uma kashi', 'kashvi kandikuppa'],
];

function namesMatchIntended(intendedSlugName: string, scrapedName: string, title: string): boolean {
  if (!intendedSlugName) return true;
  const intendedWords = normalizeWords(intendedSlugName);
  if (intendedWords.length === 0) return true;

  const candidateText = `${scrapedName} ${title.replace(/\s*Profile.*/i, '')}`.toLowerCase();
  const candidateWords = normalizeWords(candidateText);
  if (candidateWords.length === 0) return false;

  const normalizedIntended = intendedWords.join(' ');
  const normalizedCandidate = candidateWords.join(' ');
  const isExemptAliasMatch = CRICBUZZ_ALIAS_EQUIVALENCE_GROUPS.some(
    (group) =>
      group.includes(normalizedIntended) &&
      group.some((alias) => normalizedCandidate.includes(alias)),
  );
  if (isExemptAliasMatch) return true;

  if (intendedWords.length === 1) {
    return candidateWords.some((cw) => tokensRoughlyMatch(intendedWords[0], cw));
  }

  const first = intendedWords[0];
  const last = intendedWords[intendedWords.length - 1];
  const firstMatches = candidateWords.some((cw) => tokensRoughlyMatch(first, cw));
  const lastMatches = candidateWords.some((cw) => cw === last || (last.length >= 5 && cw.startsWith(last.slice(0, 5))));
  return firstMatches && lastMatches;
}

async function populateDirectoryCache(tier: 1 | 2): Promise<void> {
  if (directoryTier >= tier) return;
  const teams = tier === 1 ? WPL_DIRECTORY_TEAMS : INTL_WOMEN_DIRECTORY_TEAMS;
  await Promise.all(
    teams.map(async (team) => {
      try {
        const res = await fetch(`https://www.cricbuzz.com/cricket-team/${team}/players`, {
          headers: DEFAULT_HEADERS,
        });
        if (!res.ok) return;
        const html = await res.text();
        const re = /\/profiles\/(\d+)\/([a-z0-9-]+)/gi;
        let m;
        while ((m = re.exec(html)) !== null) {
          const id = m[1];
          const slug = m[2].toLowerCase();
          cachedDirectoryProfiles.set(slug, `https://www.cricbuzz.com/profiles/${id}/${slug}`);
        }
      } catch {
        // Ignore single directory team failure
      }
    }),
  );
  directoryTier = Math.max(directoryTier, tier);
}

function findInDirectoryCache(query: string): string | null {
  const words = normalizeWords(query);
  if (words.length === 0) return null;

  const exactSlug = words.join('-');
  if (cachedDirectoryProfiles.has(exactSlug)) {
    return cachedDirectoryProfiles.get(exactSlug)!;
  }

  const entries = Array.from(cachedDirectoryProfiles.entries());

  // Exact subset match (all words appear in Cricbuzz slug)
  for (let i = 0; i < entries.length; i++) {
    const [slug, url] = entries[i];
    const slugWords = slug.split('-');
    if (words.every((w) => slugWords.includes(w))) {
      return url;
    }
  }

  // Prefix / last-name match (handles kanwar/kanwer, g kamalini/gunalan-kamalini, amelia/melie kerr)
  if (words.length >= 2) {
    const first = words[0];
    const last = words[words.length - 1];
    for (let i = 0; i < entries.length; i++) {
      const [slug, url] = entries[i];
      const slugWords = slug.split('-');
      const lastHit = slugWords.some((sw) => sw === last || (last.length >= 5 && sw.startsWith(last.slice(0, 5))));
      const firstHit = slugWords.some((sw) => tokensRoughlyMatch(first, sw));
      if (lastHit && firstHit) {
        return url;
      }
    }
  }

  return null;
}

async function searchDuckDuckGoProfile(query: string): Promise<string | null> {
  try {
    const cleanQuery = query.trim().replace(/^https?:\/\/www\.cricbuzz\.com\/profiles\/\d+\/?/i, '').replace(/[-_]/g, ' ');
    if (!cleanQuery) return null;
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent('cricbuzz ' + cleanQuery)}`, {
      headers: DEFAULT_HEADERS,
    });
    if (res.ok) {
      const html = await res.text();
      const re = /cricbuzz\.com\/profiles\/(\d+)\/([a-zA-Z0-9-]+)/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(html)) !== null) {
        const candidateUrl = `https://www.cricbuzz.com/profiles/${m[1]}/${m[2]}`;
        if (namesMatchIntended(cleanQuery, m[2].replace(/-/g, ' '), '')) {
          return candidateUrl;
        }
      }
    }
  } catch {
    // Search fallback error
  }
  return null;
}

async function searchCricbuzzProfile(query: string): Promise<string | null> {
  const cleaned = query
    .trim()
    .replace(/^https?:\/\/(?:www\.)?cricbuzz\.com\/profiles\/\d+\/?/i, '')
    .replace(/[-_]/g, ' ')
    .toLowerCase();

  if (!cleaned) return null;

  const knownDirect = KNOWN_PLAYER_PROFILES[cleaned] || KNOWN_PLAYER_PROFILES[cleaned.replace(/\s+/g, '-')];
  if (knownDirect) return knownDirect;

  await populateDirectoryCache(1);
  const wplHit = findInDirectoryCache(cleaned);
  if (wplHit) return wplHit;

  await populateDirectoryCache(2);
  const intlHit = findInDirectoryCache(cleaned);
  if (intlHit) return intlHit;

  return searchDuckDuckGoProfile(cleaned);
}

function parseProfileHtml(html: string) {
  const unescaped = html.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  const title = extractPageTitle(html);

  // 1. Parse RSC JSON first (most complete and immune to CSS layout shifts)
  const playerData = extractRscJsonObject<any>(unescaped, 'playerData');
  const rscBatting = parseRscStatsTable(extractRscJsonObject<any>(unescaped, 'battingStats'));
  const rscBowling = parseRscStatsTable(extractRscJsonObject<any>(unescaped, 'bowlingStats'));

  // 2. Parse HTML Personal Information & H1 fallback
  let scrapedName = String(playerData?.name || '').trim();
  if (!scrapedName) {
    const h1Match =
      html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
      html.match(/<title>([^<]+?)\s+Profile/i);
    if (h1Match) {
      scrapedName = decodeEntities(h1Match[1].replace(/<[^>]+>/g, ''));
    }
  }

  const bioMap: Record<string, string> = {};
  const modernDivRegex = /<div[^>]*class="[^"]*w-1\/3[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div[^>]*class="[^"]*w-2\/3[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
  let modMatch;
  while ((modMatch = modernDivRegex.exec(html)) !== null) {
    const k = modMatch[1].replace(/<[^>]+>/g, '').trim().toLowerCase();
    const v = modMatch[2].replace(/<[^>]+>/g, '').trim();
    if (k && v) bioMap[k] = v;
  }

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
  const rawBorn = String(playerData?.DoB || playerData?.DoBFormat || bioMap['born'] || '').trim();
  const { dateOfBirth, age } = parseDobAndAge(rawBorn);

  // 4. Nationality
  let nationality = '';
  const intlCandidate = String(playerData?.intlTeam || '').trim();
  const countryHeader = html.match(/<h3[^>]*class="[^"]*cb-font-18[^"]*"[^>]*>([\s\S]*?)<\/h3>/i);
  const candidateText = [
    intlCandidate,
    countryHeader ? countryHeader[1].replace(/<[^>]+>/g, '').trim() : '',
    bioMap['birth place'] || '',
    String(playerData?.teams || ''),
    html.substring(0, 2500),
  ].join(' ');

  for (const nation of KNOWN_NATIONS) {
    if (new RegExp('\\b' + nation + '\\b', 'i').test(candidateText)) {
      nationality = nation;
      break;
    }
  }
  if (!nationality && intlCandidate && !/^teams$/i.test(intlCandidate)) {
    nationality = intlCandidate;
  }

  // 5. Role & Playing Styles
  const rawRole = String(playerData?.role || bioMap['role'] || '').trim();
  const { role, allrounderType } = mapRole(rawRole);
  const battingStyle = mapBattingStyle(String(playerData?.bat || bioMap['batting style'] || ''));
  const bowlingStyle = mapBowlingStyle(String(playerData?.bowl || bioMap['bowling style'] || ''));

  // 6. Stats tables (prefer RSC, fall back to HTML <table>)
  const htmlBatting = Object.keys(rscBatting).length > 0 ? rscBatting : parseTargetedHtmlTable(html, 'Batting Career Summary');
  const htmlBowling = Object.keys(rscBowling).length > 0 ? rscBowling : parseTargetedHtmlTable(html, 'Bowling Career Summary');

  return {
    title,
    scrapedName,
    bio: {
      name: scrapedName,
      dateOfBirth,
      age,
      nationality,
      role,
      allrounderType,
      battingStyle,
      bowlingStyle,
    },
    data: {
      batting: htmlBatting,
      bowling: htmlBowling,
    },
  };
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), { status, headers: CORS_JSON_HEADERS });
}

export async function handleScrapeCricbuzzRequest(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}));
    let targetInput = String(body.url || '').trim();

    if (!targetInput && body.profileId) {
      targetInput = `https://www.cricbuzz.com/profiles/${body.profileId}`;
    }

    if (!targetInput) {
      return jsonResponse({ success: false, error: 'Please enter a Cricbuzz profile URL, ID, or Player Name' });
    }

    let targetUrl = targetInput;
    let intendedSlugName = '';

    // Resolve shortcut keys, numeric IDs, URLs, or name queries
    const normalizedInput = targetInput.toLowerCase();
    if (/^\d+$/.test(targetInput)) {
      targetUrl = KNOWN_PLAYER_PROFILES[targetInput] || `https://www.cricbuzz.com/profiles/${targetInput}`;
    } else if (/^\d+\/[a-z0-9-]+$/i.test(targetInput)) {
      const idPart = targetInput.split('/')[0];
      const slugPart = targetInput.split('/')[1];
      intendedSlugName = slugPart.replace(/-/g, ' ');
      targetUrl =
        KNOWN_PLAYER_PROFILES[normalizedInput] ||
        KNOWN_PLAYER_PROFILES[slugPart.toLowerCase()] ||
        KNOWN_PLAYER_PROFILES[idPart] ||
        `https://www.cricbuzz.com/profiles/${targetInput}`;
    } else if (!targetInput.startsWith('http')) {
      intendedSlugName = targetInput;
      const direct = KNOWN_PLAYER_PROFILES[normalizedInput] || KNOWN_PLAYER_PROFILES[normalizedInput.replace(/\s+/g, '-')];
      const resolved = direct || (await searchCricbuzzProfile(targetInput));
      if (!resolved) {
        return jsonResponse({ success: false, error: `Could not find Cricbuzz profile for "${targetInput}"` });
      }
      targetUrl = resolved;
    } else {
      if (!targetUrl.includes('cricbuzz.com/')) {
        return jsonResponse({ success: false, error: 'Invalid URL. Must be a cricbuzz.com link or player name.' });
      }

      const urlMatch = targetUrl.match(/profiles\/(\d+)(?:\/([a-zA-Z0-9-]+))?/i);
      if (urlMatch) {
        const idNum = urlMatch[1];
        const rawSlug = (urlMatch[2] || '').toLowerCase();
        if (rawSlug) intendedSlugName = rawSlug.replace(/-/g, ' ');

        const override =
          KNOWN_PLAYER_PROFILES[`${idNum}/${rawSlug}`] ||
          KNOWN_PLAYER_PROFILES[rawSlug] ||
          KNOWN_PLAYER_PROFILES[idNum];
        if (override) {
          targetUrl = override;
        }
      }
    }

    let cricRes = await fetch(targetUrl, { redirect: 'follow', headers: DEFAULT_HEADERS });
    let html = cricRes.ok ? await cricRes.text() : '';
    let parsed = html ? parseProfileHtml(html) : null;

    const hasParsedStats = Boolean(
      parsed && (
        Object.keys(parsed.data.batting || {}).length > 0 ||
        Object.keys(parsed.data.bowling || {}).length > 0
      ),
    );

    const isInvalidOrMismatched =
      !parsed ||
      isGenericOrMissingPage(parsed.title, parsed.scrapedName, hasParsedStats) ||
      (intendedSlugName ? !namesMatchIntended(intendedSlugName, parsed.scrapedName, parsed.title) : false);

    // Fallback search resolution if ID pointed to wrong player or empty page
    if (isInvalidOrMismatched) {
      const lookupTerm = intendedSlugName || targetInput;
      const searchedUrl = await searchCricbuzzProfile(lookupTerm);
      if (searchedUrl && searchedUrl !== targetUrl) {
        targetUrl = searchedUrl;
        cricRes = await fetch(targetUrl, { redirect: 'follow', headers: DEFAULT_HEADERS });
        html = cricRes.ok ? await cricRes.text() : '';
        parsed = html ? parseProfileHtml(html) : null;
      }
    }

    const finalHasStats = Boolean(
      parsed && (
        Object.keys(parsed.data.batting || {}).length > 0 ||
        Object.keys(parsed.data.bowling || {}).length > 0
      ),
    );

    if (!parsed || !cricRes.ok || isGenericOrMissingPage(parsed.title, parsed.scrapedName, finalHasStats)) {
      return jsonResponse({
        success: false,
        error: `Cricbuzz profile not found or unavailable for "${intendedSlugName || targetInput}". Please verify the profile URL or player name.`,
      });
    }

    if (intendedSlugName && !namesMatchIntended(intendedSlugName, parsed.scrapedName, parsed.title)) {
      return jsonResponse({
        success: false,
        error: `Cricbuzz ID resolved to "${parsed.scrapedName || 'another player'}" instead of "${intendedSlugName}". Please paste the exact Cricbuzz URL or search by name.`,
      });
    }

    const hasStats =
      Object.keys(parsed.data.batting || {}).length > 0 ||
      Object.keys(parsed.data.bowling || {}).length > 0;
    const hasBio = Boolean(parsed.bio.name || parsed.bio.dateOfBirth);

    if (!hasStats && !hasBio) {
      return jsonResponse({
        success: false,
        error: `No profile bio or career statistics found on ${targetUrl}.`,
      });
    }

    const targetId = targetUrl.match(/profiles\/(\d+)/)?.[1] || '';

    return jsonResponse({
      success: true,
      sourceUrl: targetUrl,
      profileId: targetId,
      bio: parsed.bio,
      data: parsed.data,
    });
  } catch (err: any) {
    return jsonResponse({ success: false, error: err?.message || 'Scrape failed' });
  }
}

export function createCricbuzzOptionsResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    },
  });
}
