// ARR movement, its own page, laid out like Company health: an open header, three tiles that open (October to date, left to
// build, the December plan), the filters, then the ledger. Under the ledger, Home's
// own ARR chart at full width, then Total ARR and Felix ARR as their own chart. Hover reads one thing at
// a time: a row name lights its row, any number lights its month. The chart keeps its own hover and never lights the table.
// All figures come from arr-data.js, the same source Home reads (sample data).
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { C, toMotion } from "./lib.js";
import { TipBody } from "./visuals.jsx";
import { mix } from "./open-charts.jsx";
import { arrData, SEGS, YEARS, MONTHS, MONTHS_L, OCT_TARGET, MOVE_C } from "./arr-data.js";

const fM = (v) => `$${Math.abs(v).toFixed(2)}M`;
const money = (v) => (Math.abs(v) >= 1 ? `$${Math.abs(v).toFixed(2)}M` : `$${Math.round(Math.abs(v) * 1000)}K`);
const fmt = (u, v, neg) => { if (v == null) return "—"; const a = Math.abs(v), s = u === "M" ? a.toFixed(2) : u === "K" ? a.toFixed(1) : `${a.toFixed(1)}`; return u === "%" ? s : neg || v < 0 ? `(${s})` : s; };
const segName = (s) => (s === "all" ? "All accounts" : s === "mid" ? "Medium+" : "Ind & Small");
const LIVE = "#7f9bb2";

const ROWS = [
  { k: "beg", l: "Beginning ARR", u: "M" },
  { k: "new", l: "New ARR", u: "M", in: true },
  { k: "exp", l: "Expansion ARR", u: "M", in: true },
  { k: "churn", l: "Churn ARR", u: "K", in: true, neg: true },
  { k: "down", l: "Downgrade ARR", u: "K", in: true, neg: true },
  { k: "loss", l: "Total revenue loss", u: "M", neg: true },
  { k: "net", l: "Net new ARR", u: "M" },
  { k: "end", l: "Ending ARR", u: "M", total: true },
];
const MORE = [
  { k: "felix", l: "Felix ARR", u: "M" },
  { k: "share", l: "Felix share of ARR", u: "%" },
  { k: "grr", l: "GRR, monthly", u: "%" },
  { k: "nrr", l: "NRR, monthly", u: "%" },
  { k: "avg", l: "Avg ARR per account", u: "K" },
];

// ---- the filters: the Agents list's own dropdown (value only, quiet until hovered), opening out of its own button. Each
// option carries its figure on the right, the way the Agents filters carry their counts
function Drop({ value, options, onPick }) {
  const [o, setO] = useState(false), ref = useRef(null), [bs, setBs] = useState({ w: 90, h: 28 });
  useEffect(() => { if (!o) return;
    const f = (e) => { if (!ref.current?.contains(e.target)) setO(false); };
    const k = (e) => { if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); setO(false); } };
    window.addEventListener("pointerdown", f); window.addEventListener("keydown", k, true);
    return () => { window.removeEventListener("pointerdown", f); window.removeEventListener("keydown", k, true); }; }, [o]);
  const cur = options.find((x) => x[0] === value) || options[0];
  return (
    <div className="am-dd" ref={ref}>
      <button type="button" className={`am-dd-b${o ? " is-open" : ""}`} aria-haspopup="listbox" aria-expanded={o} onClick={(e) => { setBs({ w: e.currentTarget.offsetWidth, h: e.currentTarget.offsetHeight }); setO((v) => !v); }}>
        <span>{cur[1]}</span>
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1.5 3 4 5.5 6.5 3" /></svg>
      </button>
      <AnimatePresence>{o && <motion.div className="am-dd-m" role="listbox" style={{ "--bw": `${bs.w}px`, "--bh": `${bs.h}px` }} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.16 } }}>
        {options.map(([k, l, n]) => <button key={k} type="button" role="option" aria-selected={k === value} className={k === value ? "is-on" : ""} onClick={() => { onPick(k); setO(false); }}><span>{l}</span>{n && <em>{n}</em>}</button>)}
      </motion.div>}</AnimatePresence>
    </div>);
}

