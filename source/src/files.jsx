// Files: decks and reports that come back to you. They live where they were made (the conversation, the work item) and
// open in the same panel as everything else: the file takes the panel, the box under it talks to whoever made it, and
// what you say is about the slide you're on. Every figure here comes from the prototype's data (deals.js and the
// lost-demo review); the deals are sample data and the slides say so.
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CoverArt, hasCoverArt } from "./covers.jsx";
import { motion, AnimatePresence, useIsPresent } from "motion/react";
import { createPortal } from "react-dom";
import { DEALS, OCT, sumK, GOAL, THREATS, STAGES } from "./deals.js";
import { ROOMS, AccountView, DealStrip, Face } from "./account.jsx";
import { onIntent } from "./voice-intents.js";

const OCT_K = sumK(OCT);
const NOTE = "Sample deals, not from HubSpot.";

// the deck Riley makes for Thursday's leadership review: four slides from the late-stage deals
export const DECK = {
  k: "deck", t: "Late-stage deals · Thursday review", kind: "Deck", by: "riley",
  slides: [
    { k: "title", t: "Late-stage new-logo deals", sub: "New Business · Thursday leadership review" },
    { k: "gap", t: `$${GOAL}K gets New ARR back on pace`, sub: `${OCT.length} deals can still close in October, worth $${OCT_K}K together.` },
    { k: "deals", t: `${OCT.length} deals can close in October`, sub: "By close date" },
    { k: "risk", t: "What could stop them", sub: "And who’s on it" },
  ],
};
// Orin's lost-demo review, as the report it is
export const REVIEW = {
  k: "review", t: "Lost-demo review", kind: "Report", by: "orin", when: "Oct 24",
  body: [
    ["h", "What we found"],
    ["p", <><b>14 of the last 20</b> lost demos were booked by outbound after Oct 14.</>],
    ["p", <><b>11</b> of them had no follow-up within two days.</>],
    ["h", "What it means"],
    ["p", "The demos aren’t lost in the call. They go quiet after it, before anyone writes back."],
    ["h", "What to do"],
    ["p", "Send each of the 11 a follow-up from you. Orin has drafted one for each."],
  ],
};

