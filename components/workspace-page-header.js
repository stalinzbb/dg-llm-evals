export default function WorkspacePageHeader({ actions = null, description, eyebrow = "Workspace", title }) {
  return (
    <div className="content-header">
      <div>
        <div className="section-label">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {actions}
    </div>
  );
}
