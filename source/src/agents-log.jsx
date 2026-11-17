// North · Agents — "the log" concept.
// Agents' work drawn in Fia's own chart language: every action an agent takes is a piano-key tick on a live time track.
// The newest key rises at "now". Steps are labelled stretches of the track; what it made for you is a coral pace dot.
// Decisions come first (Needs you); the details live in the job view.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "motion/react";
import { DialRoot, useDialKit } from "dialkit";
import { NorthLogo } from "./marks.jsx";
import { Orb } from "./agents.jsx";
import { ChatVisual } from "./chat.jsx";

// ---------------------------------------------------------------- dials
const SPEC = {
  look: ["Right now: look", { type: "select", options: [{ value: "dark", label: "Dark glass" }, { value: "clean", label: "Clean (paper)" }], default: "dark" }],
  order: ["Order", { type: "select", options: [{ value: "stage", label: "Live log first, then Needs you" }, { value: "needs", label: "Needs you first" }], default: "stage" }],
  rate: ["Live track: actions per minute, per agent", [26, 4, 90, 1]],
  window: ["Live track: minutes shown", [6, 1, 20, 0.5]],
  pitch: ["Tick width (px)", [3, 1.5, 6, 0.25]],
  rise: ["New key rises (spring stiffness)", [450, 50, 1200, 10]],
  damp: ["New key settles (damping, low = bouncy)", [22, 5, 60, 1]],
  stepLen: ["Simulation: seconds per step", [9, 2, 30, 0.5]],
  open: ["Job view opens", { type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }],
  stagger: ["Job view: stagger between parts (s)", [0.05, 0, 0.2, 0.005]],
};
const DIALS = Object.fromEntries(Object.values(SPEC).map(([l, v]) => [l, v]));
const fromDials = (v) => Object.fromEntries(Object.entries(SPEC).map(([k, [l]]) => [k, v[l]]));

// ---------------------------------------------------------------- data (numbers from the prototype's own data)
const AG = {
  fia: { n: "Fia", role: "Growth", rules: 3, ok: "9 of 11 approved as-is" },
  orin: { n: "Orin", role: "Finance", rules: 5, ok: "14 of 15 approved as-is" },
  felix: { n: "Felix", role: "Customers", rules: 2, ok: "6 of 8 approved as-is" },
};
// projects can span agents: the Monday sync is Fia's, and Orin and Felix each do a part of it
const PROJ = {
  sync: { t: "Monday sync: the path to $40M", who: ["fia", "orin", "felix"] },
  forecast: { t: "Year-end forecast", who: ["orin"] },
  stall: { t: "Where new accounts stall", who: ["felix"] },
};
// each agent's sequence of steps (past, current, planned). help = the agent whose project this step is for
const S = (l, p, a, help) => ({ l, p, a, help });
const JOBS = {
  fia: { title: "Monday sync: the path to $40M", seq: [
    S("Pull October bookings", "sync", ["Read HubSpot · Outbound lane", "Read HubSpot · Inbound lane", "Read HubSpot · New business"]),
    S("Size the three levers", "sync", ["Projected Outbound back to pace", "Projected expansion deals", "Projected new logos"]),
    S("Write the summary", "sync", ["Drafted the opening", "Added the three levers", "Added Felix's at-risk accounts"]),
    S("Fold in Orin's check", "sync", ["Read Orin's check", "Updated the summary"]),
  ], next: ["Outbound demo list review"] },
  orin: { title: "Year-end forecast with all three levers", seq: [
    S("Check Fia's numbers", "sync", ["Checked the levers against Plan", "Checked the $1.09M gap"], "fia"),
    S("Run the three levers", "forecast", ["Ran Outbound back to pace", "Ran expansion deals", "Ran new logos", "Combined the three"]),
    S("Stress-test the $1.98M at risk", "forecast", ["Read Account health · at-risk ARR", "Took a tenth of at-risk ARR off", "Compared it to the plan"]),
  ], next: ["GTM comp by lane"] },
  felix: { title: "Where new accounts stall before first integration", seq: [
    S("Send Fia the at-risk accounts", "sync", ["Read Account health · at-risk ARR", "Sent Fia the $1.98M at risk"], "fia"),
    S("Pull time to first contract", "stall", ["Read Product usage · onboarding", "Read Account health · new accounts"]),
    S("Find where accounts stall", "stall", ["Grouped accounts by onboarding step", "Compared stall rates by step", "Checked the first-integration step"]),
    S("Draft fixes with Dustin", "stall", ["Drafted fix 1", "Drafted fix 2", "Drafted fix 3"]),
  ], next: ["Felix handoffs per 1K by team"] },
};
const START = { fia: 2, orin: 1, felix: 1 };
// the job each agent finished just before (it shows at the left edge of its lane, already quiet)
const PREV = { fia: S("Inbound recap", "prev", ["Read HubSpot · Inbound lane", "Wrote the Inbound recap"]), orin: S("Q4 hiring plan check", "prev", ["Read Plan · GTM comp", "Checked the Q4 hiring plan"]), felix: S("SMB renewals check", "prev", ["Read Account health · SMB renewals", "Drafted the QBR invites"]) };
const IDS = ["fia", "orin", "felix"];
// the day so far (example figures; they tick up as the agents work)
const TODAY = { jobs: 6, records: 1284, drafts: 4 };

