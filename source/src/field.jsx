// Sam's Home as a board (exploration; Beyonce's Home is untouched). There's no brief. The page is the state of his month:
// his work in three columns by where it is (coming up, in motion, done), each piece carrying its priority and sorted by
// it. Then the number he owns with the clock on it.
// A piece opens where it sits: it grows to fill the board (or exactly the table), with Home's own chart-opening motion,
// and folds back when you close it. Everything about a job happens in there: its picture, its steps, your call, a note on
// how to do it. The one way out is "Continue in North", which says where it goes.
// The agent on a piece stands at it. Working, its coat glows; waiting on Sam, it fidgets. North only speaks when there's a
// real move to make. The Table lens is the same pieces as rows, with the same actions.
// Every figure is the prototype's own: Company health's New Business lane, the lost-demo review, Sam's jobs on the floor.
// The late-stage deals are SAMPLE data (deals.js) and say so wherever they show.
// Colours are the system's: purple for a measured series, the well grey for the rest, coral for the mark to hit (pace,
// the gap), status colours (teal on, purple behind, red off) only for a number against its pace.
import { Stack } from "./stack.jsx";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup, useIsPresent } from "motion/react";
import { useDialKit } from "dialkit";
import { Puppet } from "./puppet.jsx";
import { AGENTS, AGENT_IDS, AgentMark, RowHover } from "./agents.jsx";
import { NorthLogo } from "./marks.jsx";
import { status } from "./health.jsx";
import { toMotion, C, useReplay } from "./lib.js";
import { createPortal } from "react-dom";
import { RealWorld } from "./realworld.jsx";
import { DEALS, OCT, sumK, STAGES, GOAL, PROSPECTS, THREATS } from "./deals.js";
import { MonthlyBars, GeoCtx, geo } from "./open-charts.jsx";
import { TipBody } from "./visuals.jsx";
import { talk, PEOPLE } from "./team-talk.js";
import { PHOTOS } from "./photos.js";
import { VoiceBtn, bodyFor } from "./voice.jsx";
import { DECK, REVIEW, DeckView, DocView, FileCard, showFile, FILE_OF } from "./files.jsx";
import { getWho } from "./seat.js";
import { RoutineCard, RoutineMark, RoutineRun, RoutineSet, ROUTINES, routineSet } from "./routines.jsx";
import { ROOM_OF_THREAD, ROOMS } from "./account.jsx";
const SEAT_NAME = { seth: "Beyonce", jordan: "Jordan", sam: "Sam" };
const andList = (a) => (a.length < 3 ? a.join(" and ") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

const NA = () => (typeof window !== "undefined" ? window.__northAgents : null);
const HUE = { orin: "#6f86e6", riley: "#5fbf8a", calvin: "#d97786", marco: "#ea86bd", fia: "#e2b552" };
const ST_C = { on: "#098486", behind: "#744ccb", off: "#b1042f" };
const PPL = { sam: "Sam", jordan: "Jordan", heather: "Heather", lisa: "Lisa", paul: "Paul", dustin: "Dustin", north: "North" };
const nm = (ag) => AGENTS[ag]?.n || PPL[ag] || ag;
// an agent's reply on a piece is its first line or two, not the whole message
const short = (t) => { const ss = t.split(/(?<=[.!?])\s+/); let o = ss[0]; if (ss[1] && (o + " " + ss[1]).length <= 90) o += " " + ss[1]; return o; };

// the number Sam owns (its levers are the tiles under it), as Company health and the chat's lane table have it (New Business: $1.52M against a $1.66M pace)
const SCORE = { v: "$1.52M", pace: "$1.66M", f: 1.52 / 1.66, gap: "$140K", left: 4, month: 31 };
// where a piece is. Priority is the other thing a piece says; it's said on the piece and orders each column
// Home is the loop: what needs you, what's being talked through, what's moving in someone's hands, what landed
const ZONES = [["need", "Needs you"], ["talk", "Talking"], ["moving", "Moving"], ["landed", "Landed"]];
const PRIO = { 3: "High", 2: "Medium", 1: "Low" };

// Sam's work as pieces. Each one reads its job live from the floor, so a call made here is made on the Agents page too.
// pr: priority (3 high … 1 low); why: the reason for that priority, in a few words, from what's already known.
// what: what the job is, in the third person (the agent's own pitch stays in the agent's thread)
function resolve(js, ho = {}) {
  const by = (f) => js.find(f), need = (id) => by((j) => j.need === id && j.st === "need");
  const D = (j) => (j && j.st === "run" ? NA()?.detail(j.id) : null);
  const zoneOf = (j) => (!j || j.st === "need" ? "need" : j.st === "done" ? "landed" : "moving");
  const P = [];
  { const n = need("sam-arr"), r = by((j) => j.t === "Rank late-stage new-logo deals by close date"), j = n || r, d = D(j);
    P.push({ k: "late", t: "Late-stage new-logo deals", moves: "New ARR", j, ag: j?.ag || "riley", zone: zoneOf(j),
      pr: 3, why: "The only work here that can still land in October",
      what: "Riley ranks your late-stage new-logo deals by close date, so you know which to push first.",
      line: !j || j.st === "need" ? `${DEALS.length} deals, ${OCT.length} can still close in October. Nothing is working on them yet.` : j.st === "done" ? "Ranked by close date, so you know which to push first." : d?.now || "Ranking them by close date.",
      act: n ? "Start it" : null }); }
  { const j = by((x) => x.need === "sam-follow"), open = j && j.st === "need";
    P.push({ k: "follow", t: "11 lost demos, no follow-up", moves: "Win rate", j, ag: j?.ag || "orin", isNew: true,
      zone: open ? "need" : "moving", pr: 2, why: "More likely to pay off in November than October",
      what: "Orin drafted a follow-up for each of the 11 lost demos that never got one. They go out from you.",
      line: open ? "One follow-up drafted for each. They go out from you." : "Sent from you. Watching for replies.",
      act: open ? "Send them" : null, watching: !open }); }
  { const n = need("sam-list"), r = by((j) => j.t === "Rank Sam’s demo list"), j = n || r, d = D(j);
    P.push({ k: "list", t: "Your demo list", moves: "Outbound bookings", j, ag: j?.ag || "orin", zone: zoneOf(j), plan: r,
      pr: 2, why: "14 open prospects nobody is working",
      what: "Orin orders the 14 open prospects on your old demo list by who’s most likely to book, strongest first.",
      line: !j || j.st === "need" || j.st === "queue" ? "14 open prospects you left on Outbound. Ranking it is next in line." : j.st === "done" ? "Ranked, strongest first." : d?.now || "Scoring the 14 on fit and how recently they engaged.",
      act: n ? "Start it" : null }); }
  { const j = by((x) => x.t === "Find why held demos aren’t closing"), d = D(j);
    if (j) P.push({ k: "held", t: "Why held demos aren’t closing", moves: "Win rate", j, ag: j.ag, zone: zoneOf(j),
      pr: 2, why: "Win rate is 3.6 points under target",
      what: "Orin is reading the call notes to work out why held demos close below target.",
      line: j.st === "done" ? NA()?.watchOf(j.id)?.find || "Done." : d?.now || "Reading call notes." }); }
  { const j = by((x) => x.t === "Find why new logos are behind pace");
    if (j) P.push({ k: "logos", t: "Why new logos are behind pace", moves: "New logos", j, ag: j.ag, stalled: j.st === "wait", zone: j.st === "wait" ? "moving" : zoneOf(j),
      pr: 1, why: "Blocked until the HubSpot sync lands",
      what: "Orin finds out why New Business is signing fewer new customers than its pace.",
      line: j.st === "wait" ? `${j.wait}.` : j.st === "done" ? "Done." : NA()?.detail(j.id)?.now || "Working on it." }); }
  // a customer that closed and now moves to another team: Sam hands it to Jordan (Customer Value) for onboarding. The
  // hand-off is the piece's own conversation: North drafts the brief from the deal's history, Sam sends it, Jordan takes it
  P.push({ k: "bw", t: "Brightwater Realty", moves: "New ARR", people: ho.taken ? ["jordan"] : ["sam", "jordan"], bots: ["riley"], handoff: true, static: true,
    zone: ho.booked ? "landed" : ho.sent ? "moving" : "need", pr: ho.booked ? 0 : 2, why: ho.taken ? "Jordan has it now" : "Closed, but onboarding hasn’t started",
    stTxt: ho.booked ? "Setup call booked" : ho.taken ? "Jordan has it" : ho.sent ? "Waiting on Jordan" : null,
    what: "Closed Oct 22 for $24.0K new ARR. Onboarding moves it to Jordan in Customer Value. North drafted the hand-off from the deal’s history.",
    line: ho.booked ? "Jordan booked the Felix setup call for Thursday." : ho.taken ? "Jordan took it. Booking the setup call." : ho.sent ? "Handed to Jordan. Waiting for her to take it." : "Closed Oct 22. Ready to hand to Jordan for onboarding.",
    act: ho.sent ? null : "Hand to Jordan" });
  // work an agent finished that you haven't looked at yet: it needs your eyes, so it waits in the list (and arrived once, at Ask North)
  js.filter((j) => j.demo && j.st === "done" && !j.approved).forEach((j) => { const w = NA()?.watchOf(j.id);
    P.push({ k: j.id, t: j.t, j, ag: j.ag, zone: "need", pr: 2, review: true, stTxt: "Ready for you",
      line: w?.find || "Finished. Ready for you to look at.", act: "Look at it" }); });
  // what's already landed this month (the lost-demo review is where the 11 follow-ups came from)
  P.push({ k: "review", t: "Lost-demo review", moves: "Win rate", zone: "landed", ag: "orin", when: "Oct 24", static: true,
    what: "Orin read the last 20 demos that didn’t close and pulled out what they had in common.",
    line: "14 of the last 20 lost demos were booked by outbound after Oct 14, and 11 had no follow-up within two days." });
  return P;
}

// ---- Beyonce's work (leadership): the same loop, read from what the floor already holds for her. Her own calls first (Riley's
// ask about Sam, and the conversations where someone is waiting on her), then what an agent can take, worded as what it
// would do. What's running is quieter, below; what finished and is ready to read lands there too
const LEAD_TAKE = {
  "orin-prop": ["orin", "Orin starts on the 14 open prospects Outbound left, strongest first"],
  "calvin-smb": ["jordan", "Jordan sends Calvin’s QBR invites to the 4 quiet renewals in her book"],
  anchors: ["riley", "Riley names a forecaster for each of the 4 anchor accounts"],
};
// a leader sees the company-level work in motion, not every task an agent is on
const LEAD_LEVEL = /Forecast the year|new accounts stall|exec sponsors/;
const LEAD_DUE = { "t-hire": 1, "t-bline": 2, "riley-out": 3, syncdoc: 4 };
function resolveLead(js, ho, ld = {}) {
  const by = (f) => js.find(f), need = (id) => by((j) => j.need === id && j.st === "need");
  const D = (j) => (j && j.st === "run" ? NA()?.detail(j.id) : null);
  const zoneOf = (j) => (!j || j.st === "need" ? "need" : j.st === "done" ? "landed" : "moving");
  const P = [];
  { const j = by((x) => x.need === "riley-out");
    if (j) P.push({ k: "riley-out", t: "Move Sam back to Outbound", moves: "Outbound bookings", j, ag: "riley", zone: zoneOf(j), pr: 3, why: "Outbound is the biggest gap on the board",
      what: "Riley wants Sam back on Outbound for the rest of October. Outbound is at 23% of pace and has the least work on it.",
      line: j.st === "need" ? "Outbound is at 23% of pace. Riley wants Sam back on it through Oct 31." : "Approved. Sam is back on Outbound.", act: j.st === "need" ? "Approve" : null, when: "Today" }); }
  { const n = need("orin-prop"), r = by((x) => x.t === "Rank Sam’s demo list"), j = n || r, d = D(j);
    if (j) P.push({ k: "orin-prop", t: "Outbound: the biggest gap, the least work on it", moves: "Outbound bookings", j, ag: "orin", zone: zoneOf(j), pr: 2, why: "Outbound is at 23% of pace",
      what: "Outbound is the biggest gap on the board and has the least work on it. Orin ranks the 14 open prospects Sam left on Outbound, strongest first, so the team works them in order.",
      line: n ? "14 open prospects nobody is working. Ranking them is queued." : j.st === "done" ? "Ranked, strongest first. Sam has the list." : j.st === "queue" ? "Up next." : d?.now || "Scoring the 14 on fit and how recently they engaged.", act: n ? "Start it" : null }); }
  { const j = by((x) => x.need === "calvin-smb");
    if (j) P.push({ k: "calvin-smb", t: "QBR invites for 4 quiet renewals", moves: "At-risk ARR", j, ag: "calvin", zone: zoneOf(j), pr: 2, why: "4 renewals due by Dec 31 have gone quiet for 60 days",
      what: "Four SMB renewals due by Dec 31 haven’t been touched in 60 days. They’re in Jordan’s book; Calvin drafted the QBR invites, and they go out from her.",
      line: j.st === "need" ? "In Jordan’s book. Calvin drafted the invites; they go out from her." : "Jordan sent them. Watching for replies.", act: j.st === "need" ? "Send them" : null, watching: j.st !== "need" }); }
  P.push({ k: "anchors", t: "4 anchor accounts with no forecaster", moves: "Forecast", ag: "riley", static: true, lead: true,
    zone: ld.anchorsDone ? "landed" : ld.anchors ? "moving" : "need", pr: 2, why: "Their renewals sit outside the forecast", when: "Today",
    stTxt: ld.anchorsDone ? "Done" : ld.anchors ? "Working" : null,
    what: "Four of the biggest accounts have nobody forecasting their renewal, so they’re missing from the year’s forecast. Riley names one for each, from who owns the account. (Sample)",
    line: ld.anchorsDone ? "Each of the 4 has a forecaster now, and they’re in the year’s forecast." : ld.anchors ? "Matching each account to the person who owns it." : "Nobody forecasts their renewals, so they’re missing from the year’s forecast.",
    act: ld.anchors ? null : "Assign them" });
  // work an agent finished that you set going (the demo): it needs your eyes
  js.filter((j) => j.demo && j.st === "done" && !j.approved).forEach((j) => { const w = NA()?.watchOf(j.id);
    P.push({ k: j.id, t: j.t, j, ag: j.ag, zone: "need", pr: 2, review: true, stTxt: "Ready for you", line: w?.find || "Finished. Ready for you to look at.", act: "Look at it" }); });
  // yours, running: quiet, below (the sync doc is its own piece, the file it makes)
  js.filter((j) => j.mine && !j.demo && (j.st === "run" || j.st === "wait" || j.st === "queue") && !j.need && LEAD_LEVEL.test(j.t)).slice(0, 4).forEach((j) => { const d = D(j);
    P.push({ k: j.id, t: j.t, j, ag: j.ag, zone: "moving", pr: 1, what: `${j.t}.`, line: j.st === "wait" ? `${j.wait}.` : j.st === "queue" ? "Up next." : d?.now || (j.think && j.think[0]) || "Working on it." }); });
  // yours, finished and ready to read: landed, with what it found
  js.filter((j) => j.mine && !j.demo && j.st === "done" && !j.approved && !j.need).forEach((j) => { const w = NA()?.watchOf(j.id);
    P.push({ k: j.id, t: j.t, j, ag: j.ag, zone: "landed", pr: 1, stTxt: "Ready for you", when: j.at, line: w?.find || (j.think && j.think[0]) || "Finished." }); });
  return P;
}
// the file that comes back to each seat: Sam asks Riley for a deck; Beyonce's Monday sync doc is Orin's, every Monday
const FILE_CFG = {
  sam: { k: "deck", by: "riley", dept: "Sales", moves: "New ARR", act: "Send to Heather", sentSt: "Sent to Heather", sentLine: "In Heather’s conversation for Thursday.",
    readyLine: (n) => `${n} slides for Thursday’s review`, progLine: (i, n) => `Slide ${i} of ${n}`, thread: "t-slide",
    post: { role: "user", text: "Here’s the late-stage deals deck for Thursday’s review." }, reply: { role: "person", who: "heather", text: "Perfect. I’ll open the review with the $140K slide." } },
  lead: { k: "syncdoc", by: "orin", dept: "RevOps", moves: "Leadership sync", auto: true, act: "Share in the sync", sentSt: "Shared in the sync", sentLine: "In the Monday sync conversation, for the 9:00.",
    readyLine: () => "The number, what moved, what’s stuck, and the two calls this week", progLine: (i, n) => `Section ${i} of ${n}`, thread: "t-sync",
    post: { role: "user", text: "This week’s sync doc. Same order as always: the number, what moved, what’s stuck." }, reply: { role: "person", who: "heather", text: "Thanks. The Felix line under the number is exactly what I wanted." } },
};
const fileN = (f) => (f.slides ? f.slides.length : f.body.filter(([k]) => k === "h").length);
const LEAD_PIECES = new Set(["rt-mondaysync"]);
const SEATW = { sam: { resolve: (js, ho) => resolve(js, ho), get TAKE() { return TAKE; }, get DUE() { return DUE; }, file: FILE_CFG.sam, pieceOk: (x) => !LEAD_PIECES.has(x.k), title: "Your work" },
  lead: { resolve: resolveLead, TAKE: LEAD_TAKE, DUE: LEAD_DUE, file: FILE_CFG.lead, pieceOk: (x) => LEAD_PIECES.has(x.k), title: "Your calls" } };
// ---- what needs you, split by whose it really is. Three things only Sam can do (an answer only he has, a review only he can
// give, a packet that has to come from him), each with its day in his own words; and work an agent is ready to take, said as
// what the agent would do. Letting one take it is the same move as its button always was (it starts, or sends, as Sam)
// soonest first among yours (the asks already say the day in the asker's words, so the row doesn't say it again)
const DUE = { "t-coast": 1, "t-slide": 2, "t-web": 3 };
const TAKE = {
  late: ["riley", "Riley ranks the 6 deals that can still close, by close date"],
  follow: ["orin", "Orin sends the 11 follow-ups, as you"],
  list: ["orin", "Orin ranks the 14 prospects, strongest first"],
  bw: ["north", "North sends Jordan the hand-off it drafted"],
};
// the seat whose work this is (Sam's Home, or Beyonce's): set as the loop renders, read by the helpers below
let W = null;
const TK = () => (W && W.TAKE) || TAKE, DU = () => (W && W.DUE) || DUE;
const takeOf = (p) => TK()[p.k] && p.act ? TK()[p.k] : null;
// within a column: highest priority first, then what needs Sam; done stays in the order it landed
// a person waiting on you comes before an agent waiting on you, at the same stakes
const order = (a, b) => (b.pr || 0) - (a.pr || 0) || (b.ask ? 1 : 0) - (a.ask ? 1 : 0) || (b.act ? 1 : 0) - (a.act ? 1 : 0);
const sortZ = (z, ps) => (z === "landed" ? ps : [...ps].sort(order));
const canOpen = (p) => !!(p.j || p.static || p.kind === "chat" || p.kind === "file" || p.from || p.rt);
const BRIEF = [["Done", "Signed Oct 22 for $24.0K new ARR"], ["Open", "The Felix setup call isn’t booked yet"], ["Watch", "Their ops lead wants the HubSpot sync working before kickoff"]];
// a piece's state in a word or two, at the top of the piece
const stOf = (p, parked) => p.stTxt ? p.stTxt : p.act && !parked ? "Needs you" : p.act && parked ? "Parked" : p.won ? `Closed ${p.when}` : p.static ? `Done ${p.when}` : p.act && !parked ? "Needs you" : p.act && parked ? "Parked"
  : p.watching ? "Watching replies" : p.j?.st === "run" ? "Working" : p.j?.st === "wait" ? "Waiting" : p.j?.st === "done" ? "Done" : "Up next";

function useJobs() {
  const [js, set] = useState(() => NA()?.jobs() || []);
  const tick = () => set(NA()?.jobs() || []);
  useEffect(() => { const t = setInterval(tick, 700); return () => clearInterval(t); }, []);
  return [js, tick];
}

const GAME_ON = false; // game mode: Sam's block (realworld.jsx). Earlier looks (game.jsx, street.jsx, world.jsx) are parked
const lensKey = "north.sam.lens";
const readLens = () => { try { return localStorage.getItem(lensKey) || "board"; } catch { return "board"; } };
// Home's chart-opening motion (App.jsx MOTION.open), so a piece opens exactly like a metric card does
const O_CLOSE_EASE = [0.45, 0, 0.15, 1];
const OPEN0 = { expand: { type: "easing", duration: 0.55, ease: [0.32, 0.72, 0, 1] }, collapse: { type: "easing", duration: 0.5, ease: [0.45, 0, 0.15, 1] }, /* even: the box is seen closing the whole way, not snapped shut then left blank */
  contentDelay: 0.08, content: { type: "easing", duration: 0.3, ease: [0.22, 1, 0.36, 1] }, stagger: 0.022 };

export function SamField({ M, onAsk, ask, numbers, name = "Sam", seat = "sam", bare = false }) {
  const cfg = SEATW[seat] || SEATW.sam; W = cfg; const FC = cfg.file, FDOC = FILE_OF(FC.k), FN = fileN(FDOC);
  // Home's band runs to the bottom of the header, as on every Home (same --band-h the leadership Home sets)
  const band = useRef(null);
  useLayoutEffect(() => {
    const a = band.current, c = a && a.closest(".content"), st = document.documentElement.style; if (!a || !c) return;
    const set = () => st.setProperty("--band-h", a.offsetParent === null ? "0px" : `${Math.round(a.getBoundingClientRect().bottom - c.getBoundingClientRect().top + 24)}px`);
    const ro = new ResizeObserver(set); ro.observe(a); set(); return () => ro.disconnect();
  }, []);
  const V = useDialKit("Sam · board", {
    "Piece move: stiffness": [320, 60, 900, 10], "Piece move: damping": [32, 8, 80, 1],
    "Agent height (px)": [72, 48, 120, 1], "What changed: delay (s)": [0.9, 0, 3, 0.1],
    "Opened piece: min height on the board (px)": [560, 420, 800, 10],
  });
  const O = (M && M.open) || OPEN0;
  const mo = { open: toMotion(O.expand), close: toMotion(O.collapse), content: toMotion(O.content), delay: O.contentDelay ?? 0.08, stagger: O.stagger ?? 0.022, dur: O.expand.duration || 0.55, cdur: O.collapse.duration || 0.4, ease: O.expand.ease || [0.32, 0.72, 0, 1] };
  const spring = { type: "spring", stiffness: V["Piece move: stiffness"], damping: V["Piece move: damping"] };
  const [js, refresh] = useJobs();
  const [arrived, setArrived] = useState(false), [said, setSaid] = useState({}), [parked, setParked] = useState({}), [northOff, setNorthOff] = useState(false);
  // acting on a row leaves a receipt where you clicked: who has it now, for a beat, before it moves down into In progress
  const [rcpt, setRcpt] = useState({});
  const [notes, setNotes] = useState({});
  const [ho, setHo] = useState({ sent: false, taken: false, booked: false, msgs: [] }); // the Brightwater hand-off (sample)
  const [ld, setLd] = useState({}); // Beyonce's own pieces that have no job on the floor (the anchors)
  const [lens, setLensRaw] = useState("board"), [game, setGame] = useState(false), [openK, setOpenKRaw] = useState(null), [openAt, setOpenAt] = useState(null);
  // open something where it sits; a piece that came out of a chat opens that chat, growing from the piece you tapped
  const setOpenK = (k, at = null) => { setOpenAt(at); setOpenKRaw(k); };
  const openSoon = (k, at) => { if (openK) { setOpenK(null); setTimeout(() => setOpenK(k, at), 460); } else setOpenK(k, at); };
  // the talk lives in the chat (one chat, teammates and agents in it); Home reads what's waiting on Sam and the work that
  // fell out of it from the shared store, and opens a conversation there
  const [T, setT] = useState(() => talk.get()); useEffect(() => talk.sub(setT), []);
  // files that come back to you: Riley's deck for Thursday's review (made when you ask for it)
  const [files, setFiles] = useState({}), deckT = useRef(0);
  const makeDeck = () => { if (files[FC.k]) return false; setFiles((F) => ({ ...F, [FC.k]: { prog: 0, rev: {}, msgs: [], sent: false } }));
    clearInterval(deckT.current); deckT.current = setInterval(() => setFiles((F) => { const d = F[FC.k]; if (!d || d.prog >= FN) { clearInterval(deckT.current); return F; } return { ...F, [FC.k]: { ...d, prog: d.prog + 1 } }; }), 1300); return true; };
  useEffect(() => () => clearInterval(deckT.current), []);
  // a seat whose file is already on its way when you arrive (Beyonce's Monday sync doc) starts drafting it as Home opens
  useEffect(() => { if (!FC.auto) return; const t = setTimeout(makeDeck, 1400); return () => clearTimeout(t); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // the file belongs to its team: its home lists it from the moment it's started
  useEffect(() => { const d = files[FC.k]; if (!d) return;
    talk.setFile({ k: FC.k, t: FDOC.t, kind: FDOC.kind, n: FDOC.slides ? FN : undefined, by: FC.by, dept: FC.dept, st: d.sent ? FC.sentSt : d.prog >= FN ? "Ready for you" : "Drafting", at: "Today" }); }, [files[FC.k] && files[FC.k].prog, files[FC.k] && files[FC.k].sent]); // eslint-disable-line react-hooks/exhaustive-deps
  const filePieces = files[FC.k] ? [(() => { const d = files[FC.k], done = d.prog >= FN;
    return { k: FC.k, kind: "file", t: FDOC.t, ag: FC.by, moves: FC.moves, pr: 2, zone: d.sent ? "landed" : done ? "need" : "moving",
      stTxt: d.sent ? FC.sentSt : done ? "Ready for you" : "Drafting", line: d.sent ? FC.sentLine : done ? FC.readyLine(FN) : FC.progLine(d.prog + 1, FN),
      act: done && !d.sent ? FC.act : null }; })()] : [];
  // a conversation opens right where it is, under its row (the chat, full size, is one tap away)
  const [inT, setInT] = useState(null); // focus: the item you're working on (Home becomes the work)
  const setFocus = (k) => { setInT(k); if (k) setOpenK(null); };
  const [cleared, setCleared] = useState({}), [pop, setPop] = useState(null), [more, setMore] = useState(false), [ex, setEx] = useState(null);
  // tap a face anywhere: what you and that person are in together (not their whole board)
  useEffect(() => { const f = (e) => setPop(e.detail); window.addEventListener("north:person", f); return () => window.removeEventListener("north:person", f); }, []);
  const setLens = (l) => { setOpenK(null); setLensRaw(l); try { localStorage.setItem(lensKey, l); } catch {} };
  useEffect(() => { const t = setTimeout(() => setArrived(true), V["What changed: delay (s)"] * 1000); return () => clearTimeout(t); }, []);

  // conversations with people in them (Brightwater's belongs to its piece, so it isn't listed twice)
  const threads = T.threads.filter((t) => t.id !== "t-bw").map((t) => ({ k: t.id, kind: "thread", t: t.t, people: ["sam", ...t.people], bots: t.ags, ask: t.ask, fresh: t.fresh,
    zone: t.ask ? "need" : "talk", pr: t.ask ? 2 : 0, last: t.last, line: t.last ? <><b>{t.last.who === "sam" ? "You" : nm(t.last.who)}:</b> {t.last.text}</> : null, work: T.pieces.filter((x) => x.from === t.id) }));
  const P = [...cfg.resolve(js, ho, ld).map((p) => (p.isNew && !arrived ? { ...p, zone: "landed", fromDone: true } : p)), ...T.pieces.filter(cfg.pieceOk), ...filePieces, ...threads].filter((p) => !cleared[p.k]);
  // one body per agent: it stands at what it's working on, else at what's waiting on you. Anywhere else it's a face
  const rank = (p) => (p.static ? 9 : p.j?.st === "run" ? 0 : p.act && !parked[p.k] ? 1 : p.j ? 2 : 9), body = {};
  [...P].sort((a, b) => rank(a) - rank(b) || order(a, b)).forEach((p) => { if (p.ag && rank(p) < 9 && !body[p.ag]) body[p.ag] = p.k; });

  const say = (k, ag, text) => { setSaid((s) => ({ ...s, [k]: { ag, text } }));
    setTimeout(() => setSaid((s) => { const n = { ...s }; delete n[k]; return n; }), 7000); };
  const decide = (p, quiet) => { setParked((s) => ({ ...s, [p.k]: false }));
    if (!quiet && p.act && !p.from && p.kind !== "thread" && !p.review && !p.rt) { const at = Math.max(0, need.findIndex((x) => x.k === p.k)); setRcpt((r) => ({ ...r, [p.k]: { at } }));
      setTimeout(() => setRcpt((r) => { const n = { ...r }; delete n[p.k]; return n; }), 2600); }
    if (p.from || p.kind === "thread") { setFocus(p.k); return; }
    if (p.handoff) { setHo((h) => ({ ...h, sent: true })); say(p.k, "sam", "Handed to Jordan with the brief.");
      talk.post("t-bw", { role: "user", text: "Brightwater is yours from here, Jordan. The brief is on the piece.", topic: "Brightwater Realty" });
      setTimeout(() => talk.post("t-bw", { role: "person", who: "jordan", text: "Taken. Booking the Felix setup call for Thursday." }), 2800);
      setTimeout(() => talk.post("t-bw", { role: "agent", agent: "north", chit: true, text: "Setup call booked for Thursday. Seen on Jordan’s calendar, so this landed for Sam." }), 6200);
      // Jordan takes it a moment later (in the prototype). Nobody marks it done: it lands for Sam when the setup call shows
      // up on Jordan's calendar
      setTimeout(() => { setHo((h) => ({ ...h, taken: true })); say(p.k, "jordan", "Taken. Booking the Felix setup call for Thursday."); }, 2800);
      setTimeout(() => { setHo((h) => ({ ...h, booked: true })); say(p.k, "north", "Setup call booked for Thursday. Seen on Jordan’s calendar."); }, 6200); return; }
    if (p.review) { NA()?.open(p.j.id); return; }
    if (p.kind === "file" && p.k === FC.k) { setFiles((F) => ({ ...F, [FC.k]: { ...F[FC.k], sent: true } }));
      talk.post(FC.thread, { ...FC.post, file: { k: FC.k, t: FDOC.t, kind: FDOC.kind, ...(FDOC.slides ? { n: FN } : {}) } });
      setTimeout(() => talk.post(FC.thread, FC.reply), 2400); return; }
    if (p.lead && p.k === "anchors") { setLd((l) => ({ ...l, anchors: true })); say(p.k, "riley", "On it. Naming one for each, from who owns the account.");
      setTimeout(() => { setLd((l) => ({ ...l, anchorsDone: true })); say(p.k, "riley", "Done. Each of the 4 has a forecaster, and they’re in the year’s forecast."); }, 6500); return; }
    const r = p.j && NA()?.decide(p.j.id, true); refresh(); if (r?.text) say(p.k, r.ag || p.ag, short(r.text)); };
  const park = (k) => setParked((s) => ({ ...s, [k]: true }));
  // a note on how to do the work: it joins the job's steps, and its owner says it's taken on board
  const note = (p, t, slide) => {
    if (p.kind === "file" && !FDOC.slides) { setFiles((F) => ({ ...F, [FC.k]: { ...F[FC.k], msgs: [...F[FC.k].msgs, ["sam", "Now", t]] } }));
      setTimeout(() => setFiles((F) => ({ ...F, [FC.k]: { ...F[FC.k], msgs: [...F[FC.k].msgs, [FC.by, "Now", "On it. I’ll work that in and post the new version here."]] } })), 1400); return; }
    if (p.kind === "file") { const i = DECK.slides.findIndex((s) => s.k === slide);
      setFiles((F) => ({ ...F, deck: { ...F.deck, msgs: [...F.deck.msgs, ["sam", "Now", i >= 0 ? `Slide ${i + 1}: ${t}` : t]] } }));
      // what it can actually change, it changes (and says what); anything else it says it'll rework, without pretending
      const noSub = /sub-?title|subhead|less text|shorter/i.test(t), did = noSub ? `Done. Took the subtitle off slide ${i + 1}.` : `On it. I’ll rework slide ${i + 1} and post the new version here.`;
      setTimeout(() => setFiles((F) => ({ ...F, deck: { ...F.deck, rev: noSub ? { ...F.deck.rev, [slide]: { tag: true, noSub: true } } : F.deck.rev, msgs: [...F.deck.msgs, ["riley", "Now", did]] } })), 1400); return; } if (p.handoff) { talk.post("t-bw", { role: "user", text: t, topic: "Brightwater Realty" }); return; }
    setNotes((s) => ({ ...s, [p.k]: [...(s[p.k] || []), t] }));
    say(p.k, p.ag, p.j?.st === "done" ? "Got it. I’ll rework it with that and bring a new version back here." : p.act ? "Noted. I’ll work it that way once you say go." : "Got it. I’ll work that in from here."); };

  const opened = openK && P.find((p) => p.k === openK);
  // what needs you, in the order it lands: today first, then the week, then what has no day ("Anytime") last
  // yours first (the things only you can do), then what an agent can take
  const need = sortZ("need", P.filter((p) => p.zone === "need")).map((p, i) => [p, i]).sort((a, b) => (takeOf(a[0]) ? 1 : 0) - (takeOf(b[0]) ? 1 : 0) || (DU()[a[0].k] || 9) - (DU()[b[0].k] || 9) || a[1] - b[1]).map(([p]) => p);
  // the one count of what's waiting on you goes to Ask North in the sidebar; nothing else in the app counts at you
  useEffect(() => { dispatchEvent(new CustomEvent("north:need", { detail: { n: need.length } })); }, [need.length]);
  const needKey = need.map((p) => p.k + (p.act || "") + (p.ask || "")).join("|");
  useEffect(() => { talk.setNeed(need.map((p) => ({ k: p.k, who: whoOfP(p), t: p.t, act: p.act || (p.ask ? "Answer" : null), ask: p.ask, thread: p.kind === "thread" ? p.k : p.from || null,
    line: p.kind === "thread" ? (p.ask ? p.last?.text : p.last ? `${nm(p.last.who)}: ${p.last.text}` : "") : typeof p.line === "string" ? p.line : "" }))); }, [needKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // the chat's list acts on the same pieces
  useEffect(() => { const f = (e) => { const p = P.find((x) => x.k === e.detail.k); if (p && p.act) { e.preventDefault(); decide(p); } }; addEventListener("north:need-act", f); return () => removeEventListener("north:need-act", f); });
  // one list: what needs you first (with its button), then what's going on, quieter and with nothing to press
  const going = [...P.filter((p) => p.zone === "talk"), ...sortZ("moving", P.filter((p) => p.zone === "moving")), ...sortZ("landed", P.filter((p) => p.zone === "landed")).reverse()];
  const [goingOpen, setGoingOpen] = useState(false);
  // everything that needs you shows: hiding some of it behind a "more" row splits your work in two and strands what's
  // in progress under it
  const NEED_SHOW = need.length;
  const list = [...need, ...going], shown0 = [...(more ? need : need.slice(0, NEED_SHOW)), ...(goingOpen ? going : [])];
  // the conversation you have open stays in view as it moves (answering Heather takes it out of what needs you)
  // moving through the list past what's shown opens the rest
  const shown = inT && list.some((x) => x.k === inT) && !shown0.some((x) => x.k === inT) ? list : shown0;
  const openP = (p) => (p.kind === "thread" || p.from ? setFocus(p.k) : canOpen(p) ? (p.zone !== "need" && setEx(p.zone), setTimeout(() => openSoon(p.k), p.zone !== "need" ? 380 : 0)) : setEx(p.zone));
  const tid = (p) => (p.kind === "thread" ? p.k : p.from);
  useEffect(() => { const go = (k) => { window.__northOpenFile = null; setInT(k); }; if (window.__northOpenFile) go(window.__northOpenFile);
    const f = (e) => go(e.detail.k); addEventListener("north:open-file", f); return () => removeEventListener("north:open-file", f); }, []);
  // ---- handing one to an agent: the agent takes it (a teal sweep runs across the row from its button, the line becomes
  // "Riley has it"), then the row lifts off the card and flies down into In progress, landing as the row that's now
  // working. The card closes the gap under it. Nothing blinks: the flying copy hands over to the real row as it lands
  const [taking, setTaking] = useState({}), [fresh, setFresh] = useState({});
  const fly = (k) => { const src = document.querySelector(`.fd-nc [data-piece="${k}"]`); if (!src) return; const r0 = src.getBoundingClientRect();
    const g = src.cloneNode(true); g.classList.add("fd-ghost"); g.removeAttribute("data-piece");
    Object.assign(g.style, { position: "fixed", left: `${r0.left}px`, top: `${r0.top}px`, width: `${r0.width}px`, height: `${r0.height}px`, margin: "0", zIndex: "40", pointerEvents: "none" });
    document.body.appendChild(g); src.style.opacity = "0";
    const t0 = performance.now(), D = 820, ez = (t) => 1 - Math.pow(1 - t, 4);
    const step = (now) => { const t = Math.min(1, (now - t0) / D), e = ez(t), dst = document.querySelector(`.fd-mv [data-piece="${k}"]`);
      const r1 = dst ? dst.getBoundingClientRect() : { left: r0.left, top: r0.top + 240, width: r0.width, height: 44 };
      const L = (a, b) => a + (b - a) * e;
      Object.assign(g.style, { left: `${L(r0.left, r1.left)}px`, top: `${L(r0.top, r1.top)}px`, width: `${L(r0.width, r1.width)}px`, height: `${L(r0.height, r1.height)}px`, opacity: String(t < 0.72 ? 1 : 1 - (t - 0.72) / 0.28) });
      if (dst) dst.style.opacity = String(t < 0.62 ? 0 : Math.min(1, (t - 0.62) / 0.3));
      if (t < 1) requestAnimationFrame(step); else { g.remove(); if (dst) dst.style.opacity = ""; } };
    requestAnimationFrame(step); };
  const letGo = (p) => { if (taking[p.k]) return; setTaking((t) => ({ ...t, [p.k]: true }));
    setTimeout(() => { setFresh((f) => ({ ...f, [p.k]: true })); fly(p.k); decide(p, true); setTaking((t) => { const n = { ...t }; delete n[p.k]; return n; });
      setTimeout(() => setFresh((f) => { const n = { ...f }; delete n[p.k]; return n; }), 2600); }, 560); };
  const card = (p) => <Row key={p.k} p={p} said={said[p.k]} parked={parked[p.k]} sel={inT === p.k} rc={!!rcpt[p.k]} take={takeOf(p)} taking={!!taking[p.k]} onLet={() => letGo(p)}
    onGo={() => decide(p)} onPark={() => park(p.k)} onOpen={() => (tid(p) || canOpen(p)) && setFocus(p.k)}
    onClear={p.zone === "landed" ? () => setCleared((c) => ({ ...c, [p.k]: true })) : null} />;
  // acting keeps you on the item (it says what happened); moving on is yours: ↓, j, or the arrows in its header
  const actFocus = (p) => decide(p);
  const inTRef = useRef(inT); inTRef.current = inT;
  useEffect(() => { document.documentElement.classList.toggle("home-item-open", !!inT); return () => document.documentElement.classList.remove("home-item-open"); }, [inT]);
  // where the open item sat among what's waiting on you, so "next" moves on to the next one even after this one's answered
  const needPos = useRef(0); if (inT) { const j = need.findIndex((x) => x.k === inT); if (j >= 0) needPos.current = j; }
  const wasOpen = useRef(false);
  // opening brings "Your work" up to 23px under the bar (the page's gap), so the header stays readable above what opened
  useEffect(() => { const open = !!inT; if (open && !wasOpen.current) { const hd = document.querySelector(".fd-head"), sc = hd && hd.closest(".scroll"), bar = document.querySelector(".topbar");
      if (hd && sc && bar) { const d = hd.getBoundingClientRect().top - (bar.getBoundingClientRect().bottom + 23); if (Math.abs(d) > 1) sc.scrollTo({ top: sc.scrollTop + d, behavior: "smooth" }); } }
    wasOpen.current = open; }, [inT]);
  // and it fills from there to the page card's bottom, less the same 23px
  const openH = () => { if (typeof document === "undefined") return 640; const hd = document.querySelector(".fd-head"), st = document.querySelector(".fd-stage"), bar = document.querySelector(".topbar"), mn = document.querySelector(".main");
    if (!hd || !st || !bar || !mn) return 640; const below = st.getBoundingClientRect().top - hd.getBoundingClientRect().top;
    return Math.round(mn.getBoundingClientRect().bottom - 23 - (bar.getBoundingClientRect().bottom + 23 + below)); };
  const tap = { whileTap: { scale: 0.97 } };
  // spoken (or typed) commands on Home: the same moves the buttons make, said out loud
  const cmd = useRef(null);
  cmd.current = (raw) => {
    // a conversation is open over Home: it takes what's said (unless it was typed in that conversation as a command)
    if (document.documentElement.classList.contains("chat-talking") && !window.__northFromChat) return null;
    const t = raw.trim(), lo = t.toLowerCase(), who = (k) => new RegExp(`\\b${k}\\b`, "i").test(lo);
    const thOf = (k) => threads.find((x) => x.people.includes(k) && x.ask) || threads.find((x) => x.people.includes(k));
    const say = /^(answer|reply to|reply|tell|message)\s+(heather|jordan|paul|lisa|dustin)\b[\s,:.-]*(.*)$/i.exec(t);
    if (inTRef.current && /^(next|skip|next one|next item)[.!]?$/i.test(t)) { const cur = inTRef.current, j = need.findIndex((x) => x.k === cur), L = list, i = L.findIndex((x) => x.k === cur);
      const n = (j >= 0 ? need[j + 1] : need[needPos.current]) || need.find((x) => x.k !== cur) || L[i + 1] || L[0]; if (n) setInT(n.k); return n ? `Next: ${n.t}` : "Next"; }
    if (inTRef.current && /^(back|go back|close|close it|exit|done here)[.!]?$/i.test(t)) { setInT(null); return "Back to your work"; }
    if (inTRef.current && /^(do it|yes|yes do it|go ahead|approve|approve it|start it|send them|send it)[.!]?$/i.test(t)) { const p = P.find((x) => x.k === inTRef.current); if (p && p.act) { actFocus(p); return ({ "Start it": `${nm(p.ag)} started`, "Send them": "Sent", "Hand to Jordan": "Handed to Jordan", "Look at it": "Opened" })[p.act] || "Done"; } }
    if (inTRef.current && /^(reply|say|tell them)\b[\s,:.-]*(.+)$/i.test(t)) { const p = P.find((x) => x.k === inTRef.current), m = /^(reply|say|tell them)\b[\s,:.-]*(.+)$/i.exec(t), id = p && (p.kind === "thread" ? p.k : p.from);
      if (id) { dispatchEvent(new CustomEvent("north:talk-send", { detail: { id, text: m[2][0].toUpperCase() + m[2].slice(1) } }));
        const th = T.threads.find((x) => x.id === id), to = th ? th.people.filter((k) => k !== "sam") : []; return to.length ? `Sent to ${andList(to.map(nm))}` : "Sent"; } }
    // "tell Paul…" with Paul's conversation open: it goes in this one, not another thread he's in
    if (say && inTRef.current) { const p = P.find((x) => x.k === inTRef.current), id = p && (p.kind === "thread" ? p.k : p.from), th = id && T.threads.find((x) => x.id === id);
      if (th && th.people.includes(say[2].toLowerCase()) && say[3]) { dispatchEvent(new CustomEvent("north:talk-send", { detail: { id, text: say[3][0].toUpperCase() + say[3].slice(1) } })); return `Sent to ${andList(th.people.filter((k) => k !== "sam").map(nm))}`; } }
    if (say) { const th = thOf(say[2].toLowerCase()); if (!th) return null; setFocus(th.k);
      if (say[3]) { dispatchEvent(new CustomEvent("north:talk-send", { detail: { id: th.k, text: say[3][0].toUpperCase() + say[3].slice(1) } })); return `Sent to ${nm(say[2].toLowerCase())}`; }
      return `Opened ${nm(say[2].toLowerCase())}`; }
    if (/^(open|show|go to)\b/i.test(t)) { for (const k of ["heather", "jordan", "paul", "lisa", "dustin"]) if (who(k)) { const th = thOf(k); if (th) { setFocus(th.k); return `Opened ${nm(k)}`; } }
      const p = P.find((x) => lo.includes(x.t.toLowerCase().split(" ").slice(0, 2).join(" ")) || (x.ag && who(nm(x.ag).toLowerCase()))); if (p) { setFocus(p.k); return `Opened ${p.t}`; } return null; }
    if (seat === "sam" && /\b(make|build|create|put together|turn|draft)\b.*\b(deck|slides|presentation)\b/i.test(t)) { if (!makeDeck()) { setFocus("deck"); return "Opened the deck"; } return "Riley’s making the deck"; }
    if (seat === "lead" && /\b(sync doc|monday doc|monday sync)\b/i.test(t)) { if (!makeDeck()) { setFocus(FC.k); return "Opened the sync doc"; } return "Orin’s drafting the sync doc"; }
    const go = (k, done) => { const p = P.find((x) => x.k === k); if (!p || !p.act) return null; decide(p); return done; };
    if (/hand(ing)?\b.*(brightwater|jordan)|brightwater.*\bjordan/i.test(t)) return go("bw", "Handed Brightwater to Jordan");
    if (/^start\b/i.test(t) && (who("riley") || /late|deal/i.test(lo))) return go("late", "Riley’s on the late-stage deals");
    if (/^start\b/i.test(t) && (/demo list|list/i.test(lo))) return go("list", "Orin’s ranking your demo list");
    if (/^send\b/i.test(t) && (who("orin") || /follow/i.test(lo))) return go("follow", "Sent the 11 follow-ups");
    if (seat === "lead") {
      if (/\b(approve|move sam|outbound)\b/i.test(lo)) return go("riley-out", "Approved. Sam goes back to Outbound");
      if (/\b(forecasters?|anchors?)\b/i.test(lo)) return go("anchors", "Riley’s naming forecasters");
      if (/\b(qbrs?|calvin|renewals?)\b/i.test(lo)) return go("calvin-smb", "Calvin sent the QBR invites, from Jordan");
      if (/\b(demo list|orin)\b/i.test(lo)) return go("orin-prop", "Orin’s on Sam’s demo list");
    }
    return null;
  };
  useEffect(() => { const f = (e) => { const r = cmd.current && cmd.current(e.detail.text); if (r) { e.detail.done = r; e.preventDefault(); } }; addEventListener("north:voice", f); return () => removeEventListener("north:voice", f); }, []);
  // anything else said with a conversation open on Home goes into it
  const here = useRef(null);
  here.current = (d) => { if (!inTRef.current || document.documentElement.classList.contains("chat-talking")) return null; const p = P.find((x) => x.k === inTRef.current), id = p && (p.kind === "thread" ? p.k : p.from);
    const th = id && T.threads.find((x) => x.id === id); if (!th) return null; const ppl = th.people.filter((k) => k !== "sam"); if (d.need && !d.need.every((k) => ppl.includes(k))) return null;
    dispatchEvent(new CustomEvent("north:talk-send", { detail: { id, text: bodyFor(d, ppl) } })); return `Sent to ${andList(ppl.map(nm))}`; };
  useEffect(() => { const f = (e) => { const r = here.current && here.current(e.detail); if (r) { e.detail.done = r; e.preventDefault(); } }; addEventListener("north:voice-say", f); return () => removeEventListener("north:voice-say", f); }, []);

  return (
    <div className={`fd${inT ? " is-peek" : ""}`}>
      {/* the header band: the greeting, the ask, and what happened since you were last here (it never pings). The band grows and shrinks with it */}
      {!bare && <div className="fd-band" ref={band}>
      <div className="hello"><h1>Good Morning {name}</h1></div>
      {ask}
      </div>}
      <div className="fd-head">
        <h2>{cfg.title}</h2>
        <div className="fd-head-r">
        {GAME_ON && <motion.button className="btn-sec fd-play" {...tap} onClick={() => setGame(true)}><svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4c0 .4.4.6.7.4l6.6-4.2a.5.5 0 0 0 0-.8L3.7 1.4c-.3-.2-.7 0-.7.4z" fill="currentColor" /></svg>Game mode</motion.button>}
        </div>
      </div>
      <Stage openK={inT || openK} at={inT || openAt} fit={Math.max(420, openH())} minH={inT ? Math.max(420, openH()) : lens === "board" ? Math.max(V["Opened piece: min height on the board (px)"], ({ list: 980, late: 690 })[openK] || 0) : 0} mo={mo}
        detail={inT ? (rect, full) => <Grown key="g" rect={rect} full={full} mo={mo} items={list} cur={inT} onPick={setInT} onExit={() => { setInT(null); const b = window.__northBack; if (b) { window.__northBack = null; window.__northNav?.(b); } }} P={P} T={T} parked={parked} said={said} notes={notes} ho={ho} M={M}
          onGo={actFocus} onNote={note} files={files} /> : opened ? (rect, full) => <Detail key={opened.k} p={opened} rect={rect} full={full} mo={mo} parked={parked[opened.k]} said={said[opened.k]} notes={notes[opened.k] || []} M={M} ho={ho}
          onClose={() => setOpenK(null)} onGo={() => decide(opened)} onPark={() => park(opened.k)} onNote={(t) => note(opened, t)} /> : null}>
        {lens === "board" ? (
          <LayoutGroup id="fd">
            {/* the loop: what needs you is the one list; the rest is a quiet line each that opens in place */}
            <div className="fd-loop">
              {/* what needs you: one card, built like the chart cards (the tray is the frame, the rows on paper inside, a footer
                  on the tray). It's the one place on Home with buttons, and an item opens inside it */}
              <div className="fd-nc">
              <div className="fd-rows fd-nc-p" aria-label="What needs you">
                {(() => { const rows = shown.filter((p) => p.zone === "need"); Object.entries(rcpt).forEach(([k, r]) => { if (rows.some((x) => x.k === k)) return; const q = P.find((x) => x.k === k); if (q) rows.splice(Math.min(r.at, rows.length), 0, q); });
                  const mine = rows.filter((p) => !(TK()[p.k] && (p.act || rcpt[p.k]))), theirs = rows.filter((p) => !mine.includes(p)), ags = [...new Set(need.map(takeOf).filter(Boolean).map((t) => t[0]))];
                  const nYours = need.filter((p) => !takeOf(p)).length, nTake = need.length - nYours;
                  // hand them all over: one after another, so you watch each leave
                  const all = () => need.filter(takeOf).forEach((p, i) => setTimeout(() => letGo(p), i * 520));
                  return <>
                    {need.length > 0 && <div className="nc-h"><p><b>{nYours === 0 ? "Nothing here has to be you." : `${nYours === 1 ? "1 is" : `${nYours} are`} yours.`}</b>{nTake > 0 ? ` ${andList(ags.map(nm))} can take the other ${nTake}.` : " The rest is moving, below."}</p>
                      {nTake > 1 && <motion.button className="fd-act" {...tap} onClick={all}>Hand them over</motion.button>}</div>}
                    {mine.length > 0 && theirs.length > 0 && <p className="nc-l">Only you</p>}
                    <AnimatePresence initial={false}>{mine.map(card)}</AnimatePresence>
                    {theirs.length > 0 && <p className="nc-l">They can take it</p>}
                    <AnimatePresence initial={false}>{theirs.map(card)}</AnimatePresence>
                  </>; })()}
                {!need.length && <p className="fd-empty">{EMPTY.need}</p>}
                {/* past a handful, the rest of what needs you opens in place; a short tail just shows */}
                {need.length > NEED_SHOW && !more && <button type="button" className="fd-row fd-sum" onClick={() => setMore(true)}>
                  <span className="fd-row-f" /><span className="fd-row-w"><span className="fd-row-1">{need.length - NEED_SHOW} more need you</span><span className="fd-row-s">{andList(need.slice(NEED_SHOW).map((p) => p.t))}</span></span><span /></button>}
              </div>
              {need.length > 0 && (() => { const y = need.filter((p) => !takeOf(p)).length, t = need.length - y, run = going.filter((p) => p.zone !== "landed").length;
                // the card's measure: your morning in ticks. Navy is yours, teal is what an agent can take; handing one over
                // moves its tick out of the card, and In progress counts it
                return <div className="fd-nc-f"><span className="nc-tk" aria-label={`${y} yours, ${t} an agent can take`}>{need.map((p, i) => <i key={p.k} className={takeOf(p) ? "is-take" : ""} />)}</span>
                  <span>{y} yours{t ? ` \u00b7 ${t} they can take` : ""}{run ? ` \u00b7 ${run} already moving` : ""}</span></div>; })()}
              </div>
              {/* everything in motion that isn't your move: under the card, on the page, quieter. No buttons; each row shows its
                  live state, a fine line moving under what's running, and what landed today with its result */}
              {going.length > 0 && seat !== "lead" && <Moving fresh={fresh} going={going} onOpen={(p) => (tid(p) || canOpen(p)) && setFocus(p.k)} onClear={(p) => setCleared((c) => ({ ...c, [p.k]: true }))} />}
            </div>
          </LayoutGroup>
        ) : <Table P={P} said={said} parked={parked} openK={openK} onGo={decide} onPark={park} onOpen={(p) => (p.kind === "thread" || p.from ? talk.open(p.from || p.k) : canOpen(p) && setOpenK(p.k))} />}
      </Stage>
      {typeof document !== "undefined" && createPortal(<AnimatePresence>{pop && <PersonPop key={pop.k + pop.x} pop={pop} items={P} onClose={() => setPop(null)}
        onOpen={(p) => { setPop(null); setFocus(p.k); }} />}</AnimatePresence>, document.body)}
      {typeof document !== "undefined" && createPortal(<AnimatePresence>{game && <RealWorld key="rw" onClose={() => setGame(false)} onAsk={(q) => { setGame(false); setTimeout(() => onAsk(q), 320); }} />}</AnimatePresence>, document.body)}
      {/* the number under the work: the score and the clock, then his lane's own charts (the same tiles Company health has) */}
      {!bare && <section className="fd-nums" aria-label="Your number">
        <Score onAsk={onAsk} />
        {numbers}
      </section>}
    </div>
  );
}

// the toggle every page uses (the Seg in App.jsx: paper track, navy pill that slides)
function Seg({ value, onChange, options, id }) {
  return (
    <div className="seg" role="tablist">
      {options.map(([v, label]) => (
        <button key={v} role="tab" aria-selected={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>
          {value === v && <motion.span layoutId={`seg-${id}`} className="seg-pill" transition={{ type: "spring", visualDuration: 0.3, bounce: 0.12 }} />}
          <span className="seg-t">{label}</span>
        </button>
      ))}
    </div>
  );
}

// the board (or table) and the piece opened on it. Opening grows the piece from its slot to fill the whole container, the
// way an opened chart fills its row; everything else steps back. On the board, if the board is shorter than the opened
// piece needs, the board grows to fit and gives the height back as the piece folds home. The table never grows: the
// opened row fills exactly the table.
function Stage({ openK, at, minH, fit, mo, detail, children }) {
  const box = useRef(null), [geo, setGeo] = useState(null), shown = useRef(null);
  const measure = (k) => { const el = box.current; if (!el) return null; const r = el.getBoundingClientRect(), s = el.querySelector(`[data-piece="${k}"]`); if (!s) return null;
    const c = s.getBoundingClientRect(); return { top: c.top - r.top, left: c.left - r.left, width: c.width, height: c.height }; };
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    if (openK) { const h0 = geo ? geo.h0 : el.getBoundingClientRect().height, rect = measure(at || openK) || measure(openK) || (geo && geo.rect), H = fit || Math.max(h0, minH);
      shown.current = at || openK; setGeo({ rect, full: { top: 0, left: 0, width: el.clientWidth, height: H }, h0 });
      el.style.transition = `height ${mo.dur}s cubic-bezier(${mo.ease.join(",")})`;
      el.style.height = `${el.getBoundingClientRect().height}px`; void el.offsetHeight; el.style.height = `${H}px`; }
    else if (geo) { const rect = measure(shown.current) || geo.rect; // the row it's open on now (↑↓ moves it) setGeo((g) => g && { ...g, rect });
      el.style.transition = `height ${mo.cdur}s cubic-bezier(${(O_CLOSE_EASE).join(",")})`; el.style.height = `${geo.h0}px`; }
  }, [openK]); // eslint-disable-line react-hooks/exhaustive-deps
  // the opened piece keeps the container's width as the window resizes
  useEffect(() => { if (!openK) return; const el = box.current, ro = new ResizeObserver(() => setGeo((g) => g && { ...g, full: { ...g.full, width: el.clientWidth } })); ro.observe(el); return () => ro.disconnect(); }, [openK]);
  const done = () => { if (!openK && box.current) { box.current.style.height = ""; box.current.style.transition = ""; setGeo(null); } };
  return (
    <div ref={box} className={`fd-stage${openK ? " is-open" : ""}`}>
      <motion.div className="fd-under" initial={false} animate={{ opacity: openK ? 0 : 1 }} transition={{ duration: openK ? 0.2 : mo.cdur * 0.7, delay: openK ? 0 : mo.cdur * 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ pointerEvents: openK ? "none" : "auto" }}>{children}</motion.div>
      <AnimatePresence onExitComplete={done}>{geo && openK && detail && geo.rect && detail(geo.rect, geo.full)}</AnimatePresence>
    </div>
  );
}

// progress in North's own mark: the fine ticks the charts and the Agents floor use. Lit ticks are how far it's got; with no
// figure, one lit tick walks the row (it's working, nobody can say how far)
const NTK = 20;
function Ticks({ prog }) {
  const on = prog == null ? -1 : Math.max(1, Math.round(prog * NTK));
  return <span className={`fd-mk${prog == null ? " is-ind" : ""}`} aria-label={prog == null ? "Working" : `${Math.round(prog * 100)}% done`}>{Array.from({ length: NTK }, (_, i) => <i key={i} className={i < on ? "is-on" : ""} style={prog == null ? { animationDelay: `${i * 0.09}s` } : undefined} />)}</span>;
}
// in motion: what others (people, agents) have, one quiet line each. Running work carries North's tick meter; what landed
// today sits under "Done today" with its result. None of it is your move, so there are no buttons here (Clear tidies a result)
function Moving({ going, onOpen, onClear, fresh = {} }) {
  const [all, setAll] = useState(false), CAP = 5;
  // what you just handed over lands first, so you see it arrive (and never behind "more moving")
  const run0 = [...going.filter((p) => p.zone !== "landed" && fresh[p.k]), ...going.filter((p) => p.zone !== "landed" && !fresh[p.k])], done = going.filter((p) => p.zone === "landed");
  // secondary, so it stays short: the newest few that are moving, then what landed. The rest opens in place
  const run = all ? run0 : run0.slice(0, CAP), hid = run0.length - run.length;
  const R = (p) => { const who = whoOfP(p), live = p.zone === "landed" ? p.stTxt || "Done" : p.kind === "thread" ? "" : stOf(p), prog = p.j && typeof p.j.prog === "number" ? p.j.prog : typeof p.prog === "number" ? p.prog : null, runs = p.zone === "moving" || p.j?.st === "run";
    return <div key={p.k} data-piece={p.k} role="button" tabIndex={0} className={`fd-mv-r${p.zone === "landed" ? " is-done" : ""}${fresh[p.k] ? " is-fresh" : ""}`} onClick={(e) => { if (e.target.closest("button")) return; onOpen(p); }} onKeyDown={(e) => { if (e.key === "Enter") onOpen(p); }}>
      <span className="fd-mv-f"><Stack ids={who} size={20} fit={44} face={(k, sz) => (AGENTS[k] ? <AgentMark id={k} size={sz} /> : <Pp k={k} size={sz} />)} /></span>
      <span className="fd-mv-t"><b>{p.t}</b>{p.rt && <RoutineMark />}<AnimatePresence mode="wait" initial={false}><motion.span key={live + (p.line || "")} className="fd-mv-s" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.25 }}>
        {p.zone === "landed" && <svg className="fd-rc-i" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2.5 6.3 2.3 2.3L9.5 3.8" /></svg>}
        {typeof p.line === "string" && p.line.toLowerCase().startsWith(String(live).toLowerCase()) ? p.line : <>{live}{p.line ? <>{live ? " \u00b7 " : ""}{p.line}</> : null}</>}</motion.span></AnimatePresence></span>
      {p.zone === "landed" ? <button type="button" className="fd-clr" onClick={() => onClear(p)}>Clear</button> : runs ? <Ticks prog={prog} /> : <span />}
    </div>; };
  return (
    <section className="fd-mv" aria-label="In progress">
      <h3 className="fd-mv-h">In progress<em>{run0.length} moving{done.length ? ` \u00b7 ${done.length} done` : ""}</em></h3>
      {/* one list: what's moving, then what just landed (a check and its result), until you open it or clear it */}
      {run.map(R)}
      {hid > 0 && <button type="button" className="fd-mv-more" onClick={() => setAll(true)}>{hid} more moving</button>}
      {all && run0.length > CAP && <button type="button" className="fd-mv-more" onClick={() => setAll(false)}>Show fewer</button>}
      {done.map(R)}
    </section>
  );
}
function Prio({ v, long }) {
  if (!v) return null;
  return <span className="fd-prio" title={`Priority: ${PRIO[v]}`}><svg width="11" height="11" viewBox="0 0 11 11" aria-hidden="true">{[0, 1, 2].map((i) => <rect key={i} x={0.5 + i * 3.8} y={10.5 - (3.5 + i * 3.5)} width="2.6" height={3.5 + i * 3.5} rx="0.6" fill={i < v ? "var(--navy)" : "var(--edge)"} />)}</svg>{PRIO[v]}{long ? " priority" : ""}</span>;
}
// what's yours to do on a piece: the call, or (once parked) the same call, quieter
function Calls({ p, parked, onGo, onPark, sm }) {
  if (!p.act) return null;
  const tap = { whileTap: { scale: 0.97 } }, z = sm ? " is-sm" : "";
  return parked ? <motion.button className={`btn-sec${z}`} {...tap} onClick={onGo}>{p.act}</motion.button>
    : <><motion.button className={`btn-pri${z}`} {...tap} onClick={onGo}>{p.act}</motion.button><motion.button className={`btn-sec${z}`} {...tap} onClick={onPark}>Not now</motion.button></>;
}

function Piece({ p, spring, h, body, said, parked, hidden, onGo, onPark, onOpen, onClear }) {
  const work = p.j?.st === "run" || p.watching, open = canOpen(p);
  return (
    <motion.article data-piece={p.k} layoutId={`fd-${p.k}`} layout="position" transition={{ layout: spring, opacity: { duration: hidden ? 0.08 : 0.2 } }}
      className={`fd-card${open ? " is-open" : ""}${p.won ? " is-won" : ""}${p.stalled ? " is-stalled" : ""}${p.fromDone ? " is-from" : ""}`}
      initial={{ opacity: 0 }} animate={{ opacity: hidden ? 0 : 1 }}
      onClick={(e) => { if (e.target.closest("button")) return; onOpen(); }}
      tabIndex={open ? 0 : undefined} role={open ? "button" : undefined} aria-label={open ? `Open ${p.t}` : undefined}
      onKeyDown={(e) => { if (open && e.key === "Enter" && e.target === e.currentTarget) onOpen(); }}>
      <div className="fd-c-clip"><div className="fd-c-body">
        <div className="fd-c-txt">
          <div className="fd-c-top">{p.pr && !onClear ? <Prio v={p.pr} /> : <span />}{onClear && !p.act
            ? <button type="button" className="fd-clr" onClick={(e) => { e.stopPropagation(); onClear(); }}>Clear</button>
            : <span className={`fd-c-st${p.act && !parked ? " is-need" : ""}`}>{stOf(p, parked)}</span>}</div>
          <div className="fd-p-t">
            <b>{p.t}</b>
            {p.isNew && !p.fromDone && <motion.em className="fd-new" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }} transition={{ duration: 6, times: [0, 0.05, 0.8, 1] }}>New</motion.em>}
          </div>
          {p.won ? <p className="fd-p-l"><span className="fd-won">{p.won}</span> new ARR</p>
            : <AnimatePresence mode="wait" initial={false}>
              <motion.p key={said ? "said" : p.line} className="fd-p-l" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.2 }}>
                {said ? <><b>{nm(said.ag)}:</b> {said.text}</> : p.line}
              </motion.p></AnimatePresence>}
          {p.moves && <p className="fd-p-m">{p.people && <span className="fd-ppl">{p.people.map((k) => <Pp key={k} k={k} size={14} />)}</span>}{p.people ? `${p.people.map(nm).join(" → ")} · ` : ""}{p.ag && !body && <AgentMark id={p.ag} size={14} />}{p.ag && !body ? `${nm(p.ag)} · ` : ""}Moves {p.moves}</p>}
          {p.via && <p className="fd-p-m">{p.people ? <span className="fd-ppl">{p.people.map((k) => <Pp key={k} k={k} size={14} />)}</span> : p.ag && <AgentMark id={p.ag} size={14} />}{p.people ? p.people.map((k) => (k === "sam" ? "You" : nm(k))).join(", ") : nm(p.ag)} · from {p.via}</p>}
          {p.act && <div className="fd-p-b"><Calls p={p} parked={parked} onGo={onGo} onPark={onPark} /></div>}
        </div>
        {body && p.ag && <span className="fd-body" aria-label={`${nm(p.ag)}, ${work ? "working on this" : "waiting on you"}`}>
          <Puppet id={p.ag} h={h} work={work} roam={0} seed={p.k.length} color={HUE[p.ag]} /></span>}
      </div></div>
    </motion.article>
  );
}

