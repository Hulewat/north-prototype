// Beyonce's Q4 goals, on the same foundation as every number in North: each goal is a tile, closed it's the goal's number
// against its target with its little chart. Opened, it grows down the page: the chart on the left, a line to North on the
// right (say what else should happen and North hands it to whoever owns it), and under both the moves on it as cards, side by
// side so they compare: who, the move, what it's worth, why, and the one thing to do, always in that order. A goal doing its
// job says so and asks nothing. Every figure is the prototype's own; what isn't is marked sample.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NorthLogo } from "./marks.jsx";
import { motion, AnimatePresence, animate, useMotionValue, useTransform, usePresence } from "motion/react";
import { AGENTS, AgentMark, RowHover } from "./agents.jsx";
import { showFile } from "./files.jsx";
import { PushShape } from "./chat.jsx";
import { PHOTOS } from "./photos.js";
import { talk } from "./team-talk.js";
import { C } from "./lib.js";
import { arrData } from "./arr-data.js";
import { onIntent } from "./voice-intents.js";
import { getWho } from "./seat.js";

const PPL = { caleb: ["Caleb", "#744ccb"], jordan: ["Jordan", "#098486"], heather: ["Heather", "#744ccb"], seth: ["Beyonce", "#1f4b70"] };
function Av({ k, size = 22 }) {
  if (AGENTS[k]) return <AgentMark id={k} size={size} />;
  const ph = PHOTOS[k], [n, c] = PPL[k] || [k, C.navy];
  return ph ? <span className="gq-av is-ph" style={{ width: size, height: size, backgroundImage: `url(${ph})` }} />
    : <span className="gq-av" style={{ width: size, height: size, background: c, fontSize: Math.round(size * 0.45) }}>{n[0]}</span>;
}
const TICK = <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2.5 6.3 2.3 2.3L9.5 3.8" /></svg>;
const $M = (v) => `$${v.toFixed(2)}M`, $Mf = (v) => (v === 0 ? "$0" : `$${+v.toFixed(2)}M`);

// who has each move now, and the moves she sent herself: kept outside the tile, so closing and opening a goal doesn't forget
let hide0 = false; try { hide0 = localStorage.getItem("north.mvHide") === "1"; } catch (e) {}
const S = { own: {}, mine: {}, log: {}, gone: {}, mvHide: hide0, subs: new Set() };
const ping = () => S.subs.forEach((f) => f({ ...S }));
export const setOwn = (k, v) => { S.own = { ...S.own, [k]: v }; ping(); };
// a move she closes (not hers to do, already handled, not worth it) leaves the goal and Needs you; Undo puts it back
const setGone = (k, v) => { S.gone = { ...S.gone, [k]: v }; ping(); };
// choosing an option: the move is hers no more. It goes to whoever runs it and shows up under Moving, where its steps play out
// one record per decision: a move with a need is the same decision the Agents floor (and the team pages, the chat, Sam's seat)
// shows, so deciding it anywhere decides it everywhere. Home tells North; when it's decided elsewhere, it lands here
const choose = (mv, o, quiet) => { if (S.own[mv.k]) return; S.run = { ...(S.run || {}), [mv.k]: { mv, o, at: Date.now(), landed: false } }; setOwn(mv.k, o.done);
  if (mv.need && !quiet && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("north:decided", { detail: { need: mv.need, opt: o.k, from: "home" } }));
  // a beat to see the tick land, then the line itself travels down into Moving (one element, two places: see layoutId)
  setTimeout(() => { const r = S.run[mv.k]; if (r) { S.run = { ...S.run, [mv.k]: { ...r, landed: true, landedAt: Date.now() } }; ping(); } }, 1500);
  if (mv.k === "hire" && o.note) talk.post("t-hire", { role: "user", text: o.note }); };
// unticking it where it was ticked (a meeting's task): the decision is hers again. It leaves In progress and comes back to Needs you
const unchoose = (k) => { if (!S.own[k]) return; const own = { ...S.own }, run = { ...(S.run || {}) }; delete own[k]; delete run[k]; S.own = own; S.run = run; ping(); };
// "do them all": every move still waiting on her goes with its recommended option, one after another so each is seen
// moving down. Typed in a goal's chat it's that goal's moves; said or typed in the ask bar it's everything in Needs you
const DO_ALL = /\b(do|approve|accept|take|handle|go with|run with)\b.*\b(them all|all of them|all|every(thing| one)|the (recommendations?|recommended))\b|^(all of them|do all|yes to all)$/i;
const pendingOf = (moves) => moves.filter((mv) => mv.rec && !S.own[mv.k] && !mv.state && !S.gone[mv.k]);
function doAll(moves) { const list = pendingOf(moves); list.forEach((mv, i) => setTimeout(() => choose(mv, mv.rec), i * 650)); return list; }
const allMoves = () => GOAL_IDS.flatMap((id) => GOAL_TILES[id].moves);
const doneLine = (list) => list.length ? `On it: ${list.map((mv) => `${lc(mv.rec.l)} (${nameOf(mv.rec.to)})`).join(", ")}. Each moves to In progress as it starts.` : "Nothing’s waiting on you there.";
const addMine = (g, mv) => { S.mine = { ...S.mine, [g]: [...(S.mine[g] || []), mv] }; ping(); };
const addLog = (g, x) => { S.log = { ...S.log, [g]: [...(S.log[g] || []), x] }; ping(); };
export function useGoalStore() { return useS(); }
const setMvHide = (v) => { S.mvHide = v; try { localStorage.setItem("north.mvHide", v ? "1" : "0"); } catch (e) {} ping(); };
function useS() { const [o, set] = useState({ ...S }); useEffect(() => { S.subs.add(set); return () => S.subs.delete(set); }, []); return o; }
// who an idea can go to: her team and the crew. "@Jordan …" sends it to Jordan; no name, and North works out who
const WHO = { sam: "Sam", jordan: "Jordan", heather: "Heather", caleb: "Caleb", lisa: "Lisa", paul: "Paul", dustin: "Dustin", orin: "Orin", riley: "Riley", calvin: "Calvin", marco: "Marco", fia: "Fia" };

