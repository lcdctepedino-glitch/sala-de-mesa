/* ================= Sala de Mesa: as fichas ficam na conta (Supabase) ================= */
/* Substitui carregar() e gravar() do criador. O personagem em criação e a ficha aberta ficam no aparelho; as fichas prontas vão para a tabela fichas.
   ?ver=<linha>: o mestre vendo, da sala, a ficha de um jogador da mesa. Só leitura: abre aquela ficha e nada é gravado. */
const NUVEM = { uid: null, lista: {}, linha: {}, salvo: {}, soVer: !!smParam("ver") };  // linha: id do personagem → id da linha; salvo: o que já está na conta
const LS_NUVEM = () => "sala-criador-" + NUVEM.uid;
function carregar() {
  DB = { lista: NUVEM.lista, atual: null, rasc: null };
  if (NUVEM.soVer) { DB.atual = Object.keys(NUVEM.lista)[0] || null; return }
  try { const d = JSON.parse(localStorage.getItem(LS_NUVEM()) || "null"); if (d) { DB.atual = d.atual && DB.lista[d.atual] ? d.atual : null; DB.rasc = d.rasc || null } } catch (e) { }
  const f = smParam("f"); if (f && DB.lista[f]) DB.atual = f;
}
function gravar(ja) {
  clearTimeout(tGravar);
  if (NUVEM.soVer) return;
  const f = () => { try { localStorage.setItem(LS_NUVEM(), JSON.stringify({ atual: DB.atual, rasc: DB.rasc })) } catch (e) { } sincronizar() };
  if (ja) f(); else tGravar = setTimeout(f, 250);
}
let sincRodando = false, sincDeNovo = false, avisoNuvem = false;
async function sincronizar() {
  if (NUVEM.soVer) return;
  if (sincRodando) { sincDeNovo = true; return }
  sincRodando = true;
  try {
    for (const pid in DB.lista) {
      const P = DB.lista[pid], j = JSON.stringify(P);
      if (NUVEM.salvo[pid] === j) continue;
      const id = NUVEM.linha[pid] || (NUVEM.linha[pid] = crypto.randomUUID());
      const { error } = await sb.from("fichas").upsert({ id, nome: P.nome || "Sem nome", versao: "2024", dados: P });
      if (error) throw error;
      NUVEM.salvo[pid] = j;
    }
    for (const pid in NUVEM.salvo) {
      if (DB.lista[pid]) continue;
      const { error } = await sb.from("fichas").delete().eq("id", NUVEM.linha[pid]);
      if (error) throw error;
      delete NUVEM.salvo[pid]; delete NUVEM.linha[pid];
    }
    if (avisoNuvem) { avisoNuvem = false; aviso("") }
  } catch (e) {
    avisoNuvem = true; aviso("Não consegui salvar na sua conta agora. Confira a internet; eu tento de novo sozinho.");
    setTimeout(sincronizar, 15000);
  } finally {
    sincRodando = false;
    if (sincDeNovo) { sincDeNovo = false; sincronizar() }
  }
}
(async () => {
  let s; try { s = await smExigirLogin() } catch (e) { return }
  NUVEM.uid = s.user.id;
  const q = sb.from("fichas").select("id,dados");
  const { data, error } = await (NUVEM.soVer ? q.eq("id", smParam("ver")) : q.eq("dono_id", NUVEM.uid));
  if (error) { aviso("Não consegui abrir as suas fichas. Confira a internet e recarregue a página."); return }
  (data || []).forEach(r => { const P = r.dados; if (!P || !P.id) return; NUVEM.lista[P.id] = P; NUVEM.linha[P.id] = r.id; NUVEM.salvo[P.id] = JSON.stringify(P) });
  if (smParam("embed")) document.body.classList.add("embutido");
  if (NUVEM.soVer && !data.length) { aviso("Não consegui abrir esta ficha. Ela pode ter saído da mesa."); return }
  iniciar();
  if (NUVEM.soVer) aviso("Você está vendo a ficha de um jogador. O que mudar aqui não é salvo.");
})();
