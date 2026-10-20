/* ================= utilidades ================= */
const $=s=>document.querySelector(s);
function el(tag,attrs,...kids){const e=document.createElement(tag);for(const k in attrs||{}){const v=attrs[k];if(v===null||v===undefined||v===false)continue;
  if(k==="class")e.className=v;else if(k.startsWith("on"))e[k]=v;else if(k==="html")e.innerHTML=v;else if(k in e&&!k.includes("-"))e[k]=v;else e.setAttribute(k,v===true?"":v)}
  kids.flat(9).forEach(c=>{if(c===null||c===undefined||c===false)return;e.append(c.nodeType?c:document.createTextNode(String(c)))});return e}
const mod=v=>Math.floor((v-10)/2), sinal=n=>(n>=0?"+":"−")+Math.abs(n);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const nm=k=>{const m=magia(k);return m?m[1]:k};
const lista=a=>a.length<=1?a.join(""):a.slice(0,-1).join(", ")+" e "+a[a.length-1];
const metros=n=>String(n).replace(".",",")+" m";

/* ================= armazenamento (no aparelho) ================= */
const LS="criador-dnd-2024-v1";
let DB={lista:{},atual:null,rasc:null};
function carregar(){try{const t=localStorage.getItem(LS);if(t){const d=JSON.parse(t);if(d&&typeof d==="object")DB={lista:d.lista||{},atual:d.atual||null,rasc:d.rasc||null}}}catch(e){}}
let tGravar=null;
function gravar(ja){clearTimeout(tGravar);const f=()=>{try{localStorage.setItem(LS,JSON.stringify(DB))}catch(e){aviso("Não consegui guardar neste aparelho. Pode ser navegação privada ou memória cheia; use Copiar ficha para não perder.")}};if(ja)f();else tGravar=setTimeout(f,250)}
document.addEventListener("visibilitychange",()=>{if(document.hidden)gravar(true)});
function aviso(t){const a=$("#aviso-geral");if(a){a.textContent=t;a.hidden=!t}}

/* ================= personagem ================= */
function novo(){return {id:uid(),tipo:"dnd2024-pers",v:1,nome:"",jogador:"",classe:null,ant:null,esp:null,ee:{},tal:{},idiomas:[],idiomaExtra:null,
  metodo:"padrao",base:{FOR:null,DES:null,CON:null,INT:null,SAB:null,CAR:null},rol:[],bonus:{modo:"21",mais2:null,mais1:null},tend:null,
  perClasse:[],especial:[],estilo:null,ordem:null,invoc:null,maestrias:[],ferrClasse:[],ferrAnt:null,eqC:null,eqA:null,eqEsc:{},
  truques:[],prep:[],grim:[],tomoT:[],tomoR:[],jogo:null,bg:{historia:"",familia:"",intencoes:"",jeito:"",notas:""},img:null,criado:Date.now()}}
const CL=P=>P.classe?CLASSES[P.classe]:null, AN=P=>P.ant?ANTECEDENTES[P.ant]:null, ES=P=>P.esp?ESPECIES[P.esp]:null;
function slotsTalento(P){const s=[];const a=AN(P);if(a)s.push({slot:"ant",k:a.tal,lista:a.talOp||null});if(P.esp==="humano"&&P.ee.talHum)s.push({slot:"hum",k:P.ee.talHum,lista:null});return s}
function temTalento(P,k){return slotsTalento(P).some(s=>s.k===k)}
function bonusAtr(P){const a=AN(P),b={};if(!a)return b;
  if(P.bonus.modo==="111")a.atr.forEach(x=>b[x]=1);else{if(P.bonus.mais2)b[P.bonus.mais2]=2;if(P.bonus.mais1)b[P.bonus.mais1]=(b[P.bonus.mais1]||0)+1}return b}
function atrFinal(P){const b=bonusAtr(P),r={};ATR.forEach(x=>{r[x]=Math.min(20,(P.base[x]||8)+(b[x]||0)+(P.extras||[]).filter(k=>k===x).length)});return r}
function MOD(P){const a=atrFinal(P),m={};ATR.forEach(x=>m[x]=mod(a[x]));return m}
/* perícias: nome → fonte */
function periciasFixas(P){const m=new Map();const a=AN(P);if(a)a.per.forEach(p=>m.set(p,"antecedente"));
  if(P.ee.per)m.set(P.ee.per,P.esp==="humano"?"espécie (Habilidoso)":"espécie (Sentidos Aguçados)");return m}
function periciasTalentos(P){const m=new Map();slotsTalento(P).forEach(s=>{if(s.k==="habilidoso")((P.tal[s.slot]||{}).per||[]).forEach(p=>m.set(p,"talento Habilidoso"))});return m}
function pericias(P){const m=periciasFixas(P);P.perClasse.forEach(p=>m.set(p,"classe"));periciasTalentos(P).forEach((v,k)=>m.set(k,v));return m}
function ferramentas(P){const f=[];const a=AN(P),c=CL(P);
  if(a){if(typeof a.ferr==="string")f.push(a.ferr);else if(P.ferrAnt)f.push(P.ferrAnt)}
  if(c&&c.ferr){if(c.ferr.fixa)f.push(c.ferr.fixa);else f.push(...P.ferrClasse)}
  slotsTalento(P).forEach(s=>{const t=P.tal[s.slot]||{};if(["artifice","musico","habilidoso"].includes(s.k))f.push(...(t.ferr||[]))});
  return [...new Set(f)]}
function idiomasDe(P){const l=["Comum",...P.idiomas];const c=CL(P);if(P.classe==="ladino"){l.push("Gíria de Ladrão");if(P.idiomaExtra)l.push(P.idiomaExtra)}if(P.classe==="druida")l.push("Druídico");return [...new Set(l)]}
function marciais(P){const c=CL(P);return !!(c&&(c.armas.m||(P.classe==="clerigo"&&P.ordem==="protetor")||(P.classe==="druida"&&P.ordem==="guardiao")))}
function profArma(P,k){const c=CL(P),a=arma(k);if(!c||!a)return false;if(a[2]==="S")return true;if(marciais(P))return true;
  if(c.armas.mLeve&&a[3]==="C"&&a[6].includes("Leve"))return true;if(c.armas.mAcLeve&&(a[6].includes("Leve")||a[6].includes("Acuidade")))return true;return false}
function treinoArmadura(P){const c=CL(P);if(!c)return [];const l=[...c.armad];if(P.classe==="clerigo"&&P.ordem==="protetor")l.push("pesada");if(P.classe==="druida"&&P.ordem==="guardiao")l.push("media");return [...new Set(l)]}
function textoArmas(P){const c=CL(P);if(!c)return "";if(marciais(P)&&!c.armas.m)return "Simples e Marciais";return c.armasTxt}
function textoArmad(P){const t=treinoArmadura(P);if(!t.length)return "Nenhuma";const n={leve:"Leves",media:"Médias",pesada:"Pesadas",escudo:"Escudos"};
  const sem=t.filter(x=>x!=="escudo").map(x=>n[x]);return (sem.length?"Armaduras "+lista(sem):"")+(t.includes("escudo")?(sem.length?" e ":"")+"Escudos":"")}

/* ===== magias ===== */
function listaClasse(nome,nv){return MAGIAS.filter(m=>m[2]===nv&&m[4].includes(nome))}
function infoMagiaClasse(P){const c=CL(P);if(!c||!c.magia)return null;const g=c.magia;let tr=g.truques;
  if((P.classe==="clerigo"&&P.ordem==="taumaturgo")||(P.classe==="druida"&&P.ordem==="magico"))tr++;return {...g,truques:tr}}
function temMagias(P){return !!infoMagiaClasse(P)||slotsTalento(P).some(s=>s.k==="iniciado")||P.invoc==="tomo"}
/* todas as magias do personagem: [{k, fonte, atr, nota}] */
function magiasDe(P){const r=[];const g=infoMagiaClasse(P),c=CL(P);
  if(g){P.truques.forEach(k=>r.push({k,fonte:c.n,atr:g.atr}));
    (g.sempre||[]).forEach(k=>r.push({k,fonte:c.n,atr:g.atr,nota:"sempre preparada"}));
    P.prep.forEach(k=>r.push({k,fonte:c.n,atr:g.atr,nota:P.classe==="mago"?"preparada (do grimório)":null}));
    if(P.classe==="mago")P.grim.filter(k=>!P.prep.includes(k)).forEach(k=>r.push({k,fonte:"Grimório",atr:g.atr,nota:"no grimório, não preparada",naoPrep:1}))}
  const e=ES(P);if(e){(e.truques||[]).forEach(([k,a])=>r.push({k,fonte:e.n,atr:a==="legado"?(P.ee.atrMagia||"CAR"):a}));
    if(P.esp==="elfo"&&P.ee.linhagem)r.push({k:LINHAGEM_ELFO[P.ee.linhagem][2],fonte:"Linhagem Élfica",atr:P.ee.atrMagia||"INT"});
    if(P.esp==="gnomo"&&P.ee.linhagem){LINHAGEM_GNOMO[P.ee.linhagem][2].forEach(k=>r.push({k,fonte:"Linhagem Gnômica",atr:P.ee.atrMagia||"INT"}));
      if(P.ee.linhagem==="floresta")r.push({k:"falaranimais",fonte:"Gnomo da Floresta",atr:P.ee.atrMagia||"INT",nota:"sempre preparada; sem espaço vezes = proficiência"})}
    if(P.esp==="tiferino"&&P.ee.legado)r.push({k:LEGADOS[P.ee.legado][2],fonte:"Legado Infernal",atr:P.ee.atrMagia||"CAR"})}
  slotsTalento(P).forEach(s=>{if(s.k!=="iniciado")return;const t=P.tal[s.slot]||{};(t.truques||[]).forEach(k=>r.push({k,fonte:"Iniciado em Magia",atr:t.atr||"SAB"}));
    if(t.magia)r.push({k:t.magia,fonte:"Iniciado em Magia",atr:t.atr||"SAB",nota:"1× por descanso longo sem espaço"})});
  if(P.invoc==="tomo"){P.tomoT.forEach(k=>r.push({k,fonte:"Pacto do Tomo",atr:"CAR"}));P.tomoR.forEach(k=>r.push({k,fonte:"Pacto do Tomo",atr:"CAR",nota:"ritual do Livro das Sombras"}))}
  if(P.invoc==="corrente")r.push({k:"familiar",fonte:"Pacto da Corrente",atr:"CAR",nota:"sem gastar espaço"});
  if(P.invoc==="sombras")r.push({k:"armaduramago",fonte:"Armadura de Sombras",atr:"CAR",nota:"em si mesmo, sem gastar espaço"});
  const vist=new Set();return r.filter(x=>{const id=x.k+"|"+x.fonte;if(vist.has(id))return false;vist.add(id);return true})}
function jaConhece(P,k,exceto){return magiasDe(P).some(x=>x.k===k&&x.fonte!==exceto)}

