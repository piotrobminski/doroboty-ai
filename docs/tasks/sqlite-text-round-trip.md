# Preserve relational text on Node.js 24

## Intent and acceptance criteria

Unblock the requested merge by restoring the existing lossless migration and import contract on Node.js 24.14.0. SQLite stores embedded null characters in text, but this Node.js SQLite driver truncates ordinary text results at the first null character.

- Preserve complete text through migration, import and ordinary reads without rewriting the database schema or loosening round-trip validation.
- Preserve numeric values, ordering and optional fields. Keep the existing transactional rollback and backup checks.
- Run the full verification gate on Node.js 24 and record the actual result.

## Implementation and verification

Scenario reads use the full stored UTF-8 bytes when a text value contains a null character. Other values retain their SQLite result types. The change leaves the schema, existing records, and round-trip and foreign-key checks intact.

On Node.js 24.14.0, all 12 focused migration tests passed. The full `./scripts/verify` also passed with 89 unit and integration tests, 72 browser journeys and 10 standalone reference tests. The S3 build and its seven browser journeys passed separately, and the production archive built successfully. Browser tests used the existing Chromium executable. The pre-merge review checked the selected columns, stable ordering, numeric types, backup and rollback behavior, the analytics payload and the excluded local credentials.
