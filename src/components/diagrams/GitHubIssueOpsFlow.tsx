import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, GitBranch, GitPullRequest, Shield, Workflow } from "lucide-react";
import styles from "./GitHubIssueOpsFlow.module.css";

type FlowMode = "happy" | "gate";
type NodeId = "issue" | "control" | "authz" | "workload" | "ci";

type NodeDef = {
  id: NodeId;
  label: string;
  badge?: string;
  x: number;
  y: number;
};

type Edge = {
  id: string;
  d: string;
  tag: string;
  tagX: number;
  tagY: number;
};

const COPY: Record<FlowMode, string> = {
  happy:
    "① Operator fills the Issue Form. ② Labels unlock issue-provision. ③ Control validates + renders a natural-key stack. ④ GitHub App opens a PR on infra-<env>. ⑤ Workload tofu-pipeline plans; merge + Environment gate applies.",
  gate:
    "Public demo gate: the form does not auto-label. Without issueops + product:* — or if the author fails operators.yaml / write check — provision never starts. Workloads stay private; control never assumes AWS.",
};

const VB = { w: 560, h: 320 } as const;
const pct = (x: number, y: number) => ({
  x: (x / VB.w) * 100,
  y: (y / VB.h) * 100,
});

const P = {
  issue: { x: 90, y: 90 },
  control: { x: 280, y: 90 },
  authz: { x: 280, y: 230 },
  workload: { x: 470, y: 90 },
  ci: { x: 470, y: 230 },
} as const;

const NODES: Record<FlowMode, NodeDef[]> = {
  happy: [
    { id: "issue", label: "Issue Form", badge: "s3-bucket", ...pct(P.issue.x, P.issue.y) },
    { id: "control", label: "Control", badge: "issue-provision", ...pct(P.control.x, P.control.y) },
    { id: "workload", label: "infra-<env>", badge: "GitOps PR", ...pct(P.workload.x, P.workload.y) },
    { id: "ci", label: "tofu-pipeline", badge: "plan→apply", ...pct(P.ci.x, P.ci.y) },
  ],
  gate: [
    { id: "issue", label: "Issue Form", badge: "no labels", ...pct(P.issue.x, P.issue.y) },
    { id: "authz", label: "Authz", badge: "operators.yaml", ...pct(P.authz.x, P.authz.y) },
    { id: "control", label: "Control", badge: "blocked", ...pct(P.control.x, P.control.y) },
    { id: "workload", label: "infra-<env>", badge: "private", ...pct(P.workload.x, P.workload.y) },
  ],
};

const midTag = (x: number, y: number) => ({
  tagX: (x / VB.w) * 100,
  tagY: (y / VB.h) * 100,
});

const GAP = 36;

const EDGES: Record<FlowMode, Edge[]> = {
  happy: [
    {
      id: "label",
      d: `M ${P.issue.x + GAP} ${P.issue.y} L ${P.control.x - GAP} ${P.control.y}`,
      tag: "② labels + authz",
      ...midTag((P.issue.x + P.control.x) / 2, P.issue.y - 28),
    },
    {
      id: "pr",
      d: `M ${P.control.x + GAP} ${P.control.y} L ${P.workload.x - GAP} ${P.workload.y}`,
      tag: "④ App PR",
      ...midTag((P.control.x + P.workload.x) / 2, P.control.y - 28),
    },
    {
      id: "ci",
      d: `M ${P.workload.x} ${P.workload.y + GAP} L ${P.ci.x} ${P.ci.y - GAP}`,
      tag: "⑤ plan / apply",
      ...midTag(P.ci.x + 70, (P.workload.y + P.ci.y) / 2),
    },
  ],
  gate: [
    {
      id: "check",
      d: `M ${P.issue.x + GAP} ${P.issue.y + 20} C ${P.issue.x + 80} ${P.issue.y + 80}, ${P.authz.x - 80} ${P.authz.y - 40}, ${P.authz.x - GAP} ${P.authz.y}`,
      tag: "① no auto labels",
      ...midTag(160, 160),
    },
    {
      id: "deny",
      d: `M ${P.authz.x} ${P.authz.y - GAP} L ${P.control.x} ${P.control.y + GAP}`,
      tag: "② fail closed",
      ...midTag(P.control.x + 72, (P.authz.y + P.control.y) / 2),
    },
    {
      id: "private",
      d: `M ${P.control.x + GAP} ${P.control.y} L ${P.workload.x - GAP} ${P.workload.y}`,
      tag: "③ no AWS on control",
      ...midTag((P.control.x + P.workload.x) / 2, P.control.y - 28),
    },
  ],
};

