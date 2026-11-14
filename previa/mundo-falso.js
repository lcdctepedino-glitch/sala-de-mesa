/* Prévia do Mundo no claude.ai: faz o papel de js/mundo-dados.js com um mundo de exemplo guardado só na memória.
   O modo jogador filtra igual à função mundo_jogador do Supabase (supabase/mundo.sql). */
const MD = (() => {
  let papel = "mestre", OUVIR = null, n = 0;
  const IMGS = {};
  const B = { mesa: { id: "exemplo", nome: "Costa de Vael", imagem_atual: null }, mapas: [], paginas: [], seg: {} };
  const id = () => "id" + (++n);

  /* ----- desenhos dos mapas de exemplo ----- */
  function rnd(seed) { return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 } }
  const CX = 800, CY = 500, RX = 560, RY = 360;
  const bR = t => 1 + .10 * Math.sin(3 * t + .5) + .07 * Math.sin(5 * t + 1.3) + .05 * Math.sin(9 * t + 2.1) + .03 * Math.sin(15 * t + .7);
  const costa = (t, k = 1) => [CX + Math.cos(t) * RX * bR(t) * k, CY + Math.sin(t) * RY * bR(t) * k];
  function blob(k) { let d = ""; for (let i = 0; i <= 360; i++) { const [x, y] = costa(i / 360 * 2 * Math.PI, k); d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) } return d + "Z" }
  function terra(x, y) { const t = Math.atan2((y - CY) / RY, (x - CX) / RX), r = Math.hypot((x - CX) / RX, (y - CY) / RY); return r / bR(t) }
  const PORTO = costa(.9, .985), PONTE = [960, 430], TORRE = [610, 270], VAEL = [790, 540], MINA = [430, 600];
  function desenhaMundo() {
    const c = document.createElement("canvas"); c.width = 1600; c.height = 1000; const g = c.getContext("2d"), R = rnd(7);
    g.fillStyle = "#93a8a3"; g.fillRect(0, 0, 1600, 1000);
    g.strokeStyle = "rgba(58,46,32,.18)"; g.lineWidth = 1.4;
    for (let i = 0; i < 900; i++) { const x = R() * 1600, y = R() * 1000; if (terra(x, y) < 1.08) continue; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 7, y - 4, x + 14, y); g.stroke() }
    const ilha = new Path2D(blob(1));
    [1.07, 1.035].forEach((k, i) => { g.strokeStyle = `rgba(58,46,32,${.22 + i * .12})`; g.lineWidth = 1.5; g.stroke(new Path2D(blob(k))) });
    g.fillStyle = "#e6d8b5"; g.fill(ilha);
    g.save(); g.clip(ilha); g.fillStyle = "rgba(120,100,60,.07)"; for (let i = 0; i < 500; i++) { g.beginPath(); g.arc(R() * 1600, R() * 1000, 2 + R() * 24, 0, 7); g.fill() } g.restore();
    g.strokeStyle = "#3a2e20"; g.lineWidth = 3.2; g.stroke(ilha);
    g.strokeStyle = "#6f8f95"; g.lineWidth = 5; g.lineCap = "round"; g.beginPath(); g.moveTo(740, 190); g.bezierCurveTo(860, 250, 950, 330, PONTE[0], PONTE[1]); g.bezierCurveTo(970, 540, PORTO[0] - 80, PORTO[1] - 120, PORTO[0] + 12, PORTO[1] + 10); g.stroke();
    g.strokeStyle = "#3a2e20"; g.lineWidth = 1.2; g.stroke();
    g.setLineDash([9, 8]); g.strokeStyle = "rgba(58,46,32,.7)"; g.lineWidth = 2.2;
    g.beginPath(); g.moveTo(PONTE[0], PONTE[1]); g.bezierCurveTo(1060, 520, 1040, 640, PORTO[0], PORTO[1]); g.stroke();
    g.beginPath(); g.moveTo(PONTE[0], PONTE[1]); g.bezierCurveTo(840, 400, 700, 330, TORRE[0], TORRE[1]); g.stroke();
    g.beginPath(); g.moveTo(PORTO[0], PORTO[1]); g.bezierCurveTo(800, 720, 560, 700, MINA[0], MINA[1]); g.stroke(); g.setLineDash([]);
    const picos = []; for (let i = 0; i < 60 && picos.length < 30; i++) { const x = TORRE[0] + (R() - .5) * 360, y = TORRE[1] + (R() - .5) * 150; if (terra(x, y) > .86 || Math.hypot(x - TORRE[0], y - TORRE[1]) < 34) continue; picos.push([x, y, 16 + R() * 16]) }
    picos.sort((a, b) => a[1] - b[1]).forEach(([x, y, s]) => {
      g.fillStyle = "#e6d8b5"; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x, y - s * 1.2); g.lineTo(x + s, y); g.closePath(); g.fill();
      g.fillStyle = "rgba(58,46,32,.28)"; g.beginPath(); g.moveTo(x, y - s * 1.2); g.lineTo(x + s, y); g.lineTo(x + s * .15, y); g.closePath(); g.fill();
      g.strokeStyle = "#3a2e20"; g.lineWidth = 2; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x, y - s * 1.2); g.lineTo(x + s, y); g.stroke()
    });
    const arv = []; for (let i = 0; i < 220 && arv.length < 90; i++) { const x = VAEL[0] + (R() - .5) * 330, y = VAEL[1] + (R() - .5) * 190; if (terra(x, y) > .84 || (((x - VAEL[0]) / 165) ** 2 + ((y - VAEL[1]) / 95) ** 2) > 1) continue; arv.push([x, y, 7 + R() * 5]) }
    arv.sort((a, b) => a[1] - b[1]).forEach(([x, y, r]) => { g.fillStyle = "#9aa678"; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = "#3a2e20"; g.lineWidth = 1.5; g.stroke(); g.beginPath(); g.moveTo(x, y + r); g.lineTo(x, y + r + 5); g.stroke() });
    g.save(); g.translate(1450, 150); g.strokeStyle = "#3a2e20"; g.fillStyle = "#3a2e20"; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, 38, 0, 7); g.stroke();
    for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.beginPath(); g.moveTo(0, -56); g.lineTo(9, 0); g.lineTo(-9, 0); g.closePath(); i % 2 ? g.stroke() : g.fill() }
    g.font = "600 22px Spectral, Georgia, serif"; g.textAlign = "center"; g.fillText("N", 0, -64); g.restore();
    g.fillStyle = "rgba(58,46,32,.75)"; g.font = "italic 30px Spectral, Georgia, serif"; g.fillText("Mar das Cinzas", 1210, 900);
    return c.toDataURL("image/jpeg", .86);
  }
  function desenhaCidade() {
    const c = document.createElement("canvas"); c.width = 1200; c.height = 800; const g = c.getContext("2d"), R = rnd(21);
    g.fillStyle = "#e6d8b5"; g.fillRect(0, 0, 1200, 800);
    const mar = new Path2D("M640,800 C780,640 980,590 1200,560 L1200,800Z"); g.fillStyle = "#93a8a3"; g.fill(mar); g.strokeStyle = "#3a2e20"; g.lineWidth = 3; g.stroke(mar);
    g.strokeStyle = "#6f8f95"; g.lineWidth = 26; g.lineCap = "round"; g.beginPath(); g.moveTo(330, 0); g.bezierCurveTo(420, 240, 560, 300, 700, 520); g.lineTo(780, 700); g.stroke();
    g.lineWidth = 1.5; g.strokeStyle = "#3a2e20"; g.stroke();
    const ex = (x, y) => ((x - 560) / 330) ** 2 + ((y - 400) / 270) ** 2;
    g.save(); g.translate(560, 400); g.rotate(.12);
    for (let gx = -14; gx < 14; gx++) for (let gy = -11; gy < 11; gy++) {
      if (((gx + 40) % 5) === 0 || ((gy + 40) % 4) === 0) continue;
      const x = gx * 24, y = gy * 24, ax = 560 + x * Math.cos(.12) - y * Math.sin(.12), ay = 400 + x * Math.sin(.12) + y * Math.cos(.12);
      if (ex(ax, ay) > .92 || g.isPointInPath(mar, ax, ay) || Math.hypot(ax - 640, ay - 410) < 70) continue;
      if (Math.abs(ax - ((ay < 300) ? 330 + ay * .6 : 500 + (ay - 300) * .8)) < 40) continue;
      g.fillStyle = R() < .12 ? "#c9b48a" : "#d7c59c"; g.fillRect(x + 2, y + 2, 20, 20); g.strokeStyle = "rgba(58,46,32,.75)"; g.lineWidth = 1.2; g.strokeRect(x + 2, y + 2, 20, 20)
    }
    g.restore();
    g.strokeStyle = "#3a2e20"; g.lineWidth = 6; g.beginPath(); for (let i = 0; i <= 40; i++) { const t = i / 40 * Math.PI * 2, x = 560 + Math.cos(t) * 350, y = 400 + Math.sin(t) * 290; if (g.isPointInPath(mar, x, y)) { g.moveTo(x, y); continue } i ? g.lineTo(x, y) : g.moveTo(x, y) } g.stroke();
    g.strokeStyle = "#3a2e20"; g.lineWidth = 2; g.beginPath(); g.arc(640, 410, 58, 0, 7); g.stroke();
    g.fillStyle = "#d7c59c"; g.fillRect(900, 640, 110, 14); g.strokeRect(900, 640, 110, 14); g.beginPath(); g.arc(1012, 646, 16, 0, 7); g.fillStyle = "#e6d8b5"; g.fill(); g.stroke();
    g.fillStyle = "rgba(58,46,32,.75)"; g.font = "italic 26px Spectral, Georgia, serif"; g.fillText("Mar das Cinzas", 960, 760);
    return c.toDataURL("image/jpeg", .86);
  }
  const SALAS = { 1: [2, 2, 5, 4], 2: [10, 3, 6, 5], 3: [19, 2, 6, 6], 4: [11, 12, 7, 5], 5: [21, 12, 6, 5] }, CORR = [[7, 4, 3, 1], [16, 5, 3, 1], [14, 8, 1, 4], [18, 14, 3, 1]];
  function desenhaMasmorra() {
    const c = document.createElement("canvas"); c.width = 1200; c.height = 800; const g = c.getContext("2d"), R = rnd(5), L = 40;
    g.fillStyle = "#efe9dc"; g.fillRect(0, 0, 1200, 800);
    const chao = new Set(); [...Object.values(SALAS), ...CORR].forEach(([x, y, w, h]) => { for (let i = x; i < x + w; i++) for (let j = y; j < y + h; j++) chao.add(i + "," + j) });
    const tem = (i, j) => chao.has(i + "," + j);
    g.strokeStyle = "#2b2723"; g.lineWidth = 1.6;
    for (let i = 0; i < 30; i++) for (let j = 0; j < 20; j++) {
      if (tem(i, j)) continue; let perto = false; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (tem(i + a, j + b)) perto = true; if (!perto) continue;
      for (let k = 0; k < 4; k++) { const x = i * L + R() * L, y = j * L + R() * L, an = R() * Math.PI; g.beginPath(); g.moveTo(x - Math.cos(an) * 8, y - Math.sin(an) * 8); g.lineTo(x + Math.cos(an) * 8, y + Math.sin(an) * 8); g.stroke() }
    }
    chao.forEach(k => { const [i, j] = k.split(",").map(Number); g.fillStyle = "#fbf8f1"; g.fillRect(i * L, j * L, L, L) });
    g.strokeStyle = "rgba(43,39,35,.16)"; g.lineWidth = 1; chao.forEach(k => { const [i, j] = k.split(",").map(Number); g.strokeRect(i * L, j * L, L, L) });
    g.strokeStyle = "#1c1916"; g.lineWidth = 6; g.lineCap = "square";
    chao.forEach(k => {
      const [i, j] = k.split(",").map(Number), x = i * L, y = j * L; g.beginPath();
      if (!tem(i, j - 1)) { g.moveTo(x, y); g.lineTo(x + L, y) } if (!tem(i, j + 1)) { g.moveTo(x, y + L); g.lineTo(x + L, y + L) }
      if (!tem(i - 1, j)) { g.moveTo(x, y); g.lineTo(x, y + L) } if (!tem(i + 1, j)) { g.moveTo(x + L, y); g.lineTo(x + L, y + L) } g.stroke()
    });
    g.fillStyle = "#1c1916"; [[7, 4], [16, 5], [14, 8], [18, 14]].forEach(([i, j], k) => { const x = i * L, y = j * L; k === 2 ? g.fillRect(x + 6, y - 4, L - 12, 8) : g.fillRect(x - 4, y + 6, 8, L - 12) });
    return c.toDataURL("image/jpeg", .88);
  }

  /* ----- o mundo de exemplo ----- */
  function montar() {
    IMGS["img:mundo"] = desenhaMundo(); IMGS["img:cidade"] = desenhaCidade(); IMGS["img:masmorra"] = desenhaMasmorra();
    const agora = Date.now();
    const pag = (nome, tipo, estado, texto, segredo, onde, extra) => {
      const p = { id: id(), tipo, nome, texto, estado, mapa_id: onde ? onde[0] : null, x: onde ? onde[1] : null, y: onde ? onde[2] : null, na_cena: false, atualizado_em: new Date(agora - n * 60000).toISOString(), ...extra };
      B.paginas.push(p); B.seg[p.id] = segredo; return p;
    };
    const mundo = { id: id(), nome: "Mundo", imagem: "img:mundo", largura: 1600, altura: 1000, lugar_id: null };
    B.mapas.push(mundo);
    const em = (m, x, y) => [m.id, x / m.largura, y / m.altura];
    const porto = pag("Porto Cinzento", "Cidade", "visitado", "Cidade portuária na foz do [[Rio Lento]]. Tem o maior mercado de peixe da costa e um [[Farol apagado]] que está apagado há três luas. Quem manda no cais é a capitã [[Mirela]].", "Quem apagou o farol foi a [[Irmandade do Sal]], para afundar navios e saquear a carga. Os [[Esgotos de Porto Cinzento]] ligam a cidade à [[Mina Afundada]].", em(mundo, PORTO[0], PORTO[1]));
    pag("Ponte-Velha", "Vila", "visitado", "Vila de pescadores e lenhadores junto à ponte de pedra mais antiga do [[Rio Lento]]. Foi daqui que o grupo partiu.", "O ferreiro da vila deve dinheiro à [[Irmandade do Sal]] e conta tudo o que ouve.", em(mundo, ...PONTE));
    pag("Torre do Lírio", "Ruína", "conhecido", "Torre de um mago antigo nas colinas do norte. Os moradores de [[Ponte-Velha]] evitam a estrada que passa perto.", "O mago não morreu: virou o guardião do último andar e procura um aprendiz.", em(mundo, ...TORRE));
    pag("Bosque de Vael", "Região", "conhecido", "Bosque fechado entre as colinas e o [[Rio Lento]]. Dizem que as árvores mudam de lugar à noite.", "Uma dríade protege o bosque e pode virar aliada contra a [[Irmandade do Sal]].", em(mundo, ...VAEL));
    pag("Mina Afundada", "Masmorra", "oculto", "Mina de prata abandonada depois de um desmoronamento.", "Kobolds cavaram um túnel até os [[Esgotos de Porto Cinzento]].", em(mundo, ...MINA));
    pag("Rio Lento", "Lugar", "visitado", "Nasce nas colinas, passa sob a ponte de [[Ponte-Velha]] e deságua em [[Porto Cinzento]].", "Barcos da [[Irmandade do Sal]] descem o rio à noite, sem lanterna.", em(mundo, 905, 330));
    const cidade = { id: id(), nome: "Porto Cinzento", imagem: "img:cidade", largura: 1200, altura: 800, lugar_id: porto.id };
    B.mapas.push(cidade);
    pag("Farol apagado", "Lugar", "visitado", "Farol de pedra na ponta do quebra-mar de [[Porto Cinzento]]. A chama está apagada.", "A porta de baixo tem uma fechadura nova, da [[Irmandade do Sal]].", em(cidade, 1012, 676));
    pag("Mercado do Peixe", "Lugar", "visitado", "Praça coberta no centro de [[Porto Cinzento]]. Barulhento de manhã, vazio à tarde.", "Atrás da peixaria fica o poço seco que desce aos [[Esgotos de Porto Cinzento]].", em(cidade, 640, 410));
    const esgotos = pag("Esgotos de Porto Cinzento", "Masmorra", "conhecido", "Túneis velhos sob o [[Mercado do Peixe]]. Ninguém desce lá desde a última enchente.", "A sala 4 tem a passagem escavada que leva à [[Mina Afundada]].", em(cidade, 400, 560));
    const masmorra = { id: id(), nome: "Esgotos", imagem: "img:masmorra", largura: 1200, altura: 800, lugar_id: esgotos.id };
    B.mapas.push(masmorra);
    const sala = (k, nome, estado, texto, segredo) => { const [x, y, w, h] = SALAS[k]; pag(k + " · " + nome, "Sala", estado, texto, segredo, em(masmorra, (x + w / 2) * 40, (y + h / 2) * 40)) };
    sala(1, "Poço seco", "visitado", "Fundo do poço atrás da peixaria. Cheiro forte de maresia.", "Nada aqui.");
    sala(2, "Galeria alagada", "visitado", "Água até o joelho e uma correnteza fraca para o leste.", "Teste de Sabedoria (Percepção) CD 12 acha pegadas pequenas.");
    sala(3, "Depósito", "conhecido", "Caixas podres com o selo da [[Irmandade do Sal]].", "Uma caixa tem 40 po escondidas no fundo falso.");
    sala(4, "Passagem escavada", "oculto", "Túnel novo, de paredes mal escoradas.", "Quatro [[Kobold]]s esperam aqui. O túnel leva à [[Mina Afundada]].");
    sala(5, "Cisterna", "oculto", "Reservatório antigo com uma escada de ferro.", "A escada sobe até o porão do [[Farol apagado]].");
    pag("Irmandade do Sal", "Facção", "conhecido", "Comerciantes de sal com casa no cais de [[Porto Cinzento]].", "São contrabandistas. A líder é a própria [[Mirela]].");
    pag("Mirela", "PNJ", "visitado", "Capitã do porto de [[Porto Cinzento]]. Simpática, cobra taxas altas e conhece todo mundo no cais.", "Lidera a [[Irmandade do Sal]] em segredo.", null, { na_cena: true });
    pag("Sessão 3 · 26/10", "Sessão", "visitado", "O grupo chegou a [[Porto Cinzento]], conversou com [[Mirela]] e ouviu falar de túneis sob o [[Mercado do Peixe]].", "Na próxima sessão, se descerem aos [[Esgotos de Porto Cinzento]], a sala 4 leva à [[Mina Afundada]].");
    pag("Kobold", "Monstro", "visitado", "Réptil pequeno e covarde que ataca em bando. A ficha completa virá da tabela de monstros do SRD.", "Quatro deles guardam a passagem da sala 4 dos [[Esgotos de Porto Cinzento]].", null, { na_cena: true });
    B.paginas.sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  }

  const copia = o => JSON.parse(JSON.stringify(o));
  const chave = s => String(s || "").trim().toLowerCase();
  async function carregar() {
    if (!B.mapas.length) { if (document.fonts) await document.fonts.ready; montar() }
    if (papel === "mestre") return { ...copia(B), mestre: true };
    /* o mesmo filtro de mundo_jogador */
    const vis = B.paginas.filter(p => p.estado !== "oculto"), nomes = vis.map(p => chave(p.nome));
    const mascara = t => t.replace(/\[\[([^\]]+)\]\]/g, (s, x) => nomes.includes(chave(x)) ? s : "[[?]]");
    return {
      mesa: copia(B.mesa), mestre: false, seg: {},
      paginas: vis.map(p => ({ ...copia(p), texto: p.estado === "visitado" ? mascara(p.texto) : "", na_cena: false })),
      mapas: copia(B.mapas.filter(m => !m.lugar_id || (B.paginas.find(l => l.id === m.lugar_id) || {}).estado === "visitado"))
    };
  }
  const CAMPOS = ["tipo", "nome", "texto", "estado", "mapa_id", "x", "y", "na_cena"];
  async function salvarPagina(p) {
    let l = p.id && B.paginas.find(x => x.id === p.id);
    if (!l) { l = { id: id(), tipo: "Lugar", nome: "", texto: "", estado: "oculto", mapa_id: null, x: null, y: null, na_cena: false }; B.paginas.push(l) }
    CAMPOS.forEach(k => { if (k in p) l[k] = p[k] });
    l.atualizado_em = new Date().toISOString();
    return copia(l);
  }
  async function salvarSegredo(pid, texto) { B.seg[pid] = texto }
  async function apagarPagina(pid) {
    const subs = B.mapas.filter(m => m.lugar_id === pid).map(m => m.id);
    B.paginas = B.paginas.filter(p => p.id !== pid); B.mapas = B.mapas.filter(m => m.lugar_id !== pid);
    B.paginas.forEach(p => { if (subs.includes(p.mapa_id)) p.mapa_id = null });
  }
  async function criarMapa(arq, nome, lugar_id) {
    const url = await new Promise((ok, erro) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = erro; r.readAsDataURL(arq) });
    const bmp = await createImageBitmap(arq);
    const m = { id: id(), nome, imagem: "img:up" + n, largura: bmp.width, altura: bmp.height, lugar_id };
    IMGS[m.imagem] = url; B.mapas.push(m); return copia(m);
  }
  async function apagarMapa(m) { B.mapas = B.mapas.filter(x => x.id !== m.id); B.paginas.forEach(p => { if (p.mapa_id === m.id) p.mapa_id = null }) }
  async function mostrar(m) { B.mesa.imagem_atual = m.imagem }
  async function imagem(c) { return IMGS[c] }
  function ouvir(cb) { OUVIR = cb }
  function avisar() { }
  function trocarPapel(p) { papel = p }
  return { M: "exemplo", carregar, salvarPagina, salvarSegredo, apagarPagina, criarMapa, apagarMapa, mostrar, imagem, ouvir, avisar, trocarPapel };
})();
