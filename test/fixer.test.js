'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { previewFixes, applyFixes, backupFile } = require('../src/fixer');

// Helper: create a temp directory for test files
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ai-review-fixer-test-'));
}

// ─── previewFixes tests ───

// Test 1: previewFixes with empty array
console.log('Test 1: previewFixes empty array...');
const emptyPreview = previewFixes([]);
assert(emptyPreview.includes('No fixes to apply'));
console.log('  ✅ passed');

// Test 2: previewFixes with null
console.log('Test 2: previewFixes null...');
const nullPreview = previewFixes(null);
assert(nullPreview.includes('No fixes to apply'));
console.log('  ✅ passed');

// Test 3: previewFixes with fixes
console.log('Test 3: previewFixes with fixes...');
const fixes = [
  {
    file: 'src/app.js',
    original: 'var x = 1;',
    fixed: 'const x = 1;',
    explanation: 'Use const instead of var',
  },
  {
    file: 'src/utils.js',
    original: 'console.log(err)',
    fixed: 'console.error(err)',
    explanation: 'Use console.error for errors',
  },
];
const preview = previewFixes(fixes);
assert(preview.includes('Proposed Fixes (2)'));
assert(preview.includes('src/app.js'));
assert(preview.includes('src/utils.js'));
assert(preview.includes('var x = 1;'));
assert(preview.includes('const x = 1;'));
assert(preview.includes('Use const instead of var'));
console.log('  ✅ passed');

// Test 4: previewFixes shows original and fixed lines
console.log('Test 4: previewFixes diff format...');
assert(preview.includes('- var x = 1;'));
assert(preview.includes('+ const x = 1;'));
console.log('  ✅ passed');

// ─── applyFixes tests ───

// Test 5: applyFixes with empty array
console.log('Test 5: applyFixes empty array...');
const emptyResult = applyFixes([]);
assert.strictEqual(emptyResult.applied, 0);
assert.strictEqual(emptyResult.skipped, 0);
assert.deepStrictEqual(emptyResult.backups, []);
console.log('  ✅ passed');

// Test 6: applyFixes with null
console.log('Test 6: applyFixes null...');
const nullResult = applyFixes(null);
assert.strictEqual(nullResult.applied, 0);
assert.strictEqual(nullResult.skipped, 0);
console.log('  ✅ passed');

// Test 7: applyFixes applies fix to real file
console.log('Test 7: applyFixes applies fix...');
const tmpDir7 = createTempDir();
const testFile7 = path.join(tmpDir7, 'test.js');
fs.writeFileSync(testFile7, 'var x = 1;\nvar y = 2;\n');

const origCwd = process.cwd();
process.chdir(tmpDir7);

const result7 = applyFixes([{
  file: 'test.js',
  original: 'var x = 1;',
  fixed: 'const x = 1;',
  explanation: 'Use const',
}]);
assert.strictEqual(result7.applied, 1);
assert.strictEqual(result7.skipped, 0);
assert.strictEqual(result7.backups.length, 1);

const content7 = fs.readFileSync(testFile7, 'utf-8');
assert(content7.includes('const x = 1;'));
assert(content7.includes('var y = 2;'));  // untouched line
console.log('  ✅ passed');

// Test 8: applyFixes creates backup
console.log('Test 8: applyFixes creates backup...');
assert(fs.existsSync(testFile7 + '.bak'));
const backup7 = fs.readFileSync(testFile7 + '.bak', 'utf-8');
assert(backup7.includes('var x = 1;'));  // original content
console.log('  ✅ passed');

process.chdir(origCwd);

// Test 9: applyFixes skips missing file
console.log('Test 9: applyFixes skips missing file...');
const tmpDir9 = createTempDir();
process.chdir(tmpDir9);

const result9 = applyFixes([{
  file: 'nonexistent.js',
  original: 'foo',
  fixed: 'bar',
  explanation: 'test',
}]);
assert.strictEqual(result9.applied, 0);
assert.strictEqual(result9.skipped, 1);

process.chdir(origCwd);
console.log('  ✅ passed');

// Test 10: applyFixes skips when original not found
console.log('Test 10: applyFixes skips when original not found...');
const tmpDir10 = createTempDir();
const testFile10 = path.join(tmpDir10, 'test.js');
fs.writeFileSync(testFile10, 'const a = 1;\n');
process.chdir(tmpDir10);

