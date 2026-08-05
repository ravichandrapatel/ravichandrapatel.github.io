/**
 * FILE_NAME: VaultK8sAuthFlow.tsx
 * DESCRIPTION: ESO Hub↔Spoke secret-fetch — JWT/OIDC JWKS allow path and cross-tenant 403 deny.
 * VERSION: 3.2.0
 * AUTHORS: Ravichandra
 */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Database,
  Fingerprint,
  KeyRound,
  RefreshCw,
  ShieldX,
  UserRound,
} from "lucide-react";
import { toolIconUrl } from "../../lib/toolIcons";
import styles from "./VaultK8sAuthFlow.module.css";

type Outcome = "allow" | "deny";
type NodeId =
  | "eso"
  | "sa"
  | "vault"
  | "oidcJwks"
  | "identity"
  | "kv"
  | "k8sSecret"
  | "deny";

type NodeDef = {
  id: NodeId;
  label: string;
  badge?: string;
  x: number;
  y: number;
};

type Pt = { x: number; y: number };
type SegLabel = { text: string; x: number; y: number; tone?: "ok" | "bad" };

type FlowDef = {
  hops: Pt[];
  labels: SegLabel[];
  nodes: NodeDef[];
  steps: string[];
  lead: string;
  hint: string;
};

const VB = { w: 820, h: 480 } as const;

const pct = (x: number, y: number) => ({
  x: (x / VB.w) * 100,
  y: (y / VB.h) * 100,
});

const mid = (a: Pt, b: Pt, ox = 0, oy = 0): Pt => ({
  x: (a.x + b.x) / 2 + ox,
  y: (a.y + b.y) / 2 + oy,
});

