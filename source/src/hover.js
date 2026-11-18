// One hover, everywhere: the sidebar's highlight. A soft pill opens sideways out of the point the pointer came in at,
// corners round the whole way, and fades when you leave. Any row or menu item matching HOV gets it, so new lists inherit it
// without wiring. Timing comes from the dials (Hover → "Sidebar highlight grow from cursor").
const HOV = [
  ".dd-m button", ".rc-addm button", ".ag-dl-m button", ".ch-menu button", ".cd-menu button",
  ".rl3-rd", ".rl3-dr", ".job-fly .jf-x", ".job-fly .jf-row", ".sv-r", ".pg .rl3-ag", ".lv2-r", ".cm-r", ".cc-back", ".ag-dl-b button", ".ch-jref", ".rt-b:not(.is-pri)", ".rt-row", ".fcard-s", ".fl-r", ".list-surface > .row", ".fd-sum", ".fd-mv-r",
  ".sl-r", ".pop-row", ".mo-row", ".arrc-go", ".rail-fly:not(.job-fly) li", ".ch-index-panel li", ".gc-pop button", ".wl-main", ".nl-a", ".hd-h", ".am-dd-m > button",
  ".rail-cat", ".tb-crumbs button", ".ag-sug button", ".chs-new", ".am-dd-b", ".fd-piece.is-open", ".ms-pick-m button", ".ms-cu-r", ".fd-sum-h", ".nb-here", ".chs-sub button", ".chs-n button", ".sl-t", ".fm-back", "button.rx-run-b", ".fl2-r", ".nl-b", ".pk-now", ".pk-s.has-work .pk-sr", ".mg-dd-m > button", "button.acct", ".mg-kinds button", ".mg-more", ".mg-ev", ".mg-chip", // (chat lists and agent job rows already carry it in React)
].join(", ");
const SEED = 18;
const glide = () => {
  const g = (typeof window !== "undefined" && window.__northGlide) || null;
  const d = g && g.type === "easing" ? g.duration : 0.5, e = g && g.type === "easing" && g.ease ? g.ease : [0.32, 0.72, 0, 1];
  return { duration: d * 1000, easing: `cubic-bezier(${e.join(",")})` };
};

function enter(el, ev) {
  if (el.classList.contains("is-on") || el.classList.contains("is-sel") || (el.classList.contains("is-open") && !el.matches(".fd-piece")) || /* a piece's is-open means it can open */ el.querySelector(":scope > .chs-hover")) return;
  el.classList.add("hv-host");
  let f = el.querySelector(":scope > .hv-fill");
  if (f) { f.getAnimations().forEach((a) => a.cancel()); } else { f = document.createElement("span"); f.className = "hv-fill"; el.prepend(f); }
  const r = el.getBoundingClientRect(), x = Math.max(0, Math.min(r.width, ev.clientX - r.left));
  const l = Math.max(0, Math.min(r.width - SEED, x - SEED / 2)), rr = r.width - l - SEED, t = glide();
  f.animate([{ left: `${l}px`, right: `${rr}px`, top: "5px", bottom: "5px" }, { left: "0px", right: "0px", top: "0px", bottom: "0px" }], { duration: t.duration, easing: t.easing, fill: "forwards" });
  f.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "linear", fill: "forwards" });
}
function leave(el) {
  const f = el.querySelector(":scope > .hv-fill"); if (!f) return;
  const a = f.animate([{ opacity: getComputedStyle(f).opacity }, { opacity: 0 }], { duration: 250, easing: "cubic-bezier(.4,0,1,1)", fill: "forwards" });
  a.onfinish = () => { if (!el.matches(":hover")) f.remove(); };
}

let on = false;
export function installHover() {
  if (on || typeof document === "undefined") return; on = true;
  document.addEventListener("pointerover", (e) => { if (e.pointerType === "touch") return; const el = e.target.closest && e.target.closest(HOV); if (!el || el.contains(e.relatedTarget)) return; enter(el, e); }, true);
  document.addEventListener("pointerout", (e) => { const el = e.target.closest && e.target.closest(HOV); if (!el || el.contains(e.relatedTarget)) return; leave(el); }, true);
}
