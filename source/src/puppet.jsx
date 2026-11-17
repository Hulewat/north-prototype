// The crew on the Agents board, as puppets. Each figure is cut into a head, a coat and two shoes (crew.js PUPPETS); the legs are
// drawn sticks from hip to ankle. A small engine per figure decides what it does next: walk somewhere along the walkway, or stand
// and do one of its own gestures. Feet only move while they're in the air, so nothing slides: the planted foot stays put while
// the body passes over it. Working pulls a figure back to its station, where it has its own working gestures.
import React, { useEffect, useRef } from "react";
import { PUPPETS } from "./crew.js";

// per character: step time (s), stride / foot lift / hip waddle (sprite px at 300 tall), lean into the walk (deg),
// idle and working gesture pools, and how long a stand lasts (s). Orin likes his legs crossed when he stands.
const STYLE = {
  orin:   { step: 0.48, stride: 15, lift: 9,  waddle: 2.6, lean: 1.6, idle: ["look", "nod", "tap", "still", "look"], work: ["focus", "focus", "tap"], stand: [2.6, 5], cross: true },
  calvin: { step: 0.36, stride: 17, lift: 11, waddle: 4.5, lean: 2.4, idle: ["groove", "bob", "groove", "look"], work: ["bob", "groove", "focus"], stand: [2.2, 4.2], strut: 1.6 },
  riley:  { step: 0.33, stride: 15, lift: 8,  waddle: 1.8, lean: 2.2, idle: ["impatient", "turn", "impatient", "still"], work: ["impatient", "quick", "quick"], stand: [1.8, 3.6] },
  marco:  { step: 0.5,  stride: 13, lift: 8,  waddle: 3.6, lean: 1, idle: ["sway", "tilt", "sway", "look"], work: ["sway", "focus"], stand: [3, 5.5] },
  fia:    { step: 0.62, stride: 11, lift: 6,  waddle: 1.6, lean: 0.6, idle: ["breathe", "tilt", "breathe"], work: ["breathe", "focus"], stand: [4, 7] },
};

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = (p) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(p));
const sin = Math.sin, PI = Math.PI, TAU = PI * 2;
const pulse = (t, per, duty = 1) => { const p = (t % per) / per; return p < duty ? sin(PI * p / duty) : 0; }; // 0→1→0 bumps
const hold = (t, keys, per) => { // walk through key values, easing between them (each held for `per` seconds)
  const i = Math.floor(t / per), f = (t / per) - i, a = keys[i % keys.length], b = keys[(i + 1) % keys.length];
  return a + (b - a) * ease(clamp((f - 0.6) / 0.4));
};

