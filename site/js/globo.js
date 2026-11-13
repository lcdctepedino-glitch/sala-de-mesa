/* Mundo de UDA: o mundo do Início em 3D. Versão "realista" (aprovada em 11/11/2026; substitui o "planeta vivo" de 06/11).
   A cor de cada ponto da tela é calculada na placa de vídeo (um shader só), por isso o detalhe aparece em qualquer aproximação.
   Do mundo vêm o formato das terras, o terreno de cada quadradinho, os nomes dos continentes e os lugares marcados.
   Inventados aqui: recorte fino da costa, relevo, rios, vilas, estradas, lavouras, luzes e nuvens.
   Três luzes (Dia, Noite, Anoitecer): só muda de onde vem o sol; a escolha fica guardada no aparelho.
   SMGlobo.mini(canvas, info) = o globo pequeno no topo do Início (só gira); SMGlobo.abrir(tela, P, nome, aoFechar) = a tela cheia.
   Usa three.js r128 (js/three.min.js). */
const SMGlobo = (() => {
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches, TOQUE = matchMedia("(pointer: coarse)").matches;
  const NOMES_T = ["Mar", "Campo", "Floresta", "Montanha", "Deserto"], CORES_T = ["", "#8aa05a", "#3f6b3a", "#9a9186", "#c9a56c"];
  const RAD = Math.PI / 180, TG = Math.tan(35 * RAD / 2), ALT_MIN = .075;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x)), sm = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) };
  const dir = (lat, lon) => { const a = lat * RAD, b = lon * RAD; return new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(a), -Math.cos(a) * Math.sin(b)) };
  const coord = (lat, lon) => `${Math.abs(Math.round(lat))}°${lat >= 0 ? "N" : "S"}  ${Math.abs(Math.round(lon))}°${lon >= 0 ? "L" : "O"}`;
  let semente = 11; const rnd = () => { semente = (semente * 16807) % 2147483647; return semente / 2147483647 };
  function deB64(s, n) { const a = new Uint8Array(n); try { const b = atob(s || ""); for (let i = 0; i < Math.min(n, b.length); i++) a[i] = b.charCodeAt(i) } catch (e) { } return a }
  const VERS = { dia: { sol: [-.45, .35, .82], exp: 1 }, noite: { sol: [.76, .2, -.62], exp: 1.3 }, meio: { sol: [.96, .18, .2], exp: 1.08 } };
  for (const k in VERS) VERS[k].sol = new THREE.Vector3(...VERS[k].sol).normalize();
  const lerVersao = () => { try { const v = localStorage.getItem("sm-globo-luz2"); if (VERS[v]) return v } catch (e) { } return "meio" };
  const guardarVersao = v => { try { localStorage.setItem("sm-globo-luz2", v) } catch (e) { } };

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

  /* ---------- preparar (uma vez, serve ao globo pequeno e à tela cheia): pedaços de terra e os campos que a placa de vídeo lê ---------- */
  function preparar(info) {
    const des = info && info.des, MW = (des && des.w) || 200, MH = (des && des.h) || 160, N = MW * MH;
    const CEL = des ? deB64(des.cel, N) : new Uint8Array(N);
    const GRAU = Math.min(1, 300 / MW, 165 / MH), LON0 = -MW * GRAU / 2, LAT0 = MH * GRAU / 2;
    const viz = (j, x, y) => [x > 0 ? j - 1 : -1, x < MW - 1 ? j + 1 : -1, y > 0 ? j - MW : -1, y < MH - 1 ? j + MW : -1];
    const comp = new Int16Array(N).fill(-1), pecas = [];
    for (let i = 0; i < N; i++) if (CEL[i] && comp[i] < 0) { const id = pecas.length, fila = [i], pc = { id, cel: [], tipos: [0, 0, 0, 0, 0], lugares: 0 }; comp[i] = id;
      for (let q = 0; q < fila.length; q++) { const j = fila[q], x = j % MW, y = (j - x) / MW; pc.cel.push(j); pc.tipos[CEL[j]] = (pc.tipos[CEL[j]] || 0) + 1; for (const k of viz(j, x, y)) if (k >= 0 && CEL[k] && comp[k] < 0) { comp[k] = id; fila.push(k) } } pecas.push(pc) }
    [...pecas].sort((a, b) => b.cel.length - a.cel.length).forEach((p, k) => p.n = k + 1);
    // mar: de que terra está perto (para o toque na beira d'água) e a quantos quadradinhos dela
    const compF = Int16Array.from(comp), distT = new Int16Array(N), f1 = []; for (let i = 0; i < N; i++) if (CEL[i]) f1.push(i);
    for (let q = 0; q < f1.length; q++) { const j = f1[q], x = j % MW, y = (j - x) / MW; for (const k of viz(j, x, y)) if (k >= 0 && compF[k] < 0) { compF[k] = compF[j]; distT[k] = distT[j] + 1; f1.push(k) } }
    // terra: a quantos quadradinhos do mar
    const dist = new Int16Array(N).fill(-1), f2 = []; for (let i = 0; i < N; i++) if (!CEL[i]) { dist[i] = 0; f2.push(i) }
    for (let q = 0; q < f2.length; q++) { const j = f2[q], x = j % MW, y = (j - x) / MW; for (const k of viz(j, x, y)) if (k >= 0 && dist[k] < 0) { dist[k] = dist[j] + 1; f2.push(k) } }
    for (const p of pecas) { const v = new THREE.Vector3(); let la = 0, lo = 0;
      for (const j of p.cel) { const x = j % MW, y = (j - x) / MW, lon = LON0 + (x + .5) * GRAU, lat = LAT0 - (y + .5) * GRAU; v.add(dir(lat, lon)); la += lat; lo += lon }
      p.v = v.normalize(); p.lat = la / p.cel.length; p.lon = lo / p.cel.length; p.raio = 0;
      for (let q = 0; q < p.cel.length; q += 3) { const j = p.cel[q], x = j % MW, y = (j - x) / MW; p.raio = Math.max(p.raio, p.v.angleTo(dir(LAT0 - (y + .5) * GRAU, LON0 + (x + .5) * GRAU))) } }
    const celDe = (fx, fy) => clamp(Math.floor(fy * MH), 0, MH - 1) * MW + clamp(Math.floor(fx * MW), 0, MW - 1);
    // nome do continente: o pedaço de terra onde está a bandeirinha dele
    for (const ct of (info && info.conts) || []) { if (!ct.nome) continue; for (const pt of ct.pontos || []) { const k = compF[celDe(pt.x, pt.y)]; if (k >= 0 && !pecas[k].nome) pecas[k].nome = ct.nome } }
    // lugares marcados no mundo: viram cidade (mancha de dia, luz forte de noite) e ganham nome de perto
    const lugares = ((info && info.lugares) || []).map(l => { const lon = LON0 + l.x * MW * GRAU, lat = LAT0 - l.y * MH * GRAU, k = compF[celDe(l.x, l.y)]; if (k >= 0) pecas[k].lugares++;
      return { nome: l.nome || "Lugar", lat, lon, v: dir(lat, lon), x: l.x * MW, y: l.y * MH } });

    // campos suaves: onde é terra, quão longe do mar e o peso de cada terreno (imagem K vezes maior que o mapa, borrada)
    const K = MW > 300 || MH > 240 ? 2 : 4, AW = MW * K, AH = MH * K;
    const subir = fn => { const a = new Float32Array(AW * AH); for (let y = 0; y < AH; y++) { const o = Math.floor(y / K) * MW; for (let x = 0; x < AW; x++) a[y * AW + x] = fn(CEL[o + Math.floor(x / K)]) } return a };
    const tmp = new Float32Array(AW * AH);
    const borrar = (s, r, passos) => { const W = AW, H = AH, t = tmp, d = 2 * r + 1;
      for (let p = 0; p < passos; p++) {
        for (let y = 0; y < H; y++) { const o = y * W; let acc = 0; for (let x = -r; x <= r; x++) acc += s[o + clamp(x, 0, W - 1)]; for (let x = 0; x < W; x++) { t[o + x] = acc / d; acc += s[o + Math.min(W - 1, x + r + 1)] - s[o + Math.max(0, x - r)] } }
        for (let x = 0; x < W; x++) { let acc = 0; for (let y = -r; y <= r; y++) acc += t[clamp(y, 0, H - 1) * W + x]; for (let y = 0; y < H; y++) { s[y * W + x] = acc / d; acc += t[Math.min(H - 1, y + r + 1) * W + x] - t[Math.max(0, y - r) * W + x] } }
      } return s };
    const dMapa = new Uint8Array(AW * AH * 4), dTerr = new Uint8Array(AW * AH * 4);
    { const a = borrar(subir(c => c ? 1 : 0), Math.round(.75 * K), 2); for (let i = 0; i < AW * AH; i++) { dMapa[i * 4] = a[i] * 255; dMapa[i * 4 + 3] = 255 } }
    { const a = borrar(subir(c => c ? 1 : 0), 5 * K, 2); for (let i = 0; i < AW * AH; i++) dMapa[i * 4 + 1] = sm(.5, .97, a[i]) * 255 }
    for (let t = 1; t <= 4; t++) { const a = borrar(subir(c => c === t ? 1 : 0), K, 2); for (let i = 0; i < AW * AH; i++) dTerr[i * 4 + t - 1] = a[i] * 255 }

    // inventados: rios (vermelho), cidades (verde) e estradas (azul) numa imagem só
    const usado = new Uint8Array(N), rios = []; semente = 77;
    { const fontes = []; for (let i = 0; i < N; i++) if (CEL[i] === 3 && dist[i] >= 4) fontes.push(i);
      const limite = Math.min(46, Math.round(fontes.length / 26) + 5);
      for (let t = 0; t < 700 && rios.length < limite && fontes.length; t++) { let j = fontes[Math.floor(rnd() * fontes.length)]; if (usado[j]) continue; const cam = [j];
        for (let passo = 0; passo < 400; passo++) { const x = j % MW, y = (j - x) / MW, d = dist[j]; if (d <= 0) break; const op = [];
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= MW || yy >= MH) continue; const k = yy * MW + xx; if (dist[k] < d) op.push(k) }
          if (!op.length) break; j = op[Math.floor(rnd() * op.length)]; cam.push(j); if (usado[j]) break }
        if (cam.length < 6) continue; cam.forEach(k => usado[k] = 1);
        let pts = cam.filter((k, q) => q % 2 === 0 || q === cam.length - 1).map(k => { const x = k % MW, y = (k - x) / MW; return [x + .5 + (rnd() - .5) * .9, y + .5 + (rnd() - .5) * .9] });
        for (let r = 0; r < 3; r++) { const n = [pts[0]]; for (let q = 0; q < pts.length - 1; q++) { const a = pts[q], b = pts[q + 1]; n.push([a[0] * .75 + b[0] * .25, a[1] * .75 + b[1] * .25], [a[0] * .25 + b[0] * .75, a[1] * .25 + b[1] * .75]) } n.push(pts[pts.length - 1]); pts = n }
        rios.push(pts) } }
    const cids = []; semente = 31;
    for (const p of pecas) { const meus = lugares.filter(l => compF[celDe(l.x / MW, l.y / MH)] === p.id).map(l => ({ x: l.x, y: l.y, r: 1 }));
      if (p.cel.length >= 40) { const n = clamp(Math.round(p.cel.length / 130), 1, 16);
        const pont = j => { const c = CEL[j], d = dist[j]; return (c === 1 ? 3 : c === 2 ? 1 : c === 4 ? .5 : .2) * (d <= 3 ? 2 : 1) * (usado[j] ? 2.5 : 1) };
        for (let t = 0; t < 1200 && meus.length < n; t++) { const j = p.cel[Math.floor(rnd() * p.cel.length)]; if (rnd() * 15 > pont(j)) continue; const x = j % MW + .5, y = Math.floor(j / MW) + .5;
          if (meus.some(c => Math.hypot(c.x - x, c.y - y) < 4.5)) continue; meus.push({ x, y, r: meus.length ? .25 + rnd() * .5 : 1 + rnd() * .4 }) } }
      meus.forEach((c, i) => { if (!i) return; let m = null, md = 1e9; meus.forEach((o, k) => { if (k >= i) return; const d = Math.hypot(o.x - c.x, o.y - c.y); if (d < md) { md = d; m = o } }); c.liga = m });
      cids.push(...meus) }
    const AX = TOQUE ? 1024 : 2048, cvA = document.createElement("canvas"); cvA.width = cvA.height = AX;
    { const c = cvA.getContext("2d"); c.fillStyle = "#000"; c.fillRect(0, 0, AX, AX); c.scale(AX / MW, AX / MH); c.globalCompositeOperation = "lighter"; c.lineCap = c.lineJoin = "round";
      // três traços, do largo e fraco ao fino e forte: a borda do rio sai lisa quando a placa amplia a imagem
      for (const [larg, cor] of [[3.2, "rgba(255,0,0,.26)"], [2, "rgba(255,0,0,.34)"], [1, "rgba(255,0,0,.5)"]]) { c.strokeStyle = cor;
        for (const r of rios) for (let q = 0; q < r.length - 1; q++) { const f = q / (r.length - 1); c.lineWidth = (.1 + f * .2) * larg; c.beginPath(); c.moveTo(r[q][0], r[q][1]); c.lineTo(r[q + 1][0], r[q + 1][1]); c.stroke() } }
      c.strokeStyle = "rgba(0,0,255,.75)"; c.lineWidth = .09;
      for (const k of cids) if (k.liga) { const mx = (k.x + k.liga.x) / 2 + (rnd() - .5) * 3, my = (k.y + k.liga.y) / 2 + (rnd() - .5) * 3; c.beginPath(); c.moveTo(k.x, k.y); c.quadraticCurveTo(mx, my, k.liga.x, k.liga.y); c.stroke() }
      for (const k of cids) { const rr = k.r * 1.35, g = c.createRadialGradient(k.x, k.y, 0, k.x, k.y, rr); g.addColorStop(0, "rgba(0,255,0,1)"); g.addColorStop(.35, "rgba(0,255,0,.55)"); g.addColorStop(1, "rgba(0,255,0,0)"); c.fillStyle = g; c.beginPath(); c.arc(k.x, k.y, rr, 0, 7); c.fill() } }
    return { MW, MH, CEL, GRAU, LON0, LAT0, pecas, compF, distT, lugares, dMapa, dTerr, AW, AH, cvA };
  }

  /* ---------- o planeta: toda a cor é calculada ponto a ponto ---------- */
  const VERT = "varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}";
