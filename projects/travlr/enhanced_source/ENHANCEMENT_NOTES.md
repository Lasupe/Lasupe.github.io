# CS-499 Enhancement One — Travlr Getaways

This copy preserves the original application structure and improves its Express/Mongoose API.

## Implemented changes
- Require a configured JWT_SECRET of at least 32 characters; verify HS256 tokens with an explicit subject.
- Registration always creates a non-admin user. A database operator must promote an existing account using `node scripts/promote-admin.js user@example.com`. Existing accounts default to `user` until explicitly promoted.
- Require authenticated admin claims for POST/PUT/DELETE trip routes. A token is signed at login, so role changes take effect after the user signs in again; revoke existing tokens separately if needed.
- Validate trip fields and ObjectIds; reject unexpected fields and malformed input; run schema validators on update.
- Return controlled API errors instead of raw database exceptions.
- Support environment-based MongoDB URI, CORS origin, and port; add `.env.example` and `.gitignore`.
- Add built-in Node.js unit tests for security and validation.

## Run locally
1. `npm install` (and `cd travlr-admin && npm install` for Angular).
2. Configure JWT_SECRET and optionally MONGODB_URI/CORS_ORIGIN/PORT in the shell; `.env.example` is a template, not auto-loaded.
3. Start MongoDB; run `npm start` from the project root.
4. Register a user; promote the user locally with `node scripts/promote-admin.js email@example.com`; log in again to receive an admin token.
5. Run `npm test` for unit tests. Integration testing requires a running MongoDB instance.

## Limitations / future work
- Existing tokens remain valid until expiry (one hour), including after a role change. A production system should check the current database role or implement token revocation.
- Angular stores JWTs in localStorage as in the original artifact; production hardening should evaluate HttpOnly cookies, CSRF protection, and HTTPS.
- No live database integration test was included; validate complete login/CRUD behavior with a local MongoDB before deployment.
- Never upload real `.env` values or previous Git history that contains secrets.
