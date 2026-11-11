export const ChartEnum = {
  CPU: "cpu",
  Memory: "memory",
  Load: "load",
  Network: "network",
} as const;
export type TChart = (typeof ChartEnum)[keyof typeof ChartEnum];
export type TChartVisibility = Record<TChart, boolean>;
export const DEFAULT_CHARTS: TChartVisibility = {
  cpu: true,
  memory: true,
  load: true,
  network: true,
};
export const CHART_OPTIONS = [
  { key: ChartEnum.CPU, label: "CPU" },
  { key: ChartEnum.Memory, label: "Память" },
  { key: ChartEnum.Load, label: "Нагрузка" },
  { key: ChartEnum.Network, label: "Сеть" },
] as const;
