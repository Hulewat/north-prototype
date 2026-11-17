// The agents' orbs, rendered for real: Felix's voice-orb shader (orb-shaders.js) on a sphere, in WebGL.
// One hidden GL canvas draws each agent's orb once per frame into its own tile; every <canvas> orb on the page
// copies its agent's tile, so the cost stays at three small draws however many orbs are showing.
import { ORB_VERT, ORB_FRAG } from "./orb-shaders.js";

// Felix's saved settings (felix-event-demo /api/orb-config). Fia and Orin keep the same form and light, in their own hues.
const FORM = { noiseScale: 1.5765, shape: 0, shapeScale: 0.3, fold: 0.3683, foldShape: 2.4095, warp: 1.1606, detail: 0.7976, rotationSpeed: 0.2363 };
const VOICE = { idleAngle: 333.79, idleFreq: 0.3, idleSpeed: 0 };
const LOOK = { twoTone: 0.5109, colorMove: 0.1535, rimIntensity: 3, fresnelPower: 4.7128, shimmer: 0.2005, shading: 1, ao: 2.18, coreBrightness: 0.81, coreTightness: 8, shine: 0.4662, gloss: 200, translucency: 0.5227, grain: 0.0188, relief: 0.099 };
export const ORB_HUES = {
  felix: { top: 355.6, mid: 286.7, bottom: 226.8, back: -29.8, sat: 0.742, light: 0.66 }, // Felix's own
  fia: { top: 30, mid: 14, bottom: 350, back: 14, sat: 0.66, light: 0.74 },           // peach → coral → rose
  orin: { top: 262, mid: 240, bottom: 206, back: -24, sat: 0.72, light: 0.7 },          // lavender → periwinkle → sky
};

// three.js Color.setHSL: an sRGB colour stored linear (the shader writes it out as-is, which is what gives the orb its depth)
function hsl(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  const f = (n) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0), f(8), f(4)]; // as sRGB, like the reference renders it
}
const norm = (v) => { const l = Math.hypot(...v) || 1; return v.map((x) => x / l); };

function sphere(seg = 96, rings = 64) {
  const p = [], idx = [];
  for (let r = 0; r <= rings; r++) { const th = (r / rings) * Math.PI;
    for (let s = 0; s <= seg; s++) { const ph = (s / seg) * Math.PI * 2; p.push(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)); } }
  for (let r = 0; r < rings; r++) for (let s = 0; s < seg; s++) { const a = r * (seg + 1) + s, b = a + seg + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  return { p: new Float32Array(p), i: new Uint16Array(idx) };
}
// column-major 4x4 helpers
const mul = (a, b) => { const o = new Array(16).fill(0); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) o[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k]; return o; };
const rx = (t) => [1, 0, 0, 0, 0, Math.cos(t), Math.sin(t), 0, 0, -Math.sin(t), Math.cos(t), 0, 0, 0, 0, 1];
const ry = (t) => [Math.cos(t), 0, -Math.sin(t), 0, 0, 1, 0, 0, Math.sin(t), 0, Math.cos(t), 0, 0, 0, 0, 1];
const tz = (z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1];
const persp = (fov, near, far) => { const f = 1 / Math.tan(fov / 2), nf = 1 / (near - far); return [f, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]; };

let R = null; // the renderer, made on first use
const live = new Set(); // every mounted orb canvas
const IDS = ["fia", "orin", "felix"], TILE = 160;
const reduced = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function make() {
  const cv = document.createElement("canvas"); cv.width = TILE * IDS.length; cv.height = TILE;
  const gl = cv.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: true, preserveDrawingBuffer: true });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; };
  const vs = sh(gl.VERTEX_SHADER, ORB_VERT), fs = sh(gl.FRAGMENT_SHADER, ORB_FRAG); if (!vs || !fs) return null;
  const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(pr)); return null; }
  gl.useProgram(pr);
  const g = sphere(), vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, g.p, gl.STATIC_DRAW);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g.i, gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, "position"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
  const U = {}; const u = (n) => (U[n] ??= gl.getUniformLocation(pr, n));
  const f1 = (n, v) => gl.uniform1f(u(n), v), f3 = (n, v) => gl.uniform3fv(u(n), v);
  // the fixed look: Felix's form and light, idle (not talking)
  f1("uNoiseScale", FORM.noiseScale); f1("uShape", FORM.shape); f1("uShapeScale", FORM.shapeScale); f1("uFold", FORM.fold); f1("uFoldShape", FORM.foldShape);
  f1("uWarp", FORM.warp); f1("uDetail", FORM.detail); f1("uRelief", LOOK.relief); f1("uBreath", 0);
  const A = (VOICE.idleAngle * Math.PI) / 180; f3("uFlowDir", norm([Math.cos(A), Math.sin(A), 0.3])); f3("uRippleAxis", norm([Math.sin(A) * 0.8, Math.cos(A) * 0.8, 0.5]));
  f1("uFlowSpeed", VOICE.idleSpeed); f1("uFoldFreq", VOICE.idleFreq); f1("uTalk", 0); f1("uBuild", 0); f1("uPulseAmp", 0.088); f1("uPulseExtrude", 0.165); f1("uPulseRings", 1.8); f1("uTalkWarp", 0); f1("uTalkFoldShape", 5.2); f1("uReact", 0);
  f1("uTwoTone", LOOK.twoTone); f1("uColorMove", LOOK.colorMove); f1("uColorDrift", 0); f1("uRimIntensity", LOOK.rimIntensity); f1("uFresnelPower", LOOK.fresnelPower);
  f1("uShimmer", LOOK.shimmer); f1("uShading", LOOK.shading); f1("uAO", LOOK.ao); f1("uCoreBrightness", LOOK.coreBrightness); f1("uCoreTightness", LOOK.coreTightness);
  f1("uShine", LOOK.shine); f1("uGloss", LOOK.gloss); f1("uTranslucency", LOOK.translucency); f1("uGrain", LOOK.grain); f3("uLightDir", norm([-0.25, 0.6, 0.7]));
  gl.uniformMatrix4fv(u("projectionMatrix"), false, new Float32Array(persp((45 * Math.PI) / 180, 0.1, 100)));
  const cols = Object.fromEntries(IDS.map((id) => { const c = ORB_HUES[id], m = (h) => hsl(h, c.sat, c.light);
    return [id, { top: m(c.top), mid: m(c.mid), bot: m(c.bottom), bt: m(c.top + c.back), bm: m(c.mid + c.back), bb: m(c.bottom + c.back) }]; }));
  gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.enable(gl.CULL_FACE);
  const atlas = document.createElement("canvas"); atlas.width = cv.width; atlas.height = cv.height;
  return { cv, atlas, gl, u, f1, f3, cols, n: g.i.length, rot: { y: 0.6, x: 0.2 }, t: 0, last: 0, raf: 0 };
}

