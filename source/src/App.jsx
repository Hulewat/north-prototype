import { createPortal } from "react-dom";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PHOTOS } from "./photos.js";
import { VoiceLayer, voice, runCommand } from "./voice.jsx";
import { FileHost, FILE_OF, Preview, SlideThumb, showFile } from "./files.jsx";
import { DocCover } from "./covers.jsx";
import { CAMPAIGN, useCampaignDash, setCampaign } from "./campaign.jsx";
import { AGENTS as AG_N, SelIn } from "./agents.jsx";
import { PEOPLE as TP } from "./team-talk.js";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence, LayoutGroup, animate as mAnimate } from "motion/react";
import { DialRoot, DialTimeline, useDialKit, useDialTimeline } from "dialkit";
import { C, bezier, clamp, lerp, stag, win, toMotion, useReplay, useSpringTo, prefersReduced, useGraceHover } from "./lib.js";
import { MonthlyBars, MonthlyLine, PaceLine, Segments, ByKind, mix, GeoCtx, geo } from "./open-charts.jsx";
import { CompanyHealth, LANES, metricFor, SC, TXT, status, Mini, CARDS, GREEN, OFF } from "./health.jsx";
import { useActions } from "./actions.jsx";
import { useWho, setSeat, seatOf } from "./seat.js";
import { TuneLayer } from "./tune.jsx";
import { NorthLogo } from "./marks.jsx";
import { HomeWork } from "./home-work.jsx";
import { SamField, NewBusinessSpace } from "./field.jsx";
import { setOwn, GOAL_TILES, GOAL_IDS, GoalSide, goalOpenH, useGoalStore, goalRw, setGoalRw, RW, NeedsYou, Moving, useIP, setIP } from "./goals.jsx";
// Messages (talk.jsx) is parked: conversation moves onto the pieces and into North's chat instead of its own page
import { installHover } from "./hover.js";
import { AgentsWorkspace } from "./agents-concept.jsx";
import { Chat, CHAT_TILES, ChatVisual, EdgeFly, CARRY } from "./chat.jsx";
import { ArrPage } from "./arr.jsx";
import { ARR, ARR_START, MOVES, MOVE_C, arrData, OCT_TARGET } from "./arr-data.js";
import { ActionsCtx, PinIcon, AskChartIcon, PinButton, AskButton, canon, isStaple, tileOf } from "./actions.jsx";
import { MetricPage } from "./metric.jsx";
import { Department, FilesPage } from "./dept.jsx";
import { MeetingsPage } from "./meetings.jsx";
import { MotionCtx, TipBody, BookedTicks, WinRings, LogosArea, DemoRuler, ExpansionLines, TtvLollipop } from "./visuals.jsx";

const REDUCED = prefersReduced();

// ------------------------------------------------------------------ data
// ARR, what moved each month, and the movement colors live in arr-data.js, shared with the ARR movement page
const _A26 = arrData("all", "2026"), NET_MAYOCT = _A26.net.slice(4, 10), NET_KIND = [4, 5, 6, 7, 8, 9].map((i) => [_A26.new[i], _A26.exp[i], _A26.loss[i]]);
const money = (v) => (Math.abs(v) >= 1 ? `$${Math.abs(v).toFixed(2)}M` : `$${(Math.abs(v) * 1000).toFixed(0)}K`);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_L = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const KPIS = [
  { id: "felix", label: "Felix ARR · Oct", ctx: "pace $12.99M of $13.06M", hover: "$70K to the October target", val: 12.99, fmt: (v) => `$${v.toFixed(2)}M`, pct: 100, state: "on", fill: 1, goal: null },
  { id: "total", label: "Total ARR", ctx: "proj. $38.94M of $40.03M plan", hover: "$1.09M short of plan at this rate", val: 35.75, fmt: (v) => `$${v.toFixed(2)}M`, pct: 89, state: "watch", fill: 35.75 / 40.03, goal: 37.31 / 40.03 },
  { id: "nrr", label: "NRR · Monthly", ctx: "target 100.0%", hover: "0.1 pts to target", val: 99.9, fmt: (v) => `${v.toFixed(1)}%`, pct: 100, state: "ahead", fill: 99.9 / 100, goal: null },
  { id: "netnew", label: "Net new ARR · Oct", ctx: "pace $1.78M of $1.87M", hover: "$180K behind pace", val: 1.6, fmt: (v) => `$${v.toFixed(2)}M`, pct: 86, state: "behind", fill: 1.6 / 1.87, goal: 1.78 / 1.87 },
];
const STATE = { on: { fill: C.navyFill, text: C.navy }, watch: { fill: "#744ccb", text: "#744ccb" }, behind: { fill: C.coral, text: C.coral }, ahead: { fill: C.teal, text: C.teal } };
const BOARD = [
  { id: "booked", name: "Booked ARR – Outbound created", lane: "Sales", value: "$130.2K", pct: 23, foot: "Sales · Outbound", title: "Outbound booked ARR is $443.6K behind pace", sub: "Closing the October target now takes $534.3K in the last 4 days of the month.", V: BookedTicks },
  { id: "winrate", name: "Expansion win rate", lane: "Sales", value: "31.9%", pct: 53, foot: "Sales · Expansion", title: "Expansion deals close at half the goal rate", sub: "Share of expansion deals that close as won.", V: WinRings },
  { id: "logos", name: "New logos", lane: "Sales", value: "55", pct: 75, foot: "Sales · New business", title: "New logos are 18 behind pace", sub: "At this rate October closes at 63. Pace says 73 by now.", V: LogosArea },
  { id: "demo", name: "Win rate from held demo", lane: "Sales", value: "19.9%", pct: 85, foot: "Sales · New business", title: "Held demos convert 3.6 points under target", sub: "Share of held demos that turn into wins.", V: DemoRuler },
  { id: "exp", name: "Expansion ARR", lane: "Sales", value: "$734.0K", pct: 72, foot: "Sales · Expansion", title: "Expansion ARR is $280K behind pace", sub: "Booked against the pace to the October target, since Oct 1.", V: ExpansionLines },
  { id: "ttv", name: "TTV: Days to 10 handoffs", lane: "Customer Value", value: "20.9d", pct: 72, foot: "Customer Value", title: "Customers take 6 days longer to reach 10 handoffs", sub: "Average days to reach 10 handoffs. Lower is better.", V: TtvLollipop },
];
// Beyonce's board: the decks and docs she's presenting or signing off, beside the charts she keeps an eye on. A document
// shows the page itself and what's left on it; the corner button takes it full screen (sample documents)
// each document shows itself whole (a deck's slide, a doc's first page, a video's frame); the breakdown beside it says only
// what the preview and the headline don't: who's on it, what it's waiting on, what's yours
const DOC_ITEMS = [
  { id: "d-saastr", cap: "4 slides", k: "saastr", doc: true, name: "Your SaaStr talk", lane: "Deck · Lisa", right: "Nov 19", need: "Your read", title: "Your SaaStr talk on Nov 19: Lisa’s draft is in", sub: "She wants your read before Friday.", foot: "Deck · Lisa · SaaStr", end: "Nov 19",
    parts: [["Length", "4 slides, about 12 minutes"], ["The story", "How Brightwater went live on Portal"], ["Your part", "A read and your notes"]] },
  { id: "d-workshop", cover: "event", cap: "Agenda · 4 sessions", k: "workshop", doc: true, name: "Brokerage leaders workshop", lane: "Doc · Lisa", right: "Nov 24", title: "Brokerage leaders workshop: you open it at 9:00", sub: "Leaders from 14 brokerages, 9 of them customers (sample).", foot: "Doc · Lisa · Agenda", end: "Nov 24",
    parts: [["Your slot", "9:00, 15 minutes"], ["Still open", "Dustin’s Portal roadmap"], ["Lisa needs", "Your opening by Nov 20"]] },
  { id: "d-board", cap: "9 slides · 6 drafted", k: "boarddeck", doc: true, name: "Board deck", lane: "Deck · Paul", right: "Dec 3", title: "Board deck for Dec 3: six of nine slides are drafted", sub: "Paul is on slide 7, the forecast.", foot: "Deck · Paul · Board meeting", end: "Dec 3",
    parts: [["Slides", [6, 1, 2], "dots"], ["Waiting on", "Retention numbers, Dec 2 close"], ["Not started", "Asks of the board"], ["Yours", "Talking points, ready to read", "ok"]] },
  { id: "d-pipeline", cover: "charts", cap: "Report · 4 charts", k: "pipeline", doc: true, name: "Q4 pipeline", lane: "Report · Riley", right: "4 charts", title: "Q4 pipeline: Outbound is the gap", sub: "Riley’s report, from Company health.", foot: "Report · Riley · Company health", end: "4 charts",
    parts: [["Furthest behind", "Outbound, 23% of pace"], ["Closest", "Held-demo win rate, 85%"], ["Riley’s read", "Move Sam back to Outbound"]] },
];
const DOC_BOARD = [
  { id: "d-portal", cover: "site", site: "https://51583755.hs-sites.com/portal", cap: "Site · Fello Portal", doc: true, name: "Portal launch page", lane: "Site · Marketing", right: "Live",
    title: "Portal’s launch page is live", sub: "“What if your website was alive?” It shows Felix building a listing page as you ask.", foot: "Site · Marketing · Portal", end: "Live",
    parts: [["Headline", "What if your website was alive?"], ["Shows", "Felix building a page, just by asking"], ["Asks for", "A demo, from the hero"]] },
  DOC_ITEMS[0], DOC_ITEMS[1], DOC_ITEMS[2],
  { id: "d-video", cap: "Video · 2:14", k: "brightvid", doc: true, video: { t: "Every listing, built on Portal", who: "Brightwater Realty", len: 134 }, name: "Brightwater’s Portal story", lane: "Video · Lisa", right: "2:14",
    title: "Brightwater’s Portal story: Lisa’s rough cut is in", sub: "It plays at the Nov 24 workshop, right after your opening (sample).", foot: "Video · Lisa · Marketing", end: "Rough cut",
    parts: [["Lisa needs", "Your OK on the 0:40 pricing quote"], ["Shows at", "The Nov 24 workshop"], ["Then", "The Portal launch page"]] },
  DOC_ITEMS[3], BOARD[0],
  { id: "d-ret", cover: "line", cap: "Doc · Jordan’s draft", k: "retplan", doc: true, name: "Q4 retention plan", lane: "Doc · Jordan", right: "Draft", need: "Your sign-off", act: ["retplan", "Sign off", "Signed off"], title: "Q4 retention plan: Jordan’s draft is in", sub: "It goes ahead once you sign off.", foot: "Doc · Jordan · Customer Value", end: "Draft",
    parts: [["Holds", "GRR above 97% to Dec 31"], ["Biggest risk", "Brightline renews Nov 14"], ["Yours", "The sign-off", "need"]] },
  ...BOARD.slice(1)];
const ORDER = { felix: 0, total: 1, nrr: 3, netnew: 4 };
const WORST = [...BOARD].sort((a, b) => a.pct - b.pct).slice(0, 3).map((b) => b.id);
const PROMPTS = ["Ask North anything…", "Make a dash of the latest campaign", "Why is Outbound behind pace?", "Simulate a path to $40M"];

// ------------------------------------------------------------------ icons (1px, 16 grid)
const I = {
  bars: <><path d="M2.5 13.5H13.5" /><path d="M4.25 11V8.5" /><path d="M7 11V5.5" /><path d="M9.75 11V7" /><path d="M12.5 11V3.5" /></>,
  pulse: <path d="M2 8H4.5L6 4.5L8.5 11.5L10 8H14" />,
  trend: <><path d="M2.5 11.5L6 8L8.5 10.5L13.5 5.5" /><path d="M10.5 5.5H13.5V8.5" /></>,
  home: <><path d="M3 7L8 3L13 7V13H3V7Z" /><path d="M6.5 13V9.5H9.5V13" /></>,
  agents: <><circle cx="5" cy="5.5" r="2.1" /><circle cx="11" cy="5.5" r="2.1" /><circle cx="8" cy="11" r="2.1" /></>,
  book: <><path d="M2.5 3.5H6C7.1 3.5 8 4.4 8 5.5V13C8 12.2 7.3 11.5 6.5 11.5H2.5V3.5Z" /><path d="M13.5 3.5H10C8.9 3.5 8 4.4 8 5.5V13C8 12.2 8.7 11.5 9.5 11.5H13.5V3.5Z" /></>,
  plus: <><path d="M8 3V13" /><path d="M3 8H13" /></>,
  ret: <><path d="M3.2 8.4A4.8 4.8 0 1 0 4.6 4.6" /><path d="M4.4 2.6V4.8H6.6" /></>,
  clock: <><circle cx="8" cy="8" r="5.25" /><path d="M8 5.25V8L9.75 9.25" /></>,
  talk: <><path d="M3 4.5A1.5 1.5 0 0 1 4.5 3h7A1.5 1.5 0 0 1 13 4.5v5A1.5 1.5 0 0 1 11.5 11H7l-3 2.5V11h0A1 1 0 0 1 3 10Z" strokeLinejoin="round" /></>,
  bell: <><path d="M4.5 10.75V7.4a3.5 3.5 0 0 1 7 0v3.35l1 1.25h-9Z" strokeLinejoin="round" /><path d="M6.9 13.75h2.2" strokeLinecap="round" /></>,
  // watching is keeping an eye on something, not a notification: binoculars
  binoculars: <><circle cx="4.6" cy="10.6" r="2.6" /><circle cx="11.4" cy="10.6" r="2.6" /><path d="M7.2 10.2h1.6" strokeLinecap="round" /><path d="M2.1 9.7 3.5 4.6a1.4 1.4 0 0 1 1.35-1.05h.35c.62 0 1.1.5 1.1 1.1V8.4" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.9 9.7 12.5 4.6a1.4 1.4 0 0 0-1.35-1.05h-.35c-.62 0-1.1.5-1.1 1.1V8.4" strokeLinecap="round" strokeLinejoin="round" /></>,
  flag: <><path d="M4 13.5V2.75" /><path d="M4 3.25H11.75L10.25 5.75L11.75 8.25H4" /></>,
  eye: <><path d="M2 8C2 8 4.2 4.25 8 4.25C11.8 4.25 14 8 14 8C14 8 11.8 11.75 8 11.75C4.2 11.75 2 8 2 8Z" /><circle cx="8" cy="8" r="1.75" /></>,
  sliders: <><path d="M2.75 5.25H13.25" /><path d="M2.75 10.75H13.25" /><circle cx="6" cy="5.25" r="1.5" fill="var(--side)" /><circle cx="10" cy="10.75" r="1.5" fill="var(--side)" /></>,
  flame: <path d="M8 2.75C8.6 4.6 10.75 5.6 10.75 8.6C10.75 10.4 9.5 12.25 8 12.25C6.5 12.25 5.25 10.9 5.25 9.4C5.25 8.1 5.9 7.2 6.6 6.6C6.75 7.6 7.25 8.1 7.9 8.25C7.75 6.4 7.4 4.6 8 2.75Z" />,
  search: <><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5L14 14" /></>,
  panel: <><rect x="2" y="3" width="12" height="10" rx="2.5" /><path d="M5.5 6V10" strokeWidth="2" strokeLinecap="round" /></>,
  chev: <path d="M5 9.5L8 6.5L11 9.5" />,
  mic: <><rect x="6" y="2.5" width="4" height="7" rx="2" /><path d="M4 7.5A4 4 0 0 0 12 7.5" /><path d="M8 11.5V13.5" /></>,
  // section icons for the rail — where we are (pin), departments (grid), business lines (fork), how we decide (scales), where we're going (compass)
  here: <><path d="M8 14C8 14 12.5 9.9 12.5 6.5A4.5 4.5 0 0 0 3.5 6.5C3.5 9.9 8 14 8 14Z" /><circle cx="8" cy="6.5" r="1.6" /></>,
  depts: <><rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1" /><rect x="9" y="2.5" width="4.5" height="4.5" rx="1" /><rect x="2.5" y="9" width="4.5" height="4.5" rx="1" /><rect x="9" y="9" width="4.5" height="4.5" rx="1" /></>,
  lines: <><circle cx="4" cy="3.75" r="1.25" /><circle cx="4" cy="12.25" r="1.25" /><circle cx="12" cy="6" r="1.25" /><path d="M4 5V11" /><path d="M12 7.25C12 9.5 9 9.75 4 11" /></>,
  decide: <><path d="M8 2.5V13.5" /><path d="M5 13.5H11" /><path d="M3 4.5H13" /><path d="M3 4.5L1.5 8.5A1.5 1.5 0 0 0 4.5 8.5Z" /><path d="M13 4.5L11.5 8.5A1.5 1.5 0 0 0 14.5 8.5Z" /></>,
  going: <><circle cx="8" cy="8" r="5.75" /><path d="M10.4 5.6L9 9L5.6 10.4L7 7Z" /></>,
  cal: <><rect x="2.5" y="3.5" width="11" height="10" rx="2" /><path d="M2.5 6.75H13.5" /><path d="M5.5 2.25V4.5" /><path d="M10.5 2.25V4.5" /></>,
};
const Icon = ({ k, size = 16, color = "currentColor", sw = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{I[k]}</svg>
);

// ------------------------------------------------------------------ sidebar
// the sidebar, after a pass on what earns a place (Nov 10): where you work (Ask North, Home, your files, your agents), how
// the company's doing, and the teams. Cut: Watching (Home already shows what's moving and what changed), Library (now
// Files), ARR movement (a view inside Company health), the business-lines group (New and Existing business are lanes on
// the Sales home), Meetings and Initiatives (nothing behind them yet; they come back when they do), and "View as…" (the
// account row at the bottom does it).
const NAV = [
  { title: null, items: [{ k: "orb", label: "Ask North", kbd: "⌘K" }, { k: "home", label: "Home", route: "home" }, { k: "book", label: "Files", route: "files" }, { k: "agents", label: "Agents", route: "agents" }, { k: "cal", label: "Meetings", route: "meetings" }, { k: "pulse", label: "Company health", route: "health" }, { k: "bars", label: "ARR movement", route: "arr" }] },
  { title: "Teams", ico: "depts", items: [{ dot: "#744ccb", label: "Sales", score: 75, route: "dept:Sales" }, { dot: "#257985", label: "Marketing", score: 100, route: "dept:Marketing" }, { dot: "#744ccb", label: "Onboarding", score: 80, route: "dept:Onboarding" }, { dot: "#257985", label: "Customer Value", score: 91, route: "dept:Customer Value" }, { dot: "#8a8a8a", label: "RevOps", route: "dept:RevOps" }, { dot: "#257985", label: "Product & Eng", score: 92, route: "dept:Product & Eng" }] },
];
// a rounded pill that opens sideways out of the cursor point; corners stay round the whole way
function NavHover({ o, t }) {
  const [f] = useState(() => ({ ...o }));
  const seed = 18;
  const l = clamp(f.x - seed / 2, 0, f.w - seed), r = f.w - l - seed;
  return (
    <motion.span className="nav-hover"
      initial={{ left: l, right: r, top: 5, bottom: 5, opacity: 0 }}
      animate={{ left: 0, right: 0, top: 0, bottom: 0, opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
      transition={{ default: toMotion(t), opacity: { duration: 0.2 } }} />
  );
}
// ---- accounts (prototype): switch who's signed in to see the product from their seat. Only who you are, the greeting and
// what needs you change; the rest is the same product. Their needs are drawn from what the prototype already holds.
export const PEOPLE = [
  { id: "seth", n: "Beyonce", mail: "beyonce@fello.ai", role: "Leadership", greet: "Beyonce", needs: ["4 anchors have no forecaster", "Approve the Q4 hiring plan"] },
  { id: "jordan", n: "Jordan", mail: "jordan@fello.ai", role: "Customer Success · SMB", greet: "Jordan", needs: ["Book QBRs for the four quiet renewals", "Brightline cut seats this week"] },
  { id: "sam", n: "Sam", mail: "sam@fello.ai", role: "Sales · New Business", greet: "Sam", needs: ["Hold demo volume through Oct 31", "New Business is $140K behind pace"] },
];
const initials = (n) => n.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
function Account({ M, who, setWho, openRef }) {
  const [hv, setHv] = useState(null), at = useRef({ x: 0, w: 200 });
  const [open, setOpen] = useState(false), me = PEOPLE.find((p) => p.id === who) || PEOPLE[0], ref = useRef(null);
  useEffect(() => { if (openRef) openRef.current = () => setOpen(true); }, []);
  useEffect(() => { if (!open) return; const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }, k = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", off); document.addEventListener("keydown", k); return () => { document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", k); }; }, [open]);
  return (
    <div className="acct-wrap" ref={ref}>
      {/* the menu grows up out of the account row it belongs to */}
      <AnimatePresence>{open && (
        <motion.div className="acct-m" initial={{ opacity: 0, scaleY: 0.92, y: 6 }} animate={{ opacity: 1, scaleY: 1, y: 0 }} exit={{ opacity: 0, scaleY: 0.96, y: 4, transition: { duration: 0.14 } }} transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}>
          <small className="acct-m-h">View as</small>
          {PEOPLE.map((p) => (
            <button key={p.id} className={`acct-o${p.id === who ? " is-on" : ""}`} onClick={() => { setWho(p.id); setOpen(false); }}
              onPointerEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(p.id); }} onPointerLeave={() => setHv((h) => (h === p.id ? null : h))}>
              <AnimatePresence>{hv === p.id && <NavHover key="h" o={at.current} t={M.hover.glide} />}</AnimatePresence>
              <span className="avatar" style={PHOTOS[p.id] ? { background: `center/cover url(${PHOTOS[p.id]})` } : undefined}>{p.id === "seth" || PHOTOS[p.id] ? null : initials(p.n)}</span><span><b>{p.n}</b><small>{p.role}</small></span>
            </button>))}
        </motion.div>)}</AnimatePresence>
      <button className={`acct${open ? " is-open" : ""}`} onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}>
        <span className="avatar" style={PHOTOS[me.id] ? { background: `center/cover url(${PHOTOS[me.id]})` } : undefined}>{me.id === "seth" || PHOTOS[me.id] ? null : initials(me.n)}</span><div><b>{me.n}</b><small>{me.id === "seth" ? me.mail : me.role}</small></div>
      </button>
    </div>
  );
}
function Sidebar({ M, intro, page, onNav, syncN = 0, onAsk, watchN: watchN0 = 0, onWatch, who = "seth", setWho = () => {}, readyN: readyN0 = 0, needN = 0 }) {
  // Sam's seat: one place says something needs you (Ask North, where the conversations are); Watching and Agents stay quiet
  const one = who === "sam", watchN = one ? 0 : watchN0, readyN = one ? 0 : readyN0;
  const acctOpen = useRef(null);
  const [hover, setHover] = useState(null);
  const at = useRef({ x: 100, w: 212 });
  const [open, setOpen] = useState(() => Object.fromEntries(NAV.map((s, i) => [i, !s.collapsed])));
  useEffect(() => { if (page && page.startsWith("dept:")) setOpen((o) => ({ ...o, 1: true })); }, [page]);
  const [fly, setFly] = useState(null); // rail: a section's items fly out beside its icon
  const flyT = useRef(null);
  const row = (it00, key) => { const it0 = it00.samOnly && who !== "sam" ? { ...it00, route: undefined } : it00; const it = { ...it0, active: !!it0.route && it0.route === page, ...(it0.label === "Meetings" && syncN ? { count: syncN } : {}), ...(it0.watch ? { watchN } : {}) }; return (
    <li key={key} className={`nav-row${it.active ? " is-active" : ""}${it.k === "orb" ? " is-ask" : ""}${it.watch ? " is-watch" : ""}`} onClick={() => (it.go ? it.go() : it.route ? onNav(it.route) : it.k === "orb" && onAsk && onAsk(""))}
      {...(it.watch && onWatch ? { onPointerLeave: () => onWatch(null) } : it.route === "agents" ? { onPointerLeave: () => dispatchEvent(new Event("north:ready-leave")) } : {})}
      onPointerEnter={(e) => { if (it.watch && onWatch) onWatch(e.currentTarget.getBoundingClientRect());
        /* hover Agents: what's done and ready, right there */ if (it.route === "agents" && readyN > 0) dispatchEvent(new CustomEvent("north:ready-open", { detail: { hover: true } })); const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHover(key); }}>
      <AnimatePresence>
        {hover === key && !it.active && <NavHover key="h" o={at.current} t={M.hover.glide} />}
      </AnimatePresence>
      {it.active && <SelIn className="nav-active" />}
      <span className="nav-ico">
        {it.k === "orb" ? <NorthLogo size={20} className="is-ask" ask /> : it.dot ? <i className="dot" style={{ background: it.dot }} /> : <Icon k={it.k} color={it.active ? C.coral : "#8a8a8a"} />}
      </span>
      <span className="nav-label" {...(it.k === "orb" ? { "data-label": it.label } : {})}>{it.label}</span>{it.watch && it.watchN > 0 && <em className="nav-watch-n" title={`${it.watchN} changed`}>{it.watchN}</em>}
      {it.watch && it.watchN > 0 && <em className="nav-watch-rail" aria-hidden="true">{it.watchN}</em>}
      {/* work that landed for you and you haven't looked at: it waits here, quietly, instead of interrupting */}
      {it.route === "agents" && readyN > 0 && <motion.button key={readyN} className="nav-ready" title="Ready for you" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", visualDuration: 0.3, bounce: 0.3 }}
        onClick={(e) => { e.stopPropagation(); dispatchEvent(new Event("north:ready-open")); }}><i />{readyN}<span> ready</span></motion.button>}
      {one && it.k === "orb" && needN > 0 && <motion.em key={needN} className="nav-need" title={`${needN} waiting on you`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", visualDuration: 0.3, bounce: 0.3 }}>{needN}</motion.em>}
      {it.kbd && <kbd>{it.kbd}</kbd>}
      {it.score != null && <span className="nav-score">{it.score}</span>}
      {it.count != null && <motion.span key={it.count} className="nav-count" title={it.watch ? `Watching ${it.count}` : `${it.count} on Monday sync`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", visualDuration: 0.3, bounce: 0.4 }}>{it.count}</motion.span>}
    </li>
  ); };
  return (
    <motion.aside className="side" style={{ opacity: intro.frame.current.opacity, "--nm-sweep": `${M.hover.askShimmer}s`, "--nl-push": `${M.hover.nlPush}px`, "--nl-stag": `${M.hover.nlStagger}ms`, "--nl-dur": `${M.hover.nlDur}ms` }} onPointerLeave={() => setHover(null)}>
      <div className="side-head">
        <NorthLogo size={22} className="is-brand" />
        <span className="ws">North</span>
        <button className="ibtn" aria-label="Search"><Icon k="search" size={18} color={C.navy} sw={1.25} /></button>
        <button className="ibtn" aria-label="Collapse sidebar" onClick={() => { const r = document.documentElement.classList; r.toggle(r.contains("chat-dock") || r.contains("chat-full") ? "side-open" : "side-rail"); window.dispatchEvent(new Event("north:side")); }}><Icon k="panel" size={18} color={C.navy} sw={1.25} /></button>
      </div>
      <nav>
        {NAV.map((s, si) => (
          <section key={si} className="nav-sec">
            {s.title && (
              <button className={`rail-cat${s.items.some((it) => it.route && it.route === page) ? " is-active" : ""}`} aria-label={s.title}
                onPointerEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); clearTimeout(flyT.current); setFly({ si, top: r.top, h: r.height }); }}
                onPointerLeave={() => { flyT.current = setTimeout(() => setFly(null), 160); }}
                onClick={() => { const first = s.items.find((it) => it.route); if (first) onNav(first.route); }}>
                <Icon k={s.ico} size={16} sw={1} color={s.items.some((it) => it.route && it.route === page) ? C.coral : "#8a8a8a"} />
              </button>
            )}
            {s.title && (
              <button className="sec-head" aria-expanded={open[si]} onClick={() => setOpen((o) => ({ ...o, [si]: !o[si] }))}>
                <span>{s.title}</span>
                <motion.span animate={{ rotate: open[si] ? 0 : 180 }} transition={toMotion(M.collapse)} style={{ display: "flex" }}>
                  <Icon k="chev" color="#8a8a8a" />
                </motion.span>
              </button>
            )}
            <AnimatePresence initial={false}>
              {open[si] && (
                <motion.ul key="ul" className="nav-list" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={toMotion(M.collapse)}>
                  {s.items.map((it, ii) => row(it, `${si}-${ii}`))}
                </motion.ul>
              )}
            </AnimatePresence>
          </section>
        ))}
      </nav>
      {createPortal(
        <AnimatePresence>
          {fly && (
            <EdgeFly key={fly.si} className="rail-fly" top={fly.top - 6} start={fly.h || 36}
              onPointerEnter={() => clearTimeout(flyT.current)} onPointerLeave={() => { flyT.current = setTimeout(() => setFly(null), 140); }}>
              <b>{NAV[fly.si].title}</b>
              <ul>{NAV[fly.si].items.map((it, ii) => (
                <li key={it.label} style={{ "--i": ii + 1 }} className={it.route && it.route === page ? "is-active" : ""} onClick={() => { if (it.route) { onNav(it.route); setFly(null); } }}>
                  <span className="nav-ico">{it.dot ? <i className="dot" style={{ background: it.dot }} /> : <Icon k={it.k} color={it.route && it.route === page ? C.coral : "#8a8a8a"} />}</span>
                  {it.label}{it.score != null && <em>{it.score}</em>}
                </li>
              ))}</ul>
            </EdgeFly>
          )}
        </AnimatePresence>, document.body)}
      <div className="side-foot">
        <ul className="nav-list">
          {[{ k: "sliders", label: "Settings" }, { k: "flame", label: "Back to Turbo" }].map((it, i) => row(it, `f-${i}`))}
        </ul>
        <Account M={M} who={who} setWho={setWho} openRef={acctOpen} />
      </div>
    </motion.aside>
  );
}

// ------------------------------------------------------------------ top bar
// which agent owns each lane's work (the Home row deals are Riley's; Outbound and the reviews are Orin's)
const LANE_AGENT = { inbound: "marco", outbound: "orin", "new business": "riley", "value delivery": "calvin", "customer value": "calvin", expansion: "calvin", "product & eng": "calvin" };
const laneAgent = (l) => { const k = String(l || "").trim().toLowerCase(); return LANE_AGENT[k] || Object.entries(LANE_AGENT).find(([n]) => k.includes(n))?.[1] || null; };
function Gauge({ v, p }) {
  const r = 6, c = 2 * Math.PI * r;
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r={r} fill="none" stroke={C.teal} strokeOpacity="0.18" strokeWidth="1.5" />
      <circle cx="8" cy="8" r={r} fill="none" stroke={C.teal} strokeWidth="1.5" strokeDasharray={`${c * v * p} ${c}`} transform="rotate(-90 8 8)" />
    </svg>
  );
}
function TopBar({ M, intro, dock, barRef, onAttention, chips = true, flat, home, bare }) {
  const [gaugeKey, setGaugeKey] = useState(0);
  const g = useReplay(gaugeKey, M.chips.gauge, { reduced: REDUCED });
  const gp = Math.min(g, intro.chartDraw.current.p);
  return (
    <motion.header ref={barRef} className={`topbar${flat ? " is-flat" : ""}${home ? " is-home" : ""}${bare ? " is-bare" : ""}`} style={{ opacity: intro.frame.current.opacity, y: intro.frame.current.y }}>
      {dock}
      <div id="topbar-crumbs" className="topbar-crumbs" />
      <div id="topbar-dock" className="topbar-dock" />
      {chips && <>
      <button className="chip chip-alert" onClick={onAttention}><span><b>2</b> need attention</span></button>
      <button className="chip chip-score" onPointerEnter={() => setGaugeKey((k) => k + 1)}><Gauge v={0.96} p={gp} /><span><b>{Math.round(96 * gp)}</b> Oct. pace</span></button>
      <button className="chip chip-cust"><Icon k="sliders" size={14} color={C.navy} /> Customize</button>
      </>}
    </motion.header>
  );
}