/* ===== recursos (bolinhas) ===== */
function recursos(P){const m=MOD(P),pb=2,r=[];const c=CL(P),e=ES(P);const num=v=>v==="PB"?pb:v==="modCAR"?Math.max(1,m.CAR):v;
  if(c)c.n1.forEach(f=>{if(f.uso)r.push({k:f.k,n:f.n,max:num(f.uso.max),volta:f.uso.volta,reserva:f.uso.reserva,x:f.x})});
  if(e)e.tracos.forEach(t=>{if(t[2])r.push({k:"esp_"+t[0],n:t[0],max:num(t[2].max),volta:t[2].volta,x:t[1]})});
  if(P.esp==="golias"&&P.ee.gigante){const g=GIGANTES[P.ee.gigante];const i=r.findIndex(x=>x.n==="Ancestralidade Gigante");if(i>=0){r[i].n=g[0];r[i].x=g[1]+" Usos iguais ao bônus de proficiência por descanso longo."}}
  if(P.esp==="gnomo"&&P.ee.linhagem==="floresta")r.push({k:"esp_falar",n:"Falar com Animais (sem espaço)",max:pb,volta:"longo",x:"Gnomo da Floresta: conjura Falar com Animais sem espaço de magia, vezes iguais ao bônus de proficiência."});
  slotsTalento(P).forEach(s=>{const t=TALENTOS[s.k];if(t.uso)r.push({k:"tal_"+s.slot,n:"Pontos de Sorte",max:num(t.uso.max),volta:t.uso.volta,x:t.x});
    if(s.k==="iniciado"&&(P.tal[s.slot]||{}).magia)r.push({k:"ini_"+s.slot,n:nm(P.tal[s.slot].magia)+" (sem espaço)",max:1,volta:"longo",x:"Iniciado em Magia: conjura esta magia 1 vez sem espaço por descanso longo."})});
  return r}
function espacos(P){const g=infoMagiaClasse(P);return g?{n:g.espacos[0],pacto:!!g.pacto}:null}

/* ===== números da ficha ===== */
function pvMax(P){const c=CL(P);if(!c)return 0;const m=MOD(P);let v=c.dv+m.CON;if(P.esp==="anao")v+=1;if(temTalento(P,"vigoroso"))v+=2;return Math.max(1,v)}
function itensEquip(P){const out=[];let po=0;const c=CL(P),a=AN(P);
  const add=(lst)=>lst.forEach(it=>{if(it[0]==="a")out.push({t:"a",k:it[1],q:it[2]||1});else if(it[0]==="r")out.push({t:"r",k:it[1],q:1});else if(it[0]==="t")out.push({t:"t",n:it[1]});
    else if(it[0]==="esc"){const v=P.eqEsc[it[1]];out.push({t:"t",n:v||("("+(it[1]==="jogo"?"jogo à escolha":"instrumento à escolha")+")")})}
    else if(it[0]==="mesmo"){const v=it[1]==="ferrAnt"?P.ferrAnt:P.ferrClasse[0];out.push({t:"t",n:v||"(ferramenta escolhida)"})}});
  if(c&&P.eqC){if(P.eqC==="B")po+=c.equip.B;else{const o=c.equip[P.eqC];add(o.itens);po+=o.po}}
  if(a&&P.eqA){if(P.eqA==="B")po+=50;else{add(a.eq);po+=a.po}}
  const j=[];out.forEach(x=>{const y=j.find(z=>z.t===x.t&&(z.k||z.n)===(x.k||x.n));if(y)y.q+=x.q||1;else j.push({...x,q:x.q||1})});return {itens:j,po}}
function armadurasDisp(P){return itensEquip(P).itens.filter(i=>i.t==="r").map(i=>i.k)}
function caCalc(P){const m=MOD(P),j=P.jogo||{},disp=armadurasDisp(P),tr=treinoArmadura(P);
  const corpo=j.arm!==undefined?j.arm:(disp.find(k=>k!=="escudo"&&tr.includes(armadura(k)[2]))||null);
  const escudo=j.escudo!==undefined?j.escudo:(disp.includes("escudo")&&tr.includes("escudo")&&P.classe!=="monge");
  let base,txt;const a=corpo?armadura(corpo):null;
  if(a){const d=a[4]===null?m.DES:Math.min(a[4],m.DES);base=a[3]+d;txt=a[1]+" "+a[3]+(a[4]===0?"":" + DES "+sinal(d))}
  else if(P.classe==="barbaro"){base=10+m.DES+m.CON;txt="Defesa sem Armadura: 10 + DES "+sinal(m.DES)+" + CON "+sinal(m.CON)}
  else if(P.classe==="monge"&&!escudo){base=10+m.DES+m.SAB;txt="Defesa sem Armadura: 10 + DES "+sinal(m.DES)+" + SAB "+sinal(m.SAB)}
  else{base=10+m.DES;txt="Sem armadura: 10 + DES "+sinal(m.DES)}
  let ca=base;if(escudo){ca+=2;txt+=" + Escudo 2"}if(a&&P.estilo==="defesa"){ca+=1;txt+=" + Defesa 1"}
  return {ca,txt,corpo,escudo}}
function ataques(P){const m=MOD(P),pb=2,out=[];const c=CL(P);const mon=P.classe==="monge";
  itensEquip(P).itens.filter(i=>i.t==="a").forEach(i=>{const a=arma(i.k);const prof=profArma(P,i.k);
    const monk=mon&&a[3]==="C"&&(a[2]==="S"||a[6].includes("Leve"));
    let at=a[3]==="D"?m.DES:(a[6].includes("Acuidade")||monk)?Math.max(m.FOR,m.DES):m.FOR;
    let dado=a[4];if(monk&&(dado==="1d4"||dado==="1"))dado="1d6";
    let hit=at+(prof?pb:0)+(a[3]==="D"&&P.estilo==="arquearia"?2:0);
    const ver=(a[6].find(p=>p.startsWith("Versátil"))||"").match(/\((.*)\)/);
    out.push({k:"arma:"+i.k,n:a[1]+(i.q>1?" ×"+i.q:""),hit:sinal(hit),dano:dado+(at?" "+sinal(at):"")+" "+a[5]+(ver?" (duas mãos "+ver[1]+")":""),
      sub:[a[8]?"alcance "+a[8]:null,P.maestrias.includes(i.k)?"maestria: "+a[7]:null,!prof?"sem proficiência":null].filter(Boolean).join(" · ")})});
  let dd="1",dm=m.FOR,nota="";if(mon){dd="1d6";dm=Math.max(m.FOR,m.DES);nota="Artes Marciais: também como Ação Bônus"}
  else if(P.estilo==="desarmado"){dd="1d6 (1d8 sem arma e escudo)";nota="Combate Desarmado"}else if(temTalento(P,"brigao")){dd="1d4";nota="Brigão de Taverna"}
  out.push({k:"desarmado",n:"Ataque Desarmado",hit:sinal((mon?Math.max(m.FOR,m.DES):m.FOR)+pb),dano:(dd==="1"?String(Math.max(1,1+dm)):dd+" "+sinal(dm))+" Contundente",sub:nota});
  magiasDe(P).forEach(x=>{const s=magia(x.k);if(!s||s[2]!==0||!s[12])return;const fx=s[12];const mm=m[x.atr]||0;
    if(fx[0]==="ataque")out.push({k:"mag:"+x.k,n:s[1],hit:sinal(mm+pb),dano:fx[1]+" "+fx[2],sub:"truque",mag:1});
    else if(ATR.includes(fx[0]))out.push({k:"mag:"+x.k,n:s[1],hit:"CD "+(8+pb+mm),dano:fx[1]+" "+fx[2],sub:"truque · resistência de "+ATR_N[fx[0]],mag:1})});
  return out}
function tracosDe(P){const t=[];const c=CL(P),a=AN(P),e=ES(P);
  if(c)c.n1.forEach(f=>{let x=f.x;if(f.k==="estilo"&&P.estilo)x=ESTILOS[P.estilo][0]+": "+ESTILOS[P.estilo][1];if(f.k==="ordem"&&P.ordem)x=ORDEM_CLERIGO[P.ordem][0]+": "+ORDEM_CLERIGO[P.ordem][1];
    if(f.k==="ordemprimal"&&P.ordem)x=ORDEM_DRUIDA[P.ordem][0]+": "+ORDEM_DRUIDA[P.ordem][1];if(f.k==="invocacoes"&&P.invoc)x=INVOCACOES[P.invoc][0]+": "+INVOCACOES[P.invoc][1];
    if(f.k==="maestria"&&P.maestrias.length)x+=" Escolhidas: "+lista(P.maestrias.map(k=>arma(k)[1]))+".";if(f.k==="especializacao"&&P.especial.length)x+=" Escolhidas: "+lista(P.especial)+".";
    t.push({k:"cls:"+f.k,n:f.n,de:c.n+" 1",x})});
  if(e)e.tracos.forEach(tr=>{let x=tr[1];if(tr[0]==="Ancestralidade Dracônica"&&P.ee.ancestral){const an=ANCESTRAIS.find(z=>z[0]===P.ee.ancestral);x="Dragão "+an[0]+": dano de "+an[1]+" no sopro e resistência a "+an[1]+"."}
    if(tr[0]==="Linhagem Élfica"&&P.ee.linhagem)x=LINHAGEM_ELFO[P.ee.linhagem][0]+": "+LINHAGEM_ELFO[P.ee.linhagem][1];
    if(tr[0]==="Linhagem Gnômica"&&P.ee.linhagem)x=LINHAGEM_GNOMO[P.ee.linhagem][0]+": "+LINHAGEM_GNOMO[P.ee.linhagem][1];
    if(tr[0]==="Ancestralidade Gigante"&&P.ee.gigante)x=GIGANTES[P.ee.gigante][0]+": "+GIGANTES[P.ee.gigante][1]+" Usos iguais ao bônus de proficiência por descanso longo.";
    if(tr[0]==="Legado Infernal"&&P.ee.legado)x=LEGADOS[P.ee.legado][0]+": "+LEGADOS[P.ee.legado][1];
    if(tr[0]==="Sentidos Aguçados"&&P.ee.per)x="Proficiência em "+P.ee.per+".";if(tr[0]==="Habilidoso"&&P.ee.per)x="Proficiência em "+P.ee.per+".";
    if(tr[0]==="Versátil"&&P.ee.talHum)x="Talento de Origem: "+TALENTOS[P.ee.talHum].n+".";
    t.push({k:"esp:"+tr[0],n:tr[0],de:e.n,x})});
  slotsTalento(P).forEach(s=>{const tl=TALENTOS[s.k],te=P.tal[s.slot]||{};let x=tl.x;
    if(s.k==="iniciado")x+=" Lista: "+(s.lista||te.lista||"—")+"; atributo: "+(te.atr?ATR_N[te.atr]:"—")+".";
    if(["habilidoso","artifice","musico"].includes(s.k))x+=" Escolhidas: "+lista([...(te.per||[]),...(te.ferr||[])])+".";
    t.push({k:"tal:"+s.slot,n:tl.n+(s.lista?" ("+s.lista+")":""),de:s.slot==="ant"?"talento do antecedente":"talento (Humano Versátil)",x})});
  return t}
