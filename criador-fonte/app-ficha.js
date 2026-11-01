/* Ficha no mesmo arranjo da ficha do Daibo (pedido de 01/11/2026, vale para toda ficha nova):
   Ficha = cabeçalho, subir de nível, atributos, perícias, habilidades e talentos, proficiências e equipamento;
   Combate = CA/iniciativa/deslocamento/proficiência, "No seu turno" (Ação, Ação Bônus, Reação, Sem gastar ação),
   Magias (truques à vontade; magias que gastam espaço, com os espaços; grimório), Recursos e Descansos.
   Carrega depois do app-niveis.js: as funções daqui substituem abaFicha e abaCombate. */

/* Em que caixa do turno cai cada habilidade: pelo texto ("- **Ativar:** Ação Bônus", "Reação: ..."), com exceções fixas. */
var TURNO_FIXO={surto:"semacao",descuidado:"semacao",furtivo:"semacao",golpesabencoados:"semacao",furiaelemental:"semacao"};
var TURNO_FORA=new Set(["extra","surto17","estudados"]);
function grupoDoTexto(t,semTurno){t=String(t||"");
  if(/Reação/.test(t))return "reacao";if(/Ação Bônus/.test(t))return "bonus";
  if(/\b(ação de Magia|ação Utilizar|ação Influenciar|ação de Estudar|uma Ação|como Ação|Ação)\b/.test(t))return "acao";
  if(!semTurno&&/(uma vez por turno|uma vez em cada (um dos seus )?turnos?|sem gastar ação|\(sem ação\))/i.test(t))return "semacao";return null}
function turnoHabilidades(P){const G={acao:[],bonus:[],reacao:[],semacao:[]};const rs=recursos(P);
  const usos=n=>{const r=rs.find(x=>x.n===n);if(!r)return "";const g=(P.jogo.gastos||{})[r.k]||0;return (r.max-g)+" de "+r.max+(r.max>1?" usos":" uso")};
  const metas=[];
  tracosDe(P).forEach(t=>{const fk=t.k.split(":").pop();if(TURNO_FORA.has(fk))return;
    if(t.k.startsWith("meta:")){metas.push(t);return}
    const ls=String(t.x||"").split("\n"),abrir=()=>folha(t.n,t.de,[t.x]);
    const rot=ls.filter(l=>/^- \*\*(Ativar|Como|Usar|Ação|Uso|Tempo|Quando|Gatilho|Conjurar)[^*]*:\*\*/.test(l)).join(" ");
    let g=TURNO_FIXO[fk]||grupoDoTexto(rot||ls[0]);
    if(!g&&t.k.startsWith("man:"))g="semacao";
    if(g){G[g].push({n:t.n,e:usos(t.n),sub:t.de,on:abrir});return}
    ls.forEach(l=>{const m=l.match(/^ {0,2}- \*\*([^*]+?):\*\* ?(.*)$/);if(!m||/^(Usos?|Efeito|Dano|Duração|Alcance|Limite|Escolhid|Agora|Suas?|Detalhes)/.test(m[1]))return;
      const gl=grupoDoTexto(m[2]);if(gl)G[gl].push({n:m[1],e:usos(t.n),sub:t.n,on:abrir})})});
  if(metas.length)G.semacao.push({n:"Metamagia",e:usos("Pontos de Feitiçaria")||"",sub:"ao conjurar: "+lista(metas.map(t=>t.n)),on:()=>folha("Metamagia","Feiticeiro",metas.map(t=>"**"+t.n+"** ("+t.de.replace("Metamagia · ","")+"): "+t.x).join("\n\n"))});
  return G}

/* Magias que entram nas caixas do turno: as preparadas que se conjuram como Ação Bônus ou Reação, e as de Ação que causam dano. */
function numMagia(P,x,s){const m=MOD(P),pb=pbP(P),mm=m[x.atr]||0;const t=String(s[11]||"");
  const dado=(t.match(/\b\d+d\d+(?: ?\+ ?\d+)?/)||[""])[0];
  const alvo=/\*\*Ataque:\*\*|ataque mágico/i.test(t)?sinal(pb+mm):/resistência de (Força|Destreza|Constituição|Inteligência|Sabedoria|Carisma)/.test(t)?"CD "+(8+pb+mm):"";
  return [alvo,dado].filter(Boolean).join(" · ")}
