# Component contract — 1.1.0

Używaj razem z [design.md](design.md), [foundation.css](foundation.css) oraz [galerią](../ui-examples.html). To jawny kontrakt pakietu dla agenta; nazwy rodzin w szczegółowej dokumentacji były robocze. Poniżej podajemy faktyczne klasy, eksporty i wymagania kompozycji.

## Podłączenie

Nowa strona w katalogu `listing/`:

```html
<link rel="stylesheet" href="agent-kit/foundation.css">
<body class="tph-theme tph-agent-ui" data-icon-scheme="marker">
  <main class="shell">…</main>
  <div class="toast" id="toast" role="status"
       aria-live="polite" aria-atomic="true"></div>
</body>
```

Skrypty strony uruchamiaj jako `<script type="module" src="twoja-strona.mjs"></script>`. Poniższe ścieżki importów są względne wobec modułu znajdującego się w `listing/`. Skrypt w `agent-kit/` dodaje `../`.

```js
import { jobCardMarkup, emptyStateMarkup } from './listing-components.mjs';
import { offerMarkup, escapeHTML, salaryText, salaryBasis } from './job-view.mjs';
import { employerMark, areaSVG, areaLabels, schemeLegend } from './icon-schemes.mjs';
import { jobs } from './jobs.mjs';
import { emptyDraft, validateDraft, draftToJob } from './job-store.mjs';
```

Nie importuj `app.js`, `job.js` ani `create-job.js` na inną strukturę DOM. To kontrolery pełnych stron, odwołujące się do konkretnych ID. Moduły wymienione wyżej można wywoływać bez bootstrapa całej strony.

## Dane oferty

Renderery oczekują poprawnego, znormalizowanego rekordu. Nie są walidatorem dowolnego JSON-a z backendu.

| Pole | Typ / wartości | Zastosowanie |
| --- | --- | --- |
| `id` | Unikalny string; rekomendowane litery/cyfry/`-`/`_` | Klucz zapisu, link, powiązanie tytułu. Nie zmieniaj podczas rerenderu. |
| `title`, `company`, `initials` | String | Inicjały stanowią fallback logo; firma jest też widocznym tekstem. |
| `category` | `Build`, `Apply`, `Lead` | Obszar, symbol i tonalny marker. |
| `level` | `Junior`, `Mid`, `Senior`, `Lead` | Doświadczenie, osobne od obszaru. |
| `city`, `mode` | String; tryb `Hybrydowo`, `Zdalnie`, `Stacjonarnie` | Fakty; zdalne prezentuje Polska. |
| `contract` | `B2B` lub `UoP` | Podstawa netto/brutto. |
| `min`, `max` | Dodatnie liczby, max≥min, albo obie `null` | Zakres PLN/miesiąc lub uczciwy brak danych. |
| `tags` | Tablica stringów | Pierwszy tag w istniejących danych to zwykle doświadczenie. Renderer nie dopisuje go drugi raz. |
| `posted` | Poprawna data `YYYY-MM-DD` | Pełna data semantyczna, etykieta dzień/miesiąc po polsku, UTC. |
| `featured` | Boolean | Promocja, nie jakość ani weryfikacja. |
| `intro`, `tasks`, `requirements` | String, tablice stringów | Wymagane przez pełny szczegół `offerMarkup`. |
| `benefits`, `companyAbout`, `aiContext`, `applicationUrl`, `local` | Opcjonalne dane zgodne z istniejącym modelem | Dodatkowe sekcje, bezpieczny URL albo demo; lokalność rekordu. |

Za mapowanie z obcego API odpowiada adapter danych strony. Weryfikuj długości, enumy i daty przed renderowaniem. `draftToJob()` sprawdza istniejący szkic formularza; nie jest uniwersalnym walidatorem ofert z każdego źródła.

## Eksporty renderujące

### `jobCardMarkup(job, options?)`

Źródło: [listing-components.mjs](../listing-components.mjs). Zwraca string HTML jednej karty, bez efektów ubocznych. Struktura: `article.job-card` → `.card-top` → tożsamość + `.card-header` + przycisk zapisu; następnie `.card-facts` oraz `.card-bottom`.

