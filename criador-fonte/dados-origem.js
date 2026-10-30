/* Antecedentes, espécies e talentos de origem (Livro do Jogador 2024). Resumos com palavras próprias.
   Formato dos textos: 1ª linha = o que faz; linhas "- " = itens (com **rótulo:**); "  - " = subitens. */
/* ferr: texto fixo, ou {esc:"artesao"|"instrumento"|"jogo"} para escolher. equip A: itens + po; B = 50 PO em todos. */
const ANTECEDENTES={
acolito:{n:"Acólito",atr:["INT","SAB","CAR"],tal:"iniciado",talOp:"Clérigo",per:["Intuição","Religião"],ferr:"Suprimentos de Caligrafia",
  eq:[["t","Suprimentos de Caligrafia"],["t","Livro (orações)"],["t","Símbolo Sagrado"],["t","Pergaminho (10 folhas)"],["t","Túnica"]],po:8,d:"Serviu num templo e estudou religião."},
artesao:{n:"Artesão",atr:["FOR","DES","INT"],tal:"artifice",per:["Investigação","Persuasão"],ferr:{esc:"artesao"},
  eq:[["mesmo","ferrAnt"],["t","2 Algibeiras"],["t","Roupas de Viajante"]],po:32,d:"Aprendeu um ofício numa oficina."},
charlatao:{n:"Charlatão",atr:["DES","CON","CAR"],tal:"habilidoso",per:["Enganação","Prestidigitação"],ferr:"Kit de Falsificação",
  eq:[["t","Kit de Falsificação"],["t","Fantasia"],["t","Roupas Finas"]],po:15,d:"Vivia de golpes e de vender ilusões."},
criminoso:{n:"Criminoso",atr:["DES","CON","INT"],tal:"alerta",per:["Prestidigitação","Furtividade"],ferr:"Ferramentas de Ladrão",
  eq:[["a","adaga",2],["t","Ferramentas de Ladrão"],["t","Pé de Cabra"],["t","2 Algibeiras"],["t","Roupas de Viajante"]],po:16,d:"Sobreviveu nos becos, furtando e arrombando."},
artista:{n:"Artista",atr:["FOR","DES","CAR"],tal:"musico",per:["Acrobacia","Atuação"],ferr:{esc:"instrumento"},
  eq:[["mesmo","ferrAnt"],["t","2 Fantasias"],["t","Espelho"],["t","Perfume"],["t","Roupas de Viajante"]],po:11,d:"Viveu nos palcos, entre aplausos."},
fazendeiro:{n:"Fazendeiro",atr:["FOR","CON","SAB"],tal:"vigoroso",per:["Adestrar Animais","Natureza"],ferr:"Ferramentas de Carpinteiro",
  eq:[["a","foice",1],["t","Ferramentas de Carpinteiro"],["t","Kit de Curandeiro"],["t","Panela de Ferro"],["t","Pá"],["t","Roupas de Viajante"]],po:30,d:"Cresceu cuidando da terra e dos animais."},
guarda:{n:"Guarda",atr:["FOR","INT","SAB"],tal:"alerta",per:["Atletismo","Percepção"],ferr:{esc:"jogo"},
  eq:[["a","lanca",1],["a","bestaleve",1],["t","20 Virotes"],["mesmo","ferrAnt"],["t","Lanterna Furta-fogo"],["t","Algemas"],["t","Aljava"],["t","Roupas de Viajante"]],po:12,d:"Vigiou muralhas e ruas de uma cidade."},
guia:{n:"Guia",atr:["DES","CON","SAB"],tal:"iniciado",talOp:"Druida",per:["Furtividade","Sobrevivência"],ferr:"Ferramentas de Cartógrafo",
  eq:[["a","arcocurto",1],["t","20 Flechas"],["t","Ferramentas de Cartógrafo"],["t","Saco de Dormir"],["t","Aljava"],["t","Barraca"],["t","Roupas de Viajante"]],po:3,d:"Conduziu viajantes pelos ermos."},
eremita:{n:"Eremita",atr:["CON","SAB","CAR"],tal:"curandeiro",per:["Medicina","Religião"],ferr:"Kit de Herbalismo",
  eq:[["a","bordao",1],["t","Kit de Herbalismo"],["t","Saco de Dormir"],["t","Livro (filosofia)"],["t","Lâmpada"],["t","Óleo (3 frascos)"],["t","Roupas de Viajante"]],po:16,d:"Viveu isolado, refletindo sobre a criação."},
mercador:{n:"Mercador",atr:["CON","INT","CAR"],tal:"sortudo",per:["Adestrar Animais","Persuasão"],ferr:"Ferramentas de Navegador",
  eq:[["t","Ferramentas de Navegador"],["t","2 Algibeiras"],["t","Roupas de Viajante"]],po:22,d:"Comprou e vendeu mercadorias pelas estradas."},
nobre:{n:"Nobre",atr:["FOR","INT","CAR"],tal:"habilidoso",per:["História","Persuasão"],ferr:{esc:"jogo"},
  eq:[["mesmo","ferrAnt"],["t","Roupas Finas"],["t","Perfume"]],po:29,d:"Cresceu num castelo, entre riqueza e poder."},
sabio:{n:"Sábio",atr:["CON","INT","SAB"],tal:"iniciado",talOp:"Mago",per:["Arcanismo","História"],ferr:"Suprimentos de Caligrafia",
  eq:[["a","bordao",1],["t","Suprimentos de Caligrafia"],["t","Livro (história)"],["t","Pergaminho (8 folhas)"],["t","Túnica"]],po:8,d:"Passou anos entre bibliotecas e mosteiros."},
marinheiro:{n:"Marinheiro",atr:["FOR","DES","SAB"],tal:"brigao",per:["Acrobacia","Percepção"],ferr:"Ferramentas de Navegador",
  eq:[["a","adaga",1],["t","Ferramentas de Navegador"],["t","Corda"],["t","Roupas de Viajante"]],po:20,d:"Viveu no mar, de porto em porto."},
escriba:{n:"Escriba",atr:["DES","INT","SAB"],tal:"habilidoso",per:["Investigação","Percepção"],ferr:"Suprimentos de Caligrafia",
  eq:[["t","Suprimentos de Caligrafia"],["t","Roupas Finas"],["t","Lâmpada"],["t","Óleo (3 frascos)"],["t","Pergaminho (12 folhas)"]],po:23,d:"Copiou e escreveu documentos num escritório ou mosteiro."},
soldado:{n:"Soldado",atr:["FOR","DES","CON"],tal:"atacante",per:["Atletismo","Intimidação"],ferr:{esc:"jogo"},
  eq:[["a","lanca",1],["a","arcocurto",1],["t","20 Flechas"],["mesmo","ferrAnt"],["t","Kit de Curandeiro"],["t","Aljava"],["t","Roupas de Viajante"]],po:14,d:"Treinou para a guerra desde jovem."},
andarilho:{n:"Andarilho",atr:["DES","SAB","CAR"],tal:"sortudo",per:["Intuição","Furtividade"],ferr:"Ferramentas de Ladrão",
  eq:[["a","adaga",2],["t","Ferramentas de Ladrão"],["esc","jogo"],["t","Saco de Dormir"],["t","2 Algibeiras"],["t","Roupas de Viajante"]],po:16,d:"Cresceu nas ruas, fazendo bicos para comer."}};

