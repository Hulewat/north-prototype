// Team, as a house: the building sliced open from the side. Fia, Orin and Felix have their rooms upstairs; North's room and
// your office are on the ground floor, the stairs run down the right. What each agent is doing is drawn from its real
// jobs: on the phone = talking to another agent or pulling data, a sandwich = waiting on something, papers flying = deep in
// a job, coffee = just finished. Only when something needs you does an agent come downstairs and wait at your door.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react";
import { DialRoot, useDialKit } from "dialkit";
import { Orb } from "./agents.jsx";
import { SEATS, ASKED } from "./team-data.js";

const DIALS = {
  walk: ["Walking speed (px/s)", [260, 80, 700, 10]],
  beat: ["Seconds per activity", [6, 2, 15, 0.5]],
  first: ["First knock after (s)", [4.5, 0.5, 15, 0.5]],
  stagger: ["Next one comes down after (s)", [2.4, 0.5, 8, 0.1]],
  orb: ["Orb size", [52, 30, 80, 1]],
  typeMs: ["Speech: ms per character", [22, 5, 60, 1]],
  pop: ["Note grows out of the orb", { type: "spring", visualDuration: 0.42, bounce: 0.16 }],
};
const CONFIG = Object.fromEntries(Object.values(DIALS).map(([l, v]) => [l, v]));
const fromDials = (v) => Object.fromEntries(Object.entries(DIALS).map(([k, [l]]) => [k, v[l]]));
const AG = { fia: { n: "Fia", role: "Growth" }, orin: { n: "Orin", role: "Finance" }, felix: { n: "Felix", role: "Customers" } };
const IDS = ["fia", "orin", "felix"];
const HUE = { fia: "#ec8a6c", orin: "#8b7ff0", felix: "#df7fcf" };

// ---------------------------------------------------------------- the building, in world units (1200 × 820)
const W = 1200, H = 820;
const DESK = { fia: 255, orin: 535, felix: 800 };
const SIT = 318, STAND2 = 404, STAND1 = 714;
const A0 = { x: 968, y: STAND2 }, A1 = { x: 1052, y: 559 }, B0 = { x: 980, y: STAND1 };
const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const spot = (k) => lerp(B0, A1, [0, 0.37, 0.72][k] ?? 0.72);
const down = (id, k) => [{ x: DESK[id], y: SIT }, { x: DESK[id], y: STAND2 }, A0, A1, spot(k)];

// ---------------------------------------------------------------- what each one is doing, from the real jobs
const ACTS = {
  beyonce: {
    fia: [{ k: "type", l: "Webinar leads no-show twice as often. Digging into when they booked." }, { k: "read", l: "Reading 30 days of Outbound demo notes." }, { k: "type", l: "Writing the Monday sync doc. Won’t take long." }],
    orin: [{ k: "phone", w: "felix", l: "Felix, which at-risk accounts renew soonest?" }, { k: "type", l: "Running each lever on its own for the year’s forecast." }, { k: "coffee", l: "Two done this morning. Coffee, then the forecast." }],
    felix: [{ k: "phone", w: "orin", l: "Brightline. Renews Nov 14 and just cut seats." }, { k: "sandwich", l: "Waiting on a data connection. Lunch it is." }, { k: "read", l: "Checking which screens lost time after the Oct 20 release." }],
  },
  sam: {
    fia: [{ k: "type", l: "Your 11 follow-ups are drafted, one per lost demo." }, { k: "read", l: "Lost deals cluster after the first call. Reading the notes for why." }],
    orin: [{ k: "type", l: "On the year’s forecast. Nothing of yours yet." }, { k: "coffee", l: "Coffee. Then I’d like a word about New ARR." }],
    felix: [{ k: "type", l: "On renewals and new accounts this week." }, { k: "sandwich", l: "Waiting on a data connection. Lunch it is." }],
  },
};
// your whiteboard: the work you care about, in marker
const BOARD = {
  beyonce: { h: "Your people", rows: [["sam", "Sam · 3 calls waiting on him"], ["caleb", "Caleb · Outbound at 23% of pace", "red"], ["heather", "Heather · Expansion at 72% of goal"], ["jordan", "Jordan · 4 renewals gone quiet"]] },
  sam: { h: "My outreach", rows: [["follow", "Follow-ups · 11 drafted"], ["list", "Demo list · 14 open"], ["late", "Late-stage deals · nothing on it", "red"], ["won", "Won: Brightwater, Northgate", "green"]] },
};
const BOARD_AFTER = {
  "orin-out": ["caleb", "Caleb · Sam moving back ✓"], "felix-smb": ["jordan", "Jordan · invites sent ✓"], "fia-prop": ["sam", "Sam · Fia’s ranking his list"],
  "sam-follow": ["follow", "Follow-ups · 11 sent ✓"], "sam-arr": ["late", "Late-stage deals · Orin’s ranking"], "sam-list": ["list", "Demo list · being ranked"],
};
const SKY = (h) => (h >= 6 && h < 11 ? ["#d6e6f3", "#fbeee0"] : h >= 11 && h < 17 ? ["#c4d9ec", "#f4e7d8"] : h >= 17 && h < 20 ? ["#e5b29d", "#f7d9b9"] : ["#1d2843", "#3a4566"]);

