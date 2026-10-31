/* Gera livros.json: todas as regras do criador (pasta criador-fonte) como linhas da tabela livros do Supabase.
   Uma linha = {versao, tipo, nome, texto, dados, fonte}. "texto" é o resumo para ler; "dados" guarda os números e as ligações.
   Rodar: node exportar_livros.js   (depois: node carregar_livros.js, que manda para o banco) */
const fs = require("fs"), vm = require("vm"), path = require("path");
const F = path.join(__dirname, "criador-fonte");
const arquivos = ["dados-base.js", "dados-classes.js", "dados-origem.js", "dados-magias.js", "dados-niveis.js", "dados-niveis-altos.js", "dados-bestas.js", "dados-bestas-altas.js"];
const ctx = {}; vm.createContext(ctx);
vm.runInContext(arquivos.map(f => fs.readFileSync(path.join(F, f), "utf8")).join("\n") + `;this.X={ATR_N,SK,CLASSES,ANTECEDENTES,ESPECIES,TALENTOS,TALENTOS_GERAIS,ESTILOS,ORDEM_CLERIGO,ORDEM_DRUIDA,INVOCACOES,INVOCACOES_N2,INVOCACOES_N5,INVOCACOES_ALTAS,INVOC_PEDE,
  METAMAGIAS,MANOBRAS,NIVEIS,SUBCLASSES,TERRAS,FERAS,MAGIAS,BESTAS,ARMAS,ARMADURAS,PACOTES,MAESTRIA,PROPRIEDADE,LINHAGEM_ELFO,LINHAGEM_GNOMO,GIGANTES,LEGADOS,ANCESTRAIS,
  PROG,TAB_ESPACOS,ESP_MEIO,ESP_TERCO,PREP_TERCO,PACTO,INVOC_N,FURIAS,MAESTRIA_N,MULTI_REQ,MULTI_GANHA,TXT_ASI,TXT_EXTRA,TENDENCIAS,IDIOMAS_PADRAO,IDIOMAS_RAROS,ARTESAO,INSTRUMENTOS,JOGOS}`, ctx);
const X = JSON.parse(JSON.stringify(ctx.X));
const V = "2024", LIVRO = "Livro do Jogador 2024 (resumo com palavras próprias)", SRD = "SRD 5.2, Wizards of the Coast (CC-BY-4.0), traduzido";
const out = [], vistos = new Set();
const add = (tipo, nome, texto, dados, fonte) => { const id = tipo + "|" + nome; if (vistos.has(id)) throw new Error("nome repetido: " + id); vistos.add(id); out.push({ versao: V, tipo, nome, texto: texto || null, dados: dados || {}, fonte: fonte || LIVRO }) };
const L = a => a.join(", ");
const nomeAtr = k => X.ATR_N[k] || k;
const subNiveis = c => [...new Set(Object.values(X.SUBCLASSES[c]).flatMap(s => [3, ...Object.keys(s.alto || {}).map(Number)]))].sort((a, b) => a - b);