| Opcja | Typ / domyślna | Efekt i ograniczenie |
| --- | --- | --- |
| `saved` | Boolean, `false` | `aria-pressed` i wizualny stan zakładki. Nie zapisuje do pamięci. |
| `href` | String, `job.html?id=ENCODED_ID` | Link tytułu; względny lub HTTP(S), bez loginu/hasła w URL. Niedozwolony schemat rzuca TypeError. |
| `headingId` | String, `title-${job.id}` | `aria-labelledby` karty i id jej h 3. Ustaw odrębny prefix, jeśli tę samą ofertę pokazujesz dwa razy na jednej stronie. |
| `iconScheme` | String, domyślnie `marker` | Nowe ekrany używają C=`marker`. Parametr zachowuje zgodność z historycznym porównaniem A/B; nie jest zaproszeniem do zmiany standardu. |

```js
const saved = new Set();
const list = document.querySelector('#job-list');
function render() {
  list.innerHTML = jobs.map(job => jobCardMarkup(job, {
    saved: saved.has(job.id),
    headingId: `results-${job.id}`
  })).join('');
}
```

Zdarzenia: tytuł jest prawdziwym linkiem z `data-job-id`; przycisk ma `data-save=job.id`. Nie umieszczaj całego `article` w linku. Nie dodawaj listenera otwierającego ofertę po kliknięciu zakładki. Stała nazwa dostępna zakładki + `aria-pressed` to decyzja I06.

Prosty wariant bez rerenderu pokazuje [examples.mjs](examples.mjs): aktualizuje wszystkie `[data-save]` i zachowuje focus. Przy pełnym rerenderze zapamiętaj klucz aktywnej kontrolki i przywróć focus, o ile rekord nadal istnieje. Logikę filtrowania i pamięci listingu znajdziesz w [app.js](../app.js).

### `emptyStateMarkup({ savedOnly=false, savedCount=0 }={})`

Zwraca obecną ramę `.empty-state`. Brak zapisanych wybiera się tylko dla `savedOnly===true && savedCount===0`. Pozostałe użycia opisują brak trafień. Nie wywołuj go zamiast listy, jeśli wyniki istnieją.

- Akcja przy pustych zapisanych: `[data-empty-action=browse]` — wyjdź z trybu zapisanych.
- Akcja przy braku wyników: `[data-empty-action=reset]` — wyczyść kryteria, zachowując uzgodniony tryb/sort.
- Kontroler strony obsługuje przycisk i focus. Sam HTML nie czyści danych.

### `offerMarkup(job, { preview=false }={})`

Istniejący eksport [job-view.mjs](../job-view.mjs). Zwraca pełny `article.offer-page`: hero, fakty, sekcje, AI context, umiejętności, firmę i panel aplikowania. Puste opcjonalne sekcje są pomijane. Pierwsza bazowa oferta ma w module dodatkową fikcyjną treść demonstracyjną; nie kopiuj jej automatycznie do realnych ofert.

- `preview:true`: prezentacyjne CTA, bez zakładki; opis podglądu. To profil dla formularza rekrutera.
- `preview:false`: bezpieczny URL aplikowania tworzy link HTTP(S); brak URL tworzy `[data-apply]` i zakładkę `[data-save-offer]`.
- Renderer tworzy własne h 1 i stałe ID sekcji. Używaj raz na stronie z głównym tytułem oferty. Nie osadzaj kilku szczegółów w jednej galerii bez jawnego dostosowania identyfikatorów i hierarchii.
- Wymaga kontrolera aplikowania/zapisu. Wzorzec: [job.html](../job.html) + [job.js](../job.js), albo [create-job.js](../create-job.js) dla podglądu.

### Tożsamość i obszar

Istniejące eksporty [icon-schemes.mjs](../icon-schemes.mjs):

| Eksport | Kontrakt |
| --- | --- |
| `employerMark(job,{useLogo=true}={})` | Neutralny kafel, logo 12 fikcyjnych firm albo `initials`, plus marker kategorii. Oznaczony aria-hidden, więc obok musi być widoczna nazwa firmy. Obrazy używają ścieżki `assets/employers/...` względem dokumentu. |
| `areaSVG(area)` | Dekoracyjny SVG znanego obszaru; nie zastępuje tekstowej nazwy. Nie przekazuj dowolnej treści SVG. |
| `areaLabels` | Mapa Build/Apply/Lead → polskie objaśnienia. |
| `schemeLegend('marker')` | HTML legendy logo/marker. Wymaga `.icon-legend`; brak interakcji. |
| `defaultIconScheme` | `marker`; ustaw również `data-icon-scheme="marker"` na rodzicu/stronie, aby mały marker był widoczny. |

## Klasy i wymagana struktura HTML

