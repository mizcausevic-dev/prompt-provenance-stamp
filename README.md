# prompt-provenance-stamp

Generate a [prompt-provenance-spec](https://github.com/mizcausevic-dev/prompt-provenance-spec) v0.1 document from raw prompt text. Computes `sha256` of the content, fills required spec fields, threads `parent → lineage` for derivation tracking.

> Status: v0.1.0 — Node 20/22 supported, library + CLI.

## Why

When a prompt is your product (it routes customers, drafts contracts, summarizes evidence), you need the same versioning rigor you give code: a content hash, a parent reference, an approval state. `prompt-provenance-spec` defines that document. This tool *generates* it from a prompt file in one command.

## CLI

```
npx prompt-provenance-stamp <prompt.txt>
    --id <slug>
    --name "<human-readable>"
    --version <semver>
    --content-uri <uri>
    --created-by <name>
    [--content-type text/markdown]
    [--created-at <iso8601>]
    [--parent-id <slug> --parent-version <semver> --derivation fork|tune|patch
     --change-summary "...what changed..."]
    [--out FILE]
```

Reads `<prompt.txt>` (or stdin when `<prompt.txt>` is `-`), sha256-hashes the bytes, and writes a valid prompt-provenance JSON to stdout (or `--out FILE`).

## Library

```ts
import { stamp } from "prompt-provenance-stamp";

const doc = stamp(promptText, {
  id: "procurement-assistant",
  name: "Procurement Assistant",
  version: "1.1.0",
  content_uri: "https://example.com/prompts/procurement-assistant/v1.1.md",
  created_by: "miz",
  parent: {
    id: "procurement-assistant",
    version: "1.0.0",
    derivation: "patch",
    change_summary: "Tightened citation requirement"
  }
});

// doc.prompt.hash === "sha256:…"
// doc.lineage.parent === "procurement-assistant@1.0.0"
```

## Composes with

- [**`prompt-provenance-spec`**](https://github.com/mizcausevic-dev/prompt-provenance-spec) — the schema this writes.
- [**`kg-validate-action`**](https://github.com/mizcausevic-dev/kg-validate-action) — validate the stamped doc in CI.
- [**`mcp-tool-card-summary`**](https://github.com/mizcausevic-dev/mcp-tool-card-summary) — sibling tool: per-tool safety summary across an MCP server.

## Develop

```
npm install
npm run lint && npm run typecheck && npm run coverage && npm run build
npm run demo
```

## License

[AGPL-3.0-or-later](LICENSE)
