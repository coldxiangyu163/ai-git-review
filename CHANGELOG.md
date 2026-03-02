# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-03-01

### Added
- **Auto-fix mode** (`--fix`): AI generates code patches and applies them to your files
- **Dry-run support** (`--fix --dry-run`): preview fixes without applying
- **Skip confirmation** (`--fix --yes`): apply fixes without interactive prompt
- **DeepSeek model support**: use DeepSeek as primary or fallback model
- **Automatic model fallback**: if primary model fails, seamlessly switches to the other
- **Configurable rules**: `.ai-review.json` with custom review focus and file ignore patterns
- **Backup files**: `.bak` files created before applying fixes

### Changed
- LLM module refactored to support multiple providers via unified interface
- Improved error messages with actionable suggestions

## [0.1.0] - 2026-03-01

### Added
- Initial MVP release
- **Gemini-powered code review**: sends staged git diff to Google Gemini API
- **Colorized terminal output**: errors (red), warnings (yellow), info (blue)
- **Git hooks integration**: `--init` installs a `pre-commit` hook
- **Config display**: `--config` shows current settings
- CLI entry point: `ai-review` command
- MIT License

[0.2.0]: https://github.com/coldxiangyu163/ai-git-review/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/coldxiangyu163/ai-git-review/releases/tag/v0.1.0
