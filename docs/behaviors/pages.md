# Company health, ARR, metrics, teams

Each note: what it does, then where. Read the linked line for exact values.

## health.jsx

- Company health — built from Figma "Company Health · v8" (721:1043). Coordinates in comments are the Figma card's; the scroll area starts at card y 65. — [L3](../../source/src/health.jsx#L3) `import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";`
- one green ramp for every "on pace" on these pages: light (85–99), mid (100–119), deep (120%+ and status fills) — [L15](../../source/src/health.jsx#L15) `export const GREEN = { light: "#c6e2e4", mid: "#6aacb3", deep: "#257985" };`
- off plan is a deep berry rather than a pure red: it sits next to purple as one "miss" family and never reads as green-vs-red — [L17](../../source/src/health.jsx#L17) `export const OFF = "#9b1b5a";`
- data status bars at the top: widths exactly as drawn in Figma (558, 148, 68 of 641) — [L23](../../source/src/health.jsx#L23) `const STATUS = [["On Pace", "30", 30 / 36, GREEN.deep], ["Behind", "4", 4 / 36, PURPLE], [`
- drawn to scale: out of the 36 with a pace or target — [L23](../../source/src/health.jsx#L23) `const STATUS = [["On Pace", "30", 30 / 36, GREEN.deep], ["Behind", "4", 4 / 36, PURPLE], [`
- scoreboard: chart = what the card opens to first (amounts → monthly bars, rates → monthly line) — [L26](../../source/src/health.jsx#L26) `export const CARDS = [`
- heatmap: [name, value, pct (drives colour + bar; null = no target/data), status shown, footer, pace mark (0–1) \| null] — [L38](../../source/src/health.jsx#L38) `export const LANES = [`
- status on these pages: navy on pace, purple behind, red off plan (no salmon) — [L84](../../source/src/health.jsx#L84) `export const SC = { on: GREEN.deep, behind: PURPLE, off: OFF, none: C.mute };`
- his score ring: dashed track + dashed arc, 36px — [L106](../../source/src/health.jsx#L106) `let ringId = 0;`
- scoreboard mini chart — faint until the card is hovered, then it wakes to full colour — [L123](../../source/src/health.jsx#L123) `const W0 = 231.6, H = 26, TOP = -14;`
- draws to the card's real width, so wide cards don't letterbox the preview — [L127](../../source/src/health.jsx#L127) `const W = w || W0; // draws to the card's real width, so wide cards don't letterbox the pr`
- a goal's progress, the library's way: a row of ticks filled to where it is, the pace tick where it should be by today — [L131](../../source/src/health.jsx#L131) `if (c.kind === "ticks") {`
- scoreboard: the home key-metric tile, 8 of them Closed each sits in its grid slot showing the faint preview chart; opened, the same element grows over both rows. — [L190](../../source/src/health.jsx#L190) `function ScoreMetrics({ Tile, metrics, M, P, E }) {`
- the ARR card: Total ARR, the month's net movement, and where the year lands. Chart: ending ARR by month (May–Oct actual, Nov–Dec projected at the current net new rate) against the $40.03M plan; the year-end gap is the space between December's projected bar and the plan line. — [L231](../../source/src/health.jsx#L231) `const YE = { plan: 40.03, proj: 38.94, months: ["May", "Jun", "Jul", "Aug", "Sep", "Oct", `
- one tooltip, same as every other chart: what the column is, its value, and how it sits against the plan what the column is goes in the eyebrow; rows only carry what that kind of month can honestly say — [L245](../../source/src/health.jsx#L245) `const tip = hov == null ? null : (() => {`
- Total ARR: the big card in the scoreboard, surrounded by the other KPI tiles — [L302](../../source/src/health.jsx#L302) `function ArrCard({ M, p, style, dim, go }) {`
- pinned charts on Home: every pin is a chart from these pages. Same scoreboard card anatomy; the filled star unpins (the card leaves its slot), the last slot adds more. — [L327](../../source/src/health.jsx#L327) `function pinMeta(id, metrics) {`
- accents: the tile stays paper and its status is a short colour bar on the left edge, so the grid reads calm and only the colour of the bars (and the % behind) carries the signal — [L392](../../source/src/health.jsx#L392) `if (pal === "accent" && p != null) { const acc = HEAT.find(([min]) => p >= min)[1]; return`
- focus: every tile stays filled, but only the misses (under 85% of pace) carry full colour; on-pace tiles drop to a soft tint of their colour, so the eye lands on what's behind instead of on a wall of colour — [L395](../../source/src/health.jsx#L395) `if (pal === "focus" && p != null) { const base = HEAT.find(([min]) => p >= min)[1]; return`
- cream type wherever it clears 4.5:1 against the square; navy only where cream wouldn't read — [L401](../../source/src/health.jsx#L401) `const dark = (lum(C.paper) + 0.05) / (lum(bg) + 0.05) >= 4.5;`
- lanes across the top, each lane's five metrics down its column — [L413](../../source/src/health.jsx#L413) `const RH = 88, HH = 58, NCOL = 7, NROW = 5; // lanes across the top, each lane's five metr`
- P.cells is seconds since the wave started. Each square waits (its distance × the spread), then runs its own fade. — [L460](../../source/src/health.jsx#L460) `const fade = M.health.tileFade, FILL = useMemo(() => bezier(fade.ease), [JSON.stringify(fa`
- the category rides the same wave as its squares: same clock, same fade and easing, reached a beat after the row under it — [L467](../../source/src/health.jsx#L467) `const hs = P.cells - dist['h-${r}'] * M.health.flowSpread - M.health.headLag, hd = Math.ma`
- the score bar fills on its own, quicker curve — [L468](../../source/src/health.jsx#L468) `const q = FILL(clamp(hs / hd)), g = BAR(clamp((hs - M.health.barWait) / Math.max(0.01, M.h`
- lane header: name, department, and its score as a horizontal bar — [L473](../../source/src/health.jsx#L473) `<motion.div className={'hm-cat hm-head${lit(r) ? " is-lit" : ""}'} role="link" tabIndex={0`
- flow in: the front reaches each square by its distance from the centre and its colour rises out of the paper — [L484](../../source/src/health.jsx#L484) `const k = FILL(clamp((P.cells - dist['${r}-${c}'] * M.health.flowSpread) / Math.max(0.01, `
- fades up out of the paper: opacity and colour rise together, the type settles in over the second half — [L486](../../source/src/health.jsx#L486) `return { gridColumn: r + 1, gridRow: c + 2, background: h.none ? h.bg : mix(h.bg, C.paper,`
- a square opens the way the home metric cards do: the same element grows across the heatmap — label and value scale up in place, then the chart (with lenses), the details column and the footer settle in. Closing runs it back into its square. — [L517](../../source/src/health.jsx#L517) `export const OWNERS = { Inbound: "Lisa", Outbound: "Caleb", "New Business": "Sam", "Value `
- 4 squares wide × 4 rows tall, pinned to the clicked square's corner: grows right/down, or left/up when there isn't room — [L618](../../source/src/health.jsx#L618) `const CW = W / NCOL, NW = 5, NH = 4;`
- always inside the grid; the clicked square stays under the card — [L619](../../source/src/health.jsx#L619) `const col0 = Math.max(0, Math.min(r, NCOL - NW)), row0 = Math.max(0, Math.min(c, NROW - NH`
- what to talk about: a ranked agenda of the misses. One card, list rows like the home board; each row carries its pace bar and says the gap in plain words. Clicking a row opens that same square in the heatmap above — one way in, one place to read it. — [L708](../../source/src/health.jsx#L708) `export const TALK = [`
- hover grows sideways out of the cursor, like the sidebar rows — [L716](../../source/src/health.jsx#L716) `export function GrowHover({ o, t }) {`
- one agenda row: what missed, where it lives, the pace bar, the gap in plain words — [L725](../../source/src/health.jsx#L725) `export function TalkRow({ t, g = 1, hov, onEnter, onClick, at, M, synced }) {`
- page filters; once they slide under the top bar a copy fades into it (same as the home ask bar) — [L767](../../source/src/health.jsx#L767) `export function PageFilters({ M, scrollRef, style }) {`
- tell the top bar the filters have moved in, so the breadcrumb steps aside for them — [L782](../../source/src/health.jsx#L782) `useEffect(() => { const tb = document.querySelector(".topbar"); if (tb) tb.toggleAttribute`
- breadcrumb lives in the top bar; it gives way to the docked filters once you scroll — [L808](../../source/src/health.jsx#L808) `export function TopCrumbs({ M, items, right }) {`
- North's read of the page, worked out from the lanes: how many are behind, which department holds them, and the worst one North's read: which lanes are behind, how much of that is Sales ARR this month, and what it means for the year. Sales ARR shortfall = the three Sales ARR metrics' distance to pace this month (prototype data; confirm with real numbers). — [L827](../../source/src/health.jsx#L827) `const SALES_ARR_SHORT = [["Booked ARR – Outbound", 443.6], ["Expansion ARR", 280], ["New A`
- the heatmap's own clock: one wave out from the centre — [L846](../../source/src/health.jsx#L846) `const PF = useReplay('chf-${replay}-${M.health.flowSpread}-${M.health.flowDelay}-${M.healt`
- { r, c?, from: "hm" \| "talk" } — [L852](../../source/src/health.jsx#L852) `const [link, setLink] = useState(null); // { r, c?, from: "hm" | "talk" }`
- the heatmap leads: the scoreboard's numbers are already on Home — [L868](../../source/src/health.jsx#L868) `<section aria-labelledby="hm-t" className="ch-hm" id="hm-h">`

## arr.jsx

- ARR movement, its own page, laid out like Company health: an open header, three tiles that open (October to date, left to build, the December plan), the filters, then the ledger. Under the ledger, Home's own ARR chart at full width, then Total ARR and Felix ARR as their own chart. Hover reads one thing at a time: a row name lights its row, any number lights its month. The chart keeps its own hover and never lights the table. All figures come from arr-data.js, the same source Home reads (sample data). — [L6](../../source/src/arr.jsx#L6) `import React, { useEffect, useLayoutEffect, useRef, useState } from "react";`
- the filters: the Agents list's own dropdown (value only, quiet until hovered), opening out of its own button. Each option carries its figure on the right, the way the Agents filters carry their counts — [L39](../../source/src/arr.jsx#L39) `function Drop({ value, options, onPick }) {`
- the sidebar's hover: a soft pill that opens sideways out of the cursor point. One at a time: the row when you're on its name, the month when you're on a number — [L61](../../source/src/arr.jsx#L61) `function Band({ r, x, t }) {`
- the table: the same twelve months, every line of the movement — [L69](../../source/src/arr.jsx#L69) `function Table({ d, M, n0 }) {`
- { kind: "row", k } \| { kind: "col", c } — [L71](../../source/src/arr.jsx#L71) `const [on, setOn] = useState(null); // { kind: "row", k } | { kind: "col", c }`
- a run of the same kind of month gets one label above it: Measured, Live, Plan — [L75](../../source/src/arr.jsx#L75) `const runs = cols.reduce((a, c) => { const l = a[a.length - 1]; if (l && l.g === c.g) l.n+`
- where the pill goes, in the scroll box's own coordinates (so it scrolls with the table) — [L84](../../source/src/arr.jsx#L84) `useLayoutEffect(() => {`
- the year by month: Home's ARR chart at full width. Measured months solid, the live month lighter, plan months dotted outlines; hover a measured month and its bar turns into what built it, as on Home — [L122](../../source/src/arr.jsx#L122) `function YearChart({ d, M }) {`
- the plan label is the plot's top line, right under the title — [L124](../../source/src/arr.jsx#L124) `const Wv = 1079, Hv = 270, base = 251.7, gx = 52, top = 27.4; // the plan label is the plo`
- the grid runs through the solid bars as paper lines, as on Home — [L155](../../source/src/arr.jsx#L155) `{d.end.map((v, i) => kindOf(i) !== "plan" && ticks.filter((t) => t > lo && Y(t) > Y(v) + 1`
- hovering a measured month: it turns into what built it, New and Expansion from the baseline, then what was lost — [L158](../../source/src/arr.jsx#L158) `<AnimatePresence>`
- the whole column answers, so there's no dead gap between months — [L168](../../source/src/arr.jsx#L168) `{MONTHS.map((mo, i) => <rect key={'h${i}'} x={cx(i) - pitch / 2} y={0} width={pitch} heigh`
- Total ARR and Felix ARR: its own chart, drawn the way North draws pace (Expansion ARR's chart): a fine line with its stripes under it, the line sweeping in from the left. Two colors that read apart at a glance, navy for Total, Felix's purple for Felix (coral stays pace's alone). Solid through the live month, dotted on through the plan, a dot on today — [L200](../../source/src/arr.jsx#L200) `const FELIX = C.purple;`
- stripes past here sit lighter: that's plan — [L216](../../source/src/arr.jsx#L216) `const planX = lastAct >= 0 && lastAct < 11 ? X(lastAct) : lastAct < 0 ? x0 : null; // stri`
- where each line ends: the year's last month, named in its own color — [L252](../../source/src/arr.jsx#L252) `<motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, d`
- the sentence under the title: where the year stands, for what's selected — [L288](../../source/src/arr.jsx#L288) `function leadFor(d) {`
- "View as table" from Home lands on the table only its own scroller moves (scrollIntoView would scroll the page behind it too) — [L307](../../source/src/arr.jsx#L307) `useEffect(() => { if (focus !== "table" || !tblRef.current) return; const t = setTimeout((`
- each option carries its figure, as the Agents filters carry counts: a segment's ARR in the year shown, a year's December — [L310](../../source/src/arr.jsx#L310) `const segOpts = SEGS.map(([k, l]) => { const x = arrData(k, year); return [k, l, fM(year =`
- opened from Home's chart, it can fold back into it: the same mark as the chart's expand, pointing in (Esc too) — [L315](../../source/src/arr.jsx#L315) `{onBack && <button type="button" className="ibtn am-back" aria-label="Back to Home" title=`
- filtering: the old view eases out, then the new one arrives row by row, top to bottom, as on the Agents list — [L329](../../source/src/arr.jsx#L329) `<AnimatePresence mode="wait" initial={false}>`
- where the year stands now, under the ledger: three numbers that open like any Home tile. They're today's, so the filters above don't move them — [L336](../../source/src/arr.jsx#L336) `{numbers && <div className="am-nums">{numbers}</div>}`

## metric.jsx

- Metric page — what an agenda row opens. One metric, given the whole page: the gap up top on our pace bar, the trend big, then who and what is behind it, then the next agenda item. Built only from parts already in the system (Company health header, page filters, open-card chart, segment bars, agenda row). — [L4](../../source/src/metric.jsx#L4) `import React, { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";`
- gap line: agenda items carry their own words; anything else says it from the card — [L29](../../source/src/metric.jsx#L29) `const gap = item ? item.gap : m.p == null ? "No target set" : '${m.s} of ${m.kind || "targ`

## dept.jsx

- Department page — what a lane name, an agenda row or "Open Sales" leads to. Built only from parts already in the system: the Company health header, the page filters, scoreboard-style metric cards (faint preview → live), the home open-card chart and our segment bars. — [L4](../../source/src/dept.jsx#L4) `import { Stack } from "./stack.jsx";`
- each department's home: its lanes (from Company health), the people in it, and what else is its own. Onboarding is the Value Delivery lane (time to value, Felix activations); RevOps has no metrics connected yet, and says so — [L23](../../source/src/dept.jsx#L23) `export const DEPTS = {`
- one metric card: the scoreboard card (label, value, faint preview chart, footer); the selected one wakes up — [L36](../../source/src/dept.jsx#L36) `function LaneCard({ m, sel, onPick, q, p, E }) {`
- appears under the card you chose: never slides over from the last one — [L50](../../source/src/dept.jsx#L50) `{sel && <motion.span className="dc-tab" initial={{ scaleX: 0, opacity: 0 }} animate={{ sca`
- a lane is a chapter: its five cards always show; only one lane in the department has its detail open at a time — [L121](../../source/src/dept.jsx#L121) `function LaneSection({ r, M, P, open, sel, onPick, i, E }) {`
- status counts across this department's metrics (same scale for every bar: out of the measured ones) — [L159](../../source/src/dept.jsx#L159) `const all = rows.flatMap((r) => LANES[r][3]).map((t) => status(t[2]));`
- which lane is open, and which card in each lane is picked — [L163](../../source/src/dept.jsx#L163) `const [openR, setOpenR] = useState(() => (focus && focus.r != null && rows.includes(focus.`
- keep the newly opened lane in view once the other one has folded away — [L172](../../source/src/dept.jsx#L172) `setTimeout(() => {`
- arrive at the lane that was clicked — [L180](../../source/src/dept.jsx#L180) `useEffect(() => {`
- the header band ends under the header (the lead and who's here included), so nothing below ever sits half in it — [L189](../../source/src/dept.jsx#L189) `const headRef = useRef(null);`
- a department's home What this team is pushing toward, what's moving in it, what it's made, and who's talking: everything that's the team's lives here (your own Home stays about you). Work and files open where they sit, growing out of their tile. — [L213](../../source/src/dept.jsx#L213) `const NA = () => (typeof window !== "undefined" ? window.__northAgents : null);`
- who's in this team right now: its people, and the agents working on its numbers — [L222](../../source/src/dept.jsx#L222) `function DeptHere({ D, rows }) {`
- one line of the team's work, a file, or a conversation: Home's row (face · who and what · where it stands), its hover grown from the cursor; it opens where it is — [L230](../../source/src/dept.jsx#L230) `function DRow({ face, who, what, st, line, onOpen, k }) {`
- the team's files: everything filed here (one home per file), plus what's being made for it right now — [L248](../../source/src/dept.jsx#L248) `const files = [...(T.files || []), ...FILES.filter((f) => !f.hidden && !(T.files || []).so`
- Your files: one place for everything made by you, your agents and your teams. What's waiting on you comes first (with why); then all of it, newest first, filterable by kind. A file opens where you are, and K comments on it. each file, said as what it found or where it stands (not what it is), and whose move it is. A button only when it's yours — [L285](../../source/src/dept.jsx#L285) `const FILE_SAY = {`
- Your files: one place for everything made by you, your agents and your teams. What's waiting on you comes first (with why); then all of it, newest first, filterable by kind. A file opens where you are, and K comments on it. (Restored from v455 at Seth's call; kept: only Sam has files waiting on him, and his private draft stays his.) — [L305](../../source/src/dept.jsx#L305) `const ASK = { webdeck: "Paul asked you to look over slide 3", secpack: "Send it to Priya o`
- tiles or a list, as on Agents; remembered for this viewer — [L311](../../source/src/dept.jsx#L311) `const [view, setView0] = useState(() => { try { return localStorage.getItem("north:files-v`
- the header band ends under the header, as on a team's page, so no row ever sits half in it — [L314](../../source/src/dept.jsx#L314) `const headRef = useRef(null);`
- the kinds and the tiles/list switch set the whole page: they sit across from the first section's heading — [L328](../../source/src/dept.jsx#L328) `const ctl = (<div className="fl-ctl">`
- tiles ⇄ list, the Agents way: the old view eases out, the new one fades in, and the list's rows arrive one by one — [L358](../../source/src/dept.jsx#L358) `function ViewSwap({ view, k, grid, list }) {`
- one file as a row: its icon, its name, what it is (or what's asked of you), who and when — [L364](../../source/src/dept.jsx#L364) `function FileRow({ f, i, ico, mid, who }) {`
- one file, built like the chart tiles on Home: the file itself is the paper (it carries its own name), sitting in the tray, and one line on the tray under it: what it is (or, waiting on you, what's asked), with who and when at the right. Every tile is the same size. Hover is the chart tile's: the tray deepens, the line turns navy, an arrow comes in at the top right. No underline. — [L371](../../source/src/dept.jsx#L371) `function FileTile({ f, ask, who }) {`

## arr-data.js

- ARR movement, one source for Home and the ARR movement page, so the two can never disagree. All of it is sample data. The world North shows is October 2026: September is the latest close, October is live (to date), November and December are the plan. Every month is built the same way: beginning + new + expansion − churn − downgrade = ending. — [L4](../../source/src/arr-data.js#L4) `import { C } from "./lib.js";`
- per year: where it starts, the ending ARR each month, churn and downgrade ($M), NRR − 100 in points (sets expansion), Felix ARR, average ARR per account ($K), and Medium+'s share of ending ARR — [L14](../../source/src/arr-data.js#L14) `const YEAR = {`
- October lands exactly on Home's split: Medium+ $31.10M, Ind & Small $4.65M — [L34](../../source/src/arr-data.js#L34) `mid: [0.852, 0.854, 0.856, 0.858, 0.86, 0.862, 0.864, 0.866, 0.87, 31.1 / 35.75, 0.871, 0.`
- Medium+'s share of each part of the movement (it expands more and churns less than Ind & Small) — [L48](../../source/src/arr-data.js#L48) `const MID_PART = { exp: 0.93, churn: 0.74, down: 0.84, felix: 0.88 };`
- the months, measured / live / plan, for a year — [L51](../../source/src/arr-data.js#L51) `export function colsFor(year) {`
- the whole movement for a segment and a year, every row twelve months long — [L58](../../source/src/arr-data.js#L58) `function build(year, seg) {`
- Home's view: 2026, all accounts. Ending ARR by month, and what moved each measured month (Jan–Oct, October to date) — [L91](../../source/src/arr-data.js#L91) `const A = arrData("all", "2026");`
- the movement colors: losses are reds, never salmon; net new turquoise — [L97](../../source/src/arr-data.js#L97) `export const MOVE_C = { new: C.navy, exp: C.purple, churn: "#d9374b", down: "#8e1b2b", net`

## team-data.js

- What each seat sees on the Team prototypes. Every figure is the prototype's own (agents-concept.jsx, App.jsx, chat.jsx). · what each seat sees — [L3](../../source/src/team-data.js#L3) `export const SEATS = {`
