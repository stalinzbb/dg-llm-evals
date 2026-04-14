import WorkspaceLayout from "@/components/workspace-layout";
import { SettingsSection } from "@/components/workspace-sections";
import WorkspaceStatus from "@/components/workspace-status";
import { useWorkspaceState } from "@/lib/workspace";
import {
  getSettingsSectionProps,
  getWorkspaceStatsViewModel,
  getWorkspaceStatusViewModel,
} from "@/lib/workspace-view-models";

export default function SettingsPage() {
  const workspace = useWorkspaceState("settings");
  const workspaceStatus = getWorkspaceStatusViewModel(workspace);
  const stats = getWorkspaceStatsViewModel(workspace);
  const settingsSection = getSettingsSectionProps(workspace);

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
      <WorkspaceStatus workspace={workspaceStatus} />
      {!workspace.loading && <SettingsSection {...settingsSection} />}
    </WorkspaceLayout>
  );
}
