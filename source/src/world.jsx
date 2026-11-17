// Game mode: Sam's world. Mixed media, every medium with one job:
//  · photographic miniatures (generated, cut out) are the places: each brokerage is its own funky building, real
//    estate objects turned into architecture (a mailbox, a doorbell, a key on the roof, a pond with a boat)
//  · our puppets are the crew, with their own motion. They hang out at the places when idle (Riley shoots hoops on
//    Brightwater's court, Orin fishes off Coastline's pier, Calvin's at the jukebox, Fia's in the book nook, Marco by the slide)
//  · flat grainy shapes carry state: the realtor signs (For sale · Offer in · Under contract · Sold), the money that lands
//  · white hand-drawn line is intent and motion: the path someone's about to walk, wobble marks on a house that's slipping
//  · frosted glass is the ground each building sits on and every card that floats over the world
// Pick someone, pick a building: they walk there (around the blocks, not through them), do the thing, the sign changes.
// The eight prospects are SAMPLE deals (deals.js). Brightwater and Northgate are Sam's real October wins.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "motion/react";
import { useDialKit } from "dialkit";
import { Puppet } from "./puppet.jsx";
import { NorthLogo } from "./marks.jsx";
import { AgentMark } from "./agents.jsx";
import { DEALS, THREATS, GOAL } from "./deals.js";
import { ART } from "./world-art.js";

const HUE = { orin: "#6f86e6", riley: "#5fbf8a", calvin: "#d97786", marco: "#ea86bd", fia: "#e2b552" };
const SIGN = ["For sale", "Offer in", "Under contract", "Sold"];
const AG = {
  riley: { n: "Riley", role: "Revenue", clear: ["signoff"], adv: [1, 2], play: "tightens the close plan", fix: "writes the exec summary", hang: "court", hangT: "shooting hoops" },
  orin: { n: "Orin", role: "GTM", clear: ["quiet"], adv: [0], play: "sends a tailored proposal", fix: "re-engages them", hang: "pond", hangT: "fishing" },
  fia: { n: "Fia", role: "Knowledge base", clear: ["security", "procure"], adv: [0], play: "sends the right case study", fix: "sends what they asked for", hang: "books", hangT: "reading" },
  calvin: { n: "Calvin", role: "Customer value", clear: ["sponsor"], adv: [1], play: "lines up a reference call", fix: "finds them a new sponsor", hang: "jukebox", hangT: "at the jukebox" },
  marco: { n: "Marco", role: "Marketing", clear: [], adv: [0], play: "sends the webinar recap", fix: "", hang: "slide", hangT: "on the slide" },
};
const IDS = ["riley", "orin", "fia", "calvin", "marco"];
const REAL = [
  { id: "brightwater", n: "Brightwater Realty", city: "", agents: 14, arr: 24, stage: 3, close: "Oct 22", touch: "Today", real: true, champ: ["", ""], threats: [] },
  { id: "northgate", n: "Northgate Homes", city: "", agents: 20, arr: 16.2, stage: 3, close: "Oct 11", touch: "Yesterday", real: true, champ: ["", ""], threats: [] },
];
// the block (cells on an isometric grid, |i|+|j| ≤ 2): North's tower stands at the back like a landmark, the crew's
// jukebox roof is the square in the middle, the brokerages all round
const PLACES = [
  { k: "north", art: "north", c: [-1, -1] },
  { k: "books", art: "books", c: [-1, 0], deal: "meridian" }, { k: "pond", art: "pond", c: [1, 0], deal: "coast" },
  { k: "court", art: "court", c: [0, -1], deal: "brightwater" }, { k: "doorbell", art: "doorbell", c: [0, 1], deal: "bayview" },
  { k: "key", art: "key", c: [-2, 0], deal: "redwood" }, { k: "pool", art: "pool", c: [2, 0], deal: "harbor" },
  { k: "slide", art: "slide", c: [0, -2] }, { k: "mailbox", art: "mailbox", c: [0, 2], deal: "summit" },
  { k: "jukebox", art: "jukebox", c: [0, 0] }, { k: "boxes", art: "boxes", c: [1, 1], deal: "oakline" },
  { k: "balloons", art: "balloons", c: [-1, 1], deal: "keystone" }, { k: "tape", art: "tape", c: [1, -1], deal: "northgate" },
];
// where on each picture a figure can stand (as a share of the picture): its hangout spot, and the door
const SPOT = { court: [0.45, 0.36], pond: [0.53, 0.64], books: [0.62, 0.36], jukebox: [0.38, 0.33], slide: [0.74, 0.95] };
const ROD = { pond: [0.32, 0.82] }; // where Orin's line lands in the pond