function Typed({ text, ms }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); const t0 = performance.now(); let raf = 0;
    const tick = (t) => { const k = Math.min(text.length, Math.floor((t - t0) / Math.max(1, ms))); setN(k); if (k < text.length) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, [text]);
  return <>{text.slice(0, n)}<span className="ghost">{text.slice(n)}</span></>;
}

// ---------------------------------------------------------------- the drawing
const Notes = () => [[166, 182, "#ffe27a", -6], [196, 190, "#ffb4a2", 4], [228, 180, "#bfe3c0", -3], [172, 214, "#a9d1f5", 5], [206, 222, "#ffe27a", -8], [240, 212, "#ffb4a2", 7], [186, 246, "#ffe27a", 3]]
  .map(([x, y, c, r], i) => <rect key={i} x={x} y={y} width="24" height="24" rx="1.5" fill={c} transform={`rotate(${r} ${x + 12} ${y + 12})`} />);
const Win = ({ x, y, w, h, sky }) => (<g><rect x={x - 5} y={y - 5} width={w + 10} height={h + 10} rx="3" fill="#fbf8f4" /><rect x={x} y={y} width={w} height={h} fill="url(#sky)" />
  <line x1={x + w / 2} y1={y} x2={x + w / 2} y2={y + h} stroke="#fbf8f4" strokeWidth="4" /><line x1={x} y1={y + h / 2} x2={x + w} y2={y + h / 2} stroke="#fbf8f4" strokeWidth="4" /></g>);
const Plant = ({ x, y, s = 1 }) => (<g transform={`translate(${x} ${y}) scale(${s})`}>
  <path d="M0 0 C-14 -10 -20 -30 -10 -44 C-6 -30 -2 -18 0 0 Z" fill="#5f9a6e" /><path d="M0 0 C12 -12 22 -26 14 -46 C8 -32 4 -16 0 0 Z" fill="#6fae7c" /><path d="M0 0 C-2 -18 2 -40 0 -56 C6 -40 6 -18 0 0 Z" fill="#4f8a5f" />
  <path d="M-12 0 H12 L9 22 H-9 Z" fill="#c9775a" /></g>);
const Hanging = ({ x }) => (<g><line x1={x} y1="140" x2={x} y2="176" stroke="#9c8675" strokeWidth="1.5" /><path d={`M${x - 12} 176 H${x + 12} L${x + 9} 194 H${x - 9} Z`} fill="#e9e1d6" />
  {[-14, -6, 4, 12].map((d, i) => <path key={i} d={`M${x + d * 0.4} 190 C${x + d} 204 ${x + d * 1.3} 220 ${x + d * 1.1} ${232 + (i % 2) * 14}`} stroke="#5f9a6e" strokeWidth="3" fill="none" strokeLinecap="round" />)}</g>);
const Chair = ({ x, y, c = "#6e5a4e" }) => <rect x={x - 17} y={y} width="34" height="58" rx="8" fill={c} />;