// Orin's Outbound review, the job opened in the details view. Copy, numbers and series are the prototype's.
const OUTBOUND_CARD = {
  kind: "trend", title: "Booked ARR · Outbound", big: "$130.2K",
  mark: { at: 13, label: "Oct 14 · 2 SDRs moved" },
  series: [22, 25, 21, 28, 24, 27, 30, 26, 29, 31, 28, 33, 30, 27, 14, 11, 12, 9, 13, 10, 8, 11, 9, 12, 10, 8, 9],
};
const OUTBOUND = {
  id: "orin-out", agent: "orin", asked: "Asked by you · Oct 30", ago: "12 min ago", status: "Needs your approval",
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
  people: [{ who: "You", ini: "SH", c: "#7395b3", role: "Asked for this" }, { who: "Caleb", ini: "CA", c: "#6d4fc2", role: "Tagged · can view" }],
  thread: [{ who: "You", ini: "SH", c: "#7395b3", at: "@Caleb", msg: "hey, check this out", when: "10 min ago" }],
  act: "Approve the move",
};
const NEEDS = [
  OUTBOUND,
  { id: "felix-smb", agent: "felix", ago: "40 min ago", title: "4 SMB renewals due by Dec 31 have gone quiet for 60 days.", rec: "11 of the 29 renewals in Jordan’s book have been touched. I drafted QBR invites for the four quiet accounts. They go out from Jordan once you approve.", owner: "Jordan", act: "Send the invites" },
];

// ---------------------------------------------------------------- small parts
const ARW = <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h8M7.8 3.8 11 7l-3.2 3.2" /></svg>;
const BACK = <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 7H3M6.2 3.8 3 7l3.2 3.2" /></svg>;
const Ava = ({ p, size = 20 }) => <span className="ava" style={{ width: size, height: size, background: p.c }}>{p.ini}</span>;
function useW(ref) {
  const [w, setW] = useState(800);
  useLayoutEffect(() => { const ro = new ResizeObserver(() => ref.current && setW(ref.current.getBoundingClientRect().width)); ro.observe(ref.current); return () => ro.disconnect(); }, []);
  return w;
}
const rnd = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
// one clock for the live tracks
let NOWT = performance.now() / 1000; const subs = new Set();
(function tick() { NOWT = performance.now() / 1000; subs.forEach((f) => f(NOWT)); requestAnimationFrame(tick); })();
function useNow() { const [t, setT] = useState(NOWT); useEffect(() => { subs.add(setT); return () => subs.delete(setT); }, []); return t; }

// ---------------------------------------------------------------- the live log
// one lane = one agent: what it did (keys, left of now), what it's doing (at now), what it plans to do (right of now).
// Click any key to comment on it; edit, add or remove planned steps in place; drag a next job onto another agent.
function Key({ x, w, h, base, fill, D, fresh }) {
  return <motion.rect x={x} width={w} y={base - h} height={h} fill={fill} initial={fresh ? { scaleY: 0 } : false} animate={{ scaleY: 1 }}
    transition={{ type: "spring", stiffness: D.rise, damping: D.damp }} style={{ transformBox: "fill-box", originY: 1, transition: "fill .25s" }} />;
}
const rnd2 = rnd(42);
function mkKey(t, step, r = rnd2) { return { t, h: 5 + Math.pow(r(), 1.6) * 28, a: step.a[Math.floor(r() * step.a.length)], p: step.p, l: step.l, n: 8 + Math.floor(r() * 60) }; }

