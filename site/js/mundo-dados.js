/* Mundo: leitura e gravação no Supabase. A prévia do claude.ai troca este arquivo por um falso, com o mundo de exemplo. */
const MD = (() => {
  const M = smParam("m");
  let CANAL = null;
  const ok = r => { if (r.error) throw r.error; return r.data };

  async function carregar() {
    const eu = (await smExigirLogin()).user;
    const mesa = ok(await sb.from("mesas").select("id,nome,mestre_id,imagem_atual").eq("id", M).maybeSingle());
    if (!mesa) throw new Error("sem mesa");
    const mestre = mesa.mestre_id === eu.id;
    let mapas, paginas, seg = {};
    if (mestre) {
      /* uma tabela só (mesa_conteudo); a tela continua recebendo "tipo" = categoria da página */
      const linhas = ok(await sb.from("mesa_conteudo").select("*").eq("mesa_id", M).in("tipo", ["pagina", "mapa"]).order("criado_em"));
      mapas = linhas.filter(l => l.tipo === "mapa");
      paginas = linhas.filter(l => l.tipo === "pagina").map(paraTela).sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
      paginas.forEach(p => seg[p.id] = p.segredo);
    } else {
      const d = ok(await sb.rpc("mundo_jogador", { p_mesa: M }));
      mapas = d.mapas; paginas = d.paginas;
    }
    return { mesa: { id: M, nome: mesa.nome, imagem_atual: mesa.imagem_atual }, mestre, mapas, paginas, seg };
  }

  const paraTela = l => ({ ...l, tipo: l.categoria });
  const CAMPOS = ["nome", "texto", "estado", "mapa_id", "x", "y", "na_cena"];
  async function salvarPagina(p) {
    const linha = { mesa_id: M, tipo: "pagina" };
    CAMPOS.forEach(k => { if (k in p) linha[k] = p[k] });
    if ("tipo" in p) linha.categoria = p.tipo;
    if (!p.id) { linha.estado ??= "oculto"; linha.categoria ??= "Lugar" }
    const q = p.id ? sb.from("mesa_conteudo").update(linha).eq("id", p.id) : sb.from("mesa_conteudo").insert(linha);
    return paraTela(ok(await q.select().single()));
  }
  async function salvarSegredo(id, texto) {
    ok(await sb.from("mesa_conteudo").update({ segredo: texto }).eq("id", id));
  }
  /* apagar a página apaga no banco os mapas dela; as imagens saem do Storage aqui */
  async function apagarPagina(id, mapas) {
    ok(await sb.from("mesa_conteudo").delete().eq("id", id));
    if (mapas.length) await sb.storage.from("mesas").remove(mapas.map(m => m.imagem));
  }

  async function criarMapa(arq, nome, lugar_id) {
    const corpo = await smReduzir(arq, 4096, 3 * 1024 * 1024);
    const bmp = await createImageBitmap(corpo);
    const caminho = M + "/mundo/" + smNomeArquivo(arq.name, corpo !== arq ? "jpg" : null);
    ok(await sb.storage.from("mesas").upload(caminho, corpo, { contentType: corpo.type || arq.type }));
    return ok(await sb.from("mesa_conteudo").insert({ mesa_id: M, tipo: "mapa", nome, imagem: caminho, largura: bmp.width, altura: bmp.height, lugar_id }).select().single());
  }
  async function apagarMapa(m) {
    ok(await sb.from("mesa_conteudo").delete().eq("id", m.id));
    await sb.storage.from("mesas").remove([m.imagem]);
  }

  /* a sala mostra a imagem do mapa a todos, pelo mesmo caminho do "Mostrar para todos" de lá */
  async function mostrar(m, nome) {
    ok(await sb.from("mesas").update({ imagem_atual: m.imagem, imagem_titulo: nome }).eq("id", M));
  }

  const imagem = c => smImagem(c);
  function ouvir(cb) { CANAL = sb.channel("mundo-" + M).on("broadcast", { event: "mudou" }, cb).subscribe() }
  function avisar() { if (CANAL) CANAL.send({ type: "broadcast", event: "mudou", payload: {} }) }

  return { M, carregar, salvarPagina, salvarSegredo, apagarPagina, criarMapa, apagarMapa, mostrar, imagem, ouvir, avisar };
})();
