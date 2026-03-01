'use strict';

const { getStagedDiff } = require('./git');
const { reviewCode } = require('./llm');
const { formatReview } = require('./formatter');
const { loadConfig } = require('./config');

async function main() {
  const config = loadConfig();
  const diff = await getStagedDiff();
  const review = await reviewCode(diff, config);
  const output = formatReview(review);
  console.log(output);
}

module.exports = { main };