// ------------------------------------------------------------------ composer
// on the Agents page the same field asks about the work, so its examples talk to the agents
const AGENT_PROMPTS = ["Ask North anything…", "What’s Caleb doing?", "If Outbound drops below 30% of pace, have Orin check the pipeline", "Fia, give me a breakdown of everything you’re working on", "@Felix check which renewals are at risk"];
// a seat's hint text: its own questions (same count as leadership's, so the cycle keeps its rhythm)
// Sam's Home is the loop: an @ in the ask starts a chat with those people (the hints show the two the walkthrough uses)
const SEAT_PROMPTS = { sam: { home: ["Ask North anything…", "Why aren’t my held demos closing?", "@Jordan Brightwater renewal pricing, can we talk?", "Make a deck of the late-stage deals for Heather’s review"],
  agents: ["Ask North anything…", "What’s on my plate?", "What is Fia working on?", "How’s New Business doing?", "If new logos drop below 70% of pace, have Fia check my demos"] } };
function useAsk(M, P = PROMPTS) {
  const [focus, setFocus] = useState(false);
  const [val, setVal] = useState("");
  const [pi, setPi] = useState(0);
  useEffect(() => {
    if (focus || val || REDUCED) return;
    const t = setInterval(() => setPi((i) => (i + 1) % P.length), M.composer.cycle * 1000);
    return () => clearInterval(t);
  }, [focus, val, M.composer.cycle]);
  return { focus, setFocus, val, setVal, pi, P, onAsk: null };
}
// one ask bar, two places. The top-bar copy sits directly above the page copy's column and is revealed,
// tied to scroll, exactly as much as the page copy has slid under the top bar's edge. Nothing flies.
function Composer({ M, ask, docked }) {
  const { focus, setFocus, val, setVal, pi } = ask, P = ask.P || PROMPTS, taRef = useRef(null);
  useLayoutEffect(() => { const t = taRef.current; if (!t) return; t.style.height = "0px"; t.style.height = `${t.scrollHeight}px`; }, [val]);
  return (
    <motion.form className={`composer${focus ? " is-focus" : ""}${docked ? " is-docked" : ""}`} onSubmit={(e) => { e.preventDefault(); const typed = val.trim();
      // nothing typed: the voice button listens. Typed: a command runs where you are, anything else asks North
      if (!typed) { voice.start(); return; } { const r = runCommand(typed); if (r) { setVal(""); voice.say(r); return; } } ask.onAsk && ask.onAsk(typed); setVal(""); }}
      style={{ borderRadius: docked ? 6 : 4 }}
      animate={{ boxShadow: focus ? "0 8px 24px -12px rgba(9,53,85,0.25)" : "0 0px 0px 0px rgba(9,53,85,0)" }}
      transition={toMotion(M.composer.focus)}>
      <label htmlFor={docked ? "ask-top" : "ask"} className="sr">Ask North</label>
      <motion.div className="ask-field">
        {docked ? <input id="ask-top" value={val} onChange={(e) => { const v = e.target.value; if (ask.onType && v.trim()) { ask.onType(v); setVal(""); e.target.blur(); } else setVal(v); }} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} autoComplete="off" />
          // on the page the field grows down a line at a time once what you write passes its width; Enter sends, Shift+Enter breaks the line
          : <textarea id="ask" ref={taRef} rows={1} value={val} onChange={(e) => { const v = e.target.value; if (ask.onType && v.trim()) { ask.onType(v); setVal(""); e.target.blur(); } else setVal(v); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); e.currentTarget.form.requestSubmit(); } }} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} autoComplete="off" />}
        {!val && (
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={pi} className="ph" initial={{ y: 12, opacity: 0, filter: "blur(3px)" }} animate={{ y: 0, opacity: 1, filter: "blur(0px)" }} exit={{ y: -12, opacity: 0, filter: "blur(3px)" }} transition={toMotion(M.composer.cycleSpring)}>
              {P[pi]}
            </motion.span>
          </AnimatePresence>
        )}
      </motion.div>
      <motion.button type="button" className="ibtn ibtn-lg" aria-label="Attach"><Icon k="plus" size={docked ? 14 : 20} color={C.navy} sw={1.25} /></motion.button>
      {/* point at a chart on the page and ask about it (the chat docks once you've picked one) */}
      <motion.button type="button" className="ibtn ibtn-lg ask-aim" aria-label="Point at a chart" title="Point at a chart (or hold ⌥)" onClick={() => ask.onPoint && ask.onPoint()}>
        <svg width={docked ? 14 : 20} height={docked ? 14 : 20} viewBox="0 0 20 20" fill="none" stroke={C.navy} strokeWidth="1.4" aria-hidden="true"><circle cx="10" cy="10" r="7.6" /><circle cx="10" cy="10" r="4.5" /><circle className="dot" cx="10" cy="10" r="1.75" fill={C.navy} stroke="none" /></svg>
      </motion.button>
      <motion.button type="submit" className="voice" aria-label={val.trim() ? "Send" : "Talk to North"} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} transition={toMotion(M.hover.press)}>
        {/* empty, it listens; once you've typed, the same button sends: the bars give way to the arrow */}
        <AnimatePresence mode="popLayout" initial={false}>{val.trim()
          ? <motion.svg key="send" width={docked ? 12 : 16} height={docked ? 12 : 16} viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              initial={{ opacity: 0, y: 6, scale: 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.7 }} transition={{ type: "spring", visualDuration: 0.28, bounce: 0.25 }}><path d="M8 13V3M4 7l4-4 4 4" /></motion.svg>
          : <motion.span key="bars" className="bars" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.6 }} transition={{ type: "spring", visualDuration: 0.28, bounce: 0.2 }}>
              {[5, 9, 13, 9, 5].map((h, i) => <i key={i} style={{ height: h }} />)}</motion.span>}</AnimatePresence>
      </motion.button>
    </motion.form>
  );
}

// ------------------------------------------------------------------ ARR movement
// Geometry is the Figma "Chart · ARR by month" frame: 803 × 285, baseline y 266.7, 10.68 px per $1M,
// bars 39.8 wide on a 62.55 pitch starting at x 63.1.
function ArrChart({ M, p, onOpen, big, plotH }) {
  const { E, spread } = M.ctx;
  const [mode, setMode] = useState("bars");
  const [hov, setHov] = useGraceHover(M.hover.grace * 1000);
  const m = useSpringTo(mode === "line" ? 1 : 0, M.chart.morph);
  const svgRef = useRef(null);
  // full-width card (1119): Figma stretched the 803 plot to 1079 — x axis widens, bars keep their 39.8 width
  const Wv = 1079, Hv = plotH || 285, base = Hv - 18.3, k = (base - 53) / 20, gx = 52; // plotH: a shorter plot (leadership's hero), same $20M–$40M range
  const Y = (v) => base - (v - 20) * k;
  const KX = (1079 - 51) / (803 - 51), pitch = 62.55 * KX, bw = 39.8, bx = (i) => 51 + (63.1 + 19.9 + 62.55 * i - 51) * KX - 19.9;
  const cx = (i) => bx(i) + bw / 2;
  // grid lays the stage → months rise in order, each landing with a small settle → plan line draws across → projections trace in
  const barsP = win(p, 0.06, 0.72), planP = E(win(p, 0.6, 0.92)), projP = win(p, 0.76, 1);
  const rise = (i) => {
    const t = stag(barsP, i, 12, spread);
    const settle = 0.045 * Math.sin(Math.PI * clamp((t - 0.55) / 0.45)) * (1 - clamp((t - 0.55) / 0.45)) ; // land, lift a hair, settle
    return { g: clamp(E(t) + settle, 0, 1.05), t };
  };
  const lineDraw = clamp((m - 0.3) / 0.7);
  const linePts = ARR.slice(0, 10).map((v, i) => [cx(i), Y(v)]);
  const projPts = [[cx(9), Y(ARR[9])], [cx(10), Y(ARR[10])], [cx(11), Y(ARR[11])]];
  const pathD = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("");
  const L = linePts.reduce((s, pt, i) => (i ? s + Math.hypot(pt[0] - linePts[i - 1][0], pt[1] - linePts[i - 1][1]) : 0), 0);
  const onMove = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * Wv, y = ((e.clientY - r.top) / r.height) * Hv;
    const i = Math.floor((x - (bx(0) - (pitch - bw) / 2)) / pitch);
    if (!(i >= 0 && i < 12)) { setHov(null); return; }
    // only on the mark itself: the bar (a little slack above its top), or near the point in the line view
    const top = Y(ARR[i]), onX = true; // the whole column counts across: no dead gap between bars
    const on = m >= 0.5 ? Math.abs(x - cx(i)) <= 18 && Math.abs(y - top) <= 18 : onX && y >= top - 10 && y <= base + 2;
    setHov(on ? i : null);
  };
  const stripes = []; for (let x = bx(0) + 2; x < cx(9); x += 4) stripes.push(x);
  const areaD = pathD(linePts) + `L${cx(9)} ${base}L${cx(0)} ${base}Z`;
  // bar with 3px top corners, morphing into a 7px dot
  const barPath = (x, y, w, h, r, rb = 0) => {
    r = Math.min(r, w / 2, h / 2); rb = Math.min(rb, w / 2, h / 2);
    const k = 0.5523; // arc-accurate corners, so at w = h = 2r the shape is a true circle
    return `M${x} ${y + h - rb}V${y + r}C${x} ${y + r - r * k} ${x + r - r * k} ${y} ${x + r} ${y}H${x + w - r}C${x + w - r + r * k} ${y} ${x + w} ${y + r - r * k} ${x + w} ${y + r}V${y + h - rb}C${x + w} ${y + h - rb + rb * k} ${x + w - rb + rb * k} ${y + h} ${x + w - rb} ${y + h}H${x + rb}C${x + rb - rb * k} ${y + h} ${x} ${y + h - rb + rb * k} ${x} ${y + h - rb}Z`;
  };
  const tipI = hov;
  // column highlight: slides between bars with the band easing, but appears in place on first hover
  const bandI = useRef(0), bandPrev = useRef(null), bandJump = useRef(false);
  bandJump.current = bandPrev.current == null && hov != null;
  const bandPad = 8;
  if (hov != null) bandI.current = hov;
  bandPrev.current = hov;
  return (
    <div className="card arr">
      <div className="surface">
        <div className="card-head">
          <h2>ARR movement</h2>
          <span className="card-head-r"><Seg value={mode} onChange={setMode} options={[["bars", "Bars"], ["line", "Line"]]} M={M} id="arrmode" />
            {onOpen && <button type="button" className="ibtn arr-open" aria-label="Open ARR movement" title="Open ARR movement" onClick={() => onOpen(null)}><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" /></svg></button>}</span>
        </div>
        {big && <div className="arr-big"><b>{big[0]}</b><span>{big[1]}</span></div>}
        <div className="arr-plot">
          <svg ref={svgRef} viewBox={`0 0 ${Wv} ${Hv}`} onPointerMove={onMove} onPointerLeave={() => setHov(null)} role="img" aria-label="Ending ARR by month against the $40.03M plan">
            <defs><clipPath id="arr-area"><path d={areaD} /></clipPath><clipPath id="arr-sweep"><rect x="0" y="0" width={bx(0) + (cx(9) - bx(0) + 30) * lineDraw} height={Hv} /></clipPath></defs>
            {[20, 25, 30, 35, 40].map((v, i) => (
              <g key={v} opacity={stag(win(p, 0, 0.35), i, 5, 0.6)}>
                {v !== 40 && <line x1={gx} x2={Wv} y1={Y(v) + 0.25} y2={Y(v) + 0.25} stroke={v === 20 ? C.edge : C.line} strokeWidth="0.5" />}
                <text x={40} y={Y(v) + 4} textAnchor="end" fontSize="11.7" fontWeight="500" fill={C.mute}>{`$${v}M`}</text>
              </g>
            ))}
            <line x1={gx} x2={lerp(gx, Wv, planP)} y1={Y(40.03)} y2={Y(40.03)} stroke={C.coral} strokeWidth="1" strokeDasharray="0.1 2.6" strokeLinecap="round" />
            <text x={57.4} y={Y(40.03) - 7.5} fontSize="11.7" fontWeight="600" fill={C.coral} opacity={planP}>Plan $40.03M</text>
            {/* line: a guide that drops from the point to the baseline */}
            <motion.line x1={0} x2={0} y1={0} stroke={C.navy} strokeWidth="0.75" strokeDasharray="2 2" initial={false}
              animate={{ x: cx(bandI.current), y2: hov != null && m >= 0.5 ? base - Y(ARR[bandI.current]) : 0, opacity: hov != null && m >= 0.5 ? 1 : 0 }}
              style={{ y: Y(ARR[bandI.current]) }}
              transition={{ x: bandJump.current ? { duration: 0 } : toMotion(M.hover.band), y2: toMotion(M.hover.band), opacity: { duration: 0.2 } }} />
            <g clipPath="url(#arr-sweep)" opacity={m}>
              <g clipPath="url(#arr-area)">{stripes.map((x) => <line key={x} x1={x} x2={x} y1={Y(41)} y2={base} stroke={C.navyFill} strokeOpacity="0.45" strokeWidth="0.5" />)}</g>
            </g>
            <path d={pathD(linePts)} fill="none" stroke={C.navy} strokeWidth="1.5" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - lineDraw)} />
            <path d={pathD(projPts)} fill="none" stroke={C.navy} strokeWidth="1" strokeDasharray="0.1 2.6" strokeLinecap="round" opacity={clamp((lineDraw - 0.85) / 0.15)} />
            <g filter="url(#grain)">
              {ARR.slice(0, 10).map((v, i) => {
                const { g, t } = rise(i);
                const h = (base - Y(v)) * g;
                const D = 9; // line-mode point: a true 9px circle
                const w = lerp(bw * lerp(0.55, 1, E(clamp(t * 2.2))), D, m), hh = lerp(h, D, m);
                const y = lerp(base - h, Y(v) - D / 2, m);
                return <path key={i} d={barPath(cx(i) - w / 2, y, w, hh, lerp(3, D / 2, m), lerp(0, D / 2, m))} stroke={C.paper} strokeWidth={1.5 * m} fill={hov === i && m < 0.5 ? mix(i === 9 ? "#7f9bb2" : C.navyFill, C.paper, 0.55) : i === 9 ? "#7f9bb2" : C.navyFill} style={{ transition: "fill .2s" }} opacity={(hov != null && hov !== i && m < 0.5 ? 0.45 : 1) * clamp(t * 4)} />;
              })}
            </g>
            {/* hovering a bar (bars view): it turns into what built it — retained base, then New and Expansion stacked to the
                top, and what was lost (Churn, Downgrade) as a cap above it, so the cap's top is where the month would have ended */}
            <AnimatePresence>
              {hov != null && hov <= 9 && m < 0.5 && (() => {
                // the month's movement sits on the baseline and builds upward — New, Expansion, then the losses — and the rest
                // of the bar above it goes light
                const d = MOVES[hov], x = cx(hov) - bw / 2, h = (v) => v * k, gap = 0.6, T = toMotion(M.hover.band);
                let y0 = base; const segs = [];
                for (const [key, v] of [["new", d.new], ["exp", d.exp], ["churn", d.churn], ["down", d.down]]) { segs.push({ key, y: y0 - h(v), hh: h(v), c: MOVE_C[key] }); y0 -= h(v); }
                return (
                  <motion.g key={`mv-${hov}`} pointerEvents="none" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
                    {segs.map((g, n) => (
                      <motion.rect key={g.key} x={x} width={bw} fill={g.c} initial={{ y: g.y + g.hh, height: 0 }} animate={{ y: g.y, height: Math.max(0, g.hh - gap) }}
                        transition={{ ...T, delay: n * 0.06 }} />
                    ))}
                  </motion.g>
                );
              })()}
            </AnimatePresence>
            <AnimatePresence>
              {hov != null && m >= 0.5 && (
                <motion.g key="pt" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1, x: cx(hov), y: Y(ARR[hov]) }} exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ default: toMotion(M.hover.band), opacity: { duration: 0.18 } }} style={{ x: cx(hov), y: Y(ARR[hov]) }} pointerEvents="none">
                  <circle r="13" fill={hov > 9 ? C.navy : hov === 9 ? "#7f9bb2" : C.navyFill} opacity="0.1" />
                  <circle r="6.5" fill={hov > 9 ? C.paper : hov === 9 ? "#7f9bb2" : C.navyFill} stroke={hov > 9 ? C.navy : C.paper} strokeWidth="2" />
                </motion.g>
              )}
            </AnimatePresence>
            {m < 0.5 && ARR.slice(0, 10).map((v, i) => {
              const top = base - (base - Y(v)) * rise(i).g;
              return [25, 30, 35, 40].filter((gv) => Y(gv) > top + 1).map((gv) => (
                <line key={`${i}-${gv}`} x1={cx(i) - bw / 2} x2={cx(i) + bw / 2} y1={Y(gv) + 0.25} y2={Y(gv) + 0.25} stroke={C.paper} strokeWidth="0.75" opacity={(1 - m * 2) * (hov != null && hov !== i ? 0.45 : 1)} />
              ));
            })}
            {ARR.slice(10).map((v, j) => {
              const i = 10 + j; const g = stag(projP, j, 2, 0.4);
              const D = 9, w = lerp(bw, D, m), h = (base - Y(v)) * g;
              return <path key={i} d={barPath(cx(i) - w / 2 + 0.25, lerp(base - h, Y(v) - D / 2, m) + 0.25, w - 0.5, Math.max(0, lerp(h, D, m) - 0.25), lerp(3, D / 2, m), lerp(0, D / 2, m))} fill={C.paper} stroke={C.navy} strokeWidth="0.6" strokeDasharray="0.1 2.05" strokeLinecap="round" opacity={hov != null && hov !== i ? 0.45 : 1} />;
            })}
            {MONTHS.map((mo, i) => (
              <text key={mo} x={cx(i)} y={base + 13.6} textAnchor="middle" fontSize="10.23" fontWeight={i === 9 ? 600 : 400} fill={hov === i ? C.navy : "#535353"} opacity={win(p, 0, 0.3)}>{mo}</text>
            ))}
          </svg>
          <AnimatePresence>
            {tipI != null && (
              <motion.div className="tip" key="arrtip" onPointerEnter={() => setHov(tipI)} onPointerLeave={() => setHov(null)} initial={{ opacity: 0, scale: 0.9, y: 6, left: `${(cx(tipI) / Wv) * 100}%`, top: `${((lerp(base - (base - Y(ARR[tipI])), Y(ARR[tipI]), m) - 12 - 12 * m) / Hv) * 100}%` }}
                animate={{ opacity: 1, scale: 1, left: `${(cx(tipI) / Wv) * 100}%`, top: `${((lerp(base - (base - Y(ARR[tipI])), Y(ARR[tipI]), m) - 12 - 12 * m) / Hv) * 100}%` }}
                exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.12 } }}
                transition={{ ...toMotion(M.tip), left: toMotion(M.tipFollow), top: toMotion(M.tipFollow) }}
                style={{ x: tipI > 8 ? "-100%" : "-50%", translate: "0 -100%", transformOrigin: tipI > 8 ? "100% 100%" : "50% 100%" }}>
                <TipBody id={tipI}
                  eyebrow={tipI === 9 ? <><i className="tip-sw" style={{ background: "#7f9bb2" }} />{MONTHS_L[tipI]} · month to date</> : tipI > 9 ? <><i className="tip-sw" style={{ border: `0.75px dashed ${C.navy}` }} />{MONTHS_L[tipI]} · plan</> : `${MONTHS_L[tipI]} · ending ARR`}
                  title={`$${ARR[tipI].toFixed(2)}M`}
                  rows={tipI <= 9 ? (() => { const d = MOVES[tipI]; return [
                    { c: MOVE_C.new, k: "New", v: `+${money(d.new)}` },
                    { c: MOVE_C.exp, k: "Expansion", v: `+${money(d.exp)}` },
                    { c: MOVE_C.churn, k: "Churn", v: `−${money(d.churn)}`, vc: MOVE_C.churn },
                    { c: MOVE_C.down, k: "Downgrade", v: `−${money(d.down)}`, vc: MOVE_C.down },
                    { sep: true, c: d.net >= 0 ? MOVE_C.net : MOVE_C.churn, k: "Net new", v: `${d.net >= 0 ? "+" : "−"}${money(d.net)}`, vc: d.net >= 0 ? MOVE_C.net : MOVE_C.churn },
                  ]; })() : [
                    { c: MOVE_C.net, k: "Net new the plan needs", v: `+${money(ARR[tipI] - ARR[tipI - 1])}`, vc: MOVE_C.net },
                    { sep: true, k: "Left to plan", v: money(40.03 - ARR[tipI]) },
                  ]} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="legend">
          <span><i className="sw grain" style={{ backgroundColor: C.navyFill }} />Ending ARR</span>
          <span><i className="sw grain" style={{ backgroundColor: "#7f9bb2" }} />Month to date</span>
          <span><i className="sw sw-proj" />Plan</span>
        </div>
      </div>
      <div className="card-foot"><a className="link" href="#arr-movement" onClick={(e) => { e.preventDefault(); onOpen && onOpen("table"); }}>View as table</a><span>+$10.75M since January · $4.28M left to plan</span></div>
    </div>
  );
}

