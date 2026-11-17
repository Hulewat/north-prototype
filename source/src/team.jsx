// Team: the human view of the Agents page. A table, not a board.
// The agents sit across from you, each saying what they're on in their own voice. The middle of the table is the work
// you care about: your people's (leadership) or your own outreach (Sam). Anything that needs you is handed across the
// table to your edge. Nothing else reaches you here.
// Every figure is the prototype's own (agents-concept.jsx, App.jsx, chat.jsx).
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, AnimatePresence, useAnimate, useMotionValue, useSpring } from "motion/react";
import { DialRoot, useDialKit } from "dialkit";
import { Orb } from "./agents.jsx";

// ---------------------------------------------------------------- dials (D shows them)
const DIALS = {
  orb: ["Agent orb size", [64, 36, 110, 1]],
  busy: ["Breath when working (s)", [2.6, 1, 6, 0.1]],
  idle: ["Breath when free (s)", [5.5, 2, 10, 0.1]],
  lean: ["Orbs lean toward the cursor (px)", [5, 0, 16, 0.5]],
  typeMs: ["Voice: ms per character", [22, 5, 60, 1]],
  hold: ["Voice: seconds a line stays", [6.5, 2, 15, 0.5]],
  hand: ["Card handed across", { type: "spring", visualDuration: 0.7, bounce: 0.22 }],
  gap: ["Gap between cards handed (s)", [0.38, 0, 1, 0.01]],
  sheet: ["1:1 opens from the orb", { type: "spring", visualDuration: 0.45, bounce: 0.12 }],
};
const CONFIG = Object.fromEntries(Object.values(DIALS).map(([l, v]) => [l, v]));
const fromDials = (v) => Object.fromEntries(Object.entries(DIALS).map(([k, [l]]) => [k, v[l]]));
const ORB_L = { fia: "#f19c80", orin: "#9a8ef3", felix: "#e893db" };
const AG = { fia: { n: "Fia", role: "Growth" }, orin: { n: "Orin", role: "Finance" }, felix: { n: "Felix", role: "Customers" } };
const IDS = ["fia", "orin", "felix"];

import { SEATS, ASKED } from "./team-data.js";

// ---------------------------------------------------------------- hover: the highlight grows out of where the pointer came in
function useHover() {
  useEffect(() => {
    const SEL = ".hv";
    const enter = (el, ev) => {
      let f = el.querySelector(":scope > .hv-fill"); if (f) f.getAnimations().forEach((a) => a.cancel()); else { f = document.createElement("span"); f.className = "hv-fill"; el.prepend(f); }
      const r = el.getBoundingClientRect(), x = Math.max(0, Math.min(r.width, ev.clientX - r.left)), l = Math.max(0, Math.min(r.width - 18, x - 9));
      f.animate([{ left: `${l}px`, right: `${r.width - l - 18}px`, top: "5px", bottom: "5px" }, { left: "0px", right: "0px", top: "0px", bottom: "0px" }], { duration: 500, easing: "cubic-bezier(.32,.72,0,1)", fill: "forwards" });
      f.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "forwards" });
    };
    const leave = (el) => { const f = el.querySelector(":scope > .hv-fill"); if (!f) return; const a = f.animate([{ opacity: getComputedStyle(f).opacity }, { opacity: 0 }], { duration: 250, fill: "forwards" }); a.onfinish = () => { if (!el.matches(":hover")) f.remove(); }; };
    const over = (e) => { if (e.pointerType === "touch") return; const el = e.target.closest && e.target.closest(SEL); if (!el || el.contains(e.relatedTarget)) return; enter(el, e); };
    const out = (e) => { const el = e.target.closest && e.target.closest(SEL); if (!el || el.contains(e.relatedTarget)) return; leave(el); };
    document.addEventListener("pointerover", over, true); document.addEventListener("pointerout", out, true);
    return () => { document.removeEventListener("pointerover", over, true); document.removeEventListener("pointerout", out, true); };
  }, []);
}

// a line typed out, the way someone says it
function Typed({ text, ms, onDone }) {
  const [n, setN] = useState(0);
  useEffect(() => { setN(0); const t0 = performance.now(); let raf = 0;
    const tick = (t) => { const k = Math.min(text.length, Math.floor((t - t0) / Math.max(1, ms))); setN(k); if (k < text.length) raf = requestAnimationFrame(tick); else onDone && onDone(); };
    raf = requestAnimationFrame(tick); return () => cancelAnimationFrame(raf); }, [text]);
  return <>{text.slice(0, n)}<span className="ghost">{text.slice(n)}</span></>;
}

