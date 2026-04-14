import type { WorkspaceStatusViewModel } from "@/lib/types/workspace";

export interface WorkspaceStatusProps {
  workspace: WorkspaceStatusViewModel;
}

export default function WorkspaceStatus(props: WorkspaceStatusProps): JSX.Element | null;
