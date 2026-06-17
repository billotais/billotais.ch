// Converts /public/gaming/*.csv to /public/gaming/*.json
// Run with: node scripts/csv-to-json.mjs

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');

const RESULT_MAP = { w: 'winner', t: 'tie', p: 'present' };

function convertCSV(text) {
  const lines = text.trim().split('\n').map(l => l.trimEnd());
  const sep = ';';
  const headers = lines[0].split(sep);
  const players = headers.slice(4);
  const sessions = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep);
    if (cols.length < 5) continue;
    const [date, game, complexity, url, ...results] = cols;
    if (!date || !game) continue;

    const playerResults = {};
    players.forEach((p, j) => {
      const code = (results[j] || '').trim();
      if (RESULT_MAP[code]) playerResults[p] = RESULT_MAP[code];
    });

    const entry = {
      date: date.trim(),
      game: game.trim(),
      complexity: parseFloat(complexity) || 2.0,
    };
    if (url && url.trim()) entry.url = url.trim();
    entry.players = playerResults;
    sessions.push(entry);
  }

  return sessions;
}

for (const year of ['2024', '2025', '2026']) {
  const csvPath = join(root, 'public', 'gaming', `${year}.csv`);
  const jsonPath = join(root, 'public', 'gaming', `${year}.json`);
  const text = readFileSync(csvPath, 'utf-8');
  const sessions = convertCSV(text);
  writeFileSync(jsonPath, JSON.stringify(sessions, null, 2), 'utf-8');
  console.log(`${year}: ${sessions.length} sessions → ${jsonPath}`);
}
