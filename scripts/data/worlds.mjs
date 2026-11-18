/**
 * ITERATIVE WORLD-BUILDING (Lancer core book pp. 274-279), d20 tables in Portuguese.
 * `biomes` = biomes of this module that fit the entry (the generator picks one of them).
 */

/** World types, d20 (p. 274). */
export const WORLD_TYPES = [
  { n: 1, text: "Árido, sem atmosfera nem água e com poucos recursos; sob um bombardeio incessante de radiação.", biomes: ["regolith", "irradiated"] },
  { n: 2, text: "Árido, de atmosfera rala e sol distante; frio e morto, um vento solitário varre planícies de gelo escuro e pedra.", biomes: ["tundra", "glacier"] },
  { n: 3, text: "Árido, rico em minérios e esfriando depois de muita atividade tectônica; tempestades enormes e geleiras de metano.", biomes: ["quarry", "canyon", "glacier"] },
  { n: 4, text: "Árido, envolto em gelo que esconde um mar subglacial; a superfície treme com impactos de asteroides.", biomes: ["glacier", "tundra"] },
  { n: 5, text: "Árido, velho e perto do sol; as montanhas viraram areia e as dunas são infinitamente brancas.", biomes: ["dunes"] },
  { n: 6, text: "Temperado e exuberante, sempre enevoado sob uma bruma espessa que quase esconde o sol.", biomes: ["jungle", "swamp"] },
  { n: 7, text: "Temperado e fértil, com muitos biomas e céus cheios de nuvens em colunas.", biomes: ["grassland", "forest", "highlands"] },
  { n: 8, text: "Temperado e seco, de grandes planícies e desertos; depósitos aluviais lembram rios que já existiram.", biomes: ["savanna", "canyon", "dunes"] },
  { n: 9, text: "Temperado; um mundo de arquipélagos espalhados num mar ameno.", biomes: ["archipelago"] },
  { n: 10, text: "Temperado e de clima saudável, rico em flora e fauna nativas e biomas antigos e estáveis.", biomes: ["forest", "grassland", "jungle"] },
  { n: 11, text: "Inóspito, de atmosfera espessa e sufocante; vales profundos guardam bolsões de ar respirável.", biomes: ["toxic", "canyon"] },
  { n: 12, text: "Inóspito: oceanos de nitrogênio sacudidos por tempestades e ilhas de cádmio polidas pelo vento; marés que duram anos.", biomes: ["archipelago", "mercury"] },
  { n: 13, text: "Inóspito, cheio de lava e perseguido por raios; um mundo novo, sem vida nenhuma.", biomes: ["volcanic"] },
  { n: 14, text: "Inóspito desde uma explosão de raios gama distante; onde houve vida, só restam incêndios que nunca se apagam.", biomes: ["ashland", "irradiated"] },
  { n: 15, text: "Inóspito, rachado por um impacto antigo; sangra calor para o vácuo enquanto morre devagar.", biomes: ["volcanic", "regolith"] },
  { n: 16, text: "Uma lua temperada de atmosfera estável; a curvatura do horizonte aparece do alto de qualquer morro e o planeta-mãe domina o céu.", biomes: ["highlands", "grassland"] },
  { n: 17, text: "Uma lua gelada, fria e escura, uma entre muitas; apanha os asteroides que deviam atingir o planeta maior.", biomes: ["glacier", "regolith"] },
  { n: 18, text: "Um mundo-oceano; não há terra nenhuma.", biomes: ["archipelago"] },
  { n: 19, text: "Um mundo morto com restos de atmosfera; formas geométricas enormes e planos de metal criam canais profundos onde o vento geme.", biomes: ["monolith", "ruins"] },
  { n: 20, text: "Um mundo antigo banhado por uma estrela vermelha e inchada; tudo tem uma simetria terrível, como se orientado em volta de um único marco.", biomes: ["redgiant", "monolith"] }
];

