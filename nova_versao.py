"""Marca uma versão nova do site antes de publicar (o app da tela de início do iPhone se atualiza sozinho com isso).

Troca, todos juntos: site/versao.json, o <meta name="sm-versao"> das páginas e o ?v= dos arquivos js/ e css/ delas.
Uso:  python nova_versao.py          (versão = data de hoje + a próxima letra: 20261106a, 20261106b, ...)
      python nova_versao.py 20261107a
"""
import datetime, json, pathlib, re, sys

SITE = pathlib.Path(__file__).parent / "site"
arq = SITE / "versao.json"
atual = json.loads(arq.read_text(encoding="utf-8"))["v"] if arq.exists() else ""

if len(sys.argv) > 1:
    nova = sys.argv[1]
else:
    hoje = datetime.date.today().strftime("%Y%m%d")
    letra = "a" if not atual.startswith(hoje) else chr(ord(atual[-1]) + 1)
    nova = hoje + letra

arq.write_text(json.dumps({"v": nova}) + "\n", encoding="utf-8")
for p in sorted(SITE.glob("*.html")):
    t = p.read_text(encoding="utf-8")
    if 'name="sm-versao"' not in t:
        continue   # página que ainda não participa da conferência de versão
    t2 = re.sub(r'(<meta name="sm-versao" content=")[^"]*(")', r"\g<1>" + nova + r"\2", t)
    t2 = re.sub(r'((?:src|href)="js/[\w.-]+\.(?:js|css))\?v=\d{8}\w*"', r'\1?v=' + nova + '"', t2)
    if t2 != t:
        p.write_text(t2, encoding="utf-8")
        print("atualizada:", p.name)
print(f"versão {atual or '(nenhuma)'} -> {nova}")
