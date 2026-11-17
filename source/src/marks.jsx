// North's marks (wordmark, Ask North, and North speaking on a page).
import React, { useMemo } from "react";
import NORTH_SVG from "./marks/north.svg";
export const NL_LIVE_S = 6; // one turn of the live gradient (s)
// North's marks. North = Seth's solid spoked mark with the arrow rising out of it (exactly as drawn in Figma, North · Logo page).
// Ask North = the North mark's top half (see below). Ids are made unique per use.
let nlId = 0;
export function NorthLogo({ size = 20, className = "", ask = false, live = false, light = false }) {
  const k = useMemo(() => `nl${++nlId}_`, []);
  const html = useMemo(() => {
    let h = NORTH_SVG.replace(/id="([^"]+)"/g, `id="${k}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${k}$1)`).replace(/width="24" height="24"/, `width="${size}" height="${size}"`);
    // live: every spoke shares one gradient that slowly turns, so the light travels round the mark (North is "thinking")
    if (live) h = h.replace(/fill="url\(#[^)]*paint[^)]*\)"/g, `fill="url(#${k}live)"`).replace("<defs>", `<defs><linearGradient id="${k}live" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse"><stop stop-color="#A9CBE6"/><stop offset=".45" stop-color="#4A86B2"/><stop offset="1" stop-color="#1F527C"/><animateTransform attributeName="gradientTransform" type="rotate" values="0 12 12;360 12 12" dur="${NL_LIVE_S}s" repeatCount="indefinite"/></linearGradient>`);
    return h;
  }, [k, size, live]);
  if (ask) return (
    // Ask North: the top half of the North mark (Seth, Figma 766:336793) — the north-facing spokes over the arrow's arch, a sunrise.
    // Drawn 2:1, so the viewBox drops it 4 units to sit on the icon's optical centre. On hover it rises a step.
    <svg className={`north-logo nl-ask ${className}`} width={size} height={size} viewBox="0 -4 24 24" fill="none" aria-hidden="true">
      <defs>
        <mask id={`${k}m`} style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="-4" width="24" height="28">
          <path d="M24 24H0V-4H24V24ZM2.87207 17.2812H21.126L12.0625 8.5L2.87207 17.2812Z" fill="#D9D9D9" />
        </mask>
        <linearGradient id={`${k}g`} x1="2.81788" y1="1.81788" x2="21.892" y2="23.1546" gradientUnits="userSpaceOnUse">
          {light ? <><stop stopColor="#E6F0F8" /><stop offset=".5" stopColor="#B9D3E8" /><stop offset="1" stopColor="#8DB7D8" /></> : <><stop stopColor="#8DB7D8" /><stop offset=".5" stopColor="#4A86B2" /><stop offset="1" stopColor="#245D88" /></>}
        </linearGradient>
      </defs>
      <g mask={`url(#${k}m)`}><path className="nl-sun" d="M14 7.1709L17.2324 3.93945L20.0605 6.76758L16.8281 10H22V14H2V10H7.17188L3.93945 6.76758L6.76758 3.93945L10 7.1709V2H14V7.1709Z" fill={`url(#${k}g)`} /></g>
    </svg>
  );
  return <span className={`north-logo ${className}`} style={{ width: size, height: size }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}
