'use strict';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

/**
 * Build the review prompt from diff and rules.
 * @param {string} diff
 * @param {string[]} rules - Custom review rules
 * @returns {string}
 */
function buildPrompt(diff, rules = []) {
  const rulesText = rules.length
    ? `\nAdditional rules:\n${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
    : '';

  return `You are a strict code reviewer. Review the following git diff and find issues.
${rulesText}
Output ONLY a JSON array of issues. Each issue must have:
- "file": file path
- "line": line number (from the diff hunk header, use the new file line number)
- "severity": "error" | "warning" | "info"
- "message": brief description of the issue
- "suggestion": how to fix it

If no issues found, return an empty array: []

Diff:
\`\`\`
${diff}
\`\`\``;
}

/**
 * Call Gemini API with retry.
 * @param {string} prompt
 * @param {string} apiKey
 * @param {{ maxRetries?: number, timeout?: number }} options
 * @returns {Promise<string>}
 */
async function callGemini(prompt, apiKey, options = {}) {
  const { maxRetries = 2, timeout = 30000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
        }),
      });

      clearTimeout(timer);

      if (res.status === 429) {
        // Rate limited — wait and retry
        const wait = Math.pow(2, attempt) * 1000;
        console.error(`Rate limited, retrying in ${wait}ms...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) {
        throw new Error(`Gemini API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini');
      return text;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const wait = Math.pow(2, attempt) * 1000;
      console.error(`Error: ${err.message}, retrying in ${wait}ms...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

/**
 * Parse LLM response text into structured issues array.
 * @param {string} text
 * @returns {object[]}
 */
function parseResponse(text) {
  // Extract JSON from possible markdown code block
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
  const jsonStr = jsonMatch[1].trim();

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(issue =>
      issue.file && issue.severity && issue.message
    );
  } catch {
    return [];
  }
}

/**
 * Review code diff using Gemini.
 * @param {string} diff
 * @param {{ apiKey?: string, rules?: string[] }} config
 * @returns {Promise<{ issues: object[] }>}
 */
async function reviewCode(diff, config = {}) {
  const apiKey = config.apiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required. Set it via env or config.');
  }

  if (!diff || !diff.trim()) {
    return { issues: [] };
  }

  const prompt = buildPrompt(diff, config.rules);
  const response = await callGemini(prompt, apiKey);
  const issues = parseResponse(response);

  return { issues };
}

module.exports = { reviewCode, buildPrompt, callGemini, parseResponse };
