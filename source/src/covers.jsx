import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { C, lerp } from "./lib.js";
import { showFile } from "./files.jsx";

// Board covers, drawn in the board's own chart language (the Saved Charts): paper, rounded ticks in a paper well, purple
// for what's done, the purple → salmon run toward pace, salmon only for the target, navy stems with open circles, the big
// light numeral, grey axis type. Each cover is that document's real shape at poster scale, edge to edge under its title.
// At rest it's still; hover and it plays and the breakdown rises; click anywhere and it opens.
const W = 760, H = 440;
const PU = C.purple, CO = C.coral, NV = C.navy, AX = C.axis, LN = C.line, PP = C.paper;
const mix = (a, b, t) => { const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(lerp(v, pb[i], Math.min(1, Math.max(0, t)))).toString(16).padStart(2, "0")).join(""); };
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const Big = ({ x, y, fill = NV, size = 48, anchor = "start", children }) => <text x={x} y={y} fill={fill} fontSize={size} fontWeight={400} letterSpacing="-0.03em" textAnchor={anchor}>{children}</text>;
const Sm = ({ x, y, fill = AX, size = 11, w = 500, anchor = "start", children }) => <text x={x} y={y} fill={fill} fontSize={size} fontWeight={w} textAnchor={anchor}>{children}</text>;
// a well tick (the empty track) and a filled tick on top of it
const Well = ({ x, y, w, h }) => <rect x={x + 0.25} y={y + 0.25} width={w - 0.5} height={h - 0.5} rx={1} fill={PP} stroke={LN} strokeWidth={0.5} />;
const Fill = ({ x, y, w, h, c }) => <rect x={x} y={y} width={w} height={Math.max(0, h)} rx={1} fill={c} filter="url(#grain)" />;

