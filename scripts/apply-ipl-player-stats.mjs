import fs from 'node:fs';
import path from 'node:path';

const apiBaseUrl = process.env.API_BASE_URL || 'https://ipl-2026-website.pages.dev';
const token = process.env.ADMIN_TOKEN || '';
const apply = process.env.APPLY === '1';
const inputPath = process.env.INPUT || path.join(process.cwd(), 'generated', 'ipl_players_stats_filled.json');

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const players = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(players) || players.length === 0) {
  console.error('Input file must contain a non-empty players array.');
  process.exit(1);
}

if (apply && !token) {
  console.error('ADMIN_TOKEN is required when APPLY=1.');
  process.exit(1);
}

const changedCore = players.filter((player) => {
  const stats = player.stats || {};
  return Number(stats.matches || 0) > 0 || Number(stats.runs || 0) > 0 || Number(stats.wickets || 0) > 0;
});

console.log(`Loaded ${players.length} players from ${inputPath}`);
console.log(`Players with non-zero core stats: ${changedCore.length}`);
console.log(apply ? `Applying updates to ${apiBaseUrl}` : 'Dry run only. Set APPLY=1 and ADMIN_TOKEN to write.');

if (!apply) {
  process.exit(0);
}

const backupResponse = await fetch(`${apiBaseUrl}/api/admin/backup-players?action=create`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

if (!backupResponse.ok) {
  const body = await backupResponse.text();
  console.error(`Backup failed (${backupResponse.status}): ${body}`);
  process.exit(1);
}

const backup = await backupResponse.json();
console.log(`Created backup: ${backup.backup?.key || 'unknown key'}`);

let updated = 0;
let failed = 0;

for (const player of players) {
  const response = await fetch(`${apiBaseUrl}/api/players`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(player),
  });

  if (!response.ok) {
    failed += 1;
    const body = await response.text();
    console.error(`Failed ${player.id} ${player.name} (${response.status}): ${body}`);
    continue;
  }

  updated += 1;
  if (updated % 25 === 0) {
    console.log(`Updated ${updated}/${players.length}`);
  }
}

console.log(`Done. Updated: ${updated}. Failed: ${failed}.`);
if (failed > 0) {
  process.exit(1);
}
