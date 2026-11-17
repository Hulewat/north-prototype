// The Agents workspace's styles, scoped under .agx so they can't touch the rest of North (and North's can be fenced off).
import { transform } from "esbuild";
import { readFileSync } from "fs";
export async function scopedAgentsCss() {
  let css = readFileSync("src/agents-concept.css", "utf8");
  const keep = [];
  css = css.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, (m) => { keep.push(m); return ""; }); // keyframes stay global
  css = css.replace(/(^|[},;\s])body(\.[\w-]+)*\s*\{[^{}]*\}/g, "$1"); // the page background is North's
  css = css.replace(/:root(?![\w-])/g, "&");
  const { code } = await transform(`.agx {\n${css}\n}`, { loader: "css", target: "chrome100" });
  return keep.join("\n") + "\n" + code;
}
