#!/usr/bin/env node
import { readFileSync, readSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

import { stamp } from "./stamp.js";
import type { DerivationType, StampOptions } from "./types.js";

const DERIVATIONS: DerivationType[] = ["fork", "tune", "patch"];

interface Args {
  contentFile?: string;
  id?: string;
  name?: string;
  version?: string;
  contentUri?: string;
  contentType?: string;
  createdBy?: string;
  createdAt?: string;
  parentId?: string;
  parentVersion?: string;
  derivation?: DerivationType;
  changeSummary?: string;
  out?: string;
  help: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") args.help = true;
    else if (a === "--id") args.id = argv[++i];
    else if (a === "--name") args.name = argv[++i];
    else if (a === "--version") args.version = argv[++i];
    else if (a === "--content-uri") args.contentUri = argv[++i];
    else if (a === "--content-type") args.contentType = argv[++i];
    else if (a === "--created-by") args.createdBy = argv[++i];
    else if (a === "--created-at") args.createdAt = argv[++i];
    else if (a === "--parent-id") args.parentId = argv[++i];
    else if (a === "--parent-version") args.parentVersion = argv[++i];
    else if (a === "--derivation") {
      const v = argv[++i] as DerivationType;
      if (!DERIVATIONS.includes(v)) throw new Error(`--derivation must be one of: ${DERIVATIONS.join(", ")}`);
      args.derivation = v;
    } else if (a === "--change-summary") args.changeSummary = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (!a.startsWith("-")) args.contentFile = a;
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

const HELP = `prompt-provenance-stamp — generate a prompt-provenance-spec v0.1 document

Usage:
  prompt-provenance-stamp <prompt.txt>
      --id <slug>
      --name <human-readable>
      --version <semver>
      --content-uri <uri>
      --created-by <name>
      [--content-type text/markdown]
      [--created-at <iso8601>]
      [--parent-id <slug> --parent-version <semver> --derivation fork|tune|patch
       --change-summary "...what changed..."]
      [--out FILE]

Reads the prompt content from <prompt.txt> (or stdin if "-"), computes
sha256, and emits a prompt-provenance document conforming to
https://github.com/mizcausevic-dev/prompt-provenance-spec.

Exit codes:
  0 — document written
  2 — usage / validation error`;

function requireField<T>(value: T | undefined, name: string): T {
  if (value === undefined || value === "") throw new Error(`--${name} is required`);
  return value;
}

export function run(argv: string[]): number {
  let args: Args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }
  if (args.help || !args.contentFile) {
    process.stdout.write(`${HELP}\n`);
    return args.help ? 0 : 2;
  }

  let content: string;
  try {
    content = args.contentFile === "-" ? readStdinSync() : readFileSync(args.contentFile, "utf8");
  } catch (e) {
    process.stderr.write(`error reading prompt: ${(e as Error).message}\n`);
    return 2;
  }

  let doc;
  try {
    const opts: StampOptions = {
      id: requireField(args.id, "id"),
      name: requireField(args.name, "name"),
      version: requireField(args.version, "version"),
      content_uri: requireField(args.contentUri, "content-uri"),
      created_by: requireField(args.createdBy, "created-by")
    };
    if (args.contentType) opts.content_type = args.contentType;
    if (args.createdAt) opts.created_at = args.createdAt;
    if (args.parentId || args.parentVersion || args.derivation || args.changeSummary) {
      opts.parent = {
        id: requireField(args.parentId, "parent-id"),
        version: requireField(args.parentVersion, "parent-version"),
        derivation: requireField(args.derivation, "derivation"),
        change_summary: requireField(args.changeSummary, "change-summary")
      };
    }
    doc = stamp(content, opts);
  } catch (e) {
    process.stderr.write(`${(e as Error).message}\n`);
    return 2;
  }

  const json = JSON.stringify(doc, null, 2);
  if (args.out) writeFileSync(args.out, `${json}\n`, "utf8");
  else process.stdout.write(`${json}\n`);
  return 0;
}

function readStdinSync(): string {
  const chunks: Buffer[] = [];
  const buf = Buffer.alloc(4096);
  while (true) {
    const n = readSync(0, buf, 0, buf.length, null);
    if (!n) break;
    chunks.push(Buffer.from(buf.subarray(0, n)));
  }
  return Buffer.concat(chunks).toString("utf8");
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  try {
    process.exit(run(process.argv.slice(2)));
  } catch (e) {
    process.stderr.write(`fatal: ${(e as Error).message}\n`);
    process.exit(2);
  }
}