// the rest of the files, one home each (the team they're about). Reports quote Company health's own October figures.
const kv = (rows) => ["kv", rows];
export const FILES = [
  { k: "review", dept: "Sales", ...REVIEW, st: "Done" },
  // the deal itself, as a room four people work in (account.jsx): opens beside its conversation
  { k: "acct-coast", dept: "Sales", t: "Coastline Brokers", kind: "Account", by: "sam", st: "Sample deal", room: "coast" },
  // every other sample deal gets a room too (opened beside a conversation about it); they aren't files, so lists skip them
  ...["harbor", "summit", "meridian", "bayview", "redwood", "oakline", "keystone"].map((id) => ({ k: `acct-${id}`, dept: "Sales", t: (ROOMS[id] || {}).deal?.n || id, kind: "Account", by: "sam", st: "Sample deal", room: id, hidden: true })),
  { k: "secpack", chat: "t-coast", dept: "Sales", t: "Security packet · Coastline Brokers", kind: "Doc", by: "fia", when: "Today", st: "Waiting on Dustin’s review", deal: "coast",
    flow: [["fia", "Drafted from our standard answers", "done"], ["dustin", "Security review", "now"], ["sam", "Send to Priya with a note", "next"]],
    body: [["h", "Why it exists"], ["p", "Coastline’s legal team won’t approve the contract without our security documentation. If it doesn’t reach them, the contract restarts and the deal misses Oct 30."],
      ["h", "What’s in it"], ["sec", [["Data", "How we store and handle customer data", "Standard answer"], ["Access", "Who can access what, and how access is reviewed", "Standard answer"], ["Incidents", "How we find, fix and report security issues", "Standard answer"], ["Their questionnaire", "Our answers to the questions their legal team sent", "Needs Dustin"]]],
      ["h", "Before it goes"], ["p", "Dustin signs off, then Sam sends it to Priya Shah (COO) with a note so it goes to their legal team from her."]] },
  { k: "coastplan", chat: "t-coast", dept: "Onboarding", t: "Onboarding plan · Coastline Brokers", kind: "Doc", by: "jordan", when: "Today", st: "Draft", deal: "coast",
    flow: [["jordan", "Written", "done"], ["sam", "Share with Priya alongside the packet", "next"]],
    body: [["h", "Week one, once they sign"], ["sec", [["Day 1", "Kickoff with Priya Shah (COO) and their team leads", "Jordan"], ["Day 2", "Connect HubSpot so Felix sees their listings", "Jordan"], ["Day 3", "Felix setup call, the same one Brightwater had", "Customer Value"], ["Day 5", "First check-in", "Jordan"]]],
      ["h", "Why it’s ready now"], ["p", "So Priya can see what the first week looks like before she signs. It answers the question buyers ask right before legal does."]] },
  { k: "webdeck", chat: "t-web", dept: "Marketing", t: "Q1 webinar for brokerages", kind: "Deck", by: "paul", when: "Today", st: "Draft",
    slides: [
      { k: "w1", layout: "cover", over: "Fello · Q1 webinar", t: "How brokerages use Felix on their listings", sub: "Draft · for review" },
      { k: "w2", layout: "statement", t: "The hook", sub: "Brokerages keep asking how other teams use Felix on listings. This is the answer, from teams who do it." },
      { k: "w3", layout: "list", t: "Who it’s for", items: ["Brokerages with more than 50 agents", "38 in HubSpot, 9 of them already customers"], note: "Sample figures, from Riley." },
      { k: "w4", layout: "statement", t: "Customer story", sub: "A brokerage that put Felix on every listing. Speaker to be confirmed by Customer Value." },
      { k: "w5", layout: "statement", t: "Customer story: Brightwater Realty", sub: "Closed Oct 22, onboarding now. Invited." },
      { k: "w6", layout: "list", t: "Next steps", items: ["Book a demo with your team", "Questions go to Customer Value"] },
    ] },
  // the New client kit routine's deck: your demo deck, tailored to the brokerage that booked. A private draft until you share it
  { k: "crescent", dept: "Sales", t: "Demo · Crescent Realty Group", kind: "Deck", by: "orin", when: "Today", st: "Private draft",
    slides: [
      { k: "c1", layout: "cover", over: "Fello · for Crescent Realty Group", t: "Felix on every one of your 44 agents’ listings", sub: "Demo · Thursday" },
      { k: "c2", layout: "statement", t: "What it costs, up front", sub: "You’ve looked at pricing twice this week. Here it is for a team your size, before anything else." },
      { k: "c3", layout: "statement", t: "A team like yours: Brightwater Realty", sub: "41 agents, signed Oct 22, onboarding now with Jordan." },
      { k: "c4", layout: "list", t: "Next steps", items: ["A second call with whoever signs", "A two-week trial on ten listings"] },
    ] },
  // Beyonce's Monday sync doc: Orin drafts it from Company health and the week's agent work (every figure is the prototype's own)
  { k: "syncdoc", chat: "t-sync", dept: "RevOps", t: "Monday sync doc", kind: "Report", by: "orin", when: "Today", st: "Every Monday",
    body: [["h", "The number"], kv([["Ending ARR", "$35.75M", "October to date, $250K short of the $36.00M target"], ["Felix ARR", "$12.99M", "36.3% of ARR"], ["Left to build", "$4.28M", "about $2.14M a month to December’s $40.03M plan"]]),
      ["h", "What moved"], ["p", "New ARR +$1.63M and expansion +$530K, against $560K lost to churn and downgrades: +$1.60M net new so far in October."],
      ["h", "What’s stuck"], ["li", ["Outbound is at 23% of pace. Riley wants Sam back on it.", "New-logo work waits on the HubSpot sync, Dustin’s.", "Getting to 10 Felix handoffs runs 5.9 days over the 15-day ceiling."]],
      ["h", "Calls this week"], ["li", ["Sign off the Q4 hiring plan (Heather, by Friday)", "Brightline’s 30 seats before their Nov 14 renewal (Jordan)"]]] },
  // Heather's Q4 hiring plan, waiting on Beyonce's sign-off (sample)
  { k: "hireplan", chat: "t-hire", dept: "Sales", t: "Q4 hiring plan", kind: "Doc", by: "heather", when: "Yesterday", st: "Waiting on your sign-off",
    body: [["h", "The ask"], ["p", "Four hires for Q4, plus the two engineers Dustin already has budget for. Sample plan."],
      ["h", "Who"], ["sec", [["3 AEs", "New Business, to hold demo volume once Sam moves back to Outbound", "Sales"], ["1 CSM", "SMB, for the 29 renewals in Jordan’s book", "Customer Value"], ["2 engineers", "The HubSpot sync that new-logo work is waiting on", "Product & Eng"]]],
      ["h", "Why now"], ["p", "Finance wants the plan before the board pack. Offers out in November start in January."]] },
  // what Beyonce keeps on her board: the decks and docs she's presenting or signing off, each where it stands (sample)
  { k: "boarddeck", dept: "RevOps", t: "Board deck · Dec 3", kind: "Deck", by: "paul", when: "Today", st: "6 of 9 slides drafted",
    slides: [
      { k: "b1", layout: "cover", over: "Fello · Board meeting", t: "Q4 board meeting", sub: "December 3 · Draft" },
      { k: "b2", layout: "statement", t: "Q4 · where we land", sub: "$35.75M of $40.03M, and the three levers that close it" },
      { k: "b3", layout: "list", t: "The three levers", items: ["Outbound back to pace: +$680K by Dec 31", "Expansion: 45 deals booked against 40", "Time to value: 20.9 days down to 15"] },
      { k: "b4", layout: "statement", t: "Portal", sub: "9 brokerages live, 25 by Dec 31 (sample)" },
      { k: "b5", layout: "list", t: "Hiring", items: ["Heather’s plan: six roles asked for", "Waiting on your sign-off by Friday"] },
      { k: "b6", layout: "statement", t: "Retention", sub: "GRR 97.7% and NRR 99.9% in October" },
      { k: "b7", layout: "statement", t: "The forecast", sub: "Paul is drafting this one" },
      { k: "b8", layout: "statement", t: "Q4 retention numbers", sub: "Waiting on the December 2 close" },
      { k: "b9", layout: "statement", t: "Asks of the board", sub: "Not drafted yet" },
    ] },
  { k: "saastr", dept: "Marketing", t: "Your SaaStr talk", kind: "Deck", by: "lisa", when: "Yesterday", st: "Draft",
    slides: [
      { k: "s1", layout: "cover", over: "Fello · SaaStr", t: "Agents that do the work, not the dashboard", sub: "November 19 · Draft" },
      { k: "s2", layout: "statement", t: "The problem", sub: "Leaders read six dashboards to find one decision." },
      { k: "s3", layout: "list", t: "What changed for us", items: ["Brightwater went live on Portal; Felix builds every listing page", "Agents hand the work to whoever owns it"], note: "Sample figures." },
      { k: "s4", layout: "statement", t: "What we’d tell you", sub: "Start with the decision, not the chart." },
    ] },
  { k: "workshop", dept: "Marketing", t: "Brokerage leaders workshop", kind: "Doc", by: "lisa", when: "Today", st: "Agenda",
    body: [["h", "November 24 · Agenda"], ["sec", [["9:00", "Welcome, and why we built Portal", "Beyonce"], ["9:30", "Brightwater Realty: every listing built on Portal", "Brightwater, with Lisa’s video"], ["10:15", "Working session: your first 30 days on Portal", "Customer Value"], ["11:00", "What’s next for Portal", "Dustin"]]],
      ["h", "Who’s coming"], ["p", "Leaders from 14 brokerages, 9 of them customers. Sample list."]] },
  { k: "pipeline", dept: "Sales", t: "Q4 pipeline", kind: "Report", by: "riley", when: "Today", st: "4 charts",
    body: [["p", "Where Q4 pipeline stands, from Company health. Four charts: by stage, by source, by close month and what slipped."],
      kv([["Booked ARR – Outbound", "$130.2K", "23% of pace"], ["New logos", "55", "75% of pace"], ["Win rate from held demo", "19.9%", "85% of target"], ["Expansion ARR", "$734.0K", "72% of pace"]]),
      ["h", "What stands out"], ["p", "Outbound is the gap. Everything else is within reach of pace."]] },
  { k: "retplan", dept: "Customer Value", t: "Q4 retention plan", kind: "Doc", by: "jordan", when: "Today", st: "Draft",
    body: [["h", "The goal"], ["p", "Hold GRR above 97% through December, with Brightline’s renewal the biggest single risk. Sample plan."],
      ["h", "The plays"], ["li", ["Brightline’s 30 seats: an annual term before the Nov 14 renewal (20% off needs your OK)", "The 4 accounts nobody owned: Jordan’s team has them", "Every renewal call starts with Felix usage"]]] },
  { k: "brightvid", dept: "Marketing", t: "Brightwater Realty · customer story", kind: "Video", by: "lisa", when: "Today", st: "Rough cut, 2:14",
    body: [["h", "Rough cut · 2:14"], ["p", "Brightwater’s team lead on going live with Portal: Felix builds every listing page as they ask. It plays at the workshop, then on the launch page. Sample."],
      ["h", "What Lisa needs"], ["li", ["Your OK on the 0:40 quote about pricing", "A yes to show it at the Nov 24 workshop"]]] },
  { k: "inbound", dept: "Marketing", t: "Inbound, October so far", kind: "Report", by: "marco", when: "Today", st: "Done",
    body: [["p", "Where Inbound stands this month, from Company health."], kv([["Booked ARR – Inbound", "$1.31M", "128% of pace ($1.03M)"], ["Demos booked", "342", "96% of pace (356)"], ["Demo held rate", "50.7%", "target 60%"], ["Pipeline created", "$5.97M", "114% of pace ($5.22M)"]]),
      ["h", "What stands out"], ["p", "Booked ARR and pipeline are ahead of pace. Held rate is the one under target: demos get booked, then too many don’t happen."]] },
  { k: "ttv", dept: "Onboarding", t: "Time to value, October so far", kind: "Report", by: "calvin", when: "Today", st: "Done",
    body: [["p", "Where Value Delivery stands this month, from Company health."], kv([["Felix activations", "82", "102% of pace (80.2)"], ["TTV: 10 handoffs", "20.9d", "5.9d over the 15.0d ceiling"], ["Time post-activation", "179.8d", "target 75.0d"], ["TTV: first contract", "—", "no data connection yet"]]),
      ["h", "What stands out"], ["p", "Activations are on pace. Getting to ten handoffs takes too long: almost six days over the ceiling."]] },
  { k: "retention", dept: "Customer Value", t: "Retention, October so far", kind: "Report", by: "calvin", when: "Today", st: "Done",
    body: [["p", "Where Customer Value stands this month, from Company health."], kv([["GRR", "97.7%", "101% of pace (97.07%)"], ["Healthy ARR", "63%", "2.1× the 30% target"], ["At-risk ARR", "$1.98M", "under the $5.50M ceiling"], ["Downgrade + churn", "$773K", "$227K under pace ($1.00M)"]])] },
  { k: "felixhealth", dept: "Product & Eng", t: "Felix health, October so far", kind: "Report", by: "dustin", when: "Today", st: "Done",
    body: [["p", "Where Product & Eng stands this month, from Company health."], kv([["Felix handoffs per 1K", "9.61", "101% of pace (9.55)"], ["Daily active users", "1,577", "target 1,700"], ["Active accounts", "28.5%", "target 30%"], ["Fello health", "68", "target 73"], ["Felix health", "70", "target 78"]])] },
  { k: "hubspot", dept: "RevOps", t: "What’s waiting on the HubSpot sync", kind: "Doc", by: "orin", when: "Today", st: "Open",
    body: [["p", "Work that can’t move until the HubSpot sync lands."], ["li", ["Orin: why new logos are behind pace", "Onboarding plans that need Coastline’s listings connected"]]] },
];
export const FILE_OF = (k) => (k === "deck" ? DECK : FILES.find((x) => x.k === k));

