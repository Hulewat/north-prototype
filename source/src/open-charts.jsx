// Charts for an opened key metric. One grammar for every lens (from the Figma lens grid, 650:1350):
// 641-wide plot, $ axis at x 44, baseline at 168, metric colour carried from its card,
// target = dotted salmon line ending in a small salmon dot, October = lighter (month to date).
import React, { createContext, useContext, useState } from "react";
import { MotionCtx, TipBody } from "./visuals.jsx";
import { motion, AnimatePresence } from "motion/react";
import { toMotion } from "./lib.js";
import { C, clamp, lerp, stag, win, bezier, useGraceHover } from "./lib.js";

export const CW = 641, CH = 190;
// geometry travels by context so the same charts can draw at another size (e.g. inside an opened heatmap square)
export const geo = (cw = 641, ch = 190) => { const x0 = 44, pitch = (cw - x0) / 6; return { CW: cw, CH: ch, x0, top: 20, base: ch - 22, pitch, MX: (i) => x0 + pitch * i + pitch / 2, bw: Math.min(44, pitch * 0.62) }; };
export const GeoCtx = createContext(geo());
const x0 = 44, top = 20, base = 168;
const SWEEP = bezier([0.5, 0, 0.2, 1]);
const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
const pitch = (CW - x0) / 6, MX = (i) => x0 + pitch * i + pitch / 2;

// month-over-month: green when it moved the good way, red when it moved the bad way (lower-is-better metrics flip)
const UP = "#257985", DOWN = "#9b1b5a";
const moveColor = (d, better) => (d === 0 ? undefined : (d > 0) === (better !== "down") ? UP : DOWN);
export const mix = (a, b, t) => "#" + [1, 3, 5].map((i) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - t) + parseInt(b.slice(i, i + 2), 16) * t).toString(16).padStart(2, "0")).join("");

