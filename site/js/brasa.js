/* Mundo de UDA: fundo animado da Brasa viva (aprovada em 04/11/2026).
   SMBrasa.cena("brasas") = só as fagulhas subindo (Entrar e Mesa); SMBrasa.cena("d20") = o d20 de arame em brasa (Início);
   SMBrasa.cena(null) = sem fundo. Movimento: giro que varia sem se repetir, flutuação, mola que segue o mouse,
   empurrão na rolagem, tempo medido em segundos (igual em qualquer aparelho). Para quieto se o aparelho pede menos movimento. */
const SMBrasa = (() => {
  const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cv = null, ctx = null, veu = null, CENA = null, W = 0, H = 0, DPR = 1, rodando = false;
  const M = { alvoX: 0, alvoY: 0, x: 0, y: 0, vx: 0, vy: 0, giro: 0, vgiro: 0 };
  let T = 8, ult = 0, ultScroll = 0;

  /* ---------- o d20 ---------- */
  const PHI = (1 + Math.sqrt(5)) / 2;
  const V = [[-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0], [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI], [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]].map(v => { const l = Math.hypot(...v); return v.map(x => x / l) });
  const F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const CEN = F.map(f => [0, 1, 2].map(k => (V[f[0]][k] + V[f[1]][k] + V[f[2]][k]) / 3));
  const NUM = new Array(20).fill(0);   // números de dado de verdade: faces opostas somam 21
  { let n = 1; for (const i of [0, 15, 9, 6, 2, 11, 4, 13, 7, 1, ...F.keys()]) { if (NUM[i]) continue; const o = CEN.findIndex(c => Math.hypot(c[0] + CEN[i][0], c[1] + CEN[i][1], c[2] + CEN[i][2]) < 1e-6); NUM[i] = n; NUM[o] = 21 - n; n++ } }
  const rnd = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  const R1 = rnd(7);
  const ARESTAS = (() => { const s = new Set(), a = []; F.forEach(f => [[f[0], f[1]], [f[1], f[2]], [f[2], f[0]]].forEach(([p, q]) => { const k = Math.min(p, q) + "-" + Math.max(p, q); if (!s.has(k)) { s.add(k); a.push([p, q, R1() * 6.28]) } })); return a })();
  function gira(v, a, b, c) {
    let [x, y, z] = v, t;
    t = x * Math.cos(a) + z * Math.sin(a); z = -x * Math.sin(a) + z * Math.cos(a); x = t;
    t = y * Math.cos(b) - z * Math.sin(b); z = y * Math.sin(b) + z * Math.cos(b); y = t;
    t = x * Math.cos(c) - y * Math.sin(c); y = x * Math.sin(c) + y * Math.cos(c); x = t;
    return [x, y, z];
  }
  const norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l) };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const L = norm([-.45, .6, .66]);
  function numeroNaFace(c, fi, rv, pr, cor, tam) {
    const f = F[fi], cc = rv(CEN[fi]), topo = rv(V[f[0]]);
    const e1 = norm([topo[0] - cc[0], topo[1] - cc[1], topo[2] - cc[2]]), n = norm(cc);
    const e2 = [e1[1] * n[2] - e1[2] * n[1], e1[2] * n[0] - e1[0] * n[2], e1[0] * n[1] - e1[1] * n[0]];
    const s = .01, p0 = pr(cc), pu = pr(cc.map((x, k) => x + e2[k] * s)), pv = pr(cc.map((x, k) => x - e1[k] * s));
    c.save(); c.setTransform(DPR * (pu.x - p0.x), DPR * (pu.y - p0.y), DPR * (pv.x - p0.x), DPR * (pv.y - p0.y), DPR * p0.x, DPR * p0.y);
    c.fillStyle = cor; c.font = `600 ${tam * 100}px Spectral, serif`; c.textAlign = "center"; c.textBaseline = "middle";
    const t = String(NUM[fi]); c.fillText(t, 0, 2); if (t === "6" || t === "9") c.fillRect(-6, 10 + tam * 30, 12, 1.4);
    c.restore();
  }

  /* ---------- fogo ---------- */
  const vento = (x, y, t) => [Math.sin(y * 4.1 + t * .7) * .6 + Math.sin(y * 9.3 - t * 1.1 + x * 3) * .3 + Math.sin(x * 2.2 + t * .3) * .25, Math.cos(x * 3.7 - t * .5) * .25 + Math.sin(x * 7.9 + y * 2 + t) * .15];
  const respira = t => .78 + .13 * Math.sin(t * 1.1) + .06 * Math.sin(t * 2.9 + 1) + .03 * Math.sin(t * 7.1);
  const calor = (P, e, t) => .45 + .55 * Math.pow(.5 + .5 * Math.sin(P[1] * 3.2 - t * 1.4 + e), 2);
  function novaFagulha(p) { p.x = R1(); p.y = 1.02 + R1() * .1; p.px = p.x; p.py = p.y; p.v = .05 + R1() * .09; p.s = .5 + R1() * 1.4; p.ph = R1() * 6.3; p.vida = 0; p.dur = 3 + R1() * 5; return p }
  const FAG = Array.from({ length: 95 }, () => { const p = novaFagulha({}); p.y = R1(); p.vida = R1() * p.dur; return p });
  const FAGE = Array.from({ length: 170 }, () => { const p = novaFagulha({}); p.y = R1(); p.vida = R1() * p.dur; p.dur *= 1.4; return p });
  const CINZA = Array.from({ length: 22 }, () => ({ x: R1(), y: R1(), v: .012 + R1() * .02, s: 1.5 + R1() * 2.5, ph: R1() * 6.3, rot: R1() * 6.3 }));

  function fagulhas(c, lista, t, dt, empurra = 0) {
    c.globalCompositeOperation = "lighter"; c.lineCap = "round";
    for (const p of lista) {
      p.vida += dt; if (p.vida > p.dur || p.y < -.05) novaFagulha(p);
      p.px = p.x; p.py = p.y;
      const [vx, vy] = vento(p.x * 1.3, p.y * 1.3 + p.ph, t);
      p.y -= (p.v + vy * .02) * dt; p.x += (vx * .03 + empurra * (1 - p.y) * .08) * dt;
      if (p.x < -.05) p.x += 1.1; if (p.x > 1.05) p.x -= 1.1;
      const al = Math.sin(Math.PI * Math.min(1, p.vida / p.dur)) * (.55 + .45 * Math.sin(t * 9 + p.ph * 5));
      const x0 = p.px * W, y0 = p.py * H, x1 = p.x * W, y1 = p.y * H;
      if (Math.abs(x1 - x0) > W * .5) continue;
      const ex = x1 - (x1 - x0) * 7, ey = y1 - (y1 - y0) * 7;   // rastro para trás
      c.strokeStyle = `rgba(255,150,60,${al * .35})`; c.lineWidth = p.s * 3.2; c.beginPath(); c.moveTo(x1, y1); c.lineTo(ex, ey); c.stroke();
      c.strokeStyle = `rgba(255,214,150,${al * .9})`; c.lineWidth = p.s; c.beginPath(); c.moveTo(x1, y1); c.lineTo(ex, ey); c.stroke();
    }
    c.globalCompositeOperation = "source-over";
  }
  function aresta(c, a, b, ha, hb) {
    const gr = c.createLinearGradient(a.x, a.y, b.x, b.y);
    gr.addColorStop(0, `rgba(255,120,40,${.22 * ha})`); gr.addColorStop(1, `rgba(255,120,40,${.22 * hb})`);
    c.strokeStyle = gr; c.lineWidth = 7; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    const g2 = c.createLinearGradient(a.x, a.y, b.x, b.y);
    g2.addColorStop(0, `rgba(255,${170 + 60 * ha | 0},${100 + 80 * ha | 0},${.55 + .45 * ha})`); g2.addColorStop(1, `rgba(255,${170 + 60 * hb | 0},${100 + 80 * hb | 0},${.55 + .45 * hb})`);
    c.strokeStyle = g2; c.lineWidth = 1.5; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
  }

  /* ---------- as cenas ---------- */
  function brasas(c, t, dt) {
    const r = respira(t);
    const g = c.createRadialGradient(W * .5, H * 1.08, 0, W * .5, H * 1.08, Math.max(W, H) * .75);
    g.addColorStop(0, `rgba(255,130,50,${.3 * r})`); g.addColorStop(.35, `rgba(255,80,20,${.11 * r})`); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (const q of CINZA) {   // cinza clara, maior e mais lenta que as fagulhas
      q.y -= q.v * dt; q.rot += dt * .4; if (q.y < -.05) { q.y = 1.05; q.x = R1() }
      const x = (q.x + Math.sin(t * .3 + q.ph) * .03 + M.x * (1 - q.y) * .05) * W, y = q.y * H;
      c.save(); c.translate(x, y); c.rotate(q.rot); c.fillStyle = `rgba(190,170,150,${.12 * Math.sin(Math.PI * q.y)})`; c.fillRect(-q.s, -q.s * .35, q.s * 2, q.s * .7); c.restore();
    }
    fagulhas(c, FAGE, t, dt, M.vx * 1.5);
  }
  const largo = () => W >= 1000;
  function d20(c, t, dt) {
    let cx, cy, R;
    if (largo()) { cx = W * .72; cy = H * .5; R = Math.min(W * .2, H * .34) } else { cx = W * .66; cy = 96; R = Math.min(W * .2, 90) }
    cy += R * .05 * Math.sin(t * .55) + R * .02 * Math.sin(t * 1.37 + 1);
    const D = 4.2, esc = 1 + .015 * Math.sin(t * .8), r = respira(t);
    const pr = v => { const k = D / (D - v[2]); return { x: cx + v[0] * R * esc * k, y: cy - v[1] * R * esc * k } };
    const a = t * .15 + .25 * Math.sin(t * .13) + M.giro + M.x, b = .4 + .2 * Math.sin(t * .19 + 1) + .07 * Math.sin(t * .43) + M.y, gg = .13 * Math.sin(t * .09 + 2) + .04 * Math.sin(t * .31);
    const rv = v => gira(v, a, b, gg);
    const g = c.createRadialGradient(cx, cy, 0, cx, cy, R * 2.2); g.addColorStop(0, `rgba(255,110,40,${.13 * r})`); g.addColorStop(.6, `rgba(255,80,20,${.04 * r})`); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.fillRect(cx - R * 2.3, cy - R * 2.3, R * 4.6, R * 4.6);
    fagulhas(c, FAG, t, dt);
    const fs = F.map((f, i) => ({ f, i, n: rv(CEN[i]) }));
    for (const { f, n } of fs) { if (n[2] <= 0) continue; const ps = f.map(k => pr(rv(V[k]))), luz = Math.max(0, dot(norm(n), L)); c.beginPath(); c.moveTo(ps[0].x, ps[0].y); c.lineTo(ps[1].x, ps[1].y); c.lineTo(ps[2].x, ps[2].y); c.closePath(); c.fillStyle = `rgba(255,110,40,${(.025 + luz * .07) * r})`; c.fill() }
    const ar = ARESTAS.map(([p, q, e]) => { const A = rv(V[p]), B = rv(V[q]); return { A, B, e, z: (A[2] + B[2]) / 2 } }).sort((x, y) => x.z - y.z);
    c.lineCap = "round"; c.globalCompositeOperation = "lighter";
    for (const ed of ar) {
      const A = pr(ed.A), B = pr(ed.B), ha = calor(ed.A, ed.e, t) * r, hb = calor(ed.B, ed.e, t) * r;
      if (ed.z <= -.05) { c.strokeStyle = `rgba(255,120,50,${.1 * (ha + hb)})`; c.lineWidth = 1; c.beginPath(); c.moveTo(A.x, A.y); c.lineTo(B.x, B.y); c.stroke(); continue }
      aresta(c, A, B, ha, hb);
    }
    c.globalCompositeOperation = "source-over";
    for (const { i, n } of fs) if (n[2] > .3) numeroNaFace(c, i, rv, pr, `rgba(255,200,140,${(.12 + n[2] * .45) * r})`, .42);
  }

  /* ---------- quadro a quadro ---------- */
  function quadro(agora) {
    if (!CENA) { rodando = false; return }
    const dt = calmo ? 0 : Math.min(.05, (agora - (ult || agora)) / 1000); ult = agora; T += dt;
    M.vx += (7 * (M.alvoX - M.x) - 3.2 * M.vx) * dt; M.vy += (7 * (M.alvoY - M.y) - 3.2 * M.vy) * dt; M.x += M.vx * dt; M.y += M.vy * dt;
    M.vgiro *= Math.exp(-dt * 1.4); M.giro += M.vgiro * dt;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (CENA === "brasas") brasas(ctx, T, dt); else d20(ctx, T, dt);
    if (calmo) { rodando = false; return }
    requestAnimationFrame(quadro);
  }
  function tamanho() {
    W = innerWidth; H = innerHeight; DPR = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    /* véu: protege a leitura. Brasas: escurece de leve a coluna do meio. d20 no estreito: o dado fica no alto e some atrás do texto */
    veu.style.background = CENA === "brasas" ? "radial-gradient(ellipse 46% 70% at 50% 50%, rgba(0,0,0,.42), rgba(0,0,0,0) 72%)"
      : largo() ? "linear-gradient(90deg,rgba(0,0,0,.55) 0,rgba(0,0,0,.25) 46%,rgba(0,0,0,0) 62%)"
      : "linear-gradient(180deg,rgba(0,0,0,0) 0,rgba(0,0,0,0) 80px,#000 190px)";
    if (calmo && CENA) { rodando = true; requestAnimationFrame(quadro) }
  }
  function montar() {
    if (cv) return;
    cv = document.createElement("canvas"); cv.setAttribute("aria-hidden", "true"); cv.className = "sm-fundo";
    veu = document.createElement("div"); veu.className = "sm-veu";
    document.body.prepend(veu); document.body.prepend(cv); ctx = cv.getContext("2d");
    addEventListener("resize", tamanho);
    addEventListener("pointermove", e => { M.alvoX = (e.clientX / innerWidth - .5) * .7; M.alvoY = (e.clientY / innerHeight - .5) * .45 }, { passive: true });
    document.addEventListener("pointerleave", () => { M.alvoX = 0; M.alvoY = 0 });
    addEventListener("scroll", () => { const d = scrollY - ultScroll; ultScroll = scrollY; M.vgiro = Math.max(-3, Math.min(3, M.vgiro + d * .012)) }, { passive: true });
  }
  function cena(nome) {
    CENA = nome || null; montar();
    cv.hidden = veu.hidden = !CENA; document.body.dataset.cena = CENA || "";
    tamanho();
    if (CENA && !rodando) { rodando = true; ult = 0; requestAnimationFrame(quadro) }
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (calmo && CENA) { rodando = true; requestAnimationFrame(quadro) } });
  return { cena };
})();
