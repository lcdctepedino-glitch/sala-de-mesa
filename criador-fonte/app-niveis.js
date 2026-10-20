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
function estilosDe(P){return [P.estilo,...escs(P,"estilo"),...escs(P,"estiloPal"),...escs(P,"estiloPat")].filter(x=>x&&ESTILOS[x])}
function invocsDe(P){return [P.invoc,...escs(P,"invoc").flat(),...escs(P,"invoc2").flat()].filter(Boolean)}
function maestriasDe(P){return [...new Set([...(P.maestrias||[]),...escs(P,"maestrias").flat()])]}
function especialDe(P){return [...new Set([...(P.especial||[]),...escs(P,"especial").flat(),...escs(P,"especial2").flat(),...escs(P,"explorador").map(x=>x.per).filter(Boolean),...escs(P,"erudito")])]}
function magClasse(P,c){if(c===P.classe||!P.classe)return P;P.magX=P.magX||{};return P.magX[c]=P.magX[c]||{truques:[],prep:[],grim:[]}}
const atrConj=c=>({bardo:"CAR",clerigo:"SAB",druida:"SAB",feiticeiro:"CAR",mago:"INT",bruxo:"CAR",paladino:"CAR",patrulheiro:"SAB",guerreiro:"INT",ladino:"INT",barbaro:"SAB",monge:"SAB"})[c];

/* talentos: inclui o de Lições dos Primeiros */
function slotsTalento(P){const s=[];const a=AN(P);if(a)s.push({slot:"ant",k:a.tal,lista:a.talOp||null});if(P.esp==="humano"&&P.ee.talHum)s.push({slot:"hum",k:P.ee.talHum,lista:null});
  if(invocsDe(P).includes("licoes")&&P.tal&&P.tal.lic&&P.tal.lic.k)s.push({slot:"lic",k:P.tal.lic.k,lista:null});return s}

/* ===== proficiências ===== */
function pericias(P){const m=periciasFixas(P);(P.perClasse||[]).forEach(p=>m.set(p,"classe"));periciasTalentos(P).forEach((v,k)=>m.set(k,v));
  (P.niveis||[]).forEach(n=>{const e=n.esc||{};(e.perMulti||[]).forEach(p=>m.set(p,"multiclasse"));if(e.perExtra)m.set(e.perExtra,"Conhecimento Primal");if(e.subEsc)(e.subEsc.per||[]).forEach(p=>m.set(p,"subclasse"))});
  classesDe(P).forEach(c=>{const s=subObj(P,c);if(s&&s.perFixas)s.perFixas.forEach(p=>m.set(p,"subclasse"))});return m}
function ferramentas(P){const f=[];const a=AN(P),c=CL(P);
  if(a){if(typeof a.ferr==="string")f.push(a.ferr);else if(P.ferrAnt)f.push(P.ferrAnt)}
  if(c&&c.ferr){if(c.ferr.fixa)f.push(c.ferr.fixa);else f.push(...(P.ferrClasse||[]))}
  slotsTalento(P).forEach(s=>{const t=P.tal[s.slot]||{};if(["artifice","musico","habilidoso"].includes(s.k))f.push(...(t.ferr||[]))});
  (P.niveis||[]).forEach(n=>{const e=n.esc||{};if(e.instrMulti)f.push(e.instrMulti);if(e.subEsc&&e.subEsc.ferr)f.push(e.subEsc.ferr)});
  classesDe(P).forEach(k=>{if(k!==P.classe&&MULTI_GANHA[k].ferr)f.push(MULTI_GANHA[k].ferr);const s=subObj(P,k);if(s&&s.ferrFixa)f.push(...[].concat(s.ferrFixa))});
  return [...new Set(f)]}
function idiomasDe(P){const l=["Comum",...P.idiomas];const cs=classesDe(P);
  if(cs.includes("ladino")){l.push("Gíria de Ladrão");if(P.classe==="ladino"&&P.idiomaExtra)l.push(P.idiomaExtra);escs(P,"idiomaRogue").forEach(x=>l.push(x))}
  if(cs.includes("druida"))l.push("Druídico");escs(P,"explorador").forEach(x=>(x.idiomas||[]).forEach(i=>l.push(i)));return [...new Set(l)]}
function marciais(P){const c=CL(P);if(!c)return false;if(c.armas.m)return true;
  return classesDe(P).some(k=>ordemDe(P,k)==="protetor"||ordemDe(P,k)==="guardiao"||(k!==P.classe&&MULTI_GANHA[k].m)||(subObj(P,k)&&subObj(P,k).prof&&subObj(P,k).prof.m))}
function treinoArmadura(P){const c=CL(P);if(!c)return [];const l=[...c.armad];
  classesDe(P).forEach(k=>{if(ordemDe(P,k)==="protetor")l.push("pesada");if(ordemDe(P,k)==="guardiao")l.push("media");if(k!==P.classe)l.push(...(MULTI_GANHA[k].armad||[]));
    const s=subObj(P,k);if(s&&s.prof)l.push(...(s.prof.armad||[]))});return [...new Set(l)]}
function textoArmas(P){const c=CL(P);if(!c)return "";if(marciais(P))return c.armas.m?c.armasTxt:"Simples e Marciais";return c.armasTxt}

/* ===== magia em vários níveis ===== */
function conjuradores(P){const out=[];const pc=niveisPorClasse(P);
  Object.keys(pc).forEach(c=>{const n=pc[c],cl=CLASSES[c];let g=null;
    if(cl.magia){const pr=PROG[c];g={c,atr:cl.magia.atr,lista:cl.magia.lista,truques:pr.truques[n-1],prep:pr.prep[n-1],tipo:c==="bruxo"?"pacto":CHEIO.includes(c)?"cheio":"meio",
      sempre:[...(cl.magia.sempre||[])],grimorio:c==="mago"?6+2*(n-1):0,sugT:cl.magia.sugT,sugP:cl.magia.sugP,sugG:cl.magia.sugG};
      if((c==="clerigo"&&ordemDe(P,c)==="taumaturgo")||(c==="druida"&&ordemDe(P,c)==="magico"))g.truques++;
      if(c==="paladino"&&n>=2)g.sempre.push("destruicaodivina")}
    const s=subObj(P,c);if(!g&&s&&s.magiaSub&&n>=3)g={c,atr:s.magiaSub.atr,lista:s.magiaSub.lista,truques:s.magiaSub.truques,prep:s.magiaSub.prep,tipo:"terco",sempre:[],fixos:s.magiaSub.fixos||[],grimorio:0};
    if(g){g.nivel=n;g.nome=cl.n;g.maxNv=g.tipo==="pacto"?PACTO[n][1]:g.tipo==="cheio"?(n>=3?2:1):1;out.push(g)}});
  return out}
function espacosDe(P){const cs=conjuradores(P).filter(g=>g.tipo!=="pacto");let tab=[];
  if(cs.length>=2){let L=0;cs.forEach(g=>{L+=g.tipo==="cheio"?g.nivel:g.tipo==="meio"?Math.ceil(g.nivel/2):Math.floor(g.nivel/3)});tab=TAB_ESPACOS[Math.min(L,5)]||[]}
  else if(cs.length===1){const g=cs[0];tab=g.tipo==="cheio"?TAB_ESPACOS[g.nivel]:g.tipo==="meio"?ESP_MEIO[g.nivel]:[2]}
  const pc=conjuradores(P).find(g=>g.tipo==="pacto");return {tab:tab||[],pacto:pc?PACTO[pc.nivel]:null}}
