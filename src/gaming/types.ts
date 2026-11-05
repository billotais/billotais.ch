/** What a player did in a session. A player missing from a session counts as absent. */
export type Result = 'winner' | 'tie' | 'present';

/** A session as stored in `public/elca-gaming/<year>.json` (produced by `scripts/csv-to-json.mjs`). */
export interface RawSession {
  date: string; // YYYY-MM-DD
  game: string;
  complexity?: number; // BGG weight, defaults to 2.0
  url?: string;
  players: Record<string, Result>;
}

export interface Session {
  /** Stable key (also what a future database would use as primary key) */
  id: string;
  date: string;
  game: string;
  complexity: number;
  url: string | null;
  players: Record<string, Result>;
}

export interface Standing {
  name: string;
  total: number;
  ratio: number; // tv / tp
  bonus: number; // attendance bonus
  p25: number | null; // "present in more than 25% of the games" bonus; null before 2026
  tv: number; // win total, weighted by complexity
  tp: number; // games played
  wins: number;
  ties: number;
}

/** UI texts, one object per language (see `src/views/elca-gaming.astro`). */
export interface GamingText {
  loading: string;
  leaderboard: string;
  recent: string;
  games: string;
  activePlayers: string;
  mostWins: string;
  gamesN: string;
  complexity: string;
  players: string;
  loadError: string; // contains {year} and {error}
  win: string;
  wins: string;
  tie: string;
  ties: string;
  presentBonus: string;
  winTotal: string;
  gamesPlayed: string;
  ratio: string;
  attendanceBonus: string;
  total: string;
}
