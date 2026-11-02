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

CHANGES
helpers/auth.js contains validation, registration, and login helpers.
app.js exports createApp and initializeDatabase for isolated testing;
starting it directly still runs the web application on port 3000.
The original page templates and styles are preserved.

TESTS
Uses Node's built-in test runner; no added test dependencies.
12 tests cover missing/blank/non-string inputs, username trimming,
password whitespace, account creation, successful login, duplicates,
unknown users, wrong passwords, SQL-like inputs, database errors,
form pages, redirects, session cookies, and protected page access.
Tests use an in-memory database and a temporary local server, never users.db.

GITHUB REPOSITORY SETUP
Copy this folder's CONTENTS into the root of your intended GitHub repository,
including the hidden .github folder, .gitignore, and .nvmrc.
Commit and push the files. The workflow must be at:
  <repository root>/.github/workflows/node-ci.yml
The workflow assumes package.json is at the repository root.
If keeping this project in a subfolder, adjust the workflow working directory
and cache-dependency-path to that subfolder before pushing.
Open the repository's Actions tab to confirm the workflow succeeds.
No repository URL was supplied, so no remote push or GitHub run was performed.

CI
Runs on pushes, pull requests, and manual dispatch. Installs exact Node and npm
versions, checks them against package.json, installs the lockfile with npm ci,
and runs npm test. If your own development environment uses other versions,
update package.json engines, packageManager, package-lock.json root engines,
.nvmrc, and the workflow together and verify again.
GitHub setup-node reference: https://github.com/actions/setup-node

SUBMISSION
The ZIP includes application source, tests, lockfile, and .github workflow.
It excludes node_modules, saved accounts/users.db, and Git history.

LAB LIMITATION
This refactor retains the original lab's plain-text password storage and local
session configuration. It is an instructional application, not a production
authentication system.
