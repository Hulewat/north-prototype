// Felix's voice orb, ported to plain WebGL (no three.js): the same vertex folds and the same lit, glossy, translucent
// shading, with Felix's saved settings. One renderer draws each agent once per frame into a tile; every orb on the
// page copies its agent's tile into its own small canvas, so dozens of orbs cost three draws.
export const ORB_VERT = `attribute vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

  uniform float uTime;
  uniform float uNoiseScale;
  uniform float uShape;
  uniform float uShapeScale;
  uniform float uFold;
  uniform float uRelief;
  uniform float uFoldShape;
  uniform float uDetail;
  uniform float uWarp;
  uniform float uBreath;
  uniform vec3 uFlowDir;
  uniform float uFlowSpeed;
  uniform float uRipplePhase;
  uniform float uPulseAmp;
  uniform float uPulseFalloff;
  uniform float uPulseRings;
  uniform float uPulseExtrude;
  uniform float uTalkWarp;
  uniform float uTalkNoiseScale;
  uniform float uTalkFoldShape;
  uniform float uTalkDetail;
  uniform float uTalkShape;
  uniform float uTalkShapeScale;
  uniform float uFoldFreq;
  uniform float uRippleFreq;
  uniform vec3 uRippleAxis;
  uniform float uTalk;
  uniform float uLevel;
  uniform float uBuild;
  uniform float uReact;

  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying float vNdcY;
  varying float vDisp;
  varying float vTalk;
  varying float vAO;

  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;
    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 1.0/7.0;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // One UNIFIED orb: the idle folds are always the base. Talking ADDS a centre
  // pulse on top (it doesn't swap to a different pattern). reliefMul = 1.0 for the
  // shading normal, uRelief for the actual geometry, so it all lives on a sphere.
  float field(vec3 dir, float reliefMul){
    vec3 nd = normalize(dir);
    vec3 p = nd * uNoiseScale;
    float t = uTime;

    float shape = snoise(p * uShapeScale + normalize(uFlowDir) * t * 0.07);
    float wig = uWarp * 0.28 * snoise(p * 0.5 + vec3(0.0, 0.0, t * 0.1));

    // BASE: the idle folds — always present, the same in both states
    float idlePhase = (dot(nd, normalize(uRippleAxis)) + wig) * uFoldFreq + t * uFlowSpeed;
    float iw = sin(idlePhase * 3.14159265);
    float iw2 = sin(idlePhase * 3.14159265 * 2.3);
    float idleVal = sign(iw) * pow(abs(iw), uFoldShape)
                  + sign(iw2) * pow(abs(iw2), uFoldShape) * uDetail * 0.5;
    float baseHeight = idleVal * uFold;

    // TALK is handled separately (talkRipple) so it stays FLAT — it shows through the
    // COLOUR gradient, not as a 3D fold. field() is idle folds only.
    return shape * uShape + baseHeight * reliefMul;
  }

  // FLAT talk ripple (view-space). Returns the amp-scaled ripple height. WAVES roll out
  // from an off-centre ring (no bullseye), organic & morphing (domain-warped, speed =
  // his pace). Used mainly to push the COLOUR gradient (an ElevenLabs-style flat colour
  // ripple) plus only a faint shading bump — so it's NOT a raised 3D fold.
  float talkRipple(vec3 nd){
    vec3 vdir = normalize((modelViewMatrix * vec4(nd, 0.0)).xyz);
    float facing = smoothstep(0.0, 0.7, vdir.z);
    vec2 vp = vdir.xy;
    float prad = length(vp);
    vec2 warp2 = vec2(snoise(vec3(vp * 1.5, uRipplePhase * 0.5 + 3.0)),
                      snoise(vec3(vp * 1.5, uRipplePhase * 0.5 + 9.0)));
    vec2 wp = vp + warp2 * (0.10 + uTalkWarp * 0.16);   // WARP -> organic, morphing
    float rwarp = length(wp) + snoise(vec3(vp * 3.0, uRipplePhase * 0.8)) * uTalkWarp * 0.05;
    float w = sin(rwarp * uPulseRings * 3.14159 - uRipplePhase);  // outward organic rings
    float wave = sign(w) * pow(abs(w), 0.5 + uTalkFoldShape * 0.16);
    float centerFade = smoothstep(0.22, 0.5, prad);     // off-centre origin (no nipple)
    float rimFade = smoothstep(1.0, 0.8, prad);
    float amp = uBuild * (0.5 + uReact);                 // per-word pulse, fades off
    return wave * centerFade * rimFade * facing * amp * uTalk; // clean signal (scaled in main/frag)
  }

  void main(){
    vec3 dir = normalize(position);
    // idle breathing + a SUBTLE talk scale: the orb eases ~2% bigger while talking and
    // breathes a touch with the voice, so idle vs talking reads even before the ripple.
    // NO talk scale — the whole orb does not inflate/breathe with the voice (that read
    // as an independent scale up/down). Only the waves move. (idle breath only.)
    float br = 1.0 + uBreath;

    vec3 t1 = normalize(cross(dir, vec3(0.0, 1.0, 0.0) + vec3(0.0001)));
    vec3 t2 = normalize(cross(dir, t1));
    float eps = 0.025;

    float tr = talkRipple(dir);
    float talkN = uPulseExtrude * uPulseAmp * 0.9;  // FAINT talk shading (Fold x rippleDepth), stays flat

    // GEOMETRY: clean round sphere — talk does NOT lump the silhouette (stays a sphere)
    vec3 displaced = dir * (1.0 + field(dir, uRelief)) * br;

    // NORMAL (shading): idle folds at full depth + only a FAINT talk bump (so the talk
    // ripple reads flat; its main expression is the colour gradient, not 3D shading)
    float h0 = field(dir, 1.0) + tr * talkN;
    float ha = field(dir + t1 * eps, 1.0) + talkRipple(normalize(dir + t1 * eps)) * talkN;
    float hb = field(dir + t2 * eps, 1.0) + talkRipple(normalize(dir + t2 * eps)) * talkN;
    vec3 vp0 = dir * (1.0 + h0);
    vec3 vpa = normalize(dir + t1 * eps) * (1.0 + ha);
    vec3 vpb = normalize(dir + t2 * eps) * (1.0 + hb);
    vec3 n = normalize(cross(vpa - vp0, vpb - vp0));
    if (dot(n, dir) < 0.0) n = -n;

    float ew = 0.12;
    float ga = field(dir + t1 * ew, 1.0);
    float gb = field(dir + t2 * ew, 1.0);
    float ga2 = field(dir - t1 * ew, 1.0);
    float gb2 = field(dir - t2 * ew, 1.0);
    vAO = (ga + gb + ga2 + gb2) - 4.0 * h0;

    vDisp = h0;
    vTalk = tr;                     // flat talk ripple -> pushes the colour gradient
    vNormal = normalMatrix * n;
    vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
    vViewPos = mv.xyz;
    vec4 clip = projectionMatrix * mv;
    vNdcY = clip.y / clip.w;
    gl_Position = clip;
  }
`;
export const ORB_FRAG = `
  precision highp float;

  uniform vec3 uColTop;
  uniform vec3 uColMid;
  uniform vec3 uColBottom;
  uniform vec3 uBackTop;
  uniform vec3 uBackMid;
  uniform vec3 uBackBottom;
  uniform float uTwoTone;
  uniform float uColorMove;
  uniform float uPulseAmp;
  uniform float uColorDrift;
  uniform float uLevel;
  uniform float uTalk;
  uniform float uHighlight;
  uniform float uRimIntensity;
  uniform float uFresnelPower;
  uniform float uCoreBrightness;
  uniform float uCoreTightness;
  uniform float uShimmer;
  uniform float uShading;
  uniform float uAO;
  uniform float uShine;
  uniform float uGloss;
  uniform float uTranslucency;
  uniform float uGrain;
  uniform float uTime;
  uniform vec3 uLightDir;

  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying float vNdcY;
  varying float vDisp;
  varying float vTalk;
  varying float vAO;

  vec3 ramp(vec3 lo, vec3 mid, vec3 hi, float y){
    return (y > 0.5)
      ? mix(mid, hi, smoothstep(0.5, 1.0, y))
      : mix(lo, mid, smoothstep(0.0, 0.5, y));
  }

  void main(){
    vec3 N = normalize(vNormal);
    vec3 V = normalize(-vViewPos);
    float ndv = clamp(dot(N, V), 0.0, 1.0);
    float fres = pow(1.0 - ndv, uFresnelPower);

    // the FOLDS push the gradient: the displacement field offsets the colour
    // coordinate, so the hue travels with the waves (along the flow / ripples)
    // gradient flows with the surface (the talking pulse is in vDisp, so it
    // pushes the colour outward automatically via uColorMove)
    // the FLAT talk ripple (vTalk) shifts the colour gradient strongly -> a soft colour
    // ripple (ElevenLabs), while the idle folds push it gently via vDisp.
    float yy = clamp(vNdcY * 0.5 + 0.5 + vDisp * uColorMove + vTalk * uColorMove * uPulseAmp * 9.0 + uColorDrift, 0.0, 1.0);
    vec3 frontC = ramp(uColBottom, uColMid, uColTop, yy);
    vec3 backC  = ramp(uBackBottom, uBackMid, uBackTop, yy);

    float silk = smoothstep(0.0, 0.85, 1.0 - ndv) * uTwoTone;
    vec3 base = mix(frontC, backC, silk);

    vec3 L = normalize(uLightDir);
    float lambert = clamp(dot(N, L), 0.0, 1.0);
    float lighting = (1.0 - uShading) + uShading * lambert;
    float crease = clamp(vAO * uAO, 0.0, 1.0);
    float bright = clamp(lighting * (1.0 - crease * 0.5), 0.0, 1.0);

    vec3 shadowCol = base * base * 0.9;
    vec3 lightCol = mix(base, vec3(1.0), 0.7);
    vec3 col = (bright < 0.5)
      ? mix(shadowCol, base, smoothstep(0.0, 0.5, bright))
      : mix(base, lightCol, smoothstep(0.5, 1.0, bright));

    vec3 H = normalize(L + V);
    float ndh = clamp(dot(N, H), 0.0, 1.0);
    float glossHi = pow(ndh, uGloss);
    float sheen = pow(ndh, uGloss * 0.22);
    col += vec3(1.0) * (glossHi * uShine + sheen * uShine * 0.28);
    col += lightCol * fres * 0.16;

    float core = clamp(pow(ndv, uCoreTightness) * uCoreBrightness, 0.0, 1.0);
    col = mix(col, lightCol, core);
    col = mix(col, base, clamp(fres * uRimIntensity, 0.0, 1.0) * 0.35);
    col += base * (vDisp * 0.5 + 0.5) * uShimmer;

    // (talking does NOT brighten the orb — the ripple shows by MOVING the colour
    //  gradient, not by adding light; keeps it from blowing out)

    // ---- translucency: light scatters through thin edges and the raised folds,
    // giving inner depth (waxy/jade), and the silhouette softens so it reads as
    // a translucent body rather than a solid ball of clay ----
    float thinness = fres;                          // grazing edges read as thin
    float foldLift = clamp(vDisp * 0.5 + 0.5, 0.0, 1.0); // raised folds let light through
    float wrap = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
    float sss = uTranslucency * (thinness * 0.7 + foldLift * 0.35) * (0.45 + 0.55 * wrap);
    col += lightCol * sss * 0.7;

    // a touch of real transparency, strongest at the grazing rim (idle look only —
    // talking does NOT change the orb's transparency/brightness)
    float alpha = 1.0 - uTranslucency * 0.45 * smoothstep(0.45, 1.0, fres);
    alpha = clamp(alpha, 0.0, 1.0);

    // subtle film grain — soft, slightly powdery texture (matches the reference)
    float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + floor(uTime * 24.0)) * 43758.5453);
    col += (g - 0.5) * uGrain;

    gl_FragColor = vec4(col, alpha);
  }
`;
