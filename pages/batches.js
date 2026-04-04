import WorkspaceLayout from "@/components/workspace-layout";
import { BatchSection } from "@/components/workspace-sections";
import WorkspaceStatus from "@/components/workspace-status";
import { useWorkspaceState } from "@/lib/workspace";

export default function BatchesPage() {
  const workspace = useWorkspaceState("batches");

  return (
    <WorkspaceLayout
      currentPage="batches"
      description="Run batch evaluations across saved and imported fundraiser cases."
      stats={[
        {
          label: "Generation",
          value: workspace.platformStatus.openRouterConfigured ? "OpenRouter live" : "Mock mode",
        },
        { label: "Saved cases", value: workspace.testCases.length },
        { label: "Templates", value: workspace.promptTemplates.length },
        { label: "Runs", value: workspace.runs.length },
      ]}
      theme={workspace.theme}
      title="Batches · Signal Forge"
      toggleTheme={workspace.toggleTheme}
    >
      <WorkspaceStatus workspace={workspace} />
      {!workspace.loading ? <BatchSection {...workspace} /> : null}
    </WorkspaceLayout>
  );
}
