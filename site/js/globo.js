/* Mundo de UDA: o mundo do Início em 3D (aprovado em 06/11/2026, prévia "planeta vivo"; substitui o d20).
   Lê o desenho do mapa do mundo (terra/mar e o terreno de cada quadradinho) e ergue o relevo: montanha vira cordilheira,
   floresta vira morro com pinheiros (de perto), deserto ganha dunas, rios descem da montanha ao mar, luzes miúdas na terra.
   Tamanhos, rios, árvores e luzes miúdas são inventados aqui; o formato das terras, o terreno, os nomes dos continentes e os
   lugares vêm do mundo. SMGlobo.mini(canvas) = o globo pequeno no topo do Início (só gira); SMGlobo.abrir(tela) = a tela cheia,
   que se arrasta, aproxima e mostra a composição de cada terra. Usa three.js r128 (js/three.min.js). */
const SMGlobo = (() => {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NOMES_T = ["Mar", "Campo", "Floresta", "Montanha", "Deserto"], CORES_T = ["", "#7da04a", "#3f7a3a", "#a79a86", "#d8bd84"];
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
  const dirLL = (lat, lon) => { const u = (lon + 180) / 360, th = (90 - lat) / 180 * Math.PI, s = Math.sin(th); return new THREE.Vector3(-Math.cos(2 * Math.PI * u) * s, Math.cos(th), Math.sin(2 * Math.PI * u) * s) };
  const coord = (lat, lon) => `${Math.abs(Math.round(lat))}°${lat >= 0 ? "N" : "S"}  ${Math.abs(Math.round(lon))}°${lon >= 0 ? "L" : "O"}`;
  let semente = 11; const rnd = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647 };
  function h3(x, y, z) { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1274126177) ^ 40213; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296 }
  function vn(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const a = h3(xi, yi, zi), b = h3(xi + 1, yi, zi), c = h3(xi, yi + 1, zi), d = h3(xi + 1, yi + 1, zi), e = h3(xi, yi, zi + 1), f = h3(xi + 1, yi, zi + 1), g = h3(xi, yi + 1, zi + 1), k = h3(xi + 1, yi + 1, zi + 1);
    const x1 = a + (b - a) * u, x2 = c + (d - c) * u, x3 = e + (f - e) * u, x4 = g + (k - g) * u, y1 = x1 + (x2 - x1) * v, y2 = x3 + (x4 - x3) * v; return y1 + (y2 - y1) * w
  }
  function fbm(x, y, z, o) { let s = 0, a = .5, f = 1, n = 0; for (let i = 0; i < o; i++) { s += a * vn(x * f + i * 17.3, y * f + i * 9.1, z * f + i * 4.7); n += a; a *= .5; f *= 2.03 } return s / n }
  function cristas(x, y, z, o) { let s = 0, a = .5, f = 1, n = 0; for (let i = 0; i < o; i++) { const r = 1 - Math.abs(2 * vn(x * f + i * 7.1, y * f + i * 3.3, z * f + i * 5.9) - 1); s += a * r * r; n += a; a *= .5; f *= 2.1 } return s / n }
  function deB64(s, n) { const a = new Uint8Array(n); try { const b = atob(s || ""); for (let i = 0; i < Math.min(n, b.length); i++) a[i] = b.charCodeAt(i) } catch (e) { } return a }

  /* ---------- ler o mundo do banco: primeiro um mundo meu; se não houver, o da mesa onde jogo ---------- */
  async function carregarDoInicio(eu, mesas) {
    const ler = r => { if (r.error) throw r.error; return r.data };
    const desenhoDe = m => m && !m.lugar_id && ((m.dados || {}).fonte !== "imagem") ? (m.desenho || (m.dados || {}).desenho) : null;
    try {
      const meus = ler(await sb.from("mesa_conteudo").select("id,nome").eq("tipo", "mundo").eq("dono_id", eu.id).order("criado_em"));
      for (const w of meus) {
        const g = ler(await sb.from("mesa_conteudo").select("id,lugar_id,dados").eq("tipo", "mapa").eq("mundo_id", w.id).is("lugar_id", null).limit(1))[0];
        const des = desenhoDe(g); if (!des || !des.cel) continue;
        const pags = ler(await sb.from("mesa_conteudo").select("nome,categoria,x,y").eq("tipo", "pagina").eq("mapa_id", g.id));
        return { nome: w.nome, dono: true, des, conts: (g.dados || {}).continentes || [], lugares: pags.filter(p => p.x != null && p.y != null) };
      }
      for (const m of (mesas || []).filter(m => m.mestre_id !== eu.id).slice(0, 3)) {
        const d = ler(await sb.rpc("mundo_jogador", { p_mesa: m.id })); if (!d || !d.mundo) continue;
        const g = (d.mapas || []).find(x => desenhoDe(x)); if (!g) continue;
        const des = desenhoDe(g);
        return { nome: d.mundo.nome || "Mundo", dono: false, des, conts: g.continentes || (g.dados || {}).continentes || [],
          lugares: (d.paginas || []).filter(p => p.mapa_id === g.id && p.x != null && p.y != null) };
      }
    } catch (e) { console.warn("globo: não li o mundo", e) }
    return null;
  }

  /* ---------- preparar: pedaços de terra, pesos suaves de cada terreno, distância ao mar, rios ---------- */
  function preparar(info) {
    const des = info && info.des, MW = (des && des.w) || 200, MH = (des && des.h) || 160;
    const CEL = des ? deB64(des.cel, MW * MH) : new Uint8Array(MW * MH);
    const GRAU = Math.min(1, 300 / MW, 165 / MH), LON0 = -MW * GRAU / 2, LAT0 = MH * GRAU / 2, N = MW * MH;
    const P = { MW, MH, CEL, GRAU, LON0, LAT0 };
    const borrar = (src, r, passos) => { let a = Float32Array.from(src); const b = new Float32Array(a.length);
      for (let p = 0; p < passos; p++) { for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { let s = 0; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < MW) s += a[y * MW + xx] } b[y * MW + x] = s / (2 * r + 1) }
        for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) { let s = 0; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < MH) s += b[yy * MW + x] } a[y * MW + x] = s / (2 * r + 1) } } return a };
    const terra = new Float32Array(N), pesos = [1, 2, 3, 4].map(() => new Float32Array(N));
    for (let i = 0; i < N; i++) { terra[i] = CEL[i] ? 1 : 0; if (CEL[i] >= 1 && CEL[i] <= 4) pesos[CEL[i] - 1][i] = 1 }
    const comp = new Int16Array(N).fill(-1), pecas = [], viz = (j, x, y) => [x > 0 ? j - 1 : -1, x < MW - 1 ? j + 1 : -1, y > 0 ? j - MW : -1, y < MH - 1 ? j + MW : -1];
    for (let i = 0; i < N; i++) if (CEL[i] && comp[i] < 0) { const id = pecas.length, fila = [i], pc = { id, cel: [], tipos: [0, 0, 0, 0, 0], lugares: 0 }; comp[i] = id;
      for (let q = 0; q < fila.length; q++) { const j = fila[q], x = j % MW, y = (j - x) / MW; pc.cel.push(j); pc.tipos[CEL[j]] = (pc.tipos[CEL[j]] || 0) + 1; for (const k of viz(j, x, y)) if (k >= 0 && CEL[k] && comp[k] < 0) { comp[k] = id; fila.push(k) } } pecas.push(pc) }
    const compF = Int16Array.from(comp), f1 = []; for (let i = 0; i < N; i++) if (CEL[i]) f1.push(i);
    for (let q = 0; q < f1.length; q++) { const j = f1[q], x = j % MW, y = (j - x) / MW; for (const k of viz(j, x, y)) if (k >= 0 && compF[k] < 0) { compF[k] = compF[j]; f1.push(k) } }
    const dist = new Int16Array(N).fill(-1), f2 = []; for (let i = 0; i < N; i++) if (!CEL[i]) { dist[i] = 0; f2.push(i) }
    for (let q = 0; q < f2.length; q++) { const j = f2[q], x = j % MW, y = (j - x) / MW; for (const k of viz(j, x, y)) if (k >= 0 && dist[k] < 0) { dist[k] = dist[j] + 1; f2.push(k) } }
    [...pecas].sort((a, b) => b.cel.length - a.cel.length).forEach((p, k) => p.n = k + 1);
    for (const p of pecas) { const v = new THREE.Vector3(); let la = 0, lo = 0;
      for (const j of p.cel) { const x = j % MW, y = (j - x) / MW, lon = LON0 + (x + .5) * GRAU, lat = LAT0 - (y + .5) * GRAU; v.add(dirLL(lat, lon)); la += lat; lo += lon }
      p.v = v.normalize(); p.lat = la / p.cel.length; p.lon = lo / p.cel.length }
    const celDe = (fx, fy) => clamp(Math.floor(fy * MH), 0, MH - 1) * MW + clamp(Math.floor(fx * MW), 0, MW - 1);
    // nome do continente: o pedaço de terra onde está a bandeirinha dele
    for (const ct of (info && info.conts) || []) { if (!ct.nome) continue; for (const pt of ct.pontos || []) { const k = compF[celDe(pt.x, pt.y)]; if (k >= 0 && !pecas[k].nome) pecas[k].nome = ct.nome } }
    // lugares marcados no mundo: luz forte e nó da rede
    P.lugares = ((info && info.lugares) || []).map(l => { const lon = LON0 + l.x * MW * GRAU, lat = LAT0 - l.y * MH * GRAU, k = compF[celDe(l.x, l.y)]; if (k >= 0) pecas[k].lugares++;
      return { nome: l.nome || "Lugar", lat, lon, v: dirLL(lat, lon), x: l.x, y: l.y } });
    Object.assign(P, { terraB: borrar(terra, 1, 2), pesos: pesos.map(a => borrar(a, 1, 2)), compF, pecas, dist });
    P.rios = tracarRios(P);
    return P;
  }
  function tracarRios(P) {
    const { MW, MH, CEL, dist } = P, rios = [], usado = new Uint8Array(MW * MH); semente = 77;
    const fontes = []; for (let i = 0; i < MW * MH; i++) if (CEL[i] === 3 && dist[i] >= 4) fontes.push(i);
    const limite = Math.min(40, Math.round(fontes.length / 30) + 4);
    for (let t = 0; t < 600 && rios.length < limite && fontes.length; t++) { let j = fontes[Math.floor(rnd() * fontes.length)]; if (usado[j]) continue; const cam = [j];
      for (let passo = 0; passo < 400; passo++) { const x = j % MW, y = (j - x) / MW, d = dist[j]; if (d <= 0) break; const op = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= MW || yy >= MH) continue; const k = yy * MW + xx; if (dist[k] < d) op.push(k) }
        if (!op.length) break; j = op[Math.floor(rnd() * op.length)]; cam.push(j); if (usado[j]) break }
      if (cam.length < 6) continue; cam.forEach(k => usado[k] = 1);
      let pts = cam.map(k => { const x = k % MW, y = (k - x) / MW; return [x + .5 + (rnd() - .5) * .6, y + .5 + (rnd() - .5) * .6] });
      for (let r = 0; r < 2; r++) { const n = [pts[0]]; for (let q = 0; q < pts.length - 1; q++) { const a = pts[q], b = pts[q + 1]; n.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]) } n.push(pts[pts.length - 1]); pts = n }
      rios.push(pts) }
    return rios;
  }

  /* ---------- texturas: altura, cor (noite azulada), brilho, rugosidade e normais ---------- */
  function texturas(P, TW, TH, renderer) {
    const { MW, MH, GRAU, LON0, LAT0 } = P, N = TW * TH, alt = new Float32Array(N), ids = new Uint8Array(N), terraV = new Float32Array(N), peso = [0, 1, 2, 3].map(() => new Float32Array(N));
    const am = (A, x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, ok = (i, j) => i >= 0 && j >= 0 && i < MW && j < MH;
      const a = ok(x0, y0) ? A[y0 * MW + x0] : 0, b = ok(x0 + 1, y0) ? A[y0 * MW + x0 + 1] : 0, c = ok(x0, y0 + 1) ? A[(y0 + 1) * MW + x0] : 0, d = ok(x0 + 1, y0 + 1) ? A[(y0 + 1) * MW + x0 + 1] : 0;
      return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy };
    const tem = P.pecas.length > 0;
    for (let py = 0; py < TH && tem; py++) { const lat = 90 - (py + .5) / TH * 180, th = (py + .5) / TH * Math.PI, s = Math.sin(th), cy = Math.cos(th), v = (LAT0 - lat) / GRAU;
      for (let px = 0; px < TW; px++) { const i = py * TW + px, lon = (px + .5) / TW * 360 - 180, u = (lon - LON0) / GRAU; if (u < -5 || u > MW + 5 || v < -5 || v > MH + 5) continue;
        const a = 2 * Math.PI * (px + .5) / TW, X = -Math.cos(a) * s, Y = cy, Z = Math.sin(a) * s;
        const w1 = fbm(X * 7 + 1, Y * 7 + 1, Z * 7 + 1, 3) - .5, w2 = fbm(X * 7 + 9, Y * 7 + 9, Z * 7 + 9, 3) - .5, uu = u + w1 * 2, vv = v + w2 * 2, L = am(P.terraB, uu - .5, vv - .5);
        terraV[i] = L; if (L < .4) continue;
        const k = clamp(Math.floor(vv), 0, MH - 1) * MW + clamp(Math.floor(uu), 0, MW - 1); if (L > .5 && P.compF[k] >= 0) ids[i] = Math.min(255, P.compF[k] + 1);
        const wu = uu + w1 * 1.5 - .5, wv = vv + w2 * 1.5 - .5; let pc = am(P.pesos[0], wu, wv), pf = am(P.pesos[1], wu, wv), pm = am(P.pesos[2], wu, wv), pd = am(P.pesos[3], wu, wv);
        const tot = pc + pf + pm + pd || 1; pc /= tot; pf /= tot; pm /= tot; pd /= tot; peso[0][i] = pc; peso[1][i] = pf; peso[2][i] = pm; peso[3][i] = pd;
        let h = .025 + fbm(X * 22 + 4, Y * 22 + 4, Z * 22 + 4, 2) * .05;
        if (pm > .02) h += pm * (.18 + .82 * cristas(X * 16 + 2, Y * 16 + 2, Z * 16 + 2, 4)) * sm(0, .5, pm + .15);
        if (pf > .02) h += pf * fbm(X * 34 + 6, Y * 34 + 6, Z * 34 + 6, 3) * .16;
        if (pd > .02) { const dn = .5 + .5 * Math.sin((X * 170 + Y * 60) + fbm(X * 9, Y * 9, Z * 9, 2) * 14); h += pd * dn * dn * .07 }
        alt[i] = Math.max(0, h * sm(.5, .66, L)) } }
    const novo = () => { const c = document.createElement("canvas"); c.width = TW; c.height = TH; return c };
    // rios: um vale raso por onde a água corre
    const cr = novo(), xr = cr.getContext("2d"); xr.lineCap = xr.lineJoin = "round"; xr.strokeStyle = "#fff";
    const pxDe = (x, y) => [((LON0 + x * GRAU) + 180) / 360 * TW, (90 - (LAT0 - y * GRAU)) / 180 * TH], esc = TW / 2048;
    for (const r of P.rios) for (let q = 0; q < r.length - 1; q++) { const f = q / (r.length - 1), [ax, ay] = pxDe(r[q][0], r[q][1]), [bx, by] = pxDe(r[q + 1][0], r[q + 1][1]); xr.lineWidth = (.9 + f * 2.4) * esc + .3; xr.beginPath(); xr.moveTo(ax, ay); xr.lineTo(bx, by); xr.stroke() }
    const rio = xr.getImageData(0, 0, TW, TH).data; cr.width = cr.height = 1;   // devolve a memória do canvas na hora (o iPhone tem teto baixo)
    for (let i = 0; i < N; i++) { const rv = rio[i * 4] / 255; if (rv > 0) alt[i] *= 1 - .65 * rv }
    const cd = new Uint8Array(N * 4), ed = new Uint8Array(N * 4), rd = new Uint8Array(N * 4), nd = new Uint8Array(N * 4), hd = new Uint8Array(N * 4); semente = 11;
    const inv = (px, py) => ((TH - 1 - py) * TW + px) * 4;   // a textura de bytes começa por baixo (sul); o mapa, por cima
    const ondas = (x, y) => Math.sin(x * .09 + y * .021) * .5 + Math.sin(x * .023 - y * .13 + 1.7) * .35 + Math.sin((x + y) * .31) * .15;
    const dens0 = .0045 * (2048 * 1024) / N;
    for (let py = 0; py < TH; py++) { const lat = 90 - (py + .5) / TH * 180; for (let px = 0; px < TW; px++) { const i = py * TW + px, o = inv(px, py), L = terraV[i], t = sm(.44, .56, L), h = alt[i];
        const raso = sm(.15, .5, L); let r = 4 + 8 * raso, g = 14 + 26 * raso, b = 34 + 46 * raso;
        if (t > 0) { const pc = peso[0][i], pf = peso[1][i], pm = peso[2][i], pd = peso[3][i];
          let lr = 18 * pc + 9 * pf + 38 * pm + 44 * pd, lg = 30 * pc + 28 * pf + 48 * pm + 40 * pd, lb = 48 * pc + 38 * pf + 70 * pm + 52 * pd;
          const neve = sm(.68, .92, h) * pm * .8; lr += (150 - lr) * neve; lg += (172 - lg) * neve; lb += (205 - lb) * neve;
          const rv = rio[i * 4] / 255; lr += (16 - lr) * rv * .8; lg += (64 - lg) * rv * .8; lb += (118 - lb) * rv * .8;
          r += (lr - r) * t; g += (lg - g) * t; b += (lb - b) * t }
        if (Math.abs(lat) > 76) { const gelo = sm(76, 80, Math.abs(lat)); r += (60 - r) * gelo; g += (84 - g) * gelo; b += (118 - b) * gelo }
        cd[o] = r; cd[o + 1] = g; cd[o + 2] = b; cd[o + 3] = 255;
        rd[o] = rd[o + 1] = rd[o + 2] = t > .5 ? 235 : 150 + raso * 30; rd[o + 3] = 255;
        let er = 0, eg = 0, eb = 0;
        if (t > .6) { const dens = peso[0][i] + peso[1][i] * .35 + (peso[2][i] + peso[3][i]) * .12, perto = rio[i * 4] > 0 ? 2.2 : 1;
          if (rnd() < dens * dens0 * perto) { const lz = .55 + rnd() * .45; er = 255 * lz; eg = 196 * lz; eb = 110 * lz } }
        const faixa = Math.max(0, 1 - Math.abs(L - .5) / .05); er += 60 * faixa; eg += 42 * faixa; eb += 20 * faixa;
        ed[o] = Math.min(255, er); ed[o + 1] = Math.min(255, eg); ed[o + 2] = Math.min(255, eb); ed[o + 3] = 255;
        hd[o] = hd[o + 1] = hd[o + 2] = Math.round(h * 255); hd[o + 3] = 255 } }
    const S = 26 * TW / 2048;
    for (let py = 0; py < TH; py++) { const yu = Math.max(0, py - 1), yd = Math.min(TH - 1, py + 1); for (let px = 0; px < TW; px++) { const xl = (px - 1 + TW) % TW, xr2 = (px + 1) % TW, i = py * TW + px, o = inv(px, py);
        let dx = (alt[py * TW + xr2] - alt[py * TW + xl]) * .5 * S, dy = (alt[yd * TW + px] - alt[yu * TW + px]) * .5 * S;
        if (terraV[i] < .5) { const w = .018 * (1 - sm(.3, .5, terraV[i])); dx += (ondas(px + 1, py) - ondas(px - 1, py)) * w * 6; dy += (ondas(px, py + 1) - ondas(px, py - 1)) * w * 6 }
        let a1 = -dx, a2 = dy, a3 = 1; const n = Math.hypot(a1, a2, a3); a1 /= n; a2 /= n; a3 /= n;
        nd[o] = (a1 * .5 + .5) * 255; nd[o + 1] = (a2 * .5 + .5) * 255; nd[o + 2] = (a3 * .5 + .5) * 255; nd[o + 3] = 255 } }
    // lugares marcados: luz dourada forte
    for (const l of P.lugares) { const cx = (l.lon + 180) / 360 * TW, cy = (90 - l.lat) / 180 * TH, rr = 5 * TW / 2048 + 1.5;
      for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr); x <= cx + rr; x++) { if (y < 0 || y >= TH) continue; const xx = (x + TW) % TW, d = Math.hypot(x - cx, y - cy) / rr; if (d >= 1) continue;
        const k = (1 - d) * (1 - d), o = inv(xx, y); ed[o] = Math.min(255, ed[o] + 255 * k); ed[o + 1] = Math.min(255, ed[o + 1] + 215 * k); ed[o + 2] = Math.min(255, ed[o + 2] + 150 * k) } }
    const an = renderer.capabilities.getMaxAnisotropy(), T = a => dados(a, TW, TH, an);
    return { cor: T(cd), luz: T(ed), rug: T(rd), nor: T(nd), alt: T(hd), ids, altArr: alt, peso, TW, TH };
  }
  function dados(a, W, H, an) { const t = new THREE.DataTexture(a, W, H, THREE.RGBAFormat); t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = an || 1; t.needsUpdate = true;
    t.onUpdate = () => { t.image = { width: W, height: H, data: null } };   // já está na placa de vídeo: solta a cópia (o iPhone tem pouca memória)
    return t }
  function nuvensDados(W, H) {
    const d = new Uint8Array(W * H * 4);
    for (let py = 0; py < H; py++) { const th = (py + .5) / H * Math.PI, s = Math.sin(th), cy = Math.cos(th), lat = 90 - (py + .5) / H * 180, faixa = .8 + .2 * Math.cos(lat * Math.PI / 26);
      for (let px = 0; px < W; px++) { const a = 2 * Math.PI * (px + .5) / W, X = -Math.cos(a) * s, Y = cy, Z = Math.sin(a) * s, n = fbm(X * 2.6 + 40, Y * 4.2 + 40, Z * 2.6 + 40, 5), al = sm(.55, .78, n * faixa + .06), o = ((H - 1 - py) * W + px) * 4;
        d[o] = 210; d[o + 1] = 226; d[o + 2] = 255; d[o + 3] = al * 200 } }
    return dados(d, W, H);
  }

  /* ---------- a cena (a mesma para o globo pequeno e a tela cheia) ---------- */
  function cena(canvas, P, q) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setClearColor(0, 0);
    let TX; try { TX = texturas(P, q.TW, q.TH, renderer) } catch (e) { renderer.dispose(); try { renderer.forceContextLoss() } catch (x) { } throw e }
    const DISP = .032, uTempo = { value: 0 };
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, .005, 100); sc.add(cam);
    const pivo = new THREE.Group(), giro = new THREE.Group(); pivo.add(giro); sc.add(pivo);
    const luz = new THREE.DirectionalLight(0xb7d2ff, 1.75); luz.position.set(1.6, 1.1, 1.2); sc.add(luz); sc.add(new THREE.AmbientLight(0x0c1a33, 1));
    const mat = new THREE.MeshStandardMaterial({ map: TX.cor, emissive: 0xffffff, emissiveMap: TX.luz, emissiveIntensity: 1, roughnessMap: TX.rug, roughness: 1, metalness: 0,
      normalMap: TX.nor, displacementMap: TX.alt, displacementScale: DISP });
    mat.onBeforeCompile = sh => { sh.uniforms.uT = uTempo; sh.fragmentShader = "uniform float uT;\n" + sh.fragmentShader
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance*=0.85+0.15*sin(uT*2.3+vUv.x*900.0+vUv.y*700.0);")
      .replace("#include <tonemapping_fragment>", "float frB=1.0-max(dot(normalize(vNormal),normalize(vViewPosition)),0.0);gl_FragColor.rgb+=vec3(0.25,0.6,1.0)*pow(frB,3.5)*1.1;\n#include <tonemapping_fragment>") };
    const globo = new THREE.Mesh(new THREE.SphereGeometry(1, q.seg, q.seg / 2), mat); giro.add(globo);
    pivo.add(new THREE.Mesh(new THREE.SphereGeometry(1.06, 128, 64), new THREE.ShaderMaterial({ uniforms: { c: { value: new THREE.Color(0x3fa2ff) } },
      vertexShader: "varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "uniform vec3 c;varying vec3 vN;void main(){float d=dot(vN,vec3(0.0,0.0,1.0));float i=pow(max(0.0,0.5-d),5.0)*14.0+pow(max(0.0,0.75-d),3.0)*0.35;gl_FragColor=vec4(c*i,min(1.0,i));}",
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })));
    const nuvens = new THREE.Mesh(new THREE.SphereGeometry(1 + DISP + .012, 128, 64), new THREE.MeshStandardMaterial({ map: nuvensDados(q.TW / 2, q.TH / 2), transparent: true, opacity: .55, depthWrite: false, roughness: 1, metalness: 0 }));
    pivo.add(nuvens);
    // rede dourada: liga as terras e os lugares mais perto entre si
    const rede = new THREE.Group(); giro.add(rede);
    const nos = P.pecas.filter(p => p.cel.length >= 30).map(p => ({ v: p.v })).concat(P.lugares.map(l => ({ v: l.v }))), pares = new Set();
    nos.forEach((c, i) => { const d = nos.map((o, j) => [j, c.v.angleTo(o.v)]).filter(([j]) => j !== i).sort((a, b) => a[1] - b[1]); [d[0], d[1], d[Math.min(d.length - 1, 3 + (i % 3))]].filter(Boolean).forEach(([j]) => pares.add(i < j ? `${i}-${j}` : `${j}-${i}`)) });
    let k = 0; for (const s of pares) { const [i, j] = s.split("-").map(Number), A = nos[i].v, B = nos[j].v, alt = .05 + A.angleTo(B) * .06, p = [], f = [];
      for (let w = 0; w <= 64; w++) { const t = w / 64, v = new THREE.Vector3().copy(A).lerp(B, t).normalize().multiplyScalar(1 + DISP * .6 + Math.sin(Math.PI * t) * alt); p.push(v.x, v.y, v.z); f.push(t) }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); g.setAttribute("f", new THREE.Float32BufferAttribute(f, 1));
      rede.add(new THREE.Line(g, new THREE.ShaderMaterial({ uniforms: { t: uTempo, o: { value: (k * .618) % 1 }, c: { value: new THREE.Color(0xffc46b) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: "attribute float f;varying float vf;varying float vz;void main(){vf=f;vec4 mv=modelViewMatrix*vec4(position,1.0);vz=normalize(normalMatrix*position).z;gl_Position=projectionMatrix*mv;}",
        fragmentShader: "uniform float t;uniform float o;uniform vec3 c;varying float vf;varying float vz;void main(){float p=fract(t*0.18+o);float k=0.45+smoothstep(0.07,0.0,abs(vf-p))*1.5;k*=0.15+0.85*smoothstep(-0.2,0.35,vz);gl_FragColor=vec4(c*k,k);}" }))); k++ }
    // árvores: só na tela cheia, aparecem de perto
    let arvores = null;
    if (q.arvores) { const pontos = []; semente = 21;
      for (let t = 0; t < 400000 && pontos.length < q.arvores; t++) { const px = Math.floor(rnd() * TX.TW), py = Math.floor(rnd() * TX.TH), i = py * TX.TW + px; if (TX.peso[1][i] > .55 && TX.altArr[i] > 0) pontos.push([px, py, TX.altArr[i]]) }
      if (pontos.length) { const geo = new THREE.ConeGeometry(.0019, .0068, 5); geo.translate(0, .0034, 0);
        arvores = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0x1d4a3c, roughness: .9, flatShading: true }), pontos.length);
        const m = new THREE.Matrix4(), qq = new THREE.Quaternion(), cima = new THREE.Vector3(0, 1, 0), e = new THREE.Vector3();
        pontos.forEach(([px, py, h], n) => { const d = dirLL(90 - (py + .5) / TX.TH * 180, (px + .5) / TX.TW * 360 - 180); qq.setFromUnitVectors(cima, d); const s = .7 + rnd() * .7; e.set(s, s * (.8 + rnd() * .5), s);
          m.compose(d.clone().multiplyScalar(1 + h * DISP - .0005), qq, e); arvores.setMatrixAt(n, m) });
        arvores.visible = false; giro.add(arvores) } }
    TX.peso = TX.altArr = null;
    if (q.estrelas) { const n = 1800, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); pos[i * 3] = r * Math.cos(a) * 50; pos[i * 3 + 1] = u * 50; pos[i * 3 + 2] = r * Math.sin(a) * 50 }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); sc.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfe3ff, size: 1.2, sizeAttenuation: false, transparent: true, opacity: .6, depthWrite: false }))) }
    // de frente para o meio do mapa
    const meio = dirLL(0, 0);
    return { renderer, sc, cam, pivo, giro, globo, nuvens, rede, arvores, TX, DISP, uTempo, yaw0: Math.atan2(-meio.x, meio.z) + .75 };
  }

  let CHEIA = null;
  function liberar(C) { if (!C) return; C.sc.traverse(o => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? [].concat(o.material) : [];
      ms.forEach(m => { for (const k in m) if (m[k] && m[k].isTexture) m[k].dispose(); m.dispose() }) });
    C.renderer.dispose(); try { C.renderer.forceContextLoss() } catch (e) { } }

  /* ---------- o globo pequeno do Início: só gira e flutua; pausa fora da tela ---------- */
  function mini(canvas, info) {
    const P = preparar(info), Q = { TW: 1024, TH: 512, seg: 160, arvores: 0, estrelas: false }, caixa = canvas.parentElement;
    const C = cena(canvas, P, Q); let vivo = true, visto = true, ult = 0, yaw = C.yaw0, base = 4;
    const medir = () => { const w = canvas.clientWidth || 300, h = canvas.clientHeight || 260; C.renderer.setSize(w, h, false); C.cam.aspect = w / h; C.cam.updateProjectionMatrix();
      const t = Math.tan(C.cam.fov * Math.PI / 360); base = Math.max(1 / (.84 * t), 1 / (.84 * t * C.cam.aspect)) };
    medir(); addEventListener("resize", medir);
    new IntersectionObserver(es => { visto = es[0].isIntersecting; if (visto && vivo) requestAnimationFrame(quadro) }).observe(caixa);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && vivo && visto) requestAnimationFrame(quadro) });
    function quadro(ms) {
      if (!vivo || !visto || document.hidden) return;
      const t = ms / 1000, dt = Math.min(.05, t - (ult || t)); ult = t; C.uTempo.value = t;
      if (!RM) yaw += dt * .09;
      C.giro.rotation.y = yaw; C.pivo.rotation.x = .24; C.nuvens.rotation.y = yaw + t * .005; C.pivo.position.y = RM ? 0 : Math.sin(t * .6) * .03;
      C.cam.position.set(0, 0, base); C.cam.lookAt(0, 0, 0); C.renderer.render(C.sc, C.cam);
      if (!RM) requestAnimationFrame(quadro);
    }
    requestAnimationFrame(quadro);
    return { P, pausar() { vivo = false }, seguir() { if (vivo) return; vivo = true; ult = 0; requestAnimationFrame(quadro) } };
  }

  /* ---------- a tela cheia: arrastar com embalo, aproximar, clicar numa terra, chegar perto ---------- */
  function abrir(el, P, nomeMundo, aoFechar) {
    const $ = s => el.querySelector(s), sobre = $(".gt-sobre"), cartao = $(".gt-cartao"), dica = $(".gt-dica"), aviso = $(".gt-aviso");
    const TOQUE = matchMedia("(pointer: coarse)").matches;
    // o planeta da tela cheia é montado uma vez só e guardado: refazer a cada abertura estourava a memória do iPhone
    let tela = $(".gt-gl"); const reusar = !!(CHEIA && CHEIA.P === P && CHEIA.tela === tela);
    if (!reusar) { if (CHEIA) { liberar(CHEIA.C); CHEIA = null } const n = tela.cloneNode(false); tela.replaceWith(n); tela = n }
    $(".gt-nome").textContent = nomeMundo || "Mundo de UDA";
    $(".gt-vazio").hidden = P.pecas.length > 0;
    dica.textContent = TOQUE ? "Arraste para girar · dois dedos aproximam · toque numa terra" : "Arraste para girar · role para aproximar · clique numa terra";
    dica.classList.remove("some"); cartao.dataset.aberto = "nao"; aviso.classList.remove("some"); sobre.textContent = "";
    let C = null, vivo = true;
    // parar: só para de desenhar e de ouvir (quem esconde a tela é o Início); o botão Fechar e o Esc pedem para fechar
    const parar = () => { vivo = false; removeEventListener("resize", medir); removeEventListener("keydown", tecla) };
    const pedirFechar = () => { if (aoFechar) aoFechar() };
    const tecla = e => { if (e.key === "Escape") { if (modo !== "mundo") voltar(); else pedirFechar() } };
    addEventListener("keydown", tecla);
    let yaw = 0, pitch = .22, vyaw = 0, vpitch = 0, tYaw = 0, tPitch = 0, indo = false, modo = "mundo", foco = null, zoomUser = 1, dist = 7, base = 4.4, ultimoToque = -10, agora = 0, comRede = true, comNuvens = true, opN = .55, LW = 1, LH = 1;
    function medir() { if (!C) return; LW = tela.clientWidth; LH = tela.clientHeight; C.renderer.setSize(LW, LH, false); C.cam.aspect = LW / LH; C.cam.updateProjectionMatrix();
      const t = Math.tan(C.cam.fov * Math.PI / 360), ocupa = LW < 600 ? .8 : .66; base = Math.max(1 / (ocupa * t), 1 / (ocupa * t * C.cam.aspect)) }
    const bR = $(".gt-rede"), bN = $(".gt-nuvens");
    bR.setAttribute("aria-pressed", "true"); bN.setAttribute("aria-pressed", "true");
    bR.onclick = () => { comRede = !comRede; bR.setAttribute("aria-pressed", String(comRede)) };
    bN.onclick = () => { comNuvens = !comNuvens; bN.setAttribute("aria-pressed", String(comNuvens)) };
    $(".gt-fechar").onclick = pedirFechar;
    const ang = a => { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI };
    const mirar = v => { tYaw = Math.atan2(-v.x, v.z); tPitch = Math.atan2(v.y, Math.hypot(v.x, v.z)); indo = true };
    const nomeDe = p => p.nome || `Terra ${p.n}`;
    function focar(p) { modo = "terra"; foco = p; zoomUser = 1; mirar(p.v); const tam = p.cel.length, tipo = tam >= 600 ? "Continente" : tam >= 120 ? "Terra" : "Ilha";
      $(".gt-olho").textContent = p.nome ? tipo : tipo + " · ainda sem nome"; $(".gt-titulo").textContent = nomeDe(p);
      $(".gt-coord").textContent = `${coord(p.lat, p.lon)} · ${tam.toLocaleString("pt-BR")} quadradinhos` + (p.lugares ? ` · ${p.lugares} ${p.lugares === 1 ? "lugar" : "lugares"}` : "");
      const ul = $(".gt-compo"); ul.textContent = "";
      [1, 2, 3, 4].filter(t => p.tipos[t]).sort((a, b) => p.tipos[b] - p.tipos[a]).forEach(t => { const pc = Math.round(p.tipos[t] / tam * 100), li = document.createElement("li");
        li.innerHTML = '<span></span><span class="gt-barra-t"><i></i></span><span class="gt-pc"></span>'; li.children[0].textContent = NOMES_T[t];
        const i = li.querySelector("i"); i.style.width = Math.max(2, pc) + "%"; i.style.background = CORES_T[t]; li.children[2].textContent = pc + "%"; ul.appendChild(li) });
      cartao.dataset.aberto = "sim"; dica.classList.add("some"); rotulos.forEach(o => o.el.classList.toggle("sel", o.p === p)) }
    function voltar() { modo = "mundo"; foco = null; zoomUser = 1; indo = false; cartao.dataset.aberto = "nao"; ultimoToque = agora; rotulos.forEach(o => o.el.classList.remove("sel")) }
    $(".gt-volta").onclick = voltar; $(".gt-perto").onclick = () => { if (foco) { modo = "perto"; zoomUser = 1; mirar(foco.v) } };
    // nomes das terras maiores e dos lugares
    const rotulos = [];
    P.pecas.filter(p => p.cel.length >= 120 || p.nome).sort((a, b) => a.n - b.n).forEach(p => { const b = document.createElement("button"); b.type = "button"; b.className = "gt-rot"; b.innerHTML = "<i></i><span></span>";
      b.querySelector("span").textContent = nomeDe(p); b.onclick = () => focar(p); sobre.appendChild(b); rotulos.push({ p, el: b, v: p.v, terra: true }) });
    P.lugares.forEach(l => { const b = document.createElement("span"); b.className = "gt-rot gt-lugar"; b.innerHTML = "<i></i><span></span>"; b.querySelector("span").textContent = l.nome; sobre.appendChild(b); rotulos.push({ el: b, v: l.v, terra: false }) });

    // montar depois de pintar o aviso (a conta das montanhas leva uns segundos no celular)
    setTimeout(() => {
      if (!vivo) return;
      const leve = TOQUE || Math.min(screen.width, screen.height) < 700;
      const niveis = leve ? [{ TW: 2048, TH: 1024, seg: 320, arvores: 9000, estrelas: true }, { TW: 1024, TH: 512, seg: 256, arvores: 5000, estrelas: true }]
        : [{ TW: 2048, TH: 1024, seg: 512, arvores: 14000, estrelas: true }, { TW: 1024, TH: 512, seg: 256, arvores: 6000, estrelas: true }];
      let erro = null;
      if (reusar) C = CHEIA.C;
      else for (const q of niveis) { try { C = cena(tela, P, q); CHEIA = { C, P, tela }; erro = null; break } catch (e) { erro = e; console.error(e) } }
      if (!C) { aviso.innerHTML = 'Não consegui abrir o mundo em 3D neste aparelho.<br><small style="opacity:.7;font-size:12px"></small>'; aviso.querySelector("small").textContent = String(erro && (erro.message || erro)).slice(0, 160); return }
      yaw = C.yaw0; addEventListener("resize", medir); medir(); dist = base * 1.3; aviso.classList.add("some"); requestAnimationFrame(quadro);
    }, 60);

    const ptrs = new Map(); let arrasto = null, pinca = 0; const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function acerto(cx, cy) { if (!C) return null; const r = tela.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, C.cam);
      const h = ray.intersectObject(C.globo, false)[0]; if (!h) return null; const x = Math.min(C.TX.TW - 1, Math.floor(h.uv.x * C.TX.TW)), y = Math.min(C.TX.TH - 1, Math.floor((1 - h.uv.y) * C.TX.TH)), id = C.TX.ids[y * C.TX.TW + x]; return id ? P.pecas[id - 1] : 0 }
    tela.onpointerdown = e => { tela.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { arrasto = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), t: performance.now(), moveu: false }; vyaw = vpitch = 0; indo = false }
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinca = Math.hypot(a.x - b.x, a.y - b.y); arrasto = null } ultimoToque = agora };
    tela.onpointermove = e => { if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinca > 0) zoomUser = clamp(zoomUser * pinca / d, .22, 1.35); pinca = d; ultimoToque = agora; return }
      if (!arrasto) { if (!TOQUE) { const p = acerto(e.clientX, e.clientY); tela.classList.toggle("mao", !!(p && p.cel.length >= 8)) } return }
      const now = performance.now(), dx = e.clientX - arrasto.x, dy = e.clientY - arrasto.y, dtm = Math.max(8, now - arrasto.t) / 1000;
      if (Math.hypot(e.clientX - arrasto.x0, e.clientY - arrasto.y0) > 5) { arrasto.moveu = true; tela.classList.add("arrasta") }
      if (arrasto.moveu) { const k = .0052 * ((dist - 1) / (base - 1)); yaw += dx * k; pitch = clamp(pitch + dy * k, -1.25, 1.25); vyaw = vyaw * .4 + (dx * k / dtm) * .6; vpitch = vpitch * .4 + (dy * k / dtm) * .6; dica.classList.add("some") }
      arrasto.x = e.clientX; arrasto.y = e.clientY; arrasto.t = now; ultimoToque = agora };
    const solta = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinca = 0; tela.classList.remove("arrasta");
      if (arrasto && !arrasto.moveu && performance.now() - arrasto.t0 < 450) { vyaw = vpitch = 0; const p = acerto(e.clientX, e.clientY); if (p && p.cel.length >= 8 && p !== foco) focar(p); else if (p === 0 && modo !== "mundo") voltar() }
      if (arrasto && performance.now() - arrasto.t > 90) { vyaw *= .2; vpitch *= .2 } arrasto = null; ultimoToque = agora };
    tela.onpointerup = solta; tela.onpointercancel = solta; tela.onpointerleave = () => tela.classList.remove("mao");
    tela.onwheel = e => { e.preventDefault(); zoomUser = clamp(zoomUser * Math.exp(e.deltaY * .0011), .22, 1.35); ultimoToque = agora; dica.classList.add("some") };

    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), centro = new THREE.Vector3();
    const tela2 = v => { tmp2.copy(v).project(C.cam); return { x: (tmp2.x + 1) / 2 * LW, y: (1 - tmp2.y) / 2 * LH } };
    let ultimo = 0;
    function quadro(ms) {
      if (!vivo || !C) return; requestAnimationFrame(quadro);
      agora = ms / 1000; const dt = Math.min(.05, agora - ultimo || .016); ultimo = agora; C.uTempo.value = agora;
      if (!arrasto && ptrs.size === 0) {
        if (indo) { const k = 1 - Math.exp(-dt * (RM ? 14 : 3.2)); yaw += ang(tYaw - yaw) * k; pitch += (tPitch - pitch) * k; if (Math.abs(ang(tYaw - yaw)) < .0015 && Math.abs(tPitch - pitch) < .0015) indo = false }
        else { const parado = agora - ultimoToque > 2.5, auto = modo === "mundo" && parado && !RM ? .06 : 0; vyaw += (auto - vyaw) * (1 - Math.exp(-dt * 1.4)); vpitch *= Math.exp(-dt * 2.4);
          yaw += vyaw * dt; pitch = clamp(pitch + vpitch * dt, -1.25, 1.25); if (modo === "mundo" && parado) pitch += (.22 - pitch) * (1 - Math.exp(-dt * .5)) } }
      C.giro.rotation.y = yaw; C.pivo.rotation.x = pitch; C.nuvens.rotation.y = yaw + (RM ? 0 : agora * .005);
      opN += ((comNuvens ? (modo === "perto" ? .18 : .55) : 0) - opN) * (1 - Math.exp(-dt * 3)); C.nuvens.material.opacity = opN; C.nuvens.visible = opN > .01;
      const alvo = (modo === "mundo" ? base : modo === "terra" ? 1 + (base - 1) * .5 : 1 + (base - 1) * .13) * zoomUser; dist += (Math.max(1.09, alvo) - dist) * (1 - Math.exp(-dt * (RM ? 12 : 2.6)));
      if (C.arvores) C.arvores.visible = dist < 1 + (base - 1) * .42;
      C.rede.visible = comRede && modo !== "perto";
      C.pivo.position.y = RM || modo === "perto" ? 0 : Math.sin(agora * .5) * .018;
      const kp = sm(1 + (base - 1) * .4, 1 + (base - 1) * .12, dist), incl = kp * .6, D = dist - 1;
      C.cam.position.set(0, -Math.sin(incl) * D, 1 + Math.cos(incl) * D); C.cam.lookAt(0, kp * .08, kp * .96);
      C.sc.updateMatrixWorld(); C.renderer.render(C.sc, C.cam);
      C.pivo.getWorldPosition(centro); const usados = [], perto = dist < 1 + (base - 1) * .6;
      for (const r of rotulos) { tmp.copy(r.v).multiplyScalar(1 + C.DISP * .5).applyMatrix4(C.giro.matrixWorld);
        const f = tmp.clone().sub(centro).normalize().dot(tmp2.copy(C.cam.position).sub(tmp).normalize()), Pt = tela2(tmp);
        let op = (r.terra ? modo !== "perto" : perto) ? sm(.2, .45, f) : 0;
        if (op > .05) { if (usados.some(u => Math.abs(u.x - Pt.x) < 100 && Math.abs(u.y - Pt.y) < 22)) op = 0; else usados.push(Pt) }
        r.el.style.transform = `translate(${Pt.x - 10}px,${Pt.y - 15}px)`; r.el.style.opacity = op; r.el.style.pointerEvents = r.terra && op > .3 ? "auto" : "none"; if (r.terra) r.el.tabIndex = op > .3 ? 0 : -1 }
    }
    return { parar, fechar: parar };
  }

  return { carregarDoInicio, preparar, mini, abrir };
})();
