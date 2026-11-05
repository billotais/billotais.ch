<script lang="ts">
  import { jsonStore, type GamingStore } from '../../gaming/store';
  import { computeStandings } from '../../gaming/scoring';
  import type { GamingText, Session } from '../../gaming/types';
  import Stats from './Stats.svelte';
  import Leaderboard from './Leaderboard.svelte';
  import SessionList from './SessionList.svelte';

  interface Props {
    years: string[];
    t: GamingText;
    store?: GamingStore;
  }
  let { years, t, store = jsonStore }: Props = $props();

  // svelte-ignore state_referenced_locally (only the initial tab matters)
  let year = $state(years[0]);
  let sessions = $state<Session[]>([]);
  let status = $state<'loading' | 'ready' | 'error'>('loading');
  let error = $state('');

  const cache = new Map<string, Session[]>();
  const standings = $derived(computeStandings(sessions, year));

  $effect(() => {
    const y = year;
    const cached = cache.get(y);
    if (cached) {
      sessions = cached;
      status = 'ready';
      return;
    }
    status = 'loading';
    let stale = false;
    store
      .list(y)
      .then((list) => {
        if (stale) return;
        cache.set(y, list);
        sessions = list;
        status = 'ready';
      })
      .catch((e: Error) => {
        if (stale) return;
        error = t.loadError.replace('{year}', y).replace('{error}', e.message);
        status = 'error';
      });
    return () => {
      stale = true; // a faster tab click made this answer obsolete
    };
  });
</script>

<div class="tabs" role="tablist">
  {#each years as y}
    <button class="tab" class:active={y === year} role="tab" aria-selected={y === year} onclick={() => (year = y)}>
      {y}
    </button>
  {/each}
</div>

{#if status === 'loading'}
  <div class="loading">{t.loading}</div>
{:else if status === 'error'}
  <div class="error">{error}</div>
{:else}
  <Stats {sessions} {standings} {t} />
  <div class="two-col">
    <section>
      <p class="section-label">{t.leaderboard}</p>
      <Leaderboard {standings} {t} />
    </section>
    <section>
      <p class="section-label">{t.recent}</p>
      <SessionList {sessions} {t} />
    </section>
  </div>
{/if}

<style>
  .tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 32px;
    border-bottom: 1px solid var(--color-border);
  }
  .tab {
    padding: 8px 18px;
    border: none;
    background: none;
    font-family: var(--font-sans);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s;
  }
  .tab:hover {
    color: var(--color-text);
  }
  .tab.active {
    color: var(--color-accent);
    border-bottom-color: var(--color-accent);
  }

  .loading {
    padding: 48px 0;
    text-align: center;
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }
  .error {
    padding: 16px;
    border-radius: 8px;
    background: #fee2e2;
    color: #991b1b;
    font-size: 0.875rem;
    margin-bottom: 24px;
  }

  .two-col {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 32px;
    align-items: start;
  }
  @media (max-width: 700px) {
    .two-col {
      grid-template-columns: 1fr;
    }
  }
</style>
