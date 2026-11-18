# Styles (shell.html), by section

Each note: what it does, then where. Read the linked line for exact values.

## shell.html

- Layout (measured from Figma v7 · Fia / Hover agent · Coach, 1440 frame): 232px sidebar on the frame gradient; a glass card at x232 y13, 16px radius; content inset 33 left / 43 right. — [L9](../../source/src/shell.html#L9) `:root {`
- the sunk tray (Figma Action frame): a hairline, then four stacked inner shadows. Anything you act in, or that sits under what it belongs to, sits in it — [L11](../../source/src/shell.html#L11) `/* the face column holds everyone in a tight group: four faces at 60% overlap = 28 + 3 × 1`
- the face column holds everyone in a tight group: four faces at 60% overlap = 28 + 3 × 11.2 ≈ 62 (more tighten to fit) — [L12](../../source/src/shell.html#L12) `--face-col: 62px;`
- tray: 1.23:1 on paper (was #ededed, 1.14:1, and invisible on the page). A surface is one step from what it sits on — [L16](../../source/src/shell.html#L16) `--paper: #fefbf9; --well: #e6e4e1; /* tray: 1.23:1 on paper (was #ededed, 1.14:1, and invi`
- !important: an inline `background:` colour (how most marks set theirs) would otherwise wipe the noise — [L31](../../source/src/shell.html#L31) `.grain { background-image: var(--noise) !important; background-blend-mode: soft-light !imp`

### sidebar (rows x12 w212 h32, 2px apart; labels at x52)

- sidebar (rows x12 w212 h32, 2px apart; labels at x52) — [L36](../../source/src/shell.html#L36) `.side { min-height: 0; overflow-y: auto; scrollbar-width: none; display: flex; flex-direct`
- same space under the last row as every other section — [L47](../../source/src/shell.html#L47) `.nav-sec:first-child { padding-bottom: 3px; } /* same space under the last row as every ot`
- one row height across the whole sidebar, top group included — [L58](../../source/src/shell.html#L58) `.side nav .nav-row { height: 28px; } /* one row height across the whole sidebar, top group`
- every nav label shares the one grey; Ask North (the brand action) stays navy, the current page goes coral — [L60](../../source/src/shell.html#L60) `.nav-row { color: #5c5c5c; }`
- chat full screen covers the page: only Ask North reads as where you are, the page's row goes quiet (and comes back as the chat leaves) — [L69](../../source/src/shell.html#L69) `.nav-active, .nav-row .nav-label, .nav-row .nav-ico svg { transition: opacity .25s ease, c`

### glass card

- Figma v7: 59% white glass card; the top band (y −20 → 273) fades #fafafb → #ccdae1 at 50% — [L89](../../source/src/shell.html#L89) `background: rgba(255,255,255,.59); isolation: isolate; }`
- the card's 4px frost lives on a layer under its content, not on the card: a backdrop-filter on .main made everything in it invisible to glass laid on top (the voice pill, file veils), so those couldn't blur the page — [L92](../../source/src/shell.html#L92) `.main::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: inh`
- Figma "Rectangle 3": #ccdae1 @50% at the top → #fafafb at the bottom, with a stacked inner shadow that seats it above the cards — [L112](../../source/src/shell.html#L112) `.content::before { content: ""; position: absolute; left: -40px; right: -100vw; top: 0; he`
- same column as the page ask bar (content pad 32 + 5), stops 24px short of the chips — [L128](../../source/src/shell.html#L128) `.dock { position: absolute; left: 37px; right: 468px; max-width: 837px; top: 13px; height:`
- docked, the bar is 34px: the voice button sits at the icons' weight, not over them — [L133](../../source/src/shell.html#L133) `.composer.is-docked .voice { width: 20px; height: 20px; margin-left: 4px; } /* docked, the`
- scale, not transform: the bars' own motion owns transform — [L134](../../source/src/shell.html#L134) `.composer.is-docked .voice .bars { scale: 0.6; } /* scale, not transform: the bars' own mo`
- the page's ask bar grows down as you write past its width: the field is a textarea that sizes to its text, the buttons hold the last line (8px under them, as when it's one line tall) — [L142](../../source/src/shell.html#L142) `.composer:not(.is-docked) { height: auto; min-height: 52px; align-items: flex-end; padding`

### cards: 1px well, paper surface, well-coloured footer

- cards: 1px well, paper surface, well-coloured footer — [L149](../../source/src/shell.html#L149) `.card { background: var(--well); border-radius: 8px; padding: 1px; display: flex; flex-dir`
- KPI rail: 4 cards, 16 apart; inside 12 / 15 label / 5 / 32 value / 5 / 14 bar / 12 — [L182](../../source/src/shell.html#L182) `.rail { display: grid; grid-template-rows: repeat(4, 1fr); gap: 16px; }`

### board: detail + list joined into one unit

- board: detail + list joined into one unit — [L197](../../source/src/shell.html#L197) `.board { margin-top: 56px; }`
- the campaign she built: Saved Charts' layout, its title carrying whose and since when, Remove set clear of the charts — [L201](../../source/src/shell.html#L201) `.cb { overflow: hidden; } .board.is-camp { padding-bottom: 8px; }`
- Remove sits clear of the charts: twice the Saved Charts gap — [L203](../../source/src/shell.html#L203) `.board.is-camp .board-body { margin-top: 24px; } /* Remove sits clear of the charts: twice`
- against a goal, not behind a pace: no red — [L204](../../source/src/shell.html#L204) `.board.is-camp .row-r small, .board.is-camp .card-foot .pace b { color: var(--navy); } .bo`
- behind pace is dark red; salmon stays the target — [L213](../../source/src/shell.html#L213) `.detail .pace { color: var(--alert); } /* behind pace is dark red; salmon stays the target`
- hover: the shared highlight that grows from the cursor (hover.js), not a flat fill — [L228](../../source/src/shell.html#L228) `.row-l, .row-r { display: flex; flex-direction: column; gap: 1px; }`
- behind pace reads dark red; salmon is only ever the target — [L235](../../source/src/shell.html#L235) `.row-r small { color: #b1042f; font-weight: 500; } /* behind pace reads dark red; salmon i`

### tooltip

- rhythm: eyebrow 16 · title 20 (+8) · rows 22 · section breaks 8 above and below the rule — [L240](../../source/src/shell.html#L240) `.tip-in { display: flex; flex-direction: column; gap: 0; } /* rhythm: eyebrow 16 · title 2`
- dividers run the full width of the tooltip — [L248](../../source/src/shell.html#L248) `.tip-r.is-sep { margin: 6px -14px 0; padding: 8px 14px 2px; border-top: 0.5px solid var(--`

### responsive: re-lay out, never just shrink

- DialKit spotlight: hovering a control outlines what it moves — [L282](../../source/src/shell.html#L282) `.dial-spot { outline: 1.5px dashed var(--coral) !important; outline-offset: 3px; border-ra`

### key metrics (2×2) + "you" column — 840 / 263 grid, 2 × 189 + 16 = 394 tall

- key metrics (2×2) + "you" column — 840 / 263 grid, 2 × 189 + 16 = 394 tall — [L292](../../source/src/shell.html#L292) `.top { position: relative; margin-top: 56px; display: grid; grid-template-columns: minmax(`

### opened key metric: fills the 1119 × 394 row

- opened key metric: fills the 1119 × 394 row — [L337](../../source/src/shell.html#L337) `.card.mopen { position: absolute; z-index: 6; padding: 0; display: block; background: none`

### one tile per metric (closed in its slot, open across the row)

- one tile per metric (closed in its slot, open across the row) — [L398](../../source/src/shell.html#L398) `.mtile { position: absolute; cursor: pointer; outline: none; }`
- hover cards for dots: sit right on the dot, with a little caret pointing at it — [L416](../../source/src/shell.html#L416) `.mo-seg-bar s { cursor: default; transition: transform .2s; }`
- description: tight to the label it explains, caret pointing down at it — [L426](../../source/src/shell.html#L426) `.mtile .mo-tip { left: 20px; bottom: calc(100% - 14px); width: auto; max-width: 340px; pad`

### Company health (Figma "Company Health · v8", 721:1043). Card y − 65 = scroll y.

- Company health (Figma "Company Health · v8", 721:1043). Card y − 65 = scroll y. — [L430](../../source/src/shell.html#L430) `.home-page { display: flex; flex-direction: column; }`
- docked copy: fills the top bar on Company health, on the same 32 / 43 content edges as the page — [L448](../../source/src/shell.html#L448) `.safe-note { padding: 24px; font-size: 13px; color: var(--ink); } .safe-note button { marg`
- one weight throughout; the next step is a quiet link with an arrow that steps forward on hover — [L456](../../source/src/shell.html#L456) `.ch-north-go { display: inline-flex; align-items: center; gap: 4px; color: var(--navy); fo`
- agenda ↔ heatmap: hovering one lights its match in the other — [L460](../../source/src/shell.html#L460) `.hm-cell, .hm-cat { transition: opacity .25s cubic-bezier(.22,1,.36,1), background .45s cu`
- the heatmap leads the page, in a thin-line container: title + key on top, a rule, then the lanes and their squares — [L465](../../source/src/shell.html#L465) `.ch-co .ch-hm { margin-top: 40px; border: 1px solid var(--line); border-radius: 12px; padd`
- ARR card v2: number on top, chart across the full width, the two stats in a row underneath — [L490](../../source/src/shell.html#L490) `.arrc-s2 { position: relative; flex: 1; border-radius: 8.2px; display: flex; flex-directio`

### North chat

- the same glass card as the page itself (.main): white at --glass-a, blurred, #e8e8e8 hairline — [L538](../../source/src/shell.html#L538) `background: rgba(255,255,255,var(--glass-a, .59)); -webkit-backdrop-filter: blur(var(--gla`
- opacity is the motion's alone: a CSS transition on it made every fade lag and smear — [L541](../../source/src/shell.html#L541) `.chat-shell { transition: background-color .35s, border-color .35s, box-shadow .35s; } /* `
- bar: just the field and suggestions over the blurred page — [L543](../../source/src/shell.html#L543) `.chat-shell.is-bar { background: transparent; border-color: transparent; box-shadow: none;`
- docked: a sibling of the page card, same edge, no lift — [L551](../../source/src/shell.html#L551) `.chat-shell.is-dock { box-shadow: none; }`
- docked: the sidebar folds to its rail and the page steps aside — [L560](../../source/src/shell.html#L560) `.app { transition: grid-template-columns .4s cubic-bezier(.32,.72,0,1); }`
- rail: one 1px icon per section (its items fly out on hover), no dividers, no open lists — [L574](../../source/src/shell.html#L574) `.rail-cat { display: none; position: relative; width: 40px; height: 36px; margin-top: 2px;`
- hover: a soft tint, the mark rises out of its arch (as in the sidebar), and the blues wash across the words — [L593](../../source/src/shell.html#L593) `.tip-ask:hover { background-color: rgba(74,134,178,.07); }`
- chart rules size every svg in the plot to 100% — [L599](../../source/src/shell.html#L599) `.tip-ask .north-logo { flex: none; width: 14px !important; height: 14px !important; } /* c`
- docked: the page steps aside rather than being covered — [L615](../../source/src/shell.html#L615) `.chat-head { flex: none; display: flex; align-items: center; gap: 9px; height: 52px; paddi`
- chart cards in chat (Figma: Fia charts · chat set) — [L716](../../source/src/shell.html#L716) `/* chat chart cards — Figma 733:325166 (card 556 · inset 20 · tray 80) */`
- chat chart cards — Figma 733:325166 (card 556 · inset 20 · tray 80) — [L717](../../source/src/shell.html#L717) `.cc { position: relative; container: cc / inline-size; border: 0.5px solid #d3d3d3; border`
- the tray sits under the chart: hairline, then four stacked inner shadows (Figma Action frame) — [L757](../../source/src/shell.html#L757) `.cc-tray { display: flex; align-items: center; justify-content: space-between; gap: 16px; `
- full screen: the card takes over the page's own card (.main), same edge and radius, no veil — [L779](../../source/src/shell.html#L779) `.cc-full { position: fixed; z-index: 59; overflow: hidden; background: #fefbf9; border: 1p`
- a table answer: the family table in the card; a row opens in the same card, with a way back — [L810](../../source/src/shell.html#L810) `.cc.is-table .cc-more.is-in { margin-top: 8px; }`
- the pop-out chat: resize from any edge or corner — [L827](../../source/src/shell.html#L827) `.chat-fr { position: absolute; z-index: 6; }`
- the crumbs' box spans the bar, over the docked ask field: only what's inside it takes clicks — [L838](../../source/src/shell.html#L838) `.topbar-crumbs { pointer-events: none; } .topbar-crumbs > * { pointer-events: auto; }`
- the build-in drives colour every frame; a CSS lag on top makes each square ease on its own — [L879](../../source/src/shell.html#L879) `.hm.is-building .hm-cell, .hm.is-building .hm-cat { transition: none; } /* the build-in dr`
- transposed: lanes across the top, their metrics down each column — [L882](../../source/src/shell.html#L882) `.hm.hm-t { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); grid-template-`
- hover a category: an arrow slides in after its name (it opens that lane's outcome metric) — [L895](../../source/src/shell.html#L895) `.hm-h-t { justify-content: flex-start; gap: 4px; align-items: center; }`
- while a square is still pale, its (possibly cream) type waits — [L915](../../source/src/shell.html#L915) `.hm-cell > * { opacity: var(--txt-o, 1); } /* while a square is still pale, its (possibly `
- accent heatmap: paper tile, a short status bar on the left edge, % behind in the status ink — [L918](../../source/src/shell.html#L918) `.hm-cell.is-accent::before { content: ""; position: absolute; left: 0; top: 14px; bottom: `
- taller, so the key gets noticed up by the title — [L926](../../source/src/shell.html#L926) `.hm-key-s i { display: block; width: 50px; height: 8px; border-radius: 2px; } /* taller, s`

### scoreboard tiles (home key-metric tile, closed shows the preview chart)

- scoreboard tiles (home key-metric tile, closed shows the preview chart) — [L951](../../source/src/shell.html#L951) `.sgrid-wrap { position: relative; margin-top: 9px; }`

### heatmap square opened: the home open card, grown out of the square

- heatmap square opened: the home open card, grown out of the square — [L955](../../source/src/shell.html#L955) `.hx { cursor: default; }`
- rest-of-lane rows: name, value and % each in their own column so the numbers line up — [L973](../../source/src/shell.html#L973) `.hx .mo-mv { display: grid; grid-template-columns: 7px minmax(0, 1fr) 62px 58px; column-ga`

### what to talk about: one card of rows; hover grows from the cursor, a row opens in place

- what to talk about: one card of rows; hover grows from the cursor, a row opens in place — [L985](../../source/src/shell.html#L985) `.talk { margin-top: 64px; }`

### metric page — one agenda item given the whole page

- metric page — one agenda item given the whole page — [L1028](../../source/src/shell.html#L1028) `.mp .ch-head.mp-head { margin-top: 40px; height: 196px; }`

### department page — same header, filters and parts as Company health

- department page — same header, filters and parts as Company health — [L1060](../../source/src/shell.html#L1060) `.dp-crumb { position: absolute; left: 11px; top: -36px; display: flex; gap: 8px; align-ite`

### the page beside a docked chat (or any narrow window): sized by the page's own width, not the screen's

- the page beside a docked chat (or any narrow window): sized by the page's own width, not the screen's — [L1103](../../source/src/shell.html#L1103) `@container pg (max-width: 1120px) {`
- heatmap: 7 lanes at ~120px each — smaller type, the % flag only on hover (the colour already says it) — [L1109](../../source/src/shell.html#L1109) `.hm-t .hm-head { padding: 10px 10px 0; }`
- Home: the "you" column keeps a readable width; the key metrics give way — [L1120](../../source/src/shell.html#L1120) `.top { grid-template-columns: minmax(0, 1fr) 248px; }`
- the sidebar's Ask North row is where chat lives when it's closed — [L1139](../../source/src/shell.html#L1139) `.chat-open .nav-row.is-ask { background: #fff; box-shadow: 0 1px 2px rgba(9,53,85,.06), 0 `
- North's mark (wordmark + Ask North). Hover on Ask North: the spokes push out one after another and come back; the chevron lifts — [L1142](../../source/src/shell.html#L1142) `.north-logo { display: block; overflow: visible; }`
- Ask North (half mark): on hover the spokes rise a step out of the arch, like the sun clearing the horizon — [L1145](../../source/src/shell.html#L1145) `.nl-sun { transition: transform .45s cubic-bezier(.34, 1.4, .64, 1); }`
- slow and wide: the colour rises through the word like light through glass, rests, and comes round again — never a streak. It lives on a copy of the label laid over the real one, so the real text never changes: on leave the copy just fades out (no snap of the text's own colour, so no blink) — [L1160](../../source/src/shell.html#L1160) `.nav-row.is-ask .nav-label { position: relative; }`
- starts the moment you hover: the colour is already at the word's edge, passes through it, then rests before the next pass — [L1167](../../source/src/shell.html#L1167) `@keyframes nm-text { 0% { background-position: 92% 0; } 45%, 100% { background-position: 8`
- ring hover: each wedge of the part grows outward from its inner edge, in a clockwise ripple; the key row shows share · owner; the rest steps back — [L1173](../../source/src/shell.html#L1173) `.cc-ring-part { transition: opacity .2s; cursor: pointer; }`
- a chat chart outside its card: in a pinned Home tile (open) and as that tile's preview (closed) — [L1183](../../source/src/shell.html#L1183) `.cc-embed { position: relative; width: 100%; }`

### chat card pass: dots only behind the graph, the breakdown is plain; every divider runs edge to edge; the small rows line up

- chat card pass: dots only behind the graph, the breakdown is plain; every divider runs edge to edge; the small rows line up — [L1202](../../source/src/shell.html#L1202) `.cc { --pad: 20px; }`
- Home's ask field is the chat's front door; while the chat is open it folds away (and its scrolled, docked copy hides) — [L1252](../../source/src/shell.html#L1252) `.home-ask { display: grid; grid-template-rows: 1fr; transition: grid-template-rows .45s cu`
- keep the composer's top margin inside its slot (it sat in a flex column before the fold wrapper) — [L1254](../../source/src/shell.html#L1254) `.home-ask .ask-slot { display: flow-root; } /* keep the composer's top margin inside its s`
- the Home's ask gives way only to the bare field it turns into; with a conversation up (popped out, docked, full) the page underneath stays whole: greeting and ask in place — [L1257](../../source/src/shell.html#L1257) `/* In progress takes the header: the ask bar folds away the same way it does for the chat `
- In progress takes the header: the ask bar folds away the same way it does for the chat — [L1258](../../source/src/shell.html#L1258) `.home-page.is-ip .home-ask { grid-template-rows: 0fr; opacity: 0; filter: blur(4px); point`
- the close sits on the buttons' edge (1089 at 1440): 876 is the list column, less its 52 — [L1259](../../source/src/shell.html#L1259) `.hello-ip { display: flex; align-items: center; justify-content: space-between; max-width:`
- the title lands first; the list follows it in, row by row — [L1263](../../source/src/shell.html#L1263) `.home-page.is-ip .nd-stg.is-in .pl-g h5, .home-page.is-ip .nd-stg.is-in .pl-r { animation-`
- ticks: thin, fixed-pitch, spread edge to edge (count comes from the width). Hover grows a stretch up from the baseline. — [L1271](../../source/src/shell.html#L1271) `.cc-ticks { display: flex !important; justify-content: space-between; align-items: flex-en`
- the 14 small ticks in a row grow with it — [L1282](../../source/src/shell.html#L1282) `.cc-mini { gap: 4px !important; height: 16px; align-items: flex-end; }`
- pinned answer on Home: rows stay one line so a docked chat never pushes the tile's button out — [L1291](../../source/src/shell.html#L1291) `.cc-embed .cc-trow > span:first-child { white-space: nowrap; overflow: hidden; text-overfl`
- the docked-width rule gives tile charts a 260px floor; a pinned answer's tile is a fixed height, so drop it there — [L1294](../../source/src/shell.html#L1294) `.mt-inner .mo-chart { min-height: 0 !important; }`
- the rows under the big chart: 14 medium everywhere (chat, full screen, Home tile) — [L1298](../../source/src/shell.html#L1298) `.cc-trow, .cc-full.is-big .cc-trow { font-size: 14px !important; }`
- ticks = the board's tick chart (723 frame, scales with the card). Hover spreads out from the tick under the cursor. — [L1301](../../source/src/shell.html#L1301) `.cc-ticks { display: block !important; height: auto !important; }`
- row ticks keep the same tick-to-gap ratio as the board (9 : 4.2) — [L1313](../../source/src/shell.html#L1313) `.cc-mini { gap: 3px !important; } .cc-mini i { width: 6px !important; border-radius: 1px !`
- one card, two layouts: inside the flying frame the card eases between its thread size and its page size (type, padding, chart height, ring width, row columns) while the frame moves, so it is one chart changing shape — [L1317](../../source/src/shell.html#L1317) `@property --pad { syntax: "<length>"; inherits: true; initial-value: 20px; }`
- at thread size the frame wears the card's own edge (0.5 #d3d3d3, no lift), so the hand-off to the thread card is invisible — [L1324](../../source/src/shell.html#L1324) `.cc-full { transition: border-color var(--morph-d, .5s), box-shadow var(--morph-d, .5s); }`
- in flight the card is not a size container, so its layout can't flip from narrow to regular halfway (that restarted every transition mid-move). The flight takes the chat card's layout as its fixed end: narrow if the chat card is narrow. — [L1328](../../source/src/shell.html#L1328) `.cc-full .cc { container-type: normal; }`
- full-screen chat: fills the page card's frame, one centred reading column, nothing blurred behind it — [L1352](../../source/src/shell.html#L1352) `.app { transition: grid-template-columns var(--shift-d, .55s) var(--shift-e, cubic-bezier(`
- rich cards in full-screen chat: the numbers and rows behind the chart sit inline — [L1359](../../source/src/shell.html#L1359) `.cc-more .cc-stats > div { min-width: 0; }`
- full-screen chat: the card loses its box and sits in the conversation like the text does. Chart on the left, what's behind it on the right (breakdown rows, then the four numbers 2 × 2), the action underneath — one screen, no scrolling inside an answer. The deal table stays in the card's own full screen. — [L1366](../../source/src/shell.html#L1366) `.cc.is-flat { --pad: 0px; border: 0; border-radius: 0; background: transparent; overflow: `
- the action: a plain line under the answer, not a tray — [L1390](../../source/src/shell.html#L1390) `.cc.is-flat .cc-tray { min-height: 0; margin-top: 18px; padding: 14px 0 0; background: non`
- a chart answer breaks out of the reading column (text stays ~760 wide, the chart gets ~1060) — [L1394](../../source/src/shell.html#L1394) `.chat-shell.is-full { container: shell / inline-size; }`
- calmer: one hero (number + chart) and one supporting element (the breakdown). The four numbers and the table stay in the card's own full screen — progressive disclosure, not everything at once. — [L1401](../../source/src/shell.html#L1401) `.cc.is-flat .cc-more { display: none; }`

### chat formatting from Figma 752:334990 (Chat · docked column)

- chat formatting from Figma 752:334990 (Chat · docked column) — [L1413](../../source/src/shell.html#L1413) `.chat-head { gap: 9px; padding: 0 10px 0 18px; }`
- thread: 20 / 22 inset, 28 between items — [L1418](../../source/src/shell.html#L1418) `.chat-shell.is-dock .chat-list, .chat-shell.is-float .chat-list { padding: 20px 22px 12px;`
- topic header: hairline above, 12 semibold, the topic you're in is coral — [L1421](../../source/src/shell.html#L1421) `.ch-topic { margin: 0 0 -8px; }`
- North's answer: no orb, full width, #3d3d3d 14.5 medium — [L1428](../../source/src/shell.html#L1428) `.ch-text { color: #3d3d3d; font-weight: 500; }`
- composer: 8 / 12 / 12 around a square-cornered 52 field; + · mic · voice on the right — [L1433](../../source/src/shell.html#L1433) `.chat-shell.is-dock .chat-compose, .chat-shell.is-float .chat-compose, .chat-compose { pad`
- context rides on top of the field as a tab (attached, full width) — [L1443](../../source/src/shell.html#L1443) `.chat-ctx { margin: 0; padding: 6px 6px 6px 12px; border: 0.5px solid #d3d3d3; border-bott`
- topics rail: 4px squares, 4 apart; the one you're in is a 10 × 4 navy dash — [L1450](../../source/src/shell.html#L1450) `.ch-index-lines { gap: 4px; padding: 10px 0 10px 5px; }`
- resize handle shows (3 × 40 at the right edge) — [L1455](../../source/src/shell.html#L1455) `.chat-resize::after { opacity: 1; }`
- ring card to Figma 752:335011: ring 267 across (svg column 296 incl. its grow room), legend at x 322, right under the subtitle — [L1457](../../source/src/shell.html#L1457) `.cc:not(.is-flat) .cc-ring:not(.is-mini) { grid-template-columns: minmax(0, 296px) minmax(`
- full screen is solid white, so the white bubble needs a ground of its own there — [L1462](../../source/src/shell.html#L1462) `.chat-shell .ch-bubble, .chat-shell.is-full .ch-bubble { background: rgba(9,53,85,.05); } `
- your words sit in the same soft bubble in every mode — [L1462](../../source/src/shell.html#L1462) `.chat-shell .ch-bubble, .chat-shell.is-full .ch-bubble { background: rgba(9,53,85,.05); } `
- a full view open (a chart, or a job beside the chat): the prototype's demo button steps out of its corner — [L1464](../../source/src/shell.html#L1464) `.view-full .demo-land { opacity: 0; pointer-events: none; }`
- no highlight stroke on the chat field when it's active: it keeps its #d3d3d3 edge — [L1466](../../source/src/shell.html#L1466) `.chat-input:focus-within, .chat-shell.is-voice .chat-input { border-color: #d3d3d3 !import`
- full-screen chat, collapsed answer: in the text column (same left edge as the reply), no box, stacked: title → number + chart → breakdown → the action, tight under it. Expand (⤢) opens the full card with the numbers and the table; it grows out of this card and shrinks back into it. — [L1470](../../source/src/shell.html#L1470) `.chat-shell.is-full .cc.is-flat { width: auto; margin-left: 0; }`
- the full card leaving a flat answer starts with no edge of its own and gains its surface as it grows — [L1485](../../source/src/shell.html#L1485) `.cc-full.is-flatsrc:not(.is-big) { border-color: transparent; background-color: rgba(254,2`
- navy buttons: on hover they lift a touch, go a shade brighter, and a soft light sits where the cursor is (it follows it) — [L1488](../../source/src/shell.html#L1488) `:is(.btn-pri, .cc-btn, .voice, .rt-b.is-pri, .ar-go) { position: relative; isolation: isol`
- loading: the card's own frame, empty, while the data comes in; a light sweeps across the chart area — [L1495](../../source/src/shell.html#L1495) `.cc.is-loading .cc-big > span:first-child { color: transparent; border-radius: 8px; }`
- buttons: no lift, no shadow — just a shade brighter and the light under the cursor — [L1514](../../source/src/shell.html#L1514) `:is(.btn-pri, .cc-btn, .voice, .rt-b.is-pri, .ar-go):hover, :is(.btn-pri, .cc-btn, .voice,`

### loading = a shimmer in the chart's own colours (coral → purple → teal) running over the empty shapes

- loading = a shimmer in the chart's own colours (coral → purple → teal) running over the empty shapes — [L1516](../../source/src/shell.html#L1516) `@keyframes cc-shim { from { background-position: 100% 0; } to { background-position: 0% 0;`
- the empty chart takes the same shimmer: shapes go a soft grey, and a colour band (blend: color) tints them as it passes — [L1524](../../source/src/shell.html#L1524) `.cc.is-loading .cc-ghost, .cc.is-loading .cc-tk, .cc.is-loading .cc-wedge { fill: #e3dfdb `
- status line at the top of a working answer: North + what it's doing (shimmering) + the step — [L1529](../../source/src/shell.html#L1529) `.nr-status { display: flex; align-items: baseline; gap: 8px; overflow: hidden; font-size: `
- open card: title + star + collapse stay pinned while the card scrolls; once scrolled they tighten and a full-width rule appears — [L1535](../../source/src/shell.html#L1535) `.cc-full .cc-head { margin: 0; transition: margin var(--morph-d, .45s) var(--morph-e, ease`
- while the card is moving, no scrollbar can appear and nudge the layout — [L1541](../../source/src/shell.html#L1541) `.cc-full.is-moving .cc-body { overflow: hidden !important; }`
- open / close: only the title, number and chart reshape. Everything below the chart (and the ring's key) never scales — it fades out, snaps to its new size unseen, and fades back in top → bottom as the card arrives. — [L1545](../../source/src/shell.html#L1545) `.cc-full.is-moving :is(.cc-break, .cc-more, .cc-tray, .cc-legend, .cc-break *, .cc-legend `
- the rows themselves step in top → bottom too — [L1551](../../source/src/shell.html#L1551) `.cc-full.is-big:not(.is-closing) .cc-break :is(.cc-h5, .cc-trow), .cc-full.is-big:not(.is-`
- back in the thread: the same parts fade in top → bottom on the card it landed on — [L1556](../../source/src/shell.html#L1556) `.is-return :is(.cc-break .cc-h5, .cc-trow, .cc-tray, .cc-legend li) { animation: cc-fadein`
- the instant a scrolled card resets to the top before collapsing: nothing animates, it just takes its resting layout — [L1561](../../source/src/shell.html#L1561) `.cc-full[data-reset] *, .cc-full[data-reset] { transition: none !important; }`

### the product's own charts inside a chat card

- the product's own charts inside a chat card — [L1563](../../source/src/shell.html#L1563) `.cc-viz { margin-top: 14px; }`
- drawn for a 723-wide board; at chat width the small labels would land ~4px. In a narrow card they're set to ~20 units (≈9px) — [L1567](../../source/src/shell.html#L1567) `@container cc (max-width: 470px) {`
- Home, closed tiles: one navy set. A pinned chat chart's preview goes to the same quiet grey as the other tiles' previews — [L1575](../../source/src/shell.html#L1575) `.mtile:not(.is-open) .cc-embed.is-mini { filter: grayscale(1) contrast(.55) brightness(1.3`
- point at a chart: a glass edge, not a box. Frosted band straddles the chart's edge; a sheen in the chart palette (coral → purple → teal) laps it slowly; a glint leans toward the cursor. All of it is masked to the band. — [L1579](../../source/src/shell.html#L1579) `@property --ar-a { syntax: "<angle>"; inherits: false; initial-value: 0deg; }`
- the target, switched on: filled glass in the chart palette. A slow coral → purple → teal sheen turns under a navy wash, a frosted highlight sits on top, a thin light rim holds the edge — the same material as the edge it puts on a chart. — [L1597](../../source/src/shell.html#L1597) `.chat-tool.chat-aim { outline: none; }`
- glass: a bright lip across the top and a soft specular bloom, so it reads as a lens, not a flat disc — [L1603](../../source/src/shell.html#L1603) `.chat-tool.chat-aim.is-on::before { content: ""; position: absolute; inset: 0; z-index: -1`
- the field grows with long questions: buttons stay on the bottom line, like Claude's composer — [L1612](../../source/src/shell.html#L1612) `.chat-input { height: auto !important; min-height: 52px; align-items: flex-end; padding-to`

### Continue in Google Chat: the handoff from North to where people talk

- Continue in Google Chat: the handoff from North to where people talk — [L1621](../../source/src/shell.html#L1621) `.ch-acts { flex-wrap: wrap; row-gap: 2px; }`
- after it's sent: one link back, and how it landed — [L1666](../../source/src/shell.html#L1666) `.gc-sent { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radiu`
- Google Chat handoff, v2: one To field (people and/or a #space), tags in a space, a draft you can talk to — [L1699](../../source/src/shell.html#L1699) `.ch-act:focus-visible { outline: none; background: rgba(9,53,85,.06); color: var(--navy); `
- the Google Chat side, over the page — [L1733](../../source/src/shell.html#L1733) `.gc-modal { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; pa`
- the Google Chat card is a link: a snapshot of the chart, where it lives, and the click opens it in North — [L1747](../../source/src/shell.html#L1747) `.gc-unfurl { display: block; width: min(420px, 100%); margin-top: 8px; padding: 0; text-al`
- answer actions: icons on one line; hover (or keyboard focus, or while it's open) slides the label out of the icon — [L1761](../../source/src/shell.html#L1761) `.ch-acts { flex-wrap: nowrap; gap: 2px; align-items: center; }`
- a question about a chart: the reference sits inside the bubble, one quiet line, no quote bar — [L1768](../../source/src/shell.html#L1768) `.ch-user > .ch-quote { display: none; }`
- handoff v3: centred title, one @ for everyone tagged, the list opens under what you're typing, any space in one click — [L1776](../../source/src/shell.html#L1776) `.gc-sheet { position: relative; }`
- section summary: on a section header, quiet until you hover the section — [L1795](../../source/src/shell.html#L1795) `.ch-topic-gc { margin-left: auto; align-self: center; display: inline-flex; align-items: c`
- handoff as one block: rows stacked like quadrants of a card, full-width rules between them, no floating boxes, no shadows — [L1804](../../source/src/shell.html#L1804) `.gc-sheet { padding: 0; gap: 0; border: 0.5px solid #d3d3d3; border-radius: 8px; backgroun`
- handoff as a tile (same anatomy as the metric tiles): the message on the paper panel, a footer strip in the well under it — [L1831](../../source/src/shell.html#L1831) `.gc-tile { position: relative; background: var(--well); border-radius: 9px; padding: 1px; `
- breathing room: the thread rests above the field instead of sitting on it (like Claude) — [L1870](../../source/src/shell.html#L1870) `.chat-list { padding-bottom: var(--tail, 120px) !important; }`
- a reserved answer never squeezes; its full height counts, so the space under it is real — [L1871](../../source/src/shell.html#L1871) `.chat-list > * { flex-shrink: 0; } /* a reserved answer never squeezes; its full height co`
- a recap reads like a short written note: a title, then paragraphs with room between them — [L1874](../../source/src/shell.html#L1874) `.gc-sumh { display: flex; align-items: baseline; gap: 12px; margin-top: 2px; }`
- Home's target while you're pointing: the same glass as the chat's — [L1880](../../source/src/shell.html#L1880) `.chat-picking .ask-aim { position: relative; isolation: isolate; overflow: hidden; border-`
- crosshair on the glass: ring and ticks go white — [L1890](../../source/src/shell.html#L1890) `.chat-tool.chat-aim.is-on svg circle, .chat-tool.chat-aim.is-on svg path, .chat-picking .a`
- the target's glass grows on (and shrinks off) instead of popping: the glass and its highlight live on two layers behind the icon that scale up from the middle with a little give; the icon crossfades navy ⇄ white — [L1895](../../source/src/shell.html#L1895) `.chat-tool.chat-aim, .ask-aim { position: relative; isolation: isolate; overflow: visible;`
- shrinking off is quicker and has no give — [L1907](../../source/src/shell.html#L1907) `.chat-tool.chat-aim:not(.is-on)::after, .chat-tool.chat-aim:not(.is-on)::before, :root:not`
- link preview in Google Chat: no underline, no lift — the chart eases up a touch inside its frame — [L1913](../../source/src/shell.html#L1913) `.gc-unfurl:hover { border-color: #e2e4e6; box-shadow: none; }`
- once it's sent for good the tile goes quiet: the paper panel dissolves into one cool, flat surface — [L1931](../../source/src/shell.html#L1931) `.gc-tile { transition: background-color .45s ease; }`
- agents: a small coloured mark, the name and lane, a short take and where it looked — [L1938](../../source/src/shell.html#L1938) `.ag-msg { display: flex; gap: 10px; align-items: flex-start; align-self: stretch; }`
- agents as orbs (drawn in SVG in agents.jsx); the wrapper only breathes while they think — [L1962](../../source/src/shell.html#L1962) `.aorb { position: relative; display: inline-block; flex: none; line-height: 0; border-radi`
- the crew: just their heads, alive. Each sways from the neck on its own rhythm (Fia slowest, Calvin quickest); working, it picks up — [L1968](../../source/src/shell.html#L1968) `.aorb-face { overflow: visible; border-radius: 0; }`
- whole characters (the Agents page): standing, they shift their weight from the feet now and then; working, a little more — [L1976](../../source/src/shell.html#L1976) `.aorb-body { overflow: visible; border-radius: 0; }`
- the walkway the crew stands on: a raised plank in the board's own line language (paper top, a shade on the front, hairline seams) — [L1983](../../source/src/shell.html#L1983) `.bd-deck .dk-top { fill: rgba(255,255,255,.66); stroke: rgba(9,53,85,.18); stroke-width: .`
- each one on it: working, planted at its station with its glow up and a busy bubble; idle, strolling the walkway — [L1988](../../source/src/shell.html#L1988) `.bd-walk { position: relative; display: inline-flex; align-items: flex-end; }`
- a real contact shadow at the feet: it travels with them, and tightens on each step — [L1992](../../source/src/shell.html#L1992) `.bd-shadow { position: absolute; left: 50%; bottom: -3px; width: 78%; height: 9px; transla`
- the puppet (puppet.jsx): feet on the box's bottom edge, everything moved by the rig — no CSS motion on the figure — [L2003](../../source/src/shell.html#L2003) `.pp { position: relative; display: block; flex: none; }`
- each one's words arrive in the colour of its chest glow — [L2027](../../source/src/shell.html#L2027) `.ag-orin { --ag-hi: #3d5bd9; } .ag-riley { --ag-hi: #1f9e5a; } .ag-calvin { --ag-hi: #b423`
- each word arrives in the agent's colour, then settles into the body ink — [L2031](../../source/src/shell.html#L2031) `@keyframes ag-word { 0% { opacity: 0; filter: blur(4px); transform: translateY(3px); color`
- an agent's take can come along to Google Chat — [L2046](../../source/src/shell.html#L2046) `.ag-acts { display: flex; margin-top: 6px; animation: ag-fade .5s cubic-bezier(.16, 1, .3,`
- footer controls read as buttons: a soft raised surface at rest, firmer on hover; flat once it's sent — [L2061](../../source/src/shell.html#L2061) `.gc-dest:not(:disabled), .gc-who:not(:disabled) { background: rgba(255,255,255,.6); box-sh`

### first run: the product teaches itself. The light that means "selected" is the light that means "try this".

- first run: the product teaches itself. The light that means "selected" is the light that means "try this". — [L2069](../../source/src/shell.html#L2069) `/* ⌥ hint: the hovered chart gets the glass edge at half strength; holding ⌥ brings the sa`
- ⌥ hint: the hovered chart gets the glass edge at half strength; holding ⌥ brings the same ring to full — [L2070](../../source/src/shell.html#L2070) `.chat-aim-ring > i { transition: opacity .35s cubic-bezier(.16,1,.3,1); }`
- the label sits where the pointing label will be (the cursor), so holding ⌥ swaps the words in place — [L2076](../../source/src/shell.html#L2076) `.chat-aim-label.is-nudge { transform: none; margin: 16px 0 0 16px; transform-origin: 0 0; `
- a keycap that presses itself, slowly: shows the move instead of describing it — [L2079](../../source/src/shell.html#L2079) `.ob-key { grid-row: span 2; align-self: center; display: inline-grid; place-items: center;`
- the button way, first run: the bar points at the shortcut — [L2087](../../source/src/shell.html#L2087) `.chat-pickbar .ob-next { display: inline-flex; align-items: center; gap: 5px; margin-left:`
- Watch, offered once after the first answer: the label is out and the same glass edge runs round it — [L2089](../../source/src/shell.html#L2089) `/* no ring: the button the note points at just fills, softly breathing, like a hover that `
- no ring: the button the note points at just fills, softly breathing, like a hover that waits for you — [L2090](../../source/src/shell.html#L2090) `.ch-act.is-hint { position: relative; color: var(--navy); background: rgba(9,53,85,.07); a`

### docked (narrow) cards: everything fits the column, buttons and labels stay on one line

- docked (narrow) cards: everything fits the column, buttons and labels stay on one line — [L2096](../../source/src/shell.html#L2096) `@container cc (max-width: 470px) {`
- agent suggestion: the line can wrap, the button never does — [L2107](../../source/src/shell.html#L2107) `.ag-sug-t { min-width: 0; flex: 1; text-wrap: pretty; }`
- a pinned answer's ring on a Home tile: just the ring, on the right, beside the number — [L2110](../../source/src/shell.html#L2110) `/* bleeds off the tile's lower-right corner: it's texture for the number, not data to read`
- bleeds off the tile's lower-right corner: it's texture for the number, not data to read, so the card's own edge crops it — [L2111](../../source/src/shell.html#L2111) `.mt-mini .cc-ring.is-mini { display: block; position: absolute; width: 84%; right: calc(-1`
- turns the biggest share (Outbound) into the arc that shows — [L2114](../../source/src/shell.html#L2114) `.mt-mini .cc-ring.is-mini svg { transform: rotate(-60deg); } /* turns the biggest share (O`
- Watch, first run: just the icon in its glass edge; a small note above says what it does. Dismiss it (or use Watch) and it's a plain icon again — [L2118](../../source/src/shell.html#L2118) `.ob-tip { position: absolute; right: -4px; bottom: calc(100% + 8px); z-index: 5; display: `
- the note can sit over any action: anchored by its left edge, caret under the icon it's about — [L2126](../../source/src/shell.html#L2126) `.ob-tip.is-left { right: auto; transform-origin: var(--cx, 20px) 100%; }`

### Watching: the bell in the chat's header, with what's on; the list opens under it

- Watching: the bell in the chat's header, with what's on; the list opens under it — [L2130](../../source/src/shell.html#L2130) `.wl-wrap { position: relative; display: flex; }`
- topics note: beside the rail, caret pointing at it; the rail gets the same glass edge — [L2154](../../source/src/shell.html#L2154) `.ob-tip.is-side { left: 22px; right: auto; bottom: auto; top: 50%; translate: 0 -50%; max-`
- the list hangs from the header's right edge, so it always sits inside the chat — [L2177](../../source/src/shell.html#L2177) `.chat-head { position: relative; }`
- Watching opens on hover; the row opens all the way, so no hover box behind it — [L2182](../../source/src/shell.html#L2182) `.wl-main:hover, .wl li.is-open .wl-main { background: none; }`
- Home: what changed — in the header, under the ask (where the shortcuts sit when there's no news). One quiet line each. Hover: the line lifts in place and its actions appear on it — Open in chat, ×. No popover. — [L2200](../../source/src/shell.html#L2200) `.brief { margin-top: 12px; max-width: 837px; }`
- the header band holds the greeting, the ask and what sits under it, whole — [L2216](../../source/src/shell.html#L2216) `.content:has(.home-ask):not(.ch-page)::before { height: var(--band-h, 232px); }`
- a ticks bar that runs to a target: the target is named at the bar's end; the empty ticks are the gap — [L2222](../../source/src/shell.html#L2222) `.cc-goalwrap { position: relative; padding-top: 18px; }`

### tuning layer (tune.jsx): dials hidden unless switched on with D; panel stops above the timeline; tune-an-element

- tuning layer (tune.jsx): dials hidden unless switched on with D; panel stops above the timeline; tune-an-element — [L2236](../../source/src/shell.html#L2236) `.dials-off .dialkit-root { display: none !important; }`
- sits above the timeline, never over its play controls — [L2237](../../source/src/shell.html#L2237) `.dialkit-panel { bottom: 80px !important; } /* sits above the timeline, never over its pla`
- Home's band: the agents' work as a living texture behind the greeting and the ask — [L2253](../../source/src/shell.html#L2253) `.content:has(.home-ask):not(.ch-page) { padding-top: 132px; }`
- on Home the bar floats over the band, so the band (and its texture) runs to the top edge; it gains its ground once you scroll — [L2255](../../source/src/shell.html#L2255) `.topbar.is-home { position: absolute; left: 0; right: 0; top: 0; z-index: 6; }`
- the same shimmer as Ask North in the sidebar, always on here so it reads as the way in — [L2279](../../source/src/shell.html#L2279) `.hw-ask-t { position: relative; }`
- an agent's answer about its work: the jobs it names, each opening on the Agents page — [L2288](../../source/src/shell.html#L2288) `.ag-jobs { display: flex; flex-direction: column; margin: 8px -8px 0; animation: agIn .4s `
- chats: one per subject. Full screen gets a column inside the chat window; docked, they live on the edge — [L2297](../../source/src/shell.html#L2297) `.chat-shell.has-chats .chat-list, .chat-shell.has-chats .chat-compose { margin-left: 264px`
- chats grouped by who you were talking to; each row is just the subject — [L2321](../../source/src/shell.html#L2321) `.chs-l { flex: 1; min-height: 0; overflow-y: auto; margin-top: 8px; display: flex; flex-di`
- a new chat: the field sits in the middle of the window, the ways in underneath it — [L2330](../../source/src/shell.html#L2330) `.chat-shell.is-newchat .chat-list { flex: 1 1 0; justify-content: flex-end; padding-bottom`
- with the chats column, the thread and the field keep their full width in the space that's left — [L2344](../../source/src/shell.html#L2344) `.chat-shell.has-chats .chat-list { padding-left: max(28px, calc((100cqw - 264px - var(--co`
- a new chat: under the field, what's moving right now as quiet lines (no pills); each line changes as things move — [L2348](../../source/src/shell.html#L2348) `.chat-moving { display: flex; flex-direction: column; margin-top: 22px; }`
- chat rows hover like the sidebar: a soft pill grows out of where the cursor came in; the open chat sits filled — [L2361](../../source/src/shell.html#L2361) `.chs-col li, .chs-panel li { position: relative; }`
- one sentence per line: same size, same weight; the glyph says what kind of thing it is — [L2372](../../source/src/shell.html#L2372) `.cm-r { border-radius: 8px; padding: 0 10px !important; margin: 0 -10px; }`
- one dark gray for the words and the glyphs; only what needs you takes colour — [L2375](../../source/src/shell.html#L2375) `.cm-t b, .cm-l { color: #4a4a4a !important; }`
- a decision, answered in the thread: fills only, no outlines — [L2380](../../source/src/shell.html#L2380) `.ag-job { width: 100%; }`
- an agent's update: one quiet line under its name, no tools — [L2387](../../source/src/shell.html#L2387) `.ag-msg:has(.ag-who small) .ag-text { margin-top: 8px; }`
- deliveries: finished work handed back in the thread — [L2389](../../source/src/shell.html#L2389) `.ag-dls { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; animation: a`
- a delivery's foot: who it's for (and the note it was reworked with), then Open and Share — [L2402](../../source/src/shell.html#L2402) `.ag-dl-f { display: flex; align-items: center; gap: 12px; margin: 2px 0 -4px 20px; }`
- agent rows: the sidebar's hover; open in place — [L2409](../../source/src/shell.html#L2409) `.ag-job { position: relative; }`
- an agent's tools stay out of the way until you're on its answer (or using one) — [L2424](../../source/src/shell.html#L2424) `/* they come in at once and leave late, so overshooting the row by a few px (or a label pu`
- they come in at once and leave late, so overshooting the row by a few px (or a label pushing a button out from under the cursor) never blinks them away; the row also carries a little hover margin under itself — [L2426](../../source/src/shell.html#L2426) `.ag-msg .ag-actsrow { position: relative; opacity: 0; transition: opacity .25s ease .6s; a`
- the page card sits evenly in the window: the bottom gap only opens for the dials' timeline. The ask fields keep their height on screen (they ride up by the space the card gained), so nothing ends up hugging the bottom edge — [L2432](../../source/src/shell.html#L2432) `:root { --app-b: 72px; --lift: 0px; }`
- the chat's menus grow out of their button too — [L2438](../../source/src/shell.html#L2438) `@keyframes menuTL { from { clip-path: inset(0 calc(100% - 40px) calc(100% - 28px) 0 round `
- the orb is a lit sphere: a soft contact shadow under it keeps its pale top from melting into a white page — [L2446](../../source/src/shell.html#L2446) `.aorb-gl canvas { filter: drop-shadow(0 1px 1.5px rgba(40,30,90,.16)) drop-shadow(0 0 .5px`
- the orbs never pulse or grow: only the colour moves across them — [L2448](../../source/src/shell.html#L2448) `.aorb-gl, .aorb-gl.is-live { animation: none !important; transform: none !important; }`
- the shared hover (hover.js): a pill that grows sideways out of the pointer, like the sidebar's — [L2452](../../source/src/shell.html#L2452) `.hv-host { position: relative; }`
- Files' filters pick, they don't act: the choice is paper on a gray track (as in the routine card), so the page keeps navy for actions — [L2459](../../source/src/shell.html#L2459) `.fl-ctl .seg, .fl-ctl .fl-views { border: 0; background: var(--sec); }`
- Home, two levels. What needs you is one card built like the chart cards: the tray is the frame (1.09px rim), the rows sit on paper inside, a footer line on the tray. In progress sits under it on the page: quieter, no card, no buttons — [L2464](../../source/src/shell.html#L2464) `.fd-nc { margin-top: 4px; padding: 1.09px 1.09px 0; border-radius: 10px; background: var(-`
- an item opened from the card keeps the card's rim — [L2470](../../source/src/shell.html#L2470) `.fd-grow .mt-clip { box-shadow: inset 0 0 0 1.09px var(--well); } /* an item opened from t`
- the card's rim + inner padding, so faces and titles line up with the rows above — [L2471](../../source/src/shell.html#L2471) `.fd-mv { margin-top: 36px; padding: 0 15.1px; } /* the card's rim + inner padding, so face`
- the work moving, in North's tick mark (as on the charts and the Agents floor): 20 fine ticks, lit to how far it's got — [L2482](../../source/src/shell.html#L2482) `.fd-mk { display: inline-flex; align-self: center; align-items: center; gap: 2.5px; height`
- a routine's work: its mark before the title — [L2488](../../source/src/shell.html#L2488) `.rt-mk { display: inline-flex; align-self: center; flex: none; margin-left: -4px; } .rt-mk`
- the routine mark in the face's spot, so the line under it aligns — [L2489](../../source/src/shell.html#L2489) `.rl3-rts .rt-g { width: 12px; height: 12px; flex: none; } /* the routine mark in the face'`
- those rows drop their old instant hover fill, so only the grow shows — [L2492](../../source/src/shell.html#L2492) `.pg .dd-m button.hv-host:hover:not(.is-on), .pg .rc-addm button.hv-host:hover, .ag-dl-m bu`
- dropdown motion from the dials (Menus → "Dropdown grows out of its button") — [L2496](../../source/src/shell.html#L2496) `.dd-m.is-unit { animation-duration: var(--menu-d, .62s) !important; animation-timing-funct`
- Agents has no charts: no target to point with, and no tip about it — [L2499](../../source/src/shell.html#L2499) `html:has(.agx) .ask-aim, html:has(.agx) .chat-aim, html:has(.agx) .chat-tip { display: non`
- K: the bar rises from the bottom, page stays sharp; its questions sit above the field — [L2501](../../source/src/shell.html#L2501) `.chat-shell.is-bar { top: auto !important; bottom: calc(var(--bar-b, 20px) + env(safe-area`
- the bar is one solid card (questions + field), the same card that grows into the answer — [L2506](../../source/src/shell.html#L2506) `.chat-shell.is-bar { background: rgba(255,255,255,.985) !important; -webkit-backdrop-filte`
- the answer floats over the page: solid enough to read, a real lift off what's under it — [L2510](../../source/src/shell.html#L2510) `.chat-shell.is-float { background: rgba(255,255,255,.985) !important; -webkit-backdrop-fil`
- one radius system for the bar and the panel it becomes: field 4px, 10px around it, so the card is 14px — [L2514](../../source/src/shell.html#L2514) `.chat-shell.is-bar, .chat-shell.is-float { border-radius: 14px !important; }`
- the K bar is one surface: the card is the field, so there's no box inside a box — [L2521](../../source/src/shell.html#L2521) `.chat-shell.is-bar { padding: 0 !important; }`
- the answer panel keeps the bar's anatomy: the field is the bottom of the card, set off by a hairline, not a box inside it — [L2525](../../source/src/shell.html#L2525) `.chat-shell.is-float .chat-compose { padding: 0 !important; border-top: 0.5px solid var(--`
- one edge: the shadow's hairline, not a border plus a ring — [L2527](../../source/src/shell.html#L2527) `.chat-shell.is-bar, .chat-shell.is-float { border-color: transparent !important; } /* one `
- what you're asking about rides in as a banner across the top of the bar (or above the field once it's an answer) — part of the card, no outline of its own — [L2529](../../source/src/shell.html#L2529) `.chat-shell.is-bar .chat-ctx, .chat-shell.is-float .chat-ctx { width: auto; margin: 0 !imp`
- Agents already has its field: K lifts that one instead of bringing a second — [L2534](../../source/src/shell.html#L2534) `html body .agx .ask-dock.is-north .composer.is-focus { border-color: transparent !importan`
- new chat: the agents at work, above the question — [L2538](../../source/src/shell.html#L2538) `.nl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: `
- the callouts under the field read at medium weight — [L2548](../../source/src/shell.html#L2548) `.chat-shell .cm-t b, .chat-shell .cm-l { font-weight: 500 !important; }`
- new chat texture: fills the room right of your chats, behind everything, fading out toward the bottom — [L2551](../../source/src/shell.html#L2551) `.nw-tex { position: absolute; left: 264px; right: 0; top: 53px; bottom: 0; z-index: 0; poi`
- the light under the new chat's texture: three pools in the agents' colours, very faint, fading out above the field — [L2555](../../source/src/shell.html#L2555) `.nw-glow { position: absolute; inset: 0; z-index: 0; overflow: hidden; -webkit-mask-image:`
- a chat's topics sit inside it: indented, on a hairline guide, so they never read as chats of their own — [L2563](../../source/src/shell.html#L2563) `.chs-col li.chs-tp, .chs-panel li.chs-tp { position: relative; margin-left: 14px; padding:`
- full screen: the topic squares sit at the thread's own edge, right of the chats column — [L2567](../../source/src/shell.html#L2567) `.chat-shell.is-full.has-chats .ch-index { left: 264px; }`

### one type scale (chat) — body 15 · interface 13 · meta 11.5 · weights 400/500 · navy + grey

- one type scale (chat) — body 15 · interface 13 · meta 11.5 · weights 400/500 · navy + grey · — [L2569](../../source/src/shell.html#L2569) `.chat-shell .ag-who b { font-size: 13px !important; font-weight: 500 !important; }`

### motion pass: nothing switches on/off, everything folds on one curve

- motion pass: nothing switches on/off, everything folds on one curve · — [L2584](../../source/src/shell.html#L2584) `:root { interpolate-size: allow-keywords; --sx: cubic-bezier(.32,.72,0,1); }`
- sidebar sections fold to the rail instead of display:none (which popped) — [L2586](../../source/src/shell.html#L2586) `.is-rail .nav-sec + .nav-sec .sec-head { display: flex !important; height: 0; padding-top:`
- the header: the collapse button is pinned to the sidebar's right edge, so it travels with the width on the same curve; the logo, name and search stay where they are and fade — [L2594](../../source/src/shell.html#L2594) `.side-head { position: relative; padding: 0 44px 0 10px !important; gap: 8px !important; }`
- folding: words go first, icons arrive after; opening: room first, words after — [L2601](../../source/src/shell.html#L2601) `.side-anim.is-rail .side .rail-cat { transition-delay: 0s, 0s, 0s, 0s, 0s, 0s, .18s !impor`
- K's bar and the float are 98% opaque white: blurring what's behind them cost a frame for nothing — [L2605](../../source/src/shell.html#L2605) `.chat-shell.is-bar, .chat-shell.is-float { -webkit-backdrop-filter: none !important; backd`
- chat decisions: "Not now" ends on the same right edge as "Step 3 of 4" — [L2607](../../source/src/shell.html#L2607) `.chat-shell .ag-dec { margin-right: -10px; }`
- K's speech bubble: your message before you send it · the chat's own user bubble (navy 500 on a navy tint, 4px tail corner), its tail corner on the cursor. No buttons: Enter sends, hold Space to talk — [L2611](../../source/src/shell.html#L2611) `.chat-shell.is-bar.is-bub { background: #f3f5f7 !important; border-radius: 14px 14px 14px `
- what you're pointing at: a quiet first line inside the bubble, set off by a hairline — [L2621](../../source/src/shell.html#L2621) `.chat-shell.is-bub .chat-ctx { background: transparent !important; padding: 9px 10px 0 14p`
- dark blue: the bubble is navy with white type — [L2626](../../source/src/shell.html#L2626) `.chat-shell.is-bar.is-bub { background: var(--navy) !important; box-shadow: 0 1px 2px rgba`
- topics: one line each (the subject, then how many questions, quietly), on North's white; the one you're in is a grey fill, nothing else — [L2635](../../source/src/shell.html#L2635) `.ch-index-panel { background: #fff !important; -webkit-backdrop-filter: none !important; b`
- the topic you are in is just navy; coral stays for a topic whose numbers changed (is-update) — [L2645](../../source/src/shell.html#L2645) `.ch-topic.is-cur b { color: var(--navy) !important; }`
- topics: the divider pushing out. One shape: white, a 1px line on its top, right and bottom in the divider's colour, open on the left, its width growing from the line. It sits above the chats column so it covers the divider's own stretch. — [L2649](../../source/src/shell.html#L2649) `.chat-shell { --tp-line: #d3d3d3; } .chat-shell.is-dock, .chat-shell.is-float { --tp-line:`
- raised from opening until it has fully retracted — [L2650](../../source/src/shell.html#L2650) `.chat-shell .ch-index.is-open, .chat-shell .ch-index.is-up { z-index: 8; } /* raised from `
- docked, the divider is the chat's own left edge: drawn inside the chat (not as its border) so the panel can open it — [L2662](../../source/src/shell.html#L2662) `.chat-shell.is-dock { border-left-color: transparent !important; }`
- the squares and the panel are one thing. Opening: each square scales up, moves right and spreads toward its own row while its title rises out of it. Closing: titles gather back, and the squares return while the panel retracts, meeting it at the line. — [L2667](../../source/src/shell.html#L2667) `.ch-index-lines i { transform-origin: 50% 50%; transition: transform .38s cubic-bezier(.32`
- the rows sit centred on the squares (the header doesn't push them down) — [L2670](../../source/src/shell.html#L2670) `.ch-index-panel { margin-top: -14px; }`
- the panel's corners: softer on the right, and where the divider turns into its top and bottom lines it curves (8px fillets), so the line flows out of the divider; the fillets grow with the panel — [L2673](../../source/src/shell.html#L2673) `.ch-index-panel > .tp-shape { border-radius: 0 10px 10px 0 !important; }`
- positioned from the shape's padding box, which sits inside its top and bottom lines: step out by the line's width — [L2684](../../source/src/shell.html#L2684) `.ch-index-panel > .tp-shape > .tp-fil.is-t { top: calc(-14px - var(--tp-w)); }`
- Watching, in the chat's header: the header's line pushing down. No card of its own: a white shape with the line on its sides and bottom (same colour and width as the header's), open on top, curving into its sides at 14px joints, height growing from the line — [L2689](../../source/src/shell.html#L2689) `.wl.is-push { background: transparent !important; border: 0 !important; box-shadow: none !`
- Watching from the sidebar: the page card's left edge pushing out to the right. Open on the left (the white covers the edge's own stretch), the edge's line on its top, right and bottom, 14px curves where the edge turns into them, width growing from the edge — [L2697](../../source/src/shell.html#L2697) `.wl.is-push.is-side { width: 320px !important; }`
- no line between the "Watching" heading and the first row — [L2705](../../source/src/shell.html#L2705) `.wl li:first-child { border-top: 0 !important; }`
- Watching: the header's joints are revealed as the panel grows (clipped to its height) — [L2708](../../source/src/shell.html#L2708) `.wl.is-push > .wp-shape > .wp-fil { position: absolute; top: 0; left: -14px; overflow: hid`
- the count travels: from the bell (or the sidebar row) into the heading, and back — [L2712](../../source/src/shell.html#L2712) `.wl.is-push > .wl-n { position: absolute; z-index: 3; top: 15px; right: 18px; font-size: 1`
- the type moves the way the panel does: heading first, then each row, arriving from the side it grows from, just behind its edge — [L2717](../../source/src/shell.html#L2717) `@keyframes wpInY { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; tra`
- PushShape joints: tiny SVGs anchored at the line's outer edge, drawing (and filling) outside themselves — [L2725](../../source/src/shell.html#L2725) `.ps { --ps-line: var(--tp-line, #d3d3d3); }`
- PushShape: the leading corner grows with the width so it never fights the joint — [L2735](../../source/src/shell.html#L2735) `.ch-index-panel > .ps.tp-shape.is-x, .wl.is-push.is-side > .ps.wp-shape.is-x { border-radi`
- Watching spreads along its line from what you touched: the rows clip to the same span — [L2739](../../source/src/shell.html#L2739) `.wl.is-push.is-side > .wp-in { clip-path: inset(var(--ps-cn, 0px) var(--ps-cm, 0px) var(--`
- flyouts that push out of the line at the rail's edge (EdgeFly): no box of their own, the shape is the surface — [L2743](../../source/src/shell.html#L2743) `.efly.rail-fly { position: fixed; z-index: 70; min-width: 0; width: 236px; padding: 0; bac`
- the K bubble opening into the dock (or full screen): its navy gives way to the surface in the first beat of the morph, not over a third of a second, which left a blue-grey slab over the page while it travelled — [L2752](../../source/src/shell.html#L2752) `.chat-shell.is-full { transition: background-color .12s ease-out, border-color .12s ease-o`
- the bubble becomes the dock's surface the moment it starts to open — [L2753](../../source/src/shell.html#L2753) `.chat-shell.is-dock { transition: box-shadow .35s; } /* the bubble becomes the dock's surf`
- the chart you asked about, carried into the conversation above your question (a copy of the card as it was on the page) — [L2756](../../source/src/shell.html#L2756) `.ch-carry-row { display: flex; justify-content: flex-end; margin-bottom: -12px; }`
- the carried chart: the metric's own six months, quiet label above, no tile around it — [L2766](../../source/src/shell.html#L2766) `.ch-carry.is-live { width: 600px; max-width: 100%; }`
- a huddle: one contained row (the agents circling each other · who · how long · caret); opens into the room where they talk — [L2775](../../source/src/shell.html#L2775) `.hd { display: flex; flex-direction: column; gap: 6px; }`
- live: side by side, taking turns, each lifts and leans in as if it's its turn to talk — [L2786](../../source/src/shell.html#L2786) `.hd.is-live .hd-orb { animation: hdTalk 1.5s cubic-bezier(.45,0,.55,1) infinite; animation`
- no fade of its own: the chart draws itself on, like an answer's — [L2800](../../source/src/shell.html#L2800) `.ag-card { margin: 14px 0 4px; } /* no fade of its own: the chart draws itself on, like an`
- a chart arriving in the thread: its parts rise in one after another, the plot drawing as it comes (CardIn) — [L2805](../../source/src/shell.html#L2805) `@keyframes ccRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; tran`
- expanding: what sits under the chart (stats, table, note) waits until the card has finished growing, then fades in where it belongs; the scrollbar's room is held from the start so nothing re-wraps as it comes and goes — [L2812](../../source/src/shell.html#L2812) `.cc-full .cc-body { scrollbar-gutter: stable; }`
- expanded: what's under the chart comes in as the card lands, the way the agents' list does: each part (the stats band, the header, every row, the note) fades and settles down from just above, top to bottom. Closing fades it out as one. — [L2816](../../source/src/shell.html#L2816) `@keyframes ccDrop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; tra`
- a chart open full size: the chat's own controls (Watching, dock, close) step back, so the only way out is the chart's own — [L2824](../../source/src/shell.html#L2824) `.chat-shell .chat-head :is(.ibtn, .wl-btn, .wl-wrap) { transition: opacity .2s ease; }`
- the ring, opened: bigger, and the ring and its legend sit together in the middle of the card rather than off in a corner — [L2827](../../source/src/shell.html#L2827) `.cc-full.is-big .cc-ring { grid-template-columns: 340px auto; justify-content: center; gap`
- the account row is a button now (the prototype's "view as"): the menu grows up out of it — [L2830](../../source/src/shell.html#L2830) `.acct-wrap { position: relative; }`
- the face never gives way to the name beside it; folded to the rail, the name takes no room and the face sits on the icons' centre line (rows are 40 wide) — [L2832](../../source/src/shell.html#L2832) `.acct .avatar { flex: none; }`
- folded to the rail, the menu keeps its full width and grows out past the rail instead of squeezing into it — [L2841](../../source/src/shell.html#L2841) `.is-rail .side .acct-m { position: fixed; left: 10px; right: auto; bottom: 76px; width: 22`
- the rail scrolls, so it would clip an absolute menu. 76px = the account row's top (70px up from the window's foot, measured) + the same 6px gap the open sidebar uses — [L2841](../../source/src/shell.html#L2841) `.is-rail .side .acct-m { position: fixed; left: 10px; right: auto; bottom: 76px; width: 22`
- ARR movement: a page of its own. The ledger leads, under its filters; Home's own bar chart follows at full width. Nothing is boxed; hairlines (strokes) do the separating. Hover is the sidebar's: soft pills opening out of the cursor, one along the row, one down the month. Two type sizes per block — [L2845](../../source/src/shell.html#L2845) `.card-head-r { display: inline-flex; align-items: center; gap: 8px; }`
- no band: like Company health, the page opens straight onto its own ground, so the empty top bar reads as nothing — [L2848](../../source/src/shell.html#L2848) `.content.ch-open::before { display: none; }`
- ARR movement over Home: a file opened full screen's frame — [L2852](../../source/src/shell.html#L2852) `.ao { position: fixed; z-index: 3001; overflow: hidden; border-radius: 16px; background: v`
- the frame carries its own, in the corner — [L2855](../../source/src/shell.html#L2855) `.ao .am-back { display: none; } /* the frame carries its own, in the corner */`
- the three numbers: Home's tiles, one row of three. Opened, the row makes room for the open chart (the tile fills the region) — [L2859](../../source/src/shell.html#L2859) `.am .top.is-arr { margin-top: 40px; overflow: visible; }`
- no top bar here: nothing lives in it on this page, so it isn't drawn, and the page scrolls clean to the top edge (its 64px is given back to the page as padding, so the header sits where it did) — [L2863](../../source/src/shell.html#L2863) `.topbar.is-bare { position: absolute; left: 0; right: 0; top: 0; z-index: 6; border-bottom`
- the filters: the Agents list's own row. Quiet value-only dropdowns on a hairline, text on the content edge (the button's 10px inset is pulled back), the status on the right — [L2870](../../source/src/shell.html#L2870) `.am-bar { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; margin: 48px 0 0;`
- the menu opens out of its own button: the button's shape grows into the menu, then the options settle in — [L2878](../../source/src/shell.html#L2878) `.am-dd-m { position: absolute; top: 0; left: 0; z-index: 40; min-width: 210px; padding: ca`
- filtering: as on the Agents list, the old view eases out and the new one arrives row by row (each row's delay is its place) — [L2885](../../source/src/shell.html#L2885) `@keyframes amIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transf`
- the title sits on its chart: the plot's own top label is the first thing under it — [L2895](../../source/src/shell.html#L2895) `.am-chart .arr-plot { margin-top: 6px; } /* the title sits on its chart: the plot's own to`
- the names only stay put on phones, where the ledger has to scroll sideways — [L2908](../../source/src/shell.html#L2908) `@media (max-width: 700px) { .am-tbl th[scope="row"], .am-tbl thead tr:last-child th:first-`
- the kind of month is in the numbers themselves, so no labels over them: measured months dark grey at regular, the month still moving salmon at semibold, plan months light grey. The year is already in the filter above — [L2918](../../source/src/shell.html#L2918) `.am-tbl td, .am-tbl tr.is-neg td, .am-tbl tr.is-total td { color: #1f1f1f; }`
- the row and the month you're on read in navy (the pills do the rest) — [L2924](../../source/src/shell.html#L2924) `.am-tbl tr.is-hr th[scope="row"], .am-tbl tr.is-hr td, .am-tbl :is(th, td).is-hi { color: `
- where the ledger turns live, then plan: a hairline, not a shaded column — [L2926](../../source/src/shell.html#L2926) `.am-tbl tr > .is-live, .am-tbl tr > .is-plan:not(.is-plan + .is-plan):not(.is-live + .is-p`
- arranging Home by hand: while a tile is carried, nothing selects and the cursor holds it. No shadow: it rides above the others and they make room under it — [L2934](../../source/src/shell.html#L2934) `.is-arranging, .is-arranging * { user-select: none !important; cursor: grabbing !important`
- the "ask about this" hint and its ring stay out of the way while you carry a tile — [L2935](../../source/src/shell.html#L2935) `.is-arranging :is(.chat-aim-label, .chat-aim-ring) { opacity: 0 !important; transition: op`
- a seat's goals: its own first, the team's quieter; one line ties it to the team's number — [L2946](../../source/src/shell.html#L2946) `.goal.is-team .goal-l b { color: #7f7f7f; font-weight: 400; }`
- a pin by name: the way back (or the choices), as quiet pills under North's one line — [L2950](../../source/src/shell.html#L2950) `.ch-opts { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }`
- a job you set in motion landed: pushed out of the sidebar's edge beside Agents — [L2956](../../source/src/shell.html#L2956) `.efly.job-fly { width: 320px; }`
- a batch: one row per thing that came in; each opens in place — [L2972](../../source/src/shell.html#L2972) `.job-fly .jf-orbs { display: flex; } .job-fly .jf-orbs > * + * { margin-left: -4px; }`
- the face sits on the title's line, not between the lines — [L2977](../../source/src/shell.html#L2977) `.job-fly .jf-list .jf-row { align-items: flex-start; } .job-fly .jf-list .jf-row > :first-`
- ready for you: the quiet place work waits, beside Agents — [L2981](../../source/src/shell.html#L2981) `.nav-ready { display: inline-flex; align-items: center; gap: 5px; margin-left: auto; heigh`
- counts: just the number, navy, the same for Agents (work ready for you) and Watching (only when something you watch changed). On the rail it sits at the icon's top-right corner, clear of the glyph; in the sidebar, at the row's right edge — [L2986](../../source/src/shell.html#L2986) `.side .nav-ready { margin-left: auto; height: auto; min-width: 0; padding: 0 2px; backgrou`
- a job opened anywhere: the Agents job view over the page — [L2992](../../source/src/shell.html#L2992) `.agx.jm-host .jm-stage.pg { max-width: none; margin: 0; padding: 0; }`
- beside the docked chat: the job takes the page card's frame (the same frame a chart's full view uses) — [L2999](../../source/src/shell.html#L2999) `.agx.jm-host .cd.jm-card.jm-beside { max-height: none; border-radius: 16px; }`
- the chat beside it is where you talk: one field on screen — [L3000](../../source/src/shell.html#L3000) `.agx.jm-host .cd.jm-card.jm-beside .cd-talk, .agx.jm-host .cd.jm-card.jm-pair .cd-talk { d`
- a job's header, everywhere: who and where it stands on the left; share, full screen, more and close on the right, as navy icons — [L3003](../../source/src/shell.html#L3003) `.cd-h .cd-acts { margin: 0 -4px 0 auto !important; flex: none; display: inline-flex; align`
- one subject, one surface: a question asked while work is open beside the chat builds on that work — [L3022](../../source/src/shell.html#L3022) `.cd-adds { display: flex; flex-direction: column; }`
- the chat as a job's thread: its header names who owns the work and the work — [L3038](../../source/src/shell.html#L3038) `.chat-head .ch-jt { display: flex; align-items: center; gap: 8px; min-width: 0; }`
- quiet by default: the Watch offer is only made in full screen, where there's room beside the chart; never over a chart in the pop-out or dock — [L3043](../../source/src/shell.html#L3043) `.chat-shell:not(.is-full) .ob-tip { display: none !important; }`
- ready list: each row says what was done and what came out of it, so you know what to look at before opening it — [L3046](../../source/src/shell.html#L3046) `.job-fly .jf-row > .jf-rt b { display: block; padding: 0; font-size: 13px; line-height: 18`
- the two counts line up: same box, same right edge, same baseline — [L3052](../../source/src/shell.html#L3052) `.side:not(.x) .nav-ready, .side:not(.x) .nav-watch-n { display: inline-flex; justify-conte`
- the work at the top of its own conversation: title, where it stands, the chart, what came out. Quiet frame, no card chrome — [L3057](../../source/src/shell.html#L3057) `.chat-shell .ch-work { padding: 4px 0 18px; margin-bottom: 6px; border-bottom: 1px solid r`
- a job's running-total ticks, in a thread on any page (the Agents page's own sheet only reaches its own page) — [L3066](../../source/src/shell.html#L3066) `.chat-shell .jw { --trk: #e2e7ec; }`
- the job card's menu is North's menu (same as the chat's): white, hairline edge, soft drop, navy type, left aligned — [L3078](../../source/src/shell.html#L3078) `.agx.jm-host .cd-menu { top: 44px; right: 16px; min-width: 190px; padding: 4px !important;`
- no stroke to show a button is open or focused: open is a soft fill — [L3083](../../source/src/shell.html#L3083) `.agx.jm-host .cd-ib:focus, .agx.jm-host .cd-ib:focus-visible { outline: none; box-shadow: `
- the job card's header (and its menu) sits above the card's content: the menu is never drawn under the chart — [L3092](../../source/src/shell.html#L3092) `.agx.jm-host .cd.jm-card .cd-h { position: relative; z-index: 7; }`
- one window at a time: while a conversation is open, Home's greeting steps back with its field — [L3094](../../source/src/shell.html#L3094) `.chat-open:not(.chat-talking) .home-page .hello h1 { opacity: 0; filter: blur(4px); transi`
- the work's tray sits under its findings, like every answer's — [L3102](../../source/src/shell.html#L3102) `.chat-shell .ch-msg.ch-work { display: block; }`
- who's in this conversation: their faces beside the title, overlapping like a group thread's — [L3106](../../source/src/shell.html#L3106) `.chat-head .ch-crew { display: inline-flex; align-items: center; margin-left: 8px; }`

### Sam's Home as a board (field.jsx): the score in the band, North's one move, then his month in four zones

- Sam's Home as a board (field.jsx): the score in the band, North's one move, then his month in four zones — [L3111](../../source/src/shell.html#L3111) `.fd { display: flex; flex-direction: column; min-width: 0; }`

### game mode (game.jsx): the close, played on a target. One deliberate look: deep navy, light type

- game mode (game.jsx): the close, played on a target. One deliberate look: deep navy, light type — [L3209](../../source/src/shell.html#L3209) `.fd-head-r { display: flex; align-items: center; gap: 10px; }`

### game mode, Sam's street (street.jsx): the Agents board's paper and line, as a neighbourhood

- game mode, Sam's street (street.jsx): the Agents board's paper and line, as a neighbourhood — [L3284](../../source/src/shell.html#L3284) `.strt { position: fixed; inset: 0; z-index: 2147482000; display: flex; flex-direction: col`

### game mode: Sam's world (world.jsx). Mixed media: photo miniatures, our puppets, grainy flat signs, white hand line, frosted glass

- game mode: Sam's world (world.jsx). Mixed media: photo miniatures, our puppets, grainy flat signs, white hand line, frosted glass — [L3343](../../source/src/shell.html#L3343) `.wd { --g: #c9d8e4; --g2: #dfe8ef; position: fixed; inset: 0; z-index: 2147482000; overflo`

### game mode: Sam's block (realworld.jsx). A real photograph; our crew, coral signs, white line and frosted glass on top

- game mode: Sam's block (realworld.jsx). A real photograph; our crew, coral signs, white line and frosted glass on top — [L3406](../../source/src/shell.html#L3406) `.rw { position: fixed; inset: 0; z-index: 2147482000; overflow: hidden; background: #2b3a4`

### Sam's board v2: columns are where a job is; priority sits on each piece. System cards, buttons, toggle.

- Sam's board v2: columns are where a job is; priority sits on each piece. System cards, buttons, toggle. — [L3474](../../source/src/shell.html#L3474) `.fd-head .seg { flex: none; }`
- clipped top to bottom only: a file opened beside widens the card to the right, past the stage — [L3479](../../source/src/shell.html#L3479) `.fd-stage.is-open { overflow-x: visible; overflow-y: clip; overflow-clip-margin: 24px; } /`
- the opened piece: grows from its slot to fill the board or table — [L3506](../../source/src/shell.html#L3506) `.fd-open { position: absolute; z-index: 6; }`
- the running-total ticks at reading size (job threads, job cards, Sam's score): same as the chat's Booked ARR card — [L3569](../../source/src/shell.html#L3569) `.bt { --trk: #ededed; position: relative; width: 100%; }`

### Sam's board, audit pass: system sizes everywhere

- Sam's board, audit pass: system sizes everywhere — [L3583](../../source/src/shell.html#L3583) `.fd-play.btn-sec { height: 32px; padding: 0 14px; font-size: 13px; }`
- an opened row fills exactly the table, so the picture tightens to fit it — [L3635](../../source/src/shell.html#L3635) `.fd-o-in.is-tight .fd-o-l { padding: 16px 28px 10px; }`

### Sam's board, pass 3

- the note bar in an opened job is Home's ask bar at its docked size — [L3701](../../source/src/shell.html#L3701) `.fd-o-r .composer.fd-o-ask { flex: none; margin: 0 14px 0 24px; max-width: none; height: 4`
- your call sits at the lower left of an opened job, under its picture; the right side is the conversation — [L3709](../../source/src/shell.html#L3709) `.fd-o-calls { display: flex; gap: 8px; margin-top: auto; padding-top: 20px; }`
- rows you can point at and open (deals, prospects): sidebar hover, details open under the row — [L3713](../../source/src/shell.html#L3713) `.fd-hr-t { display: flex; flex-direction: column; font-size: 13px; line-height: 18px; colo`
- an opened row and what it opens are one piece: the row's tint carries on into the detail (no second grey box under it) — [L3730](../../source/src/shell.html#L3730) `.fd-hr.is-open .chs-hover { border-radius: 6px 6px 0 0; }`
- list prospects: the last column ("why") wraps; deals: ARR right aligned (last column) — [L3740](../../source/src/shell.html#L3740) `.fd-hr-t .fd-hr > .fd-hc.is-last { white-space: normal; }`

### Messages: conversation attached to the work (talk.jsx)

- Messages: conversation attached to the work (talk.jsx) — [L3759](../../source/src/shell.html#L3759) `.ms-wrap { flex: 1; min-height: 0; display: flex; flex-direction: column; background: var(`
- composer: who and what above the field — [L3826](../../source/src/shell.html#L3826) `.ms-comp { padding: 10px 24px 18px; }`

### a hand-off lives on its piece: people in the piece's conversation

- a hand-off lives on its piece: people in the piece's conversation — [L3876](../../source/src/shell.html#L3876) `.fd-ppl { display: inline-flex; flex: none; } .fd-ppl > * + * { margin-left: -4px; }`
- opened piece, per Seth's Figma (Opened job 5:2): priority alone above the title; the figures lead, one sentence a line; the right side on its own soft ground; steps fold to the live one with a toggle — [L3895](../../source/src/shell.html#L3895) `.fd-o-desc.is-lead { max-width: none; margin-top: 10px; font-size: 14px; line-height: 23px`
- Sam's Home as the loop: Needs you, Talking, Moving, Landed. Chats are cards like pieces; a chat opens as the same shape as an opened piece (the talk on the right, the work it made on the left) — [L3922](../../source/src/shell.html#L3922) `.fd-board { grid-template-columns: repeat(4, minmax(0, 1fr)); }`
- one chat: conversations listed flat (waiting on you first), each with who's in it and the last word; teammates in a conversation read like the agents do — [L3967](../../source/src/shell.html#L3967) `.chs-flat { margin: 0 !important; }`
- Home as the loop, for a lot going on: Needs you is the one list (the top four; the rest fold); talk, work in motion and what landed are a quiet line each that opens in place — [L3987](../../source/src/shell.html#L3987) `.fd-loop { display: flex; flex-direction: column; gap: 22px; }`
- conversations grouped by who's in them: names lead (that's what you look for), each subject under them with its last word — [L4009](../../source/src/shell.html#L4009) `.chs-who { display: flex; flex-direction: column; }`
- Home as a list in priority order: who you're in it with, what it's about, where it stands, what's yours to do — [L4018](../../source/src/shell.html#L4018) `.fd-rows { display: flex; flex-direction: column; border-top: 0.5px solid var(--line); }`
- Sam's Home, craft pass: what's going on (quiet, under the ask), then the short list of what needs you. No dividers; faces carry who — [L4037](../../source/src/shell.html#L4037) `.fd-since { max-width: 837px; margin: 22px 0 0 5px; }`
- New business as a space: a title with who's here, North's one sentence, then the numbers (all pointable; ⌘K asks anywhere) — [L4083](../../source/src/shell.html#L4083) `.nb { padding-top: 4px; }`
- voice: the bar that listens, wherever you are — [L4113](../../source/src/shell.html#L4113) `.voice.is-v .bars i { display: inline-block; }`
- the chat opens on what's waiting on you (Sam's seat): the same rows as Home, each with its one move — [L4138](../../source/src/shell.html#L4138) `/* the rail: people by name, then (after a real gap) what you asked North, by topic */`
- the rail: people by name, then (after a real gap) what you asked North, by topic — [L4139](../../source/src/shell.html#L4139) `.chs-l { gap: 0; }`
- the open conversation runs the full width of the list: faces in the faces' column, the reply as wide as the rows — [L4159](../../source/src/shell.html#L4159) `.fd-ti-in { padding: 4px 10px 16px 8px; max-width: none; }`
- focus: Home becomes the work. The list folds to a column; the item takes the rest — [L4164](../../source/src/shell.html#L4164) `.fx-h { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;`
- the list itself: dividers between rows only — [L4198](../../source/src/shell.html#L4198) `.fd-rows { border-top: 0; }`
- the chat's list, Slack-shaped: sections that fold, one line per person or topic, bold + count only when someone waits on you — [L4205](../../source/src/shell.html#L4205) `.chs-l.sl { gap: 14px; margin-top: 12px; }`
- what you could ask is the full screen's; the pop-out is just the field — [L4213](../../source/src/shell.html#L4213) `.chat-shell.is-float .chat-moving { display: none; } /* what you could ask is the full scr`
- files: a file in a conversation, and the file itself in the panel — [L4236](../../source/src/shell.html#L4236) `.fcard { display: flex; align-items: center; gap: 10px; width: 100%; max-width: 360px; mar`
- in the open file the slide fits the space left above the strip, so every slide is in view without scrolling — [L4249](../../source/src/shell.html#L4249) `.fm .fm-b.is-deck { overflow: hidden; display: flex; flex-direction: column; }`
- a slide, drawn at 960 × 540: two sizes of type a slide, the deck's own colours — [L4261](../../source/src/shell.html#L4261) `.sd { position: relative; width: 960px; height: 540px; padding: 56px 64px; box-sizing: bor`
- a slide changed by voice says so, quietly, top right (inside the 960×540 slide's 56px padding) — [L4266](../../source/src/shell.html#L4266) `.sd-rev { position: absolute; top: 24px; right: 28px; font-size: 15px; line-height: 20px; `
- opened in place: the item grows out of its row to fill your work (the chart-tile opening), and folds back into it — [L4289](../../source/src/shell.html#L4289) `.fd-grow .mt-body { background: var(--paper); }`
- the row it lands as: above the content as that fades — [L4290](../../source/src/shell.html#L4290) `.gw-land { position: absolute; top: 0; z-index: 3; pointer-events: none; } /* the row it l`
- the header is the row it grew from: same face column (52), same text start (x of the row's name) — [L4295](../../source/src/shell.html#L4295) `.gw-item .fx-h { display: grid; grid-template-columns: var(--face-col) minmax(0, 1fr) auto`
- the face stays exactly where the row had it — [L4296](../../source/src/shell.html#L4296) `.gw-item .fx-face { display: inline-flex; align-items: center; justify-content: flex-start`
- everything under the header starts where the row's text starts, and keeps a reading width — [L4309](../../source/src/shell.html#L4309) `.gw-item .fx-rel, .gw-item .fx-msgs, .gw-item .fx-b, .gw-item .fx-f { padding-left: calc(8`
- never past the talk column when a doc is open — [L4312](../../source/src/shell.html#L4312) `.gw-item .fx-msgs > *, .gw-item .fx-rel > *, .gw-item .fx-f > * { max-width: min(760px, 10`
- a new conversation with work waiting: the field rides higher so the list fits under it (the heading sits where Home's greeting does) — [L4326](../../source/src/shell.html#L4326) `/* ---------------------------------------------------------------- substance: things have`

### substance: things have bodies, type has weight

- substance: things have bodies, type has weight — [L4327](../../source/src/shell.html#L4327) `:root { --bubble: #f1eeea; } /* a warm grey on North's warm paper: people's words sit in i`
- a warm grey on North's warm paper: people's words sit in it — [L4327](../../source/src/shell.html#L4327) `:root { --bubble: #f1eeea; } /* a warm grey on North's warm paper: people's words sit in i`
- the open item: a real headline, the row's own face (36), messages you can read from a step back — [L4329](../../source/src/shell.html#L4329) `.gw-item .fx-h { padding-top: 20px; padding-bottom: 18px; }`
- the reply field: a body you'd want to type into — [L4336](../../source/src/shell.html#L4336) `.gw-item .composer.fx-ask { height: 52px; border-radius: 14px; padding: 0 8px 0 18px; }`
- what it's about: a tile, not a tag — [L4341](../../source/src/shell.html#L4341) `.fx-rel button { padding: 8px 12px; border-radius: 10px; background: var(--bubble); font-s`
- a file is a thing: a tile with an icon chip — [L4344](../../source/src/shell.html#L4344) `.fcard { max-width: 380px; gap: 12px; padding: 12px 16px 12px 12px; border: 0; border-radi`
- Home: rows you can read at a glance, the face the open item will keep — [L4349](../../source/src/shell.html#L4349) `.fd-row { grid-template-columns: var(--face-col) minmax(0, 1fr) auto; min-height: 76px; pa`
- life: an agent at work is visibly working — [L4357](../../source/src/shell.html#L4357) `.fd-dots { display: inline-flex; gap: 2px; margin: 0 2px 0 4px; vertical-align: middle; }`
- the chat speaks the same language: people in bubbles, you in navy, North plain — [L4362](../../source/src/shell.html#L4362) `.gw-item .fx-who b { font-size: 15px; } /* the row's name, unchanged, as it becomes the he`
- the row's name, unchanged, as it becomes the header — [L4362](../../source/src/shell.html#L4362) `.gw-item .fx-who b { font-size: 15px; } /* the row's name, unchanged, as it becomes the he`
- a long conversation scrolls under a soft edge, never a hard cut at the line — [L4364](../../source/src/shell.html#L4364) `.gw-item .fx-msgs { -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 22p`
- conversations as they were: face, name, the words as plain text (people and North alike); your own words the same way — [L4366](../../source/src/shell.html#L4366) `.fx-m { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 12px; }`

### a department's home

- a tile: North's chart material (the well frame, the paper body), no shadow, no outline — [L4378](../../source/src/shell.html#L4378) `.dh-fi { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 10p`
- no metrics: the header keeps the height the status bars give every other department, so the page below lands in the same place — [L4390](../../source/src/shell.html#L4390) `/* a department's header grows with its lead line and who's here; the band follows it (mea`
- a department's header grows with its lead line and who's here; the band follows it (measured), the home starts 28px under it — [L4391](../../source/src/shell.html#L4391) `.content.ch-page:has(.dh)::before { height: var(--band-h, 277px); }`
- a department's home, built from Home's parts: the greeting's type, Home's graph tiles, Home's rows — [L4393](../../source/src/shell.html#L4393) `.dhp-head { margin: 46px 0 0; }`
- band ends 16px under the header; the tiles start 40px under the band, the gap every page uses — [L4399](../../source/src/shell.html#L4399) `.dhp .top.is-dept { margin-top: 56px; } /* band ends 16px under the header; the tiles star`
- the open item: the row's face and name stay put; one medium title; messages that read like a page, not a feed — [L4426](../../source/src/shell.html#L4426) `.gw-item .fx-h { grid-template-columns: var(--face-col) minmax(0, 1fr) auto; gap: 12px; pa`
- the name never wraps; only the status line truncates — [L4434](../../source/src/shell.html#L4434) `.fx-rel span, .fx-rel b { white-space: nowrap; flex-shrink: 0; } /* the name never wraps; `
- a department: one medium title, quiet meta, room between the groups — [L4448](../../source/src/shell.html#L4448) `.dhp-head .hello h1 { font-size: 30px; line-height: 36px; font-weight: 500; letter-spacing`
- faces in a group: overlapped, five at most, then +N (stack.jsx). No ring or outline; the overlap is the separation — [L4460](../../source/src/shell.html#L4460) `.stk { display: inline-flex; align-items: center; flex: none; }`
- the count sits in front, so it reads whole — [L4463](../../source/src/shell.html#L4463) `.stk-more { position: relative; z-index: 9; /* the count sits in front, so it reads whole `
- other decks' slides (cover / statement / list), and a report's figures as a quiet table — [L4466](../../source/src/shell.html#L4466) `.sd-g .sd-st { margin: auto 0 60px; max-width: 30ch; font-size: 34px; line-height: 44px; c`
- voice stays on top of an open file: you're talking to it — [L4478](../../source/src/shell.html#L4478) `.vx { z-index: 3100 !important; } /* voice stays on top of an open file: you're talking to`
- the sunk tray, used more: the stage a deck sits on, a file attached to a message — [L4481](../../source/src/shell.html#L4481) `.gw-item .fx-f { margin-top: auto; } /* the reply stays plain: the sunk tray didn't read o`
- the reply stays plain: the sunk tray didn't read on a conversation — [L4481](../../source/src/shell.html#L4481) `.gw-item .fx-f { margin-top: auto; } /* the reply stays plain: the sunk tray didn't read o`
- Sam's seat · Figma 17:217 / 27:2032: the page takes one linear wash (cool at the top left, warm at the bottom right), and the ask bar sits in a sunk well that carries the same wash a touch warmer. The field stays white inside it, 6px in. — [L4488](../../source/src/shell.html#L4488) `.main.seat-sam { background: linear-gradient(162.2deg, #ebf0f5 5.54%, #f9f1ef 102.51%); }`
- the wash is the page now; the band keeps only its seat shadow — [L4489](../../source/src/shell.html#L4489) `.main.seat-sam .content::before { background: none; } /* the wash is the page now; the ban`
- a file beside a conversation (artifact-style): it takes the right 58% of the pane, the conversation re-flows into the rest. Same ease as the grow (.32,.72,0,1 · 500ms) so the two move as one. Full view takes the whole pane; Esc steps back. — [L4496](../../source/src/shell.html#L4496) `.gw-in[data-dochost] { position: relative; } /* the chat shell is already positioned (fixe`
- the chat shell is already positioned (fixed); never override it — [L4496](../../source/src/shell.html#L4496) `.gw-in[data-dochost] { position: relative; } /* the chat shell is already positioned (fixe`
- its left edge is the talk's edge — [L4497](../../source/src/shell.html#L4497) `.sdoc { position: absolute; z-index: 20; overflow: hidden; background: var(--paper); borde`
- the file stays put, anchored right, while the edge moves over it — [L4498](../../source/src/shell.html#L4498) `.sdoc-p { position: absolute; top: 0; right: 0; bottom: 0; } /* the file stays put, anchor`
- on Home, with a file open, the conversation's controls live in the file's set at the top right — [L4502](../../source/src/shell.html#L4502) `.gw-in:is(.has-doc, .doc-out) .gw-item .fx-h-r .fx-i { visibility: hidden; } /* until the `
- until the file has gone, the controls are its set — [L4502](../../source/src/shell.html#L4502) `.gw-in:is(.has-doc, .doc-out) .gw-item .fx-h-r .fx-i { visibility: hidden; } /* until the `
- with a file open the talk's room follows the file's edge frame by frame (set from script), so no CSS easing on top of it — [L4504](../../source/src/shell.html#L4504) `.gw-in.has-doc .gw-item :is(.fx-h, .fx-rel, .fx-msgs, .fx-b, .fx-f), .chat-shell.has-doc :`
- the divider drags. It shows itself only as a short soft grip on hover, never a stroke along the file — [L4507](../../source/src/shell.html#L4507) `.sdoc-grip { position: absolute; z-index: 5; top: 0; bottom: 0; left: 0; width: 12px; curs`
- "3 of 10" waits until the conversation has its width back — [L4516](../../source/src/shell.html#L4516) `.gw-in:is(.has-doc, .doc-out) .gw-item .fx-pos { display: none; } /* "3 of 10" waits until`
- the padding eases only while a file leaves (doc-out). Any other width change (the sidebar folding, the window) moves the field with its card in the same frame: an ease here made the field trail the card by half a second and stretch on the way — [L4519](../../source/src/shell.html#L4519) `.chat-shell.is-full.doc-out .chat-list { transition: padding .5s cubic-bezier(.32,.72,0,1)`
- a conversation's top is just its title, beside everyone in it — [L4524](../../source/src/shell.html#L4524) `.gw-item .fx-h.is-bare { align-items: center; }`
- @ in a reply on Home: the same picker as the chat's, sat on the field — [L4527](../../source/src/shell.html#L4527) `.gw-item .composer.fx-ask { position: relative; overflow: visible; }`
- voice, in glass: the page's own wash, frosted, so it floats over anything without a slab of navy. Depth from the sunk inner shadow (no drop shadow). The wave is the one colourful thing; the words read navy as they're heard. — [L4531](../../source/src/shell.html#L4531) `.vx { gap: 16px; min-width: 460px; max-width: min(680px, calc(100vw - 32px)); min-height: `

### routine card: a banner, the way a skill is offered — what it is, one description, the buttons; the example opens on ask

- routine card: a banner, the way a skill is offered — what it is, one description, the buttons; the example opens on ask — [L4550](../../source/src/shell.html#L4550) `/* a routine, as Sam drew it (Figma 44:3247): a paper surface sitting in a grey tray. What`
- a routine, as Sam drew it (Figma 44:3247): a paper surface sitting in a grey tray. What it is lives on the paper; what you can do sits in the tray below. Tray: 0.5 hairline, r8, 2px rim; surface r7 with 14/16/13 inside; actions 10 below, 14 to the edge. — [L4552](../../source/src/shell.html#L4552) `.rt { display: flex; flex-direction: column; margin-top: 12px; max-width: 600px; padding: `
- scrollbars: a 4px hairline that's barely there until you need it (darker under the pointer). WebKit/Blink draw it from these rules; Firefox gets its thin bar in the same ink. Nothing sets scrollbar-width elsewhere, or Chrome would ignore these. — [L4582](../../source/src/shell.html#L4582) `::-webkit-scrollbar { width: 10px; height: 10px; background: transparent; }`
- voice, second pass: real glass (thin, heavily blurred, a hairline edge and a soft lifted shadow, no inner shadow), and its content centred in the room it has. The Stop/Done button rides the right edge. — [L4590](../../source/src/shell.html#L4590) `.vx { justify-content: center; padding: 10px 92px; /* 92 = Stop (≈62) + its 10px inset + 2`
- 92 = Stop (≈62) + its 10px inset + 20px air, both sides so the middle stays centred — [L4590](../../source/src/shell.html#L4590) `.vx { justify-content: center; padding: 10px 92px; /* 92 = Stop (≈62) + its 10px inset + 2`
- the bar the voice opened in hands over its contents; the ask bar at the top steps away while you talk in a conversation — [L4600](../../source/src/shell.html#L4600) `[data-vx-under] > * { opacity: 0; transition: opacity .15s; }`
- frosted glass you can't read through: a strong blur and enough milk that the page under it goes soft, a hairline edge and the faintest lift. In a reply bar it's the same glass, in the bar's own box — [L4605](../../source/src/shell.html#L4605) `.vx { background: linear-gradient(162deg, rgba(244,247,250,.8), rgba(251,246,244,.84)) !im`
- every tile's picture sits on the same baseline, so the three footers line up — [L4623](../../source/src/shell.html#L4623) `.ar-t-viz { margin-top: auto; height: 36px; display: flex; flex-direction: column; justify`
- a deal's file: which deal, where it stands, and where this file is in its own review — [L4659](../../source/src/shell.html#L4659) `.ar-strip { display: flex; flex-direction: column; gap: 12px; margin: 0 0 22px; padding: 0`
- a narrow file (beside a conversation on a small screen): the name and its status share a line, what it is goes under — [L4670](../../source/src/shell.html#L4670) `.doc { container-type: inline-size; }`
- K: comments on a file. In pick mode the file takes a crosshair; a note pins where you clicked (face + words on paper, a hairline and a soft real shadow, the one place a shadow is allowed: it floats over the file) — [L4675](../../source/src/shell.html#L4675) `.cm-wrap { position: relative; }`
- voice, final: a small glass pill (40px tall, 440px wide), fixed under the page card's centre; it never moves or resizes while it's up. Inside: the wave (56×24 canvas), the line, a quiet ×. 14px type, one weight. The words flow left under a 20px fade once the line is full. Glass = thin wash + heavy blur + a hairline + one soft shadow. — [L4687](../../source/src/shell.html#L4687) `.vx { position: fixed; left: 50%; bottom: 24px; translate: -50% 0; z-index: 400; display: `
- "Play example" sits on the line, never under it — [L4702](../../source/src/shell.html#L4702) `.vx-f { display: flex !important; flex-direction: row !important; align-items: center; gap`
- account room, third pass: answer → what's left → folds. Rows share fixed columns (face 24 · step · who 88 · when 64), so every name and every Now/Next sits on one line down the card. — [L4712](../../source/src/shell.html#L4712) `.ar { gap: 20px; }`
- stages: one line, four stops. Reached = navy, now = coral, ahead = well; the line between fills as it goes — [L4735](../../source/src/shell.html#L4735) `.ar-stages { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); margi`
- Files: the department page's header and rows; one row of kind filters beside "All files" (text tabs, the active one navy and medium, a count after each; no pills, no strokes) — [L4756](../../source/src/shell.html#L4756) `.fl .fl-body { margin-top: 40px; }`
- Files as pictures: each tile is the file itself (first slide, or first page at real size, scaled) in the graph tiles' well frame, then its name and one line. 16px between tiles, 20px between rows. Hover: the picture eases forward a hair. — [L4766](../../source/src/shell.html#L4766) `.fl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(232px, 1fr)); ga`
- the team pages’ own section gap (64) is the gap — [L4784](../../source/src/shell.html#L4784) `.fl .dh-s + .dh-s { margin-top: 0; } /* the team pages’ own section gap (64) is the gap */`
- one callout everywhere, Home's own: a status reads in ink at 400 under a navy title ("Asked you" on Home's rows); where it sits (Waiting on you, the row that's now) carries the emphasis. No coloured text, no dots: coral is a chart mark only — [L4787](../../source/src/shell.html#L4787) `.fl-t em, .fl-t em.is-st { display: block; color: var(--ink); }`
- no coral dots or pills for "needs you" (Nov 10): Home's "7 need you" is ink after the title; in the chat a conversation waiting on you shows its name in navy 500 and a plain count, the way a mail client shows unread — [L4793](../../source/src/shell.html#L4793) `.fd-head h2 .fd-needn { margin-left: 10px; color: var(--mute); font-weight: 400; }`
- a file, in the Practice card's language (Figma 44:3311) but sized for a conversation: paper in a tray with a 1px rim, the icon beside what it is on the paper, where it stands on the tray. Hugs its title, 220–320 wide. — [L4826](../../source/src/shell.html#L4826) `.fcard { position: relative; display: flex; flex-direction: column; align-items: stretch; `
- ACTIVE / FOCUS RULE (always): no state is ever shown with a stroke, ring or outline. Focus and active read as a fill: a soft navy tint on light things, a soft light on navy things. This wins over every earlier focus rule. — [L4858](../../source/src/shell.html#L4858) `:focus, :focus-visible { outline: none !important; }`
- Files: tiles ⇄ list, as on Agents. The view switch sits after the kinds, the same height (28) and frame as that control; the chosen view is a navy fill, never a stroke. The list's rows rise in one by one (4px, .45s, 22ms apart). — [L4868](../../source/src/shell.html#L4868) `.fl-bar { align-items: center; }`
- on the page an icon tile is paper (the tray is for on paper) — [L4877](../../source/src/shell.html#L4877) `.fl-r .dh-fi { width: 28px; height: 28px; border-radius: 7px; background: var(--paper); } `
- Files: the kinds and the tiles/list switch set the whole page, so they sit across from the first section's heading. Every section heading row is the controls' height (28), so the tiles start the same distance under each heading; the first heading sits 44px under the header band. — [L4888](../../source/src/shell.html#L4888) `.fl .fl-body { margin-top: 72px; }`
- Account, cleaned up: the name, one line about them, then the one number big (Home's hero size), the chart, and what's next as one row. Everything else (every step, who's on it, files, what's been done) folds, summary at the back. — [L4895](../../source/src/shell.html#L4895) `.sdoc .ar { gap: 28px; }`
- in an open file the line sits under the name, in the header — [L4897](../../source/src/shell.html#L4897) `.fm-b .ar-sub { display: none; } /* in an open file the line sits under the name, in the h`
- a draft an agent wrote for you: it opens under your step, private, and sends as you — [L4917](../../source/src/shell.html#L4917) `.ar-draft { overflow: hidden; }`
- the Secondary button (navy at 7%): reads as a button, not a title — [L4935](../../source/src/shell.html#L4935) `.fd-act { height: 28px; padding: 0 12px; border: 0; border-radius: 6px; background: var(--`
- the card's buttons are outline buttons: the card already frames the work, a filled button would shout over it — [L4937](../../source/src/shell.html#L4937) `.fd-act { background: transparent !important; box-shadow: inset 0 0 0 1px rgba(9,53,85,.22`
- the summary rows ("2 more need you", "In progress") are rows in the same list: same grid, height, divider and hover — [L4940](../../source/src/shell.html#L4940) `.fd-sum { width: 100%; border: 0; border-bottom: 0; background: none; font: inherit; text-`
- one text field on screen: with a Home item open, the top ask steps away (Esc closes the item and it comes back) — [L4945](../../source/src/shell.html#L4945) `.topbar .composer { transition: opacity .25s; }`
- account: plain titles; one Steps list (your step, the rest on ask); dividers run the panel's full width (the fm-b 32px gutter) — [L4949](../../source/src/shell.html#L4949) `.ar-lab-r { display: flex; align-items: baseline; justify-content: space-between; }`
- the agent's face stays visible: the agent button is the light secondary, never navy behind a dark face — [L4961](../../source/src/shell.html#L4961) `.ar-go.is-agent { background: var(--sec); color: var(--navy); padding-left: 8px; }`
- an open file's top: the controls share the first line with the small "who · kind · status" line, so the name below runs the full width (no two-line title squeezed beside the icons) — [L4967](../../source/src/shell.html#L4967) `.fm-h { display: block; position: relative; padding: 18px 32px 16px; }`
- the eyebrow and the controls share the first row (the eyebrow ends where the controls begin, at any width or number of controls); the title and its line under it take the full width below — [L4971](../../source/src/shell.html#L4971) `.fm-h { display: grid; grid-template-columns: minmax(0, 1fr) auto; column-gap: 16px; align`
- who's doing what on a file, as rows (face, step, where it stands), dividers the panel's full width — [L4981](../../source/src/shell.html#L4981) `.fm-b .ar-strip { gap: 10px; margin: 0 -32px 22px; padding: 0; border-bottom: 0; }`
- the steps at the end of a file ("Before it goes") sit in the file's own column, on the same edges as the rows above — [L4987](../../source/src/shell.html#L4987) `.fm-b .doc .ar-flow { margin: 4px 0 0; } .fm-b .doc .ar-flow li { padding: 0; } .fm-b .doc`
- the "needs you" count in the sidebar: a plain number like the team scores beside it, never a coral badge — [L4992](../../source/src/shell.html#L4992) `.nav-need { min-width: 0; height: auto; padding: 0 2px; background: none !important; color`
- routine, edited in place: fields inside the card, Save and Cancel in the tray (no swap, no flash) — [L4995](../../source/src/shell.html#L4995) `.rt-form { display: flex; flex-direction: column; gap: 14px; margin-top: 14px; }`
- paper on the tray: selected without competing with Save — [L5004](../../source/src/shell.html#L5004) `.rt-seg-p { position: absolute; inset: 0; border-radius: 6px; background: #fefbf9; } /* pa`
- the number and, once you act, where it's headed beside it: no jump — [L5015](../../source/src/shell.html#L5015) `.ar-odds-n { display: flex; align-items: baseline; gap: 14px; } /* the number and, once yo`
- once you act: where it is now headed, in the line's colour — [L5016](../../source/src/shell.html#L5016) `.ar-odds em { margin: 0; font-style: normal; font-size: 13px; line-height: 18px; color: #0`

### an opened item that's moving, done, or a routine: the work on the left, what the left doesn't show on the right

- an opened item that's moving, done, or a routine: the work on the left, what the left doesn't show on the right · — [L5019](../../source/src/shell.html#L5019) `.gw-item:has(> .fx-b.fx-split), .gw-item:has(.rx-set.is-full) { container: gwi / inline-si`

### Files: the saved-charts board (Beyonce's Home) holding files. The tray carries the file card's texture

- Files: the saved-charts board (Beyonce's Home) holding files. The tray carries the file card's texture · — [L5110](../../source/src/shell.html#L5110) `.fl-board { margin-top: 40px; }`

### covers: a file's art, drawn from what it holds (16:9, on paper, on the textured tray)

- covers: a file's art, drawn from what it holds (16:9, on paper, on the textured tray) · — [L5128](../../source/src/shell.html#L5128) `.cv { position: relative; aspect-ratio: 16 / 9; display: flex; flex-direction: column; jus`
- the demo buttons stay out of the way: they show only with #demos on the link — [L5180](../../source/src/shell.html#L5180) `:root:not(.show-demos) .demo-land { display: none !important; }`
- an opened item fills the window from under "Your work": the page doesn't scroll under it, so it can't ride up over the bar — [L5182](../../source/src/shell.html#L5182) `html.home-item-open .main .scroll { overflow: hidden !important; }`
- a file open beside the full chat: its own controls (comment, expand, collapse) are the set; the chat's (watching, history, close) step out until it's gone, the same rule as an opened item on Home — [L5186](../../source/src/shell.html#L5186) `.chat-shell.has-doc .chat-head > :is(.wl-wrap, button, .ibtn, .ch-ctl, .chat-ctl) { visibi`
- a run: one line at the end names its routine and opens it — [L5189](../../source/src/shell.html#L5189) `.rx-from { display: flex; align-items: center; gap: 8px; align-self: flex-start; max-width`
- the routine, opened on its own: what it is and its settings on the left, its runs on the right — [L5194](../../source/src/shell.html#L5194) `.rx-set-a { display: flex; flex-direction: column; gap: 22px; }`

### what needs you, by whose it really is

- what needs you, by whose it really is — [L5209](../../source/src/shell.html#L5209) `.nc-h { display: flex; align-items: center; justify-content: space-between; gap: 16px; pad`
- Sam's Home arrives the way Beyonce's does (the intro's own timings): the greeting drops in, then the ask, then the work settles in from a touch larger, then what's moving, then the number — [L5226](../../source/src/shell.html#L5226) `@keyframes nDrop { from { opacity: 0; transform: translateY(-12px); filter: blur(8px); } t`

### Files: one list to find a file by. Each row carries the file's cover, small, on the textured tray

- Files: one list to find a file by. Each row carries the file's cover, small, on the textured tray — [L5237](../../source/src/shell.html#L5237) `.fl2 { margin-top: 40px; }`
- handing work to an agent: the agent's face waits by the button; on Let, a teal sweep runs across the row from the button (the agent taking it), the line says who has it, and the row flies down into In progress — [L5262](../../source/src/shell.html#L5262) `.fd-let { display: inline-flex; align-items: center; gap: 10px; }`
- landed in In progress: a soft teal wash that fades, so you can see where it went — [L5273](../../source/src/shell.html#L5273) `.fd-mv-r.is-fresh { animation: mvFresh 2.6s cubic-bezier(.22,1,.36,1) both; }`
- a routine opened on Agents: the same opened-item box as Home, fixed over the page's card — [L5277](../../source/src/shell.html#L5277) `.fd-open.rt-sheet { position: fixed; z-index: 60; }`
- Sam's Home: the header texture takes the band's height at once (easing it from the last page's height drew the pattern across the card for a moment as the page came in) — [L5285](../../source/src/shell.html#L5285) `.home-page.is-field .hw-wrap { transition: none; }`
- in the card, a row's hover (and the hand-off sweep) runs the card's full width, edge to edge of the paper, and the last row's runs to the paper's bottom; the paper clips it to its own corners — [L5289](../../source/src/shell.html#L5289) `.fd-rows.fd-nc-p { overflow: hidden; }`
- Beyonce's Home: the tiles in one row (her numbers first); opened, the row makes room on the tile's curve — [L5294](../../source/src/shell.html#L5294) `.top.is-lead { display: block; margin-top: 56px; }`
- her Q4 goals: tiles on the number tiles' foundation (they open the same way). Opened, the right panel is the goal's moves — [L5297](../../source/src/shell.html#L5297) `.home-page > .gq-h { margin: 64px 0 0; font-size: 20px; line-height: 26px; font-weight: 50`
- Q4 goals: a header that says where the quarter stands, the goals 2×2 on the left, what needs her on the right — [L5301](../../source/src/shell.html#L5301) `.gq-head { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 12px; margin-to`
- leadership's ARR movement as the scoreboard's hero: fills its three columns and two rows, Total ARR's number under the title — [L5306](../../source/src/shell.html#L5306) `.k-hero { min-width: 0; display: flex; }`
- the footer keeps its 36px; the plot gives way, never the footer — [L5308](../../source/src/shell.html#L5308) `.k-hero .card-foot { flex: none; } /* the footer keeps its 36px; the plot gives way, never`
- Needs you, in the header under the ask: one line per thing, its action at the end of the line, five then "See more" — [L5315](../../source/src/shell.html#L5315) `.nd-wrap { margin-top: 20px; max-width: 876px; } /* anchor: the ask bar's send button (rig`
- anchor: the ask bar's send button (right edge 1089 at 1440, the column starting at 265). A row keeps 52px right of its button (20 padding + the 32px set-aside x), so 1089 + 52 - 265 = 876: every button ends where the send button ends — [L5315](../../source/src/shell.html#L5315) `.nd-wrap { margin-top: 20px; max-width: 876px; } /* anchor: the ask bar's send button (rig`
- straight under the ask: the lines line up with the field — [L5318](../../source/src/shell.html#L5318) `.chat-open .content:has(.nd-wrap):not(.ch-page)::before { transition: height .45s cubic-be`
- one line a row: the context gives way before the row grows a second line — [L5331](../../source/src/shell.html#L5331) `@media (min-width: 700px) { .nd-w { flex-wrap: nowrap; } .nd-w b { flex: none; } .nd-w > s`
- the brief: the situation, three facts, the two ways to go (each with its button). Two sizes: 13 and 12 — [L5338](../../source/src/shell.html#L5338) `.bf { display: flex; flex-direction: column; }`
- the facts as a ledger: what on the left, the figure on the right — [L5341](../../source/src/shell.html#L5341) `.bf-facts { display: flex; flex-direction: column; gap: 4px; margin: 9px 0 0; }`
- the two ways to go, each its own card with its button under it — [L5346](../../source/src/shell.html#L5346) `.bf-opts { display: flex; flex-direction: column; gap: 9px; margin: 19px 0 0; padding: 0; `
- In progress under Needs you: Sam's rows, lined up with the lines above (face at 20px, title at 54px) — [L5358](../../source/src/shell.html#L5358) `.nd-wrap .nd-mv { margin-top: 20px; padding: 0; --face-col: 22px; }`
- the hand-off reads as one lit line: it holds lit where it was, travels lifted, lands and lets the light go — [L5362](../../source/src/shell.html#L5362) `.nd-row.is-going { background: var(--paper); border-radius: 12px; }`
- an open line is a card: paper, the move larger, the goal above it, the brief under it (Seth's Figma, node 2:21) — [L5373](../../source/src/shell.html#L5373) `.nd-row { transition: background-color .35s, border-radius .35s; }`
- the hover's own colour: hovering into opening is one continuous surface; the white option cards are what stand out — [L5374](../../source/src/shell.html#L5374) `.nd-row.is-on { background: rgba(9,53,85,.05); border-radius: 12px; } /* the hover's own c`
- the brief starts under the title (20 + 22 face + 12) and ends at the buttons' edge — [L5381](../../source/src/shell.html#L5381) `.nd-row.is-on .nd-more-in > div { padding: 14px 52px 24px 54px; } /* the brief starts unde`
- the board's documents: the page itself (open it full screen from the corner, or by clicking it) beside what's left on it — [L5389](../../source/src/shell.html#L5389) `.bd-doc { position: relative; height: 300px; } /* at rest the preview fills the card; on h`
- at rest the preview fills the card; on hover it steps aside to 391 (one 16:9 slide at 220) for the breakdown — [L5389](../../source/src/shell.html#L5389) `.bd-doc { position: relative; height: 300px; } /* at rest the preview fills the card; on h`
- the site keeps its desktop composition and scales, like a slide — [L5396](../../source/src/shell.html#L5396) `.bd-fit.is-site { position: relative; height: 220px; border-radius: 8px; overflow: hidden;`
- covers made from what's in the document — [L5401](../../source/src/shell.html#L5401) `.bdc { position: absolute; inset: 0; display: block; overflow: hidden; border-radius: 8px;`
- the site: its page in a browser frame, Felix building a listing on a loop — [L5416](../../source/src/shell.html#L5416) `.bdc-site { background: #f6f4f1; }`
- a long board keeps the Saved Charts container exactly: the list is its own bordered card, as tall as the document beside it (it never sets the height), and the rows past the sixth scroll inside it — [L5456](../../source/src/shell.html#L5456) `.board.is-docs .card.list { height: 0; min-height: 100%; }`
- the Saved Charts height: six rows of the list beside it — [L5457](../../source/src/shell.html#L5457) `.board.is-docs .detail-surface { min-height: 305px; } /* the Saved Charts height: six rows`
- an open goal: the chart left, and on the right one scrolling column, the moves as cards and then North, with the message box at its foot. The line between the sides drags — [L5465](../../source/src/shell.html#L5465) `.mtile.is-goal .mo-r { padding-bottom: 0; min-height: 0; overflow: hidden; }`
- each move is a row of the column, with a line between rows that runs the column's full width — [L5477](../../source/src/shell.html#L5477) `.gq-mv { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 0 12px; padding: `
- North, under the moves: North asks, she says it, North says whose it is — [L5515](../../source/src/shell.html#L5515) `.gq-log { display: flex; flex-direction: column; gap: 12px; padding: 16px 24px 0; border-t`
- board covers: the cover is the whole section, in the board's chart language on paper; title over it, the breakdown rises on hover, a click opens it — [L5534](../../source/src/shell.html#L5534) `.board.is-docs .board-body .detail-surface { height: 440px; min-height: 440px; }`
- a chart on the taller board sits on its floor, like the covers — [L5537](../../source/src/shell.html#L5537) `.board.is-docs .detail-inner:not(.is-cover) > :last-child { margin-top: auto; } /* a chart`
- the art lifts to make room for the breakdown rising under it — [L5540](../../source/src/shell.html#L5540) `.bcv.is-hv .bcv-art { transform: translateY(-34px); } /* the art lifts to make room for th`
- the goal panel as status: who has each move and what's happening now (the tick meter); a move still waiting on her call says so and points to Needs you, where it's decided, once — [L5557](../../source/src/shell.html#L5557) `.gq-mv.is-track { grid-template-columns: 22px minmax(0, 1fr) auto; cursor: pointer; }`
- Needs you: set a decision aside (it stays on its goal, restorable there) — [L5565](../../source/src/shell.html#L5565) `.nd-x { flex: none; width: 24px; height: 24px; margin-left: -4px; color: var(--mute); opac`
- rows without it keep its space, so every button lines up — [L5567](../../source/src/shell.html#L5567) `.nd-x.is-sp { visibility: hidden; pointer-events: none; } /* rows without it keep its spac`
- a dash she asked North for: first on her Home, in the tiles' language; four tiles divided by full-height lines — [L5571](../../source/src/shell.html#L5571) `.cd { overflow: hidden; }`
- the same 44px the ARR card sits below the band — [L5572](../../source/src/shell.html#L5572) `.cd-in { padding: 44px 0 0; } /* the same 44px the ARR card sits below the band */`
- her morning, split like Sam's: what's hers, what an agent can take (teal), and the morning in ticks at the foot — [L5592](../../source/src/shell.html#L5592) `.nd-h { display: flex; align-items: center; justify-content: space-between; gap: 16px; pad`
- right edge: the rows' buttons (20px inset + the 24px set-aside slot + its 8px gap) — [L5592](../../source/src/shell.html#L5592) `.nd-h { display: flex; align-items: center; justify-content: space-between; gap: 16px; pad`
- an agent-take button grows its own teal from the cursor — [L5597](../../source/src/shell.html#L5597) `.rt-b.is-let > .hv-fill { background: rgba(9,132,134,.1); } /* an agent-take button grows `
- the rest, in one line under the top three: more of hers, and what an agent can take (with the one button that hands them over) — [L5602](../../source/src/shell.html#L5602) `.nd-rest { display: flex; align-items: center; gap: 10px; min-height: 30px; padding: 4px 5`
- a file's front page is its board cover: the cover slide carries the same art under its title; a doc opens on it — [L5611](../../source/src/shell.html#L5611) `.sd.has-art .sd-art { position: absolute; inset: 0; width: 100%; height: 100%; }`
- a call that landed: what came of it, and a plain verdict (teal held; dark red where it cost something) — [L5623](../../source/src/shell.html#L5623) `.nd-v { flex: none; font-size: 13px; line-height: 18px; font-weight: 500; color: #098486; `
- the rest of her morning as one strip of stages: each its ticks and a count; the open one reads navy, the rest recede — [L5632](../../source/src/shell.html#L5632) `.nd-strip { display: flex; align-items: center; gap: 6px; min-height: 40px; margin-top: 6p`
- the ways to go: their own band across the card's foot — [L5678](../../source/src/shell.html#L5678) `.nd-row.is-on .bf-opts { margin: 18px -52px -24px -54px; padding: 12px 16px 16px; gap: 8px`
- Figma's glass: radius 4; refraction and dispersion have no CSS twin — [L5708](../../source/src/shell.html#L5708) `-webkit-backdrop-filter: blur(4px) saturate(1.5); backdrop-filter: blur(4px) saturate(1.5)`
- the light from -45°: lit top-left edge, the far edge in shade — [L5709](../../source/src/shell.html#L5709) `box-shadow: inset 1px 1px 0 rgba(255,255,255,.75), inset -1px -1px 0 rgba(9,53,85,.05), 0 `
- stacked: each fact its label over its figure — [L5717](../../source/src/shell.html#L5717) `.nbo-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px 24`
- no close button: anywhere on the card that isn't a control closes it, and the pointer says so — [L5722](../../source/src/shell.html#L5722) `.nbo-head, .nbo-tray { cursor: pointer; } .nbo-opt { cursor: default; }`
- the ways on as buttons that say what they do: the recommended one filled, the rest outlined, the last one opens a line — [L5725](../../source/src/shell.html#L5725) `/* the call's tray, as a routine card's: the row of buttons on the tray's grey, 16 in like`
- the call's tray, as a routine card's: the row of buttons on the tray's grey, 16 in like the paper's text — [L5726](../../source/src/shell.html#L5726) `.nbo-tray .nbo-acts { margin-top: 0; padding: 0; }`
- talking it through, in the card: the thread, then a copy of the main ask bar — [L5728](../../source/src/shell.html#L5728) `.nbo-chat { display: flex; flex-direction: column; gap: 10px; overflow: hidden; }`
- Something else: a small copy of the main ask bar (white, its edge, its corner) with the same round navy send and arrow — [L5737](../../source/src/shell.html#L5737) `.nbo-edit { display: flex; align-items: center; gap: 6px; }`
- the button's right edge lines up with every row's button above and below (the row's 20 + its 24 set-aside slot + 8) — [L5753](../../source/src/shell.html#L5753) `.nbo-opt { position: relative; display: flex; align-items: center; gap: 12px; padding: 12p`
- Figma: #f9f9f9 with a grain image on overlay — [L5755](../../source/src/shell.html#L5755) `background-size: 260px 260px; background-blend-mode: overlay; } /* Figma: #f9f9f9 with a g`
- the actions carry the card: the recommended way lifts off the tray, white, so it's the first thing you see; every button wipes in after its card lands — [L5762](../../source/src/shell.html#L5762) `.nbo-opt.is-rec { background-color: #fff; background-image: none; box-shadow: 0 0 0 0.5px `
- px to px: the card grows from the line to the brief — [L5782](../../source/src/shell.html#L5782) `.nd-sz { overflow: hidden; transition: height .5s cubic-bezier(.22,1,.36,1), opacity .35s `
- the × sits where every row's set-aside × sits — [L5784](../../source/src/shell.html#L5784) `.nbo-r { display: inline-flex; align-items: center; gap: 12px; margin: -6px -12px -6px 0; `
- reach for the ticker while a call is open and it comes back to full: its panel must never show the rows through it — [L5792](../../source/src/shell.html#L5792) `.nd.has-open > .nd-ip:hover, .nd.has-open > .nd-ip:has(.tp-push) { opacity: 1; } /* reach `
- while a brief is open, its options are the only buttons — [L5793](../../source/src/shell.html#L5793) `.nd.has-open .nd-row:not(.is-on) .nd-a, .nd.has-open .nd-row:not(.is-on) .nd-x, .nd.has-op`
- the block marks the word while it's written, then lets go — [L5797](../../source/src/shell.html#L5797) `.mb-blk { transition: background-color .6s ease, color .6s ease, padding .6s ease; }`
- stamped in: a solid block as it lands, then it lets go to plain text (the type reference) — [L5812](../../source/src/shell.html#L5812) `.nd-stamp, .nbo-fig { display: inline-block; border-radius: 2px; animation: ndStamp 1.3s c`
- what an agent can take: a row like the others; its faces overlap — [L5822](../../source/src/shell.html#L5822) `.nd-faces { position: relative; display: inline-block; width: 22px; height: 22px; } /* two`
- two faces inside the one face column, so the title still starts where every title starts — [L5822](../../source/src/shell.html#L5822) `.nd-faces { position: relative; display: inline-block; width: 22px; height: 22px; } /* two`
- In progress: a ticker strip (label, then label: figure in a well, hairlines between); hover holds it — [L5827](../../source/src/shell.html#L5827) `.tk { position: relative; display: flex; align-items: center; height: 36px; padding: 0 32p`
- the header's own bottom edge, card edge to card edge — [L5827](../../source/src/shell.html#L5827) `.tk { position: relative; display: flex; align-items: center; height: 36px; padding: 0 32p`
- its own layer: the panel that grows up out of a ticker item covers the rows, never shows them through — [L5828](../../source/src/shell.html#L5828) `.nd-ip { position: relative; z-index: 2; margin: 26px 0 -24px; } /* its own layer: the pan`
- the one you're on stays; the rest fall back — [L5840](../../source/src/shell.html#L5840) `.tk-run.is-held .tk-c:not(.is-on) { opacity: .3; } /* the one you're on stays; the rest fa`
- the panel the item grows into: the Watching dropdown's surface — [L5843](../../source/src/shell.html#L5843) `.tk-run { position: relative; z-index: 1; }`
- opened, the list above says it all: the strip keeps only its label — [L5847](../../source/src/shell.html#L5847) `.tk.is-open .tk-run { opacity: 0; pointer-events: none; } /* opened, the list above says i`
- a look over the shoulder of one piece of work (the ticker's panel, and a row of the list opened) — [L5851](../../source/src/shell.html#L5851) `.pk { display: flex; flex-direction: column; gap: 10px; white-space: normal; font-size: 13`
- reach for something in progress and the calls on you step back, so the panel reads on its own — [L5863](../../source/src/shell.html#L5863) `.nd .nd-swap { transition: opacity .35s cubic-bezier(.22,1,.36,1); }`
- what it's doing now, thinking: a light passes through the words, the way Claude shows it's working — [L5866](../../source/src/shell.html#L5866) `.pk-think { flex: 1; min-width: 0; color: #5f6d79; } /* the step being worked on; its lett`
- the step being worked on; its letters take a highlight in turn (LetterShine) — [L5866](../../source/src/shell.html#L5866) `.pk-think { flex: 1; min-width: 0; color: #5f6d79; } /* the step being worked on; its lett`
- the steps, folded under the toggle: one row each, the way Claude lists what it did — [L5875](../../source/src/shell.html#L5875) `.pk-st { margin: 0 -8px; padding: 0; list-style: none; overflow: hidden; }`
- In progress, taking over the header's list — [L5894](../../source/src/shell.html#L5894) `.nd-swap.is-swap { transition: height .5s cubic-bezier(.22,1,.36,1); overflow: hidden; }`
- 52: the status ends on the buttons' edge — [L5904](../../source/src/shell.html#L5904) `.pl-in { position: relative; display: flex; align-items: center; gap: 12px; min-height: 44`
- Meetings: the meetings on the left (by kind, cadence and next date); the latest one on the right, read like a short memo: the date as its title, a few plain sentences of what it was about, then Decided, Since then, Next time. Type, hairlines, faces and space, as on Home and Files. Two sizes for everything but the title and the story: 14 and 13 — [L5914](../../source/src/shell.html#L5914) `.mg-grid { display: grid; grid-template-columns: 244px minmax(0, 1fr); gap: 48px; margin: `
- the list: Home's board list, selection grows from where you clicked, hover from the cursor — [L5917](../../source/src/shell.html#L5917) `.mg-nav { position: sticky; top: 16px; z-index: 4; display: flex; flex-direction: column; `
- sticky makes its own layer: lift it, so its hover tip sits over the recap, not under it — [L5917](../../source/src/shell.html#L5917) `.mg-nav { position: sticky; top: 16px; z-index: 4; display: flex; flex-direction: column; `
- a label, not a heading: it sits behind the names — [L5918](../../source/src/shell.html#L5918) `.mg-nav h4 { margin: 0 0 4px; padding-left: 12px; font-size: 11px; line-height: 16px; font`
- the same width as everything under it — [L5935](../../source/src/shell.html#L5935) `.mg-story { margin: 14px 0 0; font-size: 16px; line-height: 26px; color: var(--navy); text`
- to confirm: Home's Needs you rows; the line North heard under each, then not needed / confirm on the right edge — [L5943](../../source/src/shell.html#L5943) `.mg-asks { overflow: hidden; }`
- since then: box (yours) or ring (an agent's, it fills itself) · what · who · when; the line it came from opens under it — [L5953](../../source/src/shell.html#L5953) `.mg ul.mg-ts { margin: 0 -10px; }`
- next time: numbered; then the doc or the deck — [L5973](../../source/src/shell.html#L5973) `.mg-ag li { position: relative; display: flex; align-items: flex-start; gap: 12px; padding`
- the date menu: grows out of the title it belongs to and holds it, on the menus' dial — [L5983](../../source/src/shell.html#L5983) `.mg-dd { position: relative; z-index: 3; }`
- a meeting arrives in reading order; backwards only, so a step confirmed into Since then travels — [L5992](../../source/src/shell.html#L5992) `.mg-rc :is(.mg-rc-h, .mg-story, h3, .mg-dec li, .mg-t, .mg-a, .mg-ag li, .mg-make) { anima`
- the panel: the strip's top line pushing up (the Watch dropdown's shape, turned over) — [L5997](../../source/src/shell.html#L5997) `.tp-push { position: absolute; bottom: calc(100% - 0.5px); z-index: 3; --tp-line: rgba(9,5`
- the last 44px is the item itself — [L6000](../../source/src/shell.html#L6000) `.tp-push .pk > * { animation: pkIn .42s cubic-bezier(.32,.72,0,1) both; animation-delay: .`
- quiet: it says what's moving, it doesn't ask for you — [L6001](../../source/src/shell.html#L6001) `.tk-l { font-size: 11px; line-height: 14px; font-weight: 500; letter-spacing: .06em; text-`
- leadership's header holds; the page slides up over it — [L6021](../../source/src/shell.html#L6021) `.content:has(.lead-head)::before { display: none; }`

### Meetings: List / Calendar

- below the band, where the list view starts; the chart cards' well — [L6041](../../source/src/shell.html#L6041) `.mg-cal { margin: 36px 0 80px; border-radius: 9.4px; } /* below the band, where the list v`
- the way back is a quiet crumb; the meeting is the title — [L6048](../../source/src/shell.html#L6048) `.mg-cal-back { display: inline-flex; align-items: center; gap: 4px; height: 33px; margin-l`
- today, the way a calendar marks it — [L6056](../../source/src/shell.html#L6056) `.mg-cal-d.is-today .mg-cal-dh b { display: grid; place-items: center; min-width: 24px; hei`
- half an hour or less reads on one line — [L6063](../../source/src/shell.html#L6063) `.mg-cal-ev.is-short { flex-direction: row; align-items: center; gap: 6px; padding-block: 0`
