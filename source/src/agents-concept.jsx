// North · Agents — "the tracker" concept.
// Words first, motion second. Each project reads like an order tracker: a plain list of steps, who's doing each one,
// what's done, what's happening this second, and what's next. Collaboration is in the sentences ("Riley checked Orin's
// numbers"), not in lines to decode. Everything is changeable where you see it: comment on any step, rewrite or remove
// a planned step, hand it to a different agent, or add one. Motion only reinforces what the words say: the live step
// types out what it's doing and fills as it goes, finished steps check off, the next step steps up.
import { RoutineList } from "./routines.jsx";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { DialRoot, useDialKit } from "dialkit";
import { NorthLogo } from "./marks.jsx";
import { Orb } from "./agents.jsx";
import { Puppet } from "./puppet.jsx";
import { ChatVisual, DocCard, TrendPlot } from "./chat.jsx";
import { LANES as HLANES, status as hStatus, OWNERS, DESC } from "./health.jsx";
import { getWho, useWho, seatOf, SEATS } from "./seat.js";

// ---------------------------------------------------------------- dials
const SPEC = {
  look: ["Stage look", { type: "select", options: [{ value: "dark", label: "Dark glass" }, { value: "clean", label: "Clean (paper)" }], default: "dark" }],
  stepLen: ["Simulation: seconds per step", [14, 4, 40, 1]],
  typeMs: ["Live line: ms per character", [24, 5, 80, 1]],
  check: ["Step checks off", { type: "spring", visualDuration: 0.45, bounce: 0.35 }],
  zoom: ["Going in / out of an agent", { type: "easing", duration: 0.55, ease: [0.32, 0.72, 0, 1] }],
  reflow: ["Steps move up", { type: "spring", visualDuration: 0.5, bounce: 0.08 }],
  open: ["Job view opens", { type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }],
  stagger: ["Job view: stagger between parts (s)", [0.05, 0, 0.2, 0.005]],
  crew: ["Crew on the board", { type: "select", options: [{ value: "auto", label: "As they are" }, { value: "work", label: "Everyone working" }, { value: "idle", label: "Everyone idle" }], default: "auto" }],
};
const DIALS = Object.fromEntries(Object.values(SPEC).map(([l, v]) => [l, v]));
const fromDials = (v) => Object.fromEntries(Object.entries(SPEC).map(([k, [l]]) => [k, v[l]]));
// the dials as they ship, for a job opened outside the Agents page (inside it, the live dials are used)
const D0 = fromDials(Object.fromEntries(Object.values(SPEC).map(([l, v]) => [l, Array.isArray(v) ? v[0] : v.type === "select" ? v.default : v])));

const AG = {
  orin: { n: "Orin", role: "GTM", rules: 3, ok: "9 of 11 approved as-is" },
  riley: { n: "Riley", role: "Revenue OS", rules: 5, ok: "14 of 15 approved as-is" },
  calvin: { n: "Calvin", role: "Customer value", rules: 2, ok: "6 of 8 approved as-is" },
  marco: { n: "Marco", role: "Marketing OS", rules: 1, ok: "3 of 3 approved as-is" },
  fia: { n: "Fia", role: "Knowledge base", rules: 0, ok: "2 of 2 approved as-is" },
  north: { n: "North", role: "" }, // North answers anything not addressed to an agent; it isn't one of the crew (not in IDS)
};
const IDS = ["orin", "riley", "calvin", "marco", "fia"];

// projects: plain steps, each with who does it. done steps carry what they produced (said as a sentence)
const St = (l, ag, acts, o = {}) => ({ l, ag, acts, ...o });
const PROJECTS = [
  { id: "sync", t: "Write the Monday sync doc", owner: "orin", due: "Due Monday", cur: 4, steps: [
    St("Send Orin the at-risk accounts", "calvin", [], { did: "Calvin sent Orin the $1.98M at risk", ago: "18 min ago" }),
    St("Pull October bookings", "orin", [], { did: "Orin pulled October bookings", ago: "14 min ago" }),
    St("Size the three levers", "orin", [], { did: "Orin sized the three levers", ago: "9 min ago" }),
    St("Check Orin's numbers", "riley", [], { did: "Riley checked Orin's numbers against the $40.03M plan", ago: "4 min ago" }),
    St("Write the summary", "orin", ["Drafting the opening", "Adding the three levers", "Adding Calvin's at-risk accounts", "Folding in Riley's check"], { past: "Orin wrote the summary" }),
    St("Send it to you to review", "orin", ["Sending it to you"], { past: "Orin sent it to you to review" }),
  ] },
  { id: "forecast", t: "Forecast the year with all three levers", owner: "riley", due: "Due Friday", cur: 1, steps: [
    St("Load the $40.03M plan", "riley", [], { did: "Riley loaded the $40.03M plan", ago: "6 min ago" }),
    St("Run the three levers", "riley", ["Running Outbound back to pace", "Running expansion deals", "Running new logos", "Combining the three"], { past: "Riley ran the three levers" }),
    St("Stress-test the $1.98M at risk", "riley", ["Reading at-risk ARR in Account health", "Taking a tenth of it off", "Comparing to the plan"], { past: "Riley stress-tested the $1.98M at risk" }),
    St("Send it to you to review", "riley", ["Sending it to you"], { past: "Riley sent it to you to review" }),
  ] },
  { id: "stall", t: "Find where new accounts stall", owner: "calvin", due: "Due Nov 10", cur: 0, steps: [
    St("Pull time to first contract", "calvin", ["Reading onboarding in Product usage", "Reading new accounts in Account health", "Lining up time to first contract"], { past: "Calvin pulled time to first contract: 30.0 days" }),
    St("Find where accounts stall", "calvin", ["Grouping accounts by onboarding step", "Comparing stall rates by step", "Checking the first-integration step"], { past: "Calvin found where accounts stall" }),
    St("Draft fixes with Dustin", "calvin", ["Drafting fix 1", "Drafting fix 2", "Drafting fix 3"], { past: "Calvin drafted three fixes with Dustin" }),
    St("Send it to you to review", "calvin", ["Sending it to you"], { past: "Calvin sent it to you to review" }),
  ] },
];
const TODAY = { jobs: 6, steps: 23, made: 4 }; // example figures for the day; they tick up as steps finish
// Riley's Outbound review, the job opened in the details view. Copy, numbers and series are the prototype's.
const OUTBOUND_CARD = {
  kind: "trend", title: "Booked ARR · Outbound", big: "$130.2K",
  mark: { at: 13, label: "Oct 14 · 2 SDRs moved" },
  series: [22, 25, 21, 28, 24, 27, 30, 26, 29, 31, 28, 33, 30, 27, 14, 11, 12, 9, 13, 10, 8, 11, 9, 12, 10, 8, 9],
};
const OUTBOUND = {
  id: "riley-out", agent: "riley", asked: "Asked by you · Today", ago: "12 min ago", status: "Needs your approval",
  title: "Outbound is $443.6K behind pace. Moving Sam back closes most of it.",
  answer: "Outbound has booked $130.2K against a $573.8K pace, 23% of it. Two things did it: demos held dropped after Oct 14, when two SDRs moved to inbound coverage, and the deals that did close came in 40% smaller than September.",
  rec: "Move Sam back to Outbound for the last two weeks of the month. He booked $7.5K a day there before Oct 14, and the demo list he left still has 14 open prospects.",
  stats: [["Booked before Oct 14", "$98.1K", "$7.5K a day"], ["Booked since", "$32.1K", "$2.5K a day"], ["Demos held since", "11", "down from 26"], ["Needed per day to hit pace", "$110.9K", "4 days left"]],
  work: [
    { s: "Read HubSpot · Outbound lane", f: "27 days of October bookings. $130.2K booked.", src: "HubSpot", n: 7 },
    { s: "Compared October to pace", f: "Pace is $573.8K, the straight line to the $664.5K October target. Outbound is at 23%.", src: "Plan", n: 5 },
    { s: "Found what moved it", f: "Demos held fell from 26 to 11 after Oct 14. Deals that closed came in 40% smaller than September.", src: "HubSpot", n: 9 },
  ],
  rulesUsed: ["Pace is the straight line to the month's target", "Compare with last month before calling something a drop"],
  people: [{ who: "You", ini: "BE", c: "#7395b3", role: "Asked for this" }, { who: "Caleb", ini: "CA", c: "#6d4fc2", role: "Tagged · can view" }],
  thread: [{ who: "You", ini: "BE", c: "#7395b3", at: "@Caleb", msg: "hey, check this out", when: "10 min ago" }],
  act: "Approve the move",
};
const NEEDS = [
  { id: "orin-prop", agent: "orin", propose: "Rank Sam’s demo list", title: "Start on Sam’s demo list now?", rec: "Outbound is the biggest gap on the board and has the least work on it. Sam’s demo list is queued next. Want me to start on it now?", act: "Start it", alt: "Not now" },
  OUTBOUND,
  // Sam's own calls, sized to his job. Every fact is the prototype's: the lost-demo review, the demo list he left, New ARR's gap
  { id: "sam-follow", agent: "orin", for: "sam", title: "11 lost demos never got a follow-up. Send the drafts?", rec: "Of the last 20 lost demos, 14 were booked by outbound after Oct 14, and 11 had no follow-up within two days. I drafted a follow-up for each of the 11. They go out from you once you say so.", act: "Send them", alt: "Not now" },
  { id: "sam-list", agent: "orin", for: "sam", propose: "Rank Sam’s demo list", title: "Start on your demo list now?", rec: "The demo list you left on Outbound still has 14 open prospects, and ranking it is queued next. Want me to start on it now?", act: "Start it", alt: "Not now" },
  { id: "sam-arr", agent: "riley", for: "sam", start: ["Rank late-stage new-logo deals by close date", "riley", 2, "New ARR", ["Pulling late-stage new-logo deals from HubSpot.", "Ordering them by expected close date."]], title: "Nothing’s working on New ARR. Rank your late-stage deals?", rec: "New ARR is $140K behind pace, the biggest gap in New Business, and none of our work is on it. I can rank your late-stage new-logo deals by close date, so you know which to push first.", act: "Start it", alt: "Not now" },
  { id: "calvin-smb", agent: "calvin", ago: "40 min ago", title: "4 SMB renewals due by Dec 31 have gone quiet for 60 days.", rec: "11 of the 29 renewals in Jordan’s book have been touched. I drafted QBR invites for the four quiet accounts. They go out from Jordan once you approve.", owner: "Jordan", act: "Send the invites" },
];

const DONE = {
  "orin-prop": "On it. I’m ranking Sam’s demo list now and I’ll bring it back here when it’s ready.",
  "riley-out": "Done. Sam’s back on Outbound for the last two weeks of the month. I’ll tell you how bookings move.",
  "calvin-smb": "Sent. The QBR invites for the four quiet renewals go out from Jordan. I’ll tell you who replies.",
  "sam-follow": "Sent. The 11 follow-ups went out from you. I’ll tell you who replies.",
  "sam-list": "On it. I’m ranking your demo list now and I’ll bring it back here when it’s ready.",
  "sam-arr": "Started. I’m ranking your late-stage new-logo deals by close date. The list lands here when it’s done.",
};
// ---------------------------------------------------------------- small parts
const ARW = <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h8M7.8 3.8 11 7l-3.2 3.2" /></svg>;
const BACK = <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 7H3M6.2 3.8 3 7l3.2 3.2" /></svg>;
const CHK = <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.2 5.2 4.2 7.1 7.9 3" /></svg>;
const Ava = ({ p, size = 20 }) => <span className="ava" style={{ width: size, height: size, background: p.c }}>{p.ini}</span>;
function Num({ v }) {
  const [d, setD] = useState(v), cur = useRef(v);
  useEffect(() => { const from = cur.current, t0 = performance.now(); let raf; const step = (t) => { const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); cur.current = from + (v - from) * e; setD(cur.current); if (k < 1) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf); }, [v]);
  return <>{Math.round(d).toLocaleString("en-US")}</>;
}
// types a line out, a character at a time (the agent saying what it's doing right now)
// presenting: the floor holds still, text lands whole, and the board's flow slows to a drift
const CalmCtx = React.createContext(false);
function Typed({ text, ms }) {
  const calm = React.useContext(CalmCtx);
  const [n, setN] = useState(0);
  useEffect(() => { if (calm) { setN(text.length); return; } setN(0); const t = setInterval(() => setN((k) => (k >= text.length ? (clearInterval(t), k) : k + 1)), ms); return () => clearInterval(t); }, [text, ms]);
  return <span className="ty">{text.slice(0, n)}<i className="ty-c" /></span>;
}
// ---------------------------------------------------------------- the simulation
const PACE = { sync: 1, forecast: 0.8, stall: 0.62 };
// the simulation waits while something on screen is moving (chat, sidebar) or the page can't be seen: a re-render of the whole
// page mid-animation is what made transitions stutter. It ticks a few times a second, not ten.
const holdStill = () => { const r = document.documentElement.classList; return document.hidden || r.contains("is-moving") || r.contains("chat-full"); };
function useSim(D, calm) {
  const calmR = useRef(calm); calmR.current = calm;
  const [ps, setPs] = useState(() => NA.ps || PROJECTS.map((p) => ({ ...p, steps: p.steps.map((s) => ({ ...s })), prog: { sync: 0.55, forecast: 0.3, stall: 0.7 }[p.id], done: false, cm: {} })));
  useEffect(() => { NA.ps = ps; }, [ps]);
  const [tally, setTally] = useState(TODAY);
  const [feed, setFeed] = useState({ k: 0, text: "Riley checked Orin's numbers against the $40.03M plan", ag: "riley" });
  useEffect(() => {
    const t = setInterval(() => { if (calmR.current || holdStill()) return;
      setPs((P) => P.map((p) => {
        if (p.done) { // a finished project starts over after a while, so there's always something being made
          if (!p.doneAt) return { ...p, doneAt: Date.now() };
          if (Date.now() - p.doneAt < 25000) return p;
          const o = PROJECTS.find((x) => x.id === p.id); return { ...o, steps: o.steps.map((s) => ({ ...s })), prog: 0.05, done: false, cm: {} };
        }
        let prog = p.prog + (0.4 / D.stepLen) * PACE[p.id];
        if (prog < 1) return { ...p, prog };
        // a step finishes: it checks off with what it did, the next one steps up
        const s = p.steps[p.cur], steps = [...p.steps];
        steps[p.cur] = { ...s, did: s.did || s.past || `${AG[s.ag].n} did: ${s.l.charAt(0).toLowerCase() + s.l.slice(1)}`, ago: "Just now" };
        setTimeout(() => { setFeed((f) => ({ k: f.k + 1, text: steps[p.cur].did, ag: s.ag })); setTally((T) => ({ ...T, steps: T.steps + 1, jobs: p.cur + 1 >= steps.length ? T.jobs + 1 : T.jobs, made: p.cur + 1 >= steps.length ? T.made + 1 : T.made })); }, 0);
        if (p.cur + 1 >= steps.length) return { ...p, steps, done: true, prog: 1 };
        return { ...p, steps, cur: p.cur + 1, prog: 0 };
      }));
    }, 400);
    return () => clearInterval(t);
  }, [D.stepLen]);
  return [ps, setPs, tally, feed];
}

// ---------------------------------------------------------------- one project, read like an order tracker
function Step({ p, s, i, D, upd, cmOpen, setCmOpen }) {
  const state = p.done || i < p.cur ? "done" : i === p.cur ? "live" : "next";
  const [edit, setEdit] = useState(false), [val, setVal] = useState(s.l), [menu, setMenu] = useState(false), [txt, setTxt] = useState("");
  const a = AG[s.ag], cms = p.cm[i] || [];
  const act = state === "live" && s.acts.length ? s.acts[Math.min(s.acts.length - 1, Math.floor(p.prog * s.acts.length))] : null;
  const save = () => { const v = val.trim(); upd((q) => { const steps = [...q.steps]; if (v) steps[i] = { ...steps[i], l: v, acts: [`Working on: ${v.charAt(0).toLowerCase() + v.slice(1)}`], changed: true }; return { ...q, steps }; }); setEdit(false); };
  const send = () => {
    const v = txt.trim(); if (!v) return;
    upd((q) => ({ ...q, cm: { ...q.cm, [i]: [...(q.cm[i] || []), { text: v }] } })); setTxt(""); setCmOpen(null);
    // the agent answers in a beat; for a finished step it puts a redo into the plan right after what it's doing now
    setTimeout(() => upd((q) => {
      const list = [...(q.cm[i] || [])], last = list.length - 1; if (last < 0) return q;
      list[last] = { ...list[last], reply: state === "done" ? "Got it. I'll redo this with your note, right after the current step." : "Got it. I'll work that in." };
      const steps = [...q.steps];
      if (state === "done" && !q.done) steps.splice(q.cur + 1, 0, St(`Redo with your note: ${(s.did || s.l).replace(/^\w+ /, "")}`, s.ag, ["Reworking it with your note"], { changed: true, past: `${AG[s.ag].n} redid it with your note` }));
      return { ...q, steps, cm: { ...q.cm, [i]: list } };
    }), 1300);
  };
  return (
    <motion.li layout="position" transition={D.reflow} className={`sp is-${state}${s.changed ? " is-changed" : ""}`}>
      <div className="sp-row">
        <span className="sp-ic">
          {state === "done" ? <motion.span className="sp-chk" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={D.check}>{CHK}</motion.span>
            : state === "live" ? <Orb id={s.ag} size={18} live /> : <span className="sp-ring" />}
        </span>
        <div className="sp-main">
          {edit ? <input className="sp-in" autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={save} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEdit(false); }} />
            : state === "done" ? <span className="sp-t">{s.did || s.l}</span>
            : <span className="sp-t">{s.l}</span>}
          {state === "live" && act && <span className="sp-live"><Typed key={act} text={`${act}…`} ms={D.typeMs} /></span>}
          {state === "live" && <span className="sp-bar"><motion.i animate={{ width: `${Math.round(p.prog * 100)}%` }} transition={{ duration: 0.12, ease: "linear" }} /></span>}
        </div>
        <div className="sp-side">
          {state === "next" ? (
            <span className="sp-who-wrap">
              <button className="sp-who" onClick={() => setMenu((m) => !m)} title="Hand this step to another agent"><Orb id={s.ag} size={16} />{a.n}<svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><path d="M1.5 3 4 5.5 6.5 3" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg></button>

            </span>
          ) : <span className="sp-meta">{state === "done" ? <>{s.ago}</> : <><b>{Math.round(p.prog * 100)}%</b> {a.n} is on it</>}</span>}
          <AnimatePresence>{menu && (
            <motion.span className="sp-menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
              {IDS.map((id) => <button key={id} className={id === s.ag ? "is-on" : ""} onClick={() => { upd((q) => { const steps = [...q.steps]; steps[i] = { ...steps[i], ag: id, changed: id !== s.ag || steps[i].changed }; return { ...q, steps }; }); setMenu(false); }}><Orb id={id} size={16} />{AG[id].n}<em>{AG[id].role}</em></button>)}
            </motion.span>)}</AnimatePresence>
          <span className="sp-acts">
            <button onClick={() => setCmOpen(cmOpen === i ? null : i)}>Comment</button>
            {state === "next" && <><button onClick={() => { setEdit(true); setVal(s.l); }}>Change</button><button onClick={() => setMenu((m) => !m)}>Hand to…</button><button onClick={() => upd((q) => ({ ...q, steps: q.steps.filter((_, j) => j !== i) }))} aria-label="Remove step">Remove</button></>}
          </span>
        </div>
      </div>
      {cms.map((c, k) => (
        <div key={k} className="sp-cm">
          <div className="sp-cm-m"><Ava p={{ ini: "BE", c: "#7395b3" }} size={18} /><span><b>You</b> {c.text}</span></div>
          <AnimatePresence>{c.reply ? <motion.div className="sp-cm-m is-r" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}><Orb id={s.ag} size={18} /><span><b>{a.n}</b> {c.reply}</span></motion.div>
            : <div className="sp-cm-m is-r is-wait"><Orb id={s.ag} size={18} live /><span>{a.n} is reading…</span></div>}</AnimatePresence>
        </div>
      ))}
      <AnimatePresence>{cmOpen === i && (
        <motion.div className="sp-cmp" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
          <input autoFocus value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={state === "done" ? `What should ${a.n} change about this?` : `Tell ${a.n} something about this step…`} onKeyDown={(e) => { if (e.key === "Enter") send(); if (e.key === "Escape") setCmOpen(null); }} />
          <button className="btn-pri" disabled={!txt.trim()} onClick={send}>Send to {a.n}</button>
        </motion.div>
      )}</AnimatePresence>
    </motion.li>
  );
}
function Project({ p, D, setPs, big }) {
  const upd = (fn) => setPs((P) => P.map((q) => (q.id === p.id ? fn(q) : q)));
  const [cmOpen, setCmOpen] = useState(null), [adding, setAdding] = useState(false), [nv, setNv] = useState("");
  const helpers = [...new Set(p.steps.map((s) => s.ag))].filter((x) => x !== p.owner);
  const doneN = p.done ? p.steps.length : p.cur;
  const add = () => { const v = nv.trim(); if (v) upd((q) => { const steps = [...q.steps]; steps.splice(steps.length - 1, 0, St(v, q.owner, [`Working on: ${v.charAt(0).toLowerCase() + v.slice(1)}`], { changed: true })); return { ...q, steps }; }); setNv(""); setAdding(false); };
  return (
    <motion.article layout transition={D.reflow} className={`pj${big ? " is-big" : ""}${p.done ? " is-done" : ""}`}>
      <header className="pj-h">
        <div className="pj-t">
          <h4>{p.t}</h4>
          <span className="pj-sub"><span className="pj-orbs">{[p.owner, ...helpers].map((id) => <Orb key={id} id={id} size={16} live={!p.done} />)}</span>
            {AG[p.owner].n}'s project{helpers.length ? <> · with {helpers.map((h) => AG[h].n).join(" and ")}</> : null} · {p.due}</span>
        </div>
        <div className="pj-prog">
          <span className="pj-n">{p.done ? "Ready for you" : <><b>{doneN}</b> of {p.steps.length} done</>}</span>
          <span className="pj-segs">{p.steps.map((s, i) => <i key={i}><motion.b initial={false} animate={{ width: i < doneN ? "100%" : i === p.cur && !p.done ? `${p.prog * 100}%` : "0%" }} transition={{ duration: 0.15, ease: "linear" }} /></i>)}</span>
        </div>
      </header>
      <LayoutGroup id={p.id}>
        <ol className="sps">{p.steps.map((s, i) => <Step key={s.l + i} p={p} s={s} i={i} D={D} upd={upd} cmOpen={cmOpen} setCmOpen={setCmOpen} />)}</ol>
      </LayoutGroup>
      {!p.done && (adding
        ? <div className="pj-add-in"><input autoFocus value={nv} onChange={(e) => setNv(e.target.value)} placeholder={`What else should ${AG[p.owner].n} do before it comes to you?`} onBlur={add} onKeyDown={(e) => { if (e.key === "Enter") add(); if (e.key === "Escape") setAdding(false); }} /></div>
        : <button className="pj-add" onClick={() => setAdding(true)}>+ Add a step</button>)}
    </motion.article>
  );
}

// ---------------------------------------------------------------- the world: data in → agents → what they're making
// Three columns, labelled once. Raw data drifts in as loose dots, goes through the agent, and comes out as even pieces
// that land in the thing it's making, which visibly grows. One agent passing work to another is one more stream.
const SOURCES = [
  { id: "hubspot", n: "HubSpot", to: ["orin", "calvin", "marco"] },
  { id: "plan", n: "Plan", to: ["orin", "riley"] },
  { id: "health", n: "Account health", to: ["riley", "calvin"] },
  { id: "usage", n: "Product usage", to: ["calvin"] },
  { id: "kb", n: "Knowledge base", to: ["fia"] },
];
// what each agent is thinking, revealed as its project moves along (at = how far along, 0–1). Every number is the prototype's.
const THINK = {
  sync: [[0.05, "Calvin sent the $1.98M at risk. I'll need that for the risk line."], [0.2, "October bookings are in. Plan is $40.03M; at October's rate we land at $38.94M. The gap is $1.09M."],
    [0.4, "Outbound is the lever we control. Back to pace it's worth about $680K by Dec 31."], [0.5, "That leaves about $410K. Expansion and new logos have to close it."],
    [0.62, "Riley checked it: all three land at $40.08M, $50K over plan. I'll say plainly there's no margin."], [0.7, "If a tenth of the $1.98M at risk slips, that's about $200K, roughly the expansion lever. That goes in."],
    [0.8, "Leading with the gap, then the three levers, then the risk. One page."], [0.95, "Reads right. Sending it to you."]],
  forecast: [[0.05, "Plan is $40.03M for the year. Starting from October's rate: $38.94M."], [0.3, "Running each lever on its own first, so you can see what each one is worth."],
    [0.45, "Outbound back to pace adds about $680K."], [0.55, "Expansion and new logos together add about $460K."], [0.65, "All three: $40.08M. Only $50K over plan. Testing the downside next."],
    [0.8, "Taking a tenth of the $1.98M at risk off puts us about $150K under plan."], [0.95, "So the forecast holds only if renewals hold. Saying that up top."]],
  stall: [[0.05, "Time to first contract is 30.0 days across new accounts."], [0.3, "Grouping accounts by onboarding step to see where the days go."],
    [0.55, "The first-integration step is where accounts wait longest."], [0.75, "Drafting fixes for that step with Dustin."], [0.95, "Three fixes drafted. Sending them to you."]],
};
const thoughtsOf = (p) => THINK[p.id].filter(([at]) => at <= (p.done ? 1 : Math.min(1, (p.cur + p.prog) / p.steps.length)));
const MAKES = { orin: "sync", riley: "forecast", calvin: "stall" };
const OUT = { sync: "Monday sync summary", forecast: "Year-end forecast", stall: "Where accounts stall" };
const COLLAB = [{ from: ["out", "riley"], to: "orin", l: "Riley's check" }, { from: ["ag", "calvin"], to: "orin", l: "At-risk accounts" }];
// how far along the thing itself is (0–1), from the project's steps
const madeOf = (p) => (p.done ? 1 : Math.min(1, (p.cur + p.prog) / p.steps.length));

function World({ D, ps, onFocus, dark }) {
  const box = useRef(null), cvs = useRef(null), el = useRef({});
  const [hover, setHover] = useState(null);
  const live = useRef({}); live.current = { ps, hover, dark };
  useEffect(() => {
    const c = cvs.current, g = c.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
    let raf, last = performance.now(), geo = null;
    const parts = [], acc = {};
    const measure = () => {
      if (!box.current) return;
      const B = box.current.getBoundingClientRect(), at = (k, side) => { const e = el.current[k]; if (!e) return null; const r = e.getBoundingClientRect(); return { x: (side === "r" ? r.right : side === "l" ? r.left : r.left + r.width / 2) - B.left, y: r.top + r.height / 2 - B.top, top: r.top - B.top, bot: r.bottom - B.top }; };
      geo = { W: B.width, H: B.height, src: {}, orb: {}, blk: {}, out: {} };
      IDS.forEach((id) => { SOURCES.filter((s) => s.to.includes(id)).forEach((s) => (geo.src[id + s.id] = at(`s-${id}-${s.id}`, "r"))); geo.orb[id] = at("a-" + id, "l"); geo.blk[id] = at("b-" + id, "r"); geo.out[id] = at("o-" + id, "l"); });
      c.width = B.width * dpr; c.height = B.height * dpr; c.style.width = B.width + "px"; c.style.height = B.height + "px";
    };
    const ro = new ResizeObserver(measure); ro.observe(box.current); setTimeout(measure, 50);
    const lerp = (a, b, t) => { const e = t * t * (3 - 2 * t); return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * e }; };
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000) * (live.current.calm ? 0.35 : 1); last = now;
      const { ps, hover, dark } = live.current; if (!geo || !geo.orb.orin) { raf = requestAnimationFrame(loop); return; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, geo.W, geo.H);
      const ink = dark ? "233,240,246" : "9,53,85", busy = (id) => { const p = ps.find((q) => q.id === MAKES[id]); return p && !p.done; };
      const dim = (id) => (hover && hover !== id ? 0.15 : 1);
      const routes = [];
      IDS.forEach((id) => {
        SOURCES.filter((s) => s.to.includes(id)).forEach((s) => { const a = geo.src[id + s.id]; if (a) routes.push({ k: "in" + id + s.id, a, b: { x: geo.orb[id].x - 6, y: geo.orb[id].y }, ag: id, kind: "in" }); });
        routes.push({ k: "out" + id, a: { x: geo.blk[id].x + 8, y: geo.blk[id].y }, b: { x: geo.out[id].x - 4, y: geo.out[id].y }, ag: id, kind: "out" });
      });
      // handoffs run up a channel just left of what they're making: straight, one direction, labelled at the start
      COLLAB.forEach((cb, i) => { const fr = cb.from[1], x = geo.out.orin.x - 16 - i * 9; routes.push({ k: "co" + i, a: { x, y: geo.out[fr].y }, b: { x, y: geo.out.orin.bot - 4 }, ag: cb.to, also: fr, kind: "co", i }); });
      for (const r of routes) {
        const k = Math.max(dim(r.ag), r.also ? dim(r.also) : 0);
        g.strokeStyle = r.kind === "co" ? `rgba(255,114,92,${0.45 * k})` : `rgba(${ink},${0.11 * k})`; g.lineWidth = 1; g.setLineDash(r.kind === "co" ? [2, 3] : []);
        g.beginPath(); for (let j = 0; j <= 24; j++) { const q = lerp(r.a, r.b, j / 24); j ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); } g.stroke(); g.setLineDash([]);
        if (r.kind === "co") { g.fillStyle = `rgba(255,114,92,${0.9 * k})`; g.beginPath(); g.moveTo(r.b.x - 3.5, r.b.y + 4); g.lineTo(r.b.x + 3.5, r.b.y + 4); g.lineTo(r.b.x, r.b.y - 1); g.fill(); }
        acc[r.k] = (acc[r.k] || 0) + dt * (r.kind === "in" ? 1.8 : r.kind === "out" ? 2.6 : 0.8) * (busy(r.ag) || r.kind === "co" ? 1 : 0.08);
        while (acc[r.k] >= 1) { acc[r.k]--; parts.push({ r, t: 0, o: (Math.random() - 0.5) * 2, z: 0.9 + Math.random() * 1.3 }); }
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const q = parts[i], r = q.r; q.t += dt / (r.kind === "in" ? 2.2 : r.kind === "out" ? 1.5 : 2.6); if (q.t >= 1) { parts.splice(i, 1); continue; }
        const P = lerp(r.a, r.b, q.t), sc = r.kind === "in" ? 7 * (1 - q.t) : 0; // raw data is loose and settles as it reaches the agent; what comes out is even
        const al = Math.min(1, q.t * 5) * Math.min(1, (1 - q.t) * 6) * Math.max(dim(r.ag), r.also ? dim(r.also) : 0);
        if (r.kind === "co") { g.fillStyle = `rgba(255,114,92,${al})`; g.fillRect(P.x - 1.5, P.y - 3, 3, 6); }
        else if (r.kind === "out") { g.fillStyle = `rgba(${ink},${0.8 * al})`; g.fillRect(P.x - 3, P.y - 1, 6, 2); }
        else { g.fillStyle = `rgba(${ink},${0.7 * al})`; g.beginPath(); g.arc(P.x, P.y + q.o * sc, q.z, 0, Math.PI * 2); g.fill(); }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  const reg = (k) => (e) => (el.current[k] = e);
  return (
    <div className="wd" ref={box} onPointerLeave={() => setHover(null)}>
      <canvas ref={cvs} className="wd-c" />
      <div className="wd-row wd-cols"><span>Data it’s reading</span><span /><span>The agent, and what it’s thinking</span><span /><span>What it’s making</span></div>
      {IDS.map((id) => {
        const p = ps.find((q) => q.id === MAKES[id]), st = p.steps[p.cur], th = thoughtsOf(p), last = th[th.length - 1], m = madeOf(p);
        const on = !hover || hover === id || (id === "orin" && COLLAB.some((c) => c.from[1] === hover));
        const gets = COLLAB.filter((c) => c.to === id), gives = COLLAB.filter((c) => c.from[1] === id);
        return (
          <div key={id} className="wd-row" style={{ opacity: on ? 1 : 0.3 }} onPointerEnter={() => setHover(id)}>
            <div className="wd-src">{SOURCES.filter((s) => s.to.includes(id)).map((s) => <span key={s.id} ref={reg(`s-${id}-${s.id}`)} className="wd-s">{s.n}</span>)}</div>
            <span />
            <button className="wd-a" ref={reg("b-" + id)} onClick={() => onFocus(id)}>
              <span ref={reg("a-" + id)} className="wd-orb"><Orb id={id} size={48} live={!p.done} /></span>
              <span className="wd-txt">
                <span className="wd-an"><b>{AG[id].n}</b><small>{p.done ? "Done" : st.l}</small></span>
                <span className="wd-think">{p.done ? "Sent it to you to review." : last ? <Typed key={last[1]} text={last[1]} ms={D.typeMs} /> : "Getting started…"}</span>
              </span>
            </button>
            <span />
            <button className="wd-o" ref={reg("o-" + id)} onClick={() => onFocus(id)}>
              <Thumb kind={MAKES[id]} m={m} />
              <span className="wd-ot"><b>{OUT[MAKES[id]]}</b><em>{p.done ? "Ready for you" : `${Math.round(m * 100)}% made`}</em>
                {gets.length > 0 && <span className="wd-gets">{gets.map((c) => <span key={c.l}><Orb id={c.from[1]} size={12} />{c.l}</span>)}</span>}
                {gives.length > 0 && <span className="wd-gives">Also feeding Orin’s summary ↑</span>}
              </span>
            </button>
          </div>
        );
      })}
      <span className="wd-hint">Click an agent, or what it’s making, to go in</span>
    </div>
  );
}
const FF = '"Instrument Sans", ui-sans-serif, system-ui, sans-serif';
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
// Riley's check leaves her output and arcs up to Orin; Calvin's arcs up from his agent. A gentle S so they read as handoffs, not wiring
function cubicCo(a, b, t) { const u = 1 - t, c1 = { x: a.x + 30, y: a.y - 40 }, c2 = { x: b.x + 60, y: b.y + 40 }; return { x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x, y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y }; }

// a thumbnail of the thing, growing as it's made
function Thumb({ kind, m }) {
  if (kind === "forecast") { // a little waterfall: base, two levers, the total against the plan dot
    const bars = [[0, 0.78], [0.78, 0.1], [0.88, 0.07], [0, 0.95]];
    return <svg className="th" width="64" height="44" viewBox="0 0 64 44" aria-hidden="true">{bars.map(([b, h], i) => { const k = Math.max(0, Math.min(1, m * 4 - i)); return <rect key={i} x={4 + i * 15} y={42 - (b + h * k) * 40} width="11" height={h * k * 40} fill="currentColor" opacity={i === 3 ? 1 : 0.55} />; })}<circle cx="57.5" cy={42 - 0.94 * 40} r="2.5" fill="#ff725c" /></svg>;
  }
  const n = 7, shown = m * n; // a page writing itself, line by line
  return <svg className="th" width="64" height="44" viewBox="0 0 64 44" aria-hidden="true">{Array.from({ length: n }, (_, i) => { const k = Math.max(0, Math.min(1, shown - i)), w = (i === 0 ? 34 : i % 3 === 2 ? 40 : 56) * k; return <rect key={i} x="4" y={4 + i * 5.6} width={w} height={i === 0 ? 3 : 2} rx="1" fill="currentColor" opacity={i === 0 ? 1 : 0.55} />; })}</svg>;
}

