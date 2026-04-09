import WorkspaceLayout from "@/components/workspace-layout";
import { SettingsSection } from "@/components/workspace-sections";
import WorkspaceStatus from "@/components/workspace-status";
import { useWorkspaceState } from "@/lib/workspace";

export default function SettingsPage() {
  const workspace = useWorkspaceState("settings");

  return (
    <WorkspaceLayout
      currentPage="settings"
      description="Workspace settings for the fundraiser evaluation tool."
      stats={[
        {
          label: "Generation",
          value: workspace.platformStatus.openRouterConfigured ? "OpenRouter live" : "Mock mode",
        },
        { label: "Saved cases", value: workspace.testCases.length },
        { label: "Templates", value: workspace.promptTemplates.length },
        { label: "Runs", value: workspace.runs.length },
        { label: "Workspace", value: workspace.workspaceSaveState },
      ]}
      theme={workspace.theme}
      title="Settings · Eval AI"
      toggleTheme={workspace.toggleTheme}
    >
      <WorkspaceStatus workspace={workspace} />
      {!workspace.loading ? <SettingsSection {...workspace} /> : null}
    </WorkspaceLayout>
  );
}