| Rodzina / karta dokumentacji | Klasy / struktura | Zachowanie i ograniczenia |
| --- | --- | --- |
| Nawigacja 01 | `.site-header > .header-inner.shell`; `.wordmark`, `.main-nav > .nav-link`, `.page-header-action`; `.site-footer.shell` | Dobierz linki do zadania; aktywny link `.active`. Nawigacja główna jest ukrywana na małych ekranach; zaplanuj dostęp do ważnych dróg także poza nią. |
| Powrót 02 | `.offer-breadcrumb > a + span`, `.offer-bottom-back` | Pojedynczy powrót z kontekstem, nie pełna hierarchia breadcrumbs. |
| Hero 03 | `.hero > .hero-copy + .hero-art`; `.eyebrow`, h 1, `.highlight`, `.hero-description`, `.hero-action`; img + `.art-caption` | Kolaż alpha z `assets/human-technology-hero-angular.png`, naturalne proporcje i istniejąca maska. Nie wkładaj tekstu zadania w bitmapę. |
| Akcje 04 | `.button.button-dark`, `.button-outline`, `.button-lime`; `.icon-button` | Button dla działania, a dla przejścia. Ikona dekoracyjna aria-hidden; ikonowy przycisk wymaga nazwy. |
| Firma/obszar 05–06 | `.employer-mark`, `.employer-icon`, `.area-marker.tone-area-*`; `.area-label.tone-area-*`; `.icon-legend` | Generuj istniejącymi helperami. Nazwa firmy i obszaru pozostaje tekstem. |
| Tagi 07 | `.tag-list > .tag`, opcjonalnie `.tag-featured` | Pasywne informacje. Adapter I04 umożliwia długi tekst; brak × i roli przycisku. |
| Pole 08 | `.field > label[for] + input/textarea + small + .field-error` (pomoc/błąd opcjonalne) | Powiąż opis/błąd przez aria-describedby; przy błędzie aria-invalid=true; nie używaj placeholdera jako jedynej etykiety. |
| Select 09 | `.field > label + select`; w filtrze `.facet > label + select` | Natywna semantyka; strzałka z CSS. Nie dodawaj kolejnej przyciskanej strzałki ani zbędnych ról ARIA. |
| Radio 10 | `fieldset.area-picker > legend + p + .area-options > label.area-option.tone-area-* > input[type=radio] + .area-option-symbol + strong + small` | Wspólne name, unikalne wartości Build/Apply/Lead, jedna checked. Cały label jest celem. |
| Checkbox 10 | `label.checkbox-field > input[type=checkbox] + span` | Niezależne warunki. Pamiętaj o skutkach zaznaczenia, np. disabled obu zakresów pensji. |
| Plik 11 | `.field > label + .file-field > input[type=file] + small`, błąd poza kontenerem | accept to instrukcja wyboru, nie pełna walidacja. Sprawdź format i rozmiar; pełna transmisja wymaga backendu. |
| Search 12 | `form.search-bar[role=search] > .search-keyword + .search-location + .search-submit` | Kontrolki mają label, także sr-only. Przycisk submit; wynik i kontekst po błędzie/pustej liście pozostają dostępne. |
| Filtry 13 | `.listing-layout > aside.sidebar + .results`; `.category-list > button.category-button`; `details.additional-filters > summary + .facet-fields` | Wybranie `.selected` i aria-pressed; natywne details/summary. Na mobile kolumna staje się rzędem nad wynikami. |
| Kryterium 14 | `.active-filters > button.active-filter` z etykietą i × aria-hidden | Nazwa dostępna „Usuń filtr: …”; usuń jeden warunek. Obsłuż focus po usunięciu. |
| Wyniki 15 | `.results-heading`, `.results-sort`, `.results-meta`, status licznika | Nie wyciągaj stałej liczby ofert z fikcyjnej bazy. Aktualizacja licznika bez przenoszenia focusu. |
| Karta 16 | `jobCardMarkup()` | Nie przepisuj osobnej karty w galerii i kolejnym ekranie. |
| Fakty 17 | `.offer-facts > div > dt + dd > small`; inline `.card-facts`, `.salary` | Semantyczne dl dla pełnych danych; pokaż netto/brutto, okres i walutę. |
| Treść 18 | `section.offer-section > .section-index + h2 + p/ul.offer-bullets`; `.ai-context`, `.offer-skills`, `.offer-company-about` | Powtarzalny rytm; ważny tekst jako HTML; AI panel nie jest chatem. |
| Proces firmy 19 | `.hiring-process > h2 + ol > li > span + strong` | Statyczna lista, bez aria-current i klikania etapów. |
| Panele 20 | `.offer-sidebar > .application-card`; `.composer-aside > .composer-summary` | Odrębne profile kandydata/rekrutera. Sticky desktop, reflow lub ukrycie pomocniczego panelu mobile. |
| Etapy 21 | `nav.composer-steps > ol > li > button > span + strong + small` | Bieżący `aria-current=step`, poprzednie `.completed`; walidacja strony przed przejściem dalej. Nie dopisuj tablist. |
| Feedback 22 | `.field-error`, `.form-error-summary[role=alert]`, `.draft-status[role=status]`, `.toast[role=status]` | Tekst błędu trwa przy polu; toast krótki, nie zastępuje końcowego potwierdzenia. |
| Dialog 23 | `dialog.application-dialog[aria-labelledby] > .dialog-topline + .application-dialog-body` | showModal()/close(), nazwa zamknięcia, Escape, powrót focusu, scroll wnętrza. Przykład w examples.mjs. |
| Puste/sukces 24 | `emptyStateMarkup()`, `.publish-success`, `.application-success`, `.success-symbol` | Inne powody i akcje; komunikuj lokalność demo. Finały bierz z istniejących pełnych stron. |
| Grupa/podgląd 25 | `.form-card > .form-section-heading + pola`; `.creator-layout`, `.composer-preview`, `.composer-actions` | Nie opakowuj każdego pola osobną kartą. `.showing-preview` zmienia układ i sticky dolnych akcji. |