function useSim(D) {
  const [sim, setSim] = useState(() => {
    const t0 = performance.now() / 1000, o = {}, span = D.window * 60;
    for (const id of IDS) {
      const job = JOBS[id], r = rnd(id.length * 977 + 3), st = START[id], seq = job.seq.map((x) => ({ ...x })), keys = [], marks = [];
      const lead = { fia: 0.95, orin: 0.62, felix: 0.86 }[id]; // where each agent's earlier steps began, so handoffs land at different moments
      for (let s = 0; s <= st; s++) marks.push({ t: t0 - span * lead * (1 - s / (st + 1.4)), i: s });
      const prev = PREV[id]; marks.unshift({ t: t0 - span * 1.02, i: -1, label: prev.l }); // the job before this one, already done
      for (let t = t0 - span; t < t0; t += (60 / D.rate) * (0.4 + r() * 1.2)) { const si = marks.filter((m) => m.t <= t).length - 2; keys.push(si >= 0 ? { ...mkKey(t, seq[si], r), si } : { ...mkKey(t, prev, r), si: -1 }); }
      { const k = keys.filter((x) => x.si === -1).pop(); if (k) k.made = prev.l; }
      for (let s = 0; s < st; s++) { const k = keys.filter((x) => x.si === s).pop(); if (k) k.made = seq[s].l; }
      o[id] = { seq, cur: st, done: false, keys, marks, pins: [], next: [...job.next] };
    }
    return o;
  });
  const [tally, setTally] = useState(TODAY);
  useEffect(() => {
    const timers = IDS.map((id, i) => setInterval(() => {
      setSim((S0) => { const s = S0[id]; if (s.done) return S0; const k = { ...mkKey(performance.now() / 1000, s.seq[s.cur]), si: s.cur };
        setTally((T) => ({ ...T, records: T.records + k.n }));
        return { ...S0, [id]: { ...s, keys: [...s.keys, k].slice(-500) } }; });
    }, (60000 / D.rate) * (0.85 + i * 0.12)));
    const stepT = setInterval(() => {
      setSim((S0) => {
        const live = IDS.filter((id) => !S0[id].done);
        if (!live.length) { const t = performance.now() / 1000; return Object.fromEntries(IDS.map((id) => { const s = S0[id], seq = [...s.seq, ...JOBS[id].seq.slice(1).map((x) => ({ ...x }))]; return [id, { ...s, seq, cur: s.cur, done: false, marks: [...s.marks, { t, i: s.cur }] }]; })); }
        const id = live[Math.floor(rnd2() * live.length)], s = S0[id], keys = [...s.keys];
        if (keys.length) keys[keys.length - 1] = { ...keys[keys.length - 1], made: s.seq[s.cur].l };
        setTally((T) => ({ ...T, drafts: T.drafts + 1, jobs: s.cur + 1 >= s.seq.length ? T.jobs + 1 : T.jobs }));
        if (s.cur + 1 >= s.seq.length) return { ...S0, [id]: { ...s, keys, done: true } };
        return { ...S0, [id]: { ...s, keys, cur: s.cur + 1, marks: [...s.marks, { t: performance.now() / 1000, i: s.cur + 1 }] } };
      });
    }, D.stepLen * 1000);
    return () => { timers.forEach(clearInterval); clearInterval(stepT); };
  }, [D.rate, D.stepLen]);
  return [sim, setSim, tally];
}