// ------------------------------------------------------------------ key metrics (2×2) — each opens in place to the full row
const MOVERS_ARR = [["Northwind", "Expansion", "+$184K", C.navy, C.purple], ["Acme Co", "New logo", "+$142K", C.navy, C.navyFill], ["Initech", "New logo", "+$121K", C.navy, C.navyFill], ["Globex", "Churned", "−$96K", C.alert, C.alert]];
const METRICS = [
  { id: "felix", label: "Felix ARR", value: "$12.99M", text: C.navy, fill: C.navyFill, f: 0.995, mark: null, foot: "pace $12.99M of $13.06M", pct: "100%", hover: "$70K to the October target",
    desc: "Yearly revenue from customers on Felix.", owner: "Dustin / Rick", lenses: [["monthly", "Monthly"], ["pace", "Pace"]],
    openFoot: "October to date · $12.99M of the $13.06M target", openPct: "99%", linked: "None yet",
    moversTitle: "Biggest movers this month", movers: [["Acme Co", "Added Felix", "+$210K", C.navy, C.navyFill], ["Northwind", "Added 3 teams", "+$168K", C.navy, C.navyFill], ["Initech", "Added Felix", "+$94K", C.navy, C.navyFill], ["Umbrella", "Removed 1 team", "−$22K", C.alert, C.alert]] },
  { id: "total", label: "Total ARR", value: "$35.75M", text: "#744ccb", fill: "#744ccb", f: 0.893, mark: 37.31 / 40.03, markTitle: "Pace by now · $37.31M", markSub: "You're $1.56M behind it", foot: "of $40.03M plan", pct: "89%", hover: "$4.28M left to plan",
    desc: "The yearly revenue all current customers are paying us right now.", owner: "Rick", lenses: [["monthly", "Monthly"], ["pace", "Pace"], ["segment", "By segment"]],
    openFoot: "October to date · $35.75M of the $36.00M October target", openPct: "99%", linked: "Close $40M ending ARR", moversTitle: "Biggest movers this month", movers: MOVERS_ARR },
  { id: "nrr", label: "NRR", value: "99.9%", text: C.teal, fill: C.teal, f: 0.999, mark: null, foot: "target 100.0%", pct: "100%", hover: "0.1 pts to target",
    desc: "Of the revenue we had from existing customers a year ago, how much we have from them now, including growth.", owner: "Dustin Deno", lenses: [["monthly", "Monthly"], ["segment", "By segment"]],
    openFoot: "October to date · target 100.0%", openPct: "100%", linked: "None yet", moversTitle: "Moved NRR most this month",
    movers: [["Northwind", "Expanded 18%", "+0.4 pts", C.teal, C.teal], ["Initech", "Expanded 9%", "+0.2 pts", C.teal, C.teal], ["Hooli", "Downgraded 12%", "−0.3 pts", C.alert, C.coral], ["Globex", "Churned", "−0.6 pts", C.alert, C.alert]] },
  { id: "netnew", label: "Net new ARR", value: "$1.60M", text: C.coral, fill: C.coral, f: 1.6 / 1.87, mark: 1.78 / 1.87, markTitle: "Pace by now · $1.78M", markSub: "You're $180K behind it", foot: "pace $1.78M of $1.87M", pct: "86%", hover: "$180K behind pace",
    desc: "New ARR booked this month minus ARR lost to churn and downgrades, across every business line.", owner: "Dustin Deno", lenses: [["monthly", "Monthly"], ["pace", "Pace"], ["segment", "By segment"], ["kind", "By kind"]],
    openFoot: "October to date · pace $1.78M of the $1.87M target", openPct: "86%", linked: "None yet", moversTitle: "Biggest movers this month", movers: MOVERS_ARR },
];
// Company health scoreboard — same open pattern as the home key metrics; closed they show the faint preview chart
const $K1 = (v) => `$${v.toFixed(1)}K`, NUM = (v) => Math.round(v).toLocaleString("en-US"), PCT = (v) => `${v.toFixed(1)}%`, PCT2 = (v) => `${v.toFixed(2)}%`, XX = (v) => `${v.toFixed(1)}x`;
const $M = (v) => (v < 10 ? `$${v.toFixed(2)}M` : `$${v.toFixed(1)}M`);
const $Mf = (v) => (v === 0 ? "$0" : `$${+v.toFixed(2)}M`);
// ARR movement's own three numbers: where October is, what's left to build, and the plan. They open like any Home tile, and
// what they open into is drawn from arr-data.js, the same numbers as the ledger under them (sample data)
const ARR_OPEN_H = 500, LEAD_OPEN_H = 520; // the open chart's height on ARR movement, and on leadership's row of four // the open chart's height on ARR movement
const ARR_TILES = (() => {
  const A = _A26, sum = (k) => A[k][10] + A[k][11], mo = (v) => money(v);
  const $M = (v) => `$${v.toFixed(2)}M`; // two decimals throughout, as the ledger reads
  const ends = A.end.slice(4, 10), left = A.end[11] - A.end[9];
  const mid = arrData("mid", "2026"), small = arrData("small", "2026");
  const pctOf = (a, t) => `${((a / t) * 100).toFixed(1)}%`;
  const base = { text: C.navy, fill: C.navyFill, mark: null, owner: "Rick", linked: "Close $40M ending ARR", keepLinked: true, secondary: "Pin to Home" };
  return {
    "arr-oct": { ...base, id: "arr-oct", act: { l: `Close the last ${mo(OCT_TARGET - A.end[9])} with Orin`, q: `@Orin October is at ${$M(A.end[9])}, ${mo(OCT_TARGET - A.end[9])} short of the ${$M(OCT_TARGET)} target. What closes it by Oct 31?` }, label: "October to date", value: $M(A.end[9]), f: A.end[9] / OCT_TARGET, foot: `of the ${$M(OCT_TARGET)} October target`, pct: `${Math.round((A.end[9] / OCT_TARGET) * 100)}%`, hover: `${mo(OCT_TARGET - A.end[9])} to the October target`,
      desc: "Ending ARR so far this month, all accounts. September is the latest close; October moves all day until it closes.",
      lenses: [["monthly", "Monthly"], ["kind", "What moved it"], ["segment", "By segment"]], openFoot: `October to date · ${$M(A.end[9])} of the ${$M(OCT_TARGET)} October target`, openPct: `${Math.round((A.end[9] / OCT_TARGET) * 100)}%`,
      moversTitle: "What moved October so far", movers: [
        ["New ARR", "", `+${mo(A.new[9])}`, C.navy, MOVE_C.new], ["Expansion", "", `+${mo(A.exp[9])}`, C.navy, MOVE_C.exp],
        ["Churn", "", `−${mo(A.churn[9] / 1000)}`, MOVE_C.churn, MOVE_C.churn], ["Downgrade", "", `−${mo(A.down[9] / 1000)}`, MOVE_C.down, MOVE_C.down],
        ["Net new", "since Sep 30", `+${mo(A.net[9])}`, MOVE_C.net, MOVE_C.net]],
      series: { vals: ends, lo: 25, hi: 37, ticks: [25, 30, 35], fmt: (v) => `$${v}M`, valFmt: $M, tgt: OCT_TARGET, tLabel: `Target ${$M(OCT_TARGET)}`, start: A.end[8], now: A.end[9], plo: 34, phi: 36.4, pticks: [34, 35, 36], pfmt: $Mf,
        segs: [["Medium+", mid.end[9], pctOf(mid.end[9], A.end[9])], ["Ind & Small", small.end[9], pctOf(small.end[9], A.end[9])]], tot: A.end[9], kind: NET_KIND },
      preview: { kind: "bars", vals: ends, lo: 25, hi: 37, ticks: [30, 35] } },
    "arr-left": { ...base, id: "arr-left", act: { l: `Plan the ${$M(left)} with Orin`, q: `@Orin December’s plan needs ${$M(left)} more over November and December, about ${$M(left / 2)} a month. Only September added that much this year. What gets us there?` }, label: "Left to build", value: $M(left), f: 1, foot: `over Nov and Dec, about ${$M(left / 2)} a month`, pct: "", hover: `Only September has added more than ${$M(left / 2)} this year`,
      desc: "What December's plan still needs on top of where October is today: the plan's new ARR and expansion for November and December, less what it expects to lose.",
      lenses: [["monthly", "Net new a month"], ["segment", "By segment"]], keyMonthly: [["Net new", "sw"], ["Month to date", "mtd"], ["Needed a month", "dot"]], openFoot: `Net new by month against the ${$M(left / 2)} a month the plan needs`, openPct: "",
      moversTitle: "How the plan builds it", movers: [
        ["New ARR", "Nov + Dec", `+${mo(sum("new"))}`, C.navy, MOVE_C.new], ["Expansion", "Nov + Dec", `+${mo(sum("exp"))}`, C.navy, MOVE_C.exp],
        ["Revenue loss", "churn + downgrade", `−${mo(sum("loss"))}`, MOVE_C.churn, MOVE_C.churn], ["Left to build", "", mo(left), MOVE_C.net, MOVE_C.net]],
      series: { vals: NET_MAYOCT, lo: 0, hi: 2.4, ticks: [0, 1, 2], fmt: (v) => (v === 0 ? "$0" : `$${v}M`), valFmt: $M, tgt: left / 2, tLabel: `Needed a month ${$M(left / 2)}`,
        segs: [["Medium+", mid.end[11] - mid.end[9], pctOf(mid.end[11] - mid.end[9], left)], ["Ind & Small", small.end[11] - small.end[9], pctOf(small.end[11] - small.end[9], left)]], tot: left },
      preview: { kind: "bars", vals: NET_MAYOCT, lo: 0, hi: 2.4, ticks: [1, 2] } },
    "arr-dec": { ...base, id: "arr-dec", act: { l: "Pressure-test the plan with Orin", q: `@Orin December’s plan is ${$M(A.end[11])}. We’re at ${$M(A.end[9])}. Does the plan hold at the rate we’ve been adding?` }, label: "December plan", value: $M(A.end[11]), f: A.end[9] / A.end[11], foot: "from the Target Plan", pct: `${Math.round((A.end[9] / A.end[11]) * 100)}%`, hover: `${mo(left)} left to plan`,
      desc: "Ending ARR the Target Plan calls for on December 31, all accounts. An edit to the plan is read here straight away.",
      lenses: [["monthly", "Monthly"], ["pace", "Pace"], ["segment", "By segment"]], openFoot: `${$M(A.end[9])} so far of the ${$M(A.end[11])} December plan`, openPct: `${Math.round((A.end[9] / A.end[11]) * 100)}%`,
      moversTitle: "The plan, month by month", movers: [
        ["October", "target", $M(OCT_TARGET), C.navy, C.navyFill], ["November", "plan", $M(A.end[10]), C.navy, C.navyFill], ["December", "plan", $M(A.end[11]), C.navy, C.navyFill],
        ["Felix in December", `${A.share[11]}% of ARR`, $M(A.felix[11]), C.purple, C.purple]],
      series: { vals: ends, lo: 25, hi: 41, ticks: [25, 30, 35, 40], fmt: (v) => `$${v}M`, valFmt: $M, tgt: A.end[11], tLabel: `Plan ${$M(A.end[11])}`, start: A.start, now: A.end[9], plo: 24, phi: 41, pticks: [25, 30, 35, 40], pfmt: $Mf,
        segs: [["Medium+", mid.end[11], pctOf(mid.end[11], A.end[11])], ["Ind & Small", small.end[11], pctOf(small.end[11], A.end[11])]], tot: A.end[11] },
      preview: { kind: "bars", vals: ends, lo: 25, hi: 41, ticks: [30, 40] } },
  };
})();
// ARR movement as one of leadership's tiles, the same size as the rest: what's left to build to December's plan, opening on
// ending ARR by month against the plan (the full ledger is the ARR movement page)
ARR_TILES["arr-move"] = { ...ARR_TILES["arr-dec"], id: "arr-move", label: "ARR movement", value: ARR_TILES["arr-left"].value, foot: "left to build", pct: "", openPct: "", openFoot: `left to build to the ${ARR_TILES["arr-dec"].value} December plan`,
  hover: ARR_TILES["arr-left"].hover, act: ARR_TILES["arr-left"].act, owner: "Beyonce" };
