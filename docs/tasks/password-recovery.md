# Password recovery

## Intent and acceptance

- A signed-out user can request recovery from the login screen and set a new password through a one-time link. The existing authenticated password change and administrator reset remain separate operations.
- Use opaque 30-minute tokens with digests in SQLite. A successful reset atomically consumes the links and revokes sessions. Other password changes also invalidate issued links. Throttle requests and give the same response for known and unknown accounts.
- Deliver through a private loopback-only test outbox on localhost. Support email through explicitly configured server settings. Build links from a trusted configured origin and avoid returning recovery links through the request API.
- Use existing HP02, HP03, HP06 and c08/c22 form anatomy. Verify the login and recovery screens at 1280, 390 and 320 pixels. Static S3 remains a simulation without a recovery route.
- Verify token expiry, replay rejection, session invalidation, migration and browser recovery. Run the project verification gate and review account and deployment boundaries.

## Local evidence

- Startup migrated the local v4 database to v5 after taking a private backup. The six account rows including their password hashes, six offers and one application matched that backup. Recovery is enabled in loopback mode on port 3001.
- Compared the sign-in and recovery screens with the HP03 reference at 1280, 390 and 320 pixels. The input height, radius and font matched the profile. Keyboard activation, validation focus, invalid field states, missing link recovery and long addresses were exercised. Screenshots are under `artifacts/password-recovery/`.
- A server-build browser test requested and redeemed a real loopback outbox link using a synthetic account. The hosted email request was verified with a stub. Live email delivery was not exercised.
- The final Node 24 run of `./scripts/verify` passed with 88 Vitest tests and 72 Playwright journeys. A separate `npm run build:s3` and `npm run test:static` run passed seven file-only journeys. The S3 client assets contained neither of the server recovery endpoints.
