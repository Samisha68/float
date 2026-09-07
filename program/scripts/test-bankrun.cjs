// Load TypeScript through CommonJS explicitly so newer Node versions do not
// route Mocha's dynamic imports through native TypeScript/JSON loading.
require('ts-node').register({ transpileOnly: true });
const Mocha = require('mocha');
const path = require('node:path');
const suite = new Mocha({ timeout: 100000 });
for (const file of (process.argv.slice(2).length ? process.argv.slice(2) : ['overdue.ts', 'audit.ts'])) {
  const filename = path.resolve(__dirname, '../tests', file);
  suite.suite.emit('pre-require', global, filename, suite);
  require(filename);
}
suite.run(failures => { process.exitCode = failures ? 1 : 0; });
