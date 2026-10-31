// Visual references for the safety calculators.
// Each entry takes the full set of values (inputs, the solved one, and the threshold-check
// value as "check" when there is one) and the on-screen width, and returns SVG markup
// (or null when the values can't be drawn).

const fmt = x => {
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e-3 && a < 1e7) return Number(x.toPrecision(4)).toLocaleString("en-US", { maximumFractionDigits: 3 });
  return x.toExponential(3);
};
const f1 = n => n.toFixed(1);
const text = (x, y, s, cls = "", anchor = "start") => `<text x="${f1(x)}" y="${f1(y)}" text-anchor="${anchor}" class="m-lbl ${cls}">${s}</text>`;
const rect = (x, y, w, h, attrs) => `<rect x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(0, w))}" height="${f1(Math.max(0, h))}" ${attrs}/>`;
const line = (x1, y1, x2, y2, attrs) => `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" ${attrs}/>`;
const ok = (...xs) => xs.every(x => Number.isFinite(x));

const widthOf = px => Math.max(320, Math.min(700, Math.round(px)));
const open = (W, H, label) => `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">
  <rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="#f8fafc"/>`;

// Two-line callout: a small caption over a bold value.
const callout = (x, y, cap, val, anchor = "start", color = "#15171c") =>
  `<text x="${f1(x)}" y="${f1(y - 2)}" text-anchor="${anchor}" class="m-lbl" style="font-size:11.5px;fill:#334155">${cap}</text>` +
  `<text x="${f1(x)}" y="${f1(y + 15)}" text-anchor="${anchor}" class="m-lbl m-bold" style="font-size:15px;fill:${color}">${val}</text>`;
