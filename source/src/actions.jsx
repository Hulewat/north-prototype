// The page actions, wired once and shared: Monday sync, pins, and handing a question to North.
// State lives in App; every button reads and writes it through this context, so a metric added on
// the heatmap shows as added on its metric page, its department page and in the sidebar count.
import React, { createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import { C, toMotion } from "./lib.js";
import { readTarget } from "./chat.jsx";
import { NorthLogo } from "./marks.jsx";
import { getWho } from "./seat.js";

// Home's four tiles are on Home for everyone; the same metric on Company health maps to them, so it can't be pinned twice.
export const STAPLES = { "ch-total": "Total ARR", "ch-nrr": "NRR", "ch-felix": "Felix ARR", "ch-net": "Net new ARR", arr: "Total ARR" };
// the same metric reached from two places (a scoreboard tile and its heatmap square) is one pin
const ALIAS = { "4-0": "ch-grr" };
export const canon = (id) => ALIAS[id] || id;
// a seat's own tiles are its staples (Sam's New Business four); leadership's four are just charts to him, so he can pin them
const SEAT_STAPLES = { sam: { "2-0": "New ARR", "2-3": "New logos", "2-2": "Win rate from held demo", "2-1": "Demos held" } };
export const isStaple = (id) => !!(SEAT_STAPLES[getWho()] || STAPLES)[canon(id)];
// leadership's Home tiles have their own ids; the same metric reached from Company health (or by name) is that tile
const LEAD_TILE = { "ch-total": "total", arr: "total", "ch-nrr": "nrr", "ch-felix": "felix", "ch-net": "netnew" };
export const tileOf = (id) => { const k = canon(id); return SEAT_STAPLES[getWho()] ? k : LEAD_TILE[k] || k; };
export const ActionsCtx = createContext({ sync: new Set(), pins: new Set(), toggleSync() {}, syncAll() {}, togglePin() {}, ask() {}, M: null, homeIds: [], onHome: () => false, toggleHome() {}, moveHome() {} });
export const useActions = () => useContext(ActionsCtx);

const swap = { initial: { opacity: 0, y: 6, filter: "blur(2px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: { opacity: 0, y: -6, filter: "blur(2px)" } };
const Check = ({ c = C.navy }) => <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 6.3 5 8.6l4.5-5.1" fill="none" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;

// label swaps in place, the way the home chips swap text on hover
function Swap({ on, off, onLabel, M }) {
  return (
    <span className="act-swap">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={on ? "on" : "off"} className="act-t" {...swap} transition={toMotion(M.hover.spring)}>
          {on ? <><Check />{onLabel}</> : off}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function SyncButton({ id, className = "btn-sec", label = "Add to Monday sync", onLabel = "On Monday sync" }) {
  const { sync, toggleSync, M } = useActions();
  const on = sync.has(id);
  return (
    <motion.button className={`${className} act${on ? " is-on" : ""}`} aria-pressed={on} whileTap={{ scale: 0.97 }} transition={toMotion(M.hover.press)}
      onClick={(e) => { e.stopPropagation(); toggleSync(id); }}>
      <Swap on={on} off={label} onLabel={onLabel} M={M} />
    </motion.button>
  );
}

export function SyncAllButton({ ids, className = "btn-out" }) {
  const { sync, syncAll, M } = useActions();
  const all = ids.every((k) => sync.has(k));
  return (
    <motion.button className={`${className} act${all ? " is-on" : ""}`} aria-pressed={all} whileTap={{ scale: 0.97 }} transition={toMotion(M.hover.press)}
      onClick={() => syncAll(ids, !all)}>
      <Swap on={all} off="Add all to Monday sync" onLabel={`All ${ids.length} on Monday sync`} M={M} />
    </motion.button>
  );
}

const STAR = "M8 2.2 9.8 5.9l4 .6-2.9 2.8.7 4L8 11.4l-3.6 1.9.7-4-2.9-2.8 4-.6Z";
export function PinIcon({ id, className = "ibtn" }) {
  const { onHome, toggleHome } = useActions();
  const on = onHome(id);
  return (
    <button className={className} aria-label={on ? "Take off your Home" : "Add to your Home"} title={on ? "On your Home · click to take it off" : "Add to your Home"}
      aria-pressed={on} onClick={(e) => { e.stopPropagation(); toggleHome(id); }}>
      <motion.svg width="16" height="16" viewBox="0 0 16 16" initial={false} animate={{ scale: on ? [1, 1.28, 1] : 1 }} transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}>
        <path d={STAR} fill={on ? C.navy : "none"} stroke={C.navy} strokeWidth="1.1" strokeLinejoin="round" style={{ transition: "fill .2s" }} />
      </motion.svg>
    </button>
  );
}

export function PinButton({ id, className = "btn-sec", label = "Pin to Home", onLabel = "On your Home" }) {
  const { onHome, toggleHome, M } = useActions();
  const on = onHome(id);
  return (
    <motion.button className={`${className} act${on ? " is-on" : ""}`} aria-pressed={on} whileTap={{ scale: 0.97 }} transition={toMotion(M.hover.press)}
      onClick={(e) => { e.stopPropagation(); toggleHome(id); }}>
      <Swap on={on} off={label} onLabel={onLabel} M={M} />
    </motion.button>
  );
}

export function AskButton({ q, className = "btn-pri", label = "Ask North why" }) {
  const { ask, M } = useActions();
  return (
    <motion.button className={className} whileTap={{ scale: 0.97 }} transition={toMotion(M.hover.press)} onClick={(e) => { e.stopPropagation(); ask(q); }}>{label}</motion.button>
  );
}

// the chart's own "ask" button: hands North this whole chart as context (one bar: click the bar)
export function AskChartIcon({ className = "ibtn ask-ic" }) {
  return (
    <button className={className} aria-label="Ask North about this chart" title="Ask North about this chart"
      onClick={(e) => { e.stopPropagation(); const t = readTarget(e.currentTarget, true); if (t) window.dispatchEvent(new CustomEvent("north:attach", { detail: { k: "chart", t: `${t.title}${t.big ? ` · ${t.big}` : ""}`, title: t.title, big: t.big, id: t.id, lane: t.lane, el: t.card } })); }}>
      <NorthLogo ask size={20} />
    </button>
  );
}
