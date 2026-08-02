/**
 * Compact brand marks for the homepage graph background.
 * Simplified geometry — decorative, not full official brand kits.
 */

export type ToolIconId =
  | "aws"
  | "azure"
  | "gcp"
  | "kubernetes"
  | "vault"
  | "argocd"
  | "flux"
  | "tekton"
  | "backstage"
  | "opentofu"
  | "github"
  | "actions"
  | "redhat"
  | "openshift"
  | "linux"
  | "docker"
  | "helm"
  | "prometheus"
  | "terraform"
  | "crossplane"
  | "gitops";

const ICONS: Record<ToolIconId, string> = {
  aws: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
    <path d="M8 28c6 5 14 7.5 22 7.5 5 0 10-1 14-3" stroke="#FF9900" stroke-width="3.2" stroke-linecap="round"/>
    <path d="M34 32.5l5.5-1.2-1.8 5.2" stroke="#FF9900" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <path fill="#232F3E" d="M18 10h5.2l6.8 16H26l-1.3-3.2h-7.2L16.2 26h-3.8L18 10zm1.7 9.6h4.4l-2.2-5.4-2.2 5.4z"/>
  </svg>`,

  azure: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#0089D6" d="M22.4 6 8 38.8h9.6L34.4 6H22.4z"/>
    <path fill="#00A4EF" d="M28.2 20.4 20.8 38.8H40L28.2 20.4z"/>
  </svg>`,

  gcp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M24 8a12 12 0 0 1 10.4 18H28a6 6 0 1 0-4 10.4c2.4 0 4.5-1.2 5.7-3h9.1A12 12 0 1 1 24 8z"/>
    <path fill="#EA4335" d="M12.2 18.6A12 12 0 0 1 24 8v7.2a4.8 4.8 0 0 0-4.1 7.3l-5.5 3.3a12 12 0 0 1-2.2-7.2z"/>
    <path fill="#FBBC04" d="M24 36.8a12 12 0 0 1-11.8-9.6l7.1-1.5A4.8 4.8 0 0 0 24 29.6v7.2z"/>
    <path fill="#34A853" d="M34.4 26a12 12 0 0 1-5.7 9.2l-3.5-6.3A4.8 4.8 0 0 0 28 22.8h6.4z"/>
  </svg>`,

  kubernetes: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#326CE5" d="M24 4 7.5 13.5v21L24 44l16.5-9.5v-21L24 4zm0 4.2 12.8 7.4v14.8L24 37.8 11.2 30.4V15.6L24 8.2z"/>
    <circle cx="24" cy="24" r="3.4" fill="#326CE5"/>
    <g fill="#326CE5">${[0, 51.4, 102.8, 154.3, 205.7, 257.1, 308.6]
      .map((deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        const x = 24 + Math.cos(rad) * 10.5;
        const y = 24 + Math.sin(rad) * 10.5;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.7"/>`;
      })
      .join("")}</g>
  </svg>`,

  vault: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect x="8" y="8" width="32" height="32" rx="3" fill="#000"/>
    <path fill="#FFEC6E" d="M17 15h4.2v7.2c0 2.8 1.4 4.2 3.8 4.2s3.8-1.4 3.8-4.2V15H33v7.4c0 5.4-3.2 8.6-8 8.6s-8-3.2-8-8.6V15z"/>
  </svg>`,

  argocd: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" fill="#EF7B4D"/>
    <path fill="#fff" d="M24 12c6.6 0 12 5.4 12 12 0 2.4-.7 4.6-2 6.5L24 24V12z"/>
    <circle cx="24" cy="24" r="4.5" fill="#0B0B0B"/>
  </svg>`,

  flux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" fill="#5465FF"/>
    <path fill="#fff" d="M16 28c4-10 8-14 16-16-2 6-2 10 0 16-6 2-12 2-16 0z"/>
    <path fill="#B4C0FF" d="M22 18c4 1 7 4 8 8-3 1-6 1-9 0 0-3 0-5 1-8z"/>
  </svg>`,

  tekton: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect x="7" y="7" width="34" height="34" rx="8" fill="#FD495C"/>
    <path fill="#fff" d="M14 16h20v4H28v14h-8V20h-6v-4z"/>
  </svg>`,

  backstage: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect x="6" y="6" width="36" height="36" rx="8" fill="#9BF0E1"/>
    <path fill="#000" d="M16 30V18h5.2c3.2 0 5.2 1.7 5.2 4.3 0 1.6-.8 2.9-2.2 3.6L28 30h-3.4l-3.2-3.6H19V30H16zm3-8.4h2.2c1.3 0 2.1-.7 2.1-1.8S20.5 18 19.2 18H19v3.6z"/>
  </svg>`,

  opentofu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#FFDA18" d="M24 6 10 14v16l14 8 14-8V14L24 6z"/>
    <path fill="#3C3C3C" d="M24 12.2 15.5 17v10.2L24 32.2l8.5-4.9V17L24 12.2zm0 3.2 4.8 2.8v5.8L24 27l-4.8-2.8v-5.8L24 15.4z"/>
  </svg>`,

  terraform: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#7B42BC" d="M18 8v12l10 6V14L18 8zm12 18v12l10 6V32l-10-6zM18 22v12l10 6V28l-10-6z"/>
  </svg>`,

  github: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" fill="#F0F6FC"/>
    <path fill="#0D1117" d="M24 12.5c-6.4 0-11.5 5.2-11.5 11.5 0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.5v-1.9c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.2 1.7 1.2 1 .1.7 1.7 2.7 1.3.1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2a11 11 0 0 1 5.8 0c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.2c0 .3.2.6.8.5 4.6-1.5 7.9-5.8 7.9-10.9 0-6.3-5.1-11.5-11.5-11.5z"/>
  </svg>`,

  actions: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <rect x="6" y="6" width="36" height="36" rx="8" fill="#2088FF"/>
    <path fill="#fff" d="M18 14h4v8h8v4h-8v8h-4v-8h-8v-4h8v-8z"/>
  </svg>`,

  redhat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#EE0000" d="M10 28c2-8 8-14 14-14s12 6 14 14c-3 4-8 7-14 7s-11-3-14-7z"/>
    <path fill="#fff" d="M16 27c1.5-5 4.5-8 8-8s6.5 3 8 8c-2 2.5-4.8 4-8 4s-6-1.5-8-4z"/>
    <ellipse cx="24" cy="18" rx="7" ry="3.2" fill="#EE0000"/>
  </svg>`,

  openshift: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" fill="#EE0000"/>
    <path fill="#fff" d="M24 12a12 12 0 0 1 10.4 6l-5.2 3A6 6 0 0 0 24 18V12zm0 24a12 12 0 0 1-10.4-6l5.2-3A6 6 0 0 0 24 30v6zm12-10.4A12 12 0 0 1 30 34.4l-3-5.2A6 6 0 0 0 30 24h6zM12 22.4A12 12 0 0 1 18 13.6l3 5.2A6 6 0 0 0 18 24h-6z"/>
  </svg>`,

  linux: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" fill="#FCC624"/>
    <ellipse cx="24" cy="27" rx="9" ry="11" fill="#222"/>
    <ellipse cx="24" cy="18" rx="7" ry="8" fill="#F8E08E"/>
    <circle cx="21" cy="17" r="1.5" fill="#111"/>
    <circle cx="27" cy="17" r="1.5" fill="#111"/>
    <ellipse cx="24" cy="21" rx="2" ry="1.3" fill="#E4572E"/>
  </svg>`,

  docker: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <path fill="#2496ED" d="M6 26h5v5H6v-5zm6 0h5v5h-5v-5zm6 0h5v5h-5v-5zm6 0h5v5h-5v-5zM18 20h5v5h-5v-5zm6 0h5v5h-5v-5zm6 0h5v5h-5v-5zM24 14h5v5h-5v-5z"/>
    <path fill="#2496ED" d="M8 33c2 4 7 6 16 6 10 0 16-3 18-8H8.5C7 32 7.2 32.6 8 33z"/>
  </svg>`,

  helm: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="16" fill="none" stroke="#0F1689" stroke-width="3"/>
    <circle cx="24" cy="24" r="4" fill="#0F1689"/>
    ${[0, 60, 120, 180, 240, 300]
      .map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x1 = 24 + Math.cos(rad) * 5;
        const y1 = 24 + Math.sin(rad) * 5;
        const x2 = 24 + Math.cos(rad) * 14;
        const y2 = 24 + Math.sin(rad) * 14;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#0F1689" stroke-width="2.4" stroke-linecap="round"/>`;
      })
      .join("")}
  </svg>`,

  prometheus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" fill="#E6522C"/>
    <path fill="#fff" d="M24 12c4 4 6 8 6 12 0 4-2 7-6 12-4-5-6-8-6-12 0-4 2-8 6-12z"/>
    <circle cx="24" cy="24" r="3.2" fill="#E6522C"/>
  </svg>`,

  crossplane: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" fill="#1E1E2F"/>
    <path fill="#FDB515" d="M14 24a10 10 0 0 1 10-10v6a4 4 0 1 0 4 4h6a10 10 0 1 1-20 0z"/>
    <circle cx="28" cy="20" r="3" fill="#FDB515"/>
  </svg>`,

  gitops: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="18" fill="#1A2533"/>
    <circle cx="17" cy="18" r="4.5" fill="#3ECF8E"/>
    <circle cx="31" cy="30" r="4.5" fill="#5B9FD4"/>
    <path d="M20.5 20.5c5 2 7 5 8.5 8" stroke="#9AABBF" stroke-width="2.6" fill="none" stroke-linecap="round"/>
  </svg>`,
};