function pathD(points: Pt[]): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ${rest.map((p) => `L ${p.x} ${p.y}`).join(" ")}`;
}

/** Spoke (left) · Hub (right) — centers = icon centers; placard hangs below */
const C = {
  sa: { x: 118, y: 128 },
  oidcJwks: { x: 286, y: 128 },
  eso: { x: 118, y: 258 },
  k8sSecret: { x: 286, y: 378 },
  vault: { x: 568, y: 128 },
  identity: { x: 698, y: 258 },
  kv: { x: 568, y: 378 },
  deny: { x: 698, y: 378 },
} as const;

const ZONES = {
  spoke: { x: 28, y: 36, w: 340, h: 420 },
  hub: { x: 452, y: 36, w: 340, h: 420 },
} as const;

/** Shared auth hops 1→4 (identical for allow and deny). JWT verified via OIDC JWKS. */
const AUTH_HOPS: Pt[] = [
  C.eso,
  C.sa, // 1 JWT (aud=vault)
  C.eso,
  C.vault, // 2 login auth/k8s-prod
  C.oidcJwks, // 3 JWKS verify (hub fetches discovery)
  { x: C.vault.x + 28, y: C.vault.y + 40 },
  C.identity, // 4 metadata
  { x: C.eso.x + 36, y: C.eso.y - 20 },
  C.eso,
];

const AUTH_LABELS: SegLabel[] = [
  { text: "1 JWT", ...pct(mid(C.eso, C.sa, 42).x, mid(C.eso, C.sa).y) },
  { text: "2 login", ...pct(mid(C.eso, C.vault).x, mid(C.eso, C.vault).y - 22) },
  { text: "3 JWKS", ...pct(mid(C.vault, C.oidcJwks).x, mid(C.vault, C.oidcJwks).y - 22) },
  {
    text: "4 metadata",
    ...pct(
      mid({ x: C.vault.x + 28, y: C.vault.y + 40 }, C.identity).x,
      mid({ x: C.vault.x + 28, y: C.vault.y + 40 }, C.identity).y + 6,
    ),
  },
];

const BASE_NODES: NodeDef[] = [
  { id: "sa", label: "SA JWT", badge: "aud=vault", ...pct(C.sa.x, C.sa.y) },
  { id: "oidcJwks", label: "OIDC JWKS", badge: ":32080", ...pct(C.oidcJwks.x, C.oidcJwks.y) },
  { id: "eso", label: "ESO", badge: "auth.jwt", ...pct(C.eso.x, C.eso.y) },
  { id: "vault", label: "Vault", badge: "k8s-prod", ...pct(C.vault.x, C.vault.y) },
  { id: "identity", label: "Identity", badge: "finance/…", ...pct(C.identity.x, C.identity.y) },
  { id: "kv", label: "KV v2", badge: "test1-ou", ...pct(C.kv.x, C.kv.y) },
];

const FLOWS: Record<Outcome, FlowDef> = {
  allow: {
    hint: "Allow · finance/payment-api/prod",
    lead: "Same identity · own path → 200 · Secret written.",
    hops: [
      ...AUTH_HOPS,
      C.kv, // 5 GET own path
      { x: C.eso.x + 40, y: C.eso.y + 40 }, // 6 data
      C.eso,
      C.k8sSecret, // 7 write
    ],
    labels: [
      ...AUTH_LABELS,
      { text: "5 GET own", tone: "ok", ...pct(mid(C.eso, C.kv).x, mid(C.eso, C.kv).y + 10) },
      {
        text: "6 data 200",
        tone: "ok",
        ...pct(
          mid(C.kv, { x: C.eso.x + 40, y: C.eso.y + 40 }).x,
          mid(C.kv, { x: C.eso.x + 40, y: C.eso.y + 40 }).y + 14,
        ),
      },
      {
        text: "7 write",
        tone: "ok",
        ...pct(mid(C.eso, C.k8sSecret).x, mid(C.eso, C.k8sSecret).y - 16),
      },
    ],
    nodes: [
      ...BASE_NODES,
      { id: "k8sSecret", label: "K8s Secret", badge: "payment-api", ...pct(C.k8sSecret.x, C.k8sSecret.y) },
    ],
    steps: [
      "Spoke: ESO TokenRequest SA JWT (payment-api · aud=vault).",
      "Spoke → Hub: POST /v1/auth/k8s-prod/login (JWT role=payment-api).",
      "Hub: verify JWT with OIDC JWKS (jwks_url → spoke :32080; cloud uses oidc_discovery_url).",
      "Hub: Identity metadata ou=test1 bu=finance app_name=payment-api env=prod.",
      "Spoke → Hub: GET /v1/test1-ou/data/finance/payment-api/prod.",
      "Hub ACL: universal policy allows → 200 db_password + api_key.",
      "Spoke: ESO creates/updates Secret payment-api-secrets.",
    ],
  },
  deny: {
    hint: "Deny · retail/oms/prod → 403",
    lead: "Same login + identity · wrong BU/app path → 403 · Secret unchanged.",
    hops: [
      ...AUTH_HOPS,
      C.kv, // 5 GET cross-tenant
      C.deny, // ACL stop
      { x: C.eso.x + 48, y: C.eso.y + 48 }, // 6 403 back
      C.eso, // stops — no write
    ],
    labels: [
      ...AUTH_LABELS,
      {
        text: "5 GET retail/oms",
        tone: "bad",
        ...pct(mid(C.eso, C.kv).x, mid(C.eso, C.kv).y + 10),
      },
      {
        text: "6 ACL deny",
        tone: "bad",
        ...pct(mid(C.kv, C.deny).x, mid(C.kv, C.deny).y - 14),
      },
      {
        text: "7 403 · no write",
        tone: "bad",
        ...pct(
          mid(C.deny, { x: C.eso.x + 48, y: C.eso.y + 48 }).x,
          mid(C.deny, { x: C.eso.x + 48, y: C.eso.y + 48 }).y + 10,
        ),
      },
    ],
    nodes: [
      ...BASE_NODES,
      {
        id: "k8sSecret",
        label: "K8s Secret",
        badge: "unchanged",
        ...pct(C.k8sSecret.x, C.k8sSecret.y),
      },
      {
        id: "deny",
        label: "ACL deny",
        badge: "403",
        ...pct(C.deny.x, C.deny.y),
      },
    ],
    steps: [
      "Spoke: ESO uses the same payment-api SA JWT (auth still succeeds).",
      "Spoke → Hub: POST /v1/auth/k8s-prod/login (JWT role=payment-api).",
      "Hub: JWKS verify OK — sub still system:serviceaccount:finance-prod:payment-api.",
      "Hub: Identity metadata still finance / payment-api / prod (not retail).",
      "Spoke → Hub: GET /v1/test1-ou/data/retail/oms/prod (cross-tenant probe).",
      "Hub ACL: universal policy expands to finance/payment-api only → 403.",
      "Spoke: Secret payment-api-secrets is NOT written/updated (Ready=False / error).",
    ],
  },
};

const OUTCOME_LABELS: { value: Outcome; label: string }[] = [
  { value: "allow", label: "Allow" },
  { value: "deny", label: "Deny 403" },
];

function OfficialMark({
  id,
  label,
}: {
  id: "kubernetes" | "vault";
  label: string;
}) {
  return (
    <img
      className={styles.brandImg}
      src={toolIconUrl(id)}
      alt={label}
      width={28}
      height={28}
      decoding="async"
    />
  );
}

function NodeIcon({ id }: { id: NodeId }) {
  if (id === "vault") return <OfficialMark id="vault" label="HashiCorp Vault" />;
  if (id === "oidcJwks") return <OfficialMark id="kubernetes" label="OIDC JWKS" />;
  if (id === "eso") {
    return <RefreshCw size={22} color="#3ecf8e" strokeWidth={2} aria-hidden />;
  }
  if (id === "sa") {
    return <UserRound size={22} color="#5b9fd4" strokeWidth={2} aria-hidden />;
  }
  if (id === "identity") {
    return <Fingerprint size={22} color="#c4b5fd" strokeWidth={2} aria-hidden />;
  }
  if (id === "kv") {
    return <Database size={22} color="#fbbf24" strokeWidth={2} aria-hidden />;
  }
  if (id === "deny") {
    return <ShieldX size={22} color="#f87171" strokeWidth={2} aria-hidden />;
  }
  return <KeyRound size={22} color="#ffec6e" strokeWidth={2} aria-hidden />;
}

function ClusterZones() {
  return (
    <g aria-hidden>
      <rect
        x={ZONES.spoke.x}
        y={ZONES.spoke.y}
        width={ZONES.spoke.w}
        height={ZONES.spoke.h}
        rx={12}
        className={styles.zoneSpoke}
      />
      <rect
        x={ZONES.hub.x}
        y={ZONES.hub.y}
        width={ZONES.hub.w}
        height={ZONES.hub.h}
        rx={12}
        className={styles.zoneHub}
      />
    </g>
  );
}

function ExactDotFlow({ hops, outcome }: { hops: Pt[]; outcome: Outcome }) {
  const d = useMemo(() => pathD(hops), [hops]);
  const duration = Math.max(6.5, (hops.length - 1) * 0.85);
  const bad = outcome === "deny";

  return (
    <g>
      <motion.path
        d={d}
        fill="none"
        stroke={bad ? "rgba(248, 113, 113, 0.7)" : "rgba(91, 159, 212, 0.7)"}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={bad ? "6 4" : undefined}
        markerEnd={bad ? "url(#vf-arrow-bad)" : "url(#vf-arrow)"}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.85, ease: "easeOut" }}
      />
      <motion.circle
        r="5"
        fill={bad ? "#f87171" : "#3ecf8e"}
        stroke="#061018"
        strokeWidth="1.25"
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: "100%" }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 0.6,
        }}
        style={{ offsetPath: `path('${d}')` }}
      />
    </g>
  );
}

export default function VaultK8sAuthFlow() {
  const [outcome, setOutcome] = useState<Outcome>("allow");
  const flow = useMemo(() => FLOWS[outcome], [outcome]);

  return (
    <section
      className={`not-prose ${styles.wrap}`}
      aria-label="Vault Hub ESO secret fetch allow and deny paths"
    >
      <div className={styles.head}>
        <div className={styles.headText}>
          <p className={styles.title}>ESO secret fetch · Hub ↔ Spoke</p>
          <p className={styles.headHint}>{flow.hint}</p>
        </div>
        <div className={styles.toggle} role="radiogroup" aria-label="Request outcome">
          {OUTCOME_LABELS.map(({ value, label }) => {
            const selected = outcome === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={styles.toggleBtn}
                data-tone={value}
                onClick={() => setOutcome(value)}
              >
                {selected && (
                  <motion.span
                    layoutId="vf-outcome-pill"
                    className={
                      value === "deny" ? styles.pillBad : styles.pill
                    }
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
              id="vf-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(91, 159, 212, 0.8)" />
            </marker>
            <marker
              id="vf-arrow-bad"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(248, 113, 113, 0.9)" />
            </marker>
          </defs>
          <ClusterZones />
          <AnimatePresence mode="wait">
            <motion.g
              key={outcome}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ExactDotFlow hops={flow.hops} outcome={outcome} />
            </motion.g>
          </AnimatePresence>
        </svg>

        <AnimatePresence mode="wait">
          <motion.div
            key={`ui-${outcome}`}
            className={styles.layer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`${styles.zoneLabel} ${styles.zoneLabelSpoke}`}
              style={{
                left: `${pct(ZONES.spoke.x + 14, 0).x}%`,
                top: `${pct(0, ZONES.spoke.y + 14).y}%`,
              }}
            >
              <span className={styles.zoneName}>Spoke cluster</span>
              <span className={styles.zoneMeta}>kind-vault-spoke · ESO + workloads</span>
            </div>
            <div
              className={`${styles.zoneLabel} ${styles.zoneLabelHub}`}
              style={{
                left: `${pct(ZONES.hub.x + 14, 0).x}%`,
                top: `${pct(0, ZONES.hub.y + 14).y}%`,
              }}
            >
              <span className={styles.zoneName}>Hub cluster</span>
              <span className={styles.zoneMeta}>kind-vault-hub · Vault Raft ×3</span>
            </div>
            {flow.labels.map((l) => (
              <span
                key={l.text}
                className={
                  l.tone === "bad"
                    ? `${styles.edgeTag} ${styles.edgeTagBad}`
                    : l.tone === "ok"
                      ? `${styles.edgeTag} ${styles.edgeTagOk}`
                      : styles.edgeTag
                }
                style={{ left: `${l.x}%`, top: `${l.y}%` }}
              >
                {l.text}
              </span>
            ))}
            {flow.nodes.map((n) => (
              <figure
                key={n.id}
                className={
                  n.id === "deny"
                    ? `${styles.node} ${styles.nodeBad}`
                    : n.id === "k8sSecret" && outcome === "deny"
                      ? `${styles.node} ${styles.nodeMuted}`
                      : styles.node
                }
                style={{ left: `${n.x}%`, top: `${n.y}%` }}
              >
                <div className={styles.icon}>
                  <NodeIcon id={n.id} />
                </div>
                <div className={styles.placard}>
                  <figcaption className={styles.label}>{n.label}</figcaption>
                  {n.badge ? <span className={styles.badge}>{n.badge}</span> : null}
                </div>
              </figure>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.foot}>
        <AnimatePresence mode="wait">
          <motion.div
            key={outcome}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <p className={styles.footLead}>{flow.lead}</p>
            <ol className={styles.steps}>
              {flow.steps.map((step, i) => (
                <li key={i}>
                  <span
                    className={
                      outcome === "deny" && i >= 4
                        ? `${styles.stepNum} ${styles.stepNumBad}`
                        : styles.stepNum
                    }
                  >
                    {i + 1}
                  </span>
                  <span className={styles.stepText}>{step}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
