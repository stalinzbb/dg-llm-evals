import WorkspaceLayout from "@/components/workspace-layout";
import { HistorySection } from "@/components/workspace-sections";
import WorkspaceStatus from "@/components/workspace-status";
import { useWorkspaceState } from "@/lib/workspace";

export default function HistoryPage() {
  const workspace = useWorkspaceState("history");

  return (
    <WorkspaceLayout
      currentPage="history"
      description="Browse saved runs, reopen outputs, and review ratings history."
      stats={[
        {
          label: "Generation",
          value: workspace.platformStatus.openRouterConfigured ? "OpenRouter live" : "Mock mode",
        },
        { label: "Runs", value: workspace.runs.length },
        { label: "Saved cases", value: workspace.testCases.length },
        { label: "Storage", value: workspace.storageMode },
      ]}
      theme={workspace.theme}
      title="History · Eval AI"
      toggleTheme={workspace.toggleTheme}
    >
      <WorkspaceStatus workspace={workspace} />
      {!workspace.loading ? <HistorySection {...workspace} /> : null}
    </WorkspaceLayout>
  );
}