function deslocamento(P){const e=ES(P);if(!e)return 9;return P.esp==="elfo"&&P.ee.linhagem==="floresta"?10.5:e.desl}
function visao(P){const e=ES(P);if(!e)return 0;return P.esp==="elfo"&&P.ee.linhagem==="drow"?36:e.visao}
function resumoCurto(P){return [CL(P)?CL(P).n+" 1":null,ES(P)?ES(P).n:null,AN(P)?AN(P).n:null].filter(Boolean).join(" · ")}

/* ================= código para o WhatsApp ================= */
function b64(bytes){let s="";for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(s)}
function deB64(t){const s=atob(t),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b}
async function codificar(P){const o={...P};delete o.img;const bytes=new TextEncoder().encode(JSON.stringify(o));
  if(window.CompressionStream){try{const z=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer());return "FICHA2Z."+b64(z)}catch(e){}}
  return "FICHA2."+b64(bytes)}
async function decodificar(txt){const m=String(txt).replace(/\s+/g,"").match(/FICHA2(Z?)\.([A-Za-z0-9+/=]+)/);if(!m)throw new Error("sem código");
  let b=deB64(m[2]);if(m[1])b=new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
  const d=JSON.parse(new TextDecoder().decode(b));if(!d||d.tipo!=="dnd2024-pers"||!d.classe)throw new Error("não é ficha");return d}
function limparImportado(d){const P=Object.assign(novo(),d);P.img=null;["perClasse","especial","maestrias","ferrClasse","truques","prep","grim","tomoT","tomoR","idiomas","rol"].forEach(k=>{if(!Array.isArray(P[k]))P[k]=[]});
  if(!P.bg||typeof P.bg!=="object")P.bg=novo().bg;if(!P.jogo)P.jogo={pv:pvMax(P),temp:0,gastos:{}};return P}

/* ================= telas ================= */
let tela="inicio";
function mostrar(t){tela=t;["inicio","criador","ficha"].forEach(x=>$("#t-"+x).hidden=x!==t);window.scrollTo(0,0);
  if(t==="inicio")rInicio();if(t==="criador")rPasso();if(t==="ficha")rFicha()}

/* ---------- Personagens ---------- */
function rInicio(){const box=$("#lista-pers");box.textContent="";const ids=Object.keys(DB.lista).sort((a,b)=>(DB.lista[b].criado||0)-(DB.lista[a].criado||0));
  if(DB.rasc&&DB.rasc.classe)box.append(el("button",{class:"pc",onclick:()=>{passo=Math.min(DB.rasc._passo||0,PASSOS.length-1);abertos={};mostrar("criador")}},el("span",{class:"av"},"✎"),el("span",{},el("b",{},DB.rasc.nome||"Personagem em criação"),el("small",{},"continuar de onde parou · "+resumoCurto(DB.rasc))),el("span",{class:"mute"},"›")));
  ids.forEach(id=>{const P=DB.lista[id];box.append(el("button",{class:"pc",onclick:()=>{DB.atual=id;gravar();aba="ficha";mostrar("ficha")}},
    el("span",{class:"av"},P.img?el("img",{src:P.img,alt:""}):(P.nome||"?")[0]),el("span",{},el("b",{},P.nome||"Sem nome"),el("small",{},resumoCurto(P))),el("span",{class:"mute"},"›")))});
  if(!ids.length&&!(DB.rasc&&DB.rasc.classe))box.append(el("div",{class:"vazio"},"Nenhum personagem ainda. Toque em Criar personagem para começar."))}
function iniciarCriacao(){DB.rasc=novo();passo=0;abertos={};gravar();mostrar("criador")}

/* ---------- Criador (passo a passo) ---------- */
let passo=0,abertos={};
const R=()=>DB.rasc;
function mudou(){gravar();rPasso(true)}
const PASSOS=[
 {id:"classe",t:"Escolha a classe",r:rClasse,ok:P=>P.classe?null:"escolher uma classe"},
 {id:"ant",t:"Escolha o antecedente",r:rAnt,ok:P=>!P.ant?"escolher um antecedente":(AN(P).ferr.esc&&!P.ferrAnt)?"escolher a ferramenta do antecedente":null},
 {id:"esp",t:"Escolha a espécie",r:rEsp,ok:okEsp},
 {id:"idiomas",t:"Idiomas",r:rIdiomas,ok:P=>P.idiomas.length<2?"escolher 2 idiomas":(P.classe==="ladino"&&!P.idiomaExtra)?"escolher o idioma extra do Ladino":null},
 {id:"atr",t:"Atributos",r:rAtr,ok:okAtr},
 {id:"tend",t:"Tendência",r:rTend,ok:P=>P.tend?null:"escolher uma tendência"},
 {id:"per",t:"Perícias e ferramentas",r:rPer,ok:okPer},
 {id:"cls",t:"Escolhas da classe",r:rCls,ok:okCls,pular:P=>!temEscolhaClasse(P)},
 {id:"eq",t:"Equipamento",r:rEq,ok:okEq},
 {id:"mag",t:"Magias",r:rMag,ok:okMag,pular:P=>!temMagias(P)},
 {id:"nome",t:"Nome e detalhes",r:rNome,ok:P=>P.nome.trim()?null:"escrever o nome do personagem"}];
function visiveis(){return PASSOS.filter(p=>!(p.pular&&p.pular(R())))}
function rPasso(manter){const P=R();if(!P){mostrar("inicio");return}const vs=visiveis();let i=vs.indexOf(PASSOS[passo]);if(i<0){passo=PASSOS.indexOf(vs[Math.min(vs.length-1,0)]);i=0}
  const p=PASSOS[passo];$("#wz-t").textContent=p.t;const prox=vs[i+1];
  $("#wz-s").textContent="Passo "+(i+1)+" de "+vs.length+(prox?" · depois: "+prox.t.replace("Escolha a ","").replace("Escolha o ","").toLowerCase():"");
  $("#wz-prog").style.width=((i+1)/vs.length*100)+"%";
  const y=window.scrollY;const corpo=$("#wz-corpo");corpo.textContent="";p.r(corpo,P);if(manter)window.scrollTo(0,y);else window.scrollTo(0,0);
  const f=p.ok(P);$("#wz-falta").textContent=f?"Falta: "+f+".":"";$("#wz-prox").disabled=!!f;
  $("#wz-prox").textContent=prox?"Próximo":"Criar ficha";$("#wz-voltar").textContent=i===0?"Cancelar":"Voltar"}
function proximo(){const P=R(),vs=visiveis(),i=vs.indexOf(PASSOS[passo]);if(PASSOS[passo].ok(P))return;
  if(i<vs.length-1){passo=PASSOS.indexOf(vs[i+1]);P._passo=passo;gravar();rPasso()}else criarFicha()}
function voltar(){const vs=visiveis(),i=vs.indexOf(PASSOS[passo]);if(i<=0){gravar(true);mostrar("inicio");return}passo=PASSOS.indexOf(vs[i-1]);R()._passo=passo;gravar();rPasso()}
function criarFicha(){const P=R();P.jogo={pv:pvMax(P),temp:0,gastos:{},insp:P.esp==="humano"};delete P.jogo.arm;DB.lista[P.id]=P;DB.atual=P.id;DB.rasc=null;gravar(true);aba="ficha";mostrar("ficha")}

/* componentes do criador */
function opcao(id,sel,cab,det,onSel){const ab=sel||abertos[id];const o=el("div",{class:"op"+(sel?" on":"")});
  o.append(el("button",{class:"cab",type:"button","aria-expanded":String(!!ab),onclick:()=>{if(onSel&&!sel){onSel();abertos[id]=true}else abertos[id]=!ab;rPasso(true)}},cab));
  if(ab)o.append(el("div",{class:"det"},det()));return o}
function chips(opts,escolhidos,max,onTroca,desab){const box=el("div",{class:"chips"});opts.forEach(o=>{const [v,t,sub]=Array.isArray(o)?o:[o,o];const on=escolhidos.includes(v);
  const d=!on&&((desab&&desab(v))||(max>1&&escolhidos.length>=max));
  box.append(el("button",{type:"button",class:"chip"+(on?" on":""),disabled:d,"aria-pressed":String(on),onclick:()=>{let n;if(max===1)n=on?[]:[v];else n=on?escolhidos.filter(x=>x!==v):[...escolhidos,v];onTroca(n)}},t,sub?el("small",{}," "+sub):null))});return box}
function contador(n,de,txt){return el("span",{class:"cont"+(n>=de?" ok":"")},n+" de "+de+" "+txt)}
function tr(n,x){return el("div",{class:"tr"},el("b",{class:"tr-n"},n),rico(x))}

/* passo 1: classe */
function rClasse(c,P){c.append(el("p",{class:"nota"},"Toque numa classe para ver o que ela faz no nível 1. A classe é o que o personagem sabe fazer de melhor."));
  Object.entries(CLASSES).forEach(([k,cl])=>c.append(opcao("c:"+k,P.classe===k,[el("b",{},cl.n),el("span",{},"d"+cl.dv+" · "+cl.prim),el("em",{},cl.resumo)],()=>[
    tr("Dado de Vida","d"+cl.dv+" (PV no nível 1: "+cl.dv+" + Constituição)"),tr("Resistências",lista(cl.salv.map(x=>ATR_N[x]))),
    tr("Perícias",cl.per.de==="todas"?"escolha "+cl.per.n+" quaisquer":"escolha "+cl.per.n+": "+lista(cl.per.de)),tr("Armas",cl.armasTxt),
    tr("Armaduras",cl.armad.length?lista(cl.armad.map(x=>({leve:"Leves",media:"Médias",pesada:"Pesadas",escudo:"Escudos"})[x])):"nenhuma"),
    cl.ferr?tr("Ferramentas",cl.ferr.fixa||(cl.ferr.tipo==="instrumento"?"3 Instrumentos Musicais":"1 Ferramenta de Artesão ou Instrumento Musical")):null,
    cl.magia?tr("Magia",(cl.magia.truques?cl.magia.truques+" truques, ":"")+(cl.magia.grimorio?"grimório com 6 magias e ":"")+cl.magia.prep+" magias de nível 1 preparadas, usando "+ATR_N[cl.magia.atr]):null,
    el("p",{},el("b",{},"No nível 1:")),...cl.n1.map(f=>tr(f.n,f.x))],
    ()=>{if(P.classe!==k){Object.assign(P,{classe:k,perClasse:[],especial:[],estilo:null,ordem:null,invoc:null,maestrias:[],ferrClasse:[],eqC:null,truques:[],prep:[],grim:[],tomoT:[],tomoR:[],idiomaExtra:null});
      P.base={FOR:null,DES:null,CON:null,INT:null,SAB:null,CAR:null};abertos={};mudou()}})))}