// ---- the sidebar's hover: a soft pill that opens sideways out of the cursor point. One at a time: the row when you're on its
// name, the month when you're on a number
function Band({ r, x, t }) {
  const [f] = useState(() => x), s = 18;
  const l = Math.min(Math.max(f - s / 2, r.left), r.left + r.w - s);
  return <motion.span className="am-band" initial={{ left: l, width: s, top: r.top + 5, height: Math.max(0, r.h - 10), opacity: 0 }} animate={{ left: r.left, width: r.w, top: r.top, height: r.h, opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }} transition={{ default: toMotion(t), opacity: { duration: 0.2 } }} />;
}

// ---- the table: the same twelve months, every line of the movement
function Table({ d, M, n0 }) {
  const wrap = useRef(null), tbl = useRef(null), px = useRef(0);
  const [on, setOn] = useState(null); // { kind: "row", k } | { kind: "col", c }
  const [rect, setRect] = useState(null);
  const cols = d.cols, more = MORE.filter((r) => d[r.k].some((v) => v != null));
  // a run of the same kind of month gets one label above it: Measured, Live, Plan
  const runs = cols.reduce((a, c) => { const l = a[a.length - 1]; if (l && l.g === c.g) l.n++; else a.push({ g: c.g, n: 1 }); return a; }, []);
  const over = (e) => {
    const cell = e.target.closest("td, th"); if (!cell || !tbl.current.contains(cell)) return;
    const W = wrap.current.getBoundingClientRect(); px.current = e.clientX - W.left + wrap.current.scrollLeft;
    const rk = cell.closest("tr")?.dataset.k, c = cell.dataset.c;
    const next = cell.matches('th[scope="row"]') && rk ? { kind: "row", k: rk } : c != null ? { kind: "col", c: +c } : null;
    setOn((p) => (p && next && p.kind === next.kind && p.k === next.k && p.c === next.c ? p : next));
  };
  // where the pill goes, in the scroll box's own coordinates (so it scrolls with the table)
  useLayoutEffect(() => {
    const w = wrap.current, t = tbl.current; if (!w || !t || !on) { setRect(null); return; }
    const W = w.getBoundingClientRect(), ox = w.scrollLeft - W.left, oy = -W.top, T = t.getBoundingClientRect();
    if (on.kind === "row") { const tr = t.querySelector(`tr[data-k="${on.k}"]`); if (!tr) return setRect(null); const R = tr.getBoundingClientRect(); setRect({ left: T.left + ox, w: T.width, top: R.top + oy, h: R.height }); }
    else { const th = t.querySelector(`thead tr:last-child th[data-c="${on.c}"]`), g = t.querySelector("thead tr:last-child"); if (!th || !g) return setRect(null); const R = th.getBoundingClientRect(), G = g.getBoundingClientRect(); setRect({ left: R.left + ox, w: R.width, top: G.top + oy, h: T.bottom - G.top }); }
  }, [on, d]);
  const hc = on?.kind === "col" ? on.c : null, hr = on?.kind === "row" ? on.k : null;
  const cellCls = (c) => `${cols[c].g === "live" ? "is-live" : cols[c].g === "plan" ? "is-plan" : ""}${hc === c ? " is-hi" : ""}`;
  const spark = (r) => {
    const pts = d[r.k].map((v, i) => [i, v == null ? null : r.neg ? -Math.abs(v) : v]).filter(([, v]) => v != null); if (pts.length < 2) return null;
    const vs = pts.map(([, v]) => v), mx = Math.max(...vs), mn = Math.min(...vs), Xs = (i) => 2 + i * 7.2, Ys = (v) => 15 - ((v - mn) / (mx - mn || 1)) * 12;
    const lastAct = cols.reduce((a, c, i) => (c.g !== "plan" ? i : a), -1), meas = pts.filter(([i]) => i <= lastAct), plan = pts.filter(([i]) => (lastAct < 0 ? true : i >= lastAct));
    const dd = (q) => q.map(([i, v], k) => `${k ? "L" : "M"}${Xs(i).toFixed(1)} ${Ys(v).toFixed(1)}`).join("");
    return <svg width="84" height="18" viewBox="0 0 84 18" aria-hidden="true">
      {meas.length > 1 && <path d={dd(meas)} fill="none" stroke={C.navy} strokeOpacity=".55" strokeWidth="1" strokeLinejoin="round" />}
      {plan.length > 1 && <path d={dd(plan)} fill="none" stroke={C.navy} strokeOpacity=".4" strokeWidth="1" strokeDasharray="1 2.5" strokeLinecap="round" />}
      {hc != null && d[r.k][hc] != null && <circle cx={Xs(hc)} cy={Ys(r.neg ? -Math.abs(d[r.k][hc]) : d[r.k][hc])} r="2" fill={C.navy} />}</svg>; };
  let n = n0;
  const row = (r) => <tr key={r.k} data-k={r.k} style={{ "--i": n++ }} className={`am-in${r.in ? " is-in" : ""}${r.total ? " is-total" : ""}${r.neg ? " is-neg" : ""}${hr === r.k ? " is-hr" : ""}`}>
    <th scope="row"><span>{r.l}</span><small>{r.u === "%" ? "%" : r.u === "K" ? "$K" : "$M"}</small></th>
    {d[r.k].map((v, c) => <td key={c} data-c={c} className={cellCls(c)}>{fmt(r.u, v, r.neg)}</td>)}<td className="am-trend">{spark(r)}</td></tr>;
  return (
    <div className="am-tbl-wrap" ref={wrap} onPointerOver={over} onPointerLeave={() => setOn(null)}>
      <div className="am-bands" aria-hidden="true">
        <AnimatePresence>{rect && on && <Band key={on.kind === "row" ? `r-${on.k}` : `c-${on.c}`} r={rect} x={px.current} t={M.hover.glide} />}</AnimatePresence>
      </div>
      <table className="am-tbl" ref={tbl}>
        <thead>
          <tr className="am-in" style={{ "--i": n++ }}><th scope="col"><span className="sr-only">{d.year}</span></th>{cols.map((c, i) => <th key={c.k} data-c={i} scope="col" className={cellCls(i)}>{c.l}</th>)}<th scope="col" className="am-trend">Trend</th></tr>
        </thead>
        <tbody>{ROWS.map(row)}</tbody>
        {more.length > 0 && <tbody className="am-more"><tr className="am-sec am-in" style={{ "--i": n++ }}><th colSpan={cols.length + 2}>{more.some((r) => r.k === "felix") ? "Felix and retention" : "Retention"}</th></tr>{more.map(row)}</tbody>}
      </table>
    </div>);
}

