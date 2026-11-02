/* ===== textos de regra: 1ª linha = resumo; "- " = item; "  - " = subitem; **negrito** ===== */
function inl(s){s=String(s).replace(/\[Carisma\]/g,"(modificador de Carisma)").replace(/\[proficiência\]/g,"(bônus de proficiência)");return s.split(/\*\*(.+?)\*\*/).map((x,i)=>i%2?el("b",{},x):x)}
function tr(n,x){if(!String(x).includes("\n"))return el("p",{class:"tr"},el("b",{},n+": "),...inl(x));return el("div",{class:"tr"},el("b",{class:"tr-n"},n),rico(x))}
function linha1(txt){return String(txt||"").split("\n")[0].replace(/\*\*/g,"").replace(/^- /,"")}
function rico(txt,cls){const box=el("div",{class:"rico"+(cls?" "+cls:"")});if(!txt)return box;const ls=String(txt).split("\n");const multi=ls.length>1;let ul=null,sub=null,ultimo=null;
  ls.forEach((l,i)=>{const m=l.match(/^(\s*)- (.*)$/);
    if(m){const li=el("li",{},...inl(m[2]));if(m[1].length>=2&&ultimo){if(!sub){sub=el("ul");ultimo.append(sub)}sub.append(li)}else{if(!ul){ul=el("ul");box.append(ul)}ul.append(li);ultimo=li;sub=null}}
    else{ul=null;sub=null;ultimo=null;box.append(el("p",{class:i===0&&multi?"resumo":""},...inl(l)))}});
  return box}
/* ================= v2: níveis 2 e 3, subclasses e multiclasse =================
   As funções abaixo substituem as de mesmo nome do app.js (no mesmo script vale a última declaração). */
const NV=P=>1+(P.niveis||[]).length;
const pbP=P=>PB(NV(P));
function niveisPorClasse(P){const r={};if(P.classe)r[P.classe]=1;(P.niveis||[]).forEach(n=>r[n.c]=(r[n.c]||0)+1);return r}
const nC=(P,c)=>niveisPorClasse(P)[c]||0;
function classesDe(P){return Object.keys(niveisPorClasse(P))}
function escs(P,key){return (P.niveis||[]).map(n=>n.esc&&n.esc[key]).filter(v=>v!==undefined&&v!==null&&v!=="")}
function entradaSub(P,c){return (P.niveis||[]).find(n=>n.c===c&&n.esc&&n.esc.sub)}
function subDe(P,c){const e=entradaSub(P,c);return e?e.esc.sub:null}
function subObj(P,c){const k=subDe(P,c);return k&&SUBCLASSES[c]?SUBCLASSES[c][k]:null}
function subEsc(P,c){const e=entradaSub(P,c);return e?(e.esc.subEsc||{}):{}}
function ordemDe(P,c){if(c===P.classe)return P.ordem;const e=(P.niveis||[]).find(n=>n.c===c&&n.esc&&n.esc.ordem);return e?e.esc.ordem:null}
function estilosDe(P){return [P.estilo,...escs(P,"estilo"),...escs(P,"estiloPal"),...escs(P,"estiloPat"),...escs(P,"estiloExtra"),...asisDe(P).filter(a=>a.k.startsWith("e:")).map(a=>a.k.slice(2))].filter(x=>x&&ESTILOS[x])}
function invocsDe(P){return [P.invoc,...escs(P,"invoc").flat(),...escs(P,"invoc2").flat(),...escs(P,"invoc5").flat()].filter(Boolean)}
function maestriasDe(P){return [...new Set([...(P.maestrias||[]),...escs(P,"maestrias").flat(),...escs(P,"maestria1"),...asisDe(P).map(a=>a.arma).filter(Boolean)])]}
function especialDe(P){return [...new Set([...(P.especial||[]),...escs(P,"especial").flat(),...escs(P,"especial2").flat(),...escs(P,"explorador").map(x=>x.per).filter(Boolean),...escs(P,"erudito"),...asisDe(P).filter(a=>a.esp).map(a=>a.per),...asisDe(P).map(a=>a.esp2).filter(Boolean)])]}
function magClasse(P,c){if(c===P.classe||!P.classe)return P;P.magX=P.magX||{};return P.magX[c]=P.magX[c]||{truques:[],prep:[],grim:[]}}
/* nível 4: Aumento de Atributo ou talento, guardado em esc.asi de cada nível ({k, a1, a2, modo, ...}) */
function asisDe(P){return (P.niveis||[]).map((n,i)=>n&&n.esc&&n.esc.asi&&n.esc.asi.k?Object.assign({nv:i+2},n.esc.asi):null).filter(Boolean)}
function talG(P,k){return asisDe(P).filter(a=>a.k===k)}
function bonusAsi(P,epico){const b={};asisDe(P).forEach(a=>{const soma=(x,v)=>{if(x)b[x]=(b[x]||0)+v};const t=TALENTOS_GERAIS[a.k];if(!!(t&&t.epico)!==!!epico)return;
  if(a.k==="aumento"){if(a.modo==="2")soma(a.a1,2);else{soma(a.a1,1);soma(a.a2,1)}}else if(t)soma(a.a1,1)});return b}
function atrFinal(P){const b=bonusAtr(P),ba=bonusAsi(P),be=bonusAsi(P,1),cap={},r={};if(nC(P,"barbaro")>=20)cap.FOR=cap.CON=4;if(nC(P,"monge")>=20)cap.DES=cap.SAB=4;
  ATR.forEach(x=>{let v=Math.min(20,(P.base[x]||8)+(b[x]||0)+(P.extras||[]).filter(k=>k===x).length+(ba[x]||0));if(cap[x])v=Math.min(25,v+cap[x]);if(be[x])v=Math.min(30,v+be[x]);r[x]=v});return r}
function salvProf(P,x){const c=CL(P);return !!(c&&c.salv.includes(x))||talG(P,"resiliente").some(a=>a.a1===x)||nC(P,"monge")>=14||(nC(P,"ladino")>=15&&(x==="SAB"||x==="CAR"))||(subDe(P,"patrulheiro")==="sombrio"&&nC(P,"patrulheiro")>=7&&x==="SAB")}
function auraPal(P){return nC(P,"paladino")>=6?Math.max(1,MOD(P).CAR):0}
function extraAtaque(P){return ["barbaro","guerreiro","monge","paladino","patrulheiro"].some(c=>nC(P,c)>=5)||(subDe(P,"bardo")==="valor"&&nC(P,"bardo")>=6)||invocsDe(P).includes("sedenta")}
function nAtaques(P){const g=nC(P,"guerreiro");return g>=20?4:g>=11?3:extraAtaque(P)?2:1}
function dadoMonge(P){const n=nC(P,"monge");return n>=17?"1d12":n>=11?"1d10":n>=5?"1d8":"1d6"}
function dadoBardo(P){const n=nC(P,"bardo");return n>=15?"d12":n>=10?"d10":n>=5?"d8":"d6"}
function escalaTruque(k,d,P){const nv=NV(P),x=nv>=17?4:nv>=11?3:nv>=5?2:1;if(x===1)return d;if(k==="rajadamistica")return x+" raios de "+d;return String(d).replace(/(\d+)d(\d+)/g,(m,a,b)=>(x*a)+"d"+b)}
/* v6: níveis 6 a 20 */
function danoFuria(n){return n>=16?4:n>=9?3:2}
function faces(d){const m=String(d).match(/^1d(\d+)$/);return m?+m[1]:String(d)==="1"?1:99}
function manobrasDe(P){return [...(subEsc(P,"guerreiro").manobras||[]),...escs(P,"manobras").flat()]}
function escNivel(P,c,l){const i=nivelGeral(P,c,l);return i>=2?(((P.niveis||[])[i-2]||{}).esc||{}):{}}
function potente(P,x){const k=x.fonte==="Clérigo"?"bencao":x.fonte==="Druida"?"furiaEl":null;return k&&escs(P,k)[0]==="potente"?" "+sinal(MOD(P).SAB):""}
/* recursos de subclasse que crescem com o nível */
function ajusteSub(c,n,r,nome){if(nome==="Superioridade em Combate"){r.max=n>=15?6:n>=7?5:4;r.n="Dados de Superioridade (d"+(n>=18?12:n>=10?10:8)+")"}
  if(nome==="Poder Psiônico"){r.max=n>=17?12:n>=13?10:n>=9?8:n>=5?6:4;r.n="Dados de Energia Psiônica (d"+(n>=17?12:n>=11?10:n>=5?8:6)+")"}
  if(nome==="Guerreiro dos Deuses")r.max=n>=17?7:n>=12?6:n>=6?5:4;return r}
const atrConj=c=>({bardo:"CAR",clerigo:"SAB",druida:"SAB",feiticeiro:"CAR",mago:"INT",bruxo:"CAR",paladino:"CAR",patrulheiro:"SAB",guerreiro:"INT",ladino:"INT",barbaro:"SAB",monge:"SAB"})[c];

/* talentos: inclui o de Lições dos Primeiros */
function slotsTalento(P){const s=[];const a=AN(P);if(a)s.push({slot:"ant",k:a.tal,lista:a.talOp||null});if(P.esp==="humano"&&P.ee.talHum)s.push({slot:"hum",k:P.ee.talHum,lista:null});
  if(invocsDe(P).includes("licoes")&&P.tal&&P.tal.lic&&P.tal.lic.k)s.push({slot:"lic",k:P.tal.lic.k,lista:null});
  asisDe(P).forEach(a=>{if(a.k.startsWith("o:")&&TALENTOS[a.k.slice(2)])s.push({slot:"nv"+a.nv,k:a.k.slice(2),lista:null})});return s}

/* ===== proficiências ===== */
function pericias(P){const m=periciasFixas(P);(P.perClasse||[]).forEach(p=>m.set(p,"classe"));periciasTalentos(P).forEach((v,k)=>m.set(k,v));
  (P.niveis||[]).forEach(n=>{const e=n.esc||{};(e.perMulti||[]).forEach(p=>m.set(p,"multiclasse"));if(e.perExtra)m.set(e.perExtra,"Conhecimento Primal");if(e.subEsc)(e.subEsc.per||[]).forEach(p=>m.set(p,"subclasse"))});
  classesDe(P).forEach(c=>{const s=subObj(P,c);if(s&&s.perFixas)s.perFixas.forEach(p=>m.set(p,"subclasse"))});
  asisDe(P).forEach(a=>{if(a.per&&!a.esp)m.set(a.per,"talento "+TALENTOS_GERAIS[a.k].n)});if(talG(P,"dpericia").length)SK.forEach(x=>{if(!m.has(x[0]))m.set(x[0],"Dádiva da Perícia")});return m}
function ferramentas(P){const f=[];const a=AN(P),c=CL(P);
  if(a){if(typeof a.ferr==="string")f.push(a.ferr);else if(P.ferrAnt)f.push(P.ferrAnt)}
  if(c&&c.ferr){if(c.ferr.fixa)f.push(c.ferr.fixa);else f.push(...(P.ferrClasse||[]))}
  slotsTalento(P).forEach(s=>{const t=P.tal[s.slot]||{};if(["artifice","musico","habilidoso"].includes(s.k))f.push(...(t.ferr||[]))});
  (P.niveis||[]).forEach(n=>{const e=n.esc||{};if(e.instrMulti)f.push(e.instrMulti);if(e.subEsc&&e.subEsc.ferr)f.push(e.subEsc.ferr)});
  classesDe(P).forEach(k=>{if(k!==P.classe&&MULTI_GANHA[k].ferr)f.push(MULTI_GANHA[k].ferr);const s=subObj(P,k);if(s&&s.ferrFixa)f.push(...[].concat(s.ferrFixa))});
  asisDe(P).forEach(a=>{const t=TALENTOS_GERAIS[a.k];if(t&&t.ferr)f.push(t.ferr)});
  return [...new Set(f)]}
function idiomasDe(P){const l=["Comum",...P.idiomas];const cs=classesDe(P);
  if(cs.includes("ladino")){l.push("Gíria de Ladrão");if(P.classe==="ladino"&&P.idiomaExtra)l.push(P.idiomaExtra);escs(P,"idiomaRogue").forEach(x=>l.push(x))}
  if(cs.includes("druida"))l.push("Druídico");escs(P,"explorador").forEach(x=>(x.idiomas||[]).forEach(i=>l.push(i)));return [...new Set(l)]}
function marciais(P){const c=CL(P);if(!c)return false;if(c.armas.m)return true;
  if(talG(P,"marciais").length)return true;
  return classesDe(P).some(k=>ordemDe(P,k)==="protetor"||ordemDe(P,k)==="guardiao"||(k!==P.classe&&MULTI_GANHA[k].m)||(subObj(P,k)&&subObj(P,k).prof&&subObj(P,k).prof.m))}
function treinoArmadura(P){const c=CL(P);if(!c)return [];const l=[...c.armad];
  classesDe(P).forEach(k=>{if(ordemDe(P,k)==="protetor")l.push("pesada");if(ordemDe(P,k)==="guardiao")l.push("media");if(k!==P.classe)l.push(...(MULTI_GANHA[k].armad||[]));
    const s=subObj(P,k);if(s&&s.prof)l.push(...(s.prof.armad||[]))});
  asisDe(P).forEach(a=>{const t=TALENTOS_GERAIS[a.k];if(t&&t.armad)l.push(...t.armad)});return [...new Set(l)]}
function textoArmas(P){const c=CL(P);if(!c)return "";if(marciais(P))return c.armas.m?c.armasTxt:"Simples e Marciais";return c.armasTxt}

/* ===== magia em vários níveis ===== */
function conjuradores(P){const out=[];const pc=niveisPorClasse(P);
  Object.keys(pc).forEach(c=>{const n=pc[c],cl=CLASSES[c];let g=null;
    if(cl.magia){const pr=PROG[c];g={c,atr:cl.magia.atr,lista:cl.magia.lista,truques:pr.truques[n-1],prep:pr.prep[n-1],tipo:c==="bruxo"?"pacto":CHEIO.includes(c)?"cheio":"meio",
      sempre:[...(cl.magia.sempre||[])],grimorio:c==="mago"?6+2*(n-1):0,sugT:cl.magia.sugT,sugP:cl.magia.sugP,sugG:cl.magia.sugG};
      if((c==="clerigo"&&ordemDe(P,c)==="taumaturgo")||(c==="druida"&&ordemDe(P,c)==="magico"))g.truques++;
      if(c==="paladino"&&n>=2)g.sempre.push("destruicaodivina");if(c==="paladino"&&n>=5)g.sempre.push("montaria");
      if(c==="bardo"&&n>=20)g.sempre.push("palavrapodercurar","palavrapodermatar");if(c==="bruxo"&&n>=9)g.sempre.push("contatooutroplano");if(c==="bardo"&&n>=10)g.listas=["Bardo","Clérigo","Druida","Mago"]}
    const s=subObj(P,c);if(!g&&s&&s.magiaSub&&n>=3)g={c,atr:s.magiaSub.atr,lista:s.magiaSub.lista,truques:s.magiaSub.truques+(n>=10?1:0),prep:PREP_TERCO[n]||s.magiaSub.prep,tipo:"terco",sempre:[],fixos:s.magiaSub.fixos||[],grimorio:0};
    if(g){g.nivel=n;g.nome=cl.n;g.maxNv=g.tipo==="pacto"?PACTO[n][1]:(g.tipo==="cheio"?TAB_ESPACOS[n]:g.tipo==="meio"?ESP_MEIO[n]:(ESP_TERCO[n]||[2])).length;out.push(g)}});
  return out}
function espacosDe(P){const cs=conjuradores(P).filter(g=>g.tipo!=="pacto");let tab=[];
  if(cs.length>=2){let L=0;cs.forEach(g=>{L+=g.tipo==="cheio"?g.nivel:g.tipo==="meio"?Math.ceil(g.nivel/2):Math.floor(g.nivel/3)});tab=TAB_ESPACOS[Math.min(L,20)]||[]}
  else if(cs.length===1){const g=cs[0];tab=g.tipo==="cheio"?TAB_ESPACOS[g.nivel]:g.tipo==="meio"?ESP_MEIO[g.nivel]:(ESP_TERCO[g.nivel]||[2])}
  const pc=conjuradores(P).find(g=>g.tipo==="pacto");return {tab:tab||[],pacto:pc?PACTO[pc.nivel]:null}}