const WORLD = { deals: null, made: 0 };
const freshDeals = () => [...DEALS, ...REAL].map((d) => ({ ...d, threats: d.threats.map((t) => ({ ...t, ok: false })), signed: d.stage >= 3 }));
const DAY = 0;
const live = (d) => d.threats.filter((t) => !t.ok && t.from <= DAY);
const blocked = (d) => live(d).some((t) => THREATS[t.k].fx === "block" && (t.k !== "procure" || d.stage >= 2));
function playOf(ag, d) {
  if (!d || d.signed) return null; const A = ag === "sam" ? { clear: Object.keys(THREATS), adv: [0, 1, 2] } : AG[ag];
  const th = live(d).find((t) => A.clear.includes(t.k)); if (th) return { kind: "clear", t: th };
  if (!blocked(d) && A.adv.includes(d.stage)) return { kind: "adv" }; return null;
}
const champOf = (d) => (d.champ[0] && !d.champ[0].startsWith("(") ? d.champ[0].split(" ")[0] : "the team");
const sayOf = (ag, d, p) => {
  if (p.kind === "clear") return ag === "sam" ? `You call ${champOf(d)}. ${THREATS[p.t.k].t}: handled.` : `${AG[ag].n} ${AG[ag].fix}. ${THREATS[p.t.k].t}: handled.`;
  const nx = d.stage + 1; return `${ag === "sam" ? `You call ${champOf(d)}` : `${AG[ag].n} ${AG[ag].play}`}. ${nx >= 3 ? `${d.n} signs. $${d.arr}K.` : `The sign goes to ${SIGN[nx]}.`}`;
};
const short = (n) => n.replace(/ (Realty|Group|Brokers|Home Team|Partners|Collective|Properties|Living|Homes)$/, "");

function useSize(ref) { const [s, set] = useState({ W: 1200, H: 800 }); useLayoutEffect(() => { const el = ref.current; if (!el) return; const f = () => set({ W: el.clientWidth, H: el.clientHeight }); f(); const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect(); }, []); return s; }
// a hand-drawn line: the points nudged a little and joined with soft curves, so it never looks ruled
function scribble(pts, seed = 1, amt = 2.2) {
  let s = seed * 9301 + 49297; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280 - 0.5) * amt;
  const P = pts.map(([x, y], i) => (i === 0 || i === pts.length - 1 ? [x, y] : [x + r(), y + r()]));
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 1; i < P.length; i++) { const [x0, y0] = P[i - 1], [x1, y1] = P[i], mx = (x0 + x1) / 2 + r(), my = (y0 + y1) / 2 + r(); d += ` Q${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`; }
  return d;
}

