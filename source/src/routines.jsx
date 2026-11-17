// Routines: North notices you doing the same thing again and offers to take it on, as a card you can read in ten seconds.
// It shows what it noticed, what it would do, when, who sees it, and a real preview (what it would have done with work in
// front of you right now). Change it in plain words, or say not this. Approve is one click: it turns on and runs on the
// deck in front of you; Turn off is always there.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { SlideThumb, addPin, showFile } from "./files.jsx";
import { talk, PEOPLE } from "./team-talk.js";
import { AGENTS, AgentMark } from "./agents.jsx";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const R = { list: {}, subs: new Set() };
const ping = () => R.subs.forEach((f) => f());
export const routineSet = (id, patch) => { R.list[id] = { ...R.list[id], ...(typeof patch === "function" ? patch(R.list[id]) : patch) }; ping(); };
export function useRoutine(id) { const [, f] = useState(0); useEffect(() => { const s = () => f((v) => v + 1); R.subs.add(s); return () => R.subs.delete(s); }, []); return R.list[id]; }
export const ROUTINES = R.list;
// Sam's routines already running (sample). Each starts from a moment, not a clock, and shows what it last did. Their work is
// in motion on Home under In progress; Promise keeper is silent because nothing is at risk (that's the point of it)
const SEED = [
  { id: "newclient", t: "New client kit", agent: "orin", crew: ["orin", "calvin", "riley"], stage: "on", when: "When a new brokerage books a demo", last: "Crescent Realty Group's kit is ready", piece: "rt-newclient",
    about: "Three things to do before the call, and your deck rebuilt for the brokerage you’re meeting.",
    roles: { orin: "What they looked at", calvin: "The customer most like them", riley: "How they buy" },
    whens: ["When a new brokerage books a demo", "When a demo is two days out", "Only teams over 30 agents"], sees: "A private draft, from you", seeOpts: ["A private draft, from you", "Shared with the deal's team"],
    checks: [["Pages they opened on our site", "orin"], ["The customer most like them", "calvin"], ["Who signs, from their last software buy", "riley"]],
    runs: [["Crescent Realty Group", "Today", "3 to-dos, deck tailored"], ["Lakeshore Home Partners", "Nov 3", "Second demo, for their ops lead (sample)"], ["Pinecrest Brokers", "Oct 28", "Booked after the webinar (sample)"]] },
  { id: "launch", t: "Launch breakdown", agent: "marco", crew: ["marco"], stage: "on", when: "When a campaign goes live", last: "Q4 brokerage sequence, live since this morning", piece: "rt-launch",
    about: "The campaign read the way you read one, early enough to change course.",
    roles: { marco: "Reads the campaign as it runs" },
    whens: ["When a campaign goes live", "Only Sales campaigns", "Only email sequences"], sees: "On Home, through its first week", seeOpts: ["On Home, through its first week", "One summary, Friday"],
    checks: [["Replies before opens, by team size", "marco"], ["Who asked for a demo", "marco"], ["Pace against the last launch", "marco"]],
    runs: [["Q4 brokerage sequence", "Today", "Live"], ["September nurture", "Sep 8", "29 demos in week one (sample)"]] },
  { id: "promises", t: "Promise keeper", agent: "north", crew: ["north"], stage: "on", when: "When you promise something with a date", last: "Holding 2 of your promises, none at risk", piece: "rt-promises",
    about: "If a date you gave is going to slip, you hear before they do, with a note drafted to move it.",
    roles: { north: "Holds the date, warns you early" },
    whens: ["When you promise something with a date", "Only promises to customers"], sees: "Only when one is at risk", seeOpts: ["Only when one is at risk", "A Monday list of all of them"],
    checks: [["Dates you give in chats and email", "north"], ["Asks you said yes to", "north"]],
    runs: [["Brightwater hand-off", "Oct 22", "Kept, a day early"], ["Coastline pricing", "Oct 17", "Kept (sample)"]] },
  { id: "premortem", t: "Pre-mortem", agent: "riley", crew: ["riley", "calvin", "orin"], stage: "on", when: "When a deal enters its last 5 days", last: "Coastline Brokers, running now", piece: "rt-premortem",
    about: "How the deal could slip, worked out as if it already had, with an owner on each risk.",
    roles: { riley: "Runs it, owns the forecast", calvin: "Past deals like it", orin: "Who's gone quiet" },
    whens: ["When a deal enters its last 5 days", "Its last 10 days", "Only deals over $20K"], sees: "On the deal, in its forecast", seeOpts: ["On the deal, in its forecast", "On the deal and on Home"],
    checks: [["Past deals like it that slipped", "calvin"], ["The champion going quiet", "orin"], ["Legal and security pace", "riley"]],
    runs: [["Coastline Brokers", "Today", "Running"], ["Harbor Point Realty", "Oct 19", "1 risk, cleared (sample)"]] },
];
SEED.forEach((r) => { R.list[r.id] = r; });
const PM = ["Comparing it with 3 past deals that slipped at legal review", "Calvin: their legal team took 9 days the last time they bought software", "Orin: Priya hasn't opened the last two emails", "Riley: putting an owner on each risk"];
talk.addPiece({ k: "rt-premortem", rt: "premortem", t: "Pre-mortem \u00b7 Coastline Brokers", bots: ["riley", "calvin", "orin"], people: [], zone: "moving", pr: 1, stTxt: "Working", line: PM[0], prog: 0.12 });
talk.addPiece({ k: "rt-launch", rt: "launch", t: "Launch breakdown \u00b7 Q4 brokerage sequence", ag: "marco", zone: "moving", pr: 1, stTxt: "Live", line: "6 hours in: 212 opens, 9 replies (sample)", prog: 0.3 });
talk.addPiece({ k: "rt-promises", rt: "promises", t: "Promise keeper \u00b7 your dates", bots: ["north"], people: [], zone: "moving", pr: 1, stTxt: "Watching", line: "2 promises this week, none at risk" });
talk.addPiece({ k: "rt-newclient", rt: "newclient", t: "New client kit \u00b7 Crescent Realty Group", bots: ["orin", "calvin", "riley"], people: [], zone: "landed", pr: 1, stTxt: "Ready",
  line: "3 things to do before Thursday's demo, and your deck tailored to them. A private draft, from you." });