function Table({ P, said, parked, openK, onGo, onPark, onOpen }) {
  const Z = Object.fromEntries(ZONES);
  const rows = ZONES.flatMap(([z]) => sortZ(z, P.filter((p) => p.zone === z)));
  return (
    <div className="fd-table-wrap">
      <table className="fd-table">
        <colgroup><col style={{ width: "26%" }} /><col style={{ width: "9%" }} /><col style={{ width: "11%" }} /><col style={{ width: "10%" }} /><col /><col style={{ width: "232px" }} /></colgroup>
        <thead><tr><th>Work</th><th>Priority</th><th>Where</th><th>Who</th><th>Where it stands</th><th aria-label="Actions" /></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.k} data-piece={p.k} className={canOpen(p) ? "is-open" : ""} style={{ opacity: openK === p.k ? 0 : 1 }} onClick={(e) => { if (e.target.closest("button") || !canOpen(p)) return; onOpen(p); }}>
              <td><b>{p.t}</b>{p.moves ? <small>Moves {p.moves}</small> : p.kind === "chat" ? <small>{p.project ? "Project" : "Chat"}</small> : p.via ? <small>From {p.via}</small> : null}</td>
              <td>{p.pr ? <Prio v={p.pr} /> : null}</td>
              <td><span className={`fd-chip is-${p.zone}`}><span className="fd-dot" />{Z[p.zone]}</span></td>
              <td>{p.kind === "chat" ? <span className="fd-who"><span className="fd-ppl">{p.people.filter((k) => k !== "sam").map((k) => <Pp key={k} k={k} size={16} />)}</span>{p.people.filter((k) => k !== "sam").map(nm).join(", ")}</span> : p.people ? <span className="fd-who"><span className="fd-ppl">{p.people.map((k) => <Pp key={k} k={k} size={16} />)}</span>{p.people.map(nm).join(" → ")}</span> : p.ag ? <span className="fd-who"><AgentMark id={p.ag} size={16} />{nm(p.ag)}</span> : <span className="fd-mute">You</span>}</td>
              <td className="fd-st">{p.won ? `${p.won} new ARR · closed ${p.when}` : said[p.k] ? <><b>{nm(said[p.k].ag)}:</b> {said[p.k].text}</> : p.line}</td>
              <td className="fd-acts">{p.act ? <Calls p={p} parked={parked[p.k]} onGo={() => onGo(p)} onPark={() => onPark(p.k)} /> : null}</td>
            </tr>))}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------ a line of work on Home
