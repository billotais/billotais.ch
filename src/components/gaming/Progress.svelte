<script lang="ts">
  import { computeProgress } from '../../gaming/scoring';
  import type { GamingText, Session } from '../../gaming/types';

  let { sessions, year, t }: { sessions: Session[]; year: string; t: GamingText } = $props();

  const W = 760;
  const H = 360;
  const pad = { l: 40, r: 84, t: 16, b: 30 };

  let mode = $state<'points' | 'rank'>('points');
  let focus = $state<string | null>(null); // player highlighted from the legend or a line
  let hover = $state<number | null>(null); // session index under the pointer

  const series = $derived(computeProgress(sessions, year));
  const n = $derived(sessions.length);
  const color = (i: number) => `hsl(${(i * 137.5) % 360} 62% 42%)`;
  const colors = $derived(new Map(series.map((s, i) => [s.name, color(i)])));

  const x = (i: number) => pad.l + (n > 1 ? (i / (n - 1)) * (W - pad.l - pad.r) : 0);
  const maxTotal = $derived(Math.max(1, ...series.flatMap((s) => s.points.map((p) => p?.total ?? 0))));
  const maxRank = $derived(Math.max(1, ...series.flatMap((s) => s.points.map((p) => p?.rank ?? 0))));
  const y = $derived((v: number) =>
    mode === 'points'
      ? pad.t + (1 - v / maxTotal) * (H - pad.t - pad.b)
      : pad.t + ((v - 1) / Math.max(maxRank - 1, 1)) * (H - pad.t - pad.b),
  );
  const val = (p: { total: number; rank: number }) => (mode === 'points' ? p.total : p.rank);

  const path = (points: (typeof series)[number]['points']) =>
    points
      .map((p, i) => (p ? `${x(i).toFixed(1)},${y(val(p)).toFixed(1)}` : null))
      .filter(Boolean)
      .join(' ');

  const yTicks = $derived(
    mode === 'points'
      ? Array.from({ length: 5 }, (_, i) => (maxTotal / 4) * i)
      : Array.from({ length: maxRank }, (_, i) => i + 1),
  );
  const xTicks = $derived(
    Array.from({ length: n }, (_, i) => i).filter((i) => n <= 10 || i % Math.ceil(n / 10) === 0 || i === n - 1),
  );
  const fmtDate = (d: string) => d.slice(5).replace('-', '/');

  // Names at the right edge in rank mode (ranks are distinct, so they never overlap)
  const ends = $derived(
    mode === 'rank'
      ? series.flatMap((s) => {
          const p = s.points.at(-1);
          return p ? [{ name: s.name, y: y(p.rank) }] : [];
        })
      : [],
  );

  const tipRows = $derived.by(() => {
    const h = hover;
    if (h === null) return [];
    return series
          .flatMap((s) => {
            const p = s.points[h];
            return p ? [{ name: s.name, p }] : [];
          })
          .sort((a, b) => a.p.rank - b.p.rank);
  });

  function onMove(e: PointerEvent) {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    hover = n > 1 ? Math.min(n - 1, Math.max(0, Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (n - 1)))) : 0;
  }
  const dim = (name: string) => focus !== null && focus !== name;
</script>