function Plan({ id, s, setSim, onDragNext }) {
  const [edit, setEdit] = useState(null), [val, setVal] = useState("");
  const upd = (fn) => setSim((S0) => ({ ...S0, [id]: fn(S0[id]) }));
  const save = () => {
    const v = val.trim();
    if (v) upd((x) => { const seq = [...x.seq]; if (edit === "new") seq.push({ l: v, p: seq[seq.length - 1].p, a: [`Working on: ${v}`], added: true }); else seq[edit] = { ...seq[edit], l: v, a: [`Working on: ${v}`], added: true }; return { ...x, seq }; });
    setEdit(null); setVal("");
  };
  const future = s.seq.map((st, i) => [st, i]).filter(([, i]) => i > s.cur);
  return (
    <div className="pl">
      <span className="pl-k">Then</span>
      <AnimatePresence initial={false}>
        {future.map(([st, i]) => edit === i
          ? <motion.input key={"e" + i} layout className="pl-in" autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={save} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEdit(null); }} />
          : <motion.div key={st.l + i} layout className={`pl-i${st.added ? " is-new" : ""}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
              <i /><button className="pl-t" onClick={() => { setEdit(i); setVal(st.l); }} title="Change this step">{st.l}</button>
              <button className="pl-x" onClick={() => upd((x) => ({ ...x, seq: x.seq.filter((_, j) => j !== i) }))} aria-label="Remove step">×</button>
            </motion.div>)}
      </AnimatePresence>
      {edit === "new" ? <input className="pl-in" autoFocus value={val} placeholder="What should it do next?" onChange={(e) => setVal(e.target.value)} onBlur={save} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEdit(null); }} />
        : <button className="pl-add" onClick={() => { setEdit("new"); setVal(""); }}>+ Add a step</button>}
      {s.next.map((n) => <div key={n} className="pl-next" draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", JSON.stringify({ from: id, n })); onDragNext(id); }} onDragEnd={() => onDragNext(null)}>
        <span>Next job</span><b>{n}</b><em>⋮⋮</em></div>)}
    </div>
  );
}

function Lane({ id, D, dark, sim, setSim, now, proj, setProj, focus, setFocus, setTip, laneRef, dragFrom, onDragNext }) {
  const box = useRef(null), W = useW(box), H = 92, base = 52;
  const s = sim[id], st = s.seq[s.cur], span = D.window * 60, pxs = W / span;
  const keys = s.keys.filter((k) => now - k.t < span + 2);
  const xOf = (t) => W - (now - t) * pxs;
  const [cmt, setCmt] = useState(null), [txt, setTxt] = useState("");
  const [over, setOver] = useState(false);
  const pick = (cx) => { let best = null, bd = 6; for (const k of keys) { const d = Math.abs(xOf(k.t) - D.pitch / 2 - cx); if (d < bd) { bd = d; best = k; } } return best; };
  const send = () => {
    const v = txt.trim(); if (!v || !cmt) return;
    const pin = { t: cmt.k.t, text: v, on: cmt.k.a, at: performance.now() / 1000 };
    setSim((S0) => ({ ...S0, [id]: { ...S0[id], pins: [...S0[id].pins, pin] } }));
    // the agent answers and puts the change into its plan, right after what it's doing now
    setTimeout(() => setSim((S0) => { const x = S0[id], seq = [...x.seq]; seq.splice(x.cur + 1, 0, { l: "Apply your note", p: cmt.k.p, a: [`Reworked "${cmt.k.a}" with your note`], added: true });
      return { ...S0, [id]: { ...x, seq, pins: x.pins.map((q) => (q === pin || (q.t === pin.t && q.text === pin.text) ? { ...q, reply: "Got it. I'll fold that in next." } : q)) } }; }), 1400);
    setCmt(null); setTxt("");
  };
  const dim = proj ? !keys.some((k) => k.p === proj) && st?.p !== proj : focus && focus !== id;
  return (
    <div ref={laneRef} className={`ln${dim ? " is-dim" : ""}${over ? " is-drop" : ""}${dragFrom && dragFrom !== id ? " can-drop" : ""}`}
      onPointerEnter={() => setFocus(id)} onPointerLeave={() => { setFocus(null); setTip(null); }}
      onDragOver={(e) => { if (dragFrom && dragFrom !== id) { e.preventDefault(); setOver(true); } }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { setOver(false); try { const { from, n } = JSON.parse(e.dataTransfer.getData("text/plain")); if (from === id) return; setSim((S0) => ({ ...S0, [from]: { ...S0[from], next: S0[from].next.filter((x) => x !== n) }, [id]: { ...S0[id], next: [...S0[id].next, n] } })); } catch (er) {} }}>
      <div className="ln-l">
        <div className="ln-who"><Orb id={id} size={28} live={!s.done} /><div className="ln-name"><b>{AG[id].n}</b><small>{AG[id].role}</small></div></div>
        <div className="ln-job">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div key={s.done ? "d" : s.cur} className="ln-cur" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              {s.done ? <><span className="ln-k">Done</span><b>Sent to Needs you</b></> : <>
                <span className="ln-k">{st.help ? `Helping ${AG[st.help].n}` : "Now"}</span><b>{st.l}</b>
                <button className="ln-proj" onPointerEnter={() => setProj(st.p)} onPointerLeave={() => setProj(null)}>{PROJ[st.p].t}</button></>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div className="ln-track" ref={box}
        onPointerMove={(e) => { const r = box.current.getBoundingClientRect(), k = pick(e.clientX - r.left); setTip(k && !cmt ? { x: e.clientX, y: r.top, k, id } : null); }}
        onClick={(e) => { const r = box.current.getBoundingClientRect(), k = pick(e.clientX - r.left); if (k) { setTip(null); setCmt({ k, x: xOf(k.t) - D.pitch / 2 }); setTxt(""); } }}>
        <svg width={W} height={H} aria-hidden="true">
          <g filter="url(#grain)">
            {keys.map((k) => {
              const old = k.si < s.cur || s.done, off = proj && k.p !== proj;
              return <Key key={k.t} x={xOf(k.t) - D.pitch} w={D.pitch} h={k.h} base={base} fill={dark ? (off ? "rgba(255,255,255,.07)" : old ? "rgba(214,228,240,.26)" : "#e9f0f6") : off ? "#e6eaee" : old ? "#c3ced8" : "#1f4b70"} D={D} fresh={now - k.t < 1} />;
            })}
          </g>
          {keys.filter((k) => k.made).map((k) => <circle key={"m" + k.t} cx={xOf(k.t) - D.pitch / 2} cy={base - k.h - 6} r="3.5" fill="#ff725c" stroke={dark ? "#0b1118" : "#fefbf9"} strokeWidth="1.5" opacity={proj && k.p !== proj ? 0.25 : 1} />)}
          <rect x="0" y={base} width={W} height="1" fill={dark ? "rgba(255,255,255,.1)" : "#e2e2e2"} />
          {s.marks.map((m, i) => {
            const x0 = xOf(m.t), x1 = i + 1 < s.marks.length ? xOf(s.marks[i + 1].t) : W; if (x1 < 0) return null;
            const live = i === s.marks.length - 1 && !s.done, xs = Math.max(0, x0), lab = m.i < 0 ? m.label : s.seq[m.i] ? s.seq[m.i].l : "";
            return <g key={m.t} opacity={proj && (m.i < 0 || (s.seq[m.i] && s.seq[m.i].p !== proj)) ? 0.3 : 1}>
              <rect x={xs} y={base + 6} width="1" height="9" fill={dark ? (live ? "#fff" : "rgba(255,255,255,.22)") : live ? "#093555" : "#d3d3d3"} />
              <text x={xs + 6} y={base + 14} fontSize="11" fontWeight={live ? 500 : 400} fill={dark ? (live ? "#fff" : "rgba(255,255,255,.45)") : live ? "#093555" : "#8a8a8a"}>{x1 - xs > lab.length * 5.6 + 14 ? lab : ""}</text>
            </g>;
          })}
          {dark ? <><defs><linearGradient id={`nw${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".95" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient></defs><rect x={W - 1.5} y="-6" width="2" height={base + 26} fill={`url(#nw${id})`} /></> : <rect x={W - 1} y="4" width="1" height={base + 12} fill="#093555" />}
        </svg>
        {s.pins.map((q) => (
          <div key={q.at} className="pin" style={{ left: xOf(q.t) - D.pitch / 2 }}>
            <span className="pin-ava">SH</span>
            <div className="pin-card"><b>You</b> on “{q.on}”<p>{q.text}</p>{q.reply ? <p className="pin-r"><Orb id={id} size={14} />{q.reply}</p> : <p className="pin-r is-wait">{AG[id].n} is reading…</p>}</div>
          </div>
        ))}
        <AnimatePresence>{cmt && (
          <motion.div className="cmt" style={{ left: Math.min(Math.max(cmt.x, 140), W - 140) }} initial={{ opacity: 0, y: 6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4 }} transition={{ type: "spring", visualDuration: 0.3, bounce: 0.1 }} onClick={(e) => e.stopPropagation()}>
            <span className="cmt-on">{cmt.k.a}</span>
            <input autoFocus value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={`Tell ${AG[id].n} what to change…`} onKeyDown={(e) => { if (e.key === "Enter") send(); if (e.key === "Escape") setCmt(null); }} />
            <div className="cmt-a"><button onClick={() => setCmt(null)}>Cancel</button><button className="btn-pri" disabled={!txt.trim()} onClick={send}>Send to {AG[id].n}</button></div>
          </motion.div>
        )}</AnimatePresence>
        <span className="ln-nowtag">now</span>
      </div>
      <Plan id={id} s={s} setSim={setSim} onDragNext={onDragNext} />
    </div>
  );
}

// count up to a number, smoothly
function Num({ v }) {
  const [d, setD] = useState(v), cur = useRef(v);
  useEffect(() => { const from = cur.current, t0 = performance.now(); let raf; const step = (t) => { const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); cur.current = from + (v - from) * e; setD(cur.current); if (k < 1) raf = requestAnimationFrame(step); }; raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf); }, [v]);
  return <>{Math.round(d).toLocaleString("en-US")}</>;
}

