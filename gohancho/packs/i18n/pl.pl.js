// Polska — przepisy po polsku
GOHAN_PACK_TR('PL', 'pl', {
  staple: "Chleb",
  names: {
    'pork': "Wieprzowina", 'ground pork': "Mięso mielone", 'chicken': "Kurczak", 'beef': "Wołowina", 'fish': "Ryba", 'egg': "Jajka",
    'flour': "Mąka", 'breadcrumbs': "Bułka tarta", 'bread': "Chleb", 'potato': "Ziemniaki", 'onion': "Cebula", 'dill': "Koperek",
    'quark': "Twaróg", 'sour cream': "Śmietana", 'milk': "Mleko", 'lemon': "Cytryna", 'bell pepper': "Papryka",
    'buckwheat': "Kasza gryczana", 'pickled cucumber': "Ogórki kiszone", 'cucumber': "Ogórki", 'carrot': "Marchewka",
    'apple': "Jabłka", 'beetroot': "Buraki", 'sauerkraut': "Kapusta kiszona", 'tomato': "Pomidory", 'chives': "Szczypiorek",
    'green beans': "Fasolka szparagowa", 'parsley root': "Pietruszka (korzeń)", 'celeriac': "Seler", 'leek': "Por", 'noodles': "Makaron",
    'parsley': "Natka pietruszki", 'rice': "Ryż", 'tomato passata': "Przecier pomidorowy", 'stock': "Bulion",
    'zakwas': "Zakwas na żurek", 'sausage': "Kiełbasa", 'bacon': "Boczek wędzony", 'barley': "Kasza jęczmienna",
    'split peas': "Groch łuskany", 'pork ribs': "Żeberka", 'cauliflower': "Kalafior", 'peas': "Zielony groszek", 'mushrooms': "Pieczarki",
    'dried mushrooms': "Suszone grzyby", 'white beans': "Biała fasola", 'sorrel': "Szczaw", 'beet greens': "Botwina",
    'kefir': "Kefir", 'radish': "Rzodkiewki", 'broccoli': "Brokuły", 'pumpkin': "Dynia", 'lentils': "Soczewica", 'asparagus': "Szparagi",
    'cream': "Śmietanka",
  },
  recipes: {
    'pl_schabowy': {
      name: "Kotlet schabowy",
      ings: [
        ["Schab bez kości", "2 plastry (300 g)"],
        ["Jajko", "1"],
        ["Bułka tarta", "60 g"],
        ["Mąka", "3 łyżki"],
        ["Ziemniaki", "500 g"],
        ["Koperek", "1/2 pęczka?"],
      ],
      seas: "Sól · Pieprz · Smalec lub olej do smażenia (ok. 100 ml) · 1 łyżka masła",
      steps: [
        "Obierz ziemniaki, większe przekrój na pół i gotuj w osolonej wodzie ok. 20 minut do miękkości. Odcedź, dodaj masło i posiekany koperek.",
        "W tym czasie włóż plastry schabu między dwie warstwy folii spożywczej i rozbij tłuczkiem na ok. 5 mm grubości. Posól i popieprz z obu stron.",
        "Przygotuj trzy talerze: mąkę, jajko roztrzepane ze szczyptą soli i bułkę tartą. Każdy kotlet obtocz w mące, potem w jajku, a na końcu mocno obtocz w bułce tartej.",
        "Rozgrzej tłuszcz na dużej patelni na średnim ogniu. Smaż kotlety po 4–5 minut z każdej strony, aż będą głęboko złociste, a mięso całkiem upieczone.",
        "Odsącz na ręczniku papierowym i podawaj na gorąco z ziemniakami z koperkiem oraz mizerią lub surówką z kiszonej kapusty.",
      ],
      tip: { add: "Jajko sadzone na wierzchu", why: "Płynny żółtek robi z kotletu i ziemniaków prawdziwy sos", skill: "Rozbijaj równomiernie", how: "Rozbijaj od środka na zewnątrz, żeby kotlet miał wszędzie tę samą grubość; wtedy smaży się równo i zostaje soczysty." }
    },
    'pl_mielone': {
      name: "Kotlety mielone",
      ings: [
        ["Mięso mielone wieprzowe", "400 g"],
        ["Czerstwa bułka", "1"],
        ["Jajko", "1"],
        ["Cebula", "1"],
        ["Bułka tarta", "40 g"],
        ["Ziemniaki", "500 g"],
      ],
      seas: "Sól · Pieprz · 1 ząbek czosnku · 1/2 łyżeczki suszonego majeranku · Olej do smażenia",
      steps: [
        "Wstaw ziemniaki do gotowania w osolonej wodzie (ok. 20 minut). Namocz bułkę w wodzie na 5 minut, a potem dokładnie odciśnij.",
        "Zetrzyj cebulę na tarce lub drobno posiekaj. W misce wymieszaj mięso, odciśniętą bułkę, cebulę, jajko, przeciśnięty czosnek, majeranek, 1 łyżeczkę soli i pieprz, aż masa będzie kleista.",
        "Mokrymi rękami uformuj 6 owalnych kotletów o grubości ok. 2 cm i obtocz je w bułce tartej.",
        "Smaż na oleju na średnim ogniu po 5–6 minut z każdej strony, aż się zrumienią, a w środku nie będzie różowe.",
        "Podawaj z gotowanymi ziemniakami i startymi buraczkami lub mizerią.",
      ],
      tip: { add: "Łyżka tłuszczu z patelni na ziemniaki", why: "Klasyczny polski domowy akcent, pełen smaku", skill: "Przykryj na ostatnie minuty", how: "Na ostatnie 2 minuty przykryj patelnię pokrywką, żeby grube kotlety się dopiekły, a skorupka nie przypaliła." }
    },
    'pl_pierogi': {
      name: "Pierogi ruskie",
      ings: [
        ["Mąka", "300 g"],
        ["Ziemniaki mączyste", "400 g"],
        ["Twaróg", "200 g"],
        ["Cebula", "2"],
        ["Śmietana", "100 g?"],
      ],
      seas: "Sól · Dużo pieprzu · 150 ml ciepłej wody · 1 łyżka oleju · 3 łyżki masła",
      steps: [
        "Ugotuj obrane ziemniaki w osolonej wodzie do miękkości, odcedź i rozgnieć. Drobno posiekaj cebulę i usmaż ją na 2 łyżkach masła na złoty kolor.",
        "Wymieszaj puree z pokruszonym twarogiem, połową smażonej cebuli, solą i dużą ilością pieprzu. Pozostaw farsz do ostygnięcia.",
        "Na ciasto wymieszaj mąkę, szczyptę soli, ciepłą wodę i olej i wyrabiaj 5 minut, aż będzie gładkie. Przykryj i odstaw na 15 minut.",
        "Rozwałkuj ciasto cienko (ok. 2 mm), wytnij szklanką kółka, na każde połóż łyżeczkę farszu, złóż i mocno zlep brzegi.",
        "Gotuj partiami w dużym garnku wrzącej osolonej wody; gdy wypłyną, gotuj jeszcze 2 minuty i wyjmuj łyżką cedzakową.",
        "Podawaj posypane resztą cebuli podgrzanej na pozostałym maśle, ze śmietaną osobno.",
      ],
      tip: { add: "Podsmaż pierogi z resztek następnego dnia", why: "Podsmażone na patelni mają chrupiącą, złotą skórkę", skill: "Zlepiaj szczelnie", how: "Wyciśnij powietrze i zlep brzeg w falbankę; pęcherzyki powietrza sprawiają, że pierogi pękają w wodzie." }
    },
    'pl_dorsz': {
      name: "Smażony dorsz",
      ings: [
        ["Filet z dorsza", "400 g"],
        ["Jajko", "1"],
        ["Mąka", "3 łyżki"],
        ["Bułka tarta", "50 g"],
        ["Ziemniaki", "500 g"],
        ["Cytryna", "1/2"],
      ],
      seas: "Sól · Pieprz · Olej do smażenia · 1 łyżka masła",
      steps: [
        "Ugotuj ziemniaki w osolonej wodzie przez ok. 20 minut, odcedź i wymieszaj z masłem.",
        "Osusz dorsza, pokrój na 4 kawałki i dopraw solą, pieprzem i odrobiną soku z cytryny.",
        "Obtocz rybę w mące, zanurz w roztrzepanym jajku i obtocz w bułce tartej.",
        "Smaż na rozgrzanym oleju na średnim ogniu po 3–4 minuty z każdej strony, aż będzie złota, a ryba łatwo się rozpadnie.",
        "Podawaj z ziemniakami, ćwiartkami cytryny i surówką z kiszonej kapusty lub marchewki.",
      ],
      tip: { add: "Szczypta słodkiej papryki do mąki", why: "Nadaje panierce cieplejszy kolor i smak", skill: "Osusz rybę", how: "Dokładnie osusz filety ręcznikiem papierowym; mokra ryba sprawia, że panierka odpada." }
    },
    'pl_udka': {
      name: "Pieczone udka z kurczaka",
      ings: [
        ["Udka z kurczaka (podudzie z udem)", "2 (ok. 600 g)"],
        ["Ziemniaki", "500 g"],
      ],
      seas: "Sól · Pieprz · 1 łyżeczka słodkiej papryki · 1/2 łyżeczki suszonego majeranku · 2 ząbki czosnku · 2 łyżki oleju",
      steps: [
        "Rozgrzej piekarnik do 200°C. Wymieszaj olej z przeciśniętym czosnkiem, papryką, majerankiem, solą i pieprzem.",
        "Natrzyj udka dokładnie ze wszystkich stron, także pod skórą.",
        "Pokrój ziemniaki w ćwiartki, wymieszaj z odrobiną soli i oleju i rozłóż w naczyniu do zapiekania; na wierzchu ułóż kurczaka skórą do góry.",
        "Piecz 45–50 minut, aż skóra będzie chrupiąca, a po nakłuciu najgrubszego miejsca wypłynie przezroczysty sok.",
        "Podawaj z pieczonymi ziemniakami i świeżą surówką.",
      ],
      tip: { add: "Łyżka miodu posmarowana na ostatnie 10 minut", why: "Daje błyszczącą, skarmelizowaną skórkę", skill: "Marynuj wcześniej", how: "Natrzyj kurczaka rano i trzymaj w lodówce; przyprawy głębiej wnikną w mięso." }
    },
    'pl_gulasz': {
      name: "Gulasz wołowy z kaszą gryczaną",
      ings: [
        ["Łopatka wołowa", "400 g"],
        ["Cebula", "2"],
        ["Czerwona papryka", "1?"],
        ["Kasza gryczana palona", "120 g"],
        ["Mąka", "1 łyżka"],
        ["Ogórki kiszone", "2?"],
      ],
      seas: "Sól · Pieprz · 2 łyżeczki słodkiej papryki · 2 liście laurowe · 3 ziela angielskie · 2 ząbki czosnku · 2 łyżki oleju",
      steps: [
        "Pokrój wołowinę w kostkę 3 cm, obtocz w mące z solą i pieprzem i obsmaż na gorącym oleju w ciężkim garnku. Wyjmij mięso.",
        "W tym samym garnku zeszklij posiekaną cebulę, dodaj czosnek i paprykę, a potem włóż mięso z powrotem.",
        "Zalej ok. 600 ml gorącej wody, dodaj liście laurowe i ziele angielskie, przykryj i duś na małym ogniu 1 1/2 godziny, aż wołowina będzie miękka. Paski papryki dodaj na ostatnie 20 minut.",
        "Ok. 20 minut przed podaniem wsyp kaszę do dwukrotnie większej objętości wrzącej osolonej wody, przykryj i gotuj na małym ogniu 15 minut, a potem odstaw.",
        "Dopraw gulasz i podawaj na kaszy, z ogórkami kiszonymi osobno.",
      ],
      tip: { add: "Łyżka śmietany na wierzch", why: "Łagodzi treściwy sos", skill: "Obsmażaj partiami", how: "Nie przepełniaj garnka; jeśli mięso się dusi zamiast rumienić, sos będzie blady." }
    },
    'pl_nalesniki': {
      name: "Naleśniki z serem",
      ings: [
        ["Mąka", "150 g"],
        ["Mleko", "250 ml"],
        ["Jajka", "2"],
        ["Twaróg", "250 g"],
        ["Śmietana", "2 łyżki"],
      ],
      seas: "Szczypta soli · 3 łyżki cukru · 1 łyżeczka cukru waniliowego · 100 ml wody gazowanej · 1 łyżka oleju · Masło do smażenia",
      steps: [
        "Zmiksuj mąkę, mleko, 1 jajko, sól i wodę gazowaną na gładkie, rzadkie ciasto. Dodaj olej i odstaw na 10 minut.",
        "Rozgnieć twaróg z żółtkiem drugiego jajka, śmietaną, cukrem i cukrem waniliowym na kremową masę.",
        "Rozgrzej lekko natłuszczoną masłem patelnię. Wlej mały czerpak ciasta, rozprowadź po patelni i smaż ok. 1 minuty z każdej strony, aż pojawią się złote plamki.",
        "Posmaruj każdy naleśnik serem, złóż w ćwiartki lub zwiń.",
        "Krótko podsmaż nadziewane naleśniki na odrobinie masła i podawaj posypane cukrem lub z owocami.",
      ],
      tip: { add: "Rodzynki lub trochę skórki z cytryny do sera", why: "Tak robią polskie babcie", skill: "Daj ciastu odpocząć", how: "Odpoczynek pozwala mące wchłonąć płyn, więc cienkie naleśniki nie rwą się przy przewracaniu." }
    },
    'pl_mizeria': {
      name: "Mizeria",
      ings: [
        ["Ogórki", "2"],
        ["Śmietana", "100 g"],
        ["Koperek", "kilka gałązek"],
      ],
      seas: "Sól · Pieprz · Szczypta cukru · 1 łyżeczka soku z cytryny",
      steps: [
        "Obierz ogórki i pokrój w bardzo cienkie plasterki.",
        "Posól odrobiną soli, odstaw na 5 minut i odlej wodę, która puści.",
        "Wymieszaj śmietanę z posiekanym koperkiem, sokiem z cytryny, cukrem i pieprzem.",
        "Delikatnie połącz ogórki ze śmietaną i podawaj na zimno.",
      ],
      tip: { add: "Kilka plasterków rzodkiewki", why: "Dodaje koloru i chrupkości", skill: "Zrób tuż przed podaniem", how: "Ogórek ciągle puszcza wodę; polej go śmietaną w ostatniej chwili, żeby zostawała gęsta." }
    },
    'pl_marchewka': {
      name: "Surówka z marchewki i jabłka",
      ings: [
        ["Marchewki", "3"],
        ["Jabłko", "1"],
        ["Cytryna", "1/2"],
      ],
      seas: "Szczypta soli · 1 łyżeczka cukru · 1 łyżka oleju",
      steps: [
        "Obierz marchewki i jabłko.",
        "Zetrzyj oba na drobnych oczkach tarki.",
        "Od razu wymieszaj z sokiem z cytryny, żeby jabłko nie ściemniało, a potem dodaj cukier, sól i olej.",
        "Odstaw na 5 minut przed podaniem.",
      ],
      tip: { add: "Garść rodzynek", why: "Dzieci uwielbiają słodycz", skill: "Olej pomaga", how: "Olej pomaga organizmowi przyswoić witaminy z marchewki, więc nie pomijaj go." }
    },
    'pl_buraczki': {
      name: "Buraczki zasmażane",
      ings: [
        ["Ugotowane buraki", "500 g"],
        ["Mąka", "1 łyżka"],
        ["Cytryna", "1/2"],
      ],
      seas: "Sól · 1 łyżeczka cukru · 1 łyżka masła · Pieprz",
      steps: [
        "Zetrzyj ugotowane buraki na tarce o grubych oczkach (jeśli chcesz, włóż rękawiczki).",
        "Roztop masło na patelni, dodaj mąkę i smaż 1 minutę, mieszając.",
        "Dodaj buraki i odrobinę wody, wymieszaj i podgrzewaj 5 minut.",
        "Dopraw sokiem z cytryny, cukrem, solą i pieprzem na słodko-kwaśno. Podawaj ciepłe.",
      ],
      tip: { add: "Trochę startego jabłka", why: "Robi buraczki świeższe i słodsze", skill: "Wyważ słodko i kwaśno", how: "Dopraw na próbę, dodając cytrynę i cukier po trochu; buraki powinny smakować żywo, a nie płasko." }
    },
    'pl_kiszona': {
      name: "Surówka z kiszonej kapusty",
      ings: [
        ["Kapusta kiszona", "400 g"],
        ["Marchewka", "1"],
        ["Jabłko", "1"],
        ["Cebula", "1/2"],
      ],
      seas: "2 łyżki oleju · Szczypta cukru · Pieprz",
      steps: [
        "Lekko odciśnij kapustę i kilka razy przetnij nożem, żeby nie była za długa.",
        "Zetrzyj marchewkę i jabłko, a cebulę drobno posiekaj.",
        "Wymieszaj wszystko z olejem, szczyptą cukru i pieprzem.",
        "Odstaw na 10 minut, żeby smaki się połączyły.",
      ],
      tip: { add: "Posiekana natka pietruszki", why: "Świeży kolor", skill: "Przepłucz, jeśli za kwaśna", how: "Jeśli kapusta jest bardzo ostra, krótko przepłucz ją zimną wodą i dobrze odciśnij." }
    },
    'pl_fasolka': {
      name: "Fasolka szparagowa z bułką tartą",
      ings: [
        ["Fasolka zielona lub żółta", "400 g"],
        ["Bułka tarta", "2 łyżki"],
      ],
      seas: "Sól · 2 łyżki masła",
      steps: [
        "Odetnij końcówki fasolki i gotuj ją w osolonej wrzącej wodzie 6–8 minut, aż będzie ledwo miękka. Odcedź.",
        "Roztop masło na małej patelni, dodaj bułkę tartą i mieszaj, aż się zezłoci.",
        "Polej fasolkę masłem z bułką tartą i podawaj.",
      ],
      tip: { add: "Odrobina czosnku w maśle", why: "Więcej smaku", skill: "Złota, nie ciemna", how: "Bułka tarta szybko się przypala; zdejmij patelnię z ognia, gdy tylko zrobi się złota." }
    },
    'pl_pomidory': {
      name: "Pomidory z cebulą",
      ings: [
        ["Pomidory", "3"],
        ["Mała cebula", "1"],
        ["Szczypiorek", "trochę?"],
      ],
      seas: "Sól · Pieprz · 1 łyżka oleju",
      steps: [
        "Pokrój pomidory w plastry lub ćwiartki.",
        "Pokrój cebulę w bardzo cienkie plasterki.",
        "Ułóż na talerzu, dopraw solą i pieprzem, polej olejem i posyp posiekanym szczypiorkiem.",
      ],
      tip: { add: "Łyżka śmietany", why: "Robi kremową całość, tak jak w wielu polskich domach", skill: "Solić przy stole", how: "Sól wyciąga wodę z pomidorów; dopraw tuż przed jedzeniem." }
    },
    'pl_rosol': {
      name: "Rosół z makaronem",
      ings: [
        ["Udka lub części rosołowe z kurczaka", "600 g"],
        ["Marchewki", "2"],
        ["Pietruszka (korzeń)", "1"],
        ["Seler", "1/4"],
        ["Por", "1/2"],
        ["Cebula", "1/2"],
        ["Cienki makaron jajeczny", "100 g"],
        ["Natka pietruszki", "kilka gałązek?"],
      ],
      seas: "Sól · 5 ziaren pieprzu · 2 ziela angielskie · 1 liść laurowy",
      steps: [
        "Włóż kurczaka do garnka z 2 litrami zimnej wody i powoli doprowadź do delikatnego wrzenia, zbierając szumowiny.",
        "Przypal przekrojoną cebulę na suchej patelni. Dodaj ją do garnka z obranymi marchewkami, pietruszką, selerem, porem i przyprawami.",
        "Gotuj bardzo delikatnie, pod uchyloną pokrywką, 1 1/2–2 godziny; rosół ma tylko lekko bulgotać, żeby pozostał klarowny. Posól do smaku.",
        "Ugotuj makaron osobno w osolonej wodzie i odcedź.",
        "Na dno każdego talerza włóż makaron, zalej gorącym, przecedzonym rosołem i dodaj plasterki marchewki i posiekaną natkę.",
      ],
      tip: { add: "Resztę rosołu wykorzystaj jutro na pomidorową", why: "Klasyczny polski plan od niedzieli do poniedziałku", skill: "Nigdy nie gotuj na mocnym ogniu", how: "Intensywne wrzenie mąci rosół; trzymaj go na leniwym bulgotaniu, a będzie złocisty i klarowny." }
    },
    'pl_pomidorowa': {
      name: "Zupa pomidorowa z ryżem",
      ings: [
        ["Bulion drobiowy (lub resztki rosołu)", "1 l"],
        ["Przecier pomidorowy", "300 ml"],
        ["Śmietana", "100 g"],
        ["Ryż", "60 g"],
        ["Natka pietruszki", "kilka gałązek?"],
      ],
      seas: "Sól · Pieprz · Szczypta cukru",
      steps: [
        "Ugotuj ryż w osolonej wodzie i odcedź.",
        "Podgrzej bulion, wlej przecier i gotuj 10 minut.",
        "W kubku wymieszaj śmietanę z chochlą gorącej zupy, a potem wlej z powrotem do garnka, żeby się nie zważyła.",
        "Dopraw solą, pieprzem i szczyptą cukru. Podawaj na ryżu z posiekaną natką.",
      ],
      tip: { add: "Makaron zamiast ryżu", why: "Druga klasyczna wersja, ulubiona przez dzieci", skill: "Zahartuj śmietanę", how: "Wcześniejsze podgrzanie śmietany gorącą zupą sprawia, że zupa jest gładka, a nie grudkowata." }
    },
    'pl_ogorkowa': {
      name: "Zupa ogórkowa",
      ings: [
        ["Ogórki kiszone", "4"],
        ["Ziemniaki", "3"],
        ["Marchewka", "1"],
        ["Bulion drobiowy lub warzywny", "1 l"],
        ["Śmietana", "100 g"],
        ["Koperek", "1/2 pęczka"],
      ],
      seas: "Sól · Pieprz · 1 łyżka masła · 100 ml zalewy z ogórków",
      steps: [
        "Pokrój ziemniaki w kostkę, zetrzyj marchewkę i gotuj oba w bulionie ok. 15 minut.",
        "Zetrzyj ogórki na grubych oczkach i podduś je na maśle na małej patelni 3 minuty.",
        "Dodaj ogórki do zupy razem z zalewą i gotuj jeszcze 5 minut. Spróbuj przed posoleniem; zalewa jest słona.",
        "Zahartuj śmietanę chochlą gorącej zupy, wmieszaj ją i dodaj dużo posiekanego koperku.",
      ],
      tip: { add: "Kawałki ugotowanego mięsa z rosołu", why: "Zupa jest bardziej sycąca", skill: "Dodawaj zalewę do smaku", how: "Wlewaj zalewę po trochu; przestań, gdy zupa będzie przyjemnie kwaśna." }
    },
    'pl_zurek': {
      name: "Żurek",
      ings: [
        ["Zakwas na żurek", "300 ml"],
        ["Biała lub wędzona kiełbasa", "200 g"],
        ["Boczek wędzony", "60 g"],
        ["Ziemniaki", "2"],
        ["Jajka", "2"],
      ],
      seas: "Sól · Pieprz · 700 ml wody · 2 ząbki czosnku · 1 łyżeczka suszonego majeranku · 1 liść laurowy · 2 ziela angielskie · 1 łyżeczka tartego chrzanu (opcjonalnie)",
      steps: [
        "Pokrój boczek w kostkę i smaż w garnku na średnim ogniu 4 minuty, aż wytopi się tłuszcz. Wlej 700 ml wody, dodaj liść laurowy i ziele angielskie i zagotuj.",
        "Włóż całą kiełbasę i gotuj 20 minut; surowa biała kiełbasa musi być ugotowana do samego środka. Wyjmij ją i pokrój w plasterki. W tym czasie gotuj jajka 10 minut, aż żółtka będą ścięte, ostudź i obierz.",
        "Dodaj do wywaru ziemniaki pokrojone w kostkę i gotuj 15 minut do miękkości.",
        "Dobrze wstrząśnij butelką z zakwasem i wlej go, cały czas mieszając. Dodaj przeciśnięty czosnek, majeranek i pokrojoną kiełbasę i gotuj 5 minut, aż zupa lekko zgęstnieje.",
        "Dopraw solą, pieprzem i chrzanem do smaku i podawaj z jajkami przekrojonymi na pół.",
      ],
      tip: { add: "Podaj w wydrążonym okrągłym chlebie", why: "Tak świątecznie jada się żurek w okolicach Wielkanocy", skill: "Wstrząśnij zakwasem", how: "Mąka w zakwasie opada na dno; dobrze wstrząśnij butelką, żeby zupa zgęstniała równo." }
    },
    'pl_barszcz': {
      name: "Barszcz czerwony",
      ings: [
        ["Surowe buraki", "500 g"],
        ["Marchewka", "1"],
        ["Pietruszka (korzeń)", "1"],
        ["Cebula", "1/2"],
        ["Suszone grzyby leśne", "3 kawałki"],
        ["Cytryna (na sok)", "1/2"],
      ],
      seas: "Sól · Pieprz · 1,2 l wody · 2 ząbki czosnku · 1 liść laurowy · 3 ziela angielskie · 1/2 łyżeczki suszonego majeranku · 1 łyżeczka cukru",
      steps: [
        "Obierz buraki i pokrój je w cienkie plastry. Obierz marchewkę i pietruszkę i pokrój w duże kawałki.",
        "Włóż wszystkie warzywa, grzyby, liść laurowy i ziele angielskie do 1,2 litra zimnej wody. Zagotuj, przykryj i gotuj na małym ogniu 40 minut.",
        "Przecedź wywar i wlej go z powrotem do garnka. Dodaj przeciśnięty czosnek, majeranek, cukier, sok z cytryny i sól.",
        "Podgrzewaj 2–3 minuty, nie doprowadzając do wrzenia, spróbuj, czy smak jest łagodnie słodko-kwaśny, i podawaj w kubkach lub talerzach.",
      ],
      tip: { add: "Ziemniaki z koperkiem obok", why: "Codzienne połączenie; w Wigilię podaje się małe uszka z grzybami", skill: "Po zakwaszeniu nie gotuj", how: "Gdy cytryna jest już w garnku, tylko podgrzewaj; mocne wrzenie zmienia rubinowy kolor na brązowy." }
    },
    'pl_krupnik': {
      name: "Krupnik",
      ings: [
        ["Udka lub skrzydełka z kurczaka", "400 g"],
        ["Kasza jęczmienna (perłowa)", "60 g"],
        ["Ziemniaki", "2"],
        ["Marchewka", "1"],
        ["Pietruszka (korzeń)", "1"],
        ["Seler", "1 mały plaster"],
        ["Natka pietruszki", "kilka gałązek"],
      ],
      seas: "Sól · Pieprz · 1,2 l wody · 1 liść laurowy · 2 ziela angielskie · 1 łyżka masła",
      steps: [
        "Włóż kurczaka do 1,2 litra zimnej wody, zagotuj i zbierz szumowiny. Dodaj liść laurowy i ziele angielskie i gotuj delikatnie 30 minut, aż mięso będzie ugotowane.",
        "Przepłucz kaszę na sitku. Dodaj ją do garnka razem z marchewką, pietruszką i selerem pokrojonymi w kostkę i gotuj 15 minut.",
        "Dodaj ziemniaki pokrojone w kostkę i gotuj jeszcze 15 minut, aż kasza i ziemniaki będą miękkie.",
        "Wyjmij kurczaka, oddziel mięso od kości i włóż je z powrotem do zupy. Dodaj masło, dopraw i posyp posiekaną natką.",
      ],
      tip: { add: "Dwa–trzy suszone grzyby w wywarze", why: "Dają głęboki, leśny smak krupniku jak u babci", skill: "Przepłucz kaszę", how: "Płukanie usuwa luźną skrobię, więc zupa nie robi się kleista." }
    },
    'pl_grochowka': {
      name: "Grochówka",
      ings: [
        ["Groch łuskany (żółty)", "200 g"],
        ["Kiełbasa wędzona", "150 g"],
        ["Boczek wędzony", "80 g"],
        ["Ziemniak", "1"],
        ["Marchewka", "1"],
        ["Cebula", "1"],
      ],
      seas: "Sól · Pieprz · 1,2 l wody · 2 ząbki czosnku · 2 łyżeczki suszonego majeranku · 1 liść laurowy · 2 ziela angielskie",
      steps: [
        "Poprzedniego wieczoru przepłucz groch i namocz go w dużej ilości zimnej wody. Następnego dnia odcedź.",
        "Gotuj groch w 1,2 litra świeżej wody z liściem laurowym i zielem angielskim. Zagotuj, a potem gotuj pod uchyloną pokrywką 45–60 minut, od czasu do czasu mieszając, aż groch się rozpadnie.",
        "W tym czasie smaż boczek pokrojony w kostkę 5 minut, dodaj posiekaną cebulę i smaż jeszcze 5 minut, aż zmięknie.",
        "Dodaj do grochu ziemniak w kostce, startą marchewkę, boczek z cebulą i pokrojoną kiełbasę i gotuj 20 minut, aż ziemniak zmięknie, a kiełbasa dobrze się zagrzeje.",
        "Wmieszaj przeciśnięty czosnek i majeranek roztarty w dłoniach, dopraw solą i pieprzem. Jeśli zupa jest za gęsta, rozrzedź ją odrobiną gorącej wody.",
      ],
      tip: { add: "Kromki chleba żytniego obok", why: "Robi z zupy pełny, sycący obiad", skill: "Sól na końcu", how: "Wczesne solenie spowalnia mięknięcie grochu; sól dodaj dopiero, gdy groch się rozpadnie." }
    },
    'pl_kapusniak': {
      name: "Kapuśniak",
      ings: [
        ["Kapusta kiszona", "300 g"],
        ["Żeberka wędzone", "300 g"],
        ["Ziemniaki", "2"],
        ["Marchewka", "1"],
        ["Cebula", "1/2"],
      ],
      seas: "Sól · Pieprz · 1,2 l wody · 1 liść laurowy · 3 ziela angielskie · 1 łyżeczka kminku · 1 łyżeczka słodkiej papryki · 1 łyżka oleju",
      steps: [
        "Podziel żeberka, zalej je 1,2 litra zimnej wody i zagotuj, zbierając szumowiny. Dodaj liść laurowy i ziele angielskie i gotuj 40 minut, aż mięso będzie ugotowane i miękkie.",
        "Posiekaj kapustę i dodaj ją razem z kminkiem. Gotuj 20 minut.",
        "Podsmaż posiekaną cebulę i startą marchewkę na oleju 5 minut, wmieszaj paprykę i przełóż do garnka razem z ziemniakami w kostce. Gotuj 15 minut, aż ziemniaki zmiękną.",
        "Oddziel mięso od kości i włóż z powrotem do zupy. Spróbuj przed soleniem, bo kapusta kiszona jest już słona.",
      ],
      tip: { add: "Łyżka koncentratu pomidorowego do cebuli", why: "Popularna domowa wersja o pełniejszym, czerwonym wywarze", skill: "Ugotuj dzień wcześniej", how: "Kapuśniak smakuje lepiej następnego dnia; przed podaniem doprowadź go z powrotem do wrzenia." }
    },
    'pl_kalafiorowa': {
      name: "Zupa kalafiorowa",
      ings: [
        ["Kalafior", "1/2 główki (400 g)"],
        ["Ziemniaki", "2"],
        ["Marchewka", "1"],
        ["Bulion drobiowy lub warzywny", "1 l"],
        ["Śmietana", "100 g"],
        ["Koperek", "kilka gałązek"],
      ],
      seas: "Sól · Pieprz · 1 łyżka masła · Szczypta gałki muszkatołowej",
      steps: [
        "Podziel kalafior na małe różyczki, pokrój ziemniaki w kostkę, a marchewkę w plasterki.",
        "Zagotuj bulion, dodaj ziemniaki i marchewkę i gotuj 10 minut.",
        "Dodaj kalafior i gotuj 10–12 minut, aż będzie miękki, ale nie rozpadnie się.",
        "Zahartuj śmietanę chochlą gorącej zupy i wmieszaj. Dodaj masło, gałkę, sól, pieprz i posiekany koperek.",
      ],
      tip: { add: "Bułka tarta zrumieniona na maśle na wierzchu", why: "Jak kalafior po polsku – dodaje chrupkości", skill: "Nie rozgotuj", how: "Sprawdź różyczkę nożem; zdejmij garnek, gdy nóż wchodzi łatwo, żeby różyczki zostały całe." }
    },
    'pl_jarzynowa': {
      name: "Zupa jarzynowa",
      ings: [
        ["Ziemniaki", "2"],
        ["Marchewka", "1"],
        ["Pietruszka (korzeń)", "1"],
        ["Seler", "1 mały plaster"],
        ["Por", "1/2"],
        ["Fasolka szparagowa", "100 g"],
        ["Zielony groszek (mrożony)", "80 g"],
        ["Bulion warzywny lub drobiowy", "1 l"],
        ["Natka pietruszki lub koperek", "kilka gałązek"],
      ],
      seas: "Sól · Pieprz · 1 łyżka masła · 1 liść laurowy · 2 ziela angielskie",
      steps: [
        "Pokrój ziemniaki, marchewkę, pietruszkę i seler w kostkę 1 cm, por w plasterki, a fasolkę w kawałki 2 cm.",
        "Roztop masło w garnku i podduś por 3 minuty. Wlej bulion, dodaj liść laurowy, ziele angielskie, marchewkę, pietruszkę i seler i gotuj 15 minut.",
        "Dodaj ziemniaki i fasolkę i gotuj 12 minut.",
        "Dodaj groszek i gotuj jeszcze 5 minut. Dopraw i posyp posiekanymi ziołami.",
      ],
      tip: { add: "Łyżka śmietany do każdego talerza", why: "Zupa jest łagodniejsza i bardziej kremowa – tak lubią dzieci", skill: "Krój równo", how: "Kostki tej samej wielkości gotują się tyle samo, więc nic nie jest twarde ani rozgotowane." }
    },
    'pl_pieczarkowa': {
      name: "Zupa pieczarkowa",
      ings: [
        ["Pieczarki", "300 g"],
        ["Cebula", "1"],
        ["Ziemniaki", "2"],
        ["Bulion drobiowy lub warzywny", "1 l"],
        ["Śmietana", "100 g"],
        ["Koperek lub natka", "kilka gałązek"],
      ],
      seas: "Sól · Pieprz · 1 łyżka masła",
      steps: [
        "Pokrój pieczarki w plasterki, a cebulę drobno posiekaj.",
        "Roztop masło w garnku na dość mocnym ogniu. Smaż cebulę 3 minuty, potem dodaj pieczarki i smaż ok. 8 minut, aż odparuje woda i lekko się zrumienią.",
        "Wlej bulion, dodaj ziemniaki w kostce i gotuj 15 minut do miękkości.",
        "Zahartuj śmietanę chochlą gorącej zupy, wmieszaj, dopraw i posyp posiekanym koperkiem.",
      ],
      tip: { add: "Cienki makaron jajeczny zamiast ziemniaków", why: "Druga popularna domowa wersja", skill: "Zrumień pieczarki", how: "Nie mieszaj bez przerwy; pozwól wodzie odparować, wtedy pieczarki się zrumienią i dadzą więcej smaku." }
    },
    'pl_fasolowa': {
      name: "Zupa fasolowa",
      ings: [
        ["Sucha biała fasola", "150 g"],
        ["Kiełbasa wędzona", "100 g"],
        ["Ziemniak", "1"],
        ["Marchewka", "1"],
        ["Pietruszka (korzeń)", "1"],
        ["Cebula", "1"],
        ["Przecier pomidorowy", "100 ml"],
      ],
      seas: "Sól · Pieprz · 1,2 l wody · 2 ząbki czosnku · 1 łyżeczka suszonego majeranku · 1 łyżeczka słodkiej papryki · 1 liść laurowy · 2 ziela angielskie · 1 łyżka oleju",
      steps: [
        "Poprzedniego wieczoru przepłucz fasolę i namocz ją na co najmniej 8 godzin w trzy razy większej ilości zimnej wody. Odcedź.",
        "Zalej fasolę 1,2 litra świeżej wody i gotuj na mocnym ogniu 10 minut. Dodaj liść laurowy i ziele angielskie, przykryj i gotuj 50–60 minut, aż fasola będzie całkiem miękka, bez twardego środka.",
        "Podsmaż posiekaną cebulę i pokrojoną kiełbasę na oleju 5 minut.",
        "Dodaj ziemniak, marchewkę i pietruszkę w kostce, kiełbasę z cebulą i przecier. Gotuj 20 minut, aż warzywa zmiękną.",
        "Wmieszaj przeciśnięty czosnek, majeranek i paprykę i dopraw solą i pieprzem.",
      ],
      tip: { add: "Odrobina wędzonego boczku podsmażona z cebulą", why: "Zupa jest bardziej wędzona i sycąca", skill: "Najpierw mocno zagotuj fasolę", how: "Dziesięć minut intensywnego wrzenia sprawia, że sucha fasola jest bezpieczna; potem zmniejsz ogień, żeby się nie rozpadła." }
    },
    'pl_szczawiowa': {
      name: "Zupa szczawiowa",
      ings: [
        ["Świeży szczaw (lub ze słoika)", "200 g"],
        ["Ziemniaki", "3"],
        ["Bulion drobiowy lub warzywny", "1 l"],
        ["Śmietana", "100 g"],
        ["Jajka", "2"],
      ],
      seas: "Sól · Pieprz · 1 łyżka masła · Szczypta cukru",
      steps: [
        "Włóż jajka do zimnej wody, zagotuj i gotuj 10 minut, aż żółtka będą ścięte. Ostudź w zimnej wodzie i obierz.",
        "Pokrój ziemniaki w kostkę i gotuj w bulionie 15 minut.",
        "Umyj szczaw, oderwij twarde łodyżki i posiekaj liście. Podduś je na maśle 2–3 minuty, dodaj do zupy i gotuj 5 minut.",
        "Zahartuj śmietanę chochlą gorącej zupy i wmieszaj. Dopraw solą, pieprzem i szczyptą cukru i podawaj z połówkami jajek.",
      ],
      tip: { add: "Posiekany koperek na wierzchu", why: "Odświeża kwaśny, cytrynowy smak", skill: "Zmiana koloru to norma", how: "Szczaw po podgrzaniu w kilka sekund robi się oliwkowy; tak właśnie ma wyglądać." }
    },
    'pl_botwinka': {
      name: "Botwinka",
      ings: [
        ["Botwina (młode buraki z liśćmi)", "1 pęczek"],
        ["Ziemniaki", "2"],
        ["Marchewka", "1"],
        ["Bulion warzywny lub drobiowy", "1 l"],
        ["Śmietana", "100 g"],
        ["Koperek", "1/2 pęczka"],
      ],
      seas: "Sól · Pieprz · 1 łyżka soku z cytryny · Szczypta cukru · 1 ząbek czosnku",
      steps: [
        "Dokładnie umyj botwinę. Obierz małe buraczki i pokrój w kostkę, łodyżki pokrój na kawałki 1 cm, a liście w paski.",
        "Gotuj buraczki, ziemniaki w kostce i startą marchewkę w bulionie 15 minut.",
        "Dodaj łodyżki i gotuj 5 minut, potem dodaj liście i gotuj jeszcze 3 minuty.",
        "Dopraw sokiem z cytryny, cukrem, przeciśniętym czosnkiem, solą i pieprzem. Zahartuj śmietanę gorącą zupą, wmieszaj i dodaj dużo koperku.",
      ],
      tip: { add: "Jajko na twardo do każdego talerza", why: "Ulubiony wczesnoletni dodatek, który syci", skill: "Cytryna dla koloru", how: "Odrobina kwasu sprawia, że zupa ma żywy różowy kolor zamiast mętnego brązu." }
    },
    'pl_chlodnik': {
      name: "Chłodnik litewski",
      ings: [
        ["Małe buraki (najlepiej z liśćmi)", "3"],
        ["Kefir lub maślanka", "500 ml"],
        ["Ogórek", "1"],
        ["Rzodkiewki", "5"],
        ["Koperek", "1/2 pęczka"],
        ["Szczypiorek", "kilka źdźbeł"],
        ["Jajka", "2"],
      ],
      seas: "Sól · Pieprz · 200 ml wody · 1 łyżka soku z cytryny · Szczypta cukru · 1 ząbek czosnku",
      steps: [
        "Obierz buraki i zetrzyj na grubych oczkach (młode liście i łodyżki posiekaj). Gotuj je w 200 ml wody z sokiem z cytryny i szczyptą soli 10–12 minut do miękkości, potem całkowicie ostudź.",
        "Gotuj jajka 10 minut, aż będą zupełnie ścięte, ostudź w zimnej wodzie i obierz.",
        "Pokrój ogórka w kostkę, rzodkiewki w cienkie plasterki, a koperek i szczypiorek drobno posiekaj.",
        "Wmieszaj kefir do ostudzonych buraków razem z wywarem, aż całość będzie równo różowa. Dodaj warzywa i przeciśnięty czosnek, dopraw solą, pieprzem i cukrem.",
        "Schłódź co najmniej 1 godzinę i podawaj zimny z połówkami jajek.",
      ],
      tip: { add: "Gorące młode ziemniaki z koperkiem obok", why: "Klasyczny letni kontrast zimnej zupy i ciepłych ziemniaków", skill: "Najpierw ostudź", how: "Ciepłe buraki mogą zważyć kefir; poczekaj, aż całkiem ostygną." }
    },
    'pl_kartoflanka': {
      name: "Kartoflanka",
      ings: [
        ["Ziemniaki", "500 g"],
        ["Marchewka", "1"],
        ["Pietruszka (korzeń)", "1"],
        ["Cebula", "1"],
        ["Boczek wędzony", "60 g"],
        ["Bulion warzywny", "1 l"],
        ["Natka pietruszki lub koperek", "kilka gałązek"],
      ],
      seas: "Sól · Pieprz · 1 łyżka masła · 1 łyżeczka suszonego majeranku · 1 liść laurowy · 2 ziela angielskie · 2 ząbki czosnku",
      steps: [
        "Pokrój ziemniaki w kostkę 1,5 cm, zetrzyj marchewkę i pietruszkę, posiekaj cebulę.",
        "Jeśli używasz boczku, pokrój go w kostkę i smaż w garnku 4 minuty. Dodaj masło i cebulę i smaż 4 minuty, aż zmięknie.",
        "Wlej bulion, dodaj liść laurowy, ziele angielskie, marchewkę, pietruszkę i ziemniaki i gotuj 20 minut, aż ziemniaki będą bardzo miękkie.",
        "Rozgnieć kilka kawałków ziemniaków o ściankę garnka, żeby zagęścić zupę. Wmieszaj przeciśnięty czosnek i majeranek, dopraw i posyp ziołami.",
      ],
      tip: { add: "Plasterki podsmażonej kiełbasy", why: "Prosty sposób, żeby zupa była całym obiadem", skill: "Majeranek na koniec", how: "Rozetrzyj suszony majeranek w dłoniach i dodaj tuż przed podaniem, żeby zachował mocny aromat." }
    },
    'pl_brokulowa': {
      name: "Zupa krem z brokułów",
      ings: [
        ["Brokuł", "1 główka (400 g)"],
        ["Ziemniak", "1"],
        ["Cebula", "1/2"],
        ["Bulion warzywny", "800 ml"],
        ["Śmietanka (18–30%)", "100 ml"],
        ["Pieczywo na grzanki", "2 kromki"],
      ],
      seas: "Sól · Pieprz · 1 łyżka masła · 1 ząbek czosnku · Szczypta gałki muszkatołowej",
      steps: [
        "Podziel brokuł na różyczki, obierz i pokrój głąb w plasterki, ziemniak pokrój w kostkę, a cebulę posiekaj.",
        "Roztop masło w garnku i podduś cebulę z czosnkiem 3 minuty, aż zmiękną.",
        "Wlej bulion, dodaj ziemniak i głąb brokuła i gotuj 10 minut. Dodaj różyczki i gotuj 8 minut do miękkości.",
        "Zmiksuj na gładko, wmieszaj śmietankę, podgrzej bez gotowania i dopraw. Podawaj z kostkami pieczywa zrumienionymi na suchej patelni.",
      ],
      tip: { add: "Kilka różyczek odłożonych w całości", why: "Dodają tekstury i ładnie wyglądają na talerzu", skill: "Nie wyrzucaj głąba", how: "Obrany głąb jest słodki i zagęszcza zupę; potrzebuje tylko kilku minut dłużej." }
    },
    'pl_dyniowa': {
      name: "Zupa krem z dyni",
      ings: [
        ["Dynia (np. Hokkaido)", "600 g"],
        ["Marchewka", "1"],
        ["Cebula", "1"],
        ["Bulion warzywny", "700 ml"],
        ["Śmietanka (18–30%)", "100 ml"],
      ],
      seas: "Sól · Pieprz · 1 łyżka masła · 1 ząbek czosnku · 1 łyżeczka startego świeżego imbiru · Szczypta gałki muszkatołowej",
      steps: [
        "Usuń pestki z dyni i pokrój ją w kostkę (Hokkaido nie trzeba obierać). Pokrój marchewkę w plasterki i posiekaj cebulę.",
        "Roztop masło w garnku i podduś cebulę z czosnkiem 3 minuty. Dodaj dynię i marchewkę i mieszaj jeszcze 3 minuty.",
        "Wlej bulion, przykryj i gotuj 20 minut, aż dynia będzie bardzo miękka.",
        "Zmiksuj na gładko, dodaj śmietankę, imbir, gałkę, sól i pieprz i podgrzej bez gotowania.",
      ],
      tip: { add: "Pestki dyni uprażone na suchej patelni", why: "Chrupiący, orzechowy dodatek", skill: "Wybierz słodką dynię", how: "Hokkaido lub piżmowa dają słodszą i gęstszą zupę niż duże, wodniste dynie." }
    },
    'pl_soczewicowa': {
      name: "Zupa z czerwonej soczewicy",
      ings: [
        ["Czerwona soczewica", "150 g"],
        ["Marchewka", "1"],
        ["Cebula", "1"],
        ["Przecier pomidorowy", "200 ml"],
        ["Bulion warzywny", "1 l"],
        ["Natka pietruszki", "kilka gałązek"],
      ],
      seas: "Sól · Pieprz · 2 ząbki czosnku · 1 łyżeczka słodkiej papryki · 1/2 łyżeczki mielonego kuminu · 1 łyżka oleju · 1 łyżka soku z cytryny",
      steps: [
        "Płucz soczewicę na sitku, aż woda będzie czysta.",
        "Podsmaż posiekaną cebulę i startą marchewkę na oleju 5 minut, potem dodaj czosnek, paprykę i kumin i mieszaj 1 minutę.",
        "Dodaj soczewicę, bulion i przecier i gotuj 20 minut, od czasu do czasu mieszając, aż soczewica się rozpadnie.",
        "Krótko zmiksuj albo zostaw w kawałkach. Dopraw solą, pieprzem i sokiem z cytryny i posyp natką.",
      ],
      tip: { add: "Łyżka jogurtu naturalnego", why: "Łagodzi przyprawy i dodaje kremowości", skill: "Dobrze wypłucz", how: "Płukanie usuwa pył i pianę, więc zupa ma czysty smak i nie kipi." }
    },
    'pl_koperkowa': {
      name: "Zupa koperkowa",
      ings: [
        ["Koperek", "1 duży pęczek"],
        ["Ziemniaki", "3"],
        ["Marchewka", "1"],
        ["Pietruszka (korzeń)", "1"],
        ["Bulion drobiowy lub warzywny", "1 l"],
        ["Śmietana", "100 g"],
      ],
      seas: "Sól · Pieprz · 1 łyżka masła",
      steps: [
        "Pokrój ziemniaki w kostkę, zetrzyj marchewkę i pietruszkę.",
        "Gotuj je w bulionie 15–20 minut, aż ziemniaki zmiękną.",
        "Drobno posiekaj koperek razem z cienkimi łodyżkami. Połowę dodaj do zupy i gotuj 2 minuty.",
        "Zahartuj śmietanę chochlą gorącej zupy i wmieszaj. Zdejmij z ognia, dodaj resztę koperku i masło i dopraw.",
      ],
      tip: { add: "Ryż lub cienki makaron zamiast ziemniaków", why: "Obie wersje są popularne w polskich domach", skill: "Koperek w dwóch turach", how: "Gotowany koperek aromatyzuje wywar, a świeży na końcu zachowuje kolor i zapach." }
    },
    'pl_gulaszowa': {
      name: "Zupa gulaszowa",
      ings: [
        ["Łopatka wołowa", "300 g"],
        ["Cebula", "2"],
        ["Czerwona papryka", "1"],
        ["Ziemniaki", "2"],
        ["Marchewka", "1"],
        ["Przecier pomidorowy", "200 ml"],
      ],
      seas: "Sól · Pieprz · 1,2 l wody · 2 łyżeczki słodkiej papryki · 1/2 łyżeczki ostrej papryki · 1 łyżeczka suszonego majeranku · 2 ząbki czosnku · 1 liść laurowy · 2 łyżki oleju",
      steps: [
        "Pokrój wołowinę w kostkę 2 cm i obsmaż ją na oleju na mocnym ogniu w dwóch partiach, po ok. 5 minut. Wyjmij.",
        "W tym samym garnku smaż posiekaną cebulę 5 minut, aż zmięknie. Dodaj czosnek i obie papryki i mieszaj 30 sekund.",
        "Włóż z powrotem mięso, wlej wodę, dodaj liść laurowy, przykryj i gotuj na małym ogniu ok. 1 godziny, aż wołowina będzie miękka.",
        "Dodaj ziemniaki, marchewkę i paprykę pokrojone w kostkę, przecier i majeranek i gotuj 20 minut, aż ziemniaki zmiękną.",
        "Dopraw solą i pieprzem i podawaj gorącą z pieczywem.",
      ],
      tip: { add: "Łyżka śmietany na wierzchu", why: "Łagodzi ostrość papryki", skill: "Papryka nie na mocnym ogniu", how: "Mielona papryka szybko się przypala i gorzknieje; wmieszaj ją na chwilę i od razu wlej płyn." }
    },
    'pl_grzybowa': {
      name: "Zupa grzybowa",
      ings: [
        ["Suszone borowiki lub grzyby leśne", "30 g"],
        ["Cebula", "1"],
        ["Marchewka", "1"],
        ["Pietruszka (korzeń)", "1"],
        ["Śmietana", "100 g"],
        ["Cienki makaron lub łazanki", "100 g"],
      ],
      seas: "Sól · Pieprz · 1 l wody · 1 liść laurowy · 2 ziela angielskie · 1 łyżka masła · 1 łyżka mąki",
      steps: [
        "Poprzedniego wieczoru (lub co najmniej 3 godziny wcześniej) przepłucz suszone grzyby i namocz je w 500 ml wody.",
        "Przelej wodę z moczenia do garnka, zostawiając piasek na dnie, i dodaj grzyby, kolejne 500 ml wody, liść laurowy, ziele angielskie oraz marchewkę i pietruszkę w dużych kawałkach. Gotuj 40 minut, aż grzyby zmiękną.",
        "Wyjmij marchewkę i pietruszkę. Wyjmij grzyby, pokrój je w paski i włóż z powrotem do garnka.",
        "Zeszklij posiekaną cebulę na maśle przez 5 minut i dodaj do zupy. Wymieszaj śmietanę z mąką, zahartuj gorącą zupą, wmieszaj i gotuj 3 minuty. Dopraw.",
        "Ugotuj makaron osobno w osolonej wodzie, odcedź i zalej go zupą.",
      ],
      tip: { add: "Kilka świeżych pieczarek podsmażonych na maśle", why: "Dodaje treści, gdy suszonych grzybów jest mało", skill: "Zachowaj wodę z moczenia", how: "W niej jest większość grzybowego smaku; przelewaj powoli, żeby piasek został na dnie." }
    },
    'pl_szparagowa': {
      name: "Zupa szparagowa",
      ings: [
        ["Szparagi białe lub zielone", "500 g"],
        ["Ziemniaki", "2"],
        ["Bulion warzywny lub drobiowy", "1 l"],
        ["Śmietanka (18%)", "100 ml"],
        ["Natka pietruszki", "kilka gałązek"],
      ],
      seas: "Sól · Pieprz · 1 łyżka masła · Szczypta cukru · 1 łyżeczka soku z cytryny",
      steps: [
        "Białe szparagi obierz od główki w dół (zielonym wystarczy odłamać zdrewniałe końce). Odetnij 3-centymetrowe główki i odłóż; resztę pokrój.",
        "Gotuj pokrojone łodygi i ziemniaki w kostce w bulionie 20 minut do miękkości.",
        "Zmiksuj na gładko, a jeśli białe szparagi były włókniste, przetrzyj przez sito.",
        "Dodaj główki i gotuj 5 minut. Wmieszaj śmietankę, masło, cukier i sok z cytryny, dopraw i posyp natką.",
      ],
      tip: { add: "Najpierw ugotuj obierki w bulionie", why: "Wyciąga dodatkowy szparagowy smak z tego, co poszłoby do kosza", skill: "Dokładnie obierz białe szparagi", how: "Skórka białych szparagów jest gorzka i łykowata; obieraj dookoła tuż spod główki." }
    },
  }
});
