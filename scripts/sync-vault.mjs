/**
 * Reads Obsidian vault data and writes clean JSON files to src/data/.
 * Also syncs TV shows from Trakt + TMDB (requires API keys in .env).
 * Run with: npm run sync
 *
 * Vault path: VAULT_PATH env var → ./vault submodule → local default
 * Trakt:      TRAKT_CLIENT_ID (trakt.tv/oauth/applications)
 * TMDB:       TMDB_READ_TOKEN (developers.themoviedb.org → API → Read Access Token)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import matter from "gray-matter";
import { exit } from "process";

// Load .env if present
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] ??= m[2].trim().replace(/^["']|["']$/g, "");
  }
}

const VAULT =
  process.env.VAULT_PATH ?? (existsSync("./vault") ? "./vault" : "/Users/billotais/Documents/Notes/private");

if (!existsSync(VAULT)) {
  console.error(`Vault not found at "${VAULT}". Set VAULT_PATH env var or check out the submodule.`);
  process.exit(1);
}

console.log(`Syncing from vault: ${VAULT}`);

function slug(filename) {
  return basename(filename, ".md")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function readCollection(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = readFileSync(join(dir, f), "utf8").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
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

// Vault statuses are lowercase slugs ("owned", "preorder", "wanted");
// the site renders them as labels.
const STATUS_LABELS = { owned: "Owned", preorder: "Pre-Order", wanted: "Wanted" };
function titleCaseStatus(val) {
  if (!val) return null;
  const key = String(val).toLowerCase().replace(/[^a-z]/g, "");
  return STATUS_LABELS[key] ?? String(val);
}

// ── Board games ──────────────────────────────────────────────────────────────
// Path unchanged. Notes no longer carry a `title` property — the filename is it.
const boardgameFiles = readCollection(join(VAULT, "Media DB/boardgames"));
const boardgames = boardgameFiles
  .map((d) => ({
    slug: slug(d._filename),
    title: d.title ?? basename(d._filename, ".md"),
    image: d.image ?? null,
    summary: d.summary ?? null,
    year: d.year ?? null,
    onlineRating: asNumber(d.onlineRating),
    personalRating: asNumber(d.personalRating),
    minPlayers: asNumber(d.minPlayers),
    maxPlayers: asNumber(d.maxPlayers),
    playtime: d.playtime ?? null,
    categories: asArray(d.bggCategories),
    mechanisms: asArray(d.bggMechanisms),
    bggLink: asArray(d.links)[0] ?? null,
    isExpansion: asArray(d.tags).some((t) => String(t).includes("expansion")),
  }))
  .sort((a, b) => (b.personalRating ?? -1) - (a.personalRating ?? -1));

writeFileSync("src/data/boardgames.json", JSON.stringify(boardgames, null, 2));
console.log(`  Board games: ${boardgames.length} entries`);

// ── Video games ───────────────────────────────────────────────────────────────
const gameFiles = readCollection(join(VAULT, "Media DB/games"));
const videogames = gameFiles
  .map((d) => ({
    slug: slug(d._filename),
    title: d.title ?? basename(d._filename, ".md"),
    image: d.image ?? null,
    year: d.year ?? null,
    onlineRating: asNumber(d.onlineRating),
    personalRating: asNumber(d.personalRating),
    genres: asArray(d.genres),
    developers: asArray(d.developers),
    steamUrl: d.url ?? null,
  }))
  .sort((a, b) => (b.personalRating ?? -1) - (a.personalRating ?? -1));

writeFileSync("src/data/videogames.json", JSON.stringify(videogames, null, 2));
console.log(`  Video games: ${videogames.length} entries`);

// ── Teas ─────────────────────────────────────────────────────────────────────
// Vault: Collections/Teas (was Concepts/Achats/Thés, French property names).
// "wanted" teas are wishlist entries with no brewing data — not part of the collection.
const teaDir = join(VAULT, "Collections/Teas");
const teaFiles = readCollection(teaDir);
const teas = teaFiles
  .filter((d) => d.status !== "wanted")
  .map((d) => ({
    slug: slug(d._filename),
    name: basename(d._filename, ".md"),
    type: asArray(d.teaType)[0] ?? null,
    types: asArray(d.teaType),
    brand: d.brand ?? null,
    personalRating: asNumber(d.personalRating),
    infusionTime: d.steepTime ?? null,
    temperature: d.steepTemp ? `${d.steepTemp}°C` : null,
    ingredients: asArray(d.ingredients).filter(Boolean),
    purchasePlace: d.shop ?? null,
    sugar: d.sugar ?? null,
    status: titleCaseStatus(d.status),
  }))
  .sort((a, b) => (b.personalRating ?? -1) - (a.personalRating ?? -1));

writeFileSync("src/data/teas.json", JSON.stringify(teas, null, 2));
console.log(`  Teas: ${teas.length} entries`);

// ── Books ─────────────────────────────────────────────────────────────────────
const bookFiles = readCollection(join(VAULT, "Media DB/books"));
const books = bookFiles
  .map((d) => ({
    slug: slug(d._filename),
    title: d.title ?? basename(d._filename, ".md"),
    image: d.image ?? null,
    year: d.year ?? null,
    authors: asArray(d.author),
    personalRating: asNumber(d.personalRating),
    read: d.read ?? false,
    openLibraryUrl: d.url ?? null,
  }))
  .sort((a, b) => (b.personalRating ?? -1) - (a.personalRating ?? -1));

writeFileSync("src/data/books.json", JSON.stringify(books, null, 2));
console.log(`  Books: ${books.length} entries`);

// ── Vinyls ────────────────────────────────────────────────────────────────────
// Vault: Collections/Vinyls (was Concepts/Achats/Vinyls).
const vinylDir = join(VAULT, "Collections/Vinyls");
const vinylFiles = readCollection(vinylDir);
const vinyls = vinylFiles
  .map((d) => ({
    slug: slug(d._filename),
    name: basename(d._filename, ".md"),
    artist: d.artist ?? null,
    album: d.album ?? null,
    edition: d.edition ?? null,
    status: titleCaseStatus(d.status),
    personalRating: asNumber(d.personalRating),
    image: d.image ?? null,
  }))
  .sort((a, b) => (b.personalRating ?? -1) - (a.personalRating ?? -1));

writeFileSync("src/data/vinyls.json", JSON.stringify(vinyls, null, 2));
console.log(`  Vinyls: ${vinyls.length} entries`);

// ── Races ─────────────────────────────────────────────────────────────────────
function parseTime(str) {
  if (!str || str === "-") return null;
  str = String(str).trim();
  if (str.toUpperCase() === "DNF") return "DNF";
  const h = str.match(/(\d+)h/);
  const m = str.match(/(\d+)m/);
  const s = str.match(/(\d+)s/);
  const total = (h ? parseInt(h[1]) * 3600 : 0) + (m ? parseInt(m[1]) * 60 : 0) + (s ? parseInt(s[1]) : 0);
  return total > 0 ? total : null;
}

function formatTime(seconds) {
  if (!seconds || seconds === "DNF") return seconds;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

function parseDist(str) {
  if (!str) return null;
  const n = parseFloat(String(str).replace(/[^\d.]/g, ""));
  return isNaN(n) ? null : n;
}

function asISODate(val) {
  if (!val) return null;
  if (val instanceof Date) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, "0");
    const d = String(val.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(val).slice(0, 10);
}

// Vault: Entities/Events (was Concepts/Evenements). Races are now flagged by
// `type: race` rather than a "race" tag (tags are `sport/running` now).
const raceFiles = readCollection(join(VAULT, "Entities/Events"));
const races = raceFiles
  .filter((d) => d.type === "race" || asArray(d.tags).some((t) => String(t).includes("race")))
  .map((d) => {
    const name = basename(d._filename, ".md");
    const distKm = parseDist(d.distance);
    const finalSec = parseTime(d.finalTime);
    const pace = finalSec && finalSec !== "DNF" && distKm ? Math.round(finalSec / distKm) : null;
    const today = new Date().toISOString().slice(0, 10);
    const raceDate = asISODate(d.date);
    return {
      slug: slug(d._filename),
      name,
      date: raceDate,
      upcoming: raceDate ? raceDate > today : false,
      distance: distKm,
      goalTime: d.targetTime && d.targetTime !== "-" ? String(d.targetTime) : null,
      finalTime: finalSec === "DNF" ? "DNF" : finalSec ? formatTime(finalSec) : null,
      paceSec: pace,
      pace: pace ? `${Math.floor(pace / 60)}:${String(pace % 60).padStart(2, "0")} /km` : null,
      dnf: finalSec === "DNF",
    };
  })
  .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

writeFileSync("src/data/races.json", JSON.stringify(races, null, 2));
console.log(`  Races: ${races.length} entries`);

// ── TV Shows (Trakt + TMDB) ───────────────────────────────────────────────────
const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID;
const TRAKT_ACCESS_TOKEN = process.env.TRAKT_ACCESS_TOKEN;
const TMDB_READ_TOKEN = process.env.TMDB_READ_TOKEN;
const TRAKT_USERNAME = "billotais";

if (!TRAKT_CLIENT_ID) {
  console.log("  TV shows: skipped (set TRAKT_CLIENT_ID in .env to enable)");
  if (!existsSync("src/data/tvshows.json")) writeFileSync("src/data/tvshows.json", "[]");
} else {
  const traktHeaders = {
    "Content-Type": "application/json",
    "trakt-api-version": "2",
    "trakt-api-key": TRAKT_CLIENT_ID,
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    // Access token needed for private profiles (run npm run trakt-auth to generate)
    ...(TRAKT_ACCESS_TOKEN ? { Authorization: `Bearer ${TRAKT_ACCESS_TOKEN}` } : {}),
  };

  async function traktFetch(url) {
    const resp = await fetch(url, { headers: traktHeaders });
    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Trakt returned non-JSON from ${url}\nStatus: ${resp.status}\nBody: ${text.slice(0, 500)}`);
    }
    if (!resp.ok) throw new Error(`Trakt error from ${url}: ${resp.status} – ${JSON.stringify(data).slice(0, 200)}`);
    const pageCount = parseInt(resp.headers.get("X-Pagination-Page-Count") ?? "1", 10);
    return { data, pageCount };
  }

  // Write key=value pairs back to .env, replacing existing keys in place.
  function updateEnvFile(updates) {
    const lines = existsSync(".env") ? readFileSync(".env", "utf8").split("\n") : [];
    for (const [key, val] of Object.entries(updates)) {
      const idx = lines.findIndex((l) => new RegExp(`^\\s*${key}\\s*=`).test(l));
      if (idx >= 0) lines[idx] = `${key}=${val}`;
      else lines.push(`${key}=${val}`);
    }
    writeFileSync(".env", lines.join("\n"));
  }

  // Exchange the refresh token for a fresh access token, persisting both.
  // Trakt rotates the refresh token on each use, so we must save the new one.
  async function refreshTraktToken() {
    const refreshToken = process.env.TRAKT_REFRESH_TOKEN;
    const clientSecret = process.env.TRAKT_CLIENT_SECRET;
    if (!refreshToken || !clientSecret) return false;
    const resp = await fetch("https://api.trakt.tv/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": traktHeaders["User-Agent"] },
      body: JSON.stringify({
        refresh_token: refreshToken,
        client_id: TRAKT_CLIENT_ID,
        client_secret: clientSecret,
        redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
        grant_type: "refresh_token",
      }),
    });
    if (!resp.ok) {
      console.warn(`  Trakt token refresh failed (${resp.status}) — falling back to existing token.`);
      return false;
    }
    const tok = JSON.parse(await resp.text());
    traktHeaders.Authorization = `Bearer ${tok.access_token}`;
    process.env.TRAKT_ACCESS_TOKEN = tok.access_token;
    process.env.TRAKT_REFRESH_TOKEN = tok.refresh_token;
    updateEnvFile({ TRAKT_ACCESS_TOKEN: tok.access_token, TRAKT_REFRESH_TOKEN: tok.refresh_token });
    console.log("  Trakt token refreshed and saved to .env");
    return true;
  }

  // Refresh the access token if it has expired (probe an auth-only endpoint).
  // The public /users/{id} endpoints won't 401 on a stale token, so we check
  // /users/settings, which requires a valid token.
  if (TRAKT_ACCESS_TOKEN && process.env.TRAKT_REFRESH_TOKEN) {
    let needsRefresh = process.env.TRAKT_FORCE_REFRESH === "1";
    if (!needsRefresh) {
      const probe = await fetch("https://api.trakt.tv/users/settings", { headers: traktHeaders });
      needsRefresh = probe.status === 401;
    }
    if (needsRefresh) {
      console.log("  Trakt access token expired — refreshing…");
      await refreshTraktToken();
    }
  }

  // Fetch all watched shows with full show metadata (extended=full → no seasons data)
  const watched = [];
  let watchedPage = 1;
  while (true) {
    const { data: pageData, pageCount } = await traktFetch(
      `https://api.trakt.tv/users/${TRAKT_USERNAME}/watched/shows?extended=full&page=${watchedPage}&limit=100`,
    );
    watched.push(...pageData);
    if (watchedPage >= pageCount) break;
    watchedPage++;
  }

  // Fetch ratings (all pages)
  const ratings = {};
  let page = 1;
  while (true) {
    const r = await fetch(`https://api.trakt.tv/users/${TRAKT_USERNAME}/ratings/shows?page=${page}&limit=100`, {
      headers: traktHeaders,
    });
    if (!r.ok) break;
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Trakt /ratings returned non-JSON:\nBody: ${text.slice(0, 500)}`);
    }
    if (!data.length) break;
    for (const entry of data) ratings[entry.show.ids.trakt] = entry.rating;
    const rPageCount = parseInt(r.headers.get("X-Pagination-Page-Count") ?? "1", 10);
    if (page >= rPageCount) break;
    page++;
  }

  // Fetch TMDB posters in parallel batches of 10
  const BATCH = 10;
  const shows = [];
  for (let i = 0; i < watched.length; i += BATCH) {
    const batch = watched.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map(async (item) => {
        const s = item.show;
        let image = null;
        let tmdbNext = null; // next_episode_to_air (scheduled, not yet aired)
        let tmdbLast = null; // last_episode_to_air (most recent to air)
        if (TMDB_READ_TOKEN && s.ids.tmdb) {
          try {
            const tr = await fetch(`https://api.themoviedb.org/3/tv/${s.ids.tmdb}`, {
              headers: { Authorization: `Bearer ${TMDB_READ_TOKEN}` },
            });
            const td = await tr.json();
            if (td.poster_path) image = `https://image.tmdb.org/t/p/w300${td.poster_path}`;
            tmdbNext = td.next_episode_to_air ?? null;
            tmdbLast = td.last_episode_to_air ?? null;
          } catch {
            /* skip image on error */
          }
        }

        // The list endpoints no longer return a seasons breakdown, so we get
        // watched/aired episode counts from the per-show progress endpoint
        // (requires OAuth — needs TRAKT_ACCESS_TOKEN).
        let episodesWatched = 0;
        let episodesAired = s.aired_episodes ?? 0;
        let nextEpisodeAiredAt = null; // air date of the first unwatched episode
        if (TRAKT_ACCESS_TOKEN) {
          try {
            const pr = await fetch(`https://api.trakt.tv/shows/${s.ids.trakt}/progress/watched`, {
              headers: traktHeaders,
            });
            if (pr.ok) {
              const prog = JSON.parse(await pr.text());
              episodesWatched = prog.completed ?? 0;
              if (prog.aired != null) episodesAired = prog.aired;
              nextEpisodeAiredAt = prog.next_episode?.first_aired ?? null;
            }
          } catch {
            /* fall back to zero / aired_episodes */
          }
        }

        const upToDate = episodesAired > 0 && episodesWatched >= episodesAired;
        const lastWatchedAt = item.last_watched_at ?? null;
        const MONTH = 1000 * 60 * 60 * 24 * 30;
        const monthsSinceWatch = lastWatchedAt
          ? (Date.now() - new Date(lastWatchedAt).getTime()) / MONTH
          : Infinity;
        // Behind only because new episodes dropped recently — not truly dropped.
        const monthsSinceNextAired = nextEpisodeAiredAt
          ? (Date.now() - new Date(nextEpisodeAiredAt).getTime()) / MONTH
          : Infinity;
        // The latest aired season is still airing when the next scheduled
        // episode belongs to the same season as the most recent one to air.
        // A next episode in a *later* season is a future season (metadata),
        // so the current season counts as finished.
        const seasonCurrentlyAiring = !!(
          tmdbNext && tmdbLast && tmdbNext.season_number === tmdbLast.season_number
        );

        let watchStatus;
        if (upToDate && seasonCurrentlyAiring) watchStatus = 'up_to_date';
        else if (upToDate) watchStatus = 'completed';
        else if (monthsSinceWatch <= 6) watchStatus = 'watching';
        else if (monthsSinceNextAired <= 2) watchStatus = 'new_episodes';
        else watchStatus = 'dropped';

        return {
          slug: s.ids.slug,
          title: s.title,
          year: s.year ?? null,
          overview: s.overview ?? null,
          status: s.status ?? null,
          network: s.network ?? null,
          genres: (s.genres ?? []).slice(0, 3),
          runtime: s.runtime ?? null,
          certification: s.certification ?? null,
          onlineRating: s.rating ? Math.round(s.rating * 10) / 10 : null,
          personalRating: ratings[s.ids.trakt] ?? null,
          episodesWatched,
          episodesAired,
          watchStatus,
          lastWatchedAt,
          image,
          traktUrl: `https://trakt.tv/shows/${s.ids.slug}`,
          imdbId: s.ids.imdb ?? null,
        };
      }),
    );
    shows.push(...results);
    process.stdout.write(`\r  TV shows: fetched ${Math.min(i + BATCH, watched.length)}/${watched.length}...`);
  }
  process.stdout.write("\n");

  shows.sort((a, b) => (b.personalRating ?? -1) - (a.personalRating ?? -1));
  writeFileSync("src/data/tvshows.json", JSON.stringify(shows, null, 2));
  console.log(`  TV shows: ${shows.length} entries (${Object.keys(ratings).length} rated)`);
}

console.log('Sync complete. Run "npm run build" to rebuild the site.');
