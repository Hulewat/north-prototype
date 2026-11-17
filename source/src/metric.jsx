// Metric page — what an agenda row opens. One metric, given the whole page:
// the gap up top on our pace bar, the trend big, then who and what is behind it, then the next agenda item.
// Built only from parts already in the system (Company health header, page filters, open-card chart, segment bars, agenda row).
import React, { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { C, stag, win, toMotion, useReplay, prefersReduced } from "./lib.js";
import { Segments, GeoCtx, geo } from "./open-charts.jsx";
import { SETTLE, LANES, SC, TXT, status, metricFor, chartFor, lensesFor, FSegSmall, PageFilters, TALK, TalkRow, GrowHover, TopCrumbs, askFor } from "./health.jsx";
import { segRows } from "./dept.jsx";
import { AskButton, SyncButton, useActions } from "./actions.jsx";

const REDUCED = prefersReduced();
const Chev = ({ left }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d={left ? "M9.7 4.5 6.2 8l3.5 3.5" : "M6.3 4.5 9.8 8l-3.5 3.5"} fill="none" stroke={C.navy} strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

export function MetricPage({ M, scrollRef, r, c, go, replay }) {
  const { E } = M.ctx;
  const m = useMemo(() => metricFor(r, c), [r, c]);
  const ti = TALK.findIndex((t) => t.r === r && t.c === c), item = TALK[ti];
  const next = ti >= 0 ? TALK[(ti + 1) % TALK.length] : null;
  const P0 = useReplay(`m-${r}-${c}-${replay}`, M.health.intro, { reduced: REDUCED });
  const P = { head: win(P0, 0, 0.3), bar: E(win(P0, 0.12, 0.5)), filters: win(P0, 0.1, 0.4), body: win(P0, 0.2, 0.75), low: win(P0, 0.35, 0.95) };
  const drop = (t) => ({ opacity: t, y: -12 * (1 - t), filter: t < 1 ? `blur(${8 * (1 - t)}px)` : "none" });
  const rise = (t) => ({ opacity: Math.min(1, t * 1.4), y: 12 * (1 - t) });
  const st = m.st, col = st === "on" ? C.navy : TXT[st];
  const fill = m.p == null ? 0 : Math.min(1, m.p / 100);
  // gap line: agenda items carry their own words; anything else says it from the card
  const gap = item ? item.gap : m.p == null ? "No target set" : `${m.s} of ${m.kind || "target"}`;
  const ctx = item ? item.ctx : m.openFoot;

  // chart
  const lenses = lensesFor(m);
  const [lens, setLens] = useState("monthly");
  useEffect(() => setLens("monthly"), [r, c]);
  const cp = useReplay(`mc-${r}-${c}-${lens}-${replay}`, M.open.draw, { delay: lens === "monthly" ? 0.35 : 0.05, reduced: REDUCED });
  const { chart, key, mk } = chartFor(m, lens, cp);
  const wrap = useRef(null);
  const [cw, setCw] = useState(1000);
  useLayoutEffect(() => { const ro = new ResizeObserver(() => wrap.current && setCw(wrap.current.getBoundingClientRect().width)); ro.observe(wrap.current); return () => ro.disconnect(); }, []);
  const seg = segRows(m);
  const [hov, setHov] = useState(null);
  const at = useRef({ x: 100, w: 1000 });
  const { sync: syncSet } = useActions();
  const sp = useReplay(`ms-${r}-${c}-${replay}`, M.open.draw, { delay: 0.6, reduced: REDUCED });

  return (
    <div className="ch dept mp">
      <TopCrumbs M={M} items={[["Company health", () => go("health")], [m.n]]}
        right={ti >= 0 && (<>
          <em>{ti + 1} of {TALK.length} on the agenda</em>
          <button className="ibtn" aria-label="Previous agenda item" onClick={() => { const t = TALK[(ti - 1 + TALK.length) % TALK.length]; go("metric", t.r, t.c); }}><Chev left /></button>
          <button className="ibtn" aria-label="Next agenda item" onClick={() => go("metric", next.r, next.c)}><Chev /></button>
        </>)} />

      <motion.header className="ch-head mp-head" style={drop(SETTLE(P.head))}>
        <div className="ch-score">
          <span className="ch-96" style={{ color: m.v === "—" ? C.mute : C.navy }}>{m.v}</span>
          <h1>{m.n}</h1>
          <p>{m.lane}{m.lane !== m.dept ? ` · ${m.dept}` : ""} · owned by {m.owner}{item ? ` · ${item.src}` : ""}</p>
        </div>
        <div className="mp-gap">
          <div className="mp-gap-l"><b style={{ color: col }}>{gap}</b><span>{ctx}</span></div>
          <div className="mp-bar" aria-hidden="true">
            {m.p != null && <i className="grain" style={{ width: `${fill * 100 * P.bar}%`, background: SC[st] }} />}
            {[25, 50, 75].map((q) => <u key={q} style={{ left: `${q}%` }} />)}
            {m.mark != null && <em style={{ left: `${Math.min(m.mark, 1) * 100}%`, background: SC[st], transform: `translateX(-50%) scale(${win(P.bar, 0.85, 1)})` }} />}
          </div>
          <div className="mp-bar-k"><span>October to date</span><b style={{ color: col }}>{m.p != null ? m.s : "—"}</b></div>
          <div className="mp-acts">
            <AskButton q={askFor(m)} />
            <SyncButton id={`${r}-${c}`} />
          </div>
        </div>
      </motion.header>

      <PageFilters M={M} scrollRef={scrollRef} style={{ opacity: P.filters }} />

      <motion.section className="card dl-chart mp-chart" style={rise(SETTLE(P.body))}>
        <div className="surface">
          <div className="card-head">
            <div className="dl-title"><h2>Last 6 months</h2><p>{m.desc}</p></div>
            {lenses.length > 1 && <FSegSmall value={lens} onChange={setLens} options={lenses} M={M} id={`mp-${r}-${c}`} />}
          </div>
          <div className="dl-plot mp-plot" ref={wrap}>
            {m.series ? (
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div key={lens} initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6, filter: "blur(3px)" }} transition={toMotion(M.open.lens)}>
                  <GeoCtx.Provider value={geo(Math.round(cw), 300)}>{chart}</GeoCtx.Provider>
                  <div className="mo-key">{key.map(([t, k]) => <span key={t}>{mk(k)}{t}</span>)}</div>
                </motion.div>
              </AnimatePresence>
            ) : <div className="hx-empty dl-empty"><b>No data connection yet</b><span>Connect the source to start tracking this metric.</span></div>}
          </div>
        </div>
        <div className="card-foot dl-foot"><span>{m.openFoot}</span><b style={{ color: col }}>{m.s}</b></div>
      </motion.section>

      <motion.div className="mp-pair" style={rise(SETTLE(P.low))}>
        <section className="card dl-side">
          <div className="surface">
            <h3>By segment</h3>
            <p className="dl-sub">{m.n}, October to date</p>
            {seg ? <Segments key={m.n} p={sp} color={C.navyFill} rows={seg.rows} scale={seg.scale} fmt={seg.fmt} /> : <p className="dl-sub">No data yet.</p>}
          </div>
        </section>
        <section className="card dl-side">
          <div className="surface">
            <h3>Rest of the {m.lane} lane</h3>
            <p className="dl-sub">Owned by {m.owner}</p>
            <div className="mp-lane" role="list" onPointerLeave={() => setHov(null)}>
              {m.tiles.map(([tn, tv, tp, ts], i) => {
                if (i === c) return null;
                const s2 = status(tp);
                return (
                  <button key={tn} role="listitem" className="mp-mv" onClick={() => go("metric", r, i)}
                    onPointerEnter={(e) => { const b = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - b.left, w: b.width }; setHov(i); }}>
                    <AnimatePresence>{hov === i && <GrowHover key="h" o={at.current} t={M.hover.glide} />}</AnimatePresence>
                    <i style={{ background: SC[s2] }} /><b>{tn}</b><span />
                    <em style={{ color: s2 === "on" ? C.navy : s2 === "none" ? C.mute : TXT[s2] }}>{tv}</em>
                    <small style={{ color: s2 === "none" ? C.mute : TXT[s2] }}>{tp != null ? ts : "—"}</small>
                    <Chev />
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </motion.div>

      {next && (
        <motion.section className="talk mp-next" style={rise(SETTLE(P.low))} aria-labelledby="mp-next-h">
          <div className="ch-sec-h"><h3 id="mp-next-h">{ti + 1 < TALK.length ? "Next on the agenda" : "Back to the top of the agenda"}</h3></div>
          <div className="card talk-card">
            <div className="surface talk-list" onPointerLeave={() => setHov(null)}>
              <div className="talk-item"><TalkRow t={next} synced={syncSet.has(`${next.r}-${next.c}`)} M={M} at={at} hov={hov === "next"} onEnter={() => setHov("next")} onClick={() => go("metric", next.r, next.c)} /></div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