function grimorioDe(P){const L=magClasse(P,"mago");const extra=[];if(subObj(P,"mago"))extra.push(...(subEsc(P,"mago").escola||[]));return [...new Set([...(L.grim||[]),...extra])]}
function magiasDe(P){const r=[];const pc=niveisPorClasse(P);
  conjuradores(P).forEach(g=>{const L=magClasse(P,g.c);(g.fixos||[]).forEach(k=>r.push({k,fonte:g.nome,atr:g.atr}));
    (L.truques||[]).forEach(k=>r.push({k,fonte:g.nome,atr:g.atr}));g.sempre.forEach(k=>r.push({k,fonte:g.nome,atr:g.atr,nota:(k==="destruicaodivina"||k==="montaria")?"sempre preparada; 1× por descanso longo sem espaço":"sempre preparada"}));
    (L.prep||[]).forEach(k=>r.push({k,fonte:g.nome,atr:g.atr,nota:g.c==="mago"?"preparada (do grimório)":null}));
    if(g.c==="mago")grimorioDe(P).filter(k=>!(L.prep||[]).includes(k)).forEach(k=>r.push({k,fonte:"Grimório",atr:g.atr,nota:"no grimório, não preparada",naoPrep:1}))});
  Object.keys(pc).forEach(c=>{const s=subObj(P,c);if(!s||pc[c]<3)return;const a=atrConj(c);
    (s.magias||[]).forEach(k=>r.push({k,fonte:s.n,atr:a,nota:c==="barbaro"?"só como Ritual":"sempre preparada"}));
    [5,6,7,9,10,13,17,18].forEach(l=>{if(pc[c]>=l)(s["m"+l]||[]).forEach(k=>r.push({k,fonte:s.n,atr:a,nota:"sempre preparada"}))});
    if(c==="druida"&&subDe(P,c)==="terra"&&subEsc(P,c).terra)TERRAS[subEsc(P,c).terra][1].concat(pc[c]>=5?TERRAS[subEsc(P,c).terra][2]:[],pc[c]>=7?TERRAS[subEsc(P,c).terra][3]||[]:[],pc[c]>=9?TERRAS[subEsc(P,c).terra][4]||[]:[]).forEach(k=>r.push({k,fonte:"Círculo da Terra",atr:"SAB",nota:"sempre preparada (terra "+TERRAS[subEsc(P,c).terra][0]+")"}));
    if(c==="barbaro"&&subDe(P,c)==="coracao")["sentidobestial","falaranimais"].forEach(k=>r.push({k,fonte:s.n,atr:"SAB",nota:"só como Ritual"}));
    (s.truques||[]).forEach(([k,at])=>r.push({k,fonte:s.n,atr:at}))});
  (P.niveis||[]).forEach(n=>{const e=n.esc||{};(e.truquesEstilo||[]).forEach(k=>r.push({k,fonte:n.c==="paladino"?"Guerreiro Abençoado":"Guerreiro Druídico",atr:n.c==="paladino"?"CAR":"SAB"}))});
  escs(P,"descobertas").flat().forEach(k=>r.push({k,fonte:"Descobertas Mágicas",atr:"CAR",nota:"sempre preparada"}));escs(P,"arcano").forEach(k=>r.push({k,fonte:"Arcana Mística",atr:"CAR",nota:"1× por descanso longo sem espaço"}));
  escs(P,"maestriaMagia").flat().forEach(k=>r.push({k,fonte:"Maestria em Magia",atr:"INT",nota:"sempre preparada; sem espaço no nível mais baixo"}));escs(P,"assinatura").flat().forEach(k=>r.push({k,fonte:"Magia de Assinatura",atr:"INT",nota:"sempre preparada; 1× por descanso curto no nível 3 sem espaço"}));
  const e=ES(P);if(e){(e.truques||[]).forEach(([k,a])=>r.push({k,fonte:e.n,atr:a==="legado"?(P.ee.atrMagia||"CAR"):a}));
    if(P.esp==="elfo"&&P.ee.linhagem)r.push({k:LINHAGEM_ELFO[P.ee.linhagem][2],fonte:"Linhagem Élfica",atr:P.ee.atrMagia||"INT"});
    if(P.esp==="elfo"&&P.ee.linhagem&&NV(P)>=5)r.push({k:{drow:"escuridao",alto:"passonebuloso",floresta:"passosemrastro"}[P.ee.linhagem],fonte:"Linhagem Élfica",atr:P.ee.atrMagia||"INT",nota:"1× por descanso longo sem espaço"});
    if(P.esp==="elfo"&&P.ee.linhagem&&NV(P)>=3)r.push({k:{drow:"fogofadas",alto:"detectarmagia",floresta:"passoslargos"}[P.ee.linhagem],fonte:"Linhagem Élfica",atr:P.ee.atrMagia||"INT",nota:"1× por descanso longo sem espaço"});
    if(P.esp==="gnomo"&&P.ee.linhagem){LINHAGEM_GNOMO[P.ee.linhagem][2].forEach(k=>r.push({k,fonte:"Linhagem Gnômica",atr:P.ee.atrMagia||"INT"}));
      if(P.ee.linhagem==="floresta")r.push({k:"falaranimais",fonte:"Gnomo da Floresta",atr:P.ee.atrMagia||"INT",nota:"sempre preparada; sem espaço vezes = proficiência"})}
    if(P.esp==="tiferino"&&P.ee.legado){r.push({k:LEGADOS[P.ee.legado][2],fonte:"Legado Infernal",atr:P.ee.atrMagia||"CAR"});
      if(NV(P)>=3)r.push({k:{abissal:"raioadoecente",ctonico:"vidafalsa",infernal:"repreensao"}[P.ee.legado],fonte:"Legado Infernal",atr:P.ee.atrMagia||"CAR",nota:"1× por descanso longo sem espaço"});
      if(NV(P)>=5)r.push({k:{abissal:"imobilizar",ctonico:"enfraquecimento",infernal:"escuridao"}[P.ee.legado],fonte:"Legado Infernal",atr:P.ee.atrMagia||"CAR",nota:"1× por descanso longo sem espaço"})}}
  slotsTalento(P).forEach(s=>{if(s.k!=="iniciado")return;const t=P.tal[s.slot]||{};(t.truques||[]).forEach(k=>r.push({k,fonte:"Iniciado em Magia",atr:t.atr||"SAB"}));
    if(t.magia)r.push({k:t.magia,fonte:"Iniciado em Magia",atr:t.atr||"SAB",nota:"1× por descanso longo sem espaço"})});
  const iv=invocsDe(P);
  if(iv.includes("tomo")){(P.tomoT||[]).forEach(k=>r.push({k,fonte:"Pacto do Tomo",atr:"CAR"}));(P.tomoR||[]).forEach(k=>r.push({k,fonte:"Pacto do Tomo",atr:"CAR",nota:"ritual do Livro das Sombras"}));
    escs(P,"tomoT").flat().forEach(k=>r.push({k,fonte:"Pacto do Tomo",atr:"CAR"}));escs(P,"tomoR").flat().forEach(k=>r.push({k,fonte:"Pacto do Tomo",atr:"CAR",nota:"ritual do Livro das Sombras"}))}
  [["corrente","familiar","sem gastar espaço"],["sombras","armaduramago","em si mesmo, sem gastar espaço"],["mascara","disfarcar","sem gastar espaço"],["visoes","imagem","sem gastar espaço"],["salto","salto","em si mesmo, sem gastar espaço"],["vigor","vidafalsa","em si mesmo, sem espaço, PV máximos"],["ascendente","levitacao","em si mesmo, sem gastar espaço"],["formas","alterarse","sem gastar espaço"],["sombras5","invisibilidade","em si mesmo, na penumbra ou escuridão, sem espaço"],["profundezas","respirarnagua","1× por descanso longo sem espaço"],["sussurros","falarmortos","sem gastar espaço"],["visoesreinos","olhoarcano","sem gastar espaço"]]
    .forEach(([i,k,nota])=>{if(iv.includes(i))r.push({k,fonte:"Invocação",atr:"CAR",nota})});
  asisDe(P).forEach(a=>{const t=TALENTOS_GERAIS[a.k];if(!t)return;const at=a.a1||"INT";
    if(t.fixa)r.push({k:t.fixa,fonte:t.n,atr:at,nota:"sempre preparada; 1× por descanso longo sem espaço"});
    if(a.magia)r.push({k:a.magia,fonte:t.n,atr:at,nota:"sempre preparada; 1× por descanso longo sem espaço"});
    if(t.truque)r.push({k:t.truque,fonte:t.n,atr:at});(a.rituais||[]).forEach(k=>r.push({k,fonte:t.n,atr:at,nota:"ritual sempre preparado"}))});
  const vist=new Set();return r.filter(x=>{if(!magia(x.k))return false;const id=x.k+"|"+x.fonte;if(vist.has(id))return false;vist.add(id);return true})}

/* ===== recursos ===== */
function recursos(P){const m=MOD(P),pb=pbP(P),r=[];const pc=niveisPorClasse(P),e=ES(P);
  const num=(v,c)=>v==="PB"?pb:v==="modCAR"?Math.max(1,m.CAR):v==="modSAB"?Math.max(1,m.SAB):v==="nivel"?pc[c]:v==="1+nivel"?1+pc[c]:v;
  Object.keys(pc).forEach(c=>{const cl=CLASSES[c],n=pc[c],suf=c===P.classe?"":"_"+c;
    cl.n1.forEach(f=>{if(!f.uso)return;let mx=num(f.uso.max,c);if(f.k==="furia")mx=FURIAS[n];if(f.k==="impor")mx=5*n;if(f.k==="folego")mx=n>=10?4:n>=4?3:2;if(f.k==="inimigo")mx=2+Math.floor((n-1)/4);
      r.push({k:f.k+suf,n:f.n,max:mx,volta:f.k==="inspiracao"&&n>=5?"curto":f.uso.volta,reserva:f.uso.reserva,x:f.x})});
    for(let l=2;l<=n;l++)((NIVEIS[c]||{})[l]||[]).forEach(f=>{if(!f.uso)return;let mx=num(f.uso.max,c);if(f.k==="surto"&&n>=17)mx=2;if(f.k==="indomavel")mx=n>=17?3:n>=13?2:1;
      if(f.k==="canalizar")mx=n>=18?4:n>=6?3:2;if(f.k==="canalizarpal"&&n>=11)mx=3;if(f.k==="formasel")mx=n>=17?4:n>=6?3:2;r.push({k:f.k,n:f.n,max:mx,volta:f.uso.volta,x:f.x})});
    const s=subObj(P,c);if(s&&n>=3){s.tr.forEach(t=>{if(t[2])r.push(ajusteSub(c,n,{k:"sub_"+c+"_"+t[0],n:t[2].n||t[0],max:num(t[2].max,c),volta:t[2].volta,reserva:t[2].reserva,x:t[1]},t[0]))});
      Object.entries(s.alto||{}).forEach(([l,ts])=>{if(n>=+l)ts.forEach(t=>{if(t[2])r.push({k:"sub_"+c+"_"+t[0],n:t[2].n||t[0],max:num(t[2].max,c),volta:t[2].volta,x:t[1]})})})}});
  if(e)e.tracos.forEach(t=>{if(t[2])r.push({k:"esp_"+t[0],n:t[0],max:num(t[2].max),volta:t[2].volta,x:t[1]})});
  if(P.esp==="golias"&&P.ee.gigante){const g=GIGANTES[P.ee.gigante];const i=r.findIndex(x=>x.n==="Ancestralidade Gigante");if(i>=0){r[i].n=g[0];r[i].x=g[1]+" Usos iguais ao bônus de proficiência por descanso longo."}}
  if(P.esp==="gnomo"&&P.ee.linhagem==="floresta")r.push({k:"esp_falar",n:"Falar com Animais (sem espaço)",max:pb,volta:"longo",x:"Gnomo da Floresta: conjura Falar com Animais sem espaço de magia, vezes iguais ao bônus de proficiência."});
  if(NV(P)>=5){if(P.esp==="draconato")r.push({k:"esp_voo",n:"Voo Dracônico",max:1,volta:"longo",x:ESPECIES.draconato.tracos.find(t=>t[0]==="Voo Dracônico")[1]});
    if(P.esp==="golias")r.push({k:"esp_grande",n:"Forma Grande",max:1,volta:"longo",x:ESPECIES.golias.tracos.find(t=>t[0]==="Forma Grande")[1]});
    if(["elfo","tiferino"].includes(P.esp))r.push({k:"esp_magia5",n:"Magia de nível 5 da espécie (sem espaço)",max:1,volta:"longo",x:"A magia que a espécie dá no nível 5 pode ser conjurada 1 vez sem espaço por descanso longo."})}
  asisDe(P).forEach(a=>{const t=TALENTOS_GERAIS[a.k];if(!t)return;if(t.uso)r.push({k:"tg_"+a.k+a.nv,n:t.n,max:t.uso.max,volta:t.uso.volta,x:t.x});
    [t.fixa,a.magia].filter(Boolean).forEach(k=>r.push({k:"tgm_"+k,n:nm(k)+" (sem espaço)",max:1,volta:"longo",x:t.n+": conjura esta magia 1 vez sem espaço por descanso longo."}))});
  escs(P,"arcano").forEach(k=>r.push({k:"arc_"+k,n:nm(k)+" (Arcana Mística)",max:1,volta:"longo",x:"Arcana Mística: conjura esta magia 1 vez sem espaço por descanso longo."}));
  escs(P,"assinatura").flat().forEach(k=>r.push({k:"ass_"+k,n:nm(k)+" (Assinatura)",max:1,volta:"curto",x:"Magia de Assinatura: conjura 1 vez no nível 3 sem espaço por descanso curto ou longo."}));
  if(invocsDe(P).includes("profundezas"))r.push({k:"inv_profundezas",n:"Respirar na Água (sem espaço)",max:1,volta:"longo",x:"Dádiva das Profundezas: conjura Respirar na Água 1 vez sem espaço por descanso longo."});
  if(["elfo","tiferino"].includes(P.esp)&&NV(P)>=3)r.push({k:"esp_magia3",n:"Magia de nível 3 da espécie (sem espaço)",max:1,volta:"longo",x:"A magia que a espécie dá no nível 3 pode ser conjurada 1 vez sem espaço por descanso longo."});
  slotsTalento(P).forEach(s=>{const t=TALENTOS[s.k];if(t.uso)r.push({k:"tal_"+s.slot,n:"Pontos de Sorte",max:num(t.uso.max),volta:t.uso.volta,x:t.x});
    if(s.k==="iniciado"&&(P.tal[s.slot]||{}).magia)r.push({k:"ini_"+s.slot,n:nm(P.tal[s.slot].magia)+" (sem espaço)",max:1,volta:"longo",x:"Iniciado em Magia: conjura esta magia 1 vez sem espaço por descanso longo."})});
  return r}

/* ===== números ===== */
function pvMax(P){const c=CL(P);if(!c)return 0;const m=MOD(P);let v=c.dv+m.CON;(P.niveis||[]).forEach(n=>{v+=Math.max(1,(n.pv||0)+m.CON)});
  const nv=NV(P);if(P.esp==="anao")v+=nv;if(temTalento(P,"vigoroso"))v+=2*nv;v+=40*talG(P,"dfortitude").length;const ns=nC(P,"feiticeiro");if(subDe(P,"feiticeiro")==="draconica"&&ns>=3)v+=3+(ns-3);return Math.max(1,v)}
function caCalc(P){const m=MOD(P),j=P.jogo||{},disp=armadurasDisp(P),tr=treinoArmadura(P),cs=classesDe(P);
  const corpo=j.arm!==undefined?j.arm:(disp.find(k=>k!=="escudo"&&tr.includes(armadura(k)[2]))||null);
  const escudo=j.escudo!==undefined?j.escudo:(disp.includes("escudo")&&tr.includes("escudo")&&!cs.includes("monge"));
  let base,txt;const a=corpo?armadura(corpo):null;
  if(a){const lim=a[4]===2&&talG(P,"mestremedia").length&&atrFinal(P).DES>=16?3:a[4];const d=lim===null?m.DES:Math.min(lim,m.DES);base=a[3]+d;txt=a[1]+" "+a[3]+(lim===0?"":" + DES "+sinal(d))}
  else{const op=[[10+m.DES,"Sem armadura: 10 + DES "+sinal(m.DES)]];
    if(cs.includes("barbaro"))op.push([10+m.DES+m.CON,"Defesa sem Armadura (Bárbaro): 10 + DES "+sinal(m.DES)+" + CON "+sinal(m.CON)]);
    if(cs.includes("monge")&&!escudo)op.push([10+m.DES+m.SAB,"Defesa sem Armadura (Monge): 10 + DES "+sinal(m.DES)+" + SAB "+sinal(m.SAB)]);
    if(subDe(P,"bardo")==="danca"&&nC(P,"bardo")>=3&&!escudo)op.push([10+m.DES+m.CAR,"Passos Deslumbrantes: 10 + DES "+sinal(m.DES)+" + CAR "+sinal(m.CAR)]);
    if(subDe(P,"feiticeiro")==="draconica"&&nC(P,"feiticeiro")>=3)op.push([10+m.DES+m.CAR,"Resiliência Dracônica: 10 + DES "+sinal(m.DES)+" + CAR "+sinal(m.CAR)]);
    op.sort((x,y)=>y[0]-x[0]);[base,txt]=op[0]}
  let ca=base;if(escudo){ca+=2;txt+=" + Escudo 2"}if(a&&estilosDe(P).includes("defesa")){ca+=1;txt+=" + Defesa 1"}
  return {ca,txt,corpo,escudo}}