// gestures: t is seconds into the stand. They return pose offsets (deg, sprite px); the engine fades them in and out.
const G = {
  still: (t) => ({ sy: 1 + 0.006 * sin(TAU * t / 3.4), hr: 0.6 * sin(TAU * t / 5) }),
  breathe: (t) => ({ sy: 1 + 0.014 * sin(TAU * t / 3.2), hr: 2.2 * sin(TAU * t / 6.4), tr: 0.6 * sin(TAU * t / 6.4 + 1) }),
  nod: (t) => { const n = t % 2.4 < 1.3 ? pulse(t % 2.4, 0.65) : 0; return { hy: 2.6 * n * n, hr: -0.8 * n }; },
  focus: (t) => { const n = pulse(t, 1.5, 0.5); return { hy: 1.4 + 1.8 * n, hr: -1.2 + 0.8 * sin(TAU * t / 4) }; }, // head down, reading, small nods
  quick: (t) => { const n = pulse(t % 1.6, 0.4); return { hy: 1 + (t % 1.6 < 0.8 ? 1.6 * n : 0), hr: -1.5 }; },
  look: (t) => { const v = hold(t, [0, -1, -1, 0, 1, 1], 0.9); return { hx: 3.4 * v, hs: 1 - 0.04 * Math.abs(v), hr: 1.8 * v }; },
  turn: (t) => { const v = hold(t, [0, 1, 1, 1, 0, -1, -1, 0], 0.45); return { hx: 3.8 * v, hs: 1 - 0.05 * Math.abs(v), hr: 1.2 * v, tr: -0.6 * v }; },
  tilt: (t) => { const v = hold(t, [0, 1, 1, 1, 0, 0, -1, -1, 0], 0.8); return { hr: 6 * v, hx: 0.8 * v, tr: -0.8 * v }; },
  tap: (t) => { const on = t % 2.6 < 1.6; return { lift: [0, on ? 3 * Math.abs(sin(PI * t / 0.4)) : 0], hr: on ? 0.6 * sin(TAU * t / 0.8) : 0 }; },
  impatient: (t) => { const on = t % 2.2 < 1.5; return { lift: [on ? 2.6 * Math.abs(sin(PI * t / 0.26)) : 0, 0], hr: -3, hx: -0.6, tr: 1.2 }; },
  groove: (t) => { const b = 0.5 - 0.5 * Math.cos(TAU * t / 0.5); return { ty: 2.6 * b, tr: 3 * sin(TAU * t / 1), hr: -2.4 * sin(TAU * t / 1 + 0.5), lift: [sin(TAU * t / 1) > 0.75 ? 2 : 0, sin(TAU * t / 1) < -0.75 ? 2 : 0] }; },
  bob: (t) => { const b = Math.abs(sin(PI * t / 0.5)); return { hy: 1.4 * b, hr: 1.6 * sin(PI * t / 0.5), ty: 0.8 * b }; },
  sway: (t) => ({ tr: 3 * sin(TAU * t / 2.8), hr: -1.8 * sin(TAU * t / 2.8 - 0.7), hx: 0.6 * sin(TAU * t / 2.8) }),
};

