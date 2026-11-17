import React, { useContext, useEffect, useRef, useState } from "react";
import { C, lerp, win, stag, clamp } from "./lib.js";
import { MotionCtx, VisualFrame, Big, Small, tipAlign, useKeyField, mixHex, W, DemoRuler } from "./visuals.jsx";
import { onIntent } from "./voice-intents.js";

// Home is hers to build. Asking North for "a dash of the latest campaign" (typed in the ask bar or said out loud) builds one
// at the top of her page: Lisa's Portal launch campaign, live since Oct 13, laid out like Saved Charts (the
// numbers as a list on the right, the one you pick drawn large on the left). It stays until she takes it off. Every figure is
// sample data.
let on = false; try { on = localStorage.getItem("north.dash.campaign") === "1"; } catch (e) {}
const subs = new Set(), ping = () => subs.forEach((f) => f(on));
const setOn = (v) => { on = v; try { localStorage.setItem("north.dash.campaign", v ? "1" : "0"); } catch (e) {} ping(); };
export const setCampaign = (v) => setOn(v);
export const useCampaignDash = () => { const [v, set] = useState(on); useEffect(() => { subs.add(set); return () => subs.delete(set); }, []); return v; };

const MAKE = /\b(dash|dashboard|board|view|page|report|build|make|tracker|live update|update)\b/i, CAMP = /\b(campaign|portal launch|launch)\b/i, OFF = /\b(remove|take|delete|hide|get rid of)\b/i;
// a campaign she names that isn't in the data (only Lisa's Portal launch is) gets said plainly, and the one that is gets built
const NAMED = /(?:of|for|on)\s+(?:the\s+|our\s+|my\s+)?([a-z0-9][\w' -]{1,40}?)\s+campaign/i, OURS = /^(latest|current|last|recent|new|newest|portal|portal launch|launch|lisa'?s)$/i;
onIntent((n) => {
  if (!CAMP.test(n) || !MAKE.test(n)) return null;
  if (OFF.test(n) && !/\bbuild\b/i.test(n)) { if (!on) return "There’s no campaign dash on your Home."; setOn(false); return "Took the campaign dash off your Home."; }
  const m = NAMED.exec(n), name = m && m[1].trim(), other = name && !OURS.test(name) ? name.replace(/\b\w/g, (c) => c.toUpperCase()) : null;
  if (other) { const was = on; setOn(true); return `I don’t see a ${other} campaign in your data yet. The latest is Lisa’s Portal launch, so ${was ? "that’s the one at the top of your Home" : "I built that one at the top of your Home"}.`; }
  if (on) return "It’s already at the top of your Home.";
  setOn(true); return "Built it: Lisa’s Portal launch campaign, at the top of your Home.";
});

const PU = C.purple, CO = C.coral, NV = C.navy;
// the campaign so far, Oct 13 to today (Oct 28). All sample
const DAYS = Array.from({ length: 16 }, (_, i) => `Oct ${13 + i}`);
const VISITS = [640, 410, 352, 300, 268, 244, 236, 512, 604, 338, 291, 266, 248, 232, 259, 281]; // spikes: launch day (Oct 13), Lisa's workshop invite (Oct 20)
const TOTAL = VISITS.reduce((a, b) => a + b, 0);
const DEM = [2, 4, 6, 8, 11, 13, 13, 15, 18, 21, 23, 26, 28, 28, 32, 38]; // demo requests, running total
const PIPE = 412, GOAL = 600;
const fmt = (n) => n.toLocaleString("en-US");

// 1 · visits: Seth's weekly-area form. The days as a grained navy area swept in from the left; each day a fine salmon line from
// its number in the top row down to its dot, carried on into the area as a paper line; the biggest day ringed and set in
// salmon; the dates turned on their side under the baseline
function VisitsArea({ p }) {
  const { E } = useContext(MotionCtx), N = 16, base = 160, top = 86, mx = 680, X = (i) => 12 + (i / (N - 1)) * (W - 24), Y = (v) => base - ((base - top) * v) / mx;
  const S = E(win(p, 0.1, 0.8)), sweepX = lerp(X(0), X(15) + 28, S), pk = VISITS.indexOf(Math.max(...VISITS));
  const area = `M${X(0)} ${base}` + VISITS.map((v, i) => `L${X(i)} ${Y(v)}`).join("") + `L${X(15)} ${base}Z`;
  const seen = (i) => clamp((sweepX - X(i) + 4) / 24);
  const pick = (x, y) => { if (y < 52 || y > 200) return null; const i = clamp(Math.round(((x - 12) / (W - 24)) * (N - 1)), 0, N - 1);
    return { i, tip: { x: X(i), y: Y(VISITS[i]) - 14, align: tipAlign(X(i)), title: DAYS[i], rows: [{ c: C.navyFill, k: "Visits", v: fmt(VISITS[i]) }, ...(i === 0 ? [{ k: "Launch day" }] : i === 8 ? [{ k: "The day after the workshop invite" }] : i === 7 ? [{ k: "The workshop invite went out" }] : [])] } }; };
  return (
    <VisualFrame label="Launch page visits by day" pick={pick}>
      {(h) => <>
        <defs><clipPath id="cv-sweep"><rect x={0} y={0} width={sweepX} height={210} /></clipPath></defs>
        <Big x={0} y={40} fill={NV}>{fmt(Math.round(TOTAL * S))}</Big>
        <g clipPath="url(#cv-sweep)">
          <path d={area} fill={C.navyFill} filter="url(#grain)" />
          {VISITS.map((v, i) => <line key={i} x1={X(i) + 0.5} y1={Y(v)} x2={X(i) + 0.5} y2={base} stroke={C.paper} strokeWidth={1} />)}
        </g>
        <line x1={0} y1={base + 0.5} x2={W} y2={base + 0.5} stroke={NV} strokeWidth={1} />
        {VISITS.map((v, i) => { const s = seen(i), on = h && h.i === i, big = i === pk;
          return <g key={i} opacity={s * (h && !on ? 0.55 : 1)}>
            <line x1={X(i) + 0.5} y1={66} x2={X(i) + 0.5} y2={Y(v)} stroke={CO} strokeWidth={on ? 1.5 : 1} />
            {big ? <><circle cx={X(i) + 0.5} cy={Y(v)} r={9 * s} fill={CO} stroke={C.paper} strokeWidth={2.45} /><circle cx={X(i) + 0.5} cy={Y(v)} r={6 * s} fill={CO} stroke={C.paper} strokeWidth={1.6} /></>
              : <circle cx={X(i) + 0.5} cy={Y(v)} r={(on ? 4.5 : 3.5) * s} fill={CO} stroke={C.paper} strokeWidth={1.5} />}
            <Small x={X(i) + 0.5} y={60} fill={big ? CO : NV} w={big ? 600 : 500} size={12} anchor="middle">{v}</Small>
            <text x={X(i) - 3} y={base + 8} transform={`rotate(90 ${X(i) - 3} ${base + 8})`} fontSize={10} fontWeight={big ? 600 : 500} fill={big ? CO : C.axis} letterSpacing=".04em">{DAYS[i].toUpperCase()}</text>
          </g>; })}
        {h && <line x1={X(h.i) + 0.5} y1={66} x2={X(h.i) + 0.5} y2={base} stroke={NV} strokeWidth={0.5} strokeDasharray="2 2" pointerEvents="none" />}
      </>}
    </VisualFrame>);
}
// 2 · demo requests: the opened-metric line (NRR's form): a fine grid with its values on the left, the running total as a
// 1.75 line over a hatch of 0.5 strokes, a dot at each week (today's the largest), the goal as a dotted salmon line ending in
// a salmon dot. Hover reads any day off the line
const TL = "#257985";
function DemoTrend({ p }) {
  const { E } = useContext(MotionCtx), x0 = 34, x1 = W - 8, top = 70, base = 182, lo = 0, hi = 55, X = (i) => x0 + 14 + (i / 15) * (x1 - x0 - 28), Y = (v) => base - ((v - lo) / (hi - lo)) * (base - top);
  const pts = DEM.map((v, i) => [X(i), Y(v)]), S = E(win(p, 0.05, 0.8)), sx = lerp(pts[0][0], pts[15][0], S), wk = [0, 4, 8, 12, 15], tg = win(p, 0.5, 0.85), tdot = win(p, 0.8, 1);
  const at = (x) => { let k = 1; while (k < 15 && pts[k][0] < x) k++; const [xa, ya] = pts[k - 1], [xb, yb] = pts[k]; return ya + ((yb - ya) * (x - xa)) / (xb - xa); };
  const stripes = []; for (let x = pts[0][0] + 2; x < pts[15][0]; x += 4) stripes.push(x);
  const pick = (x, y) => { if (x < x0 || y < top - 20 || y > base + 6) return null; const i = clamp(Math.round(((x - X(0)) / (X(15) - X(0))) * 15), 0, 15);
    return { i, tip: { x: X(i), y: Y(DEM[i]) - 12, align: tipAlign(X(i)), title: i === 15 ? "Today · 38" : `${DAYS[i]} · ${DEM[i]}`, rows: [{ c: TL, k: "Demo requests so far" }, { k: "To the goal", v: String(50 - DEM[i]) }, ...(i ? [{ k: "At the rate before the launch", v: String(Math.round((i * 4) / 7)) }] : [])] } }; };
  return (
    <VisualFrame label="Demo requests since the launch, against the goal" pick={pick}>
      {(h) => <>
        <Big x={0} y={40} fill={NV}>{String(Math.round(38 * S))}</Big>
        {[0, 25, 50].map((v, i) => <g key={v} opacity={stag(win(p, 0, 0.3), i, 3, 0.5)}>
          {v > 0 && <line x1={x0} x2={x1} y1={Y(v) + 0.25} y2={Y(v) + 0.25} stroke={C.line} strokeWidth={0.5} />}
          <text x={x0 - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fontWeight="500" fill={C.mute}>{v}</text>
        </g>)}
        <line x1={x0} x2={x1} y1={base} y2={base} stroke="#c9c4bf" />
        <defs><clipPath id="cd-trend"><rect x="0" y="0" width={sx} height="210" /></clipPath></defs>
        <g clipPath="url(#cd-trend)">
          {stripes.map((x) => <line key={x} x1={x} x2={x} y1={at(x)} y2={base} stroke={TL} strokeOpacity="0.4" strokeWidth="0.5" />)}
          <path d={pts.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join("")} fill="none" stroke={TL} strokeWidth="1.75" strokeLinejoin="round" />
        </g>
        <line x1={x0} x2={lerp(x0, x1 - 4, tg)} y1={Y(50)} y2={Y(50)} stroke={CO} strokeWidth="1" strokeDasharray="0.1 2.6" strokeLinecap="round" />
        <circle cx={x1 - 3} cy={Y(50)} r={3 * tdot} fill={CO} />
        <text x={x1} y={Y(50) - 10} textAnchor="end" fontSize="11" fontWeight="600" fill={CO} opacity={tdot}>Goal 50</text>
        {h && <line x1={X(h.i)} x2={X(h.i)} y1={Y(DEM[h.i])} y2={base} stroke={TL} strokeWidth="0.75" strokeDasharray="2 2" pointerEvents="none" />}
        {pts.map(([x, y], i) => (wk.includes(i) || (h && h.i === i)) && <circle key={i} cx={x} cy={y} r={(h && h.i === i ? 4.5 : i === 15 ? 3.5 : 2.5) * (S >= 1 ? 1 : clamp((sx - x + 2) / 6))} fill={TL} style={{ transition: "r .2s" }} />)}
        {wk.map((i) => <text key={i} x={X(i)} y={base + 17} textAnchor="middle" fontSize="11" fontWeight={i === 15 ? 600 : 400} fill={i === 15 ? NV : "#535353"} opacity={win(p, 0, 0.3)}>{i === 15 ? "Today" : DAYS[i]}</text>)}
      </>}
    </VisualFrame>);
}
// 3 · pipeline: a run of keys to the $600K goal, each $15K, filled purple into salmon as far as it's got; the goal key is salmon
function PipeTicks({ p }) {
  const { E, spread, D } = useContext(MotionCtx), N = 40, tw = 9, pitch = (W - tw) / (N - 1), ty = 89, th = 96, per = GOAL / N, nOn = Math.floor(PIPE / per);
  const fillP = E(win(p, 0.08, 0.6)), trackP = win(p, 0, 0.3), [kc, setKc] = useState(null), keys = useKeyField(N, pitch, kc), lift = D.keys.lift;
  const pick = (x, y) => { if (y < ty - 12 || y > ty + th + 6) return null; const i = clamp(Math.round((x - tw / 2) / pitch), 0, N - 1), k = i + 1;
    return { i, tip: { x: i * pitch + tw / 2, y: ty - 10, align: tipAlign(i * pitch), title: `$${Math.round(k * per)}K`, rows: [k === N ? { c: CO, k: "The campaign goal" } : k <= nOn ? { c: PU, k: "Brought in" } : { c: C.edge, k: "Still to come" }, { k: `1 key = $${per}K` }] } }; };
  return (
    <VisualFrame label="Pipeline brought in against the goal" pick={(x, y) => { const r = pick(x, y); setKc(r ? x - tw / 2 : null); return r; }}>
      {(h) => <>
        <Big x={0} y={40} fill={NV}>{`$${Math.round(PIPE * fillP)}K`}</Big>
        {Array.from({ length: N }, (_, i) => { const k = i + 1, x = i * pitch, up = lift * keys[i], tIn = stag(trackP, i, N, spread), on = h && h.i === i;
          const lit = k <= nOn, last = k === N, f = lit ? stag(fillP, i, nOn, spread * 0.6) : last ? E(win(p, 0.7, 0.95)) : 0, hh = (th + up) * f;
          return <g key={i}>
            <rect x={x + 0.25} y={ty - up + 0.25} width={tw - 0.5} height={th + up - 0.5} rx={1} fill={C.paper} stroke={on ? C.axis : C.line} strokeWidth={0.5} opacity={tIn} />
            {f > 0 && <rect x={x} y={ty + th - hh} width={tw} height={hh} rx={1} fill={last ? CO : mixHex(PU, CO, i / (N - 1))} filter="url(#grain)" />}
          </g>; })}
        <Small x={W} y={ty - 10} anchor="end" fill={CO} w={600} size={11} opacity={win(p, 0.75, 1)}>Goal $600K</Small>
        <Small x={0} y={202} fill={C.mute} opacity={win(p, 0, 0.3)}>$0</Small><Small x={W} y={202} anchor="end" fill={C.mute} opacity={win(p, 0, 0.3)}>$600K</Small>
      </>}
    </VisualFrame>);
}
// 4 · workshop RSVPs: the held-demo ruler, read against the goal of 20
const RSVP = { you: 14, target: 20, lo: 0, hi: 25, ticks: [0, 10, 20, 25], pre: "", suf: "", dec: 0, label: "Workshop RSVPs against the goal", youLabel: "RSVPs" };
const RsvpRuler = ({ p }) => <DemoRuler p={p} d={RSVP} />;

// the four numbers as Saved Charts rows: what it is, where it stands against its goal, and the sentence the chart proves
export const CAMPAIGN = [
  { id: "c-visits", name: "Launch page visits", lane: "Portal launch · Traffic", value: fmt(TOTAL), pct: 69, pctL: "of the 8,000 goal", foot: "Since Oct 13", title: "Launch day and the workshop invite brought most of the visits", sub: "Visits spike on Oct 13 and Oct 20, then settle near 250 a day.", V: VisitsArea },
  { id: "c-demos", name: "Demo requests", lane: "Portal launch · Inbound", value: "38", pct: 76, pctL: "of the 50 goal", foot: "Since Oct 13", title: "Demo requests are running at 4× the rate before the launch", sub: "38 in 16 days, against about 4 a week before Oct 13.", V: DemoTrend },
  { id: "c-pipe", name: "Pipeline brought in", lane: "Portal launch · Pipeline", value: `$${PIPE}K`, pct: Math.round((PIPE / GOAL) * 100), pctL: "of the $600K goal", foot: "Since Oct 13", title: "$188K left to reach the campaign goal", sub: "$412K of pipeline so far, 69% of the $600K goal.", V: PipeTicks },
  { id: "c-rsvp", name: "Workshop RSVPs", lane: "Portal launch · Events", value: "14", pct: 70, pctL: "of the 20 goal", foot: "Brokerage leaders workshop · Nov 24", title: "The workshop is 6 RSVPs short of its goal", sub: "14 so far, 9 of them customers.", V: RsvpRuler },
];
