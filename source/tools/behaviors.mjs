// Builds docs/behaviors/: every intent comment in the source, grouped by surface, each linked to the line it describes.
// The prototype's comments say what each piece does and why ("a selection fill that appears where you chose…"), so
// together they're the full list of behaviours. Run from source/: node tools/behaviors.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

const GROUPS = [
  ["shell", "Shell: layout, sidebar, top bar, page frame", ["App.jsx", "hover.js", "lib.js", "seat.js", "marks.jsx", "stack.jsx", "actions.jsx", "tune.jsx"]],
  ["home", "Home: Needs you, In progress, goals, tiles", ["goals.jsx", "home-work.jsx", "campaign.jsx"]],
  ["chat", "Ask North: chat, Watching, voice, messages", ["chat.jsx", "talk.jsx", "gchat.jsx", "voice.jsx", "voice-intents.js", "team-talk.js"]],
  ["agents", "Agents", ["agents.jsx", "agents-concept.jsx", "agents-log.jsx", "agents-horizon.jsx", "agents-entry.jsx", "crew.js", "agents-concept.css", "agents-embed.css", "agents-log.css", "agents-horizon.css"]],
  ["charts", "Charts", ["open-charts.jsx", "visuals.jsx"]],
  ["pages", "Company health, ARR, metrics, teams", ["health.jsx", "arr.jsx", "metric.jsx", "dept.jsx", "arr-data.js", "team-data.js"]],
  ["meetings-files", "Meetings, Files, Routines, Accounts", ["meetings.jsx", "files.jsx", "routines.jsx", "account.jsx", "deals.js", "covers.jsx"]],
  ["styles", "Styles (shell.html), by section", ["shell.html"]],
];
const SRC = "src", OUT = "../docs/behaviors", LINK = (f, l) => `../../source/src/${f}#L${l}`;

// is this comment a sentence about behaviour, not code switched off or a bare label?
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const codey = (s) => /^(const|let|var|import|export|return|if|for|function|<\w|\}|\{)\b/.test(s) || (s.match(/[;{}=()]/g) || []).length > 6;
const keep = (s) => words(s) >= 7 && !codey(s) && !/eslint|prettier|@ts-/.test(s);

function blocks(file) {
  const L = readFileSync(`${SRC}/${file}`, "utf8").split("\n"), out = [];
  let section = null;
  const css = /\.(css|html)$/.test(file);
  for (let i = 0; i < L.length; i++) {
    const t = L[i].trim();
    // a CSS section header names what follows: /* ---------- sidebar … */ or /* ===== … */
    const sec = css && t.match(/^\/\*\s*[-=]{3,}\s*(.+?)\s*[-=]*\s*\*\/?$/);
    if (sec) { section = sec[1].replace(/\*\/$/, "").replace(/[-=]+$/, "").trim(); }
    let text = null, at = i;
    if (!css && t.startsWith("//")) { // a run of // lines is one note
      const run = []; while (i < L.length && L[i].trim().startsWith("//")) { run.push(L[i].trim().replace(/^\/\/+\s?/, "")); i++; }
      text = run.join(" "); i--;
      let j = i + 1; while (j < L.length && !L[j].trim()) j++; at = j; // it describes the next line of code
    } else if (t.includes("/*")) { // a /* … */ note (CSS, or JSX {/* … */}), possibly over several lines
      let s = L[i], j = i; while (!s.includes("*/") && j + 1 < L.length) { j++; s += " " + L[j].trim(); }
      const m = s.match(/\/\*([\s\S]*?)\*\//); if (m) text = m[1].replace(/\s+/g, " ").trim();
      const before = s.slice(0, s.indexOf("/*")).trim().replace(/^\{$/, "");
      at = before ? i : (() => { let k = j + 1; while (k < L.length && !L[k].trim()) k++; return k; })();
      i = j;
    } else {
      const m = L[i].match(/[;})\]>]\s*\/\/\s*(.+)$/); // a note at the end of a line of code
      if (m && !/https?:$/.test(L[i].slice(0, L[i].indexOf("//")).trim())) text = m[1];
    }
    if (text) text = text.replace(/^[-=]{3,}\s*/, "").replace(/\s*[-=]{3,}\s*/g, " · ").trim();
    if (!text || !keep(text)) continue;
    const code = (L[at] || "").trim().replace(/\s+/g, " ").slice(0, 90);
    out.push({ text, line: at + 1, code, section });
  }
  return out;
}

mkdirSync(OUT, { recursive: true });
const index = ["# Behaviours", "", "Every behaviour the prototype's source describes, by surface. Each note is the comment written next to the code that does it, linked to that line. Regenerate with `node tools/behaviors.mjs` from `source/`.", "", "| Surface | Notes |", "|---|---|"];
for (const [k, title, files] of GROUPS) {
  const md = [`# ${title}`, "", "Each note: what it does, then where. Read the linked line for exact values.", ""];
  let n = 0;
  for (const f of files) {
    if (!existsSync(`${SRC}/${f}`)) continue;
    const bs = blocks(f); if (!bs.length) continue;
    md.push(`## ${f}`, ""); let sec = undefined;
    for (const b of bs) {
      if (b.section !== sec && b.section) { md.push("", `### ${b.section}`, ""); }
      sec = b.section;
      md.push(`- ${b.text.replace(/\|/g, "\\|")} — [L${b.line}](${LINK(f, b.line)})${b.code ? ` \`${b.code.replace(/`/g, "'")}\`` : ""}`); n++;
    }
    md.push("");
  }
  writeFileSync(`${OUT}/${k}.md`, md.join("\n"));
  index.push(`| [${title}](${k}.md) | ${n} |`);
}
writeFileSync(`${OUT}/README.md`, index.join("\n") + "\n");
console.log(index.join("\n"));