const usd = (k) => `$${k}K`;
// any other deck's slide: a cover, a statement or a short list, in the same 960 × 540 frame and the same two type sizes
function GenSlide({ s, fk }) {
  // a cover slide is the file's front page: the same art its board cover shows, under the title
  const art = s.layout === "cover" && hasCoverArt(fk);
  return (
    <div className={`sd sd-g is-${s.layout}${art ? " has-art" : ""}`}>
      {art && <CoverArt k={fk} className="sd-art" />}
      {s.layout === "cover" ? <div className={`sd-cover${art ? " is-art" : ""}`}><small>{s.over}</small><h3>{s.t}</h3><p>{s.sub}</p></div>
        : <><header><h3>{s.t}</h3></header>
          {s.layout === "statement" && <p className="sd-st">{s.sub}</p>}
          {s.layout === "list" && <ul className="sd-li">{s.items.map((x, i) => <li key={i}>{x}</li>)}</ul>}
          {s.note && <small className="sd-foot">{s.note}</small>}</>}
      {s.rev && <span className="sd-rev">Updated</span>}
    </div>
  );
}
function Slide({ s, rev, fk }) {
  if (s.layout) return <GenSlide s={s} fk={fk} />;
  const deals = s.k === "deals" ? OCT.slice().sort((a, b) => (a.close < b.close ? -1 : 1)) : null;
  return (
    <div className={`sd sd-${s.k}`}>
      {s.k === "title" ? <div className="sd-cover"><small>Fello · New Business</small><h3>{s.t}</h3><p>{s.sub}</p></div> : <>
        <header><h3>{s.t}</h3>{s.sub && !(rev && rev.noSub) && <p>{s.sub}</p>}</header>
        {s.k === "gap" && <div className="sd-gap">
          <div className="sd-big"><b>{usd(GOAL)}</b><span>behind pace</span></div>
          <div className="sd-bar">{OCT.map((d) => <i key={d.id} style={{ flex: d.arr }} title={`${d.n} · ${usd(d.arr)}`} />)}</div>
          <p className="sd-legend"><b>{usd(OCT_K)}</b> across {OCT.length} October deals</p></div>}
        {deals && <table className="sd-t"><thead><tr><th>Deal</th><th>Stage</th><th>Close</th><th>ARR</th></tr></thead>
          <tbody>{deals.map((d) => <tr key={d.id}><td>{d.n}</td><td>{STAGES[d.stage]}</td><td>{d.close}</td><td>{usd(d.arr)}</td></tr>)}</tbody></table>}
        {s.k === "risk" && <ul className="sd-risk">{OCT.filter((d) => d.threats.length).map((d) => { const th = THREATS[d.threats[0].k];
          return <li key={d.id}><b>{d.n}</b><span>{th.t}</span><em>{th.say}</em></li>; })}</ul>}
      </>}
      {s.k !== "title" && <small className="sd-foot">{NOTE}</small>}
      {rev && rev.tag && <span className="sd-rev">Updated</span>}
    </div>
  );
}
// a slide drawn at its real size and scaled to whatever box it's in, so a thumbnail is the slide, not a sketch of it
function Fit({ children, className }) {
  const box = useRef(null), [k, setK] = useState(0.5);
  useLayoutEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(() => setK(el.clientWidth / 960)); ro.observe(el); setK(el.clientWidth / 960); return () => ro.disconnect(); }, []);
  return <div ref={box} className={`sd-fit ${className || ""}`} style={{ height: 540 * k }}><div className="sd-scale" style={{ transform: `scale(${k})` }}>{children}</div></div>;
}

