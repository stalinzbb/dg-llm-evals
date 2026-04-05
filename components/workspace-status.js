import { useEffect, useState } from "react";

export default function WorkspaceStatus({ workspace }) {
  const [phase, setPhase] = useState("idle");
  const message = workspace.errorMessage || workspace.statusMessage;
  const kind = workspace.errorMessage ? "error" : workspace.statusMessage ? "success" : null;

  useEffect(() => {
    if (!message || !kind) {
      setPhase("idle");
      return undefined;
    }

    setPhase("entered");

    const exitTimeout = window.setTimeout(() => {
      setPhase("exiting");
    }, 4780);

    const dismissTimeout = window.setTimeout(() => {
      workspace.dismissMessage(kind);
    }, 5000);

    return () => {
      window.clearTimeout(exitTimeout);
      window.clearTimeout(dismissTimeout);
    };
  }, [kind, message]);

  if (workspace.loading) {
    return <div className="empty-state">Loading workspace…</div>;
  }
  if (message && kind) {
    return (
      <div className={`callout ${kind === "error" ? "error-callout" : "success-callout"} page-message ${phase === "exiting" ? "is-exiting" : ""}`}>
        {message}
      </div>
    );
  }
  return null;
}
