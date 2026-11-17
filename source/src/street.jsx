// Game mode, first cut: Sam's street. Fello sells to brokerages, so his book is a neighbourhood: every account is a
// building on his block, drawn in the Agents board's own language (paper, fine isometric line, navy strokes). How big it
// is = how many agents the brokerage has. Lit windows = they're engaged (last touch recent); dark = going quiet. The lawn
// sign is the stage, in real estate words: For sale (proposal) · Offer in (pricing) · Under contract (contract out) · Sold.
// Problems float over the roof like the Sims, before they hit. The crew walk the sidewalk: pick one, pick a house, and
// they walk over, work there (their colour hatches the facade, their coat glows) and the sign changes. North's office
// is at the end of the street. Brightwater and Northgate are Sam's real October wins; the other eight are SAMPLE deals.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDialKit } from "dialkit";
import { Puppet } from "./puppet.jsx";
import { NorthLogo } from "./marks.jsx";
import { AgentMark } from "./agents.jsx";
import { DEALS, THREATS, STAGES, GOAL } from "./deals.js";

const C30 = 0.8660254;
const HUE = { orin: "#6f86e6", riley: "#5fbf8a", calvin: "#d97786", marco: "#ea86bd", fia: "#e2b552" };
const SIGN = ["For sale", "Offer in", "Under contract", "Sold"];
const AG = {
  riley: { n: "Riley", role: "Revenue", clear: ["signoff"], adv: [1, 2], play: "tightens the close plan", fix: "writes the exec summary" },
  orin: { n: "Orin", role: "GTM", clear: ["quiet"], adv: [0], play: "sends a tailored proposal", fix: "re-engages them" },
  fia: { n: "Fia", role: "Knowledge base", clear: ["security", "procure"], adv: [0], play: "sends the right case study", fix: "sends what they asked for" },
  calvin: { n: "Calvin", role: "Customer value", clear: ["sponsor"], adv: [1], play: "lines up a reference call", fix: "finds them a new sponsor" },
};
const IDS = ["riley", "orin", "fia", "calvin"];
// Sam's two real October wins live on the street too (chat.jsx: Brightwater $24.0K Oct 22, Northgate $16.2K Oct 11)
const REAL = [
  { id: "brightwater", n: "Brightwater Realty", city: "", agents: 14, arr: 24, stage: 3, close: "Oct 22", touch: "Today", real: true, champ: ["", ""], threats: [] },
  { id: "northgate", n: "Northgate Homes", city: "", agents: 20, arr: 16.2, stage: 3, close: "Oct 11", touch: "Yesterday", real: true, champ: ["", ""], threats: [] },
];
const ORDER = ["northgate", "harbor", "summit", "coast", "meridian", "brightwater", "bayview", "redwood", "oakline", "keystone"];

// the world keeps its state between visits (it's your street; it shouldn't reset because you looked away)
const WORLD = { houses: null, made: 0, ags: null };
const fresh = () => ORDER.map((id) => [...DEALS, ...REAL].find((d) => d.id === id)).map((d) => ({ ...d, threats: d.threats.map((t) => ({ ...t, ok: false })), signed: d.stage >= 3 }));
const DAY = 0; // the clock comes later: today is Tue Oct 28
const live = (d) => d.threats.filter((t) => !t.ok && t.from <= DAY);
const blocked = (d) => live(d).some((t) => THREATS[t.k].fx === "block" && (t.k !== "procure" || d.stage >= 2));
function playOf(ag, d) {
  if (!d || d.signed) return null; const A = ag === "sam" ? { clear: Object.keys(THREATS), adv: [0, 1, 2] } : AG[ag];
  const th = live(d).find((t) => A.clear.includes(t.k));
  if (th) return { kind: "clear", t: th };
  if (!blocked(d) && A.adv.includes(d.stage)) return { kind: "adv" };
  return null;
}
const sayOf = (ag, d, p) => {
  const who = ag === "sam" ? "You call" : AG[ag].n, champ = d.champ[0] && !d.champ[0].startsWith("(") ? d.champ[0].split(" ")[0] : "the team";
  if (p.kind === "clear") return ag === "sam" ? `You call ${champ}. ${THREATS[p.t.k].t} is handled.` : `${who} ${AG[ag].fix}. ${THREATS[p.t.k].t} is handled.`;
  const nx = d.stage + 1; return `${ag === "sam" ? `You call ${champ}` : `${who} ${AG[ag].play}`}. ${nx >= 3 ? `${d.n} signs: $${d.arr}K.` : `The sign goes to ${SIGN[nx]}.`}`;
};
const floorsOf = (d) => Math.min(4, 1 + Math.floor(d.agents / 20));
const lights = (d) => (d.signed || /Today|Yesterday/.test(d.touch) ? 1 : /^[23] days/.test(d.touch) ? 0.5 : 0);

