#!/usr/bin/env node
'use strict';

const { main } = require('../src/index');

main().catch((err) => {
  console.error('ai-review error:', err.message);
  process.exit(1);
});