// the routines' work moves on its own clock while you're in North: the pre-mortem works through its steps and lands with its
// risks; the launch keeps reading the campaign and says where the week is heading
if (typeof window !== "undefined") { let i = 0; const t = setInterval(() => { const pm = talk.piece("rt-premortem"); i++;
  if (pm && pm.zone === "moving") { const n = Math.min(PM.length, Math.floor(i / 2)); if (n < PM.length) talk.updPiece("rt-premortem", { line: PM[n], prog: Math.min(0.92, 0.12 + i * 0.1) });
    else { talk.updPiece("rt-premortem", { zone: "landed", stTxt: "Done", prog: 1, line: "Two risks: legal's 9-day pace (Dustin's) and Priya going quiet (yours). Added to the forecast's \u201cIf it slips\u201d line." }); routineSet("premortem", (r) => ({ last: "Coastline Brokers: 2 risks, each with an owner", runs: [["Coastline Brokers", "Today", "2 risks, each with an owner"], ...r.runs.slice(1)] })); } }
  const ln = talk.piece("rt-launch"); if (ln && ln.zone === "moving") talk.updPiece("rt-launch", { prog: Math.min(0.6, ln.prog + 0.02), line: i > 5 ? "On track for 41 demos by Friday, 12 above September (sample)" : ln.line });
  if (i > 40) clearInterval(t); }, 3500); }
// where your routines live: the Agents page, beside what the agents are running (a routine is standing work, like their
// standing orders). One row each: what it is, whether it's on, and what it covers. It opens where it lives, the
// conversation it was offered in, with its card (change it, turn it off) right there
export function RoutineList() {
  const [, f] = useState(0); useEffect(() => { const s = () => f((v) => v + 1); R.subs.add(s); return () => R.subs.delete(s); }, []);
  const [open, setOpen] = useState(null);
  const L = Object.values(R.list).filter((r) => r && r.stage !== "no"); if (!L.length) return null;
  const st = (r) => (r.stage === "on" ? "On" : r.stage === "off" ? "Off" : "Needs your OK");
  const cover = (r) => r.when.replace(/^Whenever an? /, "").replace(/ is shared with you$/, "s").replace(/^deck(s?)$/, "Every deck");
  return <section className="rl3-sec rl3-ready rl3-rts"><h6>Routines</h6>
    {L.map((r) => <button key={r.id} className="rl3-rd" onClick={(e) => { if (r.about) { const b = e.currentTarget.getBoundingClientRect(); setOpen({ id: r.id, from: { left: b.left, top: b.top, width: b.width, height: b.height } }); return; } if (r.piece) { window.__northRtView = r.piece; window.__northBack = "agents"; window.__northOpenFile = r.piece; window.__northNav?.("home"); setTimeout(() => dispatchEvent(new CustomEvent("north:open-file", { detail: { k: r.piece } })), 400); } else if (r.chat || r.id === "deckreview") dispatchEvent(new CustomEvent("north:open-thread", { detail: { id: r.chat || "t-web" } })); }}>
      <span className="rl3-rd-t"><Glyph /><b>{r.t}</b></span><span className="rl3-rd-m">{st(r)}<i className="sep">·</i>{r.last || cap(cover(r))}</span></button>)}
    {typeof document !== "undefined" && createPortal(<AnimatePresence>{open && <RoutineSheet key={open.id} id={open.id} from={open.from} onClose={() => setOpen(null)} />}</AnimatePresence>, document.body)}</section>;
}

// The example: the same notes on Sam's last three deck reviews. Only the first is in this prototype's own conversations
// (Q1 webinar, slide 3); the other two are sample history and say so. The preview is real: it reads the webinar deck's slides.
const DECK_REVIEW = () => ({
  id: "deckreview", agent: "north", stage: "proposed", runs: 0, ver: 1, changed: [],
  t: "Review decks before they reach you",
  noticed: "Your last three deck reviews came back with the same notes:",
  notes: [
    { t: "Lead with who it’s for", from: "Q1 webinar, yesterday" },
    { t: "Source every number", from: "Q4 customer slide · sample" },
    { t: "Name the customer", from: "Brightwater case study · sample" },
  ],
  cmt: "leaves the author comments on what’s off",
  when: "Whenever a deck is shared with you",
  who: "The comments come from you",
  preview: { k: "webdeck", by: "paul", items: [
    { i: 1, note: 0, t: "The hook doesn’t say who it’s for. Lead with brokerages over 50 agents, the ones who book demos." },
    { i: 3, note: 2, t: "No customer is named yet. Name one before Lisa sees it Thursday, or cut this slide." },
  ], pass: [{ i: 2, note: 1, t: "Slide 3’s figures say where they’re from (Riley)." }] },
});
export const proposeDeckReview = () => { R.list.deckreview = DECK_REVIEW(); ping(); return "deckreview"; };

