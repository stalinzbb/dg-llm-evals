import type {
  BatchSectionProps,
  HistorySectionProps,
  PlaygroundSectionProps,
  SettingsSectionProps,
} from "@/lib/types/workspace";

export function PlaygroundSection(props: PlaygroundSectionProps): JSX.Element;
export function BatchSection(props: BatchSectionProps): JSX.Element;
export function HistorySection(props: HistorySectionProps): JSX.Element;
export function SettingsSection(props: SettingsSectionProps): JSX.Element;
