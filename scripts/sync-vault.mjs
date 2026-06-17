/**
 * Reads Obsidian vault data and writes clean JSON files to src/data/.
 * Also syncs TV shows from Trakt + TMDB (requires API keys in .env).
 * Run with: npm run sync
 *
 * Vault path: VAULT_PATH env var → ./vault submodule → local default
 * Trakt:      TRAKT_CLIENT_ID (trakt.tv/oauth/applications)
 * TMDB:       TMDB_READ_TOKEN (developers.themoviedb.org → API → Read Access Token)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join, basename } from 'path';
import matter from 'gray-matter';

// Load .env if present
if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const VAULT =
  process.env.VAULT_PATH ??
  (existsSync('./vault') ? './vault' : '/Users/billotais/Documents/Notes/private');

if (!existsSync(VAULT)) {
  console.error(`Vault not found at "${VAULT}". Set VAULT_PATH env var or check out the submodule.`);
  process.exit(1);
}

console.log(`Syncing from vault: ${VAULT}`);

function slug(filename) {
  return basename(filename, '.md')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function readCollection(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const raw = readFileSync(join(dir, f), 'utf8')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
      try {
        const { data } = matter(raw);
        return { _filename: f, ...data };
      } catch {
        console.warn(`  Warning: skipping ${f} (YAML parse error)`);
        return null;
      }
    })
    .filter(Boolean);
}

function asArray(val) {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function asNumber(val) {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

// ── Board games ──────────────────────────────────────────────────────────────
const boardgameFiles = readCollection(join(VAULT, 'Media DB/boardgames'));
const boardgames = boardgameFiles
  .map(d => ({
    slug:           slug(d._filename),
    title:          d.title ?? basename(d._filename, '.md'),
    image:          d.image ?? null,
    summary:        d.summary ?? null,
    year:           d.year ?? null,
    onlineRating:   asNumber(d.onlineRating),
    personalRating: asNumber(d.personalRating),
    minPlayers:     asNumber(d.minPlayers),
    maxPlayers:     asNumber(d.maxPlayers),
    playtime:       d.playtime ?? null,
    categories:     asArray(d.bggCategories),
    mechanisms:     asArray(d.bggMechanisms),
    bggLink:        asArray(d.links)[0] ?? null,
    isExpansion:    asArray(d.tags).some(t => String(t).includes('expansion')),
  }))
  .sort((a, b) => (b.personalRating ?? -1) - (a.personalRating ?? -1));

writeFileSync('src/data/boardgames.json', JSON.stringify(boardgames, null, 2));
console.log(`  Board games: ${boardgames.length} entries`);

// ── Video games ───────────────────────────────────────────────────────────────
const gameFiles = readCollection(join(VAULT, 'Media DB/games'));
const videogames = gameFiles
  .map(d => ({
    slug:           slug(d._filename),
    title:          d.title ?? basename(d._filename, '.md'),
    image:          d.image ?? null,
    year:           d.year ?? null,
    onlineRating:   asNumber(d.onlineRating),
    personalRating: asNumber(d.personalRating),
    genres:         asArray(d.genres),
    developers:     asArray(d.developers),
    steamUrl:       d.url ?? null,
  }))
  .sort((a, b) => (b.personalRating ?? -1) - (a.personalRating ?? -1));

writeFileSync('src/data/videogames.json', JSON.stringify(videogames, null, 2));
console.log(`  Video games: ${videogames.length} entries`);

// ── Teas ─────────────────────────────────────────────────────────────────────
const teaDir = join(VAULT, 'Concepts/Achats/Thés');
const teaFiles = readCollection(teaDir);
const teas = teaFiles
  .map(d => ({
    slug:           slug(d._filename),
    name:           basename(d._filename, '.md'),
    type:           d['Type de thé'] ?? null,
    brand:          d['Marque'] ?? null,
    personalRating: asNumber(d['Note']),
    infusionTime:   d['Durée infusion'] ?? null,
    temperature:    d['Température Infusion'] ? `${d['Température Infusion']}°C` : null,
    ingredients:    asArray(d['Ingrédients']).filter(Boolean),
    purchasePlace:  d['Lieu d\'achat'] ?? null,
  }))
  .sort((a, b) => (b.personalRating ?? -1) - (a.personalRating ?? -1));

writeFileSync('src/data/teas.json', JSON.stringify(teas, null, 2));
console.log(`  Teas: ${teas.length} entries`);

// ── Books ─────────────────────────────────────────────────────────────────────
const bookFiles = readCollection(join(VAULT, 'Media DB/books'));
const books = bookFiles
  .map(d => ({
    slug:           slug(d._filename),
    title:          d.title ?? basename(d._filename, '.md'),
    image:          d.image ?? null,
    year:           d.year ?? null,
    authors:        asArray(d.author),
    personalRating: asNumber(d.personalRating),
    read:           d.read ?? false,
    openLibraryUrl: d.url ?? null,
  }))
  .sort((a, b) => (b.personalRating ?? -1) - (a.personalRating ?? -1));

writeFileSync('src/data/books.json', JSON.stringify(books, null, 2));
console.log(`  Books: ${books.length} entries`);

// ── Races ─────────────────────────────────────────────────────────────────────
function parseTime(str) {
  if (!str || str === '-') return null;
  str = String(str).trim();
  if (str.toUpperCase() === 'DNF') return 'DNF';
  const h = str.match(/(\d+)h/);
  const m = str.match(/(\d+)m/);
  const s = str.match(/(\d+)s/);
  const total = (h ? parseInt(h[1]) * 3600 : 0)
              + (m ? parseInt(m[1]) * 60 : 0)
              + (s ? parseInt(s[1]) : 0);
  return total > 0 ? total : null;
}

function formatTime(seconds) {
  if (!seconds || seconds === 'DNF') return seconds;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
  return `${m}m ${String(s).padStart(2,'0')}s`;
}

function parseDist(str) {
  if (!str) return null;
  const n = parseFloat(String(str).replace(/[^\d.]/g, ''));
  return isNaN(n) ? null : n;
}

function asISODate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const d = String(val.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).slice(0, 10);
}

const raceFiles = readCollection(join(VAULT, 'Concepts/Evenements'));
const races = raceFiles
  .filter(d => asArray(d.tags).some(t => String(t).includes('race')))
  .map(d => {
    const name = basename(d._filename, '.md');
    const distKm = parseDist(d.distance);
    const finalSec = parseTime(d['temps-final']);
    const pace = (finalSec && finalSec !== 'DNF' && distKm)
      ? Math.round(finalSec / distKm)
      : null;
    const today = new Date().toISOString().slice(0, 10);
    const raceDate = asISODate(d.date);
    return {
      slug:      slug(d._filename),
      name,
      date:      raceDate,
      upcoming:  raceDate ? raceDate > today : false,
      distance:  distKm,
      goalTime:  d['temps-objectif'] && d['temps-objectif'] !== '-' ? String(d['temps-objectif']) : null,
      finalTime: finalSec === 'DNF' ? 'DNF' : (finalSec ? formatTime(finalSec) : null),
      paceSec:   pace,
      pace:      pace ? `${Math.floor(pace/60)}:${String(pace%60).padStart(2,'0')} /km` : null,
      dnf:       finalSec === 'DNF',
    };
  })
  .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));

writeFileSync('src/data/races.json', JSON.stringify(races, null, 2));
console.log(`  Races: ${races.length} entries`);

// ── TV Shows (Trakt + TMDB) ───────────────────────────────────────────────────
const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID;
const TRAKT_ACCESS_TOKEN = process.env.TRAKT_ACCESS_TOKEN;
const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;
const TRAKT_USERNAME = 'billotais';

if (!TRAKT_CLIENT_ID) {
  console.log('  TV shows: skipped (set TRAKT_CLIENT_ID in .env to enable)');
  if (!existsSync('src/data/tvshows.json')) writeFileSync('src/data/tvshows.json', '[]');
} else {
  const traktHeaders = {
    'Content-Type': 'application/json',
    'trakt-api-version': '2',
    'trakt-api-key': TRAKT_CLIENT_ID,
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    // Access token needed for private profiles (run npm run trakt-auth to generate)
    ...(TRAKT_ACCESS_TOKEN ? { Authorization: `Bearer ${TRAKT_ACCESS_TOKEN}` } : {}),
  };

  // Fetch all watched shows (extended=full gives genres, network, status, etc.)
  const watchedResp = await fetch(
    `https://api.trakt.tv/users/${TRAKT_USERNAME}/watched/shows?extended=full`,
    { headers: traktHeaders }
  );
  if (!watchedResp.ok) throw new Error(`Trakt /watched: ${watchedResp.status} ${watchedResp.statusText}`);
  const watched = await watchedResp.json();

  // Fetch ratings (all pages)
  const ratings = {};
  let page = 1;
  while (true) {
    const r = await fetch(
      `https://api.trakt.tv/users/${TRAKT_USERNAME}/ratings/shows?page=${page}&limit=1000`,
      { headers: traktHeaders }
    );
    if (!r.ok) break;
    const data = await r.json();
    if (!data.length) break;
    for (const entry of data) ratings[entry.show.ids.trakt] = entry.rating;
    if (data.length < 1000) break;
    page++;
  }

  // Fetch TMDB posters in parallel batches of 10
  const BATCH = 10;
  const shows = [];
  for (let i = 0; i < watched.length; i += BATCH) {
    const batch = watched.slice(i, i + BATCH);
    const results = await Promise.all(batch.map(async (item) => {
      const s = item.show;
      let image = null;
      if (TMDB_READ_TOKEN && s.ids.tmdb) {
        try {
          const tr = await fetch(`https://api.themoviedb.org/3/tv/${s.ids.tmdb}`, {
            headers: { Authorization: `Bearer ${TMDB_READ_TOKEN}` },
          });
          const td = await tr.json();
          if (td.poster_path) image = `https://image.tmdb.org/t/p/w300${td.poster_path}`;
        } catch { /* skip image on error */ }
      }
      return {
        slug:           s.ids.slug,
        title:          s.title,
        year:           s.year ?? null,
        overview:       s.overview ?? null,
        status:         s.status ?? null,
        network:        s.network ?? null,
        genres:         (s.genres ?? []).slice(0, 3),
        runtime:        s.runtime ?? null,
        onlineRating:   s.rating ? Math.round(s.rating * 10) / 10 : null,
        personalRating: ratings[s.ids.trakt] ?? null,
        image,
        traktUrl:       `https://trakt.tv/shows/${s.ids.slug}`,
        imdbId:         s.ids.imdb ?? null,
      };
    }));
    shows.push(...results);
    process.stdout.write(`\r  TV shows: fetched ${Math.min(i + BATCH, watched.length)}/${watched.length}...`);
  }
  process.stdout.write('\n');

  shows.sort((a, b) => (b.personalRating ?? -1) - (a.personalRating ?? -1));
  writeFileSync('src/data/tvshows.json', JSON.stringify(shows, null, 2));
  console.log(`  TV shows: ${shows.length} entries (${Object.keys(ratings).length} rated)`);
}

console.log('Sync complete. Run "npm run build" to rebuild the site.');
