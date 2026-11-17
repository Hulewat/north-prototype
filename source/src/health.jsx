// Company health — built from Figma "Company Health · v8" (721:1043).
// Coordinates in comments are the Figma card's; the scroll area starts at card y 65.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useIsPresent } from "motion/react";
import { C, bezier, clamp, stag, win, toMotion, useReplay, prefersReduced, useGraceHover } from "./lib.js";
import { MonthlyBars, MonthlyLine, PaceLine, GeoCtx, geo, mix } from "./open-charts.jsx";
import { TipBody } from "./visuals.jsx";
import { NorthLogo } from "./marks.jsx";
import { PinIcon, AskChartIcon, PinButton, AskButton, SyncAllButton, SyncButton, useActions } from "./actions.jsx";

const REDUCED = prefersReduced();
export const PURPLE = "#744ccb";
// one green ramp for every "on pace" on these pages: light (85–99), mid (100–119), deep (120%+ and status fills)
export const GREEN = { light: "#c6e2e4", mid: "#6aacb3", deep: "#257985" };
// off plan is a deep berry rather than a pure red: it sits next to purple as one "miss" family and never reads as green-vs-red
export const OFF = "#9b1b5a";
export const SETTLE = bezier([0.16, 1, 0.3, 1]);
export const MTD = "#7f9bb2";

// ------------------------------------------------------------------ data
// status bars at the top: widths exactly as drawn in Figma (558, 148, 68 of 641)
const STATUS = [["On Pace", "30", 30 / 36, GREEN.deep], ["Behind", "4", 4 / 36, PURPLE], ["Off Plan", "2", 2 / 36, OFF]]; // drawn to scale: out of the 36 with a pace or target

// scoreboard: chart = what the card opens to first (amounts → monthly bars, rates → monthly line)
export const CARDS = [
  { label: "Total ARR", value: "$35.75M", foot: "of $40.03M plan", pct: "89%", kind: "bars", vals: [29.5, 30.6, 31.3, 32.06, 34.15, 35.75], lo: 25, hi: 37, ticks: [30, 35] },
  { label: "Net new ARR", value: "$1.60M", foot: "pace $1.78M of $1.87M", pct: "86%", pctColor: C.coral, kind: "bars", vals: [1.4, 1.1, 0.7, 0.76, 2.09, 1.6], lo: 0, hi: 2.3, ticks: [1, 2] },
  { label: "NRR", value: "99.9%", foot: "target 100.0%", pct: "100%", kind: "line", vals: [99.1, 99.8, 100.2, 99.4, 100.7, 99.9], lo: 98.4, hi: 101.4 },
  { label: "GRR", value: "97.7%", foot: "pace 97.07% of 96.93%", pct: "101%", kind: "line", vals: [97.2, 97.5, 97.0, 97.4, 97.9, 97.7], lo: 96.3, hi: 98.4 },
  { label: "Felix ARR", value: "$12.99M", foot: "pace $12.99M of $13.06M", pct: "100%", kind: "bars", vals: [5.1, 6.4, 7.9, 9.42, 11.55, 12.99], lo: 0, hi: 15, ticks: [5, 10] },
  { label: "Avg ARR per account", value: "$13.1K", foot: "target $12.8K", pct: "102%", kind: "bars", vals: [12.4, 12.6, 12.7, 12.9, 13.0, 13.1], lo: 11, hi: 13.6, ticks: [12, 13] },
  { label: "Paying accounts", value: "2,717", foot: "target 2,800", pct: "97%", kind: "bars", vals: [2610, 2635, 2660, 2680, 2700, 2717], lo: 2500, hi: 2850, ticks: [2600, 2700, 2800] },
  { label: "ARR to GTM comp", value: "31.3x", foot: "target 26.0x", pct: "120%", kind: "line", vals: [27.8, 28.9, 29.6, 30.2, 30.8, 31.3], lo: 24.5, hi: 32.5 },
];

// heatmap: [name, value, pct (drives colour + bar; null = no target/data), status shown, footer, pace mark (0–1) | null]
export const LANES = [
  ["Inbound", "Marketing", 98, [
    ["Booked ARR – Inbound", "$1.31M", 128, "128%", "pace $1.03M", 1.03 / 1.08],
    ["Demos booked", "342", 96, "96%", "pace 356", 356 / 373],
    ["Demo held rate", "50.7%", 85, "85%", "target 60%", null],
    ["Pipeline created", "$5.97M", 114, "114%", "pace $5.22M", 5.22 / 5.47],
    ["Joint booked ARR", "$65.1K", null, "No target", "No target set", null]]],
  ["Outbound", "Sales", 63, [
    ["Booked ARR – Outbound", "$130.2K", 23, "23%", "pace $573.8K", 573.8 / 664.5],
    ["Demos booked", "250", 95, "95%", "pace 262.5", 262.5 / 275],
    ["Demo held rate", "41.9%", 84, "84%", "target 50%", null],
    ["Pipeline created", "$2.97M", 87, "87%", "pace $3.40M", 3.4 / 3.56],
    ["Booked ARR – no inbound", "$98.5K", null, "No target", "No target set", null]]],
  ["New Business", "Sales", 84, [
    ["New ARR", "$1.52M", 92, "92%", "pace $1.66M", 1.66 / 1.74],
    ["Demos held", "310", 90, "90%", "pace 344.6", 344.6 / 361],
    ["Win rate from held demo", "19.9%", 85, "85%", "target 23.5%", null],
    ["New logos", "55", 75, "75%", "pace 73", 73 / 85],
    ["New logo avg ARR", "$25.0K", 122, "122%", "target $20.5K", null]]],
  ["Value Delivery", "Customer Value", 80, [
    ["TTV: first contract", "30.0d", null, "No data", "No data connection", null],
    ["Felix activations", "82", 102, "102%", "pace 80.2", 80.2 / 84],
    ["TTV: 10 handoffs", "20.9d", 72, "5.9d over", "ceiling 15.0d", null],
    ["Time post-activation", "179.8d", null, "No pace", "target 75.0d", null],
    ["Cohort at first contract", "—", null, "No data", "No data connection", null]]],
  ["Customer Value", "Customer Value", 100, [
    ["GRR", "97.7%", 101, "101%", "pace 97.07%", null],
    ["Healthy ARR", "63%", 150, "2.1× target", "target 30%", null],
    ["At-risk ARR", "$1.98M", 130, "Under ceiling", "ceiling $5.50M", null],
    ["Downgrade + churn", "$773K", 129, "$227K under", "pace $1.00M", null],
    ["Expansion leads", "—", null, "No data", "No data connection", null]]],
  ["Expansion", "Sales", 74, [
    ["Expansion ARR", "$734.0K", 72, "72%", "pace $1.01M", 1.014 / 1.17],
    ["Deals created", "110", 97, "97%", "pace 113.6", 113.6 / 119],
    ["SQL → SQO", "60.4%", null, "No target", "No target set", null],
    ["Win rate", "31.9%", 53, "53%", "target 60%", null],
    ["Avg expansion ARR", "$18.5K", 112, "112%", "target $16.5K", null]]],
  ["Product & Eng", "Product & Eng", 92, [
    ["Felix handoffs per 1K", "9.61", 101, "101%", "pace 9.55", 9.55 / 10],
    ["Daily active users", "1,577", 93, "93%", "target 1,700", null],
    ["Active accounts", "28.5%", 95, "95%", "target 30%", null],
    ["Fello health", "68", 93, "93%", "target 73", null],
    ["Felix health", "70", 90, "90%", "target 78", null]]],
];
export const status = (p) => (p == null ? "none" : p >= 85 ? "on" : p >= 70 ? "behind" : "off");
// status on these pages: navy on pace, purple behind, red off plan (no salmon)
export const SC = { on: GREEN.deep, behind: PURPLE, off: OFF, none: C.mute };
export const TXT = { on: C.navy, behind: PURPLE, off: OFF, none: C.mute };

