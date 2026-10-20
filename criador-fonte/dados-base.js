/* Dados básicos do criador (regras de 2024). Resumos com palavras próprias; números conferidos no Livro do Jogador 2024. */
const ATR=["FOR","DES","CON","INT","SAB","CAR"];
const ATR_N={FOR:"Força",DES:"Destreza",CON:"Constituição",INT:"Inteligência",SAB:"Sabedoria",CAR:"Carisma"};
const SK=[["Acrobacia","DES"],["Adestrar Animais","SAB"],["Arcanismo","INT"],["Atletismo","FOR"],["Atuação","CAR"],["Enganação","CAR"],["Furtividade","DES"],["História","INT"],["Intimidação","CAR"],["Intuição","SAB"],["Investigação","INT"],["Medicina","SAB"],["Natureza","INT"],["Percepção","SAB"],["Persuasão","CAR"],["Prestidigitação","DES"],["Religião","INT"],["Sobrevivência","SAB"]];
const PADRAO=[15,14,13,12,10,8];
const CUSTO={8:0,9:1,10:2,11:3,12:4,13:5,14:7,15:9};
const TENDENCIAS=[["LB","Leal e Bom"],["NB","Neutro e Bom"],["CB","Caótico e Bom"],["LN","Leal e Neutro"],["N","Neutro"],["CN","Caótico e Neutro"],["LM","Leal e Mau"],["NM","Neutro e Mau"],["CM","Caótico e Mau"]];
const IDIOMAS_PADRAO=["Anão","Comum de Sinais","Dracônico","Élfico","Gigante","Gnômico","Goblin","Halfling","Orc"];
const IDIOMAS_RAROS=["Abissal","Celestial","Dialeto Subterrâneo","Infernal","Primordial","Silvestre","Língua Profunda"];
const ARTESAO=["Suprimentos de Alquimista","Suprimentos de Cervejeiro","Suprimentos de Caligrafia","Ferramentas de Carpinteiro","Ferramentas de Cartógrafo","Ferramentas de Sapateiro","Utensílios de Cozinheiro","Ferramentas de Vidreiro","Ferramentas de Joalheiro","Ferramentas de Coureiro","Ferramentas de Pedreiro","Suprimentos de Pintor","Ferramentas de Oleiro","Ferramentas de Ferreiro","Ferramentas de Funileiro","Ferramentas de Tecelão","Ferramentas de Entalhador"];
const INSTRUMENTOS=["Gaita de Foles","Tambor","Saltério","Flauta","Trompa","Alaúde","Lira","Flauta de Pã","Charamela","Viola"];
const JOGOS=["Dados","Xadrez de Dragão","Baralho","Três Dragões"];
const OUTRAS_FERR=["Kit de Disfarce","Kit de Falsificação","Kit de Herbalismo","Ferramentas de Navegador","Kit de Venenos","Ferramentas de Ladrão"];
const TODAS_FERR=[...ARTESAO,...INSTRUMENTOS,...JOGOS,...OUTRAS_FERR];