/* passo 2: antecedente */
function rAnt(c,P){c.append(el("p",{class:"nota"},"O antecedente é o que o personagem fazia antes de se aventurar. Ele dá 3 atributos para os bônus, um talento, 2 perícias, uma ferramenta e equipamento."));
  Object.entries(ANTECEDENTES).forEach(([k,a])=>{const t=TALENTOS[a.tal];c.append(opcao("a:"+k,P.ant===k,[el("b",{},a.n),el("span",{},a.atr.join(" · ")),el("em",{},t.n+(a.talOp?" ("+a.talOp+")":"")+" · "+lista(a.per))],()=>[
    el("p",{},a.d),tr("Atributos para os bônus",lista(a.atr.map(x=>ATR_N[x]))),tr("Talento: "+t.n+(a.talOp?" ("+a.talOp+")":""),t.x),tr("Perícias",lista(a.per)),
    tr("Ferramenta",typeof a.ferr==="string"?a.ferr:{artesao:"uma Ferramenta de Artesão à escolha",instrumento:"um Instrumento Musical à escolha",jogo:"um Jogo à escolha"}[a.ferr.esc]),
    a.ferr.esc?el("div",{},el("p",{class:"cont"},"Escolha a ferramenta:"),chips({artesao:ARTESAO,instrumento:INSTRUMENTOS,jogo:JOGOS}[a.ferr.esc],P.ferrAnt?[P.ferrAnt]:[],1,n=>{P.ferrAnt=n[0]||null;mudou()})):null],
    ()=>{if(P.ant!==k){P.ant=k;P.ferrAnt=null;P.eqA=null;P.bonus={modo:"21",mais2:null,mais1:null};P.tal.ant={};P.perClasse=P.perClasse.filter(x=>!a.per.includes(x));mudou()}}))})}

/* passo 3: espécie */
function okEsp(P){const e=ES(P);if(!e)return "escolher uma espécie";const ee=P.ee;
  if(e.tam==="MP"&&!ee.tam)return "escolher o tamanho";
  if(e.esc==="ancestral"&&!ee.ancestral)return "escolher o dragão ancestral";
  if((e.esc==="linhagemElfo"||e.esc==="linhagemGnomo")&&!ee.linhagem)return "escolher a linhagem";
  if(e.esc==="gigante"&&!ee.gigante)return "escolher o dom de gigante";
  if(e.esc==="legado"&&!ee.legado)return "escolher o legado";
  if(["elfo","gnomo","tiferino"].includes(P.esp)&&!ee.atrMagia)return "escolher o atributo das magias da espécie";
  if(e.per&&!ee.per)return "escolher a perícia da espécie";
  if(e.talExtra&&!ee.talHum)return "escolher o talento de origem do Humano";return null}
function rEsp(c,P){c.append(el("p",{class:"nota"},"A espécie dá traços do corpo e da origem do personagem: tamanho, deslocamento, sentidos e habilidades especiais."));
  Object.entries(ESPECIES).forEach(([k,e])=>c.append(opcao("e:"+k,P.esp===k,[el("b",{},e.n),el("span",{},(e.tam==="MP"?"Médio ou Pequeno":e.tam==="M"?"Médio":"Pequeno")+" · "+metros(e.desl)),el("em",{},e.d)],()=>{
    const ee=P.ee,l=[...e.tracos.map(t=>tr(t[0],t[1]))];const fix=v=>{Object.assign(P.ee,v);mudou()};
    if(e.tam==="MP")l.push(el("p",{class:"cont"},"Tamanho:"),chips([["M","Médio"],["P","Pequeno"]],ee.tam?[ee.tam]:[],1,n=>fix({tam:n[0]||null})));
    if(e.esc==="ancestral")l.push(el("p",{class:"cont"},"Dragão ancestral (tipo de dano):"),chips(ANCESTRAIS.map(a=>[a[0],a[0],a[1]]),ee.ancestral?[ee.ancestral]:[],1,n=>fix({ancestral:n[0]||null})));
    if(e.esc==="linhagemElfo")l.push(el("p",{class:"cont"},"Linhagem:"),...Object.entries(LINHAGEM_ELFO).map(([lk,v])=>el("div",{},chips([[lk,v[0]]],ee.linhagem?[ee.linhagem]:[],1,n=>fix({linhagem:n[0]||null})),rico(v[1],"nota"))));
    if(e.esc==="linhagemGnomo")l.push(el("p",{class:"cont"},"Linhagem:"),...Object.entries(LINHAGEM_GNOMO).map(([lk,v])=>el("div",{},chips([[lk,v[0]]],ee.linhagem?[ee.linhagem]:[],1,n=>fix({linhagem:n[0]||null})),rico(v[1],"nota"))));
    if(e.esc==="gigante")l.push(el("p",{class:"cont"},"Dom de gigante:"),...Object.entries(GIGANTES).map(([gk,v])=>el("div",{},chips([[gk,v[0]]],ee.gigante?[ee.gigante]:[],1,n=>fix({gigante:n[0]||null})),rico(v[1],"nota"))));
    if(e.esc==="legado")l.push(el("p",{class:"cont"},"Legado:"),...Object.entries(LEGADOS).map(([gk,v])=>el("div",{},chips([[gk,v[0]]],ee.legado?[ee.legado]:[],1,n=>fix({legado:n[0]||null})),rico(v[1],"nota"))));
    if(["elfo","gnomo","tiferino"].includes(k))l.push(el("p",{class:"cont"},"Atributo para as magias da espécie:"),chips(["INT","SAB","CAR"].map(x=>[x,ATR_N[x]]),ee.atrMagia?[ee.atrMagia]:[],1,n=>fix({atrMagia:n[0]||null})));
    if(e.per){const ja=periciasFixas({...P,ee:{}});l.push(el("p",{class:"cont"},k==="elfo"?"Sentidos Aguçados: escolha 1 perícia":"Habilidoso: escolha 1 perícia"),
      chips(e.per.de==="todas"?SK.map(s=>s[0]):e.per.de,ee.per?[ee.per]:[],1,n=>{P.perClasse=P.perClasse.filter(x=>x!==n[0]);fix({per:n[0]||null})},v=>ja.has(v)))}
    if(e.talExtra)l.push(el("p",{class:"cont"},"Versátil: escolha um talento de Origem"),chips(Object.entries(TALENTOS).map(([tk,t])=>[tk,t.n]),ee.talHum?[ee.talHum]:[],1,n=>{P.ee.talHum=n[0]||null;P.tal.hum={};mudou()},
      v=>AN(P)&&AN(P).tal===v&&!["iniciado","habilidoso"].includes(v)),ee.talHum?rico(TALENTOS[ee.talHum].x,"nota"):null);
    return l},()=>{if(P.esp!==k){P.esp=k;P.ee={};P.tal.hum={};mudou()}})))}

/* passo 4: idiomas */
function rIdiomas(c,P){c.append(el("p",{class:"nota"},"Todo personagem fala Comum e mais 2 idiomas da lista padrão."));
  c.append(el("h3",{},"Já sabe"),el("p",{},lista(["Comum",...(P.classe==="ladino"?["Gíria de Ladrão"]:[]),...(P.classe==="druida"?["Druídico"]:[])])));
  c.append(el("h3",{},"Escolha 2"),contador(P.idiomas.length,2,"escolhidos"),chips(IDIOMAS_PADRAO,P.idiomas,2,n=>{P.idiomas=n;if(n.includes(P.idiomaExtra))P.idiomaExtra=null;mudou()}));
  if(P.classe==="ladino")c.append(el("h3",{},"Ladino: mais 1 idioma"),el("p",{class:"nota"},"A Gíria de Ladrão dá mais um idioma de qualquer lista."),chips([...IDIOMAS_PADRAO,...IDIOMAS_RAROS],P.idiomaExtra?[P.idiomaExtra]:[],1,n=>{P.idiomaExtra=n[0]||null;mudou()},v=>P.idiomas.includes(v)))}

/* passo 5: atributos */
function okAtr(P){if(ATR.some(x=>P.base[x]===null||P.base[x]===undefined))return P.metodo==="pontos"?"distribuir os pontos":P.metodo==="rolagem"?"escrever o total dos dados em cada atributo (de 3 a 18)":"colocar um valor em cada atributo";
  if(P.metodo==="pontos"){const g=ATR.reduce((s,x)=>s+CUSTO[P.base[x]],0);if(g>27)return "tirar pontos (passou de 27)"}
  if(P.bonus.modo==="21"&&(!P.bonus.mais2||!P.bonus.mais1))return "escolher onde vão o +2 e o +1";return null}
function valoresMetodo(P){return P.metodo==="padrao"?PADRAO:P.metodo==="rolagem"?P.rol:null}
function rAtr(c,P){const cl=CL(P),an=AN(P);
  c.append(el("p",{class:"nota"},"Escolha como gerar os números. O mestre pode preferir um método."),
    el("div",{class:"seg",role:"group","aria-label":"Método"},...[["padrao","Valores padrão"],["pontos","Compra de pontos"],["rolagem","Rolagem"]].map(([k,t])=>el("button",{type:"button",class:P.metodo===k?"on":"",onclick:()=>{if(P.metodo===k)return;P.metodo=k;
      P.base=k==="pontos"?{FOR:8,DES:8,CON:8,INT:8,SAB:8,CAR:8}:{FOR:null,DES:null,CON:null,INT:null,SAB:null,CAR:null};mudou()}},t))));
  if(P.metodo==="padrao"){c.append(el("p",{class:"nota"},"Os valores 15, 14, 13, 12, 10 e 8, um em cada atributo."),el("div",{class:"linha"},el("button",{class:"bt sec mini",type:"button",onclick:()=>{ATR.forEach((x,i)=>P.base[x]=cl.padrao[i]);mudou()}},"Usar a sugestão do livro para "+cl.n)))}
  if(P.metodo==="pontos"){const g=ATR.reduce((s,x)=>s+CUSTO[P.base[x]||8],0);c.append(el("p",{class:"nota"},"27 pontos. Todos começam em 8; de 8 a 15. Custo: 9=1, 10=2, 11=3, 12=4, 13=5, 14=7, 15=9."),el("p",{class:"cont"+(g===27?" ok":"")},"Pontos usados: "+g+" de 27"))}
  if(P.metodo==="rolagem")c.append(el("p",{class:"nota"},"Role os dados na mesa: 4d6, some os 3 maiores. Faça isso seis vezes e escreva cada total no atributo que quiser (de 3 a 18)."));
  const vals=valoresMetodo(P);const grade=el("div",{class:"atr-grade"});
  ATR.forEach(x=>{const v=P.base[x];const box=el("div",{class:"atr-c"},el("small",{},ATR_N[x]));
    if(P.metodo==="pontos"){const g=ATR.reduce((s,y)=>s+CUSTO[P.base[y]||8],0);
      box.append(el("b",{},String(v||8)),el("div",{class:"passo"},el("button",{type:"button","aria-label":"menos",disabled:(v||8)<=8,onclick:()=>{P.base[x]=(v||8)-1;mudou()}},"−"),
        el("button",{type:"button","aria-label":"mais",disabled:(v||8)>=15||g-CUSTO[v||8]+CUSTO[(v||8)+1]>27,onclick:()=>{P.base[x]=(v||8)+1;mudou()}},"+")))}
    else if(P.metodo==="rolagem"){box.append(el("input",{type:"number",inputMode:"numeric",min:3,max:18,value:v===null||v===undefined?"":v,placeholder:"–",style:"width:70px;text-align:center;font-size:20px","aria-label":ATR_N[x]+": total dos dados",
      onchange:e=>{const n=parseInt(e.target.value,10);P.base[x]=n>=3&&n<=18?n:null;mudou()}}))}
    else if(vals&&vals.length){const usados={};ATR.forEach(y=>{if(y!==x&&P.base[y]!==null)usados[P.base[y]]=(usados[P.base[y]]||0)+1});
      const cont={};vals.forEach(n=>cont[n]=(cont[n]||0)+1);
      const sel=el("select",{"aria-label":ATR_N[x],onchange:e=>{P.base[x]=e.target.value===""?null:Number(e.target.value);mudou()}},el("option",{value:""},"—"));
      [...new Set(vals)].forEach(n=>{const livre=(cont[n]||0)-(usados[n]||0);if(livre>0||v===n)sel.append(el("option",{value:n,selected:v===n},String(n)))});
      box.append(el("b",{},v===null?"–":String(v)),sel)}
    else box.append(el("b",{},"–"));grade.append(box)});
  c.append(grade);
  if(an){c.append(el("h3",{},"Bônus do antecedente ("+an.n+")"),el("p",{class:"nota"},"Nos atributos "+lista(an.atr.map(x=>ATR_N[x]))+": +2 em um e +1 em outro, ou +1 nos três. Nenhum passa de 20."),
    el("div",{class:"seg"},...[["21","+2 e +1"],["111","+1 nos três"]].map(([k,t])=>el("button",{type:"button",class:P.bonus.modo===k?"on":"",onclick:()=>{P.bonus={modo:k,mais2:null,mais1:null};mudou()}},t))));
    if(P.bonus.modo==="21"){c.append(el("p",{class:"cont"},"+2 em:"),chips(an.atr.map(x=>[x,ATR_N[x]]),P.bonus.mais2?[P.bonus.mais2]:[],1,n=>{P.bonus.mais2=n[0]||null;if(P.bonus.mais1===P.bonus.mais2)P.bonus.mais1=null;mudou()}),
      el("p",{class:"cont"},"+1 em:"),chips(an.atr.map(x=>[x,ATR_N[x]]),P.bonus.mais1?[P.bonus.mais1]:[],1,n=>{P.bonus.mais1=n[0]||null;mudou()},v=>v===P.bonus.mais2))}
    if(!ATR.some(x=>P.base[x]===null)){const f=atrFinal(P);c.append(el("h3",{},"Resultado"),el("div",{class:"atr-grade"},...ATR.map(x=>el("div",{class:"atr-c"},el("small",{},ATR_N[x]),el("b",{},sinal(mod(f[x]))),el("span",{},String(f[x]))))))}}}

