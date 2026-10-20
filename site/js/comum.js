/* Sala de Mesa: ligação com o Supabase e utilidades das páginas (início, mesa, sala, criador) */
const SM_URL = "https://zrsakhmkdbjzrgebfgil.supabase.co";
const SM_CHAVE = "sb_publishable_M5JACq000fxx_sL7vVTRRA_s-0YLNtJ"; // chave pública: pode ficar no site
const sb = supabase.createClient(SM_URL, SM_CHAVE);

function smParam(k) { return new URLSearchParams(location.search).get(k) }

async function smSessao() { const { data } = await sb.auth.getSession(); return data.session }

/* Sem login, volta para o início e depois retorna para esta página */
async function smExigirLogin() {
  const s = await smSessao();
  if (!s) {
    location.replace("index.html?volta=" + encodeURIComponent(location.pathname.split("/").pop() + location.search));
    throw new Error("sem login");
  }
  return s;
}

function smEl(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in attrs || {}) {
    const v = attrs[k];
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") e.className = v;
    else if (k.startsWith("on")) e[k] = v;
    else if (k in e && !k.includes("-")) e[k] = v;
    else e.setAttribute(k, v === true ? "" : v);
  }
  kids.flat(9).forEach(c => { if (c !== null && c !== undefined && c !== false) e.append(c.nodeType ? c : document.createTextNode(String(c))) });
  return e;
}

/* Nome de arquivo seguro para o Storage, com a hora na frente para nunca repetir */
function smNomeArquivo(nome, ext) {
  const base = String(nome || "arquivo").replace(/\.[^.]+$/, "").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "arquivo";
  const e = ext || (String(nome).match(/\.([A-Za-z0-9]+)$/) || [, "bin"])[1].toLowerCase();
  return Date.now() + "-" + base + "." + e;
}
/* O que a pessoa lê: sem a hora da frente e sem a extensão */
function smNomeLegivel(arq) {
  return String(arq).replace(/^\d+-/, "").replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

/* Diminui a foto antes de enviar: lado maior até 2400 px e uns 700 KB. Economiza o tráfego do mês. */
async function smReduzir(arq, lado = 2400, alvo = 700 * 1024) {
  if (!/^image\/(jpeg|png|webp|heic|heif)/.test(arq.type)) return arq;
  let bmp;
  try { bmp = await createImageBitmap(arq) } catch (e) { return arq }
  const k = Math.min(1, lado / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const cx = cv.getContext("2d"); cx.fillStyle = "#000"; cx.fillRect(0, 0, w, h); cx.drawImage(bmp, 0, 0, w, h);
  let q = .86, b;
  do { b = await new Promise(r => cv.toBlob(r, "image/jpeg", q)); q -= .1 } while (b && b.size > alvo && q > .45);
  return b && b.size < arq.size ? b : arq;
}

/* Imagem guardada no aparelho: a mesma imagem não é baixada duas vezes */
async function smImagem(caminho) {
  const chave = "https://cache.sala-de-mesa/" + encodeURI(caminho);
  let c = null;
  try { c = await caches.open("sala-imagens"); const r = await c.match(chave); if (r) return URL.createObjectURL(await r.blob()) } catch (e) { c = null }
  const { data, error } = await sb.storage.from("mesas").download(caminho);
  if (error) throw error;
  if (c) { try { await c.put(chave, new Response(data, { headers: { "content-type": data.type } })) } catch (e) { } }
  return URL.createObjectURL(data);
}

/* Lista os arquivos de uma pasta da mesa, mais novos primeiro */
async function smListar(pasta) {
  const { data, error } = await sb.storage.from("mesas").list(pasta, { limit: 200, sortBy: { column: "created_at", order: "desc" } });
  if (error) throw error;
  return (data || []).filter(f => f.id && !f.name.startsWith("."));
}

/* Botão que pede um segundo toque para confirmar (o visualizador não tem confirm()) */
function smConfirmar(bt, texto, acao) {
  if (bt.dataset.conf) { acao(); return }
  const antes = bt.textContent; bt.dataset.conf = "1"; bt.textContent = texto; bt.classList.add("conf");
  setTimeout(() => { if (bt.isConnected) { delete bt.dataset.conf; bt.textContent = antes; bt.classList.remove("conf") } }, 3500);
}