function iniciativa(P){const m=MOD(P);let v=m.DES;if(temTalento(P,"alerta"))v+=pbP(P);if(subDe(P,"patrulheiro")==="sombrio"&&nC(P,"patrulheiro")>=3)v+=m.SAB;return v}
function deslocamento(P){const e=ES(P);let d=!e?9:(P.esp==="elfo"&&P.ee.linhagem==="floresta"?10.5:e.desl);
  const nmg=nC(P,"monge");if(nmg>=2){const ca=caCalc(P);if(!ca.corpo&&!ca.escudo)d+=nmg>=18?9:nmg>=14?7.5:nmg>=10?6:nmg>=6?4.5:3}
  if(nC(P,"barbaro")>=5){const ca=caCalc(P);if(!ca.corpo||armadura(ca.corpo)[2]!=="pesada")d+=3}
  if(nC(P,"patrulheiro")>=6){const ca=caCalc(P);if(!ca.corpo||armadura(ca.corpo)[2]!=="pesada")d+=3}if(subDe(P,"paladino")==="gloria"&&nC(P,"paladino")>=7)d+=3;
  if(talG(P,"rapido").length)d+=3;d+=9*talG(P,"dvelocidade").length;return d}
function visao(P){const e=ES(P);let v=!e?0:(P.esp==="elfo"&&P.ee.linhagem==="drow"?36:e.visao);
  classesDe(P).forEach(c=>{const s=subObj(P,c);if(s&&s.visaoMais&&nC(P,c)>=3)v=v?v+s.visaoMais:s.visaoMais});return v}
function resumoCurto(P){const pc=niveisPorClasse(P);const cs=Object.keys(pc).map(c=>{const s=subObj(P,c);return CLASSES[c].n+" "+pc[c]+(s?" ("+s.n+")":"")});
  return [cs.length?cs.join(" / "):null,ES(P)?ES(P).n:null,AN(P)?AN(P).n:null].filter(Boolean).join(" · ")}
function dadoFurtivo(P){return Math.ceil(nC(P,"ladino")/2)+"d6"}
function ataques(P){const m=MOD(P),pb=pbP(P),out=[];const mon=nC(P,"monge")>0,mae=maestriasDe(P),est=estilosDe(P);
  itensEquip(P).itens.filter(i=>i.t==="a").forEach(i=>{const a=arma(i.k);const prof=profArma(P,i.k);
    const monk=mon&&a[3]==="C"&&(a[2]==="S"||a[6].includes("Leve"));
    let at=a[3]==="D"?m.DES:(a[6].includes("Acuidade")||monk)?Math.max(m.FOR,m.DES):m.FOR;
    let dado=a[4];const dm0=dadoMonge(P);if(monk&&faces(dado)<faces(dm0))dado=dm0;
    let hit=at+(prof?pb:0)+(a[3]==="D"&&est.includes("arquearia")?2:0);
    const ver=(a[6].find(p=>p.startsWith("Versátil"))||"").match(/\((.*)\)/);
    out.push({k:"arma:"+i.k,n:a[1]+(i.q>1?" ×"+i.q:""),hit:sinal(hit),dano:dado+(at?" "+sinal(at):"")+" "+a[5]+(ver?" (duas mãos "+ver[1]+")":""),
      sub:[a[8]?"alcance "+a[8]:null,mae.includes(i.k)?"maestria: "+a[7]:null,!prof?"sem proficiência":null].filter(Boolean).join(" · ")})});
  if(subDe(P,"ladino")==="alma"&&nC(P,"ladino")>=3){const at=Math.max(m.FOR,m.DES);out.push({k:"psi",n:"Lâmina Psíquica",hit:sinal(at+pb),dano:"1d6 "+sinal(at)+" Psíquico",sub:"arremesso 18/36 m · maestria Irritar · Ação Bônus: 2ª lâmina 1d4"})}
  let dd="1",dm=m.FOR,nota="",hitU=m.FOR;
  if(mon){dd=dadoMonge(P);dm=Math.max(m.FOR,m.DES);hitU=dm;nota="Artes Marciais: também como Ação Bônus"}
  else if(subDe(P,"bardo")==="danca"&&nC(P,"bardo")>=3){dd=dadoBardo(P)+" (Inspiração)";dm=m.DES;hitU=Math.max(m.FOR,m.DES);nota="Passos Deslumbrantes, sem armadura e escudo"}
  else if(est.includes("desarmado")){dd="1d6 (1d8 sem arma e escudo)";nota="Combate Desarmado"}else if(temTalento(P,"brigao")){dd="1d4";nota="Brigão de Taverna"}
  out.push({k:"desarmado",n:"Ataque Desarmado",hit:sinal(hitU+pb),dano:(dd==="1"?String(Math.max(1,1+dm)):dd+" "+sinal(dm))+" Contundente",sub:nota});
  magiasDe(P).forEach(x=>{const s=magia(x.k);if(!s||s[2]!==0||!s[12])return;const fx=s[12];const mm=m[x.atr]||0;
    if(fx[0]==="ataque")out.push({k:"mag:"+x.k,n:s[1],hit:sinal(mm+pb),dano:escalaTruque(x.k,fx[1],P)+potente(P,x)+" "+fx[2],sub:"truque · "+x.fonte,mag:1});
    else if(ATR.includes(fx[0]))out.push({k:"mag:"+x.k,n:s[1],hit:"CD "+(8+pb+mm),dano:escalaTruque(x.k,fx[1],P)+potente(P,x)+" "+fx[2],sub:"truque · resistência de "+ATR_N[fx[0]],mag:1})});
  const bm=magiasDe(P).find(x=>x.k==="bordaomistico");
  if(bm){const mm=m[bm.atr]||0;["bordao","clava"].forEach(w=>{if(itensEquip(P).itens.some(i=>i.t==="a"&&i.k===w))out.push({k:"mag:bordaomistico",n:arma(w)[1]+" com Bordão Místico",hit:sinal(mm+pb),dano:(NV(P)>=17?"2d6":NV(P)>=11?"1d12":NV(P)>=5?"1d10":"1d8")+" "+sinal(mm)+" Contundente ou Energia",sub:"depois de ativar a magia (Ação Bônus, 1 minuto)",mag:1})})}
  return out}
function tracosDe(P){const t=[];const pc=niveisPorClasse(P),a=AN(P),e=ES(P);const est=estilosDe(P),iv=invocsDe(P);
  Object.keys(pc).forEach(c=>{const cl=CLASSES[c],n=pc[c],multi=c!==P.classe;
    cl.n1.forEach(f=>{let x=f.x;
      if(f.k==="estilo"){const s=multi?escs(P,"estilo").find(Boolean):P.estilo;if(s)x="**"+ESTILOS[s][0]+":** "+ESTILOS[s][1]}
      if(f.k==="ordem"&&ordemDe(P,c))x="**"+ORDEM_CLERIGO[ordemDe(P,c)][0]+":** "+ORDEM_CLERIGO[ordemDe(P,c)][1];
      if(f.k==="ordemprimal"&&ordemDe(P,c))x="**"+ORDEM_DRUIDA[ordemDe(P,c)][0]+":** "+ORDEM_DRUIDA[ordemDe(P,c)][1];
      if(f.k==="invocacoes"&&iv.length)x="Você tem "+iv.length+" Invocações Místicas.\n- **Escolhidas:** "+lista(iv.map(nomeInvoc))+".\n- **Detalhes:** toque em cada uma na lista de características.";
      if(f.k==="maestria"&&maestriasDe(P).length)x+="\n- **Escolhidas:** "+lista(maestriasDe(P).map(k=>arma(k)[1]))+".";
      if(f.k==="especializacao"&&especialDe(P).length)x+="\n- **Escolhidas:** "+lista(especialDe(P))+".";
      if(f.k==="furtivo")x=x.replace("+1d6","+"+dadoFurtivo(P));
      if(f.k==="artesmarciais"&&n>=5)x=x.replace("rolar 1d6","rolar "+dadoMonge(P));
      if(f.k==="inspiracao"&&n>=5)x=x.replace("Ele recebe um d6.","Ele recebe um "+dadoBardo(P)+".").replace("rola o d6","rola o "+dadoBardo(P)).replace("Voltam no descanso longo.","Voltam no descanso curto ou longo.");
      if(f.k==="folego"&&n>=4)x=x.replace("**Usos:** 2.","**Usos:** "+(n>=10?4:3)+".");
      if(f.k==="inimigo"&&n>=5)x=x.replace("pode conjurá-la 2 vezes","pode conjurá-la "+(2+Math.floor((n-1)/4))+" vezes");if(f.k==="furia")x=x.replace("**Usos:** 2.","**Usos:** "+FURIAS[n]+".").replace("+2 no dano","+"+danoFuria(n)+" no dano");
      if(f.k==="impor")x=x.replace("(5 no nível 1)","("+5*n+" agora)");
      t.push({k:"cls:"+c+":"+f.k,n:f.n,de:cl.n+" 1"+(multi?" (multiclasse)":""),x})});
    for(let l=2;l<=n;l++)((NIVEIS[c]||{})[l]||[]).forEach(f=>{let x=f.x;
      if(f.k==="metamagia"){const mm=escs(P,"metamagia").flat();if(mm.length)x+="\n- **Escolhidas:** "+lista(mm.map(k=>METAMAGIAS[k][0]))+"."}
      if(f.k==="especializacao"||f.k==="explorador"||f.k==="erudito"){const ex=especialDe(P);if(ex.length)x+="\n- **Suas especializações:** "+lista(ex)+"."}
      if(f.k==="estilopal"||f.k==="estilopat"){const s=escs(P,f.k==="estilopal"?"estiloPal":"estiloPat")[0];if(s&&ESTILOS[s])x="**"+ESTILOS[s][0]+":** "+ESTILOS[s][1];else if(s)x=(s==="abencoado"?"Guerreiro Abençoado":"Guerreiro Druídico")+": você aprendeu 2 truques.\n- **Truques:** "+lista(escs(P,"truquesEstilo").flat().map(nm))+"."}
      if(f.k==="primal"&&escs(P,"perExtra")[0])x+="\n- **Escolhida:** "+escs(P,"perExtra")[0]+".";
      if(f.k==="formasel"&&n>=4)x=x.replace("você conhece 4 Bestas de ND até 1/4","você conhece 6 Bestas de ND até 1/2");
      if(f.k==="fonte"&&n>=5)x=x.replace("de nível 2 custa 3 (a partir do nível 3 de Feiticeiro)","de nível 2 custa 3; de nível 3 custa 5");
      if(f.k==="asi"||f.k==="epico"){const a=asisDe(P).find(z=>z.nv===nivelGeral(P,c,l));if(a)x=textoAsi(a)}
      if(/^maestria\d/.test(f.k)){const w=escNivel(P,c,l).maestria1;if(w)x+="\n- **Escolhida:** "+arma(w)[1]+"."}
      if(f.esc==="arcano"&&escNivel(P,c,l).arcano)x+="\n- **Escolhida:** "+nm(escNivel(P,c,l).arcano)+".";
      if(f.esc==="bencao"||f.esc==="furiaEl"){const o=escNivel(P,c,l)[f.esc];if(o)x+="\n- **Escolhida:** "+({divino:"Golpe Divino",potente:"Conjuração Potente",primal:"Golpe Primal"})[o]+"."}
      if((f.esc==="maestriaMagia"||f.esc==="assinatura")&&(escNivel(P,c,l)[f.esc]||[]).length)x+="\n- **Escolhidas:** "+lista(escNivel(P,c,l)[f.esc].map(nm))+".";
      if(f.esc==="invoc5"&&f.qtd){const iv1=escNivel(P,c,l).invoc5||[];if(iv1.length)x+="\n- **Escolhida agora:** "+lista(iv1.map(nomeInvoc))+"."}
      if(f.k==="invoc5"){const iv5=escs(P,"invoc5").flat();if(iv5.length)x+="\n- **Escolhidas agora:** "+lista(iv5.map(k=>nomeInvoc(k)))+"."}
      t.push({k:"cls:"+c+":"+f.k,n:f.n,de:cl.n+" "+l,x})});
    const s=subObj(P,c);if(s&&n>=3){const se=subEsc(P,c);s.tr.forEach(tr=>{let x=tr[1];
      if(tr[0]==="Superioridade em Combate"){const r=ajusteSub(c,n,{},tr[0]);x+="\n- **Agora:** "+r.max+" "+r.n.replace("Dados de Superioridade","dados")+".";if(manobrasDe(P).length)x+="\n- **Suas manobras:** "+lista(manobrasDe(P).map(k=>MANOBRAS[k][0]))+"."}
      if(tr[0]==="Poder Psiônico"){const r=ajusteSub(c,n,{},tr[0]);x+="\n- **Agora:** "+r.max+" "+r.n.replace("Dados de Energia Psiônica","dados")+"."}
      if(tr[0]==="Estudante da Guerra"&&(se.ferr||se.per))x+="\n- **Escolhidas:** "+lista([se.ferr,...(se.per||[])].filter(Boolean))+".";
      if(tr[0]==="Magias do Círculo"&&se.terra)x+="\n- **Terra de agora:** "+TERRAS[se.terra][0]+".";
      if(tr[0]==="Companheiro Primal"&&se.fera)x+="\n- **Sua fera:** "+FERAS[se.fera][0]+".\n"+FERAS[se.fera][1].split("\n").map(l=>"  "+l).join("\n");
      if(tr[0]==="Presa do Caçador"&&se.presa)x+="\n- **Escolhida agora:** "+(se.presa==="colossos"?"Matador de Colossos":"Quebra-Hordas")+".";
      if(tr[0]==="Proficiências Extras"&&se.per)x+="\n- **Escolhidas:** "+lista(se.per)+".";if(tr[0]==="Glamour de Outro Mundo"&&se.per)x+="\n- **Escolhida:** "+lista(se.per)+".";
      if(tr[0].startsWith("Sábio d")&&se.escola)x+="\n- **No seu grimório:** "+lista(se.escola.map(nm))+".";
      t.push({k:"sub:"+c+":"+tr[0],n:tr[0],de:s.n,x})});
    Object.entries(s.alto||{}).forEach(([l,ts])=>{if(n>=+l)ts.forEach(tr=>{let x=tr[1];
      if(tr[0]==="Estilo de Luta Adicional"){const k=escs(P,"estiloExtra")[0];if(k&&ESTILOS[k])x+="\n- **Escolhido:** "+ESTILOS[k][0]+"."}
      if(tr[0]==="Descobertas Mágicas"&&escs(P,"descobertas").flat().length)x+="\n- **Escolhidas:** "+lista(escs(P,"descobertas").flat().map(nm))+".";
      t.push({k:"sub:"+c+":"+tr[0],n:tr[0],de:s.n+" "+l,x})})})}});
  iv.forEach(k=>{const d=INVOCACOES[k]||INVOCACOES_N2[k]||INVOCACOES_N5[k]||INVOCACOES_ALTAS[k];if(d)t.push({k:"inv:"+k,n:d[0],de:"Invocação Mística",x:d[1]})});
  asisDe(P).forEach(a=>{const tg=TALENTOS_GERAIS[a.k];if(tg&&a.k!=="aumento")t.push({k:"tg:"+a.nv,n:tg.n,de:"talento (nível "+a.nv+")",x:tg.x+detalheTalento(a)})});
  manobrasDe(P).forEach(k=>t.push({k:"man:"+k,n:MANOBRAS[k][0],de:"Manobra",x:MANOBRAS[k][1]}));
  escs(P,"metamagia").flat().forEach(k=>t.push({k:"meta:"+k,n:METAMAGIAS[k][0],de:"Metamagia · "+METAMAGIAS[k][1]+" ponto"+(METAMAGIAS[k][1]>1?"s":""),x:METAMAGIAS[k][2]}));
  if(e)e.tracos.forEach(tr=>{let x=tr[1];if(tr[0]==="Ancestralidade Dracônica"&&P.ee.ancestral){const an=ANCESTRAIS.find(z=>z[0]===P.ee.ancestral);x="Seu dragão ancestral é "+an[0]+".\n- **Sopro:** dano de "+an[1]+".\n- **Resistência:** leva metade do dano de "+an[1]+"."}
    if(tr[0]==="Linhagem Élfica"&&P.ee.linhagem)x="Você é "+LINHAGEM_ELFO[P.ee.linhagem][0]+".\n"+LINHAGEM_ELFO[P.ee.linhagem][1];
    if(tr[0]==="Linhagem Gnômica"&&P.ee.linhagem)x="Você é "+LINHAGEM_GNOMO[P.ee.linhagem][0]+".\n"+LINHAGEM_GNOMO[P.ee.linhagem][1];
    if(tr[0]==="Ancestralidade Gigante"&&P.ee.gigante)x="Seu dom é "+GIGANTES[P.ee.gigante][0]+".\n"+GIGANTES[P.ee.gigante][1]+"\n- **Usos:** iguais ao bônus de proficiência. Voltam no descanso longo.";
    if(tr[0]==="Legado Infernal"&&P.ee.legado)x="Seu legado é "+LEGADOS[P.ee.legado][0]+".\n"+LEGADOS[P.ee.legado][1];
    if((tr[0]==="Sentidos Aguçados"||tr[0]==="Habilidoso")&&P.ee.per)x="Proficiência em "+P.ee.per+".";
    if(tr[0]==="Sopro"&&NV(P)>=5)x=x.replace("**Dano:** 1d10","**Dano:** "+(NV(P)>=17?4:NV(P)>=11?3:2)+"d10");
    if(tr[0]==="Versátil"&&P.ee.talHum)x="Talento de Origem: "+TALENTOS[P.ee.talHum].n+".";
    t.push({k:"esp:"+tr[0],n:tr[0],de:e.n,x})});
  slotsTalento(P).forEach(s=>{const tl=TALENTOS[s.k],te=P.tal[s.slot]||{};let x=tl.x;
    if(s.k==="iniciado")x+="\n- **Sua lista:** "+(s.lista||te.lista||"—")+".\n- **Seu atributo:** "+(te.atr?ATR_N[te.atr]:"—")+".";
    if(["habilidoso","artifice","musico"].includes(s.k))x+="\n- **Escolhidas:** "+lista([...(te.per||[]),...(te.ferr||[])])+".";
    t.push({k:"tal:"+s.slot,n:tl.n+(s.lista?" ("+s.lista+")":""),de:{ant:"talento do antecedente",hum:"talento (Humano Versátil)",lic:"talento (Lições dos Primeiros)"}[s.slot]||"talento (nível "+s.slot.slice(2)+")",x})});
  return t}
