// Home's band as a pattern made of the work. Every line of the agents' work (their jobs, their thoughts, the numbers
// they're moving) is set in mono and drawn as dots, one per character, so from a distance the band is a quiet woven
// texture. Your cursor is a lens: near it, the dots resolve into the words they are. While the agents work, a soft
// sweep of an agent's colour runs along a line and the line becomes what that agent is doing now; nothing jumps.
// A slow wave of light moves through the pattern so it breathes even when no one's touching it. Click and a ripple runs
// out through the pattern, reading it as it passes; click a line and it holds, with a way to ask North about it.
// Every line is the prototype's own work: the Agents page's thoughts and jobs, and Company health's numbers.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDialKit } from "dialkit";
import { NorthLogo } from "./marks.jsx";

const HUE = { orin: [61, 91, 217], riley: [31, 158, 90], calvin: [180, 35, 60], marco: [224, 71, 154], fia: [217, 160, 30] }; // each one's chest glow
const NAVY = [9, 53, 85];
const IDS = ["orin", "riley", "calvin", "marco", "fia"];
const WORK = {
  orin: ["October bookings are in. Plan is $40.03M", "Outbound back to pace: about $680K by Dec 31", "Leading with the gap, then the three levers", "Rank Sam’s demo list", "Find why held demos aren’t closing", "Re-route the 14 open prospects Sam left", "Write the Monday sync doc"],
  riley: ["Plan is $40.03M for the year", "All three levers land at $40.08M", "Running each lever on its own first", "Expansion and new logos add about $460K", "Outbound: $130.2K against $573.8K pace", "Testing the downside: a tenth of $1.98M", "Brightline renews Nov 14 and just cut seats", "Ranking at-risk accounts by ARR", "Forecast the year with all three levers", "Explain what’s holding GRR"],
  marco: ["Webinar leads no-show twice as often", "Splitting no-shows by lead source", "Find why booked demos don’t happen", "Inbound booked $1.31M against a $1.03M pace", "Make reminder visuals for webinar sign-ups", "Sum up Inbound’s October"],
  fia: ["Write up how Outbound’s Booked ARR is counted", "Define a held demo for the team", "Collecting the definitions from Company health", "Keep every number’s definition in one place"],
  calvin: ["Approve QBR invites for 4 quiet renewals", "11 of 29 renewals in Jordan’s book touched", "Time to first contract: 30.0 days", "Grouping accounts by onboarding step", "Find what slows the first 10 handoffs", "Find why daily active users are below target", "Checking which screens lost the most", "Drafting QBR invites for the quiet four", "Find where new accounts stall", "Break down Felix handoffs by team"],
};
const FIELD = ["HubSpot · Outbound lane", "Booked ARR – Inbound $1.31M · 128%", "Demos booked 342 · 96%", "Pipeline created $5.97M · 114%", "New ARR $1.52M · 92%", "GRR 97.7% · 101%", "At-risk ARR $1.98M", "Expansion ARR $734.0K · 72%", "Felix activations 82 · 102%", "Plan · $40.03M", "Account health", "Product usage", "Felix handoffs per 1K 9.61", "New logos 55 · pace 73", "Demo held rate 41.9% · target 50%", "Healthy ARR 63%", "Downgrade + churn $773K", "Win rate 31.9% · target 60%", "Active accounts 28.5%", "Fello health 68 · target 73", "Pulled October bookings ✓", "Sized the three levers ✓", "Checked against the plan ✓", "Monday sync · due Monday", "Year-end forecast · due Friday"];