// handoffs: when a step done for another agent's project finishes, a hairline carries it to that agent's lane
function Handoffs({ sim, now, D, rects, proj, dark }) {
  if (!rects.length) return null;
  const out = [];
  IDS.forEach((id, li) => {
    const s = sim[id];
    s.marks.forEach((m, mi) => {
      const st = m.i >= 0 && s.seq[m.i]; if (!st || !st.help) return;
      const end = s.marks[mi + 1]; if (!end) return; // still working on it
      const to = IDS.indexOf(st.help), A = rects[li], B = rects[to]; if (!A || !B) return;
      const span = D.window * 60, w = A.w, x = A.x + w - (now - end.t) * (w / span); if (x < A.x - 4) return;
      out.push({ k: id + m.t, x, y1: A.y + 52, y2: B.y + 56, lab: `${AG[id].n} → ${AG[st.help].n} · ${st.l.replace(/^Send Fia /, "sent ").replace(/^Check Fia's/, "checked the")}`, on: !proj || proj === st.p, up: to < li });
    });
  });
  return (
    <svg className="hof" aria-hidden="true">
      {out.map((h) => {
        const mid = (h.y1 + h.y2) / 2, bend = 26 * (h.up ? 1 : -1);
        return <g key={h.k} opacity={h.on ? 1 : 0.15} style={{ transition: "opacity .3s" }}>
          <path d={`M${h.x} ${h.y1} C${h.x + bend} ${h.y1 - (h.y1 - mid) * 0.6}, ${h.x + bend} ${h.y2 + (mid - h.y2) * 0.6}, ${h.x} ${h.y2}`} fill="none" stroke={dark ? "rgba(255,255,255,.7)" : "#093555"} strokeWidth="1" strokeDasharray={dark ? "none" : "2 3"} style={dark ? { filter: "drop-shadow(0 0 4px rgba(255,255,255,.35))" } : undefined} />
          <circle cx={h.x} cy={h.y2} r="3" fill={dark ? "#fff" : "#093555"} />
          <foreignObject x={h.x + bend + 6} y={mid - 10} width="260" height="20"><span className="hof-l">{h.lab}</span></foreignObject>
        </g>;
      })}
    </svg>
  );
}