function Axis({ ticks, Y, fmt, b0, p }) {
  const { CW, CH, x0, top, base, pitch, MX, bw } = useContext(GeoCtx);
  return ticks.map((v, i) => (
    <g key={v} opacity={stag(win(p, 0, 0.3), i, ticks.length, 0.5)}>
      <line x1={x0} x2={CW} y1={Y(v) + 0.25} y2={Y(v) + 0.25} stroke={v === b0 ? "#c9c4bf" : C.line} strokeWidth={v === b0 ? 1 : 0.5} />
      <text x={x0 - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fontWeight="500" fill={C.mute}>{fmt(v)}</text>
    </g>
  ));
}
// small hover card for dots, drawn in the chart itself so it sits right against the mark it explains
export function DotTip({ x, y, title, sub, show, align = "end" }) {
  const { CW, CH, x0, top, base, pitch, MX, bw } = useContext(GeoCtx);
  const w = Math.max(title.length, sub ? sub.length : 0) * 6.1 + 22, h = sub ? 42 : 26;
  const bx = align === "end" ? x - w + 12 : align === "start" ? x - 12 : x - w / 2;
  return (
    <g pointerEvents="none" style={{ opacity: show ? 1 : 0, transform: `translateY(${show ? 0 : 4}px)`, transition: "opacity .18s, transform .25s cubic-bezier(.22,1,.36,1)" }}>
      <rect x={bx} y={y - h - 12} width={w} height={h} rx="6" fill={C.paper} stroke={C.edge} strokeWidth="0.5" />
      <path d={`M${x - 5} ${y - 12.3}l5 5 5-5`} fill={C.paper} stroke={C.edge} strokeWidth="0.5" />
      <rect x={x - 5.5} y={y - 13} width="11" height="1.2" fill={C.paper} />
      <text x={bx + 11} y={y - h - 12 + 17} fontSize="12" fontWeight="600" fill={C.navy}>{title}</text>
      {sub && <text x={bx + 11} y={y - h - 12 + 33} fontSize="11" fill={C.ink}>{sub}</text>}
    </g>
  );
}
// dotted target drawn left → right, then its dot lands; hovering the dot says what it is
function Target({ y, label, p, sub }) {
  const { CW, CH, x0, top, base, pitch, MX, bw } = useContext(GeoCtx);
  const d = win(p, 0.5, 0.85), dot = win(p, 0.8, 1);
  const [h, setH] = useState(false);
  return (
    <g>
      <line x1={x0} x2={lerp(x0, CW - 4, d)} y1={y} y2={y} stroke={C.coral} strokeWidth="1" strokeDasharray="0.1 2.6" strokeLinecap="round" />
      <circle cx={CW - 3} cy={y} r={(h ? 4.5 : 3) * dot} fill={C.coral} style={{ transition: "r .2s" }} />
      <circle cx={CW - 3} cy={y} r="10" fill="transparent" onPointerEnter={() => setH(true)} onPointerLeave={() => setH(false)} style={{ cursor: "default" }} />
      <DotTip x={CW - 3} y={y} title={label} sub={sub || "Where this month needs to land"} show={h} />
      <text x={CW} y={y - 9} textAnchor="end" fontSize="11" fontWeight="600" fill={C.coral} opacity={dot}>{label}</text>
    </g>
  );
}
const Months = ({ p, labels = MONTHS, hov }) => { const { MX, base } = useContext(GeoCtx); return labels.map((m, i) => (
  <text key={m} x={MX(i)} y={base + 15} textAnchor="middle" fontSize="11" fontWeight={i === 5 || hov === i ? 600 : 400} fill={i === 5 || hov === i ? C.navy : "#535353"} opacity={win(p, 0, 0.3)} style={{ transition: "fill .2s" }}>{m}</text>
)); };
const topBar = (x, y, w, h, r = 3) => { r = Math.min(r, h, w / 2); return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`; };

// ---------- hover for bar charts — same as ARR movement: hovered month stays, the rest dim, a tooltip rises from the bar
// only on the mark itself: a bar (a little slack around it), or a line point and the striped fill under it — never the empty space above
function useColumnHover(topOf, line = false) {
  const { CW, CH, x0, top, base, pitch, MX, bw } = useContext(GeoCtx);
  const [hov, setHov] = useGraceHover(180);
  const onMove = (e) => {
    const r = (e.currentTarget.querySelector("svg") || e.currentTarget).getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * CW, y = ((e.clientY - r.top) / r.height) * CH;
    const i = Math.floor((x - x0) / pitch);
    if (!(i >= 0 && i < 6)) { setHov(null); return; }
    const t = topOf ? topOf(i) : top, onX = true; // whole column across, so moving bar to bar never drops out in the gap
    setHov(onX && y >= t - (line ? 16 : 10) && y <= base + 2 ? i : null);
  };
  return [hov, onMove, () => setHov(null), setHov];
}
// tooltips sit just above the hovered bar and glide between months (no jump), so they always read as attached to their bar. The first and last columns align to their outer edge so nothing spills out.
function ColumnTip({ i, y, tip, hold }) {
  const { CW, CH, x0, top, base, pitch, MX, bw } = useContext(GeoCtx);
  const { D } = useContext(MotionCtx);
  const first = i === 0, last = i === 5, compact = CH < 200; // small charts (an opened heatmap square) get a one-line tip that fits the headroom
  const left = i == null ? 0 : first ? MX(i) - bw / 2 : last ? MX(i) + bw / 2 : MX(i);
  const ax = first ? "0%" : last ? "-100%" : "-50%", ox = first ? "0%" : last ? "100%" : "50%";
  return (
    <AnimatePresence>
      {i != null && (
        <motion.div className={`tip tip-level${compact ? " tip-compact" : ""}`} key="ctip" onPointerEnter={() => hold && hold(i)} onPointerLeave={() => hold && hold(null)} initial={{ opacity: 0, scale: 0.94, y: 4, left: `${(left / CW) * 100}%`, top: `${(y / CH) * 100}%` }}
          animate={{ opacity: 1, scale: 1, y: 0, left: `${(left / CW) * 100}%`, top: `${(y / CH) * 100}%` }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
          transition={{ ...toMotion(D.tip), left: toMotion(D.tipFollow), top: toMotion(D.tipFollow) }}
          style={{ x: ax, translate: "0 calc(-100% - 8px)", transformOrigin: `${ox} 100%` }}>
          {compact
            ? <span className="tip-c"><em>{tip.eyebrow}</em><b>{tip.title}</b>{tip.rows && tip.rows.length > 0 && <span>{tip.rows[tip.rows.length - 1].k} {tip.rows[tip.rows.length - 1].v}</span>}</span>
            : <TipBody id={i} eyebrow={tip.eyebrow} title={tip.title} rows={tip.rows} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------- Monthly · bars (Total ARR, Felix ARR, Net new ARR)
export function MonthlyBars({ p, vals, lo, hi, ticks, fmt = (v) => String(v), tgt, tLabel, color, valFmt = fmt, better }) {
  const { CW, CH, x0, top, base, pitch, MX, bw } = useContext(GeoCtx);
  const { E, spread } = useContext(MotionCtx);
  const [hov, onMove, onLeave, holdHov] = useColumnHover((i) => Y(vals[i]));
  const Y = (v) => base - ((v - lo) / (hi - lo)) * (base - top);
  const mtd = mix(color, "#ffffff", 0.45);
  const grid = ticks.filter((t) => t !== lo);
  return (
    <div className="mo-plot" onPointerMove={onMove} onPointerLeave={onLeave}>
    <svg viewBox={`0 0 ${CW} ${CH}`} className="mo-svg">
      <Axis ticks={ticks} Y={Y} fmt={fmt} b0={lo} p={p} />
      <g filter="url(#grain)">
        {vals.map((v, i) => {
          const g = E(stag(win(p, 0.05, 0.7), i, 6, spread));
          const h = (base - Y(v)) * g;
          return <path key={i} d={topBar(MX(i) - bw / 2, base - h, bw, h)} fill={i === 5 ? mtd : color} opacity={hov != null && hov !== i ? 0.45 : 1} style={{ transition: "opacity .25s" }} />;
        })}
      </g>
      {vals.map((v, i) => {
        const g = E(stag(win(p, 0.05, 0.7), i, 6, spread)), topY = base - (base - Y(v)) * g;
        return (
          <g key={i} pointerEvents="none" opacity={hov != null && hov !== i ? 0.45 : 1}>
            {grid.filter((t) => Y(t) > topY + 1).map((t) => <rect key={t} x={MX(i) - bw / 2} y={Y(t) - 0.375} width={bw} height="0.75" fill={C.paper} />)}
          </g>
        );
      })}
      <Target y={Y(tgt)} label={tLabel} p={p} />
      <Months p={p} hov={hov} />
    </svg>
    <ColumnTip hold={holdHov} i={hov} y={hov != null ? Y(vals[hov]) : 0} tip={hov == null ? {} : {
      eyebrow: hov === 5 ? <><i className="tip-sw" style={{ background: mtd }} />Oct · month to date</> : MONTHS[hov],
      title: valFmt(vals[hov]),
      rows: [...(hov > 0 ? [{ k: `vs ${MONTHS[hov - 1]}`, v: `${vals[hov] >= vals[hov - 1] ? "+" : "−"}${valFmt(Math.abs(vals[hov] - vals[hov - 1]))}`, vc: moveColor(vals[hov] - vals[hov - 1], better) }] : []), { k: vals[hov] >= tgt ? "Over target" : "To target", v: valFmt(Math.abs(tgt - vals[hov])) }],
    }} />
    </div>
  );
}

// ---------- Monthly · line on a zoomed axis (NRR) — Seth's striped line
export function MonthlyLine({ p, vals, lo, hi, ticks, tgt, tLabel, color, fmt = (v) => `${v}%`, valFmt = (v) => `${v.toFixed(1)}%`, unit = "pts", better }) {
  const { CW, CH, x0, top, base, pitch, MX, bw } = useContext(GeoCtx);
  const Y = (v) => base - ((v - lo) / (hi - lo)) * (base - top);
  const pts = vals.map((v, i) => [MX(i), Y(v)]);
  const s = SWEEP(win(p, 0.05, 0.8)), sx = lerp(pts[0][0], pts[5][0], s);
  const at = (x) => { let k = 1; while (k < 5 && pts[k][0] < x) k++; const [xa, ya] = pts[k - 1], [xb, yb] = pts[k]; return ya + ((yb - ya) * (x - xa)) / (xb - xa); };
  const stripes = []; for (let x = pts[0][0] + 2; x < pts[5][0]; x += 4) stripes.push(x);
  const [hov, onMove, onLeave, holdHov] = useColumnHover((i) => Y(vals[i]), true);
  return (
    <div className="mo-plot" onPointerMove={onMove} onPointerLeave={onLeave}>
    <svg viewBox={`0 0 ${CW} ${CH}`} className="mo-svg">
      <Axis ticks={ticks} Y={Y} fmt={fmt} p={p} />
      <line x1={x0} x2={CW} y1={base} y2={base} stroke="#c9c4bf" />
      <defs><clipPath id={`nrr-sweep-${CW}`}><rect x="0" y="0" width={sx} height={CH} /></clipPath></defs>
      <g clipPath={`url(#nrr-sweep-${CW})`}>
        {stripes.map((x) => <line key={x} x1={x} x2={x} y1={at(x)} y2={base} stroke={color} strokeOpacity="0.4" strokeWidth="0.5" />)}
        <path d={pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("")} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" />
      </g>
      {hov != null && <line x1={MX(hov)} x2={MX(hov)} y1={Y(vals[hov])} y2={base} stroke={color} strokeWidth="0.75" strokeDasharray="2 2" />}
      {pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={(hov === i ? 4.5 : i === 5 ? 3.5 : 2.5) * (s >= 1 ? 1 : clamp((sx - x + 2) / 6))} fill={color} style={{ transition: "r .2s" }} />)}
      <Target y={Y(tgt)} label={tLabel} p={p} />
      <Months p={p} hov={hov} />
    </svg>
    <ColumnTip hold={holdHov} i={hov} y={hov != null ? Y(vals[hov]) - 6 : 0} tip={hov == null ? {} : {
      eyebrow: hov === 5 ? "Oct · month to date" : MONTHS[hov], title: valFmt(vals[hov]),
      rows: [...(hov > 0 ? [{ k: `vs ${MONTHS[hov - 1]}`, v: `${vals[hov] >= vals[hov - 1] ? "+" : "−"}${Math.abs(vals[hov] - vals[hov - 1]).toFixed(1)} ${unit}`, vc: moveColor(vals[hov] - vals[hov - 1], better) }] : []), { k: vals[hov] >= tgt ? "Over target" : "To target", v: `${Math.abs(tgt - vals[hov]).toFixed(1)} ${unit}` }],
    }} />
    </div>
  );
}