// It reads the way you'd say it: who you're in it with, what it's about, where it stands, and what's yours to do. A button
// means it needs you, so the row doesn't say so; the order is the priority, so it doesn't say that either
const whoOfP = (p) => { if (p.kind === "thread") return [...p.people.filter((x) => x !== "sam"), ...(p.bots || [])];
  if (p.people) { const o = [...p.people.filter((x) => x !== "sam"), ...(p.bots || [])]; return o.length ? o : ["sam"]; } return p.ag ? [p.ag] : ["sam"]; };
const namesOf = (ks) => { const n = ks.map((k) => (k === "sam" ? "You" : nm(k))); return n.length > 1 ? `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}` : n[0]; };
function Row({ p, said, parked, hidden, open, sel, onOpen, onGo, onPark, onClear, rc, take, taking, onLet }) {
  const who = whoOfP(p), [hv, setHv] = useState(false), at = useRef({ x: 100, w: 600 });
  // one grey line: who and where it stands first, then the words. The faces carry who's in it; the topic leads
  const asker = p.last && p.last.who !== "sam" ? nm(p.last.who) : null;
  const st = p.kind === "thread" ? (p.ask ? `${asker ? `${asker} asked you: ` : "Asked you: "}${p.last?.text || ""}` : p.last ? `${p.last.who === "sam" ? "You" : nm(p.last.who)}: ${p.last.text}` : "")
    : said ? `${nm(said.ag)}: ${said.text}`
    : <>{!p.act && <>{p.zone === "landed" ? p.stTxt || "Done" : stOf(p, parked)}{(p.j?.st === "run" || p.stTxt === "Drafting") && <i className="fd-dots" aria-hidden="true"><b /><b /><b /></i>}{(p.j?.st === "run" || p.stTxt === "Drafting") ? " " : " · "}</>}{p.act && p.ag ? `${nm(p.ag)}: ` : ""}{p.line}</>;
  const tap = { whileTap: { scale: 0.97 } };
  // the receipt: whose it is now, in the row you just acted on (it then folds away and turns up under In progress)
  const holder = p.handoff ? "Jordan" : p.ag ? nm(p.ag) : who[0] ? nm(who[0]) : "North";
  const rcLine = rc ? <><svg className="fd-rc-i" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2.5 6.3 2.3 2.3L9.5 3.8" /></svg>{`${holder} has it`}<span className="fd-rc-w"> · moving to In progress</span></> : null;
  return (
    <motion.div data-piece={p.k} className={`fd-row${p.act || p.ask ? " is-act" : " is-quiet"}${sel ? " is-sel" : ""}${rc ? " is-rc" : ""}`} role="button" tabIndex={0} aria-label={`${namesOf(who)}, ${p.t}`}
      initial={{ opacity: 0 }} animate={{ opacity: hidden ? 0 : 1 }} exit={{ opacity: 0, height: 0, minHeight: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } }} transition={{ duration: hidden ? 0.08 : 0.2 }}
      onClick={(e) => { if (e.target.closest("button, .fd-pp.is-tap")) return; onOpen(); }} onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) onOpen(); }}
      onPointerEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(true); }} onPointerLeave={() => setHv(false)}>
      <AnimatePresence>{hv && <RowHover key="h" o={at.current} t={{ type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }} />}</AnimatePresence>
      <span className="fd-row-f"><Stack ids={who} size={28} fit={62} face={(k, s) => (AGENTS[k] ? <AgentMark id={k} size={s} /> : <Pp k={k} size={s} />)} /></span>
      {take && <span className={`fd-take${taking ? " is-on" : ""}`} aria-hidden="true" />}
      <span className="fd-row-w"><span className="fd-row-1">{p.t}</span><span className="fd-row-s">{rc ? rcLine : take ? <AnimatePresence mode="wait" initial={false}><motion.span key={taking ? "t" : "o"} className={taking ? "fd-took" : ""} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.2 }}>
        {taking ? <><svg className="fd-rc-i" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2.5 6.3 2.3 2.3L9.5 3.8" /></svg>{nm(take[0])} has it</> : take[1]}</motion.span></AnimatePresence> : st}</span></span>
      <span className="fd-row-a">
        {/* quiet until you're on the row: then it's the one navy button in view */}
        {rc ? null : take ? <motion.span className="fd-let" animate={{ opacity: taking ? 0 : 1, x: taking ? -8 : 0 }} transition={{ duration: 0.25 }}><span className="fd-let-f">{AGENTS[take[0]] ? <AgentMark id={take[0]} size={22} /> : <Pp k={take[0]} size={22} />}</span><motion.button className="fd-act is-let" {...tap} onClick={onLet || onGo} disabled={taking}>Let {nm(take[0])}</motion.button></motion.span>
          : p.act ? <motion.button className="fd-act" {...tap} onClick={onGo}>{p.act}</motion.button>
          : p.kind === "thread" && p.ask && !open ? <motion.button className="fd-act" {...tap} onClick={onOpen}>Answer</motion.button>
          : onClear ? <button type="button" className="fd-clr" onClick={onClear}>Clear</button> : null}
      </span>
    </motion.div>
  );
}