// a file's picture, for lists of files: a deck shows its first slide; a doc, report or account shows its first page, laid
// out at real size (640px wide) and scaled into the box, so every thumbnail is the file itself, not an icon for it
function Page({ children }) {
  const box = useRef(null), [k, setK] = useState(0.3);
  // a 640×360 page (16:9, the same shape as a slide, so every tile in a grid is the same height)
  useLayoutEffect(() => { const el = box.current; if (!el) return; const ro = new ResizeObserver(() => setK(el.clientWidth / 640)); ro.observe(el); setK(el.clientWidth / 640); return () => ro.disconnect(); }, []);
  return <div ref={box} className="fp-page" style={{ height: 360 * k }} aria-hidden="true" inert=""><div className="fp-scale" style={{ transform: `scale(${k})` }}>{children}</div></div>;
}
export function Preview({ k, bare }) {
  const doc = FILE_OF(k);
  if (!doc) return <div className="fp-page" />;
  if (doc.slides) return <div aria-hidden="true" inert=""><Fit><Slide s={doc.slides[0]} fk={k} /></Fit></div>;
  return <Page><div className="fp-doc">{!bare && <><p className="fp-k">{doc.kind}</p><h2>{doc.t}</h2></>}
    {doc.room ? <AccountView room={ROOMS[doc.room]} renderFile={() => null} /> : <DocView doc={doc} />}</div></Page>;
}
export function DeckView({ deck, at, setAt, rev = {} }) {
  useEffect(() => { const k = (e) => { const a = document.activeElement; if (a && /INPUT|TEXTAREA/.test(a.tagName)) return;
    if (e.key === "ArrowRight") { e.preventDefault(); setAt((i) => Math.min(deck.slides.length - 1, i + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setAt((i) => Math.max(0, i - 1)); } };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k); });
  const s = deck.slides[at];
  return (
    <div className="dv">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={at + (rev[s.k] ? "r" : "")} className="dv-stage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.08 } }} transition={{ duration: 0.2 }}>
          <Fit className="dv-main"><Slide s={s} rev={rev[s.k]} fk={deck.k} /></Fit>
        </motion.div>
      </AnimatePresence>
      <div className="dv-strip" role="tablist" aria-label="Slides">
        {deck.slides.map((x, i) => (
          <button key={x.k} type="button" role="tab" aria-selected={i === at} className={`dv-th${i === at ? " is-on" : ""}`} onClick={() => setAt(i)}>
            <Fit><Slide s={x} rev={rev[x.k]} fk={deck.k} /></Fit><span>{i + 1}</span></button>))}
      </div>
    </div>
  );
}
export function DocView({ doc }) {
  const room = doc.deal && ROOMS[doc.deal];
  // the file leads with what's in it. Who's done what and what's next sits at the end, as "Before it goes": the steps
  // themselves (the prose that used to say the same thing goes), so the next move is where you finish reading
  const bi = doc.body.findIndex(([k, v]) => k === "h" && /^before it goes$/i.test(v)), body = doc.flow && bi >= 0 ? doc.body.slice(0, bi) : doc.body;
  const flow = doc.flow ? [["h", "Before it goes"], ["flow", doc.flow]] : [];
  return <article className="doc">{hasCoverArt(doc.k) && <div className="doc-art"><CoverArt k={doc.k} crop /></div>}{room && <DealStrip room={room} />}{[...body, ...flow].map(([k, v], i) => k === "h" ? <h4 key={i}>{v}</h4>
    : k === "flow" ? <ol key={i} className="ar-flow">{v.map(([w, t, st], j) => <li key={j} className={`is-${st}`}><Face k={w} size={24} /><span>{t}</span><em>{{ done: "Done", now: "Now", next: "Next" }[st]}</em></li>)}</ol>
    : k === "sec" ? <ol key={i} className="doc-sec">{v.map(([a, b, c]) => <li key={a}><b>{a}</b><span>{b}</span><em className={/needs/i.test(c) ? "is-open" : ""}>{c}</em></li>)}</ol>
    : k === "li" ? <ul key={i}>{v.map((x, j) => <li key={j}>{x}</li>)}</ul>
    : k === "kv" ? <table key={i} className="doc-kv"><tbody>{v.map(([a, b, c]) => <tr key={a}><td>{a}</td><td>{b}</td><td>{c}</td></tr>)}</tbody></table>
    : <p key={i}>{v}</p>)}</article>;
}

// a file in a conversation: what it is and who made it; it opens in the panel
const ICON = { Deck: "M3 3.5h10v7H3zM8 10.5v2M5.5 12.5h5", Report: "M4.5 2.5h5l2 2v9h-7zM6.5 7h3M6.5 9.5h3" };
export const openFile = (k) => { window.__northOpenFile = k; dispatchEvent(new CustomEvent("north:open-file", { detail: { k } })); };
// a file opens where you are: inside a conversation it slides in beside it and pushes the talk to the left (the host is the
// nearest [data-dochost]); anywhere else it grows from its card into the middle of the screen. Either one can go full view.
export const showFile = (k, el, opt = {}) => { const r = el && el.getBoundingClientRect(); dispatchEvent(new CustomEvent("north:file", { detail: { k, full: !!opt.full, host: opt.host || (el && el.closest("[data-dochost]")), from: r ? { left: r.left, top: r.top, width: r.width, height: r.height } : null } })); };
// a paper surface sitting in a tray (the Practice card): what it is on the paper, where it stands on the tray below
export function FileCard({ f, onOpen }) {
  const src = FILE_OF(f.k) || {}, st = src.st && src.st !== "Sample deal" ? src.st : src.when ? `Updated ${src.when.toLowerCase() === "today" ? "today" : src.when}` : null;
  return (
    <button type="button" className="fcard" onClick={(e) => (onOpen ? onOpen(f.k) : showFile(f.k, e.currentTarget))}>
      <span className="fcard-s">
        <svg className="fcard-i" width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICON[f.kind] || ICON.Report} /></svg>
        <span className="fcard-t"><b>{f.t}</b><small>{f.kind}{f.n ? ` · ${f.n} slides` : ""}</small></span>
      </span>
      {st && <span className="fcard-f">{st}</span>}
    </button>
  );
}