/* passo 6: tendência */
function rTend(c,P){c.append(el("p",{class:"nota"},"Tendência resume a bússola moral do personagem: ordem ou liberdade, bem ou mal. O livro supõe personagens não malignos; fale com o mestre antes de escolher uma tendência má."),
  chips(TENDENCIAS.map(t=>[t[0],t[1]]),P.tend?[P.tend]:[],1,n=>{P.tend=n[0]||null;mudou()}))}

/* passo 7: perícias e ferramentas */
function precisaFerrTal(P){return slotsTalento(P).filter(s=>["habilidoso","artifice","musico"].includes(s.k))}
function okPer(P){const c=CL(P);if(P.perClasse.length<c.per.n)return "escolher "+c.per.n+" perícias da classe";
  if(c.ferr&&c.ferr.n&&P.ferrClasse.length<c.ferr.n)return "escolher as ferramentas da classe";
  for(const s of precisaFerrTal(P)){const t=P.tal[s.slot]||{};const n=((t.per||[]).length+(t.ferr||[]).length);if(n<3)return "fazer as escolhas do talento "+TALENTOS[s.k].n}return null}
function rPer(c,P){const cl=CL(P);const fix=periciasFixas(P),tal=periciasTalentos(P);
  c.append(el("h3",{},"Já tem"),el("p",{},fix.size?lista([...fix].map(([k,v])=>k+" ("+v+")")):"Nenhuma ainda."));
  const de=cl.per.de==="todas"?SK.map(s=>s[0]):cl.per.de;
  c.append(el("h3",{},"Perícias do "+cl.n),contador(P.perClasse.length,cl.per.n,"escolhidas"),chips(de.map(p=>[p,p,SK.find(s=>s[0]===p)[1]]),P.perClasse,cl.per.n,n=>{P.perClasse=n;P.especial=P.especial.filter(x=>pericias(P).has(x));mudou()},v=>fix.has(v)||tal.has(v)));
  if(cl.ferr&&cl.ferr.n){const op=cl.ferr.tipo==="instrumento"?INSTRUMENTOS:[...ARTESAO,...INSTRUMENTOS];
    c.append(el("h3",{},cl.ferr.tipo==="instrumento"?"Instrumentos do Bardo":"Ferramenta do Monge"),el("p",{class:"nota"},cl.ferr.tipo==="instrumento"?"Escolha 3 Instrumentos Musicais.":"Escolha 1 Ferramenta de Artesão ou 1 Instrumento Musical."),
      contador(P.ferrClasse.length,cl.ferr.n,"escolhidas"),chips(op,P.ferrClasse,cl.ferr.n,n=>{P.ferrClasse=n;mudou()}))}
  precisaFerrTal(P).forEach(s=>{const t=P.tal[s.slot]=P.tal[s.slot]||{};const tl=TALENTOS[s.k];t.per=t.per||[];t.ferr=t.ferr||[];const tot=t.per.length+t.ferr.length;
    c.append(el("h3",{},"Talento "+tl.n),rico(tl.x,"nota"),contador(tot,3,"escolhidas"));
    if(s.k==="habilidoso"){const ja=new Map([...fix,...P.perClasse.map(p=>[p,"classe"])]);
      c.append(el("p",{class:"cont"},"Perícias:"),chips(SK.map(x=>x[0]),t.per,99,n=>{if(n.length+t.ferr.length>3)return;t.per=n;mudou()},v=>ja.has(v)||(!t.per.includes(v)&&tot>=3)||[...periciasTalentos(P)].some(([k,f])=>k===v&&!t.per.includes(v))),
        el("p",{class:"cont"},"Ou ferramentas:"),chips(TODAS_FERR,t.ferr,99,n=>{if(n.length+t.per.length>3)return;t.ferr=n;mudou()},v=>!t.ferr.includes(v)&&tot>=3))}
    else c.append(chips(s.k==="artifice"?ARTESAO:INSTRUMENTOS,t.ferr,3,n=>{t.ferr=n;mudou()}))})}

/* passo 8: escolhas da classe */
function temEscolhaClasse(P){const c=CL(P);return !!c&&(c.maestria>0||c.n1.some(f=>f.esc))}
function armasMaestria(P){const c=CL(P);if(P.classe==="barbaro")return ARMAS.filter(a=>a[3]==="C");if(P.classe==="guerreiro")return ARMAS;return ARMAS.filter(a=>profArma(P,a[0]))}
function okCls(P){const c=CL(P);if(c.maestria&&P.maestrias.length<c.maestria)return "escolher "+c.maestria+" armas para a maestria";
  for(const f of c.n1){if(f.esc==="estilo"&&!P.estilo)return "escolher o Estilo de Luta";if((f.esc==="ordem"||f.esc==="ordemprimal")&&!P.ordem)return "escolher a ordem";
    if(f.esc==="invocacao"&&!P.invoc)return "escolher a Invocação Mística";if(f.esc==="especial"&&P.especial.length<2)return "escolher 2 perícias para a Especialização"}return null}
function rCls(c,P){const cl=CL(P);
  cl.n1.forEach(f=>{if(!f.esc)return;c.append(el("h3",{},f.n));
    const lst=f.esc==="estilo"?ESTILOS:f.esc==="ordem"?ORDEM_CLERIGO:f.esc==="ordemprimal"?ORDEM_DRUIDA:f.esc==="invocacao"?INVOCACOES:null;
    if(lst){const cur=f.esc==="estilo"?P.estilo:f.esc==="invocacao"?P.invoc:P.ordem;
      Object.entries(lst).forEach(([k,v])=>c.append(opcao("x:"+k,cur===k,[el("b",{},v[0]),el("span",{},k==="defesa"&&f.esc==="estilo"?"sugerido":""),el("em",{},linha1(v[1]))],()=>[rico(v[1])],
        ()=>{if(f.esc==="estilo")P.estilo=k;else if(f.esc==="invocacao"){P.invoc=k;P.tomoT=[];P.tomoR=[]}else{P.ordem=k;P.truques=[]}mudou()})))}
    if(f.esc==="especial"){const tem=[...pericias(P).keys()];c.append(el("p",{class:"nota"},f.x),contador(P.especial.length,2,"escolhidas"),chips(tem,P.especial,2,n=>{P.especial=n;mudou()}))}});
  if(cl.maestria){const op=armasMaestria(P);c.append(el("h3",{},"Maestria em Armas"),el("p",{class:"nota"},"Escolha "+cl.maestria+" tipos de arma. Toque numa escolhida para ver o efeito."),contador(P.maestrias.length,cl.maestria,"escolhidas"),
    chips(op.map(a=>[a[0],a[1],a[7]]),P.maestrias,cl.maestria,n=>{P.maestrias=n;mudou()}),
    ...[...new Set(P.maestrias.map(k=>arma(k)[7]))].map(m=>el("p",{class:"nota"},m+": "+MAESTRIA[m])))}}

/* passo 9: equipamento */
function precisaEsc(P){const out=[];const c=CL(P),a=AN(P);const ver=l=>l.forEach(it=>{if(it[0]==="esc")out.push(it[1])});
  if(c&&P.eqC&&P.eqC!=="B")ver(c.equip[P.eqC].itens);if(a&&P.eqA==="A")ver(a.eq);return [...new Set(out)]}
