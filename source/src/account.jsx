// The account room: what four people closing one deal look at together. It opens beside the conversation (the right of
// the pane), so the talk stays on the left and the deal stays in view: where it is, how likely it is, what's left and who
// has it, what's been done, and the files. Coastline Brokers is one of the prototype's SAMPLE deals (deals.js): its
// figures (ARR, agents, stage, close date, champion, last touch, the security threat) come from there. The stage dates,
// score history and timeline below are sample detail written to match it, and the panel says "Sample deal".
import React, { useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { motion } from "motion/react";
import { DEALS, STAGES, THREATS } from "./deals.js";
// today, the same day Home's New ARR chart calls Today (Oct 27)
export const TODAY = 27;
const dayOf = (t) => +String(t).replace(/\D+/g, "");
import { PHOTOS } from "./photos.js";
import { AGENTS, AgentMark, RowHover } from "./agents.jsx";
import { Stack } from "./stack.jsx";
import { TipBody } from "./visuals.jsx";

const PEOPLE_N = { sam: "Sam", heather: "Heather", jordan: "Jordan", dustin: "Dustin", lisa: "Lisa", paul: "Paul" };
export const nameOf = (k) => (AGENTS[k] ? AGENTS[k].n : PEOPLE_N[k] || k);
export function Face({ k, size = 24 }) {
  if (AGENTS[k]) return <AgentMark id={k} size={size} />;
  const ph = PHOTOS[k];
  return ph ? <img className="ar-face" src={ph} alt="" width={size} height={size} style={{ width: size, height: size }} />
    : <span className="ar-face is-init" style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>{(nameOf(k) || "?")[0]}</span>;
}

const D = DEALS.find((d) => d.id === "coast");
export const ROOMS = {
  coast: {
    deal: D,
    // when each stage was reached (sample), and the date it has to be signed by (the deal's close date)
    at: ["Oct 7", "Oct 14", "Oct 21", D.close],
    // a 0–100 read of how likely it closes by its date (sample), at each stage and today
    score: { now: 72, path: [["Oct 7", 48], ["Oct 14", 63], ["Oct 21", 81], ["Oct 26", 72], ["Oct 27", 72]],
      // where it could be on each day to the sign-by date (sample; Oct 28, 29, 30): if its live step happens today, at the
      // usual pace, and if its threat isn't cleared. What each line means comes from the deal (see leverOf), not from here.
      ahead: [{ k: "up", v: [82, 87, 90] }, { k: "mid", v: [74, 76, 77] }, { k: "down", v: [66, 58, 52] }],
      why: [["up", "Contract out for a week, terms approved"], ["up", `${D.champ[0]} (${D.champ[1]}) replied ${D.touch}`], ["down", `${THREATS.security.t} open. ${THREATS.security.say}`]] },
    // what's left between here and signed, in order, and who has each step
    path: [
      { who: "dustin", t: "Signs off on the security packet", st: "now", note: "Before lunch" },
      { who: "sam", t: `Sends it to ${D.champ[0].split(" ")[0]} with a note`, st: "next" },
      { who: null, t: "Coastline’s legal team approves", st: "later" },
      { who: "heather", t: "Countersigns", st: "later", note: `By ${D.close}` },
    ],
    team: [
      { k: "sam", role: "Owns the deal", did: "Ran the demo, sent pricing" },
      { k: "heather", role: "Exec sponsor", did: "Approved the terms" },
      { k: "dustin", role: "Security", did: "Reviewing the packet" },
      { k: "jordan", role: "Onboarding", did: "Wrote the week-one plan" },
      { k: "fia", role: "Agent", did: "Drafted the packet" },
    ],
    done: [
      ["Sep 30", `${D.champ[0]} asked for a demo`, D.src],
      ["Oct 7", "Demo with Priya and two team leads", "sam"],
      ["Oct 14", `Pricing sent: $${D.arr}K a year for ${D.agents} agents`, "sam"],
      ["Oct 21", "Contract out, terms approved", "heather"],
      ["Oct 26", "Their legal team asked for our security docs", null],
      ["Today", "Packet drafted, in review; onboarding plan shared", "fia"],
    ],
    files: ["secpack", "coastplan"],
  },
};
DEALS.forEach((d) => { if (ROOMS[d.id]) return; const th = d.threats.map((x) => ({ ...THREATS[x.k], k: x.k }));
  ROOMS[d.id] = { deal: d, at: null, score: null, team: [{ k: "sam", role: "Owns the deal", did: `Last touch ${d.touch}` }], done: [], files: [],
    // what's left, from the deal's own stage and what's in its way; whoever can clear a blocker has it, Sam has the rest
    // a blocker reads as the thing to do about it, owned by whoever can clear it
    path: [...th.map((t) => ({ who: t.by[0], t: { quiet: `Get a reply from ${d.champ[0].split(" ")[0]}`, signoff: "Get their CEO’s sign-off", security: "Clear the security review", sponsor: "Find their new owner", procure: "Send the vendor packet" }[t.k] || t.t, st: "now" })),
      ...STAGES.slice(d.stage + 1).map((s, i) => ({ who: "sam", t: s === "Signed" ? "Get it signed" : `Move it to ${s}`, st: !th.length && i === 0 ? "now" : i === 0 ? "next" : "later", note: s === "Signed" ? `By ${d.close}` : "" }))] }; });
export const ROOM_OF_THREAD = { "t-coast": "coast" };

// where it is: four stages on one line. Reached stages are filled, the current one is the coral dot, the last is the date
export function StageTrack({ room, small }) {
  const cur = room.deal.stage;
  return (
    <ol className={`ar-stages${small ? " is-small" : ""}`} style={{ "--n": STAGES.length }}>
      {STAGES.map((s, i) => <li key={s} className={i < cur ? "is-done" : i === cur ? "is-now" : ""}>
        <i /><b>{s}</b>{!small && <small>{i === STAGES.length - 1 ? `by ${room.at[i]}` : room.at[i]}</small>}
      </li>)}
    </ol>
  );
}

// the room is built from Home's own parts: three graph tiles (the well frame, the paper card, the footer on the well), then
// cards with a header and hairline rows, and the one move that's yours in the sunk tray. One label size, one number size.
function Tile({ label, value, sub, foot, footR, children }) {
  return (
    <div className="ar-t">
      <div className="ar-t-b"><span className="ar-t-l">{label}</span><b className="ar-t-v">{value}{sub && <small>{sub}</small>}</b><div className="ar-t-viz">{children}</div></div>
      <div className="ar-t-f"><span>{foot}</span>{footR && <b>{footR}</b>}</div>
    </div>
  );
}
// the score's path: one point per stage reached and today, drawn the way Home draws a series (line, round points, today coral)
function Spark({ path }) {
  const W = 120, H = 24, P = 3, xs = (i) => P + (i * (W - P * 2)) / (path.length - 1), ys = (v) => H - P - ((v - 40) / 50) * (H - P * 2);
  const d = path.map(([, v], i) => `${i ? "L" : "M"}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join("");
  return (
    <div className="ar-spark">
      <motion.svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" aria-hidden="true" initial={{ clipPath: "inset(0 100% 0 0)" }} animate={{ clipPath: "inset(0 0% 0 0)" }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.25 }}>
        <path d={d} fill="none" stroke="var(--navy)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </motion.svg>
      {path.map(([, v], i) => <i key={i} className={i === path.length - 1 ? "is-now" : ""} style={{ left: `${(xs(i) / W) * 100}%`, top: ys(v) }} />)}
    </div>
  );
}
function Card({ title, aside, children, tray }) {
  return (
    <section className="ar-c">
      <div className="ar-c-b"><header className="ar-c-h"><h5>{title}</h5>{aside && <span>{aside}</span>}</header>{children}</div>
      {tray}
    </section>
  );
}

// the story, top down: will it sign by its date (the answer, the stage, the odds), then what's left and the one move that's
// yours. Who's on it, the files and the history are there when you want them: folded, each with a summary you can read shut.
const SX = { duration: 0.5, ease: [0.32, 0.72, 0, 1] };
function Fold({ title, sum, children }) {
  const [open, setOpen] = useState(false), [hv, setHv] = useState(false), at = useRef({ x: 0, w: 0 });
  return (
    <section className={`ar-fold${open ? " is-open" : ""}`}>
      <button type="button" className="ar-fold-h" aria-expanded={open} onClick={() => setOpen(!open)}
        onPointerEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(true); }} onPointerLeave={() => setHv(false)}>
        <AnimatePresence>{hv && <RowHover key="h" o={at.current} t={{ type: "easing", ...SX }} />}</AnimatePresence>
        <b>{title}</b><span className="ar-fold-s">{sum}</span>
        <motion.svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--mute)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" animate={{ rotate: open ? 180 : 0 }} transition={SX}><path d="M3 4.5 6 7.5l3-3" /></motion.svg>
      </button>
      <AnimatePresence initial={false}>{open && <motion.div key="b" className="ar-fold-b" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ ...SX, opacity: { duration: 0.25 } }}><div>{children}</div></motion.div>}</AnimatePresence>
    </section>
  );
}

// the deal's life on one chart, drawn the way Home draws New ARR: its odds by day as a line with the fine stripes under it,
// the stages laid along the axis where each began, then today and the three ways the next days can go, out to the sign-by
// date. The days ahead get a wider share of the width than the days behind (three days would be a sliver otherwise); the
// shaded side and the Today rule mark the change of scale.
const FC = { up: "#093555", mid: "#098486", down: "#a8a29c" };
// what each line means, for any deal: the top line is its live step done today (yours if one is live), the middle is the
// usual pace, the bottom is its biggest threat left alone (or, with none, nothing moving)
export function leverOf(room, k) {
  if (k === "mid") return "At the usual pace";
  if (k === "down") { const th = room.deal.threats[0] && THREATS[room.deal.threats[0].k]; return th ? th.slip : "If nothing moves"; }
  const live = room.path.filter((p) => p.st === "now" || p.st === "next"), st = live.find((p) => p.who === "sam") || live[0] || room.path[0];
  const t = lower1(st.t.split(" with ")[0]).replace(/^sends/, "send").replace(/^signs/, "sign");
  return st.who === "sam" ? `If you ${t} today` : `If ${st.who ? nameOf(st.who) : room.deal.n.split(" ")[0]} ${lower1(st.t.split(" with ")[0])} today`;
}
function DealChart({ room, pick, setPick, lock }) {
  const box = useRef(null), [w, setW] = useState(560);
  React.useLayoutEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(() => setW(Math.round(el.clientWidth))); ro.observe(el); setW(Math.round(el.clientWidth)); return () => ro.disconnect(); }, []);
  const s = room.score, ahead = s.ahead || [], d0 = dayOf(room.at[0]), dT = dayOf(s.path[s.path.length - 1][0]), dE = ahead.length ? dayOf(room.deal.close) : dT;
  const H = 150, top = 14, base = 112, x0 = 30, xE = w - (ahead.length ? 30 : 6), xT = ahead.length ? x0 + (xE - x0) * 0.7 : xE; // 30: room for each line's end number
  const X = (d) => (d <= dT ? x0 + ((d - d0) / (dT - d0)) * (xT - x0) : xT + ((d - dT) / (dE - dT)) * (xE - xT)), Y = (v) => base - ((v - 40) / 60) * (base - top);
  const pts = s.path.map(([t, v]) => [X(dayOf(t)), Y(v)]), lastP = pts[pts.length - 1];
  const at = (x) => { for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; return ay + ((x - ax) / (bx - ax || 1)) * (by - ay); } return lastP[1]; };
  const stripes = []; for (let x = pts[0][0] + 2; x <= lastP[0]; x += 4) stripes.push(x);
  const T = (p) => <text fontSize="12" fontWeight="500" fill="var(--mute)" style={{ fontVariantNumeric: "tabular-nums" }} {...p} />;
  const C = { line: "#098486", coral: "#e8664a", navy: "#093555" };
  // each way ahead as points from today's read
  const days = ahead.length ? ahead[0].v.map((_, i) => dT + i + 1) : [];
  const fpts = (f) => [lastP, ...f.v.map((v, i) => [X(days[i]), Y(v)])];
  const up = ahead.find((f) => f.k === "up"), down = ahead.find((f) => f.k === "down");
  const band = up && down ? [...fpts(up), ...fpts(down).reverse()].map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("") + "Z" : "";
  // hover: the guide snaps to a scored day behind today, or a day ahead (where the tip lists all three ways)
  const marks = [...s.path.map(([t, v], i) => ({ t, x: X(dayOf(t)), y: Y(v), v, prev: i ? s.path[i - 1][1] : null })),
    ...days.map((d, i) => ({ t: `Oct ${d}`, x: X(d), ahead: i }))];
  const [hv, setHv] = useState(null);
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; if (x < x0 - 10) { setPick(null); return setHv(null); }
    let k = 0; marks.forEach((m, i) => { if (Math.abs(m.x - x) < Math.abs(marks[k].x - x)) k = i; }); setHv(k);
    // in the days ahead, the line nearest the pointer is the one you mean
    const mk = marks[k]; if (mk.ahead != null) { let f = ahead[0]; ahead.forEach((g) => { if (Math.abs(Y(g.v[mk.ahead]) - y) < Math.abs(Y(f.v[mk.ahead]) - y)) f = g; }); setPick(f.k); } else setPick(null); };
  const stageOn = (t) => { let i = 0; room.at.slice(0, -1).forEach((a, j) => { if (dayOf(a) <= dayOf(t)) i = j; }); return STAGES[i]; };
  const fOn = ahead.find((g) => g.k === pick) || up;
  const hvAt = hv;
  const m = hvAt == null ? null : marks[hvAt], isToday = m && m.ahead == null && dayOf(m.t) === TODAY, isEnd = m && m.ahead === days.length - 1;
  const tip = !m ? null : m.ahead != null
    ? { eyebrow: isEnd ? `${m.t} · sign-by date` : m.t, title: `${fOn.v[m.ahead]} of 100`,
        rows: ahead.map((f) => ({ c: FC[f.k], k: leverOf(room, f.k), v: String(f.v[m.ahead]), vc: f.k === fOn.k ? undefined : "var(--mute)" })) }
    : { eyebrow: isToday ? `Today · ${m.t}` : m.t, title: `${m.v} of 100`, rows: [{ c: C.line, k: "Likely to close", v: String(m.v) }, { k: "Stage", v: stageOn(m.t) },
        ...(m.prev == null ? [{ k: "First read on the deal" }] : m.v === m.prev ? [{ k: "No change since the last read" }] : [{ k: m.v > m.prev ? "Up since the last read" : "Down since the last read", v: `${m.v > m.prev ? "+" : "−"}${Math.abs(m.v - m.prev)}`, vc: m.v > m.prev ? C.line : C.coral }])] };
  const askDay = () => { if (!m) return; dispatchEvent(new CustomEvent("north:talk", { detail: { text: m.ahead != null ? (fOn.k === "down" ? `@Riley how do we keep ${room.deal.n} from slipping past ${room.deal.close}?` : `@Riley what gets ${room.deal.n} to ${fOn.v[fOn.v.length - 1]} by ${room.deal.close}?`) : `@Riley why was ${room.deal.n} at ${m.v} on ${m.t}?` } })); };
  const on = pick || lock, dim = (k) => (on && on !== k ? 0.22 : 1);
  return (
    <div ref={box} className="ar-chart" role="img" aria-label={`Likely to close ${s.now} of 100 today; by ${room.deal.close}: ${ahead.map((f) => `${leverOf(room, f.k).toLowerCase()}, ${f.v[f.v.length - 1]}`).join("; ")}`} onPointerMove={move} onPointerLeave={() => { setHv(null); setPick(null); }} onClick={askDay}>
      <svg width={w} height={H} viewBox={`0 0 ${w} ${H}`}>
        {[60, 80, 100].map((v) => <g key={v}><line x1={x0} x2={xE} y1={Y(v) + 0.25} y2={Y(v) + 0.25} stroke="var(--line)" strokeWidth="0.5" /><T x={x0 - 8} y={Y(v) + 4} textAnchor="end">{v}</T></g>)}
        <T x={x0 - 8} y={base + 4} textAnchor="end">40</T>
        <line x1={x0} x2={xE} y1={base + 0.5} y2={base + 0.5} stroke="#c9c4bf" strokeWidth="1" />
        <motion.g initial={{ clipPath: `inset(0 ${w}px 0 0)` }} animate={{ clipPath: "inset(0 0px 0 0)" }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}>
          {stripes.map((x) => <line key={x} x1={x} x2={x} y1={at(x)} y2={base} stroke={C.line} strokeOpacity="0.4" strokeWidth="0.5" />)}
          <path d={pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("")} fill="none" stroke={C.line} strokeWidth="2" strokeLinejoin="round" />
        </motion.g>
        {/* the three ways ahead fan out of today's point, after the history has drawn: the range shaded, each line dashed */}
        {ahead.length > 0 && <motion.g initial={{ clipPath: `inset(0 ${w - xT}px 0 0)` }} animate={{ clipPath: "inset(0 0px 0 0)" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 1.05 }}>
          <path d={band} fill={C.line} fillOpacity={on ? 0.03 : 0.07} style={{ transition: "fill-opacity .3s" }} />
          {ahead.map((f) => <g key={f.k} style={{ opacity: dim(f.k), transition: "opacity .3s" }}>
            <path d={fpts(f).map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("")} fill="none" stroke={FC[f.k]} strokeWidth={on === f.k ? 2 : 1.6} strokeDasharray="0 3" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={X(dE)} cy={Y(f.v[f.v.length - 1])} r="3" fill={FC[f.k]} />
            {/* each line ends in its number; what it means is in the tip */}
            <T x={X(dE) + 8} y={Y(f.v[f.v.length - 1]) + 4} fill={FC[f.k]} fontWeight="600">{f.v[f.v.length - 1]}</T>
          </g>)}
        </motion.g>}
        <circle cx={lastP[0]} cy={lastP[1]} r="4.5" fill={C.line} />
        {/* the stages, each where it began, and the axis dates */}
        {room.at.slice(0, -1).map((t, i) => <g key={t}><line x1={X(dayOf(t))} x2={X(dayOf(t))} y1={base} y2={base + 5} stroke="#c9c4bf" />
          <T x={X(dayOf(t))} y={base + 20} textAnchor={i === 0 ? "start" : "middle"} fill={i === room.deal.stage ? C.navy : "var(--mute)"} fontWeight={i === room.deal.stage ? 600 : 500}>{STAGES[i]}</T>
          <T x={X(dayOf(t))} y={base + 35} textAnchor={i === 0 ? "start" : "middle"}>{t}</T></g>)}
        <line x1={lastP[0]} x2={lastP[0]} y1={base} y2={base + 5} stroke="#c9c4bf" />
        <T x={lastP[0]} y={base + 35} textAnchor="middle" fill={C.navy} fontWeight="600">Today</T>
        {ahead.length > 0 && <><line x1={xE} x2={xE} y1={base} y2={base + 5} stroke="#c9c4bf" />
          <T x={xE} y={base + 20} textAnchor="end">Signs by</T><T x={xE} y={base + 35} textAnchor="end">{room.deal.close}</T></>}
        {m && <g pointerEvents="none">
          <line x1={m.x} x2={m.x} y1={top - 8} y2={base} stroke={C.navy} strokeWidth="0.75" strokeDasharray="2 2" />
          {m.ahead != null ? ahead.map((f) => <circle key={f.k} cx={m.x} cy={Y(f.v[m.ahead])} r={f.k === fOn.k ? 5 : 3.5} fill={FC[f.k]} opacity={f.k === fOn.k ? 1 : 0.5} />)
            : <circle cx={m.x} cy={m.y} r={isToday ? 6 : 4.5} fill={C.line} />}
        </g>}
      </svg>
      <AnimatePresence>{tip && <motion.div key="t" className="tip tip-level ar-ltip" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1, left: m.ahead != null ? xT - 14 : Math.min(Math.max(m.x, 110), w - 110), top: m.ahead != null ? Y(70) : m.y }} exit={{ opacity: 0, transition: { duration: 0.12 } }}
        transition={{ duration: 0.18, left: { type: "spring", visualDuration: 0.2, bounce: 0 }, top: { type: "spring", visualDuration: 0.2, bounce: 0 } }}
        style={m.ahead != null ? { x: "-100%", translate: "0 -50%", transformOrigin: "100% 50%" } : { x: "-50%", translate: "0 calc(-100% - 12px)", transformOrigin: "50% 100%" }}>
        <TipBody id={hv} eyebrow={tip.eyebrow} title={tip.title} rows={tip.rows} /></motion.div>}</AnimatePresence>
    </div>
  );
}


// where the deal is, as one track: four equal segments, one per stage. Reached stages are solid navy, the stage it's in now
// carries the fine stripes Home's charts use under a line (in progress), the ones ahead are the well. Under each, its name
// and its date: when it was reached, "Now", or the date it has to be signed by.
function Track({ room, when }) {
  const d = room.deal, cur = d.stage, last = STAGES.length - 1;
  return (
    <ol className="ar-track" style={{ "--n": STAGES.length }} aria-label={`Stage ${cur + 1} of ${STAGES.length}: ${STAGES[cur]}`}>
      {STAGES.map((st, i) => <li key={st} className={i < cur ? "is-done" : i === cur ? "is-now" : "is-ahead"}>
        <motion.i initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1], delay: 0.15 + i * 0.08 }} />
        <b>{st}</b><small>{i === cur ? "Now" : i === last ? `By ${d.close} · ${when}` : room.at ? room.at[i] : i < cur ? "Done" : ""}</small>
      </li>)}
    </ol>
  );
}

export function AccountView({ room, renderFile }) {
  const d = room.deal, s = room.score, th = d.threats[0] && THREATS[d.threats[0].k], full = !!s; // Coastline has the full sample detail; the rest only their own fields
  const daysLeft = dayOf(d.close) - TODAY, when = daysLeft < 0 ? `was due ${d.close}` : daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
  const lastDone = room.done.length > 1 ? room.done[room.done.length - 2] : null; // the latest thing that happened before today's work
  const people = room.team.filter((m) => m.k !== "sam");
  const mine = room.path.find((p) => p.who === "sam");
  const draft = () => dispatchEvent(new CustomEvent("north:talk-post", { detail: { id: "t-coast", m: { role: "agent", agent: "fia", chit: true,
    text: `Draft for Priya: “Hi Priya, here’s our security packet for your legal team, reviewed by Dustin, our head of Product & Eng. It answers the questionnaire they sent. Jordan’s week-one plan is attached too, so you can see what happens the day you sign.”` } } }));
  const ask = () => dispatchEvent(new CustomEvent("north:talk", { detail: { text: `@Riley what gets ${d.n} signed by ${d.close}?` } }));
  // what's next, as one row: the step that's yours when one of the live ones is (it's what you came for), else the step that's live
  const live = room.path.filter((p) => p.st === "now" || p.st === "next"), step = live.find((p) => p.who === "sam") || live[0] || room.path[0];
  const before = step && room.path[room.path.indexOf(step) - 1], waits = step && step.st === "next" && before && before.st === "now";
  const yours = step && step.who === "sam";
  const upTo = s && s.ahead ? (s.ahead.find((f) => f.k === "up") || {}).v?.slice(-1)[0] : null; // what doing your step today is worth by the sign-by date
  // an agent's draft is yours: it opens here, only you see it, and it goes out from you (nobody sees that Fia wrote it)
  const NOTE = `Hi ${d.champ[0].split(" ")[0]}, here’s our security packet for your legal team, reviewed by Dustin, our head of Product & Eng. It answers the questionnaire they sent. Jordan’s week-one plan is attached too, so you can see what happens the day you sign.`;
  const [did, setDid] = useState(null), [txt, setTxt] = useState(NOTE), [allSteps, setAllSteps] = useState(false), [pick, setPick] = useState(null);
  const go = () => { if (d.id === "coast") setDid("draft"); else { ask(); setDid("asked"); } };
  return (
    <article className="ar">
      {/* the top: who they are, then the one number (how likely it closes) big, with how it got there under it */}
      <p className="ar-sub">${d.arr}K · {d.agents} agents in {d.city} · {d.champ[0]}, {d.champ[1]}</p>
      <section className="ar-hero">
        {full ? <><div className="ar-odds"><span className="ar-odds-l">Likely to close, out of 100</span><span className="ar-odds-n"><b>{s.now}</b>
          <AnimatePresence>{(did === "queued" || did === "sent") && upTo && <motion.em key="to" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1], delay: 0.2 }}>Heading for {upTo} by {d.close}</motion.em>}</AnimatePresence></span></div><DealChart room={room} pick={pick} setPick={setPick} lock={did === "queued" || did === "sent" ? "up" : null} /></>
          : <Track room={room} when={when} />}
      </section>
      {/* the steps to close, as one list: the step that matters to you shows, with your move on it (an agent does the
          work); the rest of the path opens in place around it */}
      {step && <section className="ar-next">
        <div className="ar-lab ar-lab-r"><span>Steps</span><em>Signs by {d.close}</em></div>
        {(allSteps ? room.path : [step]).map((p, i) => p === step ? <React.Fragment key="me">
        <div className={`ar-nx${yours ? " is-mine" : ""}`}>
          <span className="ar-f">{step.who ? <Face k={step.who} size={28} /> : <span className="ar-ext">{d.n[0]}</span>}</span>
          <div className="ar-nx-t"><b>{yours ? `You: ${lower1(step.t.replace(/^Sends/, "Send"))}` : step.t}</b>
            <small>{yours ? (waits ? `Once ${nameOf(before.who)} ${lower1(before.t.replace(/^Signs off/, "signs off"))}${upTo ? ` · sent today, it’s ${upTo}` : ""}` : `Signs by ${d.close}`) : `${step.who ? nameOf(step.who) : d.n.split(" ")[0]} · ${step.st === "now" ? "now" : step.note || "next"}`}</small></div>
          {yours && (did === "asked" ? <span className="ar-did"><AgentMark id="riley" size={16} />Riley has it, in your chat with North</span>
            : did === "queued" ? <span className="ar-did">Goes to {d.champ[0].split(" ")[0]} from you once {nameOf(before.who)} signs off</span>
            : did === "sent" ? <span className="ar-did">Sent from you</span>
            : did ? null : <motion.button className="ar-go is-agent" whileTap={{ scale: 0.97 }} onClick={go} onPointerEnter={() => upTo && setPick("up")} onPointerLeave={() => setPick(null)} onFocus={() => upTo && setPick("up")} onBlur={() => setPick(null)}><AgentMark id={d.id === "coast" ? "fia" : "riley"} size={18} />{d.id === "coast" ? "Have Fia draft it" : "Plan it with Riley"}</motion.button>)}
        </div>
        {/* the draft, private to you: edit it, then it goes as you. Undo while it's waiting */}
        <AnimatePresence initial={false}>{did === "draft" && <motion.div key="dr" className="ar-draft" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}>
          <div className="ar-draft-in">
            <p className="ar-draft-h"><span>To {d.champ[0]} · from you</span><em>Only you see this draft</em></p>
            <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={4} aria-label={`Note to ${d.champ[0]}`} />
            <div className="ar-draft-a">
              <motion.button className="ar-go" whileTap={{ scale: 0.97 }} onClick={() => setDid(waits ? "queued" : "sent")}>{waits ? `Send once ${nameOf(before.who)} signs off` : "Send"}</motion.button>
              <button type="button" className="ar-q" onClick={() => { setDid(null); setTxt(NOTE); }}>Discard</button>
            </div>
          </div>
        </motion.div>}</AnimatePresence>
        {did === "queued" && <button type="button" className="ar-q ar-undo" onClick={() => setDid("draft")}>Undo, edit the note</button>}
        </React.Fragment>
        : <motion.div key={i} className={`ar-step is-${p.st}`} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: i * 0.03 }}>
            <span className="ar-f">{p.who ? <Face k={p.who} size={28} /> : <span className="ar-ext">{d.n[0]}</span>}</span>
            <div className="ar-nx-t"><b>{p.t}</b><small>{p.who ? nameOf(p.who) : d.n.split(" ")[0]} · {p.st === "now" ? "now" : p.st === "next" ? "next" : p.note || "then"}</small></div>
          </motion.div>)}
        {room.path.length > 1 && <button type="button" className="ar-all" aria-expanded={allSteps} onClick={() => setAllSteps((v) => !v)}>{allSteps ? "Show only yours" : `All ${room.path.length} steps`}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: allSteps ? "rotate(180deg)" : "none", transition: "transform .35s cubic-bezier(.32,.72,0,1)" }}><path d="M3 4.5 6 7.5l3-3" /></svg></button>}
      </section>}
      {/* the rest opens on ask */}
      <div className="ar-folds">
        {people.length > 0 && <Fold title="People" sum={<span>{people.map((m) => nameOf(m.k)).join(", ")}</span>}>
          <ol className="ar-rows is-team">{people.map((m) => <li key={m.k}><span className="ar-f"><Face k={m.k} size={24} /></span><b>{nameOf(m.k)}</b><span>{m.role || ""}</span><em>{m.did}</em></li>)}</ol>
        </Fold>}
        {room.files.length > 0 && <Fold title="Files" sum={<span>{room.files.length}</span>}>
          <div className="ar-files">{room.files.map((k) => renderFile(k))}</div>
        </Fold>}
        {lastDone && <Fold title="Activity" sum={<span>{room.done.length} updates · latest {lastDone[0]}</span>}>
          <ol className="ar-rows is-log">{room.done.map(([at, t, who], i) => <li key={i}><time>{at}</time><b>{t}</b>{who && (AGENTS[who] || PEOPLE_N[who]) ? <span className="ar-f"><Face k={who} size={20} /></span> : <span />}</li>)}</ol>
        </Fold>}
      </div>
      <p className="ar-note">{full ? "Sample deal. The odds, stage dates and history are sample detail written to match it." : "Sample deal, shown from its own fields. No score or history is tracked for it."}</p>
    </article>
  );
}

// a file made for a deal says which deal, where it stands, and where the file is in its own review
export function DealStrip({ room, flow }) {
  return (
    <div className="ar-strip">
      <p><b>For {room.deal.n}</b> · {STAGES[room.deal.stage]} · signs by {room.deal.close}</p>
      {flow && <ol className="ar-flow">{flow.map(([k, t, st], i) => <li key={i} className={`is-${st}`}><Face k={k} size={24} /><span>{t}</span>{st === "done" && <em>Done</em>}{st === "now" && <em>Now</em>}{st === "next" && <em>Next</em>}</li>)}</ol>}
    </div>
  );
}

// ---- agents that know the account ---------------------------------------------------------------------------------------
// Which deal a question (or a conversation's title) is about: its full name, or the first word of it ("Coastline", "Harbor").
export const dealIn = (t) => { const s = String(t || "").toLowerCase(); if (!s) return null;
  return DEALS.find((d) => s.includes(d.n.toLowerCase())) || DEALS.find((d) => new RegExp(`\\b${d.n.split(/[\s&]+/)[0].toLowerCase()}\\b`).test(s)) || null; };
const lower1 = (s) => s.charAt(0).toLowerCase() + s.slice(1);
// everything an agent is allowed to say about a deal: the sample deal's own fields, and Coastline's room detail
export function dealFacts(d) {
  const th = d.threats.map((x) => THREATS[x.k]), r = ROOMS[d.id];
  return [`${d.n}: ${d.agents} agents in ${d.city}; $${d.arr}K new ARR; stage ${STAGES[d.stage]} (${d.stage + 1} of ${STAGES.length}); closes ${d.close}; came in through ${d.src}.`,
    `Champion: ${d.champ[0]}, ${d.champ[1]}. Last touch: ${d.touch}. Deal owner: Sam (New Business).`,
    th.length ? th.map((t) => `In the way: ${t.t}. ${t.say}`).join(" ") : "Nothing in the way right now.",
    r && r.score ? `Likely to close: ${r.score.now} of 100 (down ${r.score.path[2][1] - r.score.now} since legal asked).` : "",
    r && r.path && r.score ? `Left to close: ${r.path.map((p) => `${p.t} (${p.who ? nameOf(p.who) : "Coastline"}${p.st === "now" ? ", now" : ""})`).join("; ")}.` : "",
    r && r.done && r.done.length ? `History: ${r.done.map(([a, t]) => `${a} ${t}`).join("; ")}.` : ""].filter(Boolean).join("\n");
}
// each agent's own read of a deal, from its facts only (what an agent says when Claude isn't there to word it)
export function takeOf(ag, d) {
  const th = d.threats[0] && THREATS[d.threats[0].k], next = STAGES[Math.min(d.stage + 1, STAGES.length - 1)];
  const base = `${d.n} is at ${STAGES[d.stage]}, $${d.arr}K, closing ${d.close}.`;
  switch (ag) {
    case "riley": return `${base} It came in through ${d.src}; ${d.champ[0]} (${d.champ[1]}) last replied ${/^\d/.test(d.touch) ? d.touch : lower1(d.touch)}. ${th ? `One thing in the way: ${lower1(th.t)}. ${th.say}` : `Nothing in the way, so the next move is ${next === "Signed" ? "getting it signed" : `moving it to ${next}`}.`}`;
    case "orin": return th && th.k === "quiet" ? `${d.champ[0]} has gone ${d.touch === "6 days ago" ? "6 days" : "a while"} without a reply. I’d send a short note today that names the ${d.close} date, before it slips out of October.`
      : `${d.champ[0]} replied ${/^\d/.test(d.touch) ? d.touch : lower1(d.touch)}, so the thread is warm. I’d keep the next touch about ${th ? { security: "the security review", signoff: "the exec sign-off", procure: "the vendor packet", sponsor: "who owns it now" }[d.threats[0].k] || lower1(th.t) : `getting to ${next}`}, not about price.`;
    case "calvin": return th && th.k === "sponsor" ? `They have no owner since their champion left. Nothing moves until someone new owns it; I’d ask who runs operations now.`
      : `${th ? `${th.t} is the risk: ${lower1(th.say)} ` : ""}Once it signs, Customer Value takes it from there; for ${d.agents} agents that’s one kickoff and one setup call.`;
    case "fia": return th && (th.k === "security" || th.k === "procure") ? `I can draft the ${th.k === "security" ? "security packet" : "vendor packet"} from our standard answers today, so it goes out as soon as it’s reviewed.`
      : `Nothing in the deal needs a document from me yet. If legal or procurement asks, I can draft it from our standard answers.`;
    case "marco": return `It came in through ${d.src}. ${d.src === "Inbound" || d.src === "Webinar" ? "Marketing has the touch history if you want what they engaged with." : "Marketing didn’t source it, so there’s no campaign history to add."}`;
    default: return base;
  }
}
// a follow-up, when Claude isn't there to word it: the one move that gets this deal over its line, from what's in its way
export function nextOf(d) {
  const th = d.threats[0] && d.threats[0].k, c = d.champ[0].split(" ")[0];
  return th === "security" ? `Get Dustin’s sign-off today, then send the packet to ${c} with a note so it reaches their legal team from her. Fia can draft the note.`
    : th === "quiet" ? `Send ${c} a two-line note that names the ${d.close} date and asks one yes-or-no question. Short gets answered.`
    : th === "signoff" ? `Ask ${c} to put 15 minutes with their CEO on the calendar this week, and give him a one-page summary he can forward. Fia can draft it.`
    : th === "sponsor" ? `Find out who runs operations there now and ask for 20 minutes. Until someone owns it, it can’t move.`
    : th === "procure" ? `Send the vendor packet before procurement asks twice. Fia can draft it from our standard answers.`
    : `Confirm the signing date with ${c} and send the order form, so ${d.close} holds.`;
}
// the same, worded by Claude when the page can ask it: one agent, its role, the deal's facts and nothing else
export async function liveTake(sm, ag, d, ask, said = []) {
  const a = AGENTS[ag]; if (!sm || !a) return takeOf(ag, d);
  const prompt = `You are ${a.n}, the ${a.role} agent inside North, Fello's operating dashboard. Sam (New Business sales) asked about one account.
Answer as ${a.n}, from your role only. 1 to 3 short sentences, under 60 words, plain words, no lists or markdown. Use only the FACTS; if they don't cover it, say what isn't tracked. Never invent numbers, dates or people.
${said.length ? `Already said in this huddle (build on it, don't repeat): ${said.map(([w, t]) => `${AGENTS[w].n}: ${t}`).join(" | ")}` : ""}
FACTS (sample deal):
${dealFacts(d)}

Sam asked: ${ask}`;
  try { const r = await sm(prompt, { modelTier: "quick" }); const t = (r && r.text || "").trim(); return t || takeOf(ag, d); } catch { return takeOf(ag, d); }
}
// what a huddle keeps working on: the thing in the way, else lining up the signature
export function jobFor(d) {
  const th = d.threats[0] && d.threats[0].k, of = d.n.endsWith("s") ? `${d.n}’` : `${d.n}’s`;
  const t = th === "security" ? `Get ${of} security packet signed off` : th === "quiet" ? `Win back ${d.n}` : th === "signoff" ? `Get ${of} exec sign-off` : th === "sponsor" ? `Find ${d.n} a new owner` : th === "procure" ? `Prepare ${of} vendor packet` : `Line up ${of} signature`;
  return { t, think: [`Reading ${d.n} in HubSpot`, "Checking what’s in the way", "Drafting the next step for Sam"] };
}