// ---- the year by month: Home's ARR chart at full width. Measured months solid, the live month lighter, plan months dotted
// outlines; hover a measured month and its bar turns into what built it, as on Home
function YearChart({ d, M }) {
  const [hi, setHi] = useState(null);
  const Wv = 1079, Hv = 270, base = 251.7, gx = 52, top = 27.4; // the plan label is the plot's top line, right under the title
  const plan = d.year === "2025" ? null : d.end[11];
  const vals = [...d.end, d.start], mn = Math.min(...vals), mx = Math.max(...vals), span = mx - mn;
  const step = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10].find((s) => span / s <= 5) || 10;
  const lo = Math.max(0, Math.floor((mn - span * 0.2) / step) * step), hiV = mx + step * 0.2, k = (base - top) / (hiV - lo), Y = (v) => base - (v - lo) * k;
  const ticks = []; for (let v = lo; v <= mx + 1e-9; v += step) ticks.push(+v.toFixed(2));
  const bw = 39.8, pitch = (Wv - gx - 20) / 12, cx = (i) => gx + 20 + pitch * (i + 0.5) - 10;
  const kindOf = (i) => d.cols[i].g; // act | live | plan
  const barPath = (x, y, w, h, r) => { r = Math.min(r, w / 2, h); return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`; };
  const fmtAx = (v) => (v === 0 ? "$0" : step < 1 ? `$${v.toFixed(step < 0.25 ? 1 : 2)}M` : `$${v}M`);
  const dim = (i) => (hi != null && hi !== i ? 0.45 : 1);
  const rise = (i) => ({ initial: { scaleY: 0 }, style: { transformBox: "fill-box", transformOrigin: "50% 100%" }, transition: { scaleY: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.08 + i * 0.03 }, opacity: { duration: 0.2 } } });
  const tip = hi;
  return (
    <section className="am-sec-b am-in" style={{ "--i": 99 }}>
      <div className="am-sec-h"><h3>Ending ARR by month</h3></div>
      <div className="am-chart">
        <div className="arr-plot" onPointerLeave={() => setHi(null)}>
          <svg viewBox={`0 0 ${Wv} ${Hv}`} role="img" aria-label={`Ending ARR by month, ${d.year}, ${segName(d.seg)}`}>
            {ticks.map((v) => <g key={v}>
              <line x1={gx} x2={Wv} y1={Y(v) + 0.25} y2={Y(v) + 0.25} stroke={v === lo ? C.edge : C.line} strokeWidth="0.5" />
              <text x={40} y={Y(v) + 4} textAnchor="end" fontSize="11.7" fontWeight="500" fill={C.mute}>{fmtAx(v)}</text></g>)}
            {plan != null && <>
              <line x1={gx} x2={Wv} y1={Y(plan)} y2={Y(plan)} stroke={C.coral} strokeWidth="1" strokeDasharray="0.1 2.6" strokeLinecap="round" />
              <text x={57.4} y={Y(plan) - 7.5} fontSize="11.7" fontWeight="600" fill={C.coral}>{`Plan ${fM(plan)}`}</text></>}
            <g filter="url(#grain)">
              {d.end.map((v, i) => { const g = kindOf(i); if (g === "plan") return null;
                return <motion.path key={i} d={barPath(cx(i) - bw / 2, Y(v), bw, base - Y(v), 3)} fill={hi === i ? mix(g === "live" ? LIVE : C.navyFill, C.paper, 0.55) : g === "live" ? LIVE : C.navyFill} animate={{ scaleY: 1, opacity: dim(i) }} {...rise(i)} />; })}
            </g>
            {d.end.map((v, i) => kindOf(i) === "plan" && <motion.path key={`p${i}`} d={barPath(cx(i) - bw / 2 + 0.25, Y(v) + 0.25, bw - 0.5, base - Y(v) - 0.25, 3)} fill={C.paper} stroke={C.navy} strokeWidth="0.6" strokeDasharray="0.1 2.05" strokeLinecap="round" animate={{ scaleY: 1, opacity: dim(i) }} {...rise(i)} />)}
            {/* the grid runs through the solid bars as paper lines, as on Home */}
            {d.end.map((v, i) => kindOf(i) !== "plan" && ticks.filter((t) => t > lo && Y(t) > Y(v) + 1).map((t) => (
              <line key={`${i}-${t}`} x1={cx(i) - bw / 2} x2={cx(i) + bw / 2} y1={Y(t) + 0.25} y2={Y(t) + 0.25} stroke={C.paper} strokeWidth="0.75" opacity={dim(i)} pointerEvents="none" />)))}
            {/* hovering a measured month: it turns into what built it, New and Expansion from the baseline, then what was lost */}
            <AnimatePresence>
              {hi != null && kindOf(hi) !== "plan" && (() => {
                const x = cx(hi) - bw / 2, T = toMotion(M.hover.band), parts = [["new", d.new[hi]], ["exp", d.exp[hi]], ["churn", d.churn[hi] / 1000], ["down", d.down[hi] / 1000]];
                let y0 = base; const segs = parts.map(([key, v]) => { const h = v * k, s = { key, y: y0 - h, hh: h }; y0 -= h; return s; });
                return <motion.g key={`mv-${hi}`} pointerEvents="none" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                  {segs.map((g, n) => <motion.rect key={g.key} x={x} width={bw} fill={MOVE_C[g.key]} initial={{ y: g.y + g.hh, height: 0 }} animate={{ y: g.y, height: Math.max(0, g.hh - 0.6) }} transition={{ ...T, delay: n * 0.06 }} />)}
                </motion.g>; })()}
            </AnimatePresence>
            {MONTHS.map((mo, i) => <text key={mo} x={cx(i)} y={base + 13.6} textAnchor="middle" fontSize="10.23" fontWeight={kindOf(i) === "live" ? 600 : 400} fill={hi === i ? C.navy : "#535353"}>{mo}</text>)}
            {/* the whole column answers, so there's no dead gap between months */}
            {MONTHS.map((mo, i) => <rect key={`h${i}`} x={cx(i) - pitch / 2} y={0} width={pitch} height={Hv} fill="transparent" onPointerEnter={() => setHi(i)} />)}
          </svg>
          <AnimatePresence>
            {tip != null && (() => {
              const g = kindOf(tip), yTop = ((Y(d.end[tip]) - 12) / Hv) * 100, left = (cx(tip) / Wv) * 100, right = tip > 8, net = d.net[tip];
              return <motion.div className="tip am-ctip" key="amtip" onPointerEnter={() => setHi(tip)} initial={{ opacity: 0, scale: 0.9, y: 6, left: `${left}%`, top: `${yTop}%` }} animate={{ opacity: 1, scale: 1, y: 0, left: `${left}%`, top: `${yTop}%` }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.12 } }} transition={{ ...toMotion(M.tip), left: toMotion(M.tipFollow), top: toMotion(M.tipFollow) }}
                style={{ x: right ? "-100%" : "-50%", translate: "0 -100%", transformOrigin: right ? "100% 100%" : "50% 100%" }}>
                <TipBody id={`b-${d.seg}-${d.year}-${tip}`}
                  eyebrow={g === "live" ? <><i className="tip-sw" style={{ background: LIVE }} />{MONTHS_L[tip]} · to date</> : g === "plan" ? <><i className="tip-sw" style={{ border: `0.75px dashed ${C.navy}` }} />{MONTHS_L[tip]} · plan</> : `${MONTHS_L[tip]} · ending ARR`}
                  title={fM(d.end[tip])} rows={[
                    { c: MOVE_C.new, k: "New", v: `+${money(d.new[tip])}` },
                    { c: MOVE_C.exp, k: "Expansion", v: `+${money(d.exp[tip])}` },
                    { c: MOVE_C.churn, k: "Churn", v: `−${money(d.churn[tip] / 1000)}`, vc: MOVE_C.churn },
                    { c: MOVE_C.down, k: "Downgrade", v: `−${money(d.down[tip] / 1000)}`, vc: MOVE_C.down },
                    { sep: true, c: net >= 0 ? MOVE_C.net : MOVE_C.churn, k: g === "plan" ? "Net new the plan needs" : "Net new", v: `${net >= 0 ? "+" : "−"}${money(net)}`, vc: net >= 0 ? MOVE_C.net : MOVE_C.churn },
                  ]} />
              </motion.div>; })()}
          </AnimatePresence>
        </div>
        <div className="legend">
          {d.cols.some((c) => c.g === "act") && <span><i className="sw grain" style={{ backgroundColor: C.navyFill }} />Ending ARR</span>}
          {d.cols.some((c) => c.g === "live") && <span><i className="sw grain" style={{ backgroundColor: LIVE }} />Month to date</span>}
          {d.cols.some((c) => c.g === "plan") && <span><i className="sw sw-proj" />Plan</span>}
        </div>
      </div>
    </section>);
}

// ---- Total ARR and Felix ARR: its own chart, drawn the way North draws pace (Expansion ARR's chart): a fine line with its
// stripes under it, the line sweeping in from the left. Two colors that read apart at a glance, navy for Total, Felix's
// purple for Felix (coral stays pace's alone). Solid through the live month, dotted on through the plan, a dot on today
const FELIX = C.purple;
function TotalFelix({ d, M }) {
  const [hi, setHi] = useState(null);
  const Wv = 1079, Hv = 290, x0 = 52, x1 = Wv - 96, top = 14, base = Hv - 34;
  const hasF = d.felix.some((v) => v != null);
  const mx = Math.max(...d.end, ...(hasF ? d.felix.filter((v) => v != null) : [])), step = [0.5, 1, 2, 5, 10].find((s) => mx / s <= 5) || 10, hiV = Math.ceil((mx * 1.04) / step) * step;
  const X = (i) => x0 + (i / 11) * (x1 - x0), Y = (v) => base - (v / hiV) * (base - top);
  const ticks = []; for (let v = 0; v <= hiV + 1e-9; v += step) ticks.push(+v.toFixed(2));
  const lastAct = d.cols.reduce((a, c, i) => (c.g !== "plan" ? i : a), -1), liveI = d.cols.findIndex((c) => c.g === "live");
  const ptsOf = (arr) => arr.map((v, i) => (v == null ? null : [i, v])).filter(Boolean);
  const P = (pts) => pts.map(([i, v], k) => `${k ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join("");
  const area = (pts) => pts.length < 2 ? "" : P(pts) + `L${X(pts[pts.length - 1][0])} ${base}L${X(pts[0][0])} ${base}Z`;
  const T = ptsOf(d.end), F = hasF ? ptsOf(d.felix) : [];
  const split = (pts) => ({ meas: pts.filter(([i]) => i <= lastAct), plan: pts.filter(([i]) => lastAct < 0 || i >= lastAct) });
  const Ts = split(T), Fs = split(F);
  const stripes = []; for (let x = x0 + 2; x < x1; x += 4) stripes.push(x);
  const planX = lastAct >= 0 && lastAct < 11 ? X(lastAct) : lastAct < 0 ? x0 : null; // stripes past here sit lighter: that's plan
  const fmtAx = (v) => (v === 0 ? "$0" : step < 1 ? `$${v.toFixed(1)}M` : `$${v}M`);
  const id = `tf-${d.seg}-${d.year}`;
  const endI = 11, nowI = lastAct >= 0 ? lastAct : null;
  const onMove = (e) => { const r = e.currentTarget.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * Wv, i = Math.round(((x - x0) / (x1 - x0)) * 11); setHi(i >= 0 && i <= 11 ? i : null); };
  return (
    <section className="am-sec-b am-in" style={{ "--i": 100 }}>
      <div className="am-sec-h"><h3>Total ARR and Felix ARR</h3></div>
      <div className="am-chart">
        <div className="arr-plot" onPointerLeave={() => setHi(null)}>
          <svg viewBox={`0 0 ${Wv} ${Hv}`} onPointerMove={onMove} role="img" aria-label={`Total ARR and Felix ARR by month, ${d.year}, ${segName(d.seg)}`}>
            <defs>
              <clipPath id={`${id}-sw`}><motion.rect x={0} y={0} height={Hv} initial={{ width: 0 }} animate={{ width: Wv }} transition={{ duration: 1.1, ease: [0.45, 0, 0.2, 1], delay: 0.15 }} /></clipPath>
              <clipPath id={`${id}-t`}><path d={area(T)} /></clipPath>
              {hasF && <clipPath id={`${id}-f`}><path d={area(F)} /></clipPath>}
            </defs>
            {ticks.map((v) => <g key={v}>
              <line x1={x0} x2={x1} y1={Y(v) + 0.25} y2={Y(v) + 0.25} stroke={v === 0 ? "#c9c4bf" : C.line} strokeWidth={v === 0 ? 1 : 0.5} />
              <text x={x0 - 10} y={Y(v) + 4} textAnchor="end" fontSize="11.7" fontWeight="500" fill={C.mute}>{fmtAx(v)}</text></g>)}
            <g clipPath={`url(#${id}-sw)`}>
              <g clipPath={`url(#${id}-t)`}>{stripes.map((x) => <line key={x} x1={x} x2={x} y1={top} y2={base} stroke={C.navy} strokeOpacity={planX != null && x > planX ? 0.16 : 0.35} strokeWidth="0.5" />)}</g>
              {hasF && <g clipPath={`url(#${id}-f)`}>
                <rect x={x0} y={top} width={x1 - x0} height={base - top} fill={C.paper} />
                {stripes.map((x) => <line key={x} x1={x} x2={x} y1={top} y2={base} stroke={FELIX} strokeOpacity={planX != null && x > planX ? 0.28 : 0.62} strokeWidth="0.6" />)}
              </g>}
              {Ts.plan.length > 1 && <path d={P(Ts.plan)} fill="none" stroke={C.navy} strokeWidth="1.25" strokeDasharray="0.1 3" strokeLinecap="round" />}
              {Ts.meas.length > 1 && <path d={P(Ts.meas)} fill="none" stroke={C.navy} strokeWidth="1.25" strokeLinejoin="round" />}
              {hasF && Fs.plan.length > 1 && <path d={P(Fs.plan)} fill="none" stroke={FELIX} strokeWidth="1.25" strokeDasharray="0.1 3" strokeLinecap="round" />}
              {hasF && Fs.meas.length > 1 && <path d={P(Fs.meas)} fill="none" stroke={FELIX} strokeWidth="1.25" strokeLinejoin="round" />}
            </g>
            {/* today: where each line is now */}
            {nowI != null && <motion.g initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 1.0 + (nowI / 11) * 0.2 }} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
              <circle cx={X(nowI)} cy={Y(d.end[nowI])} r="4.5" fill={C.navy} stroke={C.paper} strokeWidth="1.5" />
              {hasF && d.felix[nowI] != null && <circle cx={X(nowI)} cy={Y(d.felix[nowI])} r="4.5" fill={FELIX} stroke={C.paper} strokeWidth="1.5" />}
            </motion.g>}
            {/* where each line ends: the year's last month, named in its own color */}
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 1.2 }}>
              <circle cx={X(endI)} cy={Y(d.end[endI])} r="3.5" fill={lastAct >= endI ? C.navy : C.paper} stroke={C.navy} strokeWidth="1.5" />
              <text x={X(endI) + 10} y={Y(d.end[endI]) + 4} fontSize="12" fontWeight="600" fill={C.navy}>{`${fM(d.end[endI])}`}</text>
              {hasF && d.felix[endI] != null && <>
                <circle cx={X(endI)} cy={Y(d.felix[endI])} r="3.5" fill={lastAct >= endI ? FELIX : C.paper} stroke={FELIX} strokeWidth="1.5" />
                <text x={X(endI) + 10} y={Y(d.felix[endI]) + 4} fontSize="12" fontWeight="600" fill={FELIX}>{`${fM(d.felix[endI])}`}</text></>}
            </motion.g>
            {hi != null && <g pointerEvents="none">
              <line x1={X(hi)} x2={X(hi)} y1={top} y2={base} stroke={C.navy} strokeWidth="0.5" strokeDasharray="2 2" />
              <circle cx={X(hi)} cy={Y(d.end[hi])} r="3.5" fill={C.paper} stroke={C.navy} strokeWidth="1.5" />
              {hasF && d.felix[hi] != null && <circle cx={X(hi)} cy={Y(d.felix[hi])} r="3.5" fill={C.paper} stroke={FELIX} strokeWidth="1.5" />}
            </g>}
            {MONTHS.map((mo, i) => <text key={mo} x={i === 0 ? x0 : i === 11 ? x1 : X(i)} y={Hv - 10} textAnchor={i === 0 ? "start" : i === 11 ? "end" : "middle"} fontSize="11" fontWeight={i === liveI || hi === i ? 600 : 500} fill={i === liveI || hi === i ? C.navy : C.axis}>{i === liveI ? "Today" : mo}</text>)}
          </svg>
          <AnimatePresence>
            {hi != null && (() => {
              const g = d.cols[hi].g, yTop = ((Y(d.end[hi]) - 14) / Hv) * 100, left = (X(hi) / Wv) * 100, right = hi > 8;
              const rows = [{ c: C.navy, k: "Total ARR", v: fM(d.end[hi]) }];
              if (hasF && d.felix[hi] != null) rows.push({ c: FELIX, k: "Felix ARR", v: fM(d.felix[hi]) }, { sep: true, k: "Felix share", v: `${d.share[hi]}%` });
              return <motion.div className="tip am-ctip" key="tftip" initial={{ opacity: 0, scale: 0.9, y: 6, left: `${left}%`, top: `${yTop}%` }} animate={{ opacity: 1, scale: 1, y: 0, left: `${left}%`, top: `${yTop}%` }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.12 } }} transition={{ ...toMotion(M.tip), left: toMotion(M.tipFollow), top: toMotion(M.tipFollow) }}
                style={{ x: right ? "-100%" : "-50%", translate: "0 -100%", transformOrigin: right ? "100% 100%" : "50% 100%", pointerEvents: "none" }}>
                <TipBody id={`${id}-${hi}`} eyebrow={`${MONTHS_L[hi]}${g === "live" ? " · to date" : g === "plan" ? " · plan" : ""}`} title={null} rows={rows} />
              </motion.div>; })()}
          </AnimatePresence>
        </div>
        <div className="legend">
          <span><i className="am-sw-l" />Total ARR</span>
          {hasF && <span><i className="am-sw-l is-felix" />Felix ARR</span>}
          {d.cols.some((c) => c.g === "plan") && <span><i className="am-sw-l is-plan" />Plan</span>}
        </div>
      </div>
    </section>);
}

