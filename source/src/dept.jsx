// Department page — what a lane name, an agenda row or "Open Sales" leads to.
// Built only from parts already in the system: the Company health header, the page filters,
// scoreboard-style metric cards (faint preview → live), the home open-card chart and our segment bars.
import { Stack } from "./stack.jsx";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { C, clamp, stag, win, toMotion, useReplay, prefersReduced } from "./lib.js";
import { Segments, GeoCtx, geo } from "./open-charts.jsx";
import { AskButton, SyncButton } from "./actions.jsx";
import { SETTLE, LANES, SC, TXT, status, Ring, Mini, OWNERS, metricFor, chartFor, lensesFor, FSegSmall, PageFilters, TopCrumbs, askFor, GREEN } from "./health.jsx";
import { createPortal } from "react-dom";
import { AGENTS, AgentMark, RowHover } from "./agents.jsx";
import { talk, PEOPLE } from "./team-talk.js";
import { PHOTOS } from "./photos.js";
import { FILES, showFile, Preview, SlideThumb } from "./files.jsx";
import { Cover } from "./covers.jsx";
import { getWho } from "./seat.js";
const andList = (a) => (a.length < 3 ? a.join(" and ") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`);

const REDUCED = prefersReduced();
// each department's home: its lanes (from Company health), the people in it, and what else is its own.
// Onboarding is the Value Delivery lane (time to value, Felix activations); RevOps has no metrics connected yet, and says so
export const DEPTS = {
  Marketing: { score: 100, lead: "Lisa owns the numbers · Paul owns PMM", lanes: ["Inbound"], people: ["lisa", "paul"] },
  Sales: { score: 75, lead: "Heather (VP Sales) · Caleb (SDR Mgr)", lanes: ["Outbound", "New Business", "Expansion"], people: ["heather", "sam"] },
  Onboarding: { score: 80, lead: "PD owns the numbers", lanes: ["Value Delivery"], people: ["jordan"] },
  "Customer Value": { score: 91, lead: "PD owns the numbers · Rick on renewals", lanes: ["Customer Value"], people: ["jordan"] },
  RevOps: { score: null, lead: "Owns HubSpot and the data every number here comes from", lanes: [], people: [], match: /hubspot/i },
  "Product & Eng": { score: 92, lead: "Dustin owns the numbers", lanes: ["Product & Eng"], people: ["dustin"] },
};
const scoreColor = (v) => (v >= 85 ? GREEN.deep : v >= 70 ? "#744ccb" : C.alert);
const verdict = (v) => (v >= 85 ? "On pace" : v >= 70 ? "Behind" : "Off plan");
const seeded = (str) => { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909)) >>> 0) / 4294967296; };

// one metric card: the scoreboard card (label, value, faint preview chart, footer); the selected one wakes up
function LaneCard({ m, sel, onPick, q, p, E }) {
  const [hov, setHov] = useState(false);
  const S = m.series;
  const c = S ? { kind: S.line ? "line" : "bars", vals: S.vals, lo: S.lo, hi: S.hi, ticks: S.ticks.filter((t) => t > S.lo), label: `${m.lane}${m.n}` } : null;
  return (
    <motion.button className={`card scard dcard${sel ? " is-sel" : ""}`} onClick={onPick} aria-pressed={sel}
      onPointerEnter={() => setHov(true)} onPointerLeave={() => setHov(false)}
      style={{ opacity: Math.min(1, q * 1.5), scale: 1 + 0.06 * (1 - q) }}>
      <div className="surface">
        <span className="sc-lab">{m.n}</span>
        <span className="sc-v" style={{ color: m.v === "—" ? C.mute : C.navy }}>{m.v}</span>
        <div className="sc-chart">{c ? <Mini c={c} p={p} live={sel || hov} E={E} /> : <span className="dc-none">No data connection yet</span>}</div>
      </div>
      <div className="sc-foot"><span>{m.foot}</span><b style={{ color: m.st === "on" ? C.navy : TXT[m.st] }}>{m.p != null ? m.s : ""}</b></div>
      {sel && <motion.span className="dc-tab" initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ type: "spring", visualDuration: 0.36, bounce: 0 }} />} {/* appears under the card you chose: never slides over from the last one */}
    </motion.button>
  );
}

export function segRows(m) {
  if (!m.pv) return null;
  const rnd = seeded(m.lane + m.n + "seg");
  if (m.pv.pct) {
    const a = m.pv.n * (1.02 + rnd() * 0.06), b = m.pv.n * (0.8 + rnd() * 0.1);
    return { rows: [["Medium+", a], ["Ind & Small", b]], scale: (v) => v / (Math.max(a, b, m.tgt || 0) * 1.2), fmt: m.pv.fmt };
  }
  const sm = 0.08 + rnd() * 0.2, un = rnd() < 0.5 ? 0 : 0.01;
  const rows = [["Medium+", m.pv.n * (1 - sm - un)], ["Ind & Small", m.pv.n * sm], ["Unknown size", m.pv.n * un]].map(([k, v]) => [k, v, `${Math.round((v / m.pv.n) * 100)}%`]);
  return { rows, scale: (v) => v / m.pv.n, fmt: m.pv.fmt };
}

function LaneDetail({ m, M }) {
  const lenses = lensesFor(m);
  const [lens, setLens] = useState("monthly");
  useEffect(() => setLens("monthly"), [m.n]);
  const cp = useReplay(m.lane + m.n + lens, M.open.draw, { delay: 0.1, reduced: REDUCED });
  const { chart, key, mk } = chartFor(m, lens, cp);
  const wrap = useRef(null);
  const [cw, setCw] = useState(700);
  useLayoutEffect(() => { const ro = new ResizeObserver(() => wrap.current && setCw(wrap.current.getBoundingClientRect().width)); ro.observe(wrap.current); return () => ro.disconnect(); }, []);
  const seg = segRows(m);
  const sub = m.tgt != null ? `Last 6 months · ${m.kind === "ceiling" ? "ceiling" : "target"} ${m.pv.fmt(m.tgt)}` : "Last 6 months · no target set";
  return (
    <div className="dl-detail">
      <div className="card dl-chart">
        <div className="surface">
          <div className="card-head">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div key={m.n} className="dl-title" initial={{ opacity: 0, y: 6, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -4, filter: "blur(3px)" }} transition={toMotion(M.detail.swap)}>
                <h2>{m.n}</h2><p>{sub}</p>
              </motion.div>
            </AnimatePresence>
            {lenses.length > 1 && <FSegSmall value={lens} onChange={setLens} options={lenses} M={M} id={`dl-${m.lane}`} />}
          </div>
          <div className="dl-plot" ref={wrap}>
            {m.series ? (
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div key={m.n + lens} initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6, filter: "blur(3px)" }} transition={toMotion(M.open.lens)}>
                  <GeoCtx.Provider value={geo(Math.round(cw), 230)}>{chart}</GeoCtx.Provider>
                  <div className="mo-key">{key.map(([t, k]) => <span key={t}>{mk(k)}{t}</span>)}</div>
                </motion.div>
              </AnimatePresence>
            ) : <div className="hx-empty dl-empty"><b>No data connection yet</b><span>Connect the source to start tracking this metric.</span></div>}
          </div>
        </div>
        <div className="card-foot dl-foot"><span>{m.openFoot}</span><b style={{ color: m.st === "on" ? C.navy : TXT[m.st] }}>{m.s}</b></div>
      </div>
      <div className="card dl-side">
        <div className="surface">
          <h3>By segment</h3>
          <p className="dl-sub">{m.n}, October to date</p>
          {seg ? <Segments key={m.n} p={cp} color={C.navyFill} rows={seg.rows} scale={seg.scale} fmt={seg.fmt} /> : <p className="dl-sub">No data yet.</p>}
          <div className="dl-fill" />
          <p className="dl-desc">{m.desc}</p>
          <div className="dl-acts">
            <AskButton q={askFor(m)} />
            <SyncButton id={`${m.r}-${m.c}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// a lane is a chapter: its five cards always show; only one lane in the department has its detail open at a time
function LaneSection({ r, M, P, open, sel, onPick, i, E }) {
  const [lane, dept, score, tiles] = LANES[r];
  const ms = useMemo(() => tiles.map((_, c) => metricFor(r, c)), [r]);
  const sc = scoreColor(score);
  const q0 = SETTLE(stag(P.lanes, i, 3, 0.4));
  return (
    <motion.section className={`dl${open ? " is-open" : ""}`} id={`lane-${r}`} style={{ opacity: Math.min(1, q0 * 1.4), y: 10 * (1 - q0) }}>
      <div className="dl-head">
        <span className="hm-ringwrap dl-ring"><Ring score={score} color={sc} p={win(P.lanes, 0.1, 0.8)} /><b style={{ color: sc === GREEN.deep ? C.navy : sc }}>{score}</b></span>
        <h2>{lane}</h2>
        <span className="dl-verdict" style={{ color: sc === GREEN.deep ? C.navy : sc }}>{verdict(score)}</span>
        <span className="dl-own">{OWNERS[lane]} · outcome {tiles[0][0]}</span>
      </div>
      <div className="dl-cards">
        {ms.map((m, c) => (
          <LaneCard key={m.n} m={m} sel={open && sel === c} onPick={() => onPick(r, c)} E={E}
            q={SETTLE(stag(win(P.lanes, 0.05, 0.7), c, 5, 0.4))} p={stag(win(P.lanes, 0.2, 1), c, 5, 0.4)} />
        ))}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="open" className="dl-open" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ height: toMotion(M.health.laneOpen), opacity: toMotion(M.health.laneIn) }}>
            <LaneDetail m={ms[sel]} M={M} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export function Department({ M, scrollRef, dept, focus, go, replay, numbers }) {
  const { E } = M.ctx;
  const D = DEPTS[dept] || { score: 0, lead: "", lanes: [], people: [] };
  const rows = LANES.map((l, r) => [l, r]).filter(([l]) => (D.lanes ? D.lanes.includes(l[0]) : l[1] === dept)).map(([, r]) => r);
  const P0 = useReplay(`d-${dept}-${replay}`, M.health.intro, { reduced: REDUCED });
  const P = { head: win(P0, 0, 0.32), bars: E(win(P0, 0.12, 0.55)), filters: win(P0, 0.1, 0.4), lanes: win(P0, 0.2, 1) };
  // status counts across this department's metrics (same scale for every bar: out of the measured ones)
  const all = rows.flatMap((r) => LANES[r][3]).map((t) => status(t[2]));
  const measured = all.filter((s) => s !== "none").length;
  const counts = [["On Pace", all.filter((s) => s === "on").length, GREEN.deep], ["Behind", all.filter((s) => s === "behind").length, "#744ccb"], ["Off Plan", all.filter((s) => s === "off").length, C.alert]];
  // which lane is open, and which card in each lane is picked
  const [openR, setOpenR] = useState(() => (focus && focus.r != null && rows.includes(focus.r) ? focus.r : rows[0]));
  const [sels, setSels] = useState(() => (focus && focus.r != null ? { [focus.r]: focus.c ?? 0 } : {}));
  useEffect(() => { if (focus && focus.r != null && rows.includes(focus.r)) { setOpenR(focus.r); setSels((o) => ({ ...o, [focus.r]: focus.c ?? 0 })); } }, [focus && focus.t]);
  const pick = (r, c) => {
    const same = openR === r && (sels[r] ?? 0) === c;
    setSels((o) => ({ ...o, [r]: c }));
    setOpenR(same ? null : r);
    if (same || openR === r) return;
    // keep the newly opened lane in view once the other one has folded away
    setTimeout(() => {
      const sc = scrollRef.current, el = document.getElementById(`lane-${r}`); if (!sc || !el) return;
      const top = el.getBoundingClientRect().top - sc.getBoundingClientRect().top;
      const bottom = top + el.getBoundingClientRect().height;
      if (top < 72 || bottom > sc.clientHeight) sc.scrollTo({ top: sc.scrollTop + top - 88, behavior: "smooth" });
    }, (M.health.laneOpen.visualDuration || 0.4) * 1000 + 40);
  };
  // arrive at the lane that was clicked
  useEffect(() => {
    if (!focus || focus.r == null) return;
    const t = setTimeout(() => {
      const sc = scrollRef.current, el = document.getElementById(`lane-${focus.r}`); if (!sc || !el) return;
      sc.scrollTo({ top: el.getBoundingClientRect().top - sc.getBoundingClientRect().top + sc.scrollTop - 72, behavior: "smooth" });
    }, 380);
    return () => clearTimeout(t);
  }, [focus && focus.r, focus && focus.t]);
  // the header band ends under the header (the lead and who's here included), so nothing below ever sits half in it
  const headRef = useRef(null);
  useLayoutEffect(() => { const a = headRef.current, c = a && a.closest(".content"), st = document.documentElement.style; if (!a || !c) return;
    const set = () => st.setProperty("--band-h", `${Math.round(a.getBoundingClientRect().bottom - c.getBoundingClientRect().top + 28)}px`);
    const ro = new ResizeObserver(set); ro.observe(a); set(); return () => ro.disconnect(); }, [dept]);
  const drop = (t) => ({ opacity: t, y: -12 * (1 - t), filter: t < 1 ? `blur(${8 * (1 - t)}px)` : "none" });
  const ids = rows.flatMap((r) => [0, 1, 2, 3].map((c) => `${r}-${c}`));
  const words = counts.filter(([, n]) => n).map(([l, n]) => `${n} ${l.toLowerCase()}`).join(" · ");
  return (
    <div className="ch dept dhp">
      <TopCrumbs M={M} items={[["Company health", () => go("health")], [dept]]} />
      <motion.header ref={headRef} className="dhp-head" style={drop(SETTLE(P.head))}>
        <div className="hello"><h1>{dept}</h1></div>
        <p className="dhp-lead">{D.lead}</p>
        <div className="dhp-meta"><DeptHere D={D} rows={rows} />{rows.length ? <span className="dhp-st">{words}{words ? " · " : ""}{measured} of {all.length} metrics measured</span> : null}</div>
      </motion.header>
      {rows.length && numbers ? numbers(ids) : <p className="dh-empty dhp-nonum">No metrics connected yet.</p>}
      <DeptHome dept={dept} D={D} rows={rows} M={M} E={E} P={P} onLane={() => {}} />
    </div>
  );
}

// ------------------------------------------------------------------ a department's home
// What this team is pushing toward, what's moving in it, what it's made, and who's talking: everything that's the team's lives
// here (your own Home stays about you). Work and files open where they sit, growing out of their tile.
const NA = () => (typeof window !== "undefined" ? window.__northAgents : null);
const ST_ORDER = { need: 0, run: 1, wait: 2, queue: 3, done: 4 };
const ST_TXT = { need: "Needs a decision", run: "Working", wait: "Waiting", queue: "Up next", done: "Done" };
function useTick(ms) { const [, s] = useState(0); useEffect(() => { const t = setInterval(() => s((x) => x + 1), ms); return () => clearInterval(t); }, [ms]); }
const Face = ({ k, size }) => (AGENTS[k] ? <AgentMark id={k} size={size} /> : PHOTOS[k] ? <span className="dh-ph" style={{ width: size, height: size, backgroundImage: `url(${PHOTOS[k]})` }} /> : null);
const nmOf = (k) => (k === "sam" ? (getWho() === "sam" ? "You" : "Sam") : PEOPLE[k] ? PEOPLE[k].n : AGENTS[k] ? AGENTS[k].n : k);

const jobsOf = (D, rows) => (NA()?.jobs() || []).filter((j) => (rows.includes(j.lane) || (D.match && D.match.test(`${j.t} ${j.wait || ""}`))) && j.st !== "gone" && !j.arch);
// who's in this team right now: its people, and the agents working on its numbers
function DeptHere({ D, rows }) {
  useTick(1500);
  const here = [...new Set([...(D.people || []), ...jobsOf(D, rows).filter((j) => j.st === "run").map((j) => j.ag)])].filter((k) => PHOTOS[k] || AGENTS[k]);
  if (!here.length) return null;
  return <div className="dh-here"><Stack ids={here} size={26} face={(k, s) => <Face k={k} size={s} />} /><span>{here.map(nmOf).join(", ")}</span></div>;
}
// one line of the team's work, a file, or a conversation: Home's row (face · who and what · where it stands), its hover grown
// from the cursor; it opens where it is
function DRow({ face, who, what, st, line, onOpen, k }) {
  const [hv, setHv] = useState(false), at = useRef({ x: 100, w: 600 });
  return (
    <button type="button" className="fd-row dh-row" data-k={k} onClick={onOpen}
      onPointerEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(true); }} onPointerLeave={() => setHv(false)}>
      <AnimatePresence>{hv && <RowHover key="h" o={at.current} t={{ type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }} />}</AnimatePresence>
      <span className="fd-row-f fd-ppl">{face}</span>
      <span className="fd-row-w"><span className="fd-row-1"><b>{who}</b>{what ? " " : null}<span>{what}</span></span>{(st || line) && <span className="fd-row-s">{st && <em>{st}</em>}{st && line ? " · " : null}{line}</span>}</span>
    </button>
  );
}
function DeptHome({ dept, D, rows, M, E, P, onLane }) {
  useTick(1500);
  const [T, setT] = useState(() => talk.get()); useEffect(() => talk.sub(setT), []);
  const [fm, setFm] = useState(null);
  const js = jobsOf(D, rows);
  const work = [...js].sort((a, b) => (ST_ORDER[a.st] ?? 5) - (ST_ORDER[b.st] ?? 5)).slice(0, 6);
  // the team's files: everything filed here (one home per file), plus what's being made for it right now
  const files = [...(T.files || []), ...FILES.filter((f) => !f.hidden && !(T.files || []).some((x) => x.k === f.k)).map((f) => ({ ...f, n: f.slides ? f.slides.length : null }))].filter((f) => f.dept === dept);
  const convs = (T.threads || []).filter((t) => (t.people || []).some((p) => D.people.includes(p)));
  const rectOf = (e) => { const el = e.currentTarget, r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
  const openJob = (e, j) => dispatchEvent(new CustomEvent("north:open-job", { detail: { id: j.id, from: rectOf(e) } }));
  const who = getWho();
  const owner = (j) => { const o = (OWNERS[(LANES[j.lane] || [])[0]] || "").split(" ")[0]; return o && o.toLowerCase() === "sam" && who === "sam" ? "you" : o; };
  const line = (j) => (j.st === "need" ? (!j.for ? (who === "seth" ? "Waiting on your call." : "Waiting on Beyonce’s call.") : owner(j) ? `Waiting on ${owner(j)} to decide.` : "Waiting on a decision.") : j.st === "run" ? NA()?.detail(j.id)?.now : j.st === "wait" ? j.wait : j.st === "done" ? NA()?.watchOf?.(j.id)?.find : null) || "";
  const ico = (kind) => <span className="dh-fi"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={kind === "Deck" ? "M3 3.5h10v7H3zM8 10.5v2M5.5 12.5h5" : "M4.5 2.5h5l2 2v9h-7zM6.5 7h3M6.5 9.5h3"} /></svg></span>;
  return (
    <div className="dh">
      <section className="dh-s">
        <h2 className="dh-sec">Going on{js.length ? <em>{js.length}</em> : null}</h2>
        {work.length ? <div className="fd-rows">{work.map((j) => (
          <DRow key={j.id} k={j.id} face={<AgentMark id={j.ag} size={28} />} who={AGENTS[j.ag]?.n} what={j.t}
            st={<>{ST_TXT[j.st] || ""}{j.st === "run" && <i className="fd-dots" aria-hidden="true"><b /><b /><b /></i>}</>} line={line(j)} onOpen={(e) => openJob(e, j)} />))}</div>
          : <p className="dh-empty">Nothing moving here right now.</p>}
      </section>
      <section className="dh-s">
        <h2 className="dh-sec">Files{files.length ? <em>{files.length}</em> : null}</h2>
        {files.length ? <div className="fd-rows">{files.map((f) => (
          <DRow key={f.k} k={f.k} face={ico(f.kind)} who={f.t} what="" st={f.kind} line={`${f.n ? `${f.n} slides · ` : ""}${AGENTS[f.by]?.n || nmOf(f.by)}${f.st ? ` · ${f.st}` : ""}`}
            onOpen={(e) => showFile(f.k, e.currentTarget)} />))}</div>
          : <p className="dh-empty">No files yet. Decks and reports made for {dept} land here.</p>}
      </section>
      {convs.length > 0 && <section className="dh-s">
        <h2 className="dh-sec">Conversations<em>{convs.length}</em></h2>
        <div className="fd-rows">{convs.map((c) => (
          <DRow key={c.id} k={c.id} face={<Stack ids={c.people} size={28} fit={62} face={(k, s) => <Face k={k} size={s} />} />} who={andList(c.people.map(nmOf))} what={c.t}
            st={c.ask ? "Asked you" : null} line={c.ask ? c.last?.text : c.last ? `${nmOf(c.last.who)}: ${c.last.text}` : ""} onOpen={() => talk.open(c.id)} />))}</div>
      </section>}
    </div>
  );
}

// ---- Your files: one place for everything made by you, your agents and your teams. What's waiting on you comes first
// (with why); then all of it, newest first, filterable by kind. A file opens where you are, and K comments on it.
// each file, said as what it found or where it stands (not what it is), and whose move it is. A button only when it's yours
const FILE_SAY = {
  webdeck: { say: "Slide 3 says who the webinar is for. Paul wants your eye on it before Lisa sees it Thursday.", move: "Your move", act: "Look it over", mine: true, at: 2 },
  secpack: { say: "Coastline’s legal team won’t approve the contract without it. It should reach them from Priya, not from us.", move: "Dustin’s reviewing it, then you send it to Priya" },
  "acct-coast": { say: "It signs by Oct 30 if the security packet reaches their legal team. That’s the one thing in the way.", move: "Dustin has the next step" },
  coastplan: { say: "What Priya’s first week looks like, so she sees it before she signs, not after.", move: "Yours to share, once the packet goes" },
  crescent: { say: "Thursday’s demo, rebuilt for Crescent: pricing first, Brightwater’s story, then who signs.", move: "A private draft, only you can see it" },
  review: { say: "The demos aren’t lost in the call. They go quiet after it, before anyone writes back.", move: "Orin drafted the 11 follow-ups" },
  inbound: { say: "Demos get booked, then too many don’t happen. Booked ARR and pipeline are both ahead of pace.", move: "Nothing waiting on you" },
  ttv: { say: "Activations are on pace. Getting from activation to ten handoffs is what’s slow.", move: "Nothing waiting on you" },
  retention: { say: "Customers are staying, and at-risk ARR is well under its ceiling.", move: "Nothing waiting on you" },
  felixhealth: { say: "Handoffs are on pace. Usage is what’s behind.", move: "Nothing waiting on you" },
  hubspot: { say: "Two pieces of work can’t move until the HubSpot sync lands.", move: "Nobody’s move until it lands" },
};
const FILE_NEEDS = { webdeck: 1, secpack: 1 };
const KINDS = ["All", "Docs", "Decks", "Reports", "Accounts"], KIND_OF = { Docs: "Doc", Decks: "Deck", Reports: "Report", Accounts: "Account" };
const sayOf = (f) => FILE_SAY[f.k] || { say: (f.body && (f.body.find((x) => x[0] === "p") || [])[1]) || f.st || `${f.kind} from ${AGENTS[f.by]?.n || nmOf(f.by)}.`, move: f.st || "Nothing waiting on you" };
const SWAP = { duration: 0.45, ease: [0.32, 0.72, 0, 1] };
// ---- Your files: one place for everything made by you, your agents and your teams. What's waiting on you comes first
// (with why); then all of it, newest first, filterable by kind. A file opens where you are, and K comments on it.
// (Restored from v455 at Seth's call; kept: only Sam has files waiting on him, and his private draft stays his.)
const ASK = { webdeck: "Paul asked you to look over slide 3", secpack: "Send it to Priya once Dustin signs off" };
export function FilesPage() {
  useTick(1500);
  const [T, setT] = useState(() => talk.get()); useEffect(() => talk.sub(setT), []);
  const [kind, setKind] = useState("All");
  // tiles or a list, as on Agents; remembered for this viewer
  const [view, setView0] = useState(() => { try { return localStorage.getItem("north:files-view") || "grid"; } catch { return "grid"; } });
  const setView = (v) => { setView0(v); try { localStorage.setItem("north:files-view", v); } catch {} };
  // the header band ends under the header, as on a team's page, so no row ever sits half in it
  const headRef = useRef(null);
  useLayoutEffect(() => { const a = headRef.current, c = a && a.closest(".content"), st = document.documentElement.style; if (!a || !c) return;
    const set = () => st.setProperty("--band-h", `${Math.round(a.getBoundingClientRect().bottom - c.getBoundingClientRect().top + 28)}px`);
    const ro = new ResizeObserver(set); ro.observe(a); set(); return () => ro.disconnect(); }, []);
  const ico = (k) => <span className="dh-fi"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={k === "Deck" ? "M3 3.5h10v7H3zM8 10.5v2M5.5 12.5h5" : k === "Account" ? "M3 13V6.5L8 3l5 3.5V13M6.5 13V9.5h3V13" : k === "Report" ? "M3.5 12.5h9M5 10V7.5M8 10V5M11 10V8" : "M4.5 2.5h5l2 2v9h-7zM6.5 7h3M6.5 9.5h3"} /></svg></span>;
  const me = getWho() === "sam";
  const all = [...(T.files || []), ...FILES.filter((f) => !f.hidden && !(T.files || []).some((x) => x.k === f.k)).map((f) => ({ ...f, n: f.slides ? f.slides.length : null }))].filter((f) => !(f.k === "crescent" && !me));
  const asks = me ? ASK : {};
  const need = all.filter((f) => asks[f.k] && (kind === "All" || f.kind === KIND_OF[kind])), rest = all.filter((f) => !asks[f.k] && (kind === "All" || f.kind === KIND_OF[kind]));
  const whoOf = (f) => `${AGENTS[f.by]?.n || nmOf(f.by)}${f.when ? ` · ${f.when}` : ""}`;
  const sub = (f) => `${f.kind}${f.n ? ` · ${f.n} slides` : ""}`;
  const counts = Object.fromEntries(KINDS.map((k) => [k, k === "All" ? all.length : all.filter((f) => f.kind === KIND_OF[k]).length]));
  // the kinds and the tiles/list switch set the whole page: they sit across from the first section's heading
  const ctl = (<div className="fl-ctl">
          <div className="seg seg-sm" role="tablist">{KINDS.filter((k) => counts[k] > 0).map((k) => <button key={k} type="button" role="tab" aria-selected={kind === k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>
            {kind === k && <motion.span layoutId="seg-files" className="seg-pill" transition={{ type: "spring", visualDuration: 0.35, bounce: 0.15 }} />}<span className="seg-t">{k}</span></button>)}</div>
          <div className="fl-views" role="tablist" aria-label="View">
            <button type="button" role="tab" aria-selected={view === "grid"} aria-label="Tiles" className={view === "grid" ? "is-on" : ""} onClick={() => setView("grid")}>{view === "grid" && <motion.span layoutId="fl-view-pill" className="seg-pill" transition={{ type: "spring", visualDuration: 0.35, bounce: 0.15 }} />}<svg className="fl-vi" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1"><rect x="2" y="2" width="4" height="4" /><rect x="8" y="2" width="4" height="4" /><rect x="2" y="8" width="4" height="4" /><rect x="8" y="8" width="4" height="4" /></svg></button>
            <button type="button" role="tab" aria-selected={view === "list"} aria-label="List" className={view === "list" ? "is-on" : ""} onClick={() => setView("list")}>{view === "list" && <motion.span layoutId="fl-view-pill" className="seg-pill" transition={{ type: "spring", visualDuration: 0.35, bounce: 0.15 }} />}<svg className="fl-vi" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.1"><path d="M2 4h10M2 7h10M2 10h10" /></svg></button>
          </div>
        </div>);
  return (
    <div className="ch dhp fl">
      <header ref={headRef} className="dhp-head"><div className="hello"><h1>Files</h1></div><p className="dhp-lead">What you and your agents made, and what your teams shared with you.</p></header>
      <div className="dh fl-body">
      {need.length > 0 && <section className="dh-s">
        <div className="fl-sh"><h2 className="dh-sec">Waiting on you<em>{need.length}</em></h2>{ctl}</div>
        <ViewSwap view={view} grid={<div className="fl-grid is-need">{need.map((f) => <FileTile key={f.k} f={f} ask={asks[f.k]} />)}</div>}
          list={<ul className="fl-list">{need.map((f, i) => <FileRow key={f.k} i={i} f={f} ico={ico} mid={asks[f.k]} who={whoOf(f)} />)}</ul>} />
      </section>}
      <section className="dh-s">
        <div className="fl-sh"><h2 className="dh-sec">All files</h2>{need.length === 0 && ctl}</div>
        <ViewSwap view={view} k={kind} grid={<motion.div layout className="fl-grid">
          <AnimatePresence initial={false} mode="popLayout">{rest.map((f) => <motion.div key={f.k} layout initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }} transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}>
            <FileTile f={f} who={whoOf(f)} /></motion.div>)}</AnimatePresence>
        </motion.div>} list={<ul className="fl-list">{rest.map((f, i) => <FileRow key={f.k} i={i} f={f} ico={ico} mid={sub(f)} who={whoOf(f)} />)}</ul>} />
      </section>
      </div>
    </div>
  );
}

