// Meetings, read like the "previously on" before an episode: pick a meeting, and its latest one reads top to bottom as a
// short memo. What it was about, in a few plain sentences; what it decided; what's happened since (people tick their own,
// agents' work ticks itself, and anything late shows who chased it); and what's next time, with the doc or deck for it.
// Past weeks sit behind the date. What the meetings left on you sits at the top of the page, the same rows as Home's.
// Sample data throughout, drawn from the prototype's own people, figures and agent jobs.
import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup, usePresence } from "motion/react";
import { Av, agentJobs, choose, unchoose, moveOf, useGoals, NeedsYou } from "./goals.jsx";
import { AGENTS, RowHover, SelIn } from "./agents.jsx";
import { showFile, momentOf, TranscriptView, FILE_OF } from "./files.jsx";
import { onIntent } from "./voice-intents.js";

const WHO_N = { seth: "You", paul: "Paul", heather: "Heather", jordan: "Jordan", caleb: "Caleb", sam: "Sam", lisa: "Lisa" };
const nm = (k) => (AGENTS[k] ? AGENTS[k].n : WHO_N[k] || k);
const isAgent = (k) => !!AGENTS[k];
// each meeting: when it meets, when it's next, the agenda drafted for next time, and its weeks, latest first.
// a task's q is the line in the transcript it came from: what was said, who said it, how far into the meeting
const MEETINGS = [
  { k: "sync", t: "Monday sync", type: "Leadership", dow: 1, at: 540, dur: 45, days: "Mondays", next: "Mon, Nov 16", doc: { job: "j9", file: "syncdoc", who: "orin" },
    agenda: [["The path to $40.03M", "riley", "All three levers land at $40.08M, with no margin"], ["Q4 hiring", "heather", "Six hires asked for"], ["Onboarding plan", "jordan", "Jordan’s 5 days or Caleb’s 10"]],
    weeks: [
      { id: "sync-9", d: "Monday, Nov 9", rel: "Yesterday", mins: 45, who: ["seth", "paul", "heather", "jordan", "caleb"], latest: true,
        tx: "tx-sync-9", src: [7, 13, 24], // its transcript, and the minute each decision was made
        recap: "We held the $40.03M plan, but there’s no margin: Riley’s three levers land just $50K over. Most of the hour went on Outbound, at 23% of pace since Sam moved to inbound. Caleb wants him back; inbound still needs him. Heather’s hiring plan is the one thing waiting on you.",
        decided: ["Hold the $40.03M plan through December", "Heather’s hiring plan goes to Paul by Friday", "Onboarding settles on one plan before Caleb’s next cohort"],
        confirm: [
          { k: "s9-rank", t: "Rank Sam’s old demo list, strongest first", who: "orin", due: "Fri", q: ["Somebody should rank Sam’s old list so it’s ready when he’s back.", "Caleb", 31] },
          { k: "s9-qbr", t: "Send QBR invites to the four quiet renewals", who: "calvin", due: "Thu", q: ["Those four haven’t heard from us since September.", "Jordan", 38] }],
        tasks: [
          { k: "s9-sign", t: "Sign off Heather’s Q4 hiring plan", who: "seth", due: "Fri", q: ["I’ll sign it off this week.", "You", 12] },
          { k: "s9-paul", t: "Send Paul the hiring number", who: "heather", due: "Fri", q: ["Paul needs the number by Friday to close the plan.", "Heather", 13] },
          { k: "s9-onb", t: "Agree one onboarding plan with Caleb", who: "jordan", due: "Thu", q: ["Jordan and I will land on one plan before the next cohort.", "Caleb", 24] },
          { k: "s9-fcst", t: "Forecast the year with all three levers", who: "riley", due: "Mon", q: ["Riley, run the year with all three levers before next Monday.", "You", 6] },
          { k: "s9-doc", t: "Write next week’s sync doc", who: "orin", due: "Mon", q: ["Lead next week’s doc with the gap, and say if there’s no margin.", "You", 41] },
          { k: "s9-risk", t: "Pull the at-risk list for Customer Value", who: "riley", due: "Tue", done: true, q: ["Riley, can we get the at-risk list in the channel today?", "Paul", 18] }] },
      { id: "sync-2", d: "Monday, Nov 2", rel: "Nov 2", mins: 25, who: ["seth", "paul", "heather", "jordan", "caleb"],
        recap: "A short one. Outbound had started to slip after Sam’s move, so Riley will send a read on it every Monday. Heather’s Q4 hiring plan comes to you by Friday.",
        decided: ["Riley sends a read on Outbound every Monday"],
        tasks: [
          { k: "s2-out", t: "Send the first Outbound read", who: "riley", due: "Nov 9", done: true, q: ["Riley, a read on Outbound every Monday.", "You", 8] },
          { k: "s2-hire", t: "Draft the Q4 hiring plan", who: "heather", due: "Nov 6", done: true, q: ["I’ll have the plan to you by Friday.", "Heather", 19] }] }] },
  { k: "hire", t: "Hiring sync", type: "Leadership", dow: 2, at: 840, dur: 30, every: 2, days: "Every other Tuesday", next: "Tue, Nov 17", maker: "orin",
    agenda: [["The hiring number", "heather", "Four now, two in January, if you sign off"], ["The AE interview loop", "heather", "Who sits on it"]],
    weeks: [
      { id: "hire-3", d: "Tuesday, Nov 3", mins: 30, who: ["seth", "heather", "paul"], latest: true,
        recap: "Heather asked for six Q4 hires: three AEs, a CSM and two engineers for the HubSpot sync. Paul can fund four now. The open question is whether Outbound recovers enough to need the third AE.",
        decided: ["Offers made in November start in January", "The third AE waits on Outbound’s recovery"],
        tasks: [
          { k: "h3-plan", t: "Draft the Q4 hiring plan", who: "heather", due: "Nov 6", done: true, q: ["I’ll have the plan to you by Friday.", "Heather", 9] },
          { k: "h3-budget", t: "Check the budget for four hires", who: "paul", due: "Nov 6", done: true, q: ["I can fund four now; let me check the rest.", "Paul", 14] },
          { k: "h3-vol", t: "Read Outbound’s demo volume for the AE case", who: "riley", due: "Nov 9", done: true, q: ["Riley, does demo volume support a third AE?", "You", 21] }] }] },
  { k: "board", t: "Board prep", type: "Leadership", dow: 4, at: 900, dur: 60, nth: 3, days: "Third Thursday", next: "Thu, Nov 19", maker: "orin",
    agenda: [["Q4 forecast", "paul", "The $40.03M plan, with Riley’s three levers"], ["Hiring", "heather", "Four now, two in January"]],
    weeks: [
      { id: "board-15", d: "Thursday, Oct 15", mins: 60, who: ["seth", "paul", "heather"], latest: true,
        recap: "The deck for the Q4 board meeting. Paul wants the plan held at $40.03M with the levers shown, not a new number. Heather’s hiring ask goes in as one slide.",
        decided: ["Hold the plan at $40.03M in the board deck"],
        tasks: [
          { k: "b15-deck", t: "Draft the board deck", who: "orin", due: "Nov 18", q: ["Orin, a first draft the day before prep.", "You", 41] }] }] },
  { k: "pipe", t: "Pipeline review", type: "Revenue", dow: 4, at: 600, dur: 30, days: "Thursdays", next: "Thu, Nov 12", maker: "marco",
    agenda: [["Outbound", "caleb", "23% of pace since Sam moved to inbound"], ["Booked demos that don’t happen", "marco", "From the last 20"]],
    weeks: [
      { id: "pipe-5", d: "Thursday, Nov 5", rel: "Last Thursday", mins: 30, who: ["caleb", "sam", "lisa"], latest: true,
        recap: "Webinar sign-ups are booking but not showing up. Lisa’s reminders go out an hour before each session from now on. Outbound lost 14 of the last 20 demos, and 11 got no follow-up; Sam’s on those.",
        decided: ["Webinar sign-ups get a reminder an hour before", "Outbound’s lost demos get a follow-up within two days"],
        tasks: [
          { k: "p5-fu", t: "Send the 11 lost-demo follow-ups", who: "sam", due: "Nov 7", late: true, chased: "Orin nudged Sam this morning", q: ["I’ll send the 11 follow-ups by Friday.", "Sam", 15] },
          { k: "p5-vis", t: "Make reminder visuals for webinar sign-ups", who: "marco", due: "Wed", q: ["Marco can make the reminder visuals.", "Lisa", 9] },
          { k: "p5-why", t: "Find why booked demos don’t happen", who: "marco", due: "Thu", q: ["Why are booked demos not showing? Get me the real reason.", "Caleb", 22] },
          { k: "p5-rec", t: "Share the Q4 campaign recap", who: "lisa", due: "Nov 6", done: true, q: ["I’ll share the recap tomorrow.", "Lisa", 34] }] }] },
  { k: "fcst", t: "Forecast call", type: "Revenue", dow: 5, at: 660, dur: 30, days: "Fridays", next: "Fri, Nov 13", maker: "riley",
    agenda: [["Where the year lands", "riley", "$38.94M at October’s rate"], ["Expansion", "jordan", "$1.31M booked against a $1.03M pace"]],
    weeks: [
      { id: "fcst-6", d: "Friday, Nov 6", mins: 30, who: ["paul", "caleb", "seth"], latest: true,
        recap: "October closed at $35.75M ending ARR, 89% of the $40.03M plan. At October’s rate the year lands $1.09M short; Riley’s three levers would close it with $50K to spare.",
        decided: ["Plan the year on the three levers, not October’s rate"],
        tasks: [
          { k: "f6-size", t: "Size each lever by month", who: "riley", due: "Nov 9", done: true, q: ["Riley, size each lever by month.", "Paul", 11] },
          { k: "f6-board", t: "Send the board October’s number", who: "paul", due: "Nov 9", done: true, q: ["I’ll send the board the October number Monday.", "Paul", 26] }] }] },
  { k: "outb", t: "Outbound check-in", type: "Revenue", dow: 3, at: 660, dur: 30, days: "Wednesdays", next: "Tomorrow", maker: "riley",
    agenda: [["Booked demos", "caleb", "Outbound at 23% of pace"], ["Sam’s old demos", "orin", "Ranked for Caleb’s team"]],
    weeks: [
      { id: "outb-4", d: "Wednesday, Nov 4", mins: 30, who: ["caleb", "sam"], latest: true,
        recap: "Outbound kept slipping after Sam moved to inbound. Caleb wants a ranked list of Sam’s old demos so the rest of the team can pick them up.",
        decided: ["Caleb’s team works Sam’s old demos first"],
        tasks: [
          { k: "o4-read", t: "Send a read on booked demos", who: "riley", due: "Nov 9", done: true, q: ["Riley, where are booked demos by Monday?", "Caleb", 9] }] }] },
  { k: "mkt", t: "Marketing weekly", type: "Revenue", dow: 2, at: 600, dur: 30, days: "Tuesdays", next: "Tue, Nov 17", maker: "marco",
    agenda: [["Portal launch", "lisa", "Inbound at 128% of pace"], ["Webinar no-shows", "marco", "A third of sign-ups don’t show"]],
    weeks: [
      { id: "mkt-10", d: "Tuesday, Nov 10", mins: 30, who: ["lisa", "caleb"], latest: true,
        recap: "The Portal launch has inbound at 128% of pace. Webinar sign-ups are strong, but a third don’t show. Lisa wants the reminder visuals out before Thursday’s webinar.",
        decided: ["Reminder visuals go out before Thursday’s webinar"],
        confirm: [{ k: "m10-ns", t: "Pull last month’s webinar no-show list", who: "marco", due: "Thu", q: ["Can we see who signed up and didn’t show last month?", "Lisa", 12] }],
        tasks: [
          { k: "m10-copy", t: "Draft the webinar invite copy", who: "lisa", due: "Wed", q: ["I’ll redo the invite copy tomorrow.", "Lisa", 18] }] },
      { id: "mkt-3", d: "Tuesday, Nov 3", mins: 25, who: ["lisa", "caleb"],
        recap: "The Portal launch went live on Monday. Early inbound looks strong, so paid spend stays flat for two weeks to see what Portal does on its own.",
        decided: ["Paid spend stays flat for two weeks"],
        tasks: [
          { k: "m3-read", t: "Send the first Portal inbound read", who: "marco", due: "Nov 9", done: true, q: ["Marco, a read on Portal inbound next Monday?", "Lisa", 14] }] }] },
  { k: "renew", t: "Renewals", type: "Customers", dow: 3, at: 780, dur: 30, days: "Wednesdays", next: "Tomorrow", maker: "calvin",
    agenda: [["Brightline’s offer", "jordan", "Their renewal is Saturday"], ["Accounts to call first", "riley", "Riley’s ranking of the at-risk book"]],
    weeks: [
      { id: "renew-4", d: "Wednesday, Nov 4", rel: "Last Wednesday", mins: 30, who: ["jordan", "seth"], latest: true,
        recap: "Brightline cut 12 seats ahead of their Nov 14 renewal. Jordan’s called them and brings you an offer before Friday. Four SMB renewals have gone quiet; Calvin drafted QBR invites from Jordan.",
        decided: ["Every renewal due by Dec 31 gets touched this month", "Discounts over 15% come to you"],
        tasks: [
          { k: "r4-offer", t: "Bring Brightline’s offer to you", who: "jordan", due: "Fri", q: ["Bring me the offer before their renewal.", "You", 17] },
          { k: "r4-yes", t: "Decide on Brightline’s offer", who: "seth", due: "Fri", q: ["I’ll make the call on it before Saturday.", "You", 18] },
          { k: "r4-rank", t: "Rank at-risk accounts by who to call first", who: "riley", due: "Wed", q: ["Who do we call first? Riley, rank them.", "Jordan", 20] },
          { k: "r4-call", t: "Call Brightline about the 12 seats", who: "jordan", due: "Nov 6", done: true, q: ["I’ll call Brightline this week.", "Jordan", 5] },
          { k: "r4-qbr", t: "Draft QBR invites for the four quiet renewals", who: "calvin", due: "Nov 5", done: true, q: ["Calvin can draft those from Jordan.", "You", 11] }] }] },
  { k: "onb", t: "Onboarding standup", type: "Customers", dow: 4, at: 540, dur: 15, days: "Thursdays", next: "Thu, Nov 12", maker: "calvin",
    agenda: [["The next cohort’s plan", "jordan", "Waits on Monday’s call"]],
    weeks: [
      { id: "onb-5", d: "Thursday, Nov 5", mins: 15, who: ["jordan", "caleb"], latest: true,
        recap: "Jordan and Caleb still disagree. Jordan’s 5-day plan gets accounts to value about 4 days faster; Caleb wants 10 days for the bigger brokerages. It goes to Monday sync.",
        decided: ["Take the plan question to Monday sync"],
        tasks: [
          { k: "o5-side", t: "Write up both plans side by side", who: "calvin", due: "Nov 6", done: true, q: ["Calvin, put both plans side by side for Monday.", "Jordan", 7] },
          { k: "o5-pick", t: "Pick the next cohort’s accounts", who: "caleb", due: "Thu", q: ["I’ll pick the next cohort by Thursday.", "Caleb", 11] }] }] },
  { k: "1paul", t: "1:1 with Paul", type: "People", dow: 3, at: 960, dur: 30, days: "Wednesdays", next: "Tomorrow",
    agenda: [["Margin to plan", "paul", "$50K over, week by week"]],
    weeks: [
      { id: "1p-4", d: "Wednesday, Nov 4", mins: 30, who: ["seth", "paul"], latest: true,
        recap: "Paul is comfortable holding the plan, but wants the margin watched every week. He’ll bring the hiring number once Heather’s plan is signed.",
        decided: ["Margin to plan is reviewed every week"],
        tasks: [
          { k: "1p4-num", t: "Bring the hiring number", who: "paul", due: "Nov 13", q: ["Once it’s signed, I’ll have the number for you.", "Paul", 12] }] }] },
  { k: "1heather", t: "1:1 with Heather", type: "People", dow: 5, at: 900, dur: 30, every: 2, days: "Every other Friday", next: "Fri, Nov 20",
    agenda: [["Offers", "heather", "Out before Thanksgiving"]],
    weeks: [
      { id: "1h-6", d: "Friday, Nov 6", mins: 30, who: ["seth", "heather"], latest: true,
        recap: "Heather walked through the Q4 hiring plan before sending it: four roles now, two in January. She wants a yes by Friday so offers go out before Thanksgiving.",
        decided: ["The plan comes to you for sign-off"],
        tasks: [
          { k: "1h6-send", t: "Send the hiring plan for sign-off", who: "heather", due: "Nov 9", done: true, q: ["I’ll send it to you Monday.", "Heather", 22] }] }] },
];
const GLIDE = { type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] };
const OPEN = { initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } };
const DOWN = <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 4.5 3 3 3-3" /></svg>;
const TICK = (c = "#fff") => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 5.2 4.1 7.3 8 2.8" /></svg>;