// Beyonce's: the Monday sync doc. She's asked Orin for it three Mondays running (the two before this one are sample history).
// The example is real: this Monday's draft, the file on her Home
const MONDAY_SYNC = () => ({
  id: "mondaysync", kind: "doc", agent: "orin", crew: ["orin"], stage: "proposed", ver: 1, changed: [], piece: "rt-mondaysync",
  t: "Draft the Monday sync doc", when: "every Monday at 7:00", whens: ["every Monday at 7:00", "every Sunday evening", "every Monday at 8:30"],
  last: "Offered in the Monday leadership sync",
  noticed: "You’ve asked Orin for the sync doc the last three Mondays (two of those are sample history).",
  does: "drafts the sync doc from Company health and the week’s agent work", sees: "A draft in your work. It reaches the team only when you share it",
  preview: { k: "syncdoc" },
});
export const proposeMondaySync = () => { R.list.mondaysync = MONDAY_SYNC(); ping(); return "mondaysync"; };
// the card for a routine that makes a document: what it noticed, what it would do and when, who sees it, and this week's
// draft as the example. Change it is one question (when); Approve turns it on; Turn off is always there
function DocRoutine({ id, r }) {
  const [editing, setEditing] = useState(false), [when, setWhen] = useState(r.when);
  const lc = (x) => x.charAt(0).toLowerCase() + x.slice(1);
  const piece = (f) => { if (talk.piece(r.piece)) talk.updPiece(r.piece, f); };
  const approve = () => { routineSet(id, { stage: "on", last: `On · ${r.when}` }); piece({ zone: "landed", act: null, stTxt: "On", line: `On. Orin drafts it ${r.when}, and it waits in your work to share.` }); };
  const decline = () => { routineSet(id, { stage: "no" }); piece({ zone: "landed", act: null, stTxt: "Declined", line: "You said not this. North won’t offer it again." }); };
  if (r.stage === "no") return <div className="rt is-quiet"><div className="rt-s"><p className="rt-d">Okay. North won’t suggest this one again.</p></div></div>;
  if (r.stage === "off") return <div className="rt is-quiet"><div className="rt-s"><p className="rt-d">Turned off. Orin won’t draft the sync doc on its own; ask for it any time.</p></div></div>;
  if (r.stage === "on") return (
    <motion.div className="rt" layout transition={{ duration: 0.45, ease: SX }}>
      <div className="rt-s"><Eye>Routine · on</Eye><h4 className="rt-t">{r.t}</h4>
        <p className="rt-d">On. Orin {r.does} {r.when}. It lands in your work as a draft and reaches the team only when you share it.</p></div>
      <div className="rt-acts"><button type="button" className="rt-b" onClick={() => showFile(r.preview.k, null, { full: true })}>See this week’s</button>
        <button type="button" className="rt-b is-q" onClick={() => routineSet(id, { stage: "off" })}>Turn off</button></div>
    </motion.div>);
  const seg = <div className="rt-seg" role="radiogroup">{r.whens.map((w) => <button key={w} type="button" role="radio" aria-checked={when === w} className={when === w ? "is-on" : ""} onClick={() => setWhen(w)}>
    {when === w && <motion.span layoutId={`rt-seg-${id}-when`} className="rt-seg-p" transition={{ type: "spring", visualDuration: 0.35, bounce: 0.15 }} />}<span>{cap(w)}</span></button>)}</div>;
  return (
    <motion.div className="rt" layout transition={{ duration: 0.45, ease: SX }}>
      <div className="rt-s">
        <Eye>{editing ? "Editing the routine" : `A routine for you${r.ver > 1 ? " · updated" : ""}`}</Eye>
        <h4 className="rt-t">{r.t}</h4>
        {editing ? <div className="rt-form"><div className="rt-f"><span className="rt-fl">When</span>{seg}</div></div>
          : <p className="rt-d">{r.noticed} Orin {r.does} {r.when}, before the 9:00 sync. {r.sees}.</p>}
      </div>
      <div className="rt-acts">{editing ? <>
          <button type="button" className="rt-b is-pri" onClick={() => { routineSet(id, (o) => ({ when, ver: o.ver + 1, changed: ["when"] })); setEditing(false); }}>Save</button>
          <button type="button" className="rt-b is-q" onClick={() => { setWhen(r.when); setEditing(false); }}>Cancel</button></> : <>
          <button type="button" className="rt-b is-pri" onClick={approve}>Approve</button>
          <button type="button" className="rt-b" onClick={() => setEditing(true)}>Change it</button>
          <button type="button" className="rt-b" onClick={() => showFile(r.preview.k, null, { full: true })}>See this week’s draft</button>
          <button type="button" className="rt-b is-q" onClick={decline}>Not this</button></>}
      </div>
    </motion.div>);
}

