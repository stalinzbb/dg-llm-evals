import WorkspaceLayout from "@/components/workspace-layout";
import { PlaygroundSection } from "@/components/workspace-sections";
import WorkspaceStatus from "@/components/workspace-status";
import { useWorkspaceState } from "@/lib/workspace";

export default function HomePage() {
  const workspace = useWorkspaceState("playground");

  return (
    <WorkspaceLayout
      currentPage="playground"
      description="Generate and compare fundraiser messages with a focused playground."
      stats={[
        {
          label: "Generation",
          value: workspace.platformStatus.openRouterConfigured ? "OpenRouter live" : "Mock mode",
        },
        { label: "Saved cases", value: workspace.testCases.length },
        { label: "Source pool", value: workspace.sourcePoolStats.total },
        { label: "Templates", value: workspace.promptTemplates.length },
        { label: "Storage", value: workspace.storageMode },
        { label: "Workspace", value: workspace.workspaceSaveState },
      ]}
      theme={workspace.theme}
      title="Playground · Eval AI"
      toggleTheme={workspace.toggleTheme}
    >
      <WorkspaceStatus workspace={workspace} />
      {!workspace.loading ? <PlaygroundSection {...workspace} /> : null}
    </WorkspaceLayout>
  );
}
