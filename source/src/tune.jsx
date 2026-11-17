// Tuning layer over DialKit.
//  · D shows / hides the dials and the timeline. Hidden by default, remembered per browser — so anyone you share the
//    prototype with sees just the product, and you see your tools.
//  · T (with the dials on) = "tune an element": hover outlines anything that has dials, click it and the panel narrows to
//    only those dials (folders opened, scrolled to the top). Esc or "Show all" brings the full panel back.
//  · Space (with the dials on, not typing) plays / pauses the page intro; at the end it replays from the start.
//  · The panel always stops above the timeline, so the play controls are never covered.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TimelineStore } from "dialkit";

const KEY = "north.dials";
const read = () => false; // every load (and every shared link) opens without the dials; D brings them up for this session
const write = () => {};
const norm = (s) => (s || "").replace(/\s+/g, "").toLowerCase();
const typingIn = () => { const a = document.activeElement; return a && (a.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); };
const inDials = (el) => el && el.closest && el.closest('[class*="dialkit"], .tune-ui');

// what each control row is called, as DialKit renders it
const ITEM = ".dialkit-folder:not(.dialkit-folder-root), .dialkit-slider-wrapper, .dialkit-labeled-control, .dialkit-button";
const labelOf = (el) => {
  if (el.matches(".dialkit-folder")) { const t = el.querySelector(":scope > .dialkit-folder-header .dialkit-folder-title"); return t ? t.textContent : ""; }
  const t = el.querySelector(".dialkit-slider-label, .dialkit-labeled-control-label");
  return t ? t.textContent : el.textContent;
};

