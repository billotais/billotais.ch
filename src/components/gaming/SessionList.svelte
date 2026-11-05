<script lang="ts">
  import { formatDate } from '../../gaming/format';
  import type { GamingText, Result, Session } from '../../gaming/types';

  let { sessions, t }: { sessions: Session[]; t: GamingText } = $props();

  const newestFirst = $derived([...sessions].reverse());
  const names = (s: Session, result: Result) =>
    Object.entries(s.players)
      .filter(([, r]) => r === result)
      .map(([name]) => name);
  const count = (s: Session) => Object.keys(s.players).length;
</script>

<div class="sessions">
  {#each newestFirst as s (s.id)}
    <div class="session">
      <div class="header">
        <div class="game">
          {#if s.url}
            <a href={s.url} target="_blank" rel="noopener">{s.game}</a>
          {:else}
            {s.game}
          {/if}
        </div>
        <div class="date">{formatDate(s.date)}</div>
      </div>
      <div class="meta">{t.complexity} {s.complexity.toFixed(2)} · {count(s)} {t.players}</div>
      <div class="badges">
        {#each names(s, 'winner') as n}<span class="badge winner">🏆 {n}</span>{/each}
        {#each names(s, 'tie') as n}<span class="badge tie">🥈 {n}</span>{/each}
        {#each names(s, 'present') as n}<span class="badge present">✓ {n}</span>{/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .sessions {
    margin-top: 12px;
  }
  .session {
    padding: 12px 0;
    border-bottom: 1px solid var(--color-border);
  }
  .session:last-child {
    border-bottom: none;
  }
  .header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 4px;
  }
  .game {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text);
    flex: 1;
    min-width: 0;
  }
  .game a {
    color: var(--color-text);
  }
  .game a:hover {
    color: var(--color-accent);
    text-decoration: none;
  }
  .date {
    font-size: 0.72rem;
    color: var(--color-text-muted);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .meta {
    font-size: 0.72rem;
    color: var(--color-text-muted);
    margin-bottom: 6px;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 7px;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 500;
    border: 1px solid;
  }
  .winner {
    background: rgba(184, 134, 11, 0.1);
    color: #a07000;
    border-color: rgba(184, 134, 11, 0.25);
  }
  .tie {
    background: rgba(128, 128, 128, 0.1);
    color: #606060;
    border-color: rgba(128, 128, 128, 0.25);
  }
  .present {
    background: var(--color-accent-light);
    color: var(--color-accent);
    border-color: rgba(11, 135, 147, 0.25);
  }
</style>