function turnoMagias(P,G){const vistos=new Set();
  magiasDe(P).forEach(x=>{if(x.naoPrep||vistos.has(x.k))return;const s=magia(x.k);if(!s)return;vistos.add(x.k);
    const tempo=String(s[5]),tr=s[2]===0,tag=tr?"truque · à vontade":"magia · gasta 1 espaço";
    const it={n:s[1],e:numMagia(P,x,s),sub:String(s[11]||"").split("\n")[0],tag,livre:tr,on:()=>folhaMagia(P,x.k,x)};
    if(tempo.startsWith("Ação Bônus"))G.bonus.push(it);
    else if(tempo==="Reação")G.reacao.push(it);
    else if(!tr&&/^Ação/.test(tempo)&&/\b\d+d\d+/.test(String(s[11]))&&/(dano|Dano)/.test(String(s[11])))G.acao.push(it)})}

function itemTurno(it){return el("li",{},el("button",{type:"button",onclick:it.on},
  el("span",{},it.n,it.tag?el("span",{class:"tag"+(it.livre?" livre":"")},it.tag):null,it.sub?el("span",{class:"ext"},it.sub):null),el("em",{},it.e||"")))}
function caixa(cls,titulo,sel,exp,itens,depois){const box=el("div",{class:"cx-mag "+cls},el("div",{class:"cx-tit"},el("b",{},titulo),sel?el("span",{class:"cx-sel "+cls},sel):null));
  if(exp)box.append(el("p",{class:"cx-exp"},exp));if(itens&&itens.length)box.append(el("ul",{class:"lista"},...itens.map(itemTurno)));
  (depois||[]).forEach(d=>d&&box.append(d));return box}

