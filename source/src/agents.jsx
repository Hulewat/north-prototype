// Orin, Riley, Calvin, Marco and Fia — specialists North can bring into the conversation. North runs it; they only speak when
// tagged (@Riley …), when North suggests one and you accept, or when you convene the team. Each says a few lines with
// the source it used; a convened round ends with North on where they agree, where they don't, and what's yours to decide.
import { NorthLogo } from "./marks.jsx";
import React, { useId, useState, useEffect, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toMotion } from "./lib.js";
import { mountOrb } from "./orbgl.js";
import { FACES, BODIES, BODY_ASPECT } from "./crew.js";
import { getWho, scrub } from "./seat.js";

export const AGENTS = {
  // the crew. Each one's colour is the glow in its chest
  orin: { id: "orin", n: "Orin", role: "GTM", col: "#3d5bd9" },
  riley: { id: "riley", n: "Riley", role: "Revenue OS", col: "#1f9e5a" },
  calvin: { id: "calvin", n: "Calvin", role: "Customer value", col: "#b4233c" },
  marco: { id: "marco", n: "Marco", role: "Marketing OS", col: "#e0479a" },
  fia: { id: "fia", n: "Fia", role: "Knowledge base", col: "#d9a01e" },
  north: { id: "north", n: "North", role: "", col: "#093555" }, // North itself, when it answers about the agents' work (not one of AGENT_IDS)
};
export const AGENT_IDS = ["orin", "riley", "calvin", "marco", "fia"];
// the three who weigh in on the numbers by default (a huddle, "convene the team"); Marco and Fia join when you name them
export const CORE_IDS = ["orin", "riley", "calvin"];