// ------------------------------------------------------------------ conversations on Home
// The talk lives in the chat; Home shows a conversation as a card (who's in it, the last word) and opens it there
const EMPTY = { need: "Nothing needs you.", talk: "No conversations with people yet. Start one with @ in the ask bar.", moving: "Nothing moving.", landed: "Nothing landed yet." };
// Home is one short list and three quiet lines: what needs you shows (the top few, the rest fold); talk, work in motion and
// what landed are a line each, with who's in them and the one thing worth knowing, and open in place
const CAP = 3;
const SUMS = [["talk", "Talking"], ["moving", "Moving"], ["landed", "Landed"]];
const holderOf = (p) => (p.people ? p.people.find((x) => x !== "sam") || p.people[0] : p.ag);
function sumFaces(z, here) {
  const ks = [...new Set(z === "talk" ? here.flatMap((p) => p.people.filter((x) => x !== "sam")) : here.map(holderOf).filter(Boolean))].slice(0, 5);
  return <Stack ids={ks} size={16} face={(k, s) => (AGENTS[k] ? <AgentMark id={k} size={s} /> : <Pp k={k} size={s} />)} />;
}
function sumText(z, here) {
  if (!here.length) return EMPTY[z];
  if (z === "talk") { const f = here.find((p) => p.fresh) || here[0]; return f.last ? `${f.last.who === "sam" ? "You" : nm(f.last.who)} in ${f.t}: ${f.last.text}` : f.t; }
  if (z === "moving") { const st = here.filter((p) => p.stalled || p.j?.st === "wait"); return st.length ? `${st.length} waiting: ${st.map((p) => p.t).join(", ")}` : "Nothing stuck"; }
  return `Latest: ${here[here.length - 1].t}`;
}
const whoOf = (c) => { const o = c.people.filter((x) => x !== "sam").map(nm), b = (c.bots || []).map(nm);
  return o.length === 1 && !b.length ? `Only you and ${o[0]}` : `You, ${o.join(" and ")}${b.length ? `, with ${b.join(" and ")}` : ""}`; };
