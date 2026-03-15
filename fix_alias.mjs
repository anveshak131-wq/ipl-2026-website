import { readFileSync, writeFileSync } from 'fs';

const file = 'src/app/ipl-admin-2026/matches/page.tsx';
let c = readFileSync(file, 'utf8');

const OLD = "const findTeam = (raw: string) => {\n            const norm = normaliseName(raw);\n            if (!norm || norm === 'tbd') return null;";

const NEW = `const findTeam = (raw: string) => {
            // Historical franchise renames — map old names to current names
            const HISTORICAL_ALIASES: Record<string, string> = {
                'kings xi punjab':     'Punjab Kings',
                'kings eleven punjab': 'Punjab Kings',
                'delhi daredevils':    'Delhi Capitals',
            };
            const resolved = HISTORICAL_ALIASES[raw.trim().toLowerCase()] ?? raw;
            const norm = normaliseName(resolved);
            if (!norm || norm === 'tbd') return null;`;

if (!c.includes(OLD)) {
  console.error('OLD string not found in file!');
  process.exit(1);
}

c = c.replace(OLD, NEW);
writeFileSync(file, c, 'utf8');
console.log('SUCCESS — historical alias map added to findTeam');
