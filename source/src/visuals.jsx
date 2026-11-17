// The six board detail visuals. Geometry is taken from the Figma trial frame
// (Board details · gradient + purple, node 586:1230): every chart lives in a
// 723×207 space, the same as the Figma "Visual" frame.
import React, { useContext, useEffect, useRef, useState, createContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { C, clamp, lerp, stag, win, toMotion, bezier, useGraceHover } from "./lib.js";
import { NorthLogo } from "./marks.jsx";
// line sweeps: leave with pace, arrive with a long ease
const SWEEP = bezier([0.5, 0, 0.2, 1]);

export const MotionCtx = createContext(null);
export const W = 723, H = 207;

export const mixHex = (a, b, t) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return "#" + pa.map((v, i) => Math.round(lerp(v, pb[i], t)).toString(16).padStart(2, "0")).join("");
};

// ---------- piano-key field: every tick is its own spring; the cursor presses a soft bump
// into the row (gaussian in px), so neighbours rise less and settle back after the cursor passes.
export function useKeyField(n, pitch, centerPx) {
  const M = useContext(MotionCtx);
  const cfg = useRef(M.D.keys); cfg.current = M.D.keys;
  const st = useRef(null);
  if (!st.current || st.current.v.length !== n) st.current = { v: new Float32Array(n), vel: new Float32Array(n) };
  const tgt = useRef(centerPx); tgt.current = centerPx;
  const raf = useRef(0);
  const [, force] = useState(0);
  useEffect(() => {
    if (raf.current) return;
    let last = performance.now();
    const step = (t) => {
      const dt = Math.min(0.032, (t - last) / 1000); last = t;
      const { v, vel } = st.current; const c = tgt.current;
      const { spread, stiffness, damping } = cfg.current;
      let moving = false;
      for (let i = 0; i < n; i++) {
        const goal = c == null ? 0 : Math.exp(-(((i * pitch - c) / spread) ** 2));
        const a = stiffness * (goal - v[i]) - damping * vel[i];
        vel[i] += a * dt; v[i] += vel[i] * dt;
        if (Math.abs(goal - v[i]) > 0.002 || Math.abs(vel[i]) > 0.002) moving = true;
        else { v[i] = goal; vel[i] = 0; }
      }
      force((k) => k + 1);
      raf.current = moving ? requestAnimationFrame(step) : 0;
    };
    raf.current = requestAnimationFrame(step);
  }, [centerPx]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  return st.current.v;
}

// ---------- tooltip body: lines arrive one after another; when the target changes, the old lines lift away and the new ones rise in
const tipLine = { hide: { opacity: 0, y: 5, filter: "blur(2px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } };
export function TipBody({ id, eyebrow, title, rows }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.div key={id} className="tip-in" initial="hide" animate="show" exit={{ opacity: 0, y: -4, filter: "blur(2px)", transition: { duration: 0.12 } }}
        variants={{ show: { transition: { staggerChildren: 0.045 } } }}>
        {eyebrow && <motion.div className="tip-e" variants={tipLine} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>{eyebrow}</motion.div>}
        {title && <motion.div className="tip-t" variants={tipLine} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>{title}</motion.div>}
        {rows && rows.map((r, i) => (
          <motion.div className={`tip-r${r.sep ? " is-sep" : ""}${r.why ? " is-why" : ""}`} key={i} variants={tipLine} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}>
            {r.c && <i style={{ background: r.c, border: r.dash ? `0.75px dashed ${C.navy}` : 0 }} />}
            <span>{r.k}</span>
            {r.v && <b style={r.vc ? { color: r.vc } : undefined}>{r.v}</b>}
          </motion.div>
        ))}
        <motion.div className="tip-ask" variants={tipLine} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}><NorthLogo ask size={14} /><span>Click to ask North</span></motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ---------- shared frame: SVG + pointer → viewBox coords + HTML tooltip
export function VisualFrame({ label, pick, children }) {
  const ref = useRef(null);
  const [hover, setHover] = useGraceHover(180);
  const cur = useRef(null); cur.current = hover;
  const M = useContext(MotionCtx);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    const h = pick ? pick(x, y) : null;
    setHover(h ? { ...h, px: x, py: y } : null);
  };
  return (
    <div className="viz">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {children(hover)}
      </svg>
      <AnimatePresence>
        {hover && hover.tip && (
          <motion.div
            key="tip"
            className="tip"
            onPointerEnter={() => setHover(cur.current)} onPointerLeave={() => setHover(null)}
            initial={{ opacity: 0, scale: 0.9, y: 6, left: `${(hover.tip.x / W) * 100}%`, top: `${(hover.tip.y / H) * 100}%` }}
            animate={{ opacity: 1, scale: 1, y: 0, left: `${(hover.tip.x / W) * 100}%`, top: `${(hover.tip.y / H) * 100}%` }}
            exit={{ opacity: 0, scale: 0.94, y: 4, transition: { duration: 0.12 } }}
            transition={{ ...toMotion(M.D.tip), left: toMotion(M.D.tipFollow), top: toMotion(M.D.tipFollow) }}
            style={{ x: hover.tip.align === "right" ? "-100%" : hover.tip.align === "left" ? "0%" : "-50%",
              transformOrigin: hover.tip.align === "right" ? "100% 100%" : hover.tip.align === "left" ? "0% 100%" : "50% 100%" }}
          >
            <TipBody id={hover.tip.title} title={hover.tip.title} rows={hover.tip.rows} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const tipAlign = (x) => (x > W * 0.7 ? "right" : x < W * 0.3 ? "left" : "center");
export const Big = ({ x, y, fill, children, size = 48, anchor = "start" }) => (
  <text x={x} y={y} fill={fill} fontSize={size} fontWeight={400} letterSpacing="-0.03em" textAnchor={anchor}
   >{children}</text>
);
export const Small = ({ x, y, fill = C.axis, w = 500, size = 10, anchor = "start", children, opacity = 1 }) => (
  <text x={x} y={y} fill={fill} fontSize={size} fontWeight={w} textAnchor={anchor} opacity={opacity}>{children}</text>
);

// =============== 1 · Booked ARR — ticks v2
export function BookedTicks({ p }) {
  const { E, spread } = useContext(MotionCtx);
  const N = 55, tw = 9, th = 96, ty = 89, pitch = (W - tw) / (N - 1);
  const nA = 11, nP = 48, perTick = 664.453 / N;
  const fillP = E(win(p, 0.08, 0.58));
  const gapP = win(p, 0.5, 0.86);
  const dotP = win(p, 0.8, 1);
  const trackP = win(p, 0, 0.3);
  const booked = 130.2 * fillP;
  const [kc, setKc] = useState(null);
  const keys = useKeyField(N, pitch, kc);
  const lift = useContext(MotionCtx).D.keys.lift;
  const pick = (x, y) => {
    if (y < ty - 12 || y > ty + th + 6) return null; // on the ticks only
    const i = clamp(Math.round((x - tw / 2) / pitch), 0, N - 1);
    const k = i + 1;
    const st = k <= nA ? ["Booked", C.purple] : k < nP ? ["Behind pace", C.axis] : k === nP ? ["Pace", C.coral] : ["Left to October target", C.edge];
    return { i, tip: { x: i * pitch + tw / 2, y: ty - 10, align: tipAlign(i * pitch), title: `$${(k * perTick).toFixed(1)}K`, rows: [{ c: st[1], k: st[0] }, { k: "1 tick = $12.1K" }] } };
  };
  return (
    <VisualFrame label="Booked ARR ticks" pick={(x, y) => { const r = pick(x, y); setKc(r ? x - tw / 2 : null); return r; }}>
      {(h) => (
        <>
          <Big x={0} y={40} fill={C.navy}>{`$${booked.toFixed(1)}K`}</Big>
          <g>
            {Array.from({ length: N }, (_, i) => {
              const k = i + 1, x = i * pitch;
              const tIn = stag(trackP, i, N, spread);
              const isFocus = h && h.i === i;
              const up = lift * keys[i], ky = ty - up, kh = th + up;
              if (k <= nA) {
                const f = stag(fillP, i, nA, spread * 0.6);
                const hh = kh * f;
                const col = mixHex(C.purple, C.coral, i / (nP - 1)); // purple → full salmon at pace
                return (
                  <g key={i}>
                    <rect x={x + 0.25} y={ky + 0.25} width={tw - 0.5} height={kh - 0.5} rx={1} fill={C.paper} stroke={C.line} strokeWidth={0.5} opacity={tIn} />
                    <rect x={x} y={ty + th - hh} width={tw} height={hh} rx={1} fill={col} filter="url(#grain)" />
                  </g>
                );
              }
              if (k === nP) {
                // the pace tick is the only salmon on the track: it fills when the gap has finished counting toward it
                const f = E(win(p, 0.78, 0.96));
                return (
                  <g key={i}>
                    <rect x={x + 0.25} y={ky + 0.25} width={tw - 0.5} height={kh - 0.5} rx={1} fill={C.paper} stroke={C.line} strokeWidth={0.5} opacity={tIn} />
                    <rect x={x} y={ty + th - kh * f} width={tw} height={kh * f} rx={1} fill={C.coral} filter="url(#grain)" />
                  </g>
                );
              }
              // shortfall between now and pace: grey well, swept in left→right; after pace: faint outline
              const g = k < nP ? stag(gapP, k - nA - 1, nP - nA - 1, spread) : 0;
              return (
                <rect key={i} x={x + 0.25} y={ky + 0.25} width={tw - 0.5} height={kh - 0.5} rx={1}
                  fill={mixHex(C.paper, C.well, g)} stroke={mixHex(C.line, C.edge, g)} strokeWidth={0.5}
                  opacity={tIn} />
              );
            })}
          </g>
          {(() => {
            const cx = (nP - 1) * pitch + tw / 2;
            const s = dotP > 0 ? 1 + 0.25 * Math.sin(Math.PI * dotP) * (1 - dotP) : 0;
            return (
              <g opacity={Math.min(1, dotP * 2)}>
                <circle cx={cx} cy={78.5} r={4.5 * Math.min(1, s)} fill={C.coral} />
                <Small x={cx - 10} y={82} fill={C.coral} w={600} size={11} anchor="end">Pace $573.8K</Small>
              </g>
            );
          })()}
          <Small x={0} y={202} fill={C.mute} opacity={trackP}>$0</Small>
          <Small x={W} y={202} anchor="end" fill={C.mute} opacity={trackP}>$664.5K October target</Small>
        </>
      )}
    </VisualFrame>
  );
}

// =============== 2 · Expansion win rate — concentric tick rings
const wedge = (cx, cy, r, f) => {
  if (f <= 0) return "";
  if (f >= 0.9999) return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  const a = -Math.PI / 2 + 2 * Math.PI * f;
  const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
  return `M${cx} ${cy}L${cx} ${cy - r}A${r} ${r} 0 ${f > 0.5 ? 1 : 0} 1 ${x} ${y}Z`;
};
export function WinRings({ p }) {
  const { E } = useContext(MotionCtx);
  const cx = 361, cy = 95, ro = 96, ri = 66, sw = 24;
  const dash = (r) => { const per = (2 * Math.PI * r) / 94; return `${per * 0.808} ${per * 0.192}`; };
  const outP = E(win(p, 0, 0.45)), inP = E(win(p, 0.1, 0.55));
  const trackP = win(p, 0, 0.2);
  const goalP = E(win(p, 0.3, 0.68));
  const wonP = E(win(p, 0.48, 0.9));
  // depth: each ring starts small + rotated back, as if travelling toward the viewer, and lands at scale 1
  const zr = (q) => `translate(${cx} ${cy}) rotate(${-14 * (1 - q)}) scale(${lerp(1.45, 1, q)}) translate(${-cx} ${-cy})`;
  const lab = win(p, 0.75, 1);
  const goal = 0.6 * goalP, won = 0.319 * wonP;
  const pick = (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    if (d > ro - sw / 2 - 1 && d < ro + sw / 2 + 2) return { ring: "won", tip: { x: cx + ro + 18, y: cy - 30, align: "left", title: "Won 31.9%", rows: [{ c: C.purple, k: "Share of expansion deals won" }] } };
    if (d > ri - sw / 2 - 1 && d < ri + sw / 2 + 1) return { ring: "goal", tip: { x: cx - ro - 18, y: cy - 30, align: "right", title: "Goal 60%", rows: [{ c: C.coral, k: "28.1 pts to close" }] } };
    return null;
  };
  return (
    <VisualFrame label="Expansion win rate against goal" pick={pick}>
      {(h) => {
        const dimWon = h && h.ring === "goal" ? 0.3 : 1, dimGoal = h && h.ring === "won" ? 0.3 : 1;
        return (
          <>
            <defs>
              <clipPath id="wedge-won"><path d={wedge(cx, cy, ro + sw, won)} /></clipPath>
              <clipPath id="wedge-goal"><path d={wedge(cx, cy, ri + sw, goal)} /></clipPath>
            </defs>
            <circle cx={cx} cy={cy} r={104.5} fill={C.paper} />
            <g transform={zr(outP)} opacity={Math.min(1, outP * 2.2)}>
              <circle cx={cx} cy={cy} r={ro} fill="none" stroke="#f3f1ef" strokeWidth={sw} strokeDasharray={dash(ro)} transform={`rotate(-90 ${cx} ${cy})`} />
            </g>
            <g transform={zr(inP)} opacity={Math.min(1, inP * 2.2)}>
              <circle cx={cx} cy={cy} r={ri} fill="none" stroke="#f3f1ef" strokeWidth={sw} strokeDasharray={dash(ri)} transform={`rotate(-90 ${cx} ${cy})`} />
            </g>
            <g transform={zr(inP)}><g clipPath="url(#wedge-goal)" opacity={dimGoal}>
              <g filter="url(#grain)">
                <circle cx={cx} cy={cy} r={ri} fill="none" stroke={C.coral} strokeWidth={sw} strokeDasharray={dash(ri)} transform={`rotate(-90 ${cx} ${cy})`} />
              </g>
            </g></g>
            <g transform={zr(outP)}><g clipPath="url(#wedge-won)" opacity={dimWon}>
              <g filter="url(#grain)">
                <circle cx={cx} cy={cy} r={ro} fill="none" stroke={C.purple} strokeWidth={sw} strokeDasharray={dash(ro)} transform={`rotate(-90 ${cx} ${cy})`} />
              </g>
            </g></g>
            {/* callouts, as in the Figma trial: Goal left, Current Rate right, joined by leader lines */}
            <g opacity={dimGoal}>
              <Small x={114} y={126} fill={C.coral} w={600} size={11} opacity={Math.min(1, goalP * 1.5)}>Goal</Small>
              <Big x={109} y={168} fill={C.coral}>{`${Math.round(60 * goalP)}%`}</Big>
              <line x1={218} y1={152} x2={218 + 105 * lab} y2={152} stroke={C.coral} strokeWidth={0.5} />
            </g>
            <g opacity={dimWon}>
              <Small x={552} y={59} fill={C.purple} w={600} size={11} opacity={Math.min(1, wonP * 1.5)}>Current Rate</Small>
              <Big x={548} y={101} fill={C.purple}>{`${(31.9 * wonP).toFixed(1)}%`}</Big>
              <line x1={539} y1={86} x2={539 - 79 * lab} y2={86} stroke={C.purple} strokeWidth={0.5} />
            </g>
          </>
        );
      }}
    </VisualFrame>
  );
}

// =============== 3 · New logos — area, pace line, dotted projection
export function LogosArea({ p }) {
  const { E } = useContext(MotionCtx);
  const base = 178, top = 78;
  const X = (d) => 8 + ((d - 1) / 30) * 700, Y = (v) => base - ((base - top) * v) / 85;
  const pts = [[1, 0], [6, 11], [13, 24], [20, 40], [27, 55]];
  const at = (d) => { for (let i = 1; i < pts.length; i++) if (d <= pts[i][0]) { const [d0, v0] = pts[i - 1], [d1, v1] = pts[i]; return lerp(v0, v1, (d - d0) / (d1 - d0)); } return 55; };
  const proj = (55 / 27) * 31;
  const paceP = E(win(p, 0, 0.38));
  const areaP = E(win(p, 0.18, 0.7));
  const projP = E(win(p, 0.7, 0.88));
  const tgtP = win(p, 0.84, 1);
  const S = SWEEP(win(p, 0.12, 0.78));
  const headD = 1 + 26 * S, sweepX = X(headD);
  const count = Math.round(at(headD));
  const area = `M${X(1)} ${base}` + pts.map(([d, v]) => `L${X(d)} ${Y(v)}`).join("") + `L${X(27)} ${base}Z`;
  const paceNow = (85 * 26) / 30;
  const pick = (x, y) => {
    const d = clamp(Math.round(1 + ((x - 8) / 700) * 30), 1, 31);
    const pace = (85 * (d - 1)) / 30;
    const vv = d <= 27 ? at(d) : 55 + ((proj - 55) * (d - 27)) / 4;
    if (x < 0 || y < Math.min(Y(vv), Y(pace)) - 16 || y > base + 4) return null; // on the area or its lines, not the space above
    if (d <= 27) { const v = at(d); return { d, y: Y(v), tip: { x: X(d), y: Y(v) - 16, align: tipAlign(X(d)), title: `Oct ${d}`, rows: [{ c: C.navyFill, k: "Signed", v: Math.round(v) }, { c: C.axis, k: "Pace", v: Math.round(pace) }] } }; }
    const v = 55 + ((proj - 55) * (d - 27)) / 4;
    return { d, y: Y(v), tip: { x: X(d), y: Y(v) - 16, align: "right", title: `Oct ${d}`, rows: [{ c: C.coral, k: "Projected", v: Math.round(v) }, { c: C.axis, k: "Pace", v: Math.round(pace) }] } };
  };
  return (
    <VisualFrame label="New logos signed this month" pick={pick}>
      {(h) => (
        <>
          <defs><clipPath id="logo-sweep"><rect x={0} y={0} width={sweepX} height={H} /></clipPath></defs>
          <Big x={0} y={40} fill={C.navy}>{count}</Big>
          <line x1={0} y1={base + 0.5} x2={W} y2={base + 0.5} stroke={C.navy} strokeWidth={1} />
          <g clipPath="url(#logo-sweep)">
            <path d={area} fill={C.navyFill} filter="url(#grain)" />
            {[6, 13, 20].map((d) => <line key={d} x1={X(d) + 0.5} y1={Y(at(d))} x2={X(d) + 0.5} y2={base} stroke={C.paper} strokeWidth={1} />)}
          </g>
          {S > 0 && S < 1 && <circle cx={sweepX} cy={Y(at(headD))} r={4} fill={C.navy} stroke={C.paper} strokeWidth={1.5} opacity={Math.min(1, (1 - S) * 12)} />}
          <line x1={X(1)} y1={Y(0)} x2={lerp(X(1), X(31), paceP)} y2={lerp(Y(0), Y(85), paceP)} stroke={C.axis} strokeWidth={1} />
          {[[6, 11], [13, 24], [20, 40]].map(([d, v]) => {
            const s = clamp((sweepX - X(d)) / 30);
            return (
              <g key={d} opacity={s}>
                <line x1={X(d) + 0.5} y1={63} x2={X(d) + 0.5} y2={Y(v)} stroke={C.coral} strokeWidth={1} />
                <circle cx={X(d) + 0.5} cy={Y(v)} r={3 * s} fill={C.coral} stroke={C.paper} strokeWidth={1.5} />
                <Small x={X(d) + 0.5} y={60} fill={C.navy} size={12} anchor="middle">{v}</Small>
              </g>
            );
          })}
          {/* today: gap to pace, then the peak */}
          {(() => { const s = clamp((sweepX - X(27) + 2) / 2); const g = win(p, 0.78, 0.92); return (
            <g opacity={s}>
              <line x1={X(27)} y1={Y(55)} x2={X(27)} y2={lerp(Y(55), Y(paceNow), g)} stroke={C.coral} strokeWidth={2} />
              <circle cx={X(27)} cy={Y(paceNow)} r={3.5 * g} fill={C.coral} />
              <circle cx={X(27)} cy={Y(55)} r={9 * s} fill={C.coral} stroke={C.paper} strokeWidth={2.45} />
              <circle cx={X(27)} cy={Y(55)} r={6 * s} fill={C.coral} stroke={C.paper} strokeWidth={1.6} />
            </g>); })()}
          <line x1={X(27)} y1={Y(55)} x2={lerp(X(27), X(31), projP)} y2={lerp(Y(55), Y(proj), projP)} stroke={C.coral} strokeWidth={1.5} strokeDasharray="2 3" strokeLinecap="round" />
          <g opacity={projP}>
            <circle cx={X(31)} cy={Y(proj)} r={3} fill={C.coral} stroke={C.paper} strokeWidth={1.5} />
            <Small x={711} y={121} fill={C.coral} w={600} size={11} anchor="end">{`${Math.round(proj)} projected`}</Small>
          </g>
          <g opacity={tgtP}>
            <circle cx={X(31)} cy={Y(85)} r={3.5 * clamp(tgtP * 1.4)} fill={C.coral} />
            <Small x={712} y={68} fill={C.coral} w={600} size={11} anchor="end">Target 85</Small>
          </g>
          {[[6, "OCT 6"], [13, "OCT 13"], [20, "OCT 20"], [27, "OCT 27"], [31, "OCT 31"]].map(([d, t]) => (
            <Small key={d} x={d === 31 ? W : X(d)} y={198} anchor={d === 31 ? "end" : "middle"} fill={d === 27 ? C.coral : C.axis} w={d === 27 ? 600 : 500} opacity={win(p, 0, 0.3)}>{t}</Small>
          ))}
          {h && (
            <g pointerEvents="none">
              <line x1={X(h.d)} y1={top - 10} x2={X(h.d)} y2={base} stroke={C.navy} strokeWidth={0.5} strokeDasharray="2 2" />
              <circle cx={X(h.d)} cy={h.y} r={3.5} fill={C.paper} stroke={h.d > 27 ? C.coral : C.navy} strokeWidth={1.5} />
            </g>
          )}
        </>
      )}
    </VisualFrame>
  );
}

// =============== 4 · Win rate from held demo — ranking ruler
// the ruler: one value against its target on a scale; the gap between them lights up. Held-demo win rate is the default.
const DEMO_RULER = { you: 19.9, target: 23.5, lo: 0, hi: 30, ticks: [0, 10, 20, 30], pre: "", suf: "%", dec: 1, label: "Held demo win rate against target" };
export function DemoRuler({ p, d: cfg = DEMO_RULER }) {
  const { E, spread } = useContext(MotionCtx);
  const N = 181, lo = cfg.lo, hi = cfg.hi, per = (hi - lo) / (N - 1), ty = 145, th = 40;
  const X = (v) => ((v - lo) / per) * 4, f = (v) => `${cfg.pre}${v.toFixed(cfg.dec)}${cfg.suf}`, tk = (v) => `${cfg.pre}${+v.toFixed(2)}${cfg.suf}`;
  const meterP = E(win(p, 0.05, 0.6));
  const gapP = win(p, 0.55, 0.85);
  const tgtP = win(p, 0.78, 1);
  const youV = lo + (cfg.you - lo) * meterP, ahead = cfg.lowerBetter ? cfg.you <= cfg.target : cfg.you >= cfg.target;
  const gA = Math.min(cfg.you, cfg.target), gB = Math.max(cfg.you, cfg.target), gapCol = ahead ? C.teal : C.coral;
  const [kc, setKc] = useState(null);
  const keys = useKeyField(N, 4, kc);
  const lift = useContext(MotionCtx).D.keys.lift;
  const pick = (x, y) => {
    if (y < ty - 20 || y > ty + th + 4) return null; // on the ruler only
    const v = clamp(lo + (x / W) * (hi - lo), lo, hi);
    const d = cfg.target - v, unit = cfg.suf === "%" ? " pts" : "";
    return { v, tip: { x, y: ty - 26, align: tipAlign(x), title: f(v), rows: [d > 0 ? { c: cfg.lowerBetter ? C.teal : C.coral, k: `${cfg.pre}${Math.abs(d).toFixed(cfg.dec)}${unit || cfg.suf} below target` } : { c: cfg.lowerBetter ? C.coral : C.teal, k: `${cfg.pre}${(-d).toFixed(cfg.dec)}${unit || cfg.suf} above target` }] } };
  };
  return (
    <VisualFrame label={cfg.label} pick={(x, y) => { const r = pick(x, y); setKc(r ? x : null); return r; }}>
      {(h) => (
        <>
          <Big x={0} y={40} fill={C.purple}>{f(youV)}</Big>
          <rect x={0} y={ty} width={W} height={th} fill={C.paper} />
          <g>
            {Array.from({ length: N }, (_, i) => {
              const v = i * per, x = Math.min(W - 1, i * 4 + 0.5);
              const vv = lo + v;
              if (vv <= youV + 1e-6) return null;
              const gi = vv >= gA && vv <= gB ? stag(gapP, Math.round((vv - gA) / per), Math.max(1, Math.round((gB - gA) / per)), spread) : 0;
              const up = lift * keys[i];
              return <rect key={i} x={x} y={ty - up} width={1} height={th + up} fill={gi > 0 ? mixHex(C.line, gapCol, gi) : C.line} />;
            })}
          </g>
          <g filter="url(#grain)">
            {Array.from({ length: N }, (_, i) => {
              const v = i * per;
              const up = lift * keys[i];
              return lo + v <= youV + 1e-6 ? <rect key={i} x={i * 4} y={ty - up} width={2} height={th + up} fill={C.purple} /> : null;
            })}
          </g>
          <g opacity={win(p, 0.55, 0.7)}>
            <line x1={X(cfg.you)} y1={129} x2={X(cfg.you)} y2={185} stroke={C.purple} strokeWidth={1.5} />
            <Small x={X(cfg.you) + (cfg.you > cfg.target ? 4 : -4)} y={137} fill={C.purple} w={600} size={11} anchor={cfg.you > cfg.target ? "start" : "end"}>{cfg.youLabel || "You"}</Small>
          </g>
          <g opacity={tgtP} transform={`translate(0 ${-8 * (1 - E(tgtP))})`}>
            <line x1={X(cfg.target)} y1={129} x2={X(cfg.target)} y2={185} stroke={C.coral} strokeWidth={1.5} />
            <circle cx={X(cfg.target)} cy={129} r={3.5} fill={C.coral} />
            <Small x={X(cfg.target) + (cfg.you > cfg.target ? -8 : 8)} y={137} fill={C.coral} w={600} size={11} anchor={cfg.you > cfg.target ? "end" : "start"}>{`Target ${f(cfg.target)}`}</Small>
          </g>
          {cfg.ticks.map((v) => <Small key={v} x={v === hi ? W : X(v)} y={202} anchor={v === lo ? "start" : v === hi ? "end" : "middle"} fill={C.mute} opacity={win(p, 0, 0.3)}>{tk(v)}</Small>)}
        </>
      )}
    </VisualFrame>
  );
}

// =============== 5 · Expansion ARR — booked vs pace, striped bands
const EXP_LINES = { book: [[1, 0], [6, 0.095], [13, 0.26], [20, 0.48], [27, 0.734]], goal: [[1, 0], [31, 1.174]], max: 1.2, ticks: [0, 0.4, 0.8, 1.2], today: 27,
  big: [734.0, "K", 1, "booked"], sub: [1.01, "M", 2, "pace by now"], target: "$1.17M target", rowsK: ["Booked", "Pace"], label: "Expansion ARR booked against pace" };
export function ExpansionLines({ p, d: cfg = EXP_LINES, narrow = false, bare = false }) {
  const { E } = useContext(MotionCtx);
  // bare: the numbers sit above the chart (in the card), the chart takes the full width and height
  // narrow (docked chat): the two numbers become one quiet line above, and the chart takes the full width
  const x0 = bare || narrow ? 52 : 296, x1 = 719, top = narrow && !bare ? 48 : 22, base = 172, max = cfg.max, T = cfg.today;
  const X = (d) => x0 + ((d - 1) / 30) * (x1 - x0), Y = (v) => base - ((base - top) * v) / max;
  const goal = cfg.goal, book = cfg.book, bEnd = book[book.length - 1][1], gEnd = goal[goal.length - 1][1];
  const money = (v) => (v === 0 ? "$0" : v >= 1 ? `$${+v.toFixed(2)}M` : `$${Math.round(v * 1000)}K`);
  const at = (pts, d) => { for (let i = 1; i < pts.length; i++) if (d <= pts[i][0]) { const [a, va] = pts[i - 1], [b, vb] = pts[i]; return lerp(va, vb, (d - a) / (b - a)); } return pts[pts.length - 1][1]; };
  const path = (pts) => pts.map(([d, v], i) => `${i ? "L" : "M"}${X(d)} ${Y(v)}`).join("");
  const areaOf = (pts) => path(pts) + `L${X(pts[pts.length - 1][0])} ${base}L${X(1)} ${base}Z`;
  const sweep = SWEEP(win(p, 0.06, 0.82));
  const dSweep = 1 + 30 * sweep;
  const sx = X(dSweep);
  const bookA = book, goalA = goal;
  const bookedNow = at(book, Math.min(T, dSweep)), paceNow = at(goal, Math.min(T, dSweep)), paceT = at(goal, T);
  const stripes = [];
  for (let x = x0 + 2; x < x1; x += 4) stripes.push(x);
  const pick = (x, y) => {
    if (x < x0 - 4) return null;
    const d = clamp(Math.round(1 + ((x - x0) / (x1 - x0)) * 30), 1, 31);
    const pv = at(goal, d), lineY = Math.min(Y(pv), d <= T ? Y(at(book, d)) : base);
    if (y < lineY - 16 || y > base + 4) return null; // on the lines or the fill under them, not the space above
    const rows = [{ c: C.coral, k: cfg.rowsK[1], v: money(pv) }];
    if (d <= T) { const bv = at(book, d); rows.unshift({ c: C.navy, k: cfg.rowsK[0], v: money(bv) }); rows.push({ k: "Gap", v: money(Math.abs(pv - bv)) }); }
    return { d, tip: { x: X(d), y: Y(pv) - 14, align: tipAlign(X(d)), title: d === T ? `Today · Oct ${T}` : `Oct ${d}`, rows } };
  };
  return (
    <VisualFrame label={cfg.label} pick={pick}>
      {(h) => (
        <>
          <defs>
            <clipPath id="exp-sweep"><rect x={0} y={0} width={sx} height={H} /></clipPath>
            <clipPath id="exp-goal"><path d={areaOf(goalA)} /></clipPath>
            <clipPath id="exp-book"><path d={areaOf(bookA)} /></clipPath>
          </defs>
          {bare ? null : !narrow ? <>
          <text x={0} y={40} fill={C.navy}>
            <tspan fontSize={48} letterSpacing="-0.03em">{`$${(cfg.big[0] * win(bookedNow / bEnd, 0, 1)).toFixed(cfg.big[2])}${cfg.big[1]}`}</tspan>
            <tspan dx={8} fontSize={13}>{cfg.big[3]}</tspan>
          </text>
          <text x={0} y={86} fill={C.coral}>
            <tspan fontSize={32} letterSpacing="-0.03em">{`$${(cfg.sub[0] * win(paceNow / paceT, 0, 1)).toFixed(cfg.sub[2])}${cfg.sub[1]}`}</tspan>
            <tspan dx={8} fontSize={13}>{cfg.sub[3]}</tspan>
          </text></> : (
          <text x={0} y={20} fontSize={22}>
            <tspan fill={C.navy} fontWeight={600}>{`$${cfg.big[0].toFixed(cfg.big[2])}${cfg.big[1]}`}</tspan><tspan fill={C.navy} dx={6}>{cfg.big[3]}</tspan>
            <tspan fill={C.coral} dx={18} fontWeight={600}>{`$${cfg.sub[0].toFixed(cfg.sub[2])}${cfg.sub[1]}`}</tspan><tspan fill={C.coral} dx={6}>{cfg.sub[3]}</tspan>
          </text>)}
          {cfg.ticks.map((v) => (
            <g key={v} opacity={win(p, 0, 0.25)}>
              <line x1={x0} y1={Y(v) + 0.25} x2={x1} y2={Y(v) + 0.25} stroke={v === 0 ? "#c9c4bf" : C.line} strokeWidth={v === 0 ? 1 : 0.5} />
              <Small x={x0 - 8} y={Y(v) + 3.5} anchor="end">{money(v)}</Small>
            </g>
          ))}
          <g clipPath="url(#exp-sweep)">
            <g clipPath="url(#exp-goal)">{stripes.map((x) => <line key={x} x1={x} y1={top} x2={x} y2={base} stroke={C.coral} strokeOpacity={0.45} strokeWidth={0.5} />)}</g>
            <g clipPath="url(#exp-book)">
              <rect x={x0} y={top} width={x1 - x0} height={base - top} fill={C.paper} />
              {stripes.map((x) => <line key={x} x1={x} y1={top} x2={x} y2={base} stroke={C.navy} strokeOpacity={0.35} strokeWidth={0.5} />)}
            </g>
            <path d={path(goalA)} fill="none" stroke={C.coral} strokeWidth={1.25} />
            <path d={path(bookA)} fill="none" stroke={C.navy} strokeWidth={1.25} />
          </g>
          {sweep > 0 && sweep < 1 && (
            <g opacity={Math.min(1, (1 - sweep) * 12)}>
              <circle cx={sx} cy={Y(at(goal, dSweep))} r={3.5} fill={C.coral} stroke={C.paper} strokeWidth={1.5} />
              {dSweep < T && <circle cx={sx} cy={Y(at(book, dSweep))} r={3.5} fill={C.navy} stroke={C.paper} strokeWidth={1.5} />}
            </g>
          )}
          {(() => { const s = clamp((dSweep - T) * 1.2); return <circle cx={X(T)} cy={Y(bEnd)} r={4.5 * s} fill={C.navy} stroke={C.paper} strokeWidth={1.5} />; })()}
          <g opacity={clamp((dSweep - 30.2) * 2)}>
            <circle cx={X(31)} cy={Y(gEnd)} r={3.5} fill={C.coral} stroke={C.paper} strokeWidth={1.5} />
            <Small x={708} y={19} fill={C.coral} w={600} size={11} anchor="end">{cfg.target}</Small>
          </g>
          {(narrow ? [[1, "Oct 1"], [15, "Oct 15"], [T, "Today"], [31, "Oct 31"]] : [[1, "Oct 1"], [8, "Oct 8"], [15, "Oct 15"], [T, "Today"], [31, "Oct 31"]]).filter(([d, t]) => t === "Today" || d === 1 || Math.abs(d - T) > 3).map(([d, t]) => (
            <Small key={d + t} x={d === 1 ? x0 : d === 31 ? x1 : X(d)} y={190} anchor={d === 1 ? "start" : d === 31 ? "end" : "middle"} fill={d === T ? C.navy : C.axis} w={d === T ? 600 : 500} opacity={win(p, 0, 0.3)}>{t}</Small>
          ))}
          {h && (
            <g pointerEvents="none">
              <line x1={X(h.d)} y1={top} x2={X(h.d)} y2={base} stroke={C.navy} strokeWidth={0.5} strokeDasharray="2 2" />
              {h.d <= T && <circle cx={X(h.d)} cy={Y(at(book, h.d))} r={3.5} fill={C.paper} stroke={C.navy} strokeWidth={1.5} />}
              <circle cx={X(h.d)} cy={Y(at(goal, h.d))} r={3.5} fill={C.paper} stroke={C.coral} strokeWidth={1.5} />
            </g>
          )}
        </>
      )}
    </VisualFrame>
  );
}

// =============== 6 · TTV — two lollipops and the overrun between them
export function TtvLollipop({ p }) {
  const { E, spread } = useContext(MotionCtx);
  const base = 185, X = (d) => (d / 30) * 715 + 4;
  // axis lays down → both lollipops rise together at the middle of the gap → they split apart to 15d and 20.9d,
  // and the gap opens between them: gradient band and its "days" grow with the split
  const axisP = win(p, 0, 0.28);
  const riseP = E(win(p, 0.16, 0.42));
  const openP = SWEEP(win(p, 0.4, 0.86));
  const mid = (15 + 20.9) / 2;
  const tD = lerp(mid, 15, openP), cD = lerp(mid, 20.9, openP), gapD = cD - tD;
  const numP = win(p, 0.1, 0.32);
  const stemTop = 120.5, stemY = lerp(base, stemTop, riseP);
  const pick = (x, y) => {
    if (Math.abs(x - X(15)) < 10 && y > 100) return { on: "t", tip: { x: X(15), y: stemTop - 14, title: "Target · 15 days", rows: [{ c: C.coral, k: "Days to 10 handoffs" }] } };
    if (Math.abs(x - X(20.9)) < 10 && y > 100) return { on: "a", tip: { x: X(20.9), y: stemTop - 14, title: "Current · 20.9 days", rows: [{ c: C.purple, k: "Average across accounts" }] } };
    if (x > X(15) && x < X(20.9) && y > 150) return { on: "b", tip: { x: (X(15) + X(20.9)) / 2, y: 150, title: "+5.9 days", rows: [{ c: C.coral, k: "39% over target" }] } };
    return null;
  };
  return (
    <VisualFrame label="Days to 10 handoffs against target" pick={pick}>
      {(h) => (
        <>
          <defs>
            <linearGradient id="ttv-band" x1="0" x2="1"><stop offset="0" stopColor={C.coral} /><stop offset="1" stopColor={C.purple} /></linearGradient>
          </defs>
          <g opacity={numP} transform={`translate(0 ${-6 * (1 - E(numP))})`}>
            <text x={0} y={34} fontSize={40} letterSpacing="-0.03em" fill={C.purple}>Current: 20.9d</text>
            <text x={1} y={80} fontSize={40} letterSpacing="-0.03em" fill={C.coral}>Target: 15d</text>
          </g>
          <line x1={0} y1={base + 0.25} x2={W * axisP} y2={base + 0.25} stroke={C.edge} strokeWidth={0.5} />
          {Array.from({ length: 31 }, (_, d) => {
            const s2 = stag(axisP, d, 31, spread);
            const tall = d % 5 === 0;
            return <rect key={d} x={X(d)} y={base - (tall ? 8 : 4) * s2} width={1} height={(tall ? 8 : 4) * s2} fill={tall ? "#b5b5b5" : C.edge} />;
          })}
          {[0, 5, 10, 15, 20, 25, 30].map((d) => <Small key={d} x={d === 0 ? 0 : d === 30 ? W : X(d)} y={204} anchor={d === 0 ? "start" : d === 30 ? "end" : "middle"} opacity={axisP}>{d === 0 ? "0 days" : d === 30 ? "30 days" : d}</Small>)}
          {gapD > 0.05 && (
            <g filter="url(#grain)" opacity={h && h.on !== "b" ? 0.5 : 1}>
              <rect x={X(tD)} y={166} width={X(cD) - X(tD)} height={19} fill="url(#ttv-band)" />
            </g>
          )}
          <Small x={X(mid)} y={179} fill={C.paper} w={600} size={11} anchor="middle" opacity={win(openP, 0.45, 0.8)}>{`${gapD.toFixed(1)} days`}</Small>
          <g opacity={h && h.on === "a" ? 0.4 : 1}>
            <line x1={X(tD)} y1={base} x2={X(tD)} y2={stemY} stroke={C.coral} strokeWidth={1} />
            <circle cx={X(tD)} cy={stemY} r={3.5 * clamp(riseP * 3)} fill={C.coral} stroke={C.paper} strokeWidth={1.5} />
          </g>
          <g opacity={h && h.on === "t" ? 0.4 : 1}>
            <line x1={X(cD)} y1={base} x2={X(cD)} y2={stemY} stroke={C.purple} strokeWidth={1} />
            <circle cx={X(cD)} cy={stemY} r={3.5 * clamp(riseP * 3)} fill={C.purple} stroke={C.paper} strokeWidth={1.5} />
          </g>
        </>
      )}
    </VisualFrame>
  );
}
