// A group of faces, everywhere in North: overlapped (each tucks under the one before by 45% of its size), five at most,
// then "+N" for the rest. One rule, so a chat list and a team page count people the same way.
// `fit` (px) is for a fixed face column (Home's rows, an open item's header): everyone is shown, no count, and the group
// tightens until it fits — never looser than 60% overlap, so two faces and four read as the same tight group.
import React from "react";
export function Stack({ ids, size = 24, face, max = 5, fit = 0, className = "", title }) {
  const list = [...new Set(ids)].filter(Boolean), shown = fit ? list : list.slice(0, max), more = list.length - shown.length;
  const step = fit && shown.length > 1 ? Math.min(size * 0.4, (fit - size) / (shown.length - 1)) : size * 0.55; // px each face adds
  return (
    <span className={`stk ${className}`} style={{ "--stk-o": `${-(size - step).toFixed(1)}px` }} title={title}>
      {shown.map((k, i) => <span key={k} className="stk-i" style={{ zIndex: shown.length - i }}>{face(k, size)}</span>)}
      {more > 0 && <span className="stk-more" style={{ height: size, minWidth: size, fontSize: Math.max(10, Math.round(size * 0.4)) }}>+{more}</span>}
    </span>
  );
}
