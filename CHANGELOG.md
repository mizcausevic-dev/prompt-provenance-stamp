# Changelog

## v0.1.0 — 2026-05-26

- Initial release: generate a prompt-provenance-spec v0.1 document from raw prompt text.
- Library API: `stamp(content, opts)` returns a complete `ProvenanceDocument`. Computes sha256 over the content bytes, validates id and version against the spec's regexes, threads `parent → lineage` for derivation tracking.
- CLI: `prompt-provenance-stamp <prompt.txt | ->` with required `--id`, `--name`, `--version`, `--content-uri`, `--created-by`, and optional `--parent-*`, `--derivation`, `--change-summary`, `--out FILE`.
- Lane #5 / Suite spec ecosystem: pairs with `prompt-provenance-spec` (writes its shape) and `kg-validate-action` (validates the result in CI).
- Node 20/22 CI (lint, typecheck, coverage, build, demo, `npm audit`), AGPL-3.0-or-later, Dependabot.