/* Armas: [chave, nome, categoria S/M, C(corpo a corpo)/D(distância), dano, tipo, propriedades, maestria, alcance] */
const ARMAS=[
 ["clava","Clava","S","C","1d4","Contundente",["Leve"],"Lentidão"],
 ["adaga","Adaga","S","C","1d4","Perfurante",["Acuidade","Leve","Arremesso"],"Corte Duplo","6/18 m"],
 ["clavagrande","Clava Grande","S","C","1d8","Contundente",["Duas Mãos"],"Empurrão"],
 ["machadinha","Machadinha","S","C","1d6","Cortante",["Leve","Arremesso"],"Irritar","6/18 m"],
 ["azagaia","Azagaia","S","C","1d6","Perfurante",["Arremesso"],"Lentidão","9/36 m"],
 ["martelo","Martelo Leve","S","C","1d4","Contundente",["Leve","Arremesso"],"Corte Duplo","6/18 m"],
 ["maca","Maça","S","C","1d6","Contundente",[],"Desgaste"],
 ["bordao","Bordão","S","C","1d6","Contundente",["Versátil (1d8)"],"Derrubar"],
 ["foice","Foice Curta","S","C","1d4","Cortante",["Leve"],"Corte Duplo"],
 ["lanca","Lança","S","C","1d6","Perfurante",["Arremesso","Versátil (1d8)"],"Desgaste","6/18 m"],
 ["dardo","Dardo","S","D","1d4","Perfurante",["Acuidade","Arremesso"],"Irritar","6/18 m"],
 ["bestaleve","Besta Leve","S","D","1d8","Perfurante",["Munição","Recarga","Duas Mãos"],"Lentidão","24/96 m"],
 ["arcocurto","Arco Curto","S","D","1d6","Perfurante",["Munição","Duas Mãos"],"Irritar","24/96 m"],
 ["funda","Funda","S","D","1d4","Contundente",["Munição"],"Lentidão","9/36 m"],
 ["machadobatalha","Machado de Batalha","M","C","1d8","Cortante",["Versátil (1d10)"],"Derrubar"],
 ["mangual","Mangual","M","C","1d8","Contundente",[],"Desgaste"],
 ["glaive","Glaive","M","C","1d10","Cortante",["Pesada","Alcance","Duas Mãos"],"Raspão"],
 ["machadogrande","Machado Grande","M","C","1d12","Cortante",["Pesada","Duas Mãos"],"Trespassar"],
 ["espadagrande","Espada Grande","M","C","2d6","Cortante",["Pesada","Duas Mãos"],"Raspão"],
 ["alabarda","Alabarda","M","C","1d10","Cortante",["Pesada","Alcance","Duas Mãos"],"Trespassar"],
 ["lancamontada","Lança de Montaria","M","C","1d10","Perfurante",["Pesada","Alcance","Duas Mãos (exceto montado)"],"Derrubar"],
 ["espadalonga","Espada Longa","M","C","1d8","Cortante",["Versátil (1d10)"],"Desgaste"],
 ["malho","Malho","M","C","2d6","Contundente",["Pesada","Duas Mãos"],"Derrubar"],
 ["estrela","Maça-Estrela","M","C","1d8","Perfurante",[],"Desgaste"],
 ["pique","Pique","M","C","1d10","Perfurante",["Pesada","Alcance","Duas Mãos"],"Empurrão"],
 ["rapieira","Rapieira","M","C","1d8","Perfurante",["Acuidade"],"Irritar"],
 ["cimitarra","Cimitarra","M","C","1d6","Cortante",["Acuidade","Leve"],"Corte Duplo"],
 ["espadacurta","Espada Curta","M","C","1d6","Perfurante",["Acuidade","Leve"],"Irritar"],
 ["tridente","Tridente","M","C","1d8","Perfurante",["Arremesso","Versátil (1d10)"],"Derrubar","6/18 m"],
 ["marteloguerra","Martelo de Guerra","M","C","1d8","Contundente",["Versátil (1d10)"],"Empurrão"],
 ["picareta","Picareta de Guerra","M","C","1d8","Perfurante",["Versátil (1d10)"],"Desgaste"],
 ["chicote","Chicote","M","C","1d4","Cortante",["Acuidade","Alcance"],"Lentidão"],
 ["zarabatana","Zarabatana","M","D","1","Perfurante",["Munição","Recarga"],"Irritar","7,5/30 m"],
 ["bestamao","Besta de Mão","M","D","1d6","Perfurante",["Munição","Leve","Recarga"],"Irritar","9/36 m"],
 ["bestapesada","Besta Pesada","M","D","1d10","Perfurante",["Munição","Pesada","Recarga","Duas Mãos"],"Empurrão","30/120 m"],
 ["arcolongo","Arco Longo","M","D","1d8","Perfurante",["Munição","Pesada","Duas Mãos"],"Lentidão","45/180 m"],
 ["mosquete","Mosquete","M","D","1d12","Perfurante",["Munição","Recarga","Duas Mãos"],"Lentidão","12/36 m"],
 ["pistola","Pistola","M","D","1d10","Perfurante",["Munição","Recarga"],"Irritar","9/27 m"]];
const arma=k=>ARMAS.find(a=>a[0]===k);

/* Maestrias: resumo da mecânica */
const MAESTRIA={
 "Trespassar":"Ao acertar um ataque corpo a corpo, você pode atacar uma segunda criatura a até 1,5 m da primeira; no acerto, ela sofre o dano da arma sem o seu modificador. Uma vez por turno.",
 "Raspão":"Se errar o ataque, a criatura ainda sofre dano igual ao modificador de atributo usado no ataque.",
 "Corte Duplo":"O ataque extra da propriedade Leve pode ser feito dentro da ação de Ataque, em vez de usar a Ação Bônus. Uma vez por turno.",
 "Empurrão":"Ao acertar, você pode empurrar a criatura até 3 m para longe de você, se ela for Grande ou menor.",
 "Desgaste":"Ao acertar, a criatura tem Desvantagem na próxima jogada de ataque dela antes do início do seu próximo turno.",
 "Lentidão":"Ao acertar e causar dano, você pode reduzir o Deslocamento da criatura em 3 m até o início do seu próximo turno (não acumula).",
 "Derrubar":"Ao acertar, a criatura faz um teste de resistência de Constituição (CD 8 + modificador usado no ataque + bônus de proficiência). Se falhar, fica Caída.",
 "Irritar":"Ao acertar e causar dano, você tem Vantagem no próximo ataque contra essa criatura antes do fim do seu próximo turno."};