const CH_METRICS = [
  { id: "ch-total", label: "Total ARR", value: "$35.75M", text: C.navy, fill: C.navyFill, foot: "of $40.03M plan", pct: "89%", hover: "$4.28M left to plan",
    desc: "The yearly revenue all current customers are paying us right now.", owner: "Rick", lenses: [["monthly", "Monthly"], ["pace", "Pace"], ["segment", "By segment"]],
    openFoot: "October to date · $35.75M of the $36.00M October target", openPct: "99%", linked: "Close $40M ending ARR", moversTitle: "Biggest movers this month", movers: MOVERS_ARR, secondary: "Pin to Home",
    series: { vals: [29.5, 30.6, 31.3, 32.06, 34.15, 35.75], lo: 25, hi: 37, ticks: [25, 30, 35], fmt: (v) => `$${v}M`, valFmt: $M, tgt: 36, tLabel: "Target $36.00M", start: 34.15, now: 35.75, plo: 34, phi: 36.4, pticks: [34, 35, 36], pfmt: $Mf,
      segs: [["Medium+", 31.1, "87.0%"], ["Ind & Small", 4.65, "13.0%"], ["Unknown team size", 0, "0.0%"]], tot: 35.75 } },
  { id: "ch-net", label: "Net new ARR", value: "$1.60M", text: C.navy, fill: C.navyFill, foot: "pace $1.78M of $1.87M", pct: "86%", hover: "$180K behind pace",
    desc: "New ARR booked this month minus ARR lost to churn and downgrades, across every business line.", owner: "Dustin Deno", lenses: [["monthly", "Monthly"], ["pace", "Pace"], ["segment", "By segment"], ["kind", "By kind"]],
    openFoot: "October to date · pace $1.78M of the $1.87M target", openPct: "86%", linked: "None yet", moversTitle: "Biggest movers this month", movers: MOVERS_ARR, secondary: "Pin to Home",
    series: { vals: NET_MAYOCT, lo: 0, hi: 2.4, ticks: [0, 1, 2], fmt: (v) => (v === 0 ? "$0" : `$${v}M`), valFmt: $M, tgt: 1.87, tLabel: "Target $1.87M", start: 0, now: 1.6, plo: 0, phi: 2.1, pticks: [0, 1, 2], pfmt: $Mf,
      segs: [["Medium+", 1.39, "86.9%"], ["Ind & Small", 0.21, "13.1%"], ["Unknown team size", 0, "0.0%"]], tot: 1.6,
      kind: NET_KIND } },
  { id: "ch-nrr", label: "NRR", value: "99.9%", text: C.navy, fill: C.navyFill, foot: "target 100.0%", pct: "100%", hover: "0.1 pts to target",
    desc: "Of the revenue we had from existing customers a year ago, how much we have from them now, including growth.", owner: "Dustin Deno", lenses: [["monthly", "Monthly"]],
    openFoot: "October to date · target 100.0%", openPct: "100%", linked: "None yet", moversTitle: "Moved NRR most this month", secondary: "Pin to Home",
    movers: [["Northwind", "Expanded 18%", "+0.4 pts", C.navy, C.navyFill], ["Initech", "Expanded 9%", "+0.2 pts", C.navy, C.navyFill], ["Hooli", "Downgraded 12%", "−0.3 pts", C.alert, C.coral], ["Globex", "Churned", "−0.6 pts", C.alert, C.alert]],
    series: { line: true, vals: [99.1, 99.8, 100.2, 99.4, 100.7, 99.9], lo: 98.5, hi: 101.5, ticks: [99, 100, 101], fmt: (v) => `${v}%`, valFmt: PCT, unit: "pts", tgt: 100.0, tLabel: "Target 100.0%" } },
  { id: "ch-grr", label: "GRR", value: "97.7%", text: C.navy, fill: C.navyFill, foot: "pace 97.07% of 96.93%", pct: "101%", hover: "0.77 pts above target",
    desc: "Of the revenue we had from existing customers a year ago, how much we kept, ignoring growth.", owner: "PD / Rick", lenses: [["monthly", "Monthly"]],
    openFoot: "October to date · target 96.93%", openPct: "101%", linked: "1 linked", moversTitle: "Moved GRR most this month", secondary: "Pin to Home",
    movers: [["Globex", "Churned", "−0.6 pts", C.alert, C.alert], ["Hooli", "Downgraded 12%", "−0.3 pts", C.alert, C.coral], ["Umbrella", "Downgraded 4%", "−0.1 pts", C.alert, C.coral]],
    series: { line: true, vals: [97.2, 97.5, 97.0, 97.4, 97.9, 97.7], lo: 96.5, hi: 98.5, ticks: [97, 98], fmt: (v) => `${v}%`, valFmt: PCT, unit: "pts", tgt: 96.93, tLabel: "Target 96.93%" } },
  { id: "ch-felix", label: "Felix ARR", value: "$12.99M", text: C.navy, fill: C.navyFill, foot: "pace $12.99M of $13.06M", pct: "100%", hover: "$70K to the October target",
    desc: "Yearly revenue from customers on Felix.", owner: "Dustin / Rick", lenses: [["monthly", "Monthly"], ["pace", "Pace"]],
    openFoot: "October to date · $12.99M of the $13.06M target", openPct: "99%", linked: "None yet", moversTitle: "Biggest movers this month", secondary: "Pin to Home",
    movers: [["Acme Co", "Added Felix", "+$210K", C.navy, C.navyFill], ["Northwind", "Added 3 teams", "+$168K", C.navy, C.navyFill], ["Initech", "Added Felix", "+$94K", C.navy, C.navyFill], ["Umbrella", "Removed 1 team", "−$22K", C.alert, C.alert]],
    series: { vals: [5.1, 6.4, 7.9, 9.42, 11.55, 12.99], lo: 0, hi: 15, ticks: [0, 5, 10, 15], fmt: (v) => (v === 0 ? "$0" : `$${v}M`), valFmt: $M, tgt: 13.06, tLabel: "Target $13.06M", start: 11.55, now: 12.99, plo: 11.5, phi: 13.3, pticks: [12, 13], pfmt: $Mf } },
  { id: "ch-avg", label: "Avg ARR per account", value: "$13.1K", text: C.navy, fill: C.navyFill, foot: "target $12.8K", pct: "102%", hover: "$300 above target",
    desc: "Total ARR divided by paying accounts.", owner: "Rick", lenses: [["monthly", "Monthly"]],
    openFoot: "October to date · target $12.8K", openPct: "102%", linked: "None yet", moversTitle: "Moved the average most", secondary: "Pin to Home",
    movers: [["Northwind", "Expanded", "+$184K", C.navy, C.navyFill], ["Acme Co", "New logo", "+$142K", C.navy, C.navyFill], ["Globex", "Churned", "−$96K", C.alert, C.alert]],
    series: { vals: [12.4, 12.6, 12.7, 12.9, 13.0, 13.1], lo: 11, hi: 13.6, ticks: [11, 12, 13], fmt: (v) => `$${v}K`, valFmt: $K1, tgt: 12.8, tLabel: "Target $12.8K" } },
  { id: "ch-pay", label: "Paying accounts", value: "2,717", text: C.navy, fill: C.navyFill, foot: "target 2,800", pct: "97%", hover: "83 to target",
    desc: "How many customers are paying us today.", owner: "Rick", lenses: [["monthly", "Monthly"]],
    openFoot: "October to date · target 2,800", openPct: "97%", linked: "None yet", moversTitle: "What moved it this month", secondary: "Pin to Home",
    movers: [["New logos", "Signed", "+61", C.navy, C.navyFill], ["Reactivated", "Came back", "+3", C.navy, C.navyFill], ["Churned", "Cancelled", "−38", C.alert, C.alert], ["Merged", "Consolidated", "−2", C.alert, C.coral]],
    series: { vals: [2610, 2635, 2660, 2680, 2700, 2717], lo: 2500, hi: 2850, ticks: [2500, 2600, 2700, 2800], fmt: NUM, valFmt: NUM, tgt: 2800, tLabel: "Target 2,800" } },
  { id: "ch-gtm", label: "ARR to GTM comp", value: "31.3x", text: C.navy, fill: C.navyFill, foot: "target 26.0x", pct: "120%", hover: "5.3x above target",
    desc: "ARR booked for every dollar of go-to-market compensation.", owner: "Dustin Deno", lenses: [["monthly", "Monthly"]],
    openFoot: "October to date · target 26.0x", openPct: "120%", linked: "None yet", moversTitle: "What drives it", secondary: "Pin to Home",
    movers: [["Booked ARR", "October to date", "$1.55M", C.navy, C.navyFill], ["GTM comp", "October", "$49.5K", C.navy, C.purple]],
    series: { line: true, vals: [27.8, 28.9, 29.6, 30.2, 30.8, 31.3], lo: 24, hi: 33, ticks: [25, 28, 31], fmt: (v) => `${v}x`, valFmt: XX, unit: "x", tgt: 26.0, tLabel: "Target 26.0x" } },
];
function LensChart({ m, lens, p }) {
  if (m.series) {
    const S = m.series, col = m.fill;
    if (lens === "pace") return <PaceLine p={p} color={col} start={S.start} tgt={S.tgt} now={S.now} lo={S.plo} hi={S.phi} ticks={S.pticks} fmt={S.pfmt || S.valFmt} wob={(S.phi - S.plo) * 0.015} />;
    if (lens === "segment") return <Segments p={p} color={col} rows={S.segs} scale={(v) => v / S.tot} fmt={S.valFmt} />;
    if (lens === "kind") return <ByKind p={p} data={S.kind} />;
    if (S.line) return <MonthlyLine p={p} color={col} vals={S.vals} lo={S.lo} hi={S.hi} ticks={S.ticks} tgt={S.tgt} tLabel={S.tLabel} fmt={S.fmt} valFmt={S.valFmt} unit={S.unit} />;
    return <MonthlyBars p={p} color={col} vals={S.vals} lo={S.lo} hi={S.hi} ticks={S.ticks} fmt={S.fmt} tgt={S.tgt} tLabel={S.tLabel} valFmt={S.valFmt} />;
  }
  const col = m.id === "netnew" ? C.navyFill : m.fill;
  if (m.id === "nrr") return lens === "segment"
    ? <Segments p={p} color={col} rows={[["Medium+", 100.3], ["Ind & Small", 97.5]]} scale={(v) => (v - 95) / 10} fmt={(v) => `${v.toFixed(1)}%`} tick={(100 - 95) / 10} tickLabel="Target 100.0%" note="Bars run 95% → 105% · hover a dot for the gap to target" />
    : <MonthlyLine p={p} color={col} vals={[99.1, 99.8, 100.2, 99.4, 100.7, 99.9]} lo={98.5} hi={101.5} ticks={[99, 100, 101]} tgt={100} tLabel="Target 100.0%" />;
  const S = {
    felix: { vals: [5.1, 6.4, 7.9, 9.42, 11.55, 12.99], lo: 0, hi: 15, ticks: [0, 5, 10, 15], tgt: 13.06, start: 11.55, now: 12.99, plo: 11.5, phi: 13.3, pticks: [12, 13] },
    total: { vals: [29.5, 30.6, 31.3, 32.06, 34.15, 35.75], lo: 25, hi: 37, ticks: [25, 30, 35], tgt: 36, start: 34.15, now: 35.75, plo: 34, phi: 36.4, pticks: [34, 35, 36], segs: [["Medium+", 31.10, "87.0%"], ["Ind & Small", 4.65, "13.0%"], ["Unknown team size", 0, "0.0%"]], tot: 35.75 },
    netnew: { vals: NET_MAYOCT, lo: 0, hi: 2.4, ticks: [0, 1, 2], tgt: 1.87, start: 0, now: 1.6, plo: 0, phi: 2.1, pticks: [0, 1, 2], segs: [["Medium+", 1.39, "86.9%"], ["Ind & Small", 0.21, "13.1%"], ["Unknown team size", 0, "0.0%"]], tot: 1.6 },
  }[m.id];
  const fmt = (v) => (v === 0 ? "$0" : `$${v}M`);
  if (lens === "pace") return <PaceLine p={p} color={col} start={S.start} tgt={S.tgt} now={S.now} lo={S.plo} hi={S.phi} ticks={S.pticks} fmt={(v) => (v === 0 ? "$0" : `$${+v.toFixed(2)}M`)} wob={(S.phi - S.plo) * 0.015} />;
  if (lens === "segment") return <Segments p={p} color={col} rows={S.segs} scale={(v) => v / S.tot} fmt={(v) => (v ? `$${v.toFixed(2)}M` : "$0")} />;
  if (lens === "kind") return <ByKind p={p} data={NET_KIND} />;
  return <MonthlyBars p={p} color={col} vals={S.vals} lo={S.lo} hi={S.hi} ticks={S.ticks} fmt={fmt} tgt={S.tgt} tLabel={`Target ${"$" + S.tgt.toFixed(2)}M`} valFmt={$M} />;
}
const LENS_KEY = {
  monthly: (m) => m.keyMonthly ? m.keyMonthly : m.series && m.series.line ? [[m.label, "line"], ["Target", "dot"]] : m.id === "nrr" ? [["NRR", "line"], ["Target", "dot"]] : [["Month end", "sw"], ["Month to date", "mtd"], ["Target", "dot"]],
  pace: () => [["Actual", "line"], ["Pace to target", "pace"]],
  segment: () => null,
  kind: () => [["New business", "nb"], ["Expansion", "ex"], ["Churn · taken back", "churn"]],
};
function LensKey({ m, lens }) {
  const items = LENS_KEY[lens](m); if (!items) return null;
  const col = m.id === "netnew" ? C.navyFill : m.fill;
  const mark = (k) => k === "sw" ? <i className="grain" style={{ background: col }} /> : k === "mtd" ? <i className="grain" style={{ background: mix(col, "#ffffff", 0.45) }} />
    : k === "line" ? <i className="ln" style={{ background: col }} /> : k === "pace" ? <i className="ln" style={{ background: C.coral }} /> : k === "dot" ? <i className="dt" />
    : k === "nb" ? <i className="grain" style={{ background: C.navyFill }} /> : k === "ex" ? <i className="grain" style={{ background: C.purple }} /> : <i className="ch" />;
  return <div className="mo-key">{items.map(([t, k]) => <span key={t}>{mark(k)}{t}</span>)}</div>;
}

// One element per metric. Closed it sits in its grid slot; opened, the very same element grows to fill the row.
// Its name, number, bar and footer are the same nodes the whole time — they only change size, so nothing ever cross-fades.
// a metric's chart in a chat card (for page charts with no chat card of their own): the same six months the open tile shows
function CarryPlot({ m, w, p }) {
  return <GeoCtx.Provider value={geo(w, 190)}>{m.chat ? <ChatVisual c={m.chat} p={p} /> : <LensChart m={m} lens="monthly" p={p} />}</GeoCtx.Provider>;
}
function MetricTile({ m, p, M, rect, full, open, dim, top, introStyle, onOpen, onClose, closed, onGo, vSize = 43.74, vTop, bare, enter, note, lifted, onGrab }) {
  const { E } = M.ctx;
  useGoalStore(); const gw = m.moves ? Math.min(goalRw(), Math.max(RW.min, full.width - 380)) : 0; // a goal's right side, as wide as she dragged it
  const [hov, setHov] = useState(false);
  const lens0 = (m.lenses && m.lenses[0] && m.lenses[0][0]) || "monthly"; // a tile opens on its first view
  const [lens, setLens] = useState(lens0);
  const [tip, setTip] = useState(false);
  const [markHov, setMarkHov] = useState(false);
  const ref = useRef(null);
  useEffect(() => { if (!open) { setLens(lens0); setTip(false); } }, [open]);
  useEffect(() => {
    if (!open) return;
    const k = (e) => e.key === "Escape" && onClose();
    const d = (e) => { if (ref.current && !ref.current.contains(e.target) && !e.target.closest('[class*="dialkit"], [aria-label="Collapse sidebar"]')) onClose(); }; // folding the sidebar isn't leaving the chart
    window.addEventListener("keydown", k); document.addEventListener("pointerdown", d);
    return () => { window.removeEventListener("keydown", k); document.removeEventListener("pointerdown", d); };
  }, [open]);
  const cp = useReplay(open ? m.id + lens : "closed", M.open.draw, { delay: lens === "monthly" ? M.open.contentDelay : 0.05, reduced: REDUCED });
  const fillP = E(win(p, 0, 0.7)), dotP = win(p, 0.65, 0.95);
  const pop = dotP <= 0 ? 0 : dotP >= 1 ? 1 : 1 + Math.sin(dotP * Math.PI) * 0.35 * (1 - dotP);
  const T = open ? toMotion(M.open.expand) : toMotion(M.open.collapse);
  const inT = { ...toMotion(M.open.content), delay: M.open.contentDelay };
  const out = { opacity: 0, transition: { duration: 0.1 } };
  const item = { hidden: { opacity: 0, y: 6, filter: "blur(3px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)" } };
  return (
    <motion.div ref={ref} className={`mtile${open ? " is-open" : ""}${bare ? " is-bare" : ""}${m.moves ? " is-goal" : ""}`} data-id={m.id} role={open ? "dialog" : "button"} tabIndex={open ? -1 : 0} aria-label={open ? m.label : `Open ${m.label}`}
      initial={enter ? { ...rect, opacity: 0, scale: 0.9 } : false} animate={{ ...(open ? full : rect), opacity: dim ? 0 : 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}
      transition={lifted ? { duration: 0 } : enter ? { default: T, opacity: { duration: 0.35, delay: 0.42 }, scale: { type: "spring", visualDuration: 0.55, bounce: 0.14, delay: 0.42 } } : { default: T, opacity: { duration: 0.2, delay: dim ? 0 : 0.1 } }}
      style={{ zIndex: top ? 6 : hov ? 4 : 1, pointerEvents: dim ? "none" : "auto", "--tw": `${rect.width}px` }}
      onPointerDown={onGrab} data-lifted={lifted ? "" : undefined}
      onClick={() => !open && onOpen(m.id)} onKeyDown={(e) => !open && (e.key === "Enter" || e.key === " ") && onOpen(m.id)}
      onPointerEnter={() => setHov(true)} onPointerLeave={() => setHov(false)}>
      <motion.div className="mt-clip" style={introStyle} animate={{ borderRadius: open ? 12 : 8.75 }} transition={T}>
        <div className="mt-body">
          <div className="mt-inner" style={{ width: full.width - 2.18, ...(gw && full.width >= 700 ? { gridTemplateColumns: `minmax(0, 1fr) ${gw}px` } : null) }}>
            <motion.div className="mo-l" initial={false} animate={open ? { paddingTop: 20, paddingLeft: 28 } : { paddingTop: 17.5, paddingLeft: 17.5 }} transition={T}>
              <motion.span className="mo-lab" initial={false} animate={open ? { fontSize: 16, lineHeight: "22px", textDecorationColor: "rgba(84,84,84,1)" } : { fontSize: 14.22, lineHeight: "17px", textDecorationColor: "rgba(84,84,84,0)" }} transition={T}
                onPointerEnter={() => open && setTip(true)} onPointerLeave={() => setTip(false)}>{m.label}</motion.span>
              <motion.span className="mo-v" initial={false} animate={open ? { fontSize: 52, lineHeight: "56px", marginTop: 10, color: m.text } : { fontSize: vSize, lineHeight: `${Math.round(vSize * 1.12)}px`, marginTop: vTop ?? 13.1 + (43.74 - vSize) * 0.6, color: C.navy }} transition={T}>{m.value}</motion.span>
              <AnimatePresence>
                {open && (
                  <motion.div className="mo-chart" style={full && full.height > 430 ? { marginTop: 44 } : undefined} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={out} transition={inT}>
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.div key={lens} className="mo-lens" initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6, filter: "blur(3px)" }} transition={toMotion(M.open.lens)}>
                        {m.chat ? <ChatVisual c={m.chat} p={cp} /> : <>
                        {full && full.height > 430 ? <GeoCtx.Provider value={geo(gw ? Math.max(300, full.width - gw - 54) : 641, Math.round(full.width < 700 && gw ? 200 : Math.min(gw ? 350 : 300, full.height - 270)))}><LensChart m={m} lens={lens} p={cp} /></GeoCtx.Provider> : <LensChart m={m} lens={lens} p={cp} />}
                        <LensKey m={m} lens={lens} /></>}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
            {/* the card's own visual: steps aside while the chart is out, comes back as the card closes */}
            {closed ? (
              <motion.div className="mt-mini" style={{ width: rect.width - 35, ...(bare ? { top: rect.height - 40 } : null), pointerEvents: open ? "none" : "auto" }} initial={false} animate={{ opacity: open ? 0 : 1 }} transition={open ? { duration: 0.15 } : { duration: 0.2, delay: 0.12 }}>
                {closed(hov && !open)}
              </motion.div>
            ) : (
            <motion.div className="mc-bar mt-bar" style={{ width: rect.width - 35, pointerEvents: open ? "none" : "auto" }} initial={false} animate={{ opacity: open ? 0 : 1 }} transition={open ? { duration: 0.15 } : { duration: 0.2, delay: 0.12 }}>
              <div className="mc-fill grain" style={{ width: `${m.f * fillP * 100}%`, backgroundColor: m.barFill || m.fill }} />
              {[25, 50, 75].map((q) => <i key={q} style={{ left: `${q}%` }} />)}
              {m.mark != null && (
                <b style={{ left: `${m.mark * 100}%`, background: m.markFill || m.fill, transform: `scale(${pop * (markHov ? 1.2 : 1)})` }} onPointerEnter={() => setMarkHov(true)} onPointerLeave={() => setMarkHov(false)} onClick={(e) => e.stopPropagation()} />
              )}
            </motion.div>
            )}
            {!closed && m.mark != null && (
              <span className={`mark-tip${markHov && !open ? " is-on" : ""}`} style={{ left: 17.5 + m.mark * (rect.width - 35) }}><b>{m.markTitle}</b><em>{m.markSub}</em></span>
            )}
            <AnimatePresence>
              {open && !m.chat && m.lenses && m.lenses.length > 1 && (
                <motion.div className="mt-seg" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={out} transition={inT} style={{ right: (gw || 420) + 24 }}>
                  <Seg value={lens} onChange={setLens} options={m.lenses} M={M} id={`lens-${m.id}`} small />
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {open && (
                <motion.div className="mo-r" initial="hidden" animate="show" exit={out}
                  variants={{ show: { transition: { delayChildren: M.open.contentDelay + 0.04, staggerChildren: M.open.stagger } } }}>
                  <motion.div className="mo-tools" variants={item} transition={toMotion(M.open.content)}>
                    <span>Company · owned by {m.owner}</span>
                    <AskChartIcon />
                    <PinIcon id={m.id} />
                    <button className="ibtn mo-x" aria-label="Close" onClick={(e) => { e.stopPropagation(); onClose(); }}><svg width="14" height="14" viewBox="0 0 14 14" stroke={C.navy} strokeWidth="1.25" strokeLinecap="round"><path d="M3 3l8 8M11 3 3 11" /></svg></button>
                  </motion.div>
                  {m.moves ? <GoalSide m={m} item={item} T={toMotion(M.open.content)} /> : <>
                  <div className="mo-movers">
                    <motion.h5 variants={item} transition={toMotion(M.open.content)}>{m.moversTitle}</motion.h5>
                    {m.movers.map(([n, k, v, vc, sc]) => (
                      <motion.div className="mo-mv" key={n} variants={item} transition={toMotion(M.open.content)}>
                        <i style={{ background: sc }} /><b>{n}</b><span>{k}</span><em style={{ color: vc }}>{v}</em>
                      </motion.div>
                    ))}
                  </div>
                  <motion.button className="mo-row" variants={item} transition={toMotion(M.open.content)}>
                    <b>Linked goals</b><span>{m.linked}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={C.navy} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 4.5 10 8l-3.5 3.5" /></svg>
                  </motion.button>
                  <div className="mo-fill" />
                  </>}
                  {!m.moves && <motion.div className="mo-acts" variants={item} transition={toMotion(M.open.content)}>
                    {/* already on Home, and the star above says so — no pin button here. A pinned answer goes back to its thread. */}
                    {m.thread ? <motion.button className="btn-pri" whileTap={{ scale: 0.97 }} transition={toMotion(M.hover.press)} onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("north:topic", { detail: m.thread })); }}>Continue in North</motion.button>
                      : m.act ? <motion.button className="btn-pri" whileTap={{ scale: 0.97 }} transition={toMotion(M.hover.press)} onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("north:talk", { detail: { text: m.act.q } })); }}>{m.act.l}</motion.button>
                      : (() => { const ag = laneAgent(m.lane) || laneAgent(m.moversTitle) || "orin", an = (AG_N[ag] || {}).n || "Orin";
                        // the move here is the agent who owns this lane doing the work (asking is the North mark up top)
                        return <motion.button className="btn-pri" whileTap={{ scale: 0.97 }} transition={toMotion(M.hover.press)} onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("north:talk", { detail: { text: `@${an} make a plan for ${m.label}: it's at ${m.value} now. What gets it on pace by the end of the month?` } })); }}>Plan {m.label} with {an}</motion.button>; })()}
                  </motion.div>}
                </motion.div>
              )}
            </AnimatePresence>
            {/* a goal's two sides share the width as she likes: drag the line between them (double-click puts it back) */}
            {open && gw > 0 && full.width >= 700 && <div className="gq-div" style={{ right: gw - 6 }} role="separator" aria-orientation="vertical" aria-label="Resize the two sides"
              onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); const x0 = e.clientX, r0 = gw, max = full.width - 380;
                const mv = (ev) => setGoalRw(Math.max(RW.min, Math.min(max, r0 - (ev.clientX - x0))));
                const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); document.documentElement.classList.remove("is-resizing"); };
                document.documentElement.classList.add("is-resizing"); addEventListener("pointermove", mv); addEventListener("pointerup", up); }}
              onDoubleClick={(e) => { e.stopPropagation(); setGoalRw(RW.def); }} onClick={(e) => e.stopPropagation()} />}
          </div>
        </div>
        <motion.div className="mt-foot" initial={false} animate={open ? { height: 40, paddingLeft: 28, paddingRight: 28, fontSize: 14, opacity: 1 } : bare ? { height: 0, paddingLeft: 15.3, paddingRight: 15.3, fontSize: 13.12, opacity: 0 } : { height: 33.5, paddingLeft: 15.3, paddingRight: 15.3, fontSize: 13.12, opacity: 1 }} transition={T}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={note && !open ? "n" : hov && !open ? "h" : "c"} style={{ color: (note || hov) && !open ? C.navy : undefined }} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={toMotion(M.hover.spring)}>
              {note && !open ? note : hov && !open ? m.hover : m.foot}
            </motion.span>
          </AnimatePresence>
          <b style={{ color: open ? m.pctColor || m.text : C.navy, transition: "color .3s" }}>{open && m.openPct ? m.openPct : m.pct}</b>
        </motion.div>
      </motion.div>
      <motion.span className="mc-go" initial={false} animate={{ opacity: hov && !open ? 1 : 0, x: hov ? 0 : -4 }} transition={toMotion(M.hover.spring)} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={C.navy} strokeWidth="1.2" strokeLinecap="round"><path d="M5 3h6v6M11 3 4 10" /></svg>
      </motion.span>
      <AnimatePresence>
        {tip && (
          <motion.span className="mo-tip" initial={{ opacity: 0, y: 4, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: 4, transition: { duration: 0.12 } }} transition={toMotion(M.tip)}>
            {m.desc}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
// closed, every Home tile previews the chart it opens into (bars or line), faint until hovered — same as the Company health scoreboard
const PREVIEW = {
  felix: { kind: "bars", vals: [5.1, 6.4, 7.9, 9.42, 11.55, 12.99], lo: 0, hi: 15, ticks: [5, 10] },
  total: { kind: "bars", vals: [29.5, 30.6, 31.3, 32.06, 34.15, 35.75], lo: 25, hi: 37, ticks: [30, 35] },
  nrr: { kind: "line", vals: [99.1, 99.8, 100.2, 99.4, 100.7, 99.9], lo: 98.4, hi: 101.4 },
  netnew: { kind: "bars", vals: NET_MAYOCT, lo: 0, hi: 2.3, ticks: [1, 2] },
};
// a pin becomes a home key-metric tile: Company health scoreboard metrics as they are, heatmap squares built from their metric
// a lane metric on Home says which lane it is ("Outbound demos booked"), except a seat's own tiles, which are its lane already
const SEAT_OWN = (id) => Object.values(SEAT_TILES).some((L) => L.includes(id));
function pinTile(id) {
  if (CHAT_TILES[id]) return CHAT_TILES[id];
  if (ARR_TILES[id]) return ARR_TILES[id];
  if (GOAL_TILES[id]) return GOAL_TILES[id];
  const k = id === "arr" ? "ch-total" : id;
  const ch = CH_METRICS.find((m) => m.id === k);
  if (ch) return { ...ch, f: Math.min(1, (parseFloat(ch.pct) || 0) / 100), mark: null, secondary: "Pin to Home", preview: CARDS[CH_METRICS.indexOf(ch)] };
  const mm = /^(\d+)-(\d+)$/.exec(id); if (!mm) return null;
  const r = +mm[1], c = +mm[2], m = metricFor(r, c), S = m.series;
  if (!S) return null;
  return {
    id, label: m.n.includes(m.lane) || SEAT_OWN(id) ? m.n : `${m.lane} ${/^[A-Z][a-z]/.test(m.n) ? m.n[0].toLowerCase() + m.n.slice(1) : m.n}`, value: m.v, text: C.navy, fill: C.navyFill, f: Math.min(1, (m.p ?? 0) / 100), mark: null,
    foot: m.foot, pct: m.p != null ? m.s : "", pctColor: m.st === "on" ? C.navy : TXT[m.st], hover: m.openFoot,
    desc: m.desc, owner: m.owner, lenses: [["monthly", "Monthly"]], openFoot: m.openFoot, openPct: m.s, linked: "None yet", secondary: "Pin to Home",
    moversTitle: `Rest of the ${m.lane} lane`, movers: m.tiles.filter((_, i) => i !== c).map(([tn, tv, tp]) => [tn, "", tv, C.navy, SC[status(tp)]]),
    preview: { kind: S.line ? "line" : "bars", vals: S.vals, lo: S.lo, hi: S.hi, ticks: S.ticks.filter((t) => t > S.lo) },
    series: { ...S, tgt: m.tgt ?? S.vals[5], tLabel: m.tgt != null ? `${m.kind === "ceiling" ? "Ceiling" : "Target"} ${m.pv.fmt(m.tgt)}` : "" },
  };
}
// The quadrant keeps its size: the four key metrics plus any pins share two rows, so more tiles means narrower tiles.
// what changed, in what you watch: one quiet line each, in the header under the ask (where the shortcuts sit when there's no news).
// Hover: the line itself lifts and its two actions appear right there — Open in chat, ×. Click anywhere on it opens the catch-up.
// the header band holds the greeting, the ask and whatever sits under it (news lines or shortcuts), whole.
// It keeps its last height when Home unmounts, so coming back starts where it was (no jump).
// leadership's header stays where it is and the page slides up over it: pinned as soon as its foot (the In progress ticker)
// is on screen, so a tall header (a brief open) still scrolls far enough to read before it holds
function HeadStay({ on, children }) {
  const ref = useRef(null);
  useLayoutEffect(() => { const el = ref.current, sc = el && el.closest(".scroll"); if (!el || !sc) return;
    // where it sits at rest, measured once from the top of the scroll; it holds there (or higher, if it's taller than the view)
    const nat = el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop;
    const f = () => el.style.setProperty("--hs-top", `${Math.min(nat, sc.clientHeight - el.offsetHeight)}px`);
    const ro = new ResizeObserver(f); ro.observe(el); ro.observe(sc); f(); return () => ro.disconnect(); }, [on]);
  return on ? <div ref={ref} className="lead-head">{children}</div> : <>{children}</>;
}
function BandSizer() {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const a = ref.current && ref.current.previousElementSibling, c = a && a.closest(".content"), st = document.documentElement.style; if (!a || !c) return;
    // when the progress strip is there, the band ends exactly on its bottom edge (at every width); otherwise 24 under the header
    const set = () => { const tk = a.querySelector(".nd-ip .tk"), b = tk ? tk.getBoundingClientRect().bottom : a.getBoundingClientRect().bottom + 24; st.setProperty("--band-h", `${Math.round(b - c.getBoundingClientRect().top)}px`); };
    const ro = new ResizeObserver(set); ro.observe(a); const tk0 = a.querySelector(".nd-ip .tk"); tk0 && ro.observe(tk0); addEventListener("resize", set); set();
    const iv = setInterval(set, 400); // the strip can move without anything resizing (a row settling, a font landing): keep the edge on it
    return () => { ro.disconnect(); removeEventListener("resize", set); clearInterval(iv); };
  }, []);
  return <i ref={ref} hidden />;
}
function Changes({ M, items, onOpen, onDismiss, style }) {
  return (
    <motion.section className="brief" style={style} aria-label="What changed">
      <motion.ul initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.05, delayChildren: 0.15 } } }}>
        <AnimatePresence initial={false}>
          {items.map((it) => (
            <motion.li key={it.tp} layout="position" variants={{ h: { opacity: 0, y: 4 }, s: { opacity: 1, y: 0, transition: toMotion(M.hover.spring) } }}
              exit={{ opacity: 0, height: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } }}>
              <div className="brief-row">
                <button className="brief-main" onClick={() => onOpen(it.tp)}>
                  <b className="brief-t">{it.tp}</b>
                  <span className="brief-s">{it.text}</span>
                  <span className="brief-go">Open in chat <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 6h7M6.5 3l3 3-3 3" /></svg></span>
                </button>
                <button className="brief-x" aria-label={`Dismiss ${it.tp}`} onClick={() => onDismiss(it.tp)}>
                  <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 2l6 6M8 2 2 8" /></svg>
                </button>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </motion.section>
  );
}
// a seat's own tiles: its lane's numbers, exactly as Company health has them (New Business: new ARR, new logos, win rate, demos held)
const SEAT_TILES = { sam: ["2-0", "2-3", "2-2", "2-1"], seth: ["felix", "netnew", "nrr", "ch-grr"] };
const NO_PINS = new Set();
const NO_LAY = { order: [], hidden: [] };
// a seat's own tiles (the four its Home starts with): Sam's New Business four, otherwise leadership's
const stapleIds = (who) => SEAT_TILES[who] || METRICS.map((m) => m.id);
// what's on a seat's Home, in its order: its own tiles (minus the ones it took off), then what it pinned, each where it was put
export function homeList(who, pins, lay = NO_LAY) {
  const own = stapleIds(who), base = [...own, ...[...pins].filter((id) => !own.includes(id))].filter((id) => !lay.hidden.includes(id));
  const rank = (id) => { const i = lay.order.indexOf(id); return i < 0 ? 1e3 + base.indexOf(id) : i; };
  return [...base].sort((a, b) => rank(a) - rank(b));
}
function KeyMetrics({ M, intro, regionRef, openId, onOpen, onClose, onGo, who, tiles, label, cols: colsWant, openH, hero }) {
  const { homeIds, moveHome } = useActions(), mine = !tiles; // a department shows its own lanes; a Home shows its seat's own arrangement
  const want = mine ? homeIds : tiles;
  // what's shown lags a beat: a tile taken off while it's open stays open; when it closes it folds back into its slot, then leaves
  const [shown, setShown] = useState(() => [...want]);
  const wantRef = useRef(want); wantRef.current = want;
  const openRef = useRef(openId); openRef.current = openId;
  // a tile that arrives while you're looking (asked for by name, the star, or put back) comes in on its own beat: the tiles make
  // room first, then it grows into its slot, its chart draws, and its footer says "Just added" for a moment
  const [fresh, setFresh] = useState(null), lastWho = useRef(who), seen = useRef(new Set(want));
  const wantKey = want.join("|");
  useEffect(() => {
    // new order straight away; a tile on its way out keeps its place while it's open
    setShown((prev) => { const out = prev.filter((id) => !want.includes(id) && id === openRef.current); const next = [...want]; out.forEach((id) => next.splice(Math.min(prev.indexOf(id), next.length), 0, id)); return next; });
    const added = want.filter((id) => !seen.current.has(id)); seen.current = new Set(want);
    if (lastWho.current !== who) { lastWho.current = who; return; }
    if (added.length && mine) setFresh({ id: added[added.length - 1], k: Date.now() });
  }, [wantKey, who]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!fresh) return; const t = setTimeout(() => setFresh(null), 3200); return () => clearTimeout(t); }, [fresh]);
  const freshP = useReplay(fresh ? "pin-" + fresh.k : "none", { type: "easing", duration: 1.1, ease: [0.22, 1, 0.36, 1] }, { delay: 0.55, fromZero: !!fresh });
  useEffect(() => {
    if (openId) return;
    const t = setTimeout(() => setShown((prev) => prev.filter((id) => wantRef.current.includes(id))), (M.open.collapse.visualDuration || 0.36) * 1000 + 60);
    return () => clearTimeout(t);
  }, [openId]);
  const own = tiles || SEAT_TILES[who] || [];
  const tileFor = (id) => { const L = METRICS.find((m) => m.id === id); if (L) return L; const t = pinTile(id); return t && own.includes(id) && !t.keepLinked ? { ...t, linked: label || "Sales goals" } : t; };
  const items = shown.map(tileFor).filter(Boolean);
  // up to 8: two rows, columns narrow as tiles are added. Past 8: rows of 4, and every tile goes compact — smaller number, the chart stays, the target footer goes (its % moves up beside the label)
  const compact = items.length > 8;
  const cols = colsWant ? (window.innerWidth < 700 ? 1 : colsWant) : (compact ? 4 : Math.max(2, Math.ceil(items.length / 2))); // a fixed row stacks on a phone
  const key = items.map((m) => m.id).join("|");
  const slots = useRef({});
  const gridRef = useRef(null);
  const [rects, setRects] = useState(null);
  const lastOpen = useRef(null);
  if (openId) lastOpen.current = openId;
  useLayoutEffect(() => {
    const measure = () => {
      const region = gridRef.current.closest(".top"), r = region.getBoundingClientRect(), o = { full: { top: 0, left: 0, width: r.width, height: typeof openH === "number" ? openH : r.height } };
      for (const m of items) { const el = slots.current[m.id]; if (!el) continue; const c = el.getBoundingClientRect(); o[m.id] = { top: c.top - r.top, left: c.left - r.left, width: c.width, height: c.height }; }
      setRects(o);
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(gridRef.current.closest(".top"));
    return () => ro.disconnect();
  }, [key]);
  const size = compact ? 28 : cols <= 2 ? 43.74 : cols === 3 ? 36 : 30;
  // arrange by hand: press a tile and move it. Past a few pixels it lifts and follows the pointer; the others make room as it
  // passes over their slots (the order changes live, so you see where it'll land). Let go and it settles into its slot. A press
  // that doesn't move is still a click and opens it. Only on your own Home, and never while a tile is open
  const [drag, setDrag] = useState(null), dragRef = useRef(null), rectsRef = useRef(null), dropped = useRef(0);
  rectsRef.current = rects;
  const grab = (m) => (e) => {
    if (!mine || openId || e.button !== 0 || !rects || !rects[m.id]) return;
    const region = gridRef.current.closest(".top").getBoundingClientRect(), r0 = rects[m.id];
    dragRef.current = { id: m.id, sx: e.clientX, sy: e.clientY, ox: e.clientX - region.left - r0.left, oy: e.clientY - region.top - r0.top, on: false };
    const move = (ev) => { const d = dragRef.current; if (!d) return; const dx = ev.clientX - d.sx, dy = ev.clientY - d.sy;
      if (!d.on) { if (Math.hypot(dx, dy) < 6) return; d.on = true; document.documentElement.classList.add("is-arranging"); }
      const R0 = gridRef.current.closest(".top").getBoundingClientRect(), px = ev.clientX - R0.left, py = ev.clientY - R0.top, cur = rectsRef.current;
      setDrag({ id: d.id, left: px - d.ox, top: py - d.oy, width: cur[d.id].width, height: cur[d.id].height });
      // the slot under the pointer (not the nearest one): it only moves when you're really over another tile's place
      const over = Object.keys(cur).find((k) => k !== "full" && k !== d.id && px >= cur[k].left && px <= cur[k].left + cur[k].width && py >= cur[k].top && py <= cur[k].top + cur[k].height);
      if (over) { const ids = wantRef.current, from = ids.indexOf(d.id), to = ids.indexOf(over); if (from >= 0 && to >= 0) moveHome(d.id, from < to ? { after: over } : { before: over }); } };
    const up = () => { removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up);
      const d = dragRef.current; dragRef.current = null; document.documentElement.classList.remove("is-arranging");
      if (d && d.on) { dropped.current = performance.now(); setDrag(null); } };
    addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
  };
  // the click that ends a drag doesn't open the tile
  const opener = (id) => { if (performance.now() - dropped.current < 250) return; onOpen(id); };
  return (
    <>
      <div className={`kgrid${compact ? " is-compact" : ""}`} ref={gridRef} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gridAutoRows: compact ? M.compactRow : undefined }}>
        {/* a hero (leadership's ARR movement) runs across the whole row, two tiles tall; the tiles sit in a row of four under it */}
        {hero && <motion.div className="k-hero" style={{ gridColumn: "1 / -1", gridRow: "span 2" }} initial={false} animate={{ opacity: openId ? 0 : 1 }} transition={{ duration: openId ? 0.2 : 0.25, delay: openId ? 0 : 0.1 }}>{hero}</motion.div>}
        {items.map((m) => <div key={m.id} className="kslot" ref={(el) => (slots.current[m.id] = el)} />)}</div>
      <AnimatePresence>
      {rects && items.map((m, i) => {
        if (!rects[m.id]) return null;
        const o = ORDER[m.id] ?? i;
        const q = SETTLE(stag(intro.railIn.current.p, o, 6, M.railStagger)), dp0 = stag(intro.railDraw.current.p, o, 6, M.railStagger), dp = fresh && fresh.id === m.id ? Math.min(dp0, freshP) : dp0;
        const pv = m.preview || PREVIEW[m.id], isFresh = fresh && fresh.id === m.id;
        return <MetricTile key={m.id} m={m} M={M} enter={isFresh} note={isFresh ? "Just added" : null} rect={drag && drag.id === m.id ? drag : rects[m.id]} lifted={!!drag && drag.id === m.id} onGrab={mine ? grab(m) : undefined} full={typeof openH === "function" ? { ...rects.full, height: openH(m.id, rects.full.width) } : rects.full} open={openId === m.id} dim={!!openId && openId !== m.id} top={lastOpen.current === m.id || (!!drag && drag.id === m.id)} vSize={size} vTop={compact ? 4 : undefined} bare={compact}
          p={dp} introStyle={{ opacity: Math.min(1, q * 1.5), scale: 1 + (M.arrive.chartScale - 1) * (1 - q) }}
          closed={m.chat ? () => <ChatVisual c={m.chat} p={dp} mini /> : pv ? (live) => <Mini c={{ ...pv, label: "home-" + m.id }} p={dp} live={live} E={M.ctx.E} col={m.fill} w={Math.round(rects[m.id].width - 35)} /> : undefined}
          onOpen={opener} onClose={onClose} onGo={onGo} />;
      })}
      </AnimatePresence>
    </>
  );
}