function NodeIcon({ id }: { id: NodeId }) {
  if (id === "issue") return <FileText size={24} color="#5b9fd4" strokeWidth={2} aria-hidden />;
  if (id === "control") return <Workflow size={24} color="#3ecf8e" strokeWidth={2} aria-hidden />;
  if (id === "authz") return <Shield size={24} color="#ffec6e" strokeWidth={2} aria-hidden />;
  if (id === "workload") return <GitPullRequest size={24} color="#5b9fd4" strokeWidth={2} aria-hidden />;
  return <GitBranch size={24} color="#3ecf8e" strokeWidth={2} aria-hidden />;
}

function FlowEdge({ edge, delay }: { edge: Edge; delay: number }) {
  return (
    <g>
      <motion.path
        d={edge.d}
        fill="none"
        stroke="rgba(91, 159, 212, 0.55)"
        strokeWidth="2"
        strokeLinecap="round"
        markerEnd="url(#gio-arrow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay }}
      />
      <motion.circle
        r="3.5"
        fill="#3ecf8e"
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{
          duration: 1.7,
          delay: delay + 0.25,
          repeat: Infinity,
          ease: "linear",
        }}
        style={{ offsetPath: `path('${edge.d}')` }}
      />
    </g>
  );
}

export default function GitHubIssueOpsFlow() {
  const [mode, setMode] = useState<FlowMode>("happy");
  const nodes = useMemo(() => NODES[mode], [mode]);
  const edges = useMemo(() => EDGES[mode], [mode]);

  return (
    <section className={`not-prose ${styles.wrap}`} aria-label="GitHub IssueOps flow">
      <div className={styles.head}>
        <p className={styles.title}>GitHub IssueOps</p>
        <div className={styles.toggle} role="radiogroup" aria-label="Flow view">
          {(
            [
              ["happy", "Happy path"],
              ["gate", "Public gate"],
            ] as const
          ).map(([value, label]) => {
            const selected = mode === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={styles.toggleBtn}
                onClick={() => setMode(value)}
              >
                {selected && (
                  <motion.span
                    layoutId="gio-pill"
                    className={styles.pill}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className={styles.toggleLabel}>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.canvas}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${VB.w} ${VB.h}`}
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <marker
              id="gio-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(91, 159, 212, 0.75)" />
            </marker>
          </defs>
          <AnimatePresence mode="wait">
            <motion.g
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {edges.map((edge, i) => (
                <FlowEdge key={edge.id} edge={edge} delay={i * 0.12} />
              ))}
            </motion.g>
          </AnimatePresence>
        </svg>

        <AnimatePresence mode="wait">
          <motion.div
            key={`nodes-${mode}`}
            className={styles.layer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {nodes.map((n) => (
              <figure
                key={n.id}
                className={styles.node}
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
              >
                <div className={styles.icon}>
                  <NodeIcon id={n.id} />
                </div>
                <figcaption className={styles.label}>{n.label}</figcaption>
                {n.badge ? <span className={styles.badge}>{n.badge}</span> : null}
              </figure>
            ))}
            {edges.map((edge) => (
              <span
                key={edge.id}
                className={styles.edgeTag}
                style={{ left: `${edge.tagX}%`, top: `${edge.tagY}%` }}
              >
                {edge.tag}
              </span>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.foot}>
        <AnimatePresence mode="wait">
          <motion.p
            key={mode}
            className={styles.footText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {COPY[mode]}
          </motion.p>
        </AnimatePresence>
      </div>
    </section>
  );
}
