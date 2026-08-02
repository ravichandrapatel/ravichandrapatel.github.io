/**
 * FILE_NAME: opaEval.ts
 * DESCRIPTION: Client-side OPA WASM evaluation for SPVS GitHub Actions policies.
 * VERSION: 1.1.0
 * AUTHORS: Ravichandra
 */

import { loadPolicy, type LoadedPolicy } from "@open-policy-agent/opa-wasm";
import { CORE_SCHEMA, load as loadYaml } from "js-yaml";

export interface SpvsFinding {
  control_id: string;
  field: string | null;
  raw: string;
  description: string;
}

export type PolicyKind = "workflow" | "composite" | "unknown";

export class YamlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YamlParseError";
  }
}

// Field paths may nest brackets (e.g. jobs.build.steps[1].run) — do not stop at first ].
const FINDING_RE = /^([A-Z0-9_]+)(?:\s*\[(.+)\])?:\s*(.+)$/;

/** Entrypoints compiled into public/policy.wasm (both packages exist under policy-src/). */
export const SPVS_ENTRYPOINTS = ["workflow/deny", "composite/deny"] as const;

/** ~4 MiB — policy.wasm is ~370 KiB; default 5 pages (320 KiB) is too small. */
const WASM_MEMORY_PAGES = 64;

let policyPromise: Promise<LoadedPolicy> | null = null;

function wasmUrl(): string {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalized = base.endsWith("/") ? base : `${base}/`;
  return `${normalized}policy.wasm`;
}

/**
 * INTENT: Load and cache the compiled policy module (one network fetch).
 * INPUT: none (fetches /policy.wasm once).
 * OUTPUT: LoadedPolicy ready for evaluate().
 * SIDE_EFFECTS: fetches static wasm asset.
 */
export function getPolicy(): Promise<LoadedPolicy> {
  if (!policyPromise) {
    policyPromise = (async () => {
      try {
        const res = await fetch(wasmUrl());
        if (!res.ok) {
          throw new Error(
            `Could not load policy.wasm (${res.status} ${res.statusText}). Rebuild with scripts/build-wasm.sh.`,
          );
        }
        const buf = await res.arrayBuffer();
        return await loadPolicy(buf, WASM_MEMORY_PAGES);
      } catch (err) {
        policyPromise = null;
        if (err instanceof Error) throw err;
        throw new Error("Failed to load policy.wasm");
      }
    })();
  }
  return policyPromise;
}

/**
 * INTENT: Undo YAML 1.1 boolean-key coercion of workflow `on:`.
 * INPUT: parsed mapping that may have key "true" instead of "on".
 * OUTPUT: mapping with `on` restored when needed.
 * SIDE_EFFECTS: none (returns a shallow copy when rewriting).
 *
 * Silent false negatives (e.g. missing pull_request_target findings) are worse
 * than a loud error — CORE_SCHEMA usually prevents this, but we still normalize.
 */
export function normalizeWorkflowInput(
  doc: Record<string, unknown>,
): Record<string, unknown> {
  if (Object.prototype.hasOwnProperty.call(doc, "on")) return doc;
  if (!Object.prototype.hasOwnProperty.call(doc, "true")) return doc;

  const next: Record<string, unknown> = { ...doc };
  next.on = next["true"];
  delete next["true"];
  return next;
}

/**
 * INTENT: Parse workflow/action YAML for OPA, preserving the `on:` key.
 * INPUT: raw YAML text.
 * OUTPUT: plain object suitable as OPA input.
 * SIDE_EFFECTS: none.
 */
export function parseWorkflowYaml(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new YamlParseError("Paste a GitHub Actions workflow or composite action YAML first.");
  }

  let parsed: unknown;
  try {
    // CORE_SCHEMA avoids YAML 1.1 treating the workflow key `on` as boolean true.
    parsed = loadYaml(trimmed, { schema: CORE_SCHEMA });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new YamlParseError(`Invalid YAML: ${detail}`);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new YamlParseError(
      "YAML must parse to a mapping (object) — a workflow or composite action document.",
    );
  }

  return normalizeWorkflowInput(parsed as Record<string, unknown>);
}

export function detectPolicyKind(doc: Record<string, unknown>): PolicyKind {
  const runs = doc.runs;
  if (
    runs &&
    typeof runs === "object" &&
    !Array.isArray(runs) &&
    (runs as { using?: unknown }).using === "composite"
  ) {
    return "composite";
  }
  if ("jobs" in doc || "on" in doc) return "workflow";
  return "unknown";
}

export function parseFinding(raw: string): SpvsFinding {
  const m = FINDING_RE.exec(raw);
  if (!m) {
    return { control_id: "UNKNOWN", field: null, raw, description: raw };
  }
  return {
    control_id: m[1],
    field: m[2] ?? null,
    raw,
    description: m[3],
  };
}

function denyMessagesFromResultSet(resultSet: unknown): string[] {
  if (!Array.isArray(resultSet) || resultSet.length === 0) return [];
  const result = (resultSet[0] as { result?: unknown })?.result;
  if (result == null) return [];
  if (Array.isArray(result)) {
    return result.filter((x): x is string => typeof x === "string");
  }
  if (typeof result === "string") return [result];
  if (typeof result === "object") {
    return Object.values(result as Record<string, unknown>).filter(
      (x): x is string => typeof x === "string",
    );
  }
  return [];
}

/**
 * INTENT: Evaluate pasted YAML against all SPVS deny entrypoints (no network).
 * INPUT: raw YAML string.
 * OUTPUT: parsed findings + detected document kind.
 * SIDE_EFFECTS: loads wasm once (cached); no further network on evaluate.
 */
export async function evaluateSpvsYaml(yamlText: string): Promise<{
  kind: PolicyKind;
  findings: SpvsFinding[];
}> {
  const doc = parseWorkflowYaml(yamlText);
  const kind = detectPolicyKind(doc);
  const policy = await getPolicy();

  const messages = new Set<string>();
  for (const entrypoint of SPVS_ENTRYPOINTS) {
    try {
      const resultSet = policy.evaluate(doc, entrypoint);
      for (const msg of denyMessagesFromResultSet(resultSet)) {
        messages.add(msg);
      }
    } catch (err) {
      // Missing/broken entrypoint must not abort the whole check (false empty set).
      const detail = err instanceof Error ? err.message : String(err);
      console.warn(`[spvs] entrypoint ${entrypoint} skipped: ${detail}`);
    }
  }

  const findings = [...messages]
    .map(parseFinding)
    .sort((a, b) => a.control_id.localeCompare(b.control_id) || a.raw.localeCompare(b.raw));

  return { kind, findings };
}

/** Prefetch wasm on page mount so Run check is local-only. */
export function prefetchPolicy(): void {
  void getPolicy().catch(() => {
    /* surfaced when user runs a check */
  });
}