const FRAG = `
uniform sampler2D tMapa,tTerr,tAux; uniform vec4 uR; uniform vec3 uSol,uCam; uniform float uT,uNuv,uExp;
varying vec3 vP;
const mat3 M3=mat3(0.,.8,.6,-.8,.36,-.48,-.6,-.48,.64);
float h13(vec3 p){p=fract(p*.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float vn(vec3 x){x+=.35*sin(x.yzx*2.1+1.3)+.3*sin(x.zxy*1.37+4.1);vec3 i=floor(x),f=fract(x);   // entorta a grade do ruído: sem isso ela aparece como quadradinhos de longe
f=f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(mix(h13(i),h13(i+vec3(1.,0.,0.)),f.x),mix(h13(i+vec3(0.,1.,0.)),h13(i+vec3(1.,1.,0.)),f.x),f.y),
             mix(mix(h13(i+vec3(0.,0.,1.)),h13(i+vec3(1.,0.,1.)),f.x),mix(h13(i+vec3(0.,1.,1.)),h13(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}
// ruído em camadas; cada camada some quando fica menor que um ponto da tela (sem chuvisco de longe, com detalhe de perto)
float fbm(vec3 p,float f,int n,float fw){float s=0.,a=.5,t=0.;for(int i=0;i<9;i++){if(i>=n)break;float k=1.-smoothstep(.1,.32,f*fw);if(k<=0.)break;s+=a*mix(.5,vn(p*f),k);t+=a;a*=.5;f*=2.03;p=M3*p;}return t>0.?s/t:.5;}
float cri(vec3 p,float f,int n,float fw){float s=0.,a=.5,t=0.;for(int i=0;i<9;i++){if(i>=n)break;float k=1.-smoothstep(.08,.26,f*fw);if(k<=0.)break;float r=1.-abs(2.*vn(p*f)-1.);s+=a*mix(.33,r*r,k);t+=a;a*=.5;f*=2.07;p=M3*p;}return t>0.?s/t:.33;}
void main(){
  vec3 p=normalize(vP); float fw=max(length(dFdx(p)),length(dFdy(p)));
  vec3 V=normalize(uCam-p); float gl=dot(p,uSol), dia=smoothstep(-.1,.2,gl);
  // onde estou no mapa (a costa ganha uma torção larga e um recorte miúdo)
  vec2 wv=vec2(fbm(p+.31,5.,3,fw),fbm(p+1.17,5.,3,fw))-.5;
  float lat=degrees(asin(clamp(p.y,-1.,1.))), lon=degrees(atan(-p.z,p.x));
  vec2 esc=vec2(uR.z,uR.w), uv0=vec2((lon-uR.x)*uR.z,(uR.y-lat)*uR.w), uv=uv0+wv*esc*2.2;
  float dentro=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.)*step(abs(lon),172.);
  vec4 m=texture2D(tMapa,uv)*dentro, tw=texture2D(tTerr,uv)*dentro;
  vec2 me=(vec2(fbm(p+.23,70.,2,fw),fbm(p+.89,70.,2,fw))-.5)*esc*.5;
  vec4 ax=texture2D(tAux,uv+me)*dentro;
  float L=m.r+(fbm(p+.7,26.,9,fw)-.5)*.34*smoothstep(.1,.38,m.r);
  float e=max(fwidth(L)*.75,.0015), terra=smoothstep(.5-e,.5+e,L);
  // terrenos, com a fronteira entre eles quebrada
  float nb=fbm(p+.44,48.,4,fw)-.5;
  vec4 w=max(tw+vec4(nb,-nb,nb*.6,-nb*.6)*.45,0.); float sw=w.x+w.y+w.z+w.w; w=sw>.03?w/sw:vec4(1.,0.,0.,0.);
  float um=fbm(p+1.2,9.,4,fw), rd=cri(p+.13,34.,7,fw), fl=fbm(p+.61,190.,4,fw);
  float mont=w.z*smoothstep(.1,.55,w.z);
  float du=.5+.5*sin(dot(p,vec3(900.,330.,510.))+fbm(p,40.,3,fw)*18.); du=mix(.5,du,1.-smoothstep(.12,.35,fw*175.));
  float longe=smoothstep(.0008,.003,fw);   // 0 de perto, 1 com o planeta inteiro na tela
  float rio=smoothstep(.64,.9,ax.r)*terra*(1.-.55*longe);
  // altura (em raios do planeta) e ondas do mar: viram sombra, não volume
  float h=terra*(.0006+m.g*.0016+mont*(.003+.016*rd)*(1.-.55*longe)+w.y*.002*fl+w.w*.0007*du+.0016*fbm(p+.9,70.,6,fw));
  h+=(1.-terra)*.00028*fbm(p+vec3(uT*.0005),520.,3,fw);
  vec3 sx=dFdx(p),sy=dFdy(p); float hx=dFdx(h),hy=dFdy(h);
  vec3 R1=cross(sy,p),R2=cross(p,sx); float det=dot(sx,R1); vec3 n=normalize(abs(det)*p-sign(det)*(hx*R1+hy*R2));
  // cores da terra
  vec3 cCampo=mix(vec3(.075,.12,.036),vec3(.15,.135,.06),smoothstep(.35,.7,um))*(.7+.32*fbm(p+.3,300.,3,fw));
  vec3 cFlor=mix(vec3(.016,.055,.02),vec3(.04,.09,.028),fl);
  vec3 cRocha=mix(vec3(.09,.085,.072),vec3(.18,.155,.125),rd);
  vec3 cDes=mix(vec3(.36,.26,.145),vec3(.3,.17,.095),smoothstep(.3,.7,um))*(.85+.3*du);
  vec3 alb=(cCampo*w.x+cFlor*w.y+cRocha*w.z+cDes*w.w)*(.72+.56*fbm(p+.77,130.,5,fw));
  alb=mix(alb,vec3(.8,.84,.9),mix(smoothstep(.5,.72,rd)*smoothstep(.35,.7,w.z),smoothstep(.45,.9,w.z)*smoothstep(.3,.75,rd)*.7,longe));
  float cid=smoothstep(.06,.85,ax.g);
  vec2 q2=mat2(.8,.6,-.6,.8)*(uv0/esc*13.); float idc=h13(vec3(floor(q2),7.));
  vec3 lav=mix(vec3(.1,.14,.042),vec3(.25,.2,.09),mix(.5,idc,1.-smoothstep(.12,.4,fw*750.)));
  alb=mix(alb,lav,smoothstep(.03,.35,ax.g)*w.x*(1.-cid)*.8);
  float pc=fbm(p+.5,650.,3,fw);
  alb=mix(alb,vec3(.15,.145,.14)*(.6+.8*pc),cid*.85);
  alb=mix(alb,vec3(.16,.15,.13),clamp(ax.b*1.2,0.,1.)*.22*(1.-cid));
  alb=mix(alb,vec3(.028,.07,.095),rio*.9);
  alb=mix(alb,vec3(.44,.39,.27),smoothstep(.5,.508,L)*(1.-smoothstep(.512,.532,L))*.7*(1.-w.z));
  // mar: raso turquesa na costa, fundo azul-escuro
  float prof=1.-smoothstep(.18,.5,L);
  vec3 mar=mix(vec3(.013,.08,.105),vec3(.01,.045,.105),smoothstep(0.,.35,prof)); mar=mix(mar,vec3(.003,.013,.042),smoothstep(.3,1.,prof));
  float gelo=smoothstep(74.,79.,abs(lat)+(fbm(p,14.,4,fw)-.5)*8.);
  alb=mix(mix(mar,alb,terra),vec3(.78,.83,.9),gelo);
  // luz do sol, céu e luar
  vec3 solCor=mix(vec3(1.,.42,.18),vec3(1.,.96,.9),smoothstep(-.02,.16,gl));
  float ndl=max(dot(n,uSol),0.)*smoothstep(-.06,.12,gl);
  vec3 col=alb*solCor*ndl*3.2+alb*vec3(.5,.65,1.)*.1*dia+mix(alb,vec3(dot(alb,vec3(.3,.5,.2))),.65)*vec3(.32,.45,.8)*.05*(.4+.6*max(dot(n,V),0.));
  vec3 H=normalize(uSol+V); float nh=max(dot(n,H),0.), agua=(1.-terra)*(1.-gelo)+rio*.5;
  col+=solCor*agua*(pow(nh,900.)*1.6+pow(nh,90.)*.06)*(.55+.9*fbm(p+vec3(uT*.001),60.,3,fw))*smoothstep(0.,.15,gl);
  // luzes das cidades, estradas e vilas (só aparecem no escuro)
  float pl=smoothstep(.42,.68,fbm(p+.2,520.,3,fw));
  vec3 cc=p*240.; float vila=step(.988,h13(floor(cc)))*(1.-smoothstep(.12,.4,length(fract(cc)-.5))); vila=mix(.007*smoothstep(.3,.8,fbm(p+1.55,45.,3,fw)),vila,1.-smoothstep(.1,.3,fw*240.));
  float luzes=(cid*cid*(.2+2.6*pl)+clamp(ax.b,0.,1.)*.025*pl+vila*(w.x*.9+.1)*1.6)*terra*(1.-gelo);
  // nuvens e a sombra delas
  float cs=cos(uT*.004),sn=sin(uT*.004); vec3 q=vec3(cs*p.x+sn*p.z,p.y,-sn*p.x+cs*p.z), sq=vec3(cs*uSol.x+sn*uSol.z,uSol.y,-sn*uSol.x+cs*uSol.z);
  vec3 wq=vec3(fbm(q+.52,2.4,2,fw),fbm(q+.94,2.4,2,fw),0.)-.5; wq.z=wq.x;
  float fa=.84+.16*cos(q.y*7.5);
  float nv=smoothstep(.53,.76,fbm(q+wq*.4+1.4,3.2,8,fw)*fa+.015)*uNuv;
  float nvS=smoothstep(.53,.76,fbm(normalize(q+sq*.014)+wq*.4+1.4,3.2,5,fw)*fa+.015)*uNuv;
  col*=1.-.5*nvS*dia;
  vec3 cn=solCor*smoothstep(-.12,.25,gl)*(1.05-.35*nvS)*2.5+vec3(.3,.4,.7)*.03;
  col=mix(col,cn,nv*.9);
  col+=vec3(1.,.7,.36)*luzes*(1.-.85*nv)*2.2*(1.-smoothstep(-.12,.08,gl));
  // ar: névoa azul fina na borda, alaranjada na linha do anoitecer
  float rim=pow(1.-max(dot(p,V),0.),3.2);
  col=col*(1.-.45*rim)+(vec3(.2,.45,1.)*smoothstep(-.2,.3,gl)*1.5+vec3(1.,.35,.12)*.15*exp(-gl*gl*80.)+vec3(.012,.022,.05))*rim;
  col+=vec3(.2,.42,.9)*.03*dia;
  col*=uExp; col=(col*(2.51*col+.03))/(col*(2.43*col+.59)+.14);
  gl_FragColor=vec4(pow(clamp(col,0.,1.),vec3(.4545)),1.);
}`;
const AR_V = "varying vec3 vN;varying vec3 vV;varying vec3 vW;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vV=mv.xyz;vW=normalize(position);gl_Position=projectionMatrix*mv;}";
const AR_F = "uniform vec3 uSol;varying vec3 vN;varying vec3 vV;varying vec3 vW;void main(){float d=dot(normalize(vN),normalize(-vV));float i=pow(clamp(-d/.29,0.,1.),2.4);float g=dot(normalize(vW),uSol);" +
  "vec3 c=(vec3(.22,.48,1.)*smoothstep(-.3,.4,g)*.95+vec3(1.,.38,.14)*.13*exp(-g*g*60.)+vec3(.03,.05,.12)*.25)*i;gl_FragColor=vec4(pow(c,vec3(.4545)),1.);}";

  function cena(canvas, P, estrelas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, TOQUE ? 1.5 : 2)); renderer.setClearColor(0, 0);
    const sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(35, 1, .01, 200), pivo = new THREE.Group(), giro = new THREE.Group(); pivo.add(giro); sc.add(pivo);
    const tex = d => { const t = new THREE.DataTexture(d, P.AW, P.AH, THREE.RGBAFormat); t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true; return t };
    const tAux = new THREE.CanvasTexture(P.cvA); tAux.flipY = false; tAux.anisotropy = renderer.capabilities.getMaxAnisotropy(); tAux.minFilter = THREE.LinearMipmapLinearFilter;
    const U = { tMapa: { value: tex(P.dMapa) }, tTerr: { value: tex(P.dTerr) }, tAux: { value: tAux }, uR: { value: new THREE.Vector4(P.LON0, P.LAT0, 1 / (P.MW * P.GRAU), 1 / (P.MH * P.GRAU)) },
      uSol: { value: new THREE.Vector3(0, 0, 1) }, uCam: { value: new THREE.Vector3(0, 0, 4) }, uT: { value: 0 }, uNuv: { value: 1 }, uExp: { value: 1 } };
    const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT, fragmentShader: FRAG }); mat.extensions = { derivatives: true };
    giro.add(new THREE.Mesh(new THREE.SphereGeometry(1, 192, 96), mat));
    const UA = { uSol: { value: new THREE.Vector3(0, 0, 1) } };
    sc.add(new THREE.Mesh(new THREE.SphereGeometry(1.045, 128, 64), new THREE.ShaderMaterial({ uniforms: UA, vertexShader: AR_V, fragmentShader: AR_F, side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })));
    if (estrelas) { const n = 1600, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); pos[i * 3] = r * Math.cos(a) * 60; pos[i * 3 + 1] = u * 60; pos[i * 3 + 2] = r * Math.sin(a) * 60 }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3)); sc.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xcfdcf5, size: 1.1, sizeAttenuation: false, transparent: true, opacity: .5, depthWrite: false }))) }
    const C = { renderer, sc, cam, pivo, giro, U, UA, inv: new THREE.Matrix4(), solW: VERS[lerVersao()].sol.clone() };
    // se a placa de vídeo recusar o cálculo, avisa quem chamou (o Início esconde o globo em vez de mostrar um quadro preto)
    try { renderer.compile(sc, cam) } catch (e) { }
    if (renderer.info.programs && renderer.info.programs.some(p => p.diagnostics && !p.diagnostics.runnable)) { liberar(C); throw new Error("a placa de vídeo recusou o planeta") }
    return C;
  }
  /* um quadro: gira, põe a câmera (de perto ela inclina), move o sol até a luz escolhida e desenha */
  function desenhar(C, yaw, pitch, alt, versao, nuv, t, dt) {
    C.giro.rotation.y = yaw; C.pivo.rotation.x = pitch;
    const kp = sm(.55, .1, alt), incl = kp * .72;
    C.cam.position.set(0, -Math.sin(incl) * alt, 1 + Math.cos(incl) * alt); C.cam.lookAt(0, kp * .1, kp * .97);
    C.cam.near = Math.max(.002, alt * .2); C.cam.updateProjectionMatrix(); C.sc.updateMatrixWorld(); C.cam.updateMatrixWorld();
    const v = VERS[versao], k = 1 - Math.exp(-dt * 2.2); C.solW.lerp(v.sol, k).normalize(); C.U.uExp.value += (v.exp - C.U.uExp.value) * k;
    C.inv.copy(C.giro.matrixWorld).invert(); C.U.uSol.value.copy(C.solW).transformDirection(C.inv); C.U.uCam.value.copy(C.cam.position).applyMatrix4(C.inv); C.UA.uSol.value.copy(C.solW);
    C.U.uT.value = RM ? 0 : t; C.U.uNuv.value = nuv;
    C.renderer.render(C.sc, C.cam);
  }

  let CHEIA = null;
  function liberar(C) { if (!C) return; C.sc.traverse(o => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? [].concat(o.material) : [];
      ms.forEach(m => { if (m.uniforms) for (const k in m.uniforms) { const x = m.uniforms[k].value; if (x && x.isTexture) x.dispose() } m.dispose() }) });
    C.renderer.dispose(); try { C.renderer.forceContextLoss() } catch (e) { } }

  /* ---------- o globo pequeno do Início: só gira; pausa fora da tela ---------- */
  function mini(canvas, info) {
    const P = preparar(info), caixa = canvas.parentElement, C = cena(canvas, P, false);
    let vivo = true, visto = true, ult = 0, alt = 3;
    const maior = P.pecas.find(p => p.n === 1); let yaw = maior ? Math.atan2(-maior.v.x, maior.v.z) + .35 : 0;
    const medir = () => { const w = canvas.clientWidth || 300, h = canvas.clientHeight || 260; C.renderer.setSize(w, h, false); C.cam.aspect = w / h; alt = Math.max(1 / (.8 * TG), 1 / (.8 * TG * C.cam.aspect)) - 1 };
    medir(); addEventListener("resize", medir);
    let pedido = false, versao = lerVersao();
    const pedir = () => { if (pedido) return; pedido = true; requestAnimationFrame(quadro) };   // um quadro pedido por vez: nunca dois laços
    new IntersectionObserver(es => { visto = es[0].isIntersecting; if (visto && vivo) pedir() }).observe(caixa);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && vivo && visto) pedir() });
    function quadro(ms) {
      pedido = false; if (!vivo || !visto || document.hidden) return;
      const t = ms / 1000, dt = Math.min(.05, t - (ult || t)) || .016; ult = t;
      if (!RM) yaw += dt * .07;
      desenhar(C, yaw, .22, alt, versao, 1, t, dt);
      if (!RM) pedir();
    }
    pedir();
    return { P, pausar() { vivo = false }, seguir() { if (vivo) return; vivo = true; ult = 0; versao = lerVersao(); C.solW.copy(VERS[versao].sol); C.U.uExp.value = VERS[versao].exp; pedir() } };
  }

  /* ---------- a tela cheia: arrastar com embalo, aproximar no ponto do dedo, tocar numa terra, chegar perto ---------- */
  function abrir(el, P, nomeMundo, aoFechar, irPara) {   // irPara: nome de um lugar com cidade, para abrir já em cima dele (volta da cidade)
    const $ = s => el.querySelector(s), sobre = $(".gt-sobre"), cartao = $(".gt-cartao"), dica = $(".gt-dica"), aviso = $(".gt-aviso");
    // o planeta da tela cheia é montado uma vez só e guardado: refazer a cada abertura estourava a memória do iPhone
    let tela = $(".gt-gl"); const reusar = !!(CHEIA && CHEIA.P === P && CHEIA.tela === tela);
    if (!reusar) { if (CHEIA) { liberar(CHEIA.C); CHEIA = null } const n = tela.cloneNode(false); tela.replaceWith(n); tela = n }
    $(".gt-nome").textContent = nomeMundo || "Mundo de UDA";
    $(".gt-vazio").hidden = P.pecas.length > 0;
    dica.textContent = TOQUE ? "Arraste para girar · dois dedos aproximam · toque numa terra" : "Arraste para girar · role para aproximar · clique numa terra";
    dica.classList.remove("some"); cartao.dataset.aberto = "nao"; aviso.textContent = "Montando o planeta…"; aviso.classList.remove("some"); sobre.textContent = "";
    let C = null, vivo = true, versao = lerVersao(), comNuvens = true, opN = 1;
    let LW = 1, LH = 1, altBase = 3, alt = 4, altAlvo = 3, yaw = 0, pitch = .2, vyaw = 0, vpitch = 0, tYaw = 0, tPitch = 0, indo = false, foco = null, agora = 0, ultimoToque = -10;
    const parar = () => { vivo = false; removeEventListener("resize", medir); removeEventListener("keydown", tecla) };
    const pedirFechar = () => { if (aoFechar) aoFechar() };
    const tecla = e => { if (e.key === "Escape") { if (foco) voltar(); else pedirFechar() } };
    addEventListener("keydown", tecla);
    function medir() { if (!C) return; LW = tela.clientWidth || 1; LH = tela.clientHeight || 1; C.renderer.setSize(LW, LH, false); C.cam.aspect = LW / LH;
      const ocupa = LW < 600 ? .86 : .72, antes = altBase; altBase = Math.max(1 / (ocupa * TG), 1 / (ocupa * TG * C.cam.aspect)) - 1; if (!foco && Math.abs(altAlvo - antes) < .01) altAlvo = altBase }
    // botões
    const bN = $(".gt-nuvens"); bN.setAttribute("aria-pressed", "true"); bN.onclick = () => { comNuvens = !comNuvens; bN.setAttribute("aria-pressed", String(comNuvens)) };
    const bV = [...el.querySelectorAll(".gt-versoes button")], marcarV = () => bV.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === versao)));
    bV.forEach(b => b.onclick = () => { versao = b.dataset.v; guardarVersao(versao); marcarV() }); marcarV();
    $(".gt-fechar").onclick = pedirFechar;
    const ang = a => { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI };
    const mirar = v => { tYaw = Math.atan2(-v.x, v.z); tPitch = clamp(Math.atan2(v.y, Math.hypot(v.x, v.z)), -1.3, 1.3); indo = true };
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function pontoMundo(cx, cy) { if (!C) return null; const r = tela.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, C.cam);
      const o = ray.ray.origin, d = ray.ray.direction, b = o.dot(d), c = o.dot(o) - 1, disc = b * b - c; if (disc < 0) return null; return o.clone().addScaledVector(d, -b - Math.sqrt(disc)) }
    function terraEm(cx, cy) { const h = pontoMundo(cx, cy); if (!h) return null; const l = C.giro.worldToLocal(h.clone()).normalize();
      const lat = Math.asin(clamp(l.y, -1, 1)) / RAD, lon = Math.atan2(-l.z, l.x) / RAD, x = Math.floor((lon - P.LON0) / P.GRAU), y = Math.floor((P.LAT0 - lat) / P.GRAU);
      if (x < 0 || y < 0 || x >= P.MW || y >= P.MH) return 0; const j = y * P.MW + x; return P.distT[j] <= 2 && P.compF[j] >= 0 ? P.pecas[P.compF[j]] : 0 }
    function aproximar(fator, cx, cy) { const novo = clamp(altAlvo * fator, ALT_MIN, altBase * 1.25);
      if (fator < 1 && cx != null) { const h = pontoMundo(cx, cy); if (h) { const k = (1 - novo / altAlvo) * .85; yaw -= Math.atan2(h.x, h.z) * k; pitch = clamp(pitch + Math.asin(clamp(h.y, -1, 1)) * k, -1.3, 1.3); indo = false } }
      altAlvo = novo; ultimoToque = agora; dica.classList.add("some") }
    const altDe = p => clamp(p.raio * 1.25 / (TG * Math.min(1, C ? C.cam.aspect : 1)), .16, altBase);
    const nomeDe = p => p.nome || `Terra ${p.n}`;
    function focar(p) { cidadeFoco = null; $(".gt-perto").textContent = "Chegar perto"; foco = p; mirar(p.v); altAlvo = altDe(p); const tam = p.cel.length, tipo = tam >= 600 ? "Continente" : tam >= 120 ? "Terra" : "Ilha";
      $(".gt-olho").textContent = p.nome ? tipo : tipo + " · ainda sem nome"; $(".gt-titulo").textContent = nomeDe(p);
      $(".gt-coord").textContent = `${coord(p.lat, p.lon)} · ${tam.toLocaleString("pt-BR")} quadradinhos` + (p.lugares ? ` · ${p.lugares} ${p.lugares === 1 ? "lugar" : "lugares"}` : "");
      const ul = $(".gt-compo"); ul.textContent = "";
      [1, 2, 3, 4].filter(t => p.tipos[t]).sort((a, b) => p.tipos[b] - p.tipos[a]).forEach(t => { const pc = Math.round(p.tipos[t] / tam * 100), li = document.createElement("li");
        li.innerHTML = '<span></span><span class="gt-barra-t"><i></i></span><span class="gt-pc"></span>'; li.children[0].textContent = NOMES_T[t];
        const i = li.querySelector("i"); i.style.width = Math.max(2, pc) + "%"; i.style.background = CORES_T[t]; li.children[2].textContent = pc + "%"; ul.appendChild(li) });
      cartao.dataset.aberto = "sim"; dica.classList.add("some"); rotulos.forEach(o => o.el.classList.toggle("sel", o.p === p)) }
    function voltar() { cidadeFoco = null; $(".gt-perto").textContent = "Chegar perto"; foco = null; indo = false; altAlvo = altBase; cartao.dataset.aberto = "nao"; ultimoToque = agora; rotulos.forEach(o => o.el.classList.remove("sel")) }
    /* atalho: por enquanto só o lugar chamado "Ipanema" tem cidade em 3D (a cidade murada de teste, cidade.html); trocar quando a cidade for guardada junto do mundo, no banco */
    const temCidade = l => /^ipanema$/i.test(String(l.nome).trim());
    let cidadeFoco = null;
    function focarCidade(l) { foco = null; cidadeFoco = l; mirar(l.v); altAlvo = ALT_MIN * 1.5; $(".gt-olho").textContent = "Cidade"; $(".gt-titulo").textContent = l.nome; $(".gt-coord").textContent = coord(l.lat, l.lon) + " · dá para andar por ela";
      $(".gt-compo").textContent = ""; $(".gt-perto").textContent = "Explorar cidade"; cartao.dataset.aberto = "sim"; dica.classList.add("some"); rotulos.forEach(o => o.el.classList.remove("sel")) }
    $(".gt-volta").onclick = voltar;
    $(".gt-perto").onclick = () => { if (cidadeFoco) { location.href = "cidade.html?nome=" + encodeURIComponent(cidadeFoco.nome); return } if (foco) { mirar(foco.v); altAlvo = clamp(altDe(foco) * .26, ALT_MIN, .3) } };
    const bMais = $(".gt-mais"), bMenos = $(".gt-menos"); if (bMais) bMais.onclick = () => aproximar(.6); if (bMenos) bMenos.onclick = () => aproximar(1.6);
    // nomes das terras maiores (de longe) e dos lugares (de perto)
    const rotulos = [];
    P.pecas.filter(p => p.cel.length >= 120 || p.nome).sort((a, b) => a.n - b.n).forEach(p => { const b = document.createElement("button"); b.type = "button"; b.className = "gt-rot"; b.innerHTML = "<i></i><span></span>";
      b.querySelector("span").textContent = nomeDe(p); b.onclick = () => focar(p); sobre.appendChild(b); rotulos.push({ p, el: b, v: p.v, terra: true }) });
    P.lugares.forEach(l => { const cid = temCidade(l), b = document.createElement(cid ? "button" : "span"); if (cid) { b.type = "button"; b.onclick = () => focarCidade(l) } b.className = "gt-rot gt-lugar" + (cid ? " gt-cidade" : ""); b.innerHTML = "<i></i><span></span>"; b.querySelector("span").textContent = l.nome; sobre.appendChild(b); rotulos.push({ el: b, v: l.v, terra: false, cid }) });
    rotulos.sort((a, b) => (b.cid ? 1 : 0) - (a.cid ? 1 : 0));   // cidade primeiro: ela aparece em qualquer distância e ganha o lugar quando dois nomes se encostam

    // montar depois de pintar o aviso
    setTimeout(() => {
      if (!vivo) return; let erro = null;
      if (reusar) C = CHEIA.C; else { try { C = cena(tela, P, true); CHEIA = { C, P, tela } } catch (e) { erro = e; console.error(e) } }
      if (!C) { aviso.innerHTML = 'Não consegui abrir o mundo em 3D neste aparelho.<br><small style="opacity:.7;font-size:12px"></small>'; aviso.querySelector("small").textContent = String(erro && (erro.message || erro)).slice(0, 160); return }
      C.solW.copy(VERS[versao].sol); C.U.uExp.value = VERS[versao].exp;
      const maior = P.pecas.find(p => p.n === 1); yaw = maior ? Math.atan2(-maior.v.x, maior.v.z) + .35 : 0;
      addEventListener("resize", medir); medir(); altAlvo = altBase; alt = altBase * 1.25; aviso.classList.add("some");
      if (irPara) { const l = P.lugares.find(l => l.nome === irPara && temCidade(l)); if (l) { focarCidade(l); alt = Math.min(alt, .45) } }
      requestAnimationFrame(quadro);
    }, 60);

    const ptrs = new Map(); let arrasto = null, pinca = 0;
    tela.onpointerdown = e => { tela.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) { arrasto = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: performance.now(), t: performance.now(), moveu: false }; vyaw = vpitch = 0; indo = false }
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinca = Math.hypot(a.x - b.x, a.y - b.y); arrasto = null } ultimoToque = agora };
    tela.onpointermove = e => { if (ptrs.has(e.pointerId)) ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (pinca > 0 && d > 0) aproximar(pinca / d, (a.x + b.x) / 2, (a.y + b.y) / 2); pinca = d; return }
      if (!arrasto) { if (!TOQUE) tela.classList.toggle("mao", !!terraEm(e.clientX, e.clientY)); return }
      const now = performance.now(), dx = e.clientX - arrasto.x, dy = e.clientY - arrasto.y, dtm = Math.max(8, now - arrasto.t) / 1000;
      if (Math.hypot(e.clientX - arrasto.x0, e.clientY - arrasto.y0) > 5) { arrasto.moveu = true; tela.classList.add("arrasta") }
      if (arrasto.moveu) { const k = 2 * TG * alt / LH * 1.05; yaw += dx * k; pitch = clamp(pitch + dy * k, -1.3, 1.3); vyaw = vyaw * .4 + (dx * k / dtm) * .6; vpitch = vpitch * .4 + (dy * k / dtm) * .6; dica.classList.add("some") }
      arrasto.x = e.clientX; arrasto.y = e.clientY; arrasto.t = now; ultimoToque = agora };
    const solta = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinca = 0; tela.classList.remove("arrasta");
      if (arrasto && !arrasto.moveu && performance.now() - arrasto.t0 < 450) { vyaw = vpitch = 0; const p = terraEm(e.clientX, e.clientY); if (p && p !== foco) focar(p); else if (p === 0 && foco) voltar() }
      if (arrasto && performance.now() - arrasto.t > 90) { vyaw *= .2; vpitch *= .2 } arrasto = null; ultimoToque = agora };
    tela.onpointerup = solta; tela.onpointercancel = solta; tela.onpointerleave = () => tela.classList.remove("mao");
    tela.onwheel = e => { e.preventDefault(); aproximar(Math.exp(e.deltaY * .0014), e.clientX, e.clientY) };

    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(); let ultimo = 0;
    function quadro(ms) {
      if (!vivo || !C) return; requestAnimationFrame(quadro);
      agora = ms / 1000; const dt = Math.min(.05, agora - ultimo || .016); ultimo = agora;
      if (!arrasto && ptrs.size === 0) {
        if (indo) { const k = 1 - Math.exp(-dt * (RM ? 14 : 3.2)); yaw += ang(tYaw - yaw) * k; pitch += (tPitch - pitch) * k; if (Math.abs(ang(tYaw - yaw)) < .001 && Math.abs(tPitch - pitch) < .001) indo = false }
        else { const parado = agora - ultimoToque > 2.5, auto = !foco && parado && !RM && alt > altBase * .6 ? .045 : 0; vyaw += (auto - vyaw) * (1 - Math.exp(-dt * 1.4)); vpitch *= Math.exp(-dt * 2.4);
          yaw += vyaw * dt; pitch = clamp(pitch + vpitch * dt, -1.3, 1.3) } }
      alt += (altAlvo - alt) * (1 - Math.exp(-dt * (RM ? 12 : 3)));
      opN += ((comNuvens ? (alt < .4 ? .4 : 1) : 0) - opN) * (1 - Math.exp(-dt * 3));
      desenhar(C, yaw, pitch, alt, versao, opN, agora, dt);
      const usados = [], longe = sm(.35, .8, alt), perto = 1 - sm(.3, .7, alt);
      for (const r of rotulos) { tmp.copy(r.v).applyMatrix4(C.giro.matrixWorld); const f = tmp.dot(tmp2.copy(C.cam.position).sub(tmp).normalize()); tmp2.copy(tmp).project(C.cam);
        const x = (tmp2.x + 1) / 2 * LW, y = (1 - tmp2.y) / 2 * LH; let op = sm(.15, .4, f) * (r.cid ? 1 : r.terra ? longe : perto) * .92; if (tmp2.z > 1) op = 0;
        if (op > .05) { if (usados.some(u => Math.abs(u.x - x) < 96 && Math.abs(u.y - y) < 22)) op = 0; else usados.push({ x, y }) }
        r.el.style.transform = `translate(${x - 11}px,${y - 14}px)`; r.el.style.opacity = op; r.el.style.pointerEvents = (r.terra || r.cid) && op > .3 ? "auto" : "none"; if (r.terra || r.cid) r.el.tabIndex = op > .3 ? 0 : -1 }
    }
    return { parar, fechar: parar };
  }

  return { carregarDoInicio, preparar, mini, abrir };
})();
