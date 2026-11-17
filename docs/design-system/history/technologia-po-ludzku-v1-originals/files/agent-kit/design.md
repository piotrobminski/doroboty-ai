# DoRoboty.ai — Technologia po ludzku

Pakiet dla agenta · v1 · 13.11.2026. Punkt wejścia do budowania kolejnych ekranów. Dokumentacja dla designerów została zaakceptowana w rozmowie przed zleceniem tego pakietu. Jej historyczny plik v1 zachowuje etykietę „do oceny”; poniżej jawnie opisujemy dodatkowe decyzje implementacyjne pakietu.

## Zacznij tutaj

1. Przeczytaj ten plik i dobierz kompozycję strony.
2. Otwórz [galerię](../ui-examples.html) przez serwer HTTP. Sprawdź szeroki i wąski widok.
3. Dobierz klasy i moduły z [kontraktu komponentów](components.md). To kontrakt źródeł w tym projekcie, nie zewnętrzny pakiet npm.
4. Dla dokładnego wariantu zajrzyj do [pełnej dokumentacji dla designerów](../docs/design-system/v1/index.html#components) i jej kadrów źródłowych. [Otwarte kwestie](../docs/design-system/v1/index.html#issues) pozostają istotne; przyjęcie pakietu nie oznacza, że każda z nich została rozwiązana.
5. Zbuduj zachowania, uruchom odpowiednie kontrole i porównaj wynik wizualnie.

Aktywny zakres: katalog `listing/`, trzy bieżące strony i niniejszy pakiet. `DESIGN.md` w katalogu nadrzędnym dotyczy wcześniejszego landingu; nie jest aktualnym kontraktem tego job boardu. Starsze propozycje oznaczeń A/B nie są aktywnymi wariantami nowych ekranów.

## Uruchomienie

W repozytorium:

```sh
cd /Users/piotr.obminski/Documents/ChatGPT/DoRoboty.AI/listing
npm run dev
```

W rozpakowanym archiwum wejdź do jego katalogu głównego i wykonaj `npm run dev`. Serwer używa Node.js i wyłącznie modułów wbudowanych; nie trzeba instalować zależności. Pakiet sprawdzono na wersji Node podanej w [raporcie weryfikacji](verification.json).

Otwórz:

- `http://127.0.0.1:4173/ui-examples.html` — galeria i interakcje w pamięci.
- `http://127.0.0.1:4173/ui-long-content.html` — kompletne złożenie oferty z długimi nazwami, fallbackiem logo i brakiem pensji.
- `http://127.0.0.1:4173/` — pełny listing z wyszukiwaniem i filtrami.
- `http://127.0.0.1:4173/job.html?id=forma-ai-product-designer` — oferta i formularz aplikacji demo.
- `http://127.0.0.1:4173/create-job.html` — trzy etapy tworzenia oferty, szkic i lokalna publikacja.
- `http://127.0.0.1:4173/docs/design-system/v1/` — dokumentacja designerów.

Jeśli port jest już zajęty, nie zatrzymuj cudzego procesu. Uruchom osobny podgląd poleceniem `PORT=4174 npm run dev` i zmień port w adresie. Port i host tworzą osobną przestrzeń pamięci przeglądarki. Moduły ES wymagają HTTP; otwarcie przykładów przez `file://` nie jest wspieranym sposobem uruchomienia.

## Statusy zasad

- **P — potwierdzone:** decyzja użytkownika lub bieżąca kompozycja widoczna w dokumentacji.
- **P-spec — implementacja:** dokładna deklaracja w istniejącym kodzie; nie każde jej wystąpienie jest osobno zatwierdzonym tokenem zespołu.
- **I — decyzja pakietu:** konkretne rozstrzygnięcie potrzebne do działania i ponownego użycia, wymienione niżej.
- **R — rekomendacja:** pomoc przy nowym projekcie; nie udawaj, że pochodzi z zaakceptowanej makiety.
- **? / T:** otwarta kwestia albo konieczny test wdrożenia. Dokumentacja wizualna i sam atrybut ARIA nie dowodzą dostępności.

## Charakter i priorytety

**P:** Królewski fiolet `#7B2CBF` jest głównym akcentem marki. Limonka `#C2F970` jest dopełnieniem. Dominują papier `#F7F5ED`, powierzchnia karty `#FFFEF9`, grafit `#171B19` i czytelna hierarchia informacji.

Najpierw rola, warunki i następna akcja. Potem firma, obszar pracy i umiejętności. Dekoracja wspiera wejście; powtarzalne dane mają zostać spokojne. Efekt technologiczny pochodzi z precyzyjnych diagramów, indeksów mono i detalu. Człowieka pokazuje zaakceptowany kolaż oraz naturalny język.

**P:** Ekspresja nie jest równomiernie rozłożona. Listing ma plakatowe hero. Oferta ma grafitowy pas tytułu i spokojną treść. Formularz ma grupy pól, nawigację etapów i czytelną informację zwrotną. Nie kopiuj dużej ilustracji do każdego zadania.

**R:** Unikaj neonowego miasta, glow, glitch, szkła, gradientowego SaaS-u i robotów jako domyślnego obrazu AI. Nie ozdabiaj każdej karty nową ilustracją. Nowy ekran powinien być rozpoznawalny po kompozycji i języku, a nie po fioletowym kolorze wszystkich powierzchni.

## Kompozycja całej strony

### Odkrywanie i listing

Kompaktowy nagłówek → dzielone hero z człowiekiem → wyszukiwarka → filtry i lista. W desktopie filtry zajmują węższą kolumnę. Na mobile hero się składa, filtry przechodzą nad wynikami, a karty zawijają treść.

Użyj [index.html](../index.html), [app.js](../app.js), [listing-components.mjs](../listing-components.mjs). Rodziny dokumentacji: 01, 03, 12–17, 24. Przy nowym typie listy zachowaj rytm i dobierz rzeczywiste fakty rekordu.

### Oferta kandydata

Powrót z kontekstem → grafitowy nagłówek roli → jawne fakty → opis i wymagania → panel aplikowania. Limonka wyróżnia kontekstową akcję. Długie akapity mają szerokość czytania do 65ch. Mobile przenosi akcję bliżej warunków i zachowuje pełną treść.

Użyj [job.html](../job.html), [job-view.mjs](../job-view.mjs), [job.js](../job.js). Rodziny 02–11, 17–20, 22–24. `offerMarkup()` renderuje widok, a zachowania są obowiązkiem strony. W podglądzie `preview:true` aplikowanie pozostaje prezentacją.

### Formularz i zadanie rekrutera

Nagłówek zadania → trzy etapy → semantyczne grupy pól → jedna główna akcja. Podsumowanie na desktopie jest pomocnicze. Przy małej szerokości może zniknąć, ale pola i podgląd muszą nadal przekazywać wszystkie warunki.

Użyj [create-job.html](../create-job.html), [create-job.js](../create-job.js), [job-store.mjs](../job-store.mjs). Rodziny 08–11, 20–25. To sekwencja z walidacją, nie automatycznie wzorzec tabs. Nie udawaj publicznej publikacji po zapisie w localStorage.

### Puste wyniki

Zachowaj wyszukiwarkę i kryteria. Wyjaśnij stan i daj konkretną akcję. Brak wyników po filtrze oraz brak zapisanych ofert mają odmienne copy. Niedostępna oferta ma własny powrót do listy.

## Fundament w kodzie

Dla nowej strony HTML zapisanej bezpośrednio w `listing/`:

```html
<link rel="stylesheet" href="agent-kit/foundation.css">
<body class="tph-theme tph-agent-ui" data-icon-scheme="marker">
  <main class="shell"><!-- semantyczna kompozycja strony --></main>
</body>
```

Dla strony w podkatalogu przelicz ścieżki względem jej URL. Nie używaj ścieżek do katalogu instalacyjnego skilla. Kod ikon generuje URL `assets/employers/...` względem dokumentu: trzymaj strony na poziomie `listing/`, zachowaj to drzewo po eksporcie albo dostosuj resolver assetów jawnie. Nie dodawaj `<base>` bez sprawdzenia wszystkich linków i kotwic.

[foundation.css](foundation.css) importuje w kolejności:

1. [assets/tokens.css](../assets/tokens.css) — zmienne pod `.tph-theme`, w tym aliasy i skale.
2. [styles.css](../styles.css) — istniejący fundament strony, listing, akcje, nawigacja, dialog, media queries.
3. [icon-colors.css](../icon-colors.css) — logo i oznaczenia obszarów.
4. [job-pages.css](../job-pages.css) — szczegół, formularze, etapy i podgląd.
5. Kilka poprawek wyłącznie pod `.tph-agent-ui`, opisanych niżej.

To rzeczywiste źródła używane w projekcie, a nie druga biblioteka o podobnym wyglądzie. `styles.css` zawiera globalny reset, style body i h 1. W istniejącym projekcie z innym motywem najpierw oceń te efekty i mapuj tokeny oraz potrzebne reguły do jego systemu. Nie importuj całego entrypointu bezrefleksyjnie do obcej aplikacji.

[examples.css](examples.css) odpowiada tylko za układ galerii `.kit-*`. **Nie importuj go do stron produktu.** Nie definiuje kolorów ani kopii stylów kart, pól czy przycisków.

## Role typografii i geometrii

**P-spec:** Sans: `Arial, Helvetica, sans-serif`; mono: `SFMono-Regular, Consolas, Liberation Mono, monospace`. To stosy, nie obowiązek instalowania nowego fontu. Wagi i wielkości są rolami komponentów, nie dowolnym wyborem dla każdego akapitu.

| Rola | Bieżące zastosowanie |
| --- | --- |
| Hero listingu | `clamp(40px,4.8vw,64px)`, line-height 1.04; własny profil mobile. |
| Tytuł oferty | `clamp(34px,4.1vw,53px)`, 1.08; mobile 34px. |
| Karta | Tytuł 21/20px, 700, 1.2; firma 12px; fakty 13px. |
| Treść oferty | Akapit 16/1.75, wstęp 17px; listy 15px; do 65ch. |
| Formularz | Label 13/600; kontrolka 14px, mobile 16px; pomoc 11px, błąd 12px. |
| Indeks / metadane | Mono, zwykle 10–11px; nie używaj do długiej treści. |

**P-spec:** Shell ma maksymalnie 1304px z paddingiem 32px, czyli do 1240px treści. Media queries w istniejących stylach: 1100, 850, 600 i 359px; osobne dopasowanie hero od 1500px. Przy mniejszym kliencie treść nie ma zawsze 1240px.

- Karta 12px radius; pola 7px; radio-kafle 8px; dialog 14px/10px mobile. Zróżnicowanie zostało zachowane.
- Token promienia kontrolki wynosi 8px, ale istniejące pola mają 7px. Nie zmieniaj po cichu wszystkich do jednego rozmiaru.
- Token gutter-mobile wynosi 16px, listing używa 18px i 14px w najmniejszym profilu. Nowy layout powinien świadomie wybrać profil.
- Większość celów ma min. 44px, główne wyszukiwanie/aplikowanie 48px, pola 46px; istniejący nagłówek listingu ma CTA42px. Nie wyciągaj zgodności WCAG z pojedynczej wysokości.
- W selectach zachowaj `padding-right:42px`, chevron 16px i odsunięcie 14px od prawej krawędzi.

## Wybór i znaczenie komponentów

| Potrzeba | Użyj | Nie myl z |
| --- | --- | --- |
| Firma | Neutralny `.employer-mark` + logo/initials i widoczna nazwa | Kolor doświadczenia. |
| Obszar AI | `.area-marker` / `.area-label`, zawsze Build/Apply/Lead | Seniority ani oceną oferty. |
| Informacja | Pasywny `.tag` | Usuwalnym filtrem. |
| Aktywne kryterium | Przycisk `.active-filter` z nazwą usunięcia | Umiejętnością w karcie. |
| Jedna kategoria | Natywne radio w `.area-option` | Niezależnymi checkboxami. |
| Skończona lista wartości | Natywny select | Doprojektowanym comboboxem bez potrzeby. |
| Rozwinięcie filtrów | `details.additional-filters > summary` | Modalnym panelem off-canvas, którego tu nie ma. |
| Błąd wartości | Tekst przy polu + aria-invalid i opis | Samą czerwoną ramką lub przemijającym toastem. |
| Krótkie potwierdzenie | `.toast[role=status]` | Końcowym potwierdzeniem całego zadania. |
| Sekwencja edycji | `.composer-steps` z aria-current=step | Statyczną listą procesu rekrutacji. |

**P:** Aktywne C: duży znak to firma, mały marker to obszar. Build ma fioletowy tint, Apply szałwiowy, Lead szaroniebieski. To równorzędne obszary. Lead jako obszar i Lead jako doświadczenie są osobnymi danymi. Apply oznacza użycie AI w pracy; nie jest nazwą przycisku aplikowania.

**P:** Wyróżnienie ma fioletowy akcent i napis. Nie oznacza dopasowania AI, weryfikacji firmy ani lepszej jakości. Nie dodawaj Match Score, bo bieżący system go nie pokazuje.

## Decyzje implementacyjne pakietu

| Id | Decyzja | Zakres i uzasadnienie |
| --- | --- | --- |
| I01 | Textarea jawnie dziedziczy sans. | Tylko `.tph-agent-ui`; rozwiązuje lukę resetu fontu opisaną w v1, zamiast uznać domyślny monospace przeglądarki za świadomy standard. |
| I02 | Placeholder pól używa `--tph-muted`. | Tylko `.tph-agent-ui`; stosuje istniejący ciemniejszy kolor zamiast jaśniejszej wartości `#747B6D`. Nadal testuj rzeczywiste pary. |
| I03 | Focus na istniejących powierzchniach grafitowych używa `--tph-focus-on-dark`. | Tylko wybrane selektory pod `.tph-agent-ui`. Nie tworzy dark mode. |
| I04 | Długie tagi mogą zawijać tekst. | Tylko `.tph-agent-ui`; zabezpiecza długie nazwy umiejętności. Nie zmienia danych i nie ucina ich arbitralnie. |
| I05 | `jobCardMarkup()` i `emptyStateMarkup()` wydzielono z listingu. | Te same funkcje obsługują galerię i produkcyjny lokalny listing. Geometria karty i klas pozostaje ta sama. |
| I06 | Zakładka współdzielonej karty ma stałą nazwę i `aria-pressed`. | „Zapisz ofertę: …” nie zmienia się po przełączeniu; stan i toast informują o zapisie. To rozstrzygnięcie modelu toggle z otwartej kwestii dokumentacji. Starszy przycisk zapisu w `job.js` nadal ma własny model tekstu i wymaga osobnego przeglądu. |
| I07 | W galerii: stan w pamięci, unikalne headingId, przykładowy file limit 5MiB. | Nie dotyka istniejącego localStorage. Galeria jasno oddziela podgląd stanu etapów od pełnego procesu z walidacją. |

**I08:** [dialog.mjs](dialog.mjs) dodaje pętlę Tab/Shift+Tab na granicach natywnego dialogu. Test w użytej przeglądarce wykazał opuszczenie kontrolek po ostatniej akcji; helper domyka ten przypadek. Otwieranie, Escape i powrót focusu nadal należą do natywnego dialogu i kontrolera strony.

Te decyzje nie zmieniają historycznych zrzutów ani nie przemianowują istniejących tokenów. Nowe strony wybierają `.tph-agent-ui` jawnie. W istniejącej stronie nie dołączaj adaptera bez sprawdzenia różnic wizualnych.

## Dane, zachowania i granice

- CSS nie nadaje zachowania. Funkcje renderujące zwracają markup; strona utrzymuje stan, reaguje na `data-save`, przywraca focus i obsługuje błędy.
- Używaj [modelu danych](components.md#dane-oferty), walidacji `validateDraft()` i bezpiecznych linków. Nie wstawiaj nieprzefiltrowanej treści jako HTML.
- Brak widełek to `min:null,max:null` i komunikat „Widełki niepodane”. Nie podstawiaj zera ani wymyślonej pensji. B2B=netto, UoP=brutto w tym prototypie, PLN/miesiąc.
- `getJobs()` domyślnie czyta lokalne oferty plus 12 fikcyjnych. Galeria importuje `jobs` bezpośrednio, aby pozostać izolowana od danych użytkownika.
- Szkic i lokalna publikacja używają localStorage w aktualnej przeglądarce i originie. Nie nazywaj ich publiczną publikacją ani synchronizacją konta.
- Aplikacja demo na `job.html` nie wysyła danych ani plików do firmy. Zewnętrzny URL może prowadzić do ATS, jeśli istnieje w rekordzie. Nie dodawaj transmisji, auth, analityki ani integracji przy samym odwzorowaniu stylu.
- Poza zakresem: pełny dark mode, nowe kategorie, wielojęzyczność/RTL, wiele walut, rich text i nowe AI features. Rozszerzenie wymaga jawnej decyzji, nie interpretacji dekoracji.

## Weryfikacja nowego ekranu

1. Sprawdź główny cel: czy tytuł, warunki i następna akcja są widoczne przed ozdobami?
2. Porównaj z odpowiednim kadrem w dokumentacji. Listing S01/S02, oferta S06/S07, formularz S11/S12/S15/S16.
3. Renderuj około 1280px i 390px oraz najmniejszą wspieraną szerokość, obecnie 320px. Zbadaj długą nazwę firmy, wieloliniowy tytuł, brak kwoty i długi pojedynczy tag. Nie pomniejszaj całego desktopu.
4. Przejdź klawiaturą po istotnych akcjach. Focus ma być widoczny i nie może całkowicie znikać pod sticky treścią. Po dialogu wraca do wywołania. Usunięcie chipa nie może gubić focusu.
5. Przetestuj poprawne i błędne dane, zmianę kategorii/umowy/trybu, disabled widełki, puste wyniki i odzyskanie listy. Nie deklaruj realnej wysyłki, jeśli działa tylko demo.
6. Sprawdź etykiety i błędy z czytnikiem, powiększenie 200%, reflow 320px, większe odstępy tekstu oraz forced-colors. To osobne testy; screenshot mobile ich nie zastępuje.
7. Uruchom odpowiednie polecenia:

```sh
npm run check
npm test
npm run build
npm run export:agent
```

`npm test` obejmuje kontrakt renderowania, ochronę treści/linków i istniejące testy modelu szkicu/publikacji. To nie zestaw automatycznych testów dostępności. `build` odtwarza lokalny `dist/`; `export:agent` odtwarza wyłącznie `dist-agent-kit/`. Nie zmieniaj ręcznie tych katalogów jako źródła.

Cel rekomendowany: WCAG 2.2 AA. Konkretne kryteria, wyjątki i oficjalne źródła znajdują się w [F04 dokumentacji](../docs/design-system/v1/index.html#f 04). Dla toggle i dialogu stosuj właściwe wzorce APG; nie nazywaj produktu zgodnym na podstawie samego CSS.

## Przekazanie pracy

Wskaż zmienione źródła, uruchamialny adres, rzeczywiście sprawdzone interakcje i szerokości oraz pozostałe ograniczenia. Zapisz screenshoty aktualnego wyniku. Nie przedstawiaj rekomendacji ani decyzji pakietu jako odkrytego standardu zespołu.

Aktualny zakres sprawdzenia pakietu: [verification.json](verification.json). Źródła wizualne i ich metryka: [manifest dokumentacji](../docs/design-system/v1/evidence/manifest.json). Nowe komponenty i adapter są udokumentowanym dodatkiem do tej wersji źródeł, nie retroaktywną zmianą jej hashy.
