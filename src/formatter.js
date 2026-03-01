'use strict';

// ANSI color codes
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

const severityColors = {
  error: colors.red,
  warning: colors.yellow,
  info: colors.blue,
};

const severityIcons = {
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
};

/**
 * Format review issues for terminal output.
 * @param {{ issues: object[] }} review
 * @returns {string}
 */
function formatReview(review) {
  const { issues } = review;

  if (!issues || issues.length === 0) {
    return `\n${colors.green}${colors.bold}  ✅ No issues found. Code looks good!${colors.reset}\n`;
  }

  const lines = [`\n${colors.bold}  Code Review Results (${issues.length} issue${issues.length > 1 ? 's' : ''})${colors.reset}\n`];

  // Group by file
  const byFile = {};
  for (const issue of issues) {
    const f = issue.file || 'unknown';
    if (!byFile[f]) byFile[f] = [];
    byFile[f].push(issue);
  }

  for (const [file, fileIssues] of Object.entries(byFile)) {
    lines.push(`  ${colors.bold}${file}${colors.reset}`);
    for (const issue of fileIssues) {
      const color = severityColors[issue.severity] || colors.gray;
      const icon = severityIcons[issue.severity] || '•';
      const line = issue.line ? `${colors.gray}:${issue.line}${colors.reset}` : '';
      lines.push(`    ${color}${icon} ${issue.severity}${colors.reset}${line}  ${issue.message}`);
      if (issue.suggestion) {
        lines.push(`      ${colors.gray}→ ${issue.suggestion}${colors.reset}`);
      }
    }
    lines.push('');
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warnCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  const summary = [];
  if (errorCount) summary.push(`${colors.red}${errorCount} error${errorCount > 1 ? 's' : ''}${colors.reset}`);
  if (warnCount) summary.push(`${colors.yellow}${warnCount} warning${warnCount > 1 ? 's' : ''}${colors.reset}`);
  if (infoCount) summary.push(`${colors.blue}${infoCount} info${colors.reset}`);

  lines.push(`  ${summary.join('  ')}`);

  if (errorCount > 0) {
    lines.push(`\n  ${colors.red}${colors.bold}✖ Commit blocked — fix errors first${colors.reset}\n`);
  } else {
    lines.push(`\n  ${colors.green}${colors.bold}✔ Review complete — no blocking issues${colors.reset}\n`);
  }

  return lines.join('\n');
}

module.exports = { formatReview };
