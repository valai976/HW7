LOGIN LAB - CI AND AUTOMATED TESTING

Requirements: Node.js 24.22.1 and npm 11.19.1 (exact versions).
These match the development environment used to verify this submission.

Run from the project folder:
  npm run check:versions
  npm ci
  npm test
  npm start
Then visit http://localhost:3000.
The application creates users.db automatically on first start.

TESTS
Uses Node's built-in test runner; no added test dependencies.
12 tests cover missing/blank/non-string inputs, username trimming,
password whitespace, account creation, successful login, duplicates,
unknown users, wrong passwords, SQL-like inputs, database errors,
form pages, redirects, session cookies, and protected page access.
Tests use an in-memory database and a temporary local server, never users.db.


CI
Runs on pushes, pull requests, and manual dispatch. Installs exact Node and npm
versions, checks them against package.json, installs the lockfile with npm ci,
and runs npm test. If your own development environment uses other versions,
update package.json engines, packageManager, package-lock.json root engines,
.nvmrc, and the workflow together and verify again.
GitHub setup-node reference: https://github.com/actions/setup-node