// ---------- Pace this month — actual (metric colour, stripes) vs the straight pace line to the month's target
export function PaceLine({ p, start, tgt, now, lo, hi, ticks, fmt = (v) => String(v), color, wob = 0.03 }) {
  const { CW, CH, x0, top, base, pitch, MX, bw } = useContext(GeoCtx);
  const [hv, setHv] = useState(null);
  const Y = (v) => base - ((v - lo) / (hi - lo)) * (base - top);
  const DX = (d) => x0 + ((d - 1) / 30) * (CW - x0 - 6);
  const pts = []; for (let d = 1; d <= 27; d++) pts.push([DX(d), Y(start + ((now - start) * (d - 1)) / 26 + (d > 1 && d < 27 ? wob * Math.sin(d * 0.9) : 0))]);
  const s = SWEEP(win(p, 0.1, 0.85)), sx = lerp(pts[0][0], pts[26][0], s);
  const pace = SWEEP(win(p, 0.02, 0.7));
  const at = (x) => { let k = 1; while (k < 26 && pts[k][0] < x) k++; const [xa, ya] = pts[k - 1], [xb, yb] = pts[k]; return ya + ((yb - ya) * (x - xa)) / (xb - xa); };
  const stripes = []; for (let x = pts[0][0] + 2; x < pts[26][0]; x += 4) stripes.push(x);
  const dot = win(p, 0.82, 1), tdot = win(p, 0.66, 0.8);
  return (
    <svg viewBox={`0 0 ${CW} ${CH}`} className="mo-svg">
      <Axis ticks={ticks} Y={Y} fmt={fmt} p={p} />
      <line x1={x0} x2={CW} y1={base} y2={base} stroke="#c9c4bf" />
      <defs><clipPath id={`pace-sweep-${color.slice(1)}`}><rect x="0" y="0" width={sx} height={CH} /></clipPath></defs>
      <g clipPath={`url(#pace-sweep-${color.slice(1)})`}>
        {stripes.map((x) => <line key={x} x1={x} x2={x} y1={at(x)} y2={base} stroke={color} strokeOpacity="0.4" strokeWidth="0.5" />)}
        <path d={pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("")} fill="none" stroke={color} strokeWidth="1.75" strokeLinejoin="round" />
      </g>
      <line x1={DX(1)} y1={Y(start)} x2={lerp(DX(1), DX(31), pace)} y2={lerp(Y(start), Y(tgt), pace)} stroke={C.coral} strokeWidth="1.25" />
      <circle cx={DX(31)} cy={Y(tgt)} r={(hv === "t" ? 4.5 : 3) * tdot} fill={C.coral} style={{ transition: "r .2s" }} />
      <text x={CW} y={Y(tgt) - 10} textAnchor="end" fontSize="11" fontWeight="600" fill={C.coral} opacity={tdot}>{fmt(tgt)} target</text>
      <circle cx={pts[26][0]} cy={pts[26][1]} r={(hv === "n" ? 5 : 3.5) * dot} fill={color} style={{ transition: "r .2s" }} />
      <circle cx={DX(31)} cy={Y(tgt)} r="10" fill="transparent" onPointerEnter={() => setHv("t")} onPointerLeave={() => setHv(null)} />
      <circle cx={pts[26][0]} cy={pts[26][1]} r="10" fill="transparent" onPointerEnter={() => setHv("n")} onPointerLeave={() => setHv(null)} />
      <DotTip x={DX(31)} y={Y(tgt)} title={`October target · ${fmt(tgt)}`} sub="The pace line runs straight to it" show={hv === "t"} />
      <DotTip x={pts[26][0]} y={pts[26][1]} title={`Today · ${fmt(now)}`} sub={`Pace by now ${fmt(start + ((tgt - start) * 26) / 30)}`} show={hv === "n"} />
      {[[1, "Oct 1"], [8, "Oct 8"], [15, "Oct 15"], [22, "Oct 22"], [27, "Today"], [31, "Oct 31"]].map(([d, t]) => (
        <text key={d} x={d === 31 ? CW : DX(d)} y={base + 15} textAnchor={d === 31 ? "end" : d === 1 ? "start" : "middle"} fontSize="11" fontWeight={d === 27 ? 600 : 400}
          fill={d === 27 ? color : "#535353"} opacity={win(p, 0, 0.3)}>{t}</text>
      ))}
    </svg>
  );
}