// ---------------------------------------------------------------- inside an agent: what it's making, live, with the steps beside it
const DOC = [
  { id: "p1", from: "orin", t: "At October’s rate we land at $38.94M, $1.09M short of the $40.03M plan.", alt: "We’re $1.09M short of the $40.03M plan. At October’s rate we land at $38.94M." },
  { id: "p2", from: "orin", lever: true, t: "Three levers close it: Outbound back to pace (about $680K by Dec 31), an exec sponsor on the top 10 open expansion deals, and holding demo volume through Oct 31 for new logos.", alt: "Three levers close it. Outbound back to pace is the big one, about $680K by Dec 31. Expansion and new logos close the rest." },
  { id: "p3", from: "riley", t: "With all three we land at $40.08M, $50K over plan. That’s no margin: one slipped deal and we miss.", alt: "All three get us to $40.08M, only $50K over plan. One slipped deal and we miss." },
  { id: "p4", from: "calvin", t: "Watch the $1.98M of ARR at risk. Losing a tenth of it erases the expansion lever.", alt: "The risk is the $1.98M at risk: lose a tenth and the expansion lever is gone." },
];
function LiveDoc({ p, D }) {
  const writing = p.steps.findIndex((s) => /Write the summary/.test(s.l));
  const prog = p.done || p.cur > writing ? 1 : p.cur < writing ? 0 : p.prog; // the summary writes itself during "Write the summary"
  const [ed, setEd] = useState({}), [cm, setCm] = useState(null), [txt, setTxt] = useState("");
  const shown = prog * DOC.length;
  const send = (b) => {
    const v = txt.trim(); if (!v) return;
    setEd((E) => ({ ...E, [b.id]: { note: v, state: "reading" } })); setCm(null); setTxt("");
    setTimeout(() => setEd((E) => ({ ...E, [b.id]: { ...E[b.id], state: "rewriting" } })), 1100);
    setTimeout(() => setEd((E) => ({ ...E, [b.id]: { ...E[b.id], state: "done" } })), 1100 + b.alt.length * D.typeMs + 200);
  };
  return (
    <div className="doc">
      <div className="doc-h"><span>Monday sync · the path to $40M</span><em>{prog >= 1 ? "Draft ready" : prog > 0 ? "Orin is writing…" : "Starts once the levers are sized"}</em></div>
      {DOC.map((b, i) => {
        const k = Math.max(0, Math.min(1, shown - i)); if (k <= 0) return null;
        const e = ed[b.id], typing = k < 1, text = e && e.state !== "reading" ? b.alt : b.t;
        return (
          <motion.div key={b.id} className={`doc-p${e ? " is-ed" : ""}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <span className="doc-from"><Orb id={b.from} size={14} />{b.from === "orin" ? "Orin" : `From ${AG[b.from].n}`}</span>
            <p>{typing ? <>{b.t.slice(0, Math.floor(b.t.length * k))}<i className="ty-c" /></> : e && e.state === "rewriting" ? <Typed text={b.alt} ms={D.typeMs} /> : text}</p>
            {e && <div className="doc-note"><Ava p={{ ini: "BE", c: "#7395b3" }} size={16} /><span><b>You</b> {e.note}</span>
              <span className="doc-rep"><Orb id="orin" size={14} live={e.state !== "done"} />{e.state === "reading" ? "Orin is reading…" : e.state === "rewriting" ? "Rewriting this…" : "Done. Rewrote it with your note."}</span></div>}
            {!typing && !e && <button className="doc-c" onClick={() => { setCm(b.id); setTxt(""); }}>Comment</button>}
            <AnimatePresence>{cm === b.id && (
              <motion.div className="sp-cmp doc-cmp" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                <input autoFocus value={txt} onChange={(ev) => setTxt(ev.target.value)} placeholder="Tell Orin what to change here…" onKeyDown={(ev) => { if (ev.key === "Enter") send(b); if (ev.key === "Escape") setCm(null); }} />
                <button className="btn-pri" disabled={!txt.trim()} onClick={() => send(b)}>Send to Orin</button>
              </motion.div>)}</AnimatePresence>
          </motion.div>
        );
      })}
      {prog < 1 && prog > 0 && <div className="doc-skel">{[0.9, 0.7, 0.8].map((w, i) => <i key={i} style={{ width: `${w * 100}%` }} />)}</div>}
    </div>
  );
}
function LiveForecast({ p }) {
  // a waterfall in Orin's chart language: where October's rate lands, each lever stacked on, the total against the plan dot
  const run = p.steps.findIndex((s) => /three levers/.test(s.l)), prog = p.done || p.cur > run ? 1 : p.cur < run ? 0 : p.prog;
  const rows = [["At October’s rate", 38.94, 0, 0], ["Outbound back to pace", 0.68, 38.94, 0.33], ["Expansion and new logos", 0.46, 39.62, 0.66], ["With all three", 40.08, 0, 1]];
  const lo = 38.6, hi = 40.25, x = (v) => ((v - lo) / (hi - lo)) * 100;
  return (
    <div className="doc">
      <div className="doc-h"><span>Year-end forecast · all three levers</span><em>{prog >= 1 ? "Ready" : prog > 0 ? "Riley is running the levers…" : "Waiting on the plan"}</em></div>
      <div className="wf">{rows.map(([l, v, base, at], i) => { const k = Math.max(0, Math.min(1, (prog - at * 0.75) * 3.5)), total = i === 0 || i === 3, from = total ? lo : base, to = total ? v : base + v;
        return <div key={l} className="wf-r" style={{ opacity: k > 0 ? 1 : 0.25 }}><span className="wf-l">{l}</span>
          <span className="wf-t"><motion.i className={total ? "is-tot" : ""} style={{ left: `${x(from)}%` }} animate={{ width: `${(x(to) - x(from)) * k}%` }} transition={{ duration: 0.2 }} />{i === 3 && <b className="wf-plan" style={{ left: `${x(40.03)}%` }} title="Plan $40.03M" />}</span>
          <em>{k > 0.98 ? (total ? `$${v.toFixed(2)}M` : `+$${Math.round(v * 1000)}K`) : "…"}</em></div>; })}
        <div className="wf-k"><i />Plan $40.03M</div>
      </div>
    </div>
  );
}
function LiveStall({ p, D }) {
  const pulled = p.done || p.cur > 0;
  return (
    <div className="doc">
      <div className="doc-h"><span>Where new accounts stall</span><em>{p.done ? "Ready" : "Calvin is working…"}</em></div>
      <div className="doc-p"><span className="doc-from"><Orb id="calvin" size={14} />Calvin</span><p>{pulled ? "Time to first contract is 30.0 days." : <Typed text="Lining up time to first contract…" ms={D.typeMs} />}</p></div>
      <div className="doc-skel">{[0.85, 0.6, 0.75, 0.5].map((w, i) => <i key={i} style={{ width: `${w * 100}%` }} />)}</div>
    </div>
  );
}
// the agent thinking out loud while it works; reply to any thought to steer it
function Thinking({ p, id, D, setPs }) {
  const th = thoughtsOf(p), a = AG[id];
  const [rep, setRep] = useState({}), [open, setOpen] = useState(null), [txt, setTxt] = useState("");
  const list = useRef(null);
  useEffect(() => { const l = list.current; if (l) l.scrollTo({ top: l.scrollHeight, behavior: "smooth" }); }, [th.length]); // follow the newest thought
  const send = (k) => { const v = txt.trim(); if (!v) return; setRep((R) => ({ ...R, [k]: { you: v } })); setTxt(""); setOpen(null);
    setTimeout(() => setRep((R) => ({ ...R, [k]: { ...R[k], it: "Good call. Changing course: I'll work that in before I go on." } })), 1300);
    setPs((P) => P.map((q) => { if (q.id !== p.id || q.done) return q; const steps = [...q.steps]; steps.splice(q.cur + 1, 0, St(`Work in your note: ${v.length > 38 ? v.slice(0, 38) + "…" : v}`, id, ["Working in your note"], { changed: true, past: `${a.n} worked in your note` })); return { ...q, steps }; })); };
  return (
    <div className="tk2">
      <div className="tk2-h"><span><Orb id={id} size={16} live={!p.done} />{a.n}’s thinking</span><em>{p.done ? "Finished" : "Live"}</em></div>
      <ol className="tk2-l" ref={list}>
        <AnimatePresence initial={false}>{th.map(([at, t], i) => { const last = i === th.length - 1 && !p.done, r = rep[at];
          return (
            <motion.li key={at} layout className={last ? "is-now" : ""} initial={{ opacity: 0, y: 8, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              <p>{last ? <Typed text={t} ms={D.typeMs} /> : t}</p>
              {r && <div className="tk2-r"><span><b>You</b> {r.you}</span>{r.it ? <span><Orb id={id} size={14} />{r.it}</span> : <span className="is-wait"><Orb id={id} size={14} live />{a.n} is reading…</span>}</div>}
              {!r && open !== at && <button className="tk2-b" onClick={() => { setOpen(at); setTxt(""); }}>Reply</button>}
              <AnimatePresence>{open === at && (
                <motion.div className="sp-cmp tk2-c" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }}>
                  <input autoFocus value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={`Steer ${a.n} from here…`} onKeyDown={(e) => { if (e.key === "Enter") send(at); if (e.key === "Escape") setOpen(null); }} />
                  <button className="btn-pri" disabled={!txt.trim()} onClick={() => send(at)}>Send</button>
                </motion.div>)}</AnimatePresence>
            </motion.li>); })}</AnimatePresence>
      </ol>
    </div>
  );
}
function Focus({ id, D, ps, setPs, onBack }) {
  const p = ps.find((q) => q.id === MAKES[id]), st = p.steps[p.cur];
  const uses = SOURCES.filter((s) => s.to.includes(id)).map((s) => s.n).concat(COLLAB.filter((c) => c.to === id).map((c) => c.l));
  return (
    <motion.div className="fx" initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.97, filter: "blur(6px)" }} transition={D.zoom}>
      <div className="fx-top">
        <button className="jv-back" onClick={onBack}>{BACK}All agents</button>
        <div className="fx-who"><Orb id={id} size={32} live={!p.done} /><div><b>{AG[id].n} {p.done ? "finished" : "is making"} the {OUT[p.id].replace(/^(\w)/, (c) => (c === "M" ? c : c.toLowerCase()))}</b><small>{p.done ? "Sent to you to review" : <>Now: {st.l.toLowerCase()} · {Math.round(madeOf(p) * 100)}% made</>}</small></div></div>
      </div>
      <div className="fx-uses"><span>Using</span>{uses.map((u) => <span key={u} className="fx-u"><i />{u}</span>)}</div>
      <div className="fx-cols">
        <div className="fx-left">
          <Thinking p={p} id={id} D={D} setPs={setPs} />
          <Project p={p} D={D} setPs={setPs} />
        </div>
        <div className="fx-make">{p.id === "sync" ? <LiveDoc p={p} D={D} /> : p.id === "forecast" ? <LiveForecast p={p} /> : <LiveStall p={p} D={D} />}</div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------- the floor: every job, on the company's own lanes
// Agents work on the same seven lanes as Company health, so their work sits where the metric it's moving lives.
// Each job is one line of type. State is always visible (working, waiting, queued, needs you, done) and the floor moves
// on its own: lines fill as work happens, finished jobs drop to the bottom and fade, queued ones pick up.
const inS = (j, scope) => scope === "me" ? !!j.mine : typeof scope === "string" && scope.startsWith("p:") ? (PERSONS().find((p) => p.n === scope.slice(2))?.ls || []).includes(j.lane) : true;
const LANE_N = ["Inbound", "Outbound", "New Business", "Value Delivery", "Customer Value", "Expansion", "Product & Eng"];
const J = (lane, ag, t, st, o = {}) => ({ lane, ag, t, st, prog: o.prog ?? (st === "done" ? 1 : st === "run" ? 0.15 + Math.random() * 0.6 : 0), ...o });
// when two agents share a job they talk it through, and that conversation lives in the job (written for the prototype,
// from each job's own steps and Company health's numbers). Lines appear as the job moves.
const JOB_TALK = {
  "Write the Monday sync doc": [["calvin", "Sending you the $1.98M at risk for the risk line."], ["orin", "Thanks. Riley, can you check the three levers against the $40.03M plan?"], ["riley", "Checked. All three land at $40.08M, $50K over plan. There’s no margin."], ["orin", "Then I’ll lead with the gap and say plainly there’s no margin."]],
  "Forecast the year with all three levers": [["riley", "Running each lever on its own first, so you can see what each is worth."], ["orin", "Start from October’s rate, $38.94M."], ["riley", "Outbound back to pace adds about $680K. Expansion and new logos add about $460K."], ["orin", "That’s the line I’ll use in the sync."]],
  "Rank at-risk accounts by who to call first": [["riley", "Calvin, which of the at-risk accounts renew soonest?"], ["calvin", "Brightline renews Nov 14 and just cut seats."], ["riley", "Then Brightline goes first."]],
  "Find the deals that close the expansion gap": [["orin", "The top 10 open deals cover most of the gap. Riley, what win rate should I plan on?"], ["riley", "Expansion closes at 31.9% against a 60% target. Plan on fewer than half."], ["orin", "Six of the ten haven’t had an exec touch this quarter. I’ll start there."]],
  "Find what slows the first 10 handoffs": [["calvin", "Teams with a Felix champion hit 10 handoffs a week sooner."], ["orin", "Does that hold for small teams?"], ["calvin", "Checking that now."]],
};
const withOf = (t, ag) => [...new Set((JOB_TALK[t] || []).map((m) => m[0]))].filter((a) => a !== ag);
const FLOOR0 = [
  J(0, "marco", "Find why booked demos don’t happen", "run", { mine: true, think: ["Splitting no-shows by lead source.", "Webinar leads no-show twice as often. Checking when they were booked."] , row: "Demo held rate" }),
  J(0, "orin", "Re-route the 14 open prospects Sam left", "queue", { think: ["Sorting the 14 prospects by last touch and deal size.", "Matching each one to a rep with room this month."] }),
  J(0, "marco", "Make reminder visuals for webinar sign-ups", "run", { mine: true, kind: "images", example: true, prog: 0.45, think: ["Webinar leads no-show twice as often, so the reminder has to land.", "Three directions: the time, the seat, a one-tap confirm.", "Making the third one now."] , row: "Demo held rate" }),
  J(0, "marco", "Sum up Inbound’s October", "done", { at: "9:12", mine: true, think: ["Inbound booked $1.31M against a $1.03M pace, 128% of it.", "Pipeline created is $5.97M, ahead of its $5.22M pace.", "The weak spot is demo held rate: 50.7% against a 60% target."] }),
  J(0, "marco", "Check Inbound’s pipeline against pace", "done", { at: "8:40", think: ["Inbound has created $5.97M of pipeline against a $5.22M pace, 114% of it.", "That’s $0.75M ahead, so pipeline isn’t what’s holding Inbound back."] , row: "Pipeline created" }),
  // Fia keeps the knowledge base: how Fello defines each number (the definitions are Company health's own)
  J(1, "fia", "Write up how Outbound’s Booked ARR is counted", "done", { at: "9:20", mine: true, think: ["Reading the definitions on Company health.", "Outbound’s Booked ARR is new ARR closed this month from deals that started with outbound prospecting."], row: "Booked ARR – Outbound" }),
  J(2, "fia", "Define a held demo for the team", "done", { at: "8:50", think: ["Reading the definitions on Company health.", "A demo counts as held when a booked demo actually happens. Demo held rate is the share of booked demos that did."], row: "Demo held rate" }),
  J(4, "fia", "Keep every number’s definition in one place", "run", { think: ["Collecting the definitions from Company health.", "Linking each number to the page it lives on."] }),
  J(1, "riley", "Approve moving Sam back to Outbound", "need", { mine: true, need: "riley-out" }),
  J(1, "orin", "Write the Monday sync doc", "run", { mine: true, deep: "sync" }),
  J(1, "orin", "Start on Sam’s demo list now?", "need", { mine: true, need: "orin-prop", row: "Booked ARR – Outbound" }),
  J(1, "orin", "Find where Outbound demos drop off", "run", { think: ["Reading the last 30 days of demo notes.", "Most drop-offs are reschedules that never got rebooked."] , row: "Demo held rate" }),
  J(1, "orin", "Rank Sam’s demo list", "queue", { think: ["Scoring the 14 open prospects on fit and how recently they engaged.", "Ordering the list so the strongest are first."] }),
  J(2, "orin", "Find why held demos aren’t closing", "run", { think: ["Lost deals cluster after the first call.", "Reading call notes for the objections that came up."] , row: "Win rate from held demo" }),
  J(2, "orin", "Find why new logos are behind pace", "wait", { wait: "Waiting on the HubSpot sync" , row: "New logos" }),
  J(2, "orin", "Review the last 20 lost demos", "queue", { mine: true, think: ["Reading the notes on the last 20 lost demos.", "Grouping the reasons they give."] , row: "Win rate from held demo" }),
  J(3, "calvin", "Find where new accounts stall", "run", { mine: true, deep: "stall" , row: "TTV: 10 handoffs" }),
  J(3, "calvin", "Find what slows the first 10 handoffs", "run", { think: ["Teams with a Felix champion hit 10 handoffs a week sooner.", "Checking whether that holds for small teams."] , row: "TTV: 10 handoffs" }),
  J(3, "calvin", "Group new customers by first contract", "wait", { wait: "Needs a data connection" , row: "TTV: 10 handoffs" }),
  J(4, "calvin", "Approve QBR invites for 4 quiet renewals", "need", { mine: true, need: "calvin-smb" , row: "At-risk ARR" }),
  J(4, "riley", "Rank at-risk accounts by who to call first", "run", { think: ["Ranking at-risk accounts by ARR and days since last touch.", "Brightline renews Nov 14 and just cut seats. It goes first."] , row: "At-risk ARR" }),
  J(4, "riley", "Explain what’s holding GRR", "done", { at: "9:30", mine: true, think: ["GRR is 97.7%, just above its 97.07% pace.", "Downgrade and churn are $773K, $227K under their $1.00M pace.", "The risk is ahead: $1.98M of ARR is marked at risk."] , row: "GRR" }),
  J(4, "riley", "Check downgrades and churn", "done", { at: "8:55", think: ["$773K lost to downgrades and churn this month, against a $1.00M pace.", "That’s $227K under pace, which is good.", "At-risk ARR is $1.98M, still under its $5.50M ceiling."] , row: "Downgrade + churn" }),
  J(5, "riley", "Forecast the year with all three levers", "run", { mine: true, deep: "forecast" }),
  J(5, "orin", "Find the deals that close the expansion gap", "run", { think: ["The top 10 open expansion deals cover most of the gap.", "Six of them haven’t had an exec touch this quarter."] , row: "Expansion ARR" }),
  J(5, "riley", "Find why expansion deals aren’t closing", "queue", { think: ["Comparing won and lost expansion deals this quarter.", "Checking where the lost ones stalled."] , row: "Win rate" }),
  J(5, "orin", "Line up exec sponsors for the top 10 deals", "queue", { mine: true, think: ["Listing the 10 biggest open expansion deals.", "Matching each one to an executive who knows the account."] , row: "Expansion ARR" }),
  J(6, "calvin", "Break down Felix handoffs by team", "run", { think: ["Company-wide it’s 9.61 per 1K.", "Flagging the teams furthest under target."] , row: "Felix handoffs per 1K" }),
  J(6, "calvin", "Find why daily active users are below target", "run", { think: ["Usage dipped on weekends after the Oct 20 release.", "Checking which screens lost the most time."] , row: "Daily active users" }),
  J(6, "calvin", "Check Felix’s health score", "done", { at: "9:05", mine: true, think: ["Felix health is 70 against a 78 target, 8 short.", "Handoffs per 1K are on pace at 9.61, so use isn’t the gap."] , row: "Felix health" }),
  J(6, "calvin", "Write the weekly Fello health read", "done", { at: "8:30", think: ["Fello health is 68 against a 73 target.", "Daily active users are 1,577 against 1,700. Active accounts are 28.5% against 30%."] , row: "Fello health" }),
  // Sam's decisions (his seat only)
  J(2, "orin", "Send 11 lost-demo follow-ups", "need", { for: "sam", need: "sam-follow", row: "Win rate from held demo", tOther: "Sam’s 11 lost-demo follow-ups" }),
  J(1, "orin", "Start on your demo list now?", "need", { for: "sam", need: "sam-list", row: "Booked ARR – Outbound", tOther: "Sam’s demo list" }),
  J(2, "riley", "Rank your late-stage deals?", "need", { for: "sam", need: "sam-arr", row: "New ARR", tOther: "Rank Sam’s late-stage deals" }),
].map((j, i) => ({ ...j, id: "j" + i, with: j.with || withOf(j.t, j.ag) }));
const ORDER = { need: 0, run: 1, wait: 2, queue: 3, done: 4 };
const ST_L = { need: "Needs you", run: "", wait: "", queue: "Queued", done: "Done" };

// company scale, as a preview: the prototype's own jobs run again for each customer segment, so the views can be judged at
// a few hundred jobs. Titles and steps are the prototype's; the segment split is made up for the preview.
const SEGS = ["SMB", "Mid-market", "Enterprise", "EMEA", "APAC", "LATAM", "Partners", "Self-serve", "Brokerages", "Teams", "Franchises", "New markets"];
const SCALE_JOBS = (() => { let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const T = FLOOR0.filter((j) => !j.need && !j.deep && j.kind !== "images"), out = [];
  SEGS.forEach((seg, si) => T.forEach((j, ti) => { const r = rnd(), st = r < 0.42 ? "run" : r < 0.66 ? "queue" : r < 0.94 ? "done" : "wait";
    out.push({ ...j, id: `s${si}-${ti}`, t: `${j.t} · ${seg}`, st, prog: st === "run" ? 0.1 + rnd() * 0.8 : st === "done" ? 1 : 0, mine: false, wait: st === "wait" ? "Waiting on the HubSpot sync" : undefined, with: [], scale: true }); }));
  return out; })();
function useFloor(D, ps, scale, calm) {
  const calmR = useRef(calm); calmR.current = calm;
  const [jobs, setJobs] = useState(() => NA.raw || FLOOR0), spawn = useRef(0);
  useEffect(() => { NA.raw = jobs; }, [jobs]);
  useEffect(() => { NA.setRaw = setJobs; return () => { NA.setRaw = null; }; }, []);
  useEffect(() => { setJobs((JS) => (scale ? [...JS.filter((j) => !j.scale), ...SCALE_JOBS] : JS.filter((j) => !j.scale))); }, [scale]);
  const [feed, setFeed] = useState({ k: 0, ag: "riley", t: "Riley finished “Explain what’s holding GRR”" });
  useEffect(() => {
    const t = setInterval(() => !calmR.current && !holdStill() && setJobs((JS) => {
      let fin = null;
      const out = JS.map((j) => {
        if (j.st !== "run" || j.deep) return j;
        const prog = j.prog + (0.32 / D.stepLen) * (0.6 + (j.id.charCodeAt(1) % 5) * 0.12);
        if (prog >= 1) { fin = j; return { ...j, st: "done", prog: 1, at: "Just now" }; }
        return { ...j, prog };
      });
      if (fin) { // a queued job in the same lane picks up; the floor keeps moving
        const q = out.findIndex((j) => j.lane === fin.lane && j.st === "queue");
        if (q >= 0) out[q] = { ...out[q], st: "run", prog: 0.02, think: out[q].think || [] };
        setTimeout(() => setFeed((f) => ({ k: f.k + 1, ag: fin.ag, t: `${AG[fin.ag].n} finished “${fin.t}”` })), 0);
      }
      // the floor never runs dry: while fewer than eight are moving, the next job comes in (the prototype's own jobs, run again)
      const nRun = out.filter((j) => j.st === "run" && !j.arch).length;
      if (nRun < 10 && Math.random() < (nRun < 7 ? 0.4 : 0.19) && FLOOR0.some((j) => !j.deep && !j.need && j.st !== "wait" && !out.some((o) => !o.arch && o.st !== "done" && o.t === j.t))) {
        const live = new Set(out.filter((j) => !j.arch && j.st !== "done").map((j) => j.t)), pool = FLOOR0.filter((j) => !j.deep && !j.need && j.st !== "wait" && !live.has(j.t)), src = pool[Math.floor(Math.random() * pool.length)], id = "r" + ++spawn.current;
        AGE[id] = 0; out.push({ ...src, id, st: "run", prog: 0.02, at: undefined, think: src.think || [] });
        const lane = out.filter((j) => j.lane === src.lane && !j.arch); // the lane keeps its height: its oldest finished floor is filed away
        if (lane.length > 6) { const old = lane.filter((j) => j.st === "done").sort((a, b) => ageOf(b) - ageOf(a))[0]; if (old) { const i = out.indexOf(old); out[i] = { ...old, arch: true }; } }
        setTimeout(() => setFeed((f) => ({ k: f.k + 1, ag: src.ag, t: `${AG[src.ag].n} picked up “${src.t}”` })), 0);
      }
      return out;
    }), 1000);
    return () => clearInterval(t);
  }, [D.stepLen]);
  // the three deep jobs take their progress from their projects
  const all = deriveJobs(jobs, ps);
  return [all, setJobs, feed];
}

// ---------------------------------------------------------------- the bridge: Agents is part of North, so North's chat answers for it
// The floor's state lives here between visits, so going Home and coming back finds everything where you left it, and
// North's chat (on any page) can ask the agents, act on a decision, start a job, or pick a conversation back up.
const NA = { raw: null, ps: null, setRaw: null, open: null, pendingOpen: null };
// whose seat: leadership sees every job. Anyone else sees the company's work but only their own decisions, and "for me" is
// their lane (plus anything named for them). Jobs started from a seat belong to that seat.
function seatView(list) { const st = seatOf(), w = getWho();
  // a decision made for someone (for: "sam") is theirs alone; leadership's decisions stay with leadership
  // leadership sees everyone's work, theirs too: a call that's someone else's shows as waiting on them, not as one to make.
  // (If leadership has its own ask for the same job, that one stands and the other isn't shown twice.)
  if (!st) { const own = new Set(list.filter((j) => j.st === "need" && !j.for).map((j) => NEEDS.find((y) => y.id === j.need)?.propose).filter(Boolean));
    return list.filter((j) => !(j.st === "need" && j.for && own.has(NEEDS.find((y) => y.id === j.need)?.propose)))
      .map((j) => (j.st === "need" && j.for ? { ...j, t: j.tOther || j.t, st: "wait", wait: `Waiting on ${SEATS[j.for]?.n || j.for}’s call`, mine: false, theirs: j.for } : j.by && j.by !== w && j.mine ? { ...j, mine: false } : j)); }
  const named = new RegExp(`\\b${st.n}’s\\b`);
  return list.filter((j) => j.st !== "need" || (j.for ? j.for === w : st.lanes.includes(j.lane))).map((j) => { const m = j.for ? j.for === w : j.by ? j.by === w : st.lanes.includes(j.lane) || named.test(j.t); return m === !!j.mine ? j : { ...j, mine: m }; }); }
function deriveJobs(jobs, ps) { return seatView(deriveJobs0(jobs, ps)); }
function deriveJobs0(jobs, ps) { return jobs.map((j) => { if (!j.deep || !ps) return j; const p = ps.find((q) => q.id === j.deep); if (!p) return j; return { ...j, prog: madeOf(p), st: p.done ? "done" : "run", at: p.done ? "Just now" : j.at, think: thoughtsOf(p).map((x) => x[1]), stepN: p.steps.length, stepK: p.cur + 1 }; }); }
const naJobs = () => deriveJobs((NA.raw || FLOOR0).filter((j) => !j.arch), NA.ps || PROJECTS.map((p) => ({ ...p, steps: p.steps.map((x) => ({ ...x })), prog: { sync: 0.55, forecast: 0.3, stall: 0.7 }[p.id], done: false, cm: {} })));
const naUpdate = (fn) => { if (NA.setRaw) NA.setRaw(fn); else NA.raw = fn(NA.raw || FLOOR0); };
// standing orders and decision check-ins live outside React, so the chat and the Agents page read the same list
const BOOK = { rules: [], checks: [] }, bookSubs = new Set();
const bookPut = (k, v) => { BOOK[k] = [...BOOK[k].filter((x) => x.id !== v.id), v]; bookSubs.forEach((f) => f()); };
function useBook() { const [, tick] = useState(0); useEffect(() => { const f = () => tick((n) => n + 1); bookSubs.add(f); return () => { bookSubs.delete(f); }; }, []); return BOOK; }
// "did it work?": every approval is logged with the numbers it should move, as they stand today, and a date to look again.
// The after-numbers come from live data on that date; the prototype never makes them up.
const KPI = (li, r) => { const row = HLANES[li][3][r]; return [row[0], row[1], row[2] == null || /no target/i.test(row[3]) ? null : /%$/.test(row[3]) ? `${row[3]} of ${row[4].split(" ")[0]}` : lower1(row[3])]; };
const CHECK = {
  "riley-out": { what: "Sam back on Outbound", lane: 1, watch: () => [KPI(1, 0), KPI(1, 2)] },
  "orin-prop": { what: "Sam’s demo list", lane: 1, watch: () => [KPI(1, 1), KPI(1, 2)] },
  "sam-follow": { what: "Follow-ups on 11 lost demos", lane: 2, watch: () => [KPI(2, 2), KPI(2, 3)] },
  "sam-list": { what: "Your demo list", lane: 1, watch: () => [KPI(1, 1), KPI(1, 2)] },
  "sam-arr": { what: "Late-stage new-logo deals, ranked", lane: 2, watch: () => [KPI(2, 0)] },
  "calvin-smb": { what: "QBR invites to the 4 quiet renewals", lane: 4, watch: () => [["QBRs booked in Jordan’s book", "6 of 29", null], ["Renewals with no touch in 60 days", "4", null]] },
};
const dueIn = (d) => { const t = new Date(Date.now() + d * 864e5); return t.toLocaleDateString("en-US", { month: "short", day: "numeric" }); };
const logCheck = (j) => { const c = CHECK[j.need]; if (!c) return null; const v = { id: j.need, ag: j.ag, what: c.what, lane: c.lane, watch: c.watch(), due: dueIn(14) }; bookPut("checks", v); return v; };
// what saying yes does: a proposal starts the queued job it names (and any other ask for the same job goes away); a "start"
// adds the job it describes, running; anything else is done
// whoever says yes watches what it set in motion (watchBy): North tells them when it lands, wherever they are
const approveIn = (JS, j, n, nid, w = getWho()) => n?.propose ? JS.map((x) => (x.id === j.id || (x.st === "need" && x.need !== j.need && NEEDS.find((y) => y.id === x.need)?.propose === n.propose) ? { ...x, arch: true } : x.t === n.propose && (x.st === "queue" || x.st === "wait") ? { ...x, st: "run", prog: 0.04, mine: true, watchBy: w } : x))
  : n?.start ? [...JS.map((x) => (x.id === j.id ? { ...x, arch: true } : x)), { id: nid, lane: n.start[2], ag: n.start[1], with: [], t: n.start[0], st: "run", prog: 0.04, mine: true, by: w, watchBy: w, row: n.start[3], think: n.start[4] || [] }]
  : JS.map((x) => (x.id === j.id ? { ...x, st: "done", prog: 1, at: "Just now", approved: true, watchBy: w } : x));
const naApprove = (j, quiet) => { const n = NEEDS.find((x) => x.id === j.need), nid = "u" + Date.now().toString(36) + (NA.uid = (NA.uid || 0) + 1); AGE[j.id] = 0; if (n?.start) AGE[nid] = 0; logCheck(j);
  naUpdate((JS) => approveIn(JS, j, n, nid));
  if (j.need && !quiet && typeof window !== "undefined") window.dispatchEvent(new CustomEvent("north:decided", { detail: { need: j.need, opt: "a", from: "agents" } })); };
// the same decision made on Home: approve it here (its check-in is booked like any approval), or, for the other way, set it
// aside and start what was chosen instead
if (typeof window !== "undefined") window.addEventListener("north:decided", (e) => { const d = e.detail || {}; if (d.from === "agents") return;
  const j = (NA.raw || FLOOR0).find((x) => x.need === d.need && x.st === "need" && !x.arch); if (!j) return;
  if (d.opt === "a") naApprove(j, true);
  else { naUpdate((JS) => JS.map((x) => (x.id === j.id ? { ...x, arch: true } : x))); naAdd("Send Sam’s 11 lost-demo follow-ups", ["orin"], 1); } });
const naAdd = (t, ags, lane, think) => { const id = "u" + Date.now().toString(36) + (NA.uid = (NA.uid || 0) + 1); AGE[id] = 0; naUpdate((JS) => [...JS, { id, lane, ag: ags[0], with: ags.slice(1), t, st: "run", prog: 0.02, mine: true, by: getWho(), watchBy: getWho(), think: think || gapThink(t) || [] }]); return id; };
const stOf = (j) => (j.st === "need" ? "needs you" : j.st === "run" ? stepTxt(j).toLowerCase() : j.st === "done" ? "done" : j.st === "wait" ? "waiting" : "up next");
const rowOfJob = (j) => ({ id: j.id, t: j.t, st: j.st, ag: j.ag, act: j.st === "need" ? (NEEDS.find((n) => n.id === j.need)?.act || "Approve") : null, label: j.st === "need" ? "Needs you" : j.st === "run" ? stepTxt(j) : j.st === "done" ? agoT(ageOf(j)) : j.st === "wait" ? (j.theirs ? `${SEATS[j.theirs]?.n || "Their"}’s call` : "Waiting") : "Up next" });
// a finished job, handed back: what it is, what came out of it (only from what's known: its findings; else the number it was
// checking on Company health; else what it is), and who it's for, so it can be reviewed, sent on or added somewhere
function deliveryOf(j) { const th = (j.think || []).filter((t) => !/^Starting on /.test(t)), owner = OWNERS[LANE_N[j.lane]];
  const finding = th.length ? ([...th].reverse().find((t) => !/^\w+ing\b/.test(t)) || null) : null, hr = rowOf(j).row;
  const result = j.revised || (jobKind(j) === "find" ? (finding || (hr ? `${hr[0]} is at ${hr[1]}, ${hr[3]} of ${hr[4]}.` : null)) : (BRIEF[j.t] || finding));
  return { id: j.id, t: j.t, ag: j.ag, result, who: owner || LANE_N[j.lane], next: NEXT[j.t] || null, v: j.v || 1, note: j.note || null }; }
function reviseLocal(d) { const n = (d.note || "").toLowerCase(); let r = d.result || "";
  if (/short|tight|brief|concise/.test(n)) r = (r.split(/(?<=[.!?])\s+/)[0] || r).replace(/,[^,]*$/, (m) => (r.length > 90 ? "." : m));
  if (/who owns|owner|whose|who.?s on/.test(n) && !r.includes(d.who)) r = `${r.replace(/\.$/, "")}. ${d.who.split(/\s*\/\s*/)[0]} owns it.`;
  return r; }
async function reviseOf(sm, d) {
  if (sm) try { const r = await sm.json([`Rewrite this finished work result to follow the note. Use only these facts and keep every number exactly as written; never add numbers, names or claims.`,
    `Result: ${d.result}`, `It's for: ${d.who}`, d.next ? `Next step: ${d.next}` : "", `Note: ${d.note}`, `Reply with JSON only: {"text": "<the rewritten result, one or two plain sentences>"}`].filter(Boolean).join("\n"), { modelTier: "quick", cache: false });
    if (r && typeof r.text === "string" && r.text.trim()) return r.text.trim(); } catch (e) {}
  return reviseLocal(d); }
const naSeen = (id) => { const j = naJobs().find((x) => x.id === id); if (j && !j.seen) naUpdate((JS) => JS.map((x) => (x.id === id ? { ...x, seen: true } : x))); };
// feedback on finished work: it goes back to its agent, gets reworked with your note, and comes back as the next version
const naRework = (id, note) => { const j = naJobs().find((x) => x.id === id); const base = j ? { ...deliveryOf(j), note } : null;
  naUpdate((JS) => JS.map((x) => (x.id === id ? { ...x, st: "run", prog: 0.72, v: (x.v || 1) + 1, note, revised: null, seen: false } : x))); AGE[id] = 0;
  // the rework itself: the new version of the result is written while the job runs, and is what comes back
  if (base) reviseOf(NA.sm || window.__northAgents?.sm, base).then((t) => naUpdate((JS) => JS.map((x) => (x.id === id ? { ...x, revised: t } : x)))); };
// where finished work can go. In North, Send hands it to the chat (which drafts the Google Chat message); alone, it just confirms
// every way finished work can leave: to a person, as a file, into another piece of work
const SHARE = [["Send", [["gc", "Google Chat", "To the person it’s for, or anyone"], ["link", "Copy link", "Anyone at Fello can open it"], ["text", "Copy as text", "For an email or a doc"]]],
  ["Export", [["pdf", "PDF"], ["slide", "A slide"], ["sheet", "Google Sheet"]]],
  ["Add to", [["sync", "The Monday sync doc"], ["lib", "Library"], ["home", "Home"]]]];
const shareDone = (k, l) => ({ link: "Link copied", text: "Copied as text", pdf: "Exported as PDF", slide: "Made a slide", sheet: "Opened as a Google Sheet" }[k] || `Added to ${l.replace(/^The /, "the ")}`);
const ADD_TO = SHARE[2][1];
const shareJob = (j, toast) => { const d = deliveryOf(j); if (window.__northShare) window.__northShare(d); else toast && toast(`Drafted for ${d.who.split(/\s*\/\s*/)[0]}`); };
const DO = /^(?:@?(orin|riley|calvin)[,:]?\s+(?:please\s+|can you\s+|could you\s+)?|(?:have|ask|get|tell)\s+@?(orin|riley|calvin)\s+(?:to\s+)?)(check|find|look|rank|pull|draft|write|build|review|dig|make|put|work out|figure|compare|line up|break down|summari[sz]e|sum up|prep|prepare|send)\b/i;
const TAKE = /(make of|think|thoughts|take on|your take|view|agree|weigh in|opinion|anything to add|add to|what do you say|chime in|see it|what about you)/i;
const RECALL = /(we (talked|spoke|discussed|were talking)|talked about|we chatted|pick (it |this |that )?(back )?up|that thing|last time|earlier|where (were|did) we|catch me up on (what|our)|our (chat|conversation))/i;
// msgs: the chat you're in · all: every chat (picking something back up can reach any of them)
const RULE = /^(?:if|when|whenever|any ?time|once)\s+(.+?)(?:,\s*|\s+then\s+|\s+)(?:have|get|ask|tell|let)\s+@?(orin|riley|calvin)\s+(?:to\s+)?(.+?)[.!]*$/i;
function ruleOf(q) {
  const m = q.trim().match(RULE); if (!m) return null;
  const cond = m[1].trim(), ag = m[2].toLowerCase(), task = cap(m[3].trim()), cl = cond.toLowerCase();
  const li = LANE_N.findIndex((n) => cl.includes(n.toLowerCase())), num = cl.match(/(\d+(?:\.\d+)?)\s*%/), dir = /(below|under|less than|drops|falls|dips|lower)/.test(cl) ? "lt" : /(above|over|more than|exceeds|tops|higher)/.test(cl) ? "gt" : null;
  const now = li >= 0 ? kpiOf(li).p : null, n = num ? +num[1] : null, known = li >= 0 && n != null && dir && now != null;
  const met = known && (dir === "lt" ? now < n : now > n);
  return { id: "r" + Date.now().toString(36), cond, ag, task, lane: li >= 0 ? li : crewOf(task).lane, n, dir, now, known, met, at: "Just now", fired: null };
}
function naMatch(q, msgs = [], all = msgs) {
  const jobs = naJobs(), ql = q.toLowerCase().trim(), agN = IDS.find((id) => new RegExp(`\\b${id}\\b`, "i").test(q));
  // 0. a standing order: a watch that starts work. Already true? The job starts now. Otherwise it waits for the number.
  const rl = ruleOf(q);
  if (rl) { const L = LANE_N[rl.lane], low = rl.task.charAt(0).toLowerCase() + rl.task.slice(1), cmp = rl.dir === "lt" ? "below" : "above";
    if (rl.met) rl.fired = naAdd(rl.task, [rl.ag], rl.lane);
    bookPut("rules", rl);
    const text = !rl.known ? `Standing order set. When ${rl.cond}, I’ll ${low} and tell you here.`
      : rl.met ? `Standing order set. Whenever ${L} is ${cmp} ${rl.n}% of pace, I’ll ${low}. It’s at ${rl.now}% now, so I’ve already started.`
      : `Standing order set. ${L} is at ${rl.now}% of pace, so there’s nothing to do yet. The moment it goes ${cmp} ${rl.n}%, I’ll ${low} and tell you here.`;
    return { ag: rl.ag, chat: `Standing order · ${L}`, started: rl.fired || undefined, text,
      facts: [`standing order: when ${rl.cond}, ${AG[rl.ag].n} will ${low}`, rl.known && `${L} is at ${rl.now}% of pace now`, rl.met ? "the condition is already true, so the job started now" : "the condition is not met yet, so nothing started"].filter(Boolean), jobs: [] }; }
  // 0b. how Fello defines a number ("how do we count Booked ARR?", "what counts as a held demo?"): Fia, from the definitions
  //     Company health already carries. Only definition questions: "what's our Booked ARR?" still gets the number.
  if (/how (do|does|did) (we|you|fello) (count|define|measure|calculate)|\bdefin(e|ed|ition|itions)\b|what counts as|what does .+ mean|meaning of|how is .+ (counted|calculated|measured|defined)|what('s| is) the definition/i.test(q)) {
    const norm = (t) => t.toLowerCase().replace(/[–-]/g, " ").replace(/\s+/g, " "), qn = norm(q).replace(/\bheld demos?\b/, "demo held").replace(/\bdemos? held\b/, "demo held");
    // the closest name: the whole name in the question wins; otherwise its base ("Booked ARR") plus the most of its qualifier ("Outbound")
    const score = (k) => { const [b0, ...r0] = k.split(" – "), n = norm(k), base = norm(b0), q2 = norm(r0.join(" ")).split(" ").filter((w) => w.length > 2);
      return qn.includes(n) ? 100 + n.length : qn.includes(base) ? 10 + q2.filter((w) => qn.includes(w)).length * 5 - q2.filter((w) => !qn.includes(w)).length : /\srate$/.test(base) && qn.includes(base.replace(/\srate$/, "")) ? 8 : 0; };
    const key = Object.keys(DESC).map((k) => [k, score(k)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1])[0]?.[0];
    const d = key && DESC[key], low = d && (/^[A-Z][a-z]/.test(d) ? d[0].toLowerCase() + d.slice(1) : d);
    if (key) return { ag: "fia", chat: "Definitions", text: `${key}: ${low} That's how Company health counts it.`, facts: [`Company health's definition of ${key}: ${DESC[key]}`], jobs: [] };
  }
  const lastNa = [...msgs].reverse().find((m) => m.role === "agent" && m.na), lastAny = [...msgs].reverse().find((m) => m.role === "user" || m.role === "north" || m.role === "agent");
  // 1. picking a conversation back up: "that thing with Orin about Sam's list", "what did Orin and I talk about"
  if (RECALL.test(q)) { msgs = all;
    const ag = agN || lastNa?.agent; const prev = [...msgs].reverse().find((m) => m.role === "agent" && m.na && (!ag || m.agent === ag) && Object.keys(m.snap || {}).length) || [...msgs].reverse().find((m) => m.role === "agent" && m.na && (!ag || m.agent === ag));
    if (prev) { const by = new Map(jobs.map((j) => [j.id, j])), ch = [];
      msgs.filter((m) => m.role === "agent" && m.na && m.agent === prev.agent && m.acted).forEach((m) => { const j = jobs.find((x) => x.t === m.acted); if (j) ch.push(j.st === "done" ? `${ing(j.t)} is done` : `${ing(j.t)} is ${stOf(j)}`); });
      Object.entries(prev.snap || {}).forEach(([id, was]) => { const j = by.get(id); if (!j) return; const now = stOf(j); if (now !== was) ch.push(j.st === "done" ? `${ing(j.t)} is done` : j.st === "run" && was === "needs you" ? `${qt(j.t)} is approved and moving` : `${ing(j.t)} moved to ${now}`); });
      const open = (prev.jobs || []).map((r) => by.get(r.id)).filter((j) => j && j.st === "need");
      const text = `Last time you asked “${(prev.q || "about my work").replace(/[?.]$/, "")}”. ${ch.length ? `Since then, ${ch.slice(0, 3).join(", ")}.` : "Nothing’s moved since then."}${open.length ? ` ${open.length === 1 ? `Your call on ${qt(open[0].t)} is` : `${n2w(open.length)} calls are`} still open.` : ""}`;
      return { ag: prev.agent, topic: prev.topic, text, facts: [prev.q && `earlier question: ${prev.q}`, ...ch, ...open.map((j) => `still waiting on the user: "${j.t}"`)], jobs: [...open, ...Object.keys(prev.snap || {}).map((id) => by.get(id)).filter((j) => j && j.st !== "need")].slice(0, 5) }; }
    if (agN) return { ag: agN, text: `I don’t have a conversation with you on that yet. Ask me anything and I’ll keep it here so we can pick it up later.`, facts: [], jobs: [] };
  }
  // 1b. a reply to finished work ("make it shorter", "add the Q3 numbers"): the work goes back with that note
  if (lastNa && lastNa.deliv?.length && lastAny === lastNa && !agN && !isAsk(q) && !/^(thanks|thank you|cool|great|perfect|ok|okay|got it|nice|looks good|lgtm)\b/i.test(ql)) {
    const d = lastNa.deliv.find((x) => toks(x.t).some((w) => w.length > 3 && ql.includes(w.toLowerCase()))) || lastNa.deliv[lastNa.deliv.length - 1], j = jobs.find((x) => x.id === d.id);
    if (j) { naRework(j.id, q.replace(/[.!]+$/, "")); return { ag: j.ag, stay: true, started: j.id, text: `Got it. I’ll rework ${qt(j.t)} with that and bring v${(j.v || 1) + 1} back here.`, facts: [`reworking "${j.t}" with the note: ${q}`], jobs: [] }; }
  }
  // 2. a reply to an agent you were just talking to ("go ahead", "do that first", "thanks")
  if (lastNa && lastAny === lastNa && !agN && !isAsk(q)) { const last = { jobs: (lastNa.jobs || []).map((r) => jobs.find((j) => j.id === r.id)).filter(Boolean) }; const r = replyOf(q, lastNa.agent, last); if (r.act) naApprove(r.act); const n = r.act && NEEDS.find((x) => x.id === r.act.need); return { ...r, stay: true, jobs: r.jobs || [], actedOn: r.act ? (n?.propose || r.act.t) : null }; }
  // 3. handing an agent something to do: "Have Riley check Outbound's pipeline against pace"
  const dm = q.match(DO);
  if (dm) { const ag = (dm[1] || dm[2]).toLowerCase(), task = cap(q.slice(dm[0].length - dm[3].length).trim().replace(/[.?!]+$/, "")), lane = crewOf(task).lane;
    const sid = naAdd(task, [ag], lane); return { ag, chat: task, started: sid, text: `On it. I’m ${ing(task).charAt(0).toLowerCase() + ing(task).slice(1)} now, and I’ll tell you here when it’s done.`, facts: [`started "${task}" in ${LANE_N[lane]}`], jobs: [] }; }
  // 3b. bringing another agent into an agent's thread ("@Riley what do you make of this?"): their side of the same work, from the jobs
  if (agN && lastNa && agN !== lastNa.agent && (lastAny === lastNa || lastAny?.role === "user") && (TAKE.test(q) || ql.replace(/@?\w+[,:]?/, "").trim().length < 3)) {
    const other = lastNa.agent, O = AG[other].n, listed = (lastNa.jobs || []).map((r) => jobs.find((j) => j.id === r.id)).filter(Boolean);
    const lanes = new Set(listed.map((j) => j.lane)), shared = listed.filter((j) => j.ag === agN || (j.with || []).includes(agN));
    const mine = jobs.filter((j) => j.ag === agN && j.st !== "done" && lanes.has(j.lane) && !shared.includes(j)).slice(0, 2), needs = listed.filter((j) => j.st === "need"), need = needs[0];
    const parts = [], facts = [], low = (t) => t.charAt(0).toLowerCase() + t.slice(1);
    // North isn't a co-worker on jobs: after a North answer, an agent speaks to the ones on that list that are theirs
    const nth = other === "north";
    if (shared.length) { parts.push(nth ? `${shared.length === 1 ? `One of those is mine: ${low(ing(shared[0].t))}` : `${cap(n2w(shared.length))} of those are mine${shared.length > 2 ? ", including" : ":"} ${shared.slice(0, 2).map((j) => low(ing(j.t))).join(" and ")}`}.`
        : `${O} and I are on ${shared.length === 1 ? `${low(ing(shared[0].t))} together` : `${n2w(shared.length)} of those together: ${shared.slice(0, 2).map((j) => low(ing(j.t))).join(" and ")}`}.`);
      shared.forEach((j) => facts.push(nth ? `${AG[agN].n} owns or works on "${j.t}" (${stOf(j)})` : `${AG[agN].n} works with ${O} on "${j.t}" (${stOf(j)})`)); }
    if (mine[0]) { parts.push(`${shared.length ? "Separately, I’m" : "On my side, I’m"} ${low(ing(mine[0].t))}.`); facts.push(`${AG[agN].n} is on "${mine[0].t}" (${stOf(mine[0])})`); }
    if (!parts.length) { const top = jobs.filter((j) => j.ag === agN && j.st === "run").sort((x, y) => y.prog - x.prog)[0];
      parts.push(`Nothing on ${nth ? "that" : `${O}’s`} list touches mine${top ? `. I’m ${low(ing(top.t))}` : ""}.`); facts.push(`${AG[agN].n} has no jobs in the same lanes as ${O}'s list`); if (top) facts.push(`${AG[agN].n} is on "${top.t}" (${stOf(top)})`); }
    if (need) { parts.push(`I’d clear ${qt(need.t)} first, ${needs.length === 1 ? "it’s the only thing waiting on you" : "it’s waiting on you"}.`); facts.push(`waiting on the user: "${need.t}"`); }
    const rows = [...shared, ...mine, ...(need ? [need] : [])].filter((j, i, A) => A.findIndex((x) => x.id === j.id) === i); // each job once
    return { ag: agN, stay: true, text: parts.join(" "), facts, jobs: rows.slice(0, 5) };
  }
  // 4. asking about the agents' work or your own: answered from the jobs
  const workQ = isAsk(q) && (agN && /(work|doing|on|plate|breakdown|done|busy|up to|status|going)/i.test(q)
    || /\b(i|me|my)\b/i.test(q) && /(need to do|on me|waiting on me|should i|my plate|to ?do)/i.test(q)
    || PEOPLE.some(([n]) => new RegExp(`\\b${n}\\b`, "i").test(q)) && /(got going|working on|on (his|her|their) plate|up to|doing|done today|numbers|tracking|status|how('?s| is| are))/i.test(q));
  if (workQ) { const b = briefOf(q, jobs, "all"), person = PEOPLE.find(([n]) => new RegExp(`\\b${n}\\b`, "i").test(q));
    const chat = agN ? `${AG[agN].n}’s work` : person ? `${person[0]}’s work` : "What needs you";
    return { ...b, ag: agN || b.ag, chat }; }
  return null;
}
// what a running job is making, small: the thing itself as it comes together (the visuals drawing in, the doc writing, the
// chart), for a glance over its shoulder from Home. The same pieces its own window shows
const PEEK_D = { typeMs: 26 };
function PeekMade({ id }) {
  const [, tick] = useState(0); useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1200); return () => clearInterval(t); }, []);
  const j = naJobs().find((x) => x.id === id); if (!j) return null;
  const ps = NA.ps || PROJECTS.map((p) => ({ ...p, steps: p.steps.map((x) => ({ ...x })), prog: { sync: 0.55, forecast: 0.3, stall: 0.7 }[p.id], done: false, cm: {} })), p = j.deep && ps.find((q) => q.id === j.deep);
  const body = j.kind === "images" ? <ImageSet j={j} /> : p ? (p.id === "sync" ? <LiveDoc p={p} D={PEEK_D} /> : p.id === "forecast" ? <LiveForecast p={p} /> : <LiveStall p={p} D={PEEK_D} />) : <JobViz j={j} light />;
  return <div className="agx pk-agx"><div className={`stg2 is-light pg pk-pg is-${j.kind === "images" ? "img" : p ? "doc" : "viz"}`}>{body}</div></div>;
}
// a note while the work is still going: it goes in as the job's next step, and the agent says, in a line, what it'll change
const steerLocal = (j, note) => j.kind === "images" ? "Got it. I’ll work that into the one I’m drawing, then go back over the first two." : "Got it. I’ll work that in before I go on.";
async function naSteer(id, note) {
  const j = naJobs().find((x) => x.id === id); if (!j) return null;
  // the note goes in right after the step it's on and becomes the step it's on now; from here the job keeps moving on its own,
  // so you watch it pick back up (the steps tick on, the work fills in)
  naUpdate((JS) => JS.map((x) => { if (x.id !== id) return x; const th = [...(x.think || [])], n0 = th.filter((t) => !/^Starting on /.test(t)).length || 1;
    const k = Math.max(1, Math.ceil((x.prog || 0) * n0)) - 1, ins = th.length - n0 + k + 1;
    th.splice(ins, 0, `Working in your note: ${note.length > 60 ? note.slice(0, 60) + "…" : note}`);
    return { ...x, think: th, notes: [...(x.notes || []), note], steered: true, prog: Math.min(0.97, (k + 1.04) / (n0 + 1)) }; }));
  const sm = NA.sm || window.__northAgents?.sm;
  if (sm) try { const r = await sm.json([`You are ${AG[j.ag].n}, an AI teammate at Fello, partway through this job: "${j.t}". You're on: "${thoughtNow(j) || "the first step"}".`,
    `Your manager just sent this note while you work: "${note}"`, `Reply in one short plain sentence, first person, saying what you'll change. Never add numbers, names or facts that aren't in the note or the job.`,
    `Reply with JSON only: {"text": "<your sentence>"}`].join("\n"), { modelTier: "quick", cache: false });
    if (r && typeof r.text === "string" && r.text.trim()) return r.text.trim(); } catch (e) {}
  return steerLocal(j, note); }
if (typeof window !== "undefined") window.__northAgents = {
  Made: (p) => <PeekMade {...p} />, steer: (id, note) => naSteer(id, note),
  JobWork: (p) => <JobWork {...p} />,
  // a job as the chat's thread needs it: who owns it, its lane (what questions on it are about), where it is, what came out
  job(id) { const j = naJobs().find((x) => x.id === id) || (NA.raw || []).find((x) => x.id === id); if (!j) return null;
    const nm = rowOf(j).name || "", ln = LANE_N[j.lane] || ""; // viz: the chart the work already shows, by the title a chat card would give it
    return { id: j.id, t: j.t, ag: j.ag, st: j.st, lane: j.lane, laneN: ln, v: j.v || 1, d: j.st === "done" ? deliveryOf(j) : null, viz: ln && nm ? `${nm.replace(/\s*[–-]\s*\w+.*$/, "")} · ${ln}` : nm }; },
  isAsk: (t) => isAsk(t), rework: (id, note) => naRework(id, note),
  // the work's findings as plain text (what Copy, Share and Google Chat carry from the top of a job's window)
  workText(id) { const j = naJobs().find((x) => x.id === id) || (NA.raw || []).find((x) => x.id === id); if (!j) return ""; const F = findingsOf(j);
    return [j.t, F.desc, F.caption, ...F.extra].filter(Boolean).join("\n\n").replace(/\*\*/g, ""); },
  match(q, msgs, all) { const r = naMatch(q, msgs, all); if (!r) return null; const jobs = naJobs(), rows = (r.jobs || []).map((j) => rowOfJob(jobs.find((x) => x.id === j.id) || j)); return { ...r, jobs: rows, snap: Object.fromEntries(rows.map((x) => [x.id, stOf(jobs.find((j) => j.id === x.id) || x)])) }; },
  voice: (sm, r, q, hist) => voiceOf(sm, r, q, (hist || []).filter((m) => m.role === "user" || m.role === "agent").slice(-8).map((m) => ({ who: m.role === "user" ? "you" : m.agent, text: m.text })), naJobs()),
  jobs: () => naJobs(),
  // rows (as an agent's answer shows them) for the jobs that pass f, with their states, so a message can carry decisions
  rows: (f) => { const js = naJobs().filter(f), rows = js.map(rowOfJob); return { rows, snap: Object.fromEntries(js.map((j) => [j.id, stOf(j)])) }; },
  // what each agent is doing this minute: its furthest-along running job, the thought it's on, and how far it's got
  now: () => { const js = naJobs(); return IDS.map((ag) => { const run = js.filter((j) => j.ag === ag && j.st === "run").sort((a, b) => b.prog - a.prog), j = run[0];
    return { ag, n: AG[ag].n, role: AG[ag].role, count: run.length, t: j ? ing(j.t) : null, th: j ? thoughtNow(j) : null, prog: j ? j.prog : 0, step: j ? stepTxt(j) : null }; }); },
  share: SHARE, shareDone, seen: (id) => naSeen(id),
  // a job opened inside the chat: what it is, where it is, what came out of it, what's next. Only what the job already holds
  detail(id) { const j = naJobs().find((x) => x.id === id); if (!j) return null; const need = j.st === "need" && NEEDS.find((x) => x.id === j.need);
    const th = (j.think || []).filter((t) => !/^Starting on /.test(t)), k = j.st === "done" ? th.length : j.st === "run" ? Math.max(1, Math.ceil(j.prog * th.length)) - 1 : 0;
    const what = need ? need.rec : BRIEF[j.t] || BRIEF[j.t.split(" · ")[0]] || null;
    return { id: j.id, st: j.st, t: j.t, ag: j.ag, what, now: j.st === "run" ? thoughtNow(j) : null, steps: th.slice(0, k), step: j.st === "run" ? stepTxt(j) : null,
      worth: need ? WORTH[need.id] || null : null, done: j.st === "done" ? deliveryOf(j) : null, wait: j.st === "wait" ? j.wait : null, who: OWNERS[LANE_N[j.lane]] || LANE_N[j.lane], mine: !!j.mine,
      // the whole plan (what's done, what it's on, what's left) and what the work leads to, so a job's steps can be one list
      plan: th, k, next: NEXT[j.t] || null, led: LEADS.find((l) => l[0] === j.t)?.[1] || null, prog: j.prog || 0 }; },
  states(ids) { const js = naJobs(); return Object.fromEntries(ids.map((id) => { const j = js.find((x) => x.id === id); return [id, j ? j.st : "gone"]; })); },
  // a watched job moved. Done = a delivery: what was asked for comes back with its result. Anything else is one quiet line
  changed(id, from) { const j = naJobs().find((x) => x.id === id); if (!j) return null; const T = cap(ing(j.t)); AGE[j.id] = 0; // it just happened
    if (j.st === "done") {
      return { ag: j.ag, done: deliveryOf(j), row: rowOfJob(j) }; }
    const text = j.st === "need" ? `${T} needs you now.` : j.st === "run" && from === "need" ? `${T} is approved and moving.` : null;
    return text && { ag: j.ag, text, row: rowOfJob(j) }; },
  decide(id, yes) { const j = naJobs().find((x) => x.id === id); if (!j || j.st !== "need") return null;
    if (!yes) return { ag: j.ag, text: `No problem, I’ll hold off. It stays in your list for when you’re ready.`, facts: [`the user said not now to "${j.t}"`], jobs: [], snap: {} };
    const r = replyOf("go ahead", j.ag, { jobs: [j] }), n = NEEDS.find((x) => x.id === j.need); naApprove(j);
    const started = n?.propose ? naJobs().find((x) => x.t === n.propose)?.id : n?.start ? naJobs().find((x) => x.t === n.start[0] && x.st === "run")?.id : null; // saying yes started this one
    const ck = BOOK.checks.find((x) => x.id === j.need), w = ck && ck.watch[0];
    const text = ck ? `${r.text.replace(/\s*$/, "")} I’ll check back on ${ck.due} to see if it worked: ${w[0]} is ${w[1]}${w[2] ? ` (${w[2]})` : ""} today.` : r.text;
    return { ...r, text, facts: [...(r.facts || []), ck && `check-in on ${ck.due}: ${ck.watch.map((x) => `${x[0]} ${x[1]}`).join(", ")} today`].filter(Boolean), ag: j.ag, jobs: [], snap: {}, actedOn: n?.propose || j.t, started }; },
  // prototype: start one of your jobs and have it land a few seconds later, to see the notice. It's real work from the
  // lane's own "close the gap" list, so the job it leaves behind is one the floor would have offered anyway
  demoLand() { const st = seatOf(), lane = st ? st.lanes[0] : 1, live = new Set(naJobs().filter((j) => j.st !== "done").map((j) => j.t));
    const L = GAP_JOBS[LANE_N[lane]] || GAP_JOBS._, free = L.filter((x) => !live.has(x[0])), pick = (free.length ? free : L)[(NA.demoI = (NA.demoI || 0) + 1) % (free.length || L.length)];
    const id = naAdd(pick[0], [pick[1]], lane); setTimeout(() => naUpdate((JS) => JS.map((x) => (x.id === id ? { ...x, st: "done", prog: 1, at: "Just now", demo: true } : x))), 3400); return id; },
  // a watched job in a line: where it stands, said plainly (an approval says what it did and when it gets checked)
  watchOf(id) { const j = naJobs().find((x) => x.id === id) || (NA.raw || []).find((x) => x.id === id); if (!j) return null; const a = AG[j.ag], ck = j.need && BOOK.checks.find((x) => x.id === j.need);
    const line = j.st === "done" && j.approved ? `${(DONE[j.need] || "Done.").split(/(?<=\.)\s/)[0]}${ck ? ` Checking ${ck.due}.` : ""}` : j.st === "done" ? `${a.n} finished it` : j.st === "run" ? `${a.n} · ${stepTxt(j)}` : j.st === "wait" ? j.wait : j.st === "queue" ? `${a.n} · up next` : "Needs your call";
    const th = (j.think || []).filter((x) => !/^Starting on /.test(x)), find = j.st === "done" ? ([...th].reverse().find((x) => !/^\w+ing\b/.test(x)) || null) : null;
    return { id: j.id, t: j.t, st: j.st, ag: j.ag, line, find, approved: !!j.approved, demo: !!j.demo }; },
  // start a job from a conversation (a huddle on an account keeps working on it); it runs on the floor like any other
  start: (t, ags, lane = 2, think) => naAdd(t, ags, lane, think),
  JobModal: (p) => JobModal(p),
  needJob(need) { const j = (NA.raw || FLOOR0).find((x) => x.need === need && !x.arch); return j ? j.id : null; },
  open(id) { NA.pendingOpen = id; if (NA.open) { NA.open(id); NA.pendingOpen = null; } else window.__northNav?.("agents"); },
};

// off the Agents page the floor isn't drawn, but what you set in motion keeps going: your watched jobs move on their own clock
if (typeof window !== "undefined") setInterval(() => { if (NA.setRaw) return; const JS = NA.raw || FLOOR0;
  // a job you sent a note into keeps going after it, a little at a time, so its steps and its work visibly move on
  if (JS.some((j) => j.steered && j.st === "run" && !j.arch)) NA.raw = (NA.raw || FLOOR0).map((j) => (j.steered && j.st === "run" && !j.arch ? (j.prog + 0.02 < 1 ? { ...j, prog: j.prog + 0.02 } : { ...j, st: "done", prog: 1, at: "Just now" }) : j));
  const J2 = NA.raw || FLOOR0;
  if (!J2.some((j) => j.watchBy && j.st === "run" && !j.deep && !j.arch)) return;
  NA.raw = J2.map((j) => { if (!j.watchBy || j.st !== "run" || j.deep || j.arch) return j; const prog = j.prog + 0.09; if (prog < 1) return { ...j, prog }; AGE[j.id] = 0; return { ...j, st: "done", prog: 1, at: "Just now" }; }); }, 2000);
// the list: grouped by what you need from it, newest first inside each group. One line of title, one quiet line under it
// (the agent's live thought while it works, otherwise who and where), the time on the right. Agent and lane are metadata.
const AGE = {}; // minutes since each job started or finished (example values, stable per job)
const ageOf = (j) => (AGE[j.id] ??= j.id[0] === "u" ? 0 : j.st === "done" ? 20 + ((j.id.charCodeAt(1) * 37) % 200) : j.st === "need" ? 5 + (j.id.charCodeAt(1) % 30) : 2 + ((j.id.charCodeAt(1) * 13) % 90));
const agoT = (m) => (m < 1 ? "just now" : `${ago(m)} ago`);
const ago = (m) => (m < 1 ? "now" : m < 60 ? `${m}m` : m < 60 * 24 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`);
const GROUPS = [["need", "Needs you"], ["run", "Working"], ["wait", "Waiting"], ["queue", "Up next"], ["done", "Done today"]];
function Row({ j, D, onOpen, sel }) {
  const a = AG[j.ag], th = j.think && j.think[Math.min(j.think.length - 1, Math.floor(j.prog * j.think.length))];
  return (
    <motion.li layout="position" transition={D.reflow} className={`lr is-${j.st}${sel ? " is-sel" : ""}`} onClick={() => onOpen(j)}>
      <span className="lr-g">{j.st === "run" ? <svg className="lr-spin" width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1.6 2.1" /></svg> : <i />}</span>
      <span className="lr-b">
        <span className="lr-t">{j.t}</span>
        <span className="lr-m">{j.st === "run" && th ? <><span className="lr-who">{a.n}</span><Typed key={th} text={th} ms={D.typeMs} /></> : j.st === "wait" ? <>{a.n}<i className="sep">·</i>{j.wait}</> : <>{a.n}<i className="sep">·</i>{LANE_N[j.lane]}</>}</span>
      </span>
      <span className="lr-r">{j.st === "run" ? <span className="lr-p"><i style={{ width: `${j.prog * 100}%` }} /></span> : null}<time>{j.st === "queue" ? "" : ago(ageOf(j))}</time></span>
    </motion.li>
  );
}
function Floor({ D, jobs, scope, onOpen, openId }) {
  const [ag, setAg] = useState(null);
  const vis = jobs.filter((j) => inS(j, scope) && (!ag || j.ag === ag));
  return (
    <div className="ls">
      <div className="ls-f">{[null, ...IDS].map((id) => <button key={id || "all"} className={ag === id ? "is-on" : ""} onClick={() => setAg(id)}>{id ? <><Orb id={id} size={12} />{AG[id].n}</> : "All agents"}</button>)}</div>
      <LayoutGroup>
        {GROUPS.map(([st, l]) => { const g = vis.filter((j) => j.st === st).sort((x, y) => ageOf(x) - ageOf(y)); if (!g.length) return null;
          return <section key={st} className={`ls-g is-${st}`}><h5>{l}<span>{g.length}</span></h5><ol>{g.map((j) => <Row key={j.id} j={j} D={D} onOpen={onOpen} sel={openId === j.id} />)}</ol></section>; })}
      </LayoutGroup>
    </div>
  );
}
// a job opened: a panel over the board (the rail stays, so you keep your place). Three levels, top to bottom:
// what it is and where it stands; the thing itself (or, for a decision, the call to make); how it's thinking and what's next.
// Steering is always in the same place, at the bottom.
const ST_PILL = { run: "Working", need: "Needs you", wait: "Waiting", queue: "Up next", done: "Done" };
function Sheet({ j, D, ps, setPs, onClose, onOpenNeed }) {
  const a = AG[j.ag], p = j.deep && ps.find((q) => q.id === j.deep), need = j.st === "need" && NEEDS.find((x) => x.id === j.need);
  const [txt, setTxt] = useState(""), [notes, setNotes] = useState([]);
  const send = () => { const v = txt.trim(); if (!v) return; setNotes((N) => [...N, { you: v }]); setTxt(""); setTimeout(() => setNotes((N) => N.map((n, i) => (i === N.length - 1 ? { ...n, it: "Got it. Working that in now." } : n))), 1200); };
  const th = j.think || [];
  return (
    <>
      <motion.div className="sh-dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose} />
      <motion.aside className="sh2" initial={{ opacity: 0, y: 12, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.99 }} transition={D.zoom}>
        <header className="sh2-h">
          <Orb id={j.ag} size={30} live={j.st === "run"} />
          <div className="sh2-ht"><span className="sh2-meta">{a.n}<i className="sep">·</i>{a.role}<i className="sep">·</i>{LANE_N[j.lane]}</span><h3>{j.t}</h3></div>
          <span className={`sh2-pill is-${j.st}`}>{ST_PILL[j.st]}{j.st === "run" ? ` · ${Math.round(j.prog * 100)}%` : ""}</span>
          <button className="sh-x" onClick={onClose} aria-label="Close">×</button>
        </header>
        {j.st === "run" && <span className="sh2-bar"><i style={{ width: `${j.prog * 100}%`, background: ORB_C[j.ag] }} /></span>}
        <div className="sh2-body">
          <section className="sh2-main">
            <h6>{need ? "The call to make" : p ? "What it’s making" : j.st === "done" ? "What it found" : j.st === "wait" ? "Why it’s waiting" : j.st === "queue" ? "The brief" : "Where it’s at"}</h6>
            {need ? <div className="sh2-need"><p>{need.rec}</p><div className="nd-a"><button className="btn-pri" onClick={() => onOpenNeed(j.need)}>{need.act}</button><button className="btn-sec" onClick={() => onOpenNeed(j.need)}>See the work</button></div>
                {need.answer && <><h6 className="sh2-h6b">Why</h6><p className="sh2-why">{need.answer}</p></>}{need.stats && <dl className="sh2-st">{need.stats.map(([k, v, d]) => <div key={k}><dt>{k}</dt><dd><b>{v}</b><small>{d}</small></dd></div>)}</dl>}</div>
              : p ? (p.id === "sync" ? <LiveDoc p={p} D={D} /> : p.id === "forecast" ? <LiveForecast p={p} /> : <LiveStall p={p} D={D} />)
              : j.st === "wait" ? <p className="sh2-lead">{j.wait}. {a.n} picks it back up as soon as that’s in.</p>
              : j.st === "queue" ? <p className="sh2-lead">{a.n} starts this when the job ahead of it in {LANE_N[j.lane]} finishes. Change the brief now and it starts from yours.</p>
              : <p className="sh2-lead">{th.length ? th[Math.min(th.length - 1, j.st === "done" ? th.length - 1 : Math.floor(j.prog * th.length))] : "Finished and filed in the Library."}</p>}
          </section>
          <section className="sh2-aside">
            {p ? <Thinking p={p} id={j.ag} D={D} setPs={setPs} /> : <>
              {need?.work && <><h6>How {a.n} got there</h6><ol className="sh2-th is-work">{need.work.map((w) => <li key={w.s}><b>{w.s}</b>{w.f}</li>)}</ol></>}
              {th.length > 0 && !need?.work && <><h6>{a.n}’s thinking</h6>
              <ol className="sh2-th">{(j.st === "done" ? th : th.slice(0, Math.max(1, Math.ceil(j.prog * th.length)))).map((t, i, arr) => <li key={t} className={i === arr.length - 1 && j.st === "run" ? "is-now" : ""}>{t}</li>)}</ol></>}
              <h6>Details</h6>
              <dl className="sh2-dl"><dt>Lane</dt><dd>{LANE_N[j.lane]}</dd><dt>Agent</dt><dd>{a.n}, {a.role}</dd><dt>{j.st === "done" ? "Finished" : j.st === "queue" ? "Queued" : "Started"}</dt><dd>{ageOf(j) < 1 ? "Just now" : agoT(ageOf(j))}</dd><dt>For</dt><dd>{j.mine ? "You" : "The company"}</dd></dl>
            </>}
            {notes.map((n, i) => <div key={i} className="tk2-r"><span><b>You</b> {n.you}</span>{n.it ? <span><Orb id={j.ag} size={14} />{n.it}</span> : <span className="is-wait"><Orb id={j.ag} size={14} live />{a.n} is reading…</span>}</div>)}
          </section>
        </div>
        <footer className="sh2-f">
          <div className="sh2-in"><Orb id={j.ag} size={16} /><input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={`Steer ${a.n}: tell it what to change…`} onKeyDown={(e) => e.key === "Enter" && send()} /><button className="btn-pri" disabled={!txt.trim()} onClick={send}>Send</button></div>
          <div className="sh2-acts"><button>Pause</button><button>Hand to…</button><button>Change the brief</button></div>
        </footer>
      </motion.aside>
    </>
  );
}

// ---------------------------------------------------------------- the board, as a system
// Top to bottom, the way work moves: the agents, the live lines of work coming off them, the company's seven lanes.
// Only live work is drawn. A line appears when an agent starts on a lane and goes when it's done, so every lit line
// means "this is happening now", in that agent's colour. A new job rides its line down as a small tag. Each lane
// carries the number its work is moving (from Company health), and that number lights when a job lands.
const BU = 34, C30 = 0.8660254;
const ORB_C = { orin: "#8ea2f2", riley: "#7fd0a3", calvin: "#e7949f", marco: "#f2a0cc", fia: "#f0cd7a" }; // each agent's hue, from the glow in its chest
const ORB_L = { orin: "#6f86e6", riley: "#5fbf8a", calvin: "#d97786", marco: "#ea86bd", fia: "#e2b552" }; // the same hues on a light ground: just deep enough to read, still soft
const PADS = { marco: -11, orin: -5.5, riley: 0, calvin: 5.5, fia: 11 };
// the walkway the crew stands on, in board units: along the row (t), its depth around the agents' row (s), and how high it sits
const DECK = { t0: -14, t1: 14, s0: -0.75, s1: 0.75, z: 0.16 };
const S_AG = 0, BLD_W = 1.25, LANE_T = (i) => -12 + i * 4;
const FH = 0.5;
const FLOOR_ORDER = { done: 0, need: 1, run: 2, wait: 3, queue: 4 };
// the number each lane's work moves, straight from the Company health heatmap (row index into LANES[i][3], short name)
const LANE_KPI = [[0, "Booked ARR"], [0, "Booked ARR"], [0, "New ARR"], [2, "TTV: 10 handoffs"], [0, "GRR"], [0, "Expansion ARR"], [1, "Daily active users"]];
// a team's standing in words: "23% of pace", "93% of target", "5.9d over"
const laneSaid = (li) => { const row = HLANES[li][3][LANE_KPI[li][0]], ref = row[4].split(" ")[0]; return /%$/.test(row[3]) ? `${row[3]} of ${ref}` : row[3]; };
const kpiOf = (i) => { const [r, n] = LANE_KPI[i], row = HLANES[i][3][r]; return { n, v: row[1], s: row[3], p: row[2] }; };
// a lane's number as a progress bar, in the same language as Home's goals and the heatmap: value, where it stands, how full,
// and the pace mark where there is one. All of it from Company health.
const GOAL_C = { dark: { on: "#7cc4c9", behind: "#b4a1ff", off: "#ff8a7a", none: "rgba(233,238,243,.4)" }, light: { on: "#098486", behind: "#744ccb", off: "#b1042f", none: "#8a8a8a" } }; // North's own status colours
// the ticks from Home's Booked ARR chart, small: filled ticks are what's done, the grey run is the shortfall to pace,
// the pace tick is marked, the rest of the target is an outline
const NT = 56;
// drawn in SVG so they take the same grain as Home's charts. Each tick is thin, with air between, like the Booked ARR ticks
const TK_SWEEP = 0.45; // s from the first tick to the last
export function TickRow({ n, marks, h = 12, wf = 0.5 }) { // marks(i) -> { fill, kind: "on" | "gap" | "pace" | "off" }; wf: tick width as a share of its pitch
  const W = 100, pitch = W / n, tw = Math.max(0.3, pitch * wf);
  return (
    <svg className="tk" viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" height={h}>
      <g filter="url(#grain)">{Array.from({ length: n }, (_, i) => { const m = marks(i), x = i * pitch + (pitch - tw) / 2;
        // one quick sweep, left to right, the whole row at once (filled and empty alike), done in about half a second
        // however many ticks there are; nothing sits there before its turn
        const d = 0.05 + (i / n) * TK_SWEEP, tr = { duration: 0.3, ease: [0.16, 1, 0.3, 1], delay: d };
        return m.kind === "off" ? <motion.rect key={i} x={x} y={0.25} width={tw} height={h - 0.5} rx={0.3} fill="none" className="tk-off" vectorEffect="non-scaling-stroke" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: d }} />
          : <motion.rect key={i} x={x} width={tw} rx={0.3} fill={m.fill} className={`tk-${m.kind}`} initial={{ y: h * 0.55, height: h * 0.45, opacity: 0 }} animate={{ y: 0, height: h, opacity: 1 }} transition={tr} />; })}</g>
    </svg>
  );
}
function Ticks({ p, mark, col, nt = NT, h, wf }) {
  const NT = nt, n = Math.round(Math.min(100, p ?? 0) / 100 * NT), pace = mark != null ? Math.max(1, Math.round(mark * NT)) : null;
  return <TickRow n={NT} h={h} wf={wf} marks={(i) => { const k = i + 1; return k <= n ? { kind: "on", fill: col } : pace && k < pace ? { kind: "gap", fill: "var(--trk)" } : pace === k ? { kind: "pace", fill: "var(--coral)" } : { kind: "off" }; }} />;
}
// an agent's day as ticks, one per job: done in its colour, running half-lit, still to come as an outline
function AgentTicks({ id, mine }) { // the same 30 ticks as the lanes: share done in its colour, share in hand half-lit, the rest an outline
  const n = mine.length || 1, d = Math.round((mine.filter((j) => j.st === "done").length / n) * NT), r = Math.round((mine.filter((j) => j.st === "run" || j.st === "need").length / n) * NT);
  return <TickRow n={NT} h={10} marks={(i) => (i < d ? { kind: "on", fill: ORB_C[id] } : i < d + r ? { kind: "gap", fill: "var(--trk)" } : { kind: "off" })} />;
}
const ORDER_T = { done: 0, run: 1, need: 2, wait: 3, queue: 4 };
// Each lane's number gets the picture that matches what kind of number it is (all values from Company health):
//  · running total toward a month's target (Booked ARR, New ARR, Expansion ARR): ticks fill up to what's booked,
//    the grey run is the shortfall to today's pace, the coral tick is pace, the outline is the rest of the target.
//  · a level against a target (Daily active users, GRR): no "fill up" – the value is a point on the scale with the
//    target tick beside it, so above or below reads at a glance.
//  · a ceiling where lower is better (TTV): the allowance up to the ceiling, and anything past it in the off colour.
const numOf = (t) => { const m = String(t).replace(/,/g, "").match(/(-?[0-9]*\.?[0-9]+)\s*([KMB])?/); if (!m) return NaN; return parseFloat(m[1]) * ({ K: 1e3, M: 1e6, B: 1e9 }[m[2]] || 1); };
// say a number the way its source says it: money in K or M, everything else in the source's own unit and decimals
const unitOf = (like) => { const m = String(like).match(/([KMB])\b/); return m ? { K: 1e3, M: 1e6, B: 1e9 }[m[1]] : 1; };
function fmtAs(like, x) { const L = String(like).replace(/^(pace|target|ceiling)\s+/, ""), money = /^\$/.test(L), u = unitOf(L);
  if (money && u > 1) { const a = Math.abs(x); return a === 0 ? "$0" : a >= 1e6 ? `$${+(x / 1e6).toFixed(2)}M` : `$${+(x / 1e3).toFixed(1)}K`; }
  const m = L.match(/^([^0-9−-]*)([0-9][0-9,]*\.?[0-9]*)(.*)$/); if (!m) return String(+x.toFixed(2)); const dp = (m[2].split(".")[1] || "").length;
  let t = (x / u).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }); if (/\.0+$/.test(t)) t = t.replace(/\.0+$/, ""); return `${m[1]}${t}${m[3]}`; }
// is lower better for this row? A ceiling always; otherwise when it's under its mark and still scored at or above 100%
const lowerOf = (row) => { const k = kindOf(row), v = numOf(row[1]), r = numOf(row[4]); return k === "ceil" || (row[2] != null && v !== r && (v < r) === (row[2] >= 100)); };
function kindOf(row) { const foot = row[4]; return foot.startsWith("ceiling") ? "ceil" : row[5] != null ? "sum" : "level"; }
// the number a job is about: a Company health row in its lane whose words all appear in the job's title; else the lane's main one
const toks = (t) => t.toLowerCase().replace(/[–—:+,()%$]/g, " ").replace(/-/g, " ").split(/\s+/).filter(Boolean);
const ROW_ALIAS = { "Rank at-risk accounts by who to call first": "At-risk ARR", "Approve QBR invites for 4 quiet renewals": "At-risk ARR", "Group new customers by first contract": "TTV: 10 handoffs" };
function rowOf(j) { const T = new Set(toks(j.t)), rows = HLANES[j.lane][3];
  const al = j.row && rows.find((r) => r[0] === j.row); if (al) return { row: al, name: al[0], own: true };
  const hit = rows.find((r) => r[2] != null && toks(r[0]).every((w) => T.has(w)));
  return { row: hit || rows[LANE_KPI[j.lane][0]], name: hit ? hit[0] : LANE_KPI[j.lane][1], own: !!hit }; }
function Goal({ li, light, onEnter, onLeave, job }) {
  const pick = job ? rowOf(job) : null, row = pick ? pick.row : HLANES[li][3][LANE_KPI[li][0]], [, v, p, s, foot, mark] = row, kind = kindOf(row), C = GOAL_C[light ? "light" : "dark"];
  const st = kind === "ceil" ? "off" : hStatus(p), col = C[st];
  const val = numOf(v), ref = numOf(foot);
  return (
    <div className="gl" onPointerEnter={onEnter} onPointerLeave={onLeave}>
      <div className="gl-h"><span>{LANE_N[li]}<i className="sep">·</i>{pick ? pick.name : LANE_KPI[li][1]}</span><b>{v}</b><em style={{ color: col }}>{s}</em></div>
      {kind === "sum" ? <Ticks p={p} mark={mark} col={col} />
        : kind === "ceil" ? <CeilTicks val={val} ceil={ref} col={col} />
        : <LevelTicks val={val} tgt={ref} col={col} pct={val / ref} />}
      <small>{kind === "ceil" ? `${foot} · lower is better` : kind === "level" ? `${foot} · ${val >= ref ? "above" : "below"} it` : foot}</small>
    </div>
  );
}
// the target sits at a fixed spot (three-quarters along); the value is a lit run ending where it lands against it
function LevelTicks({ val, tgt, col, pct }) {
  const T = Math.round(NT * 0.75), at = Math.max(1, Math.min(NT, Math.round(T * pct)));
  return <TickRow n={NT} marks={(i) => { const k = i + 1; return k === T ? { kind: "tgt", fill: "var(--f1)" } : k <= at ? { kind: "on", fill: col } : { kind: "off" }; }} />;
}
// the ceiling sits at 60%: ticks up to it are the allowance (neutral), past it the overage in the off colour
function CeilTicks({ val, ceil, col }) {
  const C = Math.round(NT * 0.6), at = Math.max(1, Math.min(NT, Math.round(C * (val / ceil))));
  return <TickRow n={NT} marks={(i) => { const k = i + 1; return k === C ? { kind: "tgt", fill: "var(--f1)" } : k <= Math.min(at, C) ? { kind: "gap", fill: "var(--f3)" } : k <= at ? { kind: "on", fill: col } : { kind: "off" }; }} />;
}
// ---------------------------------------------------------------- the right picture for each number, in a job's receipt
// The same chart forms as the Company board, drawn for the dark card, at real pixel size so the labels stay crisp:
//  · a running total with a daily history (New logos, Expansion ARR): the month as a line – what's been booked as a tick-striped
//    area, pace as a straight line to the target, today's gap marked, the rest of the month dashed at today's rate
//  · a running total without history (Booked ARR, New ARR, …): the ticks, with pace and the target named
//  · a win rate: two tick rings, what's won against the target, as a share of the whole
//  · a level against a target (held rate, DAU, health): a ruler, the value and the target on one scale, the gap lit
//  · a ceiling where lower is better (TTV): two stems on a days axis, and the overrun between them
// Histories are the board's own (visuals.jsx); everything else is from Company health.
const SERIES = {
  "New logos": { pts: [[1, 0], [6, 11], [13, 24], [20, 40], [27, 55]], tgt: 85, today: 27, f: (v) => `${Math.round(v)}` },
  "Expansion ARR": { pts: [[1, 0], [6, 95], [13, 260], [20, 480], [27, 734]], tgt: 1174, today: 27, f: (v) => (v >= 1000 ? `$${(v / 1000).toFixed(2)}M` : `$${Math.round(v)}K`) },
};
function useW(ref, d = 520) { const [w, setW] = useState(d);
  useLayoutEffect(() => { const el = ref.current; if (!el) return; setW(Math.round(el.getBoundingClientRect().width) || d); const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width) || d)); ro.observe(el); return () => ro.disconnect(); }, []);
  return w; }
const fmtLike = (like, x) => { const m = String(like).match(NUM); if (!m) return String(x); const dp = (m[2].split(".")[1] || "").length; let t = x.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }); if (/\.0+$/.test(t)) t = t.replace(/\.0+$/, ""); return `${m[1]}${t}${m[3]}`; };
const VE = [0.16, 1, 0.3, 1];
const niceStep = (r) => { const e = Math.pow(10, Math.floor(Math.log10(r))), m = r / e; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * e; };
function VizText({ x, y, a = "start", c = "var(--f3)", w = 500, children }) { return <text x={x} y={y} textAnchor={a} fill={c} fontSize={11} fontWeight={w} style={{ fontVariantNumeric: "tabular-nums" }}>{children}</text>; }
function JobViz({ j, light }) {
  const { row, name } = rowOf(j), [, v, p, , foot, mark] = row, kind = kindOf(row), C = GOAL_C[light ? "light" : "dark"];
  const col = C[kind === "ceil" ? "off" : hStatus(p)], val = numOf(v), ref = numOf(foot), refV = foot.replace(/^\S+\s+/, ""), refK = foot.split(" ")[0], lb = lowerOf(row);
  const box = useRef(null), W = useW(box);
  let body = null, H = 0, legend = null;
  if (SERIES[name]) {
    const S = SERIES[name], top = 8, base = 96, maxV = S.tgt * 1.06; H = 118;
    const X = (d) => 2 + ((d - 1) / 30) * (W - 4), Y = (q) => base - ((base - top) * q) / maxV;
    const now = S.pts[S.pts.length - 1][1], pace = (S.tgt * (S.today - 1)) / 30, proj = (now / S.today) * 31;
    const area = `M${X(1)} ${base}` + S.pts.map(([d, q]) => `L${X(d)} ${Y(q)}`).join("") + `L${X(S.today)} ${base}Z`, id = `ar-${j.id}`;
    const stripes = []; for (let x = X(1) + 1; x < X(S.today); x += 4) stripes.push(x);
    const tx = X(S.today);
    legend = [[<i className="jv-sw is-area" style={{ color: col }} />, `${v} so far`], [<i className="jv-sw is-line" />, `Pace ${refV} by today`], [<i className="jv-sw is-dash" style={{ color: col }} />, `${S.f(proj)} by Oct 31 at this rate`], [<i className="jv-sw is-dot" />, `Target ${S.f(S.tgt)}`]];
    body = (<>
      <defs><clipPath id={id}><path d={area} /></clipPath></defs>
      <line x1={0} x2={W} y1={base + 0.5} y2={base + 0.5} stroke="var(--cardln)" />
      <motion.g clipPath={`url(#${id})`} filter="url(#grain)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
        {stripes.map((x) => <rect key={x} x={x} y={top} width={1.5} height={base - top} fill={col} />)}
      </motion.g>
      <motion.path d={`M${X(1)} ${Y(0)}L${X(31)} ${Y(S.tgt)}`} stroke="var(--coral)" strokeWidth={1.25} fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: VE }} />
      <motion.path d={`M${tx} ${Y(now)}L${X(31)} ${Y(proj)}`} stroke={col} strokeWidth={1.25} strokeDasharray="2 3" strokeLinecap="round" fill="none" initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 0.7 }} />
      <line x1={tx} x2={tx} y1={Y(now)} y2={Y(pace)} stroke="var(--coral)" strokeWidth={2} />
      <circle cx={tx} cy={Y(pace)} r={3} fill="var(--coral)" />
      <circle cx={tx} cy={Y(now)} r={4} fill={col} />
      <circle cx={X(31) - 2} cy={Y(S.tgt)} r={3} fill="var(--coral)" />
      <VizText x={0} y={H - 4}>Oct 1</VizText><VizText x={tx} y={H - 4} a="middle" c="var(--f2)">Today</VizText><VizText x={W} y={H - 4} a="end">Oct 31</VizText>
    </>);
  } else if (/^win rate/i.test(name)) {
    H = 132; const cx = 66, cy = 66, ro = 58, ri = 38, sw = 13, id = `wr-${j.id}`;
    const dash = (r) => { const per = (2 * Math.PI * r) / 72; return `${per * 0.42} ${per * 0.58}`; };
    const ring = (r, f, c, d) => (<g key={r} transform={`rotate(-90 ${cx} ${cy})`}>
      <mask id={`${id}-${r}`}><motion.circle cx={cx} cy={cy} r={r} fill="none" stroke="#fff" strokeWidth={sw + 2}
        initial={{ pathLength: 0 }} animate={{ pathLength: f }} transition={{ duration: 1, ease: VE, delay: d }} /></mask>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--trk)" strokeWidth={sw} strokeDasharray={dash(r)} />
      <g mask={`url(#${id}-${r})`}><circle cx={cx} cy={cy} r={r} fill="none" stroke={c} strokeWidth={sw} strokeDasharray={dash(r)} filter="url(#grain)" /></g>
    </g>);
    const lx = 156;
    body = (<>
      {ring(ro, val / 100, col, 0.1)}{ring(ri, ref / 100, "var(--f1)", 0.25)}
      <circle cx={lx} cy={52} r={4} fill={col} /><VizText x={lx + 12} y={56} c="var(--f1)">{`${v} won`}</VizText>
      <circle cx={lx} cy={80} r={4} fill="var(--f1)" /><VizText x={lx + 12} y={84} c="var(--f2)">{`${refV} target`}</VizText>
      <VizText x={lx + 12} y={108}>Share of deals that close</VizText>
    </>);
  } else if (kind === "level") {
    H = 70; const d = Math.abs(val - ref) || Math.max(val, ref) * 0.1, lo0 = Math.max(0, Math.min(val, ref) - 2.2 * d), hi0 = Math.max(val, ref) + 1.4 * d;
    const st = niceStep((hi0 - lo0) / 4), lo = Math.floor(lo0 / st) * st, hi = Math.ceil(hi0 / st) * st;
    const X = (q) => ((q - lo) / (hi - lo)) * (W - 2) + 1, n = Math.floor(W / 4), ty = 26, th = 22, ahead = lb ? val <= ref : val >= ref, right = val >= ref;
    const a = Math.min(val, ref), b = Math.max(val, ref);
    body = (<>
      <g filter="url(#grain)">{Array.from({ length: n }, (_, i) => { const x = i * 4 + 1, q = lo + ((x - 1) / (W - 2)) * (hi - lo), on = q <= val, gap = q > a && q < b;
        return <motion.rect key={i} x={x} width={1.5} fill={on ? col : gap ? (ahead ? col : "var(--coral)") : "var(--trk)"} opacity={!on && gap ? 0.8 : 1}
          initial={{ y: ty + th, height: 0 }} animate={{ y: ty, height: th }} transition={{ duration: 0.45, ease: VE, delay: 0.05 + i * 0.004 }} />; })}</g>
      <line x1={X(ref)} x2={X(ref)} y1={ty - 6} y2={ty + th + 4} stroke="var(--f1)" strokeWidth={1.5} />
      <VizText x={X(ref) + (right ? -8 : 8)} y={ty - 10} a={right ? "end" : "start"} c="var(--f1)">{`${cap(refK)} ${refV}`}</VizText>
      <VizText x={X(val) + (right ? 8 : -8)} y={ty - 10} a={right ? "start" : "end"} c={col}>{v}</VizText>
      <VizText x={0} y={H - 2}>{fmtAs(v, lo)}</VizText><VizText x={W} y={H - 2} a="end">{lb ? "Lower is better" : fmtAs(v, hi)}</VizText>
    </>);
  } else if (kind === "ceil") {
    H = 96; const days = /d$/.test(v.trim()), st0 = niceStep(Math.max(val, ref) * 1.35 / 3), max = days ? Math.ceil((Math.max(val, ref) * 1.35) / 10) * 10 : Math.ceil((Math.max(val, ref) * 1.35) / st0) * st0, X = (q) => (q / max) * (W - 2) + 1, base = 72, top = 30;
    const under = val <= ref, colV = under ? C.on : col;
    body = (<>
      <line x1={0} x2={W} y1={base + 0.5} y2={base + 0.5} stroke="var(--cardln)" />
      {Array.from({ length: 31 }, (_, i) => <rect key={i} x={X((i / 30) * max)} y={base - (i % 5 ? 3 : 6)} width={1} height={i % 5 ? 3 : 6} fill="var(--f3)" opacity={0.6} />)}
      <motion.rect x={Math.min(X(ref), X(val))} y={base - 14} height={14} fill={val > ref ? col : C.on} opacity={val > ref ? 1 : 0.5} filter="url(#grain)" initial={{ width: 0 }} animate={{ width: Math.abs(X(val) - X(ref)) }} transition={{ duration: 0.8, ease: VE, delay: 0.3 }} />
      <line x1={X(ref)} x2={X(ref)} y1={top} y2={base} stroke="var(--f1)" strokeWidth={1.25} /><circle cx={X(ref)} cy={top} r={3.5} fill="var(--f1)" />
      <motion.g initial={{ x: X(ref) - X(val), opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.8, ease: VE, delay: 0.3 }}>
        <line x1={X(val)} x2={X(val)} y1={top} y2={base} stroke={colV} strokeWidth={1.25} /><circle cx={X(val)} cy={top} r={3.5} fill={colV} />
        <VizText x={X(val) + (under ? -8 : 8)} y={top + 4} a={under ? "end" : "start"} c={colV}>{`${v} now`}</VizText>
      </motion.g>
      <VizText x={X(ref) + (under ? 8 : -8)} y={top + 4} a={under ? "start" : "end"} c="var(--f1)">{`Ceiling ${refV}`}</VizText>
      {[0, max / 2, max].map((q) => <VizText key={q} x={q === 0 ? 0 : q === max ? W : X(q)} y={H - 2} a={q === 0 ? "start" : q === max ? "end" : "middle"}>{days ? (q === 0 ? "0 days" : `${q} days`) : fmtAs(v, q)}</VizText>)}
    </>);
  }
  if (body) return <div ref={box} className="jv">{legend && <div className="jv-lg">{legend.map(([m, t]) => <span key={t}>{m}{t}</span>)}</div>}<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name}: ${v} against ${foot}`}>{body}</svg></div>;
  // running total, no history: the big number, then the ticks at full height (one tick a slice of the month's target), pace
  // called out over its tick with a dot, $0 and the target under the ends. Same chart as the chat's Booked ARR card
  const tgtV = mark ? fmtAs(refV, ref / mark) : null;
  return <div ref={box} className="jv is-tk"><BigTicks big={v} col={col} done={(p ?? 0) / 100 * (mark || 1)} pace={mark} paceL={`Pace ${refV}`} left={fmtAs(v, 0)} right={tgtV ? `${tgtV} October target` : null} w={W} /></div>;
}
// the running-total ticks, sized to be read at a glance: ~55 ticks, 96px tall. done/pace are shares of the target
export function BigTicks({ big, col, done, pace, paceL, left, right, w = 600, h = 96 }) {
  const N = Math.max(24, Math.min(55, Math.floor(w / 16))), n = Math.round(Math.min(1, done) * N), pc = pace != null ? Math.max(1, Math.round(pace * N)) : null;
  const at = pc ? ((pc - 0.5) / N) * 100 : null;
  return (
    <div className="bt" style={{ "--bt-h": `${h}px` }}>
      {big && <p className="bt-big">{big}</p>}
      {pc && <motion.div className="bt-pace" style={{ left: `${at}%` }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: 0.05 + (pc / N) * TK_SWEEP }}><span>{paceL}</span><i /></motion.div>}
      <TickRow n={N} h={h} wf={0.45} marks={(i) => { const k = i + 1; return k <= n ? { kind: "on", fill: col } : pc && k < pc ? { kind: "gap", fill: "var(--trk)" } : pc === k ? { kind: "pace", fill: "var(--coral)" } : { kind: "off" }; }} />
      {(left || right) && <div className="bt-ax"><span>{left}</span><span>{right}</span></div>}
    </div>
  );
}
const ts = (t, s) => [(s + t) / 2, (s - t) / 2];
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
// fit to the board: scale from the width (all seven lanes always show) and the height; the rest goes to depth
function useGeo(W, H) {
  const u = clampN(Math.min((W - 32) / (27.4 * C30), (H - 200) / 5.6), 11, 46), half = u * 0.5;
  // the crew stand on the walkway at yOrb, whole (3.4u tall, plus their busy bubble): the room above them is kept for that
  const fig = 3.4 * u + 22, rest = 2.6 * u + 1.25 * u + 62, gap = clampN(Math.min(H * 0.36, H - fig - rest - 40), 170, 360), total = fig + gap + rest;
  const yOrb = Math.max(36 + fig, (H - total) / 2 + fig), yBase = yOrb + gap + 2.6 * u;
  const span = Math.max(9, (yBase - yOrb) / half), sBld = S_AG + span;
  const ox = W / 2, oy = yOrb - S_AG * half;
  return { u, sBld, yOrb, yBase, P: (x, y, z = 0) => [ox + (x - y) * u * C30, oy + (x + y) * half - z * u], S: (t, s, z = 0) => [ox + t * u * C30, oy + s * half - z * u] };
}
const pts = (P, list) => list.map((q) => P(...q).map((v) => v.toFixed(1)).join(",")).join(" ");
function Box({ P, x, y, w, d, z0, z1, cls, hatch = 0, top = true, style, onEnter, onLeave, onClick, job }) {
  const L = [[x, y + d, z0], [x + w, y + d, z0], [x + w, y + d, z1], [x, y + d, z1]], R = [[x + w, y, z0], [x + w, y + d, z0], [x + w, y + d, z1], [x + w, y, z1]], T = [[x, y, z1], [x + w, y, z1], [x + w, y + d, z1], [x, y + d, z1]];
  const hz = []; const n = Math.round(hatch * 5); for (let i = 1; i <= n; i++) hz.push(z0 + (i / 6) * (z1 - z0));
  return (
    <g className={cls} data-job={job} style={style} onPointerEnter={onEnter} onPointerLeave={onLeave} onClick={onClick}>
      <polygon points={pts(P, L)} /><polygon points={pts(P, R)} />{top && <polygon points={pts(P, T)} />}
      {hz.map((z) => <polyline key={z} className="bx-h" points={pts(P, [[x, y + d, z], [x + w, y + d, z], [x + w, y, z]])} />)}
    </g>
  );
}
// a polyline's length and the point at a distance along it (screen space)
const plen = (r) => { let L = 0; for (let i = 1; i < r.length; i++) L += Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]); return L; };
const pat = (r, d) => { for (let i = 1; i < r.length; i++) { const s = Math.hypot(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]); if (d <= s) { const t = s ? d / s : 0; return [r[i - 1][0] + (r[i][0] - r[i - 1][0]) * t, r[i - 1][1] + (r[i][1] - r[i - 1][1]) * t]; } d -= s; } return r[r.length - 1]; };
const rd = (r) => "M" + r.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" L");
const live1 = (j) => j.st === "run" || j.st === "need";
// what travels takes a shape per job, so two jobs on one line read as two different things
// a typed ask finds its agent and lane as you type: a name wins, then what it's about
const LANE_KW = [[3, /onboard|activation|ttv|time to (first|value)|integration|handoff/], [4, /renewal|churn|grr|at.?risk|retention|qbr|healthy/], [5, /expansion|upsell|seats|cross.?sell/], [6, /product|dau|daily active|usage|feature|screen|eng\b|release|bug/], [0, /inbound|webinar|marketing|\bleads?\b|mql|no.?show/], [1, /outbound|sdr|prospect|cold|sequence|\bsam\b/], [2, /new (logo|business|arr)|win rate|deal|pipeline|close rate/]];
const AG_KW = [["riley", /forecast|\bplan\b|pace|budget|finance|board|revenue|cash|model|\barr\b/], ["calvin", /customer|account|renewal|churn|onboard|usage|qbr/], ["orin", /growth|campaign|demo|pipeline|lead|outbound|inbound|win rate/]];
const LANE_AG = ["orin", "orin", "orin", "calvin", "calvin", "calvin", "calvin"];
function routeAsk(t) {
  const q = t.toLowerCase(), named = IDS.find((id) => new RegExp(`(^|\\W)@?${id}(\\W|$)`).test(q));
  const ln = LANE_KW.find(([, re]) => re.test(q)), kw = AG_KW.find(([, re]) => re.test(q));
  const ag = named || (ln ? LANE_AG[ln[0]] : kw ? kw[0] : "orin");
  return { ag, lane: ln ? ln[0] : AG_LANE[ag] };
}
// "let them decide": everyone the ask is about (named agents win; otherwise the lane's agent and any whose work it touches)
function crewOf(t) {
  const q = t.toLowerCase(), named = IDS.filter((id) => new RegExp(`(^|\\W)@?${id}(\\W|$)`).test(q));
  const ln = LANE_KW.find(([, re]) => re.test(q)), kws = AG_KW.filter(([, re]) => re.test(q)).map((x) => x[0]);
  let ags = named.length ? named : [...new Set([ln && LANE_AG[ln[0]], ...kws].filter(Boolean))];
  if (!ags.length) ags = ["orin"];
  return { ags: ags.slice(0, 3), lane: ln ? ln[0] : AG_LANE[ags[0]] };
}
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
// who else is on a job: the agents with steps in its project
const helpersOf = (j, ps) => { const p = j.deep && ps.find((q) => q.id === j.deep); return [...new Set([...(j.with || []), ...(p ? p.steps.map((s) => s.ag) : [])])].filter((a) => a !== j.ag); };
const names = (L) => L.map((a) => AG[a].n).join(L.length > 2 ? ", " : " and ");
// what agents said to each other today, from the work itself
const COMMS0 = [
  { id: "c1", from: "calvin", to: "orin", text: "Sent Orin the $1.98M at risk for the Monday sync", at: 18 },
  { id: "c2", from: "riley", to: "orin", text: "Checked Orin’s numbers against the $40.03M plan", at: 4 },
];
const SHAPE = (id) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 4; };

// a report being put together: the page itself, writing as the agent works. Its paragraphs are the agent's findings
// (its thinking), the one it's on types in, the rest are still blank lines; the lane's number sits in it as a chart.
// a job that makes images: the set fills in as the agent works, one tile at a time; blank tiles are the ones still to come.
// Example content (the prototype has no image job): three reminder visuals, drawn in North's own type and colours.
const IMG = [
  { bg: "#0f2233", fg: "#fff", ac: "#ff8a7a", k: "time", h: ["Tomorrow,", "2:00 pm"], s: "Your Fello demo" },
  { bg: "#f4efe9", fg: "#093555", ac: "#744ccb", k: "seat", h: ["Your seat", "is saved"], s: "Inbound webinar · Thu" },
  { bg: "#2a1f4d", fg: "#fff", ac: "#f7a3ec", k: "yes", h: ["Reply YES", "to confirm"], s: "One tap. That’s it." },
];
function ImgTile({ t, p = 1, big }) {
  return (
    <svg className="im-t" viewBox="0 0 160 200" preserveAspectRatio="xMidYMid slice">
      <defs><clipPath id={`im-${t.k}-${big ? "b" : "s"}`}><rect width="160" height={200 * p} /></clipPath></defs>
      <rect width="160" height="200" fill="var(--trk)" />
      <g clipPath={`url(#im-${t.k}-${big ? "b" : "s"})`} filter="url(#grain)">
        <rect width="160" height="200" fill={t.bg} />
        {t.k === "time" && <><circle cx="128" cy="34" r="6" fill={t.ac} /><rect x="16" y="150" width="128" height="1" fill={t.fg} opacity=".2" /></>}
        {t.k === "seat" && Array.from({ length: 22 }, (_, i) => <rect key={i} x={16 + i * 5.9} y="30" width="2.2" height="18" rx=".4" fill={i < 15 ? t.ac : t.fg} opacity={i < 15 ? 1 : 0.15} />)}
        {t.k === "yes" && <><circle cx="122" cy="44" r="22" fill={t.ac} opacity=".9" /><circle cx="114" cy="38" r="8" fill="#fff" opacity=".55" /></>}
        <text x="16" y="96" fill={t.fg} fontSize="21" fontWeight="600" letterSpacing="-.4" fontFamily="inherit">{t.h[0]}</text>
        <text x="16" y="120" fill={t.fg} fontSize="21" fontWeight="600" letterSpacing="-.4" fontFamily="inherit">{t.h[1]}</text>
        <text x="16" y="172" fill={t.fg} opacity=".6" fontSize="9.5" fontFamily="inherit">{t.s}</text>
      </g>
      {p > 0 && p < 1 && <rect y={200 * p - 1} width="160" height="2" fill={t.ac} opacity=".9" />}
    </svg>
  );
}
function ImageSet({ j, big, sel, onSel }) {
  const done = j.st === "done" ? 3 : j.prog * 3;
  return (
    <div className={`im${big ? " is-big" : ""}`}>
      {IMG.map((t, i) => { const p = Math.max(0, Math.min(1, done - i));
        return <button key={t.k} className={`im-c${sel === i ? " is-sel" : ""}`} disabled={!big || p < 1} onClick={() => onSel && onSel(sel === i ? null : i)}><ImgTile t={t} p={p} big={big} />{p < 1 && p > 0 && <em>Drawing…</em>}</button>; })}
    </div>
  );
}
// what an agent has on the go, as small previews of the things themselves: reports as pages, image jobs as tiles
function MadeStrip({ jobs, onOpen }) {
  const L = jobs.filter((j) => (j.st === "run" || j.st === "done") && !j.deep).sort((a, b) => (b.kind === "images") - (a.kind === "images") || (a.st === "run" ? -1 : 1)).slice(0, 6);
  if (!L.length) return null;
  return (
    <div className="ms">{L.map((j) => { const k = Math.max(1, Math.ceil((j.st === "done" ? 1 : j.prog) * (j.think?.length || 2)));
      return <button key={j.id} className={`ms-c is-${j.st}`} onClick={() => onOpen(j)}>
        <span className="ms-th">{j.kind === "images" ? <span className="ms-im">{IMG.slice(0, 2).map((t, i) => <ImgTile key={t.k} t={t} p={Math.max(0, Math.min(1, (j.st === "done" ? 3 : j.prog * 3) - i))} />)}</span>
          : <span className="ms-pg"><i className="is-t" />{Array.from({ length: 5 }, (_, i) => <i key={i} className={i < k + 1 ? "is-on" : ""} style={{ width: `${[90, 76, 84, 60, 70][i]}%` }} />)}</span>}</span>
        <b>{j.t}</b><small>{j.st === "done" ? "Done" : stepTxt(j)}</small></button>; })}</div>
  );
}
function ReportDoc({ j, D, light, small }) {
  const a = AG[j.ag], th = j.think || [], p = j.st === "done" ? 1 : j.st === "run" ? j.prog : 0;
  const k = j.st === "done" ? th.length : Math.min(th.length, Math.max(0, Math.ceil(p * th.length))), cur = j.st === "run" ? k - 1 : -1, blanks = Math.max(0, 3 - k);
  return (
    <div className={`rp${small ? " is-small" : ""}`}>
      <div className="rp-h"><span>{a.n}’s report<i className="sep">·</i>{LANE_N[j.lane]}</span><em>{j.st === "done" ? "Finished" : j.st === "run" ? `Draft · ${stepTxt(j).toLowerCase()}` : j.st === "queue" ? "Not started" : ST_PILL[j.st]}</em></div>
      <b className="rp-t">{j.t}</b>
      <div className="rp-p">{th.slice(0, k).map((t, i) => <p key={t}>{i === cur && !small ? <Typed key={t} text={t} ms={D.typeMs} /> : t}</p>)}
        {Array.from({ length: blanks }, (_, i) => <span key={i} className="rp-blank" style={{ width: `${[92, 78, 60][i]}%` }} />)}</div>
      {!small && <div className="rp-fig"><JobViz j={j} light={light} /></div>}
    </div>
  );
}
// work the gap calls for, per lane: what the agents would pick up to close it (titles only, no numbers made up)
const GAP_JOBS = {
  // a third entry is what the job finds, in the prototype's own numbers; a job with nothing in the data to find says so plainly
  Inbound: [["Find which webinar leads no-show and why", "marco", ["Splitting no-shows by lead source.", "Webinar leads no-show twice as often as other inbound leads."]], ["Re-route stalled inbound demos to open slots", "orin"], ["Check pipeline created against pace by source", "riley", ["Reading pipeline created this month.", "Inbound has created $5.97M of pipeline against a $5.22M pace, so pipeline isn’t what’s holding it back."]]],
  Outbound: [["Re-run the stalled demo list", "orin", ["Reading the demo list.", "The 14 open prospects on the demo list are back in rotation for a new demo."]], ["Check which sequences stopped Oct 14", "orin", ["Comparing sequences before and after Oct 14.", "Demos held fell from 26 to 11 after Oct 14, when two SDRs moved to inbound coverage."]], ["Price one SDR back on Outbound", "riley", ["Projecting Outbound back to pace.", "Back to pace, Outbound adds about $680K by Dec 31."]], ["Rank open Outbound deals by size and stage", "riley"], ["Draft follow-ups for demos that went quiet", "orin", ["Finding demos with no follow-up.", "Drafted follow-ups for the 11 lost demos that had none within two days."]], ["Check demo held rate by rep", "calvin", ["Splitting demo held rate by rep.", "There’s no per-rep split in the data yet. The lane is at 41.9% against a 50% target."]]],
  "New Business": [["Rank late-stage new-logo deals by close date", "riley"], ["Draft outreach for stalled trials", "orin"], ["Review this month’s lost new-logo demos", "orin", ["Reading the last 20 lost demos.", "14 of the last 20 lost demos were booked by outbound after Oct 14, and 11 had no follow-up within two days."]], ["Check which deals are missing a next step", "calvin"]],
  "Value Delivery": [["Find where the first integration stalls", "calvin"], ["List accounts past 15 days without 10 handoffs", "calvin"], ["Draft a setup checklist for new accounts", "calvin"], ["Check which onboarding steps take longest", "riley"]],
  "Customer Value": [["Rank at-risk accounts by renewal date", "calvin"], ["Draft check-ins for accounts with falling usage", "calvin"], ["Check GRR by segment", "riley"]],
  Expansion: [["Find exec sponsors for open deals over $50K", "calvin"], ["Rank expansion deals by close odds", "riley"], ["Draft check-ins for accounts with usage up", "calvin"], ["Review lost expansion deals from September", "orin"]],
  "Product & Eng": [["Find why daily active users are below target", "calvin"], ["Group support tickets by feature", "calvin"], ["Check which releases moved activation", "riley"]],
  _: [["Find what’s holding this lane back", "orin"], ["Rank the open work by impact", "riley"]],
};
// what would close a lane's gap: just the work. Click one to start it; who picks it up shows on the board afterwards.
const gapThink = (t) => { for (const L of Object.values(GAP_JOBS)) { const x = L.find((y) => y[0] === t); if (x) return x[2] || null; } return null; };
const money = (n) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${(n / 1e3).toFixed(1)}K`);
const gapOf = (li) => { const row = HLANES[li][3][LANE_KPI[li][0]], v = numOf(row[1]), r = numOf(row[4]);
  if (/^\$/.test(row[1]) && /pace|target/.test(row[4]) && r > v) return `${LANE_N[li]} is ${money(r - v)} behind ${row[4].split(" ")[0]}`;
  return `${LANE_N[li]} is at ${laneSaid(li)}`; };
function SolveCard({ lane, title, props, x, y, right, onEnter, onLeave, onStart }) {
  return (
    <motion.div className={`pk is-side is-solve is-${right ? "r" : "l"}`} style={{ left: x, top: y }} onPointerEnter={onEnter} onPointerLeave={onLeave}
      initial={{ opacity: 0, x: right ? -6 : 6, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: right ? -4 : 4, scale: 0.99, transition: { duration: 0.14 } }} transition={{ type: "spring", visualDuration: 0.28, bounce: 0.1 }}>
      <b className="pk-t">{title || gapOf(lane)}</b>
      <div className="sv-l"><AnimatePresence initial={false}>{props.map((p) => <motion.button layout key={p[0]} className="sv-r" exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } }} onClick={() => onStart([p])}>
        <span>{p[0]}</span><em>Start</em></motion.button>)}</AnimatePresence></div>
      {props.length > 1 && <button className="sv-all" onClick={() => onStart(props)}>{props.length === 2 ? "Start both" : `Start all ${props.length}`}</button>}
    </motion.div>
  );
}
function Peek({ j, D, ps, x, y, side = "r", thread, say, onOpen, onEnter, onLeave, onLock, light }) {
  const a = AG[j.ag], p = j.deep && ps.find((q) => q.id === j.deep), hp = helpersOf(j, ps), th = thoughtNow(j);
  const [t, setT] = useState(""), last = [...thread].reverse().find((m) => m.who === "ag"), mine = [...thread].reverse().find((m) => m.who === "you");
  const go = () => { const v = t.trim(); if (!v) return; say(j.id, v, j); setT(""); };
  return (
    <motion.div className={`pk is-side is-${side} is-${j.st}`} style={{ left: x, top: y }} initial={{ opacity: 0, x: side === "r" ? -6 : 6, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: side === "r" ? -4 : 4, scale: 0.99, transition: { duration: 0.14 } }} transition={{ type: "spring", visualDuration: 0.28, bounce: 0.1 }}
      onPointerEnter={onEnter} onPointerLeave={onLeave}>
      <div className="pk-h"><span className="pk-orbs"><Orb id={j.ag} size={14} />{hp.map((h) => <Orb key={h} id={h} size={14} />)}</span><span className="pk-who">{a.n}{hp.length ? <> with {names(hp)}</> : null}</span>
        <em className={`pk-st is-${j.st}`}>{j.st === "run" ? stepTxt(j) : ST_PILL[j.st]}</em></div>
      <b className="pk-t">{j.t}</b>
      <div className="pk-prev">{p ? <div className="pk-live"><div className="pk-scale">{p.id === "sync" ? <LiveDoc p={p} D={D} /> : p.id === "forecast" ? <LiveForecast p={p} /> : <LiveStall p={p} D={D} />}</div></div>
        : j.kind === "images" ? <div className="pk-live is-rp"><ImageSet j={j} /></div>
        : j.st !== "need" && j.st !== "wait" ? <div className="pk-live is-rp"><ReportDoc j={j} D={D} light={light} small /></div>
        : <div className="pk-note"><Thumb kind="doc" m={j.st === "done" ? 1 : j.st === "run" ? j.prog : j.st === "need" ? 1 : 0.08} /><p>{j.st === "need" ? (NEEDS.find((n) => n.id === j.need)?.rec || "Waiting on your call.") : j.st === "wait" ? `${j.wait}.` : j.st === "queue" ? `Starts when the job ahead of it finishes.` : th || "Finished and filed in the Library."}</p></div>}</div>
      {(mine || last) && <div className="pk-reply">{last?.pending ? <span className="is-wait"><Orb id={j.ag} size={12} live />{a.n} is reading…</span> : last ? <span><Orb id={j.ag} size={12} />{last.text}</span> : null}</div>}
      <div className="pk-in"><input value={t} placeholder={`Tell ${a.n} something about this…`} onChange={(e) => setT(e.target.value)} onFocus={() => onLock(true)} onBlur={() => onLock(!!t.trim())} onKeyDown={(e) => { if (e.key === "Enter") go(); if (e.key === "Escape") { setT(""); onLock(false); e.currentTarget.blur(); } }} />
        <button className="pk-open" onClick={() => onOpen(j)}>Open</button></div>
    </motion.div>
  );
}

// ---------------------------------------------------------------- walk in, ask, leave: a quick brief from the bar
// "Orin, give me a breakdown", "what has Caleb got today", "catch me up". Answered from the jobs themselves (so every number is
// real), as a short sentence and the few jobs that matter, right above the bar. Esc or click away and it's gone.
const isAsk = (t) => { const x = t.trim().replace(/^(hey|ok|okay|so)\b[,\s]*/i, "").replace(/^@?(orin|riley|calvin)\b[,:\s]*/i, "").replace(/^(can you|could you|please)\s+/i, "");
  return /\?\s*$/.test(x) || /^(what|what's|whats|how|why|who|where|when|is|are|did|does|has|have|give me|show|tell me|summar|break ?down|catch me up|anything|status|update|walk me through|can i|could i|may i|let me|let's see|i want to see|i'd like to see|i would like to see|pull up|list)\b/i.test(x); };
let PERSONS_ = null;
const PERSONS = () => PERSONS_ || (PERSONS_ = (() => { const m = new Map();
  Object.entries(OWNERS).forEach(([lane, o]) => o.split(/\s*\/\s*/).forEach((full) => { const k = full.trim().split(" ")[0], li = LANE_N.indexOf(lane); const e = m.get(k) || { n: k, full: k, ls: [] }; if (full.length > e.full.length) e.full = full.trim(); if (li >= 0 && !e.ls.includes(li)) e.ls.push(li); m.set(k, e); }));
  return [...m.values()]; })());
const PEOPLE = Object.entries(OWNERS).flatMap(([lane, o]) => o.split(/\s*\/\s*/).map((n) => [n.split(" ")[0], lane]));
// each answer is said by someone: the agent you named, or Orin for everything else. The words come from the jobs (so every
// number is real); the model only puts them in the speaker's voice. Without the model, the same facts in a written voice.
const n2w = (n) => (["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][n] ?? String(n));
// a task said in a sentence: "Write the Monday sync doc" becomes "writing the Monday sync doc"
const ING = { Approve: "approving", Write: "writing", Start: "starting", Find: "finding", Sum: "summing", Explain: "explaining", Check: "checking", Rank: "ranking", Review: "reviewing", Make: "making", Forecast: "forecasting", Line: "lining", Break: "breaking", Group: "grouping", "Re-route": "re-routing" };
const ing = (t) => { const w = t.split(" ")[0]; return ING[w] ? ING[w] + t.slice(w.length) : lower1(t); };
const qt = (t) => `“${t.replace(/\?$/, "")}”`;
function briefOf(q, jobs, scope) {
  const L = jobs.filter((j) => !j.arch && inS(j, scope)), ql = q.toLowerCase();
  const ag = IDS.find((id) => new RegExp(`\\b${id}\\b`).test(ql) && !/^(orin|riley|calvin)\b[,:\s]/i.test(q.trim()) || new RegExp(`\\b(${id})('s|s)?\\b.*\\b(work|doing|on|plate|breakdown|done)`).test(ql));
  const asked = IDS.find((id) => new RegExp(`^@?${id}\\b`, "i").test(q.trim()));
  const who = ag || asked;
  const person = PEOPLE.find(([n]) => new RegExp(`\\b${n.toLowerCase()}\\b`).test(ql));
  const named = q.match(/\b(?:has|did|is|for|about|on)\s+([A-Z][a-z]+)\b/)?.[1];
  const cnt = (js) => { const c = (st) => js.filter((j) => j.st === st).length; return { need: c("need"), run: c("run"), next: c("wait") + c("queue"), done: c("done"), wait: c("wait") }; };
  const pick = (js) => [...js].sort((a, b) => ORDER_L[a.st] - ORDER_L[b.st] || b.prog - a.prog).slice(0, 5);
  const facts = [];
  // what do I need to do
  if (!who && /\b(i|me|my|mine)\b/.test(ql) && /(need|do|to ?do|on me|waiting|should|plate|owe)/.test(ql)) {
    const all = jobs.filter((j) => !j.arch), need = all.filter((j) => j.st === "need"), mine = all.filter((j) => j.mine && j.st !== "need");
    const run = mine.filter((j) => j.st === "run").sort((a, b) => b.prog - a.prog), stuck = mine.filter((j) => j.st === "wait").length, later = mine.filter((j) => j.st === "queue").length;
    const top = need.find((j) => WORTH[j.need]) || need[0], worth = top && WORTH[top.need];
    facts.push(`${need.length} decisions wait on the user`, top && `most valuable: "${top.t}"${worth ? ` (${worth})` : ""}`, `${run.length} of the user's jobs running`, `${stuck} waiting on data`, `${later} queued`);
    const text = (need.length ? `You’ve got ${n2w(need.length)} ${need.length === 1 ? "call" : "calls"} to make. I’d start with ${qt(top.t)}${worth ? `: it’s ${lower1(worth).replace(/\.$/, "")}` : ""}.` : "Nothing’s waiting on you right now.")
      + ` ${run.length ? `${cap(n2w(run.length))} of your jobs ${run.length === 1 ? "is" : "are"} moving${stuck ? `, and ${n2w(stuck)} ${stuck === 1 ? "is" : "are"} waiting on data` : " and nothing’s stuck"}` : "None of your jobs are running"}${later ? `. ${cap(n2w(later))} more start after that.` : "."}`;
    return { ag: "north", text, facts, jobs: [...need, ...run].slice(0, 6), subs: true };
  }
  if (who) { const js = L.filter((j) => j.ag === who || (j.with || []).includes(who)), c = cnt(js), run = js.filter((j) => j.st === "run").sort((a, b) => (b.ag === who) - (a.ag === who) || b.prog - a.prog), need = js.filter((j) => j.st === "need"), done = js.filter((j) => j.st === "done").sort((a, b) => ageOf(a) - ageOf(b));
    const sh = run.filter((j) => (j.with || []).length || j.ag !== who);
    facts.push(`${c.run} running`, run[0] && `furthest along: "${run[0].t}", ${stepTxt(run[0])}`, sh[0] && `working with ${names([sh[0].ag, ...(sh[0].with || [])].filter((x) => x !== who))} on "${sh[0].t}"`, `${c.need} need the user`, `${c.next} up next`, `${c.done} done today`, done[0] && `latest done: "${done[0].t}"`);
    const text = `${run.length ? `I’ve got ${n2w(run.length)} going, and I’m furthest along on ${ing(run[0].t)}, ${stepTxt(run[0]).toLowerCase()}.` : "Nothing’s running for me right now."}`
      + `${sh[0] && sh[0] !== run[0] ? ` I’m also ${ing(sh[0].t)} with ${names([sh[0].ag, ...(sh[0].with || [])].filter((x) => x !== who))}.` : ""}`
      + `${need.length ? ` ${need.length === 1 ? "One thing needs" : `${cap(n2w(need.length))} things need`} you: ${qt(need[0].t)}.` : ""}`
      + `${done.length ? ` Today I finished ${ing(done[0].t)}${done.length > 1 ? ` and ${n2w(done.length - 1)} more` : ""}.` : ""}`;
    return { ag: who, text, facts, jobs: pick(js) }; }
  if (person) { const lanes = PEOPLE.filter(([n]) => n === person[0]).map((x) => LANE_N.indexOf(x[1])), js = L.filter((j) => lanes.includes(j.lane)), c = cnt(js), top = js.find((j) => j.st === "need") || js.find((j) => j.st === "run");
    facts.push(`${person[0]} runs ${lanes.map((li) => LANE_N[li]).join(" and ")}`, ...lanes.map((li) => `${LANE_N[li]} is at ${laneSaid(li)}`), `${c.need} decisions waiting`, `${c.run} jobs running`, `${c.done} done today`);
    const text = `${person[0]} runs ${lanes.map((li) => LANE_N[li]).join(" and ")}, which is at ${lanes.map((li) => laneSaid(li)).join(" and ")}.`
      + ` ${c.need ? `There ${c.need === 1 ? "is one call" : `are ${n2w(c.need)} calls`} waiting on you there` : "Nothing’s waiting on you there"}${c.run ? `, and ${n2w(c.run)} ${c.run === 1 ? "job is" : "jobs are"} moving` : ""}.`
      + `${top ? ` The one to look at is ${qt(top.t)}.` : ""}`;
    // the numbers: each lane's first three, as they stand
    const nums = lanes.map((li) => [0, 1, 2].map((r) => KPI(li, r)).map(([k, v, p]) => `${k} ${v}${p ? ` (${p})` : ""}`).join(", "));
    lanes.forEach((li, i) => facts.push(`${LANE_N[li]} numbers: ${nums[i]}`));
    return { ag: "north", text: `${text} ${lanes.map((li, i) => `${lanes.length > 1 ? `${LANE_N[li]}: ` : "The numbers: "}${nums[i]}.`).join(" ")}`, facts, jobs: pick(js) }; }
  if (named && !IDS.includes(named.toLowerCase())) { const ppl = [...new Set(PEOPLE.map((x) => x[0]))];
    return { ag: "north", text: `I don’t see ${named} on anything in North today. The work I can see is for ${ppl.slice(0, -1).join(", ")} and ${ppl[ppl.length - 1]}.`, facts: [`no work for ${named}`], jobs: [] }; }
  const lane = LANE_N.findIndex((n) => ql.includes(n.toLowerCase()));
  if (lane >= 0) { const js = L.filter((j) => j.lane === lane), c = cnt(js), top = js.find((j) => j.st === "need") || js.find((j) => j.st === "run");
    facts.push(`${LANE_N[lane]} is at ${laneSaid(lane)}`, `${c.need} decisions`, `${c.run} running`, `${c.done} done`);
    return { ag: "north", text: `${LANE_N[lane]} is at ${laneSaid(lane)}. ${c.run ? `We’ve got ${n2w(c.run)} ${c.run === 1 ? "job" : "jobs"} on it` : "Nothing’s running there"}${c.need ? `, and ${n2w(c.need)} ${c.need === 1 ? "needs" : "need"} you` : ""}.${top ? ` Start with ${qt(top.t)}.` : ""}`, facts, jobs: pick(js) }; }
  const c = cnt(L), need = L.filter((j) => j.st === "need"), top = need.find((j) => WORTH[j.need]) || need[0];
  facts.push(`${c.need} decisions wait on the user`, top && `most valuable: "${top.t}"`, `${c.run} running`, `${c.next} up next`, `${c.done} done today`);
  return { ag: "north", text: `Quick version: ${c.need ? `${n2w(c.need)} ${c.need === 1 ? "thing needs" : "things need"} you` : "nothing needs you"}, ${n2w(c.run)} ${c.run === 1 ? "job is" : "jobs are"} moving, and ${n2w(c.done)} finished today.${top ? ` If you only do one thing, make it ${qt(top.t)}.` : ""}`, facts, jobs: pick(L) };
}
async function voiceOf(sm, b, q, hist = [], jobs = []) {
  if (!sm) return b.text; const a = AG[b.ag];
  const conv = hist.slice(-8).map((m) => (m.who === "you" ? `User: ${m.text}` : `${AG[m.who]?.n || "Agent"}: ${m.text}`)).join("\n");
  const mine = jobs.filter((j) => !j.arch && (j.ag === b.ag || (j.with || []).includes(b.ag))).slice(0, 14).map((j) => `${j.t} (${j.st === "need" ? "needs the user" : j.st === "run" ? stepTxt(j) : j.st})`);
  const prompt = [b.ag === "north" ? `You are North, Fello's company copilot. You see every team's numbers and everything the agents (Orin, Riley, Calvin, Marco, Fia) are doing, and you answer for the whole company.` : `You are ${a.n}, the ${a.role} agent in North at Fello, talking with a colleague in a quick chat.`,
    conv ? `The conversation so far:\n${conv}` : "", `They just said: "${q}"`,
    `Reply as ${a.n}, first person, like a sharp colleague in a chat: warm, direct, plain words, 1 to 2 short sentences, under 40 words. Sound like a person, not a status report: leave out step counts and team names unless they asked for them. No lists, no markdown, no greetings. If they ask you to do something, say plainly what you'll do.`,
    `Use only these facts and keep every number and job name exactly as written; never invent numbers, names or dates:`, `- ${[...b.facts.filter(Boolean), ...mine.map((x) => `job: ${x}`)].join("\n- ")}`,
    `A draft you can improve on: ${b.text}`, `Reply with JSON only: {"text": "<your reply>"}`].filter(Boolean).join("\n\n");
  try { const r = await sm.json(prompt, { modelTier: "quick", cache: false }); if (r && typeof r.text === "string" && r.text.trim()) return r.text.trim(); } catch (e) {}
  return b.text;
}
// a reply that isn't a question ("go ahead", "do that first", "thanks"): the speaker answers it in their own words
function replyOf(q, ag, last) {
  const ql = q.toLowerCase(), top = last?.jobs?.find((j) => j.st === "need") || last?.jobs?.[0];
  if (/^(thanks|thank you|cool|great|perfect|ok|okay|got it|nice)\b/.test(ql)) return { ag, text: "Anytime. I’ll ping you here if anything changes.", facts: [], jobs: [] };
  if (top && /(go ahead|do it|start|approve|yes|ship it|send it|sounds good)/.test(ql)) {
    // saying yes to a decision in the chat is the same as pressing its button
    if (top.st === "need") { const n = NEEDS.find((x) => x.id === top.need);
      const text = DONE[top.need] || (n?.propose ? `On it. I’m ${ing(n.propose)} now and I’ll bring it back here.` : `Done. ${top.ag === ag ? "I’m" : `${AG[top.ag].n}’s`} on it, and I’ll tell you when it lands.`);
      return { ag, text, facts: [n?.propose ? `started "${n.propose}"` : `approved "${top.t}"`], jobs: [], act: top }; }
    return { ag, text: `On it. I’ll push ${qt(top.t)} to the front and come back when there’s something to look at.`, facts: [`prioritising "${top.t}"`], jobs: [top] }; }
  return { ag, text: `Got it. I’ll work that in and let you know how it lands.`, facts: [], jobs: [] };
}
function BriefCard({ b, D, onOpen, onClose }) {
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const end = useRef(null), last = b.msgs[b.msgs.length - 1];
  useEffect(() => { end.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [b.msgs.length, last?.pending]);
  const rowS = (j) => (j.st === "need" ? "Needs you" : j.st === "run" ? stepTxt(j) : j.st === "done" ? agoT(ageOf(j)) : j.st === "wait" ? "Waiting" : "Up next");
  return (
    <motion.div className="qb" initial={{ opacity: 0, y: 10, clipPath: "inset(100% 0 0 0 round 10px)" }} animate={{ opacity: 1, y: 0, clipPath: "inset(0% 0 0 0 round 10px)" }} exit={{ opacity: 0, y: 6, clipPath: "inset(100% 0 0 0 round 10px)", transition: { duration: 0.22 } }} transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}>
      <div className="qb-h"><span className="pk-orbs">{[...new Set(b.msgs.filter((m) => m.who !== "you").map((m) => m.who))].map((id) => <Orb key={id} id={id} size={14} />)}</span>
        <span className="qb-q"><b>{names([...new Set(b.msgs.filter((m) => m.who !== "you").map((m) => m.who))])}</b></span>
        <button className="cd-ib" onClick={onClose} aria-label="Close"><svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M2 2l6 6M8 2 2 8" /></svg></button></div>
      <div className="qb-th">
        {b.msgs.map((m, i) => m.who === "you"
          ? <motion.p key={i} className="qb-you" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>{m.text}</motion.p>
          : <motion.div key={i} className="qb-m" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              {(() => { const pv = b.msgs.slice(0, i).reverse().find((x) => x.who !== "you"); return pv && pv.who !== m.who ? <span className="qb-who"><Orb id={m.who} size={12} />{AG[m.who].n}</span> : null; })()}
              <p className="qb-a">{m.pending ? <span className="qb-wait">{AG[m.who]?.n} is thinking…</span> : i === b.msgs.length - 1 ? <Typed key={m.text} text={m.text} ms={Math.max(6, D.typeMs * 0.5)} /> : m.text}</p>
              {!m.pending && m.jobs?.length > 0 && <div className="qb-l">{m.jobs.map((j) => <button key={j.id} className={`qb-r is-${j.st}`} onClick={() => onOpen(j)}><span className="lv2-i">{j.st === "need" ? NEED_I : <Orb id={j.ag} size={12} live={j.st === "run"} />}</span><span className="qb-t">{j.t}</span><span className="qb-s">{rowS(j)}</span>
                {m.subs && j.st === "need" && <span className="qb-sub">{NEEDS.find((x) => x.id === j.need)?.rec}</span>}</button>)}</div>}
            </motion.div>)}
        <span ref={end} />
      </div>
      <span className="qb-k"><kbd>Esc</kbd> to close<i className="sep">·</i>Keep typing below to reply</span>
    </motion.div>
  );
}
// one line at the foot of the board: say what you want and they work out who takes it. Type @ to hand it to someone yourself
// (@Orin, @Riley, @Calvin); tap the mic to say it instead.
function useVoice(onText, onEnd) {
  const [on, setOn] = useState(false), rec = useRef(null), demo = useRef(null);
  const stop = () => { try { rec.current?.stop(); } catch {} clearInterval(demo.current); setOn(false); };
  const start = () => {
    setOn(true);
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    const fallback = () => { // no microphone in this view: play a spoken request so the flow can be seen
      const say = "Have Riley check where Outbound’s pipeline stands against pace"; let n = 0;
      clearInterval(demo.current); demo.current = setInterval(() => { n += 2; onText(say.slice(0, n)); if (n >= say.length) { clearInterval(demo.current); setTimeout(() => { setOn(false); onEnd?.(); }, 500); } }, 45); };
    if (!SR) return fallback();
    try { const r = new SR(); rec.current = r; r.interimResults = true; r.lang = "en-US";
      let got = false, fell = false; const fb = () => { if (fell || got) return; fell = true; try { r.abort(); } catch {} fallback(); };
      setTimeout(fb, 2500); // nothing heard (or the view blocks the mic): fall back to the example
      r.onresult = (e) => { got = true; onText(Array.from(e.results).map((x) => x[0].transcript).join(" ")); };
      r.onerror = () => { if (!got) fb(); else setOn(false); };
      r.onend = () => { if (got) { setOn(false); onEnd?.(); } };
      r.start();
    } catch { fallback(); }
  };
  useEffect(() => () => stop(), []);
  return [on, () => (on ? stop() : start())];
}
const TRY = [["What do I need to do?", "Your calls, and how your work is moving"], ["Orin, give me a breakdown of everything you’re working on", "One agent’s work, in her words"],
  ["What has Caleb got going?", "Everything for one person"], ["How’s Outbound doing?", "One team against its number"], ["Catch me up", "The whole picture in two lines"],
  ["Have Riley check Outbound’s pipeline against pace", "Or just say what you want done"]];