const dot = (x, y, color) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="4.5" fill="${color}" stroke="#fff" stroke-width="2"/>`;
const leader = (x1, y1, x2, y2, color) => line(x1, y1, x2, y2, `stroke="${color}" stroke-width="1.5"`) + dot(x1, y1, color);

// Spreads label positions (sorted top to bottom) at least `gap` apart, keeping them within [lo, hi].
function spread(ys, gap, lo, hi) {
  const out = ys.slice();
  for (let i = 1; i < out.length; i++) out[i] = Math.max(out[i], out[i - 1] + gap);
  const over = out.length ? out[out.length - 1] - hi : 0;
  if (over > 0) for (let i = out.length - 1; i >= 0; i--) out[i] = i === out.length - 1 ? hi : Math.min(out[i], out[i + 1] - gap);
  if (out.length && out[0] < lo) { const d = lo - out[0]; for (let i = 0; i < out.length; i++) out[i] += d; }
  return out;
}

// Arrowhead pointing along the line from (x1, y1) to (x2, y2), drawn at (x2, y2).
const arrowHead = (x1, y1, x2, y2, color, size = 8) => {
  const a = Math.atan2(y2 - y1, x2 - x1), b = 0.45;
  const p = s => `${f1(x2 - size * Math.cos(a + s * b))},${f1(y2 - size * Math.sin(a + s * b))}`;
  return `<polygon points="${f1(x2)},${f1(y2)} ${p(1)} ${p(-1)}" fill="${color}"/>`;
};
const dimLine = (x1, y1, x2, y2, color, width = 1.5) =>
  line(x1, y1, x2, y2, `stroke="${color}" stroke-width="${width}"`) + arrowHead(x2, y2, x1, y1, color) + arrowHead(x1, y1, x2, y2, color);

// Worker in a harness, seen from the side. u = pixels from the D-ring to the feet.
// face = -1 faces left (D-ring on the right), +1 faces right. Returns the markup and the D-ring point.
function worker(xc, yFeet, u, face, fill) {
  const tw = 0.34 * u, yHip = yFeet - 0.5 * u, yD = yFeet - u, ySh = yFeet - 1.14 * u, r = 0.14 * u;
  const back = xc - face * tw / 2;
  let s = "";
  s += line(xc - 0.05 * u, yHip, xc - 0.07 * u + face * 0.04 * u, yFeet, `stroke="${fill}" stroke-width="${f1(0.13 * u)}" stroke-linecap="round"`);
  s += line(xc + 0.05 * u, yHip, xc + 0.09 * u + face * 0.04 * u, yFeet, `stroke="${fill}" stroke-width="${f1(0.13 * u)}" stroke-linecap="round"`);
  s += rect(xc - tw / 2, ySh, tw, yHip - ySh + 0.06 * u, `rx="${f1(0.12 * u)}" fill="${fill}"`);
  s += line(xc + face * 0.05 * u, ySh + 0.12 * u, xc + face * 0.3 * u, ySh + 0.5 * u, `stroke="${fill}" stroke-width="${f1(0.1 * u)}" stroke-linecap="round"`);
  s += `<circle cx="${f1(xc + face * 0.05 * u)}" cy="${f1(ySh - r - 0.03 * u)}" r="${f1(r)}" fill="${fill}"/>`;
  // Harness straps and the back D-ring.
  const strap = `stroke="#f97316" stroke-width="${f1(Math.max(1.5, 0.045 * u))}" stroke-linecap="round" fill="none"`;
  s += line(xc - tw / 2 + 2, ySh + 0.05 * u, xc + tw / 2 - 2, yHip - 0.08 * u, strap) + line(xc + tw / 2 - 2, ySh + 0.05 * u, xc - tw / 2 + 2, yHip - 0.08 * u, strap);
  s += line(xc - tw / 2, yHip, xc + tw / 2, yHip, strap);
  s += `<circle cx="${f1(back)}" cy="${f1(yD)}" r="${f1(Math.max(3, 0.05 * u))}" fill="#fff" stroke="#15171c" stroke-width="2"/>`;
  return { s, dx: back, dy: yD };
}

// ---------- Fall clearance: stacked distances below the anchor against the clearance available ----------
function fallClearance(v, w) {
  const W = widthOf(w), { LL, DD, DS, WH, SF, RC } = v, avail = v.check, has = ok(avail) && avail > 0, yA = 58;
  if (!ok(LL, DD, DS, WH, SF, RC) || [LL, DD, DS, WH, SF].some(x => x < 0) || WH <= 0 || RC <= 0) return null;
  // Vertical distances are to scale unless the clearance available is far more than needed.
  const clamped = has && avail > RC * 2.5;
  const span = Math.max(RC, has ? Math.min(avail, RC * 2.5) : 0) * 1.05;
  // Columns, left to right: standing worker and platform edge, hanging worker, clearance available,
  // the stack, its labels. The scale is the smaller of what fits the height and what fits the width.
  const Wc = Math.min(W, 500), ox = (W - Wc) / 2, bw = 26, fixed = 236;
  const px = Math.min(358 / span, (Wc - fixed) / (1.4 * WH)), Y = ft => yA + ft * px;
  const u = WH * px; // D-ring to feet, in pixels
  const slack = Wc - fixed - 1.4 * u;
  const xe = ox + 0.85 * u + 6 + slack * 0.5, xa = xe + 12 + slack * 0.15, xd = xa + 0.55 * u + 12;
  const xs = xd + 24 + slack * 0.1, lx = xs + bw + 30;
  const yMax = Y(span);
  const yG = has ? (clamped ? yMax : Y(avail)) : null;
  const short = has && avail < RC;

  // The required clearance, stacked from the anchor down.
  const segs = [
    ["Lanyard, LL", LL, "#bfdbfe", "#1d4ed8"],
    ["Deceleration, DD", DD, "#fde68a", "#d97706"],
    ["Harness stretch, DS", DS, "#e9d5ff", "#7c3aed"],
    ["D-ring to feet, WH", WH, "#99f6e4", "#0f766e"],
    ["Safety margin, SF", SF, "#bbf7d0", "#15803d"],
  ];
  let cum = 0, stack = "";
  const labels = [];
  for (const [cap, val, fill, stroke] of segs) {
    if (val > 0) {
      stack += rect(xs, Y(cum), bw, val * px, `fill="${fill}" stroke="${stroke}" stroke-width="1.2"`);
      labels.push({ y: Y(cum + val / 2), cap, val: `${fmt(val)} ft`, color: stroke });
    }
    cum += val;
  }
  if (short) stack += rect(xs - 4, yG, bw + 8, Y(RC) - yG, `fill="url(#hatch)" stroke="#b42318" stroke-dasharray="4 3"`);
  stack += line(xs - 4, yA, xs + bw + 4, yA, `stroke="#15171c" stroke-width="1.5"`);
  stack += line(xa - 0.6 * u, Y(RC), xs + bw + 8, Y(RC), `stroke="#15171c" stroke-width="1.5" stroke-dasharray="5 4"`);
  labels.push({ y: Y(RC), cap: "Required, RC", val: `${fmt(RC)} ft`, color: "#15171c", req: true });
  if (short) labels.push({ y: (yG + Y(RC)) / 2, cap: "Shortfall", val: `${fmt(RC - avail)} ft`, color: "#b42318", tc: "#b42318" });
  labels.sort((a, b) => a.y - b.y);
  const ly = spread(labels.map(l => l.y - 4), 36, yA + 6, Infinity);
  // Tall enough for the scaled distances and for the label column.
  const H = Math.max(360, yMax + 44, ly[ly.length - 1] + 46);

  let s = open(W, H, "Fall clearance below the anchor: lanyard, deceleration distance, harness stretch, D-ring to feet and safety margin, against the clearance available");
  s += `<defs><pattern id="hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="#b42318" stroke-width="2" opacity="0.5"/></pattern></defs>`;

  // Lower level.
  if (has) {
    s += rect(0, yG, W, H - yG, `fill="#d6d3d1"`) + line(0, yG, W, yG, `stroke="#78716c" stroke-width="2"`);
    s += text(8, yG + 18, "Lower level", "m-bold m-xs");
  }
  // Platform the worker stands on, with its edge, and the overhead beam with the anchor.
  const yP = Math.min(Y(WH * 1.5), has ? yG - 12 : yMax);
  s += rect(0, yP, xe, (has ? yG : H) - yP, `fill="#cbd5e1"`) + line(0, yP, xe, yP, `stroke="#64748b" stroke-width="3"`);
  s += line(xe, yP, xe, has ? yG : H, `stroke="#94a3b8" stroke-width="1.5"`);
  s += rect(xe - 26, yA - 16, xa - xe + 64, 14, `fill="#64748b"`) + rect(xe - 26, yA - 16, xa - xe + 64, 3, `fill="#94a3b8"`);
  s += `<circle cx="${f1(xa)}" cy="${f1(yA + 2)}" r="5" fill="none" stroke="#15171c" stroke-width="2.5"/>`;
  s += text(xa, yA - 24, "Anchor", "m-bold m-xs", "middle");

  // Before the fall: worker at the edge, lanyard slack up to the anchor.
  const stand = worker(xe - 0.32 * u, yP, u, -1, "#334155");
  s += `<path d="M${f1(stand.dx)},${f1(stand.dy)} Q${f1((stand.dx + xa) / 2)},${f1(Math.max(stand.dy, yA) + 0.5 * u)} ${f1(xa)},${f1(yA + 6)}" fill="none" stroke="#1d4ed8" stroke-width="2.5"/>`;
  s += stand.s;

  // After the arrest: lanyard extended, shock absorber deployed, harness stretched.
  const yLL = Y(LL), yDD = Y(LL + DD), yDS = Y(LL + DD + DS);
  s += line(xa, yA + 6, xa, yLL, `stroke="#1d4ed8" stroke-width="2.5"`);
  const zig = [];
  for (let i = 0, n = Math.max(2, Math.round((yDD - yLL) / 6)); i <= n; i++) zig.push(`${f1(xa + (i % 2 ? 5 : -5) * (i && i < n ? 1 : 0))},${f1(yLL + (yDD - yLL) * i / n)}`);
  if (DD > 0) s += `<polyline points="${zig.join(" ")}" fill="none" stroke="#d97706" stroke-width="2.5"/>`;
  s += line(xa, yDD, xa, yDS, `stroke="#7c3aed" stroke-width="2.5"`);
  const hang = worker(xa + 0.17 * u, yDS + u, u, 1, "#94a3b8");
  s += `<g opacity="0.9">${hang.s}</g>`;
  s += text(xa - 8, yDS + 0.5 * u, "After arrest", "m-muted m-xs", "end");

  // Clearance available, beside the stack.
  if (has) {
    const color = short ? "#b42318" : "#2e7d4f";
    s += dimLine(xd, yA, xd, yG, color, 2);
    const ym = yA + 10; // near the top, clear of the hanging worker
    s += `<text x="${f1(xd - 7)}" y="${f1(ym)}" text-anchor="end" transform="rotate(-90 ${f1(xd - 7)} ${f1(ym)})" class="m-lbl m-bold m-xs" style="fill:${color}">Available ${fmt(avail)} ft${clamped ? " (not to scale)" : ""}</text>`;
    if (clamped) s += line(xd - 6, yG - 26, xd + 6, yG - 32, `stroke="${color}" stroke-width="2"`) + line(xd - 6, yG - 20, xd + 6, yG - 26, `stroke="${color}" stroke-width="2"`);
  }

  s += stack;
  labels.forEach((l, i) => {
    s += l.req
      ? line(xs + bw + 8, l.y, lx - 6, ly[i] + 4, `stroke="#15171c" stroke-width="1.5" stroke-dasharray="5 4"`)
      : leader(xs + bw / 2, l.y, lx - 6, ly[i] + 4, l.color);
    s += callout(lx, ly[i], l.cap, l.val, "start", l.tc || "#15171c");
  });
  s += text(W - 10, H - 10, has ? "Distances below the anchor drawn to scale" : "Enter the clearance available to draw the lower level", "m-muted m-xs", "end");
  return s + "</svg>";
}