function abaCombate(c,P){const m=MOD(P),pb=pbP(P),j=P.jogo,ca=caCalc(P);
  c.append(el("div",{class:"stats s4"},el("button",{type:"button",onclick:()=>folhaCA(P)},el("b",{},String(ca.ca)),el("small",{},"CA")),el("div",{},el("b",{},sinal(iniciativa(P))),el("small",{},"Iniciativa")),
    el("div",{},el("b",{},metros(deslocamento(P))),el("small",{},"Desloc.")),el("div",{},el("b",{},"+"+pb),el("small",{},"Profic."))));
  /* No seu turno */
  const G=turnoHabilidades(P);const na=nAtaques(P);
  const ats=ataques(P).map(a=>({n:a.n,e:a.hit+" · "+a.dano,tag:a.mag?"truque · à vontade":null,livre:!!a.mag,
    sub:a.mag?a.sub:["ação de Atacar"+(na>1?": "+na+" ataques":""),a.sub].filter(Boolean).join(" · "),on:()=>abrirAtaque(P,a)}));
  turnoMagias(P,G);
  G.reacao.push({n:"Ataque de Oportunidade",e:"1 ataque corpo a corpo",sub:"quando um inimigo que você vê sai do seu alcance",on:()=>folha("Ataque de Oportunidade","Reação",["Quando uma criatura que você vê sai do seu alcance, você pode usar a Reação para fazer um ataque corpo a corpo contra ela. Sair com a ação Desengajar não provoca."])});
  c.append(secT("No seu turno"),el("p",{class:"nota turno-leg"},"A cada turno: 1 Ação e 1 Ação Bônus. A Reação é 1 por rodada e pode acontecer fora do seu turno."),
    caixa("acao","Ação","1 por turno",null,ats.concat(G.acao),[el("p",{class:"cx-exp"},"Outras ações que qualquer um pode fazer: Disparada, Desengajar, Esquivar, Ajudar, Esconder, Usar um objeto.")]),
    caixa("bonus","Ação Bônus","1 por turno",G.bonus.length?null:"Nada por enquanto.",G.bonus),
    caixa("reacao","Reação","1 por rodada",null,G.reacao),
    caixa("semacao","Sem gastar ação","quando acontece",G.semacao.length?null:"Nada por enquanto.",G.semacao));
  /* Magias */
  const ms=magiasDe(P);if(ms.length){const cj=conjuradores(P);const sp=espacosDe(P);
    c.append(secT("Magias",cj.map(g=>(cj.length>1?g.nome+": ":"")+"CD "+(8+pb+m[g.atr])+" · ataque "+sinal(pb+m[g.atr])).join(" · ")));
    const vistos=new Set(),uni=l=>l.filter(x=>!vistos.has(x.k+"|"+x.naoPrep)&&vistos.add(x.k+"|"+x.naoPrep));
    const linha=x=>({n:nm(x.k),e:magia(x.k)[5],sub:x.fonte+(x.nota&&!x.naoPrep?" · "+x.nota:""),tag:magia(x.k)[9]?"C":null,on:()=>folhaMagia(P,x.k,x)});
    const tr=uni(ms.filter(x=>magia(x.k)[2]===0));
    if(tr.length)c.append(caixa("livre","Truques","à vontade","Não gastam nada. Pode usar em todo turno, quantas vezes quiser.",tr.map(linha)));
    const prep=uni(ms.filter(x=>magia(x.k)[2]>0&&!x.naoPrep));
    const rec=el("div",{class:"rec"});
    sp.tab.forEach((n,i)=>rec.append(linhaRecurso(P,{k:"slots"+(i+1),n:"Espaços de nível "+(i+1),max:n,volta:"longo",x:"Gastos ao conjurar magias de nível "+(i+1)+" ou maior com espaço. Voltam no descanso longo."})));
    if(sp.pacto)rec.append(linhaRecurso(P,{k:"pacto",n:"Espaços de Pacto (nível "+sp.pacto[1]+")",max:sp.pacto[0],volta:"curto",x:"Magia de Pacto do Bruxo: os espaços são todos de nível "+sp.pacto[1]+" e voltam no descanso curto ou longo."}));
    if(prep.length||sp.tab.length||sp.pacto){const box=caixa("gasta","Magias","gastam espaço","Cada uma gasta 1 espaço do nível dela ou maior: toque numa bolinha. Os espaços voltam no descanso"+(sp.pacto&&!sp.tab.length?" curto ou longo.":" longo."),null,[rec]);
      [1,2,3,4,5,6,7,8,9].forEach(nv=>{const l=prep.filter(x=>magia(x.k)[2]===nv);if(l.length)box.append(el("p",{class:"cx-nv"},"Nível "+nv),el("ul",{class:"lista"},...l.map(linha).map(itemTurno)))});
      c.append(box)}
    const gr=uni(ms.filter(x=>x.naoPrep));
    if(gr.length)c.append(caixa("guarda","No grimório","não preparadas","Estão no seu livro, mas hoje não dá para conjurar. Troque as preparadas ao fim do descanso longo. As de Ritual podem ser conjuradas como ritual mesmo sem preparar.",gr.map(linha)));
    c.append(el("button",{type:"button",class:"lnk",style:"align-self:flex-start;margin-top:8px",onclick:()=>folhaTrocarMagias(P)},magiasFaltando(P)?"Escolher as magias que faltam":"Escolher ou trocar magias"))}
  /* Recursos */
  const rs=recursos(P);c.append(secT("Recursos","bolinha cheia = disponível"));const box=el("div",{class:"rec"});
  rs.forEach(r=>box.append(linhaRecurso(P,r)));
  if(nC(P,"druida")>=2){const tmp=(subDe(P,"druida")==="lua"&&nC(P,"druida")>=3?3:1)*nC(P,"druida");const g=j.gastos.formasel||0;
    box.append(el("div",{},el("span",{class:"d"},"Ao virar bicho você ganha "+tmp+" PV temporários."),el("button",{type:"button",class:"bt mini",disabled:g>=2,onclick:()=>{j.gastos.formasel=Math.min(2,g+1);j.temp=Math.max(j.temp||0,tmp);
      j.notaDesc="Forma Selvagem: +"+tmp+" PV temporários. Use a ficha da forma escolhida (Formas conhecidas).";salvarJogo()}},"Usar Forma Selvagem")));
    const fs=formasDe(P);box.append(el("div",{},el("button",{type:"button",class:"rnome",onclick:()=>folhaFormas(P)},"Formas conhecidas"),el("span",{class:"d"},fs.length?lista(fs.map(k=>besta(k)[1]))+" ("+fs.length+" de "+formasMax(P)+")":"nenhuma escolhida ainda: toque para escolher "+formasMax(P))))}
  box.append(el("div",{},el("span",{},el("b",{},"Inspiração Heroica"),el("span",{class:"d"},"gaste para rerrolar um dado"+(P.esp==="humano"?" · Humano ganha no descanso longo":""))),
    el("button",{type:"button",class:"pip"+(j.insp?"":" gasto"),"aria-label":j.insp?"tem inspiração, tocar para gastar":"sem inspiração, tocar para ganhar",onclick:()=>{j.insp=!j.insp;salvarJogo()}})));
  c.append(box);
  c.append(el("div",{class:"descansos"},el("button",{type:"button",onclick:e=>confirmar(e.currentTarget,()=>descanso(P,"curto"))},"Descanso curto"),el("button",{type:"button",onclick:e=>confirmar(e.currentTarget,()=>descanso(P,"longo"))},"Descanso longo")),
    el("p",{class:"nota",id:"nota-descanso"},j.notaDesc||""))}

