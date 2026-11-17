// Messages: conversation attached to the work. A sketch of the model in one screen, with three people (Sam, Jordan,
// Heather) and three subjects running at once:
//   · Brightwater onboarding: a relay. Sam hands the customer to Jordan after the close; the hand-off is a message
//     with its brief, and Jordan takes it.
//   · November webinar: a huddle. Heather assembles it; each person holds a part.
//   · Q1 territory split: private. Same people, narrower audience: only Sam and Jordan see it; Heather sees nothing.
// Every message has two addresses: who it's for and what it's about. Two lenses read the same messages: by people (one
// conversation per group, subjects as tags you can filter) or by work (everything about one subject, whoever said it).
// Pings follow your part in a subject (holding it, or being waited on), not your membership of the group.
// "View as" switches whose screen this is, so you can see what Heather can't. All of it is SAMPLE conversation.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { useDialKit } from "dialkit";
import { AgentMark, RowHover, SelIn } from "./agents.jsx";
import { NorthLogo } from "./marks.jsx";

const P = {
  sam: { n: "Sam", role: "New Business" },
  jordan: { n: "Jordan", role: "Customer Value" },
  heather: { n: "Heather", role: "Marketing" },
  riley: { n: "Riley", agent: true }, orin: { n: "Orin", agent: true },
};
const S = {
  bw: { t: "Brightwater onboarding", short: "Brightwater", shape: "Relay", forL: "Brightwater Realty · $24.0K new ARR, closed Oct 22", who: ["sam", "jordan", "heather"], kw: /brightwater|hubspot|setup|kickoff|onboard|ops lead/i },
  web: { t: "November webinar", short: "Webinar", shape: "Huddle", forL: "Inbound demos booked · runs Nov 19", who: ["sam", "jordan", "heather"], kw: /webinar|slides|story|invite|run of show|register/i },
  q1: { t: "Q1 territory split", short: "Q1 split", shape: "Relay", forL: "Q1 plan · due Dec 1", who: ["sam", "jordan"], priv: true, kw: /territory|split|q1|quota/i },
};
const ORDER = ["bw", "web", "q1"];
const BRIEF = { done: "Signed Oct 22 · $24.0K new ARR", open: "Felix setup call isn’t booked yet", watch: "Their ops lead wants the HubSpot sync working before kickoff" };
const BASE = [
  { id: "m1", s: "bw", by: "sam", at: "9:02", kind: "handoff", text: "Brightwater is yours from here, Jordan." },
  { id: "m2", s: "web", by: "heather", at: "9:14", text: "Run of show is up. Sam, can you do a three-minute customer story for the demo segment?" },
  { id: "m3", s: "web", by: "orin", at: "9:21", text: "Invites went to the three lists you picked. I’ll post who registers each morning." },
  { id: "m4", s: "bw", by: "jordan", at: "9:26", text: "Taken. Booking the setup call for Thursday.", needs: "taken" },
  { id: "m5", s: "web", by: "sam", at: "9:40", text: "Yes. I’ll tell the Brightwater story." },
  { id: "m6", s: "web", by: "jordan", at: "9:44", text: "Unrelated, but their ops lead asked about the HubSpot sync again.", drift: "bw" },
  { id: "m7", s: "bw", by: "riley", at: "9:47", text: "I pulled the kickoff checklist from the last three onboardings and put it on the piece." },
  { id: "m8", s: "q1", by: "jordan", at: "9:50", text: "Before Heather’s numbers go out, can we settle the Q1 split?" },
];
const nm = (k) => P[k]?.n || k;
const list = (ks) => (ks.length <= 1 ? ks.map(nm).join("") : ks.slice(0, -1).map(nm).join(", ") + " and " + nm(ks[ks.length - 1]));

