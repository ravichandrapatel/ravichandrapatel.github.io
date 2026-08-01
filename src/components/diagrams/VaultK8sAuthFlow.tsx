import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, KeyRound } from "lucide-react";
import styles from "./VaultK8sAuthFlow.module.css";

type AuthMode = "k8s" | "approle";

type Step = {
  id: string;
  badge: string;
  title: string;
  body: string;
  icon: "pod" | "vault" | "k8s" | "secret";
};

const MODES: Record<
  AuthMode,
  { label: string; trust: string; summary: string; steps: Step[] }
> = {
  k8s: {
    label: "Native K8s auth",
    trust: "Trust boundary: Vault ↔ TokenReview (JWT verified in-cluster)",
    summary:
      "Pod presents its ephemeral ServiceAccount JWT to Vault. Vault asks the Kubernetes API (TokenReview) whether that JWT is real. No long-lived secret on the pod.",
    steps: [
      {
        id: "jwt",
        badge: "01",
        title: "Pod gets a SA JWT",
        body: "Kubernetes mints a short-lived ServiceAccount token for the workload.",
        icon: "k8s",
      },
      {
        id: "present",
        badge: "02",
        title: "Pod → Vault",
        body: "The pod logs in with that JWT. Nothing static in a Secret.",
        icon: "pod",
      },
      {
        id: "review",
        badge: "03",
        title: "Vault verifies",
        body: "Vault calls TokenReview on the cluster API, then issues a Vault token.",
        icon: "vault",
      },
    ],
  },
  approle: {
    label: "AppRole (no SecretID)",
    trust: "Trust boundary: who can read the role_id Secret (RBAC) — Vault never talks to the API",
    summary:
      "Auth is offloaded to cluster RBAC. The pod reads a static role_id from a Kubernetes Secret and logs into Vault with that alone — no JWT round-trip.",
    steps: [
      {
        id: "secret",
        badge: "01",
        title: "Read role_id",
        body: "Pod mounts or fetches a Secret that holds the AppRole role_id.",
        icon: "secret",
      },
      {
        id: "login",
        badge: "02",
        title: "Pod → Vault",
        body: "Approle login with role_id only. Vault does not call TokenReview.",
        icon: "pod",
      },
      {
        id: "token",
        badge: "03",
        title: "Vault token out",
        body: "Same identity/metadata stamping afterward — different front door.",
        icon: "vault",
      },
    ],
  },
};

function KubernetesIcon() {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="Kubernetes">
      <path
        fill="#326CE5"
        d="M31.9 2.1 5.8 17.2v29.6l26.1 15.1 26.1-15.1V17.2L31.9 2.1zm0 5.3 21.1 12.2v24.4L31.9 56.2 10.8 44V19.6L31.9 7.4z"
      />
      <circle cx="32" cy="32" r="5.4" fill="#326CE5" />
      {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        return (
          <g key={deg}>
            <circle
              cx={32 + Math.cos(rad) * 16.2}
              cy={32 + Math.sin(rad) * 16.2}
              r="2.8"
              fill="#326CE5"
            />
            <line
              x1="32"
              y1="32"
              x2={32 + Math.cos(rad) * 13}
              y2={32 + Math.sin(rad) * 13}
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
      <rect width="72" height="72" rx="8" fill="#FFEC6E" />
      <path
        fill="#000"
        d="M20 16h10.5v40H20V16zm21.5 0H52v40H41.5V16zM33.2 28.5h5.6v27.5h-5.6V28.5z"
      />
    </svg>
  );
}

function StepIcon({ kind }: { kind: Step["icon"] }) {
  if (kind === "vault") return <VaultIcon />;
  if (kind === "k8s") return <KubernetesIcon />;
  if (kind === "secret") {
    return <KeyRound color="#ffec6e" strokeWidth={1.75} aria-hidden />;
  }
  return <Box color="#5b9fd4" strokeWidth={1.75} aria-hidden />;
}

export default function VaultK8sAuthFlow() {
  const [mode, setMode] = useState<AuthMode>("k8s");
  const active = useMemo(() => MODES[mode], [mode]);

  return (
    <section className={`not-prose ${styles.wrap}`} aria-label="Vault and Kubernetes auth flow">
      <div className={styles.head}>
        <div>
          <p className={styles.kicker}>Machine auth</p>
          <h2 className={styles.title}>Vault ↔ Kubernetes</h2>
        </div>
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
        <AnimatePresence mode="wait">
          <motion.ol
            key={mode}
            className={styles.steps}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28 }}
          >
            {active.steps.map((step, i) => (
              <li key={step.id} className={styles.step}>
                <article className={styles.card}>
                  <div className={styles.iconRow}>
                    <div className={styles.iconBox}>
                      <StepIcon kind={step.icon} />
                    </div>
                    <span className={styles.badge}>{step.badge}</span>
                  </div>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepBody}>{step.body}</p>
                </article>

                {i < active.steps.length - 1 && (
                  <>
                    <div className={styles.mobileArrow} aria-hidden>
                      ↓
                    </div>
                    <div className={styles.particleRow} aria-hidden>
                      <motion.span
                        className={styles.particle}
                        initial={{ left: "0%" }}
                        animate={{ left: "92%" }}
                        transition={{
                          duration: 1.5,
                          delay: i * 0.12,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />
                    </div>
                  </>
                )}
              </li>
            ))}
          </motion.ol>
        </AnimatePresence>
      </div>

      <div className={styles.foot}>
        <p className={styles.footLabel}>{active.label}</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={mode}
            className={styles.footText}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {active.summary}
          </motion.p>
        </AnimatePresence>
        <p className={styles.trust}>{active.trust}</p>
      </div>
    </section>
  );
}