// a file opened where it sits: it grows out of its tile to fill the page, folds back on close (Esc, the ×, or outside)
const I = (d) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--navy)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const EXPAND = "M8.5 2.5h3v3M5.5 11.5h-3v-3M11.5 2.5 8 6M2.5 11.5 6 8", SHRINK = "M11.5 5.5h-3v-3M2.5 8.5h3v3M8.5 5.5 12 2M5.5 8.5 2 12", CLOSE = "M3 3l8 8M11 3 3 11";
// the top of an open file: who made it and what it is, then full view and close
function DocHead({ f, by, full, setFull, onClose, onComment, side, extra, back, onBack }) {
  const bf = back && FILE_OF(back);
  return (
    <header className="fm-h">
      {/* an account needs no "who · kind · status" line over its name; the panel under it says what it is. Opened from
          inside another file, the eyebrow starts with the way back to it */}
      <div><p className="fm-eye">{bf && <><button type="button" className="fm-back" onClick={onBack}><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 6H2.5M5.5 3 2.5 6l3 3" /></svg>{bf.t}</button><i className="fm-sep" aria-hidden="true" /></>}{f.kind === "Account" ? "Account" : <>{by}{f.kind ? ` · ${f.kind}` : ""}{f.n ? ` · ${f.n} slides` : ""}{f.st ? ` · ${f.st}` : ""}</>}</p><h2>{f.t}</h2>
        {/* an account says who they are in one line under its name */}
        {f.room && ROOMS[f.room] && (() => { const d = ROOMS[f.room].deal; return <p className="fm-sub">${d.arr}K · {d.agents} agents in {d.city} · {d.champ[0]}, {d.champ[1]}</p>; })()}</div>
      <div className="fm-act">
        {onComment && <button type="button" className="ibtn fx-i" aria-label="Comment" title="Comment (C)" onClick={onComment}>{I("M2.5 3.5h9v6h-5l-2.5 2v-2h-1.5z")}</button>}
        <button type="button" className="ibtn fx-i" aria-label={full ? "Exit full view" : "Full view"} title={full ? "Exit full view (F)" : "Full view (F)"} onClick={() => setFull(!full)}>{I(full ? SHRINK : EXPAND)}</button>
        {side ? <button type="button" className="ibtn fx-i" aria-label="Collapse panel" title="Collapse (Esc)" onClick={onClose}><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--navy)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="1.75" y="2.25" width="10.5" height="9.5" rx="2" /><path d="M6.5 2.5v9M8.75 5.5 10.25 7l-1.5 1.5" /></svg></button>
          : <button type="button" className="ibtn fx-i" aria-label="Close" title="Close (Esc)" onClick={onClose}>{I(CLOSE)}</button>}
        {extra && <><i className="fm-sep" aria-hidden="true" />{extra}</>}
      </div>
    </header>
  );
}
// Esc steps back (full view → beside → closed), F toggles full view, C comments; they stop here so the conversation under it
// stays open. K is never taken: it always brings up the chat, a file open or not
function useDocKeys(full, setFull, onClose, cm, setCm, escClose) {
  useEffect(() => { const k = (e) => { const a = document.activeElement, typing = a && /INPUT|TEXTAREA/.test(a.tagName);
      if (e.key === "Escape") { e.stopPropagation(); e.preventDefault(); if (cm) { setCm(null); return; } full && !escClose ? setFull(false) : onClose(); }
      else if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "c" && setCm) { e.stopPropagation(); e.preventDefault(); setCm(cm ? null : { pick: true }); }
      else if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === "f") { e.stopPropagation(); e.preventDefault(); setFull(!full); } };
    addEventListener("keydown", k, true); return () => removeEventListener("keydown", k, true); }, [full, cm]); // eslint-disable-line react-hooks/exhaustive-deps
}
// K on an open file: comment on the spot you click. The note pins there (your face, your words) and goes to the people
// working on it, in the conversation the file came from, or a new one with whoever made it. A deck's notes stay on their slide.
const PINS = {}; // file key → [{ x, y, slide, t, by }]; lives for the session
// a comment pinned from outside the file (a routine's first pass): it shows the next time the file is open
export const addPin = (k, slide, t, by = "sam") => { const n = (PINS[k] || []).filter((p) => p.slide === slide).length; PINS[k] = [...(PINS[k] || []), { x: 0.6, y: 110 + n * 56, slide, t, by }]; };
// one slide, small: the routine card shows the slide each comment is on
export function SlideThumb({ k, i }) { const d = FILE_OF(k), s = d && d.slides && d.slides[i]; return s ? <Fit className="rt-fit"><Slide s={s} fk={k} /></Fit> : null; }
function Comments({ f, at, cm, setCm, by, children }) {
  const wrap = useRef(null), [, setPins] = useState(0), pins = PINS[f.k] || [], [draft, setDraft] = useState(""), inp = useRef(null);
  const here = pins.filter((p) => p.slide === (f.slides ? at : null));
  const place = (e) => { if (!cm || !cm.pick) return; const r = wrap.current.getBoundingClientRect(); e.preventDefault(); e.stopPropagation();
    setCm({ x: (e.clientX - r.left) / r.width, y: e.clientY - r.top }); setDraft(""); setTimeout(() => inp.current && inp.current.focus(), 30); };
  const send = (e) => { e.preventDefault(); const t = draft.trim(); if (!t || !cm || cm.pick) return;
    const p = { x: cm.x, y: cm.y, slide: f.slides ? at : null, t }; PINS[f.k] = [...(PINS[f.k] || []), p]; setPins((v) => v + 1); setCm(null);
    const on = f.slides ? `On slide ${at + 1} of ${f.t}` : `On ${f.t}`;
    dispatchEvent(new CustomEvent("north:talk-send", { detail: f.chat ? { id: f.chat, text: `${on}: ${t}` } : { people: [f.by], text: `${on}: ${t}` } })); };
  return (
    <div ref={wrap} className={`cm-wrap${cm && cm.pick ? " is-pick" : ""}`} onClickCapture={place}>
      {children}
      {here.map((p, i) => <div key={i} className="cm-pin" style={{ left: `${p.x * 100}%`, top: p.y }}><Face k={p.by || "sam"} size={24} /><p>{p.t}</p></div>)}
      <AnimatePresence>{cm && !cm.pick && (
        <motion.form key="d" className="cm-draft" style={{ left: `${cm.x * 100}%`, top: cm.y }} onSubmit={send} initial={{ opacity: 0, scale: 0.96, y: 4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ type: "spring", visualDuration: 0.25, bounce: 0.15 }}>
          <Face k="sam" size={24} /><input ref={inp} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={f.chat ? "Comment for everyone on this…" : `Comment for ${by}…`} aria-label="Comment" />
        </motion.form>)}</AnimatePresence>
      <AnimatePresence>{cm && cm.pick && <motion.p key="h" className="cm-hint" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>Click where you want to comment · Esc to cancel</motion.p>}</AnimatePresence>
    </div>
  );
}
const SX = [0.32, 0.72, 0, 1];
// ---- voice on files: open one by name, then move through it, change it, comment on it, all without touching it -----------
const DOC = { cur: null }; // the file that's open now and its controls
function useDocCtl(f, c) { useEffect(() => { DOC.cur = { f, doc: FILE_OF(f.k), ...c }; return () => { if (DOC.cur && DOC.cur.f.k === f.k) DOC.cur = null; }; }); }
const WORDS = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 2 && !/^(the|and|for|with|open|show|deck|doc|file|report|plan|slides?)$/.test(w));
function fileNamed(q) { const ws = WORDS(q); if (!ws.length) return null; let best = null, bs = 0;
  for (const x of FILES) { const t = WORDS(`${x.t} ${x.kind} ${x.dept}`), s = ws.filter((w) => t.some((y) => y.startsWith(w) || w.startsWith(y))).length + (/deck/.test(q) && x.slides ? 0.5 : 0) + (/report/.test(q) && x.kind === "Report" ? 0.5 : 0);
    if (s > bs) { bs = s; best = x; } } return bs >= 1 ? best : null; }