// ------------------------------------------------------------------ small parts
export function FSeg({ value, onChange, options, M, id }) {
  return (
    <div className="fseg" role="tablist">
      {options.map((v) => (
        <button key={v} role="tab" aria-selected={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>
          {value === v && <motion.span layoutId={`fseg-${id}`} className="fseg-pill" transition={toMotion(M.select.pill)} />}
          <span className="seg-t">{v}</span>
        </button>
      ))}
    </div>
  );
}
export const Pick = ({ label, value }) => (
  <button className="fpick"><span>{label}</span><b>{value}</b>
    <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><path d="M1.5 3 4 5.5 6.5 3" fill="none" stroke={C.navy} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
);

// his score ring: dashed track + dashed arc, 36px
let ringId = 0;
export function Ring({ score, color, p = 1, size = 36, track = "#f3f1ef" }) {
  const [id] = useState(() => `rg${++ringId}`);
  const k = size / 36, r = 14.05 * k, sw = 3.52 * k, c = size / 2, R = size;
  const a = -Math.PI / 2 + 2 * Math.PI * Math.min(0.9999, (score / 100) * p);
  const large = (score / 100) * p > 0.5 ? 1 : 0;
  const wedge = `M${c} ${c} L${c} ${c - R} A${R} ${R} 0 ${large} 1 ${c + R * Math.cos(a)} ${c + R * Math.sin(a)} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="hm-ring">
      <defs><mask id={id} maskUnits="userSpaceOnUse"><path d={wedge} fill="#fff" /></mask></defs>
      <circle cx={c} cy={c} r={r} fill="none" stroke={track} strokeWidth={sw} strokeDasharray="1.7 1" />
      <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray="1.7 1" mask={`url(#${id})`} />
    </svg>
  );
}

// scoreboard mini chart — faint until the card is hovered, then it wakes to full colour
const W0 = 231.6, H = 26, TOP = -14;
const FAINT = { bar: "#d1d8de", mtd: "#e5e8eb", base: "#f3f0ed", line: "#cdd3d8", grid: "#f8f6f4" };
const LIVE = { bar: C.navyFill, mtd: MTD, base: "#c9c4bf", line: C.navy, grid: C.line };
export function Mini({ c, p, live, E, col, w }) {
  const W = w || W0; // draws to the card's real width, so wide cards don't letterbox the preview
  const K = live ? (col ? { ...LIVE, bar: col, mtd: mix(col, C.paper, 0.45), line: col } : LIVE) : FAINT;
  const Y = (v) => H - ((v - c.lo) / (c.hi - c.lo)) * (H - TOP);
  // a goal's progress, the library's way: a row of ticks filled to where it is, the pace tick where it should be by today
  if (c.kind === "ticks") {
    const N = 40, tw = 3, pitch = (W - tw) / (N - 1), on = Math.round(Math.min(1, c.f) * N), pk = Math.max(1, Math.round(c.pace * N));
    return (
      <svg className="sc-svg" viewBox={`0 ${TOP} ${W} ${H - TOP}`} aria-hidden="true">
        {Array.from({ length: N }, (_, i) => { const k = i + 1, g = E(stag(p, i, N, 0.5)), h = (H - TOP - 4) * g;
          const fill = k === pk ? (live ? C.coral : "#f2c4b8") : k <= on ? (live ? (col || C.navyFill) : FAINT.bar) : (live ? "#e7e4e0" : "#efedea");
          return <rect key={i} x={i * pitch} y={H - h} width={tw} height={h} rx="1" style={{ fill, transition: "fill .25s" }} />; })}
      </svg>
    );
  }
  const n = c.vals.length;
  if (c.kind === "bars") {
    const gap = 8, bw = (W - 12 - gap * (n - 1)) / n;
    return (
      <svg className="sc-svg" viewBox={`0 ${TOP} ${W} ${H - TOP}`} aria-hidden="true">
        <g filter={live ? "url(#grain)" : undefined}>
          {c.vals.map((v, i) => {
            const g = E(stag(p, i, n, 0.5)), y0 = Y(v), h = (H - y0) * g, x = i * (bw + gap);
            return <path key={i} d={`M${x} ${H}V${H - h + 2}Q${x} ${H - h} ${x + 2} ${H - h}H${x + bw - 2}Q${x + bw} ${H - h} ${x + bw} ${H - h + 2}V${H}Z`} style={{ fill: i === n - 1 ? K.mtd : K.bar }} />;
          })}
        </g>
        {c.vals.map((v, i) => { const x = i * (bw + gap), y0 = H - (H - Y(v)) * E(stag(p, i, n, 0.5));
          return c.ticks.filter((t) => Y(t) > y0 + 1 && Y(t) < H - 1).map((t) => <rect key={`${i}-${t}`} x={x} y={Y(t) - 0.375} width={bw} height="0.75" fill={C.paper} />); })}
        <line x1="0" x2={W} y1={H} y2={H} style={{ stroke: K.base }} strokeWidth="1" />
      </svg>
    );
  }
  const pad = 5, X = (i) => pad + (i / (n - 1)) * (W - 2 * pad - 6);
  const pts = c.vals.map((v, i) => [X(i), Y(v)]);
  const reveal = E(p) * (W + 10);
  return (
    <svg className="sc-svg" viewBox={`0 ${TOP} ${W} ${H - TOP}`} aria-hidden="true">
      <defs><clipPath id={`clip-${c.label.replace(/\W/g, "")}`}><rect x="-6" y={TOP - 6} width={reveal} height={H - TOP + 12} /></clipPath></defs>
      <line x1="0" x2={W} y1={Y(c.lo + (c.hi - c.lo) / 2)} y2={Y(c.lo + (c.hi - c.lo) / 2)} style={{ stroke: K.grid }} strokeWidth="0.5" />
      <g clipPath={`url(#clip-${c.label.replace(/\W/g, "")})`}>
        <polyline points={pts.map((q) => q.join(",")).join(" ")} fill="none" style={{ stroke: K.line }} strokeWidth="1.25" strokeLinejoin="round" />
        {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === n - 1 ? 4.5 : 2.5} style={{ fill: K.line }} stroke={C.paper} strokeWidth="1.5" />)}
      </g>
    </svg>
  );
}

function ScoreCard({ c, q, p, E }) {
  const [hov, setHov] = useState(false);
  return (
    <motion.div className="card scard" style={{ opacity: Math.min(1, q * 1.5), scale: 1 + 0.06 * (1 - q) }}
      onPointerEnter={() => setHov(true)} onPointerLeave={() => setHov(false)} tabIndex={0} onFocus={() => setHov(true)} onBlur={() => setHov(false)}>
      <div className="surface">
        <span className="sc-lab">{c.label}</span>
        <span className="sc-v">{c.value}</span>
        <div className="sc-chart"><Mini c={c} p={p} live={hov} E={E} /></div>
      </div>
      <div className="sc-foot"><span>{c.foot}</span><b style={{ color: c.pctColor || C.navy }}>{c.pct}</b></div>
    </motion.div>
  );
}

