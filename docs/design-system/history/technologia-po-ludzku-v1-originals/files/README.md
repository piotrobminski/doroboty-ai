# DoRoboty.ai — listing, oferta i formularz rekrutera

Samodzielna strona listingu zbudowana od podstaw w kierunku **Technologia po ludzku**, wyłącznie na podstawie skilla `human-technology-ui` i jego dołączonych referencji oraz assetów. Poprzednia implementacja strony nie była źródłem projektu. Nowe pliki znajdują się w `listing/`.

## Uruchomienie

W tym katalogu:

```sh
npm run dev
```

Podgląd: `http://127.0.0.1:4173`. Można ustawić inny port przez zmienną `PORT`. Strona nie wymaga instalowania zależności. Wymagany jest Node.js z obsługą modułów ESM.

```sh
npm run check
npm run build
```

Build tworzy samodzielną stronę statyczną w `dist/`. Serwuj ją przez HTTP, ponieważ korzysta z modułów JavaScript. Testy przeglądarkowe i kadry znajdują się w `qa/`.

## Zachowanie

- Wyszukiwanie po roli, firmie, umiejętnościach i kategoriach, także bez polskich znaków.
- Łączone filtry: Build / Apply / Lead, lokalizacja biura, doświadczenie, umowa, praca zdalna i dostępne widełki.
- Aktualne liczniki, usuwanie pojedynczych kryteriów oraz reset filtrów.
- Sortowanie po dacie albo górnej granicy podanych widełek. Karty zachowują oznaczenia netto/brutto i typu umowy; kwoty nie są przeliczane między formami zatrudnienia.
- Zapisane oferty w `localStorage`, oddzielny widok zapisanych i stan pusty. Przy niedostępnej pamięci przeglądarki zmiany pozostają w pamięci bieżącej strony.
- Pełna [strona oferty dla kandydata](job.html?id=forma-ai-product-designer): warunki, obowiązki, wymagania, kontekst AI, firma, zapisanie oferty i formularz aplikacji demonstracyjnej. Link powrotu zachowuje filtry listingu. Starsze linki przez hash przekierowują do strony oferty.
- [Tworzenie oferty dla rekrutera](create-job.html) w trzech etapach: podstawy, opis, podgląd. Działa zapis i przywracanie szkicu, walidacja pól i wynagrodzenia, podgląd oparty na tym samym komponencie co strona kandydata oraz publikacja do lokalnego listingu.
- Nowe oferty zapisują się w `localStorage`. Nowe miasta pojawiają się również w filtrze lokalizacji. Potwierdzenie publikacji wyraźnie wskazuje lokalny charakter prototypu.
- Filtry w adresie URL, dopasowanie do małych ekranów, widoczny fokus i ograniczenie ruchu zgodnie z ustawieniami systemu.

Dane bazowe są demonstracyjne: 12 fikcyjnych ofert i firm w `jobs.mjs`, uzupełniane ofertami utworzonymi lokalnie przez formularz rekrutera. Strona nie łączy się z zewnętrzną bazą i nie zawiera śledzenia ani zewnętrznych zależności. Formularz aplikacji testowej nie wysyła ani nie zapisuje danych kandydata lub plików. Jeśli autor poda zewnętrzny adres aplikowania, przycisk prowadzi do tego adresu. Tokeny, diagramy i oryginalna ilustracja pochodzą ze skilla i są zapisane w lokalnych assetach; strona nie wymaga dostępu do katalogu skilla.

Testy logiki zapisu, walidacji i bezpiecznego renderowania: `node --test qa/job-pages/data.test.mjs`. Zapis sprawdzenia obu stron w przeglądarce i kadry: `qa/job-pages/`.

Po korekcie wizualnej hero korzysta z wersji ilustracji z przezroczystym tłem, przygotowanej w imagegen, oraz dolnego wygaszenia CSS. Oryginał zachowano. Strzałki dodatkowych filtrów mają odsunięcie 14px od krawędzi, a wszystkie zastępcze znaki firm jednakowe, neutralne tło. [Grafika i prompt edycji](qa/visual-refinement/image-edit.md), [sprawdzenie poprawek](qa/visual-refinement/verification.json).

Zatwierdzono ilustrację z prostymi cięciami i geometrycznymi narożnikami (`assets/human-technology-hero-angular.png`) oraz wariant C oznaczeń jako domyślny. Duże znaki to 12 fikcyjnych logotypów firm z `assets/employers/`; małe kolorowe symbole oznaczają Build / Apply / Lead. Logo jest przypisane do firmy i nie zależy od kategorii ani poziomu roli. Tekstowa legenda wyjaśnia różnicę, a inicjały pozostają fallbackiem dla firmy bez przypisanego logo.

Strona [icon-directions.html](icon-directions.html) zachowuje wcześniejsze alternatywy A i B do porównania; w wybranym wariancie C pokazuje już logotypy. [Uzasadnienie i prompt imagegen](qa/icon-directions/design-notes.md), [sprawdzenie wariantów](qa/icon-directions/verification.json), [zapis zatwierdzenia i logotypów](qa/employer-logos/verification.json).


## Pakiet dla agenta — Technologia po ludzku

Punkt wejścia: [agent-kit/design.md](agent-kit/design.md).
Kontrakt klas i modułów: [agent-kit/components.md](agent-kit/components.md).
Wspólny import stylów: [agent-kit/foundation.css](agent-kit/foundation.css).
Działająca galeria: `http://127.0.0.1:4173/ui-examples.html` po `npm run dev`.
Pełna dokumentacja designerów: [docs/design-system/v1/index.html](docs/design-system/v1/index.html).

`npm run check`, `npm test`, `npm run build` sprawdzają źródła i build.
`npm run export:agent` odtwarza przenośny katalog `dist-agent-kit/` ze źródłami,
assetami, przykładami, dokumentacją i testami. To snapshot dystrybucyjny;
źródłem zmian pozostają pliki w `listing/`. Galeria utrzymuje stan w pamięci
i nie modyfikuje szkiców ani zapisanych ofert użytkownika.