// the four facts, as they stand for this state of the conversation
function factsOf(s, st) {
  if (s === "bw") return st.taken
    ? { hold: "jordan", wait: [], next: "Book the Felix setup call", parts: null }
    : { hold: "sam", handing: "jordan", wait: ["sam"], next: "Jordan takes it", parts: null };
  if (s === "web") return { hold: "heather", wait: ["heather"], waitOn: "sam", next: "Sam’s customer story", parts: [["Run of show", "heather", "done"], ["Invites", "orin", "done"], ["Customer story", "sam", "you"], ["Slides", "heather", "now"]] };
  return { hold: "sam", wait: ["jordan"], next: "Agree the split before Heather’s numbers go out", parts: null };
}
// does this subject ping you? only if you hold it or someone's waiting on you
function pings(s, me, st) {
  const f = factsOf(s, st);
  if (s === "bw") return st.taken ? me === "jordan" : me === "jordan";
  if (s === "web") return me === "sam" || me === "heather";
  return me === "sam" || me === "jordan";
}

function Av({ k, size = 22 }) {
  if (P[k]?.agent) return <span className="ms-av is-agent" style={{ width: size, height: size }}><AgentMark id={k} size={size - 4} /></span>;
  return <span className={`ms-av is-${k}`} style={{ width: size, height: size, fontSize: Math.round(size * 0.45) }}>{nm(k)[0]}</span>;
}
function Lock({ size = 11 }) {
  return <svg width={size} height={size} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" aria-hidden="true"><rect x="2.5" y="5.25" width="7" height="5" rx="1.2" /><path d="M4.25 5.25V3.9a1.75 1.75 0 0 1 3.5 0v1.35" /></svg>;
}
function Seg({ value, onChange, options, id, small }) {
  return (
    <div className={`seg${small ? " seg-sm" : ""}`} role="tablist">
      {options.map(([v, label]) => (
        <button key={v} role="tab" aria-selected={value === v} className={value === v ? "on" : ""} onClick={() => onChange(v)}>
          {value === v && <motion.span layoutId={`seg-${id}`} className="seg-pill" transition={{ type: "spring", visualDuration: 0.3, bounce: 0.12 }} />}
          <span className="seg-t">{label}</span>
        </button>))}
    </div>
  );
}
// a list row with the sidebar's hover (it grows out from the cursor)
function Row({ on, onClick, children, className = "" }) {
  const [hv, setHv] = useState(false), at = useRef({ x: 100, w: 260 });
  return (
    <button className={`ms-row${on ? " is-on" : ""} ${className}`} onClick={onClick}
      onPointerEnter={(e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(true); }} onPointerLeave={() => setHv(false)}>
      <AnimatePresence>{hv && !on && <RowHover key="h" o={at.current} t={{ type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] }} />}</AnimatePresence>
      {on && <SelIn className="ms-row-on" />}
      <span className="ms-row-in">{children}</span>
    </button>
  );
}

