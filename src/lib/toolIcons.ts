/**
 * Homepage graph tool marks.
 * Brand SVGs vendored from https://thesvg.org/ into /public/icons/tools/.
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

/** Public URL for a vendored theSVG (or local) mark. */
export function toolIconUrl(id: ToolIconId): string {
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}icons/tools/${id}.svg`;
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