function useClock(live) {
  const [t, setT] = useState(0), base = useRef(0);
  useEffect(() => {
    if (!live) return;
    let raf, last = 0; const t0 = performance.now() - base.current * 1000;
    const step = (now) => { if (now - last > 33) { last = now; base.current = (now - t0) / 1000; setT(base.current); } raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [live]);
  return t;
}

// a live page: the site's pulse as a full-width run of ticks, beating; what's happened is purple running to salmon at now
function Pulse({ t }) {
  const N = 76, tw = 6, pitch = (W - 48 - tw) / (N - 1), base = 400, now = 0.7, off = (t * 0.22) % 1, out = [];
  for (let i = 0; i < N; i++) { const f = i / (N - 1), x = 24 + i * pitch;
    let h = 26 + 18 * hash(i);
    for (let k = -1; k < 4; k++) { const c = (k * 0.34 + off) % 1.02; const d = (f - c) * N;
      h += 210 * Math.exp(-d * d / 2.2) + 70 * Math.exp(-(d + 3.2) * (d + 3.2) / 1.6) + 46 * Math.exp(-(d - 3.5) * (d - 3.5) / 2.4); }
    h = Math.min(h, 250);
    out.push(<g key={i}><Well x={x} y={base - 250} w={tw} h={250} />{f <= now && <Fill x={x} y={base - h} w={tw} h={h} c={mix(PU, CO, Math.pow(f / now, 3))} />}</g>); }
  const nx = 24 + now * (W - 48);
  out.push(<line key="now" x1={nx + 9} x2={nx + 9} y1={base - 262} y2={base + 8} stroke={NV} strokeWidth="1" />, <circle key="nd" cx={nx + 9} cy={base - 266} r={3.5} fill={PP} stroke={NV} strokeWidth="1.2" />, <Sm key="nl" x={nx + 16} y={base - 262} fill={NV}>Live</Sm>);
  return <g>{out}</g>;
}
// a talk: a twelve-minute dial of ticks, the four slides as four purple runs
function Dial({ t }) {
  const cx = 540, cy = 296, N = 96, R = 130, segs = [[0, 0.3], [0.31, 0.55], [0.56, 0.8], [0.81, 1]], sweep = t ? (t * 0.35) % 1.25 : 1, out = [];
  for (let k = 0; k < N; k++) { const f = k / N, a = -Math.PI / 2 + f * Math.PI * 2, s = segs.findIndex(([a0, a1]) => f >= a0 && f < a1);
    const on = s >= 0 && f <= sweep, len = 30, x1 = cx + Math.cos(a) * R, y1 = cy + Math.sin(a) * R, x2 = cx + Math.cos(a) * (R - len), y2 = cy + Math.sin(a) * (R - len);
    out.push(<line key={`w${k}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={LN} strokeWidth="5" strokeLinecap="round" />);
    if (on) out.push(<line key={`f${k}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={s % 2 ? mix(PU, "#ffffff", 0.35) : PU} strokeWidth="4" strokeLinecap="round" />); }
  for (let k = 0; k < 60; k++) { const a = (k / 60) * Math.PI * 2, r = R + 12; out.push(<line key={`m${k}`} x1={cx + Math.cos(a) * r} y1={cy + Math.sin(a) * r} x2={cx + Math.cos(a) * (r + (k % 5 ? 4 : 9))} y2={cy + Math.sin(a) * (r + (k % 5 ? 4 : 9))} stroke={AX} strokeWidth="1" />); }
  out.push(<Big key="n" x={cx} y={cy + 12} fill={PU} size={52} anchor="middle">12</Big>, <Sm key="u" x={cx} y={cy + 34} anchor="middle">minutes · 4 slides</Sm>);
  return <g>{out}</g>;
}
// a workshop: the morning as a ruler, the sessions as runs of ticks on it (yours in purple); who's coming is in the title
function Morning({ t }) {
  const x0 = 40, x1 = 720, X = (h) => x0 + ((h - 9) / 3) * (x1 - x0), ay = 392, top = 210, out = [];
  for (let m = 0; m <= 180; m += 5) { const x = X(9 + m / 60), big = m % 60 === 0; out.push(<line key={`a${m}`} x1={x} x2={x} y1={ay} y2={ay + (big ? 9 : 5)} stroke={AX} strokeWidth="1" />); if (big) out.push(<Sm key={`l${m}`} x={x} y={ay + 24} anchor={m === 180 ? "end" : m ? "middle" : "start"}>{`${9 + m / 60}:00`}</Sm>); }
  out.push(<line key="ax" x1={x0} x2={x1} y1={ay} y2={ay} stroke={AX} strokeWidth="1" />);
  const S = [[9, 9.25, "You open", 1], [9.5, 10.25, "Brightwater"], [10.25, 11, "Working session"], [11, 11.75, "Roadmap"]], hh = ay - top - 8;
  S.forEach(([a, b, l, you], i) => { const xa = X(a) + 6, xb = X(b) - 6, n = Math.max(2, Math.round((xb - xa) / 8)), live = t ? 0.7 + 0.3 * Math.sin(t * 3 - i) : 1;
    for (let k = 0; k < n; k++) { const x = xa + k * ((xb - xa - 5) / (n - 1)), fh = you ? hh : hh * (t ? 0.8 + 0.2 * live : 1);
      out.push(<g key={`s${i}-${k}`}><Well x={x} y={top} w={5} h={hh} /><Fill x={x} y={top + hh - fh} w={5} h={fh} c={you ? PU : "#cfc6ee"} /></g>); }
    out.push(<Sm key={`t${i}`} x={xa} y={top - 10} fill={you ? PU : NV} w={you ? 600 : 500}>{l}</Sm>); });
  return <g>{out}</g>;
}
// a deck: nine slides as nine runs of ticks; six drafted (purple running to salmon), slide 7 filling now, two empty
function Slides({ t, n = 9, done = 6 }) {
  const x0 = 28, base = 392, top = 172, per = 6, tw = 6, gap = 3, blk = per * tw + (per - 1) * gap, sp = (W - 56 - blk) / (n - 1), out = [];
  for (let s = 0; s < n; s++) { const bx = x0 + s * sp, hh = base - top;
    for (let k = 0; k < per; k++) { const x = bx + k * (tw + gap);
      const f = s < done ? 1 : s === done ? (t ? Math.min(1, (t * 0.45 + (per - k) * 0.08) % 1.3) : Math.max(0, 0.62 - k * 0.09)) : 0;
      out.push(<g key={`${s}-${k}`}><Well x={x} y={top} w={tw} h={hh} />{f > 0 && <Fill x={x} y={base - hh * f} w={tw} h={hh * f} c={s === done ? "#9a86d8" : mix(PU, CO, ((s * per + k) / (done * per)) * 0.45)} />}</g>); }
    out.push(<Sm key={`l${s}`} x={bx} y={base + 20} fill={s === done ? PU : AX} w={s === done ? 600 : 500}>{s === done ? "7 · Paul’s on it" : String(s + 1)}</Sm>); }
  return <g>{out}</g>;
}
// a video: its soundtrack as ticks, played in purple; a navy stem marks the 0:40 quote that needs your OK
function Track({ t, len = 134, mark = 40 }) {
  const N = 110, x0 = 28, x1 = 732, cy = 290, tw = 4, p = t ? ((t * 5) % len) / len : 0.36, out = [];
  for (let i = 0; i < N; i++) { const f = i / (N - 1), x = x0 + f * (x1 - x0 - tw), v = Math.abs(Math.sin(i * 0.37) + 0.6 * Math.sin(i * 0.11 + 1) + 0.4 * Math.sin(i * 1.3)) / 2, h = 16 + 150 * v;
    out.push(<g key={i}><Well x={x} y={cy - h / 2} w={tw} h={h} />{f <= p && <Fill x={x} y={cy - h / 2} w={tw} h={h} c={PU} />}</g>); }
  const mx = x0 + (mark / len) * (x1 - x0 - tw) + tw / 2;
  out.push(<line key="ms" x1={mx} x2={mx} y1={168} y2={378} stroke={NV} strokeWidth="1" />, <circle key="mc" cx={mx} cy={164} r={4} fill={PP} stroke={NV} strokeWidth="1.2" />, <Sm key="ml" x={mx + 10} y={168} fill={NV} w={600}>0:40 · your OK</Sm>);
  const mm = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  out.push(<Sm key="a0" x={x0} y={404}>0:00</Sm>, <Sm key="a1" x={x1} y={404} anchor="end">{mm(len)}</Sm>);
  if (t) out.push(<Sm key="ap" x={x0 + p * (x1 - x0)} y={404} anchor="middle" fill={PU}>{mm(p * len)}</Sm>);
  return <g>{out}</g>;
}
// a report of four charts: four dials of ticks, each filled to its share of pace (purple into salmon), the salmon tick at the
// top is pace; the furthest behind reads in dark red
function Dials({ t }) {
  const M = [["Outbound", 0.23], ["New logos", 0.75], ["Held-demo win rate", 0.85], ["Expansion ARR", 0.72]], N = 56, R = 64, out = [], prog = t ? Math.min(1, (t % 5) / 1.6) : 1;
  M.forEach(([l, f], g) => { const cx = 102 + g * 185, cy = 268, lit = Math.round(N * f * (1 - Math.pow(1 - prog, 3)));
    for (let k = 0; k < N; k++) { const a = -Math.PI / 2 + (k / N) * Math.PI * 2, x1 = cx + Math.cos(a) * R, y1 = cy + Math.sin(a) * R, x2 = cx + Math.cos(a) * (R - 18), y2 = cy + Math.sin(a) * (R - 18);
      out.push(<line key={`${g}w${k}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={LN} strokeWidth="3.5" strokeLinecap="round" />);
      if (k === 0) out.push(<line key={`${g}p`} x1={cx} y1={cy - R - 8} x2={cx} y2={cy - R + 18} stroke={CO} strokeWidth="3.5" strokeLinecap="round" />);
      else if (k < lit) out.push(<line key={`${g}f${k}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={mix(PU, CO, k / N)} strokeWidth="3" strokeLinecap="round" />); }
    out.push(<Big key={`${g}n`} x={cx} y={cy + 11} size={30} fill={g === 0 ? C.alert : PU} anchor="middle">{`${Math.round(f * 100)}%`}</Big>, <Sm key={`${g}l`} x={cx} y={cy + R + 30} anchor="middle" fill={NV}>{l}</Sm>); });
  return <g>{out}</g>;
}
// a plan to hold retention: six months of GRR as a hatched field under a navy line, the 97% floor in salmon (the target),
// and where it stands now
const GRR = [97.2, 97.5, 97.0, 97.4, 97.9, 97.7]; // the GRR tile's own May–October series
function Hold({ t }) {
  const lo = 96.6, hi = 98.2, x0 = 28, x1 = 560, base = 392, Y = (v) => 190 + (1 - (v - lo) / (hi - lo)) * (base - 190), n = 110, pts = [], out = [];
  const at = (f) => { const u = f * 5, k = Math.min(4, Math.floor(u)), e = u - k, s = e * e * (3 - 2 * e); return GRR[k] + (GRR[k + 1] - GRR[k]) * s; };
  for (let i = 0; i < n; i++) { const f = i / (n - 1), x = x0 + f * (x1 - x0), y = Y(at(f)), w = t ? 0.5 + 0.5 * Math.cos(f * 12 - t * 3) : 0.6;
    pts.push(`${x},${y}`); out.push(<line key={i} x1={x} x2={x} y1={y + 3} y2={base} stroke={C.mtd} strokeOpacity={0.25 + 0.45 * w} strokeWidth="1.4" />); }
  out.push(<polyline key="l" points={pts.join(" ")} fill="none" stroke={NV} strokeWidth="2" strokeLinejoin="round" />);
  out.push(<line key="fl" x1={x0} x2={W - 28} y1={Y(97)} y2={Y(97)} stroke={CO} strokeWidth="1.6" strokeDasharray="0.1 5" strokeLinecap="round" />, <Sm key="fll" x={W - 28} y={Y(97) - 8} anchor="end" fill={CO}>97% floor</Sm>);
  out.push(<circle key="e" cx={x1} cy={Y(97.7)} r={5} fill={PP} stroke={NV} strokeWidth="1.6" />, <Big key="v" x={x1 + 18} y={Y(97.7) + 14} fill={PU} size={44}>97.7%</Big>, <Sm key="vl" x={x1 + 20} y={Y(97.7) + 34}>GRR in October</Sm>);
  ["May", "Jun", "Jul", "Aug", "Sep", "Oct"].forEach((m, i) => out.push(<Sm key={m} x={x0 + (i / 5) * (x1 - x0)} y={base + 20} anchor={i === 0 ? "start" : "middle"}>{m}</Sm>));
  out.push(<line key="ax" x1={x0} x2={x1} y1={base} y2={base} stroke={AX} strokeWidth="1" />);
  return <g>{out}</g>;
}
// the same art is the file's own front page: a deck's cover slide, the top of a doc or report, wherever it opens or is listed
const BY_FILE = { saastr: Dial, boarddeck: Slides, workshop: Morning, brightvid: Track, pipeline: Dials, retplan: Hold };
export const hasCoverArt = (k) => !!BY_FILE[k];
// crop: under a title that sits elsewhere, the art without the quiet band its title would have used
export function CoverArt({ k, className, crop }) { const Art = BY_FILE[k]; if (!Art) return null;
  return <svg className={className} viewBox={crop ? `0 130 ${W} ${H - 130}` : `0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true"><Art t={0} /></svg>; }
const ART = { "d-portal": Pulse, "d-saastr": Dial, "d-workshop": Morning, "d-board": Slides, "d-video": Track, "d-pipeline": Dials, "d-ret": Hold };

export function DocCover({ it }) {
  const [hv, setHv] = useState(false), t = useClock(hv), Art = ART[it.id] || Pulse;
  const open = (e) => (it.site ? window.open(it.site, "_blank", "noopener") : showFile(it.k, e.currentTarget, { full: true }));
  return (
    <div className={`bcv${hv ? " is-hv" : ""}`} role="button" tabIndex={0} aria-label={it.site ? `Open ${it.name}` : `Open ${it.name} full screen`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setHv(true)} onPointerLeave={() => setHv(false)} onClick={open} onKeyDown={(e) => e.key === "Enter" && open(e)}>
      <svg className="bcv-art" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true"><Art t={t} /></svg>
      <div className="bcv-head"><h4>{it.title}</h4><p>{it.sub}</p></div>
      <AnimatePresence>
        {hv && <motion.ul key="p" className="bcv-parts" style={{ gridTemplateColumns: `repeat(${it.parts.length}, minmax(0, 1fr))` }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10, transition: { duration: 0.18 } }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
          {it.parts.map(([l, v, tone]) => <li key={l}><span>{l}</span>
            {tone === "dots" ? <i className="bcv-dots" aria-label={`${v[0]} of ${v[0] + v[1] + v[2]} drafted`}>{[...Array(v[0]).fill("d"), ...Array(v[1]).fill("n"), ...Array(v[2]).fill("o")].map((x, i) => <b key={i} className={`is-${x}`} />)}</i>
              : <em className={tone ? `is-${tone}` : ""}>{v}</em>}</li>)}
        </motion.ul>}
      </AnimatePresence>
    </div>);
}
