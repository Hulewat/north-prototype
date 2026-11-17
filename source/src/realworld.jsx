// Game mode: Sam's block. A real place, photographed (generated): a well-kept West Hollywood block with absurd-scale
// real estate objects shot as if they're real (a brass key across a glass roof, a two-storey navy mailbox, a giant
// doorbell, balloons tied to a building, a pool whose diving board hangs over the street, a rooftop court, a pink slide,
// a courtyard pond with a rowing boat) and North's navy tower behind. Our crew are the only things that aren't
// photographs: the toy figures, with their own motion, walking the courtyard. On top, the same three layers as before:
// coral realtor signs (state), white hand-drawn line (intent and motion), frosted glass (cards, bubbles, the HUD).
// Click a building to go inside: a real office, the deal written on its whiteboard in marker, and things to use (the
// phone, the mail, the table where whoever you bring in sits down and works).
// The eight prospects are SAMPLE deals (deals.js). Brightwater and Northgate are Sam's real October wins.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate } from "motion/react";
import { useDialKit } from "dialkit";
import { Puppet } from "./puppet.jsx";
import { NorthLogo } from "./marks.jsx";
import { AgentMark } from "./agents.jsx";
import { DEALS, THREATS, GOAL } from "./deals.js";
import { PHOTO } from "./real-art.js";