// ---------- By segment — one bar per segment, metric colour, lighter for the second
const tickV = (t) => 95 + t * 10; // NRR segment bars run 95% → 105%
export function Segments({ p, rows, scale, fmt, tick, tickLabel, note, color }) {
  const { E, spread } = useContext(MotionCtx);
  const [hv, setHv] = useState(null);
  return (
    <div className="mo-segs">
      {rows.map(([name, v, share], i) => {
        const g = E(stag(win(p, 0.08, 0.75), i, rows.length, spread));
        return (
          <div className="mo-seg" key={name}>
            <div className="mo-seg-t"><span>{name}</span><b>{fmt(v)}</b>{share && <em>{share}</em>}</div>
            <div className="mo-seg-bar">
              <i className="grain" style={{ width: `${scale(v) * 100 * g}%`, backgroundColor: i === 0 ? color : mix(color, "#ffffff", 0.4) }} />
              {[25, 50, 75].map((q) => <u key={q} style={{ left: `${q}%` }} />)}
              {tick != null && (
                <s style={{ left: `${tick * 100}%`, transform: `translateX(-50%) scale(${win(p, 0.7, 0.9) * (hv === i ? 1.25 : 1)})` }} onPointerEnter={() => setHv(i)} onPointerLeave={() => setHv(null)}>
                  <span className={`seg-tip${hv === i ? " is-on" : ""}`}><b>{tickLabel}</b><em>{name} {v >= tickV(tick) ? `is ${(v - tickV(tick)).toFixed(1)} pts above` : `is ${(tickV(tick) - v).toFixed(1)} pts under`}</em></span>
                </s>
              )}
            </div>
          </div>
        );
      })}
      {note && <p className="mo-note">{note}</p>}
    </div>
  );
}

