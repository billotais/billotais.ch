<script lang="ts">
  import { initials } from '../../gaming/format';
  import type { GamingText, Standing } from '../../gaming/types';

  let { standings, t }: { standings: Standing[]; t: GamingText } = $props();

  const medals = ['🥇', '🥈', '🥉'];
  const max = $derived(standings[0]?.total || 1);

  // Score breakdown shown on hover / keyboard focus
  let tip = $state<{ s: Standing; x: number; y: number } | null>(null);
  let tipEl = $state<HTMLElement>();

  function place(e: MouseEvent | FocusEvent, s: Standing) {
    const margin = 12;
    const w = tipEl?.offsetWidth || 220;
    const h = tipEl?.offsetHeight || 160;
    let x: number, y: number;
    if (e instanceof MouseEvent) {
      x = e.clientX + margin;
      y = e.clientY + margin;
      if (x + w > window.innerWidth - margin) x = e.clientX - w - margin;
      if (y + h > window.innerHeight - margin) y = e.clientY - h - margin;
    } else {
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      x = Math.min(r.left + margin, window.innerWidth - w - margin);
      y = r.bottom + 4;
      if (y + h > window.innerHeight - margin) y = r.top - h - 4;
    }
    tip = { s, x, y };
  }

  const win = (n: number) => (n === 1 ? t.win : t.wins);
  const tie = (n: number) => (n === 1 ? t.tie : t.ties);
</script>

<div class="leaderboard" role="list">
  {#each standings as s, i (s.name)}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex (focusable so the score breakdown is reachable by keyboard) -->
    <div
      class="row"
      role="listitem"
      tabindex="0"
      onmouseenter={(e) => place(e, s)}
      onmousemove={(e) => place(e, s)}
      onmouseleave={() => (tip = null)}
      onfocus={(e) => place(e, s)}
      onblur={() => (tip = null)}
    >
      <div class="rank" class:top1={i === 0} class:top2={i === 1} class:top3={i === 2}>{medals[i] ?? i + 1}</div>
      <div class="avatar">{initials(s.name)}</div>
      <div class="info">
        <div class="name">{s.name}</div>
        <div class="bar-bg"><div class="bar-fill" style:width="{(s.total / max) * 100}%"></div></div>
      </div>
      <div class="score">
        <div class="score-val">{s.total.toFixed(3)}</div>
        <div class="score-sub">{s.tp} {t.gamesN}</div>
      </div>
    </div>
  {/each}
</div>

<div
  class="tooltip"
  class:visible={tip !== null}
  role="tooltip"
  bind:this={tipEl}
  style:left="{tip?.x ?? 0}px"
  style:top="{tip?.y ?? 0}px"
>
  {#if tip}
    {@const s = tip.s}
    <div class="tip-name">{s.name}</div>
    <div class="tip-row"><span>{t.winTotal}</span><span class="tip-val">{s.tv.toFixed(3)}</span></div>
    <div class="tip-row sub">
      <span>{s.wins} {win(s.wins)}, {s.ties} {tie(s.ties)}</span><span></span>
    </div>
    <div class="tip-row"><span>{t.gamesPlayed}</span><span class="tip-val">{s.tp}</span></div>
    <div class="tip-row"><span>{t.ratio}</span><span class="tip-val">{s.ratio.toFixed(4)}</span></div>
    <div class="tip-row"><span>{t.attendanceBonus}</span><span class="tip-val">+{s.bonus.toFixed(3)}</span></div>
    {#if s.p25 !== null}
      <div class="tip-row"><span>{t.presentBonus}</span><span class="tip-val">+{s.p25}</span></div>
    {/if}
    <div class="tip-row total"><span>{t.total}</span><span class="tip-val">{s.total.toFixed(4)}</span></div>
  {/if}
</div>

<style>
  .leaderboard {
    margin-top: 12px;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 0;
    border-bottom: 1px solid var(--color-border);
    cursor: default;
  }
  .row:last-child {
    border-bottom: none;
  }
  .row:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
    border-radius: 6px;
  }
  .rank {
    font-size: 0.85rem;
    font-weight: 700;
    width: 22px;
    text-align: center;
    flex-shrink: 0;
    color: var(--color-text-muted);
  }
  .top1 {
    color: #b8860b;
  }
  .top2 {
    color: #808080;
  }
  .top3 {
    color: #a0522d;
  }
  .avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--color-accent-light);
    color: var(--color-accent);
    border: 1.5px solid var(--color-accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    flex-shrink: 0;
  }
  .info {
    flex: 1;
    min-width: 0;
  }
  .name {
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .bar-bg {
    height: 3px;
    background: var(--color-border);
    border-radius: 2px;
    margin-top: 4px;
  }
  .bar-fill {
    height: 3px;
    background: var(--color-accent);
    border-radius: 2px;
    transition: width 0.4s ease;
  }
  .score {
    text-align: right;
    flex-shrink: 0;
  }
  .score-val {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--color-text);
  }
  .score-sub {
    font-size: 0.68rem;
    color: var(--color-text-muted);
  }

  .tooltip {
    position: fixed;
    z-index: 500;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.12s;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    padding: 12px 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    min-width: 200px;
    font-size: 0.8rem;
  }
  .tooltip.visible {
    opacity: 1;
  }
  .tip-name {
    font-weight: 700;
    font-size: 0.875rem;
    margin-bottom: 10px;
    color: var(--color-text);
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 8px;
  }
  .tip-row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 3px 0;
    color: var(--color-text-muted);
  }
  .tip-row.sub span:first-child {
    padding-left: 10px;
    font-size: 0.72rem;
  }
  .tip-row.total {
    border-top: 1px solid var(--color-border);
    margin-top: 6px;
    padding-top: 8px;
    font-weight: 700;
    color: var(--color-text);
    font-size: 0.875rem;
  }
  .tip-val {
    font-weight: 600;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }
  .tip-row.total .tip-val {
    color: var(--color-accent);
  }
</style>
