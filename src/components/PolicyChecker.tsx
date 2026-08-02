/**
 * FILE_NAME: PolicyChecker.tsx
 * DESCRIPTION: Client-side SPVS policy checker React island (paste YAML → OPA WASM).
 * VERSION: 1.0.0
 * AUTHORS: Ravichandra
 */

import { useEffect, useMemo, useState } from "react";
import {
  evaluateSpvsYaml,
  prefetchPolicy,
  type PolicyKind,
  type SpvsFinding,
  YamlParseError,
} from "../lib/opaEval";
import { groupLabelForControl, resolveControlDocs } from "../lib/spvsLinks";
import styles from "./PolicyChecker.module.css";

const SAMPLE_BAD = `name: deploy
on:
  pull_request_target:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh
`;

type RunState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "ok"; kind: PolicyKind; findings: SpvsFinding[] }
  | { status: "error"; message: string };

export default function PolicyChecker() {
  const [yamlText, setYamlText] = useState(SAMPLE_BAD);
  const [state, setState] = useState<RunState>({ status: "idle" });

  useEffect(() => {
    prefetchPolicy();
  }, []);

  const groups = useMemo(() => {
    if (state.status !== "ok" || state.findings.length === 0) return [];
    const map = new Map<string, SpvsFinding[]>();
    for (const f of state.findings) {
      const key = groupLabelForControl(f.control_id);
      const list = map.get(key) ?? [];
      list.push(f);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [state]);

  async function runCheck() {
    setState({ status: "running" });
    try {
      const { kind, findings } = await evaluateSpvsYaml(yamlText);
      setState({ status: "ok", kind, findings });
    } catch (err) {
      const message =
        err instanceof YamlParseError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Evaluation failed for an unknown reason.";
      setState({ status: "error", message });
    }
  }

  return (
    <div className={`not-prose ${styles.panel}`}>
      <div className={styles.toolbar}>
        <p className={styles.meta}>
          Client-only eval
          {state.status === "ok" ? (
            <>
              {" · "}
              <span className={styles.kind}>
                {state.kind === "unknown" ? "unrecognized shape" : state.kind}
              </span>
            </>
          ) : null}
        </p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => {
              setYamlText(SAMPLE_BAD);
              setState({ status: "idle" });
            }}
          >
            Load sample
          </button>
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => void runCheck()}
            disabled={state.status === "running"}
          >
            {state.status === "running" ? "Checking…" : "Run check"}
          </button>
        </div>
      </div>

      <div className={styles.editor}>
        <label className={styles.srOnly} htmlFor="spvs-yaml">
          GitHub Actions workflow or composite action YAML
        </label>
        <textarea
          id="spvs-yaml"
          className={styles.textarea}
          value={yamlText}
          onChange={(e) => {
            setYamlText(e.target.value);
            if (state.status !== "idle" && state.status !== "running") {
              setState({ status: "idle" });
            }
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={"name: ci\non:\n  push:\njobs:\n  ..."}
        />
      </div>

      <div className={styles.results} aria-live="polite">
        {state.status === "idle" ? (
          <p className={styles.statusIdle}>
            Paste a workflow or composite <code>action.yml</code>, then run check.
            Evaluation uses the local WASM bundle only — no upload.
          </p>
        ) : null}

        {state.status === "running" ? (
          <p className={styles.statusIdle}>Evaluating against workflow/deny and composite/deny…</p>
        ) : null}

        {state.status === "error" ? (
          <p className={styles.statusErr} role="alert">
            {state.message}
          </p>
        ) : null}

        {state.status === "ok" && state.findings.length === 0 ? (
          <p className={styles.statusOk}>
            No violations found for the evaluated deny rules
            {state.kind !== "unknown" ? ` (${state.kind})` : ""}.
          </p>
        ) : null}

        {state.status === "ok" && state.findings.length > 0 ? (
          <>
            <p className={styles.statusErr}>
              {state.findings.length} finding
              {state.findings.length === 1 ? "" : "s"}
            </p>
            {groups.map(([label, findings]) => (
              <section key={label} className={styles.group}>
                <h3 className={styles.groupTitle}>{label}</h3>
                <ul className={styles.list}>
                  {findings.map((f) => {
                    const docs = resolveControlDocs(f.control_id);
                    return (
                      <li key={f.raw} className={styles.finding}>
                        <div className={styles.findingHead}>
                          <a
                            className={styles.id}
                            href={docs.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={
                              docs.spvsReqId
                                ? `Official SPVS ${docs.spvsReqId}`
                                : `Docs for ${docs.displayId}`
                            }
                          >
                            {docs.displayId}
                          </a>
                          {f.field ? <span className={styles.field}>{f.field}</span> : null}
                          {docs.spvsReqId && docs.spvsHref ? (
                            <a
                              className={styles.spvsRef}
                              href={docs.spvsHref}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {docs.spvsReqId}
                            </a>
                          ) : docs.family === "gha" && docs.spvsHref ? (
                            <a
                              className={styles.spvsRef}
                              href={docs.spvsHref}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              SPVS
                            </a>
                          ) : null}
                        </div>
                        <span className={styles.desc}>{f.description}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
