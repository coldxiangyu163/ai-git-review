'use strict';

const { parseDiff } = require('../src/git');
const assert = require('assert');

// Test 1: Empty diff
console.log('Test 1: Empty diff...');
assert.deepStrictEqual(parseDiff(''), []);
assert.deepStrictEqual(parseDiff(null), []);
assert.deepStrictEqual(parseDiff('  '), []);
console.log('  ✅ passed');

// Test 2: Single file diff
console.log('Test 2: Single file diff...');
const singleDiff = `diff --git a/src/index.js b/src/index.js
index abc1234..def5678 100644
--- a/src/index.js
+++ b/src/index.js
@@ -1,3 +1,4 @@
 const a = 1;
+const b = 2;
 const c = 3;
-const d = 4;`;

const result = parseDiff(singleDiff);
assert.strictEqual(result.length, 1);
assert.strictEqual(result[0].path, 'src/index.js');
assert.strictEqual(result[0].binary, false);
assert.strictEqual(result[0].hunks.length, 1);
assert.strictEqual(result[0].hunks[0].lines.length, 4);
console.log('  ✅ passed');

// Test 3: Binary file
console.log('Test 3: Binary file...');
const binaryDiff = `diff --git a/image.png b/image.png
Binary files /dev/null and b/image.png differ`;

const binResult = parseDiff(binaryDiff);
assert.strictEqual(binResult.length, 1);
assert.strictEqual(binResult[0].path, 'image.png');
assert.strictEqual(binResult[0].binary, true);
assert.strictEqual(binResult[0].hunks.length, 0);
console.log('  ✅ passed');

// Test 4: Multiple files
console.log('Test 4: Multiple files...');
const multiDiff = `diff --git a/a.js b/a.js
--- a/a.js
+++ b/a.js
@@ -1 +1,2 @@
 line1
+line2
diff --git a/b.js b/b.js
--- a/b.js
+++ b/b.js
@@ -1 +1 @@
-old
+new`;

const multiResult = parseDiff(multiDiff);
assert.strictEqual(multiResult.length, 2);
assert.strictEqual(multiResult[0].path, 'a.js');
assert.strictEqual(multiResult[1].path, 'b.js');
console.log('  ✅ passed');

// Test 5: Multiple hunks in one file
console.log('Test 5: Multiple hunks...');
const multiHunkDiff = `diff --git a/big.js b/big.js
--- a/big.js
+++ b/big.js
@@ -1,3 +1,4 @@
 line1
+added
 line3
@@ -10,3 +11,3 @@
 line10
-removed
+replaced
 line12`;

const hunkResult = parseDiff(multiHunkDiff);
assert.strictEqual(hunkResult[0].hunks.length, 2);
console.log('  ✅ passed');

console.log('\n🎉 All tests passed!');
