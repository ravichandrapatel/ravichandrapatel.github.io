/**
 * FILE_NAME: callOut.tsx
 * DESCRIPTION: Themed callout for notes / warnings in MDX (site tokens, both themes).
 * VERSION: 2.0.0
 * AUTHORS: Ravichandra
 */

import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  NotebookPen,
  OctagonAlert,
} from "lucide-react";
import styles from "./callOut.module.css";

export type CalloutType = "info" | "note" | "warning" | "error" | "success";

type CalloutProps = {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
};

const META: Record<
  CalloutType,
  { defaultTitle: string; Icon: typeof Info; tone: string }
> = {
  info: { defaultTitle: "Note", Icon: Info, tone: "info" },
  note: { defaultTitle: "Note", Icon: NotebookPen, tone: "note" },
  warning: { defaultTitle: "Warning", Icon: AlertTriangle, tone: "warning" },
  error: { defaultTitle: "Error", Icon: OctagonAlert, tone: "error" },
  success: { defaultTitle: "Tip", Icon: CheckCircle2, tone: "success" },
};

export default function Callout({
  type = "info",
  title,
  children,
}: CalloutProps) {
  const current = META[type] ?? META.info;
  const heading = title ?? current.defaultTitle;
  const Icon = current.Icon;

  return (
    <aside
      className={`not-prose ${styles.wrap} ${styles[current.tone]}`}
      role="note"
      aria-label={heading}
    >
      <span className={styles.icon} aria-hidden>
        <Icon size={18} strokeWidth={2} />
      </span>
      <div className={styles.body}>
        <p className={styles.title}>{heading}</p>
        <div className={styles.content}>{children}</div>
      </div>
    </aside>
  );
}
