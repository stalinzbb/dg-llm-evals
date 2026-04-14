import { useRouter } from "next/router";
import { useEffect } from "react";

import WorkspaceLayout from "@/components/workspace-layout";
import WorkspaceStatus from "@/components/workspace-status";
import { BatchSection, HistorySection, PlaygroundSection } from "@/components/workspace-sections";
import { useWorkspaceState } from "@/lib/workspace";
import type { WorkspacePage } from "@/lib/types/domain";
import type { WorkspaceHomeProps } from "@/lib/types/workspace";

const VALID_PAGES: WorkspacePage[] = ["playground", "batches", "history"];

function normalizeWorkspacePage(value: string | undefined): WorkspacePage {
  if (typeof value !== "string") return "playground";
  return VALID_PAGES.includes(value as WorkspacePage) ? (value as WorkspacePage) : "playground";
}

function buildTabQuery(tab: WorkspacePage) {
  return tab === "playground" ? {} : { tab };
}

export function getInitialWorkspaceTab(queryValue?: string | string[]): WorkspacePage {
  return normalizeWorkspacePage(Array.isArray(queryValue) ? queryValue[0] : queryValue);
}

export default function WorkspaceHome({ initialTab = "playground" }: WorkspaceHomeProps) {
  const router = useRouter();
  const workspace = useWorkspaceState(initialTab);
  const activePage = normalizeWorkspacePage(workspace.activePage);
  const queryTab = getInitialWorkspaceTab(router.query.tab);

  useEffect(() => {
    if (!router.isReady || queryTab === workspace.activePage) {
      return;
    }
    workspace.setActivePage(queryTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryTab, router.isReady]);

  useEffect(() => {
    if (!router.isReady || activePage === queryTab) {
      return;
    }
    void router.replace({ pathname: "/", query: buildTabQuery(activePage) }, undefined, {
      shallow: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, router.isReady]);

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
      currentPage={activePage}
      description="Generate, compare, batch-run, and review fundraiser message evals from a unified workspace."
      onNavClick={(page: WorkspacePage) => workspace.setActivePage(page)}
      stats={stats}
      theme={workspace.theme}
      title="Eval AI Workspace"
      toggleTheme={workspace.toggleTheme}
    >
      <WorkspaceStatus workspace={workspace} />
      {!workspace.loading && activePage === "playground" && <PlaygroundSection {...workspace} />}
      {!workspace.loading && activePage === "batches" && <BatchSection {...workspace} />}
      {!workspace.loading && activePage === "history" && <HistorySection {...workspace} />}
    </WorkspaceLayout>
  );
}
