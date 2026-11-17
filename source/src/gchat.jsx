// Continue in Google Chat — the handoff from thinking (North) to talking (Google Chat).
// North suggests who should be in it (it knows who owns what), writes a short brief (not the transcript),
// suggests an existing space when one already covers the topic, and joins the chat so @North works there.
// The North thread keeps one link back; the conversation itself lives in Google Chat.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toMotion } from "./lib.js";
import { Orb, AGENTS } from "./agents.jsx";

export const PEOPLE = [
  { id: "caleb", n: "Caleb", role: "Sales", owns: "Outbound" },
  { id: "heather", n: "Heather", role: "VP Sales", owns: "New Business" },
  { id: "lisa", n: "Lisa", role: "Marketing", owns: "Inbound" },
  { id: "rick", n: "Rick", role: "Finance", owns: "Total ARR" },
  { id: "dustin", n: "Dustin", role: "Product & Eng", owns: "Felix", limited: "won't see comp data" },
  { id: "pd", n: "PD", role: "Customer Value", owns: "Renewals" },
  { id: "jordan", n: "Jordan", role: "AE", owns: "SMB renewals" },
];
export const SPACES = [
  { id: "#sales-leadership", d: "Heather, Caleb, Lisa + 4" },
  { id: "#monday-sync", d: "Leadership · weekly" },
  { id: "#revenue", d: "Rick, Dustin, PD + 9" },
];
export const byId = (id) => PEOPLE.find((p) => p.id === id);

// who should be in it, and where it probably already belongs
export function suggestFor(text) {
  const s = (text || "").toLowerCase();
  const pick = (ids, space, ask, reply1, reply2) => ({ people: ids, space, ask, reply1, reply2 });
  if (/outbound|sdr|caleb/.test(s)) return pick(["caleb", "heather"], "#sales-leadership", "Can we move one SDR back to Outbound for the last two weeks of the month?",
    "Yes. I'll move Sam back Monday. @North what does that get us by Dec 31?",
    "Back at the pre-Oct 14 rate ($7.5K a day) from Nov 2, Outbound adds about $440K by Dec 31. That closes October's $443.6K gap over the quarter, not this month.");
  if (/renewal|nrr|smb|jordan|churn|grr/.test(s)) return pick(["jordan", "pd", "rick"], "#revenue", "Can we get QBRs on the calendar for the four quiet accounts before they renew?",
    "I can get QBRs booked with all four this week. @North which one renews first?",
    "Brightline, on Nov 14 ($46K). It also just cut seats in the app, so start there.");
  if (/inbound|demo|pipeline/.test(s)) return pick(["lisa", "heather"], "#sales-leadership", "What would it take to lift the demo held rate before month end?",
    "No-shows are mostly same-week bookings. @North how many demos are booked for next week?",
    "61 demos booked for next week; 24 were booked in the last 48 hours, the group most likely to no-show.");
  if (/expansion|win rate/.test(s)) return pick(["heather", "pd"], "#sales-leadership", "Which expansion deals can we push over the line this month?",
    "@North which open expansion deals are past their close date?",
    "Nine, worth $212K together. Northwind's second team ($48K) is the largest and has had no activity in 12 days.");
  if (/felix|activation|handoff|ttv/.test(s)) return pick(["dustin", "pd"], "#revenue", "What's slowing customers down between activation and their tenth handoff?",
    "Most stall on contact import. @North how many accounts activated without importing contacts?",
    "23 of this month's 82 activations haven't imported contacts. They average 31 days to ten handoffs, against 14 for the rest.");
  if (/40m|plan|year|total arr|scenario|lever|path/.test(s)) return pick(["heather", "rick", "caleb"], "#monday-sync", "Which of the three levers do we commit to this week?",
    "Outbound first; it's the one we control. @North what's the plan if only Outbound recovers?",
    "Outbound back to pace alone gets the year to about $39.62M, $410K short. The other two levers close the rest.");
  return pick(["heather"], "#sales-leadership", "What should we do about this before Monday?",
    "Taking a look. @North who owns the accounts behind this?",
    "Mostly Caleb's and Jordan's books. I've sent each of them their list.");
}
export function namesIn(text) { const s = (text || "").toLowerCase(); return PEOPLE.filter((p) => new RegExp(`\\b${p.n.toLowerCase()}\\b`).test(s)).map((p) => p.id); }