/* Talentos de origem */
const TALENTOS={
alerta:{n:"Alerta",x:"Você reage rápido quando a luta começa.\n- **Iniciativa:** soma o bônus de proficiência.\n- **Trocar de lugar:** logo depois de rolar Iniciativa, pode trocar a sua com a de um aliado que aceite (nenhum dos dois pode estar Incapacitado)."},
artifice:{n:"Artífice",esc:{tipo:"artesao",n:3},x:"Você sabe fabricar e comprar coisas melhor.\n- **Ferramentas:** proficiência com 3 Ferramentas de Artesão à sua escolha.\n- **Desconto:** 20% em itens não mágicos.\n- **Fabricar rápido:** ao fim de um descanso longo, faz um item simples ligado às suas ferramentas (escada, tocha, corda, balde, pá…). Ele se desfaz no próximo descanso longo."},
curandeiro:{n:"Curandeiro",x:"Você cuida de feridos com mais eficiência.\n- **Primeiros socorros:** com um Kit de Curandeiro, como ação Usar, trata uma criatura a até 1,5 m. Ela gasta um Dado de Vida; você rola e ela recupera o resultado + seu bônus de proficiência.\n- **Cura melhor:** ao rolar dados de cura (de magia ou deste talento), rola de novo os que derem 1."},
sortudo:{n:"Sortudo",uso:{max:"PB",volta:"longo"},x:"Você tem pontos de sorte para virar jogadas.\n- **Pontos de Sorte:** iguais ao seu bônus de proficiência. Voltam no descanso longo.\n- **Gaste 1 para:**\n  - ter Vantagem num Teste de D20 seu; ou\n  - dar Desvantagem num ataque contra você."},
iniciado:{n:"Iniciado em Magia",magia:1,x:"Você aprende um pouco de magia, mesmo sem ser conjurador.\n- **Lista:** Clérigo, Druida ou Mago (definida pelo antecedente).\n- **Ganha:** 2 truques e 1 magia de nível 1 dessa lista.\n- **Atributo:** Inteligência, Sabedoria ou Carisma, à sua escolha.\n- **Magia de nível 1:** sempre preparada. Conjura 1 vez sem gastar espaço; volta no descanso longo. Também pode usar seus espaços."},
musico:{n:"Músico",esc:{tipo:"instrumento",n:3},x:"Você toca e anima o grupo.\n- **Instrumentos:** proficiência com 3 Instrumentos Musicais.\n- **Canção de ânimo:** ao terminar um descanso curto ou longo, toca e dá Inspiração Heroica a aliados que ouçam. Quantos: igual ao seu bônus de proficiência."},
atacante:{n:"Atacante Selvagem",x:"Seus golpes com arma machucam mais.\n- **Efeito:** uma vez por turno, ao acertar com uma arma, role os dados de dano duas vezes e use o melhor resultado."},
habilidoso:{n:"Habilidoso",esc:{tipo:"periciaOuFerr",n:3},x:"Você aprende mais coisas.\n- **Ganha:** proficiência em 3 perícias ou ferramentas, em qualquer combinação."},
brigao:{n:"Brigão de Taverna",x:"Você é bom de briga sem arma.\n- **Soco:** seu Ataque Desarmado pode causar 1d4 + Força de dano Contundente. Rola de novo os 1 nesse dado.\n- **Objetos:** proficiência com armas improvisadas (cadeira, garrafa…).\n- **Empurrar:** uma vez por turno, ao acertar um Ataque Desarmado na ação de Ataque, também empurra o alvo 1,5 m."},
vigoroso:{n:"Vigoroso",x:"Você aguenta mais.\n- **Vida:** +2 PV máximos por nível de personagem (já somado na ficha)."}};