function abrirAtaque(P,a){
  if(a.k.startsWith("arma:")){const w=arma(a.k.slice(5));folha(w[1],(w[2]==="S"?"Arma Simples":"Arma Marcial")+(w[3]==="C"?" corpo a corpo":" à distância"),[el("dl",{class:"meta"},el("dt",{},"Ataque"),el("dd",{},a.hit),el("dt",{},"Dano"),el("dd",{},a.dano),
    w[8]?[el("dt",{},"Alcance"),el("dd",{},w[8])]:null,el("dt",{},"Propriedades"),el("dd",{},w[6].length?w[6].join(", "):"—")),...w[6].map(p=>{const b=p.split(" (")[0];return PROPRIEDADE[b]?el("p",{},el("b",{},b+": "),PROPRIEDADE[b]):null}),
    el("p",{},el("b",{},"Maestria "+w[7]+(maestriasDe(P).includes(w[0])?" (você usa)":" (você não escolheu esta)")+": "),MAESTRIA[w[7]])])}
  else if(a.k.startsWith("mag:"))folhaMagia(P,a.k.slice(4));
  else if(a.k==="psi")folha("Lâmina Psíquica","Lâmina Psíquica (Ladino)",[SUBCLASSES.ladino.alma.tr[1][1]]);
  else folha("Ataque Desarmado","corpo a corpo",["Um soco, chute ou cabeçada. Ataque: Força + proficiência. Dano: 1 + Força (Contundente), ou o que a característica indicar. Também serve para Agarrar ou Empurrar (o alvo faz resistência de Força ou Destreza contra CD 8 + Força + proficiência)."])}