/* classes, características por nível e progressão */
for (const [c, cl] of Object.entries(X.CLASSES)) {
  const porNivel = {}; porNivel[1] = cl.n1.map(f => f.n);
  for (const [l, fs2] of Object.entries(X.NIVEIS[c] || {})) porNivel[l] = fs2.map(f => f.n);
  subNiveis(c).forEach(l => (porNivel[l] = porNivel[l] || []).push("característica da subclasse"));
  const texto = cl.resumo + "\n- **Dado de Vida:** d" + cl.dv + "\n- **Atributo principal:** " + cl.prim + "\n- **Resistências:** " + L(cl.salv.map(nomeAtr)) +
    "\n- **Perícias:** escolha " + cl.per.n + (cl.per.de === "todas" ? " quaisquer" : " entre " + L(cl.per.de)) + "\n- **Armas:** " + cl.armasTxt +
    "\n- **Armaduras:** " + (cl.armad.length ? L(cl.armad) : "nenhuma") + (cl.magia ? "\n- **Magia:** usa " + nomeAtr(cl.magia.atr) + ", lista de " + cl.magia.lista : "") +
    "\n- **Por nível:**\n" + Object.keys(porNivel).sort((a, b) => a - b).map(l => "  - " + l + ": " + L(porNivel[l])).join("\n");
  add("classe", cl.n, texto, Object.assign({ chave: c, niveis: porNivel, subclasses: Object.values(X.SUBCLASSES[c]).map(s => s.n), multiclasse: { pede: X.MULTI_REQ[c], ganha: X.MULTI_GANHA[c] },
    progressao: X.PROG[c] || null, furias: c === "barbaro" ? X.FURIAS.slice(1) : undefined, maestrias: X.MAESTRIA_N[c] }, cl, { n1: undefined }));
  cl.n1.forEach(f => add("caracteristica", cl.n + " 1 · " + f.n, f.x, { classe: cl.n, chave_classe: c, nivel: 1, chave: f.k, uso: f.uso || null, escolha: f.esc || null }));
  for (const [l, fs2] of Object.entries(X.NIVEIS[c] || {})) fs2.forEach(f => add("caracteristica", cl.n + " " + l + " · " + f.n, f.x, { classe: cl.n, chave_classe: c, nivel: +l, chave: f.k, uso: f.uso || null, escolha: f.esc || null }));
}
/* subclasses e seus traços */
for (const [c, subs] of Object.entries(X.SUBCLASSES)) for (const [k, s] of Object.entries(subs)) {
  const cl = X.CLASSES[c].n, tracos = [[3, s.tr], ...Object.entries(s.alto || {}).map(([l, t]) => [+l, t])];
  const magias = {}; if (s.magias) magias[3] = s.magias; [5, 6, 7, 9, 10, 13, 17, 18].forEach(l => { if (s["m" + l]) magias[l] = s["m" + l] });
  const nomeM = k2 => (X.MAGIAS.find(m => m[0] === k2) || [0, k2])[1];
  add("subclasse", cl + " · " + s.n, s.d + "\n- **Classe:** " + cl + "\n- **Por nível:**\n" + tracos.map(([l, t]) => "  - " + l + ": " + L(t.map(x => x[0]))).join("\n") +
    (Object.keys(magias).length ? "\n- **Magias sempre preparadas:**\n" + Object.entries(magias).map(([l, m]) => "  - " + l + ": " + L(m.map(nomeM))).join("\n") : ""),
    { classe: cl, chave_classe: c, chave: k, magias, extras: Object.fromEntries(Object.entries(s).filter(([x]) => !["n", "d", "tr", "alto", "magias"].includes(x) && !/^m\d+$/.test(x))) });
  tracos.forEach(([l, t]) => t.forEach(x => add("caracteristica_subclasse", s.n + " " + l + " · " + x[0], x[1], { classe: cl, subclasse: s.n, chave_subclasse: k, nivel: l, uso: x[2] || null })));
}
X.MAGIAS.forEach(m => add("magia", m[1], m[11], { chave: m[0], nivel: m[2], escola: m[3], classes: m[4], tempo: m[5], alcance: m[6], componentes: m[7], duracao: m[8], concentracao: !!m[9], ritual: !!m[10], efeito_ficha: m[12] }));
for (const [k, t] of Object.entries(X.TALENTOS)) add("talento", t.n, t.x, Object.assign({ categoria: "Origem", chave: k }, t, { x: undefined }));
for (const [k, t] of Object.entries(X.TALENTOS_GERAIS)) add("talento", t.n, t.x, Object.assign({ categoria: t.epico ? "Dádiva Épica" : "Geral", chave: k, pede: t.epico ? "nível 19" : "nível 4" }, t, { x: undefined }));
for (const [k, e] of Object.entries(X.ESTILOS)) add("talento", e[0], e[1], { categoria: "Estilo de Luta", chave: k });
for (const [k, a] of Object.entries(X.ANTECEDENTES)) add("antecedente", a.n, a.d + "\n- **Atributos:** " + L(a.atr.map(nomeAtr)) + "\n- **Perícias:** " + L(a.per) + "\n- **Ferramenta:** " + (typeof a.ferr === "string" ? a.ferr : "à escolha") +
  "\n- **Talento:** " + ((X.TALENTOS[a.tal] || {}).n || a.tal) + (a.talOp ? " (" + a.talOp + ")" : "") + "\n- **Equipamento:** " + L(a.eq.map(x => x[1])) + " e " + a.po + " PO", Object.assign({ chave: k }, a));
for (const [k, e] of Object.entries(X.ESPECIES)) add("especie", e.n, e.d + "\n- **Deslocamento:** " + String(e.desl).replace(".", ",") + " m" + (e.visao ? "\n- **Visão no Escuro:** " + e.visao + " m" : "") + "\n" + e.tracos.map(t => "- **" + t[0] + ":** " + t[1].split("\n")[0]).join("\n"), Object.assign({ chave: k }, e));
[["Linhagem Élfica", X.LINHAGEM_ELFO], ["Linhagem Gnômica", X.LINHAGEM_GNOMO], ["Ancestralidade Gigante", X.GIGANTES], ["Legado Infernal", X.LEGADOS]].forEach(([g, o]) =>
  Object.entries(o).forEach(([k, v]) => add("opcao_especie", g + " · " + v[0], v[1], { grupo: g, chave: k, magias: v.slice(2) })));
