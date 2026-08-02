/**
 * FILE_NAME: spvsLinks.ts
 * DESCRIPTION: Display IDs (strip CKV2_) and docs links for SPVS checker findings.
 * VERSION: 1.0.0
 * AUTHORS: Ravichandra
 */

/** Official SPVS 1.5 requirements CSV (per-req deep links use #L line anchors). */
const SPVS_REQUIREMENTS_CSV =
  "https://github.com/OWASP/www-project-spvs/blob/main/1.5/OWASP_SPVS_1.0_-en_Requirements.csv";

const SPVS_PROJECT = "https://owasp.org/www-project-spvs/";

const CHECKOV_GHA_INDEX =
  "https://github.com/bridgecrewio/checkov/blob/main/docs/5.Policy%20Index/github_actions.md";

/**
 * Closest official SPVS req_id for each custom CKV2_SPVS_* check.
 * Custom policies are Checkov-style IDs aligned to SPVS themes — not an official
 * OWASP numbering. Line numbers refer to the 1.5 requirements CSV (header = L1).
 *
 * Shared reqIds are deliberate when noted; do not "fix duplicates" without re-reading
 * the official requirement text.
 */
const SPVS_OFFICIAL_BY_CONTROL: Record<
  string,
  { reqId: string; line: number; why: string }
> = {
  // Job-level explicit permissions — least privilege for pipeline tokens.
  CKV2_SPVS_1: {
    reqId: "V1.1.3",
    line: 4,
    why: "job must declare permissions (no implicit GITHUB_TOKEN)",
  },
  // Defensive shell: fail-secure under platform/shell guidelines.
  CKV2_SPVS_2: {
    reqId: "V3.1.4",
    line: 65,
    why: "set -euo pipefail = GHA/bash hardening guideline",
  },
  // xtrace dumps secrets into logs — not generic hardening.
  CKV2_SPVS_3: {
    reqId: "V3.2.4",
    line: 70,
    why: "no xtrace → secrets must not appear in pipeline logs",
  },
  // Unbuffered python is a CI platform logging/hardening practice.
  CKV2_SPVS_4: {
    reqId: "V3.1.4",
    line: 65,
    why: "python -u / PYTHONUNBUFFERED per CI platform guidelines",
  },
  CKV2_SPVS_5: {
    reqId: "V2.6.2",
    line: 58,
    why: "pin action refs (dependency pinning)",
  },
  CKV2_SPVS_5B: {
    reqId: "V2.6.1",
    line: 57,
    why: "no ../ uses — trusted/local source paths only",
  },
  // Input interpolation in run is a misconfiguration / injection class, not V3.1.4.
  CKV2_SPVS_6: {
    reqId: "V3.1.5",
    line: 66,
    why: "inputs in run: = build-system security misconfiguration",
  },
  CKV2_SPVS_7: {
    reqId: "V3.2.1",
    line: 67,
    why: "no static cloud credential env vars",
  },
  CKV2_SPVS_8: {
    reqId: "V3.2.2",
    line: 68,
    why: "OIDC / secrets-manager style auth (id-token)",
  },
  // Same V1.1.3 as SPVS_1 by design: workflow-root least privilege (declare + no write scopes).
  CKV2_SPVS_9: {
    reqId: "V1.1.3",
    line: 4,
    why: "top-level permissions declared; no workflow-root write scopes",
  },
  // Same V1.1.3 by design: write-all is the extreme opposite of least privilege.
  CKV2_SPVS_10: {
    reqId: "V1.1.3",
    line: 4,
    why: "forbid write-all (least privilege)",
  },
  CKV2_SPVS_11: {
    reqId: "V3.3.20",
    line: 92,
    why: "contents:write needs environment (approval gate)",
  },
  CKV2_SPVS_12: {
    reqId: "V3.1.1",
    line: 62,
    why: "bare self-hosted runners are not hardened build hosts",
  },
  CKV2_SPVS_13: {
    reqId: "V2.6.1",
    line: 57,
    why: "curl|bash is untrusted dependency fetch",
  },
  CKV2_SPVS_15: {
    reqId: "V3.3.18",
    line: 90,
    why: "pull_request_target bypasses trusted-PR / branch protections",
  },
};

const CHECKOV_SOURCE_BY_CONTROL: Record<string, string> = {
  CKV_GHA_1:
    "https://github.com/bridgecrewio/checkov/blob/main/checkov/github_actions/checks/job/AllowUnsecureCommandsOnJob.py",
  CKV_GHA_2:
    "https://github.com/bridgecrewio/checkov/blob/main/checkov/github_actions/checks/job/ShellInjection.py",
  CKV_GHA_3:
    "https://github.com/bridgecrewio/checkov/blob/main/checkov/github_actions/checks/job/SuspectCurlInScript.py",
  CKV_GHA_4:
    "https://github.com/bridgecrewio/checkov/blob/main/checkov/github_actions/checks/job/ReverseShellNetcat.py",
  CKV2_GHA_1:
    "https://github.com/bridgecrewio/checkov/blob/main/checkov/github_actions/checks/graph_checks/ReadOnlyTopLevelPermissions.yaml",
};

export type FindingFamily = "spvs" | "gha" | "meta" | "other";

export interface ControlDocs {
  /** UI label with CKV2_ stripped (e.g. SPVS_15, GHA_1). */
  displayId: string;
  family: FindingFamily;
  /** Primary docs URL for the control ID link. */
  href: string;
  /** Official SPVS req_id when this is a mapped custom SPVS check. */
  spvsReqId: string | null;
  /** Deep link into the official SPVS requirements CSV (or project page). */
  spvsHref: string | null;
}

/**
 * INTENT: Strip Checkov CKV2_ prefix for display and resolve docs / SPVS links.
 * INPUT: raw control_id from deny message (e.g. CKV2_SPVS_15).
 * OUTPUT: display id + hrefs (no network).
 */
export function resolveControlDocs(controlId: string): ControlDocs {
  const displayId = controlId.replace(/^CKV2_/, "");
  const official = SPVS_OFFICIAL_BY_CONTROL[controlId];

  if (official || controlId.startsWith("CKV2_SPVS_") || controlId.startsWith("SPVS_")) {
    const spvsHref = official
      ? `${SPVS_REQUIREMENTS_CSV}#L${official.line}`
      : SPVS_PROJECT;
    return {
      displayId,
      family: "spvs",
      href: spvsHref,
      spvsReqId: official?.reqId ?? null,
      spvsHref,
    };
  }

  if (controlId.startsWith("CKV_GHA_") || controlId.startsWith("CKV2_GHA_") || controlId.startsWith("GHA_")) {
    return {
      displayId,
      family: "gha",
      href: CHECKOV_SOURCE_BY_CONTROL[controlId] ?? CHECKOV_GHA_INDEX,
      spvsReqId: null,
      spvsHref: SPVS_PROJECT,
    };
  }

  if (controlId.startsWith("SPVS_META_")) {
    return {
      displayId,
      family: "meta",
      href: SPVS_PROJECT,
      spvsReqId: null,
      spvsHref: SPVS_PROJECT,
    };
  }

  return {
    displayId,
    family: "other",
    href: SPVS_PROJECT,
    spvsReqId: null,
    spvsHref: SPVS_PROJECT,
  };
}

export function groupLabelForControl(controlId: string): string {
  const { family } = resolveControlDocs(controlId);
  if (family === "spvs") return "SPVS";
  if (family === "gha") return "GHA";
  if (family === "meta") return "Meta";
  return "Other";
}