// "Change it", in plain words: North rewrites the card and marks what moved
const DAYS = /\b(monday|tuesday|wednesday|thursday|friday)s?\b/i, TEAMS = ["marketing", "sales", "onboarding", "product", "revops"];
function revise(r, said) {
  const s = said.trim(), lo = s.toLowerCase(), ch = [];
  const n = { ...r, notes: [...r.notes] };
  if (/\b(don'?t|do not|no)\b.*\b(comment|tell|message|send)|\b(only|just) (me|to me|show me)\b|\bask me first\b/.test(lo)) {
    n.who = "Only you. North drafts the comments; you send them"; n.cmt = "drafts comments for you to send to the author"; ch.push("who", "does"); }
  const tm = TEAMS.find((t) => new RegExp(`\\b${t}\\b`).test(lo));
  if (tm && /\bonly|just\b/.test(lo)) { n.when = `Whenever a ${cap(tm)} deck is shared with you`; ch.push("when"); }
  const dm = lo.match(DAYS); if (dm && !tm) { n.when = `${cap(dm[1])} mornings, for the decks shared that week`; ch.push("when"); }
  const add = s.match(/^(?:also |and )?(?:add|check(?: for)?|look for|flag)\s*(?:a note|that)?[:,]?\s*(.+)$/i);
  const rm = s.match(/^(?:remove|drop|skip|forget|cut)\s+(?:the\s+)?(?:note\s+)?(?:about\s+)?(.+?)(?:\s+note)?$/i);
  if (rm) { const w = rm[1].toLowerCase().split(/\s+/).filter((x) => x.length > 3); const i = n.notes.findIndex((x) => w.some((y) => x.t.toLowerCase().includes(y))); if (i >= 0) { n.notes.splice(i, 1); ch.push("notes"); } }
  else if (add) { n.notes.push({ t: cap(add[1].replace(/[.!]$/, "")), from: "Added just now", fresh: true }); ch.push("notes"); }
  if (!ch.length) { n.notes.push({ t: cap(s.replace(/[.!]$/, "")), from: "Added just now", fresh: true }); ch.push("notes"); }
  return { ...n, ver: r.ver + 1, changed: ch };
}

const SX = [0.32, 0.72, 0, 1];

// the routine mark, from Sam's card in Figma: four points on hairline axes; the filled one is where the run is
export const RoutineMark = () => <span className="rt-mk" aria-label="Routine"><Glyph /></span>;
const Glyph = () => (
  <svg className="rt-g" width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
    <g stroke="var(--navy)" strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3.825 14.175 9 9 14.175 3.825 9Z" />
      <path d="M15.525 7.65 16.875 9 15.525 10.35 14.175 9Z" /><path d="M9 14.175 10.35 15.525 9 16.875 7.65 15.525Z" /><path d="M2.475 7.65 3.825 9 2.475 10.35 1.125 9Z" />
    </g>
    <path d="M9 1.069 10.406 2.475 9 3.881 7.594 2.475Z" fill="var(--navy)" />
  </svg>);
const Eye = ({ children }) => <small className="rt-e"><Glyph />{children}</small>;


export function RoutineCard({ id, post }) {
  const r = useRoutine(id), [editing, setEditing] = useState(false), [val, setVal] = useState(""), [dr, setDr] = useState(null), [open, setOpen] = useState(false), inp = useRef(null);
  
  useEffect(() => { if (!editing) return; const k = (e) => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); setEditing(false); } }; addEventListener("keydown", k, true); return () => removeEventListener("keydown", k, true); }, [editing]);
  if (!r) return null;
  if (r.kind === "doc") return <DocRoutine id={id} r={r} />;
  const pv = r.preview, n = pv.items.length;
  const change = (e) => { e.preventDefault(); const t = val.trim(); if (!t) return; post && post({ role: "user", text: t }); routineSet(id, (x) => revise(x, t)); setVal(""); setEditing(false); };
  // one click: Approve turns it on and runs it on the deck in front of you right away. The look-it-over happened on this card
  // (the example, "Change it"); after that it just works, and Turn off is always one click away.
  const approve = () => {
    setOpen(false); pv.items.forEach((x) => addPin(pv.k, x.i, x.t, "sam")); // from you: North wrote them, you're who they come from
    const mine = r.who.startsWith("Only you");
    if (!mine) dispatchEvent(new CustomEvent("north:talk-post", { detail: { id: "t-web", m: { role: "user", text: `First pass on the deck: ${pv.items.map((x) => `slide ${x.i + 1}, ${x.t.charAt(0).toLowerCase() + x.t.slice(1)}`).join(" And ")} The comments are on the slides.` } } }));
    routineSet(id, { stage: "on", run: mine ? "sent-you" : "sent", changed: [] });
    if (talk.piece(`rt-${id}`)) talk.updPiece(`rt-${id}`, { zone: "landed", act: null, stTxt: "On", line: "Running: it checks each deck shared with you and drafts the comments from you." });
  };
  const decline = () => { routineSet(id, { stage: "no" }); if (talk.piece(`rt-${id}`)) talk.updPiece(`rt-${id}`, { zone: "landed", act: null, stTxt: "Declined", line: "You said not this. North won’t offer it again." }); };

  const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const list = (a) => (a.length < 3 ? a.join(" and ") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);
  const fresh = r.notes.filter((x) => x.fresh);
  const scope = r.when.replace(/^Whenever an? /, "").replace(/ is shared with you$/, "");
  const prev = (
    <AnimatePresence initial={false}>{open && (
      <motion.div key="p" className="rt-prev" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: SX }}>
        {pv.items.map((x) => (
          <button type="button" key={x.i} className="rt-row" onClick={() => showFile(pv.k, null, { full: true })}>
            <span className="rt-th"><SlideThumb k={pv.k} i={x.i} /></span>
            <span className="rt-c"><small>Slide {x.i + 1}</small><span>{x.t}</span></span></button>))}
        <p className="rt-note">Two of the three past reviews behind these notes are sample history.</p>
      </motion.div>)}</AnimatePresence>);

  if (r.stage === "no") return <div className="rt is-quiet"><div className="rt-s"><p className="rt-d">Okay. North won’t suggest this one again.</p></div></div>;

  if (r.stage === "off") return <div className="rt is-quiet"><div className="rt-s"><p className="rt-d">Turned off. North won’t review decks for you; the comments already on Paul’s deck stay.</p></div></div>;

  // on: what it just did, once, and the way out
  if (r.stage === "on") return (
    <motion.div className="rt" layout transition={{ duration: 0.45, ease: SX }}>
      <div className="rt-s">
      <Eye>Routine · on</Eye>
      <h4 className="rt-t">{r.t}</h4>
      <p className="rt-d">{r.run === "sent-you" ? `Done. ${n} comments are on Paul’s webinar deck for you to send. From now on it runs whenever a ${scope} is shared with you.`
        : `Done. ${n} comments are on Paul’s webinar deck, and Paul has them here. From now on it runs whenever a ${scope} is shared with you.`}</p>
      </div>
      <div className="rt-acts"><button type="button" className="rt-b" onClick={() => showFile(pv.k, null, { full: true })}>See the comments</button>
        <button type="button" className="rt-b is-q" onClick={() => routineSet(id, { stage: "off" })}>Turn off</button></div>
    </motion.div>);

  // Change it: the card itself becomes editable, in place (the way an app card is set up in a chat): which decks, where the
  // comments go, what it checks for. Save or Cancel; Esc cancels. Nothing swaps out, so nothing flashes
  const TEAMS_E = ["Every deck", "Marketing", "Sales", "Onboarding"];
  const scopeOf = (x) => { const m = x.when.match(/^Whenever an? (\w+) deck/); return m && TEAMS_E.includes(m[1]) ? m[1] : "Every deck"; };
  const startEdit = () => { setDr({ scope: scopeOf(r), mine: r.who.startsWith("Only you"), notes: r.notes.map((x) => ({ ...x })), add: "" }); setEditing(true); };
  const save = () => { const x = dr; routineSet(id, (o) => ({ when: x.scope === "Every deck" ? "Whenever a deck is shared with you" : `Whenever a ${x.scope} deck is shared with you`,
      who: x.mine ? "Only you. North drafts the comments; you send them" : "The comments come from you",
      cmt: x.mine ? "drafts comments for you to send to the author" : "leaves the author comments on what’s off",
      notes: x.notes, ver: o.ver + 1, changed: ["edited"] })); setEditing(false); };
  const seg2 = (k, value, opts, on) => <div className="rt-seg" role="radiogroup">{opts.map(([v, l]) => <button key={l} type="button" role="radio" aria-checked={value === v} className={value === v ? "is-on" : ""} onClick={() => on(v)}>
    {value === v && <motion.span layoutId={`rt-seg-${id}-${k}`} className="rt-seg-p" transition={{ type: "spring", visualDuration: 0.35, bounce: 0.15 }} />}<span>{l}</span></button>)}</div>;
  const edit = editing && dr && (
    <div className="rt-form" onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); setEditing(false); } }}>
      <div className="rt-f"><span className="rt-fl">Decks</span>{seg2("scope", dr.scope, TEAMS_E.map((t) => [t, t]), (v) => setDr({ ...dr, scope: v }))}</div>
      <div className="rt-f"><span className="rt-fl">Comments</span>{seg2("who", dr.mine, [[false, "Go to the author, from you"], [true, "Come to me first"]], (v) => setDr({ ...dr, mine: v }))}</div>
      <div className="rt-f is-top"><span className="rt-fl">Checks for</span>
        <ul className="rt-notes">{dr.notes.map((x, i) => <li key={x.t + i}><span>{x.t}</span><button type="button" className="ibtn fx-i" aria-label={`Remove ${x.t}`} onClick={() => setDr({ ...dr, notes: dr.notes.filter((_, j) => j !== i) })}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M3 3l6 6M9 3 3 9" /></svg></button></li>)}
          <li className="rt-add"><input ref={inp} value={dr.add} placeholder="Add something to check for" aria-label="Add something to check for" onChange={(e) => setDr({ ...dr, add: e.target.value })}
            onKeyDown={(e) => { if (e.key === "Enter" && dr.add.trim()) { e.preventDefault(); setDr({ ...dr, notes: [...dr.notes, { t: cap(dr.add.trim().replace(/[.!]$/, "")), from: "Added just now", fresh: true }], add: "" }); } }} /></li></ul></div>
    </div>);
  return (
    <motion.div className="rt" layout transition={{ duration: 0.45, ease: SX }}>
      <div className="rt-s">
      <Eye>{editing ? "Editing the routine" : `A routine for you${r.ver > 1 ? " · updated" : ""}`}</Eye>
      <h4 className="rt-t">{r.t}</h4>
      {editing ? edit : <p className="rt-d">North checks each {scope} shared with you against the notes you keep giving{fresh.length ? ` (now including ${list(fresh.map((x) => `“${lc(x.t)}”`))})` : ""}, {r.cmt.replace(/^leaves the author comments on what’s off/, "leaves comments for the author").replace(/^drafts comments for you to send to the author/, "drafts comments for you to send")}, and brings it to you once it’s fixed.</p>}
      {!editing && prev}
      </div>
      <div className="rt-acts">{editing ? <>
          <button type="button" className="rt-b is-pri" onClick={save}>Save</button>
          <button type="button" className="rt-b is-q" onClick={() => setEditing(false)}>Cancel</button></> : <>
          <button type="button" className="rt-b is-pri" onClick={approve}>Approve</button>
          <button type="button" className="rt-b" onClick={startEdit}>Change it</button>
          <button type="button" className="rt-b" onClick={() => setOpen((v) => !v)}>{open ? "Hide the example" : "See it on Paul’s deck"}</button>
          <button type="button" className="rt-b is-q" onClick={decline}>Not this</button></>}
      </div>
    </motion.div>
  );
}