// ---------------------------------------------------------------- overview
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
function Overview({ D, sim, setSim, tally, onOpen }) {
  const [focus, setFocus] = useState(null), [proj, setProj] = useState(null), [tip, setTip] = useState(null), [dragFrom, setDragFrom] = useState(null);
  const now = useNow();
  const wrap = useRef(null), laneEls = useRef([]), [rects, setRects] = useState([]);
  useLayoutEffect(() => {
    const m = () => { const W0 = wrap.current.getBoundingClientRect(); setRects(laneEls.current.map((el) => { if (!el) return null; const t = el.querySelector(".ln-track").getBoundingClientRect(); return { x: t.left - W0.left, y: t.top - W0.top, w: t.width }; })); };
    m(); const ro = new ResizeObserver(m); ro.observe(wrap.current); return () => ro.disconnect();
  }, []);
  const working = IDS.filter((id) => !sim[id].done).length;
  const dark = D.look === "dark";
  const head = (
    <header className="pg-h">
      <h1>Agents</h1>
      <div className="sub">3 agents · {working} working · {NEEDS.length} need you</div>
      <p className="ch-north"><NorthLogo size={18} live light={dark} className="ch-north-mark" /><span>Two things need you. Orin finished the Outbound review and wants Caleb on it before Monday. Felix found four SMB renewals that have gone quiet. <button className="ch-north-go" onClick={() => onOpen(OUTBOUND)}>Start with Orin’s review{ARW}</button></span></p>
    </header>
  );
  const needs = (
    <section>
      <div className="sec"><h3>Needs you</h3><span className="n">{NEEDS.length}</span></div>
      <div className="nds">{NEEDS.map((c) => <Need key={c.id} c={c} onOpen={onOpen} />)}</div>
    </section>
  );
  const projSteps = (p) => { let n = 0, d = 0; for (const id of IDS) sim[id].seq.forEach((st, i) => { if (st.p === p) { n++; if (i < sim[id].cur || sim[id].done) d++; } }); return [d, n]; };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      {D.look === "clean" && head}
      {D.order === "needs" && needs}
      <section className={`rn${dark ? " is-dark" : ""}`}>
        {dark && head}
        <div className="rn-h">
          <h3>Right now</h3>
          <div className="tally"><span><b><Num v={tally.jobs} /></b>jobs done today</span><span><b><Num v={tally.records} /></b>records read</span><span><b><Num v={tally.drafts} /></b>things made for you</span></div>
        </div>
        <div className="prj">
          <span className="prj-k">Projects</span>
          {Object.entries(PROJ).map(([k, p]) => { const [d, n] = projSteps(k); return (
            <button key={k} className={`prj-c${proj === k ? " is-on" : ""}`} onPointerEnter={() => setProj(k)} onPointerLeave={() => setProj(null)}>
              <span className="prj-o">{p.who.map((w) => <Orb key={w} id={w} size={16} />)}</span><b>{p.t}</b>
              <span className="prj-bar">{Array.from({ length: n }, (_, i) => <i key={i} className={i < d ? "is-d" : ""} />)}</span><em>{d} of {n}</em>
            </button>); })}
        </div>
        <div className="rn-lanes" ref={wrap}>
          {IDS.map((id, i) => <Lane key={id} id={id} D={D} dark={dark} sim={sim} setSim={setSim} now={now} proj={proj} setProj={setProj} focus={focus} setFocus={setFocus} setTip={setTip} laneRef={(el) => (laneEls.current[i] = el)} dragFrom={dragFrom} onDragNext={setDragFrom} />)}
          <Handoffs sim={sim} now={now} D={D} rects={rects} proj={proj} dark={dark} />
        </div>
        <div className="rn-f">
          <span className="rn-key"><i className="k-tick" />One thing it did<i className="k-dot" />Made something for you<i className="k-hof" />Handed to another agent</span>
          <span className="rn-hint">Click any key to comment · click a step to change it · drag a next job to another agent</span>
        </div>
      </section>
      {D.order === "stage" && needs}
      <AnimatePresence>{tip && (
        <motion.div className={`lt${dark ? " is-dark" : ""}`} key="tip" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0, x: tip.x }} exit={{ opacity: 0 }} transition={{ type: "spring", visualDuration: 0.22, bounce: 0 }} style={{ top: tip.y - 70 }}>
          <span className="lt-e">{AG[tip.id].n} · {Math.max(0, Math.round(NOWT - tip.k.t))}s ago · {tip.k.n} records</span><span className="lt-t">{tip.k.a}</span>
          {tip.k.made && <span className="lt-m"><i />Made: {tip.k.made}</span>}<span className="lt-c">Click to comment</span>
        </motion.div>
      )}</AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------- job view (the details)