add("opcao_especie", "Ancestralidade Dracônica", "Cor do dragão e o dano do sopro e da resistência.\n" + X.ANCESTRAIS.map(a => "- **" + a[0] + ":** " + a[1]).join("\n"), { cores: X.ANCESTRAIS });
for (const [k, v] of Object.entries(X.ORDEM_CLERIGO)) add("opcao_classe", "Ordem Divina · " + v[0], v[1], { classe: "Clérigo", chave: k });
for (const [k, v] of Object.entries(X.ORDEM_DRUIDA)) add("opcao_classe", "Ordem Primal · " + v[0], v[1], { classe: "Druida", chave: k });
for (const [k, v] of Object.entries(X.METAMAGIAS)) add("opcao_classe", "Metamagia · " + v[0], v[2], { classe: "Feiticeiro", chave: k, custo_pontos: v[1] });
for (const [k, v] of Object.entries(X.MANOBRAS)) add("opcao_classe", "Manobra · " + v[0], v[1], { classe: "Guerreiro (Mestre de Batalha)", chave: k });
[[X.INVOCACOES, 1], [X.INVOCACOES_N2, 2], [X.INVOCACOES_N5, 5], [X.INVOCACOES_ALTAS, 0]].forEach(([o, nv]) => Object.entries(o).forEach(([k, v]) =>
  add("opcao_classe", "Invocação Mística · " + v[0], v[1], { classe: "Bruxo", chave: k, nivel_minimo: nv || v[2], pede: X.INVOC_PEDE[k] || null })));
for (const [k, v] of Object.entries(X.TERRAS)) add("opcao_classe", "Círculo da Terra · " + v[0], "Magias do tipo de terra.\n" + [3, 5, 7, 9].map((l, i) => v[i + 1] ? "- **Nível " + l + ":** " + L(v[i + 1].map(m => (X.MAGIAS.find(x => x[0] === m) || [0, m])[1])) : "").filter(Boolean).join("\n"), { classe: "Druida", chave: k, magias: v.slice(1) });
for (const [k, v] of Object.entries(X.FERAS)) add("opcao_classe", "Companheiro Primal · " + v[0], v[1], { classe: "Patrulheiro (Mestre das Feras)", chave: k });
X.ARMAS.forEach(a => add("arma", a[1], (a[2] === "S" ? "Simples" : "Marcial") + (a[3] === "C" ? " corpo a corpo" : " à distância") + "\n- **Dano:** " + a[4] + " " + a[5] + "\n- **Propriedades:** " + (a[6].length ? L(a[6]) : "nenhuma") + "\n- **Maestria:** " + a[7] + (a[8] ? "\n- **Alcance:** " + a[8] : ""),
  { chave: a[0], categoria: a[2] === "S" ? "Simples" : "Marcial", tipo: a[3] === "C" ? "corpo a corpo" : "distância", dano: a[4], tipo_dano: a[5], propriedades: a[6], maestria: a[7], alcance: a[8] || null }));
X.ARMADURAS.forEach(a => add("armadura", a[1], a[2] + "\n- **CA:** " + a[3] + (a[4] === null ? " + Destreza" : a[4] ? " + Destreza (máx. " + a[4] + ")" : "") + (a[6] ? "\n- **Furtividade:** Desvantagem" : ""), { chave: a[0], categoria: a[2], ca: a[3], max_des: a[4], furtividade_desvantagem: !!a[6], linha: a }));
for (const [n, t] of Object.entries(X.MAESTRIA)) add("regra", "Maestria · " + n, t, { grupo: "Maestria de arma" });
for (const [n, t] of Object.entries(X.PROPRIEDADE)) add("regra", "Propriedade de arma · " + n, t, { grupo: "Propriedade de arma" });
for (const [n, t] of Object.entries(X.PACOTES)) add("equipamento", n, t, { grupo: "Pacote" });
X.BESTAS.forEach(b => add("besta", b[1], "Besta " + b[2] + ", ND " + b[3] + "\n- **CA:** " + b[4] + "\n- **Deslocamento:** " + b[5] + "\n- **FOR/DES/CON:** " + b[6] + "/" + b[7] + "/" + b[8] + "\n- **Sentidos:** " + b[9] + (b[10] ? "\n- **Perícias:** " + b[10] : "") + (b[11] ? "\n" + b[11] : "") + "\n" + b[12],
  { chave: b[0], tamanho: b[2], nd: b[3], ca: b[4], deslocamento: b[5], FOR: b[6], DES: b[7], CON: b[8], voa: !!b[13] }, SRD));
