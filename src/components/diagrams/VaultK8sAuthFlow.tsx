import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, KeyRound } from "lucide-react";
import styles from "./VaultK8sAuthFlow.module.css";

type AuthMode = "k8s" | "approle";
type NodeId = "pod" | "vault" | "k8s" | "secret";

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

const COPY: Record<AuthMode, string> = {
  k8s: "① Pod already has a projected SA JWT. ② Pod logs into Vault with that JWT. ③ Vault asks the Kubernetes API for a TokenReview before issuing a client token.",
  approle:
    "① Pod reads role_id from a Kubernetes Secret (RBAC). ② Pod logs into Vault with role_id — no SA JWT and no TokenReview. (Lab used role_id only; real AppRole usually also needs secret_id.)",
};

/** viewBox 400×225 — node centers: pod (88,56), vault (312,56), k8s/secret (88,176) */
const NODES: Record<AuthMode, NodeDef[]> = {
  k8s: [
    { id: "pod", label: "Pod", badge: "SA JWT", x: 22, y: 25 },
    { id: "vault", label: "Vault", x: 78, y: 25 },
    { id: "k8s", label: "K8s API", x: 22, y: 78 },
  ],
  approle: [
    { id: "pod", label: "Pod", x: 22, y: 25 },
    { id: "vault", label: "Vault", x: 78, y: 25 },
    { id: "secret", label: "Secret", badge: "role_id", x: 22, y: 78 },
  ],
};

const EDGES: Record<AuthMode, Edge[]> = {
  k8s: [
    {
      id: "login",
      d: "M 110 56 L 288 56",
      tag: "② login (JWT)",
      tagX: 50,
      tagY: 16,
    },
    {
      id: "review",
      d: "M 300 78 C 250 120, 150 155, 110 176",
      tag: "③ TokenReview",
      tagX: 56,
      tagY: 62,
    },
  ],
  approle: [
    {
      id: "rbac",
      d: "M 88 155 L 88 78",
      tag: "① RBAC read",
      tagX: 36,
      tagY: 52,
    },
    {
      id: "login",
      d: "M 110 56 L 288 56",
      tag: "② login (role_id)",
      tagX: 50,
      tagY: 16,
    },
  ],
};

function KubernetesIcon() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Kubernetes">
      <path
        fill="#326CE5"
        d="M31.9 2.1 5.8 17.2v29.6l26.1 15.1 26.1-15.1V17.2L31.9 2.1zm0 5.3 21.1 12.2v24.4L31.9 56.2 10.8 44V19.6L31.9 7.4z"
      />
      <circle cx="32" cy="32" r="5.2" fill="#326CE5" />
      {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        return (
          <g key={deg}>
            <circle
              cx={32 + Math.cos(rad) * 16}
              cy={32 + Math.sin(rad) * 16}
              r="2.6"
              fill="#326CE5"
            />
            <line
              x1="32"
              y1="32"
              x2={32 + Math.cos(rad) * 12.8}
              y2={32 + Math.sin(rad) * 12.8}
              stroke="#326CE5"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
}

function VaultIcon() {
  return (
    <svg viewBox="0 0 72 72" role="img" aria-label="HashiCorp Vault">
      <rect width="72" height="72" rx="6" fill="#FFEC6E" />
      <path
        fill="#000"
        d="M20 16h10.5v40H20V16zm21.5 0H52v40H41.5V16zM33.2 28.5h5.6v27.5h-5.6V28.5z"
      />
    </svg>
  );
}

function NodeIcon({ id }: { id: NodeId }) {
  if (id === "vault") return <VaultIcon />;
  if (id === "k8s") return <KubernetesIcon />;
  if (id === "secret") {
    return <KeyRound size={22} color="#ffec6e" strokeWidth={2} aria-hidden />;
  }
  return <Box size={22} color="#5b9fd4" strokeWidth={2} aria-hidden />;
}

function FlowEdge({ edge, delay }: { edge: Edge; delay: number }) {
  return (
    <g>
      <motion.path
        d={edge.d}
        fill="none"
        stroke="rgba(91, 159, 212, 0.55)"
        strokeWidth="1.75"
        strokeLinecap="round"
        markerEnd="url(#vf-arrow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay }}
      />
      <motion.circle
        r="3.2"
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

export default function VaultK8sAuthFlow() {
  const [mode, setMode] = useState<AuthMode>("k8s");
  const nodes = useMemo(() => NODES[mode], [mode]);
  const edges = useMemo(() => EDGES[mode], [mode]);

  return (
    <section className={`not-prose ${styles.wrap}`} aria-label="Vault and Kubernetes auth flow">
      <div className={styles.head}>
        <p className={styles.title}>Vault ↔ Kubernetes</p>
        <div className={styles.toggle} role="radiogroup" aria-label="Auth method">
          {(
            [
              ["k8s", "Native K8s"],
              ["approle", "AppRole"],
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
                    layoutId="vf-pill"
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
          viewBox="0 0 400 225"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            <marker
              id="vf-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
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