<div class="progress">
  <div class="head">
    <div class="toggle" role="group" aria-label={t.progress}>
      <button aria-pressed={mode === 'points'} onclick={() => (mode = 'points')}>{t.points}</button>
      <button aria-pressed={mode === 'rank'} onclick={() => (mode = 'rank')}>{t.rank}</button>
    </div>
  </div>

  <div class="plot">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="{t.progress}: {mode === 'rank' ? t.rank : t.points}" onpointermove={onMove} onpointerleave={() => (hover = null)}>
      {#each yTicks as v}
        <line class="grid" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
        <text class="tick" x={pad.l - 8} y={y(v) + 4} text-anchor="end">{mode === 'rank' ? v : v.toFixed(1)}</text>
      {/each}
      {#each xTicks as i}
        <text class="tick" x={x(i)} y={H - 8} text-anchor="middle">{fmtDate(sessions[i].date)}</text>
      {/each}

      {#if hover !== null}
        <line class="guide" x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} />
      {/if}

      {#each series as s (s.name)}
        <polyline
          class="line"
          class:dim={dim(s.name)}
          class:focus={focus === s.name}
          points={path(s.points)}
          stroke={colors.get(s.name)}
        />
        {#each s.points as p, i}
          {#if p && (hover === i || focus === s.name)}
            <circle cx={x(i)} cy={y(val(p))} r="3.5" fill={colors.get(s.name)} class:dim={dim(s.name)} />
          {/if}
        {/each}
      {/each}

      {#each ends as e (e.name)}
        <text class="end" class:dim={dim(e.name)} x={W - pad.r + 8} y={e.y + 4} fill={colors.get(e.name)}>{e.name}</text>
      {/each}
    </svg>

    {#if hover !== null}
      <div class="tip" style:left="{(x(hover) / W) * 100}%" class:flip={hover > n / 2}>
        <div class="tip-head">{sessions[hover].date} · {sessions[hover].game}</div>
        {#each tipRows as r}
          <div class="tip-row" class:dim={dim(r.name)}>
            <span class="dot" style:background={colors.get(r.name)}></span>
            <span class="tip-name">{r.name}</span>
            <span class="tip-val">{mode === 'rank' ? `#${r.p.rank}` : r.p.total.toFixed(2)}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="legend">
    {#each series as s (s.name)}
      <button
        class="chip"
        class:dim={dim(s.name)}
        aria-pressed={focus === s.name}
        onclick={() => (focus = focus === s.name ? null : s.name)}
      >
        <span class="dot" style:background={colors.get(s.name)}></span>{s.name}
      </button>
    {/each}
  </div>
</div>

<style>
  .head {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 8px;
  }
  .toggle {
    display: inline-flex;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  .toggle button {
    padding: 4px 12px;
    border: 0;
    background: var(--color-bg);
    color: var(--color-text-muted);
    font: 600 0.8rem var(--font-sans);
    cursor: pointer;
  }
  .toggle button[aria-pressed='true'] {
    background: var(--color-accent-light);
    color: var(--color-accent);
  }

  .plot {
    position: relative;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    touch-action: pan-y;
  }
  .grid {
    stroke: var(--color-border);
    stroke-width: 1;
  }
  .guide {
    stroke: var(--color-text-muted);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }
  .tick {
    font-size: 11px;
    fill: var(--color-text-muted);
  }
  .line {
    fill: none;
    stroke-width: 2;
    stroke-linejoin: round;
    stroke-linecap: round;
    opacity: 0.9;
    transition: opacity 0.15s;
  }
  .line.focus {
    stroke-width: 3.5;
    opacity: 1;
  }
  .line.dim,
  circle.dim,
  .end.dim {
    opacity: 0.15;
  }
  .end {
    font-size: 11px;
    font-weight: 600;
  }

  .tip {
    position: absolute;
    top: 8px;
    transform: translateX(12px);
    min-width: 180px;
    max-height: calc(100% - 16px);
    overflow: hidden;
    padding: 8px 10px;
    background: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    font-size: 0.75rem;
    pointer-events: none;
  }
  .tip.flip {
    transform: translateX(calc(-100% - 12px));
  }
  .tip-head {
    font-weight: 700;
    margin-bottom: 4px;
  }
  .tip-row {
    display: flex;
    align-items: center;
    gap: 6px;
    line-height: 1.5;
  }
  .tip-row.dim {
    opacity: 0.4;
  }
  .tip-name {
    flex: 1;
  }
  .tip-val {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex: none;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 3px 10px;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    background: var(--color-bg);
    color: var(--color-text);
    font: 500 0.75rem var(--font-sans);
    cursor: pointer;
  }
  .chip[aria-pressed='true'] {
    border-color: var(--color-text);
  }
  .chip.dim {
    opacity: 0.45;
  }

  @media (max-width: 700px) {
    .tip {
      display: none;
    }
  }
</style>
