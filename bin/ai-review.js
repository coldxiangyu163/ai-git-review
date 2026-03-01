#!/usr/bin/env node
'use strict';

const { main } = require('../src/index');

main().catch((err) => {
  console.error(`\n  \x1b[31m✖ ai-review error:\x1b[0m ${err.message}\n`);
  process.exit(1);
});