## Semantyczny przykład pola

```html
<div class="field">
  <label for="role">Nazwa stanowiska <span aria-hidden="true">*</span></label>
  <input id="role" name="title" required minlength="4" maxlength="140"
         aria-describedby="role-hint role-error">
  <small id="role-hint">Nazwij faktyczną rolę.</small>
  <span class="field-error" id="role-error"></span>
</div>
```

Po błędzie ustaw `aria-invalid="true"`, wpisz tekst do `role-error` i skieruj focus na pierwsze błędne pole. Po poprawce wyczyść błąd. Reguły modelu pochodzą z `validateDraft(values, step)`; patrz kontrolery stron. Nie wpisuj do `innerHTML` komunikatu zawierającego surową treść użytkownika.

## Semantyczny przykład dialogu

```js
import { keepDialogFocus } from './agent-kit/dialog.mjs';
keepDialogFocus(dialog);
let opener;
openButton.addEventListener('click', event => {
  opener = event.currentTarget;
  dialog.showModal();
});
closeButton.addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
```

**`keepDialogFocus(dialog)`** z [dialog.mjs](dialog.mjs) domyka Tab od ostatniej do pierwszej kontrolki oraz Shift+Tab w drugą stronę. Zwraca funkcję odpinającą listener. Korzysta z natywnego dialogu, nie zastępuje showModal/close ani zarządzania focusem po zamknięciu. Złożone widgety z własnym zarządzaniem focusem nadal wymagają osobnego testu.

Natywny dialog nie znosi potrzeby testu Tab/Shift+Tab, Escape, czytnika, długiej treści i małej wysokości. Zamknięcie po kliknięciu backdropu jest dodatkową decyzją, nie jedyną drogą wyjścia.

## Assety i rozszerzenia

- [tokens.css](../assets/tokens.css): nazwy `--tph-*` zachowane. Nie podmieniaj tokenów po to, aby jeden ekran wyglądał inaczej bez kontroli innych zastosowań.
- [Ilustracja](../assets/human-technology-hero-angular.png): zaakceptowany kolaż z alfa i kanciastymi panelami. Powiązane CSS w `.hero-art`; nie zmieniaj go w JPEG z pełnym tłem.
- `assets/employers/*.svg`: 12 fikcyjnych logo; brak logo to inicjały. Upload logo nie jest wdrożoną funkcją.
- Rozszerzaj układ strony własnymi klasami prefiksowanymi nazwą funkcji. Nowy kolor obszaru, zmiana znaczenia markera, skala odstępów albo stan spoza dokumentacji wymagają jawnego opisu decyzji.
- `foundation.css` jest wspólnym entrypointem, `examples.css` tylko geometrią galerii. Nie kopiuj reguł `.job-card` ani `.field` do kolejnych arkuszy.
- Pakiet nie dostarcza gotowej biblioteki React/Vue. Przy migracji zachowaj semantykę, klasy i zachowania, a framework dopasuj do realnego projektu. Nie twórz nowego frameworka dla samego stylu.

## Przykłady i ich prawdziwe zachowania