function limparImportado(d){const P=Object.assign(novo(),d);P.img=null;["perClasse","especial","maestrias","ferrClasse","truques","prep","grim","tomoT","tomoR","idiomas","rol","niveis","formas","compras","tirados"].forEach(k=>{if(!Array.isArray(P[k]))P[k]=[]});
  P.niveis=P.niveis.filter(n=>n&&CLASSES[n.c]).slice(0,NIVEL_MAX-1).map(n=>({c:n.c,pv:Math.max(1,Math.min(12,Number(n.pv)||1)),modo:n.modo==="rolar"?"rolar":"fixo",esc:(n.esc&&typeof n.esc==="object")?n.esc:{},snap:n.snap||null}));
  P.extras=Array.isArray(P.extras)?P.extras.filter(k=>ATR.includes(k)).slice(0,20):[];
  if(!P.magX||typeof P.magX!=="object")P.magX={};if(!P.bg||typeof P.bg!=="object")P.bg=novo().bg;if(!P.jogo)P.jogo={pv:pvMax(P),temp:0,gastos:{}};return P}
function novo(){return {id:uid(),tipo:"dnd2024-pers",v:2,nome:"",jogador:"",classe:null,ant:null,esp:null,ee:{},tal:{},idiomas:[],idiomaExtra:null,
  metodo:"padrao",base:{FOR:null,DES:null,CON:null,INT:null,SAB:null,CAR:null},rol:[],bonus:{modo:"21",mais2:null,mais1:null},tend:null,
  perClasse:[],especial:[],estilo:null,ordem:null,invoc:null,maestrias:[],ferrClasse:[],ferrAnt:null,eqC:null,eqA:null,eqEsc:{},
  truques:[],prep:[],grim:[],tomoT:[],tomoR:[],niveis:[],extras:[],magX:{},jogo:null,bg:{historia:"",familia:"",intencoes:"",jeito:"",notas:""},img:null,criado:Date.now()}}

/* ================= ficha: partes que mudam com o nível ================= */
function redesenhar(){if(tela==="subir")rSubir(true);else rPasso(true)}
function mudou(){gravar();redesenhar()}
function opcao(id,sel,cab,det,onSel,onDes){const ab=sel||abertos[id];const o=el("div",{class:"op"+(sel?" on":"")});
  o.append(el("button",{class:"cab",type:"button","aria-expanded":String(!!ab),onclick:()=>{if(onSel&&!sel){abertos[id]=true;onSel()}else if(onDes&&sel){abertos[id]=false;onDes()}else{abertos[id]=!ab;redesenhar()}}},cab));
  if(ab)o.append(el("div",{class:"det"},det()));return o}
function linhaMagia(s,on,dis,toggle){const id="mg:"+s[0];const ab=abertos[id];
  return el("div",{class:"op"+(on?" on":"")},el("div",{class:"mg",style:"padding:8px 11px"},el("input",{type:"checkbox",checked:on,disabled:dis&&!on,"aria-label":"Escolher "+s[1],onchange:toggle}),
    el("button",{type:"button",class:"cab",style:"padding:0",onclick:()=>{abertos[id]=!ab;redesenhar()}},el("b",{},s[1]),el("span",{},(s[2]?"nv "+s[2]+" · ":"")+(s[9]?"C ":"")+(s[10]?"R ":"")+s[5]),el("em",{},s[6]+" · "+s[8]))),
    ab?el("div",{class:"det"},rico(s[11]),el("p",{class:"nota"},s[3]+" · componentes "+s[7]+(s[9]?" · Concentração":"")+(s[10]?" · pode ser Ritual":""))):null)}
function mostrar(t){tela=t;["inicio","criador","ficha","subir"].forEach(x=>{const e=$("#t-"+x);if(e)e.hidden=x!==t});window.scrollTo(0,0);
  if(t==="inicio")rInicio();if(t==="criador")rPasso();if(t==="ficha")rFicha();if(t==="subir")rSubir()}

function abaFicha(c,P){const m=MOD(P),f=atrFinal(P),pb=pbP(P),cl=CL(P),per=pericias(P),esp=new Set(especialDe(P)),ca=caCalc(P);
  c.append(el("div",{class:"cab-f"},P.img?el("div",{class:"foto"},el("img",{src:P.img,alt:""})):null,el("div",{class:"nome"},P.nome||"Sem nome"),el("div",{class:"cls"},"Nível "+NV(P)+" · "+resumoCurto(P)+(P.tend?" · "+TENDENCIAS.find(t=>t[0]===P.tend)[1]:""))));
  const per2=k=>m[SK.find(s=>s[0]===k)[1]]+(per.has(k)?pb:0)+(esp.has(k)?pb:0)+(!per.has(k)&&nC(P,"bardo")>=2?Math.floor(pb/2):0);
  c.append(el("div",{class:"stats"},el("button",{type:"button",onclick:()=>folhaCA(P)},el("b",{},String(ca.ca)),el("small",{},"CA")),el("div",{},el("b",{},sinal(iniciativa(P))),el("small",{},"Iniciativa")),
    el("div",{},el("b",{},metros(deslocamento(P))),el("small",{},"Deslocamento")),el("div",{},el("b",{},"+"+pb),el("small",{},"Proficiência")),el("div",{},el("b",{},String(10+per2("Percepção"))),el("small",{},"Percepção passiva")),
    el("div",{},el("b",{},visao(P)?metros(visao(P)):"—"),el("small",{},"Visão no escuro"))));
  c.append(secT("Atributos","toque para aumentar"),el("div",{class:"attrs"},...ATR.map(x=>{const pr=salvProf(P,x);return el("button",{type:"button",class:"attr","aria-label":ATR_N[x]+": tocar para aumentar",onclick:()=>folhaAtr(P,x)},el("small",{},ATR_N[x]),el("b",{},sinal(m[x])),el("span",{class:"v"},String(f[x])),
    el("span",{class:"sv"+(pr?" prof":"")},"Resist. "+sinal(m[x]+(pr?pb:0)+auraPal(P))+(pr?" ●":"")))})));
  c.append(secT("Perícias","negrito = treinada"),el("div",{class:"pericias"},...SK.map(([k,a])=>el("div",{class:per.has(k)?"prof":""},el("span",{},k+(esp.has(k)?" ★":"")),el("span",{},sinal(per2(k)))))));
  if(esp.size)c.append(el("p",{class:"nota"},"★ Especialização: soma a proficiência duas vezes."+(nC(P,"bardo")>=2?" Pau para Toda Obra já somado nas não treinadas.":"")));
  c.append(secT("Características","toque para ler"),el("ul",{class:"lista"},...tracosDe(P).map(t=>itemLista(t.n,t.de,null,()=>folha(t.n,t.de,[t.x])))));
  const fr=ferramentas(P);
  c.append(secT("Proficiências"),el("div",{class:"prosa"},el("p",{},el("b",{},"Armas: "),textoArmas(P)+"."),el("p",{},el("b",{},"Armaduras: "),textoArmad(P)+"."),
    fr.length?el("p",{},el("b",{},"Ferramentas: "),lista(fr)+"."):null,el("p",{},el("b",{},"Idiomas: "),lista(idiomasDe(P))+".")));
  const eq=itensEquip(P);const j=P.jogo;
  c.append(secT("Equipamento"),el("ul",{class:"res-l"},...eq.itens.map(i=>el("li",{},(i.q>1?i.q+" × ":"")+(i.t==="a"?arma(i.k)[1]:i.t==="r"?armadura(i.k)[1]:i.n)))),
    el("p",{},el("b",{},"Ouro: "),el("input",{type:"number",inputMode:"numeric",min:0,value:j.po!==undefined?j.po:eq.po,style:"width:110px","aria-label":"Peças de ouro",onchange:e=>{j.po=Math.max(0,Number(e.target.value)||0);gravar()}})," PO"),
    el("p",{class:"nota"},"Outros itens novos: anote em Outras anotações, na aba Background."),el("button",{type:"button",class:"lnk",style:"align-self:flex-start",onclick:()=>folhaCompras(P)},"Trocar ou comprar arma e armadura"));
  const nv=NV(P);const box=el("div",{class:"linha"});
  if(nv<NIVEL_MAX)box.append(el("button",{class:"bt",type:"button",onclick:abrirSubir},"Subir para o nível "+(nv+1)));
  if(nv>1)box.append(el("button",{class:"bt sec",type:"button",onclick:e=>confirmar(e.currentTarget,()=>desfazerNivel(P))},"Desfazer nível "+nv));
  c.append(secT("Nível",nv+" de "+NIVEL_MAX),el("p",{class:"nota"},nv<NIVEL_MAX?"Suba quando o mestre liberar. Um nível por vez; o último pode ser desfeito.":"Nível 20: o máximo do jogo."),box,
    (P.niveis||[]).length?el("p",{class:"nota"},"Vida por nível: "+P.niveis.map((n,i)=>"nível "+(i+2)+": "+CLASSES[n.c].n+", "+n.pv+(n.modo==="fixo"?" (fixo)":" (rolado)")+" + CON").join(" · ")):"",el("button",{type:"button",class:"lnk",style:"align-self:flex-start",onclick:()=>editarCriacao(P)},"Rever as escolhas do nível 1"));
  c.append(secT("Guardar a ficha"),el("p",{class:"nota"},"A ficha fica guardada neste aparelho. Para não perder, copie e mande para você mesmo ou para o mestre no WhatsApp. A imagem não vai junto no texto."),
    el("div",{class:"linha"},el("button",{class:"bt",type:"button",onclick:e=>copiarFicha(P,e.currentTarget)},"Copiar ficha"),el("button",{class:"bt sec",type:"button",onclick:e=>confirmar(e.currentTarget,()=>{delete DB.lista[P.id];DB.atual=null;gravar(true);mostrar("inicio")})},"Apagar personagem")),
    el("textarea",{id:"cod-manual",hidden:true,"aria-label":"Texto da ficha para copiar",style:"width:100%;margin-top:8px;min-height:90px;font-size:13px"}),el("p",{class:"nota",id:"st-copiar"}))}
function abaCombate(c,P){const m=MOD(P),pb=pbP(P),j=P.jogo;
  c.append(secT("Ataques",(nAtaques(P)>1?nAtaques(P)+" ataques por ação · ":"")+"toque para detalhes"),el("ul",{class:"lista"},...ataques(P).map(a=>itemLista(a.n,a.hit+" · "+a.dano,a.sub,()=>{
    if(a.k.startsWith("arma:")){const w=arma(a.k.slice(5));folha(w[1],(w[2]==="S"?"Arma Simples":"Arma Marcial")+(w[3]==="C"?" corpo a corpo":" à distância"),[el("dl",{class:"meta"},el("dt",{},"Ataque"),el("dd",{},a.hit),el("dt",{},"Dano"),el("dd",{},a.dano),
      w[8]?[el("dt",{},"Alcance"),el("dd",{},w[8])]:null,el("dt",{},"Propriedades"),el("dd",{},w[6].length?w[6].join(", "):"—")),...w[6].map(p=>{const b=p.split(" (")[0];return PROPRIEDADE[b]?el("p",{},el("b",{},b+": "),PROPRIEDADE[b]):null}),
      el("p",{},el("b",{},"Maestria "+w[7]+(maestriasDe(P).includes(w[0])?" (você usa)":" (você não escolheu esta)")+": "),MAESTRIA[w[7]])])}
    else if(a.k.startsWith("mag:"))folhaMagia(P,a.k.slice(4));
    else if(a.k==="psi")folha("Lâmina Psíquica","Lâmina Psíquica (Ladino)",[SUBCLASSES.ladino.alma.tr[1][1]]);
    else folha("Ataque Desarmado","corpo a corpo",["Um soco, chute ou cabeçada. Ataque: Força + proficiência. Dano: 1 + Força (Contundente), ou o que a característica indicar. Também serve para Agarrar ou Empurrar (o alvo faz resistência de Força ou Destreza contra CD 8 + Força + proficiência)."])},a.mag?"magia":null))));
  const rs=recursos(P);const sp=espacosDe(P);
  c.append(secT("Recursos","bolinha cheia = disponível"));const box=el("div",{class:"rec"});
  sp.tab.forEach((n,i)=>box.append(linhaRecurso(P,{k:"slots"+(i+1),n:"Espaços de magia de nível "+(i+1),max:n,volta:"longo",x:"Gastos ao conjurar magias de nível "+(i+1)+" ou maior com espaço. Voltam no descanso longo."})));
  if(sp.pacto)box.append(linhaRecurso(P,{k:"pacto",n:"Espaços de Pacto (nível "+sp.pacto[1]+")",max:sp.pacto[0],volta:"curto",x:"Magia de Pacto do Bruxo: os espaços são todos de nível "+sp.pacto[1]+" e voltam no descanso curto ou longo."}));
  rs.forEach(r=>box.append(linhaRecurso(P,r)));
  if(nC(P,"druida")>=2){const tmp=(subDe(P,"druida")==="lua"&&nC(P,"druida")>=3?3:1)*nC(P,"druida");const g=j.gastos.formasel||0;
    box.append(el("div",{},el("span",{class:"d"},"Ao virar bicho você ganha "+tmp+" PV temporários."),el("button",{type:"button",class:"bt mini",disabled:g>=2,onclick:()=>{j.gastos.formasel=Math.min(2,g+1);j.temp=Math.max(j.temp||0,tmp);
      j.notaDesc="Forma Selvagem: +"+tmp+" PV temporários. Use a ficha da forma escolhida (Formas conhecidas).";salvarJogo()}},"Usar Forma Selvagem")));
    const fs=formasDe(P);box.append(el("div",{},el("button",{type:"button",class:"rnome",onclick:()=>folhaFormas(P)},"Formas conhecidas"),el("span",{class:"d"},fs.length?lista(fs.map(k=>besta(k)[1]))+" ("+fs.length+" de "+formasMax(P)+")":"nenhuma escolhida ainda: toque para escolher "+formasMax(P))))}
  box.append(el("div",{},el("span",{},el("b",{},"Inspiração Heroica"),el("span",{class:"d"},"gaste para rerrolar um dado")),
    el("button",{type:"button",class:"pip"+(j.insp?"":" gasto"),"aria-label":j.insp?"tem inspiração, tocar para gastar":"sem inspiração, tocar para ganhar",onclick:()=>{j.insp=!j.insp;salvarJogo()}})));
  c.append(box);
  const ms=magiasDe(P);if(ms.length){const cj=conjuradores(P);
    c.append(secT("Magias",cj.map(g=>(cj.length>1?g.nome+": ":"")+"CD "+(8+pb+m[g.atr])+" · ataque "+sinal(pb+m[g.atr])).join(" · ")));
    [0,1,2,3,4,5,6,7,8,9].forEach(nvl=>{const l=ms.filter(x=>magia(x.k)[2]===nvl);if(!l.length)return;
      c.append(el("p",{class:"nota"},nvl===0?"Truques":"Nível "+nvl),el("ul",{class:"lista"},...l.map(x=>itemLista(nm(x.k),magia(x.k)[5],x.fonte+(x.nota?" · "+x.nota:""),()=>folhaMagia(P,x.k,x),magia(x.k)[9]?"C":null))))})}
  if(conjuradores(P).length)c.append(el("button",{type:"button",class:"lnk",style:"align-self:flex-start",onclick:()=>folhaTrocarMagias(P)},magiasFaltando(P)?"Escolher as magias que faltam":"Escolher ou trocar magias"));
  c.append(secT("Descansos"),el("div",{class:"descansos"},el("button",{type:"button",onclick:e=>confirmar(e.currentTarget,()=>descanso(P,"curto"))},"Descanso curto"),el("button",{type:"button",onclick:e=>confirmar(e.currentTarget,()=>descanso(P,"longo"))},"Descanso longo")),
    el("p",{class:"nota",id:"nota-descanso"},j.notaDesc||""))}