// ------------------------------------------------------------------ the "you" column: what needs you, what you committed to
function Attention({ M, style, flash, who = "seth" }) {
  // a built-out seat's attention list is its live decisions on the Agents floor (they leave as you make them); click one to
  // open it there. Leadership's list stays as written for now
  const seat = seatOf(who), [live, setLive] = useState([]);
  useEffect(() => { if (!seat) return; const read = () => { const A = window.__northAgents; setLive(A?.jobs ? A.jobs().filter((j) => j.st === "need" && j.mine).map((j) => ({ id: j.id, t: j.t })) : []); };
    read(); const t = setInterval(read, 1200); return () => clearInterval(t); }, [who]);
  const needs = seat ? live : (PEOPLE.find((p) => p.id === who) || PEOPLE[0]).needs.map((t) => ({ t }));
  return (
    <motion.div className={`you-list${flash ? " is-flash" : ""}`} id="attention" style={style}>
      <div className="you-h"><h3 style={{ color: C.alert }}>Needs your attention</h3><b style={{ color: C.alert }}>{needs.length}</b></div>
      {needs.map(({ id, t }) => (
        <button className="att" key={t} onClick={id ? () => window.__northAgents?.open(id) : undefined}><span>{t}</span>
          <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke={C.mute} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2.5 6.5 6 3 9.5" /></svg></button>
      ))}
    </motion.div>
  );
}
// same navy unless a goal is in trouble (red) or already hit (teal); the cream cut marks today (day 28 of 92)
const GOALS = [["Close $40M ending ARR", 0.27, "27%", C.navy], ["Portal live at 25 brokerages", 0.36, "36%", C.navy], ["Book 40 expansion deals", 1, "112%", C.teal], ["Time to value under 15 days", 0.09, "9%", C.alert]];
// a seat sees its team's goals, its own first; the rest of the team's are quieter. Each is the lane's own number against pace
// (Company health's figures), so there's no day-of-quarter cut. The last line ties the seat to the team's number.
const SEAT_GOALS = {
  sam: { title: "Sales goals", rows: [["New ARR", 0.92, "92%", C.navy, true], ["New logos", 0.75, "75%", C.navy, true], ["Outbound · Caleb", 0.23, "23%", C.alert], ["Expansion · Heather", 0.72, "72%", C.navy]],
    tie: "$140K of Sales’ $864K gap to pace is yours" },
};
function Goals({ M, p, style, who }) {
  const { E, spread } = M.ctx, seat = SEAT_GOALS[who];
  const rows = seat ? seat.rows : GOALS;
  return (
    <motion.div className={`you-list${seat ? " is-seat" : ""}`} style={style}>
      <div className="you-h"><h3>{seat ? seat.title : "Q4 goals"}</h3>{!seat && <button className="edit">Edit</button>}</div>
      {rows.map(([n, f, pct, c, mine], i) => {
        const g = E(stag(win(p, 0.1, 0.8), i, 4, spread));
        return (
          <button className={`goal${seat && !mine ? " is-team" : ""}`} key={n}>
            <span className="goal-l"><b>{n}</b><em style={{ color: c }}>{pct}</em></span>
            <span className="goal-bar"><i className="grain" style={{ width: `${f * 100 * g}%`, background: c }} />{!seat && <u style={{ left: `${(28 / 92) * 100}%` }} />}</span>
          </button>
        );
      })}
      {seat && <p className="goal-tie">{seat.tie}</p>}
    </motion.div>
  );
}
const SUGGESTIONS = [["chart", "Build me a custom chart"], ["people", "Convene the AI leadership team"], ["trend", "Simulate a path to $40M"]];
// a seat's shortcuts are about its own numbers (each one lands on an answer North already has)
const SEAT_SUGS = { sam: [["trend", "How many new logos do I need by Oct 31?"], ["chart", "Why aren’t my held demos closing?"], ["people", "Where is Sales behind?"]] };
function Suggestions({ onPick, onPast, who }) {
  const icon = {
    chart: <path d="M3 2.5v11h12M6 10.5v-3M9 10.5v-6M12 10.5v-4" />,
    people: <><circle cx="5.2" cy="4.7" r="2.2" /><path d="M1.2 13.5c.3-2.6 1.9-4 4-4s3.7 1.4 4 4M10 2.6c1.4.1 2.2 1 2.2 2.1S11.4 6.7 10 6.8M11.6 9.6c1.3.5 2 1.6 2.2 3.4" /></>,
    trend: <path d="M2 11l4-4 2.5 2.5L13.5 4.5M10 4.5h3.5V8" />,
    history: <><path d="M3.4 9.6a5 5 0 1 0 .9-5.1" /><path d="M2.6 2.6l.2 2.6 2.6-.2M8 5v3l2 1.2" /></>,
  };
  const I2 = ({ k }) => <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#545454" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">{icon[k]}</svg>;
  return (
    <div className="sugs">
      {(SEAT_SUGS[who] || SUGGESTIONS).map(([k, t]) => <motion.button key={t} className="sug" whileTap={{ scale: 0.97 }} onClick={() => onPick(t)}><I2 k={k} />{t}</motion.button>)}
      <button className="sug sug-ghost" onClick={onPast}><I2 k="history" />Past questions</button>
    </div>
  );
}