// world layout: one row of buildings across the street from you, the sidewalk in front, North's office at the end
const HX = (i) => -14 + i * 3.1, HY = -3.3, HW = 1.8, FH = 0.72, WALK = -0.35, NX = 17.6;
function useSize(ref) { const [s, set] = useState({ W: 1000, H: 700 }); useLayoutEffect(() => { const el = ref.current; if (!el) return; const f = () => set({ W: el.clientWidth, H: el.clientHeight }); f(); const ro = new ResizeObserver(f); ro.observe(el); return () => ro.disconnect(); }, []); return s; }
// fit the whole street to the window: the world's extents (lots, road, office, the tallest roof and its bubble) scale to fit
const EXT = (() => { const xs = [HX(0) - 0.6, NX + 3], ys = [HY - 0.7, 2.8], zs = [0, 5 * FH + 1.6], X = [], Y = [];
  xs.forEach((x) => ys.forEach((y) => zs.forEach((z) => { X.push(x - y); Y.push((x + y) / 2 - z); }))); return { x0: Math.min(...X), x1: Math.max(...X), y0: Math.min(...Y), y1: Math.max(...Y) }; })();
const geo = (W, H) => { const u = Math.max(14, Math.min((W - 24) / ((EXT.x1 - EXT.x0) * C30), (H - 24) / (EXT.y1 - EXT.y0)));
  const ox = W / 2 - ((EXT.x0 + EXT.x1) / 2) * C30 * u, oy = H / 2 - ((EXT.y0 + EXT.y1) / 2) * u;
  return { u, P: (x, y, z = 0) => [ox + (x - y) * u * C30, oy + ((x + y) / 2) * u - z * u] }; };
const pts = (P, L) => L.map((q) => P(...q).map((v) => v.toFixed(1)).join(",")).join(" ");
function Box({ P, x, y, w, d, z0, z1, cls, style }) {
  const L = [[x, y + d, z0], [x + w, y + d, z0], [x + w, y + d, z1], [x, y + d, z1]], R = [[x + w, y, z0], [x + w, y + d, z0], [x + w, y + d, z1], [x + w, y, z1]], T = [[x, y, z1], [x + w, y, z1], [x + w, y + d, z1], [x, y + d, z1]];
  return <g className={cls} style={style}><polygon points={pts(P, L)} /><polygon points={pts(P, R)} /><polygon points={pts(P, T)} /></g>;
}

