/* ================= Sala de Mesa: ponte para as fichas feitas no claude.ai ================= */
/* As fichas sob medida (Daibo) usam window.claude.use("db" | "assets" | "sample"). Aqui o mesmo jeito de chamar
   passa a guardar tudo na conta: o estado vai em fichas.dados.estado (linha ?f=<id>) e a foto no bucket pessoal/<uid>/.
   "sample" (Tirar dúvida) não existe fora do claude.ai: volta null e a página esconde o botão. */
(function () {
  const PONTE = { uid: null, linha: null, pagina: location.pathname.split("/").pop() || "" };
  let pronto = null;
  function preparar() {
    if (pronto) return pronto;
    pronto = (async () => {
      const s = await smExigirLogin();
      PONTE.uid = s.user.id;
      let q = sb.from("fichas").select("id,dados").eq("dono_id", PONTE.uid);
      const f = smParam("f");
      q = f ? q.eq("id", f) : q.eq("dados->>pagina", PONTE.pagina);
      const { data, error } = await q.limit(1);
      if (error) throw error;
      if (!data || !data[0]) throw new Error("ficha não encontrada");
      PONTE.linha = data[0];
      if (smParam("embed")) document.body.classList.add("embutido");
    })();
    return pronto;
  }

  async function gravarEstado(estado) {
    await preparar();
    const dados = Object.assign({}, PONTE.linha.dados, { estado });
    const { error } = await sb.from("fichas").update({ dados, atualizado_em: new Date().toISOString() }).eq("id", PONTE.linha.id);
    if (error) throw error;
    PONTE.linha.dados = dados;
  }
  async function lerEstado() {
    await preparar();
    const { data, error } = await sb.from("fichas").select("dados").eq("id", PONTE.linha.id).maybeSingle();
    if (error) throw error;
    if (data) PONTE.linha.dados = data.dados;
    return (PONTE.linha.dados || {}).estado || null;
  }

  const db = {
    doc() {
      return {
        set: gravarEstado,
        onSnapshot(cb, falhou) {
          const avisar = async () => {
            try { const e = await lerEstado(); cb({ exists: !!e, data: () => e, metadata: { hasPendingWrites: false } }) }
            catch (err) { if (falhou) falhou(err) }
          };
          avisar();
          /* Outro aparelho pode ter mudado a ficha: busca de novo quando a página volta a aparecer */
          document.addEventListener("visibilitychange", () => { if (!document.hidden) avisar() });
          return () => { };
        }
      };
    }
  };

  const assets = {
    async upload(arq, op) {
      await preparar();
      const id = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, "0")).join("");
      const { error } = await sb.storage.from("pessoal").upload(PONTE.uid + "/" + id, arq, { contentType: (op && op.type) || arq.type || "image/jpeg" });
      if (error) { const e = new Error(error.message); e.code = /size|large/i.test(error.message) ? "too_large" : /mime|type/i.test(error.message) ? "unsupported_type" : ""; throw e }
      return { id };
    },
    async delete(id) {
      await preparar();
      const { error } = await sb.storage.from("pessoal").remove([PONTE.uid + "/" + id]);
      if (error) throw error;
    }
  };

  /* Mostra a foto da ficha; guarda no aparelho para não baixar de novo */
  window.smFotoFicha = async function (img, id) {
    try {
      await preparar();
      const caminho = PONTE.uid + "/" + id, chave = "https://cache.sala-de-mesa/pessoal/" + caminho;
      let c = null, b = null;
      try { c = await caches.open("sala-imagens"); const r = await c.match(chave); if (r) b = await r.blob() } catch (e) { c = null }
      if (!b) {
        const { data, error } = await sb.storage.from("pessoal").download(caminho);
        if (error) throw error;
        b = data;
        if (c) { try { await c.put(chave, new Response(b, { headers: { "content-type": b.type } })) } catch (e) { } }
      }
      if (img.dataset.id === id) img.src = URL.createObjectURL(b);
    } catch (e) { if (img.onerror) img.onerror() }
  };

  window.claude = {
    async use(nome) {
      if (nome === "sample") return null;
      await preparar();
      if (nome === "db") return db;
      if (nome === "assets") return assets;
      return null;
    }
  };
})();