const cstOf = (c) => (c.ask ? `${nm(c.ask)} asked you` : c.fresh ? "New" : "Talking");

function ChatCard({ c, spring, hidden, onOpen }) {
  return (
    <motion.article data-piece={c.k} layoutId={`fd-${c.k}`} layout="position" transition={{ layout: spring, opacity: { duration: hidden ? 0.08 : 0.2 } }}
      className="fd-card fd-chat is-open" initial={{ opacity: 0 }} animate={{ opacity: hidden ? 0 : 1 }}
      onClick={(e) => { const b = e.target.closest("button, [role=button]"); if (b && b !== e.currentTarget) return; onOpen(); }} tabIndex={0} role="button" aria-label={`Open ${c.t}`}
      onKeyDown={(e) => { if (e.key === "Enter" && e.target === e.currentTarget) onOpen(); }}>
      <div className="fd-c-clip"><div className="fd-c-body"><div className="fd-c-txt">
        <div className="fd-c-top"><span className="fd-ppl">{c.people.filter((x) => x !== "sam").map((k) => <Pp key={k} k={k} size={16} />)}{(c.bots || []).map((k) => <AgentMark key={k} id={k} size={16} />)}</span>
          <span className={`fd-c-st${c.ask ? " is-need" : ""}`}>{cstOf(c)}</span></div>
        <div className="fd-p-t"><b>{c.t}</b></div>
        <AnimatePresence mode="wait" initial={false}><motion.p key={String(c.last?.text || c.t)} className="fd-p-l fd-clamp" initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -3 }} transition={{ duration: 0.2 }}>{c.line}</motion.p></AnimatePresence>
        <p className="fd-p-m">{whoOf(c)}{c.work?.length ? ` · ${c.work.length} ${c.work.length === 1 ? "piece" : "pieces"} of work` : ""}</p>
      </div></div></div>
    </motion.article>
  );
}

// you and one person: only what you're both in (chats, hand-offs, work from a chat). Their own work stays theirs
function PersonPop({ pop, items, onClose, onOpen }) {
  const ref = useRef(null), [hv, setHv] = useState(null), at = useRef({ x: 100, w: 260 });
  useEffect(() => {
    const d = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest(".fd-pp.is-tap")) onClose(); };
    const k = (e) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", d); window.addEventListener("keydown", k);
    return () => { document.removeEventListener("pointerdown", d); window.removeEventListener("keydown", k); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const mine = items.filter((p) => (p.people || []).includes(pop.k));
  const x = Math.min(pop.x, window.innerWidth - 300);
  return (
    <motion.div ref={ref} className="fd-pop" role="dialog" aria-label={`You and ${nm(pop.k)}`} style={{ left: x, top: pop.y + 8 }}
      initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }} transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}>
      <p className="fd-pop-h"><Pp k={pop.k} size={18} /><b>You and {nm(pop.k)}</b></p>
      {mine.length ? <ul>{mine.map((p) => (
        <li key={p.k} onPointerEnter={(e) => { const b = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - b.left, w: b.width }; setHv(p.k); }} onPointerLeave={() => setHv((h) => (h === p.k ? null : h))}>
          <AnimatePresence>{hv === p.k && <RowHover key="h" o={at.current} t={{ type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }} />}</AnimatePresence>
          <button type="button" onClick={() => onOpen(p)}><span className="fd-pop-t">{p.t}</span><span className="fd-pop-s">{p.kind === "chat" ? cstOf(p) : stOf(p)}</span></button></li>))}</ul>
        : <p className="fd-pop-e">Nothing you’re in together right now.</p>}
      <p className="fd-pop-n">Only what you’re both in. The rest of {nm(pop.k)}’s work stays theirs.</p>
    </motion.div>
  );
}

// ------------------------------------------------------------------ a piece, opened
// One shape for every piece, like an opened chart: on the left what it is and the picture of what it's looking at; on the
// right who has it, the steps as one list (done, now, what's left, what it leads to, and any note you've added), a line
// to tell the agent how to do it, and your call. "Continue in North" is the only door out, and it says where it goes.
const LATE_PLAN = ["Pulling late-stage new-logo deals from HubSpot.", "Ordering them by expected close date."];
function stepsOf(p, d, parked, notes, ho = {}) {
  const S = [], add = (t, s) => S.push({ t: t.replace(/\.$/, ""), s });
  if (p.handoff) {
    add("Closed Oct 22 · $24.0K new ARR", "done");
    add("Hand to Jordan", ho.sent ? "done" : parked ? "next" : "you");
    add(ho.taken ? "Jordan took it" : "Jordan takes it", ho.taken ? "done" : ho.sent ? "now" : "next");
    add(ho.booked ? "Jordan booked the Felix setup call" : "Jordan books the Felix setup call", ho.booked ? "done" : ho.taken ? "now" : "next");
    add("Felix goes live", ho.booked ? "now" : "then");
    return S;
  }
  if (p.k === "follow") {
    ["Read the last 20 lost demos", "Found 11 with no follow-up within two days", "Drafted a follow-up for each of the 11"].forEach((t) => add(t, "done"));
    if (p.act) { add("Send them from you", parked ? "next" : "you"); add("Watch for replies and tell you who answers", "next"); }
    else { add("Sent from you", "done"); add("Watching for replies", "now"); }
  } else if (p.k === "review") {
    ["Read the last 20 lost demos", "14 were booked by outbound after Oct 14", "11 had no follow-up within two days"].forEach((t) => add(t, "done"));
    add("Send 11 lost-demo follow-ups", "then");
  } else {
    const waitingGo = p.act && p.j?.st === "need";
    const plan = waitingGo ? (p.k === "late" ? LATE_PLAN : p.plan ? NA()?.detail(p.plan.id)?.plan || [] : []) : d?.plan || [];
    const k = waitingGo ? 0 : d?.k || 0, run = p.j?.st === "run";
    if (waitingGo) add("Your OK to start", parked ? "next" : "you");
    plan.forEach((t, i) => add(t, p.j?.st === "done" || i < k ? "done" : run && i === k ? "now" : "next"));
    if (p.j?.st === "wait") add(p.j.wait, "now");
    if (p.k === "late") add("Push the deals that can still close in October", "then");
    const then = d?.next || (d?.led && d.led !== "Review the last 20 lost demos" ? d.led : null);
    if (then) add(then, "then");
  }
  notes.forEach((t) => S.splice(Math.max(0, S.findIndex((x) => x.s !== "done")), 0, { t: `“${t}”`, s: "note" }));
  return S;
}
// the opened piece's first words: its figures, one sentence a line (the story under it no longer repeats them).
// Pieces without figures say what the work is.
function leadOf(p, d) {
  if (p.k === "late") { const oct = sumK(OCT); return [<><b>${oct}K</b> can still close in October across {OCT.length} deals.</>, <><b>${GOAL}K</b> gets New ARR back on pace.<span className="fd-hint"> Open a deal for who’s on it and what could stop it.</span></>]; }
  if (p.k === "list") { const st = p.j?.st, scored = st === "done" ? 14 : st === "run" ? Math.round((d?.prog || 0) * 14) : 0;
    return st === "done" ? [<><b>14</b> open prospects, strongest first.</>, <span className="fd-hint">Open one to see why it’s there.</span>]
      : scored ? [<><b>{scored} of 14</b> scored so far.</>, <>Orin orders them by who’s most likely to book.</>]
      : [<><b>14</b> open prospects you left on Outbound, not ranked yet.</>, <>Orin orders them by who’s most likely to book, strongest first.</>]; }
  if (p.k === "logos") return [<><b>55</b> new logos in October so far, against a pace of <b>73</b> and a target of <b>85</b>.</>, <>Orin finds out why New Business is signing fewer than its pace.</>];
  return null;
}
// the steps fold to the one that matters now (yours, or what's running), plus anything you added; open them for the rest
const liveOf = (S) => { const i = S.findIndex((x) => x.s === "you" || x.s === "now"); return i >= 0 ? i : Math.max(0, S.findIndex((x) => x.s !== "done")); };
const STEP_K = { now: "Now", you: "Needs you", next: "Next", then: "Then", note: "Your note" };

