import WorkspaceHome, { getInitialWorkspaceTab } from "@/components/workspace-home";
import type { WorkspacePage } from "@/lib/types/domain";

export default function HomePage({ initialTab }: { initialTab: WorkspacePage }) {
  return <WorkspaceHome initialTab={initialTab} />;
}

export async function getServerSideProps({
  query,
}: {
  query: { tab?: string | string[] };
}) {
  return {
    props: {
      initialTab: getInitialWorkspaceTab(query.tab),
    },
  };
}