// ---- A routine, opened. Two halves: this run (what it's doing or found, with your move if there is one), and the routine
// itself beside it (what it does, when it starts, who's on it, what you see), which you change right there, in place.
const nameOf = (k) => (AGENTS[k] ? AGENTS[k].n : PEOPLE[k] ? PEOPLE[k].n : k === "sam" ? "You" : k);
const PM_AG = ["riley", "calvin", "orin", "riley"];
const RISKS = [
  { k: "legal", t: "Legal’s pace", why: "Their legal team took 9 days the last time they bought software. This contract has 5.", own: "dustin", move: "Security review back by Thursday" },
  { k: "quiet", t: "Priya going quiet", why: "She hasn’t opened the last two emails. She’s the one who signs.", own: "sam", act: "Draft a nudge", done: "Drafted from you. It’s in Coastline’s conversation, ready to send." },
];
const KIT = [
  { ag: "orin", t: "Open with pricing", why: "They opened the pricing page twice this week, the last time on Sunday." },
  { ag: "calvin", t: "Bring Brightwater’s story", why: "Same size (41 agents to their 44), onboarding now. Jordan can speak to it." },
  { ag: "riley", t: "Ask who signs", why: "Their last software buy went through the COO, not the team lead booking the demo." },
];
const PROMS = [
  { to: "priya", n: "Priya", t: "Send the security packet", due: "Friday", st: "Waiting on Dustin’s review. Still on time." },
  { to: "heather", n: "Heather", t: "Answer on Brightwater for the Q4 slide", due: "Tomorrow", st: "On time." },
];
const OPENS = [["9 AM", 58, 3], ["10", 47, 2], ["11", 36, 2], ["12 PM", 31, 1], ["1", 22, 1], ["2", 18, 0]];
const Lbl = ({ children }) => <h5 className="rx-l">{children}</h5>;