function Detail({ p, rect, full, mo, parked, said, notes, onClose, onGo, onPark, onNote, M, ho = {} }) {
  const ref = useRef(null), [, tick] = useState(0), [val, setVal] = useState(""), [focus, setFocus] = useState(false), [allSteps, setAllSteps] = useState(false);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 900); return () => clearInterval(t); }, []);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    const d = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest('[class*="dialkit"], [aria-label="Collapse sidebar"], .fd-pop')) onClose(); };
    window.addEventListener("keydown", k); document.addEventListener("pointerdown", d);
    return () => { window.removeEventListener("keydown", k); document.removeEventListener("pointerdown", d); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const d = p.j ? NA()?.detail(p.j.id) : null, a = p.ag && AGENTS[p.ag], tight = full.height < 540;
  const steps = stepsOf(p, d, parked, notes, ho), live = liveOf(steps), lead = leadOf(p, d);
  // the piece's conversation: who's in it, and what they said. For an agent's job it's the agent; for a hand-off, people
  // a hand-off's conversation is Brightwater's conversation in the chat: the same messages, wherever you read them
  const conv = p.handoff ? ((talk.get().threads.find((x) => x.id === "t-bw") || {}).msgs || []) : [];
  const to = p.handoff ? "Jordan and Riley" : a ? a.n : "North";
  const send = (e) => { e.preventDefault(); const q = val.trim(); if (!q) return; onNote(q); setVal(""); };
  const inT = { ...mo.content, delay: 0 };
  const item = { hidden: { opacity: 0, y: 6, filter: "blur(3px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } };
  const out = { opacity: 0, transition: { duration: 0.1 } };
  const stag = (extra = 0) => ({ show: { transition: { delayChildren: mo.delay + extra + mo.dur * 0.35, staggerChildren: mo.stagger } } });
  const row = !!rect && rect.height < 90; // opened from a table row
  return (
    <motion.div ref={ref} className="fd-open" role="dialog" aria-label={p.t}
      initial={{ ...rect, opacity: 1 }} animate={{ ...full, opacity: 1 }}
      // it folds all the way back into its slot, wearing the piece's own face, and only then hands over to the piece
      exit={{ ...rect, opacity: 0, transition: { default: mo.close, opacity: { duration: 0.08, delay: mo.cdur } } }}
      transition={{ default: mo.open }}>
      <motion.div className="mt-clip" initial={{ borderRadius: row ? 0 : 8.75 }} animate={{ borderRadius: 12 }} exit={{ borderRadius: row ? 0 : 8.75 }} transition={mo.open}>
        <div className="mt-body">
          {/* the piece's face: hidden while open, back as it folds home */}
          <motion.div className={`fd-o-face${row ? " is-row" : ""}`} style={{ width: rect.width }} initial={{ opacity: 0 }} animate={{ opacity: 0 }} exit={{ opacity: 1, transition: { duration: 0.16, delay: mo.cdur * 0.25 } }}>
            {row ? <b>{p.t}</b> : <>
              <div className="fd-c-top">{p.pr ? <Prio v={p.pr} /> : <span />}<span className="fd-c-st">{stOf(p, parked)}</span></div>
              <div className="fd-p-t"><b>{p.t}</b></div><p className="fd-p-l">{p.line}</p></>}
          </motion.div>
          <div className={`fd-o-in${tight ? " is-tight" : ""}`} style={{ width: full.width - 2.18, height: full.height - 2.18 }}>
            <motion.div className="fd-o-l" initial="hidden" animate="show" exit={out} variants={stag()}>
              <motion.div className="fd-o-meta" variants={item} transition={inT}>
                {p.pr ? <Prio v={p.pr} long /> : null}
              </motion.div>
              <motion.h2 variants={item} transition={inT}>{p.t}</motion.h2>
              {lead ? <motion.div className="fd-o-desc is-lead" variants={item} transition={inT}>{lead.map((l, i) => <p key={i}>{l}</p>)}</motion.div>
                : p.what && <motion.p className="fd-o-desc" variants={item} transition={inT}>{p.what}</motion.p>}
              <motion.div className="fd-o-story" variants={item} transition={inT}><Story p={p} d={d} tight={tight} M={M} /></motion.div>
              {p.act && <motion.div className="fd-o-calls" variants={item} transition={inT}><Calls p={p} parked={parked} onGo={onGo} onPark={onPark} /></motion.div>}
            </motion.div>
            <motion.div className="fd-o-r" initial="hidden" animate="show" exit={out} variants={stag(0.04)}>
              <motion.div className="mo-tools" variants={item} transition={inT}>
                <span className="fd-o-who">{p.people ? <span className="fd-ppl">{p.people.map((k) => <Pp key={k} k={k} />)}</span> : a && <AgentMark id={p.ag} size={16} />}<b>{p.people ? p.people.map(nm).join(" → ") : a ? a.n : "You"}</b></span>
                <button className="ibtn mo-x" aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }}><svg width="14" height="14" viewBox="0 0 14 14" stroke="var(--navy)" strokeWidth="1.25" strokeLinecap="round"><path d="M3 3l8 8M11 3 3 11" /></svg></button>
              </motion.div>
              <div className="fd-o-sc">
              <motion.ol className={`fd-steps${allSteps ? " is-all" : ""}`} variants={item} transition={inT}>
                <AnimatePresence initial={false}>{steps.map((s, i) => (allSteps || i === live) && (
                  <motion.li key={s.t + i} className={`is-${s.s}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                    <span className="fd-s-in">
                      <span className="fd-s-m">{s.s === "done" ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6.3 4.8 8.5 9.5 3.6" /></svg> : <i />}</span>
                      <span className="fd-s-t">{s.t}</span>
                      <span className="fd-s-tg">{i === live && steps.length > 1 && <button type="button" className="fd-s-x" aria-expanded={allSteps} aria-label={allSteps ? "Show only this step" : `Show all ${steps.length} steps`} onClick={() => setAllSteps((v) => !v)}>
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 4 5 6.5 7.5 4" /></svg></button>}</span>
                      {STEP_K[s.s] && <em>{STEP_K[s.s]}</em>}
                    </span>
                  </motion.li>))}</AnimatePresence>
              </motion.ol>
              {conv.length > 0 && <div className="fd-conv">
                <AnimatePresence initial={false}>{conv.map(([k, at, t], i) => (
                  <motion.div key={k + i + t} className="fd-cm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
                    <Face k={k} size={20} />
                    <div><p className="fd-cm-h"><b>{nm(k)}</b><time>{at}</time></p><p>{t}</p></div>
                  </motion.div>))}</AnimatePresence>
              </div>}
              </div>
              <AnimatePresence initial={false}>{said && !p.handoff && <motion.p key={said.text} className="fd-o-said" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {a && <AgentMark id={said.ag} size={14} />}<span><b>{nm(said.ag)}</b> {said.text}</span></motion.p>}</AnimatePresence>
              {/* the same ask bar as everywhere else (Home's composer, docked size): attach, point at a chart, voice */}
              {p.handoff && <motion.p className="fd-o-to" variants={item} transition={inT}>To {to}</motion.p>}
              {(p.j || p.handoff) && <motion.form className={`composer is-docked fd-o-ask${focus ? " is-focus" : ""}`} variants={item} transition={inT} onSubmit={send}>
                <div className="ask-field">
                  <input value={val} onChange={(e) => setVal(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} aria-label={`Tell ${a ? a.n : "North"} how to do it`} autoComplete="off" />
                  {!val && <span className="ph">{p.handoff ? "Message Jordan…" : `Tell ${a ? a.n : "North"} how to do it…`}</span>}
                </div>
                <button type="button" className="ibtn ibtn-lg" aria-label="Attach"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--navy)" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true"><path d="M10 3.5v13M3.5 10h13" /></svg></button>
                <button type="button" className="ibtn ibtn-lg ask-aim" aria-label="Point at a chart"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--navy)" strokeWidth="1.4" aria-hidden="true"><circle cx="10" cy="10" r="7.6" /><circle cx="10" cy="10" r="4.5" /><circle className="dot" cx="10" cy="10" r="1.75" fill="var(--navy)" stroke="none" /></svg></button>
                <motion.button type="submit" className="voice" aria-label={val.trim() ? "Add the note" : `Talk to ${a ? a.n : "North"}`} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
                  <span className="bars">{[5, 9, 13, 9, 5].map((h, i) => <motion.i key={i} animate={focus ? { scaleY: [1, 1.6, 0.7, 1] } : { scaleY: 1 }} transition={focus ? { duration: 0.9, repeat: Infinity, delay: i * 0.08 } : { duration: 0.2 }} style={{ height: h }} />)}</span>
                </motion.button>
              </motion.form>}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ------------------------------------------------------------------ the picture on an opened piece
// Each one is the thing the job is looking at, so you can see what it's going to find before it finds it. One label size,
// numbers in bold navy inside the sentence they belong to; marks in the series purple with grain, the rest in the well grey.
const PURPLE = C.purple, WELL = C.well;
function Story({ p, d, tight, M }) {
  if (p.handoff) return <BriefStory sent={p.stTxt != null} />;
  if (p.k === "late") return <DealsStory p={p} tight={tight} />;
  if (p.k === "follow") return <LostStory rows={[[11, "had no follow-up within two days. Each now has one drafted, ready to go out from you.", "got a follow-up in time"]]} />;
  if (p.k === "held" || p.k === "review") return <LostStory rows={[[14, "were booked by outbound after Oct 14", "came in some other way"], [11, "had no follow-up within two days", "got a follow-up in time"]]} />;
  if (p.k === "list") return <ListStory p={p} d={d} tight={tight} />;
  if (p.k === "logos") return <LogosStory M={M} tight={tight} />;
  return null;
}
// a row you can point at and open: the highlight grows out from the cursor (the sidebar's hover), and a click opens what's
// behind the row right under it, in place
function HRows({ cols, head, rows, hv, setHv, tight }) {
  const [open, setOpen] = useState(null), at = useRef({ x: 100, w: 600 });
  return (
    <div className={`fd-hr-t${tight ? " is-tight" : ""}`} role="table">
      <div className="fd-hr is-h" role="row" style={{ gridTemplateColumns: cols }}>{head.map((h, i) => <span key={i} role="columnheader" className={`fd-hc${i === 0 ? " is-first" : ""}${i === head.length - 1 ? " is-last" : ""}`}>{h}</span>)}</div>
      {rows.map((r) => (
        <React.Fragment key={r.id}>
          <div role="row" tabIndex={0} aria-expanded={open === r.id} className={`fd-hr${r.dim ? " is-dim" : ""}${open === r.id ? " is-open" : ""}`} style={{ gridTemplateColumns: cols }}
            onPointerEnter={(e) => { const b = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - b.left, w: b.width }; setHv(r.id); }}
            onPointerLeave={() => setHv((h) => (h === r.id ? null : h))}
            onClick={() => setOpen((o) => (o === r.id ? null : r.id))} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpen((o) => (o === r.id ? null : r.id)))}>
            {r.cells.map((c, i) => <span key={i} role="cell" className={`fd-hc${i === 0 ? " is-first" : ""}${i === r.cells.length - 1 ? " is-last" : ""}`}>{c}</span>)}
            <AnimatePresence>{(hv === r.id || open === r.id) && <RowHover key="h" o={at.current} t={{ type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }} />}</AnimatePresence>
          </div>
          <AnimatePresence initial={false}>{open === r.id && (
            <motion.div key="x" className="fd-hr-x" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
              <div className="fd-hr-xi">{r.more}</div>
            </motion.div>)}</AnimatePresence>
        </React.Fragment>))}
    </div>
  );
}
// a hand-off's brief, as North drafted it from the deal's history: what's done, what's open, what to watch
function BriefStory({ sent }) {
  return (
    <div className="fd-sty">
      <p className="fd-sty-l">What Jordan gets with it</p>
      <dl className="fd-brief">{BRIEF.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      <p className="fd-sty-note">{sent ? "Sent to Jordan with the hand-off." : "Drafted by North from the deal’s history. Tell it what to change in the conversation before you send."}</p>
    </div>
  );
}
// a person's mark: their photo (their initial on their colour when there is none)
function Pp({ k, size = 16 }) {
  const tap = k !== "sam" && PPL[k];
  const go = (e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); window.dispatchEvent(new CustomEvent("north:person", { detail: { k, x: r.left, y: r.bottom } })); };
  const me = k === "sam" && getWho() !== "sam", ph = me ? null : PHOTOS[k];
  if (me) return <span className="fd-pp is-me" style={{ width: size, height: size, fontSize: Math.round(size * 0.48) }}>{(SEAT_NAME[getWho()] || "You")[0]}</span>;
  return <span className={`fd-pp is-${k}${tap ? " is-tap" : ""}${ph ? " is-ph" : ""}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.48), ...(ph ? { backgroundImage: `url(${ph})` } : {}) }}
    {...(tap ? { role: "button", tabIndex: 0, title: `You and ${nm(k)}`, onClick: go, onKeyDown: (e) => e.key === "Enter" && go(e) } : {})}>{ph ? null : nm(k)[0]}</span>;
}
// whoever said it: a person's initial, an agent's face, or North's mark
function Face({ k, size = 16 }) { return k === "north" ? <span className="fd-nm" style={{ width: size, height: size }}><NorthLogo size={Math.round(size * 0.8)} /></span> : AGENTS[k] ? <AgentMark id={k} size={size} /> : <Pp k={k} size={size} />; }
// a count out of a small whole, as a row of ticks set close together (the running-total ticks' shape, not stretched).
// Point at it and the ones it counts stay lit while the rest step back, with the count beside your cursor
const TW = 8, TP = 12;
function CountTicks({ n, of, h: TH = 40, label, rest }) {
  const w = (of - 1) * TP + TW, [hv, setHv] = useState(null);
  const on = hv != null && hv < n;
  return (
    <div className="fd-ct-w" onPointerLeave={() => setHv(null)}>
      <svg className="fd-ct" width={w} height={TH} viewBox={`0 0 ${w} ${TH}`} role="img" aria-label={`${n} of ${of}`}
        onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); setHv(Math.max(0, Math.min(of - 1, Math.floor((e.clientX - r.left) / TP)))); }}>
        {Array.from({ length: of }, (_, i) => { const x = i * TP, lit = i < n, dl = 0.3 + (i / of) * 0.45, dim = hv != null && (i < n) !== on;
          return lit ? <motion.rect key={i} x={x} width={TW} rx={1} fill={PURPLE} filter="url(#grain)" initial={{ y: TH, height: 0 }} animate={{ y: 0, height: TH, opacity: dim ? 0.35 : 1 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: hv == null ? dl : 0, opacity: { duration: 0.2, delay: 0 } }} />
            : <motion.rect key={i} x={x} y={0} width={TW} height={TH} rx={1} fill={hv != null && !on ? "#d9d6d2" : WELL} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: dl }} />; })}
      </svg>
      <AnimatePresence>{hv != null && <motion.span key="t" className="fd-ct-tip" initial={{ opacity: 0, y: 2 }} animate={{ opacity: 1, y: 0, left: w + 14 }} exit={{ opacity: 0 }} transition={{ duration: 0.15, left: { type: "spring", visualDuration: 0.18, bounce: 0 } }}>
        {on ? <><b>{n}</b> {label}</> : <><b>{of - n}</b> {rest}</>}</motion.span>}</AnimatePresence>
    </div>
  );
}
// the last 20 lost demos: a row of 20 ticks per thing they have in common (the lost-demo review's numbers)
function LostStory({ rows }) {
  return (
    <div className="fd-sty">
      {rows.map(([n, l, rest]) => (
        <div key={l} className="fd-sty-row">
          <p className="fd-sty-l"><b>{n} of the last 20</b> lost demos {l}</p>
          <CountTicks n={n} of={20} label={l.split(".")[0]} rest={rest} />
        </div>))}
    </div>
  );
}
// the late-stage deals laid end to end by close date, sized by ARR, against the $140K gap (the segment bar every opened
// chart uses): the six that can close in October just clear it, so every one counts. Point at a deal (in the bar or the
// list) and it lights in both; open a row for who's on it and what could stop it. SAMPLE deals, and it says so.
function DealsStory({ p, tight }) {
  const by = [...DEALS].sort((a, b) => new Date(`${a.close} 2026`) - new Date(`${b.close} 2026`)), tot = sumK(DEALS), oct = sumK(OCT);
  let x = 0; const segs = by.map((dl) => { const s = { ...dl, x: (x / tot) * 100, w: (dl.arr / tot) * 100, oct: /^Oct/.test(dl.close) }; x += dl.arr; return s; });
  const gx = (GOAL / tot) * 100, ranked = p.j?.st === "done", [hv, setHv] = useState(null);
  const more = (dl) => (
    <div className="fd-more">
      <p><b>{dl.champ[0]}</b>, {dl.champ[1]} · {dl.city}, {dl.agents} agents · came in through {dl.src} · last touch {dl.touch.toLowerCase()}</p>
      {dl.threats.length ? dl.threats.map((t) => <p key={t.k} className="fd-more-r"><b>{THREATS[t.k].t}</b> {THREATS[t.k].say}</p>) : <p className="fd-more-r">Nothing in the way right now.</p>}
    </div>);
  return (
    <div className="fd-sty">
      <div className="fd-deal-bar" role="img" aria-label={`${OCT.length} October deals worth $${oct}K against a $${GOAL}K gap`} onPointerLeave={() => setHv(null)}>
        <span className="fd-deal-gap" style={{ left: `${gx}%` }}><em>${GOAL}K</em></span>
        {segs.map((s, i) => <motion.i key={s.id} className="grain" onPointerEnter={() => setHv(s.id)} style={{ left: `calc(${s.x}% + 1px)`, width: `calc(${s.w}% - 2px)`, backgroundColor: s.oct ? PURPLE : WELL }}
          initial={{ scaleX: 0 }} animate={{ scaleX: 1, opacity: hv && hv !== s.id ? 0.35 : 1 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: hv ? 0 : 0.3 + i * 0.03, opacity: { duration: 0.2, delay: 0 } }} />)}
        {/* no callout: the row and its piece of the bar light together, the rest steps back */}
      </div>
      <HRows tight={tight} hv={hv} setHv={setHv} cols="minmax(0, 1.6fr) minmax(0, 1fr) minmax(0, 1fr) 56px" head={["Deal", "Stage", "Close", "ARR"]}
        rows={by.map((dl) => ({ id: dl.id, dim: !/^Oct/.test(dl.close), more: more(dl),
          cells: [<span className="fd-dn"><i style={{ background: /^Oct/.test(dl.close) ? PURPLE : WELL }} />{dl.n}</span>, STAGES[dl.stage], dl.close, `$${dl.arr}K`] }))} />
      <p className="fd-sty-note">Sample deals, not from HubSpot. {ranked ? "Ranked by close date." : "Shown by close date until Riley ranks them."}</p>
    </div>
  );
}
// the 14 prospects Sam left on Outbound, as the list Orin hands back: in order, with why. Open a row for how it was
// ranked. Until it's ranked they sit in the order they were left, unscored. SAMPLE prospects, and it says so.
function ListStory({ p, d, tight }) {
  const st = p.j?.st, ranked = st === "done", scored = ranked ? 14 : st === "run" ? Math.round((d?.prog || 0) * 14) : 0, [hv, setHv] = useState(null);
  const rows = ranked ? PROSPECTS : [...PROSPECTS].sort((a, b) => a.n.localeCompare(b.n));
  const more = (r, i) => { const has = ranked || PROSPECTS.indexOf(r) < scored;
    return has ? <div className="fd-more">
        <p>{ranked ? <><b>#{i + 1} of 14.</b> </> : null}{r.why}.</p>
        <p className="fd-more-r"><b>Fit {r.fit} of 100</b> How close {r.n} is to the new logos Fello signs, starting with team size ({r.agents} agents).</p>
        <p className="fd-more-r"><b>Engagement</b> {r.engaged}. More recent counts for more.</p>
      </div> : <div className="fd-more">
        {/* before it's scored: what Orin will weigh, already on the table, so the open row is about the prospect, not the wait */}
        <p><b>{r.agents} agents</b> {r.agents >= 50 ? "Over 50, the size of team that books demos." : r.agents >= 30 ? "Just under the 50-plus teams that book most demos." : "Small for now: under the 30 that usually buy."}</p>
        <p className="fd-more-r"><b>Last touch</b> {r.engaged}.</p>
        <p className="fd-more-q">{st === "run" ? "Orin is scoring the list now; this one gets its fit score shortly." : "No fit score yet. Say go and Orin weighs both: fit first, then how recently they engaged."}</p>
      </div>; };
  return (
    <div className="fd-sty">
      <HRows tight={tight} hv={hv} setHv={setHv} cols={ranked ? "24px minmax(0, 1.4fr) 56px 40px minmax(0, 1.3fr) minmax(0, 1.7fr)" : "minmax(0, 1.4fr) 56px 40px minmax(0, 1.4fr)"}
        head={ranked ? ["#", "Prospect", "Agents", "Fit", "Last touch", "Why here"] : ["Prospect", "Agents", "Fit", "Last touch"]}
        rows={rows.map((r, i) => { const has = ranked || PROSPECTS.indexOf(r) < scored;
          const cells = [<b className="fd-pn">{r.n}</b>, r.agents, has ? <b className="fd-fitn">{r.fit}</b> : <span className="fd-mute">–</span>, r.engaged];
          return { id: r.id, more: more(r, i), cells: ranked ? [<span className="fd-mute">{i + 1}</span>, ...cells, r.why] : cells }; })} />
      <p className="fd-sty-note">Sample prospects, not from HubSpot.</p>
    </div>
  );
}
// new logos by month: Company health's own series, drawn with the opened chart's monthly bars
function LogosStory({ M, tight }) {
  const box = useRef(null), [w, setW] = useState(600);
  useLayoutEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width))); ro.observe(el); setW(el.clientWidth); return () => ro.disconnect(); }, []);
  const p = useReplay("fd-logos", (M && M.open && M.open.draw) || { type: "easing", duration: 0.9, ease: [0, 0, 1, 1] }, { delay: 0.35 });
  return (
    <div className="fd-sty">
      <div ref={box} className="fd-mb">
        <GeoCtx.Provider value={geo(Math.min(w, 641), tight ? 150 : 190)}>
          <MonthlyBars p={p} color={PURPLE} vals={[77, 91, 63, 78, 77, 55]} lo={0} hi={100} ticks={[0, 25, 50, 75, 100]} fmt={(v) => String(v)} tgt={85} tLabel="Target 85" valFmt={(v) => String(Math.round(v))} />
        </GeoCtx.Provider>
      </div>
    </div>
  );
}

