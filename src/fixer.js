'use strict';

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

/**
 * Preview fixes with colorized terminal diff output.
 * @param {object[]} fixes - Array of { file, original, fixed, explanation }
 * @returns {string}
 */
function previewFixes(fixes) {
  if (!fixes || fixes.length === 0) {
    return `\n${colors.green}${colors.bold}  ✅ No fixes to apply.${colors.reset}\n`;
  }

  const lines = [`\n${colors.bold}  Proposed Fixes (${fixes.length})${colors.reset}\n`];

  for (let i = 0; i < fixes.length; i++) {
    const fix = fixes[i];
    lines.push(`  ${colors.bold}${colors.blue}Fix ${i + 1}: ${fix.file}${colors.reset}`);
    if (fix.explanation) {
      lines.push(`  ${colors.gray}${fix.explanation}${colors.reset}`);
    }
    lines.push('');

    // Show original (red) and fixed (green)
    const origLines = (fix.original || '').split('\n');
    const fixedLines = (fix.fixed || '').split('\n');

    for (const line of origLines) {
      lines.push(`  ${colors.red}- ${line}${colors.reset}`);
    }
    for (const line of fixedLines) {
      lines.push(`  ${colors.green}+ ${line}${colors.reset}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Create a backup of a file before modifying it.
 * @param {string} filePath
 * @returns {string} backup path
 */
function backupFile(filePath) {
  const absPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath)) return null;

  const backupPath = absPath + '.bak';
  fs.copyFileSync(absPath, backupPath);
  return backupPath;
}

/**
 * Apply fixes to files. Creates backups before modifying.
 * @param {object[]} fixes - Array of { file, original, fixed, explanation }
 * @param {{ dryRun?: boolean }} options
 * @returns {{ applied: number, skipped: number, backups: string[] }}
 */
function applyFixes(fixes, options = {}) {
  const { dryRun = false } = options;
  let applied = 0;
  let skipped = 0;
  const backups = [];

  if (!fixes || fixes.length === 0) {
    return { applied, skipped, backups };
  }

  for (const fix of fixes) {
    const filePath = path.resolve(process.cwd(), fix.file);

    if (!fs.existsSync(filePath)) {
      console.error(`  ${colors.yellow}⚠ File not found: ${fix.file}, skipping${colors.reset}`);
      skipped++;
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    if (!content.includes(fix.original)) {
      console.error(`  ${colors.yellow}⚠ Original code not found in ${fix.file}, skipping${colors.reset}`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(`  ${colors.blue}ℹ [dry-run] Would fix: ${fix.file}${colors.reset}`);
      applied++;
      continue;
    }

    // Backup before modifying
    const backupPath = backupFile(fix.file);
    if (backupPath) {
      backups.push(backupPath);
    }

    // Apply the fix
    const newContent = content.replace(fix.original, fix.fixed);
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`  ${colors.green}✔ Fixed: ${fix.file}${colors.reset}`);
    applied++;
  }

  return { applied, skipped, backups };
}

module.exports = { previewFixes, applyFixes, backupFile };
