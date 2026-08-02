import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cloud,
  FileText,
  GitBranch,
  GitPullRequest,
  Package,
  Shield,
  Workflow,
} from "lucide-react";
import styles from "./GitHubIssueOpsFlow.module.css";

type FlowMode = "layers" | "happy" | "gate" | "trust";
type NodeId =
  | "issue"
  | "control"
  | "authz"
  | "workload"
  | "ci"
  | "actions"
  | "modules"
  | "cloud";

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
  dashed?: boolean;
};

const COPY: Record<FlowMode, string> = {
  layers:
    "Intake → App PR → infra-<env> → cloud. Pipeline pinned by SHA. Modules are whatever you already release (one repo or many) — S3/AWS is the demo product, not the ceiling. Control never holds apply power.",
  happy:
    "① Operator fills the Issue Form. ② Labels unlock issue-provision. ③ Control validates + renders a natural-key stack. ④ GitHub App opens a PR on infra-<env>. ⑤ Workload tofu-pipeline plans; merge + Environment gate applies.",
  gate:
    "Public demo gate: the form does not auto-label. Without issueops + product:* — or if the author fails operators.yaml / write check — provision never starts. Workloads stay private; control never holds cloud apply power.",
  trust:
    "Where trust stops: control may mint an App token and open a PR. Only the workload assumes cloud identity (OIDC) and runs apply behind an Environment gate. A leaked control secret must not become tofu apply.",
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
  // layers mode
  Lcontrol: { x: 100, y: 90 },
  Lactions: { x: 100, y: 230 },
  Lmodules: { x: 280, y: 230 },
  Lworkload: { x: 380, y: 90 },
  Lcloud: { x: 500, y: 90 },
  // trust mode — three boxes, one hard stop
  Tcontrol: { x: 110, y: 120 },
  Tworkload: { x: 280, y: 120 },
  Tcloud: { x: 450, y: 120 },
} as const;

const NODES: Record<FlowMode, NodeDef[]> = {
  layers: [
    { id: "control", label: "control", badge: "intake", ...pct(P.Lcontrol.x, P.Lcontrol.y) },
    { id: "actions", label: "actions", badge: "SHA pin", ...pct(P.Lactions.x, P.Lactions.y) },
    { id: "modules", label: "modules", badge: "your tags", ...pct(P.Lmodules.x, P.Lmodules.y) },
    {
      id: "workload",
      label: "infra-<env>",
      badge: "GitOps",
      ...pct(P.Lworkload.x, P.Lworkload.y),
    },
    { id: "cloud", label: "Cloud", badge: "OIDC", ...pct(P.Lcloud.x, P.Lcloud.y) },
  ],
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
  trust: [
    { id: "control", label: "Control", badge: "no OIDC", ...pct(P.Tcontrol.x, P.Tcontrol.y) },
    { id: "workload", label: "Workload", badge: "Env gate", ...pct(P.Tworkload.x, P.Tworkload.y) },
    { id: "cloud", label: "Cloud", badge: "apply", ...pct(P.Tcloud.x, P.Tcloud.y) },
  ],
};

const midTag = (x: number, y: number) => ({
  tagX: (x / VB.w) * 100,
  tagY: (y / VB.h) * 100,
});

const GAP = 36;