/** Defining natural feature, d20 (p. 275). */
export const NATURAL_FEATURES = [
  "Tempestades Centenárias: furacões cada vez mais frequentes e longos.",
  "Tectônica Ativa: terremotos mais comuns que em outros mundos (tsunamis em mundos-oceano).",
  "Núcleo Inerte: o núcleo parou e o campo magnético sumiu; bússolas não funcionam e o UV é perigoso.",
  "Monobioma: um único bioma e um único clima no planeta inteiro.",
  "Cicatriz-Mundo: um impacto colossal recente (geologicamente) deixou uma cicatriz enorme e visível.",
  "Corte Real: centenas de luas dançam em órbita; noites claras e dias de luz salpicada.",
  "Sob Sóis Gêmeos: o mundo orbita uma estrela binária.",
  "Anelado: anéis planetários cortam o céu noturno como uma linha branca.",
  "Remoto: antigo posto colonial, industrial ou científico, muito longe da sociedade humana.",
  "Cosmopolita: rotas interestelares passam perto; ponto de reabastecimento e parada frequente.",
  "Hecatônquiros: montanhas imensas, picos que sobem quilômetros no céu.",
  "Pôr do Sol Epocal: preso na transição entre eras geológicas; clima muito variado.",
  "Monumento da Vergonha: abandonado após um colapso climático, virou depósito de lixo de naves e corpro-estados.",
  "Quarentena: a burocracia da Union esconde este mundo do resto da galáxia.",
  "Atmosfera Respirável: humanos respiram aqui sem EVA nem filtros.",
  "Gravidade Alta: 1–2 g acima do padrão de Cradle.",
  "Gravidade Baixa: 0,1–0,99 g abaixo do padrão de Cradle.",
  "Sol Duro: a atmosfera quase não protege do UV; sair de dia sem proteção é arriscado.",
  "Terra dos Sonhos: algo de outro mundo — ilhas flutuantes, oceanos de mercúrio, florestas que andam.",
  "Pó e Ecos: ruínas antigas, anteriores à Queda, de origem desconhecida."
];

/** Defining anthropocentric feature, d20 (pp. 276-277), short. */
export const ANTHRO_FEATURES = [
  "Assentamento novo: drones e subalternos montam a colônia; algumas dezenas de pessoas.",
  "Assentamento de primeira geração: centenas a milhares de habitantes.",
  "Assentamento estável: segunda ou terceira geração, dezenas de milhares.",
  "Posto avançado: missão de campo distante da Union, sem outros humanos.",
  "Posto avançado: nó de retransmissão da omninet com equipe pequena em rodízio.",
  "Posto avançado: estação SIGINT da Marinha da Union, em lugar alto e remoto.",
  "Posto avançado: estação de astrocartografia em órbita.",
  "Posto avançado: posto de controle / guarnição auxiliar esperando ordens.",
  "Instalação: centro de pesquisa (Union, corpro-estado ou outro), talvez secreto.",
  "Instalação: campo de provas, de tiro ou de descarte de grande escala.",
  "Instalação: retransmissor de sensores de longo alcance, alto e remoto.",
  "Instalação: embaixada da Union, modesta, na capital.",
  "Instalação: campus de corpro-estado com grande população fixa.",
  "Base: Comando Naval regional (SysComm) — perímetros, plataformas de lançamento, bunkers.",
  "Base: Capital do sistema, conjunto de prédios reforçados do governo.",
  "Base: Elevação — um espaçoporto público enorme.",
  "Cívico: municipalidades — centenas de milhões em cidades espalhadas por biomas diversos.",
  "Cívico: arcologias — cidades-ecossistema fechadas, bilhões de habitantes.",
  "Cívico: metrofaixa — uma mancha urbana única onde vivem bilhões.",
  "Union: residência do administrador — o centro estratégico do sistema."
];

/**
 * Environments, d20 (pp. 278-279). `rule` is the in-combat effect (summary).
 * Damage icons of the book: ⌀ kinetic, ✷ explosive, ϟ energy, 🌡 heat, 🔥 burn.
 */