function descanso(P,tipo){const j=P.jogo;const rs=[...recursos(P)];const sp=espacosDe(P);if(sp.pacto)rs.push({k:"pacto",volta:"curto"});
  if(tipo==="longo"){j.pv=pvMax(P);j.temp=0;j.gastos={};if(P.esp==="humano")j.insp=true;j.notaDesc="Descanso longo: vida cheia, espaços de magia e todos os recursos de volta."+(P.esp==="humano"?" Humano: ganhou Inspiração Heroica.":"")}
  else{rs.forEach(r=>{if(r.volta==="curto")j.gastos[r.k]=0;if(r.volta==="curto1")j.gastos[r.k]=Math.max(0,(j.gastos[r.k]||0)-1)});
    j.notaDesc="Descanso curto: voltou o que volta no descanso curto. Dados de Vida gastos você rola e soma em Cura."+(nC(P,"mago")?" Mago: pode usar a Recuperação Arcana agora.":"")}
  salvarJogo()}
function folhaMagia(P,k,x){const s=magia(k);if(!s)return;const m=MOD(P),pb=pbP(P);x=x||magiasDe(P).find(y=>y.k===k)||{};const mm=m[x.atr]||0;
  const meta=[["Nível",s[2]===0?"Truque":String(s[2])],["Tempo",s[5]],["Alcance",s[6]],["Componentes",s[7]],["Duração",s[8]],x.atr?["Atributo",ATR_N[x.atr]+" · CD "+(8+pb+mm)+" · ataque "+sinal(pb+mm)]:null,x.fonte?["De",x.fonte+(x.nota?" ("+x.nota+")":"")]:null].filter(Boolean);
  folha(s[1],s[3]+(s[9]?" · Concentração":"")+(s[10]?" · Ritual":""),[el("dl",{class:"meta"},...meta.flatMap(([a,b])=>[el("dt",{},a),el("dd",{},b)])),s[11],
    s[9]?el("p",{class:"nota"},"Concentração: se sofrer dano, faça resistência de Constituição (CD 10 ou metade do dano, o que for maior, até 30) para manter. Só uma magia de Concentração por vez."):null,
    s[10]?el("p",{class:"nota"},"Ritual: leva 10 minutos a mais e não gasta espaço, se a magia estiver preparada."):null])}

/* ================= subir de nível ================= */
let SUBIR=null;

/* Pontos de atributo dados pelo mestre (fora da subida de nível): tocar no atributo abre a folha com o +1 (até 20); a lista fica em Melhorias, na aba Background */
const EX_N={FOR:"Força",DES:"Destreza",CON:"Constituição",INT:"Inteligência",SAB:"Sabedoria",CAR:"Carisma"};
function partesAtributo(k,x,msg,somar){const md=v=>Math.floor((v-10)/2),m0=md(x),m1=md(x+1),o=[];
  if(msg)o.push(el("p",{class:"ex-ok"},msg));
  o.push(el("p",{class:"ex-val"},"Valor "+x+" · modificador "+sinal(m0)));
  if(x>=20)o.push(el("p",{class:"ex-exp"},"Já está em 20, o máximo."));
  else o.push(el("button",{type:"button",class:"ex-abrir",onclick:()=>somar(k)},"Aumentar +1 (ponto do mestre)"),
    el("p",{class:"ex-exp"},x+" → "+(x+1)+(m1>m0?": o modificador vai de "+sinal(m0)+" para "+sinal(m1)+" e a ficha recalcula o que depende dele.":": o modificador continua "+sinal(m0)+". Ele só muda quando o valor chega a um número par.")));
  o.push(el("p",{class:"ex-exp"},"Cada aumento fica anotado em Melhorias, na aba Background. Lá também dá para desfazer."));
  return o}
function msgSomou(k,x){const md=v=>Math.floor((v-10)/2);return "Pronto: "+EX_N[k]+" "+x+" → "+(x+1)+(md(x+1)>md(x)?", modificador "+sinal(md(x+1))+".":".")}
function caixaMelhorias(lista,desfazer){const box=el("div",{class:"mel-box"});
  if(!lista.length)box.append(el("p",{class:"ex-exp"},"Nenhuma ainda. Quando o mestre der um ponto de atributo, toque no atributo na aba Ficha."));
  else box.append(el("ul",{},...lista.map(k=>el("li",{},"+1 "+EX_N[k]+" (ponto do mestre)"))),
    el("button",{type:"button",class:"ex-desf",onclick:e=>confirmar(e.currentTarget,desfazer)},"Desfazer o último: +1 "+EX_N[lista[lista.length-1]]));
  return el("div",{class:"melhorias"},el("div",{class:"mel-t"},"Melhorias"),box)}
function folhaAtr(P,k,msg){const s=$("#sheet");s.textContent="";s.append(el("button",{class:"fechar",type:"button","aria-label":"Fechar",onclick:fecharFolha},"×"),el("h4",{id:"sheet-t"},ATR_N[k]),
  ...partesAtributo(k,atrFinal(P)[k],msg,k=>somarAtr(P,k)));s.classList.add("on");$("#veu").classList.add("on");s.scrollTop=0}
function somarAtr(P,k){const x=atrFinal(P)[k],antes=pvMax(P);(P.extras=P.extras||[]).push(k);P.jogo.pv=Math.min(pvMax(P),P.jogo.pv+Math.max(0,pvMax(P)-antes));gravar(true);prepararCodigo(P);rFicha(true);folhaAtr(P,k,msgSomou(k,x))}
function desfazerExtra(P){P.extras.pop();P.jogo.pv=Math.min(P.jogo.pv,pvMax(P));gravar(true);prepararCodigo(P);rFicha(true)}
function abrirSubir(){const P=AT();if(NV(P)>=NIVEL_MAX)return;SUBIR={c:null,modo:"fixo",pv:null,esc:{},snap:JSON.stringify({truques:P.truques,prep:P.prep,grim:P.grim,magX:P.magX||{},lic:(P.tal||{}).lic||null,tal:P.tal||{},tomoT:P.tomoT,tomoR:P.tomoR})};abertos={};mostrar("subir")}
function restaurarSnap(P,snap){if(!snap)return;const s=JSON.parse(snap);P.truques=s.truques||[];P.prep=s.prep||[];P.grim=s.grim||[];P.magX=s.magX||{};P.tal=P.tal||{};if(s.tal)P.tal=s.tal;else if(s.lic)P.tal.lic=s.lic;else delete P.tal.lic;P.tomoT=s.tomoT||[];P.tomoR=s.tomoR||[]}
function cancelarSubir(){const P=AT();if(SUBIR)restaurarSnap(P,SUBIR.snap);SUBIR=null;gravar(true);mostrar("ficha")}
function comNivel(P){return SUBIR&&SUBIR.c?{...P,niveis:[...(P.niveis||[]),SUBIR]}:P}
function podeMulti(P,c){const f=atrFinal(P);const falta=[];const ok=grupos=>grupos.every(g=>g.some(a=>f[a]>=13));
  [...new Set([...classesDe(P),c])].forEach(k=>{if(!ok(MULTI_REQ[k]))falta.push(CLASSES[k].n+" pede "+MULTI_REQ[k].map(g=>g.map(a=>ATR_N[a]).join(" ou ")).join(" e ")+" 13")});return falta}
function ganhosDoNivel(P2,c,n){const out=[];const cl=CLASSES[c];
  if(n===1){out.push({n:"Multiclasse: "+cl.n,x:"Você ganha o Dado de Vida (d"+cl.dv+") e "+MULTI_GANHA[c].t+". Não ganha as resistências da classe."});cl.n1.forEach(f=>out.push(f))}
  else((NIVEIS[c]||{})[n]||[]).forEach(f=>out.push(f));
  if(n===3){const s=subObj(P2,c);out.push({n:"Subclasse de "+cl.n,x:s?s.n+": "+s.d:"Escolha a subclasse abaixo."});if(s)s.tr.forEach(t=>out.push({n:t[0],x:t[1]}))}
  if(n>3){const s=subObj(P2,c);if(s){((s.alto||{})[n]||[]).forEach(t=>out.push({n:t[0],x:t[1]}));const ti=({5:2,7:3,9:4})[n],te=subEsc(P2,c).terra;
    const ms=(s["m"+n]||[]).concat(c==="druida"&&subDe(P2,c)==="terra"&&te&&ti?TERRAS[te][ti]||[]:[]);if(ms.length)out.push({n:"Magias de "+s.n,x:"Novas magias sempre preparadas.\n- **Magias:** "+lista(ms.map(nm))+"."})}}
  return out}
