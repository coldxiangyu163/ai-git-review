'use strict';

const { buildPrompt, parseResponse } = require('../src/llm');
const assert = require('assert');

// Test 1: buildPrompt basic
console.log('Test 1: buildPrompt basic...');
const prompt = buildPrompt('+ const x = 1;');
assert(prompt.includes('strict code reviewer'));
assert(prompt.includes('const x = 1'));
assert(prompt.includes('JSON array'));
console.log('  ✅ passed');

// Test 2: buildPrompt with rules
console.log('Test 2: buildPrompt with rules...');
const promptWithRules = buildPrompt('+ let y;', ['No unused variables', 'Use const']);
assert(promptWithRules.includes('No unused variables'));
assert(promptWithRules.includes('Use const'));
assert(promptWithRules.includes('Additional rules'));
console.log('  ✅ passed');

// Test 3: parseResponse valid JSON
console.log('Test 3: parseResponse valid JSON...');
const validResp = JSON.stringify([
  { file: 'a.js', line: 5, severity: 'warning', message: 'unused var', suggestion: 'remove it' }
]);
const issues = parseResponse(validResp);
assert.strictEqual(issues.length, 1);
assert.strictEqual(issues[0].file, 'a.js');
assert.strictEqual(issues[0].severity, 'warning');
console.log('  ✅ passed');

// Test 4: parseResponse with markdown code block
console.log('Test 4: parseResponse markdown block...');
const mdResp = '```json\n[{"file":"b.js","line":1,"severity":"error","message":"bug","suggestion":"fix"}]\n```';
const mdIssues = parseResponse(mdResp);
assert.strictEqual(mdIssues.length, 1);
assert.strictEqual(mdIssues[0].severity, 'error');
console.log('  ✅ passed');

// Test 5: parseResponse empty array
console.log('Test 5: parseResponse empty...');
assert.deepStrictEqual(parseResponse('[]'), []);
console.log('  ✅ passed');

// Test 6: parseResponse invalid JSON
console.log('Test 6: parseResponse invalid JSON...');
assert.deepStrictEqual(parseResponse('not json at all'), []);
console.log('  ✅ passed');

// Test 7: parseResponse filters incomplete issues
console.log('Test 7: parseResponse filters incomplete...');
const mixed = JSON.stringify([
  { file: 'a.js', severity: 'info', message: 'ok' },
  { severity: 'info', message: 'no file' },
  { file: 'b.js', message: 'no severity' },
]);
const filtered = parseResponse(mixed);
assert.strictEqual(filtered.length, 1);
assert.strictEqual(filtered[0].file, 'a.js');
console.log('  ✅ passed');

console.log('\n🎉 All tests passed!');
