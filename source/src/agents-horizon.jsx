// North · Agents — "the horizon" concept.
// The page's stage is North's own mark made into a place: the horizon is now. Above it, raw signals stream down the
// rays from the sources each agent is reading (scattered, jittery: unprocessed). Each agent is a sun on the horizon,
// labelled with exactly what it's doing. Below it, the same work leaves as structured output (even, aligned dashes)
// toward what it's making for you. When something lands, it drops out of the stage into "Needs you".
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence } from "motion/react";
import { DialRoot, useDialKit } from "dialkit";
import { NorthLogo } from "./marks.jsx";
import { Orb } from "./agents.jsx";

const SPEC = {
  stage: ["Stage", { type: "select", options: [{ value: "night", label: "Night (navy stage)" }, { value: "dawn", label: "Dawn (light stage)" }], default: "night" }],
  flow: ["Signals coming in (per second, per source)", [2.2, 0.2, 8, 0.1]],
  speed: ["Signal travel time (s)", [2.6, 0.6, 6, 0.1]],
  jitter: ["Raw signal scatter (px)", [7, 0, 20, 0.5]],
  rays: ["Rays per agent", [26, 8, 48, 1]],
  glow: ["Sun glow", [1, 0, 2, 0.05]],
  outSpeed: ["Structured output speed (px/s)", [46, 10, 140, 1]],
  stepLen: ["Seconds per step (simulation)", [7, 1.5, 15, 0.5]],
  legend: ["Show the in · working · out legend", true],
  dimOthers: ["Hover an agent: dim the others to", [0.28, 0, 1, 0.01]],
};
const DIALS = Object.fromEntries(Object.values(SPEC).map(([l, v]) => [l, v]));
const fromDials = (v) => Object.fromEntries(Object.entries(SPEC).map(([k, [l]]) => [k, v[l]]));

// agent colours, tuned for each stage (the same hue family as their orbs)
const COL = {
  night: { fia: "#ff8f74", orin: "#a99dff", felix: "#ff9ff1" },
  dawn: { fia: "#ec6b52", orin: "#6a62e6", felix: "#c95cc0" },
};
const AGENTS = [
  { id: "fia", n: "Fia", role: "Growth", x: 0.22, src: ["outbound", "pace", "plan"], jobs: [
    { out: "Monday sync summary", steps: ["Pulling October bookings", "Sizing the three levers", "Writing the summary", "Checking the numbers with Orin"],
      lands: { t: "The Monday sync summary is ready.", b: "The path to $40M on one page: $1.09M left to close and the three levers that close it. Orin checked the numbers.", act: "Review the summary" } },
    { out: "Outbound demo list", steps: ["Pulling Sam's demo list", "Checking the 14 open prospects", "Ranking who to call first"],
      lands: { t: "Sam's 14 open prospects, ranked.", b: "The demo list Sam left still has 14 open prospects. I ranked them by deal size and last touch so he can start Monday.", act: "See the list" } } ] },
  { id: "orin", n: "Orin", role: "Finance", x: 0.52, src: ["plan", "comp", "health"], jobs: [
    { out: "Year-end forecast", steps: ["Loading the $40.03M plan", "Running the three levers", "Stress-testing the $1.98M at risk"],
      lands: { t: "Year-end forecast with all three levers is ready.", b: "All three levers land us at $40.08M, $50K over the $40.03M plan. That's no margin: one slipped deal and we miss.", act: "See the forecast" } },
    { out: "GTM comp by lane", steps: ["Loading GTM comp", "Splitting comp by lane", "Comparing it to booked ARR"],
      lands: { t: "GTM comp by lane is ready.", b: "Sam's comp is about $9K a month wherever he sits. The only question is where his time earns more, and Outbound is $443.6K behind.", act: "See the split" } } ] },
  { id: "felix", n: "Felix", role: "Customers", x: 0.82, src: ["health", "inbound", "usage"], jobs: [
    { out: "Where accounts stall", steps: ["Pulling time to first contract", "Finding where accounts stall", "Drafting fixes with Dustin"],
      lands: { t: "Found where new accounts stall before first integration.", b: "Time to first contract is 30.0 days. I drafted three fixes for the first-integration step with Dustin.", act: "Read the fixes" } },
    { out: "Felix handoffs by team", steps: ["Pulling Felix handoffs", "Splitting them by team", "Flagging teams under target"],
      lands: { t: "Felix handoffs per 1K, by team.", b: "Company-wide it's 9.61 per 1K. I flagged the teams furthest under target.", act: "See the teams" } } ] },
];
// where the data comes from. Shared sources sit between the agents that read them (Plan feeds Fia and Orin; Account health feeds Orin and Felix)
const SOURCES = { outbound: ["Outbound lane", 0.09, 1], pace: ["Pace", 0.22, 0], plan: ["Plan", 0.37, 1], comp: ["GTM comp", 0.52, 0], health: ["Account health", 0.67, 1], inbound: ["Inbound lane", 0.82, 0], usage: ["Product usage", 0.94, 1] };
const jobOf = (a, s) => a.jobs[s.job % a.jobs.length];
const START = { fia: 1, orin: 0, felix: 1 }; // where each agent is when the page opens

