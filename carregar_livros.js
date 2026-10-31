/* Manda livros.json para a tabela livros do Supabase, em lotes.
   Ninguém grava em livros pela API: antes de rodar, crio pelo MCP do Supabase a função temporária
   public.carregar_livros_tmp(chave, linhas) com uma chave de uso único, e apago a função logo depois.
   Rodar: node carregar_livros.js <chave> */
const fs = require("fs"), path = require("path");
const URL = "https://zrsakhmkdbjzrgebfgil.supabase.co/rest/v1/rpc/carregar_livros_tmp", KEY = "sb_publishable_M5JACq000fxx_sL7vVTRRA_s-0YLNtJ";
(async () => {
  const linhas = JSON.parse(fs.readFileSync(path.join(__dirname, "livros.json"), "utf8")); let total = 0;
  for (let i = 0; i < linhas.length; i += 150) {
    const r = await fetch(URL, { method: "POST", headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" }, body: JSON.stringify({ chave: process.argv[2], linhas: linhas.slice(i, i + 150) }) });
    const t = await r.text(); if (!r.ok) throw new Error("lote " + i + ": " + r.status + " " + t);
    total += +t; console.log("lote", i, "→", t);
  }
  console.log("total gravado:", total, "de", linhas.length);
})().catch(e => { console.error(e.message); process.exit(1) });