function AskBar({ onAdd, setGhost, onAsk, talking, toNorth }) {
  const [ti, setTi] = useState(0), [hiT, setHiT] = useState(-1);
  useEffect(() => { const t = setInterval(() => setTi((i) => (i + 1) % TRY.length), 3200); return () => clearInterval(t); }, []);
  const [t, setT] = useState(""), [ok, setOk] = useState(null), [hi, setHi] = useState(0), ref = useRef(null);
  const at = t.match(/(^|\s)@(\w*)$/), opts = at ? IDS.filter((id) => AG[id].n.toLowerCase().startsWith(at[2].toLowerCase())) : [];
  const named = IDS.filter((id) => new RegExp(`@${id}\\b`, "i").test(t));
  const clean = t.replace(/@(orin|riley|calvin|marco|fia)\b/gi, (m) => AG[m.slice(1).toLowerCase()].n).replace(/\s+/g, " ").trim();
  const asking = clean.length > 1 && (!!talking || isAsk(clean));
  const auto = clean.length > 2 && !asking ? crewOf(clean) : null;
  const r = auto ? { ags: named.length ? named : auto.ags, lane: auto.lane } : null;
  useEffect(() => { setGhost(r); }, [r?.ags.join(), r?.lane]);
  useEffect(() => { const f = () => ref.current?.focus(); window.addEventListener("north:ask", f);
    const k = (e) => { if (toNorth) return; if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); if (e.shiftKey) { ref.current?.focus(); window.dispatchEvent(new Event("north:mic")); } else ref.current?.focus(); } };
    window.addEventListener("keydown", k); return () => { window.removeEventListener("north:ask", f); window.removeEventListener("keydown", k); }; }, []);
  const [focused, setFocused] = useState(false);
  useEffect(() => setHi(0), [at?.[2]]);
  const pick = (id) => { setT((v) => v.replace(/@(\w*)$/, `@${AG[id].n} `)); ref.current?.focus(); };
  const go = () => { if (toNorth && clean) { toNorth(cap(clean)); setT(""); ref.current?.blur(); return; } if (asking) { onAsk(clean); setT(""); return; } if (!r) return; onAdd(cap(clean), r.ags, r.lane); setOk({ ags: r.ags, lane: r.lane }); setT(""); setTimeout(() => setOk(null), 2600); };
  const [listening, toggleMic] = useVoice((x) => setT(x), () => ref.current?.focus());
  useEffect(() => { const m = () => toggleMic(); window.addEventListener("north:mic", m); return () => window.removeEventListener("north:mic", m); });
  return (
    <div className={`ask${r ? " is-on" : ""}${listening ? " is-mic" : ""}`}>
      <AnimatePresence>{focused && !t && !listening && !opts.length && !talking && <motion.div className="ask-try" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
        <span className="rc-k">{toNorth ? "Ask North" : "Ask anything"}</span>
        {TRY.map(([q, d], i) => <button key={q} className={i === hiT ? "is-on" : ""} onPointerDown={(e) => { e.preventDefault(); if (toNorth) { toNorth(q); ref.current?.blur(); return; } const asking2 = isAsk(q); if (asking2) { onAsk(q); } else { setT(q); } ref.current?.blur(); }}><span>{q}</span><em>{d}</em></button>)}
      </motion.div>}</AnimatePresence>
      <AnimatePresence>{opts.length > 0 && <motion.div className="ask-at" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
        {opts.map((id, i) => <button key={id} className={i === hi ? "is-on" : ""} onPointerDown={(e) => { e.preventDefault(); pick(id); }}><Orb id={id} size={14} /><b>{AG[id].n}</b><span>{AG[id].role}</span></button>)}
      </motion.div>}</AnimatePresence>
      <div className="ask-in">
        <AnimatePresence mode="popLayout" initial={false}>{named.length ? <motion.span key={named.join()} className="pk-orbs" title={`${names(named)} will take it`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: "spring", visualDuration: 0.3, bounce: 0.3 }}>{named.map((id) => <Orb key={id} id={id} size={16} />)}</motion.span>
          : <motion.svg key="plus" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><path d="M6 2v8M2 6h8" /></motion.svg>}</AnimatePresence>
        <input ref={ref} value={t} onChange={(e) => setT(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); setHiT(-1); }}
          onKeyDown={(e) => { if (!t && !opts.length && !talking && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); setHiT((h) => (h + (e.key === "ArrowDown" ? 1 : TRY.length - 1) + (h < 0 && e.key === "ArrowUp" ? 1 : 0)) % TRY.length); return; }
            if (!t && hiT >= 0 && !talking && e.key === "Enter") { e.preventDefault(); const q = TRY[hiT][0]; setHiT(-1); if (toNorth) { toNorth(q); e.currentTarget.blur(); return; } if (isAsk(q)) { onAsk(q); e.currentTarget.blur(); } else setT(q); return; }
            if (opts.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); setHi((h) => (h + (e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length); return; }
            if (opts.length && (e.key === "Enter" || e.key === "Tab")) { e.preventDefault(); pick(opts[hi]); return; }
            if (e.key === "Enter") go(); if (e.key === "Escape") { setT(""); e.currentTarget.blur(); } }}
          placeholder={listening ? "Listening…" : ok ? `${names(ok.ags)} ${ok.ags.length > 1 ? "are" : "is"} on it, in ${LANE_N[ok.lane]}` : talking ? `Reply to ${talking}…` : focused ? "Ask anything, or say what you want done" : `Try “${TRY[ti][0]}”`} />
        {asking && !talking && <span className="ask-mode">Ask</span>}
        {!t && !focused && !listening && !toNorth && <span className="ask-kbd"><kbd>⌘K</kbd></span>}
        <button className={`ask-mic${listening ? " is-on" : ""}`} onClick={toggleMic} aria-label={listening ? "Stop listening" : "Speak"} title={listening ? "Stop" : "Speak"}>
          {listening ? <span className="ask-wave">{[0, 1, 2, 3].map((i) => <i key={i} style={{ animationDelay: `${i * 0.12}s` }} />)}</span>
            : <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="1.2" width="4" height="6.2" rx="2" /><path d="M2.4 5.8a3.6 3.6 0 0 0 7.2 0M6 9.4v1.6" /></svg>}</button>
        <button className={`sd-send${r || asking ? " is-on" : ""}`} disabled={!r && !asking} onClick={go} aria-label={asking ? "Ask" : "Start"}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" /></svg></button>
      </div>
    </div>
  );
}
// the board's columns. Leadership's floor is the seven lanes. A seat's own floor ("For me") is what that person is measured on:
// their lane's numbers, a building each, with any of their work that sits in another lane at the end, under that lane's own name.
const saidOf = (row) => { const ref = row[4].split(" ")[0]; return /%$/.test(row[3]) ? `${row[3]} of ${ref}` : row[3]; };
const kpiRow = (row) => ({ n: row[0], v: row[1], s: row[3], p: row[2] });
const LANE_COLS = { key: "lanes", n: LANE_N, row: (i) => HLANES[i][3][LANE_KPI[i][0]], of: (j) => j.lane, lane: (i) => i, metric: () => undefined };
function colsFor(scope, jobs) {
  const st = seatOf(); if (!st || scope !== "me") return LANE_COLS;
  const L = st.lanes[0], rows = HLANES[L][3], M = rows.length;
  const extra = [...new Set(jobs.filter((j) => !j.arch && j.mine && !st.lanes.includes(j.lane)).map((j) => j.lane))].sort((a, b) => a - b);
  return { key: "seat", n: [...rows.map((r) => r[0]), ...extra.map((li) => LANE_N[li])],
    row: (i) => (i < M ? rows[i] : HLANES[extra[i - M]][3][LANE_KPI[extra[i - M]][0]]),
    of: (j) => (j.lane === L ? rows.indexOf(rowOf(j).row) : j.mine && extra.includes(j.lane) ? M + extra.indexOf(j.lane) : -1),
    lane: (i) => (i < M ? L : extra[i - M]), metric: (i) => (i < M ? rows[i][0] : undefined), out: (i) => i >= M, M };
}
// where a column stands: centred, with a step of air before any lane that isn't yours
const colT = (i, COL) => { const n = COL.n.length, gap = COL.M != null && COL.M < n ? 1.6 : 0, w = (n - 1) * 4 + gap; return -w / 2 + i * 4 + (COL.M != null && i >= COL.M ? gap : 0); };
const gapOfRow = (name, row) => { const v = numOf(row[1]), r = numOf(row[4]);
  if (/^\$/.test(row[1]) && /pace|target/.test(row[4]) && r > v) return `${name} is ${money(r - v)} behind ${row[4].split(" ")[0]}`;
  return `${name} is at ${saidOf(row)}`; };