export const ENVIRONMENTS = [
  { n: 1, name: "Flora ou Fauna Perigosa", rule: "Flora hostil = personagens imóveis de Tamanho 1–2, 5 PV, Evasão 10. Quem se move adjacente faz teste de CASCO ou sofre 3 cinético e fica Imobilizado até a flora ser destruída.", biomes: ["jungle", "swamp", "forest", "fungal"] },
  { n: 2, name: "Frio Extremo", rule: "Mechs que não se movem nem dão Boost no turno ficam Imobilizados no fim do turno até passar em CASCO como ação rápida. Todos os mechs têm Resistência a Calor.", biomes: ["glacier", "tundra"] },
  { n: 3, name: "Calor Extremo", rule: "Todo Calor causado por sistemas ou armas (no usuário ou em outros) aumenta em +1.", biomes: ["dunes", "volcanic", "redgiant", "savanna"] },
  { n: 4, name: "Atmosfera Rala", rule: "Todos os personagens têm Resistência a Explosivo.", biomes: ["highlands", "regolith", "tundra"] },
  { n: 5, name: "Sol Extremo", rule: "Quem não estiver na sombra no fim de um turno sofre 1d6 de Calor (uma vez por rodada por personagem).", biomes: ["dunes", "redgiant", "canyon"] },
  { n: 6, name: "Atmosfera Corrosiva", rule: "Todas as armas ganham AP (perfurante).", biomes: ["toxic", "swamp"] },
  { n: 7, name: "Tempestades de Partículas", rule: "Durante a tempestade, mechs sempre têm cobertura leve. Pilotos fora do mech sofrem 1 cinético AP por turno.", biomes: ["dunes", "canyon", "ashland"] },
  { n: 8, name: "Tempestades Elétricas", rule: "No fim de cada rodada, sorteie um personagem: teste de ENGENHARIA com +1 Dificuldade por nível de Tamanho ou fica ATORDOADO até o fim do próximo turno.", biomes: ["highlands", "volcanic", "monolith"] },
  { n: 9, name: "Tempestades Disruptivas", rule: "Todas as ações tech, ataques tech e testes e salvaguardas de SISTEMAS recebem +1 Dificuldade.", biomes: ["monolith", "crystal", "urban"] },
  { n: 10, name: "Tempestades Perigosas", rule: "Fogo, meteoros, chuva ácida ou gelo: no fim do turno, todos sofrem 2 energia AP, a menos que estejam adjacentes a um objeto que dê cobertura pesada.", biomes: ["ashland", "volcanic", "toxic"] },
  { n: 11, name: "Mundo Oceânico", rule: "Mechs afundam e se movem como em terreno difícil, a menos que voem ou tenham Módulo EVA. Podem andar (devagar) no fundo.", biomes: ["archipelago"] },
  { n: 12, name: "Terremotos", rule: "No fim de cada rodada, role 1d6: com 1, todos os mechs que não voam fazem CASCO ou ficam Caídos.", biomes: ["canyon", "quarry", "volcanic", "ruins"] },
  { n: 13, name: "Mundo Derretido", rule: "Ao entrar em rocha derretida/lava pela primeira vez no turno, ou começar o turno nela: 5 energia AP e 3 Calor.", biomes: ["volcanic"] },
  { n: 14, name: "Mundo Primordial", rule: "Lama fervente: muitas áreas de terreno difícil e perigoso. Humanos fora do mech precisam de respirador.", biomes: ["swamp", "toxic", "fungal"] },
  { n: 15, name: "Gravidade Baixa", rule: "Mechs contam como voando quando dão Boost, mas pousam depois de se mover. Ninguém sofre dano de queda.", biomes: ["regolith", "crystal", "highlands"] },
  { n: 16, name: "Gravidade Alta", rule: "Mechs não podem dar Boost e ficam Imobilizados sempre que ficariam Lentos. Mechs Caídos podem levantar Imobilizados com teste de CASCO.", biomes: ["quarry", "canyon", "industrial"] },
  { n: 17, name: "Mundo-Tumba", rule: "Radiação altíssima: humanos sem proteção perdem 1 de PV máximo por hora de exposição (recuperam com Reparo Completo em lugar seguro).", biomes: ["irradiated", "ruins", "ashland"] },
  { n: 18, name: "Mundo de Agulhas", rule: "Em vez de superfície, ilhas e agulhas flutuantes suspensas por magnetismo; a navegação quase não funciona.", biomes: ["crystal", "highlands", "monolith"] },
  { n: 19, name: "Mundo que Afunda", rule: "Areia fina ou lama: mech que se move 1 espaço ou menos fica Lento; Lento que se move 1 ou menos fica Imobilizado e afunda até alguém (ele ou adjacente) passar em CASCO como ação completa.", biomes: ["dunes", "swamp"] },
  { n: 20, name: "Mundo Sagrado", rule: "Belo e sem perigos especiais, mas sagrado para os locais: danificar rochas, árvores ou campos atrai a ira dos moradores.", biomes: ["grassland", "forest", "crystal"] }
];

export const d20 = rng => 1 + Math.floor(rng() * 20);