var BROCHE='<svg class="broche" viewBox="-30 -30 60 60" aria-hidden="true"><circle r="27" fill="none" stroke="currentColor" stroke-width="2" opacity=".55"/><circle r="22" fill="none" stroke="currentColor" stroke-width="1"/><path d="M0 -24 L4 -4 L24 0 L4 4 L0 24 L-4 4 L-24 0 L-4 -4 Z" fill="currentColor" opacity=".55"/><path d="M0 -14 L2.5 -2.5 L14 0 L2.5 2.5 L0 14 L-2.5 2.5 L-14 0 L-2.5 -2.5 Z" transform="rotate(45)" fill="currentColor" opacity=".8"/><circle r="3.5" fill="var(--acc)"/></svg>';
function abaFicha(c,P){const m=MOD(P),f=atrFinal(P),pb=pbP(P),per=pericias(P),esp=new Set(especialDe(P)),j=P.jogo,nv=NV(P);
  const cab=el("div",{class:"cab-f"});if(P.img)cab.append(el("div",{class:"foto"},el("img",{src:P.img,alt:""})));else{const s=el("div",{class:"broche-box"});s.innerHTML=BROCHE;cab.append(s)}
  cab.append(el("div",{class:"nome"},P.nome||"Sem nome"),el("div",{class:"cls"},"Nível "+nv+" · "+resumoCurto(P)+(P.tend?" · "+TENDENCIAS.find(t=>t[0]===P.tend)[1]:"")));c.append(cab);
  if(nv<NIVEL_MAX)c.append(el("button",{class:"bt largo",type:"button",onclick:abrirSubir},"Subir para o nível "+(nv+1)));
  const per2=k=>m[SK.find(s=>s[0]===k)[1]]+(per.has(k)?pb:0)+(esp.has(k)?pb:0)+(!per.has(k)&&nC(P,"bardo")>=2?Math.floor(pb/2):0);
  c.append(secT("Atributos","toque para aumentar · ● treinado"),el("div",{class:"attrs"},...ATR.map(x=>{const pr=salvProf(P,x);return el("button",{type:"button",class:"attr","aria-label":ATR_N[x]+": tocar para aumentar",onclick:()=>folhaAtr(P,x)},el("small",{},x),el("b",{},sinal(m[x])),el("span",{class:"v"},String(f[x])),
    el("span",{class:"sv"+(pr?" prof":"")},"Resist. "+sinal(m[x]+(pr?pb:0)+auraPal(P))+(pr?" ●":"")))})));
  c.append(secT("Perícias","Percepção passiva "+(10+per2("Percepção"))),el("div",{class:"pericias"},...SK.map(([k])=>el("div",{class:per.has(k)?"prof":""},el("span",{},k+(esp.has(k)?" ★":per.has(k)?" ●":"")),el("span",{},sinal(per2(k)))))));
  c.append(el("p",{class:"nota"},"● treinada"+(esp.size?" · ★ especialização: soma a proficiência duas vezes":"")+(nC(P,"bardo")>=2?" · Pau para Toda Obra já somado nas não treinadas":"")+"."));
  c.append(secT("Habilidades e talentos","toque para ler"),el("ul",{class:"lista"},...tracosDe(P).map(t=>itemLista(t.n,t.de,null,()=>folha(t.n,t.de,[t.x])))));
  const fr=ferramentas(P),eq=itensEquip(P),pc=niveisPorClasse(P),vis=visao(P);
  const dv={};Object.keys(pc).forEach(k=>{const d="d"+CLASSES[k].dv;dv[d]=(dv[d]||0)+pc[k]});
  c.append(secT("Proficiências e equipamento"),el("div",{class:"prosa"},el("p",{},el("b",{},"Armaduras: "),textoArmad(P)+"."),el("p",{},el("b",{},"Armas: "),textoArmas(P)+"."),
    fr.length?el("p",{},el("b",{},"Ferramentas: "),lista(fr)+"."):null,el("p",{},el("b",{},"Idiomas: "),lista(idiomasDe(P))+"."),
    vis?el("p",{},el("b",{},"Visão no escuro: "),metros(vis)+"."):null,
    el("p",{},el("b",{},"Equipamento: "),lista(eq.itens.map(i=>(i.q>1?i.q+" × ":"")+(i.t==="a"?arma(i.k)[1]:i.t==="r"?armadura(i.k)[1]:i.n)))+"."),
    el("p",{},el("b",{},"Dados de vida: "),Object.entries(dv).map(([d,q])=>q+d).join(" + ")),
    el("p",{},el("b",{},"Ouro: "),el("input",{type:"number",inputMode:"numeric",min:0,value:j.po!==undefined?j.po:eq.po,style:"width:110px","aria-label":"Peças de ouro",onchange:e=>{j.po=Math.max(0,Number(e.target.value)||0);gravar()}})," PO")),
    el("p",{class:"nota"},"Outros itens novos: anote em Outras anotações, na aba Background."),el("button",{type:"button",class:"lnk",style:"align-self:flex-start",onclick:()=>folhaCompras(P)},"Trocar ou comprar arma e armadura"));
  const box=el("div",{class:"linha"});
  if(nv>1)box.append(el("button",{class:"bt sec",type:"button",onclick:e=>confirmar(e.currentTarget,()=>desfazerNivel(P))},"Desfazer nível "+nv));
  c.append(secT("Nível",nv+" de "+NIVEL_MAX),el("p",{class:"nota"},nv<NIVEL_MAX?"Suba quando o mestre liberar, pelo botão lá em cima. Um nível por vez; o último pode ser desfeito.":"Nível 20: o máximo do jogo."),box,
    (P.niveis||[]).length?el("p",{class:"nota"},"Vida por nível: "+P.niveis.map((n,i)=>"nível "+(i+2)+": "+CLASSES[n.c].n+", "+n.pv+(n.modo==="fixo"?" (fixo)":" (rolado)")+" + CON").join(" · ")):"",el("button",{type:"button",class:"lnk",style:"align-self:flex-start",onclick:()=>editarCriacao(P)},"Rever as escolhas do nível 1"));
  c.append(secT("Guardar a ficha"),el("p",{class:"nota"},"A ficha fica guardada neste aparelho. Para não perder, copie e mande para você mesmo ou para o mestre no WhatsApp. A imagem não vai junto no texto."),
    el("div",{class:"linha"},el("button",{class:"bt",type:"button",onclick:e=>copiarFicha(P,e.currentTarget)},"Copiar ficha"),el("button",{class:"bt sec",type:"button",onclick:e=>confirmar(e.currentTarget,()=>{delete DB.lista[P.id];DB.atual=null;gravar(true);mostrar("inicio")})},"Apagar personagem")),
    el("textarea",{id:"cod-manual",hidden:true,"aria-label":"Texto da ficha para copiar",style:"width:100%;margin-top:8px;min-height:90px;font-size:13px"}),el("p",{class:"nota",id:"st-copiar"}))}
