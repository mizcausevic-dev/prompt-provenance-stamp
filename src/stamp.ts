import { createHash } from "node:crypto";

import type {
  Lineage,
  ProvenanceDocument,
  StampOptions
} from "./types.js";

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+].+)?$/;

/**
 * Generate a prompt-provenance v0.1 document from raw prompt content + metadata.
 *
 * The function:
 *   - sha256-hashes the content and writes `sha256:<hex>` to `prompt.hash`
 *   - validates id / version against the spec's regexes
 *   - threads parent → lineage when a parent is supplied
 *   - defaults `approval.state = "draft"` and `authorship.created_at = now()`
 *
 * Pure: no I/O, no network. Pass the raw bytes (string or Buffer); the caller
 * is responsible for telling stamp() where that content is hosted (`content_uri`).
 */
export function stamp(content: string | Uint8Array, opts: StampOptions): ProvenanceDocument {
  if (!ID_PATTERN.test(opts.id)) {
    throw new Error(`prompt.id "${opts.id}" must match ${ID_PATTERN}`);
  }
  if (!SEMVER_PATTERN.test(opts.version)) {
    throw new Error(`prompt.version "${opts.version}" must be semver-shaped`);
  }
  if (opts.parent) {
    if (!ID_PATTERN.test(opts.parent.id)) throw new Error(`parent.id "${opts.parent.id}" must match ${ID_PATTERN}`);
    if (!SEMVER_PATTERN.test(opts.parent.version)) {
      throw new Error(`parent.version "${opts.parent.version}" must be semver-shaped`);
    }
    if (!opts.parent.change_summary) throw new Error("parent.change_summary is required when --parent is set");
  }

  const hash = `sha256:${createHash("sha256").update(content).digest("hex")}`;
  const created_at = opts.created_at ?? new Date().toISOString();

  const lineage: Lineage = opts.parent
    ? {
        parent: `${opts.parent.id}@${opts.parent.version}`,
        derivation: opts.parent.derivation,
        change_summary: opts.parent.change_summary
      }
    : {};

  const doc: ProvenanceDocument = {
    provenance_version: "0.1",
    prompt: {
      id: opts.id,
      name: opts.name,
      version: opts.version,
      hash,
      content_uri: opts.content_uri,
      content_type: opts.content_type ?? "text/markdown"
    },
    lineage,
    authorship: {
      created_by: opts.created_by,
      created_at
    },
    approval: opts.approval ?? { state: "draft" }
  };

  if (opts.intent) doc.intent = opts.intent;
  if (opts.evaluations && opts.evaluations.length > 0) doc.evaluations = opts.evaluations;

  return doc;
}
