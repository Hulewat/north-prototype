// Game mode: the close, played like Into the Breach. Four days left, three moves a day. Every deal is a piece on a target:
// the outer ring is Proposal, then Pricing, then Contract out; the centre is signed. What will go wrong is shown before
// it happens (a red tag on the deal, and when it fires). Pick who acts (you or an agent), hover a deal to see exactly
// what the move does, click to commit. End the day and whatever nobody dealt with fires. It's deterministic: the
// preview is the result. North reads the board and, if you ask, says what it would do.
// The deals are SAMPLE data (deals.js), sized to the real $140K gap.
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDialKit } from "dialkit";
import { Puppet } from "./puppet.jsx";
import { NorthLogo } from "./marks.jsx";
import { DEALS, THREATS, STAGES, DAYS, GOAL, sumK, OCT } from "./deals.js";

const HUE = { orin: "#8ea2f2", riley: "#7fd0a3", calvin: "#e7949f", marco: "#f2a0cc", fia: "#f0cd7a", sam: "#cfe0ee" };
// who can do what. Agents each have a specialty; you can do anything, once a day, like anyone else
const UNITS = {
  sam: { n: "You", role: "Call them", clear: Object.keys(THREATS), adv: [0, 1, 2] },
  riley: { n: "Riley", role: "Revenue", clear: ["signoff"], adv: [1, 2], play: "Tighten the close plan" },
  orin: { n: "Orin", role: "GTM", clear: ["quiet"], adv: [0], play: "Send a tailored proposal" },
  fia: { n: "Fia", role: "Knowledge base", clear: ["security", "procure"], adv: [0], play: "Send the right case study" },
  calvin: { n: "Calvin", role: "Customer value", clear: ["sponsor"], adv: [1], play: "Line up a reference call" },
};
const CLEAR = { quiet: "Re-engage Marcus", signoff: "Write the exec summary", security: "Send the security docs", sponsor: "Find a new sponsor", procure: "Send the vendor packet" };
const UIDS = ["sam", "riley", "orin", "fia", "calvin"];
// North's plan, if you ask: one way through that lands all six October deals (the board is built so it's tight)
const PLAN = [[["orin", "summit"], ["riley", "harbor"], ["sam", "redwood"]], [["riley", "bayview"], ["fia", "coast"], ["calvin", "meridian"]],
  [["riley", "bayview"], ["sam", "coast"], ["calvin", "meridian"]], [["calvin", "summit"], ["riley", "summit"], ["sam", "meridian"]]];

const fresh = () => ({ day: 0, used: {}, n: 0, hist: [], fired: [], over: false,
  deals: DEALS.map((d) => ({ ...d, threats: d.threats.map((t) => ({ ...t, ok: false })), cold: false, signed: false, slipped: false })) });
const live = (d, day) => d.threats.filter((t) => !t.ok && t.from <= day);
const blocked = (d, day) => live(d, day).some((t) => THREATS[t.k].fx === "block" && (t.k !== "procure" || d.stage >= 2));
function playOf(u, d, day) {
  if (!d || d.signed || d.cold) return null; const U = UNITS[u];
  const th = live(d, day).find((t) => U.clear.includes(t.k));
  if (th) return { kind: "clear", t: th, label: u === "sam" ? `Call ${d.champ[0].startsWith("(") ? "the team" : d.champ[0].split(" ")[0]}: ${THREATS[th.k].t.toLowerCase()}` : CLEAR[th.k] };
  if (!blocked(d, day) && U.adv.includes(d.stage)) return { kind: "adv", label: u === "sam" ? `Call ${d.champ[0].startsWith("(") ? "the team" : d.champ[0].split(" ")[0]}: move to ${STAGES[d.stage + 1].toLowerCase()}` : `${U.play}: move to ${STAGES[d.stage + 1].toLowerCase()}` };
  return null;
}
function apply(S, u, id) {
  const d0 = S.deals.find((d) => d.id === id), pl = playOf(u, d0, S.day); if (!pl) return S;
  const deals = S.deals.map((d) => { if (d.id !== id) return d;
    if (pl.kind === "clear") return { ...d, threats: d.threats.map((t) => (t === pl.t ? { ...t, ok: true } : t)) };
    const stage = d.stage + 1; return { ...d, stage, signed: stage >= 3 }; });
  return { ...S, deals, used: { ...S.used, [u]: true }, n: S.n + 1, hist: [...S.hist, S], fired: [] };
}
function endDay(S) {
  const fired = [];
  const deals = S.deals.map((d) => { if (d.signed || d.cold) return d; let x = d;
    live(d, S.day).filter((t) => t.due === S.day).forEach((t) => { const fx = THREATS[t.k].fx; fired.push({ id: d.id, k: t.k, fx });
      if (fx === "cold") x = { ...x, cold: true };
      if (fx === "back") x = { ...x, stage: Math.max(0, x.stage - 1), slipped: true, threats: x.threats.map((y) => (y === t ? { ...y, ok: true } : y)) }; });
    return x; });
  const day = S.day + 1;
  return { ...S, deals, day: Math.min(day, 3), used: {}, n: 0, hist: [], fired, over: day > 3 };
}
const banked = (S) => sumK(S.deals.filter((d) => d.signed));
const short = (n) => n.split(" ")[0].replace(/&$/, "");

