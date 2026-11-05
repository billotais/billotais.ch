import { describe, expect, it } from 'vitest';
import { computeStandings, normalizeSessions } from './scoring';

const sessions = normalizeSessions([
  { date: '2026-02-01', game: 'B', complexity: 3, players: { Ann: 'winner', Bob: 'present', Cy: 'present' } },
  { date: '2026-01-01', game: 'A', players: { Ann: 'tie', Bob: 'tie' } },
]);

describe('normalizeSessions', () => {
  it('sorts by date, defaults the complexity and builds a stable id', () => {
    expect(sessions.map((s) => s.id)).toEqual(['2026-01-01|A', '2026-02-01|B']);
    expect(sessions[0].complexity).toBe(2);
    expect(sessions[0].url).toBeNull();
  });
});

describe('computeStandings', () => {
  it('2026 formula: ratio + capped attendance + 25% bonus', () => {
    const [ann, bob, cy] = computeStandings(sessions, '2026');
    // Ann: tie on A (0.5 × 2) + win on B (3) over 2 games
    expect(ann).toMatchObject({ name: 'Ann', tv: 4, tp: 2, wins: 1, ties: 1, ratio: 2, bonus: 0.2, p25: 1 });
    expect(ann.total).toBeCloseTo(3.2);
    expect(bob).toMatchObject({ name: 'Bob', tv: 1, tp: 2, ratio: 0.5, wins: 0, ties: 1 });
    expect(cy).toMatchObject({ name: 'Cy', tv: 0, tp: 1, p25: 1 });
  });

  it('caps the attendance bonus at 1 from 2026', () => {
    const many = normalizeSessions(
      Array.from({ length: 15 }, (_, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, game: `G${i}`, players: { Ann: 'present' as const } })),
    );
    expect(computeStandings(many, '2026')[0].bonus).toBe(1);
    expect(computeStandings(many, '2025')[0].bonus).toBeCloseTo(1.5);
  });

  it('2024/2025 formula has no 25% bonus', () => {
    const [ann] = computeStandings(sessions, '2025');
    expect(ann.p25).toBeNull();
    expect(ann.total).toBeCloseTo(2 + 0.2);
  });

  it('breaks ties by games played', () => {
    const s = normalizeSessions([
      { date: '2025-01-01', game: 'A', complexity: 1, players: { X: 'present', Y: 'present' } },
      { date: '2025-01-02', game: 'B', complexity: 1, players: { X: 'present' } },
    ]);
    expect(computeStandings(s, '2025').map((p) => p.name)).toEqual(['X', 'Y']);
  });
});
