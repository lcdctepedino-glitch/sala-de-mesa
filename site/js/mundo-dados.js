/* Mundo da mesa: leitura e gravação no Supabase (tabela mesa_conteudo). A prévia do claude.ai troca este arquivo por um falso.
   O mundo é do mestre (criado em mundos.html) e pode valer para várias mesas: páginas, textos, segredos e mapas são do MUNDO;
   o que os jogadores sabem (estado) e quem está na cena são desta MESA, em linhas tipo "descoberta" (mesa_id + lugar_id).
   Mapa desenhado no criador vira imagem aqui mesmo (js/mapa-desenho.js); para a sala, vira PNG na pasta <mesa>/mapas/. */
const MD = (() => {
  const M = smParam("m");
  let CANAL = null, W = null, DESC = {};
  const REND = {}, URLS = {};
  const ok = r => { if (r.error) throw r.error; return r.data };
  const slug = s => String(s || "mapa").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50) || "mapa";

  async function carregar() {
    const eu = (await smExigirLogin()).user;
    const mesa = ok(await sb.from("mesas").select("id,nome,mestre_id,imagem_atual,mundo_id").eq("id", M).maybeSingle());
    if (!mesa) throw new Error("sem mesa");
    const mestre = mesa.mestre_id === eu.id;
    W = mesa.mundo_id; DESC = {};
    let mapas = [], paginas = [], seg = {}, mundo = null, mundos = [];
    if (mestre) {
      mundos = ok(await sb.from("mesa_conteudo").select("id,nome").eq("tipo", "mundo").eq("dono_id", eu.id).order("nome"));
      if (W) {
        const [linhas, desc] = await Promise.all([
          sb.from("mesa_conteudo").select("*").eq("mundo_id", W).in("tipo", ["pagina", "mapa"]).order("criado_em"),
          sb.from("mesa_conteudo").select("id,lugar_id,estado,na_cena").eq("tipo", "descoberta").eq("mesa_id", M)]);
        ok(desc).forEach(d => DESC[d.lugar_id] = d);
        const ls = ok(linhas);
        mundo = mundos.find(x => x.id === W) || { id: W, nome: "Mundo" };
        mapas = ls.filter(l => l.tipo === "mapa").map(paraTelaMapa).filter(Boolean);
        paginas = ls.filter(l => l.tipo === "pagina").map(paraTela).sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
        paginas.forEach(p => seg[p.id] = p.segredo);
      }
    } else {
      const d = ok(await sb.rpc("mundo_jogador", { p_mesa: M }));
      if (d && d.mundo) { mundo = d.mundo; mapas = (d.mapas || []).map(paraTelaMapa).filter(Boolean); paginas = d.paginas || [] }
    }
    return { mesa: { id: M, nome: mesa.nome, imagem_atual: mesa.imagem_atual }, mestre, mundo, mundos, mapas, paginas, seg };
  }

  /* a tela recebe "tipo" = categoria da página, e o estado/na cena DESTA mesa */
  const paraTela = l => { const d = DESC[l.id] || {}; return { ...l, tipo: l.categoria, estado: d.estado || "oculto", na_cena: !!d.na_cena } };
  /* mapa desenhado: a tela recebe uma "imagem" que é desenhada aqui (chave desenho:...), do tamanho do desenho */
  function paraTelaMapa(r) {
    const dd = r.dados || {}, des = r.desenho || dd.desenho;
    const fonte = r.fonte || (dd.fonte === "imagem" && r.imagem ? "imagem" : des ? "desenho" : "imagem");
    const base = { id: r.id, nome: r.nome, lugar_id: r.lugar_id, criado_em: r.criado_em, arquivo: r.imagem || null };
    if (fonte === "desenho") {
      if (!des) return null;
      const ehP = !!r.lugar_id, [w, h] = dimsDoDesenho(ehP, des), marca = marcaDesenho(des), chave = "desenho:" + r.id + ":" + marca;
      REND[chave] = { ehP, des };
      return { ...base, imagem: chave, largura: w, altura: h, desenhado: true, tela: M + "/mapas/" + marca + "-" + slug(r.nome) + "__" + r.id.slice(0, 8) + ".png" };
    }
    if (!r.imagem) return null;
    return { ...base, imagem: r.imagem, largura: r.largura, altura: r.altura };
  }

  const CAMPOS = ["nome", "texto", "mapa_id", "x", "y"];
  async function salvarPagina(p) {
    const linha = {};
    CAMPOS.forEach(k => { if (k in p) linha[k] = p[k] });
    if ("tipo" in p) linha.categoria = p.tipo;
    let row;
    if (!p.id) row = ok(await sb.from("mesa_conteudo").insert({ ...linha, tipo: "pagina", mundo_id: W, categoria: linha.categoria || "Lugar" }).select().single());
    else if (Object.keys(linha).length) row = ok(await sb.from("mesa_conteudo").update(linha).eq("id", p.id).select().single());
    else row = ok(await sb.from("mesa_conteudo").select("*").eq("id", p.id).single());
    if ("estado" in p || "na_cena" in p) await descoberta(row.id, p);
    return paraTela(row);
  }
  /* o que esta mesa sabe do lugar: uma linha por mesa e lugar, criada só quando sai de "oculto" */
  async function descoberta(lugar, p) {
    const d = DESC[lugar] || {}, nova = { estado: p.estado ?? d.estado ?? "oculto", na_cena: p.na_cena ?? d.na_cena ?? false };
    if (!d.id && nova.estado === "oculto" && !nova.na_cena) return;
    if (d.id) ok(await sb.from("mesa_conteudo").update(nova).eq("id", d.id));
    else {
      const r = await sb.from("mesa_conteudo").insert({ tipo: "descoberta", nome: "descoberta", mesa_id: M, lugar_id: lugar, ...nova }).select("id").single();
      if (r.error && r.error.code === "23505") {   // outra aba criou antes: atualiza a que existe
        const ja = ok(await sb.from("mesa_conteudo").select("id").eq("tipo", "descoberta").eq("mesa_id", M).eq("lugar_id", lugar).single());
        ok(await sb.from("mesa_conteudo").update(nova).eq("id", ja.id)); nova.id = ja.id;
      } else nova.id = ok(r).id;
    }
    DESC[lugar] = { ...d, ...nova, lugar_id: lugar };
  }
  async function salvarSegredo(id, texto) {
    ok(await sb.from("mesa_conteudo").update({ segredo: texto }).eq("id", id));
  }
  /* apagar a página apaga no banco os mapas e as descobertas dela; as imagens saem do Storage aqui */
  async function apagarPagina(id, mapas) {
    ok(await sb.from("mesa_conteudo").delete().eq("id", id));
    const arqs = mapas.map(m => m.arquivo).filter(Boolean);
    if (arqs.length) await sb.storage.from("mesas").remove(arqs);
  }

  async function criarMapa(arq, nome, lugar_id) {
    const corpo = await smReduzir(arq, 4096, 3 * 1024 * 1024);
    const bmp = await createImageBitmap(corpo);
    const caminho = "mundos/" + W + "/" + smNomeArquivo(arq.name, corpo !== arq ? "jpg" : null);
    ok(await sb.storage.from("mesas").upload(caminho, corpo, { contentType: corpo.type || arq.type }));
    return paraTelaMapa(ok(await sb.from("mesa_conteudo").insert({ mundo_id: W, tipo: "mapa", nome, imagem: caminho, largura: bmp.width, altura: bmp.height, lugar_id, dados: { fonte: "imagem" } }).select().single()));
  }
  async function apagarMapa(m) {
    ok(await sb.from("mesa_conteudo").delete().eq("id", m.id));
    if (m.arquivo) await sb.storage.from("mesas").remove([m.arquivo]);
  }

  /* a sala mostra a imagem a todos. Mapa desenhado vira PNG em <mesa>/mapas/ (o nome muda quando o desenho muda;
     a versão antiga do mesmo mapa sai). Devolve o caminho que ficou na tela. */
  async function mostrar(m, nome) {
    let caminho = m.imagem;
    if (m.desenhado) {
      const { ehP, des } = REND[m.imagem], blob = await desenhoParaPNG(ehP, des, 2);
      caminho = m.tela;
      ok(await sb.storage.from("mesas").upload(caminho, blob, { contentType: "image/png", upsert: true }));
      try {
        const fim = "__" + m.id.slice(0, 8) + ".png", nomeNovo = caminho.split("/").pop();
        const velhos = (await smListar(M + "/mapas")).filter(f => f.name.endsWith(fim) && f.name !== nomeNovo).map(f => M + "/mapas/" + f.name);
        if (velhos.length) await sb.storage.from("mesas").remove(velhos);
      } catch (e) { }
    }
    ok(await sb.from("mesas").update({ imagem_atual: caminho, imagem_titulo: nome }).eq("id", M));
    return caminho;
  }

  async function usarMundo(id) { ok(await sb.from("mesas").update({ mundo_id: id }).eq("id", M)) }

  async function imagem(c) {
    if (!String(c).startsWith("desenho:")) return smImagem(c);
    if (!URLS[c]) { const { ehP, des } = REND[c]; URLS[c] = URL.createObjectURL(await desenhoParaPNG(ehP, des, ehP ? 3 : 2)) }
    return URLS[c];
  }
  function ouvir(cb) { CANAL = sb.channel("mundo-" + M).on("broadcast", { event: "mudou" }, cb).subscribe() }
  function avisar() { if (CANAL) CANAL.send({ type: "broadcast", event: "mudou", payload: {} }) }

  return { M, carregar, salvarPagina, salvarSegredo, apagarPagina, criarMapa, apagarMapa, mostrar, usarMundo, imagem, ouvir, avisar };
})();