// ---------- Sling tension: two-leg bridle and how the tension grows as the angle drops ----------
// Rigging scene in a fixed 360 × 340 space.
function slingScene(v) {
  const { W: load, n, theta, T } = v;
  const cx = 180, yL = 222, t = Math.tan(theta * Math.PI / 180);
  const s = Math.max(10, Math.min(130, 170 / t)), h = Math.min(170, s * t), yH = yL - h;
  const half = Math.max(s + 26, 72);
  let g = "";
  // Hoist line, block and hook.
  g += line(cx, 0, cx, yH - 22, `stroke="#475569" stroke-width="3"`);
  g += rect(cx - 13, yH - 40, 26, 20, `rx="4" fill="#facc15" stroke="#a16207"`);
  g += `<path d="M${cx},${f1(yH - 20)} v8 a7,7 0 1 1 -7,7" fill="none" stroke="#475569" stroke-width="3.5" stroke-linecap="round"/>`;
  // Sling legs.
  const red = theta < 30;
  const legColor = red ? "#b42318" : "#1e3a8a";
  g += line(cx, yH - 5, cx - s, yL, `stroke="${legColor}" stroke-width="4" stroke-linecap="round"`);
  g += line(cx, yH - 5, cx + s, yL, `stroke="${legColor}" stroke-width="4" stroke-linecap="round"`);
  // Load.
  g += rect(cx - half, yL + 4, 2 * half, 56, `rx="3" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"`);
  for (const x of [cx - s, cx + s]) g += `<circle cx="${f1(x)}" cy="${yL}" r="5" fill="#fff" stroke="#475569" stroke-width="2.5"/>`;
  g += text(cx, yL + 37, `W = ${fmt(load)} lb`, "m-bold", "middle");
  g += line(cx, yL + 62, cx, yL + 98, `stroke="#b42318" stroke-width="3"`) + arrowHead(cx, yL + 62, cx, yL + 106, "#b42318", 10);
  // Sling angle, measured from the horizontal at the left lug.
  const ax = cx - s, r = 32, rad = theta * Math.PI / 180;
  g += line(ax, yL, ax + Math.min(54, 2 * s + 20), yL, `stroke="#64748b" stroke-width="1.2" stroke-dasharray="4 3"`);
  g += `<path d="M${f1(ax + r)},${yL} A${r},${r} 0 0 0 ${f1(ax + r * Math.cos(rad))},${f1(yL - r * Math.sin(rad))}" fill="none" stroke="#15171c" stroke-width="1.5"/>`;
  const la = rad / 2, lr = r + (theta < 30 ? 30 : 16);
  g += text(ax + lr * Math.cos(la) + (theta > 70 ? 6 : 0), yL - lr * Math.sin(la) + 5, `θ = ${fmt(theta)}°`, `m-bold m-xs${red ? " m-red" : ""}`, "start");
  // Leg tension.
  const mx = cx - s / 2, my = (yH + yL) / 2;
  // At shallow angles the legs lie low, so the label goes up beside the hoist line instead.
  const low = theta < 40;
  g += callout(low ? cx - 22 : Math.min(mx - 12, cx - 22), low ? yH - 52 : Math.min(my - 6, yL - 30), "Each leg, T", `${fmt(T)} lb`, "end", legColor);
  if (n !== 2) g += text(12, 22, `n = ${fmt(n)} legs (2 shown)`, "m-muted m-xs");
  return g;
}

