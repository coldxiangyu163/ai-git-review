'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { getStagedDiff } = require('./git');
const { reviewCode, generateFix } = require('./llm');
const { formatReview } = require('./formatter');
const { previewFixes, applyFixes } = require('./fixer');
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
 * Prompt user for yes/no confirmation.
 * @param {string} question
 * @returns {Promise<boolean>}
 */
function confirm(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

/**
 * Build raw diff text from structured diff.
 * @param {{ files: object[] }} diff
 * @returns {string}
 */
function buildRawDiff(diff) {
  return diff.files
    .filter(f => !f.binary)
    .map(f => {
      const hunks = f.hunks.map(h => `${h.header}\n${h.lines.join('\n')}`).join('\n');
      return `--- ${f.path} (${f.status})\n${hunks}`;
    })
    .join('\n\n');
}

/**
 * Main entry point.
 * @param {{ fix?: boolean, dryRun?: boolean, yes?: boolean }} options
 */
async function main(options = {}) {
  const args = process.argv.slice(2);
  const fix = options.fix || false;
  const dryRun = options.dryRun || false;
  const autoYes = options.yes || false;

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
    ai-review --fix        Review + auto-fix issues
    ai-review --fix --dry-run  Preview fixes without applying
    ai-review --fix --yes  Auto-fix without confirmation prompt
    ai-review --init       Install pre-commit hook
    ai-review --config     Show current config
    ai-review --help       Show this help

  Options:
    --fix       Enable auto-fix mode: review → generate fixes → apply
    --dry-run   Preview fixes without applying (use with --fix)
    --yes       Skip confirmation prompt, apply fixes directly (use with --fix)
`);
    return;
  }

  const config = loadConfig();
  const diff = getStagedDiff();

  if (diff.files.length === 0) {
    console.log('\n  ℹ No staged changes to review. Stage files with `git add` first.\n');
    return;
  }

  const rawDiff = buildRawDiff(diff);

  console.log(`\n  Reviewing ${diff.files.length} file(s)...\n`);

  const review = await reviewCode(rawDiff, config);
  const output = formatReview(review);
  console.log(output);

  // Exit with error code if blocking issues found (non-fix mode)
  const hasErrors = review.issues.some(i => i.severity === 'error');

  if (!fix) {
    if (hasErrors) {
      process.exit(1);
    }
    return;
  }

  // ─── Fix mode ───
  if (review.issues.length === 0) {
    console.log('  ℹ No issues to fix.\n');
    return;
  }

  console.log('  🔧 Generating fixes...\n');
  const fixResult = await generateFix(rawDiff, review.issues, config);

  if (fixResult.fixes.length === 0) {
    console.log('  ℹ No auto-fixes could be generated.\n');
    return;
  }

  // Preview fixes
  const preview = previewFixes(fixResult.fixes);
  console.log(preview);

  if (dryRun) {
    // Dry-run: show what would be applied, then exit
    const result = applyFixes(fixResult.fixes, { dryRun: true });
    console.log(`\n  [dry-run] ${result.applied} fix(es) would be applied, ${result.skipped} skipped.\n`);
    return;
  }

  // Confirm before applying (unless --yes)
  let shouldApply = autoYes;
  if (!autoYes) {
    shouldApply = await confirm('  Apply these fixes? (y/N) ');
  }

  if (!shouldApply) {
    console.log('\n  ✖ Fixes not applied.\n');
    return;
  }

  // Apply fixes
  const result = applyFixes(fixResult.fixes);
  console.log(`\n  ✅ ${result.applied} fix(es) applied, ${result.skipped} skipped.`);
  if (result.backups.length > 0) {
    console.log(`  📦 Backups created: ${result.backups.length} file(s) (.bak)`);
  }
  console.log('');
}

module.exports = { main, installHook };