const IW = 1536, IH = 864;
const HUE = { orin: "#6f86e6", riley: "#5fbf8a", calvin: "#d97786", marco: "#ea86bd", fia: "#e2b552" };
const SIGN = ["For sale", "Offer in", "Under contract", "Sold"];
const AG = {
  riley: { n: "Riley", role: "Revenue", clear: ["signoff"], adv: [1, 2], play: "tightens the close plan", fix: "writes the exec summary", hang: [520, 128], hangT: "shooting hoops on the roof" },
  orin: { n: "Orin", role: "GTM", clear: ["quiet"], adv: [0], play: "sends a tailored proposal", fix: "re-engages them", hang: [702, 452], hangT: "fishing in the pond" },
  fia: { n: "Fia", role: "Knowledge base", clear: ["security", "procure"], adv: [0], play: "sends the right case study", fix: "sends what they asked for", hang: [728, 318], hangT: "reading at the café" },
  calvin: { n: "Calvin", role: "Customer value", clear: ["sponsor"], adv: [1], play: "lines up a reference call", fix: "finds them a new sponsor", hang: [872, 334], hangT: "under the umbrellas" },
  marco: { n: "Marco", role: "Marketing", clear: [], adv: [0], play: "sends the webinar recap", fix: "", hang: [1428, 452], hangT: "by the slide" },
};
const IDS = ["riley", "orin", "fia", "calvin", "marco"];
const REAL = [
  { id: "brightwater", n: "Brightwater Realty", city: "", agents: 14, arr: 24, stage: 3, close: "Oct 22", touch: "Today", real: true, champ: ["", ""], threats: [] },
  { id: "northgate", n: "Northgate Homes", city: "", agents: 20, arr: 16.2, stage: 3, close: "Oct 11", touch: "Yesterday", real: true, champ: ["", ""], threats: [] },
];
// the buildings in the photograph (image px): where it is (an ellipse round it), its roof, its door on the courtyard
// side, which interior it has. Measured off the picture.
const BLD = [
  { k: "north", c: [810, 130], r: [60, 135], roof: [810, 8], door: [800, 276] },
  { k: "harbor", deal: "harbor", c: [258, 268], r: [190, 112], roof: [262, 168], door: [440, 344], room: "in1", what: "the pool with the diving board" },
  { k: "brightwater", deal: "brightwater", c: [528, 172], r: [178, 120], roof: [528, 78], door: [622, 300], room: "in1", what: "the rooftop court" },
  { k: "keystone", deal: "keystone", c: [1010, 205], r: [112, 150], roof: [1015, 10], door: [936, 322], room: "in2", what: "the balloons" },
  { k: "bayview", deal: "bayview", c: [1170, 262], r: [112, 112], roof: [1168, 150], door: [1086, 346], room: "in2", what: "the doorbell" },
  { k: "coast", deal: "coast", c: [1368, 340], r: [150, 150], roof: [1368, 196], door: [1318, 496], room: "in2", what: "the slide" },
  { k: "summit", deal: "summit", c: [1205, 492], r: [108, 140], roof: [1205, 360], door: [1112, 612], room: "in2", what: "the mailbox" },
  { k: "redwood", deal: "redwood", c: [555, 560], r: [170, 150], roof: [560, 425], door: [722, 520], room: "in1", what: "the key on the roof" },
  { k: "oakline", deal: "oakline", c: [892, 662], r: [200, 175], roof: [900, 490], door: [748, 584], room: "in1", what: "the curved corner" },
  { k: "meridian", deal: "meridian", c: [386, 432], r: [130, 112], roof: [340, 338], door: [560, 420], room: "in1", what: "the white block" },
  { k: "northgate", deal: "northgate", c: [182, 82], r: [175, 82], roof: [182, 14], door: [334, 198], room: "in1", what: "the corner" },
];
// the courtyard: a ring round the pond. Every walk goes door → ring → round → ring → door
const RING = [[702, 334], [860, 318], [962, 430], [902, 528], [704, 528], [640, 424]];
// inside: the whiteboard (three corners), the things you can use, where people stand
const ROOMS = {
  in1: { board: [[778, 50], [1178, 85], [778, 262]], phone: [252, 392], mail: [1468, 470], coffee: [596, 158], table: [800, 560], stand: [[648, 470], [1010, 452], [560, 690]] },
  in2: { board: [[884, 153], [1290, 173], [881, 330]], phone: [1170, 535], mail: [695, 232], coffee: [1340, 440], table: [755, 600], stand: [[560, 560], [960, 520], [700, 760]] },
};

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
// where each stage word starts on the whiteboard (marker at 19px is about 7px a letter, plus room for the arrow)
const MX = SIGN.reduce((a, t, i) => [...a, i ? a[i - 1] + SIGN[i - 1].length * 7 + 30 : 22], []);
const short = (n) => n.replace(/ (Realty|Group|Brokers|Home Team|Partners|Collective|Properties|Living|Homes)$/, "");
const near = (p) => RING.reduce((b, q, i) => (Math.hypot(q[0] - p[0], q[1] - p[1]) < b[0] ? [Math.hypot(q[0] - p[0], q[1] - p[1]), i] : b), [1e9, 0])[1];
function route(from, to) {
  const a = near(from), b = near(to), n = RING.length, fw = (b - a + n) % n, bw = (a - b + n) % n, out = [from];
  if (fw <= bw) for (let k = 0; k <= fw; k++) out.push(RING[(a + k) % n]); else for (let k = 0; k <= bw; k++) out.push(RING[(a - k + n) % n]);
  out.push(to); return out;
}
function scribble(pts, seed = 1, amt = 2.2) {
  let s = seed * 9301 + 49297; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280 - 0.5) * amt;
  const P = pts.map(([x, y], i) => (i === 0 || i === pts.length - 1 ? [x, y] : [x + r(), y + r()]));
  let d = `M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
  for (let i = 1; i < P.length; i++) { const [x0, y0] = P[i - 1], [x1, y1] = P[i], mx = (x0 + x1) / 2 + r(), my = (y0 + y1) / 2 + r(); d += ` Q${mx.toFixed(1)} ${my.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`; }
  return d;
}
function useSize(ref) { const [s, set] = useState({ W: 1200, H: 800 }); useLayoutEffect(() => { const el = ref.current; if (!el) return; const f = () => set({ W: el.clientWidth, H: el.clientHeight }); f(); const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect(); }, []); return s; }

export function RealWorld({ onClose, onAsk }) {
  const V = useDialKit("Game · Sam’s block", { "Walking speed (px/s)": [150, 40, 400, 5], "Work time (s)": [1.8, 0.4, 5, 0.1], "Crew height outside (px)": [62, 30, 110, 1], "Crew height inside (px)": [230, 120, 360, 2], "Spotlight dim": [0.38, 0, 0.8, 0.01], "Zoom into a building (s)": [0.7, 0.2, 1.6, 0.05] });
  const box = useRef(null), { W, H } = useSize(box);
  const s = Math.max(W / IW, H / IH), ox = (W - IW * s) / 2, oy = (H - IH * s) / 2, scr = (p) => [ox + p[0] * s, oy + p[1] * s];
  const [deals, setDeals] = useState(() => WORLD.deals || freshDeals()), [made, setMade] = useState(WORLD.made);
  useEffect(() => { WORLD.deals = deals; WORLD.made = made; }, [deals, made]);
  useEffect(() => { document.documentElement.classList.add("game-open"); return () => document.documentElement.classList.remove("game-open"); }, []);
  const dealOf = (b) => b && deals.find((d) => d.id === b.deal);
  const [crew, setCrew] = useState(() => Object.fromEntries(IDS.map((id) => [id, { at: "home" }])));
  const pos = useRef(Object.fromEntries(IDS.map((id) => [id, AG[id].hang]))), els = useRef({});
  const [sel, setSel] = useState(null), [hov, setHov] = useState(null), [inside, setInside] = useState(null), [said, setSaid] = useState(null), [fx, setFx] = useState([]);

  const walk = (id, path, then) => {
    const el = els.current[id]; if (!el) { then && then(); return; } let tot = 0; const L = path.slice(1).map((p, i) => { const d = Math.hypot(p[0] - path[i][0], p[1] - path[i][1]); tot += d; return d; });
    let acc = 0; const times = [0, ...L.map((d) => (acc += d) / (tot || 1))];
    setCrew((c) => ({ ...c, [id]: { ...c[id], walking: true } }));
    animate(el, { left: path.map((p) => p[0] + "px"), top: path.map((p) => p[1] + "px") }, { duration: Math.max(0.6, tot / V["Walking speed (px/s)"]), times, ease: "linear", onUpdate: () => { el.style.zIndex = Math.round(parseFloat(el.style.top)); } })
      .then(() => { pos.current[id] = path[path.length - 1]; setCrew((c) => ({ ...c, [id]: { ...c[id], walking: false } })); then && then(); });
  };
  // the thing itself: a deal moves (or its problem goes away), the sign flips, a signing lands as money
  const land = (id, b, d, p) => {
    setDeals((ds) => ds.map((x) => { if (x.id !== d.id) return x; if (p.kind === "clear") return { ...x, threats: x.threats.map((t) => (t.k === p.t.k ? { ...t, ok: true } : t)), touch: "Today" };
      const st = x.stage + 1; return { ...x, stage: st, signed: st >= 3, touch: "Today" }; }));
    if (p.kind === "adv" && d.stage + 1 >= 3) { setMade((m) => m + d.arr); setFx((f) => [...f, { k: Date.now(), at: b.k, t: `+$${d.arr}K` }]); }
    setSaid({ text: sayOf(id, d, p), k: Date.now() });
  };
  // send someone from the street: they walk the courtyard to the door, work, and wander back
  const send = (id, b) => {
    const d = dealOf(b), p = playOf(id, d); if (!p || crew[id].busy) return; setSel(null);
    setCrew((c) => ({ ...c, [id]: { ...c[id], busy: true, at: b.k } }));
    walk(id, route(pos.current[id], b.door), () => {
      setCrew((c) => ({ ...c, [id]: { ...c[id], working: true } }));
      setTimeout(() => { land(id, b, d, p); setCrew((c) => ({ ...c, [id]: { ...c[id], working: false } }));
        setTimeout(() => walk(id, route(pos.current[id], AG[id].hang), () => setCrew((c) => ({ ...c, [id]: { at: "home" } }))), 1800); }, V["Work time (s)"] * 1000);
    });
  };
  const clickB = (b) => { if (b.k === "north") { onAsk("What should I do next?"); return; } const d = dealOf(b);
    if (sel && d && playOf(sel, d)) { send(sel, b); return; } setSel(null); setInside(b.k); };
  useEffect(() => { if (!fx.length) return; const t = setTimeout(() => setFx((f) => f.slice(1)), 1800); return () => clearTimeout(t); }, [fx]);

  const hb = hov && BLD.find((b) => b.k === hov), hd = dealOf(hb);
  const preview = sel && hd ? (playOf(sel, hd) ? sayOf(sel, hd, playOf(sel, hd)) : `${AG[sel].n} can’t move ${short(hd.n)} right now.`) : null;
  const path = sel && hd && playOf(sel, hd) && !crew[sel].busy ? route(pos.current[sel], hb.door) : null;
  const needs = deals.filter((d) => !d.signed && live(d).length);
  const ib = inside && BLD.find((b) => b.k === inside);

  return (
    <motion.div className="rw" role="dialog" aria-label="Game mode: Sam's block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} ref={box}>
      {/* the block. Going inside, the camera pushes into the building and the street goes soft behind the room */}
      <motion.div className="rw-stage" style={{ width: IW, height: IH, left: ox, top: oy, scale: s, transformOrigin: "0 0" }}>
        <motion.div className="rw-cam" animate={ib ? { scale: 2.6, x: IW / 2 - ib.c[0] * 2.6, y: IH / 2 - ib.c[1] * 2.6, filter: "blur(10px)" } : { scale: 1, x: 0, y: 0, filter: "blur(0px)" }}
          style={{ transformOrigin: "0 0" }} transition={{ duration: V["Zoom into a building (s)"], ease: [0.65, 0, 0.35, 1] }}>
          <img className="rw-photo" src={PHOTO.block.src} alt="" draggable="false" />
          {/* point at a building and the rest of the block dims round it */}
          <div className="rw-spot" style={{ opacity: hb && !ib ? 1 : 0, "--x": `${(hb || BLD[0]).c[0]}px`, "--y": `${(hb || BLD[0]).c[1]}px`, "--rx": `${(hb || BLD[0]).r[0] * 1.15}px`, "--ry": `${(hb || BLD[0]).r[1] * 1.15}px`, "--dim": V["Spotlight dim"] }} />
          {BLD.map((b) => { const d = dealOf(b), on = !sel || b.k === "north" || (d && playOf(sel, d));
            return <button key={b.k} className={`rw-hit${on ? "" : " is-off"}`} style={{ left: b.c[0] - b.r[0], top: b.c[1] - b.r[1], width: b.r[0] * 2, height: b.r[1] * 2 }}
              onPointerEnter={() => setHov(b.k)} onPointerLeave={() => setHov(null)} onClick={() => clickB(b)} aria-label={b.k === "north" ? "North's tower: ask North" : `${d.n}: ${SIGN[d.stage]}. Go inside`} />; })}
          {/* realtor signs on the courtyard side of every brokerage */}
          {BLD.filter((b) => b.deal).map((b) => { const d = dealOf(b), on = !sel || playOf(sel, d);
            return <div key={"s" + b.k} className={`rw-sign${d.signed ? " is-sold" : ""}${on ? "" : " is-off"}`} style={{ left: b.door[0], top: b.door[1], zIndex: Math.round(b.door[1]) }} onClick={() => clickB(b)}>
              <AnimatePresence mode="wait" initial={false}><motion.b key={d.stage} className="grain" initial={{ rotateX: -90 }} animate={{ rotateX: 0 }} exit={{ rotateX: 90 }} transition={{ duration: 0.26 }}>{SIGN[d.stage]}</motion.b></AnimatePresence>
              <span>{short(d.n)} · ${d.arr}K</span><i />
            </div>; })}
          {/* trouble before it hits, over the roof */}
          {BLD.filter((b) => b.deal).map((b) => { const d = dealOf(b), th = live(d)[0]; if (!th || d.signed) return null;
            return <motion.div key={"n" + b.k + th.k} className={`rw-need${th.due === DAY ? " is-now" : ""}`} style={{ left: b.roof[0], top: b.roof[1] }} initial={{ opacity: 0, scale: 0.7, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7 }} transition={{ type: "spring", stiffness: 380, damping: 24 }}>
              <b>{THREATS[th.k].t}</b><span>{th.due == null ? "until someone sorts it" : th.due === DAY ? "by tonight" : `by ${["Tue", "Wed", "Thu", "Fri"][th.due]} night`}</span></motion.div>; })}
          <svg className="rw-ink" width={IW} height={IH} aria-hidden="true">
            {BLD.filter((b) => b.deal).map((b) => { const d = dealOf(b), th = live(d)[0]; if (!th || d.signed || th.due !== DAY) return null; const L = b.c[0] - b.r[0] * 0.8, R = b.c[0] + b.r[0] * 0.8, m = b.c[1];
              return <g key={"w" + b.k} className="rw-wob">{[-1, 0, 1].map((k) => <path key={k} d={scribble([[L, m + k * 18 - 7], [L - 11, m + k * 18], [L, m + k * 18 + 7]], k + 3, 1.2)} />)}{[-1, 0, 1].map((k) => <path key={"r" + k} d={scribble([[R, m + k * 18 - 7], [R + 11, m + k * 18], [R, m + k * 18 + 7]], k + 7, 1.2)} />)}</g>; })}
            {path && <motion.path key={sel + hov} className="rw-route" d={scribble(path, 5, 4)} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />}
            {crew.orin.at === "home" && !crew.orin.walking && (() => { const [x, y] = pos.current.orin, h = V["Crew height outside (px)"], hand = [x + h * 0.16, y - h * 0.55], tip = [hand[0] + h * 0.6, hand[1] - h * 0.6], bob = [792, 432];
              return <g><path className="rw-rod" d={`M${hand[0]} ${hand[1]} L${tip[0]} ${tip[1]}`} /><path d={scribble([tip, [(tip[0] + bob[0]) / 2, tip[1] + 6], [bob[0], bob[1] - 4]], 9, 2)} /><ellipse className="rw-bob grain" cx={bob[0]} cy={bob[1]} rx={4.5} ry={6} /></g>; })()}
          </svg>
          {IDS.map((id, k) => { const c = crew[id], p = pos.current[id], on = sel === id;
            return <button key={id} ref={(el) => (els.current[id] = el)} className={`rw-ag${on ? " is-on" : ""}`} style={{ left: p[0], top: p[1], zIndex: Math.round(p[1]) + 1 }} aria-pressed={on}
              aria-label={`${AG[id].n}, ${c.walking ? "walking" : c.working ? "working" : c.at === "home" ? AG[id].hangT : "done"}`} onClick={() => { if (c.busy) return; setSel(on ? null : id); }}>
              <Puppet id={id} h={V["Crew height outside (px)"]} work={!!c.working || on} march={!!c.walking} roam={0} seed={k + 5} color={HUE[id]} />
              {id === "riley" && c.at === "home" && !c.walking && <i className="rw-ball grain" />}
              {id === "calvin" && c.at === "home" && !c.walking && <span className="rw-notes" aria-hidden="true"><i>♪</i><i>♫</i></span>}
              {c.working && <span className="rw-work" aria-hidden="true"><svg width="34" height="18" viewBox="0 0 34 18"><path d={scribble([[3, 12], [9, 4], [15, 12], [21, 4], [27, 12], [31, 5]], k + 2, 1.4)} /></svg></span>}
            </button>; })}
          <AnimatePresence>{fx.map((f) => { const b = BLD.find((x) => x.k === f.at); return <motion.span key={f.k} className="rw-money grain" style={{ left: b.roof[0], top: b.roof[1] + 30 }} initial={{ opacity: 0, y: 10, scale: 0.8 }} animate={{ opacity: 1, y: -24, scale: 1 }} exit={{ opacity: 0, y: -40 }} transition={{ type: "spring", stiffness: 220, damping: 18 }}>{f.t}</motion.span>; })}</AnimatePresence>
        </motion.div>
      </motion.div>
      {/* a tag over whoever's picked, in screen space so it stays crisp */}
      <AnimatePresence>{sel && !ib && (() => { const [x, y] = scr(pos.current[sel]); return <motion.span key={sel} className="rw-tag" style={{ left: x, top: y - V["Crew height outside (px)"] * s - 10 }} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{AG[sel].n} · pick a building</motion.span>; })()}</AnimatePresence>
      <AnimatePresence>{ib && <Inside key={ib.k} b={ib} d={dealOf(ib)} V={V} W={W} H={H} crew={crew} onLeave={() => setInside(null)} onDo={(id, p) => { const d = dealOf(ib); land(id, ib, d, p); }} />}</AnimatePresence>
      {!ib && <div className="rw-hud">
        <div className="rw-title"><b>Sam’s block</b><span>Sample deals</span></div>
        <div className="rw-made"><p><b>${made % 1 ? made.toFixed(1) : made}K</b> of ${GOAL}K made up · 4 days left</p><span><motion.i className="grain" animate={{ width: `${Math.min(100, (made / GOAL) * 100)}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} /></span></div>
      </div>}
      <button className="rw-x" aria-label="Leave game mode" onClick={onClose}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></button>
      {!ib && <div className="rw-north">
        <span className="rw-nm"><NorthLogo size={16} /></span>
        <AnimatePresence mode="wait" initial={false}><motion.p key={preview || (said && said.k) || needs.length + (hd ? hd.id : "")} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          {preview ? <><b>If you send {AG[sel].n}:</b> {preview}</> : sel ? <><b>{AG[sel].n}</b> can help where it’s lit. Pick a building.</> : said ? said.text
            : hd ? <><b>{hd.n}</b> · {SIGN[hd.stage]} · ${hd.arr}K. Click to go inside.</> : needs.length ? <>{needs.length} buildings need something. {short(needs[0].n)} is {THREATS[live(needs[0])[0].k].t.toLowerCase()}{live(needs[0])[0].due === DAY ? " and slips tonight" : ""}. Pick someone in the courtyard, or walk into a building.</> : "Nothing on the block needs you right now."}
        </motion.p></AnimatePresence>
        <button className="rw-ask" onClick={() => onAsk("What should I do next?")}>Ask North</button>
      </div>}
    </motion.div>
  );
}