// per answer: each agent's take (+ where it looked), North's sum-up, and who North suggests bringing in
const T = (t, src) => ({ t, src });
export const TAKES = {
  outbound: {
    orin: T("Move Sam back to Outbound on Monday. His pre-Oct 14 rate was $7.5K a day, and the demo list he left still has 14 open prospects.", "HubSpot · Outbound lane"),
    riley: T("Do it. Sam's comp is about $9K a month wherever he sits; the only question is where his time earns more, and Outbound is $443.6K behind while Inbound is ahead.", "Plan · GTM comp"),
    calvin: T("One flag: Inbound is carrying the month at 128% of pace. If Sam leaves it, watch Inbound's demo held rate; it's already 50.7% against a 60% target.", "HubSpot · Inbound lane"),
    synth: "All three say move Sam back, and nobody thinks the cost is the issue. Calvin's caveat is the one to watch: Inbound's demo held rate could slip.\n\nYours to decide: move Sam now, or give Inbound a week to show it can hold without him.",
    suggest: ["riley", "what moving an SDR costs"],
  },
  year: {
    orin: T("Outbound is the lever we control. Back to pace, it's worth about $680K by Dec 31.", "HubSpot · pace"),
    riley: T("Even with all three levers we land at $40.08M, $50K over plan. That's no margin: one slipped deal and we miss.", "Plan · year-end forecast"),
    calvin: T("The forecast doesn't count the downside: $1.98M of ARR is flagged at risk. Losing a tenth of it erases the expansion lever.", "Account health"),
    synth: "They agree Outbound comes first. They differ on how safe the plan is: Riley sees no margin, and Calvin sees churn risk that isn't in Orin's numbers.\n\nYours to decide: commit to the three levers, or find a fourth as a cushion.",
    suggest: ["calvin", "the churn risk in it"],
  },
  lanes: {
    orin: T("Start with New Business: it's $140K behind, and one good week closes it. Outbound is the hard one.", "HubSpot · lanes"),
    riley: T("By dollars, Outbound is half the gap ($444K of $864K). Fixing New Business first feels good but moves less.", "Plan · lane targets"),
    calvin: T("Expansion's $280K is a win-rate problem, not a pipeline one. It's a sales-process fix, and it takes the longest.", "HubSpot · Expansion lane"),
    synth: "They disagree on order: Orin would take the quick win, Riley the biggest dollars. Calvin adds that Expansion is slow either way.\n\nYours to decide: the quick win this week, or everyone on Outbound.",
    suggest: ["riley", "what the gap costs"],
  },
  nrr: {
    orin: T("Two of the four quiet accounts have open expansion conversations. A QBR could turn the risk into upside.", "HubSpot · SMB"),
    riley: T("The four renew for $168K combined. That's half a point of NRR on its own.", "Billing · renewals"),
    calvin: T("Brightline cut seats in the app this week. It's the most likely to churn, so start there.", "Product usage"),
    synth: "All three say book the QBRs now. Calvin's usage data sets the order: Brightline first.\n\nYours to decide: who runs the Brightline call.",
    suggest: ["calvin", "how these accounts use it"],
  },
  arr: {
    orin: T("October's $1.60M came mostly from Northwind's expansion and two new logos. That mix won't repeat every month.", "HubSpot · closed won"),
    riley: T("We need about $2.14M a month for two months. Nothing this year says that's normal: plan for $38.94M, push for $40M.", "Plan · forecast"),
    calvin: T("Felix ARR is the fastest-growing part of the number and it's on pace. It's the part I'd lean on.", "Product · Felix ARR"),
    synth: "Riley wants to plan for $38.94M, and Orin thinks October's mix was lucky. All three agree $40M needs more than the current rate.\n\nYours to decide: which number you commit to the board.",
    suggest: ["riley", "what to plan for"],
  },
  winrate: {
    orin: T("Put an exec sponsor on every deal over $50K. That's where we lose.", "HubSpot · lost deals"),
    riley: T("The top 10 open deals are worth $1.4M. Lifting their win rate from 31.9% to 45% is worth about $180K.", "Plan · expansion"),
    calvin: T("Accounts with low product usage lose at twice the rate. Check their health before you sponsor them.", "Account health"),
    synth: "They agree on sponsors for the big deals. Calvin adds a filter: sponsor the healthy accounts first.\n\nYours to decide: which execs take which deals.",
    suggest: ["calvin", "which accounts can be won"],
  },
  logos: {
    orin: T("It's win rate, not volume: 310 demos held, 19.9% converting.", "HubSpot · New Business"),
    riley: T("New logos average $25.0K, 122% of target. Fewer but bigger logos softens the miss.", "Billing · new logos"),
    calvin: T("This month's new logos are activating Felix faster than last quarter's, so the ones we win are sticking.", "Product · activation"),
    synth: "They agree the count will miss. Riley and Calvin both say the quality is up.\n\nYours to decide: chase the count, or protect deal size.",
    suggest: ["riley", "what the miss is worth"],
  },
  demo: {
    orin: T("The drop is in demos Outbound booked after Oct 14. Inbound demos convert as usual.", "HubSpot · demos"),
    riley: T("Each point of win rate is worth about $77K of new ARR a month at today's demo volume.", "Plan · New Business"),
    calvin: T("Lost demos skew to companies that never tried the product. A trial before the demo could help.", "Product · trials"),
    synth: "Orin and Calvin see different causes: who booked the demo, and whether the prospect tried the product. Riley puts a price on each point.\n\nYours to decide: fix Outbound's booking quality, or add trials first.",
    suggest: ["calvin", "what lost prospects tried"],
  },
  exp: {
    orin: T("Nine deals are past their close date, $212K together. Chase those first.", "HubSpot · Expansion"),
    riley: T("Even all nine leave us $68K short of pace. The win rate has to come up too.", "Plan · expansion"),
    calvin: T("Northwind's second team is the largest, and they're already heavy users. It's the safest close.", "Product usage"),
    synth: "They agree: chase the nine, starting with Northwind. Riley warns that alone won't close the gap.\n\nYours to decide: who owns each of the nine.",
    suggest: ["calvin", "which of the nine will close"],
  },
  ttv: {
    orin: T("Slow onboarding delays expansion: customers don't buy more before they reach ten handoffs.", "HubSpot · Expansion"),
    riley: T("A week faster to value pulls roughly $40K of expansion into this quarter.", "Plan · expansion"),
    calvin: T("23 of 82 activations haven't imported contacts. They take 31 days to ten handoffs; the rest take 14.", "Product · activation"),
    synth: "Everyone points at the first integration and contact import.\n\nYours to decide: a product fix, or a customer-success push this month.",
    suggest: ["calvin", "where new customers get stuck"],
  },
  scenario: {
    orin: T("Outbound back to pace is the one I can promise. The other two depend on deals already in flight.", "HubSpot · pace"),
    riley: T("$50K over plan is a thin margin. I'd want a fourth lever before calling it.", "Plan · forecast"),
    calvin: T("Watch the $1.98M at risk. One churned account undoes the margin.", "Account health"),
    synth: "They agree the plan works on paper and that Outbound matters most. Riley and Calvin both say the margin is too thin.\n\nYours to decide: commit now, or find a fourth lever first.",
    suggest: ["riley", "how much margin the plan has"],
  },
};
TAKES.draft = TAKES.outbound;
// anything else (a chart you pointed at, an older thread): each agent from its own lane
// Marco and Fia, when you bring them in on something with no take written for them: their own lane's angle, no numbers
const ALSO = (topic) => ({
  marco: T(`On the marketing side, I'd look at what feeds ${topic}: which campaigns and webinars bring in the leads behind it.`, "HubSpot · Inbound lane"),
  fia: T(`From the knowledge base: I can lay out how we define the numbers behind ${topic}, so everyone reads them the same way.`, "Fello knowledge base"),
});
export const takesFor = (key, topic) => ({ ...ALSO(topic), ...takes0(key, topic) });
const takes0 = (key, topic) => (SEAT_TAKES[getWho()] || {})[key] || TAKES[key] || {
  orin: T(`From the growth side, ${topic} moves with pipeline. I'd check what Outbound and Inbound booked this week before anything else.`, "HubSpot"),
  riley: T(`In dollars, ${topic} matters for the year-end forecast. I can run what it changes against the $40.03M plan.`, "Plan"),
  calvin: T(`On the customer side, I'd check whether ${topic} lines up with account health and product usage.`, "Account health"),
  synth: `Each of them looks at ${topic} from their own lane, and none of them sees a problem the others would argue with.\n\nYours to decide: which lane to dig into first.`,
  // every answer can bring someone in: whoever's lane the subject sits in
  suggest: /renew|account|churn|nrr|grr|customer|usage|onboard/i.test(topic || "") ? ["calvin", "the accounts behind it"]
    : /pipeline|outbound|inbound|demo|lead|win rate|logo/i.test(topic || "") ? ["orin", "the pipeline side of it"]
    : ["riley", "what it means for the plan"],
};
// a huddle: the lead talks it through with the others, out of sight, and comes back with where they landed. Everything here is
// from the takes above (no new numbers): the glimpses are the first beat of each take, the outcome is the lead's account of them,
// and the transcript is the takes themselves, in the order they were made.
// the same facts said to the person they're about. Sam doesn't hear anyone's pay, and moving him isn't his call to make:
// it's waiting on leadership's approval (the "Approve moving Sam back to Outbound" decision on the Agents floor).
const SEAT_TAKES = {
  sam: {
    outbound: {
      orin: T("The quickest fix runs through you. Before Oct 14 you were booking $7.5K a day on Outbound, and the demo list you left still has 14 open prospects.", "HubSpot · Outbound lane"),
      riley: T("Outbound is $443.6K behind while Inbound is ahead, so your time earns more on Outbound right now.", "Plan · lane targets"),
      calvin: T("One flag: Inbound is carrying the month at 128% of pace. If you move, watch Inbound's demo held rate; it's already 50.7% against a 60% target.", "HubSpot · Inbound lane"),
      synth: "All three think your time earns more on Outbound. Calvin's caveat is the one to watch: Inbound's demo held rate could slip.\n\nWhether you move back is waiting on leadership's approval.",
      suggest: ["calvin", "what moving costs Inbound"],
    },
  },
};
const SEAT_HUDDLE = {
  sam: { outbound: { lead: "riley", t: "We think your time earns more on Outbound right now. Before Oct 14 you were booking $7.5K a day there, your demo list still has 14 open prospects, and Outbound is $443.6K behind while Inbound is ahead.\n\nCalvin pushed back on one thing: Inbound is carrying the month at 128% of pace, and its demo held rate is already 50.7% against 60%.\n\nWhether you move back is waiting on leadership's approval." } },
};
const HUDDLE_OUT = {
  outbound: { lead: "riley", t: "We landed on moving Sam back to Outbound on Monday. His pre-Oct 14 rate was $7.5K a day, and his demo list still has 14 open prospects. Cost isn't the question: his comp is about $9K a month wherever he sits, and Outbound is $443.6K behind while Inbound is ahead.\n\nCalvin pushed back on one thing: Inbound is carrying the month at 128% of pace, and its demo held rate is already 50.7% against 60%. He'll watch that rate once Sam moves.\n\nYours to decide: move Sam now, or give Inbound a week to show it can hold without him.", decide: /sam|outbound/i },
  year: { lead: "riley", t: "We agree Outbound comes first: back to pace it's worth about $680K by Dec 31. Where we split is margin. With all three levers we land at $40.08M, $50K over plan, and Calvin sees $1.98M flagged at risk that isn't in that forecast. Losing a tenth of it erases the expansion lever.\n\nYours to decide: commit to the three levers, or find a fourth as a cushion.", decide: /sam|outbound/i },
  lanes: { lead: "riley", t: "It's slipping most in Outbound: $444K of the $864K gap, about half. Orin would start with New Business, $140K behind and closable in one good week. I'd put the effort where the dollars are. Calvin says Expansion's $280K is a win-rate problem, so it's slow whichever we pick.\n\nYours to decide: the quick win this week, or everyone on Outbound.", decide: /sam|outbound/i },
  nrr: { lead: "riley", t: "All three of us say book the QBRs now. The four quiet accounts renew for $168K combined, half a point of NRR on its own. Calvin's usage data sets the order: Brightline cut seats this week, so it goes first. Orin sees upside as well: two of the four have open expansion conversations.\n\nYours to decide: who runs the Brightline call." },
  arr: { lead: "riley", t: "Plan for $38.94M, push for $40M. We need about $2.14M a month for two months, and nothing this year says that's normal. Orin thinks October's $1.60M won't repeat: it came mostly from Northwind's expansion and two new logos. Calvin would lean on Felix ARR, the fastest-growing part of the number and on pace.\n\nYours to decide: which number you commit to the board." },
  winrate: { lead: "riley", t: "Exec sponsors on every deal over $50K; that's where we lose. The top 10 open deals are worth $1.4M, and lifting their win rate from 31.9% to 45% is worth about $180K. Calvin adds a filter: low-usage accounts lose at twice the rate, so sponsor the healthy ones first.\n\nYours to decide: which execs take which deals." },
};
const beat = (t) => { const s = (t || "").split(/(?<=[.:;])\s/)[0]; return s.length > 74 ? s.slice(0, 72).replace(/\s+\S*$/, "") + "…" : s; };
// q: what you asked them (names stripped). The huddle opens on your question, and the report starts by answering it: your
// question, then what each of them said, then the lead's own read, then the call that's yours
export function huddleFor(key, topic, lead, ids, q = "") {
  const tk = takesFor(key, topic), others = ids.filter((x) => x !== lead), order = [...others, lead];
  // the written-out outcome needs everyone it names in the room; otherwise the lead gives its own read and the others', from their takes
  const HO = (SEAT_HUDDLE[getWho()] || {})[key] || HUDDLE_OUT[key], out = HO && HO.lead === lead && ids.length === 3 ? HO : null;
  const decideLine = ((tk.synth || "").match(/Yours to decide:[^\n]*/) || [""])[0];
  const qq = (q || "").replace(/[?.!\s]+$/, "").trim(), isQ = /^(what|whats|what's|why|how|hows|how's|who|which|where|wheres|when|is|are|do|does|did|can|could|should|would|will|any)\b/i.test(qq);
  const asked = (!qq ? `You asked for our read on ${/^check /i.test(topic) ? "this" : topic.charAt(0).toLowerCase() + topic.slice(1)}.` : isQ ? `You asked “${qq.charAt(0).toUpperCase() + qq.slice(1)}?”` : `You asked us to work out ${qq}.`) + " Here’s where we landed.";
  const own = tk[lead].t.replace(/^From the knowledge base:\s*/i, "").replace(/^On the marketing side,\s*/i, "");
  const t = out ? out.t : [others.map((a) => `${AGENTS[a].n}: “${tk[a].t}”`).join("\n"), `From me: ${own[0].toLowerCase() + own.slice(1)}`, decideLine].filter(Boolean).join("\n\n");
  return {
        transcript: [[lead, qq ? (isQ ? `They’re asking: “${qq.charAt(0).toUpperCase() + qq.slice(1)}?” What’s your read?` : `They want us to work out ${qq}. What’s your read?`) : `Quick one on ${/^(where|what|how|why|who)\b/i.test(topic) ? topic[0].toLowerCase() + topic.slice(1) : topic}. What's your read?`], ...order.map((a) => [a, tk[a].t])],
    text: t, asked, decide: out ? out.decide : null, src: order.map((a) => AGENTS[a].n).join(" · "),
  };
}
// a huddle is one contained row, like a thinking step: the agents' orbs circling each other, who's in it, how long, and a caret.
// Open it and you're in the room: their messages land one at a time while it runs, and stay there to reread once it's done.
export function Huddle({ m }) {
  // folded by default: one row says who's talking and for how long; open it to read what they said
  const [o, setO] = useState(false), [now, setNow] = useState(Date.now()), T = m.transcript || [], live = !m.done;
  useEffect(() => { if (!live) return; const t = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(t); }, [live]);
  const el = Math.max(0, (live ? now : m.t0 + m.dur) - m.t0), secs = Math.max(1, Math.round(el / 1000));
  const shown = live ? T.filter((_, i) => el >= (i * m.dur) / T.length) : T; // while live, each line lands at its moment
  const names = m.ids.map((a) => AGENTS[a].n), who = `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return (
    <motion.div className={`ch-msg hd${live ? " is-live" : ""}${o ? " is-open" : ""}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <button className="hd-h" onClick={() => setO(!o)} aria-expanded={o}>
        <span className="hd-orbs" aria-hidden="true" style={{ width: 18 + (m.ids.length - 1) * 12 }}>{m.ids.map((a, i) => <span key={a} className="hd-orb" style={{ "--i": i, left: i * 12 }}><AgentMark id={a} size={18} /></span>)}</span>
        <span className="hd-l"><b>{who}</b> {live ? "huddling" : "huddled"}</span>
        <span className="hd-s">{secs}s</span>
        <svg className="hd-c" width="9" height="9" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true"><path d="M3 2l4.5 3L3 8z" /></svg>
      </button>
      <AnimatePresence initial={false}>{o && (
        <motion.div className="hd-room" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}>
          <ol>
            <AnimatePresence initial={false}>{shown.map(([a, t], i) => (
              <motion.li key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                <span className="hd-who"><AgentMark id={a} size={16} /><b>{AGENTS[a].n}</b></span><span className="hd-x">{scrub(t)}</span>
              </motion.li>))}</AnimatePresence>
            {live && <li className="hd-typing"><span className="hd-who"><i /><i /><i /></span></li>}
          </ol>
        </motion.div>)}</AnimatePresence>
    </motion.div>
  );
}
export const agentsIn = (text) => AGENT_IDS.filter((id) => new RegExp(`@${id}\\b`, "i").test(text || ""));