// what North says at the start of each day: what fires tonight, plainly. No list, just the threats
function readOf(S) {
  const tonight = S.deals.filter((d) => !d.signed && !d.cold).flatMap((d) => live(d, S.day).filter((t) => t.due === S.day).map((t) => [d, t]));
  const fired = S.fired.map((f) => { const d = S.deals.find((x) => x.id === f.id); return f.fx === "cold" ? `${d.n} went cold overnight. It’s a November deal now.` : `${d.n}’s legal restarted the contract. It’s back to ${STAGES[d.stage].toLowerCase()}.`; });
  if (S.day === 0 && !S.n && !S.fired.length) return `Six deals can still land October. Together they’re $${sumK(OCT)}K and you need $${GOAL}K, so every one counts. Oakline is the biggest, but it can’t sign until it has a vendor packet, and it needs four moves to land in time.`;
  const t = tonight.length ? `Tonight: ${tonight.map(([d, th]) => `${d.n} ${THREATS[th.k].fx === "cold" ? "goes cold" : "restarts its contract"} unless someone ${th.k === "quiet" ? "re-engages them" : th.k === "signoff" ? "gets the exec sign-off" : "answers legal"}`).join("; ")}.` : "Nothing fires tonight. Spend the day moving deals.";
  return [...fired, t].join(" ");
}
function hintOf(S) {
  const plan = (PLAN[S.day] || []).find(([u, id]) => !S.used[u] && playOf(u, S.deals.find((d) => d.id === id), S.day));
  if (plan) return plan;
  // off the plan: the most urgent thing anyone free can do (a threat that fires tonight, then the deal closest to signing)
  const free = UIDS.filter((u) => !S.used[u]), opts = [];
  S.deals.forEach((d) => free.forEach((u) => { const p = playOf(u, d, S.day); if (!p) return;
    const due = p.kind === "clear" && p.t.due === S.day ? 100 : p.kind === "clear" ? 40 : 0, oct = /^Oct/.test(d.close) ? 20 : 0;
    opts.push([u, d.id, due + oct + d.stage * 10 + d.arr / 10 - (u === "sam" ? 5 : 0)]); }));
  opts.sort((a, b) => b[2] - a[2]); return opts[0] ? opts[0].slice(0, 2) : null;
}

const CX = 450, CY = 300, R = [255, 185, 115, 0];
// spread round all but the top, so the ring names there never sit under a deal
const ANG = Object.fromEntries(DEALS.map((d, i) => [d.id, (-50 + i * 40) * Math.PI / 180]));
const posOf = (d, i = 0) => { if (d.signed) { const a = ANG[d.id]; return [CX + 40 * Math.cos(a), CY + 40 * Math.sin(a)]; }
  const r = d.cold ? 292 : R[d.stage]; return [CX + r * Math.cos(ANG[d.id]), CY + r * Math.sin(ANG[d.id])]; };
const rOf = (d) => 11 + d.arr * 0.36;