export function Messages() {
  const V = useDialKit("Messages", {
    "Message in: rise (px)": [8, 0, 24, 1], "Message in: duration (s)": [0.32, 0.1, 0.8, 0.01],
    "Filing hint: after (chars)": [6, 1, 20, 1], "Subject menu: duration (s)": [0.28, 0.1, 0.6, 0.01],
  });
  const [me, setMe] = useState("sam"), [lens, setLens] = useState("people"), [focus, setFocus] = useState("all"), [work, setWork] = useState("web");
  const [st, setSt] = useState({ taken: false, moved: false, kept: false, sent: [] });
  const visible = (s) => S[s].who.includes(me);
  const subOf = (m) => (m.id === "m6" && st.moved ? "bw" : m.s);
  const msgs = [...BASE.filter((m) => !m.needs || st[m.needs]), ...st.sent].map((m) => ({ ...m, s: subOf(m) })).filter((m) => visible(m.s));
  const others = ["sam", "jordan", "heather"].filter((k) => k !== me);
  useEffect(() => { if (focus !== "all" && !visible(focus)) setFocus("all"); if (!visible(work)) setWork("web"); }, [me]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = lens === "people" ? msgs.filter((m) => focus === "all" || m.s === focus) : msgs.filter((m) => m.s === work);
  const sel = lens === "people" ? (focus === "all" ? null : focus) : work;
  const subs = ORDER.filter(visible);
  const inT = { duration: V["Message in: duration (s)"], ease: [0.22, 1, 0.36, 1] };
  const send = (s, text) => setSt((x) => ({ ...x, sent: [...x.sent, { id: "u" + x.sent.length, s, by: me, at: "Now", text }] }));
  const listRef = useRef(null);
  useLayoutEffect(() => { const el = listRef.current; if (el) el.scrollTop = el.scrollHeight; }, [shown.length, lens, focus, work, me]);

  return (
    <div className="ms">
      <header className="ms-head">
        <div className="ms-head-l"><h1>Messages</h1><Seg value={lens} onChange={setLens} options={[["people", "By people"], ["work", "By work"]]} id="ms-lens" small /></div>
        <div className="ms-head-r"><span className="ms-va">View as</span><Seg value={me} onChange={setMe} options={[["sam", "Sam"], ["jordan", "Jordan"], ["heather", "Heather"]]} id="ms-me" small /></div>
      </header>
      <div className="ms-body">
        {/* left: the same conversations, listed by who or by what */}
        <aside className="ms-list">
          <LayoutGroup id="ms-list">
          {lens === "people" ? <>
            <p className="ms-k">Conversations</p>
            <Row on onClick={() => {}}>
              <span className="ms-avs">{others.map((k) => <Av key={k} k={k} size={20} />)}</span>
              <span className="ms-rt"><b>{list(others)}</b><small>{subs.length} subjects · {subs.filter((s) => pings(s, me, st)).length} need you</small></span>
            </Row>
            {[["caleb", "Caleb", "Monday sync deck"], ["kc", "Heather, Caleb", "Holiday campaign"]].filter((r) => !(me === "heather" && r[0] === "kc")).map(([k, n, sub]) => (
              <Row key={k} className="is-quiet" onClick={() => {}}><span className="ms-avs"><span className="ms-av is-x" style={{ width: 20, height: 20, fontSize: 9 }}>{n[0]}</span></span><span className="ms-rt"><b>{n}</b><small>{sub}</small></span></Row>))}
          </> : <>
            <p className="ms-k">Work you’re in</p>
            {subs.map((s) => (
              <Row key={s} on={work === s} onClick={() => setWork(s)}>
                <span className={`ms-bell${pings(s, me, st) ? " is-on" : ""}`} />
                <span className="ms-rt"><b>{S[s].priv && <Lock />}{S[s].t}</b><small>{S[s].shape} · {nm(factsOf(s, st).hold)} has it</small></span>
              </Row>))}
            {[["Monday sync deck", "Huddle · Caleb has it"], ["Harbor & Pine Realty", "Relay · Sam has it"]].map(([t, d]) => (
              <Row key={t} className="is-quiet" onClick={() => {}}><span className="ms-bell" /><span className="ms-rt"><b>{t}</b><small>{d}</small></span></Row>))}
          </>}
          </LayoutGroup>
          <p className="ms-note">Sample conversation. Pings follow your part in a subject, not the group: a filled dot means you hold it or someone’s waiting on you.</p>
        </aside>

        {/* centre: one conversation; subjects are addresses on each message, not separate chats */}
        <section className="ms-thread">
          <div className="ms-th-head">
            {lens === "people" ? <>
              <div className="ms-th-who"><span className="ms-avs">{others.map((k) => <Av key={k} k={k} size={22} />)}</span><b>{list(others)}</b></div>
              <div className="ms-chips" role="tablist">
                {[["all", "All"], ...subs.map((s) => [s, S[s].short])].map(([k, l]) => (
                  <button key={k} role="tab" aria-selected={focus === k} className={`ms-chip${focus === k ? " is-on" : ""}`} onClick={() => setFocus(k)}>
                    {focus === k && <motion.span layoutId="ms-chip-on" className="ms-chip-on" transition={{ type: "spring", visualDuration: 0.3, bounce: 0.1 }} />}
                    <span className="ms-chip-t">{k !== "all" && S[k].priv && <Lock />}{l}{k !== "all" && pings(k, me, st) && <i className="ms-dot" />}</span>
                  </button>))}
              </div>
            </> : <div className="ms-th-who"><b>{S[work].priv && <Lock size={12} />}{S[work].t}</b><span className="ms-avs is-r">{S[work].who.map((k) => <Av key={k} k={k} size={20} />)}</span></div>}
          </div>
          <div className="ms-msgs" ref={listRef}>
            <AnimatePresence initial={false}>
              {shown.map((m) => (
                <motion.div key={m.id} layout="position" className={`ms-m${S[m.s].priv ? " is-priv" : ""}`} initial={{ opacity: 0, y: V["Message in: rise (px)"] }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.12 } }} transition={inT}>
                  <Av k={m.by} size={26} />
                  <div className="ms-m-b">
                    <div className="ms-m-h"><b>{nm(m.by)}</b><time>{m.at}</time>
                      {lens === "people" && focus === "all" && <button className={`ms-tag${S[m.s].priv ? " is-priv" : ""}`} onClick={() => setFocus(m.s)}>{S[m.s].priv && <Lock />}{S[m.s].short}</button>}
                      {S[m.s].priv && <span className="ms-only">Only you and {nm(S[m.s].who.find((k) => k !== me))}</span>}
                    </div>
                    <p>{m.text}</p>
                    {m.kind === "handoff" && <Handoff me={me} st={st} onTake={() => setSt((x) => ({ ...x, taken: true }))} onAsk={() => send("bw", "Before I take it: is the ops lead the right person for kickoff?")} />}
                    {m.id === "m6" && !st.moved && !st.kept && (me === "jordan" || me === "sam") && (
                      <div className="ms-hint"><NorthLogo size={13} /><span>This sounds like Brightwater, not the webinar.</span>
                        <button onClick={() => setSt((x) => ({ ...x, moved: true }))}>Move it</button><button className="is-q" onClick={() => setSt((x) => ({ ...x, kept: true }))}>Keep</button></div>)}
                  </div>
                </motion.div>))}
            </AnimatePresence>
          </div>
          <Composer key={me + lens} me={me} subs={subs} start={sel || (subs.includes("web") ? "web" : subs[0])} V={V} onSend={send} />
        </section>

        {/* right: what the conversation is about, and where it stands */}
        <aside className="ms-side">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={(sel || "all") + me + (st.taken ? "t" : "") + (st.moved ? "m" : "")} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
              {sel ? <Piece s={sel} me={me} st={st} /> : <Catchup subs={subs} me={me} st={st} onOpen={(s) => setFocus(s)} />}
            </motion.div>
          </AnimatePresence>
        </aside>
      </div>
    </div>
  );
}

