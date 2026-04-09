import { useEffect } from "react";

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
    return <div className="empty-state">Loading workspace…</div>;
  }
  if (message && kind) {
    return (
      <div className={`callout ${kind === "error" ? "error-callout" : "success-callout"} page-message`}>
        {message}
      </div>
    );
  }
  return null;
}
