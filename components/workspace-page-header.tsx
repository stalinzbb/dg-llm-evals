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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-6">
      <div className="min-w-0">
        <p className="mb-1.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