// the hand-off, as a message: what's done, what's open, what to watch, and the one thing the receiver does: take it
function Handoff({ me, st, onTake, onAsk }) {
  return (
    <div className="ms-ho">
      <div className="ms-ho-h"><span>Handing</span><b>Brightwater onboarding</b><span>to</span><b>Jordan</b></div>
      <dl>
        <div><dt>Done</dt><dd>{BRIEF.done}</dd></div>
        <div><dt>Open</dt><dd>{BRIEF.open}</dd></div>
        <div><dt>Watch</dt><dd>{BRIEF.watch}</dd></div>
      </dl>
      <AnimatePresence mode="wait" initial={false}>
        {st.taken ? <motion.p key="t" className="ms-ho-s is-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Jordan took it at 9:26. Sam is watching now, not holding.</motion.p>
          : me === "jordan" ? <motion.div key="a" className="ms-ho-a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.button className="btn-pri" whileTap={{ scale: 0.97 }} onClick={onTake}>Take it</motion.button>
              <motion.button className="btn-sec" whileTap={{ scale: 0.97 }} onClick={onAsk}>Ask Sam first</motion.button></motion.div>
          : <motion.p key="w" className="ms-ho-s" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{me === "sam" ? "Waiting for Jordan to take it. Until then it’s still yours." : "Sam is handing this to Jordan."}</motion.p>}
      </AnimatePresence>
    </div>
  );
}

