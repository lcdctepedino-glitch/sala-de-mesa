/* Sala de Mesa: desenho dos mapas (mundo pintado e planta na grade). Usado pelo criador (mundos.html) e pela tela Mundo da mesa. */
const C = 10, CP = 20, LARG = 1200, LARGP = 800;   // célula do mundo, quadrado da planta, largura do mapa/planta quando é imagem
const TER = [{ n: "Mar", c: "#a3b9b4" }, { n: "Campo", c: "#e6d8b5" }, { n: "Floresta", c: "#bcc597" }, { n: "Montanha", c: "#d3bf99" }, { n: "Deserto", c: "#efdca6" }];
const TINTA = "#3a2e20", PISO = "#f7f0de", HALO = "rgba(236,224,192,.96)";
function b64(a) { let s = ""; for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode.apply(null, a.subarray(i, i + 8192)); return btoa(s) }
function deB64(s, n) { const a = new Uint8Array(n); try { const b = atob(s || ""); for (let i = 0; i < Math.min(n, b.length); i++) a[i] = b.charCodeAt(i) } catch (e) { } return a }
const dimsMundo = X => X.fonte === "imagem" && X.largura ? [LARG, LARG * X.altura / X.largura] : [X.mapa.w * C, X.mapa.h * C];
const dimsPlanta = P => P.fonte === "imagem" && P.largura ? [LARGP, LARGP * P.altura / P.largura] : [P.w * CP, P.h * CP];

