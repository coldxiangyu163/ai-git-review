'use strict';

const { buildPrompt, parseResponse, callDeepSeek, callGemini, callLLM, reviewCode, DEEPSEEK_ENDPOINT, GEMINI_ENDPOINT } = require('../src/llm');
const assert = require('assert');

// ─── buildPrompt tests ───

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

// ─── parseResponse tests ───

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

// ─── Module export tests ───

// Test 8: callDeepSeek is exported and is a function
console.log('Test 8: callDeepSeek export...');
assert.strictEqual(typeof callDeepSeek, 'function');
console.log('  ✅ passed');

// Test 9: callGemini is exported and is a function
console.log('Test 9: callGemini export...');
assert.strictEqual(typeof callGemini, 'function');
console.log('  ✅ passed');

// Test 10: callLLM is exported and is a function
console.log('Test 10: callLLM export...');
assert.strictEqual(typeof callLLM, 'function');
console.log('  ✅ passed');

// Test 11: DEEPSEEK_ENDPOINT is correct
console.log('Test 11: DEEPSEEK_ENDPOINT...');
assert.strictEqual(DEEPSEEK_ENDPOINT, 'https://api.deepseek.com/v1/chat/completions');
console.log('  ✅ passed');

// Test 12: GEMINI_ENDPOINT is correct
console.log('Test 12: GEMINI_ENDPOINT...');
assert(GEMINI_ENDPOINT.includes('generativelanguage.googleapis.com'));
console.log('  ✅ passed');

// ─── reviewCode tests ───

// Test 13: reviewCode returns empty for empty diff
console.log('Test 13: reviewCode empty diff...');
(async () => {
  const result = await reviewCode('', {});
  assert.deepStrictEqual(result.issues, []);
  assert.strictEqual(result.model, 'none');
  console.log('  ✅ passed');

  // Test 14: reviewCode empty whitespace diff
  console.log('Test 14: reviewCode whitespace diff...');
  const result2 = await reviewCode('   \n  ', {});
  assert.deepStrictEqual(result2.issues, []);
  console.log('  ✅ passed');

  // Test 15: reviewCode throws without API key (gemini)
  console.log('Test 15: reviewCode no gemini key...');
  const origGemini = process.env.GEMINI_API_KEY;
  const origDeepSeek = process.env.DEEPSEEK_API_KEY;
  delete process.env.GEMINI_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  try {
    await reviewCode('+ const x = 1;', { model: 'gemini' });
    assert.fail('should have thrown');
  } catch (err) {
    assert(err.message.includes('GEMINI_API_KEY'));
  }
  console.log('  ✅ passed');

  // Test 16: reviewCode throws without API key (deepseek)
  console.log('Test 16: reviewCode no deepseek key...');
  try {
    await reviewCode('+ const x = 1;', { model: 'deepseek' });
    assert.fail('should have thrown');
  } catch (err) {
    assert(err.message.includes('DEEPSEEK_API_KEY'));
  }
  // Restore env
  if (origGemini) process.env.GEMINI_API_KEY = origGemini;
  if (origDeepSeek) process.env.DEEPSEEK_API_KEY = origDeepSeek;
  console.log('  ✅ passed');

  // ─── Mock-based DeepSeek tests ───

  // Test 17: callLLM routes to deepseek
  console.log('Test 17: callLLM routing to deepseek requires key...');
  delete process.env.DEEPSEEK_API_KEY;
  try {
    await callLLM('test prompt', 'deepseek', {});
    assert.fail('should have thrown');
  } catch (err) {
    assert(err.message.includes('DEEPSEEK_API_KEY'));
  }
  if (origDeepSeek) process.env.DEEPSEEK_API_KEY = origDeepSeek;
  console.log('  ✅ passed');

  // Test 18: callLLM routes to gemini by default
  console.log('Test 18: callLLM routing to gemini requires key...');
  delete process.env.GEMINI_API_KEY;
  try {
    await callLLM('test prompt', 'gemini', {});
    assert.fail('should have thrown');
  } catch (err) {
    assert(err.message.includes('GEMINI_API_KEY'));
  }
  if (origGemini) process.env.GEMINI_API_KEY = origGemini;
  console.log('  ✅ passed');

  // Test 19: reviewCode fallback — primary fails, no fallback key → throws primary error
  console.log('Test 19: reviewCode fallback no key...');
  delete process.env.GEMINI_API_KEY;
  delete process.env.DEEPSEEK_API_KEY;
  try {
    await reviewCode('+ const x = 1;', { model: 'gemini' });
    assert.fail('should have thrown');
  } catch (err) {
    // Should throw the primary error since no fallback key
    assert(err.message.includes('GEMINI_API_KEY'));
  }
  if (origGemini) process.env.GEMINI_API_KEY = origGemini;
  if (origDeepSeek) process.env.DEEPSEEK_API_KEY = origDeepSeek;
  console.log('  ✅ passed');

  // Test 20: reviewCode result includes model field
  console.log('Test 20: reviewCode result structure...');
  const emptyResult = await reviewCode('', {});
  assert('issues' in emptyResult);
  assert('model' in emptyResult);
  console.log('  ✅ passed');

  console.log('\n🎉 All tests passed!');
})().catch(err => {
  console.error('\n❌ Test failed:', err.message);
  process.exit(1);
});