/* lista de escolhas do nível: {t, r(c), ok()} */
function escolhasNivel(P){const L=SUBIR,c=L.c,P2=comNivel(P),n=nC(P2,c),cl=CLASSES[c],e=L.esc,out=[];const jaPer=()=>pericias(P2);
  const add=(t,r,ok)=>out.push({t,r,ok});
  if(n===1){const g=MULTI_GANHA[c];
    if(g.per){const de=g.per.de==="todas"?SK.map(s=>s[0]):cl.per.de;e.perMulti=e.perMulti||[];add("Perícia da multiclasse",b=>b.append(chips(de,e.perMulti,1,v=>{e.perMulti=v;mudou()},v=>jaPer().has(v)&&!e.perMulti.includes(v))),()=>e.perMulti.length<1?"escolher a perícia da multiclasse":null)}
    if(g.instr)add("Instrumento da multiclasse",b=>b.append(chips(INSTRUMENTOS,e.instrMulti?[e.instrMulti]:[],1,v=>{e.instrMulti=v[0]||null;mudou()})),()=>!e.instrMulti?"escolher o instrumento":null);
    if(c==="ladino")add("Gíria de Ladrão: mais 1 idioma",b=>b.append(chips([...IDIOMAS_PADRAO,...IDIOMAS_RAROS],e.idiomaRogue?[e.idiomaRogue]:[],1,v=>{e.idiomaRogue=v[0]||null;mudou()},v=>idiomasDe(P).includes(v))),()=>!e.idiomaRogue?"escolher o idioma do Ladino":null);
    cl.n1.forEach(f=>{
      if(f.esc==="ordem"||f.esc==="ordemprimal"){const o=f.esc==="ordem"?ORDEM_CLERIGO:ORDEM_DRUIDA;add(f.n,b=>Object.entries(o).forEach(([k,v])=>b.append(opcao("o:"+k,e.ordem===k,[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{e.ordem=k;mudou()},()=>{e.ordem=null;mudou()}))),()=>!e.ordem?"escolher a ordem":null)}
      if(f.esc==="estilo")add(f.n,b=>Object.entries(ESTILOS).forEach(([k,v])=>b.append(opcao("s:"+k,e.estilo===k,[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{e.estilo=k;mudou()},()=>{e.estilo=null;mudou()}))),()=>!e.estilo?"escolher o Estilo de Luta":null);
      if(f.esc==="invocacao")add(f.n,b=>Object.entries(INVOCACOES).forEach(([k,v])=>b.append(opcao("i:"+k,(e.invoc||[]).includes(k),[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{e.invoc=[k];mudou()},()=>{e.invoc=[];mudou()}))),()=>!(e.invoc||[]).length?"escolher a Invocação":null);
      if(f.esc==="especial"){e.especial=e.especial||[];add("Especialização (Ladino)",b=>b.append(contador(e.especial.length,2,"escolhidas"),chips([...jaPer().keys()].filter(x=>!especialDe(P).includes(x)),e.especial,2,v=>{e.especial=v;mudou()})),()=>e.especial.length<2?"escolher 2 perícias para a Especialização":null)}});
    if(cl.maestria){e.maestrias=e.maestrias||[];const op=(c==="barbaro"?ARMAS.filter(a=>a[3]==="C"):c==="guerreiro"?ARMAS:ARMAS.filter(a=>profArma(P2,a[0]))).filter(a=>!maestriasDe(P).includes(a[0]));
      add("Maestria em Armas ("+cl.n+")",b=>b.append(contador(e.maestrias.length,cl.maestria,"escolhidas"),chips(op.map(a=>[a[0],a[1],a[7]]),e.maestrias,cl.maestria,v=>{e.maestrias=v;mudou()})),()=>e.maestrias.length<cl.maestria?"escolher as armas da maestria":null)}}
  ((NIVEIS[c]||{})[n]||[]).forEach(f=>{
    if(f.esc==="perExtra")add(f.n,b=>b.append(chips(CLASSES.barbaro.per.de,e.perExtra?[e.perExtra]:[],1,v=>{e.perExtra=v[0]||null;mudou()},v=>pericias(P).has(v))),()=>!e.perExtra?"escolher a perícia do Conhecimento Primal":null);
    if(f.esc==="especial2"){e.especial2=e.especial2||[];add(f.n,b=>b.append(contador(e.especial2.length,2,"escolhidas"),chips([...pericias(P).keys()].filter(x=>!especialDe(P).includes(x)||e.especial2.includes(x)),e.especial2,2,v=>{e.especial2=v;mudou()})),()=>e.especial2.length<2?"escolher 2 perícias para a Especialização":null)}
    if(f.esc==="explorador"){e.explorador=e.explorador||{per:null,idiomas:[]};const x=e.explorador;add(f.n,b=>b.append(el("p",{class:"cont"},"Especialização em:"),chips([...pericias(P).keys()].filter(k=>!especialDe(P).includes(k)||x.per===k),x.per?[x.per]:[],1,v=>{x.per=v[0]||null;mudou()}),
      el("p",{class:"cont"},"2 idiomas:"),chips([...IDIOMAS_PADRAO,...IDIOMAS_RAROS].filter(i=>!idiomasDe(P).includes(i)),x.idiomas,2,v=>{x.idiomas=v;mudou()})),()=>!x.per||x.idiomas.length<2?"fazer as escolhas do Explorador Hábil":null)}
    if(f.esc==="estiloPal"||f.esc==="estiloPat"){const key=f.esc,alt=key==="estiloPal"?["abencoado","Guerreiro Abençoado","2 truques de Clérigo, com Carisma","Clérigo"]:["druidico","Guerreiro Druídico","2 truques de Druida, com Sabedoria","Druida"];
      add(f.n,b=>{[[alt[0],[alt[1],alt[2]]],...Object.entries(ESTILOS).filter(([k])=>!estilosDe(P).includes(k))].forEach(([k,v])=>b.append(opcao("st:"+k,e[key]===k,[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{e[key]=k;e.truquesEstilo=[];mudou()},()=>{e[key]=null;e.truquesEstilo=[];mudou()})));
        if(e[key]===alt[0]){e.truquesEstilo=e.truquesEstilo||[];blocoEscolha(b,"2 truques de "+alt[3],null,listaClasse(alt[3],0).filter(s=>!jaConhece(P2,s[0],key==="estiloPal"?"Guerreiro Abençoado":"Guerreiro Druídico")||e.truquesEstilo.includes(s[0])),e.truquesEstilo,2,v=>e.truquesEstilo=v)}},
        ()=>!e[key]?"escolher o Estilo de Luta":(e[key]===alt[0]&&(e.truquesEstilo||[]).length<2)?"escolher os 2 truques":null)}
    if(f.esc==="metamagia"){e.metamagia=e.metamagia||[];add(f.n,b=>{b.append(contador(e.metamagia.length,2,"escolhidas · toque de novo numa escolhida para desmarcar"));Object.entries(METAMAGIAS).filter(([k])=>!escs(P,"metamagia").flat().includes(k)).forEach(([k,v])=>b.append(opcao("mm:"+k,e.metamagia.includes(k),[el("b",{},v[0]),el("span",{},v[1]+" pt"),el("em",{},linha1(v[2]))],()=>[rico(v[2])],()=>{if(e.metamagia.length<2){e.metamagia=[...e.metamagia,k];mudou()}else redesenhar()},()=>{e.metamagia=e.metamagia.filter(x=>x!==k);mudou()})));
      if(e.metamagia.length)b.append(el("button",{type:"button",class:"lnk",onclick:()=>{e.metamagia=[];mudou()}},"limpar escolhas"))},()=>e.metamagia.length<2?"escolher 2 Metamagias":null)}
    if(f.esc==="invoc"){e.invoc2=e.invoc2||[];const ja=invocsDe(P);const op={...INVOCACOES,...INVOCACOES_N2};
      add(f.n,b=>{b.append(contador(e.invoc2.length,2,"escolhidas · toque de novo numa escolhida para desmarcar"));Object.entries(op).filter(([k])=>!ja.includes(k)||k==="agonizante").forEach(([k,v])=>b.append(opcao("iv:"+k,e.invoc2.includes(k),[el("b",{},v[0]),el("span",{},INVOCACOES_N2[k]?"nível 2+":""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{if(e.invoc2.length<2){e.invoc2=[...e.invoc2,k];if(k==="licoes"){P.tal=P.tal||{};P.tal.lic={k:null}}mudou()}else redesenhar()},()=>{e.invoc2=e.invoc2.filter(x=>x!==k);if(k==="licoes"&&P.tal)delete P.tal.lic;mudou()})));
        if(e.invoc2.length)b.append(el("button",{type:"button",class:"lnk",onclick:()=>{e.invoc2=[];if(P.tal)delete P.tal.lic;mudou()}},"limpar escolhas"));
        if(e.invoc2.includes("licoes")){const t=P.tal.lic=P.tal.lic||{k:null};b.append(el("p",{class:"cont"},"Lições dos Primeiros: talento de Origem"),chips(Object.entries(TALENTOS).map(([k,v])=>[k,v.n]),t.k?[t.k]:[],1,v=>{P.tal.lic={k:v[0]||null};mudou()},v=>temTalento(P,v)&&!["iniciado","habilidoso"].includes(v)));
          if(t.k)uiTalento(b,P,"lic")}
        if(e.invoc2.includes("tomo")){e.tomoT=e.tomoT||[];e.tomoR=e.tomoR||[];blocoEscolha(b,"Pacto do Tomo: 3 truques","De qualquer lista.",MAGIAS.filter(s=>s[2]===0),e.tomoT,3,v=>e.tomoT=v);blocoEscolha(b,"Pacto do Tomo: 2 rituais",null,MAGIAS.filter(s=>s[2]===1&&s[10]),e.tomoR,2,v=>e.tomoR=v)}},
        ()=>{if(e.invoc2.length<2)return "escolher 2 Invocações";
          if(e.invoc2.includes("licoes")){if(!(P.tal.lic||{}).k)return "escolher o talento de Lições dos Primeiros";const f=okTalento(P,"lic");if(f)return f}
          if(e.invoc2.includes("tomo")&&((e.tomoT||[]).length<3||(e.tomoR||[]).length<2))return "escolher as magias do Pacto do Tomo";return null})}
    if(f.esc==="asi")escolhaAsi(P,P2,e,add);
    if(f.esc==="maestria1")escolhaMaestria(P,P2,c,e,add);
    if(f.esc==="invoc5")escolhaInvoc5(P,e,add,f.qtd||2,n);
    if(f.esc==="bencao"||f.esc==="furiaEl"){const key=f.esc,op=key==="bencao"?[["divino","Golpe Divino","+1d8 Necrótico ou Radiante uma vez por turno, ao acertar com arma."],["potente","Conjuração Potente","Soma Sabedoria ao dano dos truques de Clérigo."]]:[["potente","Conjuração Potente","Soma Sabedoria ao dano dos truques de Druida."],["primal","Golpe Primal","+1d8 de Frio, Fogo, Elétrico ou Trovejante uma vez por turno, ao acertar."]];
      add(f.n,b=>op.forEach(([k,nn,xx])=>b.append(opcao(key+":"+k,e[key]===k,[el("b",{},nn),el("span",{},""),el("em",{},xx)],()=>[],()=>{e[key]=k;mudou()},()=>{e[key]=null;mudou()}))),()=>!e[key]?"escolher a opção de "+f.n:null)}
    if(f.esc==="arcano"){const op=MAGIAS.filter(m=>m[2]===f.mg&&m[4].includes("Bruxo"));add(f.n,b=>blocoEscolha(b,"Magia de Bruxo de nível "+f.mg,null,op,e.arcano?[e.arcano]:[],1,v=>e.arcano=v[0]||null),()=>!e.arcano?"escolher a magia da Arcana Mística":null)}
    if(f.esc==="maestriaMagia"){e.maestriaMagia=e.maestriaMagia||[];const gr=grimorioDe(P).map(magia).filter(Boolean),de=nv=>e.maestriaMagia.filter(k=>magia(k)[2]===nv);
      const o1=gr.filter(m=>m[2]===1),o2=gr.filter(m=>m[2]===2),pede=(o1.length?1:0)+(o2.length?1:0);
      add(f.n,b=>{blocoEscolha(b,"1 magia de nível 1 do grimório",null,o1,de(1),1,v=>e.maestriaMagia=[...v,...de(2)]);blocoEscolha(b,"1 magia de nível 2 do grimório",null,o2,de(2),1,v=>e.maestriaMagia=[...de(1),...v])},()=>e.maestriaMagia.length<pede?"escolher as magias da Maestria em Magia":null)}
    if(f.esc==="assinatura"){e.assinatura=e.assinatura||[];const op=grimorioDe(P).map(magia).filter(m=>m&&m[2]===3),pede=Math.min(2,op.length);
      add(f.n,b=>blocoEscolha(b,"2 magias de nível 3 do grimório",null,op,e.assinatura,2,v=>e.assinatura=v),()=>e.assinatura.length<pede?"escolher as Magias de Assinatura":null)}
    if(f.esc==="erudito"){const op=["Arcanismo","História","Investigação","Medicina","Natureza","Religião"];add(f.n,b=>b.append(chips(op,e.erudito?[e.erudito]:[],1,v=>{e.erudito=v[0]||null;mudou()},v=>!pericias(P).has(v)||especialDe(P).includes(v))),()=>!e.erudito?"escolher a perícia do Erudito":null)}});
  if(n===3){const subs=SUBCLASSES[c];e.subEsc=e.subEsc||{};const se=e.subEsc;
    add("Subclasse",b=>Object.entries(subs).forEach(([k,s])=>b.append(opcao("sub:"+k,e.sub===k,[el("b",{},s.n),el("span",{},""),el("em",{},s.d)],()=>s.tr.map(t=>tr(t[0],t[1])),()=>{e.sub=k;e.subEsc={};mudou()},()=>{e.sub=null;e.subEsc={};mudou()}))),()=>!e.sub?"escolher a subclasse":null);
    const s=e.sub?subs[e.sub]:null;
    if(s&&s.esc==="manobras"){se.manobras=se.manobras||[];add("Manobras (3)",b=>{b.append(contador(se.manobras.length,3,"escolhidas · toque de novo numa escolhida para desmarcar"));Object.entries(MANOBRAS).forEach(([k,v])=>b.append(opcao("man:"+k,se.manobras.includes(k),[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{if(se.manobras.length<3){se.manobras=[...se.manobras,k];mudou()}else redesenhar()},()=>{se.manobras=se.manobras.filter(x=>x!==k);mudou()})));
      if(se.manobras.length)b.append(el("button",{type:"button",class:"lnk",onclick:()=>{se.manobras=[];mudou()}},"limpar escolhas"))},()=>se.manobras.length<3?"escolher 3 manobras":null);
      add("Estudante da Guerra",b=>b.append(el("p",{class:"cont"},"Ferramenta de Artesão:"),chips(ARTESAO,se.ferr?[se.ferr]:[],1,v=>{se.ferr=v[0]||null;mudou()}),el("p",{class:"cont"},"Perícia do Guerreiro:"),chips(CLASSES.guerreiro.per.de,se.per||[],1,v=>{se.per=v;mudou()},v=>pericias(P).has(v))),
        ()=>!se.ferr||!(se.per||[]).length?"fazer as escolhas do Estudante da Guerra":null)}
    if(s&&s.esc==="terra")add("Tipo de terra (troca a cada descanso longo)",b=>b.append(chips(Object.entries(TERRAS).map(([k,v])=>[k,v[0]]),se.terra?[se.terra]:[],1,v=>{se.terra=v[0]||null;mudou()})),()=>!se.terra?"escolher o tipo de terra":null);
    if(s&&s.esc==="fera")add("Sua fera",b=>Object.entries(FERAS).forEach(([k,v])=>b.append(opcao("fe:"+k,se.fera===k,[el("b",{},v[0]),el("span",{},""),el("em",{},"")],()=>[rico(v[1])],()=>{se.fera=k;mudou()},()=>{se.fera=null;mudou()}))),()=>!se.fera?"escolher a fera":null);
    if(s&&s.esc==="presa")add("Presa do Caçador",b=>b.append(chips([["colossos","Matador de Colossos"],["hordas","Quebra-Hordas"]],se.presa?[se.presa]:[],1,v=>{se.presa=v[0]||null;mudou()})),()=>!se.presa?"escolher a Presa do Caçador":null);
    if(s&&s.per){se.per=se.per||[];const de=s.per.de==="todas"?SK.map(x=>x[0]):s.per.de;add("Perícias da subclasse",b=>b.append(contador(se.per.length,s.per.n,"escolhidas"),chips(de,se.per,s.per.n,v=>{se.per=v;mudou()},v=>pericias(P).has(v))),()=>se.per.length<s.per.n?"escolher as perícias da subclasse":null)}
    if(s&&s.escola){se.escola=se.escola||[];const op=MAGIAS.filter(m=>m[4].includes("Mago")&&m[3]===s.escola&&m[2]>=1&&m[2]<=2&&!grimorioDe(P).includes(m[0]));
      add("2 magias de "+s.escola+" grátis no grimório",b=>blocoEscolha(b,s.escola,null,op,se.escola,2,v=>se.escola=v),()=>se.escola.length<2?"escolher as 2 magias de "+s.escola:null)}}
  /* escolhas das subclasses nos níveis altos */
  const sAlto=subObj(P2,c),kSub=subDe(P2,c);
  if(sAlto&&n>3){
    if(c==="guerreiro"&&kSub==="mestre"&&[7,10,15].includes(n)){e.manobras=e.manobras||[];const ja=manobrasDe(P);
      add("Manobras: mais 2",b=>{b.append(contador(e.manobras.length,2,"escolhidas · toque de novo numa escolhida para desmarcar"));Object.entries(MANOBRAS).filter(([k])=>!ja.includes(k)).forEach(([k,v])=>b.append(opcao("man2:"+k,e.manobras.includes(k),[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{if(e.manobras.length<2){e.manobras=[...e.manobras,k];mudou()}else redesenhar()},()=>{e.manobras=e.manobras.filter(x=>x!==k);mudou()})))},()=>e.manobras.length<2?"escolher 2 manobras":null)}
    if(c==="guerreiro"&&kSub==="campeao"&&n===7)add("Estilo de Luta Adicional",b=>Object.entries(ESTILOS).filter(([k])=>!estilosDe(P).includes(k)).forEach(([k,v])=>b.append(opcao("se:"+k,e.estiloExtra===k,[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{e.estiloExtra=k;mudou()},()=>{e.estiloExtra=null;mudou()}))),()=>!e.estiloExtra?"escolher o Estilo de Luta":null);
    if(c==="bardo"&&kSub==="saber"&&n===6){e.descobertas=e.descobertas||[];const gb=conjuradores(P2).find(x=>x.c==="bardo"),mx=gb?gb.maxNv:1;
      const op=MAGIAS.filter(m=>["Clérigo","Druida","Mago"].some(l=>m[4].includes(l))&&m[2]<=mx&&(!jaConhece(P2,m[0],"Descobertas Mágicas")||e.descobertas.includes(m[0])));
      add("Descobertas Mágicas: 2 magias",b=>blocoEscolha(b,"De Clérigo, Druida ou Mago (truque ou até nível "+mx+")",null,op,e.descobertas,2,v=>e.descobertas=v),()=>e.descobertas.length<2?"escolher as 2 magias das Descobertas Mágicas":null)}}
  /* magias de cada conjurador que muda neste nível */
  const g=conjuradores(P2).find(x=>x.c===c);
  if(g){const Lc=magClasse(P,c);const ja=k=>jaConhece(P2,k,g.nome);const sub=g.tipo==="terco";
    if(g.truques)add("Truques de "+g.nome+(sub?" (de Mago)":""),b=>blocoEscolha(b,"Truques ("+g.truques+")",g.fixos&&g.fixos.length?"Mais "+lista(g.fixos.map(nm))+", que já vem.":null,listaClasse(g.lista,0).filter(s=>!(g.fixos||[]).includes(s[0])&&(!ja(s[0])||Lc.truques.includes(s[0]))),Lc.truques,g.truques,v=>Lc.truques=v,g.sugT),()=>Lc.truques.length<g.truques?"escolher os truques de "+g.nome:null);
    const nvs=s=>s[2]>=1&&s[2]<=g.maxNv;
    if(g.c==="mago"){add("Grimório ("+g.grimorio+" magias)",b=>blocoEscolha(b,"Magias do grimório","A cada nível de Mago entram 2 magias novas (até nível "+g.maxNv+").",MAGIAS.filter(m=>m[4].includes("Mago")&&nvs(m)),Lc.grim,g.grimorio,v=>{Lc.grim=v;Lc.prep=Lc.prep.filter(x=>grimorioDe(P2).includes(x))}),()=>Lc.grim.length<g.grimorio?"escolher as magias novas do grimório":null);
      add("Preparadas ("+g.prep+")",b=>blocoEscolha(b,"Preparadas do grimório",null,grimorioDe(P2).map(magia).filter(Boolean),Lc.prep,g.prep,v=>Lc.prep=v),()=>Lc.prep.length<g.prep?"preparar "+g.prep+" magias":null)}
    else add("Magias preparadas de "+g.nome+" ("+g.prep+")",b=>blocoEscolha(b,"Preparadas","Até magias de nível "+g.maxNv+". Você pode trocar as que já tinha.",MAGIAS.filter(s=>(g.listas||[g.lista]).some(l=>s[4].includes(l))&&nvs(s)&&!g.sempre.includes(s[0])),Lc.prep,g.prep,v=>Lc.prep=v,g.sugP),()=>Lc.prep.length<g.prep?"escolher as magias preparadas de "+g.nome:null)}
  return out}
function uiTalento(b,P,slot){const t=P.tal[slot];const tl=TALENTOS[t.k];if(!tl)return;b.append(rico(tl.x,"nota"));t.per=t.per||[];t.ferr=t.ferr||[];
  if(t.k==="habilidoso"){const tot=t.per.length+t.ferr.length;b.append(contador(tot,3,"escolhidas"),el("p",{class:"cont"},"Perícias:"),chips(SK.map(x=>x[0]),t.per,99,n=>{if(n.length+t.ferr.length>3)return;t.per=n;mudou()},v=>(pericias(P).has(v)&&!t.per.includes(v))||(!t.per.includes(v)&&tot>=3)),
    el("p",{class:"cont"},"Ou ferramentas:"),chips(TODAS_FERR,t.ferr,99,n=>{if(n.length+t.per.length>3)return;t.ferr=n;mudou()},v=>!t.ferr.includes(v)&&tot>=3))}
  else if(t.k==="artifice"||t.k==="musico")b.append(chips(t.k==="artifice"?ARTESAO:INSTRUMENTOS,t.ferr,3,n=>{t.ferr=n;mudou()}));
  else if(t.k==="iniciado"){b.append(el("p",{class:"cont"},"Lista:"),chips(["Clérigo","Druida","Mago"],t.lista?[t.lista]:[],1,n=>{t.lista=n[0]||null;t.truques=[];t.magia=null;mudou()}),
    el("p",{class:"cont"},"Atributo:"),chips(["INT","SAB","CAR"].map(x=>[x,ATR_N[x]]),t.atr?[t.atr]:[],1,n=>{t.atr=n[0]||null;mudou()}));
    if(t.lista){t.truques=t.truques||[];blocoEscolha(b,"2 truques",null,listaClasse(t.lista,0),t.truques,2,v=>t.truques=v);blocoEscolha(b,"1 magia de nível 1",null,listaClasse(t.lista,1),t.magia?[t.magia]:[],1,v=>t.magia=v[0]||null)}}}
function okTalento(P,slot){const t=P.tal[slot]||{};if(["habilidoso","artifice","musico"].includes(t.k)&&((t.per||[]).length+(t.ferr||[]).length)<3)return "fazer as escolhas do talento";
  if(t.k==="iniciado"&&(!t.lista||!t.atr||(t.truques||[]).length<2||!t.magia))return "fazer as escolhas do Iniciado em Magia";return null}
function rSubir(manter){const P=AT();if(!P||!SUBIR){mostrar("ficha");return}const L=SUBIR,nv=NV(P)+1;const y=window.scrollY;
  $("#sb-t").textContent="Subir para o nível "+nv;$("#sb-s").textContent=P.nome+" · "+resumoCurto(P);
  const c=$("#sb-corpo");c.textContent="";
  c.append(el("h3",{},"Em qual classe?"),el("p",{class:"nota"},"Suba numa classe que já tem ou entre numa nova (multiclasse). Para uma classe nova, o livro pede 13 no atributo principal dela e das suas classes atuais."));
  if(L.c&&!L.verTodas)c.append(el("button",{type:"button",class:"lnk",style:"align-self:flex-start",onclick:()=>{L.verTodas=true;mudou()}},"trocar de classe"));
  Object.entries(CLASSES).forEach(([k,cl])=>{if(L.c&&!L.verTodas&&L.c!==k)return;const n=nC(P,k);const falta=n?[]:podeMulti(P,k);const sel=L.c===k;
    const cab=[el("b",{},cl.n+(n?" "+(n+1):" 1")),el("span",{},n?"subir de "+n+" para "+(n+1):"multiclasse"),el("em",{},falta.length?"Não dá: "+lista(falta)+".":n?cl.resumo:"Ganha d"+cl.dv+" de vida e "+MULTI_GANHA[k].t+".")];
    const o=opcao("c:"+k,sel,cab,()=>[],falta.length?null:()=>{if(L.c!==k){restaurarSnap(P,L.snap);Object.assign(L,{c:k,pv:null,modo:"fixo",esc:{}});abertos={}}L.verTodas=false;mudou()},()=>{restaurarSnap(P,L.snap);Object.assign(L,{c:null,pv:null,modo:"fixo",esc:{}});abertos={};L.verTodas=false;mudou()});
    if(falta.length)o.style.opacity=".55";c.append(o)});
  if(L.c){const P2=comNivel(P),cl=CLASSES[L.c],n=nC(P2,L.c),fixo=cl.dv/2+1,m=MOD(P2);
    c.append(el("h3",{},"Vida"),el("div",{class:"seg"},el("button",{type:"button",class:L.modo==="fixo"?"on":"",onclick:()=>{L.modo="fixo";L.pv=fixo;mudou()}},"Valor fixo ("+fixo+")"),el("button",{type:"button",class:L.modo==="rolar"?"on":"",onclick:()=>{L.modo="rolar";L.pv=null;mudou()}},"Rolar na mesa (1d"+cl.dv+")")));
    if(L.modo==="fixo"&&L.pv!==fixo)L.pv=fixo;
    if(L.modo==="rolar")c.append(el("div",{class:"linha"},el("span",{class:"nota"},"Role 1d"+cl.dv+" na mesa e escreva o resultado:"),
      el("input",{type:"number",inputMode:"numeric",min:1,max:cl.dv,value:L.pv||"",style:"width:80px","aria-label":"Resultado do dado de vida",onchange:e=>{const v=parseInt(e.target.value,10);L.pv=v>=1&&v<=cl.dv?v:null;mudou()}})));
    if(L.pv){const ext=(P.esp==="anao"?1:0)+(temTalento(P,"vigoroso")?2:0)+(L.c==="feiticeiro"&&n===3&&L.esc.sub==="draconica"?3:0);
      c.append(el("p",{class:"cont ok"},"PV ganhos neste nível: "+L.pv+" "+sinal(m.CON)+" (Constituição)"+(ext?" + "+ext+" (espécie/talento/subclasse)":"")+" = "+Math.max(1,L.pv+m.CON)+(ext?" + "+ext:"")))}
    c.append(el("h3",{},"O que você ganha"),el("ul",{class:"lista"},...ganhosDoNivel(P2,L.c,n).map(f=>itemLista(f.n,"",null,()=>folha(f.n,cl.n+" "+n,[f.x])))));
    if(n===3&&nC(P2,L.c)===3&&!subObj(P2,L.c))c.append(el("p",{class:"nota"},"No nível 3 da classe você escolhe a subclasse."));
    escolhasNivel(P).forEach(q=>{c.append(el("h3",{},q.t));const b=el("div",{style:"display:flex;flex-direction:column;gap:8px"});q.r(b);c.append(b)})}
  if(manter)window.scrollTo(0,y);
  const f=faltaSubir(P);$("#sb-falta").textContent=f?"Falta: "+f+".":"";$("#sb-ok").disabled=!!f;$("#sb-ok").textContent="Confirmar nível "+nv}
function faltaSubir(P){const L=SUBIR;if(!L||!L.c)return "escolher a classe";if(!L.pv)return "definir a vida (fixo ou rolar)";for(const q of escolhasNivel(P)){const f=q.ok();if(f)return f}return null}
function confirmarNivel(){const P=AT();if(faltaSubir(P))return;const L=SUBIR;const antes=pvMax(P);
  P.niveis=[...(P.niveis||[]),{c:L.c,pv:L.pv,modo:L.modo,esc:L.esc,snap:L.snap}];delete P._passo;P.jogo.pv=Math.min(pvMax(P),(P.jogo.pv||0)+(pvMax(P)-antes));
  SUBIR=null;gravar(true);aba="ficha";mostrar("ficha");prepararCodigo(P)}
function desfazerNivel(P){const L=P.niveis.pop();if(!L)return;restaurarSnap(P,L.snap);P.jogo.pv=Math.min(P.jogo.pv,pvMax(P));gravar(true);rFicha();prepararCodigo(P)}

/* ================= v3: níveis 4 e 5 — Aumento de Atributo, talentos gerais, maestria e invocações ================= */
function nivelGeral(P,c,l){let cnt=P.classe===c?1:0;if(cnt===l)return 1;const ns=P.niveis||[];for(let i=0;i<ns.length;i++){if(ns[i].c===c){cnt++;if(cnt===l)return i+2}}return 0}
function nomeInvoc(k){return (INVOCACOES[k]||INVOCACOES_N2[k]||INVOCACOES_N5[k]||INVOCACOES_ALTAS[k]||[k])[0]}
function nomeAsi(k){if(TALENTOS_GERAIS[k])return TALENTOS_GERAIS[k].n;if(k.startsWith("o:")&&TALENTOS[k.slice(2)])return TALENTOS[k.slice(2)].n;if(k.startsWith("e:")&&ESTILOS[k.slice(2)])return ESTILOS[k.slice(2)][0];return k}
function textoAsi(a){
  if(a.k==="aumento")return "Você aumentou seus atributos.\n- **Escolhido:** "+(a.modo==="2"?"+2 em "+ATR_N[a.a1]:"+1 em "+ATR_N[a.a1]+" e +1 em "+ATR_N[a.a2])+".";
  return "Você escolheu um talento: **"+nomeAsi(a.k)+"**.\n- **Detalhes:** toque nele na lista de características."}
function detalheTalento(a){const o=[];if(a.a1)o.push("+1 em "+ATR_N[a.a1]);if(a.el)o.push("elemento "+a.el);if(a.magia)o.push(nm(a.magia));
  if(a.per)o.push(a.per+(a.esp?" (Especialização)":" (proficiência)"));if(a.esp2)o.push("Especialização em "+a.esp2);
  if((a.rituais||[]).length)o.push("rituais: "+lista(a.rituais.map(nm)));if(a.arma)o.push("maestria: "+arma(a.arma)[1]);
  return o.length?"\n- **Suas escolhas:** "+lista(o)+".":""}
function reqAsi(P,P2,t){const r=t.req||{};const f=atrFinal(P);
  if(r.nivel&&NV(P2)<r.nivel)return "pede nível "+r.nivel;
  if(r.atr&&!r.atr.every(g=>g.some(a=>f[a]>=13)))return "pede "+r.atr.map(g=>g.map(a=>ATR_N[a]).join(" ou ")).join(" e ")+" 13";
  if(r.conj&&!conjuradores(P2).length)return "pede Conjuração ou Magia de Pacto";
  if(r.armad&&!treinoArmadura(P2).includes(r.armad))return "pede treino com "+{leve:"armadura Leve",media:"armadura Média",pesada:"armadura Pesada",escudo:"Escudo"}[r.armad];
  return null}
function opcoesAsi(P,P2){const out=[],ja=asisDe(P).map(a=>a.k);
  const g=Object.entries(TALENTOS_GERAIS).filter(([k,t])=>(t.rep||!ja.includes(k))&&(!t.epico||NV(P2)>=19)).map(([k,t])=>({k,n:t.n,x:t.x,falta:reqAsi(P,P2,t),tipo:t.epico?"Dádivas Épicas":"Talentos Gerais",ep:t.epico?1:0}));
  out.push(g.shift(),...g.sort((a,b)=>(b.ep-a.ep)||a.n.localeCompare(b.n)));
  Object.entries(TALENTOS).forEach(([k,t])=>{if(!temTalento(P,k))out.push({k:"o:"+k,n:t.n,x:t.x,tipo:"Talentos de Origem"})});
  if(nC(P2,"guerreiro")>=1||nC(P2,"paladino")>=2||nC(P2,"patrulheiro")>=2)Object.entries(ESTILOS).forEach(([k,v])=>{if(!estilosDe(P).includes(k))out.push({k:"e:"+k,n:v[0],x:v[1],tipo:"Talentos de Estilo de Luta"})});
  return out}
function atrsTalento(P,t){const op=t.atr==="todas"?ATR:t.atr==="semResist"?ATR.filter(x=>!salvProf(P,x)):(t.atr||[]);return op}
function escolhaAsi(P,P2,e,add){e.asi=e.asi||{};const a=e.asi,nvN=NV(P)+1,f=atrFinal(P),slot="nv"+nvN;
  const escolher=k=>{e.asi={k};abertos["asi:"+k]=true;P.tal=P.tal||{};if(k.startsWith("o:"))P.tal[slot]={k:k.slice(2)};else delete P.tal[slot];
    if(k==="aumento")e.asi.modo="2";const t=TALENTOS_GERAIS[k];if(t){const op=atrsTalento(P,t).filter(x=>f[x]<(t.epico?30:20));if(op.length===1)e.asi.a1=op[0]}mudou()};
  const tirar=()=>{e.asi={};if(P.tal)delete P.tal[slot];mudou()};
  add("Aumento de Atributo ou Talento",b=>{
    // tocar no nome só abre e fecha a explicação; escolher é o botão de dentro, e a lista nunca some
    const ops=opcoesAsi(P,P2);let dEsc=null;
    const esc=ops.find(o=>o.k===a.k);
    b.append(el("p",{class:"nota"},esc?"Escolhido: "+esc.n+". Toque num nome para ler; para mudar, abra outro e toque em Escolher.":"Toque num nome para ler a explicação, e em Escolher para ficar com ele. Os apagados pedem algo que você ainda não tem."));
    let ult=null;ops.forEach(o=>{
      if(o.k!=="aumento"&&o.tipo!==ult){b.append(el("p",{class:"cont"},o.tipo));ult=o.tipo}
      const id="asi:"+o.k,on=a.k===o.k,ab=!!abertos[id];
      const op=el("div",{class:"op"+(on?" on":"")},el("button",{class:"cab",type:"button","aria-expanded":String(ab),onclick:()=>{abertos[id]=!ab;redesenhar()}},
        [el("b",{},o.n),el("span",{},on?"✓ escolhido":""),el("em",{},o.falta?"Não dá: "+o.falta+".":linha1(o.x))]));
      if(ab){const d=el("div",{class:"det"},rico(o.x));op.append(d);
        if(o.falta)d.append(el("p",{class:"nota"},"Não dá: "+o.falta+"."));
        else if(!on)d.append(el("button",{type:"button",class:"bt mini",style:"align-self:flex-start;margin-top:8px",onclick:()=>escolher(o.k)},"Escolher "+o.n));
        else{dEsc=d;op.append(el("div",{class:"det"},el("button",{type:"button",class:"lnk",style:"align-self:flex-start",onclick:tirar},"Tirar a escolha")))}}
      if(o.falta&&!ab)op.style.opacity=".55";b.append(op)});
    // as escolhas do talento (atributo, elemento, magia...) aparecem dentro dele, aberto
    if(!a.k||!dEsc)return;b=dEsc;
    if(a.k==="aumento"){
      b.append(el("div",{class:"seg"},el("button",{type:"button",class:a.modo==="2"?"on":"",onclick:()=>{a.modo="2";a.a2=null;mudou()}},"+2 num atributo"),el("button",{type:"button",class:a.modo==="11"?"on":"",onclick:()=>{a.modo="11";mudou()}},"+1 em dois")));
      const sel=[a.a1,a.a2].filter(Boolean),mx=a.modo==="2"?1:2,soma=a.modo==="2"?2:1;
      b.append(chips(ATR.map(x=>[x,ATR_N[x]+" "+f[x]]),sel,mx,v=>{a.a1=v[0]||null;a.a2=a.modo==="2"?null:(v[1]||null);mudou()},v=>f[v]+soma>20&&!sel.includes(v)));
      if(sel.length)b.append(el("p",{class:"cont ok"},sel.map(x=>ATR_N[x]+" "+f[x]+" → "+Math.min(20,f[x]+soma)).join(" · ")));return}
    const t=TALENTOS_GERAIS[a.k];
    if(a.k.startsWith("o:")){if(P.tal&&P.tal[slot])uiTalento(b,P,slot);return}
    if(!t)return;
    const op=atrsTalento(P,t);if(op.length>1){b.append(el("p",{class:"cont"},"Atributo que sobe +1:"),chips(op.map(x=>[x,ATR_N[x]+" "+f[x]]),a.a1?[a.a1]:[],1,v=>{a.a1=v[0]||null;mudou()},v=>f[v]>=(t.epico?30:20)))}
    else if(op.length===1)b.append(el("p",{class:"cont ok"},ATR_N[op[0]]+" "+f[op[0]]+" → "+Math.min(t.epico?30:20,f[op[0]]+1)));
    if(t.esc==="elemento"){const ja=asisDe(P).map(z=>z.el).filter(Boolean);b.append(el("p",{class:"cont"},"Elemento:"),chips(ELEMENTOS_TAL,a.el?[a.el]:[],1,v=>{a.el=v[0]||null;mudou()},v=>ja.includes(v)))}
    if(t.esc==="magiaFada"||t.esc==="magiaSombra"){const esc=t.esc==="magiaFada"?["Adivinhação","Encantamento"]:["Ilusão","Necromancia"];
      blocoEscolha(b,"1 magia de nível 1 ("+esc.join(" ou ")+")",null,MAGIAS.filter(s=>s[2]===1&&esc.includes(s[3])),a.magia?[a.magia]:[],1,v=>a.magia=v[0]||null)}
    if(t.esc==="perOuEsp"){b.append(el("p",{class:"cont"},"Perícia (sem proficiência você ganha; com proficiência vira Especialização):"),
      chips(t.ops,a.per?[a.per]:[],1,v=>{a.per=v[0]||null;a.esp=!!a.per&&pericias(P).has(a.per);mudou()},v=>especialDe(P).includes(v)))}
    if(t.esc==="perEsp"){const tem=pericias(P);b.append(el("p",{class:"cont"},"Nova perícia:"),chips(SK.map(x=>x[0]).filter(k=>!tem.has(k)),a.per?[a.per]:[],1,v=>{a.per=v[0]||null;if(a.esp2===a.per)a.esp2=null;mudou()}),
      el("p",{class:"cont"},"Especialização em:"),chips([...tem.keys(),...(a.per?[a.per]:[])].filter(k=>!especialDe(P).includes(k)),a.esp2?[a.esp2]:[],1,v=>{a.esp2=v[0]||null;mudou()}))}
    if(t.esc==="todasPer"){b.append(el("p",{class:"cont"},"Especialização em:"),chips(SK.map(x=>x[0]).filter(k=>!especialDe(P).includes(k)||a.esp2===k),a.esp2?[a.esp2]:[],1,v=>{a.esp2=v[0]||null;mudou()}))}
    if(t.esc==="rituais"){a.rituais=a.rituais||[];blocoEscolha(b,"Rituais de nível 1 ("+PB(nvN)+")",null,MAGIAS.filter(s=>s[2]===1&&s[10]),a.rituais,PB(nvN),v=>a.rituais=v)}
    if(t.esc==="maestria1"){b.append(el("p",{class:"cont"},"Arma da maestria:"),chips(ARMAS.filter(w=>profArma(P2,w[0])&&!maestriasDe(P).includes(w[0])).map(w=>[w[0],w[1],w[7]]),a.arma?[a.arma]:[],1,v=>{a.arma=v[0]||null;mudou()}))}},
  ()=>{if(!a.k)return "escolher o Aumento de Atributo ou um talento";
    if(a.k==="aumento")return !a.a1||(a.modo==="11"&&!a.a2)?"escolher os atributos que sobem":null;
    if(a.k.startsWith("o:"))return okTalento(P,slot);
    const t=TALENTOS_GERAIS[a.k];if(!t)return null;
    if(atrsTalento(P,t).length&&!a.a1)return "escolher o atributo do talento";
    if(t.esc==="elemento"&&!a.el)return "escolher o elemento";
    if((t.esc==="magiaFada"||t.esc==="magiaSombra")&&!a.magia)return "escolher a magia do talento";
    if(t.esc==="perOuEsp"&&!a.per)return "escolher a perícia do talento";
    if(t.esc==="perEsp"&&(!a.per||!a.esp2))return "escolher a perícia e a Especialização";
    if(t.esc==="todasPer"&&!a.esp2)return "escolher a perícia da Especialização";
    if(t.esc==="rituais"&&(a.rituais||[]).length<PB(nvN))return "escolher os rituais";
    if(t.esc==="maestria1"&&!a.arma)return "escolher a arma da maestria";return null})}
function escolhaMaestria(P,P2,c,e,add){const op=(c==="barbaro"?ARMAS.filter(a=>a[3]==="C"):ARMAS).filter(a=>!maestriasDe(P).includes(a[0]));
  add("Maestria em Armas: mais 1",b=>b.append(chips(op.map(a=>[a[0],a[1],a[7]]),e.maestria1?[e.maestria1]:[],1,v=>{e.maestria1=v[0]||null;mudou()})),()=>!e.maestria1?"escolher a arma da nova maestria":null)}
function escolhaInvoc5(P,e,add,qtd,nb){qtd=qtd||2;nb=nb||5;e.invoc5=e.invoc5||[];const ja=invocsDe(P);const op={...INVOCACOES,...INVOCACOES_N2,...INVOCACOES_N5,...INVOCACOES_ALTAS};
  const temPacto=p=>ja.includes(p)||e.invoc5.includes(p);
  add("Invocações Místicas: mais "+qtd,b=>{b.append(contador(e.invoc5.length,qtd,"escolhidas · toque de novo numa escolhida para desmarcar"));
    Object.entries(op).filter(([k])=>!ja.includes(k)||k==="agonizante").forEach(([k,v])=>{const pede=INVOC_PEDE[k],alta=INVOCACOES_ALTAS[k];const falta=alta&&nb<alta[2]?"pede nível "+alta[2]+" de Bruxo":pede&&!temPacto(pede)?"pede "+nomeInvoc(pede):null;
      const o=opcao("iv5:"+k,e.invoc5.includes(k),[el("b",{},v[0]),el("span",{},INVOCACOES_ALTAS[k]?"nível "+INVOCACOES_ALTAS[k][2]+"+":INVOCACOES_N5[k]?"nível 5+":INVOCACOES_N2[k]?"nível 2+":""),el("em",{},falta?"Não dá: "+falta+".":linha1(v[1]))],()=>[rico(v[1])],
        falta?null:()=>{if(e.invoc5.length<qtd){e.invoc5=[...e.invoc5,k];if(k==="licoes"){P.tal=P.tal||{};P.tal.lic={k:null}}mudou()}else redesenhar()},()=>{e.invoc5=e.invoc5.filter(x=>x!==k);if(k==="licoes"&&P.tal&&!ja.includes("licoes"))delete P.tal.lic;mudou()});if(falta)o.style.opacity=".55";b.append(o)});
    if(e.invoc5.length)b.append(el("button",{type:"button",class:"lnk",onclick:()=>{e.invoc5=[];if(P.tal&&!ja.includes("licoes"))delete P.tal.lic;mudou()}},"limpar escolhas"));
    if(e.invoc5.includes("licoes")){const t=P.tal.lic=P.tal.lic||{k:null};b.append(el("p",{class:"cont"},"Lições dos Primeiros: talento de Origem"),chips(Object.entries(TALENTOS).map(([k,v])=>[k,v.n]),t.k?[t.k]:[],1,v=>{P.tal.lic={k:v[0]||null};mudou()},v=>temTalento(P,v)&&!["iniciado","habilidoso"].includes(v)));if(t.k)uiTalento(b,P,"lic")}
    if(e.invoc5.includes("tomo")){e.tomoT=e.tomoT||[];e.tomoR=e.tomoR||[];blocoEscolha(b,"Pacto do Tomo: 3 truques","De qualquer lista.",MAGIAS.filter(s=>s[2]===0),e.tomoT,3,v=>e.tomoT=v);blocoEscolha(b,"Pacto do Tomo: 2 rituais",null,MAGIAS.filter(s=>s[2]===1&&s[10]),e.tomoR,2,v=>e.tomoR=v)}},
    ()=>{if(e.invoc5.length<qtd)return "escolher "+qtd+" Invocação"+(qtd>1?"ões":"");
      const semPacto=e.invoc5.find(k=>INVOC_PEDE[k]&&!temPacto(INVOC_PEDE[k]));if(semPacto)return nomeInvoc(semPacto)+" pede "+nomeInvoc(INVOC_PEDE[semPacto]);
      if(e.invoc5.includes("licoes")){if(!(P.tal.lic||{}).k)return "escolher o talento de Lições dos Primeiros";const f=okTalento(P,"lic");if(f)return f}
      if(e.invoc5.includes("tomo")&&((e.tomoT||[]).length<3||(e.tomoR||[]).length<2))return "escolher as magias do Pacto do Tomo";return null})}

/* ===== Forma Selvagem: formas conhecidas (Bestas do SRD 5.2) ===== */
function formasMax(P){const n=nC(P,"druida");return n<2?0:n<4?4:n<8?6:8}
function ndMaxForma(P){const n=nC(P,"druida");let v=n>=8?1:n>=4?0.5:0.25;if(subDe(P,"druida")==="lua"&&n>=3)v=Math.max(v,Math.floor(n/3));return v}
function formasDe(P){return (P.formas||[]).filter(k=>besta(k))}
function caFormas(P,b){const m=MOD(P),dx=mod(b[7]),cs=classesDe(P),op=[];
  if(cs.includes("monge"))op.push([10+dx+m.SAB,"Defesa sem Armadura do Monge (10 + DES da forma + sua SAB)"]);
  if(cs.includes("barbaro"))op.push([10+dx+mod(b[8]),"Defesa sem Armadura do Bárbaro (10 + DES e CON da forma)"]);
  if(subDe(P,"druida")==="lua"&&nC(P,"druida")>=3)op.push([13+m.SAB,"Formas do Círculo (13 + sua SAB)"]);
  return op.filter(o=>o[0]>b[4]).sort((x,y)=>y[0]-x[0])}
function folhaFormas(P){const s=$("#sheet");s.textContent="";const mx=formasMax(P),nd=ndMaxForma(P),fs=formasDe(P);
  s.append(el("button",{class:"fechar",type:"button","aria-label":"Fechar",onclick:fecharFolha},"×"),el("h4",{id:"sheet-t"},"Formas conhecidas"),
    el("div",{class:"tipo"},fs.length+" de "+mx+" · Bestas de ND até "+ND_TXT(nd)+(nC(P,"druida")>=8?"":", sem voo")),
    el("p",{class:"nota"},"Pela regra, ao terminar um descanso longo você pode trocar uma das formas. Toque no nome para ver a ficha do animal."));
  const ul=el("div",{style:"display:flex;flex-direction:column;gap:6px;margin-top:8px"});
  BESTAS.filter(b=>b[3]<=nd&&(!b[13]||nC(P,"druida")>=8)).sort((a,b)=>b[3]-a[3]||a[1].localeCompare(b[1])).forEach(b=>{const on=fs.includes(b[0]);
    ul.append(el("div",{class:"op"+(on?" on":"")},el("div",{class:"mg",style:"padding:8px 11px"},
      el("input",{type:"checkbox",checked:on,disabled:!on&&fs.length>=mx,"aria-label":"Conhecer "+b[1],onchange:()=>{P.formas=on?fs.filter(k=>k!==b[0]):[...fs,b[0]];gravar(true);rFicha(true);folhaFormas(P)}}),
      el("button",{type:"button",class:"cab",style:"padding:0",onclick:()=>folhaBesta(P,b[0],true)},el("b",{},b[1]),el("span",{},"ND "+ND_TXT(b[3])+" · CA "+b[4]),el("em",{},b[5])))))});
  s.append(ul,el("p",{class:"fonte"},"Estatísticas das Bestas traduzidas do SRD 5.2, da Wizards of the Coast (licença CC-BY-4.0)."));
  s.classList.add("on");$("#veu").classList.add("on");s.scrollTop=0}
function folhaBesta(P,k,daLista){const b=besta(k);if(!b)return;const s=$("#sheet");s.textContent="";const n=nC(P,"druida");
  const tmp=(subDe(P,"druida")==="lua"&&n>=3?3:1)*n;const alt=caFormas(P,b);const md=v=>v+" ("+sinal(mod(v))+")";
  s.append(el("button",{class:"fechar",type:"button","aria-label":"Fechar",onclick:fecharFolha},"×"),el("h4",{id:"sheet-t"},b[1]),el("div",{class:"tipo"},"Besta "+b[2]+" · ND "+ND_TXT(b[3])),
    daLista?el("button",{type:"button",class:"lnk",style:"align-self:flex-start",onclick:()=>folhaFormas(P)},"‹ voltar às formas"):null,
    el("dl",{class:"meta"},el("dt",{},"CA"),el("dd",{},String(b[4])+(alt.length?" · ou "+alt[0][0]+" pela "+alt[0][1]:"")),el("dt",{},"Deslocamento"),el("dd",{},b[5]),
      el("dt",{},"Força"),el("dd",{},md(b[6])),el("dt",{},"Destreza"),el("dd",{},md(b[7])),el("dt",{},"Constituição"),el("dd",{},md(b[8])),
      el("dt",{},"Sentidos"),el("dd",{},b[9]),b[10]?[el("dt",{},"Perícias"),el("dd",{},b[10])]:null),
    b[11]?el("div",{},el("b",{class:"tr-n"},"Traços"),rico(b[11])):null,el("div",{},el("b",{class:"tr-n"},"Ações"),rico(b[12])),
    rico("Na forma, a regra da Forma Selvagem diz:\n- **Vida:** você mantém seus PV e ganha "+tmp+" PV temporários.\n- **Mantém:** Inteligência, Sabedoria, Carisma, características, talentos, idiomas e suas proficiências (com o seu bônus). Se a perícia ou resistência do animal for maior, usa a dele.\n- **Não pode:** conjurar magias. A Concentração continua.","nota"),
    el("p",{class:"fonte"},"Estatísticas traduzidas do SRD 5.2, da Wizards of the Coast (licença CC-BY-4.0)."));
  s.classList.add("on");$("#veu").classList.add("on");s.scrollTop=0}

/* ===== rever as escolhas do nível 1 numa ficha pronta (a classe fica travada) ===== */
function editarCriacao(P){DB.rasc=P;P._edit=1;passo=PASSOS.findIndex(p=>p.id==="ant");abertos={};gravar();mostrar("criador")}
/* ===== escolher ou trocar truques e magias preparadas pela ficha ===== */
const TROCA_TXT={bardo:"Bardo: troca 1 truque e 1 magia ao subir de nível.",clerigo:"Clérigo: troca as preparadas ao terminar um descanso longo; 1 truque ao subir de nível.",
  druida:"Druida: troca as preparadas ao terminar um descanso longo; 1 truque ao subir de nível.",feiticeiro:"Feiticeiro: troca 1 truque e 1 magia ao subir de nível.",
  bruxo:"Bruxo: troca 1 truque e 1 magia ao subir de nível.",mago:"Mago: troca as preparadas (do grimório) e 1 truque ao terminar um descanso longo.",
  paladino:"Paladino: troca 1 preparada ao terminar um descanso longo.",patrulheiro:"Patrulheiro: troca 1 preparada ao terminar um descanso longo.",
  guerreiro:"Cavaleiro Arcano: troca 1 truque e 1 magia ao subir de nível no Guerreiro.",ladino:"Trapaceiro Arcano: troca 1 truque e 1 magia ao subir de nível no Ladino."};
function folhaTrocarMagias(P,aberto){const s=$("#sheet");s.textContent="";const cj=conjuradores(P);aberto=aberto||{};
  s.append(el("button",{class:"fechar",type:"button","aria-label":"Fechar",onclick:fecharFolha},"×"),el("h4",{id:"sheet-t"},"Escolher ou trocar magias"),
    el("p",{class:"nota"},"Marque e desmarque à vontade. A regra de quando trocar está em cada classe."));
  const grupo=(titulo,ops,arr,max,salvar,id)=>{const cab=el("button",{type:"button",class:"cab",style:"padding:9px 0;text-align:left",onclick:()=>{aberto[id]=!aberto[id];folhaTrocarMagias(P,aberto)}},
      el("b",{},titulo+" · "+arr.length+" de "+max+(arr.length<max?" (falta escolher)":"")));s.append(cab);
    if(!aberto[id]&&arr.length>=max)return;
    ops.forEach(m=>{const on=arr.includes(m[0]);s.append(el("label",{class:"mg",style:"display:flex;gap:8px;align-items:flex-start;padding:5px 0"},
      el("input",{type:"checkbox",checked:on,disabled:!on&&arr.length>=max,onchange:()=>{salvar(on?arr.filter(x=>x!==m[0]):[...arr,m[0]]);gravar(true);rFicha(true);aberto[id]=true;folhaTrocarMagias(P,aberto)}}),
      el("span",{},el("b",{},m[1]),el("span",{class:"mute"}," · "+(m[2]?"nv "+m[2]+" · ":"")+m[5]))))})};
  cj.forEach(g=>{const L=magClasse(P,g.c);L.truques=L.truques||[];L.prep=L.prep||[];s.append(el("h3",{class:"sec-t"},g.nome),el("p",{class:"nota"},TROCA_TXT[g.c]||""));
    if(g.truques)grupo("Truques",listaClasse(g.lista,0).filter(m=>!(g.fixos||[]).includes(m[0])&&(!jaConhece(P,m[0],g.nome)||L.truques.includes(m[0]))),L.truques,g.truques,v=>L.truques=v,g.c+"t");
    const nvs=m=>m[2]>=1&&m[2]<=g.maxNv;
    if(g.c==="mago")grupo("Preparadas (do grimório)",grimorioDe(P).map(magia).filter(Boolean),L.prep,g.prep,v=>L.prep=v,g.c+"p");
    else grupo("Preparadas",MAGIAS.filter(m=>(g.listas||[g.lista]).some(l=>m[4].includes(l))&&nvs(m)&&!g.sempre.includes(m[0])),L.prep,g.prep,v=>L.prep=v,g.c+"p")});
  s.classList.add("on");$("#veu").classList.add("on")}
function magiasFaltando(P){return conjuradores(P).some(g=>{const L=magClasse(P,g.c);return (L.truques||[]).length<g.truques||(L.prep||[]).length<g.prep})}
/* ===== armas e armaduras compradas depois da criação ===== */
function folhaCompras(P){const s=$("#sheet");s.textContent="";P.compras=P.compras||[];P.tirados=P.tirados||[];
  const pronto=()=>{if(P.jogo&&P.jogo.arm&&!armadurasDisp(P).includes(P.jogo.arm))delete P.jogo.arm;gravar(true);rFicha(true);folhaCompras(P)};
  const tirar=i=>{P.compras.splice(i,1);pronto()};
  const nomeItem=d=>d.t==="a"?arma(d.k)[1]:armadura(d.k)[1];
  s.append(el("button",{class:"fechar",type:"button","aria-label":"Fechar",onclick:fecharFolha},"×"),el("h4",{id:"sheet-t"},"Trocar ou comprar arma e armadura"),
    el("p",{class:"nota"},"Entram no Equipamento e nos Ataques. A armadura que você veste escolhe na CA, aba Ficha. O ouro você acerta no campo Ouro."));
  /* do pacote inicial: tirar o que foi trocado com o mestre; "devolver" desfaz */
  const pac=itensEquip(Object.assign({},P,{compras:[],tirados:[]})).itens.filter(i=>i.t==="a"||i.t==="r");
  if(pac.length){s.append(el("p",{class:"cont"},"Do pacote inicial (toque em tirar para trocar):"),el("ul",{class:"res-l"},...pac.map(i=>{const n=P.tirados.filter(d=>d.t===i.t&&d.k===i.k).length;
    return el("li",{},(i.q>1?i.q+" × ":"")+nomeItem(i)+(n?" (tirou "+n+")":"")+" ",n<i.q?el("button",{type:"button",class:"lnk",onclick:()=>{P.tirados.push({t:i.t,k:i.k});pronto()}},"tirar"):null,n?" ":null,
      n?el("button",{type:"button",class:"lnk",onclick:()=>{P.tirados.splice(P.tirados.findIndex(d=>d.t===i.t&&d.k===i.k),1);pronto()}},"devolver"):null)})))}
  if(P.compras.length)s.append(el("p",{class:"cont"},"Compradas ou trocadas:"));
  if(P.compras.length)s.append(el("ul",{class:"res-l"},...P.compras.map((c,i)=>el("li",{},(c.t==="a"?arma(c.k)[1]:armadura(c.k)[1])+" ",el("button",{type:"button",class:"lnk",onclick:()=>tirar(i)},"tirar")))));
  const add=(t,k)=>{P.compras.push({t,k});gravar(true);rFicha(true);folhaCompras(P)};
  s.append(el("p",{class:"cont"},"Armaduras:"),chips(ARMADURAS.map(a=>[a[0],a[1]]),[],1,v=>{if(v[0])add("r",v[0])}),
    el("p",{class:"cont"},"Armas:"),chips(ARMAS.map(a=>[a[0],a[1]]),[],1,v=>{if(v[0])add("a",v[0])}));
  s.classList.add("on");$("#veu").classList.add("on")}

iniciar();
$("#sb-ok").onclick=confirmarNivel;$("#sb-voltar").onclick=cancelarSubir;