function Back({ who, sky, knock }) {
  const night = sky[0] === "#1d2843";
  return (
    <svg className="layer" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={sky[0]} /><stop offset="1" stopColor={sky[1]} /></linearGradient>
        <radialGradient id="glow"><stop offset="0" stopColor="#fff6d8" stopOpacity=".95" /><stop offset="1" stopColor="#fff6d8" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="url(#sky)" />
      <g className="clouds" fill="#fff" opacity={night ? 0.12 : 0.7}><ellipse cx="80" cy="120" rx="46" ry="14" /><ellipse cx="110" cy="110" rx="30" ry="14" /><ellipse cx="1150" cy="220" rx="40" ry="12" /></g>
      <circle cx="1150" cy="70" r="22" fill={night ? "#f3ecd6" : "#ffd98a"} opacity=".9" />
      {/* ground */}
      <rect x="0" y="760" width={W} height="60" fill="#cdbca8" /><rect x="0" y="760" width={W} height="6" fill="#bba890" />
      <g transform="translate(58 760)"><rect x="-4" y="-70" width="8" height="70" fill="#8a6c55" /><circle cx="0" cy="-92" r="38" fill="#7fae86" /><circle cx="-22" cy="-74" r="24" fill="#6f9f78" /><circle cx="22" cy="-70" r="26" fill="#8cbb92" /></g>
      <g transform="translate(1146 760)"><circle cx="0" cy="-14" r="20" fill="#7fae86" /><circle cx="18" cy="-10" r="14" fill="#6f9f78" /></g>
      {/* shell + roof sign */}
      <rect x="120" y="128" width="980" height="632" fill="#e6dacc" />
      <rect x="108" y="116" width="1004" height="16" rx="2" fill="#d6c6b4" />
      <g transform="translate(600 72)"><rect x="-2" y="20" width="3" height="26" fill="#9c8675" /><rect x="-58" y="-6" width="116" height="30" rx="4" fill="#093555" />
        <path d="M-40 9 L-37 1 L-34 9 L-37 17 Z" fill="#fff" /><text x="-26" y="14" fill="#fefbf9" fontSize="13" fontWeight="600" letterSpacing="2.5">NORTH</text></g>
      <line x1="1010" y1="116" x2="1010" y2="78" stroke="#9c8675" strokeWidth="2" /><circle cx="1010" cy="76" r="3" fill="#ff725c" />

      {/* upstairs: Fia — restless; notes everywhere */}
      <rect x="140" y="140" width="260" height="290" fill="#f6d5c5" />
      <rect x="156" y="170" width="114" height="98" rx="3" fill="#d6a57a" /><Notes />
      <Win x={300} y={176} w={80} h={78} />
      <g fill="#fbf8f4"><rect x="352" y="378" width="30" height="40" rx="3" fill="#a9b6c2" /><circle cx="360" cy="374" r="7" /><circle cx="372" cy="370" r="6" /><circle cx="300" cy="420" r="5" /></g>
      {/* Orin — exact; everything squared */}
      <rect x="410" y="140" width="260" height="290" fill="#dad7ec" />
      <rect x="428" y="166" width="104" height="132" fill="#c4bedf" />
      {[0, 1, 2].map((r) => <g key={r}><rect x="428" y={208 + r * 44} width="104" height="4" fill="#a9a1cf" />
        {Array.from({ length: 8 }, (_, i) => <rect key={i} x={433 + i * 12} y={172 + r * 44} width="9" height="36" fill={["#6d4fc2", "#8b7ff0", "#5d6a8a", "#9aa4c2"][(i + r) % 4]} />)}</g>)}
      <rect x="560" y="176" width="92" height="62" rx="2" fill="#fbf8f4" /><polyline points="570,226 586,214 600,218 614,200 628,204 642,188" fill="none" stroke="#6d4fc2" strokeWidth="2" />
      <circle cx="606" cy="276" r="18" fill="#fbf8f4" /><line x1="606" y1="276" x2="606" y2="264" stroke="#093555" strokeWidth="2" /><line x1="606" y1="276" x2="615" y2="276" stroke="#093555" strokeWidth="2" />
      {/* Felix — warm; plants and pictures */}
      <rect x="680" y="140" width="260" height="290" fill="#f2d4e4" />
      <Win x={836} y={176} w={80} h={78} />
      <rect x="700" y="186" width="44" height="54" rx="2" fill="#fbf8f4" /><rect x="706" y="192" width="32" height="34" fill="#f0b9d7" /><rect x="752" y="198" width="38" height="30" rx="2" fill="#fbf8f4" /><circle cx="771" cy="213" r="9" fill="#f6c58e" />
      <Hanging x={718} /><Hanging x={928} />
      <ellipse cx="800" cy="428" rx="104" ry="6" fill="#e3a9c6" />
      <line x1="912" y1="300" x2="912" y2="430" stroke="#9c8675" strokeWidth="3" /><path d="M896 300 H928 L922 282 H902 Z" fill="#f6dfb0" />
      <Plant x={922} y={408} s={0.8} />
      {/* inner walls with doorways */}
      <rect x="400" y="140" width="10" height="186" fill="#d6c6b4" /><rect x="670" y="140" width="10" height="186" fill="#d6c6b4" /><rect x="940" y="140" width="10" height="186" fill="#d6c6b4" />
      {/* floors */}
      {[140, 410, 680].map((x) => <rect key={x} x={x} y="418" width={x === 680 ? 270 : 270} height="12" fill="#c9a587" />)}
      <rect x="140" y="430" width="810" height="20" fill="#cdbba8" />
      {/* chairs (empty when they're out) */}
      {IDS.map((id) => <Chair key={id} x={DESK[id]} y={300} c={{ fia: "#c46f57", orin: "#5d5a86", felix: "#b46a96" }[id]} />)}

      {/* ground floor: North's room */}
      <rect x="140" y="450" width="330" height="290" fill="#dbe4ee" />
      <Win x={162} y={482} w={70} h={92} />
      <circle cx="330" cy="540" r="58" fill="url(#glow)" className="north-glow" />
      <path d="M330 512 L340 540 L330 568 L320 540 Z" fill="#093555" />
      <rect x="470" y="450" width="10" height="290" fill="#d6c6b4" />
      {/* your office */}
      <rect x="480" y="450" width="460" height="290" fill="#efe8de" />
      <rect x="500" y="478" width="248" height="160" rx="4" fill="#c9c4bc" /><rect x="506" y="484" width="236" height="148" rx="2" fill="#fdfcfa" /><rect x="560" y="638" width="120" height="5" rx="2" fill="#b9b2a8" />
      <Win x={786} y={484} w={110} h={92} />
      <Chair x={836} y={630} c="#093555" />
      <Plant x={918} y={718} s={0.9} />
      <rect x="140" y="728" width="810" height="12" fill="#c9a587" />
      {/* stairwell */}
      <rect x="950" y="140" width="130" height="600" fill="#e2d7c9" />
      <path d={`M950 430 ${Array.from({ length: 8 }, (_, i) => `H${950 + (i + 1) * 16.25} V${430 + (i + 1) * 19.4}`).join(" ")} H1080 V600 H1060 Z`} fill="#c2ae9b" />
      <rect x="1052" y="585" width="28" height="10" fill="#b4a08c" />
      <path d={`M1080 595 ${Array.from({ length: 8 }, (_, i) => `H${1080 - (i + 1) * 16.25} V${595 + (i + 1) * 18.1}`).join(" ")} H950 V740 Z`} fill="#c2ae9b" />
      <rect x="950" y="740" width="130" height="20" fill="#cdbba8" />
      {/* the wall to your office, and your door */}
      <rect x="940" y="450" width="10" height="290" fill="#d6c6b4" />
      <g className={knock ? "door is-knock" : "door"} key={knock}><rect x="937" y="636" width="16" height="104" rx="2" fill="#9b7556" /><circle cx="951" cy="690" r="2.6" fill="#e8c77a" /></g>
      <rect x="958" y="612" width="74" height="16" rx="2" fill="#fbf8f4" /><text x="995" y="623.5" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="#093555">{SEATS[who].n.toUpperCase()}</text>
      {night && <g fill="#fff3c4" opacity=".14">{[[140, 140, 800, 290], [140, 450, 800, 290]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}</g>}
    </svg>
  );
}
// what sits in front of the agents: desks, the table, the stair rail
function Front() {
  return (
    <svg className="layer front" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      {IDS.map((id) => { const x = DESK[id]; return (<g key={id}>
        <rect x={x - 64} y="354" width="128" height="9" rx="2" fill="#a07b5f" /><rect x={x - 58} y="363" width="116" height="55" fill="#b8916f" /><rect x={x - 52} y="372" width="104" height="2" fill="#a07b5f" />
        <path d={`M${x + 22} 354 L${x + 26} 332 H${x + 54} L${x + 50} 354 Z`} fill="#c9ced6" /><circle cx={x + 38} cy="343" r="2.5" fill="#fefbf9" />
      </g>); })}
      <rect x="764" y="664" width="150" height="9" rx="2" fill="#7f6450" /><rect x="770" y="673" width="138" height="55" fill="#937359" />
      <path d="M806 664 L810 640 H838 L834 664 Z" fill="#c9ced6" /><line x1="880" y1="664" x2="890" y2="630" stroke="#093555" strokeWidth="2" /><path d="M882 628 H902 L896 618 H888 Z" fill="#ffd98a" />
      <ellipse cx="320" cy="676" rx="92" ry="12" fill="#b8916f" /><rect x="314" y="684" width="12" height="44" fill="#a07b5f" /><rect x="290" y="724" width="60" height="5" rx="2" fill="#a07b5f" />
      <polyline points="954,404 1056,555 1080,555" fill="none" stroke="#8d7866" strokeWidth="2.5" /><polyline points="1080,566 1058,566 956,712" fill="none" stroke="#8d7866" strokeWidth="2.5" />
    </svg>
  );
}

// ---------------------------------------------------------------- props: what an agent has in hand
function Prop({ act, D }) {
  const r = D.orb / 2;
  if (act.k === "phone") return (<span className="prop" style={{ left: r + 2, top: -r * 0.2 }}>
    <svg width="34" height="34" viewBox="0 0 34 34"><rect x="2" y="6" width="11" height="20" rx="2.5" fill="#093555" /><rect x="4" y="9" width="7" height="12" rx="1" fill="#7fa6c9" />
      <motion.path d="M17 10 Q22 16 17 22" stroke="#093555" strokeWidth="1.6" fill="none" strokeLinecap="round" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.1, repeat: Infinity }} />
      <motion.path d="M21 6 Q29 16 21 26" stroke="#093555" strokeWidth="1.6" fill="none" strokeLinecap="round" animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.1, repeat: Infinity, delay: 0.25 }} /></svg></span>);
  if (act.k === "sandwich") return <Sandwich r={r} />;
  if (act.k === "coffee") return (<span className="prop" style={{ left: r - 4, top: r * 0.15 }}>
    <svg width="30" height="40" viewBox="0 0 30 40">{[6, 13].map((x, i) => <motion.path key={x} d={`M${x} 16 C${x - 4} 10 ${x + 4} 6 ${x} 0`} stroke="#9c8675" strokeWidth="1.5" fill="none" strokeLinecap="round" animate={{ opacity: [0, 0.8, 0], y: [2, -3, -6] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }} />)}
      <rect x="2" y="18" width="16" height="18" rx="3" fill="#fefbf9" /><path d="M18 22 C26 22 26 32 18 32" stroke="#fefbf9" strokeWidth="3" fill="none" /></svg></span>);
  if (act.k === "read") return (<motion.span className="prop" style={{ left: -12, top: r * 0.05 }} animate={{ rotate: [-4, 2, -4] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
    <svg width="26" height="32" viewBox="0 0 26 32"><rect x="1" y="1" width="24" height="30" rx="2" fill="#fefbf9" />{[7, 12, 17, 22].map((y) => <rect key={y} x="5" y={y} width={y === 22 ? 10 : 16} height="2" rx="1" fill="#b9c2cc" />)}</svg></motion.span>);
  if (act.k === "type") return (<>{[0, 1, 2].map((i) => (
    <motion.span key={i} className="paper" style={{ left: -10 + i * 10, top: r * 0.4 }} animate={{ y: [0, -46 - i * 8], x: [0, (i - 1) * 26], rotate: [0, (i - 1) * 40 + 20], opacity: [0, 1, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }} />))}</>);
  return null;
}
function Sandwich({ r }) {
  const [bite, setBite] = useState(0);
  useEffect(() => { const t = setInterval(() => setBite((b) => (b + 1) % 4), 1300); return () => clearInterval(t); }, []);
  return (<span className="prop" style={{ left: r - 6, top: r * 0.05 }}>
    <svg width="34" height="28" viewBox="0 0 34 28"><defs><mask id="bite"><rect width="34" height="28" fill="#fff" />{bite > 0 && <circle cx="31" cy="6" r="6" fill="#000" />}{bite > 1 && <circle cx="27" cy="2" r="5" fill="#000" />}{bite > 2 && <circle cx="32" cy="14" r="5" fill="#000" />}</mask></defs>
      <g mask="url(#bite)"><path d="M2 22 L32 22 L32 4 Z" fill="#e9c58f" /><path d="M2 19 L32 19 L32 7 Z" fill="#7cb46b" /><path d="M2 16 L32 16 L32 9 Z" fill="#e2664f" /><path d="M2 14 L32 14 L32 4 Z" fill="#f3d9a8" /></g></svg>
    <AnimatePresence>{bite > 0 && <motion.i key={bite} className="crumb" initial={{ y: 0, opacity: 1 }} animate={{ y: 26, opacity: 0 }} transition={{ duration: 0.9 }} />}</AnimatePresence></span>);
}

// ---------------------------------------------------------------- an agent: sits at its desk, or walks down to your door
function Agent({ id, D, where, act, say, onArrive, onClick, onRoom }) {
  const x = useMotionValue(DESK[id]), y = useMotionValue(SIT), [walking, setWalking] = useState(false), last = useRef({ kind: "desk" }), run = useRef(0);
  useEffect(() => {
    const from = last.current, to = where; if (from.kind === to.kind && from.k === to.k) return;
    let route;
    if (from.kind === "desk" && to.kind === "q") route = down(id, to.k);
    else if (from.kind === "q" && to.kind === "q") route = [spot(from.k), spot(to.k)];
    else if (from.kind === "q" && to.kind === "desk") route = [spot(from.k), A1, A0, { x: DESK[id], y: STAND2 }, { x: DESK[id], y: SIT }];
    last.current = to; const my = ++run.current;
    (async () => {
      setWalking(true);
      for (let i = 1; i < route.length; i++) { if (my !== run.current) return; const a = route[i - 1], b = route[i], d = Math.hypot(b.x - a.x, b.y - a.y), t = Math.max(0.12, d / D.walk);
        await Promise.all([animate(x, [a.x, b.x], { duration: t, ease: "linear" }), animate(y, [a.y, b.y], { duration: t, ease: "linear" })]); }
      if (my !== run.current) return; setWalking(false); if (to.kind === "q") onArrive(id, to.k);
    })();
  }, [where.kind, where.k]);
  const atDesk = where.kind === "desk" && !walking;
  return (
    <motion.div className={`agent${walking ? " is-walk" : ""}${where.kind === "q" && where.k === 0 ? " is-first" : ""}`} style={{ x, y }} data-agent={id}>
      <button className="agent-orb" data-orb={id} onClick={() => (atDesk ? onRoom(id) : onClick(id))} aria-label={atDesk ? `Open a 1:1 with ${AG[id].n}` : `${AG[id].n} is at your door`}>
        <motion.span className="bob" animate={walking ? { y: [0, -5, 0] } : { y: 0, scale: [1, 1.04, 1] }} transition={walking ? { duration: 0.32, repeat: Infinity } : { duration: act && act.k === "type" ? 2.2 : 5, repeat: Infinity, ease: "easeInOut" }}>
          <Orb id={id} size={D.orb} />
        </motion.span>
        {atDesk && act && <Prop act={act} D={D} key={act.k + act.l} />}
      </button>
      <AnimatePresence>{say && !walking && (
        <motion.p key={say} className={`say${where.kind === "q" ? " is-door" : ""}`} initial={{ opacity: 0, y: 6, scale: 0.94 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, transition: { duration: 0.18 } }}
          style={where.kind === "q" ? { right: D.orb / 2 + 12, top: -16 } : { bottom: D.orb / 2 + 12 }}><Typed text={say} ms={D.typeMs} /></motion.p>)}
      </AnimatePresence>
    </motion.div>
  );
}

// the cord between two agents on a call
function Cord({ a, b }) {
  const x1 = DESK[a] + 40, x2 = DESK[b] + 40, y = SIT - 4, top = 236;
  return (<svg className="layer cord" viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
    <motion.path d={`M${x1} ${y} C${x1} ${top} ${x2} ${top} ${x2} ${y}`} fill="none" stroke="#093555" strokeWidth="1.5" strokeDasharray="3 5" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.55, strokeDashoffset: [0, -16] }} exit={{ opacity: 0 }}
      transition={{ pathLength: { duration: 0.7, ease: [0.32, 0.72, 0, 1] }, strokeDashoffset: { duration: 0.8, repeat: Infinity, ease: "linear" } }} />
  </svg>);
}