export function RoutineRun({ p }) {
  const [done, setDone] = useState({}), [hv, setHv] = useState(null), id = p.rt, landed = p.zone === "landed";
  const tick = <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6.3 4.8 8.5 9.5 3.6" /></svg>;
  if (id === "premortem") { const at = landed ? PM.length : Math.max(0, PM.indexOf(p.line));
    return <div className="rx-run">
      <p className="rx-lead">Coastline Brokers is due to sign in <b>5 days</b>. {landed ? "Here’s how it could slip, and who has each risk." : "Riley’s crew is working out how it could slip, before it does."}</p>
      {landed && <div className="rx-sec"><Lbl>Two risks, each with an owner</Lbl>
        <ul className="rx-risks">{RISKS.map((r) => <li key={r.k}>
          <div className="rx-risk-t"><b>{r.t}</b><span>{r.why}</span>
            <small>{r.own === "sam" ? (done[r.k] ? r.done : "Your move") : `${nameOf(r.own)}’s move · ${r.move}`}</small></div>
          {r.act && !done[r.k] && <button type="button" className="fd-act" onClick={() => setDone((d) => ({ ...d, [r.k]: true }))}>{r.act}</button>}
        </li>)}</ul></div>}
      {landed ? <p className="rx-p rx-q">Held against 3 past deals that slipped at legal review.</p> : <div className="rx-sec"><Lbl>Working on it</Lbl>
        <ol className="rx-steps">{PM.map((t, i) => { const s = i < at ? "done" : i === at ? "now" : "next"; const ag = PM_AG[i];
          return <li key={i} className={`is-${s}`}><AgentMark id={ag} size={20} /><span>{cap(t.replace(/^\w+: /, ""))}</span><em>{s === "done" ? tick : s === "now" ? "Now" : ""}</em></li>; })}</ol></div>}
    </div>; }
  if (id === "launch") { const wk = /On track/.test(p.line || ""), mx = 60;
    return <div className="rx-run">
      <p className="rx-lead">The Q4 brokerage sequence went live at 9:00. <b>9 replies</b> in its first 6 hours, 6 of them from teams over 50 agents.</p>
      <div className="rx-sec"><Lbl>Opens and replies, by hour (sample)</Lbl>
        <div className="rx-bars" onPointerLeave={() => setHv(null)}>{OPENS.map(([h, o, r], i) => <button type="button" key={h} className={`rx-bar${hv != null && hv !== i ? " is-dim" : ""}`} onPointerEnter={() => setHv(i)} onFocus={() => setHv(i)} aria-label={`${h}: ${o} opens, ${r} replies`}>
          <span className="rx-bar-c"><i style={{ height: `${(o / mx) * 100}%` }} />{r > 0 && <b style={{ height: `${(r / 3) * 34}%` }} />}</span><small>{h}</small></button>)}</div>
        <p className="rx-cap">{hv != null ? <><b>{OPENS[hv][0]}{/^\d+$/.test(OPENS[hv][0]) ? (+OPENS[hv][0] < 9 || +OPENS[hv][0] === 12 ? " PM" : " AM") : ""}</b> {OPENS[hv][1]} opens, {OPENS[hv][2]} {OPENS[hv][2] === 1 ? "reply" : "replies"}</> : <>212 opens · 9 replies · 3 asked for a demo</>}</p></div>
      <div className="rx-sec"><Lbl>Where the week is heading</Lbl>
        <p className="rx-p">{wk ? <><b>41 demos by Friday</b>, 12 above September’s launch (sample). Nothing for you to do; Marco says if it turns.</> : "Too early to call. Marco calls the week once it’s run six hours."}</p></div>
    </div>; }
  if (id === "newclient") return <div className="rx-run">
      <p className="rx-lead">Crescent Realty Group booked a demo for <b>Thursday</b>. Three things to do before it, and your deck, tailored to them.</p>
      <div className="rx-sec"><Lbl>Before Thursday · your move</Lbl>
        <ul className="rx-kit">{KIT.map((x, i) => <li key={i} className={done[i] ? "is-done" : ""}>
          <button type="button" className="rx-chk" aria-pressed={!!done[i]} aria-label={`Done: ${x.t}`} onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))}>{done[i] && tick}</button>
          <div><b>{x.t}</b><span>{x.why}</span></div></li>)}</ul></div>
      <div className="rx-sec"><Lbl>Your deck, tailored to them</Lbl>
        {/* the file card's own build (paper on the textured tray), with what's in it on its face: the four slides, changed for them */}
        <button type="button" className="rx-deck" onClick={(e) => showFile("crescent", e.currentTarget)}>
          <span className="rx-deck-s"><span className="rx-deck-t"><b>Demo · Crescent Realty Group</b><small>Deck · 4 slides</small></span>
            <span className="rx-deck-th">{[0, 1, 2, 3].map((i) => <span key={i}><SlideThumb k="crescent" i={i} /></span>)}</span></span>
          <span className="rx-deck-f">A private draft, from you · only you can see it</span></button></div>
    </div>;
  if (id === "promises") return <div className="rx-run">
      <p className="rx-lead">North is holding <b>2 promises</b> you made this week. Neither is at risk, so you haven’t heard about them.</p>
      <div className="rx-sec"><Lbl>What you said you’d do (sample)</Lbl>
        <ul className="rx-kit is-ro">{PROMS.map((x) => <li key={x.t}><span className="rx-due">{x.due}</span><div><b>{x.t}</b><span>To {x.n}. {x.st}</span></div></li>)}</ul></div>
    </div>;
  return null;
}

