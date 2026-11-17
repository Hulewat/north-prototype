// Voice: talk to North anywhere and it moves things. One listener for the whole app: a voice button (or V, when you're not
// typing) starts it, what you said shows as you say it, and when you stop it goes to whoever asked (a reply field) or,
// from anywhere else, to the page as a command ("answer Heather, keep it on", "start Riley", "hand Brightwater to Jordan").
// Whatever no page takes goes to North as a question. Typed and spoken commands run the same path.
// The microphone isn't open to a published preview, so there the same bar takes what you'd say as text.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { normalize, tryIntents } from "./voice-intents.js";
import { getWho } from "./seat.js";

const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
const bus = { set: null };
// start listening; `to` takes the words (a reply field), otherwise they go out as a command
export const voice = { start: (to = null, hint = null) => bus.set && bus.set({ to, hint, k: Date.now() }),
  // a typed command says what it did in the same bar, so typing and talking feel the same
  say: (t) => bus.say && bus.say(t),
  // plays a run of things said, as if spoken: each one is transcribed word by word, then runs like the real thing
  demo: (steps) => bus.set && bus.set({ to: null, demo: steps, k: Date.now() }),
  // a hold-to-talk key let go: send what was heard (typing, with no microphone, stays open until Enter)
  finish: () => bus.finish && bus.finish(), on: () => !!(bus.on && bus.on()) };
// the example on Home: answering what's waiting, and moving through it by voice
export const VOICE_DEMO = [
  { say: "Bring up the webinar deck." },
  { say: "Go to slide 3." },
  { say: "Change the title to Brokerages over 50 agents." },
  { say: "Add a point: invite the 29 who aren’t customers yet." },
  { say: "Leave a comment for Paul: lead with this one." },
  { say: "Close it." },
  { say: "Book 30 minutes with Heather tomorrow at 2 about Coastline Brokers." },
];
// a page runs a command and says what it did; returns false when it isn't one of its own
// said or typed, it's understood the same forgiving way (voice-intents.js): cleaned up, then the intents that need no page
// (an open deck, a meeting), then the page's own commands
export const runCommand = (text) => { const n = normalize(text), r = tryIntents(n, text); if (r) return r;
  const e = new CustomEvent("north:voice", { detail: { text: n, raw: text, done: null }, cancelable: true }); const free = dispatchEvent(e); return free ? null : e.detail.done || "Done"; };

export function VoiceBtn({ onText, label = "Talk", size = 14 }) {
  return (
    <motion.button type="button" className="voice is-v" aria-label={label} title={`${label} (hold ⌃ to talk, or tap ⌃ twice)`} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
      onClick={(e) => { e.preventDefault(); voice.start(onText || null); }}>
      <span className="bars">{[5, 9, 13, 9, 5].map((h, i) => <i key={i} style={{ height: Math.round(h * size / 14) }} />)}</span>
    </motion.button>
  );
}

// what to try, from the seat you're in: Sam's work, or arranging a Home (every seat can)
const EX_BY = { sam: ["Answer Heather: keep Brightwater on the slide", "Tell Paul slide 3 works", "Start Riley on the late-stage deals", "Hand Brightwater to Jordan", "Add expansion win rate to my Home"],
  _: ["Make a dash of the latest campaign", "Add expansion win rate to my Home", "Move NRR first", "Swap Felix ARR and Total ARR", "Take Net new ARR off my Home"] };
const exFor = () => EX_BY[getWho()] || EX_BY._;
// the example for a Home that isn't Sam's: arranging it by voice, one thing at a time
export const VOICE_DEMO_HOME = [
  { say: "Add expansion win rate to my Home." },
  { say: "Move expansion win rate first." },
  { say: "Swap NRR and Felix ARR." },
  { say: "Take Net new ARR off my Home." },
  { say: "Put Net new ARR back on my Home." },
];
export const demoFor = () => (getWho() === "sam" ? VOICE_DEMO : VOICE_DEMO_HOME);

