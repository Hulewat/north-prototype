import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { scopedAgentsCss } from "./scope-agents-css.mjs";

const out = await build({
  entryPoints: ["src/App.jsx"],
  bundle: true,
  minify: true,
  format: "iife",
  jsx: "automatic",
  write: false,
  define: { "process.env.NODE_ENV": '"production"' },
  loader: { ".css": "text", ".svg": "text" },
  target: "es2020",
});
const js = out.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
const dialCss = readFileSync("node_modules/dialkit/dist/styles.css", "utf8").replace(/@import[^;]+;/, "");
const agx = await scopedAgentsCss();
const embed = readFileSync("src/agents-embed.css", "utf8");
const shell = readFileSync("src/shell.html", "utf8").replace("__BACKDROP__", "").replace("</style>", "\n/* Agents, inside North */\n" + agx + "\n" + embed + "\n</style>");
const html = shell.replace("</style>", "</style>\n<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Caveat:wght@500;700&display=swap\">\n<style>" + dialCss + "</style>")
  + `\n<script>${js}</script>\n`;
mkdirSync("dist", { recursive: true });
writeFileSync("dist/north-home.html", html);
console.log("bytes", html.length);
