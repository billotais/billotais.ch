import { normalizeSessions } from './scoring';
import type { RawSession, Session } from './types';

/**
 * Where the sessions come from. The page only talks to this interface, so moving from static JSON files to a
 * database means writing another implementation (e.g. `ApiStore` calling a small endpoint behind the same Caddy
 * gate) and passing it to <Gaming store={...}>. Writing is the missing half: when it is needed, add
 * `add(session)` / `remove(id)` here (the `Session.id` is the key) and an "add a game" form in the page.
 */
export interface GamingStore {
  list(year: string): Promise<Session[]>;
}

/** Read-only: `public/elca-gaming/<year>.json`, generated from the CSV files with `node scripts/csv-to-json.mjs`. */
export const jsonStore: GamingStore = {
  async list(year) {
    const resp = await fetch(`/elca-gaming/${year}.json`);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return normalizeSessions((await resp.json()) as RawSession[]);
  },
};
