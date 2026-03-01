'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULTS = {
  model: 'gemini',
  rules: [],
  language: 'zh',
  maxFileSize: 10000,
};

/**
 * Load config from .ai-review.json or return defaults.
 * @returns {object}
 */
function loadConfig() {
  const configPath = path.resolve(process.cwd(), '.ai-review.json');
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      return { ...DEFAULTS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore parse errors, use defaults
  }
  return { ...DEFAULTS };
}

module.exports = { loadConfig, DEFAULTS };