/* Espécies: [nome do traço, texto, uso (opcional)] */
const ESPECIES={
aasimar:{n:"Aasimar",tam:"MP",desl:9,visao:18,d:"Tocado por poderes celestiais.",
  tracos:[["Resistência Celestial","Danos de luz e de morte machucam menos.\n- **Efeito:** leva metade do dano Necrótico e Radiante."],["Visão no Escuro","Você enxerga no escuro.\n- **Alcance:** 18 m, em tons de cinza."],
   ["Mãos Curativas","Você cura com um toque.\n- **Como:** ação de Magia, tocando uma criatura.\n- **Cura:** role d4s iguais ao seu bônus de proficiência e cure o total.\n- **Usos:** 1. Volta no descanso longo.",{max:1,volta:"longo"}],
   ["Portador da Luz","Você sabe criar luz.\n- **Truque:** Luz, com Carisma."],
   ["Revelação Celestial","A partir do nível 3, você pode se transformar por 1 minuto.\n- **Formas:** asas, brilho ou mortalha.\n- **Usos:** 1. Volta no descanso longo."]],truques:[["luz","CAR"]]},
draconato:{n:"Draconato",tam:"M",desl:9,visao:18,d:"Descendente de dragões, com escamas e sopro.",esc:"ancestral",
  tracos:[["Ancestralidade Dracônica","Seu dragão ancestral define o tipo do seu sopro e da sua resistência.\n- **Escolha:** o tipo de dragão (veja na criação)."],
   ["Sopro","Você solta um sopro de energia.\n- **Quando:** ao usar a ação de Ataque, troca um dos ataques pelo sopro.\n- **Formato:** cone de 4,5 m ou linha de 9 m × 1,5 m.\n- **Quem está na área:** faz resistência de Destreza (CD 8 + Constituição + proficiência).\n- **Dano:** 1d10 do tipo do seu dragão. Metade se passar.\n- **Usos:** iguais ao bônus de proficiência. Voltam no descanso longo.",{max:"PB",volta:"longo"}],
   ["Resistência a Dano","Leva metade do dano do tipo do seu dragão."],["Visão no Escuro","Você enxerga no escuro.\n- **Alcance:** 18 m, em tons de cinza."],
   ["Voo Dracônico","A partir do nível 5, você cria asas espectrais e voa.\n- **Como:** Ação Bônus. Dura 10 minutos.\n- **Efeito:** Deslocamento de voo igual ao seu.\n- **Usos:** 1. Volta no descanso longo."]]},
anao:{n:"Anão",tam:"M",desl:9,visao:36,pvNivel:1,d:"Resistente como as montanhas.",
  tracos:[["Visão no Escuro","Você enxerga bem no escuro.\n- **Alcance:** 36 m, em tons de cinza."],["Resiliência Anã","Veneno quase não pega em você.\n- **Dano de Veneno:** leva metade.\n- **Envenenado:** Vantagem nas resistências para evitar ou acabar com a condição."],
   ["Robustez Anã","Você tem mais vida.\n- **Vida:** +1 PV máximo por nível (já somado na ficha)."],
   ["Conhecimento da Pedra","Você sente movimento através da pedra.\n- **Como:** Ação Bônus, tocando uma superfície de pedra.\n- **Efeito:** Sentido Sísmico de 18 m por 10 minutos (percebe quem se move no chão).\n- **Usos:** iguais ao bônus de proficiência. Voltam no descanso longo.",{max:"PB",volta:"longo"}]]},
elfo:{n:"Elfo",tam:"M",desl:9,visao:18,d:"Povo feérico de vida longa.",esc:"linhagemElfo",per:{n:1,de:["Intuição","Percepção","Sobrevivência"]},
  tracos:[["Visão no Escuro","Você enxerga no escuro.\n- **Alcance:** 18 m (36 m se for Drow)."],["Linhagem Élfica","Sua linhagem dá magia.\n- **Agora:** um truque.\n- **Níveis 3 e 5:** uma magia nova em cada, que você conjura 1 vez por descanso longo sem gastar espaço."],
   ["Ancestralidade Feérica","É difícil enfeitiçar você.\n- **Efeito:** Vantagem nas resistências para evitar ou acabar com a condição Enfeitiçado."],
   ["Sentidos Aguçados","Seus sentidos são apurados.\n- **Ganha:** proficiência em Intuição, Percepção ou Sobrevivência."],
   ["Transe","Você não dorme: medita.\n- **Efeito:** magia não faz você dormir, e o descanso longo leva só 4 horas."]]},
gnomo:{n:"Gnomo",tam:"P",desl:9,visao:18,d:"Pequenos, curiosos e cheios de magia.",esc:"linhagemGnomo",
  tracos:[["Visão no Escuro","Você enxerga no escuro.\n- **Alcance:** 18 m, em tons de cinza."],["Astúcia Gnômica","Sua mente é difícil de enganar.\n- **Efeito:** Vantagem nas resistências de Inteligência, Sabedoria e Carisma."],
   ["Linhagem Gnômica","Sua linhagem dá pequenas magias.\n- **Escolha:** Gnomo da Floresta ou Gnomo das Rochas (veja na criação)."]]},
golias:{n:"Golias",tam:"M",desl:10.5,visao:0,d:"Descendente distante de gigantes.",esc:"gigante",
  tracos:[["Ancestralidade Gigante","Seu ancestral gigante lhe deu um dom.\n- **Escolha:** um dom de gigante (veja na criação).\n- **Usos:** iguais ao bônus de proficiência. Voltam no descanso longo.",{max:"PB",volta:"longo"}],
   ["Forma Grande","A partir do nível 5, você cresce até o tamanho Grande.\n- **Como:** Ação Bônus, se houver espaço. Dura 10 minutos.\n- **Efeito:** Vantagem nos testes de Força e +3 m de Deslocamento.\n- **Usos:** 1. Volta no descanso longo."],
   ["Constituição Poderosa","Você é forte como um gigante.\n- **Agarrado:** Vantagem para escapar.\n- **Carga:** conta como um tamanho maior para carregar peso."]]},
halfling:{n:"Halfling",tam:"P",desl:9,visao:0,d:"Pequenos, corajosos e de sorte famosa.",
  tracos:[["Bravura","É difícil assustar você.\n- **Efeito:** Vantagem nas resistências para evitar ou acabar com a condição Amedrontado."],
   ["Agilidade Halfling","Você passa entre os maiores.\n- **Efeito:** pode atravessar o espaço de criaturas um tamanho maiores (sem parar ali)."],
   ["Sorte","O azar quase não pega você.\n- **Efeito:** ao tirar 1 no d20 de um Teste de D20, rola de novo e usa o novo resultado."],
   ["Furtividade Natural","Você se esconde atrás dos outros.\n- **Efeito:** pode se Esconder atrás de uma criatura pelo menos um tamanho maior."]]},
humano:{n:"Humano",tam:"MP",desl:9,visao:0,d:"Versáteis e ambiciosos.",per:{n:1,de:"todas"},talExtra:1,
  tracos:[["Engenhoso","Você sempre acorda inspirado.\n- **Efeito:** ganha Inspiração Heroica ao terminar um descanso longo."],["Habilidoso","Você aprende rápido.\n- **Ganha:** proficiência em uma perícia à sua escolha."],
   ["Versátil","Você tem um talento a mais.\n- **Ganha:** um talento de Origem à sua escolha. O livro sugere Habilidoso."]]},
orc:{n:"Orc",tam:"M",desl:9,visao:36,d:"Fortes e incansáveis, filhos de Gruumsh.",
  tracos:[["Fúria de Adrenalina","Você dispara e ganha fôlego extra.\n- **Como:** Ação Bônus para a ação Disparada.\n- **Bônus:** PV temporários iguais ao seu bônus de proficiência.\n- **Usos:** iguais ao bônus de proficiência. Voltam no descanso curto ou longo.",{max:"PB",volta:"curto"}],
   ["Visão no Escuro","Você enxerga bem no escuro.\n- **Alcance:** 36 m, em tons de cinza."],["Resistência Implacável","Você se recusa a cair.\n- **Efeito:** ao cair a 0 PV sem morrer na hora, fica com 1 PV.\n- **Usos:** 1. Volta no descanso longo.",{max:1,volta:"longo"}]]},
tiferino:{n:"Tiferino",tam:"MP",desl:9,visao:18,d:"Herdeiro de um legado infernal.",esc:"legado",
  tracos:[["Visão no Escuro","Você enxerga no escuro.\n- **Alcance:** 18 m, em tons de cinza."],["Legado Infernal","Seu legado dá resistência e magia.\n- **Agora:** uma resistência e um truque.\n- **Níveis 3 e 5:** uma magia nova em cada, que você conjura 1 vez por descanso longo sem gastar espaço."],
   ["Presença de Outro Mundo","Você faz pequenos sinais assustadores.\n- **Truque:** Taumaturgia, com o mesmo atributo do Legado."]],truques:[["taumaturgia","legado"]]}};