function Board({ D, jobs: all, ps, onOpen, scope, focus, onAgent, hoverAg, setHoverAg, peek, openKey, hl, setHl, light, threads, say, onAdd, ghost, calm }) {
  const CC = light ? ORB_L : ORB_C, jobs = all.filter((j) => !j.arch);
  const box = useRef(null), cvs = useRef(null);
  const [[W, H], setWH] = useState([840, 560]);
  useLayoutEffect(() => { const ro = new ResizeObserver(() => { if (!box.current) return; const r = box.current.getBoundingClientRect(); setWH([Math.round(r.width), Math.round(r.height)]); }); ro.observe(box.current); return () => ro.disconnect(); }, []);
  const { P, S, sBld: S_BLD, u, yOrb, yBase } = useGeo(W, H);
  const [hf, setHf] = useState(null), hlT = useRef(null);
  const enterL = (li) => { clearTimeout(hlT.current); setHl(li); }, leaveL = () => { clearTimeout(hlT.current); hlT.current = setTimeout(() => setHl(null), 160); };
  useEffect(() => { const k = (e) => { if (e.key === "Escape") { setHl(null); setHf(null); setHoverAg(null); } }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const inScope = (j) => inS(j, scope);
  const vis = (j) => inScope(j) && (!focus || j.ag === focus);
  // working or idle, as each one is (or as the dial forces it, to compare the two)
  const crewEl = useMemo(() => Object.fromEntries(IDS.map((id) => [id, { current: null }])), []);
  const crewWork = (id) => (D.crew === "work" ? true : D.crew === "idle" ? false : jobs.some((j) => j.ag === id && j.st === "run" && inScope(j)));
  const COL = colsFor(scope, all), NC = COL.n.length, MID = (NC - 1) / 2, TT = (i) => colT(i, COL), cOf = (j) => COL.of(j);
  const gcol = ghost ? (COL.key === "lanes" ? ghost.lane : COL.of({ lane: ghost.lane, t: ghost.t || "", mine: true })) : -1;
  const laneAll = COL.n.map((n, i) => jobs.filter((j) => cOf(j) === i).sort((a, b) => FLOOR_ORDER[a.st] - FLOOR_ORDER[b.st]));
  // at company scale a building can't be one floor per job: each floor stands for a few, and the dashed line scales the same way
  const unit = Math.max(1, Math.ceil(Math.max(...laneAll.map((L) => L.length)) / 9));
  const lanes = laneAll.map((L) => (unit === 1 ? L : L.filter((_, k) => k % unit === 0)));
  // effort against the gap: how far each team is from its number, and how much work is on it. The dashed line on a building is
  // the work its gap calls for, if the work in hand were shared out in proportion to how far each team is behind.
  const gapW = COL.n.map((_, li) => { const row = COL.row(li), k = kindOf(row), v = numOf(row[1]), r = numOf(row[4]);
    return k === "ceil" ? Math.max(0, (v / r - 1) * 100) : row[2] == null ? 0 : Math.max(0, 100 - row[2]); });
  const liveN = laneAll.map((L) => L.filter((j) => j.st !== "done" && inScope(j)).length), doneN = lanes.map((L) => L.filter((j) => j.st === "done").length);
  const totW = gapW.reduce((a, b) => a + b, 0) || 1, totN = liveN.reduce((a, b) => a + b, 0);
  const want = gapW.map((w) => Math.round((totN * w) / totW));
  const short = want.map((w, i) => w - liveN[i]), worst = short.reduce((bi, v, i, A) => (v > A[bi] ? i : bi), 0);
  const roofZ = (li) => 0.08 + lanes[li].length * FH - 0.06;
  const [fill, setFill] = useState(null), [anc, setAnc] = useState(null), solT = useRef(null);
  // one line per agent–lane pair with live work on it: down from the orb, across on that agent's band, down into the roof
  const yLab = yOrb + u * 0.65, yTop = yBase - (0.08 + Math.max(6, Math.max(...lanes.map((L) => L.length)) - 1) * FH) * u - 10;
  const route = (ag, li) => {
    const k = IDS.indexOf(ag), o = S(PADS[ag], S_AG), b = S(TT(li), S_BLD, roofZ(li));
    const bus = yLab + (yTop - yLab) * (0.22 + k * 0.26) + (li - MID) * 2.2;
    const x0 = o[0] + (li - MID) * 3.2, x1 = b[0] + (k - 1) * 7;
    return [[x0, o[1] + DECK.s1 * u * 0.5 + 1], [x0, bus], [x1, bus], [x1, b[1]]];
  };
  const pairs = []; IDS.forEach((ag) => COL.n.forEach((_, li) => { const js = jobs.filter((j) => j.ag === ag && cOf(j) === li && live1(j) && inScope(j)); if (js.length) pairs.push({ k: `${ag}-${li}`, ag, lane: li, run: js.filter((j) => j.st === "run").length, ids: js.filter((j) => j.st === "run").map((j) => j.id), need: js.some((j) => j.st === "need") }); }));
  jobs.filter((j) => j.st === "run" && inScope(j) && cOf(j) >= 0).forEach((j) => helpersOf(j, ps).forEach((h) => { if (!pairs.some((p) => p.k === `${h}-${cOf(j)}`)) pairs.push({ k: `${h}-${cOf(j)}`, ag: h, lane: cOf(j), run: 0.35, ids: [j.id], help: true }); }));
  const rails = pairs.filter((p) => crewWork(p.ag)).map((p) => { const r = route(p.ag, p.lane); return { ...p, pts: r, L: plen(r) }; }); // an idle agent has walked off its station: no line
  // hover a floor: its preview; move into the card and it stays while you write to the agent
  const lockP = useRef(false), hold = useRef(null);
  // moving toward an open preview shouldn't swap it for the floor you cross on the way. While the cursor is heading into the
  // card (inside the triangle from where it was a moment ago to the card's near edge), other floors wait; if you stop on one,
  // or the cursor turns away, that floor takes over.
  const trail = useRef([]), hfRef = useRef(null), pend = useRef(null); hfRef.current = hf;
  const track = (e) => { const t = performance.now(), T = trail.current; T.push([e.clientX, e.clientY, t]); while (T.length > 2 && t - T[0][2] > 140) T.shift(); };
  const towardCard = () => {
    const el = box.current?.querySelector(".pk"), T = trail.current; if (!el || T.length < 2) return false;
    const r = el.getBoundingClientRect(), [ax, ay] = T[0], [px, py] = T[T.length - 1];
    if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) return true;
    if (performance.now() - T[T.length - 1][2] > 120) return false; // stopped: you meant the floor you're on
    const below = ay > r.bottom, ey = below ? r.bottom : r.top, b = [r.left - 24, ey], c = [r.right + 24, ey];
    const sgn = (p, q, w) => (p[0] - w[0]) * (q[1] - w[1]) - (q[0] - w[0]) * (p[1] - w[1]), P = [px, py], A = [ax, ay];
    const d1 = sgn(P, A, b), d2 = sgn(P, b, c), d3 = sgn(P, c, A);
    return Math.hypot(px - ax, py - ay) > 2 && !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
  };
  const enterF = (id) => {
    // the card's field took focus but nothing's written: moving to another floor lets the card go (it used to stay pinned to the old job)
    if (lockP.current && hfRef.current !== id) { const inp = document.querySelector(".pk .pk-in input"); if (inp && !inp.value.trim()) { inp.blur(); lockP.current = false; } }
    if (lockP.current) return; clearTimeout(hold.current); clearTimeout(pend.current);
    if (hfRef.current && hfRef.current !== id && towardCard()) { pend.current = setTimeout(() => { if (!towardCard() && !lockP.current) setHf(id); }, 320); return; }
    setHf(id); };
  const leaveF = () => { if (lockP.current) return; clearTimeout(hold.current); hold.current = setTimeout(() => { if (!towardCard()) setHf(null); else hold.current = setTimeout(() => setHf(null), 500); }, 260); };
  // a job that starts (picked up from the queue, or one you just added) rides its line down as a tag
  const seen = useRef(null);
  const [lit, setLit] = useState({});
  useEffect(() => {
    const prev = seen.current; seen.current = new Map(jobs.map((j) => [j.id, j.st]));
    if (!prev) return;
    const land = jobs.filter((j) => j.st === "done" && prev.get(j.id) === "run");
    land.forEach((j) => { const c = cOf(j); if (c < 0) return; setLit((L) => ({ ...L, [c]: (L[c] || 0) + 1 })); setTimeout(() => setLit((L) => ({ ...L, [c]: Math.max(0, (L[c] || 1) - 1) })), 1600); });
  }, [jobs]);
  const live = useRef({}); live.current = { hl, focus, W, H, rails, CC, light, calm };
  useEffect(() => {
    const c = cvs.current, g = c.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
    let raf, last = performance.now(); const pk = [], acc = {}, cnt = {}, seeded = new Set();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      const { hl, focus, W, H, rails, CC, light } = live.current;
      if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px"; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      for (const r of rails) if (!seeded.has(r.k) && r.L > 0) { seeded.add(r.k); const m = Math.max(1, Math.round(r.L / 90)); for (let i = 0; i < m; i++) pk.push({ k: r.k, d: (r.L * (i + Math.random() * 0.6)) / m, v: 46 + Math.random() * 26, sh: (i + r.k.length) % 4 }); }
      const byK = {}; for (const r of rails) { byK[r.k] = r; acc[r.k] = (acc[r.k] || 0) + dt * 0.42 * r.run; while (acc[r.k] >= 1) { acc[r.k]--; const n = (cnt[r.k] = (cnt[r.k] || 0) + 1), id = r.ids[n % r.ids.length] || ""; pk.push({ k: r.k, d: 0, v: 64 + Math.random() * 14, sh: SHAPE(id) }); } }
      for (let i = pk.length - 1; i >= 0; i--) {
        const q = pk[i], r = byK[q.k]; if (!r) { pk.splice(i, 1); continue; }
        q.d += dt * q.v; if (q.d >= r.L) { pk.splice(i, 1); continue; }
        const on = (!focus || r.ag === focus) && (hl == null || r.lane === hl);
        const a = pat(r.pts, q.d), b = pat(r.pts, Math.max(0, q.d - 2)), ang = Math.atan2(a[1] - b[1], a[0] - b[0]);
        const fade = Math.min(1, q.d / 14, (r.L - q.d) / 14);
        g.globalAlpha = (on ? 1 : 0.16) * fade; g.fillStyle = CC[r.ag];
        g.save(); g.translate(a[0], a[1]); g.rotate(ang); g.beginPath();
        if (q.sh === 0) g.arc(0, 0, 1.9, 0, Math.PI * 2);
        else if (q.sh === 1) g.rect(-1.7, -1.7, 3.4, 3.4);
        else if (q.sh === 2) { g.moveTo(2.4, 0); g.lineTo(-1.8, -2); g.lineTo(-1.8, 2); g.closePath(); }
        else g.rect(-3.4, -0.8, 6.8, 1.6);
        g.fill(); g.restore(); g.globalAlpha = 1;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const fid = hf || peek, fj = hf && jobs.find((j) => j.id === hf); // only a hover on the board opens a preview on the board
  // the floor grid: half-size isometric squares, so it reads as fine paper under the work rather than tiles
  const grid = [], GS = 0.5; for (let i = -14; i <= 26; i += GS) grid.push(<polyline key={"gx" + i} points={pts(P, [[i, -14], [i, 26]])} />); for (let i = -14; i <= 26; i += GS) grid.push(<polyline key={"gy" + i} points={pts(P, [[-14, i], [26, i]])} />);
  const railOn = (r) => (!focus || r.ag === focus) && (hl == null || r.lane === hl);
  const nowOf = (id) => { const r = jobs.filter((j) => j.ag === id && j.st === "run" && inScope(j)).sort((a, b) => b.prog - a.prog)[0]; if (!r) return null; const th = r.think && r.think[Math.min(r.think.length - 1, Math.floor(r.prog * r.think.length))]; return th || r.t; };
  return (
    <div className="bd2 is-v3" ref={box} onPointerMove={track} onPointerLeave={() => { setHl(null); if (!lockP.current) setHf(null); }}>
      <svg className="bd-svg" width={W} height={H} onPointerDown={(e) => { if (e.target === e.currentTarget || e.target.closest(".bd-grid")) { setHl(null); if (!lockP.current) setHf(null); } }}>
        <defs><radialGradient id="bdfade" cx="50%" cy="55%" r="62%"><stop offset="0" stopColor="#fff" stopOpacity="1" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient><mask id="bdm"><rect width={W} height={H} fill="url(#bdfade)" /></mask></defs>
        <g className="bd-grid" mask="url(#bdm)">{grid}</g>
        {/* the walkway the crew stands on: one raised plank across the board, seams every stride */}
        {(() => { const q = (t, s0, z) => S(t, S_AG + s0, z).map((v) => v.toFixed(1)).join(","), { t0, t1, s0, s1, z } = DECK;
          return <g className="bd-deck">
            <polygon className="dk-front" points={[q(t0, s1, z), q(t1, s1, z), q(t1, s1, 0), q(t0, s1, 0)].join(" ")} />
            <polygon className="dk-top" points={[q(t0, s0, z), q(t1, s0, z), q(t1, s1, z), q(t0, s1, z)].join(" ")} />
            {Array.from({ length: Math.floor((t1 - t0) / 2.2) }, (_, i) => t0 + 2.2 * (i + 1)).filter((t) => t < t1 - 0.4).map((t) => <polyline key={t} className="dk-seam" points={[q(t, s0, z), q(t, s1, z), q(t, s1, 0)].join(" ")} />)}
          </g>; })()}
        <g className="bd-rails"><AnimatePresence>{rails.map((r, i) => (
          <motion.path key={r.k} d={rd(r.pts)} className={`${railOn(r) ? "is-on" : ""}${r.run ? "" : " is-held"}${r.help ? " is-help" : ""}`} style={{ stroke: CC[r.ag] }}
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: railOn(r) ? 1 : 0.18 }} exit={{ pathLength: 0, opacity: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }}
            transition={{ pathLength: { duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: seen.current ? 0 : 0.2 + i * 0.05 }, opacity: { duration: 0.3 } }} />
        ))}</AnimatePresence></g>
        {ghost && gcol >= 0 && ghost.ags.map((ag) => <path key={ag} className="bd-ghost" d={rd(route(ag, gcol))} style={{ stroke: CC[ag] }} />)}
        {COL.n.map((_, li) => {
          const [x, y] = ts(TT(li), S_BLD), js = lanes[li], on = hl == null || hl === li;
          return (
            <g key={li} className={`bd-b${on ? "" : " is-off"}`} onPointerEnter={() => enterL(li)} onPointerLeave={leaveL}>
              <Box P={P} x={x - BLD_W / 2 - 0.14} y={y - BLD_W / 2 - 0.14} w={BLD_W + 0.28} d={BLD_W + 0.28} z0={0} z1={0.08} cls="bx is-plinth" />
              {js.map((j, k) => { const z0 = 0.08 + k * FH, z1 = z0 + FH - 0.06;
                return <Box key={j.id} P={P} x={x - BLD_W / 2} y={y - BLD_W / 2} w={BLD_W} d={BLD_W} z0={z0} z1={z1} top={k === js.length - 1} hatch={j.st === "run" ? j.prog : j.st === "need" ? 1 : 0}
                  cls={`bx fl-${j.st}${vis(j) ? "" : " is-ghost"}${fid === j.id ? " is-hf" : ""}`} style={{ "--c": CC[j.ag] }} job={j.id} onEnter={() => enterF(j.id)} onLeave={leaveF} onClick={() => onOpen(j)} />; })}
              {want[li] > 0 && (() => { const z = 0.08 + (doneN[li] + Math.min(want[li] / unit, 7)) * FH - 0.03, X0 = x - BLD_W / 2 - 0.1, Y0 = y - BLD_W / 2 - 0.1, w = BLD_W + 0.2;
                return <polygon className={`bd-wl${short[li] > 0 ? " is-under" : ""}${li === worst && short[li] > 1 ? " is-worst" : ""}`} points={pts(P, [[X0, Y0, z], [X0 + w, Y0, z], [X0 + w, Y0 + w, z], [X0, Y0 + w, z]])} />; })()}
            </g>
          );
        })}
      </svg>
      <canvas ref={cvs} className="bd-cv" />
      <div className="bd-gk"><span><i className="is-fl" />{unit === 1 ? "Each floor is a job" : `Each floor is about ${unit} jobs`}</span><span><i className="is-wl" />The work the gap calls for</span></div>
      {/* the agents, as their orbs; hover one for what it's doing, click to open it */}
      {IDS.map((id, k) => { const q = S(PADS[id], S_AG, DECK.z), on = !focus || focus === id, work = crewWork(id);
        // standing on the walkway, as a puppet (puppet.jsx). Working: back at its station doing its working gestures (the line runs
        // from its feet), its coat's light pulses. Idle: it wanders along the walkway at its own pace and its line is gone. No name: hover says who
        const bh = Math.round(u * 3.4), bw = Math.round(bh * 0.45), roam = Math.round(u * 1.3 * 300 / bh);
        return <button key={id} ref={crewEl[id]} aria-label={`${AG[id].n}, ${work ? "working" : "idle"}`} className={`bd-orb3 is-body ${work ? "is-work" : "is-idle"}${focus === id ? " is-on" : ""}${ghost?.ags.includes(id) ? " is-ghost" : ""}`} style={{ left: q[0], top: q[1], opacity: on ? 1 : 0.3, "--c": CC[id], "--o": bw + "px" }} onClick={() => onAgent(id)} onPointerEnter={() => setHoverAg(id)} onPointerLeave={() => setHoverAg(null)}>
          <span className="bd-walk"><Puppet id={id} h={bh} work={work} roam={roam} seed={k + 1} host={crewEl[id]} color={CC[id]} /></span>
        </button>; })}
      <AnimatePresence>{hoverAg && openKey !== `agent-${hoverAg}` && (() => { const q = S(PADS[hoverAg], S_AG); return <AgentPeek key={hoverAg} id={hoverAg} x={Math.min(W - 140, Math.max(140, q[0]))} y={q[1] + u * 0.65 + 12} jobs={jobs} inScope={inScope} D={D} />; })()}</AnimatePresence>
      {/* the lanes: name, the number the work is moving, how much is on it */}
      {COL.n.map((n, li) => { const q = S(TT(li), S_BLD + 2.3), k = kpiRow(COL.row(li)), js = lanes[li].filter(vis), need = js.find((j) => j.st === "need"), on = hl == null || hl === li;
        return <div key={li} className={`bd-lane${on ? "" : " is-off"}${lit[li] ? " is-lit" : ""}${gcol === li ? " is-ghost" : ""}${COL.out && COL.out(li) ? " is-out" : ""}`} style={{ left: q[0], top: q[1], width: Math.max(84, Math.min(160, S(TT(1), S_BLD)[0] - S(TT(0), S_BLD)[0] - 10)) }}
          onPointerEnter={(e) => { enterL(li); clearTimeout(solT.current); clearTimeout(hold.current); clearTimeout(pend.current); setHf(null); // the label wins over any job card
            const el = e.currentTarget; if (short[li] > 1 && !calm) solT.current = setTimeout(() => { const b = el.querySelector(".bd-pace"), o = el.offsetParent; if (b && o) { const r = b.getBoundingClientRect(), R = o.getBoundingClientRect(); setAnc({ l: r.left - R.left, r: r.right - R.left, y: r.top + r.height / 2 - R.top }); } setFill(li); }, 160); }} onPointerLeave={() => { leaveL(); clearTimeout(solT.current); solT.current = setTimeout(() => setFill(null), 260); }}>
          <span className="bd-lane-n">{n}</span>
          {(() => { const em = <em className={`is-${k.p == null ? "none" : kindOf(COL.row(li)) === "ceil" ? "off" : hStatus(k.p)}`}>{saidOf(COL.row(li))}</em>;
            // a lane that's behind: its pace is the button. Point at it and it says what it does
            return short[li] > 1 && !calm
              ? <span className="bd-lane-k"><button className="bd-pace" onClick={(e) => { e.stopPropagation(); clearTimeout(solT.current); setHf(null); setFill(fill === li ? null : li); }}>{em}<b>Close the gap</b></button></span>
              : <span className="bd-lane-k">{em}<span className="nw">{liveN[li]} {liveN[li] === 1 ? "job" : "jobs"}</span></span>; })()}
          <AnimatePresence initial={false}>{hl === li && !(short[li] > 1 && !calm) && <motion.span className="bd-lane-x" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>{k.n} {k.v}</motion.span>}</AnimatePresence>
        </div>; })}
      <AnimatePresence>{fill != null && (() => { const li = fill, q = S(TT(li), S_BLD + 2.3), have = new Set(laneAll[li].map((j) => j.t)), props = (GAP_JOBS[LANE_N[COL.lane(li)]] || GAP_JOBS._).filter((x) => !have.has(x[0])).slice(0, Math.max(1, Math.min(short[li], 9 - laneAll[li].length))), right = q[0] < W / 2;
        return <SolveCard key={li} lane={COL.lane(li)} title={COL.key === "lanes" ? null : gapOfRow(COL.n[li], COL.row(li))} props={props} x={anc ? (right ? anc.r + 10 : anc.l - 10) : (right ? q[0] + 82 : q[0] - 82)} y={anc ? anc.y : q[1] + 22} right={right} light={light}
          onEnter={() => { clearTimeout(solT.current); clearTimeout(hlT.current); setHl(li); }} onLeave={() => { solT.current = setTimeout(() => setFill(null), 220); hlT.current = setTimeout(() => setHl(null), 220); }}
          onStart={(pick) => { pick.forEach(([t, ag]) => onAdd(t, [ag], COL.lane(li), COL.metric(li))); if (pick.length === props.length) setFill(null); }} />; })()}</AnimatePresence>
      {/* the job you have open (or are pointing at) is marked where it lives: its floor lights and a leader rises to its name */}
      <AnimatePresence>{peek && !hf && (() => { const j = jobs.find((x) => x.id === peek); if (!j || cOf(j) < 0) return null; const c = cOf(j), L = lanes[c], k = L.findIndex((x) => x.id === j.id); if (k < 0) return null;
        const q = S(TT(c), S_BLD, 0.08 + k * FH + FH / 2), top = S(TT(c), S_BLD, roofZ(c) + 1.1);
        return <motion.div key={peek} className="bd-here" style={{ left: q[0], top: top[1], height: q[1] - top[1], "--c": CC[j.ag] }} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
          <span><Orb id={j.ag} size={12} />{COL.n[c]}<i className="sep">·</i>floor {k + 1} of {L.length}</span><i /></motion.div>; })()}</AnimatePresence>
      {/* a decision waiting on you marks its building */}
      {COL.n.map((_, li) => { const nj = lanes[li].find((j) => j.st === "need" && vis(j)); if (!nj || (peek === nj.id && !hf)) return null; const q = S(TT(li), S_BLD, roofZ(li) + 0.55);
        return <button key={"n" + li} className="bd-need" style={{ left: q[0], top: q[1] }} onClick={() => onOpen(nj)} onPointerEnter={() => enterF(nj.id)} onPointerLeave={leaveF}><i /><span>Needs you</span></button>; })}
      {/* hovering a floor: what it is, a look at it, and a place to say something about it */}
      {/* the card sits beside the building, level with the floor, so moving up and down the floors never hides the next one */}
      <AnimatePresence>{fj && fill == null && openKey !== `job-${fj.id}` && (() => { const fc = cOf(fj); if (fc < 0) return null; const k = lanes[fc].findIndex((j) => j.id === fj.id), z = 0.08 + (k + 0.5) * FH, cx = TT(fc);
        const cs = [[cx + BLD_W, S_BLD - BLD_W], [cx + BLD_W, S_BLD + BLD_W], [cx - BLD_W, S_BLD - BLD_W], [cx - BLD_W, S_BLD + BLD_W]].map(([a, b]) => S(a, b, z));
        const xr = Math.max(...cs.map((c) => c[0])), xl = Math.min(...cs.map((c) => c[0])), yc = S(cx, S_BLD, z)[1], right = xr + 18 + 300 < W;
        return <Peek light={light} key={fj.id} j={fj} D={D} ps={ps} side={right ? "r" : "l"} x={right ? xr + 18 : xl - 18} y={Math.max(90, Math.min(H - 90, yc))} thread={threads[fj.id] || []} say={say} onOpen={onOpen}
          onEnter={() => { clearTimeout(hold.current); clearTimeout(pend.current); }} onLeave={() => { if (!lockP.current) leaveF(); }} onLock={(v) => { lockP.current = v; if (!v) leaveF(); }} />; })()}</AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------- the side: one column that follows what you're looking at
// Home → an agent → one of its jobs, each a step deeper in the same place. Hover an orb to peek at that agent, move into the
// column to stay. Talk to any agent from here: it answers from what it's actually doing, and the jobs it mentions light on the board.
const thoughtNow = (j) => { const th = j.think || []; return th.length ? th[Math.min(th.length - 1, j.st === "done" ? th.length - 1 : Math.floor(j.prog * th.length))] : null; };
const pctOf = (j) => Math.round(j.prog * 100);
// where a job is, honestly: the step it's on out of the steps it has (no made-up percentages)
const stepOf = (j) => { if (j.stepN) return [Math.min(j.stepK, j.stepN), j.stepN]; const n = (j.think || []).filter((t) => !/^Starting on /.test(t)).length; return n ? [Math.max(1, Math.min(n, Math.ceil(j.prog * n))), n] : null; };
const stepTxt = (j) => { const s = stepOf(j); return s ? `Step ${s[0]} of ${s[1]}` : "Starting"; };
const brief = (j) => ({ id: j.id, title: j.t, lane: LANE_N[j.lane], state: ST_PILL[j.st], ...(j.st === "run" ? { step: stepTxt(j), thinking: thoughtNow(j) } : {}), ...(j.wait ? { waitingOn: j.wait } : {}), forUser: !!j.mine });
// when Claude can't be reached, the agent still answers, from the same data
function localReply(ag, jobs, q) {
  const mine = jobs.filter((j) => j.ag === ag), run = mine.filter((j) => j.st === "run").sort((a, b) => b.prog - a.prog), need = mine.filter((j) => j.st === "need"), done = mine.filter((j) => j.st === "done"), wait = mine.filter((j) => j.st === "wait"), ql = q.toLowerCase();
  if (/done|finish|today|shipped/.test(ql)) return { text: done.length ? `${done.length} done today. The latest is “${done[done.length - 1].t}”.` : "Nothing finished yet today.", jobs: done.slice(-3).map((j) => j.id) };
  if (/stuck|slow|block|wait|need|help/.test(ql)) { const L = [...need, ...wait]; return { text: L.length ? L.map((j) => (j.st === "need" ? `“${j.t}” is waiting on your call.` : `“${j.t}” is waiting: ${j.wait.toLowerCase()}.`)).join(" ") : "Nothing’s blocked. Everything I have is moving.", jobs: L.map((j) => j.id) }; }
  if (!run.length) return { text: need.length ? `Nothing running. “${need[0].t}” is waiting on you.` : "Nothing running right now.", jobs: need.map((j) => j.id) };
  const t = run[0], th = thoughtNow(t);
  return { text: `I’m on ${run.length} right now. Furthest along is “${t.t}”, on ${stepTxt(t).toLowerCase()}${th ? `: ${th.charAt(0).toLowerCase() + th.slice(1)}` : "."}${need.length ? ` And “${need[0].t}” needs you.` : ""}`, jobs: [...run.slice(0, 2), ...need].map((j) => j.id) };
}
async function askAgent(sm, ag, jobs, thread, q, job) {
  const a = AG[ag], mine = jobs.filter((j) => j.ag === ag).map(brief);
  if (!sm) return job ? { text: `Got it. I’ll work that into “${job.t}” before I go on.`, jobs: [job.id] } : localReply(ag, jobs, q);
  const conv = thread.filter((m) => m.text && !m.pending).slice(-6).map((m) => `${m.who === "you" ? "User" : a.n}: ${m.text}`).join("\n");
  const prompt = [
    `You are ${a.n}, the ${a.role} agent in North, the company workspace at Fello. Answer as ${a.n}, first person: plain, specific, warm but brief. 1–3 sentences, under 55 words. No lists, no markdown.`,
    `Only use facts from the jobs below; never invent numbers, names or dates. If asked what you're doing, name the jobs and where they stand.`,
    job ? `The user is looking at one job and is steering it: ${JSON.stringify(brief(job))}. Say plainly what you'll change and when.` : "",
    `Your jobs right now: ${JSON.stringify(mine)}`,
    conv ? `Conversation so far:\n${conv}` : "",
    `User: ${q}`,
    `Reply with JSON only: {"text": "<your reply>", "jobs": ["<id of every job you mention>"]}`,
  ].filter(Boolean).join("\n\n");
  try { const r = await sm.json(prompt, { modelTier: "quick", cache: false }); if (r && typeof r.text === "string") return { text: r.text, jobs: (r.jobs || []).filter((id) => jobs.some((j) => j.id === id)) }; } catch (e) {}
  return job ? { text: `Got it. I’ll work that into “${job.t}” before I go on.`, jobs: [job.id] } : localReply(ag, jobs, q);
}
function useSample() {
  const ref = useRef(null);
  useEffect(() => { let on = true; try { window.claude?.use?.("sample").then((sm) => { if (on) ref.current = sm; }).catch(() => {}); } catch (e) {} return () => { on = false; }; }, []);
  return ref;
}
const ASKS = ["What are you working on?", "Anything stuck?", "What did you finish today?"];
function Msgs({ ag, thread, jobs, onOpen, setPeek, skip }) {
  const end = useRef(null);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [thread.length, thread[thread.length - 1]?.pending]);
  return (
    <div className="sd-msgs">
      {thread.map((m, i) => (
        <motion.div key={i} className={`sd-m is-${m.who}`} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
          {m.who === "ag" && <Orb id={m.ag || ag} size={14} live={m.pending} />}
          <div>{m.who === "ag" && m.ag && m.ag !== ag && <b className="sd-m-who">{AG[m.ag].n}</b>}{m.pending ? <span className="sd-m-wait">{AG[m.ag || ag].n} is looking…</span> : <p>{m.text}</p>}
            {m.jobs?.filter((id) => id !== skip).length > 0 && <span className="sd-refs">{m.jobs.filter((id) => id !== skip).map((id) => { const j = jobs.find((x) => x.id === id); return j && <button key={id} onClick={() => onOpen(j)} onPointerEnter={() => setPeek(id)} onPointerLeave={() => setPeek(null)}><i className={`is-${j.st}`} />{j.t}</button>; })}</span>}</div>
        </motion.div>))}
      <span ref={end} />
    </div>
  );
}
// the field in a job's view and an agent's card. "@" lists the crew, same as the chat: bring someone into what you're talking about
function Composer({ ag, ph, onSend, asks }) {
  const [t, setT] = useState(""), [hi, setHi] = useState(0), ref = useRef(null);
  const at = t.match(/(^|\s)@(\w*)$/), opts = at ? IDS.filter((id) => AG[id].n.toLowerCase().startsWith(at[2].toLowerCase())) : [];
  useEffect(() => setHi(0), [at?.[2]]);
  const pick = (id) => { setT((v) => v.replace(/@(\w*)$/, `@${AG[id].n} `)); ref.current?.focus(); };
  const go = (v) => { v = (v ?? t).trim(); if (!v) return; onSend(v); setT(""); };
  const key = (e) => {
    if (opts.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) { e.preventDefault(); setHi((h) => (h + (e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length); return; }
    if (opts.length && (e.key === "Enter" || e.key === "Tab")) { e.preventDefault(); pick(opts[hi]); return; }
    if (opts.length && e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setT((v) => v.replace(/@(\w*)$/, "")); return; }
    if (e.key === "Enter") go();
  };
  return (
    <div className="sd-cmp">
      {asks && <div className="sd-asks">{asks.map((q) => <button key={q} onClick={() => go(q)}>{q}</button>)}</div>}
      <AnimatePresence>{opts.length > 0 && <motion.div key="at" className="ag-pick sd-pick" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4, transition: { duration: 0.1 } }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} onMouseDown={(e) => e.preventDefault()}>
        {opts.map((id, i) => <button type="button" key={id} className={i === hi ? "is-act" : ""} onMouseEnter={() => setHi(i)} onClick={(e) => { e.preventDefault(); pick(id); }}><Orb id={id} size={20} /><b>{AG[id].n}</b><small>{AG[id].role}</small></button>)}
      </motion.div>}</AnimatePresence>
      <div className="sd-in"><Orb id={ag} size={14} /><input ref={ref} value={t} onChange={(e) => setT(e.target.value)} onKeyDown={key} placeholder={ph} />
        <button className={`sd-send${t.trim() ? " is-on" : ""}`} disabled={!t.trim()} onClick={() => go()} aria-label="Send"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" /></svg></button></div>
    </div>
  );
}
const Back = ({ children, onClick }) => <button className="sd-back" onClick={onClick}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.2 2 3.2 5l3 3" /></svg>{children}</button>;
const JobLine = ({ j, onOpen, setPeek, D, live }) => { const th = thoughtNow(j);
  return <button className={`sd-j is-${j.st}`} onClick={() => onOpen(j)} onPointerEnter={() => setPeek(j.id)} onPointerLeave={() => setPeek(null)}>
    <span className="sd-j-r"><b>{j.t}</b>{j.st === "run" && <em>{stepTxt(j)}</em>}</span>{live && th ? <small><Typed key={th} text={th} ms={D.typeMs} /></small> : <small>{j.st === "wait" ? j.wait : j.st === "need" ? "Waiting on your call" : LANE_N[j.lane]}</small>}</button>; };
const CHEV = <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 3 4 5.5 6.5 3" /></svg>;
// the rest stays folded: a row of quiet tabs, one opens at a time, so opening something never lands you in a wall of text
function Reveal({ tabs, open: o0 = null }) {
  const T = tabs.filter(Boolean), [o, setO] = useState(o0);
  useEffect(() => { if (o0) setO(o0); }, [o0]);
  if (!T.length) return null;
  const cur = T.find((t) => t[0] === o);
  return (
    <div className="rv">
      <div className="rv-tabs">{T.map(([k, l]) => <button key={k} className={o === k ? "is-on" : ""} onClick={() => setO(o === k ? null : k)}>{l}{CHEV}</button>)}</div>
      <AnimatePresence initial={false} mode="popLayout">{cur && <motion.div key={o} className="rv-body" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}><div className="rv-in">{cur[2]}</div></motion.div>}</AnimatePresence>
    </div>
  );
}

// opening anything: like a key metric opening on Home. The box grows from the thing you clicked to its open size and clips
// its content, which is laid out at the open width from the start, so nothing stretches; then the content settles in, top down.
const OPEN_E = [0.32, 0.72, 0, 1];
function Grow({ from, to, width, maxH, className, children, home }) {
  // closing collapses into the thing itself, wherever it sits now (the job's floor on the board, its row in the list), measured
  // as it closes; with nothing to go back to it folds up and away as before
  const FOLD = { clipPath: "inset(0% 0% 100% 0% round 10px)", opacity: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1], opacity: { duration: 0.1, delay: 0.2 } } };
  const back = () => { const st = document.querySelector(".v8-stage"), el = home && document.querySelector(home); if (!st || !el) return FOLD;
    const S = st.getBoundingClientRect(), r = el.getBoundingClientRect(); if (!r.width || !r.height || r.bottom < S.top || r.top > S.bottom) return FOLD;
    return { left: r.left - S.left, top: r.top - S.top, bottom: "auto", width: r.width, height: r.height, opacity: 0, transition: { duration: 0.34, ease: [0.55, 0, 0.25, 1], opacity: { duration: 0.1, delay: 0.26 } } }; };
  return (
    <motion.div className={className} initial={from} animate={to} style={{ clipPath: "inset(0% 0% 0% 0% round 10px)" }} variants={{ out: back }} exit="out" transition={{ duration: 0.55, ease: OPEN_E }}>
      {/* on close the content goes first, quickly, then the box collapses into where the job lives */}
      <motion.div className="cd-in" style={{ width, maxHeight: maxH }} exit={{ opacity: 0, transition: { duration: 0.1, ease: "linear" } }}>{children}</motion.div>
    </motion.div>
  );
}
const relRect = (el, host) => { const r = el.getBoundingClientRect(), H = host.getBoundingClientRect(); return { x: r.left - H.left, y: r.top - H.top, w: r.width, h: r.height, b: r.bottom - H.top }; };