function grimorioDe(P){const L=magClasse(P,"mago");const extra=[];if(subObj(P,"mago"))extra.push(...(subEsc(P,"mago").escola||[]));return [...new Set([...(L.grim||[]),...extra])]}
function magiasDe(P){const r=[];const pc=niveisPorClasse(P);
  conjuradores(P).forEach(g=>{const L=magClasse(P,g.c);(g.fixos||[]).forEach(k=>r.push({k,fonte:g.nome,atr:g.atr}));
    (L.truques||[]).forEach(k=>r.push({k,fonte:g.nome,atr:g.atr}));g.sempre.forEach(k=>r.push({k,fonte:g.nome,atr:g.atr,nota:k==="destruicaodivina"?"sempre preparada; 1× por descanso longo sem espaço":"sempre preparada"}));
    (L.prep||[]).forEach(k=>r.push({k,fonte:g.nome,atr:g.atr,nota:g.c==="mago"?"preparada (do grimório)":null}));
    if(g.c==="mago")grimorioDe(P).filter(k=>!(L.prep||[]).includes(k)).forEach(k=>r.push({k,fonte:"Grimório",atr:g.atr,nota:"no grimório, não preparada",naoPrep:1}))});
  Object.keys(pc).forEach(c=>{const s=subObj(P,c);if(!s||pc[c]<3)return;const a=atrConj(c);
    (s.magias||[]).forEach(k=>r.push({k,fonte:s.n,atr:a,nota:c==="barbaro"?"só como Ritual":"sempre preparada"}));
    if(c==="druida"&&subDe(P,c)==="terra"&&subEsc(P,c).terra)TERRAS[subEsc(P,c).terra][1].forEach(k=>r.push({k,fonte:"Círculo da Terra",atr:"SAB",nota:"sempre preparada (terra "+TERRAS[subEsc(P,c).terra][0]+")"}));
    if(c==="barbaro"&&subDe(P,c)==="coracao")["sentidobestial","falaranimais"].forEach(k=>r.push({k,fonte:s.n,atr:"SAB",nota:"só como Ritual"}));
    (s.truques||[]).forEach(([k,at])=>r.push({k,fonte:s.n,atr:at}))});
  (P.niveis||[]).forEach(n=>{const e=n.esc||{};(e.truquesEstilo||[]).forEach(k=>r.push({k,fonte:n.c==="paladino"?"Guerreiro Abençoado":"Guerreiro Druídico",atr:n.c==="paladino"?"CAR":"SAB"}))});
  const e=ES(P);if(e){(e.truques||[]).forEach(([k,a])=>r.push({k,fonte:e.n,atr:a==="legado"?(P.ee.atrMagia||"CAR"):a}));
    if(P.esp==="elfo"&&P.ee.linhagem)r.push({k:LINHAGEM_ELFO[P.ee.linhagem][2],fonte:"Linhagem Élfica",atr:P.ee.atrMagia||"INT"});
    if(P.esp==="elfo"&&P.ee.linhagem&&NV(P)>=3)r.push({k:{drow:"fogofadas",alto:"detectarmagia",floresta:"passoslargos"}[P.ee.linhagem],fonte:"Linhagem Élfica",atr:P.ee.atrMagia||"INT",nota:"1× por descanso longo sem espaço"});
    if(P.esp==="gnomo"&&P.ee.linhagem){LINHAGEM_GNOMO[P.ee.linhagem][2].forEach(k=>r.push({k,fonte:"Linhagem Gnômica",atr:P.ee.atrMagia||"INT"}));
      if(P.ee.linhagem==="floresta")r.push({k:"falaranimais",fonte:"Gnomo da Floresta",atr:P.ee.atrMagia||"INT",nota:"sempre preparada; sem espaço vezes = proficiência"})}
    if(P.esp==="tiferino"&&P.ee.legado){r.push({k:LEGADOS[P.ee.legado][2],fonte:"Legado Infernal",atr:P.ee.atrMagia||"CAR"});
      if(NV(P)>=3)r.push({k:{abissal:"raioadoecente",ctonico:"vidafalsa",infernal:"repreensao"}[P.ee.legado],fonte:"Legado Infernal",atr:P.ee.atrMagia||"CAR",nota:"1× por descanso longo sem espaço"})}}
  slotsTalento(P).forEach(s=>{if(s.k!=="iniciado")return;const t=P.tal[s.slot]||{};(t.truques||[]).forEach(k=>r.push({k,fonte:"Iniciado em Magia",atr:t.atr||"SAB"}));
    if(t.magia)r.push({k:t.magia,fonte:"Iniciado em Magia",atr:t.atr||"SAB",nota:"1× por descanso longo sem espaço"})});
  const iv=invocsDe(P);
  if(iv.includes("tomo")){(P.tomoT||[]).forEach(k=>r.push({k,fonte:"Pacto do Tomo",atr:"CAR"}));(P.tomoR||[]).forEach(k=>r.push({k,fonte:"Pacto do Tomo",atr:"CAR",nota:"ritual do Livro das Sombras"}));
    escs(P,"tomoT").flat().forEach(k=>r.push({k,fonte:"Pacto do Tomo",atr:"CAR"}));escs(P,"tomoR").flat().forEach(k=>r.push({k,fonte:"Pacto do Tomo",atr:"CAR",nota:"ritual do Livro das Sombras"}))}
  [["corrente","familiar","sem gastar espaço"],["sombras","armaduramago","em si mesmo, sem gastar espaço"],["mascara","disfarcar","sem gastar espaço"],["visoes","imagem","sem gastar espaço"],["salto","salto","em si mesmo, sem gastar espaço"],["vigor","vidafalsa","em si mesmo, sem espaço, PV máximos"]]
    .forEach(([i,k,nota])=>{if(iv.includes(i))r.push({k,fonte:"Invocação",atr:"CAR",nota})});
  const vist=new Set();return r.filter(x=>{if(!magia(x.k))return false;const id=x.k+"|"+x.fonte;if(vist.has(id))return false;vist.add(id);return true})}

