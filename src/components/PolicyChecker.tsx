/**
 * FILE_NAME: PolicyChecker.tsx
 * DESCRIPTION: Client-side SPVS policy checker — paste YAML, evaluate OPA WASM locally.
 * VERSION: 1.1.0
 * AUTHORS: Ravichandra
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
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

const SAMPLE_BETTER = `name: ci
on:
  push:
    branches: [main]
permissions:
  contents: read
jobs:
  build:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@8ade135a41bc03ea155e62e844d188df1ea18608 # v4.1.0
      - name: Build
        run: |
          set -euo pipefail
          echo "ok"
`;

const STAGES = [
  { id: "plan", label: "Plan" },
  { id: "develop", label: "Develop" },
  { id: "integrate", label: "Integrate" },
  { id: "release", label: "Release" },
  { id: "operate", label: "Operate" },
] as const;

type RunState =
  | { status: "idle" }
  | { status: "running" }
  | { status: "ok"; kind: PolicyKind; findings: SpvsFinding[] }
  | { status: "error"; message: string };

export default function PolicyChecker() {
  const [yamlText, setYamlText] = useState(SAMPLE_BAD);
  const [state, setState] = useState<RunState>({ status: "idle" });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    prefetchPolicy()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
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

  const runCheck = useCallback(async () => {
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
  }, [yamlText]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void runCheck();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runCheck]);

  return (
    <div className={`not-prose ${styles.panel}`}>
      <div className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.headTitle}>Workflow / composite checker</p>
          <p className={styles.headMeta}>
            {ready ? "Policy WASM ready" : "Loading policy…"}
            {state.status === "ok" ? (
              <>
                {" · "}
                <span className={styles.kind}>
                  {state.kind === "unknown" ? "unrecognized shape" : state.kind}
                </span>
              </>
            ) : null}
            {" · "}
            <kbd className={styles.kbd}>Ctrl</kbd>+
            <kbd className={styles.kbd}>Enter</kbd>
          </p>
        </div>
        <div className={styles.privacy} title="Nothing is uploaded">
          <ShieldCheck size={14} strokeWidth={2} aria-hidden />
          <span>Client-only</span>
        </div>
      </div>

      <div className={styles.stages} aria-label="SPVS stages">
        {STAGES.map((s) => (
          <span key={s.id} className={styles.stage}>
            {s.label}
          </span>
        ))}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.btn}
            onClick={() => {
              setYamlText(SAMPLE_BAD);
              setState({ status: "idle" });
            }}
          >
            Load failing sample
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => {
              setYamlText(SAMPLE_BETTER);
              setState({ status: "idle" });
            }}
          >
            Load safer sample
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={() => {
              setYamlText("");
              setState({ status: "idle" });
            }}
          >
            Clear
          </button>
        </div>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={() => void runCheck()}
          disabled={state.status === "running" || !yamlText.trim()}
        >
          {state.status === "running" ? (
            <>
              <Loader2 size={14} className={styles.spin} aria-hidden />
              Checking…
            </>
          ) : (
            "Run check"
          )}
        </button>
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
            Paste a workflow (<code>on</code> / <code>jobs</code>) or composite{" "}
            <code>action.yml</code>, then run check. Evaluation stays in this
            tab — no upload.
          </p>
        ) : null}

        {state.status === "running" ? (
          <p className={styles.statusIdle}>
            Evaluating <code>workflow/deny</code> and <code>composite/deny</code>
            …
          </p>
        ) : null}

        {state.status === "error" ? (
          <p className={styles.statusErr} role="alert">
            <ShieldAlert size={16} aria-hidden />
            <span>{state.message}</span>
          </p>
        ) : null}

        {state.status === "ok" && state.findings.length === 0 ? (
          <p className={styles.statusOk}>
            <CheckCircle2 size={16} aria-hidden />
            <span>
              No violations for the evaluated deny rules
              {state.kind !== "unknown" ? ` (${state.kind})` : ""}.
            </span>
          </p>
        ) : null}

        {state.status === "ok" && state.findings.length > 0 ? (
          <>
            <p className={styles.statusErr}>
              <ShieldAlert size={16} aria-hidden />
              <span>
                {state.findings.length} finding
                {state.findings.length === 1 ? "" : "s"}
              </span>
            </p>
            {groups.map(([label, findings]) => (
              <section key={label} className={styles.group}>
                <h3 className={styles.groupTitle}>
                  {label}
                  <span className={styles.groupCount}>{findings.length}</span>
                </h3>
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
                          {f.field ? (
                            <span className={styles.field}>{f.field}</span>
                          ) : null}
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
