# ai-git-review

Free AI-powered code review on every git commit.

## Features

- 🆓 **Free** — uses Gemini free-tier API, zero cost
- 📝 **Incremental review** — only reviews staged changes, not the whole repo
- 🤖 **Multi-model support** — Gemini (default), OpenAI, and more
- ⚙️ **Configurable rules** — customize review focus via `.ai-review.json`
- 🪝 **Git hooks integration** — auto-review on `pre-commit` or `prepare-commit-msg`

## Quick Start

```bash
npx ai-git-review
```

Or install globally:

```bash
npm i -g ai-git-review
ai-review
```

## Usage

### Review staged changes

```bash
git add .
ai-review
```

### Install as git hook

```bash
ai-review --install
```

This adds a `prepare-commit-msg` hook that runs AI review before each commit.

### Specify a model

```bash
ai-review --model openai
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

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key | — |
| `OPENAI_API_KEY` | OpenAI API key (optional) | — |
| `AI_REVIEW_MODEL` | Model to use | `gemini` |

## Screenshot

<!-- TODO: add demo GIF -->

## License

[MIT](LICENSE)
