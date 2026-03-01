'use strict';

const fs = require('fs');
const path = require('path');
const { getStagedDiff } = require('./git');
const { reviewCode } = require('./llm');
const { formatReview } = require('./formatter');
const { loadConfig } = require('./config');

/**
 * Install pre-commit git hook.
 */
function installHook() {
  const hooksDir = path.resolve(process.cwd(), '.git', 'hooks');
  if (!fs.existsSync(hooksDir)) {
    console.error('  ✖ Not a git repository (no .git/hooks found)');
    process.exit(1);
  }

  const hookPath = path.join(hooksDir, 'pre-commit');
  const hookContent = `#!/bin/sh
# AI Git Review — auto code review on commit
npx ai-git-review
`;

  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  console.log('  ✅ Pre-commit hook installed at .git/hooks/pre-commit');
  console.log('  Every commit will now be reviewed by AI.');
}

/**
 * Show current config.
 */
function showConfig() {
  const config = loadConfig();
  console.log('\n  Current config:\n');
  console.log(JSON.stringify(config, null, 2));
}

/**
 * Main entry point.
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--init') || args.includes('install')) {
    return installHook();
  }

  if (args.includes('--config')) {
    return showConfig();
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
  ai-git-review — Free AI code review on commit

  Usage:
    ai-review              Review staged changes
    ai-review --init       Install pre-commit hook
    ai-review --config     Show current config
    ai-review --help       Show this help
`);
    return;
  }

  const config = loadConfig();
  const diff = getStagedDiff();

  if (diff.files.length === 0) {
    console.log('\n  ℹ No staged changes to review. Stage files with `git add` first.\n');
    return;
  }

  // Build raw diff text for LLM
  const rawDiff = diff.files
    .filter(f => !f.binary)
    .map(f => {
      const hunks = f.hunks.map(h => `${h.header}\n${h.lines.join('\n')}`).join('\n');
      return `--- ${f.path} (${f.status})\n${hunks}`;
    })
    .join('\n\n');

  console.log(`\n  Reviewing ${diff.files.length} file(s)...\n`);

  const review = await reviewCode(rawDiff, config);
  const output = formatReview(review);
  console.log(output);

  // Exit with error code if blocking issues found
  const hasErrors = review.issues.some(i => i.severity === 'error');
  if (hasErrors) {
    process.exit(1);
  }
}

module.exports = { main, installHook };
