import WorkspaceLayout from "@/components/workspace-layout";
import { SettingsSection } from "@/components/workspace-sections";
import WorkspaceStatus from "@/components/workspace-status";
import { useWorkspaceState } from "@/lib/workspace";

export default function SettingsPage() {
  const workspace = useWorkspaceState("settings");

  const stats = [
    {
      label: "Generation",
      value: workspace.platformStatus.openRouterConfigured ? "OpenRouter live" : "Mock mode",
    },
    { label: "Cases", value: workspace.testCases.length },
    { label: "Prompts", value: workspace.promptTemplates.length },
    { label: "Runs", value: workspace.runs.length },
    { label: "Source pool", value: workspace.sourcePoolStats.total },
    { label: "Workspace", value: workspace.workspaceSaveState },
  ];

  return (
    <WorkspaceLayout
      currentPage="settings"
      description="Control model availability and workspace persistence settings."
      onNavClick={workspace.setActivePage}
      stats={stats}
      theme={workspace.theme}
      title="Eval AI Workspace"
      toggleTheme={workspace.toggleTheme}
    >
      <WorkspaceStatus workspace={workspace} />
      {!workspace.loading && <SettingsSection {...workspace} />}
    </WorkspaceLayout>
  );
}