const EDGES: Record<FlowMode, Edge[]> = {
  layers: [
    {
      id: "app-pr",
      d: `M ${P.Lcontrol.x + GAP} ${P.Lcontrol.y} L ${P.Lworkload.x - GAP} ${P.Lworkload.y}`,
      tag: "App PR",
      ...midTag((P.Lcontrol.x + P.Lworkload.x) / 2, P.Lcontrol.y - 28),
    },
    {
      id: "pipeline",
      d: `M ${P.Lactions.x + GAP} ${P.Lactions.y} C ${P.Lactions.x + 120} ${P.Lactions.y - 20}, ${P.Lworkload.x - 40} ${P.Lworkload.y + 80}, ${P.Lworkload.x - 10} ${P.Lworkload.y + GAP}`,
      tag: "uses @SHA",
      ...midTag(220, 170),
    },
    {
      id: "mod",
      d: `M ${P.Lmodules.x} ${P.Lmodules.y - GAP} L ${P.Lworkload.x} ${P.Lworkload.y + GAP}`,
      tag: "?ref=tag",
      ...midTag((P.Lmodules.x + P.Lworkload.x) / 2 + 20, (P.Lmodules.y + P.Lworkload.y) / 2),
    },
    {
      id: "oidc",
      d: `M ${P.Lworkload.x + GAP} ${P.Lworkload.y} L ${P.Lcloud.x - GAP} ${P.Lcloud.y}`,
      tag: "OIDC apply",
      ...midTag((P.Lworkload.x + P.Lcloud.x) / 2, P.Lcloud.y - 28),
    },
  ],
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
      tag: "③ no cloud apply on control",
      ...midTag((P.control.x + P.workload.x) / 2, P.control.y - 28),
    },
  ],
  trust: [
    {
      id: "app-pr",
      d: `M ${P.Tcontrol.x + GAP} ${P.Tcontrol.y} L ${P.Tworkload.x - GAP} ${P.Tworkload.y}`,
      tag: "App PR only",
      ...midTag((P.Tcontrol.x + P.Tworkload.x) / 2, P.Tcontrol.y - 32),
    },
    {
      id: "oidc",
      d: `M ${P.Tworkload.x + GAP} ${P.Tworkload.y} L ${P.Tcloud.x - GAP} ${P.Tcloud.y}`,
      tag: "OIDC apply",
      ...midTag((P.Tworkload.x + P.Tcloud.x) / 2, P.Tworkload.y - 32),
    },
    {
      id: "blocked",
      d: `M ${P.Tcontrol.x + 20} ${P.Tcontrol.y + GAP} C ${P.Tcontrol.x + 80} ${P.Tcontrol.y + 110}, ${P.Tcloud.x - 80} ${P.Tcloud.y + 110}, ${P.Tcloud.x - 20} ${P.Tcloud.y + GAP}`,
      tag: "no direct apply",
      dashed: true,
      ...midTag((P.Tcontrol.x + P.Tcloud.x) / 2, P.Tcontrol.y + 95),
    },
  ],
};

function NodeIcon({ id }: { id: NodeId }) {
  if (id === "issue") return <FileText size={24} color="#5b9fd4" strokeWidth={2} aria-hidden />;
  if (id === "control") return <Workflow size={24} color="#3ecf8e" strokeWidth={2} aria-hidden />;
  if (id === "authz") return <Shield size={24} color="#ffec6e" strokeWidth={2} aria-hidden />;
  if (id === "workload") return <GitPullRequest size={24} color="#5b9fd4" strokeWidth={2} aria-hidden />;
  if (id === "actions") return <GitBranch size={24} color="#3ecf8e" strokeWidth={2} aria-hidden />;
  if (id === "modules") return <Package size={24} color="#5b9fd4" strokeWidth={2} aria-hidden />;
  if (id === "cloud") return <Cloud size={24} color="#ffec6e" strokeWidth={2} aria-hidden />;
  return <GitBranch size={24} color="#3ecf8e" strokeWidth={2} aria-hidden />;
}

function FlowEdge({ edge, delay }: { edge: Edge; delay: number }) {
  const dashed = Boolean(edge.dashed);
  return (
    <g>
      <motion.path
        d={edge.d}
        fill="none"
        stroke={dashed ? "rgba(255, 236, 110, 0.45)" : "rgba(91, 159, 212, 0.55)"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={dashed ? "6 5" : undefined}
        markerEnd={dashed ? "url(#gio-arrow-muted)" : "url(#gio-arrow)"}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay }}
      />
      {!dashed ? (
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
      ) : null}
    </g>
  );
}

const MODE_BUTTONS: { value: FlowMode; label: string }[] = [
  { value: "layers", label: "Layers" },
  { value: "happy", label: "Happy path" },
  { value: "gate", label: "Public gate" },
  { value: "trust", label: "Trust" },
];

export default function GitHubIssueOpsFlow({
  initialMode = "happy",
}: {
  initialMode?: FlowMode;
}) {
  const [mode, setMode] = useState<FlowMode>(initialMode);
  const nodes = useMemo(() => NODES[mode], [mode]);
  const edges = useMemo(() => EDGES[mode], [mode]);

  return (
    <section className={`not-prose ${styles.wrap}`} aria-label="GitHub IssueOps flow">
      <div className={styles.head}>
        <p className={styles.title}>GitHub IssueOps</p>
        <div className={styles.toggle} role="radiogroup" aria-label="Flow view">
          {MODE_BUTTONS.map(({ value, label }) => {
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
            <marker
              id="gio-arrow-muted"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255, 236, 110, 0.55)" />
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