// ---------------------------------------------------------------- an agent at the table
function Seat({ id, D, lines, busy, said, onOpen, ptr }) {
  const [i, setI] = useState(0), ref = useRef(null);
  const line = said || lines[i % lines.length];
  useEffect(() => { if (said || lines.length < 2) return; const t = setTimeout(() => setI((x) => x + 1), (D.hold * 1000) + line.length * D.typeMs); return () => clearTimeout(t); }, [i, said, lines, D.hold, D.typeMs]);
  // the orb leans a little toward wherever you are
  const lx = useSpring(0, { stiffness: 120, damping: 18 }), ly = useSpring(0, { stiffness: 120, damping: 18 });
  useEffect(() => { const el = ref.current; if (!el || !ptr) return; const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, dx = ptr.x - cx, dy = ptr.y - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, 260 / d);
    lx.set((dx / d) * D.lean * k); ly.set((dy / d) * D.lean * k); }, [ptr, D.lean]);
  return (
    <div className="seat">
      <button className="seat-orb" data-orb={id} ref={ref} onClick={() => onOpen(id)} aria-label={`Open a 1:1 with ${AG[id].n}`}>
        <motion.span style={{ x: lx, y: ly, display: "inline-block" }}>
          <motion.span style={{ display: "inline-block" }} animate={{ scale: [1, busy ? 1.06 : 1.03, 1] }} transition={{ duration: busy ? D.busy : D.idle, repeat: Infinity, ease: "easeInOut" }}>
            <Orb id={id} size={D.orb} />
          </motion.span>
        </motion.span>
      </button>
      <div className="seat-n"><b>{AG[id].n}</b><span>{busy ? `${busy} going` : "Free"}</span></div>
      <p className="seat-say" key={line}><Typed text={line} ms={D.typeMs} /></p>
    </div>
  );
}

// ---------------------------------------------------------------- the middle of the table: the work you care about
function Thread({ t, st, ags, open, onToggle }) {
  return (
    <motion.button layout className={`thr hv${open ? " is-open" : ""}${t.warn && st === t.st ? " is-warn" : ""}${t.win ? " is-win" : ""}`} onClick={onToggle} transition={{ layout: { type: "spring", visualDuration: 0.4, bounce: 0.1 } }}>
      <span className="thr-h">
        <b>{t.who}</b>{t.sub && <span>{t.sub}</span>}
        <span className="thr-ags">{ags.map((a) => <Orb key={a} id={a} size={14} />)}</span>
      </span>
      <motion.span layout="position" className="thr-st" key={st} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>{st}</motion.span>
      <AnimatePresence initial={false}>{open && (
        <motion.span className="thr-more" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}>
          {t.more.map((m) => <span key={m}>{m}</span>)}
        </motion.span>)}
      </AnimatePresence>
    </motion.button>
  );
}

// ---------------------------------------------------------------- handed across the table
function Handed({ c, k, D, onYes, onLater, onTalk, onHover, leaving }) {
  const [scope, animate] = useAnimate();
  const from = () => { const o = document.querySelector(`[data-orb="${c.ag}"]`), el = scope.current; if (!o || !el) return null;
    const a = o.getBoundingClientRect(), b = el.getBoundingClientRect(); return { x: a.left + a.width / 2 - (b.left + b.width / 2), y: a.top + a.height / 2 - (b.top + b.height / 2) }; };
  useLayoutEffect(() => {
    const f = from(); if (!f) return;
    const r = (k % 2 ? 1 : -1) * 3;
    animate(scope.current, { x: [f.x, 0], y: [f.y, 0], scale: [0.18, 1], rotate: [r * 2, 0], opacity: [0, 1] }, { ...D.hand, delay: 0.9 + k * D.gap, opacity: { duration: 0.25, delay: 0.9 + k * D.gap } });
  }, []);
  // going back to whoever handed it: a yes flies home, "later" slides down off your edge
  useEffect(() => {
    if (!leaving) return; const f = from();
    if (leaving === "yes" && f) animate(scope.current, { x: f.x, y: f.y, scale: 0.15, opacity: 0, rotate: -4 }, { type: "spring", visualDuration: 0.55, bounce: 0.05 });
    else animate(scope.current, { y: 40, opacity: 0, scale: 0.96 }, { duration: 0.3, ease: [0.4, 0, 1, 1] });
  }, [leaving]);
  return (
    <div className="hand" ref={scope} style={{ opacity: 0 }} onPointerEnter={() => onHover(c, scope.current)} onPointerLeave={() => onHover(null)}>
      <span className="hand-h"><Orb id={c.ag} size={16} /><b>{AG[c.ag].n}</b></span>
      <b className="hand-t">{c.t}</b>
      <p className="hand-r">{c.rec}</p>
      <span className="hand-a">
        <button className="btn-y" onClick={onYes}>{c.act}</button>
        <button className="btn-n hv" onClick={onTalk}>Talk</button>
        <button className="btn-n hv" onClick={onLater}>Later</button>
      </span>
    </div>
  );
}