/* ===== recursos ===== */
function recursos(P){const m=MOD(P),pb=pbP(P),r=[];const pc=niveisPorClasse(P),e=ES(P);
  const num=(v,c)=>v==="PB"?pb:v==="modCAR"?Math.max(1,m.CAR):v==="modSAB"?Math.max(1,m.SAB):v==="nivel"?pc[c]:v==="1+nivel"?1+pc[c]:v;
  Object.keys(pc).forEach(c=>{const cl=CLASSES[c],n=pc[c],suf=c===P.classe?"":"_"+c;
    cl.n1.forEach(f=>{if(!f.uso)return;let mx=num(f.uso.max,c);if(f.k==="furia")mx=FURIAS[n];if(f.k==="impor")mx=5*n;r.push({k:f.k+suf,n:f.n,max:mx,volta:f.uso.volta,reserva:f.uso.reserva,x:f.x})});
    for(let l=2;l<=n;l++)((NIVEIS[c]||{})[l]||[]).forEach(f=>{if(f.uso)r.push({k:f.k,n:f.n,max:num(f.uso.max,c),volta:f.uso.volta,x:f.x})});
    const s=subObj(P,c);if(s&&n>=3)s.tr.forEach(t=>{if(t[2])r.push({k:"sub_"+c+"_"+t[0],n:t[2].n||t[0],max:num(t[2].max,c),volta:t[2].volta,reserva:t[2].reserva,x:t[1]})})});
  if(e)e.tracos.forEach(t=>{if(t[2])r.push({k:"esp_"+t[0],n:t[0],max:num(t[2].max),volta:t[2].volta,x:t[1]})});
  if(P.esp==="golias"&&P.ee.gigante){const g=GIGANTES[P.ee.gigante];const i=r.findIndex(x=>x.n==="Ancestralidade Gigante");if(i>=0){r[i].n=g[0];r[i].x=g[1]+" Usos iguais ao bônus de proficiência por descanso longo."}}
  if(P.esp==="gnomo"&&P.ee.linhagem==="floresta")r.push({k:"esp_falar",n:"Falar com Animais (sem espaço)",max:pb,volta:"longo",x:"Gnomo da Floresta: conjura Falar com Animais sem espaço de magia, vezes iguais ao bônus de proficiência."});
  if(["elfo","tiferino"].includes(P.esp)&&NV(P)>=3)r.push({k:"esp_magia3",n:"Magia de nível 3 da espécie (sem espaço)",max:1,volta:"longo",x:"A magia que a espécie dá no nível 3 pode ser conjurada 1 vez sem espaço por descanso longo."});
  slotsTalento(P).forEach(s=>{const t=TALENTOS[s.k];if(t.uso)r.push({k:"tal_"+s.slot,n:"Pontos de Sorte",max:num(t.uso.max),volta:t.uso.volta,x:t.x});
    if(s.k==="iniciado"&&(P.tal[s.slot]||{}).magia)r.push({k:"ini_"+s.slot,n:nm(P.tal[s.slot].magia)+" (sem espaço)",max:1,volta:"longo",x:"Iniciado em Magia: conjura esta magia 1 vez sem espaço por descanso longo."})});
  return r}

/* ===== números ===== */
function pvMax(P){const c=CL(P);if(!c)return 0;const m=MOD(P);let v=c.dv+m.CON;(P.niveis||[]).forEach(n=>{v+=Math.max(1,(n.pv||0)+m.CON)});
  const nv=NV(P);if(P.esp==="anao")v+=nv;if(temTalento(P,"vigoroso"))v+=2*nv;const ns=nC(P,"feiticeiro");if(subDe(P,"feiticeiro")==="draconica"&&ns>=3)v+=3+(ns-3);return Math.max(1,v)}
function caCalc(P){const m=MOD(P),j=P.jogo||{},disp=armadurasDisp(P),tr=treinoArmadura(P),cs=classesDe(P);
  const corpo=j.arm!==undefined?j.arm:(disp.find(k=>k!=="escudo"&&tr.includes(armadura(k)[2]))||null);
  const escudo=j.escudo!==undefined?j.escudo:(disp.includes("escudo")&&tr.includes("escudo")&&!cs.includes("monge"));
  let base,txt;const a=corpo?armadura(corpo):null;
  if(a){const d=a[4]===null?m.DES:Math.min(a[4],m.DES);base=a[3]+d;txt=a[1]+" "+a[3]+(a[4]===0?"":" + DES "+sinal(d))}
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
  if(nC(P,"monge")>=2){const ca=caCalc(P);if(!ca.corpo&&!ca.escudo)d+=3}return d}
function visao(P){const e=ES(P);let v=!e?0:(P.esp==="elfo"&&P.ee.linhagem==="drow"?36:e.visao);
  classesDe(P).forEach(c=>{const s=subObj(P,c);if(s&&s.visaoMais&&nC(P,c)>=3)v=v?v+s.visaoMais:s.visaoMais});return v}
function resumoCurto(P){const pc=niveisPorClasse(P);const cs=Object.keys(pc).map(c=>{const s=subObj(P,c);return CLASSES[c].n+" "+pc[c]+(s?" ("+s.n+")":"")});
  return [cs.length?cs.join(" / "):null,ES(P)?ES(P).n:null,AN(P)?AN(P).n:null].filter(Boolean).join(" · ")}
function dadoFurtivo(P){const n=nC(P,"ladino");return n>=3?"2d6":"1d6"}
function ataques(P){const m=MOD(P),pb=pbP(P),out=[];const mon=nC(P,"monge")>0,mae=maestriasDe(P),est=estilosDe(P);
  itensEquip(P).itens.filter(i=>i.t==="a").forEach(i=>{const a=arma(i.k);const prof=profArma(P,i.k);
    const monk=mon&&a[3]==="C"&&(a[2]==="S"||a[6].includes("Leve"));
    let at=a[3]==="D"?m.DES:(a[6].includes("Acuidade")||monk)?Math.max(m.FOR,m.DES):m.FOR;
    let dado=a[4];if(monk&&(dado==="1d4"||dado==="1"))dado="1d6";
    let hit=at+(prof?pb:0)+(a[3]==="D"&&est.includes("arquearia")?2:0);
    const ver=(a[6].find(p=>p.startsWith("Versátil"))||"").match(/\((.*)\)/);
    out.push({k:"arma:"+i.k,n:a[1]+(i.q>1?" ×"+i.q:""),hit:sinal(hit),dano:dado+(at?" "+sinal(at):"")+" "+a[5]+(ver?" (duas mãos "+ver[1]+")":""),
      sub:[a[8]?"alcance "+a[8]:null,mae.includes(i.k)?"maestria: "+a[7]:null,!prof?"sem proficiência":null].filter(Boolean).join(" · ")})});
  if(subDe(P,"ladino")==="alma"&&nC(P,"ladino")>=3){const at=Math.max(m.FOR,m.DES);out.push({k:"psi",n:"Lâmina Psíquica",hit:sinal(at+pb),dano:"1d6 "+sinal(at)+" Psíquico",sub:"arremesso 18/36 m · maestria Irritar · Ação Bônus: 2ª lâmina 1d4"})}
  let dd="1",dm=m.FOR,nota="",hitU=m.FOR;
  if(mon){dd="1d6";dm=Math.max(m.FOR,m.DES);hitU=dm;nota="Artes Marciais: também como Ação Bônus"}
  else if(subDe(P,"bardo")==="danca"&&nC(P,"bardo")>=3){dd="d6 (Inspiração)";dm=m.DES;hitU=Math.max(m.FOR,m.DES);nota="Passos Deslumbrantes, sem armadura e escudo"}
  else if(est.includes("desarmado")){dd="1d6 (1d8 sem arma e escudo)";nota="Combate Desarmado"}else if(temTalento(P,"brigao")){dd="1d4";nota="Brigão de Taverna"}
  out.push({k:"desarmado",n:"Ataque Desarmado",hit:sinal(hitU+pb),dano:(dd==="1"?String(Math.max(1,1+dm)):dd+" "+sinal(dm))+" Contundente",sub:nota});
  magiasDe(P).forEach(x=>{const s=magia(x.k);if(!s||s[2]!==0||!s[12])return;const fx=s[12];const mm=m[x.atr]||0;
    if(fx[0]==="ataque")out.push({k:"mag:"+x.k,n:s[1],hit:sinal(mm+pb),dano:fx[1]+" "+fx[2],sub:"truque · "+x.fonte,mag:1});
    else if(ATR.includes(fx[0]))out.push({k:"mag:"+x.k,n:s[1],hit:"CD "+(8+pb+mm),dano:fx[1]+" "+fx[2],sub:"truque · resistência de "+ATR_N[fx[0]],mag:1})});
  return out}
