import { useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, KeyRound } from "lucide-react";

type AuthMode = "k8s" | "approle";

const COPY: Record<AuthMode, string> = {
  k8s:
    "Pod presents its ephemeral ServiceAccount JWT directly to Vault. Vault verifies the signature against the Kubernetes TokenReview API.",
  approle:
    "Authentication is offloaded to cluster RBAC. The Pod reads a static role_id from a Kubernetes Secret and authenticates to Vault without a JWT.",
};

/** Official-style Kubernetes wheel (CNCF brand mark geometry). */
function KubernetesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Kubernetes"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#326CE5"
        d="M31.9 2.1 5.8 17.2v29.6l26.1 15.1 26.1-15.1V17.2L31.9 2.1zm0 5.3 21.1 12.2v24.4L31.9 56.2 10.8 44V19.6L31.9 7.4z"
      />
      <circle cx="32" cy="32" r="6.2" fill="#326CE5" />
      {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const x = 32 + Math.cos(rad) * 16.5;
        const y = 32 + Math.sin(rad) * 16.5;
        return <circle key={deg} cx={x} cy={y} r="3.2" fill="#326CE5" />;
      })}
      {[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6].map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const x2 = 32 + Math.cos(rad) * 13.2;
        const y2 = 32 + Math.sin(rad) * 13.2;
        return (
          <line
            key={`l-${deg}`}
            x1="32"
            y1="32"
            x2={x2}
            y2={y2}
            stroke="#326CE5"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
}

/** HashiCorp Vault mark (chip / “V” product icon geometry). */
function VaultIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 72 72"
      role="img"
      aria-label="HashiCorp Vault"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="72" height="72" rx="10" fill="#FFEC6E" />
      <path
        fill="#000"
        d="M20 16h10.5v40H20V16zm21.5 0H52v40H41.5V16zM33.2 28.5h5.6v27.5h-5.6V28.5z"
      />
    </svg>
  );
}

type NodeProps = {
  x: string;
  y: string;
  label: string;
  children: ReactNode;
};

function DiagramNode({ x, y, label, children }: NodeProps) {
  return (
    <div
      className="absolute flex w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
      style={{ left: x, top: y }}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/15 bg-[#121a24] shadow-lg shadow-black/40">
        {children}
      </div>
      <span className="text-center text-xs font-medium leading-snug text-[#e8eef6]">
        {label}
      </span>
    </div>
  );
}

function FlowPath({
  d,
  active,
  delay = 0,
}: {
  d: string;
  active: boolean;
  delay?: number;
}) {
  return (
    <g>
      <motion.path
        d={d}
        fill="none"
        stroke="rgba(91, 159, 212, 0.35)"
        strokeWidth="2"
        strokeDasharray="6 8"
        initial={false}
        animate={{
          opacity: active ? 1 : 0,
          pathLength: active ? 1 : 0,
        }}
        transition={{ duration: 0.55, delay }}
      />
      {active && (
        <motion.circle
          r="4"
          fill="#3ecf8e"
          initial={{ offsetDistance: "0%" }}
          animate={{ offsetDistance: "100%" }}
          transition={{
            duration: 1.6,
            delay: delay + 0.2,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ offsetPath: `path('${d}')` }}
        />
      )}
    </g>
  );
}

export default function VaultK8sAuthFlow() {
  const [mode, setMode] = useState<AuthMode>("k8s");

  const paths = useMemo(() => {
    if (mode === "k8s") {
      return [
        { d: "M 18 72 C 18 55, 18 40, 18 28", delay: 0 }, // API -> Pod
        { d: "M 22 22 C 45 18, 55 18, 78 22", delay: 0.15 }, // Pod -> Vault
        { d: "M 78 28 C 70 50, 40 68, 22 72", delay: 0.3 }, // Vault -> API
      ];
    }
    return [
      { d: "M 78 72 C 70 55, 40 40, 22 28", delay: 0 }, // Secret -> Pod
      { d: "M 22 22 C 45 18, 55 18, 78 22", delay: 0.2 }, // Pod -> Vault
    ];
  }, [mode]);

  return (
    <section
      id="vault-k8s-auth-flow"
      className="not-prose my-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0b1016] text-[#e8eef6]"
    >
      <div className="flex flex-col gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="m-0 text-lg font-bold tracking-tight text-white sm:text-xl">
          Vault &amp; Kubernetes Integration Flow
        </h2>
        <div
          className="inline-flex rounded-full border border-white/15 bg-[#121a24] p-1"
          role="radiogroup"
          aria-label="Authentication method"
        >
          {(
            [
              ["k8s", "Native K8s Auth"],
              ["approle", "AppRole (No SecretID)"],
            ] as const
          ).map(([value, label]) => {
            const selected = mode === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setMode(value)}
                className={`relative rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                  selected ? "text-[#0b1016]" : "text-[#9aabbf] hover:text-white"
                }`}
              >
                {selected && (
                  <motion.span
                    layoutId="auth-pill"
                    className="absolute inset-0 rounded-full bg-[#3ecf8e]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="relative h-96 w-full"
        style={{
          backgroundImage:
            "radial-gradient(rgba(232,238,246,0.08) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <AnimatePresence mode="sync">
            {paths.map((p) => (
              <FlowPath key={`${mode}-${p.d}`} d={p.d} active delay={p.delay} />
            ))}
          </AnimatePresence>
        </svg>

        <DiagramNode x="18%" y="22%" label="Application Pod">
          <Box className="h-7 w-7 text-[#5b9fd4]" strokeWidth={1.75} />
        </DiagramNode>

        <DiagramNode x="82%" y="22%" label="Vault Server">
          <VaultIcon className="h-9 w-9" />
        </DiagramNode>

        <DiagramNode x="18%" y="78%" label="K8s API / TokenReview">
          <KubernetesIcon className="h-9 w-9" />
        </DiagramNode>

        <AnimatePresence>
          {mode === "approle" && (
            <motion.div
              key="secret-node"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.3 }}
              className="absolute"
              style={{ left: "82%", top: "78%" }}
            >
              <div className="flex w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#ffec6e]/40 bg-[#121a24] shadow-lg shadow-black/40">
                  <KeyRound className="h-7 w-7 text-[#ffec6e]" strokeWidth={1.75} />
                </div>
                <span className="text-center text-xs font-medium leading-snug text-[#e8eef6]">
                  K8s Secret (role_id)
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.p
            key={mode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="m-0 text-sm leading-relaxed text-[#9aabbf]"
          >
            {COPY[mode]}
          </motion.p>
        </AnimatePresence>
      </div>
    </section>
  );
}