const result10 = applyFixes([{
  file: 'test.js',
  original: 'this text does not exist in file',
  fixed: 'replacement',
  explanation: 'test',
}]);
assert.strictEqual(result10.applied, 0);
assert.strictEqual(result10.skipped, 1);

process.chdir(origCwd);
console.log('  ✅ passed');

// Test 11: applyFixes dry-run mode
console.log('Test 11: applyFixes dry-run...');
const tmpDir11 = createTempDir();
const testFile11 = path.join(tmpDir11, 'test.js');
fs.writeFileSync(testFile11, 'var z = 3;\n');
process.chdir(tmpDir11);

const result11 = applyFixes([{
  file: 'test.js',
  original: 'var z = 3;',
  fixed: 'const z = 3;',
  explanation: 'test',
}], { dryRun: true });
assert.strictEqual(result11.applied, 1);
assert.strictEqual(result11.skipped, 0);
assert.deepStrictEqual(result11.backups, []);

// File should NOT be modified in dry-run
const content11 = fs.readFileSync(testFile11, 'utf-8');
assert(content11.includes('var z = 3;'));
assert(!content11.includes('const z = 3;'));

process.chdir(origCwd);
console.log('  ✅ passed');

// Test 12: applyFixes multiple fixes
console.log('Test 12: applyFixes multiple fixes...');
const tmpDir12 = createTempDir();
const testFileA = path.join(tmpDir12, 'a.js');
const testFileB = path.join(tmpDir12, 'b.js');
fs.writeFileSync(testFileA, 'var a = 1;\n');
fs.writeFileSync(testFileB, 'var b = 2;\n');
process.chdir(tmpDir12);

const result12 = applyFixes([
  { file: 'a.js', original: 'var a = 1;', fixed: 'const a = 1;', explanation: 'fix a' },
  { file: 'b.js', original: 'var b = 2;', fixed: 'const b = 2;', explanation: 'fix b' },
]);
assert.strictEqual(result12.applied, 2);
assert.strictEqual(result12.skipped, 0);
assert.strictEqual(result12.backups.length, 2);
assert(fs.readFileSync(testFileA, 'utf-8').includes('const a = 1;'));
assert(fs.readFileSync(testFileB, 'utf-8').includes('const b = 2;'));

process.chdir(origCwd);
console.log('  ✅ passed');

// ─── backupFile tests ───

// Test 13: backupFile creates .bak file
console.log('Test 13: backupFile creates .bak...');
const tmpDir13 = createTempDir();
const testFile13 = path.join(tmpDir13, 'backup-test.js');
fs.writeFileSync(testFile13, 'original content\n');
process.chdir(tmpDir13);

const bakPath = backupFile('backup-test.js');
assert(bakPath.endsWith('.bak'));
assert(fs.existsSync(bakPath));
assert.strictEqual(fs.readFileSync(bakPath, 'utf-8'), 'original content\n');

process.chdir(origCwd);
console.log('  ✅ passed');

// Test 14: backupFile returns null for nonexistent file
console.log('Test 14: backupFile nonexistent...');
const tmpDir14 = createTempDir();
process.chdir(tmpDir14);
const bakResult = backupFile('does-not-exist.js');
assert.strictEqual(bakResult, null);

process.chdir(origCwd);
console.log('  ✅ passed');

// ─── llm.js fix-related tests ───

const { buildFixPrompt, parseFixResponse, generateFix } = require('../src/llm');

// Test 15: buildFixPrompt basic
console.log('Test 15: buildFixPrompt basic...');
const fixPrompt = buildFixPrompt('+ var x = 1;', [
  { file: 'a.js', line: 1, severity: 'warning', message: 'use const', suggestion: 'replace var with const' },
]);
assert(fixPrompt.includes('expert code fixer'));
assert(fixPrompt.includes('var x = 1'));
assert(fixPrompt.includes('use const'));
assert(fixPrompt.includes('JSON array'));
console.log('  ✅ passed');