// the day's count: only the digits that change move. Each one dissolves into its next value in place (a soft blur crossfade
// with a touch of scale), so 13 to 14 leaves the 1 untouched and turns the 3 into a 4.
function Roll({ n }) {
  const ds = String(n).split(""), L = ds.length;
  return (
    <span className="roll" aria-label={`${n}`}>
      {ds.map((d, i) => (
        <span key={"p" + (L - i)} className="roll-c">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span key={d} className="roll-n" initial={{ opacity: 0, filter: "blur(10px)", scale: 0.92 }} animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }} exit={{ opacity: 0, filter: "blur(10px)", scale: 1.06 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>{d}</motion.span>
          </AnimatePresence>
        </span>))}
    </span>
  );
}
// the left rail: the one number, what needs you, the crew with how far through today they are
// the decisions waiting on you, as a deck. One sits at the front with the rest just behind it; hover the front one and it
// opens in place with the call to make, click it and it becomes the whole column. Scroll, or the pager, to sift the deck.
function NeedStack({ needs, onOpenRail, onApprove, onPass }) {
  const [front, setFront] = useState(0), [hov, setHov] = useState(false), wheelAt = useRef(0), n = needs.length;
  useEffect(() => { if (front >= n) setFront(0); }, [n]);
  const f = Math.min(front, n - 1), go = (d) => setFront((x) => (x + d + n) % n);
  const sift = (e) => { const t = performance.now(); if (n < 2 || t - wheelAt.current < 420 || Math.abs(e.deltaY) < 4) return; wheelAt.current = t; go(e.deltaY > 0 ? 1 : -1); };
  return (
    <div className="ns" onWheel={sift}>
      {n > 1 && <div className="ns-pg"><button onClick={() => go(-1)} aria-label="Previous"><svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 1.5 2.5 4 5 6.5" /></svg></button><span>{f + 1}<i>/{n}</i></span><button onClick={() => go(1)} aria-label="Next"><svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 1.5 5.5 4 3 6.5" /></svg></button></div>}
      <div className="ns-deck" style={{ paddingBottom: Math.min(2, n - 1) * 5 }}>
        {needs.map((j, i) => { const o = (i - f + n) % n; if (o > 2) return null; const c = NEEDS.find((x) => x.id === j.need), top = o === 0;
          return (
            <motion.div key={j.id} className={`ns-c${top ? " is-top" : ""}`} style={{ zIndex: 5 - o, position: top ? "relative" : "absolute" }}
              initial={false} animate={{ y: o * 5, scale: 1 - o * 0.04, opacity: 1 - o * 0.4 }} transition={{ type: "spring", visualDuration: 0.4, bounce: 0.1 }}
              onPointerEnter={() => top && setHov(true)} onPointerLeave={() => top && setHov(false)} onClick={() => (top ? onOpenRail(j) : setFront(i))}>
              {top && <>
                <span className="rl3-nc-h"><Orb id={j.ag} size={12} />{AG[j.ag].n}<span className="nc-lane">{LANE_N[j.lane]}</span></span>
                <b>{j.t}</b>
                <AnimatePresence initial={false}>{hov && c && <motion.div className="ns-more" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
                  <p>{c.rec}</p>
                  <div className="ns-a" onClick={(e) => e.stopPropagation()}><button className="btn-pri" onClick={() => onApprove(j)}>{c.act}</button><button className="ns-open" onClick={() => onOpenRail(j)}>Open</button></div>
                </motion.div>}</AnimatePresence></>}
            </motion.div>
          ); })}
      </div>
    </div>
  );
}
// the rail is a surface like the board: hover an agent and its row slides open with what it's doing; click and the row
// becomes the whole column (an agent, then any of its jobs, in the same place). Nothing opens anywhere else from here.
function Rail({ jobs, scope, hl, panel, setPanel, onRailAg, light, D, ps, setPs, threads, say, comms, onApprove, onPass, onStart, setPeek, full, onFull }) {
  const inScope = jobs.filter((j) => !j.arch && inS(j, scope)), sel = inScope.filter((j) => hl == null || j.lane === hl);
  const c = (s, L = sel) => L.filter((j) => j.st === s).length;
  const needs = inScope.filter((j) => j.st === "need"), meHead = scope === "me" && hl == null && needs.length > 0;
  const who = typeof scope === "string" && scope.startsWith("p:") ? scope.slice(2) : null, book = useBook();
  const title = hl != null ? LANE_N[hl] : who ? `${who}’s jobs` : scope === "me" ? "Your jobs" : "Whole company";
  const [hov, setHov] = useState(null), [msg, setMsg] = useState({}), box = useRef(null), down = useRef(null), [moreDone, setMoreDone] = useState(false);
  const pj = panel?.k === "job" && jobs.find((x) => x.id === panel.id);
  const srcRect = () => { const el = down.current?.closest?.(".rl3-ag, .ns-c"); return el && box.current ? relRect(el, box.current) : null; };
  const openJob = (j, from) => setPanel({ k: "job", id: j.id, from: from || null, r: from ? panel.r : srcRect() });
  const openAg = (id) => setPanel({ k: "agent", id, r: srcRect() });
  const H = box.current?.clientHeight || 800;
  const [agWide, setAgWide] = useState(false);
  const live = (li) => jobs.filter((j) => !j.arch && j.lane === li && j.st !== "done" && j.st !== "need").length, nw = (n, one, many) => `${cap(n2w(n))} ${n === 1 ? one : many}`;
  const waiting = needs.length ? `, and ${n2w(needs.length)} ${needs.length === 1 ? "call is" : "calls are"} waiting on you` : "";
  // the anchor: one big number, the jobs. It answers to the tabs (me / company / a person), never to hovering the board.
  const runN = inScope.filter((j) => !j.arch && j.st === "run").length;
  const lead = who ? { n: String(runN), t: `${runN === 1 ? "job" : "jobs"} running for ${who}` } : { n: String(c("done", inScope)), t: scope === "me" ? "of your jobs done today" : "jobs done today" };
  useEffect(() => { if (panel?.k !== "agent") setAgWide(false); }, [panel?.k]);
  return (
    <aside ref={box} className={`rl3${panel ? " is-panel" : ""}`} onPointerDownCapture={(e) => { down.current = e.target; }}>
      <>
        <AnimatePresence mode="popLayout" initial={false}>
          {!panel ? (
            <motion.div key="list" className="rl3-list" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { duration: 0.35, delay: 0.16 } }} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
              {/* the anchor: the gap as one big number, rolling as you hover lanes or pick a person */}
              <div className="rl3-big"><Roll n={lead.n} /></div>
              <AnimatePresence mode="popLayout" initial={false}><motion.p key={(who || "") + scope} className="rl3-lead" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}><span>{lead.t}</span></motion.p></AnimatePresence>
              {/* what's waiting on you comes first, and is called out: it's the only thing here that stops work */}
              {needs.length > 0 && <section className="rl3-sec rl3-needs"><h6 className="is-need">{needs.length === 1 ? "1 decision needs you" : `${needs.length} decisions need you`}</h6><NeedStack needs={needs} onOpenRail={(j) => openJob(j)} onApprove={onApprove} onPass={onPass} onStart={onStart} /></section>}
              {(() => { const all = inScope.filter((j) => j.st === "done" && !j.approved && !j.seen).sort((x, y) => ageOf(x) - ageOf(y)).filter((j, i, A) => A.findIndex((y) => y.t === j.t) === i), ck = hl == null ? book.checks : []; if (!all.length && !ck.length) return null;
                const ready = moreDone ? all : all.slice(0, 4);
                return <section className="rl3-sec rl3-ready"><h6>Ready for you</h6>
                  {ck.map((c) => <div key={c.id} className="rl3-rd is-static"><span className="rl3-rd-t"><Orb id={c.ag} size={12} /><b>{c.what}</b></span><span className="rl3-rd-m">Approved<i className="sep">·</i>checking {c.due}</span></div>)}
                  {ready.map((j) => { const d = deliveryOf(j);
                  return <button key={j.id} className="rl3-rd" onClick={() => openJob(j)}><span className="rl3-rd-t"><Orb id={j.ag} size={12} /><b>{j.t}</b></span><span className="rl3-rd-m">For {d.who}<i className="sep">·</i>{agoT(ageOf(j))}</span></button>; })}
                  {all.length > 4 && <button className="rl3-more" onClick={() => setMoreDone((v) => !v)}>{moreDone ? "Show less" : `Show all ${all.length}`}</button>}</section>; })()}
              {scope === "me" && hl == null && <RoutineList />}
              {who && hl == null ? (() => { const L = inScope.filter((j) => !j.arch && j.st !== "done" && j.st !== "need").sort((a, b) => ORDER_L[a.st] - ORDER_L[b.st] || b.prog - a.prog); if (!L.length) return null;
                return <section className="rl3-sec rl3-ready"><h6>Running</h6>{L.map((j) => <button key={j.id} className="rl3-rd" onClick={() => openJob(j)}><span className="rl3-rd-t"><Orb id={j.ag} size={12} /><b>{j.t}</b></span><span className="rl3-rd-m">{AG[j.ag].n}<i className="sep">·</i>{j.st === "run" ? stepTxt(j) : j.st === "wait" ? (j.theirs ? j.wait : "Waiting on data") : "Up next"}</span></button>)}</section>; })() :
              <section className="rl3-sec"><h6>Running</h6>
                {IDS.map((id) => { const mine = inScope.filter((j) => j.ag === id), run = mine.filter((j) => j.st === "run").sort((a, b) => b.prog - a.prog), d = mine.filter((j) => j.st === "done").length, now = run[0], th = now && (thoughtNow(now) || now.t);
                  return <motion.div key={id} role="button" tabIndex={0} className={`rl3-ag${hov === id ? " is-hov" : ""}`} onClick={(e) => { if (!e.target.closest("input, .rl3-send")) openAg(id); }}
                    onPointerEnter={() => { setHov(id); onRailAg(id); }} onPointerLeave={() => { if (!(msg[id] || "").trim()) { setHov(null); onRailAg(null); } }}>
                    <span className="rl3-ag-t"><b>{AG[id].n}</b><small>{run.length} working</small></span>
                    <span className="rl3-ag-n">{d}<i>/{mine.length} done</i></span>
                    <span className="rl3-bar"><AgentTicks id={id} mine={mine} /></span>
                    {book.rules.filter((r) => r.ag === id).map((r) => <span key={r.id} className="rl3-so">{r.known ? `Watching ${LANE_N[r.lane]} ${r.dir === "lt" ? "below" : "above"} ${r.n}%` : `Watching: ${r.cond}`}<i className="sep">·</i>{r.fired ? "started today" : r.known ? `now ${r.now}%` : "standing order"}</span>)}
                    <AnimatePresence initial={false}>{hov === id && <motion.span key="now" className="rl3-now" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                      {now ? <span><Typed key={th} text={th} ms={D.typeMs} /></span> : <span>Nothing running.</span>}
                      <span className="rl3-msg"><input value={msg[id] || ""} placeholder={`Message ${AG[id].n}…`} onChange={(e) => setMsg((M) => ({ ...M, [id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter" && (msg[id] || "").trim()) { say(id, msg[id].trim()); setMsg((M) => ({ ...M, [id]: "" })); openAg(id); } if (e.key === "Escape") setMsg((M) => ({ ...M, [id]: "" })); }} />
                        <button className={`rl3-send${(msg[id] || "").trim() ? " is-on" : ""}`} aria-label="Send" onClick={() => { if (!(msg[id] || "").trim()) return; say(id, msg[id].trim()); setMsg((M) => ({ ...M, [id]: "" })); openAg(id); }}><svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" /></svg></button></span>
                    </motion.span>}</AnimatePresence>
                  </motion.div>; })}
              </section>}
            </motion.div>
          ) : (
            (() => { const BW = (box.current?.parentElement?.clientWidth || 1200), PW = panel.k === "job" ? (full ? BW - 16 : Math.min(900, BW - 20)) : agWide ? Math.min(860, BW - 20) : 380; return (
            <Grow key={"panel" + panel.k} className={`rl3-panel cd is-${panel.k}${(panel.k === "job" || agWide) && PW >= 700 ? " is-wide" : ""}${full && panel.k === "job" ? " is-full" : ""}`} width={PW} maxH={H - 20}
              from={panel.r ? { left: panel.r.x, top: panel.r.y, width: panel.r.w, height: panel.r.h, opacity: 1 } : { left: 10, top: 10, width: 380, height: H - 20, opacity: 1 }} to={full && panel.k === "job" ? { left: 8, top: 8, width: PW, height: H - 16, opacity: 1 } : { left: 10, top: 10, width: PW, height: H - 20, opacity: 1 }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={panel.k + panel.id} className="cd-pane" exit={{ opacity: 0, transition: { duration: 0.1 } }}>
                  {panel.k === "agent" ? <AgentCard wide={agWide} onWide={() => setAgWide((w) => !w)} light={light} id={panel.id} D={D} jobs={jobs} scope={scope} thread={threads[panel.id] || []} send={(q) => say(panel.id, q)} comms={comms} onOpen={(j) => openJob(j, panel.id)} onClose={() => setPanel(null)} setPeek={setPeek} />
                    : pj ? <JobCard onGoJob={(x) => setPanel({ ...panel, id: x.id, back: [...(panel.back || []), panel.id] })} backJob={panel.back?.length ? jobs.find((x) => x.id === panel.back[panel.back.length - 1]) : null} onBackJob={() => setPanel({ ...panel, id: panel.back[panel.back.length - 1], back: panel.back.slice(0, -1) })} full={full} onFull={onFull} light={light} j={pj} D={D} ps={ps} setPs={setPs} jobs={jobs} thread={threads[pj.id] || []} send={(q) => say(pj.id, q, pj)} from={panel.from} onBack={() => setPanel({ k: "agent", id: panel.from, r: panel.r })} onClose={() => setPanel(null)} onApprove={onApprove} onPass={onPass} onStart={onStart} onOpen={(j) => openJob(j, panel.from)} setPeek={setPeek} /> : null}
                </motion.div>
              </AnimatePresence>
            </Grow>); })()
          )}
        </AnimatePresence>
      </>
    </aside>
  );
}

// ---------------------------------------------------------------- the list: the company's numbers, worst first, with the work on each
// Reads like a statement. Each lane is one line: its number, where it stands, the ticks. Under it, one quiet line per job.
// Hover a job and it opens a little in place (what it's on now, the gap it's closing); click and it grows into the full card.
const NEED_I = <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="6" fill="var(--need)" /><path d="M7 3.9v3.6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" /><circle cx="7" cy="9.9" r=".85" fill="#fff" /></svg>;
const SEV = { off: 0, behind: 1, none: 2, on: 3 };
// the list, back to its first shape: grouped by what each job needs from you, one quiet line per job. Two dropdowns narrow it
// (team, status) so it stays calm however many jobs there are. Hover a job and it opens in place: what the job is, and who it's for.
// One type size throughout; weight and colour carry the hierarchy. Every divider runs the full width.
// find a person: what the agents are running for them (the lanes they own). Picking one scopes the rail, board and list to them.
function PersonSeg({ jobs, scope, setScope }) {
  const [o, setO] = useState(false), [q, setQ] = useState(""), [hi, setHi] = useState(0), ref = useRef(null);
  useEffect(() => { if (!o) return; const f = (e) => { if (!ref.current?.contains(e.target)) { setO(false); setQ(""); } }; window.addEventListener("pointerdown", f); return () => window.removeEventListener("pointerdown", f); }, [o]);
  const cur = typeof scope === "string" && scope.startsWith("p:") ? scope.slice(2) : null, live = jobs.filter((j) => !j.arch);
  const ql = q.trim().toLowerCase(), list = PERSONS().filter((p) => !ql || p.full.toLowerCase().includes(ql) || p.ls.some((li) => LANE_N[li].toLowerCase().includes(ql)))
    .map((p) => ({ ...p, n_: live.filter((j) => p.ls.includes(j.lane)).length, run: live.filter((j) => p.ls.includes(j.lane) && j.st === "run").length }));
  const pick = (p) => { setScope(`p:${p.n}`); setO(false); setQ(""); };
  const T = { duration: 0.5, ease: [0.16, 1, 0.3, 1] };
  return (
    <div className={`dd v7-ps${o ? " is-open" : ""}`} ref={ref}>
      <motion.div className={`dd-b v7-ps-b${cur && !o ? " is-on" : ""}`} role="button" tabIndex={0} initial={false} animate={{ width: o ? 230 : "auto" }} transition={T} onClick={() => { if (!o) { setO(true); setHi(0); } }}>
        {cur && !o && <motion.span layoutId="v7seg" className="v7-pill" transition={{ type: "spring", visualDuration: 0.38, bounce: 0.16 }} />}
        {o ? <input autoFocus value={q} placeholder="Type a name or a team…" onChange={(e) => { setQ(e.target.value); setHi(0); }}
            onKeyDown={(e) => { if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(list.length - 1, h + 1)); } else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(0, h - 1)); } else if (e.key === "Enter" && list[hi]) pick(list[hi]); else if (e.key === "Escape") { e.stopPropagation(); setO(false); setQ(""); } }} />
          : <span>{cur || "A person"}</span>}
      </motion.div>
      <AnimatePresence>{o && <motion.div className="dd-m is-unit v7-pfm" style={{ "--bw": "230px", "--bh": "24px" }} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16 } }}>
        {list.map((p, i) => <button key={p.n} className={`${cur === p.n ? "is-on" : ""}${i === hi && ql ? " is-hi" : ""}`} onClick={() => pick(p)}><span>{p.full}<small>{p.ls.map((li) => LANE_N[li]).join(" · ")}</small></span><em>{p.run ? `${p.run} running` : `${p.n_} ${p.n_ === 1 ? "job" : "jobs"}`}</em></button>)}
        {!list.length && <p className="v7-pf-none">No one by that name owns a lane.</p>}
      </motion.div>}</AnimatePresence>
    </div>
  );
}
function Drop({ value, options, onPick }) {
  const [o, setO] = useState(false), ref = useRef(null), [bs, setBs] = useState({ w: 90, h: 30 });
  useEffect(() => { if (!o) return; const f = (e) => { if (!ref.current?.contains(e.target)) setO(false); }; window.addEventListener("pointerdown", f); return () => window.removeEventListener("pointerdown", f); }, [o]);
  const cur = options.find((x) => x[0] === value) || options[0];
  return (
    <div className="dd" ref={ref}>
      <button className={`dd-b${o ? " is-open" : ""}${value != null ? " is-set" : ""}`} onClick={(e) => { setBs({ w: e.currentTarget.offsetWidth, h: e.currentTarget.offsetHeight }); setO((v) => !v); }}>{cur[3]}<span>{cur[1]}</span>{CHEV}</button>
      <AnimatePresence>{o && <motion.div className="dd-m is-unit" style={{ "--bw": `${bs.w}px`, "--bh": `${bs.h}px` }} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16 } }}>
        {options.map(([k, l, n, ic]) => <button key={String(k)} className={k === value ? "is-on" : ""} onClick={() => { onPick(k); setO(false); }}><span>{ic}{l}</span>{n != null && <em>{n}</em>}</button>)}
      </motion.div>}</AnimatePresence>
    </div>
  );
}
const GROUPS_L = [["done", "Ready for you"], ["need", "Needs you"], ["run", "Working"], ["wait", "Waiting"], ["queue", "Up next"]];
function List({ D, jobs, scope, onOpen, openId }) {
  const [hov, setHov] = useState(null), [fLane, setFLane] = useState(null), [fSt, setFSt] = useState(null), [fAg, setFAg] = useState(null), [by, setBy] = useState(null), [more, setMore] = useState({});
  const inScope = jobs.filter((j) => !j.arch && inS(j, scope));
  const byAg = (j) => fAg == null || j.ag === fAg || (j.with || []).includes(fAg);
  const inLane = inScope.filter((j) => (fLane == null || j.lane === fLane) && byAg(j) && (fSt == null || j.st === fSt));
  // a few jobs read best by status; a company's worth reads best by team, each team under its number
  const mode = by || (inScope.length > 40 ? "team" : "status");
  const sortJ = (L) => [...L].sort((a, b) => ORDER_L[a.st] - ORDER_L[b.st] || (a.st === "run" ? b.prog - a.prog : ageOf(a) - ageOf(b)));
  const groups = mode === "team"
    ? LANE_N.map((n, li) => { const L = inLane.filter((j) => j.lane === li); return { k: "t" + li, l: n, lane: li, js: sortJ(L) }; }).filter((g) => g.js.length)
      .sort((a, b) => (SEVL[laneSt(a.lane)] - SEVL[laneSt(b.lane)]) || (a.lane - b.lane))
    : [...GROUPS_L.map(([k, l]) => ({ k, l, js: sortJ(inLane.filter((j) => j.st === k && (k !== "done" || !j.seen))) })), { k: "seen", l: "Done today", js: sortJ(inLane.filter((j) => j.st === "done" && j.seen)) }].filter((g) => g.js.length);
  const CAP = mode === "team" ? 4 : 6;
  const right = (j) => (j.st === "need" ? "Needs you" : j.st === "run" ? stepTxt(j) : j.st === "wait" ? "Waiting" : j.st === "done" ? agoT(ageOf(j)) : "Up next");
  const count = (L) => { const n = (st) => L.filter((j) => j.st === st).length, p = []; if (n("need")) p.push(<em key="n" className="is-need">{n("need")} need you</em>); if (n("run")) p.push(`${n("run")} working`); if (n("wait") + n("queue")) p.push(`${n("wait") + n("queue")} up next`); if (n("done")) p.push(`${n("done")} done`);
    return p.map((x, i) => <React.Fragment key={i}>{i > 0 && <i className="sep">·</i>}{x}</React.Fragment>); };
  return (
    <div className="lv2">
      <div className="lv2-bar"><div className="lv2-in">
        <Drop value={fLane} onPick={setFLane} options={[[null, "All teams", inScope.length], ...LANE_N.map((n, li) => [li, n, inScope.filter((j) => j.lane === li).length])]} />
        <Drop value={fAg} onPick={setFAg} options={[[null, "All agents", inScope.length], ...IDS.map((id) => [id, AG[id].n, inScope.filter((j) => j.ag === id || (j.with || []).includes(id)).length, <Orb key="o" id={id} size={12} />])]} />
        <Drop value={fSt} onPick={setFSt} options={[[null, "Any status", inScope.length], ...GROUPS_L.map(([k, l]) => [k, l, inScope.filter((j) => j.st === k).length])]} />
        <span className="lv2-sp" />
        <Drop value={by} onPick={setBy} options={[[null, mode === "team" ? "By team" : "By status"], ["status", "By status"], ["team", "By team"]]} />
      </div></div>
      <AnimatePresence mode="wait" initial={false}>
      {/* filtering: the old list eases out, then the new one arrives row by row, top to bottom (each row's delay is its place) */}
      <motion.div key={`${fLane}-${fAg}-${fSt}-${mode}-${scope}`} className="lv2-stg" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}>
      {groups.length === 0 && <div className="lv2-g"><div className="lv2-in"><p className="lv2-0">Nothing here right now.</p></div></div>}
      {(() => { let n = 0; return groups.map((g) => { const open = !!more[g.k], head = g.js.slice(0, CAP), rest = g.js.slice(CAP);
        return (
        <section key={g.k} className={`lv2-g is-${g.k}`}><div className="lv2-in">
          {mode === "team" ? <h5 className="lv2-th" style={{ "--i": n++ }}><span className="lv2-tn">{g.l}</span><em className={`is-${laneSt(g.lane)}`}>{laneSaid(g.lane)}</em><span className="lv2-tc">{count(g.js)}</span></h5>
            : <h5 style={{ "--i": n++ }}>{g.l}<span>{g.js.length}</span></h5>}
          {(() => { const R = (j) => { const open2 = hov === j.id, owner = OWNERS[LANE_N[j.lane]], a = AG[j.ag];
            return (
              <li key={j.id} data-job={j.id} style={{ "--i": n++ }} className={`lv2-r is-${j.st}${openId === j.id ? " is-sel" : ""}`}
                onPointerEnter={() => setHov(j.id)} onPointerLeave={() => setHov((h) => (h === j.id ? null : h))} onClick={() => onOpen(j)}>
                <span className="lv2-i">{j.st === "need" ? NEED_I : <Orb id={j.ag} size={14} live={j.st === "run"} />}</span>
                <span className="lv2-t">{j.t}</span>
                <span className="lv2-s">{right(j)}</span>
                <AnimatePresence initial={false}>{open2 && <motion.div className="lv2-x" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                  <p>{BRIEF[j.t] || BRIEF[j.t.split(" · ")[0]] || (NEEDS.find((x) => x.id === j.need)?.rec) || j.t}</p>
                  <p className="is-q">For {owner ? `${owner}, who runs ${LANE_N[j.lane]}` : LANE_N[j.lane]}<i className="sep">·</i>{j.mine ? "You asked for this" : `${a.n} started it`}</p>
                </motion.div>}</AnimatePresence>
              </li>); };
            return <><ol>{head.map(R)}</ol>
              <AnimatePresence initial={false}>{open && rest.length > 0 && <motion.ol key="rest" className="lv2-rest" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>{rest.map(R)}</motion.ol>}</AnimatePresence></>; })()}
          {g.js.length > CAP && <button className="lv2-more" onClick={(e) => { const sec = e.currentTarget.closest(".lv2-g"); if (open) setTimeout(() => sec?.scrollIntoView({ block: "start", behavior: "smooth" }), 60); setMore((M) => ({ ...M, [g.k]: !M[g.k] })); }}>{open ? "Show less" : `${g.js.length - CAP} more`}</button>}
        </div></section>); }); })()}
      </motion.div>
      </AnimatePresence>
    </div>
  );
}
const SEVL = { off: 0, behind: 1, none: 2, on: 3 };
const laneSt = (li) => { const row = HLANES[li][3][LANE_KPI[li][0]]; return kindOf(row) === "ceil" ? "off" : row[2] == null ? "none" : hStatus(row[2]); };
const ORDER_L = { need: 0, run: 1, wait: 2, queue: 3, done: 4 };