function hsh(x, y) { let h = x * 374761393 + y * 668265263; h = Math.imul(h ^ (h >>> 13), 1274126177); return (h ^ (h >>> 16)) >>> 0 }
function avisoMapa(c, W, H, z, txt) { c.fillStyle = "#2a2c31"; c.fillRect(0, 0, W, H); c.fillStyle = "#a9a69d"; c.font = `700 ${15 / z}px "Atkinson Hyperlegible", sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(txt, W / 2, H / 2) }
/* terreno com 1 pixel por quadradinho, guardado até o desenho mudar (mapa.ver): miniaturas e mapa grande visto de longe */
const CAMADA = new WeakMap();
function camadaTerreno(mapa) {
  const k = CAMADA.get(mapa); if (k && k.ver === mapa.ver) return k.cv;
  const { w, h, cel } = mapa, cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const g = cv.getContext("2d"), im = g.createImageData(w, h), rgb = TER.map(t => [1, 3, 5].map(i => parseInt(t.c.slice(i, i + 2), 16)));
  for (let i = 0; i < w * h; i++) { const q = rgb[cel[i]] || rgb[0]; im.data[i * 4] = q[0]; im.data[i * 4 + 1] = q[1]; im.data[i * 4 + 2] = q[2]; im.data[i * 4 + 3] = 255 }
  g.putImageData(im, 0, 0); CAMADA.set(mapa, { ver: mapa.ver, cv }); return cv;
}
/* o: mini (miniatura), sel (lugar escolhido), vis ([x0,y0,x1,y1] do que aparece na tela: só isso é desenhado),
   camada (canvas do tamanho da grade pintado por cima: as cores dos continentes no editor),
   rotulos (nomes dos continentes, de rotulosContinentes), longe (esconde o nome das cidades, menos o da escolhida) */
function desenhaMundo(c, X, z, o = {}) {
  const [W, H] = dimsMundo(X), s = 1 / z;
  if (X.fonte === "imagem") {
    if (X.imgEl && X.imgDe === X.imagem) c.drawImage(X.imgEl, 0, 0, W, H);
    else avisoMapa(c, W, H, z, X.imgErro === X.imagem ? "Não consegui abrir a imagem" : "Carregando a imagem…");
  } else {
    const { w, h, cel } = X.mapa, fino = o.mini || z * C < 2.5;
    let gx0 = 0, gy0 = 0, gx1 = w, gy1 = h;
    if (o.vis) { gx0 = Math.max(0, Math.floor(o.vis[0] / C) - 2); gy0 = Math.max(0, Math.floor(o.vis[1] / C) - 2); gx1 = Math.min(w, Math.ceil(o.vis[2] / C) + 2); gy1 = Math.min(h, Math.ceil(o.vis[3] / C) + 2) }
    c.fillStyle = TER[0].c; c.fillRect(0, 0, W, H);
    if (fino) c.drawImage(camadaTerreno(X.mapa), 0, 0, W, H);
    else {
      c.strokeStyle = "rgba(58,46,32,.2)"; c.lineWidth = .8; c.beginPath();
      for (let y = Math.max(3, gy0 + (gy0 + 1) % 2); y < Math.min(h - 3, gy1); y += 2) for (let x = Math.max(3, gx0 + (gx0 + 1) % 2); x < Math.min(w - 3, gx1); x += 2) {
        if (cel[y * w + x] || hsh(x, y) % 13) continue;
        if (cel[y * w + x - 2] || cel[y * w + x + 3] || cel[(y - 2) * w + x] || cel[(y + 2) * w + x]) continue;
        const px = x * C, py = y * C + 4; c.moveTo(px, py); c.quadraticCurveTo(px + 4, py - 4, px + 8, py); c.quadraticCurveTo(px + 12, py + 4, px + 16, py);
      }
      c.stroke();
      for (let y = gy0; y < gy1; y++) for (let x = gx0; x < gx1; x++) { const t = cel[y * w + x]; if (t) { c.fillStyle = TER[t].c; c.fillRect(x * C, y * C, C + .4, C + .4) } }
    }
    if (o.camada) { c.imageSmoothingEnabled = false; c.drawImage(o.camada, 0, 0, W, H); c.imageSmoothingEnabled = true }
    const cst = new Path2D(), sea = (x, y) => x < 0 || y < 0 || x >= w || y >= h || !cel[y * w + x];
    for (let y = gy0; y < gy1; y++) for (let x = gx0; x < gx1; x++) if (cel[y * w + x]) {
      const X0 = x * C, Y0 = y * C;
      if (sea(x, y - 1)) { cst.moveTo(X0, Y0); cst.lineTo(X0 + C, Y0) }
      if (sea(x, y + 1)) { cst.moveTo(X0, Y0 + C); cst.lineTo(X0 + C, Y0 + C) }
      if (sea(x - 1, y)) { cst.moveTo(X0, Y0); cst.lineTo(X0, Y0 + C) }
      if (sea(x + 1, y)) { cst.moveTo(X0 + C, Y0); cst.lineTo(X0 + C, Y0 + C) }
    }
    c.lineCap = "round"; c.strokeStyle = "rgba(58,46,32,.16)"; c.lineWidth = o.mini ? 6 : 5; c.stroke(cst);
    c.strokeStyle = TINTA; c.lineWidth = o.mini ? 2 : 1.3; c.stroke(cst);
    if (!fino) {
      for (let y = gy0; y < gy1; y++) for (let x = gx0; x < gx1; x++) {
        const t = cel[y * w + x], k = hsh(x, y); if (t < 2) continue;
        const cx = x * C + C / 2 + (k % 5 - 2) * .6, cy = y * C + C / 2 + ((k >> 3) % 5 - 2) * .6;
        if (t === 2 && k % 3 === 0) { c.fillStyle = "#97a675"; c.strokeStyle = TINTA; c.lineWidth = .7; c.beginPath(); c.arc(cx, cy - 1, 3.3, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(cx, cy + 2.2); c.lineTo(cx, cy + 4.5); c.stroke() }
        else if (t === 3 && k % 2 === 0) { c.fillStyle = "rgba(58,46,32,.2)"; c.beginPath(); c.moveTo(cx, cy - 5); c.lineTo(cx + 6, cy + 3.5); c.lineTo(cx + 1, cy + 3.5); c.fill(); c.strokeStyle = TINTA; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 6, cy + 3.5); c.lineTo(cx, cy - 5); c.lineTo(cx + 6, cy + 3.5); c.stroke() }
        else if (t === 4 && k % 4 === 0) { c.fillStyle = "rgba(58,46,32,.45)"; c.fillRect(cx - 2, cy, 1.1, 1.1); c.fillRect(cx + 1.5, cy + 2, 1.1, 1.1) }
      }
    }
  }
  c.strokeStyle = TINTA; c.lineWidth = o.mini ? 4 : 2 * Math.max(1, s * .6); c.strokeRect(0, 0, W, H);
  if (o.rotulos) desenhaRotulos(c, o.rotulos);
  // lugares: tamanho fixo na tela; o rótulo procura um lado livre (fora dos nomes dos continentes), sempre com halo
  const ocup = X.lugares.map(l => [l.x - 9 * s, l.y - 9 * s, l.x + 9 * s, l.y + 9 * s]).concat((o.rotulos || []).map(r => r.caixa));
  const bate = q => ocup.some(o => q[0] < o[2] && q[2] > o[0] && q[1] < o[3] && q[3] > o[1]);
  for (const l of X.lugares) {
    const r = o.mini ? 9 * W / 1200 : 6 * s, sel = o.sel === l.id;
    if (sel) { c.strokeStyle = "#8a3a26"; c.lineWidth = 2.4 * s; c.beginPath(); c.arc(l.x, l.y, r + 6 * s, 0, 7); c.stroke() }
    if (l.tipo === "masmorra") { c.fillStyle = TINTA; c.fillRect(l.x - r, l.y - r, r * 2, r * 2); c.fillStyle = PISO; c.fillRect(l.x - r * .45, l.y - r * .2, r * .9, r * 1.2) }
    else { c.fillStyle = PISO; c.strokeStyle = TINTA; c.lineWidth = o.mini ? 3 : 2 * s; c.beginPath(); c.arc(l.x, l.y, r, 0, 7); c.fill(); c.stroke(); c.fillStyle = TINTA; c.beginPath(); c.arc(l.x, l.y, r * .42, 0, 7); c.fill() }
  }
  if (!o.mini) for (const l of X.lugares) {
    if (o.longe && l.id !== o.sel) continue;
    const r = 6 * s, temP = !!X.plantas[l.id], fs = 14 * s, nome = l.nome || "Sem nome";
    c.font = `italic 600 ${fs}px Spectral, Georgia, serif`;
    const tw = c.measureText(nome).width, alt = fs * 1.15 + (temP ? 13 * s : 0), g = 4 * s;
    const lados = [[l.x - tw / 2, l.y + r + g], [l.x - tw / 2, l.y - r - g - alt], [l.x + r + g * 1.5, l.y - fs * .6], [l.x - r - g * 1.5 - tw, l.y - fs * .6]];
    let [x0, y0] = lados[0];
    for (const [a, b] of lados) { const q = [a - 2 * s, b, a + tw + 2 * s, b + alt]; if (!bate(q)) { [x0, y0] = [a, b]; break } }
    ocup.push([x0 - 2 * s, y0, x0 + tw + 2 * s, y0 + alt]);
    c.textAlign = "left"; c.textBaseline = "top"; c.lineJoin = "round"; c.lineWidth = 4.5 * s; c.strokeStyle = HALO;
    c.strokeText(nome, x0, y0); c.fillStyle = TINTA; c.fillText(nome, x0, y0);
    if (temP) { c.font = `700 ${10 * s}px "Atkinson Hyperlegible", sans-serif`; c.lineWidth = 3.5 * s; c.strokeStyle = HALO; c.strokeText("planta", x0, y0 + fs * 1.15); c.fillStyle = "#6b5a42"; c.fillText("planta", x0, y0 + fs * 1.15) }
  }
}
let PADRAO = null;
function hachura(c) {
  if (!PADRAO) {
    const k = document.createElement("canvas"); k.width = k.height = 14; const g = k.getContext("2d");
    g.strokeStyle = "rgba(58,46,32,.42)"; g.lineWidth = 1; g.beginPath();
    for (const o of [-14, 0, 14]) { g.moveTo(o, 14); g.lineTo(o + 14, 0) } g.stroke(); PADRAO = k;
  }
  return c.createPattern(PADRAO, "repeat");
}
function desenhaPlanta(c, P, z) {
  if (P.fonte === "imagem") {
    const [W, H] = dimsPlanta(P);
    if (P.imgEl && P.imgDe === P.imagem) c.drawImage(P.imgEl, 0, 0, W, H); else avisoMapa(c, W, H, z, P.imgErro === P.imagem ? "Não consegui abrir a imagem" : "Carregando a imagem…");
    c.strokeStyle = TINTA; c.lineWidth = 2; c.strokeRect(0, 0, W, H); return;
  }
  const { w, h, piso } = P, f = (x, y) => x >= 0 && y >= 0 && x < w && y < h && piso[y * w + x];
  c.fillStyle = "#e3d4b0"; c.fillRect(0, 0, w * CP, h * CP); c.fillStyle = hachura(c); c.fillRect(0, 0, w * CP, h * CP);
  c.fillStyle = PISO; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (piso[y * w + x]) c.fillRect(x * CP - .3, y * CP - .3, CP + .6, CP + .6);
  const g = new Path2D(), pa = new Path2D();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (piso[y * w + x]) {
    const X0 = x * CP, Y0 = y * CP; g.rect(X0, Y0, CP, CP);
    if (!f(x, y - 1)) { pa.moveTo(X0, Y0); pa.lineTo(X0 + CP, Y0) }
    if (!f(x, y + 1)) { pa.moveTo(X0, Y0 + CP); pa.lineTo(X0 + CP, Y0 + CP) }
    if (!f(x - 1, y)) { pa.moveTo(X0, Y0); pa.lineTo(X0, Y0 + CP) }
    if (!f(x + 1, y)) { pa.moveTo(X0 + CP, Y0); pa.lineTo(X0 + CP, Y0 + CP) }
  }
  c.strokeStyle = "rgba(58,46,32,.15)"; c.lineWidth = .8; c.stroke(g);
  c.lineCap = "square"; c.strokeStyle = "rgba(58,46,32,.2)"; c.lineWidth = 8; c.stroke(pa);
  c.strokeStyle = TINTA; c.lineWidth = 3.4; c.stroke(pa);
  for (const k of P.portas) {
    const [x, y, d] = k.split(","), X0 = +x * CP, Y0 = +y * CP;
    c.fillStyle = PISO; c.strokeStyle = TINTA; c.lineWidth = 1.5;
    if (d === "h") { c.fillRect(X0 + 4, Y0 - 3.5, CP - 8, 7); c.strokeRect(X0 + 4, Y0 - 3.5, CP - 8, 7) }
    else { c.fillRect(X0 - 3.5, Y0 + 4, 7, CP - 8); c.strokeRect(X0 - 3.5, Y0 + 4, 7, CP - 8) }
  }
  c.textAlign = "center"; c.textBaseline = "middle";
  for (const r of P.rotulos) {
    const X0 = r.x * CP + CP / 2, Y0 = r.y * CP + CP / 2;
    c.fillStyle = TINTA; c.beginPath(); c.arc(X0, Y0, 8, 0, 7); c.fill();
    c.fillStyle = PISO; c.font = `700 11px "Atkinson Hyperlegible", sans-serif`; c.fillText(r.n, X0, Y0 + .5);
  }
  c.strokeStyle = TINTA; c.lineWidth = 2; c.strokeRect(0, 0, w * CP, h * CP);
}

/* =================== continentes =================== */
/* Um continente = { id, nome, pontos: [{x, y}] }, com x e y de 0 a 1 no mapa (como os lugares), guardado em
   dados.continentes do mapa do mundo. Cada ponto fica em cima da terra. A terra é repartida pelo ponto mais perto,
   andando só por terra: uma ilha com um ponto é daquele continente; duas pontos na mesma terra a dividem ao meio
   do caminho; terra sem ponto fica "sem nome". Repintar a costa não perde o nome. */
const MAXW = 480, MAXH = 320;   // teto do mapa desenhado (4 vezes o inicial em cada lado), para o iPad
/* quadradinho de terra mais perto de (cx, cy), em quadradinhos, até r de distância; -1 se só houver mar */
function celTerra(mapa, cx, cy, r) {
  const { w, h, cel } = mapa, x0 = Math.floor(cx), y0 = Math.floor(cy);
  let mel = -1, md = Infinity;
  for (let y = y0 - r; y <= y0 + r; y++) for (let x = x0 - r; x <= x0 + r; x++) {
    if (x < 0 || y < 0 || x >= w || y >= h || !cel[y * w + x]) continue;
    const d = (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2; if (d < md) { md = d; mel = y * w + x }
  }
  return mel;
}
function regioesMundo(mapa, conts) {
  const { w, h, cel } = mapa, n = w * h, comp = new Int32Array(n).fill(-1), dono = new Int16Array(n).fill(-1), fila = new Int32Array(n), comps = [];
  const viz = (j, x, y, f) => { if (x > 0) f(j - 1); if (x < w - 1) f(j + 1); if (y > 0) f(j - w); if (y < h - 1) f(j + w) };
  for (let i = 0; i < n; i++) if (cel[i] && comp[i] < 0) {   // cada pedaço de terra separado
    const id = comps.length, q = { n: 0, sx: 0, sy: 0, x0: w, y0: h, x1: 0, y1: 0, ini: i }; let a = 0, b = 0; fila[b++] = i; comp[i] = id;
    while (a < b) {
      const j = fila[a++], x = j % w, y = (j - x) / w; q.n++; q.sx += x; q.sy += y;
      if (x < q.x0) q.x0 = x; if (x > q.x1) q.x1 = x; if (y < q.y0) q.y0 = y; if (y > q.y1) q.y1 = y;
      viz(j, x, y, k => { if (cel[k] && comp[k] < 0) { comp[k] = id; fila[b++] = k } });
    }
    comps.push(q);
  }
  let a = 0, b = 0;
  (conts || []).forEach((ct, k) => (ct.pontos || []).forEach(p => { const j = celTerra(mapa, p.x * w, p.y * h, 4); if (j >= 0 && dono[j] < 0) { dono[j] = k; fila[b++] = j } }));
  while (a < b) { const j = fila[a++], x = j % w, y = (j - x) / w; viz(j, x, y, k => { if (cel[k] && dono[k] < 0) { dono[k] = dono[j]; fila[b++] = k } }) }
  const runL = new Int16Array(n), runR = new Int16Array(n), est = (conts || []).map(() => ({ n: 0, sx: 0, sy: 0, x0: w, y0: h, x1: 0, y1: 0 }));
  for (let y = 0; y < h; y++) for (let x = 0; x < w;) {   // trechos seguidos do mesmo continente em cada linha (para ver se um nome cabe)
    const i = y * w + x, d = cel[i] ? dono[i] : -2; let e = x;
    while (e + 1 < w && (cel[i + e + 1 - x] ? dono[i + e + 1 - x] : -2) === d) e++;
    for (let t = x; t <= e; t++) { runL[y * w + t] = x; runR[y * w + t] = e }
    if (d >= 0) { const q = est[d], m = e - x + 1; q.n += m; q.sx += (x + e) * m / 2; q.sy += y * m; if (x < q.x0) q.x0 = x; if (e > q.x1) q.x1 = e; if (y < q.y0) q.y0 = y; if (y > q.y1) q.y1 = y }
    x = e + 1;
  }
  return { w, h, cel, comp, comps, dono, runL, runR, est, conts: conts || [] };
}
/* id do continente no ponto (x, y de 0 a 1); lugar na beira do mar conta a terra ao lado */
function continenteEm(reg, fx, fy) {
  if (fx == null || fy == null) return null;
  const j = celTerra(reg, fx * reg.w, fy * reg.h, 2); if (j < 0 || reg.dono[j] < 0) return null;
  return reg.conts[reg.dono[j]].id;
}
/* terras sem nome que valem a pena (ilhotas pequenas ficam de fora) */
function terrasSemNome(reg, min = 30) {
  return reg.comps.map((q, i) => ({ ...q, i })).filter(q => q.n >= min && reg.dono[q.ini] < 0).sort((a, b) => b.n - a.n);   // um ponto na terra pinta a terra inteira
}
/* um quadradinho de terra daquele pedaço, o mais perto do meio dele */
function meioDaTerra(reg, i) {
  const q = reg.comps[i], cx = q.sx / q.n, cy = q.sy / q.n; let mel = q.ini, md = Infinity;
  for (let y = q.y0; y <= q.y1; y++) for (let x = q.x0; x <= q.x1; x++) { const j = y * reg.w + x; if (reg.comp[j] !== i) continue; const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < md) { md = d; mel = j } }
  return { x: (mel % reg.w + .5) / reg.w, y: (Math.floor(mel / reg.w) + .5) / reg.h };
}

const MEDE = document.createElement("canvas").getContext("2d");
const fonteCont = fs => `600 ${fs}px Spectral, Georgia, serif`, ESPACO = .12;   // letras afastadas 0,12 da altura
function larguraCont(nome, fs) { MEDE.font = fonteCont(fs); let t = 0; for (const ch of nome) t += MEDE.measureText(ch).width; return t + fs * ESPACO * ([...nome].length - 1) }
const bateCaixa = (q, l) => l.some(o => q[0] < o[2] && q[2] > o[0] && q[1] < o[3] && q[3] > o[1]);
function cabeNome(reg, k, cx, cy, a, b) {
  if (cx - a < 0 || cx + a >= reg.w || cy - b < 0 || cy + b >= reg.h) return false;
  for (let y = cy - b; y <= cy + b; y++) { const j = y * reg.w + cx; if (reg.dono[j] !== k || reg.runL[j] > cx - a || reg.runR[j] < cx + a) return false }
  return true;
}
/* Onde vai o nome de cada continente. z = pixels da tela por unidade do mapa: a letra tem de 13 a 30 px na tela.
   O nome fica inteiro dentro da terra dele, sem encostar na costa nem nas caixas de "evitar" (lugares);
   se não couber nem com 13 px, vai logo abaixo da terra, no mar. so = Set de ids a mostrar (os outros só repartem a terra). */
function rotulosContinentes(reg, z, evitar = [], so = null) {
  const out = [], W = reg.w * C, H = reg.h * C;
  reg.conts.forEach((ct, k) => {
    const q = reg.est[k], nome = String(ct.nome || "").trim().toUpperCase();
    if (!q || !q.n || !nome || (so && !so.has(ct.id))) return;
    if (!q.cand) {   // quadradinhos do continente, do meio para fora
      const l = [], p = Math.max(1, Math.round(Math.sqrt(q.n / 4000))), mx = q.sx / q.n, my = q.sy / q.n;
      for (let y = q.y0; y <= q.y1; y += p) for (let x = q.x0; x <= q.x1; x += p) if (reg.dono[y * reg.w + x] === k) l.push(y * reg.w + x);
      const dist = j => { const x = j % reg.w, y = (j - x) / reg.w; return (x - mx) ** 2 + (y - my) ** 2 };
      q.cand = l.map(j => [dist(j), j]).sort((a, b) => a[0] - b[0]).map(e => e[1]);
    }
    const tela = (q.x1 - q.x0 + 1) * C * z, ini = Math.min(30, Math.max(13, tela * .7 / Math.max(5, nome.length * .75)));
    let r = null;
    for (const px of [...new Set([ini, ini * .84, ini * .7, ini * .58, 13].map(v => Math.max(13, Math.round(v))))].sort((a, b) => b - a)) {
      const fs = px / z, tw = larguraCont(nome, fs), a = Math.ceil((tw / 2 + fs * .3) / C), b = Math.ceil(fs * .62 / C);
      for (const j of q.cand) {
        const cx = j % reg.w, cy = (j - cx) / reg.w; if (!cabeNome(reg, k, cx, cy, a, b)) continue;
        const x = (cx + .5) * C, y = (cy + .5) * C, caixa = [x - tw / 2 - fs * .2, y - fs * .6, x + tw / 2 + fs * .2, y + fs * .6];
        if (bateCaixa(caixa, evitar) || bateCaixa(caixa, out.map(o => o.caixa))) continue;
        r = { id: ct.id, k, nome, x, y, fs, tw, caixa, dentro: true }; break;
      }
      if (r) break;
    }
    if (!r) {   // não cabe dentro: vai para o mar em volta (embaixo, em cima, dos lados), sem cobrir terra, lugar nem outro nome
      const fs = 13 / z, tw = larguraCont(nome, fs), mx = (q.sx / q.n + .5) * C, my = (q.sy / q.n + .5) * C, g = fs * .9;
      const baixo = (q.y1 + 1) * C + g, cima = q.y0 * C - g, lugares = [];
      for (const fila of [0, 1, 2]) for (const dx of [0, -.5, .5, -1, 1]) {   // 3 fileiras embaixo e em cima, andando para os lados
        lugares.push([mx + dx * tw * .6, baixo + fila * g * 1.5], [mx + dx * tw * .6, cima - fila * g * 1.5]);
      }
      lugares.push([(q.x1 + 1) * C + tw / 2 + g * .6, my], [q.x0 * C - tw / 2 - g * .6, my]);
      const caixaDe = (x, y) => [x - tw / 2 - fs * .2, y - fs * .6, x + tw / 2 + fs * .2, y + fs * .6];
      const soMar = b => { for (let y = Math.max(0, Math.floor(b[1] / C)); y <= Math.min(reg.h - 1, Math.floor(b[3] / C)); y++) for (let x = Math.max(0, Math.floor(b[0] / C)); x <= Math.min(reg.w - 1, Math.floor(b[2] / C)); x++) if (reg.cel[y * reg.w + x]) return false; return true };
      let melhor = null, nota = -1;
      for (const [lx, ly] of lugares) {
        const x = Math.min(W - tw / 2 - fs * .3, Math.max(tw / 2 + fs * .3, lx)), y = Math.min(H - fs * .7, Math.max(fs * .7, ly)), b = caixaDe(x, y);
        const n = (bateCaixa(b, evitar) || bateCaixa(b, out.map(o => o.caixa)) ? 0 : 2) + (soMar(b) ? 1 : 0);
        if (n > nota) { nota = n; melhor = [x, y, b] } if (n === 3) break;
      }
      r = { id: ct.id, k, nome, x: melhor[0], y: melhor[1], fs, tw, caixa: melhor[2], dentro: false };
    }
    out.push(r);
  });
  return out;
}
function desenhaRotulos(c, rots) {
  c.save(); c.textAlign = "left"; c.textBaseline = "middle"; c.lineJoin = "round";
  for (const pass of [0, 1]) for (const r of rots) {   // primeiro todos os halos, depois as letras
    c.font = fonteCont(r.fs); let x = r.x - r.tw / 2;
    if (pass) c.fillStyle = r.oculto ? "rgba(58,46,32,.45)" : "rgba(58,46,32,.85)"; else { c.strokeStyle = HALO; c.lineWidth = r.fs * .3 }
    for (const ch of r.nome) { if (pass) c.fillText(ch, x, r.y); else c.strokeText(ch, x, r.y); x += c.measureText(ch).width + r.fs * ESPACO }
  }
  c.restore();
}

/* a linha do banco (dados.desenho) vira o objeto que as funções de desenho usam */
function mundoDoDesenho(d) { const w = d.w || 120, h = d.h || 80; return { fonte: "desenho", mapa: { w, h, cel: deB64(d.cel, w * h) }, lugares: [], plantas: {} } }
function plantaDoDesenho(d) { const w = d.w || 40, h = d.h || 28; return { fonte: "desenho", w, h, piso: deB64(d.piso, w * h), portas: new Set(d.portas || []), rotulos: d.rotulos || [] } }
/* O desenho vira uma imagem PNG (para a tela da mesa e para a sala); escala = pixels por unidade.
   conts = continentes cujo nome vai escrito na imagem (os descobertos), todos = todos (para repartir a terra).
   atalho: imagem de no máximo 4096 px no lado maior (limite do iPad); trocar quando um mapa grande ficar borrado no zoom. */
function desenhoParaPNG(ehPlanta, d, escala, conts, todos) {
  const X = ehPlanta ? plantaDoDesenho(d) : mundoDoDesenho(d), [W, H] = ehPlanta ? dimsPlanta(X) : dimsMundo(X);
  escala = Math.min(escala, 4096 / Math.max(W, H));
  const cv = document.createElement("canvas"); cv.width = Math.round(W * escala); cv.height = Math.round(H * escala);
  const c = cv.getContext("2d"); c.setTransform(escala, 0, 0, escala, 0, 0);
  let rotulos = null;
  if (!ehPlanta && conts && conts.length) {   // o nome é medido como se a imagem fosse vista inteira numa tela de 1400 px
    const reg = regioesMundo(X.mapa, todos || conts);
    rotulos = rotulosContinentes(reg, 1400 / Math.max(W, H), [], new Set(conts.map(ct => ct.id)));
  }
  if (ehPlanta) desenhaPlanta(c, X, escala); else desenhaMundo(c, X, escala, { rotulos });
  return new Promise(r => cv.toBlob(r, "image/png"));
}
function dimsDoDesenho(ehPlanta, d) { return ehPlanta ? [(d.w || 40) * CP, (d.h || 28) * CP] : [(d.w || 120) * C, (d.h || 80) * C] }
/* um número curto que muda quando o desenho muda (nome do arquivo e memória das imagens) */
function marcaDesenho(d) { const t = JSON.stringify(d); let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString() }