// what's confirmed, dropped and ticked, kept for the page
const st = { done: {}, conf: {}, drop: {}, deck: {}, notes: {}, tx: null, subs: new Set() }; // tx: the transcript being read, so the calendar card's bar can be its way back
const set = (o) => { Object.assign(st, o); st.subs.forEach((f) => f({})); };
const useSt = () => { const [, f] = useState(0); useEffect(() => { const g = () => f((x) => x + 1); st.subs.add(g); return () => st.subs.delete(g); }, []); return st; };
// a step that's also on Home is the same record: the decisions on you, and the steps an agent can take once you say so.
// Deciding it on either page decides it on both
const LINK = { "s9-sign": "hire", "r4-yes": "bline", "s9-rank": "orin-prop", "s9-qbr": "calvin-smb", "m10-ns": "marco-ns" };
const G = { own: {}, gone: {} }; // the goal store, as last read
const isDone = (t) => (LINK[t.k] && t.who === "seth" ? !!G.own[LINK[t.k]] : t.k in st.done ? st.done[t.k] : !!t.done);
const tasksOf = (w) => [...(w.confirm || []).filter((t) => G.own[LINK[t.k]]), ...w.tasks];
const lateOf = (m) => m.weeks[0] && tasksOf(m.weeks[0]).filter((t) => t.late && !isDone(t)).length;