function mulberry(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// a glossy black shoe seen from the front: narrow at the ankle, a round toe box that sits a little outward, a flat sole
const Shoe = ({ x, y, w, dx, id }) => {
  const h = 15, c = x + dx, a = w * 0.26;
  const d = `M${x - a} ${y} C${x - a} ${y + h * 0.3} ${c - w / 2} ${y + h * 0.36} ${c - w / 2} ${y + h * 0.7} C${c - w / 2} ${y + h * 0.93} ${c - w * 0.32} ${y + h} ${c} ${y + h} C${c + w * 0.32} ${y + h} ${c + w / 2} ${y + h * 0.93} ${c + w / 2} ${y + h * 0.7} C${c + w / 2} ${y + h * 0.36} ${x + a} ${y + h * 0.3} ${x + a} ${y} Z`;
  return <>
    <path d={d} fill={`url(#pp-shoe-${id})`} />
    <path d={`M${c - w * 0.42} ${y + h * 0.9} Q${c} ${y + h * 1.02} ${c + w * 0.42} ${y + h * 0.9}`} fill="none" stroke="#3a3a3a" strokeWidth="0.9" strokeLinecap="round" opacity=".7" />
    <ellipse cx={c - w * 0.17} cy={y + h * 0.56} rx={w * 0.15} ry={h * 0.11} fill="#fff" opacity=".42" transform={`rotate(-18 ${c - w * 0.17} ${y + h * 0.56})`} />
    <ellipse cx={c + w * 0.2} cy={y + h * 0.64} rx={w * 0.05} ry={h * 0.05} fill="#fff" opacity=".35" />
  </>;
};

// where the light sits in each coat (sprite px: x, y, radius). Working, it pulses there; idle, it rests at what's baked in.
const GLOW = { orin: [55, 137, 26], calvin: [71, 160, 32], fia: [47, 180, 30], riley: [70, 163, 28], marco: [64, 171, 34] };

export function Puppet({ id, h, work = false, roam = 0, seed = 1, host, color = "#7aa", march = false }) {
  const P = PUPPETS[id], S = STYLE[id] || STYLE.orin, w = Math.round(h * P.w / P.h);
  const r = { glow: useRef(null), root: useRef(null), torso: useRef(null), head: useRef(null), shadow: useRef(null), leg: [useRef(null), useRef(null)], shoe: [useRef(null), useRef(null)], lg: [useRef(null), useRef(null)] };
  const live = useRef({ work, roam, h, march }); live.current = { work, roam, h, march };
  const cx = (P.hip[0] + P.hip[1]) / 2, cy = P.hem, [nx, ny] = P.neck;
  const crossOff = S.cross ? [P.ankle[1] - P.ankle[0], P.ankle[0] - P.ankle[1]] : [0, 0];

  useEffect(() => {
    const rnd = mulberry(seed * 9973 + 7), pick = (a) => a[Math.floor(rnd() * a.length)], span = (a) => a[0] + rnd() * (a[1] - a[0]);
    const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    let bx = 0, fw = [0, 0], c = S.cross ? 1 : 0, mode = null, lastWalk = false, raf = 0, glow = live.current.work ? 1 : 0, marched = false;
    const now = () => performance.now() / 1000;

    const draw = (bxNow, rel, p, cc) => {
      const s = live.current.h / P.h, el = host?.current || r.root.current;
      if (el) el.style.transform = `translateX(${((live.current.march || marched ? 0 : bxNow) * s).toFixed(2)}px)`;
      const tr = p.tr || 0, ty = p.ty || 0, sy = p.sy || 1, a = tr * PI / 180, co = Math.cos(a), si = Math.sin(a);
      r.torso.current?.setAttribute("transform", `translate(0 ${ty.toFixed(2)}) rotate(${tr.toFixed(2)} ${cx} ${cy}) translate(${cx} ${cy}) scale(1 ${sy.toFixed(4)}) translate(${-cx} ${-cy})`);
      r.head.current?.setAttribute("transform", `translate(${(p.hx || 0).toFixed(2)} ${(p.hy || 0).toFixed(2)}) rotate(${(p.hr || 0).toFixed(2)} ${nx} ${ny}) translate(${nx} ${ny}) scale(${(p.hs || 1).toFixed(3)} 1) translate(${-nx} ${-ny})`);
      const lift = p.lift || [0, 0];
      for (let i = 0; i < 2; i++) {
        const dx = P.hip[i] - cx, dy = (P.hem - 5 - cy) * sy, hx = cx + dx * co - dy * si, hy = cy + dx * si + dy * co + ty;
        const off = rel[i] + crossOff[i] * cc, ax = P.ankle[i] + off, ay = P.ankleY - lift[i];
        const L = r.leg[i].current; if (L) { L.setAttribute("x1", hx.toFixed(2)); L.setAttribute("y1", hy.toFixed(2)); L.setAttribute("x2", ax.toFixed(2)); L.setAttribute("y2", ay.toFixed(2)); }
        const sh = r.shoe[i].current; if (sh) sh.setAttribute("transform", `translate(${off.toFixed(2)} ${(-lift[i]).toFixed(2)})`);
      }
      const sd = r.shadow.current; if (sd) { const m = (rel[0] + rel[1]) / 2 * s, up = Math.max(lift[0], lift[1]) / (S.lift || 8); sd.style.transform = `translateX(${m.toFixed(2)}px) scale(${(1 - 0.07 * up).toFixed(3)}, ${(1 - 0.12 * up).toFixed(3)})`; }
    };

    const stand = (t, g) => ({ k: "stand", t0: t, dur: span(S.stand), g, work: live.current.work });
    const walkTo = (t, target) => {
      const dist = target - bx, dir = Math.sign(dist) || 1, n = Math.max(1, Math.round(Math.abs(dist) / S.stride)), d = dist / n, lead = dir > 0 ? 1 : 0, steps = [];
      for (let k = 0; k < n; k++) steps.push({ f: (lead + k) % 2, b0: bx + d * k, b1: bx + d * (k + 1), to: bx + d * (k + 1) + (k < n - 1 ? d * 0.35 : 0) });
      steps.push({ f: (lead + n) % 2, b0: bx + dist, b1: bx + dist, to: bx + dist }); // bring the trailing foot alongside
      return { k: "walk", steps, i: 0, t0: t, dir };
    };
    const next = (t) => {
      const { work: wk, roam: R } = live.current;
      // marching: something else is carrying the figure across the world, so it just keeps stepping (legs uncrossed)
      if (live.current.march) { if (c > 0.5) return { k: "cross", t0: t, to: 0 }; marched = true; return walkTo(t, bx + S.stride * 6); }
      if (marched) { marched = false; bx = 0; fw = [0, 0]; }
      if (wk) {
        if (Math.abs(bx) > 2) return c > 0.5 ? { k: "cross", t0: t, to: 0 } : walkTo(t, 0);
        if (S.cross && c < 0.5) return { k: "cross", t0: t, to: 1 };
        lastWalk = false; return stand(t, pick(S.work));
      }
      const go = R > 4 && (lastWalk ? rnd() < 0.25 : rnd() < 0.7);
      if (go) {
        if (c > 0.5) return { k: "cross", t0: t, to: 0 };
        let tgt = bx; for (let tries = 0; tries < 6 && Math.abs(tgt - bx) < R * 0.35; tries++) tgt = (rnd() * 2 - 1) * R;
        lastWalk = true; return walkTo(t, tgt);
      }
      if (S.cross && c < 0.5) return { k: "cross", t0: t, to: 1 };
      lastWalk = false; return stand(t, pick(S.idle));
    };

    const frame = () => {
      const t = now(); let bxNow = bx, rel = [fw[0] - bx, fw[1] - bx], p = {}, cc = c;
      if (!mode) mode = stand(t - rnd() * 2, pick(live.current.work ? S.work : S.idle));
      if (mode.k === "stand") {
        const lt = t - mode.t0;
        if (live.current.march && mode.dur > lt + 0.15) mode.dur = lt + 0.15; // set off promptly
        if (mode.work !== live.current.work) { mode.dur = Math.min(mode.dur, lt + 0.45); mode.work = live.current.work; }
        const e = ease(lt / 0.5) * ease((mode.dur - lt) / 0.5), g = G[mode.g](lt);
        p = { tr: (g.tr || 0) * e, ty: (g.ty || 0) * e, sy: 1 + ((g.sy || 1) - 1) * e, hr: (g.hr || 0) * e, hx: (g.hx || 0) * e, hy: (g.hy || 0) * e, hs: 1 + ((g.hs || 1) - 1) * e, lift: g.lift ? [g.lift[0] * e, g.lift[1] * e] : [0, 0] };
        if (S.cross && c > 0.5) p.lift = [0, 0]; // crossed legs don't tap
        if (lt >= mode.dur) mode = next(t);
      } else if (mode.k === "cross") {
        const q = clamp((t - mode.t0) / 0.7), from = 1 - mode.to; // one foot, then the other, each lifted while it moves
        const q0 = clamp(q / 0.5), q1 = clamp((q - 0.5) / 0.5), lift = [4 * sin(PI * q0), 4 * sin(PI * q1)];
        cc = from + (mode.to - from) * (q < 0.5 ? 0.5 * ease(q0) : 0.5 + 0.5 * ease(q1));
        p = { lift, tr: 1.2 * sin(PI * q0) - 1.2 * sin(PI * q1), hr: -0.6 * sin(PI * q0) + 0.6 * sin(PI * q1) };
        if (q >= 1) { c = mode.to; cc = c; mode = next(t); }
      } else if (mode.k === "walk") {
        let st = mode.steps[mode.i], q = (t - mode.t0) / S.step;
        while (q >= 1) { fw[st.f] = st.to; bx = st.b1; mode.i++; mode.t0 += S.step; if (mode.i >= mode.steps.length) break; st = mode.steps[mode.i]; q = (t - mode.t0) / S.step; }
        if (mode.i >= mode.steps.length) { fw = [bx, bx]; rel = [0, 0]; bxNow = bx; mode = next(t); }
        else {
          const from = fw[st.f], f = [fw[0], fw[1]], last = mode.i === mode.steps.length - 1;
          f[st.f] = from + (st.to - from) * ease(q);
          bxNow = st.b0 + (st.b1 - st.b0) * (mode.i === 0 ? q * q * (2 - q) * 0.5 + q * 0.5 : q);
          rel = [f[0] - bxNow, f[1] - bxNow];
          const sw = st.f === 0 ? 1 : -1, lean = last ? 0 : mode.dir * S.lean, up = sin(PI * clamp(q));
          const lift = [0, 0]; lift[st.f] = (last ? 0.6 : 1) * S.lift * up;
          p = { lift, tr: sw * S.waddle * up + lean, hr: -0.45 * (sw * S.waddle * up) + 0.4 * lean, ty: S.strut ? S.strut * (1 - up) : 0 };
        }
      }
      // the coat's light: eases up when it starts working, then breathes with the work; eases out when it's idle
      glow += ((live.current.work ? 1 : 0) - glow) * 0.04;
      const gl = r.glow.current; if (gl) gl.setAttribute("opacity", (glow * (0.4 + 0.6 * (0.5 - 0.5 * Math.cos(TAU * t / 1.7)))).toFixed(3));
      draw(bxNow, rel, p, cc);
      raf = requestAnimationFrame(frame);
    };
    if (reduce) { draw(0, [0, 0], {}, S.cross ? 1 : 0); r.glow.current?.setAttribute("opacity", live.current.work ? ".6" : "0"); return; }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [id, seed]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={r.root} className={`pp pp-${id}`} style={{ width: w, height: h }} aria-hidden="true">
      <span ref={r.shadow} className="bd-shadow" />
      <svg className="pp-svg" width={w} height={h} viewBox={`0 0 ${P.w} ${P.h}`} overflow="visible">
        <defs><linearGradient id={`pp-shoe-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2c2c2e" /><stop offset=".55" stopColor="#0b0b0c" /><stop offset="1" stopColor="#1c1c1e" /></linearGradient>
          <radialGradient id={`pp-glow-${id}`}><stop offset="0" stopColor={color} stopOpacity=".95" /><stop offset=".45" stopColor={color} stopOpacity=".45" /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient></defs>
        {[0, 1].map((i) => (
          <g key={i} ref={r.lg[i]}>
            <line ref={r.leg[i]} x1={P.hip[i]} y1={P.hem - 5} x2={P.ankle[i] + (S.cross ? crossOff[i] : 0)} y2={P.ankleY} stroke="#141414" strokeWidth={P.lw} strokeLinecap="round" />
            <g ref={r.shoe[i]} transform={S.cross ? `translate(${crossOff[i]} 0)` : undefined}><Shoe x={P.ankle[i]} y={P.ankleY - 2} w={P.shoe[i][0]} dx={P.shoe[i][1]} id={id} /></g>
          </g>
        ))}
        <g ref={r.torso}>
          <image href={P.torso.src} x={0} y={P.torso.y} width={P.w} height={P.torso.h} />
          {GLOW[id] && <circle ref={r.glow} cx={GLOW[id][0]} cy={GLOW[id][1]} r={GLOW[id][2]} fill={`url(#pp-glow-${id})`} opacity="0" />}
          <g ref={r.head}><image href={P.head.src} x={0} y={P.head.y} width={P.w} height={P.head.h} /></g>
        </g>
      </svg>
    </span>
  );
}