| Przykład | Co działa | Ograniczenie |
| --- | --- | --- |
| Galeria ui-examples.html | Toggle zakładek, toast, modal i powrót focusu, błędy podstaw, ukrycie widełek, zmiana podstawy kwot, licznik, wybór pliku, stany etapów, wyjście z pustej listy | Stan wyłącznie w pamięci; galeryjne etapy to podgląd stanów, a nie pełny kreator; podstawowy formularz nie publikuje i nie waliduje opcjonalnego tekstu roli. |
| ui-long-content.html | Pełna kompozycja offerMarkup z długim tytułem, firmą, tagiem, inicjałami i null pensji | Fikcyjny rekord z fixtures.mjs; preview=true, bez aplikowania. |
| index.html | Search, filtry, sort, URL kryteriów, zapisane, dialog informacji, link do oferty | Baza fikcyjna + lokalne rekordy; zapisane lokalnie w originie. |
| job.html | Fakty, opis, aplikowanie demo lub link z danych, błędy i sukces demo | Demo nie wysyła plików/danych. The 1.1 offer toggle has a stable accessible name and aria-pressed, consistent with I06. |
| create-job.html | Walidacja, szkic,3 kroki, podgląd, publikacja lokalna | Brak backendu, płatności i publicznej dystrybucji oferty. |

Rzeczywiście wykonane próby i ograniczenia: [verification.json](verification-1.1.json). Dla pełnego audytu dostępności zastosuj plan F04 oraz testy z człowiekiem i technologiami asystującymi.

## Approved 1.1 host profiles

Approval: 2026-11-13. The existing 25 families remain. [host-profiles.json](host-profiles.json) defines geometry/type/meaning; [host-profiles.css](host-profiles.css) is an opt-in portable visual recipe under .tph-host-profiles. [ui-host-profiles.html](../ui-host-profiles.html) demonstrates static anatomy and state without a second interaction library.

| Profile | Families | Reuse and contract |
| --- | --- | --- |
| HP01 | c01 | Shell owns public and persona navigation. Public mobile uses a named Base UI modal with focus containment, Escape and trigger return. Workspace mobile is an inline menu with Escape return. |
| HP02 | c03 | PageTitle accepts children/action?/description?/eyebrow?; one H1, wrapping actions. ApplicationRecord uses a graphite snapshot header. DiscoveryHero is reused only for discovery contexts. |
| HP03 | c20/c25 | FormSection accepts index/title/eyebrow?/description?/children; unique section-heading ID. Field supplies explicit label/control IDs and a text-only accessible name. A grouped form does not become a stepper. |
| HP04 | c20/c25 | Existing RecordSheet uses Base UI Tabs. CvAttachment shows the correct immutable local PDF or complete custom text; only CV has file controls. Keep notes outside changing panels. |
| HP05 | c19 | ProcessTimeline takes ordered id/title/dateTime/content? records; actual events only, latest aria-current=step. Controllers project candidate-safe history before rendering. |
| HP06 | c22/c24 | Notice takes children/tone? (info/success/warning); Empty takes recovery content. Failures preserve input; the first invalid field is identified/described/focused; import/reset require confirmation. |

Use existing owners in the receiving React project instead of copying route-specific cards, fields, buttons or score renderers. Adapt these recipes into host tokens; source .tph-host-profiles is an opt-in reference scope, not a requirement to mount the vanilla foundation/reset in React. Base UI owns real modal, tab and select semantics.

### Host extensions and clarifications

- Scenario MatchScore stays noninteractive and visible: 0–39 red #FF6B79, 40–59 orange #FFB15C, 60–79 yellow #FFE45B, 80–100 green #00C853, all with ink #171B19. It remains a prepared scenario value, never a hiring probability. These tones do not redefine Build/Apply/Lead.
- SalaryFact keeps actual PLN/EUR, gross/net and month/year values and missing data. The original standalone job renderer still uses its own PLN/month fixture schema.
- OfflineMap keeps local markers and complete matching job links, without remote tiles, geocoding or location inference.
- Single-value facets use existing Base UI FormSelect with an explicit All value; More filters is native details/summary, including mobile. Search stays visible.
- Stable save names plus aria-pressed apply to cards and the standalone offer. Every candidate-visible host JobCard resolves the current persona's saved state.
- Cards 12px; fields/selects 7px; actions 8px; dialogs 14px/10px narrow. Select chevron is 16px at 14px inset with 42px right padding. Inputs are at least 46px; actions 48px; icons and comfort targets 44px. Do not confuse this design comfort target with the WCAG AA minimum/spacing exceptions.
- Preserve I01–I08 intent, while using Base UI focus behavior in React rather than layering the vanilla focus helper over it.