export function WorldMode({ onClose, onAsk }) {
  const V = useDialKit("Game · Sam’s world", { "Walking speed (px/s)": [190, 40, 400, 5], "Work at the building (s)": [1.8, 0.4, 5, 0.1], "Crew height (× cell)": [0.42, 0.25, 0.9, 0.01], "Building size (× cell)": [1.02, 0.7, 2, 0.01], "Frosted ground blur (px)": [12, 0, 30, 1] });
  const box = useRef(null), { W, H } = useSize(box);
  // the grid: a cell's half-width A, fitted so the whole block (and the tower) fits the window
  const A = Math.max(60, Math.min((W - 80) / 5.1, (H - 120) / 4.25)), cx = W / 2, cy = H / 2 + A * 0.5;
  const G = (i, j) => [cx + (i - j) * A, cy + (i + j) * A * 0.5];
  const [deals, setDeals] = useState(() => WORLD.deals || freshDeals()), [made, setMade] = useState(WORLD.made);
  useEffect(() => { WORLD.deals = deals; WORLD.made = made; }, [deals, made]);
  useEffect(() => { document.documentElement.classList.add("game-open"); return () => document.documentElement.classList.remove("game-open"); }, []);
  const dealOf = (pl) => deals.find((d) => d.id === pl.deal);

  // where every picture sits (bottom-centre on its cell), and the points a figure can stand on
  const geo = useMemo(() => Object.fromEntries(PLACES.map((pl) => { const a = ART[pl.art], [x, y] = G(...pl.c);
    const w = pl.k === "north" ? A * 1.05 : A * V["Building size (× cell)"] * (a.w / 280), h = w * a.h / a.w, left = x - w / 2, top = y + A * 0.3 - h;
    return [pl.k, { x, y, w, h, left, top, door: [x - A * 0.12, y + A * 0.34], at: (f) => [left + f[0] * w, top + f[1] * h] }]; })), [W, H, V["Building size (× cell)"]]);
  const homeOf = (id) => geo[AG[id].hang].at(SPOT[AG[id].hang]);
  // depth: a figure standing on a building (its hangout) draws over it; one on the ground sorts by where its feet are
  const zOf = (id, c, p) => (c.at === "home" && !c.walking ? Math.round(geo[AG[id].hang].y) + 3 : Math.round(p[1]) + 2);
  const [crew, setCrew] = useState(() => Object.fromEntries(IDS.map((id) => [id, { at: "home", busy: false }])));
  const pos = useRef({}), els = useRef({});
  // keep figures pinned to their spots as the window resizes
  useLayoutEffect(() => { IDS.forEach((id) => { const c = crew[id]; const p = c.at === "home" ? homeOf(id) : geo[c.at].door; pos.current[id] = p; const el = els.current[id]; if (el && !c.walking) { el.style.left = p[0] + "px"; el.style.top = p[1] + "px"; el.style.zIndex = zOf(id, c, p); } }); }, [geo]);

  const [sel, setSel] = useState(null), [open, setOpen] = useState(null), [hov, setHov] = useState(null), [fx, setFx] = useState([]), [said, setSaid] = useState(null);
  // around the blocks, not through them: out to the corner in front, along the grid, in to the door
  const route = (from, toK) => { const t = PLACES.find((p) => p.k === toK), [ti, tj] = t.c, door = geo[toK].door;
    const near = PLACES.reduce((b, p) => { const g = geo[p.k]; const dd = Math.hypot(g.x - from[0], g.y - from[1]); return dd < b[0] ? [dd, p] : b; }, [1e9, null])[1], [fi, fj] = near.c;
    return [from, G(fi + 0.5, fj + 0.5), G(ti + 0.5, fj + 0.5), G(ti + 0.5, tj + 0.5), door]; };
  const walk = (id, path, then) => {
    const el = els.current[id]; if (!el) return; const L = []; let tot = 0; for (let i = 1; i < path.length; i++) { const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]); L.push(d); tot += d; }
    const dur = Math.max(0.6, tot / V["Walking speed (px/s)"]); let acc = 0; const times = [0, ...L.map((d) => (acc += d) / (tot || 1))];
    setCrew((c) => ({ ...c, [id]: { ...c[id], walking: true } }));
    animate(el, { left: path.map((p) => p[0] + "px"), top: path.map((p) => p[1] + "px") }, { duration: dur, times, ease: "linear", onUpdate: () => { el.style.zIndex = Math.round(parseFloat(el.style.top)) + 2; } })
      .then(() => { pos.current[id] = path[path.length - 1]; setCrew((c) => ({ ...c, [id]: { ...c[id], walking: false } })); then && then(); });
  };
  const send = (id, k) => {
    const pl = PLACES.find((p) => p.k === k), d = dealOf(pl), p = d && (id === "sam" ? playOf("sam", d) : playOf(id, d)); if (!p) return;
    const land = () => {
      setDeals((ds) => ds.map((x) => { if (x.id !== d.id) return x; if (p.kind === "clear") return { ...x, threats: x.threats.map((t) => (t.k === p.t.k ? { ...t, ok: true } : t)), touch: "Today" };
        const st = x.stage + 1; return { ...x, stage: st, signed: st >= 3, touch: "Today" }; }));
      if (p.kind === "adv" && d.stage + 1 >= 3) { setMade((m) => m + d.arr); setFx((f) => [...f, { k: Date.now(), at: k, t: `+$${d.arr}K` }]); }
      setSaid({ who: id, text: sayOf(id, d, p), k: Date.now() });
    };
    setSel(null);
    if (id === "sam") { land(); return; }
    setCrew((c) => ({ ...c, [id]: { ...c[id], at: k, busy: true } }));
    walk(id, route(pos.current[id] || homeOf(id), k), () => {
      setCrew((c) => ({ ...c, [id]: { ...c[id], working: true } }));
      setTimeout(() => { land(); setCrew((c) => ({ ...c, [id]: { ...c[id], working: false } }));
        // job done: wander back to where they like to be
        setTimeout(() => { const home = homeOf(id); walk(id, [...route(pos.current[id], AG[id].hang).slice(0, -1), home], () => setCrew((c) => ({ ...c, [id]: { at: "home", busy: false } }))); }, 2200);
      }, V["Work at the building (s)"] * 1000);
    });
  };
  const clickPlace = (k) => { if (k === "north") { onAsk("What should I do next?"); return; }
    const pl = PLACES.find((p) => p.k === k), d = dealOf(pl); if (!d) return;
    if (sel && playOf(sel, d) && !crew[sel].busy) { send(sel, k); setOpen(null); return; } setSel(null); setOpen((o) => (o === k ? null : k)); };
  useEffect(() => { if (!fx.length) return; const t = setTimeout(() => setFx((f) => f.slice(1)), 1800); return () => clearTimeout(t); }, [fx]);

  const needs = deals.filter((d) => !d.signed && live(d).length);
  const hovPl = hov && PLACES.find((p) => p.k === hov), hovD = hovPl && dealOf(hovPl);
  const preview = sel && hovD ? (playOf(sel, hovD) ? sayOf(sel, hovD, playOf(sel, hovD)) : `${AG[sel].n} can’t move ${short(hovD.n)} right now.`) : null;
  const path = sel && hovD && playOf(sel, hovD) && !crew[sel].busy ? route(pos.current[sel] || homeOf(sel), hov) : null;
  const openPl = open && PLACES.find((p) => p.k === open), openD = openPl && dealOf(openPl);

  return (
    <motion.div className="wd" role="dialog" aria-label="Game mode: Sam's world" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <div className="wd-world" ref={box} onPointerDown={(e) => { if (e.target === e.currentTarget || e.target.classList.contains("wd-grid")) { setSel(null); setOpen(null); } }} style={{ "--fb": V["Frosted ground blur (px)"] + "px" }}>
        {/* the ground: paper-blue, the Agents board's fine isometric grid in white */}
        <svg className="wd-grid" width={W} height={H} aria-hidden="true">
          {Array.from({ length: 25 }, (_, k) => k - 12).map((n) => { const a = G(n * 0.5, -7), b = G(n * 0.5, 7), c = G(-7, n * 0.5), d = G(7, n * 0.5);
            return <g key={n}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} /><line x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} /></g>; })}
        </svg>
        {/* each building stands on a frosted-glass plot: the grid shows through it, blurred */}
        {PLACES.map((pl) => { const [i, j] = pl.c, q = [G(i - 0.42, j - 0.42), G(i + 0.42, j - 0.42), G(i + 0.42, j + 0.42), G(i - 0.42, j + 0.42)], d = dealOf(pl), on = !sel || (d && playOf(sel, d));
          const minX = Math.min(...q.map((p) => p[0])), minY = Math.min(...q.map((p) => p[1])), w = Math.max(...q.map((p) => p[0])) - minX, h = Math.max(...q.map((p) => p[1])) - minY;
          return <div key={"plot" + pl.k} className={`wd-plot${d?.signed ? " is-sold" : ""}${open === pl.k || hov === pl.k ? " is-on" : ""}${on ? "" : " is-dim"}`} style={{ left: minX, top: minY, width: w, height: h, zIndex: 1,
            clipPath: `polygon(${q.map((p) => `${(p[0] - minX).toFixed(1)}px ${(p[1] - minY).toFixed(1)}px`).join(",")})` }} />; })}
        {PLACES.map((pl) => { const g = geo[pl.k], d = dealOf(pl), on = !sel || pl.k === "north" || (d && playOf(sel, d));
          return <button key={pl.k} className={`wd-b${pl.k === "north" ? " is-north" : ""}${on ? "" : " is-dim"}${hov === pl.k ? " is-hov" : ""}`} style={{ left: g.left, top: g.top, width: g.w, height: g.h, zIndex: Math.round(g.y) }}
            onClick={() => clickPlace(pl.k)} onPointerEnter={() => setHov(pl.k)} onPointerLeave={() => setHov(null)} aria-label={pl.k === "north" ? "North's tower: ask North" : d ? `${d.n}: ${SIGN[d.stage]}` : `${pl.k}, the crew's hangout`}>
            <img src={ART[pl.art].src} alt="" draggable="false" /></button>; })}
        {/* realtor signs, in the lawn in front of each brokerage: the stage, then the name */}
        {PLACES.filter((pl) => pl.deal).map((pl) => { const g = geo[pl.k], d = dealOf(pl), x = g.x - A * 0.46, y = g.y + A * 0.36, on = !sel || playOf(sel, d);
          return <div key={"s" + pl.k} className={`wd-sign${d.signed ? " is-sold" : ""}${on ? "" : " is-dim"}`} style={{ left: x, top: y, zIndex: 2500 }} onClick={() => clickPlace(pl.k)}>
            <AnimatePresence mode="wait" initial={false}><motion.b key={d.stage} className="grain" initial={{ rotateX: -90 }} animate={{ rotateX: 0 }} exit={{ rotateX: 90 }} transition={{ duration: 0.26 }}>{SIGN[d.stage]}</motion.b></AnimatePresence>
            <span>{short(d.n)} · ${d.arr}K</span><i />
          </div>; })}
        {/* trouble, before it hits: a frosted bubble over the roof; tonight's get the wobble */}
        {PLACES.filter((pl) => pl.deal).map((pl) => { const g = geo[pl.k], d = dealOf(pl), th = live(d)[0]; if (!th || d.signed) return null; const on = !sel || playOf(sel, d);
          return <motion.div key={"n" + pl.k + th.k} className={`wd-need${th.due === DAY ? " is-now" : ""}${on ? "" : " is-dim"}`} style={{ left: g.x, top: g.top + g.h * 0.02, zIndex: 3000 }}
            initial={{ opacity: 0, scale: 0.7, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ type: "spring", stiffness: 380, damping: 24 }}>
            <b>{THREATS[th.k].t}</b><span>{th.due == null ? "until someone sorts it" : th.due === DAY ? "by tonight" : `by ${["Tue", "Wed", "Thu", "Fri"][th.due]} night`}</span></motion.div>; })}
        {/* the line layer: wobble on what slips tonight, the path someone's about to walk, Orin's fishing line */}
        <svg className="wd-ink" width={W} height={H} aria-hidden="true">
          {PLACES.filter((pl) => pl.deal).map((pl) => { const g = geo[pl.k], d = dealOf(pl), th = live(d)[0]; if (!th || d.signed || th.due !== DAY) return null; const L = g.left - 6, R = g.left + g.w + 6, m = g.top + g.h * 0.45;
            return <g key={"w" + pl.k} className="wd-wob">{[-1, 0, 1].map((k) => <path key={k} d={scribble([[L, m + k * 16 - 6], [L - 9, m + k * 16], [L, m + k * 16 + 6]], k + 3, 1.2)} />)}{[-1, 0, 1].map((k) => <path key={"r" + k} d={scribble([[R, m + k * 16 - 6], [R + 9, m + k * 16], [R, m + k * 16 + 6]], k + 7, 1.2)} />)}</g>; })}
          {path && <motion.path key={sel + hov} className="wd-route" d={scribble(path, 5, 3)} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} />}
          {path && (() => { const [x, y] = path[path.length - 1]; return <path className="wd-route" d={`M${x - 7} ${y - 9} L${x} ${y} L${x + 8} ${y - 7}`} />; })()}
          {crew.orin.at === "home" && !crew.orin.walking && (() => { const [fx0, fy0] = homeOf("orin"), h = A * V["Crew height (× cell)"], hand = [fx0 + h * 0.18, fy0 - h * 0.55], tip = [hand[0] + h * 0.55, hand[1] - h * 0.75], bob = geo.pond.at(ROD.pond);
            return <g className="wd-fish"><path className="wd-rod" d={`M${hand[0]} ${hand[1]} L${tip[0]} ${tip[1]}`} /><path d={scribble([tip, [(tip[0] + bob[0]) / 2 - 10, tip[1] + 10], [bob[0], bob[1] - 4]], 9, 2)} /><ellipse className="wd-bob grain" cx={bob[0]} cy={bob[1]} rx={5} ry={6.5} /></g>; })()}
        </svg>
        {/* the crew */}
        {IDS.map((id, k) => { const c = crew[id], h = Math.round(A * V["Crew height (× cell)"]), p = pos.current[id] || homeOf(id), on = sel === id;
          return <button key={id} ref={(el) => (els.current[id] = el)} className={`wd-ag${on ? " is-on" : ""}${c.busy && !c.walking ? " is-busy" : ""}`} style={{ left: p[0], top: p[1], zIndex: zOf(id, c, p), "--c": HUE[id] }}
            aria-label={`${AG[id].n}, ${c.walking ? "walking" : c.working ? "working" : c.at === "home" ? AG[id].hangT : "done"}`} aria-pressed={on} onClick={() => { if (c.busy) return; setSel(on ? null : id); setOpen(null); }}>
            <Puppet id={id} h={h} work={!!c.working || on} march={!!c.walking} roam={0} seed={k + 5} color={HUE[id]} />
            {id === "riley" && c.at === "home" && !c.walking && <i className="wd-ball grain" />}
            {id === "calvin" && c.at === "home" && !c.walking && <span className="wd-notes" aria-hidden="true"><i>♪</i><i>♫</i><i>♪</i></span>}
            {c.working && <span className="wd-work" aria-hidden="true"><svg width="40" height="22" viewBox="0 0 40 22"><path d={scribble([[4, 14], [10, 4], [16, 14], [22, 4], [28, 14], [34, 4]], k + 2, 1.5)} /></svg></span>}
            <AnimatePresence>{on && <motion.span className="wd-tag" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{AG[id].n} · pick a building</motion.span>}</AnimatePresence>
          </button>; })}
        <AnimatePresence>{fx.map((f) => { const g = geo[f.at]; return <motion.span key={f.k} className="wd-money grain" style={{ left: g.x, top: g.top + g.h * 0.2, zIndex: 3100 }} initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: -30, scale: 1 }} exit={{ opacity: 0, y: -50 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}>{f.t}</motion.span>; })}</AnimatePresence>
        {/* the open building's card grows out of its sign */}
        <AnimatePresence>{openD && (() => { const g = geo[open], right = g.x < W * 0.62, x = right ? g.left + g.w + 6 : g.left - 6, y = Math.max(70, Math.min(H - 440, g.top + g.h * 0.1));
          const who = [...IDS.filter((id) => playOf(id, openD)), ...(playOf("sam", openD) ? ["sam"] : [])];
          return <motion.div key={open} className="wd-card" style={{ left: x, top: y, zIndex: 3200, transformOrigin: right ? "0 30%" : "100% 30%", translate: right ? "0 0" : "-100% 0" }} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
            <small>{openD.real ? "Closed this month" : "Sample account"}</small>
            <b className="wd-card-t">{openD.n}</b>
            <dl><dt>Sign</dt><dd>{SIGN[openD.stage]}</dd><dt>ARR</dt><dd>${openD.arr.toFixed(1)}K</dd><dt>{openD.signed ? "Closed" : "Closes"}</dt><dd>{openD.close}</dd>
              {openD.city && <><dt>Brokerage</dt><dd>{openD.city} · {openD.agents} agents</dd></>}{openD.champ[0] && <><dt>Champion</dt><dd>{openD.champ[0]}</dd></>}<dt>Last touch</dt><dd>{openD.touch}</dd></dl>
            {openD.threats.filter((t) => t.from <= DAY).map((t) => <p key={t.k} className={`wd-risk${t.ok ? " is-ok" : ""}`}><b>{THREATS[t.k].t}</b> {t.ok ? "Handled." : THREATS[t.k].say}</p>)}
            {!openD.signed && who.length > 0 && <div className="wd-send">{who.map((id) => <button key={id} disabled={id !== "sam" && crew[id].busy} onClick={() => send(id, open)}>
              {id === "sam" ? <span className="wd-me">S</span> : <AgentMark id={id} size={16} />}{id === "sam" ? `Call ${champOf(openD)} yourself` : `Send ${AG[id].n}`}</button>)}</div>}
          </motion.div>; })()}</AnimatePresence>
      </div>
      {/* the HUD floats over the world, frosted */}
      <div className="wd-hud">
        <div className="wd-title"><b>Sam’s world</b><span>Sample deals</span></div>
        <div className="wd-made"><p><b>${made % 1 ? made.toFixed(1) : made}K</b> of ${GOAL}K made up · 4 days left</p><span><motion.i className="grain" animate={{ width: `${Math.min(100, (made / GOAL) * 100)}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} /></span></div>
      </div>
      <button className="wd-x" aria-label="Leave game mode" onClick={onClose}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></button>
      <div className="wd-north">
        <span className="wd-nm"><NorthLogo size={16} /></span>
        <AnimatePresence mode="wait" initial={false}><motion.p key={preview || (said && said.k) || needs.length} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {preview ? <><b>If you send {AG[sel].n}:</b> {preview}</> : sel ? <><b>{AG[sel].n}</b> can help where it’s lit. Pick a building.</> : said ? <>{said.text}</>
            : needs.length ? <>{needs.length} buildings need something. {short(needs[0].n)} is {THREATS[live(needs[0])[0].k].t.toLowerCase()} {live(needs[0])[0].due === DAY ? "and slips tonight" : ""}. Tap someone, then a building.</> : "Nothing on the block needs you right now."}
        </motion.p></AnimatePresence>
        <button className="wd-ask" onClick={() => onAsk("What should I do next?")}>Ask North</button>
      </div>
    </motion.div>
  );
}