const PROPRIEDADE={
 "Acuidade":"Use Força ou Destreza no ataque e no dano (o mesmo nos dois).",
 "Leve":"Ao atacar com ela na ação de Ataque, você pode fazer um ataque extra com outra arma Leve como Ação Bônus, sem somar o modificador ao dano (a menos que seja negativo).",
 "Arremesso":"Pode ser arremessada para um ataque à distância, usando o mesmo modificador do corpo a corpo.",
 "Pesada":"Desvantagem no ataque se a sua Força (corpo a corpo) ou Destreza (distância) for menor que 13.",
 "Alcance":"Aumenta em 1,5 m o seu alcance com ela.",
 "Duas Mãos":"Precisa das duas mãos para atacar.",
 "Munição":"Gasta uma munição por ataque; depois da luta, 1 minuto recupera metade.",
 "Recarga":"Só dispara uma munição por ação, Ação Bônus ou Reação.",
 "Versátil":"Pode ser usada com uma ou duas mãos; com duas, usa o dano entre parênteses."};

/* Armaduras: [chave, nome, tipo, CA base, Des máxima (null = sem limite), Força mínima, desvantagem em Furtividade] */
const ARMADURAS=[
 ["acolchoada","Armadura Acolchoada","leve",11,null,0,true],
 ["couro","Armadura de Couro","leve",11,null,0,false],
 ["couroba","Couro Batido","leve",12,null,0,false],
 ["peles","Gibão de Peles","media",12,2,0,false],
 ["camisao","Camisão de Malha","media",13,2,0,false],
 ["brunea","Brunea","media",14,2,0,true],
 ["peitoral","Peitoral","media",14,2,0,false],
 ["meiaarmadura","Meia-Armadura","media",15,2,0,true],
 ["aneis","Cota de Anéis","pesada",14,0,0,true],
 ["cotamalha","Cota de Malha","pesada",16,0,13,true],
 ["talas","Armadura de Talas","pesada",17,0,15,true],
 ["placas","Armadura de Placas","pesada",18,0,15,true],
 ["escudo","Escudo","escudo",2,null,0,false]];
const armadura=k=>ARMADURAS.find(a=>a[0]===k);

const PACOTES={
 "Pacote de Assaltante":"Mochila, Rolamentos, Sino, 10 Velas, Pé de Cabra, Lanterna Furta-fogo, 7 frascos de Óleo, 5 dias de Rações, Corda, Isqueiro e Odre",
 "Pacote de Diplomata":"Baú, Roupas Finas, Tinta, 5 Penas, Lâmpada, 2 Estojos para mapas, 4 frascos de Óleo, 5 folhas de Papel, 5 de Pergaminho, Perfume e Isqueiro",
 "Pacote de Explorador de Masmorras":"Mochila, Estrepes, Pé de Cabra, 2 frascos de Óleo, 10 dias de Rações, Corda, Isqueiro, 10 Tochas e Odre",
 "Pacote de Artista":"Mochila, Saco de Dormir, Sino, Lanterna Olho-de-boi, 3 Fantasias, Espelho, 8 frascos de Óleo, 9 dias de Rações, Isqueiro e Odre",
 "Pacote de Aventureiro":"Mochila, Saco de Dormir, 2 frascos de Óleo, 10 dias de Rações, Corda, Isqueiro, 10 Tochas e Odre",
 "Pacote de Sacerdote":"Mochila, Cobertor, Água Benta, Lâmpada, 7 dias de Rações, Túnica e Isqueiro",
 "Pacote de Estudioso":"Mochila, Livro, Tinta, Pena, Lâmpada, 10 frascos de Óleo, 10 folhas de Pergaminho e Isqueiro"};

/* Bônus de proficiência por nível de personagem */
const PB=n=>Math.ceil(n/4)+1;
