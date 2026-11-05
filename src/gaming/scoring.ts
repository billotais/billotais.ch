import type { RawSession, Result, Session, Standing } from './types';

const DEFAULT_COMPLEXITY = 2.0;

/** Raw rows -> sessions, oldest first. */
export function normalizeSessions(raw: RawSession[]): Session[] {
  return raw
    .map((s) => ({
      id: `${s.date}|${s.game}`,
      date: s.date,
      game: s.game,
      complexity: s.complexity ?? DEFAULT_COMPLEXITY,
      url: s.url || null,
      players: s.players,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const playersOf = (sessions: Session[]): string[] => [
  ...new Set(sessions.flatMap((s) => Object.keys(s.players))),
];

/**
 * Leaderboard. The formula depends on the year:
 *   2024/2025: total = win ratio + attendance × 0.1                          (no cap, no 25% bonus)
 *   2026+:     total = win ratio + min(attendance × 0.1, 1) + present-25% bonus
 * where win ratio = (wins + ties/2, each weighted by the game's complexity) / games played.
 */
export function computeStandings(sessions: Session[], year: string): Standing[] {
  const players = playersOf(sessions);
  const stats = Object.fromEntries(players.map((p) => [p, { tv: 0, tp: 0, wins: 0, ties: 0 }]));

  for (const s of sessions) {
    for (const p of players) {
      const r: Result | undefined = s.players[p];
      if (!r) continue;
      stats[p].tp++;
      if (r === 'winner') {
        stats[p].tv += s.complexity;
        stats[p].wins++;
      } else if (r === 'tie') {
        stats[p].tv += 0.5 * s.complexity;
        stats[p].ties++;
      }
    }
  }

  const maxPlayed = Math.max(...players.map((p) => stats[p].tp), 1);
  const since2026 = parseInt(year) >= 2026;

  return players
    .map((name): Standing => {
      const { tv, tp, wins, ties } = stats[name];
      const ratio = tp > 0 ? tv / tp : 0;
      if (since2026) {
        const bonus = Math.min(tp * 0.1, 1);
        const p25 = tp > maxPlayed * 0.25 ? 1 : 0;
        return { name, total: ratio + bonus + p25, ratio, bonus, p25, tv, tp, wins, ties };
      }
      const bonus = tp * 0.1;
      return { name, total: ratio + bonus, ratio, bonus, p25: null, tv, tp, wins, ties };
    })
    .sort((a, b) => b.total - a.total || b.tp - a.tp);
}