const said = (raw, n) => (String(raw).match(/(?:\b(?:to|say|says|that says)\b|:)\s*["“]?(.+?)["”]?\.?$/i) || [null, n])[1].trim();
// what someone dictates keeps their words: match the raw line (filler at the front dropped) before the cleaned-up one
const RAW = (raw) => String(raw).trim().replace(/^((um+|uh+|okay|ok|so|alright|and|then|now|north|please)\b[\s,.:!-]*)+/i, "");
const both = (raw, n, re) => RAW(raw).match(re) || n.match(re);
const tidy = (t) => cap(t.trim().replace(/^["“]|["”]$/g, "").replace(/\.$/, ""));
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
onIntent((n, raw) => {
  const c = DOC.cur, d = c && c.doc, s = d && d.slides ? d.slides[c.at] : null;
  // open a file by what it's called ("open the webinar deck", "show me the security packet")
  const op = n.match(/^open\s+(?:up\s+)?(?:the\s+)?(.+)$/i);
  if (op) { const x = fileNamed(op[1]); if (!x) return null;
    // the conversation in front of you hosts it: the full chat when it's up, else the item open on Home, else over the page
    const host = (document.documentElement.classList.contains("chat-full") && document.querySelector(".chat-shell.is-full")) || [...document.querySelectorAll(".gw-in")].find((e) => e.getBoundingClientRect().width > 0) || null;
    if (c && c.f.k === x.k && (c.host || null) === host) return `${x.t} is open`;
    showFile(x.k, null, host ? { host } : {}); return `Opened ${x.t}`; }
  if (!c) return null;
  if (/^(close|done|that'?s it|put it away)( it| this| the (deck|doc|file|report))?\.?$/i.test(n)) { c.close(); return "Closed"; }
  if (/\b(full ?screen|full view|make it (bigger|full))\b/i.test(n)) { c.setFull(true); return "Full view"; }
  if (/\b(exit full|make it smaller|shrink it|smaller)\b/i.test(n)) { c.setFull(false); return "Back beside"; }
  if (d && d.slides) { const N = d.slides.length;
    const go = n.match(/\b(?:go to |open |show )?slide (\d+)\b/i) && !/\b(change|make|add|remove|title|comment)\b/i.test(n) ? +n.match(/slide (\d+)/i)[1] : null;
    if (go) { c.setAt(Math.max(0, Math.min(N - 1, go - 1))); return `Slide ${Math.min(N, go)}`; }
    if (/^(next|forward)( slide)?\.?$|^next slide/i.test(n)) { c.setAt((i) => Math.min(N - 1, i + 1)); return `Slide ${Math.min(N, c.at + 2)}`; }
    if (/^(previous|prev|last|back)( a)? slide|^previous\.?$|^go back a slide/i.test(n)) { c.setAt((i) => Math.max(0, i - 1)); return `Slide ${Math.max(1, c.at)}`; } }
  // comment ("leave a comment for Paul: lead with this one") — pins on the slide and goes to the file's people
  const cm = both(raw, n, /^(?:leave |add |drop )?(?:a )?(?:comment|note)(?: for (\w+))?\s*[:,-]?\s*(.+)$/i);
  if (cm) { const t = tidy(cm[2].replace(/^(that|saying)\s+/i, "")); const p = { x: 0.62, y: 120 + (PINS[c.f.k] || []).filter((q) => q.slide === (d && d.slides ? c.at : null)).length * 56, slide: d && d.slides ? c.at : null, t };
    PINS[c.f.k] = [...(PINS[c.f.k] || []), p]; c.bump();
    const on = d && d.slides ? `On slide ${c.at + 1} of ${c.f.t}` : `On ${c.f.t}`;
    dispatchEvent(new CustomEvent("north:talk-send", { detail: c.f.chat ? { id: c.f.chat, text: `${on}: ${t}` } : { people: [c.f.by], text: `${on}: ${t}` } }));
    return `Comment left${cm[1] ? ` for ${cap(cm[1])}` : ""}`; }
  if (!s || !s.layout) return null;
  const done = (what) => { s.rev = true; c.bump(); return `Slide ${c.at + 1}: ${what}`; };
  if (/\b(title|headline|heading)\b/i.test(n) && /\b(change|make|set|update|rename|title)\b/i.test(n)) { const t = said(raw, n).replace(/^(the )?(title|headline|heading)\s*(to|as)?\s*/i, ""); if (t) { s.t = tidy(t); return done("title changed"); } }
  const cp = n.match(/\b(?:change|make|update|replace) (?:point|bullet|item|line) (\d+)\b/i);
  if (cp && s.items) { const i = +cp[1] - 1; if (s.items[i] != null) { s.items[i] = tidy(said(raw, n)); return done(`point ${i + 1} changed`); } }
  const ad = both(raw, n, /^(?:add|insert|put in)\s+(?:a |another )?(?:point|bullet|line|item)?\s*(?:that says|saying)?\s*[:,-]?\s*(.+)$/i);
  if (ad && s.items) { s.items.push(tidy(ad[1].replace(/^(to the list|that says)\s*/i, ""))); return done("point added"); }
  const rm = n.match(/^(?:remove|delete|cut|drop|take out)\s+(?:the )?(last|first|\d+)?\s*(?:point|bullet|line|item)\s*(\d+)?/i);
  if (rm && s.items && s.items.length) { const k = rm[2] || rm[1]; const i = !k || k === "last" ? s.items.length - 1 : k === "first" ? 0 : +k - 1; if (s.items[i] != null) { s.items.splice(i, 1); return done("point removed"); } }
  if (/\b(make it say|change it to|change the (text|copy|line|body) to|have it say|it should say)\b/i.test(n)) { if (s.layout === "list") return "This slide is a list: say “add a point…” or “change point 2 to…”"; s.sub = tidy(said(raw, n)); return done("text changed"); }
  return null;
});
// beside a conversation, the way an artifact opens: the conversation slides off the file (the talk is on top) and back over it
// on close. The divider
// drags: the file and the conversation trade width, and the split you leave is kept for next time.
const DOC_MIN = 360, TALK_MIN = 380;
const readFrac = () => { try { const v = parseFloat(localStorage.getItem("north:doc-frac")); return v > 0.2 && v < 0.85 ? v : 0.58; } catch { return 0.58; } };
function SideDoc({ f, from, host, by, onClose, full0, back, onBack }) {
  const [at, setAt] = useState(0), [full, setFull] = useState(!!full0), [cm, setCm] = useState(null), present = useIsPresent();
  useEffect(() => { setAt(0); setCm(null); }, [f.k]); // another file in the same panel starts at its top
  const [frac, setFrac] = useState(readFrac), [drag, setDrag] = useState(false);
  const [, setV] = useState(0); useDocCtl(f, { host, at, setAt, setFull, setCm, close: onClose, bump: () => setV((v) => v + 1) });
  const measure = () => { const hr = host.getBoundingClientRect(), lEl = host.dataset.dochostL && host.querySelector(host.dataset.dochostL);
    // the pane starts where its marker element does (in the chat: right of the list of conversations, under the header)
    // positions are inside the host's border (an absolute child is placed from its padding box)
    const bx = host.clientLeft, by = host.clientTop, lr = lEl && lEl.getBoundingClientRect();
    // on Home the card widens to the page card's edge (23px in) as the file arrives: size for where it's going, not where
    // it is mid-widen, so the panel and the conversation's room are set once and glide there together
    const m = host.classList.contains("gw-in") && document.querySelector(".main"), goal = m ? Math.round(m.getBoundingClientRect().right - 23 - hr.left - bx - 1) : 0;
    const pl = lr ? Math.max(0, Math.round(lr.left - hr.left - bx)) : 0, pt = lr ? Math.max(0, Math.round(lr.top - hr.top - by)) : 0, paneW = Math.round(Math.max(host.clientWidth, goal) - pl);
    return { hr: { left: hr.left + bx, top: hr.top + by }, pl, pt, paneW, h: Math.round(host.clientHeight - pt) }; };
  const [b0, setB] = useState(measure);
  const b = { ...b0, w: Math.round(Math.min(Math.max(DOC_MIN, b0.paneW * frac), Math.max(DOC_MIN, b0.paneW - TALK_MIN))) };
  useEffect(() => { const ro = new ResizeObserver(() => setB(measure())); ro.observe(host); return () => ro.disconnect(); }, [host]); // eslint-disable-line react-hooks/exhaustive-deps
  // the conversation makes room as the file arrives, and takes it back the moment you close it
  // one file at a time owns the room it makes: when another replaces it, the leaving one mustn't hand the room back
  const me = useRef(Math.random().toString(36).slice(2)).current, mine = () => host.dataset.docOwner === me;
  const giveBack = () => { if (!mine()) return; delete host.dataset.docOwner; host.classList.remove("has-doc", "has-doc-full", "is-doc-drag", "doc-out"); host.style.removeProperty("--doc-w"); dispatchEvent(new CustomEvent("north:doc", { detail: { open: false, host } })); };
  // leaving: wait a frame, so a file that replaces this one has taken the room first (then this hands nothing back)
  // the talk's room is set from the file's edge every frame (onUpdate below), so the two edges never part: no crack, either way.
  // Leaving, it keeps the room until the edge has travelled back; the room is handed back when it's gone (or to the next file)
  useEffect(() => { if (!present) return; if (!mine()) { host.dataset.docOwner = me; dispatchEvent(new CustomEvent("north:doc", { detail: { open: true, host } })); }
    host.classList.add("has-doc"); host.classList.toggle("has-doc-full", full); host.classList.toggle("is-doc-drag", drag); }, [present, full, drag]); // eslint-disable-line react-hooks/exhaustive-deps
  // the talk's own right padding when no file is open, so the last frame of a close lands exactly where it rests (no settle)
  const rest = useRef(null); if (rest.current == null) { const g = host.querySelector(".gw-item .fx-msgs"), c = host.querySelector(".chat-list");
    rest.current = host.classList.contains("has-doc") ? 0 : g ? Math.max(0, parseFloat(getComputedStyle(g).paddingRight) - 24) : c ? Math.max(0, parseFloat(getComputedStyle(c).paddingRight) - 28) : 0; }
  // closing: the conversation goes straight to its own width (one move, its CSS curve) and the file slides away under its
  // edge on the same curve. Nothing waits on the file's edge, so the talk never holds and then jumps, or re-wraps twice
  useEffect(() => { if (present) return; const r = requestAnimationFrame(() => { if (!mine()) return; host.classList.add("doc-out"); host.classList.remove("has-doc", "has-doc-full", "is-doc-drag");
      dispatchEvent(new CustomEvent("north:doc", { detail: { open: false, host } })); }); return () => cancelAnimationFrame(r); }, [present]); // eslint-disable-line react-hooks/exhaustive-deps
  const edge = (l) => { if (!mine() || !present) return; const x = typeof l.left === "number" ? l.left : parseFloat(l.left); if (isNaN(x)) return; host.style.setProperty("--doc-w", `${Math.max(rest.current, Math.round(b.pl + b.paneW - x))}px`); };
  useEffect(() => giveBack, []); // eslint-disable-line react-hooks/exhaustive-deps
  useDocKeys(full, setFull, onClose, cm, setCm);
  // drag the divider: the file's right edge stays put, its left edge follows the pointer
  const grab = (e) => { if (full) return; e.preventDefault(); const right = b.hr.left + b.pl + b.paneW, el = e.currentTarget; el.setPointerCapture(e.pointerId); setDrag(true);
    let last = frac; const mv = (ev) => { last = Math.min(Math.max(DOC_MIN, right - ev.clientX), Math.max(DOC_MIN, b.paneW - TALK_MIN)) / b.paneW; setFrac(last); };
    const up = () => { el.removeEventListener("pointermove", mv); el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); setDrag(false); try { localStorage.setItem("north:doc-frac", String(last)); } catch {} };
    el.addEventListener("pointermove", mv); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); };
  const nudge = (e) => { if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return; e.preventDefault(); const nf = Math.min(Math.max(DOC_MIN / b.paneW, frac + (e.key === "ArrowLeft" ? 0.03 : -0.03)), Math.max(DOC_MIN, b.paneW - TALK_MIN) / b.paneW); setFrac(nf); try { localStorage.setItem("north:doc-frac", String(nf)); } catch {} };
  const to = full ? { left: b.pl, top: b.pt, width: b.paneW, height: b.h } : { left: b.pl + b.paneW - b.w, top: b.pt, width: b.w, height: b.h };
  // closed, the file is a zero-wide strip at the pane's right edge. Opening, its left edge travels left with the conversation's
  // edge (same 500ms curve as the talk's padding), uncovering the file, which stays put under it: the talk is on top, so it
  // slides off the file and back over it, with no gap between them at any moment
  const shut = { left: to.left + to.width, top: to.top, width: 0, height: to.height };
  const doc = FILE_OF(f.k), T = drag ? { duration: 0 } : { duration: 0.5, ease: SX };
  // on Home the conversation's own controls (previous, next, close) join the file's, so the top right is one set
  const tb = host.classList.contains("gw-in") ? (l) => host.querySelector(`.fx-h-r button[aria-label="${l}"]`) : null;
  const I2 = (d) => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--navy)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
  const join = tb && tb("Close") ? <>
    <button type="button" className="ibtn fx-i" aria-label="Previous conversation" title="Previous (↑)" disabled={!!tb("Previous")?.disabled} onClick={() => tb("Previous")?.click()}>{I2("M3.5 8.5 7 5l3.5 3.5")}</button>
    <button type="button" className="ibtn fx-i" aria-label="Next conversation" title="Next (↓)" disabled={!!tb("Next")?.disabled} onClick={() => tb("Next")?.click()}>{I2("M3.5 5.5 7 9l3.5-3.5")}</button>
    <button type="button" className="ibtn fx-i" aria-label="Close conversation" title="Close the conversation" onClick={() => tb("Close")?.click()}>{I2("M3 3l8 8M11 3 3 11")}</button></> : null;
  return createPortal(
    <motion.div className={`sdoc${full ? " is-full" : ""}${drag ? " is-drag" : ""}`} role="dialog" aria-label={f.t} initial={shut} animate={to} exit={{ ...shut, transition: { duration: 0.5, ease: SX } }} transition={T} onUpdate={edge}>
      <div className="sdoc-p" style={{ width: to.width }}>
        <motion.div key={f.k} className="fm-in" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.25 } }} exit={{ opacity: 1 }}>
          <DocHead side f={f} by={by} full={full} setFull={setFull} onClose={onClose} onComment={() => setCm(cm ? null : { pick: true })} extra={join} back={back} onBack={onBack} />
          <div className={`fm-b${doc && doc.slides ? " is-deck" : ""}`}><Comments f={doc || f} at={at} cm={cm} setCm={setCm} by={by}>{doc && doc.room ? <AccountView room={ROOMS[doc.room]} renderFile={(k) => <FileCard key={k} f={FILE_OF(k)} />} /> : doc && doc.slides ? <DeckView deck={doc} at={at} setAt={setAt} /> : doc ? <DocView doc={doc} /> : null}</Comments></div>
        </motion.div>
      </div>
      {!full && <div className="sdoc-grip" role="separator" aria-orientation="vertical" aria-label="Drag to change the file’s width" aria-valuenow={Math.round(frac * 100)} tabIndex={0} onPointerDown={grab} onKeyDown={nudge} onDoubleClick={() => { setFrac(0.58); try { localStorage.removeItem("north:doc-frac"); } catch {} }}><i /></div>}
    </motion.div>, host);
}
export function FileModal({ f, from, onClose, by, startFull }) {
  const [at, setAt] = useState(0), [full, setFull] = useState(!!startFull), // the expand button opens it full screen straight away
    [cm, setCm] = useState(null);
  const [, setV] = useState(0); useDocCtl(f, { at, setAt, setFull, setCm, close: onClose, bump: () => setV((v) => v + 1) });
  useDocKeys(full, setFull, onClose, cm, setCm, startFull); // opened full screen from its corner button: Esc closes it
  const W = typeof window !== "undefined" ? window.innerWidth : 1440, H = typeof window !== "undefined" ? window.innerHeight : 900;
  const w = Math.min(1040, W - 120), h = Math.min(820, H - 80), to = full ? { left: 13, top: 13, width: W - 26, height: H - 26 } : { left: (W - w) / 2, top: (H - h) / 2, width: w, height: h }; // full view keeps the frame's 13px edge
  const start = from ? { left: from.left, top: from.top, width: from.width, height: from.height } : { ...to, top: to.top + 20 };
  const doc = FILE_OF(f.k);
  return (
    <>
      <motion.div className="fm-veil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} onClick={onClose} />
      <motion.div className="fm" role="dialog" aria-label={f.t} initial={{ ...start, borderRadius: 14 }} animate={{ ...to, borderRadius: 16 }} exit={{ ...start, opacity: 0, transition: { duration: 0.36, ease: [0.32, 0.72, 0, 1], opacity: { delay: 0.28, duration: 0.08 } } }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}>
        {/* laid out at its full size from the first frame, so the box uncovers it as it grows (no empty card, no reflow) */}
        <motion.div className="fm-in" style={{ width: to.width, height: to.height }} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.08, delay: 0.28 } }}>
          <DocHead f={f} by={by} full={full} setFull={setFull} onClose={onClose} onComment={() => setCm(cm ? null : { pick: true })} />
          <div className={`fm-b${doc && doc.slides ? " is-deck" : ""}`}><Comments f={doc || f} at={at} cm={cm} setCm={setCm} by={by}>{doc && doc.room ? <AccountView room={ROOMS[doc.room]} renderFile={(k) => <FileCard key={k} f={FILE_OF(k)} />} /> : doc && doc.slides ? <DeckView deck={doc} at={at} setAt={setAt} /> : doc ? <DocView doc={doc} /> : null}</Comments></div>
        </motion.div>
      </motion.div>
    </>
  );
}