// a job, opened: the card the preview grew into. What it is and where it stands; the thing itself; the rest folded
// a job as a receipt: the number it's about, set out as line items (all from Company health; the gap and the month's
// target are worked out from the same row), where it stands now, what's been done so far, and the particulars.
const NUM = /^([^0-9−-]*)([0-9][0-9,]*\.?[0-9]*)(.*)$/;
function diff(a, b) { const B = String(b).replace(/^(pace|target|ceiling)\s+/, ""), x = numOf(a), y = numOf(B); if (isNaN(x) || isNaN(y)) return null;
  const pct = /%$/.test(String(a).trim()), d = x - y; if (pct) return `${d < 0 ? "−" : "+"}${+Math.abs(d).toFixed(2)} pts`;
  return `${d < 0 ? "−" : "+"}${fmtAs(Math.abs(x) >= Math.abs(y) ? a : B, Math.abs(d))}`; }
// what each job is, in a sentence anyone in the room would follow (written from the job and the prototype's own numbers)
const BRIEF = {
  "Write the Monday sync doc": "Where the year lands against the $40.03M plan, and the levers that close the gap.",
  "Forecast the year with all three levers": "Forecast where the year ends if all three levers land, against the $40.03M plan.",
  "Find where new accounts stall": "Find the step where new accounts get stuck before their first integration.",
  "Find why booked demos don’t happen": "Find out why only about half of booked Inbound demos actually happen, so the no-shows can be fixed.",
  "Re-route the 14 open prospects Sam left": "Hand the 14 open prospects Sam left in Outbound to reps who can work them this month.",
  "Sum up Inbound’s October": "Sum up how Inbound did in October.",
  "Check Inbound’s pipeline against pace": "Check whether Inbound is creating enough pipeline to stay on pace.",
  "Make reminder visuals for webinar sign-ups": "Make reminder visuals so more webinar sign-ups show up to their demo.",
  "Find where Outbound demos drop off": "Find where Outbound demos fall through between being booked and being held.",
  "Rank Sam’s demo list": "Order the 14 open prospects on Sam’s old demo list by who’s most likely to book, so whoever picks them up starts with the best ones.",
  "Find why held demos aren’t closing": "Work out why held demos are closing below target, from the call notes.",
  "Find why new logos are behind pace": "Find out why New Business is signing fewer new customers than its pace.",
  "Review the last 20 lost demos": "Read the last 20 demos that didn’t close and pull out the reasons they have in common.",
  "Find what slows the first 10 handoffs": "Find out why new customers take 20.9 days to reach 10 Felix handoffs when the ceiling is 15.",
  "Group new customers by first contract": "Group new customers by when they signed their first contract, to see which ones are slowest to get going.",
  "Rank at-risk accounts by who to call first": "Rank the accounts behind the $1.98M at risk, so the team calls the biggest and most urgent first.",
  "Explain what’s holding GRR": "Explain what’s keeping gross revenue retention at 97.7%.",
  "Check downgrades and churn": "Check downgrades and churn, which are running $227K under pace.",
  "Find the deals that close the expansion gap": "Find which open expansion deals could close the gap to pace.",
  "Find why expansion deals aren’t closing": "Work out why expansion deals close at 31.9% against a 60% target.",
  "Line up exec sponsors for the top 10 deals": "Line up an executive sponsor for each of the 10 biggest open expansion deals.",
  "Break down Felix handoffs by team": "Break Felix handoffs per 1,000 down by team, to find who uses Felix least.",
  "Find why daily active users are below target": "Find out why daily active users are below the 1,700 target.",
  "Check Felix’s health score": "Check Felix’s health score against its 78 target.",
  "Write the weekly Fello health read": "This week’s read of Fello’s health score.",
};
const lower1 = (t) => t.charAt(0).toLowerCase() + t.slice(1);
// how a number is said out loud in a sentence
const SAY = { "Booked ARR – Outbound": "Outbound’s Booked ARR", "Booked ARR – Inbound": "Inbound’s Booked ARR", "TTV: 10 handoffs": "Time to 10 Felix handoffs", "TTV: first contract": "Time to first contract", GRR: "Gross revenue retention", "SQL → SQO": "SQL to SQO" };
const plural = (n) => /s$/.test(n.split(" ").pop());
function whyOf(j) {
  const { row, name, own } = rowOf(j), [, v, p, s, foot] = row, kind = kindOf(row), lb = lowerOf(row), refK = foot.split(" ")[0], refV = foot.replace(/^\S+\s+/, "");
  const gap = diff(v, foot), gapAbs = gap && gap.replace(/^[−+]/, ""), under = gap && gap.startsWith("−"), said = SAY[name] || name;
  const subj = own || SAY[name] || said.startsWith(LANE_N[j.lane]) ? said : `${LANE_N[j.lane]}’s ${said}`, is = plural(said) ? "are" : "is";
  if (p == null || !gap) return `${subj} ${is} ${v}${refV && p != null ? ` against a ${refV} ${refK}` : ""}.`;
  if (kind === "ceil") return under ? `${subj} ${is} ${v}, ${gapAbs} under its ${refV} ceiling.` : `${subj} ${is} ${v} against a ${refV} ceiling, ${gapAbs} over.`;
  if (lb) return `${subj} ${is} ${v}, ${gapAbs} ${under ? "under" : "over"} its ${refV} ${refK}. Lower is better here.`;
  if (j.t.includes(v)) return `${subj} ${is} ${gapAbs} ${under ? "behind" : "ahead of"} ${refK === "pace" ? "where it should be by today" : `the ${refV} ${refK}`}.`;
  return `${subj} ${is} ${v} against a ${refV} ${refK}, ${gapAbs} ${under ? "behind" : "ahead"}.`;
}
// what each kind of job gives you back. Moving a number: what it's worth. Finding something out: the answer and what to do
// next. Making something: that it's ready, and for whom. (Written for the prototype from Company health's numbers.)
const jobKind = (j) => (j.st === "need" && !NEEDS.find((x) => x.id === j.need)?.propose ? "move" : /^(Find|Explain|Check|Review|Break down)\b/.test(j.t) ? "find" : "make");
const WORTH = { "sam-arr": "$140K of New ARR behind pace, with nothing working on it.", "sam-follow": "11 lost demos with no follow-up within two days, out of the last 20.", "riley-out": "About $680K by Dec 31 if Outbound gets back to pace.", "calvin-smb": "4 of the 29 renewals in Jordan’s book, all due by Dec 31." };
const NEXT = {
  "Explain what’s holding GRR": "Work the at-risk accounts, starting with the ones that renew soonest.",
  "Check downgrades and churn": "Nothing to do here this month.",
  "Check Inbound’s pipeline against pace": "Look at demo held rate instead.",
  "Check Felix’s health score": "Look at what else goes into the health score.",
};
// how work leads to work: a finding sets off the next job (one quiet line, only where a job has a link)
const LEADS = [["Find why held demos aren’t closing", "Review the last 20 lost demos"], ["Explain what’s holding GRR", "Rank at-risk accounts by who to call first"],
  ["Find the deals that close the expansion gap", "Line up exec sponsors for the top 10 deals"], ["Find where Outbound demos drop off", "Approve moving Sam back to Outbound"],
  ["Approve moving Sam back to Outbound", "Rank Sam’s demo list"], ["Find why booked demos don’t happen", "Make reminder visuals for webinar sign-ups"]];
