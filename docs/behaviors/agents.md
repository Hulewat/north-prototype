# Agents

Each note: what it does, then where. Read the linked line for exact values.

## agents.jsx

- Orin, Riley, Calvin, Marco and Fia — specialists North can bring into the conversation. North runs it; they only speak when tagged (@Riley …), when North suggests one and you accept, or when you convene the team. Each says a few lines with the source it used; a convened round ends with North on where they agree, where they don't, and what's yours to decide. — [L4](../../source/src/agents.jsx#L4) `import { NorthLogo } from "./marks.jsx";`
- the crew. Each one's colour is the glow in its chest — [L14](../../source/src/agents.jsx#L14) `orin: { id: "orin", n: "Orin", role: "GTM", col: "#3d5bd9" },`
- the three who weigh in on the numbers by default (a huddle, "convene the team"); Marco and Fia join when you name them — [L23](../../source/src/agents.jsx#L23) `export const CORE_IDS = ["orin", "riley", "calvin"];`
- per answer: each agent's take (+ where it looked), North's sum-up, and who North suggests bringing in — [L26](../../source/src/agents.jsx#L26) `const T = (t, src) => ({ t, src });`
- anything else (a chart you pointed at, an older thread): each agent from its own lane Marco and Fia, when you bring them in on something with no take written for them: their own lane's angle, no numbers — [L109](../../source/src/agents.jsx#L109) `const ALSO = (topic) => ({`
- every answer can bring someone in: whoever's lane the subject sits in — [L120](../../source/src/agents.jsx#L120) `suggest: /renew|account|churn|nrr|grr|customer|usage|onboard/i.test(topic || "") ? ["calvi`
- a huddle: the lead talks it through with the others, out of sight, and comes back with where they landed. Everything here is from the takes above (no new numbers): the glimpses are the first beat of each take, the outcome is the lead's account of them, and the transcript is the takes themselves, in the order they were made. the same facts said to the person they're about. Sam doesn't hear anyone's pay, and moving him isn't his call to make: it's waiting on leadership's approval (the "Approve moving Sam back to Outbound" decision on the Agents floor). — [L129](../../source/src/agents.jsx#L129) `const SEAT_TAKES = {`
- q: what you asked them (names stripped). The huddle opens on your question, and the report starts by answering it: your question, then what each of them said, then the lead's own read, then the call that's yours — [L154](../../source/src/agents.jsx#L154) `export function huddleFor(key, topic, lead, ids, q = "") {`
- the written-out outcome needs everyone it names in the room; otherwise the lead gives its own read and the others', from their takes — [L157](../../source/src/agents.jsx#L157) `const HO = (SEAT_HUDDLE[getWho()] || {})[key] || HUDDLE_OUT[key], out = HO && HO.lead === `
- a huddle is one contained row, like a thinking step: the agents' orbs circling each other, who's in it, how long, and a caret. Open it and you're in the room: their messages land one at a time while it runs, and stay there to reread once it's done. — [L170](../../source/src/agents.jsx#L170) `export function Huddle({ m }) {`
- folded by default: one row says who's talking and for how long; open it to read what they said — [L172](../../source/src/agents.jsx#L172) `const [o, setO] = useState(false), [now, setNow] = useState(Date.now()), T = m.transcript `
- while live, each line lands at its moment — [L175](../../source/src/agents.jsx#L175) `const shown = live ? T.filter((_, i) => el >= (i * m.dur) / T.length) : T; // while live, `
- each agent is an orb, studied from Calvin's: a pale glass sphere holding a liquid body that sits just inside the rim (not concentric), its edge creasing where it meets the glass. Inside, silky colour folds — soft fields, a sharper crease band, a light ridge — that drift and turn while the body itself slowly changes shape. Pastel, not saturated. — [L203](../../source/src/agents.jsx#L203) `const PAL = {`
- a closed 8-point blob around (50,50): radii per point, so variants share one structure and can morph into each other — [L209](../../source/src/agents.jsx#L209) `const blob = (r, rot = 0) => {`
- the crew: each agent is its character's face (a head portrait on a tint of its colour); working, it breathes. North itself (and anything without a face) keeps the WebGL orb, with the drawn SVG orb as its fallback — [L231](../../source/src/agents.jsx#L231) `const Face = ({ id, size, live, className }) => (`
- the whole character (the Agents page): size is its height, feet on the bottom edge; it shifts its weight now and then — [L237](../../source/src/agents.jsx#L237) `const Body = ({ id, size, live, className }) => (`
- one steady pace, always flowing (changing durations mid-flight would freeze it) — [L255](../../source/src/agents.jsx#L255) `const u = useId().replace(/:/g, ""), p = PAL[id] || PAL.calvin, k = 0.6, dur = (s) => '${(`
- the glass: pale, with a tinted rim — [L274](../../source/src/agents.jsx#L274) `<rect width="100" height="100" fill={p.base} />`
- folds: soft curved ribbons that fade at their ends — the silk in it, never straight lines — [L291](../../source/src/agents.jsx#L291) `<g filter={'url(#f2${u})'} fill="none" strokeLinecap="round">`
- where the body meets the glass: a crease that's light up-left, deep colour down-right — [L305](../../source/src/agents.jsx#L305) `<path d={BODY[0]} fill="none" stroke={'url(#e${u})'} strokeWidth="2.4" filter={'url(#f3${u`
- (the old CSS marble filter is no longer used) — [L318](../../source/src/agents.jsx#L318) `export const OrbDefs = () => null;`
- words arrive one after another, softly (same feel as North's answers) the pace eases out: early words come quickly, the last few settle in more slowly — [L329](../../source/src/agents.jsx#L329) `const Words = ({ text }) => {`
- one agent's turn: the orb arrives first (a soft pop and a ripple of its colour), swirls while they think, then the take arrives word by word and the source settles in under it — [L341](../../source/src/agents.jsx#L341) `const clampN = (v, a, b) => Math.max(a, Math.min(b, v));`
- a selection fill that appears where you chose, never sliding over from the last thing chosen: it grows out from the point you clicked (from its middle when you chose with the keyboard), the way a hover grows from the cursor — [L350](../../source/src/agents.jsx#L350) `let lastDown = null;`
- a job opened in place, under its row: grows open, nothing leaves the chat — [L363](../../source/src/agents.jsx#L363) `export function JobPeek({ id, onShare, M, onAgents, said }) {`
- the orb sits in the name line, as tall as the name — [L390](../../source/src/agents.jsx#L390) `<span className="ag-who">`
- a huddle's next step, as a decision: say yes and it starts (the draft, the list, the invites) — [L405](../../source/src/agents.jsx#L405) `{m.next && <span className="ag-jobs" style={{ animationDelay: '${Math.min(1600, words * 30`
- a decision is made right here: say yes or not now, and its owner answers in the thread — [L418](../../source/src/agents.jsx#L418) `{j.st === "need" && onDecide && !m.decided?.[j.id]`
- a delivery: each finished job, what came out of it, and the way into the full thing — [L425](../../source/src/agents.jsx#L425) `{m.deliv?.length > 0 && <div className="ag-dls" style={{ animationDelay: '${Math.min(1600,`
- a convened round opens with the three joining, together — [L450](../../source/src/agents.jsx#L450) `export function AgentJoin({ ids, topic, M, joined = false, again = false }) {`
- under an answer that crosses into another lane: one quiet line, one tap — [L462](../../source/src/agents.jsx#L462) `export function AgentSuggest({ id, why, onBring, M }) {`

## agents-concept.jsx

- North · Agents — "the tracker" concept. Words first, motion second. Each project reads like an order tracker: a plain list of steps, who's doing each one, what's done, what's happening this second, and what's next. Collaboration is in the sentences ("Riley checked Orin's numbers"), not in lines to decode. Everything is changeable where you see it: comment on any step, rewrite or remove a planned step, hand it to a different agent, or add one. Motion only reinforces what the words say: the live step types out what it's doing and fills as it goes, finished steps check off, the next step steps up. — [L7](../../source/src/agents-concept.jsx#L7) `import { RoutineList } from "./routines.jsx";`
- the dials as they ship, for a job opened outside the Agents page (inside it, the live dials are used) — [L35](../../source/src/agents-concept.jsx#L35) `const D0 = fromDials(Object.fromEntries(Object.values(SPEC).map(([l, v]) => [l, Array.isAr`
- projects: plain steps, each with who does it. done steps carry what they produced (said as a sentence) — [L48](../../source/src/agents-concept.jsx#L48) `const St = (l, ag, acts, o = {}) => ({ l, ag, acts, ...o });`
- example figures for the day; they tick up as steps finish — [L71](../../source/src/agents-concept.jsx#L71) `const TODAY = { jobs: 6, steps: 23, made: 4 }; // example figures for the day; they tick u`
- Riley's Outbound review, the job opened in the details view. Copy, numbers and series are the prototype's. — [L73](../../source/src/agents-concept.jsx#L73) `const OUTBOUND_CARD = {`
- Sam's own calls, sized to his job. Every fact is the prototype's: the lost-demo review, the demo list he left, New ARR's gap — [L98](../../source/src/agents-concept.jsx#L98) `{ id: "sam-follow", agent: "orin", for: "sam", title: "11 lost demos never got a follow-up`
- types a line out, a character at a time (the agent saying what it's doing right now) presenting: the floor holds still, text lands whole, and the board's flow slows to a drift — [L124](../../source/src/agents-concept.jsx#L124) `const CalmCtx = React.createContext(false);`
- the simulation waits while something on screen is moving (chat, sidebar) or the page can't be seen: a re-render of the whole page mid-animation is what made transitions stutter. It ticks a few times a second, not ten. — [L135](../../source/src/agents-concept.jsx#L135) `const holdStill = () => { const r = document.documentElement.classList; return document.hi`
- a step finishes: it checks off with what it did, the next one steps up — [L153](../../source/src/agents-concept.jsx#L153) `const s = p.steps[p.cur], steps = [...p.steps];`
- one project, read like an order tracker — [L166](../../source/src/agents-concept.jsx#L166) `function Step({ p, s, i, D, upd, cmOpen, setCmOpen }) {`
- the agent answers in a beat; for a finished step it puts a redo into the plan right after what it's doing now — [L176](../../source/src/agents-concept.jsx#L176) `setTimeout(() => upd((q) => {`
- the world: data in → agents → what they're making Three columns, labelled once. Raw data drifts in as loose dots, goes through the agent, and comes out as even pieces that land in the thing it's making, which visibly grows. One agent passing work to another is one more stream. — [L263](../../source/src/agents-concept.jsx#L263) `const SOURCES = [`
- what each agent is thinking, revealed as its project moves along (at = how far along, 0–1). Every number is the prototype's. — [L271](../../source/src/agents-concept.jsx#L271) `const THINK = {`
- how far along the thing itself is (0–1), from the project's steps — [L287](../../source/src/agents-concept.jsx#L287) `const madeOf = (p) => (p.done ? 1 : Math.min(1, (p.cur + p.prog) / p.steps.length));`
- handoffs run up a channel just left of what they're making: straight, one direction, labelled at the start — [L318](../../source/src/agents-concept.jsx#L318) `COLLAB.forEach((cb, i) => { const fr = cb.from[1], x = geo.out.orin.x - 16 - i * 9; routes`
- raw data is loose and settles as it reaches the agent; what comes out is even — [L329](../../source/src/agents-concept.jsx#L329) `const P = lerp(r.a, r.b, q.t), sc = r.kind === "in" ? 7 * (1 - q.t) : 0; // raw data is lo`
- Riley's check leaves her output and arcs up to Orin; Calvin's arcs up from his agent. A gentle S so they read as handoffs, not wiring — [L378](../../source/src/agents-concept.jsx#L378) `function cubicCo(a, b, t) { const u = 1 - t, c1 = { x: a.x + 30, y: a.y - 40 }, c2 = { x: `
- a thumbnail of the thing, growing as it's made — [L381](../../source/src/agents-concept.jsx#L381) `function Thumb({ kind, m }) {`
- a page writing itself, line by line — [L386](../../source/src/agents-concept.jsx#L386) `const n = 7, shown = m * n; // a page writing itself, line by line`
- inside an agent: what it's making, live, with the steps beside it — [L391](../../source/src/agents-concept.jsx#L391) `const DOC = [`
- the summary writes itself during "Write the summary" — [L399](../../source/src/agents-concept.jsx#L399) `const prog = p.done || p.cur > writing ? 1 : p.cur < writing ? 0 : p.prog; // the summary `
- a waterfall in Orin's chart language: where October's rate lands, each lever stacked on, the total against the plan dot — [L435](../../source/src/agents-concept.jsx#L435) `const run = p.steps.findIndex((s) => /three levers/.test(s.l)), prog = p.done || p.cur > r`
- the agent thinking out loud while it works; reply to any thought to steer it — [L461](../../source/src/agents-concept.jsx#L461) `function Thinking({ p, id, D, setPs }) {`
- the floor: every job, on the company's own lanes Agents work on the same seven lanes as Company health, so their work sits where the metric it's moving lives. Each job is one line of type. State is always visible (working, waiting, queued, needs you, done) and the floor moves on its own: lines fill as work happens, finished jobs drop to the bottom and fade, queued ones pick up. — [L514](../../source/src/agents-concept.jsx#L514) `const inS = (j, scope) => scope === "me" ? !!j.mine : typeof scope === "string" && scope.s`
- when two agents share a job they talk it through, and that conversation lives in the job (written for the prototype, from each job's own steps and Company health's numbers). Lines appear as the job moves. — [L519](../../source/src/agents-concept.jsx#L519) `const JOB_TALK = {`
- Fia keeps the knowledge base: how Fello defines each number (the definitions are Company health's own) — [L534](../../source/src/agents-concept.jsx#L534) `J(1, "fia", "Write up how Outbound’s Booked ARR is counted", "done", { at: "9:20", mine: t`
- company scale, as a preview: the prototype's own jobs run again for each customer segment, so the views can be judged at a few hundred jobs. Titles and steps are the prototype's; the segment split is made up for the preview. — [L570](../../source/src/agents-concept.jsx#L570) `const SEGS = ["SMB", "Mid-market", "Enterprise", "EMEA", "APAC", "LATAM", "Partners", "Sel`
- the floor never runs dry: while fewer than eight are moving, the next job comes in (the prototype's own jobs, run again) — [L598](../../source/src/agents-concept.jsx#L598) `const nRun = out.filter((j) => j.st === "run" && !j.arch).length;`
- the lane keeps its height: its oldest finished floor is filed away — [L602](../../source/src/agents-concept.jsx#L602) `const lane = out.filter((j) => j.lane === src.lane && !j.arch); // the lane keeps its heig`
- the three deep jobs take their progress from their projects — [L611](../../source/src/agents-concept.jsx#L611) `const all = deriveJobs(jobs, ps);`
- the bridge: Agents is part of North, so North's chat answers for it The floor's state lives here between visits, so going Home and coming back finds everything where you left it, and North's chat (on any page) can ask the agents, act on a decision, start a job, or pick a conversation back up. — [L618](../../source/src/agents-concept.jsx#L618) `const NA = { raw: null, ps: null, setRaw: null, open: null, pendingOpen: null };`
- whose seat: leadership sees every job. Anyone else sees the company's work but only their own decisions, and "for me" is their lane (plus anything named for them). Jobs started from a seat belong to that seat. — [L621](../../source/src/agents-concept.jsx#L621) `function seatView(list) { const st = seatOf(), w = getWho();`
- a decision made for someone (for: "sam") is theirs alone; leadership's decisions stay with leadership leadership sees everyone's work, theirs too: a call that's someone else's shows as waiting on them, not as one to make. (If leadership has its own ask for the same job, that one stands and the other isn't shown twice.) — [L625](../../source/src/agents-concept.jsx#L625) `if (!st) { const own = new Set(list.filter((j) => j.st === "need" && !j.for).map((j) => NE`
- standing orders and decision check-ins live outside React, so the chat and the Agents page read the same list — [L635](../../source/src/agents-concept.jsx#L635) `const BOOK = { rules: [], checks: [] }, bookSubs = new Set();`
- "did it work?": every approval is logged with the numbers it should move, as they stand today, and a date to look again. The after-numbers come from live data on that date; the prototype never makes them up. — [L640](../../source/src/agents-concept.jsx#L640) `const KPI = (li, r) => { const row = HLANES[li][3][r]; return [row[0], row[1], row[2] == n`
- what saying yes does: a proposal starts the queued job it names (and any other ask for the same job goes away); a "start" adds the job it describes, running; anything else is done whoever says yes watches what it set in motion (watchBy): North tells them when it lands, wherever they are — [L654](../../source/src/agents-concept.jsx#L654) `const approveIn = (JS, j, n, nid, w = getWho()) => n?.propose ? JS.map((x) => (x.id === j.`
- the same decision made on Home: approve it here (its check-in is booked like any approval), or, for the other way, set it aside and start what was chosen instead — [L662](../../source/src/agents-concept.jsx#L662) `if (typeof window !== "undefined") window.addEventListener("north:decided", (e) => { const`
- a finished job, handed back: what it is, what came out of it (only from what's known: its findings; else the number it was checking on Company health; else what it is), and who it's for, so it can be reviewed, sent on or added somewhere — [L671](../../source/src/agents-concept.jsx#L671) `function deliveryOf(j) { const th = (j.think || []).filter((t) => !/^Starting on /.test(t)`
- feedback on finished work: it goes back to its agent, gets reworked with your note, and comes back as the next version — [L686](../../source/src/agents-concept.jsx#L686) `const naRework = (id, note) => { const j = naJobs().find((x) => x.id === id); const base =`
- the rework itself: the new version of the result is written while the job runs, and is what comes back — [L689](../../source/src/agents-concept.jsx#L689) `if (base) reviseOf(NA.sm || window.__northAgents?.sm, base).then((t) => naUpdate((JS) => J`
- where finished work can go. In North, Send hands it to the chat (which drafts the Google Chat message); alone, it just confirms every way finished work can leave: to a person, as a file, into another piece of work — [L692](../../source/src/agents-concept.jsx#L692) `const SHARE = [["Send", [["gc", "Google Chat", "To the person it’s for, or anyone"], ["lin`
- msgs: the chat you're in · all: every chat (picking something back up can reach any of them) — [L702](../../source/src/agents-concept.jsx#L702) `const RULE = /^(?:if|when|whenever|any ?time|once)\s+(.+?)(?:,\s*|\s+then\s+|\s+)(?:have|g`
- 0. a standing order: a watch that starts work. Already true? The job starts now. Otherwise it waits for the number. — [L714](../../source/src/agents-concept.jsx#L714) `const rl = ruleOf(q);`
- 0b. how Fello defines a number ("how do we count Booked ARR?", "what counts as a held demo?"): Fia, from the definitions     Company health already carries. Only definition questions: "what's our Booked ARR?" still gets the number. — [L725](../../source/src/agents-concept.jsx#L725) `if (/how (do|does|did) (we|you|fello) (count|define|measure|calculate)|\bdefin(e|ed|ition|`
- the closest name: the whole name in the question wins; otherwise its base ("Booked ARR") plus the most of its qualifier ("Outbound") — [L728](../../source/src/agents-concept.jsx#L728) `const score = (k) => { const [b0, ...r0] = k.split(" – "), n = norm(k), base = norm(b0), q`
- 1. picking a conversation back up: "that thing with Orin about Sam's list", "what did Orin and I talk about" — [L736](../../source/src/agents-concept.jsx#L736) `if (RECALL.test(q)) { msgs = all;`
- 1b. a reply to finished work ("make it shorter", "add the Q3 numbers"): the work goes back with that note — [L747](../../source/src/agents-concept.jsx#L747) `if (lastNa && lastNa.deliv?.length && lastAny === lastNa && !agN && !isAsk(q) && !/^(thank`
- 2. a reply to an agent you were just talking to ("go ahead", "do that first", "thanks") — [L752](../../source/src/agents-concept.jsx#L752) `if (lastNa && lastAny === lastNa && !agN && !isAsk(q)) { const last = { jobs: (lastNa.jobs`
- 3. handing an agent something to do: "Have Riley check Outbound's pipeline against pace" — [L754](../../source/src/agents-concept.jsx#L754) `const dm = q.match(DO);`
- 3b. bringing another agent into an agent's thread ("@Riley what do you make of this?"): their side of the same work, from the jobs — [L758](../../source/src/agents-concept.jsx#L758) `if (agN && lastNa && agN !== lastNa.agent && (lastAny === lastNa || lastAny?.role === "use`
- North isn't a co-worker on jobs: after a North answer, an agent speaks to the ones on that list that are theirs — [L764](../../source/src/agents-concept.jsx#L764) `const nth = other === "north";`
- 4. asking about the agents' work or your own: answered from the jobs — [L776](../../source/src/agents-concept.jsx#L776) `const workQ = isAsk(q) && (agN && /(work|doing|on|plate|breakdown|done|busy|up to|status|g`
- what a running job is making, small: the thing itself as it comes together (the visuals drawing in, the doc writing, the chart), for a glance over its shoulder from Home. The same pieces its own window shows — [L786](../../source/src/agents-concept.jsx#L786) `const PEEK_D = { typeMs: 26 };`
- a note while the work is still going: it goes in as the job's next step, and the agent says, in a line, what it'll change — [L795](../../source/src/agents-concept.jsx#L795) `const steerLocal = (j, note) => j.kind === "images" ? "Got it. I’ll work that into the one`
- the note goes in right after the step it's on and becomes the step it's on now; from here the job keeps moving on its own, so you watch it pick back up (the steps tick on, the work fills in) — [L800](../../source/src/agents-concept.jsx#L800) `naUpdate((JS) => JS.map((x) => { if (x.id !== id) return x; const th = [...(x.think || [])`
- a job as the chat's thread needs it: who owns it, its lane (what questions on it are about), where it is, what came out — [L814](../../source/src/agents-concept.jsx#L814) `job(id) { const j = naJobs().find((x) => x.id === id) || (NA.raw || []).find((x) => x.id =`
- viz: the chart the work already shows, by the title a chat card would give it — [L815](../../source/src/agents-concept.jsx#L815) `const nm = rowOf(j).name || "", ln = LANE_N[j.lane] || ""; // viz: the chart the work alre`
- the work's findings as plain text (what Copy, Share and Google Chat carry from the top of a job's window) — [L819](../../source/src/agents-concept.jsx#L819) `workText(id) { const j = naJobs().find((x) => x.id === id) || (NA.raw || []).find((x) => x`
- rows (as an agent's answer shows them) for the jobs that pass f, with their states, so a message can carry decisions — [L825](../../source/src/agents-concept.jsx#L825) `rows: (f) => { const js = naJobs().filter(f), rows = js.map(rowOfJob); return { rows, snap`
- what each agent is doing this minute: its furthest-along running job, the thought it's on, and how far it's got — [L827](../../source/src/agents-concept.jsx#L827) `now: () => { const js = naJobs(); return IDS.map((ag) => { const run = js.filter((j) => j.`
- a job opened inside the chat: what it is, where it is, what came out of it, what's next. Only what the job already holds — [L831](../../source/src/agents-concept.jsx#L831) `detail(id) { const j = naJobs().find((x) => x.id === id); if (!j) return null; const need `
- the whole plan (what's done, what it's on, what's left) and what the work leads to, so a job's steps can be one list — [L837](../../source/src/agents-concept.jsx#L837) `plan: th, k, next: NEXT[j.t] || null, led: LEADS.find((l) => l[0] === j.t)?.[1] || null, p`
- a watched job moved. Done = a delivery: what was asked for comes back with its result. Anything else is one quiet line — [L840](../../source/src/agents-concept.jsx#L840) `changed(id, from) { const j = naJobs().find((x) => x.id === id); if (!j) return null; cons`
- prototype: start one of your jobs and have it land a few seconds later, to see the notice. It's real work from the lane's own "close the gap" list, so the job it leaves behind is one the floor would have offered anyway — [L854](../../source/src/agents-concept.jsx#L854) `demoLand() { const st = seatOf(), lane = st ? st.lanes[0] : 1, live = new Set(naJobs().fil`
- a watched job in a line: where it stands, said plainly (an approval says what it did and when it gets checked) — [L858](../../source/src/agents-concept.jsx#L858) `watchOf(id) { const j = naJobs().find((x) => x.id === id) || (NA.raw || []).find((x) => x.`
- start a job from a conversation (a huddle on an account keeps working on it); it runs on the floor like any other — [L863](../../source/src/agents-concept.jsx#L863) `start: (t, ags, lane = 2, think) => naAdd(t, ags, lane, think),`
- off the Agents page the floor isn't drawn, but what you set in motion keeps going: your watched jobs move on their own clock — [L870](../../source/src/agents-concept.jsx#L870) `if (typeof window !== "undefined") setInterval(() => { if (NA.setRaw) return; const JS = N`
- a job you sent a note into keeps going after it, a little at a time, so its steps and its work visibly move on — [L872](../../source/src/agents-concept.jsx#L872) `if (JS.some((j) => j.steered && j.st === "run" && !j.arch)) NA.raw = (NA.raw || FLOOR0).ma`
- the list: grouped by what you need from it, newest first inside each group. One line of title, one quiet line under it (the agent's live thought while it works, otherwise who and where), the time on the right. Agent and lane are metadata. — [L878](../../source/src/agents-concept.jsx#L878) `const AGE = {}; // minutes since each job started or finished (example values, stable per `
- minutes since each job started or finished (example values, stable per job) — [L878](../../source/src/agents-concept.jsx#L878) `const AGE = {}; // minutes since each job started or finished (example values, stable per `
- a job opened: a panel over the board (the rail stays, so you keep your place). Three levels, top to bottom: what it is and where it stands; the thing itself (or, for a decision, the call to make); how it's thinking and what's next. Steering is always in the same place, at the bottom. — [L912](../../source/src/agents-concept.jsx#L912) `const ST_PILL = { run: "Working", need: "Needs you", wait: "Waiting", queue: "Up next", do`
- the board, as a system Top to bottom, the way work moves: the agents, the live lines of work coming off them, the company's seven lanes. Only live work is drawn. A line appears when an agent starts on a lane and goes when it's done, so every lit line means "this is happening now", in that agent's colour. A new job rides its line down as a small tag. Each lane carries the number its work is moving (from Company health), and that number lights when a job lands. — [L964](../../source/src/agents-concept.jsx#L964) `const BU = 34, C30 = 0.8660254;`
- each agent's hue, from the glow in its chest — [L965](../../source/src/agents-concept.jsx#L965) `const ORB_C = { orin: "#8ea2f2", riley: "#7fd0a3", calvin: "#e7949f", marco: "#f2a0cc", fi`
- the same hues on a light ground: just deep enough to read, still soft — [L966](../../source/src/agents-concept.jsx#L966) `const ORB_L = { orin: "#6f86e6", riley: "#5fbf8a", calvin: "#d97786", marco: "#ea86bd", fi`
- the walkway the crew stands on, in board units: along the row (t), its depth around the agents' row (s), and how high it sits — [L969](../../source/src/agents-concept.jsx#L969) `const DECK = { t0: -14, t1: 14, s0: -0.75, s1: 0.75, z: 0.16 };`
- the number each lane's work moves, straight from the Company health heatmap (row index into LANES[i][3], short name) — [L974](../../source/src/agents-concept.jsx#L974) `const LANE_KPI = [[0, "Booked ARR"], [0, "Booked ARR"], [0, "New ARR"], [2, "TTV: 10 hando`
- a team's standing in words: "23% of pace", "93% of target", "5.9d over" — [L976](../../source/src/agents-concept.jsx#L976) `const laneSaid = (li) => { const row = HLANES[li][3][LANE_KPI[li][0]], ref = row[4].split(`
- a lane's number as a progress bar, in the same language as Home's goals and the heatmap: value, where it stands, how full, and the pace mark where there is one. All of it from Company health. — [L980](../../source/src/agents-concept.jsx#L980) `const GOAL_C = { dark: { on: "#7cc4c9", behind: "#b4a1ff", off: "#ff8a7a", none: "rgba(233`
- the ticks from Home's Booked ARR chart, small: filled ticks are what's done, the grey run is the shortfall to pace, the pace tick is marked, the rest of the target is an outline — [L983](../../source/src/agents-concept.jsx#L983) `const NT = 56;`
- drawn in SVG so they take the same grain as Home's charts. Each tick is thin, with air between, like the Booked ARR ticks — [L985](../../source/src/agents-concept.jsx#L985) `const TK_SWEEP = 0.45; // s from the first tick to the last`
- s from the first tick to the last — [L985](../../source/src/agents-concept.jsx#L985) `const TK_SWEEP = 0.45; // s from the first tick to the last`
- one quick sweep, left to right, the whole row at once (filled and empty alike), done in about half a second however many ticks there are; nothing sits there before its turn — [L993](../../source/src/agents-concept.jsx#L993) `const d = 0.05 + (i / n) * TK_SWEEP, tr = { duration: 0.3, ease: [0.16, 1, 0.3, 1], delay:`
- an agent's day as ticks, one per job: done in its colour, running half-lit, still to come as an outline — [L1004](../../source/src/agents-concept.jsx#L1004) `function AgentTicks({ id, mine }) { // the same 30 ticks as the lanes: share done in its c`
- say a number the way its source says it: money in K or M, everything else in the source's own unit and decimals — [L1017](../../source/src/agents-concept.jsx#L1017) `const unitOf = (like) => { const m = String(like).match(/([KMB])\b/); return m ? { K: 1e3,`
- is lower better for this row? A ceiling always; otherwise when it's under its mark and still scored at or above 100% — [L1023](../../source/src/agents-concept.jsx#L1023) `const lowerOf = (row) => { const k = kindOf(row), v = numOf(row[1]), r = numOf(row[4]); re`
- the number a job is about: a Company health row in its lane whose words all appear in the job's title; else the lane's main one — [L1026](../../source/src/agents-concept.jsx#L1026) `const toks = (t) => t.toLowerCase().replace(/[–—:+,()%$]/g, " ").replace(/-/g, " ").split(`
- the target sits at a fixed spot (three-quarters along); the value is a lit run ending where it lands against it — [L1047](../../source/src/agents-concept.jsx#L1047) `function LevelTicks({ val, tgt, col, pct }) {`
- the ceiling sits at 60%: ticks up to it are the allowance (neutral), past it the overage in the off colour — [L1052](../../source/src/agents-concept.jsx#L1052) `function CeilTicks({ val, ceil, col }) {`
- running total, no history: the big number, then the ticks at full height (one tick a slice of the month's target), pace called out over its tick with a dot, $0 and the target under the ends. Same chart as the chat's Booked ARR card — [L1152](../../source/src/agents-concept.jsx#L1152) `const tgtV = mark ? fmtAs(refV, ref / mark) : null;`
- the running-total ticks, sized to be read at a glance: ~55 ticks, 96px tall. done/pace are shares of the target — [L1156](../../source/src/agents-concept.jsx#L1156) `export function BigTicks({ big, col, done, pace, paceL, left, right, w = 600, h = 96 }) {`
- fit to the board: scale from the width (all seven lanes always show) and the height; the rest goes to depth — [L1171](../../source/src/agents-concept.jsx#L1171) `function useGeo(W, H) {`
- the crew stand on the walkway at yOrb, whole (3.4u tall, plus their busy bubble): the room above them is kept for that — [L1174](../../source/src/agents-concept.jsx#L1174) `const fig = 3.4 * u + 22, rest = 2.6 * u + 1.25 * u + 62, gap = clampN(Math.min(H * 0.36, `
- a polyline's length and the point at a distance along it (screen space) — [L1192](../../source/src/agents-concept.jsx#L1192) `const plen = (r) => { let L = 0; for (let i = 1; i < r.length; i++) L += Math.hypot(r[i][0`
- what travels takes a shape per job, so two jobs on one line read as two different things a typed ask finds its agent and lane as you type: a name wins, then what it's about — [L1198](../../source/src/agents-concept.jsx#L1198) `const LANE_KW = [[3, /onboard|activation|ttv|time to (first|value)|integration|handoff/], `
- "let them decide": everyone the ask is about (named agents win; otherwise the lane's agent and any whose work it touches) — [L1208](../../source/src/agents-concept.jsx#L1208) `function crewOf(t) {`
- who else is on a job: the agents with steps in its project — [L1217](../../source/src/agents-concept.jsx#L1217) `const helpersOf = (j, ps) => { const p = j.deep && ps.find((q) => q.id === j.deep); return`
- what agents said to each other today, from the work itself — [L1220](../../source/src/agents-concept.jsx#L1220) `const COMMS0 = [`
- a report being put together: the page itself, writing as the agent works. Its paragraphs are the agent's findings (its thinking), the one it's on types in, the rest are still blank lines; the lane's number sits in it as a chart. a job that makes images: the set fills in as the agent works, one tile at a time; blank tiles are the ones still to come. Example content (the prototype has no image job): three reminder visuals, drawn in North's own type and colours. — [L1230](../../source/src/agents-concept.jsx#L1230) `const IMG = [`
- what an agent has on the go, as small previews of the things themselves: reports as pages, image jobs as tiles — [L1263](../../source/src/agents-concept.jsx#L1263) `function MadeStrip({ jobs, onOpen }) {`
- work the gap calls for, per lane: what the agents would pick up to close it (titles only, no numbers made up) — [L1288](../../source/src/agents-concept.jsx#L1288) `const GAP_JOBS = {`
- a third entry is what the job finds, in the prototype's own numbers; a job with nothing in the data to find says so plainly — [L1290](../../source/src/agents-concept.jsx#L1290) `Inbound: [["Find which webinar leads no-show and why", "marco", ["Splitting no-shows by le`
- what would close a lane's gap: just the work. Click one to start it; who picks it up shows on the board afterwards. — [L1300](../../source/src/agents-concept.jsx#L1300) `const gapThink = (t) => { for (const L of Object.values(GAP_JOBS)) { const x = L.find((y) `
- walk in, ask, leave: a quick brief from the bar "Orin, give me a breakdown", "what has Caleb got today", "catch me up". Answered from the jobs themselves (so every number is real), as a short sentence and the few jobs that matter, right above the bar. Esc or click away and it's gone. — [L1340](../../source/src/agents-concept.jsx#L1340) `const isAsk = (t) => { const x = t.trim().replace(/^(hey|ok|okay|so)\b[,\s]*/i, "").replac`
- each answer is said by someone: the agent you named, or Orin for everything else. The words come from the jobs (so every number is real); the model only puts them in the speaker's voice. Without the model, the same facts in a written voice. — [L1349](../../source/src/agents-concept.jsx#L1349) `const n2w = (n) => (["no", "one", "two", "three", "four", "five", "six", "seven", "eight",`
- a task said in a sentence: "Write the Monday sync doc" becomes "writing the Monday sync doc" — [L1351](../../source/src/agents-concept.jsx#L1351) `const ING = { Approve: "approving", Write: "writing", Start: "starting", Find: "finding", `
- the numbers: each lane's first three, as they stand — [L1388](../../source/src/agents-concept.jsx#L1388) `const nums = lanes.map((li) => [0, 1, 2].map((r) => KPI(li, r)).map(([k, v, p]) => '${k} $`
- a reply that isn't a question ("go ahead", "do that first", "thanks"): the speaker answers it in their own words — [L1414](../../source/src/agents-concept.jsx#L1414) `function replyOf(q, ag, last) {`
- saying yes to a decision in the chat is the same as pressing its button — [L1419](../../source/src/agents-concept.jsx#L1419) `if (top.st === "need") { const n = NEEDS.find((x) => x.id === top.need);`
- one line at the foot of the board: say what you want and they work out who takes it. Type @ to hand it to someone yourself (@Orin, @Riley, @Calvin); tap the mic to say it instead. — [L1452](../../source/src/agents-concept.jsx#L1452) `function useVoice(onText, onEnd) {`
- nothing heard (or the view blocks the mic): fall back to the example — [L1464](../../source/src/agents-concept.jsx#L1464) `setTimeout(fb, 2500); // nothing heard (or the view blocks the mic): fall back to the exam`
- the board's columns. Leadership's floor is the seven lanes. A seat's own floor ("For me") is what that person is measured on: their lane's numbers, a building each, with any of their work that sits in another lane at the end, under that lane's own name. — [L1528](../../source/src/agents-concept.jsx#L1528) `const saidOf = (row) => { const ref = row[4].split(" ")[0]; return /%$/.test(row[3]) ? '${`
- where a column stands: centred, with a step of air before any lane that isn't yours — [L1541](../../source/src/agents-concept.jsx#L1541) `const colT = (i, COL) => { const n = COL.n.length, gap = COL.M != null && COL.M < n ? 1.6 `
- working or idle, as each one is (or as the dial forces it, to compare the two) — [L1557](../../source/src/agents-concept.jsx#L1557) `const crewEl = useMemo(() => Object.fromEntries(IDS.map((id) => [id, { current: null }])),`
- at company scale a building can't be one floor per job: each floor stands for a few, and the dashed line scales the same way — [L1563](../../source/src/agents-concept.jsx#L1563) `const unit = Math.max(1, Math.ceil(Math.max(...laneAll.map((L) => L.length)) / 9));`
- effort against the gap: how far each team is from its number, and how much work is on it. The dashed line on a building is the work its gap calls for, if the work in hand were shared out in proportion to how far each team is behind. — [L1567](../../source/src/agents-concept.jsx#L1567) `const gapW = COL.n.map((_, li) => { const row = COL.row(li), k = kindOf(row), v = numOf(ro`
- one line per agent–lane pair with live work on it: down from the orb, across on that agent's band, down into the roof — [L1576](../../source/src/agents-concept.jsx#L1576) `const yLab = yOrb + u * 0.65, yTop = yBase - (0.08 + Math.max(6, Math.max(...lanes.map((L)`
- an idle agent has walked off its station: no line — [L1585](../../source/src/agents-concept.jsx#L1585) `const rails = pairs.filter((p) => crewWork(p.ag)).map((p) => { const r = route(p.ag, p.lan`
- hover a floor: its preview; move into the card and it stays while you write to the agent — [L1587](../../source/src/agents-concept.jsx#L1587) `const lockP = useRef(false), hold = useRef(null);`
- moving toward an open preview shouldn't swap it for the floor you cross on the way. While the cursor is heading into the card (inside the triangle from where it was a moment ago to the card's near edge), other floors wait; if you stop on one, or the cursor turns away, that floor takes over. — [L1591](../../source/src/agents-concept.jsx#L1591) `const trail = useRef([]), hfRef = useRef(null), pend = useRef(null); hfRef.current = hf;`
- stopped: you meant the floor you're on — [L1597](../../source/src/agents-concept.jsx#L1597) `if (performance.now() - T[T.length - 1][2] > 120) return false; // stopped: you meant the `
- the card's field took focus but nothing's written: moving to another floor lets the card go (it used to stay pinned to the old job) — [L1605](../../source/src/agents-concept.jsx#L1605) `if (lockP.current && hfRef.current !== id) { const inp = document.querySelector(".pk .pk-i`
- a job that starts (picked up from the queue, or one you just added) rides its line down as a tag — [L1611](../../source/src/agents-concept.jsx#L1611) `const seen = useRef(null);`
- only a hover on the board opens a preview on the board — [L1649](../../source/src/agents-concept.jsx#L1649) `const fid = hf || peek, fj = hf && jobs.find((j) => j.id === hf); // only a hover on the b`
- the floor grid: half-size isometric squares, so it reads as fine paper under the work rather than tiles — [L1651](../../source/src/agents-concept.jsx#L1651) `const grid = [], GS = 0.5; for (let i = -14; i <= 26; i += GS) grid.push(<polyline key={"g`
- the walkway the crew stands on: one raised plank across the board, seams every stride — [L1660](../../source/src/agents-concept.jsx#L1660) `{(() => { const q = (t, s0, z) => S(t, S_AG + s0, z).map((v) => v.toFixed(1)).join(","), {`
- the agents, as their orbs; hover one for what it's doing, click to open it — [L1689](../../source/src/agents-concept.jsx#L1689) `{IDS.map((id, k) => { const q = S(PADS[id], S_AG, DECK.z), on = !focus || focus === id, wo`
- standing on the walkway, as a puppet (puppet.jsx). Working: back at its station doing its working gestures (the line runs from its feet), its coat's light pulses. Idle: it wanders along the walkway at its own pace and its line is gone. No name: hover says who — [L1692](../../source/src/agents-concept.jsx#L1692) `const bh = Math.round(u * 3.4), bw = Math.round(bh * 0.45), roam = Math.round(u * 1.3 * 30`
- the lanes: name, the number the work is moving, how much is on it — [L1698](../../source/src/agents-concept.jsx#L1698) `{COL.n.map((n, li) => { const q = S(TT(li), S_BLD + 2.3), k = kpiRow(COL.row(li)), js = la`
- the label wins over any job card — [L1700](../../source/src/agents-concept.jsx#L1700) `onPointerEnter={(e) => { enterL(li); clearTimeout(solT.current); clearTimeout(hold.current`
- a lane that's behind: its pace is the button. Point at it and it says what it does — [L1705](../../source/src/agents-concept.jsx#L1705) `return short[li] > 1 && !calm`
- the job you have open (or are pointing at) is marked where it lives: its floor lights and a leader rises to its name — [L1715](../../source/src/agents-concept.jsx#L1715) `<AnimatePresence>{peek && !hf && (() => { const j = jobs.find((x) => x.id === peek); if (!`
- a decision waiting on you marks its building — [L1720](../../source/src/agents-concept.jsx#L1720) `{COL.n.map((_, li) => { const nj = lanes[li].find((j) => j.st === "need" && vis(j)); if (!`
- hovering a floor: what it is, a look at it, and a place to say something about it — [L1723](../../source/src/agents-concept.jsx#L1723) `{/* the card sits beside the building, level with the floor, so moving up and down the flo`
- the card sits beside the building, level with the floor, so moving up and down the floors never hides the next one — [L1724](../../source/src/agents-concept.jsx#L1724) `<AnimatePresence>{fj && fill == null && openKey !== 'job-${fj.id}' && (() => { const fc = `
- the side: one column that follows what you're looking at Home → an agent → one of its jobs, each a step deeper in the same place. Hover an orb to peek at that agent, move into the column to stay. Talk to any agent from here: it answers from what it's actually doing, and the jobs it mentions light on the board. — [L1736](../../source/src/agents-concept.jsx#L1736) `const thoughtNow = (j) => { const th = j.think || []; return th.length ? th[Math.min(th.le`
- where a job is, honestly: the step it's on out of the steps it has (no made-up percentages) — [L1739](../../source/src/agents-concept.jsx#L1739) `const stepOf = (j) => { if (j.stepN) return [Math.min(j.stepK, j.stepN), j.stepN]; const n`
- when Claude can't be reached, the agent still answers, from the same data — [L1743](../../source/src/agents-concept.jsx#L1743) `function localReply(ag, jobs, q) {`
- the field in a job's view and an agent's card. "@" lists the crew, same as the chat: bring someone into what you're talking about — [L1789](../../source/src/agents-concept.jsx#L1789) `function Composer({ ag, ph, onSend, asks }) {`
- the rest stays folded: a row of quiet tabs, one opens at a time, so opening something never lands you in a wall of text — [L1818](../../source/src/agents-concept.jsx#L1818) `function Reveal({ tabs, open: o0 = null }) {`
- opening anything: like a key metric opening on Home. The box grows from the thing you clicked to its open size and clips its content, which is laid out at the open width from the start, so nothing stretches; then the content settles in, top down. — [L1833](../../source/src/agents-concept.jsx#L1833) `const OPEN_E = [0.32, 0.72, 0, 1];`
- closing collapses into the thing itself, wherever it sits now (the job's floor on the board, its row in the list), measured as it closes; with nothing to go back to it folds up and away as before — [L1837](../../source/src/agents-concept.jsx#L1837) `const FOLD = { clipPath: "inset(0% 0% 100% 0% round 10px)", opacity: 0, transition: { dura`
- on close the content goes first, quickly, then the box collapses into where the job lives — [L1844](../../source/src/agents-concept.jsx#L1844) `<motion.div className="cd-in" style={{ width, maxHeight: maxH }} exit={{ opacity: 0, trans`
- the day's count: only the digits that change move. Each one dissolves into its next value in place (a soft blur crossfade with a touch of scale), so 13 to 14 leaves the 1 untouched and turns the 3 into a 4. — [L1852](../../source/src/agents-concept.jsx#L1852) `function Roll({ n }) {`
- the left rail: the one number, what needs you, the crew with how far through today they are the decisions waiting on you, as a deck. One sits at the front with the rest just behind it; hover the front one and it opens in place with the call to make, click it and it becomes the whole column. Scroll, or the pager, to sift the deck. — [L1869](../../source/src/agents-concept.jsx#L1869) `function NeedStack({ needs, onOpenRail, onApprove, onPass }) {`
- the rail is a surface like the board: hover an agent and its row slides open with what it's doing; click and the row becomes the whole column (an agent, then any of its jobs, in the same place). Nothing opens anywhere else from here. — [L1898](../../source/src/agents-concept.jsx#L1898) `function Rail({ jobs, scope, hl, panel, setPanel, onRailAg, light, D, ps, setPs, threads, `
- the anchor: one big number, the jobs. It answers to the tabs (me / company / a person), never to hovering the board. — [L1914](../../source/src/agents-concept.jsx#L1914) `const runN = inScope.filter((j) => !j.arch && j.st === "run").length;`
- the anchor: the gap as one big number, rolling as you hover lanes or pick a person — [L1924](../../source/src/agents-concept.jsx#L1924) `<div className="rl3-big"><Roll n={lead.n} /></div>`
- what's waiting on you comes first, and is called out: it's the only thing here that stops work — [L1927](../../source/src/agents-concept.jsx#L1927) `{needs.length > 0 && <section className="rl3-sec rl3-needs"><h6 className="is-need">{needs`
- the list: the company's numbers, worst first, with the work on each Reads like a statement. Each lane is one line: its number, where it stands, the ticks. Under it, one quiet line per job. Hover a job and it opens a little in place (what it's on now, the gap it's closing); click and it grows into the full card. — [L1976](../../source/src/agents-concept.jsx#L1976) `const NEED_I = <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle `
- the list, back to its first shape: grouped by what each job needs from you, one quiet line per job. Two dropdowns narrow it (team, status) so it stays calm however many jobs there are. Hover a job and it opens in place: what the job is, and who it's for. One type size throughout; weight and colour carry the hierarchy. Every divider runs the full width. find a person: what the agents are running for them (the lanes they own). Picking one scopes the rail, board and list to them. — [L1982](../../source/src/agents-concept.jsx#L1982) `function PersonSeg({ jobs, scope, setScope }) {`
- a few jobs read best by status; a company's worth reads best by team, each team under its number — [L2025](../../source/src/agents-concept.jsx#L2025) `const mode = by || (inScope.length > 40 ? "team" : "status");`
- filtering: the old list eases out, then the new one arrives row by row, top to bottom (each row's delay is its place) — [L2046](../../source/src/agents-concept.jsx#L2046) `<motion.div key={'${fLane}-${fAg}-${fSt}-${mode}-${scope}'} className="lv2-stg" initial={{`
- a job, opened: the card the preview grew into. What it is and where it stands; the thing itself; the rest folded a job as a receipt: the number it's about, set out as line items (all from Company health; the gap and the month's target are worked out from the same row), where it stands now, what's been done so far, and the particulars. — [L2081](../../source/src/agents-concept.jsx#L2081) `const NUM = /^([^0-9−-]*)([0-9][0-9,]*\.?[0-9]*)(.*)$/;`
- what each job is, in a sentence anyone in the room would follow (written from the job and the prototype's own numbers) — [L2086](../../source/src/agents-concept.jsx#L2086) `const BRIEF = {`
- how a number is said out loud in a sentence — [L2115](../../source/src/agents-concept.jsx#L2115) `const SAY = { "Booked ARR – Outbound": "Outbound’s Booked ARR", "Booked ARR – Inbound": "I`
- what each kind of job gives you back. Moving a number: what it's worth. Finding something out: the answer and what to do next. Making something: that it's ready, and for whom. (Written for the prototype from Company health's numbers.) — [L2129](../../source/src/agents-concept.jsx#L2129) `const jobKind = (j) => (j.st === "need" && !NEEDS.find((x) => x.id === j.need)?.propose ? `
- how work leads to work: a finding sets off the next job (one quiet line, only where a job has a link) — [L2138](../../source/src/agents-concept.jsx#L2138) `const LEADS = [["Find why held demos aren’t closing", "Review the last 20 lost demos"], ["`
- where a number comes from: any figure in a finding that matches a Company health row can be tapped to see that row — [L2142](../../source/src/agents-concept.jsx#L2142) `function srcOf(tok) { for (let li = 0; li < HLANES.length; li++) for (const r of HLANES[li`
- a job, opened. The same shape for every job: what it is and who it's for, then the work (the thing being made, the steps or what was found), then why it matters with the right chart for that number. One body size, one label size. — [L2153](../../source/src/agents-concept.jsx#L2153) `function Hand({ j, icon = false }) {`
- a job's state in a few words: shown once, at the top of its card — [L2171](../../source/src/agents-concept.jsx#L2171) `const statusOf = (j) => { const a = AG[j.ag], need = j.st === "need" && NEEDS.find((x) => `
- the chart is evidence: it sits with what was found (or what happened); until there's a finding it shows the gap the job is closing Outbound's booked ARR has its daily history, so its work shows the days (the drop at Oct 14 is the story) rather than a pace bar — [L2180](../../source/src/agents-concept.jsx#L2180) `const outbound = LANE_N[j.lane] === "Outbound" && /booked arr/i.test(rowOf(j).name || "");`
- a finding that only restates the headline number is already in the chart and in why it matters, so it's left out — [L2183](../../source/src/agents-concept.jsx#L2183) `const hr = rowOf(j).row, found = th.filter((t) => !(t.includes(hr[1]) && t.includes(hr[4].`
- where it came from (the job it builds on) sits under the description; what it leads to sits beside the button you'd press — [L2192](../../source/src/agents-concept.jsx#L2192) `const cameJ = came && (jobs.find((y) => y.t === came && !y.arch) || jobs.find((y) => y.t =`
- called as a function below, so it never remounts — [L2194](../../source/src/agents-concept.jsx#L2194) `const Sec = ({ k: label, children }) => <div className="rc-sec">{label && <span className=`
- one block: title (above), what it is, where it came from, the chart and what it shows. Then a divider and the next step, if any. — [L2196](../../source/src/agents-concept.jsx#L2196) `const descR = done && (j.revised || (!answer && !brief)) && deliveryOf(j).result ? deliver`
- the chart first, then everything it shows, together: what was found, why it matters, anything else that came out — [L2205](../../source/src/agents-concept.jsx#L2205) `<div className="rc-viz">{viz}</div>`
- Outbound's day-by-day bookings, drawn as the chat's own trend chart (TrendPlot in chat.jsx): one series of thin spikes in the purple ramp, with grain, and the moment that explains it marked by a coral line and a flag. One chart, one colour; the flag carries the story. Data: the Outbound card's daily series (Oct 1 to today). — [L2240](../../source/src/agents-concept.jsx#L2240) `const DRAWN = new Set(); // a chart draws in the first time you see it; after that it's si`
- a chart draws in the first time you see it; after that it's simply there — [L2240](../../source/src/agents-concept.jsx#L2240) `const DRAWN = new Set(); // a chart draws in the first time you see it; after that it's si`
- spikes sit tight, four to a day, stepping evenly between each day's value (no added noise); solid colour with grain — [L2244](../../source/src/agents-concept.jsx#L2244) `const box = useRef(null), W = useW(box), S = OUTBOUND_CARD.series, days = S.length, PER = `
- a job's work, as the top of its own conversation window: who, where it stands, the chart, and what came out. The window is the job; this is what you're talking about, right above where you talk about it what a job found, in the order the card shows it under its chart: the finding, why it matters, anything else that came out. The card and the job's window both use this, so the window never shows less than the card — [L2265](../../source/src/agents-concept.jsx#L2265) `function findingsOf(j) {`
- the menu closes when you click anywhere else — [L2298](../../source/src/agents-concept.jsx#L2298) `useEffect(() => { if (!menu) return; const f = (e) => { if (!e.target.closest(".cd-menu") `
- finished work needs no status line (the result says it); anything still moving says where it stands — [L2319](../../source/src/agents-concept.jsx#L2319) `{j.st !== "done" || j.approved ? <span className={'cd-state is-${j.approved ? "done" : j.s`
- what you asked about this work while it was open beside the chat, built on underneath it — [L2337](../../source/src/agents-concept.jsx#L2337) `{!read && added && added.length > 0 && <div className="cd-adds">{added.map((x) => <section`
- an agent, opened: what it's on, a way to talk to it; the rest folded — [L2361](../../source/src/agents-concept.jsx#L2361) `function AgentCard({ id, D, jobs, scope, thread, send, comms, onOpen, onClose, setPeek, li`
- one list of what this agent is on: its own jobs and the ones it's helping with, the shared ones marked with who else is on them — [L2365](../../source/src/agents-concept.jsx#L2365) `const working = live.filter((j) => j.st === "run" && (j.ag === id || (j.with || []).includ`
- a row says the job and where it is; hover opens the one line that matters (what's happening, or what was found) — [L2371](../../source/src/agents-concept.jsx#L2371) `const Row = (j, sub) => { const o = others(j), open = hv === j.id;`
- hovering an orb: the agent, small, with what it's doing right now — [L2407](../../source/src/agents-concept.jsx#L2407) `function AgentPeek({ id, x, y, jobs, inScope, D }) {`
- a new job: say what, pick who and where. It starts at once, so its line draws in. — [L2419](../../source/src/agents-concept.jsx#L2419) `const AG_LANE = { orin: 1, riley: 1, calvin: 4, marco: 0, fia: 1 };`
- inside North the board wears North's light ground (one product); standalone it's dark. Presenting goes dark either way — [L2437](../../source/src/agents-concept.jsx#L2437) `const [theme, setTheme] = useState(embedded ? "light" : "dark"), dark = theme === "dark" |`
- switching seats starts the page over on that person's own work — [L2441](../../source/src/agents-concept.jsx#L2441) `const seatWho = useWho(), seatFirst = useRef(true);`
- what's open: one card over the board, grown from what you hovered. { k: "job" \| "agent", id, from?, src } — [L2444](../../source/src/agents-concept.jsx#L2444) `const [open, setOpen] = useState(null), [hoverAg, setHoverAgRaw] = useState(null), [peek, `
- a card opens where you were looking: it grows out of the preview you hovered, on the spot, toward the open side — [L2452](../../source/src/agents-concept.jsx#L2452) `const lastDown = useRef(null);`
- an agent opens in the side panel (the slot work uses), never as a modal over the board: the board stays live beside it — [L2462](../../source/src/agents-concept.jsx#L2462) `const openAgent = (id) => { setHoverAgRaw(null); setOpen(null); setPanelRaw((p) => (p?.k =`
- where a card opens: from the preview's box to the open box, growing toward the open side — [L2464](../../source/src/agents-concept.jsx#L2464) `const geomOf = (at, k) => { const st = document.querySelector(".v8-stage"), SW = st?.clien`
- talking to an agent (or steering one job): your line lands at once, the agent's answer follows — [L2473](../../source/src/agents-concept.jsx#L2473) `const sm = useSample(), [threads, setThreads] = useState({}), live = useRef(jobs); live.cu`
- anyone else you name (@Riley, "and Calvin") joins this thread: the one you're talking to answers first, then each of them — [L2480](../../source/src/agents-concept.jsx#L2480) `const also = IDS.filter((x) => x !== ag && new RegExp('(^|[^\\w])@?${x}\\b', "i").test(q))`
- agents hand work to each other when one's work goes into another's (kept in each agent's card under Handoffs) — [L2493](../../source/src/agents-concept.jsx#L2493) `const [comms, setComms] = useState(COMMS0), actRef = useRef(null);`
- the board stays mounted under the list, so its work keeps flowing while you're away and is still flowing when you come back — [L2541](../../source/src/agents-concept.jsx#L2541) `<motion.div className={'v8-main${view === "board" ? "" : " is-away"}'} initial={false} ani`
- follow-ups stay with whoever you're talking to — [L2549](../../source/src/agents-concept.jsx#L2549) `if (lastA && !named && b.ag === "orin" && lastA.who !== "orin") b = { ...b, ag: lastA.who `
- page one run of the prototype; starting over remounts it, so every job, project and conversation is back to the beginning — [L2663](../../source/src/agents-concept.jsx#L2663) `function Session({ D, onRestart, calm, onCalm, embedded, onAskNorth, bar }) {`
- pair: the card sits on the left with its thread beside it (where the chat puts it), no scrim, so both stay usable — [L2695](../../source/src/agents-concept.jsx#L2695) `const W = pair && at ? at.width : Math.min(600, innerWidth - 48), L = pair && at ? Math.ro`
- .pg: the card reads as it does on the Agents page, wherever it opens — [L2700](../../source/src/agents-concept.jsx#L2700) `<div className="stg2 v7 is-light jm-stage pg">{/* .pg: the card reads as it does on the Ag`
- presenting starts from the beginning, so the demo is the same every time, then holds still — [L2723](../../source/src/agents-concept.jsx#L2723) `const [calm, setCalm] = useState(false);`
- the dials stay hidden on load and in shared links; D shows them for this session — [L2727](../../source/src/agents-concept.jsx#L2727) `const [dials, setDials] = useState(false);`

## agents-log.jsx

- North · Agents — "the log" concept. Agents' work drawn in Fia's own chart language: every action an agent takes is a piano-key tick on a live time track. The newest key rises at "now". Steps are labelled stretches of the track; what it made for you is a coral pace dot. Decisions come first (Needs you); the details live in the job view. — [L5](../../source/src/agents-log.jsx#L5) `import React, { useEffect, useLayoutEffect, useRef, useState } from "react";`
- data (numbers from the prototype's own data) — [L30](../../source/src/agents-log.jsx#L30) `const AG = {`
- projects can span agents: the Monday sync is Fia's, and Orin and Felix each do a part of it — [L36](../../source/src/agents-log.jsx#L36) `const PROJ = {`
- each agent's sequence of steps (past, current, planned). help = the agent whose project this step is for — [L42](../../source/src/agents-log.jsx#L42) `const S = (l, p, a, help) => ({ l, p, a, help });`
- the job each agent finished just before (it shows at the left edge of its lane, already quiet) — [L64](../../source/src/agents-log.jsx#L64) `const PREV = { fia: S("Inbound recap", "prev", ["Read HubSpot · Inbound lane", "Wrote the `
- the day so far (example figures; they tick up as the agents work) — [L67](../../source/src/agents-log.jsx#L67) `const TODAY = { jobs: 6, records: 1284, drafts: 4 };`
- Orin's Outbound review, the job opened in the details view. Copy, numbers and series are the prototype's. — [L70](../../source/src/agents-log.jsx#L70) `const OUTBOUND_CARD = {`
- where each agent's earlier steps began, so handoffs land at different moments — [L126](../../source/src/agents-log.jsx#L126) `const lead = { fia: 0.95, orin: 0.62, felix: 0.86 }[id]; // where each agent's earlier ste`
- the job before this one, already done — [L128](../../source/src/agents-log.jsx#L128) `const prev = PREV[id]; marks.unshift({ t: t0 - span * 1.02, i: -1, label: prev.l }); // th`
- the agent answers and puts the change into its plan, right after what it's doing now — [L200](../../source/src/agents-log.jsx#L200) `setTimeout(() => setSim((S0) => { const x = S0[id], seq = [...x.seq]; seq.splice(x.cur + 1`
- handoffs: when a step done for another agent's project finishes, a hairline carries it to that agent's lane — [L272](../../source/src/agents-log.jsx#L272) `function Handoffs({ sim, now, D, rects, proj, dark }) {`

## agents-horizon.jsx

- North · Agents — "the horizon" concept. The page's stage is North's own mark made into a place: the horizon is now. Above it, raw signals stream down the rays from the sources each agent is reading (scattered, jittery: unprocessed). Each agent is a sun on the horizon, labelled with exactly what it's doing. Below it, the same work leaves as structured output (even, aligned dashes) toward what it's making for you. When something lands, it drops out of the stage into "Needs you". — [L6](../../source/src/agents-horizon.jsx#L6) `import React, { useEffect, useMemo, useRef, useState } from "react";`
- agent colours, tuned for each stage (the same hue family as their orbs) — [L29](../../source/src/agents-horizon.jsx#L29) `const COL = {`
- where the data comes from. Shared sources sit between the agents that read them (Plan feeds Fia and Orin; Account health feeds Orin and Felix) — [L51](../../source/src/agents-horizon.jsx#L51) `const SOURCES = { outbound: ["Outbound lane", 0.09, 1], pace: ["Pace", 0.22, 0], plan: ["P`
- where each agent is when the page opens — [L53](../../source/src/agents-horizon.jsx#L53) `const START = { fia: 1, orin: 0, felix: 1 }; // where each agent is when the page opens`
- the stage (canvas for light, DOM for words) — [L56](../../source/src/agents-horizon.jsx#L56) `function Stage({ D, state, hover, setHover }) {`
- horizon, where sources sit, where outputs sit — [L59](../../source/src/agents-horizon.jsx#L59) `const H = 470, HZ = 292, TOP = 58, BOT = 418; // horizon, where sources sit, where outputs`
- rays: a fan from the sun up to the top of the stage (the North mark, opened up) — [L78](../../source/src/agents-horizon.jsx#L78) `const n = D.rays;`
- below: the same fan, mirrored and quieter (what it's making) — [L87](../../source/src/agents-horizon.jsx#L87) `for (let r = 0; r < n; r += 2) {`
- source lines: brighter, from each source tag down into the sun — [L93](../../source/src/agents-horizon.jsx#L93) `a.src.forEach((_, j) => { const sx = srcX(j); g.strokeStyle = night ? 'rgba(169,203,230,${`
- raw signals: scattered dots riding the source lines into the sun (only while it's working) — [L95](../../source/src/agents-horizon.jsx#L95) `acc[i] += dt * D.flow * a.src.length * (busy ? 1 : 0.08);`
- the scatter tightens as it nears the agent: noise becoming signal — [L101](../../source/src/agents-horizon.jsx#L101) `const sc = D.jitter * (1 - e); // the scatter tightens as it nears the agent: noise becomi`
- structured output: even dashes travelling down to what it's making — [L114](../../source/src/agents-horizon.jsx#L114) `dash[i] = (dash[i] + dt * D.outSpeed * (busy ? 1 : 0.15)) % 14;`
- the simulation: each agent advances a step every few seconds; finishing drops a card into "Needs you", then it picks up its next job after a beat — [L182](../../source/src/agents-horizon.jsx#L182) `const stRef = useRef(state); stRef.current = state;`

## crew.js

- the crew's faces: head busts cut from the character renders (transparent, neck on the bottom edge; 128px, shown at 12–40) — [L2](../../source/src/crew.js#L2) `export const FACES = {`
- the crew, whole: full-body cut-outs for the Agents page (transparent; 300px tall, feet on the bottom edge) — [L10](../../source/src/crew.js#L10) `export const BODIES = {`
- puppet rig: each character cut into head and coat (sprite px, figure 300 tall, feet on the bottom edge); legs and glossy shoes are drawn as vectors from hip (at the hem) to ankle, so feet plant, lift and step and stay crisp at any size. — [L21](../../source/src/crew.js#L21) `export const PUPPETS = {"orin": {"w": 113, "h": 300, "neck": [55.9, 116], "hem": 241, "hip`

## agents-concept.css


### page: the Fia page card's own ground, type and lines

- page: the Fia page card's own ground, type and lines — [L2](../../source/src/agents-concept.css#L2) `body { margin: 0; background: var(--paper); }`

### right now: the live log

- hover a key: what exactly it did — [L54](../../source/src/agents-concept.css#L54) `.lt { position: fixed; left: 0; translate: -50% 0; z-index: 50; pointer-events: none; disp`

### job view: the details

- fixes: the page's button reset must not win over these — [L102](../../source/src/agents-concept.css#L102) `.pg .nd-open, .pg .jv-back { font-size: 13px; font-weight: 500; }`

### v3: projects, handoffs, comments and plans on the log

- v3: projects, handoffs, comments and plans on the log · — [L110](../../source/src/agents-concept.css#L110) `.rn-h { align-items: center; }`
- the plan: right of now, every step is editable in place — [L131](../../source/src/agents-concept.css#L131) `.pl { display: flex; flex-direction: column; gap: 4px; padding: 0 20px 0 16px; min-width: `

### v4: the live log as a dark glass stage (the agents' world); decisions stay on paper (yours)

- v4: the live log as a dark glass stage (the agents' world); decisions stay on paper (yours) · — [L174](../../source/src/agents-concept.css#L174) `.rn.is-dark { position: relative; margin-top: 0; border: 0; border-radius: 18px; color: #e`
- a hairline of light along the top edge, like glass catching it — [L180](../../source/src/agents-concept.css#L180) `.rn.is-dark::after { content: ""; position: absolute; left: 24px; right: 24px; top: 0; hei`
- glass: comment composer, pinned threads, handoff labels, the key tooltip — [L204](../../source/src/agents-concept.css#L204) `.rn.is-dark .cmt, .rn.is-dark .pin-card, .lt.is-dark { background: rgba(22,31,42,.72); -we`

### v5: the tracker. Words first; motion reinforces them

- v5: the tracker. Words first; motion reinforces them · — [L220](../../source/src/agents-concept.css#L220) `.stg2 { --f1: var(--navy); --f2: var(--ink); --f3: var(--mute); --hl: var(--line); --cardb`
- tighter rows: the actions take the meta's place on hover instead of stacking under it — [L296](../../source/src/agents-concept.css#L296) `.sp-row { padding: 7px 0; }`
- who does a planned step: quiet text until you reach for it — [L305](../../source/src/agents-concept.css#L305) `.pg .sp-who { background: transparent; box-shadow: none; color: var(--f3); padding: 0 2px;`
- hover actions float as a small toolbar over the row's right edge, so they never take width from the words — [L313](../../source/src/agents-concept.css#L313) `.sp-acts { position: absolute; right: -6px; top: -14px; z-index: 6; gap: 2px; padding: 3px`

### v6: the world, and going into an agent

- v6: the world, and going into an agent · — [L323](../../source/src/agents-concept.css#L323) `.wd { position: relative; height: 520px; margin-top: 4px; }`
- the world, organised as one row per agent: what it reads → the agent thinking → what it's making — [L399](../../source/src/agents-concept.css#L399) `.wd { height: auto; padding-bottom: 34px; }`

### v7: the floor. Small type, hairlines, no cards; every job is one line

- v7: the floor. Small type, hairlines, no cards; every job is one line · — [L416](../../source/src/agents-concept.css#L416) `.stg2.v7 { padding: 20px 24px 22px; }`
- a job opened: a sheet over the floor — [L453](../../source/src/agents-concept.css#L453) `.v7 { min-height: 520px; }`

### v11: rail + board as one system; the sheet with hierarchy

- v11: rail + board as one system; the sheet with hierarchy · — [L577](../../source/src/agents-concept.css#L577) `.v8-body { display: grid; grid-template-columns: 236px minmax(0, 1fr); gap: 0; margin: 14p`

### v12: the workspace takes the whole window; a tighter type scale

- v12: the workspace takes the whole window; a tighter type scale · — [L660](../../source/src/agents-concept.css#L660) `body.is-ws { background: #0b0c0e; }`
- sheet: sits over the board, under the header, beside the rail — [L693](../../source/src/agents-concept.css#L693) `.pg.is-full .sh2 { top: calc(var(--hh) + 8px); left: calc(var(--rw) + 8px); right: 8px; bo`
- the sheet is pinned to the window and anchored right, so it reads at one width in either view — [L719](../../source/src/agents-concept.css#L719) `.pg.is-full .sh2 { position: fixed; top: calc(var(--hh) + 8px); bottom: 8px; right: 8px; l`

### v13: agents on top, live lines only, lanes carry their number

- v13: agents on top, live lines only, lanes carry their number · — [L730](../../source/src/agents-concept.css#L730) `.bd2.is-v3 .bd-rails path { fill: none; stroke-width: 1; stroke-linejoin: round; stroke-op`

### light glass: the same board on a soft ground, built from the orbs' own hues

- light glass: the same board on a soft ground, built from the orbs' own hues · — [L777](../../source/src/agents-concept.css#L777) `body.is-ws.is-ws-light { background: var(--paper, #fefbf9); }`
- the board as glass: translucent faces, navy hairlines — [L790](../../source/src/agents-concept.css#L790) `.is-light .bd2 .bd-grid polyline { stroke: rgba(9,53,85,.06); }`

### v14: one side column that follows you; real chat with the agents

- v14: one side column that follows you; real chat with the agents · — [L827](../../source/src/agents-concept.css#L827) `.pg.is-full .v8-body { grid-template-columns: 300px minmax(0, 1fr); transition: grid-templ`
- the need marker: a still dot, no pulse — [L882](../../source/src/agents-concept.css#L882) `.bd-need i::before { display: none; }`

### v15: previews you can answer, an ask line, agents talking, today's tally

- v15: previews you can answer, an ask line, agents talking, today's tally · — [L897](../../source/src/agents-concept.css#L897) `/* preview card */`
- side: tallies, the talk log, the crew — [L945](../../source/src/agents-concept.css#L945) `.sd-tally { display: grid; grid-template-columns: repeat(auto-fit, minmax(56px, 1fr)); gap`

### v16: one rail, cards that grow from what you hover, folded detail

- v16: one rail, cards that grow from what you hover, folded detail · — [L959](../../source/src/agents-concept.css#L959) `.pg.is-full .v8-body { grid-template-columns: 272px minmax(0, 1fr); }`
- goal bars: the lane's number, where it stands, how full, the pace mark — [L1036](../../source/src/agents-concept.css#L1036) `.gl { display: flex; flex-direction: column; gap: 6px; }`
- tick progress (the Booked ARR ticks, small) — [L1048](../../source/src/agents-concept.css#L1048) `.tk { display: flex; gap: 2px; height: 14px; }`
- v20: card dividers, report previews, the needs stack — [L1066](../../source/src/agents-concept.css#L1066) `.cd-body { gap: 0; padding: 0; }`
- v21: the rail as a surface: rows open in place; a click makes the row the whole column — [L1099](../../source/src/agents-concept.css#L1099) `.pg.is-full .v8-body.is-rail { grid-template-columns: 400px minmax(0, 1fr); }`
- v22: opening like a key metric; content settles in top down; full-width hairlines; a simpler readout — [L1123](../../source/src/agents-concept.css#L1123) `.cd { position: absolute; z-index: 21; display: block; overflow: hidden; }`
- hairlines run the full width of the card — [L1135](../../source/src/agents-concept.css#L1135) `.cd .cd-sec h6 { margin-bottom: 2px; }`
- v22.1: one divider between sections, always edge to edge. Inner rules inside the made thing go full width too; no rule doubles a section edge — [L1152](../../source/src/agents-concept.css#L1152) `.cd-made .doc-p, .cd-made .tk2-l li { margin: 0 -16px; padding-left: 16px; padding-right: `
- the progress line under a card's title is the card's top rule: full width, the fill shows how far along — [L1159](../../source/src/agents-concept.css#L1159) `.cd-bar { margin: 12px 0 0; }`
- the day's count: big, rolling, in a soft gradient drawn from the orbs — [L1165](../../source/src/agents-concept.css#L1165) `.rl3-read { padding-top: 8px; }`
- chat: your line sits right as one bubble that keeps its words together; the agent's line reads as prose — [L1175](../../source/src/agents-concept.css#L1175) `.sd-m.is-you > div { max-width: 78%; display: flex; justify-content: flex-end; }`
- where the open job lives on the board — [L1180](../../source/src/agents-concept.css#L1180) `.bd-here { position: absolute; z-index: 3; width: 0; pointer-events: none; display: flex; `
- v24: one scroll per column, never a scroll inside a scroll. Jobs open wide: the work on the left with room, the conversation on the right — [L1221](../../source/src/agents-concept.css#L1221) `.cd-in { height: 100%; }`
- images: never cropped. Focus view: one large, the set beside it — [L1246](../../source/src/agents-concept.css#L1246) `.im-t { aspect-ratio: 4 / 5; height: auto; }`
- receipt: the lead (what it found / where it's at) under the number; one slip holds the chart, the figures and the particulars — [L1304](../../source/src/agents-concept.css#L1304) `.rc .rc-big { margin-bottom: 2px; }`
- needs-you is red, not the salmon used for pace — [L1319](../../source/src/agents-concept.css#L1319) `.stg2 { --need: #c4142f; --need-rgb: 196,20,47; }`
- the job, explained: one body size, one label size, nothing else — [L1343](../../source/src/agents-concept.css#L1343) `.rc { gap: 0; padding: 22px 20px 28px !important; max-width: 600px; }`
- v28 — list filters, dividers between sections, one label size in the receipt — [L1359](../../source/src/agents-concept.css#L1359) `.lv { gap: 0; }`
- receipt: every subtitle sits under a full-width rule; labels are one size everywhere — [L1372](../../source/src/agents-concept.css#L1372) `.rc-sec { margin: 22px -20px 0; padding: 18px 20px 0; border-top: 1px solid var(--cardln);`
- v30 — the list, grouped by status, two dropdowns, one type size, full-width dividers — [L1396](../../source/src/agents-concept.css#L1396) `.v8-stage > .v8-main.is-list { overflow: auto; }`
- v31 — every modal in one shape: description + who it's for, then full-width sections, one body size, one label size — [L1429](../../source/src/agents-concept.css#L1429) `.cd-bar, .cd-st { display: none !important; }`
- the cards' body takes the whole column so the rules can run edge to edge — [L1450](../../source/src/agents-concept.css#L1450) `.cd.is-job .cd-body { padding: 0 !important; }`
- v32 — steps live inside "Working", closed by default; type a step smaller everywhere in the modals and list — [L1477](../../source/src/agents-concept.css#L1477) `.pg .rc-tag.is-btn { align-self: flex-start; gap: 7px; margin: -4px -8px; padding: 4px 8px`
- v33 — hover an agent on the left to message it; agents talking inside a shared job; the agent view leads with the work — [L1495](../../source/src/agents-concept.css#L1495) `.rl3-ag { cursor: pointer; }`
- the ask line: no routing row; @ picks who, the mic speaks it — [L1510](../../source/src/agents-concept.css#L1510) `.ask-at { display: flex; flex-direction: column; min-width: 220px; align-self: flex-start;`
- v35 — cards fill their box so the chat stays pinned; nothing shows twice; detail opens on demand — [L1522](../../source/src/agents-concept.css#L1522) `.cd > .cd-in { display: flex; flex-direction: column; height: 100%; min-height: 0; }`
- v37 — the board: effort against the gap; labels in the same type as everything else — [L1546](../../source/src/agents-concept.css#L1546) `.bd-wl { fill: none; stroke: var(--f3); stroke-width: 1; stroke-dasharray: 3 3; opacity: .`
- v38 — result lines, the trail, sources on tap — [L1560](../../source/src/agents-concept.css#L1560) `.rc .rc-p.rc-next { margin-top: 6px; color: var(--f1); } .rc-next span { color: var(--f3);`
- keyboard focus: a soft ring only for keyboard users, never for hover or selection — [L1573](../../source/src/agents-concept.css#L1573) `.pg button:focus-visible, .pg [role="button"]:focus-visible, .pg input:focus-visible { out`
- v39 — one radius scale: 6 for controls, 10 for rows, inputs and menus, 14 for windows — [L1579](../../source/src/agents-concept.css#L1579) `:root { --r1: 6px; --r2: 10px; --r3: 14px; }`
- dropdowns: one size, one weight; the value is the label — [L1585](../../source/src/agents-concept.css#L1585) `.pg .dd-b { gap: 6px; height: 28px; padding: 0 8px 0 10px; font-size: 12.5px; font-weight:`
- board team labels: name, standing and work on one line, the shortfall in red, the number on hover — [L1591](../../source/src/agents-concept.css#L1591) `.bd-lane { gap: 2px !important; }`
- tighter corners: windows 10, cards, rows, inputs and menus 8, controls 5 — [L1600](../../source/src/agents-concept.css#L1600) `:root { --r1: 5px; --r2: 8px; --r3: 10px; }`
- window header: one line, one baseline — back, or who's on it, then the controls — [L1605](../../source/src/agents-concept.css#L1605) `.cd-h { align-items: center !important; min-height: 28px; padding: 14px 12px 0 20px !impor`
- the stage never grows past the window: long lists scroll inside it, and windows size to it — [L1615](../../source/src/agents-concept.css#L1615) `.pg.is-full .v8-body { grid-template-rows: minmax(0, 1fr); }`
- v40 — the bar works in both views; a quick brief opens right above it — [L1623](../../source/src/agents-concept.css#L1623) `.ask-dock .ask { z-index: 8; }`
- list at scale: teams under their number, groups that cap themselves; the scale preview switch — [L1645](../../source/src/agents-concept.css#L1645) `.lv2-sp { flex: 1; }`
- no strokes on active or focused states, anywhere: focus shows as a soft fill on buttons, and inputs show only their caret — [L1657](../../source/src/agents-concept.css#L1657) `.pg button:focus-visible, .pg [role="button"]:focus-visible { box-shadow: none !important;`
- the quick answer is a conversation: your lines right, theirs left, newest at the bottom, the bar replies — [L1676](../../source/src/agents-concept.css#L1676) `.qb-th { display: flex; flex-direction: column; gap: 12px; max-height: min(56vh, 520px); o`

### finished work, handed back: the rail lists it; a finished job's receipt leads with what you do with it

- finished work, handed back: the rail lists it; a finished job's receipt leads with what you do with it — [L1690](../../source/src/agents-concept.css#L1690) `.rl3-ready { display: flex; flex-direction: column; }`
- the rail breathes: finished work as a short list with room between, agents as name + bars, smaller decision cards — [L1721](../../source/src/agents-concept.css#L1721) `.rl3-ready { gap: 4px !important; }`
- finished work, cleaned up: status and Share on one line, then the result, then one quiet line of context — [L1734](../../source/src/agents-concept.css#L1734) `.rc-row { display: flex; align-items: center; gap: 12px; min-height: 26px; }`
- light, delicate: the dark board's restraint on a neutral ground. Structure is gray, colour only where there's data, type in one quiet gray scale (no navy outlines, no cream) — [L1747](../../source/src/agents-concept.css#L1747) `.stg2.is-light { --f1: #2b2f34; --f2: rgba(43,47,52,.62); --f3: rgba(43,47,52,.42); --hl: `
- the lane labels say less: the name and how it's doing; the job count and "short" notes wait for hover — [L1762](../../source/src/agents-concept.css#L1762) `.is-light .bd-lane-n { color: var(--f2); }`
- light: the decision cards lift off the page with a real, layered shadow (contact + ambient), white like paper — [L1774](../../source/src/agents-concept.css#L1774) `.is-light .ns-c { background: #fff !important; box-shadow: 0 0 0 .5px rgba(0,0,0,.04), 0 1`
- light: the orbs lose the drawn rim that reads as an outline on a pale ground — [L1778](../../source/src/agents-concept.css#L1778) `.stg2.is-light .aorb circle[r="48.6"] { opacity: .12; }`
- light: tabs and the view switch use North's own toggle, the active one filled navy — [L1780](../../source/src/agents-concept.css#L1780) `.is-light .v7-pill { background: var(--navy) !important; box-shadow: none !important; }`
- light = North's own tokens (same as every other tab): navy type, #545454 / #8a8a8a secondary, #e2e2e2 lines, North's hover fill, and no ground of its own: the page card's white glass shows through — [L1788](../../source/src/agents-concept.css#L1788) `.stg2.is-light { --f1: var(--navy); --f2: var(--ink); --f3: var(--mute); --hl: rgba(9,53,8`
- light: an open card is its own surface. Solid white, a real layered shadow, and the board behind it steps back — [L1795](../../source/src/agents-concept.css#L1795) `.is-light .cd { background: #fff !important; box-shadow: 0 0 0 .5px rgba(0,0,0,.06), 0 1px`
- an agent or a job in the side panel: the board stays live and sharp beside it (the agent is lit, the rest of the crew steps back) — [L1799](../../source/src/agents-concept.css#L1799) `.is-light .v8-body:has(.rl3.is-panel) .v8-main { opacity: 1; filter: none; transition: opa`
- light: every menu here is North's menu (the chat's Export / Share): white, hairline edge, soft drop, navy type — [L1802](../../source/src/agents-concept.css#L1802) `.is-light .dd-m, .is-light .rc-addm, .is-light .cd-menu { background: #fff !important; box`
- the agents fit above the fold: one line (name, working, done), the bar under it — [L1809](../../source/src/agents-concept.css#L1809) `.pg .rl3-ag { padding: 7px 8px 8px !important; row-gap: 6px !important; }`
- menus grow out of the thing that opened them: they start the size of the button, at its corner, and open from there — [L1812](../../source/src/agents-concept.css#L1812) `@keyframes menuTL { from { clip-path: inset(0 calc(100% - 40px) calc(100% - 28px) 0 round `
- a dropdown is its button, grown: the menu starts exactly where the button is, the size of the button, and its bottom edge travels down (and out) until it's the menu. Button and menu share one surface, so it reads as one thing opening — [L1826](../../source/src/agents-concept.css#L1826) `@keyframes unitL { from { clip-path: inset(0 calc(100% - var(--bw)) calc(100% - var(--bh))`
- the button sits on the opened surface, so it stays put and readable while the rest grows out of it — [L1833](../../source/src/agents-concept.css#L1833) `.dd:has(.dd-m.is-unit) .dd-b, .v7-more:has(.dd-m.is-unit) .cd-ib { position: relative; z-i`
- finer grid, so each line goes lighter — [L1838](../../source/src/agents-concept.css#L1838) `.is-light .bd2 .bd-grid polyline { stroke: rgba(9,53,85,.035) !important; }`
- the shared hover (hover.js): a pill that grows sideways out of the pointer, like the sidebar's — [L1842](../../source/src/agents-concept.css#L1842) `.hv-host { position: relative; }`
- those rows drop their old instant hover fill, so only the grow shows — [L1847](../../source/src/agents-concept.css#L1847) `.pg .dd-m button.hv-host:hover:not(.is-on), .pg .rc-addm button.hv-host:hover, .ag-dl-m bu`
- dropdown motion from the dials (Menus → "Dropdown grows out of its button") — [L1851](../../source/src/agents-concept.css#L1851) `.dd-m.is-unit { animation-duration: var(--menu-d, .62s) !important; animation-timing-funct`
- hover cards ride beside the building, centred on the floor — [L1855](../../source/src/agents-concept.css#L1855) `.pk.is-side { translate: 0 -50%; margin-top: 0; }`
- Needs you, called out: a soft alert-tinted panel at the top of the column, its own count in the heading — [L1860](../../source/src/agents-concept.css#L1860) `/* decisions: no box, no badge. The number up top says how many; each one reads like a Rea`
- decisions: no box, no badge. The number up top says how many; each one reads like a Ready row, with its action as a word — [L1861](../../source/src/agents-concept.css#L1861) `.rl3-t.is-need { color: var(--alert, #b1042f) !important; }`
- the person segment: part of the tab; it widens into the search, and its list grows out of it — [L1895](../../source/src/agents-concept.css#L1895) `.v7-ps { position: relative; display: inline-flex; }`
- the lane's label: one size, three quiet lines (name, pace, how short it is) — [L1908](../../source/src/agents-concept.css#L1908) `.pg .bd-lane .bd-lane-n { font-size: 12px !important; line-height: 16px !important; font-w`
- what would close the gap: a job card's anatomy, rows you can leave out, one action — [L1914](../../source/src/agents-concept.css#L1914) `.pk.is-solve { width: 300px; z-index: 30; }`
- the lane's one action: a quiet button where the gap line was — [L1931](../../source/src/agents-concept.css#L1931) `.pg .bd-lane .bd-gap { all: unset; cursor: pointer; margin-top: 4px; padding: 0 10px; heig`
- rows read as choices: each says Start; the bar starts them all — [L1937](../../source/src/agents-concept.css#L1937) `.pg .sv-r > em { opacity: 1 !important; color: var(--f3); }`
- the pace is the button: on hover it fills and says what it does, in the same footprint — [L1942](../../source/src/agents-concept.css#L1942) `.pg .bd-lane .bd-pace { all: unset; cursor: pointer; display: inline-grid; place-items: ce`
- lane labels sit above job cards, so a card from a nearby floor can never cover a pace you're reaching for — [L1951](../../source/src/agents-concept.css#L1951) `.bd-lane { z-index: 7 !important; }`
- the gap card: red title, full-width rows split by hairlines, a navy Start on every row — [L1953](../../source/src/agents-concept.css#L1953) `.pk.is-solve { padding: 0 !important; gap: 0 !important; overflow: hidden; }`
- rail: one sentence on top, then three sections — [L1963](../../source/src/agents-concept.css#L1963) `.pg .rl3-lead { margin: 6px 0 22px; font-size: 15px; line-height: 21px; font-weight: 500; `
- one type scale (Agents) — sized for a 250px rail, Linear/Ramp discipline · rows 12.5 · meta 11 · weight 500 only for the anchor, the one decision and agent names · navy for the thing, grey for everything about it. Groups are separated by space, not by size or colour. — [L1969](../../source/src/agents-concept.css#L1969) `.pg .rl3-list { gap: 34px !important; padding-top: 26px !important; }`

### the anchor number + dark greys (Ramp/Linear: one hero, text in greys, navy only for things you press)

- the anchor number + dark greys (Ramp/Linear: one hero, text in greys, navy only for things you press) · — [L1997](../../source/src/agents-concept.css#L1997) `.stg2.is-light { --f1: #232528; --f2: #545454; --f3: #8a8a8a; }`
- the decision card: the decision first, who's asking under it, room around both; titles break evenly, never leaving one word alone — [L2004](../../source/src/agents-concept.css#L2004) `.pg .ns-c { padding: 13px 14px 12px !important; gap: 7px !important; }`
- decision card, final shape: who's asking left, the lane right, a full-width divider, then the decision — [L2009](../../source/src/agents-concept.css#L2009) `.pg .ns-c { padding: 11px 14px 13px !important; gap: 10px !important; }`
- dark: the card divider is a hairline, not a white rule. Titles use the full width and only avoid a lone last word — [L2013](../../source/src/agents-concept.css#L2013) `.is-dark .pg .ns-c .rl3-nc-h, .pg .is-dark .ns-c .rl3-nc-h, .stg2.is-dark .ns-c .rl3-nc-h `

### the job card, as a story: who + status, title, what it is, how we got here, the evidence

- the job card, as a story: who + status, title, what it is, how we got here, the evidence · — [L2017](../../source/src/agents-concept.css#L2017) `.pg .cd-h > .cd-state { display: inline-flex; align-items: center; gap: 6px; margin-left: `
- the description is the title's second line, not a new section — [L2023](../../source/src/agents-concept.css#L2023) `.pg .cd.is-job .cd-t { margin-bottom: 0 !important; }`
- full screen: the header and title start on the same line as everything under them — [L2027](../../source/src/agents-concept.css#L2027) `.pg .cd.is-full .cd-h { padding-left: 48px !important; }`
- the story in two facts: where it came from (under the description) and what it starts (beside the button) — [L2030](../../source/src/agents-concept.css#L2030) `.pg .rc .rc-from { margin: 8px 0 0; display: flex; flex-wrap: wrap; align-items: baseline;`
- Share lives in the header with the card's other actions, so nothing sits between the title and its description — [L2036](../../source/src/agents-concept.css#L2036) `.pg .cd-h > .cd-hand { margin-left: auto; margin-right: 4px; position: relative; z-index: `
- running: the steps open from a quiet link under the description (the status is already in the header) — [L2042](../../source/src/agents-concept.css#L2042) `.pg .rc .rc-steps-t { all: unset; cursor: pointer; align-self: flex-start; display: inline`
- the card's one block: description, source, chart, what the chart shows. The next step sits under a divider. — [L2046](../../source/src/agents-concept.css#L2046) `.pg .rc .rc-viz { margin-top: 20px; }`
- list filtering: rows arrive top to bottom, a soft fade and a 4px lift, 22ms apart (capped so long lists don't drag) — [L2056](../../source/src/agents-concept.css#L2056) `@keyframes lvIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transf`
- the agent card's header: room above and below, the orb centred on its two lines, one line under it (not two) — [L2060](../../source/src/agents-concept.css#L2060) `.pg .cd-h.is-ag { padding: 18px 12px 18px 20px !important; align-items: center !important;`
- "@" in a job's or an agent's field: the chat's own crew list, above the field — [L2068](../../source/src/agents-concept.css#L2068) `.sd-cmp { position: relative; }`

## agents-embed.css

- the Agents workspace inside North's frame: it fills the main panel and scrolls inside itself — [L2](../../source/src/agents-embed.css#L2) `.agx { flex: 1; min-height: 0; display: flex; flex-direction: column; background: #0b0c0e;`
- North's own rules that share a name with the workspace's stay out of it — [L7](../../source/src/agents-embed.css#L7) `.agx .ag-body { flex: initial; min-width: 0; padding-top: 0; }`
- the Agents page asks North with North's own field: same shape, icons and voice as Home, in the board's colours — [L14](../../source/src/agents-embed.css#L14) `.agx .ask-dock.is-north { --n1: #fff; --n2: rgba(233,238,243,.72); --n3: rgba(233,238,243,`
- active never outlines: the field looks the same focused as at rest — [L28](../../source/src/agents-embed.css#L28) `.agx .ask-dock.is-north .composer, .agx .ask-dock.is-north .composer.is-focus { border: 0.`
- the board never runs under the field: it keeps the field's height (+ a breath) clear at the bottom — [L30](../../source/src/agents-embed.css#L30) `.agx .v8-main { padding-bottom: 76px; box-sizing: border-box; }`
- one field at a time: with the chat open, the page's field steps away (and comes back when the chat closes) — [L34](../../source/src/agents-embed.css#L34) `.agx .ask-dock.is-north { transition: opacity .2s ease, translate .25s cubic-bezier(.32,.7`

## agents-log.css


### page: the Fia page card's own ground, type and lines

- page: the Fia page card's own ground, type and lines — [L2](../../source/src/agents-log.css#L2) `body { margin: 0; background: var(--paper); }`

### right now: the live log

- hover a key: what exactly it did — [L54](../../source/src/agents-log.css#L54) `.lt { position: fixed; left: 0; translate: -50% 0; z-index: 50; pointer-events: none; disp`

### job view: the details

- fixes: the page's button reset must not win over these — [L102](../../source/src/agents-log.css#L102) `.pg .nd-open, .pg .jv-back { font-size: 13px; font-weight: 500; }`

### v3: projects, handoffs, comments and plans on the log

- v3: projects, handoffs, comments and plans on the log · — [L110](../../source/src/agents-log.css#L110) `.rn-h { align-items: center; }`
- the plan: right of now, every step is editable in place — [L131](../../source/src/agents-log.css#L131) `.pl { display: flex; flex-direction: column; gap: 4px; padding: 0 20px 0 16px; min-width: `

### v4: the live log as a dark glass stage (the agents' world); decisions stay on paper (yours)

- v4: the live log as a dark glass stage (the agents' world); decisions stay on paper (yours) · — [L174](../../source/src/agents-log.css#L174) `.rn.is-dark { position: relative; margin-top: 0; border: 0; border-radius: 18px; color: #e`
- a hairline of light along the top edge, like glass catching it — [L180](../../source/src/agents-log.css#L180) `.rn.is-dark::after { content: ""; position: absolute; left: 24px; right: 24px; top: 0; hei`
- glass: comment composer, pinned threads, handoff labels, the key tooltip — [L204](../../source/src/agents-log.css#L204) `.rn.is-dark .cmt, .rn.is-dark .pin-card, .lt.is-dark { background: rgba(22,31,42,.72); -we`

## agents-horizon.css


### the stage

- fine grid, like a plotting sheet: the stage is a measured place, not decoration — [L36](../../source/src/agents-horizon.css#L36) `.stg::before { content: ""; position: absolute; inset: 0; z-index: -1; background-image: l`
