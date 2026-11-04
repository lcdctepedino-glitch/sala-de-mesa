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
function desenhaMundo(c, X, z, o = {}) {
  const [W, H] = dimsMundo(X), s = 1 / z;
  if (X.fonte === "imagem") {
    if (X.imgEl && X.imgDe === X.imagem) c.drawImage(X.imgEl, 0, 0, W, H);
    else avisoMapa(c, W, H, z, X.imgErro === X.imagem ? "Não consegui abrir a imagem" : "Carregando a imagem…");
  } else {
    const { w, h, cel } = X.mapa;
    c.fillStyle = TER[0].c; c.fillRect(0, 0, W, H);
    if (!o.mini) {
      c.strokeStyle = "rgba(58,46,32,.2)"; c.lineWidth = .8; c.beginPath();
      for (let y = 3; y < h - 3; y += 2) for (let x = 3; x < w - 3; x += 2) {
        if (cel[y * w + x] || hsh(x, y) % 13) continue;
        if (cel[y * w + x - 2] || cel[y * w + x + 3] || cel[(y - 2) * w + x] || cel[(y + 2) * w + x]) continue;
        const px = x * C, py = y * C + 4; c.moveTo(px, py); c.quadraticCurveTo(px + 4, py - 4, px + 8, py); c.quadraticCurveTo(px + 12, py + 4, px + 16, py);
      }
      c.stroke();
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const t = cel[y * w + x]; if (t) { c.fillStyle = TER[t].c; c.fillRect(x * C, y * C, C + .4, C + .4) } }
    const cst = new Path2D(), sea = (x, y) => x < 0 || y < 0 || x >= w || y >= h || !cel[y * w + x];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (cel[y * w + x]) {
      const X0 = x * C, Y0 = y * C;
      if (sea(x, y - 1)) { cst.moveTo(X0, Y0); cst.lineTo(X0 + C, Y0) }
      if (sea(x, y + 1)) { cst.moveTo(X0, Y0 + C); cst.lineTo(X0 + C, Y0 + C) }
      if (sea(x - 1, y)) { cst.moveTo(X0, Y0); cst.lineTo(X0, Y0 + C) }
      if (sea(x + 1, y)) { cst.moveTo(X0 + C, Y0); cst.lineTo(X0 + C, Y0 + C) }
    }
    c.lineCap = "round"; c.strokeStyle = "rgba(58,46,32,.16)"; c.lineWidth = o.mini ? 6 : 5; c.stroke(cst);
    c.strokeStyle = TINTA; c.lineWidth = o.mini ? 2 : 1.3; c.stroke(cst);
    if (!o.mini) {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const t = cel[y * w + x], k = hsh(x, y); if (t < 2) continue;
        const cx = x * C + C / 2 + (k % 5 - 2) * .6, cy = y * C + C / 2 + ((k >> 3) % 5 - 2) * .6;
        if (t === 2 && k % 3 === 0) { c.fillStyle = "#97a675"; c.strokeStyle = TINTA; c.lineWidth = .7; c.beginPath(); c.arc(cx, cy - 1, 3.3, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(cx, cy + 2.2); c.lineTo(cx, cy + 4.5); c.stroke() }
        else if (t === 3 && k % 2 === 0) { c.fillStyle = "rgba(58,46,32,.2)"; c.beginPath(); c.moveTo(cx, cy - 5); c.lineTo(cx + 6, cy + 3.5); c.lineTo(cx + 1, cy + 3.5); c.fill(); c.strokeStyle = TINTA; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 6, cy + 3.5); c.lineTo(cx, cy - 5); c.lineTo(cx + 6, cy + 3.5); c.stroke() }
        else if (t === 4 && k % 4 === 0) { c.fillStyle = "rgba(58,46,32,.45)"; c.fillRect(cx - 2, cy, 1.1, 1.1); c.fillRect(cx + 1.5, cy + 2, 1.1, 1.1) }
      }
    }
  }
  c.strokeStyle = TINTA; c.lineWidth = o.mini ? 4 : 2 * Math.max(1, s * .6); c.strokeRect(0, 0, W, H);
  // lugares: tamanho fixo na tela; o rótulo procura um lado livre, sempre com halo
  const ocup = X.lugares.map(l => [l.x - 9 * s, l.y - 9 * s, l.x + 9 * s, l.y + 9 * s]);
  const bate = q => ocup.some(o => q[0] < o[2] && q[2] > o[0] && q[1] < o[3] && q[3] > o[1]);
  for (const l of X.lugares) {
    const r = o.mini ? 9 * W / 1200 : 6 * s, sel = o.sel === l.id;
    if (sel) { c.strokeStyle = "#8a3a26"; c.lineWidth = 2.4 * s; c.beginPath(); c.arc(l.x, l.y, r + 6 * s, 0, 7); c.stroke() }
    if (l.tipo === "masmorra") { c.fillStyle = TINTA; c.fillRect(l.x - r, l.y - r, r * 2, r * 2); c.fillStyle = PISO; c.fillRect(l.x - r * .45, l.y - r * .2, r * .9, r * 1.2) }
    else { c.fillStyle = PISO; c.strokeStyle = TINTA; c.lineWidth = o.mini ? 3 : 2 * s; c.beginPath(); c.arc(l.x, l.y, r, 0, 7); c.fill(); c.stroke(); c.fillStyle = TINTA; c.beginPath(); c.arc(l.x, l.y, r * .42, 0, 7); c.fill() }
  }
  if (!o.mini) for (const l of X.lugares) {
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

/* a linha do banco (dados.desenho) vira o objeto que as funções de desenho usam */
function mundoDoDesenho(d) { const w = d.w || 120, h = d.h || 80; return { fonte: "desenho", mapa: { w, h, cel: deB64(d.cel, w * h) }, lugares: [], plantas: {} } }
function plantaDoDesenho(d) { const w = d.w || 40, h = d.h || 28; return { fonte: "desenho", w, h, piso: deB64(d.piso, w * h), portas: new Set(d.portas || []), rotulos: d.rotulos || [] } }
/* o desenho vira uma imagem PNG (para a tela da mesa e para a sala); escala = pixels por unidade */
function desenhoParaPNG(ehPlanta, d, escala) {
  const X = ehPlanta ? plantaDoDesenho(d) : mundoDoDesenho(d), [W, H] = ehPlanta ? dimsPlanta(X) : dimsMundo(X);
  const cv = document.createElement("canvas"); cv.width = Math.round(W * escala); cv.height = Math.round(H * escala);
  const c = cv.getContext("2d"); c.setTransform(escala, 0, 0, escala, 0, 0);
  if (ehPlanta) desenhaPlanta(c, X, escala); else desenhaMundo(c, X, escala);
  return new Promise(r => cv.toBlob(r, "image/png"));
}
function dimsDoDesenho(ehPlanta, d) { return ehPlanta ? [(d.w || 40) * CP, (d.h || 28) * CP] : [(d.w || 120) * C, (d.h || 80) * C] }
/* um número curto que muda quando o desenho muda (nome do arquivo e memória das imagens) */
function marcaDesenho(d) { const t = JSON.stringify(d); let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString() }
