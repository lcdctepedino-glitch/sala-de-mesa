"""Monta a prévia do Mundo para o claude.ai: site/mundo.html com o CSS embutido e o banco trocado pelo mundo de exemplo.
Uso: python previa/montar_previa_mundo.py <arquivo de saída>"""
import io, os, sys
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ler = lambda *c: io.open(os.path.join(raiz, *c), encoding="utf-8").read()

def troca(t, velho, novo):
    assert t.count(velho) == 1, ("trecho não achado uma vez só", velho[:70])
    return t.replace(velho, novo)

t = ler("site", "mundo.html")
# o claude.ai põe o esqueleto da página; fica só do <title> em diante
t = t[t.index("<title>"):]
t = troca(t, "<title>Mundo · Sala de Mesa</title>", "<title>Prévia do Mundo</title>")
t = troca(t, '<link rel="stylesheet" href="js/base.css">', "<style>\n" + ler("site", "js", "base.css") + "\n</style>")
t = troca(t, '<script src="js/supabase.js"></script>\n<script src="js/comum.js"></script>\n<script src="js/mundo-dados.js"></script>',
          "<script>\n" + ler("previa", "mundo-falso.js") + "\n</script>")
t = troca(t, "mesa.html?m=", "#m=")
# faixa de cima da prévia: trocar entre mestre e jogador
faixa = """<div id="previa" role="group" aria-label="Prévia"><span>Prévia com um mundo de exemplo. Entrar como:</span><button type="button" data-papel="mestre" aria-pressed="true">Mestre</button><button type="button" data-papel="jogador" aria-pressed="false">Jogador</button></div>
<style>#previa{position:fixed;z-index:20;top:0;left:0;right:0;height:38px;display:flex;gap:8px;align-items:center;justify-content:center;background:var(--card);border-bottom:1px solid var(--line);font-size:13px;color:var(--mute);padding:0 max(16px,env(safe-area-inset-right,0px)) 0 max(16px,env(safe-area-inset-left,0px));white-space:nowrap;overflow-x:auto}
#previa button{background:none;border:1px solid var(--borda);color:var(--ink);border-radius:9px;padding:3px 10px;font:700 13px var(--f-ui);cursor:pointer}
#previa button[aria-pressed="true"]{background:var(--ink);color:var(--bg)}
#app{top:38px}</style>
<script>document.querySelectorAll("#previa [data-papel]").forEach(b=>b.onclick=()=>{MD.trocarPapel(b.dataset.papel);document.querySelectorAll("#previa [data-papel]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));iniciar()});</script>
</body>"""
t = troca(t, "</body>", faixa)
saida = sys.argv[1]
io.open(saida, "w", encoding="utf-8", newline="").write(t)
print("ok", saida, len(t.encode("utf-8")) // 1024, "KB")
