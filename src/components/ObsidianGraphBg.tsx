import { useEffect, useRef } from "react";
import { toolIconSvg, type ToolIconId } from "../lib/toolIcons";
import styles from "./ObsidianGraphBg.module.css";

export type GraphSeed = {
  id: string;
  label: string;
  icon?: ToolIconId;
  hub?: boolean;
  links?: string[];
};

type Props = {
  seeds: GraphSeed[];
};

type SimNode = {
  id: string;
  label: string;
  icon?: HTMLImageElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
};

type SimEdge = { a: SimNode; b: SimNode };

function loadSvgImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("icon load failed"));
    };
    img.src = url;
  });
}

/** Deterministic pseudo-random in [-0.5, 0.5) from a string seed. */
function jitter(id: string, salt: number): number {
  let h = salt * 374761393;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h >>> 0) % 1000) / 1000 - 0.5;
}

function layoutOnce(nodes: SimNode[], edges: SimEdge[], ticks = 220) {
  let heat = 1;
  for (let t = 0; t < ticks; t++) {
    for (const e of edges) {
      const dx = e.b.x - e.a.x;
      const dy = e.b.y - e.a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - 110) * 0.014 * heat;
      e.a.vx += (dx / d) * f;
      e.a.vy += (dy / d) * f;
      e.b.vx -= (dx / d) * f;
      e.b.vy -= (dy / d) * f;
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d2 = dx * dx + dy * dy || 1;
        const f = Math.min(2200 / d2, 3.6) * heat;
        const d = Math.sqrt(d2);
        a.vx -= (dx / d) * f;
        a.vy -= (dy / d) * f;
        b.vx += (dx / d) * f;
        b.vy += (dy / d) * f;
      }
    }
    for (const n of nodes) {
      n.vx -= n.x * 0.0014 * heat;
      n.vy -= n.y * 0.0014 * heat;
      n.x += n.vx;
      n.y += n.vy;
      n.vx *= 0.86;
      n.vy *= 0.86;
    }
    heat *= 0.985;
  }
}

/**
 * Decorative tool graph — layout + paint once. No animation loop.
 */
export default function ObsidianGraphBg({ seeds }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || seeds.length === 0) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let cancelled = false;
    let nodes: SimNode[] = [];
    let edges: SimEdge[] = [];
    let dpr = 1;
    let view = { x: 0, y: 0, k: 1 };
    let painted = false;

    const size = () => ({
      w: Math.max(1, wrap.clientWidth),
      h: Math.max(1, wrap.clientHeight),
    });

    const draw = () => {
      const { w, h } = size();
      dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
      const bw = Math.round(w * dpr);
      const bh = Math.round(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      view = { x: w * 0.58, y: h * 0.38, k: Math.min(w, h) / 560 };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(view.x, view.y);
      ctx.scale(view.k, view.k);
      ctx.lineCap = "round";

      for (const e of edges) {
        ctx.beginPath();
        ctx.moveTo(e.a.x, e.a.y);
        ctx.lineTo(e.b.x, e.b.y);
        ctx.strokeStyle = "rgba(154, 171, 191, 0.16)";
        ctx.lineWidth = 1.1 / view.k;
        ctx.stroke();
      }

      for (const n of nodes) {
        const plate = n.icon ? n.r + 3 : n.r;
        const glow = plate + 7;
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glow);
        grad.addColorStop(0, "rgba(91, 159, 212, 0.28)");
        grad.addColorStop(1, "rgba(91, 159, 212, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, n.y, glow, 0, Math.PI * 2);
        ctx.fill();

        if (n.icon) {
          const s = n.r * 1.55;
          ctx.beginPath();
          ctx.arc(n.x, n.y, plate + 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(12, 16, 22, 0.58)";
          ctx.fill();
          ctx.strokeStyle = "rgba(232, 238, 246, 0.26)";
          ctx.lineWidth = 1 / view.k;
          ctx.stroke();
          ctx.globalAlpha = 0.95;
          ctx.drawImage(n.icon, n.x - s / 2, n.y - s / 2, s, s);
          ctx.globalAlpha = 1;
        } else {
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(210, 222, 236, 0.65)";
          ctx.fill();
        }

        if (n.label && view.k > 0.35) {
          const text =
            n.label.length > 22 ? `${n.label.slice(0, 20)}…` : n.label;
          const fs = Math.max(
            10,
            Math.round(11 / Math.sqrt(Math.max(view.k, 0.5))),
          );
          const tx = n.x + plate + 5 / view.k;
          const ty = n.y;
          ctx.font = `600 ${fs / view.k}px "IBM Plex Mono", ui-monospace, monospace`;
          ctx.textBaseline = "middle";
          ctx.fillStyle = "rgba(0,0,0,0.55)";
          ctx.fillText(text, tx + 0.7 / view.k, ty + 0.7 / view.k);
          ctx.fillStyle = "rgba(232, 238, 246, 0.88)";
          ctx.fillText(text, tx, ty);
        }
      }
      ctx.restore();
      painted = true;
    };

    const boot = async () => {
      const iconIds = [
        ...new Set(seeds.map((s) => s.icon).filter(Boolean)),
      ] as ToolIconId[];
      const loaded = new Map<ToolIconId, HTMLImageElement>();
      await Promise.all(
        iconIds.map(async (id) => {
          try {
            loaded.set(id, await loadSvgImage(toolIconSvg(id)));
          } catch {
            /* keep fallback */
          }
        }),
      );
      if (cancelled) return;

      const byId = new Map<string, SimNode>();
      nodes = seeds.map((s, i) => {
        const angle = (i / Math.max(1, seeds.length)) * Math.PI * 2;
        const spread = 190 + (i % 5) * 30;
        const node: SimNode = {
          id: s.id,
          label: s.label,
          icon: s.icon ? loaded.get(s.icon) : undefined,
          x: Math.cos(angle) * spread + jitter(s.id, 1) * 40,
          y: Math.sin(angle) * spread * 0.72 + jitter(s.id, 2) * 40,
          vx: 0,
          vy: 0,
          r: s.icon && loaded.has(s.icon) ? 13 : 3,
        };
        byId.set(s.id, node);
        return node;
      });

      const edgeKeys = new Set<string>();
      edges = [];
      const addEdge = (aId: string, bId: string) => {
        if (aId === bId) return;
        const key = aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;
        if (edgeKeys.has(key)) return;
        const a = byId.get(aId);
        const b = byId.get(bId);
        if (!a || !b) return;
        edgeKeys.add(key);
        edges.push({ a, b });
      };
      for (const s of seeds) {
        for (const t of s.links ?? []) addEdge(s.id, t);
      }
      for (let i = 0; i < seeds.length; i++) {
        addEdge(seeds[i].id, seeds[(i + 1) % seeds.length].id);
        if (i % 3 === 0) {
          addEdge(seeds[i].id, seeds[(i + 3) % seeds.length].id);
        }
      }

      layoutOnce(nodes, edges);
      draw();
    };

    let lastW = 0;
    let lastH = 0;
    const ro = new ResizeObserver(() => {
      if (!painted || cancelled) return;
      const { w, h } = size();
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      draw();
    });
    ro.observe(wrap);
    void boot();

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [seeds]);

  return (
    <div ref={wrapRef} className={styles.wrap} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