// each agent is an orb, studied from Calvin's: a pale glass sphere holding a liquid body that sits just inside the rim
// (not concentric), its edge creasing where it meets the glass. Inside, silky colour folds — soft fields, a sharper
// crease band, a light ridge — that drift and turn while the body itself slowly changes shape. Pastel, not saturated.
const PAL = {
  calvin: { base: "#fff3fb", w: "#fffafd", a: "#ff9ff1", b: "#ffc0f7", c: "#c9aaff", d: "#93ddf4", e: "#a9b6ff", f: "#ffc7b6", crease: "#e173d6", low: "#8fa2ff", rimA: "#ffc9f2", rimB: "#c8f5ff" },
  orin:   { base: "#fff5ef", w: "#fffbf8", a: "#ff8f74", b: "#ffbca2", c: "#ffd394", d: "#ffa3c2", e: "#ffb08a", f: "#ffe1b4", crease: "#ec6b52", low: "#ff8fa8", rimA: "#ffd3c4", rimB: "#ffe9bd" },
  riley:  { base: "#f4f4ff", w: "#fbfbff", a: "#9a90ff", b: "#c2b9ff", c: "#7f8dff", d: "#86ddef", e: "#b0a4ff", f: "#d9d3ff", crease: "#6a62e6", low: "#6f87ff", rimA: "#d8d1ff", rimB: "#c6f2fb" },
};
// a closed 8-point blob around (50,50): radii per point, so variants share one structure and can morph into each other
const blob = (r, rot = 0) => {
  const n = r.length, pts = r.map((rr, i) => { const t = (i / n) * Math.PI * 2 + rot; return [50 + Math.cos(t) * rr, 50 + Math.sin(t) * rr]; });
  const k = 0.55 * (2 * Math.PI / n) / (Math.PI / 2) * 0.92;
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[i], p1 = pts[(i + 1) % n], t0 = (i / n) * Math.PI * 2 + rot, t1 = ((i + 1) / n) * Math.PI * 2 + rot;
    const c0 = [p0[0] - Math.sin(t0) * r[i] * k, p0[1] + Math.cos(t0) * r[i] * k], c1 = [p1[0] + Math.sin(t1) * r[(i + 1) % n] * k, p1[1] - Math.cos(t1) * r[(i + 1) % n] * k];
    d += ` C${c0[0].toFixed(2)} ${c0[1].toFixed(2)} ${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${p1[0].toFixed(2)} ${p1[1].toFixed(2)}`;
  }
  return d + "Z";
};
const BODY = [blob([44, 46, 45, 43, 44.5, 46, 45.5, 44], 0.2), blob([46, 44, 43.5, 45.5, 46, 44, 43, 45.5], 0.35), blob([45, 45.5, 46, 44, 43, 45, 46.5, 44.5], 0.1)];
const bodyVals = [...BODY, BODY[0]].join(";");
const SPL = "0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1";
// a drifting soft field
const Drift = ({ cx, cy, rx, ry, fill, op = 1, dx, dy, dur, rot = 0 }) => (
  <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} opacity={op} transform={`rotate(${rot} ${cx} ${cy})`}>
    <animateTransform attributeName="transform" type="translate" additive="sum" values={`0 0;${dx} ${dy};${-dy * 0.6} ${dx * 0.5};0 0`} dur={dur} repeatCount="indefinite" calcMode="spline" keySplines={SPL} />
  </ellipse>
);
// the crew: each agent is its character's face (a head portrait on a tint of its colour); working, it breathes.
// North itself (and anything without a face) keeps the WebGL orb, with the drawn SVG orb as its fallback
const Face = ({ id, size, live, className }) => (
  <span className={`aorb aorb-face aorb-${id}${live ? " is-live" : ""} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
    <img src={FACES[id]} width={size} height={size} alt="" draggable={false} />
  </span>
);
// the whole character (the Agents page): size is its height, feet on the bottom edge; it shifts its weight now and then
const Body = ({ id, size, live, className }) => (
  <span className={`aorb aorb-body aorb-${id}${live ? " is-live" : ""} ${className}`} style={{ width: Math.round(size * (BODY_ASPECT[id] || 0.45)), height: size }} aria-hidden="true">
    <img src={BODIES[id]} alt="" draggable={false} />
  </span>
);
export const Orb = ({ id, size = 22, live = false, className = "", body = false }) => body && BODIES[id] ? <Body id={id} size={size} live={live} className={className} /> : FACES[id] ? <Face id={id} size={size} live={live} className={className} /> : <GlOrb id={id} size={size} live={live} className={className} />;
const GlOrb = ({ id, size = 22, live = false, className = "" }) => {
  const ref = React.useRef(null), [flat, setFlat] = useState(false);
  React.useEffect(() => { const cv = ref.current; if (!cv) return; const off = mountOrb(cv, id); if (!off) setFlat(true); return () => off && off(); }, [id]);
  if (flat) return <OrbSvg id={id} size={size} live={live} className={className} />;
  const px = Math.round(size * Math.min(2, (typeof window !== "undefined" && window.devicePixelRatio) || 1));
  return (
    <span className={`aorb aorb-gl aorb-${id}${live ? " is-live" : ""} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <canvas ref={ref} width={px} height={px} style={{ width: size, height: size, display: "block" }} />
    </span>
  );
};
const OrbSvg = ({ id, size = 22, live = false, className = "" }) => {
  const u = useId().replace(/:/g, ""), p = PAL[id] || PAL.calvin, k = 0.6, dur = (s) => `${(s * k).toFixed(2)}s`; // one steady pace, always flowing (changing durations mid-flight would freeze it)
  return (
    <span className={`aorb aorb-${id}${live ? " is-live" : ""} ${className}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <clipPath id={`s${u}`}><circle cx="50" cy="50" r="49.5" /></clipPath>
          <clipPath id={`b${u}`}><path d={BODY[0]}><animate attributeName="d" values={bodyVals} dur={dur(9)} repeatCount="indefinite" calcMode="spline" keySplines={SPL} /></path></clipPath>
          <filter id={`f1${u}`} filterUnits="userSpaceOnUse" x="-60" y="-60" width="220" height="220"><feGaussianBlur stdDeviation="7" /></filter>
          <filter id={`f2${u}`} filterUnits="userSpaceOnUse" x="-60" y="-60" width="220" height="220"><feGaussianBlur stdDeviation="3.4" /></filter>
          <filter id={`f3${u}`} filterUnits="userSpaceOnUse" x="-60" y="-60" width="220" height="220"><feGaussianBlur stdDeviation="0.9" /></filter>
          <linearGradient id={`e${u}`} x1="0.15" y1="0.1" x2="0.9" y2="0.95"><stop offset="0" stopColor="#fff" stopOpacity=".9" /><stop offset=".45" stopColor={p.b} stopOpacity=".2" /><stop offset=".7" stopColor={p.crease} /><stop offset="1" stopColor={p.low} /></linearGradient>
          <linearGradient id={`r${u}`} x1="0.2" y1="0" x2="0.75" y2="1"><stop offset="0" stopColor="#fff" /><stop offset=".45" stopColor={p.rimA} /><stop offset="1" stopColor={p.rimB} /></linearGradient>
          {[["ka", p.a], ["kw", "#ffffff"], ["kl", p.e]].map(([k, c]) => (
            <linearGradient key={k} id={`${k}${u}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c} stopOpacity="0" /><stop offset=".35" stopColor={c} /><stop offset=".65" stopColor={c} /><stop offset="1" stopColor={c} stopOpacity="0" /></linearGradient>
          ))}
          <radialGradient id={`g${u}`} cx=".5" cy=".5" r=".5"><stop offset=".86" stopColor={p.base} stopOpacity="0" /><stop offset="1" stopColor={p.rimB} stopOpacity=".9" /></radialGradient>
        </defs>
        <g clipPath={`url(#s${u})`}>
          {/* the glass: pale, with a tinted rim */}
          <rect width="100" height="100" fill={p.base} />
          <rect width="100" height="100" fill={`url(#g${u})`} />
          {/* the liquid body, inside the rim */}
          <g clipPath={`url(#b${u})`}>
            <rect width="100" height="100" fill={p.w} />
            <g>
              <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur={dur(26)} repeatCount="indefinite" />
              <g filter={`url(#f1${u})`}>
                <Drift cx={64} cy={36} rx={30} ry={20} fill={p.b} dx={-6} dy={5} dur={dur(8)} rot={30} />
                <Drift cx={70} cy={55} rx={18} ry={26} fill={p.a} op={0.85} dx={-5} dy={-6} dur={dur(7)} rot={-20} />
                <Drift cx={38} cy={72} rx={30} ry={14} fill={p.a} op={0.7} dx={7} dy={-3} dur={dur(9.5)} rot={-12} />
                <Drift cx={58} cy={78} rx={24} ry={14} fill={p.c} op={0.8} dx={-4} dy={-5} dur={dur(8.5)} rot={8} />
                <Drift cx={78} cy={78} rx={16} ry={16} fill={p.d} dx={-5} dy={-4} dur={dur(6.5)} />
                <Drift cx={74} cy={24} rx={12} ry={8} fill={p.f} op={0.8} dx={-3} dy={4} dur={dur(7.5)} rot={35} />
                <Drift cx={32} cy={40} rx={22} ry={18} fill={p.w} op={0.95} dx={5} dy={4} dur={dur(10)} />
              </g>
              {/* folds: soft curved ribbons that fade at their ends — the silk in it, never straight lines */}
              <g filter={`url(#f2${u})`} fill="none" strokeLinecap="round">
                <path d="M68 16 Q94 46 74 84" stroke={`url(#ka${u})`} strokeWidth="7" opacity=".6">
                  <animateTransform attributeName="transform" type="rotate" values="0 50 50;-14 50 50;6 50 50;0 50 50" dur={dur(9)} repeatCount="indefinite" calcMode="spline" keySplines={SPL} />
                </path>
                <path d="M14 62 C32 52 52 72 84 54" stroke={`url(#kw${u})`} strokeWidth="8" opacity=".75">
                  <animateTransform attributeName="transform" type="translate" values="0 0;3 -6;-4 3;0 0" dur={dur(8)} repeatCount="indefinite" calcMode="spline" keySplines={SPL} />
                </path>
                <path d="M24 82 C42 72 62 90 86 74" stroke={`url(#kl${u})`} strokeWidth="6" opacity=".6">
                  <animateTransform attributeName="transform" type="translate" values="0 0;-4 -3;3 -5;0 0" dur={dur(7)} repeatCount="indefinite" calcMode="spline" keySplines={SPL} />
                </path>
              </g>
            </g>
          </g>
          {/* where the body meets the glass: a crease that's light up-left, deep colour down-right */}
          <path d={BODY[0]} fill="none" stroke={`url(#e${u})`} strokeWidth="2.4" filter={`url(#f3${u})`} opacity=".85">
            <animate attributeName="d" values={bodyVals} dur={dur(9)} repeatCount="indefinite" calcMode="spline" keySplines={SPL} />
          </path>
          {/* the rim and the glint */}
          <circle cx="50" cy="50" r="48.6" fill="none" stroke={`url(#r${u})`} strokeWidth="1.6" opacity=".9" />
          <ellipse cx="40" cy="47" rx="3.2" ry="2" fill="#fff" filter={`url(#f3${u})`} transform="rotate(-35 40 47)" />
          <ellipse cx="46" cy="22" rx="16" ry="6" fill="#fff" opacity=".45" filter={`url(#f2${u})`} transform="rotate(-18 46 22)" />
        </g>
      </svg>
    </span>
  );
};
// (the old CSS marble filter is no longer used)
export const OrbDefs = () => null;
export const AgentMark = ({ id, size = 22, live }) => <Orb id={id} size={size} live={live} />;
// a few agents together: overlapping orbs
export const OrbStack = ({ ids = AGENT_IDS, size = 18, stagger = 0.09, M }) => (
  <span className="orb-stack">{ids.map((id, i) => (
    <motion.span key={id} initial={{ opacity: 0, scale: 0.3, filter: "blur(4px)" }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      transition={{ type: "spring", visualDuration: 0.5, bounce: 0.35, delay: i * stagger }}><Orb id={id} size={size} /></motion.span>
  ))}</span>
);
// words arrive one after another, softly (same feel as North's answers)
// the pace eases out: early words come quickly, the last few settle in more slowly
const Words = ({ text }) => {
  const parts = text.split(/(\s+)/), n = parts.filter((w) => !/^\s+$/.test(w)).length, total = Math.min(1600, n * 30);
  let j = 0;
  return parts.map((w, i) => {
    if (/^\s+$/.test(w)) return w;
    const t = n > 1 ? j / (n - 1) : 1; j++;
    return <span key={i} className="ag-w" style={{ "--d": `${Math.round(total * (1 - Math.pow(1 - t, 2.2)))}ms`, "--w": `${Math.round(420 + 380 * t)}ms` }}>{w}</span>;
  });
};

// one agent's turn: the orb arrives first (a soft pop and a ripple of its colour), swirls while they think,
// then the take arrives word by word and the source settles in under it
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
export function RowHover({ o, t }) {
  const [f] = useState(() => ({ ...o })), seed = 18, l = clampN(f.x - seed / 2, 0, f.w - seed), r = f.w - l - seed;
  return <motion.span className="chs-hover" initial={{ left: l, right: r, top: 5, bottom: 5, opacity: 0 }} animate={{ left: 0, right: 0, top: 0, bottom: 0, opacity: 1 }}
    exit={{ opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }} transition={{ default: toMotion(t), opacity: { duration: 0.2 } }} />;
}
const GLIDE = { type: "easing", duration: 0.5, ease: [0.32, 0.72, 0, 1] };
// a selection fill that appears where you chose, never sliding over from the last thing chosen: it grows out from the point
// you clicked (from its middle when you chose with the keyboard), the way a hover grows from the cursor
let lastDown = null;
if (typeof document !== "undefined") document.addEventListener("pointerdown", (e) => { lastDown = { x: e.clientX, y: e.clientY, t: Date.now() }; }, true);
export function SelIn({ className, style }) {
  const ref = useRef(null);
  useLayoutEffect(() => { const el = ref.current; if (!el || !el.animate) return; const r = el.getBoundingClientRect(), d = lastDown;
    const hit = d && Date.now() - d.t < 1500 && d.x >= r.left - 2 && d.x <= r.right + 2 && d.y >= r.top - 2 && d.y <= r.bottom + 2;
    const seed = Math.min(18, r.width), x = clampN((hit ? d.x - r.left : r.width / 2) - seed / 2, 0, Math.max(0, r.width - seed)), v = Math.min(5, r.height / 4);
    const g = (typeof window !== "undefined" && window.__northGlide) || GLIDE;
    el.animate([{ clipPath: `inset(${v}px ${Math.max(0, r.width - x - seed)}px ${v}px ${x}px round 6px)`, opacity: 0.4 }, { clipPath: "inset(-2px -2px -2px -2px round 6px)", opacity: 1 }],
      { duration: (g.duration || 0.5) * 1000, easing: `cubic-bezier(${(g.ease || GLIDE.ease).join(",")})`, fill: "none" }); }, []);
  return <span ref={ref} className={className} style={style} />;
}
// a job opened in place, under its row: grows open, nothing leaves the chat
export function JobPeek({ id, onShare, M, onAgents, said }) {
  const d = window.__northAgents?.detail(id); if (!d) return null;
  return (
    <motion.div className="ag-pk" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ height: { duration: 0.38, ease: [0.32, 0.72, 0, 1] }, opacity: { duration: 0.24 } }}>
      <div className="ag-pk-in">
        {d.done ? <>{d.done.result ? (d.done.result !== said && <p className="ag-pk-p">{d.done.result}</p>) : <p className="ag-pk-p">{d.what || "Finished. The details are in Agents."}</p>}{d.done.next && <p className="ag-pk-m"><span>Next</span>{d.done.next}</p>}</>
          : <>{d.what && <p className="ag-pk-p">{d.what}</p>}
            {d.worth && <p className="ag-pk-m"><span>Worth</span>{d.worth}</p>}
            {d.now && <p className="ag-pk-m"><span>Now</span>{d.now}</p>}
            {d.wait && <p className="ag-pk-m"><span>Waiting</span>{d.wait}</p>}
            {d.steps.length > 0 && <ol className="ag-pk-s">{d.steps.map((x) => <li key={x}>{x}</li>)}</ol>}</>}
        <span className="ag-pk-f">For {d.who}<i>·</i>{d.mine ? "You asked for this" : `${AGENTS[d.ag].n} started it`}</span>
      </div>
    </motion.div>
  );
}
export function AgentMsg({ m, M, acts, after, extra, onDecide, onShare, onNext }) {
  const [sh, setSh] = useState(null), S = (typeof window !== "undefined" && window.__northAgents?.share) || [];
  const [ex, setEx] = useState(null), [hv, setHv] = useState(null), at = React.useRef({ x: 100, w: 600 });
  const enter = (k) => (e) => { const r = e.currentTarget.getBoundingClientRect(); at.current = { x: e.clientX - r.left, w: r.width }; setHv(k); };
  const leave = (k) => () => setHv((h) => (h === k ? null : h));
  const a = AGENTS[m.agent], Tm = toMotion(M.chat.swap);
  const words = (m.text || "").split(/\s+/).length;
  return (
    <motion.div className={`ch-msg ag-msg ag-${a.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <div className="ag-body">
        {/* the orb sits in the name line, as tall as the name */}
        <span className="ag-who">
          <motion.span className="ag-orb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {a.id === "north" ? <NorthLogo size={16} /> : <Orb id={a.id} size={18} live={!!m.typing} />}
            <i className="ag-ripple" />
          </motion.span>
          <motion.b initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} transition={{ ...Tm, delay: 0.08 }}>{a.n}</motion.b>
          <motion.small initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...Tm, delay: 0.14 }}>{m.update ? "Update" : a.role}</motion.small>
        </span>
        <AnimatePresence mode="popLayout" initial={false}>
          {m.typing
            ? <motion.span key="ty" className="ag-think" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, filter: "blur(3px)", transition: { duration: 0.14 } }}>Looking at {m.lookAt || "the numbers"}…</motion.span>
            : <motion.div key="tx" initial={{ opacity: 1 }}>
                <p className="ag-text"><Words text={scrub(m.text)} /></p>
                {extra && <div className="ag-card">{extra}</div>}
                {/* a huddle's next step, as a decision: say yes and it starts (the draft, the list, the invites) */}
                {m.next && <span className="ag-jobs" style={{ animationDelay: `${Math.min(1600, words * 30) + 350}ms` }}>
                  <div className={`ag-job is-need${m.nextDone ? " is-decided" : ""}`}>
                    <Orb id={m.agent} size={12} /><span>{m.next.title}</span>
                    {!m.nextDone && onNext ? <span className="ag-dec"><button className="ag-dec-y" onClick={() => onNext(true)}>{m.next.button}</button><button className="ag-dec-n" onClick={() => onNext(false)}>Not now</button></span>
                      : <em>{m.nextDone === "yes" ? m.next.ok || "On it" : m.next.nok || "Held"}</em>}
                  </div></span>}
                {m.jobs?.length > 0 && !m.update && <span className="ag-jobs" style={{ animationDelay: `${Math.min(1600, words * 30) + 250}ms` }}>{m.jobs.map((j) => (
                  <div key={j.id} className={`ag-jw${ex === j.id ? " is-open" : ""}`}>
                  <div role="button" tabIndex={0} aria-expanded={ex === j.id} className={`ag-job is-${j.st}${m.decided?.[j.id] ? " is-decided" : ""}${ex === j.id ? " is-open" : ""}`} onClick={() => setEx(ex === j.id ? null : j.id)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setEx(ex === j.id ? null : j.id))} onPointerEnter={enter(j.id)} onPointerLeave={leave(j.id)}>
                    <AnimatePresence>{hv === j.id && ex !== j.id && <RowHover key="h" o={at.current} t={GLIDE} />}</AnimatePresence>
                    <Orb id={j.ag} size={12} /><span>{j.t}</span>
                    {/* a decision is made right here: say yes or not now, and its owner answers in the thread */}
                    {j.st === "need" && onDecide && !m.decided?.[j.id]
                      ? <span className="ag-dec" onClick={(e) => e.stopPropagation()}><button className="ag-dec-y" onClick={() => onDecide(j, true)}>{j.act || "Approve"}</button><button className="ag-dec-n" onClick={() => onDecide(j, false)}>Not now</button></span>
                      : <em>{m.decided?.[j.id] === "yes" ? "Approved" : m.decided?.[j.id] === "no" ? "Held" : j.label}</em>}
                  </div>
                  <AnimatePresence initial={false}>{ex === j.id && <JobPeek key="pk" id={j.id} M={M} />}</AnimatePresence>
                  </div>))}</span>}
                {/* a delivery: each finished job, what came out of it, and the way into the full thing */}
                {m.deliv?.length > 0 && <div className="ag-dls" style={{ animationDelay: `${Math.min(1600, words * 30) + 250}ms` }}>{m.deliv.map((d) => (
                  <div key={d.id} className="ag-dl">
                    <span className="ag-dl-h"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.5 6.3 4.8 8.5 9.5 3.6" /></svg><b>{d.t}{d.v > 1 && <em className="ag-dl-v">v{d.v}</em>}</b></span>
                    {d.result && <p className="ag-dl-r">{d.result}</p>}
                    <span className="ag-dl-f">
                      <span className="ag-dl-n">{d.v > 1 && d.note ? `Reworked with “${d.note}”` : ""}</span>
                      <span className="ag-dl-b">
                        <button onClick={(e) => { window.__northAgents?.seen(d.id); const r = e.currentTarget.closest(".ag-dl").getBoundingClientRect(); dispatchEvent(new CustomEvent("north:open-job", { detail: { id: d.id, from: { left: r.left, top: r.top, width: r.width, height: r.height } } })); }}>Open</button>
                        {onShare && <span className="ag-dl-s"><button className={sh === d.id ? "is-on" : ""} onClick={() => setSh(sh === d.id ? null : d.id)}>Share</button>
                          <AnimatePresence>{sh === d.id && <motion.div className="ch-menu ag-dl-m" initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, transition: { duration: 0.12 } }} transition={{ duration: 0.2 }}>
                            {S.map(([g, L]) => <React.Fragment key={g}><span className="ag-dl-g">{g}</span>{L.map(([k, l, dd]) => <button key={k} onClick={() => { setSh(null); onShare(d, k, l); }}><b>{l}</b>{dd && <small>{dd}</small>}</button>)}</React.Fragment>)}
                          </motion.div>}</AnimatePresence></span>}
                      </span>
                    </span>
                  </div>))}</div>}
                {m.src && <span className="ag-src" style={{ animationDelay: `${Math.min(1600, words * 30) + 350}ms` }}>{m.src}</span>}
                {acts && <div className="ag-actsrow" style={{ animationDelay: `${Math.min(1600, words * 30) + 500}ms` }}>{acts}</div>}
              </motion.div>}
        </AnimatePresence>
        {!m.typing && after}
      </div>
    </motion.div>
  );
}
// a convened round opens with the three joining, together
export function AgentJoin({ ids, topic, M, joined = false, again = false }) {
  return (
    <motion.div className="ch-msg ag-join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
      <OrbStack ids={ids} size={22} M={M} />
      <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ ...toMotion(M.chat.swap), delay: 0.25 }}>
        {ids.map((id) => AGENTS[id].n).join(", ").replace(/, ([^,]*)$/, " and $1")}{joined ? (again ? (ids.length > 1 ? " are already here" : " is already here") : " joined the conversation") : ` are weighing in${topic ? ` on ${topic}` : ""}`}
      </motion.span>
    </motion.div>
  );
}

// under an answer that crosses into another lane: one quiet line, one tap
export function AgentSuggest({ id, why, onBring, M }) {
  const a = AGENTS[id];
  return (
    <motion.div className="ag-sug" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={toMotion(M.chat.swap)}>
      <AgentMark id={id} size={18} /><span className="ag-sug-t">{a.n} has a take on {why}.</span>
      <button onClick={onBring}>Bring in {a.n}</button>
    </motion.div>
  );
}
