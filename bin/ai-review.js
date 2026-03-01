#!/usr/bin/env node
'use strict';

const { main } = require('../src/index');

// Parse CLI flags
const args = process.argv.slice(2);
const options = {
  fix: args.includes('--fix'),
  dryRun: args.includes('--dry-run'),
  yes: args.includes('--yes') || args.includes('-y'),
};

main(options).catch((err) => {
  console.error(`\n  \x1b[31m✖ ai-review error:\x1b[0m ${err.message}\n`);
  process.exit(1);
});