// the voice itself: three fine lines on one axis, each a slow sum of sines held to the middle by a soft envelope, so the
// ends stay pinned and only the middle breathes. Level eases up as each word arrives and settles between them; when it's
// done the lines relax to a single hairline. Drawn on a canvas at device pixels, so it stays crisp and costs nothing.
function Wave({ on, beat }) {
  const cv = useRef(null), lvl = useRef(0), kick = useRef(-1e9), onR = useRef(on), hs = useRef(null);
  onR.current = on;
  useEffect(() => { kick.current = performance.now(); }, [beat]);
  useEffect(() => {
    const c = cv.current, g = c.getContext("2d"), dpr = Math.min(2, devicePixelRatio || 1), W = 56, H = 24; c.width = W * dpr; c.height = H * dpr; g.scale(dpr, dpr);
    let raf, last = performance.now();
    const draw = (t) => { const dt = Math.min(48, t - last); last = t;
      const since = t - kick.current, target = !onR.current ? 0.04 : since < 320 ? 0.95 - since / 900 : 0.32;
      lvl.current += (target - lvl.current) * (1 - Math.exp(-dt / (target > lvl.current ? 90 : 340)));
      g.clearRect(0, 0, W, H);
      // a voice meter, not a line: 14 rounded bars, centre-weighted, each with its own flicker so it reads as speech.
      // At rest they settle to a row of dots; each word you say kicks them up, then they ease back.
      const N = 14, bw = 2, gap = (W - N * bw) / (N - 1), L = lvl.current;
      if (!hs.current) hs.current = new Array(N).fill(2);
      g.fillStyle = "rgba(9,53,85,0.92)";
      for (let i = 0; i < N; i++) { const u = (i + 0.5) / N, env = 0.35 + 0.65 * Math.pow(Math.sin(Math.PI * u), 1.4);
        const fl = 0.5 + 0.5 * (0.55 * Math.sin(t * 0.0113 + i * 1.7) + 0.3 * Math.sin(t * 0.0191 + i * 2.9) + 0.15 * Math.sin(t * 0.0337 + i * 0.6));
        const goal = Math.max(2, L * env * (0.25 + 0.75 * fl) * (H - 2)); hs.current[i] += (goal - hs.current[i]) * (1 - Math.exp(-dt / 70));
        const h = hs.current[i], x = i * (bw + gap), y = (H - h) / 2; g.beginPath(); g.roundRect ? g.roundRect(x, y, bw, h, 1) : g.rect(x, y, bw, h); g.fill(); }
      raf = requestAnimationFrame(draw); };
    raf = requestAnimationFrame(draw); return () => cancelAnimationFrame(raf); }, []);
  return <canvas ref={cv} className="vx-wave" width="56" height="24" aria-hidden="true" />;
}
// what you said, flowing on: words arrive at the right end, soften in, and the line glides left under a fade as it grows,
// so it reads like speech moving past rather than text being typed. It never changes the bar's size.
function Line({ text, ph }) {
  const box = useRef(null), row = useRef(null), [x, setX] = useState(0), [over, setOver] = useState(false);
  const w = (text || "").split(/\s+/).filter(Boolean);
  useLayoutEffect(() => { const b = box.current, r = row.current; if (!b || !r) return; const d = b.clientWidth - 6 - r.scrollWidth; setX(Math.min(0, d)); setOver(d < 0); }, [text]);
  return (
    <div ref={box} className={`vx-line${over ? " is-over" : ""}`}>
      {w.length ? <motion.div ref={row} className="vx-words" animate={{ x }} transition={{ type: "spring", stiffness: 140, damping: 26, mass: 0.6 }}>
          {w.map((t, i) => <motion.span key={i} initial={{ opacity: 0, y: 3, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>{t}</motion.span>)}
        </motion.div>
        : <span ref={row} className="vx-ph">{ph}</span>}
    </div>
  );
}

// the bar: one small pill, in one place (the bottom of the page card), one size from open to close. Only what's inside it
// changes: listening → the words flowing on → what it did, each crossfading in the same spot.
export function VoiceLayer({ onAsk }) {
  const [s, set] = useState(null), [heard, setHeard] = useState(""), [did, setDid] = useState(null), [typed, setTyped] = useState(""), [noMic, setNoMic] = useState(false);
  const rec = useRef(null), inp = useRef(null), doneT = useRef(0), demoT = useRef([]);
  const stopDemo = () => { demoT.current.forEach(clearTimeout); demoT.current = []; };
  useEffect(() => { bus.set = (v) => { clearTimeout(doneT.current); stopDemo(); setDid(null); setHeard(""); setTyped(""); set(v); };
    bus.say = (t) => { clearTimeout(doneT.current); set({ k: Date.now(), over: true }); setDid(t); doneT.current = setTimeout(() => { set(null); setDid(null); }, 1700); };
    return () => { bus.set = null; bus.say = null; }; }, []);
  // ⌃ Control, on its own (⌥ is for pointing at charts): hold it to talk and let go to send, the way Wispr holds Fn; tap
  // it twice to talk hands-free, and once more to send. It starts only after a short hold with nothing else pressed, so
  // ⌃-shortcuts and ⌃-click never set it off.
  const held = useRef(null), sRef = useRef(null), heardRef = useRef(""), typedRef = useRef(""), lastTap = useRef(0), holdT = useRef(0);
  sRef.current = s; heardRef.current = heard; typedRef.current = typed;
  useEffect(() => {
    const open = () => sRef.current && !sRef.current.over;
    const down = (e) => {
      if (e.key !== "Control") { clearTimeout(holdT.current); held.current = null; return; } // a combo: not voice
      if (e.repeat || e.metaKey || e.altKey || e.shiftKey) return;
      held.current = { t: performance.now(), live: false };
      holdT.current = setTimeout(() => { if (held.current && !open()) { held.current.live = true; voice.start(); } }, 260); };
    const up = (e) => { if (e.key !== "Control") return; clearTimeout(holdT.current); const h = held.current; held.current = null; if (!h) return;
      if (h.live) { if (open()) finishRef.current(typedRef.current || heardRef.current); return; } // released after holding: send
      const now = performance.now(); // a tap
      if (open()) { finishRef.current(typedRef.current || heardRef.current); lastTap.current = 0; return; } // a tap while it's up sends
      if (now - lastTap.current < 350) { lastTap.current = 0; voice.start(); } else lastTap.current = now; };
    const blur = () => { clearTimeout(holdT.current); held.current = null; };
    addEventListener("keydown", down, true); addEventListener("keyup", up, true); addEventListener("blur", blur);
    return () => { removeEventListener("keydown", down, true); removeEventListener("keyup", up, true); removeEventListener("blur", blur); }; }, []);
  const run = (t0) => { if (s && s.to) { s.to(t0); return "Sent"; } const r = runCommand(t0); if (r) return r; const t = atAgents(t0); const h = sayHere(t); if (h) return h; onAsk && onAsk(t); return "Asked North"; };
  const finishRef = useRef(null);
  const finish = (text) => { const t = (text || "").trim(); try { rec.current && rec.current.abort(); } catch {} rec.current = null;
    if (!t) { set(null); return; }
    setDid(run(t)); set((v) => v && { ...v, over: true }); doneT.current = setTimeout(() => { set(null); setDid(null); }, 1700); };
  finishRef.current = finish;
  useEffect(() => { bus.finish = () => { if (rec.current) finishRef.current(heardRef.current); }; bus.on = () => !!sRef.current && !sRef.current.over; return () => { bus.finish = null; bus.on = null; }; }, []);
  // the example: each line said at a speaking pace (a beat per word, a breath at commas), run, answered, then the next
  useEffect(() => {
    if (!s || !s.demo) return;
    setNoMic(false); let at = 500; const T = (ms, f) => demoT.current.push(setTimeout(f, (at += ms)));
    s.demo.forEach((st, n) => {
      const w = st.say.split(" ");
      if (n) T(0, () => { setDid(null); setHeard(""); });
      w.forEach((_, i) => T(i === 0 ? 380 : 210 + Math.min(120, w[i - 1].length * 12) + (/[,]$/.test(w[i - 1]) ? 180 : /[.]$/.test(w[i - 1]) ? 260 : 0), () => setHeard(w.slice(0, i + 1).join(" "))));
      T(700, () => setDid(run(st.say.replace(/\.$/, ""))));
      T(1500, () => {});
    });
    T(300, () => { set(null); setDid(null); setHeard(""); });
    return stopDemo;
  }, [s && s.k]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!s || s.over || s.demo) return;
    setTimeout(() => inp.current && inp.current.focus(), 0);
    if (!SR) { setNoMic(true); return; }
    let r; try { r = new SR(); } catch { setNoMic(true); return; }
    r.lang = "en-US"; r.interimResults = true; r.continuous = false; let last = "";
    r.onresult = (e) => { last = [...e.results].map((x) => x[0].transcript).join(" "); setHeard(last); };
    r.onerror = () => { if (rec.current !== r) return; rec.current = null; setNoMic(true); setTimeout(() => inp.current && inp.current.focus(), 60); };
    r.onend = () => { if (rec.current === r) finish(last); };
    rec.current = r; setNoMic(false); try { r.start(); } catch { setNoMic(true); }
    return () => { try { r.abort(); } catch {} };
  }, [s && s.k]); // eslint-disable-line react-hooks/exhaustive-deps
  // Esc stops the voice first, before a file or an item open under it sees the key (it's the top layer)
  useEffect(() => { if (!s) return; const k = (e) => { if (e.key !== "Escape") return; e.preventDefault(); e.stopImmediatePropagation(); stopDemo(); try { rec.current && rec.current.abort(); } catch {} set(null); setDid(null); setHeard(""); }; addEventListener("keydown", k, true); return () => removeEventListener("keydown", k, true); }, [!!s]);
  // it opens in the bar you'd type into: the reply bar of the conversation in front of you (full, docked or popped out, or
  // the one open on Home), else the ask bar at the top. That bar becomes the voice, same box, so where it appears is where
  // the words go; the other bars step back. Measured when it opens and on resize, so it never moves while it's up.
  const [pos, setPos] = useState(null);
  useEffect(() => { if (!s) return; const root = document.documentElement; let under = null;
    // really in view: on screen, not faded out by a parent, and not sitting under something else (the top bar over a scrolled
    // Home, the page card over a hidden bar). The pill itself covering it counts as in view.
    const vis = (e) => { if (!e || !e.isConnected) return false; const r = e.getBoundingClientRect(); if (r.width < 200 || r.bottom < 8 || r.top > innerHeight - 8) return false;
      let op = 1; for (let x = e; x && x !== document.body; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.visibility === "hidden" || cs.display === "none") return false; op *= +cs.opacity; } if (op < 0.3) return false;
      // look through the pill itself: what's under it at the bar's centre must be the bar, not a file or veil laid over it
      const hit = document.elementsFromPoint(r.left + r.width / 2, Math.max(1, Math.min(innerHeight - 1, r.top + r.height / 2))).find((h) => !h.closest(".vx")); return !!hit && (hit === e || e.contains(hit)); };
    const m = () => {
      // in a conversation (open full, docked, popped out, or open on Home) it becomes that conversation's reply bar
      const chat = root.classList.contains("chat-talking") ? [...document.querySelectorAll(".chat-compose .chat-input")].find(vis) : null;
      // any chat bar in view takes it, nearest first: the conversation's reply bar, the item open on Home, Home's ask bar,
      // the ask bar in the top bar. Each becomes the voice in its own box.
      const first = (sel) => [...document.querySelectorAll(sel)].find(vis) || null;
      const top = first(".topbar .composer");
      const here = chat || first(".gw-in form.fx-ask") || first(".ask-slot .composer") || top;
      if (under && under !== here) { under.removeAttribute("data-vx-under"); under = null; }
      root.classList.toggle("is-vx-here", !!here && here !== top);
      if (here) { under = here; here.setAttribute("data-vx-under", ""); const r = here.getBoundingClientRect(), cs = getComputedStyle(here);
        setPos({ left: r.left, top: r.top, width: r.width, h: Math.round(r.height), rad: parseFloat(cs.borderTopLeftRadius) || 12, here: true, translate: "none", bottom: "auto" }); return; }
      // no chat bar in view (a file covers the page): always the same place, bottom centre of what you're looking at, 24px up (the page card, or a file
      // laid over it), 44 tall. It never sits on a bar or a heading
      const fm = [...document.querySelectorAll(".fm-in")].map((e) => e.parentElement).filter((e) => e && e.getBoundingClientRect().width > 300).sort((a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width)[0];
      const box = (fm || document.querySelector(".main"))?.getBoundingClientRect(); if (!box) { setPos(null); return; }
      const w = Math.round(Math.min(560, box.width - 48)), bottom = Math.min(box.bottom, innerHeight);
      setPos({ left: Math.round(box.left + (box.width - w) / 2), top: Math.round(bottom - 24 - 44), width: w, translate: "none", bottom: "auto" }); };
    // the bar it sits in can go away while it's up (the conversation closes, a file takes over): then it moves to the next one in line
    const watch = setInterval(() => { if (under ? !under.isConnected || !vis(under) : true) m(); }, 250);
    m(); addEventListener("resize", m); root.classList.add("is-vx");
    return () => { clearInterval(watch); removeEventListener("resize", m); root.classList.remove("is-vx", "is-vx-here"); if (under) under.removeAttribute("data-vx-under"); }; }, [!!s]);
  if (typeof document === "undefined") return null;
  const typing = !s?.demo && noMic, listening = !!s && !did && !typing;
  const ph = s && (s.demo ? "Listening…" : s.to ? "Listening for your reply…" : "Listening…");
  return createPortal(
    <AnimatePresence>{s && (
      <motion.div key="v" className={`vx${pos && pos.here ? " is-here" : ""}`} style={pos ? { left: pos.left, top: pos.top, translate: pos.translate, bottom: pos.bottom, width: pos.width ? `${pos.width}px` : undefined } : undefined}
        // it rises out of the ask bar: the bar's own shape (34px, square-ish corners, no glass) eases into the pill, then
        // the wave and words fade up inside it. Closing folds it back into the bar the same way.
        // in a conversation it takes the reply bar's own box and corners: the bar turns to glass in place, nothing moves
        initial={pos && pos.here ? { opacity: 0, height: pos.h, y: 0, scale: 1, borderRadius: pos.rad } : { opacity: 0, height: 44, y: 10, scale: 0.98, borderRadius: 22 }}
        animate={pos && pos.here ? { opacity: 1, height: pos.h, y: 0, scale: 1, borderRadius: pos.rad } : { opacity: 1, height: 44, y: 0, scale: 1, borderRadius: 22 }}
        exit={pos && pos.here ? { opacity: 0, transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } } : { opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] } }} transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}>
        <motion.span className="vx-in" initial={{ opacity: 0, scaleX: 0.6 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}><Wave on={listening || (typing && !!typed && !did)} beat={heard + typed} /></motion.span>
        <motion.div className="vx-mid" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}>
          <AnimatePresence initial={false}>
            {did ? <motion.p key={`d${did}`} className="vx-did" initial={{ opacity: 0, y: 6, filter: "blur(3px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -6, filter: "blur(3px)" }} transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--navy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><motion.path d="m3 7.3 2.6 2.6L11 4.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: 0.12 }} /></svg>
                <span>{did}</span></motion.p>
              : typing ? <motion.form key="f" className="vx-f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -6, filter: "blur(3px)" }} transition={{ duration: 0.3 }} onSubmit={(e) => { e.preventDefault(); finish(typed); }}>
                  <input ref={inp} value={typed} autoComplete="off" aria-label="What you'd say" placeholder={s.to ? "Type your reply" : `Try “${exFor()[(s.k / 1000 | 0) % exFor().length]}”`} onChange={(e) => setTyped(e.target.value)} />
                  {!typed && <button type="button" className="vx-ex" onClick={() => voice.demo(demoFor())}>Play example</button>}
                </motion.form>
              : <motion.div key={`h${s.k}`} className="vx-said" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -6, filter: "blur(3px)" }} transition={{ duration: 0.3 }}><Line text={heard} ph={ph} /></motion.div>}
          </AnimatePresence>
        </motion.div>
        <button type="button" className="vx-x" aria-label={s.demo ? "Stop" : "Close"} title="Esc" onClick={() => { stopDemo(); try { rec.current && rec.current.abort(); } catch {} set(null); setDid(null); setHeard(""); }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true"><path d="M2 2l6 6M8 2 2 8" /></svg></button>
      </motion.div>)}</AnimatePresence>, document.body);
}
// what isn't a command goes into the conversation in front of you (the chat that's open, or the thread open on Home);
// only with nothing open does it start a new question to North
// speech has no @: addressing an agent out loud ("ask Riley…", "Riley, …", "hey Riley…", "Riley and Orin, work this…",
// "have Riley and Orin…") is the same as typing @Riley, so it routes the same way
const VOICE_AG = ["orin", "riley", "calvin", "marco", "fia"];
export const atAgents = (t) => { const A = VOICE_AG.join("|");
  const m = new RegExp(`^(?:(?:hey|ok|okay)\\s+)?(?:(?:ask|have|get|let)\\s+)?((?:${A})(?:\\s*(?:,|and|&)\\s*(?:${A}))*)\\b[\\s,:]*`, "i").exec(String(t).trim());
  if (!m) return t; const names = m[1].match(new RegExp(A, "gi")).map((n) => "@" + n[0].toUpperCase() + n.slice(1).toLowerCase());
  return `${names.join(" ")} ${String(t).trim().slice(m[0].length)}`.trim(); };
export const sayHere = (raw) => { const n = normalize(raw), m = /^(?:tell|reply|say|answer)\s*(\w+)?\b[\s,:.-]*(.+)$/i.exec(n);
  const e = new CustomEvent("north:voice-say", { detail: { raw: String(raw).trim(), n, to: m ? (m[1] || "").toLowerCase() : null, rest: m ? m[2] : null, done: null }, cancelable: true });
  return dispatchEvent(e) ? null : e.detail.done || "Sent"; };
export const bodyFor = (d, ppl) => { const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  if (d.rest && (!d.to || ["them", "everyone", "the", "all"].includes(d.to) || ppl.includes(d.to))) return cap(d.rest.replace(/^(team|everyone)\b[\s,:.-]*/i, ""));
  return cap(d.raw); };
if (typeof window !== "undefined") window.__northSayHere = (t) => runCommand(t) || sayHere(atAgents(t)) || (dispatchEvent(new CustomEvent("north:talk", { detail: { text: atAgents(t) } })), "Asked North"); // the bar's own path, for tests
if (typeof window !== "undefined") window.__northSay = (t) => runCommand(t); // for tests
