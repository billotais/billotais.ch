<script lang="ts">
  import type { GamingText, Session, Standing } from '../../gaming/types';

  let { sessions, standings, t }: { sessions: Session[]; standings: Standing[]; t: GamingText } = $props();

  const active = $derived(standings.filter((s) => s.tp > 0).length);
  const top = $derived(standings.reduce((a, b) => (a.wins > b.wins ? a : b), { wins: 0, name: '–' }));
</script>

<div class="stats">
  <div class="stat"><div class="val">{sessions.length}</div><div class="lbl">{t.games}</div></div>
  <div class="stat"><div class="val">{active}</div><div class="lbl">{t.activePlayers}</div></div>
  <div class="stat"><div class="val">{top.wins}</div><div class="lbl">{t.mostWins} — {top.name}</div></div>
</div>

<style>
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }
  .stat {
    background: var(--color-bg-subtle);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 14px 16px;
    text-align: center;
  }
  .val {
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--color-accent);
    line-height: 1;
  }
  .lbl {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--color-text-muted);
    margin-top: 4px;
  }
</style>
