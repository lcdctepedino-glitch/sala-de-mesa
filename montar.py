"""Monta site/criador.html a partir do criador de personagens (pasta criador-fonte) + nuvem.js.
Rodar depois de mudar qualquer arquivo de criador-fonte: python montar.py"""
import io, os, re
raiz = os.path.dirname(os.path.abspath(__file__))
fonte = os.path.join(raiz, "criador-fonte")
ler = lambda f: io.open(os.path.join(fonte, f), encoding="utf-8").read()

def troca(t, velho, novo):
    assert t.count(velho) == 1, ("trecho não achado uma vez só", velho[:70])
    return t.replace(velho, novo)

corpo = ler("corpo.html")
corpo = troca(corpo, '<div class="gut topo-ini">', '<div class="gut topo-ini">\n      <a class="lnk" href="index.html" style="display:inline-block;margin-bottom:6px">‹ Início</a>')
corpo = troca(corpo, "As fichas ficam guardadas neste aparelho, neste navegador. Abra sempre pelo mesmo navegador e copie a ficha de vez em quando para não perder.",
              "As fichas ficam guardadas na sua conta e abrem em qualquer aparelho em que você entrar.")
corpo = troca(corpo, "Recebeu uma ficha no WhatsApp ou perdeu a sua? Copie a mensagem inteira e cole aqui.",
              "Tem uma ficha antiga em texto, do WhatsApp? Copie a mensagem inteira e cole aqui: ela passa a ficar na sua conta.")

niveis = troca(ler("app-niveis.js"), "\niniciar();\n", "\n")  # quem inicia agora é o nuvem.js, depois de buscar as fichas
js = "\n".join([ler(f) for f in ["dados-base.js", "dados-classes.js", "dados-origem.js", "dados-magias.js", "dados-niveis.js", "dados-niveis-altos.js", "dados-bestas.js", "dados-bestas-altas.js", "app.js"]] + [niveis, ler("app-ficha.js"), ler("nuvem.js")])
# na conta a ficha já fica salva sozinha: sai "Guardar a ficha" (copiar o texto para o WhatsApp), fica só o Apagar
GUARDAR = re.compile(r'secT\("Guardar a ficha"\),el\("p",\{class:"nota"\},"A ficha fica guardada neste aparelho\.[^"]*"\),\s*el\("div",\{class:"linha"\},el\("button",\{class:"bt",type:"button",onclick:e=>copiarFicha\(P,e\.currentTarget\)\},"Copiar ficha"\),(el\("button",\{class:"bt sec".*?"Apagar personagem"\))\),\s*el\("textarea",\{id:"cod-manual".*?\),el\("p",\{class:"nota",id:"st-copiar"\}\)', re.S)
APAGAR = lambda x: 'secT("Apagar personagem"),el("p",{class:"nota"},"Apaga a ficha da sua conta, em todos os aparelhos. Não dá para desfazer."),el("div",{class:"linha"},' + x.group(1) + ')'
js, n = GUARDAR.subn(APAGAR, js)
assert n == 3, ("Guardar a ficha achado", n)

html = """<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0b0b0d">\n<link rel="icon" href="data:,">
<title>Personagens · Sala de Mesa</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400;0,700;1,400&family=IM+Fell+English+SC&display=swap">
<style>
""" + ler("estilo.css") + """
body.embutido .barra-f{display:none}
</style>
</head>
<body>
""" + corpo + """
<script src="js/supabase.js"></script>
<script src="js/comum.js"></script>
<script>
""" + js + """
</script>
</body>
</html>
"""
io.open(os.path.join(raiz, "site", "criador.html"), "w", encoding="utf-8", newline="").write(html)
print("ok", len(html.encode("utf-8")) // 1024, "KB")