function tracosDe(P){const t=[];const pc=niveisPorClasse(P),a=AN(P),e=ES(P);const est=estilosDe(P),iv=invocsDe(P);
  Object.keys(pc).forEach(c=>{const cl=CLASSES[c],n=pc[c],multi=c!==P.classe;
    cl.n1.forEach(f=>{let x=f.x;
      if(f.k==="estilo"){const s=multi?escs(P,"estilo").find(Boolean):P.estilo;if(s)x="**"+ESTILOS[s][0]+":** "+ESTILOS[s][1]}
      if(f.k==="ordem"&&ordemDe(P,c))x="**"+ORDEM_CLERIGO[ordemDe(P,c)][0]+":** "+ORDEM_CLERIGO[ordemDe(P,c)][1];
      if(f.k==="ordemprimal"&&ordemDe(P,c))x="**"+ORDEM_DRUIDA[ordemDe(P,c)][0]+":** "+ORDEM_DRUIDA[ordemDe(P,c)][1];
      if(f.k==="invocacoes"&&iv.length)x="Você tem "+iv.length+" Invocações Místicas.\n- **Escolhidas:** "+lista(iv.map(k=>(INVOCACOES[k]||INVOCACOES_N2[k])[0]))+".\n- **Detalhes:** toque em cada uma na lista de características.";
      if(f.k==="maestria"&&maestriasDe(P).length)x+="\n- **Escolhidas:** "+lista(maestriasDe(P).map(k=>arma(k)[1]))+".";
      if(f.k==="especializacao"&&especialDe(P).length)x+="\n- **Escolhidas:** "+lista(especialDe(P))+".";
      if(f.k==="furtivo")x=x.replace("+1d6","+"+dadoFurtivo(P));if(f.k==="furia")x=x.replace("**Usos:** 2.","**Usos:** "+FURIAS[n]+".");
      if(f.k==="impor")x=x.replace("(5 no nível 1)","("+5*n+" agora)");
      t.push({k:"cls:"+c+":"+f.k,n:f.n,de:cl.n+" 1"+(multi?" (multiclasse)":""),x})});
    for(let l=2;l<=n;l++)((NIVEIS[c]||{})[l]||[]).forEach(f=>{let x=f.x;
      if(f.k==="metamagia"){const mm=escs(P,"metamagia").flat();if(mm.length)x+="\n- **Escolhidas:** "+lista(mm.map(k=>METAMAGIAS[k][0]))+"."}
      if(f.k==="especializacao"||f.k==="explorador"||f.k==="erudito"){const ex=especialDe(P);if(ex.length)x+="\n- **Suas especializações:** "+lista(ex)+"."}
      if(f.k==="estilopal"||f.k==="estilopat"){const s=escs(P,f.k==="estilopal"?"estiloPal":"estiloPat")[0];if(s&&ESTILOS[s])x="**"+ESTILOS[s][0]+":** "+ESTILOS[s][1];else if(s)x=(s==="abencoado"?"Guerreiro Abençoado":"Guerreiro Druídico")+": você aprendeu 2 truques.\n- **Truques:** "+lista(escs(P,"truquesEstilo").flat().map(nm))+"."}
      if(f.k==="primal"&&escs(P,"perExtra")[0])x+="\n- **Escolhida:** "+escs(P,"perExtra")[0]+".";
      t.push({k:"cls:"+c+":"+f.k,n:f.n,de:cl.n+" "+l,x})});
    const s=subObj(P,c);if(s&&n>=3){const se=subEsc(P,c);s.tr.forEach(tr=>{let x=tr[1];
      if(tr[0]==="Superioridade em Combate"&&se.manobras)x+="\n- **Suas manobras:** "+lista(se.manobras.map(k=>MANOBRAS[k][0]))+".";
      if(tr[0]==="Estudante da Guerra"&&(se.ferr||se.per))x+="\n- **Escolhidas:** "+lista([se.ferr,...(se.per||[])].filter(Boolean))+".";
      if(tr[0]==="Magias do Círculo"&&se.terra)x+="\n- **Terra de agora:** "+TERRAS[se.terra][0]+".";
      if(tr[0]==="Companheiro Primal"&&se.fera)x+="\n- **Sua fera:** "+FERAS[se.fera][0]+".\n"+FERAS[se.fera][1].split("\n").map(l=>"  "+l).join("\n");
      if(tr[0]==="Presa do Caçador"&&se.presa)x+="\n- **Escolhida agora:** "+(se.presa==="colossos"?"Matador de Colossos":"Quebra-Hordas")+".";
      if(tr[0]==="Proficiências Extras"&&se.per)x+="\n- **Escolhidas:** "+lista(se.per)+".";if(tr[0]==="Glamour de Outro Mundo"&&se.per)x+="\n- **Escolhida:** "+lista(se.per)+".";
      if(tr[0].startsWith("Sábio d")&&se.escola)x+="\n- **No seu grimório:** "+lista(se.escola.map(nm))+".";
      t.push({k:"sub:"+c+":"+tr[0],n:tr[0],de:s.n,x})})}});
  iv.forEach(k=>{const d=INVOCACOES[k]||INVOCACOES_N2[k];if(d)t.push({k:"inv:"+k,n:d[0],de:"Invocação Mística",x:d[1]})});
  (subEsc(P,"guerreiro").manobras||[]).forEach(k=>t.push({k:"man:"+k,n:MANOBRAS[k][0],de:"Manobra",x:MANOBRAS[k][1]}));
  escs(P,"metamagia").flat().forEach(k=>t.push({k:"meta:"+k,n:METAMAGIAS[k][0],de:"Metamagia · "+METAMAGIAS[k][1]+" ponto"+(METAMAGIAS[k][1]>1?"s":""),x:METAMAGIAS[k][2]}));
  if(e)e.tracos.forEach(tr=>{let x=tr[1];if(tr[0]==="Ancestralidade Dracônica"&&P.ee.ancestral){const an=ANCESTRAIS.find(z=>z[0]===P.ee.ancestral);x="Seu dragão ancestral é "+an[0]+".\n- **Sopro:** dano de "+an[1]+".\n- **Resistência:** leva metade do dano de "+an[1]+"."}
    if(tr[0]==="Linhagem Élfica"&&P.ee.linhagem)x="Você é "+LINHAGEM_ELFO[P.ee.linhagem][0]+".\n"+LINHAGEM_ELFO[P.ee.linhagem][1];
    if(tr[0]==="Linhagem Gnômica"&&P.ee.linhagem)x="Você é "+LINHAGEM_GNOMO[P.ee.linhagem][0]+".\n"+LINHAGEM_GNOMO[P.ee.linhagem][1];
    if(tr[0]==="Ancestralidade Gigante"&&P.ee.gigante)x="Seu dom é "+GIGANTES[P.ee.gigante][0]+".\n"+GIGANTES[P.ee.gigante][1]+"\n- **Usos:** iguais ao bônus de proficiência. Voltam no descanso longo.";
    if(tr[0]==="Legado Infernal"&&P.ee.legado)x="Seu legado é "+LEGADOS[P.ee.legado][0]+".\n"+LEGADOS[P.ee.legado][1];
    if((tr[0]==="Sentidos Aguçados"||tr[0]==="Habilidoso")&&P.ee.per)x="Proficiência em "+P.ee.per+".";
    if(tr[0]==="Versátil"&&P.ee.talHum)x="Talento de Origem: "+TALENTOS[P.ee.talHum].n+".";
    t.push({k:"esp:"+tr[0],n:tr[0],de:e.n,x})});
  slotsTalento(P).forEach(s=>{const tl=TALENTOS[s.k],te=P.tal[s.slot]||{};let x=tl.x;
    if(s.k==="iniciado")x+="\n- **Sua lista:** "+(s.lista||te.lista||"—")+".\n- **Seu atributo:** "+(te.atr?ATR_N[te.atr]:"—")+".";
    if(["habilidoso","artifice","musico"].includes(s.k))x+="\n- **Escolhidas:** "+lista([...(te.per||[]),...(te.ferr||[])])+".";
    t.push({k:"tal:"+s.slot,n:tl.n+(s.lista?" ("+s.lista+")":""),de:{ant:"talento do antecedente",hum:"talento (Humano Versátil)",lic:"talento (Lições dos Primeiros)"}[s.slot],x})});
  return t}
