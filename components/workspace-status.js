import { useEffect } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspaceStatus({ workspace }) {
  const message = workspace.errorMessage || workspace.statusMessage;
  const kind = workspace.errorMessage ? "error" : workspace.statusMessage ? "success" : null;

  useEffect(() => {
    if (!message || !kind) {
      return undefined;
    }

    const dismissTimeout = window.setTimeout(() => {
      workspace.dismissMessage(kind);
    }, 5000);

    return () => {
      window.clearTimeout(dismissTimeout);
    };
  }, [kind, message, workspace]);

  if (workspace.loading) {
    return <Skeleton className="h-20 rounded-[24px]" />;
  }

  if (message && kind) {
    return (
      <Alert
        className="rounded-[24px] border border-[color:var(--line)] bg-[color:var(--surface)]/90 text-[color:var(--ink)] shadow-[var(--shadow-md)]"
        variant={kind === "error" ? "destructive" : "default"}
      >
        <AlertTitle>{kind === "error" ? "Workspace error" : "Workspace update"}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