const ANCESTRAIS=[["Azul","Elétrico"],["Branco","Frio"],["Bronze","Elétrico"],["Cobre","Ácido"],["Latão","Fogo"],["Negro","Ácido"],["Ouro","Fogo"],["Prata","Frio"],["Verde","Veneno"],["Vermelho","Fogo"]];
/* textos de escolha: só itens; a ficha põe o nome na primeira linha */
const LINHAGEM_ELFO={
 drow:["Drow","- **Agora:** Visão no Escuro passa a 36 m e você ganha o truque Globos de Luz.\n- **Nível 3:** Fogo das Fadas.\n- **Nível 5:** Escuridão.","luzes"],
 alto:["Alto Elfo","- **Agora:** truque Prestidigitação. Pode trocá-lo por outro truque de Mago a cada descanso longo.\n- **Nível 3:** Detectar Magia.\n- **Nível 5:** Passo Nebuloso.","prestidigitacao"],
 floresta:["Elfo da Floresta","- **Agora:** Deslocamento de 10,5 m e o truque Arte Druídica.\n- **Nível 3:** Passos Largos.\n- **Nível 5:** Passos sem Rastro.","arteDruidica"]};
const LINHAGEM_GNOMO={
 floresta:["Gnomo da Floresta","- **Truque:** Ilusão Menor.\n- **Falar com Animais:** sempre preparada. Conjura sem gastar espaço vezes iguais ao bônus de proficiência; voltam no descanso longo.",["ilusaomenor"]],
 rochas:["Gnomo das Rochas","- **Truques:** Remendar e Prestidigitação.\n- **Mecanismos:** em 10 minutos cria um pequeno mecanismo de relógio que repete um efeito de Prestidigitação. Até 3 de uma vez.",["remendar","prestidigitacao"]]};