const A = arrData("all", "2026"), ENDS = A.end.slice(4, 10);
const base = { text: C.navy, fill: C.navyFill, mark: null, owner: "Beyonce", keepLinked: true, secondary: "Pin to Home", movers: [] };
export const GOAL_TILES = {
  "goal-arr": { ...base, id: "goal-arr", label: "Close $40M ending ARR", value: "$38.94M", f: A.end[9] / A.end[11], foot: "Where it lands at this rate, $1.09M short", pct: "Behind", keyMonthly: [["Month end", "sw"], ["Month to date", "mtd"], ["Plan", "dot"]], pctColor: "#744ccb",
    desc: "Ending ARR on December 31 against the $40.03M plan. At October’s rate it lands at $38.94M.", lenses: [["monthly", "Monthly"]],
    openFoot: "$1.09M short of the $40.03M plan", openPct: "Behind",
    series: { vals: ENDS, lo: 25, hi: 41, ticks: [25, 30, 35, 40], fmt: (v) => `$${v}M`, valFmt: $M, tgt: A.end[11], tLabel: `Plan ${$M(A.end[11])}`, start: A.start, now: A.end[9], plo: 24, phi: 41, pticks: [25, 30, 35, 40], pfmt: $Mf },
    
    moves: [
      { k: "outbound", need: "riley-out", ev: "riley", who: "caleb", kind: "decide", t: "Outbound is at 23% of pace since Sam moved to inbound", stake: "About +$680K by Dec 31 if he moves back (sample)",
        sit: "Outbound has booked $130.2K of its $573.8K October pace. It dropped after Oct 14, when Sam and another SDR moved to inbound coverage; inbound needed them, at 128% of pace since the Portal launch. Demos held fell from 26 to 11, and of the last 20 lost demos, 14 were Outbound’s and 11 got no follow-up within two days (Orin’s review). Moving Sam back costs inbound some coverage, so Caleb wants your call.",
        facts: [["Booked this month", "$130.2K of $573.8K pace"], ["Outbound demos held since Oct 14", "26 down to 11"], ["Sam on Outbound before Oct 14", "$7.5K booked a day"]],
        opts: [{ k: "a", rec: true, l: "Move Sam back to Outbound", d: "For the last two weeks of the month: about +$680K by Dec 31 if Outbound gets back to pace. Inbound loses one SDR; Calvin says watch its demo held rate.", btn: "Move Sam back", to: "caleb", done: "Caleb has it",
            steps: [["caleb", "Caleb tells Sam and moves his inbound demos"], ["sam", "Sam is back on Outbound from Monday"], ["orin", "Orin hands Sam the 14 open prospects on his old demo list"]] },
          { k: "b", l: "Keep Sam on inbound and have Orin follow up his lost demos", d: "Orin sends the 11 drafted follow-ups from Sam today. Recovers about +$250K, and inbound keeps both SDRs (sample).", btn: "Keep Sam on inbound", to: "orin", done: "Orin has it",
            steps: [["orin", "Orin sends the 11 follow-ups from Sam"], ["riley", "Riley books the replies onto Sam’s calendar"], ["caleb", "Caleb reviews Outbound on Friday"]] }] },
      { k: "hire", who: "heather", kind: "decide", t: "Heather’s Q4 hiring plan is waiting on your sign-off", stake: "Paul needs it by Friday for the plan",
        sit: "Heather asked for six hires: three AEs for New Business, one CSM for SMB and two engineers for the HubSpot sync. Offers made in November start in January, and Paul needs the number by Friday to close the plan. This quarter’s demo volume supports two AEs now; a third only if Outbound recovers (Riley’s read).",
        facts: [["Asked for", "6 hires"], ["If offers go out in November", "They start in January"], ["Demo volume supports", "2 AEs now (sample)"]],
        opts: [{ k: "a", rec: true, l: "Approve 4 hires now, and 2 more in January", d: "Two AEs, the CSM and one engineer now. The last AE and engineer in January, if Outbound is back on pace.", btn: "Approve 4 hires", to: "heather", done: "Approved: four hires",
            note: "Going with four now: two AEs, the CSM and one engineer. The other two in January if Outbound is back on pace.",
            steps: [["heather", "Heather has your sign-off"], ["heather", "Heather opens the four roles"], ["riley", "Riley checks Outbound on Jan 5 for the other two"]] },
          { k: "b", l: "Approve all 6 hires now", d: "Full coverage from January, but two of the roles aren’t supported by this quarter’s demo volume yet (sample).", btn: "Approve 6 hires", to: "heather", done: "Approved: six hires",
            note: "Approved all six.", steps: [["heather", "Heather has your sign-off"], ["heather", "Heather opens all six roles"], ["orin", "Orin updates the board pack’s hiring slide"]] }] },
      { k: "bline", who: "jordan", kind: "decide", t: "Brightline cut 12 seats before their Nov 14 renewal", stake: "30 seats left (sample)",
        sit: "Brightline went from 42 seats to 30 this week. All 30 that are left use Felix every week, so the cut came from seats that were never set up, not from unhappy agents (Jordan’s read). Jordan wants to lock the 30 in with an annual term at 20% off. Anything past 15% needs your OK.",
        facts: [["Seats", "30, down from 42"], ["Using Felix every week", "All 30"], ["Discount Jordan wants", "20%, past the 15% limit (sample)"]],
        opts: [{ k: "a", rec: true, l: "Let Jordan offer Brightline 20% off a one-year term", d: "Locks all 30 seats for a year before the Nov 14 renewal. Jordan’s read: they use it every week, so they’ll take it.", btn: "Approve 20% off", to: "jordan", done: "Jordan has it",
            steps: [["jordan", "Jordan sends Brightline the annual offer"], ["jordan", "Brightline answers before Nov 14"], ["riley", "Riley updates the renewal forecast"]] },
          { k: "b", l: "Have Jordan offer 15% off instead", d: "Stays inside the discount limit, but Brightline may stay month to month and could cut seats again.", btn: "Offer 15% instead", to: "jordan", done: "Jordan has it",
            steps: [["jordan", "Jordan offers the annual term at 15%"], ["jordan", "Brightline answers before Nov 14"], ["riley", "Riley watches their seat count every week"]] }] },
      { k: "anchors", who: "jordan", t: "Jordan’s team took the 4 big accounts nobody owned", stake: "About $1.2M ARR back in the forecast (sample)",
        sit: "Their CSM left in September and the forecast had been counting all four as flat. Jordan’s team picked them up on Monday; Riley forecasts them until the new CSM starts.", state: "Jordan’s team has them" },
    ] },
  "goal-felix": { ...base, id: "goal-felix", label: "Portal live at 25 brokerages", value: "9 of 25", f: 9 / 25, foot: "16 to go", pct: "On pace", keyMonthly: [["Live", "sw"], ["This month", "mtd"], ["Goal", "dot"]],
    desc: "Brokerages with Portal live on their site, against 25 by Dec 31. Sample figures.", lenses: [["monthly", "Monthly"]], openFoot: "9 of 25 brokerages live (sample)", openPct: "36%",
    series: { vals: [0, 0, 1, 3, 5, 9], lo: 0, hi: 25, ticks: [0, 10, 20], fmt: (v) => `${v}`, valFmt: (v) => `${v} live`, tgt: 25, tLabel: "Goal 25" },
    moves: [
      { k: "felix6", who: "riley", t: "Riley is booking setup calls for the 6 signed brokerages", stake: "2 this week (sample)",
        sit: "Six brokerages have signed but aren’t live yet. Each needs a 30-minute setup call; Riley is booking them around their MLS feeds. (Sample)", state: "Riley’s on it" },
      { k: "wshop", who: "lisa", t: "Lisa’s Nov 24 workshop puts Portal in front of 14 brokerages", stake: "5 of them aren’t customers yet (sample)",
        sit: "Leaders from 14 brokerages, 9 of them customers. You open at 9:00, then Brightwater shows what Portal built for them. (Sample)", state: "Lisa has it" },
    ] },
  "goal-exp": { ...base, id: "goal-exp", label: "Book 40 expansion deals", value: "45", f: 1, foot: "Goal was 40", pct: "Ahead", keyMonthly: [["Booked", "sw"], ["This month", "mtd"], ["Goal", "dot"]], pctColor: "#098486",
    desc: "Expansion deals booked this quarter, against a goal of 40. Sample figures.", lenses: [["monthly", "Monthly"]], openFoot: "45 booked against a goal of 40", openPct: "112%",
    series: { vals: [8, 15, 23, 31, 38, 45], lo: 0, hi: 50, ticks: [0, 20, 40], fmt: (v) => `${v}`, valFmt: (v) => `${v} deals`, tgt: 40, tLabel: "Goal 40" },
    
    ok: "Doing its job: 45 booked against a goal of 40. Nothing here needs you.", moves: [] },
  "goal-ttv": { ...base, id: "goal-ttv", label: "Time to value under 15 days", value: "20.9d", f: 15 / 20.9, foot: "5.9 days over", pct: "Over", keyMonthly: [["Days to 10 handoffs", "line"], ["Ceiling", "dot"]], pctColor: "#744ccb",
    desc: "Days for a new account to reach 10 Felix handoffs, against a 15-day ceiling. Lower is better.", lenses: [["monthly", "Monthly"]], openFoot: "20.9 days against the 15-day ceiling", openPct: "Over",
    series: { line: true, vals: [24.1, 23.5, 22.8, 22.0, 21.4, 20.9], lo: 12, hi: 26, ticks: [15, 20, 25], fmt: (v) => `${v}d`, valFmt: (v) => `${v.toFixed(1)}d`, tgt: 15, tLabel: "Ceiling 15.0d", unit: "d" },
    
    moves: [
      { k: "onboard", who: "jordan", kind: "decide", t: "Jordan and Caleb disagree on the 5-day onboarding plan", stake: "About 4 days faster to value (sample)",
        sit: "New accounts take 20.9 days to reach 10 Felix handoffs, against a 15-day ceiling. Coastline tried a 5-day onboarding plan and got there in 11. Jordan wants it for every new account from Monday. Caleb wants it on the next 10 first, because his team already sold 12 accounts on the three-week plan.",
        facts: [["Days to 10 handoffs", "20.9, ceiling 15"], ["With the 5-day plan", "11 days at Coastline (sample)"], ["Sold on the three-week plan", "12 accounts (sample)"]],
        opts: [{ k: "a", rec: true, l: "Roll the 5-day plan out to every new account", way: "Jordan’s way", d: "From Monday. About 4 days faster to value (Riley’s read); Caleb’s team re-sets the 12 accounts already sold on three weeks.", btn: "Roll out to all", to: "jordan", done: "Jordan has it",
            steps: [["jordan", "Jordan switches new accounts to the 5-day plan"], ["caleb", "Caleb’s team tells the 12 accounts"], ["calvin", "Calvin tracks days to 10 handoffs"]] },
          { k: "b", l: "Pilot the 5-day plan on the next 10 accounts", way: "Caleb’s way", d: "Proves it beyond Coastline before everyone switches. You decide the rest in four weeks.", btn: "Pilot on 10", to: "jordan", done: "Piloting on 10",
            steps: [["jordan", "Jordan picks the next 10 accounts"], ["calvin", "Calvin compares them with the rest"], ["jordan", "A full rollout decision in four weeks"]] }] },
    ] },
};
export const GOAL_IDS = Object.keys(GOAL_TILES);
export const decisionOf = (need) => { const mv = GOAL_IDS.flatMap((id) => GOAL_TILES[id].moves).find((x) => x.need === need); return mv ? { mv, run: S.run && S.run[mv.k], own: S.own[mv.k] } : null; };
if (typeof window !== "undefined") window.addEventListener("north:decided", (e) => { const d = e.detail || {}; if (d.from === "home") return;
  const mv = ALL_MOVES().find((x) => x.need === d.need); if (!mv || S.own[mv.k] || !mv.opts) return;
  choose(mv, mv.opts.find((o) => o.k === d.opt) || mv.opts[0], true); });
onIntent((n, raw) => { if (getWho() !== "seth" || !DO_ALL.test(String(raw || n).trim())) return null; const list = doAll(allMoves());
  return list.length ? `Going with the recommendation on all ${list.length}. The sign-off and your SaaStr read are still yours, on your board.` : "Nothing’s waiting on you."; });
// North knows what's been decided: asked whether Sam is moving back (by her, or by Sam), it answers from the decision itself,
// whichever page it was made on
const ASK_SAM = /\b(sam|i|am i|is sam)\b.*\b(mov\w*|go\w*|back)\b.*\boutbound\b|\boutbound\b.*\b(sam)\b.*\b(back|mov\w*)\b/i;
onIntent((n, raw) => { const t = String(raw || n); if (!ASK_SAM.test(t) || /^\s*why\b/i.test(t)) return null;
  const d = decisionOf("riley-out"); if (!d) return null; const sam = getWho() === "sam";
  if (!d.own) return sam ? "Not decided yet. It’s waiting on Beyonce’s call" : "Not yet. It’s yours to decide, at the top of Home";
  const o = d.run ? d.run.o : d.mv.rec;
  if (o.k === "b") return sam ? "No. Beyonce kept you on inbound; Orin is sending your 11 lost-demo follow-ups instead" : "No. You kept Sam on inbound; Orin is sending his 11 lost-demo follow-ups";
  return sam ? "Yes. Beyonce approved it: you’re back on Outbound from Monday. Caleb is moving your inbound demos, and Orin has the 14 open prospects from your old demo list"
    : "Yes. You approved it, and Caleb has it: Sam is back on Outbound from Monday, and Orin hands him the 14 open prospects. Riley checks Outbound bookings in two weeks"; });
// every move with options: its recommended option is the one-click button, the other is the quiet second choice
GOAL_IDS.forEach((id) => GOAL_TILES[id].moves.forEach((mv) => { mv.why = mv.sit; if (!mv.opts) return;
  const r = mv.opts.find((o) => o.rec) || mv.opts[0], o2 = mv.opts.find((o) => o !== r); Object.assign(mv, { rec: r, other: o2, act: r.btn, alt: o2 && o2.btn }); }));
// closed, a goal is its progress bar: how far through the quarter's goal it is, and the pace mark where it should be by
// today (day 28 of 92). Expansion is past its goal; Time to value counts days taken off since September
const PACE = 28 / 92;
[["goal-arr", (A.end[9] - A.end[8]) / (A.end[11] - A.end[8])], ["goal-felix", 9 / 25], ["goal-exp", 1], ["goal-ttv", (21.4 - 20.9) / (21.4 - 15)]].forEach(([id, f]) => {
  Object.assign(GOAL_TILES[id], { f, mark: PACE, markFill: C.coral, markTitle: "Pace by today · 30%", markSub: `${Math.round(Math.min(1, f) * 100)}% of the way there`, preview: null }); });
// the bar says how it's going in its color: behind (or over the ceiling) is dark red, ahead is teal, moving is navy. The
// pace mark is salmon, like every target in North
const ST = { Behind: C.alert, Over: C.alert, Ahead: C.teal };
GOAL_IDS.forEach((id) => { const g = GOAL_TILES[id], c = ST[g.pct]; if (c) Object.assign(g, { barFill: c, pctColor: c }); });
GOAL_TILES["goal-arr"].short = "$40M ARR"; GOAL_TILES["goal-felix"].short = "Portal"; GOAL_TILES["goal-exp"].short = "Expansion"; GOAL_TILES["goal-ttv"].short = "Time to value";
GOAL_TILES["goal-arr"].lead = "caleb"; GOAL_TILES["goal-felix"].lead = "riley"; GOAL_TILES["goal-exp"].lead = "jordan"; GOAL_TILES["goal-ttv"].lead = "jordan";


// --- an open goal: the chart on the left, everything else together in one column on the right that scrolls: the moves as
// cards (who, the move, what it's worth, the one thing to do; open a card for the why), then the line to North. The divider
// between the two sides drags, and keeps where she left it
const GOAL_H = 640;
export const goalOpenH = (id, w) => (w < 700 ? 1040 : GOAL_H);
export const RW = { min: 340, def: 460 };
export const setGoalRw = (v) => { S.rw = v; ping(); };
export const goalRw = () => S.rw || RW.def;
const nameOf = (k) => WHO[k] || (AGENTS[k] && AGENTS[k].n) || k;

// the brief behind a move, enough to decide on: what's happening, the three facts that matter, and the two ways to go, each
// with what it gets and what it costs. The recommended one is marked with whose read it is; either is one click
export function Brief({ mv, onPick }) {
  return (
    <div className="bf">
      <p className="bf-sit">{mv.sit}</p>
      {mv.facts && <dl className="bf-facts">{mv.facts.map(([l, v]) => <div key={l}><dt>{l}</dt><dd>{v}</dd></div>)}</dl>}
      {/* the evidence lives with the agent's job: its chart, its sources, how it got there. It opens over the page, in place */}
      {false && <button type="button" className="bf-ev" onClick={(e) => { e.stopPropagation(); const id = window.__northAgents?.needJob?.(mv.need); if (!id) return;
        const r = e.currentTarget.getBoundingClientRect(); dispatchEvent(new CustomEvent("north:open-job", { detail: { id, from: { left: r.left, top: r.top, width: r.width, height: r.height } } })); }}>How {nameOf(mv.ev || mv.who)} got there</button>}
      {mv.opts && <ol className="bf-opts">{mv.opts.map((o) => (
        <li key={o.k} className={o.rec ? "is-rec" : ""}>
          <div className="bf-o"><b>{o.l}</b>{o.rec && <span className="bf-tag">Recommended</span>}<p>{o.d}</p></div>
          <button type="button" className={`rt-b${o.rec ? " is-pri" : ""}`} onClick={(e) => { e.stopPropagation(); onPick(o); }}>{o.btn}</button>
        </li>))}</ol>}
    </div>);
}