// ---------------------------------------------------------------- the stage (canvas for light, DOM for words)
function Stage({ D, state, hover, setHover }) {
  const wrap = useRef(null), cvs = useRef(null);
  const [W, setW] = useState(1108);
  const H = 470, HZ = 292, TOP = 58, BOT = 418; // horizon, where sources sit, where outputs sit
  useEffect(() => { const ro = new ResizeObserver(() => setW(wrap.current.getBoundingClientRect().width)); ro.observe(wrap.current); return () => ro.disconnect(); }, []);
  const live = useRef({}); live.current = { D, state, hover, W };
  useEffect(() => {
    const c = cvs.current, g = c.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
    let raf = 0, last = performance.now();
    const parts = AGENTS.map(() => []), acc = AGENTS.map(() => 0), dash = AGENTS.map(() => 0);
    const loop = (now) => {
      const { D, state, hover, W } = live.current, dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (c.width !== Math.round(W * dpr)) { c.width = Math.round(W * dpr); c.height = H * dpr; }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      const night = D.stage === "night", col = COL[D.stage];
      // horizon
      const hl = g.createLinearGradient(0, 0, W, 0); hl.addColorStop(0, "rgba(74,134,178,0)"); hl.addColorStop(0.5, night ? "rgba(141,183,216,.75)" : "rgba(36,93,136,.45)"); hl.addColorStop(1, "rgba(74,134,178,0)");
      g.fillStyle = hl; g.fillRect(0, HZ, W, 1);
      AGENTS.forEach((a, i) => {
        const cx = a.x * W, k = hover && hover !== a.id ? D.dimOthers : 1, s = state[a.id], busy = !s.done;
        const srcX = (j) => SOURCES[a.src[j]][1] * W, srcY = (j) => TOP + SOURCES[a.src[j]][2] * 26;
        // rays: a fan from the sun up to the top of the stage (the North mark, opened up)
        const n = D.rays;
        for (let r = 0; r < n; r++) {
          const ang = (-62 + (124 * r) / (n - 1)) * Math.PI / 180, len = (HZ - 10) / Math.cos(ang);
          const ex = cx + Math.sin(ang) * len, ey = 10;
          const gr = g.createLinearGradient(cx, HZ, ex, ey);
          gr.addColorStop(0, night ? `rgba(169,203,230,${0.38 * k})` : `rgba(36,93,136,${0.30 * k})`); gr.addColorStop(1, "rgba(74,134,178,0)");
          g.strokeStyle = gr; g.lineWidth = 0.6; g.beginPath(); g.moveTo(cx, HZ); g.lineTo(ex, ey); g.stroke();
        }
        // below: the same fan, mirrored and quieter (what it's making)
        for (let r = 0; r < n; r += 2) {
          const ang = (-34 + (68 * r) / (n - 1)) * Math.PI / 180, ex = cx + Math.tan(ang) * (H - HZ), ey = H;
          const gr = g.createLinearGradient(cx, HZ, ex, ey); gr.addColorStop(0, night ? `rgba(120,110,255,${0.30 * k})` : `rgba(106,98,230,${0.18 * k})`); gr.addColorStop(1, "rgba(106,98,230,0)");
          g.strokeStyle = gr; g.lineWidth = 0.6; g.beginPath(); g.moveTo(cx, HZ); g.lineTo(ex, ey); g.stroke();
        }
        // source lines: brighter, from each source tag down into the sun
        a.src.forEach((_, j) => { const sx = srcX(j); g.strokeStyle = night ? `rgba(169,203,230,${0.22 * k})` : `rgba(36,93,136,${0.2 * k})`; g.lineWidth = 1; g.setLineDash([2, 4]); g.beginPath(); g.moveTo(sx, srcY(j) + 16); g.lineTo(cx, HZ - 22); g.stroke(); g.setLineDash([]); });
        // raw signals: scattered dots riding the source lines into the sun (only while it's working)
        acc[i] += dt * D.flow * a.src.length * (busy ? 1 : 0.08);
        while (acc[i] >= 1) { acc[i] -= 1; parts[i].push({ j: Math.floor(Math.random() * a.src.length), t: 0, o: (Math.random() - 0.5) * 2, z: 0.6 + Math.random() * 1.6, sq: Math.random() < 0.35 }); }
        const P = parts[i];
        for (let p = P.length - 1; p >= 0; p--) {
          const q = P[p]; q.t += dt / D.speed; if (q.t >= 1) { P.splice(p, 1); continue; }
          const sx = srcX(q.j), x0 = sx, y0 = srcY(q.j) + 16, x1 = cx, y1 = HZ - 22, e = q.t * q.t * (3 - 2 * q.t);
          const sc = D.jitter * (1 - e); // the scatter tightens as it nears the agent: noise becoming signal
          const x = x0 + (x1 - x0) * e + q.o * sc, y = y0 + (y1 - y0) * e + Math.sin(q.t * 9 + q.o * 6) * sc * 0.4;
          const al = Math.min(1, q.t * 6) * (1 - Math.max(0, (q.t - 0.85) / 0.15)) * k;
          g.fillStyle = night ? `rgba(230,240,250,${0.85 * al})` : `rgba(9,53,85,${0.7 * al})`;
          if (q.sq) g.fillRect(x - q.z, y - q.z, q.z * 2, q.z * 2); else { g.beginPath(); g.arc(x, y, q.z, 0, Math.PI * 2); g.fill(); }
        }
        // the sun
        const sunR = 22, gl = D.glow;
        const halo = g.createRadialGradient(cx, HZ, 0, cx, HZ, 120 * gl + 1); halo.addColorStop(0, hexA(col[a.id], 0.42 * k * (busy ? 1 : 0.5))); halo.addColorStop(1, hexA(col[a.id], 0));
        g.fillStyle = halo; g.fillRect(cx - 130 * gl, HZ - 130 * gl, 260 * gl, 130 * gl);
        const sun = g.createRadialGradient(cx, HZ, 0, cx, HZ, sunR); sun.addColorStop(0, night ? "#ffffff" : "#ffffff"); sun.addColorStop(0.45, hexA(col[a.id], 0.95 * k)); sun.addColorStop(1, hexA(col[a.id], 0.65 * k));
        g.fillStyle = sun; g.beginPath(); g.arc(cx, HZ, sunR * (busy ? 1 + Math.sin(now / 600 + i) * 0.03 : 0.86), Math.PI, 0); g.fill();
        // structured output: even dashes travelling down to what it's making
        dash[i] = (dash[i] + dt * D.outSpeed * (busy ? 1 : 0.15)) % 14;
        g.strokeStyle = hexA(col[a.id], (night ? 0.9 : 0.8) * k); g.lineWidth = 2; g.setLineDash([6, 8]); g.lineDashOffset = -dash[i];
        g.beginPath(); g.moveTo(cx, HZ + 52); g.lineTo(cx, BOT - 18); g.stroke(); g.setLineDash([]);
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div ref={wrap} className={`stg stg-${D.stage}`} onPointerLeave={() => setHover(null)}>
      <canvas ref={cvs} style={{ width: "100%", height: H }} />
      {D.legend && <div className="stg-leg"><span style={{ top: TOP + 4 }}>Coming in</span><span style={{ top: HZ - 7 }}>Working</span><span style={{ top: BOT - 4 }}>Making for you</span></div>}
      {Object.entries(SOURCES).map(([id, [t, x, row]]) => { const users = AGENTS.filter((a) => a.src.includes(id)); const on = !hover || users.some((a) => a.id === hover);
        return <span key={id} className="stg-src" style={{ left: x * W, top: TOP + row * 26, opacity: on ? 1 : D.dimOthers }}>{t}{users.length > 1 && <i>{users.length}</i>}</span>; })}
      {AGENTS.map((a) => {
        const s = state[a.id], cx = a.x * W, k = hover && hover !== a.id ? D.dimOthers : 1, col = COL[D.stage][a.id];
        return (
          <div key={a.id} className="stg-ag" style={{ opacity: k }} onPointerEnter={() => setHover(a.id)}>
            <div className="stg-who" style={{ left: cx, top: HZ + 10 }}>
              <Orb id={a.id} size={18} live={!s.done} /><b>{a.n}</b><small>{a.role}</small>
            </div>
            <div className="stg-now" style={{ left: cx, top: HZ + 34 }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={s.done ? "done" : s.step} initial={{ opacity: 0, y: 6, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6, filter: "blur(3px)" }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
                  {s.done ? "Sent to Needs you" : jobOf(a, s).steps[s.step]}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="stg-out" style={{ left: cx, top: BOT - 14 }}>
              <span className="stg-ticks">{jobOf(a, s).steps.map((_, j) => <i key={j} style={{ background: j < s.step || s.done ? col : j === s.step ? hexA(col, 0.55) : undefined }} />)}</span>
              <AnimatePresence mode="popLayout" initial={false}><motion.span key={jobOf(a, s).out} className="stg-out-t" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.4 }}>{jobOf(a, s).out}</motion.span></AnimatePresence>
              <em>{s.done ? "Ready" : `Step ${s.step + 1} of ${jobOf(a, s).steps.length}`}</em>
            </div>
          </div>
        );
      })}
    </div>
  );
}
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; };

// ---------------------------------------------------------------- page
const ARW = <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h8M7.8 3.8 11 7l-3.2 3.2" /></svg>;
const FIRST = [
  { id: "orin-out", a: "orin", ago: "12 min ago", t: "Outbound is $443.6K behind pace. Moving Sam back closes most of it.", b: "Sam booked $7.5K a day on Outbound before Oct 14, and the demo list he left still has 14 open prospects. I’d move him back for the last two weeks of the month.", act: "Approve the move", tag: true },
  { id: "felix-smb", a: "felix", ago: "40 min ago", t: "4 SMB renewals due by Dec 31 have gone quiet for 60 days.", b: "11 of the 29 renewals in Jordan’s book have been touched. I drafted QBR invites for the four quiet accounts. They go out from Jordan once you approve.", act: "Send the invites" },
];
function Card({ c }) {
  const a = AGENTS.find((x) => x.id === c.a);
  return (
    <motion.div layout className={`tk${c.fresh ? " is-fresh" : ""}`} initial={{ opacity: 0, y: -18, filter: "blur(6px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
      <div className="tk-h"><Orb id={a.id} size={22} /><b>{a.n}</b><span>{a.role}</span><time>{c.ago}</time></div>
      <h4 className="tk-t">{c.t}</h4>
      <p className="tk-b">{c.b}</p>
      {c.tag && <div className="tk-tag"><span className="ava">SH</span><span className="who">You</span><span className="at">@Caleb</span><span className="msg">hey, check this out</span><span className="vis">Caleb can see this</span></div>}
      <div className="tk-a"><button className="btn-pri">{c.act}</button><button className="btn-sec">Give feedback</button><span className="open">Open{ARW}</span></div>
    </motion.div>
  );
}

function Page() {
  const D = fromDials(useDialKit("Agents · stage", DIALS));
  const [hover, setHover] = useState(null);
  const [state, setState] = useState(() => Object.fromEntries(AGENTS.map((a) => [a.id, { job: 0, step: START[a.id], done: false }])));
  const [cards, setCards] = useState(FIRST);
  // the simulation: each agent advances a step every few seconds; finishing drops a card into "Needs you",
  // then it picks up its next job after a beat
  const stRef = useRef(state); stRef.current = state;
  useEffect(() => {
    const ids = AGENTS.map((a) => a.id);
    let i = 0;
    const t = setInterval(() => {
      const id = ids[i++ % ids.length], a = AGENTS.find((x) => x.id === id), s = stRef.current[id], j = jobOf(a, s);
      if (s.done) { setState((S) => ({ ...S, [id]: { job: S[id].job + 1, step: 0, done: false } })); return; } // on to the next job
      if (s.step + 1 >= j.steps.length) {
        setState((S) => ({ ...S, [id]: { ...S[id], done: true } }));
        setCards((C) => [{ id: `${id}-${Date.now()}`, a: id, ago: "Just now", t: j.lands.t, b: j.lands.b, act: j.lands.act, fresh: true }, ...C.map((c) => ({ ...c, fresh: false }))].slice(0, 4));
      } else setState((S) => ({ ...S, [id]: { ...S[id], step: S[id].step + 1 } }));
    }, (D.stepLen * 1000) / 3);
    return () => clearInterval(t);
  }, [D.stepLen]);
  const working = AGENTS.filter((a) => !state[a.id].done).length;
  return (
    <div className="pg">
      <header className="pg-h">
        <h1>Agents</h1>
        <div className="ag-sub">{AGENTS.length} agents · {working} working · {cards.length} need you</div>
        <p className="ch-north"><NorthLogo size={18} live className="ch-north-mark" /><span>Two things need you. Orin finished the Outbound review and wants Caleb on it before Monday. Felix found four SMB renewals that have gone quiet. <span className="ch-north-go">Start with Orin’s review{ARW}</span></span></p>
      </header>
      <Stage D={D} state={state} hover={hover} setHover={setHover} />
      <div className="ag-sec"><h3>Needs you</h3><span className="n">{cards.length}</span></div>
      <div className="ag-two"><AnimatePresence initial={false}>{cards.map((c) => <Card key={c.id} c={c} />)}</AnimatePresence></div>
      <DialRoot position="bottom-right" theme="dark" productionEnabled defaultOpen={false} />
    </div>
  );
}
createRoot(document.getElementById("root")).render(<Page />);