function draw(now) {
  const r = R; r.raf = 0;
  if (!live.size) return;
  const dt = r.last ? Math.min(0.1, (now - r.last) / 1000) : 0; r.last = now;
  if (!reduced) { r.t += dt; r.rot.y += dt * FORM.rotationSpeed; r.rot.x += dt * FORM.rotationSpeed * 0.3; }
  const { gl } = r; gl.clearColor(0, 0, 0, 0); gl.viewport(0, 0, r.cv.width, r.cv.height); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  r.f1("uTime", r.t);
  // camera pulled in so the sphere fills its tile, the way Felix's fills its stage
  const mv = mul(tz(-2.78), mul(rx(r.rot.x), ry(r.rot.y)));
  gl.uniformMatrix4fv(r.u("modelViewMatrix"), false, new Float32Array(mv));
  gl.uniformMatrix3fv(r.u("normalMatrix"), false, new Float32Array([mv[0], mv[1], mv[2], mv[4], mv[5], mv[6], mv[8], mv[9], mv[10]]));
  // full-screen chat covers the page: orbs under it (anything not in the chat or the sidebar rail) skip their frames
  const full = document.documentElement.classList.contains("chat-full");
  live.forEach((o) => { if (o.shown === undefined && o.cv.isConnected) o.shown = !!o.cv.closest(".chat-shell, .side, .rail-fly, .efly"); o.hid = full && !o.shown; });
  const want = new Set([...live].filter((o) => o.vis && !o.hid).map((o) => o.id));
  if (!want.size) { if (!reduced && !document.hidden) r.raf = requestAnimationFrame(draw); return; }
  IDS.forEach((id, k) => { if (!want.has(id)) return; const c = r.cols[id];
    gl.viewport(k * TILE, 0, TILE, TILE);
    r.f3("uColTop", c.top); r.f3("uColMid", c.mid); r.f3("uColBottom", c.bot); r.f3("uBackTop", c.bt); r.f3("uBackMid", c.bm); r.f3("uBackBottom", c.bb);
    gl.cullFace(gl.FRONT); gl.drawElements(gl.TRIANGLES, r.n, gl.UNSIGNED_SHORT, 0); // the far side first, seen through the thin edge
    gl.cullFace(gl.BACK); gl.drawElements(gl.TRIANGLES, r.n, gl.UNSIGNED_SHORT, 0); });
  // one copy out of WebGL per frame (into a 2D atlas), then every orb copies from the atlas: one GPU sync, not one per orb.
  // Orbs off screen are skipped; small ones (rail rows, chips) move at a quarter rate, which nobody can see at 12px.
  r.fr = (r.fr || 0) + 1;
  const ax = r.atlas.getContext("2d"); ax.clearRect(0, 0, r.atlas.width, r.atlas.height); ax.drawImage(r.cv, 0, 0);
  live.forEach((o) => { const k = IDS.indexOf(o.id); if (k < 0 || !o.vis || o.hid) return; if (o.small && o.drawn && r.fr % 4) return;
    const x = o.ctx || (o.ctx = o.cv.getContext("2d")); x.clearRect(0, 0, o.cv.width, o.cv.height); x.drawImage(r.atlas, k * TILE, 0, TILE, TILE, 0, 0, o.cv.width, o.cv.height); o.drawn = true; });
  if (!reduced && !document.hidden) r.raf = requestAnimationFrame(draw);
}
const kick = () => { if (R && !R.raf) R.raf = requestAnimationFrame(draw); };
if (typeof document !== "undefined") document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });

// mount one orb canvas; returns an unmount function, or null when WebGL isn't there (the SVG orb stays)
export function mountOrb(cv, id) {
  if (R === null) { try { R = make() || false; } catch (e) { R = false; } }
  if (!R) return null;
  const o = { cv, id, vis: true, small: (parseFloat(cv.style.width) || cv.width) <= 24 }; live.add(o); kick();
  // only orbs on screen are drawn
  let io = null; try { io = new IntersectionObserver((es) => { o.vis = es[es.length - 1].isIntersecting; if (o.vis) o.drawn = false; }); io.observe(cv); } catch (e) {}
  if (reduced) requestAnimationFrame(draw);
  return () => { live.delete(o); io && io.disconnect(); };
}
