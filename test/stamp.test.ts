import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { stamp } from "../src/stamp.js";

const here = fileURLToPath(new URL(".", import.meta.url));
const samplePrompt = readFileSync(`${here}/../fixtures/sample-prompt.md`, "utf8");

describe("stamp", () => {
  it("produces a sha256:<64-hex> hash deterministic over identical content", () => {
    const d1 = stamp(samplePrompt, base());
    const d2 = stamp(samplePrompt, base());
    expect(d1.prompt.hash).toBe(d2.prompt.hash);
    expect(d1.prompt.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("changes the hash when content changes by even one byte", () => {
    const a = stamp(samplePrompt, base()).prompt.hash;
    const b = stamp(`${samplePrompt} `, base()).prompt.hash;
    expect(a).not.toBe(b);
  });

  it("fills required fields per the spec", () => {
    const d = stamp(samplePrompt, base());
    expect(d.provenance_version).toBe("0.1");
    expect(d.prompt.id).toBe("procurement-assistant");
    expect(d.prompt.version).toBe("1.0.0");
    expect(d.prompt.content_uri).toBe("https://example.com/prompts/procurement-assistant/v1.md");
    expect(d.prompt.content_type).toBe("text/markdown");
    expect(d.authorship.created_by).toBe("miz");
    expect(d.authorship.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(d.approval.state).toBe("draft");
    expect(d.lineage).toEqual({});
  });

  it("emits lineage when --parent is set", () => {
    const d = stamp(samplePrompt, {
      ...base(),
      parent: {
        id: "procurement-assistant",
        version: "0.9.0",
        derivation: "patch",
        change_summary: "Added refusal modes; tightened citation requirement."
      }
    });
    expect(d.lineage.parent).toBe("procurement-assistant@0.9.0");
    expect(d.lineage.derivation).toBe("patch");
    expect(d.lineage.change_summary).toContain("refusal modes");
  });

  it("attaches intent / evaluations when provided", () => {
    const d = stamp(samplePrompt, {
      ...base(),
      intent: { purpose: "PDF QA", models_supported: ["claude-opus-4-7"] },
      evaluations: [
        {
          suite: "ragas-faithfulness",
          result_uri: "https://example.com/evals/r-1.json",
          passed: true,
          ran_at: "2026-05-26T00:00:00Z",
          score: 0.91
        }
      ]
    });
    expect(d.intent?.purpose).toBe("PDF QA");
    expect(d.evaluations).toHaveLength(1);
    expect(d.evaluations?.[0].passed).toBe(true);
  });

  it("rejects an invalid id", () => {
    expect(() => stamp(samplePrompt, { ...base(), id: "Invalid Id!" })).toThrow();
  });

  it("rejects a non-semver version", () => {
    expect(() => stamp(samplePrompt, { ...base(), version: "v1" })).toThrow();
  });

  it("rejects an incomplete parent block", () => {
    expect(() =>
      stamp(samplePrompt, {
        ...base(),
        parent: { id: "procurement-assistant", version: "0.9.0", derivation: "fork", change_summary: "" }
      })
    ).toThrow();
  });

  it("uses created_at override when provided", () => {
    const d = stamp(samplePrompt, { ...base(), created_at: "2026-05-26T03:00:00Z" });
    expect(d.authorship.created_at).toBe("2026-05-26T03:00:00Z");
  });

  it("hashes Uint8Array input too", () => {
    const bytes = new TextEncoder().encode(samplePrompt);
    const d = stamp(bytes, base());
    expect(d.prompt.hash).toBe(stamp(samplePrompt, base()).prompt.hash);
  });
});

function base(): import("../src/types.js").StampOptions {
  return {
    id: "procurement-assistant",
    name: "Procurement Assistant",
    version: "1.0.0",
    content_uri: "https://example.com/prompts/procurement-assistant/v1.md",
    created_by: "miz"
  };
}