function JobView({ c, D, onBack }) {
  const [mode, setMode] = useState("once"), [fb, setFb] = useState("");
  const tr = (i) => ({ initial: { opacity: 0, y: 10, filter: "blur(4px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, transition: { duration: D.open.duration, ease: D.open.ease, delay: 0.05 + i * D.stagger } });
  const a = AG[c.agent];
  return (
    <motion.div className="jv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
      <motion.button className="jv-back" onClick={onBack} {...tr(0)}>{BACK}Agents</motion.button>
      <motion.div className="jv-h" {...tr(1)}>
        <div className="jv-eye"><Orb id={c.agent} size={20} /><b>{a.n}</b><span>{a.role} · {c.asked}</span><em className="jv-st">{c.status}</em></div>
        <h1>{c.title}</h1>
      </motion.div>
      <div className="jv-cols">
        <div className="jv-main">
          <motion.p className="jv-answer" {...tr(2)}>{c.answer}</motion.p>
          <motion.div className="jv-chart" {...tr(3)}>
            <div className="jv-ch"><span>{OUTBOUND_CARD.title}</span><b>{OUTBOUND_CARD.big}</b><em>23% of pace</em></div>
            <ChatVisual c={OUTBOUND_CARD} p={1} />
          </motion.div>
          <motion.div className="jv-stats" {...tr(4)}>{c.stats.map(([l, v, s]) => <div key={l}><span>{l}</span><b>{v}</b><small>{s}</small></div>)}</motion.div>
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
          <motion.div className="jv-blk" {...tr(3)}>
            <h5>How {a.n} got here</h5>
            <ol className="wk">{c.work.map((w, i) => (
              <li key={i}>
                <span className="wk-keys">{Array.from({ length: w.n }, (_, j) => <i key={j} style={{ height: 4 + ((j * 7 + i * 5) % 12) }} />)}</span>
                <div><b>{w.s}</b><p>{w.f}</p><small>{w.src}</small></div>
              </li>
            ))}</ol>
          </motion.div>
          <motion.div className="jv-blk" {...tr(4)}>
            <h5>Rules {a.n} followed</h5>
            <ul className="rl">{c.rulesUsed.map((r) => <li key={r}>{r}</li>)}</ul>
            <button className="nd-open">All {a.rules} of {a.n}'s rules{ARW}</button>
          </motion.div>
          <motion.div className="jv-blk" {...tr(5)}>
            <h5>People</h5>
            <ul className="pp">{c.people.map((p) => <li key={p.who}><Ava p={p} size={22} /><b>{p.who}</b><span>{p.role}</span></li>)}</ul>
            <div className="th">{c.thread.map((m, i) => <div key={i} className="th-m"><Ava p={m} /><div><b>{m.who}</b> <span className="at">{m.at}</span> {m.msg}<small>{m.when}</small></div></div>)}</div>
            <div className="th-in">Reply, or @ someone…</div>
          </motion.div>
          <motion.div className="jv-trust" {...tr(6)}><span>{a.n}'s track record</span><b>{a.ok}</b></motion.div>
        </aside>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------- page
function Page() {
  const D = fromDials(useDialKit("Agents", DIALS));
  const [sim, setSim, tally] = useSim(D);
  const [job, setJob] = useState(null);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [job]);
  return (
    <div className="pg">
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="grain" x="-25%" y="-25%" width="150%" height="150%" filterUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="7" result="t" />
          <feColorMatrix in="t" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="g0" />
          <feComponentTransfer in="g0" result="g"><feFuncR type="linear" slope="0.5" intercept="0.05" /><feFuncG type="linear" slope="0.5" intercept="0.05" /><feFuncB type="linear" slope="0.5" intercept="0.05" /></feComponentTransfer>
          <feBlend in="g" in2="SourceGraphic" mode="soft-light" result="b" />
          <feComposite in="b" in2="SourceGraphic" operator="in" />
        </filter>
      </svg>
      <AnimatePresence mode="wait">{job ? <JobView key="j" c={job} D={D} onBack={() => setJob(null)} /> : <Overview key="o" D={D} sim={sim} setSim={setSim} tally={tally} onOpen={setJob} />}</AnimatePresence>
      <DialRoot position="bottom-right" theme="dark" productionEnabled defaultOpen={false} />
    </div>
  );
}
createRoot(document.getElementById("root")).render(<Page />);