// one place every file opens from, over whatever page you're on (the chat included), growing out of what you clicked
export function FileHost({ names }) {
  const [o, setO] = useState(null);
  // closing closes: nothing reopens on its own. A file opened from inside another (the packet from the account's Files)
  // swaps in place in the same panel (no shut and reopen) and keeps a way back, the "← Coastline Brokers" in its header
  const close = () => setO(null);
  const back = () => setO((c) => { if (!c || !c.back) return c; const f = FILE_OF(c.back); return { ...c, f: { ...f, n: f.slides ? f.slides.length : null }, back: null }; });
  useEffect(() => { const h = (e) => { const f = FILE_OF(e.detail.k); if (!f) return; const host = e.detail.host || null;
      setO((c) => { const same = c && host && c.host === host;
        return { f: { ...f, n: f.slides ? f.slides.length : null }, from: e.detail.from, host, full: same ? c.full : !!e.detail.full, t: same ? c.t : Date.now(), back: same && c.f.k !== f.k ? c.f.k : null }; }); };
    addEventListener("north:file", h); return () => removeEventListener("north:file", h); }, []);
  // a conversation moving on (another thread, no account) folds its account away; a file someone opened stays
  useEffect(() => { const h = (e) => setO((c) => (c && c.host === e.detail.host && (!e.detail.onlyRoom || c.f.room) ? null : c)); addEventListener("north:file-close", h); return () => removeEventListener("north:file-close", h); }, []);
  // the conversation it was opened from may close under it (Esc on Home, the chat shutting): then the file goes too
  useEffect(() => { if (!o || !o.host) return; const id = setInterval(() => { if (!o.host.isConnected) { base.current = null; setO(null); } }, 300); return () => clearInterval(id); }, [o]);
  if (typeof document === "undefined") return null;
  return <>
    <AnimatePresence>{o && o.host && <SideDoc key={o.t} f={o.f} from={o.from} host={o.host} full0={o.full} by={names(o.f.by)} onClose={close} back={o.back} onBack={back} />}</AnimatePresence>
    {createPortal(<AnimatePresence>{o && !o.host && <FileModal key={o.t} f={o.f} from={o.from} startFull={o.full} by={names(o.f.by)} onClose={() => setO(null)} />}</AnimatePresence>, document.body)}
  </>;
}