// Tension per leg at common sling angles, with the entered angle highlighted.
function anglePanel(v, pw) {
  const { W: load, n, theta } = v;
  const angles = [...new Set([90, 60, 45, 30, Number(theta.toFixed(1))])].sort((a, b) => b - a);
  const tension = a => load / (n * Math.sin(a * Math.PI / 180));
  const max = Math.max(...angles.map(tension));
  const x0 = 16, lab = 46, x1 = pw - 16, barMax = Math.max(60, x1 - x0 - lab - 112);
  let s = text(x0, 28, "Tension per leg as the angle drops", "m-bold");
  angles.forEach((a, i) => {
    const y = 46 + i * 36, cur = Math.abs(a - theta) < 0.05, bad = a < 30, t = tension(a);
    const fill = bad ? "#f6c4bf" : cur ? "#1e3a8a" : "#bfdbfe";
    s += text(x0 + lab - 8, y + 16, `${fmt(a)}°`, cur ? "m-bold" : "m-muted", "end");
    s += rect(x0 + lab, y, barMax * t / max, 22, `rx="3" fill="${fill}"${bad ? ` stroke="#b42318"` : ""}`);
    s += text(x0 + lab + barMax * t / max + 6, y + 16, `${fmt(t)} lb (×${(1 / Math.sin(a * Math.PI / 180)).toFixed(3)})`, `m-xs${cur ? " m-bold" : ""}${bad ? " m-red" : ""}`);
  });
  const y = 46 + angles.length * 36 + 12;
  s += text(x0, y, "×: load angle factor, 1/sin θ.", "m-muted m-xs");
  s += text(x0, y + 15, "Below 30° (red) is not allowed by", "m-muted m-xs");
  s += text(x0, y + 30, "ASME B30.9 without approval.", "m-muted m-xs");
  return { s, h: y + 44 };
}