export function GameMode({ onClose }) {
  const V = useDialKit("Game · the close", { "Moves per day": [3, 1, 5, 1], "Piece spring: stiffness": [170, 40, 600, 10], "Piece spring: damping": [20, 6, 60, 1], "Show North’s plan on open": false });
  const PER = V["Moves per day"], spring = { type: "spring", stiffness: V["Piece spring: stiffness"], damping: V["Piece spring: damping"] };
  const [S, setS] = useState(fresh), [unit, setUnit] = useState(null), [hover, setHover] = useState(null), [pick, setPick] = useState("summit"), [hint, setHint] = useState(V["Show North’s plan on open"]);
  const left = PER - S.n, B = banked(S);
  const prev = unit && hover ? (() => { const d = S.deals.find((x) => x.id === hover), p = playOf(unit, d, S.day); return p && left > 0 && !S.used[unit] ? { d, p, after: apply(S, unit, hover).deals.find((x) => x.id === hover) } : null; })() : null;
  const H = hint && !S.over ? hintOf(S) : null;
  const commit = (id) => { if (!unit || left <= 0 || S.used[unit]) { setPick(id); return; } const d = S.deals.find((x) => x.id === id); if (!playOf(unit, d, S.day)) { setPick(id); return; }
    setS((s) => apply(s, unit, id)); setPick(id); setUnit(null); setHover(null); };
  useEffect(() => { document.documentElement.classList.add("game-open"); return () => document.documentElement.classList.remove("game-open"); }, []);
  const sel = S.deals.find((d) => d.id === (hover || pick));

  return (
    <motion.div className="gm" role="dialog" aria-label="Game mode: close October" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      <header className="gm-hud">
        <div className="gm-title"><b>Close October</b><span className="gm-tag">Sample deals</span></div>
        <div className="gm-bank" aria-label={`$${B}K of $${GOAL}K signed`}>
          <p><motion.b key={B} initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>${B}K</motion.b> of ${GOAL}K signed</p>
          <span className="gm-bank-t"><motion.i animate={{ width: `${Math.min(100, (B / GOAL) * 100)}%` }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className={B >= GOAL ? "is-won" : ""} /></span>
        </div>
        <div className="gm-clock">
          {DAYS.map((d, i) => <span key={d} className={i < S.day ? "is-gone" : i === S.day ? "is-now" : ""}>{d.split(" ")[0]}</span>)}
        </div>
        <div className="gm-moves" aria-label={`${left} moves left today`}>{Array.from({ length: PER }, (_, i) => <i key={i} className={i < left ? "is-on" : ""} />)}<small>{left} {left === 1 ? "move" : "moves"} left</small></div>
        <div className="gm-acts">
          <button className="gm-btn" disabled={!S.hist.length} onClick={() => setS((s) => s.hist[s.hist.length - 1] || s)}>Undo</button>
          <button className="gm-btn is-main" onClick={() => { setS((s) => endDay(s)); setUnit(null); }}>{S.day === 3 ? "End October" : "End day"}</button>
          <button className="gm-x" aria-label="Leave game mode" onClick={onClose}><svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></button>
        </div>
      </header>

      <div className="gm-body">
        <div className="gm-stage">
          <div className="gm-north">
            <span className="gm-nm"><NorthLogo size={16} light /></span>
            <AnimatePresence mode="wait"><motion.p key={S.day + ":" + S.fired.length + ":" + (S.n === 0)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>{readOf(S)}</motion.p></AnimatePresence>
            <button className="gm-btn is-ghost" onClick={() => setHint((h) => !h)}>{hint ? "Hide my plan" : "What would you do?"}</button>
          </div>
          <svg className="gm-map" viewBox="0 0 900 600" role="img" aria-label="Deals on the target: outer ring proposal, then pricing, then contract out; the centre is signed">
            <defs><radialGradient id="gm-core"><stop offset="0" stopColor="#7fd0a3" stopOpacity=".35" /><stop offset="1" stopColor="#7fd0a3" stopOpacity="0" /></radialGradient></defs>
            <circle cx={CX} cy={CY} r={70} fill="url(#gm-core)" />
            {R.slice(0, 3).map((r, i) => <g key={r}><circle cx={CX} cy={CY} r={r} className="gm-ring" />
              <text x={CX} y={CY - r - 8} className="gm-ring-t" textAnchor="middle">{STAGES[i]}</text></g>)}
            <circle cx={CX} cy={CY} r={62} className="gm-core" />
            {!B && <text x={CX} y={CY + 4} textAnchor="middle" className="gm-core-t">Signed</text>}
            {/* the preview: where the move puts the deal, before you commit */}
            {prev && prev.p.kind === "adv" && (() => { const [x0, y0] = posOf(prev.d), [x1, y1] = posOf(prev.after); return <g className="gm-ghost">
              <line x1={x0} y1={y0} x2={x1} y2={y1} /><circle cx={x1} cy={y1} r={rOf(prev.d) * (prev.after.signed ? 0.55 : 1)} style={{ stroke: HUE[unit] }} /></g>; })()}
            {H && (() => { const d = S.deals.find((x) => x.id === H[1]), [x, y] = posOf(d); return <circle cx={x} cy={y} r={rOf(d) + 9} className="gm-hint" style={{ stroke: HUE[H[0]] }} />; })()}
            {S.deals.map((d) => { const [x, y] = posOf(d), r = rOf(d) * (d.signed ? 0.7 : 1), can = unit ? !!playOf(unit, d, S.day) && !S.used[unit] && left > 0 : true;
              const th = live(d, S.day)[0], fired = S.fired.find((f) => f.id === d.id), lr = x < CX - 20 ? "end" : x > CX + 20 ? "start" : "middle", lx = lr === "end" ? -r - 8 : lr === "start" ? r + 8 : 0, ly = lr === "middle" ? (y < CY ? -r - 10 : r + 18) : 4;
              return (
                <motion.g key={d.id} className={`gm-deal${d.signed ? " is-signed" : ""}${d.cold ? " is-cold" : ""}${pick === d.id ? " is-pick" : ""}${!can ? " is-dim" : ""}`}
                  initial={false} animate={{ x, y }} transition={spring}
                  onPointerEnter={() => setHover(d.id)} onPointerLeave={() => setHover(null)} onClick={() => commit(d.id)} tabIndex={0} role="button"
                  aria-label={`${d.n}, $${d.arr}K, ${d.signed ? "signed" : d.cold ? "out of October" : STAGES[d.stage]}`} onKeyDown={(e) => e.key === "Enter" && commit(d.id)}>
                  {fired && <motion.circle r={r + 4} className="gm-fire" initial={{ r: r, opacity: 0.9 }} animate={{ r: r + 26, opacity: 0 }} transition={{ duration: 1.2, repeat: 1 }} />}
                  <circle r={r} className="gm-tok" />
                  <text className="gm-tok-v" textAnchor="middle" y={d.signed ? 3.5 : 4} style={d.signed ? { fontSize: 9 } : undefined}>${d.arr}K</text>
                  {!d.signed && <text className="gm-tok-n" textAnchor={lr} x={lx} y={ly}>{short(d.n)}{d.cold ? " · November" : ""}</text>}
                  {th && !d.signed && !d.cold && <g className={`gm-th is-${THREATS[th.k].fx}`} transform={`translate(${r * 0.72} ${-r * 0.72})`}>
                    <circle r={8} /><text textAnchor="middle" y={3.5}>{THREATS[th.k].fx === "block" ? "■" : th.due === S.day ? "!" : DAYS[th.due][0]}</text></g>}
                </motion.g>); })}
          </svg>
          <div className="gm-units" role="toolbar" aria-label="Who acts">
            {UIDS.map((u) => { const U = UNITS[u], used = !!S.used[u], on = unit === u;
              return (
                <button key={u} className={`gm-u${on ? " is-on" : ""}${used ? " is-used" : ""}${H && H[0] === u ? " is-hint" : ""}`} disabled={used || left <= 0} onClick={() => setUnit(on ? null : u)} aria-pressed={on} style={{ "--c": HUE[u] }}>
                  <span className="gm-u-fig">{u === "sam" ? <span className="gm-sam">S</span> : <Puppet id={u} h={58} work={on} seed={u.length} color={HUE[u]} />}</span>
                  <span className="gm-u-t"><b>{U.n}</b><small>{used ? "Done today" : U.role}</small></span>
                </button>); })}
          </div>
        </div>

        <aside className="gm-side">
          {prev ? (
            <div className="gm-card">
              <small className="gm-k">If {UNITS[unit].n === "You" ? "you" : UNITS[unit].n} {prev.p.kind === "clear" ? "takes this" : "moves it"}</small>
              <b className="gm-card-t">{prev.p.label}</b>
              <p>{prev.p.kind === "clear" ? `${prev.d.n}: ${THREATS[prev.p.t.k].t.toLowerCase()} is handled. It won’t fire.` : prev.after.signed ? `${prev.d.n} signs. $${prev.d.arr}K lands in October.` : `${prev.d.n} moves to ${STAGES[prev.after.stage].toLowerCase()}.`}</p>
              <small className="gm-k">Click the deal to commit</small>
            </div>
          ) : unit ? (
            <div className="gm-card"><small className="gm-k">{UNITS[unit].n === "You" ? "You" : UNITS[unit].n}</small>
              <p>{unit === "sam" ? "You can handle any problem or move any deal forward. Use it where nobody else can." : `${UNITS[unit].n} can ${[...UNITS[unit].clear.map((k) => CLEAR[k].toLowerCase()), UNITS[unit].play && `${UNITS[unit].play.toLowerCase()} (${UNITS[unit].adv.map((s) => STAGES[s].toLowerCase()).join(" or ")})`].filter(Boolean).join(", or ")}.`}</p>
              <small className="gm-k">Hover a lit deal to see the move</small></div>
          ) : null}
          {sel && <Account d={sel} day={S.day} />}
        </aside>
      </div>

      <AnimatePresence>{S.over && <Result S={S} onAgain={() => { setS(fresh()); setUnit(null); }} onClose={onClose} />}</AnimatePresence>
    </motion.div>
  );
}

function Account({ d, day }) {
  const th = d.threats.filter((t) => t.from <= day);
  return (
    <div className="gm-card is-acct">
      <small className="gm-k">Account</small>
      <b className="gm-card-t">{d.n}</b>
      <dl>
        <dt>ARR</dt><dd>${d.arr}.0K</dd>
        <dt>Where</dt><dd>{d.signed ? "Signed" : d.cold ? "Out of October" : STAGES[d.stage]}</dd>
        <dt>Closes</dt><dd>{d.close}</dd>
        <dt>Brokerage</dt><dd>{d.city} · {d.agents} agents</dd>
        <dt>Champion</dt><dd>{d.champ[0]}<br /><span>{d.champ[1]}</span></dd>
        <dt>Source</dt><dd>{d.src}</dd>
        <dt>Last touch</dt><dd>{d.touch}</dd>
      </dl>
      {th.map((t) => <p key={t.k} className={`gm-risk${t.ok ? " is-ok" : ""}`}><b>{THREATS[t.k].t}</b> {t.ok ? "Handled." : THREATS[t.k].say}{!t.ok && t.due != null && <em> {t.due === day ? "Fires tonight." : `Fires ${DAYS[t.due].split(" ")[0]} night.`}</em>}</p>)}
    </div>
  );
}

function Result({ S, onAgain, onClose }) {
  const B = banked(S), won = B >= GOAL, lost = S.deals.filter((d) => !d.signed && /^Oct/.test(d.close));
  return (
    <motion.div className="gm-end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="gm-end-c" initial={{ y: 12, scale: 0.98 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 24 }}>
        <small className="gm-k">October closed</small>
        <p className="gm-end-n">${B}K <span>of ${GOAL}K</span></p>
        <p>{won ? `You made up the gap with $${B - GOAL}K to spare.` : `$${GOAL - B}K short of pace.`} {lost.length ? `${lost.map((d) => short(d.n)).join(", ")} ${lost.length === 1 ? "didn’t" : "didn’t"} land.` : "Every October deal signed."}</p>
        <ul>{S.deals.map((d) => <li key={d.id} className={d.signed ? "is-ok" : ""}><span>{d.n}</span><b>{d.signed ? `$${d.arr}K signed` : d.cold ? "Went cold" : STAGES[d.stage]}</b></li>)}</ul>
        <div className="gm-end-b"><button className="gm-btn is-main" onClick={onAgain}>Play it again</button><button className="gm-btn" onClick={onClose}>Back to your month</button></div>
      </motion.div>
    </motion.div>
  );
}