// ------------------------------------------------------------------ segmented control with a sliding pill
// the pill sits in the control, not in a tab, and slides to the chosen tab by its offset inside the control: moving the
// whole control (a goal's divider) carries the pill with it instead of leaving it to catch up
function Seg({ value, onChange, options, M, id, small }) {
  const ref = useRef(null), [at, setAt] = useState(null);
  useLayoutEffect(() => { const el = ref.current && ref.current.querySelector('[aria-selected="true"]'); if (el) setAt({ left: el.offsetLeft, width: el.offsetWidth }); }, [value, options.length, small]);
  return (
    <div ref={ref} className={`seg${small ? " seg-sm" : ""}`} role="tablist">
      {at && <motion.span className="seg-pill is-free" initial={false} animate={at} transition={toMotion(M.select.pill)} />}
      {options.map(([v, label]) => (
        <button key={v} role="tab" aria-selected={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>
          <span className="seg-t">{label}</span>
        </button>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ board: detail + list joined into one unit
// a document on the board: the page itself on the left, what's left on it on the right
const EXPAND = <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" /></svg>;
// covers for documents that aren't slides: each one made from what's in it, so the board shows the thing, not a page of text
const GRR6 = _A26.grr.slice(4, 10);
function Cover({ it, live }) {
  if (it.cover === "event") return (
    <span className="bdc bdc-event"><span className="bdc-date"><small>Nov</small><b>24</b></span>
      <span className="bdc-ev"><b>Brokerage leaders workshop</b><span>14 brokerages · 9 customers (sample)</span>
        <span className="bdc-slots">{[["9:00", "You open"], ["9:30", "Brightwater"], ["10:15", "Working session"], ["11:00", "Roadmap"]].map(([t, l], i) => <i key={t} className={i === 0 ? "is-you" : ""}><b>{t}</b>{l}</i>)}</span></span></span>);
  if (it.cover === "charts") return (
    <span className="bdc bdc-charts">{[["Booked ARR – Outbound", "$130.2K", 0.23], ["New logos", "55", 0.75], ["Held-demo win rate", "19.9%", 0.85], ["Expansion ARR", "$734.0K", 0.72]].map(([l, v, f]) => (
      <span key={l} className="bdc-ch"><small>{l}</small><b>{v}</b><span className="bdc-bar"><i style={{ width: `${f * 100}%` }} /><em style={{ left: "100%" }} /></span><span className="bdc-pct">{Math.round(f * 100)}% of pace</span></span>))}</span>);
  if (it.cover === "line") { const lo = 96.5, hi = 99, W = 300, H = 110, X = (i) => 14 + i * ((W - 28) / 5), Y = (v) => 10 + (1 - (v - lo) / (hi - lo)) * (H - 20);
    return (
      <span className="bdc bdc-line"><small>GRR, May to October</small><b>Hold above 97%</b>
        <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><line x1="0" x2={W} y1={Y(97)} y2={Y(97)} stroke={C.coral} strokeWidth="1" strokeDasharray="0.1 3" strokeLinecap="round" />
          <polyline points={GRR6.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} fill="none" stroke={C.navy} strokeWidth="1.5" strokeLinejoin="round" />
          {GRR6.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r={i === 5 ? 3.5 : 2.2} fill={C.navy} />)}</svg></span>); }
  if (it.cover === "site") return (
    <span className={`bdc bdc-site${live ? " is-live" : ""}`}><span className="bdc-chrome"><i /><i /><i /><span>fello.ai/portal</span></span>
      <span className="bdc-page"><b>What if your website was alive?</b><small>An IDX site that builds for you, chats with visitors, and keeps it moving.</small>
        <span className="bdc-chat"><span className="bdc-me">Build a page for 212 Walnut Street</span><span className="bdc-felix"><i />Felix is building it…</span></span>
        <span className="bdc-listing"><span className="bdc-ph" /><span className="bdc-l"><b>212 Walnut Street</b><small>3 bd · 2 ba · Cleveland, OH</small><em>Book a tour</em></span></span></span></span>);
  return null;
}
// a video's poster: its own frame (title, who, a play mark, the length), and on hover it plays: the bar runs and the clock counts
function VideoPoster({ v, playing }) {
  const [t, setT] = useState(0);
  useEffect(() => { if (!playing) { setT(0); return; } const id = setInterval(() => setT((x) => (x + 1) % v.len), 120); return () => clearInterval(id); }, [playing]);
  const mm = (x) => `${Math.floor(x / 60)}:${String(x % 60).padStart(2, "0")}`;
  return (
    <span className={`bd-vid${playing ? " is-on" : ""}`}>
      <span className="bd-vid-t"><small>{v.who}</small><b>{v.t}</b></span>
      <span className="bd-vid-p"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2.5v9l7.5-4.5z" fill="currentColor" /></svg></span>
      <span className="bd-vid-bar"><i style={{ width: `${(t / v.len) * 100}%` }} /></span>
      <span className="bd-vid-c">{mm(t)} / {mm(v.len)}</span>
    </span>);
}
// a document on the board: the thing itself, whole and as big as the space allows (a deck's slide, a doc's page, a video's
// frame, a cover made from what's in it). Hover and it comes alive: a deck plays through its slides, a video plays, and the
// preview steps aside for the breakdown (what it's waiting on, what's yours). Click it, or the corner button, for full screen
function DocDetail({ it }) {
  const f = FILE_OF(it.k), n = f && f.slides ? f.slides.length : 0, [hv, setHv] = useState(false), [si, setSi] = useState(it.slide || 0);
  useEffect(() => { setSi(it.slide || 0); if (!hv || !n) return; const id = setInterval(() => setSi((i) => (i + 1) % n), 1300); return () => clearInterval(id); }, [hv, n, it.k]);
  return (
    <div className={`bd-doc${hv ? " is-hv" : ""}`} onPointerEnter={() => setHv(true)} onPointerLeave={() => setHv(false)}>
      <button type="button" className="bd-prev" aria-label={it.site ? `Open ${it.name}` : `Open ${it.name} full screen`} onClick={(e) => (it.site ? window.open(it.site, "_blank", "noopener") : showFile(it.k, e.currentTarget, { full: true }))}>
        {it.video ? <VideoPoster v={it.video} playing={hv} />
          : it.cover === "site" ? <span className="bd-slide"><span className="bd-fit is-site"><Cover it={it} live={hv} /></span></span>
          : it.cover ? <Cover it={it} live={hv} />
          : n ? <AnimatePresence mode="popLayout" initial={false}><motion.span key={si} className="bd-slide" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}><span className="bd-fit"><SlideThumb k={it.k} i={si} /></span></motion.span></AnimatePresence>
          : <span className="bd-slide"><span className="bd-fit"><Preview k={it.k} /></span></span>}
        {n > 0 && <span className="bd-count">{si + 1} / {n}</span>}
      </button>
      <div className="bd-side">
        <AnimatePresence mode="wait" initial={false}>
          {hv ? <motion.ul key="b" className="bd-parts" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.25 }}>{it.parts.map(([l, v, tone]) => <li key={l}><span>{l}</span>
            {tone === "dots" ? <i className="bd-dots" aria-label={`${v[0]} of ${v[0] + v[1] + v[2]} drafted`}>{[...Array(v[0]).fill("d"), ...Array(v[1]).fill("n"), ...Array(v[2]).fill("o")].map((x, i) => <b key={i} className={`is-${x}`} />)}</i>
              : <em className={tone ? `is-${tone}` : ""}>{v}</em>}</li>)}</motion.ul>
            : null}
        </AnimatePresence>
      </div>
    </div>);
}
// what she asked North to build for her Home ("make a dash of the latest campaign"): Saved Charts' own layout (the numbers as a
// list on the right, the one she picks drawn large and interactive on the left), with its own way off
function CampaignBoard({ M, p, replayKey }) {
  const on = useCampaignDash();
  return <AnimatePresence initial={false}>{on && <motion.div key="cb" className="cb" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
    <Board M={M} p={p} replayKey={replayKey} items={CAMPAIGN} title={<>Portal launch campaign <span className="cb-sub">Lisa’s · since Oct 13 · sample data</span></>} add="Remove" onAdd={() => setCampaign(false)} first="c-visits" cls="is-camp" />
  </motion.div>}</AnimatePresence>;
}
// ARR movement, opened from Home's chart: it grows out of the chart's own card to the full frame (13px in, like a file opened
// full screen), laid out at full size from the first frame so the box uncovers it; the fold-in mark sits in the top corner
// where every close sits; closing (the mark, Esc, the veil) shrinks it back into the card
function ArrOverlay({ M, focus, from, onClose }) {
  // the box sits on the full frame from the start and its clip opens out of the chart's card (no width/height animating, so
  // nothing reflows mid-move); closing clips it back into wherever the card is now, then it lets go
  const W = innerWidth, H = innerHeight, to = { left: 13, top: 13, width: W - 26, height: H - 26 };
  const ins = (r) => (r ? `inset(${Math.max(0, r.top - to.top)}px ${Math.max(0, to.left + to.width - r.left - r.width)}px ${Math.max(0, to.top + to.height - r.top - r.height)}px ${Math.max(0, r.left - to.left)}px round 14px)` : "inset(20px 40px 40px 40px round 14px)");
  const v = { shut: (r) => ({ clipPath: ins(r || from), opacity: 1 }), open: { clipPath: "inset(0px 0px 0px 0px round 16px)", opacity: 1 },
    // closing is one move: the table fades while the box folds into the card, the box's own paper lets go over the second half,
    // and the card's bars are already rising underneath by then (no shrink, then fade, then bars)
    gone: (r) => ({ clipPath: ins(r || from), opacity: 0, transition: { clipPath: { duration: 0.5, ease: [0.32, 0.72, 0, 1] }, opacity: { delay: 0.16, duration: 0.34, ease: [0.4, 0, 0.2, 1] } } }) };
  return createPortal(<>
    <motion.div className="fm-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.36 } }} transition={{ duration: 0.36 }} onClick={onClose} />
    <motion.div className="ao" role="dialog" aria-label="ARR movement" style={to} variants={v} custom={from} initial="shut" animate="open" exit="gone" transition={{ clipPath: { duration: 0.56, ease: [0.32, 0.72, 0, 1] } }}>
      <motion.div className="ao-scroll" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.22, ease: [0.4, 0, 1, 1] } }}><ArrPage M={M} focus={focus} onBack={onClose} /></motion.div>
      <button type="button" className="ibtn ao-x" aria-label="Back to Home" title="Back to Home (Esc)" onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13.5 2.5 9 7M9 3.5V7h3.5M2.5 13.5 7 9M7 12.5V9H3.5" /></svg></button>
    </motion.div>
  </>, document.body);
}
// a decision that lives on the board: its button sits on the cover, beside full screen; once done it says so
function BoardAct({ a: [k, l, done] }) {
  const st = useGoalStore(), has = st.own[k];
  return has ? <span className="bd-act is-done">{done}</span>
    : <motion.button type="button" className="rt-b is-pri bd-act" whileTap={{ scale: 0.97 }} onClick={(e) => { e.stopPropagation(); setOwn(k, done); }}>{l}</motion.button>;
}
function Board({ M, p, replayKey, items: list, title = "Your Saved Charts", add = "+ Add from library", first = "booked", onAdd, cls = "" }) {
  const [lane, setLane] = useState("all");
  const all = list || BOARD, items = lane === "worst" ? all.filter((b) => WORST.includes(b.id)) : all;
  const [sel, setSel] = useState(first);
  const [dir, setDir] = useState(1);
  const [hov, setHov] = useState(null);
  const rowRefs = useRef({});
  const active = items.find((b) => b.id === sel) || items[0];
  useEffect(() => { if (!items.find((b) => b.id === sel)) setSel(items[0].id); }, [lane]);
  const choose = (id) => {
    if (id === active.id) return;
    const a = items.findIndex((b) => b.id === active.id), b = items.findIndex((x) => x.id === id);
    setDir(b > a ? 1 : -1);
    setSel(id);
  };
  const onKey = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const i = items.findIndex((b) => b.id === active.id);
    const n = items[clamp(i + (e.key === "ArrowDown" ? 1 : -1), 0, items.length - 1)];
    choose(n.id);
    rowRefs.current[n.id]?.focus();
  };
  const local = useReplay(`${active.id}-${replayKey}`, M.detail.draw, { delay: M.detail.drawDelay, reduced: REDUCED });
  const drawP = Math.min(local, p);
  const V = active.V;
  return (
    <section className={`board${list && !cls ? " is-docs" : ""}${cls ? ` ${cls}` : ""}`} aria-labelledby="board-h">
      <div className="board-head">
        <h3 id="board-h">{title}</h3>
        <div className="board-ctl">
                    <motion.button className="btn-out" whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }} transition={toMotion(M.hover.press)} onClick={onAdd}>{add}</motion.button>
        </div>
      </div>
      <div className="board-body">
        <div className="card detail">
          <div className="surface detail-surface">
            <AnimatePresence mode="popLayout" initial={false} custom={dir}>
              <motion.div key={active.id} className={`detail-inner${active.doc ? " is-cover" : ""}`} custom={dir}
                variants={{
                  enter: (d) => ({ opacity: 0, y: d * M.detail.slide, scale: 1 + (M.arrive.chartScale - 1) * 0.6, filter: `blur(${M.detail.blur}px)` }),
                  center: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
                  exit: (d) => ({ opacity: 0, y: -d * M.detail.slide * 0.6, scale: 0.98, filter: `blur(${M.detail.blur}px)` }),
                }}
                initial="enter" animate="center" exit="exit" transition={toMotion(M.detail.swap)} style={{ transformOrigin: "50% 60%" }}>
                {active.doc ? <DocCover it={active} /> : <><h4>{active.title}</h4><p>{active.sub}</p><V p={drawP} /></>}
              </motion.div>
            </AnimatePresence>
            {active.act && <BoardAct a={active.act} />}
            {active.doc && (active.site ? <a className="ibtn bd-full" href={active.site} target="_blank" rel="noopener noreferrer" aria-label={`Open ${active.name}`} title="Open the live page">{EXPAND}</a>
              : <button type="button" className="ibtn bd-full" aria-label={`Open ${active.name} full screen`} title="Full screen" onClick={(e) => showFile(active.k, e.currentTarget, { full: true })}>{EXPAND}</button>)}
          </div>
          <div className="card-foot">
            <span>{active.foot}</span>
            {active.doc ? <span className="pace is-doc">{active.end}</span> : <span className="pace"><b>{active.pct}%</b> {active.pctL || "of pace"}</span>}
          </div>
        </div>
        <div className="card list">
          <div className="surface list-surface" role="listbox" aria-label="Board metrics" onKeyDown={onKey} onPointerLeave={() => setHov(null)}>
            <AnimatePresence initial={false}>
              {items.map((b, i) => (
                <motion.button key={b.id} layout="position" role="option" aria-selected={b.id === active.id}
                  ref={(el) => (rowRefs.current[b.id] = el)} tabIndex={b.id === active.id ? 0 : -1}
                  className={`row${b.id === active.id ? " is-sel" : ""}${i > 0 ? " has-rule" : ""}`}
                  onClick={() => choose(b.id)} onPointerEnter={() => setHov(b.id)}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={toMotion(M.select.list)}>
                  {b.id === active.id && <SelIn key={b.id} className="sel-fill" style={{ inset: 0, left: 0, right: 0 }} />}
                  <span className="row-in">
                    <span className="row-l"><b>{b.name}</b><small>{b.lane}</small></span>
                    {b.doc ? <span className="row-r"><b>{b.right}</b>{b.need && <small className="row-need">{b.need}</small>}</span> : <span className="row-r"><b>{b.value}</b><small>{b.pct}%</small></span>}
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------ app
const EASE = { type: "easing", ease: [0.22, 1, 0.36, 1] }, LIN = { type: "easing", ease: [0, 0, 1, 1] };
const SETTLE = bezier([0.16, 1, 0.3, 1]);
const drop = (at, duration) => ({ at, duration, from: { y: -12, blur: 8, opacity: 0 }, to: { y: 0, blur: 0, opacity: 1 }, transition: EASE });
const settle = (at, duration) => ({ at, duration, from: { scale: 1.08, opacity: 0 }, to: { scale: 1, opacity: 1 }, transition: { type: "easing", ease: [0.16, 1, 0.3, 1] } });
const draw = (at, duration) => ({ at, duration, from: { p: 0 }, to: { p: 1 }, transition: LIN });
// short key → [timeline label, track, what it moves]
const INTRO_SPEC = {
  frame: ["Sidebar + card fade in", { at: 0, duration: 0.8, from: { y: -6, opacity: 0 }, to: { y: 0, opacity: 1 }, transition: EASE }, ".side, .main"],
  heading: ["Greeting drops in", drop(0.12, 0.9), ".hello"],
  composer: ["Ask bar + suggestions drop in", drop(0.24, 0.9), ".composer, .sugs"],
  chartIn: ["Revenue card settles in", settle(0.7, 1.2), ".card.arr"],
  chartDraw: ["Revenue bars grow", draw(1.0, 1.9), ".card.arr"],
  railIn: ["Metrics, attention + goals settle in", { at: 0.4, duration: 1.35, from: { p: 0 }, to: { p: 1 }, transition: LIN }, ".top"],
  railDraw: ["Metric + goal bars fill", draw(0.46, 1.7), ".top"],
  boardIn: ["Board settles in", settle(0.85, 1.25), ".board"],
  boardDraw: ["Board chart draws", draw(1.45, 2.3), ".detail"],
};
const INTRO = Object.fromEntries(Object.values(INTRO_SPEC).map(([l, t]) => [l, t]));
const fromTimeline = (raw) => { const o = Object.create(raw); for (const [k, [l]] of Object.entries(INTRO_SPEC)) Object.defineProperty(o, k, { get: () => raw[l] }); return o; };
const INTRO_OPTS = { id: "north-intro", autoplay: !REDUCED };
// ---- DialKit: every control is labelled by what it moves, and hovering a control outlines that thing on the page.
// spec → { short key: [label, value | {children}, target selector] }. Code reads the short keys; the panel shows the labels.
const SPEC = {
  data: ["Charts drawing in", {
    elementEase: ["Ease of each bar / tick", { type: "easing", duration: 0.8, ease: [0.16, 1, 0.3, 1] }],
    stagger: ["Stagger across marks (0 = together)", [0.55, 0, 0.9, 0.01]],
  }, ".arr-plot svg, .viz svg, .pbar"],
  arrive: ["How things arrive", {
    chartScale: ["Charts start this big (scale)", [1.15, 1, 1.3, 0.01], ".card.arr, .top, .board"],
    typeDrop: ["Type drops from (px above)", [12, 0, 40, 1], ".hello, .composer"],
    typeBlur: ["Type starts blurred (px)", [8, 0, 20, 0.5], ".hello, .composer"],
  }],
  railStagger: ["Metric cards: stagger between them", [0.21, 0, 0.8, 0.01], ".top"],
  open: ["Opening a key metric", {
    expand: ["Card grows open", { type: "easing", duration: 0.55, ease: [0.32, 0.72, 0, 1] }],
    collapse: ["Card closes back into place", { type: "easing", duration: 0.4, ease: [0.32, 0.72, 0, 1] }],
    contentDelay: ["Wait before details appear (s)", [0.08, 0, 0.8, 0.01]],
    content: ["Details settle in", { type: "easing", duration: 0.3, ease: [0.22, 1, 0.36, 1] }],
    stagger: ["Stagger between detail rows (s)", [0.022, 0, 0.15, 0.005]],
    draw: ["Chart draw duration (ends as the card lands: expand 0.55 = delay 0.08 + draw 0.47)", { type: "easing", duration: 0.47, ease: [0, 0, 1, 1] }],
    lens: ["Lens switch (chart swap)", { type: "spring", visualDuration: 0.45, bounce: 0.04 }],
  }, ".top"],
  keys: ["Piano-key ticks (board charts)", {
    lift: ["How high a key rises (px)", [23, 0, 40, 1]],
    spread: ["How many neighbours move (px reach)", [7, 2, 80, 1]],
    stiffness: ["Key snap (stiffness)", [450, 50, 1200, 10]],
    damping: ["Key settle (damping, low = bouncy)", [22, 4, 60, 1]],
  }, ".viz svg"],
  tip: ["Tooltip pop-in", { type: "spring", visualDuration: 0.35, bounce: 0.1 }, ".arr-plot, .viz"],
  tipFollow: ["Tooltip follows cursor", { type: "spring", visualDuration: 0.22, bounce: 0 }, ".arr-plot, .viz"],
  menu: ["Menus & dropdowns", {
    open: ["Dropdown grows out of its button", { type: "easing", duration: 0.62, ease: [0.16, 1, 0.3, 1] }, ".dd-m, .ch-menu"],
  }],
  shimmer: ["Step light (letters light up, each one whole)", {
    on: ["Light on", true],
    pass: ["Pass: time to cross the text (s)", [9.15, 0.4, 12, 0.05]],
    rest: ["Rest between passes (s)", [0.9, 0, 6, 0.05]],
    ease: ["Pass easing", { type: "select", options: [{ value: "glide", label: "Glide (starts quick, lands soft)" }, { value: "smooth", label: "Smooth (soft in and out)" }, { value: "linear", label: "Even (constant speed)" }], default: "linear" }],
    width: ["Light: fully lit letters at once", [2, 0, 20, 0.5]],
    feather: ["Light: letters fading in / out each side", [3, 0, 20, 0.5]],
    falloff: ["Light: fade curve (1 = even, under 1 = soft glow, over 1 = tight)", [0.75, 0.2, 3, 0.05]],
    strength: ["Light: strength (0–1)", [0.67, 0, 1, 0.01]],
    tone: ["Light: colour (−1 navy … +1 light)", [1, -1, 1, 0.01]],
    base: ["Text darkness (0 = light grey, 1 = navy)", [0.81, 0, 1, 0.01]],
    reverse: ["Run right to left", false],
  }, ".pk-now"],
  think: ["In progress dots", {
    count: ["How many dots", [7, 1, 16, 1]],
    march: ["Dots: one lap round (s, lower = faster)", [1.9, 0.4, 12, 0.1]],
    gap: ["Dots: spacing (1 = even round the ring, lower = bunched)", [1, 0, 1, 0.01]],
    drift: ["Dots: speed offset between them (0 = all together)", [0.25, -1, 1, 0.01]],
    twist: ["Dots: each one's orbit tipped from the next (deg)", [54, -90, 90, 1]],
    turn: ["Ring: one turn over (s, 0 = doesn't turn)", [2.6, 0, 12, 0.1]],
    axisX: ["Turn axis: X (left-right)", [0.58, -1, 1, 0.01]],
    axisY: ["Turn axis: Y (up-down)", [0.27, -1, 1, 0.01]],
    axisZ: ["Turn axis: Z (toward you)", [0, -1, 1, 0.01]],
    stageSwing: ["New stage: how far it swings to that stage's axis (0 = never)", [1, 0, 1, 0.01]],
    swing: ["New stage: time to swing (s)", [0.2, 0.2, 3, 0.05]],
    breath: ["New stage: breath size", [0, 0, 0.4, 0.01]],
    radius: ["Ring size", [4.8, 2.5, 6, 0.05]],
    nearSize: ["Dot size near", [1, 0.2, 2.5, 0.05]],
    farSize: ["Dot size far", [0.3, 0, 2.5, 0.05]],
    nearOp: ["Opacity near", [1, 0, 1, 0.01]],
    farOp: ["Opacity far", [1, 0, 1, 0.01]],
  }, ".pk-now"],
  hover: ["Hover", {
    band: ["Chart column highlight slide", { type: "easing", duration: 0.32, ease: [0.22, 1, 0.36, 1] }, ".arr-plot"],
    glide: ["Highlight grows from cursor (sidebar, menus, lists)", { type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }, ".side nav, .side-foot, .dd-m, .rl3, .lv2"],
    spring: ["Metric card text swap", { type: "spring", visualDuration: 0.7, bounce: 0.2 }, ".kpi"],
    press: ["Button press (mic, add)", { type: "spring", visualDuration: 0.2, bounce: 0.3 }, ".voice, .btn-out"],
    grace: ["Charts: keep a bar's tooltip after leaving it (s)", [0.18, 0, 0.6, 0.01], ".arr-plot"],
    askShimmer: ["Ask North: shimmer cycle (s)", [6, 2, 12, 0.1], ".side nav"],
    nlPush: ["North mark: spokes push out on hover (px)", [1.2, 0, 3, 0.1], ".side nav"],
    nlStagger: ["North mark: spoke stagger (ms)", [40, 0, 120, 5], ".side nav"],
    nlDur: ["North mark: spoke push (ms)", [520, 150, 1200, 10], ".side nav"],
  }],
  select: ["Board selection", {
    glide: ["List highlight slide", { type: "spring", visualDuration: 0.45, bounce: 0.14 }, ".list-surface"],
    list: ["List rows reorder", { type: "spring", visualDuration: 0.4, bounce: 0 }, ".list-surface"],
    pill: ["Toggle pill slide (bars / line, lanes)", { type: "spring", visualDuration: 0.38, bounce: 0.16 }, ".seg"],
  }],
  detail: ["Board chart swap", {
    swap: ["Old chart out / new chart in", { type: "spring", visualDuration: 0.6, bounce: 0.06 }],
    slide: ["Slide distance (px)", [14, 0, 48, 1]],
    blur: ["Blur while swapping (px)", [4, 0, 12, 0.5]],
    draw: ["New chart draw duration", { type: "easing", duration: 2.1, ease: [0, 0, 1, 1] }],
    drawDelay: ["Wait before drawing (s)", [0.12, 0, 0.6, 0.01]],
  }, ".detail"],
  chart: ["Revenue chart", { morph: ["Bars ↔ line morph", { type: "spring", visualDuration: 0.85, bounce: 0.06 }] }, ".arr-plot"],
  collapse: ["Sidebar sections open / close", { type: "spring", visualDuration: 0.32, bounce: 0 }, ".nav-sec"],
  chips: ["Top bar", {
    gauge: ["Score ring fill", { type: "easing", duration: 0.9, ease: [0.22, 1, 0.36, 1] }, ".chip-score"],
    pop: ["Attention chip → card", { type: "spring", visualDuration: 0.25, bounce: 0.1 }, ".chip-alert, #attention"],
  }],
  composer: ["Ask bar", {
    cycle: ["Seconds per placeholder", [3.4, 1.5, 8, 0.1]],
    cycleSpring: ["Placeholder roll", { type: "spring", visualDuration: 0.45, bounce: 0.05 }],
    focus: ["Focus glow", { type: "spring", visualDuration: 0.3, bounce: 0 }],
    navFade: ["Fade into / out of the top bar", { type: "easing", duration: 0.42, ease: [0.22, 1, 0.36, 1] }],
  }, ".composer"],
  health: ["Company health page", {
    intro: ["Page build-in length", { type: "easing", duration: 2.4, ease: [0, 0, 1, 1] }],
    cardStagger: ["Scoreboard cards: stagger", [0.35, 0, 0.9, 0.01], ".sgrid"],
    headLag: ["Heatmap categories: lag behind their squares (s)", [0, -0.5, 0.8, 0.01], ".hm-head"],
    headBar: ["Heatmap categories: score bar fills", { type: "easing", duration: 0.55, ease: [0.16, 1, 0.3, 1] }, ".hm-head"],
    barWait: ["Heatmap categories: score bar starts after its name (s)", [0.3, 0, 0.8, 0.01], ".hm-head"],
    flowSpread: ["Heatmap squares: centre → corners (s)", [1.1, 0, 3, 0.05], ".hm-cell, .hm-open, .hm .mtile"],
    tileFade: ["Heatmap squares: each one fades in", { type: "easing", duration: 0.9, ease: [0.26, 0.22, 0.86, 0.85] }, ".hm-cell, .hm-open, .hm .mtile"],
    flowDelay: ["Heatmap squares: start after (s)", [0.15, 0, 1, 0.01], ".hm-cell, .hm-open, .hm .mtile"],
    hoverIntent: ["Wait before a tile opens (s)", [0.04, 0, 0.5, 0.01], ".hm-cell, .hm-open, .hm .mtile"],
    tileOpen: ["Tile grows open / closes", { type: "spring", visualDuration: 0.26, bounce: 0.06 }, ".hm-cell, .hm-open, .hm .mtile"],
    tileIn: ["Tile details settle in", { type: "easing", duration: 0.32, ease: [0.22, 1, 0.36, 1] }, ".hm-cell, .hm-open, .hm .mtile"],
    tileDelay: ["Wait before details (s)", [0.04, 0, 0.4, 0.01], ".hm-cell, .hm-open, .hm .mtile"],
    tileStagger: ["Stagger between details (s)", [0.035, 0, 0.2, 0.005], ".hm-cell, .hm-open, .hm .mtile"],
    barFill: ["Tile pace bar fill", { type: "easing", duration: 0.7, ease: [0.16, 1, 0.3, 1] }, ".hm-cell, .hm-open, .hm .mtile"],
    dock: ["Filter bar docks under the nav (fade)", { type: "easing", duration: 0.28, ease: [0.22, 1, 0.36, 1] }, ".ch-filters"],
    wake: ["Scoreboard chart wakes on hover (s)", [0.4, 0, 1.2, 0.01], ".sgrid"],
    navSlide: ["Sidebar active row slide", { type: "spring", visualDuration: 0.4, bounce: 0.1 }, ".side nav"],
    heatPalette: ["Heatmap palette", { type: "select", options: [{ value: "focus", label: "Filled · misses full, on-pace tinted" }, { value: "status", label: "Filled · all full colour" }, { value: "accent", label: "Paper tiles · colour bar" }, { value: "one", label: "Filled · one colour" }], default: "focus" }, ".hm-cell, .hm-open, .hm .mtile"],
    heat: ["Heatmap colour strength (0 = paper, 1 = full)", [1, 0, 1, 0.05], ".hm-cell, .hm-open, .hm .mtile"],
    squareOpen: ["Heatmap square grows open", { type: "easing", duration: 0.3, ease: [0.32, 0.72, 0, 1] }, ".hm-cell, .hm-open, .hm .mtile"],
    squareClose: ["Heatmap square closes", { type: "easing", duration: 0.24, ease: [0.32, 0.72, 0, 1] }, ".hm-cell, .hm-open, .hm .mtile"],
    squareDelay: ["Heatmap square: wait before details (s)", [0.05, 0, 0.5, 0.01], ".hm-cell, .hm-open, .hm .mtile"],
    frame: ["Open square: frame thickness (px)", [1.09, 0, 12, 0.01], ".hm-cell, .hm-open, .hm .mtile"],
    dim: ["Heatmap fade behind an open square (0–1)", [1, 0, 1, 0.05], ".hm-cell, .hm-open, .hm .mtile"],
    dimBlur: ["Heatmap blur behind an open square (px)", [1.5, 0, 8, 0.5], ".hm-cell, .hm-open, .hm .mtile"],
    laneOpen: ["Department: lane detail opens / closes", { type: "spring", visualDuration: 0.46, bounce: 0.04 }, ".dl"],
    laneIn: ["Department: detail contents settle", { type: "easing", duration: 0.36, ease: [0.22, 1, 0.36, 1] }, ".dl"],
    laneGap: ["Department: space between lanes (px)", [128, 48, 240, 4], ".dl"],
    cardGap: ["Department: space between cards (px)", [16, 8, 32, 1], ".dl"],
    pageSwap: ["Page swap fade", { type: "easing", duration: 0.24, ease: [0.22, 1, 0.36, 1] }, ".content"],
  }],
  meetings: ["Meetings calendar", {
    evIn: ["Meetings slide in", { type: "easing", duration: 0.25, ease: [0, 1.05, 0.48, 0.95] }, ".mg-cg, .mg-mo"],
    evGap: ["Meetings slide in: gap between (ms)", [27, 0, 80, 1], ".mg-cg, .mg-mo"],
    evDelay: ["Meetings slide in: start delay (ms)", [0, 0, 400, 10], ".mg-cg, .mg-mo"],
    evOp: ["Meetings slide in: start opacity", [0, 0, 1, 0.05], ".mg-cg, .mg-mo"],
    open: ["A meeting opens", { type: "easing", duration: 0.42, ease: [0.32, 0.72, 0, 1] }, ".mg-full, .mg-ev"],
    close: ["A meeting closes", { type: "easing", duration: 0.32, ease: [0.45, 0, 0.15, 1] }, ".mg-full, .mg-ev"],
  }, ".mg-calc, .mg-left"],
  chat: ["Chat (⌘K · type · hold space)", {
    open: ["Opens / moves / docks", { type: "easing", duration: 0.34, ease: [0.2, 0.9, 0.25, 1] }],
    width: ["Bar width (px)", [600, 480, 820, 10]],
    barTop: ["Bar from top (share of screen)", [0.28, 0.08, 0.5, 0.01]],
    floatW: ["Popped-out width (px)", [520, 380, 720, 10]],
    floatH: ["Popped-out height (px)", [560, 300, 760, 10]],
    dockW: ["Docked width (px)", [420, 340, 560, 10]],
    glass: ["Glass opacity (page card is .59)", [0.59, 0.2, 0.95, 0.01]],
    glassBlur: ["Glass blur (px)", [28, 0, 60, 1]],
    veil: ["Page behind fades", { type: "easing", duration: 0.32, ease: [0.22, 1, 0.36, 1] }],
    blur: ["Page blur behind (px)", [10, 0, 24, 1]],
    swap: ["Messages and steps settle", { type: "spring", visualDuration: 0.32, bounce: 0.1 }],
    think: ["Each thinking step (s)", [0.55, 0.1, 1.5, 0.05]],
    wordMs: ["Answer streams: ms per two words", [38, 10, 120, 2]],
    card: ["Chart card arrives", { type: "spring", visualDuration: 0.5, bounce: 0.08 }],
    draw: ["Chart draws in (the sweep; each tick eases on its own)", { type: "easing", duration: 1.5, ease: [0.45, 0, 0.55, 1] }],
    holdMs: ["Hold Space this long to talk (ms)", [220, 80, 600, 10]],
    voiceWordMs: ["Voice: ms per word heard", [230, 80, 500, 10]],
    floatAt: ["Drag this far to pop out (px)", [70, 20, 200, 5]],
    watchMs: ["Watched topic posts an update after (s)", [9, 2, 60, 1]],
    shift: ["Chat moves between full screen, dock and pop-out", { type: "easing", duration: 0.4, ease: [0.32, 0.72, 0, 1] }],
    fullCol: ["Full-screen chat: reading column (px)", [760, 560, 1000, 10]],
    fullGlass: ["Full-screen chat: background opacity", [1, 0.5, 1, 0.01]],
    morph: ["Full screen: open / close (card, type and chart together)", { type: "easing", duration: 0.45, ease: [0.5, 0, 0.15, 1] }],
    rebuildOn: ["Full screen: redraw chart after landing", false],
    rebuild: ["Full screen: redraw speed", { type: "easing", duration: 0.9, ease: [0.22, 1, 0.36, 1] }],
    flag: ["Trend flag follows the pointer (spring)", { type: "spring", visualDuration: 0.26, bounce: 0.06 }],
    grow: ["Hovered ticks / ring wedges grow to (×)", [1.16, 1, 1.5, 0.01]],
    ripple: ["Grow ripples along the run (ms per tick)", [4, 0, 20, 1]],
    tail: ["Space under the last message (px)", [120, 0, 320, 4]],
    actOpen: ["Answer actions: label pushes out", { type: "easing", duration: 0.34, ease: [0.32, 0.72, 0, 1] }],
    agentGapMs: ["Agents: time between each (ms)", [1300, 400, 4000, 50]],
    agentTypeMs: ["Agents: typing before they speak (ms)", [750, 200, 3000, 50]],
    gcSendMs: ["Google Chat: sending beat (ms)", [700, 200, 2000, 50]],
    gcUndoS: ["Google Chat: time to undo (s)", [5, 3, 30, 1]],
    gcReplyMs: ["Google Chat preview: reply pace (ms)", [2200, 600, 6000, 100]],
    aimIn: ["Point at a chart: glass fades on (s)", [0.32, 0.05, 1, 0.01]],
    aimOut: ["Point at a chart: glass fades off (s)", [0.18, 0.05, 1, 0.01]],
    aimSpin: ["Point at a chart: glass sheen lap (s)", [6, 1.5, 14, 0.1]],
    aimBand: ["Point at a chart: glass edge width (px)", [3, 1, 14, 0.5]],
    aimBlur: ["Point at a chart: glass blur (px)", [3, 0, 16, 0.5]],
    aimSheen: ["Point at a chart: sheen strength", [0.8, 0, 1, 0.01]],
    aimGlint: ["Point at a chart: glint at the cursor", [0.9, 0, 1, 0.01]],
    typeAnywhere: ["Keys go into the open chat even when its field isn't focused", true],
    obOn: ["First run: teach as you go", true],
    obKeep: ["First run: remember what's learned across reloads", false],
    obDwell: ["First run: rest on a chart this long before the ⌥ hint (ms)", [650, 200, 2000, 50]],
    obGap: ["First run: quiet time between ⌥ hints (s)", [6, 0, 30, 1]],
    obCap: ["First run: ⌥ hint shows at most (times)", [1, 1, 10, 1]],
    obWatchDelay: ["First run: offer Watch after the answer settles (s)", [1.2, 0, 5, 0.1]],
    obSpacing: ["First run: answers between offers", [2, 1, 5, 1]],
    obPeekMs: ["First run: topics strip opens itself for (ms)", [3600, 800, 8000, 100]],
  }, ".chat-shell"],
  askOutbound: ["▶ Chat: spike chart (Booked ARR · Outbound)", { type: "action" }],
  askYear: ["▶ Chat: tick chart (Path to $40M)", { type: "action" }],
  askLanes: ["▶ Chat: ring chart (Where Sales is behind)", { type: "action" }],
  askNrr: ["▶ Chat: tick chart (SMB renewals)", { type: "action" }],
  askScenario: ["▶ Chat: tick chart (scenario, all levers)", { type: "action" }],
  askArr: ["▶ Chat: bars (ARR movement)", { type: "action" }],
  askWin: ["▶ Chat: rings (Expansion win rate)", { type: "action" }],
  askLogos: ["▶ Chat: area (New logos)", { type: "action" }],
  askDemo: ["▶ Chat: ruler (Win rate from held demo)", { type: "action" }],
  askExp: ["▶ Chat: lines (Expansion ARR)", { type: "action" }],
  askTtv: ["▶ Chat: lollipops (Time to value)", { type: "action" }],
  replayIntro: ["▶ Replay page intro", { type: "action" }],
  firstRun: ["▶ Replay first run (onboarding)", { type: "action" }],
  replayHealth: ["▶ Replay Company health build-in", { type: "action" }],
  compactRow: ["Home: compact tile height past 8 (px)", [136, 110, 189, 1], ".kgrid"],
  fill12: ["▶ Home: fill to 12 tiles (8 pins)", { type: "action" }],
  fill8: ["▶ Home: 8 tiles (4 pins)", { type: "action" }],
  clearPins: ["▶ Home: clear pins", { type: "action" }],
  replayDetail: ["▶ Replay board chart", { type: "action" }],
};
const isFolder = (v) => v && typeof v === "object" && !Array.isArray(v) && !v.type;
const MOTION = (function build(spec) {
  const o = {};
  for (const [, [label, v]] of Object.entries(spec)) o[label] = isFolder(v) ? build(v) : v;
  return o;
})(SPEC);
const fromPanel = (spec, vals) => {
  const o = {};
  for (const [k, [label, v]] of Object.entries(spec)) o[k] = isFolder(v) ? fromPanel(v, (vals && vals[label]) || {}) : vals ? vals[label] : undefined;
  return o;
};
// label text (as DialKit renders it) → selector of what it moves; children inherit the folder's target
const DIAL_TARGETS = {};
const DIAL_FOLDERS = new Set(); // folder titles: the names shown when you tune an element
(function walk(spec, inherited) {
  for (const [, [label, v, t]] of Object.entries(spec)) {
    const tgt = t || inherited;
    const shown = label.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).trim();
    if (tgt) DIAL_TARGETS[shown] = tgt;
    if (isFolder(v)) { DIAL_FOLDERS.add(shown); walk(v, tgt); }
  }
})(SPEC, null);
for (const [, [l, , t]] of Object.entries(INTRO_SPEC)) DIAL_TARGETS[l] = t;
const ACTION_KEYS = { [SPEC.askOutbound[0]]: "askOutbound", [SPEC.askYear[0]]: "askYear", [SPEC.askLanes[0]]: "askLanes", [SPEC.askNrr[0]]: "askNrr", [SPEC.askScenario[0]]: "askScenario", [SPEC.askArr[0]]: "askArr", [SPEC.askWin[0]]: "askWin", [SPEC.askLogos[0]]: "askLogos", [SPEC.askDemo[0]]: "askDemo", [SPEC.askExp[0]]: "askExp", [SPEC.askTtv[0]]: "askTtv", [SPEC.replayIntro[0]]: "intro", [SPEC.firstRun[0]]: "firstRun", [SPEC.replayDetail[0]]: "detail", [SPEC.replayHealth[0]]: "health", [SPEC.fill12[0]]: "fill12", [SPEC.fill8[0]]: "fill8", [SPEC.clearPins[0]]: "clearPins" };
let _motionOpts = null;
const MOTION_OPTS = (actions) => _motionOpts || (_motionOpts = { id: "north-motion", onAction: (path) => { const a = ACTION_KEYS[path.split(".").pop()]; if (a) actions.current[a](); } });

// Hovering or dragging a control in the panel spotlights what it changes.
function useDialSpotlight() {
  useEffect(() => {
    let lit = [];
    const clear = () => { lit.forEach((el) => el.classList.remove("dial-spot")); lit = []; document.documentElement.classList.remove("dial-spotting"); };
    const SEL = ".dialkit-timeline-row, .dialkit-timeline-label, .dialkit-slider-wrapper, .dialkit-labeled-control, .dialkit-button, .dialkit-folder";
    const LAB = ".dialkit-timeline-label, .dialkit-slider-label, .dialkit-labeled-control-label, .dialkit-folder-title";
    // walk outward (slider → its spring/easing control → folder) until a label names something on the page
    const keyFor = (el) => {
      for (let row = el.closest(SEL); row; row = row.parentElement && row.parentElement.closest(SEL)) {
        const t = row.matches(".dialkit-timeline-label") ? row : row.querySelector(LAB) || row;
        const lab = (t.textContent || "").trim();
        const key = Object.keys(DIAL_TARGETS).find((k) => lab.startsWith(k));
        if (key) return key;
      }
      return null;
    };
    const over = (e) => {
      if (!e.target.closest || !e.target.closest('[class*="dialkit"]')) return;
      const key = keyFor(e.target);
      clear();
      if (!key) return;
      lit = [...document.querySelectorAll(DIAL_TARGETS[key])];
      lit.forEach((el) => el.classList.add("dial-spot"));
      if (lit.length) document.documentElement.classList.add("dial-spotting");
    };
    const out = (e) => { if (!e.relatedTarget || !e.relatedTarget.closest || !e.relatedTarget.closest('[class*="dialkit"]')) clear(); };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    return () => { document.removeEventListener("pointerover", over); document.removeEventListener("pointerout", out); clear(); };
  }, []);
}

// routes ↔ hashes (plain ASCII slugs so the artifact link carries them)
const DEPT_SLUGS = { Marketing: "marketing", Sales: "sales", Onboarding: "onboarding", "Customer Value": "customer-value", RevOps: "revops", "Product & Eng": "product-eng" };
const hashFor = (pg) => pg === "health" ? "#company-health" : pg === "arr" ? "#arr-movement" : pg === "agents" ? "#agents" : pg === "meetings" ? "#meetings" :  pg.startsWith("metric:") ? "#metric-" + pg.slice(7) : pg.startsWith("dept:") ? "#dept-" + (DEPT_SLUGS[pg.slice(5)] || "sales") : location.pathname + location.search;
function pageFromHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (h === "company-health") return "health";
  if (h === "agents") return "agents";
  if (h === "meetings") return "meetings";
  if (h === "arr-movement") return "arr";
  if (/^metric-\d+-\d+$/.test(h)) { const [r, c] = h.slice(7).split("-").map(Number); if (LANES[r] && LANES[r][3][c]) return `metric:${r}-${c}`; }
  if (h.startsWith("dept-")) return "health";
  if (false) { const sl = h.slice(5).toLowerCase(); const d = Object.keys(DEPT_SLUGS).find((k) => DEPT_SLUGS[k] === sl || k.toLowerCase() === sl); return d ? "dept:" + d : "health"; }
  return "home";
}

// if one part of a page ever fails to draw, show a quiet note in its place instead of blanking the app
class Safe extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err) { console.error("[North] part of the page failed to draw", err); }
  componentDidUpdate(prev) { if (prev.k !== this.props.k && this.state.err) this.setState({ err: null }); }
  render() { return this.state.err ? <div className="safe-note">This part couldn’t load. <button onClick={() => this.setState({ err: null })}>Try again</button></div> : this.props.children; }
}

