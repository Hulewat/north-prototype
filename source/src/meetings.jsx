// Meetings, read like the "previously on" before an episode: pick a meeting, and its latest one reads top to bottom as a
// short memo. What it was about, in a few plain sentences; what it decided; what's happened since (people tick their own,
// agents' work ticks itself, and anything late shows who chased it); and what's next time, with the doc or deck for it.
// Past weeks sit behind the date. What the meetings left on you sits at the top of the page, the same rows as Home's.
// Sample data throughout, drawn from the prototype's own people, figures and agent jobs.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { Av, agentJobs, choose, unchoose, moveOf, useGoals, NeedsYou } from "./goals.jsx";
import { AGENTS, RowHover, SelIn } from "./agents.jsx";
import { showFile } from "./files.jsx";

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
];
const GLIDE = { type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] };
const OPEN = { initial: { height: 0, opacity: 0 }, animate: { height: "auto", opacity: 1 }, exit: { height: 0, opacity: 0 }, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } };
const DOWN = <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 4.5 3 3 3-3" /></svg>;
const TICK = (c = "#fff") => <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 5.2 4.1 7.3 8 2.8" /></svg>;

// what's confirmed, dropped and ticked, kept for the page
const st = { done: {}, conf: {}, drop: {}, deck: {}, subs: new Set() };
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

function Task({ t, i }) {
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
      <AnimatePresence initial={false}>{src && <motion.div key="q" className="mg-q" {...OPEN}><p>“{t.q[0]}”<span>{t.q[1]}, {t.q[2]} min in</span></p></motion.div>}</AnimatePresence>
    </motion.li>);
}
// the meeting's date is its title, and the way back to earlier weeks: a menu that grows out of it
function WeekPick({ m, w, setW }) {
  const [o, setO] = useState(false), ref = useRef(null), [bs, setBs] = useState({ w: 200, h: 36 }), many = m.weeks.length > 1;
  useEffect(() => { if (!o) return; const f = (e) => { if (!ref.current?.contains(e.target)) setO(false); }, k = (e) => e.key === "Escape" && setO(false);
    addEventListener("pointerdown", f); addEventListener("keydown", k); return () => { removeEventListener("pointerdown", f); removeEventListener("keydown", k); }; }, [o]);
  if (!many) return <span className="mg-d">{w.d}</span>;
  return (
    <div className={`mg-dd${o ? " is-open" : ""}`} ref={ref}>
      <button type="button" className="mg-d is-btn" aria-haspopup="listbox" aria-expanded={o} onClick={(e) => { setBs({ w: e.currentTarget.offsetWidth, h: e.currentTarget.offsetHeight }); setO((v) => !v); }}>{w.d}{DOWN}</button>
      <AnimatePresence>{o && <motion.div className="mg-dd-m" role="listbox" style={{ "--bw": `${bs.w}px`, "--bh": `${bs.h}px` }} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16 } }}>
        {m.weeks.map((x) => <button key={x.id} type="button" role="option" aria-selected={x.id === w.id} className={x.id === w.id ? "is-on" : ""} onClick={() => { setW(x.id); setO(false); }}>
          <span className="mg-dd-tick">{x.id === w.id && TICK("currentColor")}</span><span>{x.d}</span></button>)}
      </motion.div>}</AnimatePresence>
    </div>);
}

