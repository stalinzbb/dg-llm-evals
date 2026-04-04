export default function WorkspaceStatus({ workspace }) {
  if (workspace.loading) {
    return <div className="empty-state">Loading workspace…</div>;
  }
  if (workspace.errorMessage) {
    return <div className="callout error-callout page-message">{workspace.errorMessage}</div>;
  }
  if (workspace.statusMessage) {
    return <div className="callout success-callout page-message">{workspace.statusMessage}</div>;
  }
  return null;
}