// the thread between a card and whoever handed it: drawn while you're on the card
function Tether({ link }) {
  if (!link) return null;
  const o = document.querySelector(`[data-orb="${link.c.ag}"]`); if (!o || !link.el) return null;
  const t = link.el.closest(".table"); if (!t) return null;
  const a = o.getBoundingClientRect(), b = link.el.getBoundingClientRect(), T = t.getBoundingClientRect();
  const x1 = a.left + a.width / 2 - T.left, y1 = a.bottom + 4 - T.top, x2 = b.left + b.width / 2 - T.left, y2 = b.top - 2 - T.top, my = (y1 + y2) / 2;
  return (
    <svg className="tether" width="100%" height="100%">
      <motion.path d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`} fill="none" stroke={ORB_L[link.c.ag]} strokeWidth="1.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }} />
    </svg>
  );
}

// ---------------------------------------------------------------- a 1:1: the agent's desk, opened out of its orb
function OneOnOne({ id, seat, D, topic, said, started, onClose }) {
  const d = { ...seat.desk[id], catch: said || seat.desk[id].catch, on: [...started, ...seat.desk[id].on] }, [msgs, setMsgs] = useState([]), [v, setV] = useState(""), [org, setOrg] = useState("50% 0%");
  useLayoutEffect(() => { const o = document.querySelector(`[data-orb="${id}"]`); if (!o) return; const r = o.getBoundingClientRect(), w = Math.min(560, window.innerWidth - 32), left = (window.innerWidth - w) / 2;
    setOrg(`${r.left + r.width / 2 - left}px 0px`); }, [id]);
  useEffect(() => { const k = (e) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const send = () => { const q = v.trim(); if (!q) return; setMsgs((m) => [...m, ["you", q], [id, ASKED[id]]]); setV(""); };
  return (
    <motion.div className="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="one" style={{ transformOrigin: org }} onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.4, y: -40 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.6, y: -30, transition: { duration: 0.2 } }} transition={D.sheet}>
        <div className="one-h"><Orb id={id} size={40} /><span><b>{AG[id].n}</b><em>{AG[id].role} · 1:1</em></span><button className="one-x hv" onClick={onClose} aria-label="Close">×</button></div>
        {topic && <p className="one-q">About: {topic}</p>}
        <p className="one-say"><Typed text={d.catch} ms={D.typeMs} /></p>
        {d.on.length > 0 && <div className="one-sec"><h4>On now</h4>{d.on.map((t) => <div key={t} className="one-r hv"><span className="dot-run" style={{ background: ORB_L[id] }} />{t}</div>)}</div>}
        {d.done.length > 0 && <div className="one-sec"><h4>Since you looked</h4>{d.done.map(([t, at, f]) => <div key={t} className="one-r is-done hv"><span className="one-rt"><b>{t}</b>{f}</span>{at && <em>{at}</em>}</div>)}</div>}
        {msgs.length > 0 && <div className="one-chat">{msgs.map(([w, m], i) => <p key={i} className={w === "you" ? "is-you" : ""}>{w === "you" ? m : <Typed text={m} ms={D.typeMs} />}</p>)}</div>}
        <form className="one-ask" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input value={v} onChange={(e) => setV(e.target.value)} placeholder={`Ask ${AG[id].n} anything`} autoFocus />
        </form>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------- the room
function Team() {
  const D = fromDials(useDialKit("Team", CONFIG));
  const [dials, setDials] = useState(false);
  const [who, setWho] = useState("beyonce"), seat = SEATS[who];
  const [state, setState] = useState({}); // per seat: { gone: {id: "yes"|"later"}, later: [], said: {ag: line}, thread: {id: st}, add: {id: [ags]} }
  const S = state[who] || { gone: {}, said: {}, thread: {}, add: {} };
  const put = (fn) => setState((x) => ({ ...x, [who]: fn(x[who] || { gone: {}, said: {}, thread: {}, add: {} }) }));
  const [open, setOpen] = useState(null), [one, setOne] = useState(null), [catchUp, setCatch] = useState(false), [link, setLink] = useState(null), [ptr, setPtr] = useState(null);
  const [leaving, setLeaving] = useState({});
  useHover();
  useEffect(() => { const k = (e) => { const a = document.activeElement; if (a && /^(INPUT|TEXTAREA)$/.test(a.tagName)) return; if (e.key === "d" || e.key === "D") setDials((x) => !x); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  useEffect(() => { let raf = 0; const m = (e) => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setPtr({ x: e.clientX, y: e.clientY })); }; window.addEventListener("pointermove", m); return () => window.removeEventListener("pointermove", m); }, []);
  useEffect(() => { setOpen(null); setCatch(false); setLink(null); }, [who]);

  const cards = seat.hand.filter((c) => !S.gone[c.id] || leaving[c.id]);
  const later = seat.hand.filter((c) => S.gone[c.id] === "later" && !leaving[c.id]);
  const busyOf = (id) => seat.desk[id].on.length + seat.hand.filter((c) => S.gone[c.id] === "yes" && c.ag === id).length;
  const decide = (c, how) => {
    setLink(null); setLeaving((l) => ({ ...l, [c.id]: how }));
    setTimeout(() => {
      put((s) => ({ ...s, gone: { ...s.gone, [c.id]: how },
        said: how === "yes" ? { ...s.said, [c.ag]: c.reply } : s.said,
        thread: how === "yes" ? { ...s.thread, [c.thread[0]]: c.thread[1] } : s.thread,
        add: how === "yes" && c.add ? { ...s.add, [c.thread[0]]: [c.add] } : s.add }));
      setLeaving((l) => { const n = { ...l }; delete n[c.id]; return n; });
    }, 520);
  };
  const back = () => put((s) => { const g = { ...s.gone }; for (const c of later) delete g[c.id]; return { ...s, gone: g }; });

  return (
    <div className={`room${dials ? "" : " dials-off"}`}>
      <header className="top">
        <span className="brand"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1 L9 7 L7 13 L5 7 Z" fill="currentColor" /></svg>North · Team</span>
        <span className="seg" role="tablist">
          {Object.entries(SEATS).map(([k, s]) => (
            <button key={k} role="tab" aria-selected={who === k} className={`seg-b${who === k ? " is-on" : " hv"}`} onClick={() => setWho(k)}>
              {who === k && <motion.span layoutId="seg" className="seg-on" transition={{ type: "spring", visualDuration: 0.35, bounce: 0.15 }} />}
              <span>{s.n}</span>
            </button>))}
        </span>
      </header>

      <section className="hello">
        <h1>Afternoon, {seat.n}.</h1>
        <button className={`catch hv${catchUp ? " is-on" : ""}`} onClick={() => setCatch((x) => !x)}>
          <svg width="12" height="12" viewBox="0 0 14 14"><path d="M7 1 L9 7 L7 13 L5 7 Z" fill="currentColor" /></svg>{catchUp ? "Thanks, North" : "Catch me up"}
        </button>
        <AnimatePresence>{catchUp && (
          <motion.p key={who} className="north-say" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}>
            <Typed text={seat.north} ms={Math.max(8, D.typeMs * 0.6)} />
          </motion.p>)}
        </AnimatePresence>
      </section>

      <motion.main className="table grain" key={who} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}>
        <Tether link={link} />
        <div className="seats">
          {IDS.map((id) => <Seat key={id} id={id} D={D} lines={seat.voice[id]} busy={busyOf(id)} said={S.said[id]} ptr={ptr} onOpen={(a) => setOne({ id: a })} />)}
        </div>

        <div className="mid">
          <h3>{seat.middle}</h3>
          <div className="thrs">
            {seat.threads.map((t) => <Thread key={t.id} t={t} st={S.thread[t.id] || t.st} ags={[...new Set([...t.ags, ...((S.add || {})[t.id] || [])])]} open={open === t.id} onToggle={() => setOpen((o) => (o === t.id ? null : t.id))} />)}
          </div>
        </div>

        <div className="edge">
          <h3><span>Handed to you</span></h3>
          {cards.length === 0 ? (
            <motion.p className="clear" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>Nothing needs you. Go do something interesting.</motion.p>
          ) : (
            <div className="hands">
              {cards.map((c, k) => <Handed key={c.id} c={c} k={k} D={D} leaving={leaving[c.id]} onHover={(cc, el) => setLink(cc ? { c: cc, el } : null)}
                onYes={() => decide(c, "yes")} onLater={() => decide(c, "later")} onTalk={() => setOne({ id: c.ag, topic: c.t })} />)}
            </div>
          )}
          <AnimatePresence>{later.length > 0 && (
            <motion.button className="later hv" onClick={back} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {later.length} set aside for later
            </motion.button>)}
          </AnimatePresence>
        </div>
      </motion.main>

      
      <AnimatePresence>{one && <OneOnOne key={one.id} id={one.id} topic={one.topic} said={S.said[one.id]} started={seat.hand.filter((c) => S.gone[c.id] === "yes" && c.ag === one.id).map((c) => c.job)} seat={seat} D={D} onClose={() => setOne(null)} />}</AnimatePresence>
      {dials && <DialRoot position="bottom-right" theme="dark" productionEnabled defaultOpen />}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<Team />);
