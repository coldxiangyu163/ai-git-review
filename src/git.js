'use strict';

const { execSync } = require('child_process');

/**
 * Get list of staged files with their status.
 * @returns {{ path: string, status: string }[]}
 */
function getStagedFiles() {
  const raw = execSync('git diff --cached --name-status', { encoding: 'utf-8' }).trim();
  if (!raw) return [];
  return raw.split('\n').map(line => {
    const [status, ...parts] = line.split('\t');
    return { status: status.trim(), path: parts.join('\t').trim() };
  });
}

/**
 * Parse unified diff string into structured objects.
 * @param {string} rawDiff
 * @returns {{ path: string, hunks: { header: string, lines: string[] }[] }[]}
 */
function parseDiff(rawDiff) {
  if (!rawDiff || !rawDiff.trim()) return [];

  const files = [];
  const fileParts = rawDiff.split(/^diff --git /m).filter(Boolean);

  for (const part of fileParts) {
    const lines = part.split('\n');
    // Extract file path from "a/path b/path"
    const headerMatch = lines[0].match(/a\/(.+?) b\/(.+)/);
    const path = headerMatch ? headerMatch[2] : 'unknown';

    // Skip binary files
    if (part.includes('Binary files')) {
      files.push({ path, binary: true, hunks: [] });
      continue;
    }

    const hunks = [];
    let currentHunk = null;

    for (const line of lines) {
      if (line.startsWith('@@')) {
        if (currentHunk) hunks.push(currentHunk);
        currentHunk = { header: line, lines: [] };
      } else if (currentHunk && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
        currentHunk.lines.push(line);
      }
    }
    if (currentHunk) hunks.push(currentHunk);

    files.push({ path, binary: false, hunks });
  }

  return files;
}

/**
 * Get staged diff as structured data.
 * @returns {{ files: { path: string, status: string, hunks: object[] }[] }}
 */
function getStagedDiff() {
  const stagedFiles = getStagedFiles();
  if (stagedFiles.length === 0) return { files: [] };

  const rawDiff = execSync('git diff --cached', { encoding: 'utf-8' });
  const parsed = parseDiff(rawDiff);

  // Merge status info
  const files = parsed.map(f => {
    const match = stagedFiles.find(sf => sf.path === f.path);
    return { ...f, status: match ? match.status : 'M' };
  });

  return { files };
}

module.exports = { getStagedFiles, getStagedDiff, parseDiff };
