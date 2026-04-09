import WorkspaceHome, { getInitialWorkspaceTab } from "@/components/workspace-home";

export default function HomePage({ initialTab }) {
  return <WorkspaceHome initialTab={initialTab} />;
}

export async function getServerSideProps({ query }) {
  return {
    props: {
      initialTab: getInitialWorkspaceTab(query.tab),
    },
  };
}
