import { useState } from "react";
import styles from "./ExpandCode.module.css";

type Props = {
  title: string;
  code: string;
  language?: string;
  hint?: string;
};

export default function ExpandCode({
  title,
  code,
  language = "yaml",
  hint = "Click to expand",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`not-prose ${styles.wrap}`}>
      <button
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.chevron} data-open={open || undefined} aria-hidden />
        <span className={styles.title}>{title}</span>
        <span className={styles.hint}>{open ? "Click to collapse" : hint}</span>
      </button>
      {open ? (
        <div className={styles.body}>
          <pre className={styles.pre} data-language={language}>
            <code>{code}</code>
          </pre>
        </div>
      ) : null}
    </div>
  );
}
