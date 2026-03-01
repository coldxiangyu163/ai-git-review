# ai-git-review

Free AI-powered code review on every git commit.

[![npm version](https://img.shields.io/npm/v/ai-git-review.svg)](https://www.npmjs.com/package/ai-git-review)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🆓 **Free** — uses Gemini free-tier API, zero cost
- 📝 **Incremental review** — only reviews staged changes, not the whole repo
- 🤖 **Multi-model support** — Gemini (default) + DeepSeek with automatic fallback
- 🔄 **Auto fallback** — if primary model fails, seamlessly switches to backup
- ⚙️ **Configurable rules** — customize review focus via `.ai-review.json`
- 🪝 **Git hooks integration** — auto-review on `pre-commit`

## Installation

### Global install (recommended)

```bash
npm install -g ai-git-review
```

### npx (no install)

```bash
npx ai-git-review
```

### Local project install

```bash
npm install --save-dev ai-git-review
```

## Setup

Set at least one API key:

```bash
# Gemini (free, recommended)
export GEMINI_API_KEY="your-gemini-api-key"

# DeepSeek (optional, used as fallback)
export DEEPSEEK_API_KEY="your-deepseek-api-key"
```

Get your free Gemini API key at: https://aistudio.google.com/apikey

## Usage

### Review staged changes

```bash
git add .
ai-review
```

### Install as git hook

```bash
ai-review --init
```

This adds a `pre-commit` hook that runs AI review before each commit.

### Show current config

```bash
ai-review --config
```

### Show help

```bash
ai-review --help
```

## Configuration

Create a `.ai-review.json` in your project root:

```json
{
  "model": "gemini",
  "language": "en",
  "rules": [
    "focus on security issues",
    "check for performance problems",
    "suggest naming improvements"
  ],
  "ignore": [
    "*.test.js",
    "*.spec.ts"
  ]
}
```

### Model Options

| Model | Config Value | API Key Env | Notes |
|---|---|---|---|
| Google Gemini | `"gemini"` | `GEMINI_API_KEY` | Free tier: 15 RPM |
| DeepSeek | `"deepseek"` | `DEEPSEEK_API_KEY` | OpenAI-compatible API |

### Fallback Behavior

If the primary model fails (rate limit, network error, etc.), ai-git-review automatically tries the other model:

- **Primary: Gemini** → Fallback: DeepSeek
- **Primary: DeepSeek** → Fallback: Gemini

Both API keys must be set for fallback to work.

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | — |
| `DEEPSEEK_API_KEY` | DeepSeek API key (optional fallback) | — |
| `AI_REVIEW_MODEL` | Model to use | `gemini` |

## Output Example

```
  Reviewing 3 file(s)...

  src/index.js
    ✖ error:5  Potential null reference
      → Add null check before accessing property

    ⚠ warning:12  Magic number
      → Extract to named constant

  1 error  1 warning

  ✖ Commit blocked — fix errors first
```

## Requirements

- Node.js >= 18.0.0
- Git

## License

[MIT](LICENSE)