function slingTension(v, w) {
  const W = widthOf(w), { W: load, n, theta, T } = v;
  if (!ok(load, n, theta, T) || load <= 0 || n <= 0 || theta <= 0 || theta > 90) return null;
  const wide = W >= 640, k = wide ? 1 : Math.min(1, (W - 8) / 360), sceneH = 340 * k;
  const panel = anglePanel(v, wide ? W - 370 : W);
  const H = wide ? Math.max(350, panel.h + 60) : sceneH + panel.h;
  let s = open(W, H, "Load hanging from a crane hook by a two-leg sling, with the sling angle and leg tension, and a chart of leg tension at other angles");
  s += `<g transform="translate(${wide ? 0 : f1((W - 360 * k) / 2)},${wide ? 6 : 0}) scale(${k.toFixed(3)})">${slingScene(v)}</g>`;
  s += `<g transform="translate(${wide ? 370 : 0},${wide ? 40 : f1(sceneH)})">${panel.s}</g>`;
  return s + "</svg>";
}

// ---------- Center of gravity: parts on a skid, distances from the reference end ----------
function centerOfGravity(v, w) {
  const W = widthOf(w), { X } = v;
  const parts = [["W1", "X1"], ["W2", "X2"], ["W3", "X3"]]
    .map(([wk, xk], i) => ({ i: i + 1, w: v[wk], x: v[xk] }))
    .filter(p => ok(p.w, p.x) && p.w > 0);
  if (!ok(X) || !parts.length) return null;
  const lo = Math.min(0, X, ...parts.map(p => p.x)), hi = Math.max(X, ...parts.map(p => p.x));
  const len = (hi - lo) * 1.12 || 1;
  const x0 = 34, x1 = W - 34, Xp = ft => x0 + (x1 - x0) * (ft - lo) / len;
  const yB = 196, beamH = 14, wmax = Math.max(...parts.map(p => p.w));
  const rows = parts.length + 1, H = yB + beamH + 30 + rows * 30 + 26;
  const fills = [["#bfdbfe", "#1d4ed8"], ["#fde68a", "#b45309"], ["#bbf7d0", "#15803d"]];
  let s = open(W, H, "Parts on a beam with their distances from the reference end, and the combined center of gravity under the lifting hook");

  // Beam, with the reference end marked.
  s += rect(Xp(lo), yB, Xp(lo + len) - Xp(lo), beamH, `fill="#64748b"`) + rect(Xp(lo), yB, Xp(lo + len) - Xp(lo), 3, `fill="#94a3b8"`);
  s += line(Xp(0), yB - 6, Xp(0), H - 30, `stroke="#15171c" stroke-width="1.5" stroke-dasharray="4 3"`);
  s += text(Xp(0), H - 12, "Reference end (0 ft)", "m-bold m-xs", Xp(0) < 80 ? "start" : "middle");

  // Parts, sized by weight, with labels nudged apart where they crowd.
  const bwid = Math.max(30, Math.min(72, (x1 - x0) / 7));
  let lastX = -Infinity, lift = 0;
  [...parts].sort((a, b) => a.x - b.x).forEach(p => {
    const h = Math.max(22, 78 * Math.sqrt(p.w / wmax)), [fill, stroke] = fills[p.i - 1], xc = Xp(p.x);
    s += rect(xc - bwid / 2, yB - h, bwid, h, `rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1.5"`);
    s += text(xc, yB - h / 2 + 4, `W${p.i}`, "m-bold m-xs", "middle");
    lift = xc - lastX < 92 ? lift + 17 : 0;
    lastX = xc;
    s += text(xc, yB - h - 8 - lift, `${fmt(p.w)} lb`, "m-xs", "middle");
  });

  // Hook over the center of gravity.
  const xg = Xp(X), yg = yB + beamH / 2;
  s += line(xg, 0, xg, 30, `stroke="#475569" stroke-width="3"`);
  s += rect(xg - 12, 22, 24, 18, `rx="4" fill="#facc15" stroke="#a16207"`);
  s += `<path d="M${f1(xg)},40 v7 a6,6 0 1 1 -6,6" fill="none" stroke="#475569" stroke-width="3" stroke-linecap="round"/>`;
  s += line(xg, 60, xg, yg - 10, `stroke="#15171c" stroke-width="1.5" stroke-dasharray="6 4"`);
  s += `<circle cx="${f1(xg)}" cy="${f1(yg)}" r="10" fill="#fff" stroke="#15171c" stroke-width="2"/>`;
  s += `<path d="M${f1(xg)},${f1(yg - 10)} A10,10 0 0 1 ${f1(xg + 10)},${f1(yg)} L${f1(xg)},${f1(yg)} Z M${f1(xg)},${f1(yg + 10)} A10,10 0 0 1 ${f1(xg - 10)},${f1(yg)} L${f1(xg)},${f1(yg)} Z" fill="#15171c"/>`;
  const right = xg < W - 170;
  s += callout(xg + (right ? 14 : -14), 40, "Center of gravity, X", `${fmt(X)} ft`, right ? "start" : "end");

  // Dimension lines from the reference end.
  const dims = [...parts.map(p => ({ k: `X${p.i}`, x: p.x, color: fills[p.i - 1][1] })), { k: "X", x: X, color: "#15171c", bold: true }];
  const rowY = i => yB + beamH + 30 + i * 30;
  // Extension lines first, so no label is crossed by a later one.
  dims.forEach((d, i) => { s += line(Xp(d.x), yB + beamH + 2, Xp(d.x), rowY(i) + 4, `stroke="${d.color}" stroke-width="1" opacity="0.6"`); });
  dims.forEach((d, i) => {
    const y = rowY(i), xe = Xp(d.x), xr = Xp(0);
    if (Math.abs(xe - xr) > 2) s += dimLine(xr, y, xe, y, d.color, d.bold ? 2 : 1.5);
    // Label after the end of the line, or above its middle when there is no room.
    const lbl = `${d.k} = ${fmt(d.x)} ft`, end = Math.max(xe, xr), after = end + 8 + lbl.length * 7 < W - 6;
    s += after
      ? text(end + 8, y + 4, lbl, `m-xs${d.bold ? " m-bold" : ""}`)
      : text((xe + xr) / 2, y - 5, lbl, `m-xs${d.bold ? " m-bold" : ""}`, "middle");
  });
  return s + "</svg>";
}

export const DIAGRAMS = {
  "fall-clearance": fallClearance,
  "sling-tension": slingTension,
  "center-of-gravity": centerOfGravity,
};