// where a number comes from: any figure in a finding that matches a Company health row can be tapped to see that row
function srcOf(tok) { for (let li = 0; li < HLANES.length; li++) for (const r of HLANES[li][3]) {
    const fv = r[4].replace(/^\S+\s+/, ""); if (r[1] === tok) return `${LANE_N[li]} · ${r[0]}`; if (fv === tok) return `${LANE_N[li]} · ${r[0]}, ${r[4].split(" ")[0]}`; } return null; }
function Rich({ t }) {
  const [o, setO] = useState(null), parts = String(t).split(/(\$?[0-9][0-9,]*(?:\.[0-9]+)?[KMB%d]?)/g);
  return <>{parts.map((x, i) => { const sname = i % 2 && srcOf(x); if (!sname) return x;
    return <span key={i} className="src"><button className={`src-b${o === i ? " is-open" : ""}`} onClick={(e) => { e.stopPropagation(); setO(o === i ? null : i); }}>{x}</button>
      <AnimatePresence>{o === i && <motion.span className="src-p" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 2 }} transition={{ duration: 0.18 }}><b>Company health</b>{sname}<em>As of Oct 27</em></motion.span>}</AnimatePresence></span>; })}</>;
}
const MADE_L = { sync: "the Monday sync doc", forecast: "the forecast", stall: "the report" };
// a job, opened. The same shape for every job: what it is and who it's for, then the work (the thing being made, the steps
// or what was found), then why it matters with the right chart for that number. One body size, one label size.
function Hand({ j, icon = false }) {
  useEffect(() => { naSeen(j.id); }, [j.id]);
  const [open, setOpen] = useState(false), [note, setNote] = useState(null), [fb, setFb] = useState(""), d = deliveryOf(j), A = AG[j.ag];
  const say = (t) => { setNote(t); setTimeout(() => setNote(null), 2400); };
  const pick = (k, l) => { setOpen(false); if (k === "gc") return shareJob(j, say); if (k === "link" || k === "text") { try { navigator.clipboard.writeText(k === "text" ? `${d.t}. ${d.result || ""}` : `north.fello.ai/work/${j.id}`).catch(() => {}); } catch (e) {} } say(shareDone(k, l)); };
  return (
    <div className="rc-hand">
      <div className="rc-acts">
        <span className="rc-add"><button className={`rc-share${icon ? " cd-ib" : ""}${open ? " is-on" : ""}`} onClick={() => setOpen((v) => !v)} aria-label="Share" title="Share"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 10V2.5M5 5.5l3-3 3 3" /><path d="M3 9v3.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V9" /></svg>{icon ? null : "Share"}</button>
          <AnimatePresence>{open && <motion.div className="rc-addm" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
            {SHARE.map(([g, L]) => <div key={g} className="rc-addg"><span>{g}</span>{L.map(([k, l, dd]) => <button key={k} onClick={() => pick(k, l)}><b>{l}</b>{dd && <small>{dd}</small>}</button>)}</div>)}</motion.div>}</AnimatePresence></span>
        {!icon && (j.v || 1) > 1 && <span className="rc-v">v{j.v}{j.note ? ` · “${j.note}”` : ""}</span>}
        <AnimatePresence>{note && <motion.span className="rc-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{note}</motion.span>}</AnimatePresence>
      </div>
    </div>
  );
}
// a job's state in a few words: shown once, at the top of its card
const statusOf = (j) => { const a = AG[j.ag], need = j.st === "need" && NEEDS.find((x) => x.id === j.need), when = ageOf(j) < 1 ? "just now" : agoT(ageOf(j));
  return j.approved ? `Approved ${when}` : need?.propose ? `${a.n} suggests` : j.st === "need" ? "Needs you" : j.st === "done" ? `Done ${when}` : j.st === "run" ? `Working · ${stepTxt(j).toLowerCase()}` : j.st === "wait" ? j.wait : `Up next in ${LANE_N[j.lane]}`; };
function Receipt({ j, D, light, hp, onStart, onRead, onApprove, onPass, onGo, made, madeK, jobs = [] }) {
  const a = AG[j.ag], need = j.st === "need" && NEEDS.find((x) => x.id === j.need), owner = OWNERS[LANE_N[j.lane]];
  const th = (j.think || []).filter((t) => !/^Starting on /.test(t)), k = j.st === "done" ? th.length : j.st === "run" ? Math.max(1, Math.ceil(j.prog * th.length)) - 1 : 0;
  const brief0 = need ? need.rec : BRIEF[j.t] || BRIEF[j.t.split(" · ")[0]] || null, brief = brief0 && brief0.startsWith(j.t + ":") ? cap(brief0.slice(j.t.length + 1).trim()) : brief0;
  const [how, setHow] = useState(false), [docOpen, setDocOpen] = useState(false);
  // the chart is evidence: it sits with what was found (or what happened); until there's a finding it shows the gap the job is closing
  // Outbound's booked ARR has its daily history, so its work shows the days (the drop at Oct 14 is the story) rather than a pace bar
  const outbound = LANE_N[j.lane] === "Outbound" && /booked arr/i.test(rowOf(j).name || "");
  const viz = j.need === "riley-out" || outbound ? <div className="jv jv-trend"><TrendPlot c={OUTBOUND_CARD} p={1} H={132} /></div> : <JobViz j={j} light={light} />;
  // a finding that only restates the headline number is already in the chart and in why it matters, so it's left out
  const hr = rowOf(j).row, found = th.filter((t) => !(t.includes(hr[1]) && t.includes(hr[4].replace(/^\S+\s+/, ""))));
  const kind = jobKind(j), done = j.st === "done", answer = done && kind === "find" && th.length ? ([...th].reverse().find((t) => !/^\w+ing\b/.test(t)) || th[th.length - 1]) : null;
  const shown = !!need?.answer || (done && found.filter((t) => t !== answer).length > 0);
  const came = LEADS.find((l) => l[1] === j.t)?.[0], led = LEADS.find((l) => l[0] === j.t)?.[1];
  const when = ageOf(j) < 1 ? "just now" : agoT(ageOf(j));
  const status = j.approved ? `Approved ${when}` : need?.propose ? `${a.n} suggests` : j.st === "need" ? "Needs you" : j.st === "done" ? `Done ${when}` : j.st === "run" ? `Working · ${stepTxt(j).toLowerCase()}` : j.st === "wait" ? j.wait : `Up next in ${LANE_N[j.lane]}`;
  const forL = `For ${owner ? `${owner}, who runs ${LANE_N[j.lane]}` : LANE_N[j.lane]}`, byL = j.mine ? "you asked" : `${a.n.toLowerCase() === "orin" ? "Orin" : a.n} started it`;
  const [so, setSo] = useState(false);
  // where it came from (the job it builds on) sits under the description; what it leads to sits beside the button you'd press
  const cameJ = came && (jobs.find((y) => y.t === came && !y.arch) || jobs.find((y) => y.t === came));
  const From = came ? <p className="rc-from"><span>From {cameJ ? `${AG[cameJ.ag].n}’s` : "the"} job</span><button onClick={() => onGo?.(came)}>{came}</button></p> : null;
  const Sec = ({ k: label, children }) => <div className="rc-sec">{label && <span className="rc-k">{label}</span>}{children}</div>; // called as a function below, so it never remounts
  // one block: title (above), what it is, where it came from, the chart and what it shows. Then a divider and the next step, if any.
  const descR = done && (j.revised || (!answer && !brief)) && deliveryOf(j).result ? deliveryOf(j).result : answer || null, desc = descR || brief;
  const extra = done ? found.filter((t) => t !== answer) : [];
  const caption = need?.answer ? need.answer.split(/(?<=\.)\s+/).filter((x, i) => !(i === 0 && /pace|target/.test(x))).join(" ") : whyOf(j);
  const nextT = NEXT[j.t] || null, canStart = (j.st === "wait" || j.st === "queue") && onStart;
  const hasNext = (need && (!j.approved || WORTH[need.id])) || nextT || led || canStart;
  return (
    <div className="rc">
      <div className="rc-top">
        {/* the chart first, then everything it shows, together: what was found, why it matters, anything else that came out */}
        <div className="rc-viz">{viz}</div>
        <div className="rc-finds">
          {desc && <p className="rc-p rc-desc">{descR ? <Rich t={desc} /> : desc}</p>}
          <p className="rc-p rc-cap"><Rich t={caption} /></p>
          {extra.length > 0 && <ol className="rc-steps2 rc-after">{extra.map((t) => <li key={t}><i /><span><Rich t={t} /></span></li>)}</ol>}
        </div>
        {From}
        {j.st === "run" && <button className={`rc-steps-t${so ? " is-open" : ""}`} onClick={() => setSo((v) => !v)} aria-expanded={so}>{so ? "Hide the steps" : "See the steps"}{CHEV}</button>}
        <AnimatePresence initial={false}>{j.st === "run" && so && <motion.div className="rc-stp" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
          <ol className="rc-steps2">{th.slice(0, k).map((t) => <li key={t} className="is-done"><i />{t}</li>)}
            <li className="is-now"><i />{thoughtNow(j) && !/^Starting on /.test(thoughtNow(j)) ? <Typed key={thoughtNow(j)} text={thoughtNow(j)} ms={D.typeMs} /> : "Getting started."}</li></ol>
        </motion.div>}</AnimatePresence>
      </div>
      {hasNext && <div className="rc-sec rc-nx"><span className="rc-k">Next step</span>
        {need && WORTH[need.id] && <p className="rc-p rc-next"><span>Worth</span>{WORTH[need.id]}</p>}
        {need && !j.approved && <div className="rc-acts"><button className="btn-pri" onClick={() => onApprove(j)}>{need.act}</button>{need.alt && onPass && <button className="rc-act" onClick={() => onPass(j)}>{need.alt}</button>}
          {led && <span className="rc-then"><span>Then</span><button onClick={() => onGo?.(led)}>{led}</button></span>}</div>}
        {!need && nextT && !led && <p className="rc-p">{nextT}</p>}
        {!need && led && <p className="rc-p"><button className="rc-lnk" onClick={() => onGo?.(led)}>{led}</button></p>}
        {canStart && <div className="rc-acts"><button className="rc-act" onClick={() => onStart(j)}>{j.st === "wait" ? "Start without it" : "Start now"}</button></div>}
      </div>}
      {(need?.stats || need?.work) && <div className="rc-sec is-fold"><button className={`rc-fold${how ? " is-open" : ""}`} onClick={() => setHow((v) => !v)}><span className="rc-k">How {a.n} got there</span>{CHEV}</button>
        <AnimatePresence initial={false}>{how && <motion.div className="rc-fold-b" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
          {need.stats && <div className="rc-fold-g">{need.stats.map(([k2, v2, d2]) => <div key={k2} className="rc-l"><span>{k2}</span><b>{v2}<em>{d2}</em></b></div>)}</div>}
          {need.work && <ol className="rc-steps2">{need.work.map((w) => <li key={w.s} className="is-done"><i />{w.f}</li>)}</ol>}
        </motion.div>}</AnimatePresence></div>}
      {made && Sec({ k: j.st === "done" ? `What ${a.n} made` : `What ${a.n} is making`, children: <>{madeK === "doc" ? <>
          <motion.div className={`rc-made is-clip${docOpen ? " is-open" : ""}`} initial={false} animate={{ height: docOpen ? "auto" : 132 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>{made}</motion.div>
          <div className="rc-acts"><button className="rc-act" onClick={() => setDocOpen((v) => !v)}>{docOpen ? "Show less" : "Read the whole doc"}</button></div></> : <div className="rc-made">{made}</div>}</> })}
    </div>
  );
}
// Outbound's day-by-day bookings, drawn as the chat's own trend chart (TrendPlot in chat.jsx): one series of thin spikes in the
// purple ramp, with grain, and the moment that explains it marked by a coral line and a flag. One chart, one colour; the flag
// carries the story. Data: the Outbound card's daily series (Oct 1 to today).
const DRAWN = new Set(); // a chart draws in the first time you see it; after that it's simply there
function DailyBars({ light, k = "daily" }) {
  const first = useRef(!DRAWN.has(k)); useEffect(() => { DRAWN.add(k); }, []);
  // spikes sit tight, four to a day, stepping evenly between each day's value (no added noise); solid colour with grain
  const box = useRef(null), W = useW(box), S = OUTBOUND_CARD.series, days = S.length, PER = 4, H = 118, FLAG = 22, base = H - 18, m = OUTBOUND_CARD.mark.at;
  const vals = []; for (let i = 0; i < (days - 1) * PER + 1; i++) { const t = i / PER, a0 = Math.floor(t), a1 = Math.min(days - 1, a0 + 1); vals.push(S[a0] + (S[a1] - S[a0]) * (t - a0)); }
  const max = Math.max(...S), dayW = W / 31, pitch = dayW / PER, bw = Math.max(1, pitch * 0.5), col = light ? "#744ccb" : "#b4a1ff";
  const xOf = (i) => (i / PER) * dayW + dayW / 2, lab = OUTBOUND_CARD.mark.label, fw = lab.length * 6.4 + 16, side = xOf(m * PER) + fw > W ? -fw : 0;
  return (
    <div ref={box} className="jv">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Outbound bookings by day in October">
        <g filter="url(#grain)">{vals.map((v, i) => { const h = (v / max) * (base - FLAG - 8);
          return <motion.rect key={i} x={xOf(i) - bw / 2} width={bw} fill={col} initial={first.current ? { y: base, height: 0 } : false} animate={{ y: base - h, height: h }} transition={{ duration: 0.55, ease: VE, delay: 0.05 + i * 0.005 }} />; })}</g>
        <rect x="0" y={base - 0.5} width={W} height="0.5" fill="var(--cardln)" />
        <rect x={xOf(m * PER) - 0.5} y="0" width="1" height={base} fill="var(--coral)" />
        <g transform={`translate(${xOf(m * PER) + side} 0)`}><rect height={FLAG} width={fw} fill="var(--coral)" /><text x="8" y="15" fontSize="11.5" fontWeight="500" fill="#fefbf9">{lab}</text></g>
        <VizText x={0} y={H - 2}>Oct 1</VizText><VizText x={xOf((days - 1) * PER)} y={H - 2} a="middle" c="var(--f2)">Today</VizText><VizText x={W} y={H - 2} a="end">Oct 31</VizText>
      </svg>
    </div>
  );
}
// a job's work, as the top of its own conversation window: who, where it stands, the chart, and what came out. The window is
// the job; this is what you're talking about, right above where you talk about it
// what a job found, in the order the card shows it under its chart: the finding, why it matters, anything else that came out.
// The card and the job's window both use this, so the window never shows less than the card
function findingsOf(j) {
  const need = j.st === "need" && NEEDS.find((x) => x.id === j.need), th = (j.think || []).filter((t) => !/^Starting on /.test(t));
  const brief0 = need ? need.rec : BRIEF[j.t] || BRIEF[j.t.split(" · ")[0]] || null, brief = brief0 && brief0.startsWith(j.t + ":") ? cap(brief0.slice(j.t.length + 1).trim()) : brief0;
  const hr = rowOf(j).row, found = th.filter((t) => !(t.includes(hr[1]) && t.includes(hr[4].replace(/^\S+\s+/, ""))));
  const done = j.st === "done", answer = done && jobKind(j) === "find" && th.length ? ([...th].reverse().find((t) => !/^\w+ing\b/.test(t)) || th[th.length - 1]) : null;
  const descR = done && (j.revised || (!answer && !brief)) && deliveryOf(j).result ? deliveryOf(j).result : answer || null, desc = descR || brief;
  const extra = done ? found.filter((t) => t !== answer) : [];
  const caption = need?.answer ? need.answer.split(/(?<=\.)\s+/).filter((x, i) => !(i === 0 && /pace|target/.test(x))).join(" ") : whyOf(j);
  return { desc, rich: !!descR, caption, extra };
}
function JobWork({ id }) {
  const [, tick] = useState(0); useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1500); return () => clearInterval(t); }, []);
  const j = naJobs().find((x) => x.id === id) || (NA.raw || []).find((x) => x.id === id); if (!j) return null;
  const a = AG[j.ag], d = j.st === "done" ? deliveryOf(j) : null, need = j.st === "need" && NEEDS.find((x) => x.id === j.need);
  const outbound = LANE_N[j.lane] === "Outbound" && /booked arr/i.test(rowOf(j).name || "");
  const viz = j.need === "riley-out" || outbound ? <div className="jv jv-trend"><TrendPlot c={OUTBOUND_CARD} p={1} H={132} /></div> : <JobViz j={j} light />;
  const st = j.st === "done" ? `Done${(j.v || 1) > 1 ? ` · v${j.v}` : ""}` : j.st === "run" ? `Working · ${stepTxt(j).toLowerCase()}${(j.v || 1) > 1 ? ` · v${j.v}` : ""}` : j.st === "need" ? "Needs you" : j.st === "wait" ? j.wait : "Up next";
  const F = findingsOf(j);
  return (
    <div className="stg2 is-light jw">
      <div className="jw-h"><span className={`jw-st is-${j.st}`}><i />{st}</span></div>
      <div className="jw-viz">{viz}</div>
      <div className="jw-finds">
        {F.desc && <p className="jw-r">{F.rich ? <Rich t={F.desc} /> : F.desc}</p>}
        {F.caption && <p className="jw-r">{<Rich t={F.caption} />}</p>}
        {F.extra.length > 0 && <ul className="jw-x">{F.extra.map((t) => <li key={t}><Rich t={t} /></li>)}</ul>}
      </div>
    </div>
  );
}
function JobCard({ j, D, ps, setPs, jobs, thread, send, from, onBack, onClose, onOpenNeed, onApprove, onPass, onGoJob, backJob, onBackJob, onStart, onOpen, setPeek, light, full, onFull, added = null }) {
  const [pick, setPick] = useState(null), [read, setRead] = useState(false), [menu, setMenu] = useState(false);
  // the menu closes when you click anywhere else
  useEffect(() => { if (!menu) return; const f = (e) => { if (!e.target.closest(".cd-menu") && !e.target.closest('[aria-label="More"]')) setMenu(false); };
    document.addEventListener("pointerdown", f, true); return () => document.removeEventListener("pointerdown", f, true); }, [menu]);
  const openRead = () => { setRead(true); if (!full && onFull) onFull(); };
  const a = AG[j.ag], hp = helpersOf(j, ps), p = j.deep && ps.find((q) => q.id === j.deep);
  const T = JOB_TALK[j.t] || [], talk = j.st === "done" ? T : T.slice(0, Math.max(1, Math.ceil((j.prog || 0) * T.length)));
  const made = p ? (p.id === "sync" ? <LiveDoc p={p} D={D} /> : p.id === "forecast" ? <LiveForecast p={p} /> : <LiveStall p={p} D={D} />)
    : j.kind === "images" ? <div className="cd-im">
        <AnimatePresence initial={false} mode="popLayout">{pick != null ? <motion.div key="one" className="im-focus" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
            <button className="im-one" onClick={() => setPick(null)} aria-label="Back to all three"><ImgTile t={IMG[pick]} big /></button>
            <div className="im-side">{IMG.map((t, i) => <button key={t.k} className={`im-c${i === pick ? " is-sel" : ""}`} onClick={() => setPick(i)}><ImgTile t={t} p={Math.max(0, Math.min(1, (j.st === "done" ? 3 : j.prog * 3) - i))} /></button>)}<button className="im-all" onClick={() => setPick(null)}>All three</button></div>
          </motion.div>
          : <motion.div key="set" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><ImageSet j={j} big sel={pick} onSel={setPick} /></motion.div>}</AnimatePresence>
        {j.example && <p className="rc-p is-q">Example visuals, drawn for this prototype.</p>}
      </div> : null;
  return (
    <>
      <div className="cd-h">
        {backJob ? <Back onClick={onBackJob}><span className="cd-bk">{backJob.t}</span></Back> : from ? <Back onClick={onBack}>{AG[from].n}</Back>
          : <><span className="pk-orbs"><Orb id={j.ag} size={16} live={j.st === "run"} />{hp.map((h) => <Orb key={h} id={h} size={16} />)}</span>
            <span className="cd-who">{a.n}{hp.length ? <> with {names(hp)}</> : null}</span></>}
        {/* finished work needs no status line (the result says it); anything still moving says where it stands */}
        {j.st !== "done" || j.approved ? <span className={`cd-state is-${j.approved ? "done" : j.st}`}><i />{statusOf(j)}{(j.v || 1) > 1 && <em className="cd-v">v{j.v}</em>}</span>
          : (j.v || 1) > 1 && <span className="cd-state is-v"><em className="cd-v">v{j.v}</em></span>}
        <span className="cd-acts">
        {j.st === "done" && !j.approved && <span className="cd-hand"><Hand j={j} icon /></span>}
        {onFull && <button className="cd-ib" onClick={onFull} aria-label={full ? "Exit full screen" : "Full screen"} title={full ? "Exit full screen" : "Full screen"}>{full
          ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 1.5V5H1.5M7 10.5V7h3.5M5 5 1.5 1.5M7 7l3.5 3.5" /></svg>
          : <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><rect x="2.5" y="3" width="11" height="10" rx="2" /><rect x="4.5" y="5" width="7" height="6" rx="1" fill="currentColor" stroke="none" opacity=".85" /></svg>}</button>} {/* the chat's own full screen icon */}
        <button className={`cd-ib${menu ? " is-on" : ""}`} onClick={() => setMenu((v) => !v)} aria-label="More" aria-expanded={menu}><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><circle cx="2.5" cy="6" r="1" /><circle cx="6" cy="6" r="1" /><circle cx="9.5" cy="6" r="1" /></svg></button>
        <button className="cd-ib" onClick={onClose} aria-label="Close" title="Close"><svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M2 2l6 6M8 2 2 8" /></svg></button>
        </span>
        <AnimatePresence>{menu && <motion.div className="cd-menu" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.16 }}>{["Pause", "Hand to…", "Change the brief"].map((l) => <button key={l} onClick={() => setMenu(false)}>{l}</button>)}</motion.div>}</AnimatePresence>
      </div>
      <h3 className="cd-t">{j.t}</h3>
      <div className="cd-cols">
      <div className="cd-body">
        {read ? <div className="cd-made is-rp is-read"><button className="sd-back" onClick={() => setRead(false)}><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.2 2 3.2 5l3 3" /></svg>Summary</button><ReportDoc j={j} D={D} light={light} /></div>
          : <Receipt jobs={jobs} onGo={(t) => { const x = jobs.find((y) => y.t === t && !y.arch); if (x) (onGoJob ? onGoJob(x) : onOpen(x)); }} j={j} D={D} light={light} hp={hp} onStart={onStart} onRead={openRead} onApprove={onApprove} onPass={onPass} made={made} madeK={p?.id === "sync" ? "doc" : null} />}
        {/* what you asked about this work while it was open beside the chat, built on underneath it */}
        {!read && added && added.length > 0 && <div className="cd-adds">{added.map((x) => <section key={x.k} data-add={x.k} className="cd-add">
          <p className="cd-add-q">{x.q ? <>You asked <q>{x.q}</q></> : "Added from the chat"}</p>
          <DocCard c={x.card} k={x.k} live={x.live} delay={x.delay} />
        </section>)}</div>}
      </div>
      <div className="cd-talk">
        <div className="cd-talk-l">
          {talk.length > 0 && <div className="at">
            <span className="rc-k">{names([j.ag, ...hp])}, on this job</span>
            <AnimatePresence initial={false}>{talk.map(([who, text], i) => (
              <motion.div key={i} className="at-m" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                <Orb id={who} size={16} live={j.st === "run" && i === talk.length - 1} /><div><b>{AG[who].n}</b><p>{text}</p></div>
              </motion.div>))}</AnimatePresence>
            {j.st === "run" && talk.length < (JOB_TALK[j.t] || []).length && <div className="at-m is-wait"><Orb id={(JOB_TALK[j.t] || [])[talk.length][0]} size={16} live /><div><p>{AG[(JOB_TALK[j.t] || [])[talk.length][0]].n} is replying…</p></div></div>}
          </div>}
          {thread.length > 0 ? <Msgs skip={j.id} ag={j.ag} thread={thread} jobs={jobs} onOpen={onOpen} setPeek={setPeek} />
          : talk.length === 0 && <div className="cd-talk-0"><Orb id={j.ag} size={22} /><p>Ask {a.n} about this, or tell {a.n === "Riley" || a.n === "Fia" ? "her" : "him"} what to change.{pick != null ? ` You’re on visual ${pick + 1}.` : ""}</p></div>}</div>
        <Composer ag={j.ag} ph={pick != null ? `Change visual ${pick + 1}…` : talk.length ? `Join in with ${names([j.ag, ...hp])}…` : `Tell ${a.n} what to change…`} onSend={(q) => send(pick != null ? `On visual ${pick + 1}: ${q}` : q)} />
      </div>
      </div>
    </>
  );
}
// an agent, opened: what it's on, a way to talk to it; the rest folded
function AgentCard({ id, D, jobs, scope, thread, send, comms, onOpen, onClose, setPeek, light, wide, onWide }) {
  const a = AG[id], live = jobs.filter((j) => !j.arch && inS(j, scope)), mine = live.filter((j) => j.ag === id), g = (s) => mine.filter((j) => j.st === s);
  const need = g("need"), next = [...g("wait"), ...g("queue")], done = g("done").sort((x, y) => ageOf(x) - ageOf(y));
  // one list of what this agent is on: its own jobs and the ones it's helping with, the shared ones marked with who else is on them
  const working = live.filter((j) => j.st === "run" && (j.ag === id || (j.with || []).includes(id))).sort((x, y) => (y.ag === id) - (x.ag === id) || y.prog - x.prog);
  const learned = done.filter((j) => (j.think || []).length);
  const [more, setMore] = useState({}), [hv, setHv] = useState(null);
  const lastTalk = (j) => { const T = JOB_TALK[j.t] || []; const n = j.st === "done" ? T.length : Math.max(1, Math.ceil((j.prog || 0) * T.length)); return T[n - 1]; };
  const others = (j) => [j.ag, ...(j.with || [])].filter((w) => w !== id);
  // a row says the job and where it is; hover opens the one line that matters (what's happening, or what was found)
  const Row = (j, sub) => { const o = others(j), open = hv === j.id;
    return <div key={j.id} role="button" tabIndex={0} className={`ag-r is-${j.st}`} onClick={() => onOpen(j)} onPointerEnter={() => { setHv(j.id); setPeek(j.id); }} onPointerLeave={() => { setHv((h) => (h === j.id ? null : h)); setPeek(null); }}>
      <span className="ag-t">{j.t}{o.length > 0 && <span className="pk-orbs ag-o" title={`With ${names(o)}`}>{o.map((w) => <Orb key={w} id={w} size={12} />)}</span>}</span>
      <span className="ag-s">{j.st === "run" ? stepTxt(j) : j.st === "wait" ? "Waiting" : j.st === "done" ? agoT(ageOf(j)) : null}</span>
      <AnimatePresence initial={false}>{open && sub && <motion.span className="ag-n" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}><span>{sub}</span></motion.span>}</AnimatePresence>
    </div>; };
  const Sec = (k, l, list, sub, n = 4, cls) => list.length > 0 && <section className={`ag-sec${cls ? " " + cls : ""}`}><span className="rc-k">{l}<em>{list.length}</em></span>
    {(more[k] ? list : list.slice(0, n)).map((j) => Row(j, sub(j)))}
    {list.length > n && <button className="ag-more" onClick={() => setMore((M) => ({ ...M, [k]: !M[k] }))}>{more[k] ? "Show less" : `${list.length - n} more`}</button>}</section>;
  const nowOf = (j) => { const m = others(j).length && lastTalk(j); if (m) return `${AG[m[0]].n}: ${m[1]}`; const th = thoughtNow(j); return th ? <Typed key={th} text={th} ms={D.typeMs} /> : null; };
  const body = (
    <div className="cd-body ag-body">
      {!wide && thread.length > 0 && <section className="ag-sec"><span className="rc-k">You and {a.n}</span><Msgs ag={id} thread={thread} jobs={jobs} onOpen={onOpen} setPeek={setPeek} /></section>}
      {Sec("need", "Needs you", need, (j) => NEEDS.find((x) => x.id === j.need)?.rec, 4, "is-need")}
      {Sec("run", "Working on", working, nowOf, 5)}
      {Sec("learned", "Learned today", learned, (j) => j.think[j.think.length - 1], 3)}
      {Sec("next", "Up next", next, (j) => BRIEF[j.t], 3)}
    </div>);
  const talk = <Composer ag={id} ph={`Message ${a.n}…`} onSend={send} />;
  return (
    <>
      <div className="cd-h is-ag">
        <Orb id={id} size={30} live={working.length > 0} />
        <span className="cd-ag"><b>{a.n}</b><small>{a.role}<i className="sep">·</i>{working.length} working<i className="sep">·</i>{done.length} done today</small></span>
        {onWide && <button className="cd-ib" onClick={onWide} aria-label={wide ? "Make smaller" : "Make bigger"} title={wide ? "Make smaller" : "Make bigger"}>{wide
          ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 1.5V5H1.5M7 10.5V7h3.5M5 5 1.5 1.5M7 7l3.5 3.5" /></svg>
          : <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 1.5h3v3M4.5 10.5h-3v-3M10.5 1.5 7 5M1.5 10.5 5 7" /></svg>}</button>}
        <button className="cd-ib" onClick={onClose} aria-label="Close"><svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M2 2l6 6M8 2 2 8" /></svg></button>
      </div>
      {wide ? <div className="cd-cols ag-cols">{body}
          <div className="cd-talk"><div className="cd-talk-l">{thread.length > 0 ? <Msgs ag={id} thread={thread} jobs={jobs} onOpen={onOpen} setPeek={setPeek} /> : <div className="cd-talk-0"><Orb id={id} size={22} /><p>Ask {a.n} anything, or hand {a.n === "Riley" || a.n === "Fia" ? "her" : "him"} a job.</p></div>}</div>{talk}</div></div>
        : <>{body}{talk}</>}
    </>
  );
}
// hovering an orb: the agent, small, with what it's doing right now
function AgentPeek({ id, x, y, jobs, inScope, D }) {
  const run = jobs.filter((j) => j.ag === id && j.st === "run" && inScope(j)).sort((a, b) => b.prog - a.prog), done = jobs.filter((j) => j.ag === id && j.st === "done" && inScope(j)).length, now = run[0], th = now && (thoughtNow(now) || now.t);
  return (
    <motion.div className="apk" style={{ left: x, top: y }} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={{ type: "spring", visualDuration: 0.26, bounce: 0.1 }}>
      <span className="apk-h"><b>{AG[id].n}</b>{AG[id].role}</span>
      {now ? <><small className="apk-j">{now.t}</small><p><Typed key={th} text={th} ms={D.typeMs} /></p></> : <p>Nothing running.</p>}
      <span className="apk-s">{run.length} running<i className="sep">·</i>{done} done today<i className="sep">·</i>Click to open</span>
    </motion.div>
  );
}

// ---------------------------------------------------------------- a new job: say what, pick who and where. It starts at once, so its line draws in.
const AG_LANE = { orin: 1, riley: 1, calvin: 4, marco: 0, fia: 1 };
function NewJob({ onClose, onAdd }) {
  const [t, setT] = useState(""), [ag, setAg] = useState("orin"), [lane, setLane] = useState(AG_LANE.orin), ref = useRef(null);
  useEffect(() => { ref.current?.focus(); const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const go = () => { const v = t.trim(); if (v) onAdd(v.charAt(0).toUpperCase() + v.slice(1), ag, lane); };
  return (
    <motion.div className="nj" initial={{ opacity: 0, y: -6, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.99 }} transition={{ type: "spring", visualDuration: 0.3, bounce: 0.12 }}>
      <div className="nj-in"><Orb id={ag} size={16} /><input ref={ref} value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => e.key === "Enter" && go()} placeholder={`What should ${AG[ag].n} get done?`} /></div>
      <div className="nj-row"><span>Who</span>{IDS.map((id) => <button key={id} className={ag === id ? "is-on" : ""} onClick={() => { setAg(id); setLane(AG_LANE[id]); }}><Orb id={id} size={12} />{AG[id].n}</button>)}</div>
      <div className="nj-row"><span>Lane</span>{LANE_N.map((n, i) => <button key={n} className={lane === i ? "is-on" : ""} onClick={() => setLane(i)}>{n}</button>)}</div>
      <div className="nj-f"><button onClick={onClose}>Cancel</button><button className="btn-pri" disabled={!t.trim()} onClick={go}>Start</button></div>
    </motion.div>
  );
}

// ---------------------------------------------------------------- overview
function Overview({ D, ps, setPs, tally, onOpen, onRestart, calm, onCalm, embedded, onAskNorth, bar }) {
  // inside North the board wears North's light ground (one product); standalone it's dark. Presenting goes dark either way
  const [theme, setTheme] = useState(embedded ? "light" : "dark"), dark = theme === "dark" || (embedded && !!calm);
  useEffect(() => { document.body.classList.toggle("is-ws-light", !dark); return () => document.body.classList.remove("is-ws-light"); }, [dark]);
  const [scope, setScope] = useState("me"), [view, setView] = useState("board"), [hl, setHl] = useState(null);
  // switching seats starts the page over on that person's own work
  const seatWho = useWho(), seatFirst = useRef(true);
  useEffect(() => { if (seatFirst.current) { seatFirst.current = false; return; } setScope("me"); setHl(null); setOpen(null); }, [seatWho]);
  // what's open: one card over the board, grown from what you hovered. { k: "job" | "agent", id, from?, src }
  const [open, setOpen] = useState(null), [hoverAg, setHoverAgRaw] = useState(null), [peek, setPeek] = useState(null);
  const hov = useRef(null); const setHoverAg = (id) => { clearTimeout(hov.current); hov.current = setTimeout(() => setHoverAgRaw(id), id ? 60 : 120); };
  const [scale, setScale] = useState(false);
  const [jobs, setJobs, feed] = useFloor(D, ps, scale, calm); const JS0 = useRef(jobs); JS0.current = jobs;
  const [ghost, setGhost] = useState(null), [qb, setQb] = useState(null), [hm, setHm] = useState(false);
  useEffect(() => { if (!hm) return; const f = (e) => { if (!e.target.closest(".v7-more")) setHm(false); }; window.addEventListener("pointerdown", f); return () => window.removeEventListener("pointerdown", f); }, [hm]);
  const addJob = (t, ags, lane, row) => setJobs((JS) => [...JS, { id: "u" + Date.now().toString(36) + (NA.uid = (NA.uid || 0) + 1), lane, ag: ags[0], with: ags.slice(1), t, st: "run", prog: 0.02, mine: true, by: getWho(), watchBy: getWho(), think: gapThink(t) || [], ...(row ? { row } : {}) }]);
  // a card opens where you were looking: it grows out of the preview you hovered, on the spot, toward the open side
  const lastDown = useRef(null);
  useEffect(() => { const d = (e) => { lastDown.current = e.target; }; window.addEventListener("pointerdown", d, true); return () => window.removeEventListener("pointerdown", d, true); }, []);
  const anchorOf = (pref) => {
    const st = document.querySelector(".v8-stage"); if (!st) return null; const S = st.getBoundingClientRect();
    const src = document.querySelector(pref) || lastDown.current?.closest?.(".bd-orb3, .rl3-need, .rl3-ag, .lr, .bd-need") || null; if (!src) return null;
    const r = src.getBoundingClientRect(), up = src.matches(".pk") && r.bottom - S.top > S.height * 0.45;
    return { cx: r.left + r.width / 2 - S.left, top: Math.max(12, r.top - S.top), bottom: r.bottom - S.top, sw: S.width, sh: S.height, up, src: { x: r.left - S.left, y: r.top - S.top, w: r.width, h: r.height } };
  };
  const openJob = (j, from) => setOpen((o) => ({ k: "job", id: j.id, from: from || null, src: o && from ? o.src : `pk-job-${j.id}`, at: o && from ? o.at : anchorOf(".pk") }));
  // an agent opens in the side panel (the slot work uses), never as a modal over the board: the board stays live beside it
  const openAgent = (id) => { setHoverAgRaw(null); setOpen(null); setPanelRaw((p) => (p?.k === "agent" && p.id === id ? null : { k: "agent", id })); };
  // where a card opens: from the preview's box to the open box, growing toward the open side
  const geomOf = (at, k) => { const st = document.querySelector(".v8-stage"), SW = st?.clientWidth || 900, SH = st?.clientHeight || 700, wide = k === "job" && SW > 760, w = wide ? Math.min(900, SW - 32) : Math.min(520, SW - 32);
    if (wide) { const left = (SW - w) / 2, to = { left, top: 16, width: w, height: SH - 32, opacity: 1 }; const s = at?.src; return { w, maxH: SH - 32, to, from: s ? { left: s.x, top: s.y, width: s.w, height: s.h, opacity: 1 } : { ...to, opacity: 0 } }; }
    if (!at) { const left = (SW - w) / 2; return { w, maxH: SH - 36, to: { left, top: 18, width: w, height: "auto", opacity: 1 }, from: { left, top: 30, width: w, height: "auto", opacity: 0 } }; }
    const left = Math.max(16, Math.min(at.sw - w - 16, at.cx - w / 2)), s = at.src;
    if (at.up) return { w, maxH: at.bottom - 16, to: { left, width: w, bottom: at.sh - at.bottom, height: "auto", opacity: 1 }, from: { left: s.x, width: s.w, bottom: at.sh - s.y - s.h, height: s.h, opacity: 1 } };
    const top = Math.min(at.top, at.sh - 380); return { w, maxH: at.sh - top - 16, to: { left, width: w, top, height: "auto", opacity: 1 }, from: { left: s.x, width: s.w, top: s.y, height: s.h, opacity: 1 } }; };
  const close = () => setOpen(null);
  const back = () => setOpen((o) => (o?.from ? { k: "agent", id: o.from, src: o.src, at: o.at } : null));
  // talking to an agent (or steering one job): your line lands at once, the agent's answer follows
  const sm = useSample(), [threads, setThreads] = useState({}), live = useRef(jobs); live.current = jobs; NA.sm = sm.current;
  const say = async (key, q, job) => {
    const ag = job ? job.ag : key, prev = threads[key] || [];
    if (job && job.st === "done" && !isAsk(q) && !/^(thanks|thank you|great|perfect|looks good|lgtm)\b/i.test(q.trim())) {
      naRework(job.id, q.replace(/[.!]+$/, ""));
      setThreads((T) => ({ ...T, [key]: [...(T[key] || []), { who: "you", text: q }, { who: "ag", text: `Got it. I’ll rework it with that and bring v${(job.v || 1) + 1} back to you.` }] })); return; }
    // anyone else you name (@Riley, "and Calvin") joins this thread: the one you're talking to answers first, then each of them
    const also = IDS.filter((x) => x !== ag && new RegExp(`(^|[^\\w])@?${x}\\b`, "i").test(q));
    const strip = (s) => s.replace(/@(\w+)/g, "$1");
    setThreads((T) => ({ ...T, [key]: [...(T[key] || []), { who: "you", text: q }, { who: "ag", ag, pending: true }] }));
    const r = await askAgent(sm.current, ag, live.current, prev, strip(q), job);
    setThreads((T) => { const L = [...(T[key] || [])]; const i = L.findIndex((m) => m.pending); if (i >= 0) L[i] = { who: "ag", ag, text: r.text, jobs: r.jobs }; return { ...T, [key]: L }; });
    for (const o of also) {
      setThreads((T) => ({ ...T, [key]: [...(T[key] || []), { who: "ag", ag: o, pending: true }] }));
      const ro = await askAgent(sm.current, o, live.current, prev, strip(q), null);
      setThreads((T) => { const L = [...(T[key] || [])]; const i = L.findIndex((m) => m.pending); if (i >= 0) L[i] = { who: "ag", ag: o, text: ro.text, jobs: ro.jobs }; return { ...T, [key]: L }; });
    }
  };
  useEffect(() => { const k = (e) => { if (e.key !== "Escape" || /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) return; setOpen((o) => (o?.from ? { k: "agent", id: o.from, src: o.src, at: o.at } : null)); setPanelRaw((p) => (p?.from ? { k: "agent", id: p.from, r: p.r } : null)); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  // agents hand work to each other when one's work goes into another's (kept in each agent's card under Handoffs)
  const [comms, setComms] = useState(COMMS0), actRef = useRef(null);
  useEffect(() => { const p = ps.find((q) => q.id === "sync"); if (!p || p.done) return; const st = p.steps[p.cur], act = st.acts[Math.min(st.acts.length - 1, Math.floor(p.prog * st.acts.length))];
    if (act === actRef.current) return; actRef.current = act;
    const m = /Calvin/.test(act) ? { from: "calvin", to: "orin", text: "Orin is folding Calvin’s $1.98M at risk into the summary" } : /Riley/.test(act) ? { from: "riley", to: "orin", text: "Riley’s check goes in: all three levers land at $40.08M" } : null;
    if (m) setComms((C) => [...C, { ...m, id: "c" + Date.now(), at: 0 }]); }, [ps]);
  const [panel, setPanelRaw] = useState(null), [railAg, setRailAg] = useState(null), [full, setFull] = useState(false);
  useEffect(() => { if (!(open?.k === "job" || panel?.k === "job")) setFull(false); }, [open?.k, open?.id, panel?.k]);
  const setPanel = (p) => { setPanelRaw(p); if (p) setOpen(null); };
  useEffect(() => { if (open) setPanelRaw(null); }, [open]);
  const onStart = (j) => setJobs((JS) => JS.map((x) => (x.id === j.id ? { ...x, st: "run", prog: 0.04, wait: undefined, think: x.think || [] } : x)));
  const onApprove = (j) => { const n = NEEDS.find((x) => x.id === j.need); logCheck(j);
    if (j.need) dispatchEvent(new CustomEvent("north:decided", { detail: { need: j.need, opt: "a", from: "agents" } })); // the same decision, everywhere
    if (n?.start) { const nid = "u" + Date.now().toString(36) + (NA.uid = (NA.uid || 0) + 1); AGE[nid] = 0; setJobs((JS) => approveIn(JS, j, n, nid));
      setTimeout(() => setOpen((o) => (o?.k === "job" && o.id === j.id ? { ...o, id: nid } : o)), 0); setPanelRaw((pn) => (pn?.k === "job" && pn.id === j.id ? { ...pn, id: nid } : pn)); return; }
    if (n?.propose) { setJobs((JS) => approveIn(JS, j, n));
      const t = JS0.current.find((x) => x.t === n.propose); if (t) setTimeout(() => setOpen((o) => (o?.k === "job" && o.id === j.id ? { ...o, id: t.id } : o)), 0); setPanelRaw((pn) => (pn?.k === "job" && pn.id === j.id && t ? { ...pn, id: t.id } : pn)); return; }
    AGE[j.id] = 0; setJobs((JS) => JS.map((x) => (x.id === j.id ? { ...x, st: "done", prog: 1, at: "Just now", approved: true } : x))); };
  useEffect(() => { NA.open = (id) => { const j = live.current.find((x) => x.id === id); if (j) { setView((v) => v); openJob(j); } };
    if (NA.pendingOpen) { const id = NA.pendingOpen; NA.pendingOpen = null; setTimeout(() => NA.open?.(id), 500); } return () => { NA.open = null; }; }, []);
  const onPass = (j) => setJobs((JS) => JS.map((x) => (x.id === j.id ? { ...x, arch: true } : x)));
  const pjAg = panel?.k === "job" && jobs.find((x) => x.id === panel.id)?.ag;
  const focus = open?.k === "agent" ? open.id : panel?.k === "agent" ? panel.id : pjAg || hoverAg || railAg;
  const openKey = open ? `${open.k}-${open.id}` : null;
  const oj = open?.k === "job" && jobs.find((x) => x.id === open.id);
  const onOpenNeed = (id) => onOpen(NEEDS.find((x) => x.id === id));
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <section className={`stg2 v7 is-${view}${dark ? " is-dark" : " is-light"}`}>
        <header className="v7-h">
          <h1>Agents</h1>
          <div className="v7-seg">{[["me", "For me"], ["all", "Whole company"]].map(([k, l]) => <button key={k} className={scope === k ? "is-on" : ""} onClick={() => setScope(k)}>{scope === k && <motion.span layoutId="v7seg" className="v7-pill" transition={{ type: "spring", visualDuration: 0.38, bounce: 0.16 }} />}<span>{l}</span></button>)}<PersonSeg jobs={jobs} scope={scope} setScope={setScope} /></div>
          <span className="v7-sp" />
          {!embedded && <button className={`v7-scale${calm ? " is-on" : ""}`} onClick={onCalm} title="Starts from the beginning and holds still (P)">{calm ? "Presenting" : "Present"}</button>}
          <div className="v7-more"><button className={`cd-ib${hm ? " is-open" : ""}`} onClick={() => setHm((v) => !v)} aria-label="More"><svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><circle cx="2.5" cy="6" r="1" /><circle cx="6" cy="6" r="1" /><circle cx="9.5" cy="6" r="1" /></svg></button>
            <AnimatePresence>{hm && <motion.div className="dd-m v7-menu is-unit is-r" style={{ "--bw": "28px", "--bh": "28px" }} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16 } }} onClick={() => setHm(false)}>
              <button onClick={() => setScale((v) => !v)}><span>{scale ? "Back to today’s jobs" : "Preview at company scale"}</span>{scale && <em>{jobs.filter((j) => !j.arch).length}</em>}</button>
              <button onClick={() => setTheme(dark ? "light" : "dark")}><span>{dark ? "Light mode" : "Dark mode"}</span></button>
              <button onClick={onRestart}><span>Start over</span></button>
            </motion.div>}</AnimatePresence></div>
          <div className="v7-views">
            <button className={view === "board" ? "is-on" : ""} onClick={() => setView("board")} aria-label="Board"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1"><rect x="2" y="2" width="4" height="4" /><rect x="8" y="2" width="4" height="4" /><rect x="2" y="8" width="4" height="4" /><rect x="8" y="8" width="4" height="4" /></svg></button>
            <button className={view === "list" ? "is-on" : ""} onClick={() => setView("list")} aria-label="List"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1"><path d="M2 4h10M2 7h10M2 10h10" /></svg></button>
          </div>
        </header>
        <div className={`v8-body${panel ? " is-rail" : ""}${panel?.k === "job" ? " is-rail-wide" : ""}${full && open ? " is-full" : ""}`}>
          <Rail full={full} onFull={() => setFull((f) => !f)} jobs={jobs} scope={scope} hl={null} panel={panel} setPanel={setPanel} onRailAg={setRailAg} light={!dark} D={D} ps={ps} setPs={setPs} threads={threads} say={say} comms={comms} onApprove={onApprove} onPass={onPass} onStart={onStart} setPeek={setPeek} />
          <div className="v8-stage">
            {/* the board stays mounted under the list, so its work keeps flowing while you're away and is still flowing when you come back */}
            <motion.div className={`v8-main${view === "board" ? "" : " is-away"}`} initial={false} animate={{ opacity: view === "board" ? 1 : 0 }} transition={{ duration: 0.3 }} aria-hidden={view !== "board"}>
                  <Board calm={calm} ghost={ghost} light={!dark} D={D} jobs={jobs} ps={ps} threads={threads} say={say} onAdd={addJob} scope={scope} focus={focus} onAgent={openAgent} hoverAg={open ? null : hoverAg} setHoverAg={setHoverAg} peek={peek || (open?.k === "job" ? open.id : panel?.k === "job" ? panel.id : null)} openKey={openKey} hl={hl} setHl={setHl} onOpen={(j) => openJob(j)} />
            </motion.div>
            <AnimatePresence>{qb && !embedded && <BriefCard key={qb.k} b={qb} D={D} onOpen={(j) => { setQb(null); openJob(j); }} onClose={() => setQb(null)} />}</AnimatePresence>
            {bar === false ? null : bar ? <div className="ask-dock is-north">{bar}</div> : <div className="ask-dock"><AskBar toNorth={embedded ? onAskNorth : null} onAdd={addJob} setGhost={setGhost} talking={qb ? AG[[...qb.msgs].reverse().find((m) => m.who !== "you")?.who]?.n : null} onAsk={async (q) => {
              const prev = qb ? qb.msgs : [], lastA = [...prev].reverse().find((m) => m.who !== "you");
              const named = IDS.find((id) => new RegExp(`\\b${id}\\b`, "i").test(q));
              let b = isAsk(q) || !lastA ? briefOf(q, jobs, scope) : replyOf(q, lastA.who, lastA);
              if (lastA && !named && b.ag === "orin" && lastA.who !== "orin") b = { ...b, ag: lastA.who }; // follow-ups stay with whoever you're talking to
              const k = qb?.k || Date.now(), you = { who: "you", text: q }, hist = [...prev.filter((m) => !m.pending)];
              if (b.act) onApprove(b.act);
              const msg = { who: b.ag, text: b.text, jobs: (prev.length ? b.jobs.slice(0, 4) : b.jobs), subs: b.subs && !prev.length };
              if (!sm.current) { setQb({ k, msgs: [...hist, you, msg] }); return; }
              setQb({ k, msgs: [...hist, you, { ...msg, pending: true }] });
              const t = await voiceOf(sm.current, b, q, hist, live.current);
              setQb((x) => (x && x.k === k ? { ...x, msgs: x.msgs.map((m, i) => (i === x.msgs.length - 1 && m.pending ? { ...msg, text: t } : m)) } : x)); }} /></div>}
            <AnimatePresence initial={false}>{view === "list" && <motion.div key="l" className="v8-main is-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}><List light={!dark} D={D} jobs={jobs} scope={scope} onOpen={(j) => openJob(j)} openId={open?.k === "job" ? open.id : null} /></motion.div>}</AnimatePresence>
            <AnimatePresence>{open && (open.k === "agent" || oj) && <motion.div key="dim" className="cd-dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={close} />}</AnimatePresence>
            <AnimatePresence>{open && (open.k === "agent" || oj) &&
              (() => { let g = geomOf(open.at, open.k);
                if (full && open.k === "job") { const st = document.querySelector(".v8-stage")?.getBoundingClientRect(), bd = document.querySelector(".v8-body")?.getBoundingClientRect(); if (st && bd) { const w = bd.width - 16; g = { ...g, w, maxH: st.height - 16, to: { left: bd.left - st.left + 8, top: 8, width: w, height: st.height - 16, opacity: 1 } }; } }
                return (
              <Grow key={"card" + open.src} home={open.k === "job" ? `[data-job="${open.id}"]` : null} className={`cd is-${open.k}${open.k === "job" && g.w >= 700 ? " is-wide" : ""}${full ? " is-full" : ""}`} width={g.w} maxH={g.maxH} from={g.from} to={g.to}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div key={openKey} className="cd-pane" exit={{ opacity: 0, transition: { duration: 0.1 } }}>
                    {open.k === "job" ? <JobCard onGoJob={(x) => setOpen((o) => ({ ...o, id: x.id, back: [...(o.back || []), o.id] }))} backJob={open.back?.length ? jobs.find((x) => x.id === open.back[open.back.length - 1]) : null} onBackJob={() => setOpen((o) => ({ ...o, id: o.back[o.back.length - 1], back: o.back.slice(0, -1) }))} full={full} onFull={() => setFull((f) => !f)} light={!dark} j={oj} D={D} ps={ps} setPs={setPs} jobs={jobs} thread={threads[oj.id] || []} send={(q) => say(oj.id, q, oj)} from={open.from} onBack={back} onClose={close} onOpenNeed={onOpenNeed} onApprove={onApprove} onPass={onPass} onStart={onStart} onOpen={(j) => openJob(j, open.from)} setPeek={setPeek} />
                      : <AgentCard light={!dark} id={open.id} D={D} jobs={jobs} scope={scope} thread={threads[open.id] || []} send={(q) => say(open.id, q)} comms={comms} onOpen={(j) => openJob(j, open.id)} onClose={close} setPeek={setPeek} />}
                  </motion.div>
                </AnimatePresence>
              </Grow>); })()}</AnimatePresence>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

// ---------------------------------------------------------------- decisions
function Need({ c, onOpen }) {
  return (
    <div className="nd">
      <div className="nd-h"><Orb id={c.agent} size={20} /><b>{AG[c.agent].n}</b><span>{AG[c.agent].role}</span><time>{c.ago}</time></div>
      <h4>{c.title}</h4>
      <p>{c.rec}</p>
      {c.thread ? <div className="nd-tag"><Ava p={c.thread[0]} /><span className="at">{c.thread[0].at}</span><span>{c.thread[0].msg}</span><em>Caleb can see this</em></div>
        : <div className="nd-tag"><Ava p={{ ini: "JO", c: "#098486" }} /><b>{c.owner}</b><span>owns these accounts</span></div>}
      <div className="nd-a"><button className="btn-pri">{c.act}</button><button className="btn-sec">Give feedback</button><button className="nd-open" onClick={() => onOpen(c)}>See the work{ARW}</button></div>
    </div>
  );
}
// ---------------------------------------------------------------- job view (the details)
function JobView({ c, D, onBack }) {
  const [mode, setMode] = useState("once"), [fb, setFb] = useState("");
  const tr = (i) => ({ initial: { opacity: 0, y: 10, filter: "blur(4px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { duration: D.open.duration, ease: D.open.ease, delay: 0.05 + i * D.stagger } });
  const a = AG[c.agent], isOut = c.id === "riley-out";
  const people = c.people || (c.owner ? [{ who: "You", ini: "BE", c: "#7395b3", role: "Sent to you" }, { who: c.owner, ini: c.owner.slice(0, 2).toUpperCase(), c: "#098486", role: "Owns these accounts" }] : []);
  return (
    <motion.div className="jv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <motion.button className="jv-back" onClick={onBack} {...tr(0)}>{BACK}Agents</motion.button>
      <motion.div className="jv-h" {...tr(1)}>
        <div className="jv-eye"><Orb id={c.agent} size={20} /><b>{a.n}</b><span>{a.role} · {c.asked || c.ago}</span><em className="jv-st">{c.status || "Needs your approval"}</em></div>
        <h1>{c.title}</h1>
      </motion.div>
      <div className="jv-cols">
        <div className="jv-main">
          {c.answer && <motion.p className="jv-answer" {...tr(2)}>{c.answer}</motion.p>}
          {isOut && <motion.div className="jv-chart" {...tr(3)}>
            <div className="jv-ch"><span>{OUTBOUND_CARD.title}</span><b>{OUTBOUND_CARD.big}</b><em>23% of pace</em></div>
            <ChatVisual c={OUTBOUND_CARD} p={1} />
          </motion.div>}
          {c.stats && <motion.div className="jv-stats" {...tr(4)}>{c.stats.map(([l, v, s]) => <div key={l}><span>{l}</span><b>{v}</b><small>{s}</small></div>)}</motion.div>}
          <motion.div className="jv-rec" {...tr(5)}>
            <h5>What {a.n} recommends</h5>
            <p>{c.rec}</p>
            <div className="nd-a"><button className="btn-pri">{c.act}</button><button className="btn-sec">Edit</button><button className="btn-sec">Decline</button></div>
          </motion.div>
          <motion.div className="jv-fb" {...tr(6)}>
            <h5>Give {a.n} feedback</h5>
            <textarea value={fb} onChange={(e) => setFb(e.target.value)} placeholder="e.g. Count partner intros as new logos" rows={2} />
            <div className="jv-fb-a">
              <div className="seg">
                {[["once", "Just this task"], ["rule", `Make it a rule for ${a.n}`]].map(([k, l]) => (
                  <button key={k} className={mode === k ? "is-on" : ""} onClick={() => setMode(k)}>{mode === k && <motion.span layoutId="seg" className="seg-pill" transition={{ type: "spring", visualDuration: 0.38, bounce: 0.16 }} />}<span>{l}</span></button>
                ))}
              </div>
              <button className="btn-pri" disabled={!fb.trim()}>Send</button>
            </div>
            <AnimatePresence mode="popLayout" initial={false}><motion.p key={mode} className="jv-fb-note" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}>
              {mode === "rule" ? `${a.n} follows this on every job from now on. It joins ${a.n}'s rules, where you can edit or remove it.` : `${a.n} redoes this job with it. Nothing changes for future jobs.`}
            </motion.p></AnimatePresence>
          </motion.div>
        </div>
        <aside className="jv-side">
          {c.work && <motion.div className="jv-blk" {...tr(3)}>
            <h5>How {a.n} got here</h5>
            <ol className="wk">{c.work.map((w, i) => (
              <li key={i}>
                <span className="wk-keys">{Array.from({ length: w.n }, (_, j) => <i key={j} style={{ height: 4 + ((j * 7 + i * 5) % 12) }} />)}</span>
                <div><b>{w.s}</b><p>{w.f}</p><small>{w.src}</small></div>
              </li>
            ))}</ol>
          </motion.div>}
          <motion.div className="jv-blk" {...tr(4)}>
            <h5>{c.rulesUsed ? `Rules ${a.n} followed` : `${a.n}’s rules`}</h5>
            {c.rulesUsed && <ul className="rl">{c.rulesUsed.map((r) => <li key={r}>{r}</li>)}</ul>}
            <button className="nd-open">All {a.rules} of {a.n}'s rules{ARW}</button>
          </motion.div>
          <motion.div className="jv-blk" {...tr(5)}>
            <h5>People</h5>
            <ul className="pp">{people.map((p) => <li key={p.who}><Ava p={p} size={22} /><b>{p.who}</b><span>{p.role}</span></li>)}</ul>
            <div className="th">{(c.thread || []).map((m, i) => <div key={i} className="th-m"><Ava p={m} /><div><b>{m.who}</b> <span className="at">{m.at}</span> {m.msg}<small>{m.when}</small></div></div>)}</div>
            <div className="th-in">Reply, or @ someone…</div>
          </motion.div>
          <motion.div className="jv-trust" {...tr(6)}><span>{a.n}'s track record</span><b>{a.ok}</b></motion.div>
        </aside>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------- page
// one run of the prototype; starting over remounts it, so every job, project and conversation is back to the beginning
function Session({ D, onRestart, calm, onCalm, embedded, onAskNorth, bar }) {
  const [ps, setPs, tally] = useSim(D, calm);
  const [job, setJob] = useState(null);
  useEffect(() => { if (!document.querySelector(".agx")) window.scrollTo({ top: 0 }); document.body.classList.toggle("is-ws", !job); document.querySelector(".pg")?.classList.toggle("is-full", !job); }, [job]);
  return <AnimatePresence mode="wait">{job ? <JobView key="j" c={job} D={D} onBack={() => setJob(null)} /> : <Overview key="o" D={D} ps={ps} setPs={setPs} tally={tally} onOpen={setJob} onRestart={onRestart} calm={calm} onCalm={onCalm} embedded={embedded} onAskNorth={onAskNorth} bar={bar} />}</AnimatePresence>;
}
// the workspace. Standalone it brings its own bar and dials; inside North (embedded) North's own chat is the conversation
// a job, opened anywhere: the same job view the Agents page grows open, over wherever you are. It grows out of where you
// clicked it (the notice), and a batch steps through its jobs one at a time. Talking to the agent hands over to the pop-out chat,
// with this job carried in as the first thing in the thread (so a change request reworks it, and a question gets a chat answer)
// beside: opened from the chat, the job takes the page beside the docked chat (its wide layout, no scrim), so nothing stacks
export function JobModal({ ids, start = 0, from, onClose, onAsk, beside = false, pair = false, at = null }) {
  const [addN, setAddN] = useState(0);
  useEffect(() => {
    const scrollTo = (k, flash) => setTimeout(() => { const el = k === "__top" ? document.querySelector(".jm-card .cd-body > *") : document.querySelector(`.jm-card [data-add="${k}"]`); if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" }); if (flash) { el.classList.remove("is-found"); void el.offsetWidth; el.classList.add("is-found"); } }, 60);
    const onAdd = (e) => { setAddN((n) => n + 1); scrollTo(e.detail.k, false); setTimeout(() => Object.values(window.__northAdded || {}).flat().forEach((r) => { r.live = false; }), 4000); }; // drawn once; reopening shows it settled
    const onFocus = (e) => scrollTo(e.detail && e.detail.k != null ? e.detail.k : e.detail, true);
    addEventListener("north:job-add", onAdd); addEventListener("north:job-focus", onFocus);
    return () => { removeEventListener("north:job-add", onAdd); removeEventListener("north:job-focus", onFocus); };
  }, []);
  const [i, setI] = useState(start), [stack, setStack] = useState([]), [, tick] = useState(0);
  const pageBox = () => { const r = document.querySelector(".main")?.getBoundingClientRect(); return r ? { left: r.left, top: r.top, width: r.width, height: r.height } : { left: 24, top: 24, width: innerWidth - 48, height: innerHeight - 48 }; };
  const [pg, setPg] = useState(beside ? pageBox : null);
  useEffect(() => { if (!beside) return; let raf = 0, t0 = performance.now(); const f = () => { setPg((o) => { const n = pageBox(); return o && Math.abs(o.left - n.left) < 0.5 && Math.abs(o.width - n.width) < 0.5 && Math.abs(o.height - n.height) < 0.5 ? o : n; }); if (performance.now() - t0 < 1200) raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f);
    const r = () => setPg(pageBox()); addEventListener("resize", r); return () => { cancelAnimationFrame(raf); removeEventListener("resize", r); }; }, [beside]);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []); // it keeps moving while open
  useEffect(() => { const k = (e) => { if (e.key === "Escape") onClose(); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);
  const jobs = naJobs(), ps = NA.ps || PROJECTS.map((p) => ({ ...p, steps: p.steps.map((x) => ({ ...x })), prog: { sync: 0.55, forecast: 0.3, stall: 0.7 }[p.id], done: false, cm: {} }));
  const id = stack.length ? stack[stack.length - 1] : ids[i], j = jobs.find((x) => x.id === id) || (NA.raw || []).find((x) => x.id === id);
  if (!j) return null;
  // pair: the card sits on the left with its thread beside it (where the chat puts it), no scrim, so both stay usable
  const W = pair && at ? at.width : Math.min(600, innerWidth - 48), L = pair && at ? Math.round(at.left) : Math.round((innerWidth - W) / 2), T = 72, ox = from ? Math.round(from.left + from.width / 2 - L) : W / 2, oy = from ? Math.round(from.top - T) : 0;
  const back = stack.length ? (stack.length > 1 ? stack[stack.length - 2] : ids[i]) : null;
  return createPortal(
    <div className="agx jm-host">
      {!beside && !pair && <motion.div className="jm-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} onClick={onClose} />}
      <div className="stg2 v7 is-light jm-stage pg">{/* .pg: the card reads as it does on the Agents page, wherever it opens */}
        <motion.div className={`cd is-job jm-card${ids.length > 1 ? " has-step" : ""}${beside ? " is-wide jm-beside" : ""}${pair ? " jm-pair" : ""}`} style={{ transformOrigin: beside ? "50% 50%" : `${ox}px ${oy}px` }}
          initial={beside && pg ? { opacity: 0, scale: 0.86, left: pg.left, top: pg.top, width: pg.width, height: pg.height } : { opacity: 0, scale: 0.86, left: L, top: T, width: W }}
          animate={beside && pg ? { opacity: 1, scale: 1, left: pg.left, top: pg.top, width: pg.width, height: pg.height } : { opacity: 1, scale: 1, left: L, top: T, width: W }} exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}>
          {ids.length > 1 && !stack.length && <div className="jm-step">
            <button aria-label="Previous" disabled={i === 0} onClick={() => setI((x) => Math.max(0, x - 1))}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7.5 2.5 4 6l3.5 3.5" /></svg></button>
            <span>{i + 1} of {ids.length}</span>
            <button aria-label="Next" disabled={i === ids.length - 1} onClick={() => setI((x) => Math.min(ids.length - 1, x + 1))}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 2.5 8 6 4.5 9.5" /></svg></button></div>}
          <div className="cd-pane" key={id}>
            <JobCard onFull={() => { window.dispatchEvent(new CustomEvent("north:job-full", { detail: { id: j.id } })); }} added={(window.__northAdded || {})[j.id] || null} addN={addN} j={j} D={NA.D || D0} ps={ps} setPs={() => {}} jobs={jobs} thread={[]} light full={false}
              send={(q) => { onAsk && onAsk(q, deliveryOf(j), null, j.id); }} onClose={onClose} onBack={null} onOpenNeed={() => {}} setPeek={() => {}} onStart={() => {}} onOpen={(x) => setStack((st) => [...st, x.id])}
              onApprove={(x) => naApprove(x)} onPass={(x) => naUpdate((JS) => JS.map((y) => (y.id === x.id ? { ...y, arch: true } : y)))}
              onGoJob={(x) => setStack((st) => [...st, x.id])} backJob={back ? jobs.find((x) => x.id === back) : null} onBackJob={() => setStack((st) => st.slice(0, -1))} />
          </div>
        </motion.div>
      </div>
    </div>, document.body);
}
export function AgentsWorkspace({ embedded = false, onAsk = null, bar = null }) {
  const D = fromDials(useDialKit("Agents", DIALS)); NA.D = D;
  const [run, setRun] = useState(0), job = false;
  const restart = () => { for (const k in AGE) delete AGE[k]; NA.raw = null; NA.ps = null; setRun((r) => r + 1); };
  // presenting starts from the beginning, so the demo is the same every time, then holds still
  const [calm, setCalm] = useState(false);
  const onCalm = () => setCalm((c) => { if (!c) restart(); return !c; });
  useEffect(() => { const k = (e) => { const a = document.activeElement; if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName)) return; if ((e.key === "p" || e.key === "P") && !e.metaKey && !e.ctrlKey && !embedded) onCalm(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  // the dials stay hidden on load and in shared links; D shows them for this session
  const [dials, setDials] = useState(false);
  useEffect(() => { const k = (e) => { const a = document.activeElement; if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName)) return; if (!embedded && (e.key === "d" || e.key === "D")) setDials((v) => !v); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  return (
    <div className="pg is-full">
      {!embedded && <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="grain" x="-25%" y="-25%" width="150%" height="150%" filterUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="7" result="t" />
          <feColorMatrix in="t" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="g0" />
          <feComponentTransfer in="g0" result="g"><feFuncR type="linear" slope="0.5" intercept="0.05" /><feFuncG type="linear" slope="0.5" intercept="0.05" /><feFuncB type="linear" slope="0.5" intercept="0.05" /></feComponentTransfer>
          <feBlend in="g" in2="SourceGraphic" mode="soft-light" result="b" />
          <feComposite in="b" in2="SourceGraphic" operator="in" />
        </filter>
      </svg>}
      <CalmCtx.Provider value={calm}><Session key={run} D={D} onRestart={restart} calm={calm} onCalm={onCalm} embedded={embedded} onAskNorth={onAsk} bar={bar} /></CalmCtx.Provider>
      {!embedded && dials && <DialRoot position="bottom-right" theme="dark" productionEnabled defaultOpen={false} />}
    </div>
  );
}

