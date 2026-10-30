"""Monta as fichas sob medida do claude.ai (pasta paginas-fonte) como páginas do site.
paginas-fonte/<nome>.html é a página como está no claude.ai; ponte.js troca window.claude pela conta do site.
Rodar depois de copiar uma versão nova da ficha para paginas-fonte: python montar_paginas.py"""
import io, os
raiz = os.path.dirname(os.path.abspath(__file__))
fonte = os.path.join(raiz, "paginas-fonte")
ler = lambda f: io.open(os.path.join(fonte, f), encoding="utf-8").read()

def troca(t, velho, novo):
    assert t.count(velho) == 1, ("trecho não achado uma vez só", velho[:70])
    return t.replace(velho, novo)

PAGINAS = {"daibo.html": "Daibo"}

for arq, nome in PAGINAS.items():
    t = ler(arq)
    t = troca(t, "<!doctype html><html><head><meta charset=utf8>",
              '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="theme-color" content="#13171f"><link rel="icon" href="data:,">')
    # o visualizador do claude.ai põe box-sizing em tudo; sem isso as caixas do Background vazam para a direita
    t = troca(t, "</style></head>", "*,*::before,*::after{box-sizing:border-box}</style></head>")
    # a ponte entra antes do primeiro script da ficha, para window.claude já existir
    i = t.index("<script>")
    t = t[:i] + '<script src="js/supabase.js"></script>\n<script src="js/comum.js"></script>\n<script>\n' + ler("ponte.js") + "\n</script>\n" + t[i:]
    # a foto vinha de /_blob/<id> do claude.ai; agora vem do bucket pessoal
    t = troca(t, 'img.src="/_blob/"+id', "smFotoFicha(img,id)")
    io.open(os.path.join(raiz, "site", arq), "w", encoding="utf-8", newline="").write(t)
    print("ok", arq, len(t.encode("utf-8")) // 1024, "KB")