// the sentence under the title: where the year stands, for what's selected
function leadFor(d) {
  const e = d.end;
  if (d.year === "2026") {
    if (d.seg === "all") return `October is at ${fM(e[9])} so far, ${fM(OCT_TARGET - e[9])} short of its ${fM(OCT_TARGET)} target. December’s ${fM(e[11])} plan needs ${fM(e[11] - e[9])} more, about ${fM((e[11] - e[9]) / 2)} a month.`;
    const all = arrData("all", "2026").end[9];
    return `${segName(d.seg)} is at ${fM(e[9])} so far in October, ${Math.round((e[9] / all) * 100)}% of ARR, up ${fM(e[9] - e[8])} on September. Its share of December’s plan is ${fM(e[11])}: ${fM(e[11] - e[9])} more, about ${fM((e[11] - e[9]) / 2)} a month.`;
  }
  if (d.year === "2025") return `${d.seg === "all" ? "ARR" : segName(d.seg)} closed 2025 at ${fM(e[11])}, up ${fM(e[11] - d.start)} on the year. Every month is final.`;
  return `The 2027 plan takes ${d.seg === "all" ? "ARR" : segName(d.seg)} from ${fM(d.start)} to ${fM(e[11])}, about ${fM((e[11] - d.start) / 12)} net new a month. None of it is measured yet.`;
}
const statusFor = (d) => (d.year === "2025" ? "12 months measured" : d.year === "2027" ? "12 plan months" : "9 months measured · October live · 2 plan months");