const GIGANTES={
 nuvem:["Salto das Nuvens","- **Efeito:** Ação Bônus para se teleportar até 9 m, para um lugar que você vê."],
 fogo:["Queimadura de Fogo","- **Efeito:** ao acertar e causar dano, +1d10 de dano de Fogo."],
 gelo:["Frio Congelante","- **Efeito:** ao acertar e causar dano, +1d6 de Frio, e o Deslocamento do alvo cai 3 m até o início do seu turno."],
 colina:["Tombo da Colina","- **Efeito:** ao acertar uma criatura Grande ou menor e causar dano, pode deixá-la Caída."],
 pedra:["Resistência da Pedra","- **Efeito:** Reação ao sofrer dano. Role 1d12 + Constituição e reduza o dano nesse total."],
 tempestade:["Trovão da Tempestade","- **Efeito:** Reação ao sofrer dano de uma criatura a até 18 m. Ela sofre 1d8 de dano Trovejante."]};
const LEGADOS={
 abissal:["Abissal","- **Resistência:** leva metade do dano de Veneno.\n- **Truque:** Rajada de Veneno.\n- **Nível 3:** Raio Adoecente. **Nível 5:** Imobilizar Pessoa.","rajadaveneno","Veneno"],
 ctonico:["Ctônico","- **Resistência:** leva metade do dano Necrótico.\n- **Truque:** Toque Arrepiante.\n- **Nível 3:** Vida Falsa. **Nível 5:** Raio do Enfraquecimento.","toquearrepiante","Necrótico"],
 infernal:["Infernal","- **Resistência:** leva metade do dano de Fogo.\n- **Truque:** Raio de Fogo.\n- **Nível 3:** Repreensão Infernal. **Nível 5:** Escuridão.","raiofogo","Fogo"]};
