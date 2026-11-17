// Shared motion + format helpers for the North prototype.
import { useEffect, useRef, useState } from "react";
import { animate } from "motion/react";

export const C = {
  navy: "#093555",
  navyFill: "#1f4b70",
  mtd: "#7395b3",
  ink: "#545454",
  mute: "#8a8a8a",
  axis: "#929292",
  line: "#e2e2e2",
  edge: "#d3d3d3",
  well: "#ededed",
  paper: "#fefbf9",
  coral: "#ff725c",
  purple: "#6d4fc2",
  teal: "#098486",
  alert: "#b1042f",
};

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// cubic-bezier solver, so DialKit easing curves drive per-element motion
export function bezier(p) {
  const [x1, y1, x2, y2] = p && p.length === 4 ? p : [0.22, 1, 0.36, 1];
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = sx(t) - x;
      if (Math.abs(e) < 1e-5) break;
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    return sy(clamp(t));
  };
}

// i-th of n elements, sharing one 0→1 progress. spread = how much of the run is staggered.
export function stag(p, i, n, spread) {
  const t0 = n > 1 ? (i / (n - 1)) * spread : 0;
  const d = Math.max(0.0001, 1 - spread);
  return clamp((p - t0) / d);
}

// window a progress value: local 0→1 between a and b
export const win = (p, a, b) => clamp((p - a) / (b - a));

// DialKit returns {type:'easing'} or {type:'spring'}; Motion wants plain transitions
export function toMotion(t, fallback = { type: "spring", visualDuration: 0.4, bounce: 0.15 }) {
  if (!t) return fallback;
  if (t.type === "easing") return { duration: t.duration ?? 0.4, ease: t.ease ?? [0.22, 1, 0.36, 1] };
  if (t.type === "spring") {
    const { type, ...rest } = t;
    return { type: "spring", ...rest };
  }
  return t;
}

export const prefersReduced = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Animated 0→1 that (re)starts whenever `key` changes. Starts at 1 on first mount unless fromZero.
export function useReplay(key, transition, { fromZero = true, delay = 0, reduced = false } = {}) {
  const [p, setP] = useState(fromZero && !reduced ? 0 : 1);
  const ctl = useRef(null);
  useEffect(() => {
    if (reduced) { setP(1); return; }
    setP(0);
    ctl.current && ctl.current.stop();
    ctl.current = animate(0, 1, { ...toMotion(transition), delay, onUpdate: setP });
    return () => ctl.current && ctl.current.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return p;
}

// Spring a number toward a target (for morphs/toggles)
export function useSpringTo(target, transition) {
  const [v, setV] = useState(target);
  const cur = useRef(target);
  useEffect(() => {
    const c = animate(cur.current, target, {
      ...toMotion(transition),
      onUpdate: (x) => { cur.current = x; setV(x); },
    });
    return () => c.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return v;
}

export const fmtK = (v, dp = 1) => `$${v.toFixed(dp)}K`;
export const fmtM = (v, dp = 2) => `$${v.toFixed(dp)}M`;
export const fmtPct = (v, dp = 1) => `${v.toFixed(dp)}%`;

// hover with grace: moving between bars (or briefly off one) doesn't flick the tooltip off and on — it lets go only after a beat,
// and any new bar picked up in the meantime takes over at once
export function useGraceHover(ms = 180) {
  const [h, setH] = useState(null);
  const t = useRef(0);
  const set = useRef((v) => { clearTimeout(t.current); if (v == null) t.current = setTimeout(() => setH(null), set.ms); else setH(v); }).current;
  set.ms = ms;
  useEffect(() => () => clearTimeout(t.current), []);
  return [h, set];
}
