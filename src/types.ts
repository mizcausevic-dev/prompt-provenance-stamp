// Generate a prompt-provenance-spec document
// (https://github.com/mizcausevic-dev/prompt-provenance-spec) from raw prompt
// content. We model the required subset of v0.1 of the spec.

export type ApprovalState = "draft" | "approved" | "deprecated";
export type DerivationType = "fork" | "tune" | "patch";

export interface Prompt {
  id: string;
  name: string;
  version: string;
  /** `sha256:<64-hex>` — computed by stamp() from the content bytes. */
  hash: string;
  content_uri: string;
  content_type: string;
}

export interface Lineage {
  parent?: string;
  derivation?: DerivationType;
  change_summary?: string;
}

export interface Authorship {
  created_by: string;
  reviewed_by?: string[];
  approved_by?: string;
  created_at: string;
  approved_at?: string;
}

export interface Intent {
  purpose?: string;
  in_scope?: string[];
  out_of_scope?: string[];
  models_supported?: string[];
}

export interface Evaluation {
  suite: string;
  result_uri: string;
  passed: boolean;
  ran_at: string;
  score?: number;
}

export interface Approval {
  state: ApprovalState;
  reason?: string;
}

export interface Deprecation {
  deprecated_at: string;
  replaced_by?: string;
  reason: string;
}

export interface ProvenanceDocument {
  provenance_version: string;
  prompt: Prompt;
  lineage: Lineage;
  authorship: Authorship;
  intent?: Intent;
  evaluations?: Evaluation[];
  approval: Approval;
  deprecation?: Deprecation;
}

/** Options for `stamp()`. */
export interface StampOptions {
  id: string;
  name: string;
  version: string;
  content_uri: string;
  content_type?: string;
  created_by: string;
  /** Defaults to current time when omitted. */
  created_at?: string;
  intent?: Intent;
  evaluations?: Evaluation[];
  approval?: Approval;
  parent?: {
    id: string;
    version: string;
    derivation: DerivationType;
    change_summary: string;
  };
}
