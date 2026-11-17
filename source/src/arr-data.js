// ARR movement, one source for Home and the ARR movement page, so the two can never disagree. All of it is sample data.
// The world North shows is October 2026: September is the latest close, October is live (to date), November and December are
// the plan. Every month is built the same way: beginning + new + expansion − churn − downgrade = ending.
import { C } from "./lib.js";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const MONTHS_L = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export const SEGS = [["all", "All accounts"], ["mid", "Medium+"], ["small", "Ind & Small"]];
export const YEARS = [["2025", "2025"], ["2026", "2026"], ["2027", "2027"]];

const r2 = (v) => Math.round(v * 100) / 100;
// per year: where it starts, the ending ARR each month, churn and downgrade ($M), NRR − 100 in points (sets expansion), Felix
// ARR, average ARR per account ($K), and Medium+'s share of ending ARR
const YEAR = {
  2025: {
    start: 19.4,
    end: [19.7, 19.98, 20.33, 20.73, 21.05, 21.43, 21.85, 22.21, 22.61, 23.06, 23.54, 24.2],
    churn: [0.46, 0.49, 0.44, 0.47, 0.52, 0.45, 0.43, 0.5, 0.46, 0.44, 0.47, 0.42],
    down: [0.1, 0.11, 0.09, 0.1, 0.12, 0.1, 0.09, 0.11, 0.1, 0.09, 0.1, 0.08],
    nrr: [-0.6, -0.8, -0.4, -0.5, -0.9, -0.5, -0.3, -0.7, -0.4, -0.3, -0.4, -0.1],
    felix: Array(12).fill(null),
    avg: [9.1, 9.2, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 10.1, 10.3],
    mid: [0.84, 0.841, 0.842, 0.843, 0.844, 0.845, 0.846, 0.847, 0.848, 0.849, 0.85, 0.851],
  },
  2026: {
    start: 24.2,
    end: [25.0, 25.9, 26.8, 28.1, 29.5, 30.6, 31.3, 32.06, 34.15, 35.75, 37.89, 40.03],
    churn: [0.52, 0.48, 0.61, 0.44, 0.55, 0.58, 0.74, 0.69, 0.41, 0.47, 0.5, 0.52],
    down: [0.11, 0.09, 0.14, 0.08, 0.12, 0.1, 0.14, 0.13, 0.07, 0.09, 0.1, 0.1],
    nrr: [-0.3, -0.2, -0.5, 0.1, -0.9, -0.2, 0.2, -0.6, 0.7, -0.1, 0.2, 0.3], // May–Oct are Home's NRR tile
    felix: [null, null, null, null, 5.1, 6.4, 7.9, 9.42, 11.55, 12.99, 14.62, 16.3],
    avg: [10.4, 10.6, 10.8, 11.0, 11.3, 11.5, 11.7, 11.8, 12.2, 12.4, 12.9, 13.4],
    // October lands exactly on Home's split: Medium+ $31.10M, Ind & Small $4.65M
    mid: [0.852, 0.854, 0.856, 0.858, 0.86, 0.862, 0.864, 0.866, 0.87, 31.1 / 35.75, 0.871, 0.873],
  },
  2027: {
    start: 40.03,
    end: [40.93, 41.88, 42.88, 43.93, 45.03, 46.13, 47.28, 48.48, 49.68, 50.93, 52.23, 53.63],
    churn: [0.55, 0.56, 0.57, 0.58, 0.6, 0.6, 0.62, 0.63, 0.64, 0.65, 0.66, 0.68],
    down: [0.11, 0.11, 0.11, 0.12, 0.12, 0.12, 0.12, 0.13, 0.13, 0.13, 0.13, 0.13],
    nrr: [0.1, 0.1, 0.2, 0.2, 0.2, 0.3, 0.3, 0.3, 0.3, 0.4, 0.4, 0.4],
    felix: [17.1, 17.9, 18.7, 19.5, 20.3, 21.1, 21.9, 22.7, 23.5, 24.3, 25.1, 26.0],
    avg: [13.5, 13.7, 13.9, 14.1, 14.3, 14.5, 14.7, 14.9, 15.1, 15.3, 15.6, 15.8],
    mid: [0.874, 0.875, 0.876, 0.877, 0.878, 0.879, 0.88, 0.881, 0.882, 0.883, 0.884, 0.885],
  },
};
// Medium+'s share of each part of the movement (it expands more and churns less than Ind & Small)
const MID_PART = { exp: 0.93, churn: 0.74, down: 0.84, felix: 0.88 };