// ---------- By kind — new business + expansion stack up from $0, the solid part ends at net, churn is the dashed slice above
export function ByKind({ p, data }) {
  const { CW, CH, x0, top, base, pitch, MX, bw } = useContext(GeoCtx);
  const { E, spread } = useContext(MotionCtx);
  const [hov, onMove, onLeave, holdHov] = useColumnHover((i) => Y(data[i][0] + data[i][1]));
  const f = (v) => `$${Math.abs(v).toFixed(2)}M`;
  const lo = 0, hi = 2.5, Y = (v) => base - ((v - lo) / (hi - lo)) * (base - top);
  return (
    <div className="mo-plot" onPointerMove={onMove} onPointerLeave={onLeave}>
    <svg viewBox={`0 0 ${CW} ${CH}`} className="mo-svg">
      <Axis ticks={[0, 1, 2]} Y={Y} fmt={(v) => (v ? `$${v}M` : "$0")} b0={0} p={p} />
      {data.map(([nb, ex, cu], i) => {
        const oct = i === 5, x = MX(i) - 22, net = nb + ex - cu;
        const a = E(stag(win(p, 0.05, 0.55), i, 6, spread)), b = E(stag(win(p, 0.3, 0.75), i, 6, spread)), c = stag(win(p, 0.6, 0.95), i, 6, spread);
        const yNb = lerp(base, Y(nb), a), yNet = lerp(Y(nb), Y(net), b);
        return (
          <g key={i} opacity={(oct ? 0.62 : 1) * (hov != null && hov !== i ? 0.45 : 1)} style={{ transition: "opacity .25s" }}>
            <g filter="url(#grain)">
              <rect x={x} y={yNb} width="44" height={base - yNb} fill={C.navyFill} />
              {b > 0 && <rect x={x} y={yNet} width="44" height={Math.max(0, Y(nb) - yNet)} fill={C.purple} />}
            </g>
            <path d={topBar(x + 0.5, Y(nb + ex), 43, Y(net) - Y(nb + ex))} fill={C.paper} stroke={C.alert} strokeWidth="1" strokeDasharray="3 3"
              opacity={c} transform={`translate(0 ${(1 - c) * 6})`} />
          </g>
        );
      })}
      <Months p={p} hov={hov} />
    </svg>
    <ColumnTip hold={holdHov} i={hov} y={hov != null ? Y(data[hov][0] + data[hov][1]) : 0} tip={hov == null ? {} : {
      eyebrow: hov === 5 ? "Oct · month to date" : MONTHS[hov],
      title: `${f(data[hov][0] + data[hov][1] - data[hov][2])} net`,
      rows: [{ c: C.navyFill, k: "New business", v: "+" + f(data[hov][0]) }, { c: C.purple, k: "Expansion", v: "+" + f(data[hov][1]) }, { c: C.alert, k: "Churn", v: "−" + f(data[hov][2]) }],
    }} />
    </div>
  );
}
