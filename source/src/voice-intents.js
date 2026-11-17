// Voice, forgiving: people don't talk in commands. Everything said goes through `normalize` first (filler out, spoken
// numbers to digits, the ways people say "tell" or "open" folded to one), then through the intents registered here
// (a deck that's open, booking a meeting), then on to the page's own commands (Home's "tell Paul…", "next", "start it").
// No model is involved, so it works on the hosted link too; what nothing understands still goes to North as a question.

const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, fifteen: 15, twenty: 20, thirty: 30, "forty five": 45, "forty-five": 45, first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, last: -1 };
export function normalize(raw) {
  let t = ` ${String(raw || "").trim()} `;
  // filler and politeness at the front ("um okay so can you please…", "hey North,")
  for (let i = 0; i < 4; i++) t = t.replace(/^\s*(um+|uh+|er+|okay|ok|so|alright|all right|hey|hi|yo|north|please|can you|could you|would you|will you|i want to|i'd like to|i want you to|let's|lets|go ahead and|just)\b[\s,.:!-]*/i, " ");
  t = t.replace(/\b(please|for me|real quick|thanks|thank you)\b/gi, " ");
  // spoken numbers
  t = t.replace(/\b(forty[ -]five|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty)\b/gi, (m) => String(NUM[m.toLowerCase()]));
  // the many ways of saying the same verb
  t = t.replace(/\blet (\w+) know( that)?\b/gi, "tell $1")
    .replace(/\b(message|ping|text|reply to|write to|answer)\s+(\w+)\b/gi, "tell $2")
    .replace(/\b(bring up|pull up|show me|take me to|let me see|open up|go to the|find (?=the |my |that ))\b/gi, "open ");
  return t.replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
}

// intents register here; each gets (normalized, raw) and returns what it did (a short line) or null
const REG = [];
export const onIntent = (f) => { REG.push(f); return () => { const i = REG.indexOf(f); if (i >= 0) REG.splice(i, 1); }; };
export const tryIntents = (n, raw) => { for (const f of [...REG].reverse()) { const r = f(n, raw); if (r) return r; } return null; };

// ---- meetings: "book 30 minutes with Heather tomorrow at 2 about Coastline" ----------------------------------------------
// today in the prototype is Tue Oct 27 (Home's chart says Today · Oct 27)
const TODAY = new Date(2026, 9, 27), DOW = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const fmtDay = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
const PEOPLE_N = { heather: "Heather", jordan: "Jordan", lisa: "Lisa", paul: "Paul", dustin: "Dustin" };
export function parseMeeting(n) {
  if (!/\b(book|schedule|set up|setup|put|grab|find|get)\b.*\b(meeting|time|call|sync|chat|catch up|catch-up|\d+\s*(min|minutes|mins|hour|hr))\b|\b(meet|meeting) with\b/i.test(n)) return null;
  const who = Object.keys(PEOPLE_N).filter((k) => new RegExp(`\\b${k}\\b`, "i").test(n));
  if (!who.length) return { err: "Who with? Say a name, like “with Heather”." };
  let d = new Date(TODAY);
  if (/\btomorrow\b/i.test(n) || !/\b(today|this (morning|afternoon)|monday|tuesday|wednesday|thursday|friday)\b/i.test(n)) d.setDate(d.getDate() + 1);
  else { const m = n.match(/\b(next )?(monday|tuesday|wednesday|thursday|friday)\b/i); if (m) { const w = DOW.indexOf(m[2].toLowerCase()); let add = (w - d.getDay() + 7) % 7 || 7; if (m[1]) add += add < 7 ? 7 : 0; d.setDate(d.getDate() + add); } }
  const tm = n.match(/\b(?:at\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?\b(?!\s*(min|minutes|mins|hour|hr))/i);
  let h = null, mi = 0; if (tm && /\bat\b|am|pm|:/i.test(tm[0])) { h = +tm[1]; mi = +(tm[2] || 0); const ap = (tm[3] || "").toLowerCase(); if (ap.startsWith("p") && h < 12) h += 12; if (!ap && h < 8) h += 12; }
  if (/\bmorning\b/i.test(n) && h == null) h = 10; if (/\bafternoon\b/i.test(n) && h == null) h = 14; if (/\b(eod|end of (the )?day)\b/i.test(n) && h == null) h = 16;
  if (h == null) h = 10; // no time said: the next open morning slot
  const len = (() => { const m = n.match(/\b(\d+)\s*(min|minutes|mins)\b/i); if (m) return +m[1]; const hr = n.match(/\b(\d+)?\s*(hour|hr)\b/i); if (hr) return 60 * (+hr[1] || 1); return 30; })();
  const ab = n.match(/\b(?:about|to talk about|to go over|to discuss|regarding|re)\s+(?!\d)(.+?)(?:\s+(?:tomorrow|today|at \d|on (?:monday|tuesday|wednesday|thursday|friday)|next \w+))*[.!]?$/i);
  const about = ab ? ab[1].replace(/\b(with \w+( and \w+)?)\b/i, "").trim() : null;
  d.setHours(h, mi, 0, 0);
  const when = `${fmtDay(d)}, ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
  return { who, when, len, about: about ? about.charAt(0).toUpperCase() + about.slice(1) : null, at: d };
}
export const MEETINGS = [];
onIntent((n) => {
  const m = parseMeeting(n); if (!m) return null; if (m.err) return m.err;
  MEETINGS.push(m); const names = m.who.map((k) => PEOPLE_N[k]), nm = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
  // the invite goes to them in North (no calendar is connected to the prototype; with Google Calendar it would land there too)
  const text = `I booked ${m.len} minutes with you on ${m.when.replace(", ", " ")}${m.about ? ` to talk about ${m.about}` : ""}.`;
  // everyone invited is already in the conversation in front of you: the invite goes there; otherwise it starts one with them
  const here = new CustomEvent("north:voice-say", { detail: { raw: text, n: text, to: null, rest: null, need: m.who, done: null }, cancelable: true });
  if (dispatchEvent(here)) dispatchEvent(new CustomEvent("north:talk-send", { detail: { people: m.who, topic: m.about ? `Meeting · ${m.about}` : "Meeting", text } }));
  dispatchEvent(new CustomEvent("north:meeting", { detail: m }));
  return `Booked ${m.len} min with ${nm} · ${m.when}${m.about ? ` · ${m.about}` : ""}`;
});