function okEq(P){if(!P.eqC)return "escolher o equipamento da classe";if(!P.eqA)return "escolher o equipamento do antecedente";for(const e of precisaEsc(P))if(!P.eqEsc[e])return "escolher o "+(e==="jogo"?"jogo":"instrumento");return null}
function txtItens(P,lst){return lista(lst.map(it=>it[0]==="a"?(it[2]>1?it[2]+" ":"")+arma(it[1])[1]+(it[2]>1?"s":""):it[0]==="r"?armadura(it[1])[1]:it[0]==="t"?it[1]:it[0]==="esc"?(it[1]==="jogo"?"um Jogo à escolha":"um Instrumento Musical à escolha"):it[1]==="ferrAnt"?(P.ferrAnt||"a ferramenta escolhida"):(P.ferrClasse[0]||"a ferramenta escolhida")))}
function rEq(c,P){const cl=CL(P),an=AN(P);
  c.append(el("h3",{},"Da classe ("+cl.n+")"));
  [["A","Opção A"],["A2","Opção B"],["B","Só ouro"]].forEach(([k,t])=>{if(!cl.equip[k])return;const o=cl.equip[k];
    c.append(opcao("eqc:"+k,P.eqC===k,[el("b",{},k==="B"?(cl.equip.A2?"Opção C":"Opção B")+": "+o+" PO":t),el("span",{},k==="B"?"compre o seu":o.po+" PO"),el("em",{},k==="B"?"Você recebe só o ouro e compra o que quiser.":txtItens(P,o.itens))],()=>[],()=>{P.eqC=k;mudou()}))});
  c.append(el("h3",{},"Do antecedente ("+an.n+")"),
    opcao("eqa:A",P.eqA==="A",[el("b",{},"Opção A"),el("span",{},an.po+" PO"),el("em",{},txtItens(P,an.eq))],()=>[],()=>{P.eqA="A";mudou()}),
    opcao("eqa:B",P.eqA==="B",[el("b",{},"Opção B: 50 PO"),el("span",{},"compre o seu"),el("em",{},"Você recebe só o ouro.")],()=>[],()=>{P.eqA="B";mudou()}));
  precisaEsc(P).forEach(e=>c.append(el("h3",{},e==="jogo"?"Escolha o jogo":"Escolha o instrumento"),chips(e==="jogo"?JOGOS:INSTRUMENTOS,P.eqEsc[e]?[P.eqEsc[e]]:[],1,n=>{P.eqEsc[e]=n[0]||null;mudou()})));
  if(P.eqC&&P.eqA){const r=itensEquip(P);c.append(el("h3",{},"Vai levar"),el("ul",{class:"res-l"},...r.itens.map(i=>el("li",{},(i.q>1?i.q+" × ":"")+(i.t==="a"?arma(i.k)[1]:i.t==="r"?armadura(i.k)[1]:i.n))),el("li",{},el("b",{},r.po+" PO"))),
    el("p",{class:"nota"},"Com ouro, combine com o mestre o que comprar; na ficha você pode anotar as compras."))}}

/* passo 10: magias */
function okMag(P){const g=infoMagiaClasse(P);if(g){if(P.truques.length<g.truques)return "escolher "+g.truques+" truques";
    if(g.grimorio){if(P.grim.length<g.grimorio)return "escolher as 6 magias do grimório";if(P.prep.length<g.prep)return "preparar 4 magias do grimório"}
    else if(P.prep.length<g.prep)return "escolher "+g.prep+" magias de nível 1"}
  for(const s of slotsTalento(P)){if(s.k!=="iniciado")continue;const t=P.tal[s.slot]||{};if(!s.lista&&!t.lista)return "escolher a lista do Iniciado em Magia";
    if(!t.atr)return "escolher o atributo do Iniciado em Magia";if((t.truques||[]).length<2)return "escolher os 2 truques do Iniciado em Magia";if(!t.magia)return "escolher a magia de nível 1 do Iniciado em Magia"}
  if(P.invoc==="tomo"&&(P.tomoT.length<3||P.tomoR.length<2))return "escolher os truques e rituais do Pacto do Tomo";return null}
function linhaMagia(s,on,dis,toggle){const id="mg:"+s[0];const ab=abertos[id];
  return el("div",{class:"op"+(on?" on":"")},el("div",{class:"mg",style:"padding:8px 11px"},el("input",{type:"checkbox",checked:on,disabled:dis&&!on,"aria-label":"Escolher "+s[1],onchange:toggle}),
    el("button",{type:"button",class:"cab",style:"padding:0",onclick:()=>{abertos[id]=!ab;rPasso(true)}},el("b",{},s[1]),el("span",{},(s[9]?"C ":"")+(s[10]?"R ":"")+s[5]),el("em",{},s[6]+" · "+s[8]))),
    ab?el("div",{class:"det"},rico(s[11]),el("p",{class:"nota"},s[3]+" · componentes "+s[7]+(s[9]?" · Concentração":"")+(s[10]?" · pode ser Ritual":""))):null)}
function blocoEscolha(c,titulo,nota,opcoes,arr,max,set,sug){c.append(el("h3",{},titulo));if(nota)c.append(el("p",{class:"nota"},nota));
  const linha=el("div",{class:"linha"},contador(arr.length,max,"escolhidas"));
  if(sug&&sug.length&&sug.every(k=>opcoes.some(s=>s[0]===k)))linha.append(el("button",{type:"button",class:"lnk",onclick:()=>{set(sug.slice(0,max));mudou()}},"usar as sugeridas pelo livro"));
  c.append(linha);opcoes.forEach(s=>{const on=arr.includes(s[0]);c.append(linhaMagia(s,on,arr.length>=max,()=>{set(on?arr.filter(x=>x!==s[0]):[...arr,s[0]]);mudou()}))})}
function rMag(c,P){const g=infoMagiaClasse(P),cl=CL(P);
  c.append(el("p",{class:"nota"},"Toque no nome para ler o que a magia faz. C = Concentração · R = pode ser Ritual."));
  if(g){const outras=k=>jaConhece(P,k,cl.n);
    if(g.truques)blocoEscolha(c,"Truques de "+cl.n,"Truques não gastam espaço de magia.",listaClasse(g.lista,0).filter(s=>!outras(s[0])||P.truques.includes(s[0])),P.truques,g.truques,v=>P.truques=v,g.sugT);
    if(g.sempre)c.append(el("p",{class:"nota"},"Sempre preparada: "+lista(g.sempre.map(nm))+"."));
    const nv1=listaClasse(g.lista,1).filter(s=>!(g.sempre||[]).includes(s[0]));
    if(g.grimorio){blocoEscolha(c,"Grimório (6 magias de nível 1)","Seu livro começa com 6 magias; você prepara 4 delas por dia.",nv1,P.grim,g.grimorio,v=>{P.grim=v;P.prep=P.prep.filter(x=>v.includes(x))},g.sugG);
      if(P.grim.length)blocoEscolha(c,"Preparadas hoje (4 do grimório)",null,nv1.filter(s=>P.grim.includes(s[0])),P.prep,g.prep,v=>P.prep=v,g.sugG.slice(0,4).filter(k=>P.grim.includes(k)))}
    else blocoEscolha(c,"Magias de nível 1 preparadas",g.pacto?"Você tem 1 espaço de magia, que volta no descanso curto.":"Você tem 2 espaços de magia de nível 1.",nv1,P.prep,g.prep,v=>P.prep=v,g.sugP)}
  slotsTalento(P).forEach(s=>{if(s.k!=="iniciado")return;const t=P.tal[s.slot]=P.tal[s.slot]||{};const ls=s.lista||t.lista;
    c.append(el("h3",{},"Iniciado em Magia"+(ls?" ("+ls+")":"")));
    if(!s.lista)c.append(el("p",{class:"cont"},"Lista:"),chips(["Clérigo","Druida","Mago"],t.lista?[t.lista]:[],1,n=>{t.lista=n[0]||null;t.truques=[];t.magia=null;mudou()}));
    c.append(el("p",{class:"cont"},"Atributo para estas magias:"),chips(["INT","SAB","CAR"].map(x=>[x,ATR_N[x]]),t.atr?[t.atr]:[],1,n=>{t.atr=n[0]||null;mudou()}));
    if(ls){t.truques=t.truques||[];blocoEscolha(c,"2 truques ("+ls+")",null,listaClasse(ls,0).filter(x=>!jaConhece(P,x[0],"Iniciado em Magia")||t.truques.includes(x[0])),t.truques,2,v=>t.truques=v);
      blocoEscolha(c,"1 magia de nível 1 ("+ls+")","Sempre preparada; 1 vez por descanso longo sem espaço.",listaClasse(ls,1),t.magia?[t.magia]:[],1,v=>t.magia=v[0]||null)}});
  if(P.invoc==="tomo"){blocoEscolha(c,"Pacto do Tomo: 3 truques","De qualquer lista.",MAGIAS.filter(s=>s[2]===0&&(!jaConhece(P,s[0],"Pacto do Tomo")||P.tomoT.includes(s[0]))),P.tomoT,3,v=>P.tomoT=v);
    blocoEscolha(c,"Pacto do Tomo: 2 rituais","Magias de nível 1 com Ritual, de qualquer lista.",MAGIAS.filter(s=>s[2]===1&&s[10]),P.tomoR,2,v=>P.tomoR=v)}
  const fixas=magiasDe(P).filter(x=>!["Iniciado em Magia","Pacto do Tomo"].includes(x.fonte)&&!(g&&x.fonte===cl.n)&&x.fonte!=="Grimório");
  if(fixas.length)c.append(el("h3",{},"Já vem com"),el("p",{},lista(fixas.map(x=>nm(x.k)+" ("+x.fonte+")"))))}

/* passo 11: nome */
function rNome(c,P){const i=el("input",{type:"text",id:"in-nome",value:P.nome,placeholder:"Nome do personagem",maxLength:60,"aria-label":"Nome do personagem",oninput:e=>{P.nome=e.target.value;gravar();const f=PASSOS[passo].ok(P);$("#wz-falta").textContent=f?"Falta: "+f+".":"";$("#wz-prox").disabled=!!f}});
  const j=el("input",{type:"text",value:P.jogador,placeholder:"Seu nome (opcional)",maxLength:40,"aria-label":"Nome do jogador",oninput:e=>{P.jogador=e.target.value;gravar()}});
  c.append(el("h3",{},"Nome"),i,el("h3",{},"Jogador"),j);
  const m=MOD(P);c.append(el("h3",{},"Resumo"),el("ul",{class:"res-l"},el("li",{},resumoCurto(P)+(P.tend?" · "+TENDENCIAS.find(t=>t[0]===P.tend)[1]:"")),
    el("li",{},"PV "+pvMax(P)+" · CA "+caCalc(P).ca+" · Iniciativa "+sinal(m.DES+(temTalento(P,"alerta")?2:0))+" · Deslocamento "+metros(deslocamento(P))),
    el("li",{},ATR.map(x=>x+" "+atrFinal(P)[x]).join(" · ")),el("li",{},"Perícias: "+lista([...pericias(P).keys()])),el("li",{},"Idiomas: "+lista(idiomasDe(P)))),
    el("p",{class:"nota"},"A história, a família e a imagem você coloca depois, na aba Background da ficha."))}

/* ================= ficha de mesa ================= */
let aba="ficha";
const AT=()=>DB.lista[DB.atual];
function salvarJogo(){gravar();rFicha(true)}
function rFicha(manter){const P=AT();if(!P){mostrar("inicio");return}const y=window.scrollY;const j=P.jogo=P.jogo||{pv:pvMax(P),temp:0,gastos:{}};j.gastos=j.gastos||{};
  document.querySelectorAll("#t-ficha .abas button").forEach(b=>{b.classList.toggle("on",b.dataset.t===aba);b.setAttribute("aria-selected",b.dataset.t===aba)});
  const mx=pvMax(P);j.pv=Math.min(j.pv,mx);$("#pv-cur").textContent=j.pv;$("#pv-max").textContent=" / "+mx+" PV";$("#pv-barra").style.width=Math.min(100,j.pv/mx*100)+"%";
  $("#pv-num").classList.toggle("baixa",j.pv<=mx/2);$("#pv-tmp").textContent=j.temp?"+"+j.temp+" PV temporários (somem primeiro)":"";$("#pv-tmp").hidden=!j.temp;
  const c=$("#f-corpo");c.textContent="";
  if(aba==="ficha")abaFicha(c,P);else if(aba==="combate")abaCombate(c,P);else abaBg(c,P);
  if(manter)window.scrollTo(0,y)}