// Test 16: buildFixPrompt with multiple issues
console.log('Test 16: buildFixPrompt multiple issues...');
const fixPrompt2 = buildFixPrompt('+ code', [
  { file: 'a.js', line: 1, severity: 'error', message: 'bug' },
  { file: 'b.js', line: 5, severity: 'warning', message: 'style' },
]);
assert(fixPrompt2.includes('1.'));
assert(fixPrompt2.includes('2.'));
assert(fixPrompt2.includes('bug'));
assert(fixPrompt2.includes('style'));
console.log('  ✅ passed');

// Test 17: parseFixResponse valid JSON
console.log('Test 17: parseFixResponse valid JSON...');
const validFixResp = JSON.stringify([
  { file: 'a.js', original: 'var x', fixed: 'const x', explanation: 'use const' },
]);
const parsedFixes = parseFixResponse(validFixResp);
assert.strictEqual(parsedFixes.length, 1);
assert.strictEqual(parsedFixes[0].file, 'a.js');
assert.strictEqual(parsedFixes[0].original, 'var x');
assert.strictEqual(parsedFixes[0].fixed, 'const x');
console.log('  ✅ passed');

// Test 18: parseFixResponse with markdown code block
console.log('Test 18: parseFixResponse markdown block...');
const mdFixResp = '```json\n[{"file":"b.js","original":"old","fixed":"new","explanation":"fix"}]\n```';
const mdFixes = parseFixResponse(mdFixResp);
assert.strictEqual(mdFixes.length, 1);
assert.strictEqual(mdFixes[0].file, 'b.js');
console.log('  ✅ passed');

// Test 19: parseFixResponse empty array
console.log('Test 19: parseFixResponse empty...');
assert.deepStrictEqual(parseFixResponse('[]'), []);
console.log('  ✅ passed');

// Test 20: parseFixResponse invalid JSON
console.log('Test 20: parseFixResponse invalid JSON...');
assert.deepStrictEqual(parseFixResponse('not json'), []);
console.log('  ✅ passed');

// Test 21: parseFixResponse filters incomplete fixes
console.log('Test 21: parseFixResponse filters incomplete...');
const mixedFixes = JSON.stringify([
  { file: 'a.js', original: 'old', fixed: 'new', explanation: 'ok' },
  { original: 'old', fixed: 'new' },  // missing file
  { file: 'b.js', fixed: 'new' },     // missing original
]);
const filteredFixes = parseFixResponse(mixedFixes);
assert.strictEqual(filteredFixes.length, 1);
assert.strictEqual(filteredFixes[0].file, 'a.js');
console.log('  ✅ passed');

// Test 22: generateFix returns empty for no issues (async)
console.log('Test 22: generateFix empty issues...');
(async () => {
  const result = await generateFix('+ code', [], {});
  assert.deepStrictEqual(result.fixes, []);
  assert.strictEqual(result.model, 'none');
  console.log('  ✅ passed');

  // Test 23: generateFix returns empty for null issues
  console.log('Test 23: generateFix null issues...');
  const result2 = await generateFix('+ code', null, {});
  assert.deepStrictEqual(result2.fixes, []);
  assert.strictEqual(result2.model, 'none');
  console.log('  ✅ passed');

  // Test 24: generateFix throws without API key
  console.log('Test 24: generateFix no API key...');
  const origGemini = process.env.GEMINI_API_KEY;
  const origDeepSeek = process.env.DEEPSEEK_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  try {
    await generateFix('+ code', [{ file: 'a.js', severity: 'error', message: 'bug' }], { model: 'gemini' });
    assert.fail('should have thrown');
  } catch (err) {
    assert(err.message.includes('GEMINI_API_KEY'));
  }
  if (origGemini) process.env.GEMINI_API_KEY = origGemini;
  if (origDeepSeek) process.env.DEEPSEEK_API_KEY = origDeepSeek;
  console.log('  ✅ passed');

  // Test 25: previewFixes with fix missing explanation
  console.log('Test 25: previewFixes no explanation...');
  const noExplPreview = previewFixes([{
    file: 'c.js',
    original: 'old code',
    fixed: 'new code',
  }]);
  assert(noExplPreview.includes('c.js'));
  assert(noExplPreview.includes('- old code'));
  assert(noExplPreview.includes('+ new code'));
  console.log('  ✅ passed');

  console.log('\n🎉 All fixer tests passed!');
})().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