// the score under the board: New ARR through October as a line by day, in the opened chart's pace grammar. Actual runs in
// the lane's status colour with stripes (92% of pace is on track by Company health's rule, so teal); pace is the coral
// line to today's $1.66M, then dotted to the $1.74M target; the gap at today is the $140K; the last four days are shaded.
// Today's three figures are Company health's. The day-by-day path between Oct 1 and today is drawn, not measured
// (the same way the opened chart's pace lens draws it), and the chart says so.
const P92 = 92;
function Score({ onAsk }) {
  const st = status(P92), col = ST_C[st] || C.mute;
  const box = useRef(null), [w, setW] = useState(1100);
  useLayoutEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width))); ro.observe(el); setW(el.clientWidth); return () => ro.disconnect(); }, []);
  const p = useReplay("fd-score", { type: "easing", duration: 1.1, ease: [0, 0, 1, 1] }, { delay: 0.2 });
  const H = 300, x0 = 48, top = 16, base = H - 26, lo = 0, hi = 1.8, now = 1.52, pace = 1.66, tgt = 1.74, today = 27;
  const X = (d) => x0 + ((d - 1) / 30) * (w - x0 - 8), Y = (v) => base - ((v - lo) / (hi - lo)) * (base - top);
  const pts = []; for (let d = 1; d <= today; d++) pts.push([X(d), Y((now * (d - 1)) / (today - 1) + (d > 1 && d < today ? 0.03 * Math.sin(d * 0.9) : 0))]);
  const E = (t) => 1 - Math.pow(1 - t, 3), win = (a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
  const sx = x0 + (X(today) - x0) * E(win(0.1, 0.8)), pc = E(win(0, 0.6)), dot = win(0.78, 0.95);
  const at = (x) => { let k = 1; while (k < pts.length - 1 && pts[k][0] < x) k++; const [xa, ya] = pts[k - 1], [xb, yb] = pts[k]; return ya + ((yb - ya) * (x - xa)) / (xb - xa); };
  const stripes = []; for (let x = pts[0][0] + 2; x < pts[pts.length - 1][0]; x += 4) stripes.push(x);
  const T = (props) => <text fontSize="12" fontWeight="500" fill={C.mute} style={{ fontVariantNumeric: "tabular-nums" }} {...props} />;
  // hover any day: a guide drops to it, the pace for that day (and, today, where New ARR actually stands) in the system tip.
  // Between Oct 1 and today only the pace is a figure; the teal path there is drawn, so the tip doesn't quote it
  const [hv, setHv] = useState(null);
  const paceAt = (d) => (d <= today ? (pace * (d - 1)) / (today - 1) : pace + ((tgt - pace) * (d - today)) / (31 - today));
  const M$ = (v) => (v >= 1 ? `$${v.toFixed(2)}M` : `$${Math.round(v * 1000)}K`);
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left; if (x < x0 - 6) return setHv(null);
    setHv(Math.max(1, Math.min(31, Math.round(1 + ((x - x0) / (w - x0 - 8)) * 30)))); };
  const tip = hv == null ? null : hv === today
    ? { eyebrow: "Today · Oct 27", title: "$1.52M", rows: [{ c: col, k: "New ARR so far", v: "$1.52M" }, { c: C.coral, k: "Pace by today", v: "$1.66M" }, { k: "Behind pace", v: "$140K" }] }
    : hv < today ? { eyebrow: `Oct ${hv}`, title: M$(paceAt(hv)), rows: [{ c: C.coral, k: "Pace by this day", v: M$(paceAt(hv)) }, { k: "Daily New ARR isn’t tracked here" }] }
    : { eyebrow: `Oct ${hv}`, title: M$(paceAt(hv)), rows: [{ c: C.coral, k: hv === 31 ? "October target" : "Pace by this day", v: M$(paceAt(hv)) }, { k: "To book from today", v: M$(paceAt(hv) - now) }] };
  const tipY = hv == null ? 0 : Math.min(Y(paceAt(hv)), hv <= today ? at(X(hv)) : Y(paceAt(hv)));
  return (
    <div className="fd-score">
      <div className="fd-score-top">
        <div className="fd-sc"><small>New ARR in October so far</small><p className="fd-huge">{SCORE.v}</p></div>
      </div>
      <div ref={box} className={`fd-line${hv != null ? " is-hov" : ""}`} onPointerMove={move} onPointerLeave={() => setHv(null)} onClick={() => hv != null && onAsk && onAsk(hv === today ? "Why is New ARR $140K behind pace?" : `What does New ARR need by Oct ${hv}?`)} role="img" aria-label="New ARR by day in October: $1.52M today against a $1.66M pace, $1.74M target by Oct 31">
        <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`}>
          {[0, 0.5, 1, 1.5].map((v) => <g key={v}><line x1={x0} x2={w} y1={Y(v) + 0.25} y2={Y(v) + 0.25} stroke={v === 0 ? "#c9c4bf" : C.line} strokeWidth={v === 0 ? 1 : 0.5} />
            <T x={x0 - 8} y={Y(v) + 4} textAnchor="end">{v === 0 ? "$0" : `$${v.toFixed(1)}M`}</T></g>)}
          <defs><clipPath id="fd-score-sweep"><rect x="0" y="0" width={sx} height={H} /></clipPath></defs>
          <g clipPath="url(#fd-score-sweep)">
            {stripes.map((x) => <line key={x} x1={x} x2={x} y1={at(x)} y2={base} stroke={col} strokeOpacity="0.4" strokeWidth="0.5" />)}
            <path d={pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("")} fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" />
          </g>
          <line x1={X(1)} y1={Y(0)} x2={X(1) + (X(today) - X(1)) * pc} y2={Y(0) + (Y(pace) - Y(0)) * pc} stroke={C.coral} strokeWidth="1.5" />
          <line x1={X(today)} y1={Y(pace)} x2={X(31)} y2={Y(tgt)} stroke={C.coral} strokeWidth="1.5" strokeDasharray="0.1 3.2" strokeLinecap="round" opacity={dot} />
          <g opacity={dot}>
            <line x1={X(today)} x2={X(today)} y1={Y(pace) + 5} y2={Y(now) - 5} stroke={C.navy} strokeWidth="1" />
            <circle cx={X(today)} cy={Y(pace)} r="4" fill={C.coral} />
            <T x={X(today) - 10} y={Y(pace) - 10} textAnchor="end" fill={C.coral} fontWeight="600">Pace $1.66M</T>
            <circle cx={X(today)} cy={Y(now)} r="4.5" fill={col} />
            <T x={X(today) + 10} y={Y(now) + 18} fill={col} fontWeight="600">$1.52M</T>
            <circle cx={X(31)} cy={Y(tgt)} r="4" fill={C.coral} />
            <T x={X(31)} y={Y(tgt) - 10} textAnchor="end" fill={C.coral} fontWeight="600">$1.74M target</T>
          </g>
          {hv != null && <g pointerEvents="none">
            <line x1={X(hv)} x2={X(hv)} y1={top - 14} y2={base} stroke={C.navy} strokeWidth="0.75" strokeDasharray="2 2" />
            <circle cx={X(hv)} cy={Y(paceAt(hv))} r="4" fill={C.coral} />
            {hv <= today && <circle cx={X(hv)} cy={at(X(hv))} r={hv === today ? 5 : 3.5} fill={col} />}
          </g>}
          {[[1, "Oct 1"], [8, "Oct 8"], [15, "Oct 15"], [22, "Oct 22"], [today, "Today"], [31, "Oct 31"]].map(([d, t]) => (
            <T key={d} x={d === 31 ? w : d === 1 ? X(1) : X(d)} y={base + 18} textAnchor={d === 31 ? "end" : d === 1 ? "start" : "middle"} fill={d === today ? C.navy : C.mute} fontWeight={d === today ? 600 : 500}>{t}</T>))}
        </svg>
        <AnimatePresence>{tip && <motion.div key="t" className="tip tip-level fd-ltip" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1, left: Math.min(Math.max(X(hv), 120), w - 120), top: tipY }} exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={{ duration: 0.18, left: { type: "spring", visualDuration: 0.2, bounce: 0 }, top: { type: "spring", visualDuration: 0.2, bounce: 0 } }}
          style={{ x: "-50%", translate: "0 calc(-100% - 12px)", transformOrigin: "50% 100%" }}>
          <TipBody id={hv} eyebrow={tip.eyebrow} title={tip.title} rows={tip.rows} /></motion.div>}</AnimatePresence>
      </div>
      <p className="fd-sty-note">Today’s figures are Company health’s. The path between Oct 1 and today is drawn, not daily data.</p>
    </div>
  );
}

// ------------------------------------------------------------------ New business, as a space
// A page you look at: the number, North's one sentence, an ask scoped to here, and one quiet line for what's going on in it
// (the conversations live in the chat, the agents show as faces). Everything on it is pointable: point, ⌘K, @ someone
export function NewBusinessSpace({ M, ask, numbers, onAsk }) {
  const [T, setT] = useState(() => talk.get()); useEffect(() => talk.sub(setT), []);
  const [js] = useJobs();
  // the page's band ends under its header, as on Home
  const band = useRef(null);
  useLayoutEffect(() => {
    const a = band.current, c = a && a.closest(".content"), st = document.documentElement.style; if (!a || !c) return;
    const set = () => st.setProperty("--band-h", `${Math.round(a.getBoundingClientRect().bottom - c.getBoundingClientRect().top + 24)}px`);
    const ro = new ResizeObserver(set); ro.observe(a); set(); return () => ro.disconnect();
  }, []);
  const convs = T.threads, waiting = convs.filter((t) => t.ask), working = [...new Set(js.filter((j) => j.st === "run").map((j) => j.ag))];
  const here = [...new Set([...convs.flatMap((t) => t.people || []), ...(convs.flatMap((t) => t.ags || [])), ...working])].filter((k) => k !== "sam").slice(0, 5);
  const bits = [convs.length && `${convs.length} conversation${convs.length > 1 ? "s" : ""} here`, waiting.length && `${waiting.length} waiting on you`, working.length && (working.length > 2 ? `${working.length} agents working` : `${working.map(nm).join(" and ")} working`)].filter(Boolean);
  const openTalk = () => { const t = waiting[0] || convs[0]; if (t) talk.open(t.id); else onAsk(""); };
  return (
    <div className="nb">
      <div className="nb-head">
        <h1>New business</h1>
        {here.length > 0 && <button type="button" className="nb-here" onClick={openTalk} title="Who's in the conversations and work here">
          <Stack ids={here} size={22} face={(k, s) => (AGENTS[k] ? <AgentMark id={k} size={s} /> : <Pp k={k} size={s} />)} />
          {bits.length > 0 && <span>{bits[0]}{waiting.length ? <em> · {waiting.length} waiting on you</em> : null}</span>}</button>}
      </div>
      <p className="nb-north" ref={band}><NorthLogo size={14} /><span>The late-stage deals are the only work here that can still close the gap this month.</span></p>
      <section className="nb-nums fd-nums" aria-label="New business numbers"><Score onAsk={onAsk} />{numbers}</section>
    </div>
  );
}

// ------------------------------------------------------------------ opened in place: one thing at a time, where you are
// Open anything on Home and it grows out of its own row to fill your work, the way a chart opens out of its tile; close it and
// it folds back into that row. The row's face and name become its header. ↑↓ (or j/k) move to the next or previous thing
// in place; nothing moves you on by itself. Esc, or a click outside, folds it home.
const WIDEN = { duration: 0.5, ease: [0.32, 0.72, 0, 1] }; // the same glide the file beside it uses, so card and file move as one
function Grown({ rect, full, mo, items, cur, onPick, onExit, P, T, parked, said, notes, ho, M, onGo, onNote, files }) {
  const ref = useRef(null), land = useRef(null), present = useIsPresent();
  // it opens straight down from its row and closes straight back: the box keeps the card's width the whole way (the row
  // sits inset in the card, so growing from the row's own edges read as a slide up and to the left)
  const row = rect && { ...rect, left: full.left, width: full.width };
  // and it lands as the row itself: as it closes, the row's face, title, line and button come up inside it, so when it
  // arrives it already is the row, and the swap underneath can't be seen
  useLayoutEffect(() => { if (present) return; const host = land.current, st = ref.current && ref.current.closest(".fd-stage"), src = st && st.querySelector(`.fd-under [data-piece="${cur}"]`);
    if (!host || !src) return; const c = src.cloneNode(true); c.removeAttribute("data-piece"); c.querySelectorAll(".chs-hover, .hv-fill").forEach((x) => x.remove());
    Object.assign(c.style, { position: "absolute", inset: "0", margin: "0", opacity: "1", transform: "none" }); host.appendChild(c); }, [present]); // eslint-disable-line react-hooks/exhaustive-deps
  const p = items.find((x) => x.k === cur) || P.find((x) => x.k === cur), i = items.findIndex((x) => x.k === cur);
  const step = (d) => { const n = items[Math.max(0, Math.min(items.length - 1, i + d))]; if (n && n.k !== cur) onPick(n.k); };
  useEffect(() => { const k = (e) => { const a = document.activeElement, typing = a && /INPUT|TEXTAREA/.test(a.tagName);
      // one Esc is one step back: an empty reply field never holds it (a half-written reply keeps its words: Esc leaves the field first)
      if (e.key === "Escape") { if (document.querySelector(".vx, .fm, .sdoc")) return; if (typing && a.value) { a.blur(); return; } if (typing) a.blur(); onExit(); return; }
      // ↑↓ move through your work unless you're writing something (an empty reply field doesn't count)
      // (arrows only: K is North's own key, it brings up the chat everywhere, so it never also moves you through your work)
      if ((typing && a.value) || e.metaKey || e.ctrlKey || e.altKey) return;
      const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0; if (d) { e.preventDefault(); step(d); } };
    const out = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest('[class*="dialkit"], .side, .vx, .chat-shell, .fd-pop, .fm, .fm-veil, [aria-label="Collapse sidebar"]')) onExit(); };
    addEventListener("keydown", k); document.addEventListener("pointerdown", out);
    return () => { removeEventListener("keydown", k); document.removeEventListener("pointerdown", out); }; });
  // a file opened beside the conversation takes the room the page has on the right: the card widens to the main card's
  // edge (23px in, the standard gap), so the conversation keeps its width and the file gets the rest
  const [wide, setWide] = useState(0), grown = useRef(false), fullW = useRef(full.width); fullW.current = full.width;
  useEffect(() => { const d = (e) => { const g = ref.current; if (!g || !g.contains(e.detail.host)) return;
      if (!e.detail.open) { setWide(0); return; } const m = document.querySelector(".main"), r = g.getBoundingClientRect();
      // measured from the card's resting width, not its current one (it may already be wide when one file replaces another)
      setWide(m ? Math.max(0, Math.round(m.getBoundingClientRect().right - 23 - (r.left + fullW.current))) : 0); };
    addEventListener("north:doc", d); return () => removeEventListener("north:doc", d); }, []);
  const box = wide ? { ...full, width: full.width + wide } : full;
  const head = { pos: i >= 0 ? `${i + 1} of ${items.length}` : null, onPrev: i > 0 ? () => step(-1) : null, onNext: i >= 0 && i < items.length - 1 ? () => step(1) : null, onExit };
  // the content is there from the first frame, laid out at its full size and uncovered as the box grows: never an empty box
  return (
    <motion.div ref={ref} className="fd-open fd-grow" role="dialog" aria-label={p ? p.t : "Open item"}
      initial={{ ...row, opacity: 1 }} animate={{ ...box, opacity: 1 }} onAnimationComplete={() => (grown.current = true)}
      exit={{ ...row, opacity: 0, transition: { default: mo.close, opacity: { duration: 0.01, delay: mo.cdur + 0.02 } } }} transition={{ default: grown.current ? WIDEN : mo.open }}>
      <motion.div className="mt-clip" initial={{ borderRadius: 0 }} animate={{ borderRadius: 12 }} exit={{ borderRadius: 0 }} transition={mo.open}>
        <motion.div ref={land} className="gw-land" aria-hidden="true" style={{ left: rect ? rect.left - full.left : 0, width: rect ? rect.width : "100%", height: rect ? rect.height : 0 }}
          initial={{ opacity: 0 }} animate={{ opacity: 0 }} exit={{ opacity: 1, transition: { duration: mo.cdur * 0.5, delay: mo.cdur * 0.3, ease: [0.4, 0, 0.2, 1] } }} />
        <div className="mt-body">
          <motion.div className="gw-in" data-dochost="" style={{ height: full.height - 2.18 }} initial={{ opacity: 1, width: full.width - 2.18 }} animate={{ opacity: 1, width: box.width - 2.18, transition: { width: grown.current ? WIDEN : mo.open } }} exit={{ opacity: 0, transition: { duration: mo.cdur * 0.5, ease: [0.4, 0, 0.2, 1] } }}>
            <AnimatePresence mode="wait" initial={false}>
              {p && <motion.div key={p.k} className="gw-item" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.08 } }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
                {p.kind === "file" || p.k === "review" ? <FxFile p={p} f={p.k === "review" ? REVIEW : FILE_OF(p.k) || DECK} msgs={files[p.k] ? files[p.k].msgs : []} rev={files[p.k] ? files[p.k].rev || {} : {}} head={head} onGo={() => onGo(p)} onNote={(t, s) => onNote(p, t, s)} />
                  : p.rt && ROUTINES[p.rt] && ROUTINES[p.rt].about ? <FxRoutine p={p} head={head} />
                  : p.kind === "thread" || (p.from && (!p.act || p.rt)) ? <FxThread p={p} th={T.threads.find((x) => x.id === (p.kind === "thread" ? p.k : p.from))} P={P} onPick={onPick} head={head} />
                  : <FxWork p={p} parked={parked[p.k]} said={said[p.k]} notes={notes[p.k] || []} ho={ho} M={M} onGo={() => onGo(p)} onNote={(t) => onNote(p, t)} head={head} />}
              </motion.div>}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
// the top of an item: the row it grew from (face, who, what it's about), its one move, and where you are in your work
function FxHead({ who, title, meta, act, onAct, head, bare, titleRef }) {
  const I = (d) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--navy)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
  return (
    <header className={`fx-h${bare ? " is-bare" : ""}`}>
      <span className="fx-face"><Stack ids={who} size={28} fit={62} face={(k, s) => (AGENTS[k] ? <AgentMark id={k} size={s} /> : <Pp k={k} size={s} />)} /></span>
      <div className="fx-h-l">
        {!bare && <p className="fx-who"><b>{namesOf(who)}</b>{meta && <span>{meta}</span>}</p>}
        <h2 ref={titleRef}>{title}</h2>
      </div>
      <div className="fx-h-r">
        {act && <motion.button className="btn-pri is-sm" whileTap={{ scale: 0.97 }} onClick={onAct}>{act}</motion.button>}
        {head.pos && <span className="fx-pos">{head.pos}</span>}
        {(head.pos || head.onPrev || head.onNext) && <><button type="button" className="ibtn fx-i" aria-label="Previous" title="Previous (↑)" disabled={!head.onPrev} onClick={head.onPrev || undefined}>{I("M3.5 8.5 7 5l3.5 3.5")}</button>
        <button type="button" className="ibtn fx-i" aria-label="Next" title="Next (↓)" disabled={!head.onNext} onClick={head.onNext || undefined}>{I("M3.5 5.5 7 9l3.5-3.5")}</button></>}
        <button type="button" className="ibtn fx-i" aria-label="Close" title="Close (Esc)" onClick={head.onExit}>{I("M3 3l8 8M11 3 3 11")}</button>
      </div>
    </header>
  );
}
// where you write: to the people in it, or to the agent doing the work. Voice goes to the same place
function FxAsk({ ph, onSend, auto }) {
  const [val, setVal] = useState(""), [act, setAct] = useState(0), inp = useRef(null);
  // opening a conversation doesn't put you in its reply field (it would keep ↑↓ and Esc from you); click it, or press R, to reply
  useEffect(() => { if (!auto) return; const k = (e) => { const a = document.activeElement; if (e.key.toLowerCase() !== "r" || e.metaKey || e.ctrlKey || e.altKey || (a && /INPUT|TEXTAREA/.test(a.tagName))) return; e.preventDefault(); inp.current && inp.current.focus({ preventScroll: true }); };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);
  // @ brings someone in: an agent (they pick it up here) or a teammate (they join the conversation)
  const atM = val.match(/(^|\s)@(\w*)$/), q = atM ? atM[2].toLowerCase() : null;
  const opts = q === null ? [] : [...AGENT_IDS.map((id) => ({ id, n: AGENTS[id].n, role: AGENTS[id].role, ag: true })), ...Object.values(PEOPLE).map((p) => ({ id: p.id, n: p.n, role: p.role }))]
    .filter((o) => o.n.toLowerCase().startsWith(q)).slice(0, 6);
  const pick = (o) => { setVal((v) => v.replace(/@(\w*)$/, `@${o.n} `)); setAct(0); inp.current && inp.current.focus(); };
  const send = (e) => { e.preventDefault(); if (opts.length) { pick(opts[act] || opts[0]); return; } const t = val.trim(); if (!t) return; onSend(t); setVal(""); };
  return (
    <form className="composer is-docked fx-ask" onSubmit={send}>
      <AnimatePresence>{opts.length > 0 && (
        <motion.div key="at" className="ag-pick fx-at" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} onMouseDown={(e) => e.preventDefault()}>
          {opts.map((o, i) => <button type="button" key={o.id} className={i === act ? "is-act" : ""} onMouseEnter={() => setAct(i)} onClick={() => pick(o)}>
            {o.ag ? <AgentMark id={o.id} size={20} /> : <Pp k={o.id} size={20} />}<b>{o.n}</b><small>{o.role}</small></button>)}
        </motion.div>)}</AnimatePresence>
      <div className="ask-field"><input ref={inp} value={val} onChange={(e) => { setVal(e.target.value); setAct(0); }} aria-label={ph} autoComplete="off"
        onKeyDown={(e) => { if (!opts.length) return; if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setAct((a) => (a + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length); }
          else if (e.key === "Tab") { e.preventDefault(); pick(opts[act] || opts[0]); } else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setVal((v) => v + " "); } }} />{!val && <span className="ph">{ph}</span>}</div>
      <button type="button" className="ibtn ibtn-lg" aria-label="Attach"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--navy)" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true"><path d="M10 3.5v13M3.5 10h13" /></svg></button>
      <VoiceBtn onText={onSend} label="Say it" />
    </form>
  );
}
function FxMsgs({ msgs }) {
  const ref = useRef(null);
  useLayoutEffect(() => { const el = ref.current; if (el) el.scrollTop = el.scrollHeight; }, [msgs.length]);
  return (
    <div className="fx-msgs" ref={ref}>
      <AnimatePresence initial={false}>{msgs.map(([k, at, t, file, rt], i) => (
        <motion.div key={k + i + t} className="fx-m" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
          <Face k={k} size={24} />
          <div><p className="fx-m-h"><b>{k === "sam" ? "You" : nm(k)}</b><time>{at}</time></p><p className="fx-m-t">{t}</p>{rt ? <RoutineCard id={rt} /> : file && <FileCard f={file} />}</div>
        </motion.div>))}</AnimatePresence>
    </div>
  );
}
function FxThread({ p, th, P, onPick, head }) {
  const id = th ? th.id : p.kind === "thread" ? p.k : p.from, msgs = (th && th.msgs) || [], ppl = (th && th.people) || [];
  // a conversation about closing an account opens with the account beside it, growing from the title
  const titleRef = useRef(null);
  // the account isn't opened for you (too much at once): it's offered at the top of the conversation, one click away
  const room = ROOM_OF_THREAD[id] && ROOMS[ROOM_OF_THREAD[id]] ? ROOM_OF_THREAD[id] : null;
  const openRoom = (e) => showFile(`acct-${room}`, e.currentTarget, { host: e.currentTarget.closest("[data-dochost]") });
  useEffect(() => {}, [id]); // after the card has finished growing
  const all = msgs.map((m) => m[2]).join(" ").toLowerCase() + " " + (th ? th.t.toLowerCase() : "");
  // what it's tied to: work on Home this conversation is about, one tap away
  const key = (t) => t.toLowerCase().split(/[\s,·]+/).find((w) => w.length >= 8 && !/^(customer|late-stage|follow-up)$/.test(w));
  // only what the conversation is named for: a passing mention ("Brightwater could be one") isn't what it's about
  const named = th ? th.t.toLowerCase() : p.t.toLowerCase();
  const rel = P.filter((x) => x.kind !== "thread" && x.k !== p.k && ((x.t.length > 6 && named.includes(x.t.toLowerCase())) || (key(x.t) && named.includes(key(x.t))))).slice(0, 2);
  const who = ppl.length ? ppl : whoOfP(p), first = msgs[0];
  return (
    <>
      <FxHead bare who={who} title={th ? th.t : p.t} head={head} titleRef={titleRef} />
      {(rel.length > 0 || room) && <div className="fx-rel">{room && <button type="button" onClick={openRoom}><span>About</span><b>{ROOMS[room].deal.n}</b><em>{ROOMS[room].score ? `Likely to close ${ROOMS[room].score.now} of 100 · signs by ${ROOMS[room].deal.close}` : `Signs by ${ROOMS[room].deal.close}`}</em></button>}{rel.map((x) => <button key={x.k} type="button" onClick={() => onPick(x.k)}><span>About</span><b>{x.t}</b><em>{x.stTxt || (typeof x.line === "string" ? x.line : "")}</em></button>)}</div>}
      <FxMsgs msgs={msgs} />
      <div className="fx-f"><FxAsk auto ph={`Reply to ${andList(ppl.map(nm)) || "them"}, or @ an agent…`} onSend={(t) => dispatchEvent(new CustomEvent("north:talk-send", { detail: { id, text: t } }))} /></div>
    </>
  );
}
// a file in the panel: the deck (or report) takes the space; the box under it goes to whoever made it, about the slide you're on
function FxFile({ p, f, msgs, rev, head, onGo, onNote }) {
  const [at, setAt] = useState(0), deck = !!f.slides, by = AGENTS[f.by];
  return (
    <>
      <FxHead who={[f.by]} title={f.t} meta={`${f.kind}${deck ? ` · ${f.slides.length} slides` : ""}${f.when ? ` · ${f.when}` : ""}`} act={p.act} onAct={onGo} head={head} />
      <div className={`fx-b fx-file${p.k === "review" ? " fx-split" : ""}`}>
        {p.k === "review" ? <><div className="fx-main"><DocView doc={f} /></div><FxRail p={p} who={[f.by]} steps={stepsOf(p, null, false, [], {})} /></>
          : deck ? <DeckView deck={f} at={at} setAt={setAt} rev={rev} /> : <DocView doc={f} />}
        {msgs.length > 0 && <FxMsgs msgs={msgs} />}
      </div>
      <div className="fx-f"><FxAsk ph={deck ? `Tell ${by.n} what to change on slide ${at + 1}…` : `Ask ${by.n} about this ${f.kind.toLowerCase()}…`} onSend={(t) => onNote(t, deck ? f.slides[at].k : null)} /></div>
    </>
  );
}
// beside work that's moving or done: whose move it is now, the whole way through (what's done, what it's on, what's left),
// and who's on it. Not a summary of the left side: the parts of the work the left side doesn't show
const RAIL_TICK = <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6.3 4.8 8.5 9.5 3.6" /></svg>;
function FxRail({ p, who, steps, d }) {
  const ag = AGENTS[p.ag || (p.j && p.j.ag) || who.find((k) => AGENTS[k])], st = p.j?.st;
  const move = p.k === "review" ? ["Yours", "The 11 follow-ups are drafted, from you. They’re first in what needs you."]
    : st === "wait" ? ["Nobody’s, yet", `${p.j.wait.replace(/\.$/, "")}. ${ag ? ag.n : "North"} picks it back up the moment it lands.`]
    : st === "done" || p.zone === "landed" ? ["Yours, when you’re ready", "Nothing’s waiting on you to keep it moving."]
    : [`${ag ? ag.n : "North"}’s`, "You’ll hear when it lands."];
  const role = (k) => (AGENTS[k] ? AGENTS[k].role : PEOPLE[k] ? PEOPLE[k].role : "");
  return (
    <aside className="rx-set fx-rail" aria-label="About this work">
      <div className="rx-sec"><h5 className="rx-l">Whose move</h5><p className="rx-move"><b>{move[0]}</b>{move[1]}</p></div>
      {steps.length > 0 && p.k !== "review" && <div className="rx-sec"><h5 className="rx-l">The whole way through</h5>
        <ol className="rx-steps is-sm">{steps.map((s, i) => <li key={s.t + i} className={`is-${s.s === "you" ? "now" : s.s === "then" ? "next" : s.s}`}><i className="rx-dot">{s.s === "done" ? RAIL_TICK : null}</i><span>{s.t}</span><em>{s.s === "done" ? "" : STEP_K[s.s] || ""}</em></li>)}</ol></div>}
    </aside>
  );
}
// a routine, opened: this run on the left (what it's doing or found, your move if there is one); the routine on the right,
// which you change in place. Telling the crew something below adds it to what the routine looks at
// a routine has two things you can open, and they never share a view. A run (from In progress on Home): what it's doing
// or found, and one line at the end naming the routine it came from. The routine itself (from Agents, or that line): what it
// does, its settings, changed in place, and its runs. The composer belongs to the routine: what you tell it changes what it
// looks at, and you see that land in "Looks at"
function FxRoutine({ p, head }) {
  const r = ROUTINES[p.rt], lead = AGENTS[r.agent] || { n: "North" };
  const [view, setView] = useState(() => { const v = window.__northRtView === p.k ? "routine" : "run"; window.__northRtView = null; return v; });
  const lc = (x) => x.charAt(0).toLowerCase() + x.slice(1);
  if (view === "routine") return (
    <>
      <FxHead who={r.crew} title={r.t} meta="Routine" head={{ ...head, pos: null, onPrev: null, onNext: null }} />
      <div className="fx-b"><RoutineSet id={p.rt} full cur={p} onRun={() => setView("run")} /></div>
      <div className="fx-f"><FxAsk ph={`Tell ${lead.n} what else to look at…`} onSend={(t) => routineSet(p.rt, (x) => ({ checks: [...x.checks, [t.charAt(0).toUpperCase() + t.slice(1).replace(/[.!]$/, ""), x.agent]] }))} /></div>
    </>
  );
  return (
    <>
      <FxHead who={p.bots && p.bots.length ? p.bots : [r.agent]} title={p.t} head={head} />
      <div className="fx-b"><div className="fx-main"><RoutineRun p={p} /></div>
        <button type="button" className="rx-from" onClick={() => setView("routine")}><RoutineMark /><span>A routine. It runs {lc(r.when)}{r.stage === "on" ? "" : ", and it’s off now"}.</span><b>Edit the routine</b></button></div>
    </>
  );
}
function FxWork({ p, parked, said, notes, ho, M, onGo, onNote, head }) {
  const [, tick] = useState(0), [all, setAll] = useState(false);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 900); return () => clearInterval(t); }, []);
  const d = p.j ? NA()?.detail(p.j.id) : null, a = p.ag && AGENTS[p.ag];
  const steps = stepsOf(p, d, parked, notes, ho), live = liveOf(steps), lead = leadOf(p, d);
  const conv = p.handoff ? ((talk.get().threads.find((x) => x.id === "t-bw") || {}).msgs || []) : [
    ...(said ? [[said.ag, "Now", said.text]] : [])];
  const who = p.people ? [...p.people.filter((x) => x !== "sam"), ...(p.bots || [])] : p.ag ? [p.ag] : ["sam"];
  return (
    <>
      <FxHead who={who} title={p.t} meta={p.moves ? `Moves ${p.moves}` : null} act={p.act} onAct={onGo} head={head} />
      {!p.act && !p.handoff ? <div className="fx-b fx-split">
        <div className="fx-main">
          {lead ? <div className="fx-lead">{lead.map((l, i) => <p key={i}>{l}</p>)}</div> : p.what && <p className="fx-lead">{p.what}</p>}
          <div className="fx-story"><Story p={p} d={d} tight={false} M={M} /></div>
          {conv.length > 0 && <FxMsgs msgs={conv} />}
        </div>
        <FxRail p={p} who={who} steps={steps} d={d} />
      </div> : <div className="fx-b">
        {lead ? <div className="fx-lead">{lead.map((l, i) => <p key={i}>{l}</p>)}</div> : p.what && <p className="fx-lead">{p.what}</p>}
        <div className="fx-story"><Story p={p} d={d} tight={false} M={M} /></div>
        <ol className="fx-steps">{steps.map((s, i) => (all || (i === live && !(s.s === "you" && p.act))) && (
          <li key={s.t + i} className={`is-${s.s}`}><span className="fd-s-m">{s.s === "done" ? <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6.3 4.8 8.5 9.5 3.6" /></svg> : <i />}</span>
            <span>{s.t}</span>{STEP_K[s.s] && <em>{STEP_K[s.s]}</em>}</li>))}
          {steps.length > 1 && <li className="fx-more"><button type="button" onClick={() => setAll((v) => !v)}>{all ? "Just what’s now" : `All ${steps.length} steps`}</button></li>}</ol>
        {conv.length > 0 && <FxMsgs msgs={conv} />}
      </div>}
      {(p.j || p.handoff) && <div className="fx-f"><FxAsk ph={p.handoff ? "Message Jordan…" : `Tell ${a ? a.n : "North"} how to do it…`} onSend={onNote} /></div>}
    </>
  );
}

// Beyonce's Home: the same loop as Sam's, under her own greeting and above her numbers
export function LeadWork({ M, onAsk }) { return <SamField M={M} onAsk={onAsk} seat="lead" bare name="Beyonce" />; }