/* regras gerais e tabelas */
add("regra", "Aumento de Atributo ou Talento", X.TXT_ASI, { grupo: "Subir de nível" });
add("regra", "Ataque Extra", X.TXT_EXTRA, { grupo: "Subir de nível" });
add("regra", "Bônus de proficiência", "O bônus de proficiência depende do nível total do personagem.\n- **Níveis 1 a 4:** +2\n- **5 a 8:** +3\n- **9 a 12:** +4\n- **13 a 16:** +5\n- **17 a 20:** +6", { grupo: "Subir de nível", tabela: Array.from({ length: 20 }, (_, i) => Math.ceil((i + 1) / 4) + 1) });
add("regra", "Multiclasse", "Para entrar numa classe nova (ou sair da sua), o atributo principal das duas tem de ser 13 ou mais.\n" + Object.entries(X.MULTI_REQ).map(([c, g]) => "- **" + X.CLASSES[c].n + ":** " + g.map(x => x.map(nomeAtr).join(" ou ")).join(" e ") + " 13; ganha " + X.MULTI_GANHA[c].t).join("\n"), { grupo: "Subir de nível", pede: X.MULTI_REQ, ganha: X.MULTI_GANHA });
add("tabela", "Espaços de magia: conjurador completo e multiclasse", "Espaços por nível de conjurador (Bardo, Clérigo, Druida, Feiticeiro, Mago e a soma da multiclasse). Cada linha: espaços de nível 1, 2, 3...\n" + X.TAB_ESPACOS.slice(1).map((t, i) => "- **" + (i + 1) + ":** " + t.join(" / ")).join("\n"), { tabela: X.TAB_ESPACOS });
add("tabela", "Espaços de magia: Paladino e Patrulheiro", X.ESP_MEIO.slice(1).map((t, i) => "- **" + (i + 1) + ":** " + t.join(" / ")).join("\n"), { tabela: X.ESP_MEIO });
add("tabela", "Espaços de magia: Cavaleiro Arcano e Trapaceiro Arcano", X.ESP_TERCO.slice(3).map((t, i) => "- **" + (i + 3) + ":** " + t.join(" / ") + " (preparadas " + X.PREP_TERCO[i + 3] + ")").join("\n"), { tabela: X.ESP_TERCO, preparadas: X.PREP_TERCO });
add("tabela", "Magia de Pacto do Bruxo", X.PACTO.slice(1).map((t, i) => "- **" + (i + 1) + ":** " + t[0] + " espaços de nível " + t[1] + "; " + X.INVOC_N[i + 1] + " invocações").join("\n"), { pacto: X.PACTO, invocacoes: X.INVOC_N });
add("tabela", "Truques e magias preparadas por classe", Object.entries(X.PROG).map(([c, p]) => "- **" + X.CLASSES[c].n + ":** truques " + p.truques.join("/") + "; preparadas " + p.prep.join("/")).join("\n"), { prog: X.PROG });
add("regra", "Tendências", X.TENDENCIAS.map(t => "- " + t[1]).join("\n"), { lista: X.TENDENCIAS });
add("regra", "Idiomas", "- **Padrão:** " + L(X.IDIOMAS_PADRAO) + "\n- **Raros:** " + L(X.IDIOMAS_RAROS), { padrao: X.IDIOMAS_PADRAO, raros: X.IDIOMAS_RAROS });
add("regra", "Ferramentas", "- **Artesão:** " + L(X.ARTESAO) + "\n- **Instrumentos:** " + L(X.INSTRUMENTOS) + "\n- **Jogos:** " + L(X.JOGOS), { artesao: X.ARTESAO, instrumentos: X.INSTRUMENTOS, jogos: X.JOGOS });
fs.writeFileSync(path.join(__dirname, "livros.json"), JSON.stringify(out));
const por = {}; out.forEach(r => por[r.tipo] = (por[r.tipo] || 0) + 1);
console.log(out.length, "linhas", por, Math.round(fs.statSync(path.join(__dirname, "livros.json")).size / 1024) + " KB");