// every task is a box: tick it when it's done (an agent's ticks itself when the agent finishes)
function Mark({ t, done }) {
  const linked = LINK[t.k] && t.who === "seth";
  const tick = (e) => { e.stopPropagation(); if (linked) { if (done) unchoose(LINK[t.k]); else { const mv = moveOf(LINK[t.k]); mv && choose(mv, mv.rec); } return; } set({ done: { ...st.done, [t.k]: !done } }); };
  return <button type="button" className={`mg-cb${done ? " is-on" : ""}`} role="checkbox" aria-checked={done} aria-label={t.t} onClick={tick}>
    <motion.svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <motion.path d="M2 5.2 4.1 7.3 8 2.8" initial={false} animate={{ pathLength: done ? 1 : 0 }} transition={{ duration: done ? 0.28 : 0.12, ease: [0.22, 1, 0.36, 1] }} /></motion.svg></button>;
}
// a row that grows its hover from the cursor
function useHover() { const [hv, setHv] = useState(false), at = useRef({ x: 100, w: 600 });
  return [hv, at, { onPointerEnter: (e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(true); }, onPointerLeave: () => setHv(false) }]; }

// the transcript reads inside the meeting, where you were: "Read from…" and the Transcript link swap the recap for it, and Back
// (or Esc) brings the recap back as you left it, scrolled where you were, the moment still open
const TxCtx = createContext(null);
const scrollerOf = (el) => { for (let e = el && el.parentElement; e; e = e.parentElement) { const o = getComputedStyle(e).overflowY; if (o === "auto" || o === "scroll") return e; } return document.scrollingElement; };
const ARROW_L = <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 8H3M7 4 3 8l4 4" /></svg>;
const ARROW_R = <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" /></svg>;
function Moment({ tx, min, text }) {
  const mo = momentOf(tx, min, text), openTx = useContext(TxCtx);
  if (!mo) return text ? <p className="mg-mo-q">“{text}”</p> : null;
  return (
    <div className="mg-mo">
      {mo.lines.map(([, who, t], j) => <p key={j} className={j === mo.at ? "is-on" : ""}><b>{who}</b>{t}</p>)}
      <button type="button" className="mg-mo-go" onClick={(e) => { e.stopPropagation(); openTx ? openTx(min) : showFile(tx, e.currentTarget, { min }); }}>Read from {min} min{ARROW_R}</button>
    </div>);
}
function Task({ t, i, tx }) {
  const [src, setSrc] = useState(false), [hv, at, hov] = useHover(), done = isDone(t);
  return (
    <motion.li layout="position" layoutId={`mg-${t.k}`} className={`mg-t${done ? " is-done" : ""}`} style={{ "--i": i }} transition={GLIDE}>
      <div className="mg-t-in" onClick={() => setSrc((v) => !v)} {...hov}>
        <AnimatePresence>{hv && <RowHover key="h" o={at.current} t={GLIDE} />}</AnimatePresence>
        <span className="mg-t-c"><Mark t={t} done={done} /></span>
        <span className="mg-t-t">{t.t}{t.chased && !done && <small>{t.chased}</small>}</span>
        <span className="mg-t-who" title={nm(t.who)}><Av k={t.who} size={20} /></span>
        <span className={`mg-t-due${t.late && !done ? " is-late" : ""}`}>{t.late && !done ? "Late" : t.due}</span>
      </div>
      <AnimatePresence initial={false}>{src && <motion.div key="q" className="mg-q" {...OPEN}>
        {tx ? <Moment tx={tx} min={t.q[2]} text={t.q[0]} /> : <p>“{t.q[0]}”<span>{t.q[1]}, {t.q[2]} min in</span></p>}
        {(st.notes[t.k] || []).map((n, j) => <div key={j} className="mg-note">{withTags(n)}</div>)}
        <Mention onPost={(text) => set({ notes: { ...st.notes, [t.k]: [...(st.notes[t.k] || []), text] } })} />
      </motion.div>}</AnimatePresence>
    </motion.li>);
}
function Decision({ d, i, tx, min }) {
  const [open, setOpen] = useState(false), [hv, at, hov] = useHover();
  if (!tx || min == null) return <li style={{ "--i": i }}>{d}</li>;
  return (
    <li className="mg-dec-s" style={{ "--i": i }}>
      <div className="mg-dec-in" onClick={() => setOpen((v) => !v)} aria-expanded={open} {...hov}>
        <AnimatePresence>{hv && <RowHover key="h" o={at.current} t={GLIDE} />}</AnimatePresence>
        <span className="mg-dec-t">{d}</span><span className="mg-dec-m">{min} min</span>
      </div>
      <AnimatePresence initial={false}>{open && <motion.div key="m" className="mg-q" {...OPEN}><Moment tx={tx} min={min} /></motion.div>}</AnimatePresence>
    </li>);
}
// ---- @mentions on a task: type @ and the people (and agents) come up under the field; pick one with a click, Enter or Tab.
// Enter with the list closed posts the note under the task. A tagged name reads navy in the note.
const TAGGABLE = ["paul", "heather", "jordan", "caleb", "sam", "lisa", "orin", "calvin", "riley", "marco"];
const tagName = (k) => nm(k).split(" ")[0];
function withTags(text) { return text.split(/(@[A-Z][\w’']*)/).map((x, i) => (/^@[A-Z]/.test(x) && TAGGABLE.some((k) => "@" + tagName(k) === x) ? <b key={i} className="mg-at">{x}</b> : x)); }
function Mention({ onPost }) {
  const [v, setV] = useState(""), [hi, setHi] = useState(0), ref = useRef(null);
  const m = /(^|\s)@([\w’']*)$/.exec(v), q = m ? m[2].toLowerCase() : null;
  const list = q === null ? [] : TAGGABLE.filter((k) => tagName(k).toLowerCase().startsWith(q)).slice(0, 6);
  const pick = (k) => { setV(v.replace(/@([\w’']*)$/, "@" + tagName(k) + " ")); setHi(0); ref.current?.focus(); };
  const key = (e) => {
    if (list.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); setHi((h) => (h + (e.key === "ArrowDown" ? 1 : list.length - 1)) % list.length); return; }
    if (list.length && (e.key === "Enter" || e.key === "Tab")) { e.preventDefault(); pick(list[hi] || list[0]); return; }
    if (e.key === "Enter" && v.trim()) { e.preventDefault(); onPost(v.trim()); setV(""); return; }
    if (e.key === "Escape") { e.stopPropagation(); if (list.length) setV(v.replace(/@([\w’']*)$/, "")); else ref.current?.blur(); } };
  return (
    <div className="mg-mn" onClick={(e) => e.stopPropagation()}>
      <input ref={ref} value={v} onChange={(e) => { setV(e.target.value); setHi(0); }} onKeyDown={key} placeholder="Add a note · @ to mention someone" aria-label="Add a note" />
      <AnimatePresence>{list.length > 0 && <motion.div className="mg-mn-l" role="listbox" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
        {list.map((k, i) => <button key={k} type="button" role="option" aria-selected={i === hi} className={i === hi ? "is-on" : ""} onMouseDown={(e) => { e.preventDefault(); pick(k); }} onMouseEnter={() => setHi(i)}>
          <Av k={k} size={18} /><span>{nm(k)}</span>{isAgent(k) && <em>Agent</em>}</button>)}
      </motion.div>}</AnimatePresence>
    </div>);
}

// ---- what opens under the meeting's title: who was there, what was said, and the meetings before this one
// who was there and the meetings before this one: menus that grow out of their links, the way the date's menu did.
// A list that will keep growing (every week of a meeting) scrolls inside the menu instead of pushing the page down.
// Esc closes the menu only, never the meeting under it.
function Dd({ label, cls = "", menu, long, right }) {
  const [o, setO] = useState(false), ref = useRef(null), [bs, setBs] = useState({ w: 200, h: 28 });
  useEffect(() => { if (!o) return; const f = (e) => { if (!ref.current?.contains(e.target)) setO(false); }, k = (e) => { if (e.key === "Escape") { e.stopPropagation(); setO(false); } };
    addEventListener("pointerdown", f); addEventListener("keydown", k, true); return () => { removeEventListener("pointerdown", f); removeEventListener("keydown", k, true); }; }, [o]);
  return (
    <div className={`mg-dd mg-dd-l${right ? " is-right" : ""}${o ? " is-open" : ""}`} ref={ref}>
      <button type="button" className={`mg-rc-l${cls}`} aria-haspopup="listbox" aria-expanded={o} onClick={(e) => { setBs({ w: e.currentTarget.offsetWidth, h: e.currentTarget.offsetHeight }); setO((v) => !v); }}>{label}{DOWN}</button>
      <AnimatePresence>{o && <motion.div className={`mg-dd-m${long ? " is-long" : ""}`} role="listbox" style={{ "--bw": `${bs.w}px`, "--bh": `${bs.h}px` }} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16 } }}>
        <div className="mg-dd-s">{menu(() => setO(false))}</div>
      </motion.div>}</AnimatePresence>
    </div>);
}

function Recap({ m, wk, next, inCard }) {
  useSt(); Object.assign(G, useGoals());
  const [wid, setW] = useState(wk || m.weeks[0].id), w = m.weeks.find((x) => x.id === wid) || m.weeks[0];
  const tasks = tasksOf(w), mine = tasks.filter((t) => t.who === "seth"), rest = tasks.filter((t) => t.who !== "seth");
  // one of three things opens under the title at a time; Esc or a click anywhere else closes it
  const tx = st.tx && st.tx.w === w.id ? st.tx : null, setTx = (x) => set({ tx: x && { ...x, w: w.id } });
  const keep = useRef(0), artR = useRef(null), seenTx = useRef(false);
  useEffect(() => () => set({ tx: null }), []); // closing the meeting closes its transcript
  const openTx = (min) => { const sc = scrollerOf(artR.current); keep.current = sc ? sc.scrollTop : 0; seenTx.current = true; setTx({ min, t: Date.now() }); };
  const closeTx = () => setTx(null);
  useLayoutEffect(() => { if (tx) return; const sc = scrollerOf(artR.current); if (sc && seenTx.current) sc.scrollTop = keep.current; }, [tx]);
  useEffect(() => { if (!tx) return; const k = (e) => { if (e.key === "Escape") { e.stopPropagation(); setTx(null); } }; addEventListener("keydown", k, true); return () => removeEventListener("keydown", k, true); }, [tx]);
  useEffect(() => setTx(null), [w.id]);
  // the transcript's parts stay in view under the meeting's pinned title
  useLayoutEffect(() => { const a = artR.current, h = a && a.querySelector(".mg-rc-h"); if (!h) return; const inCard = !!a.closest(".mg-full"); // in the calendar's card the title pins under the card's own bar (70px)
    const f = () => a.style.setProperty("--tx-top", `${(inCard ? 70 : 0) + Math.round(h.getBoundingClientRect().height) + 16}px`); const ro = new ResizeObserver(f); ro.observe(h, { box: "border-box" }); f(); return () => ro.disconnect(); }, [tx]); // its padding changes as it pins
  const job = m.doc && agentJobs(40).find((x) => x.j.id === m.doc.job), deck = st.deck[m.k];
  // once it's arrived, a row that moves (a step confirmed into Since then) travels instead of arriving again
  const [settled, setSettled] = useState(false);
  useEffect(() => { setSettled(false); const t = setTimeout(() => setSettled(true), 1100); return () => clearTimeout(t); }, [w.id]);
  // scrolled into a long recap, the meeting's name and its date stay pinned above it, tightened to one quiet bar
  const sentR = useRef(null), [stuck, setStuck] = useState(false);
  useEffect(() => { const el = sentR.current, root = el && el.closest(".scroll"); if (!el || typeof IntersectionObserver === "undefined") return;
    const off = el.closest(".mg-full") ? 68 : 0; // opened from the calendar, it pins under the calendar's own way back
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < (e.rootBounds ? e.rootBounds.top : 0) + 2), { root, threshold: 0, rootMargin: `-${off}px 0px 0px 0px` });
    io.observe(el); return () => io.disconnect(); }, [w.id]);
  let n = 0;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <TxCtx.Provider value={w.tx ? openTx : null}>
      <motion.article ref={artR} key={w.id} className={`mg-rc${settled ? " is-settled" : ""}${tx ? " is-tx" : ""}${seenTx.current ? " is-kept" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }} transition={{ duration: 0.2 }}>
        {/* the meeting you chose on the left is the title here; under it, which week (the way back to earlier ones), who was there, how long */}
        <div ref={sentR} className="mg-rc-sent" aria-hidden="true" />
        <header className={`mg-rc-h${stuck ? " is-stuck" : ""}`} style={{ "--i": n++ }}>
          {/* the title on the left; who was there and the weeks before, as menus on its right edge, on the same line */}
          <div className="mg-rc-row">
            {/* reading the transcript, the title says so: it swaps in place, the same lift as everything else here */}
            <div key={tx ? "title-tx" : "title-rc"} className={`mg-rc-top${seenTx.current ? " mg-swap" : ""}`}>{tx
              ? <><h2 className="mg-name">Transcript:</h2><span className="mg-d">{m.t}, {w.d.split(", ").pop()}</span></>
              : <><h2 className="mg-name">{m.t}:</h2><span className="mg-d">{w.d}</span></>}</div>
            {!tx && <div key="acts" className={`mg-rc-acts${seenTx.current ? " mg-swap" : ""}`}>
              {/* who was there: their faces open it; each person starts a chat with them, the first row with everyone, about this meeting */}
              <Dd cls=" is-who" right label={<span className="mg-faces" aria-label={`${w.who.length} people`}>{w.who.map((p, i) => <span key={p} style={{ zIndex: 10 - i }}><Av k={p} size={20} /></span>)}</span>}
                menu={(close) => { const others = w.who.filter((p) => p !== "seth"), chat = (ks) => { close(); dispatchEvent(new CustomEvent("north:compose", { detail: { text: ks.map((k) => "@" + nm(k).split(" ")[0]).join(" ") + " ", topic: m.t } })); };
                  return [others.length > 1 && <button key="all" type="button" className="mg-dd-all" onClick={() => chat(others)}><span className="mg-faces">{others.map((p, i) => <span key={p} style={{ zIndex: 10 - i }}><Av k={p} size={20} /></span>)}</span><span>Chat with everyone</span></button>,
                    ...w.who.map((p) => { const n = tasks.filter((t) => t.who === p).length, inner = <><Av k={p} size={20} /><span>{nm(p)}</span><em>{n ? `${n} task${n > 1 ? "s" : ""}` : ""}</em></>;
                      return p === "seth" ? <div key={p} className="mg-dd-r">{inner}</div> : <button key={p} type="button" className="mg-dd-r" onClick={() => chat([p])} title={`Chat with ${nm(p)}`}>{inner}</button>; })]; }} />
              {m.weeks.length > 1 && <Dd label="Previous meetings" right long={m.weeks.length > 8}
                menu={(close) => m.weeks.map((x) => <button key={x.id} type="button" role="option" aria-selected={x.id === w.id} className={x.id === w.id ? "is-on" : ""} onClick={() => { setW(x.id); close(); }}>
                  <span className="mg-dd-tick">{x.id === w.id && TICK("currentColor")}</span><span>{x.d}</span><em>{x.mins} min</em></button>)} />}
            </div>}
          </div>
          {/* in the list, reading the transcript, the way back sits under the title; in the calendar's card it's the card's own bar */}
          {tx && !inCard && <div key="sub-tx" className="mg-rc-sub mg-swap">
            <button type="button" className="mg-rc-l mg-back" onClick={closeTx}>{ARROW_L}Back to recap</button></div>}
        </header>
        {tx && <div key={tx.t} className="mg-txin"><TranscriptView doc={FILE_OF(w.tx)} min={tx.min} wait={0} /></div>}
        <div className="mg-rc-body" hidden={!!tx}>
        <p className="mg-story" style={{ "--i": n++ }}>{w.recap}</p>
        {/* the whole record, right under what it's the record of */}
        {w.tx && <button type="button" className="mg-mo-go mg-rc-tx" style={{ "--i": n++ }} onClick={() => openTx(null)}>Read the transcript{ARROW_R}</button>}
        <LayoutGroup id={w.id}>
          <section className="mg-sec">
            <h3 style={{ "--i": n++ }}>Decided</h3>
            <ul className={`mg-dec${w.src ? " has-src" : ""}`}>{w.decided.map((d, j) => <Decision key={d} d={d} i={n++} tx={w.tx} min={w.src && w.src[j]} />)}</ul>
          </section>
          <section className="mg-sec">
            {/* yours first, under their own label, so what this meeting left on you is the first thing you read */}
            <h3 style={{ "--i": n++ }}>Tasks{mine.length > 0 && <em>{mine.length} yours</em>}</h3>
            {mine.length > 0 && rest.length > 0 && <div className="mg-ts-l" style={{ "--i": n++ }}>Yours</div>}
            <ul className="mg-ts">{mine.map((t) => <Task key={t.k} t={t} i={n++} tx={w.tx} />)}</ul>
            {mine.length > 0 && rest.length > 0 && <div className="mg-ts-l" style={{ "--i": n++ }}>Everyone else</div>}
            <ul className="mg-ts">{rest.map((t) => <Task key={t.k} t={t} i={n++} tx={w.tx} />)}</ul>
          </section>
        </LayoutGroup>
        {w.latest && <section className="mg-sec">
          <h3 style={{ "--i": n++ }}>Agenda<em>{m.next}</em></h3>
          <ol className="mg-ag">{m.agenda.map(([t, who, s], i) => <li key={t} style={{ "--i": n++ }}><span className="mg-n">{i + 1}</span><span className="mg-ag-t"><b>{t}</b><span>{s}</span></span><Av k={who} size={20} /></li>)}</ol>
          <div className="mg-make" style={{ "--i": n++ }}>
            {m.doc ? (!job ? <button type="button" className="rt-b" onClick={(e) => showFile(m.doc.file, e.currentTarget)}>Open the doc</button>
              : <span className="mg-by"><Av k={m.doc.who} size={20} />{nm(m.doc.who)} is writing the doc</span>)
              : deck ? <span className="mg-by"><Av k={m.maker} size={20} />{nm(m.maker)} is making the deck</span>
              : m.maker ? <motion.button type="button" className="rt-b" whileTap={{ scale: 0.97 }} onClick={() => set({ deck: { ...st.deck, [m.k]: true } })}>Make the deck</motion.button> : null}
          </div>
        </section>}
        </div>
      </motion.article>
      </TxCtx.Provider>
    </AnimatePresence>);
}

// the meetings themselves, under a quiet label for their kind. The name leads; the next date lives on the recap's Agenda, not in a tip.
// Choosing one grows its fill from where you clicked
function List({ k, setK }) {
  useSt(); Object.assign(G, useGoals());
  const types = [...new Set(MEETINGS.map((m) => m.type))];
  return (
    <nav className="mg-nav" aria-label="Meetings">{types.map((ty) => <section key={ty}>
      <h4>{ty}</h4>
      <ul>{MEETINGS.filter((m) => m.type === ty).map((m) => <Item key={m.k} m={m} on={m.k === k} onPick={() => setK(m.k)} />)}</ul>
    </section>)}</nav>);
}
function Item({ m, on, onPick }) {
  const [hv, at, hov] = useHover(), late = lateOf(m);
  return (
    <li className={`mg-i${on ? " is-on" : ""}`}>
      <button type="button" aria-current={on ? "true" : undefined} onClick={onPick} {...hov}>
        {on && <SelIn key={m.k} className="mg-sel" />}
        <AnimatePresence>{hv && !on && <RowHover key="h" o={at.current} t={GLIDE} />}</AnimatePresence>
        <b>{m.t}</b>{late > 0 ? <em className="is-late">{late} late</em> : null}
      </button>
    </li>);
}

// every meeting has its record: the transcript, and the minute each decision was made in it
const TX_SRC = {"sync-2": [8], "hire-3": [13, 23], "board-15": [4], "pipe-5": [6, 14], "fcst-6": [16], "outb-4": [16], "mkt-10": [14], "mkt-3": [10], "renew-4": [12, 15], "onb-5": [5], "1p-4": [5], "1h-6": [16]};
MEETINGS.forEach((m) => m.weeks.forEach((w) => { if (TX_SRC[w.id]) { w.tx = "tx-" + w.id; w.src = TX_SRC[w.id]; } }));

// ---------- Calendar: the meetings laid out by day, week or month, in a card like the page's charts.
// Colour is the kind of meeting. A meeting opens out of its own block into a card beside it (its recap for that day, or the
// latest one, whose Agenda is what's coming); Esc or a click anywhere else folds it back. Views and weeks change with the
// meetings travelling to where they sit in the next one. Ask by typing or voice ("Thursday", "the pipeline review",
// "next week", "Nov 17") and it brings that day or meeting up.
const TYPES = { Leadership: "#2563a8", Revenue: "#6d4fc2", Customers: "#098486", People: "#ff725c" }; // navy is the text's colour, so leadership takes a true blue; ochre stays clear of coral (target) and red (behind)
const NOW = new Date(2026, 10, 10, 11, 30), TODAY = new Date(2026, 10, 10); // the prototype's today: Tue, Nov 10, late morning
const MIN_D = new Date(2026, 9, 1), MAX_D = new Date(2026, 11, 31);
const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const H0 = 8, H1 = 18, PX = 60; // 8 AM to 6 PM, an hour a row
const LAY = { duration: 0.55, ease: [0.32, 0.72, 0, 1] }; // the metric card's open: things travel, they don't jump
const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const md = (d) => `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`;
const hm = (min) => { const h = Math.floor(min / 60), m = min % 60; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}`; };
const ampm = (h) => `${((h + 11) % 12) + 1} ${h < 12 ? "AM" : "PM"}`;
const same = (a, b) => a.toDateString() === b.toDateString();
const WK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const monOf = (d) => addD(d, -((d.getDay() + 6) % 7));
const clampD = (d) => (d < MIN_D ? MIN_D : d > MAX_D ? MAX_D : d);
const dk = (d) => `${d.getMonth() + 1}-${d.getDate()}`;
const recDate = (w) => new Date(`${w.d.split(", ")[1]}, 2026`);
const ANCHOR2 = new Date(2026, 10, 3); // every-other-week meetings count from here
function occurs(m, d) {
  if (d.getDay() !== m.dow) return false;
  if (m.every === 2 && Math.round((d - ANCHOR2) / 864e5 / 7) % 2) return false;
  if (m.nth && Math.ceil(d.getDate() / 7) !== m.nth) return false;
  return true;
}
function eventsOn(d, hidden = {}) {
  return MEETINGS.filter((m) => !hidden[m.type] && occurs(m, d)).map((m) => {
    const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(m.at / 60), m.at % 60), past = at < NOW;
    const rec = m.weeks.find((w) => w.d === `${DAY[d.getDay()]}, ${md(d)}`) || (past ? m.weeks.find((w) => recDate(w) <= d) : null);
    return { key: `${m.k}-${dk(d)}`, m, d, past, wk: rec ? rec.id : null };
  }).sort((a, b) => a.m.at - b.m.at);
}

// ---- asking: a day, a week, a date, a meeting, or a view. No model: it reads the words, the way voice commands do
const MO = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const ALIAS = { sync: ["monday sync", "leadership sync"], hire: ["hiring"], board: ["board"], pipe: ["pipeline"], fcst: ["forecast"], outb: ["outbound"],
  mkt: ["marketing"], renew: ["renewal"], onb: ["onboarding"], "1paul": ["paul"], "1heather": ["heather"] };
export function findInCalendar(raw) {
  const t = ` ${String(raw || "").toLowerCase().replace(/[’']/g, "").replace(/[?.!,]/g, " ")} `;
  if (/\b(book|schedule|set up|tell|ask|message|text|remind)\b/.test(t)) return null; // not ours
  let d = null, span = "day", view = null, lastOne = /\b(last|previous)\b/.test(t) && !/\blast week\b/.test(t);
  if (/\bmonth\b/.test(t)) view = "month"; else if (/\bday view\b|\bby day\b/.test(t)) view = "day"; else if (/\bweek view\b|\bby week\b/.test(t)) view = "week";
  if (/\btoday\b/.test(t)) d = TODAY; else if (/\btomorrow\b/.test(t)) d = addD(TODAY, 1); else if (/\byesterday\b/.test(t)) d = addD(TODAY, -1);
  else if (/\bnext week\b/.test(t)) { d = addD(monOf(TODAY), 7); span = "week"; } else if (/\blast week\b/.test(t)) { d = addD(monOf(TODAY), -7); span = "week"; }
  else if (/\bthis week\b/.test(t)) { d = monOf(TODAY); span = "week"; }
  const mo = t.match(new RegExp(`\\b(${MO.join("|")})[a-z]*\\.? (\\d{1,2})(st|nd|rd|th)?\\b`)) || t.match(new RegExp(`\\b(\\d{1,2})(st|nd|rd|th)? (of )?(${MO.join("|")})`));
  if (mo) { const mi = MO.indexOf((mo[1].match(/[a-z]+/) ? mo[1] : mo[4]).slice(0, 3)), dd = +(mo[1].match(/\d/) ? mo[1] : mo[2]); d = new Date(2026, mi, dd); span = "day"; }
  else { const th = t.match(/\bthe (\d{1,2})(st|nd|rd|th)\b/); if (th) { d = new Date(2026, TODAY.getMonth(), +th[1]); span = "day"; } }
  let wd = DAY.findIndex((x) => new RegExp(`\\b${x.toLowerCase()}s?\\b`).test(t));
  if (!mo && wd >= 0) { if (wd === 0) wd = 7; const base = d && span === "week" ? d : monOf(TODAY); d = addD(base, wd - 1); if (/\bnext\b/.test(t) && span !== "week") d = addD(d, 7); if (/\blast\b/.test(t) && span !== "week") d = addD(d, -7); span = "day"; }
  // a meeting, by its name or the word people use for it
  const m = MEETINGS.find((x) => t.includes(` ${x.t.toLowerCase()} `) || t.includes(x.t.toLowerCase())) || MEETINGS.find((x) => (ALIAS[x.k] || []).some((a) => t.includes(a)));
  if (!m && !d && !view) return null;
  let ev = null;
  if (m) {
    if (d) { const days = span === "week" ? [0, 1, 2, 3, 4, 5, 6].map((i) => addD(monOf(d), i)) : [d, ...[1, 2, 3, 4, 5, 6].map((i) => addD(d, i))]; const day = days.find((x) => occurs(m, x)); if (day) d = day; }
    else { // no date: the next one, or the last one if asked
      for (let i = 0; i < 60 && !d; i++) { const x = addD(TODAY, lastOne ? -i : i); if (occurs(m, x) && (lastOne ? x <= TODAY : new Date(x.getFullYear(), x.getMonth(), x.getDate(), Math.floor(m.at / 60), m.at % 60) >= NOW)) d = x; }
    }
    if (d) ev = eventsOn(d).find((e) => e.m.k === m.k) || null;
  }
  if (d) d = clampD(d);
  const line = ev ? `${ev.m.t} · ${DAY[ev.d.getDay()].slice(0, 3)}, ${md(ev.d)}` : d ? (span === "week" ? `Week of ${md(monOf(d))}` : `${DAY[d.getDay()]}, ${md(d)}`) : `${view[0].toUpperCase() + view.slice(1)} view`;
  return { d, view: view || (ev ? null : span === "week" ? "week" : d ? "day" : null), ev, line };
}

// one place for the calendar's state, so the column on the left and the card on the right move together
function useCal() {
  const [view, setView] = useState("week"), [weekends, setWeekends] = useState(false), [cur, setCur] = useState(TODAY), [open, setOpen] = useState(null), [hidden, setHidden] = useState({}), [dir, setDir] = useState(0);
  const go = (d, v) => { const nd = clampD(weekends ? d : wkday(d)); setDir(v && v !== view ? 0 : nd > cur ? 1 : nd < cur ? -1 : 0); setCur(nd); if (v) setView(v); };
  const pick = (v) => { setDir(0); setView(v); }; // a new view isn't a step in time: it fades through, it doesn't slide
  return { view, setView: pick, weekends, setWeekends: (v) => { setDir(0); setWeekends(v); if (!v) setCur((d) => wkday(d)); }, cur, setCur, go, open, setOpen, hidden, setHidden, dir };
}
// Week is all seven days; 5 Day is the working week
// weekends hidden (the default): a week is Mon–Fri and a month has five columns; shown, both run all seven days
const cols = (c) => (c.weekends ? 7 : 5);
const wkday = (d) => { const g = d.getDay(); return g === 6 ? addD(d, 2) : g === 0 ? addD(d, 1) : d; };
const rangeOf = (c) => c.view === "day" ? [c.cur] : c.view === "week" ? Array.from({ length: cols(c) }, (_, i) => addD(monOf(c.cur), i)) : null;
const titleOf = (c) => {
  if (c.view === "day") return `${DAY[c.cur.getDay()]}, ${md(c.cur)}`;
  if (c.view === "month") return c.cur.toLocaleString("en-US", { month: "long", year: "numeric" });
  const m = monOf(c.cur), f = addD(m, cols(c) - 1); return `${md(m)} – ${f.getMonth() === m.getMonth() ? f.getDate() : md(f)}`;
};
const step = (c, n) => c.view === "day" ? (() => { let d = addD(c.cur, n); while (!c.weekends && d.getDay() % 6 === 0) d = addD(d, n); return d; })()
  : c.view === "week" ? addD(c.cur, 7 * n) : new Date(c.cur.getFullYear(), c.cur.getMonth() + n, 1);
const holdsToday = (c) => c.view === "day" ? same(c.cur, TODAY) : c.view === "week" ? same(monOf(c.cur), monOf(TODAY)) : c.cur.getMonth() === TODAY.getMonth();

const Chev = ({ d = "l" }) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={d === "l" ? "M8.5 3.5 5 7l3.5 3.5" : "M5.5 3.5 9 7l-3.5 3.5"} /></svg>;

// a toggle with the charts' sliding pill
function Seg2({ v, set, opts, label }) {
  const ref = useRef(null), [at, setAt] = useState(null);
  useLayoutEffect(() => { const el = ref.current && ref.current.querySelector('[aria-selected="true"]'); if (el) setAt({ left: el.offsetLeft, width: el.offsetWidth }); }, [v]);
  return (
    <div ref={ref} className="seg seg-sm" role="tablist" aria-label={label}>
      {at && <motion.span className="seg-pill is-free" initial={false} animate={at} transition={{ type: "spring", visualDuration: 0.38, bounce: 0.16 }} />}
      {opts.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={v === k} className={v === k ? "on" : ""} onClick={() => set(k)}><span className="seg-t">{l}</span></button>)}
    </div>);
}

// ---- the left column, in calendar mode: which kinds of meeting show. Asking for a day or a meeting is K or ⌃, as everywhere
function applyFind(c, r) {
  if (r.d) c.go(r.d, r.view || (c.view === "month" && r.ev ? "week" : null));
  else if (r.view) c.setView(r.view);
  c.setOpen(null);
  if (r.ev) setTimeout(() => c.setOpen(r.ev), 620); // after the view has arrived, so the meeting grows out of its own block
}
// the date in the card's head is the way to any day: it opens a month that grows out of it, the way every dropdown here does
function DatePick({ c, label }) {
  const [o, setO] = useState(false), ref = useRef(null), [bs, setBs] = useState({ w: 200, h: 40 });
  const [m0, setM0] = useState(new Date(c.cur.getFullYear(), c.cur.getMonth(), 1));
  useEffect(() => { if (!o) return; setM0(new Date(c.cur.getFullYear(), c.cur.getMonth(), 1));
    const f = (e) => { if (!ref.current?.contains(e.target)) setO(false); }, k = (e) => e.key === "Escape" && (e.stopPropagation(), setO(false));
    addEventListener("pointerdown", f); addEventListener("keydown", k, true); return () => { removeEventListener("pointerdown", f); removeEventListener("keydown", k, true); }; }, [o]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = []; for (let w = monOf(m0); w <= new Date(m0.getFullYear(), m0.getMonth() + 1, 0); w = addD(w, 7)) rows.push(w);
  const wk = monOf(c.cur), canB = m0 > MIN_D, canF = new Date(m0.getFullYear(), m0.getMonth() + 1, 1) <= MAX_D;
  const isSel = (d) => (c.view === "day" ? same(d, c.cur) : c.view === "week" ? same(monOf(d), wk) && (c.weekends || d.getDay() % 6 !== 0) : d.getMonth() === c.cur.getMonth() && d.getMonth() === m0.getMonth());
  return (
    <div className={`mg-dp${o ? " is-open" : ""}`} ref={ref}>
      <button type="button" className="mg-dp-b" aria-expanded={o} onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setBs({ w: r.width, h: r.height }); setO((v) => !v); }}>
        <AnimatePresence mode="popLayout" initial={false}><motion.h2 key={label} initial={{ opacity: 0, y: 6 * (c.dir || 1) }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 * (c.dir || 1) }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>{label}</motion.h2></AnimatePresence>
        <svg className="mg-dp-c" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 5.5 7 9l3.5-3.5" /></svg>
      </button>
      {o && (
        <div className="mg-dp-m" role="dialog" aria-label="Pick a date" style={{ "--bw": `${bs.w}px`, "--bh": `${bs.h}px` }}>
          <div className="mg-dp-h"><b>{m0.toLocaleString("en-US", { month: "long", year: "numeric" })}</b>
            <span><button type="button" className="ibtn" aria-label="Previous month" disabled={!canB} onClick={() => setM0(new Date(m0.getFullYear(), m0.getMonth() - 1, 1))}><Chev /></button>
              <button type="button" className="ibtn" aria-label="Next month" disabled={!canF} onClick={() => setM0(new Date(m0.getFullYear(), m0.getMonth() + 1, 1))}><Chev d="r" /></button></span></div>
          <div className="mg-dp-g">
            {WK.map((x) => <span key={x} className="mg-dp-dw">{x}</span>)}
            {rows.map((w) => [0, 1, 2, 3, 4, 5, 6].map((i) => { const d = addD(w, i);
              return <button key={dk(d)} type="button" disabled={d < MIN_D || d > MAX_D}
                className={`mg-dp-d${d.getMonth() !== m0.getMonth() ? " is-out" : ""}${same(d, TODAY) ? " is-today" : ""}${isSel(d) ? " is-sel" : ""}`}
                onClick={() => { setO(false); c.setOpen(null); c.go(d, c.view === "month" ? "day" : null); }}>{d.getDate()}</button>; }))}
          </div>
        </div>)}
    </div>);
}
function Kinds({ c }) {
  return (
    <ul className="mg-kinds">{Object.entries(TYPES).map(([ty, col]) => { const off = !!c.hidden[ty], n = MEETINGS.filter((m) => m.type === ty).length;
      return <li key={ty}><button type="button" className={off ? "is-off" : ""} style={{ "--c": col }} aria-pressed={!off} onClick={() => c.setHidden({ ...c.hidden, [ty]: !off })}>
        <i />{ty}<em>{n}</em></button></li>; })}
      {/* below the kinds, set apart: weekends, hidden by default, a switch on the same right edge as the counts */}
      <li className="mg-wkend"><button type="button" role="switch" aria-checked={!c.weekends} onClick={() => c.setWeekends(!c.weekends)}>
        Hide weekends<span className={`mg-sw${c.weekends ? "" : " is-on"}`}><motion.i layout transition={{ type: "spring", visualDuration: 0.3, bounce: 0.2 }} /></span></button></li></ul>);
}

// ---- the card. A meeting is its colour as a soft fill, rounded like everything here; nothing ruled down its side
function Ev({ e, c, view, i, gone }) {
  const h = (e.m.dur / 60) * PX - 4, short = h < 40;
  return (
    <button data-ev={e.key} type="button" className={`mg-ev${e.past ? " is-past" : ""}${short ? " is-short" : ""}${gone ? " is-gone" : ""}`} tabIndex={gone ? -1 : undefined}
      style={{ top: ((e.m.at - H0 * 60) / 60) * PX + 2, height: Math.max(26, h), "--c": TYPES[e.m.type], "--i": i }}
      onClick={(ev) => { ev.stopPropagation(); c.setOpen(e); }}>
      <b>{e.m.t}</b>{view === "day" && <span>{hm(e.m.at)}–{hm(e.m.at + e.m.dur)}</span>} {/* in a week the hour line says when; only Day, where every block has room, spells it out */}
      {view === "day" && e.m.weeks[0] && <span className="mg-ev-who">{e.m.weeks[0].who.slice(0, 5).map((p) => <Av key={p} k={p} size={18} />)}</span>}
    </button>);
}
function Grid({ c, days }) {
  return (
    <div className={`mg-cg is-${c.view}`} style={{ "--n": days.length }}>
      {c.view !== "day" && <div className="mg-cg-h"><span className="mg-cg-gut" />
        {days.map((d) => <div key={dk(d)} className={`mg-cg-dh${same(d, TODAY) ? " is-today" : ""}`}><span>{DAY[d.getDay()].slice(0, 3)}</span><b>{d.getDate()}</b></div>)}
      </div>}
      <div className="mg-cg-b">
        <div className="mg-cg-t">{Array.from({ length: H1 - H0 }, (_, i) => <span key={i} style={{ top: i * PX }}>{i ? ampm(H0 + i) : ""}</span>)}</div>
        {days.map((d, di) => <div key={dk(d)} className={`mg-cg-c${same(d, TODAY) && c.view !== "day" ? " is-today" : ""}`} style={{ height: (H1 - H0) * PX }}>
          {eventsOn(d).map((e, j) => <Ev key={e.key} e={e} c={c} view={c.view} i={di * 2 + j} gone={!!c.hidden[e.m.type]} />)}</div>)}
      </div>
    </div>);
}
function Month({ c }) {
  const m0 = new Date(c.cur.getFullYear(), c.cur.getMonth(), 1), last = new Date(m0.getFullYear(), m0.getMonth() + 1, 0), rows = [];
  for (let w = monOf(m0); w <= last; w = addD(w, 7)) rows.push(w);
  return (
    <div className="mg-mo" style={{ "--cols": cols(c) }}>
      <div className="mg-mo-h">{WK.slice(0, cols(c)).map((x) => <span key={x}>{x}</span>)}</div>
      {rows.map((w, ri) => <div key={dk(w)} className="mg-mo-r">{Array.from({ length: cols(c) }, (_, i) => i).map((i) => { const d = addD(w, i), all = eventsOn(d), evs = all.filter((e) => !c.hidden[e.m.type]), shown = new Set(evs.slice(0, 3).map((e) => e.key)), out = d.getMonth() !== m0.getMonth();
        return (
          <div key={i} className={`mg-mo-c${out ? " is-out" : ""}${same(d, TODAY) ? " is-today" : ""}`}>
            <button type="button" className="mg-mo-d" onClick={() => c.go(d, "day")}>{d.getDate()}</button>
            {all.filter((e) => shown.has(e.key) || c.hidden[e.m.type]).map((e, j) => <button key={e.key} tabIndex={c.hidden[e.m.type] ? -1 : undefined} data-ev={e.key} type="button" style={{ "--c": TYPES[e.m.type], "--i": ri + i + j }}
              className={`mg-chip${e.past ? " is-past" : ""}${c.hidden[e.m.type] ? " is-gone" : ""}`} onClick={(ev) => { ev.stopPropagation(); c.setOpen(e); }}>
              <b>{e.m.t}</b><span>{hm(e.m.at)}</span></button>)}
            {evs.length > 3 && <button type="button" className="mg-more" onClick={() => c.go(d, "day")}>{evs.length - 3} more</button>}
          </div>); })}</div>)}
    </div>);
}
// a meeting opened, the way a chart card opens: the box itself grows from the block to the frame (its real size, never a
// scale, so no type stretches), the recap is laid out at its final width inside it and arrives in a soft stagger; closing
// folds the box back into the block it came from
const mixP = (hex, a) => { const n = parseInt(hex.slice(1), 16), P = [254, 251, 249], C = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; return `rgb(${C.map((v, i) => Math.round(P[i] + (v - P[i]) * a)).join(", ")})`; };
// the chart-card open on Home (App.jsx MOTION.open, field.jsx OPEN0): expand .55s, collapse .5s, contents in from .08s
const CARD_OPEN = { expand: { duration: 0.5, ease: [0.32, 0.72, 0, 1] }, collapse: { duration: 0.32, ease: [0.45, 0, 0.15, 1] }, contentDelay: 0.05 }; // the card's curves, tightened for a meeting-sized open
function Full({ c, frameR, onH, T }) {
  const o = c.open, col = TYPES[o.m.type], innerR = useRef(null), boxR = useRef(null), fold = useRef(null);
  const rectOf = () => { const f = frameR.current && frameR.current.getBoundingClientRect(), el = document.querySelector(`.mg-cg [data-ev="${o.key}"], .mg-mo [data-ev="${o.key}"]`), r = el && el.getBoundingClientRect();
    return f && r ? { left: r.left - f.left, top: r.top - f.top, width: r.width, height: r.height } : { left: 0, top: 0, width: f ? f.width : 800, height: 40 }; };
  const [from] = useState(rectOf), W = frameR.current ? frameR.current.clientWidth : 800, H0f = frameR.current ? frameR.current.clientHeight : 600;
  const [H, setH] = useState(H0f), [isPresent, safeToRemove] = usePresence();
  const bz = (e) => `cubic-bezier(${(e || [0.32, 0.72, 0, 1]).join(",")})`, E = bz(T.open.ease), EC = bz(T.close.ease || [0.45, 0, 0.15, 1]), D = T.open.duration * 1000, DC = T.close.duration * 1000;
  useLayoutEffect(() => { const el = innerR.current; if (!el) return; const go = () => { const h = Math.max(H0f, el.offsetHeight); setH(h); onH(h); };
    // the title row itself (name and date) starts as the block's label, at the label's size and place, and grows with the
    // box into the title: one element riding the same curve as the box, so it never reads as a separate move
    const top = el.querySelector(".mg-rc-top"), bx = el.getBoundingClientRect();
    if (top && top.animate) { const r = top.getBoundingClientRect(), k = 13 / 24, n = top.querySelector(".mg-name"), d = top.querySelector(".mg-d");
      const small = `translate(${10 - (r.left - bx.left)}px, ${7 - (r.top - bx.top)}px) scale(${k})`; top.style.transformOrigin = "0 0";
      top.animate([{ transform: small }, { transform: "none" }], { duration: D, easing: E });
      if (n) n.animate([{ color: "#ffffff" }, { color: "#093555" }], { duration: D * 0.6, easing: "ease-out" });
      if (d) d.animate([{ opacity: 0 }, { opacity: 1 }], { duration: D * 0.6, delay: D * 0.25, easing: "ease-out", fill: "backwards" });
      // and the way back: the same row shrinks into the block's label as the box folds
      fold.current = () => { top.animate([{ transform: "none" }, { transform: small }], { duration: DC, easing: EC, fill: "forwards" });
        if (n) n.animate([{ color: "#093555" }, { color: "#ffffff" }], { duration: DC, easing: "ease-in", fill: "forwards" });
        if (d) d.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DC * 0.4, easing: "ease-in", fill: "forwards" }); }; }
    const ro = new ResizeObserver(go); ro.observe(el); go(); return () => ro.disconnect(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (isPresent) return; boxR.current && boxR.current.classList.add("is-closing"); fold.current && fold.current(); const t = setTimeout(safeToRemove, DC); return () => clearTimeout(t); }, [isPresent]); // eslint-disable-line react-hooks/exhaustive-deps
  const tint = mixP(col, 1), paper = mixP(col, 0);
  return (
    // opens the way a chart card on Home does: the block itself grows into the card, its corners rounding; its colour turns
    // to paper early (no big slab of colour on the way), its name grows into the title on the same curve, the rest arrives
    // in a quick stagger. Closing is the reverse: the body goes first, the title shrinks back into the label, the colour
    // returns only at the end, as it becomes the block again
    <motion.div ref={boxR} className="mg-full" initial={{ ...from, borderRadius: 4, backgroundColor: tint }}
      animate={{ left: 0, top: 0, width: W, height: H, borderRadius: 12, backgroundColor: paper, transition: { duration: T.open.duration, ease: T.open.ease, backgroundColor: { duration: T.open.duration * 0.45, ease: "easeOut" } } }}
      exit={{ ...from, borderRadius: 4, backgroundColor: [paper, paper, tint], transition: { duration: T.close.duration, ease: T.close.ease, backgroundColor: { duration: T.close.duration, times: [0, 0.55, 1] } } }}>
      <div ref={innerR} className="mg-full-in" style={{ width: W }}>
        <Recap m={o.m} wk={o.wk} inCard />
      </div>
    </motion.div>);
}
function CalCard({ c }) {
  useSt(); const swapped = useRef(false); if (st.tx) swapped.current = true; else if (!c.open) swapped.current = false; // the bar's label lifts in when it changes back
  // tuned in DialKit's Motion panel under "Meetings calendar" (select the calendar with the picker to jump there)
  const MC = (c.M && c.M.meetings) || {}, ein = MC.evIn || { duration: 0.25, ease: [0, 1.05, 0.48, 0.95] };
  const T = { open: MC.open || CARD_OPEN.expand, close: MC.close || CARD_OPEN.collapse };
  const days = rangeOf(c), cardR = useRef(null), frameR = useRef(null), [fullH, setFullH] = useState(0);
  useEffect(() => { if (!c.open) return; const k = (e) => { if (e.key === "Escape") c.setOpen(null); };
    const d = (e) => { if (cardR.current && !cardR.current.contains(e.target) && !e.target.closest(".mg-dd-m, .mg-kinds, .side, .mg-left > .seg")) c.setOpen(null); };
    addEventListener("keydown", k); document.addEventListener("pointerdown", d, true); return () => { removeEventListener("keydown", k); document.removeEventListener("pointerdown", d, true); }; }, [c.open]); // eslint-disable-line react-hooks/exhaustive-deps
  const vkey = (c.view === "month" ? `m${c.cur.getMonth()}` : `${c.view}${dk(days[0])}`) + (c.weekends ? "-7" : "-5");
  return (
    <section className="mg-calc card" ref={cardR} style={{ "--ev-dur": `${ein.duration}s`, "--ev-ease": `cubic-bezier(${(ein.ease || [0, 1.05, 0.48, 0.95]).join(",")})`, "--ev-gap": `${MC.evGap ?? 27}ms`, "--ev-delay": `${MC.evDelay ?? 0}ms`, "--ev-op": MC.evOp ?? 0 }}><div className="surface">
      <header className="card-head mg-calc-h">
        {c.open
          ? <button type="button" className="mg-crumb" onClick={() => (st.tx ? set({ tx: null }) : c.setOpen(null))}>
              <span key={st.tx ? "tx" : "cal"} className={`mg-crumb-in${swapped.current ? " mg-swap" : ""}`}>{ARROW_L}{st.tx ? "Back to recap" : titleOf(c)}</span></button>
          : <><DatePick c={c} label={titleOf(c)} />
            <span className="mg-calc-nav">
              <button type="button" className="ibtn" aria-label="Back" disabled={step(c, -1) < addD(MIN_D, -6)} onClick={() => c.go(step(c, -1))}><Chev /></button>
              <button type="button" className="ibtn" aria-label="Forward" disabled={step(c, 1) > MAX_D} onClick={() => c.go(step(c, 1))}><Chev d="r" /></button>
              <AnimatePresence initial={false}>{!holdsToday(c) && <motion.button key="t" type="button" className="rt-b mg-today" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.22 }} onClick={() => c.go(TODAY)}>Today</motion.button>}</AnimatePresence></span>
            <span className="card-head-r"><Seg2 v={c.view} set={c.setView} opts={[["day", "Day"], ["week", "Week"], ["month", "Month"]]} label="Calendar view" /></span></>}
      </header>
      <div className={`mg-frame${c.open ? " has-open" : ""}`} ref={frameR} style={c.open && fullH ? { minHeight: fullH } : undefined}>
        <LayoutGroup id="mg-cal">
          <AnimatePresence mode="popLayout" initial={false} custom={c.dir}>
            <motion.div key={vkey} className="mg-calc-v" custom={c.dir}
              variants={{ i: (dir) => ({ opacity: 0, x: dir * 28 }), a: { opacity: 1, x: 0 }, e: (dir) => ({ opacity: 0, x: dir * -28, transition: { duration: dir ? 0.2 : 0.14, ease: [0.4, 0, 1, 1] } }) }}
              initial="i" animate="a" exit="e" transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              {c.view === "month" ? <Month c={c} /> : <Grid c={c} days={days} />}
            </motion.div>
          </AnimatePresence>
        </LayoutGroup>
        <AnimatePresence>{c.open && <Full key={c.open.key} c={c} frameR={frameR} onH={setFullH} T={T} />}</AnimatePresence>
      </div>
    </div></section>);
}

// what the meetings left on you, at the top the way Home has it: the same rows, only the ones a meeting raised
const MINE = [...new Set(Object.values(LINK))];
const FROM = Object.fromEntries(MEETINGS.flatMap((m) => [...(m.weeks[0].confirm || []), ...m.weeks[0].tasks].filter((t) => LINK[t.k]).map((t) => [LINK[t.k], m.t])));
export function MeetingsPage({ M } = {}) {
  const [k, setK] = useState(MEETINGS[0].k), m = MEETINGS.find((x) => x.k === k), [mode, setMode] = useState("cal"); // the page opens on the calendar; List is one click away
  const c = useCal(), cRef = useRef(c); c.M = M; cRef.current = c;
  // say a day or a meeting (hold ⌃) or type it (K) anywhere on this page: the calendar brings it up
  useEffect(() => { const f = (raw) => { const r = findInCalendar(raw); if (!r) return null; setMode("cal"); applyFind(cRef.current, r); return r.line; };
    window.__northPageFind = f; const off = onIntent((n, raw) => f(raw)); return () => { off(); if (window.__northPageFind === f) delete window.__northPageFind; }; }, []);
  useEffect(() => { if (c.open) setK(c.open.m.k); }, [c.open]); // what you open in the calendar is what the list shows
  const headRef = useRef(null);
  useLayoutEffect(() => { const a = headRef.current, cc = a && a.closest(".content"), st0 = document.documentElement.style; if (!a || !cc) return;
    const go = () => st0.setProperty("--band-h", `${Math.round(a.getBoundingClientRect().bottom - cc.getBoundingClientRect().top + 28)}px`);
    const ro = new ResizeObserver(go); ro.observe(a); go(); return () => ro.disconnect(); }, []);
  return (
    <div className="ch dhp mg">
      <header ref={headRef} className="dhp-head"><div className="hello"><h1>Meetings</h1></div><p className="dhp-lead">What each meeting was about, what’s happened since, and what’s next.</p>
        <div className="nd-wrap mg-nd"><NeedsYou bare only={MINE} from={FROM} /></div></header>
      <div className={`mg-grid${mode === "cal" ? " is-cal" : ""}`}>
        <div className="mg-left">
          <Seg2 v={mode} set={(v) => { // a meeting open in the calendar: List opens on that same meeting; the calendar leaves whole and comes back closed
            if (v === "list" && c.open) setK(c.open.m.k); if (v === "cal") c.setOpen(null); setMode(v); }} opts={[["list", "List"], ["cal", "Calendar"]]} label="Meetings view" />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={mode} className="mg-left-b" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              {mode === "list" ? <List k={k} setK={setK} /> : <Kinds c={c} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {mode === "list"
            ? <motion.div key={"l" + k} className="mg-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }} transition={{ duration: 0.2 }}>
                <Recap m={m} /></motion.div>
            : <motion.div key="cal" className="mg-main" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.16 } }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <CalCard c={c} /></motion.div>}
        </AnimatePresence>
      </div>
    </div>);
}