// the ask bar: who it's to and what it's about sit above the field, so the audience is never a surprise. The subject is
// picked like an @mention; North pre-fills its guess from what you type, and you confirm it
function Composer({ me, subs, start, V, onSend }) {
  const [s, setS] = useState(start), [val, setVal] = useState(""), [menu, setMenu] = useState(false), [focus, setFocus] = useState(false);
  const guess = val.trim().length >= V["Filing hint: after (chars)"] ? subs.find((k) => S[k].kw.test(val)) : null;
  const to = S[s].who.filter((k) => k !== me);
  const send = (e) => { e.preventDefault(); if (!val.trim()) return; onSend(s, val.trim()); setVal(""); };
  return (
    <form className="ms-comp" onSubmit={send}>
      <div className="ms-to">
        <span className="ms-to-k">To</span>
        <span className="ms-to-v">{S[s].priv && <Lock />}{S[s].priv ? `Only ${list(to)}` : list(to)}</span>
        <span className="ms-to-k">About</span>
        <span className="ms-pick">
          <button type="button" className={`ms-pick-b${menu ? " is-open" : ""}`} onClick={() => setMenu((v) => !v)} aria-expanded={menu}>{S[s].priv && <Lock />}{S[s].short}
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 4.75 6 7.25l2.5-2.5" /></svg></button>
          <AnimatePresence>{menu && (
            <motion.div className="ms-pick-m" initial={{ opacity: 0, scaleY: 0.6, y: 4 }} animate={{ opacity: 1, scaleY: 1, y: 0 }} exit={{ opacity: 0, scaleY: 0.8, transition: { duration: 0.12 } }} transition={{ duration: V["Subject menu: duration (s)"], ease: [0.22, 1, 0.36, 1] }}>
              {subs.map((k) => <button type="button" key={k} className={k === s ? "is-on" : ""} onClick={() => { setS(k); setMenu(false); }}>
                <b>{S[k].priv && <Lock />}{S[k].t}</b><small>{S[k].priv ? `Only ${list(S[k].who.filter((x) => x !== me))}` : list(S[k].who.filter((x) => x !== me))}</small></button>)}
              <button type="button" className="is-new" onClick={() => setMenu(false)}><b>+ New subject</b><small>Pick who it’s for</small></button>
            </motion.div>)}</AnimatePresence>
        </span>
        <AnimatePresence>{guess && guess !== s && (
          <motion.button type="button" key={guess} className="ms-guess" initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} onClick={() => setS(guess)}>
            <NorthLogo size={12} /><span>Sounds like {S[guess].short}. Switch?</span></motion.button>)}</AnimatePresence>
      </div>
      <div className={`composer is-docked ms-field${focus ? " is-focus" : ""}`}>
        <div className="ask-field">
          <input value={val} onChange={(e) => setVal(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} aria-label="Message" autoComplete="off" />
          {!val && <span className="ph">Message about {S[s].short.toLowerCase() === "q1 split" ? "the Q1 split" : S[s].short === "Webinar" ? "the webinar" : S[s].short}…</span>}
        </div>
        <button type="button" className="ibtn ibtn-lg" aria-label="Attach"><svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="var(--navy)" strokeWidth="1.25" strokeLinecap="round" aria-hidden="true"><path d="M10 3.5v13M3.5 10h13" /></svg></button>
        <motion.button type="submit" className="voice" aria-label="Send" whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
          <span className="bars">{[5, 9, 13, 9, 5].map((h, i) => <motion.i key={i} animate={focus ? { scaleY: [1, 1.6, 0.7, 1] } : { scaleY: 1 }} transition={focus ? { duration: 0.9, repeat: Infinity, delay: i * 0.08 } : { duration: 0.2 }} style={{ height: h }} />)}</span>
        </motion.button>
      </div>
    </form>
  );
}

