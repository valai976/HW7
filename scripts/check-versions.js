const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { engines } = require('../package.json');
assert.ok(process.env.npm_execpath, 'Run this check with npm run check:versions');
const npm = execFileSync(process.execPath, [process.env.npm_execpath, '--version'], {encoding:'utf8'}).trim();
assert.equal(process.versions.node, engines.node, 'Node version must match package.json exactly');
assert.equal(npm, engines.npm, 'npm version must match package.json exactly');
console.log('Verified Node ' + process.versions.node + ' and npm ' + npm);
