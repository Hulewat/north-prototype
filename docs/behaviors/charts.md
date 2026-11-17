# Charts

Each note: what it does, then where. Read the linked line for exact values.

## open-charts.jsx

- Charts for an opened key metric. One grammar for every lens (from the Figma lens grid, 650:1350): 641-wide plot, $ axis at x 44, baseline at 168, metric colour carried from its card, target = dotted salmon line ending in a small salmon dot, October = lighter (month to date). — [L4](../../source/src/open-charts.jsx#L4) `import React, { createContext, useContext, useState } from "react";`
- geometry travels by context so the same charts can draw at another size (e.g. inside an opened heatmap square) — [L12](../../source/src/open-charts.jsx#L12) `export const geo = (cw = 641, ch = 190) => { const x0 = 44, pitch = (cw - x0) / 6; return `
- month-over-month: green when it moved the good way, red when it moved the bad way (lower-is-better metrics flip) — [L20](../../source/src/open-charts.jsx#L20) `const UP = "#257985", DOWN = "#9b1b5a";`
- small hover card for dots, drawn in the chart itself so it sits right against the mark it explains — [L34](../../source/src/open-charts.jsx#L34) `export function DotTip({ x, y, title, sub, show, align = "end" }) {`
- dotted target drawn left → right, then its dot lands; hovering the dot says what it is — [L49](../../source/src/open-charts.jsx#L49) `function Target({ y, label, p, sub }) {`
- hover for bar charts — same as ARR movement: hovered month stays, the rest dim, a tooltip rises from the bar only on the mark itself: a bar (a little slack around it), or a line point and the striped fill under it — never the empty space above — [L70](../../source/src/open-charts.jsx#L70) `function useColumnHover(topOf, line = false) {`
- whole column across, so moving bar to bar never drops out in the gap — [L78](../../source/src/open-charts.jsx#L78) `const t = topOf ? topOf(i) : top, onX = true; // whole column across, so moving bar to bar`
- tooltips sit just above the hovered bar and glide between months (no jump), so they always read as attached to their bar. The first and last columns align to their outer edge so nothing spills out. — [L84](../../source/src/open-charts.jsx#L84) `function ColumnTip({ i, y, tip, hold }) {`
- small charts (an opened heatmap square) get a one-line tip that fits the headroom — [L87](../../source/src/open-charts.jsx#L87) `const first = i === 0, last = i === 5, compact = CH < 200; // small charts (an opened heat`
- Monthly · bars (Total ARR, Felix ARR, Net new ARR) — [L108](../../source/src/open-charts.jsx#L108) `export function MonthlyBars({ p, vals, lo, hi, ticks, fmt = (v) => String(v), tgt, tLabel,`
- Monthly · line on a zoomed axis (NRR) — Seth's striped line — [L147](../../source/src/open-charts.jsx#L147) `export function MonthlyLine({ p, vals, lo, hi, ticks, tgt, tLabel, color, fmt = (v) => '${`
- Pace this month — actual (metric colour, stripes) vs the straight pace line to the month's target — [L179](../../source/src/open-charts.jsx#L179) `export function PaceLine({ p, start, tgt, now, lo, hi, ticks, fmt = (v) => String(v), colo`
- By segment — one bar per segment, metric colour, lighter for the second — [L216](../../source/src/open-charts.jsx#L216) `const tickV = (t) => 95 + t * 10; // NRR segment bars run 95% → 105%`
- NRR segment bars run 95% → 105% — [L216](../../source/src/open-charts.jsx#L216) `const tickV = (t) => 95 + t * 10; // NRR segment bars run 95% → 105%`
- By kind — new business + expansion stack up from $0, the solid part ends at net, churn is the dashed slice above — [L245](../../source/src/open-charts.jsx#L245) `export function ByKind({ p, data }) {`

## visuals.jsx

- The six board detail visuals. Geometry is taken from the Figma trial frame (Board details · gradient + purple, node 586:1230): every chart lives in a 723×207 space, the same as the Figma "Visual" frame. — [L4](../../source/src/visuals.jsx#L4) `import React, { useContext, useEffect, useRef, useState, createContext } from "react";`
- line sweeps: leave with pace, arrive with a long ease — [L9](../../source/src/visuals.jsx#L9) `const SWEEP = bezier([0.5, 0, 0.2, 1]);`
- piano-key field: every tick is its own spring; the cursor presses a soft bump into the row (gaussian in px), so neighbours rise less and settle back after the cursor passes. — [L22](../../source/src/visuals.jsx#L22) `export function useKeyField(n, pitch, centerPx) {`
- tooltip body: lines arrive one after another; when the target changes, the old lines lift away and the new ones rise in — [L55](../../source/src/visuals.jsx#L55) `const tipLine = { hide: { opacity: 0, y: 5, filter: "blur(2px)" }, show: { opacity: 1, y: `
- shared frame: SVG + pointer → viewBox coords + HTML tooltip — [L77](../../source/src/visuals.jsx#L77) `export function VisualFrame({ label, pick, children }) {`
- 1 · Booked ARR — ticks v2 — [L126](../../source/src/visuals.jsx#L126) `export function BookedTicks({ p }) {`
- the pace tick is the only salmon on the track: it fills when the gap has finished counting toward it — [L169](../../source/src/visuals.jsx#L169) `const f = E(win(p, 0.78, 0.96));`
- shortfall between now and pace: grey well, swept in left→right; after pace: faint outline — [L178](../../source/src/visuals.jsx#L178) `const g = k < nP ? stag(gapP, k - nA - 1, nP - nA - 1, spread) : 0;`
- 2 · Expansion win rate — concentric tick rings — [L205](../../source/src/visuals.jsx#L205) `const wedge = (cx, cy, r, f) => {`
- depth: each ring starts small + rotated back, as if travelling toward the viewer, and lands at scale 1 — [L221](../../source/src/visuals.jsx#L221) `const zr = (q) => 'translate(${cx} ${cy}) rotate(${-14 * (1 - q)}) scale(${lerp(1.45, 1, q`
- callouts, as in the Figma trial: Goal left, Current Rate right, joined by leader lines — [L258](../../source/src/visuals.jsx#L258) `<g opacity={dimGoal}>`
- 3 · New logos — area, pace line, dotted projection — [L276](../../source/src/visuals.jsx#L276) `export function LogosArea({ p }) {`
- on the area or its lines, not the space above — [L296](../../source/src/visuals.jsx#L296) `if (x < 0 || y < Math.min(Y(vv), Y(pace)) - 16 || y > base + 4) return null; // on the are`
- today: gap to pace, then the peak — [L325](../../source/src/visuals.jsx#L325) `{(() => { const s = clamp((sweepX - X(27) + 2) / 2); const g = win(p, 0.78, 0.92); return `
- 4 · Win rate from held demo — ranking ruler the ruler: one value against its target on a scale; the gap between them lights up. Held-demo win rate is the default. — [L358](../../source/src/visuals.jsx#L358) `const DEMO_RULER = { you: 19.9, target: 23.5, lo: 0, hi: 30, ticks: [0, 10, 20, 30], pre: `
- 5 · Expansion ARR — booked vs pace, striped bands — [L417](../../source/src/visuals.jsx#L417) `const EXP_LINES = { book: [[1, 0], [6, 0.095], [13, 0.26], [20, 0.48], [27, 0.734]], goal:`
- bare: the numbers sit above the chart (in the card), the chart takes the full width and height narrow (docked chat): the two numbers become one quiet line above, and the chart takes the full width — [L423](../../source/src/visuals.jsx#L423) `const x0 = bare || narrow ? 52 : 296, x1 = 719, top = narrow && !bare ? 48 : 22, base = 17`
- on the lines or the fill under them, not the space above — [L441](../../source/src/visuals.jsx#L441) `if (y < lineY - 16 || y > base + 4) return null; // on the lines or the fill under them, n`
- 6 · TTV — two lollipops and the overrun between them — [L511](../../source/src/visuals.jsx#L511) `export function TtvLollipop({ p }) {`
- axis lays down → both lollipops rise together at the middle of the gap → they split apart to 15d and 20.9d, and the gap opens between them: gradient band and its "days" grow with the split — [L516](../../source/src/visuals.jsx#L516) `const axisP = win(p, 0, 0.28);`