function Recap({ m, wk }) {
  useSt(); Object.assign(G, useGoals());
  const [wid, setW] = useState(wk || m.weeks[0].id), w = m.weeks.find((x) => x.id === wid) || m.weeks[0];
  const tasks = tasksOf(w);
  const job = m.doc && agentJobs(40).find((x) => x.j.id === m.doc.job), deck = st.deck[m.k];
  // once it's arrived, a row that moves (a step confirmed into Since then) travels instead of arriving again
  const [settled, setSettled] = useState(false);
  useEffect(() => { setSettled(false); const t = setTimeout(() => setSettled(true), 1100); return () => clearTimeout(t); }, [w.id]);
  let n = 0;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.article key={w.id} className={`mg-rc${settled ? " is-settled" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }} transition={{ duration: 0.2 }}>
        {/* the meeting you chose on the left is the title here; under it, which week (the way back to earlier ones), who was there, how long */}
        <header className="mg-rc-h" style={{ "--i": n++ }}>
          <h2 className="mg-name">{m.t}</h2>
          <div className="mg-rc-sub"><WeekPick m={m} w={w} setW={setW} />
            <span className="mg-rc-m"><span className="mg-faces">{w.who.map((p, i) => <span key={p} style={{ zIndex: 10 - i }}><Av k={p} size={20} /></span>)}</span>{w.mins} min</span></div>
        </header>
        <p className="mg-story" style={{ "--i": n++ }}>{w.recap}</p>
        <LayoutGroup id={w.id}>
          <section className="mg-sec">
            <h3 style={{ "--i": n++ }}>Decided</h3>
            <ul className="mg-dec">{w.decided.map((d) => <li key={d} style={{ "--i": n++ }}>{d}</li>)}</ul>
          </section>
          <section className="mg-sec">
            <h3 style={{ "--i": n++ }}>Tasks</h3>
            <ul className="mg-ts">{tasks.map((t) => <Task key={t.k} t={t} i={n++} />)}</ul>
          </section>
        </LayoutGroup>
        {w.latest && <section className="mg-sec">
          <h3 style={{ "--i": n++ }}>Agenda<em>{m.next}</em></h3>
          <ol className="mg-ag">{m.agenda.map(([t, who, s], i) => <li key={t} style={{ "--i": n++ }}><span className="mg-n">{i + 1}</span><span className="mg-ag-t"><b>{t}</b><span>{s}</span></span><Av k={who} size={20} /></li>)}</ol>
          <div className="mg-make" style={{ "--i": n++ }}>
            {m.doc ? (!job ? <button type="button" className="rt-b" onClick={(e) => showFile(m.doc.file, e.currentTarget)}>Open the doc</button>
              : <span className="mg-by"><Av k={m.doc.who} size={20} />{nm(m.doc.who)} is writing the doc</span>)
              : deck ? <span className="mg-by"><Av k={m.maker} size={20} />{nm(m.maker)} is making the deck</span>
              : <motion.button type="button" className="rt-b" whileTap={{ scale: 0.97 }} onClick={() => set({ deck: { ...st.deck, [m.k]: true } })}>Make the deck</motion.button>}
          </div>
        </section>}
      </motion.article>
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

// ---------- the week, as a calendar. Each meeting sits where it falls; one that's happened opens its recap for that day,
// one that hasn't opens the latest recap, whose Agenda is what's coming. Opening grows the meeting out of its own block,
// and Esc (or the week's name above it) folds it back in
const NOW = new Date(2026, 10, 10, 11, 30); // the prototype's today: Tue, Nov 10, late morning
const WEEKS = [new Date(2026, 10, 2), new Date(2026, 10, 9), new Date(2026, 10, 16)]; // Mondays: last week, this week, next week
const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const H0 = 9, H1 = 15, PX = 60; // 9 AM to 3 PM, an hour a row
const addD = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const md = (d) => `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`;
const hm = (min) => { const h = Math.floor(min / 60), m = min % 60, h12 = ((h + 11) % 12) + 1; return `${h12}${m ? ":" + String(m).padStart(2, "0") : ""}`; };
const ANCHOR2 = new Date(2026, 10, 3); // an every-other-week meeting's first date
function eventsOf(mon) {
  return MEETINGS.flatMap((m) => { const d = addD(mon, m.dow - 1);
    if (m.every === 2 && Math.round((d - ANCHOR2) / 864e5 / 7) % 2) return [];
    const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), Math.floor(m.at / 60), m.at % 60);
    const rec = m.weeks.find((w) => w.d === `${DAY[d.getDay()]}, ${md(d)}`);
    return [{ key: `${m.k}-${d.getDate()}`, m, d, past: at < NOW, wk: rec ? rec.id : null }]; });
}
function Calendar({ onOpenMeeting }) {
  const [wi, setWi] = useState(1), [open, setOpen] = useState(null), mon = WEEKS[wi], evs = eventsOf(mon);
  // open, it folds back on Esc or a click anywhere outside the card
  const cardR = useRef(null);
  useEffect(() => { if (!open) return; const k = (e) => { if (e.key === "Escape") setOpen(null); }, d = (e) => { if (cardR.current && !cardR.current.contains(e.target) && !e.target.closest(".mg-hello, .side")) setOpen(null); };
    addEventListener("keydown", k); document.addEventListener("pointerdown", d, true); return () => { removeEventListener("keydown", k); document.removeEventListener("pointerdown", d, true); }; }, [open]);
  const label = `${md(mon)} – ${addD(mon, 4).getDate()}`;
  // the week lives in a card like the page's charts: the same well, paper and head. A meeting opens inside it
  return (
    <section className="mg-cal card" ref={cardR}><div className="surface">
      <header className="card-head mg-cal-h">
        {open ? <button type="button" className="fm-back mg-cal-back" onClick={() => setOpen(null)}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 3.5 5 7l3.5 3.5" /></svg>{label}</button>
          : <><h2 className="mg-cal-w">{label}</h2>
            <span className="mg-cal-nav">
              <button type="button" className="ibtn" aria-label="Previous week" disabled={wi === 0} onClick={() => setWi(wi - 1)}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 3.5 5 7l3.5 3.5" /></svg></button>
              <button type="button" className="ibtn" aria-label="Next week" disabled={wi === WEEKS.length - 1} onClick={() => setWi(wi + 1)}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 3.5 9 7l-3.5 3.5" /></svg></button></span></>}
      </header>
      <LayoutGroup id="mg-cal">
        <AnimatePresence mode="popLayout" initial={false}>
          {open ? (
            <motion.div key={"o" + open.key} layoutId={"ev-" + open.key} className="mg-cal-open" style={{ borderRadius: 8 }}
              initial={{ backgroundColor: "rgba(9,53,85,0.06)" }} animate={{ backgroundColor: "rgba(9,53,85,0)" }} exit={{ backgroundColor: "rgba(9,53,85,0.06)" }}
              transition={{ layout: { duration: 0.5, ease: [0.32, 0.72, 0, 1] }, backgroundColor: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.22, duration: 0.3 } }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                <Recap m={open.m} wk={open.wk} /></motion.div>
            </motion.div>
          ) : (
            <motion.div key={"g" + wi} className="mg-cal-g" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16 } }} transition={{ duration: 0.24 }}>
              <div className="mg-cal-t">{Array.from({ length: H1 - H0 + 1 }, (_, i) => <span key={i} style={{ top: i * PX }}>{hm((H0 + i) * 60)} {H0 + i < 12 ? "AM" : "PM"}</span>)}</div>
              {[0, 1, 2, 3, 4].map((i) => { const d = addD(mon, i), today = d.toDateString() === NOW.toDateString();
                return (
                  <div key={i} className={`mg-cal-d${today ? " is-today" : ""}`}>
                    <div className="mg-cal-dh"><span>{DAY[d.getDay()].slice(0, 3)}</span><b>{d.getDate()}</b></div>
                    <div className="mg-cal-c" style={{ height: (H1 - H0) * PX }}>
                      {evs.filter((e) => e.d.getDate() === d.getDate()).map((e) => (
                        <motion.button key={e.key} layoutId={"ev-" + e.key} type="button" className={`mg-cal-ev${e.past ? " is-past" : ""}${e.m.dur < 40 ? " is-short" : ""}`}
                          style={{ top: ((e.m.at - H0 * 60) / 60) * PX + 1, height: Math.max(26, (e.m.dur / 60) * PX - 2), borderRadius: 8 }}
                          transition={{ layout: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}
                          onClick={() => { setOpen({ key: e.key, m: e.m, wk: e.wk }); onOpenMeeting(e.m.k); }}>
                          <b>{e.m.t}</b><span>{hm(e.m.at).replace(/^(\d+)$/, "$1:00")}</span>
                        </motion.button>))}
                    </div>
                  </div>); })}
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>
    </div></section>);
}

// List or Calendar: the same toggle as the charts', its pill sliding to the one you chose
function ViewSeg({ v, setV }) {
  const ref = useRef(null), [at, setAt] = useState(null);
  useLayoutEffect(() => { const el = ref.current && ref.current.querySelector('[aria-selected="true"]'); if (el) setAt({ left: el.offsetLeft, width: el.offsetWidth }); }, [v]);
  return (
    <div ref={ref} className="seg seg-sm mg-view" role="tablist" aria-label="View">
      {at && <motion.span className="seg-pill is-free" initial={false} animate={at} transition={{ type: "spring", visualDuration: 0.38, bounce: 0.16 }} />}
      {[["list", "List"], ["cal", "Calendar"]].map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={v === k} className={v === k ? "on" : ""} onClick={() => setV(k)}><span className="seg-t">{l}</span></button>)}
    </div>);
}

// what the meetings left on you, at the top the way Home has it: the same rows, only the ones a meeting raised
const MINE = [...new Set(Object.values(LINK))];
const FROM = Object.fromEntries(MEETINGS.flatMap((m) => [...(m.weeks[0].confirm || []), ...m.weeks[0].tasks].filter((t) => LINK[t.k]).map((t) => [LINK[t.k], m.t])));
export function MeetingsPage() {
  const [k, setK] = useState(MEETINGS[0].k), m = MEETINGS.find((x) => x.k === k), [view, setView] = useState("list");
  const headRef = useRef(null);
  useLayoutEffect(() => { const a = headRef.current, c = a && a.closest(".content"), s = document.documentElement.style; if (!a || !c) return;
    const go = () => s.setProperty("--band-h", `${Math.round(a.getBoundingClientRect().bottom - c.getBoundingClientRect().top + 28)}px`);
    const ro = new ResizeObserver(go); ro.observe(a); go(); return () => ro.disconnect(); }, []);
  return (
    <div className="ch dhp mg">
      <header ref={headRef} className="dhp-head"><div className="hello mg-hello"><h1>Meetings</h1><ViewSeg v={view} setV={setView} /></div><p className="dhp-lead">What each meeting was about, what’s happened since, and what’s next.</p>
        <div className="nd-wrap mg-nd"><NeedsYou bare only={MINE} from={FROM} /></div></header>
      {view === "cal" ? <Calendar onOpenMeeting={setK} /> : <div className="mg-grid">
        <List k={k} setK={setK} />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={k} className="mg-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }} transition={{ duration: 0.2 }}>
            <Recap m={m} /></motion.div>
        </AnimatePresence>
      </div>}
    </div>);
}