// ------------------------------------------------------------------ scoreboard: the home key-metric tile, 8 of them
// Closed each sits in its grid slot showing the faint preview chart; opened, the same element grows over both rows.
function ScoreMetrics({ Tile, metrics, M, P, E }) {
  const slots = useRef([]);
  const wrap = useRef(null);
  const [rects, setRects] = useState(null);
  const [openId, setOpenId] = useState(null);
  const last = useRef(null);
  if (openId) last.current = openId;
  const BIG = ["ch-total", "ch-net"];
  const small = metrics.filter((m) => !BIG.includes(m.id));
  const qBig = SETTLE(stag(P.cards, 0, small.length + 1, M.health.cardStagger));
  useLayoutEffect(() => {
    const measure = () => {
      const r = wrap.current.getBoundingClientRect(), o = { full: { top: 0, left: 0, width: r.width, height: r.height } };
      small.forEach((m, i) => { const c = slots.current[i].getBoundingClientRect(); o[m.id] = { top: c.top - r.top, left: c.left - r.left, width: c.width, height: c.height }; });
      setRects(o);
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);
  return (
    <div className="sgrid-wrap" ref={wrap} style={{ "--wake": `${M.health.wake}s` }}>
      <div className="sgrid sgrid-arr">
        <div className="kslot arr-slot"><ArrCard M={M} p={P.ye} dim={!!openId} style={{ opacity: Math.min(1, qBig * 1.5), scale: 1 + (M.arrive.chartScale - 1) * (1 - qBig) * 0.4 }} /></div>
        {small.map((m, i) => <div key={m.id} className="kslot" ref={(el) => (slots.current[i] = el)} />)}
      </div>
      {rects && small.map((m, i) => {
        const k = metrics.indexOf(m);
        const q = SETTLE(stag(P.cards, i + 1, small.length + 1, M.health.cardStagger)), dp = stag(P.draw, i + 1, small.length + 1, M.health.cardStagger);
        return <Tile key={m.id} m={m} M={M} rect={rects[m.id]} full={rects.full} open={openId === m.id} dim={!!openId && openId !== m.id} top={last.current === m.id}
          p={dp} introStyle={{ opacity: Math.min(1, q * 1.5), scale: 1 + (M.arrive.chartScale - 1) * (1 - q) }}
          onOpen={(id) => setOpenId((o) => (o === id ? null : id))} onClose={() => setOpenId(null)}
          closed={(live) => <Mini c={CARDS[k]} p={dp} live={live} E={E} col={m.fill} />} />;
      })}
    </div>
  );
}

// ------------------------------------------------------------------ the ARR card: Total ARR, the month's net movement, and where the year lands.
// Chart: ending ARR by month (May–Oct actual, Nov–Dec projected at the current net new rate) against the $40.03M plan;
// the year-end gap is the space between December's projected bar and the plan line.
const YE = { plan: 40.03, proj: 38.94, months: ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], vals: [29.5, 30.6, 31.3, 32.06, 34.15, 35.75, 37.35, 38.94], nAct: 6 };
const ARRC = C.navyFill;
export function ArrChart({ M, p, Wv = 800, Hv = 320, foot = 20 }) {
  const { E } = M.ctx;
  const [hov, setHov] = useGraceHover(M.hover ? M.hover.grace * 1000 : 180);
  const x0 = 48, top = 26, base = Hv - foot, lo = 25, hi = 42, n = YE.vals.length;
  const pitch = (Wv - x0) / n, bw = Math.min(40, pitch * 0.56);
  const Y = (v) => base - ((v - lo) / (hi - lo)) * (base - top);
  const cx = (i) => x0 + pitch * (i + 0.5);
  const gridP = E(win(p, 0, 0.3)), planP = E(win(p, 0.55, 0.85)), gapP = E(win(p, 0.8, 1));
  const fmt = (v) => `$${v.toFixed(2)}M`;
  const bar = (x, y, w) => `M${x} ${base}V${y + 3}Q${x} ${y} ${x + 3} ${y}H${x + w - 3}Q${x + w} ${y} ${x + w} ${y + 3}V${base}Z`;
  // one tooltip, same as every other chart: what the column is, its value, and how it sits against the plan
  // what the column is goes in the eyebrow; rows only carry what that kind of month can honestly say
  const tip = hov == null ? null : (() => {
    const v = YE.vals[hov], proj = hov >= YE.nAct, mtd = hov === YE.nAct - 1, last = hov === n - 1, mo = YE.months[hov];
    const eyebrow = last ? "Dec 31 · projected" : proj ? `${mo} · projected` : mtd ? `${mo} · to date` : `${mo} · month end`;
    const rows = last ? [{ k: "Plan", v: fmt(YE.plan) }, { k: <b style={{ color: OFF }}>Short of plan</b>, v: <span style={{ color: OFF }}>{`−${fmt(YE.plan - v)}`}</span> }]
      : proj ? [{ k: "At October’s net new rate" }]
      : hov > 0 ? [{ k: `vs ${YE.months[hov - 1]}`, v: `${v >= YE.vals[hov - 1] ? "+" : "−"}${fmt(Math.abs(v - YE.vals[hov - 1]))}`, vc: v >= YE.vals[hov - 1] ? GREEN.deep : OFF }] : [];
    return { x: hov === 0 ? cx(hov) - bw / 2 : last ? cx(hov) + bw / 2 : cx(hov), edge: hov === 0 ? "l" : last ? "r" : "c", y: Y(v), title: fmt(v), eyebrow, rows };
  })();
  const align = (x) => (x > Wv * 0.72 ? "right" : x < Wv * 0.28 ? "left" : "center");
  return (
    <div className="viz arrc-viz">
            <svg viewBox={`0 0 ${Wv} ${Hv}`} role="img" aria-label="Total ARR by month, May to October, projected to December against the $40.03M plan" onPointerLeave={() => setHov(null)}
              onPointerMove={(e) => { const r = e.currentTarget.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * Wv, y = ((e.clientY - r.top) / r.height) * Hv, i = Math.floor((x - x0) / pitch);
                const on = i >= 0 && i < n && y >= Y(Math.max(YE.vals[i], i === n - 1 ? YE.plan : 0)) - 10 && y <= base + 2; setHov(on ? i : null); }}>
              {[25, 30, 35, 40].map((g) => (
                <g key={g} opacity={gridP}>
                  {g !== 25 && <line x1={x0} x2={Wv} y1={Y(g)} y2={Y(g)} stroke={C.line} strokeWidth="0.5" />}
                  <text x={x0 - 8} y={Y(g) + 4} textAnchor="end" fontSize="11.5" fontWeight="500" fill={C.mute}>{`$${g}M`}</text>
                </g>
              ))}
              <line x1={x0} x2={Wv} y1={base} y2={base} stroke={C.edge} strokeWidth="0.75" />
              {YE.vals.map((v, i) => {
                const proj = i >= YE.nAct, mtd = i === YE.nAct - 1;
                const t = E(stag(win(p, proj ? 0.45 : 0.08, proj ? 0.8 : 0.6), proj ? i - YE.nAct : i, proj ? n - YE.nAct : YE.nAct, M.health.cardStagger));
                const y = base - (base - Y(v)) * t, x = cx(i) - bw / 2;
                return (
                  <g key={i} opacity={hov != null && hov !== i ? 0.45 : 1} style={{ transition: "opacity .2s" }}>
                    {proj
                      ? <path d={bar(x + 0.5, y + 0.5, bw - 1)} fill={C.paper} stroke={ARRC} strokeWidth="1" strokeDasharray="3 2.5" />
                      : <path d={bar(x, y, bw)} fill={mtd ? mix(ARRC, C.paper, 0.42) : ARRC} filter="url(#grain)" />}
                    {!proj && [30, 35].map((g) => Y(g) > y + 1 && <rect key={g} x={x} y={Y(g) - 0.375} width={bw} height="0.75" fill={C.paper} />)}
                    <text x={cx(i)} y={Hv - 4} textAnchor="middle" fontSize="11.5" fontWeight={mtd ? 600 : 500} fill={mtd ? C.navy : C.mute} opacity={gridP}>{YE.months[i]}</text>
                  </g>
                );
              })}
              <line x1={x0} x2={x0 + (Wv - 6 - x0) * planP} y1={Y(YE.plan)} y2={Y(YE.plan)} stroke={C.coral} strokeWidth="1" strokeDasharray="0.1 2.6" strokeLinecap="round" />
              <circle cx={Wv - 4} cy={Y(YE.plan)} r={4 * planP} fill={C.coral} />
              <text x={x0 + 4} y={Y(YE.plan) - 8} fontSize="11.5" fontWeight="600" fill={C.coral} opacity={planP}>{`Plan ${fmt(YE.plan)}`}</text>
              <line x1={cx(n - 1)} x2={cx(n - 1)} y1={Y(YE.plan) + 1.5} y2={Y(YE.proj) - 1.5} stroke={OFF} strokeWidth="2" strokeLinecap="round" opacity={gapP} />
            </svg>
            <AnimatePresence>
              {tip && (
                <motion.div key="tip" className="tip tip-level" onPointerEnter={() => setHov(hov)} onPointerLeave={() => setHov(null)}
                  initial={{ opacity: 0, scale: 0.9, y: 6, left: `${(tip.x / Wv) * 100}%`, top: `${(tip.y / Hv) * 100}%` }}
                  animate={{ opacity: 1, scale: 1, y: 0, left: `${(tip.x / Wv) * 100}%`, top: `${(tip.y / Hv) * 100}%` }}
                  exit={{ opacity: 0, scale: 0.94, y: 4, transition: { duration: 0.12 } }}
                  transition={{ ...toMotion(M.tip), left: toMotion(M.tipFollow), top: toMotion(M.tipFollow) }}
                  style={{ x: tip.edge === "l" ? "0%" : tip.edge === "r" ? "-100%" : "-50%", translate: "0 calc(-100% - 8px)", transformOrigin: `${tip.edge === "l" ? "0%" : tip.edge === "r" ? "100%" : "50%"} 100%` }}>
                  <TipBody id={tip.title} eyebrow={tip.eyebrow} title={tip.title} rows={tip.rows} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
  );
}

// Total ARR: the big card in the scoreboard, surrounded by the other KPI tiles
function ArrCard({ M, p, style, dim, go }) {
  const fmt = (v) => `$${v.toFixed(2)}M`;
  return (
    <motion.section className="card arrc arrc-v2" aria-label="Total ARR and the year-end gap" style={{ ...style, opacity: dim ? 0.35 : style.opacity }}>
      <div className="surface arrc-s2">
        <div className="arrc-top">
          <div className="arrc-main">
            <span className="arrc-lab">Total ARR</span>
            <span className="arrc-v">$35.75M</span>
            <span className="arrc-pin"><AskChartIcon /><PinIcon id="ch-total" /></span>
            <span className="arrc-sub">of the $40.03M plan · <b>89%</b></span>
          </div>
        </div>
        <div className="arrc-chart"><ArrChart M={M} p={p} Wv={800} Hv={214} /></div>
        <div className="arrc-stats2">
          <div className="arrc-stat"><span>Net new ARR · Oct</span><b>$1.60M</b><small>90% of pace</small></div>
          <div className="arrc-stat"><span>Year-end gap · current trend</span><b>−${(YE.plan - YE.proj).toFixed(2)}M</b><small>{fmt(YE.proj)} projected · {Math.round((YE.proj / YE.plan) * 100)}% of plan</small></div>
        </div>
      </div>
    </motion.section>
  );
}

// ------------------------------------------------------------------ pinned charts on Home: every pin is a chart from these pages.
// Same scoreboard card anatomy; the filled star unpins (the card leaves its slot), the last slot adds more.
function pinMeta(id, metrics) {
  if (id === "arr") {
    const v = YE.vals.slice(0, YE.nAct);
    return { label: "Total ARR", value: "$35.75M", foot: "of $40.03M plan", pct: "89%", c: { kind: "bars", vals: v, lo: 25, hi: 37, ticks: [30, 35], label: "pin-arr" }, to: ["health"] };
  }
  const k = metrics.findIndex((m) => m.id === id);
  if (k >= 0) { const m = metrics[k], cd = CARDS[k]; return { label: m.label, value: m.value, foot: m.foot, pct: m.pct, pctColor: m.pctColor, c: { ...cd, label: "pin-" + id }, to: ["health"] }; }
  const mm = /^(\d+)-(\d+)$/.exec(id);
  if (mm) {
    const m = metricFor(+mm[1], +mm[2]), S = m.series;
    return { label: m.n, value: m.v, foot: `${m.lane} · ${m.foot}`, pct: m.p != null ? m.s : "", pctColor: m.st === "on" ? C.navy : TXT[m.st],
      c: S ? { kind: S.line ? "line" : "bars", vals: S.vals, lo: S.lo, hi: S.hi, ticks: S.ticks.filter((t) => t > S.lo), label: "pin-" + id } : null, to: ["metric", +mm[1], +mm[2]] };
  }
  return null;
}
export function PinnedRow({ M, metrics, go, style }) {
  const { pins, togglePin } = useActions();
  const { E } = M.ctx;
  const items = [...pins].map((id) => [id, pinMeta(id, metrics)]).filter(([, x]) => x);
  return (
    <motion.section className="pinned" aria-labelledby="pin-h" style={style}>
      <div className="board-head"><h3 id="pin-h">Pinned</h3>{items.length > 0 && <span className="pin-n">{items.length}</span>}</div>
      <div className="pin-grid">
        <AnimatePresence initial={false} mode="popLayout">
          {items.map(([id, x]) => (
            <motion.div key={id} layout className="card scard pin-card" role="link" tabIndex={0}
              initial={{ opacity: 0, scale: 0.94, filter: "blur(3px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{ opacity: 0, scale: 0.94, filter: "blur(3px)", transition: { duration: 0.2 } }}
              transition={{ layout: toMotion(M.select.glide), default: toMotion(M.health.tileOpen) }}
              onClick={() => go(...x.to)} onKeyDown={(e) => e.key === "Enter" && go(...x.to)}>
              <div className="surface">
                <span className="sc-lab">{x.label}</span>
                <span className="sc-v">{x.value}</span>
                <div className="sc-chart">{x.c ? <Mini c={x.c} p={1} live E={E} /> : <span className="dc-none">No data connection yet</span>}</div>
              </div>
              <div className="sc-foot"><span>{x.foot}</span><b style={{ color: x.pctColor || C.navy }}>{x.pct}</b></div>
              <span className="pin-x"><PinIcon id={id} /></span>
            </motion.div>
          ))}
          <motion.button key="add" layout className="pin-add" onClick={() => go("health")} transition={{ layout: toMotion(M.select.glide) }}>
            <span className="pin-add-i">+</span>
            <b>{items.length ? "Pin another chart" : "Pin a chart"}</b>
            <small>Open Company health and tap ☆ on any chart</small>
          </motion.button>
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

// ------------------------------------------------------------------ heatmap
// Heat = % of pace, read as a diverging field around the line between on pace and behind:
// one navy ramp for on pace (deeper = further ahead), one warm arm for misses (deeper = further behind),
// no-data squares sit in the neutral well. Text always wears ink or paper, never the fill colour.
// one colour: a single navy ramp where depth = distance behind pace, so the misses are the darkest squares
export const HEAT_ONE = [
  [100, "#d6e3f0", "100%+"], [85, "#a9c3dd", "85–99"], [70, "#6f97c0", "70–84"], [55, "#33618f", "55–69"], [0, "#0f3a60", "Under 55"],
];
export const HEAT = [
  [120, GREEN.deep, "120%+"], [100, GREEN.mid, "100–119"], [85, GREEN.light, "85–99"],
  [70, "#744ccb", "70–84"], [0, OFF, "Under 70"],
];
const lum = (hex) => { const f = (i) => { const v = parseInt(hex.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(1) + 0.7152 * f(3) + 0.0722 * f(5); };
export function heat(p, strength = 1, pal = "status") {
  // accents: the tile stays paper and its status is a short colour bar on the left edge, so the grid reads calm and only
  // the colour of the bars (and the % behind) carries the signal
  if (pal === "accent" && p != null) { const acc = HEAT.find(([min]) => p >= min)[1]; return { bg: C.paper, solid: C.paper, dark: false, ink: C.navy, sub: "rgba(9,53,85,.72)", track: "rgba(9,53,85,.14)", shade: "rgba(9,53,85,.08)", accent: acc, txt: TXT[status(p)] }; }
  // focus: every tile stays filled, but only the misses (under 85% of pace) carry full colour; on-pace tiles drop to a soft
  // tint of their colour, so the eye lands on what's behind instead of on a wall of colour
  if (pal === "focus" && p != null) { const base = HEAT.find(([min]) => p >= min)[1]; return heatOf(p >= 85 ? mix(base, C.paper, 0.62) : mix(base, C.paper, 1 - strength)); }
  if (p == null) return { bg: "transparent", solid: "#e7e4e1", ink: C.navy, sub: C.mute, none: true, track: "rgba(9,53,85,.12)", shade: "rgba(9,53,85,.06)" }; // no target: the page shows through
  return heatOf(mix((pal === "one" ? HEAT_ONE : HEAT).find(([min]) => p >= min)[1], C.paper, 1 - strength));
}
function heatOf(bg) {
  // cream type wherever it clears 4.5:1 against the square; navy only where cream wouldn't read
  const dark = (lum(C.paper) + 0.05) / (lum(bg) + 0.05) >= 4.5;
  return { bg, dark, ink: dark ? C.paper : C.navy, sub: dark ? "rgba(254,251,249,.82)" : "rgba(9,53,85,.72)",
    track: dark ? "rgba(254,251,249,.26)" : "rgba(9,53,85,.14)", shade: dark ? "rgba(0,0,0,.16)" : "rgba(9,53,85,.08)" };
}
function HeatKey({ strength, pal = "status" }) {
  return (
    <div className="hm-key" aria-label="Colour shows % of pace">
      <span className="hm-key-arm">{(pal === "one" ? HEAT_ONE : HEAT).slice().reverse().map(([, c, l]) => <span key={l} className="hm-key-s"><i style={{ background: pal === "focus" && /85|100|120/.test(l) ? mix(c, C.paper, 0.62) : mix(c, C.paper, 1 - strength) }} /><small>{l}</small></span>)}</span>
      <span className="hm-key-s"><i className="is-none" /><small>No target</small></span>
    </div>
  );
}
const RH = 88, HH = 58, NCOL = 7, NROW = 5; // lanes across the top, each lane's five metrics down its column
function Opened({ t, r, ci, M, onLeave, onPick }) { // r = lane (column), ci = metric (row)
  const [n, v, p, s, foot, mark] = t, st = status(p), h = heat(p, M.health.heat, M.health.heatPalette);
  const T = toMotion(M.health.tileOpen);
  const inT = (d) => ({ ...toMotion(M.health.tileIn), delay: d });
  const fill = p == null ? 0 : Math.min(1, p / 100);
  const present = useIsPresent();
  return (
    <motion.div className="hm-open" data-name={n} data-lane={LANES[r] && LANES[r][0]} role="button" tabIndex={-1} aria-label={`Open ${n}: ${v}, ${s}`} onPointerLeave={onLeave} onClick={onPick}
      style={{ left: `calc(${(r * 100) / NCOL}% - 0.5px)`, ...(ci === NROW - 1 ? { bottom: 0 } : { top: HH + ci * RH }), pointerEvents: present ? "auto" : "none", zIndex: present ? 6 : 5, background: h.none ? C.paper : h.bg, "--ink-c": h.ink, "--sub-c": h.sub, "--track": h.track, "--shade": h.shade, "--cut": h.solid || h.bg }}
      initial={{ height: RH }} animate={{ height: RH * 2 }} exit={{ height: RH, opacity: 0, transition: { height: T, opacity: { duration: 0.12, delay: 0.06 } } }} transition={T}>
      <span className="hm-lab">{n}</span>
      <span className="hm-v" style={{ color: v === "—" ? C.mute : h.ink }}>{v}</span>
      <motion.span className="ho-pct" style={{ color: h.txt || h.ink }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={inT(M.health.tileDelay)}>{s}</motion.span>
      <motion.div className="ho-bar" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={inT(M.health.tileDelay + M.health.tileStagger)}>
        {p != null && <motion.i className="grain" style={{ background: h.accent || h.ink }} initial={{ width: 0 }} animate={{ width: `${fill * 100}%` }} transition={{ ...toMotion(M.health.barFill), delay: M.health.tileDelay + M.health.tileStagger }} />}
        {[25, 50, 75].map((q) => <u key={q} style={{ left: `${q}%` }} />)}
        {mark != null && <motion.b style={{ left: `calc(${Math.min(mark, 1) * 100}% )`, background: h.accent || h.ink, borderColor: h.bg }} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", visualDuration: 0.35, bounce: 0.35, delay: M.health.tileDelay + M.health.tileStagger + 0.25 }} />}
      </motion.div>
      <motion.button className="ho-foot" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={inT(M.health.tileDelay + M.health.tileStagger * 2)} aria-label={`Open ${n}`}>
        <span>{foot}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.3 4.5 9.8 8l-3.5 3.5" fill="none" stroke={h.ink} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </motion.button>
    </motion.div>
  );
}

function Heatmap({ M, P, open, setOpen, go, link, setLink = () => {} }) {
  const [hov, setHov] = useState(null);
  const ref = useRef(null);
  const [W, setW] = useState(1119);
  useLayoutEffect(() => { const ro = new ResizeObserver(() => ref.current && setW(ref.current.getBoundingClientRect().width)); ro.observe(ref.current); return () => ro.disconnect(); }, []);
  const onPick = (r, c) => { clearTimeout(timer.current); setHov(null); setOpen({ r, c }); };
  const timer = useRef(null);
  const enter = (r, c) => { if (open) return; clearTimeout(timer.current); timer.current = setTimeout(() => setHov({ r, c }), (hov ? 0 : M.health.hoverIntent) * 1000); };
  const leave = () => { clearTimeout(timer.current); timer.current = setTimeout(() => setHov(null), 60); };
  useEffect(() => () => clearTimeout(timer.current), []);
  const lit = (r, c) => link && link.from === "talk" && link.r === r && (c == null || link.c === c);
  // build-in: one wave flowing out from the centre of the grid. Each square's distance from the middle (tile proportions,
  // ~1.75 wide to 1 tall), normalised 0 (centre) → 1 (corner). The front moves continuously; a soft edge means many squares
  // are mid-way at once, so it reads as one surface filling with colour, not cards arriving one by one.
  const dist = useMemo(() => {
    const cr = (LANES.length - 1) / 2, cc = (LANES[0][3].length - 1) / 2, m = {}; let mx = 0;
    LANES.forEach(([, , , tiles], r) => { tiles.forEach((t, c) => { const d = Math.hypot((r - cr) * 1.75, c - cc); m[`${r}-${c}`] = d; mx = Math.max(mx, d); }); m[`h-${r}`] = Math.hypot((r - cr) * 1.75, -1 - cc); });
    for (const k in m) m[k] = Math.min(1, m[k] / (mx || 1)); return m;
  }, []);
  // P.cells is seconds since the wave started. Each square waits (its distance × the spread), then runs its own fade.
  const fade = M.health.tileFade, FILL = useMemo(() => bezier(fade.ease), [JSON.stringify(fade.ease)]);
  const BAR = useMemo(() => bezier(M.health.headBar.ease), [JSON.stringify(M.health.headBar.ease)]);
  const building = P.cells < M.health.flowSpread + Math.max(0, M.health.headLag) + Math.max(fade.duration, M.health.barWait + M.health.headBar.duration);
  return (
    <div className={`hm hm-t${link && link.from === "talk" ? " is-linking" : ""}${building ? " is-building" : ""}`} ref={ref} onPointerLeave={() => { leave(); setLink(null); }}>
      {LANES.map(([lane, dept, score, tiles], r) => {
        // the category rides the same wave as its squares: same clock, same fade and easing, reached a beat after the row under it
        const hs = P.cells - dist[`h-${r}`] * M.health.flowSpread - M.health.headLag, hd = Math.max(0.01, fade.duration);
        const q = FILL(clamp(hs / hd)), g = BAR(clamp((hs - M.health.barWait) / Math.max(0.01, M.health.headBar.duration))); // the score bar fills on its own, quicker curve
        const st = status(score);
        return (
          <React.Fragment key={lane}>
            {/* lane header: name, department, and its score as a horizontal bar */}
            <motion.div className={`hm-cat hm-head${lit(r) ? " is-lit" : ""}`} role="link" tabIndex={0} style={{ gridColumn: r + 1, gridRow: 1, opacity: q }}
              onPointerEnter={() => setLink({ r, from: "hm" })} aria-label={`${lane}, score ${score}. Open its outcome metric`} onClick={() => go(dept, r, 0)} onKeyDown={(e) => e.key === "Enter" && go(dept, r, 0)}>
              <span className="hm-h-t"><b>{lane}</b><svg className="hm-h-go" width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h8M7.8 3.8 11 7l-3.2 3.2" /></svg></span>
              <span className="hm-h-bar"><span className="hm-hbar" aria-hidden="true"><i className="grain" style={{ width: `${Math.min(100, score) * g}%`, background: SC[st] }} />{[25, 50, 75].map((x) => <u key={x} style={{ left: `${x}%` }} />)}</span><em style={{ color: TXT[st] }}>{score}</em></span>
            </motion.div>
            {tiles.map((t, c) => {
              const [n, v, p, s] = t, st2 = status(p), h = heat(p, M.health.heat, M.health.heatPalette);
              return (
                <motion.div className={`hm-cell${h.none ? " is-none" : ""}${h.accent ? " is-accent" : ""}${lit(r, c) ? " is-lit" : ""}`} key={n} tabIndex={0} role="button" aria-label={`${lane}: ${n}, ${v}${p != null ? `, ${s} of pace` : ""}`}
                  style={(() => {
                    // flow in: the front reaches each square by its distance from the centre and its colour rises out of the paper
                    const k = FILL(clamp((P.cells - dist[`${r}-${c}`] * M.health.flowSpread) / Math.max(0.01, fade.duration)));
                    // fades up out of the paper: opacity and colour rise together, the type settles in over the second half
                    return { gridColumn: r + 1, gridRow: c + 2, background: h.none ? h.bg : mix(h.bg, C.paper, (1 - k) * 0.6), "--ink-c": h.ink, "--sub-c": h.sub, ...(h.accent ? { "--acc": h.accent, "--acc-t": h.txt } : {}),
                      opacity: k, "--txt-o": win(k, 0.3, 1) };
                  })()}
                  onPointerEnter={() => { enter(r, c); setLink({ r, c, from: "hm" }); }} onFocus={() => setHov({ r, c })} onBlur={() => setHov(null)}
                  onClick={() => onPick(r, c)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPick(r, c))}>
                  <span className="hm-lab">{n}</span>
                  <span className="hm-v" style={{ color: v === "—" ? C.mute : "var(--ink-c)" }}>{v}</span>
                  {st2 !== "on" && <span className={`hm-flag${st2 === "none" ? " is-none" : ""}`}>{s}</span>}
                </motion.div>
              );
            })}
          </React.Fragment>
        );
      })}
      <AnimatePresence>
        {hov && !open && <Opened key={`${hov.r}-${hov.c}`} t={LANES[hov.r][3][hov.c]} r={hov.r} ci={hov.c} M={M} onLeave={leave} onPick={() => onPick(hov.r, hov.c)} />}
      </AnimatePresence>
      <AnimatePresence>
        {open && <motion.div key="dim" className="hx-dim" style={{ "--hx-blur": `${M.health.dimBlur}px` }} initial={{ opacity: 0 }} animate={{ opacity: M.health.dim }} exit={{ opacity: 0, transition: { duration: 0.2 } }} transition={{ ...toMotion(M.open.content), delay: 0.08 }} />}
      </AnimatePresence>
      <AnimatePresence>
        {open && <HeatOpen key={`o-${open.r}-${open.c}`} r={open.r} c={open.c} W={W} M={M} onClose={() => setOpen(null)} go={go} />}
      </AnimatePresence>
    </div>
  );
}


// ------------------------------------------------------------------ a square opens the way the home metric cards do:
// the same element grows across the heatmap — label and value scale up in place, then the chart (with lenses),
// the details column and the footer settle in. Closing runs it back into its square.
export const OWNERS = { Inbound: "Lisa", Outbound: "Caleb", "New Business": "Sam", "Value Delivery": "PD", "Customer Value": "PD / Rick", Expansion: "Heather Kleckner", "Product & Eng": "Dustin" };
export const DESC = {
  "Booked ARR – Inbound": "New ARR closed this month from deals that started with an inbound lead.",
  "Booked ARR – Outbound": "New ARR closed this month from deals that started with outbound prospecting.",
  "Demos booked": "How many first sales meetings got scheduled this month.",
  "Demo held rate": "Share of booked demos that actually happened.",
  "Pipeline created": "Value of new opportunities opened this month.",
  "Joint booked ARR": "ARR closed this month where marketing and sales both touched the deal.",
  "Booked ARR – no inbound": "ARR closed this month with no inbound touch at all.",
  "New ARR": "ARR from customers who signed for the first time this month.",
  "Demos held": "How many first sales meetings actually happened this month.",
  "Win rate from held demo": "Share of held demos that turned into a signed deal.",
  "New logos": "How many new customers signed this month.",
  "New logo avg ARR": "Average yearly value of a new customer signed this month.",
  "TTV: first contract": "Days from signing to a customer's first contract in Felix. Lower is better.",
  "Felix activations": "Accounts that switched Felix on this month.",
  "TTV: 10 handoffs": "Days from activation to a customer's tenth Felix handoff. Lower is better.",
  "Time post-activation": "Average days an account has been live since activation.",
  "Cohort at first contract": "Share of this month's new customers who reached a first contract.",
  "GRR": "Of the revenue we had from existing customers a year ago, how much we kept, ignoring growth.",
  "Healthy ARR": "Share of ARR from accounts scored healthy.",
  "At-risk ARR": "ARR from accounts flagged at risk of churning. Lower is better.",
  "Downgrade + churn": "ARR lost this month to downgrades and cancellations. Lower is better.",
  "Expansion leads": "Existing customers flagged as ready to buy more.",
  "Expansion ARR": "New ARR from existing customers buying more this month.",
  "Deals created": "Expansion opportunities opened this month.",
  "SQL → SQO": "Share of sales-qualified leads that became qualified opportunities.",
  "Win rate": "Share of expansion deals that closed as won.",
  "Avg expansion ARR": "Average value of an expansion deal closed this month.",
  "Felix handoffs per 1K": "Felix handoffs for every thousand active contacts.",
  "Daily active users": "People using the product on an average day this month.",
  "Active accounts": "Share of paying accounts active this month.",
  "Fello health": "Composite product health score for Fello.",
  "Felix health": "Composite product health score for Felix.",
};
const KNOWN = { "Inbound|Demos booked": [273, 270, 268, 383, 312, 342], "New Business|New logos": [77, 91, 63, 78, 77, 55] };
export function parseVal(v) {
  if (!v || v === "—") return null;
  const m = v.match(/^(\$?)([\d,]+(?:\.\d+)?)([MK%dx]?)$/); if (!m) return null;
  const [, pre, num, suf] = m, dec = (num.split(".")[1] || "").length, n = parseFloat(num.replace(/,/g, ""));
  const fmt = (x) => (x === 0 ? (pre ? "$0" : "0") + (pre ? "" : suf) : pre && suf === "K" && x >= 1000 ? `$${(x / 1000).toFixed(2)}M` : pre && suf === "M" && x < 1 ? `$${Math.round(x * 1000)}K` : pre + (dec ? x.toFixed(dec) : Math.round(x).toLocaleString("en-US")) + suf);
  const ax = (x) => (x === 0 ? (pre ? "$0" : "0") : pre && suf === "K" && x >= 1000 ? `$${+(x / 1000).toFixed(2)}M` : pre + (+x.toFixed(2)).toLocaleString("en-US") + suf);
  return { n, fmt, ax, suf, pct: suf === "%" || suf === "d" };
}
const seeded = (str) => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; };
const nice = (raw) => { const mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag; return (f > 5 ? 10 : f > 2.5 ? 5 : f > 2 ? 2.5 : f > 1 ? 2 : 1) * mag; };
export function metricFor(r, c) {
  const [lane, dept, , tiles] = LANES[r], [n, v, p, s, foot, mark] = tiles[c];
  const pv = parseVal(v), st = status(p);
  const fm = foot.match(/^(pace|target|ceiling)\s+(\$?[\d,.]+[MK%dx]?)/), kind = fm ? fm[1] : null, fnum = fm ? parseVal(fm[2]) : null;
  const conv = fnum && pv ? (fnum.suf === "M" && pv.suf === "K" ? 1000 : fnum.suf === "K" && pv.suf === "M" ? 0.001 : 1) : 1;
  const tgt = fnum ? (kind === "pace" && mark ? fnum.n * conv / mark : fnum.n * conv) : null;
  let series = null;
  if (pv) {
    const rnd = seeded(lane + n), base = tgt || pv.n;
    const vals = KNOWN[`${lane}|${n}`] || [0, 1, 2, 3, 4, 5].map((i) => (i === 5 ? pv.n : base * (0.82 + 0.3 * rnd())));
    const all = [...vals, ...(tgt ? [tgt] : [])];
    if (pv.pct) {
      const lo0 = Math.min(...all), hi0 = Math.max(...all), stp = nice((hi0 - lo0 || hi0 * 0.2) / 2.5);
      const lo = Math.floor((lo0 - stp * 0.4) / stp) * stp, hi = Math.ceil((hi0 + stp * 0.4) / stp) * stp;
      series = { line: true, vals, lo, hi, ticks: Array.from({ length: Math.round((hi - lo) / stp) + 1 }, (_, i) => +(lo + i * stp).toFixed(4)).filter((t) => t > lo), fmt: pv.ax, valFmt: pv.fmt, unit: pv.fmt(1).replace(/[\d.,$]/g, "") === "%" ? "pts" : "days" };
    } else {
      const stp = nice((Math.max(...all) * 1.12) / 3), hi = Math.ceil((Math.max(...all) * 1.12) / stp) * stp;
      series = { vals, lo: 0, hi, ticks: Array.from({ length: Math.round(hi / stp) + 1 }, (_, i) => +(i * stp).toFixed(4)), fmt: pv.ax, valFmt: pv.fmt };
    }
  }
  const openFoot = kind === "pace" && mark ? `October to date · pace ${fm[2]} of the ${pv.fmt(tgt)} target` : kind ? `October to date · ${kind} ${fm[2]}` : `October to date · ${foot.toLowerCase()}`;
  return { lane, dept, n, v, p, s, st, foot, kind, tgt, pv, series, mark, owner: OWNERS[lane], desc: DESC[n] || "", openFoot, tiles, c, r };
}
export const askFor = (m) => {
  const name = m.n.includes(m.lane) ? m.n : `${m.lane} ${/^[A-Z][a-z]/.test(m.n) ? m.n[0].toLowerCase() + m.n.slice(1) : m.n}`;
  if (m.st === "none") return `What would it take to start tracking ${name}?`;
  if (m.st === "on") return `What’s driving ${name} this month?`;
  return /over|under/.test(m.s) ? `Why is ${name} ${m.s} its ${m.kind}?` : `Why is ${name} ${m.st === "off" ? "off plan" : "behind"} at ${m.s} of ${m.kind}?`;
};
export function chartFor(m, lens, cp) {
  const S = m.series, col = C.navyFill;
  const better = m.kind === "ceiling" || /churn|At-risk|TTV|Time post/.test(m.n) ? "down" : "up";
  const chart = !S ? null : lens === "pace"
    ? <PaceLine p={cp} color={col} start={0} tgt={m.tgt} now={m.pv.n} lo={0} hi={S.hi} ticks={S.ticks} fmt={S.fmt} wob={S.hi * 0.012} />
    : S.line ? <MonthlyLine p={cp} color={col} vals={S.vals} lo={S.lo} hi={S.hi} ticks={S.ticks} tgt={m.tgt ?? S.vals[5]} tLabel={m.tgt != null ? `${m.kind === "ceiling" ? "Ceiling" : "Target"} ${m.pv.fmt(m.tgt)}` : ""} fmt={S.fmt} valFmt={S.valFmt} unit={S.unit} better={better} />
    : <MonthlyBars p={cp} color={col} vals={S.vals} lo={S.lo} hi={S.hi} ticks={S.ticks} fmt={S.fmt} tgt={m.tgt ?? S.vals[5]} tLabel={m.tgt != null ? `${m.kind === "pace" && !m.mark ? "Pace" : "Target"} ${m.pv.fmt(m.tgt)}` : ""} valFmt={S.valFmt} better={better} />;
  const key = !S ? null : lens === "pace" ? [["Actual", "line"], ["Pace to target", "pace"]] : S.line ? [[m.n, "line"], ...(m.tgt != null ? [[m.kind === "ceiling" ? "Ceiling" : "Target", "dot"]] : [])] : [["Month end", "sw"], ["Month to date", "mtd"], ...(m.tgt != null ? [["Target", "dot"]] : [])];
  const mk = (k) => k === "sw" ? <i className="grain" style={{ background: col }} /> : k === "mtd" ? <i className="grain" style={{ background: MTD }} /> : k === "line" ? <i className="ln" style={{ background: col }} /> : k === "pace" ? <i className="ln" style={{ background: C.coral }} /> : <i className="dt" />;
  return { chart, key, mk };
}
export const lensesFor = (m) => (m.series ? (m.kind === "pace" && !m.series.line ? [["monthly", "Monthly"], ["pace", "Pace"]] : [["monthly", "Monthly"]]) : []);
function HeatOpen({ r, c, W, M, onClose, go }) {
  const m = useMemo(() => metricFor(r, c), [r, c]);
  const h = heat(m.p, M.health.heat, M.health.heatPalette);
  const lenses = lensesFor(m);
  const [lens, setLens] = useState("monthly");
  const [tip, setTip] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    const d = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest('[class*="dialkit"]')) onClose(); };
    window.addEventListener("keydown", k); document.addEventListener("pointerdown", d);
    return () => { window.removeEventListener("keydown", k); document.removeEventListener("pointerdown", d); };
  }, []);
  // 4 squares wide × 4 rows tall, pinned to the clicked square's corner: grows right/down, or left/up when there isn't room
  const CW = W / NCOL, NW = 5, NH = 4;
  const col0 = Math.max(0, Math.min(r, NCOL - NW)), row0 = Math.max(0, Math.min(c, NROW - NH)); // always inside the grid; the clicked square stays under the card
  const cell = { left: r * CW - 0.5, top: HH + (c === NROW - 1 ? c - 1 : c) * RH, width: CW + 1, height: RH * 2 };
  const full = { left: col0 * CW - 0.5, top: HH + row0 * RH, width: NW * CW + 1, height: NH * RH };
  const RIGHT = 340, leftW = full.width - 2.18 - RIGHT, G = geo(Math.round(leftW - 28 - 20), 142);
  const Tx = toMotion(M.health.squareOpen), Tc = toMotion(M.health.squareClose);
  const inT = { ...toMotion(M.open.content), delay: M.health.squareDelay };
  const cp = useReplay(m.n + lens, M.open.draw, { delay: lens === "monthly" ? M.health.squareDelay : 0.05, reduced: REDUCED });
  const item = { hidden: { opacity: 0, y: 6, filter: "blur(3px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } };
  const out = { opacity: 0, transition: { duration: 0.1 } };
  const { chart, key, mk } = chartFor(m, lens, cp);
  const S = m.series;
  return (
    <motion.div ref={ref} className="mtile is-open hx" role="dialog" aria-label={m.n} initial={cell} animate={{ ...full, opacity: 1 }}
      exit={{ ...cell, height: RH, opacity: 0, transition: { default: Tc, opacity: { duration: 0.18, delay: 0.16 } } }} transition={Tx} style={{ zIndex: 8 }}>
      <motion.div className="mt-clip" style={{ "--ink-c": h.ink, "--sub-c": h.sub }} initial={{ borderRadius: 0, padding: 0, backgroundColor: h.solid || h.bg }} animate={{ borderRadius: 0, padding: M.health.frame, backgroundColor: C.well }} exit={{ borderRadius: 0, padding: 0, backgroundColor: h.solid || h.bg }} transition={{ default: Tx, backgroundColor: { duration: 0.3 } }}>
        <motion.div className="mt-body" initial={{ backgroundColor: h.solid || h.bg, borderRadius: 0 }} animate={{ backgroundColor: C.paper, borderRadius: 0 }} exit={{ backgroundColor: h.solid || h.bg, borderRadius: 0 }} transition={{ default: Tx, backgroundColor: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } }}>
          <div className="mt-inner hx-inner" style={{ width: full.width - 2.18, gridTemplateColumns: `minmax(0, 1fr) ${RIGHT}px` }}>
            <motion.div className="mo-l" initial={{ paddingTop: 18, paddingLeft: 14 }} animate={{ paddingTop: 20, paddingLeft: 28 }} exit={{ paddingTop: 18, paddingLeft: 14 }} transition={Tx}>
              <motion.span className="mo-lab hx-lab" initial={{ fontSize: 13, lineHeight: "16px", textDecorationColor: "rgba(84,84,84,0)" }} animate={{ fontSize: 20, lineHeight: "26px", textDecorationColor: "rgba(84,84,84,1)" }} exit={{ fontSize: 13, lineHeight: "16px", textDecorationColor: "rgba(84,84,84,0)" }} transition={Tx}
                onPointerEnter={() => setTip(true)} onPointerLeave={() => setTip(false)}>{m.n}</motion.span>
              <motion.span className="mo-v" style={{ color: m.v === "—" ? C.mute : C.navy }} initial={{ fontSize: 24, lineHeight: "29px", marginTop: 18 }} animate={{ fontSize: 52, lineHeight: "56px", marginTop: 20 }} exit={{ fontSize: 24, lineHeight: "29px", marginTop: 18 }} transition={Tx}>{m.v}</motion.span>
              <motion.div className="mo-chart" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={out} transition={inT}>
                {S ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={lens} className="mo-lens" initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6, filter: "blur(3px)" }} transition={toMotion(M.open.lens)}>
                      <GeoCtx.Provider value={G}>{chart}</GeoCtx.Provider>
                      <div className="mo-key">{key.map(([t, k]) => <span key={t}>{mk(k)}{t}</span>)}</div>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="hx-empty"><b>No data connection yet</b><span>Connect the source to start tracking this metric.</span></div>
                )}
              </motion.div>
            </motion.div>
            {lenses.length > 1 && (
              <motion.div className="mt-seg" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={out} transition={inT} style={{ right: RIGHT + 20 }}>
                <FSegSmall value={lens} onChange={setLens} options={lenses} M={M} id={`hx-${r}-${c}`} />
              </motion.div>
            )}
            <motion.div className="mo-r" initial="hidden" animate="show" exit={out} variants={{ show: { transition: { delayChildren: M.health.squareDelay + 0.03, staggerChildren: M.open.stagger * 0.75 } } }}>
              <motion.div className="mo-tools" variants={item} transition={toMotion(M.open.content)}>
                <span>{m.lane === m.dept ? m.lane : `${m.lane} · ${m.dept}`} · owned by {m.owner}</span>
                <AskChartIcon />
                {m.series && <PinIcon id={`${r}-${c}`} />}
                <button className="ibtn mo-x" aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }}><svg width="14" height="14" viewBox="0 0 14 14" stroke={C.navy} strokeWidth="1.25" strokeLinecap="round"><path d="M3 3l8 8M11 3 3 11" /></svg></button>
              </motion.div>
              <div className="mo-movers">
                <motion.h5 variants={item} transition={toMotion(M.open.content)}>Rest of the {m.lane} lane</motion.h5>
                {m.tiles.filter((_, i) => i !== m.c).map(([tn, tv, tp, ts]) => { const st = status(tp); return (
                  <motion.div className="mo-mv" key={tn} variants={item} transition={toMotion(M.open.content)}>
                    <i style={{ background: SC[st] }} /><b>{tn}</b><span /><em style={{ color: st === "on" ? C.navy : TXT[st] }}>{tv}</em><small className="hx-pct" style={{ color: TXT[st] }}>{st === "on" ? ts : ts}</small>
                  </motion.div>); })}
              </div>
              <div className="mo-fill" />
              <motion.div className="mo-acts" variants={item} transition={toMotion(M.open.content)}>
                <AskButton q={askFor(m)} label="Ask North" />
                <motion.button className="btn-sec" whileTap={{ scale: 0.97 }} transition={toMotion(M.hover.press)} onClick={() => go("metric", r, c)}>Open full view</motion.button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
        <AnimatePresence>
          {tip && <motion.span className="mo-tip hx-tip" initial={{ opacity: 0, y: 4, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }} transition={toMotion(M.tip)}>{m.desc}</motion.span>}
        </AnimatePresence>
        <motion.div className="mt-foot hx-foot" initial={{ height: 33.5, paddingLeft: 14, paddingRight: 14, fontSize: 13.12, backgroundColor: h.solid || h.bg, color: h.ink }} animate={{ height: 43, paddingLeft: 26, paddingRight: 26, fontSize: 16, backgroundColor: h.solid || h.bg, color: h.ink }} exit={{ height: 33.5, paddingLeft: 14, paddingRight: 14, fontSize: 13.12, backgroundColor: h.solid || h.bg, color: h.ink }} transition={{ default: Tx, backgroundColor: { duration: 0.3 }, color: { duration: 0.3 } }}>
          <span>{m.openFoot}</span>
          <b>{m.s}</b>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
export function FSegSmall({ value, onChange, options, M, id }) {
  return (
    <div className="seg seg-sm" role="tablist">
      {options.map(([v, label]) => (
        <button key={v} role="tab" aria-selected={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>
          {value === v && <motion.span layoutId={`seg-${id}`} className="seg-pill" transition={toMotion(M.select.pill)} />}
          <span className="seg-t">{label}</span>
        </button>
      ))}
    </div>
  );
}


// ------------------------------------------------------------------ what to talk about: a ranked agenda of the misses.
// One card, list rows like the home board; each row carries its pace bar and says the gap in plain words.
// Clicking a row opens that same square in the heatmap above — one way in, one place to read it.
export const TALK = [
  { r: 1, c: 0, src: "HubSpot", gap: "$443.6K short of pace", ctx: "$130.2K vs $573.8K pace" },
  { r: 5, c: 3, src: "GTMDB", gap: "28.1 pts under target", ctx: "31.9% vs 60% target" },
  { r: 5, c: 0, src: "Looker", gap: "$280K short of pace", ctx: "$734K vs $1.01M pace" },
  { r: 3, c: 2, src: "Fello data lake", gap: "5.9 days over ceiling", ctx: "20.9d vs 15.0d ceiling" },
  { r: 2, c: 3, src: "HubSpot", gap: "18 short of pace", ctx: "55 vs 73 pace" },
];
// hover grows sideways out of the cursor, like the sidebar rows
export function GrowHover({ o, t }) {
  const [f] = useState(() => ({ ...o }));
  const seed = 24, l = clamp(f.x - seed / 2, 0, f.w - seed), r = f.w - l - seed;
  return (
    <motion.span className="talk-hov" initial={{ left: l, right: r, top: 8, bottom: 8, opacity: 0 }} animate={{ left: 0, right: 0, top: 0, bottom: 0, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }} transition={{ default: toMotion(t), opacity: { duration: 0.2 } }} />
  );
}
// one agenda row: what missed, where it lives, the pace bar, the gap in plain words
export function TalkRow({ t, g = 1, hov, onEnter, onClick, at, M, synced }) {
  const [lane, dept, , tiles] = LANES[t.r], [n, v, p, s, , mark] = tiles[t.c], st = status(p);
  return (
    <button className="talk-row" onClick={onClick}
      onPointerEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; onEnter(); }}>
      <AnimatePresence>{hov && <GrowHover key="h" o={at.current} t={M.hover.glide} />}</AnimatePresence>
      <span className="talk-l"><b>{n}{synced && <em className="talk-sync">On Monday sync</em>}</b><small>{lane}{lane !== dept ? ` · ${dept}` : ""} · {OWNERS[lane]} · {t.src}</small></span>
      <span className="talk-bar" aria-hidden="true">
        <i className="grain" style={{ width: `${Math.min(1, p / 100) * 100 * g}%`, background: SC[st] }} />
        {[25, 50, 75].map((x) => <u key={x} style={{ left: `${x}%` }} />)}
        {mark && <em style={{ left: `${mark * 100}%`, background: SC[st], transform: `translateX(-50%) scale(${win(g, 0.85, 1)})` }} />}
      </span>
      <span className="talk-r"><b style={{ color: TXT[st] }}>{t.gap}</b><small>{t.ctx}</small></span>
      <span className="talk-go"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6.3 4.5 9.8 8l-3.5 3.5" fill="none" stroke={C.navy} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg></span>
    </button>
  );
}
function Talk({ M, P, go, link, setLink = () => {} }) {
  const { E } = M.ctx;
  const { sync: syncSet } = useActions();
  const [hov, setHov] = useState(null);
  const at = useRef({ x: 100, w: 1000 });
  return (
    <section className="talk" aria-labelledby="talk-h">
      <div className="ch-sec-h"><h3 id="talk-h">What to pay attention to</h3><SyncAllButton ids={TALK.map((t) => `${t.r}-${t.c}`)} /></div>
      <div className="card talk-card">
        <div className={`surface talk-list${link && link.from === "hm" && TALK.some((t) => t.r === link.r && (link.c == null || t.c === link.c)) ? " is-linking" : ""}`} role="list" onPointerLeave={() => { setHov(null); setLink(null); }}>
          {TALK.map((t, i) => {
            const q = SETTLE(stag(P.talk, i, TALK.length, 0.45)), g = E(stag(win(P.talk, 0.2, 1), i, TALK.length, 0.45));
            return (
              <motion.div role="listitem" key={t.r + "-" + t.c} className={`talk-item${i ? " has-rule" : ""}${link && link.from === "hm" && t.r === link.r && (link.c == null || t.c === link.c) ? " is-lit" : ""}`} style={{ opacity: Math.min(1, q * 1.4), y: 6 * (1 - q) }}>
                <TalkRow t={t} g={g} M={M} at={at} synced={syncSet && syncSet.has(`${t.r}-${t.c}`)} hov={hov === i} onEnter={() => { setHov(i); setLink({ r: t.r, c: t.c, from: "talk" }); }} onClick={() => go("metric", t.r, t.c)} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// page filters; once they slide under the top bar a copy fades into it (same as the home ask bar)
export function PageFilters({ M, scrollRef, style }) {
  const [seg, setSeg] = useState("All");
  const [period, setPeriod] = useState("Monthly");
  const fRef = useRef(null);
  const [inNav, setInNav] = useState(false);
  const [slot, setSlot] = useState(null);
  useEffect(() => { setSlot(document.getElementById("topbar-dock")); }, []);
  useEffect(() => {
    const s = scrollRef.current; if (!s) return;
    const on = () => { const f = fRef.current; if (!f) return; const r = f.getBoundingClientRect(), edge = s.getBoundingClientRect().top;
      const q = clamp((edge - r.top) / r.height); setInNav((v) => (v ? q > 0.35 : q > 0.55)); };
    on(); s.addEventListener("scroll", on, { passive: true });
    return () => s.removeEventListener("scroll", on);
  }, []);
  // tell the top bar the filters have moved in, so the breadcrumb steps aside for them
  useEffect(() => { const tb = document.querySelector(".topbar"); if (tb) tb.toggleAttribute("data-docked", inNav); }, [inNav]);
  useEffect(() => () => { const tb = document.querySelector(".topbar"); if (tb) tb.removeAttribute("data-docked"); }, []);
  const filters = (dock) => (
    <>
      <div className="ch-f-l">
        <FSeg value={seg} onChange={setSeg} options={["All", "Medium+", "Ind & Small"]} M={M} id={`seg${dock ? "-d" : ""}`} />
        <Pick label="Team size" value="Any" />
        <Pick label="Felix" value="All accounts" />
      </div>
      <div className="ch-f-r">
        <Pick label="Month" value="October · live" />
        <FSeg value={period} onChange={setPeriod} options={["Weekly", "Monthly", "Quarterly", "Yearly"]} M={M} id={`period${dock ? "-d" : ""}`} />
      </div>
    </>
  );
  return (
    <>
      <div className="ch-filters" ref={fRef} style={style}>{filters(false)}</div>
      {slot && createPortal(
        <motion.div className="ch-dock" aria-hidden={!inNav} initial={false}
          animate={inNav ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 3, filter: "blur(2px)" }}
          transition={toMotion(M.health.dock)} style={{ pointerEvents: inNav ? "auto" : "none" }}>{filters(true)}</motion.div>, slot)}
    </>
  );
}
// breadcrumb lives in the top bar; it gives way to the docked filters once you scroll
export function TopCrumbs({ M, items, right }) {
  const [slot, setSlot] = useState(null);
  useEffect(() => { setSlot(document.getElementById("topbar-crumbs")); }, []);
  if (!slot) return null;
  return createPortal(
    <motion.nav className="tb-crumbs" aria-label="Breadcrumb" initial={{ opacity: 0, y: -3, filter: "blur(2px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={toMotion(M.health.dock)}
      style={{ "--dock-t": `${M.health.dock.duration ?? 0.28}s` }}>
      {items.map(([label, fn], i) => (
        <React.Fragment key={label}>
          {i > 0 && <span className="tb-sep">/</span>}
          {fn ? <button onClick={fn}>{label}</button> : <b aria-current="page">{label}</b>}
        </React.Fragment>
      ))}
      {right && <span className="tb-right">{right}</span>}
    </motion.nav>, slot);
}
// North's read of the page, worked out from the lanes: how many are behind, which department holds them, and the worst one
// North's read: which lanes are behind, how much of that is Sales ARR this month, and what it means for the year.
// Sales ARR shortfall = the three Sales ARR metrics' distance to pace this month (prototype data; confirm with real numbers).
const SALES_ARR_SHORT = [["Booked ARR – Outbound", 443.6], ["Expansion ARR", 280], ["New ARR", 140]];
function NorthLine({ go }) {
  const behind = LANES.map((l, r) => [l, r]).filter(([l]) => l[2] < 85);
  const sales = behind.filter(([l]) => l[1] === "Sales");
  const [wl, wr] = behind.slice().sort((a, b) => a[0][2] - b[0][2])[0];
  const short = SALES_ARR_SHORT.reduce((t, [, k]) => t + k, 0);
  return (
    <p className="ch-north">
      <NorthLogo size={18} live className="ch-north-mark" />
      <span>{behind.length} of {LANES.length} lanes are behind, {sales.length} in Sales. Sales is ${Math.round(short)}K short on ARR this month, most of the ${(YE.plan - YE.proj).toFixed(2)}M we’d miss by year-end.{" "}
        <button className="ch-north-go" onClick={() => go(wl[1], wr, 0)}>Start with {wl[0]}<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h8M7.8 3.8 11 7l-3.2 3.2" /></svg></button></span>
    </p>
  );
}
// ------------------------------------------------------------------ page
export function CompanyHealth({ M, scrollRef, replay, Tile, metrics, go = () => {} }) {
  const { E } = M.ctx;
  const P0 = useReplay(`ch-${replay}`, M.health.intro, { reduced: REDUCED });
  const flowLen = M.health.flowSpread + Math.max(0, M.health.headLag) + Math.max(M.health.tileFade.duration, M.health.barWait + M.health.headBar.duration);
  const PF = useReplay(`chf-${replay}-${M.health.flowSpread}-${M.health.flowDelay}-${M.health.headLag}-${JSON.stringify(M.health.headBar)}-${M.health.barWait}-${JSON.stringify(M.health.tileFade)}`, { type: "easing", duration: flowLen, ease: [0, 0, 1, 1] }, { reduced: REDUCED, delay: M.health.flowDelay }) * flowLen; // the heatmap's own clock: one wave out from the centre
  const P = {
    head: win(P0, 0, 0.32), bars: E(win(P0, 0.12, 0.55)), filters: win(P0, 0.1, 0.4),
    cards: win(P0, 0.42, 0.86), draw: win(P0, 0.52, 0.98), ye: win(P0, 0.46, 1), rows: win(P0, 0.12, 0.62), rings: win(P0, 0.16, 0.68), cells: PF, talk: win(P0, 0.6, 1), // heatmap first, then the scoreboard
  };
  const [openSq, setOpenSq] = useState(null);
  const [link, setLink] = useState(null); // { r, c?, from: "hm" | "talk" }
  const drop = (t) => ({ opacity: t, y: -12 * (1 - t), filter: t < 1 ? `blur(${8 * (1 - t)}px)` : "none" });
  return (
    <div className="ch ch-co">
      <motion.header className="ch-head" style={drop(SETTLE(P.head))}>
        <div className="ch-score">
          <span className="ch-96">96</span>
          <h1>Company health</h1>
        </div>
        <NorthLine go={go} />
      </motion.header>

      <PageFilters M={M} scrollRef={scrollRef} style={{ opacity: P.filters }} />


      {/* the heatmap leads: the scoreboard's numbers are already on Home */}
      <section aria-labelledby="hm-t" className="ch-hm" id="hm-h">
        <div className="ch-sec-h"><h3 id="hm-t">Department heatmap</h3><HeatKey strength={M.health.heat} pal={M.health.heatPalette} /></div>
        <Heatmap M={M} P={P} open={openSq} setOpen={setOpenSq} go={go} link={link} setLink={setLink} />
      </section>
      <section aria-labelledby="sb-h" className="ch-sb">
        <div className="ch-sec-h"><h3 id="sb-h">Company scoreboard</h3><span className="ch-pin-hint">☆ pins a chart to Home</span></div>
        <ScoreMetrics Tile={Tile} metrics={metrics} M={M} P={P} E={E} />
      </section>
      <Talk M={M} P={P} go={go} link={link} setLink={setLink} />
    </div>
  );
}