const SPEC = {
  dot: ["Pattern: dot opacity", [0.13, 0, 0.6, 0.005]],
  under: ["Pattern: opacity under the greeting", [0.035, 0, 0.3, 0.005]],
  size: ["Pattern: dot size", [0.95, 0.3, 2.5, 0.05]],
  type: ["Pattern: type size (px)", [9.5, 7, 13, 0.5]],
  row: ["Pattern: row spacing (px)", [14, 8, 40, 1]],
  gaps: ["Pattern: share left empty", [0.18, 0, 0.9, 0.01]],
  grain: ["Pattern: grain", [0.45, 0, 1, 0.01]],
  lens: ["Cursor: glow radius (px)", [46, 0, 200, 2]],
  glide: ["Cursor: highlight glide (per s)", [11, 2, 30, 0.5]],
  read: ["Lens: words opacity", [0.55, 0, 1, 0.01]],
  wave: ["Wave: strength", [0.35, 0, 1, 0.01]],
  waveS: ["Wave: seconds per pass", [14, 3, 60, 1]],
  sweep: ["Agents: seconds per line", [3.2, 0.6, 12, 0.1]],
  rest: ["Agents: pause between lines (s)", [1.6, 0, 10, 0.1]],
  glow: ["Agents: colour strength", [0.55, 0, 1, 0.01]],
  workRead: ["Agents: line reads as words while changing", [0, 0, 1, 0.01]], // off: lines no longer surface as words on their own; the dots and their colour still sweep
  settle: ["Agents: colour fades over (s)", [4.5, 0.5, 15, 0.5]],
  ripple: ["Click: ripple speed (px/s)", [620, 150, 2000, 10]],
  rippleW: ["Click: ripple width (px)", [70, 10, 240, 2]],
  grad: ["Gradient: strength", [0.55, 0, 1.5, 0.01]],
  gradS: ["Gradient: drift speed", [0.06, 0, 0.4, 0.005]],
  push: ["Gradient: cursor push", [0.9, 0, 3, 0.05]],
  springK: ["Gradient: springs back", [1.4, 0.1, 6, 0.1]],
  cell: ["Grid: pitch (px)", [8, 5, 16, 0.5]],
  ghost: ["Grid: empty dots opacity", [0.06, 0, 0.3, 0.005]],
  breathe: ["Grid: size variation", [0.7, 0, 1.2, 0.01]],
  tint: ["Grid: colour drift", [0.85, 0, 1, 0.01]],
  fieldS: ["Grid: drift speed", [0.08, 0, 0.5, 0.005]],
  on: ["Show the pattern", true],
};
const DIALS = Object.fromEntries(Object.values(SPEC).map(([l, v]) => [l, v]));
const fromDials = (v) => Object.fromEntries(Object.entries(SPEC).map(([k, [l]]) => [k, v[l]]));
const UP = (s) => s.toUpperCase();
const rand = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }; // stable per-dot jitter (the grain)
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// scope + keep let the same texture sit behind another page (the new chat): which container it lives in, and what it frames
// calm: no agent sweeps rewriting lines on their own; the pattern only answers your cursor (it parts and reads as you pass)
// pools: false leaves the colour to whatever sits under it (the new chat's glow), so it only brings the type
export function HomeWork({ onAsk, scope = ".home-page", keep: keepSel = [".hello h1", ".ask-slot", ".sugs"], dials = "Home · work texture", calm = false, pools: usePools = true }) {
  const D = fromDials(useDialKit(dials, DIALS));
  const box = useRef(null), cvs = useRef(null);
  const st = useRef({ segs: [], W: 0, H: 0, cw: 6, keep: [], mouse: null, active: {}, ripples: [], pin: null, D });
  const [hot, setHot] = useState(null); // the job under your cursor: { i, x, y, w, t }
  st.current.D = D; st.current.calm = calm;
  // measure, and lay the band out as rows of lines; each line knows which characters it has
  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const layout = () => {
      const D = st.current.D, r = el.getBoundingClientRect(), page = el.closest(scope);
      const g = document.createElement("canvas").getContext("2d"); g.font = `500 ${D.type}px "Geist Mono", ui-monospace, monospace`;
      const cw = Math.max(D.cell, g.measureText("M").width + 0.4), keep = []; // every character sits on a grid cell
      if (page) keepSel.forEach((sel) => page.querySelectorAll(sel).forEach((n) => { if (/^H\d$/.test(n.tagName)) { const rg = document.createRange(); rg.selectNodeContents(n); keep.push(rg.getBoundingClientRect()); } else keep.push(n.getBoundingClientRect()); }));
      const K = keep.map((b) => ({ x0: b.left - r.left - 16, x1: b.right - r.left + 16, y0: b.top - r.top - 8, y1: b.bottom - r.top + 8 }));
      const mainR = el.closest(".main")?.getBoundingClientRect(), VW = Math.min(r.width, mainR ? mainR.right - r.left : r.width); // only what's on screen
      const pool = [...FIELD, ...IDS.flatMap((id) => WORK[id])], segs = []; let k = 3;
      const rowStep = Math.max(2, Math.round(D.row / cw)) * cw;
      for (let y = cw, row = 0; y < r.height - 4; y += rowStep, row++) {
        let x = cw * (1 + ((row * 5) % 11));
        while (true) {
          const o = pool[k++ % pool.length], t = UP(o), w = t.length * cw; if (x + w > VW - 10) break;
          const under = K.some((b) => x < b.x1 && x + w > b.x0 && y + 4 > b.y0 && y - 4 < b.y1);
          if (rand(k * 3.1) >= D.gaps) segs.push({ i: segs.length, x, y, w, t, o, under, seed: k });
          x += w + cw * (3 + (k % 4)); // gaps stay whole cells, so the grid holds
        }
      }
      // the grid's empty cells: every point no character sits on, so words and gaps read as one woven field
      const occ = new Set(); segs.forEach((s) => { for (let k = 0; k < s.t.length; k++) occ.add(Math.round((s.x + k * cw) / cw) + "," + Math.round(s.y / cw)); });
      const ghosts = []; for (let gy = 1; gy * cw < r.height - 2; gy++) for (let gx = 1; gx * cw < VW - 2; gx++) { if (occ.has(gx + "," + gy)) continue; const x = gx * cw + cw / 2, y = gy * cw;
        const under = K.some((b) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1); ghosts.push([x, y, under ? 1 : 0, rand(gx * 31.7 + gy * 7.3)]); }
      Object.assign(st.current, { segs, ghosts, W: r.width, H: r.height, cw, keep: K, active: {} });
    };
    layout(); const ro = new ResizeObserver(layout); ro.observe(el); const pg = el.closest(scope); pg && ro.observe(pg);
    document.fonts && document.fonts.ready.then(layout); const t1 = setTimeout(layout, 1800);
    return () => { ro.disconnect(); clearTimeout(t1); };
  }, [D.type, D.row, D.gaps, D.cell]);
  // your cursor, wherever it is over the page
  useEffect(() => {
    const UI = `button, input, textarea, a, select, .ask-slot, .sugs, .chat, .hw-ask, .jm-host, .efly, .wl${scope === ".chat-shell" ? "" : ", .chat-shell"}`; // anything floating over the texture (a modal, a notice, a flyout, the chat over Home) is not the texture; the new chat's own texture lives inside the chat
    const hit = (x, y) => st.current.segs.find((s) => !s.under && y > s.y - 7 && y < s.y + 7 && x > s.x - 4 && x < s.x + s.w + 4);
    const rel = (e) => { const el = box.current; if (!el) return null; const r = el.getBoundingClientRect(), vis = el.closest(".main")?.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
      if (vis && (e.clientX < vis.left || e.clientX > vis.right)) return null; return x >= 0 && y >= 0 && x <= r.width && y <= r.height ? { x, y } : null; };
    const onText = (p) => st.current.keep.some((b) => p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1);
    // the one job nearest your cursor, if you're on its row and near its words
    const near = (p) => { let best = null, bd = 1e9; for (const s of st.current.segs) { if (s.under) continue; const dy = Math.abs(p.y - s.y); if (dy > st.current.D.row * 0.55) continue; const dx = p.x < s.x ? s.x - p.x : p.x > s.x + s.w ? p.x - s.x - s.w : 0; if (dx > 22) continue; const d = dx + dy * 2; if (d < bd) { bd = d; best = s; } } return best; };
    const setH = (s) => { const v = s ? { i: s.i, x: s.x, y: s.y, w: s.w, t: s.o || s.t } : null; if ((st.current.hot?.i ?? -1) !== (v?.i ?? -1)) { st.current.hot = v; setHot(v); } };
    const move = (e) => { const p = rel(e), m0 = st.current.mouse, now = performance.now();
      st.current.mouse = p ? { ...p, t: now, vx: m0 ? (p.x - m0.x) / Math.max(8, now - m0.t) : 0, vy: m0 ? (p.y - m0.y) / Math.max(8, now - m0.t) : 0 } : null;
      if (e.target.closest && e.target.closest(".hw-ask")) return; // on the chip: keep its job
      const ok = p && !st.current.calm && !(e.target.closest && e.target.closest(UI)) && !onText(p), s = ok ? near(p) : null; setH(s);
      const host = box.current?.closest(".content"); if (host) host.style.cursor = s ? "pointer" : ""; };
    const out = () => { st.current.mouse = null; setH(null); };
    const click = (e) => { const p0 = rel(e); if (st.current.calm) { if (p0 && !(e.target.closest && e.target.closest(UI)) && !onText(p0)) st.current.ripples.push({ x: p0.x, y: p0.y, t0: performance.now() }); return; } const p = p0; if (!p || (e.target.closest && e.target.closest(UI)) || onText(p)) return;
      const h = st.current.hot; if (h && onAskRef.current) { onAskRef.current(`What’s behind “${h.t}”?`); setH(null); return; } // clicking a job asks North about it
      st.current.ripples.push({ x: p.x, y: p.y, t0: performance.now() }); };
    window.addEventListener("pointermove", move, { passive: true }); document.addEventListener("pointerleave", out); window.addEventListener("click", click);
    return () => { window.removeEventListener("pointermove", move); document.removeEventListener("pointerleave", out); window.removeEventListener("click", click); };
  }, []);
  const onAskRef = useRef(onAsk); onAskRef.current = onAsk;
  const chipW = 100;
  // the agents: each sweeps along an open line, which becomes what it's doing, then rests and takes another
  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches; if (reduced || calm) return;
    const timers = [], step = { orin: 0, riley: 3, calvin: 6, marco: 1, fia: 4 };
    const go = (ag) => {
      const S = st.current, D = S.D, busy = new Set(Object.values(S.active).map((a) => a.i));
      const L = S.segs.filter((s) => !s.under && s.t.length >= 14 && !busy.has(s.i) && S.hot?.i !== s.i);
      if (L.length) { const s = L[Math.floor(Math.random() * L.length)], w = WORK[ag][step[ag]++ % WORK[ag].length]; let t = UP(w); if (t.length > s.t.length) t = t.slice(0, s.t.length - 1) + "…";
        S.active[ag] = { i: s.i, ag, t0: performance.now(), dur: D.sweep * 1000, from: s.t, to: t, o: w, done: false }; }
      timers.push(setTimeout(() => go(ag), (D.sweep + D.rest + Math.random() * 1.5) * 1000));
    };
    IDS.forEach((ag, i) => timers.push(setTimeout(() => go(ag), 700 + i * 1300)));
    return () => timers.forEach(clearTimeout);
  }, []);
  // draw: dots everywhere, the lens turning dots into words, the sweeps, the wave
  useEffect(() => {
    const c = cvs.current; if (!c) return; const g = c.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
    let raf; const fade = {}, last = { t: performance.now() };
    // soft pools of the band's own tones (a deeper slate and a light), drifting slowly; the cursor pushes them and they spring home
    const pools = [{ hx: 0.18, hy: 0.35, r: 0.42, c: [190, 206, 216], a: 0.55, ph: 0 }, { hx: 0.62, hy: 0.2, r: 0.38, c: [255, 255, 255], a: 0.7, ph: 1.7 }, { hx: 0.82, hy: 0.55, r: 0.45, c: [196, 210, 222], a: 0.5, ph: 3.1 }, { hx: 0.42, hy: 0.7, r: 0.34, c: [214, 208, 232], a: 0.28, ph: 4.4 }]
      .map((p) => ({ ...p, x: 0, y: 0, vx: 0, vy: 0, init: false })); // lines an agent has finished: { ag, t1 } so their colour can settle back
    // drawn only while you can see it: off screen, behind the full-screen chat or in a hidden tab it rests (and costs nothing)
    let vis = true; const io = new IntersectionObserver((es) => { vis = es[es.length - 1].isIntersecting; }); io.observe(c);
    const inChat = !!c.closest(".chat-shell"), root = document.documentElement;
    const loop = (now) => {
      if (!vis || document.hidden || (!inChat && root.classList.contains("chat-full"))) { last.t = now; raf = requestAnimationFrame(loop); return; }
      const S = st.current, D = S.D, { W, H, segs, cw } = S;
      if (W && H) {
        if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px"; }
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
        { const dt = Math.min(0.05, (now - last.t) / 1000), m = S.mouse, vw = (box.current?.closest(".main")?.clientWidth || W), T = now / 1000; last.t = now;
          for (const p of (usePools ? pools : [])) {
            const hx = (p.hx + Math.sin(T * D.gradS * 2 + p.ph) * 0.08) * vw, hy = (p.hy + Math.cos(T * D.gradS * 1.6 + p.ph) * 0.14) * H, R0 = p.r * vw;
            if (!p.init) { p.x = hx; p.y = hy; p.init = true; }
            let fx = (hx - p.x) * D.springK, fy = (hy - p.y) * D.springK;
            if (m) { const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1, near = Math.max(0, 1 - d / (R0 * 1.1));
              fx += (dx / d) * near * 260 * D.push + (m.vx || 0) * near * 900 * D.push; fy += (dy / d) * near * 260 * D.push + (m.vy || 0) * near * 900 * D.push; }
            p.vx = (p.vx + fx * dt) * Math.pow(0.12, dt); p.vy = (p.vy + fy * dt) * Math.pow(0.12, dt); p.x += p.vx * dt; p.y += p.vy * dt;
            const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, R0); gr.addColorStop(0, `rgba(${p.c},${p.a * D.grad})`); gr.addColorStop(1, `rgba(${p.c},0)`);
            g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(0, 0, W, H);
          }
          if (m) { m.vx *= 0.9; m.vy *= 0.9; } }
        // a slow field moving through the grid: dots swell and shrink with it, and drift toward the agents' colours in soft patches
        const T2 = now / 1000 * D.fieldS * 6, field = (x, y) => (Math.sin(x * 0.012 + T2) + Math.sin(y * 0.03 - T2 * 0.8) + Math.sin((x + y) * 0.008 + T2 * 0.6)) / 3;
        const hueAt = (x, y) => { const h = Math.sin(x * 0.004 - T2 * 0.35) * 0.5 + 0.5; return HUE[IDS[Math.min(IDS.length - 1, Math.floor(h * IDS.length))]]; };
        const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map(Math.round);
        S.field = field; S.hueAt = hueAt; S.mixC = mixC;
        // calm: an eased copy of the cursor; the pattern parts around it and the words under it surface, then settle when it leaves
        const E = S.em = S.em || { x: 0, y: 0, s: 0 }; if (S.calm) { const mm = S.mouse; if (mm) { if (E.s < 0.02) { E.x = mm.x; E.y = mm.y; } E.x += (mm.x - E.x) * 0.14; E.y += (mm.y - E.y) * 0.14; } E.s += ((mm ? 1 : 0) - E.s) * 0.06; }
        // the cursor clears dots out of its way and the type that was there shows through, in place. The edge is feathered and
        // uneven (each point gets its own reach), so it reads as dots stepping aside, not a circle.
        // the reach is ragged twice over: it swells and dips around the cursor (a slow-turning lobed outline) and every dot has its own
        const RP = 80, sm = (t) => t * t * (3 - 2 * t), part = (x, y, j = 0.5) => { if (!S.calm || E.s < 0.01) return null; const dx = x - E.x, dy = y - E.y, d = Math.hypot(dx, dy) || 1, th = Math.atan2(dy, dx);
          const lobe = 1 + 0.22 * Math.sin(th * 3 + T2 * 0.6) + 0.12 * Math.sin(th * 5 - T2 * 0.9), R = RP * lobe * (0.5 + j * 0.9); if (d > R) return null;
          const k = sm(1 - d / R) * E.s; return [x + (dx / d) * k * 15, y + (dy / d) * k * 15, k]; };
        const shake = (x, y) => { if (!S.calm || !S.ripples.length) return null; let ox = 0, oy = 0; for (const q of S.ripples) { const rr = ((now - q.t0) / 1000) * D.ripple, dx = x - q.x, dy = y - q.y, d = Math.hypot(dx, dy) || 1, off = d - rr;
            if (Math.abs(off) < D.rippleW) { const a = Math.cos((off / D.rippleW) * Math.PI * 1.5) * (1 - Math.abs(off) / D.rippleW) * Math.max(0, 1 - rr / 700) * 5; ox += (dx / d) * a; oy += (dy / d) * a; } } return ox || oy ? [ox, oy] : null; };
        if (S.ghosts) { const buckets = {};
          for (const [x, y, under, rn] of S.ghosts) { const f = field(x, y), tw = Math.max(0, f) * D.tint * (0.4 + rn * 0.6);
            const a = (under ? D.under * 0.5 : D.ghost) * (1 + f * 0.9) * (0.7 + rn * 0.6); if (a < 0.004) continue;
            const tc = Math.min(1, tw * 2.2), c = tc > 0.08 ? mixC(NAVY, hueAt(x, y), tc) : NAVY; const a2 = a * (1 + tc * 1.4), rr = D.size * 0.62 * (1 + f * D.breathe) * (0.85 + rn * 0.3);
            const pp = part(x, y, rn), sk = shake(x, y), key = c.join(",") + "|" + Math.round(a2 * 60); (buckets[key] = buckets[key] || { c, a: Math.round(a2 * 60) / 60, d: [] }).d.push((pp ? pp[0] : x) + (sk ? sk[0] : 0), (pp ? pp[1] : y) + (sk ? sk[1] : 0), rr); }
          for (const b of Object.values(buckets)) { g.globalAlpha = Math.min(1, b.a); g.fillStyle = `rgb(${b.c})`; g.beginPath(); for (let i = 0; i < b.d.length; i += 3) { g.moveTo(b.d[i] + b.d[i + 2], b.d[i + 1]); g.arc(b.d[i], b.d[i + 1], Math.max(0.25, b.d[i + 2]), 0, Math.PI * 2); } g.fill(); }
          g.globalAlpha = 1; }
        g.font = `500 ${D.type}px "Geist Mono", ui-monospace, monospace`; g.textBaseline = "middle";
        const m = S.mouse, R = D.lens, wv = (now / 1000 / D.waveS) % 1, act = {};
        // the highlight glides from job to job; each line's heat eases in and out so travel is smooth
        const dts = Math.min(0.05, (now - (S.lastT || now)) / 1000), kk = 1 - Math.exp(-D.glide * dts); S.lastT = now; S.heat = S.heat || {};
        for (const s of segs) { const tgt = S.hot && S.hot.i === s.i ? 1 : 0, h = S.heat[s.i] || 0; if (h || tgt) { const v = h + (tgt - h) * kk; S.heat[s.i] = v < 0.003 && !tgt ? 0 : v; } }
        const hs = S.hot && segs[S.hot.i], cap = (S.cap = S.cap || { x: 0, y: 0, w: 0, a: 0 });
        if (hs) { if (cap.a < 0.02) Object.assign(cap, { x: hs.x, y: hs.y, w: hs.w }); cap.x += (hs.x - cap.x) * kk; cap.y += (hs.y - cap.y) * kk; cap.w += (hs.w - cap.w) * kk; }
        cap.a += ((hs ? 1 : 0) - cap.a) * kk;

        S.ripples = S.ripples.filter((q) => (now - q.t0) / 1000 * D.ripple < Math.hypot(W, H) + D.rippleW);
        for (const a of Object.values(S.active)) { const p = (now - a.t0) / a.dur; if (p >= 1 && !a.done) { a.done = true; segs[a.i] && Object.assign(segs[a.i], { t: a.to, o: a.o }); fade[a.i] = { ag: a.ag, t1: now }; } if (!a.done) act[a.i] = { ...a, p: Math.max(0, p) }; }
        for (const s of segs) {
          const a = act[s.i], f = fade[s.i], base = s.under ? D.under : D.dot;
          const fk = f ? Math.max(0, 1 - (now - f.t1) / (D.settle * 1000)) : 0; if (f && fk <= 0) delete fade[s.i];
          const text = a ? a.from : s.t, cl = null, heat = S.heat[s.i] || 0;
          for (let k = 0; k < text.length; k++) {
            const ch = a && k < a.p * text.length ? a.to[k] || " " : text[k]; if (ch === " ") continue;
            const x = s.x + k * cw + cw / 2, y = s.y, pp = part(x, y, rand(s.seed * 13 + k * 7)); // the letter stays where it is; only its dot steps aside
            if (cl && y > cl.y0 && y < cl.y1 && x > cl.x0 && x < cl.x1) continue;
            // the wave: a slow diagonal band of light
            const wd = ((x / W) * 0.7 + (y / H) * 0.3 - wv + 1) % 1, wave = 1 + D.wave * Math.max(0, 1 - Math.abs(wd - 0.5) * 6) ;
            const grain = 1 - D.grain * 0.5 + D.grain * rand(s.seed * 97 + k);
            // the lens: how much this character is read as a letter rather than a dot
            // only the job under the cursor reads as words; nearby dots just brighten a touch as the cursor passes
            let lens = heat, glow = 0; if (m && R > 0) { const d = Math.hypot(x - m.x, y - m.y); glow = d < R ? ease(1 - d / R) : 0; }
            // a click's ripple reads the pattern as it passes, fading as it travels
            for (const q of S.ripples) { const rr = ((now - q.t0) / 1000) * D.ripple, d = Math.hypot(x - q.x, y - q.y), off = Math.abs(d - rr); if (off < D.rippleW) { const k2 = (1 - off / D.rippleW) * Math.max(0, 1 - rr / 900); lens = Math.max(lens, s.under ? k2 * 0.25 : ease(k2)); } }
            // a line an agent is working on reads as words while it changes, in that agent's colour, then sinks back to dots
            if (pp && !s.under) lens = Math.max(lens, 0.9 * Math.min(1, pp[2] * 1.4)); // calm: the words under the cleared dots show through
            if (a) lens = Math.max(lens, D.workRead * ease(Math.min(1, a.p * 4)));
            else if (fk > 0) lens = Math.max(lens, D.workRead * ease(fk));
            // colour: the agent's while it sweeps (brightest at the sweep's edge), settling back after
            const fv = field(x, y), ftw = Math.max(0, fv) * D.tint * 0.6;
            let col = ftw > 0.12 ? mixC(NAVY, hueAt(x, y), Math.min(1, ftw * 1.4)) : NAVY, extra = 0;
            if (a) { const edge = a.p * text.length; if (k < edge) { col = HUE[a.ag]; extra = D.glow * (0.6 + 0.4 * Math.max(0, 1 - (edge - k) / 6)); } }
            else if (fk > 0) { col = HUE[f.ag]; extra = D.glow * 0.6 * fk; }
            const alpha = Math.min(1, base * wave * grain * (1 + glow * 1.6) + extra);
            const isNum = ch >= "0" && ch <= "9", isMark = /[·.,:%$–—✓…+’]/.test(ch);
            const r = D.size * (isNum ? 1.25 : isMark ? 0.7 : 1) * (1 + lens * 0.2) * (1 + fv * D.breathe * 0.6);
            if (lens < 0.98) { const sk = shake(x, y), dx = (pp ? pp[0] : x) + (sk ? sk[0] : 0), dy = (pp ? pp[1] : y) + (sk ? sk[1] : 0); g.globalAlpha = alpha * (1 - lens); g.fillStyle = `rgb(${col})`; g.beginPath(); g.arc(dx, dy, r, 0, Math.PI * 2); g.fill(); }
            if (lens > 0.02) { g.globalAlpha = Math.min(1, (alpha + D.read * (heat > 0 ? 0.9 : 0.5)) * lens); g.fillStyle = `rgb(${col})`; g.fillText(ch, x - cw / 2 + D.type * 0.03, y + 0.5); }
          }
        }
        g.globalAlpha = 1;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);
  return (
    <div ref={box} className="hw">
      {D.on && <canvas ref={cvs} className="hw-cv" aria-hidden="true" />}

    </div>
  );
}