export function TuneLayer({ targets, folders = new Set(), introId, onReplay }) {
  const [on, setOn] = useState(read);
  const [inspect, setInspect] = useState(false);
  const [focus, setFocus] = useState(null); // { name, keys: Set(normalised labels) }
  const [box, setBox] = useState(null); // hovered element while inspecting: { rect, name, n }
  const sels = useRef([]);
  // selector → the dial labels that move it
  useEffect(() => {
    const m = new Map();
    for (const [label, sel] of Object.entries(targets)) { if (!m.has(sel)) m.set(sel, []); m.get(sel).push(label); }
    sels.current = [...m.entries()];
  }, [targets]);

  useEffect(() => { document.documentElement.classList.toggle("dials-off", !on); write(on); if (!on) { setInspect(false); setFocus(null); } }, [on]);
  useEffect(() => { document.documentElement.classList.toggle("dial-inspect", inspect); if (!inspect) setBox(null); }, [inspect]);

  // the innermost thing under the pointer that some dial moves, and which dials those are
  const hit = (el) => {
    for (let x = el; x && x !== document.body; x = x.parentElement) {
      if (inDials(x)) return null;
      const keys = []; let name = "";
      for (const [sel, labels] of sels.current) { try { if (x.matches(sel)) { keys.push(...labels); name = name || labels.find((l) => folders.has(l)) || ""; } } catch (e) {} }
      if (keys.length && !name) name = keys[0];
      if (keys.length) return { el: x, keys, name };
    }
    return null;
  };

  // keys
  const dT = useRef(null), dK = useRef("d");
  useEffect(() => {
    const down = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typingIn()) return;
      // a lone D toggles the dials. D followed by more letters is someone starting to type ("demos…"): it goes to the chat
      if (dT.current) { clearTimeout(dT.current); dT.current = null; if (e.key.length === 1) { e.preventDefault(); e.stopPropagation(); window.__northType ? window.__northType(dK.current + e.key) : null; return; } }
      if ((e.key === "d" || e.key === "D") && !on) { e.preventDefault(); e.stopPropagation(); dK.current = e.key; dT.current = setTimeout(() => { dT.current = null; setOn(true); }, 260); return; }
      if (e.key === "d" || e.key === "D") { e.preventDefault(); e.stopPropagation(); setOn(false); return; }
      if (!on) return;
      if (e.key === "t" || e.key === "T") { e.preventDefault(); e.stopPropagation(); setInspect((v) => !v); return; }
      if (e.key === "Escape" && (inspect || focus)) { e.preventDefault(); e.stopPropagation(); setInspect(false); setFocus(null); return; }
      if (e.code === "Space" && !document.documentElement.classList.contains("chat-open")) {
        // with the dials on, Space drives the timeline instead of scrolling / talking
        e.preventDefault(); e.stopPropagation();
        if (e.repeat) return;
        const tr = TimelineStore.getTransport(introId);
        if (tr && tr.playing) TimelineStore.pause(introId);
        else if (!tr || tr.time >= tr.duration - 0.02) onReplay();
        else TimelineStore.play(introId);
      }
    };
    const up = (e) => { if (on && e.code === "Space" && !typingIn() && !document.documentElement.classList.contains("chat-open")) e.stopPropagation(); };
    window.addEventListener("keydown", down, true); window.addEventListener("keyup", up, true);
    return () => { window.removeEventListener("keydown", down, true); window.removeEventListener("keyup", up, true); };
  }, [on, inspect, focus, introId, onReplay]);

  // inspecting: outline what's under the pointer; click to tune it
  useEffect(() => {
    if (!inspect) return;
    let raf = 0, cur = null;
    const move = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        cur = hit(e.target);
        setBox(cur ? { rect: cur.el.getBoundingClientRect(), name: cur.name, n: cur.keys.length } : null);
      });
    };
    const click = (e) => {
      if (inDials(e.target)) return;
      e.preventDefault(); e.stopPropagation();
      const h = hit(e.target); if (!h) return;
      setFocus({ name: h.name, keys: new Set(h.keys.map(norm)) });
      setInspect(false);
    };
    const swallow = (e) => { if (!inDials(e.target)) { e.preventDefault(); e.stopPropagation(); } };
    document.addEventListener("pointermove", move, true);
    document.addEventListener("click", click, true);
    for (const t of ["pointerdown", "mousedown", "pointerup", "mouseup"]) document.addEventListener(t, swallow, true);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("pointermove", move, true); document.removeEventListener("click", click, true); for (const t of ["pointerdown", "mousedown", "pointerup", "mouseup"]) document.removeEventListener(t, swallow, true); };
  }, [inspect]);

  // focus: narrow the panel to the dials that move the clicked thing
  useEffect(() => {
    const panel = () => document.querySelector(".dialkit-panel");
    const reset = () => { document.querySelectorAll(".tune-hide, .tune-path").forEach((x) => x.classList.remove("tune-hide", "tune-path")); document.documentElement.classList.remove("dial-focused"); };
    reset();
    if (!focus) return;
    const apply = () => {
      const p = panel(); if (!p) return;
      // open the panel if it's folded
      if (p.getBoundingClientRect().height < 90) p.querySelector(".dialkit-panel-header")?.click();
      const items = [...p.querySelectorAll(ITEM)].filter((x) => !x.closest(".dialkit-versions-host"));
      const keep = new Set();
      for (const it of items) if (focus.keys.has(norm(labelOf(it)))) {
        keep.add(it); it.querySelectorAll(ITEM).forEach((c) => keep.add(c));
        for (let a = it.parentElement && it.parentElement.closest(ITEM); a; a = a.parentElement && a.parentElement.closest(ITEM)) { a.classList.add("tune-path"); keep.add(a); }
      }
      for (const it of items) if (!keep.has(it)) it.classList.add("tune-hide");
      // open the folders on the way to (and the top level of) what's kept
      for (const it of items) if (keep.has(it) && it.matches(".dialkit-folder") && !it.closest(".tune-hide")) {
        const c = it.querySelector(":scope > .dialkit-folder-content");
        const isLeafControl = !!it.querySelector(":scope > .dialkit-folder-content .dialkit-easing, :scope > .dialkit-folder-content [class*='visualization']");
        if (c && c.getBoundingClientRect().height < 2 && (it.classList.contains("tune-path") || !isLeafControl)) it.querySelector(":scope > .dialkit-folder-header")?.click();
      }
      document.documentElement.classList.add("dial-focused");
      p.querySelector(".dialkit-panel-inner")?.scrollTo({ top: 0 });
    };
    const t1 = setTimeout(apply, 30), t2 = setTimeout(apply, 380); // second pass once opened folders have laid out
    return () => { clearTimeout(t1); clearTimeout(t2); reset(); };
  }, [focus]);

  if (!on) return null;
  return createPortal(
    <>
      {inspect && box && (
        <div className="tune-ui tune-box" style={{ left: box.rect.left - 3, top: box.rect.top - 3, width: box.rect.width + 6, height: box.rect.height + 6 }}>
          <span>{box.name}{box.n > 1 ? ` · ${box.n} dials` : ""}</span>
        </div>
      )}
      <div className="tune-ui tune-bar">
        {focus ? (
          <>
            <span className="tune-on">Tuning <b>{focus.name}</b></span>
            <button onClick={() => setFocus(null)}>Show all <kbd>Esc</kbd></button>
          </>
        ) : (
          <button className={inspect ? "is-on" : ""} onClick={() => setInspect((v) => !v)}>{inspect ? "Click anything to tune it" : "Tune an element"} <kbd>T</kbd></button>
        )}
        <span className="tune-hint"><kbd>Space</kbd> play · <kbd>D</kbd> hide</span>
      </div>
    </>,
    document.body,
  );
}
