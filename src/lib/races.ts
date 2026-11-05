import races from '../data/races.json';
import { dateLocale, type Lang } from '../i18n';

export type Race = (typeof races)[number];
export type Status = 'upcoming' | 'dnf' | 'hit' | 'missed' | 'nogoal';

// "1h 40m 14s" -> seconds, "2h05 - 2h10" -> upper bound, "< 35 min" -> 35 min
export function parseDuration(s: string | null): number | null {
  if (!s) return null;
  const parts = s.split('-');
  const last = parts[parts.length - 1];
  const h = last.match(/(\d+)\s*h\s*(\d+)?/);
  const m = last.match(/(\d+)\s*m(?:in)?\b/);
  const sec = last.match(/(\d+)\s*s\b/);
  if (!h && !m && !sec) return null;
  const hours = h ? +h[1] : 0;
  const mins = m ? +m[1] : h && h[2] ? +h[2] : 0;
  return hours * 3600 + mins * 60 + (sec ? +sec[1] : 0);
}

export function finalSeconds(r: Race): number | null {
  return parseDuration(r.finalTime);
}

export function statusOf(r: Race): Status {
  if (r.upcoming) return 'upcoming';
  if (r.dnf) return 'dnf';
  const goal = parseDuration(r.goalTime);
  const final = finalSeconds(r);
  if (goal == null || final == null) return 'nogoal';
  return final <= goal ? 'hit' : 'missed';
}

export const statusLabels: Record<Lang, Record<Status, string>> = {
  en: {
    upcoming: 'Upcoming',
    dnf: 'DNF',
    hit: 'Goal reached',
    missed: 'Goal missed',
    nogoal: 'Finished',
  },
  fr: {
    upcoming: 'À venir',
    dnf: 'Abandon',
    hit: 'Objectif atteint',
    missed: 'Objectif manqué',
    nogoal: 'Terminée',
  },
};

export const chrono = [...races].sort((a, b) => a.date.localeCompare(b.date));
export const nextRace = chrono.find((r) => r.upcoming) ?? null;

export function fmtDate(iso: string, withYear = true, lang: Lang = 'en') {
  return new Date(iso).toLocaleDateString(dateLocale(lang), {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

export function fmtKm(d: number) {
  return `${Number.isInteger(d) ? d : d.toFixed(1)} km`;
}

// Dot diameter (px) scaled with distance
export function dotSize(distance: number, min = 16, max = 46) {
  const t = Math.sqrt(distance / 21.2);
  return Math.round(min + (max - min) * Math.min(t, 1));
}
