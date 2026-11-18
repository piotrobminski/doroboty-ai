# Recruitment archiving after 90 days

## Intent and acceptance

- An employer explicitly closes recruitment for their published offer. Closure requires every submitted application to have a final outcome. An offer with no submissions may be closed. Closure removes the offer from public results, stops applications and records the server timestamp.
- Archive eligible offers when 90 full days have elapsed after closure. The server checks at startup, periodically while running and when reading the scenario. The static demo applies the same rule on the next browser interaction. An individual final application outcome or an old publication expiry does not close a recruitment.
- Linked applications follow the offer into the archive together. Preserve their outcomes, CVs, answers and event history. Employers see only their company records and candidates see only their own submissions. Archived records are read-only.
- Use an additive SQLite migration and an optional field in scenario JSON. Keep existing records without closure dates and retain version-1 scenario compatibility.
- Reuse HP02 PageTitle, HP04 RecordSheet, HP05 history, HP06 feedback and the existing confirmation dialog (c23). Verify the close/confirm flow, archive navigation and responsive views at 1280, 390 and 320 pixels. Execute migration, 90-day boundary, access and regression checks.

## Implementation and review

SQLite version 4 adds a nullable recruitment closure timestamp. Closing records the timestamp and hides the offer in one write. The archive sweep updates only the offer's status after 90 full days. Linked applications appear together in archive views by looking up that status. Submitted snapshots and history keep their original records and identifiers. The workflow rejects closure with unfinished submissions, additional submissions to a closed offer, edits to archive records and cross-company actions. Old records without an explicit closure date keep their previous status.

The server checks deadlines at startup, on scenario reads and every minute while running. Its timer stops with the database. The static demo uses the same deadline in its local scenario. Switching between current and archived lists refreshes the scenario. Both record views reuse the existing answer/CV and event components. The archived employer offer uses the same description rendering as the public offer and puts the link to its applications next to the page title.

Local verification used a disposable SQLite store to check version-3 migration, the 1 ms boundary before the deadline, startup catch-up at the deadline, multiple linked application snapshots, read-only operations and role filtering. The existing local database upgraded to version 4. Comparing hashes against its private v3 backup confirmed all six previous offers and the one previous application and its history were preserved. Closure dates were not inferred. The local API returned HTTP 200.

Full `./scripts/verify` passed with 86 unit/integration tests and 71 Chromium journeys. All seven browser-only demo checks passed. The initial sandbox run could not use localhost and the first targeted rerun used an incomplete browser path. The successful runs used the existing Chromium executable and local-server access. The first archive test required an explicit reload after switching API test sessions. No browser or system package installation was needed.

The source HP04 and host archived-record header matched background, violet edge, radius and font at 1280, 390 and 320 pixels. The comparison and archive screenshots are under ignored artifacts/recruitment-archiving. Browser checks exercised missing salary, long offer titles, keyboard confirmation and Escape, archived CV and history access, and candidate note isolation. Reviewed transaction boundaries, date calculation, catch-up, archive membership, authorization and the optional export field separately.

After the final reading-view refinements, both builds passed. The dedicated archive journey passed again on the final server build and verified the rendered description heading at all three captured layouts. The seven static browser journeys also passed on the final static build.