function secT(t,s){return el("h3",{class:"sec-t"},t,s?el("small",{},s):null)}
function itemLista(n,e,sub,onclick,tag){return el("li",{},el("button",{type:"button",onclick},el("span",{},n,tag?el("span",{class:"tag"},tag):null,sub?el("span",{class:"ext"},sub):null),el("em",{},e||"")))}
function abaFicha(c,P){const m=MOD(P),f=atrFinal(P),pb=2,cl=CL(P),per=pericias(P),esp=new Set(P.especial),ca=caCalc(P);
  c.append(el("div",{class:"cab-f"},P.img?el("div",{class:"foto"},el("img",{src:P.img,alt:""})):null,el("div",{class:"nome"},P.nome||"Sem nome"),el("div",{class:"cls"},resumoCurto(P)+(P.tend?" · "+TENDENCIAS.find(t=>t[0]===P.tend)[1]:""))));
  const per2=k=>m[SK.find(s=>s[0]===k)[1]]+(per.has(k)?pb:0)+(esp.has(k)?pb:0);
  const ini=m.DES+(temTalento(P,"alerta")?pb:0);
  c.append(el("div",{class:"stats"},el("button",{type:"button",onclick:()=>folhaCA(P)},el("b",{},String(ca.ca)),el("small",{},"CA")),el("div",{},el("b",{},sinal(ini)),el("small",{},"Iniciativa")),
    el("div",{},el("b",{},metros(deslocamento(P))),el("small",{},"Deslocamento")),el("div",{},el("b",{},"+"+pb),el("small",{},"Proficiência")),el("div",{},el("b",{},String(10+per2("Percepção"))),el("small",{},"Percepção passiva")),
    el("div",{},el("b",{},visao(P)?metros(visao(P)):"—"),el("small",{},"Visão no escuro"))));
  c.append(secT("Atributos","resistências embaixo"),el("div",{class:"attrs"},...ATR.map(x=>{const pr=cl.salv.includes(x);return el("div",{class:"attr"},el("small",{},ATR_N[x]),el("b",{},sinal(m[x])),el("span",{class:"v"},String(f[x])),
    el("span",{class:"sv"+(pr?" prof":"")},"Resist. "+sinal(m[x]+(pr?pb:0))+(pr?" ●":"")))})));
  c.append(secT("Perícias","negrito = treinada"),el("div",{class:"pericias"},...SK.map(([k,a])=>el("div",{class:per.has(k)?"prof":""},el("span",{},k+(esp.has(k)?" ★":"")),el("span",{},sinal(per2(k)))))));
  if(esp.size)c.append(el("p",{class:"nota"},"★ Especialização: soma a proficiência duas vezes."));
  c.append(secT("Características","toque para ler"),el("ul",{class:"lista"},...tracosDe(P).map(t=>itemLista(t.n,t.de,null,()=>folha(t.n,t.de,[t.x])))));
  const fr=ferramentas(P);
  c.append(secT("Proficiências"),el("div",{class:"prosa"},el("p",{},el("b",{},"Armas: "),textoArmas(P)+"."),el("p",{},el("b",{},"Armaduras: "),textoArmad(P)+"."),
    fr.length?el("p",{},el("b",{},"Ferramentas: "),lista(fr)+"."):null,el("p",{},el("b",{},"Idiomas: "),lista(idiomasDe(P))+".")));
  const eq=itensEquip(P);const j=P.jogo;
  c.append(secT("Equipamento"),el("ul",{class:"res-l"},...eq.itens.map(i=>el("li",{},(i.q>1?i.q+" × ":"")+(i.t==="a"?arma(i.k)[1]:i.t==="r"?armadura(i.k)[1]:i.n)))),
    el("p",{},el("b",{},"Ouro: "),el("input",{type:"number",inputMode:"numeric",min:0,value:j.po!==undefined?j.po:eq.po,style:"width:110px","aria-label":"Peças de ouro",onchange:e=>{j.po=Math.max(0,Number(e.target.value)||0);gravar()}})," PO"),
    el("p",{class:"nota"},"Compras e itens novos: anote em Outras anotações, na aba Background."));
  c.append(secT("Nível"),el("p",{class:"nota"},"Nível 1. Subir de nível vem na próxima versão do criador."));
  c.append(secT("Guardar a ficha"),el("p",{class:"nota"},"A ficha fica guardada neste aparelho. Para não perder, copie e mande para você mesmo ou para o mestre no WhatsApp. A imagem não vai junto no texto."),
    el("div",{class:"linha"},el("button",{class:"bt",type:"button",onclick:e=>copiarFicha(P,e.currentTarget)},"Copiar ficha"),el("button",{class:"bt sec",type:"button",onclick:e=>confirmar(e.currentTarget,()=>{delete DB.lista[P.id];DB.atual=null;gravar(true);mostrar("inicio")})},"Apagar personagem")),
    el("textarea",{id:"cod-manual",hidden:true,"aria-label":"Texto da ficha para copiar",style:"width:100%;margin-top:8px;min-height:90px;font-size:13px"}),el("p",{class:"nota",id:"st-copiar"}))}
function folhaCA(P){const ca=caCalc(P),j=P.jogo,disp=armadurasDisp(P).filter(k=>k!=="escudo"),tr=treinoArmadura(P);
  const corpo=[[null,"Sem armadura"],...disp.map(k=>[k,armadura(k)[1]+(tr.includes(armadura(k)[2])?"":" (sem treino)")])];
  folha("Classe de Armadura",String(ca.ca),[ca.txt+".",el("p",{class:"cont"},"Vestindo:"),chips(corpo.map(([k,t])=>[k===null?"__":k,t]),[ca.corpo===null?"__":ca.corpo],1,n=>{j.arm=n[0]==="__"||n[0]===undefined?null:n[0];salvarJogo();folhaCA(P)}),
    armadurasDisp(P).includes("escudo")?el("div",{},el("p",{class:"cont"},"Escudo:"),chips([["s","Com escudo"],["n","Sem escudo"]],[ca.escudo?"s":"n"],1,n=>{j.escudo=n[0]==="s";salvarJogo();folhaCA(P)})):null,
    el("p",{class:"nota"},"Armadura sem treino: Desvantagem em testes e ataques com Força ou Destreza, e você não conjura magias.")])}
function abaCombate(c,P){const m=MOD(P),pb=2,j=P.jogo,cl=CL(P);
  c.append(secT("Ataques","toque para detalhes"),el("ul",{class:"lista"},...ataques(P).map(a=>itemLista(a.n,a.hit+" · "+a.dano,a.sub,()=>{
    if(a.k.startsWith("arma:")){const w=arma(a.k.slice(5));folha(w[1],(w[2]==="S"?"Arma Simples":"Arma Marcial")+(w[3]==="C"?" corpo a corpo":" à distância"),[el("dl",{class:"meta"},el("dt",{},"Ataque"),el("dd",{},a.hit),el("dt",{},"Dano"),el("dd",{},a.dano),
      w[8]?[el("dt",{},"Alcance"),el("dd",{},w[8])]:null,el("dt",{},"Propriedades"),el("dd",{},w[6].length?w[6].join(", "):"—")),...w[6].map(p=>{const b=p.split(" (")[0];return PROPRIEDADE[b]?el("p",{},el("b",{},b+": "),PROPRIEDADE[b]):null}),
      el("p",{},el("b",{},"Maestria "+w[7]+(P.maestrias.includes(w[0])?" (você usa)":" (você não escolheu esta)")+": "),MAESTRIA[w[7]])])}
    else if(a.k.startsWith("mag:"))folhaMagia(P,a.k.slice(4));else folha("Ataque Desarmado","corpo a corpo",["Um soco, chute ou cabeçada. Ataque: Força + proficiência. Dano: 1 + Força (Contundente), ou o que a característica indicar. Também serve para Agarrar ou Empurrar (o alvo faz resistência de Força ou Destreza contra CD 8 + Força + proficiência)."])},a.mag?"magia":null))));
  const rs=recursos(P);const sp=espacos(P);
  if(sp||rs.length){c.append(secT("Recursos","bolinha cheia = disponível"));const box=el("div",{class:"rec"});
    if(sp)box.append(linhaRecurso(P,{k:"slots",n:"Espaços de magia (nível 1)",max:sp.n,volta:sp.pacto?"curto":"longo",x:sp.pacto?"Magia de Pacto: o espaço volta no descanso curto ou longo.":"Voltam no descanso longo."}));
    rs.forEach(r=>box.append(linhaRecurso(P,r)));c.append(box)}
  c.append(el("div",{class:"rec",style:"margin-top:10px"},el("div",{},el("span",{},el("b",{},"Inspiração Heroica"),el("span",{class:"d"},"gaste para rerrolar um dado")),
    el("button",{type:"button",class:"pip"+(j.insp?"":" gasto"),"aria-label":j.insp?"tem inspiração, tocar para gastar":"sem inspiração, tocar para ganhar",onclick:()=>{j.insp=!j.insp;salvarJogo()}}))));
  const ms=magiasDe(P);if(ms.length){const at=(infoMagiaClasse(P)||{}).atr||ms[0].atr;
    c.append(secT("Magias",infoMagiaClasse(P)?"CD "+(8+pb+m[at])+" · ataque "+sinal(pb+m[at]):""));
    const t0=ms.filter(x=>magia(x.k)[2]===0),t1=ms.filter(x=>magia(x.k)[2]===1);
    if(t0.length)c.append(el("p",{class:"nota"},"Truques"),el("ul",{class:"lista"},...t0.map(x=>itemLista(nm(x.k),magia(x.k)[5],x.fonte,()=>folhaMagia(P,x.k,x)))));
    if(t1.length)c.append(el("p",{class:"nota"},"Nível 1"),el("ul",{class:"lista"},...t1.map(x=>itemLista(nm(x.k),magia(x.k)[5],x.fonte+(x.nota?" · "+x.nota:""),()=>folhaMagia(P,x.k,x),magia(x.k)[9]?"C":null))))}
  c.append(secT("Descansos"),el("div",{class:"descansos"},el("button",{type:"button",onclick:e=>confirmar(e.currentTarget,()=>descanso(P,"curto"))},"Descanso curto"),el("button",{type:"button",onclick:e=>confirmar(e.currentTarget,()=>descanso(P,"longo"))},"Descanso longo")),
    el("p",{class:"nota",id:"nota-descanso"},j.notaDesc||""))}