function App() {
  const who = useWho(), setWho = setSeat; // prototype: whose seat you're viewing from (the account menu at the foot of the sidebar)
  // ---- DialKit: interaction motion (springs/easings for everything that responds to the user)
  const [replayDetail, setReplayDetail] = useState(0);
  const intro = fromTimeline(useDialTimeline("Intro", INTRO, INTRO_OPTS));
  const PINNED = { current: { opacity: 1, y: 0 } };
  useEffect(() => { if (REDUCED) intro.seek(intro.duration); }, []);

  const actions = useRef({});
  const [page, setPage] = useState(() => { try { return pageFromHash(); } catch (e) { return "home"; } });
  // the sidebar marks where you went from the sidebar; drilling in from a page keeps it there (the breadcrumb shows the rest)
  const [root, setRoot] = useState(() => (page.startsWith("metric:") ? "health" : page));
  const rootRef = useRef(root); rootRef.current = root;
  useEffect(() => { try { history.replaceState({ pg: page, root }, "", location.href); } catch (e) {} }, []);
  const [focus, setFocus] = useState(null);
  const [arrOv, setArrOv] = useState(null), [arrBack, setArrBack] = useState(null);
  // Home's chart under ARR movement: once the view has covered it, its bars go down; as the view folds back into the card they
  // rise again the way they did when Home loaded (months in order, then the plan line, then the projections)
  const [arrRp, setArrRp] = useState(1), arrRpA = useRef(null);
  const arrRpFirst = useRef(true);
  useEffect(() => { if (arrRpFirst.current) { arrRpFirst.current = false; return; } arrRpA.current && arrRpA.current.stop(); if (arrOv) { const t = setTimeout(() => setArrRp(0), 700); return () => clearTimeout(t); }
    arrRpA.current = mAnimate(0, 1, { duration: 1.4, ease: [0.32, 0.72, 0, 1], delay: 0.14, onUpdate: setArrRp }); return () => arrRpA.current && arrRpA.current.stop(); }, [!!arrOv]); // ARR movement opened over Home, grown out of its chart
  const [arrFocus, setArrFocus] = useState(null), [arrFrom, setArrFrom] = useState(null); // arrFrom: "home" when Home's chart opened it, so it can fold back
  useEffect(() => { if (page !== "arr" && arrFrom) setArrFrom(null); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
  const [goalOpen, setGoalOpen] = useState(null), goalRef = useRef(null); useGoalStore();
  // what needs her sits in the header band: the band's height follows the list frame by frame (no lag behind the rows as they
  // open or leave), and North's ambient working text stays above the list, never behind it
  const ndObs = useRef(null);
  const ndRef = (el) => { const st = document.documentElement.style; if (ndObs.current) { ndObs.current.disconnect(); ndObs.current = null; }
    if (!el) { st.removeProperty("--nd-h"); return; }
    const set = () => st.setProperty("--nd-h", `${Math.round(el.getBoundingClientRect().height + 20)}px`); ndObs.current = new ResizeObserver(set); ndObs.current.observe(el); set(); };
  const goalW = () => (goalRef.current ? goalRef.current.getBoundingClientRect().width : 1119); // her own moves change how tall an open goal grows
  // Beyonce's goal tiles open on their own, beside her number tiles // "table" when Home's card asked for the table
  // shared page actions: what's on Monday sync, what's pinned to Home
  const load = (k) => { try { return new Set(JSON.parse(localStorage.getItem(k) || "[]")); } catch (e) { return new Set(); } };
  const [sync, setSync] = useState(() => load("north.sync"));
  // pins are per seat: what Beyonce keeps on her Home isn't on Sam's
  // every visit starts from Home's own four tiles: pins last for the session, not between visits (prototype)
  const [pinsBy, setPinsBy] = useState(() => { try { localStorage.removeItem("north.pins"); } catch (e) {} return { seth: new Set() }; });
  const pins = pinsBy[who] || NO_PINS;
  const setPins = (v) => setPinsBy((o) => ({ ...o, [who]: typeof v === "function" ? v(o[who] || new Set()) : v }));
  useEffect(() => { try { localStorage.setItem("north.sync", JSON.stringify([...sync])); } catch (e) {} }, [sync, pinsBy]);
  const flip = (set, id, on) => { const n = new Set(set); (on ?? !n.has(id)) ? n.add(id) : n.delete(id); return n; };
  // each seat arranges its own Home: the order of its tiles and which of its own four it has taken off (they come back by name).
  // Pins say what's added; this says where everything sits. Like pins, it lasts the session (prototype)
  const [layBy, setLayBy] = useState({});
  const lay = layBy[who] || NO_LAY;
  const setLay = (f) => setLayBy((o) => ({ ...o, [who]: f(o[who] || NO_LAY) }));
  const homeIds = useMemo(() => homeList(who, pins, lay), [who, pins, lay]);
  const [replayHealth, setReplayHealth] = useState(0);
  actions.current.health = () => { setPage("health"); setReplayHealth((k) => k + 1); };
  actions.current.intro = () => { setHomeBack(false); intro.replay(); };
  actions.current.detail = () => setReplayDetail((k) => k + 1);
  const D = fromPanel(SPEC, useDialKit("Motion", MOTION, MOTION_OPTS(actions)));
  useDialSpotlight();

  const E = useMemo(() => bezier(D.data.elementEase.ease), [JSON.stringify(D.data.elementEase.ease)]);
  const ctx = { E, spread: D.data.stagger, D };
  const M = { ...D, ctx };
  // ask bar docks into the top bar the moment the top bar starts covering it, and comes back once it's clear again
  const ask = useAsk(M, SEAT_PROMPTS[who] ? SEAT_PROMPTS[who].home : PROMPTS);
  // menus and hovers everywhere read the same two dials
  useEffect(() => { const st = document.documentElement.style, o = M.menu.open; st.setProperty("--menu-d", `${o.type === "easing" ? o.duration : 0.62}s`); st.setProperty("--menu-e", o.type === "easing" && o.ease ? `cubic-bezier(${o.ease.join(",")})` : "cubic-bezier(.16,1,.3,1)"); }, [M.menu.open]);
  useEffect(() => { window.__northGlide = M.hover.glide; installHover(); }, [M.hover.glide]);
  window.__northShimmer = M.shimmer; // the step light reads these every frame
  window.__northThink = M.think; // the agent-working glyph reads these every frame, so dragging a dial changes it live
  const agentAsk = useAsk(M, SEAT_PROMPTS[who] ? SEAT_PROMPTS[who].agents : AGENT_PROMPTS); // the Agents page: one North field, same as Home's
  // q: how much of the page ask bar has slid under the top bar (0 = fully visible, 1 = fully covered)
  const [q, setQ] = useState(0);
  // the top-bar copy fades in once half the page copy is under the top bar (and out when it's half back), on its own easing so a fast flick never pops
  const [inNav, setInNav] = useState(false);
  useEffect(() => { setInNav((v) => (v ? q > 0.35 : q > 0.55)); }, [q]);
  const barRef = useRef(null), slotRef = useRef(null), scrollRef = useRef(null);
  // on Company health the top bar starts as part of the page and takes its own colour once content scrolls under it
  const [scrolled, setScrolled] = useState(false);
  const onScroll = () => {
    const st = scrollRef.current ? scrollRef.current.scrollTop : 0;
    setScrolled((v) => (v ? st > 2 : st > 8));
    if (!barRef.current || !slotRef.current) return;
    const edge = barRef.current.getBoundingClientRect().bottom;
    const f = slotRef.current.querySelector(".composer").getBoundingClientRect();
    setQ(clamp((edge - f.top) / f.height));
  };
  const [openId, setOpenId] = useState(null), ipOn = useIP();
  const regionRef = useRef(null);
  // every page is a real history entry: Back returns to where you were, scroll position included
  const tops = useRef({});
  const pendingTop = useRef(0);
  const pageRef = useRef(page); pageRef.current = page;
  const show = (pg, top = 0, rt = rootRef.current) => {
    // back to Home from another page: Home builds itself on again (the sidebar and top bar stay put)
    if (pg === "home" && pageRef.current !== "home") { setHomeBack(true); requestAnimationFrame(() => intro.replay()); }
    setRoot(rt);
    if (!pg.startsWith("dept:")) setFocus(null);
    setOpenId(null); setQ(0); setInNav(false); setScrolled(top > 8);
    pendingTop.current = top;
    setPage(pg);
  };
  useEffect(() => { window.__northNav = (pg) => gotoRef.current?.(pg, pg); }, []);
  const gotoRef = useRef(null);
  const goto = (pg, rt = rootRef.current) => {
    if (pg === page) { if (rt !== root) setRoot(rt); return; }
    if (scrollRef.current) tops.current[page] = scrollRef.current.scrollTop;
    show(pg, 0, rt);
    try { history.pushState({ pg, root: rt }, "", hashFor(pg)); } catch (e) {}
    if (document.documentElement.classList.contains("chat-full")) chatApi.current?.hide?.();
  };  gotoRef.current = goto;

  useEffect(() => {
    const onPop = (e) => {
      const pg = pageFromHash(); const cur = pageRef.current;
      const rt = (e.state && e.state.root) || (pg.startsWith("metric:") ? "health" : pg);
      if (pg === cur) { setRoot(rt); return; }
      if (scrollRef.current) tops.current[cur] = scrollRef.current.scrollTop;
      show(pg, tops.current[pg] || 0, rt);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  // department pages are parked until they're designed: anything that pointed at a department
  // (a lane name, "Open …") now opens that metric's own page — a lane opens its outcome metric
  const go = (dept, r, c) => {
    if (dept === "health") { goto("health"); return; }
    goto(`metric:${r}-${c ?? 0}`);
  };
  // hand a question to North: the ask bar lives on Home, so go there with it filled in and focused
  // every question goes to the chat: with text it asks, without it just opens
  const chatApi = useRef(null);
  const [homeBack, setHomeBack] = useState(false);
  const chromeIntro = homeBack ? Object.create(intro, { frame: { get: () => PINNED } }) : intro;
  const [readyN, setReadyN] = useState(0); useEffect(() => { const f = (e) => setReadyN((e.detail && e.detail.n) || 0); addEventListener("north:ready", f); return () => removeEventListener("north:ready", f); }, []);
  const [needN, setNeedN] = useState(0); useEffect(() => { const f = (e) => setNeedN((e.detail && e.detail.n) || 0); addEventListener("north:need", f); return () => removeEventListener("north:need", f); }, []);
  const [watchN, setWatchN] = useState(0); // how many topics the chat is watching (the sidebar's Watching row)
  const [moved, setMoved] = useState({ items: [], quiet: 0 });
  const [goneNews, setGoneNews] = useState(() => new Set()); // lines dismissed from Home's news (the shortcuts come back when none are left)
  const newsItems = moved.items.filter((it) => !goneNews.has(it.tp)).slice(0, 3);
 // what moved in what you watch → Home's "what changed"
  useEffect(() => { const f = (e) => { const d = e.detail || {}; setWatchN(d.n || 0); setMoved({ items: d.items || [], quiet: d.quiet || 0 }); }; addEventListener("north:watching", f); return () => removeEventListener("north:watching", f); }, []);
  useEffect(() => {
    const mv = (e) => { const b = e.target.closest && e.target.closest(".btn-pri, .cc-btn, .voice, .rt-b.is-pri, .ar-go"); if (!b) return; const r = b.getBoundingClientRect(); b.style.setProperty("--mx", `${e.clientX - r.left}px`); b.style.setProperty("--my", `${e.clientY - r.top}px`); };
    document.addEventListener("pointermove", mv, { passive: true }); return () => document.removeEventListener("pointermove", mv);
  }, []);
  const askNorth = (q) => { const c = chatApi.current; if (!c) return; q ? c.ask(q) : c.open(); }; // an Ask North button: about this → docked
  const talkNorth = (q) => { const c = chatApi.current; if (!c) return; c.talk(q); };
  // anything on the page can start a conversation (an account's "Ask Riley"): it goes to the chat as if typed there
  useEffect(() => { const h = (e) => e.detail && e.detail.text && talkNorth(e.detail.text); addEventListener("north:talk", h); return () => removeEventListener("north:talk", h); }, []);
  // the chart you ask about from the bubble lands in the thread as the chart itself: its six months, live (hover, tooltips)
  CARRY.render = (id, w, p) => { const m = [...METRICS, ...CH_METRICS, ...Object.values(CHAT_TILES)].find((x) => x.id === id); return m ? <CarryPlot m={m} w={w} p={p} /> : null; }; // Home's field, the sidebar row: just talking → full screen
  useEffect(() => { const on = (e) => goto(e.detail, e.detail); window.addEventListener("north:go", on); return () => window.removeEventListener("north:go", on); });
  actions.current.fill12 = () => { goto("home", "home"); setPins(new Set(["ch-grr", "ch-avg", "ch-pay", "ch-gtm", "1-0", "5-3", "2-3", "0-1"])); };
  actions.current.fill8 = () => { goto("home", "home"); setPins(new Set(["ch-grr", "ch-gtm", "1-0", "5-3"])); };
  actions.current.clearPins = () => setPins(new Set());
  actions.current.firstRun = () => { chatApi.current && chatApi.current.replayFirstRun(); goto("home", "home"); };
  actions.current.askOutbound = () => talkNorth("Why is Outbound behind?");
  actions.current.askYear = () => talkNorth("Path to $40M");
  actions.current.askLanes = () => talkNorth("Which lanes are behind?");
  actions.current.askNrr = () => talkNorth("Which SMB renewals are at risk?");
  actions.current.askScenario = () => talkNorth("Run the scenario with all three changes");
  actions.current.askArr = () => talkNorth("How is total ARR trending?");
  actions.current.askWin = () => talkNorth("What's our expansion win rate?");
  actions.current.askLogos = () => talkNorth("How many new logos this month?");
  actions.current.askDemo = () => talkNorth("What's the win rate from held demos?");
  actions.current.askExp = () => talkNorth("How is expansion ARR doing?");
  actions.current.askTtv = () => talkNorth("What's our time to value?");
  ask.onPoint = () => chatApi.current && chatApi.current.point();
  agentAsk.onAsk = (q) => askNorth(q); agentAsk.onPoint = ask.onPoint; // from the Agents page the chat docks beside it: you stay where you are
  // Home's field: type freely; Enter or the button hands it to the chat (full screen). An @name there brings that person into
  // the conversation: one chat, with North, the agents and teammates in it
  ask.onAsk = talkNorth;
  const ownOf = () => stapleIds(who);
  const addHome = (t) => { if (ownOf().includes(t)) setLay((L) => ({ ...L, hidden: L.hidden.filter((x) => x !== t) })); else setPins((s0) => flip(s0, t, true)); };
  const removeHome = (t) => { if (ownOf().includes(t)) setLay((L) => ({ ...L, hidden: [...L.hidden.filter((x) => x !== t), t] })); else setPins((s0) => flip(s0, t, false)); };
  const toggleHome = (id) => { const t = tileOf(id); homeIds.includes(t) ? removeHome(t) : addHome(t); };
  const moveHome = (t, where) => setLay((L) => { const cur = homeList(who, pins, L); if (!cur.includes(t)) return L; const rest = cur.filter((x) => x !== t);
    let at = where === "first" ? 0 : where === "last" ? rest.length : typeof where === "number" ? Math.max(0, Math.min(rest.length, where)) : null;
    if (at == null && where && (where.before || where.after)) { const r = rest.indexOf(tileOf(where.before || where.after)); if (r < 0) return L; at = where.before ? r : r + 1; }
    if (at == null && where && where.swap) { const o = tileOf(where.swap), i = cur.indexOf(t), j = cur.indexOf(o); if (j < 0) return L; const n = [...cur]; n[i] = o; n[j] = t; return { ...L, order: n }; }
    if (at == null) return L; const n = [...rest]; n.splice(at, 0, t); return { ...L, order: n }; });
  const actionsValue = {
    sync, pins, M, ask: askNorth,
    toggleSync: (id) => setSync((s0) => flip(s0, id)),
    syncAll: (ids, on) => setSync((s0) => { let n = s0; ids.forEach((id) => (n = flip(n, id, on))); return n; }),
    // one way on and off Home for everything on it: a pin comes and goes; a seat's own tile is taken off and can be put back
    togglePin: (id) => toggleHome(id),
    homeIds, onHome: (id) => homeIds.includes(tileOf(id)), toggleHome: (id) => toggleHome(id),
    addHome: (id) => addHome(tileOf(id)), removeHome: (id) => removeHome(tileOf(id)),
    // where: "first" | "last" | { before: id } | { after: id } | { swap: id }
    moveHome: (id, where) => moveHome(tileOf(id), where),
  };
  const [flash, setFlash] = useState(false);
  const closeMetric = () => setOpenId(null);
  actions.current.attention = () => {
    setOpenId(null);
    document.getElementById("attention")?.scrollIntoView({ behavior: "smooth", block: "center" });
    setFlash(false); requestAnimationFrame(() => setFlash(true)); setTimeout(() => setFlash(false), 1600);
  };
  const sec = (c) => {
    const v = c.current, A = M.arrive;
    return {
      opacity: v.opacity,
      y: (v.y ?? 0) * A.typeDrop / 12,
      scale: 1 + ((v.scale ?? 1) - 1) * (A.chartScale - 1) / 0.08,
      filter: v.blur ? `blur(${(v.blur * A.typeBlur) / 8}px)` : "none",
      transformOrigin: "50% 40%",
    };
  };

  return (
    <MotionCtx.Provider value={ctx}><ActionsCtx.Provider value={actionsValue}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="grain" x="-25%" y="-25%" width="150%" height="150%" filterUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="7" result="t" />
          <feColorMatrix in="t" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="g0" />
          <feComponentTransfer in="g0" result="g"><feFuncR type="linear" slope="0.5" intercept="0.05" /><feFuncG type="linear" slope="0.5" intercept="0.05" /><feFuncB type="linear" slope="0.5" intercept="0.05" /></feComponentTransfer>
          <feBlend in="g" in2="SourceGraphic" mode="soft-light" result="b" />
          <feComposite in="b" in2="SourceGraphic" operator="in" />
        </filter>
        <filter id="grainLite" x="-25%" y="-25%" width="150%" height="150%" filterUnits="objectBoundingBox" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="7" result="t" />
          <feColorMatrix in="t" type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1" result="g0" />
          <feComponentTransfer in="g0" result="g"><feFuncR type="linear" slope="0.6" intercept="0.22" /><feFuncG type="linear" slope="0.6" intercept="0.22" /><feFuncB type="linear" slope="0.6" intercept="0.22" /></feComponentTransfer>
          <feBlend in="g" in2="SourceGraphic" mode="soft-light" result="b" />
          <feComposite in="b" in2="SourceGraphic" operator="in" />
        </filter>
      </svg>
      <div className="app">
        <Sidebar M={M} who={who} setWho={setWho} intro={chromeIntro} page={root} onNav={(pg) => { if (document.documentElement.classList.contains("chat-full")) chatApi.current && chatApi.current.hide(); goto(pg, pg); }} syncN={sync.size} onAsk={talkNorth}
          watchN={watchN} readyN={readyN} needN={who === "sam" ? needN : 0} onWatch={(r) => chatApi.current && chatApi.current.watchFly(r)} />
        <main className={`main seat-${who}`}>
          {page === "agents" ? <div className="agx"><AgentsWorkspace embedded onAsk={(q) => (q ? chatApi.current?.ask(q) : chatApi.current?.open())} bar={false} /></div> : <>
          <TopBar M={M} intro={chromeIntro} flat={!scrolled || page === "arr"} home={page === "home"} bare={page === "arr" || page === "meetings"} chips={false} barRef={barRef} onAttention={() => actions.current.attention()} dock={
            <motion.div className="dock" aria-hidden={!inNav} initial={false}
              animate={inNav ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 0, y: 3, filter: "blur(2px)" }}
              transition={toMotion(M.composer.navFade)} style={{ pointerEvents: inNav ? "auto" : "none" }}>
              <Composer M={M} ask={ask} docked />
            </motion.div>} />
          <motion.div className="scroll" layoutScroll ref={scrollRef} onScroll={onScroll}><div className={`content${page !== "home" ? " ch-page" : ""}${page === "health" ? " ch-health" : ""}${page === "arr" ? " ch-open" : ""}`}>
            <AnimatePresence mode="wait" initial={false} onExitComplete={() => { if (scrollRef.current) scrollRef.current.scrollTop = pendingTop.current; }}>
            {page === "health" ? (
              <motion.div key="health" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={toMotion(M.health.pageSwap)}>
                <Safe k={page}><CompanyHealth M={M} scrollRef={scrollRef} replay={replayHealth} Tile={MetricTile} metrics={CH_METRICS} go={go} /></Safe>
              </motion.div>
            ) : page.startsWith("metric:") ? (
              <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={toMotion(M.health.pageSwap)}>
                <Safe k={page}><MetricPage M={M} scrollRef={scrollRef} r={+page.slice(7).split("-")[0]} c={+page.slice(7).split("-")[1]} go={go} replay={replayHealth} /></Safe>
              </motion.div>
            ) : page === "arr" ? (
              <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={toMotion(M.health.pageSwap)}>
                <Safe k={page}><ArrPage M={M} focus={arrFocus} onBack={arrFrom ? () => { setArrFrom(null); goto("home", "home"); setTimeout(() => { const h = document.querySelector(".k-hero"); h && h.scrollIntoView({ block: "center", behavior: "smooth" }); }, 450); } : undefined}
                  numbers={<motion.div className="top is-sam is-arr" ref={regionRef} initial={false} animate={{ height: openId && openId.startsWith("arr-") ? ARR_OPEN_H : "auto" }} transition={openId && openId.startsWith("arr-") ? toMotion(M.open.expand) : toMotion(M.open.collapse)}><KeyMetrics M={M} who={who} intro={intro} regionRef={regionRef} tiles={["arr-oct", "arr-left", "arr-dec"]} cols={3} openH={ARR_OPEN_H} label="ARR movement" onGo={(pg) => goto(pg, pg)} openId={openId} onOpen={(id) => setOpenId((o) => (o === id ? null : id))} onClose={() => setOpenId(null)} /></motion.div>} /></Safe>
              </motion.div>
            ) : page === "meetings" ? (
              <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={toMotion(M.health.pageSwap)}>
                <Safe k={page}><MeetingsPage M={M} /></Safe>
              </motion.div>
            ) : page === "files" ? (
              <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={toMotion(M.health.pageSwap)}>
                <Safe k={page}><FilesPage /></Safe>
              </motion.div>
            ) : page === "space:nb" ? (
              <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={toMotion(M.health.pageSwap)}>
                <Safe k={page}><NewBusinessSpace M={M} onAsk={(t) => talkNorth(t)} ask={<Composer M={M} ask={{ ...ask, P: ["Ask anything in New business, or @ a teammate…"], pi: 0 }} />}
                  numbers={<div className="top is-sam" ref={regionRef}><KeyMetrics M={M} who={who} intro={intro} regionRef={regionRef} onGo={(pg) => goto(pg, pg)} openId={openId} onOpen={(id) => setOpenId((o) => (o === id ? null : id))} onClose={() => setOpenId(null)} /></div>} /></Safe>
              </motion.div>
            ) : page.startsWith("dept:") ? (
              <motion.div key={page} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={toMotion(M.health.pageSwap)}>
                <Safe k={page}><Department M={M} scrollRef={scrollRef} dept={page.slice(5)} focus={focus} go={go} replay={replayHealth}
                  numbers={(ids) => <div className="top is-sam is-dept" ref={regionRef}><KeyMetrics M={M} who={who} intro={intro} regionRef={regionRef} tiles={ids} label={`${page.slice(5)} goals`} onGo={(pg) => goto(pg, pg)} openId={openId} onOpen={(id) => setOpenId((o) => (o === id ? null : id))} onClose={() => setOpenId(null)} /></div>} /></Safe>
              </motion.div>
            ) : (
            who === "sam" ? (
            // Sam's Home is the exploration ground: his month as a board, no brief (Beyonce's Home below stays as it is)
            <motion.div key="home-sam" className="home-page is-field" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={toMotion(M.health.pageSwap)}>
              {/* the same header as Beyonce's: the living texture behind the greeting, which answers to hover and click */}
              <motion.div className="hw-wrap"><HomeWork onAsk={(t) => talkNorth(t)} /></motion.div>
              <SamField M={M} onAsk={(t) => talkNorth(t)} ask={<div className="home-ask"><div><motion.div ref={slotRef} className="ask-slot"><Composer M={M} ask={ask} /></motion.div></div></div>}
                numbers={<div className="top is-sam" ref={regionRef}><KeyMetrics M={M} who={who} intro={intro} regionRef={regionRef} onGo={(pg) => goto(pg, pg)} openId={openId} onOpen={(id) => setOpenId((o) => (o === id ? null : id))} onClose={() => setOpenId(null)} /></div>} />
            </motion.div>
            ) : (
            <motion.div key="home" className={`home-page${ipOn && who === "seth" ? " is-ip" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={toMotion(M.health.pageSwap)}>
            <HeadStay on={false}>
            <motion.div className="hw-wrap" style={sec(intro.heading)}><HomeWork onAsk={(t) => talkNorth(t)} /></motion.div>
            <motion.div className="hello" style={sec(intro.heading)}>
              {/* In progress, opened, takes the header: its name where the greeting was, and the way back on the buttons' edge */}
              <AnimatePresence mode="popLayout" initial={false}>{ipOn && who === "seth"
                ? <motion.div key="ip" className="hello-ip" initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.16 } }} transition={{ type: "spring", visualDuration: 0.36, bounce: 0.1 }}>
                    <h1>In Progress</h1>
                    <motion.button type="button" className="rt-b hello-close" title="Close (Esc)" whileTap={{ scale: 0.97 }} onClick={() => setIP(false)}>Close</motion.button></motion.div>
                : <motion.h1 key="hi" initial={{ opacity: 0, y: 10, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6, filter: "blur(4px)", transition: { duration: 0.16 } }} transition={{ type: "spring", visualDuration: 0.36, bounce: 0.1 }}>Good Morning {(PEOPLE.find((p) => p.id === who) || PEOPLE[0]).greet}</motion.h1>}</AnimatePresence>
            </motion.div>
            {/* the same chat as the column: while the chat is open, Home's ask field folds away */}
            <div className="home-ask"><div>
            <motion.div ref={slotRef} className="ask-slot" style={sec(intro.composer)}><Composer M={M} ask={ask} /></motion.div>
            {/* under the ask: just the shortcuts (watched-topic updates live in the sidebar's Watching, not here) */}
            {/* leadership's header is the ask and what needs her: no shortcut chips */}
            {who !== "seth" && <motion.div style={sec(intro.composer)}><Suggestions who={who} onPick={(t) => talkNorth(t)} onPast={() => talkNorth("")} /></motion.div>}
            </div></div>
            {/* leadership: what needs her sits in the header, under the ask, with its actions, and pushes the page down */}
            {who === "seth" && <motion.div className="nd-wrap" ref={ndRef} style={sec(intro.composer)}><NeedsYou onGoal={(id) => { setGoalOpen(id); goalRef.current && goalRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); }} /><Moving /></motion.div>}
            </HeadStay>
            <BandSizer />
            {who === "seth" ? <div className="lead-body is-flat">
              {/* leadership reads top to bottom: where the numbers are (the tiles, then the year), then each goal with the moves
                  that change it. One pass, no numbers-work-numbers. Both are Home's 2×2 grid, so a tile opens inside its four
                  and nothing on the page moves */}
              {/* what she's asked North to build for her Home sits first ("make a dash of the latest campaign") */}
              <CampaignBoard M={M} p={intro.boardDraw.current.p} replayKey={replayDetail} />
              <motion.div className="top is-lead" ref={regionRef}>
                <KeyMetrics M={M} who={who} intro={intro} regionRef={regionRef} cols={4} onGo={(pg) => goto(pg, pg)} openId={openId} onOpen={(id) => setOpenId((o) => (o === id ? null : id))} onClose={() => setOpenId(null)}
                  hero={<ArrChart M={M} p={Math.min(intro.chartDraw.current.p, arrRp)} big={["$35.75M", "ending ARR · 89% of the $40.03M plan"]} plotH={206} onOpen={(f) => { const el = document.querySelector(".k-hero"), r = el && el.getBoundingClientRect(); setArrOv({ focus: f || null, from: r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null }); }} />} />
              </motion.div>
              {/* her Q4 goals: their own shape, not another row of numbers. The goals on the left, what needs her across them on the
                  right (her breakdown: decide, hand off, sign off), and a line that says where the quarter stands */}
              <div className="gq-head"><h2 className="gq-h">Your Q4 goals</h2><span>Day 28 of 92 · 2 of 4 on pace</span></div>
              <motion.div className="top is-lead is-goals" ref={goalRef} initial={false} animate={{ height: goalOpen ? goalOpenH(goalOpen, goalW()) : "auto" }} transition={goalOpen ? toMotion(M.open.expand) : toMotion(M.open.collapse)}>
                <KeyMetrics M={M} who={who} intro={intro} regionRef={goalRef} tiles={GOAL_IDS} label="Q4 goals" openH={goalOpenH} onGo={(pg) => goto(pg, pg)} openId={goalOpen} onOpen={(id) => setGoalOpen((o) => (o === id ? null : id))} onClose={() => setGoalOpen(null)} />
              </motion.div>
              {/* her board, at the foot: what she keeps an eye on, added from the library */}
              <motion.div style={sec(intro.boardIn)}><Board M={M} p={intro.boardDraw.current.p} replayKey={replayDetail} items={DOC_BOARD} title="Your board" add="Add a file" first="d-portal" /></motion.div>
            </div> : <>
              <div className="top" ref={regionRef}>
                <KeyMetrics M={M} who={who} intro={intro} regionRef={regionRef} onGo={(pg) => goto(pg, pg)} openId={openId} onOpen={(id) => setOpenId((o) => (o === id ? null : id))} onClose={() => setOpenId(null)} />
                <motion.div className="you" initial={false} animate={{ opacity: openId ? 0 : 1 }} transition={{ duration: openId ? 0.2 : 0.22, delay: openId ? 0 : 0.08 }}>
                  {who !== "seth" && (() => { const q = SETTLE(stag(intro.railIn.current.p, 2, 6, M.railStagger)); return <Attention M={M} who={who} flash={flash} style={{ opacity: Math.min(1, q * 1.5), scale: 1 + (M.arrive.chartScale - 1) * (1 - q) }} />; })()}
                  {(() => { const q = SETTLE(stag(intro.railIn.current.p, 5, 6, M.railStagger)); return <Goals M={M} who={who} p={stag(intro.railDraw.current.p, 5, 6, M.railStagger)} style={{ opacity: Math.min(1, q * 1.5), scale: 1 + (M.arrive.chartScale - 1) * (1 - q) }} />; })()}
                </motion.div>
              </div>
            <motion.div className="year-chart" style={sec(intro.chartIn)}><ArrChart M={M} p={intro.chartDraw.current.p} onOpen={(f) => { setArrFocus(f || null); goto("arr", "arr"); }} /></motion.div>
            <motion.div style={sec(intro.boardIn)}><Board M={M} p={intro.boardDraw.current.p} replayKey={replayDetail} /></motion.div>
            </>}
            </motion.div>
            ))}
            </AnimatePresence>
          </div></motion.div>
          </>}
        </main>
      </div>
      <Chat M={M} api={chatApi} metrics={[...METRICS, ...CH_METRICS]} pageName={page === "files" ? "Files" : page === "arr" ? "ARR movement" : page === "space:nb" ? "New business" : page.startsWith("dept:") ? page.slice(5) : page === "health" ? "Company health" : page === "agents" ? "Agents" : page === "meetings" ? "Meetings" : page.startsWith("metric:") ? "this metric" : "Home"} />
      <VoiceLayer onAsk={(t) => talkNorth(t)} />
      {/* closing measures the card again, so the box folds back into where it is now, not where it was */}
      <AnimatePresence custom={arrBack}>{arrOv && <ArrOverlay key="ao" M={M} focus={arrOv.focus} from={arrOv.from} onClose={() => { const el = document.querySelector(".k-hero"), r = el && el.getBoundingClientRect(); setArrBack(r ? { left: r.left, top: r.top, width: r.width, height: r.height } : arrOv.from); setArrOv(null); }} />}</AnimatePresence>
      <FileHost names={(k) => (AG_N[k] ? AG_N[k].n : TP[k] ? TP[k].n : k === "sam" ? "Sam" : k)} />
      <DialRoot position="bottom-right" theme="dark" productionEnabled defaultOpen={false} />
      <DialTimeline theme="dark" productionEnabled defaultOpen={false} />
      <TuneLayer targets={DIAL_TARGETS} folders={DIAL_FOLDERS} introId="north-intro" onReplay={() => actions.current.intro()} />
    </ActionsCtx.Provider></MotionCtx.Provider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