// the routine itself: what it does, in a sentence, and its settings, read as plain facts. "Change it" turns the same lines into
// controls, right where they are (Save, Cancel, Esc). Turning it off is one click and says what stops.
export function RoutineSet({ id, full, cur, onRun }) {
  const r = useRoutine(id), [ed, setEd] = useState(null), [saved, setSaved] = useState(false);
  useEffect(() => { if (!ed) return; const k = (e) => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); setEd(null); } }; addEventListener("keydown", k, true); return () => removeEventListener("keydown", k, true); }, [ed]);
  useEffect(() => { if (!saved) return; const t = setTimeout(() => setSaved(false), 2400); return () => clearTimeout(t); }, [saved]);
  if (!r || !r.about) return null;
  const on = r.stage === "on";
  const pick = (k, v, opts) => <div className="rt-seg rx-seg" role="radiogroup">{opts.map((o) => <button key={o} type="button" role="radio" aria-checked={v === o} className={v === o ? "is-on" : ""} onClick={() => setEd((d) => ({ ...d, [k]: o }))}>
    {v === o && <motion.span layoutId={`rx-${id}-${k}`} className="rt-seg-p" transition={{ type: "spring", visualDuration: 0.35, bounce: 0.15 }} />}<span>{o}</span></button>)}</div>;
  const save = () => { routineSet(id, { when: ed.when, sees: ed.sees, checks: ed.checks }); setEd(null); setSaved(true); };
  return (
    <aside className={`rx-set${full ? " is-full" : ""}${on ? "" : " is-off"}`} aria-label="The routine"><div className="rx-set-a">
      <div className="rx-set-h">{full ? <span className="rx-saved">{saved ? "Saved" : ""}</span> : <Eye>{saved ? "Routine · saved" : on ? "Routine · on" : "Routine · off"}</Eye>}
        <div className="rt-seg rx-onoff" role="radiogroup" aria-label="On or off">{[["on", "On"], ["off", "Off"]].map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={r.stage === v} className={r.stage === v ? "is-on" : ""} onClick={() => routineSet(id, { stage: v })}>
          {r.stage === v && <motion.span layoutId={`rx-${id}-on`} className="rt-seg-p" transition={{ type: "spring", visualDuration: 0.35, bounce: 0.15 }} />}<span>{l}</span></button>)}</div></div>
      <p className="rx-about">{on ? r.about : `Off. ${r.t} won’t start again until you turn it on; what it already made stays where it is.`}</p>
      <dl className="rx-dl">
        <div><dt>Starts</dt><dd>{ed ? pick("when", ed.when, r.whens) : r.when}</dd></div>
        <div><dt>You see</dt><dd>{ed ? pick("sees", ed.sees, r.seeOpts) : r.sees}</dd></div>
        <div><dt>Looks at</dt><dd>{ed ? <ul className="rt-notes rx-notes">{ed.checks.map(([c], i) => <li key={c + i}><span>{c}</span><button type="button" className="ibtn fx-i" aria-label={`Remove ${c}`} onClick={() => setEd((d) => ({ ...d, checks: d.checks.filter((_, j) => j !== i) }))}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M3 3l6 6M9 3 3 9" /></svg></button></li>)}
            <li className="rt-add"><input value={ed.add} placeholder="Add something to look at" aria-label="Add something to look at" onChange={(e) => setEd((d) => ({ ...d, add: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter" && ed.add.trim()) { e.preventDefault(); setEd((d) => ({ ...d, checks: [...d.checks, [cap(d.add.trim()), r.agent]], add: "" })); } }} /></li></ul>
          : <ul className="rx-crew">{r.checks.map(([c, a]) => <li key={c}><AgentMark id={a} size={18} /><span>{c}</span></li>)}</ul>}</dd></div>
      </dl>
      <div className="rt-acts rx-acts">{ed ? <><button type="button" className="rt-b is-pri" onClick={save}>Save</button><button type="button" className="rt-b is-q" onClick={() => setEd(null)}>Cancel</button></>
        : <button type="button" className="fd-act" onClick={() => setEd({ when: r.when, sees: r.sees, checks: [...r.checks], add: "" })}>Change it</button>}</div>
      </div>
      <div className="rx-runs"><h5 className="rx-l">Runs</h5>
        <ul>{(r.runs || []).map(([t, d, s], i) => { const live = i === 0 && cur && onRun;
          const body = <><b>{t}</b><span>{cur && i === 0 ? (cur.zone === "landed" ? cur.stTxt || "Done" : cur.stTxt || s) : s}</span><small>{d}</small></>;
          return <li key={t + d}>{live ? <button type="button" className="rx-run-b" onClick={onRun}>{body}<em>Open</em></button> : <div className="rx-run-b is-past">{body}</div>}</li>; })}</ul></div>
    </aside>
  );
}

// ---- a routine, opened where it lives: on the Agents page, grown out of its row to fill the page's card (23px in from the
// frame), and closed back into it. Its run opens in the same place. You never leave Agents
const SX2 = { type: "tween", duration: 0.55, ease: [0.32, 0.72, 0, 1] }, SXC = { type: "tween", duration: 0.5, ease: [0.45, 0, 0.15, 1] };
function RoutineSheet({ id, from, onClose }) {
  const r = useRoutine(id), [view, setView] = useState("routine"), ref = useRef(null);
  const [to] = useState(() => { const m = document.querySelector(".main"), b = m ? m.getBoundingClientRect() : { left: 0, top: 0, width: innerWidth, height: innerHeight };
    return { left: b.left + 23, top: b.top + 23, width: b.width - 46, height: b.height - 46 }; });
  useEffect(() => { const k = (e) => { if (e.key !== "Escape" || document.querySelector(".rt-form, .vx, .fm")) return; e.preventDefault(); if (view === "run") setView("routine"); else onClose(); };
    const out = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest(".side, .chat-shell, .fm, .fm-veil")) onClose(); };
    addEventListener("keydown", k); document.addEventListener("pointerdown", out); return () => { removeEventListener("keydown", k); document.removeEventListener("pointerdown", out); }; });
  if (!r) return null;
  const p = r.piece && talk.piece(r.piece), I = (d) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--navy)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
  const who = view === "run" && p && p.bots && p.bots.length ? p.bots : r.crew;
  const names = who.map(nameOf), nm = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  return (<>
    {/* the page steps back behind it, the way a file does when it opens over a page */}
    <motion.div className="rt-veil" style={{ left: to.left - 23, top: to.top - 23, width: to.width + 46, height: to.height + 46 }} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.3 } }} exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.15 } }} />
    <motion.div ref={ref} className="fd-open fd-grow rt-sheet" role="dialog" aria-label={r.t}
      initial={{ ...from, opacity: 1 }} animate={{ ...to, opacity: 1, transition: SX2 }} exit={{ ...from, opacity: 0, transition: { default: SXC, opacity: { duration: 0.2, delay: 0.32 } } }}>
      <motion.div className="mt-clip" initial={{ borderRadius: 6 }} animate={{ borderRadius: 12 }} exit={{ borderRadius: 6 }} transition={SX2}>
        <div className="mt-body"><motion.div className="gw-in" style={{ height: to.height - 2.18, width: to.width - 2.18 }} initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.25, delay: 0.12 } }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
          <AnimatePresence mode="wait" initial={false}><motion.div key={view} className="gw-item" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.08 } }} transition={{ duration: 0.2 }}>
            <header className="fx-h">
              <span className="fx-face"><span className="rt-faces">{who.map((a) => <AgentMark key={a} id={a} size={28} />)}</span></span>
              <div className="fx-h-l">
                <p className="fx-who">{view === "run" && <button type="button" className="rt-back" onClick={() => setView("routine")}>{"←"} {r.t}</button>}<b>{nm}</b><span>{view === "run" ? "A run" : "Routine"}</span></p>
                <h2>{view === "run" && p ? p.t : r.t}</h2></div>
              <div className="fx-h-r"><button type="button" className="ibtn fx-i" aria-label="Close" title="Close (Esc)" onClick={onClose}>{I("M3 3l8 8M11 3 3 11")}</button></div>
            </header>
            <div className="fx-b">{view === "run" && p ? <div className="fx-main"><RoutineRun p={p} /></div> : <RoutineSet id={id} full cur={p || null} onRun={p ? () => setView("run") : null} />}</div>
          </motion.div></AnimatePresence>
        </motion.div></div>
      </motion.div>
    </motion.div></>
  );
}