// inside a building: the room fills the window, the deal is on the whiteboard in marker, and the room's things do things
function Inside({ b, d, V, W, H, crew, onLeave, onDo }) {
  const R = ROOMS[b.room], s = Math.max(W / IW, H / IH), ox = (W - IW * s) / 2, oy = (H - IH * s) / 2;
  const [open, setOpen] = useState(null), [here, setHere] = useState([]), [busy, setBusy] = useState(null), [ring, setRing] = useState(false), [note, setNote] = useState(null);
  const [[x0, y0], [x1, y1], [x2, y2]] = R.board, BW = 400, BH = 212;
  const M = `matrix(${(x1 - x0) / BW} ${(y1 - y0) / BW} ${(x2 - x0) / BH} ${(y2 - y0) / BH} ${x0} ${y0})`;
  const who = Object.keys(AG).filter((id) => playOf(id, d));
  // bring someone in: they walk in from the door side, sit at the table, work, and the board changes
  const bring = (id) => { const p = playOf(id, d); if (!p || busy) return; setOpen(null); const k = here.length % R.stand.length; setHere((h) => [...h.filter((x) => x.id !== id), { id, at: R.stand[k], work: false }]);
    setTimeout(() => { setHere((h) => h.map((x) => (x.id === id ? { ...x, work: true } : x))); setBusy(id);
      setTimeout(() => { onDo(id, p); setNote(sayOf(id, d, p)); setBusy(null); setHere((h) => h.map((x) => (x.id === id ? { ...x, work: false } : x))); }, V["Work time (s)"] * 1000); }, 900); };
  const call = () => { const p = playOf("sam", d); setOpen(null); if (!p) return; setRing(true); setTimeout(() => { setRing(false); onDo("sam", p); setNote(sayOf("sam", d, p)); }, 1400); };
  const th = d.threats.filter((t) => t.from <= DAY);
  const spot = (k, at, label, body) => { const [x, y] = [ox + at[0] * s, oy + at[1] * s];
    return <button key={k} className={`rw-hs${open === k ? " is-open" : ""}`} style={{ left: x, top: y }} onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k}><i /><span>{label}</span></button>; };
  const cardAt = (at) => { const [x, y] = [ox + at[0] * s, oy + at[1] * s], right = x < W * 0.62; return { left: right ? x + 22 : x - 22, top: Math.max(80, Math.min(H - 300, y - 30)), translate: right ? "0 0" : "-100% 0" }; };
  return (
    <motion.div className="rw-in" initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.04 }} transition={{ duration: V["Zoom into a building (s)"] * 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}>
      <div className="rw-in-stage" style={{ width: IW, height: IH, left: ox, top: oy, transform: `scale(${s})`, transformOrigin: "0 0" }}>
        <img className="rw-photo" src={PHOTO[b.room].src} alt="" draggable="false" />
        {/* the deal, in marker, on their whiteboard */}
        <svg className="rw-board" width={IW} height={IH} aria-label={`Whiteboard: ${d.n}, ${SIGN[d.stage]}`}>
          <g transform={M}>
            <text x={22} y={44} className="mk is-big">{d.n}</text>
            <text x={22} y={70} className="mk">${d.arr}K · closes {d.close}{d.champ[0] && !d.champ[0].startsWith("(") ? ` · ${d.champ[0]}` : ""}</text>
            {SIGN.map((t, i) => <g key={t}><text x={MX[i]} y={118} className={`mk${i === d.stage ? " is-on" : i < d.stage ? " is-done" : ""}`}>{t}</text>
              {i < 3 && <path className="mk-l" d={`M${MX[i] + t.length * 7 + 5} 112 l12 0 m-4 -4 l4 4 l-4 4`} />}</g>)}
            <motion.ellipse key={d.stage} className="mk-ring" cx={MX[d.stage] + SIGN[d.stage].length * 3.5} cy={112} rx={SIGN[d.stage].length * 4.2 + 10} ry={16} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />
            {th.map((t, i) => <text key={t.k} x={22} y={160 + i * 26} className={`mk${t.ok ? " is-done" : " is-red"}`}>{t.ok ? "✓ " : "! "}{THREATS[t.k].t}{t.ok ? "" : t.due == null ? "" : t.due === DAY ? " (tonight)" : ` (by ${["Tue", "Wed", "Thu", "Fri"][t.due]})`}</text>)}
            {!th.length && <text x={22} y={160} className="mk">{d.signed ? "Signed. Kickoff next." : "Next: keep it moving"}</text>}
          </g>
        </svg>
        {here.map((x, k) => <div key={x.id} className="rw-in-ag" style={{ left: x.at[0], top: x.at[1], zIndex: Math.round(x.at[1]) }}>
          <motion.div initial={{ opacity: 0, x: -80 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}><Puppet id={x.id} h={V["Crew height inside (px)"]} work={x.work} march={false} roam={0} seed={k + 11} color={HUE[x.id]} /></motion.div></div>)}
        {ring && <svg className="rw-ring" width={IW} height={IH} aria-hidden="true">{[0, 1, 2].map((k) => <path key={k} d={scribble([[R.phone[0] - 34 - k * 12, R.phone[1] - 10], [R.phone[0] - 44 - k * 12, R.phone[1] - 30], [R.phone[0] - 30 - k * 12, R.phone[1] - 50]], k + 1, 2)} />)}{[0, 1, 2].map((k) => <path key={"r" + k} d={scribble([[R.phone[0] + 34 + k * 12, R.phone[1] - 10], [R.phone[0] + 44 + k * 12, R.phone[1] - 30], [R.phone[0] + 30 + k * 12, R.phone[1] - 50]], k + 4, 2)} />)}</svg>}
      </div>
      {spot("phone", R.phone, d.signed ? "Phone" : `Call ${champOf(d)}`)}
      {spot("table", R.table, "Bring someone in")}
      {spot("mail", R.mail, "The mail")}
      {spot("coffee", R.coffee, "Coffee chat")}
      <AnimatePresence>{open && (
        <motion.div key={open} className="rw-card" style={cardAt(R[open])} initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: "spring", stiffness: 420, damping: 32 }}>
          {open === "phone" && <>{d.signed ? <p>They’ve signed. Nothing to chase.</p> : playOf("sam", d) ? <><small>You, on the phone</small><p>{sayOf("sam", d, playOf("sam", d))}</p><div className="rw-send"><button onClick={call}><span className="rw-me">S</span>Call {champOf(d)} now</button></div></> : <p>Nothing a call fixes right now.</p>}</>}
          {open === "table" && <>{d.signed ? <p>Signed. The table’s free.</p> : who.length ? <><small>Who can help here</small><div className="rw-send">{who.map((id) => <button key={id} disabled={!!busy || crew[id]?.busy} onClick={() => bring(id)}><AgentMark id={id} size={16} />{AG[id].n} <em>{sayOf(id, d, playOf(id, d)).replace(/^\S+\s/, "")}</em></button>)}</div></> : <p>No one on the crew can move this one right now. Try the phone.</p>}</>}
          {open === "mail" && <><small>Last touch · {d.touch}</small><p>{d.id === "summit" ? "One follow-up is drafted to Marcus: a short note picking up from the pricing call. It goes out from you." : live(d).length ? THREATS[live(d)[0].k].say : "Nothing waiting. The last thread is answered."}</p></>}
          {open === "coffee" && <><small>{d.real ? "Closed this month" : "Sample account"}</small><b className="rw-card-t">{d.n}</b><dl>{d.city && <><dt>Brokerage</dt><dd>{d.city} · {d.agents} agents</dd></>}{d.champ[0] && <><dt>Champion</dt><dd>{d.champ[0]}{d.champ[1] && <span>{d.champ[1]}</span>}</dd></>}{d.src && <><dt>Source</dt><dd>{d.src}</dd></>}<dt>ARR</dt><dd>${d.arr.toFixed(1)}K</dd></dl></>}
        </motion.div>)}</AnimatePresence>
      <div className="rw-in-top">
        <button className="rw-back" onClick={onLeave}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M8.5 2.5L4 7l4.5 4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>Back to the block</button>
        <span className="rw-in-n"><b>{d.n}</b> · {SIGN[d.stage]}</span>
      </div>
      <AnimatePresence>{note && <motion.div key={note} className="rw-north is-in" initial={{ opacity: 0, y: 8, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, x: "-50%" }}><span className="rw-nm"><NorthLogo size={16} /></span><p>{note}</p></motion.div>}</AnimatePresence>
    </motion.div>
  );
}