export const Ava = ({ id, size = 22 }) => { const p = byId(id); const hue = { caleb: "#6d4fc2", heather: "#098486", lisa: "#ff725c", rick: "#093555", dustin: "#7f9bb2", pd: "#b0742a", jordan: "#9b1b5a", you: "#093555", north: "#093555" }[id] || "#093555";
  return <i className="gc-ava" style={{ width: size, height: size, background: hue, fontSize: size * 0.42 }}>{id === "north" ? "N" : id === "you" ? "S" : (p ? p.n[0] : "?")}</i>; };
export const GcIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    <path d="M2.5 3.5h7a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H6l-2.2 1.8V9.5H2.5a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1Z" /><path d="M10.5 6h3a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1v1.7L10.4 12H8.5a1 1 0 0 1-1-1v-.5" />
  </svg>
);

const nameList = (ids) => { const n = ids.map((id) => byId(id)?.n).filter(Boolean); return n.length < 2 ? n.join("") : `${n.slice(0, -1).join(", ")} and ${n[n.length - 1]}`; };
const SPACE_RE = /(?:#|\b(?:in|to|into|on)\s+(?:the\s+)?)(sales[\s-]*leadership|monday[\s-]*sync|revenue)\b(?:\s+(?:space|channel|room))?/i;
const spaceOf = (m) => "#" + m.toLowerCase().replace(/\s+/g, "-").replace(/-+/g, "-");

// Talk to the draft instead of clicking: "post it in sales leadership and tag Lisa", "drop Heather", "start a new chat",
// "also ask whether Sam can start Monday", "send it". Returns null when it isn't about the draft (a question for North).
export function applyCommand(g, text, initial = false) {
  const raw = (text || "").trim(), s = raw.toLowerCase();
  if (!s) return null;
  let n = { ...g, people: [...g.people] }, did = [], send = false, hit = false;
  const sp = s.match(SPACE_RE);
  if (sp) { n.dest = spaceOf(sp[1]); did.push(`Posting in ${n.dest}`); hit = true; }
  if (/\b(new chat|new group|start a (new )?chat|group chat|direct message|dm them|not in a (channel|space))\b/.test(s)) { n.dest = "new"; did.push("New chat"); hit = true; }
  // brief edits: "add to the brief: …", "also ask …", "say …", "tell them …"
  const bm = raw.match(/^(?:add (?:to|in) the (?:brief|message)|in the (?:brief|message)|also (?:say|ask|mention)|say|tell them|ask them|ask|mention)\s*[:,]?\s+(.+)$/i);
  const names = PEOPLE.filter((p) => new RegExp(`\\b${p.n.toLowerCase()}\\b`).test(s));
  if (bm && !names.length && !sp) {
    let add = bm[1].trim().replace(/[.?!]+$/, ""); const asking = /^(?:also ask|ask them|ask)\b/i.test(raw) || /^(can|could|should|what|who|when|why|how|is|are|do|does|will)\b/i.test(add);
    if (/^(whether|if)\b/i.test(add)) add = `Could we also check ${add}?`;
    else add = `${add[0].toUpperCase()}${add.slice(1)}${asking ? "?" : "."}`;
    n.brief = `${n.brief.trim()} ${add}`; did.push("Added to the brief"); hit = true;
  } else names.forEach((p) => {
    const i = s.search(new RegExp(`\\b${p.n.toLowerCase()}\\b`)), before = s.slice(Math.max(0, i - 28), i);
    if (/\b(remove|drop|take|without|untag|not|no|minus|except)\b[^,.;]*$/.test(before)) { if (n.people.includes(p.id)) { n.people = n.people.filter((x) => x !== p.id); did.push(`Removed ${p.n}`); } }
    else if (!n.people.includes(p.id)) { n.people.push(p.id); did.push(n.dest === "new" ? `Added ${p.n}` : `Tagged ${p.n}`); }
    hit = true;
  });
  if (!initial && /(^|\b(and|then)\s+)(send|post|ship|start)( it| the chat| that)?[.!]?$/.test(s)) { send = true; hit = true; }
  if (!hit) {
    if (initial || /\?$/.test(raw)) return null; // a question goes to North as usual
    n.brief = `${n.brief.trim()} ${raw[0].toUpperCase()}${raw.slice(1)}${/[.?!]$/.test(raw) ? "" : "."}`; did.push("Added to the brief");
  }
  return { g: n, did, send };
}

// the attached chart, small and legible in a chat card (no squeezed versions of the big charts)
function MiniRows({ c }) {
  const rows = c.kind === "radial" ? c.parts.map(([l, v, col]) => [l, v / c.whole, `$${v >= 1000 ? (v / 1000).toFixed(2) + "M" : Math.round(v) + "K"}`, col])
    : c.rows ? c.rows.map(([l, f, v]) => [l, f, v, "#093555"]) : [];
  if (!rows.length) return null;
  return <div className="gc-rows">{rows.map(([l, f, v, col]) => (
    <div key={l} className="gc-r"><span>{l}</span><i><b style={{ width: `${Math.max(4, f * 100)}%`, background: col }} /></i><em>{v}</em></div>
  ))}</div>;
}

// how it lands in Google Chat — opened from the link, over the page, so North's thread never holds a copy of the conversation
export function GcPreview({ g, M, onClose, snapshot, onOpen }) {
  const T = toMotion(M.chat.swap);
  // the reply comes from whoever it was written for, if they're still in it
  const first = byId(g.people.includes(g.r1who) ? g.r1who : g.people[0]);
  const where = g.dest === "new" ? g.topic : g.dest;
  const tags = g.dest !== "new" && g.people.length ? g.people.map((id) => `@${byId(id)?.n}`).join(" ") + " " : "";
  useEffect(() => { const k = (e) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }; window.addEventListener("keydown", k, true); return () => window.removeEventListener("keydown", k, true); }, []);
  return (
    <motion.div className="gc-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onClose}>
      <motion.div className="gc-win" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} transition={T} onClick={(e) => e.stopPropagation()}>
        <div className="gc-win-h"><b>{where}</b><span>{g.dest === "new" ? `You, ${nameList(g.people)}, North${(g.agents || []).map((ag) => `, ${AGENTS[ag.id].n}`).join("")}` : SPACES.find((x) => x.id === g.dest)?.d}</span><em>Google Chat · preview</em>
          <button className="ibtn" aria-label="Close preview" onClick={onClose}><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg></button></div>
        <div className="gc-win-b">
          <div className="gc-post">
            <Ava id="north" size={28} />
            <div className="gc-post-b">
              <span className="gc-who"><b>North</b><small>App · shared by Beyonce</small></span>
              {g.summary && <p className="gc-sum-t">Recap · {g.title}</p>}
              {g.summary && tags && <p><span className="gc-tag">{tags}</span></p>}
              <p>{!g.summary && tags && <span className="gc-tag">{tags}</span>}{g.brief}</p>
              {/* a link, not a chart: Google Chat shows the preview, the click opens the live chart in North */}
              <button className="gc-unfurl" onClick={onOpen} aria-label="Open this chart in North">
                {snapshot && <span className="gc-shot" aria-hidden="true"><span className="gc-shot-in">{snapshot}</span></span>}
                <span className="gc-unf-t"><small>north.fello.ai</small><b>{g.summary ? `Recap · ${g.title}` : g.card?.title || g.topic}</b><span>{g.summary ? `${g.summary.n} answers from North${g.summary.charts ? `, ${g.summary.charts} ${g.summary.charts === 1 ? "chart" : "charts"}` : ""}` : g.card?.sub || g.lead}</span></span>
              </button>
            </div>
          </div>
          {(g.agents || []).map((ag) => (
            <div key={ag.id} className="gc-post">
              <span className="gc-ava-orb"><Orb id={ag.id} size={28} /></span>
              <div className="gc-post-b"><span className="gc-who"><b>{AGENTS[ag.id].n}</b><small>App · {AGENTS[ag.id].role}</small></span><p>{ag.text}</p></div>
            </div>
          ))}
          <AnimatePresence initial={false}>
            {g.replies >= 1 && first && (
              <motion.div key="r1" className="gc-post" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={T}>
                <Ava id={first.id} size={28} /><div className="gc-post-b"><span className="gc-who"><b>{first.n}</b><small>{first.role}</small></span><p>{g.reply1}</p></div>
              </motion.div>
            )}
            {g.replies >= 2 && (
              <motion.div key="r2" className="gc-post" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={T}>
                {g.r2agent ? <span className="gc-ava-orb"><Orb id={g.r2agent} size={28} /></span> : <Ava id="north" size={28} />}
                <div className="gc-post-b"><span className="gc-who"><b>{g.r2agent ? AGENTS[g.r2agent].n : "North"}</b><small>App</small></span><p>{g.reply2}</p></div>
              </motion.div>
            )}
            {g.typing && g.replies < 2 && (
              <motion.div key={`ty${g.replies}`} className="gc-typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
                <i /><i /><i /><span>{g.replies === 0 ? `${first?.n} is typing` : `${g.r2agent ? AGENTS[g.r2agent].n : "North"} is answering`}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// m.gc = { step, people, suggested, dest, space, brief, topic, lead, card, replies, flash }
// a summary's message, rebuilt from the sections you've picked (everything else stays as you set it)
export function summaryOf(g) {
  const picked = g.order.filter((tp) => g.sections.includes(tp)).map((tp) => g.secs[tp]);
  const n = picked.reduce((a, x) => a + x.n, 0), charts = picked.reduce((a, x) => a + x.charts, 0);
  const title = g.sections.length === 1 ? g.sections[0] : g.sections.length === 2 ? `${g.sections[0]} and ${g.sections[1]}` : `${g.sections.slice(0, -1).join(", ")} and ${g.sections[g.sections.length - 1]}`;
  // a written recap: one paragraph per answer, no closing question; the people in the chat take it from there
  return { ...g, topic: g.sections[0], title, summary: { n, charts }, brief: [...new Set(picked.flatMap((x) => x.paras))].join("\n\n") };
}

// where the caret is inside a textarea (for the @ list to open right under what you're typing)
export function caretXY(ta) {
  const cs = getComputedStyle(ta), d = document.createElement("div");
  ["fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopWidth", "borderLeftWidth", "boxSizing", "textTransform", "wordSpacing"].forEach((k) => (d.style[k] = cs[k]));
  Object.assign(d.style, { position: "absolute", visibility: "hidden", whiteSpace: "pre-wrap", wordWrap: "break-word", width: `${ta.offsetWidth}px`, top: "0", left: "-9999px" });
  d.textContent = ta.value.slice(0, ta.selectionStart);
  const sp = document.createElement("span"); sp.textContent = "​"; d.appendChild(sp); document.body.appendChild(d);
  const r = { x: sp.offsetLeft, y: sp.offsetTop + parseFloat(cs.lineHeight || 20) }; d.remove(); return r;
}

// m.gc = { step, people, suggested, dest, space, brief, topic, lead, card, replies, flash }
export function GcHandoff({ m, M, update, toast, onPreview }) {
  const g = m.gc, set = (patch) => update(m.id, { ...g, ...patch });
  const [q, setQ] = useState("");
  const [pop, setPop] = useState(null); // { kind: to | space | at, x, y, q? , start? }
  const [act, setAct] = useState(0);
  const bodyRef = useRef(null), toRef = useRef(null), briefRef = useRef(null), spaceRef = useRef(null);
  const T = toMotion(M.chat.swap);
  const inSpace = g.dest !== "new";
  // the brief grows to fit, like the chat field
  const fit = () => { const el = briefRef.current; if (!el) return; el.style.height = "auto"; el.style.height = `${el.scrollHeight}px`; };
  useLayoutEffect(fit, [g.brief, g.step]);
  // and again whenever its width changes (dock ⇄ full screen, the tile settling)
  useEffect(() => { const el = briefRef.current; if (!el) return; const ro = new ResizeObserver(() => fit()); ro.observe(el); return () => ro.disconnect(); }, [g.step]);
  // after it lands, a teammate answers and North answers them in the same Google Chat thread (only the count shows here)
  useEffect(() => {
    if (g.step !== "sent" || g.replies >= 2) return;
    const t = setTimeout(() => set({ replies: g.replies + 1, typing: false }), (g.replies === 0 ? 1 : 0.8) * M.chat.gcReplyMs);
    const ty = setTimeout(() => set({ typing: true }), (g.replies === 0 ? 0.45 : 0.2) * M.chat.gcReplyMs);
    return () => { clearTimeout(t); clearTimeout(ty); };
  }, [g.step, g.replies]);
  // what you just said to the draft, confirmed in a line, then gone
  useEffect(() => { if (!g.flash) return; const t = setTimeout(() => set({ flash: null }), 2600); return () => clearTimeout(t); }, [g.flash]);


  // one list at a time, opened from what you clicked: where it goes, who's in it, which sections, or an @ in the message
  const items = useMemo(() => {
    if (!pop) return [];
    if (pop.kind === "space") return [...[g.space, ...SPACES.map((x) => x.id).filter((id) => id !== g.space)].map((id) => ({ k: "s", x: SPACES.find((x) => x.id === id), on: id === g.dest, sug: id === g.space })), { k: "new", on: g.dest === "new" }];
    if (pop.kind === "sec") return g.order.map((tp) => ({ k: "sec", tp, on: g.sections.includes(tp) }));
    const s = (pop.kind === "at" ? pop.q || "" : q).trim().toLowerCase().replace(/^@/, "");
    return PEOPLE.filter((p) => !s || p.n.toLowerCase().startsWith(s)).map((p) => ({ k: "p", p, on: g.people.includes(p.id) }));
  }, [pop, q, g.people, g.dest, g.sections]);
  useEffect(() => setAct(0), [pop && pop.kind, q, pop && pop.q]);
  // lists open above the footer (it sits at the bottom of the chat) and under the caret in the message
  const up = (el) => { const b = bodyRef.current.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: Math.max(0, Math.min(r.left - b.left, b.width - 272)), bottom: b.bottom - r.top + 6 }; };
  const toggle = (kind, el) => setPop(pop && pop.kind === kind ? null : { kind, ...up(el) });
  const openAt = (ta) => {
    const before = ta.value.slice(0, ta.selectionStart), mm = before.match(/(^|\s)@(\w*)$/);
    if (!mm) { if (pop && pop.kind === "at") setPop(null); return; }
    const c = caretXY(ta), b = bodyRef.current.getBoundingClientRect(), r = ta.getBoundingClientRect();
    setPop({ kind: "at", q: mm[2], start: ta.selectionStart - mm[2].length - 1, x: Math.max(0, Math.min(r.left - b.left + c.x - 8, b.width - 272)), y: r.top - b.top + c.y - ta.scrollTop + 4 });
  };
  const pick = (x) => {
    if (!x) return;
    if (pop && pop.kind === "at") {
      const ta = briefRef.current, end = ta.selectionStart, ins = `@${x.p.n} `;
      set({ brief: g.brief.slice(0, pop.start) + ins + g.brief.slice(end), people: g.people.includes(x.p.id) ? g.people : [...g.people, x.p.id] });
      setPop(null); requestAnimationFrame(() => { ta.focus(); const at = pop.start + ins.length; ta.setSelectionRange(at, at); });
      return;
    }
    if (x.k === "p") set({ people: x.on ? g.people.filter((id) => id !== x.p.id) : [...g.people, x.p.id] });
    else if (x.k === "s") { set({ dest: x.x.id }); setPop(null); }
    else if (x.k === "new") { set({ dest: "new" }); setPop(null); }
    else if (x.k === "sec") { const next = x.on ? g.sections.filter((tp) => tp !== x.tp) : g.order.filter((tp) => tp === x.tp || g.sections.includes(tp)); if (next.length) set(summaryOf({ ...g, sections: next })); }
  };
  const nav = (e) => {
    if (!pop || !items.length) return false;
    if (e.key === "ArrowDown") { e.preventDefault(); setAct((a) => (a + 1) % items.length); return true; }
    if (e.key === "ArrowUp") { e.preventDefault(); setAct((a) => (a - 1 + items.length) % items.length); return true; }
    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pick(items[act]); return true; }
    if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setPop(null); return true; }
    return false;
  };
  // the people list has its own search; keys land there while it's open
  useEffect(() => { if (pop && pop.kind === "ppl") requestAnimationFrame(() => toRef.current && toRef.current.focus()); else setQ(""); }, [pop && pop.kind]);
  useEffect(() => {
    if (!pop || pop.kind === "at") return;
    const off = (e) => { if (!e.target.closest || (!e.target.closest(".gc-pop") && !e.target.closest(".gc-open"))) setPop(null); };
    document.addEventListener("pointerdown", off, true); return () => document.removeEventListener("pointerdown", off, true);
  }, [pop && pop.kind]);

  // compose → sending (a beat) → sent with 10s to undo → sent for good
  const sent = g.step !== "compose", done = g.step === "sent";
  useEffect(() => {
    if (g.step === "sending") { const t = setTimeout(() => set({ step: "undo", undoMs: M.chat.gcUndoS * 1000 }), M.chat.gcSendMs); return () => clearTimeout(t); }
    if (g.step === "undo") { const t = setTimeout(() => set({ step: "sent", replies: 0 }), M.chat.gcUndoS * 1000); return () => clearTimeout(t); }
  }, [g.step]);
  // the countdown, in whole seconds
  const [left, setLeft] = useState(0);
  useEffect(() => { if (g.step !== "undo") return; const t0 = Date.now(), n = M.chat.gcUndoS; setLeft(n); const iv = setInterval(() => setLeft(Math.max(0, Math.ceil(n - (Date.now() - t0) / 1000))), 200); return () => clearInterval(iv); }, [g.step]);
  const limited = g.people.map(byId).filter((p) => p && p.limited);
  const who = g.people.length > 2 ? `${g.people.slice(0, 2).map((id) => byId(id)?.n).join(", ")} +${g.people.length - 2}` : g.people.map((id) => byId(id)?.n).join(", ");
  const scope = g.summary ? (g.sections.length === 1 ? g.sections[0] : `${g.sections.slice(0, -1).join(", ")} and ${g.sections[g.sections.length - 1]}`) : null;
  const sw = { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -4 }, transition: T };

  // a tile, like the metric tiles: the message on the cream panel, where it goes and who's in it in the footer under it
  return (
    <motion.div className="ch-msg gc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={T}>
      <motion.div layout className={`gc-tile is-${g.step}${done ? " is-sent" : ""}`} ref={bodyRef} transition={T} style={{ "--undo": `${M.chat.gcUndoS}s`, "--sending": `${M.chat.gcSendMs}ms` }}
        onClick={done ? onPreview : undefined} role={done ? "button" : undefined}>
        <motion.div layout="position" className="gc-panel" initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.05 } } }}>
          <motion.div className="gc-kick" variants={{ h: { opacity: 0, y: 6 }, s: { opacity: 1, y: 0, transition: T } }}>
            {/* the chat icon becomes a check that draws itself once it's sent */}
            <AnimatePresence mode="popLayout" initial={false}>
              {g.step === "undo" || done
                ? <motion.svg key="ok" className="gc-ok" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={T}>
                    <motion.path d="M3.5 8.5l3 3 6-7" initial={{ pathLength: done && g.step === "sent" && !g.fresh ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.36, ease: [0.65, 0, 0.35, 1], delay: 0.08 }} />
                  </motion.svg>
                : <motion.span key="ic" className="gc-ic" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.6 }}><GcIcon size={14} /></motion.span>}
            </AnimatePresence>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span key={g.step === "undo" || done ? "s" : g.step} {...sw}>{g.step === "sending" ? "Sending…" : sent ? `Sent to ${g.dest === "new" ? "Google Chat" : g.dest}` : g.summary ? "Summary for Google Chat" : "Google Chat"}</motion.span>
            </AnimatePresence>
            {!sent && <button className="ibtn gc-x" aria-label="Cancel" onClick={() => update(m.id, null)}><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>}
          </motion.div>
          {g.summary && (
            <motion.div className="gc-sumh" variants={{ h: { opacity: 0, y: 6 }, s: { opacity: 1, y: 0, transition: T } }}>
              <h4>Recap · {g.title}</h4>
              {!sent && <button className="gc-open gc-more" onClick={(e) => toggle("sec", e.currentTarget)}>{g.order.length > g.sections.length ? "Add sections" : "Change"}</button>}
            </motion.div>
          )}
          <motion.div variants={{ h: { opacity: 0, y: 6 }, s: { opacity: 1, y: 0, transition: T } }}>
            {sent
              ? <p className="gc-msg is-read">{g.brief}</p>
              : <textarea ref={briefRef} className="gc-msg" value={g.brief} rows={2} aria-label="Message"
                  onChange={(e) => { set({ brief: e.target.value }); const ta = e.target; requestAnimationFrame(() => openAt(ta)); }}
                  onKeyDown={(e) => { if (pop && pop.kind === "at") nav(e); }}
                  onClick={(e) => openAt(e.currentTarget)} onBlur={() => setTimeout(() => setPop((p) => (p && p.kind === "at" ? null : p)), 150)} />}
          </motion.div>
          {/* agents coming along: each posts its own take in the chat */}
          {(g.agents || []).length > 0 && (
            <motion.div className="gc-agents" variants={{ h: { opacity: 0, y: 6 }, s: { opacity: 1, y: 0, transition: T } }}>
              {g.agents.map((ag) => (
                <div key={ag.id} className="gc-agent">
                  <Orb id={ag.id} size={16} />
                  <span><b>{AGENTS[ag.id].n}</b> {sent ? "posts" : "will post"}: {ag.text}</span>
                  {!sent && <button className="ibtn gc-x" aria-label={`Leave ${AGENTS[ag.id].n} out`} onClick={() => set({ agents: g.agents.filter((x) => x.id !== ag.id), r2agent: g.agents.filter((x) => x.id !== ag.id).slice(-1)[0]?.id || null, reply1: g.reply1.replace(`@${AGENTS[ag.id].n}`, "@North") })}><svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg></button>}
                </div>
              ))}
            </motion.div>
          )}
          <motion.div className="gc-att" variants={{ h: { opacity: 0, y: 6 }, s: { opacity: 1, y: 0, transition: T } }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true"><path d="M3 13V8M8 13V3M13 13V6" /></svg>
            {g.summary ? `${g.summary.n} ${g.summary.n === 1 ? "answer" : "answers"}${g.summary.charts ? `, ${g.summary.charts} ${g.summary.charts === 1 ? "chart" : "charts"}` : ""}` : `${g.card?.title || g.topic}${g.card?.big ? ` · ${g.card.big}` : ""}`} · opens in North
          </motion.div>
          {limited.length > 0 && !sent && <p className="gc-lim">{nameList(limited.map((p) => p.id))} {limited[0].limited}.</p>}
        </motion.div>

        {/* a hairline along the panel's bottom edge: a quick sweep while it sends, then it drains through the undo window */}
        {(g.step === "sending" || g.step === "undo") && <i key={g.step} className={`gc-prog is-${g.step}`} aria-hidden="true" />}
        {/* the footer: where · who · send. Same strip as the metric tiles */}
        <div className="gc-bar">
          <button className="gc-open gc-dest" disabled={sent} onClick={(e) => { e.stopPropagation(); toggle("space", e.currentTarget); }}>
            {g.dest === "new" ? "New chat" : g.dest}{!sent && <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 4l2.5 2.5L7.5 4" /></svg>}
          </button>
          <button className="gc-open gc-who" disabled={sent} onClick={(e) => { e.stopPropagation(); toggle("ppl", e.currentTarget); }}>
            <span className="gc-stack">{g.people.slice(0, 4).map((id) => <Ava key={id} id={id} size={20} />)}{(g.agents || []).map((ag) => <span key={ag.id} className="gc-stack-orb"><Orb id={ag.id} size={20} /></span>)}</span>
            <span className="gc-names">{g.people.length ? <>{g.dest !== "new" && <em>@</em>}{who}</> : "Add people"}{(g.agents || []).length ? ` · ${g.agents.map((ag) => AGENTS[ag.id].n).join(", ")}` : ""}</span>
          </button>
          <span className="gc-sp" />
          <AnimatePresence mode="popLayout" initial={false}>
            {g.step === "sending"
              ? <motion.span key="sending" className="gc-go is-quiet" {...sw}>Sending</motion.span>
              : g.step === "undo"
              ? <motion.button key="undo" className="gc-go gc-undo" {...sw} onClick={(e) => { e.stopPropagation(); set({ step: "compose" }); }}>Undo <em>{left}s</em></motion.button>
              : done
              ? <motion.span key="sent" className="gc-go is-sent" {...sw}>{g.replies ? `${g.replies} ${g.replies === 1 ? "reply" : "replies"} · ` : ""}Open ↗</motion.span>
              : g.flash
                ? <motion.span key={g.flash} className="gc-flash" {...sw}>✓ {g.flash}</motion.span>
                : <motion.button key="send" className="gc-go" {...sw} disabled={g.dest === "new" && !g.people.length} onClick={() => { setPop(null); set({ step: "sending", flash: null }); }}>
                    Send <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
                  </motion.button>}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {pop && !sent && (items.length > 0 || pop.kind === "ppl") && (
            <motion.div key={pop.kind} className="gc-pop" style={pop.bottom != null ? { left: pop.x, bottom: pop.bottom } : { left: pop.x, top: pop.y }}
              initial={{ opacity: 0, y: pop.bottom != null ? 4 : -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.1 } }} transition={T}
              onMouseDown={(e) => { if (e.target.tagName !== "INPUT") e.preventDefault(); }}>
              {pop.kind === "ppl" && <input ref={toRef} className="gc-find" value={q} placeholder="Find someone" onChange={(e) => setQ(e.target.value)} onKeyDown={nav} />}
              {items.map((x, i) => {
                const cls = `${i === act ? "is-act" : ""}${x.on ? " is-on" : ""}`, enter = () => setAct(i);
                const check = <i className="gc-check">{x.on ? "✓" : ""}</i>;
                if (x.k === "p") return <button key={x.p.id} className={cls} onMouseEnter={enter} onClick={() => pick(x)}><Ava id={x.p.id} size={20} /><b>{x.p.n}</b><small>{x.p.role}</small>{pop.kind === "ppl" && check}</button>;
                if (x.k === "s") return <button key={x.x.id} className={cls} onMouseEnter={enter} onClick={() => pick(x)}><i className="gc-hash">#</i><b>{x.x.id.slice(1)}</b><small>{x.sug ? "Suggested" : x.x.d}</small>{check}</button>;
                if (x.k === "sec") return <button key={x.tp} className={cls} onMouseEnter={enter} onClick={() => pick(x)}><i className="gc-hash">§</i><b>{x.tp}</b><small /> {check}</button>;
                return <button key="new" className={`${cls} is-new`} onMouseEnter={enter} onClick={() => pick(x)}><i className="gc-hash">+</i><b>New chat</b><small>Just the people</small>{check}</button>;
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
