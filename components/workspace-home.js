import { useRouter } from "next/router";
import { useEffect } from "react";

import WorkspaceLayout from "@/components/workspace-layout";
import WorkspaceStatus from "@/components/workspace-status";
import { BatchSection, HistorySection, PlaygroundSection } from "@/components/workspace-sections";
import { useWorkspaceState } from "@/lib/workspace";

const VALID_PAGES = ["playground", "batches", "history"];

function normalizeWorkspacePage(value) {
  if (typeof value !== "string") return "playground";
  return VALID_PAGES.includes(value) ? value : "playground";
}

function buildTabQuery(tab) {
  return tab === "playground" ? {} : { tab };
}

export function getInitialWorkspaceTab(queryValue) {
  return normalizeWorkspacePage(Array.isArray(queryValue) ? queryValue[0] : queryValue);
}

export default function WorkspaceHome({ initialTab = "playground" }) {
  const router = useRouter();
  const workspace = useWorkspaceState(initialTab);
  const activePage = normalizeWorkspacePage(workspace.activePage);
  const queryTab = getInitialWorkspaceTab(router.query.tab);

  // Sync URL → state. Intentionally excludes workspace from deps: this effect should
  // only fire when the URL changes, not on every workspace state update.
  useEffect(() => {
    if (!router.isReady || queryTab === workspace.activePage) {
      return;
    }
    workspace.setActivePage(queryTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryTab, router.isReady]);

  // Sync state → URL. Intentionally excludes queryTab and router from deps: this
  // effect should only fire when activePage changes, not on every router update.
  useEffect(() => {
    if (!router.isReady || activePage === queryTab) {
      return;
    }
    router.replace(
      { pathname: "/", query: buildTabQuery(activePage) },
      undefined,
      { shallow: true },
    );
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
      onNavClick={(page) => workspace.setActivePage(page)}
      stats={stats}
      theme={workspace.theme}
      title="Eval AI Workspace"
      toggleTheme={workspace.toggleTheme}
    >
      <WorkspaceStatus workspace={workspace} />
      {!workspace.loading && activePage === "playground" && (
        <PlaygroundSection {...workspace} />
      )}
      {!workspace.loading && activePage === "batches" && (
        <BatchSection {...workspace} />
      )}
      {!workspace.loading && activePage === "history" && (
        <HistorySection {...workspace} />
      )}
    </WorkspaceLayout>
  );
}
