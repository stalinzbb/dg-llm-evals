import type { ReactNode } from "react";

interface WorkspacePageHeaderProps {
  actions?: ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
}

export default function WorkspacePageHeader({
  actions = null,
  description,
  eyebrow = "Workspace",
  title,
}: WorkspacePageHeaderProps) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