function linhaRecurso(P,r){const j=P.jogo,g=j.gastos[r.k]||0,livres=r.max-g;
  const nome=el("button",{type:"button",class:"rnome",onclick:()=>folha(r.n,"recurso",[r.x])},r.n);
  const d=el("span",{class:"d"},({longo:"volta no descanso longo",curto:"volta no descanso curto ou longo",curto1:"curto devolve 1 · longo devolve todos"})[r.volta]);
  if(r.reserva||r.max>6)return el("div",{},el("span",{},nome,d),el("span",{class:"pool"},el("button",{type:"button","aria-label":"gastar 1",onclick:()=>{j.gastos[r.k]=Math.min(r.max,g+1);salvarJogo()}},"−"),el("b",{},livres+"/"+r.max),
    el("button",{type:"button","aria-label":"devolver 1",onclick:()=>{j.gastos[r.k]=Math.max(0,g-1);salvarJogo()}},"+")));
  const pips=el("span",{class:"pips"});for(let i=0;i<r.max;i++){const gasto=i>=livres;pips.append(el("button",{type:"button",class:"pip"+(gasto?" gasto":""),"aria-label":gasto?"gasto, tocar para devolver":"disponível, tocar para gastar",
    onclick:()=>{j.gastos[r.k]=gasto?Math.max(0,g-1):Math.min(r.max,g+1);salvarJogo()}}))}
  return el("div",{},el("span",{},nome,d),pips)}
function descanso(P,tipo){const j=P.jogo;const rs=[...recursos(P)];const sp=espacos(P);if(sp)rs.push({k:"slots",volta:sp.pacto?"curto":"longo"});
  if(tipo==="longo"){j.pv=pvMax(P);j.temp=0;j.gastos={};if(P.esp==="humano")j.insp=true;j.notaDesc="Descanso longo: vida cheia, espaços de magia e todos os recursos de volta."+(P.esp==="humano"?" Humano: ganhou Inspiração Heroica.":"")}
  else{rs.forEach(r=>{if(r.volta==="curto")j.gastos[r.k]=0;if(r.volta==="curto1")j.gastos[r.k]=Math.max(0,(j.gastos[r.k]||0)-1)});
    j.notaDesc="Descanso curto: voltou o que volta no descanso curto. Dados de Vida gastos você rola e soma em Cura."+(P.classe==="mago"?" Mago: pode usar a Recuperação Arcana agora (devolva 1 espaço e gaste a bolinha dela).":"")}
  salvarJogo()}
function folhaMagia(P,k,x){const s=magia(k);if(!s)return;const m=MOD(P),pb=2;x=x||magiasDe(P).find(y=>y.k===k)||{};const mm=m[x.atr]||0;
  const meta=[["Nível",s[2]===0?"Truque":"1"],["Tempo",s[5]],["Alcance",s[6]],["Componentes",s[7]],["Duração",s[8]],x.atr?["Atributo",ATR_N[x.atr]+" · CD "+(8+pb+mm)+" · ataque "+sinal(pb+mm)]:null,x.fonte?["De",x.fonte+(x.nota?" ("+x.nota+")":"")]:null].filter(Boolean);
  folha(s[1],s[3]+(s[9]?" · Concentração":"")+(s[10]?" · Ritual":""),[el("dl",{class:"meta"},...meta.flatMap(([a,b])=>[el("dt",{},a),el("dd",{},b)])),s[11],
    s[9]?el("p",{class:"nota"},"Concentração: se sofrer dano, faça resistência de Constituição (CD 10 ou metade do dano, o que for maior, até 30) para manter. Só uma magia de Concentração por vez."):null,
    s[10]?el("p",{class:"nota"},"Ritual: leva 10 minutos a mais e não gasta espaço, se a magia estiver preparada."):null])}
const CAMPOS=[["historia","História","De onde veio, o que viveu até aqui"],["familia","Família","Pais, irmãos, quem ficou para trás"],["intencoes","Intenções","O que quer, o que busca"],["jeito","Jeito de ser","Personalidade, manias, o que ama e o que odeia"],["notas","Outras anotações","Compras, itens novos, dívidas, segredos…"]];
function crescer(t){t.style.height="auto";t.style.height=Math.max(96,t.scrollHeight+2)+"px"}
function abaBg(c,P){const b=P.bg=P.bg||{};
  const img=el("div",{class:"retrato"},el("div",{class:"moldura"},P.img?el("img",{src:P.img,alt:"Imagem do personagem"}):el("span",{},"Sem imagem")),
    el("div",{class:"linha"},el("button",{type:"button",class:"bt sec mini",onclick:()=>$("#arq-img").click()},P.img?"Trocar imagem":"Adicionar imagem"),P.img?el("button",{type:"button",class:"lnk",onclick:e=>confirmar(e.currentTarget,()=>{P.img=null;salvarJogo()})},"Tirar imagem"):null),
    el("span",{class:"nota",id:"st-img"},"A imagem fica só neste aparelho."));
  c.append(el("p",{class:"nota"},"Escreva à vontade: salva sozinho neste aparelho e vai junto quando você copiar a ficha."),img);
  const f=el("div",{class:"bgf"});CAMPOS.forEach(([k,t,ph])=>{const ta=el("textarea",{placeholder:ph,value:b[k]||"","aria-label":t,oninput:e=>{b[k]=e.target.value.slice(0,20000);crescer(e.target);gravar()}});f.append(el("label",{},t,ta))});
  c.append(f,caixaMelhorias(P.extras||[],()=>desfazerExtra(P)));requestAnimationFrame(()=>c.querySelectorAll("textarea").forEach(crescer))}
async function prepararImg(file){const url=URL.createObjectURL(file);try{const im=new Image();await new Promise((ok,er)=>{im.onload=ok;im.onerror=er;im.src=url});
  const k=Math.min(1,700/Math.max(im.naturalWidth,im.naturalHeight)),cv=document.createElement("canvas");cv.width=Math.round(im.naturalWidth*k);cv.height=Math.round(im.naturalHeight*k);
  const g=cv.getContext("2d");g.fillStyle="#fffaf0";g.fillRect(0,0,cv.width,cv.height);g.drawImage(im,0,0,cv.width,cv.height);return cv.toDataURL("image/jpeg",.82)}finally{URL.revokeObjectURL(url)}}

/* ================= folha de detalhe, confirmação, cópia ================= */
function folha(t,tipo,partes){const s=$("#sheet");s.textContent="";s.append(el("button",{class:"fechar",type:"button","aria-label":"Fechar",onclick:fecharFolha},"×"),el("h4",{id:"sheet-t"},t),tipo?el("div",{class:"tipo"},tipo):null,
  ...partes.map(p=>typeof p==="string"?rico(p):p),el("p",{class:"fonte"},"Resumo da regra do Livro do Jogador 2024 com palavras próprias. O texto completo está no livro."));
  s.classList.add("on");$("#veu").classList.add("on");s.scrollTop=0}
function fecharFolha(){$("#sheet").classList.remove("on");$("#veu").classList.remove("on")}
function confirmar(bt,fazer){if(bt.classList.contains("conf")){bt.classList.remove("conf");bt.textContent=bt.dataset.orig;fazer();return}
  bt.dataset.orig=bt.textContent;bt.textContent="Toque de novo";bt.classList.add("conf");setTimeout(()=>{if(bt.isConnected&&bt.classList.contains("conf")){bt.classList.remove("conf");bt.textContent=bt.dataset.orig}},3500)}
const CODIGOS={};
async function prepararCodigo(P){const cod=await codificar(P);CODIGOS[P.id]="Ficha de D&D: "+(P.nome||"Sem nome")+" ("+resumoCurto(P)+")\nPara abrir, copie esta mensagem inteira e cole em Abrir ficha pelo texto, na tela de personagens.\n"+cod;return CODIGOS[P.id]}
function copiarFicha(P,bt){const st=$("#st-copiar"),ta=$("#cod-manual");const txt=CODIGOS[P.id];
  if(!txt){st.textContent="Preparando… toque de novo em um segundo.";prepararCodigo(P);return}
  let feito=false;const manual=()=>{if(feito)return;feito=true;ta.hidden=false;ta.value=txt;ta.focus();ta.setSelectionRange(0,ta.value.length);st.textContent="Não consegui copiar sozinho. Toque e segure no texto acima, escolha Selecionar Tudo e depois Copiar."};
  setTimeout(()=>{if(!feito)manual()},1500);
  try{navigator.clipboard.writeText(txt).then(()=>{if(feito)return;feito=true;st.textContent="Copiado. Cole numa conversa do WhatsApp e envie."},manual)}catch(e){manual()}}
async function abrirTexto(){const t=$("#colar-txt").value,st=$("#st-colar");if(!t.trim()){st.textContent="Cole o texto da ficha na caixa.";return}
  try{const d=await decodificar(t);const P=limparImportado(d);const ja=DB.lista[P.id];
    if(ja){P.img=ja.img;st.textContent="Ficha de "+(P.nome||"sem nome")+" atualizada com o texto colado."}else st.textContent="Ficha de "+(P.nome||"sem nome")+" aberta.";
    DB.lista[P.id]=P;gravar(true);$("#colar-txt").value="";rInicio()}
  catch(e){st.textContent="Não reconheci esse texto. Copie a mensagem inteira do WhatsApp (tocar e segurar, Copiar) e cole de novo."}}

/* ================= início ================= */
function iniciar(){carregar();
  $("#bt-criar").onclick=iniciarCriacao;$("#bt-abrir-txt").onclick=abrirTexto;
  $("#wz-prox").onclick=proximo;$("#wz-voltar").onclick=voltar;
  $("#f-voltar").onclick=()=>mostrar("inicio");
  document.querySelectorAll("#t-ficha .abas button").forEach(b=>b.onclick=()=>{aba=b.dataset.t;rFicha();window.scrollTo(0,0)});
  $("#veu").onclick=fecharFolha;document.addEventListener("keydown",e=>{if(e.key==="Escape")fecharFolha()});
  const valor=()=>{const v=parseInt($("#pv-valor").value,10);return v>0?v:0};
  $("#bt-dano").onclick=()=>{const P=AT(),j=P.jogo;let v=valor();if(!v)return;const t=Math.min(j.temp||0,v);j.temp=(j.temp||0)-t;v-=t;j.pv=Math.max(0,j.pv-v);$("#pv-valor").value="";salvarJogo()};
  $("#bt-cura").onclick=()=>{const P=AT(),j=P.jogo;const v=valor();if(!v)return;j.pv=Math.min(pvMax(P),j.pv+v);$("#pv-valor").value="";salvarJogo()};
  $("#bt-temp").onclick=()=>{const P=AT(),j=P.jogo;const v=valor();if(!v)return;j.temp=Math.max(j.temp||0,v);$("#pv-valor").value="";salvarJogo()};
  $("#arq-img").onchange=async e=>{const f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;const P=AT();const st=$("#st-img");if(st)st.textContent="Preparando a imagem…";
    try{P.img=await prepararImg(f);gravar(true);salvarJogo()}catch(x){if(st)st.textContent="Não consegui abrir essa imagem. Tente uma foto JPG ou PNG."}};
  if(DB.atual&&DB.lista[DB.atual]){aba="ficha";mostrar("ficha");prepararCodigo(DB.lista[DB.atual])}else mostrar("inicio");
  setInterval(()=>{const P=AT();if(P&&tela==="ficha")prepararCodigo(P)},4000)}