function limparImportado(d){const P=Object.assign(novo(),d);P.img=null;["perClasse","especial","maestrias","ferrClasse","truques","prep","grim","tomoT","tomoR","idiomas","rol","niveis"].forEach(k=>{if(!Array.isArray(P[k]))P[k]=[]});
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
function opcao(id,sel,cab,det,onSel){const ab=sel||abertos[id];const o=el("div",{class:"op"+(sel?" on":"")});
  o.append(el("button",{class:"cab",type:"button","aria-expanded":String(!!ab),onclick:()=>{if(onSel&&!sel){abertos[id]=true;onSel()}else{abertos[id]=!ab;redesenhar()}}},cab));
  if(ab)o.append(el("div",{class:"det"},det()));return o}
function linhaMagia(s,on,dis,toggle){const id="mg:"+s[0];const ab=abertos[id];
  return el("div",{class:"op"+(on?" on":"")},el("div",{class:"mg",style:"padding:8px 11px"},el("input",{type:"checkbox",checked:on,disabled:dis&&!on,"aria-label":"Escolher "+s[1],onchange:toggle}),
    el("button",{type:"button",class:"cab",style:"padding:0",onclick:()=>{abertos[id]=!ab;redesenhar()}},el("b",{},s[1]),el("span",{},(s[2]?"nv "+s[2]+" · ":"")+(s[9]?"C ":"")+(s[10]?"R ":"")+s[5]),el("em",{},s[6]+" · "+s[8]))),
    ab?el("div",{class:"det"},el("p",{},s[11]),el("p",{class:"nota"},s[3]+" · componentes "+s[7]+(s[9]?" · Concentração":"")+(s[10]?" · pode ser Ritual":""))):null)}
function mostrar(t){tela=t;["inicio","criador","ficha","subir"].forEach(x=>{const e=$("#t-"+x);if(e)e.hidden=x!==t});window.scrollTo(0,0);
  if(t==="inicio")rInicio();if(t==="criador")rPasso();if(t==="ficha")rFicha();if(t==="subir")rSubir()}

function abaFicha(c,P){const m=MOD(P),f=atrFinal(P),pb=pbP(P),cl=CL(P),per=pericias(P),esp=new Set(especialDe(P)),ca=caCalc(P);
  c.append(el("div",{class:"cab-f"},P.img?el("div",{class:"foto"},el("img",{src:P.img,alt:""})):null,el("div",{class:"nome"},P.nome||"Sem nome"),el("div",{class:"cls"},"Nível "+NV(P)+" · "+resumoCurto(P)+(P.tend?" · "+TENDENCIAS.find(t=>t[0]===P.tend)[1]:""))));
  const per2=k=>m[SK.find(s=>s[0]===k)[1]]+(per.has(k)?pb:0)+(esp.has(k)?pb:0)+(!per.has(k)&&nC(P,"bardo")>=2?Math.floor(pb/2):0);
  c.append(el("div",{class:"stats"},el("button",{type:"button",onclick:()=>folhaCA(P)},el("b",{},String(ca.ca)),el("small",{},"CA")),el("div",{},el("b",{},sinal(iniciativa(P))),el("small",{},"Iniciativa")),
    el("div",{},el("b",{},metros(deslocamento(P))),el("small",{},"Deslocamento")),el("div",{},el("b",{},"+"+pb),el("small",{},"Proficiência")),el("div",{},el("b",{},String(10+per2("Percepção"))),el("small",{},"Percepção passiva")),
    el("div",{},el("b",{},visao(P)?metros(visao(P)):"—"),el("small",{},"Visão no escuro"))));
  c.append(secT("Atributos","toque para aumentar"),el("div",{class:"attrs"},...ATR.map(x=>{const pr=cl.salv.includes(x);return el("button",{type:"button",class:"attr","aria-label":ATR_N[x]+": tocar para aumentar",onclick:()=>folhaAtr(P,x)},el("small",{},ATR_N[x]),el("b",{},sinal(m[x])),el("span",{class:"v"},String(f[x])),
    el("span",{class:"sv"+(pr?" prof":"")},"Resist. "+sinal(m[x]+(pr?pb:0))+(pr?" ●":"")))})));
  c.append(secT("Perícias","negrito = treinada"),el("div",{class:"pericias"},...SK.map(([k,a])=>el("div",{class:per.has(k)?"prof":""},el("span",{},k+(esp.has(k)?" ★":"")),el("span",{},sinal(per2(k)))))));
  if(esp.size)c.append(el("p",{class:"nota"},"★ Especialização: soma a proficiência duas vezes."+(nC(P,"bardo")>=2?" Pau para Toda Obra já somado nas não treinadas.":"")));
  c.append(secT("Características","toque para ler"),el("ul",{class:"lista"},...tracosDe(P).map(t=>itemLista(t.n,t.de,null,()=>folha(t.n,t.de,[t.x])))));
  const fr=ferramentas(P);
  c.append(secT("Proficiências"),el("div",{class:"prosa"},el("p",{},el("b",{},"Armas: "),textoArmas(P)+"."),el("p",{},el("b",{},"Armaduras: "),textoArmad(P)+"."),
    fr.length?el("p",{},el("b",{},"Ferramentas: "),lista(fr)+"."):null,el("p",{},el("b",{},"Idiomas: "),lista(idiomasDe(P))+".")));
  const eq=itensEquip(P);const j=P.jogo;
  c.append(secT("Equipamento"),el("ul",{class:"res-l"},...eq.itens.map(i=>el("li",{},(i.q>1?i.q+" × ":"")+(i.t==="a"?arma(i.k)[1]:i.t==="r"?armadura(i.k)[1]:i.n)))),
    el("p",{},el("b",{},"Ouro: "),el("input",{type:"number",inputMode:"numeric",min:0,value:j.po!==undefined?j.po:eq.po,style:"width:110px","aria-label":"Peças de ouro",onchange:e=>{j.po=Math.max(0,Number(e.target.value)||0);gravar()}})," PO"),
    el("p",{class:"nota"},"Compras e itens novos: anote em Outras anotações, na aba Background."));
  const nv=NV(P);const box=el("div",{class:"linha"});
  if(nv<NIVEL_MAX)box.append(el("button",{class:"bt",type:"button",onclick:abrirSubir},"Subir para o nível "+(nv+1)));
  if(nv>1)box.append(el("button",{class:"bt sec",type:"button",onclick:e=>confirmar(e.currentTarget,()=>desfazerNivel(P))},"Desfazer nível "+nv));
  c.append(secT("Nível",nv+" de "+NIVEL_MAX+" nesta versão"),el("p",{class:"nota"},nv<NIVEL_MAX?"Suba quando o mestre liberar. Um nível por vez; o último pode ser desfeito.":"Nível máximo desta versão do criador. Os próximos níveis vêm depois."),box,
    (P.niveis||[]).length?el("p",{class:"nota"},"Vida por nível: "+P.niveis.map((n,i)=>"nível "+(i+2)+": "+CLASSES[n.c].n+", "+n.pv+(n.modo==="fixo"?" (fixo)":" (rolado)")+" + CON").join(" · ")):null);
  c.append(secT("Guardar a ficha"),el("p",{class:"nota"},"A ficha fica guardada neste aparelho. Para não perder, copie e mande para você mesmo ou para o mestre no WhatsApp. A imagem não vai junto no texto."),
    el("div",{class:"linha"},el("button",{class:"bt",type:"button",onclick:e=>copiarFicha(P,e.currentTarget)},"Copiar ficha"),el("button",{class:"bt sec",type:"button",onclick:e=>confirmar(e.currentTarget,()=>{delete DB.lista[P.id];DB.atual=null;gravar(true);mostrar("inicio")})},"Apagar personagem")),
    el("textarea",{id:"cod-manual",hidden:true,"aria-label":"Texto da ficha para copiar",style:"width:100%;margin-top:8px;min-height:90px;font-size:13px"}),el("p",{class:"nota",id:"st-copiar"}))}
function abaCombate(c,P){const m=MOD(P),pb=pbP(P),j=P.jogo;
  c.append(secT("Ataques","toque para detalhes"),el("ul",{class:"lista"},...ataques(P).map(a=>itemLista(a.n,a.hit+" · "+a.dano,a.sub,()=>{
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
      j.notaDesc="Forma Selvagem: +"+tmp+" PV temporários. Use as estatísticas da Besta escolhida (veja no livro).";salvarJogo()}},"Usar Forma Selvagem")))}
  box.append(el("div",{},el("span",{},el("b",{},"Inspiração Heroica"),el("span",{class:"d"},"gaste para rerrolar um dado")),
    el("button",{type:"button",class:"pip"+(j.insp?"":" gasto"),"aria-label":j.insp?"tem inspiração, tocar para gastar":"sem inspiração, tocar para ganhar",onclick:()=>{j.insp=!j.insp;salvarJogo()}})));
  c.append(box);
  const ms=magiasDe(P);if(ms.length){const cj=conjuradores(P);
    c.append(secT("Magias",cj.map(g=>(cj.length>1?g.nome+": ":"")+"CD "+(8+pb+m[g.atr])+" · ataque "+sinal(pb+m[g.atr])).join(" · ")));
    [0,1,2].forEach(nvl=>{const l=ms.filter(x=>magia(x.k)[2]===nvl);if(!l.length)return;
      c.append(el("p",{class:"nota"},nvl===0?"Truques":"Nível "+nvl),el("ul",{class:"lista"},...l.map(x=>itemLista(nm(x.k),magia(x.k)[5],x.fonte+(x.nota?" · "+x.nota:""),()=>folhaMagia(P,x.k,x),magia(x.k)[9]?"C":null))))})}
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
function abrirSubir(){const P=AT();if(NV(P)>=NIVEL_MAX)return;SUBIR={c:null,modo:"fixo",pv:null,esc:{},snap:JSON.stringify({truques:P.truques,prep:P.prep,grim:P.grim,magX:P.magX||{},lic:(P.tal||{}).lic||null,tomoT:P.tomoT,tomoR:P.tomoR})};abertos={};mostrar("subir")}
function restaurarSnap(P,snap){if(!snap)return;const s=JSON.parse(snap);P.truques=s.truques||[];P.prep=s.prep||[];P.grim=s.grim||[];P.magX=s.magX||{};P.tal=P.tal||{};if(s.lic)P.tal.lic=s.lic;else delete P.tal.lic;P.tomoT=s.tomoT||[];P.tomoR=s.tomoR||[]}
function cancelarSubir(){const P=AT();if(SUBIR)restaurarSnap(P,SUBIR.snap);SUBIR=null;gravar(true);mostrar("ficha")}
function comNivel(P){return SUBIR&&SUBIR.c?{...P,niveis:[...(P.niveis||[]),SUBIR]}:P}
function podeMulti(P,c){const f=atrFinal(P);const falta=[];const ok=grupos=>grupos.every(g=>g.some(a=>f[a]>=13));
  [...new Set([...classesDe(P),c])].forEach(k=>{if(!ok(MULTI_REQ[k]))falta.push(CLASSES[k].n+" pede "+MULTI_REQ[k].map(g=>g.map(a=>ATR_N[a]).join(" ou ")).join(" e ")+" 13")});return falta}
function ganhosDoNivel(P2,c,n){const out=[];const cl=CLASSES[c];
  if(n===1){out.push({n:"Multiclasse: "+cl.n,x:"Você ganha o Dado de Vida (d"+cl.dv+") e "+MULTI_GANHA[c].t+". Não ganha as resistências da classe."});cl.n1.forEach(f=>out.push(f))}
  else((NIVEIS[c]||{})[n]||[]).forEach(f=>out.push(f));
  if(n===3){const s=subObj(P2,c);out.push({n:"Subclasse de "+cl.n,x:s?s.n+": "+s.d:"Escolha a subclasse abaixo."});if(s)s.tr.forEach(t=>out.push({n:t[0],x:t[1]}))}
  return out}
/* lista de escolhas do nível: {t, r(c), ok()} */
function escolhasNivel(P){const L=SUBIR,c=L.c,P2=comNivel(P),n=nC(P2,c),cl=CLASSES[c],e=L.esc,out=[];const jaPer=()=>pericias(P2);
  const add=(t,r,ok)=>out.push({t,r,ok});
  if(n===1){const g=MULTI_GANHA[c];
    if(g.per){const de=g.per.de==="todas"?SK.map(s=>s[0]):cl.per.de;e.perMulti=e.perMulti||[];add("Perícia da multiclasse",b=>b.append(chips(de,e.perMulti,1,v=>{e.perMulti=v;mudou()},v=>jaPer().has(v)&&!e.perMulti.includes(v))),()=>e.perMulti.length<1?"escolher a perícia da multiclasse":null)}
    if(g.instr)add("Instrumento da multiclasse",b=>b.append(chips(INSTRUMENTOS,e.instrMulti?[e.instrMulti]:[],1,v=>{e.instrMulti=v[0]||null;mudou()})),()=>!e.instrMulti?"escolher o instrumento":null);
    if(c==="ladino")add("Gíria de Ladrão: mais 1 idioma",b=>b.append(chips([...IDIOMAS_PADRAO,...IDIOMAS_RAROS],e.idiomaRogue?[e.idiomaRogue]:[],1,v=>{e.idiomaRogue=v[0]||null;mudou()},v=>idiomasDe(P).includes(v))),()=>!e.idiomaRogue?"escolher o idioma do Ladino":null);
    cl.n1.forEach(f=>{
      if(f.esc==="ordem"||f.esc==="ordemprimal"){const o=f.esc==="ordem"?ORDEM_CLERIGO:ORDEM_DRUIDA;add(f.n,b=>Object.entries(o).forEach(([k,v])=>b.append(opcao("o:"+k,e.ordem===k,[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{e.ordem=k;mudou()}))),()=>!e.ordem?"escolher a ordem":null)}
      if(f.esc==="estilo")add(f.n,b=>Object.entries(ESTILOS).forEach(([k,v])=>b.append(opcao("s:"+k,e.estilo===k,[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{e.estilo=k;mudou()}))),()=>!e.estilo?"escolher o Estilo de Luta":null);
      if(f.esc==="invocacao")add(f.n,b=>Object.entries(INVOCACOES).forEach(([k,v])=>b.append(opcao("i:"+k,(e.invoc||[]).includes(k),[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{e.invoc=[k];mudou()}))),()=>!(e.invoc||[]).length?"escolher a Invocação":null);
      if(f.esc==="especial"){e.especial=e.especial||[];add("Especialização (Ladino)",b=>b.append(contador(e.especial.length,2,"escolhidas"),chips([...jaPer().keys()].filter(x=>!especialDe(P).includes(x)),e.especial,2,v=>{e.especial=v;mudou()})),()=>e.especial.length<2?"escolher 2 perícias para a Especialização":null)}});
    if(cl.maestria){e.maestrias=e.maestrias||[];const op=(c==="barbaro"?ARMAS.filter(a=>a[3]==="C"):c==="guerreiro"?ARMAS:ARMAS.filter(a=>profArma(P2,a[0]))).filter(a=>!maestriasDe(P).includes(a[0]));
      add("Maestria em Armas ("+cl.n+")",b=>b.append(contador(e.maestrias.length,cl.maestria,"escolhidas"),chips(op.map(a=>[a[0],a[1],a[7]]),e.maestrias,cl.maestria,v=>{e.maestrias=v;mudou()})),()=>e.maestrias.length<cl.maestria?"escolher as armas da maestria":null)}}
  ((NIVEIS[c]||{})[n]||[]).forEach(f=>{
    if(f.esc==="perExtra")add(f.n,b=>b.append(chips(CLASSES.barbaro.per.de,e.perExtra?[e.perExtra]:[],1,v=>{e.perExtra=v[0]||null;mudou()},v=>pericias(P).has(v))),()=>!e.perExtra?"escolher a perícia do Conhecimento Primal":null);
    if(f.esc==="especial2"){e.especial2=e.especial2||[];add(f.n,b=>b.append(contador(e.especial2.length,2,"escolhidas"),chips([...pericias(P).keys()].filter(x=>!especialDe(P).includes(x)||e.especial2.includes(x)),e.especial2,2,v=>{e.especial2=v;mudou()})),()=>e.especial2.length<2?"escolher 2 perícias para a Especialização":null)}
    if(f.esc==="explorador"){e.explorador=e.explorador||{per:null,idiomas:[]};const x=e.explorador;add(f.n,b=>b.append(el("p",{class:"cont"},"Especialização em:"),chips([...pericias(P).keys()].filter(k=>!especialDe(P).includes(k)||x.per===k),x.per?[x.per]:[],1,v=>{x.per=v[0]||null;mudou()}),
      el("p",{class:"cont"},"2 idiomas:"),chips([...IDIOMAS_PADRAO,...IDIOMAS_RAROS].filter(i=>!idiomasDe(P).includes(i)),x.idiomas,2,v=>{x.idiomas=v;mudou()})),()=>!x.per||x.idiomas.length<2?"fazer as escolhas do Explorador Hábil":null)}
    if(f.esc==="estiloPal"||f.esc==="estiloPat"){const key=f.esc,alt=key==="estiloPal"?["abencoado","Guerreiro Abençoado","2 truques de Clérigo, com Carisma","Clérigo"]:["druidico","Guerreiro Druídico","2 truques de Druida, com Sabedoria","Druida"];
      add(f.n,b=>{[[alt[0],[alt[1],alt[2]]],...Object.entries(ESTILOS).filter(([k])=>!estilosDe(P).includes(k))].forEach(([k,v])=>b.append(opcao("st:"+k,e[key]===k,[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{e[key]=k;e.truquesEstilo=[];mudou()})));
        if(e[key]===alt[0]){e.truquesEstilo=e.truquesEstilo||[];blocoEscolha(b,"2 truques de "+alt[3],null,listaClasse(alt[3],0).filter(s=>!jaConhece(P2,s[0],key==="estiloPal"?"Guerreiro Abençoado":"Guerreiro Druídico")||e.truquesEstilo.includes(s[0])),e.truquesEstilo,2,v=>e.truquesEstilo=v)}},
        ()=>!e[key]?"escolher o Estilo de Luta":(e[key]===alt[0]&&(e.truquesEstilo||[]).length<2)?"escolher os 2 truques":null)}
    if(f.esc==="metamagia"){e.metamagia=e.metamagia||[];add(f.n,b=>{b.append(contador(e.metamagia.length,2,"escolhidas"));Object.entries(METAMAGIAS).forEach(([k,v])=>b.append(opcao("mm:"+k,e.metamagia.includes(k),[el("b",{},v[0]),el("span",{},v[1]+" pt"),el("em",{},linha1(v[2]))],()=>[rico(v[2])],()=>{if(e.metamagia.length<2){e.metamagia=[...e.metamagia,k];mudou()}})));
      if(e.metamagia.length)b.append(el("button",{type:"button",class:"lnk",onclick:()=>{e.metamagia=[];mudou()}},"limpar escolhas"))},()=>e.metamagia.length<2?"escolher 2 Metamagias":null)}
    if(f.esc==="invoc"){e.invoc2=e.invoc2||[];const ja=invocsDe(P);const op={...INVOCACOES,...INVOCACOES_N2};
      add(f.n,b=>{b.append(contador(e.invoc2.length,2,"escolhidas"));Object.entries(op).filter(([k])=>!ja.includes(k)||k==="agonizante").forEach(([k,v])=>b.append(opcao("iv:"+k,e.invoc2.includes(k),[el("b",{},v[0]),el("span",{},INVOCACOES_N2[k]?"nível 2+":""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{if(e.invoc2.length<2){e.invoc2=[...e.invoc2,k];if(k==="licoes"){P.tal=P.tal||{};P.tal.lic={k:null}}mudou()}})));
        if(e.invoc2.length)b.append(el("button",{type:"button",class:"lnk",onclick:()=>{e.invoc2=[];if(P.tal)delete P.tal.lic;mudou()}},"limpar escolhas"));
        if(e.invoc2.includes("licoes")){const t=P.tal.lic=P.tal.lic||{k:null};b.append(el("p",{class:"cont"},"Lições dos Primeiros: talento de Origem"),chips(Object.entries(TALENTOS).map(([k,v])=>[k,v.n]),t.k?[t.k]:[],1,v=>{P.tal.lic={k:v[0]||null};mudou()},v=>temTalento(P,v)&&!["iniciado","habilidoso"].includes(v)));
          if(t.k)uiTalento(b,P,"lic")}
        if(e.invoc2.includes("tomo")){e.tomoT=e.tomoT||[];e.tomoR=e.tomoR||[];blocoEscolha(b,"Pacto do Tomo: 3 truques","De qualquer lista.",MAGIAS.filter(s=>s[2]===0),e.tomoT,3,v=>e.tomoT=v);blocoEscolha(b,"Pacto do Tomo: 2 rituais",null,MAGIAS.filter(s=>s[2]===1&&s[10]),e.tomoR,2,v=>e.tomoR=v)}},
        ()=>{if(e.invoc2.length<2)return "escolher 2 Invocações";
          if(e.invoc2.includes("licoes")){if(!(P.tal.lic||{}).k)return "escolher o talento de Lições dos Primeiros";const f=okTalento(P,"lic");if(f)return f}
          if(e.invoc2.includes("tomo")&&((e.tomoT||[]).length<3||(e.tomoR||[]).length<2))return "escolher as magias do Pacto do Tomo";return null})}
    if(f.esc==="erudito"){const op=["Arcanismo","História","Investigação","Medicina","Natureza","Religião"];add(f.n,b=>b.append(chips(op,e.erudito?[e.erudito]:[],1,v=>{e.erudito=v[0]||null;mudou()},v=>!pericias(P).has(v)||especialDe(P).includes(v))),()=>!e.erudito?"escolher a perícia do Erudito":null)}});
  if(n===3){const subs=SUBCLASSES[c];e.subEsc=e.subEsc||{};const se=e.subEsc;
    add("Subclasse",b=>Object.entries(subs).forEach(([k,s])=>b.append(opcao("sub:"+k,e.sub===k,[el("b",{},s.n),el("span",{},""),el("em",{},s.d)],()=>s.tr.map(t=>tr(t[0],t[1])),()=>{e.sub=k;e.subEsc={};mudou()}))),()=>!e.sub?"escolher a subclasse":null);
    const s=e.sub?subs[e.sub]:null;
    if(s&&s.esc==="manobras"){se.manobras=se.manobras||[];add("Manobras (3)",b=>{b.append(contador(se.manobras.length,3,"escolhidas"));Object.entries(MANOBRAS).forEach(([k,v])=>b.append(opcao("man:"+k,se.manobras.includes(k),[el("b",{},v[0]),el("span",{},""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],()=>{if(se.manobras.length<3){se.manobras=[...se.manobras,k];mudou()}})));
      if(se.manobras.length)b.append(el("button",{type:"button",class:"lnk",onclick:()=>{se.manobras=[];mudou()}},"limpar escolhas"))},()=>se.manobras.length<3?"escolher 3 manobras":null);
      add("Estudante da Guerra",b=>b.append(el("p",{class:"cont"},"Ferramenta de Artesão:"),chips(ARTESAO,se.ferr?[se.ferr]:[],1,v=>{se.ferr=v[0]||null;mudou()}),el("p",{class:"cont"},"Perícia do Guerreiro:"),chips(CLASSES.guerreiro.per.de,se.per||[],1,v=>{se.per=v;mudou()},v=>pericias(P).has(v))),
        ()=>!se.ferr||!(se.per||[]).length?"fazer as escolhas do Estudante da Guerra":null)}
    if(s&&s.esc==="terra")add("Tipo de terra (troca a cada descanso longo)",b=>b.append(chips(Object.entries(TERRAS).map(([k,v])=>[k,v[0]]),se.terra?[se.terra]:[],1,v=>{se.terra=v[0]||null;mudou()})),()=>!se.terra?"escolher o tipo de terra":null);
    if(s&&s.esc==="fera")add("Sua fera",b=>Object.entries(FERAS).forEach(([k,v])=>b.append(opcao("fe:"+k,se.fera===k,[el("b",{},v[0]),el("span",{},""),el("em",{},"")],()=>[rico(v[1])],()=>{se.fera=k;mudou()}))),()=>!se.fera?"escolher a fera":null);
    if(s&&s.esc==="presa")add("Presa do Caçador",b=>b.append(chips([["colossos","Matador de Colossos"],["hordas","Quebra-Hordas"]],se.presa?[se.presa]:[],1,v=>{se.presa=v[0]||null;mudou()})),()=>!se.presa?"escolher a Presa do Caçador":null);
    if(s&&s.per){se.per=se.per||[];const de=s.per.de==="todas"?SK.map(x=>x[0]):s.per.de;add("Perícias da subclasse",b=>b.append(contador(se.per.length,s.per.n,"escolhidas"),chips(de,se.per,s.per.n,v=>{se.per=v;mudou()},v=>pericias(P).has(v))),()=>se.per.length<s.per.n?"escolher as perícias da subclasse":null)}
    if(s&&s.escola){se.escola=se.escola||[];const op=MAGIAS.filter(m=>m[4].includes("Mago")&&m[3]===s.escola&&m[2]>=1&&m[2]<=2&&!grimorioDe(P).includes(m[0]));
      add("2 magias de "+s.escola+" grátis no grimório",b=>blocoEscolha(b,s.escola,null,op,se.escola,2,v=>se.escola=v),()=>se.escola.length<2?"escolher as 2 magias de "+s.escola:null)}}
  /* magias de cada conjurador que muda neste nível */
  const g=conjuradores(P2).find(x=>x.c===c);
  if(g){const Lc=magClasse(P,c);const ja=k=>jaConhece(P2,k,g.nome);const sub=g.tipo==="terco";
    if(g.truques)add("Truques de "+g.nome+(sub?" (de Mago)":""),b=>blocoEscolha(b,"Truques ("+g.truques+")",g.fixos&&g.fixos.length?"Mais "+lista(g.fixos.map(nm))+", que já vem.":null,listaClasse(g.lista,0).filter(s=>!(g.fixos||[]).includes(s[0])&&(!ja(s[0])||Lc.truques.includes(s[0]))),Lc.truques,g.truques,v=>Lc.truques=v,g.sugT),()=>Lc.truques.length<g.truques?"escolher os truques de "+g.nome:null);
    const nvs=s=>s[2]>=1&&s[2]<=g.maxNv;
    if(g.c==="mago"){add("Grimório ("+g.grimorio+" magias)",b=>blocoEscolha(b,"Magias do grimório","A cada nível de Mago entram 2 magias novas (até nível "+g.maxNv+").",listaClasse("Mago",1).concat(listaClasse("Mago",2)).filter(nvs),Lc.grim,g.grimorio,v=>{Lc.grim=v;Lc.prep=Lc.prep.filter(x=>grimorioDe(P2).includes(x))}),()=>Lc.grim.length<g.grimorio?"escolher as magias novas do grimório":null);
      add("Preparadas ("+g.prep+")",b=>blocoEscolha(b,"Preparadas do grimório",null,grimorioDe(P2).map(magia).filter(Boolean),Lc.prep,g.prep,v=>Lc.prep=v),()=>Lc.prep.length<g.prep?"preparar "+g.prep+" magias":null)}
    else add("Magias preparadas de "+g.nome+" ("+g.prep+")",b=>blocoEscolha(b,"Preparadas","Até magias de nível "+g.maxNv+". Você pode trocar as que já tinha.",MAGIAS.filter(s=>s[4].includes(g.lista)&&nvs(s)&&!g.sempre.includes(s[0])),Lc.prep,g.prep,v=>Lc.prep=v,g.sugP),()=>Lc.prep.length<g.prep?"escolher as magias preparadas de "+g.nome:null)}
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
    const o=opcao("c:"+k,sel,cab,()=>[],falta.length?null:()=>{if(L.c!==k){restaurarSnap(P,L.snap);Object.assign(L,{c:k,pv:null,modo:"fixo",esc:{}});abertos={}}L.verTodas=false;mudou()});
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

iniciar();
$("#sb-ok").onclick=confirmarNivel;$("#sb-voltar").onclick=cancelarSubir;