// the months, measured / live / plan, for a year
export function colsFor(year) {
  if (year === "2025") return MONTHS.map((m) => ({ k: m, l: m, g: "act" }));
  if (year === "2027") return MONTHS.map((m) => ({ k: m, l: m, g: "plan" }));
  return MONTHS.map((m, i) => ({ k: m, l: i === 9 ? "Oct · to date" : m, g: i < 9 ? "act" : i === 9 ? "live" : "plan" }));
}

// the whole movement for a segment and a year, every row twelve months long
function build(year, seg) {
  const Y = YEAR[year], n = 12;
  const tot = { beg: [], new: [], exp: [], churn: [], down: [], end: Y.end };
  for (let i = 0; i < n; i++) {
    const beg = i ? Y.end[i - 1] : Y.start, loss = Y.churn[i] + Y.down[i], exp = loss + (Y.nrr[i] / 100) * beg;
    tot.beg.push(beg); tot.exp.push(exp); tot.churn.push(Y.churn[i]); tot.down.push(Y.down[i]); tot.new.push(Y.end[i] - beg - exp + loss);
  }
  const midStart = Y.start * (year === "2026" ? YEAR[2025].mid[11] : year === "2027" ? YEAR[2026].mid[11] : 0.839);
  const pick = (f) => {
    if (seg === "all") return { ...tot, felix: Y.felix };
    const m = seg === "mid", sh = (s) => (m ? s : 1 - s);
    const end = Y.end.map((v, i) => v * sh(Y.mid[i])), start = m ? midStart : Y.start - midStart;
    const beg = end.map((_, i) => (i ? end[i - 1] : start));
    const exp = tot.exp.map((v) => v * sh(MID_PART.exp)), churn = tot.churn.map((v) => v * sh(MID_PART.churn)), down = tot.down.map((v) => v * sh(MID_PART.down));
    const nw = end.map((v, i) => v - beg[i] - exp[i] + churn[i] + down[i]);
    return { beg, new: nw, exp, churn, down, end, felix: Y.felix.map((v) => (v == null ? null : v * sh(MID_PART.felix))) };
  };
  const d = pick();
  const loss = d.churn.map((v, i) => v + d.down[i]), net = d.end.map((v, i) => v - d.beg[i]);
  return {
    start: r2(d.beg[0]), beg: d.beg.map(r2), new: d.new.map(r2), exp: d.exp.map(r2), churn: d.churn.map((v) => Math.round(v * 10000) / 10), down: d.down.map((v) => Math.round(v * 10000) / 10),
    loss: loss.map(r2), net: net.map(r2), end: d.end.map(r2),
    felix: d.felix.map((v) => (v == null ? null : r2(v))),
    share: d.felix.map((v, i) => (v == null ? null : Math.round((v / d.end[i]) * 1000) / 10)),
    grr: d.beg.map((b, i) => Math.round(((b - loss[i]) / b) * 1000) / 10),
    nrr: d.beg.map((b, i) => Math.round(((b + d.exp[i] - loss[i]) / b) * 1000) / 10),
    avg: Y.avg.map((v) => (seg === "all" ? v : seg === "mid" ? r2(v * 1.62) : r2(v * 0.31))),
  };
}
const CACHE = {};
export function arrData(seg = "all", year = "2026") { const k = `${seg}-${year}`; return CACHE[k] || (CACHE[k] = { seg, year, cols: colsFor(year), ...build(year, seg) }); }

// Home's view: 2026, all accounts. Ending ARR by month, and what moved each measured month (Jan–Oct, October to date)
const A = arrData("all", "2026");
export const ARR = A.end;
export const ARR_START = YEAR[2026].start;
export const MOVES = A.end.slice(0, 10).map((end, i) => ({ begin: A.beg[i], end, net: A.net[i], new: A.new[i], exp: A.exp[i], churn: A.churn[i] / 1000, down: A.down[i] / 1000 }));
export const OCT_TARGET = 36.0, PLAN_DEC = 40.03;
// the movement colors: losses are reds, never salmon; net new turquoise
export const MOVE_C = { new: C.navy, exp: C.purple, churn: "#d9374b", down: "#8e1b2b", net: "#1fa99c" };