export function ArrPage({ M, focus, numbers, onBack }) {
  const [seg, setSeg] = useState("all"), [year, setYear] = useState("2026");
  const tblRef = useRef(null);
  useEffect(() => { if (!onBack) return; const k = (e) => { if (e.key !== "Escape" || e.defaultPrevented) return; const a = document.activeElement; if (a && /INPUT|TEXTAREA/.test(a.tagName)) return; if (document.querySelector('.mtile.is-open, .fm, .am-dd-m')) return; onBack(); }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onBack]);
  const d = arrData(seg, year);
  // "View as table" from Home lands on the table
  // only its own scroller moves (scrollIntoView would scroll the page behind it too)
  useEffect(() => { if (focus !== "table" || !tblRef.current) return; const t = setTimeout(() => { const el = tblRef.current, sc = el && el.closest(".ao-scroll");
    if (sc) sc.scrollTo({ top: el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 24, behavior: "smooth" }); else el && el.scrollIntoView({ block: "start", behavior: "smooth" }); }, 450); return () => clearTimeout(t); }, [focus]);
  // each option carries its figure, as the Agents filters carry counts: a segment's ARR in the year shown, a year's December
  const segOpts = SEGS.map(([k, l]) => { const x = arrData(k, year); return [k, l, fM(year === "2026" ? x.end[9] : x.end[11])]; });
  const yearOpts = YEARS.map(([k, l]) => [k, l, `${k === "2027" ? "Plan " : ""}${fM(arrData(seg, k).end[11])}`]);
  return (
    <div className="ch dept am">
      {/* opened from Home's chart, it can fold back into it: the same mark as the chart's expand, pointing in (Esc too) */}
      {onBack && <button type="button" className="ibtn am-back" aria-label="Back to Home" title="Back to Home (Esc)" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13.5 2.5 9 7M9 3.5V7h3.5M2.5 13.5 7 9M7 12.5V9H3.5" /></svg></button>}
      <header className="am-head">
        <h1>ARR movement</h1>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p key={`${seg}-${year}`} className="am-lead" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>{leadFor(d)}</motion.p>
        </AnimatePresence>
      </header>
      <div className="am-bar" ref={tblRef}>
        <Drop value={seg} onPick={setSeg} options={segOpts} />
        <Drop value={year} onPick={setYear} options={yearOpts} />
        <span className="am-bar-st">{statusFor(d)} · sample data</span>
      </div>
      {/* filtering: the old view eases out, then the new one arrives row by row, top to bottom, as on the Agents list */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${seg}-${year}`} className="am-stg" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}>
          <Table d={d} M={M} n0={0} />
        </motion.div>
      </AnimatePresence>
      {/* where the year stands now, under the ledger: three numbers that open like any Home tile. They're today's, so the
          filters above don't move them */}
      {numbers && <div className="am-nums">{numbers}</div>}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={`${seg}-${year}-c`} className="am-stg" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}>
          <YearChart d={d} M={M} />
          <TotalFelix d={d} M={M} />
          <p className="am-fine am-in" style={{ "--i": 101 }}>Sample data. {year === "2026" ? "September is the latest close; October moves all day until it closes. " : ""}{year !== "2025" ? "Plan months are targets, not projections." : "The year is closed."}</p>
        </motion.div>
      </AnimatePresence>
    </div>);
}