// a move on an open goal, as status: the goal panel never asks the question again (that lives in Needs you, once). It says
// where each move stands: waiting on her call, who has it and what's happening now, or set aside. Open a row for the why
function nowOf(r) { const el = Date.now() - (r.landedAt || r.at), steps = r.o.steps || [], n = steps.length || 1;
  const at = Math.min(n - 2, Math.floor(Math.max(0, el - 900) / STEP_MS)), prog = Math.min(0.62, 0.08 + Math.max(0, el) / (STEP_MS * n * 1.6));
  return { line: el < 900 ? `${nameOf(r.o.to)} has it` : steps[Math.max(0, at)] ? steps[Math.max(0, at)][1] : "Working", prog }; }
function MoveCard({ mv, item, T }) {
  const st = useS(), run = st.run && st.run[mv.k], gone = st.gone[mv.k], [on, setOn] = useState(false);
  const [hv, setHv] = useState(false), at = useRef({ x: 100, w: 400 });
  const waiting = mv.kind === "decide" && !run && !st.own[mv.k] && !gone;
  const now = run ? nowOf(run) : null;
  const face = run ? run.o.to : mv.who, title = run ? run.o.l : mv.t;
  const line = gone ? "Set aside" : waiting ? mv.stake : now ? now.line : mv.state || st.own[mv.k];
  return (
    <motion.article className={`gq-mv is-track${waiting ? " is-wait" : ""}${gone ? " is-gone" : ""}`} variants={item} transition={T} onClick={() => setOn((v) => !v)}
      onPointerEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(true); }} onPointerLeave={() => setHv(false)}>
      <AnimatePresence>{hv && <RowHover key="h" o={at.current} t={{ type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }} />}</AnimatePresence>
      <span className="gq-mv-f"><Av k={face} size={22} /></span>
      <div className="gq-mv-w">
        <h4 className="gq-t">{title}</h4>
        <p className="gq-d">{line}{gone && <> · <button type="button" className="gq-link" onClick={(e) => { e.stopPropagation(); setGone(mv.k, false); }}>Restore</button></>}</p>
        <AnimatePresence initial={false}>{on && <motion.div className="gq-why" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          <p className="gq-d is-why">{mv.sit}</p></motion.div>}</AnimatePresence>
      </div>
      {/* waiting on her: the call itself, the same recommended button Needs you shows (one decision, wherever she makes it) */}
      {waiting ? (() => { const rec = (mv.opts || []).find((o) => o.rec) || mv.rec;
        return rec ? <motion.button type="button" className="rt-b gq-act" whileTap={{ scale: 0.97 }} onClick={(e) => { e.stopPropagation(); choose(mv, rec); }}>{rec.btn}</motion.button> : null; })() : !gone && <Ticks prog={now ? now.prog : 0.35} />}
    </motion.article>);
}

// who a move goes to when she doesn't name anyone: what it's about decides, else the goal's own lead
const ROUTE = [[/onboard|setup|handoff|renew|seat|churn|customer|coastline|brightline|forecast/i, "jordan"], [/outbound|pipeline|demo|prospect|booked|caleb/i, "caleb"],
  [/hire|hiring|headcount|recruit|\bae\b|\baes\b|\bcsm\b/i, "heather"], [/portal|setup call|felix|rollout|agent/i, "riley"]];
const OWNS = { jordan: "Jordan’s team runs onboarding and renewals", caleb: "Caleb’s team owns Outbound", heather: "Heather owns hiring", riley: "Riley runs Portal setups" };
const routeOf = (text, m) => { const at = /@([a-z]+)/i.exec(text), k = at && WHO[at[1].toLowerCase()] ? at[1].toLowerCase() : null; if (k) return [k, true];
  const r = ROUTE.find(([re]) => re.test(text)); return [r ? r[1] : m.lead || "riley", false]; };

// what she says to North is either a question (she's finding out more: North answers from the goal, nothing is made) or
// something to get done (North hands it to whoever owns it and it becomes a move). Naming someone, or telling ("have…",
// "make sure…", "pull…"), is a job; asking ("why…?", "what's…", "is…") is a question
const ASKS = /^(why|what|what’s|whats|how|who|when|where|which|is|are|was|were|can|could|should|would|do|does|did|will|has|have we|explain|tell me|walk me|show me|any)\b/i;
const DOES = /^(have|get|ask|tell|make sure|let’s|lets|please|we should|i want|pull|push|move|add|book|send|set up|schedule|pair|give|put|start|stop|run|cut|hire|approve)\b/i;
const ASK_TO = /^(can|could|would|will) you\b(?!\s+(tell|explain|walk|show)\b)|^(can|could|would|will) (we|someone|jordan|caleb|heather|riley)\b/i;
const isAsk = (t) => { const x = t.replace(/@[a-z]+[,:]?\s*/i, "").trim(); if (/@[a-z]+/i.test(t) && !/^(why|what|how|who|when|where|which)\b/i.test(x)) return false; if (DOES.test(x) || ASK_TO.test(x)) return false; return /\?\s*$/.test(x) || ASKS.test(x); };
const STOP = new Set(["about", "their", "there", "these", "those", "every", "which", "where", "would", "could", "should", "the", "back", "with", "from", "this", "that"]);
const keysOf = (mv) => (mv.t.toLowerCase().replace(/’s\b/g, "").match(/[a-z]{5,}/g) || []).filter((w) => !STOP.has(w));
const listOf = (a) => (a.length < 3 ? a.join(" and ") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
const lc = (x) => x.charAt(0).toLowerCase() + x.slice(1);
// North's answer, from what the goal already knows: the move she asked about, who owns what, or where the goal stands
function answerOf(t, m, moves, own = {}) {
  const q = t.toLowerCase(), hit = moves.find((mv) => keysOf(mv).some((w) => q.includes(w)));
  if (hit) return `${hit.t}. ${hit.why}${hit.stake && hit.stake !== "Your move" ? ` What it’s worth: ${lc(hit.stake)}.` : ""}`;
  if (/\b(who|owner|owns|whose)\b/.test(q) && moves.length) return moves.map((mv) => `${mv.t}: ${mv.state || own[mv.k] || (mv.rec ? `waiting on you (${lc(mv.rec.l)} is the recommendation)` : nameOf(mv.who))}.`).join(" ");
  if (/\b(why|behind|short|gap|miss|over)\b/.test(q)) return `${m.desc}${moves.length ? ` The biggest move on it is ${lc(moves[0].t)} (${lc(moves[0].stake)}).` : ""}`;
  return `${m.desc} ${moves.length ? `There ${moves.length === 1 ? "is one move" : `are ${moves.length} moves`} on it: ${listOf(moves.map((mv) => lc(mv.t)))}.` : m.ok}`;
}

// the right side of an open goal: the moves, then North, in one scroll; the message box stays at the foot
export function GoalSide({ m, item, T }) {
  const st = useS(), moves = [...m.moves, ...(st.mine[m.id] || [])], log = st.log[m.id] || [];
  const [idea, setIdea] = useState(""), [typing, setTyping] = useState(false), scRef = useRef(null), live = useRef(true), talked = useRef(false);
  useEffect(() => () => { live.current = false; }, []);
  // once she's talking to North, keep the newest line in view
  useLayoutEffect(() => { const el = scRef.current; if (el && talked.current) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [log.length, typing, moves.length]);
  const send = (e) => { e.preventDefault(); e.stopPropagation(); const t = idea.trim(); if (!t || typing) return;
    talked.current = true; addLog(m.id, { me: true, t }); setIdea("");
    // "do them all": every move on this goal goes with its recommendation
    if (DO_ALL.test(t)) { setTyping("ask"); setTimeout(() => { const list = doAll(moves); addLog(m.id, { t: doneLine(list) }); if (live.current) setTyping(false); }, 600); return; }
    // a question: North answers from the goal and nothing new is made
    if (isAsk(t)) { setTyping("ask"); setTimeout(() => { addLog(m.id, { t: answerOf(t, m, moves, st.own) }); if (live.current) setTyping(false); }, 700); return; }
    const [k, named] = routeOf(t, m), N = nameOf(k), body = t.replace(/@[a-z]+[,:]?\s*/i, "").replace(/[.!]+$/, "").trim();
    setTyping("do");
    setTimeout(() => {
      addMine(m.id, { k: `mine-${Date.now()}`, mine: true, who: k, t: body.charAt(0).toUpperCase() + body.slice(1), stake: "Your move",
        why: named ? `You sent it through North. ${N} carries it out and reports back here.` : `${OWNS[k] || `It’s ${N}’s`}, so North gave it to ${N}. ${N} reports back here.`,
        state: `${N} has it` });
      addLog(m.id, { t: named ? `Sent to ${N}. It’s a move on this goal now, and ${N} will report back here.` : `That’s ${N}’s. ${OWNS[k] || `It’s ${N}’s`}, so I’ve sent it over. It’s a move on this goal now.` });
      if (live.current) setTyping(false);
    }, 900); };
  const pop = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } };
  return (
    <div className="gq-side" onClick={(e) => e.stopPropagation()}>
      <div className="gq-scroll" ref={scRef}>
        {!moves.length && <motion.p className="gq-none" variants={item} transition={T}>{m.ok}</motion.p>}
        <div className="gq-cards">{moves.map((mv) => <MoveCard key={mv.k} mv={mv} item={item} T={T} />)}</div>
        <div className="gq-log">
          <motion.p className="gq-n" variants={item} transition={T}><NorthLogo size={18} /><span>Ask about this goal, or tell me what should happen.</span></motion.p>
          {log.map((x, i) => x.me ? <motion.p key={i} className="gq-me" {...pop}>{x.t}</motion.p>
            : <motion.p key={i} className="gq-n" {...pop}><NorthLogo size={18} /><span>{x.t}</span></motion.p>)}
          {typing && <p className="gq-n is-typing"><NorthLogo size={18} live /><span>{typing === "ask" ? "Looking into it…" : "Finding who owns it…"}</span></p>}
        </div>
      </div>
      <motion.form className="gq-idea" variants={item} transition={T} onSubmit={send}>
        <input value={idea} onChange={(e) => setIdea(e.target.value)} onKeyDown={(e) => e.key !== "Escape" && e.stopPropagation()} placeholder="Ask North, or tell it what to do" aria-label={`Tell North a move for ${m.label}`} />
        <button type="submit" className={`gq-send${idea.trim() && !typing ? " is-on" : ""}`} disabled={!idea.trim() || typing} aria-label="Send to North"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" /></svg></button>
      </motion.form>
    </div>);
}

// --- what needs her, in the header under the ask: every move waiting on her across the four goals, plus the two documents
// only she can clear. One line each (who · the move · what kind and which goal) with its action right there. Five show;
// the rest are a "See more" away. Handing one off plays out in place (the tick, "Caleb has it") and then the line leaves
const DOC_NEEDS = [{ k: "retplan", who: "jordan", t: "Sign off the Q4 retention plan", kind: "Yours to sign off", g: "Jordan’s draft", act: "Sign off", done: "Signed off" },
  { k: "saastr", who: "lisa", t: "Read Lisa’s draft of your SaaStr talk", kind: "Your read", g: "Before Friday", act: "Open deck", open: true }];