export function StreetMode({ onClose, onAsk }) {
  const V = useDialKit("Game · Sam’s street", { "Walking speed (px/s)": [150, 50, 400, 10], "Work at the house (s)": [1.6, 0.4, 5, 0.1], "Agent height (× unit)": [2.0, 1.2, 3.4, 0.1] });
  const box = useRef(null), { W, H } = useSize(box), { u, P } = geo(W, H);
  const [houses, setHouses] = useState(() => WORLD.houses || fresh()), [made, setMade] = useState(WORLD.made);
  const [ags, setAgs] = useState(() => WORLD.ags || Object.fromEntries(IDS.map((id, i) => [id, { x: -4.6 + i * 3.1, at: null, walking: false, work: false }])));
  const [sel, setSel] = useState(null), [house, setHouse] = useState(null), [hov, setHov] = useState(null), [said, setSaid] = useState(null);
  useEffect(() => { WORLD.houses = houses; WORLD.made = made; WORLD.ags = Object.fromEntries(Object.entries(ags).map(([k, a]) => [k, { ...a, walking: false, work: false }])); }, [houses, made, ags]);
  useEffect(() => { document.documentElement.classList.add("game-open"); return () => document.documentElement.classList.remove("game-open"); }, []);

  const act = (ag, id) => {
    const d = houses.find((h) => h.id === id), p = playOf(ag, d); if (!p) return;
    const done = () => {
      setHouses((hs) => hs.map((h) => { if (h.id !== id) return h; if (p.kind === "clear") return { ...h, threats: h.threats.map((t) => (t.k === p.t.k ? { ...t, ok: true } : t)), touch: "Today" };
        const stage = h.stage + 1; return { ...h, stage, signed: stage >= 3, touch: "Today" }; }));
      if (p.kind === "adv" && d.stage + 1 >= 3) setMade((m) => m + d.arr);
      setSaid({ ag, id, text: sayOf(ag, d, p), k: Date.now() });
    };
    if (ag === "sam") { done(); return; }
    const A = ags[ag], hx = HX(ORDER.indexOf(id)) + HW / 2, dist = Math.abs(A.x - hx) * u * C30 * 1.15, dur = Math.max(0.5, dist / V["Walking speed (px/s)"]);
    setAgs((s) => ({ ...s, [ag]: { ...s[ag], x: hx, at: id, walking: true, work: false, dur } }));
    setTimeout(() => { setAgs((s) => ({ ...s, [ag]: { ...s[ag], walking: false, work: true } }));
      setTimeout(() => { done(); setAgs((s) => ({ ...s, [ag]: { ...s[ag], work: false } })); }, V["Work at the house (s)"] * 1000); }, dur * 1000);
    setSel(null);
  };
  const clickHouse = (id) => { if (sel && playOf(sel, houses.find((h) => h.id === id)) && !ags[sel].walking && !ags[sel].work) { act(sel, id); setHouse(id); return; } setSel(null); setHouse(id); };
  const H0 = houses.find((h) => h.id === (hov || house));
  const preview = sel && hov ? (() => { const d = houses.find((h) => h.id === hov), p = playOf(sel, d); return p ? sayOf(sel, d, p) : `${AG[sel].n} can’t help here right now.`; })() : null;
  const needs = houses.filter((h) => !h.signed && live(h).length);

  return (
    <motion.div className="strt" role="dialog" aria-label="Game mode: your street" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <header className="strt-hud">
        <div className="strt-title"><b>Sam’s street</b><span className="strt-tag">Sample deals</span></div>
        <div className="strt-made"><p><b>${made.toFixed(made % 1 ? 1 : 0)}K</b> of ${GOAL}K made up · 4 days left</p><span className="strt-made-t"><motion.i animate={{ width: `${Math.min(100, (made / GOAL) * 100)}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} /></span></div>
        <button className="strt-x" aria-label="Leave game mode" onClick={onClose}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></button>
      </header>
      <div className="strt-body">
        <div className="strt-world" ref={box} onPointerDown={(e) => { if (e.target === e.currentTarget || e.target.closest(".strt-ground")) { setSel(null); setHouse(null); } }}>
          <svg className="strt-svg" width={W} height={H}>
            <defs><radialGradient id="swfade" cx="55%" cy="55%" r="60%"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient><mask id="swm"><rect width={W} height={H} fill="url(#swfade)" /></mask></defs>
            <g className="strt-ground" mask="url(#swm)">{Array.from({ length: 56 }, (_, i) => -18 + i * 0.75).map((v) => <g key={v}><polyline points={pts(P, [[v, -9], [v, 9]])} /><polyline points={pts(P, [[-18, v], [24, v]])} /></g>)}</g>
            {/* the street: sidewalk on your side, the road, the curb on theirs */}
            <polygon className="strt-road" points={pts(P, [[-17, 0.2], [21, 0.2], [21, 2.6], [-17, 2.6]])} />
            <polyline className="strt-lane" points={pts(P, [[-17, 1.4], [21, 1.4]])} />
            <polygon className="strt-walk" points={pts(P, [[-17, -0.8], [21, -0.8], [21, 0.2], [-17, 0.2]])} />
            {houses.map((d, i) => { const x0 = HX(i), fl = floorsOf(d), top = 0.1 + fl * FH, on = !sel || !!playOf(sel, d), here = Object.entries(ags).find(([, a]) => a.at === d.id && a.work);
              const L = lights(d), win = [];
              for (let f = 0; f < fl; f++) { const z0 = 0.1 + f * FH; [[0.3, 0.7], [1.1, 1.5]].forEach(([a, b], k) => { if (f === 0 && k === 1) return; const lit = d.signed || (L === 1) || (L === 0.5 && (f + k) % 2 === 0);
                  win.push(<polygon key={`l${f}${k}`} className={lit ? "is-lit" : ""} points={pts(P, [[x0 + a, HY + HW, z0 + 0.2], [x0 + b, HY + HW, z0 + 0.2], [x0 + b, HY + HW, z0 + 0.52], [x0 + a, HY + HW, z0 + 0.52]])} />);
                  const lit2 = d.signed || L === 1 || (L === 0.5 && (f + k + 1) % 2 === 0);
                  win.push(<polygon key={`r${f}${k}`} className={lit2 ? "is-lit" : ""} points={pts(P, [[x0 + HW, HY + a, z0 + 0.2], [x0 + HW, HY + b, z0 + 0.2], [x0 + HW, HY + b, z0 + 0.52], [x0 + HW, HY + a, z0 + 0.52]])} />); }); }
              const hatch = here ? Array.from({ length: fl * 4 }, (_, k) => 0.1 + (k + 0.5) * (fl * FH) / (fl * 4)) : [];
              return (
                <g key={d.id} className={`strt-h${on ? "" : " is-dim"}${d.signed ? " is-sold" : ""}${house === d.id || hov === d.id ? " is-on" : ""}`} onPointerEnter={() => setHov(d.id)} onPointerLeave={() => setHov(null)} onClick={() => clickHouse(d.id)} role="button" tabIndex={0} aria-label={`${d.n}: ${SIGN[d.stage]}`} onKeyDown={(e) => e.key === "Enter" && clickHouse(d.id)}>
                  <Box P={P} x={x0 - 0.35} y={HY - 0.35} w={HW + 0.7} d={HW + 1.6} z0={0} z1={0.06} cls="strt-lot" />
                  <Box P={P} x={x0} y={HY} w={HW} d={HW} z0={0.06} z1={top} cls="strt-bx" />
                  <g className="strt-win">{win}</g>
                  {/* the door, on the street side */}
                  <polygon className="strt-door" points={pts(P, [[x0 + 1.1, HY + HW, 0.06], [x0 + 1.45, HY + HW, 0.06], [x0 + 1.45, HY + HW, 0.62], [x0 + 1.1, HY + HW, 0.62]])} />
                  {hatch.map((z) => <polyline key={z} className="strt-hz" style={{ stroke: HUE[here[0]] }} points={pts(P, [[x0, HY + HW, z], [x0 + HW, HY + HW, z], [x0 + HW, HY, z]])} />)}
                  <polyline className="strt-path" points={pts(P, [[x0 + 1.27, HY + HW, 0.06], [x0 + 1.27, -0.8, 0.06]])} />
                </g>); })}
            {/* North's office at the end of the street */}
            <g className="strt-north" onClick={() => onAsk("What should I do next on my street?")} role="button" tabIndex={0} aria-label="North's office: ask North">
              <Box P={P} x={NX - 0.4} y={HY - 0.6} w={3.2} d={3.4} z0={0} z1={0.06} cls="strt-lot" />
              <Box P={P} x={NX} y={HY - 0.2} w={2.4} d={2.4} z0={0.06} z1={0.06 + 3 * FH} cls="strt-bx is-north" />
              <polygon className="strt-door" points={pts(P, [[NX + 0.9, HY + 2.2, 0.06], [NX + 1.5, HY + 2.2, 0.06], [NX + 1.5, HY + 2.2, 0.8], [NX + 0.9, HY + 2.2, 0.8]])} />
            </g>
          </svg>
          {/* signs, names and thought bubbles sit over the drawing */}
          {houses.map((d, i) => { const x0 = HX(i), [sx, sy] = P(x0 + 0.35, HY + HW + 0.85, 0.06), [bx, by] = P(x0 + HW / 2, HY + HW / 2, 0.1 + floorsOf(d) * FH + 0.5), th = live(d)[0];
            return <React.Fragment key={d.id}>
              <motion.div className={`strt-sign${d.signed ? " is-sold" : ""}${sel && !playOf(sel, d) ? " is-dim" : ""}`} style={{ left: sx, top: sy }} onClick={() => clickHouse(d.id)}>
                <AnimatePresence mode="wait" initial={false}><motion.b key={d.stage} initial={{ rotateX: 90, opacity: 0 }} animate={{ rotateX: 0, opacity: 1 }} exit={{ rotateX: -90, opacity: 0 }} transition={{ duration: 0.28 }}>{SIGN[d.stage]}</motion.b></AnimatePresence>
                <span>{d.n.replace(/ (Realty|Group|Brokers|Home Team|Partners|Collective|Properties|Living|Homes)$/, "")} · ${d.arr}K</span>
              </motion.div>
              <AnimatePresence>{th && !d.signed && (
                <motion.div key={th.k} className={`strt-bub is-${THREATS[th.k].fx}${sel && !playOf(sel, d) ? " is-dim" : ""}`} style={{ left: bx, top: by }} initial={{ opacity: 0, scale: 0.6, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6, y: -8 }} transition={{ type: "spring", stiffness: 380, damping: 24 }}>
                  <b>{THREATS[th.k].t}</b>{th.due != null && <span>{th.due === DAY ? "by tonight" : `by ${["Tue", "Wed", "Thu", "Fri"][th.due]} night`}</span>}<i /><i />
                </motion.div>)}</AnimatePresence>
            </React.Fragment>; })}
          {(() => { const [x, y] = P(NX + 1.2, HY + 1, 0.06 + 3 * FH + 0.5); return <button className="strt-nlabel" style={{ left: x, top: y }} onClick={() => onAsk("What should I do next on my street?")}><NorthLogo size={14} />North’s office</button>; })()}
          {/* the crew, on the sidewalk */}
          {IDS.map((id, k) => { const a = ags[id], [x, y] = P(a.x, a.at ? -0.55 : WALK + (k % 2) * 0.25), on = sel === id, h = Math.round(u * V["Agent height (× unit)"]);
            return <motion.button key={id} className={`strt-ag${on ? " is-on" : ""}${a.work ? " is-work" : ""}`} style={{ "--c": HUE[id] }} aria-label={`${AG[id].n}${a.work ? ", working" : ""}`} aria-pressed={on}
              initial={false} animate={{ left: x, top: y }} transition={a.walking ? { duration: a.dur, ease: "linear" } : { duration: 0.4 }}
              onClick={() => { if (a.walking || a.work) return; setSel(on ? null : id); }}>
              <Puppet id={id} h={h} work={a.work || on} roam={a.walking || a.work || a.at ? 0 : 10} march={a.walking} seed={k + 3} color={HUE[id]} />
              <AnimatePresence>{on && <motion.span className="strt-ag-t" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{AG[id].n} · pick a house</motion.span>}</AnimatePresence>
            </motion.button>; })}
        </div>
        <aside className="strt-side">
          {preview ? <div className="strt-card"><small>If you send {AG[sel].n}</small><p className="strt-say">{preview}</p></div>
            : sel ? <div className="strt-card"><small>{AG[sel].n} · {AG[sel].role}</small><p>{AG[sel].n} {[...AG[sel].clear.map(() => AG[sel].fix), `${AG[sel].play} (${AG[sel].adv.map((s) => SIGN[s].toLowerCase()).join(" or ")})`].join(", or ")}. The houses they can help are lit.</p></div>
            : said ? <motion.div key={said.k} className="strt-card" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}><small>{said.ag === "sam" ? "You" : AG[said.ag].n}</small><p className="strt-say">{said.text}</p></motion.div>
            : <div className="strt-card"><small><NorthLogo size={12} /> North</small><p>{needs.length ? `${needs.length} houses need something. ${needs.slice(0, 2).map((h) => `${h.n.split(" ")[0]}: ${THREATS[live(h)[0].k].t.toLowerCase()}`).join(". ")}.` : "Nothing on the street needs you right now."} Pick someone on the sidewalk, then a house.</p></div>}
          {H0 && <House d={H0} sel={sel} ags={ags} onSend={(ag) => act(ag, H0.id)} />}
        </aside>
      </div>
    </motion.div>
  );
}

function House({ d, sel, ags, onSend }) {
  const th = d.threats.filter((t) => t.from <= DAY), who = [...IDS.filter((id) => playOf(id, d)), ...(playOf("sam", d) ? ["sam"] : [])];
  return (
    <div className="strt-card is-house">
      <small>{d.real ? "Closed this month" : "Sample account"}</small>
      <b className="strt-card-t">{d.n}</b>
      <dl>
        <dt>Sign</dt><dd>{SIGN[d.stage]}</dd>
        <dt>ARR</dt><dd>${d.arr.toFixed(1)}K</dd>
        <dt>{d.signed ? "Closed" : "Closes"}</dt><dd>{d.close}</dd>
        {d.city && <><dt>Brokerage</dt><dd>{d.city} · {d.agents} agents</dd></>}
        {d.champ[0] && <><dt>Champion</dt><dd>{d.champ[0]}<span>{d.champ[1]}</span></dd></>}
        <dt>Last touch</dt><dd>{d.touch}</dd>
      </dl>
      {th.map((t) => <p key={t.k} className={`strt-risk${t.ok ? " is-ok" : ""}`}><b>{THREATS[t.k].t}</b> {t.ok ? "Handled." : THREATS[t.k].say}</p>)}
      {!d.signed && who.length > 0 && <div className="strt-send">{who.map((id) => (
        <button key={id} disabled={id !== "sam" && (ags[id].walking || ags[id].work)} onClick={() => onSend(id)}>
          {id === "sam" ? <span className="strt-me">S</span> : <AgentMark id={id} size={16} />}{id === "sam" ? "Call them yourself" : `Send ${AG[id].n}`}</button>))}</div>}
    </div>
  );
}
