# North: engineering handoff

This is the spec for the North prototype's design: what it looks like, how it moves, and how it behaves. Every value here comes from the prototype's source, which is now in this repo under [`source/`](source/). Each section links the exact file and line, so you can read the real implementation instead of working from screenshots.

**Two ways to use this:**

1. **If your app is React:** port the primitives listed under "Port these first". They are plain React 18 + [Motion](https://motion.dev) (`motion/react`) and CSS variables, with no other dependencies.
2. **If it isn't, or you'd rather rebuild:** treat each section as the spec, and run the checklist at the end against your build. Every item on it is pass or fail.

The live prototype is the reference: https://hulewat.github.io/north-prototype/

---

## 0. How to read the prototype

**See and tune the motion values.** On the live site:
- Press **D** to open the dials panel. It shows every motion value, grouped and named in plain English.
- Press **T**, then click any element, to see which dials drive that element and their current values. See [`tune.jsx` L62–65](source/src/tune.jsx#L62).

The defaults in that panel are the spec. They're defined in one object, `SPEC`, in [`App.jsx` L1308–1510](source/src/App.jsx#L1308). Section 3 of this doc summarizes them.

**Build it locally:**
```
cd source
npm install
node build.mjs        # writes dist/north-home.html: the same file as index.html at the repo root
```
`build.mjs` bundles `src/App.jsx` with esbuild. Its output is byte-identical to the published `index.html`, so the source is complete.

**Port these first.** Most of the "it doesn't feel right" gap lives in about six small pieces:

| What | File | Lines |
|---|---|---|
| Colour + motion helpers (`C`, `bezier`, `stag`, `win`, `toMotion`, `useGraceHover`) | [`lib.js`](source/src/lib.js#L5) | 1–115 |
| Global hover (fill grows from the cursor), applied by selector | [`hover.js`](source/src/hover.js) | whole file |
| `RowHover` (the same hover, for React lists) | [`agents.jsx`](source/src/agents.jsx#L342) | 342–346 |
| `SelIn` (selection grows from the click point) | [`agents.jsx`](source/src/agents.jsx#L349) | 349–360 |
| Chart grammar: axis, target line, column hover, tooltips | [`open-charts.jsx`](source/src/open-charts.jsx#L1) | 1–146 |
| Tokens and base styles | [`shell.html`](source/src/shell.html#L9) | 9–36 |

---

## 1. Foundation

### Colour roles
Defined in [`shell.html` L9–21](source/src/shell.html#L9) (CSS) and [`lib.js` L5–20](source/src/lib.js#L5) (JS, for SVG).

| Token | Value | Role |
|---|---|---|
| `--navy` | `#093555` | Text, primary buttons, the main data colour |
| `--navy-fill` | `#1f4b70` | Bars and fills in navy |
| `mtd` | `#7395b3` | The live month (month to date): always a lighter version of its series |
| `--ink` | `#545454` | Secondary text |
| `--mute` | `#8a8a8a` | Quiet text: context, dates, axis labels |
| `--line` | `#e2e2e2` | Hairlines and gridlines |
| `--edge` | `#d3d3d3` | Tooltip and menu edges (0.5px) |
| `--paper` | `#fefbf9` | The page and every surface on it (warm, never pure white) |
| `--sel` | `#ededed` | Selected-row fill |
| `--coral` | `#ff725c` | **Target or pace only.** Never used for anything else. |
| `--alert` | `#b1042f` | **Behind, late, at risk** |
| `--teal` | `#098486` | Ahead, hit; the "an agent can take it" action |
| `--purple` | `#6d4fc2` / `#744ccb` | A second series (Felix), agent accents |
| Month-over-month in tooltips | up `#257985`, down `#9b1b5a` | [`open-charts.jsx` L20](source/src/open-charts.jsx#L20) |

**Rule:** salmon/coral means "where it needs to be". Dark red means "behind". Don't swap them, and don't use either one as decoration.

Page background: `linear-gradient(180deg, #ebf0f5 0, #fefbf9 640px)`. See [`shell.html` L24](source/src/shell.html#L24).

### Type
- Font: **Instrument Sans**, weights 400, 500 and 600 only. Loaded from Google Fonts in [`shell.html` L5](source/src/shell.html#L5).
- **Two working sizes: 14 and 13.** 14/20 is for row titles (500 weight, navy). 13/20 is for context next to them (400 weight, mute). A component never mixes more than two sizes, two weights and two colours.

| Use | Size / line height | Weight | Colour |
|---|---|---|---|
| Page greeting (Home) | 40 / 33 | 600 | navy |
| Page title (Meetings, Files, Agents…) | 30 / 36 | 500 | navy |
| Detail title (e.g. a meeting) | 24 / 32 | 500 | navy |
| Section heading | 16 / 22 | 500 | navy |
| Row title | 14 / 20 | 500 | navy |
| Row context, dates | 13 / 20 | 400 | mute |
| Quiet group label | 11 / 16, uppercase, letter-spacing .06em | 500 | `#9aa3ab` |
| Chart axis labels | 11 | 500 | mute |
| Tooltip title | 16 / 20 | 600 | navy |

Hierarchy comes from spacing, not from bigger or heavier type. If something needs more emphasis, give it more room first.

### Surfaces
- No drop shadows on components. No white outlines or white cards on the paper.
- A surface is one step off what it sits on, never more.
- Hairlines are 0.5px (`--line` or `--edge`).
- Radii: 6px for rows, buttons and menu items; 8px for tooltips and cards.
- Bars carry a fine grain: the `.grain` noise texture, blended soft-light. See [`shell.html` L31](source/src/shell.html#L31).

---

## 2. Interaction patterns

These five patterns cause most of the "hover states are wrong" feeling. Each one is a single primitive. Get it right once, and every list inherits it.

### 2.1 Hover grows from the cursor
Every hoverable row, menu item and list item uses this one hover. Never an instant background swap.

- **Enter:** a fill starts as an 18px-wide sliver at the cursor's x position, inset 5px top and bottom. It grows to the full row over **500ms, `cubic-bezier(.32,.72,0,1)`**. Opacity fades in at the same time, 200ms linear.
- **Leave:** opacity fades out over **250ms, `cubic-bezier(.4,0,1,1)`**. The fill doesn't shrink back.
- **Fill:** `rgba(9,53,85,.05)`, radius 6. The row's content sits above it (`z-index: 1`).
- **Skipped** on rows that are selected (`.is-on`, `.is-sel`) or open (`.is-open`). A selected row doesn't also get a hover.
- **Touch:** no hover.

Implementation:
- [`hover.js`](source/src/hover.js) applies it globally, by selector (a WAAPI animation on `left/right/top/bottom`).
- [`RowHover`, `agents.jsx` L342](source/src/agents.jsx#L342) is the same thing as a React component.
- CSS: [`shell.html` L2453–2454](source/src/shell.html#L2453).

### 2.2 Selection grows from where you clicked
A selected row (list items, sidebar, a meeting in the Meetings list) is **filled, never outlined**. The fill appears at the click point and grows out. It **never slides over from the previously selected item.**

- A clip-path goes from an 18px sliver at the click x to `inset(-2px round 6px)`.
- Opacity goes from 0.4 to 1.
- Timing: 500ms, `cubic-bezier(.32,.72,0,1)`.
- With the keyboard, the fill grows from the row's centre.
- Fill: `--sel` (`#ededed`), radius 6.
- Implementation: [`SelIn`, `agents.jsx` L349–360](source/src/agents.jsx#L349).

**Never put a stroke or border on a selected item.**

### 2.3 Things open in place
Details open where you are, not on a new page or in a modal.
- **Open:** height animates from 0 to auto, **400ms `cubic-bezier(.22,1,.36,1)`**, with opacity alongside it. Rows under it move down smoothly.
- **Close:** **Esc** and **a click anywhere outside** both close. This holds for every panel, menu and brief.
- **Example:** a task row in Meetings opens to show the transcript line it came from. See [`meetings.jsx`, `Task`](source/src/meetings.jsx) and `OPEN`.

### 2.4 Menus grow out of their button
A dropdown starts as its own button's rectangle and grows out of it. It doesn't fade in somewhere else.
- A clip-path goes from the button's size (`--bw`, `--bh`) to the full menu. Timing: **620ms, `cubic-bezier(.16,1,.3,1)`**.
- Keyframes:
  - [`shell.html` L5988 `mgUnit`](source/src/shell.html#L5988)
  - [`L2438–2440`](source/src/shell.html#L2438)
- Timing comes from the dials: [`L2496`](source/src/shell.html#L2496).
- Menu items use the cursor hover from 2.1.

### 2.5 Buttons
From [`shell.html` L4560–4565](source/src/shell.html#L4560) and [L1487–1514](source/src/shell.html#L1487).

| Kind | Look | Hover |
|---|---|---|
| Primary (`.rt-b.is-pri`) | navy fill, white 13/18 500, height 32, padding 0 14, radius 6 | `#0f4a73`, plus a soft light that follows the cursor (90px radial, white .24, positioned by `--mx/--my`). **No lift, no shadow.** See [L1514](source/src/shell.html#L1514). |
| Secondary in a list (`.nd-a .rt-b`) | transparent, 1px inset ring `rgba(9,53,85,.22)`, height 30 | the cursor hover from 2.1 |
| Agent can take it (`.is-let`) | ring `rgba(9,132,134,.45)`, text `#076a6c` | `rgba(9,132,134,.1)` |
| Quiet (`.is-q`) | no fill, mute text | navy text |

Rules:
- **At most one navy button in view.** It goes on the thing that matters most.
- **Every action button in a list or panel ends on the same right edge**, whatever the content length.

### 2.6 Checkbox
A 16px square, radius 4, with a 1px inset ring `rgba(9,53,85,.3)`.
- Hover: the ring darkens to .55.
- Press: scales to .9.
- On: navy fill, and the tick *draws* itself (pathLength 0→1, 280ms).
- Every task uses this box, people's and agents' alike. No circles.
- Implementation: [`shell.html` L5964–5966](source/src/shell.html#L5964), `Mark` in [`meetings.jsx`](source/src/meetings.jsx).

### 2.7 Keyboard
- **Esc** closes whatever is open, from the innermost thing out.
- **⌘K** opens Ask North.
- **K** steers the open piece of work (it works without a visible hint).
- Hold **Control**, or hold **Space**, to talk.

---

## 3. Motion

Every timing has a name and lives in the dials (`SPEC`, [`App.jsx` L1308](source/src/App.jsx#L1308)). Below are the ones that most define the feel. A spring is given as visual duration and bounce (Motion's `{ type: "spring", visualDuration, bounce }`).

| Moment | Value |
|---|---|
| Hover grows from the cursor | 0.5s `cubic-bezier(.32,.72,0,1)` |
| Selection grows in place | same as hover |
| Dropdown grows out of its button | 0.62s `cubic-bezier(.16,1,.3,1)` |
| Key metric card grows open / closes | 0.55s / 0.4s `cubic-bezier(.32,.72,0,1)` |
| Details settle in after opening | wait 0.08s, then 0.3s `cubic-bezier(.22,1,.36,1)`, 22ms stagger per row |
| Chart bars / ticks draw in | 0.8s `cubic-bezier(.16,1,.3,1)` each, staggered over 55% of the run |
| Tooltip pops in | spring 0.35 / 0.1 |
| Tooltip follows the cursor between bars | spring 0.22 / 0 |
| Keep a bar's tooltip after leaving it | 180ms grace |
| Chart column highlight slides | 0.32s `cubic-bezier(.22,1,.36,1)` |
| Toggle pill (Bars / Line) slides | spring 0.38 / 0.16 |
| Bars ↔ line morph | spring 0.85 / 0.06 |
| Sidebar sections open / close | spring 0.32 / 0 |
| Sidebar active row | spring 0.4 / 0.1 |
| Page swap | 0.24s fade `cubic-bezier(.22,1,.36,1)` |
| Chat opens / moves / docks | 0.34s `cubic-bezier(.2,.9,.25,1)` |
| Answer streams in | 38ms per two words |
| Button press (mic, add) | spring 0.2 / 0.3 |
| Type arrives on page load | drops 12px, unblurs from 8px |

**What the motion is for:**
- Things arrive from where they come from: a menu from its button, a hover from the cursor, a selection from the click.
- Nothing teleports. Nothing slides in from somewhere unrelated.
- Motion should be expressive, never stop-and-go: constant rates, no pauses mid-animation.
- If you simplify a screen, keep its motion.

**Reduced motion:** respect `prefers-reduced-motion`. See `prefersReduced` and `useReplay` in [`lib.js`](source/src/lib.js).

---

## 4. Charts

All charts share one grammar. The base geometry, axis, target and hover are in [`open-charts.jsx` L1–146](source/src/open-charts.jsx#L1). If yours don't match, start there.

### 4.1 The grammar (every chart)

**Plot geometry:** 641×190, y-axis labels right-aligned at x 44, baseline at 168. See [`geo()` L12](source/src/open-charts.jsx#L12). It scales through `GeoCtx`.

**Gridlines:**
- 0.5px `#e2e2e2`.
- The baseline is 1px `#c9c4bf`.
- Labels are 11/500 mute, fading in with a stagger.
- Gridlines cut through bars as thin paper lines, so a bar reads as stacked units.
- See [`Axis` L24](source/src/open-charts.jsx#L24).

**Target:**
- A **dotted coral line**: 1px, `stroke-dasharray: 0.1 2.6`, round caps.
- It draws left to right, then a coral dot (r 3) lands at the end. On hover the dot grows to r 4.5 and a small tooltip explains it.
- Its label is 11/600 coral, right-aligned, 9px above the line.
- See [`Target` L49](source/src/open-charts.jsx#L49).

**The live month:** it's always a lighter version of the series colour (`mix(color, "#fff", .45)`). Its tooltip's eyebrow says "month to date".

**Hover (bar charts):** [`useColumnHover` L70](source/src/open-charts.jsx#L70), [`ColumnTip` L84](source/src/open-charts.jsx#L84)
- It triggers only on the mark itself (the bar, plus 10px of slack above it, across the whole column). The empty space above doesn't count.
- The hovered bar stays at full strength. **Every other bar drops to .45 opacity** over 250ms. The month label goes navy and 600 weight.
- The tooltip rises from the top of the hovered bar. It **glides** to the next bar when you move (spring 0.22 / 0), rather than jumping.
- The first and last columns align their tooltip to their outer edge, so it never spills out of the chart.
- After leaving, a **180ms grace** before it disappears ([`useGraceHover`, `lib.js` L108](source/src/lib.js#L108)).

**Tooltip:** [`shell.html` L238–249](source/src/shell.html#L238), [`TipBody`, `visuals.jsx` L56](source/src/visuals.jsx#L56)
- Paper surface, 0.5px edge, radius 8, padding 12/14/10, min width 168.
- Content:
  - Eyebrow: 11, mute, with a colour swatch.
  - Title: 16/20, 600, navy.
  - Rows: 18 line height. Value in navy 600, month-over-month coloured up/down.
  - A divider runs the full width of the tooltip.
- In small charts it collapses to one line ([`.tip-compact`, L513](source/src/shell.html#L513)).

**Dot tooltip (lines):** drawn inside the SVG, right against the point. See [`DotTip` L34](source/src/open-charts.jsx#L34).

**Interactive by default:** every chart has hover detail. If a chart has only one way to look at it, it has no view toggle.

### 4.2 The chart set
Each chart is one component. Use these, not a library's defaults.

| Chart | Component | Notes |
|---|---|---|
| Monthly bars (Total ARR, Felix ARR, Net new) | [`MonthlyBars`, `open-charts.jsx` L108](source/src/open-charts.jsx#L108) | the reference implementation of 4.1 |
| Monthly line on a zoomed axis (NRR) | [`MonthlyLine` L147](source/src/open-charts.jsx#L147) | striped fill under the line |
| Pace this month | [`PaceLine` L179](source/src/open-charts.jsx#L179) | actual (striped, metric colour) vs a straight coral pace line |
| By segment | [`Segments` L217](source/src/open-charts.jsx#L217) | one bar per segment; the second is lighter |
| By kind (new + expansion − churn) | [`ByKind` L245](source/src/open-charts.jsx#L245) | stacks up from $0; churn is the dashed slice |
| Booked ARR ticks ("piano keys") | [`BookedTicks`, `visuals.jsx` L126](source/src/visuals.jsx#L126) | keys rise 23px under the cursor, spreading to neighbours (spring stiffness 450, damping 22) |
| Win rate rings | [`WinRings` L212](source/src/visuals.jsx#L212) | |
| New logos area | [`LogosArea` L276](source/src/visuals.jsx#L276) | area, pace line, dotted projection |
| Win rate ruler | [`DemoRuler` L359](source/src/visuals.jsx#L359) | one value against its target on a scale; the gap lights up |
| Expansion lines | [`ExpansionLines` L419](source/src/visuals.jsx#L419) | booked vs pace, striped bands |
| Time to value lollipops | [`TtvLollipop` L511](source/src/visuals.jsx#L511) | two lollipops, with the overrun between them |
| Spike / trend (in chat) | [`TrendPlot`, `chat.jsx` L857](source/src/chat.jsx#L857) | one marker, one behaviour; no separate tooltip |
| Tick rows (in chat) | [`TicksPlot`, `chat.jsx` L937](source/src/chat.jsx#L937) | the hover starts at the tick under the cursor and spreads to the ends; ticks grow up from the baseline |
| Ring of wedges (in chat) | [`RingPlot`, `chat.jsx` L989](source/src/chat.jsx#L989) | hover a part: its wedges grow outward in a clockwise ripple; nothing lifts |
| ARR by month (full year) | [`YearChart`, `arr.jsx` L122](source/src/arr.jsx#L122) | measured months solid, live month lighter, plan months dotted outlines; hover a month and its bar splits into what built it |
| Total vs Felix | [`TotalFelix`, `arr.jsx` L201](source/src/arr.jsx#L201) | navy for Total, purple for Felix; solid to today, dotted through plan |
| ARR movement (Home) | [`ArrChart`, `health.jsx` L233](source/src/health.jsx#L233) | the year-end gap is the space between December's bar and the plan line |
| Score ring | [`Ring`, `health.jsx` L107](source/src/health.jsx#L107) | dashed track and dashed arc, 36px |
| Heatmap | [`Heatmap`, `health.jsx` L440](source/src/health.jsx#L440) | squares fade in from the centre out to the corners; a square grows open in place |

To see each chat chart render on demand: open the dials (D), then use the **▶ Chat: …** actions at the bottom of the panel.

---

## 5. Pages

| Page | Entry | File |
|---|---|---|
| Home (greeting, ask bar, Needs you, In progress, metric tiles) | `App` + `NeedsYou` | [`App.jsx`](source/src/App.jsx), [`goals.jsx` L779](source/src/goals.jsx#L779), [`home-work.jsx`](source/src/home-work.jsx) |
| Ask North (chat, docked / full / popped out) | `Chat` | [`chat.jsx` L1922](source/src/chat.jsx#L1922) |
| Company health | `CompanyHealth` | [`health.jsx` L842](source/src/health.jsx#L842) |
| ARR movement | `ArrPage` | [`arr.jsx` L300](source/src/arr.jsx#L300) |
| A key metric, opened | `MetricPage` | [`metric.jsx` L17](source/src/metric.jsx#L17) |
| Team pages (Sales, Marketing…) | `Department` | [`dept.jsx` L152](source/src/dept.jsx#L152) |
| Files | `FilesPage` | [`dept.jsx` L306](source/src/dept.jsx#L306), [`files.jsx`](source/src/files.jsx) |
| Agents | `AgentsWorkspace` | [`agents-concept.jsx` L2718](source/src/agents-concept.jsx#L2718) (styles scoped under `.agx`) |
| Meetings | `MeetingsPage` | [`meetings.jsx` L229](source/src/meetings.jsx#L229) |
| Routines | `RoutineList` | [`routines.jsx` L63](source/src/routines.jsx#L63) |

**Product rules that cut across pages:**
- **One record, many places.** A decision shown on Home, in Meetings and on the Agents floor is the same object. Deciding it anywhere decides it everywhere. See `choose()` and the store at [`goals.jsx` L30–45](source/src/goals.jsx#L30).
- **Finished work** leaves In progress and lands by **Agents** in the sidebar.
- **Home must not become a long list:** three items show, then "N more for you".
- **Never show the same information twice in one area.** Add nothing that wasn't asked for: no "live" dots, no blinking cursors, no labels explaining labels.
- **Sample data:** every invented number is marked "(sample)" and is consistent with the rest of the story. Example: $40.03M plan, Outbound at 23% of pace, Brightline renewing Nov 14.

---

## 6. Checklist

Walk your app with the prototype open beside it. Every line is pass or fail.

**Foundation**
- [ ] Instrument Sans at 400 / 500 / 600 only, with no other weights.
- [ ] Row titles 14/20 500 navy; context 13/20 mute. No component mixes more than two sizes.
- [ ] The page is `#fefbf9` paper with the `#ebf0f5` wash at the top. No pure-white surfaces.
- [ ] No drop shadows on cards, rows or buttons.
- [ ] Coral appears only on targets and pace. Dark red appears only for behind, late or at risk.

**Hover and selection**
- [ ] Hover a sidebar row, a list row and a menu item. In each, the fill starts at the cursor and grows sideways over about half a second, without snapping on.
- [ ] Move off a row: it fades over 250ms and doesn't shrink.
- [ ] Hover a selected row: no second hover appears on top.
- [ ] Click a list item: its fill grows from where you clicked. It doesn't slide from the previously selected item.
- [ ] Nothing selected has a border or stroke.

**Open and close**
- [ ] Every dropdown grows out of its own button.
- [ ] Every panel, menu and brief closes with Esc *and* with a click outside it.
- [ ] Opening details pushes the content below it down smoothly. No modal, no page change.

**Buttons**
- [ ] At most one navy button in view.
- [ ] Action buttons in a list all end on the same right edge.
- [ ] A primary button on hover: a shade brighter, and a soft light following the cursor. No lift, no shadow.
- [ ] Checkboxes are rounded squares everywhere, and the tick draws itself.

**Charts**
- [ ] Every chart has hover detail.
- [ ] Hovering a bar dims the others to .45. The tooltip rises from that bar and glides to the next one.
- [ ] The tooltip waits 180ms after you leave before it goes.
- [ ] Edge columns don't push their tooltip outside the chart.
- [ ] The target is a dotted coral line, drawn left to right, ending in a coral dot that grows on hover.
- [ ] The live month is a lighter version of its series.
- [ ] Gridlines show through bars as thin paper lines.
- [ ] Bars draw in with a stagger. They don't all appear at once.
- [ ] Every chart type in 4.2 exists and matches its component. None is a library default.

**Motion**
- [ ] Timings match the table in section 3. The quickest check: press D on the prototype, press T, click the element, and compare.
- [ ] No animation stops and starts. Rates are constant.

---

*Generated from the prototype source at the commit that added this file. If a line link drifts, search the file for the function name.*