// what an agent can take: the floor's asks of leadership (the same records as the Agents page), each one yes away from done.
// Sam's Home splits his morning this way ("3 are yours; Riley, Orin and North can take the other 4"); hers does too
export const TAKES = [
  { k: "marco-ns", short: "Pull last month’s webinar no-shows", who: "marco", kind: "take", t: "Lisa wants last month’s webinar no-shows", stake: "Marco can pull the list for Thursday",
    sit: "In Marketing weekly, Lisa asked who signed up for last month’s webinar and didn’t show. Nobody took it. Marco can pull the list from sign-ups and attendance, so the reminders reach the right people. (Sample)",
    opts: [{ k: "a", rec: true, l: "Pull the no-show list", d: "Sign-ups against attendance, for Lisa.", btn: "Let Marco", to: "marco", done: "Marco has it",
      steps: [["marco", "Marco matches sign-ups against attendance"], ["marco", "The no-shows, with when they signed up"], ["lisa", "The list lands with Lisa"]] }] },
  { k: "calvin-smb", short: "QBR invites for 4 quiet renewals", need: "calvin-smb", ev: "calvin", who: "calvin", kind: "take", t: "4 SMB renewals due by Dec 31 have gone quiet", stake: "Calvin drafted QBR invites from Jordan",
    sit: "11 of the 29 renewals in Jordan’s book have been touched in the last 60 days. Four SMB accounts haven’t heard from anyone. Calvin drafted QBR invites for all four; they go out from Jordan once you say yes.",
    opts: [{ k: "a", rec: true, l: "Send the QBR invites from Jordan", d: "Calvin tells you who books one.", btn: "Let Calvin", to: "calvin", done: "Calvin has it",
      steps: [["calvin", "Calvin sends the 4 invites from Jordan"], ["jordan", "Replies land with Jordan"], ["calvin", "Calvin tells you who books a QBR"]] }] },
  { k: "orin-prop", short: "Rank Sam’s old demo list", need: "orin-prop", ev: "orin", who: "orin", kind: "take", t: "Sam’s old demo list is next for Outbound", stake: "Orin can rank its 14 open prospects now",
    sit: "Outbound is the biggest gap on the board and has the least work on it. Sam’s old demo list still has 14 open prospects. Orin can rank them, strongest first, so Sam has a list whenever he’s back on Outbound.",
    opts: [{ k: "a", rec: true, l: "Rank Sam’s demo list", d: "Strongest first, with why.", btn: "Let Orin", to: "orin", done: "Orin has it",
      steps: [["orin", "Orin ranks the 14 open prospects"], ["orin", "Strongest first, each with why"], ["sam", "The list lands with Sam"]] }] },
];
TAKES.forEach((mv) => Object.assign(mv, { why: mv.sit, rec: mv.opts[0], act: mv.opts[0].btn }));
const STAKE_W = { outbound: 680, hire: 420, bline: 300, onboard: 160 }; // $K to the quarter, or what a missed deadline costs (sample)
const ALL_MOVES = () => [...GOAL_IDS.flatMap((id) => GOAL_TILES[id].moves), ...TAKES];
export function needsOf(st, keep = new Set()) {
  const out = [];
  Object.values(GOAL_TILES).forEach((m) => [...m.moves, ...(st.mine[m.id] || [])].forEach((mv) => { if (mv.kind && !mv.state && !st.gone[mv.k] && (!st.own[mv.k] || keep.has(mv.k) || (st.run && st.run[mv.k] && !st.run[mv.k].landed))) out.push({ id: mv.k, mv, t: mv.t, kind: mv.kind, g: m.short || m.label, goal: m.id, gl: m.label }); }));
  out.sort((a, b) => (STAKE_W[b.id] || 0) - (STAKE_W[a.id] || 0));
  TAKES.forEach((mv) => { if (!st.gone[mv.k] && (!st.own[mv.k] || keep.has(mv.k) || (st.run && st.run[mv.k] && !st.run[mv.k].landed))) out.push({ id: mv.k, mv, t: mv.t, kind: mv.kind, take: true, g: `${nameOf(mv.who)} can take it` }); });
  return out;
}
// the brief, opened, as Seth drew it (Figma 2:21): glass over the band; the head stacked (the goal it serves, the move at 18 with
// what it's worth, what's happening, the facts); the ways to go on an inset tray, each a card with its button on the right
function OpenBrief({ it, mv, onGoal, onPick, onClose }) {
  const [full, setFull] = useState(false), sitR = useRef(null), [long, setLong] = useState(false);
  useLayoutEffect(() => { const el = sitR.current; if (el) setLong(el.scrollHeight > el.clientHeight + 2); }, [mv.sit]);
  const stake = mv.stake ? mv.stake.replace(/ \(sample\)$/, "").replace(/^(About|Worth|Up|Down) /, (w) => w.toLowerCase()) : "";
  const ev = (e) => { e.stopPropagation(); const id = window.__northAgents?.needJob?.(mv.need); if (!id) return; const r = e.currentTarget.getBoundingClientRect();
    dispatchEvent(new CustomEvent("north:open-job", { detail: { id, from: { left: r.left, top: r.top, width: r.width, height: r.height } } })); };
  // anywhere outside the open card closes it (not a click inside a file or a job that opened from it)
  const box = useRef(null);
  useEffect(() => { const f = (e) => { if (!box.current || box.current.contains(e.target) || e.target.closest(".fm, [role=dialog], .jm-host, .chat")) return; onClose(); };
    const t = setTimeout(() => addEventListener("pointerdown", f), 0); return () => { clearTimeout(t); removeEventListener("pointerdown", f); }; }, []);
  const agent = AGENTS[mv.ev] ? mv.ev : AGENTS[mv.who] ? mv.who : null, askName = agent ? nameOf(agent) : "North";
  const ask = () => { const el = box.current; window.dispatchEvent(new CustomEvent("north:attach", { detail: { k: "chart", t: `${agent ? `@${askName} · ` : ""}${it.t}${stake ? ` · ${stake}` : ""}`, title: it.t, big: stake, el } })); };
  const [talk, setTalk] = useState(false); // talking it through happens here, in the card, not in the chat on the left
  useEffect(() => { const k = (e) => { if (document.querySelector(".tp-push")) return; /* an open progress panel is what you're looking at: its K wins */ if ((e.key === "k" || e.key === "K") && !e.metaKey && !e.ctrlKey && !e.altKey && !/INPUT|TEXTAREA/.test(document.activeElement?.tagName || "") && !document.activeElement?.isContentEditable) { e.preventDefault(); e.stopImmediatePropagation(); setTalk(true); } };
    addEventListener("keydown", k, true); return () => removeEventListener("keydown", k, true); }, []);
  const up = (i, o = {}) => ({ initial: { opacity: 0, y: 10, filter: "blur(3px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { type: "spring", visualDuration: 0.5, bounce: 0.15, delay: 0.05 + i * 0.045, ...o } });
  return (
    <div className="nbo" ref={box}>
      <div className="nbo-head" onClick={(e) => { if (!e.target.closest("button, a")) onClose(); }}>
        <motion.p className="nbo-goal" {...up(0)}><span>{it.gl ? (onGoal ? <>Goal: <button type="button" onClick={(e) => { e.stopPropagation(); onGoal(it.goal); }}>{it.gl}</button></> : `Goal: ${it.gl}`) : `${nameOf(mv.who)}’s ask`}</span>
          {/* no hint on show: K still asks about this, the way it steers work in the progress panel */}</motion.p>
        <motion.h4 className="nbo-t" {...up(1)}>{it.t}{stake ? ` (${stake})` : ""}</motion.h4>
        {/* what's happening: two lines, the rest a click away */}
        <motion.p ref={sitR} className={`nbo-sit${full ? " is-full" : ""}`} {...up(2)}>{mv.sit}</motion.p>
        {(long || full) && <button type="button" className="nbo-more" onClick={(e) => { e.stopPropagation(); setFull((v) => !v); }}>{full ? "See less" : "See more"}</button>}
        {mv.facts && <dl className="nbo-facts">{mv.facts.map(([l, v], i) => <motion.div key={l} {...up(3 + i)}><dt>{l}</dt>
          <dd>{v}</dd></motion.div>)}</dl>}
      </div>
      {/* the ways on: each one a button that says exactly what it does (the recommended one filled), what it gets you and costs
          under them for whichever you're on, and a last way to say something else */}
      {mv.opts && <OptTray mv={mv} onPick={onPick} onClose={onClose} talk={talk} setTalk={setTalk} />}
    </div>);
}
// the ways on, as a routine card does it: one row of buttons in the tray (the recommended one filled), each saying exactly what
// it does, then a quiet Something else. That (or K) opens a conversation right here in the card: ask about the call and North
// answers from what the goal knows; say what should happen instead and it goes to whoever owns it, as the call
function OptTray({ mv, onPick, onClose, talk, setTalk }) {
  const opts = [...mv.opts].sort((x, y) => (y.rec ? 1 : 0) - (x.rec ? 1 : 0)), [msgs, setMsgs] = useState([]), [txt, setTxt] = useState(""), [busy, setBusy] = useState(false), live = useRef(true);
  useEffect(() => () => { live.current = false; }, []);
  const g = Object.values(GOAL_TILES).find((m) => m.moves.some((x) => x.k === mv.k));
  const send = (e) => { e.preventDefault(); e.stopPropagation(); const t = txt.trim(); if (!t || busy) return; setTxt(""); setMsgs((M) => [...M, { me: true, t }]); setBusy(true);
    if (isAsk(t)) { setTimeout(() => { if (!live.current) return; // the card already says what's happening: the answer keeps only what it adds
      // a straight answer, short: the sentences that answer it (the cause for a why), not the card read back
      const a = g ? answerOf(t, g, g.moves, S.own) : "", ss = a.split(/(?<=[.!?])\s+/).filter(Boolean), why = /^\s*why\b/i.test(t);
      const pick = (why ? ss.filter((x) => /\b(after|because|since|dropped|fell|no follow|moved|cut|came from)\b/i.test(x)) : ss.filter((x) => !/^What it’s worth/.test(x))).slice(0, 2);
      setMsgs((M) => [...M, { t: pick.length ? pick.join(" ") : ss.slice(0, 2).join(" ") || "I don’t have more on this one yet. Say what should happen and I’ll send it to whoever owns it." }]); setBusy(false); }, 700); return; }
    const [k] = routeOf(t, g || {}), N = nameOf(k), body = t.replace(/@[a-z]+[,:]?\s*/i, "").replace(/[.!]+$/, "");
    setTimeout(() => { if (!live.current) return; setMsgs((M) => [...M, { t: `That’s ${N}’s. Sending it over as your call; you’ll see it moving in progress.` }]); setBusy(false);
      setTimeout(() => onPick({ k: "x", l: body, btn: body, to: k, done: `${N} has it`, steps: [[k, `${N} has your note: ${body.charAt(0).toLowerCase() + body.slice(1)}`], [k, `${N} works it out with the team`], [k, `${N} reports back here`]] }), 1300); }, 800); };
  const fade = (i) => ({ initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { type: "spring", visualDuration: 0.45, bounce: 0.15, delay: 0.28 + i * 0.06 } });
  const ARROW = <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4" /></svg>;
  return (
    <div className="nbo-tray" onClick={(e) => { if (!e.target.closest("button, a, input, form, .nbo-chat")) onClose(); }}>
      <AnimatePresence mode="wait" initial={false}>{talk
        ? <motion.div key="c" className="nbo-chat" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0, transition: { duration: 0.2 } }} transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}>
            {msgs.length > 0 && <div className="nbo-msgs">{msgs.map((m, i) => <motion.p key={i} className={`nbo-m${m.me ? " is-me" : ""}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              {!m.me && <NorthLogo size={14} />}<span>{m.t}</span></motion.p>)}
              {busy && <p className="nbo-m is-wait"><NorthLogo size={14} /><span>Thinking it through…</span></p>}</div>}
            <form className="nbo-bar" onSubmit={send}>
              <input autoFocus value={txt} onChange={(e) => setTxt(e.target.value)} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setTalk(false); } }} placeholder="Ask about this, or say what should happen instead" aria-label="Talk about this call" />
              <button type="submit" className="voice nbo-send" disabled={!txt.trim() || busy} aria-label="Send">{ARROW}</button>
            </form>
            <button type="button" className="rt-b is-q nbo-back" onClick={() => setTalk(false)}>Back to the choices</button>
          </motion.div>
        : <motion.div key="b" className="rt-acts nbo-acts" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            {opts.map((o, i) => <motion.button key={o.k} type="button" className={`rt-b${o.rec ? " is-pri" : ""}`} title={o.d} onClick={(e) => { e.stopPropagation(); onPick(o); }} whileTap={{ scale: 0.97 }} {...fade(i)}>{o.btn}</motion.button>)}
            <motion.button type="button" className="rt-b is-q" title="Talk it through here (or press K)" onClick={(e) => { e.stopPropagation(); setTalk(true); }} {...fade(opts.length)}>Something else</motion.button>
          </motion.div>}</AnimatePresence>
    </div>);
}
function NeedRow({ it, lead, onGoal, onAct, onAside, on = false, setOn = () => {} }) {
  const st = useS(), own = st.own, has = own[it.id], [hv, setHv] = useState(false), at = useRef({ x: 100, w: 600 }), mv = it.mv;
  // the card grows from the line's height to the brief's (and back), measured, so opening is one smooth move, not a pop
  const inR = useRef(null), [h, setH] = useState(null);
  useLayoutEffect(() => { const el = inR.current; if (!el) return; const ro = new ResizeObserver(() => setH(el.offsetHeight)); ro.observe(el); setH(el.offsetHeight); return () => ro.disconnect(); }, []);
  const open = (e) => (it.doc ? showFile(it.doc, e.currentTarget) : setOn(!on));
  useEffect(() => { if (!on) return; const k = (e) => { if (e.key === "Escape" && !document.querySelector(".fm, [role=dialog], .jm-host")) setOn(false); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [on]);
  const pick = (o) => { setOn(false); choose(mv, o); };
  const going = has && !it.doc && st.run && st.run[it.id] && !st.run[it.id].landed;
  const act = (e) => { e.stopPropagation();
    if (it.doc) { if (mv.open) { showFile(it.doc, e.currentTarget); return; } onAct(it.id); setOwn(it.id, mv.done); return; }
    pick(mv.rec); };
  const isOpen = on && !it.doc && !has;
  return (
    // closed, it's the line; opened, the line gives way to the brief (a crossfade inside a card that grows, so nothing slides
    // about); handed off, it stays lit with who has it for a beat, then closes up
    <motion.li className={`nd-row${has ? " is-done" : ""}${isOpen ? " is-on" : ""}${going ? " is-going" : ""}`} layout="position" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.36, ease: [0.4, 0, 0.2, 1] } }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      <div className="nd-sz" style={h != null ? { height: h } : undefined}>
      <div ref={inR} className="nd-sz-in">
      <AnimatePresence initial={false} mode="popLayout">
        {isOpen ? <motion.div key="o" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.28, delay: 0.06 }}>
            <OpenBrief it={it} mv={mv} onGoal={onGoal} onPick={pick} onClose={() => setOn(false)} /></motion.div>
          : <motion.div key="c" className="nd-in" role="button" tabIndex={0} aria-expanded={it.doc ? undefined : false} onClick={open} onKeyDown={(e) => e.key === "Enter" && open(e)}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.2 }}
            onPointerEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(true); }} onPointerLeave={() => setHv(false)}>
        <AnimatePresence>{hv && !has && <RowHover key="h" o={at.current} t={{ type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }} />}</AnimatePresence>
        <span className="nd-f"><Av k={going ? st.run[it.id].o.to : mv.who} size={22} /></span>
        <span className="nd-w"><b>{it.t}</b><span>{it.doc ? it.g : `${it.from ? it.from + " · " : ""}${mv.stake.replace(/ \(sample\)$/, "")}`}</span></span>
        <span className="nd-a">
          <AnimatePresence mode="popLayout" initial={false}>
            {has ? <motion.em key="has" className="gq-has" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>{TICK}{has}</motion.em>
              : <motion.button key="b" type="button" className={`rt-b${it.take ? " is-let" : lead ? " is-pri" : ""}`} whileTap={{ scale: 0.97 }} exit={{ opacity: 0, x: 6, transition: { duration: 0.15 } }} onClick={act}>{mv.act}</motion.button>}
          </AnimatePresence>
        </span>
        {!it.doc && !has ? <button type="button" className="ibtn nd-x" aria-label={`Set aside “${it.t}”`} title="Set aside (it stays on its goal)" onClick={(e) => { e.stopPropagation(); setGone(it.id, true); onAside && onAside(it); }}>
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true"><path d="M2 2l6 6M8 2 2 8" /></svg></button>
          : <span className="ibtn nd-x is-sp" aria-hidden="true" />}
          </motion.div>}
      </AnimatePresence>
      </div></div>
    </motion.li>);
}
// Moving: what she handed off, under what still needs her. Each runs its steps where she can see them: done, happening now
// (the one with the live mark), next. It lands here as its line leaves the list above, so it reads as the line moving down
const STEP_MS = 2600;
function useTick(on) { const [, set] = useState(0); useEffect(() => { if (!on) return; const t = setInterval(() => set((x) => x + 1), 400); return () => clearInterval(t); }, [on]); }
// one line per hand-off, the way Sam's In progress reads: who has it · the move · what's happening now · North's tick meter.
// It is the same element that left Needs you (shared layoutId), so the line travels down and lands here
const NTK = 20;
function Ticks({ prog }) { const on = Math.max(1, Math.round(prog * NTK));
  return <span className="fd-mk" aria-label={`${Math.round(prog * 100)}% done`}>{Array.from({ length: NTK }, (_, i) => <i key={i} className={i < on ? "is-on" : ""} />)}</span>; }
// what happens once a hand-off has run: who checks whether it worked, when, and against what it is today. The check is booked
// (Riley's "did it work?" on the Agents floor); its result comes back to the same row
const CHECK = { outbound: "Riley checks Outbound on Nov 11 · 23% of pace today", hire: "Paul has the number for the plan · Riley checks Outbound on Jan 5", bline: "Jordan has Brightline’s answer by Nov 14",
  onboard: "Calvin checks days to 10 handoffs on Nov 11 · 20.9 today", "calvin-smb": "Calvin tells you who books a QBR", "orin-prop": "The list is with Sam", "marco-ns": "The list is with Lisa" };
// calls she made earlier this quarter, and how they landed: from the story's own numbers (sample). One of them is why Outbound
// needs her today
const LANDED = [
  { k: "l-portal", tl: "Outbound pace after the SDR move", tv: "23%", sh: "The SDR move", who: "caleb", t: "Two SDRs to inbound for the Portal launch", when: "Oct 14", res: "Inbound at 128% of pace; Outbound down to 23%", v: "Cost Outbound", bad: true },
  { k: "l-coast", tl: "Coastline, days to 10 handoffs", tv: "11", sh: "Coastline’s 5-day plan", who: "jordan", t: "Coastline on a 5-day onboarding plan", when: "Oct 6", res: "11 days to 10 handoffs, against 20.9 everywhere else", v: "Held" },
  { k: "l-spons", tl: "Expansion deals booked", tv: "45", sh: "Exec sponsors", who: "jordan", t: "Exec sponsors on the top 10 expansion deals", when: "Sep 29", res: "45 deals booked against a goal of 40", v: "Held" },
];
function MovingRow({ r }) {
  const el = Date.now() - r.landedAt, steps = r.o.steps || [], n = steps.length || 1, done = el > 900 + STEP_MS * n;
  const at = Math.min(n - 1, Math.floor(Math.max(0, el - 900) / STEP_MS)), prog = done ? 1 : Math.min(0.85, 0.08 + Math.max(0, el) / (STEP_MS * n * 1.2));
  const line = el < 900 ? `${nameOf(r.o.to)} has it` : done ? `Done · ${CHECK[r.mv.k] || "North tells you how it lands"}` : steps[Math.max(0, at)] ? steps[Math.max(0, at)][1] : "Working";
  return (
    <motion.div className={`fd-mv-r${done ? " is-done" : ""}`}>
      <span className="fd-mv-f"><Av k={(!done && el >= 900 && steps[Math.max(0, at)] && steps[Math.max(0, at)][0]) || r.o.to} size={22} /></span>
      <span className="fd-mv-t">
        <TypeLine className="fd-mv-s" parts={(() => { const w = el < 900 ? r.o.to : done ? null : steps[Math.max(0, at)] ? steps[Math.max(0, at)][0] : null, nm = w ? nameOf(w) : null;
          return nm && line.startsWith(nm) ? [[nm, done ? "ok" : "work"], line.slice(nm.length)] : done ? [["Done", "ok"], line.slice(4)] : [line]; })()} /></span>
      {done ? <span className="nd-v">{TICK}</span> : <Ticks prog={prog} />}
    </motion.div>);
}
function LandedRow({ x, i = 0, still }) {
  if (still) return (
    <div className="fd-mv-r is-landed"><span className="fd-mv-f"><Av k={x.who} size={22} /></span>
      <span className="fd-mv-t"><b>{x.t}</b><span className="fd-mv-s">{x.when} · {x.res}</span></span><span className={`nd-v${x.bad ? " is-bad" : ""}`}>{x.v}</span></div>);
  return (
    <motion.div className="fd-mv-r is-landed" initial={{ opacity: 0, x: -14 - i * 10, filter: "blur(4px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", visualDuration: 0.55, bounce: 0.2, delay: 0.06 + i * 0.11 }}>
      <span className="fd-mv-f"><Av k={x.who} size={22} /></span>
      <span className="fd-mv-t"><b>{x.t}</b><span className="fd-mv-s">{x.when} · {x.res}</span></span>
      <span className={`nd-v nd-stamp${x.bad ? " is-bad" : ""}`} style={{ animationDelay: `${0.35 + i * 0.11}s` }}>{x.v}</span>
    </motion.div>);
}
export function Moving() { return null; } // In progress now lives in Needs you's strip
// the morning in one strip under the top three: every piece of it sits in one stage, left to right, the way a call travels:
// more of hers, what an agent can take, what's moving, what landed. Each stage is its ticks and a count; one opens at a time,
// in place. Moving opens by itself while something runs, so a hand-off still visibly travels down into it
const runDone = (r) => Date.now() - r.landedAt > 900 + STEP_MS * ((r.o.steps || []).length || 1);
const progOf = (r) => { const el = Date.now() - r.landedAt, n = (r.o.steps || []).length || 1; return Math.min(1, Math.max(0, (el - 600) / (900 + STEP_MS * n - 600))); };
// the bar: the rest of her morning as one bar of cells, the way a disk-usage bar shows a drive. One block of cells per piece
// of work, grouped by stage: still yours (navy), an agent can take (teal), working (teal, lit as far as it has got, the live
// edge shedding sparks), landed (purple where it held, dark red where it cost us). Above it, one line says what's happening
// now and types itself in when it changes, the word that changed set in a colour block. Below, the stages: pick one and the
// pill rolls to it and its list opens out of the bar
// the line above the bar: it types itself in whenever what it says changes, and the words that carry it sit in colour blocks
// a line that writes itself in, the way the type references do: a couple of letters at a time, the word that carries it set
// in a solid colour block while it lands, which then lets go so the line settles back to plain text
function TypeLine({ parts, className = "mb-line" }) {
  const text = parts.map((p) => (Array.isArray(p) ? p[0] : p)).join(""), [n, setN] = useState(0), [set, setSet] = useState(false);
  useEffect(() => { setN(0); setSet(false); let i = 0, t2 = 0; const t = setInterval(() => { i += 2; setN(i); if (i >= text.length) { clearInterval(t); t2 = setTimeout(() => setSet(true), 900); } }, 22);
    return () => { clearInterval(t); clearTimeout(t2); }; }, [text]);
  let left = n;
  return <span className={className} aria-label={text}>{parts.map((p, i) => { const s0 = Array.isArray(p) ? p[0] : p, tone = Array.isArray(p) ? p[1] : null, show = s0.slice(0, Math.max(0, left)); left -= s0.length;
    return tone ? <span key={i} className={`mb-blk is-${tone}${set ? " is-set" : ""}`}>{show}</span> : <span key={i}>{show}</span>; })}</span>;
}
// under her calls, one line: what the work she handed off is doing right now, typed in as it changes, the one who's doing it
// in a colour block. With nothing moving it plays back how her recent calls landed. Click it for the whole list; the one
// button beside it hands what an agent can take to that agent
// under her calls: the rest of what's hers (one quiet line: the call that didn't make the top three, and what an agent can
// take, with the one button that lets them), then In progress, the work she's handed off, each step writing itself in as it
// happens. With nothing moving, In progress is one line: how her recent calls landed, which opens
// what an agent can take: one row in the list, built like the others (their faces, what they'd take, one button), that opens
// to the two pieces themselves, each with its own button
function TakeRow({ items, open, setOpen, onLet }) {
  const ags = [...new Set(items.map((x) => x.mv.who))], [hv, setHv] = useState(false), at = useRef({ x: 100, w: 600 });
  return (
    <li className="nd-row is-takes">
      <div className="nd-in" role="button" tabIndex={0} aria-expanded={open} onClick={() => setOpen(!open)} onKeyDown={(e) => e.key === "Enter" && setOpen(!open)}
        onPointerEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(true); }} onPointerLeave={() => setHv(false)}>
        <AnimatePresence>{hv && <RowHover key="h" o={at.current} t={{ type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }} />}</AnimatePresence>
        <span className="nd-f nd-faces">{ags.map((k) => <Av key={k} k={k} size={22} />)}</span>
        <span className="nd-w"><b>{listOf(ags.map(nameOf))} can take {items.length}</b><span>{items.map((x) => x.mv.short || x.t).join(" · ")}</span></span>
        <span className="nd-a"><motion.button type="button" className="rt-b is-let" whileTap={{ scale: 0.97 }} onClick={(e) => { e.stopPropagation(); onLet(); }}>Let them</motion.button></span>
        <span className="ibtn nd-x is-sp" aria-hidden="true" />
      </div>
    </li>);
}
// a number that rolls to its value, a column of digits per place (the reference's odometer)
function Roll({ v }) {
  const [on, setOn] = useState(false); useEffect(() => { const t = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true))); return () => cancelAnimationFrame(t); }, []);
  return <span className="rl-n" aria-label={v}>{String(v).split("").map((ch, i) => /\d/.test(ch)
    ? <span key={i} className="rl-d" aria-hidden="true"><span className="rl-col" style={{ transform: `translateY(${on ? -+ch : 0}em)`, transitionDelay: `${i * 60}ms` }}>{"0123456789".split("").map((d) => <span key={d}>{d}</span>)}</span></span>
    : <span key={i} aria-hidden="true">{ch}</span>)}</span>;
}
// what the agents are working on right now, from the Agents floor itself (the same jobs, the same progress): yours first
const agentJobs = (max = 5) => { const A = typeof window !== "undefined" && window.__northAgents; if (!A || !A.jobs) return [];
  return A.jobs().filter((j) => j.st === "run" && !j.arch && !j.scale).sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || b.prog - a.prog).slice(0, max)
    .map((j) => ({ j, d: A.detail ? A.detail(j.id) : null })); };
// a look over the shoulder of one piece of work: the task, and how far along it is (top right); under it, what it's doing
// right now, shimmering while it thinks, which opens to every step. The step that's making something shows the thing itself
// when you hover it. K opens a line to steer it: the note goes in as the step it's on now, and the steps open so you see it land
const CHEV = <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3.5 2 3 3-3 3" /></svg>;
const SEND = <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 11.5v-9M3 6.2 7 2.2l4 4" /></svg>;
// a note into work she handed off: it goes in as the step they're on now, and the rest moves down a step
const steerRun = (k, note) => { const r = S.run && S.run[k]; if (!r) return; const st = r.o.steps || [], n = st.length, el = Date.now() - r.landedAt, done = el > 900 + STEP_MS * n;
  const at = done ? n : Math.min(n - 1, Math.floor(Math.max(0, el - 900) / STEP_MS)) + 1, steps = [...st.slice(0, at), [r.o.to, `Working in your note: ${note.length > 60 ? note.slice(0, 60) + "…" : note}`], ...st.slice(at)];
  S.run = { ...S.run, [k]: { ...r, o: { ...r.o, steps }, landedAt: Date.now() - 900 - at * STEP_MS - 60 } }; ping(); };
// ---------------------------------------------------------------- In progress's dots, working: a ring turning through a sphere
// The ticker's In progress mark is eight dots in a ring. Beside the step being worked on, that ring lifts into 3D: its dots
// go round it while the ring turns over, so together they trace a sphere; nearer dots larger and stronger, further ones
// smaller and fainter. Each stage of the work can swing the turn to a new axis (it glides there; nothing slows). Every part
// of it is on a dial under "In progress dots": how many dots, their speed and how far each one's speed or lap is offset from
// the next, each dot's own orbit tilt (fan them out and the ring opens into a sphere), the turn's axis, sizes and opacities
// near and far. Done, or reduced motion: it settles back to the flat mark.
const DS_MAX = 16;
const DS_DEF = { count: 7, march: 1.9, gap: 1, drift: 0.25, twist: 54, turn: 2.6, axisX: 0.58, axisY: 0.27, axisZ: 0, stageSwing: 1, swing: 0.2, radius: 4.8, nearSize: 1, farSize: 0.3, nearOp: 1, farOp: 1, breath: 0 };
const DS_RING = [[0, -4.8], [4, -4], [4.8, 0], [4, 4], [0, 4.8], [-4, 4], [-4.8, 0], [-4, -4]]; // the ticker mark, in order from the top, clockwise
// the axis each stage turns about; neighbours are never opposite, so a change of course swings, it never reverses through a stop
const DS_AXES = [[0, 1, 0], [0.8, 0.6, 0], [1, 0, 0.15], [0.55, -0.8, 0.2], [0.2, 0.95, -0.25], [0.95, 0.2, 0.25]];
const dsNorm = (v) => { const n = Math.hypot(...v) || 1; return v.map((c) => c / n); };
const dsRot = (ax, a) => { const [x, y, z] = ax, c = Math.cos(a), s = Math.sin(a), t = 1 - c; return [t * x * x + c, t * x * y - s * z, t * x * z + s * y, t * x * y + s * z, t * y * y + c, t * y * z - s * x, t * x * z - s * y, t * y * z + s * x, t * z * z + c]; };
const dsMul = (A, B) => [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]));
function DotSphere({ run = true, stage = 0, size = 16, className = "ds" }) {
  const dots = useRef([]), st = useRef(stage);
  useEffect(() => { st.current = stage; }, [stage]);
  useEffect(() => {
    const settings = () => Object.assign({}, DS_DEF, window.__northThink || {});
    const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now(), Q = [1, 0, 0, 0, 1, 0, 0, 0, 1], lift = 0, clock = 0, axis = null, seen = st.current, breath = 0;
    const axisFor = (P, stg) => { const base = dsNorm([P.axisX, P.axisY, P.axisZ]), sa = dsNorm(DS_AXES[stg % DS_AXES.length]), w = Math.max(0, Math.min(1, P.stageSwing));
      return dsNorm(base.map((c, i) => c + (sa[i] - c) * w)); };
    const paint = (P) => {
      const n = Math.max(1, Math.min(DS_MAX, Math.round(P.count))), g = P.radius * (1 + P.breath * Math.sin(Math.PI * breath)), D = Math.PI / 180;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const off = n > 1 ? i / (n - 1) - 0.5 : 0; // -0.5 … 0.5 across the dots
        // round its ring: evenly spaced (gap 1) or bunched (gap < 1), each dot's speed offset by drift
        const a = (i / n) * Math.PI * 2 * P.gap + clock * (1 + P.drift * off * 2);
        let bx = Math.sin(a), by = -Math.cos(a), bz = 0;
        // each dot's own orbit, tipped about the vertical by twist: fanned out, the ring opens into a sphere
        const tw = P.twist * off * 2 * D, c = Math.cos(tw), sn = Math.sin(tw); [bx, bz] = [bx * c, -bx * sn];
        const wx = Q[0] * bx + Q[1] * by + Q[2] * bz, wy = Q[3] * bx + Q[4] * by + Q[5] * bz, wz = Q[6] * bx + Q[7] * by + Q[8] * bz;
        const rest = n === 8 ? DS_RING[i] : [Math.sin((i / n) * Math.PI * 2) * 4.8, -Math.cos((i / n) * Math.PI * 2) * 4.8]; // flat: the ticker mark
        pts.push({ x: 6 + rest[0] + (wx * g - rest[0]) * lift, y: 6 + rest[1] + (wy * g - rest[1]) * lift, z: wz * lift }); }
      pts.sort((p, q) => p.z - q.z);
      for (let k = 0; k < DS_MAX; k++) { const el = dots.current[k]; if (!el) continue; const p = pts[k];
        if (!p) { el.setAttribute("opacity", "0"); continue; }
        const near = (p.z + 1) / 2, mix = (f, nr) => 1.1 + ((f + (nr - f) * near) * 1.1 - 1.1) * lift; // flat, every dot is the mark's 1.1
        el.setAttribute("cx", p.x.toFixed(2)); el.setAttribute("cy", p.y.toFixed(2));
        el.setAttribute("r", Math.max(0, mix(P.farSize, P.nearSize)).toFixed(2));
        el.setAttribute("opacity", Math.max(0, Math.min(1, 1 + ((P.farOp + (P.nearOp - P.farOp) * near) - 1) * lift)).toFixed(2)); } };
    if (reduced) { paint(settings()); return; }
    const tick = (now) => {
      const P = settings(), dt = Math.min(0.05, (now - last) / 1000); last = now;
      lift += ((run ? 1 : 0) - lift) * Math.min(1, dt * 4.5); // lifts into 3D when work starts, settles back to the mark when done
      if (st.current !== seen) { seen = st.current; breath = 1e-6; }
      if (breath > 0) breath = breath >= 1 ? 0 : Math.min(1, breath + dt / Math.max(0.2, P.swing));
      const goal = axisFor(P, seen); if (!axis) axis = goal;
      const k = Math.min(1, (dt / Math.max(0.05, P.swing)) * 3); axis = dsNorm(axis.map((c, i) => c + (goal[i] - c) * k)); // glides to the new axis; the speed stays the same
      if (lift > 0.002) { clock += ((Math.PI * 2) / P.march) * dt * lift; if (P.turn > 0) Q = dsMul(dsRot(axis, ((Math.PI * 2) / P.turn) * dt * lift), Q); }
      else { clock = 0; Q = [1, 0, 0, 0, 1, 0, 0, 0, 1]; }
      paint(P); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run]);
  return <svg className={className} width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" style={{ overflow: "visible" }}>
    {Array.from({ length: DS_MAX }, (_, i) => { const p = DS_RING[i]; return <circle key={i} ref={(c) => (dots.current[i] = c)} cx={p ? 6 + p[0] : 6} cy={p ? 6 + p[1] : 6} r="1.1" opacity={p ? 1 : 0} fill="currentColor" />; })}</svg>;
}

// ---------------------------------------------------------------- the step being worked on: its letters light up, each one whole
// A light travels along the step in reading order, but it lands on letters, not across them: every letter takes one colour
// at a time, so nothing is ever cut through the middle. Letters at the light's core are fully lit, the ones either side fade
// in and out along a curve. Dials under "Step light": pass time, rest, easing, how many letters are lit and how many fade
// each side, the fade's curve, strength, colour (toward a light blue-grey or toward navy), the text's darkness, direction.
const SH_DEF = { on: true, pass: 9.15, rest: 0.9, ease: "linear", width: 2, feather: 3, falloff: 0.75, strength: 0.67, tone: 1, base: 0.81, reverse: false };
const shMix = (a, b, t) => a.map((c, i) => Math.round(c + (b[i] - c) * t));
const shEase = { glide: [0.32, 0.72, 0, 1], smooth: [0.45, 0, 0.55, 1] };
const shBez = ([x1, y1, x2, y2], x) => { const bx = (t) => 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3, by = (t) => 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3;
  let lo = 0, hi = 1; for (let i = 0; i < 20; i++) { const m = (lo + hi) / 2; if (bx(m) < x) lo = m; else hi = m; } return by((lo + hi) / 2); };
function LetterLight({ text }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const old = document.getElementById("pk-light"); if (old) old.remove(); // the earlier angled band wrote its own rule into the page; a page updated in place could still carry it
    const reduced = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0; const t0 = performance.now(), last = [];
    const tick = (now) => {
      const P = Object.assign({}, SH_DEF, window.__northShimmer || {}), ls = el.children, n = ls.length;
      const base = shMix([160, 170, 178], [30, 48, 64], P.base);
      // "light" stops at a blue-grey that still reads on the panel, so a lit letter never disappears
      const peak = P.tone < 0 ? shMix(base, [9, 53, 85], -P.tone * P.strength) : shMix(base, [168, 183, 196], P.tone * P.strength);
      const core = Math.max(0, P.width), fe = Math.max(0, P.feather), span = n + core + 2 * fe; // letters the light travels, start to finish, so it enters and leaves clear of the text
      const pass = Math.max(0.1, P.pass), cyc = pass + Math.max(0, P.rest), t = ((now - t0) / 1000) % cyc;
      let u = Math.min(1, t / pass); if (shEase[P.ease]) u = shBez(shEase[P.ease], u);
      const at = t < pass ? -core / 2 - fe + u * span : -1e9; // the light's centre, in letters; resting, it's nowhere
      for (let i = 0; i < n; i++) { const j = P.reverse ? n - 1 - i : i, d = Math.abs(j + 0.5 - at);
        let k = 0; if (P.on && !reduced) { if (d <= core / 2) k = 1; else if (fe > 0 && d < core / 2 + fe) { const v = 1 - (d - core / 2) / fe; k = Math.pow(v, Math.max(0.2, P.falloff)); } } // fade curve: 1 even steps, below 1 a wide soft glow, above 1 a tight core
        const c = `rgb(${shMix(base, peak, k)})`; if (last[i] !== c) { ls[i].style.color = c; last[i] = c; } } // one colour per letter
      raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text]);
  return <span ref={ref}>{[...text].map((c, i) => <span key={i}>{c}</span>)}</span>;
}

function Peek({ c: c0, title = true, onPin }) {
  const gs = useS(), c = c0.kind === "hand" && gs.run && gs.run[c0.r.mv.k] ? { ...c0, r: gs.run[c0.r.mv.k] } : c0; // a hand-off as it is now, not as it was when the panel opened
  const A = typeof window !== "undefined" && window.__northAgents, [steps, setSteps] = useState(false), [see, setSee] = useState(null), [talk, setTalk] = useState(false), [txt, setTxt] = useState(""), [fresh, setFresh] = useState(null), hvT = useRef(0);
  useTick(c.kind !== "landed");
  const canTalk = (c.kind === "job" && A && A.steer) || c.kind === "hand", who = c.kind === "job" ? c.j.ag : c.kind === "hand" ? c.r.o.to : null;
  useEffect(() => { if (!canTalk) return; const k = (e) => { const t = document.activeElement?.tagName || "";
      if ((e.key === "k" || e.key === "K") && !talk && !e.metaKey && !e.ctrlKey && !e.altKey && !/INPUT|TEXTAREA/.test(t) && !document.activeElement?.isContentEditable) { e.preventDefault(); e.stopImmediatePropagation(); setTalk(true); onPin && onPin(); }
      if (e.key === "Escape" && talk) { e.stopImmediatePropagation(); setTalk(false); } };
    addEventListener("keydown", k, true); return () => removeEventListener("keydown", k, true); }, [talk, canTalk]);
  if (c.kind === "landed") { const x = c.x;
    return <div className="pk">
      {title && <div className="pk-top"><p className="pk-h">{x.t}</p><b className={`pk-v${x.bad ? " is-bad" : ""}`}>{x.v}</b></div>}
      <p className="pk-p">{x.res} · your call on {x.when}, {nameOf(x.who)} ran it</p>
    </div>; }
  let h = "", list = [], k = 0, prog = 0, made = null, done = false;
  if (c.kind === "job") { const d = (A && A.detail && A.detail(c.j.id)) || c.d, plan = (d && d.plan) || [], st = d ? d.st : "run";
    done = st === "done"; k = done ? plan.length : Math.min(d ? d.k : 0, Math.max(0, plan.length - 1)); list = plan; prog = done ? 1 : ((A && A.jobs ? (A.jobs().find((x) => x.id === c.j.id) || c.j).prog : c.j.prog) || 0);
    h = c.j.t; made = A && A.Made ? A.Made({ id: c.j.id }) : null; }
  if (c.kind === "hand") { const r = c.r, st = r.o.steps || [], n = st.length; done = runDone(r);
    k = done ? n : Math.min(n - 1, Math.floor(Math.max(0, Date.now() - r.landedAt - 900) / STEP_MS)); list = st.map((x) => x[1]); prog = done ? 1 : (k + 0.5) / (n || 1); h = r.o.l; }
  const pct = Math.round(prog * 100), now = done ? "Done" : list[k] || null, N = 24;
  const send = (e) => { e.preventDefault(); const v = txt.trim(); if (!v) return; if (c.kind === "job") A.steer(c.j.id, v); else steerRun(c.r.mv.k, v); setTxt(""); setTalk(false); setSteps(true); setFresh(v); setTimeout(() => setFresh(null), 2400); };
  return (
    <div className="pk">
      {/* in the list the row above already says what it is and how far: the open row only adds what it's doing */}
      {title && <div className="pk-top"><p className="pk-h">{h}</p>
        <span className="pk-pr" aria-label={`${pct}% done`}><span className="pk-bar">{Array.from({ length: N }, (_, i) => <i key={i} className={i < Math.max(1, Math.round(prog * N)) ? "is-on" : ""} />)}</span><b>{pct}%</b></span></div>}
      {now && <button type="button" className={`pk-now${steps ? " is-on" : ""}${done ? " is-done" : ""}`} aria-expanded={steps} onClick={() => setSteps((v) => !v)}>
        <DotSphere run={!done} stage={k} />
        <AnimatePresence mode="popLayout" initial={false}><motion.span key={now} className="pk-think" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>{done ? now : <LetterLight text={now} />}</motion.span></AnimatePresence>
        <span className="pk-cv">{CHEV}</span></button>}
      <AnimatePresence initial={false}>{steps && <motion.ol key="st" className="pk-st" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
        {list.map((t, i) => { const st = i < k ? "done" : i === k ? "now" : "next", has = made && i === k, on = has && see === i, mine = /^Working in your note/.test(t);
          return <motion.li key={t} layout="position" initial={mine ? { opacity: 0, height: 0 } : false} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className={`pk-s is-${st}${has ? " has-work" : ""}${on ? " is-open" : ""}${mine && fresh ? " is-fresh" : ""}`}
            onPointerEnter={() => { if (!has) return; clearTimeout(hvT.current); hvT.current = setTimeout(() => setSee(i), 200); }} onPointerLeave={() => { clearTimeout(hvT.current); setSee(null); }}>
            <span className="pk-sr"><span className="pk-sm">{st === "done" ? TICK : <i />}</span><span className="pk-sx">{mine ? <><b>Your note</b>{t.replace(/^Working in your note:\s*/, " ")}</> : t}</span><em>{st === "now" ? "Now" : st === "next" ? "Next" : ""}</em></span>
            <AnimatePresence initial={false}>{on && <motion.div key="w" className="pk-wk" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <div className="pk-made">{made}</div></motion.div>}</AnimatePresence>
          </motion.li>; })}
      </motion.ol>}</AnimatePresence>
      <AnimatePresence initial={false}>{talk && <motion.form key="f" className="pk-cmp" onSubmit={send} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 38 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
        <input ref={(el) => { if (el && !el.dataset.f) { el.dataset.f = "1"; requestAnimationFrame(() => el.focus()); } }} value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={`Tell ${nameOf(who)} what to change…`} aria-label={`Note to ${nameOf(who)}`} />
        <motion.button type="submit" className="voice pk-send" disabled={!txt.trim()} whileTap={{ scale: 0.92 }} aria-label="Send"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4" /></svg></motion.button></motion.form>}</AnimatePresence>
    </div>);
}
// the panel is the strip's own top line pushing up out of the item you're on, the way Watch drops out of the chat's header line:
// born the width of the item, it spreads along the line and rises, its sides curving into the line at soft joints; what's in
// it lands once it's out, and it draws back into the line when you leave
const TP_FILL = "#f8f9fa"; // the strip's colour where the line runs (sampled from the band at that height), so panel and strip are one surface
function TkPanel({ g, px, PW, onEnter, onLeave, children }) {
  const ref = useRef(null), [h, setH] = useState(0);
  useLayoutEffect(() => { const el = ref.current; if (!el) return; const ro = new ResizeObserver(() => setH(el.offsetHeight)); ro.observe(el); setH(el.offsetHeight); return () => ro.disconnect(); }, []);
  const o = Math.max(14, Math.min(PW - 14, g.cx + g.cw / 2 - px)), st = Math.max(30, Math.min(g.cw, PW - 28));
  return (
    <motion.div className="tp-push" style={{ left: px, width: PW }} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0.999, transition: { duration: 0.52 } }} onPointerEnter={onEnter} onPointerLeave={onLeave}>
      {h > 0 && <PushShape axis="y" size={h} w={0.5} fill={TP_FILL} ext={0} cross={PW} origin={o} start={st} className="tp-shape" />}
      <motion.div ref={ref} className="tp-in" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.06, ease: [0.4, 0, 1, 1] } }}>{children}</motion.div>
    </motion.div>);
}
// In progress as a ticker, like an "agents at work" strip: each piece of work a label and its figure in a small well, the
// figures rolling as they move. Hover one: the strip holds, the rest fall back, and that item opens up into a look at the work
// itself. Click it (or start typing a note) and it stays until you click away or press Esc. The label at the front opens the
// whole list in the header
function Ticker({ runs, open, onOpen }) {
  useTick(true); // the figures follow the work as it moves (a note sent from the panel speeds a job back up)
  const [hov, setHov] = useState(null), [pin, setPin] = useState(false), wrap = useRef(null), [box, setBox] = useState(null), leaveT = useRef(0);
  useLayoutEffect(() => { const el = wrap.current, c = el && el.closest(".content"); if (!c) return;
    const f = () => { const p = el.parentElement.getBoundingClientRect(), r = c.getBoundingClientRect(), mn = el.closest(".main"), R = mn ? mn.getBoundingClientRect().right : innerWidth; setBox({ ml: r.left - p.left, w: Math.max(r.width, R - r.left) }); }; // from the card's edge all the way across, to where the band ends
    const ro = new ResizeObserver(f); ro.observe(c); f(); addEventListener("resize", f); return () => { ro.disconnect(); removeEventListener("resize", f); }; }, []);
  const close = () => { setHov(null); setPin(false); };
  useEffect(() => { if (!hov) return; const k = (e) => { if (e.key === "Escape") close(); };
    const d = (e) => { if (!e.target.closest(".tp-push") && !e.target.closest(".tk-c")) close(); };
    addEventListener("keydown", k); document.addEventListener("pointerdown", d, true); return () => { removeEventListener("keydown", k); document.removeEventListener("pointerdown", d, true); }; }, [hov]);
  useEffect(() => { if (open) close(); }, [open]);
  const at = (r) => { const n = (r.o.steps || []).length || 1; return [Math.min(n, 1 + Math.floor(Math.max(0, Date.now() - r.landedAt - 900) / STEP_MS)), n]; };
  const chips = [
    // only what's still moving: anything done lands by Agents in the sidebar instead
    ...runs.filter((r) => !runDone(r)).map((r) => { const [i, n] = at(r); return { k: r.mv.k, kind: "hand", r, l: `${nameOf(r.o.to)} · ${r.o.l}`, v: `${i}/${n}`, roll: true, tone: "" }; }),
    ...agentJobs().map(({ j, d }) => ({ k: `job-${j.id}`, kind: "job", j, d, l: `${nameOf(j.ag)} · ${j.t}`, v: `${Math.round((j.prog || 0) * 100)}%`, roll: true, tone: "" })),
  ];
  const dur = Math.max(70, chips.length * 14); // slow: it's there to glance at, not to watch
  const show = (c, dup, el) => { clearTimeout(leaveT.current); const r = el.getBoundingClientRect(), W = wrap.current.getBoundingClientRect(); setHov({ c, id: c.k + dup, cx: r.left - W.left + 4, cw: r.width - 8, W: W.width }); };
  const enter = (c, dup, e) => { if (pin) return; show(c, dup, e.currentTarget); };
  const leave = () => { if (pin) return; leaveT.current = setTimeout(() => setHov(null), 160); };
  const chip = (c, dup) => { const id = c.k + dup, on = hov && hov.id === id;
    return <span key={id} className={`tk-c${on ? " is-on" : ""}`} aria-hidden={dup ? "true" : undefined} onPointerEnter={(e) => enter(c, dup, e)} onPointerLeave={leave}
      onClick={(e) => { show(c, dup, e.currentTarget); setPin(true); }}>
      <span className="tk-bg" />
      <span className="tk-l">{c.l}:</span><span className={`tk-v${c.tone ? ` is-${c.tone}` : ""}`}>{c.roll ? <Roll v={c.v} /> : c.v}</span></span>; };
  const PW = hov ? Math.max(480, hov.cw) : 480, px = hov ? Math.max(0, Math.min(hov.cx, hov.W - PW - 8)) : 0; // starts where the item starts, so the item sits in its foot
  return (
    <div className={`tk${open ? " is-open" : ""}`} ref={wrap} style={box ? { marginLeft: box.ml, width: box.w } : undefined}>
      <button type="button" className={`tk-lead${open ? " is-on" : ""}`} onClick={onOpen} aria-expanded={open}>
        <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">{[[2, 2], [6, 1.2], [10, 2], [1.2, 6], [10.8, 6], [2, 10], [6, 10.8], [10, 10]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.1" fill="currentColor" />)}</svg>
        In progress{open ? "" : ":"}</button>
      <div className={`tk-run${hov ? " is-held" : ""}`} aria-hidden={open ? "true" : undefined}>
        <div className="tk-track" style={{ animationDuration: `${dur}s` }}>{chips.map((c) => chip(c, ""))}{chips.map((c) => chip(c, "-d"))}</div>
      </div>
      <AnimatePresence>{hov && <TkPanel key={hov.id} g={hov} px={px} PW={PW} onEnter={() => clearTimeout(leaveT.current)} onLeave={leave}>
        <Peek c={hov.c} onPin={() => setPin(true)} />
      </TkPanel>}</AnimatePresence>
    </div>);
}
// In progress, opened: it takes over the header where her calls were, the way the Agents page's list arrives (the old rows
// ease out, then the new ones come in top to bottom, each one a beat after the last). Every row opens in place to the same
// look over the shoulder the ticker gives
function ProgressList({ runs }) {
  const [open, setOpen] = useState(null), [hv, setHv] = useState(null), at = useRef({ x: 100, w: 600 });
  useTick(true);
  const step = (r) => { const steps = r.o.steps || [], n = steps.length || 1; return runDone(r) ? "Done" : `${Math.round(((Math.min(n - 1, Math.floor(Math.max(0, Date.now() - r.landedAt - 900) / STEP_MS)) + 0.5) / n) * 100)}%`; }; // the same figure the panel shows
  const groups = [
    ["You handed off", runs.filter((r) => !runDone(r)).map((r) => ({ k: r.mv.k, kind: "hand", r, face: r.o.to, t: r.o.l, s: step(r), tone: "" }))],
    ["Agents working", agentJobs(8).map(({ j, d }) => ({ k: `job-${j.id}`, kind: "job", j, d, face: j.ag, t: j.t, s: `${Math.round((j.prog || 0) * 100)}%`, tone: "" }))],
  ].filter((g) => g[1].length);
  let n = 0;
  return (
    <div className="pl">{groups.map(([l, rows]) => <section key={l} className="pl-g">
      <h5 style={{ "--i": n++ }}>{l}<span>{rows.length}</span></h5>
      <ol>{rows.map((c) => { const on = open === c.k;
        return <li key={c.k} className={`pl-r${on ? " is-on" : ""}`} style={{ "--i": n++ }}>
          <div className="pl-in" role="button" tabIndex={0} aria-expanded={on} onClick={() => setOpen(on ? null : c.k)} onKeyDown={(e) => e.key === "Enter" && setOpen(on ? null : c.k)}
            onPointerEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(c.k); }} onPointerLeave={() => setHv((h) => (h === c.k ? null : h))}>
            <AnimatePresence>{hv === c.k && !on && <RowHover key="h" o={at.current} t={{ type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }} />}</AnimatePresence>
            <span className="nd-f"><Av k={c.face} size={22} /></span>
            <span className="pl-t">{c.t}</span>
            <span className={`pl-s${c.tone ? ` is-${c.tone}` : ""}`}>{c.s}</span>
          </div>
          <AnimatePresence initial={false}>{on && <motion.div key="x" className="pl-x" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}>
            <Peek c={c} title={false} /></motion.div>}</AnimatePresence>
        </li>; })}</ol>
    </section>)}</div>);
}
// the header's list area changes height smoothly when what's in it swaps (and only then, so a brief opening isn't held back)
function Swap({ k, children }) {
  const inner = useRef(null), [h, setH] = useState(null), [on, setOn] = useState(false), first = useRef(true);
  useLayoutEffect(() => { const el = inner.current; if (!el) return; const ro = new ResizeObserver(() => setH(el.offsetHeight)); ro.observe(el); setH(el.offsetHeight); return () => ro.disconnect(); }, []);
  useEffect(() => { if (first.current) { first.current = false; return; } setOn(true); const t = setTimeout(() => setOn(false), 900); return () => clearTimeout(t); }, [k]);
  return <div className={`nd-swap${on ? " is-swap" : ""}`} style={on && h != null ? { height: h } : undefined}><div ref={inner}>{children}</div></div>;
}
// In progress, opened, takes over the whole header (greeting, ask bar and her calls), so Home's page reads it too
let IP = false; const ipSubs = new Set();
export const setIP = (v) => { IP = typeof v === "function" ? v(IP) : v; ipSubs.forEach((f) => f(IP)); };
export const useIP = () => { const [v, set] = useState(IP); useEffect(() => { ipSubs.add(set); return () => ipSubs.delete(set); }, []); return v; };
export function NeedsYou({ onGoal, only, from = {}, bare = false }) {
  const st = useS(), [openK, setOpenK] = useState(null), [keep, setKeep] = useState(() => new Set()), [more, setMore] = useState(false), [tkOpen, setTkOpen] = useState(false), pm = useIP(), setPm = setIP, [aside, setAside] = useState(null), asT = useRef(0);
  const onAside = (it) => { clearTimeout(asT.current); setAside(it); asT.current = setTimeout(() => setAside(null), 6000); };
  const onAct = (k) => { setKeep((s0) => new Set([...s0, k])); setTimeout(() => setKeep((s0) => { const n = new Set(s0); n.delete(k); return n; }), 1900); };
  const items = needsOf(st, keep).filter((x) => !only || only.includes(x.id)).map((x) => (from[x.id] ? { ...x, from: from[x.id] } : x)), mine = items.filter((x) => !x.take), theirs = items.filter((x) => x.take);
  const TOP = only ? 99 : 3, shown = more ? mine : mine.slice(0, TOP), rest = mine.length - TOP;
  const leadK = (mine.find((x) => !st.own[x.id]) || {}).id;
  const openT = theirs.filter((x) => !st.own[x.id]);
  const runs = Object.values(st.run || {}).filter((r) => r.landed).sort((a, b) => b.at - a.at);
  useTick(runs.some((r) => !runDone(r)) || Object.values(st.run || {}).some((r) => !r.landed));
  const back = useRef(false); // her calls coming back after In progress arrive the same way, row by row
  useEffect(() => () => setIP(false), []); // leaving Home puts the header back
  // a hand-off finishing leaves In progress and lands by Agents in the sidebar, the one place finished work comes back to
  const told = useRef(null);
  useEffect(() => { if (!told.current) { told.current = new Set(runs.filter(runDone).map((r) => r.mv.k)); return; }
    runs.filter((r) => runDone(r) && !told.current.has(r.mv.k)).forEach((r) => { told.current.add(r.mv.k);
      dispatchEvent(new CustomEvent("north:hand-done", { detail: { id: `hand-${r.mv.k}`, t: r.o.l, to: r.o.to, n: nameOf(r.o.to), find: CHECK[r.mv.k] || null } })); }); });
  useEffect(() => { if (pm) { back.current = true; setOpenK(null); } }, [pm]);
  useEffect(() => { if (!pm) return; const k = (e) => { if (e.key === "Escape" && !document.querySelector(".tp-push")) setPm(false); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [pm]);
  const all = () => { setTkOpen(false); openT.forEach((x, i) => setTimeout(() => { choose(x.mv, x.mv.rec); }, i * 520)); };
  if (!items.length && (bare || !runs.length)) return null;
  const row = (it) => <NeedRow key={it.id} it={it} lead={it.id === leadK} onGoal={onGoal} onAct={onAct} onAside={onAside} on={openK === it.id && !st.own[it.id]} setOn={(v) => setOpenK(v ? it.id : null)} />;
  const focus = openK && items.some((x) => x.id === openK && !st.own[x.id]);
  return (
    <section className={`nd${focus && !pm ? " has-open" : ""}${pm ? " is-ip" : ""}`} aria-label={pm ? "In progress" : "Needs you"}>
      <Swap k={pm}>
      <AnimatePresence mode="wait" initial={false}>
      {pm ? <motion.div key="ip" className="nd-stg is-in" exit={{ opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}><ProgressList runs={runs} /></motion.div>
      : <motion.div key="nd" className={`nd-stg${back.current ? " is-in" : ""}`} exit={{ opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}>
      <ul>
        <AnimatePresence initial={false}>{shown.map(row)}</AnimatePresence>
        {openT.length > 0 && <TakeRow items={openT} open={tkOpen} setOpen={setTkOpen} onLet={all} />}
        <AnimatePresence initial={false}>{tkOpen && theirs.map(row)}</AnimatePresence>
      </ul>
      {(rest > 0 || aside) && <div className="nd-sub">
        {rest > 0 && <button type="button" className="nd-more" onClick={() => setMore((v) => !v)}>{more ? "Show fewer" : `${rest} more for you`}</button>}
        <AnimatePresence>{aside && <motion.span key="as" className="nd-aside" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Set aside.<button type="button" onClick={() => { setGone(aside.id, false); setAside(null); }}>Undo</button></motion.span>}</AnimatePresence>
      </div>}
      </motion.div>}
      </AnimatePresence>
      </Swap>
      {!bare && <div className="nd-ip"><Ticker runs={runs} open={pm} onOpen={() => setPm((v) => !v)} /></div>}
    </section>);
}
// what the Meetings page reads: the same decisions, hand-offs and agent jobs as Home, so confirming a step there is confirming it here
const moveOf = (k) => ALL_MOVES().find((mv) => mv.k === k);
export { Peek, Av, agentJobs, runDone, choose, unchoose, moveOf, setGone, DotSphere, STEP_MS, nameOf, useTick, useS as useGoals };