// one subject: its four facts, its parts (a huddle), who's in it, and whether it pings you
function Piece({ s, me, st }) {
  const f = factsOf(s, st), sub = S[s], ping = pings(s, me, st);
  const why = s === "web" ? (me === "sam" ? "Heather’s waiting on your customer story." : me === "heather" ? "You’re assembling it." : "You’re in it, but nobody’s waiting on you.")
    : s === "bw" ? (st.taken ? (me === "jordan" ? "You hold it now." : "You’re watching. Jordan holds it.") : (me === "jordan" ? "It’s being handed to you." : me === "sam" ? "You hold it until Jordan takes it." : "You’re watching."))
    : (me === "sam" ? "Jordan’s waiting on you." : "You’re waiting on Sam.");
  return (
    <div className="ms-pc">
      <p className="ms-k">{sub.shape}</p>
      <h2>{sub.priv && <Lock size={13} />}{sub.t}</h2>
      <dl className="ms-facts">
        <div><dt>For</dt><dd>{sub.forL}</dd></div>
        <div><dt>Has it</dt><dd>{f.handing ? <>{nm(f.hold)}, handing to {nm(f.handing)}</> : nm(f.hold)}</dd></div>
        <div><dt>Waiting</dt><dd>{s === "web" ? "Heather, on Sam" : f.wait.length ? list(f.wait) : "Nobody"}</dd></div>
        <div><dt>Next</dt><dd>{f.next}</dd></div>
      </dl>
      {f.parts && <div className="ms-parts"><p className="ms-k">Parts</p>{f.parts.map(([t, k, x]) => (
        <div key={t} className={`ms-part is-${x}`}><Av k={k} size={18} /><span className="ms-pt">{t}</span><em>{x === "done" ? "In" : x === "you" ? (me === "sam" ? "Needs you" : "Waiting on Sam") : "Working"}</em></div>))}</div>}
      <div className={`ms-ping${ping ? " is-on" : ""}`}><i /><div><b>{ping ? "Pings you" : "Quiet for you"}</b><span>{why}</span></div></div>
      <div className="ms-in"><p className="ms-k">Who can see it</p><span className="ms-avs">{sub.who.map((k) => <Av key={k} k={k} size={20} />)}</span>
        {sub.priv && <small>Heather is in your group, but not in this. She sees nothing of it, not even that it exists.</small>}</div>
    </div>
  );
}
// "All": what changed in each subject since you last looked, one line each, written by North
function Catchup({ subs, me, st, onOpen }) {
  const L = {
    bw: st.taken ? "Jordan took it and is booking the setup call for Thursday. The HubSpot sync question is still open." : "Sam is handing it to Jordan. Not taken yet.",
    web: me === "sam" ? "Heather posted the run of show and is waiting on your customer story." : "Run of show is up. Sam is doing the customer story.",
    q1: me === "sam" ? "Jordan wants the split settled before Heather’s numbers go out." : "Waiting on Sam.",
  };
  return (
    <div className="ms-pc">
      <p className="ms-k">Since you last looked</p>
      <div className="ms-cu">{subs.map((s) => (
        <button key={s} className="ms-cu-r" onClick={() => onOpen(s)}>
          <span className={`ms-bell${pings(s, me, st) ? " is-on" : ""}`} />
          <span><b>{S[s].priv && <Lock />}{S[s].short}</b><span>{L[s]}</span></span>
        </button>))}</div>
      <p className="ms-note">One line per subject instead of every message. Open one for where it stands.</p>
    </div>
  );
}
