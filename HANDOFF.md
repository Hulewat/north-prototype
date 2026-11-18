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
| Meetings (list and calendar) | `MeetingsPage`, `CalCard` | [`meetings.jsx` L545](source/src/meetings.jsx#L545), [L506](source/src/meetings.jsx#L506) |
| Routines | `RoutineList` | [`routines.jsx` L63](source/src/routines.jsx#L63) |

**Product rules that cut across pages:**
- **One record, many places.** A decision shown on Home, in Meetings and on the Agents floor is the same object. Deciding it anywhere decides it everywhere. See `choose()` and the store at [`goals.jsx` L30–45](source/src/goals.jsx#L30).
- **Finished work** leaves In progress and lands by **Agents** in the sidebar.
- **Home must not become a long list:** three items show, then "N more for you".
- **Never show the same information twice in one area.** Add nothing that wasn't asked for: no "live" dots, no blinking cursors, no labels explaining labels.
- **Sample data:** every invented number is marked "(sample)" and is consistent with the rest of the story. Example: $40.03M plan, Outbound at 23% of pace, Brightline renewing Nov 14.

---

## 6. The details

Sections 1–5 are the system. Most of what makes North feel like North sits one level down: small moments on specific features. The source has those written down. Almost every component has a comment saying what it does and why. **[`docs/behaviors/`](docs/behaviors/README.md) collects all ~1,900 of those comments, grouped by surface. Each one links to the line that does it.** Read it the way you'd read a spec, one surface at a time. Regenerate it after source changes with `node tools/behaviors.mjs` from `source/`.

These are the ones most often missed:

**Sidebar**
- **Hover Agents when work is done:** the finished work peeks out of the sidebar's edge beside Agents, right there on hover.
  - It closes 350ms after you leave, unless you moved onto it. If you opened it, it stays.
  - "Open" grows it in place into what came of it. You never leave the page.
  - [`App.jsx` L193](source/src/App.jsx#L193), [`chat.jsx` L602–604 `JobNote`](source/src/chat.jsx#L602), [L2805–2808](source/src/chat.jsx#L2805), [L3729](source/src/chat.jsx#L3729)
- **Hover Watching:** the list pushes out of the row at the sidebar rail's edge.
  - It starts at the row's height and spreads along the line, in the sidebar's own background.
  - It's the same flyout recipe as the done-work peek.
  - [`EdgeFly`, `chat.jsx` L628](source/src/chat.jsx#L628), [`WatchList` L649](source/src/chat.jsx#L649), [L3740](source/src/chat.jsx#L3740)
- **Watching's count** counts a change until you've opened Watching once. After that, only new changes count. [`chat.jsx` L1951](source/src/chat.jsx#L1951)
- **Ask North:** the label shimmers on a 6s cycle. On hover, the North mark's spokes push out one after another (1.2px, 40ms apart, 520ms) and come back. [`shell.html` L1141](source/src/shell.html#L1141), dials `hover.askShimmer` / `nlPush` / `nlStagger` / `nlDur`.

**Ask North (chat)**
- **The bar sits off the bottom.** Nothing touches the window's edge:
  - The page card ends 13px above the bottom edge, matching its 13px top. That's `--app-b`; it's 72px only while the dials timeline is showing.
  - The ask field sits a further 20px up inside a full-screen chat, and 12px up when docked.
  - [`shell.html` L2432–2436](source/src/shell.html#L2432), [`shell.html` L33](source/src/shell.html#L33)
- **The text stops before the bar.** There's a 120px space under the last message (dial `chat.tail`), so the conversation ends with room to breathe instead of running into the field. [`App.jsx` L1467](source/src/App.jsx#L1467)
- **Watch on an answer:** the bell under an answer adds that number to Watching. Turn it off in the list and it leaves. The bell brings it back. [`chat.jsx` L544](source/src/chat.jsx#L544)
- **Answer actions are icons only.** Hover, focus or open pushes the label out to the right, and everything after it slides over. The width animates to the label's real size, so it reads as a push, not a pop. Timing: 0.34s `cubic-bezier(.32,.72,0,1)`. [`chat.jsx` L1401](source/src/chat.jsx#L1401)
- **Answers stream** at 38ms per two words, after thinking steps of 0.55s each. Charts in an answer draw in over 1.5s.

**Home**
- **A Needs-you row opens in place into its brief.** The card grows from the line's height to the brief's height, measured, as one smooth move. The line crossfades into the brief inside it. [`goals.jsx` L398](source/src/goals.jsx#L398)
- **Handing one off:**
  - The tick lands and "Caleb has it" shows for a beat.
  - Then the line itself travels down into In progress. It's one element in two places, a shared `layoutId`.
  - [`goals.jsx` L37](source/src/goals.jsx#L37)
- **Set aside (×)** removes a row, with Undo for 6 seconds. It stays on its goal. [`goals.jsx` L35](source/src/goals.jsx#L35)
- **In progress:** the panel grows up out of the ticker item you clicked and covers the rows. The rows never show through it. [`shell.html` L5826](source/src/shell.html#L5826)

To find any other moment: open the matching file in `docs/behaviors/` and search for the thing's name.

---

## 7. What an answer may contain

This is the part most often built wrong. An answer in North is short, says one thing, and has **at most one extra** after it. If your answer has two tables, a status column, or a row of suggestions each with four buttons, it's wrong, even if every fact in it is right.

Designs for every state: [Figma · North · Chat rules](https://www.figma.com/design/UVn2kmDmvNhMEkoRwluHYs/?node-id=933-1043).

### 7.1 The answer itself
- **North answers.** General questions are answered by North, never by an agent (not Fia, not Riley). An agent speaks only when the user addressed it with @.
- **The answer comes first:** one or two sentences that answer the question. Never put the point after the data ("The thing that matters: …" at the bottom is wrong).
- **One visual at most.** A trend is a chart from section 4.2 (target as the coral pace dot/line). A table only when the user asked to compare many rows. **Never two tables. Never a table that repeats the text.**
- **Each number once.** The sentence gives the read; the chart carries the numbers.
- **No system words:** no "amber", "green", "status", "(part month)". Status is shown by the chart's design.
- **No method talk or hedging** ("which is about where we'd expect mid-month since it's a running count" is cut).
- **No coloured dots or coloured text** to flag anything. Who a row is for is shown by their face.
- **An agent's view goes inside the answer** as "Calvin's read: …" when it changes the answer. There is **no "X has a take · Bring in X"** invite. (The prototype still shows one under some answers. The rule wins; don't copy it.)

### 7.2 The one extra
Most answers end with nothing after them. The icon row (Copy, Share, Google Chat) shows under the **latest** answer only; older answers show it on hover. Then at most **one** of these, in this priority:

| When | What appears | Its only action |
|---|---|---|
| North needs a choice to go on | The question, with the choices as buttons ("Which team? · Customer Value · Sales") | Pick one |
| You asked for something done (draft, chase, pull a list) | One card: the agent whose job it is and what they'd do | "Give it to Calvin →" |
| You've asked for the same thing a third time | One card, only you see it: what the routine would do and when | "Make it a routine →" |
| You asked about something that will change (a renewal, a deal) | The Watch in the icon row opens up and names it ("Watch Brightline") | Watch |
| A group thread goes quiet with work in it | One card listing the pieces of work and who has each | "Make it a project →" |

- **A follow-up question is never a task.** "Show Felix health by segment" is something the user types. It never gets Accept / Assign / Let Fia do it / Not now.
- **One card, one action.** No Accept + Assign + Let X do it + Not now on the same row. Ignoring a card is the "no": it clears when the user sends their next message and never comes back on that topic.
- **The card** is the Tally card from the Fia file (grey tray, paper surface, action strip along the bottom on the tray), compact: icon beside the title and one line, ~103px tall.
- **Saying yes makes the card go away.** One quiet grey line is left in its place ("Calvin has it. The drafts land here when they're ready."). The result is posted in the same chat when it's done.
- **Arrows, not chevrons.** Anything that takes you somewhere, and every card action, uses a real forward arrow. Chevrons are only for dropdowns and things that open in place.
- **Watch** is only for something that will keep changing. Never on a decision, never on a list of your own calls, never inside an opened item.
- **Nothing opened sends you away.** An opened item in an answer has no "Open in Agents".

### 7.3 Asking before building
When the user asks North to make something ("make a chart of this") and the answer would change what it builds, North asks first.
- One line saying why ("Two quick questions so it's the chart you want."), then **one card that steps in place**: at most three questions, one at a time.
- The question is the one strong line (18px). Answers are rows divided by full-width hairlines, each with a number key (1, 2, 3) and a grey description. The likely answer is first and already chosen, so Enter moves on. The last row is "Something else…" to type your own.
- What's already answered sits as one grey line with a tick above the question. **No "Question 2 of 3", no progress bar.**
- Actions on the strip: Next (Build it on the last question) and "Skip, use defaults" (Back after the first question).
- Done: the card folds into one line of what was chosen with "Change", and North starts building.

### 7.4 Before and after
The engineer build's answer to "show me the latest on Felix usage": Fia answers, two untitled tables with identical headers, every number twice, "amber/green" words, the point at the bottom, then two suggestions with four buttons each and red dots. It should be:

> Felix health is slipping: 68 this month, down from 70, and 11 under target. Agents are accepting fewer of the handoffs Felix creates, so if it holds, November is the third month in a row below target.
>
> *[one chart: health score Sep–Nov, target as dots]*
>
> Copy · Share · **Watch Felix health**

---

## 8. Meetings calendar

Meetings has a List / Calendar toggle in the left column. `CalCard` [`meetings.jsx` L506](source/src/meetings.jsx#L506). All its timings are dials in the Motion panel under **Meetings calendar** ([`App.jsx` L1438](source/src/App.jsx#L1438)); press D, then T, then click the calendar.

**Layout**
- The calendar runs to the card's edges; there's no card inside the card. Every divider runs the full width or height of the card, including the line under the pinned header.
- Head: the date (a dropdown that opens a month picker grown out of it), back / forward arrows, "Today" only when you're not on today, and Day / Week / Month on the right.
- **Hide weekends** is a switch at the bottom of the left column, under the meeting types, **on by default**: Week is Mon–Fri and Month has five columns. Off: seven days. Day view skips weekends while it's on.
- The left column's toggle sits on the same line as the calendar's header row, and the first meeting type on the day-header row, both at rest and when pinned on scroll.
- Day headers: "Mon 9", day and date in the same size, weight and colour. Today is a tinted column only; no filled pill on the date.
- Meeting blocks: solid colour by type (Leadership `#2563a8`, Revenue `#6d4fc2`, Customers `#098486`, People `#ff725c`) with the grain at soft-light, white text, radius 4. **No coloured bar down the side. No time on Week blocks** (Day view shows the range on every block). In Month, days outside the month show their meetings at 30%.

**Motion**
- **Switching view** (Day / Week / Month, or Hide weekends): the old view fades out quickly; the new one's meetings **slide down out from behind the line above their slot**, one after another. They're clipped at their own top edge, so nothing ever crosses a divider. Defaults: 0.25s `cubic-bezier(0, 1.05, .48, .95)`, 27ms apart, no delay, from opacity 0. Stepping through dates (arrows) slides the whole view sideways instead. [`shell.html` L6146](source/src/shell.html#L6146)
- **Turning a meeting type off:** its meetings close back up the way they came, sliding up behind the line (0.22s). In Month the chip then folds its row away so the chips under it close the gap. Turned back on, they slide down again. [`shell.html` L6155](source/src/shell.html#L6155)
- **Opening a meeting** works like opening a chart card on Home. `Full` [`meetings.jsx` L470](source/src/meetings.jsx#L470):
  - The block itself grows into the card (0.5s `cubic-bezier(.32,.72,0,1)`), corners 4 → 12. Its colour turns to paper in the first ~45% so you never see a big slab of colour.
  - The title row (name and date) **starts as the block's label** (13px, white, at the label's spot) and grows with the box on the same curve into the 24px navy title. It's one element; there's no separate copy and no swap at the end.
  - The rest of the meeting arrives in a quick stagger from 0.08s, 16ms apart.
  - Closing is the reverse (0.32s `cubic-bezier(.45,0,.15,1)`): the body fades in ~0.1s, the title shrinks back into the label, the colour comes back only at the end.
  - Esc, clicking outside, or "‹ Nov 9 – 13" in the header closes it. Switching to List with a meeting open goes straight to that meeting in the list; the calendar leaves whole and comes back closed.
- **Ask for a day or a meeting** with K or voice ("show me Thursday", "the Monday sync", "month view") and the calendar goes there; a meeting opens from its own block. [`meetings.jsx` L312](source/src/meetings.jsx#L312)

---

## 9. Checklist

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

**Answers (section 7)**
- [ ] A general question is answered by North, not an agent.
- [ ] The first sentence answers the question.
- [ ] No answer has two tables, a status column, or the same number twice.
- [ ] No "Bring in X" invite anywhere. No coloured dots.
- [ ] After an answer: nothing, or exactly one extra with one action. No row with Accept + Assign + Not now.
- [ ] Card actions use a forward arrow, not a chevron.
- [ ] Saying yes to a card removes it and leaves one grey line.

**Meetings calendar (section 8)**
- [ ] Hide weekends is on when the page opens.
- [ ] Switch Week → Month: meetings slide down from behind their line, never over a divider.
- [ ] Turn a meeting type off: its meetings slide back up and away, they don't vanish.
- [ ] Open a meeting: its name grows out of the block into the title with the box, with no pop at the end.

---

*Generated from the prototype source at the commit that added this file. If a line link drifts, search the file for the function name.*