export function toolIconSvg(id: ToolIconId): string {
  return ICONS[id];
}

export const PLATFORM_TOOLS: {
  id: string;
  label: string;
  icon: ToolIconId;
  links: string[];
}[] = [
  { id: "aws", label: "AWS", icon: "aws", links: ["kubernetes", "opentofu", "github"] },
  { id: "azure", label: "Azure", icon: "azure", links: ["kubernetes", "opentofu", "backstage"] },
  { id: "gcp", label: "GCP", icon: "gcp", links: ["kubernetes", "gitops", "opentofu"] },
  { id: "kubernetes", label: "Kubernetes", icon: "kubernetes", links: ["helm", "argocd", "flux", "vault"] },
  { id: "vault", label: "Vault", icon: "vault", links: ["kubernetes", "backstage", "linux"] },
  { id: "argocd", label: "Argo CD", icon: "argocd", links: ["kubernetes", "flux", "gitops", "backstage"] },
  { id: "flux", label: "Flux", icon: "flux", links: ["kubernetes", "gitops", "argocd", "helm"] },
  { id: "tekton", label: "Tekton", icon: "tekton", links: ["kubernetes", "actions", "docker", "gitops"] },
  { id: "backstage", label: "Backstage", icon: "backstage", links: ["argocd", "github", "vault"] },
  { id: "opentofu", label: "OpenTofu", icon: "opentofu", links: ["aws", "azure", "gcp", "terraform"] },
  { id: "terraform", label: "Terraform", icon: "terraform", links: ["opentofu", "aws", "crossplane"] },
  { id: "crossplane", label: "Crossplane", icon: "crossplane", links: ["kubernetes", "opentofu", "aws"] },
  { id: "github", label: "GitHub", icon: "github", links: ["actions", "gitops", "backstage"] },
  { id: "actions", label: "Actions", icon: "actions", links: ["github", "tekton", "opentofu"] },
  { id: "redhat", label: "Red Hat", icon: "redhat", links: ["openshift", "linux", "kubernetes"] },
  { id: "openshift", label: "OpenShift", icon: "openshift", links: ["redhat", "kubernetes", "tekton"] },
  { id: "linux", label: "Linux", icon: "linux", links: ["docker", "redhat", "prometheus"] },
  { id: "docker", label: "Docker", icon: "docker", links: ["linux", "kubernetes", "helm"] },
  { id: "helm", label: "Helm", icon: "helm", links: ["kubernetes", "flux", "argocd"] },
  { id: "prometheus", label: "Prometheus", icon: "prometheus", links: ["kubernetes", "linux", "gitops"] },
  { id: "gitops", label: "GitOps", icon: "gitops", links: ["flux", "argocd", "github"] },
];