// tiles ⇄ list, the Agents way: the old view eases out, the new one fades in, and the list's rows arrive one by one
function ViewSwap({ view, k, grid, list }) {
  return <AnimatePresence mode="wait" initial={false}>
    <motion.div key={view + (view === "list" ? "-" + (k || "") : "")} className={`fl-swap${view === "list" ? " lv2-stg" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }} transition={{ duration: 0.3 }}>
      {view === "list" ? list : grid}</motion.div></AnimatePresence>;
}
// one file as a row: its icon, its name, what it is (or what's asked of you), who and when
function FileRow({ f, i, ico, mid, who }) {
  return <li className="fl-r" style={{ "--i": i }} onClick={(e) => showFile(f.k, e.currentTarget)}>
    {ico(f.kind)}<span className="fl-r-t">{f.t}</span><span className="fl-r-m">{mid}</span><span className="fl-r-w">{who}</span></li>;
}
// one file, built like the chart tiles on Home: the file itself is the paper (it carries its own name), sitting in the tray,
// and one line on the tray under it: what it is (or, waiting on you, what's asked), with who and when at the right. Every tile is the same size.
// Hover is the chart tile's: the tray deepens, the line turns navy, an arrow comes in at the top right. No underline.
function FileTile({ f, ask, who }) {
  return (
    <button type="button" className="fl-tile" aria-label={f.t} onClick={(e) => showFile(f.k, e.currentTarget.querySelector(".fl-thumb"))}>
      <span className="fl-thumb"><Preview k={f.k} />
        <svg className="fl-go" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 9.5l5-5M5.5 4.5h4v4" /></svg></span>
      <span className="fl-f"><span title={ask || undefined}>{ask || `${f.kind}${f.n ? ` · ${f.n} slides` : ""}`}</span>{who && <small>{who}</small>}</span>
    </button>
  );
}