// ---------------------------------------------------------------- the note an agent hands you, grown out of its orb
function Note({ ag, cards, D, onYes, onLater, onTalk, onClose }) {
  const [i, setI] = useState(0), c = cards[Math.min(i, cards.length - 1)], [pos, setPos] = useState(null);
  useLayoutEffect(() => {
    const o = document.querySelector(`[data-orb="${ag}"]`); if (!o) return; const r = o.getBoundingClientRect(), w = Math.min(340, window.innerWidth - 32);
    const left = Math.max(16, Math.min(window.innerWidth - w - 16, r.left - w - 14)), top = Math.max(16, Math.min(window.innerHeight - 300, r.top - 140));
    setPos({ left, top, w, ox: r.left + r.width / 2 - left, oy: r.top + r.height / 2 - top });
  }, [ag]);
  useEffect(() => { const k = (e) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  if (!pos || !c) return null;
  return (<>
    <motion.div className="note-scrim" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
    <motion.div className="note" style={{ left: pos.left, top: pos.top, width: pos.w, transformOrigin: `${pos.ox}px ${pos.oy}px` }}
      initial={{ opacity: 0, scale: 0.15 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.2, transition: { duration: 0.22 } }} transition={D.pop}>
      <span className="note-h"><Orb id={ag} size={16} /><b>{AG[ag].n}</b>{cards.length > 1 && <em>{i + 1} of {cards.length}</em>}</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={c.id} className="note-b" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
          <b className="note-t">{c.t}</b><span className="note-r">{c.rec}</span>
        </motion.span>
      </AnimatePresence>
      <span className="note-a">
        <button className="btn-y" onClick={() => { onYes(c); if (cards.length > 1) setI(0); }}>{c.act}</button>
        <button className="btn-n" onClick={() => onTalk(c)}>Talk</button>
        <button className="btn-n" onClick={() => onLater(c)}>Later</button>
      </span>
    </motion.div>
  </>);
}

// ---------------------------------------------------------------- a 1:1, from the room
function OneOnOne({ id, seat, D, topic, said, started, onClose }) {
  const d = { ...seat.desk[id], catch: said || seat.desk[id].catch, on: [...started, ...seat.desk[id].on] }, [msgs, setMsgs] = useState([]), [v, setV] = useState("");
  useEffect(() => { const k = (e) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const send = () => { const q = v.trim(); if (!q) return; setMsgs((m) => [...m, ["you", q], [id, ASKED[id]]]); setV(""); };
  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="one" onClick={(e) => e.stopPropagation()} initial={{ opacity: 0, scale: 0.6, y: -30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.2 } }} transition={D.pop}>
        <div className="one-h"><Orb id={id} size={40} /><span><b>{AG[id].n}</b><em>{AG[id].role} · 1:1</em></span><button className="one-x" onClick={onClose} aria-label="Close">×</button></div>
        {topic && <p className="one-q">About: {topic}</p>}
        <p className="one-say"><Typed text={d.catch} ms={D.typeMs} /></p>
        {d.on.length > 0 && <div className="one-sec"><h4>On now</h4>{d.on.map((t) => <div key={t} className="one-r"><span className="dot-run" style={{ background: HUE[id] }} />{t}</div>)}</div>}
        {d.done.length > 0 && <div className="one-sec"><h4>Since you looked</h4>{d.done.map(([t, at, f]) => <div key={t} className="one-r is-done"><span className="one-rt"><b>{t}</b>{f}</span>{at && <em>{at}</em>}</div>)}</div>}
        {msgs.length > 0 && <div className="one-chat">{msgs.map(([w, m], i) => <p key={i} className={w === "you" ? "is-you" : ""}>{w === "you" ? m : <Typed text={m} ms={D.typeMs} />}</p>)}</div>}
        <form className="one-ask" onSubmit={(e) => { e.preventDefault(); send(); }}><input value={v} onChange={(e) => setV(e.target.value)} placeholder={`Ask ${AG[id].n} anything`} autoFocus /></form>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------- the house
function House({ who, D }) {
  const seat = SEATS[who], acts = ACTS[who], board = BOARD[who];
  const [beat, setBeat] = useState(0);
  const [queue, setQueue] = useState([]), [arrived, setArrived] = useState({}), [knock, setKnock] = useState(0);
  const [cards, setCards] = useState(() => { const o = {}; for (const c of seat.hand) (o[c.ag] = o[c.ag] || []).push(c); return o; });
  const [later, setLater] = useState([]), [said, setSaid] = useState({}), [started, setStarted] = useState({}), [rows, setRows] = useState({});
  const [note, setNote] = useState(null), [one, setOne] = useState(null), [north, setNorth] = useState(false);
  const order = useRef([...new Set(seat.hand.map((c) => c.ag))]);

  useEffect(() => { const t = setInterval(() => setBeat((b) => b + 1), D.beat * 1000); return () => clearInterval(t); }, [D.beat]);
  // they come down one at a time, after you've had a moment
  useEffect(() => { const ts = order.current.map((ag, i) => setTimeout(() => setQueue((q) => (q.includes(ag) ? q : [...q, ag])), (D.first + i * D.stagger) * 1000)); return () => ts.forEach(clearTimeout); }, []);
  const arrive = (ag, k) => { setArrived((a) => ({ ...a, [ag]: true })); if (k === 0) setKnock((n) => n + 1); };
  const leave = (ag) => { setNote(null); setQueue((q) => q.filter((x) => x !== ag)); setArrived((a) => ({ ...a, [ag]: false })); };
  const yes = (c) => {
    setSaid((s) => ({ ...s, [c.ag]: c.reply })); setStarted((s) => ({ ...s, [c.ag]: [...(s[c.ag] || []), c.job] }));
    if (BOARD_AFTER[c.id]) setRows((r) => ({ ...r, [BOARD_AFTER[c.id][0]]: BOARD_AFTER[c.id][1] }));
    const rest = (cards[c.ag] || []).filter((x) => x.id !== c.id); setCards((o) => ({ ...o, [c.ag]: rest }));
    if (!rest.length) leave(c.ag);
    setTimeout(() => setSaid((s) => (s[c.ag] === c.reply ? { ...s, [c.ag]: null } : s)), D.beat * 1000 * 1.6);
  };
  const setAside = (c) => { setLater((l) => [...l, c]); const rest = (cards[c.ag] || []).filter((x) => x.id !== c.id); setCards((o) => ({ ...o, [c.ag]: rest })); if (!rest.length) leave(c.ag); };
  const bringBack = () => { const L = later; setLater([]); setCards((o) => { const n = { ...o }; for (const c of L) n[c.ag] = [...(n[c.ag] || []), c]; return n; });
    setQueue((q) => [...q, ...[...new Set(L.map((c) => c.ag))].filter((a) => !q.includes(a))]); };

  const actOf = (id) => (said[id] ? { k: "type", l: said[id] } : acts[id][beat % acts[id].length]);
  const sayOf = (id) => { const k = queue.indexOf(id); if (k >= 0) return k === 0 && arrived[id] ? ((cards[id] || []).length > 1 ? `${(cards[id] || []).length} things. Quick ones.` : "Got a sec?") : null; return actOf(id).l; };
  const onCall = IDS.filter((id) => !queue.includes(id) && actOf(id).k === "phone");
  const call = onCall.length === 2 && actOf(onCall[0]).w === onCall[1] ? onCall : null;
  const busy = (id) => seat.desk[id].on.length + (started[id] || []).length;
  const waiting = queue.filter((a) => arrived[a]).length;

  return (
    <>
      <Back who={who} sky={SKY(new Date().getHours())} knock={knock} />
      {/* rooms you can step into */}
      {IDS.map((id, i) => <button key={id} className="room-hit" style={{ left: [140, 410, 680][i], top: 140, width: 260, height: 290 }} onClick={() => setOne({ id })} aria-label={`Open a 1:1 with ${AG[id].n}`} />)}
      <button className="room-hit" style={{ left: 140, top: 450, width: 330, height: 290 }} onClick={() => setNorth((x) => !x)} aria-label="Ask North to catch you up" />
      {IDS.map((id, i) => <span key={id} className="plaque" style={{ left: [150, 420, 690][i], top: 150 }}><b>{AG[id].n}</b> · {AG[id].role}{busy(id) ? ` · ${busy(id)} going` : ""}</span>)}
      <span className="plaque" style={{ left: 150, top: 460 }}><b>North</b></span>
      <span className="plaque" style={{ left: 490, top: 460 }}><b>{who === "sam" ? "Your office" : "Your office"}</b></span>

      {/* your whiteboard */}
      <div className="board" style={{ left: 512, top: 490 }}>
        <h5>{board.h}</h5>
        {board.rows.map(([k, t, tone]) => <motion.p key={k + (rows[k] || t)} className={`b-row${tone && !rows[k] ? " is-" + tone : ""}${rows[k] ? " is-done" : ""}`} initial={rows[k] ? { opacity: 0, x: -6 } : false} animate={{ opacity: 1, x: 0 }}>{rows[k] || t}</motion.p>)}
      </div>

      <AnimatePresence>{call && <Cord key="cord" a={call[0]} b={call[1]} />}</AnimatePresence>
      {IDS.map((id) => <Agent key={id} id={id} D={D} where={queue.includes(id) ? { kind: "q", k: queue.indexOf(id) } : { kind: "desk" }} act={actOf(id)} say={sayOf(id)}
        onArrive={arrive} onClick={(a) => arrived[a] && setNote(a)} onRoom={(a) => setOne({ id: a })} />)}
      <Front />

      <AnimatePresence>{knock > 0 && waiting > 0 && <motion.span key={knock} className="knock" initial={{ opacity: 0, x: 0 }} animate={{ opacity: [0, 1, 1, 0], x: [0, -6, -10, -14] }} transition={{ duration: 1.6, times: [0, 0.1, 0.7, 1] }}>knock knock</motion.span>}</AnimatePresence>
      <AnimatePresence>{later.length > 0 && <motion.button key="later" className="stickies" onClick={bringBack} initial={{ opacity: 0, scale: 0.6, rotate: -10 }} animate={{ opacity: 1, scale: 1, rotate: -4 }} exit={{ opacity: 0, scale: 0.6 }} aria-label="Bring back what you set aside">
        {later.length} for later</motion.button>}</AnimatePresence>

      <AnimatePresence>{north && (
        <motion.div className="north-say" style={{ left: 154, top: 488 }} initial={{ opacity: 0, scale: 0.6, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7 }} transition={D.pop} onClick={() => setNorth(false)}>
          <Typed text={seat.north} ms={Math.max(8, D.typeMs * 0.55)} />
        </motion.div>)}
      </AnimatePresence>

      {/* overlays live outside the scaled world (portalled by the page) */}
      <Portal>
        <AnimatePresence>{note && cards[note]?.length > 0 && <Note key={note} ag={note} cards={cards[note]} D={D} onYes={yes} onLater={setAside} onTalk={(c) => { setNote(null); setOne({ id: c.ag, topic: c.t }); }} onClose={() => setNote(null)} />}</AnimatePresence>
        <AnimatePresence>{one && <OneOnOne key={one.id} id={one.id} topic={one.topic} said={said[one.id]} started={started[one.id] || []} seat={seat} D={D} onClose={() => setOne(null)} />}</AnimatePresence>
      </Portal>
      <Slot id="hintslot"><p className="hint">{waiting ? `${waiting} waiting at your door. Click whoever’s first.` : later.length ? "Your door’s clear. The sticky note has what you set aside." : "Click a room for a 1:1. Click North’s room to get caught up."}</p></Slot>
    </>
  );
}
const Portal = ({ children }) => createPortal(children, document.getElementById("over"));
function Slot({ id, children }) { const [el, setEl] = useState(null); useEffect(() => setEl(document.getElementById(id)), []); return el ? createPortal(children, el) : null; }

function Page() {
  const D = fromDials(useDialKit("House", CONFIG));
  const [dials, setDials] = useState(false), [who, setWho] = useState("beyonce"), stage = useRef(null), [s, setS] = useState(1);
  useEffect(() => { const k = (e) => { const a = document.activeElement; if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName)) return; if (e.key === "d" || e.key === "D") setDials((x) => !x); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  useLayoutEffect(() => { const el = stage.current; const ro = new ResizeObserver(() => setS(Math.max(0.62, Math.min(1.1, el.clientWidth / W)))); ro.observe(el); return () => ro.disconnect(); }, []);
  const h = new Date().getHours(), part = h < 12 ? "Morning" : h < 17 ? "Afternoon" : "Evening";
  return (
    <div className={`page${dials ? "" : " dials-off"}`}>
      <header className="top">
        <span className="hi"><b>{part}, {SEATS[who].n}.</b><span>Here’s the team.</span></span>
        <span className="seg" role="tablist">{Object.entries(SEATS).map(([k, x]) => (
          <button key={k} role="tab" aria-selected={who === k} className={`seg-b${who === k ? " is-on" : ""}`} onClick={() => setWho(k)}>
            {who === k && <motion.span layoutId="seg" className="seg-on" transition={{ type: "spring", visualDuration: 0.35, bounce: 0.15 }} />}<span>{x.n}</span></button>))}</span>
      </header>
      <div className="stage" ref={stage}>
        <div className="sizer" style={{ width: W * s, height: H * s }}><div className="world" style={{ transform: `scale(${s})` }}><House key={who} who={who} D={D} /><div className="grain" /></div></div>
      </div>
      <div id="hintslot" />
      {dials && <DialRoot position="bottom-right" theme="dark" productionEnabled defaultOpen />}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Page />);
